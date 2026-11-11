/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor, OrionActionTemplate, OrionState } from '../../types';
import { getItemDefinition } from '../items';
import {
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
  WEAPON_SKILL_ACTIONS,
} from './weapons';
import {
  CLASS_UTILITY_CATALOG,
  ClassUtilityItemDefinition,
  getClassUtilityDefinition,
  getDefaultClassUtilityId,
} from './utility_and_belt_modules';

export type { OrionActionDescriptor, OrionActionTemplate } from '../../types';
export {
  CLASS_UTILITY_CATALOG,
  type ClassUtilityItemDefinition,
  getClassUtilityDefinition,
  getDefaultClassUtilityId,
};
export * from './armor_sheets';
export * from './arms';
export * from './auxiliaries';
export * from './chassis_hardware';
export * from './head';
export * from './legs';
export * from './mod_naming';
export * from './plating';
export * from './reactors';
export * from './sensory';
export * from './weapons';

// Auto-discover all assignable equipment/reactor/utility/belt modules in this directory via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

const discoveredActions: OrionActionTemplate[] = [...WEAPON_SKILL_ACTIONS];

function isOrionActionTemplate(val: unknown): val is OrionActionTemplate {
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
    if (isOrionActionTemplate(exportedValue)) {
      discoveredActions.push(exportedValue);
    }
  }
}

/**
 * Exported const `ASSIGNABLE_ACTION_CATALOG` (assignable action catalog) in `index.ts`.
 */
export const ASSIGNABLE_ACTION_CATALOG: OrionActionTemplate[] = discoveredActions.sort(
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
    const w1 = getWeaponDefinition(slot1Id) || getWeaponDefinition('long_sword')!;
    const w2 = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
    const item2 = slot2Id && !w2 ? getItemDefinition(slot2Id) : undefined;
    const w3 = slot3Id ? getWeaponDefinition(slot3Id) : undefined;
    const isAuxActive = Boolean(state.equipmentSlots?.auxActive && slot3Id && w3);
    const is2HGrip =
      !isAuxActive &&
      (state.equipmentSlots?.mainGrip === '2h' || isTwoHandOnlyWeapon(w1, state) || !slot2Id);

    // 1. Back Launcher active ownership (`auxActive`): Launcher stays on back (`slot3`) and owns Skill 4
    // 2. 2H Main Grip: Side weapon (`slot2`) is holstered; Main weapon (`slot1`) owns Skill 4
    // 3. 1H Main Grip: Side Hand (`slot2`) owns Skill 4 (or Back Aux provides Skill 4 if Side holds a consumable)
    const targetWeaponId = isAuxActive
      ? slot3Id!
      : is2HGrip
        ? slot1Id
        : item2 && w3 && isAuxiliaryEquipment(w3)
          ? slot3Id!
          : slot2Id || slot3Id || slot1Id;
    const weapon = getWeaponDefinition(targetWeaponId) || w1;
    const isUnpairedWeapon =
      !isAuxActive &&
      !is2HGrip &&
      isTrueWeaponEquipment(weapon) &&
      targetWeaponId !== slot1Id;
    const movesetSlot: 1 | 2 | 3 | 4 = isUnpairedWeapon ? 1 : 3;
    const move =
      weapon.moveset[movesetSlot] ||
      weapon.moveset[3] ||
      weapon.moveset[1] ||
      weapon.moveset[0];

    return {
      id: 'weapon_slot2_skill4',
      name: move.name,
      shortLabel: move.name.slice(0, 14).toUpperCase(),
      sourceCategory: 'weapon',
      sourceLabel: isAuxActive
        ? `Back Launcher: ${weapon.name} [Skill 4]`
        : `${weapon.name} [Skill ${isUnpairedWeapon ? 2 : 4}]`,
      weaponSkillSlot: movesetSlot,
      weaponId: weapon.id,
      description: move.description,
      tellDurationSec: move.tellDurationSec,
      actionDurationSec: move.actionDurationSec,
      cooldownSec: move.cooldownSec,
      isChain: move.isChain,
      activeDurationSec: move.activeDurationSec,
      reloadDurationSec: move.reloadDurationSec,
      noReload: move.noReload,
      ammoCount: move.ammoCount,
      internalCharges: move.internalCharges,
      internalCycleSec: move.internalCycleSec,
      isChargeable: move.isChargeable,
      maxChargeSec: move.maxChargeSec,
      comboSequence: move.comboSequence,
      comboResetWindowSec: move.comboResetWindowSec,
      isBlock: move.isBlock,
      heatCost: move.heatCost,
      damage: move.damage,
      damageType: move.damageType,
      damageFamily: move.damageFamily,
      range: move.range,
    };
  }

  if (actionId === 'weapon_slot2_skill5') {
    const slot1Id = state.equipmentSlots?.slot1 || state.equippedWeapons?.[0] || 'long_sword';
    const slot2Id = state.equipmentSlots?.slot2 || null;
    const slot3Id = state.equipmentSlots?.slot3 || null;
    const w1 = getWeaponDefinition(slot1Id) || getWeaponDefinition('long_sword')!;
    const w3 = slot3Id ? getWeaponDefinition(slot3Id) : undefined;
    const isAuxActive = Boolean(state.equipmentSlots?.auxActive && slot3Id && w3);
    const is2HGrip =
      !isAuxActive &&
      (state.equipmentSlots?.mainGrip === '2h' || isTwoHandOnlyWeapon(w1, state) || !slot2Id);

    const targetWeaponId = isAuxActive
      ? slot3Id!
      : is2HGrip
        ? slot1Id
        : slot2Id || slot3Id || slot1Id;
    const weapon = getWeaponDefinition(targetWeaponId) || w1;
    const isUnpairedWeapon =
      !isAuxActive &&
      !is2HGrip &&
      isTrueWeaponEquipment(weapon) &&
      targetWeaponId !== slot1Id;
    const movesetSlot: 1 | 2 | 3 | 4 = isUnpairedWeapon ? 2 : 4;
    const move =
      weapon.moveset[movesetSlot] ||
      weapon.moveset[4] ||
      weapon.moveset[2] ||
      weapon.moveset[0];

    return {
      id: 'weapon_slot2_skill5',
      name: move.name,
      shortLabel: move.name.slice(0, 14).toUpperCase(),
      sourceCategory: 'weapon',
      sourceLabel: isAuxActive
        ? `Back Launcher: ${weapon.name} [Skill 5]`
        : `${weapon.name} [Skill ${isUnpairedWeapon ? 3 : 5}]`,
      weaponSkillSlot: movesetSlot,
      weaponId: weapon.id,
      description: move.description,
      tellDurationSec: move.tellDurationSec,
      actionDurationSec: move.actionDurationSec,
      cooldownSec: move.cooldownSec,
      isChain: move.isChain,
      activeDurationSec: move.activeDurationSec,
      reloadDurationSec: move.reloadDurationSec,
      noReload: move.noReload,
      ammoCount: move.ammoCount,
      internalCharges: move.internalCharges,
      internalCycleSec: move.internalCycleSec,
      isChargeable: move.isChargeable,
      maxChargeSec: move.maxChargeSec,
      comboSequence: move.comboSequence,
      comboResetWindowSec: move.comboResetWindowSec,
      isBlock: move.isBlock,
      heatCost: move.heatCost,
      damage: move.damage,
      damageType: move.damageType,
      damageFamily: move.damageFamily,
      range: move.range,
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
    const weapon =
      getWeaponDefinition(currentWeaponId) ||
      getWeaponDefinition('gladius_boltcaster')!;
    const move =
      weapon.moveset[base.weaponSkillSlot] || weapon.moveset[0];

    return {
      ...base,
      name: move.name,
      shortLabel: move.name.toUpperCase(),
      sourceLabel: `${weapon.name} [Skill ${base.weaponSkillSlot}]`,
      weaponId: weapon.id,
      description: move.description,
      tellDurationSec: move.tellDurationSec,
      actionDurationSec: move.actionDurationSec,
      cooldownSec: move.cooldownSec,
      isChain: move.isChain,
      activeDurationSec: move.activeDurationSec,
      reloadDurationSec: move.reloadDurationSec,
      noReload: move.noReload,
      ammoCount: move.ammoCount,
      internalCharges: move.internalCharges,
      internalCycleSec: move.internalCycleSec,
      isChargeable: move.isChargeable,
      maxChargeSec: move.maxChargeSec,
      comboSequence: move.comboSequence,
      comboResetWindowSec: move.comboResetWindowSec,
      isBlock: move.isBlock,
      heatCost: move.heatCost,
      damage: move.damage,
      damageType: move.damageType,
      damageFamily: move.damageFamily,
      range: move.range,
    };
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
      damage: base.damage ?? 0,
      damageType: base.damageType ?? 'Pulse',
      damageFamily: base.damageFamily ?? 'Energy',
      range: base.range ?? 0,
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
    const resolvedBase: OrionActionDescriptor = {
      ...base,
      tellDurationSec: base.tellDurationSec ?? 0.1,
      actionDurationSec: base.actionDurationSec ?? 0.2,
      cooldownSec: base.cooldownSec ?? 4.0,
      heatCost: base.heatCost ?? 0,
      damage: base.damage ?? 0,
      damageType: base.damageType ?? 'Impact',
      damageFamily: base.damageFamily ?? 'Kinetic',
      range: base.range ?? 0,
    };
    if (itemDef) {
      return {
        ...resolvedBase,
        name: `${itemDef.name} (×${count})`,
        shortLabel: `${itemDef.name.slice(0, 12).toUpperCase()} ×${count}`,
        sourceLabel: `Belt Slot ${idx + 1} [Action ${7 + idx}]`,
        description: itemDef.description,
      };
    }
    return {
      ...resolvedBase,
      name: `Belt Slot ${idx + 1} (Empty)`,
      shortLabel: `BELT ${idx + 1} [EMPTY]`,
      sourceLabel: `Belt Slot ${idx + 1} [Action ${7 + idx}]`,
    };
  }

  return {
    ...base,
    tellDurationSec: base.tellDurationSec ?? 0,
    actionDurationSec: base.actionDurationSec ?? 0,
    cooldownSec: base.cooldownSec ?? 0,
    heatCost: base.heatCost ?? 0,
    damage: base.damage ?? 0,
    damageType: base.damageType ?? 'Impact',
    damageFamily: base.damageFamily ?? 'Kinetic',
    range: base.range ?? 0,
  };
}
