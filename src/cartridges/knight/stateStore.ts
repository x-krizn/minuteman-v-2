/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { KnightState, SkillId } from './types';
import { VendorItem, VENDOR_ITEMS as DB_VENDOR_ITEMS } from './database/vendors';

export type { VendorItem };
export const VENDOR_ITEMS: VendorItem[] = DB_VENDOR_ITEMS;

let activeKnightState: KnightState | null = null;
const stateListeners: Set<() => void> = new Set();

export function setKnightStateRef(st: KnightState | null): void {
  activeKnightState = st;
  notifyStateChange();
}

export function getKnightState(): KnightState | null {
  return activeKnightState;
}

export function subscribeKnightState(fn: () => void): () => void {
  stateListeners.add(fn);
  return () => {
    stateListeners.delete(fn);
  };
}

export function notifyStateChange(): void {
  stateListeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error('State listener error:', err);
    }
  });
}

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

const SAVE_KEY = 'minuteman_knight_save_v1';

export function saveKnightGame(): { success: boolean; message: string } {
  const st = activeKnightState;
  if (!st) return { success: false, message: 'No active game to save.' };

  try {
    const data = {
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
      got: st.got,
      checkpoint: st.checkpoint,
      cleared: st.cleared,
      nextStart: st.nextStart,
      currentAreaId: st.currentAreaId || 'tutorial',
      areaStates: st.areaStates || {},
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    soundSystem.playKey();
    return { success: true, message: 'GAME PROGRESS SAVED!' };
  } catch {
    return { success: false, message: 'Failed to write save.' };
  }
}

export function loadSavedKnightGame(): boolean {
  const st = activeKnightState;
  if (!st) return false;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
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
      got: data.got,
      checkpoint: data.checkpoint,
      cleared: data.cleared,
      nextStart: data.nextStart,
      currentAreaId: data.currentAreaId || 'tutorial',
      areaStates: data.areaStates || {},
    });
    soundSystem.playSelect();
    notifyStateChange();
    return true;
  } catch {
    return false;
  }
}

export function hasSavedKnightGame(): boolean {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

export function getActiveRoomData(): {
  roomKey: string;
  areaId: string;
  tiles: string[];
  cols: number;
  rows: number;
} | null {
  const st = activeKnightState;
  if (!st) return null;
  const currentAreaId = st.currentAreaId || 'tutorial';
  const runtime = st.areaStates?.[currentAreaId];
  const tiles = runtime?.rooms?.[st.room];
  if (!tiles || tiles.length === 0) return null;

  return {
    roomKey: st.room,
    areaId: currentAreaId,
    tiles: [...tiles],
    cols: tiles[0]?.length || 10,
    rows: tiles.length || 9,
  };
}

export function injectCustomRoom(
  roomKey: string,
  tiles: string[],
  areaId?: string
): boolean {
  const st = activeKnightState;
  if (!st || !tiles || tiles.length === 0) return false;

  const targetAreaId = areaId || st.currentAreaId || 'tutorial';
  if (!st.areaStates) st.areaStates = {};
  if (!st.areaStates[targetAreaId]) {
    st.areaStates[targetAreaId] = {
      areaId: targetAreaId,
      rooms: {},
      greenRooms: {},
      safeRooms: {},
      visitedRooms: {},
    };
  }

  const runtime = st.areaStates[targetAreaId];
  runtime.rooms[roomKey] = [...tiles];

  // Warp into room if current area matches
  if (st.currentAreaId === targetAreaId) {
    st.room = roomKey;
    const [rx, ry] = roomKey.includes(',') ? roomKey.split(',').map(Number) : [0, 0];
    st.rx = isNaN(rx) ? 0 : rx;
    st.ry = isNaN(ry) ? 0 : ry;
    st.x = 24;
    st.y = (tiles.length - 2) * 16;
    st.vx = 0;
    st.vy = 0;
  }

  notifyStateChange();
  return true;
}

