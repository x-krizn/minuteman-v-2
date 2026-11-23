/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// [ORION-ANCHOR: PROG-SPECIALIST-STANCES]
/**
 * Specialist Feats & Martial Stances Doctrine Module (`Project Orion — Feat System & Constellation Overhaul.md` §5).
 *
 * Implements the 22 Standalone Historical Martial Stances distributed across Tiers `I` (`3`), `II` (`13`), and `III` (`6`)
 * inside the 3 Macro-Umbrellas (`Fighter`, `Scholar`, `Rogue`) and 6 Discipline Sectors (`Warrior`, `Guardian`, `Wizard`, `Cleric`, `Marauder`, `Rogue`).
 */

import {
  ActionDefinition,
  ConstellationUmbrellaId,
  DamageFamily,
  DamageType,
  FeatSynergyCategory,
  FeatTier,
  FrameFeatDefinition,
  GemId,
  LoadBracket,
  OrionState,
  PilotSkillId,
  WeaponCategory,
  WeaponDefinition,
} from '../../types';
import { parseEquipmentInstanceId } from '../equipment/mod_naming';
import {
  getWeaponDefinition,
  isTwoHandWeapon,
  resolveWeaponFunctionalType,
} from '../equipment/weapons';

/**
 * Action override specification for a Specialist Stance slot (`action2`, `action4`, or `action5`).
 */
export interface SpecialistStanceActionOverride {
  name: string;
  shortLabel: string;
  description: string;
  damage: number;
  damageType: DamageType;
  damageFamily: DamageFamily;
  heatCost: number;
  cooldownSec: number;
  tellDurationSec: number;
  actionDurationSec: number;
  range: number;
  isBlock?: boolean;
  isChargeable?: boolean;
  maxChargeSec?: number;
  ammoCount?: number;
}

/**
 * Passive combat, armor-layer, inertia, and movement modifiers granted while a Specialist Stance is active.
 */
export interface SpecialistStancePassiveModifiers {
  /** Multiplicative stance damage bonus (`1.0` = neutral) */
  damageMult: number;
  /** Additional Armor Threshold (`THR`) bypass ratio (`0.0` to `0.55`) */
  armorThresholdBypassRatio: number;
  /** Flat extra Armor Durability (`DUR`) shred on hit */
  extraArmorDentOnHit: number;
  /** Fraction of damage that bypasses active Shields directly to Armor/Frame (`0.0` to `0.60`) */
  shieldBypassRatio: number;
  /** Bonus seconds added to the `0.34s` Perfect Block window */
  perfectBlockWindowBonusSec: number;
  /** Flat Inertia Stability (`S`) bonus while in stance */
  stabilityBonusFlat: number;
  /** Multiplier applied to forward momentum fraction (`μ`) for charge/anti-charge physics */
  chargeMuMultiplier: number;
  /** Minimum movement commitment speed floor (`0.0` to `1.0`) while attacking or winding up */
  attackMoveSpeedFloor: number;
  /** Minimum movement commitment speed floor (`0.0` to `1.0`) while holding Block/Guard */
  guardMoveSpeedFloor: number;
  /** Ranged reload duration multiplier (`1.0` = standard, `< 1.0` = faster reload) */
  reloadDurationMult: number;
  /** Flat reactor heat vented when triggering Action 5 */
  heatVentOnAction5: number;
}

/**
 * Complete definition of a Specialist Feat and its unlocked Specialist Stance (§5).
 */
export interface SpecialistStanceDefinition {
  /** Feat ID in `CANONICAL_FRAME_FEAT_CATALOG` (e.g. `'daisho_specialist'`) */
  featId: string;
  /** Display name of the Feat (e.g. `'Daisho Specialist'`) */
  featName: string;
  /** Unique Stance ID (e.g. `'stance_daisho'`) */
  stanceId: string;
  /** Display name of the unlocked Stance (e.g. `'Niten Ichi-Ryu Stance'`) */
  stanceName: string;
  /** Short HUD / Loadout tag (e.g. `'DAISHO [NITEN]'`) */
  shortTag: string;
  /** Macro-hemisphere umbrella (`'Fighter' | 'Scholar' | 'Rogue'`) */
  umbrella: ConstellationUmbrellaId;
  /** Primary Frame Class constellation sector (`Guardian`, `Warrior`, `Rogue`, `Marauder`, `Cleric`, `Wizard`) */
  skillId: PilotSkillId;
  /** Feat Tier ring (`'I'`, `'II'`, or `'III'`) */
  tier: FeatTier;
  /** Synergy filter category */
  synergyCategory: FeatSynergyCategory;
  /** Gemstone socket requirements */
  gemSockets: Array<{ gemId: GemId; count: number }>;
  /** Human-readable equipment & load requirement summary */
  requiredEquipmentLabel: string;
  /** Concise doctrine summary for Feat and Loadout inspectors */
  doctrineSummary: string;
  /** Allowed Main Hand (`slot1`) functional weapon types (empty = any matching `mainCategories`) */
  mainFunctionalTypes: string[];
  /** Optional allowed Main Hand (`slot1`) broad categories */
  mainCategories?: WeaponCategory[];
  /** Whether Main Hand must be wielded in 2H grip with no off-hand weapon required */
  requiresTwoHandMainOnly?: boolean;
  /** Whether Main Hand can be either 1H or 2H (with optional off-hand) */
  allowsSingleOrTwoHandMain?: boolean;
  /** Allowed Side Hand (`slot2`) or Aux Back (`slot3`) functional weapon types */
  offhandFunctionalTypes: string[];
  /** Optional allowed Side Hand / Aux Back broad categories */
  offhandCategories?: WeaponCategory[];
  /** Whether a qualifying Carrier in `slot3` (`Aux Back`) also satisfies the offhand pairing requirement */
  allowAuxSlot3Match?: boolean;
  /** Allowed Load Brackets (`'light'`, `'medium'`, `'heavy'`) */
  allowedLoadBrackets: LoadBracket[];
  /** Passive combat, armor, inertia, and glide modifiers while stance is active */
  passiveModifiers: SpecialistStancePassiveModifiers;
  /** Action 2 (`weapon_skill_1`) override */
  action2: SpecialistStanceActionOverride;
  /** Action 4 (`weapon_slot2_skill4` / `weapon_skill_3`) override */
  action4: SpecialistStanceActionOverride;
  /** Action 5 (`weapon_slot2_skill5` / `weapon_skill_4`) override */
  action5: SpecialistStanceActionOverride;
}

/**
 * Live evaluation result for the pilot's currently active Specialist Stance.
 */
export interface ActiveSpecialistStanceEvaluation {
  /** True when a socketed Specialist Feat's weapon pairing and load bracket conditions are met AND mode is `'auto'` */
  active: boolean;
  /** True when a socketed Specialist Feat's weapon pairing and load bracket conditions are met (even if toggled to `'base'`) */
  available: boolean;
  /** Current stance override mode (`'auto'` = Active Doctrine, `'base'` = Base Moveset) */
  mode: 'auto' | 'base';
  /** Matched Specialist Stance definition, if any socketed Specialist Feat is equipped */
  stance: SpecialistStanceDefinition | null;
  /** Human-readable status or lock reason */
  statusReason: string;
  /** Resolved passive modifiers (neutral `1.0` / `0` values when inactive) */
  passiveModifiers: SpecialistStancePassiveModifiers;
}

/**
 * Neutral passive modifiers returned when no Specialist Stance is active.
 */
export const NEUTRAL_SPECIALIST_PASSIVE_MODIFIERS: SpecialistStancePassiveModifiers = {
  damageMult: 1.0,
  armorThresholdBypassRatio: 0,
  extraArmorDentOnHit: 0,
  shieldBypassRatio: 0,
  perfectBlockWindowBonusSec: 0,
  stabilityBonusFlat: 0,
  chargeMuMultiplier: 1.0,
  attackMoveSpeedFloor: 0,
  guardMoveSpeedFloor: 0,
  reloadDurationMult: 1.0,
  heatVentOnAction5: 0,
};

/**
 * Canonical catalog of all 22 Standalone Specialist Martial Stances (`3` Tier I, `13` Tier II, `6` Tier III).
 */
export const SPECIALIST_STANCE_LIST: SpecialistStanceDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // TIER I SPECIALIST MARTIAL STANCES (3 STANDALONE DOCTRINES)
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Spear & Buckler Specialist (Tier I · Fighter / Warrior)
  {
    featId: 'spear_buckler_specialist',
    featName: 'Spear & Buckler Specialist',
    stanceId: 'stance_spear_buckler',
    stanceName: 'Darting Viper Stance',
    shortTag: 'VIPER [SPEAR]',
    umbrella: 'Fighter',
    skillId: 'Warrior',
    tier: 'I',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Short Spear/Winged Spear/Partisan/Spetum + Buckler/Disc/Mote · Light/Medium Load',
    doctrineSummary:
      'Unlocks Darting Viper footwork: widened sweet-spot tip corridor, +28% Armor Threshold bypass, and retreating deflection vaults.',
    mainFunctionalTypes: ['Short Spear', 'Winged Spear', 'Partisan', 'Spetum'],
    offhandFunctionalTypes: ['Buckler', 'Disc', 'Mote'],
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.14,
      armorThresholdBypassRatio: 0.28,
      extraArmorDentOnHit: 2,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0.07,
      stabilityBonusFlat: 8,
      chargeMuMultiplier: 1.12,
      attackMoveSpeedFloor: 0.62,
      guardMoveSpeedFloor: 0.92,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 6,
    },
    action2: {
      name: 'Flickering Wasp Double-Thrust',
      shortLabel: 'WASP THRUST',
      description:
        'Twin rapid one-handed spear extensions aimed at optics and neck actuators with +28% THR bypass.',
      damage: 36,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 8,
      cooldownSec: 2.9,
      tellDurationSec: 0.12,
      actionDurationSec: 0.24,
      range: 48,
    },
    action4: {
      name: 'Whirling Buckler Deflection',
      shortLabel: 'WHIRL PARRY',
      description:
        'Spins the light buckler along the spear shaft to glance off heavy blows while preserving full skirmish mobility.',
      damage: 16,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 5,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 24,
      isBlock: true,
    },
    action5: {
      name: 'Vaulting Back-Step Skewer',
      shortLabel: 'VAULT SKEWER',
      description:
        'Snaps a deep heart-piercing thrust and immediately vaults backward out of counter-attack reach.',
      damage: 48,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 12,
      cooldownSec: 4.8,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 50,
    },
  },

  // 2. Sword & Buckler Specialist (Tier I · Fighter / Warrior-Rogue)
  {
    featId: 'sword_buckler_specialist',
    featName: 'Sword & Buckler Specialist',
    stanceId: 'stance_sword_buckler',
    stanceName: 'I.33 Ward & Bind Stance',
    shortTag: 'I.33 BUCKLER',
    umbrella: 'Fighter',
    skillId: 'Warrior',
    tier: 'I',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'charoite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Arming Sword/Spatha/Messer/Falchion + Buckler/Disc/Mote · Light/Medium Load',
    doctrineSummary:
      'Unlocks I.33 Ward & Bind fencing: 100% glide speed while guarding and instant buckler rim-punch ripostes.',
    mainFunctionalTypes: [
      'Arming Sword',
      'Spatha',
      'Messer',
      'Bastard Sword',
      'Cinquedea',
      'Falchion',
    ],
    offhandFunctionalTypes: ['Buckler', 'Disc', 'Mote'],
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.12,
      armorThresholdBypassRatio: 0.22,
      extraArmorDentOnHit: 2,
      shieldBypassRatio: 0.1,
      perfectBlockWindowBonusSec: 0.08,
      stabilityBonusFlat: 10,
      chargeMuMultiplier: 1.1,
      attackMoveSpeedFloor: 0.58,
      guardMoveSpeedFloor: 1.0,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 6,
    },
    action2: {
      name: 'Under-Arm Thrust (Sub Brachio)',
      shortLabel: 'SUB BRACHIO',
      description:
        'Quick off-line lunge beneath the buckler ward that targets exposed joint seams.',
      damage: 34,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 8,
      cooldownSec: 3.0,
      tellDurationSec: 0.12,
      actionDurationSec: 0.25,
      range: 40,
    },
    action4: {
      name: 'Extended Cone Ward (Schutzen)',
      shortLabel: 'SCHUTZEN',
      description:
        'Projects sword and buckler forward as a mobile cone guard at 100% glide speed; deflects projectiles and widens Perfect Block.',
      damage: 18,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 5,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 24,
      isBlock: true,
    },
    action5: {
      name: 'Shield-Knock & False-Edge Riposte',
      shortLabel: 'BUCKLER RIP',
      description:
        'Punches the enemy guard open with the buckler boss and immediately slices the visor seam with a false-edge cut.',
      damage: 46,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 12,
      cooldownSec: 4.8,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 38,
    },
  },

  // 3. Boarder Specialist (Tier I · Rogue / Warrior-Rogue)
  {
    featId: 'pistol_cutlass_specialist',
    featName: 'Boarder Specialist',
    stanceId: 'stance_boarder',
    stanceName: 'Brace & Cutlass Stance',
    shortTag: 'BOARDER [CQC]',
    umbrella: 'Rogue',
    skillId: 'Rogue',
    tier: 'I',
    synergyCategory: 'Mobility & Stealth',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'spinel', count: 1 },
    ],
    requiredEquipmentLabel:
      'Falchion/Messer/Kilij/Dao/Khopesh/Wakizashi ↔ Bolt/Pulse/Blast/Arc Caster · Light/Medium Load',
    doctrineSummary:
      'Unlocks Brace & Cutlass boarding doctrine: point-blank off-hand caster snap-discharges chained seamlessly out of curved-blade hooks.',
    mainFunctionalTypes: [
      'Falchion',
      'Messer',
      'Kilij',
      'Dao',
      'Khopesh',
      'Wakizashi',
      'Spatha',
      'Arming Sword',
      'Bolt Caster',
      'Pulse Caster',
      'Blast Caster',
      'Arc Caster',
    ],
    offhandFunctionalTypes: [
      'Bolt Caster',
      'Pulse Caster',
      'Blast Caster',
      'Arc Caster',
      'Falchion',
      'Messer',
      'Kilij',
      'Dao',
      'Khopesh',
      'Wakizashi',
      'Cinquedea',
      'Bandolier',
    ],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.25,
      extraArmorDentOnHit: 4,
      shieldBypassRatio: 0.22,
      perfectBlockWindowBonusSec: 0.07,
      stabilityBonusFlat: 9,
      chargeMuMultiplier: 1.15,
      attackMoveSpeedFloor: 0.68,
      guardMoveSpeedFloor: 0.88,
      reloadDurationMult: 0.72,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Gunwale Hook & Point-Blank Snap',
      shortLabel: 'BRACE SNAP',
      description:
        'Hooks the target guard with the boarding blade while discharging a point-blank caster burst into their chest plate.',
      damage: 40,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 8,
      cooldownSec: 2.9,
      tellDurationSec: 0.11,
      actionDurationSec: 0.23,
      range: 64,
      ammoCount: 1,
    },
    action4: {
      name: 'Cutlass Hanger Guard',
      shortLabel: 'HANGER WARD',
      description:
        'Parries with the heavy knuckle-bow guard (+0.07s Perfect Block window) while keeping the sidearm leveled.',
      damage: 18,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 5,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 25,
      isBlock: true,
    },
    action5: {
      name: 'Broadside Boarding Finisher',
      shortLabel: 'BOARDING SALVO',
      description:
        'Slashes across the visor seam and fires a double-tap caster discharge that shreds +4 Armor Durability and vents 8 Heat.',
      damage: 52,
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      heatCost: 12,
      cooldownSec: 4.8,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 72,
      ammoCount: 2,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER II SPECIALIST MARTIAL STANCES (13 STANDALONE DOCTRINES)
  // ═══════════════════════════════════════════════════════════════════════════

  // 4. Limitanei Specialist (Tier II · Fighter / Warrior)
  {
    featId: 'limitanei_specialist',
    featName: 'Limitanei Specialist',
    stanceId: 'stance_limitanei',
    stanceName: 'Plumbata & Spatha Stance',
    shortTag: 'LIMITANEI [DART]',
    umbrella: 'Fighter',
    skillId: 'Warrior',
    tier: 'II',
    synergyCategory: 'Mobility & Stealth',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Spatha/Arming Sword/Falchion/Javelin + Plumbata/Bandolier/Sheaf (Side or Aux) · Light/Medium Load',
    doctrineSummary:
      'Unlocks Late-Roman Limitanei border-skirmish cadence: high-angle lead-weighted Plumbata dart volleys paired with closing Spatha slashes.',
    mainFunctionalTypes: ['Spatha', 'Arming Sword', 'Falchion', 'Javelin', 'Short Spear'],
    offhandFunctionalTypes: ['Plumbata', 'Bandolier', 'Sheaf', 'Buckler'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.25,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.25,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 10,
      chargeMuMultiplier: 1.15,
      attackMoveSpeedFloor: 0.72,
      guardMoveSpeedFloor: 0.85,
      reloadDurationMult: 0.75,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Mattiobarbuli Lead-Dart Cast',
      shortLabel: 'PLUMBATA CAST',
      description:
        'Lofts a lead-weighted plumbata dart over the enemy shield rim (25% Shield bypass) before advancing with the Spatha.',
      damage: 42,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 8,
      cooldownSec: 3.0,
      tellDurationSec: 0.12,
      actionDurationSec: 0.24,
      range: 110,
      ammoCount: 1,
    },
    action4: {
      name: 'Plumbata Weighted Dart Fan',
      shortLabel: 'PLUMBATA FAN',
      description:
        'Draws three weighted darts from the dorsal bandolier/carrier and looses a pinning arc while back-gliding.',
      damage: 34,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 7,
      cooldownSec: 3.6,
      tellDurationSec: 0.11,
      actionDurationSec: 0.22,
      range: 105,
      ammoCount: 3,
    },
    action5: {
      name: 'Fossatum Shield-Pin & Spatha Lunge',
      shortLabel: 'SHIELD-PIN',
      description:
        'Pins the target shield with a heavy dart and immediately closes distance for a full-momentum Spatha cleave.',
      damage: 54,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 13,
      cooldownSec: 5.0,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 95,
      ammoCount: 2,
    },
  },

  // 5. Yeoman Longbow Specialist (Tier II · Fighter / Warrior)
  {
    featId: 'longbow_specialist',
    featName: 'Yeoman Longbow Specialist',
    stanceId: 'stance_longbow',
    stanceName: 'Agincourt Stake-Line Stance',
    shortTag: 'YEOMAN [BOW]',
    umbrella: 'Fighter',
    skillId: 'Warrior',
    tier: 'II',
    synergyCategory: 'Ballistics & Ordnance',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Long/Great/Flat/Self/Compound Bow + Quiver/Sheaf/Bandolier/Yebira (Side or Aux) · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Agincourt Yeoman heavy warbow draw mastery: +35% Armor Threshold bypass on charged bodkin shots and braced stake-line volleys.',
    mainFunctionalTypes: [
      'Long Bow',
      'Great Bow',
      'Flat Bow',
      'Self Bow',
      'Compound Bow',
      'Composite Bow',
    ],
    offhandFunctionalTypes: ['Quiver', 'Sheaf', 'Bandolier', 'Yebira'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.35,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.2,
      perfectBlockWindowBonusSec: 0,
      stabilityBonusFlat: 12,
      chargeMuMultiplier: 1.0,
      attackMoveSpeedFloor: 0.72,
      guardMoveSpeedFloor: 0.75,
      reloadDurationMult: 0.7,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Yeoman Bodkin Draw',
      shortLabel: 'BODKIN SHOT',
      description:
        'High-tension warbow release tipped with a hardened bodkin point that punches through Hardened and Layered plating.',
      damage: 46,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.4,
      tellDurationSec: 0.15,
      actionDurationSec: 0.26,
      range: 145,
      ammoCount: 1,
    },
    action4: {
      name: 'Stake-Line Nock-Step Reposition',
      shortLabel: 'NOCK-STEP',
      description:
        'Draws a bodkin shaft directly from the dorsal sheaf/quiver while executing a braced back-step.',
      damage: 28,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 3.8,
      tellDurationSec: 0.1,
      actionDurationSec: 0.22,
      range: 120,
      ammoCount: 2,
    },
    action5: {
      name: 'Agincourt Piercing Sky-Volley',
      shortLabel: 'SKY VOLLEY',
      description:
        'Lofts a 3-shaft heavy warbow volley that rains down with +35% Armor Threshold bypass and vents 10 Heat.',
      damage: 62,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.8,
      tellDurationSec: 0.18,
      actionDurationSec: 0.3,
      range: 155,
      ammoCount: 3,
    },
  },

  // 6. Repeating Arbalest Specialist (Tier II · Fighter / Warrior)
  {
    featId: 'repeating_arbalest_specialist',
    featName: 'Repeating Arbalest Specialist',
    stanceId: 'stance_repeating_arbalest',
    stanceName: 'Chu-Ko-Nu Volley Stance',
    shortTag: 'CHU-KO-NU [VOLLEY]',
    umbrella: 'Fighter',
    skillId: 'Warrior',
    tier: 'II',
    synergyCategory: 'Ballistics & Ordnance',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'carnelian', count: 1 },
    ],
    requiredEquipmentLabel:
      'Bolt/Pulse/Blast Caster or Crossbow + Bandolier/Quiver/Rack/Battery (Side or Aux) · Light/Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Chu-Ko-Nu magazine-fed repeating bolt doctrine: -35% reload duration, continuous lever-cycled bolt bursts, and pinning suppression salvos.',
    mainFunctionalTypes: ['Bolt Caster', 'Pulse Caster', 'Blast Caster', 'Crossbow', 'Arbalest'],
    mainCategories: ['Casters'],
    offhandFunctionalTypes: ['Bandolier', 'Quiver', 'Rack', 'Battery', 'Plumbata'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.22,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0,
      stabilityBonusFlat: 12,
      chargeMuMultiplier: 1.05,
      attackMoveSpeedFloor: 0.65,
      guardMoveSpeedFloor: 0.75,
      reloadDurationMult: 0.65,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Lever-Cycled Triple Bolt',
      shortLabel: 'TRIPLE BOLT',
      description:
        'Cycles the top-mounted gravity hopper to loose three heavy steel-tipped bolts in rapid succession.',
      damage: 42,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.1,
      tellDurationSec: 0.12,
      actionDurationSec: 0.24,
      range: 130,
      ammoCount: 3,
    },
    action4: {
      name: 'Hopper Magazine Speed-Feed',
      shortLabel: 'HOPPER FEED',
      description:
        'Slams a fresh bolt magazine from the dorsal bandolier/rack while firing a suppressing snap-shot.',
      damage: 30,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 3.6,
      tellDurationSec: 0.1,
      actionDurationSec: 0.2,
      range: 120,
      ammoCount: 2,
    },
    action5: {
      name: 'Zhuge Saturation Bolt-Wall',
      shortLabel: 'BOLT-WALL',
      description:
        'Empties the repeating hopper in a sweeping horizontal fan that shreds +5 Armor Durability and vents 10 Heat.',
      damage: 58,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 13,
      cooldownSec: 5.4,
      tellDurationSec: 0.15,
      actionDurationSec: 0.28,
      range: 135,
      ammoCount: 4,
    },
  },

  // 7. Daisho Specialist (Tier II · Rogue / Warrior-Rogue)
  {
    featId: 'daisho_specialist',
    featName: 'Daisho Specialist',
    stanceId: 'stance_daisho',
    stanceName: 'Niten Ichi-Ryu Stance',
    shortTag: 'DAISHO [NITEN]',
    umbrella: 'Rogue',
    skillId: 'Rogue',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'spinel', count: 1 },
    ],
    requiredEquipmentLabel:
      'Katana/Odachi/Dao/Kilij (Main) + Wakizashi/Cinquedea/Katana (Side) · Light/Medium Load',
    doctrineSummary:
      'Unlocks Niten Ichi-Ryu two-heaven cross-bind parry, +0.08s Perfect Block window, and simultaneous long/short blade draw-slash.',
    mainFunctionalTypes: ['Katana', 'Odachi', 'Dao', 'Kilij'],
    offhandFunctionalTypes: ['Wakizashi', 'Cinquedea', 'Katana'],
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.22,
      extraArmorDentOnHit: 3,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0.08,
      stabilityBonusFlat: 10,
      chargeMuMultiplier: 1.1,
      attackMoveSpeedFloor: 0.54,
      guardMoveSpeedFloor: 0.75,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Two-Heavens Flowing Cut',
      shortLabel: 'FLOWING CUT',
      description:
        'Alternating long-blade / short-blade diagonal rush that steps inside the enemy guard.',
      damage: 38,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 10,
      cooldownSec: 3.4,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 42,
    },
    action4: {
      name: 'Cross-Bind Parry (Juji-Dome)',
      shortLabel: 'JUJI-DOME',
      description:
        'Locks both blades in a scissored X-guard (+0.08s Perfect Block window); parrying vents 14 Heat and staggers the attacker.',
      damage: 20,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Swallow-Tail Draw (Iai-Giri)',
      shortLabel: 'IAI-GIRI',
      description:
        'Wakizashi pins the target guard while the main blade executes a high-velocity draw-slash that bypasses 35% of Armor Threshold.',
      damage: 54,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.5,
      tellDurationSec: 0.16,
      actionDurationSec: 0.32,
      range: 46,
    },
  },

  // 8. Rapier & Dagger Specialist (Tier II · Rogue / Warrior-Rogue)
  {
    featId: 'rapier_dagger_specialist',
    featName: 'Rapier & Dagger Specialist',
    stanceId: 'stance_rapier_dagger',
    stanceName: 'Destreza & Main-Gauche Stance',
    shortTag: 'DESTREZA [DUEL]',
    umbrella: 'Rogue',
    skillId: 'Rogue',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    requiredEquipmentLabel: 'Spatha/Arming Sword/Messer + Cinquedea/Wakizashi · Light/Medium Load',
    doctrineSummary:
      'Unlocks La Verdadera Destreza geometric dueling: main-gauche parrying-dagger binds (+0.09s Perfect Block window) and +32% Armor Threshold seam thrusts.',
    mainFunctionalTypes: ['Spatha', 'Arming Sword', 'Messer', 'Cinquedea'],
    offhandFunctionalTypes: ['Cinquedea', 'Wakizashi'],
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.32,
      extraArmorDentOnHit: 3,
      shieldBypassRatio: 0.18,
      perfectBlockWindowBonusSec: 0.09,
      stabilityBonusFlat: 9,
      chargeMuMultiplier: 1.12,
      attackMoveSpeedFloor: 0.65,
      guardMoveSpeedFloor: 0.92,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Atajo Tangential Seam-Lunge',
      shortLabel: 'ATAJO LUNGE',
      description:
        'Places dominating blade pressure along the centerline while driving the point through the target neck seam (+32% THR bypass).',
      damage: 38,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 8,
      cooldownSec: 3.0,
      tellDurationSec: 0.12,
      actionDurationSec: 0.24,
      range: 44,
    },
    action4: {
      name: 'Main-Gauche Sail-Guard Bind',
      shortLabel: 'MAIN-GAUCHE',
      description:
        'Catches and locks the incoming strike in the off-hand dagger quillions (+0.09s Perfect Block window).',
      damage: 18,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 5,
      cooldownSec: 0,
      tellDurationSec: 0.05,
      actionDurationSec: 0.34,
      range: 24,
      isBlock: true,
    },
    action5: {
      name: 'Conclusión Disarm & Heart-Thrust',
      shortLabel: 'CONCLUSIÓN',
      description:
        'Wrenches the enemy weapon aside with the Cinquedea and delivers a guaranteed precision heart-thrust.',
      damage: 54,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 13,
      cooldownSec: 5.0,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 44,
    },
  },

  // 9. Mounted Archer Specialist (Tier II · Rogue / Warrior-Rogue)
  {
    featId: 'mounted_archer_specialist',
    featName: 'Mounted Archer Specialist',
    stanceId: 'stance_mounted_archer',
    stanceName: 'Parthian Cantabrian Stance',
    shortTag: 'PARTHIAN [BOW]',
    umbrella: 'Rogue',
    skillId: 'Rogue',
    tier: 'II',
    synergyCategory: 'Ballistics & Ordnance',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Recurve/Reflex/Composite/Short/Compound Bow + Quiver/Yebira/Sheaf (Side or Aux) · Light/Medium Load',
    doctrineSummary:
      'Unlocks steppe thumb-draw rapid nocking on the glide: -40% reload duration, 85% movement speed floor while drawing, and Parthian retreat volleys.',
    mainFunctionalTypes: [
      'Recurve Bow',
      'Reflex Bow',
      'Composite Bow',
      'Short Bow',
      'Compound Bow',
      'Long Bow',
    ],
    mainCategories: ['Bows'],
    offhandFunctionalTypes: ['Quiver', 'Yebira', 'Sheaf'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.22,
      extraArmorDentOnHit: 3,
      shieldBypassRatio: 0.18,
      perfectBlockWindowBonusSec: 0,
      stabilityBonusFlat: 8,
      chargeMuMultiplier: 1.08,
      attackMoveSpeedFloor: 0.85,
      guardMoveSpeedFloor: 0.85,
      reloadDurationMult: 0.6,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Thumb-Ring Triple Snap',
      shortLabel: 'TRIPLE SNAP',
      description:
        'Holds three shafts in the bow hand to loose a rapid 3-arrow fan while gliding at full skirmish speed.',
      damage: 38,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 8,
      cooldownSec: 2.8,
      tellDurationSec: 0.11,
      actionDurationSec: 0.22,
      range: 125,
      ammoCount: 3,
    },
    action4: {
      name: 'Kassaki Speed-Feed Reset',
      shortLabel: 'SPEED-FEED',
      description:
        'Snaps a fresh bundle of shafts from the dorsal Yebira/Quiver, immediately refilling bow readiness and firing a pinning dart.',
      damage: 26,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 5,
      cooldownSec: 3.4,
      tellDurationSec: 0.1,
      actionDurationSec: 0.2,
      range: 115,
      ammoCount: 2,
    },
    action5: {
      name: 'Parthian Cantabrian Barrage',
      shortLabel: 'PARTHIAN FAN',
      description:
        'Glides laterally while unleashing a 5-arrow suppressing arc that shreds exposed shields and vents 8 Heat.',
      damage: 52,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 12,
      cooldownSec: 5.0,
      tellDurationSec: 0.14,
      actionDurationSec: 0.26,
      range: 130,
      ammoCount: 4,
    },
  },

  // 10. Legionary Specialist (Tier II · Fighter / Warrior-Guardian)
  {
    featId: 'legionary_specialist',
    featName: 'Legionary Specialist',
    stanceId: 'stance_legionary',
    stanceName: 'Pilum & Scutum Stance',
    shortTag: 'LEGIONARY [SCUTUM]',
    umbrella: 'Fighter',
    skillId: 'Guardian',
    tier: 'II',
    synergyCategory: 'Frame Plating & Defense',
    gemSockets: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    requiredEquipmentLabel:
      'Spatha/Cinquedea/Arming Sword + Scutum/Tower/Norman/Heater · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Roman Legionary line-anchoring: +20 Stability behind the Scutum wall, shield-boss punch staggers, and low-line gladius thrusts.',
    mainFunctionalTypes: ['Spatha', 'Cinquedea', 'Arming Sword', 'Bastard Sword', 'Falchion'],
    offhandFunctionalTypes: ['Scutum', 'Tower', 'Norman', 'Heater', 'Corona', 'Rhom'],
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.14,
      armorThresholdBypassRatio: 0.2,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.1,
      perfectBlockWindowBonusSec: 0.07,
      stabilityBonusFlat: 20,
      chargeMuMultiplier: 1.2,
      attackMoveSpeedFloor: 0.46,
      guardMoveSpeedFloor: 0.74,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Shield-Rim Press & Low Thrust',
      shortLabel: 'RIM THRUST',
      description:
        'Steps forward behind the Scutum boss to crowd the target, delivering a short-arc abdominal thrust.',
      damage: 38,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.3,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 38,
    },
    action4: {
      name: 'Braced Testudo Guard',
      shortLabel: 'TESTUDO GUARD',
      description:
        'Locks the Scutum wall against frontal kinetic and blast impacts (+20 Stability, -40% guard knockback slide).',
      damage: 20,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.07,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Umbo Boss-Slam & Gladius Finisher',
      shortLabel: 'UMBO FINISHER',
      description:
        'Full-commitment shield-boss slam that staggers the target, followed by a driving armor-seam thrust.',
      damage: 52,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 13,
      cooldownSec: 5.2,
      tellDurationSec: 0.16,
      actionDurationSec: 0.32,
      range: 38,
    },
  },

  // 11. Spear & Shield Specialist (Tier II · Fighter / Warrior-Guardian)
  {
    featId: 'spear_shield_specialist',
    featName: 'Spear & Shield Specialist',
    stanceId: 'stance_spear_shield',
    stanceName: 'Hoplite Othismos Stance',
    shortTag: 'HOPLITE [ASPIS]',
    umbrella: 'Fighter',
    skillId: 'Guardian',
    tier: 'II',
    synergyCategory: 'Frame Plating & Defense',
    gemSockets: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    requiredEquipmentLabel:
      'Short/Winged/Broad/Boar Spear/Partisan + Heater/Norman/Scutum/Tower/Corona/Rhom · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Hoplite Othismos shield-wall discipline: thrust over the shield rim while maintaining guard and sauroter butt-spike sweeps.',
    mainFunctionalTypes: [
      'Short Spear',
      'Winged Spear',
      'Broad Spear',
      'Partisan',
      'Boar Spear',
    ],
    offhandFunctionalTypes: ['Heater', 'Norman', 'Scutum', 'Tower', 'Corona', 'Rhom'],
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.14,
      armorThresholdBypassRatio: 0.22,
      extraArmorDentOnHit: 4,
      shieldBypassRatio: 0.1,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 20,
      chargeMuMultiplier: 1.22,
      attackMoveSpeedFloor: 0.5,
      guardMoveSpeedFloor: 0.78,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 6,
    },
    action2: {
      name: 'Over-Rim Viper Thrust',
      shortLabel: 'OVER-RIM POKE',
      description:
        'High-line spear thrust over the top notch of the raised shield without dropping frontal guard.',
      damage: 38,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.2,
      tellDurationSec: 0.14,
      actionDurationSec: 0.27,
      range: 48,
    },
    action4: {
      name: 'Aspis Interlock Guard',
      shortLabel: 'ASPIS WALL',
      description:
        'Raises the shield at 78% glide speed with +20 Stability, absorbing frontal charges and countering with a spear prod.',
      damage: 20,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.07,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Othismos Shove & Sauroter Spike',
      shortLabel: 'SAUROTER SPIKE',
      description:
        'Heaves the shield mass into the target to force a stagger, then reverses the spear to drive the bronze butt-spike through their plating.',
      damage: 52,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.4,
      tellDurationSec: 0.16,
      actionDurationSec: 0.32,
      range: 42,
    },
  },

  // 12. Knightly Bastard Specialist (Tier II · Fighter / Warrior-Guardian)
  {
    featId: 'knightly_bastard_specialist',
    featName: 'Knightly Bastard Specialist',
    stanceId: 'stance_knightly_bastard',
    stanceName: 'Fiore Posta di Donna Stance',
    shortTag: 'CHIVALRIC [FIORE]',
    umbrella: 'Fighter',
    skillId: 'Guardian',
    tier: 'II',
    synergyCategory: 'Frame Plating & Defense',
    gemSockets: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'spinel', count: 1 },
    ],
    requiredEquipmentLabel:
      'Bastard/Arming Sword/Spatha + Heater/Norman/Corona/Rhom · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Fiore dei Liberi Armizare knightly sword-and-heater mastery: half-sword plate thrusts, crossguard Mordhau strikes, and +18 Stability.',
    mainFunctionalTypes: ['Bastard Sword', 'Arming Sword', 'Spatha'],
    allowsSingleOrTwoHandMain: true,
    offhandFunctionalTypes: ['Heater', 'Norman', 'Corona', 'Rhom', 'Tower', 'Scutum'],
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.16,
      armorThresholdBypassRatio: 0.26,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.12,
      perfectBlockWindowBonusSec: 0.08,
      stabilityBonusFlat: 18,
      chargeMuMultiplier: 1.2,
      attackMoveSpeedFloor: 0.5,
      guardMoveSpeedFloor: 0.76,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Punta Falsa Half-Sword Thrust',
      shortLabel: 'PUNTA FALSA',
      description:
        'Braces the bastard blade against the heater shield notch to drive a rigid armor-piercing thrust (+26% THR bypass).',
      damage: 42,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.3,
      tellDurationSec: 0.14,
      actionDurationSec: 0.27,
      range: 42,
    },
    action4: {
      name: 'Posta Frontale Heater Ward',
      shortLabel: 'FRONTALE WARD',
      description:
        'Angles the heater shield and crossguard in an overlapping chivalric ward (+0.08s Perfect Block window, +18 Stability).',
      damage: 20,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Colpo di Villano & Pommel Crush',
      shortLabel: 'MORDHAU CRUSH',
      description:
        'Catches the attacker on the heater rim and follows through with a devastating crossguard/pommel strike that vents 8 Heat.',
      damage: 56,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.3,
      tellDurationSec: 0.16,
      actionDurationSec: 0.31,
      range: 40,
    },
  },

  // 13. Shield-Breaker Specialist (Tier II · Rogue / Warrior-Marauder)
  {
    featId: 'shield_breaker_specialist',
    featName: 'Shield-Breaker Specialist',
    stanceId: 'stance_shield_breaker',
    stanceName: 'Thracian Rhomphaia Stance',
    shortTag: 'RHOMPHAIA [HOOK]',
    umbrella: 'Rogue',
    skillId: 'Marauder',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'spinel', count: 1 },
    ],
    requiredEquipmentLabel:
      'Shotel/Falx/Khopesh (+ optional Shield, Blade, or Carrier) · Light/Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Thracian/Dacian/Abyssinian forward-curved sickle-blade mastery: 50% of damage bypasses active Shields over the rim and +35% THR bypass.',
    mainFunctionalTypes: ['Shotel', 'Falx', 'Khopesh'],
    allowsSingleOrTwoHandMain: true,
    offhandFunctionalTypes: [
      'Buckler',
      'Disc',
      'Mote',
      'Heater',
      'Norman',
      'Tower',
      'Scutum',
      'Corona',
      'Rhom',
      'Shotel',
      'Khopesh',
      'Wakizashi',
      'Bandolier',
      'Sheaf',
    ],
    offhandCategories: ['Shields', 'Blades: Curved', 'Carriers & Munitions'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.35,
      extraArmorDentOnHit: 7,
      shieldBypassRatio: 0.5,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 12,
      chargeMuMultiplier: 1.25,
      attackMoveSpeedFloor: 0.54,
      guardMoveSpeedFloor: 0.75,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Over-Wall Sickle Reach',
      shortLabel: 'SICKLE REACH',
      description:
        'Hooks the forward-curved blade completely around the target shield wall (50% Shield bypass) to tear into dorsal plating.',
      damage: 44,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 10,
      cooldownSec: 3.3,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 42,
    },
    action4: {
      name: 'Rhomphaia Concave Hook-Parry',
      shortLabel: 'HOOK PARRY',
      description:
        'Catches and wrenches the attacker weapon downward with the inner concave sickle edge.',
      damage: 20,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.07,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Sarmizegetusa Shield-Reaper Rip',
      shortLabel: 'SHIELD-REAPER',
      description:
        'Embeds the sickle beak behind the enemy collar plate and wrenches backward, bypassing 50% Shield and shredding +7 Armor Durability.',
      damage: 62,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 15,
      cooldownSec: 5.5,
      tellDurationSec: 0.17,
      actionDurationSec: 0.32,
      range: 42,
    },
  },

  // 14. Viking Raider Specialist (Tier II · Rogue / Warrior-Marauder)
  {
    featId: 'viking_raider_specialist',
    featName: 'Viking Raider Specialist',
    stanceId: 'stance_viking_raider',
    stanceName: 'Huscarl Skjaldborg Stance',
    shortTag: 'HUSCARL [AXE]',
    umbrella: 'Rogue',
    skillId: 'Marauder',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Battle Axe/Tomahawk/Parashu/Labrys + Norman/Heater/Buckler/Sheaf/Kaad · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Huscarl Skjaldborg bearded-axe hooking: wrenches enemy shields down to expose the frame (+8 Armor Durability shred) and anchors the brawl line.',
    mainFunctionalTypes: ['Battle Axe', 'Tomahawk', 'Parashu', 'Labrys'],
    allowsSingleOrTwoHandMain: true,
    offhandFunctionalTypes: [
      'Norman',
      'Heater',
      'Buckler',
      'Scutum',
      'Tower',
      'Sheaf',
      'Kaad',
      'Bandolier',
    ],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.16,
      armorThresholdBypassRatio: 0.22,
      extraArmorDentOnHit: 8,
      shieldBypassRatio: 0.3,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 16,
      chargeMuMultiplier: 1.22,
      attackMoveSpeedFloor: 0.48,
      guardMoveSpeedFloor: 0.72,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Bearded Rim-Wrench Hook',
      shortLabel: 'RIM-WRENCH',
      description:
        'Hooks the bearded lower horn over the target shield rim, wrenching their guard open and stripping shield capacity.',
      damage: 42,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 10,
      cooldownSec: 3.4,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 38,
    },
    action4: {
      name: 'Skjaldborg Iron-Boss Brace',
      shortLabel: 'SKJALDBORG',
      description:
        'Braces the round/kite shield boss forward (+16 Stability), absorbing heavy chops and setting up a counter-hook.',
      damage: 22,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.07,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Varangian Skull-Splitter Cleave',
      shortLabel: 'VARANGIAN CLEAVE',
      description:
        'Bashes with the shield rim to stagger, then drops a full-weight axe chop that shreds +8 Armor Durability.',
      damage: 58,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.4,
      tellDurationSec: 0.17,
      actionDurationSec: 0.32,
      range: 40,
    },
  },

  // 15. Spellblade Specialist (Tier II · Scholar / Warrior-Wizard)
  {
    featId: 'battlemage_specialist',
    featName: 'Spellblade Specialist',
    stanceId: 'stance_spellblade',
    stanceName: 'Aether-Conduit Edge Stance',
    shortTag: 'SPELLBLADE [ARC]',
    umbrella: 'Scholar',
    skillId: 'Wizard',
    tier: 'II',
    synergyCategory: 'Reactor & Thermal',
    gemSockets: [
      { gemId: 'kyanite', count: 1 },
      { gemId: 'spinel', count: 1 },
    ],
    requiredEquipmentLabel:
      'Arming/Bastard Sword/Spatha/Katana/Khopesh ↔ Beam/Arc/Wave/Pulse/Nova Caster · Light/Medium Load',
    doctrineSummary:
      'Unlocks Aether-Conduit Edge hybrid weaving: melee blade strikes vent caster heat and charge the off-hand caster for instant point-blank beam/wave discharges.',
    mainFunctionalTypes: [
      'Arming Sword',
      'Bastard Sword',
      'Spatha',
      'Katana',
      'Khopesh',
      'Beam Caster',
      'Arc Caster',
      'Wave Caster',
      'Pulse Caster',
      'Nova Caster',
    ],
    offhandFunctionalTypes: [
      'Beam Caster',
      'Arc Caster',
      'Wave Caster',
      'Pulse Caster',
      'Nova Caster',
      'Arming Sword',
      'Bastard Sword',
      'Spatha',
      'Katana',
      'Khopesh',
      'Mote',
      'Battery',
    ],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.16,
      armorThresholdBypassRatio: 0.25,
      extraArmorDentOnHit: 4,
      shieldBypassRatio: 0.2,
      perfectBlockWindowBonusSec: 0.07,
      stabilityBonusFlat: 10,
      chargeMuMultiplier: 1.12,
      attackMoveSpeedFloor: 0.62,
      guardMoveSpeedFloor: 0.82,
      reloadDurationMult: 0.75,
      heatVentOnAction5: 14,
    },
    action2: {
      name: 'Aether-Imbued Crescent Slash',
      shortLabel: 'AETHER SLASH',
      description:
        'Channels caster resonance along the blade edge to project a close-range arclight wave on impact.',
      damage: 42,
      damageType: 'Wave',
      damageFamily: 'Energy',
      heatCost: 8,
      cooldownSec: 3.1,
      tellDurationSec: 0.13,
      actionDurationSec: 0.25,
      range: 65,
    },
    action4: {
      name: 'Refractive Blade-Conduit Ward',
      shortLabel: 'CONDUIT WARD',
      description:
        'Crosses blade and caster focus to project an energy-absorbing ward (+0.07s Perfect Block window) that converts blocked hits into charge.',
      damage: 20,
      damageType: 'Pulse',
      damageFamily: 'Energy',
      heatCost: 4,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Spellblade Convergence Lunge',
      shortLabel: 'SPELLBLADE BEAM',
      description:
        'Impales the target with the main blade and immediately discharges a point-blank overcharged beam while venting 14 Heat.',
      damage: 58,
      damageType: 'Beam',
      damageFamily: 'Energy',
      heatCost: -14,
      cooldownSec: 5.2,
      tellDurationSec: 0.15,
      actionDurationSec: 0.29,
      range: 95,
      ammoCount: 1,
    },
  },

  // 16. Scepter & Ward Specialist (Tier II · Scholar / Warrior-Cleric)
  {
    featId: 'scepter_orb_specialist',
    featName: 'Scepter & Ward Specialist',
    stanceId: 'stance_scepter_ward',
    stanceName: 'Sanctum Hierophant Stance',
    shortTag: 'HIEROPHANT [WARD]',
    umbrella: 'Scholar',
    skillId: 'Cleric',
    tier: 'II',
    synergyCategory: 'Optics & Support',
    gemSockets: [
      { gemId: 'demantoid', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    requiredEquipmentLabel:
      'Mace/Cudgel/Hammer/Spike + Corona/Mote/Rhom/Disc/Buckler/Heater · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Sanctum Hierophant concussion & harmonic ward doctrine: +8 Armor Durability dent, +18 Stability, and shield-restoring shockwave ripostes.',
    mainFunctionalTypes: ['Mace', 'Cudgel', 'Hammer', 'Spike'],
    offhandFunctionalTypes: ['Corona', 'Mote', 'Rhom', 'Disc', 'Buckler', 'Heater', 'Norman'],
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.22,
      extraArmorDentOnHit: 8,
      shieldBypassRatio: 0,
      perfectBlockWindowBonusSec: 0.08,
      stabilityBonusFlat: 18,
      chargeMuMultiplier: 1.18,
      attackMoveSpeedFloor: 0.48,
      guardMoveSpeedFloor: 0.78,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 12,
    },
    action2: {
      name: 'Flanged Reliquary Crush',
      shortLabel: 'RELIQUARY CRUSH',
      description:
        'Focused scepter/mace strike behind the harmonic ward that caves in Hardened and Reactive armor plates.',
      damage: 40,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.4,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 38,
    },
    action4: {
      name: 'Corona Harmonic Aegis Ward',
      shortLabel: 'CORONA WARD',
      description:
        'Raises the sanctified Corona/Ward (+0.08s Perfect Block window, +18 Stability); blocking vents heat and restores barrier capacity.',
      damage: 20,
      damageType: 'Pulse',
      damageFamily: 'Energy',
      heatCost: 5,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Hierophant Benediction Nova',
      shortLabel: 'HIEROPHANT NOVA',
      description:
        'Strikes the scepter head against the harmonic ward to emit a concussive sanctum wave that staggers enemies and vents 12 Heat.',
      damage: 54,
      damageType: 'Wave',
      damageFamily: 'Energy',
      heatCost: -12,
      cooldownSec: 5.4,
      tellDurationSec: 0.16,
      actionDurationSec: 0.32,
      range: 44,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER III SPECIALIST MARTIAL STANCES (6 STANDALONE HEAVY / MASTER DOCTRINES)
  // ═══════════════════════════════════════════════════════════════════════════

  // 17. Odachi Specialist (Tier III · Fighter / Warrior)
  {
    featId: 'odachi_specialist',
    featName: 'Odachi Specialist',
    stanceId: 'stance_odachi',
    stanceName: 'Nodachi Battojutsu Stance',
    shortTag: 'NODACHI [2H]',
    umbrella: 'Fighter',
    skillId: 'Warrior',
    tier: 'III',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'charoite', count: 1 },
    ],
    requiredEquipmentLabel: 'Odachi/Dadao/Katana (2H Grip) · Light/Medium Load',
    doctrineSummary:
      'Unlocks Nodachi Battojutsu great-katana draw mastery: +32% Armor Threshold bypass, wide anti-cavalry sweeping arcs, and high-velocity iai lunges.',
    mainFunctionalTypes: ['Odachi', 'Dadao', 'Katana'],
    requiresTwoHandMainOnly: true,
    offhandFunctionalTypes: [],
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.32,
      extraArmorDentOnHit: 6,
      shieldBypassRatio: 0.2,
      perfectBlockWindowBonusSec: 0.07,
      stabilityBonusFlat: 14,
      chargeMuMultiplier: 1.25,
      attackMoveSpeedFloor: 0.56,
      guardMoveSpeedFloor: 0.78,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Kage-Ryu Great-Blade Draw',
      shortLabel: 'NODACHI DRAW',
      description:
        'Sweeps the extra-long curved blade in a 180° advancing arc with +32% Armor Threshold bypass.',
      damage: 46,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 10,
      cooldownSec: 3.4,
      tellDurationSec: 0.15,
      actionDurationSec: 0.28,
      range: 52,
    },
    action4: {
      name: 'Mune-Gamae Spine Deflection',
      shortLabel: 'MUNE-GAMAE',
      description:
        'Braces the rear hand along the unsharpened spine (+0.07s Perfect Block window) to redirect incoming heavy strikes into a counter-draw.',
      damage: 20,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 28,
      isBlock: true,
    },
    action5: {
      name: 'Tsubame-Gaeshi Ascending Swallow Cut',
      shortLabel: 'SWALLOW CUT',
      description:
        'Drops a lightning overhead chop and immediately whips the long blade upward through the target core while venting 10 Heat.',
      damage: 64,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 15,
      cooldownSec: 5.6,
      tellDurationSec: 0.17,
      actionDurationSec: 0.32,
      range: 54,
    },
  },

  // 18. Phalanx Specialist (Tier III · Fighter / Warrior-Guardian)
  {
    featId: 'phalanx_specialist',
    featName: 'Phalanx Specialist',
    stanceId: 'stance_phalanx',
    stanceName: 'Syntagma Sarissa Stance',
    shortTag: 'SYNTAGMA [PIKE]',
    umbrella: 'Fighter',
    skillId: 'Guardian',
    tier: 'III',
    synergyCategory: 'Frame Plating & Defense',
    gemSockets: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    requiredEquipmentLabel: 'Pike/Lance/Broad Spear + Scutum/Tower/Norman · Medium/Heavy Load',
    doctrineSummary:
      'Allows wielding a 2H Pike/Lance alongside a shoulder-slung heavy shield: +25 Stability, 1.35x anti-charge impulse, and hedged-pike lockout.',
    mainFunctionalTypes: ['Pike', 'Lance', 'Broad Spear'],
    offhandFunctionalTypes: ['Scutum', 'Tower', 'Norman'],
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.16,
      armorThresholdBypassRatio: 0.25,
      extraArmorDentOnHit: 6,
      shieldBypassRatio: 0.1,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 25,
      chargeMuMultiplier: 1.35,
      attackMoveSpeedFloor: 0.4,
      guardMoveSpeedFloor: 0.68,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Sarissa Measured Advance',
      shortLabel: 'SARISSA POKE',
      description:
        'Long-corridor two-handed pike thrust stabilized by the shoulder-slung shield harness.',
      damage: 44,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 11,
      cooldownSec: 3.6,
      tellDurationSec: 0.15,
      actionDurationSec: 0.3,
      range: 56,
    },
    action4: {
      name: 'Shoulder-Slung Pelte Wall',
      shortLabel: 'PELTE BRACE',
      description:
        'Locks the heavy shield on the lead shoulder (+25 Stability) while keeping the pike leveled against incoming charges.',
      damage: 24,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 7,
      cooldownSec: 0,
      tellDurationSec: 0.08,
      actionDurationSec: 0.34,
      range: 28,
      isBlock: true,
    },
    action5: {
      name: 'Syntagma Charge-Breaker',
      shortLabel: 'CHARGE BREAKER',
      description:
        'Plants the butt-spike into the deck and unleashes a massive anti-charge impalement that punishes forward enemy momentum.',
      damage: 60,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 16,
      cooldownSec: 6.0,
      tellDurationSec: 0.18,
      actionDurationSec: 0.34,
      range: 58,
    },
  },

  // 19. Cataphract Specialist (Tier III · Fighter / Warrior-Guardian)
  {
    featId: 'cataphract_specialist',
    featName: 'Cataphract Specialist',
    stanceId: 'stance_cataphract',
    stanceName: 'Contus Clibanarii Stance',
    shortTag: 'CATAPHRACT [LANCE]',
    umbrella: 'Fighter',
    skillId: 'Guardian',
    tier: 'III',
    synergyCategory: 'Frame Plating & Defense',
    gemSockets: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'carnelian', count: 1 },
    ],
    requiredEquipmentLabel:
      'Lance/Pike/Boar Spear/Mace/Hammer (+ optional Shield or Mace) · Heavy Load',
    doctrineSummary:
      'Unlocks Clibanarii heavy shock-cavalry doctrine: 1.40x charge momentum transfer (m_eff), +24 Stability, and devastating booster-lance couched impacts.',
    mainFunctionalTypes: ['Lance', 'Pike', 'Boar Spear', 'Mace', 'Hammer'],
    allowsSingleOrTwoHandMain: true,
    offhandFunctionalTypes: ['Heater', 'Norman', 'Scutum', 'Tower', 'Corona', 'Rhom', 'Mace', 'Hammer'],
    offhandCategories: ['Shields', 'Impact & Axes'],
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.28,
      extraArmorDentOnHit: 8,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 24,
      chargeMuMultiplier: 1.4,
      attackMoveSpeedFloor: 0.48,
      guardMoveSpeedFloor: 0.72,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Contus Couched Shock-Thrust',
      shortLabel: 'CONTUS CHARGE',
      description:
        'Locks the heavy lance/mace under the shoulder actuator to transfer full frame mass into an armor-shattering thrust.',
      damage: 48,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 11,
      cooldownSec: 3.6,
      tellDurationSec: 0.16,
      actionDurationSec: 0.3,
      range: 54,
    },
    action4: {
      name: 'Clibanarii Scale-Barding Brace',
      shortLabel: 'BARDING BRACE',
      description:
        'Braces the heavy lamellar/plate chassis (+24 Stability), shrugging off incoming fire while building forward charge momentum.',
      damage: 22,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.07,
      actionDurationSec: 0.34,
      range: 28,
      isBlock: true,
    },
    action5: {
      name: 'Royal Cataphract Overrun Slam',
      shortLabel: 'OVERRUN SLAM',
      description:
        'Surges forward with a full-mass lance/warhammer impact (1.40x charge m_eff) that knocks down targets and vents 10 Heat.',
      damage: 66,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 16,
      cooldownSec: 5.8,
      tellDurationSec: 0.18,
      actionDurationSec: 0.34,
      range: 54,
    },
  },

  // 20. Zweihander Specialist (Tier III · Rogue / Warrior-Marauder)
  {
    featId: 'zweihander_specialist',
    featName: 'Zweihander Specialist',
    stanceId: 'stance_zweihander',
    stanceName: 'Landsknecht Doppelsöldner Stance',
    shortTag: 'LANDSKNECHT [2H]',
    umbrella: 'Rogue',
    skillId: 'Marauder',
    tier: 'III',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'spinel', count: 1 },
    ],
    requiredEquipmentLabel:
      'Zweihander/Flamberge/Executioner Sword/Odachi/Dadao/Bastard Sword (2H Grip) · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Landsknecht Doppelsöldner greatsword area-denial arcs and Halbschwert half-swording: +30% THR bypass, +18 Stability, and 360° Montante wheels.',
    mainFunctionalTypes: [
      'Zweihander',
      'Flamberge',
      'Executioner Sword',
      'Odachi',
      'Dadao',
      'Bastard Sword',
    ],
    requiresTwoHandMainOnly: true,
    offhandFunctionalTypes: [],
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.3,
      extraArmorDentOnHit: 7,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0.08,
      stabilityBonusFlat: 18,
      chargeMuMultiplier: 1.3,
      attackMoveSpeedFloor: 0.52,
      guardMoveSpeedFloor: 0.72,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Halbschwert Ricasso Armor-Spike',
      shortLabel: 'HALBSCHWERT',
      description:
        'Grips the leather-wrapped ricasso half-sword style to drive the rigid point through plate seams (+30% THR bypass).',
      damage: 46,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 10,
      cooldownSec: 3.4,
      tellDurationSec: 0.15,
      actionDurationSec: 0.28,
      range: 44,
    },
    action4: {
      name: 'Pariorhaken Parrying-Lug Ward',
      shortLabel: 'PARIORHAKEN',
      description:
        'Catches enemy blades on the forward parrying lugs (+0.08s Perfect Block window, +18 Stability) before levering them aside.',
      damage: 22,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.07,
      actionDurationSec: 0.34,
      range: 28,
      isBlock: true,
    },
    action5: {
      name: 'Doppelsöldner Montante Alley-Clearer',
      shortLabel: 'MONTANTE WHEEL',
      description:
        'Whirls the greatsword in a 360° area-denial wheel that maintains 52% glide speed and cleaves all surrounding hostiles.',
      damage: 64,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 16,
      cooldownSec: 5.8,
      tellDurationSec: 0.18,
      actionDurationSec: 0.34,
      range: 46,
    },
  },

  // 21. Siege Battery Specialist (Tier III · Rogue / Warrior-Marauder)
  {
    featId: 'artillery_battery_specialist',
    featName: 'Siege Battery Specialist',
    stanceId: 'stance_siege_battery',
    stanceName: 'Bombardier Fire-Mission Stance',
    shortTag: 'BOMBARDIER [ORD]',
    umbrella: 'Rogue',
    skillId: 'Marauder',
    tier: 'III',
    synergyCategory: 'Ballistics & Ordnance',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Blast/Meteoric/Nova/Stellar/Beam Caster + Rack/Battery/Pangao/Plumbata/Bandolier · Medium/Heavy Load',
    doctrineSummary:
      'Synchronizes heavy Caster fire-control with dorsal Ordnance Racks/Batteries: simultaneous main+dorsal broadside salvos without swap delay and +18 Stability.',
    mainFunctionalTypes: [
      'Blast Caster',
      'Meteoric Caster',
      'Nova Caster',
      'Stellar Caster',
      'Beam Caster',
      'Bolt Caster',
      'Pulse Caster',
    ],
    mainCategories: ['Casters'],
    offhandFunctionalTypes: ['Rack', 'Battery', 'Pangao', 'Plumbata', 'Bandolier'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.25,
      extraArmorDentOnHit: 8,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0,
      stabilityBonusFlat: 18,
      chargeMuMultiplier: 1.15,
      attackMoveSpeedFloor: 0.5,
      guardMoveSpeedFloor: 0.7,
      reloadDurationMult: 0.75,
      heatVentOnAction5: 12,
    },
    action2: {
      name: 'Target-Lock Designator Bombard',
      shortLabel: 'DESIGNATOR',
      description:
        'Fires a heavy siege-caster shell that paints the target for dorsal rack homing and shreds +8 Armor Durability.',
      damage: 46,
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      heatCost: 10,
      cooldownSec: 3.4,
      tellDurationSec: 0.14,
      actionDurationSec: 0.26,
      range: 140,
      ammoCount: 2,
    },
    action4: {
      name: 'Dorsal Micro-Pod Counter-Volley',
      shortLabel: 'POD VOLLEY',
      description:
        'Triggers the dorsal Rack/Battery directly alongside the main caster without swapping weapon ownership.',
      damage: 40,
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 4.0,
      tellDurationSec: 0.12,
      actionDurationSec: 0.24,
      range: 135,
      ammoCount: 3,
    },
    action5: {
      name: 'Synchronized Full-Broadside Salvo',
      shortLabel: 'FULL SALVO',
      description:
        'Fires main-hand Caster and dorsal Ordnance Carrier simultaneously in a saturation barrage while venting 12 Heat.',
      damage: 66,
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.8,
      tellDurationSec: 0.18,
      actionDurationSec: 0.32,
      range: 150,
      ammoCount: 4,
    },
  },

  // 22. Archmage Staff Specialist (Tier III · Scholar / Warrior-Wizard)
  {
    featId: 'manacore_staff_specialist',
    featName: 'Archmage Staff Specialist',
    stanceId: 'stance_archmage_staff',
    stanceName: 'Astral Fulcrum Stance',
    shortTag: 'ARCHMAGE [FULCRUM]',
    umbrella: 'Scholar',
    skillId: 'Wizard',
    tier: 'III',
    synergyCategory: 'Reactor & Thermal',
    gemSockets: [
      { gemId: 'kyanite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Spetum/Partisan/Short Spear/Stellar/Beam/Wave Caster (+ optional Mote/Corona/Battery/Kaad/Pangao) · Light/Medium Load',
    doctrineSummary:
      'Unlocks Astral Fulcrum pole-conduit channeling: +18% Beam/Wave/Pulse damage, refractive phase-warding, and 18 Reactor Heat purge discharges.',
    mainFunctionalTypes: [
      'Spetum',
      'Partisan',
      'Short Spear',
      'Winged Spear',
      'Stellar Caster',
      'Beam Caster',
      'Wave Caster',
      'Arc Caster',
      'Nova Caster',
    ],
    mainCategories: ['Casters', 'Spears'],
    allowsSingleOrTwoHandMain: true,
    offhandFunctionalTypes: ['Mote', 'Corona', 'Battery', 'Kaad', 'Pangao', 'Disc', 'Rhom'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.28,
      extraArmorDentOnHit: 4,
      shieldBypassRatio: 0.22,
      perfectBlockWindowBonusSec: 0.07,
      stabilityBonusFlat: 12,
      chargeMuMultiplier: 1.05,
      attackMoveSpeedFloor: 0.6,
      guardMoveSpeedFloor: 0.78,
      reloadDurationMult: 0.75,
      heatVentOnAction5: 18,
    },
    action2: {
      name: 'Astral Fulcrum Collimated Lance',
      shortLabel: 'ASTRAL LANCE',
      description:
        'Plants the conduit shaft as a harmonic fulcrum to project a high-density arclight beam downrange.',
      damage: 46,
      damageType: 'Beam',
      damageFamily: 'Energy',
      heatCost: 9,
      cooldownSec: 3.2,
      tellDurationSec: 0.14,
      actionDurationSec: 0.26,
      range: 140,
      ammoCount: 1,
    },
    action4: {
      name: 'Harmonic Phase-Screen Ward',
      shortLabel: 'PHASE SCREEN',
      description:
        'Pulses the staff/mote resonator to project a refractive phase screen (+0.07s Perfect Block window) that absorbs energy and kinetic fire.',
      damage: 22,
      damageType: 'Pulse',
      damageFamily: 'Energy',
      heatCost: 4,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 28,
      isBlock: true,
    },
    action5: {
      name: 'Thermal Purge & Singularity Discharge',
      shortLabel: 'THERMAL PURGE',
      description:
        'Dumps 18 Reactor Heat through the astral fulcrum to unleash a piercing Beam/Wave convergence blast.',
      damage: 62,
      damageType: 'Wave',
      damageFamily: 'Energy',
      heatCost: -18,
      cooldownSec: 5.5,
      tellDurationSec: 0.16,
      actionDurationSec: 0.3,
      range: 150,
      ammoCount: 2,
    },
  },
];

/**
 * Legacy and display-slug alias map so any old save or reference resolves to its canonical 22 Specialist Feat ID.
 */
export const LEGACY_SPECIALIST_FEAT_ID_MAP: Record<string, string> = {
  boarder_specialist: 'pistol_cutlass_specialist',
  yeoman_longbow_specialist: 'longbow_specialist',
  spellblade_specialist: 'battlemage_specialist',
  scepter_ward_specialist: 'scepter_orb_specialist',
  siege_battery_specialist: 'artillery_battery_specialist',
  archmage_staff_specialist: 'manacore_staff_specialist',
  sword_shield_specialist: 'legionary_specialist',
  pike_specialist: 'phalanx_specialist',
  archer_quiver_specialist: 'mounted_archer_specialist',
  skirmisher_specialist: 'limitanei_specialist',
  axe_shield_specialist: 'viking_raider_specialist',
  great_axe_specialist: 'viking_raider_specialist',
  mace_shield_specialist: 'scepter_orb_specialist',
  bludgeon_trauma_specialist: 'cataphract_specialist',
  tomahawk_specialist: 'pistol_cutlass_specialist',
  falx_specialist: 'shield_breaker_specialist',
  shotel_specialist: 'shield_breaker_specialist',
  khopesh_specialist: 'shield_breaker_specialist',
  eastern_saber_specialist: 'daisho_specialist',
  great_blade_specialist: 'zweihander_specialist',
  battery_conduit_specialist: 'manacore_staff_specialist',
  ordnance_munitions_specialist: 'artillery_battery_specialist',
};

/**
 * Keyed lookup dictionary of all 22 Specialist Stance definitions by `featId` (including legacy aliases).
 */
export const SPECIALIST_STANCE_BY_FEAT_ID: Record<string, SpecialistStanceDefinition> = (() => {
  const map: Record<string, SpecialistStanceDefinition> = Object.fromEntries(
    SPECIALIST_STANCE_LIST.map((def) => [def.featId, def])
  );
  for (const [legacyId, canonicalId] of Object.entries(LEGACY_SPECIALIST_FEAT_ID_MAP)) {
    if (map[canonicalId] && !map[legacyId]) {
      map[legacyId] = map[canonicalId];
    }
  }
  return map;
})();

/**
 * Keyed lookup dictionary of all 22 Specialist Stance definitions by `stanceId`.
 */
export const SPECIALIST_STANCE_CATALOG: Record<string, SpecialistStanceDefinition> =
  Object.fromEntries(SPECIALIST_STANCE_LIST.map((def) => [def.stanceId, def]));

/**
 * Converts the 22 Specialist Stance definitions into standalone `FrameFeatDefinition` entries
 * (`isSpecialistStance: true`, zero prerequisite feats per Rule P-04) so they integrate seamlessly
 * into `CANONICAL_FRAME_FEAT_CATALOG` and the 113-Node Feat Constellation.
 */
export const SPECIALIST_FRAME_FEATS: FrameFeatDefinition[] = SPECIALIST_STANCE_LIST.map((s) => ({
  id: s.featId,
  name: s.featName,
  tier: s.tier,
  kind: 'interface',
  requiredSkillId: s.skillId,
  requiredSkillLevel: 1,
  umbrella: s.umbrella,
  isSpecialistStance: true,
  synergyCategory: s.synergyCategory,
  requiredEquipment: s.requiredEquipmentLabel,
  gainDescription: `${s.doctrineSummary} [Unlocks ${s.stanceName}]`,
  costDescription: `Standalone Martial Stance: ${s.requiredEquipmentLabel} (${s.umbrella} · ${s.skillId})`,
  gemSockets: s.gemSockets,
  unlocksDescription: `Requires: ${s.requiredEquipmentLabel}`,
  modifiers: {
    damageMult: s.passiveModifiers.damageMult,
    armorDurabilityDelta: s.passiveModifiers.stabilityBonusFlat,
    cooldownMult: 0.94,
  },
}));

/**
 * Resolves the canonical functional weapon type and broad category for a weapon ID or definition.
 */
function resolveSlotWeaponProfile(weaponIdOrNull: string | null | undefined): {
  def: WeaponDefinition;
  baseId: string;
  category: WeaponCategory;
  functionalType: string;
} | null {
  if (!weaponIdOrNull) return null;
  const def = getWeaponDefinition(weaponIdOrNull);
  if (!def) return null;
  const { baseId } = parseEquipmentInstanceId(def.id);
  const category: WeaponCategory = def.category || 'Blades: Straight';
  const functionalType = resolveWeaponFunctionalType(
    baseId,
    category,
    def.weaponClass,
    def.name
  );
  return { def, baseId, category, functionalType };
}

/**
 * Checks whether a resolved weapon profile matches a Specialist Stance's functional type or category list.
 */
function matchesWeaponRequirement(
  profile: {
    def: WeaponDefinition;
    baseId: string;
    category: WeaponCategory;
    functionalType: string;
  } | null,
  allowedFunctionalTypes: string[],
  allowedCategories?: WeaponCategory[]
): boolean {
  if (!profile) return false;
  if (
    allowedFunctionalTypes.length > 0 &&
    allowedFunctionalTypes.some(
      (ft) => ft.trim().toLowerCase() === profile.functionalType.trim().toLowerCase()
    )
  ) {
    return true;
  }
  if (allowedCategories && allowedCategories.includes(profile.category)) {
    return true;
  }
  return false;
}

/**
 * Evaluates whether the pilot's currently equipped weapons (`slot1`, `slot2`, `slot3`) and load bracket
 * satisfy a specific Specialist Stance definition.
 * Does not mutate `state: OrionState`.
 */
export function doesLoadoutMatchSpecialistStance(
  state: OrionState,
  stance: SpecialistStanceDefinition,
  currentLoadBracket?: LoadBracket
): { matched: boolean; reason: string } {
  const eq = state.equipmentSlots;
  const slot1Id = eq?.slot1 || state.equippedWeapons?.[0] || null;
  const slot2Id = eq?.slot2 || null;
  const slot3Id = eq?.slot3 || null;

  const mainProfile = resolveSlotWeaponProfile(slot1Id);
  if (
    !matchesWeaponRequirement(mainProfile, stance.mainFunctionalTypes, stance.mainCategories)
  ) {
    return {
      matched: false,
      reason: `Main Hand requires ${stance.requiredEquipmentLabel}`,
    };
  }

  // Check 2H-only vs Off-Hand pairing rules
  if (stance.requiresTwoHandMainOnly) {
    const is2HGrip =
      eq?.mainGrip === '2h' ||
      !slot2Id ||
      Boolean(mainProfile && isTwoHandWeapon(mainProfile.def));
    if (!is2HGrip) {
      return {
        matched: false,
        reason: `${stance.stanceName} requires Two-Handed (2H) grip on Main Hand.`,
      };
    }
  } else {
    const sideProfile = resolveSlotWeaponProfile(slot2Id);
    const auxProfile = stance.allowAuxSlot3Match ? resolveSlotWeaponProfile(slot3Id) : null;
    const sideMatches = matchesWeaponRequirement(
      sideProfile,
      stance.offhandFunctionalTypes,
      stance.offhandCategories
    );
    const auxMatches = Boolean(
      auxProfile &&
        matchesWeaponRequirement(
          auxProfile,
          stance.offhandFunctionalTypes,
          stance.offhandCategories
        )
    );
    const fusedTwinBladeMatchesOffhand = Boolean(
      mainProfile?.baseId === 'leg_yawarakai_te' &&
        (eq?.installedLoreBoundRelics?.[slot1Id || ''] === 'leg_juuchi_yosamu' ||
          eq?.installedLoreBoundRelics?.leg_yawarakai_te === 'leg_juuchi_yosamu') &&
        stance.offhandFunctionalTypes.some(
          (ft) => ft.trim().toLowerCase() === 'katana'
        )
    );
    const singleOr2HOk = Boolean(
      (stance.allowsSingleOrTwoHandMain && !slot2Id) || fusedTwinBladeMatchesOffhand
    );

    if (!sideMatches && !auxMatches && !singleOr2HOk) {
      return {
        matched: false,
        reason: `Off-Hand / Aux requires ${stance.offhandFunctionalTypes.join(' / ')}`,
      };
    }
  }

  const effectiveBracket: LoadBracket =
    currentLoadBracket || state.gates?.loadPenalty?.loadBracket || 'medium';
  if (
    !state.bypassProgressionGates &&
    !stance.allowedLoadBrackets.includes(effectiveBracket)
  ) {
    return {
      matched: false,
      reason: `Requires ${stance.allowedLoadBrackets.map((b) => b.toUpperCase()).join('/')} Load (currently ${effectiveBracket.toUpperCase()}).`,
    };
  }

  return {
    matched: true,
    reason: `${stance.stanceName} Active`,
  };
}

/**
 * Evaluates whether the pilot's currently equipped loadout satisfies a Specialist Feat's hardware requirement
 * for `doesPilotMeetFeatEquipmentRequirement` in `database/progression/index.ts`.
 * Does not mutate `state: OrionState`.
 */
export function doesPilotMeetSpecialistFeatRequirement(
  state: OrionState,
  featId: string
): { isSpecialistFeat: boolean; met: boolean; reason: string } {
  const stance = SPECIALIST_STANCE_BY_FEAT_ID[featId];
  if (!stance) {
    return { isSpecialistFeat: false, met: false, reason: '' };
  }
  const check = doesLoadoutMatchSpecialistStance(state, stance);
  return {
    isSpecialistFeat: true,
    met: check.matched,
    reason: check.matched ? stance.requiredEquipmentLabel : `Hardware Synergy: ${check.reason}`,
  };
}

/**
 * Evaluates the pilot's socketed Feats and equipped loadout to determine if a Specialist Stance
 * is currently available and active.
 * Does not mutate `state: OrionState`.
 */
export function evaluateActiveSpecialistStance(
  state: OrionState | undefined
): ActiveSpecialistStanceEvaluation {
  if (!state) {
    return {
      active: false,
      available: false,
      mode: 'auto',
      stance: null,
      statusReason: 'No active state',
      passiveModifiers: NEUTRAL_SPECIALIST_PASSIVE_MODIFIERS,
    };
  }

  const mode: 'auto' | 'base' =
    state.equipmentSlots?.stanceOverrideMode === 'base' ? 'base' : 'auto';
  const equippedFeats = state.equippedFeats || [];

  let firstSocketedSpecialist: SpecialistStanceDefinition | null = null;
  let firstUnmetReason = '';

  for (const featId of equippedFeats) {
    const stance = SPECIALIST_STANCE_BY_FEAT_ID[featId];
    if (!stance) continue;
    if (!firstSocketedSpecialist) {
      firstSocketedSpecialist = stance;
    }
    const check = doesLoadoutMatchSpecialistStance(state, stance);
    if (check.matched) {
      const isActive = mode === 'auto';
      return {
        active: isActive,
        available: true,
        mode,
        stance,
        statusReason: isActive
          ? `${stance.stanceName} (${stance.shortTag})`
          : `${stance.stanceName} Standby (Base Moveset Mode)`,
        passiveModifiers: isActive
          ? stance.passiveModifiers
          : NEUTRAL_SPECIALIST_PASSIVE_MODIFIERS,
      };
    } else if (!firstUnmetReason) {
      firstUnmetReason = check.reason;
    }
  }

  return {
    active: false,
    available: false,
    mode,
    stance: firstSocketedSpecialist,
    statusReason: firstSocketedSpecialist
      ? firstUnmetReason
      : 'No Specialist Stance feat socketed',
    passiveModifiers: NEUTRAL_SPECIALIST_PASSIVE_MODIFIERS,
  };
}

/**
 * Converts a `SpecialistStanceActionOverride` into a standard `ActionDefinition` entry
 * for seamless resolution in `getResolvedActionDescriptor` and `getResolvedCombatSkills`.
 */
export function buildActionDefinitionFromStanceOverride(
  actionNumber: 2 | 4 | 5,
  override: SpecialistStanceActionOverride
): ActionDefinition {
  const slot: 1 | 2 | 3 | 4 = actionNumber === 2 ? 1 : actionNumber === 4 ? 3 : 4;
  return {
    slot,
    name: override.name,
    description: override.description,
    tellDurationSec: override.tellDurationSec,
    actionDurationSec: override.actionDurationSec,
    cooldownSec: override.cooldownSec,
    heatCost: override.heatCost,
    damage: override.damage,
    damageType: override.damageType,
    damageFamily: override.damageFamily,
    range: override.range,
    isBlock: override.isBlock,
    isChargeable: override.isChargeable,
    maxChargeSec: override.maxChargeSec,
    ammoCount: override.ammoCount,
    noReload: true,
  };
}

/**
 * Toggles the pilot's `equipmentSlots.stanceOverrideMode` between `'auto'` (Active Specialist Doctrine)
 * and `'base'` (Base Weapon Moveset).
 * Mutates `state: OrionState` (`state.equipmentSlots.stanceOverrideMode`).
 */
export function toggleSpecialistStanceMode(
  state: OrionState,
  ctx?: { say: (text: string) => void }
): 'auto' | 'base' {
  if (!state.equipmentSlots) return 'auto';
  const current = state.equipmentSlots.stanceOverrideMode === 'base' ? 'base' : 'auto';
  const next: 'auto' | 'base' = current === 'auto' ? 'base' : 'auto';
  state.equipmentSlots.stanceOverrideMode = next;

  const evalRes = evaluateActiveSpecialistStance(state);
  if (ctx) {
    if (next === 'auto' && evalRes.stance) {
      ctx.say(`STANCE DOCTRINE ENGAGED: ${evalRes.stance.stanceName.toUpperCase()}`);
    } else {
      ctx.say('STANCE OVERRIDE: BASE WEAPON MOVESET ACTIVE');
    }
  }
  return next;
}
