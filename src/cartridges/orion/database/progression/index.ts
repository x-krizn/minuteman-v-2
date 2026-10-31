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
  LoadPenaltySummary,
  OrionEquipmentSlots,
  OrionState,
  PilotSkillId,
  PilotSkillProgress,
  TraitLine,
  WeaponWeightClass,
} from '../../types';
import { TRAIT_REGISTRY } from '../characters';
import {
  CANONICAL_HARDWARE_CATALOG,
  CanonicalHardwareItemDefinition,
  CHASSIS_HARDWARE_CATALOG,
  ChassisHardwareItemDefinition,
  findHardwareItemByNameOrId,
  resolveEquippedHardwareStats,
} from '../equipment/chassis_hardware';
import {
  buildEquipmentInstanceId,
  formatModifiedEquipmentName,
  GEM_MOD_PREFIX_BY_ID,
  isCanonicalGemId,
  parseEquipmentInstanceId,
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
  findHardwareItemByNameOrId,
  formatModifiedEquipmentName,
  GEM_MOD_PREFIX_BY_ID,
  isCanonicalGemId,
  parseEquipmentInstanceId,
  resolveEquippedHardwareStats,
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

export function createInitialPilotSkills(): Record<PilotSkillId, PilotSkillProgress> {
  return PILOT_SKILL_DEFINITIONS.reduce(
    (acc, def) => {
      acc[def.id] = {
        id: def.id,
        name: def.name,
        level: 1,
        xp: 0,
        nextLevelXp: 1,
        relatedEquipment: def.relatedEquipment,
        gemsInvested: 0,
        fundingGems: [...def.fundingGems],
      };
      return acc;
    },
    {} as Record<PilotSkillId, PilotSkillProgress>
  );
}

export function normalizePilotSkills(
  raw?: Record<string, any>
): Record<PilotSkillId, PilotSkillProgress> {
  const base = createInitialPilotSkills();
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

// ─── LAYER 3: EQUIPMENT SLOTS & GEM-GENERATED ACTION MODIFICATIONS ───────────

export const ACTION_MODIFICATION_CATALOG: ActionModificationDefinition[] = [
  {
    id: 'mod_multi_target_lock',
    name: 'Splinter-Lock Targeting Array',
    targetCategory: 'ranged',
    gainDescription: 'Fires +1 extra splinter projectile per ranged attack',
    drawbackDescription: '+25% Tell Windup Duration (slower commitment)',
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
    id: 'mod_phase_thruster',
    name: 'Afterburner Phase Injector',
    targetCategory: 'mobility',
    gainDescription: '+0.10s Booster Dash Duration & Evasion Window',
    drawbackDescription: '+8 Booster Heat Cost per Dash',
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
    id: 'mod_hyper_armor_stance',
    name: 'Magnetic Anchor Stance',
    targetCategory: 'melee',
    gainDescription: '-20% Skill Cooldowns on CQC & Hardware Actions',
    drawbackDescription: '+20% Tell Windup Duration',
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
    id: 'mod_sanctum_vent_coil',
    name: 'Sanctum Harmonic Vent Coil',
    targetCategory: 'all',
    gainDescription: '-15% Active Skill Cooldowns across both Weapon Sets',
    drawbackDescription: '+4 Reactor Heat Cost per Action',
    gemCost: [{ gemId: 'moonstone', count: 1 }],
    modifiers: {
      cooldownMult: 0.85,
      heatCostDelta: 4,
    },
  },
  {
    id: 'mod_inertial_gyro_telemetry',
    name: 'Inertial Gyro-Telemetry Mod',
    targetCategory: 'mobility',
    gainDescription: 'Unlocks live HUD Inertia & Stability Telemetry + +12 Stability (S)',
    drawbackDescription: '+2 Reactor Heat Cost on Booster Dash',
    gemCost: [{ gemId: 'titanite', count: 1 }],
    modifiers: {
      stabilityBonus: 12,
      enableInertiaHudTelemetry: true,
      heatCostDelta: 2,
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
  const { baseId, installedGems } = parseEquipmentInstanceId(idOrName);
  const wDef = getWeaponDefinition(baseId);
  if (wDef) {
    return buildEquipmentInstanceId(parseEquipmentInstanceId(wDef.id).baseId, installedGems);
  }
  const hwDef = findHardwareItemByNameOrId(baseId);
  if (hwDef) {
    return buildEquipmentInstanceId(parseEquipmentInstanceId(hwDef.id).baseId, installedGems);
  }
  return buildEquipmentInstanceId(baseId, installedGems);
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
 * Computes the maximum number of Gem mod slots (`1` to `3`) for any equipment item based on its category / weight class:
 * - **3 Mod Slots**: Heavy Weapons (`weightClass === 'heavy'`), Frame Plating (`slot === 'plating'`), and Reactor Cores (`slot === 'reactor'`).
 * - **2 Mod Slots**: Medium Weapons (`weightClass === 'medium'`), all Auxiliaries, Head Optics, Arms Actuators, and Legs Striders.
 * - **1 Mod Slot**: Light Weapons (`weightClass === 'light'`) and Sensory Arrays (`sensoryA` / `sensoryB`).
 */
export function getEquipmentMaxModSlots(idOrName: string | null | undefined): 1 | 2 | 3 {
  if (!idOrName) return 1;
  const { baseId } = parseEquipmentInstanceId(idOrName);
  const wDef = getWeaponDefinition(baseId);
  if (wDef) {
    if (isAuxiliaryEquipment(wDef)) return 2;
    if (wDef.weightClass === 'heavy') return 3;
    if (wDef.weightClass === 'light') return 1;
    return 2;
  }
  const hwDef = findHardwareItemByNameOrId(baseId);
  if (hwDef) {
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
    sensoryA: string;
    sensoryB: string;
    arms: string;
    legs: string;
    plating: string;
    reactorCore: string;
  }
> = {
  Warrior: {
    head: 'Crystal Dynamics G341 Murmillio',
    sensoryA: 'Federated T7 Sensor Array',
    sensoryB: 'Federated EchoPulse Scanner',
    arms: 'BWI Twinstrike Gauntlets',
    legs: 'BWI Gatecrasher Striders',
    plating: 'BWI Bastion Frame Plating',
    reactorCore: 'PNSY Alchemic Turbine Core Mk.IV',
  },
  Marauder: {
    head: 'BE Ironveil Command Dome',
    sensoryA: 'NDS ArcPulse Sensor Grid',
    sensoryB: 'NDS EchoStorm Threat Analyzer',
    arms: 'Fire & Ice Line Holder',
    legs: 'Fire & Ice Outrigger Striders',
    plating: 'Fire & Ice Fortress Frame Plating',
    reactorCore: 'RAD Battleheart Ether Reactor Mk.V',
  },
  Guardian: {
    head: 'Aegis Halo Command Dome',
    sensoryA: 'Solbright Flux Sensor Grid',
    sensoryB: 'Aegis Lightveil Analyzer',
    arms: 'Solbright Cleaver Assemblies',
    legs: 'Dawnforge Stabilizer Striders',
    plating: 'Dawnforge Guardian Frame Plating',
    reactorCore: 'TI Manaheart Reactor Mk.IV',
  },
  Rogue: {
    head: 'VX Veilsight Command Helm',
    sensoryA: 'VX Phantom Network Sensor',
    sensoryB: 'VX Echo-Null Scanner',
    arms: 'Shadowcraft Silencer Gauntlets',
    legs: 'Shadowcraft Ghost Striders',
    plating: 'Shadowcraft Recon Frame Plating',
    reactorCore: 'VX Phantom Core Mk.III',
  },
  Wizard: {
    head: 'ARC Omniscient Command Dome',
    sensoryA: 'ARC Manaflow Analyzer',
    sensoryB: 'ARC Convergence Predictor',
    arms: 'Arcanum Channeler Assemblies',
    legs: 'Arcanum Anchor Striders',
    plating: 'Arcanum Heavy Projector Frame Plating',
    reactorCore: 'ARC Infinite Well Reactor Mk.VI',
  },
  Cleric: {
    head: 'SANC Providence Command Helm',
    sensoryA: 'SANC Lifeline Monitor',
    sensoryB: 'SANC Blessing Resonance Grid',
    arms: 'Sanctum Benediction Assemblies',
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
    hw.arms,
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
    arms: hw.arms,
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
    eq?.arms,
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
    eq?.arms,
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
    eq?.arms,
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
 * Installs a Gemstone Mod onto an owned equipment instance (`sourceInstanceId`), consuming 1 copy of the source item
 * and 1 matching Gemstone from inventory to produce a distinct renamed item copy (`<Prefix> <BaseName> [+II/+III]`).
 * Automatically updates any loadout slot where the last copy of `sourceInstanceId` was equipped.
 */
export function installGemModOnEquipment(
  state: OrionState,
  sourceInstanceId: string,
  gemId: GemId,
  ctx?: { say: (text: string) => void }
): string | null {
  if (!sourceInstanceId || !isCanonicalGemId(gemId)) return null;
  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  const eq = state.equipmentSlots;
  eq.ownedWeaponCounts = eq.ownedWeaponCounts || {};
  eq.unlockedEquipment = eq.unlockedEquipment || [];
  eq.unlockedMods = eq.unlockedMods || [];

  const normSource = normalizeEquipmentInstanceKey(sourceInstanceId);
  const { baseId, installedGems } = parseEquipmentInstanceId(normSource);
  const maxSlots = getEquipmentMaxModSlots(baseId);

  if (installedGems.length >= maxSlots) {
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
  if (!state.bypassProgressionGates && state.room !== '-4,0') {
    if (!consumeInventoryGem(state, gemId, 1)) {
      ctx?.say(`REQUIRES 1 ${gemDef.name.toUpperCase()} IN SATCHEL TO INSTALL MOD`);
      return null;
    }
  }

  const nextGems: GemId[] = [...installedGems, gemId];
  const newInstanceId = buildEquipmentInstanceId(baseId, nextGems);

  // Consume 1 copy of sourceInstanceId and add 1 copy of newInstanceId
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

  // Record unlock tag for progression level sync
  const unlockTag = `wpn_gem:${newInstanceId}`;
  if (!eq.unlockedMods.includes(unlockTag)) {
    eq.unlockedMods.push(unlockTag);
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
  eq.arms = upgradeSlotIfMatched(eq.arms) ?? null;
  eq.legs = upgradeSlotIfMatched(eq.legs) ?? null;
  eq.plating = upgradeSlotIfMatched(eq.plating) ?? null;
  eq.reactorCore = upgradeSlotIfMatched(eq.reactorCore) ?? null;
  eq.sensoryA = upgradeSlotIfMatched(eq.sensoryA) ?? null;
  eq.sensoryB = upgradeSlotIfMatched(eq.sensoryB) ?? null;

  state.equippedWeapons = (state.equippedWeapons || []).map((w) =>
    normalizeEquipmentInstanceKey(w) === normSource && remainingSource === 0 ? newInstanceId : w
  );

  const newDisplayName = getEquipmentDisplayName(newInstanceId);
  ctx?.say(
    `INSTALLED ${gemDef.name.toUpperCase()} MOD → ${newDisplayName.toUpperCase()} [${nextGems.length}/${maxSlots} MODS]`
  );
  syncPostTutorialFrameLevel(state, ctx);
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
  summaryLabel: string;
}

export const WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS: Record<GemId, string> = {
  moonstone: '+8 Max Shield & -10% Skill Cooldowns',
  spinel: '+15% Weapon DMG (+22% at ≥50 Heat)',
  carnelian: '+4 Armor Shred on Hit & +15 Presence',
  titanite: '+15 Max Shield & +4 Shield on Skill Hit',
  demantoid: '-15% Skill Heat Cost & -10% Skill Cooldowns',
  kyanite: '+15% Projectile Speed/Range & -12% Skill Cooldowns',
  charoite: '+20% Locked/Staggered DMG & +8% Move Speed',
  rubellite: '+12% All Weapon DMG & +1 Max Chain Ammo',
  hematite: '-4 Heat per Basic Hit & +4 Armor on Kill',
};

/**
 * Resolves the ordered list of installed Gemstones on a weapon/auxiliary instance.
 */
export function getWeaponInstalledGems(
  state: OrionState,
  weaponId: string
): GemId[] {
  const { baseId, installedGems } = parseEquipmentInstanceId(weaponId);
  if (installedGems.length > 0) {
    return installedGems;
  }
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
  state: OrionState,
  weaponId: string
): GemId | null {
  const gems = getWeaponInstalledGems(state, weaponId);
  return gems[0] || null;
}

/**
 * Computes the stone-specific combat bonus for a weapon, shield, or auxiliary modified with 1–3 Gemstones.
 */
export function getWeaponGemCombatModifiers(
  state: OrionState,
  weaponId?: string
): WeaponGemCombatModifiers {
  const targetWpnId =
    weaponId ||
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
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
    summaryLabel: 'Unmodified Base Equipment (Col 0)',
  };

  if (installedGems.length === 0) return base;
  base.summaryLabel = installedGems
    .map((g) => WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[g])
    .filter(Boolean)
    .join(' · ');

  for (const g of installedGems) {
    switch (g) {
      case 'moonstone':
        base.maxShieldBonus += 8;
        base.skillCooldownMult *= 0.9;
        break;
      case 'spinel':
        base.damageMult *= state.heat >= 50 ? 1.22 : 1.15;
        break;
      case 'carnelian':
        base.extraArmorDentOnHit += 4;
        base.presenceGainOnHit += 15;
        break;
      case 'titanite':
        base.maxShieldBonus += 15;
        base.shieldRestoreOnSkillHit += 4;
        break;
      case 'demantoid':
        base.skillHeatCostMult *= 0.85;
        base.skillCooldownMult *= 0.9;
        break;
      case 'kyanite':
        base.projectileSpeedMult *= 1.15;
        base.skillCooldownMult *= 0.88;
        break;
      case 'charoite':
        base.lockedOrStaggeredDamageMult *= 1.2;
        base.moveSpeedMult *= 1.08;
        break;
      case 'rubellite':
        base.damageMult *= 1.12;
        base.bonusMaxAmmo += 1;
        break;
      case 'hematite':
        base.heatVentOnBasicHit += 4;
        base.armorRestoreOnKill += 4;
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
  const prefix = GEM_MOD_PREFIX_BY_ID[gemId] || gem.name;
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
    label: `${prefix.toUpperCase()}${suffix}`,
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

  const skills = normalizePilotSkills(state.pilotSkills);
  const totalSkillLevelsGained = Object.values(skills).reduce(
    (sum, s) => sum + Math.max(0, (s.level || 1) - 1),
    0
  );
  const socketedFeatsCount = (state.equippedFeats || []).length;
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
            s.includes('radiant ward')
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
          s.includes('sanctum')
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
          s.includes('catalyst')
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
