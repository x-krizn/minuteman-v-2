/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionTemplate, WeaponDefinition } from '../../../types';
import {
  formatModifiedEquipmentName,
  parseEquipmentInstanceId,
} from '../mod_naming';
import {
  normalizeWeaponCombatFunctions,
  resolveWeaponCategory,
  resolveWeaponFunctionalType,
} from './builder';

export * from './base_sprites';
export * from './builder';
export * from './warrior_weapons';
export * from './marauder_weapons';
export * from './guardian_weapons';
export * from './rogue_weapons';
export * from './wizard_weapons';
export * from './cleric_weapons';
export * from './custom_shields_and_bows';
export * from './custom_casters_and_carriers';
export * from './custom_spears_and_hafted';
export * from './custom_blades';

// Auto-discover all weapon entity modules in this directory (including subfolders) via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

const LEGACY_WEAPON_ID_ALIASES: Record<string, string> = {
  gladius_boltcaster: 'n55_gladius',
  khopesh: 's2_turbine_khopesh',
  avalon_siege_lance: 'hl220_lightburst_lance',
  buckler_shield: 'aegis_charge_buckler',
  carrier_01_quiver: 'carrier_02_quiver',
  carrier_02_rack: 'carrier_06_rack',
  carrier_03_sheaf: 'carrier_05_sheaf',
  carrier_05_gorget: 'carrier_09_pangao',
  carrier_06_bandolier: 'carrier_01_bandolier',
  carrier_08_yebira: 'carrier_03_yebira',
  carrier_09_kaad: 'carrier_08_kaad',
};

/**
 * Exported const `WEAPON_REGISTRY` (weapon registry) in `index.ts`.
 */
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
      // Skip duplicate backward-compatible alias exports so they do not appear twice in UI lists
      if (exportedValue.id in LEGACY_WEAPON_ID_ALIASES) {
        continue;
      }
      const category = resolveWeaponCategory(
        exportedValue.id,
        exportedValue.weaponClass,
        exportedValue.equipmentRole,
        exportedValue.category
      );
      const functionalType = resolveWeaponFunctionalType(
        exportedValue.id,
        category,
        exportedValue.weaponClass,
        exportedValue.name
      );
      const tier = exportedValue.weaponTier || 'customizable';
      const subtypeLabel = tier === 'unique' ? 'Magitech' : 'Custom';
      WEAPON_REGISTRY[exportedValue.id] = normalizeWeaponCombatFunctions({
        ...exportedValue,
        category,
        weaponTier: tier,
        weaponClass: functionalType,
        class: `${category} · ${functionalType} (${subtypeLabel})`,
      });
    }
  }
}

const MODIFIED_WEAPON_CACHE: Record<string, WeaponDefinition> = {};

/**
 * Resolves a weapon or auxiliary definition by ID, supporting both canonical base IDs
 * (`long_sword`) and Gem-modified composite instance IDs (`long_sword::titanite+hematite`).
 */
export function getWeaponDefinition(id: string): WeaponDefinition | undefined {
  if (!id) return undefined;
  const aliasedDirect = LEGACY_WEAPON_ID_ALIASES[id] || id;
  const direct = WEAPON_REGISTRY[aliasedDirect];
  if (direct) return direct;

  if (MODIFIED_WEAPON_CACHE[id]) {
    return MODIFIED_WEAPON_CACHE[id];
  }

  const { baseId: rawBaseId, installedGems } = parseEquipmentInstanceId(id);
  const baseId = LEGACY_WEAPON_ID_ALIASES[rawBaseId] || rawBaseId;
  const baseDef = WEAPON_REGISTRY[baseId];
  if (!baseDef) return undefined;
  if (installedGems.length === 0) return baseDef;

  const allowsArmorBonus =
    baseDef.equipmentRole === 'shield' || baseDef.id.includes('martyrdom_plating');
  let extraShield = 0;
  let extraArmor = 0;
  let extraLight = 0;
  for (const gem of installedGems) {
    if (gem === 'titanite') extraShield += 15;
    if (gem === 'moonstone') extraShield += 8;
    if (allowsArmorBonus && gem === 'hematite') extraArmor += 8;
    if (allowsArmorBonus && gem === 'carnelian') extraArmor += 6;
    if (gem === 'kyanite' || gem === 'charoite') extraLight += 0.25;
  }

  const derived: WeaponDefinition = {
    ...baseDef,
    id,
    name: formatModifiedEquipmentName(baseDef.name, installedGems),
    passiveShieldBonus:
      (baseDef.passiveShieldBonus || 0) + extraShield > 0
        ? (baseDef.passiveShieldBonus || 0) + extraShield
        : undefined,
    passiveArmorBonus:
      allowsArmorBonus && (baseDef.passiveArmorBonus || 0) + extraArmor > 0
        ? (baseDef.passiveArmorBonus || 0) + extraArmor
        : undefined,
    passiveLightBonus:
      (baseDef.passiveLightBonus || 0) + extraLight > 0
        ? Number(((baseDef.passiveLightBonus || 0) + extraLight).toFixed(2))
        : undefined,
  };
  MODIFIED_WEAPON_CACHE[id] = derived;
  return derived;
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
 * Bows (`category === 'Bows'` or `great_bow`) are designated 2-handed only.
 */
export function isTwoHandOnlyWeapon(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return false;
  const baseId = parseEquipmentInstanceId(def.id).baseId;
  return def.category === 'Bows' || baseId === 'great_bow' || baseId.startsWith('bow_');
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
