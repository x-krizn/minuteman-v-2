/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { COLS, DIR_VECTORS, ROWS, TILE_SIZE } from '../constants';
import { AREA_REGISTRY } from '../database/areas/m00_the_bog';
import {
  ORION_CACHE_DEFINITIONS,
  ORION_ROOM_METADATA,
} from '../database/world/maps/tutorial';
import { spawnRoomEnemies } from '../enemies';
import {
  addOrionInventoryItem,
  notifyOrionStateChange,
  saveOrionGame,
} from '../stateStore';
import { OrionCombatContext, OrionState } from '../types';
import { awakenLadyOfTheLake } from './hazardAndRaidSystem';
import { syncStateGates } from './stateSystem';
import {
  getTutorialPromptOverride,
  handleTutorialAnchorInteraction,
} from './tutorialSystem';

/**
 * Retrieve structured display metadata for the pilot's current room and area
 * from the world database.
 */
export function getRoomWorldInfo(state: OrionState): {
  roomTitle: string;
  bannerTitle: string;
  areaName: string;
  worldName: string;
} {
  const meta = ORION_ROOM_METADATA[state.room];
  const areaId = meta?.areaId || state.areaId || 'm00_the_bog';
  const areaDef = AREA_REGISTRY[areaId] || AREA_REGISTRY.m00_the_bog;

  return {
    roomTitle: meta?.title || `Sector [${state.rx}, ${state.ry}]`,
    bannerTitle: meta?.bannerTitle || `${areaDef.name.toUpperCase()} [${state.rx},${state.ry}]`,
    areaName: areaDef.name,
    worldName: areaDef.world,
  };
}

/**
 * Check whether the Cathedral Dungeon Door (M) satisfies any of the 3 canonical opening methods:
 * 1. By Force: 3 Grail Fragments from Percival, Tristan, and Bors
 * 2. By Exploration: 3 Hidden Switches across Market, Cathedral, and Barracks
 * 3. By Trust: High Town Trust from Orc Raid defenses (requires 5 instead of 3 if carrying Bedivere's Ring)
 */
export function evaluateCathedralDoorStatus(state: OrionState): {
  canOpen: boolean;
  reason: string;
} {
  const flags = state.flags || {};
  const fragments = Number(flags.grail_fragments || 0);
  const switches = Number(flags.dungeon_switches || 0);
  const trust = Number(flags.town_trust || 0);
  const requiredTrust = flags.bedivere_ring_choice === 'taken' ? 5 : 3;

  if (fragments >= 3) {
    return { canOpen: true, reason: 'BY FORCE (3/3 GRAIL FRAGMENTS)' };
  }
  if (switches >= 3) {
    return { canOpen: true, reason: 'BY EXPLORATION (3/3 HIDDEN SWITCHES)' };
  }
  if (trust >= requiredTrust) {
    return { canOpen: true, reason: `BY TOWN TRUST (${trust}/${requiredTrust})` };
  }

  return {
    canOpen: false,
    reason: `FORCE (${fragments}/3) · SWITCHES (${switches}/3) · TRUST (${trust}/${requiredTrust})`,
  };
}

/**
 * Reboot the pilot's mech at the active Spawn Anchor (state.spawnAnchor),
 * restoring all Three Defense Layers and purging reactor heat.
 */
export function rebootAtSpawnAnchor(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  reasonToast: string
): void {
  state.frame.integrity = state.frame.maxIntegrity || 200;
  state.frame.state = 'Operational';
  state.armor.durability = state.armor.maxDurability;
  state.shields.capacity = state.shields.maxCapacity;
  state.shields.overloaded = false;
  state.heat = 0;
  state.ammo = state.maxAmmo;
  state.isReloading = false;
  state.isFallingIntoPit = false;
  state.isBoosterDashing = false;
  state.onGround = true;

  const anchor = state.spawnAnchor || { areaId: 'm00_the_bog', room: '0,0', x: 48, y: 72 };
  const [rxStr, ryStr] = anchor.room.split(',');
  state.areaId = anchor.areaId;
  state.room = anchor.room;
  state.rx = Number(rxStr) || 0;
  state.ry = Number(ryStr) || 0;
  state.x = anchor.x;
  state.y = anchor.y;
  state.z = 0;
  state.vz = 0;

  ctx.say(reasonToast);
  spawnRoomEnemies(rooms, state);
  syncStateGates(state);
  notifyOrionStateChange();
}

/**
 * Evaluate contextual interactive prompts for anchors/setpieces in the current room.
 * Consults tutorialSystem only when state.tutorialActive is true.
 */
export function checkWorldInteractivePrompt(
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  state.flags = state.flags || {};
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

  // If player stepped away from Bedivere's body after salvaging without taking the ring -> mark 'left'
  const nearScout = currentTile === 'S' || facingTile === 'S';
  const scoutKey = `scout:${state.room}`;
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

  // Check proximity to interactive entities (Poe or Calm Town NPC)
  const nearbyPoe = state.enemies.find(
    (e) => e.type === 'bog_poe' && Math.hypot(e.x - state.x, e.y - state.y) < 24
  );
  const nearbyCalmNpc = state.enemies.find(
    (e) =>
      e.type === 'town_npc' &&
      e.npcDisposition !== 'feral' &&
      Math.hypot(e.x - state.x, e.y - state.y) < 24
  );

  // 0A. Poe Spirit Interaction
  if (nearbyPoe && state.flags.poe_state !== 'helped') {
    candidateKey = `${state.room}:poe`;
    candidateText = '[A] HELP POE BACK TO ITS LANTERN (OR IGNORE / ATTACK)';
  } else if (facingTile === 'L' || currentTile === 'L') {
    // 0B. Poe Lantern Anchor (L)
    candidateKey = `${state.room}:lantern`;
    candidateText =
      state.flags.poe_state === 'helped'
        ? 'POE LANTERN (ILLUMINATED · BOG WURM REVEALED)'
        : '[A] GUIDE POE TO LANTERN & RECEIVE GIFT';
  } else if (nearbyCalmNpc) {
    // 0C. Calm / Linger Border Town NPC
    candidateKey = `${state.room}:npc:${nearbyCalmNpc.id}`;
    candidateText = nearbyCalmNpc.isLoyalist
      ? '[A] SPEAK WITH CAMELOT LOYALIST'
      : '[A] TRADE WITH BORDER TOWN SCAVENGER (15 SCRAP -> REPAIR KIT)';
  } else if (currentTile === 'D' || facingTile === 'D') {
    // 1. White Spawn Anchor: Drop-Pod Crater (D)
    candidateKey = `${state.room}:D`;
    candidateText = '[A] SYNC SPAWN ANCHOR · PURGE HEAT & REPAIR';
  } else if (nearScout) {
    // 2. Magenta Micro-Setpiece: Bedivere / Fallen Scout (S)
    candidateKey = `${state.room}:${scoutKey}:${state.flags.bedivere_ring_choice || 'none'}`;
    const tutorialOverride = getTutorialPromptOverride(state, 'S');
    if (!state.lootedCaches[scoutKey]) {
      candidateText =
        tutorialOverride || "[A] EXAMINE BEDIVERE (BOOSTER, KHOPESH & NUMBERED LIST)";
    } else if (
      !state.flags.bedivere_ring_choice ||
      state.flags.bedivere_ring_choice === 'pending'
    ) {
      candidateText = "[A] TAKE BEDIVERE'S SIGNET RING (OR WALK AWAY TO LEAVE IT)";
    } else {
      candidateText =
        state.flags.bedivere_ring_choice === 'taken'
          ? 'BEDIVERE (SIGNET RING TAKEN)'
          : 'BEDIVERE (SIGNET RING LEFT IN PEACE)';
    }
  } else if (facingTile === 'C') {
    // 3. Supply / Scavenger Cache (C)
    const cacheKey = `${state.room}:${ax},${ay}`;
    candidateKey = `${state.room}:${cacheKey}`;
    if (!state.lootedCaches[cacheKey]) {
      candidateText = '[A] LOOT SCAVENGER CACHE';
    } else {
      candidateText = 'SCAVENGER CACHE (EMPTY)';
    }
  } else if (facingTile === '1' || facingTile === '2' || facingTile === '3') {
    // 4. Hidden Exploration Switches (1, 2, 3) for Cathedral Dungeon Door
    const switchKey = `switch:${state.room}:${facingTile}`;
    candidateKey = switchKey;
    candidateText = state.lootedCaches[switchKey]
      ? `HIDDEN GRAIL SWITCH #${facingTile} (ACTIVE)`
      : `[A] ACTIVATE HIDDEN GRAIL SWITCH #${facingTile}`;
  } else if (facingTile === 'G' || currentTile === 'G') {
    // 5. Blue Transition Anchor: Bog Exit / Perimeter Gate (G)
    if (state.flags.orc_raid_active) {
      candidateKey = `${state.room}:gate:raid`;
      candidateText = 'BOG EXIT SEALED DURING ORC RAID!';
    } else if (!state.unlockedGates[state.room]) {
      candidateKey = `${state.room}:gate`;
      const hasKey = state.inventorySlots.some((s) => s.itemId === 'rusted_gate_key');
      const poeResolved = Boolean(state.flags.bog_exit_revealed);
      candidateText =
        hasKey || poeResolved
          ? '[A] UNSEAL BOG EXIT GATE'
          : 'BOG EXIT HIDDEN · RESOLVE THE POE OR FIND GATE KEY';
    }
  } else if (facingTile === 'M' || currentTile === 'M') {
    // 6. Three-Way Cathedral Dungeon Door (M)
    if (!state.flags.cathedral_door_open) {
      candidateKey = `${state.room}:cathedral_door`;
      const status = evaluateCathedralDoorStatus(state);
      candidateText = status.canOpen
        ? `[A] OPEN CATHEDRAL DUNGEON DOOR (${status.reason})`
        : `DUNGEON DOOR LOCKED · ${status.reason}`;
    }
  } else if (
    (currentTile === '~' || facingTile === '~') &&
    Number(state.flags.bedivere_list_items || 0) >= 3 &&
    !state.flags.lady_of_the_lake_defeated &&
    !state.enemies.some((e) => e.type === 'lady_of_the_lake')
  ) {
    // 7. Part V Secret: The Bog Water Waits for Bedivere's Completed List
    candidateKey = `${state.room}:lady_of_the_lake`;
    candidateText = '[A] THE BOG WATER WAITS — AWAKEN THE LADY OF THE LAKE';
  }

  if (candidateKey) {
    if (state.dismissedPromptKey === candidateKey) {
      state.promptText = null;
      return;
    }
    state.promptText = candidateText;
  } else {
    state.promptText = null;
    state.dismissedPromptKey = null;
  }
}

/**
 * Execute an interaction with an anchor, setpiece, Poe, NPC, or switch in the world.
 */
export function executeWorldInteraction(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext
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

  // 0A. Help Poe Spirit or Lantern Anchor (L)
  const nearbyPoe = state.enemies.find(
    (e) => e.type === 'bog_poe' && Math.hypot(e.x - state.x, e.y - state.y) < 24
  );
  if (
    (nearbyPoe && state.flags.poe_state !== 'helped') ||
    ((facingTile === 'L' || currentTile === 'L') && state.flags.poe_state !== 'helped')
  ) {
    state.flags.poe_state = 'helped';
    state.flags.poe_lantern_gift = true;
    state.flags.bog_exit_revealed = true;
    addOrionInventoryItem(state, 'poe_lantern_charm', 1);
    // Reveal any submerged Bog Wurm in the room
    for (const e of state.enemies) {
      if (e.type === 'bog_wurm') e.isSubmerged = false;
    }
    soundSystem.playPowerup();
    ctx.say("POE RETURNED TO LANTERN · GIFT REVEALS SUBMERGED BOG WURM!");
    notifyOrionStateChange();
    return true;
  }

  // 0B. Speak / Trade with Calm Town NPC
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
        ctx.say('LOYALIST: "YOU HONORED BEDIVERE. TAKE THIS FIELD PATCH."');
        if (!state.lootedCaches[`npc_gift:${nearbyCalmNpc.id}`]) {
          state.lootedCaches[`npc_gift:${nearbyCalmNpc.id}`] = true;
          addOrionInventoryItem(state, 'repair_kit', 1);
        }
      }
    } else {
      if (state.salvageScrap >= 15) {
        state.salvageScrap -= 15;
        addOrionInventoryItem(state, 'repair_kit', 1);
        soundSystem.playCoin();
        ctx.say('TRADED 15 SCRAP FOR FIELD REPAIR KIT');
      } else {
        soundSystem.playMenuBeep();
        ctx.say('SCAVENGER: "15 SCRAP FOR A REPAIR KIT, PILOT."');
      }
    }
    notifyOrionStateChange();
    return true;
  }

  // 1. White Spawn Anchor: Drop-Pod Crater (D)
  if (currentTile === 'D' || facingTile === 'D') {
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
    soundSystem.playHeal();
    ctx.say('SPAWN ANCHOR SYNCED · SYSTEMS REBOOTED (SAVED)');
    notifyOrionStateChange();
    return true;
  }

  // 2. Magenta Setpiece: Bedivere / Fallen Scout (S)
  if (facingTile === 'S' || currentTile === 'S') {
    const scoutKey = `scout:${state.room}`;
    if (!state.lootedCaches[scoutKey]) {
      // First press: salvage gear & Bedivere's Numbered List; set ring choice to 'pending'
      handleTutorialAnchorInteraction(state, ctx, 'S');
      state.lootedCaches[scoutKey] = true;
      state.hasBoosterKit = true;
      if (!state.equippedWeapons.includes('khopesh')) {
        state.equippedWeapons.push('khopesh');
      }
      addOrionInventoryItem(state, 'bedivere_list', 1);
      addOrionInventoryItem(state, 'repair_kit', 1);
      state.flags.bedivere_list_collected = true;
      state.flags.bedivere_ring_choice = 'pending';
      syncStateGates(state);
      soundSystem.playPowerup();
      ctx.say("FOUND BOOSTER, KHOPESH & BEDIVERE'S LIST · [A] TAKE RING OR WALK AWAY");
      notifyOrionStateChange();
      return true;
    } else if (state.flags.bedivere_ring_choice === 'pending') {
      // Second press at Bedivere: explicitly take the Signet Ring
      state.flags.bedivere_ring_choice = 'taken';
      addOrionInventoryItem(state, 'bedivere_ring', 1);
      soundSystem.playCoin();
      ctx.say("TOOK BEDIVERE'S SIGNET RING");
      notifyOrionStateChange();
      return true;
    }
  }

  // 3. Supply / Scavenger Cache (C)
  if (facingTile === 'C') {
    const cacheKey = `${state.room}:${ax},${ay}`;
    if (!state.lootedCaches[cacheKey]) {
      state.lootedCaches[cacheKey] = true;
      soundSystem.playPowerup();

      const cacheDef = ORION_CACHE_DEFINITIONS[state.room] || ORION_CACHE_DEFINITIONS.default;
      state.salvageScrap += cacheDef.scrap;
      for (const item of cacheDef.items) {
        addOrionInventoryItem(state, item.itemId, item.count);
      }
      // Also progress Bedivere's List relics when looting hidden caches
      if (Number(state.flags.bedivere_list_items || 0) < 3) {
        state.flags.bedivere_list_items = Number(state.flags.bedivere_list_items || 0) + 1;
        addOrionInventoryItem(state, 'bedivere_relic', 1);
      }
      ctx.say(`${cacheDef.toast} · LIST RELIC (${state.flags.bedivere_list_items}/3)`);
      notifyOrionStateChange();
      return true;
    }
  }

  // 4. Hidden Dungeon Switches (1, 2, 3)
  if (facingTile === '1' || facingTile === '2' || facingTile === '3') {
    const switchKey = `switch:${state.room}:${facingTile}`;
    if (!state.lootedCaches[switchKey]) {
      state.lootedCaches[switchKey] = true;
      const curSwitches = Math.min(3, Number(state.flags.dungeon_switches || 0) + 1);
      state.flags.dungeon_switches = curSwitches;
      soundSystem.playPowerup();
      ctx.say(`HIDDEN GRAIL SWITCH ACTIVATED (${curSwitches}/3)`);
      notifyOrionStateChange();
      return true;
    }
  }

  // 5. Blue Transition Anchor: Bog Exit / Perimeter Gate (G)
  if (facingTile === 'G' || currentTile === 'G') {
    if (state.flags.orc_raid_active) {
      soundSystem.playMenuBeep();
      ctx.say('EXIT SEALED UNTIL ORC RAID IS DEALT WITH!');
      return true;
    }
    if (state.unlockedGates[state.room]) return false;

    const keySlotIndex = state.inventorySlots.findIndex((s) => s.itemId === 'rusted_gate_key');
    const poeResolved = Boolean(state.flags.bog_exit_revealed);

    if (keySlotIndex >= 0 || poeResolved) {
      if (keySlotIndex >= 0) {
        state.inventorySlots[keySlotIndex].count -= 1;
        if (state.inventorySlots[keySlotIndex].count <= 0) {
          state.inventorySlots.splice(keySlotIndex, 1);
        }
      }
      state.unlockedGates[state.room] = true;
      state.clearedRooms[state.room] = true;

      const curRoom = rooms[state.room];
      if (curRoom) {
        rooms[state.room] = curRoom.map((r) => r.replace(/G/g, '.'));
      }

      soundSystem.playPowerup();
      ctx.say('BOG PERIMETER GATE UNSEALED · BORDER TOWN ACCESS');
      notifyOrionStateChange();
      return true;
    } else {
      soundSystem.playMenuBeep();
      ctx.say('BOG EXIT HIDDEN: DEAL WITH THE POE OR DEFEAT GUARDIAN');
      return true;
    }
  }

  // 6. Three-Way Cathedral Dungeon Door (M)
  if (facingTile === 'M' || currentTile === 'M') {
    const status = evaluateCathedralDoorStatus(state);
    if (status.canOpen) {
      state.flags.cathedral_door_open = true;
      state.unlockedGates[`${state.room}:M`] = true;
      const curRoom = rooms[state.room];
      if (curRoom) {
        rooms[state.room] = curRoom.map((r) => r.replace(/M/g, '.'));
      }
      soundSystem.playPowerup();
      ctx.say(`CATHEDRAL DUNGEON DOOR OPENED ${status.reason}!`);
      notifyOrionStateChange();
      return true;
    } else {
      soundSystem.playMenuBeep();
      ctx.say(`DOOR SEALED: NEED ${status.reason}`);
      return true;
    }
  }

  // 7. Part V Secret: Awaken Lady of the Lake at Bog Water (~)
  if (
    (currentTile === '~' || facingTile === '~') &&
    Number(state.flags.bedivere_list_items || 0) >= 3 &&
    !state.flags.lady_of_the_lake_defeated
  ) {
    return awakenLadyOfTheLake(state, ctx);
  }

  return false;
}

/**
 * Handle seamless room boundary transitions and area updates.
 */
export function handleWorldRoomTransition(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext
): void {
  const roomW = COLS * TILE_SIZE;
  const roomH = ROWS * TILE_SIZE;

  let transitioned = false;

  // East transition
  if (state.x >= roomW) {
    const nextRx = state.rx + 1;
    const nextKey = `${nextRx},${state.ry}`;
    if (rooms[nextKey]) {
      state.rx = nextRx;
      state.room = nextKey;
      state.x = 8;
      state.y = Math.max(84, Math.min(108, state.y));
      transitioned = true;
    } else {
      state.x = roomW - 4;
    }
  } else if (state.x < 0) {
    // West transition
    const nextRx = state.rx - 1;
    const nextKey = `${nextRx},${state.ry}`;
    if (rooms[nextKey]) {
      state.rx = nextRx;
      state.room = nextKey;
      state.x = roomW - 8;
      state.y = Math.max(84, Math.min(108, state.y));
      transitioned = true;
    } else {
      state.x = 4;
    }
  }

  // North transition
  if (state.y < 0) {
    const nextRy = state.ry - 1;
    const nextKey = `${state.rx},${nextRy}`;
    if (rooms[nextKey]) {
      state.ry = nextRy;
      state.room = nextKey;
      state.y = roomH - 8;
      state.x = Math.max(68, Math.min(92, state.x));
      transitioned = true;
    } else {
      state.y = 4;
    }
  } else if (state.y >= roomH) {
    // South transition
    const nextRy = state.ry + 1;
    const nextKey = `${state.rx},${nextRy}`;
    if (rooms[nextKey]) {
      state.ry = nextRy;
      state.room = nextKey;
      state.y = 8;
      state.x = Math.max(68, Math.min(92, state.x));
      transitioned = true;
    } else {
      state.y = roomH - 4;
    }
  }

  if (transitioned) {
    state.projectiles = [];
    state.pickups = [];

    const meta = ORION_ROOM_METADATA[state.room];
    if (meta?.areaId) {
      state.areaId = meta.areaId;
    }

    spawnRoomEnemies(rooms, state);
    soundSystem.playSelect();
    const info = getRoomWorldInfo(state);
    ctx.say(info.bannerTitle);
    notifyOrionStateChange();
  }
}
