/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { GameInput } from '../../../types/input';
import {
  BOOSTER_DASH_COOLDOWN,
  BOOSTER_DASH_DURATION,
  BOOSTER_HEAT_COST,
  BOOSTER_SPEED,
  COLS,
  DIR_VECTORS,
  getDirFromVector,
  GRAVITY,
  JUMP_VELOCITY,
  MUD_SPEED_PENALTY,
  ROWS,
  TILE_SIZE,
  WALK_SPEED,
} from '../constants';
import { TRAIT_REGISTRY } from '../database/characters';
import { getWeaponDefinition } from '../database/weapons';
import { getBiomeDefinition, getTileDefinition } from '../database/world';
import { OrionCapabilityGates, OrionCombatContext, OrionState, TraitLine } from '../types';
import { cycleTargetLock, performWeaponSwap, updateTargetLock } from './combatSystem';
import { updateParticles } from './entitySystem';
import {
  executeWorldInteraction,
  rebootAtSpawnAnchor,
  rehydrateAetherFogRooms,
} from './worldSystem';

// ─── 1. REACTIVE STATE STORE & PERSISTENCE ───────────────────────────────────

let orionStateRef: OrionState | null = null;
let orionRoomsRef: Record<string, string[]> | null = null;
let onStateChangeListeners: Array<() => void> = [];

export function setOrionStateRef(state: OrionState): void {
  orionStateRef = state;
  notifyOrionStateChange();
}

export function getOrionStateRef(): OrionState | null {
  return orionStateRef;
}

export function setOrionRoomsRef(rooms: Record<string, string[]>): void {
  orionRoomsRef = rooms;
}

export function getOrionRoomsRef(): Record<string, string[]> | null {
  return orionRoomsRef;
}

export function subscribeOrionStateChange(listener: () => void): () => void {
  onStateChangeListeners.push(listener);
  return () => {
    onStateChangeListeners = onStateChangeListeners.filter((l) => l !== listener);
  };
}

export function notifyOrionStateChange(): void {
  for (const listener of onStateChangeListeners) {
    listener();
  }
}

export function consolidateInventorySlots(
  slots: Array<{ itemId: string; count: number }>
): Array<{ itemId: string; count: number }> {
  const map = new Map<string, number>();
  for (const slot of slots) {
    map.set(slot.itemId, (map.get(slot.itemId) || 0) + slot.count);
  }
  return Array.from(map.entries()).map(([itemId, count]) => ({ itemId, count }));
}

export function addOrionInventoryItem(
  state: OrionState,
  itemId: string,
  count: number = 1
): void {
  const existing = state.inventorySlots.find((s) => s.itemId === itemId);
  if (existing) {
    existing.count += count;
  } else {
    state.inventorySlots.push({ itemId, count });
  }
}

export function saveOrionGame(state: OrionState): boolean {
  try {
    const saveData = {
      pilotName: state.pilotName,
      traitLine: state.traitLine,
      reactor: state.reactor,
      level: state.level,
      heat: state.heat,
      energy: state.energy,
      shields: state.shields,
      armor: state.armor,
      frame: state.frame,
      equippedWeapons: state.equippedWeapons,
      activeWeaponIndex: state.activeWeaponIndex,
      assignedActions: state.assignedActions,
      equippedFeats: state.equippedFeats,
      hasBoosterKit: state.hasBoosterKit,
      salvageScrap: state.salvageScrap,
      inventorySlots: state.inventorySlots,
      clearedRooms: state.clearedRooms,
      lootedCaches: state.lootedCaches,
      unlockedGates: state.unlockedGates,
      incursionEnabled: state.incursionEnabled,
      tutorialActive: state.tutorialActive,
      tutorialStep: state.tutorialStep,
      bypassProgressionGates: state.bypassProgressionGates,
      flags: state.flags,
      spawnAnchor: state.spawnAnchor,
      regionId: state.regionId,
      areaId: state.areaId,
      mapId: state.mapId,
      biomeId: state.biomeId,
      discoveredWaystations: state.discoveredWaystations,
      discoveredWaygates: state.discoveredWaygates,
      room: state.room,
      rx: state.rx,
      ry: state.ry,
      x: state.x,
      y: state.y,
      fogGraph: state.fogGraph,
    };
    localStorage.setItem('orion_save_slot_canonical', JSON.stringify(saveData));
    return true;
  } catch {
    return false;
  }
}

export function loadOrionGame(state: OrionState): boolean {
  try {
    const raw = localStorage.getItem('orion_save_slot_canonical');
    if (!raw) return false;
    const data = JSON.parse(raw);

    state.pilotName = data.pilotName ?? state.pilotName;
    state.traitLine = data.traitLine ?? state.traitLine;
    state.reactor = data.reactor ?? state.reactor;
    state.level = data.level ?? state.level;
    state.heat = data.heat ?? state.heat;
    state.energy = data.energy ?? state.energy;
    state.shields = data.shields ?? state.shields;
    state.armor = data.armor ?? state.armor;
    state.frame = data.frame ?? state.frame;
    state.equippedWeapons = data.equippedWeapons ?? state.equippedWeapons;
    state.activeWeaponIndex = data.activeWeaponIndex ?? state.activeWeaponIndex;
    if (data.assignedActions && typeof data.assignedActions === 'object') {
      state.assignedActions = { ...state.assignedActions, ...data.assignedActions };
    }
    if (Array.isArray(data.equippedFeats)) {
      state.equippedFeats = data.equippedFeats;
    }
    state.hasBoosterKit = data.hasBoosterKit ?? state.hasBoosterKit;
    state.salvageScrap = data.salvageScrap ?? state.salvageScrap;
    state.inventorySlots = consolidateInventorySlots(data.inventorySlots ?? state.inventorySlots);
    state.clearedRooms = data.clearedRooms ?? state.clearedRooms;
    state.lootedCaches = data.lootedCaches ?? state.lootedCaches;
    state.unlockedGates = data.unlockedGates ?? state.unlockedGates;
    state.incursionEnabled = data.incursionEnabled ?? state.incursionEnabled;
    state.tutorialActive = data.tutorialActive ?? state.tutorialActive;
    state.tutorialStep = data.tutorialStep ?? state.tutorialStep;
    state.bypassProgressionGates = data.bypassProgressionGates ?? state.bypassProgressionGates;
    state.flags = data.flags ?? state.flags;
    state.spawnAnchor = data.spawnAnchor ?? state.spawnAnchor;
    state.regionId = data.regionId ?? state.regionId;
    state.areaId = data.areaId ?? state.areaId;
    state.mapId = data.mapId ?? state.mapId;
    state.biomeId = data.biomeId ?? state.biomeId;
    if (Array.isArray(data.discoveredWaystations)) {
      state.discoveredWaystations = data.discoveredWaystations;
    }
    if (Array.isArray(data.discoveredWaygates)) {
      state.discoveredWaygates = data.discoveredWaygates;
    }
    state.room = data.room ?? state.room;
    state.rx = data.rx ?? state.rx;
    state.ry = data.ry ?? state.ry;
    state.x = data.x ?? state.x;
    state.y = data.y ?? state.y;
    if (data.fogGraph && typeof data.fogGraph === 'object') {
      state.fogGraph = data.fogGraph;
      if (orionRoomsRef) {
        rehydrateAetherFogRooms(orionRoomsRef, state);
      }
    }

    notifyOrionStateChange();
    return true;
  } catch {
    return false;
  }
}

export function createInitialOrionState(): OrionState {
  const defaultTrait = TRAIT_REGISTRY.Warrior;
  return {
    regionId: 'region_belldor_outskirts',
    areaId: 'm00_the_bog',
    mapId: 'map_bog_drop_zone',
    biomeId: 'belldor_bog',
    room: '0,0',
    rx: 0,
    ry: 0,
    discoveredWaystations: ['ws_bog_drop_pod'],
    discoveredWaygates: [],

    x: 48,
    y: 72,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    onGround: true,
    dir: 'S',
    faceX: 0,
    faceY: 1,
    t: 0,

    pilotName: 'Pilot Vane',
    traitLine: 'Warrior',
    reactor: defaultTrait.reactor,

    level: 1,
    heat: 0,
    maxHeat: 100,
    energy: 100,
    maxEnergy: 100,

    shields: {
      type: defaultTrait.baseShield.type,
      capacity: defaultTrait.baseShield.capacity,
      maxCapacity: defaultTrait.baseShield.capacity,
      overloaded: false,
      overloadTimer: 0,
      rechargeDelay: 0,
    },
    armor: {
      type: defaultTrait.baseArmor.type,
      threshold: defaultTrait.baseArmor.threshold,
      rating: defaultTrait.baseArmor.rating,
      durability: defaultTrait.baseArmor.durability,
      maxDurability: defaultTrait.baseArmor.durability,
    },
    frame: {
      integrity: 200,
      maxIntegrity: 200,
      state: 'Operational',
    },

    equippedWeapons: ['gladius_boltcaster', 'khopesh'],
    activeWeaponIndex: 0,
    weaponSwapCooldown: 0,

    ammo: 9,
    maxAmmo: 9,
    isReloading: false,
    reloadTimer: 0,
    reloadDuration: 3.15,
    skillCooldowns: [0, 0, 0, 0, 0],

    activeSkillSlot: null,
    activeActionId: null,
    skillTellTimer: 0,
    skillActionTimer: 0,

    assignedActions: {
      L: 'weapon_skill_1',
      R: 'weapon_skill_2',
    },
    actionCooldowns: {},
    overdriveTimer: 0,
    opticMarkTimer: 0,

    lockedTargetId: null,
    yHoldTimer: 0,
    yHoldTriggeredSwap: false,
    wasYHeld: false,

    hasBoosterKit: false,
    isBoosterDashing: false,
    isContinuousBoosting: false,
    bHoldTimer: 0,
    boosterTimer: 0,
    boosterCooldown: 0,
    boosterDirX: 0,
    boosterDirY: 1,

    salvageScrap: 0,
    inventorySlots: [{ itemId: 'repair_kit', count: 2 }],
    equippedFeats: [],

    clearedRooms: {},
    lootedCaches: {},
    unlockedGates: {},
    incursionEnabled: true,

    tutorialActive: true,
    tutorialStep: 'drop_pod_boot',
    bypassProgressionGates: false,
    flags: {
      poe_state: 'unmet',
      poe_lantern_gift: false,
      bog_exit_revealed: false,
      bedivere_ring_choice: 'unchosen',
      bedivere_list_collected: false,
      bedivere_list_items: 0,
      lady_of_the_lake_defeated: false,
      orc_raid_active: false,
      town_trust: 0,
      grail_fragments: 0,
      dungeon_switches: 0,
      knights_pulled_together: false,
      cathedral_door_open: false,
    },
    spawnAnchor: {
      areaId: 'm00_the_bog',
      room: '0,0',
      x: 48,
      y: 72,
    },

    enemies: [],
    pickups: [],
    projectiles: [],
    particles: [],

    toastText: 'M00: THE BOG — DROP-POD REBOOT',
    toastTimer: 3.5,
    promptText: null,
    flickerTimer: 0,
    useStandardResolutionHud: true,
    isFallingIntoPit: false,
    dismissedPromptKey: null,
  };
}

// ─── 2. CAPABILITY GATES, FLAGS & TRAIT LINE PROFILES ────────────────────────

export function computeCapabilityGates(state: OrionState): OrionCapabilityGates {
  const bypass = Boolean(state.bypassProgressionGates);
  const lvl = bypass ? 20 : Math.max(1, state.level);

  const maxWeaponSlots = lvl >= 13 ? 4 : lvl >= 3 ? 2 : 1;

  const unlockedSkillSlots: number[] = [0];
  if (lvl >= 4 || !state.tutorialActive) {
    unlockedSkillSlots.push(1, 2);
  }
  if (lvl >= 6) {
    unlockedSkillSlots.push(3, 4);
  }

  const canBoosterDash = bypass ? true : state.hasBoosterKit && (lvl >= 2 || !state.tutorialActive);
  const canWeaponSwap = state.equippedWeapons.length > 1;
  const heatSystemActive = lvl >= 5 || bypass;
  const energySystemActive = lvl >= 5 || bypass;
  const opticsActive = lvl >= 7 || bypass;
  const armSidearmActive = lvl >= 8 || bypass;
  const defensiveSlots = lvl >= 11 ? 3 : lvl >= 10 ? 1 : 0;

  let featSlots = 0;
  if (lvl >= 18) featSlots = 5;
  else if (lvl >= 16) featSlots = 4;
  else if (lvl >= 14) featSlots = 3;
  else if (lvl >= 12) featSlots = 2;
  else if (lvl >= 9) featSlots = 1;

  const presenceActive = lvl >= 15 || bypass;
  const coreSystemActive = lvl >= 17 || bypass;

  return {
    maxWeaponSlots,
    unlockedSkillSlots,
    canBoosterDash,
    canWeaponSwap,
    heatSystemActive,
    energySystemActive,
    opticsActive,
    armSidearmActive,
    defensiveSlots,
    featSlots,
    presenceActive,
    coreSystemActive,
  };
}

export function syncStateGates(state: OrionState): OrionCapabilityGates {
  const gates = computeCapabilityGates(state);
  state.gates = gates;

  if (state.activeWeaponIndex >= state.equippedWeapons.length) {
    state.activeWeaponIndex = 0;
    const wDef = getWeaponDefinition(state.equippedWeapons[0] || 'gladius_boltcaster');
    if (wDef) {
      state.maxAmmo = wDef.shotsPerChain;
      state.ammo = Math.min(state.ammo, state.maxAmmo);
      state.reloadDuration = wDef.reloadDurationSec;
    }
  }

  return gates;
}

export function getOrionFlag<T extends boolean | number | string>(
  state: OrionState,
  key: string,
  fallback: T
): T {
  const val = state.flags?.[key];
  return (val !== undefined ? val : fallback) as T;
}

export function setOrionFlag(
  state: OrionState,
  key: string,
  value: boolean | number | string
): void {
  if (!state.flags) {
    state.flags = {};
  }
  state.flags[key] = value;
  syncStateGates(state);
  notifyOrionStateChange();
}

export function setTutorialStateActive(state: OrionState, active: boolean): void {
  state.tutorialActive = active;
  if (!active) {
    if (!state.equippedWeapons.includes('khopesh')) {
      state.equippedWeapons.push('khopesh');
    }
    state.hasBoosterKit = true;
  }
  syncStateGates(state);
  notifyOrionStateChange();
}

export function setBypassProgressionGates(state: OrionState, bypass: boolean): void {
  state.bypassProgressionGates = bypass;
  if (bypass) {
    if (!state.equippedWeapons.includes('khopesh')) {
      state.equippedWeapons.push('khopesh');
    }
    state.hasBoosterKit = true;
  }
  syncStateGates(state);
  notifyOrionStateChange();
}

export function applyTraitLineProfile(state: OrionState, traitLine: TraitLine): void {
  const profile = TRAIT_REGISTRY[traitLine];
  if (!profile) return;

  state.traitLine = profile.id;
  state.reactor = profile.reactor;

  state.shields = {
    type: profile.baseShield.type,
    capacity: profile.baseShield.capacity,
    maxCapacity: profile.baseShield.capacity,
    overloaded: false,
    overloadTimer: 0,
    rechargeDelay: 0,
  };

  state.armor = {
    type: profile.baseArmor.type,
    threshold: profile.baseArmor.threshold,
    rating: profile.baseArmor.rating,
    durability: profile.baseArmor.durability,
    maxDurability: profile.baseArmor.durability,
  };

  syncStateGates(state);
  notifyOrionStateChange();
}

// ─── 3. 2.5D ELEVATION & COLLISION PHYSICS ───────────────────────────────────

export function isSolidAt(
  rooms: Record<string, string[]>,
  state: OrionState,
  tx: number,
  ty: number,
  z: number = 0
): boolean {
  if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
    const room = rooms[state.room];
    if (!room || !room[ty]) return true;

    const char = room[ty][tx] || '.';
    const tile = getTileDefinition(char, state.biomeId);
    if (tile.checkSolid) {
      return tile.checkSolid(state, state.room);
    }
    if (!tile.solid) return false;

    if (tile.isDesync && Math.floor(state.t / 3.5) % 2 !== 0) {
      return false;
    }

    if (tile.isChasm) {
      return false;
    }

    return z < tile.blocksHeight * 12;
  }

  const dx = tx < 0 ? -1 : tx >= COLS ? 1 : 0;
  const dy = ty < 0 ? -1 : ty >= ROWS ? 1 : 0;

  if (dx !== 0 && dy !== 0) {
    return true;
  }

  // Borderless Aether Fog doorway rule: if the perimeter tile at the edge of the current room
  // is an open doorway (non-solid), stepping across the room boundary is passable and will
  // resolve or dynamically generate the connected Aether Fog node on transition.
  const currentRoom = rooms[state.room];
  if (!currentRoom) return true;
  const edgeTx = Math.max(0, Math.min(COLS - 1, tx));
  const edgeTy = Math.max(0, Math.min(ROWS - 1, ty));
  const edgeChar = currentRoom[edgeTy]?.[edgeTx] || '#';
  const edgeTile = getTileDefinition(edgeChar, state.biomeId);

  if (edgeTile.checkSolid) {
    return edgeTile.checkSolid(state, state.room);
  }
  if (!edgeTile.solid) return false;
  if (edgeTile.isDesync && Math.floor(state.t / 3.5) % 2 !== 0) return false;
  if (edgeTile.isChasm) return false;

  return z < edgeTile.blocksHeight * 12;
}

export function moveEntityX(
  rooms: Record<string, string[]>,
  state: OrionState,
  x: number,
  y: number,
  z: number,
  dx: number,
  radius: number = 4
): number {
  if (dx === 0) return x;

  const targetX = x + dx;
  const sign = Math.sign(dx);
  const checkX = targetX + sign * radius;

  const topY = y - radius * 0.5;
  const bottomY = y + radius * 0.5;

  const tx = Math.floor(checkX / TILE_SIZE);
  const ty1 = Math.max(0, Math.min(ROWS - 1, Math.floor(topY / TILE_SIZE)));
  const ty2 = Math.max(0, Math.min(ROWS - 1, Math.floor(bottomY / TILE_SIZE)));

  if (
    isSolidAt(rooms, state, tx, ty1, z) ||
    isSolidAt(rooms, state, tx, ty2, z)
  ) {
    if (dx > 0) {
      return tx * TILE_SIZE - radius - 0.05;
    } else {
      return (tx + 1) * TILE_SIZE + radius + 0.05;
    }
  }

  return targetX;
}

export function moveEntityY(
  rooms: Record<string, string[]>,
  state: OrionState,
  x: number,
  y: number,
  z: number,
  dy: number,
  radius: number = 4
): number {
  if (dy === 0) return y;

  const targetY = y + dy;
  const sign = Math.sign(dy);
  const checkY = targetY + sign * radius * 0.5;

  const leftX = x - radius;
  const rightX = x + radius;

  const ty = Math.floor(checkY / TILE_SIZE);
  const tx1 = Math.max(0, Math.min(COLS - 1, Math.floor(leftX / TILE_SIZE)));
  const tx2 = Math.max(0, Math.min(COLS - 1, Math.floor(rightX / TILE_SIZE)));

  if (
    isSolidAt(rooms, state, tx1, ty, z) ||
    isSolidAt(rooms, state, tx2, ty, z)
  ) {
    if (dy > 0) {
      return ty * TILE_SIZE - radius * 0.5 - 0.05;
    } else {
      return (ty + 1) * TILE_SIZE + radius * 0.5 + 0.05;
    }
  }

  return targetY;
}

export function updateElevationPhysics(
  rooms: Record<string, string[]>,
  state: OrionState,
  dt: number
): void {
  if (state.isFallingIntoPit) {
    state.vz -= GRAVITY * dt * 1.5;
    state.z += state.vz * dt;
    state.onGround = false;
    return;
  }

  const tx = Math.floor(state.x / TILE_SIZE);
  const ty = Math.floor(state.y / TILE_SIZE);
  const currentRoom = rooms[state.room];
  const char = currentRoom?.[ty]?.[tx] || '.';
  const tile = getTileDefinition(char, state.biomeId);

  if (state.z > 0 || state.vz !== 0) {
    state.z += state.vz * dt;
    state.vz -= GRAVITY * dt;

    if (state.z <= 0) {
      if (tile.isChasm) {
        state.isFallingIntoPit = true;
        state.onGround = false;
        state.vz = Math.min(state.vz, -35);
      } else {
        state.z = 0;
        state.vz = 0;
        state.onGround = true;

        for (let i = 0; i < 4; i++) {
          state.particles.push({
            x: state.x + (Math.random() - 0.5) * 8,
            y: state.y + (Math.random() - 0.5) * 4,
            z: 0,
            vx: (Math.random() - 0.5) * 25,
            vy: (Math.random() - 0.5) * 15,
            vz: 8,
            life: 0.25,
            maxLife: 0.25,
            color: '#e2d4b7',
            size: 2,
            fade: true,
          });
        }
      }
    } else {
      state.onGround = false;
    }
  } else {
    if (tile.isChasm) {
      state.isFallingIntoPit = true;
      state.onGround = false;
      state.vz = -35;
    } else {
      state.z = 0;
      state.vz = 0;
      state.onGround = true;
    }
  }
}

// ─── 4. TUTORIAL ONBOARDING PROGRESSION ──────────────────────────────────────

export type TutorialStepId =
  | 'drop_pod_boot'
  | 'locate_fallen_scout'
  | 'traverse_sinkhole'
  | 'marsh_combat_trial'
  | 'unlock_perimeter_gate'
  | 'tutorial_complete';

export interface TutorialStepDescriptor {
  id: TutorialStepId;
  title: string;
  objective: string;
  targetLevel: number;
}

export const TUTORIAL_STEP_DESCRIPTORS: Record<TutorialStepId, TutorialStepDescriptor> = {
  drop_pod_boot: {
    id: 'drop_pod_boot',
    title: 'STEP 1: DROP-POD INITIALIZATION (LVL 1)',
    objective: 'Test primary movement and Gladius Skill 0 [X], or sync at Drop-Pod Crater [D].',
    targetLevel: 1,
  },
  locate_fallen_scout: {
    id: 'locate_fallen_scout',
    title: 'STEP 2: FALLEN SCOUT SALVAGE (LVL 2–3)',
    objective: 'Locate the Fallen Camelot Scout [S] to recover the Booster Kit [B] and Scout Khopesh [Y].',
    targetLevel: 2,
  },
  traverse_sinkhole: {
    id: 'traverse_sinkhole',
    title: 'STEP 3: MOBILITY & WEAPON SWAP (LVL 3)',
    objective: 'Use Jump [A] or Booster Dash [B] to cross chasms, and test Weapon Swap [Y].',
    targetLevel: 3,
  },
  marsh_combat_trial: {
    id: 'marsh_combat_trial',
    title: 'STEP 4: THREE DEFENSE LAYERS & ACTIVE SKILLS (LVL 4)',
    objective: 'Engage marsh hostiles to unlock Active Skill Slots 1–2 ([L] & [R]).',
    targetLevel: 4,
  },
  unlock_perimeter_gate: {
    id: 'unlock_perimeter_gate',
    title: 'STEP 5: PERIMETER BREAKTHROUGH',
    objective: 'Defeat the Perimeter Vanguard or use a Rusted Gate Key at Gate [G].',
    targetLevel: 4,
  },
  tutorial_complete: {
    id: 'tutorial_complete',
    title: 'M00 ONBOARDING COMPLETE',
    objective: 'Proceed into the Border Town Slums or continue exploring Belldor.',
    targetLevel: 5,
  },
};

export function getTutorialPromptOverride(
  state: OrionState,
  tileChar: string
): string | null {
  if (!state.tutorialActive) return null;

  if (tileChar === 'S') {
    const scoutKey = `scout:${state.room}`;
    if (!state.lootedCaches[scoutKey]) {
      return '[A] SALVAGE FALLEN SCOUT (BOOSTER KIT & KHOPESH · LVL 3)';
    }
  }

  return null;
}

export function handleTutorialAnchorInteraction(
  state: OrionState,
  ctx: OrionCombatContext,
  tileChar: string
): boolean {
  if (!state.tutorialActive) return false;

  if (tileChar === 'S') {
    const scoutKey = `scout:${state.room}`;
    if (!state.lootedCaches[scoutKey]) {
      state.lootedCaches[scoutKey] = true;
      state.hasBoosterKit = true;
      if (state.level < 3) {
        state.level = 3;
      }
      if (!state.equippedWeapons.includes('khopesh')) {
        state.equippedWeapons.push('khopesh');
      }
      addOrionInventoryItem(state, 'bedivere_ring', 1);
      addOrionInventoryItem(state, 'repair_kit', 1);

      setOrionFlag(state, 'scout_salvaged', true);
      state.tutorialStep = 'traverse_sinkhole';
      syncStateGates(state);

      soundSystem.playPowerup();
      ctx.say('TUTORIAL LVL 3: BOOSTER [B] & KHOPESH SWAP [Y] UNLOCKED');
      notifyOrionStateChange();
      return true;
    }
  }

  return false;
}

export function updateTutorialSystem(
  state: OrionState,
  ctx: OrionCombatContext,
  _dt: number
): void {
  if (!state.tutorialActive) return;

  syncStateGates(state);

  if (state.tutorialStep === 'drop_pod_boot' && state.room !== state.spawnAnchor.room) {
    state.tutorialStep = 'locate_fallen_scout';
    notifyOrionStateChange();
  }

  const anyRoomCleared = Object.keys(state.clearedRooms).length > 0;
  const anyCacheLooted = Object.keys(state.lootedCaches).some((k) => !k.startsWith('scout:'));

  if ((anyRoomCleared || anyCacheLooted) && !getOrionFlag(state, 'tutorial_lvl4_unlocked', false)) {
    setOrionFlag(state, 'tutorial_lvl4_unlocked', true);
    if (state.level < 4) {
      state.level = 4;
      syncStateGates(state);
      soundSystem.playPowerup();
      ctx.say('LEVEL 4 UNLOCKED: ACTIVE SKILLS [L] & [R] ONLINE');
      state.tutorialStep = 'unlock_perimeter_gate';
      notifyOrionStateChange();
    }
  }

  if (
    Object.keys(state.unlockedGates).length > 0 &&
    state.tutorialStep !== 'tutorial_complete'
  ) {
    state.tutorialStep = 'tutorial_complete';
    if (state.level < 5) {
      state.level = 5;
      syncStateGates(state);
    }
    notifyOrionStateChange();
  }
}

// ─── 5. PLAYER MOVEMENT, DUAL-MODE BOOSTER & INPUT CONTROLLER ────────────────

const Y_HOLD_SWAP_THRESHOLD_SEC = 0.32;
const B_HOLD_CONTINUOUS_THRESHOLD_SEC = 0.14;
const CONTINUOUS_BOOST_HEAT_PER_SEC = 28;

/**
 * Step player movement, pit-fall recovery, [Y] Lock-On/Weapon Swap, [B] Tap/Hold Booster,
 * [A] Jump/Interact, and Tutorial onboarding.
 * Returns `false` if the frame should early-return (e.g., plummeting into a sinkhole or rebooting).
 */
export function updatePlayerSystem(
  input: GameInput,
  rooms: Record<string, string[]>,
  state: OrionState,
  combatCtx: OrionCombatContext,
  dt: number
): boolean {
  // 0. Abyssal Sinkhole / Pit Falling & Death
  if (state.isFallingIntoPit) {
    state.isBoosterDashing = false;
    state.isContinuousBoosting = false;
    updateElevationPhysics(rooms, state, dt);

    if (Math.random() < 0.6) {
      state.particles.push({
        x: state.x + (Math.random() - 0.5) * 8,
        y: state.y + (Math.random() - 0.5) * 6,
        z: state.z,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        vz: -15,
        life: 0.3,
        maxLife: 0.3,
        color: '#090d14',
        size: 2,
        fade: true,
      });
    }

    if (state.z <= -35) {
      soundSystem.playExplosion();
      state.flickerTimer = 0.6;
      rebootAtSpawnAnchor(
        rooms,
        state,
        combatCtx,
        'FELL INTO ABYSSAL SINKHOLE · FRAME DESTROYED'
      );
    }

    updateParticles(state, dt);
    return false;
  }

  // Check player defeat: Frame Integrity collapses -> Reboot at active Spawn Anchor
  if (state.frame.integrity <= 0) {
    soundSystem.playExplosion();
    state.flickerTimer = 0.6;
    rebootAtSpawnAnchor(
      rooms,
      state,
      combatCtx,
      'FRAME DESTROYED · PILOT REBOOTED AT ANCHOR'
    );
    return false;
  }

  const gates = syncStateGates(state);

  // 1. Directional Movement & Input
  const p = input.pressed;
  const h = input.held;
  const stick = input.stick;

  let moveDx = 0;
  let moveDy = 0;

  if (h.left || stick.x < -0.2) moveDx -= 1;
  if (h.right || stick.x > 0.2) moveDx += 1;
  if (h.up || stick.y < -0.2) moveDy -= 1;
  if (h.down || stick.y > 0.2) moveDy += 1;

  const hasMoveInput = moveDx !== 0 || moveDy !== 0;
  const moveNorm = Math.hypot(moveDx, moveDy) || 1;
  const normMoveX = hasMoveInput ? moveDx / moveNorm : 0;
  const normMoveY = hasMoveInput ? moveDy / moveNorm : 0;

  if (hasMoveInput && state.lockedTargetId === null) {
    state.faceX = normMoveX;
    state.faceY = normMoveY;
    state.dir = getDirFromVector(moveDx, moveDy);
  }

  // 1B. [Y] Button Multi-Function: Tap Y = Lock-On Target, Hold Y (>= 0.32s) = Weapon Swap
  if (h.y) {
    state.yHoldTimer = (state.yHoldTimer || 0) + dt;
    if (state.yHoldTimer >= Y_HOLD_SWAP_THRESHOLD_SEC && !state.yHoldTriggeredSwap) {
      state.yHoldTriggeredSwap = true;
      performWeaponSwap(state, combatCtx);
    }
    state.wasYHeld = true;
  } else if (state.wasYHeld) {
    if (!state.yHoldTriggeredSwap) {
      cycleTargetLock(state, combatCtx);
    }
    state.yHoldTimer = 0;
    state.yHoldTriggeredSwap = false;
    state.wasYHeld = false;
  }

  updateTargetLock(state);

  // 2. [B] Button Dual-Mode Boost (Tap Burst + Hold Continuous Boost)
  if (p.b) {
    state.bHoldTimer = 0;
    if (!gates.canBoosterDash) {
      soundSystem.playMenuBeep();
      combatCtx.say('BOOSTER KIT OFFLINE — SALVAGE FALLEN SCOUT [S]');
      notifyOrionStateChange();
    } else if (state.heat >= state.maxHeat) {
      soundSystem.playMenuBeep();
      combatCtx.say('REACTOR OVERHEATED — VENT HEAT BEFORE BOOSTING');
      notifyOrionStateChange();
    } else if (state.boosterCooldown <= 0) {
      state.isBoosterDashing = true;
      state.boosterTimer = BOOSTER_DASH_DURATION;
      state.boosterCooldown = BOOSTER_DASH_COOLDOWN * 0.65;
      state.heat = Math.min(state.maxHeat, state.heat + BOOSTER_HEAT_COST * 0.7);

      const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
      state.boosterDirX = hasMoveInput ? normMoveX : state.faceX || dirInfo.dx;
      state.boosterDirY = hasMoveInput ? normMoveY : state.faceY || dirInfo.dy;
      soundSystem.playDash();

      for (let i = 0; i < 4; i++) {
        state.particles.push({
          x: state.x - state.boosterDirX * 6 + (Math.random() - 0.5) * 4,
          y: state.y - state.boosterDirY * 6 + (Math.random() - 0.5) * 4,
          z: state.z + 4,
          vx: -state.boosterDirX * 30 + (Math.random() - 0.5) * 10,
          vy: -state.boosterDirY * 30 + (Math.random() - 0.5) * 10,
          vz: 4,
          life: 0.25,
          maxLife: 0.25,
          color: '#77c7ff',
          size: 2,
          fade: true,
        });
      }
    }
  }

  if (h.b && gates.canBoosterDash) {
    state.bHoldTimer = (state.bHoldTimer || 0) + dt;
    if (state.bHoldTimer >= B_HOLD_CONTINUOUS_THRESHOLD_SEC && state.heat < state.maxHeat) {
      state.isContinuousBoosting = true;
      state.isBoosterDashing = true;
      const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
      state.boosterDirX = hasMoveInput ? normMoveX : state.boosterDirX || dirInfo.dx;
      state.boosterDirY = hasMoveInput ? normMoveY : state.boosterDirY || dirInfo.dy;

      state.heat = Math.min(state.maxHeat, state.heat + CONTINUOUS_BOOST_HEAT_PER_SEC * dt);

      if (Math.random() < 0.75) {
        state.particles.push({
          x: state.x - state.boosterDirX * 6 + (Math.random() - 0.5) * 4,
          y: state.y - state.boosterDirY * 6 + (Math.random() - 0.5) * 4,
          z: state.z + 4,
          vx: -state.boosterDirX * 35 + (Math.random() - 0.5) * 12,
          vy: -state.boosterDirY * 35 + (Math.random() - 0.5) * 12,
          vz: 3,
          life: 0.2,
          maxLife: 0.2,
          color: state.heat > 80 ? '#f97316' : '#38bdf8',
          size: 2,
          fade: true,
        });
      }

      if (state.heat >= state.maxHeat) {
        state.isContinuousBoosting = false;
        state.isBoosterDashing = false;
        state.boosterCooldown = 0.85;
        soundSystem.playMenuBeep();
        combatCtx.say('REACTOR OVERHEAT — CONTINUOUS BOOST CUT!');
        notifyOrionStateChange();
      }
    }
  } else {
    if (state.isContinuousBoosting) {
      state.isContinuousBoosting = false;
      state.isBoosterDashing = false;
    }
    state.bHoldTimer = 0;
  }

  // Execute Movement
  if (state.isBoosterDashing) {
    if (!state.isContinuousBoosting) {
      state.boosterTimer -= dt;
      if (state.boosterTimer <= 0) {
        state.isBoosterDashing = false;
      }
    }
    const boostSpeed = state.isContinuousBoosting ? BOOSTER_SPEED * 0.88 : BOOSTER_SPEED;
    const step = boostSpeed * dt;
    state.x = moveEntityX(rooms, state, state.x, state.y, state.z, state.boosterDirX * step);
    state.y = moveEntityY(rooms, state, state.x, state.y, state.z, state.boosterDirY * step);
  } else if (hasMoveInput) {
    const tx = Math.floor(state.x / TILE_SIZE);
    const ty = Math.floor(state.y / TILE_SIZE);
    const curChar = rooms[state.room]?.[ty]?.[tx] || '.';
    const inMud = curChar === '~' && state.z <= 0;
    const biomeMudMult =
      getBiomeDefinition(state.biomeId).tileRules?.mudSlowMultiplier ?? MUD_SPEED_PENALTY;
    const speed = WALK_SPEED * (inMud ? biomeMudMult : 1.0);

    const stepX = normMoveX * speed * dt;
    const stepY = normMoveY * speed * dt;

    state.x = moveEntityX(rooms, state, state.x, state.y, state.z, stepX);
    state.y = moveEntityY(rooms, state, state.x, state.y, state.z, stepY);
  }

  // Update 2.5D vertical height z physics
  updateElevationPhysics(rooms, state, dt);

  if (state.isFallingIntoPit) {
    state.isBoosterDashing = false;
    return false;
  }

  // 3. Jump (A button) or Execute Interactive World Anchor
  if (p.a && !state.isBoosterDashing) {
    const tx = Math.floor(state.x / TILE_SIZE);
    const ty = Math.floor(state.y / TILE_SIZE);
    const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
    const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
    const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);
    const roomData = rooms[state.room];
    const facingTile = roomData?.[ay]?.[ax] || '.';
    const currentTileKey = `${state.room}:${tx},${ty}:${facingTile}`;

    const didInteract = executeWorldInteraction(rooms, state, combatCtx);
    if (didInteract) {
      state.dismissedPromptKey = currentTileKey;
      soundSystem.playSelect();
      notifyOrionStateChange();
    } else if (state.onGround) {
      state.vz = JUMP_VELOCITY;
      state.onGround = false;
      soundSystem.playJump();
    }
  }

  updateTutorialSystem(state, combatCtx, dt);
  return true;
}
