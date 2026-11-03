/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { EnemyEntity, KnightState, PickupEntity, SkillId } from './types';
import { VENDOR_ITEMS as DB_VENDOR_ITEMS, VendorItem } from './database/vendors';

export type { VendorItem };
/**
 * Exported const `VENDOR_ITEMS` (vendor items) in `stateStore.ts`.
 */
export const VENDOR_ITEMS: VendorItem[] = DB_VENDOR_ITEMS;

/**
 * Type contract for `DungeonStateData` (dungeon state data) in `stateStore.ts`.
 */
export interface DungeonStateData {
  rooms: Record<string, string[]>;
  greenRooms: Record<string, number>;
  safeRooms: Record<string, number>;
  floor: unknown;
}

/**
 * Type contract for `DungeonEntityData` (dungeon entity data) in `stateStore.ts`.
 */
export interface DungeonEntityData {
  enemies: EnemyEntity[];
  picks: PickupEntity[];
}

/**
 * Type contract for `DungeonContext` (dungeon context) in `stateStore.ts`.
 */
export interface DungeonContext {
  getDungeonData: () => DungeonStateData;
  restoreDungeonData: (
    dungeon: DungeonStateData,
    entities?: DungeonEntityData,
    targetRoom?: string
  ) => void;
}

let activeKnightState: KnightState | null = null;
let activeDungeonContext: DungeonContext | null = null;
const stateListeners: Set<() => void> = new Set();

/**
 * Executes `setKnightStateRef` (set knight state ref) in `stateStore.ts`.
 */
export function setKnightStateRef(st: KnightState | null): void {
  activeKnightState = st;
  notifyStateChange();
}

/**
 * Executes `setDungeonContextRef` (set dungeon context ref) in `stateStore.ts`.
 */
export function setDungeonContextRef(ctx: DungeonContext | null): void {
  activeDungeonContext = ctx;
}

/**
 * Executes `getKnightState` (get knight state) in `stateStore.ts`.
 */
export function getKnightState(): KnightState | null {
  return activeKnightState;
}

/**
 * Executes `subscribeKnightState` (subscribe knight state) in `stateStore.ts`.
 */
export function subscribeKnightState(fn: () => void): () => void {
  stateListeners.add(fn);
  return () => {
    stateListeners.delete(fn);
  };
}

/**
 * Executes `notifyStateChange` (notify state change) in `stateStore.ts`.
 */
export function notifyStateChange(): void {
  stateListeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error('State listener error:', err);
    }
  });
}

/**
 * Executes `assignSkill` (assign skill) in `stateStore.ts`.
 */
export function assignSkill(slot: 'L' | 'R', skillId: SkillId): boolean {
  if (!activeKnightState) return false;
  if (slot === 'L') {
    activeKnightState.assignedL = skillId;
  } else {
    activeKnightState.assignedR = skillId;
  }
  soundSystem.playMenuBeep();
  notifyStateChange();
  return true;
}

/**
 * Executes `equipItem` (equip item) in `stateStore.ts`.
 */
export function equipItem(slot: 'mainHand' | 'offHand' | 'armor' | 'trinket', itemId: string): boolean {
  const st = activeKnightState;
  if (!st) return false;
  if (!st.loadout) {
    st.loadout = {
      mainHand: st.equippedWeapon || 'short_sword',
    };
  }
  st.loadout[slot] = itemId;
  if (slot === 'mainHand') {
    st.equippedWeapon = itemId;
  }
  soundSystem.playSelect();
  notifyStateChange();
  return true;
}

/**
 * Executes `unlockFeat` (unlock feat) in `stateStore.ts`.
 */
export function unlockFeat(featId: string, cost: number): { success: boolean; message: string } {
  const st = activeKnightState;
  if (!st) return { success: false, message: 'No active game.' };

  if (!st.unlockedFeats) {
    st.unlockedFeats = [];
  }

  if (st.unlockedFeats.includes(featId)) {
    return { success: false, message: 'Feat already mastered!' };
  }

  if (st.coins < cost) {
    return { success: false, message: `Need ${cost} coins (have ${st.coins}).` };
  }

  st.coins -= cost;
  st.unlockedFeats.push(featId);
  soundSystem.playCharge();
  notifyStateChange();
  return { success: true, message: `Mastered feat: ${featId}!` };
}

/**
 * Executes `addItemToInventory` (add item to inventory) in `stateStore.ts`.
 */
export function addItemToInventory(itemId: string, quantity = 1): void {
  const st = activeKnightState;
  if (!st) return;
  if (!st.inventorySlots) {
    st.inventorySlots = [];
  }
  const existing = st.inventorySlots.find((s) => s.itemId === itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    st.inventorySlots.push({ itemId, quantity });
  }
  notifyStateChange();
}

/**
 * Executes `buyVendorItem` (buy vendor item) in `stateStore.ts`.
 */
export function buyVendorItem(item: VendorItem): { success: boolean; message: string } {
  const st = activeKnightState;
  if (!st) {
    return { success: false, message: 'No game in progress.' };
  }

  if (st.coins < item.cost) {
    return { success: false, message: `Need ${item.cost} coins (have ${st.coins}).` };
  }

  st.coins -= item.cost;

  if (item.type === 'stat' && item.stat) {
    if (item.stat === 'hp') {
      st.maxHp += 1;
      st.hp += 1;
    } else if (item.stat === 'sp') {
      st.maxSp += 1;
      st.sp += 1;
    } else if (item.stat === 'ep') {
      st.maxEp += 1;
      st.ep += 1;
    } else if (item.stat === 'ap') {
      st.maxAp += 1;
      st.ap += 1;
    }
  } else if (item.type === 'flask_max') {
    st.maxFlasks += 1;
    st.flasks += 1;
  } else if (item.type === 'flask_refill') {
    st.flasks = st.maxFlasks;
  }

  soundSystem.playKey();
  notifyStateChange();
  return { success: true, message: `Purchased ${item.name}!` };
}

const SAVE_KEY_V2 = 'minuteman_knight_save_v2';
const SAVE_KEY_V1 = 'minuteman_knight_save_v1';

/**
 * Executes `saveKnightGame` (save knight game) in `stateStore.ts`.
 */
export function saveKnightGame(): { success: boolean; message: string } {
  const st = activeKnightState;
  if (!st) return { success: false, message: 'No active game to save.' };

  try {
    const dungeon = activeDungeonContext ? activeDungeonContext.getDungeonData() : null;
    const data = {
      version: 2,
      timestamp: Date.now(),
      player: {
        room: st.room,
        rx: st.rx,
        ry: st.ry,
        x: st.x,
        y: st.y,
        hp: st.hp,
        maxHp: st.maxHp,
        ap: st.ap,
        maxAp: st.maxAp,
        ep: st.ep,
        maxEp: st.maxEp,
        sp: st.sp,
        maxSp: st.maxSp,
        flasks: st.flasks,
        maxFlasks: st.maxFlasks,
        coins: st.coins,
        keys: st.keys,
        hasDouble: st.hasDouble,
        equippedWeapon: st.equippedWeapon || 'short_sword',
        loadout: st.loadout || { mainHand: st.equippedWeapon || 'short_sword' },
        unlockedFeats: st.unlockedFeats || [],
        inventorySlots: st.inventorySlots || [],
        assignedL: st.assignedL,
        assignedR: st.assignedR,
        checkpoint: st.checkpoint,
        cleared: st.cleared,
        nextStart: st.nextStart,
      },
      dungeon,
      entities: {
        enemies: st.enemies || [],
        picks: st.picks || [],
      },
      got: st.got || {},
    };

    localStorage.setItem(SAVE_KEY_V2, JSON.stringify(data));
    soundSystem.playKey();
    return { success: true, message: 'DUNGEON & PROGRESS SAVED!' };
  } catch (err) {
    console.error('Save game failed:', err);
    return { success: false, message: 'Failed to write save.' };
  }
}

/**
 * Executes `loadSavedKnightGame` (load saved knight game) in `stateStore.ts`.
 */
export function loadSavedKnightGame(): boolean {
  const st = activeKnightState;
  if (!st) return false;
  try {
    const rawV2 = localStorage.getItem(SAVE_KEY_V2);
    if (rawV2) {
      const data = JSON.parse(rawV2);
      const p = data.player;
      Object.assign(st, {
        room: p.room,
        rx: p.rx,
        ry: p.ry,
        x: p.x,
        y: p.y,
        hp: p.hp,
        maxHp: p.maxHp,
        ap: p.ap,
        maxAp: p.maxAp,
        ep: p.ep,
        maxEp: p.maxEp,
        sp: p.sp,
        maxSp: p.maxSp,
        flasks: p.flasks,
        maxFlasks: p.maxFlasks,
        coins: p.coins,
        keys: p.keys,
        hasDouble: p.hasDouble,
        equippedWeapon: p.equippedWeapon || 'short_sword',
        loadout: p.loadout || { mainHand: p.equippedWeapon || 'short_sword' },
        unlockedFeats: p.unlockedFeats || [],
        inventorySlots: p.inventorySlots || [],
        assignedL: p.assignedL,
        assignedR: p.assignedR,
        got: data.got || {},
        checkpoint: p.checkpoint,
        cleared: p.cleared,
        nextStart: p.nextStart,
      });

      if (data.dungeon && activeDungeonContext) {
        activeDungeonContext.restoreDungeonData(data.dungeon, data.entities, p.room);
      }

      soundSystem.playSelect();
      notifyStateChange();
      return true;
    }

    // Graceful backward compatibility with V1 save format
    const rawV1 = localStorage.getItem(SAVE_KEY_V1);
    if (rawV1) {
      const data = JSON.parse(rawV1);
      Object.assign(st, {
        room: data.room,
        rx: data.rx,
        ry: data.ry,
        x: data.x,
        y: data.y,
        hp: data.hp,
        maxHp: data.maxHp,
        ap: data.ap,
        maxAp: data.maxAp,
        ep: data.ep,
        maxEp: data.maxEp,
        sp: data.sp,
        maxSp: data.maxSp,
        flasks: data.flasks,
        maxFlasks: data.maxFlasks,
        coins: data.coins,
        keys: data.keys,
        hasDouble: data.hasDouble,
        equippedWeapon: data.equippedWeapon || 'short_sword',
        loadout: data.loadout || { mainHand: data.equippedWeapon || 'short_sword' },
        unlockedFeats: data.unlockedFeats || [],
        inventorySlots: data.inventorySlots || [],
        assignedL: data.assignedL,
        assignedR: data.assignedR,
        got: data.got || {},
        checkpoint: data.checkpoint,
        cleared: data.cleared,
        nextStart: data.nextStart,
      });

      soundSystem.playSelect();
      notifyStateChange();
      return true;
    }

    return false;
  } catch (err) {
    console.error('Load game failed:', err);
    return false;
  }
}

/**
 * Executes `hasSavedKnightGame` (has saved knight game) in `stateStore.ts`.
 */
export function hasSavedKnightGame(): boolean {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY_V2) || localStorage.getItem(SAVE_KEY_V1));
  } catch {
    return false;
  }
}


