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

  return normalizeWeaponCombatFunctions(rawWeapon);
}

/**
 * Canonical Combat Tempo Constants anchored to a **Medium (`1.00×`)** baseline
 * with a **Moderate `±30%` spread** (`Light = +30%` faster rate / `0.77×` cycle duration;
 * `Heavy = -30%` slower rate / `1.30×` cycle duration) and **`[0.70×, 1.30×]`** stacked multiplier caps.
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
  /** Ranged Basic Attack (`Slot 0`) per-shot cycle time in seconds (Medium = `0.22s` / `~4.5 shots/s`) */
  RANGED_BASIC_SHOT_SEC: {
    light: 0.17, // ~5.8 shots/s
    medium: 0.22, // ~4.5 shots/s baseline
    heavy: 0.29, // ~3.4 shots/s
    minFloor: 0.14, // Strict floor (<= 7.1 shots/s max with all buffs)
    maxCap: 0.36,
  } as const,
  /** Melee Fluid Combo (`Slot 0`) per-strike cycle time in seconds (Medium = `0.30s` / `~3.3 strikes/s`) */
  MELEE_COMBO_STEP_SEC: {
    light: 0.23, // ~4.3 strikes/s
    medium: 0.3, // ~3.3 strikes/s baseline
    heavy: 0.39, // ~2.5 strikes/s
    minFloor: 0.18, // Strict floor (<= 5.5 strikes/s max with all buffs)
    maxCap: 0.48,
  } as const,
  /** Bow Single-Shot Hold-to-Charge (`Slot 0`) full draw duration in seconds (Medium = `0.85s`) */
  BOW_FULL_DRAW_SEC: {
    light: 0.65,
    medium: 0.85,
    heavy: 1.1,
    minFloor: 0.55,
    maxCap: 1.25,
  } as const,
  /** Bow Single-Shot nock/reload duration in seconds (Medium = `0.75s`) */
  BOW_NOCK_RELOAD_SEC: {
    light: 0.58,
    medium: 0.75,
    heavy: 0.98,
  } as const,
  /** Tactical Skill (`Slots 1–4`) tell & action duration baselines by weight class */
  SKILL_TELL_SEC: {
    light: 0.16,
    medium: 0.21,
    heavy: 0.27,
    minFloor: 0.11,
    maxCap: 0.38,
  } as const,
  SKILL_ACTION_SEC: {
    light: 0.25,
    medium: 0.32,
    heavy: 0.42,
    minFloor: 0.18,
    maxCap: 0.56,
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

/**
 * Generates a weapon-unique, fluid, reload-free melee combo sequence (`3–5` steps)
 * anchored to the **Medium (`0.30s/strike`)** tempo baseline with a **Moderate `±30%` band**
 * (`Light = 0.23s/strike`, `Heavy = 0.39s/strike`).
 */
export function buildWeaponUniqueComboSequence(
  weaponId: string,
  category: WeaponCategory,
  functionalType: string,
  weightClass: WeaponWeightClass,
  baseRange: number
): MeleeComboStepSpec[] {
  const r = Math.max(20, baseRange || 26);
  const stepBaseSec = COMBAT_TEMPO_CONSTANTS.MELEE_COMBO_STEP_SEC[weightClass];
  const makeTimings = (paceMult: number = 1.0) => {
    const total = Math.max(
      COMBAT_TEMPO_CONSTANTS.MELEE_COMBO_STEP_SEC.minFloor,
      Math.min(
        COMBAT_TEMPO_CONSTANTS.MELEE_COMBO_STEP_SEC.maxCap,
        stepBaseSec * paceMult
      )
    );
    const tellDurationSec = Number((total * 0.26).toFixed(2));
    const actionDurationSec = Number((total - tellDurationSec).toFixed(2));
    return { tellDurationSec, actionDurationSec };
  };

  const ft = functionalType.toLowerCase();
  const idLower = weaponId.toLowerCase();

  // 1. SHIELDS: 3-step Rim-Bash -> Counter-Sweep -> Fortress Slam
  if (category === 'Shields') {
    const isEnergyDisc = ft === 'corona' || ft === 'mote' || ft === 'disc' || ft === 'rhom';
    return [
      {
        stepIndex: 0,
        label: isEnergyDisc ? 'Phase Rim Pulse' : 'Leading Rim Check',
        style: 'bash',
        arcSpan: Math.PI * 0.58,
        radius: r,
        width: 14,
        damageMult: 0.92,
        ...makeTimings(0.95),
        flipDir: false,
        knockbackScale: 0.8,
      },
      {
        stepIndex: 1,
        label: isEnergyDisc ? 'Gyro Edge Sweep' : 'Backhand Boss Bash',
        style: isEnergyDisc ? 'slash' : 'bash',
        arcSpan: Math.PI * 0.72,
        radius: r + 2,
        width: 16,
        damageMult: 1.08,
        ...makeTimings(1.0),
        flipDir: true,
        knockbackScale: 1.0,
      },
      {
        stepIndex: 2,
        label: isEnergyDisc ? 'Aegis Nova Crush' : 'Bulwark Shock Slam',
        style: 'slam',
        arcSpan: Math.PI * 0.85,
        radius: r + 4,
        length: 14,
        width: 20,
        damageMult: 1.35,
        ...makeTimings(1.18),
        flipDir: false,
        extraArmorDent: 4,
        knockbackScale: 1.35,
      },
    ];
  }

  // 2. SPEARS: Thrust-centric & Polearm sweeping fluid combos
  if (category === 'Spears') {
    const isHeavyLanceOrPike =
      ft === 'lance' || ft === 'pike' || ft === 'boar spear' || idLower.includes('lance');
    const isPoleCleave =
      ft === 'partisan' || ft === 'spetum' || ft === 'broad spear' || ft === 'winged spear';
    if (isHeavyLanceOrPike) {
      return [
        {
          stepIndex: 0,
          label: 'Couched Point Probe',
          style: 'thrust',
          arcSpan: Math.PI * 0.22,
          radius: r,
          length: r + 4,
          width: 11,
          damageMult: 0.95,
          ...makeTimings(0.96),
        },
        {
          stepIndex: 1,
          label: 'Haft Clearing Sweep',
          style: 'slash',
          arcSpan: Math.PI * 0.65,
          radius: Math.round(r * 0.82),
          width: 14,
          damageMult: 1.05,
          ...makeTimings(1.02),
          flipDir: true,
        },
        {
          stepIndex: 2,
          label: 'Grand Breaching Drive',
          style: 'thrust',
          arcSpan: Math.PI * 0.28,
          radius: r + 8,
          length: r + 10,
          width: 14,
          damageMult: 1.42,
          ...makeTimings(1.18),
          extraArmorDent: 5,
          knockbackScale: 1.3,
        },
      ];
    }
    return [
      {
        stepIndex: 0,
        label: 'Snap Viper Thrust',
        style: 'thrust',
        arcSpan: Math.PI * 0.22,
        radius: r,
        length: r + 2,
        width: 10,
        damageMult: 0.9,
        ...makeTimings(0.92),
      },
      {
        stepIndex: 1,
        label: 'Double-Tap Shaft Poke',
        style: 'thrust',
        arcSpan: Math.PI * 0.25,
        radius: r + 3,
        length: r + 5,
        width: 11,
        damageMult: 1.02,
        ...makeTimings(0.96),
        flipDir: true,
      },
      {
        stepIndex: 2,
        label: isPoleCleave ? 'Winged Halberd Arc' : 'Whirling Butt-Sweep',
        style: 'slash',
        arcSpan: Math.PI * 0.78,
        radius: Math.round(r * 0.9),
        width: 14,
        damageMult: 1.15,
        ...makeTimings(1.04),
      },
      {
        stepIndex: 3,
        label: 'Heart-Seeker Skewer',
        style: 'thrust',
        arcSpan: Math.PI * 0.28,
        radius: r + 7,
        length: r + 9,
        width: 13,
        damageMult: 1.38,
        ...makeTimings(1.15),
        extraArmorDent: 3,
        knockbackScale: 1.2,
      },
    ];
  }

  // 3. IMPACT & AXES: Heavy blunt slams & bearded axe chops
  if (category === 'Impact & Axes') {
    const isAxe =
      ft === 'tomahawk' ||
      ft === 'parashu' ||
      ft === 'labrys' ||
      ft === 'battle axe' ||
      idLower.includes('axe');
    if (isAxe) {
      return [
        {
          stepIndex: 0,
          label: 'Bearded Forehand Hack',
          style: 'chop',
          arcSpan: Math.PI * 0.58,
          radius: r,
          width: 14,
          damageMult: 0.95,
          ...makeTimings(0.95),
          flipDir: false,
        },
        {
          stepIndex: 1,
          label: 'Rending Back-Hook',
          style: 'chop',
          arcSpan: Math.PI * 0.64,
          radius: r + 1,
          width: 15,
          damageMult: 1.1,
          ...makeTimings(1.0),
          flipDir: true,
          extraArmorDent: 2,
        },
        {
          stepIndex: 2,
          label: 'Spinning Cleaver Arc',
          style: 'whirlwind',
          arcSpan: Math.PI * 0.95,
          radius: r + 3,
          width: 16,
          damageMult: 1.22,
          ...makeTimings(1.06),
          flipDir: false,
        },
        {
          stepIndex: 3,
          label: 'Guillotine Timber-Drop',
          style: 'slam',
          arcSpan: Math.PI * 0.72,
          radius: r + 4,
          length: 16,
          width: 20,
          damageMult: 1.48,
          ...makeTimings(1.18),
          extraArmorDent: 5,
          knockbackScale: 1.35,
        },
      ];
    }
    // Maces, Hammers, Cudgels, Spikes, Mallets
    return [
      {
        stepIndex: 0,
        label: 'Flanged Rib-Cracker',
        style: 'chop',
        arcSpan: Math.PI * 0.56,
        radius: r,
        width: 15,
        damageMult: 0.96,
        ...makeTimings(0.98),
        flipDir: false,
        extraArmorDent: 2,
      },
      {
        stepIndex: 1,
        label: 'Rising Pommel Uppercut',
        style: 'chop',
        arcSpan: Math.PI * 0.62,
        radius: r + 1,
        width: 16,
        damageMult: 1.12,
        ...makeTimings(1.04),
        flipDir: true,
        extraArmorDent: 3,
      },
      {
        stepIndex: 2,
        label: 'Anvil-Breaker Overhead Slam',
        style: 'slam',
        arcSpan: Math.PI * 0.78,
        radius: r + 4,
        length: 16,
        width: 22,
        damageMult: 1.45,
        ...makeTimings(1.2),
        extraArmorDent: 6,
        knockbackScale: 1.4,
      },
    ];
  }

  // 4. BLADES: CURVED — Fluid 4-to-5 step draw-cuts, hooks, and whirling arcs
  if (category === 'Blades: Curved') {
    const isHookBlade = ft === 'khopesh' || ft === 'shotel' || ft === 'falx';
    const isFastCurved =
      ft === 'wakizashi' || ft === 'katana' || ft === 'kilij' || weightClass === 'light';
    const baseSteps: MeleeComboStepSpec[] = [
      {
        stepIndex: 0,
        label: isHookBlade ? 'Sickle Rim Draw' : 'Iai Quick-Draw Cut',
        style: 'slash',
        arcSpan: Math.PI * 0.66,
        radius: r,
        width: 12,
        damageMult: 0.88,
        ...makeTimings(0.92),
        flipDir: false,
      },
      {
        stepIndex: 1,
        label: isHookBlade ? 'Reverse Hook Wrench' : 'Ascending Swallow Slash',
        style: isHookBlade ? 'chop' : 'slash',
        arcSpan: Math.PI * 0.72,
        radius: r + 1,
        width: 13,
        damageMult: 1.0,
        ...makeTimings(0.96),
        flipDir: true,
      },
      {
        stepIndex: 2,
        label: 'Whirling Crescent Spin',
        style: 'whirlwind',
        arcSpan: Math.PI * 1.1,
        radius: r + 2,
        width: 14,
        damageMult: 1.14,
        ...makeTimings(1.04),
        flipDir: false,
      },
      {
        stepIndex: 3,
        label: isHookBlade ? 'Turbine Tendon Ripper' : 'Crimson Moon Finisher',
        style: isHookBlade ? 'chop' : 'slash',
        arcSpan: Math.PI * 0.92,
        radius: r + 4,
        width: 16,
        damageMult: 1.38,
        ...makeTimings(1.14),
        flipDir: true,
        extraArmorDent: 3,
        knockbackScale: 1.15,
      },
    ];
    if (isFastCurved) {
      baseSteps.splice(3, 0, {
        stepIndex: 3,
        label: 'Reverse-Grip Flurry',
        style: 'slash',
        arcSpan: Math.PI * 0.78,
        radius: r + 2,
        width: 13,
        damageMult: 1.18,
        ...makeTimings(0.95),
        flipDir: true,
      });
      baseSteps[4].stepIndex = 4;
    }
    return baseSteps;
  }

  // 5. BLADES: STRAIGHT (and default Melee) — Slash -> Cross-Cut -> Point Thrust -> Execution Cleave
  const isGreatsword =
    ft === 'zweihander' || ft === 'flamberge' || ft === 'executioner sword';
  const isDaggerOrShort =
    ft === 'cinquedea' || idLower.includes('whisper') || idLower.includes('phantom');
  if (isDaggerOrShort) {
    return [
      {
        stepIndex: 0,
        label: 'Viper Cross-Slice',
        style: 'slash',
        arcSpan: Math.PI * 0.55,
        radius: r,
        width: 10,
        damageMult: 0.85,
        ...makeTimings(0.9),
        flipDir: false,
      },
      {
        stepIndex: 1,
        label: 'Backhand Seam Cut',
        style: 'slash',
        arcSpan: Math.PI * 0.6,
        radius: r,
        width: 10,
        damageMult: 0.95,
        ...makeTimings(0.92),
        flipDir: true,
      },
      {
        stepIndex: 2,
        label: 'Stiletto Joint Puncture',
        style: 'thrust',
        arcSpan: Math.PI * 0.22,
        radius: r + 4,
        length: r + 6,
        width: 9,
        damageMult: 1.1,
        ...makeTimings(0.96),
      },
      {
        stepIndex: 3,
        label: 'Spinning Twin-Edge Lacerate',
        style: 'whirlwind',
        arcSpan: Math.PI * 1.0,
        radius: r + 2,
        width: 12,
        damageMult: 1.18,
        ...makeTimings(1.02),
        flipDir: true,
      },
      {
        stepIndex: 4,
        label: 'Mercy-Stroke Vital Thrust',
        style: 'thrust',
        arcSpan: Math.PI * 0.25,
        radius: r + 6,
        length: r + 8,
        width: 11,
        damageMult: 1.4,
        ...makeTimings(1.12),
        extraArmorDent: 3,
      },
    ];
  }

  return [
    {
      stepIndex: 0,
      label: isGreatsword ? 'Wide Montante Sweep' : 'Diagonal Ward Slash',
      style: 'slash',
      arcSpan: isGreatsword ? Math.PI * 0.85 : Math.PI * 0.68,
      radius: r,
      width: isGreatsword ? 16 : 13,
      damageMult: 0.92,
      ...makeTimings(0.95),
      flipDir: false,
    },
    {
      stepIndex: 1,
      label: isGreatsword ? 'Returning Zwerchhau' : 'Backhand Cross-Cut',
      style: 'slash',
      arcSpan: isGreatsword ? Math.PI * 0.9 : Math.PI * 0.72,
      radius: r + 1,
      width: isGreatsword ? 17 : 13,
      damageMult: 1.05,
      ...makeTimings(1.0),
      flipDir: true,
    },
    {
      stepIndex: 2,
      label: 'Half-Sword Estoc Thrust',
      style: 'thrust',
      arcSpan: Math.PI * 0.24,
      radius: r + 5,
      length: r + 7,
      width: 12,
      damageMult: 1.18,
      ...makeTimings(1.04),
      extraArmorDent: 2,
    },
    {
      stepIndex: 3,
      label: isGreatsword ? 'Executioner Wrath Cleave' : 'High-Guard Wrath Finisher',
      style: isGreatsword ? 'slam' : 'chop',
      arcSpan: Math.PI * 0.82,
      radius: r + 4,
      length: isGreatsword ? 16 : undefined,
      width: isGreatsword ? 20 : 16,
      damageMult: 1.42,
      ...makeTimings(1.18),
      flipDir: false,
      extraArmorDent: 4,
      knockbackScale: 1.25,
    },
  ];
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
    internalCycleSec = category === 'Bows' ? 0.55 : 0.45;
  }

  return { ammoCount, internalCharges, internalCycleSec };
}

/**
 * Normalizes any `WeaponDefinition` to enforce the canonical combat overhaul and tempo rules:
 * 1. `Bows`: Single-shot hold-to-charge weapons (`shotsPerChain = 1`, `isChargeable = true` on Slot 0, Medium draw = `0.85s` with `±30%` spread).
 * 2. `Melee & Shields`: Never reload (`noReload = true`, `reloadDurationSec = 0`), fluid weapon-unique combo sequence anchored to Medium (`0.30s/strike`) with `±30%` spread.
 * 3. `Ranged Weapons`: 100% increase (`2×`) on Basic Attack (`Slot 0`) ammo (`shotsPerChain`), per-shot cadence decoupled from magazine size and anchored to Medium (`0.22s/shot` with `±30%` spread), reload strictly on Slot 0 (`noReload = true` on Slots 1–4).
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
  const { category, functionalType, weightClass, isBow, isMeleeOrShield } = arch;
  const skillTellBase = COMBAT_TEMPO_CONSTANTS.SKILL_TELL_SEC[weightClass];
  const skillActionBase = COMBAT_TEMPO_CONSTANTS.SKILL_ACTION_SEC[weightClass];

  // 1. BOWS: Single-shot charge-up weapon (Medium = 0.85s draw, 0.75s nock; Light = 0.65s / 0.58s; Heavy = 1.10s / 0.98s)
  if (isBow) {
    const maxChargeSec = COMBAT_TEMPO_CONSTANTS.BOW_FULL_DRAW_SEC[weightClass];
    const singleShotBaseDmg = Math.max(
      18,
      Math.round(
        Math.max(
          weapon.damagePerShot * 2.1,
          weapon.damagePerShot * Math.min(4, weapon.shotsPerChain) * 0.55
        )
      )
    );
    const singleArrowNockSec = COMBAT_TEMPO_CONSTANTS.BOW_NOCK_RELOAD_SEC[weightClass];

    const updatedMoveset: ActionDefinition[] = weapon.moveset.map((m, idx) => {
      if (idx === 0) {
        return {
          ...m,
          damage: singleShotBaseDmg,
          tellDurationSec: 0.05,
          actionDurationSec: 0.22,
          isChain: true,
          noReload: false,
          isChargeable: true,
          maxChargeSec,
          ammoCount: 1,
          reloadDurationSec: singleArrowNockSec,
          description: `${m.description} [Single-Shot Charge: Hold [X] up to ${maxChargeSec.toFixed(2)}s for 1.85× DMG & 1.45× Velocity at 1.65× Heat]`,
        };
      }
      const { ammoCount, internalCharges, internalCycleSec } = resolveSkillAmmoAndCharges(
        category,
        functionalType,
        idx as 1 | 2 | 3 | 4,
        m.name,
        m.description,
        m.isBlock
      );
      return {
        ...m,
        tellDurationSec: m.isBlock ? 0.04 : Number((skillTellBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
        actionDurationSec: m.isBlock ? 0.2 : Number((skillActionBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
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
      chainDurationSec: 0.27,
      reloadDurationSec: singleArrowNockSec,
      moveset: updatedMoveset,
    };
  }

  // 2. MELEE & SHIELDS: Fluid weapon-unique movesets, zero reload, internal combo reset window
  if (isMeleeOrShield) {
    const comboSequence = buildWeaponUniqueComboSequence(
      weapon.id,
      category,
      functionalType,
      weightClass,
      weapon.moveset[0]?.range || 26
    );
    const totalComboDuration = Number(
      comboSequence
        .reduce((acc, s) => acc + s.tellDurationSec + s.actionDurationSec, 0)
        .toFixed(2)
    );

    const updatedMoveset: ActionDefinition[] = weapon.moveset.map((m, idx) => {
      if (idx === 0) {
        return {
          ...m,
          tellDurationSec: comboSequence[0].tellDurationSec,
          actionDurationSec: comboSequence[0].actionDurationSec,
          isChain: false,
          noReload: true,
          reloadDurationSec: undefined,
          comboSequence,
          comboResetWindowSec: 1.1,
          description: `${m.description} [${comboSequence.length}-Step Fluid Combo (${comboSequence.map((s) => s.label).join(' → ')}) · No Reload]`,
        };
      }
      return {
        ...m,
        tellDurationSec: m.isBlock ? 0.04 : Number((skillTellBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
        actionDurationSec: m.isBlock ? 0.2 : Number((skillActionBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
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
      chainDurationSec: totalComboDuration,
      reloadDurationSec: 0,
      moveset: updatedMoveset,
    };
  }

  // 3. RANGED WEAPONS (Casters, Carriers & Munitions):
  //    - 100% increase (2×) on Basic Attack (Slot 0) ammo
  //    - Per-shot cadence anchored to Medium (0.22s/shot) with +/-30% spread (Light 0.17s, Heavy 0.29s), decoupled from magazine size!
  //    - Reload strictly on Basic Attack (Slot 0); Skills 1..4 have noReload = true + ammoCount / internalCharges
  const doubledAmmo = Math.max(2, weapon.shotsPerChain * 2);
  const perShotSec = COMBAT_TEMPO_CONSTANTS.RANGED_BASIC_SHOT_SEC[weightClass];
  const basicTellSec = Number((perShotSec * 0.27).toFixed(2));
  const basicActionSec = Number((perShotSec - basicTellSec).toFixed(2));
  const scaledChainDuration = Number((doubledAmmo * perShotSec).toFixed(2));

  const updatedMoveset: ActionDefinition[] = weapon.moveset.map((m, idx) => {
    if (idx === 0) {
      return {
        ...m,
        tellDurationSec: basicTellSec,
        actionDurationSec: basicActionSec,
        isChain: true,
        noReload: false,
        ammoCount: doubledAmmo,
        reloadDurationSec: weapon.reloadDurationSec,
      };
    }
    const { ammoCount, internalCharges, internalCycleSec } = resolveSkillAmmoAndCharges(
      category,
      functionalType,
      idx as 1 | 2 | 3 | 4,
      m.name,
      m.description,
      m.isBlock
    );
    return {
      ...m,
      tellDurationSec: m.isBlock ? 0.04 : Number((skillTellBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
      actionDurationSec: m.isBlock ? 0.2 : Number((skillActionBase * (idx === 4 ? 1.25 : 1.0)).toFixed(2)),
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
    chainDurationSec: scaledChainDuration,
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

