/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionModificationDefinition,
  FeatTier,
  FrameFeatDefinition,
  FrameLoadCapacity,
  GemId,
  LevelBand,
  LoadBracket,
  LoadPenaltySummary,
  OrionEquipmentSlots,
  OrionState,
  PilotSkillId,
  PilotSkillProgress,
  TraitLine,
  WeaponComponentPartDefinition,
  WeaponComponentSlotId,
  WeaponWeightClass,
} from '../../types';
import { TRAIT_REGISTRY } from '../characters';
import {
  CANONICAL_HARDWARE_CATALOG,
  CanonicalHardwareItemDefinition,
  CHASSIS_HARDWARE_CATALOG,
  ChassisHardwareItemDefinition,
  CRAFTED_SUBMODULE_HARDWARE,
  findHardwareItemByNameOrId,
  getHardwareBaseWeight,
  getHardwareCapacityBonus,
  getHardwareGemBonusDescription,
  resolveEquippedHardwareStats,
} from '../equipment/chassis_hardware';
import {
  buildEquipmentInstanceId,
  formatModifiedEquipmentName,
  GEM_MOD_PREFIX_BY_ID,
  isCanonicalGemId,
  parseEquipmentInstanceId,
  usesCustomSuffixBySemantics,
} from '../equipment/mod_naming';
import { getWeaponDefinition, isAuxiliaryEquipment } from '../equipment/weapons';
import { getItemDefinition } from '../items';
import { GEMSTONE_CATALOG, GEMSTONE_REGISTRY, TRAIT_FUNDING_GEMS } from '../items/gemstones';
import { CANONICAL_FRAME_FEAT_CATALOG } from './canonical_feats';

export {
  buildEquipmentInstanceId,
  CANONICAL_HARDWARE_CATALOG,
  type CanonicalHardwareItemDefinition,
  CHASSIS_HARDWARE_CATALOG,
  type ChassisHardwareItemDefinition,
  CRAFTED_SUBMODULE_HARDWARE,
  findHardwareItemByNameOrId,
  formatModifiedEquipmentName,
  GEM_MOD_PREFIX_BY_ID,
  getHardwareBaseWeight,
  getHardwareCapacityBonus,
  getHardwareGemBonusDescription,
  isCanonicalGemId,
  parseEquipmentInstanceId,
  resolveEquippedHardwareStats,
  usesCustomSuffixBySemantics,
};

export { GEMSTONE_CATALOG, GEMSTONE_REGISTRY, TRAIT_FUNDING_GEMS };

export interface LevelUnlockInfo {
  level: number;
  band: LevelBand;
  fixedEvent?: string;
  unlock: string;
  learningFocus: string;
}

// [ORION-ANCHOR: PROG-LEVEL-SEQUENCE]
/**
 * §5 LEVEL SEQUENCE (LOCKED — pilot-frame-equipment-v0.md v0.8 Classless Spec)
 * Frame Level (1–20): Tutorial & onboarding milestones. Gem handling: None.
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
    unlock: 'Utility Slot active (Action 6) + Tactical Utility Item; Gem Skill Progression Unlocks',
    learningFocus: 'Self-sustain utility & Gemstone -> Pilot Skill -> Feat Node loop',
  },
  {
    level: 7,
    band: 'Challenge',
    unlock: 'Feat Tier I calibration (System & Interface Feat Nodes unlocked via Pilot Skills)',
    learningFocus: 'Socketing Combat Discipline + Reactor Gems into Tier I Feat Nodes',
  },
  {
    level: 8,
    band: 'Challenge',
    unlock: 'Action Modification Slot 1 (Gem-generated Gain + Drawback behavior mods)',
    learningFocus: 'Spending 1–2 Gems to generate retained Equipment Mods',
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
    learningFocus: 'Capstone System & Interface Feat Nodes',
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
    unlock: 'Level 20 Cap — All 6 Combat Discipline Skills, Feat Tiers I–V & 13 Equipment Slots mastered',
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

// [ORION-ANCHOR: PROG-SKILL-SCALING]
// ─── LAYER 1: 6 COMBAT DISCIPLINE PILOT SKILLS (Funded by Matching Gems) ────

export const PILOT_SKILL_DEFINITIONS: Array<{
  id: PilotSkillId;
  name: string;
  fundingGems: [GemId, GemId];
  relatedEquipment: string;
}> = [
  {
    id: 'Warrior',
    name: 'Assault Ballistics & Turbine',
    fundingGems: ['spinel', 'hematite'],
    relatedEquipment: 'Funded by Spinel (Discipline) or Hematite (Ichor Reactor). Unlocks frontline ballistics, turbine heat & mobility Feat Nodes.',
  },
  {
    id: 'Marauder',
    name: 'Heavy Ordnance & Siege',
    fundingGems: ['carnelian', 'hematite'],
    relatedEquipment: 'Funded by Carnelian (Discipline) or Hematite (Ichor Reactor). Unlocks super-heavy load, rotary/missile ordnance & Presence Feat Nodes.',
  },
  {
    id: 'Guardian',
    name: 'Aegis Barrier & Vanguard',
    fundingGems: ['titanite', 'moonstone'],
    relatedEquipment: 'Funded by Titanite (Discipline) or Moonstone (Mana Reactor). Unlocks shield bastion, radiant lance & Presence priority Feat Nodes.',
  },
  {
    id: 'Cleric',
    name: 'Harmonic Support & Triage',
    fundingGems: ['demantoid', 'moonstone'],
    relatedEquipment: 'Funded by Demantoid (Discipline) or Moonstone (Mana Reactor). Unlocks barrier/plating harmonization, thermal venting & aura Feat Nodes.',
  },
  {
    id: 'Wizard',
    name: 'Beam & Wave Artillery',
    fundingGems: ['kyanite', 'rubellite'],
    relatedEquipment: 'Funded by Kyanite (Discipline) or Rubellite (Ether Reactor). Unlocks beam focus, prism refraction & Æther conduit Feat Nodes.',
  },
  {
    id: 'Rogue',
    name: 'Recon, Stealth & CQC',
    fundingGems: ['charoite', 'rubellite'],
    relatedEquipment: 'Funded by Charoite (Discipline) or Rubellite (Ether Reactor). Unlocks CQC gyros, precision marksman, evasion & stealth Feat Nodes.',
  },
];

export function createInitialPilotSkills(
  traitLine?: TraitLine
): Record<PilotSkillId, PilotSkillProgress> {
  return PILOT_SKILL_DEFINITIONS.reduce(
    (acc, def) => {
      const isPrimaryStarter = Boolean(traitLine && def.id === traitLine);
      acc[def.id] = {
        id: def.id,
        name: def.name,
        level: isPrimaryStarter ? 2 : 1,
        xp: 0,
        nextLevelXp: 1,
        relatedEquipment: def.relatedEquipment,
        gemsInvested: isPrimaryStarter ? 1 : 0,
        fundingGems: [...def.fundingGems],
      };
      return acc;
    },
    {} as Record<PilotSkillId, PilotSkillProgress>
  );
}

export function normalizePilotSkills(
  raw?: Record<string, any>,
  traitLine?: TraitLine
): Record<PilotSkillId, PilotSkillProgress> {
  const base = createInitialPilotSkills(traitLine);
  if (!raw || typeof raw !== 'object') return base;

  for (const def of PILOT_SKILL_DEFINITIONS) {
    const existing = raw[def.id];
    if (existing && typeof existing === 'object') {
      base[def.id] = {
        ...base[def.id],
        name: def.name,
        relatedEquipment: def.relatedEquipment,
        level: Math.max(1, Math.min(20, Number(existing.level) || 1)),
        xp: Number(existing.xp) || 0,
        gemsInvested: Number(existing.gemsInvested) || 0,
      };
    }
  }
  return base;
}

// ─── LAYER 2: 97 CANONICAL FRAME FEAT NODES (Tiers I–V + Knight's Oath) ──────

export const FEAT_TIER_SKILL_THRESHOLDS: Record<FeatTier, number> = {
  I: 2,
  II: 5,
  III: 9,
  IV: 14,
  V: 18,
};

export const FRAME_FEAT_CATALOG: FrameFeatDefinition[] = CANONICAL_FRAME_FEAT_CATALOG;

/**
 * Canonical 2 Tier I Starting Feats per Kit to support baseline equipment, stats, and role.
 */
export const STARTER_FEAT_LOADOUT_BY_KIT: Record<TraitLine, [string, string]> = {
  Warrior: ['booster_evasion', 'momentum_guard'],
  Marauder: ['siege_stability', 'anchored_action'],
  Guardian: ['shield_charge', 'stabilizer_pulse'],
  Rogue: ['shadow_step', 'phantom_strike'],
  Wizard: ['beam_focus', 'radiant_overflow'],
  Cleric: ['reactive_healing', 'empowered_blessing'],
};

/**
 * Builds the starting `equippedFeats` and pre-socketed `socketedFeatGems` map for a given kit.
 */
export function createStarterFeatLoadout(traitLine: TraitLine = 'Warrior'): {
  equippedFeats: string[];
  socketedFeatGems: Record<string, Partial<Record<GemId, number>>>;
} {
  const featIds =
    STARTER_FEAT_LOADOUT_BY_KIT[traitLine] || STARTER_FEAT_LOADOUT_BY_KIT.Warrior;
  const equippedFeats: string[] = [];
  const socketedFeatGems: Record<string, Partial<Record<GemId, number>>> = {};
  for (const id of featIds) {
    const feat = FRAME_FEAT_CATALOG.find((f) => f.id === id);
    if (!feat) continue;
    equippedFeats.push(feat.id);
    const rec: Partial<Record<GemId, number>> = {};
    for (const req of feat.gemSockets) {
      rec[req.gemId] = (rec[req.gemId] || 0) + req.count;
    }
    socketedFeatGems[feat.id] = rec;
  }
  return { equippedFeats, socketedFeatGems };
}

// ─── LAYER 3: STATIC MOD SLOTS & WEAPON COMPONENT MOD PARTS ──────────────────
//
// Static Equipment Slots & Sub-Mods:
//   > Head  (Armor = Dome Plate,     Mod 1 = Optics,        Mod 2 = Sensory A,     Mod 3 = Sensory B)
//   > Arms  (Armor = Aperture Plate, Mod 1 = Actuators,     Mod 2 = Structure,     Mod 3 = Integration)
//   > Frame (Armor = Frame Plating,  Mod 1 = Reactor Core,  Mod 2 = Leg Actuators, Mod 3 = Mobility Kit)
//
// Crafted vs. Looted Standalone Rule:
//   - Crafted from Gems (`origin: 'crafted'`): Variable gem cost, at most 1 additional gem slot (`maxGemSlots: 0 | 1`).
//   - Looted / Standalone (`origin: 'looted'`): Found via drops/caches, 1 to 3 gem slots (`maxGemSlots: 1 | 2 | 3`).
//   - Universal Zero-Sum Law: Every stat increase creates a negative draw on another stat, resource cost, or weight (WT).

export const ACTION_MODIFICATION_CATALOG: ActionModificationDefinition[] = [
  // ─── ARMS MOD 2: STRUCTURE (Replaces Melee Mod · targetCategory: 'melee') ───
  {
    id: 'mod_hyper_armor_stance',
    name: 'Magnetic Anchor Structure',
    targetCategory: 'melee',
    slotCategory: 'structure',
    origin: 'crafted',
    maxGemSlots: 1,
    weightDelta: 6,
    gainDescription: '-20% Skill Cooldowns on CQC/Hardware Actions & Hyper-Armor Windup',
    drawbackDescription: '+20% Tell Windup Duration & +6 WT (Crafted: Max 1 Gem Slot)',
    gemCost: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    modifiers: {
      hyperArmorWindup: true,
      cooldownMult: 0.8,
      tellDurationMult: 1.2,
    },
  },
  {
    id: 'mod_structure_crafted_carnelian_bracing',
    name: 'Synthesized Heavy Counterweight Truss',
    targetCategory: 'melee',
    slotCategory: 'structure',
    origin: 'crafted',
    maxGemSlots: 1,
    weightDelta: 10,
    gainDescription: '+14 Stability (S) & Hyper-Armor on Heavy Swings',
    drawbackDescription: '+15% Tell Windup Duration & +10 WT Inertia/Equip Mass (Crafted: Max 1 Gem Slot)',
    gemCost: [{ gemId: 'carnelian', count: 2 }],
    modifiers: {
      hyperArmorWindup: true,
      stabilityBonus: 14,
      tellDurationMult: 1.15,
    },
  },
  {
    id: 'mod_structure_crafted_charoite_flex',
    name: 'Synthesized Phantom Flex-Structure',
    targetCategory: 'melee',
    slotCategory: 'structure',
    origin: 'crafted',
    maxGemSlots: 1,
    weightDelta: -4,
    gainDescription: '-4 WT Ultralight Structure & -12% CQC Skill Cooldowns',
    drawbackDescription: '+3 Reactor Heat Cost per CQC Action (Crafted: Max 1 Gem Slot)',
    gemCost: [{ gemId: 'charoite', count: 1 }],
    modifiers: {
      cooldownMult: 0.88,
      heatCostDelta: 3,
    },
  },
  {
    id: 'mod_structure_looted_pnsy_piledriver',
    name: 'PNSY Piledriver Counter-Torquer Structure',
    targetCategory: 'melee',
    slotCategory: 'structure',
    origin: 'looted',
    maxGemSlots: 2,
    weightDelta: 8,
    gainDescription: '-22% CQC Skill Cooldowns & +10 Stability (S)',
    drawbackDescription: '+18% Tell Windup Duration & +8 WT (Looted Standalone: 2 Gem Slots)',
    gemCost: [],
    modifiers: {
      cooldownMult: 0.78,
      stabilityBonus: 10,
      tellDurationMult: 1.18,
    },
  },
  {
    id: 'mod_structure_looted_camelot_parry_truss',
    name: 'Camelot Chivalric Guard Structure',
    targetCategory: 'melee',
    slotCategory: 'structure',
    origin: 'looted',
    maxGemSlots: 3,
    weightDelta: 9,
    gainDescription: 'Hyper-Armor Windup, +16 Stability (S) & -15% CQC Cooldowns',
    drawbackDescription: '+9 WT Truss Mass & +2 Heat per Action (Looted Standalone: 3 Gem Slots)',
    gemCost: [],
    modifiers: {
      hyperArmorWindup: true,
      stabilityBonus: 16,
      cooldownMult: 0.85,
      heatCostDelta: 2,
    },
  },

  // ─── ARMS MOD 3: INTEGRATION (Replaces Ranged Mod · targetCategory: 'ranged') ─
  {
    id: 'mod_multi_target_lock',
    name: 'Splinter-Lock Targeting Integration',
    targetCategory: 'ranged',
    slotCategory: 'integration',
    origin: 'crafted',
    maxGemSlots: 1,
    weightDelta: 5,
    gainDescription: 'Fires +1 extra splinter projectile per ranged attack',
    drawbackDescription: '+25% Tell Windup Duration & +5 WT (Crafted: Max 1 Gem Slot)',
    gemCost: [
      { gemId: 'kyanite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    modifiers: {
      extraProjectiles: 1,
      tellDurationMult: 1.25,
    },
  },
  {
    id: 'mod_sanctum_vent_coil',
    name: 'Sanctum Harmonic Vent Integration',
    targetCategory: 'all',
    slotCategory: 'integration',
    origin: 'crafted',
    maxGemSlots: 1,
    weightDelta: 4,
    gainDescription: '-15% Active Skill Cooldowns across Weapon Sets',
    drawbackDescription: '+4 Reactor Heat Cost per Action & +4 WT (Crafted: Max 1 Gem Slot)',
    gemCost: [{ gemId: 'moonstone', count: 1 }],
    modifiers: {
      cooldownMult: 0.85,
      heatCostDelta: 4,
    },
  },
  {
    id: 'mod_integration_crafted_spinel_feed',
    name: 'Synthesized Assault Belt-Feed Integration',
    targetCategory: 'ranged',
    slotCategory: 'integration',
    origin: 'crafted',
    maxGemSlots: 1,
    weightDelta: 7,
    gainDescription: '-18% Ranged Cooldowns & +0.5 Light Radius',
    drawbackDescription: '+5 Heat Cost per Ranged Skill & +7 WT Feed Chute (Crafted: Max 1 Gem Slot)',
    gemCost: [
      { gemId: 'spinel', count: 2 },
      { gemId: 'carnelian', count: 1 },
    ],
    modifiers: {
      cooldownMult: 0.82,
      lightDelta: 0.5,
      heatCostDelta: 5,
    },
  },
  {
    id: 'mod_integration_looted_rad_recoil_cradle',
    name: 'RAD Siege Recoil Cradle Integration',
    targetCategory: 'ranged',
    slotCategory: 'integration',
    origin: 'looted',
    maxGemSlots: 2,
    weightDelta: 11,
    gainDescription: '+15 Stability (S) & +1 Extra Projectile on Ranged Skills',
    drawbackDescription: '+20% Tell Windup & +11 WT Heavy Cradle (Looted Standalone: 2 Gem Slots)',
    gemCost: [],
    modifiers: {
      extraProjectiles: 1,
      stabilityBonus: 15,
      tellDurationMult: 1.2,
    },
  },
  {
    id: 'mod_integration_looted_arc_conduit_bus',
    name: 'ARC Prismatic Conduit Integration',
    targetCategory: 'ranged',
    slotCategory: 'integration',
    origin: 'looted',
    maxGemSlots: 3,
    weightDelta: 5,
    gainDescription: '-20% Ranged Skill Cooldowns & +1.0 Light Radius',
    drawbackDescription: '+6 Heat Cost per Ranged Skill & +5 WT (Looted Standalone: 3 Gem Slots)',
    gemCost: [],
    modifiers: {
      cooldownMult: 0.8,
      lightDelta: 1.0,
      heatCostDelta: 6,
    },
  },

  // ─── FRAME MOD 3: MOBILITY KIT (Replaces Mobility Mod · targetCategory: 'mobility') ─
  {
    id: 'mod_phase_thruster',
    name: 'Afterburner Phase Mobility Kit',
    targetCategory: 'mobility',
    slotCategory: 'mobility',
    origin: 'crafted',
    maxGemSlots: 1,
    weightDelta: 4,
    capacityDelta: 10,
    gainDescription: '+0.10s Booster Dash Duration & +10 Load Capacity',
    drawbackDescription: '+8 Booster Heat Cost per Dash & +4 WT (Crafted: Max 1 Gem Slot)',
    gemCost: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    modifiers: {
      extraDashDurationSec: 0.1,
      heatCostDelta: 8,
    },
  },
  {
    id: 'mod_inertial_gyro_telemetry',
    name: 'Inertial Gyro-Telemetry Mobility Kit',
    targetCategory: 'mobility',
    slotCategory: 'mobility',
    origin: 'crafted',
    maxGemSlots: 1,
    weightDelta: 5,
    capacityDelta: 15,
    gainDescription: 'Unlocks live HUD Inertia Telemetry, +12 Stability (S) & +15 Load Capacity',
    drawbackDescription: '+2 Reactor Heat Cost on Dash & +5 WT (Crafted: Max 1 Gem Slot)',
    gemCost: [{ gemId: 'titanite', count: 1 }],
    modifiers: {
      stabilityBonus: 12,
      enableInertiaHudTelemetry: true,
      heatCostDelta: 2,
    },
  },
  {
    id: 'mod_mobility_crafted_carnelian_rig',
    name: 'Synthesized Heavy Hauler Mobility Kit',
    targetCategory: 'mobility',
    slotCategory: 'mobility',
    origin: 'crafted',
    maxGemSlots: 1,
    weightDelta: 12,
    capacityDelta: 35,
    gainDescription: '+35 Total Load Capacity & +14 Stability (S)',
    drawbackDescription: '+12 WT Rig Mass & +4 Booster Heat Cost (Crafted: Max 1 Gem Slot)',
    gemCost: [
      { gemId: 'carnelian', count: 2 },
      { gemId: 'hematite', count: 1 },
    ],
    modifiers: {
      stabilityBonus: 14,
      heatCostDelta: 4,
    },
  },
  {
    id: 'mod_mobility_looted_pnsy_roughrider',
    name: 'PNSY Rough-Rider Mobility Kit',
    targetCategory: 'mobility',
    slotCategory: 'mobility',
    origin: 'looted',
    maxGemSlots: 2,
    weightDelta: 6,
    capacityDelta: 22,
    gainDescription: '+0.12s Dash Duration, +22 Load Capacity & +8 Stability (S)',
    drawbackDescription: '+6 Booster Heat Cost & +6 WT (Looted Standalone: 2 Gem Slots)',
    gemCost: [],
    modifiers: {
      extraDashDurationSec: 0.12,
      stabilityBonus: 8,
      heatCostDelta: 6,
    },
  },
  {
    id: 'mod_mobility_looted_vx_slipstream',
    name: 'VX Slipstream Vector Mobility Kit',
    targetCategory: 'mobility',
    slotCategory: 'mobility',
    origin: 'looted',
    maxGemSlots: 3,
    weightDelta: -5,
    capacityDelta: 14,
    gainDescription: '-5 WT Ultralight Trim, +0.08s Dash & +14 Load Capacity',
    drawbackDescription: '-6 Stability (S) & +4 Booster Heat Cost (Looted Standalone: 3 Gem Slots)',
    gemCost: [],
    modifiers: {
      extraDashDurationSec: 0.08,
      stabilityBonus: -6,
      heatCostDelta: 4,
    },
  },
];

/**
 * Anatomical Weapon & Auxiliary Component Parts (`hilt`, `grip`, `blade`, `head`, `tip`, `focus`, `catalyst`, `actuator`, `sight`).
 * Includes both Crafted parts (`origin: 'crafted'`, variable gem costs, `maxGemSlots: 0 | 1`)
 * and Looted Standalone parts (`origin: 'looted'`, `maxGemSlots: 2 | 3`).
 * Every part enforces the Zero-Sum Stat & Weight Law (`+Gain` vs `-Drawback` & `weightDelta`).
 */
export const WEAPON_COMPONENT_PART_CATALOG: WeaponComponentPartDefinition[] = [
  // ─── HILT (Melee) ──────────────────────────────────────────────────────────
  {
    id: 'wpart_hilt_crafted_carnelian_pommel',
    name: 'Weighted Carnelian Counter-Pommel',
    componentSlot: 'hilt',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [{ gemId: 'carnelian', count: 1 }],
    primaryGemId: 'carnelian',
    gainDescription: '+4 Armor Shred on Hit, +15 Presence & +8 Melee Attack Mass',
    drawbackDescription: '+8 WT (Heavier for Inertia & Equip Load) & +10% Windup',
    weightDelta: 8,
    attackWeightDelta: 8,
  },
  {
    id: 'wpart_hilt_looted_camelot_crossguard',
    name: 'Camelot Reliquary Cross-Hilt',
    componentSlot: 'hilt',
    origin: 'looted',
    maxGemSlots: 2,
    gemCost: [],
    primaryGemId: 'titanite',
    gainDescription: '+15 Max Shield & +4 Shield on Skill Hit',
    drawbackDescription: '+6 WT Crossguard Mass & -4% Move Speed',
    weightDelta: 6,
    attackWeightDelta: 5,
  },
  // ─── GRIP (Melee & Ranged) ─────────────────────────────────────────────────
  {
    id: 'wpart_grip_crafted_charoite_wrap',
    name: 'Ultralight Phantom Grip-Wrap',
    componentSlot: 'grip',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [{ gemId: 'charoite', count: 1 }],
    primaryGemId: 'charoite',
    gainDescription: '+20% Locked/Staggered DMG, +8% Move Speed & -4 WT Equip Load',
    drawbackDescription: '-6 Attack/Inertia Mass (Lighter Impact Impulse)',
    weightDelta: -4,
    attackWeightDelta: -6,
  },
  {
    id: 'wpart_grip_crafted_hematite_heatsink',
    name: 'Alchemic Ichor Heatsink Grip',
    componentSlot: 'grip',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [{ gemId: 'hematite', count: 1 }],
    primaryGemId: 'hematite',
    gainDescription: '-4 Heat per Basic Hit & +4 Armor on Kill',
    drawbackDescription: '+5 WT Dense Grip Core & +8% Skill Cooldowns',
    weightDelta: 5,
    attackWeightDelta: 4,
  },
  {
    id: 'wpart_grip_looted_bwi_recoil_stock',
    name: 'BWI Stabilized Recoil Grip',
    componentSlot: 'grip',
    origin: 'looted',
    maxGemSlots: 2,
    gemCost: [],
    primaryGemId: 'demantoid',
    gainDescription: '-15% Skill Heat Cost & -10% Skill Cooldowns',
    drawbackDescription: '+3 WT Stabilizer Frame & -5% Projectile/Swing Speed',
    weightDelta: 3,
  },
  // ─── BLADE (Melee Blades) ──────────────────────────────────────────────────
  {
    id: 'wpart_blade_crafted_spinel_edge',
    name: 'Thermal Assault Serrated Edge',
    componentSlot: 'blade',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    primaryGemId: 'spinel',
    gainDescription: '+15% Weapon DMG (+22% at ≥50 Heat)',
    drawbackDescription: '+12% Skill Heat Cost & +4 WT Heavy Blade Spine',
    weightDelta: 4,
    attackWeightDelta: 4,
  },
  {
    id: 'wpart_blade_looted_vx_monowire',
    name: 'VX Monomolecular Whisper-Blade',
    componentSlot: 'blade',
    origin: 'looted',
    maxGemSlots: 3,
    gemCost: [],
    primaryGemId: 'charoite',
    gainDescription: '+20% Locked/Staggered DMG, +8% Move Speed & -3 WT',
    drawbackDescription: '-5 Attack Mass (Reduced Knockback Impulse)',
    weightDelta: -3,
    attackWeightDelta: -5,
  },
  // ─── HEAD (Melee Blunt/Axes, Polearms, Shields) ────────────────────────────
  {
    id: 'wpart_head_crafted_carnelian_maul',
    name: 'Siegebreaker Tungsten Strike-Head',
    componentSlot: 'head',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [{ gemId: 'carnelian', count: 2 }],
    primaryGemId: 'carnelian',
    gainDescription: '+4 Armor Shred on Hit, +15 Presence & +12 Attack Mass',
    drawbackDescription: '+10 WT Massive Strike-Head (Increases Inertia & Equip Load)',
    weightDelta: 10,
    attackWeightDelta: 12,
  },
  {
    id: 'wpart_head_looted_rad_pilebunker',
    name: 'RAD Kinetic Pilebunker Head',
    componentSlot: 'head',
    origin: 'looted',
    maxGemSlots: 2,
    gemCost: [],
    primaryGemId: 'carnelian',
    gainDescription: '+4 Armor Shred, +15 Presence & +14 Attack Mass',
    drawbackDescription: '+11 WT Heavy Pilebunker Mass & +12% Tell Windup',
    weightDelta: 11,
    attackWeightDelta: 14,
  },
  // ─── TIP (Polearms & Lances) ───────────────────────────────────────────────
  {
    id: 'wpart_tip_crafted_kyanite_spike',
    name: 'Arclight Condenser Lance-Tip',
    componentSlot: 'tip',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [{ gemId: 'kyanite', count: 1 }],
    primaryGemId: 'kyanite',
    gainDescription: '+15% Reach/Velocity & -12% Skill Cooldowns',
    drawbackDescription: '+8% Skill Heat Cost & +3 WT Tip Condenser',
    weightDelta: 3,
    attackWeightDelta: 2,
  },
  {
    id: 'wpart_tip_looted_avalon_corepiercer',
    name: 'Avalon Core-Piercer Lance Tip',
    componentSlot: 'tip',
    origin: 'looted',
    maxGemSlots: 3,
    gemCost: [],
    primaryGemId: 'spinel',
    gainDescription: '+15% Weapon DMG (+22% ≥50 Heat) & +6 Attack Mass',
    drawbackDescription: '+6 WT Reinforced Lance Tip & +10% Skill Heat Cost',
    weightDelta: 6,
    attackWeightDelta: 6,
  },
  // ─── FOCUS (Beam, Wave, Hybrid, Bows, Shields) ─────────────────────────────
  {
    id: 'wpart_focus_crafted_kyanite_prism',
    name: 'Synthesized Arclight Collimator Focus',
    componentSlot: 'focus',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [
      { gemId: 'kyanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    primaryGemId: 'kyanite',
    gainDescription: '+15% Projectile Speed/Range & -12% Skill Cooldowns',
    drawbackDescription: '+8% Skill Heat Cost & +3 WT Prism Housing',
    weightDelta: 3,
  },
  {
    id: 'wpart_focus_looted_arc_convergence',
    name: 'ARC Convergence Focusing Lens',
    componentSlot: 'focus',
    origin: 'looted',
    maxGemSlots: 3,
    gemCost: [],
    primaryGemId: 'moonstone',
    gainDescription: '+8 Max Shield & -10% Skill Cooldowns',
    drawbackDescription: '+4 WT Lens Array & -5% Raw Impact Mass',
    weightDelta: 4,
  },
  // ─── CATALYST (Bows & Tactical Catalysts) ──────────────────────────────────
  {
    id: 'wpart_catalyst_crafted_rubellite_cell',
    name: 'Volatile Ether Catalyst Cell',
    componentSlot: 'catalyst',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [{ gemId: 'rubellite', count: 1 }],
    primaryGemId: 'rubellite',
    gainDescription: '+12% All Weapon DMG & +1 Max Chain Ammo',
    drawbackDescription: '+10% Skill Heat Cost & +4 WT Catalyst Cell',
    weightDelta: 4,
    projectileWeightDelta: 3,
  },
  {
    id: 'wpart_catalyst_looted_sanc_chalice',
    name: 'Sanctum Reliquary Catalyst Core',
    componentSlot: 'catalyst',
    origin: 'looted',
    maxGemSlots: 2,
    gemCost: [],
    primaryGemId: 'demantoid',
    gainDescription: '-15% Skill Heat Cost & -10% Skill Cooldowns',
    drawbackDescription: '+3 WT Reliquary Core & -5% Projectile Velocity',
    weightDelta: 3,
  },
  // ─── ACTUATOR (Ballistics & Ordnance) ──────────────────────────────────────
  {
    id: 'wpart_actuator_crafted_spinel_rotary',
    name: 'Overclocked Assault Breech Actuator',
    componentSlot: 'actuator',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [{ gemId: 'spinel', count: 1 }],
    primaryGemId: 'spinel',
    gainDescription: '+15% Weapon DMG (+22% at ≥50 Heat)',
    drawbackDescription: '+12% Skill Heat Cost & +5 WT Breech Block',
    weightDelta: 5,
    projectileWeightDelta: 4,
  },
  {
    id: 'wpart_actuator_looted_be_heavy_drum',
    name: 'BE Siege Heavy Drum Actuator',
    componentSlot: 'actuator',
    origin: 'looted',
    maxGemSlots: 3,
    gemCost: [],
    primaryGemId: 'carnelian',
    gainDescription: '+4 Armor Shred on Hit, +15 Presence & +8 Projectile Mass',
    drawbackDescription: '+9 WT Heavy Drum Feed (Increases Recoil & Equip Load)',
    weightDelta: 9,
    projectileWeightDelta: 8,
  },
  // ─── SIGHT (Ranged Ballistics, Beam & Marksman) ────────────────────────────
  {
    id: 'wpart_sight_crafted_charoite_targeter',
    name: 'Phantom Pinpoint Target-Sight',
    componentSlot: 'sight',
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [{ gemId: 'charoite', count: 1 }],
    primaryGemId: 'charoite',
    gainDescription: '+20% Locked/Staggered DMG, +8% Move Speed & -2 WT',
    drawbackDescription: '-4 Projectile Impact Mass',
    weightDelta: -2,
    projectileWeightDelta: -4,
  },
  {
    id: 'wpart_sight_looted_sr_holoscope',
    name: 'Shadowfang Long-Eye Holoscope Sight',
    componentSlot: 'sight',
    origin: 'looted',
    maxGemSlots: 2,
    gemCost: [],
    primaryGemId: 'kyanite',
    gainDescription: '+15% Projectile Speed/Range & -12% Skill Cooldowns',
    drawbackDescription: '+3 WT Scope Mount & +6% Skill Heat Cost',
    weightDelta: 3,
  },
];

/**
 * Returns the 3 canonical anatomical component mod slots for any weapon or auxiliary item:
 * - Melee (`hilt`, `grip`, `blade`, `head`, `tip`)
 * - Ranged / Auxiliary (`grip`, `focus`, `catalyst`, `actuator`, `sight`)
 */
export function getWeaponComponentSlots(
  weaponIdOrName: string | null | undefined
): [WeaponComponentSlotId, WeaponComponentSlotId, WeaponComponentSlotId] {
  if (!weaponIdOrName) return ['grip', 'actuator', 'sight'];
  const { baseId } = parseEquipmentInstanceId(weaponIdOrName);
  switch (baseId) {
    // Melee Blades -> hilt, grip, blade
    case 'long_sword':
    case 'khopesh':
    case 's2_turbine_khopesh':
    case 'tig_edge':
    case 's4_whisper_blade':
    case 's6_phantom_edge':
    case 'grace_edge':
      return ['hilt', 'grip', 'blade'];

    // Melee Blunt & Axes -> hilt, grip, head
    case 'mace':
    case 'hand_axe':
    case 'siegebreaker':
      return ['hilt', 'grip', 'head'];

    // Melee / Hybrid Polearms & Lances -> grip, head, tip
    case 'short_spear':
    case 'avalon_siege_lance':
    case 'ls900_swordspear':
    case 'hl220_lightburst_lance':
    case 'wz200_manacore_staff':
    case 'hallowed_scepter':
      return ['grip', 'head', 'tip'];

    // Ranged 2H Bow -> grip, focus, catalyst
    case 'great_bow':
      return ['grip', 'focus', 'catalyst'];

    // Ranged Beam, Wave & Hybrid -> grip, focus, sight
    case 'gladius_boltcaster':
    case 'rs450_radiant_projector':
    case 'wz800_arclight_cannon':
    case 'wz650_prism_lance':
    case 'cl500_absolution':
    case 'wz450_sparkstrike':
    case 'arc_conductor':
    case 'cl350_litany':
    case 'cl700_sanctifier':
      return ['grip', 'focus', 'sight'];

    // Ranged Ballistics, Ordnance & Quiver -> grip, actuator, sight
    case 'n55_gladius':
    case 'm300_hasta':
    case 'm450_pilum':
    case 'b25_brushcutter':
    case 'm350_mauler':
    case 'ln1200_avalanche':
    case 'lg950_tomahawk':
    case 'sv12_viper':
    case 'sv18_serpent':
    case 'sr440_shadowfang':
    case 'quiver':
      return ['grip', 'actuator', 'sight'];

    // Shields & Bucklers -> grip, head, focus
    case 'buckler_shield':
    case 'heater_shield':
    case 'pavise_shield':
    case 'aegis_charge_buckler':
    case 'aux3_pnsy_rockweiler_buckler':
    case 'aux3_ti_aegis_hardlight':
    case 'aux4_ti_radiant_sphere':
    case 'aux3_arc_prismatic_barrier':
      return ['grip', 'head', 'focus'];

    default: {
      const wDef = getWeaponDefinition(baseId);
      if (wDef?.equipmentRole === 'melee') return ['hilt', 'grip', 'blade'];
      if (wDef?.equipmentRole === 'shield') return ['grip', 'head', 'focus'];
      if (wDef?.equipmentRole === 'catalyst' || isAuxiliaryEquipment(wDef)) {
        return ['grip', 'focus', 'catalyst'];
      }
      return ['grip', 'actuator', 'sight'];
    }
  }
}

const DEFAULT_UTILITY_BY_TRAIT: Record<TraitLine, string> = {
  Warrior: 'utility_ichor_surge',
  Marauder: 'utility_siege_brace',
  Guardian: 'utility_aegis_pulse',
  Rogue: 'utility_phantom_shroud',
  Wizard: 'utility_arclight_capacitor',
  Cleric: 'utility_sanctum_font',
};

export function createStarterGemPouch(
  traitLine: TraitLine = 'Warrior'
): Array<{ itemId: string; count: number }> {
  const [traitGem, reactorGem] = TRAIT_FUNDING_GEMS[traitLine] || ['spinel', 'hematite'];
  const map = new Map<string, number>();
  const setCount = (id: string, c: number) => map.set(id, c);

  // 1 of each Reactor Gem tradition (Moonstone / Rubellite / Hematite)
  setCount('moonstone', 1);
  setCount('rubellite', 1);
  setCount('hematite', 1);
  // 2 of the Pilot's Starting Kit Gem + 2 of the Pilot's Starting Reactor Gem
  setCount(traitGem, 2);
  setCount(reactorGem, 2);

  return Array.from(map.entries()).map(([itemId, count]) => ({ itemId, count }));
}


export function getWeaponSubtypeInfo(weaponId: string): {
  equipmentType: 'Weapon' | 'Auxiliary';
  subtype: string;
} {
  const { baseId } = parseEquipmentInstanceId(weaponId);
  switch (baseId) {
    case 'long_sword':
    case 'khopesh':
    case 's2_turbine_khopesh':
      return { equipmentType: 'Weapon', subtype: 'Melee · Blade' };
    case 'tig_edge':
      return { equipmentType: 'Weapon', subtype: 'Melee · Energy Blade' };
    case 's4_whisper_blade':
    case 's6_phantom_edge':
      return { equipmentType: 'Weapon', subtype: 'Melee · Stealth Dagger / Knife' };
    case 'grace_edge':
      return { equipmentType: 'Weapon', subtype: 'Melee · Consecrated Blade' };
    case 'mace':
    case 'hand_axe':
    case 'siegebreaker':
      return { equipmentType: 'Weapon', subtype: 'Melee · Heavy Battle Axe / Blunt' };
    case 'short_spear':
    case 'avalon_siege_lance':
    case 'ls900_swordspear':
    case 'hl220_lightburst_lance':
    case 'wz200_manacore_staff':
    case 'hallowed_scepter':
      return { equipmentType: 'Weapon', subtype: 'Melee / Hybrid · Polearm & Lance' };
    case 'great_bow':
      return { equipmentType: 'Weapon', subtype: 'Ranged · 2H Bow' };
    case 'gladius_boltcaster':
    case 'n55_gladius':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Bolter' };
    case 'm300_hasta':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Polybolos' };
    case 'm450_pilum':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Heavy Ballista' };
    case 'b25_brushcutter':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Rotary Gatling' };
    case 'm350_mauler':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Grenade Cannon' };
    case 'ln1200_avalanche':
    case 'lg950_tomahawk':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Rocket & Missile System' };
    case 'rs450_radiant_projector':
    case 'wz800_arclight_cannon':
    case 'wz650_prism_lance':
    case 'cl500_absolution':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Beam Projector / Rifle' };
    case 'wz450_sparkstrike':
    case 'arc_conductor':
    case 'cl350_litany':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Pulse Carbine / Pistol' };
    case 'cl700_sanctifier':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Adaptive Hybrid Rifle' };
    case 'sv12_viper':
    case 'sv18_serpent':
      return { equipmentType: 'Weapon', subtype: 'Ranged · SMG / Suppressed Carbine' };
    case 'sr440_shadowfang':
      return { equipmentType: 'Weapon', subtype: 'Ranged · Marksman Rifle' };
    case 'buckler_shield':
    case 'heater_shield':
    case 'pavise_shield':
    case 'aegis_charge_buckler':
    case 'aux3_pnsy_rockweiler_buckler':
      return { equipmentType: 'Auxiliary', subtype: 'Auxiliary · Physical Shield' };
    case 'aux3_ti_aegis_hardlight':
    case 'aux4_ti_radiant_sphere':
    case 'aux3_arc_prismatic_barrier':
    case 'utility_sanctum_font':
      return { equipmentType: 'Auxiliary', subtype: 'Auxiliary · Energy / Ward Shield' };
    case 'quiver':
      return { equipmentType: 'Auxiliary', subtype: 'Auxiliary · Quiver' };
    case 'aether_catalyst':
    case 'utility_ichor_surge':
    case 'aux4_pnsy_rough_rider_booster':
    case 'utility_siege_brace':
    case 'aux3_rad_kinetic_recycling':
    case 'aux4_rad_ether_vapor':
    case 'utility_aegis_pulse':
    case 'utility_phantom_shroud':
    case 'aux3_vx_eclipse_cloak':
    case 'aux4_vx_phase_shift':
    case 'utility_arclight_capacitor':
    case 'aux4_arc_feedback_capacitor':
    case 'aux3_sanc_restoration_field':
    case 'aux4_sanc_martyrdom_plating':
      return { equipmentType: 'Auxiliary', subtype: 'Auxiliary · Tactical Catalyst' };
    default: {
      const wDef = getWeaponDefinition(baseId);
      if (wDef && isAuxiliaryEquipment(wDef)) {
        return { equipmentType: 'Auxiliary', subtype: `Auxiliary · ${wDef.weaponClass || 'System'}` };
      }
      return { equipmentType: 'Weapon', subtype: 'Weapon' };
    }
  }
}

/**
 * Resolves the canonical key for any equipment item (Weapon ID or Hardware ID) while preserving any `::<gems>` suffix.
 */
export function normalizeEquipmentInstanceKey(idOrName: string | null | undefined): string {
  if (!idOrName) return '';
  const { baseId, installedGems, slotGems } = parseEquipmentInstanceId(idOrName);
  const effectiveSlots = slotGems.length > 0 ? slotGems : installedGems;
  const wDef = getWeaponDefinition(baseId);
  if (wDef) {
    return buildEquipmentInstanceId(parseEquipmentInstanceId(wDef.id).baseId, effectiveSlots);
  }
  const hwDef = findHardwareItemByNameOrId(baseId);
  if (hwDef) {
    return buildEquipmentInstanceId(parseEquipmentInstanceId(hwDef.id).baseId, effectiveSlots);
  }
  return buildEquipmentInstanceId(baseId, effectiveSlots);
}

/**
 * Returns the resolved display name for any equipment ID or name (including Gem-modified `+II` / `+III` variants).
 */
export function getEquipmentDisplayName(idOrName: string | null | undefined): string {
  if (!idOrName) return 'None';
  const wDef = getWeaponDefinition(idOrName);
  if (wDef) return wDef.name;
  const hwDef = findHardwareItemByNameOrId(idOrName);
  if (hwDef) return hwDef.name;
  const { baseId, installedGems } = parseEquipmentInstanceId(idOrName);
  return formatModifiedEquipmentName(baseId.replace(/_/g, ' '), installedGems);
}

/**
 * Computes the maximum number of Gem/Component mod slots (`1` to `3`) for any equipment or mod item:
 * - **Weapons & Auxiliaries**: Always `3` named anatomical component slots (`getWeaponComponentSlots(id)`).
 * - **Crafted Mod Parts (`origin === 'crafted'`)**: Strictly capped at `1` additional gem slot (`maxGemSlots: 0 | 1`).
 * - **Looted Standalone Armor & Hardware (`origin === 'looted'`)**: `1` to `3` gem slots depending on the item (`plating`/`reactor` = 3, `head`/`optics`/`arms`/`actuators`/`legs` = 2..3, `sensoryA`/`sensoryB` = 1..2).
 */
export function getEquipmentMaxModSlots(idOrName: string | null | undefined): 1 | 2 | 3 {
  if (!idOrName) return 1;
  const { baseId } = parseEquipmentInstanceId(idOrName);
  const wDef = getWeaponDefinition(baseId);
  if (wDef) {
    return 3;
  }
  const hwDef = findHardwareItemByNameOrId(baseId);
  if (hwDef) {
    if (hwDef.origin === 'crafted') {
      return 1;
    }
    if (typeof hwDef.maxGemSlots === 'number' && hwDef.maxGemSlots >= 1) {
      return Math.min(3, Math.max(1, hwDef.maxGemSlots)) as 1 | 2 | 3;
    }
    if (hwDef.slot === 'plating' || hwDef.slot === 'reactor') return 3;
    if (hwDef.slot === 'sensoryA' || hwDef.slot === 'sensoryB') return 1;
    return 2;
  }
  return 2;
}

const DEFAULT_CANONICAL_HARDWARE_BY_KIT: Record<
  TraitLine,
  {
    head: string;
    headOptics: string;
    sensoryA: string;
    sensoryB: string;
    arms: string;
    armActuators: string;
    legs: string;
    plating: string;
    reactorCore: string;
  }
> = {
  Warrior: {
    head: 'Crystal Dynamics G341 Murmillio',
    headOptics: 'Crystal Dynamics EmberSight Suite',
    sensoryA: 'Federated T7 Sensor Array',
    sensoryB: 'Federated EchoPulse Scanner',
    arms: 'BWI Twinstrike Gauntlets',
    armActuators: 'Crystal Dynamics Striker Vambraces',
    legs: 'BWI Gatecrasher Striders',
    plating: 'BWI Bastion Frame Plating',
    reactorCore: 'PNSY Alchemic Turbine Core Mk.IV',
  },
  Marauder: {
    head: 'BE Ironveil Command Dome',
    headOptics: 'BE Foresight Targeting Array',
    sensoryA: 'NDS ArcPulse Sensor Grid',
    sensoryB: 'NDS EchoStorm Threat Analyzer',
    arms: 'Fire & Ice Line Holder',
    armActuators: 'BE Siegebreaker Stabilizer Servos',
    legs: 'Fire & Ice Outrigger Striders',
    plating: 'Fire & Ice Fortress Frame Plating',
    reactorCore: 'RAD Battleheart Ether Reactor Mk.V',
  },
  Guardian: {
    head: 'Aegis Halo Command Dome',
    headOptics: 'Aegis Radiant Targeting Array',
    sensoryA: 'Solbright Flux Sensor Grid',
    sensoryB: 'Aegis Lightveil Analyzer',
    arms: 'Solbright Cleaver Assemblies',
    armActuators: 'Aegis Radiant Coupler Actuators',
    legs: 'Dawnforge Stabilizer Striders',
    plating: 'Dawnforge Guardian Frame Plating',
    reactorCore: 'TI Manaheart Reactor Mk.IV',
  },
  Rogue: {
    head: 'VX Veilsight Command Helm',
    headOptics: 'Veilsight Targeting Suite',
    sensoryA: 'VX Phantom Network Sensor',
    sensoryB: 'VX Echo-Null Scanner',
    arms: 'Shadowcraft Silencer Gauntlets',
    armActuators: 'VX Whisperblade Micro-Gyros',
    legs: 'Shadowcraft Ghost Striders',
    plating: 'Shadowcraft Recon Frame Plating',
    reactorCore: 'VX Phantom Core Mk.III',
  },
  Wizard: {
    head: 'ARC Omniscient Command Dome',
    headOptics: 'ARC Omniscient Array',
    sensoryA: 'ARC Manaflow Analyzer',
    sensoryB: 'ARC Convergence Predictor',
    arms: 'Arcanum Channeler Assemblies',
    armActuators: 'ARC Prism Refractor Servos',
    legs: 'Arcanum Anchor Striders',
    plating: 'Arcanum Heavy Projector Frame Plating',
    reactorCore: 'ARC Infinite Well Reactor Mk.VI',
  },
  Cleric: {
    head: 'SANC Providence Command Helm',
    headOptics: 'SANC Providence Scanner',
    sensoryA: 'SANC Lifeline Monitor',
    sensoryB: 'SANC Blessing Resonance Grid',
    arms: 'Sanctum Benediction Assemblies',
    armActuators: 'SANC Seraphic Pinion Actuators',
    legs: 'Sanctum Steadfast Striders',
    plating: 'Sanctum Support Frame Plating',
    reactorCore: 'SANC Heartwell Reactor Mk.IV',
  },
};

export function createInitialEquipmentSlots(traitLine: TraitLine = 'Warrior'): OrionEquipmentSlots {
  const trait = TRAIT_REGISTRY[traitLine] || TRAIT_REGISTRY.Warrior;
  const hw = DEFAULT_CANONICAL_HARDWARE_BY_KIT[traitLine] || DEFAULT_CANONICAL_HARDWARE_BY_KIT.Warrior;
  const w1 = trait.startingWeapons?.[0] || 'long_sword';
  const w2 = trait.startingWeapons?.[1] || null;
  const isBowMain = w1 === 'great_bow';
  const defaultAuxBack = isBowMain
    ? w2 || 'quiver'
    : traitLine === 'Guardian'
      ? 'aegis_charge_buckler'
      : traitLine === 'Wizard' || traitLine === 'Cleric'
        ? 'aether_catalyst'
        : traitLine === 'Marauder'
          ? 'heater_shield'
          : traitLine === 'Rogue'
            ? 'short_spear'
            : 'buckler_shield';

  const starterHardwareIds = [
    hw.head,
    hw.headOptics,
    hw.arms,
    hw.armActuators,
    hw.legs,
    hw.plating,
    hw.reactorCore,
    hw.sensoryA,
    hw.sensoryB,
  ].map((name) => findHardwareItemByNameOrId(name)?.id || name);

  const initialCounts: Record<string, number> = { [w1]: 1 };
  if (w2) {
    initialCounts[w2] = (initialCounts[w2] || 0) + 1;
  }
  if (defaultAuxBack) {
    initialCounts[defaultAuxBack] = Math.max(1, initialCounts[defaultAuxBack] || 1);
  }
  for (const hwId of starterHardwareIds) {
    initialCounts[hwId] = 1;
  }

  const hasSide = Boolean(!isBowMain && w2);
  return {
    slot1: w1,
    slot2: isBowMain ? null : w2,
    slot3: defaultAuxBack,
    mainGrip: hasSide ? '1h' : '2h',
    ownedWeaponCounts: initialCounts,
    head: hw.head,
    headOptics: hw.headOptics,
    arms: hw.arms,
    armActuators: hw.armActuators,
    legs: hw.legs,
    plating: hw.plating,
    reactorCore: hw.reactorCore,
    sensoryA: hw.sensoryA,
    sensoryB: hw.sensoryB,
    aux3: null,
    aux4: null,
    utility: DEFAULT_UTILITY_BY_TRAIT[traitLine] || 'utility_ichor_surge',

    weaponSet1: [w1, null],
    weaponSet2: [w2 || '', null],
    aux: [
      'mod_head_optic_scan',
      'mod_torso_reactive_burst',
      'mod_arms_shock_grapple',
      'mod_legs_seismic_stomp',
    ],
    belt: ['demantoid_flask', 'grail_water', 'spinel_flask', 'kyanite_flask'],
    armor: {
      head: hw.head,
      torso: hw.plating,
      arms: hw.arms,
      legs: hw.legs,
      generator: hw.reactorCore,
    },
    installedMods: {},
    installedWeaponComponents: {},
    unlockedMods: [],
    unlockedEquipment: Array.from(
      new Set([
        w1,
        ...(w2 ? [w2] : []),
        ...(defaultAuxBack ? [defaultAuxBack] : []),
        ...starterHardwareIds,
      ])
    ),
    weaponGemMods: {},
  };
}

/**
 * Checks whether any equipment item (weapon, auxiliary, armor, reactor, or sensor) is unlocked/owned by the pilot.
 * When `bypassProgressionGates` is enabled (or in `[-4,0]` Training Room), all items are available.
 */
export function isEquipmentUnlocked(state: OrionState, itemIdOrName: string): boolean {
  if (!itemIdOrName) return false;
  if (state.bypassProgressionGates || state.room === '-4,0') return true;

  const normKey = normalizeEquipmentInstanceKey(itemIdOrName);
  const { baseId: targetBase } = parseEquipmentInstanceId(normKey);
  const eq = state.equipmentSlots;

  const equippedRaw = [
    ...(state.equippedWeapons || []),
    eq?.slot1,
    eq?.slot2,
    eq?.slot3,
    eq?.head,
    eq?.headOptics,
    eq?.arms,
    eq?.armActuators,
    eq?.legs,
    eq?.plating,
    eq?.reactorCore,
    eq?.sensoryA,
    eq?.sensoryB,
  ].filter(Boolean) as string[];

  for (const eqItem of equippedRaw) {
    const eqNorm = normalizeEquipmentInstanceKey(eqItem);
    if (eqNorm === normKey || parseEquipmentInstanceId(eqNorm).baseId === targetBase) {
      return true;
    }
  }

  const unlocked = eq?.unlockedEquipment || [];
  for (const u of unlocked) {
    const uNorm = normalizeEquipmentInstanceKey(u);
    if (uNorm === normKey || parseEquipmentInstanceId(uNorm).baseId === targetBase) {
      return true;
    }
  }

  const counts = eq?.ownedWeaponCounts || {};
  for (const [k, v] of Object.entries(counts)) {
    if (typeof v === 'number' && v > 0) {
      const kNorm = normalizeEquipmentInstanceKey(k);
      if (kNorm === normKey || parseEquipmentInstanceId(kNorm).baseId === targetBase) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns how many copies of a specific equipment instance (`<baseId>` or `<baseId>::<gems>`) the pilot owns.
 */
export function getOwnedWeaponCount(state: OrionState, itemIdOrName: string): number {
  if (!itemIdOrName) return 0;
  if (state.bypassProgressionGates || state.room === '-4,0') return 2;

  const normKey = normalizeEquipmentInstanceKey(itemIdOrName);
  const counts = state.equipmentSlots?.ownedWeaponCounts || {};

  if (typeof counts[normKey] === 'number') {
    return Math.max(0, counts[normKey]);
  }
  if (typeof counts[itemIdOrName] === 'number') {
    return Math.max(0, counts[itemIdOrName]);
  }

  // Check if this exact instance is equipped or in unlockedEquipment
  const eq = state.equipmentSlots;
  const equippedRaw = [
    eq?.slot1,
    eq?.slot2,
    eq?.slot3,
    eq?.head,
    eq?.headOptics,
    eq?.arms,
    eq?.armActuators,
    eq?.legs,
    eq?.plating,
    eq?.reactorCore,
    eq?.sensoryA,
    eq?.sensoryB,
  ].filter(Boolean) as string[];

  const exactEquipped = equippedRaw.some((e) => normalizeEquipmentInstanceKey(e) === normKey);
  const exactUnlocked = (eq?.unlockedEquipment || []).some(
    (u) => normalizeEquipmentInstanceKey(u) === normKey
  );
  return exactEquipped || exactUnlocked ? 1 : 0;
}

/**
 * Returns all distinct owned equipment instance IDs (`baseId` and any `baseId::gem1+gem2` variants)
 * matching a given base weapon or hardware item.
 */
export function getOwnedEquipmentInstances(
  state: OrionState,
  baseIdOrName: string
): string[] {
  const normBase = parseEquipmentInstanceId(normalizeEquipmentInstanceKey(baseIdOrName)).baseId;
  if (!normBase) return [];

  const instances = new Set<string>();
  const eq = state.equipmentSlots;
  const counts = eq?.ownedWeaponCounts || {};

  for (const [rawKey, count] of Object.entries(counts)) {
    if (typeof count === 'number' && count > 0) {
      const kNorm = normalizeEquipmentInstanceKey(rawKey);
      if (parseEquipmentInstanceId(kNorm).baseId === normBase) {
        instances.add(kNorm);
      }
    }
  }

  for (const u of eq?.unlockedEquipment || []) {
    const uNorm = normalizeEquipmentInstanceKey(u);
    if (
      parseEquipmentInstanceId(uNorm).baseId === normBase &&
      getOwnedWeaponCount(state, uNorm) > 0
    ) {
      instances.add(uNorm);
    }
  }

  for (const eqSlot of [
    eq?.slot1,
    eq?.slot2,
    eq?.slot3,
    eq?.head,
    eq?.headOptics,
    eq?.arms,
    eq?.armActuators,
    eq?.legs,
    eq?.plating,
    eq?.reactorCore,
    eq?.sensoryA,
    eq?.sensoryB,
  ]) {
    if (!eqSlot) continue;
    const sNorm = normalizeEquipmentInstanceKey(eqSlot);
    if (parseEquipmentInstanceId(sNorm).baseId === normBase) {
      instances.add(sNorm);
    }
  }

  if (instances.size === 0 && (state.bypassProgressionGates || state.room === '-4,0')) {
    instances.add(normBase);
  }

  return Array.from(instances);
}

/**
 * Installs a Gemstone Mod or Component Mod onto an owned equipment instance (`sourceInstanceId`)
 * in ANY anatomical slot order (`slotIndex: 0 | 1 | 2` or `slotName`), consuming 1 copy of the
 * source item and the required Gemstone(s) from inventory to produce a distinct renamed `Custom`
 * item copy (`Custom <BaseName> [+II/+III]` or `<BaseName> Custom [+II/+III]`).
 * Automatically updates any loadout slot where the last copy of `sourceInstanceId` was equipped.
 */
export function installGemModOnEquipment(
  state: OrionState,
  sourceInstanceId: string,
  gemId: GemId,
  ctx?: { say: (text: string) => void },
  componentMeta?: {
    slotIndex?: number;
    slotName?: WeaponComponentSlotId;
    partDef?: WeaponComponentPartDefinition;
  }
): string | null {
  if (!sourceInstanceId || !isCanonicalGemId(gemId)) return null;
  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  const eq = state.equipmentSlots;
  eq.ownedWeaponCounts = eq.ownedWeaponCounts || {};
  eq.unlockedEquipment = eq.unlockedEquipment || [];
  eq.unlockedMods = eq.unlockedMods || [];
  eq.installedWeaponComponents = eq.installedWeaponComponents || {};

  const normSource = normalizeEquipmentInstanceKey(sourceInstanceId);
  const { baseId, installedGems, slotGems } = parseEquipmentInstanceId(normSource);
  const maxSlots = getEquipmentMaxModSlots(baseId);
  const weaponSlots = getWeaponComponentSlots(baseId);

  // Resolve target slot index (0..maxSlots-1) in any order
  let targetSlotIdx = -1;
  if (
    typeof componentMeta?.slotIndex === 'number' &&
    componentMeta.slotIndex >= 0 &&
    componentMeta.slotIndex < maxSlots
  ) {
    targetSlotIdx = componentMeta.slotIndex;
  } else if (componentMeta?.slotName) {
    const foundIdx = weaponSlots.indexOf(componentMeta.slotName);
    if (foundIdx >= 0 && foundIdx < maxSlots) {
      targetSlotIdx = foundIdx;
    }
  }
  if (targetSlotIdx < 0) {
    for (let i = 0; i < maxSlots; i++) {
      if (!slotGems[i]) {
        targetSlotIdx = i;
        break;
      }
    }
  }

  if (targetSlotIdx < 0) {
    ctx?.say(
      `MAX MOD SLOTS REACHED (${installedGems.length}/${maxSlots}) ON ${getEquipmentDisplayName(normSource).toUpperCase()}`
    );
    return null;
  }

  const sourceCount = getOwnedWeaponCount(state, normSource);
  if (sourceCount <= 0 && !state.bypassProgressionGates && state.room !== '-4,0') {
    ctx?.say(`DO NOT OWN A COPY OF ${getEquipmentDisplayName(normSource).toUpperCase()}`);
    return null;
  }

  const gemDef = GEMSTONE_REGISTRY[gemId];
  const partDef = componentMeta?.partDef;
  if (!state.bypassProgressionGates && state.room !== '-4,0') {
    if (partDef && partDef.origin === 'crafted' && partDef.gemCost.length > 0) {
      for (const req of partDef.gemCost) {
        if (getInventoryGemCount(state, req.gemId) < req.count) {
          const rGem = GEMSTONE_REGISTRY[req.gemId];
          ctx?.say(
            `REQUIRES ${req.count} ${rGem?.name.toUpperCase() || req.gemId} TO CRAFT ${partDef.name.toUpperCase()}`
          );
          return null;
        }
      }
      for (const req of partDef.gemCost) {
        consumeInventoryGem(state, req.gemId, req.count);
      }
    } else if (!partDef) {
      if (!consumeInventoryGem(state, gemId, 1)) {
        ctx?.say(`REQUIRES 1 ${gemDef.name.toUpperCase()} IN INVENTORY TO INSTALL MOD`);
        return null;
      }
    }
  }

  const nextSlotGems: Array<GemId | null> = Array.from(
    { length: maxSlots },
    (_, idx) => slotGems[idx] || null
  );
  nextSlotGems[targetSlotIdx] = gemId;
  const newInstanceId = buildEquipmentInstanceId(baseId, nextSlotGems);
  const nextValidGems = nextSlotGems.filter((g): g is GemId => isCanonicalGemId(g));

  // Preserve and update per-component slot records onto the new instance ID
  const prevCompMap = eq.installedWeaponComponents[normSource] || {};
  const resolvedSlotName =
    componentMeta?.slotName || weaponSlots[targetSlotIdx] || weaponSlots[0];
  eq.installedWeaponComponents[newInstanceId] = {
    ...prevCompMap,
    [resolvedSlotName]: partDef ? partDef.id : `gem_${gemId}`,
  };

  // Consume 1 copy of sourceInstanceId and add 1 copy of newInstanceId
  if (newInstanceId !== normSource) {
    const remainingSource = Math.max(0, (eq.ownedWeaponCounts[normSource] ?? sourceCount) - 1);
    eq.ownedWeaponCounts[normSource] = remainingSource;
    if (eq.ownedWeaponCounts[sourceInstanceId] !== undefined && sourceInstanceId !== normSource) {
      eq.ownedWeaponCounts[sourceInstanceId] = remainingSource;
    }
    if (remainingSource <= 0) {
      eq.unlockedEquipment = eq.unlockedEquipment.filter(
        (u) => normalizeEquipmentInstanceKey(u) !== normSource
      );
    }

    eq.ownedWeaponCounts[newInstanceId] = (eq.ownedWeaponCounts[newInstanceId] || 0) + 1;
    if (!eq.unlockedEquipment.includes(newInstanceId)) {
      eq.unlockedEquipment.push(newInstanceId);
    }

    // If equipped slots reference sourceInstanceId beyond remaining copies, upgrade those slots to newInstanceId
    let usedSourceCopies = 0;
    const upgradeSlotIfMatched = (val: string | null | undefined): string | null | undefined => {
      if (!val) return val;
      if (normalizeEquipmentInstanceKey(val) === normSource) {
        usedSourceCopies += 1;
        if (usedSourceCopies > remainingSource) {
          return newInstanceId;
        }
      }
      return val;
    };

    eq.slot1 = upgradeSlotIfMatched(eq.slot1) ?? null;
    eq.slot2 = upgradeSlotIfMatched(eq.slot2) ?? null;
    eq.slot3 = upgradeSlotIfMatched(eq.slot3) ?? null;
    eq.head = upgradeSlotIfMatched(eq.head) ?? null;
    eq.headOptics = upgradeSlotIfMatched(eq.headOptics) ?? null;
    eq.arms = upgradeSlotIfMatched(eq.arms) ?? null;
    eq.armActuators = upgradeSlotIfMatched(eq.armActuators) ?? null;
    eq.legs = upgradeSlotIfMatched(eq.legs) ?? null;
    eq.plating = upgradeSlotIfMatched(eq.plating) ?? null;
    eq.reactorCore = upgradeSlotIfMatched(eq.reactorCore) ?? null;
    eq.sensoryA = upgradeSlotIfMatched(eq.sensoryA) ?? null;
    eq.sensoryB = upgradeSlotIfMatched(eq.sensoryB) ?? null;

    state.equippedWeapons = (state.equippedWeapons || []).map((w) =>
      normalizeEquipmentInstanceKey(w) === normSource && remainingSource === 0 ? newInstanceId : w
    );
  }

  // Record unlock tag for progression level sync
  const unlockTag = `wpn_gem:${newInstanceId}`;
  if (!eq.unlockedMods.includes(unlockTag)) {
    eq.unlockedMods.push(unlockTag);
  }

  const newDisplayName = getEquipmentDisplayName(newInstanceId);
  const slotTag = ` [SLOT ${targetSlotIdx + 1}: ${resolvedSlotName.toUpperCase()}]`;
  const modLabel = partDef ? partDef.name.toUpperCase() : `${gemDef.name.toUpperCase()} MOD`;
  ctx?.say(
    `INSTALLED ${modLabel}${slotTag} → ${newDisplayName.toUpperCase()} [${nextValidGems.length}/${maxSlots} SLOTS]`
  );
  syncPostTutorialFrameLevel(state, ctx);
  return newInstanceId;
}

/**
 * Removes/unsockets a modification or Gemstone from a specific slot index (`0`, `1`, or `2`)
 * on an equipment instance in the Armory, updating the item instance in inventory and equipped slots.
 */
export function removeGemModFromEquipment(
  state: OrionState,
  sourceInstanceId: string,
  slotIndex: number,
  ctx?: { say: (text: string) => void }
): string | null {
  if (!sourceInstanceId) return null;
  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  const eq = state.equipmentSlots;
  eq.ownedWeaponCounts = eq.ownedWeaponCounts || {};
  eq.unlockedEquipment = eq.unlockedEquipment || [];
  eq.installedWeaponComponents = eq.installedWeaponComponents || {};

  const normSource = normalizeEquipmentInstanceKey(sourceInstanceId);
  const { baseId, slotGems } = parseEquipmentInstanceId(normSource);
  const maxSlots = getEquipmentMaxModSlots(baseId);
  if (slotIndex < 0 || slotIndex >= maxSlots || !slotGems[slotIndex]) {
    return null;
  }

  const removedGem = slotGems[slotIndex];
  const nextSlotGems: Array<GemId | null> = Array.from(
    { length: maxSlots },
    (_, idx) => (idx === slotIndex ? null : slotGems[idx] || null)
  );
  const newInstanceId = buildEquipmentInstanceId(baseId, nextSlotGems);

  const weaponSlots = getWeaponComponentSlots(baseId);
  const targetSlotName = weaponSlots[slotIndex];
  const prevCompMap = { ...(eq.installedWeaponComponents[normSource] || {}) };
  const removedCompId = targetSlotName ? prevCompMap[targetSlotName] : undefined;
  if (targetSlotName) {
    delete prevCompMap[targetSlotName];
  }
  if (Object.keys(prevCompMap).length > 0) {
    eq.installedWeaponComponents[newInstanceId] = prevCompMap;
  }

  // If a raw gem was socketed directly (not a crafted part), refund 1 gem to inventory
  if (removedGem && (!removedCompId || removedCompId.startsWith('gem_'))) {
    refundInventoryGem(state, removedGem, 1);
  }

  const sourceCount = getOwnedWeaponCount(state, normSource);
  const remainingSource = Math.max(0, (eq.ownedWeaponCounts[normSource] ?? sourceCount) - 1);
  eq.ownedWeaponCounts[normSource] = remainingSource;
  if (remainingSource <= 0) {
    eq.unlockedEquipment = eq.unlockedEquipment.filter(
      (u) => normalizeEquipmentInstanceKey(u) !== normSource
    );
  }

  eq.ownedWeaponCounts[newInstanceId] = (eq.ownedWeaponCounts[newInstanceId] || 0) + 1;
  if (!eq.unlockedEquipment.includes(newInstanceId)) {
    eq.unlockedEquipment.push(newInstanceId);
  }

  let usedSourceCopies = 0;
  const downgradeSlotIfMatched = (val: string | null | undefined): string | null | undefined => {
    if (!val) return val;
    if (normalizeEquipmentInstanceKey(val) === normSource) {
      usedSourceCopies += 1;
      if (usedSourceCopies > remainingSource) {
        return newInstanceId;
      }
    }
    return val;
  };

  eq.slot1 = downgradeSlotIfMatched(eq.slot1) ?? null;
  eq.slot2 = downgradeSlotIfMatched(eq.slot2) ?? null;
  eq.slot3 = downgradeSlotIfMatched(eq.slot3) ?? null;
  eq.head = downgradeSlotIfMatched(eq.head) ?? null;
  eq.headOptics = downgradeSlotIfMatched(eq.headOptics) ?? null;
  eq.arms = downgradeSlotIfMatched(eq.arms) ?? null;
  eq.armActuators = downgradeSlotIfMatched(eq.armActuators) ?? null;
  eq.legs = downgradeSlotIfMatched(eq.legs) ?? null;
  eq.plating = downgradeSlotIfMatched(eq.plating) ?? null;
  eq.reactorCore = downgradeSlotIfMatched(eq.reactorCore) ?? null;
  eq.sensoryA = downgradeSlotIfMatched(eq.sensoryA) ?? null;
  eq.sensoryB = downgradeSlotIfMatched(eq.sensoryB) ?? null;

  state.equippedWeapons = (state.equippedWeapons || []).map((w) =>
    normalizeEquipmentInstanceKey(w) === normSource && remainingSource === 0 ? newInstanceId : w
  );

  const newDisplayName = getEquipmentDisplayName(newInstanceId);
  ctx?.say(
    `REMOVED SLOT ${slotIndex + 1} MOD → ${newDisplayName.toUpperCase()}`
  );
  return newInstanceId;
}

/**
 * Grants or requisitions a second separate instance of a weapon so the pilot can enter Dual-Wield Paired Stance.
 */
export function acquireAdditionalWeaponCopy(
  state: OrionState,
  weaponId: string,
  ctx?: { say: (text: string) => void }
): boolean {
  if (!weaponId) return false;
  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  const normKey = normalizeEquipmentInstanceKey(weaponId);
  state.equipmentSlots.ownedWeaponCounts = state.equipmentSlots.ownedWeaponCounts || {};
  const current = getOwnedWeaponCount(state, normKey);
  if (current >= 2) {
    ctx?.say(`ALREADY OWN 2 SEPARATE COPIES OF ${getEquipmentDisplayName(normKey).toUpperCase()}`);
    return false;
  }
  state.equipmentSlots.ownedWeaponCounts[normKey] = 2;
  if (!state.equipmentSlots.unlockedEquipment?.includes(normKey)) {
    state.equipmentSlots.unlockedEquipment = [
      ...(state.equipmentSlots.unlockedEquipment || []),
      normKey,
    ];
  }
  ctx?.say(`ACQUIRED 2ND COPY: ${getEquipmentDisplayName(normKey).toUpperCase()} (PAIRED STANCE READY)`);
  return true;
}

/**
 * Resolves the active Main Hand weapon grip ('1h' or '2h').
 * - Bows (`great_bow`) are designated 2-handed only.
 * - If no Side Hand is equipped (`!slot2`), the Main Hand is automatically 2H.
 */
export function getEffectiveMainGrip(state: OrionState): '1h' | '2h' {
  const slot1 = state.equipmentSlots?.slot1 || state.equippedWeapons?.[0] || 'long_sword';
  if (parseEquipmentInstanceId(slot1).baseId === 'great_bow') return '2h';
  const slot2 = state.equipmentSlots?.slot2 || null;
  if (!slot2) return '2h';
  if (slot2 === slot1 && getOwnedWeaponCount(state, slot1) < 2) return '2h';
  return state.equipmentSlots?.mainGrip === '2h' ? '2h' : '1h';
}

/**
 * Switches Main Hand weapon grip ('1h' <-> '2h') in the Equipment Screen.
 * - Bows (`great_bow`) are designated 2-handed only and cannot switch to 1H.
 * - If no Side Hand is equipped, Main Hand is automatically 2H.
 * - Switching to 2H un-slots Side Hand (moving any distinct Side Hand item into Aux if Aux is empty) so Main Hand is 2H.
 */
export function setMainWeaponGrip(
  state: OrionState,
  grip: '1h' | '2h',
  ctx?: { say: (text: string) => void }
): boolean {
  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  const slot1 = state.equipmentSlots.slot1 || state.equippedWeapons?.[0] || 'long_sword';
  if (parseEquipmentInstanceId(slot1).baseId === 'great_bow' && grip === '1h') {
    ctx?.say('BOWS ARE DESIGNATED 2-HANDED ONLY');
    return false;
  }

  if (grip === '2h') {
    if (
      state.equipmentSlots.slot2 &&
      state.equipmentSlots.slot2 !== slot1 &&
      !state.equipmentSlots.slot3
    ) {
      state.equipmentSlots.slot3 = state.equipmentSlots.slot2;
    }
    state.equipmentSlots.mainGrip = '2h';
    state.equipmentSlots.slot2 = null;
    ctx?.say(
      `TWO-HANDING POWER STANCE: ${getEquipmentDisplayName(slot1).toUpperCase()} (2H)`
    );
    return true;
  }

  // Switching to 1H requires a Side Hand item; if Side Hand is empty but Aux has an item, swap Aux into Side Hand
  if (!state.equipmentSlots.slot2) {
    if (state.equipmentSlots.slot3) {
      state.equipmentSlots.slot2 = state.equipmentSlots.slot3;
      state.equipmentSlots.slot3 = null;
      state.equipmentSlots.mainGrip = '1h';
      ctx?.say(
        `ONE-HANDED GRIP: EQUIPPED ${getEquipmentDisplayName(state.equipmentSlots.slot2).toUpperCase()} IN SIDE HAND`
      );
      return true;
    }
    ctx?.say('NO SIDE HAND EQUIPPED — MAIN HAND IS AUTOMATICALLY 2H');
    return false;
  }

  state.equipmentSlots.mainGrip = '1h';
  ctx?.say(`ONE-HANDED GRIP: ${getEquipmentDisplayName(slot1).toUpperCase()} (1H)`);
  return true;
}

/**
 * Unlocks any weapon, auxiliary, armor, reactor, or sensor into `state.equipmentSlots.unlockedEquipment`.
 * If already unlocked, increments `ownedWeaponCounts` so additional copies can be modified or dual-wielded.
 */
export function unlockEquipmentItem(
  state: OrionState,
  itemIdOrName: string,
  ctx?: { say: (text: string) => void }
): boolean {
  if (!itemIdOrName) return false;
  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  const normKey = normalizeEquipmentInstanceKey(itemIdOrName);
  state.equipmentSlots.unlockedEquipment = state.equipmentSlots.unlockedEquipment || [
    state.equippedWeapons[0] || 'long_sword',
  ];
  state.equipmentSlots.ownedWeaponCounts = state.equipmentSlots.ownedWeaponCounts || {};

  const alreadyOwnedCount = getOwnedWeaponCount(state, normKey);
  const wasNew = !state.equipmentSlots.unlockedEquipment.some(
    (u) => normalizeEquipmentInstanceKey(u) === normKey
  );
  if (wasNew) {
    state.equipmentSlots.unlockedEquipment.push(normKey);
    state.equipmentSlots.ownedWeaponCounts[normKey] = Math.max(1, alreadyOwnedCount || 1);
  } else {
    state.equipmentSlots.ownedWeaponCounts[normKey] = Math.min(
      5,
      (state.equipmentSlots.ownedWeaponCounts[normKey] || 1) + 1
    );
  }

  const wDef = getWeaponDefinition(normKey);
  if (
    wDef &&
    state.equippedWeapons.length < 2 &&
    (state.level >= 2 || !state.tutorialActive || state.bypassProgressionGates) &&
    state.equippedWeapons[0] !== normKey
  ) {
    state.equippedWeapons.push(normKey);
    state.equipmentSlots.weaponSet2 = [normKey, null];
    if (!state.equipmentSlots.slot2 && getEffectiveMainGrip(state) !== '2h') {
      state.equipmentSlots.slot2 = normKey;
    } else if (!state.equipmentSlots.slot3) {
      state.equipmentSlots.slot3 = normKey;
    }
  }

  if (ctx) {
    const label = getEquipmentDisplayName(normKey).toUpperCase();
    ctx.say(
      wasNew
        ? `DISCOVERED GEAR: ${label} UNLOCKED IN SATCHEL`
        : `SALVAGED EXTRA COPY: ${label} (×${state.equipmentSlots.ownedWeaponCounts[normKey]})`
    );
  }
  return wasNew;
}

/**
 * Unlocks the pilot's canonical Weapon Set 2 item (`startingWeapons[1]`) when reaching Level 2
 * (helping/resolving The Poe or salvaging Bedivere `[S]`).
 */
export function unlockLevel2SecondaryWeapon(state: OrionState): string {
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
  const primary = state.equippedWeapons[0] || trait.startingWeapons?.[0] || 'long_sword';
  const secondary =
    trait.startingWeapons?.[1] && trait.startingWeapons[1] !== primary
      ? trait.startingWeapons[1]
      : primary === 'gladius_boltcaster'
        ? 'khopesh'
        : 'gladius_boltcaster';

  if (!isEquipmentUnlocked(state, primary)) {
    unlockEquipmentItem(state, primary);
  }
  if (!isEquipmentUnlocked(state, secondary)) {
    unlockEquipmentItem(state, secondary);
  }

  if (state.equippedWeapons.length === 0) {
    state.equippedWeapons = [primary, secondary];
  } else if (state.equippedWeapons.length === 1) {
    state.equippedWeapons.push(secondary);
  }
  if (state.equipmentSlots) {
    const is2H = getEffectiveMainGrip(state) === '2h';
    state.equipmentSlots.slot1 = state.equippedWeapons[0];
    if (is2H) {
      state.equipmentSlots.slot2 = state.equippedWeapons[0];
      state.equipmentSlots.slot3 = state.equipmentSlots.slot3 || secondary;
    } else {
      state.equipmentSlots.slot2 = state.equippedWeapons[1] || secondary;
    }
    state.equipmentSlots.weaponSet1 = [state.equippedWeapons[0], null];
    state.equipmentSlots.weaponSet2 = [state.equippedWeapons[1] || secondary, null];
  }
  return secondary;
}

export interface WeaponGemCombatModifiers {
  gemId: GemId | null;
  installedGems?: GemId[];
  damageMult: number;
  lockedOrStaggeredDamageMult: number;
  maxShieldBonus: number;
  skillCooldownMult: number;
  skillHeatCostMult: number;
  projectileSpeedMult: number;
  moveSpeedMult: number;
  bonusMaxAmmo: number;
  extraArmorDentOnHit: number;
  presenceGainOnHit: number;
  shieldRestoreOnSkillHit: number;
  heatVentOnBasicHit: number;
  armorRestoreOnKill: number;
  /** Zero-sum physical weight delta (affects both Equip Load and Inertia mass) */
  weightDelta: number;
  /** Zero-sum melee attack mass delta (m_attack) */
  attackWeightDelta: number;
  /** Zero-sum ranged projectile mass delta (m_projectile) */
  projectileWeightDelta: number;
  summaryLabel: string;
}

export const WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS: Record<GemId, string> = {
  moonstone: '+8 Max Shield & -10% Cooldowns (−5% Direct DMG, +2 WT)',
  spinel: '+15% Weapon DMG (+22% ≥50 Heat) (+12% Heat Cost, +4 WT)',
  carnelian: '+4 Armor Shred, +15 Presence & +8 Mass (+10% Windup, +8 WT)',
  titanite: '+15 Max Shield & +4 Shield on Skill Hit (−4% Move SPD, +6 WT)',
  demantoid: '-15% Skill Heat Cost & -10% Cooldowns (−5% Velocity, +2 WT)',
  kyanite: '+15% Projectile Speed/Range & -12% CD (+8% Heat Cost, +2 WT)',
  charoite: '+20% Stagger DMG, +8% Move SPD & −4 WT (−6 Impact Mass)',
  rubellite: '+12% All Weapon DMG & +1 Max Ammo (+10% Heat Cost, +4 WT)',
  hematite: '-4 Heat per Hit & +4 Armor on Kill (+8% Cooldowns, +5 WT)',
};

export const WEAPON_GEM_WEIGHT_DELTA: Record<GemId, number> = {
  moonstone: 2,
  spinel: 4,
  carnelian: 8,
  titanite: 6,
  demantoid: 2,
  kyanite: 2,
  charoite: -4,
  rubellite: 4,
  hematite: 5,
};

/**
 * Resolves the ordered list of installed Gemstones on a weapon/auxiliary instance.
 */
export function getWeaponInstalledGems(
  state: OrionState | undefined,
  weaponId: string
): GemId[] {
  const { baseId, installedGems } = parseEquipmentInstanceId(weaponId);
  if (installedGems.length > 0) {
    return installedGems;
  }
  if (!state) return [];
  const explicit =
    state.equipmentSlots?.weaponGemMods?.[weaponId] ||
    state.equipmentSlots?.weaponGemMods?.[baseId];
  if (explicit && explicit in GEMSTONE_REGISTRY) {
    return [explicit];
  }

  const subtypeInfo = getWeaponSubtypeInfo(baseId);
  const isRanged =
    subtypeInfo.subtype.startsWith('Ranged') ||
    baseId === 'gladius_boltcaster' ||
    baseId === 'great_bow' ||
    baseId === 'quiver' ||
    baseId === 'avalon_siege_lance';
  const installedModId = isRanged
    ? state.equipmentSlots?.installedMods?.ranged
    : state.equipmentSlots?.installedMods?.melee;
  if (installedModId) {
    const mod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === installedModId);
    const firstGem = mod?.gemCost?.[0]?.gemId;
    if (firstGem && firstGem in GEMSTONE_REGISTRY) {
      return [firstGem];
    }
  }
  return [];
}

/**
 * Resolves the primary active Gem modification (`Col 0..8`) for a given weapon/shield/quiver ID.
 * First installed Gem determines the naming convention and visual sprite column.
 */
export function getWeaponActiveGemId(
  state: OrionState | undefined,
  weaponId: string
): GemId | null {
  const gems = getWeaponInstalledGems(state, weaponId);
  return gems[0] || null;
}

/**
 * Computes the stone-specific combat bonus AND zero-sum physical drawbacks for a weapon, shield,
 * or auxiliary modified with 1–3 Gemstones / Component Parts.
 */
export function getWeaponGemCombatModifiers(
  state: OrionState | undefined,
  weaponId?: string
): WeaponGemCombatModifiers {
  const targetWpnId =
    weaponId ||
    state?.equipmentSlots?.slot1 ||
    state?.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const installedGems = getWeaponInstalledGems(state, targetWpnId);
  const gemId = installedGems[0] || null;

  const base: WeaponGemCombatModifiers = {
    gemId,
    installedGems,
    damageMult: 1.0,
    lockedOrStaggeredDamageMult: 1.0,
    maxShieldBonus: 0,
    skillCooldownMult: 1.0,
    skillHeatCostMult: 1.0,
    projectileSpeedMult: 1.0,
    moveSpeedMult: 1.0,
    bonusMaxAmmo: 0,
    extraArmorDentOnHit: 0,
    presenceGainOnHit: 0,
    shieldRestoreOnSkillHit: 0,
    heatVentOnBasicHit: 0,
    armorRestoreOnKill: 0,
    weightDelta: 0,
    attackWeightDelta: 0,
    projectileWeightDelta: 0,
    summaryLabel: 'Unmodified Base Equipment (Col 0)',
  };

  if (installedGems.length === 0) return base;
  base.summaryLabel = installedGems
    .map((g) => WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[g])
    .filter(Boolean)
    .join(' · ');

  for (const g of installedGems) {
    base.weightDelta += WEAPON_GEM_WEIGHT_DELTA[g] ?? 0;
    switch (g) {
      case 'moonstone':
        base.maxShieldBonus += 8;
        base.skillCooldownMult *= 0.9;
        base.damageMult *= 0.95; // Zero-sum drawback: -5% direct damage
        break;
      case 'spinel':
        base.damageMult *= (state?.heat ?? 0) >= 50 ? 1.22 : 1.15;
        base.skillHeatCostMult *= 1.12; // Zero-sum drawback: +12% heat cost
        base.attackWeightDelta += 3;
        break;
      case 'carnelian':
        base.extraArmorDentOnHit += 4;
        base.presenceGainOnHit += 15;
        base.attackWeightDelta += 8; // Heavier for inertia impulse
        base.projectileWeightDelta += 6;
        base.skillCooldownMult *= 1.06; // Zero-sum drawback: heavier swing recovery
        break;
      case 'titanite':
        base.maxShieldBonus += 15;
        base.shieldRestoreOnSkillHit += 4;
        base.moveSpeedMult *= 0.96; // Zero-sum drawback: -4% move speed from heavy barrier mass
        base.attackWeightDelta += 5;
        break;
      case 'demantoid':
        base.skillHeatCostMult *= 0.85;
        base.skillCooldownMult *= 0.9;
        base.projectileSpeedMult *= 0.95; // Zero-sum drawback: -5% velocity
        break;
      case 'kyanite':
        base.projectileSpeedMult *= 1.15;
        base.skillCooldownMult *= 0.88;
        base.skillHeatCostMult *= 1.08; // Zero-sum drawback: +8% skill heat cost
        break;
      case 'charoite':
        base.lockedOrStaggeredDamageMult *= 1.2;
        base.moveSpeedMult *= 1.08;
        base.attackWeightDelta -= 6; // Zero-sum drawback: lighter blade has less raw inertia mass
        base.projectileWeightDelta -= 4;
        break;
      case 'rubellite':
        base.damageMult *= 1.12;
        base.bonusMaxAmmo += 1;
        base.skillHeatCostMult *= 1.1; // Zero-sum drawback: +10% skill heat cost
        base.projectileWeightDelta += 3;
        break;
      case 'hematite':
        base.heatVentOnBasicHit += 4;
        base.armorRestoreOnKill += 4;
        base.skillCooldownMult *= 1.08; // Zero-sum drawback: +8% skill cooldowns
        base.attackWeightDelta += 4;
        break;
    }
  }

  return base;
}

/**
 * Resolves the sprite sheet column (`0..8`), Gem-colored blade trail / projectile VFX palette,
 * and stone-specific combat bonus label for any weapon, shield, or auxiliary.
 */
export function getWeaponGemVisuals(
  state: OrionState,
  weaponId: string
): {
  gemId: GemId | null;
  installedGems: GemId[];
  colIndex: number;
  color: string;
  coreColor: string;
  label: string;
  bonusDescription: string;
} {
  const installedGems = getWeaponInstalledGems(state, weaponId);
  const gemId = installedGems[0] || null;
  if (!gemId) {
    return {
      gemId: null,
      installedGems: [],
      colIndex: 0,
      color: '#e2e8f0',
      coreColor: '#ffffff',
      label: 'BASE (COL 0)',
      bonusDescription: 'Unmodified Base Equipment',
    };
  }
  const gem = GEMSTONE_REGISTRY[gemId];
  if (!gem) {
    return {
      gemId: null,
      installedGems: [],
      colIndex: 0,
      color: '#e2e8f0',
      coreColor: '#ffffff',
      label: 'BASE (COL 0)',
      bonusDescription: 'Unmodified Base Equipment',
    };
  }
  const suffix =
    installedGems.length === 2
      ? ' +II'
      : installedGems.length === 3
        ? ' +III'
        : installedGems.length > 3
          ? ` +${installedGems.length}`
          : '';
  return {
    gemId,
    installedGems,
    colIndex: gem.colIndex,
    color: gem.hexColor,
    coreColor: gem.coreHexColor || gem.hexColor,
    label: `CUSTOM${suffix} (${gem.name.toUpperCase()})`,
    bonusDescription: installedGems
      .map((g) => WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[g])
      .filter(Boolean)
      .join(' · '),
  };
}

/**
 * Installs a Gem modification onto an equipment item (delegating to `installGemModOnEquipment` so a distinct
 * renamed item copy is produced in inventory).
 */
export function modifyWeaponWithGem(
  state: OrionState,
  weaponId: string,
  gemId: GemId | null,
  ctx?: { say: (text: string) => void }
): boolean {
  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  if (gemId === null) {
    state.equipmentSlots.weaponGemMods = state.equipmentSlots.weaponGemMods || {};
    state.equipmentSlots.weaponGemMods[weaponId] = null;
    return true;
  }
  return Boolean(installGemModOnEquipment(state, weaponId, gemId, ctx));
}

// ─── GATING CHAIN, GEM TRANSACTIONS & LOAD CAPACITY CALCULATIONS ─────────────

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

/**
 * Advances Frame Level from 6 up to 20 naturally as the pilot invests Gemstones into
 * Pilot Skills, sockets Feat Nodes, generates Equipment/Weapon Mods, and clears bosses/trials.
 */
export function syncPostTutorialFrameLevel(
  state: OrionState,
  ctx?: { say: (text: string) => void }
): boolean {
  if (!isStandardProgressionUnlocked(state)) return false;

  const skills = normalizePilotSkills(state.pilotSkills, state.traitLine);
  const totalSkillLevelsGained = Math.max(
    0,
    Object.values(skills).reduce((sum, s) => sum + Math.max(0, (s.level || 1) - 1), 0) - 1
  );
  const socketedFeatsCount = Math.max(0, (state.equippedFeats || []).length - 2);
  const unlockedModsList = state.equipmentSlots?.unlockedMods || [];
  const actionModsCount = unlockedModsList.filter((m) => !m.startsWith('wpn_gem:')).length;
  const weaponGemModsCount = unlockedModsList.filter((m) => m.startsWith('wpn_gem:')).length;
  const grailFragments = Number(state.flags?.grail_fragments || 0);
  const ladyDefeatedBonus = state.flags?.lady_of_the_lake_defeated ? 2 : 0;

  const milestonePoints =
    Math.floor((totalSkillLevelsGained + 1) / 2) +
    socketedFeatsCount +
    actionModsCount +
    Math.floor((weaponGemModsCount + 1) / 2) +
    Math.max(0, grailFragments - 1) +
    ladyDefeatedBonus;

  const computedLevel = Math.min(20, 6 + milestonePoints);
  if (computedLevel > state.level) {
    state.level = computedLevel;
    const lvlInfo = LEVEL_UNLOCK_SEQUENCE.find((l) => l.level === state.level);
    if (ctx && lvlInfo) {
      ctx.say(`FRAME LEVEL ${state.level} [${lvlInfo.band.toUpperCase()}]: ${lvlInfo.unlock.toUpperCase()}`);
    }
    return true;
  }
  return false;
}

export function computeUnlockedFeatTiers(
  pilotSkills?: Record<PilotSkillId, PilotSkillProgress>,
  bypass: boolean = false
): FeatTier[] {
  if (bypass) return ['I', 'II', 'III', 'IV', 'V'];
  const skills = normalizePilotSkills(pilotSkills);
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

// [ORION-ANCHOR: PROG-FEAT-SYNERGY]
/**
 * Evaluates whether the pilot's currently equipped loadout satisfies a Feat's hardware requirement.
 * In classless Project Orion, feats are gated ONLY by Pilot Skill Tier + Gemstones + Hardware/Weapon family,
 * never by player class.
 */
export function doesPilotMeetFeatEquipmentRequirement(
  state: OrionState,
  feat: FrameFeatDefinition
): { met: boolean; reason: string } {
  const req = (feat.requiredEquipment || '').trim();
  if (!req || req === '—' || state.bypassProgressionGates) {
    return { met: true, reason: req && req !== '—' ? req : 'Any Loadout' };
  }

  const reqLower = req.toLowerCase();
  if (
    reqLower === 'any loadout' ||
    reqLower.includes('any frame plating') ||
    reqLower.includes('any coreplate') ||
    reqLower.includes('any core frame') ||
    reqLower.includes('any reactor') ||
    reqLower.includes('any weapon') ||
    reqLower.includes('any frame') ||
    reqLower.includes('combined boss fight') ||
    reqLower.includes('three knights trial')
  ) {
    return { met: true, reason: req };
  }

  const eq = state.equipmentSlots;
  const equippedStrings = [
    eq?.slot1 || '',
    eq?.slot2 || '',
    eq?.slot3 || '',
    ...(state.equippedWeapons || []),
    eq?.head || '',
    eq?.arms || '',
    eq?.legs || '',
    eq?.plating || '',
    eq?.reactorCore || '',
    eq?.sensoryA || '',
    eq?.sensoryB || '',
    eq?.aux3 || '',
    eq?.aux4 || '',
    eq?.utility || '',
    state.reactor || '',
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase().replace(/_/g, ' '));

  const hwStats = resolveEquippedHardwareStats(state);
  const effLoad = computeEffectiveLoadCapacity(state.traitLine, state.equippedFeats || [], state);

  const checkSingleClause = (clause: string): boolean => {
    const c = clause.trim();
    if (!c || c === '—' || c === 'any loadout') return true;

    if (c.includes('booster')) {
      return (
        Boolean(state.hasBoosterKit) ||
        equippedStrings.some(
          (s) => s.includes('booster') || s.includes('rough rider') || s.includes('gatecrasher')
        )
      );
    }
    if (c.includes('mana core') || c.includes('mana reactor')) {
      return (
        hwStats.reactorFamily === 'Mana' ||
        equippedStrings.some(
          (s) => s.includes('manaheart') || s.includes('heartwell') || s.includes('mana')
        )
      );
    }
    if (c.includes('support reactor')) {
      return (
        hwStats.reactorFamily === 'Mana' ||
        equippedStrings.some(
          (s) =>
            s.includes('heartwell') ||
            s.includes('manaheart') ||
            s.includes('infinite well') ||
            s.includes('sanctum')
        )
      );
    }
    if (
      c.includes('energy reactor') ||
      c.includes('energy pool') ||
      c.includes('energy overflow')
    ) {
      return (
        hwStats.reactorFamily === 'Ether' ||
        hwStats.reactorFamily === 'Mana' ||
        equippedStrings.some(
          (s) =>
            s.includes('infinite well') ||
            s.includes('phantom core') ||
            s.includes('battleheart') ||
            s.includes('lodestone') ||
            s.includes('shadow capacitor') ||
            s.includes('heartwell') ||
            s.includes('manaheart')
        )
      );
    }
    if (c.includes('overclock core')) {
      return (
        hwStats.reactorFamily === 'Ichor' ||
        equippedStrings.some(
          (s) =>
            s.includes('alchemic turbine') ||
            s.includes('battleheart') ||
            s.includes('lodestone')
        )
      );
    }
    if (
      c.includes('heavy/super-heavy') ||
      c.includes('heavy or super-heavy') ||
      c.includes('heavy frame')
    ) {
      return (
        effLoad === 'heavy' ||
        effLoad === 'superheavy' ||
        equippedStrings.some(
          (s) =>
            s.includes('fortress') ||
            s.includes('dawnforge') ||
            s.includes('bastion') ||
            s.includes('hardened')
        )
      );
    }
    if (c.includes('stabilizer frame')) {
      return equippedStrings.some(
        (s) =>
          s.includes('dawnforge') ||
          s.includes('fortress') ||
          s.includes('sanctum') ||
          s.includes('stabilizer') ||
          s.includes('outrigger') ||
          s.includes('anchor') ||
          s.includes('steadfast')
      );
    }
    if (c.includes('defensive plating')) {
      return (
        hwStats.armorType === 'Reactive' ||
        hwStats.armorType === 'Hardened' ||
        hwStats.armorType === 'Layered' ||
        equippedStrings.some(
          (s) =>
            s.includes('bastion') ||
            s.includes('fortress') ||
            s.includes('dawnforge') ||
            s.includes('martyrdom') ||
            s.includes('kinetic recycling')
        )
      );
    }
    if (c.includes('physical shield')) {
      return equippedStrings.some(
        (s) =>
          s.includes('buckler') ||
          s.includes('heater') ||
          s.includes('pavise') ||
          s.includes('rockweiler')
      );
    }
    if (c.includes('energy shield') || c.includes('radiant sphere')) {
      if (c.includes('radiant sphere')) {
        return equippedStrings.some((s) => s.includes('radiant sphere') || s.includes('hard-light'));
      }
      return (
        state.shields?.type === 'energy' ||
        equippedStrings.some(
          (s) =>
            s.includes('hard-light') ||
            s.includes('radiant sphere') ||
            s.includes('prismatic barrier') ||
            s.includes('feedback loop') ||
            s.includes('radiant ward') ||
            s.includes('aegis') ||
            s.includes('dawnforge') ||
            s.includes('lightwell')
        )
      );
    }
    if (c.includes('shield')) {
      return equippedStrings.some(
        (s) =>
          s.includes('shield') ||
          s.includes('buckler') ||
          s.includes('pavise') ||
          s.includes('heater') ||
          s.includes('barrier') ||
          s.includes('sphere')
      );
    }
    if (c.includes('cloak') || c.includes('stealth')) {
      return equippedStrings.some(
        (s) =>
          s.includes('cloak') ||
          s.includes('eclipse') ||
          s.includes('smoke') ||
          s.includes('phantom') ||
          s.includes('shadowcraft') ||
          s.includes('veilsight')
      );
    }
    if (c.includes('phase-shift')) {
      return equippedStrings.some(
        (s) => s.includes('phase-shift') || s.includes('phase shift') || s.includes('rift anchor')
      );
    }
    if (c.includes('mobility system')) {
      return (
        Boolean(state.hasBoosterKit) ||
        equippedStrings.some(
          (s) =>
            s.includes('booster') ||
            s.includes('phase-shift') ||
            s.includes('rift anchor') ||
            s.includes('ghost striders') ||
            s.includes('gatecrasher')
        )
      );
    }
    if (c.includes('interference launcher')) {
      return equippedStrings.some(
        (s) =>
          s.includes('ether vapor') ||
          s.includes('avalanche') ||
          s.includes('smoke') ||
          s.includes('ironveil')
      );
    }
    if (c.includes('martyrdom')) {
      return equippedStrings.some(
        (s) =>
          s.includes('martyrdom') ||
          s.includes('radiant ward') ||
          s.includes('sanctum')
      );
    }
    if (
      c.includes('support system') ||
      c.includes('support field') ||
      c.includes('buff system') ||
      c.includes('area healing')
    ) {
      return equippedStrings.some(
        (s) =>
          s.includes('restoration') ||
          s.includes('lightwell') ||
          s.includes('repair drone') ||
          s.includes('fathomless') ||
          s.includes('radiant ward') ||
          s.includes('benediction') ||
          s.includes('blessing') ||
          s.includes('litany') ||
          s.includes('absolution') ||
          s.includes('hallowed scepter') ||
          s.includes('sanctum') ||
          s.includes('catalyst') ||
          s.includes('arclight') ||
          s.includes('infinite well')
      );
    }
    if (c.includes('artillery optics')) {
      return equippedStrings.some(
        (s) =>
          s.includes('foresight') ||
          s.includes('omniscient') ||
          s.includes('echostorm') ||
          s.includes('lightveil') ||
          s.includes('convergence') ||
          s.includes('rangefinder')
      );
    }
    if (c.includes('beam weapon') || c.includes('energy weapon')) {
      return equippedStrings.some(
        (s) =>
          s.includes('radiant projector') ||
          s.includes('lightburst lance') ||
          s.includes('tig edge') ||
          s.includes('arclight') ||
          s.includes('prism lance') ||
          s.includes('sparkstrike') ||
          s.includes('manacore') ||
          s.includes('conductor') ||
          s.includes('sanctifier') ||
          s.includes('absolution') ||
          s.includes('litany') ||
          s.includes('swordspear') ||
          s.includes('hallowed scepter') ||
          s.includes('catalyst') ||
          s.includes('phantom') ||
          s.includes('khopesh')
      );
    }
    if (
      c.includes('suppression') ||
      c.includes('intercept') ||
      c.includes('rapid-fire')
    ) {
      return equippedStrings.some(
        (s) =>
          s.includes('brushcutter') ||
          s.includes('mauler') ||
          s.includes('gladius') ||
          s.includes('hasta') ||
          s.includes('viper') ||
          s.includes('serpent') ||
          s.includes('sparkstrike') ||
          s.includes('avalanche') ||
          s.includes('tomahawk')
      );
    }
    if (c.includes('parry')) {
      return equippedStrings.some(
        (s) =>
          s.includes('khopesh') ||
          s.includes('tig edge') ||
          s.includes('whisper blade') ||
          s.includes('phantom edge') ||
          s.includes('grace edge') ||
          s.includes('sword') ||
          s.includes('buckler') ||
          s.includes('shield') ||
          s.includes('swordspear') ||
          s.includes('lance')
      );
    }
    if (c.includes('melee')) {
      return equippedStrings.some(
        (s) =>
          s.includes('sword') ||
          s.includes('khopesh') ||
          s.includes('spear') ||
          s.includes('lance') ||
          s.includes('mace') ||
          s.includes('axe') ||
          s.includes('siegebreaker') ||
          s.includes('tig edge') ||
          s.includes('whisper') ||
          s.includes('phantom edge') ||
          s.includes('staff') ||
          s.includes('scepter') ||
          s.includes('grace edge')
      );
    }
    if (c.includes('heavy weapon')) {
      return equippedStrings.some(
        (s) =>
          s.includes('pilum') ||
          s.includes('brushcutter') ||
          s.includes('avalanche') ||
          s.includes('tomahawk') ||
          s.includes('siegebreaker') ||
          s.includes('lightburst lance') ||
          s.includes('arclight') ||
          s.includes('manacore') ||
          s.includes('avalon')
      );
    }
    if (c.includes('matching') || c.includes('sidearms')) {
      return Boolean(eq?.slot1 && (eq?.slot2 || eq?.slot3));
    }

    const tokens = c
      .split(/[\s/-]+/)
      .filter((t) => t.length >= 3 && !['the', 'and', 'with', 'system', 'module', 'equipped'].includes(t));
    if (tokens.length === 0) return true;
    return equippedStrings.some((eqStr) => tokens.some((tok) => eqStr.includes(tok)));
  };

  // Requirement strings with "+" require all clauses to be satisfied
  const plusClauses = reqLower.split(/\s*\+\s*/);
  const allMet = plusClauses.every((clause) => checkSingleClause(clause));

  if (allMet) {
    return { met: true, reason: req };
  }

  return {
    met: false,
    reason: `Hardware Synergy: ${req}`,
  };
}

export function isFeatNodeAvailable(
  state: OrionState,
  feat: FrameFeatDefinition
): boolean {
  if (state.bypassProgressionGates) return true;
  if (
    feat.id === 'knights_oath' &&
    Boolean(
      state.flags?.knights_oath_earned ||
        state.equippedFeats?.includes('knights_oath') ||
        state.flags?.lady_of_the_lake_defeated
    )
  ) {
    return true;
  }
  const skills = normalizePilotSkills(state.pilotSkills);
  const reqSkillLvl = skills[feat.requiredSkillId]?.level || 1;
  const maxSkillLvl = Math.max(1, ...Object.values(skills).map((s) => s.level));
  return (
    reqSkillLvl >= feat.requiredSkillLevel ||
    maxSkillLvl >= FEAT_TIER_SKILL_THRESHOLDS[feat.tier]
  );
}

export function getInventoryGemCount(state: OrionState, gemId: GemId): number {
  const slot = state.inventorySlots.find((s) => s.itemId === gemId);
  return slot ? slot.count : 0;
}

export function consumeInventoryGem(
  state: OrionState,
  gemId: GemId,
  count: number = 1
): boolean {
  const idx = state.inventorySlots.findIndex((s) => s.itemId === gemId);
  if (idx < 0 || state.inventorySlots[idx].count < count) return false;
  state.inventorySlots[idx].count -= count;
  if (state.inventorySlots[idx].count <= 0) {
    state.inventorySlots.splice(idx, 1);
  }
  return true;
}

export function refundInventoryGem(
  state: OrionState,
  gemId: GemId,
  count: number = 1
): void {
  if (count <= 0) return;
  const existing = state.inventorySlots.find((s) => s.itemId === gemId);
  if (existing) {
    existing.count += count;
  } else {
    state.inventorySlots.push({ itemId: gemId, count });
  }
}

export function getRetainedBuildGemCounts(state: OrionState): Record<GemId, number> {
  const counts: Record<GemId, number> = {
    moonstone: 0,
    spinel: 0,
    carnelian: 0,
    titanite: 0,
    demantoid: 0,
    kyanite: 0,
    charoite: 0,
    rubellite: 0,
    hematite: 0,
  };
  const socketed = state.socketedFeatGems || {};
  for (const featId of state.equippedFeats) {
    const rec = socketed[featId];
    if (!rec) continue;
    for (const [gemId, amt] of Object.entries(rec)) {
      if (gemId in counts && typeof amt === 'number') {
        counts[gemId as GemId] += amt;
      }
    }
  }
  return counts;
}

/**
 * GEM USE 1 — PILOT SKILL LEVEL (Gems Permanently Consumed):
 * Consumes 1 assigned Discipline Gem or Reactor Gem from inventory to raise a Combat Discipline Skill level (1–20).
 * Unlocking skill levels opens the 5 Feat Tiers (I–V) and Feat Node availability.
 */
export function fundPilotSkillWithGem(
  state: OrionState,
  skillId: PilotSkillId,
  gemId: GemId,
  ctx?: { say: (text: string) => void }
): boolean {
  state.pilotSkills = normalizePilotSkills(state.pilotSkills);
  const skill = state.pilotSkills[skillId];
  if (!skill) return false;

  if (!isStandardProgressionUnlocked(state)) {
    ctx?.say(
      'PILOT SKILL LEVELING LOCKED UNTIL TUTORIAL CLEARED (LV 6) OR BYPASS ENABLED'
    );
    return false;
  }

  if (skill.level >= 20) {
    ctx?.say(`${skill.name.toUpperCase()} IS AT LEVEL 20 CAP`);
    return false;
  }

  const validGems = TRAIT_FUNDING_GEMS[skillId] || [];
  if (!validGems.includes(gemId)) {
    ctx?.say(
      `${GEMSTONE_REGISTRY[gemId]?.name.toUpperCase() || gemId} DOES NOT FUND ${skill.name.toUpperCase()}`
    );
    return false;
  }

  if (!consumeInventoryGem(state, gemId, 1)) {
    ctx?.say(
      `REQUIRES 1 ${GEMSTONE_REGISTRY[gemId]?.name.toUpperCase()} IN SATCHEL`
    );
    return false;
  }

  const prevTiers = computeUnlockedFeatTiers(state.pilotSkills, false);
  skill.level += 1;
  skill.gemsInvested = (skill.gemsInvested || 0) + 1;
  const nextTiers = computeUnlockedFeatTiers(state.pilotSkills, false);

  const newlyOpenedTier = nextTiers.find((t) => !prevTiers.includes(t));
  const gemName = GEMSTONE_REGISTRY[gemId]?.name || gemId;

  if (newlyOpenedTier) {
    ctx?.say(
      `CONSUMED 1 ${gemName.toUpperCase()} → ${skill.name.toUpperCase()} LV ${skill.level} · FEAT TIER ${newlyOpenedTier} UNLOCKED!`
    );
  } else {
    ctx?.say(
      `CONSUMED 1 ${gemName.toUpperCase()} → ${skill.name.toUpperCase()} LV ${skill.level}/20`
    );
  }
  syncPostTutorialFrameLevel(state);
  return true;
}

export const FEAT_TIER_MAX_SLOTS: Record<FeatTier, number> = {
  I: 6,
  II: 5,
  III: 4,
  IV: 3,
  V: 2,
};

export function getEquippedFeatCountByTier(state: OrionState, tier: FeatTier): number {
  let count = 0;
  for (const id of state.equippedFeats || []) {
    const f = FRAME_FEAT_CATALOG.find((item) => item.id === id);
    if (f?.tier === tier) count += 1;
  }
  return count;
}

/**
 * Structured stat breakdown for the pilot's derived Light stat (in tiles; base 5 = half one screen).
 */
export interface PlayerLightStatBreakdown {
  baseLight: number;
  featBonus: number;
  hardwareAndItemBonus: number;
  skillAndSpellBonus: number;
  effectiveLight: number;
}

/**
 * Computes the player's derived Light stat breakdown from base Light (`5.0` tiles) plus
 * Feats, Hardware/Weapons/Items (e.g. Head Optics, Poe Lantern, Sensory Arrays), and active Skills/Spells.
 * Does not mutate `state: OrionState`.
 */
export function computePlayerLightStatBreakdown(
  state: OrionState
): PlayerLightStatBreakdown {
  const baseLight =
    typeof state.baseLight === 'number' && state.baseLight > 0 ? state.baseLight : 5;

  // 1. Feats & Action Modifications
  let featBonus = 0;
  for (const id of state.equippedFeats || []) {
    const f = FRAME_FEAT_CATALOG.find((item) => item.id === id);
    if (!f) continue;
    if (typeof f.modifiers?.lightDelta === 'number') {
      featBonus += f.modifiers.lightDelta;
    } else if (f.synergyCategory === 'Optics & Support') {
      featBonus += 0.5;
    }
  }
  const installedMods = state.equipmentSlots?.installedMods || {};
  for (const modId of Object.values(installedMods)) {
    const mod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === modId);
    if (typeof mod?.modifiers?.lightDelta === 'number') {
      featBonus += mod.modifiers.lightDelta;
    }
  }

  // 2. Hardware, Weapons & Relics / Items (Head Optics, Sensory Arrays, Weapons, Poe Lantern)
  const hwStats = resolveEquippedHardwareStats(state);
  const hasUnlockedOpticsHead =
    (state.level >= 3 || Boolean(state.bypassProgressionGates)) &&
    Boolean(state.flags?.optics_boost_enabled);
  const hasLantern = Boolean(
    state.flags?.poe_lantern_gift || state.flags?.poe_state === 'helped'
  );
  let weaponAndItemBonus = 0;
  for (const slotId of [
    state.equipmentSlots?.slot1,
    state.equipmentSlots?.slot2,
    state.equipmentSlots?.slot3,
    state.equipmentSlots?.utility,
  ]) {
    if (!slotId) continue;
    const wDef = getWeaponDefinition(slotId);
    if (typeof wDef?.passiveLightBonus === 'number') {
      weaponAndItemBonus += wDef.passiveLightBonus;
    }
    const iDef = getItemDefinition(slotId);
    if (typeof iDef?.lightBonus === 'number') {
      weaponAndItemBonus += iDef.lightBonus;
    }
  }

  const hardwareAndItemBonus =
    hwStats.hardwareLightBonus +
    (hasUnlockedOpticsHead ? 0.5 : 0) +
    (hasLantern ? 1.0 : 0) +
    weaponAndItemBonus;

  // 3. Active Skills, Spells & Temporary Buffs
  const isOpticPulseActive = (state.opticMarkTimer || 0) > 0;
  const activeSpellBuff =
    (state.lightBuffTimer || 0) > 0 && typeof state.lightBuffDelta === 'number'
      ? state.lightBuffDelta
      : 0;
  const skillAndSpellBonus = (isOpticPulseActive ? 1.5 : 0) + activeSpellBuff;

  const totalTiles =
    baseLight + featBonus + hardwareAndItemBonus + skillAndSpellBonus;

  return {
    baseLight: Number(baseLight.toFixed(2)),
    featBonus: Number(featBonus.toFixed(2)),
    hardwareAndItemBonus: Number(hardwareAndItemBonus.toFixed(2)),
    skillAndSpellBonus: Number(skillAndSpellBonus.toFixed(2)),
    effectiveLight: Math.max(1, Number(totalTiles.toFixed(2))),
  };
}

/**
 * Computes the player's effective Light stat in tiles (base 5 = half one screen),
 * modified by Feats, Hardware, Items, Skills, and Spells. Does not mutate `state: OrionState`.
 */
export function computeEffectivePlayerLightTiles(state: OrionState): number {
  return computePlayerLightStatBreakdown(state).effectiveLight;
}

/**
 * Applies a delta to the player's base Light stat (used by effects or sandbox tools).
 * Mutates `state: OrionState` (`state.baseLight`).
 */
export function adjustPlayerBaseLight(state: OrionState, delta: number): number {
  const current = typeof state.baseLight === 'number' && state.baseLight > 0 ? state.baseLight : 5;
  const next = Math.max(1, Math.min(12, Number((current + delta).toFixed(1))));
  state.baseLight = next;
  return next;
}

/**
 * Applies a delta to the enemy base Light / vision radius stat.
 * Mutates `state: OrionState` (`state.enemyBaseLight` and active enemy `visionRadiusTiles`).
 */
export function adjustEnemyBaseLight(state: OrionState, delta: number): number {
  const current =
    typeof state.enemyBaseLight === 'number' && state.enemyBaseLight > 0
      ? state.enemyBaseLight
      : 5;
  const next = Math.max(1, Math.min(12, Number((current + delta).toFixed(1))));
  state.enemyBaseLight = next;
  for (const e of state.enemies || []) {
    e.visionRadiusTiles = next;
  }
  return next;
}

/**
 * GEM USE 2 — FEAT NODE SOCKETING (Gems Removed from Inventory, Retained in Build, Refunded on Unsocket):
 * Installing the required Discipline + Reactor Gems unlocks and activates the Feat Node.
 * Unsocketing the Feat Node returns all retained gems back to the player's inventory.
 * Enforces Per-Tier Feat Limits: Tier I: 6, Tier II: 5, Tier III: 4, Tier IV: 3, Tier V: 2.
 */
export function toggleFeatNodeGemSocket(
  state: OrionState,
  featId: string,
  ctx?: { say: (text: string) => void }
): boolean {
  const feat = FRAME_FEAT_CATALOG.find((f) => f.id === featId);
  if (!feat) return false;

  state.socketedFeatGems = state.socketedFeatGems || {};
  const isEquipped = state.equippedFeats.includes(feat.id);

  // Unsocket: deactivate node and refund retained gems back to inventory
  if (isEquipped) {
    state.equippedFeats = state.equippedFeats.filter((id) => id !== feat.id);
    const retained = state.socketedFeatGems[feat.id];
    const refundedLabels: string[] = [];
    if (retained) {
      for (const [gId, count] of Object.entries(retained)) {
        if (typeof count === 'number' && count > 0) {
          refundInventoryGem(state, gId as GemId, count);
          refundedLabels.push(
            `${count} ${GEMSTONE_REGISTRY[gId as GemId]?.name || gId}`
          );
        }
      }
      delete state.socketedFeatGems[feat.id];
    }
    ctx?.say(
      refundedLabels.length > 0
        ? `UNSOCKETED ${feat.name.toUpperCase()} · REFUNDED ${refundedLabels.join(' + ').toUpperCase()}`
        : `DEACTIVATED ${feat.name.toUpperCase()}`
    );
    return true;
  }

  if (!isStandardProgressionUnlocked(state)) {
    ctx?.say(
      'FEAT NODE SOCKETING LOCKED UNTIL LEVEL 6 (BORDER TOWN COMPLETE) OR BYPASS'
    );
    return false;
  }

  // Enforce per-tier feat limit (Tier I: 6, II: 5, III: 4, IV: 3, V: 2)
  const tierCap = FEAT_TIER_MAX_SLOTS[feat.tier] ?? 6;
  const currentTierCount = getEquippedFeatCountByTier(state, feat.tier);
  if (currentTierCount >= tierCap) {
    ctx?.say(
      `TIER ${feat.tier} FEAT LIMIT REACHED (${currentTierCount}/${tierCap}) — UNSOCKET A TIER ${feat.tier} FEAT FIRST`
    );
    return false;
  }

  // Socket: check skill/tier availability first
  if (!isFeatNodeAvailable(state, feat)) {
    const skillDef = PILOT_SKILL_DEFINITIONS.find((s) => s.id === feat.requiredSkillId);
    const skillLabel = skillDef ? skillDef.name.toUpperCase() : 'PILOT SKILL';
    ctx?.say(
      `FEAT NODE LOCKED: REQUIRES ${skillLabel} LV ${feat.requiredSkillLevel} (TIER ${feat.tier})`
    );
    return false;
  }

  // Check if player has all required Gems in inventory
  const missing: string[] = [];
  for (const req of feat.gemSockets) {
    const have = getInventoryGemCount(state, req.gemId);
    if (have < req.count) {
      const gDef = GEMSTONE_REGISTRY[req.gemId];
      missing.push(`${req.count} ${gDef?.name || req.gemId}`);
    }
  }

  if (missing.length > 0) {
    ctx?.say(`MISSING SOCKET GEMS: ${missing.join(' + ').toUpperCase()}`);
    return false;
  }

  // Remove from inventory and retain in build under socketedFeatGems[feat.id]
  const socketRecord: Partial<Record<GemId, number>> = {};
  const socketedLabels: string[] = [];
  for (const req of feat.gemSockets) {
    consumeInventoryGem(state, req.gemId, req.count);
    socketRecord[req.gemId] = (socketRecord[req.gemId] || 0) + req.count;
    socketedLabels.push(`${req.count} ${GEMSTONE_REGISTRY[req.gemId]?.name || req.gemId}`);
  }

  state.socketedFeatGems[feat.id] = socketRecord;
  state.equippedFeats = [...state.equippedFeats, feat.id];
  const hwStatus = doesPilotMeetFeatEquipmentRequirement(state, feat);
  ctx?.say(
    `SOCKETED ${socketedLabels.join(' + ').toUpperCase()} → ${feat.name.toUpperCase()} ACTIVE [TIER ${feat.tier}: ${currentTierCount + 1}/${tierCap}]${hwStatus.met ? '' : ` (${hwStatus.reason.toUpperCase()})`}`
  );
  syncPostTutorialFrameLevel(state);
  return true;
}

/**
 * GEM USE 3 — EQUIPMENT MOD GENERATION (Gems Spent; Mod Retained, Gems Are Not):
 * Spends 1–2 Gems from inventory to permanently generate an Equipment Mod in `unlockedMods`.
 */
export function generateEquipmentModWithGems(
  state: OrionState,
  modId: string,
  ctx?: { say: (text: string) => void }
): boolean {
  const mod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === modId);
  if (!mod) return false;

  if (!isStandardProgressionUnlocked(state)) {
    ctx?.say(
      'EQUIPMENT MOD GENERATION LOCKED UNTIL LEVEL 6 (BORDER TOWN COMPLETE) OR BYPASS'
    );
    return false;
  }

  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  state.equipmentSlots.unlockedMods = state.equipmentSlots.unlockedMods || [];

  if (state.equipmentSlots.unlockedMods.includes(mod.id)) {
    ctx?.say(`${mod.name.toUpperCase()} ALREADY GENERATED & RETAINED`);
    return false;
  }

  const missing: string[] = [];
  for (const req of mod.gemCost) {
    const have = getInventoryGemCount(state, req.gemId);
    if (have < req.count) {
      const gDef = GEMSTONE_REGISTRY[req.gemId];
      missing.push(`${req.count} ${gDef?.name || req.gemId}`);
    }
  }

  if (missing.length > 0) {
    ctx?.say(`REQUIRES ${missing.join(' + ').toUpperCase()} TO GENERATE MOD`);
    return false;
  }

  const spentLabels: string[] = [];
  for (const req of mod.gemCost) {
    consumeInventoryGem(state, req.gemId, req.count);
    spentLabels.push(`${req.count} ${GEMSTONE_REGISTRY[req.gemId]?.name || req.gemId}`);
  }

  state.equipmentSlots.unlockedMods.push(mod.id);
  ctx?.say(
    `SPENT ${spentLabels.join(' + ').toUpperCase()} → GENERATED & RETAINED ${mod.name.toUpperCase()}`
  );
  syncPostTutorialFrameLevel(state);
  return true;
}


export function computeEffectiveLoadCapacity(
  traitLine: TraitLine,
  equippedFeats: string[],
  state?: OrionState
): FrameLoadCapacity {
  const trait = TRAIT_REGISTRY[traitLine] || TRAIT_REGISTRY.Warrior;
  const coreplate = state ? findHardwareItemByNameOrId(state.equipmentSlots?.plating) : undefined;
  const baseLoad: FrameLoadCapacity =
    coreplate?.baseLoadCapacity || trait.weightClass || 'medium';
  const baseIdx = Math.max(0, LOAD_ORDER.indexOf(baseLoad));

  let steps = 0;
  for (const featId of equippedFeats) {
    const feat = FRAME_FEAT_CATALOG.find((f) => f.id === featId);
    if (feat && feat.loadStepUp) {
      steps += feat.loadStepUp;
    }
  }

  const finalIdx = Math.min(LOAD_ORDER.length - 1, baseIdx + steps);
  return LOAD_ORDER[finalIdx];
}

export interface PlayerLoadMetrics {
  equippedWeight: number;
  maxCapacity: number;
  loadPct: number;
  loadBracket: LoadBracket;
  breakdown: {
    headWeight: number;
    armsWeight: number;
    frameWeight: number;
    weaponsWeight: number;
    baseFrameCapacity: number;
    frameModsCapacity: number;
    featsCapacity: number;
  };
}

/**
 * Computes the physical Equip Weight (`WT`) of any Weapon or Auxiliary instance,
 * including weight deltas from installed Gemstones and named Weapon Component Parts.
 */
export function getWeaponInstanceEquipWeight(
  weaponInstanceId: string | null | undefined,
  state?: OrionState
): number {
  if (!weaponInstanceId) return 0;
  const wDef = getWeaponDefinition(weaponInstanceId);
  if (!wDef) return 0;
  const baseClass = wDef.weightClass || 'medium';
  const baseWt =
    baseClass === 'heavy' ? 18 : baseClass === 'light' ? 4 : 10;
  const { installedGems } = parseEquipmentInstanceId(weaponInstanceId);
  let delta = 0;
  for (const g of installedGems) {
    delta += WEAPON_GEM_WEIGHT_DELTA[g] ?? 0;
  }
  const compMap = state?.equipmentSlots?.installedWeaponComponents?.[weaponInstanceId];
  if (compMap) {
    for (const partId of Object.values(compMap)) {
      const partDef = WEAPON_COMPONENT_PART_CATALOG.find((p) => p.id === partId);
      if (partDef) {
        // Adjust difference between part's explicit weightDelta and its primaryGemId baseline
        delta += partDef.weightDelta - (WEAPON_GEM_WEIGHT_DELTA[partDef.primaryGemId] ?? 0);
      }
    }
  }
  return Math.max(2, baseWt + delta);
}

/**
 * Computes the player's Total Weight Capacity (defined by Frame Plating + Frame Mods 1–3 + System Feats),
 * Total Equipped Weight (Head + Arms + Frame + Weapons/Mods), and Load Percentage Bracket:
 * - `0–30%` = `'light'`
 * - `31–65%` = `'medium'`
 * - `66–100%` = `'heavy'`
 * - `>100%` = `'overloaded'`
 */
export function computePlayerLoadMetrics(state: OrionState): PlayerLoadMetrics {
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
  const eq = state.equipmentSlots;

  // 1. Frame Load Capacity (Frame Plating + Frame Mod 1 Reactor + Frame Mod 2 Legs + Frame Mod 3 Mobility Kit + Feats)
  const platingItem = findHardwareItemByNameOrId(eq?.plating);
  const reactorItem = findHardwareItemByNameOrId(eq?.reactorCore);
  const legsItem = findHardwareItemByNameOrId(eq?.legs);
  const mobilityMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === eq?.installedMods?.mobility
  );

  const baseLoadClass: FrameLoadCapacity =
    platingItem?.baseLoadCapacity || trait.weightClass || 'medium';
  const baseFrameCapacity =
    baseLoadClass === 'superheavy'
      ? 140
      : baseLoadClass === 'heavy'
        ? 112
        : baseLoadClass === 'light'
          ? 84
          : 90;

  const frameModsCapacity =
    getHardwareCapacityBonus(reactorItem) +
    getHardwareCapacityBonus(legsItem) +
    (mobilityMod?.capacityDelta ?? 0) +
    (platingItem?.capacityBonus ?? 0);

  let featsCapacity = 0;
  for (const featId of state.equippedFeats || []) {
    const feat = FRAME_FEAT_CATALOG.find((f) => f.id === featId);
    if (feat?.loadStepUp) {
      featsCapacity += feat.loadStepUp * 22;
    }
  }

  const maxCapacity = Math.max(60, baseFrameCapacity + frameModsCapacity + featsCapacity);

  // 2. Equipped Weight (Head + Arms + Frame + Weapons)
  const headItem = findHardwareItemByNameOrId(eq?.head);
  const opticsItem = findHardwareItemByNameOrId(eq?.headOptics);
  const sensoryAItem = findHardwareItemByNameOrId(eq?.sensoryA);
  const sensoryBItem = findHardwareItemByNameOrId(eq?.sensoryB);
  const headWeight =
    (headItem ? getHardwareBaseWeight(headItem) : 10) +
    (opticsItem ? getHardwareBaseWeight(opticsItem) : 0) +
    (sensoryAItem ? getHardwareBaseWeight(sensoryAItem) : 0) +
    (sensoryBItem ? getHardwareBaseWeight(sensoryBItem) : 0);

  const armsItem = findHardwareItemByNameOrId(eq?.arms);
  const actuatorsItem = findHardwareItemByNameOrId(eq?.armActuators);
  const structureMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === eq?.installedMods?.melee
  );
  const integrationMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === eq?.installedMods?.ranged
  );
  const armsWeight =
    (armsItem ? getHardwareBaseWeight(armsItem) : 14) +
    (actuatorsItem ? getHardwareBaseWeight(actuatorsItem) : 0) +
    (structureMod?.weightDelta ?? 0) +
    (integrationMod?.weightDelta ?? 0);

  const frameWeight =
    (platingItem ? getHardwareBaseWeight(platingItem) : 24) +
    (reactorItem ? getHardwareBaseWeight(reactorItem) : 12) +
    (legsItem ? getHardwareBaseWeight(legsItem) : 12) +
    (mobilityMod?.weightDelta ?? 0);

  const slot1Id = eq?.slot1 || state.equippedWeapons?.[0] || null;
  const slot2Id = eq?.slot2 || null;
  const slot3Id = eq?.slot3 || null;

  const w1Weight = getWeaponInstanceEquipWeight(slot1Id, state);
  const w2Weight =
    slot2Id && slot2Id !== slot1Id ? getWeaponInstanceEquipWeight(slot2Id, state) : 0;
  const w3Weight =
    slot3Id && slot3Id !== slot1Id && slot3Id !== slot2Id
      ? Math.round(getWeaponInstanceEquipWeight(slot3Id, state) * 0.5)
      : 0;
  const weaponsWeight = w1Weight + w2Weight + w3Weight;

  const equippedWeight = Math.max(
    15,
    Math.round(headWeight + armsWeight + frameWeight + weaponsWeight)
  );
  const loadPct = Math.max(1, Math.round((equippedWeight / maxCapacity) * 100));

  const loadBracket: LoadBracket =
    loadPct <= 30
      ? 'light'
      : loadPct <= 65
        ? 'medium'
        : loadPct <= 100
          ? 'heavy'
          : 'overloaded';

  return {
    equippedWeight,
    maxCapacity,
    loadPct,
    loadBracket,
    breakdown: {
      headWeight,
      armsWeight,
      frameWeight,
      weaponsWeight,
      baseFrameCapacity,
      frameModsCapacity,
      featsCapacity,
    },
  };
}

/**
 * Percentage-Based Load Limit Penalty Table:
 * - `0–30%` = Light (`mobilityMult: 1.08`, `heatMult: 0.9`, `swapTimeMult: 0.9`)
 * - `31–65%` = Medium (`mobilityMult: 1.0`, `heatMult: 1.0`, `swapTimeMult: 1.0`)
 * - `66–100%` = Heavy (`mobilityMult: 0.9`, `heatMult: 1.12`, `swapTimeMult: 1.18`)
 * - `>100%` = Overloaded (`mobilityMult: 0.65`, `heatMult: 1.35`, `swapTimeMult: 1.45`, `stealthBroken: true`)
 */
export function computeLoadPenalty(
  frameLoad: FrameLoadCapacity,
  weaponWeight: WeaponWeightClass,
  state?: OrionState
): LoadPenaltySummary {
  if (state) {
    const metrics = computePlayerLoadMetrics(state);
    const { equippedWeight, maxCapacity, loadPct, loadBracket } = metrics;
    if (loadBracket === 'light') {
      return {
        frameLoad,
        weaponWeight,
        equippedWeight,
        maxCapacity,
        loadPct,
        loadBracket,
        mobilityMult: 1.08,
        heatMult: 0.9,
        swapTimeMult: 0.9,
        accuracyMult: 1.02,
        stealthBroken: false,
        label: `LIGHT LOAD (${loadPct}% · ${equippedWeight}/${maxCapacity} WT): SPD +8%, HEAT -10%`,
      };
    }
    if (loadBracket === 'medium') {
      return {
        frameLoad,
        weaponWeight,
        equippedWeight,
        maxCapacity,
        loadPct,
        loadBracket,
        mobilityMult: 1.0,
        heatMult: 1.0,
        swapTimeMult: 1.0,
        accuracyMult: 1.0,
        stealthBroken: false,
        label: `MEDIUM LOAD (${loadPct}% · ${equippedWeight}/${maxCapacity} WT): OPTIMAL`,
      };
    }
    if (loadBracket === 'heavy') {
      return {
        frameLoad,
        weaponWeight,
        equippedWeight,
        maxCapacity,
        loadPct,
        loadBracket,
        mobilityMult: 0.9,
        heatMult: 1.12,
        swapTimeMult: 1.18,
        accuracyMult: 1.0,
        stealthBroken: false,
        label: `HEAVY LOAD (${loadPct}% · ${equippedWeight}/${maxCapacity} WT): SPD -10%, HEAT +12%, HVY INERTIA`,
      };
    }
    return {
      frameLoad,
      weaponWeight,
      equippedWeight,
      maxCapacity,
      loadPct,
      loadBracket,
      mobilityMult: 0.65,
      heatMult: 1.35,
      swapTimeMult: 1.45,
      accuracyMult: 0.85,
      stealthBroken: true,
      label: `OVERLOADED (${loadPct}% · ${equippedWeight}/${maxCapacity} WT): SPD -35%, HEAT +35%, STEALTH BROKEN`,
    };
  }

  if (frameLoad === 'light') {
    if (weaponWeight === 'light') {
      return {
        frameLoad,
        weaponWeight,
        loadBracket: 'light',
        mobilityMult: 1.08,
        heatMult: 0.9,
        swapTimeMult: 0.9,
        accuracyMult: 1.0,
        stealthBroken: false,
        label: 'LIGHT LOAD (0–30%): OPTIMAL',
      };
    }
    if (weaponWeight === 'medium') {
      return {
        frameLoad,
        weaponWeight,
        loadBracket: 'medium',
        mobilityMult: 1.0,
        heatMult: 1.0,
        swapTimeMult: 1.0,
        accuracyMult: 1.0,
        stealthBroken: false,
        label: 'MEDIUM LOAD (31–65%): OPTIMAL',
      };
    }
    return {
      frameLoad,
      weaponWeight,
      loadBracket: 'overloaded',
      mobilityMult: 0.65,
      heatMult: 1.35,
      swapTimeMult: 1.45,
      accuracyMult: 0.85,
      stealthBroken: true,
      label: 'OVERLOADED (>100%): MOBILITY -35%, HEAT +35%, STEALTH BROKEN',
    };
  }

  if (frameLoad === 'medium') {
    if (weaponWeight === 'light') {
      return {
        frameLoad,
        weaponWeight,
        loadBracket: 'light',
        mobilityMult: 1.05,
        heatMult: 0.95,
        swapTimeMult: 0.95,
        accuracyMult: 1.0,
        stealthBroken: false,
        label: 'LIGHT LOAD (0–30%): AGILE CALIBRATION',
      };
    }
    if (weaponWeight === 'medium') {
      return {
        frameLoad,
        weaponWeight,
        loadBracket: 'medium',
        mobilityMult: 1.0,
        heatMult: 1.0,
        swapTimeMult: 1.0,
        accuracyMult: 1.0,
        stealthBroken: false,
        label: 'MEDIUM LOAD (31–65%): OPTIMAL',
      };
    }
    return {
      frameLoad,
      weaponWeight,
      loadBracket: 'heavy',
      mobilityMult: 0.9,
      heatMult: 1.12,
      swapTimeMult: 1.18,
      accuracyMult: 1.0,
      stealthBroken: false,
      label: 'HEAVY LOAD (66–100%): MOBILITY -10%, HEAT +12%',
    };
  }

  return {
    frameLoad,
    weaponWeight,
    loadBracket: 'heavy',
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
  lightDelta: number;
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
  let lightDelta = 0;

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
    if (m.lightDelta) lightDelta += m.lightDelta;
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
    lightDelta,
  };
}
