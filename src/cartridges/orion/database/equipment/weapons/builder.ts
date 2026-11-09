/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DamageFamily,
  DamageType,
  WeaponCategory,
  WeaponDefinition,
  WeaponTier,
  WeaponWeightClass,
} from '../../../types';
import {
  BOLT_CASTER_STRIP_BASE64,
  BUCKLER_SHIELD_STRIP_BASE64,
  GREAT_BOW_STRIP_BASE64,
  HAND_AXE_STRIP_BASE64,
  HEATER_SHIELD_STRIP_BASE64,
  LONG_SWORD_STRIP_BASE64,
  MACE_STRIP_BASE64,
  PAVISE_SHIELD_STRIP_BASE64,
  QUIVER_STRIP_BASE64,
  SHORT_SPEAR_STRIP_BASE64,
  SHOTEL_STRIP_BASE64,
} from './base_sprites';

/**
 * Executes `getDamageFamily` (get damage family) in `builder.ts`.
 */
export function getDamageFamily(dt: DamageType): DamageFamily {
  return dt === 'Beam' || dt === 'Pulse' || dt === 'Wave' ? 'Energy' : 'Kinetic';
}

/**
 * Canonical 9 functional weapon types within each of the 8 Weapon Classes (`WeaponCategory`).
 * Both Customizable (`weaponTier: 'customizable'`) and Unique Magitech (`weaponTier: 'unique'`) weapons
 * share a functional weapon class within their parent category (e.g., `S-2 Turbine Khopesh` and `Khopesh`
 * are both in `Blades: Curved` ▸ `Khopesh`, with `Magitech` vs `Custom` as their subtype).
 */
export const WEAPON_FUNCTIONAL_TYPES_BY_CATEGORY: Record<WeaponCategory, readonly string[]> = {
  Shields: ['Buckler', 'Heater', 'Tower', 'Norman', 'Scutum', 'Corona', 'Mote', 'Disc', 'Rhom'],
  Bows: [
    'Self Bow',
    'Short Bow',
    'Flat Bow',
    'Recurve Bow',
    'Reflex Bow',
    'Composite Bow',
    'Long Bow',
    'Compound Bow',
    'Great Bow',
  ],
  Casters: [
    'Bolt Caster',
    'Beam Caster',
    'Arc Caster',
    'Pulse Caster',
    'Wave Caster',
    'Blast Caster',
    'Nova Caster',
    'Meteoric Caster',
    'Stellar Caster',
  ],
  Spears: [
    'Short Spear',
    'Winged Spear',
    'Javelin',
    'Spetum',
    'Broad Spear',
    'Partisan',
    'Pike',
    'Boar Spear',
    'Lance',
  ],
  'Impact & Axes': [
    'Cudgel',
    'Mace',
    'Spike',
    'Hammer',
    'Mallet',
    'Tomahawk',
    'Parashu',
    'Labrys',
    'Battle Axe',
  ],
  'Blades: Curved': [
    'Wakizashi',
    'Katana',
    'Khopesh',
    'Shotel',
    'Odachi',
    'Kilij',
    'Falx',
    'Dao',
    'Dadao',
  ],
  'Blades: Straight': [
    'Cinquedea',
    'Spatha',
    'Falchion',
    'Arming Sword',
    'Bastard Sword',
    'Messer',
    'Zweihander',
    'Flamberge',
    'Executioner Sword',
  ],
  'Carriers & Munitions': [
    'Bandolier',
    'Quiver',
    'Yebira',
    'Battery',
    'Sheaf',
    'Rack',
    'Plumbata',
    'Kaad',
    'Pangao',
  ],
};

const EXPLICIT_FUNCTIONAL_TYPE_BY_ID: Record<string, string> = {
  // Shields
  aegis_charge_buckler: 'Buckler',
  buckler_shield: 'Buckler',
  aux3_pnsy_rockweiler_buckler: 'Buckler',
  heater_shield: 'Heater',
  pavise_shield: 'Tower',
  utility_sanctum_font: 'Scutum',
  aux4_ti_radiant_sphere: 'Corona',
  aux3_ti_aegis_hardlight: 'Disc',
  aux3_arc_prismatic_barrier: 'Rhom',

  // Bows
  m300_hasta: 'Compound Bow',
  m450_pilum: 'Great Bow',
  great_bow: 'Great Bow',

  // Casters
  n55_gladius: 'Bolt Caster',
  gladius_boltcaster: 'Bolt Caster',
  sv12_viper: 'Bolt Caster',
  sv18_serpent: 'Bolt Caster',
  sr440_shadowfang: 'Bolt Caster',
  b25_brushcutter: 'Bolt Caster',
  rs450_radiant_projector: 'Beam Caster',
  wz800_arclight_cannon: 'Beam Caster',
  wz650_prism_lance: 'Beam Caster',
  cl700_sanctifier: 'Beam Caster',
  cl500_absolution: 'Beam Caster',
  wz450_sparkstrike: 'Arc Caster',
  arc_conductor: 'Arc Caster',
  cl350_litany: 'Pulse Caster',
  m350_mauler: 'Blast Caster',

  // Spears
  short_spear: 'Short Spear',
  ls900_swordspear: 'Broad Spear',
  wz200_manacore_staff: 'Partisan',
  hl220_lightburst_lance: 'Lance',
  avalon_siege_lance: 'Lance',

  // Impact & Axes
  mace: 'Mace',
  hallowed_scepter: 'Mace',
  hand_axe: 'Tomahawk',
  siegebreaker: 'Battle Axe',

  // Blades: Curved
  s2_turbine_khopesh: 'Khopesh',
  khopesh: 'Khopesh',

  // Blades: Straight
  s4_whisper_blade: 'Cinquedea',
  tig_edge: 'Spatha',
  grace_edge: 'Spatha',
  long_sword: 'Arming Sword',
  s6_phantom_edge: 'Messer',

  // Carriers & Munitions
  utility_phantom_shroud: 'Bandolier',
  aux4_rad_ether_vapor: 'Bandolier',
  quiver: 'Quiver',
  aux3_vx_eclipse_cloak: 'Yebira',
  aux4_vx_phase_shift: 'Yebira',
  aether_catalyst: 'Battery',
  utility_arclight_capacitor: 'Battery',
  aux4_arc_feedback_capacitor: 'Battery',
  utility_aegis_pulse: 'Battery',
  aux3_sanc_restoration_field: 'Battery',
  utility_ichor_surge: 'Sheaf',
  utility_siege_brace: 'Sheaf',
  aux3_rad_kinetic_recycling: 'Sheaf',
  ln1200_avalanche: 'Rack',
  lg950_tomahawk: 'Rack',
  aux4_pnsy_rough_rider_booster: 'Rack',
  aux4_sanc_martyrdom_plating: 'Pangao',
};

/**
 * Resolves the canonical functional weapon class within its parent `WeaponCategory`
 * so both Customizable and Unique Magitech weapons share the same functional class
 * (e.g., `S-2 Turbine Khopesh` and `Khopesh` both resolve to `'Khopesh'` under `'Blades: Curved'`).
 */
export function resolveWeaponFunctionalType(
  id: string,
  category: WeaponCategory,
  rawWeaponClass?: string,
  name?: string
): string {
  const cleanId = id.toLowerCase().split('::')[0];
  if (EXPLICIT_FUNCTIONAL_TYPE_BY_ID[cleanId]) {
    return EXPLICIT_FUNCTIONAL_TYPE_BY_ID[cleanId];
  }

  const allowed = WEAPON_FUNCTIONAL_TYPES_BY_CATEGORY[category] || [];
  const rawClsLower = (rawWeaponClass || '').trim().toLowerCase();
  const nameLower = (name || '').trim().toLowerCase();

  for (const ft of allowed) {
    const ftLower = ft.toLowerCase();
    if (rawClsLower === ftLower || nameLower === ftLower) {
      return ft;
    }
  }
  for (const ft of allowed) {
    const ftLower = ft.toLowerCase();
    if (nameLower.includes(ftLower) || rawClsLower.includes(ftLower)) {
      return ft;
    }
  }

  return allowed[0] || rawWeaponClass || name || category;
}

/**
 * Resolves the canonical 8-category assignment (`WeaponCategory`) for any weapon ID or class (`docs/EQUIPMENT_AND_FEATS.md §1`).
 */
export function resolveWeaponCategory(
  id: string,
  weaponClass?: string,
  equipmentRole?: WeaponDefinition['equipmentRole'],
  explicitCategory?: WeaponCategory
): WeaponCategory {
  if (explicitCategory) return explicitCategory;
  const cleanId = id.toLowerCase();
  const cleanCls = (weaponClass || '').toLowerCase();

  // 1. Shields
  if (
    cleanId.startsWith('shield_') ||
    cleanId === 'aegis_charge_buckler' ||
    cleanId === 'buckler_shield' ||
    cleanId === 'heater_shield' ||
    cleanId === 'pavise_shield' ||
    equipmentRole === 'shield'
  ) {
    return 'Shields';
  }

  // 2. Bows (including M-300 Hasta Polybolos & M-450 Pilum Ballista)
  if (
    cleanId.startsWith('bow_') ||
    cleanId === 'great_bow' ||
    cleanId === 'm300_hasta' ||
    cleanId === 'm450_pilum' ||
    cleanCls.includes('bow') ||
    cleanCls.includes('polybolos') ||
    cleanCls.includes('ballista')
  ) {
    return 'Bows';
  }

  // 8. Carriers & Munitions (including LN-1200 Avalanche Rocket System & LG-950 Tomahawk Missile System)
  if (
    cleanId.startsWith('carrier_') ||
    cleanId === 'quiver' ||
    cleanId === 'aether_catalyst' ||
    cleanId === 'ln1200_avalanche' ||
    cleanId === 'lg950_tomahawk' ||
    equipmentRole === 'quiver' ||
    equipmentRole === 'catalyst' ||
    cleanCls.includes('rocket') ||
    cleanCls.includes('missile')
  ) {
    return 'Carriers & Munitions';
  }

  // 4. Spears (including LS-900 Swordspear, HL-220 Lightburst Lance, WZ-200 Manacore Staff)
  if (
    cleanId.startsWith('spear_') ||
    cleanId === 'short_spear' ||
    cleanId === 'ls900_swordspear' ||
    cleanId === 'hl220_lightburst_lance' ||
    cleanId === 'avalon_siege_lance' ||
    cleanId === 'wz200_manacore_staff' ||
    cleanCls.includes('polearm') ||
    cleanCls.includes('lance') ||
    cleanCls.includes('spear')
  ) {
    return 'Spears';
  }

  // 5. Impact & Axes (including Siegebreaker & Hallowed Scepter)
  if (
    cleanId.startsWith('hafted_') ||
    cleanId === 'mace' ||
    cleanId === 'hand_axe' ||
    cleanId === 'siegebreaker' ||
    cleanId === 'hallowed_scepter' ||
    cleanCls.includes('axe') ||
    cleanCls.includes('blunt') ||
    cleanCls.includes('hybrid staff') ||
    cleanCls.includes('hammer')
  ) {
    return 'Impact & Axes';
  }

  // 6. Blades: Curved (including S-2 Turbine Khopesh)
  if (
    cleanId.startsWith('curved_') ||
    cleanId === 's2_turbine_khopesh' ||
    cleanId === 'khopesh'
  ) {
    return 'Blades: Curved';
  }

  // 7. Blades: Straight (including TIG Edge, S-4 Whisper Blade, S-6 Phantom Edge, Grace Edge, Camelot Longsword)
  if (
    cleanId.startsWith('straight_') ||
    cleanId === 'long_sword' ||
    cleanId === 'tig_edge' ||
    cleanId === 's4_whisper_blade' ||
    cleanId === 's6_phantom_edge' ||
    cleanId === 'grace_edge' ||
    equipmentRole === 'melee'
  ) {
    return 'Blades: Straight';
  }

  // 3. Casters (Bolters, Gatlings, Grenade Cannons, Beam/Pulse/Hybrid Rifles & Projectors)
  return 'Casters';
}

/**
 * Selects the default embedded placeholder Base64 sprite strip (`144x16` `px`) for a given `WeaponCategory` and `WeaponWeightClass`.
 */
export function getDefaultPlaceholderStripForCategory(
  category: WeaponCategory,
  weightClass: WeaponWeightClass,
  id?: string
): string {
  switch (category) {
    case 'Shields':
      if (weightClass === 'heavy') return PAVISE_SHIELD_STRIP_BASE64;
      if (weightClass === 'medium') return HEATER_SHIELD_STRIP_BASE64;
      return BUCKLER_SHIELD_STRIP_BASE64;
    case 'Bows':
      return GREAT_BOW_STRIP_BASE64;
    case 'Casters':
      return BOLT_CASTER_STRIP_BASE64;
    case 'Spears':
      return SHORT_SPEAR_STRIP_BASE64;
    case 'Impact & Axes':
      return id &&
        (id.includes('axe') ||
          id.includes('tomahawk') ||
          id.includes('parashu') ||
          id.includes('labrys') ||
          id.includes('battle') ||
          id.includes('spike'))
        ? HAND_AXE_STRIP_BASE64
        : MACE_STRIP_BASE64;
    case 'Blades: Curved':
      return SHOTEL_STRIP_BASE64;
    case 'Blades: Straight':
      return LONG_SWORD_STRIP_BASE64;
    case 'Carriers & Munitions':
      return QUIVER_STRIP_BASE64;
  }
}

/**
 * Type contract for `MagitechWeaponSkillSeed` (magitech weapon skill seed) in `builder.ts`.
 */
export interface MagitechWeaponSkillSeed {
  name: string;
  desc: string;
  dmg?: number;
  cd?: number;
  heat?: number;
  dt?: DamageType;
  isBlock?: boolean;
}

/**
 * Type contract for `MagitechWeaponSeed` (magitech weapon seed) in `builder.ts`.
 */
export interface MagitechWeaponSeed {
  id: string;
  name: string;
  category?: WeaponCategory;
  weaponTier?: WeaponTier;
  archetypeNumber?: string;
  weaponClass: string;
  primaryDamageType: DamageType;
  adaptiveDamageTypes?: [DamageType, DamageType];
  supportPulseOnHit?: {
    shieldRestore?: number;
    armorRestore?: number;
    heatVent?: number;
  };
  weightClass: WeaponWeightClass;
  baseAttackWeight?: number;
  baseAttackSpeed?: number;
  projectileWeight?: number;
  skillCount?: number;
  loadoutSlots: string[];
  equipmentRole: 'ranged' | 'melee' | 'shield' | 'catalyst' | 'quiver';
  handing?: '1-hand' | '2-hand' | 'off-hand-only' | 'buff-accessory';
  canBlock?: boolean;
  passiveShieldBonus?: number;
  passiveArmorBonus?: number;
  passiveLightBonus?: number;
  bladeTrailColor: string;
  identity: string;
  lore: string;
  shotsPerChain: number;
  damagePerShot: number;
  chainDurationSec: number;
  reloadDurationSec: number;
  range: number;
  customStripBase64?: string;
  isPlaceholderAsset?: boolean;
  futureAssetPlanned?: string;
  skills: [
    { name: string; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; isBlock?: boolean; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; desc: string }
  ];
}

/**
 * Executes `buildMagitechWeapon` (build magitech weapon) in `builder.ts`.
 */
export function buildMagitechWeapon(seed: MagitechWeaponSeed): WeaponDefinition {
  const resolvedCategory = resolveWeaponCategory(
    seed.id,
    seed.weaponClass,
    seed.equipmentRole,
    seed.category
  );
  const resolvedTier: WeaponTier = seed.weaponTier || 'unique';
  const resolvedFunctionalType = resolveWeaponFunctionalType(
    seed.id,
    resolvedCategory,
    seed.weaponClass,
    seed.name
  );
  const subtypeLabel = resolvedTier === 'unique' ? 'Magitech' : 'Custom';
  const strip =
    seed.customStripBase64 ||
    getDefaultPlaceholderStripForCategory(resolvedCategory, seed.weightClass, seed.id);

  const dt0 = seed.primaryDamageType;
  const dt1 = seed.skills[1].dt || dt0;
  const dt2 = seed.skills[2].dt || dt0;
  const dt3 = seed.skills[3].dt || (seed.canBlock ? 'Impact' : dt0);
  const dt4 = seed.skills[4].dt || dt0;

  const isPlch = seed.isPlaceholderAsset !== undefined ? seed.isPlaceholderAsset : true;
  const futurePlanned =
    seed.futureAssetPlanned ||
    `Dedicated custom ${resolvedCategory} (${seed.name}) sprite strip & hardpoint render planned. Currently using placeholder ${resolvedCategory.toLowerCase()} asset.`;

  const defaultAttackWeight =
    seed.baseAttackWeight ??
    (seed.weightClass === 'heavy' ? 28 : seed.weightClass === 'medium' ? 16 : 9);
  const defaultAttackSpeed =
    seed.baseAttackSpeed ??
    (seed.weightClass === 'heavy' ? 0.85 : seed.weightClass === 'medium' ? 1.05 : 1.3);
  const defaultProjectileWeight =
    seed.projectileWeight ??
    (seed.equipmentRole === 'ranged' || seed.equipmentRole === 'quiver'
      ? seed.weightClass === 'heavy'
        ? 14
        : seed.weightClass === 'medium'
          ? 8
          : 4
      : undefined);

  return {
    id: seed.id,
    name: seed.name,
    category: resolvedCategory,
    weaponTier: resolvedTier,
    archetypeNumber: seed.archetypeNumber,
    class: `${resolvedCategory} · ${resolvedFunctionalType} (${subtypeLabel})`,
    weaponClass: resolvedFunctionalType,
    skillCount: seed.skillCount,
    loadoutSlots: seed.loadoutSlots,
    adaptiveDamageTypes: seed.adaptiveDamageTypes,
    supportPulseOnHit: seed.supportPulseOnHit,
    equipmentRole: seed.equipmentRole,
    handing:
      seed.handing ||
      (seed.equipmentRole === 'shield' || seed.equipmentRole === 'catalyst'
        ? 'off-hand-only'
        : resolvedCategory === 'Bows' || seed.weightClass === 'heavy'
          ? '2-hand'
          : '1-hand'),
    weightClass: seed.weightClass,
    baseAttackWeight: defaultAttackWeight,
    baseAttackSpeed: defaultAttackSpeed,
    projectileWeight: defaultProjectileWeight,
    canBlock: Boolean(seed.canBlock || seed.equipmentRole === 'melee' || seed.equipmentRole === 'shield'),
    passiveShieldBonus: seed.passiveShieldBonus,
    passiveArmorBonus: seed.passiveArmorBonus,
    passiveLightBonus: seed.passiveLightBonus,
    bladeTrailColor: seed.bladeTrailColor,
    description: `${seed.identity} (${resolvedCategory} · ${resolvedFunctionalType} · Subtype: ${subtypeLabel} · ${seed.weightClass.toUpperCase()} load).`,
    lore: seed.lore,
    shotsPerChain: seed.shotsPerChain,
    damagePerShot: seed.damagePerShot,
    chainDurationSec: seed.chainDurationSec,
    reloadDurationSec: seed.reloadDurationSec,
    primaryDamageType: seed.primaryDamageType,
    variantStripBase64: strip,
    hardpointSprite: {
      base64: strip,
      cellWidth: 16,
      cellHeight: 16,
      col: 0,
      row: 0,
      renderWidth: 14,
      renderHeight: 14,
      anchor: 'center',
      orientFromEast: true,
    },
    iconSprite: {
      base64: strip,
      cellWidth: 16,
      cellHeight: 16,
      col: 0,
      row: 0,
      anchor: 'center',
    },
    isPlaceholderAsset: isPlch,
    futureAssetPlanned: futurePlanned,
    moveset: [
      {
        slot: 0,
        name: seed.skills[0].name,
        damageType: dt0,
        damageFamily: getDamageFamily(dt0),
        damage: seed.damagePerShot,
        tellDurationSec: seed.equipmentRole === 'melee' ? 0.08 : 0.09,
        actionDurationSec: seed.chainDurationSec,
        cooldownSec: 0,
        isChain: true,
        reloadDurationSec: seed.reloadDurationSec,
        heatCost: seed.weightClass === 'heavy' ? 5 : seed.weightClass === 'medium' ? 3 : 2,
        range: seed.range,
        description: seed.skills[0].desc,
      },
      {
        slot: 1,
        name: seed.skills[1].name,
        damageType: dt1,
        damageFamily: getDamageFamily(dt1),
        damage: seed.skills[1].dmg,
        tellDurationSec: 0.22,
        actionDurationSec: 0.35,
        cooldownSec: seed.skills[1].cd,
        heatCost: seed.skills[1].heat,
        range: Math.round(seed.range * 1.15),
        description: seed.skills[1].desc,
      },
      {
        slot: 2,
        name: seed.skills[2].name,
        damageType: dt2,
        damageFamily: getDamageFamily(dt2),
        damage: seed.skills[2].dmg,
        tellDurationSec: 0.28,
        actionDurationSec: 0.4,
        cooldownSec: seed.skills[2].cd,
        heatCost: seed.skills[2].heat,
        range: seed.range,
        description: seed.skills[2].desc,
      },
      {
        slot: 3,
        name: seed.skills[3].name,
        damageType: dt3,
        damageFamily: getDamageFamily(dt3),
        damage: seed.skills[3].dmg,
        tellDurationSec: seed.skills[3].isBlock ? 0.04 : 0.2,
        actionDurationSec: seed.skills[3].isBlock ? 0.2 : 0.38,
        cooldownSec: seed.skills[3].isBlock ? 0 : seed.skills[3].cd,
        isBlock: Boolean(seed.skills[3].isBlock),
        heatCost: seed.skills[3].heat,
        range: seed.skills[3].isBlock ? 24 : Math.round(seed.range * 0.9),
        description: seed.skills[3].desc,
      },
      {
        slot: 4,
        name: seed.skills[4].name,
        damageType: dt4,
        damageFamily: getDamageFamily(dt4),
        damage: seed.skills[4].dmg,
        tellDurationSec: 0.38,
        actionDurationSec: 0.65,
        cooldownSec: seed.skills[4].cd,
        heatCost: seed.skills[4].heat,
        range: Math.round(seed.range * 1.1),
        description: seed.skills[4].desc,
      },
    ],
  };
}

/**
 * Action descriptor seed for one of the 72 Customizable Weapons (`docs/EQUIPMENT_AND_FEATS.md §1`).
 */
export interface CustomizableWeaponActionSeed {
  slot: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  damageMultiplier: number;
  rangeMultiplier: number;
  cooldown: number;
  energyCost: number;
}

/**
 * Seed contract for building one of the 72 Customizable Standard Weapons (`9` functional types across each of the `8` categories).
 */
export interface CustomizableWeaponSeed {
  id: string;
  name: string;
  category: WeaponCategory;
  archetypeNumber: string;
  description: string;
  equipmentRole: 'ranged' | 'melee' | 'shield' | 'catalyst' | 'quiver';
  handing: '1-hand' | '2-hand' | 'off-hand-only' | 'buff-accessory';
  weightClass: 'Light' | 'Medium' | 'Heavy' | WeaponWeightClass;
  primaryDamageType: DamageType;
  range: number;
  shotsPerChain: number;
  damagePerShot: number;
  chainDuration: number;
  reloadDuration: number;
  canBlock?: boolean;
  passiveArmorBonus?: number;
  passiveShieldBonus?: number;
  passiveLightBonus?: number;
  spriteStripBase64?: string;
  actions: [
    CustomizableWeaponActionSeed,
    CustomizableWeaponActionSeed,
    CustomizableWeaponActionSeed,
    CustomizableWeaponActionSeed,
    CustomizableWeaponActionSeed,
  ];
}

/**
 * Builds one of the 72 Customizable Standard Weapons (`docs/EQUIPMENT_AND_FEATS.md §1`, `weaponTier: 'customizable'`, `3` Armory slots).
 */
export function buildCustomizableWeapon(seed: CustomizableWeaponSeed): WeaponDefinition {
  const normalizedWeight: WeaponWeightClass =
    seed.weightClass.toLowerCase() as WeaponWeightClass;
  const isBlockSlot4 = Boolean(
    seed.canBlock || seed.equipmentRole === 'melee' || seed.equipmentRole === 'shield'
  );
  const loadoutSlots =
    seed.equipmentRole === 'shield' ||
    seed.equipmentRole === 'quiver' ||
    seed.equipmentRole === 'catalyst'
      ? ['Aux 1', 'Aux 2']
      : seed.handing === '2-hand'
        ? ['Weapon 1', 'Weapon 2']
        : ['Weapon 1', 'Weapon 2', 'Aux 1'];

  const trailByDamage: Record<DamageType, string> = {
    Impact: '#f8fafc',
    Pierce: '#e2e8f0',
    Blast: '#fb923c',
    Beam: '#fde047',
    Pulse: '#38bdf8',
    Wave: '#c084fc',
  };

  return buildMagitechWeapon({
    id: seed.id,
    name: seed.name,
    category: seed.category,
    weaponTier: 'customizable',
    archetypeNumber: seed.archetypeNumber,
    weaponClass: seed.name,
    primaryDamageType: seed.primaryDamageType,
    weightClass: normalizedWeight,
    loadoutSlots,
    equipmentRole: seed.equipmentRole,
    handing: seed.handing,
    canBlock: isBlockSlot4,
    passiveShieldBonus: seed.passiveShieldBonus,
    passiveArmorBonus: seed.passiveArmorBonus,
    passiveLightBonus: seed.passiveLightBonus,
    bladeTrailColor: trailByDamage[seed.primaryDamageType] || '#f8fafc',
    identity: seed.description,
    lore: seed.description,
    shotsPerChain: seed.shotsPerChain,
    damagePerShot: seed.damagePerShot,
    chainDurationSec: seed.chainDuration,
    reloadDurationSec: seed.reloadDuration,
    range: seed.range,
    customStripBase64: seed.spriteStripBase64,
    isPlaceholderAsset: true,
    skills: [
      {
        name: seed.actions[0].name,
        desc: seed.actions[0].description,
      },
      {
        name: seed.actions[1].name,
        dmg: Math.max(8, Math.round(seed.damagePerShot * seed.actions[1].damageMultiplier)),
        cd: seed.actions[1].cooldown,
        heat: seed.actions[1].energyCost,
        desc: seed.actions[1].description,
      },
      {
        name: seed.actions[2].name,
        dmg: Math.max(10, Math.round(seed.damagePerShot * seed.actions[2].damageMultiplier)),
        cd: seed.actions[2].cooldown,
        heat: seed.actions[2].energyCost,
        desc: seed.actions[2].description,
      },
      {
        name: isBlockSlot4 ? 'Block' : seed.actions[3].name,
        dmg: Math.max(8, Math.round(seed.damagePerShot * Math.max(0.8, seed.actions[3].damageMultiplier))),
        cd: isBlockSlot4 ? 0 : seed.actions[3].cooldown,
        heat: isBlockSlot4 ? 3 : seed.actions[3].energyCost,
        isBlock: isBlockSlot4,
        desc: isBlockSlot4
          ? `${seed.actions[3].description} (0.25s Perfect Block window).`
          : seed.actions[3].description,
      },
      {
        name: seed.actions[4].name,
        dmg: Math.max(16, Math.round(seed.damagePerShot * seed.actions[4].damageMultiplier)),
        cd: seed.actions[4].cooldown,
        heat: seed.actions[4].energyCost,
        desc: seed.actions[4].description,
      },
    ],
  });
}

