/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionDefinition,
  DamageFamily,
  DamageType,
  MeleeComboStepSpec,
  WeaponCategory,
  WeaponDefinition,
  WeaponTier,
  WeaponWeightClass,
} from '../../../types';
import {
  buildWeaponUniqueComboSequence as buildFunctionalTypeComboSequence,
  RangedBasicShotProfile,
  resolveRangedBasicShotProfile,
  WEAPON_BCU_REFERENCE,
} from './comboChoreography';
import {
  blade_curved_dadao,
  blade_curved_dao,
  blade_curved_falx,
  blade_curved_katana,
  blade_curved_khopesh,
  blade_curved_kilij,
  blade_curved_odachi,
  blade_curved_shotel,
  blade_curved_wakizashi,
  blade_straight_arming,
  blade_straight_bastard,
  blade_straight_cinquedea,
  blade_straight_executioner,
  blade_straight_falchion,
  blade_straight_flamberge,
  blade_straight_messer,
  blade_straight_spatha,
  blade_straight_zweihander,
  bow_composite,
  bow_compound,
  bow_flat,
  bow_great,
  bow_long,
  bow_recurve,
  bow_reflex,
  bow_self,
  bow_short,
  caster_arc,
  caster_beam,
  caster_blast,
  caster_bolt,
  caster_meteoric,
  caster_nova,
  caster_pulse,
  caster_stellar,
  caster_wave,
  impact_axe_battle,
  impact_axe_cudgel,
  impact_axe_hammer,
  impact_axe_labrys,
  impact_axe_mace,
  impact_axe_mallet,
  impact_axe_parashu,
  impact_axe_spike,
  impact_axe_tomahawk,
  launcher_bandolier,
  launcher_battery,
  launcher_kaad,
  launcher_pangao,
  launcher_plumbata,
  launcher_quiver,
  launcher_rack,
  launcher_sheaf,
  launcher_yebira,
  shield_buckler,
  shield_corona,
  shield_disc,
  shield_heater,
  shield_mote,
  shield_norman,
  shield_rhom,
  shield_scutum,
  shield_tower,
  spear_boar,
  spear_broad,
  spear_javelin,
  spear_lance,
  spear_partisan,
  spear_pike,
  spear_short,
  spear_spetum,
  spear_winged,
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
  wz650_prism_lance: 'Beam Caster',
  cl700_sanctifier: 'Beam Caster',
  wz450_sparkstrike: 'Arc Caster',
  arc_conductor: 'Pulse Caster',
  cl350_litany: 'Pulse Caster',
  cl500_absolution: 'Wave Caster',
  m350_mauler: 'Blast Caster',
  wz800_arclight_cannon: 'Stellar Caster',

  // Spears
  short_spear: 'Short Spear',
  wz200_manacore_staff: 'Spetum',
  ls900_swordspear: 'Partisan',
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
  s6_phantom_edge: 'Spatha',
  grace_edge: 'Spatha',
  tig_edge: 'Arming Sword',
  long_sword: 'Arming Sword',
  straight_09_executioner: 'Executioner Sword',

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
  lg950_tomahawk: 'Battery',
  utility_ichor_surge: 'Sheaf',
  utility_siege_brace: 'Sheaf',
  aux3_rad_kinetic_recycling: 'Sheaf',
  ln1200_avalanche: 'Rack',
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
    if (
      nameLower.includes(ftLower) ||
      rawClsLower.includes(ftLower) ||
      (nameLower.length >= 4 && ftLower.includes(nameLower)) ||
      (rawClsLower.length >= 4 && ftLower.includes(rawClsLower))
    ) {
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
 * Resolves the canonical `16x224` pixel-art vertical sprite strip (`launcher_*`) for each of the 9
 * functional weapon types within `Carriers & Munitions`.
 */
export function getCarrierLauncherStripForFunctionalType(functionalType: string): string {
  switch (functionalType) {
    case 'Bandolier':
      return launcher_bandolier;
    case 'Quiver':
      return launcher_quiver;
    case 'Yebira':
      return launcher_yebira;
    case 'Battery':
      return launcher_battery;
    case 'Sheaf':
      return launcher_sheaf;
    case 'Rack':
      return launcher_rack;
    case 'Plumbata':
      return launcher_plumbata;
    case 'Kaad':
      return launcher_kaad;
    case 'Pangao':
      return launcher_pangao;
    default:
      return launcher_quiver;
  }
}

/**
 * Resolves the dedicated `16x224` 14-row vertical pixel-art sprite strip for any `(category, functionalType)`
 * combination across all 72 canonical weapon archetypes (`8 Weapon Classes × 9 Functional Types`).
 */
export function getWeaponStripForFunctionalType(
  category: WeaponCategory,
  functionalType: string
): string {
  switch (category) {
    case 'Shields':
      switch (functionalType) {
        case 'Buckler':
          return shield_buckler;
        case 'Heater':
          return shield_heater;
        case 'Tower':
          return shield_tower;
        case 'Norman':
          return shield_norman;
        case 'Scutum':
          return shield_scutum;
        case 'Corona':
          return shield_corona;
        case 'Mote':
          return shield_mote;
        case 'Disc':
          return shield_disc;
        case 'Rhom':
          return shield_rhom;
        default:
          return shield_heater;
      }
    case 'Bows':
      switch (functionalType) {
        case 'Self Bow':
          return bow_self;
        case 'Short Bow':
          return bow_short;
        case 'Flat Bow':
          return bow_flat;
        case 'Recurve Bow':
          return bow_recurve;
        case 'Reflex Bow':
          return bow_reflex;
        case 'Composite Bow':
          return bow_composite;
        case 'Long Bow':
          return bow_long;
        case 'Compound Bow':
          return bow_compound;
        case 'Great Bow':
          return bow_great;
        default:
          return bow_great;
      }
    case 'Casters':
      switch (functionalType) {
        case 'Bolt Caster':
          return caster_bolt;
        case 'Beam Caster':
          return caster_beam;
        case 'Arc Caster':
          return caster_arc;
        case 'Pulse Caster':
          return caster_pulse;
        case 'Wave Caster':
          return caster_wave;
        case 'Blast Caster':
          return caster_blast;
        case 'Nova Caster':
          return caster_nova;
        case 'Meteoric Caster':
          return caster_meteoric;
        case 'Stellar Caster':
          return caster_stellar;
        default:
          return caster_bolt;
      }
    case 'Spears':
      switch (functionalType) {
        case 'Short Spear':
          return spear_short;
        case 'Winged Spear':
          return spear_winged;
        case 'Javelin':
          return spear_javelin;
        case 'Spetum':
          return spear_spetum;
        case 'Broad Spear':
          return spear_broad;
        case 'Partisan':
          return spear_partisan;
        case 'Pike':
          return spear_pike;
        case 'Boar Spear':
          return spear_boar;
        case 'Lance':
          return spear_lance;
        default:
          return spear_short;
      }
    case 'Impact & Axes':
      switch (functionalType) {
        case 'Cudgel':
          return impact_axe_cudgel;
        case 'Mace':
          return impact_axe_mace;
        case 'Spike':
          return impact_axe_spike;
        case 'Hammer':
          return impact_axe_hammer;
        case 'Mallet':
          return impact_axe_mallet;
        case 'Tomahawk':
          return impact_axe_tomahawk;
        case 'Parashu':
          return impact_axe_parashu;
        case 'Labrys':
          return impact_axe_labrys;
        case 'Battle Axe':
          return impact_axe_battle;
        default:
          return impact_axe_mace;
      }
    case 'Blades: Curved':
      switch (functionalType) {
        case 'Wakizashi':
          return blade_curved_wakizashi;
        case 'Katana':
          return blade_curved_katana;
        case 'Khopesh':
          return blade_curved_khopesh;
        case 'Shotel':
          return blade_curved_shotel;
        case 'Odachi':
          return blade_curved_odachi;
        case 'Kilij':
          return blade_curved_kilij;
        case 'Falx':
          return blade_curved_falx;
        case 'Dao':
          return blade_curved_dao;
        case 'Dadao':
          return blade_curved_dadao;
        default:
          return blade_curved_shotel;
      }
    case 'Blades: Straight':
      switch (functionalType) {
        case 'Cinquedea':
          return blade_straight_cinquedea;
        case 'Spatha':
          return blade_straight_spatha;
        case 'Falchion':
          return blade_straight_falchion;
        case 'Arming Sword':
          return blade_straight_arming;
        case 'Bastard Sword':
          return blade_straight_bastard;
        case 'Messer':
          return blade_straight_messer;
        case 'Zweihander':
          return blade_straight_zweihander;
        case 'Flamberge':
          return blade_straight_flamberge;
        case 'Executioner':
        case 'Executioner Sword':
          return blade_straight_executioner;
        default:
          return blade_straight_arming;
      }
    case 'Carriers & Munitions':
      return getCarrierLauncherStripForFunctionalType(functionalType);
  }
}

/**
 * Selects the default embedded Base64 `16x224` vertical sprite strip for a given `WeaponCategory`, `WeaponWeightClass`, and `functionalType`.
 */
export function getDefaultPlaceholderStripForCategory(
  category: WeaponCategory,
  _weightClass: WeaponWeightClass,
  id?: string,
  functionalType?: string
): string {
  const resolvedFt = functionalType || resolveWeaponFunctionalType(id || '', category);
  return getWeaponStripForFunctionalType(category, resolvedFt);
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
    getDefaultPlaceholderStripForCategory(
      resolvedCategory,
      seed.weightClass,
      seed.id,
      resolvedFunctionalType
    );

  const dt0 = seed.primaryDamageType;
  const dt1 = seed.skills[1].dt || dt0;
  const dt2 = seed.skills[2].dt || dt0;
  const dt3 = seed.skills[3].dt || (seed.canBlock ? 'Impact' : dt0);
  const dt4 = seed.skills[4].dt || dt0;

  const isPlch = seed.isPlaceholderAsset !== undefined ? seed.isPlaceholderAsset : false;
  const futurePlanned = isPlch
    ? seed.futureAssetPlanned ||
      `Dedicated custom ${resolvedCategory} (${seed.name}) sprite strip & hardpoint render planned. Currently using placeholder ${resolvedCategory.toLowerCase()} asset.`
    : undefined;
  const defaultStripRow = resolvedTier === 'unique' ? 12 : 0;

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

  const rawWeapon: WeaponDefinition = {
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
      row: defaultStripRow,
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
      row: defaultStripRow,
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
        tellDurationSec: seed.equipmentRole === 'melee' ? 0.14 : 0.12,
        actionDurationSec: seed.chainDurationSec,
        cooldownSec: 0,
        isChain: true,
        reloadDurationSec: seed.reloadDurationSec,
        heatCost: seed.weightClass === 'heavy' ? 10 : seed.weightClass === 'medium' ? 7 : 5,
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

  return normalizeWeaponCombatFunctions(rawWeapon);
}

/**
 * Canonical Combat Tempo Constants anchored to a **Medium (`1.00×`)** deliberate tactical baseline
 * (`40–50%` slower than arcade pace) with a **Moderate `±30%` spread**
 * (`Light = +30%` faster rate / `0.77×` cycle duration; `Heavy = -30%` slower rate / `1.30×` cycle duration)
 * and **`[0.70×, 1.30×]`** stacked multiplier caps.
 */
export const COMBAT_TEMPO_CONSTANTS = {
  /** Hard lower bound on stacked speed/cooldown/tell multipliers (`-30%` from baseline) */
  MULTIPLIER_MIN: 0.7,
  /** Hard upper bound on stacked speed/cooldown/tell multipliers (`+30%` from baseline) */
  MULTIPLIER_MAX: 1.3,
  /** Cycle duration multiplier by weight class around Medium (`1.00×`) baseline */
  WEIGHT_CYCLE_SCALE: {
    light: 0.77, // +30% faster tempo (1 / 1.30)
    medium: 1.0, // 1.00x baseline
    heavy: 1.3, // -30% slower tempo
  } as const,
  /** Ranged Basic Attack (`Slot 0`) per-shot cycle time in seconds (Medium = `0.34s` / `~2.9 shots/s`) */
  RANGED_BASIC_SHOT_SEC: {
    light: 0.26, // ~3.8 shots/s
    medium: 0.34, // ~2.9 shots/s baseline
    heavy: 0.44, // ~2.3 shots/s
    minFloor: 0.22, // Strict floor (<= 4.5 shots/s max with all buffs)
    maxCap: 0.56,
  } as const,
  /** Melee Fluid Combo (`Slot 0`) per-strike cycle time in seconds (Medium = `0.45s` / `~2.2 strikes/s`) */
  MELEE_COMBO_STEP_SEC: {
    light: 0.35, // ~2.85 strikes/s
    medium: 0.45, // ~2.22 strikes/s baseline
    heavy: 0.59, // ~1.69 strikes/s
    minFloor: 0.28, // Strict floor (<= 3.5 strikes/s max with all buffs)
    maxCap: 0.74,
  } as const,
  /** Bow Single-Shot Hold-to-Charge (`Slot 0`) full draw duration in seconds (Medium = `1.15s`) */
  BOW_FULL_DRAW_SEC: {
    light: 0.88,
    medium: 1.15,
    heavy: 1.5,
    minFloor: 0.75,
    maxCap: 1.75,
  } as const,
  /** Bow Single-Shot nock/reload duration in seconds (Medium = `0.95s`) */
  BOW_NOCK_RELOAD_SEC: {
    light: 0.73,
    medium: 0.95,
    heavy: 1.24,
  } as const,
  /** Tactical Skill (`Slots 1–4`) tell & action duration baselines by weight class */
  SKILL_TELL_SEC: {
    light: 0.24,
    medium: 0.32,
    heavy: 0.42,
    minFloor: 0.18,
    maxCap: 0.58,
  } as const,
  SKILL_ACTION_SEC: {
    light: 0.35,
    medium: 0.46,
    heavy: 0.6,
    minFloor: 0.26,
    maxCap: 0.8,
  } as const,
} as const;

/**
 * Clamps any cumulative speed, cooldown, tell, or passive mobility multiplier
 * into the canonical `[0.70, 1.30]` (`±30%`) band around the `1.00×` Medium baseline.
 */
export function clampTempoMultiplier(
  mult: number,
  min: number = COMBAT_TEMPO_CONSTANTS.MULTIPLIER_MIN,
  max: number = COMBAT_TEMPO_CONSTANTS.MULTIPLIER_MAX
): number {
  if (!Number.isFinite(mult)) return 1.0;
  return Math.max(min, Math.min(max, mult));
}

/**
 * Unified combat archetype descriptor derived from a weapon's canonical `WeaponCategory` (8 classes)
 * and `weaponClass` (9 functional types per class), eliminating hardcoded legacy weapon ID branches.
 */
export interface WeaponCombatArchetype {
  category: WeaponCategory;
  functionalType: string;
  weightClass: WeaponWeightClass;
  isShield: boolean;
  isTowerOrHeavyShield: boolean;
  isBucklerOrDiscShield: boolean;
  isBow: boolean;
  isSpearOrPolearm: boolean;
  isLanceOrPike: boolean;
  isImpactOrAxe: boolean;
  isAxe: boolean;
  isBluntOrStaff: boolean;
  isCurvedBlade: boolean;
  isHookBlade: boolean;
  isStraightBlade: boolean;
  isDaggerOrShortBlade: boolean;
  isGreatsword: boolean;
  isBlade: boolean;
  isMelee: boolean;
  isMeleeOrShield: boolean;
  isCarrierOrMunition: boolean;
  isQuiverOrBandolier: boolean;
  isCatalystOrBattery: boolean;
  isExplosiveOrdnance: boolean;
  isRapidCaster: boolean;
  isBeamOrStellarCaster: boolean;
  isHybridLanceOrStaff: boolean;
  hasShieldBypassEdge: boolean;
}

/**
 * Classifies any weapon definition (across all 72 Customizable and 29 Magitech weapons)
 * into its unified combat archetype using the 8 Weapon Classes and 9 Functional Types.
 */
export function classifyWeaponCombatArchetype(
  weapon?: Partial<WeaponDefinition> | null,
  fallbackId?: string
): WeaponCombatArchetype {
  const id = (weapon?.id || fallbackId || '').toLowerCase().split('::')[0];
  const category = resolveWeaponCategory(
    id,
    weapon?.weaponClass,
    weapon?.equipmentRole,
    weapon?.category
  );
  const functionalType = resolveWeaponFunctionalType(
    id,
    category,
    weapon?.weaponClass,
    weapon?.name
  );
  const weightClass: WeaponWeightClass = weapon?.weightClass || 'medium';

  const isShield = category === 'Shields' || weapon?.equipmentRole === 'shield';
  const isTowerOrHeavyShield =
    isShield &&
    (functionalType === 'Tower' ||
      functionalType === 'Scutum' ||
      functionalType === 'Norman' ||
      weightClass === 'heavy');
  const isBucklerOrDiscShield =
    isShield &&
    (functionalType === 'Buckler' ||
      functionalType === 'Disc' ||
      functionalType === 'Mote' ||
      functionalType === 'Corona' ||
      functionalType === 'Rhom');
  const isBow = category === 'Bows' || Boolean(weapon?.moveset?.[0]?.isChargeable);
  const isSpearOrPolearm = category === 'Spears';
  const isLanceOrPike =
    isSpearOrPolearm &&
    (functionalType === 'Lance' ||
      functionalType === 'Pike' ||
      functionalType === 'Boar Spear');
  const isImpactOrAxe = category === 'Impact & Axes';
  const isAxe =
    isImpactOrAxe &&
    (functionalType === 'Tomahawk' ||
      functionalType === 'Parashu' ||
      functionalType === 'Labrys' ||
      functionalType === 'Battle Axe');
  const isBluntOrStaff =
    (isImpactOrAxe && !isAxe) ||
    (isSpearOrPolearm &&
      (functionalType === 'Partisan' || functionalType === 'Spetum') &&
      weapon?.primaryDamageType === 'Wave');
  const isCurvedBlade = category === 'Blades: Curved';
  const isHookBlade =
    isCurvedBlade &&
    (functionalType === 'Khopesh' ||
      functionalType === 'Shotel' ||
      functionalType === 'Falx');
  const isStraightBlade = category === 'Blades: Straight';
  const isDaggerOrShortBlade =
    (isStraightBlade &&
      (functionalType === 'Cinquedea' || functionalType === 'Spatha')) ||
    (isCurvedBlade && functionalType === 'Wakizashi');
  const isGreatsword =
    (isStraightBlade &&
      (functionalType === 'Zweihander' ||
        functionalType === 'Flamberge' ||
        functionalType === 'Executioner Sword')) ||
    (isCurvedBlade && (functionalType === 'Odachi' || functionalType === 'Dadao'));
  const isBlade = isCurvedBlade || isStraightBlade;
  const isMelee =
    isSpearOrPolearm ||
    isImpactOrAxe ||
    isBlade ||
    weapon?.equipmentRole === 'melee';
  const isMeleeOrShield =
    !isBow && (isMelee || isShield || Boolean(weapon?.moveset?.[0]?.noReload));
  const isCarrierOrMunition = category === 'Carriers & Munitions';
  const isQuiverOrBandolier =
    isCarrierOrMunition &&
    (functionalType === 'Quiver' ||
      functionalType === 'Bandolier' ||
      functionalType === 'Yebira' ||
      functionalType === 'Sheaf' ||
      functionalType === 'Plumbata' ||
      functionalType === 'Kaad' ||
      weapon?.equipmentRole === 'quiver');
  const isCatalystOrBattery =
    isCarrierOrMunition &&
    (functionalType === 'Battery' ||
      functionalType === 'Pangao' ||
      weapon?.equipmentRole === 'catalyst');
  const isExplosiveOrdnance =
    (isCarrierOrMunition && functionalType === 'Rack') ||
    (category === 'Casters' &&
      (functionalType === 'Blast Caster' ||
        functionalType === 'Meteoric Caster' ||
        functionalType === 'Nova Caster')) ||
    weapon?.primaryDamageType === 'Blast';
  const isRapidCaster =
    category === 'Casters' &&
    (functionalType === 'Bolt Caster' ||
      functionalType === 'Arc Caster' ||
      functionalType === 'Pulse Caster');
  const isBeamOrStellarCaster =
    category === 'Casters' &&
    (functionalType === 'Beam Caster' ||
      functionalType === 'Wave Caster' ||
      functionalType === 'Stellar Caster');
  const isHybridLanceOrStaff =
    isLanceOrPike ||
    (isMelee &&
      (weapon?.primaryDamageType === 'Beam' || weapon?.primaryDamageType === 'Wave'));
  const hasShieldBypassEdge = isHookBlade || isDaggerOrShortBlade;

  return {
    category,
    functionalType,
    weightClass,
    isShield,
    isTowerOrHeavyShield,
    isBucklerOrDiscShield,
    isBow,
    isSpearOrPolearm,
    isLanceOrPike,
    isImpactOrAxe,
    isAxe,
    isBluntOrStaff,
    isCurvedBlade,
    isHookBlade,
    isStraightBlade,
    isDaggerOrShortBlade,
    isGreatsword,
    isBlade,
    isMelee,
    isMeleeOrShield,
    isCarrierOrMunition,
    isQuiverOrBandolier,
    isCatalystOrBattery,
    isExplosiveOrdnance,
    isRapidCaster,
    isBeamOrStellarCaster,
    isHybridLanceOrStaff,
    hasShieldBypassEdge,
  };
}

export { resolveRangedBasicShotProfile, WEAPON_BCU_REFERENCE };
export type { RangedBasicShotProfile };

/**
 * Generates a weapon-unique, fluid, reload-free melee combo sequence (`2–5` steps)
 * anchored to the **Medium (`0.45s/strike`)** deliberate tempo baseline with a **Moderate `±30%` band**
 * (`Light = 0.35s/strike`, `Heavy = 0.59s/strike`).
 */
export function buildWeaponUniqueComboSequence(
  weaponId: string,
  category: WeaponCategory,
  functionalType: string,
  weightClass: WeaponWeightClass,
  baseRange: number
): MeleeComboStepSpec[] {
  const stepBaseSec = COMBAT_TEMPO_CONSTANTS.MELEE_COMBO_STEP_SEC[weightClass];
  return buildFunctionalTypeComboSequence(
    weaponId,
    category,
    functionalType,
    weightClass,
    baseRange,
    stepBaseSec,
    COMBAT_TEMPO_CONSTANTS.MELEE_COMBO_STEP_SEC.minFloor,
    COMBAT_TEMPO_CONSTANTS.MELEE_COMBO_STEP_SEC.maxCap
  );
}

/**
 * Resolves the appropriate multi-round salvo `ammoCount` and optional `internalCharges`
 * for any ranged skill (`Slots 1..4` / Actions 2–5).
 */
export function resolveSkillAmmoAndCharges(
  category: WeaponCategory,
  functionalType: string,
  slot: 1 | 2 | 3 | 4,
  skillName: string,
  skillDesc: string,
  isBlock?: boolean
): { ammoCount: number; internalCharges?: number; internalCycleSec?: number } {
  if (isBlock) return { ammoCount: 0 };
  const text = `${skillName} ${skillDesc} ${functionalType}`.toLowerCase();

  let ammoCount = slot === 4 ? 6 : slot === 2 ? 3 : slot === 1 ? 2 : 2;
  if (text.includes('nine') || text.includes('9-') || text.includes('rotary') || text.includes('melting point')) {
    ammoCount = 9;
  } else if (text.includes('seven') || text.includes('7-') || text.includes('storm') || text.includes('carpet')) {
    ammoCount = 7;
  } else if (
    text.includes('six') ||
    text.includes('6-') ||
    text.includes('swarm') ||
    text.includes('barrage') ||
    text.includes('avalanche') ||
    text.includes('saturation') ||
    text.includes('drum') ||
    text.includes('unload')
  ) {
    ammoCount = 6;
  } else if (text.includes('five') || text.includes('5-') || text.includes('volley') || text.includes('fan')) {
    ammoCount = 5;
  } else if (text.includes('four') || text.includes('4-') || text.includes('quad') || text.includes('salvo')) {
    ammoCount = 4;
  } else if (text.includes('three') || text.includes('3-') || text.includes('triple') || text.includes('burst')) {
    ammoCount = 3;
  } else if (text.includes('two') || text.includes('2-') || text.includes('double') || text.includes('twin')) {
    ammoCount = 2;
  } else if (
    text.includes('slug') ||
    text.includes('spike') ||
    text.includes('bodkin') ||
    text.includes('lance') ||
    text.includes('bore') ||
    text.includes('impale') ||
    text.includes('skewer') ||
    text.includes('snipe')
  ) {
    ammoCount = 1;
  }

  let internalCharges: number | undefined;
  let internalCycleSec: number | undefined;
  if (slot === 1 || (slot === 2 && ammoCount <= 2)) {
    internalCharges = category === 'Bows' ? 2 : ammoCount === 1 ? 3 : 2;
    internalCycleSec = category === 'Bows' ? 0.8 : 0.65;
  }

  return { ammoCount, internalCharges, internalCycleSec };
}

/**
 * Normalizes tactical skill damage, cooldowns, and heat costs (`Slots 1..4` / Actions 2–5)
 * against the canonical **Base Combat Unit (`1× BCU = 54`)** budget with weight-class and reach scaling.
 */
function normalizeSkillBcuParameters(
  slotIdx: 1 | 2 | 3 | 4,
  weightClass: WeaponWeightClass,
  rawSkill: ActionDefinition,
  normalizedBaseRange: number
): { damage: number; cooldownSec: number; heatCost: number; range: number } {
  const wScale = weightClass === 'heavy' ? 1.12 : weightClass === 'light' ? 0.92 : 1.0;

  if (slotIdx === 3 && rawSkill.isBlock) {
    const riposteDmg = Math.round(WEAPON_BCU_REFERENCE * 0.5 * wScale);
    return {
      damage: riposteDmg,
      cooldownSec: 0,
      heatCost: weightClass === 'heavy' ? 5 : 4,
      range: 24,
    };
  }

  // Canonical BCU budget per tactical skill slot:
  // Slot 1 (Action 2 — Quick Tactical, [Y] Tap): ~0.62× BCU (31 Light / 34 Medium / 38 Heavy)
  // Slot 2 (Action 3 — Heavy Lunge / Control / AoE, [R] Tap): ~0.81× BCU (40 Light / 44 Medium / 49 Heavy)
  // Slot 3 (Action 4 — Ranged Evasive Counter-Step, [Y] Hold): ~0.52× BCU (26 Light / 28 Medium / 31 Heavy)
  // Slot 4 (Action 5 — Signature Finisher, [R] Hold): ~1.06× BCU (52 Light / 57 Medium / 64 Heavy)
  const targetBcuMult =
    slotIdx === 1 ? 0.63 : slotIdx === 2 ? 0.81 : slotIdx === 3 ? 0.52 : 1.06;
  const bcuTargetDmg = Math.round(WEAPON_BCU_REFERENCE * targetBcuMult * wScale);
  // Blend authored skill damage with strict BCU target (75% strict BCU target + 25% authored nuance, clamped to ±10%)
  const blendedDmg = Math.round(bcuTargetDmg * 0.75 + rawSkill.damage * 0.25);
  const minDmg = Math.round(bcuTargetDmg * 0.9);
  const maxDmg = Math.round(bcuTargetDmg * 1.12);
  const damage = Math.max(minDmg, Math.min(maxDmg, blendedDmg));

  const cdBounds: Record<1 | 2 | 3 | 4, [number, number]> = {
    1: [4.2, 6.2],
    2: [7.2, 10.2],
    3: [5.2, 6.8],
    4: [11.8, 15.5],
  };
  const [cdMin, cdMax] = cdBounds[slotIdx];
  const scaledCd = Number((rawSkill.cooldownSec * 1.25).toFixed(2));
  const cooldownSec = Math.max(cdMin, Math.min(cdMax, scaledCd));

  const heatBounds: Record<1 | 2 | 3 | 4, [number, number]> = {
    1: [10, 15],
    2: [16, 22],
    3: [10, 13],
    4: [22, 28],
  };
  const [heatMin, heatMax] = heatBounds[slotIdx];
  const heatCost = Math.max(heatMin, Math.min(heatMax, Math.round(rawSkill.heatCost)));

  const rangeScale = slotIdx === 1 ? 1.12 : slotIdx === 2 ? 1.2 : slotIdx === 3 ? 0.9 : 1.28;
  const range = Math.max(20, Math.round(normalizedBaseRange * rangeScale));

  return { damage, cooldownSec, heatCost, range };
}

/**
 * Normalizes any `WeaponDefinition` to enforce the canonical combat overhaul, deliberate tempo rules,
 * and strict **Base Combat Unit (`1× BCU = 54`)** parity across all 101 weapons:
 * 1. `Bows`: Single-shot hold-to-charge weapons (`shotsPerChain = 1`, `isChargeable = true` on Slot 0, Medium draw = `1.15s` with `±30%` spread, Full Draw = `1.85×` base damage).
 * 2. `Melee & Shields`: Never reload (`noReload = true`, `reloadDurationSec = 0`), fluid functional-type combo sequence anchored to Medium (`0.45s/strike`) with `±30%` spread, full chain normalized to BCU budget.
 * 3. `Ranged Weapons`: 100% increase (`2×`) on Basic Attack (`Slot 0`) ammo (`shotsPerChain`), per-shot cadence decoupled from magazine size and anchored to Medium (`0.34s/shot` with `±30%` spread), reference salvo normalized to BCU budget, reload strictly on Slot 0 (`noReload = true` on Slots 1–4).
 */
export function normalizeWeaponCombatFunctions(weapon: WeaponDefinition): WeaponDefinition {
  if (
    weapon.moveset[0]?.isChargeable ||
    weapon.moveset[0]?.comboSequence ||
    weapon.moveset[1]?.noReload !== undefined
  ) {
    return weapon;
  }

  const arch = classifyWeaponCombatArchetype(weapon);
  const { category, functionalType, weightClass, isBow, isMeleeOrShield, isShield } = arch;
  const skillTellBase = COMBAT_TEMPO_CONSTANTS.SKILL_TELL_SEC[weightClass];
  const skillActionBase = COMBAT_TEMPO_CONSTANTS.SKILL_ACTION_SEC[weightClass];
  const baseRange = weapon.moveset[0]?.range || 28;

  // 1. BOWS: Single-shot charge-up weapon (Medium = 1.15s draw, 0.95s nock; Light = 0.88s / 0.73s; Heavy = 1.50s / 1.24s)
  //    Strict BCU calibration: Uncharged quick release = 34 (Light) / 37 (Medium) / 41 (Heavy),
  //    Full Draw (1.85×) = 63 (Light) / 68 (Medium) / 76 (Heavy)
  if (isBow) {
    const maxChargeSec = COMBAT_TEMPO_CONSTANTS.BOW_FULL_DRAW_SEC[weightClass];
    const singleShotBaseDmg =
      weightClass === 'light' ? 34 : weightClass === 'heavy' ? 41 : 37;
    const singleArrowNockSec = COMBAT_TEMPO_CONSTANTS.BOW_NOCK_RELOAD_SEC[weightClass];
    const bowRange = Math.max(
      weightClass === 'light' ? 98 : weightClass === 'heavy' ? 132 : 114,
      Math.min(148, baseRange)
    );

    const updatedMoveset: ActionDefinition[] = weapon.moveset.map((m, idx) => {
      if (idx === 0) {
        return {
          ...m,
          damage: singleShotBaseDmg,
          range: bowRange,
          heatCost: weightClass === 'heavy' ? 9 : weightClass === 'medium' ? 7 : 6,
          tellDurationSec: 0.06,
          actionDurationSec: 0.32,
          isChain: true,
          noReload: false,
          isChargeable: true,
          maxChargeSec,
          ammoCount: 1,
          reloadDurationSec: singleArrowNockSec,
          description: `${m.description} [Single-Shot Charge: Hold [X] up to ${maxChargeSec.toFixed(2)}s for 1.85× DMG & 1.45× Velocity at 1.65× Heat]`,
        };
      }
      const slotIdx = idx as 1 | 2 | 3 | 4;
      const { ammoCount, internalCharges, internalCycleSec } = resolveSkillAmmoAndCharges(
        category,
        functionalType,
        slotIdx,
        m.name,
        m.description,
        m.isBlock
      );
      const bcuSkill = normalizeSkillBcuParameters(slotIdx, weightClass, m, bowRange);
      return {
        ...m,
        damage: bcuSkill.damage,
        range: bcuSkill.range,
        heatCost: bcuSkill.heatCost,
        tellDurationSec: m.isBlock ? 0.04 : Number((skillTellBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
        actionDurationSec: m.isBlock ? 0.24 : Number((skillActionBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
        cooldownSec: bcuSkill.cooldownSec,
        isChain: false,
        noReload: true,
        reloadDurationSec: undefined,
        ammoCount,
        internalCharges,
        internalCycleSec,
      };
    });

    return {
      ...weapon,
      category,
      weaponClass: functionalType,
      shotsPerChain: 1,
      damagePerShot: singleShotBaseDmg,
      chainDurationSec: 0.38,
      reloadDurationSec: singleArrowNockSec,
      moveset: updatedMoveset,
    };
  }

  // 2. MELEE & SHIELDS: Fluid weapon-unique movesets, zero reload, internal combo reset window, strict BCU chain parity
  if (isMeleeOrShield) {
    const meleeRange = isShield
      ? Math.max(22, Math.min(26, baseRange))
      : category === 'Spears'
        ? Math.max(32, Math.min(44, baseRange))
        : Math.max(22, Math.min(36, baseRange));

    const comboSequence = buildWeaponUniqueComboSequence(
      weapon.id,
      category,
      functionalType,
      weightClass,
      meleeRange
    );
    const totalComboDuration = Number(
      comboSequence
        .reduce((acc, s) => acc + s.tellDurationSec + s.actionDurationSec, 0)
        .toFixed(2)
    );

    // Full combo chain BCU budget:
    // Shields: 45 (Light) / 48 (Medium) / 52 (Heavy)
    // Melee:   54 (Light, 1.00× BCU) / 58 (Medium, 1.07× BCU) / 64 (Heavy, 1.18× BCU)
    const targetChainBcu = isShield
      ? weightClass === 'light'
        ? 45
        : weightClass === 'heavy'
          ? 52
          : 48
      : weightClass === 'light'
        ? WEAPON_BCU_REFERENCE
        : weightClass === 'heavy'
          ? 64
          : 58;
    const perStepDamage = Math.max(
      10,
      Math.round(targetChainBcu / Math.max(1, comboSequence.length))
    );

    const updatedMoveset: ActionDefinition[] = weapon.moveset.map((m, idx) => {
      if (idx === 0) {
        return {
          ...m,
          damage: perStepDamage,
          range: meleeRange,
          heatCost: weightClass === 'heavy' ? 8 : weightClass === 'medium' ? 6 : 5,
          tellDurationSec: comboSequence[0].tellDurationSec,
          actionDurationSec: comboSequence[0].actionDurationSec,
          isChain: false,
          noReload: true,
          reloadDurationSec: undefined,
          comboSequence,
          comboResetWindowSec: 1.45,
          description: `${m.description} [${comboSequence.length}-Step Fluid Combo (${comboSequence.map((s) => s.label).join(' → ')}) · No Reload]`,
        };
      }
      const slotIdx = idx as 1 | 2 | 3 | 4;
      const bcuSkill = normalizeSkillBcuParameters(slotIdx, weightClass, m, meleeRange);
      return {
        ...m,
        damage: bcuSkill.damage,
        range: bcuSkill.range,
        heatCost: bcuSkill.heatCost,
        tellDurationSec: m.isBlock ? 0.04 : Number((skillTellBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
        actionDurationSec: m.isBlock ? 0.24 : Number((skillActionBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
        cooldownSec: bcuSkill.cooldownSec,
        isChain: false,
        noReload: true,
        reloadDurationSec: undefined,
      };
    });

    return {
      ...weapon,
      category,
      weaponClass: functionalType,
      shotsPerChain: comboSequence.length,
      damagePerShot: perStepDamage,
      chainDurationSec: totalComboDuration,
      reloadDurationSec: 0,
      moveset: updatedMoveset,
    };
  }

  // 3. RANGED WEAPONS (Casters, Carriers & Munitions):
  //    - 100% increase (2×) on Basic Attack (Slot 0) ammo
  //    - Reference salvo (pre-doubled `baseShots`) strictly calibrated to BCU budget (54 Light / 58 Medium / 64 Heavy)
  //    - Per-shot cadence anchored to Medium (0.34s/shot) with +/-30% spread (Light 0.26s, Heavy 0.44s)
  //    - Reload strictly on Basic Attack (Slot 0); Skills 1..4 have noReload = true + ammoCount / internalCharges
  const baseShots = Math.max(2, weapon.shotsPerChain);
  const doubledAmmo = baseShots * 2;
  const targetSalvoBcu =
    weightClass === 'light' ? WEAPON_BCU_REFERENCE : weightClass === 'heavy' ? 64 : 58;
  const normalizedShotDmg = Math.max(5, Math.round(targetSalvoBcu / baseShots));
  const rangedRange = Math.max(72, Math.min(142, baseRange));

  const perShotSec = COMBAT_TEMPO_CONSTANTS.RANGED_BASIC_SHOT_SEC[weightClass];
  const basicTellSec = Number((perShotSec * 0.34).toFixed(2));
  const basicActionSec = Number((perShotSec - basicTellSec).toFixed(2));
  const scaledChainDuration = Number((doubledAmmo * perShotSec).toFixed(2));
  const scaledReloadSec = Number(
    Math.max(2.1, Math.min(4.2, weapon.reloadDurationSec * 1.25)).toFixed(2)
  );

  const updatedMoveset: ActionDefinition[] = weapon.moveset.map((m, idx) => {
    if (idx === 0) {
      return {
        ...m,
        damage: normalizedShotDmg,
        range: rangedRange,
        heatCost: weightClass === 'heavy' ? 9 : weightClass === 'medium' ? 6 : 5,
        tellDurationSec: basicTellSec,
        actionDurationSec: basicActionSec,
        isChain: true,
        noReload: false,
        ammoCount: doubledAmmo,
        reloadDurationSec: scaledReloadSec,
      };
    }
    const slotIdx = idx as 1 | 2 | 3 | 4;
    const { ammoCount, internalCharges, internalCycleSec } = resolveSkillAmmoAndCharges(
      category,
      functionalType,
      slotIdx,
      m.name,
      m.description,
      m.isBlock
    );
    const bcuSkill = normalizeSkillBcuParameters(slotIdx, weightClass, m, rangedRange);
    return {
      ...m,
      damage: bcuSkill.damage,
      range: bcuSkill.range,
      heatCost: bcuSkill.heatCost,
      tellDurationSec: m.isBlock ? 0.04 : Number((skillTellBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
      actionDurationSec: m.isBlock ? 0.24 : Number((skillActionBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
      cooldownSec: bcuSkill.cooldownSec,
      isChain: false,
      noReload: true,
      reloadDurationSec: undefined,
      ammoCount,
      internalCharges,
      internalCycleSec,
    };
  });

  return {
    ...weapon,
    category,
    weaponClass: functionalType,
    shotsPerChain: doubledAmmo,
    damagePerShot: normalizedShotDmg,
    chainDurationSec: scaledChainDuration,
    reloadDurationSec: scaledReloadSec,
    moveset: updatedMoveset,
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
  isPlaceholderAsset?: boolean;
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
    isPlaceholderAsset: seed.isPlaceholderAsset ?? false,
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
          ? `${seed.actions[3].description} (0.34s Perfect Block window).`
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

