/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor, OrionState } from '../../types';
import { getItemDefinition } from '../items';
import {
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isTrueWeaponEquipment,
  WEAPON_SKILL_ACTIONS,
} from '../weapons';
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
export * from './chassis_hardware';
export * from './plating';
export * from './weapons';

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
 * (dynamically binding weapon_skill_1..4, weapon_slot2_skill4..5, class_utility_slot, and belt_slot_1..4).
 */
export function getResolvedActionDescriptor(
  state: OrionState,
  actionId: string
): OrionActionDescriptor {
  if (actionId === 'weapon_slot2_skill4') {
    const slot1Id = state.equipmentSlots?.slot1 || state.equippedWeapons?.[0] || 'long_sword';
    const slot2Id = state.equipmentSlots?.slot2 || null;
    const slot3Id = state.equipmentSlots?.slot3 || null;
    const w2 = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
    const item2 = slot2Id && !w2 ? getItemDefinition(slot2Id) : undefined;
    const w3 = slot3Id ? getWeaponDefinition(slot3Id) : undefined;

    // When Side Hand holds a consumable (which only occupies Skill 5), Auxl auxiliary provides Skill 4
    const targetWeaponId =
      item2 && w3 && isAuxiliaryEquipment(w3)
        ? slot3Id!
        : slot2Id || slot3Id || 'buckler_shield';
    const weapon = getWeaponDefinition(targetWeaponId);
    const isUnpairedWeapon =
      weapon && isTrueWeaponEquipment(weapon) && targetWeaponId !== slot1Id;
    const movesetSlot: 1 | 2 | 3 | 4 = isUnpairedWeapon ? 1 : 3;
    const move = weapon?.moveset[movesetSlot] || weapon?.moveset[3] || weapon?.moveset[1];

    return {
      id: 'weapon_slot2_skill4',
      name: move?.name || 'Side Skill 4',
      shortLabel: (move?.name || 'SKILL 4').slice(0, 14).toUpperCase(),
      sourceCategory: 'weapon',
      sourceLabel: `${weapon?.name || 'Side Hand'} [Skill ${isUnpairedWeapon ? 2 : 4}]`,
      weaponSkillSlot: movesetSlot,
      weaponId: targetWeaponId,
      description: move?.description || 'Side-hand weapon or auxiliary action.',
      tellDurationSec: move?.tellDurationSec ?? 0.2,
      actionDurationSec: move?.actionDurationSec ?? 0.35,
      cooldownSec: move?.cooldownSec ?? 4.0,
      isChain: move?.isChain,
      activeDurationSec: move?.activeDurationSec,
      reloadDurationSec: move?.reloadDurationSec,
      isBlock: move?.isBlock,
      heatCost: move?.heatCost ?? 12,
      damage: move?.damage ?? 16,
      damageType: move?.damageType ?? 'Impact',
      damageFamily: move?.damageFamily ?? 'Kinetic',
      range: move?.range ?? 30,
    };
  }

  if (actionId === 'weapon_slot2_skill5') {
    const slot1Id = state.equipmentSlots?.slot1 || state.equippedWeapons?.[0] || 'long_sword';
    const slot2WeaponId =
      state.equipmentSlots?.slot2 || state.equipmentSlots?.slot3 || 'buckler_shield';
    const weapon = getWeaponDefinition(slot2WeaponId);
    const isUnpairedWeapon =
      weapon && isTrueWeaponEquipment(weapon) && slot2WeaponId !== slot1Id;
    const movesetSlot: 1 | 2 | 3 | 4 = isUnpairedWeapon ? 2 : 4;
    const move = weapon?.moveset[movesetSlot] || weapon?.moveset[4] || weapon?.moveset[2];

    return {
      id: 'weapon_slot2_skill5',
      name: move?.name || 'Side Skill 5',
      shortLabel: (move?.name || 'SKILL 5').slice(0, 14).toUpperCase(),
      sourceCategory: 'weapon',
      sourceLabel: `${weapon?.name || 'Side Hand'} [Skill ${isUnpairedWeapon ? 3 : 5}]`,
      weaponSkillSlot: movesetSlot,
      weaponId: slot2WeaponId,
      description: move?.description || 'Side-hand weapon or auxiliary finisher action.',
      tellDurationSec: move?.tellDurationSec ?? 0.3,
      actionDurationSec: move?.actionDurationSec ?? 0.45,
      cooldownSec: move?.cooldownSec ?? 6.5,
      isChain: move?.isChain,
      activeDurationSec: move?.activeDurationSec,
      reloadDurationSec: move?.reloadDurationSec,
      isBlock: move?.isBlock,
      heatCost: move?.heatCost ?? 20,
      damage: move?.damage ?? 24,
      damageType: move?.damageType ?? 'Wave',
      damageFamily: move?.damageFamily ?? 'Energy',
      range: move?.range ?? 35,
    };
  }

  if (actionId.startsWith('item_')) {
    const itemId = actionId.slice(5);
    const itemDef = getItemDefinition(itemId);
    const invSlot = state.inventorySlots.find((s) => s.itemId === itemId);
    const count = invSlot ? invSlot.count : 0;
    return {
      id: actionId,
      name: `${itemDef?.name || itemId} (×${count})`,
      shortLabel: `${(itemDef?.name || itemId).slice(0, 12).toUpperCase()} ×${count}`,
      sourceCategory: 'belt',
      sourceLabel: `Belt Item [${itemDef?.name || itemId}]`,
      itemId,
      description: itemDef?.description || 'Tactical belt consumable item.',
      tellDurationSec: 0.1,
      actionDurationSec: 0.25,
      cooldownSec: 2.5,
      heatCost: 0,
      damage: 0,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      range: 0,
    };
  }

  const base =
    ASSIGNABLE_ACTION_CATALOG.find((a) => a.id === actionId) ||
    ASSIGNABLE_ACTION_CATALOG[0];

  if (base && base.sourceCategory === 'weapon' && base.weaponSkillSlot) {
    const currentWeaponId =
      state.equipmentSlots?.slot1 ||
      state.equippedWeapons[state.activeWeaponIndex] ||
      'gladius_boltcaster';
    const weapon = getWeaponDefinition(currentWeaponId);
    const move = weapon?.moveset[base.weaponSkillSlot];
    if (move && weapon) {
      return {
        ...base,
        name: move.name,
        shortLabel: move.name.toUpperCase(),
        sourceLabel: `${weapon.name} [Skill ${base.weaponSkillSlot}]`,
        weaponId: currentWeaponId,
        description: move.description,
        tellDurationSec: move.tellDurationSec,
        actionDurationSec: move.actionDurationSec,
        cooldownSec: move.cooldownSec,
        isChain: move.isChain,
        activeDurationSec: move.activeDurationSec,
        reloadDurationSec: move.reloadDurationSec,
        isBlock: move.isBlock,
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
