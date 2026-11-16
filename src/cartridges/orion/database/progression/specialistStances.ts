/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// [ORION-ANCHOR: PROG-SPECIALIST-STANCES]
/**
 * Specialist Feats & Stances Doctrine Module (`Specialist_Feats_Stances_v02.md`).
 *
 * Implements the 22 historical & tactical Specialist Feats (10 Priority Slice + 12 Phase 2 Expansion)
 * and their paired Specialist Stances. Feats are distributed naturally across the 6 Frame Class
 * constellations (`Guardian`, `Warrior`, `Rogue`, `Marauder`, `Cleric`, `Wizard`) at Tiers `I`, `II`, and `III`.
 *
 * Wiring:
 *   - `src/cartridges/orion/database/progression/canonical_feats.ts` spreads `SPECIALIST_FRAME_FEATS` into `CANONICAL_FRAME_FEAT_CATALOG`.
 *   - `src/cartridges/orion/database/progression/featHandling.ts` registers handling summaries for Specialist Feats.
 *   - `src/cartridges/orion/database/progression/index.ts` re-exports this module and checks `doesPilotMeetSpecialistFeatRequirement`.
 *   - `src/cartridges/orion/database/equipment/index.ts` & `src/cartridges/orion/systems/combat/skillExecution.ts` resolve stance overrides for Actions 2, 4, and 5.
 *   - `src/cartridges/orion/systems/combat/damageSystem.ts`, `inertiaSystem.ts`, & `playerSystem.ts` apply passive stance modifiers.
 *   - `src/cartridges/orion/ui/satchel/SatchelLoadoutTab.tsx` exposes the Stance Mode toggle (`Active Doctrine` vs `Base Moveset`).
 *
 * Removal:
 *   - Remove `...SPECIALIST_FRAME_FEATS` from `canonical_feats.ts`, remove re-exports and calls in `progression/index.ts`,
 *     `featHandling.ts`, `equipment/index.ts`, `skillExecution.ts`, `damageSystem.ts`, `inertiaSystem.ts`, `playerSystem.ts`,
 *     and `SatchelLoadoutTab.tsx`, then delete this file.
 */

import {
  ActionDefinition,
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
 * Complete definition of a Specialist Feat and its unlocked Specialist Stance (`Specialist_Feats_Stances_v02.md`).
 */
export interface SpecialistStanceDefinition {
  /** Feat ID in `CANONICAL_FRAME_FEAT_CATALOG` (e.g. `'daisho_specialist'`) */
  featId: string;
  /** Display name of the Feat (e.g. `'Daishō Specialist'`) */
  featName: string;
  /** Unique Stance ID (e.g. `'stance_daisho'`) */
  stanceId: string;
  /** Display name of the unlocked Stance (e.g. `'Daishō Stance — Niten Ichi-ryū'`) */
  stanceName: string;
  /** Short HUD / Loadout tag (e.g. `'DAISHŌ [NITEN]'`) */
  shortTag: string;
  /** Primary Frame Class constellation arm (`Guardian`, `Warrior`, `Rogue`, `Marauder`, `Cleric`, `Wizard`) */
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

const TIER_LEVEL_MAP: Record<FeatTier, number> = {
  I: 2,
  II: 5,
  III: 9,
  IV: 14,
  V: 18,
};

/**
 * Canonical catalog of all 22 Specialist Feats & Stances (`Specialist_Feats_Stances_v02.md` §5 & §6).
 */
export const SPECIALIST_STANCE_LIST: SpecialistStanceDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // §5. PRIORITY IMPLEMENTATION SLICE (FIRST 10 FEATS & STANCES)
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Daishō Specialist (Katana / Odachi + Wakizashi / Katana)
  {
    featId: 'daisho_specialist',
    featName: 'Daishō Specialist',
    stanceId: 'stance_daisho',
    stanceName: 'Daishō Stance — Niten Ichi-ryū',
    shortTag: 'DAISHŌ [NITEN]',
    skillId: 'Warrior',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'charoite', count: 1 },
    ],
    requiredEquipmentLabel: 'Katana/Odachi (Main) + Wakizashi/Katana (Side) · Light/Medium Load',
    doctrineSummary:
      'Unlocks Niten Ichi-ryū two-heaven cross-bind parry, +0.08s Perfect Block window, and simultaneous long/short blade draw-slash.',
    mainFunctionalTypes: ['Katana', 'Odachi'],
    offhandFunctionalTypes: ['Wakizashi', 'Katana'],
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.2,
      extraArmorDentOnHit: 3,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0.08,
      stabilityBonusFlat: 10,
      chargeMuMultiplier: 1.1,
      attackMoveSpeedFloor: 0.52,
      guardMoveSpeedFloor: 0.72,
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
      name: 'Cross-Bind Parry (Jūji-Dome)',
      shortLabel: 'JŪJI-DOME',
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

  // 2. Sword & Buckler Specialist (I.33 / Bolognese)
  {
    featId: 'sword_buckler_specialist',
    featName: 'Sword & Buckler Specialist',
    stanceId: 'stance_sword_buckler',
    stanceName: 'Half-Shield Stance — Custodia & Schutzen',
    shortTag: 'I.33 BUCKLER',
    skillId: 'Warrior',
    tier: 'I',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Arming Sword/Spatha/Messer/Bastard Sword/Cinquedea/Falchion + Buckler/Disc/Mote · Light/Medium Load',
    doctrineSummary:
      'Unlocks I.33 Half-Shield bind-and-strike fencing: 100% glide speed while guarding and instant buckler rim-punch ripostes.',
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

  // 3. Sword & Shield Specialist (Knightly / Legionary Line)
  {
    featId: 'sword_shield_specialist',
    featName: 'Sword & Shield Specialist',
    stanceId: 'stance_sword_shield',
    stanceName: 'Legionary Vanguard Stance',
    shortTag: 'VANGUARD [S&S]',
    skillId: 'Guardian',
    tier: 'I',
    synergyCategory: 'Frame Plating & Defense',
    gemSockets: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    requiredEquipmentLabel:
      'Arming Sword/Spatha/Bastard Sword/Falchion/Messer + Heater/Norman/Tower/Scutum/Corona/Rhom',
    doctrineSummary:
      'Unlocks Legionary Vanguard line-anchoring: +18 Stability while braced, shield-rim bash into low-line gladius thrust.',
    mainFunctionalTypes: ['Arming Sword', 'Spatha', 'Bastard Sword', 'Falchion', 'Messer'],
    offhandFunctionalTypes: ['Heater', 'Norman', 'Tower', 'Scutum', 'Corona', 'Rhom'],
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.12,
      armorThresholdBypassRatio: 0.18,
      extraArmorDentOnHit: 4,
      shieldBypassRatio: 0,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 18,
      chargeMuMultiplier: 1.18,
      attackMoveSpeedFloor: 0.45,
      guardMoveSpeedFloor: 0.72,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 6,
    },
    action2: {
      name: 'Shield-Rim Press & Low Thrust',
      shortLabel: 'RIM THRUST',
      description:
        'Steps forward behind the shield boss to crowd the target, delivering a short-arc abdominal thrust.',
      damage: 36,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.4,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 38,
    },
    action4: {
      name: 'Braced Testudo Guard',
      shortLabel: 'TESTUDO GUARD',
      description:
        'Locks the shield wall against frontal kinetic and blast impacts (+18 Stability, -40% guard knockback slide).',
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
      name: 'Boss-Slam & Pommel Finisher',
      shortLabel: 'BOSS FINISHER',
      description:
        'Full-commitment shield charge that staggers the target, followed by an overhead sword cleave.',
      damage: 50,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 13,
      cooldownSec: 5.2,
      tellDurationSec: 0.16,
      actionDurationSec: 0.32,
      range: 36,
    },
  },

  // 4. Spear & Shield Specialist (Hoplite Doru & Aspis)
  {
    featId: 'spear_shield_specialist',
    featName: 'Spear & Shield Specialist',
    stanceId: 'stance_spear_shield',
    stanceName: 'Hoplite Othismos Stance',
    shortTag: 'HOPLITE [ASPIS]',
    skillId: 'Guardian',
    tier: 'II',
    synergyCategory: 'Frame Plating & Defense',
    gemSockets: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    requiredEquipmentLabel:
      'Short Spear/Winged Spear/Broad Spear/Partisan/Boar Spear + Heater/Norman/Scutum/Tower/Corona/Rhom · Medium/Heavy Load',
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

  // 5. Spear & Buckler Specialist (Agile Skirmish Lancer)
  {
    featId: 'spear_buckler_specialist',
    featName: 'Spear & Buckler Specialist',
    stanceId: 'stance_spear_buckler',
    stanceName: 'Darting Viper Stance',
    shortTag: 'VIPER [SPEAR]',
    skillId: 'Rogue',
    tier: 'I',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
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

  // 6. Phalanx Specialist (Macedonian Sarissa + Pelte / Heavy Shield)
  {
    featId: 'phalanx_specialist',
    featName: 'Phalanx Specialist',
    stanceId: 'stance_phalanx',
    stanceName: 'Syntagma Sarissa Stance',
    shortTag: 'SYNTAGMA [PIKE]',
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

  // 7. Pike Specialist (Swiss / Landsknecht 2H Polearm)
  {
    featId: 'pike_specialist',
    featName: 'Pike Specialist',
    stanceId: 'stance_pike',
    stanceName: 'Gewalthaufen Pike Stance',
    shortTag: 'GEWALTHAUFEN',
    skillId: 'Warrior',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel: 'Pike/Spetum/Partisan/Boar Spear (2H Grip)',
    doctrineSummary:
      'Unlocks Swiss/Landsknecht two-handed pike mastery: 1.30x charge momentum transfer, shaft-deflection parry, and 180° haft clearance.',
    mainFunctionalTypes: ['Pike', 'Spetum', 'Partisan', 'Boar Spear'],
    requiresTwoHandMainOnly: true,
    offhandFunctionalTypes: [],
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.16,
      armorThresholdBypassRatio: 0.3,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.12,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 14,
      chargeMuMultiplier: 1.3,
      attackMoveSpeedFloor: 0.48,
      guardMoveSpeedFloor: 0.7,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Gewalthaufen Lunging Skewer',
      shortLabel: 'PIKE SKEWER',
      description:
        'Sliding rear-hand extension that drives the pike head 58 px downrange with +30% Armor Threshold bypass.',
      damage: 44,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 10,
      cooldownSec: 3.4,
      tellDurationSec: 0.15,
      actionDurationSec: 0.28,
      range: 58,
    },
    action4: {
      name: 'Cross-Shaft Deflection Ward',
      shortLabel: 'SHAFT WARD',
      description:
        'Angles the ash-and-alloy polearm across the torso to bat aside incoming thrusts and projectiles.',
      damage: 20,
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
      name: 'Landsknecht Haft Clearance',
      shortLabel: 'HAFT SWEEP',
      description:
        'Whips the butt-cap in a close-quarters knockback arc to eject flankers back into tip sweet-spot range.',
      damage: 54,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.2,
      tellDurationSec: 0.16,
      actionDurationSec: 0.32,
      range: 46,
    },
  },

  // 8. Longbow Specialist (Yumi / Warbow + Yebira / Quiver / Sheaf)
  {
    featId: 'longbow_specialist',
    featName: 'Longbow Specialist',
    stanceId: 'stance_longbow',
    stanceName: 'Kyūdō & Yeoman Warbow Stance',
    shortTag: 'WARBOW [YUMI]',
    skillId: 'Warrior',
    tier: 'II',
    synergyCategory: 'Ballistics & Ordnance',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Long Bow/Great Bow/Composite Bow/Compound Bow + Yebira/Quiver/Sheaf (Side or Aux) · Light/Medium Load',
    doctrineSummary:
      'Unlocks Kyūdō/Yeoman heavy draw mastery: +35% Armor Threshold bypass on charged shots, 75% glide speed while drawing, and bodkin armor-piercers.',
    mainFunctionalTypes: ['Long Bow', 'Great Bow', 'Composite Bow', 'Compound Bow'],
    offhandFunctionalTypes: ['Yebira', 'Quiver', 'Sheaf'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.35,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.2,
      perfectBlockWindowBonusSec: 0,
      stabilityBonusFlat: 8,
      chargeMuMultiplier: 1.0,
      attackMoveSpeedFloor: 0.75,
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
      name: 'Yebira Nock-Step Reposition',
      shortLabel: 'NOCK-STEP',
      description:
        'Draws an arrow directly from the dorsal Yebira/Quiver while executing an evasive back-glide that resets draw cadence.',
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
      name: 'Heki-ryū Piercing Sky-Volley',
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

  // 9. Archer / Quiver Specialist (Thumb-Ring / Kassaki Rapid-Nock)
  {
    featId: 'archer_quiver_specialist',
    featName: 'Archer / Quiver Specialist',
    stanceId: 'stance_archer_quiver',
    stanceName: 'Thumb-Draw Kassaki Stance',
    shortTag: 'KASSAKI [BOW]',
    skillId: 'Rogue',
    tier: 'I',
    synergyCategory: 'Ballistics & Ordnance',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    requiredEquipmentLabel: 'Any Bow (Main) + Quiver/Yebira/Sheaf (Side or Aux)',
    doctrineSummary:
      'Unlocks steppe/mounted thumb-draw rapid nocking: -40% reload duration, multi-arrow hand-held nocking, and snap-shot fan volleys.',
    mainFunctionalTypes: [
      'Short Bow',
      'Long Bow',
      'Composite Bow',
      'Recurve Bow',
      'Compound Bow',
      'Great Bow',
      'Reflex Bow',
      'Crossbow',
      'Arbalest',
    ],
    mainCategories: ['Bows'],
    offhandFunctionalTypes: ['Quiver', 'Yebira', 'Sheaf'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.14,
      armorThresholdBypassRatio: 0.2,
      extraArmorDentOnHit: 3,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0,
      stabilityBonusFlat: 6,
      chargeMuMultiplier: 1.0,
      attackMoveSpeedFloor: 0.8,
      guardMoveSpeedFloor: 0.8,
      reloadDurationMult: 0.6,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Thumb-Ring Triple Snap',
      shortLabel: 'TRIPLE SNAP',
      description:
        'Holds three shafts in the bow hand to loose a rapid 3-arrow fan in a single breath.',
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
      name: 'Quiver Speed-Feed Reset',
      shortLabel: 'SPEED-FEED',
      description:
        'Snaps a fresh bundle of shafts from the dorsal quiver, immediately refilling bow readiness and firing a pinning dart.',
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

  // 10. Skirmisher Specialist (Peltast / Velites Javelin + Sheaf / Plumbata / Buckler)
  {
    featId: 'skirmisher_specialist',
    featName: 'Skirmisher Specialist',
    stanceId: 'stance_skirmisher',
    stanceName: 'Peltast Amentum Stance',
    shortTag: 'PELTAST [JAV]',
    skillId: 'Rogue',
    tier: 'I',
    synergyCategory: 'Mobility & Stealth',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Javelin/Short Spear + Sheaf/Plumbata/Bandolier/Buckler (Side or Aux) · Light/Medium Load',
    doctrineSummary:
      'Unlocks Peltast/Velites hybrid skirmishing: amentum-thong rotary javelin hurls that pin shields, seamlessly switching between melee pokes and ranged casts.',
    mainFunctionalTypes: ['Javelin', 'Short Spear'],
    offhandFunctionalTypes: ['Sheaf', 'Plumbata', 'Bandolier', 'Buckler'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.25,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.25,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 8,
      chargeMuMultiplier: 1.15,
      attackMoveSpeedFloor: 0.78,
      guardMoveSpeedFloor: 0.85,
      reloadDurationMult: 0.75,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Amentum Spin-Cast Javelin',
      shortLabel: 'AMENTUM CAST',
      description:
        'Rifled leather-thong javelin throw that punches through enemy shields and bends in the armor seam.',
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
        'Draws lead-weighted darts from the dorsal sheaf/carrier and looses a high-arcing salvo while back-gliding.',
      damage: 32,
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
      name: 'Velites Shield-Pin & Lunge',
      shortLabel: 'SHIELD-PIN',
      description:
        'Hurls a heavy pilum to overload the target shield, then immediately dashes in with a spare spear thrust.',
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

  // ═══════════════════════════════════════════════════════════════════════════
  // §6. PHASE 2 EXPANSION SLICE (REMAINING 12 FEATS & STANCES)
  // ═══════════════════════════════════════════════════════════════════════════

  // 11. Axe & Shield Specialist (Huscarl / Viking Bearded Axe + Shield)
  {
    featId: 'axe_shield_specialist',
    featName: 'Axe & Shield Specialist',
    stanceId: 'stance_axe_shield',
    stanceName: 'Huscarl Shield-Bit Stance',
    shortTag: 'HUSCARL [AXE]',
    skillId: 'Marauder',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel: 'Battle Axe/Tomahawk/Parashu + Norman/Heater/Scutum/Tower',
    doctrineSummary:
      'Unlocks Huscarl bearded-axe hooking: pulls enemy shields down to expose the frame (+7 Armor Durability shred) and anchors the brawl line.',
    mainFunctionalTypes: ['Battle Axe', 'Tomahawk', 'Parashu'],
    offhandFunctionalTypes: ['Norman', 'Heater', 'Scutum', 'Tower'],
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.2,
      extraArmorDentOnHit: 7,
      shieldBypassRatio: 0.3,
      perfectBlockWindowBonusSec: 0.05,
      stabilityBonusFlat: 16,
      chargeMuMultiplier: 1.2,
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
      damage: 40,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 10,
      cooldownSec: 3.4,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 36,
    },
    action4: {
      name: 'Iron-Boss Board Brace',
      shortLabel: 'BOARD BRACE',
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
      damage: 56,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.4,
      tellDurationSec: 0.17,
      actionDurationSec: 0.32,
      range: 38,
    },
  },

  // 12. Great Axe Specialist (Dane Axe / Pollaxe / Labrys 2H)
  {
    featId: 'great_axe_specialist',
    featName: 'Great Axe Specialist',
    stanceId: 'stance_great_axe',
    stanceName: 'Galloglass Dane-Axe Stance',
    shortTag: 'DANE AXE [2H]',
    skillId: 'Marauder',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel: 'Labrys/Battle Axe/Parashu (2H Grip) · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks two-handed Dane Axe / Labrys figure-eight cleaving: +8 Armor Durability shred, 1.30x charge impulse, and haft-butt J-hooks.',
    mainFunctionalTypes: ['Labrys', 'Battle Axe', 'Parashu'],
    requiresTwoHandMainOnly: true,
    offhandFunctionalTypes: [],
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.25,
      extraArmorDentOnHit: 8,
      shieldBypassRatio: 0.25,
      perfectBlockWindowBonusSec: 0.05,
      stabilityBonusFlat: 15,
      chargeMuMultiplier: 1.3,
      attackMoveSpeedFloor: 0.45,
      guardMoveSpeedFloor: 0.65,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Galloglass Figure-Eight Hew',
      shortLabel: 'FIGURE-8 HEW',
      description:
        'Continuous two-handed figure-eight axe sweep that carries momentum across multiple frontal targets.',
      damage: 46,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 11,
      cooldownSec: 3.6,
      tellDurationSec: 0.16,
      actionDurationSec: 0.3,
      range: 42,
    },
    action4: {
      name: 'Reinforced Langet Shaft Block',
      shortLabel: 'LANGET BLOCK',
      description:
        'Catches incoming strikes on the steel-shod haft langets, converting impact shock into counter-torque.',
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
      name: 'Executioner Horn-Hook & Guillotine',
      shortLabel: 'GUILLOTINE HEW',
      description:
        'Hooks the target leg actuator with the axe beard to yank them off-balance, then drops a devastating overhead chop.',
      damage: 64,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 16,
      cooldownSec: 5.8,
      tellDurationSec: 0.18,
      actionDurationSec: 0.34,
      range: 42,
    },
  },

  // 13. Mace & Shield Specialist (Chivalric / Clerical Vanguard)
  {
    featId: 'mace_shield_specialist',
    featName: 'Mace & Shield Specialist',
    stanceId: 'stance_mace_shield',
    stanceName: 'Sanctified Bulwark Stance',
    shortTag: 'BULWARK [MACE]',
    skillId: 'Cleric',
    tier: 'I',
    synergyCategory: 'Frame Plating & Defense',
    gemSockets: [
      { gemId: 'demantoid', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    requiredEquipmentLabel: 'Mace/Cudgel/Hammer/Spike + Heater/Norman/Tower/Scutum/Corona',
    doctrineSummary:
      'Unlocks Sanctified Bulwark concussion & barrier cadence: +8 Armor Durability dent, +18 Stability, and shield-restoring shockwave ripostes.',
    mainFunctionalTypes: ['Mace', 'Cudgel', 'Hammer', 'Spike'],
    offhandFunctionalTypes: ['Heater', 'Norman', 'Tower', 'Scutum', 'Corona'],
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.14,
      armorThresholdBypassRatio: 0.22,
      extraArmorDentOnHit: 8,
      shieldBypassRatio: 0,
      perfectBlockWindowBonusSec: 0.08,
      stabilityBonusFlat: 18,
      chargeMuMultiplier: 1.18,
      attackMoveSpeedFloor: 0.46,
      guardMoveSpeedFloor: 0.75,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Flanged Bell-Ringer Crush',
      shortLabel: 'FLANGED CRUSH',
      description:
        'Focused flanged-mace strike behind the shield ward that caves in Hardened and Reactive armor plates.',
      damage: 38,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.4,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      range: 36,
    },
    action4: {
      name: 'Consecrated Aegis Ward',
      shortLabel: 'AEGIS WARD',
      description:
        'Raises the sanctified shield (+0.08s Perfect Block window, +18 Stability); blocking vents heat and stabilizes barrier harmonic.',
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
      name: 'Judicator Concussion Nova',
      shortLabel: 'JUDICATOR NOVA',
      description:
        'Strikes the mace head against the shield boss to emit a concussive shockwave that staggers nearby enemies and vents 10 Heat.',
      damage: 52,
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      heatCost: 13,
      cooldownSec: 5.4,
      tellDurationSec: 0.16,
      actionDurationSec: 0.32,
      range: 40,
    },
  },

  // 14. Bludgeon & Trauma Specialist (Kanabō / Bec de Corbin / Maul 2H)
  {
    featId: 'bludgeon_trauma_specialist',
    featName: 'Bludgeon & Trauma Specialist',
    stanceId: 'stance_bludgeon_trauma',
    stanceName: 'Oni Kanabō & Pollaxe Stance',
    shortTag: 'KANABŌ [CRUSH]',
    skillId: 'Marauder',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel: 'Mallet/Hammer/Mace/Spike (2H Grip) · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Kanabō / Bec de Corbin anti-armor trauma doctrine: +10 Armor Durability shred, +30% THR bypass with beak/spike, and seismic ground-slams.',
    mainFunctionalTypes: ['Mallet', 'Hammer', 'Mace', 'Spike'],
    requiresTwoHandMainOnly: true,
    offhandFunctionalTypes: [],
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.3,
      extraArmorDentOnHit: 10,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0.05,
      stabilityBonusFlat: 18,
      chargeMuMultiplier: 1.32,
      attackMoveSpeedFloor: 0.42,
      guardMoveSpeedFloor: 0.65,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Corbin Beak Plate-Punch',
      shortLabel: 'BEAK PUNCH',
      description:
        'Reverses the warhammer head to drive the hardened rear spike directly through thick chassis plating (+30% THR bypass).',
      damage: 46,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 11,
      cooldownSec: 3.6,
      tellDurationSec: 0.16,
      actionDurationSec: 0.3,
      range: 40,
    },
    action4: {
      name: 'Iron-Studded Kanabō Guard',
      shortLabel: 'KANABŌ BRACE',
      description:
        'Plants the studded iron club two-handed (+18 Stability), shrugging off heavy melee lunges.',
      damage: 24,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 6,
      cooldownSec: 0,
      tellDurationSec: 0.08,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Tectonic Anvil Shatter',
      shortLabel: 'ANVIL SHATTER',
      description:
        'Full-commitment overhead maul slam that craters the deck, shredding +10 Armor Durability and knocking down staggered frames.',
      damage: 66,
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      heatCost: 16,
      cooldownSec: 6.0,
      tellDurationSec: 0.19,
      actionDurationSec: 0.35,
      range: 42,
    },
  },

  // 15. Tomahawk Specialist (Woodland / Boarding Hatchet + Knife / Bandolier / Buckler)
  {
    featId: 'tomahawk_specialist',
    featName: 'Tomahawk Specialist',
    stanceId: 'stance_tomahawk',
    stanceName: 'Ranger Hatchet & Wedge Stance',
    shortTag: 'RANGER [HAWK]',
    skillId: 'Rogue',
    tier: 'I',
    synergyCategory: 'Mobility & Stealth',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'spinel', count: 1 },
    ],
    requiredEquipmentLabel:
      'Tomahawk (Main) + Bandolier/Plumbata/Buckler/Wakizashi/Cinquedea (Side or Aux) · Light/Medium Load',
    doctrineSummary:
      'Unlocks Woodland / Boarding Tomahawk CQC & throwing mastery: high-speed hatchet hurls, off-hand wedge parries, and limb-hooking takedowns.',
    mainFunctionalTypes: ['Tomahawk'],
    offhandFunctionalTypes: ['Bandolier', 'Plumbata', 'Buckler', 'Wakizashi', 'Cinquedea'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.24,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.22,
      perfectBlockWindowBonusSec: 0.07,
      stabilityBonusFlat: 8,
      chargeMuMultiplier: 1.15,
      attackMoveSpeedFloor: 0.72,
      guardMoveSpeedFloor: 0.88,
      reloadDurationMult: 0.75,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Revolving Hatchet Hurl',
      shortLabel: 'HATCHET HURL',
      description:
        'Snaps a balanced boarding tomahawk end-over-end into the target visor or shield generator while advancing.',
      damage: 38,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 8,
      cooldownSec: 2.9,
      tellDurationSec: 0.11,
      actionDurationSec: 0.22,
      range: 92,
      ammoCount: 1,
    },
    action4: {
      name: 'Cross-Haft & Wedge Trap',
      shortLabel: 'WEDGE TRAP',
      description:
        'Catches the incoming blade between the tomahawk beard and off-hand wedge/buckler (+0.07s Perfect Block window).',
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
      name: 'Tendon-Hook & Scalp Cleave',
      shortLabel: 'TENDON HOOK',
      description:
        'Darts inside the enemy reach to hook their knee actuator with the tomahawk spike, followed by a point-blank finisher.',
      damage: 50,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 12,
      cooldownSec: 4.8,
      tellDurationSec: 0.13,
      actionDurationSec: 0.26,
      range: 36,
    },
  },

  // 16. Falx Specialist (Dacian / Thracian 2H Forward-Curved Sickle-Blade)
  {
    featId: 'falx_specialist',
    featName: 'Falx Specialist',
    stanceId: 'stance_falx',
    stanceName: 'Dacian Shield-Reaper Stance',
    shortTag: 'DACIAN [FALX]',
    skillId: 'Marauder',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'spinel', count: 1 },
    ],
    requiredEquipmentLabel: 'Falx (2H Grip)',
    doctrineSummary:
      'Unlocks Dacian forward-curved sickle-blade mastery: 45% Shield bypass over the top rim, +35% Armor Threshold bypass, and helmet-splitting pull-cuts.',
    mainFunctionalTypes: ['Falx'],
    requiresTwoHandMainOnly: true,
    offhandFunctionalTypes: [],
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.18,
      armorThresholdBypassRatio: 0.35,
      extraArmorDentOnHit: 7,
      shieldBypassRatio: 0.45,
      perfectBlockWindowBonusSec: 0.04,
      stabilityBonusFlat: 10,
      chargeMuMultiplier: 1.25,
      attackMoveSpeedFloor: 0.5,
      guardMoveSpeedFloor: 0.65,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Over-Wall Sickle Reach',
      shortLabel: 'SICKLE REACH',
      description:
        'Whips the forward-curved point over the enemy shield wall (45% Shield bypass) to tear into dome and shoulder plating.',
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
      name: 'Rhomphaia Hook-Parry',
      shortLabel: 'HOOK PARRY',
      description:
        'Catches and drags the attacker weapon downward with the inner concave edge.',
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
      name: 'Sarmizegetusa Wrenching Rip',
      shortLabel: 'WRENCHING RIP',
      description:
        'Embeds the falx beak deep into the target plating and wrenches backward, bypassing 35% THR and shredding +7 Armor Durability.',
      damage: 62,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 15,
      cooldownSec: 5.5,
      tellDurationSec: 0.17,
      actionDurationSec: 0.32,
      range: 40,
    },
  },

  // 17. Shotel Specialist (Abyssinian Kidney-Hook / Double-Curved Blade)
  {
    featId: 'shotel_specialist',
    featName: 'Shotel Specialist',
    stanceId: 'stance_shotel',
    stanceName: 'Abyssinian Hook-Around Stance',
    shortTag: 'SHOTEL [HOOK]',
    skillId: 'Rogue',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    requiredEquipmentLabel: 'Shotel (Main) + Buckler/Disc/Mote or 1H/2H · Light/Medium Load',
    doctrineSummary:
      'Unlocks Abyssinian Shotel blind-angle hooking: 55% of damage bypasses active Shields entirely, reaching behind guards to strike the back/flank.',
    mainFunctionalTypes: ['Shotel'],
    allowsSingleOrTwoHandMain: true,
    offhandFunctionalTypes: ['Buckler', 'Disc', 'Mote', 'Shotel', 'Wakizashi'],
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.32,
      extraArmorDentOnHit: 4,
      shieldBypassRatio: 0.55,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 8,
      chargeMuMultiplier: 1.12,
      attackMoveSpeedFloor: 0.6,
      guardMoveSpeedFloor: 0.85,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Kidney-Hook Blind Reach',
      shortLabel: 'KIDNEY HOOK',
      description:
        'Hooks the deep crescent blade completely around the target shield (55% Shield bypass) to puncture dorsal reactor conduits.',
      damage: 38,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.1,
      tellDurationSec: 0.13,
      actionDurationSec: 0.25,
      range: 40,
    },
    action4: {
      name: 'Crescent Spin-Parry',
      shortLabel: 'CRESCENT WARD',
      description:
        'Rotates the reversible sickle-blade in a defensive figure-eight that snags and redirects incoming lunges.',
      damage: 18,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 5,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 24,
      isBlock: true,
    },
    action5: {
      name: 'Gondar Neck-Snare Pull',
      shortLabel: 'NECK-SNARE',
      description:
        'Latches the curved tip behind the enemy collar plate and yanks them forward into a point-blank armor-bypassing riposte.',
      damage: 52,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 13,
      cooldownSec: 5.0,
      tellDurationSec: 0.15,
      actionDurationSec: 0.28,
      range: 42,
    },
  },

  // 18. Khopesh Specialist (New Kingdom Bronze/Turbine Sickle-Sword)
  {
    featId: 'khopesh_specialist',
    featName: 'Khopesh Specialist',
    stanceId: 'stance_khopesh',
    stanceName: 'Pharaonic Sickle-Bind Stance',
    shortTag: 'KHOPESH [BIND]',
    skillId: 'Warrior',
    tier: 'I',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel: 'Khopesh (Main) + Any Shield or Khopesh',
    doctrineSummary:
      'Unlocks New Kingdom Khopesh sickle-axe versatility: hooks shields for 35% Shield bypass, chops with axe-grade momentum, and vents turbine heat.',
    mainFunctionalTypes: ['Khopesh'],
    allowsSingleOrTwoHandMain: true,
    offhandFunctionalTypes: [
      'Buckler',
      'Heater',
      'Norman',
      'Tower',
      'Scutum',
      'Disc',
      'Corona',
      'Rhom',
      'Mote',
      'Khopesh',
    ],
    offhandCategories: ['Shields'],
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.15,
      armorThresholdBypassRatio: 0.25,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.35,
      perfectBlockWindowBonusSec: 0.06,
      stabilityBonusFlat: 12,
      chargeMuMultiplier: 1.18,
      attackMoveSpeedFloor: 0.54,
      guardMoveSpeedFloor: 0.78,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Crook-Snare & Sickle Chop',
      shortLabel: 'CROOK-SNARE',
      description:
        'Snags the target guard with the unsharpened inner crook, then rolls the weighted outer crescent into a heavy chop.',
      damage: 38,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.2,
      tellDurationSec: 0.13,
      actionDurationSec: 0.26,
      range: 38,
    },
    action4: {
      name: 'Uraeus Hook-Guard',
      shortLabel: 'URAEUS GUARD',
      description:
        'Raises the sickle-spine and shield in a locked ward (+0.06s Perfect Block window) that strips attacker momentum.',
      damage: 20,
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
      name: 'Kadesh Chariot-Cleaver',
      shortLabel: 'KADESH CLEAVE',
      description:
        'Surges forward with a spinning turbine-assisted sickle slash that bypasses 35% of Shields and vents 10 Heat.',
      damage: 52,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 13,
      cooldownSec: 5.0,
      tellDurationSec: 0.15,
      actionDurationSec: 0.3,
      range: 42,
    },
  },

  // 19. Eastern Saber Specialist (Dao / Kilij / Dadao)
  {
    featId: 'eastern_saber_specialist',
    featName: 'Eastern Saber Specialist',
    stanceId: 'stance_eastern_saber',
    stanceName: 'Yelü & Yanmaodao Saber Stance',
    shortTag: 'SABER [YELÜ]',
    skillId: 'Warrior',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Dao/Kilij/Dadao (Main) + Buckler/Disc/Pangao or 1H/2H · Light/Medium Load',
    doctrineSummary:
      'Unlocks Kilij yelman false-edge snap-cuts and Dao/Dadao wrapping-spine parries: +0.08s Perfect Block window and high-momentum draw-cleaves.',
    mainFunctionalTypes: ['Dao', 'Kilij', 'Dadao'],
    allowsSingleOrTwoHandMain: true,
    offhandFunctionalTypes: ['Buckler', 'Disc', 'Mote', 'Pangao', 'Dao', 'Kilij', 'Wakizashi'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium'],
    passiveModifiers: {
      damageMult: 1.16,
      armorThresholdBypassRatio: 0.24,
      extraArmorDentOnHit: 5,
      shieldBypassRatio: 0.18,
      perfectBlockWindowBonusSec: 0.08,
      stabilityBonusFlat: 12,
      chargeMuMultiplier: 1.22,
      attackMoveSpeedFloor: 0.58,
      guardMoveSpeedFloor: 0.82,
      reloadDurationMult: 1.0,
      heatVentOnAction5: 8,
    },
    action2: {
      name: 'Yelman False-Edge Snap-Cut',
      shortLabel: 'YELMAN SNAP',
      description:
        'Whips the flared distal yelman tip in a rising back-edge slash that accelerates through the target guard.',
      damage: 40,
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 3.2,
      tellDurationSec: 0.13,
      actionDurationSec: 0.26,
      range: 40,
    },
    action4: {
      name: 'Chán-Tóu Spine-Wrap Parry',
      shortLabel: 'CHÁN-TÓU WARD',
      description:
        'Coils the thick unsharpened saber spine around the head and shoulders (+0.08s Perfect Block window) to flow directly into a cut.',
      damage: 20,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 5,
      cooldownSec: 0,
      tellDurationSec: 0.06,
      actionDurationSec: 0.34,
      range: 26,
      isBlock: true,
    },
    action5: {
      name: 'Guǒ-Nǎo Advancing Typhoon Cleave',
      shortLabel: 'TYPHOON CLEAVE',
      description:
        'Spins out of a spine-wrap into a two-handed diagonal Dadao/Kilij draw-cleave that shears through shields and armor alike.',
      damage: 56,
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.2,
      tellDurationSec: 0.15,
      actionDurationSec: 0.3,
      range: 44,
    },
  },

  // 20. Great Blade Specialist (Montante / Zweihander / Flamberge / Odachi 2H)
  {
    featId: 'great_blade_specialist',
    featName: 'Great Blade Specialist',
    stanceId: 'stance_great_blade',
    stanceName: 'Montante & Halbschwert Stance',
    shortTag: 'MONTANTE [2H]',
    skillId: 'Marauder',
    tier: 'II',
    synergyCategory: 'Melee & CQC',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'spinel', count: 1 },
    ],
    requiredEquipmentLabel:
      'Zweihander/Flamberge/Executioner Sword/Odachi/Dadao (2H Grip) · Medium/Heavy Load',
    doctrineSummary:
      'Unlocks Iberian Montante area-denial arcs and German Halbschwert half-swording: +30% THR bypass on armored thrusts, +16 Stability, and continuous momentum sweeps.',
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
      extraArmorDentOnHit: 6,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0.08,
      stabilityBonusFlat: 16,
      chargeMuMultiplier: 1.28,
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
        'Catches enemy blades on the forward parrying lugs (+0.08s Perfect Block window, +16 Stability) before levering them aside.',
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
      name: 'Doppio Montante Alley-Clearer',
      shortLabel: 'MONTANTE WHEEL',
      description:
        'Whirls the greatsword in a 360° Iberian area-denial wheel that maintains 52% glide speed and cleaves all surrounding hostiles.',
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

  // 21. Battery Conduit Specialist (Caster / Spear / Impact + Battery / Kaad / Pangao)
  {
    featId: 'battery_conduit_specialist',
    featName: 'Battery Conduit Specialist',
    stanceId: 'stance_battery_conduit',
    stanceName: 'Ætheric Bus-Link Conduit Stance',
    shortTag: 'CONDUIT [BUS]',
    skillId: 'Wizard',
    tier: 'II',
    synergyCategory: 'Reactor & Thermal',
    gemSockets: [
      { gemId: 'kyanite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    requiredEquipmentLabel:
      'Any Caster/Spear/Impact Weapon (Main) + Battery/Kaad/Pangao (Side or Aux)',
    doctrineSummary:
      'Links main-hand weapon bus directly to a dorsal Battery/Kaad/Pangao array: +16% Beam/Pulse/Wave damage and Action 5 vents 18 Reactor Heat while firing.',
    mainFunctionalTypes: [],
    mainCategories: ['Casters', 'Spears', 'Impact & Axes'],
    offhandFunctionalTypes: ['Battery', 'Kaad', 'Pangao'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['light', 'medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.16,
      armorThresholdBypassRatio: 0.25,
      extraArmorDentOnHit: 4,
      shieldBypassRatio: 0.2,
      perfectBlockWindowBonusSec: 0.05,
      stabilityBonusFlat: 10,
      chargeMuMultiplier: 1.0,
      attackMoveSpeedFloor: 0.58,
      guardMoveSpeedFloor: 0.75,
      reloadDurationMult: 0.8,
      heatVentOnAction5: 18,
    },
    action2: {
      name: 'Capacitor Over-Bus Arc',
      shortLabel: 'OVER-BUS ARC',
      description:
        'Draws surplus charge from the dorsal Battery/Kaad array to project a high-density arclight lance.',
      damage: 44,
      damageType: 'Beam',
      damageFamily: 'Energy',
      heatCost: 9,
      cooldownSec: 3.2,
      tellDurationSec: 0.14,
      actionDurationSec: 0.26,
      range: 135,
      ammoCount: 1,
    },
    action4: {
      name: 'Pangao Harmonic Phase-Screen',
      shortLabel: 'PHASE SCREEN',
      description:
        'Pulses the dorsal gorget/conduit array to project a refractive phase screen that absorbs incoming energy and kinetic fire.',
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
        'Dumps 18 Reactor Heat through the dorsal radiator fins to unleash a piercing Beam/Wave convergence blast.',
      damage: 60,
      damageType: 'Wave',
      damageFamily: 'Energy',
      heatCost: -18,
      cooldownSec: 5.5,
      tellDurationSec: 0.16,
      actionDurationSec: 0.3,
      range: 145,
      ammoCount: 2,
    },
  },

  // 22. Ordnance & Munitions Specialist (Caster + Rack / Bandolier / Battery / Plumbata)
  {
    featId: 'ordnance_munitions_specialist',
    featName: 'Ordnance & Munitions Specialist',
    stanceId: 'stance_ordnance_munitions',
    stanceName: 'Combined-Arms Fire-Control Stance',
    shortTag: 'FIRE-CTRL [ORD]',
    skillId: 'Wizard',
    tier: 'II',
    synergyCategory: 'Ballistics & Ordnance',
    gemSockets: [
      { gemId: 'kyanite', count: 1 },
      { gemId: 'carnelian', count: 1 },
    ],
    requiredEquipmentLabel:
      'Any Caster (Main) + Rack/Bandolier/Battery/Plumbata (Side or Aux) · Medium/Heavy Load',
    doctrineSummary:
      'Synchronizes main-hand Caster fire-control with dorsal Ordnance Racks/Bandoliers: simultaneous main+dorsal salvos without weapon-swap delay and +14 Stability.',
    mainFunctionalTypes: [],
    mainCategories: ['Casters'],
    offhandFunctionalTypes: ['Rack', 'Bandolier', 'Battery', 'Plumbata'],
    allowAuxSlot3Match: true,
    allowedLoadBrackets: ['medium', 'heavy'],
    passiveModifiers: {
      damageMult: 1.16,
      armorThresholdBypassRatio: 0.22,
      extraArmorDentOnHit: 7,
      shieldBypassRatio: 0.15,
      perfectBlockWindowBonusSec: 0,
      stabilityBonusFlat: 14,
      chargeMuMultiplier: 1.1,
      attackMoveSpeedFloor: 0.5,
      guardMoveSpeedFloor: 0.7,
      reloadDurationMult: 0.78,
      heatVentOnAction5: 10,
    },
    action2: {
      name: 'Target-Lock Designator Burst',
      shortLabel: 'DESIGNATOR',
      description:
        'Fires a high-velocity caster burst that paints the target for dorsal rack homing and shreds +7 Armor Durability.',
      damage: 42,
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      heatCost: 10,
      cooldownSec: 3.4,
      tellDurationSec: 0.14,
      actionDurationSec: 0.26,
      range: 135,
      ammoCount: 2,
    },
    action4: {
      name: 'Dorsal Micro-Pod Counter-Volley',
      shortLabel: 'POD VOLLEY',
      description:
        'Triggers the dorsal Rack/Bandolier directly alongside the main caster without swapping weapon ownership.',
      damage: 38,
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      heatCost: 9,
      cooldownSec: 4.0,
      tellDurationSec: 0.12,
      actionDurationSec: 0.24,
      range: 130,
      ammoCount: 3,
    },
    action5: {
      name: 'Synchronized Full-Broadside Salvo',
      shortLabel: 'FULL SALVO',
      description:
        'Fires main-hand Caster and dorsal Ordnance Carrier simultaneously in a saturation barrage while venting 10 Heat.',
      damage: 64,
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      heatCost: 14,
      cooldownSec: 5.8,
      tellDurationSec: 0.18,
      actionDurationSec: 0.32,
      range: 145,
      ammoCount: 4,
    },
  },
];

/**
 * Keyed lookup dictionary of all 22 Specialist Stance definitions by `featId`.
 */
export const SPECIALIST_STANCE_BY_FEAT_ID: Record<string, SpecialistStanceDefinition> =
  Object.fromEntries(SPECIALIST_STANCE_LIST.map((def) => [def.featId, def]));

/**
 * Keyed lookup dictionary of all 22 Specialist Stance definitions by `stanceId`.
 */
export const SPECIALIST_STANCE_CATALOG: Record<string, SpecialistStanceDefinition> =
  Object.fromEntries(SPECIALIST_STANCE_LIST.map((def) => [def.stanceId, def]));

/**
 * Converts the 22 Specialist Stance definitions into standard `FrameFeatDefinition` entries
 * so they integrate seamlessly into `CANONICAL_FRAME_FEAT_CATALOG` and the 6-Arm Hexagonal Feat Constellation.
 */
export const SPECIALIST_FRAME_FEATS: FrameFeatDefinition[] = SPECIALIST_STANCE_LIST.map((s) => ({
  id: s.featId,
  name: s.featName,
  tier: s.tier,
  kind: 'interface',
  requiredSkillId: s.skillId,
  requiredSkillLevel: TIER_LEVEL_MAP[s.tier],
  synergyCategory: s.synergyCategory,
  requiredEquipment: s.requiredEquipmentLabel,
  gainDescription: `${s.doctrineSummary} [Unlocks ${s.stanceName}]`,
  costDescription: `Requirement: ${s.requiredEquipmentLabel} (${s.skillId} affinity)`,
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
 * satisfy a specific Specialist Stance definition (`Specialist_Feats_Stances_v02.md` §4).
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
    const singleOr2HOk = Boolean(stance.allowsSingleOrTwoHandMain && !slot2Id);

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
    reason: check.matched ? stance.requiredEquipmentLabel : `Hardware Synergy: ${ check.reason }`,
  };
}

/**
 * Evaluates the pilot's socketed Feats and equipped loadout to determine if a Specialist Stance
 * is currently available and active (`Specialist_Feats_Stances_v02.md` §3 & §4).
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
