/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionModificationDefinition,
  FeatTier,
  FrameFeatDefinition,
  FrameLoadCapacity,
  LevelBand,
  LoadPenaltySummary,
  OrionEquipmentSlots,
  OrionState,
  PilotSkillId,
  PilotSkillProgress,
  TraitLine,
  WeaponWeightClass,
} from '../../types';
import { TRAIT_REGISTRY } from '../characters';

export interface LevelUnlockInfo {
  level: number;
  band: LevelBand;
  fixedEvent?: string;
  unlock: string;
  learningFocus: string;
}

/**
 * §5 LEVEL SEQUENCE (LOCKED — pilot-frame-equipment-v0.md v0.7)
 * Bands:
 * - Lesson (1–5): Onboarding. Mechanics unlock one at a time via fixed world events.
 * - Challenge (6–12): Content tests the mechanics unlocked in the Lesson band; use-based skill progression opens.
 * - Expression (13–20): Full build is online. Content asks how the player puts it together. Level 20 is cap.
 */
export const LEVEL_UNLOCK_SEQUENCE: LevelUnlockInfo[] = [
  {
    level: 1,
    band: 'Lesson',
    fixedEvent: 'Enter Bog (0,0)',
    unlock: 'Weapon Set 1 Action 1, Basic Dash [B], Belt Slots 1–2, Torso (default)',
    learningFocus: 'Movement, basic dash & primary weapon chain',
  },
  {
    level: 2,
    band: 'Lesson',
    fixedEvent: 'Poe Interaction / Fallen Scout',
    unlock: 'Weapon Set 1 Action 2, Weapon Set 2 Action 1, Weapon Swap (5.0s CD), Legs Slot, Belt Slots 3–4',
    learningFocus: 'Weapon switching, mobility & expanded belt',
  },
  {
    level: 3,
    band: 'Lesson',
    fixedEvent: 'Enter Border Town (4,0)',
    unlock: 'Weapon Set 1 Actions 3–5, Weapon Set 2 Action 2, Head Slot',
    learningFocus: 'Full primary weapon moveset & head optics',
  },
  {
    level: 4,
    band: 'Lesson',
    fixedEvent: 'Border Town Midpoint',
    unlock: 'Generator Slot (Heat & Energy), Weapon Set 2 Actions 3–5, Aux Slots 1–2',
    learningFocus: 'Reactor heat/energy commit & full secondary weapon set',
  },
  {
    level: 5,
    band: 'Lesson',
    fixedEvent: 'Border Town Benchmark',
    unlock: 'Arms Slot, Aux Slots 3–4 (All 4 armor & 4 aux slots online)',
    learningFocus: 'Full chassis hardware & auxiliary depth',
  },
  {
    level: 6,
    band: 'Challenge',
    fixedEvent: 'Border Town Complete (Cathedral Door)',
    unlock: 'Utility Slot active (Action 6) + Class Default Utility Item; Use-Based Skill Progression Unlocks',
    learningFocus: 'Self-sustain utility & standard Pilot Skill -> Feat Tier loop',
  },
  {
    level: 7,
    band: 'Challenge',
    unlock: 'Feat Tier I calibration (System & Interface Feats unlocked via Pilot Skills)',
    learningFocus: 'First frame feature allocation & static budget trade-offs',
  },
  {
    level: 8,
    band: 'Challenge',
    unlock: 'Action Modification Slot 1 (Gain + Drawback behavior mods)',
    learningFocus: 'Modifying weapon & mobility action behavior',
  },
  {
    level: 9,
    band: 'Challenge',
    unlock: 'Feat Tier II access via Pilot Skill threshold (Lv 5)',
    learningFocus: 'Load capacity step-up vs. interface redistribution',
  },
  {
    level: 10,
    band: 'Challenge',
    unlock: 'Action Modification Slot 2 & Auxiliary synergy',
    learningFocus: 'Multi-layer defense & auxiliary timing',
  },
  {
    level: 11,
    band: 'Challenge',
    unlock: 'Presence Force-Reaction Field calibration',
    learningFocus: 'AI priority in PvE & reaction pressure',
  },
  {
    level: 12,
    band: 'Challenge',
    unlock: 'Feat Tier III access via Pilot Skill threshold (Lv 9)',
    learningFocus: 'Mid-tier frame specialization & thermal bleed',
  },
  {
    level: 13,
    band: 'Expression',
    unlock: 'Dual-Wield & Two-Handed Weapon Set 1–2 mastery (Main 1–4)',
    learningFocus: 'Mainhand (Actions 1–2) & Offhand (Action 5) expression',
  },
  {
    level: 14,
    band: 'Expression',
    unlock: 'Feat Tier IV access via Pilot Skill threshold (Lv 14)',
    learningFocus: 'High-commitment frame configurations',
  },
  {
    level: 15,
    band: 'Expression',
    unlock: 'Action Modification Slot 3 & Reactor Overdrive tuning',
    learningFocus: 'Commit meter mastery at high heat',
  },
  {
    level: 16,
    band: 'Expression',
    unlock: 'Superheavy Load Capacity threshold via System Feats',
    learningFocus: 'Mounting heavy ordnance on lighter frames without penalty',
  },
  {
    level: 17,
    band: 'Expression',
    unlock: 'Reactor Identity resonance (Ichor / Mana / Ether)',
    learningFocus: 'Core sustain & shield/armor harmony',
  },
  {
    level: 18,
    band: 'Expression',
    unlock: 'Feat Tier V access via Pilot Skill threshold (Lv 18)',
    learningFocus: 'Capstone System & Interface Feats',
  },
  {
    level: 19,
    band: 'Expression',
    unlock: 'Full Action Modification & 13-Slot Loadout synthesis',
    learningFocus: 'Zero-sum static budget optimization',
  },
  {
    level: 20,
    band: 'Expression',
    unlock: 'Level 20 Cap — All Pilot Skills, Feat Tiers I–V & 13 Equipment Slots mastered',
    learningFocus: 'Horizontal endgame expression (flat power, full versatility)',
  },
];

export const CORE_COMBAT_LAWS = [
  'Law 1: Every ability has a tell. No untelegraphed instant damage.',
  'Law 2: CC creates opportunity, not guaranteed damage.',
  'Law 3: Sustained healing cannot negate sustained DPS at parity.',
  'Law 4: High damage requires high commitment.',
  'Law 5: Presence governs priority, not invulnerability.',
  'Law 6: Stats are marginal; action is primary.',
];

// ─── LAYER 1: PILOT SKILLS (Use-Based Progression) ───────────────────────────

export const PILOT_SKILL_DEFINITIONS: Array<{
  id: PilotSkillId;
  name: string;
  relatedEquipment: string;
}> = [
  {
    id: 'ballistics_kinetics',
    name: 'Ballistics & Ranged Ordnance',
    relatedEquipment: 'Firing ranged / kinetic / beam weapons (Gladius, Avalon Lance)',
  },
  {
    id: 'melee_cqc',
    name: 'Close-Quarters Blade Arts',
    relatedEquipment: 'Striking with melee blades & lunges (Scout Khopesh)',
  },
  {
    id: 'propulsion_boost',
    name: 'Thruster & Evasion Rigging',
    relatedEquipment: 'Executing Basic Dash [B] and Continuous Boost',
  },
  {
    id: 'heavy_chassis',
    name: 'Chassis Load & Plating',
    relatedEquipment: 'Absorbing hits on Armor/Shields & operating Heavy/Superheavy frames',
  },
  {
    id: 'reactor_flux',
    name: 'Reactor Flux & Aux Systems',
    relatedEquipment: 'Triggering Aux/Utility modules & managing Reactor Heat/Energy',
  },
];

export function createInitialPilotSkills(): Record<PilotSkillId, PilotSkillProgress> {
  return {
    ballistics_kinetics: {
      id: 'ballistics_kinetics',
      name: 'Ballistics & Ranged Ordnance',
      level: 1,
      xp: 0,
      nextLevelXp: 40,
      relatedEquipment: 'Firing ranged / kinetic / beam weapons',
    },
    melee_cqc: {
      id: 'melee_cqc',
      name: 'Close-Quarters Blade Arts',
      level: 1,
      xp: 0,
      nextLevelXp: 40,
      relatedEquipment: 'Striking with melee blades & lunges',
    },
    propulsion_boost: {
      id: 'propulsion_boost',
      name: 'Thruster & Evasion Rigging',
      level: 1,
      xp: 0,
      nextLevelXp: 40,
      relatedEquipment: 'Executing Basic Dash [B] and Continuous Boost',
    },
    heavy_chassis: {
      id: 'heavy_chassis',
      name: 'Chassis Load & Plating',
      level: 1,
      xp: 0,
      nextLevelXp: 40,
      relatedEquipment: 'Absorbing hits on Armor/Shields & heavy frames',
    },
    reactor_flux: {
      id: 'reactor_flux',
      name: 'Reactor Flux & Aux Systems',
      level: 1,
      xp: 0,
      nextLevelXp: 40,
      relatedEquipment: 'Triggering Aux/Utility modules & venting Reactor Heat',
    },
  };
}

// ─── LAYER 2: FRAME FEATS (System vs. Interface, Static Budget) ──────────────

export const FEAT_TIER_SKILL_THRESHOLDS: Record<FeatTier, number> = {
  I: 2,
  II: 5,
  III: 9,
  IV: 14,
  V: 18,
};

export const FRAME_FEAT_CATALOG: FrameFeatDefinition[] = [
  {
    id: 'sys_servo_reinforcement_1',
    name: 'System Feat I: Reinforced Hardpoint Servos',
    tier: 'I',
    kind: 'system',
    requiredSkillId: 'heavy_chassis',
    requiredSkillLevel: 2,
    gainDescription: '+1 Frame Load Capacity Step (e.g. Light -> Medium, Medium -> Heavy)',
    costDescription: 'Allocates Tier I System capacity instead of Interface stat trade',
    loadStepUp: 1,
  },
  {
    id: 'if_overclocked_actuator',
    name: 'Interface Feat I: Overclocked Firing Actuator',
    tier: 'I',
    kind: 'interface',
    requiredSkillId: 'ballistics_kinetics',
    requiredSkillLevel: 2,
    gainDescription: '+15% Weapon Damage Output',
    costDescription: '+15% Weapon Heat Generation (Static Budget Trade)',
    modifiers: {
      damageMult: 1.15,
      heatGenMult: 1.15,
    },
  },
  {
    id: 'if_blade_gyros',
    name: 'Interface Feat I: CQC Counter-Gyros',
    tier: 'I',
    kind: 'interface',
    requiredSkillId: 'melee_cqc',
    requiredSkillLevel: 2,
    gainDescription: '+10% Walk & Boost Mobility Speed',
    costDescription: '-10 Shield Max Capacity (Static Budget Trade)',
    modifiers: {
      moveSpeedMult: 1.1,
      shieldCapDelta: -10,
    },
  },
  {
    id: 'sys_load_bearing_struts_2',
    name: 'System Feat II: Load-Bearing Torsion Struts',
    tier: 'II',
    kind: 'system',
    requiredSkillId: 'heavy_chassis',
    requiredSkillLevel: 5,
    gainDescription: '+1 Frame Load Capacity Step (mounts Heavy/Superheavy gear without penalty)',
    costDescription: 'Allocates Tier II System capacity',
    loadStepUp: 1,
  },
  {
    id: 'if_capacitor_shunt',
    name: 'Interface Feat II: Shield Capacitor Shunt',
    tier: 'II',
    kind: 'interface',
    requiredSkillId: 'reactor_flux',
    requiredSkillLevel: 5,
    gainDescription: '+25 Shield Max Capacity',
    costDescription: '-12% Walk & Boost Speed (Static Budget Trade)',
    modifiers: {
      shieldCapDelta: 25,
      moveSpeedMult: 0.88,
    },
  },
  {
    id: 'if_gyro_counterweight',
    name: 'Interface Feat II: Gyroscopic Counterweight',
    tier: 'II',
    kind: 'interface',
    requiredSkillId: 'propulsion_boost',
    requiredSkillLevel: 5,
    gainDescription: '+15% Projectile Accuracy & Stability',
    costDescription: '+20% Weapon Swap Cooldown (5.0s -> 6.0s)',
    modifiers: {
      accuracyMult: 1.15,
      swapTimeMult: 1.2,
    },
  },
  {
    id: 'if_thermal_bleed',
    name: 'Interface Feat III: Thermal Bleed Louvers',
    tier: 'III',
    kind: 'interface',
    requiredSkillId: 'reactor_flux',
    requiredSkillLevel: 9,
    gainDescription: '+35% Passive Heat Venting Rate',
    costDescription: '-20 Armor Max Durability (Exposed Louvers)',
    modifiers: {
      heatVentMult: 1.35,
      armorDurabilityDelta: -20,
    },
  },
  {
    id: 'sys_superheavy_gantry_4',
    name: 'System Feat IV: Superheavy Siege Gantry',
    tier: 'IV',
    kind: 'system',
    requiredSkillId: 'heavy_chassis',
    requiredSkillLevel: 14,
    gainDescription: '+1 Frame Load Capacity Step (unlocks Superheavy Ceiling on any Frame)',
    costDescription: 'Allocates Tier IV System capacity',
    loadStepUp: 1,
  },
  {
    id: 'if_aether_synced_core',
    name: 'Interface Feat V: Æther-Synced Core Conduit',
    tier: 'V',
    kind: 'interface',
    requiredSkillId: 'reactor_flux',
    requiredSkillLevel: 18,
    gainDescription: '-25% Active Skill & Aux Cooldowns, -20% Weapon Swap Time',
    costDescription: '+15% Weapon Heat Generation (Static Budget Trade)',
    modifiers: {
      cooldownMult: 0.75,
      swapTimeMult: 0.8,
      heatGenMult: 1.15,
    },
  },
  {
    id: 'knights_oath',
    name: "Relic Feat: Knight's Oath (Lady of the Lake)",
    tier: 'I',
    kind: 'interface',
    requiredSkillId: 'melee_cqc',
    requiredSkillLevel: 1,
    gainDescription: '+25% Damage vs. Camelot Knights & Sanctum Constructs',
    costDescription: 'Earned by defeating the Lady of the Lake or completing the Three Knights Trial',
    modifiers: {},
  },
];

// ─── LAYER 3: EQUIPMENT SLOTS (13-Slot Taxonomy) & ACTION MODIFICATIONS ──────

export const ACTION_MODIFICATION_CATALOG: ActionModificationDefinition[] = [
  {
    id: 'mod_multi_target_lock',
    name: 'Splinter-Lock Targeting Array',
    targetCategory: 'ranged',
    gainDescription: 'Fires +1 extra splinter projectile per ranged attack',
    drawbackDescription: '+25% Tell Windup Duration (slower commitment)',
    modifiers: {
      extraProjectiles: 1,
      tellDurationMult: 1.25,
    },
  },
  {
    id: 'mod_phase_thruster',
    name: 'Afterburner Phase Injector',
    targetCategory: 'mobility',
    gainDescription: '+0.10s Booster Dash Duration & Evasion Window',
    drawbackDescription: '+8 Booster Heat Cost per Dash',
    modifiers: {
      extraDashDurationSec: 0.1,
      heatCostDelta: 8,
    },
  },
  {
    id: 'mod_hyper_armor_stance',
    name: 'Magnetic Anchor Stance',
    targetCategory: 'melee',
    gainDescription: '-20% Skill Cooldowns on CQC & Hardware Actions',
    drawbackDescription: '+20% Tell Windup Duration',
    modifiers: {
      hyperArmorWindup: true,
      cooldownMult: 0.8,
      tellDurationMult: 1.2,
    },
  },
];

const DEFAULT_UTILITY_BY_TRAIT: Record<TraitLine, string> = {
  Warrior: 'utility_ichor_surge',
  Marauder: 'utility_siege_brace',
  Guardian: 'utility_aegis_pulse',
  Rogue: 'utility_phantom_shroud',
  Wizard: 'utility_arclight_capacitor',
  Cleric: 'utility_sanctum_font',
};

export function createInitialEquipmentSlots(traitLine: TraitLine = 'Warrior'): OrionEquipmentSlots {
  const trait = TRAIT_REGISTRY[traitLine] || TRAIT_REGISTRY.Warrior;
  return {
    weaponSet1: ['gladius_boltcaster', null],
    weaponSet2: ['khopesh', null],
    utility: DEFAULT_UTILITY_BY_TRAIT[traitLine] || 'utility_ichor_surge',
    aux: [
      'mod_head_optic_scan',
      'mod_torso_reactive_burst',
      'mod_arms_shock_grapple',
      'mod_legs_seismic_stomp',
    ],
    belt: ['repair_kit', 'grail_water', 'corrupted_shard', null],
    armor: {
      head: `${trait.frameModel || 'Mark-IV'} Sensor Visor`,
      torso: `${trait.frameModel || 'Mark-IV'} ${trait.baseArmor.type} Cuirass`,
      arms: `${trait.frameModel || 'Mark-IV'} Actuator Vambraces`,
      legs: `${trait.frameModel || 'Mark-IV'} Thruster Greaves`,
      generator: `${trait.reactor} Core Generator`,
    },
    installedMods: {},
  };
}

// ─── GATING CHAIN & LOAD CAPACITY CALCULATIONS (§3.4) ────────────────────────

const LOAD_ORDER: FrameLoadCapacity[] = ['light', 'medium', 'heavy', 'superheavy'];

export function getLevelBand(level: number): LevelBand {
  if (level <= 5) return 'Lesson';
  if (level <= 12) return 'Challenge';
  return 'Expression';
}

export function isStandardProgressionUnlocked(state: OrionState): boolean {
  if (state.bypassProgressionGates) return true;
  if (!state.tutorialActive) return true;
  if (state.tutorialStep === 'tutorial_complete') return true;
  if (state.flags?.cathedral_door_open || state.level >= 6) return true;
  return false;
}

export function computeUnlockedFeatTiers(
  pilotSkills?: Record<PilotSkillId, PilotSkillProgress>,
  bypass: boolean = false
): FeatTier[] {
  if (bypass) return ['I', 'II', 'III', 'IV', 'V'];
  const skills = pilotSkills || createInitialPilotSkills();
  const maxSkillLevel = Math.max(
    1,
    ...Object.values(skills).map((s) => s.level)
  );

  const unlocked: FeatTier[] = [];
  (Object.keys(FEAT_TIER_SKILL_THRESHOLDS) as FeatTier[]).forEach((tier) => {
    if (maxSkillLevel >= FEAT_TIER_SKILL_THRESHOLDS[tier]) {
      unlocked.push(tier);
    }
  });
  return unlocked;
}

export function computeEffectiveLoadCapacity(
  traitLine: TraitLine,
  equippedFeats: string[]
): FrameLoadCapacity {
  const trait = TRAIT_REGISTRY[traitLine] || TRAIT_REGISTRY.Warrior;
  const baseLoad: FrameLoadCapacity = trait.weightClass || 'medium';
  const baseIdx = Math.max(0, LOAD_ORDER.indexOf(baseLoad));

  let steps = 0;
  for (const featId of equippedFeats) {
    const feat = FRAME_FEAT_CATALOG.find((f) => f.id === featId);
    if (feat && feat.kind === 'system' && feat.loadStepUp) {
      steps += feat.loadStepUp;
    }
  }

  const finalIdx = Math.min(LOAD_ORDER.length - 1, baseIdx + steps);
  return LOAD_ORDER[finalIdx];
}

/**
 * §3.4 Load Capacity vs. Weapon Weight Penalty Table (PROPOSED)
 */
export function computeLoadPenalty(
  frameLoad: FrameLoadCapacity,
  weaponWeight: WeaponWeightClass
): LoadPenaltySummary {
  if (frameLoad === 'light') {
    if (weaponWeight === 'light') {
      return {
        frameLoad,
        weaponWeight,
        mobilityMult: 1.0,
        heatMult: 1.0,
        swapTimeMult: 1.0,
        accuracyMult: 1.0,
        stealthBroken: false,
        label: 'OPTIMAL (NO PENALTY)',
      };
    }
    if (weaponWeight === 'medium') {
      return {
        frameLoad,
        weaponWeight,
        mobilityMult: 1.0,
        heatMult: 1.1,
        swapTimeMult: 1.2,
        accuracyMult: 1.0,
        stealthBroken: false,
        label: 'OVERLOAD: SWAP +20%, HEAT +10%',
      };
    }
    return {
      frameLoad,
      weaponWeight,
      mobilityMult: 0.6,
      heatMult: 1.3,
      swapTimeMult: 1.5,
      accuracyMult: 1.0,
      stealthBroken: true,
      label: 'HEAVY OVERLOAD: MOBILITY -40%, HEAT +30%, SWAP +50%, STEALTH BROKEN',
    };
  }

  if (frameLoad === 'medium') {
    if (weaponWeight === 'light') {
      return {
        frameLoad,
        weaponWeight,
        mobilityMult: 1.0,
        heatMult: 1.0,
        swapTimeMult: 1.0,
        accuracyMult: 0.9,
        stealthBroken: false,
        label: 'UNDERWEIGHT CALIBRATION: ACCURACY -10%',
      };
    }
    if (weaponWeight === 'medium') {
      return {
        frameLoad,
        weaponWeight,
        mobilityMult: 1.0,
        heatMult: 1.0,
        swapTimeMult: 1.0,
        accuracyMult: 1.0,
        stealthBroken: false,
        label: 'OPTIMAL (NO PENALTY)',
      };
    }
    return {
      frameLoad,
      weaponWeight,
      mobilityMult: 0.85,
      heatMult: 1.1,
      swapTimeMult: 1.2,
      accuracyMult: 1.0,
      stealthBroken: false,
      label: 'OVERLOAD: MOBILITY -15%, HEAT +10%, SWAP +20%',
    };
  }

  // Heavy & Superheavy frames mount any weapon weight without penalty
  return {
    frameLoad,
    weaponWeight,
    mobilityMult: 1.0,
    heatMult: 1.0,
    swapTimeMult: 1.0,
    accuracyMult: 1.0,
    stealthBroken: false,
    label: 'HEAVY CHASSIS CLEARANCE (NO PENALTY)',
  };
}

export function computeInterfaceFeatModifiers(equippedFeats: string[]): {
  damageMult: number;
  heatGenMult: number;
  shieldCapDelta: number;
  moveSpeedMult: number;
  swapTimeMult: number;
  heatVentMult: number;
  armorDurabilityDelta: number;
  cooldownMult: number;
  accuracyMult: number;
} {
  let damageMult = 1.0;
  let heatGenMult = 1.0;
  let shieldCapDelta = 0;
  let moveSpeedMult = 1.0;
  let swapTimeMult = 1.0;
  let heatVentMult = 1.0;
  let armorDurabilityDelta = 0;
  let cooldownMult = 1.0;
  let accuracyMult = 1.0;

  for (const featId of equippedFeats) {
    const feat = FRAME_FEAT_CATALOG.find((f) => f.id === featId);
    if (!feat?.modifiers) continue;
    const m = feat.modifiers;
    if (m.damageMult) damageMult *= m.damageMult;
    if (m.heatGenMult) heatGenMult *= m.heatGenMult;
    if (m.shieldCapDelta) shieldCapDelta += m.shieldCapDelta;
    if (m.moveSpeedMult) moveSpeedMult *= m.moveSpeedMult;
    if (m.swapTimeMult) swapTimeMult *= m.swapTimeMult;
    if (m.heatVentMult) heatVentMult *= m.heatVentMult;
    if (m.armorDurabilityDelta) armorDurabilityDelta += m.armorDurabilityDelta;
    if (m.cooldownMult) cooldownMult *= m.cooldownMult;
    if (m.accuracyMult) accuracyMult *= m.accuracyMult;
  }

  return {
    damageMult,
    heatGenMult,
    shieldCapDelta,
    moveSpeedMult,
    swapTimeMult,
    heatVentMult,
    armorDurabilityDelta,
    cooldownMult,
    accuracyMult,
  };
}

/**
 * Use-Based Pilot Skill Progression (`§2.3`).
 * Locked out while the onboarding tutorial is active (`!isStandardProgressionUnlocked(state)`),
 * so tutorial levels 1–5 are never overridden prematurely.
 */
export function awardPilotSkillXp(
  state: OrionState,
  skillId: PilotSkillId,
  amount: number,
  ctx?: { say: (text: string) => void }
): boolean {
  if (!state.pilotSkills) {
    state.pilotSkills = createInitialPilotSkills();
  }

  // Tutorial Lockout Rule: Do not advance standard use-based progression until tutorial is cleared
  if (!isStandardProgressionUnlocked(state)) {
    return false;
  }

  const skill = state.pilotSkills[skillId];
  if (!skill || skill.level >= 20) return false;

  skill.xp += amount;
  let leveledUp = false;

  while (skill.xp >= skill.nextLevelXp && skill.level < 20) {
    skill.xp -= skill.nextLevelXp;
    skill.level += 1;
    skill.nextLevelXp = Math.round(40 + skill.level * 15);
    leveledUp = true;

    // Advance Pilot Level (up to Level 20 cap) when aggregate skill milestones are reached
    const totalSkillLevels = Object.values(state.pilotSkills).reduce(
      (sum, s) => sum + (s.level - 1),
      0
    );
    const derivedPilotLevel = Math.min(20, Math.max(state.level, 6 + Math.floor(totalSkillLevels / 2)));
    if (derivedPilotLevel > state.level) {
      state.level = derivedPilotLevel;
      const unlockInfo = LEVEL_UNLOCK_SEQUENCE.find((u) => u.level === state.level);
      ctx?.say(
        `PILOT LEVEL ${state.level} (${getLevelBand(state.level).toUpperCase()}) · ${unlockInfo?.unlock.toUpperCase() || 'NEW CAPABILITIES'}`
      );
    } else {
      ctx?.say(`PILOT SKILL UP: ${skill.name.toUpperCase()} LV ${skill.level}`);
    }
  }

  return leveledUp;
}
