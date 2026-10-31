/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  convertBogRoomPosToUnifiedPx,
  DIR_VECTORS,
  getEffectiveRoomCoord,
  getRoomDimensions,
  getUnifiedBogRoomPlacement,
  isCheatModeActive,
  TILE_SIZE,
} from '../../constants';
import {
  getWeaponDefinition,
  WEAPON_REGISTRY,
} from '../../database/equipment/weapons';
import {
  ACTION_MODIFICATION_CATALOG,
  GEMSTONE_CATALOG,
  refundInventoryGem,
  unlockEquipmentItem,
  unlockLevel2SecondaryWeapon,
} from '../../database/progression';
import {
  AREA_REGISTRY,
  getAreaDefinition,
  getBiomeDefinition,
  getTileDefinition,
  WAYGATE_REGISTRY,
  WAYSTATION_REGISTRY,
} from '../../database/world';
import { OrionCombatContext, OrionState } from '../../types';
import { spawnEnemyByType, spawnRoomEnemies } from '../entitySystem';
import {
  addOrionInventoryItem,
  getTutorialPromptOverride,
  notifyOrionStateChange,
  saveOrionGame,
  setOrionFlag,
  syncStateGates,
} from '../playerSystem';
import { ORION_CACHE_DEFINITIONS, ORION_TUTORIAL_ROOMS } from './roomLoader';
import {
  evaluateCathedralDoorStatus,
  isRoomCacheLooted,
  markRoomCacheLooted,
  resolveContextualEquipmentDrop,
} from './worldPersistence';
import {
  enterOffPathFogLoopDungeon,
  fastTravelToWaystation,
  fastTravelViaWaygate,
  resetAetherFogGraph,
  syncRoomHierarchyState,
} from './worldTransitions';
import {
  checkAndUnlockClearedDeepFogDungeon,
  computeChunkFogMetrics,
  fastTravelFromDeepDungeonToSafeSpot,
  hibernateAllActiveExpanseEnemies,
  isChunkedExpanseRoom,
  SUNKEN_BOG_EXPANSE_ROOM_ID,
  updateChunkedRoomStreaming,
} from './chunkStreamingSystem';

// ─── ENVIRONMENTAL HAZARDS, ORC RAIDS, TRIALS & INTERACTIVE PROMPTS ──────────

let corrosionParticleTimer = 0;

export function updateEnvironmentalHazards(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  const roomData = rooms[state.room];
  if (!roomData) return;

  const biome = getBiomeDefinition(state.biomeId);
  const loopDepth = state.fogGraph?.loopDepth || 0;
  const isBiomeCorrosive = Boolean(biome.tileRules?.corrosiveWater);
  const baseCorrosionRate = biome.tileRules?.corrosiveDamagePerSec ?? 5.0;
  const corrosionRate = baseCorrosionRate * (1 + loopDepth * 0.25);

  corrosionParticleTimer -= dt;
  let spawnedCorrosionParticle = false;

  if (isBiomeCorrosive && state.z <= 0 && !state.isFallingIntoPit) {
    const ptx = Math.floor(state.x / TILE_SIZE);
    const pty = Math.floor(state.y / TILE_SIZE);
    const pChar = roomData[pty]?.[ptx] || '.';
    const pTile = getTileDefinition(pChar, state.biomeId);

    if (pTile.isCorrosive && state.armor.durability > 0) {
      state.armor.durability = Math.max(0, state.armor.durability - corrosionRate * dt);
      if (corrosionParticleTimer <= 0) {
        ctx.spawnParticles(state.x, state.y, 4, 2, '#84cc16', 'CORROSION');
        spawnedCorrosionParticle = true;
      }
    }
  }

  if (isBiomeCorrosive) {
    for (const e of state.enemies) {
      if (e.z > 2 || e.isFlying) continue;
      if (e.type === 'bog_wurm' || e.type === 'lady_of_the_lake') continue;

      const etx = Math.floor(e.x / TILE_SIZE);
      const ety = Math.floor(e.y / TILE_SIZE);
      const eChar = roomData[ety]?.[etx] || '.';
      const eTile = getTileDefinition(eChar, state.biomeId);

      if (eTile.isCorrosive && e.armor.durability > 0) {
        e.armor.durability = Math.max(0, e.armor.durability - (corrosionRate + 1.5) * dt);
        if (corrosionParticleTimer <= 0) {
          ctx.spawnParticles(e.x, e.y, 4, 2, '#a3e635', 'ARMOR CORRODED');
          spawnedCorrosionParticle = true;
        }
      }
    }
  }

  if (spawnedCorrosionParticle) {
    corrosionParticleTimer = 0.75;
  }
}

export function awakenLadyOfTheLake(state: OrionState, ctx?: OrionCombatContext): boolean {
  state.flags = state.flags || {};
  const existing = state.enemies.some((e) => e.type === 'lady_of_the_lake');
  if (existing) return false;

  if (isChunkedExpanseRoom(state.room)) {
    const effRoom = getEffectiveRoomCoord(state);
    const spawnPos =
      effRoom === '2,1'
        ? convertBogRoomPosToUnifiedPx('2,1', 128, 90, 16, 12)
        : { x: Math.round(state.x), y: Math.max(48, Math.round(state.y - 24)) };
    spawnEnemyByType(state, 'lady_of_the_lake', spawnPos.x, spawnPos.y);
  } else {
    const { widthPx, heightPx } = getRoomDimensions(ORION_TUTORIAL_ROOMS[state.room]);
    spawnEnemyByType(
      state,
      'lady_of_the_lake',
      Math.round(widthPx * 0.5),
      Math.round(heightPx * 0.45)
    );
  }
  soundSystem.playPowerup();
  const msg = 'THE WATER ANSWERS BEDIVERE’S LIST — LADY OF THE LAKE AWAKENED!';
  if (ctx) {
    ctx.say(msg);
  } else {
    state.toastText = msg;
    state.toastTimer = 3.2;
  }
  notifyOrionStateChange();
  return true;
}

export function checkWorldInteractivePrompt(
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  state.flags = state.flags || {};
  if (state.contextMenu) {
    state.promptText = null;
    return;
  }

  const tx = Math.floor(state.x / TILE_SIZE);
  const ty = Math.floor(state.y / TILE_SIZE);

  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
  const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);

  const roomData = rooms[state.room];
  if (!roomData) {
    state.promptText = null;
    return;
  }

  const currentTile = roomData[ty]?.[tx] || '.';
  const facingTile = roomData[ay]?.[ax] || '.';
  const effectiveRoom = getEffectiveRoomCoord(state);

  const nearScout = currentTile === 'S' || facingTile === 'S';
  const scoutKey = `scout:${effectiveRoom}`;
  if (
    !nearScout &&
    state.lootedCaches[scoutKey] &&
    state.flags.bedivere_ring_choice === 'pending'
  ) {
    state.flags.bedivere_ring_choice = 'left';
    state.toastText = "LEFT BEDIVERE'S SIGNET RING BEHIND";
    state.toastTimer = 2.2;
    notifyOrionStateChange();
  }

  let candidateKey: string | null = null;
  let candidateText: string | null = null;

  const nearbyPoe = state.enemies.find(
    (e) => e.type === 'bog_poe' && Math.hypot(e.x - state.x, e.y - state.y) < 26
  );
  const nearbyCalmNpc = state.enemies.find(
    (e) =>
      e.type === 'town_npc' &&
      e.npcDisposition !== 'feral' &&
      Math.hypot(e.x - state.x, e.y - state.y) < 24
  );

  if (nearbyPoe) {
    candidateKey = `${effectiveRoom}:poe:${state.flags.campfire_unlocked ? 'unlocked' : 'locked'}`;
    candidateText = !state.flags.campfire_unlocked
      ? '[A] TALK TO POE (UNLOCK CAMPFIRES)'
      : state.flags.poe_state !== 'helped'
        ? '[A] HELP THE POE'
        : '[A] SPEAK WITH THE POE';
  } else if ((facingTile === 'L' || currentTile === 'L') && isCheatModeActive(state)) {
    candidateKey = `${effectiveRoom}:lantern:cheat`;
    candidateText =
      state.flags.poe_state === 'helped'
        ? '[A] TOGGLE POE LANTERN (CHEAT)'
        : '[A] LIGHT POE LANTERN (CHEAT)';
  } else if (nearbyCalmNpc) {
    candidateKey = `${effectiveRoom}:npc:${nearbyCalmNpc.id}`;
    candidateText = nearbyCalmNpc.isLoyalist
      ? '[A] SPEAK WITH LOYALIST'
      : '[A] TRADE (15 SCRAP)';
  } else if (currentTile === 'D' || facingTile === 'D') {
    if (isChunkedExpanseRoom(state.room)) {
      checkAndUnlockClearedDeepFogDungeon(rooms, state);
      const fogMetrics = computeChunkFogMetrics(state);
      if (fogMetrics.hasDeepDungeon) {
        candidateKey = `${fogMetrics.chunkKey}:D:${fogMetrics.isDeepDungeonCleared ? 'clear' : 'loop'}`;
        candidateText = fogMetrics.isDeepDungeonCleared
          ? '[A] CLAIM DUNGEON REWARD & FAST-TRAVEL TO SAFE PATH'
          : '[A] ENTER ABYSSAL FOG LOOP DUNGEON (CLEAR FOR FAST-TRAVEL)';
      } else {
        candidateKey = `${effectiveRoom}:D`;
        candidateText = '[A] ENTER DROP-POD CHEAT ROOM';
      }
    } else {
      candidateKey = `${state.room}:D`;
      candidateText =
        state.room === '-4,0'
          ? '[A] EXIT CHEAT ROOM -> DROP-POD CRATER'
          : '[A] ENTER DROP-POD CHEAT ROOM';
    }
  } else if (currentTile === 'A' || facingTile === 'A') {
    const isUnlocked = Boolean(
      state.flags.campfire_unlocked ||
        state.flags.poe_state === 'helped' ||
        state.bypassProgressionGates
    );
    const isFirstLit = Boolean(state.flags.first_campfire_lit);
    candidateKey = `${effectiveRoom}:A:${isUnlocked ? 'u' : 'l'}:${isFirstLit ? 'lit' : 'unlit'}`;
    if (effectiveRoom === '0,0' && !isUnlocked) {
      candidateText = '[A] CAMPFIRE UNLIT (SPEAK TO POE)';
    } else if (effectiveRoom === '0,0' && !isFirstLit) {
      candidateText = '[A] LIGHT FIRST CAMPFIRE';
    } else {
      const wsCount = (state.discoveredWaystations || []).filter(
        (id) => id !== 'ws_bog_drop_pod'
      ).length;
      candidateText =
        wsCount > 1
          ? `[A] REST AT CAMPFIRE · TRANSIT (${wsCount} LIT)`
          : '[A] REST AT CAMPFIRE';
    }
  } else if (currentTile === 'Q' || facingTile === 'Q') {
    candidateKey = `${effectiveRoom}:Q`;
    if (state.room === '-3,0' || state.room === '-4,0') {
      candidateText = '[A] ENTER UNIFIED BOG GRID (26×18 CHUNKS)';
    } else if (state.room === SUNKEN_BOG_EXPANSE_ROOM_ID) {
      const fogMetrics = computeChunkFogMetrics(state);
      if (fogMetrics.hasDeepDungeon && fogMetrics.isDeepDungeonCleared) {
        const safeTitle = state.lastSafeChunkCoord?.title || 'SAFE PATH';
        candidateText = `[A] FAST-TRAVEL TO ${safeTitle.toUpperCase()}`;
      } else {
        candidateText = '[A] WAYGATE TRANSIT (CAMPFIRE / POE LANTERN / EXIT GATE)';
      }
    } else {
      candidateText = '[A] STEP INTO WAYGATE';
    }
  } else if (nearScout) {
    candidateKey = `${effectiveRoom}:${scoutKey}:${state.flags.bedivere_ring_choice || 'none'}`;
    const tutorialOverride = getTutorialPromptOverride(state, 'S');
    if (!state.lootedCaches[scoutKey]) {
      candidateText = tutorialOverride || '[A] EXAMINE FALLEN KNIGHT';
    } else if (
      !state.flags.bedivere_ring_choice ||
      state.flags.bedivere_ring_choice === 'pending'
    ) {
      candidateText = '[A] TAKE SIGNET RING';
    } else {
      candidateText = null;
    }
  } else if (
    facingTile === 'C' ||
    facingTile === 'V' ||
    currentTile === 'C' ||
    currentTile === 'V'
  ) {
    const isFacingCache = facingTile === 'C' || facingTile === 'V';
    const cx = isFacingCache ? ax : tx;
    const cy = isFacingCache ? ay : ty;
    const tileChar = isFacingCache ? facingTile : currentTile;
    const isChest = tileChar === 'V';
    const looted = isRoomCacheLooted(state, cx, cy);
    candidateKey = `${state.room}:cache:${cx},${cy}:${looted ? 'empty' : 'full'}`;
    if (!looted) {
      candidateText = isChest ? '[A] OPEN CHEST' : '[A] SEARCH CACHE';
    } else {
      candidateText = null;
    }
  } else if (facingTile === '1' || facingTile === '2' || facingTile === '3') {
    if (state.room === '-4,0') {
      candidateKey = `cheat_term:${facingTile}`;
      candidateText =
        facingTile === '1'
          ? `[A] TERMINAL 1: TOGGLE CHEAT MODE (${state.bypassProgressionGates ? 'ON' : 'OFF'})`
          : facingTile === '2'
            ? '[A] TERMINAL 2: UNLOCK ALL WEAPONS & MODS'
            : '[A] TERMINAL 3: GRANT +5 ALL GEMS & +200 SCRAP';
    } else {
      const switchKey = `switch:${effectiveRoom}:${facingTile}`;
      candidateKey = switchKey;
      candidateText = state.lootedCaches[switchKey] ? null : '[A] PULL SWITCH';
    }
  } else if (facingTile === '!' || currentTile === '!') {
    if (state.room === '-4,0') {
      candidateKey = 'cheat_term:warp';
      candidateText = '[A] TERMINAL 4: WARP TO BOG / CAMPFIRE / LANTERN / TOWN';
    } else {
      const lx = facingTile === '!' ? ax : tx;
      const ly = facingTile === '!' ? ay : ty;
      const toggleKey = `switch:${state.room}:toggle:${lx},${ly}`;
      candidateKey = `${toggleKey}:${state.lootedCaches[toggleKey] ? 'on' : 'off'}`;
      candidateText = '[A] PULL LEVER';
    }
  } else if (facingTile === 'G' || currentTile === 'G') {
    if (state.flags.orc_raid_active) {
      candidateKey = `${effectiveRoom}:gate:raid`;
      candidateText = 'GATE SEALED';
    } else if (!state.unlockedGates[effectiveRoom] && !state.unlockedGates[state.room]) {
      candidateKey = `${effectiveRoom}:gate`;
      const hasKey = state.inventorySlots.some((s) => s.itemId === 'rusted_gate_key');
      const poeResolved = Boolean(state.flags.bog_exit_revealed);
      candidateText = hasKey || poeResolved ? '[A] UNSEAL GATE' : 'GATE SEALED';
    }
  } else if (facingTile === 'M' || currentTile === 'M') {
    if (!state.flags.cathedral_door_open) {
      candidateKey = `${state.room}:cathedral_door`;
      const status = evaluateCathedralDoorStatus(state);
      candidateText = status.canOpen
        ? '[A] OPEN DUNGEON DOOR'
        : 'DUNGEON DOOR SEALED';
    }
  } else if (
    (currentTile === '~' || facingTile === '~') &&
    Number(state.flags.bedivere_list_items || 0) >= 3 &&
    !state.flags.lady_of_the_lake_defeated &&
    !state.enemies.some((e) => e.type === 'lady_of_the_lake')
  ) {
    candidateKey = `${effectiveRoom}:lady_of_the_lake`;
    candidateText = '[A] DISTURB THE BOG WATERS';
  }

  if (candidateKey && candidateText) {
    const cleanPrompt = candidateText.replace(/^\[A\]\s*/i, '');
    if (state.dismissedPromptKey === candidateKey) {
      state.promptText = null;
      return;
    }
    const prevKey = state.flags.__active_prompt_key;
    if (prevKey !== candidateKey) {
      state.flags.__active_prompt_key = candidateKey;
      state.flags.__active_prompt_t = state.t;
    }
    const elapsed = state.t - Number(state.flags.__active_prompt_t || state.t);
    if (elapsed > 2.6) {
      state.promptText = null;
    } else {
      state.promptText = cleanPrompt;
    }
  } else {
    state.promptText = null;
    state.dismissedPromptKey = null;
    if (state.flags.__active_prompt_key) {
      state.flags.__active_prompt_key = '';
    }
  }
}

const HEALTH_CONSUMABLE_IDS = new Set([
  'demantoid_flask',
  'grail_water',
  'spinel_flask',
  'kyanite_flask',
]);

export function performDirectWorldInteraction(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  targetOverride?: { tx?: number; ty?: number }
): boolean {
  state.flags = state.flags || {};
  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const ax =
    targetOverride?.tx !== undefined
      ? targetOverride.tx
      : Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
  const ay =
    targetOverride?.ty !== undefined
      ? targetOverride.ty
      : Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);
  const tx = Math.floor(state.x / TILE_SIZE);
  const ty = Math.floor(state.y / TILE_SIZE);

  const roomData = rooms[state.room];
  if (!roomData) return false;

  const currentTile = roomData[ty]?.[tx] || '.';
  const facingTile = roomData[ay]?.[ax] || '.';
  const effectiveRoom = getEffectiveRoomCoord(state);

  const nearbyPoe = state.enemies.find(
    (e) => e.type === 'bog_poe' && Math.hypot(e.x - state.x, e.y - state.y) < 26
  );

  // Talking / Helping the Poe unlocks Campfire attunement and activates passive Poe Lamp guidance
  if (nearbyPoe) {
    const wasAlreadyHelped = state.flags.poe_state === 'helped' && Boolean(state.flags.campfire_unlocked);
    state.flags.poe_state = 'helped';
    state.flags.campfire_unlocked = true;
    state.flags.poe_lantern_gift = true;
    state.flags.bog_exit_revealed = true;
    if (state.level < 2) {
      state.level = 2;
    }
    unlockLevel2SecondaryWeapon(state);
    for (const e of state.enemies) {
      if (e.type === 'bog_wurm') e.isSubmerged = false;
    }
    syncStateGates(state);
    soundSystem.playPowerup();
    ctx.say(
      wasAlreadyHelped
        ? state.flags.first_campfire_lit
          ? 'POE: "THE HEARTH BURNS WARM, PILOT. FOLLOW THE LANTERN GLOW THROUGH THE MIST."'
          : 'POE: "KINDLE THE FIRST CAMPFIRE IN THIS CLEARING SO WE MAY BASK IN ITS LIGHT."'
        : 'SPOKE WITH THE POE · CAMPFIRE ATTUNEMENT & PASSIVE LANTERN GUIDANCE UNLOCKED!'
    );
    notifyOrionStateChange();
    return true;
  }

  // Poe Lamp ('L') is only interactable in Cheat Mode
  if ((facingTile === 'L' || currentTile === 'L') && isCheatModeActive(state)) {
    const nextHelped = state.flags.poe_state !== 'helped';
    state.flags.poe_state = nextHelped ? 'helped' : 'unmet';
    state.flags.poe_lantern_gift = nextHelped;
    if (nextHelped) {
      state.flags.campfire_unlocked = true;
      state.flags.bog_exit_revealed = true;
      if (state.level < 2) {
        state.level = 2;
      }
      unlockLevel2SecondaryWeapon(state);
      for (const e of state.enemies) {
        if (e.type === 'bog_wurm') e.isSubmerged = false;
      }
    }
    syncStateGates(state);
    soundSystem.playPowerup();
    ctx.say(
      nextHelped
        ? 'CHEAT MODE: POE LANTERN LIT · PASSIVE LAMP HELP ACTIVE'
        : 'CHEAT MODE: POE LANTERN EXTINGUISHED'
    );
    notifyOrionStateChange();
    return true;
  }

  const nearbyCalmNpc = state.enemies.find(
    (e) =>
      e.type === 'town_npc' &&
      e.npcDisposition !== 'feral' &&
      Math.hypot(e.x - state.x, e.y - state.y) < 24
  );
  if (nearbyCalmNpc) {
    if (nearbyCalmNpc.isLoyalist) {
      if (state.flags.bedivere_ring_choice === 'taken') {
        nearbyCalmNpc.npcDisposition = 'feral';
        nearbyCalmNpc.faction = 'hostile';
        soundSystem.playMenuBeep();
        ctx.say('LOYALIST: "YOU ROBBED BEDIVERE’S CORPSE! DIE, GRAVE ROBBER!"');
      } else {
        soundSystem.playSelect();
        if (!state.lootedCaches[`npc_gift:${nearbyCalmNpc.id}`]) {
          state.lootedCaches[`npc_gift:${nearbyCalmNpc.id}`] = true;
          addOrionInventoryItem(state, 'demantoid_flask', 1);
          const giftedHeater = unlockEquipmentItem(state, 'heater_shield');
          ctx.say(
            giftedHeater
              ? 'LOYALIST: "YOU HONORED BEDIVERE. TAKE THIS HEATER SHIELD & DEMANTOID FLASK!"'
              : 'LOYALIST: "YOU HONORED BEDIVERE. TAKE THIS DEMANTOID FLASK."'
          );
        } else {
          ctx.say('LOYALIST: "MAY AVALON GUARD YOUR CHASSIS, PILOT."');
        }
      }
    } else {
      if (state.salvageScrap >= 15) {
        state.salvageScrap -= 15;
        addOrionInventoryItem(state, 'demantoid_flask', 1);
        const nextGear = resolveContextualEquipmentDrop(state, {
          areaId: state.areaId,
          regionId: state.regionId,
          roomCoord: effectiveRoom,
          allowSecondCopy: true,
        });
        if (nextGear) {
          const wasFirstCopy = unlockEquipmentItem(state, nextGear);
          const gName = getWeaponDefinition(nextGear)?.name || nextGear.toUpperCase();
          soundSystem.playPowerup();
          ctx.say(
            wasFirstCopy
              ? `TRADED 15 SCRAP: DEMANTOID FLASK + SALVAGED ${gName.toUpperCase()} UNLOCKED!`
              : `TRADED 15 SCRAP: DEMANTOID FLASK + 2ND COPY OF ${gName.toUpperCase()} (PAIRED STANCE)!`
          );
        } else {
          soundSystem.playCoin();
          ctx.say('TRADED 15 SCRAP FOR DEMANTOID REPAIR FLASK');
        }
      } else {
        soundSystem.playMenuBeep();
        ctx.say('SCAVENGER: "15 SCRAP FOR A DEMANTOID FLASK & SALVAGED HARDPOINT GEAR, PILOT."');
      }
    }
    notifyOrionStateChange();
    return true;
  }

  if (currentTile === 'D' || facingTile === 'D') {
    if (isChunkedExpanseRoom(state.room)) {
      checkAndUnlockClearedDeepFogDungeon(rooms, state);
      const fogMetrics = computeChunkFogMetrics(state);
      if (fogMetrics.hasDeepDungeon) {
        if (!fogMetrics.isDeepDungeonCleared) {
          return enterOffPathFogLoopDungeon(
            rooms,
            state,
            fogMetrics.chunkKey,
            fogMetrics.cx,
            fogMetrics.cy,
            ctx
          );
        }
        return fastTravelFromDeepDungeonToSafeSpot(rooms, state, ctx);
      }
    }

    if (state.room === '-4,0') {
      const craterPos = convertBogRoomPosToUnifiedPx('-3,0', 120, 88, 16, 12);
      state.room = SUNKEN_BOG_EXPANSE_ROOM_ID;
      state.rx = -3;
      state.ry = 0;
      state.x = craterPos.x;
      state.y = craterPos.y;
      state.z = 0;
      state.vz = 0;
      state.projectiles = [];
      state.pickups = [];
      syncRoomHierarchyState(state);
      updateChunkedRoomStreaming(rooms, state, true);
      soundSystem.playSelect();
      ctx.say('EXITED DROP-POD CHEAT ROOM -> UNIFIED BOG GRID [-3,0]');
      notifyOrionStateChange();
      return true;
    } else {
      if (isChunkedExpanseRoom(state.room)) {
        hibernateAllActiveExpanseEnemies(state);
      }
      state.room = '-4,0';
      state.rx = -4;
      state.ry = 0;
      state.x = 96;
      state.y = 120;
      state.z = 0;
      state.vz = 0;
      state.projectiles = [];
      state.pickups = [];
      state.enemies = [];
      syncRoomHierarchyState(state);
      soundSystem.playPowerup();
      ctx.say('ENTERED DROP-POD CHEAT ROOM · DEV CONSOLES & SATCHEL UNLOCKED');
      notifyOrionStateChange();
      return true;
    }
  }

  if (currentTile === 'A' || facingTile === 'A') {
    const canUseCampfire = Boolean(
      state.flags.campfire_unlocked ||
        state.flags.poe_state === 'helped' ||
        state.bypassProgressionGates
    );
    if (effectiveRoom === '0,0' && !canUseCampfire) {
      soundSystem.playMenuBeep();
      ctx.say('CAMPFIRE COLD — SPEAK TO THE POE TUCKED BEHIND THE NORTHERN TREES FIRST!');
      notifyOrionStateChange();
      return true;
    }

    const wasFirstCampfireUnlit = !state.flags.first_campfire_lit;
    state.flags.campfire_unlocked = true;
    state.flags.first_campfire_lit = true;

    syncRoomHierarchyState(state);
    const areaDef = getAreaDefinition(state.areaId);
    const currentWsId = areaDef.waystation?.id;
    state.discoveredWaystations = (state.discoveredWaystations || []).filter(
      (id) => id !== 'ws_bog_drop_pod'
    );
    if (currentWsId && !state.discoveredWaystations.includes(currentWsId)) {
      state.discoveredWaystations.push(currentWsId);
    }

    resetAetherFogGraph(rooms, state);

    state.spawnAnchor = {
      areaId: state.areaId,
      room: state.room,
      x: Math.round(state.x),
      y: Math.round(state.y),
    };
    state.frame.integrity = state.frame.maxIntegrity || 200;
    state.frame.state = 'Operational';
    state.armor.durability = state.armor.maxDurability;
    state.shields.capacity = state.shields.maxCapacity;
    state.shields.overloaded = false;
    state.heat = 0;
    state.ammo = state.maxAmmo;
    state.isReloading = false;
    saveOrionGame(state);

    const discovered = state.discoveredWaystations.filter((wsId) => {
      const wsNode = WAYSTATION_REGISTRY[wsId];
      const wsArea = wsNode ? AREA_REGISTRY[wsNode.areaId] : undefined;
      return wsArea?.specStatus !== 'UNDEFINED';
    });
    if (!wasFirstCampfireUnlit && discovered.length > 1 && currentWsId) {
      const idx = discovered.indexOf(currentWsId);
      const nextWsId = discovered[(idx + 1) % discovered.length];
      if (nextWsId && nextWsId !== currentWsId) {
        return fastTravelToWaystation(rooms, state, nextWsId, ctx);
      }
    }

    state.spawnGraceTimer = 3.0;
    if (isChunkedExpanseRoom(state.room)) {
      updateChunkedRoomStreaming(rooms, state, true);
    } else {
      spawnRoomEnemies(rooms, state);
    }
    soundSystem.playHeal();
    ctx.say(
      wasFirstCampfireUnlit && effectiveRoom === '0,0'
        ? 'FIRST CAMPFIRE LIT · POE DRAWN TO FIRELIGHT & EASTERN PATH UNSEALED!'
        : `RESTED AT ${areaDef.waystation?.name?.toUpperCase() || 'CAMPFIRE'} · SPAWN MOVED`
    );
    notifyOrionStateChange();
    return true;
  }

  if (currentTile === 'Q' || facingTile === 'Q') {
    if (state.room === '-3,0' || state.room === '-4,0') {
      resetAetherFogGraph(rooms, state);
      state.frame.integrity = state.frame.maxIntegrity || 200;
      state.frame.state = 'Operational';
      state.armor.durability = state.armor.maxDurability;
      state.shields.capacity = state.shields.maxCapacity;
      state.shields.overloaded = false;
      state.heat = 0;

      const craterPos = convertBogRoomPosToUnifiedPx('-3,0', 136, 84, 16, 12);
      state.room = SUNKEN_BOG_EXPANSE_ROOM_ID;
      state.rx = -3;
      state.ry = 0;
      state.x = craterPos.x;
      state.y = craterPos.y;
      state.z = 0;
      state.vz = 0;
      state.vx = 0;
      state.vy = 0;
      state.projectiles = [];
      state.pickups = [];
      state.enemies = [];
      state.flickerTimer = 0.6;
      state.spawnGraceTimer = 3.0;

      syncRoomHierarchyState(state);
      updateChunkedRoomStreaming(rooms, state, true);
      soundSystem.playPowerup();
      ctx.say('WAYGATE TRANSIT -> UNIFIED BOG GRID (26×18 CHUNKS · SET-PATH SPINE)');
      notifyOrionStateChange();
      return true;
    }

    if (state.room === SUNKEN_BOG_EXPANSE_ROOM_ID) {
      const fogMetrics = computeChunkFogMetrics(state);
      if (fogMetrics.hasDeepDungeon && fogMetrics.isDeepDungeonCleared) {
        return fastTravelFromDeepDungeonToSafeSpot(rooms, state, ctx);
      }

      const bogWaygateStops = [
        { room: '0,0', localX: 128, localY: 88, label: 'FIRST CAMPFIRE SANCTUARY [0,0]' },
        { room: '0,-2', localX: 128, localY: 88, label: 'POE LANTERN CLEARING [0,-2]' },
        { room: '3,0', localX: 120, localY: 96, label: 'MAIN BOG EXIT GATE [3,0]' },
        { room: '-3,0', localX: 136, localY: 84, label: 'DROP-POD IMPACT CRATER [-3,0]' },
      ];
      const nextStopIdx = Number(state.flags.bog_waygate_idx || 0) % bogWaygateStops.length;
      state.flags.bog_waygate_idx = nextStopIdx + 1;
      const stop = bogWaygateStops[nextStopIdx];
      const placement = getUnifiedBogRoomPlacement(stop.room)!;
      const unifiedPos = convertBogRoomPosToUnifiedPx(
        stop.room,
        stop.localX,
        stop.localY,
        stop.room === '3,0' ? 20 : 16,
        stop.room === '3,0' ? 15 : 12
      );

      resetAetherFogGraph(rooms, state);
      state.frame.integrity = state.frame.maxIntegrity || 200;
      state.frame.state = 'Operational';
      state.armor.durability = state.armor.maxDurability;
      state.shields.capacity = state.shields.maxCapacity;
      state.shields.overloaded = false;
      state.heat = 0;

      state.rx = placement.rx;
      state.ry = placement.ry;
      state.x = unifiedPos.x;
      state.y = unifiedPos.y;
      state.z = 0;
      state.vz = 0;
      state.vx = 0;
      state.vy = 0;
      state.projectiles = [];
      state.pickups = [];
      state.flickerTimer = 0.5;
      state.spawnGraceTimer = 3.0;

      syncRoomHierarchyState(state);
      updateChunkedRoomStreaming(rooms, state, true);
      soundSystem.playPowerup();
      ctx.say(`WAYGATE TRANSIT -> ${stop.label}`);
      notifyOrionStateChange();
      return true;
    }

    syncRoomHierarchyState(state);
    const allWaygates = Object.values(WAYGATE_REGISTRY);
    for (const wg of allWaygates) {
      if (!state.discoveredWaygates?.includes(wg.id)) {
        state.discoveredWaygates = [...(state.discoveredWaygates || []), wg.id];
      }
    }
    const targetWaygateId =
      state.regionId === 'region_tyrranus_frontier'
        ? 'wg_camelot_sanctum'
        : 'wg_tyrranus_colonnade';
    return fastTravelViaWaygate(rooms, state, targetWaygateId, ctx);
  }

  if (facingTile === 'S' || currentTile === 'S') {
    const scoutKey = `scout:${effectiveRoom}`;
    if (!state.lootedCaches[scoutKey]) {
      state.lootedCaches[scoutKey] = true;
      state.hasBoosterKit = true;
      if (state.level < 2) {
        state.level = 2;
      }
      unlockLevel2SecondaryWeapon(state);
      unlockEquipmentItem(state, 'khopesh');
      addOrionInventoryItem(state, 'bedivere_list', 1);
      addOrionInventoryItem(state, 'demantoid_flask', 1);
      setOrionFlag(state, 'scout_salvaged', true);
      state.flags.bedivere_list_collected = true;
      state.flags.bedivere_ring_choice = 'pending';
      if (state.tutorialActive) {
        state.tutorialStep = 'traverse_sinkhole';
      }
      syncStateGates(state);
      soundSystem.playPowerup();
      ctx.say('SALVAGED KHOPESH & BEDIVERE’S LIST');
      notifyOrionStateChange();
      return true;
    } else if (state.flags.bedivere_ring_choice === 'pending') {
      state.flags.bedivere_ring_choice = 'taken';
      addOrionInventoryItem(state, 'bedivere_ring', 1);
      soundSystem.playCoin();
      ctx.say("TOOK BEDIVERE'S SIGNET RING");
      notifyOrionStateChange();
      return true;
    }
  }

  if (
    facingTile === 'C' ||
    facingTile === 'V' ||
    currentTile === 'C' ||
    currentTile === 'V'
  ) {
    const isFacingCache = facingTile === 'C' || facingTile === 'V';
    const cx = targetOverride?.tx !== undefined ? targetOverride.tx : isFacingCache ? ax : tx;
    const cy = targetOverride?.ty !== undefined ? targetOverride.ty : isFacingCache ? ay : ty;
    const targetChar = roomData[cy]?.[cx] || (isFacingCache ? facingTile : currentTile);
    const isChest = targetChar === 'V';

    if (!isRoomCacheLooted(state, cx, cy)) {
      markRoomCacheLooted(state, cx, cy);
      soundSystem.playPowerup();

      const cacheDef =
        ORION_CACHE_DEFINITIONS[effectiveRoom] ||
        ORION_CACHE_DEFINITIONS[state.room] ||
        ORION_CACHE_DEFINITIONS.default;
      const fogMetrics = isChunkedExpanseRoom(state.room)
        ? computeChunkFogMetrics(state)
        : null;
      const lootMult = fogMetrics ? fogMetrics.lootMultiplier : 1;
      const earnedScrap = Math.round(cacheDef.scrap * lootMult);
      state.salvageScrap += earnedScrap;

      // Chests ('V') never drop health/repair flasks; only Caches ('C') drop consumable flasks
      for (const item of cacheDef.items) {
        if (isChest && HEALTH_CONSUMABLE_IDS.has(item.itemId)) {
          continue;
        }
        addOrionInventoryItem(state, item.itemId, item.count);
      }

      const traitGemByLine: Record<string, [string, string]> = {
        Warrior: ['spinel', 'hematite'],
        Marauder: ['carnelian', 'hematite'],
        Guardian: ['titanite', 'moonstone'],
        Cleric: ['demantoid', 'moonstone'],
        Wizard: ['kyanite', 'rubellite'],
        Rogue: ['charoite', 'rubellite'],
      };
      const [traitGem, reactorGem] = traitGemByLine[state.traitLine] || ['spinel', 'hematite'];
      addOrionInventoryItem(state, traitGem, isChest ? 2 : 1);
      addOrionInventoryItem(state, reactorGem, 1);
      if (fogMetrics && fogMetrics.fogIntensity >= 0.5) {
        addOrionInventoryItem(state, traitGem, 1);
      }

      const unlockedGearId = resolveContextualEquipmentDrop(state, {
        areaId: state.areaId,
        regionId: state.regionId,
        roomCoord: effectiveRoom,
        allowSecondCopy: true,
      });
      let gearSuffix = '';
      if (unlockedGearId) {
        const wasFirstCopy = unlockEquipmentItem(state, unlockedGearId);
        const gearName = getWeaponDefinition(unlockedGearId)?.name || unlockedGearId;
        gearSuffix = wasFirstCopy
          ? ` · ${gearName.toUpperCase()}`
          : ` · 2ND ${gearName.toUpperCase()} (PAIRED)`;
      }

      if (Number(state.flags.bedivere_list_items || 0) < 3) {
        state.flags.bedivere_list_items = Number(state.flags.bedivere_list_items || 0) + 1;
        addOrionInventoryItem(state, 'bedivere_relic', 1);
      }
      const fogBonusTag =
        fogMetrics && fogMetrics.distFromSetPath > 0
          ? ` [FOG LOOT ×${fogMetrics.lootMultiplier}]`
          : '';
      const baseToast = isChest
        ? `CHEST OPENED: +${earnedScrap} SCRAP & GEMS (${traitGem.toUpperCase()} / ${reactorGem.toUpperCase()})`
        : cacheDef.toast;
      ctx.say(`${baseToast}${gearSuffix}${fogBonusTag}`);
      notifyOrionStateChange();
      return true;
    }
  }

  if (facingTile === '1' || facingTile === '2' || facingTile === '3') {
    if (state.room === '-4,0') {
      if (facingTile === '1') {
        state.bypassProgressionGates = !state.bypassProgressionGates;
        if (state.bypassProgressionGates) {
          state.hasBoosterKit = true;
          unlockLevel2SecondaryWeapon(state);
        }
        syncStateGates(state);
        soundSystem.playPowerup();
        ctx.say(
          state.bypassProgressionGates
            ? 'CHEAT ROOM MODE ENABLED · DEV UI & GATE BYPASS ACTIVE'
            : 'CHEAT ROOM MODE SET TO STRICT PLAYER PROGRESSION'
        );
        notifyOrionStateChange();
        return true;
      }
      if (facingTile === '2') {
        for (const w of Object.values(WEAPON_REGISTRY)) {
          unlockEquipmentItem(state, w.id);
        }
        if (state.equipmentSlots) {
          state.equipmentSlots.unlockedMods = ACTION_MODIFICATION_CATALOG.map((m) => m.id);
        }
        syncStateGates(state);
        soundSystem.playPowerup();
        ctx.say('UNLOCKED ALL WEAPONS, SHIELDS & ACTION MODS');
        notifyOrionStateChange();
        return true;
      }
      if (facingTile === '3') {
        for (const g of GEMSTONE_CATALOG) {
          refundInventoryGem(state, g.id, 5);
        }
        state.salvageScrap += 200;
        state.flags.poe_lantern_gift = true;
        for (const id of [
          'demantoid_flask',
          'grail_water',
          'rusted_gate_key',
          'bedivere_list',
          'bedivere_ring',
        ]) {
          addOrionInventoryItem(state, id, 1);
        }
        soundSystem.playPowerup();
        ctx.say('GRANTED +5 ALL GEMSTONES, +200 SCRAP & RELIC KEYS');
        notifyOrionStateChange();
        return true;
      }
    }

    const switchKey = `switch:${effectiveRoom}:${facingTile}`;
    if (!state.lootedCaches[switchKey]) {
      state.lootedCaches[switchKey] = true;
      state.flags[`${switchKey}:anim_t`] = state.t;
      state.flags[`${switchKey}:anim_dir`] = '123';
      const curSwitches = Math.min(3, Number(state.flags.dungeon_switches || 0) + 1);
      state.flags.dungeon_switches = curSwitches;
      soundSystem.playPowerup();
      ctx.say(`SWITCH PULLED (${curSwitches}/3)`);
      notifyOrionStateChange();
      return true;
    }
  }

  if (facingTile === '!' || currentTile === '!') {
    if (state.room === '-4,0') {
      const warpTargets = [
        { room: '0,0', x: 128, y: 88, label: 'FIRST CAMPFIRE (3 ROOMS FROM POD)' },
        { room: '0,-2', x: 128, y: 88, label: 'POE LANTERN SANCTUARY (5 ROOMS FROM POD)' },
        { room: '3,0', x: 120, y: 96, label: 'MAIN BOG ENTRANCE (6 ROOMS FROM POD)' },
        { room: '4,0', x: 72, y: 72, label: 'CAMELOT BORDER TOWN' },
      ];
      const nextIdx = Number(state.flags.cheat_warp_idx || 0) % warpTargets.length;
      state.flags.cheat_warp_idx = nextIdx + 1;
      const dest = warpTargets[nextIdx];
      const bogPlacement = getUnifiedBogRoomPlacement(dest.room);
      if (bogPlacement) {
        const unifiedPos = convertBogRoomPosToUnifiedPx(
          dest.room,
          dest.x,
          dest.y,
          dest.room === '3,0' ? 20 : 16,
          dest.room === '3,0' ? 15 : 12
        );
        state.room = SUNKEN_BOG_EXPANSE_ROOM_ID;
        state.rx = bogPlacement.rx;
        state.ry = bogPlacement.ry;
        state.x = unifiedPos.x;
        state.y = unifiedPos.y;
        state.z = 0;
        state.vz = 0;
        syncRoomHierarchyState(state);
        updateChunkedRoomStreaming(rooms, state, true);
      } else {
        const [rxStr, ryStr] = dest.room.split(',');
        state.room = dest.room;
        state.rx = Number(rxStr) || 0;
        state.ry = Number(ryStr) || 0;
        state.x = dest.x;
        state.y = dest.y;
        state.z = 0;
        state.vz = 0;
        syncRoomHierarchyState(state);
        spawnRoomEnemies(rooms, state);
      }
      soundSystem.playPowerup();
      ctx.say(`CHEAT WARP -> ${dest.label}`);
      notifyOrionStateChange();
      return true;
    }

    const lx = facingTile === '!' ? ax : tx;
    const ly = facingTile === '!' ? ay : ty;
    const toggleKey = `switch:${state.room}:toggle:${lx},${ly}`;
    const nextActive = !state.lootedCaches[toggleKey];
    state.lootedCaches[toggleKey] = nextActive;
    state.flags[`${toggleKey}:anim_t`] = state.t;
    state.flags[`${toggleKey}:anim_dir`] = nextActive ? '123' : '321';
    state.flags[`desync_lock:${state.room}`] = nextActive;
    soundSystem.playSelect();
    ctx.say(
      nextActive
        ? 'BARRIERS PHASE-LOCKED OPEN'
        : 'BARRIERS RESTORED'
    );
    notifyOrionStateChange();
    return true;
  }

  if (facingTile === 'G' || currentTile === 'G') {
    if (state.flags.orc_raid_active) {
      soundSystem.playMenuBeep();
      ctx.say('EXIT SEALED UNTIL ORC RAID IS DEALT WITH!');
      return true;
    }
    if (state.unlockedGates[effectiveRoom] || state.unlockedGates[state.room]) return false;

    const keySlotIndex = state.inventorySlots.findIndex((s) => s.itemId === 'rusted_gate_key');
    const poeResolved = Boolean(state.flags.bog_exit_revealed);

    if (keySlotIndex >= 0 || poeResolved) {
      if (keySlotIndex >= 0) {
        state.inventorySlots[keySlotIndex].count -= 1;
        if (state.inventorySlots[keySlotIndex].count <= 0) {
          state.inventorySlots.splice(keySlotIndex, 1);
        }
      }
      state.unlockedGates[effectiveRoom] = true;
      state.unlockedGates[state.room] = true;
      state.clearedRooms[effectiveRoom] = true;
      state.clearedRooms[state.room] = true;

      const curRoom = rooms[state.room];
      if (curRoom) {
        rooms[state.room] = curRoom.map((r) => r.replace(/G/g, ':'));
      }

      soundSystem.playPowerup();
      ctx.say('BOG PERIMETER GATE UNSEALED · WALK EAST INTO CAMELOT BORDER TOWN');
      notifyOrionStateChange();
      return true;
    } else {
      soundSystem.playMenuBeep();
      ctx.say('BOG EXIT HIDDEN: DEAL WITH THE POE OR DEFEAT GUARDIAN');
      return true;
    }
  }

  if (facingTile === 'M' || currentTile === 'M') {
    const status = evaluateCathedralDoorStatus(state);
    if (status.canOpen) {
      state.flags.cathedral_door_open = true;
      state.unlockedGates[`${state.room}:M`] = true;
      addOrionInventoryItem(state, 'dungeon_key', 1);
      const curRoom = rooms[state.room];
      if (curRoom) {
        rooms[state.room] = curRoom.map((r) => r.replace(/M/g, '.'));
      }
      soundSystem.playPowerup();
      ctx.say(
        `DUNGEON ENTRANCE OPENED (${status.reason}) · CAMELOT WAYGATE KEY ACQUIRED! [DEEP DUNGEON OD-BT-01 SEALED]`
      );
      notifyOrionStateChange();
      return true;
    } else {
      soundSystem.playMenuBeep();
      ctx.say(`DUNGEON ENTRANCE SEALED: NEED ${status.reason}`);
      return true;
    }
  }

  if (
    (currentTile === '~' || facingTile === '~') &&
    Number(state.flags.bedivere_list_items || 0) >= 3 &&
    !state.flags.lady_of_the_lake_defeated
  ) {
    return awakenLadyOfTheLake(state, ctx);
  }

  return false;
}

export function executeWorldInteraction(
  rooms: Record<string, string[]>,
  state: OrionState,
  _ctx: OrionCombatContext
): boolean {
  state.flags = state.flags || {};
  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
  const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);
  const tx = Math.floor(state.x / TILE_SIZE);
  const ty = Math.floor(state.y / TILE_SIZE);

  const roomData = rooms[state.room];
  if (!roomData) return false;

  const currentTile = roomData[ty]?.[tx] || '.';
  const facingTile = roomData[ay]?.[ax] || '.';
  const effectiveRoom = getEffectiveRoomCoord(state);

  const nearbyPoe = state.enemies.find(
    (e) => e.type === 'bog_poe' && Math.hypot(e.x - state.x, e.y - state.y) < 26
  );
  if (nearbyPoe) {
    state.contextMenu = {
      title: 'POE (LANTERN SPIRIT)',
      targetType: 'poe',
      targetKey: `${effectiveRoom}:poe`,
      x: nearbyPoe.x,
      y: nearbyPoe.y,
      selectedIndex: 0,
      options: [
        {
          id: 'primary',
          label: !state.flags.campfire_unlocked
            ? 'Talk to Poe (Unlock Campfires)'
            : 'Speak with Poe',
        },
        { id: 'inspect', label: 'Inspect Spirit' },
        { id: 'leave', label: 'Leave' },
      ],
    };
    return true;
  }

  if ((facingTile === 'L' || currentTile === 'L') && isCheatModeActive(state)) {
    const lx = facingTile === 'L' ? ax : tx;
    const ly = facingTile === 'L' ? ay : ty;
    state.contextMenu = {
      title: 'POE LANTERN (CHEAT)',
      targetType: 'lantern',
      targetKey: `${effectiveRoom}:L:${lx},${ly}`,
      tx: lx,
      ty: ly,
      x: lx * TILE_SIZE + 8,
      y: ly * TILE_SIZE + 8,
      selectedIndex: 0,
      options: [
        {
          id: 'primary',
          label:
            state.flags.poe_state === 'helped'
              ? 'Extinguish Lantern'
              : 'Light Lantern (Cheat)',
        },
        { id: 'inspect', label: 'Inspect Lantern' },
        { id: 'leave', label: 'Leave' },
      ],
    };
    return true;
  }

  const nearbyCalmNpc = state.enemies.find(
    (e) =>
      e.type === 'town_npc' &&
      e.npcDisposition !== 'feral' &&
      Math.hypot(e.x - state.x, e.y - state.y) < 24
  );
  if (nearbyCalmNpc) {
    state.contextMenu = {
      title: nearbyCalmNpc.isLoyalist ? 'AVALON LOYALIST' : 'BOG SCAVENGER',
      targetType: 'npc',
      targetKey: `${effectiveRoom}:npc:${nearbyCalmNpc.id}`,
      x: nearbyCalmNpc.x,
      y: nearbyCalmNpc.y,
      selectedIndex: 0,
      options: [
        {
          id: 'primary',
          label: nearbyCalmNpc.isLoyalist
            ? 'Speak with Loyalist'
            : 'Trade (15 Scrap)',
        },
        { id: 'inspect', label: 'Inspect Citizen' },
        { id: 'leave', label: 'Leave' },
      ],
    };
    return true;
  }

  if (currentTile === 'D' || facingTile === 'D') {
    const dx = facingTile === 'D' ? ax : tx;
    const dy = facingTile === 'D' ? ay : ty;
    state.contextMenu = {
      title: state.room === '-4,0' ? 'CHEAT BAY EXIT' : 'ORBITAL DROP-POD HATCH',
      targetType: 'drop_pod',
      targetKey: `${state.room}:D:${dx},${dy}`,
      tx: dx,
      ty: dy,
      x: dx * TILE_SIZE + 8,
      y: dy * TILE_SIZE + 8,
      selectedIndex: 0,
      options: [
        {
          id: 'primary',
          label:
            state.room === '-4,0'
              ? 'Exit to Drop-Pod Crater'
              : 'Enter Drop-Pod Hatch',
        },
        { id: 'inspect', label: 'Inspect Pod Telemetry' },
        { id: 'leave', label: 'Leave' },
      ],
    };
    return true;
  }

  if (currentTile === 'A' || facingTile === 'A') {
    const cx = facingTile === 'A' ? ax : tx;
    const cy = facingTile === 'A' ? ay : ty;
    const canUse = Boolean(
      state.flags.campfire_unlocked ||
        state.flags.poe_state === 'helped' ||
        state.bypassProgressionGates
    );
    const isLit = Boolean(state.flags.first_campfire_lit);
    const options = [
      {
        id: 'primary',
        label:
          effectiveRoom === '0,0' && !canUse
            ? 'Attempt to Light (Locked — Speak to Poe)'
            : effectiveRoom === '0,0' && !isLit
              ? 'Light First Campfire & Rest'
              : 'Rest & Attune Spawn',
      },
    ];
    if (canUse) {
      options.push({
        id: 'world_map_campfire',
        label: 'World Map & Fast Travel (Within World)',
      });
    }
    options.push(
      { id: 'inspect', label: 'Inspect Campfire' },
      { id: 'leave', label: 'Leave' }
    );
    state.contextMenu = {
      title:
        effectiveRoom === '0,0' && !isLit
          ? 'UNLIT FIRST CAMPFIRE'
          : 'ÆTHER WAYSTATION CAMPFIRE',
      targetType: 'campfire',
      targetKey: `${effectiveRoom}:A:${cx},${cy}`,
      tx: cx,
      ty: cy,
      x: cx * TILE_SIZE + 8,
      y: cy * TILE_SIZE + 8,
      selectedIndex: 0,
      options,
    };
    return true;
  }

  if (currentTile === 'Q' || facingTile === 'Q') {
    const qx = facingTile === 'Q' ? ax : tx;
    const qy = facingTile === 'Q' ? ay : ty;
    state.contextMenu = {
      title: 'COLOSSAL WAYGATE',
      targetType: 'waygate',
      targetKey: `${effectiveRoom}:Q:${qx},${qy}`,
      tx: qx,
      ty: qy,
      x: qx * TILE_SIZE + 8,
      y: qy * TILE_SIZE + 8,
      selectedIndex: 0,
      options: [
        {
          id: 'world_map_waygate',
          label: 'World Map & Fast Travel (All Worlds & Local)',
        },
        { id: 'primary', label: 'Step Into Waygate (Direct Transit)' },
        { id: 'inspect', label: 'Inspect Waygate' },
        { id: 'leave', label: 'Leave' },
      ],
    };
    return true;
  }

  if (facingTile === 'S' || currentTile === 'S') {
    const sx = facingTile === 'S' ? ax : tx;
    const sy = facingTile === 'S' ? ay : ty;
    const scoutKey = `scout:${effectiveRoom}`;
    if (
      !state.lootedCaches[scoutKey] ||
      !state.flags.bedivere_ring_choice ||
      state.flags.bedivere_ring_choice === 'pending'
    ) {
      state.contextMenu = {
        title: "SIR BEDIVERE'S REMAINS",
        targetType: 'scout',
        targetKey: `${effectiveRoom}:S:${sx},${sy}`,
        tx: sx,
        ty: sy,
        x: sx * TILE_SIZE + 8,
        y: sy * TILE_SIZE + 8,
        selectedIndex: 0,
        options: [
          {
            id: 'primary',
            label: !state.lootedCaches[scoutKey]
              ? 'Salvage Khopesh & List'
              : 'Take Signet Ring',
          },
          { id: 'inspect', label: 'Inspect Fallen Knight' },
          { id: 'leave', label: 'Leave' },
        ],
      };
      return true;
    }
  }

  if (
    facingTile === 'C' ||
    facingTile === 'V' ||
    currentTile === 'C' ||
    currentTile === 'V'
  ) {
    const isFacingCache = facingTile === 'C' || facingTile === 'V';
    const cx = isFacingCache ? ax : tx;
    const cy = isFacingCache ? ay : ty;
    const tileChar = isFacingCache ? facingTile : currentTile;
    const isChest = tileChar === 'V';
    if (!isRoomCacheLooted(state, cx, cy)) {
      state.contextMenu = {
        title: isChest
          ? `TREASURE CHEST [${cx},${cy}]`
          : `SCAVENGER CACHE [${cx},${cy}]`,
        targetType: isChest ? 'chest' : 'cache',
        targetKey: `${state.room}:cache:${cx},${cy}`,
        tx: cx,
        ty: cy,
        x: cx * TILE_SIZE + 8,
        y: cy * TILE_SIZE + 8,
        selectedIndex: 0,
        options: [
          {
            id: 'primary',
            label: isChest ? 'Open Chest (Gear & Gems)' : 'Search Cache',
          },
          {
            id: 'inspect',
            label: isChest ? 'Inspect Chest' : 'Inspect Cache',
          },
          { id: 'leave', label: 'Leave' },
        ],
      };
      return true;
    }
  }

  if (
    facingTile === '1' ||
    facingTile === '2' ||
    facingTile === '3' ||
    facingTile === '!' ||
    currentTile === '!'
  ) {
    const sx =
      facingTile === '1' || facingTile === '2' || facingTile === '3' || facingTile === '!'
        ? ax
        : tx;
    const sy =
      facingTile === '1' || facingTile === '2' || facingTile === '3' || facingTile === '!'
        ? ay
        : ty;
    state.contextMenu = {
      title: state.room === '-4,0' ? 'DIAGNOSTIC TERMINAL' : 'ANCIENT MECHANISM',
      targetType: 'switch',
      targetKey: `${state.room}:switch:${sx},${sy}`,
      tx: sx,
      ty: sy,
      x: sx * TILE_SIZE + 8,
      y: sy * TILE_SIZE + 8,
      selectedIndex: 0,
      options: [
        {
          id: 'primary',
          label: state.room === '-4,0' ? 'Execute Terminal' : 'Pull Switch / Lever',
        },
        { id: 'inspect', label: 'Inspect Mechanism' },
        { id: 'leave', label: 'Leave' },
      ],
    };
    return true;
  }

  if (facingTile === 'G' || currentTile === 'G' || facingTile === 'M' || currentTile === 'M') {
    const gx = facingTile === 'G' || facingTile === 'M' ? ax : tx;
    const gy = facingTile === 'G' || facingTile === 'M' ? ay : ty;
    const isCathedral = facingTile === 'M' || currentTile === 'M';
    state.contextMenu = {
      title: isCathedral ? 'CATHEDRAL DUNGEON DOOR' : 'PERIMETER GATE',
      targetType: 'gate',
      targetKey: `${effectiveRoom}:gate:${gx},${gy}`,
      tx: gx,
      ty: gy,
      x: gx * TILE_SIZE + 8,
      y: gy * TILE_SIZE + 8,
      selectedIndex: 0,
      options: [
        {
          id: 'primary',
          label: isCathedral ? 'Open Dungeon Door' : 'Unseal Perimeter Gate',
        },
        { id: 'inspect', label: 'Inspect Seal' },
        { id: 'leave', label: 'Leave' },
      ],
    };
    return true;
  }

  if (
    (currentTile === '~' || facingTile === '~') &&
    Number(state.flags.bedivere_list_items || 0) >= 3 &&
    !state.flags.lady_of_the_lake_defeated
  ) {
    state.contextMenu = {
      title: 'SHIMMERING BOG WATERS',
      targetType: 'water',
      targetKey: `${effectiveRoom}:lady_of_the_lake`,
      x: state.x,
      y: state.y,
      selectedIndex: 0,
      options: [
        { id: 'primary', label: 'Disturb the Waters' },
        { id: 'inspect', label: 'Inspect Ripples' },
        { id: 'leave', label: 'Leave' },
      ],
    };
    return true;
  }

  return false;
}

export function executeContextMenuOption(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  optionIndexOverride?: number
): boolean {
  const menu = state.contextMenu;
  if (!menu) return false;

  const idx =
    optionIndexOverride !== undefined ? optionIndexOverride : menu.selectedIndex;
  const chosen = menu.options[idx] || menu.options[0];
  state.contextMenu = null;

  if (!chosen || chosen.id === 'leave') {
    soundSystem.playMenuBeep();
    notifyOrionStateChange();
    return false;
  }

  if (chosen.id === 'world_map_campfire') {
    state.flags = state.flags || {};
    state.flags.campfire_unlocked = true;
    state.flags.first_campfire_lit = true;
    syncRoomHierarchyState(state);
    const areaDef = getAreaDefinition(state.areaId);
    const currentWsId = areaDef.waystation?.id;
    state.discoveredWaystations = (state.discoveredWaystations || []).filter(
      (id) => id !== 'ws_bog_drop_pod'
    );
    if (currentWsId && !state.discoveredWaystations.includes(currentWsId)) {
      state.discoveredWaystations.push(currentWsId);
    }
    state.spawnAnchor = {
      areaId: state.areaId,
      room: state.room,
      x: Math.round(state.x),
      y: Math.round(state.y),
    };
    state.frame.integrity = state.frame.maxIntegrity || 200;
    state.frame.state = 'Operational';
    state.armor.durability = state.armor.maxDurability;
    state.shields.capacity = state.shields.maxCapacity;
    state.shields.overloaded = false;
    state.heat = 0;
    saveOrionGame(state);
    state.worldMapModalMode = 'campfire';
    soundSystem.playSelect();
    notifyOrionStateChange();
    return true;
  }

  if (chosen.id === 'world_map_waygate') {
    syncRoomHierarchyState(state);
    for (const wg of Object.values(WAYGATE_REGISTRY)) {
      if (!state.discoveredWaygates?.includes(wg.id)) {
        state.discoveredWaygates = [...(state.discoveredWaygates || []), wg.id];
      }
    }
    state.frame.integrity = state.frame.maxIntegrity || 200;
    state.frame.state = 'Operational';
    state.armor.durability = state.armor.maxDurability;
    state.shields.capacity = state.shields.maxCapacity;
    state.shields.overloaded = false;
    state.heat = 0;
    state.worldMapModalMode = 'waygate';
    soundSystem.playSelect();
    notifyOrionStateChange();
    return true;
  }

  if (chosen.id === 'inspect') {
    soundSystem.playSelect();
    const inspectMessages: Record<string, string> = {
      chest: 'TREASURE CHEST: CONTAINS SALVAGED EQUIPMENT, GEMSTONES & SCRAP (NO REPAIR FLASKS).',
      cache: 'SCAVENGER CACHE: BURIED FIELD SUPPLIES; BECOMES PASSABLE TERRAIN AFTER LOOTING.',
      campfire:
        getEffectiveRoomCoord(state) === '0,0' && !state.flags?.first_campfire_lit
          ? 'FIRST CAMPFIRE: COLD HEARTH. SPEAK TO THE POE BEHIND THE TREES TO UNLOCK & IGNITE.'
          : 'ÆTHER WAYSTATION: RESTORES DEFENSES, SAVES ANCHOR & ENABLES WITHIN-WORLD FAST TRAVEL.',
      poe: 'POE SPIRIT: TUCKED BEHIND THE TREELINE. SPEAKING UNLOCKS CAMPFIRE ATTUNEMENT.',
      waygate: 'COLOSSAL WAYGATE: ANCIENT AETHER TRANSIT CONDUIT FOR WORLD-TO-WORLD & LOCAL FAST TRAVEL.',
      scout: "SIR BEDIVERE'S CHASSIS: FALLEN CAMELOT KNIGHT CLUTCHING A KHOPESH & RELIC LIST.",
      gate: 'SEALED GATEWAY: REQUIRES POE GUIDANCE, KEY OR TRIAL COMPLETION.',
    };
    ctx.say(inspectMessages[menu.targetType] || `${menu.title} — READY FOR INTERACTION.`);
    notifyOrionStateChange();
    return true;
  }

  return performDirectWorldInteraction(rooms, state, ctx, {
    tx: menu.tx,
    ty: menu.ty,
  });
}

