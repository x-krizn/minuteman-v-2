/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionTemplate, OrionState, WeaponDefinition } from '../../../types';
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
 * Launchers, Carriers, Quivers, and Dorsal Catalyst Arrays are Back-Mounted Auxiliaries (`slot3` only).
 * They remain mounted on the back even when taking active skill ownership of Skills 4 and 5.
 */
export function isLauncherEquipment(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return false;
  const baseId = parseEquipmentInstanceId(def.id).baseId;
  return (
    def.category === 'Carriers & Munitions' ||
    def.equipmentRole === 'quiver' ||
    def.equipmentRole === 'catalyst' ||
    baseId === 'ln1200_avalanche' ||
    baseId === 'lg950_tomahawk' ||
    baseId.startsWith('carrier_')
  );
}

/**
 * Shields, Launchers, Quivers, and Catalysts are designated Auxiliaries (own Skill 4 and Skill 5).
 * Note: Shields are 1H weapons that equip in Main or Side slot, whereas Launchers/Carriers equip in Aux (Back) slot only.
 */
export function isAuxiliaryEquipment(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return false;
  return (
    isLauncherEquipment(def) ||
    def.equipmentRole === 'shield' ||
    def.category === 'Shields'
  );
}

/**
 * True WEAPONs (occupy Main Hand or Side Hand weapon slots; distinct from Auxiliaries that only provide Skills 4 & 5).
 */
export function isTrueWeaponEquipment(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return false;
  return !isAuxiliaryEquipment(def);
}

/**
 * 1-Handed weapons and Shields can be equipped in either Main Hand (`slot1`) or Side Hand (`slot2`).
 */
export function isOneHandWeapon(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def || isLauncherEquipment(def)) return false;
  return (
    def.handing === '1-hand' ||
    def.category === 'Shields' ||
    def.equipmentRole === 'shield'
  );
}

/**
 * 2-Handed weapons (`handing === '2-hand'` or `category === 'Bows'`).
 * By default these are Main Slot (`slot1`) only in 2H grip unless overridden by a Feat, Unique, Legendary, or weapon variable.
 */
export function isTwoHandWeapon(weaponOrId?: WeaponDefinition | string | null): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def || isLauncherEquipment(def)) return false;
  const baseId = parseEquipmentInstanceId(def.id).baseId;
  return (
    def.handing === '2-hand' ||
    def.category === 'Bows' ||
    baseId === 'great_bow' ||
    baseId.startsWith('bow_')
  );
}

/**
 * Checks whether a 2-Handed weapon has a Feat, Unique, Legendary, or explicit variable override
 * allowing it to be wielded 1-handed in Main Hand or equipped in Side Hand (`slot2`).
 */
export function canBypassTwoHandRestriction(
  weaponOrId?: WeaponDefinition | string | null,
  state?: OrionState
): boolean {
  if (!weaponOrId) return false;
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return false;
  const baseId = parseEquipmentInstanceId(def.id).baseId;
  // Bows physically require both hands to draw the string
  if (def.category === 'Bows' || baseId === 'great_bow' || baseId.startsWith('bow_')) {
    return false;
  }
  if (def.allowOneHandGrip || def.allowSideSlot || def.isLegendary) {
    return true;
  }
  // Bastard Sword is explicitly hand-and-a-half versatile
  if (baseId === 'straight_05_bastard') {
    return true;
  }
  // Counterbalanced Unique Magitech weapons can be wielded 1-handed alongside a Side weapon or Shield
  if (
    def.weaponTier === 'unique' &&
    (baseId === 'ls900_swordspear' ||
      baseId === 'm350_mauler' ||
      baseId === 'hallowed_scepter' ||
      baseId === 'cl700_sanctifier' ||
      baseId === 'wz650_prism_lance')
  ) {
    return true;
  }
  // High-tier Heavy / Titan Grip feats allow 2H weapons to be wielded 1-handed or in Side slot
  if (state?.equippedFeats && state.equippedFeats.length > 0) {
    const hasHeavyGripFeat = state.equippedFeats.some(
      (fid) =>
        fid === 'feat_marauder_3' ||
        fid === 'feat_marauder_5' ||
        fid === 'feat_warrior_5' ||
        fid === 'feat_guardian_5' ||
        fid.includes('titan') ||
        fid.includes('colossus')
    );
    if (hasHeavyGripFeat) return true;
  }
  return false;
}

/**
 * Returns true if the weapon strictly requires a 2-Handed grip in the Main Slot (`slot1`)
 * and does not have an active Feat, Unique, Legendary, or versatile override.
 */
export function isTwoHandOnlyWeapon(
  weaponOrId?: WeaponDefinition | string | null,
  state?: OrionState
): boolean {
  return isTwoHandWeapon(weaponOrId) && !canBypassTwoHandRestriction(weaponOrId, state);
}

/**
 * Validates whether a weapon can be equipped into `slot1` (Main), `slot2` (Side), or `slot3` (Aux Back).
 * - 2H weapons are Main Slot (`slot1`) only unless overridden by Feat, Unique, Legendary, or variable.
 * - 1H weapons (including Shields) are Main (`slot1`) or Side (`slot2`) slot.
 * - Launchers (`Carriers & Munitions`) are Aux Slot (`slot3`) only.
 */
export function canEquipWeaponInSlot(
  weaponOrId: WeaponDefinition | string | null | undefined,
  slot: 'slot1' | 'slot2' | 'slot3',
  state?: OrionState
): { allowed: boolean; reason?: string } {
  if (!weaponOrId) return { allowed: false, reason: 'Unknown equipment.' };
  const def = typeof weaponOrId === 'string' ? getWeaponDefinition(weaponOrId) : weaponOrId;
  if (!def) return { allowed: false, reason: 'Unknown weapon definition.' };

  if (slot === 'slot3') {
    if (isLauncherEquipment(def)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'AUX [BACK] slot only accepts Launchers & Carriers.',
    };
  }

  if (isLauncherEquipment(def)) {
    return {
      allowed: false,
      reason: 'Launchers & Carriers are AUX [BACK] slot only.',
    };
  }

  if (slot === 'slot1') {
    return { allowed: true };
  }

  // slot === 'slot2' (Side Hand)
  if (isTwoHandOnlyWeapon(def, state)) {
    return {
      allowed: false,
      reason: '2H weapons are MAIN slot only unless overridden by a Feat, Unique, or Legendary trait.',
    };
  }
  return { allowed: true };
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
