/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor, OrionState } from '../../types';
import { getItemDefinition } from '../items';
import { getWeaponDefinition, WEAPON_SKILL_ACTIONS } from '../weapons';
import {
  CLASS_UTILITY_CATALOG,
  ClassUtilityItemDefinition,
  getClassUtilityDefinition,
  getDefaultClassUtilityId,
} from './utility_and_belt_modules';

export type { OrionActionDescriptor } from '../../types';
export {
  CLASS_UTILITY_CATALOG,
  type ClassUtilityItemDefinition,
  getClassUtilityDefinition,
  getDefaultClassUtilityId,
};

// Auto-discover all assignable equipment/reactor/utility/belt modules in this directory via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

const discoveredActions: OrionActionDescriptor[] = [...WEAPON_SKILL_ACTIONS];

function isOrionActionDescriptor(val: unknown): val is OrionActionDescriptor {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'sourceCategory' in val &&
    'shortLabel' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isOrionActionDescriptor(exportedValue)) {
      discoveredActions.push(exportedValue);
    }
  }
}

export const ASSIGNABLE_ACTION_CATALOG: OrionActionDescriptor[] = discoveredActions.sort(
  (a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)
);

/**
 * Resolve any assignable action ID into its concrete action descriptor for the pilot's current state
 * (dynamically binding weapon_skill_1..4, class_utility_slot, and belt_slot_1..4).
 */
export function getResolvedActionDescriptor(
  state: OrionState,
  actionId: string
): OrionActionDescriptor {
  const base =
    ASSIGNABLE_ACTION_CATALOG.find((a) => a.id === actionId) ||
    ASSIGNABLE_ACTION_CATALOG[0];

  if (base && base.sourceCategory === 'weapon' && base.weaponSkillSlot) {
    const currentWeaponId =
      state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
    const weapon = getWeaponDefinition(currentWeaponId);
    const move = weapon?.moveset[base.weaponSkillSlot];
    if (move && weapon) {
      return {
        ...base,
        name: move.name,
        shortLabel: move.name.toUpperCase(),
        sourceLabel: `${weapon.name} [Skill ${base.weaponSkillSlot}]`,
        description: move.description,
        tellDurationSec: move.tellDurationSec,
        actionDurationSec: move.actionDurationSec,
        cooldownSec: move.cooldownSec,
        heatCost: move.heatCost,
        damage: move.damage,
        damageType: move.damageType,
        damageFamily: move.damageFamily,
        range: move.range,
      };
    }
  }

  if (base && base.sourceCategory === 'utility') {
    const utilityDef = getClassUtilityDefinition(
      state.equipmentSlots?.utility,
      state.traitLine
    );
    return {
      ...base,
      name: utilityDef.name,
      shortLabel: utilityDef.shortLabel,
      sourceLabel: `Utility Slot [Action 6 · ${utilityDef.frameModel}]`,
      description: utilityDef.description,
      tellDurationSec: utilityDef.tellDurationSec,
      actionDurationSec: utilityDef.actionDurationSec,
      cooldownSec: utilityDef.cooldownSec,
      heatCost: utilityDef.heatCost,
    };
  }

  if (base && base.sourceCategory === 'belt' && typeof base.beltSlotIndex === 'number') {
    const idx = base.beltSlotIndex;
    const itemId = state.equipmentSlots?.belt?.[idx] ?? null;
    const itemDef = itemId ? getItemDefinition(itemId) : undefined;
    const invSlot = itemId
      ? state.inventorySlots.find((s) => s.itemId === itemId)
      : undefined;
    const count = invSlot ? invSlot.count : 0;
    if (itemDef) {
      return {
        ...base,
        name: `${itemDef.name} (×${count})`,
        shortLabel: `${itemDef.name.slice(0, 12).toUpperCase()} ×${count}`,
        sourceLabel: `Belt Slot ${idx + 1} [Action ${7 + idx}]`,
        description: itemDef.description,
      };
    }
    return {
      ...base,
      name: `Belt Slot ${idx + 1} (Empty)`,
      shortLabel: `BELT ${idx + 1} [EMPTY]`,
      sourceLabel: `Belt Slot ${idx + 1} [Action ${7 + idx}]`,
    };
  }

  return base;
}
