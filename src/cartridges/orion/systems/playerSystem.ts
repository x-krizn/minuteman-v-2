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
  DIR_VECTORS,
  getDirFromVector,
  getRoomDimensions,
  GRAVITY,
  JUMP_VELOCITY,
  MUD_SPEED_PENALTY,
  RoomDimensions,
  TILE_SIZE,
  WALK_SPEED,
} from '../constants';
import { TRAIT_REGISTRY } from '../database/characters';
import {
  ACTION_MODIFICATION_CATALOG,
  computeEffectiveLoadCapacity,
  computeInterfaceFeatModifiers,
  computeLoadPenalty,
  computeUnlockedFeatTiers,
  createInitialEquipmentSlots,
  createInitialPilotSkills,
  createStarterGemPouch,
  GEMSTONE_REGISTRY,
  getLevelBand,
  getWeaponGemCombatModifiers,
  isStandardProgressionUnlocked,
  normalizePilotSkills,
  syncPostTutorialFrameLevel,
  unlockLevel2SecondaryWeapon,
} from '../database/progression';
import { getWeaponDefinition } from '../database/weapons';
import { getBiomeDefinition, getTileDefinition } from '../database/world';
import {
  OrionCapabilityGates,
  OrionCombatContext,
  OrionSavedPilotEntry,
  OrionState,
  TraitLine,
} from '../types';
import { updateTargetLock } from './combatSystem';
import { spawnRoomEnemies, updateParticles } from './entitySystem';
import {
  executeWorldInteraction,
  rebootAtSpawnAnchor,
  rehydrateAetherFogRooms,
  syncRoomHierarchyState,
} from './worldSystem';

// ─── 1. REACTIVE STATE STORE & PERSISTENCE ───────────────────────────────────

const ORION_ACTIVE_SAVE_KEY = 'orion_save_slot_canonical';
const ORION_PILOT_ROSTER_KEY = 'orion_pilot_roster_v1';

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

export function getActiveRoomBounds(
  state: OrionState,
  rooms?: Record<string, string[]> | null
): RoomDimensions {
  const mapRef = rooms || orionRoomsRef;
  return getRoomDimensions(mapRef?.[state.room]);
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

function serializeOrionSaveData(state: OrionState) {
  if (!state.pilotId) {
    state.pilotId = `pilot_${state.traitLine.toLowerCase()}_${state.pilotName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')}`;
  }
  return {
    pilotId: state.pilotId,
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
    socketedFeatGems: state.socketedFeatGems || {},
    pilotSkills: state.pilotSkills,
    equipmentSlots: state.equipmentSlots,
    presence: state.presence,
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
}

function applySerializedSaveDataToState(
  state: OrionState,
  data: Record<string, any>
): void {
  state.pilotId = data.pilotId ?? state.pilotId;
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
  if (data.socketedFeatGems && typeof data.socketedFeatGems === 'object') {
    state.socketedFeatGems = data.socketedFeatGems;
  } else {
    state.socketedFeatGems = state.socketedFeatGems || {};
  }
  state.pilotSkills = normalizePilotSkills(data.pilotSkills ?? state.pilotSkills);
  if (data.equipmentSlots && typeof data.equipmentSlots === 'object') {
    state.equipmentSlots = {
      ...createInitialEquipmentSlots(state.traitLine),
      ...data.equipmentSlots,
    };
  }
  state.presence = data.presence ?? state.presence ?? 100;
  state.hasBoosterKit = data.hasBoosterKit ?? state.hasBoosterKit;
  state.salvageScrap = data.salvageScrap ?? state.salvageScrap;
  state.inventorySlots = consolidateInventorySlots(
    data.inventorySlots ?? state.inventorySlots
  );
  // Backfill starter Gem Pouch for legacy saves created prior to the Nine-Gemstone update
  const hasAnyInventoryGem = state.inventorySlots.some((s) => s.itemId in GEMSTONE_REGISTRY);
  const hasAnySocketedGem = Object.keys(state.socketedFeatGems || {}).length > 0;
  const hasAnyInvestedGem = Object.values(state.pilotSkills || {}).some(
    (sk) => (sk.gemsInvested || 0) > 0 || sk.level > 1
  );
  if (!hasAnyInventoryGem && !hasAnySocketedGem && !hasAnyInvestedGem) {
    state.inventorySlots = consolidateInventorySlots([
      ...state.inventorySlots,
      ...createStarterGemPouch(state.traitLine),
    ]);
  }
  state.clearedRooms = data.clearedRooms ?? state.clearedRooms;
  state.lootedCaches = data.lootedCaches ?? state.lootedCaches;
  state.unlockedGates = data.unlockedGates ?? state.unlockedGates;
  state.incursionEnabled = data.incursionEnabled ?? state.incursionEnabled;
  state.tutorialActive = data.tutorialActive ?? state.tutorialActive;
  state.tutorialStep = data.tutorialStep ?? state.tutorialStep;
  state.bypassProgressionGates =
    data.bypassProgressionGates ?? state.bypassProgressionGates;
  state.flags = data.flags ?? state.flags;
  state.spawnAnchor = data.spawnAnchor ?? state.spawnAnchor;
  state.regionId = data.regionId ?? state.regionId;
  state.areaId = data.areaId ?? state.areaId;
  state.mapId = data.mapId ?? state.mapId;
  state.biomeId = data.biomeId ?? state.biomeId;
  if (Array.isArray(data.discoveredWaystations)) {
    state.discoveredWaystations = data.discoveredWaystations.filter(
      (id: string) => id !== 'ws_bog_drop_pod'
    );
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
}

export function loadPilotRoster(): OrionSavedPilotEntry[] {
  try {
    const raw = localStorage.getItem(ORION_PILOT_ROSTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      }
    }
    // Migrate single canonical slot into roster if present
    const legacyRaw = localStorage.getItem(ORION_ACTIVE_SAVE_KEY);
    if (legacyRaw) {
      const data = JSON.parse(legacyRaw);
      const trait = TRAIT_REGISTRY[(data.traitLine as TraitLine) || 'Warrior'] || TRAIT_REGISTRY.Warrior;
      const entry: OrionSavedPilotEntry = {
        pilotId: data.pilotId || `pilot_${(data.traitLine || 'warrior').toLowerCase()}_default`,
        pilotName: data.pilotName || 'Pilot Vane',
        traitLine: data.traitLine || 'Warrior',
        frameModel: trait.frameModel || 'PNSY W416',
        reactor: data.reactor || trait.reactor,
        level: data.level || 1,
        areaId: data.areaId || 'm00_the_bog',
        room: data.room || '0,0',
        tutorialActive: Boolean(data.tutorialActive ?? true),
        updatedAt: Date.now(),
        savedDataJson: legacyRaw,
      };
      localStorage.setItem(ORION_PILOT_ROSTER_KEY, JSON.stringify([entry]));
      return [entry];
    }
    return [];
  } catch {
    return [];
  }
}

export function saveOrionGame(state: OrionState): boolean {
  try {
    const saveData = serializeOrionSaveData(state);
    const json = JSON.stringify(saveData);
    localStorage.setItem(ORION_ACTIVE_SAVE_KEY, json);

    // Also upsert into the §2.4 Pilot Character Roster
    const roster = loadPilotRoster();
    const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
    const entry: OrionSavedPilotEntry = {
      pilotId: saveData.pilotId,
      pilotName: state.pilotName,
      traitLine: state.traitLine,
      frameModel: trait.frameModel || 'PNSY W416',
      reactor: state.reactor,
      level: state.level,
      areaId: state.areaId,
      room: state.room,
      tutorialActive: state.tutorialActive,
      updatedAt: Date.now(),
      savedDataJson: json,
    };
    const nextRoster = [
      entry,
      ...roster.filter((r) => r.pilotId !== entry.pilotId),
    ].slice(0, 12);
    localStorage.setItem(ORION_PILOT_ROSTER_KEY, JSON.stringify(nextRoster));
    return true;
  } catch {
    return false;
  }
}

export function loadOrionGame(state: OrionState): boolean {
  try {
    const raw = localStorage.getItem(ORION_ACTIVE_SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    applySerializedSaveDataToState(state, data);
    state.atTitleMenu = false;
    syncRoomHierarchyState(state);
    if (orionRoomsRef) {
      spawnRoomEnemies(orionRoomsRef, state);
    }
    syncStateGates(state);
    notifyOrionStateChange();
    return true;
  } catch {
    return false;
  }
}

export function loadPilotFromRoster(state: OrionState, pilotId: string): boolean {
  try {
    const roster = loadPilotRoster();
    const target = roster.find((r) => r.pilotId === pilotId);
    if (!target) return false;
    const data = JSON.parse(target.savedDataJson);
    applySerializedSaveDataToState(state, data);
    state.atTitleMenu = false;
    localStorage.setItem(ORION_ACTIVE_SAVE_KEY, target.savedDataJson);
    syncRoomHierarchyState(state);
    if (orionRoomsRef) {
      spawnRoomEnemies(orionRoomsRef, state);
    }
    syncStateGates(state);
    notifyOrionStateChange();
    return true;
  } catch {
    return false;
  }
}

export function deletePilotFromRoster(pilotId: string): OrionSavedPilotEntry[] {
  try {
    const roster = loadPilotRoster().filter((r) => r.pilotId !== pilotId);
    localStorage.setItem(ORION_PILOT_ROSTER_KEY, JSON.stringify(roster));
    return roster;
  } catch {
    return [];
  }
}

/**
 * §2.4 Pilot Creation (LOCKED):
 * Created at New Game: trait line selection, then pilot name, then start at Level 1
 * in the starting zone (M00 The Bog 0,0) with that trait line's default loadout.
 */
export function createNewPilotGame(
  state: OrionState,
  traitLine: TraitLine,
  pilotName: string
): void {
  const cleanName = pilotName.trim() || `Pilot ${traitLine}`;
  const fresh = createInitialOrionState(traitLine, cleanName);
  fresh.pilotId = `pilot_${traitLine.toLowerCase()}_${Date.now().toString(36)}`;
  fresh.atTitleMenu = false;

  Object.assign(state, fresh);
  syncRoomHierarchyState(state);
  if (orionRoomsRef) {
    spawnRoomEnemies(orionRoomsRef, state);
  }
  syncStateGates(state);
  saveOrionGame(state);
  notifyOrionStateChange();
}

export function createInitialOrionState(
  traitLine: TraitLine = 'Warrior',
  pilotName: string = 'Pilot Vane'
): OrionState {
  const defaultTrait = TRAIT_REGISTRY[traitLine] || TRAIT_REGISTRY.Warrior;
  const startingWeapons =
    defaultTrait.startingWeapons?.length >= 2
      ? [...defaultTrait.startingWeapons]
      : ['gladius_boltcaster', 'khopesh'];
  const primaryWeaponDef = getWeaponDefinition(startingWeapons[0]);
  return {
    pilotId: `pilot_${traitLine.toLowerCase()}_${pilotName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')}`,
    regionId: 'region_belldor_outskirts',
    areaId: 'm00_the_bog',
    mapId: 'map_bog_drop_zone',
    biomeId: 'belldor_bog',
    room: '-3,0',
    rx: -3,
    ry: 0,
    discoveredWaystations: [],
    discoveredWaygates: [],

    x: 72,
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

    pilotName,
    traitLine,
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

    equippedWeapons: [startingWeapons[0]],
    activeWeaponIndex: 0,
    weaponSwapCooldown: 0,

    ammo: primaryWeaponDef?.shotsPerChain ?? 9,
    maxAmmo: primaryWeaponDef?.shotsPerChain ?? 9,
    isReloading: false,
    reloadTimer: 0,
    reloadDuration: primaryWeaponDef?.reloadDurationSec ?? 3.15,
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

    hasBoosterKit: true,
    isBoosterDashing: false,
    isContinuousBoosting: false,
    bHoldTimer: 0,
    boosterTimer: 0,
    boosterCooldown: 0,
    boosterDirX: 0,
    boosterDirY: 1,

    salvageScrap: 0,
    inventorySlots: consolidateInventorySlots([
      { itemId: 'repair_kit', count: 2 },
      { itemId: 'grail_water', count: 1 },
      { itemId: 'spinel_flask', count: 1 },
      { itemId: 'kyanite_flask', count: 1 },
      ...createStarterGemPouch(traitLine),
    ]),
    equippedFeats: [],
    socketedFeatGems: {},
    pilotSkills: createInitialPilotSkills(),
    equipmentSlots: createInitialEquipmentSlots(traitLine),
    presence: 100,

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
      room: '-3,0',
      x: 72,
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
    atTitleMenu: true,
  };
}

// ─── 2. CAPABILITY GATES, FLAGS & TRAIT LINE PROFILES ────────────────────────

export function computeCapabilityGates(state: OrionState): OrionCapabilityGates {
  const bypass = Boolean(state.bypassProgressionGates);
  const lvl = bypass ? 20 : Math.max(1, state.level);
  const levelBand = getLevelBand(lvl);
  const standardProgressionUnlocked = isStandardProgressionUnlocked(state);

  // §5 Level Sequence (LOCKED):
  // L1 (Enter Bog): Weapon Set 1 Action 1, Basic Dash, Belt Slots 1-2, Torso
  // L2 (Poe Interaction): Weapon Set 1 Action 2, Weapon Set 2 Action 1, Weapon Swap, Legs Slot, Belt Slots 3-4
  // L3 (Enter Border Town): Weapon Set 1 Actions 3-5, Weapon Set 2 Action 2, Head Slot
  // L4 (Border Town Midpoint): Generator Slot, Weapon Set 2 Actions 3-5, Aux Slots 1-2
  // L5 (Border Town Benchmark): Arms Slot, Aux Slots 3-4
  // L6 (Border Town Complete): Utility Slot active (Action 6) + Class Default Utility Item
  const set1UnlockedActions =
    lvl >= 3 || !state.tutorialActive ? [1, 2, 3, 4, 5] : lvl >= 2 ? [1, 2] : [1];
  const set2UnlockedActions =
    lvl >= 4 || !state.tutorialActive ? [1, 2, 3, 4, 5] : lvl >= 3 ? [1, 2] : lvl >= 2 ? [1] : [];

  const isWeaponSet2Active = state.activeWeaponIndex > 0;
  const activeSetActions = isWeaponSet2Active ? set2UnlockedActions : set1UnlockedActions;
  const unlockedSkillSlots = activeSetActions.map((a) => a - 1);

  const maxWeaponSlots = lvl >= 13 ? 4 : lvl >= 2 || !state.tutorialActive ? 2 : 1;
  const beltSlotsUnlocked = lvl >= 2 || bypass ? 4 : 2;
  const auxSlotsUnlocked = lvl >= 5 || bypass ? 4 : lvl >= 4 ? 2 : 0;

  const utilitySlotActive = lvl >= 6 || bypass;
  const legsSlotActive = lvl >= 2 || bypass || state.hasBoosterKit;
  const headSlotActive = lvl >= 3 || bypass;
  const generatorSlotActive = lvl >= 4 || bypass;
  const armsSlotActive = lvl >= 5 || bypass;

  // Basic Dash is online at Level 1 (Enter Bog); Legs slot unlocks at Level 2
  const canBoosterDash = true;
  const canWeaponSwap =
    (lvl >= 2 || !state.tutorialActive || bypass) &&
    Boolean(
      state.equipmentSlots?.slot2 ||
        state.equipmentSlots?.slot3 ||
        state.equippedWeapons.length > 1
    );
  const heatSystemActive = generatorSlotActive;
  const energySystemActive = generatorSlotActive;
  const opticsActive = headSlotActive;
  const armSidearmActive = armsSlotActive;
  const defensiveSlots = auxSlotsUnlocked;

  const unlockedFeatTiers = computeUnlockedFeatTiers(state.pilotSkills, bypass);
  const featSlots = unlockedFeatTiers.length;

  const presenceActive = lvl >= 11 || bypass;
  const coreSystemActive = lvl >= 17 || bypass;

  const effectiveLoadCapacity = computeEffectiveLoadCapacity(
    state.traitLine,
    state.equippedFeats || []
  );
  const currentWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const activeWeapon = getWeaponDefinition(currentWeaponId);
  const activeWeaponWeight = activeWeapon?.weightClass || 'medium';
  const loadPenalty = computeLoadPenalty(effectiveLoadCapacity, activeWeaponWeight);

  return {
    levelBand,
    standardProgressionUnlocked,
    maxWeaponSlots,
    unlockedSkillSlots,
    set1UnlockedActions,
    set2UnlockedActions,
    beltSlotsUnlocked,
    auxSlotsUnlocked,
    utilitySlotActive,
    legsSlotActive,
    headSlotActive,
    generatorSlotActive,
    armsSlotActive,
    canBoosterDash,
    canWeaponSwap,
    heatSystemActive,
    energySystemActive,
    opticsActive,
    armSidearmActive,
    defensiveSlots,
    featSlots,
    unlockedFeatTiers,
    presenceActive,
    coreSystemActive,
    effectiveLoadCapacity,
    activeWeaponWeight,
    loadPenalty,
  };
}

export function syncStateGates(state: OrionState): OrionCapabilityGates {
  if (!state.pilotSkills) {
    state.pilotSkills = createInitialPilotSkills();
  }
  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  state.equipmentSlots.unlockedEquipment = state.equipmentSlots.unlockedEquipment || [];
  for (const eqId of state.equippedWeapons || []) {
    if (eqId && !state.equipmentSlots.unlockedEquipment.includes(eqId)) {
      state.equipmentSlots.unlockedEquipment.push(eqId);
    }
  }
  if (!state.equipmentSlots.unlockedEquipment.includes('aether_catalyst')) {
    state.equipmentSlots.unlockedEquipment.push('aether_catalyst');
  }

  // Advance Frame Level 6..20 naturally from Gemstone investments, Feats, Mods & Bosses
  syncPostTutorialFrameLevel(state);

  if (
    (state.level >= 2 || !state.tutorialActive || state.bypassProgressionGates) &&
    state.equippedWeapons.length < 2
  ) {
    unlockLevel2SecondaryWeapon(state);
  }

  const profile = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;

  state.equipmentSlots.slot1 =
    state.equipmentSlots.slot1 || state.equippedWeapons[0] || 'long_sword';
  if (state.equipmentSlots.slot2 === undefined) {
    state.equipmentSlots.slot2 = state.equippedWeapons[1] || null;
  }
  if (state.equipmentSlots.slot3 === undefined) {
    state.equipmentSlots.slot3 = 'repair_kit';
  }
  if (state.equipmentSlots.slot1 === 'great_bow') {
    state.equipmentSlots.mainGrip = '2h';
  } else if (!state.equipmentSlots.mainGrip) {
    state.equipmentSlots.mainGrip = '1h';
  }
  state.equipmentSlots.head =
    state.equipmentSlots.head || `${profile.frameModel || 'Mark-IV'} Sensor Visor`;
  state.equipmentSlots.arms =
    state.equipmentSlots.arms || `${profile.frameModel || 'Mark-IV'} Actuator Vambraces`;
  state.equipmentSlots.plating =
    state.equipmentSlots.plating ||
    `${profile.frameModel || 'Mark-IV'} ${profile.baseArmor.type} Plating`;
  state.equipmentSlots.utility = state.equipmentSlots.utility || 'utility_ichor_surge';

  state.equipmentSlots.weaponSet1 = [
    state.equipmentSlots.slot1 || 'gladius_boltcaster',
    state.equipmentSlots.weaponSet1?.[1] || null,
  ];
  state.equipmentSlots.weaponSet2 = [
    state.equipmentSlots.slot2 || '',
    state.equipmentSlots.weaponSet2?.[1] || null,
  ];

  // Apply Static Budget Interface Feat Modifiers + Equipped Shield Passive Bonuses + Titanite Gem Bonus to Max Shield
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const allGear = [
    state.equipmentSlots.slot1,
    state.equipmentSlots.slot2,
    state.equipmentSlots.slot3,
  ].filter((id): id is string => Boolean(id));
  const shieldBonusFromGear = allGear.reduce((sum, wId) => {
    const def = getWeaponDefinition(wId);
    const gemMod = getWeaponGemCombatModifiers(state, wId);
    return sum + (def?.passiveShieldBonus || 0) + gemMod.maxShieldBonus;
  }, 0);
  const targetMaxShield = Math.max(
    0,
    profile.baseShield.capacity + featMods.shieldCapDelta + shieldBonusFromGear
  );
  if (state.shields.maxCapacity !== targetMaxShield) {
    const diff = targetMaxShield - state.shields.maxCapacity;
    state.shields.maxCapacity = targetMaxShield;
    if (diff > 0) {
      state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + diff);
    } else {
      state.shields.capacity = Math.min(state.shields.capacity, state.shields.maxCapacity);
    }
  }

  const targetMaxArmor = Math.max(
    10,
    profile.baseArmor.durability + featMods.armorDurabilityDelta
  );
  if (state.armor.maxDurability !== targetMaxArmor) {
    state.armor.maxDurability = targetMaxArmor;
    state.armor.durability = Math.min(state.armor.durability, state.armor.maxDurability);
  }

  const gates = computeCapabilityGates(state);
  state.gates = gates;

  if (state.activeWeaponIndex >= state.equippedWeapons.length) {
    state.activeWeaponIndex = 0;
  }

  const activeWId =
    state.equipmentSlots.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const activeWDef = getWeaponDefinition(activeWId);
  if (activeWDef) {
    const hasQuiverSynergy =
      activeWDef.equipmentRole === 'ranged' &&
      (state.equippedWeapons.includes('quiver') || state.equipmentSlots.slot3 === 'quiver');
    const activeGemMod = getWeaponGemCombatModifiers(state, activeWId);
    const targetMaxAmmo =
      activeWDef.shotsPerChain +
      (hasQuiverSynergy ? 3 : 0) +
      activeGemMod.bonusMaxAmmo;
    if (state.maxAmmo !== targetMaxAmmo) {
      state.maxAmmo = targetMaxAmmo;
      state.ammo = Math.min(state.ammo, state.maxAmmo);
    }
    state.reloadDuration = activeWDef.reloadDurationSec * (hasQuiverSynergy ? 0.75 : 1.0);
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
    unlockLevel2SecondaryWeapon(state);
    state.hasBoosterKit = true;
  }
  syncStateGates(state);
  notifyOrionStateChange();
}

export function setBypassProgressionGates(state: OrionState, bypass: boolean): void {
  state.bypassProgressionGates = bypass;
  if (bypass) {
    unlockLevel2SecondaryWeapon(state);
    state.hasBoosterKit = true;
  }
  syncStateGates(state);
  notifyOrionStateChange();
}

export function applyTraitLineProfile(state: OrionState, traitLine: TraitLine): void {
  const profile = TRAIT_REGISTRY[traitLine];
  if (!profile) return;

  const prevUnlockedMods = state.equipmentSlots?.unlockedMods || [];
  const prevInstalledMods = state.equipmentSlots?.installedMods || {};
  const prevWeaponGemMods = state.equipmentSlots?.weaponGemMods || {};
  const prevUnlockedEquip = state.equipmentSlots?.unlockedEquipment || [];
  const prevBelt = state.equipmentSlots?.belt;

  state.traitLine = profile.id;
  state.reactor = profile.reactor;
  const hasSet2 =
    state.level >= 2 || !state.tutorialActive || Boolean(state.bypassProgressionGates);
  if (profile.startingWeapons && profile.startingWeapons.length >= 2) {
    state.equippedWeapons = hasSet2
      ? [...profile.startingWeapons]
      : [profile.startingWeapons[0]];
    state.activeWeaponIndex = 0;
  }
  const mergedUnlockedEquip = Array.from(
    new Set([
      ...prevUnlockedEquip,
      ...state.equippedWeapons,
    ])
  );
  state.equipmentSlots = {
    ...createInitialEquipmentSlots(profile.id),
    unlockedMods: [...prevUnlockedMods],
    installedMods: { ...prevInstalledMods },
    weaponGemMods: { ...prevWeaponGemMods },
    unlockedEquipment: mergedUnlockedEquip,
    ...(prevBelt ? { belt: prevBelt } : {}),
  };

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
  const currentRoom = rooms[state.room];
  const { cols, rows } = getRoomDimensions(currentRoom);

  if (tx >= 0 && tx < cols && ty >= 0 && ty < rows) {
    if (!currentRoom || !currentRoom[ty]) return true;

    const char = currentRoom[ty][tx] || '.';
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

  const dx = tx < 0 ? -1 : tx >= cols ? 1 : 0;
  const dy = ty < 0 ? -1 : ty >= rows ? 1 : 0;

  if (dx !== 0 && dy !== 0) {
    return true;
  }

  // Borderless Aether Fog doorway rule: if the perimeter tile at the edge of the current room
  // is an open doorway (non-solid), stepping across the room boundary is passable and will
  // resolve or dynamically generate the connected Aether Fog node on transition.
  if (!currentRoom) return true;
  const edgeTx = Math.max(0, Math.min(cols - 1, tx));
  const edgeTy = Math.max(0, Math.min(rows - 1, ty));
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

  const { rows } = getRoomDimensions(rooms[state.room]);
  const targetX = x + dx;
  const sign = Math.sign(dx);
  const checkX = targetX + sign * radius;

  const topY = y - radius * 0.5;
  const bottomY = y + radius * 0.5;

  const tx = Math.floor(checkX / TILE_SIZE);
  const ty1 = Math.max(0, Math.min(rows - 1, Math.floor(topY / TILE_SIZE)));
  const ty2 = Math.max(0, Math.min(rows - 1, Math.floor(bottomY / TILE_SIZE)));

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

  const { cols } = getRoomDimensions(rooms[state.room]);
  const targetY = y + dy;
  const sign = Math.sign(dy);
  const checkY = targetY + sign * radius * 0.5;

  const leftX = x - radius;
  const rightX = x + radius;

  const ty = Math.floor(checkY / TILE_SIZE);
  const tx1 = Math.max(0, Math.min(cols - 1, Math.floor(leftX / TILE_SIZE)));
  const tx2 = Math.max(0, Math.min(cols - 1, Math.floor(rightX / TILE_SIZE)));

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

// ─── 4. TUTORIAL ONBOARDING PROGRESSION (§5 LEVEL SEQUENCE 1–6) ──────────────

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
    title: 'LV 1 (ENTER BOG): SET 1 ACTION 1, BASIC DASH [B], BELT 1–2, TORSO',
    objective: 'Test Basic Dash [B] and Set 1 Action 1 [X], then locate Bedivere [S] or The Poe [3,0].',
    targetLevel: 1,
  },
  locate_fallen_scout: {
    id: 'locate_fallen_scout',
    title: 'LV 2 (POE / SCOUT): SET 1 ACTION 2, SET 2 ACTION 1, SWAP [Y], LEGS, BELT 3–4',
    objective: 'Interact with The Poe [3,0] or Bedivere [S] to unlock Weapon Swap [Y], Legs Slot & Belt 3–4.',
    targetLevel: 2,
  },
  traverse_sinkhole: {
    id: 'traverse_sinkhole',
    title: 'LV 3 (ENTER BORDER TOWN): SET 1 ACTIONS 3–5, SET 2 ACTION 2, HEAD SLOT',
    objective: 'Unseal the Bog Exit [G] and enter Camelot Border Town [4,0] to bring Head Slot & Set 1 Actions 3–5 online.',
    targetLevel: 3,
  },
  marsh_combat_trial: {
    id: 'marsh_combat_trial',
    title: 'LV 4 (BORDER TOWN MIDPOINT): GENERATOR, SET 2 ACTIONS 3–5, AUX 1–2',
    objective: 'Clear a Border Town sector, activate a Grail Switch, or survive the Orc Raid for Generator & Aux 1–2.',
    targetLevel: 4,
  },
  unlock_perimeter_gate: {
    id: 'unlock_perimeter_gate',
    title: 'LV 5 (BORDER TOWN BENCHMARK): ARMS SLOT & AUX SLOTS 3–4',
    objective: 'Engage the Knights or gather 2 Grail Fragments / Switches / Trust for Arms Slot & Aux 3–4.',
    targetLevel: 5,
  },
  tutorial_complete: {
    id: 'tutorial_complete',
    title: 'LV 6 (BORDER TOWN COMPLETE): UTILITY SLOT (ACTION 6) & GEM PROGRESSION ONLINE',
    objective: 'Lesson band complete. Spend Gems to level Pilot Skills, socket Feat Nodes & craft Equipment Mods.',
    targetLevel: 6,
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
      return '[A] EXAMINE FALLEN KNIGHT';
    }
  }

  return null;
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

  // Level 2 Fixed Event: Poe Interaction or Fallen Scout salvage
  const poeResolved = Boolean(state.flags?.poe_state && state.flags.poe_state !== 'unmet');
  const scoutSalvaged = Boolean(state.flags?.scout_salvaged);
  if ((poeResolved || scoutSalvaged) && state.level < 2) {
    state.level = 2;
    state.hasBoosterKit = true;
    unlockLevel2SecondaryWeapon(state);
    state.tutorialStep = 'traverse_sinkhole';
    syncStateGates(state);
    soundSystem.playPowerup();
    ctx.say('LEVEL 2 (POE INTERACTION): SET 1 ACT 2, SET 2 ACT 1, SWAP [Y], LEGS & BELT 3–4');
    notifyOrionStateChange();
  }

  // Level 3 Fixed Event: Enter Border Town (or unseal Bog Gate)
  const enteredBorderTown =
    state.areaId === 'camelot_border_town' || Object.keys(state.unlockedGates).length > 0;
  if (enteredBorderTown && state.level < 3) {
    state.level = 3;
    state.tutorialStep = 'marsh_combat_trial';
    syncStateGates(state);
    soundSystem.playPowerup();
    ctx.say('LEVEL 3 (ENTER BORDER TOWN): SET 1 ACTIONS 3–5, SET 2 ACTION 2 & HEAD SLOT');
    notifyOrionStateChange();
  }

  // Level 4 Fixed Event: Border Town Midpoint (Switch, Raid, or Combat Clear after Lv 3)
  const switches = Number(state.flags?.dungeon_switches || 0);
  const fragments = Number(state.flags?.grail_fragments || 0);
  const trust = Number(state.flags?.town_trust || 0);
  const midpointReached =
    switches >= 1 ||
    fragments >= 1 ||
    trust >= 1 ||
    Boolean(state.flags?.orc_raid_active) ||
    (state.areaId === 'camelot_border_town' && Object.keys(state.clearedRooms).length >= 2);
  if (midpointReached && state.level < 4) {
    state.level = 4;
    state.tutorialStep = 'unlock_perimeter_gate';
    syncStateGates(state);
    soundSystem.playPowerup();
    ctx.say('LEVEL 4 (BORDER TOWN MIDPOINT): GENERATOR SLOT, SET 2 ACTIONS 3–5 & AUX 1–2');
    notifyOrionStateChange();
  }

  // Level 5 Fixed Event: Border Town Benchmark
  const benchmarkReached =
    Boolean(state.flags?.knights_pulled_together) ||
    switches >= 2 ||
    fragments >= 2 ||
    trust >= 2;
  if (benchmarkReached && state.level < 5) {
    state.level = 5;
    syncStateGates(state);
    soundSystem.playPowerup();
    ctx.say('LEVEL 5 (BORDER TOWN BENCHMARK): ARMS SLOT & AUX SLOTS 3–4 ONLINE');
    notifyOrionStateChange();
  }

  // Level 6 Fixed Event: Border Town Complete (Cathedral Door Open) -> Unlocks Standard Progression!
  if (
    Boolean(state.flags?.cathedral_door_open) &&
    state.tutorialStep !== 'tutorial_complete'
  ) {
    state.tutorialStep = 'tutorial_complete';
    if (state.level < 6) {
      state.level = 6;
    }
    syncStateGates(state);
    soundSystem.playPowerup();
    ctx.say('LEVEL 6 (BORDER TOWN COMPLETE): UTILITY SLOT (ACTION 6) & GEMSTONE SKILL PROGRESSION UNLOCKED!');
    notifyOrionStateChange();
  }
}

// ─── 5. PLAYER MOVEMENT, DUAL-MODE BOOSTER & INPUT CONTROLLER ────────────────

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
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const gemCombatMods = getWeaponGemCombatModifiers(state);
  // §3.5 Critical Frame State (LOCKED): <= 40 HP (<= 20%) imposes -30% movement speed
  const criticalSpeedMult = state.frame.integrity <= 40 ? 0.7 : 1.0;
  const totalMobilityMult =
    gates.loadPenalty.mobilityMult *
    featMods.moveSpeedMult *
    gemCombatMods.moveSpeedMult *
    criticalSpeedMult;

  const installedMobilityModId = state.equipmentSlots?.installedMods?.mobility;
  const mobilityMod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === installedMobilityModId);
  const extraDashSec = mobilityMod?.modifiers.extraDashDurationSec || 0;
  const extraDashHeat = mobilityMod?.modifiers.heatCostDelta || 0;

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


  updateTargetLock(state);

  // 2. [B] Button Dual-Mode Boost (Tap Burst + Hold Continuous Boost)
  if (p.b) {
    state.bHoldTimer = 0;
    if (!gates.canBoosterDash) {
      soundSystem.playMenuBeep();
      combatCtx.say('BOOSTER KIT OFFLINE');
      notifyOrionStateChange();
    } else if (state.heat >= state.maxHeat) {
      soundSystem.playMenuBeep();
      combatCtx.say('REACTOR OVERHEATED — VENT HEAT BEFORE BOOSTING');
      notifyOrionStateChange();
    } else if (state.boosterCooldown <= 0) {
      state.isBoosterDashing = true;
      state.boosterTimer = BOOSTER_DASH_DURATION + extraDashSec;
      state.boosterCooldown = BOOSTER_DASH_COOLDOWN * 0.65;
      const dashHeat =
        (BOOSTER_HEAT_COST * 0.7 + extraDashHeat) *
        gates.loadPenalty.heatMult *
        featMods.heatGenMult;
      state.heat = Math.min(state.maxHeat, state.heat + dashHeat);

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

  if (h.b && gates.legsSlotActive) {
    state.bHoldTimer = (state.bHoldTimer || 0) + dt;
    if (state.bHoldTimer >= B_HOLD_CONTINUOUS_THRESHOLD_SEC && state.heat < state.maxHeat) {
      state.isContinuousBoosting = true;
      state.isBoosterDashing = true;
      const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
      state.boosterDirX = hasMoveInput ? normMoveX : state.boosterDirX || dirInfo.dx;
      state.boosterDirY = hasMoveInput ? normMoveY : state.boosterDirY || dirInfo.dy;

      const contHeat =
        CONTINUOUS_BOOST_HEAT_PER_SEC *
        gates.loadPenalty.heatMult *
        featMods.heatGenMult *
        dt;
      state.heat = Math.min(state.maxHeat, state.heat + contHeat);

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
    const boostSpeed =
      (state.isContinuousBoosting ? BOOSTER_SPEED * 0.88 : BOOSTER_SPEED) * totalMobilityMult;
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
    const speed = WALK_SPEED * (inMud ? biomeMudMult : 1.0) * totalMobilityMult;

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
