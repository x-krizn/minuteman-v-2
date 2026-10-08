/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { KnightState, SkillId, StatType } from '../../types/knight';

export interface VendorItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'stat' | 'flask_max' | 'flask_refill';
  stat?: StatType;
}

export const VENDOR_ITEMS: VendorItem[] = [
  {
    id: 'ruby',
    name: 'Red Ruby',
    description: '+1 Maximum Health (HP)',
    cost: 25,
    type: 'stat',
    stat: 'hp',
  },
  {
    id: 'topaz',
    name: 'Topaz Gem',
    description: '+1 Maximum Stamina (SP)',
    cost: 25,
    type: 'stat',
    stat: 'sp',
  },
  {
    id: 'sapphire',
    name: 'Sapphire Gem',
    description: '+1 Maximum Energy (EP)',
    cost: 25,
    type: 'stat',
    stat: 'ep',
  },
  {
    id: 'emerald',
    name: 'Emerald Gem',
    description: '+1 Maximum Poise/Armor (AP)',
    cost: 25,
    type: 'stat',
    stat: 'ap',
  },
  {
    id: 'flask_shard',
    name: 'Flask Shard',
    description: '+1 Max Flask Capacity',
    cost: 40,
    type: 'flask_max',
  },
  {
    id: 'flask_refill',
    name: 'Elixir Draft',
    description: 'Refill all Flask charges',
    cost: 10,
    type: 'flask_refill',
  },
];

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
  stateListeners.forEach((fn) => fn());
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
