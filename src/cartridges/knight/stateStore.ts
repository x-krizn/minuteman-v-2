/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { KnightState, SkillId, StatType } from './types';
import { VENDOR_ITEMS as DB_VENDOR_ITEMS } from './database/vendors';

export interface VendorItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'stat' | 'flask_max' | 'flask_refill';
  stat?: StatType;
}

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
    } else if (item.stat === 'ap' || item.stat === 'purple') {
      st.maxAp += 1;
      st.ap += 1;
    } else if (item.stat === 'orange') {
      st.maxSp += 1;
      st.sp += 1;
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
      assignedL: st.assignedL,
      assignedR: st.assignedR,
      got: st.got,
      checkpoint: st.checkpoint,
      cleared: st.cleared,
      nextStart: st.nextStart,
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
      assignedL: data.assignedL,
      assignedR: data.assignedR,
      got: data.got,
      checkpoint: data.checkpoint,
      cleared: data.cleared,
      nextStart: data.nextStart,
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

