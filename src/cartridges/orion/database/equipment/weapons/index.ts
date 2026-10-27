/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionTemplate, WeaponDefinition } from '../../../types';

export * from './base_sprites';
export * from './builder';
export * from './warrior_weapons';
export * from './marauder_weapons';
export * from './guardian_weapons';
export * from './rogue_weapons';
export * from './wizard_weapons';
export * from './cleric_weapons';

// Auto-discover all weapon entity modules in this directory (including subfolders) via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

export const WEAPON_REGISTRY: Record<string, WeaponDefinition> = {};

function isWeaponDefinition(val: unknown): val is WeaponDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'moveset' in val &&
    'shotsPerChain' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isWeaponDefinition(exportedValue)) {
      WEAPON_REGISTRY[exportedValue.id] = exportedValue;
    }
  }
}

export function getWeaponDefinition(id: string): WeaponDefinition | undefined {
  return WEAPON_REGISTRY[id];
}

/**
 * Shields, Quivers, and Catalysts are all designated Auxiliaries.
 * Auxiliaries have only Skill 4 and Skill 5, and always replace Skill 4 and Skill 5.
 */
export function isAuxiliaryEquipment(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return false;
  return (
    def.equipmentRole === 'shield' ||
    def.equipmentRole === 'quiver' ||
    def.equipmentRole === 'catalyst'
  );
}

/**
 * True WEAPONs (occupy Main Hand or Side Hand weapon slots; distinct from Auxiliaries).
 */
export function isTrueWeaponEquipment(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return false;
  return !isAuxiliaryEquipment(def);
}

/**
 * Bows are designated 2-handed only.
 */
export function isTwoHandOnlyWeapon(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return false;
  return def.id === 'great_bow';
}

/**
 * Equippable blocking weapons (all Shields and Melee weapons).
 * Skill 4 (moveset[3]) is always Block for all equippable blocking weapons.
 */
export function isBlockingWeapon(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return false;
  return Boolean(
    def.canBlock ||
      def.equipmentRole === 'shield' ||
      def.equipmentRole === 'melee' ||
      Boolean(def.moveset[3]?.isBlock)
  );
}

/**
 * Canonical Assignable Weapon Skill Slot Proxies (Slots 1..4).
 * Pure slot-binding metadata — all combat stats (tell, action, cd, heat, damage, type, family, range)
 * are sourced strictly from the equipped weapon's `moveset[weaponSkillSlot]` entry in `getResolvedActionDescriptor`.
 */
export const WEAPON_SKILL_ACTIONS: OrionActionTemplate[] = [
  {
    id: 'weapon_skill_1',
    name: 'Weapon Skill 1 (Default L)',
    shortLabel: 'WPN SKILL 1',
    sourceCategory: 'weapon',
    sourceLabel: 'Active Weapon [Slot 1]',
    weaponSkillSlot: 1,
    sortOrder: 1,
    description: 'Executes the active weapon’s Slot 1 ability.',
  },
  {
    id: 'weapon_skill_2',
    name: 'Weapon Skill 2 (Default R)',
    shortLabel: 'WPN SKILL 2',
    sourceCategory: 'weapon',
    sourceLabel: 'Active Weapon [Slot 2]',
    weaponSkillSlot: 2,
    sortOrder: 2,
    description: 'Executes the active weapon’s Slot 2 ability.',
  },
  {
    id: 'weapon_skill_3',
    name: 'Weapon Skill 3',
    shortLabel: 'WPN SKILL 3',
    sourceCategory: 'weapon',
    sourceLabel: 'Active Weapon [Slot 3]',
    weaponSkillSlot: 3,
    sortOrder: 3,
    description: 'Executes the active weapon’s Slot 3 ability.',
  },
  {
    id: 'weapon_skill_4',
    name: 'Weapon Skill 4',
    shortLabel: 'WPN SKILL 4',
    sourceCategory: 'weapon',
    sourceLabel: 'Active Weapon [Slot 4]',
    weaponSkillSlot: 4,
    sortOrder: 4,
    description: 'Executes the active weapon’s Slot 4 ability.',
  },
];
