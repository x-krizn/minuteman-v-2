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
import { GEMSTONE_CATALOG, GEMSTONE_REGISTRY, TRAIT_FUNDING_GEMS } from '../items/gemstones';
import {
  CANONICAL_HARDWARE_CATALOG,
  CanonicalHardwareItemDefinition,
  CHASSIS_HARDWARE_CATALOG,
  ChassisHardwareItemDefinition,
  findHardwareItemByNameOrId,
  resolveEquippedHardwareStats,
} from '../equipment/chassis_hardware';
import { CANONICAL_FRAME_FEAT_CATALOG } from './canonical_feats';

export {
  CANONICAL_HARDWARE_CATALOG,
  type CanonicalHardwareItemDefinition,
  CHASSIS_HARDWARE_CATALOG,
  type ChassisHardwareItemDefinition,
  findHardwareItemByNameOrId,
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
  switch (weaponId) {
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
      return { equipmentType: 'Auxiliary', subtype: 'Auxiliary · Physical Shield' };
    case 'quiver':
      return { equipmentType: 'Auxiliary', subtype: 'Auxiliary · Quiver' };
    case 'aether_catalyst':
      return { equipmentType: 'Auxiliary', subtype: 'Auxiliary · Catalyst' };
    default:
      return { equipmentType: 'Weapon', subtype: 'Weapon' };
  }
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
    aux3: string;
    aux4: string;
  }
> = {
  Warrior: {
    head: 'Crystal Dynamics G341 Murmillio',
    sensoryA: 'Federated T7 Sensor Array',
    sensoryB: 'Federated EchoPulse Scanner',
    arms: 'BWI Twinstrike Gauntlets',
    legs: 'BWI Gatecrasher Striders',
    plating: 'BWI Bastion Coreplate',
    reactorCore: 'PNSY Alchemic Turbine Core Mk.IV',
    aux3: 'PNSY R-11 Rockweiler Buckler',
    aux4: 'PNSY UF-9 Rough Rider Booster',
  },
  Marauder: {
    head: 'BE Ironveil Command Dome',
    sensoryA: 'NDS ArcPulse Sensor Grid',
    sensoryB: 'NDS EchoStorm Threat Analyzer',
    arms: 'Fire & Ice Line Holder',
    legs: 'Fire & Ice Outrigger Striders',
    plating: 'Fire & Ice Fortress Coreplate',
    reactorCore: 'RAD Battleheart Ether Reactor Mk.V',
    aux3: 'RAD R-22 Bastion Kinetic Recycling',
    aux4: 'RAD UF-12 Ether Vapor Launcher',
  },
  Guardian: {
    head: 'Aegis Halo Command Dome',
    sensoryA: 'Solbright Flux Sensor Grid',
    sensoryB: 'Aegis Lightveil Analyzer',
    arms: 'Solbright Cleaver Assemblies',
    legs: 'Dawnforge Stabilizer Striders',
    plating: 'Dawnforge Guardian Coreplate',
    reactorCore: 'TI Manaheart Reactor Mk.IV',
    aux3: 'TI Aegis Hard-Light Shield',
    aux4: 'TI Radiant Sphere Generator',
  },
  Rogue: {
    head: 'VX Veilsight Command Helm',
    sensoryA: 'VX Phantom Network Sensor',
    sensoryB: 'VX Echo-Null Scanner',
    arms: 'Shadowcraft Silencer Gauntlets',
    legs: 'Shadowcraft Ghost Striders',
    plating: 'Shadowcraft Recon Coreplate',
    reactorCore: 'VX Phantom Core Mk.III',
    aux3: 'VX Eclipse Cloak Generator',
    aux4: 'VX Phase-Shift Module',
  },
  Wizard: {
    head: 'ARC Omniscient Command Dome',
    sensoryA: 'ARC Manaflow Analyzer',
    sensoryB: 'ARC Convergence Predictor',
    arms: 'Arcanum Channeler Assemblies',
    legs: 'Arcanum Anchor Striders',
    plating: 'Arcanum Heavy Projector Coreplate',
    reactorCore: 'ARC Infinite Well Reactor Mk.VI',
    aux3: 'ARC Prismatic Barrier',
    aux4: 'ARC Feedback Loop Capacitor',
  },
  Cleric: {
    head: 'SANC Providence Command Helm',
    sensoryA: 'SANC Lifeline Monitor',
    sensoryB: 'SANC Blessing Resonance Grid',
    arms: 'Sanctum Benediction Assemblies',
    legs: 'Sanctum Steadfast Striders',
    plating: 'Sanctum Support Coreplate',
    reactorCore: 'SANC Heartwell Reactor Mk.IV',
    aux3: 'SANC Aegis Restoration Field',
    aux4: 'SANC Martyrdom Plating',
  },
};

export function createInitialEquipmentSlots(traitLine: TraitLine = 'Warrior'): OrionEquipmentSlots {
  const trait = TRAIT_REGISTRY[traitLine] || TRAIT_REGISTRY.Warrior;
  const hw = DEFAULT_CANONICAL_HARDWARE_BY_KIT[traitLine] || DEFAULT_CANONICAL_HARDWARE_BY_KIT.Warrior;
  const w1 = trait.startingWeapons?.[0] || 'long_sword';
  const w2 = trait.startingWeapons?.[1] || null;
  const isBowMain = w1 === 'great_bow';
  const initialCounts: Record<string, number> = { [w1]: 1 };
  if (w2) {
    initialCounts[w2] = (initialCounts[w2] || 0) + 1;
  }
  const hasSide = Boolean(!isBowMain && w2);
  return {
    slot1: w1,
    slot2: isBowMain ? null : w2,
    slot3: isBowMain
      ? (w2 || 'quiver')
      : traitLine === 'Guardian'
      ? 'aegis_charge_buckler'
      : traitLine === 'Wizard' || traitLine === 'Cleric'
      ? 'aether_catalyst'
      : null,
    mainGrip: hasSide ? '1h' : '2h',
    ownedWeaponCounts: initialCounts,
    head: hw.head,
    arms: hw.arms,
    legs: hw.legs,
    plating: hw.plating,
    reactorCore: hw.reactorCore,
    sensoryA: hw.sensoryA,
    sensoryB: hw.sensoryB,
    aux3: hw.aux3,
    aux4: hw.aux4,
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
    unlockedEquipment: [w1, ...(w2 ? [w2] : []), 'aether_catalyst'],
    weaponGemMods: {},
  };
}

/**
 * Checks whether a weapon, shield, quiver, or catalyst is unlocked/owned by the pilot.
 * When `bypassProgressionGates` is enabled (or tutorial is toggled off in sandbox), all items are available.
 */
export function isEquipmentUnlocked(state: OrionState, weaponId: string): boolean {
  if (!weaponId) return false;
  if (state.bypassProgressionGates || !state.tutorialActive || state.room === '-4,0') return true;
  if (state.equippedWeapons?.includes(weaponId)) return true;
  if (
    state.equipmentSlots?.slot1 === weaponId ||
    state.equipmentSlots?.slot2 === weaponId ||
    state.equipmentSlots?.slot3 === weaponId
  )
    return true;
  const unlocked = state.equipmentSlots?.unlockedEquipment || [];
  return unlocked.includes(weaponId);
}

/**
 * Returns how many separate instances of `weaponId` the pilot owns.
 * Paired Stance (`main: sword1`, `side: sword1` in `1h` grip) requires 2 separate items.
 */
export function getOwnedWeaponCount(state: OrionState, weaponId: string): number {
  if (!weaponId) return 0;
  if (state.bypassProgressionGates || state.room === '-4,0') return 2;
  const counts = state.equipmentSlots?.ownedWeaponCounts || {};
  if (typeof counts[weaponId] === 'number' && counts[weaponId] > 0) {
    return counts[weaponId];
  }
  return isEquipmentUnlocked(state, weaponId) ? 1 : 0;
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
  state.equipmentSlots.ownedWeaponCounts = state.equipmentSlots.ownedWeaponCounts || {};
  const current = getOwnedWeaponCount(state, weaponId);
  if (current >= 2) {
    ctx?.say(`ALREADY OWN 2 SEPARATE COPIES OF ${weaponId.replace(/_/g, ' ').toUpperCase()}`);
    return false;
  }
  state.equipmentSlots.ownedWeaponCounts[weaponId] = 2;
  if (!state.equipmentSlots.unlockedEquipment?.includes(weaponId)) {
    state.equipmentSlots.unlockedEquipment = [
      ...(state.equipmentSlots.unlockedEquipment || []),
      weaponId,
    ];
  }
  ctx?.say(`ACQUIRED 2ND COPY: ${weaponId.replace(/_/g, ' ').toUpperCase()} (PAIRED STANCE READY)`);
  return true;
}

/**
 * Resolves the active Main Hand weapon grip ('1h' or '2h').
 * - Bows (`great_bow`) are designated 2-handed only.
 * - If no Side Hand is equipped (`!slot2`), the Main Hand is automatically 2H.
 */
export function getEffectiveMainGrip(state: OrionState): '1h' | '2h' {
  const slot1 = state.equipmentSlots?.slot1 || state.equippedWeapons?.[0] || 'long_sword';
  if (slot1 === 'great_bow') return '2h';
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
  if (slot1 === 'great_bow' && grip === '1h') {
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
      `TWO-HANDING POWER STANCE: ${slot1.replace(/_/g, ' ').toUpperCase()} (2H)`
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
        `ONE-HANDED GRIP: EQUIPPED ${state.equipmentSlots.slot2.replace(/_/g, ' ').toUpperCase()} IN SIDE HAND`
      );
      return true;
    }
    ctx?.say('NO SIDE HAND EQUIPPED — MAIN HAND IS AUTOMATICALLY 2H');
    return false;
  }

  state.equipmentSlots.mainGrip = '1h';
  ctx?.say(`ONE-HANDED GRIP: ${slot1.replace(/_/g, ' ').toUpperCase()} (1H)`);
  return true;
}

/**
 * Unlocks a weapon, shield, quiver, or catalyst into `state.equipmentSlots.unlockedEquipment`.
 * If already unlocked, increments `ownedWeaponCounts` up to 2 so Paired Stance can be used.
 */
export function unlockEquipmentItem(
  state: OrionState,
  weaponId: string,
  ctx?: { say: (text: string) => void }
): boolean {
  if (!weaponId) return false;
  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  state.equipmentSlots.unlockedEquipment = state.equipmentSlots.unlockedEquipment || [
    state.equippedWeapons[0] || 'long_sword',
  ];
  state.equipmentSlots.ownedWeaponCounts = state.equipmentSlots.ownedWeaponCounts || {};

  const wasNew = !state.equipmentSlots.unlockedEquipment.includes(weaponId);
  if (wasNew) {
    state.equipmentSlots.unlockedEquipment.push(weaponId);
    state.equipmentSlots.ownedWeaponCounts[weaponId] = Math.max(
      1,
      state.equipmentSlots.ownedWeaponCounts[weaponId] || 1
    );
  } else {
    state.equipmentSlots.ownedWeaponCounts[weaponId] = Math.min(
      2,
      (state.equipmentSlots.ownedWeaponCounts[weaponId] || 1) + 1
    );
  }

  if (
    state.equippedWeapons.length < 2 &&
    (state.level >= 2 || !state.tutorialActive || state.bypassProgressionGates) &&
    state.equippedWeapons[0] !== weaponId
  ) {
    state.equippedWeapons.push(weaponId);
    state.equipmentSlots.weaponSet2 = [weaponId, null];
    if (!state.equipmentSlots.slot2 && getEffectiveMainGrip(state) !== '2h') {
      state.equipmentSlots.slot2 = weaponId;
    } else if (!state.equipmentSlots.slot3) {
      state.equipmentSlots.slot3 = weaponId;
    }
  }

  if (wasNew && ctx) {
    ctx.say(`DISCOVERED GEAR: ${weaponId.replace(/_/g, ' ').toUpperCase()} UNLOCKED IN SATCHEL`);
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
 * Resolves the active Gem modification (`Col 0..8`) for a given weapon/shield/quiver ID.
 * - If explicitly modified in `state.equipmentSlots.weaponGemMods[weaponId]`, uses that Gem.
 * - Otherwise, if an Action Mod is installed for the weapon's category, uses that Action Mod's primary Gem.
 * - Otherwise returns `null` (Base column `0`).
 */
export function getWeaponActiveGemId(
  state: OrionState,
  weaponId: string
): GemId | null {
  const explicit = state.equipmentSlots?.weaponGemMods?.[weaponId];
  if (explicit && explicit in GEMSTONE_REGISTRY) {
    return explicit;
  }

  const subtypeInfo = getWeaponSubtypeInfo(weaponId);
  const isRanged =
    subtypeInfo.subtype.startsWith('Ranged') ||
    weaponId === 'gladius_boltcaster' ||
    weaponId === 'great_bow' ||
    weaponId === 'quiver' ||
    weaponId === 'avalon_siege_lance';
  const installedModId = isRanged
    ? state.equipmentSlots?.installedMods?.ranged
    : state.equipmentSlots?.installedMods?.melee;
  if (installedModId) {
    const mod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === installedModId);
    const firstGem = mod?.gemCost?.[0]?.gemId;
    if (firstGem && firstGem in GEMSTONE_REGISTRY) {
      return firstGem;
    }
  }
  return null;
}

/**
 * Computes the stone-specific combat bonus for a weapon, shield, or quiver modified with a Gemstone (`Cols 0..8`).
 */
export function getWeaponGemCombatModifiers(
  state: OrionState,
  weaponId?: string
): WeaponGemCombatModifiers {
  const targetWpnId =
    weaponId || state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const gemId = getWeaponActiveGemId(state, targetWpnId);

  const base: WeaponGemCombatModifiers = {
    gemId,
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

  if (!gemId) return base;
  base.summaryLabel = WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[gemId] || base.summaryLabel;

  switch (gemId) {
    case 'moonstone':
      base.maxShieldBonus = 8;
      base.skillCooldownMult = 0.9;
      break;
    case 'spinel':
      base.damageMult = state.heat >= 50 ? 1.22 : 1.15;
      break;
    case 'carnelian':
      base.extraArmorDentOnHit = 4;
      base.presenceGainOnHit = 15;
      break;
    case 'titanite':
      base.maxShieldBonus = 15;
      base.shieldRestoreOnSkillHit = 4;
      break;
    case 'demantoid':
      base.skillHeatCostMult = 0.85;
      base.skillCooldownMult = 0.9;
      break;
    case 'kyanite':
      base.projectileSpeedMult = 1.15;
      base.skillCooldownMult = 0.88;
      break;
    case 'charoite':
      base.lockedOrStaggeredDamageMult = 1.2;
      base.moveSpeedMult = 1.08;
      break;
    case 'rubellite':
      base.damageMult = 1.12;
      base.bonusMaxAmmo = 1;
      break;
    case 'hematite':
      base.heatVentOnBasicHit = 4;
      base.armorRestoreOnKill = 4;
      break;
  }

  return base;
}

/**
 * Resolves the sprite sheet column (`0..8`), Gem-colored blade trail / projectile VFX palette,
 * and stone-specific combat bonus label for any weapon, shield, or quiver (`Rows 4–14`).
 */
export function getWeaponGemVisuals(
  state: OrionState,
  weaponId: string
): {
  gemId: GemId | null;
  colIndex: number;
  color: string;
  coreColor: string;
  label: string;
  bonusDescription: string;
} {
  const gemId = getWeaponActiveGemId(state, weaponId);
  if (!gemId) {
    return {
      gemId: null,
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
      colIndex: 0,
      color: '#e2e8f0',
      coreColor: '#ffffff',
      label: 'BASE (COL 0)',
      bonusDescription: 'Unmodified Base Equipment',
    };
  }
  return {
    gemId,
    colIndex: gem.colIndex,
    color: gem.hexColor,
    coreColor: gem.coreHexColor || gem.hexColor,
    label: gem.name.toUpperCase(),
    bonusDescription: WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[gemId] || '',
  };
}

/**
 * Modifies a weapon, shield, or quiver with a Gem (`Col 0..8`) to shift its sprite column,
 * tint its blade trails / projectiles with that Gem's color, and apply its stone-specific combat bonus.
 * Gated behind Level 6 (`isStandardProgressionUnlocked`) or Sandbox Bypass.
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
  state.equipmentSlots.weaponGemMods = state.equipmentSlots.weaponGemMods || {};
  state.equipmentSlots.unlockedMods = state.equipmentSlots.unlockedMods || [];

  if (gemId === null) {
    state.equipmentSlots.weaponGemMods[weaponId] = null;
    ctx?.say(`${weaponId.replace(/_/g, ' ').toUpperCase()} RESTORED TO BASE (COL 0)`);
    return true;
  }

  if (!isStandardProgressionUnlocked(state)) {
    ctx?.say(
      'EQUIPMENT GEM MODIFICATION LOCKED UNTIL LEVEL 6 (BORDER TOWN COMPLETE) OR BYPASS'
    );
    return false;
  }

  const gem = GEMSTONE_REGISTRY[gemId];
  if (!gem) return false;

  const unlockTag = `wpn_gem:${weaponId}:${gemId}`;
  const alreadyUnlocked =
    state.equipmentSlots.unlockedMods.includes(unlockTag) ||
    Boolean(state.bypassProgressionGates);

  if (!alreadyUnlocked) {
    if (!consumeInventoryGem(state, gemId, 1)) {
      ctx?.say(
        `REQUIRES 1 ${gem.name.toUpperCase()} TO MODIFY EQUIPMENT`
      );
      return false;
    }
    state.equipmentSlots.unlockedMods.push(unlockTag);
  }

  state.equipmentSlots.weaponGemMods[weaponId] = gemId;
  const bonusDesc = WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[gemId];
  ctx?.say(
    `${weaponId.replace(/_/g, ' ').toUpperCase()} → ${gem.name.toUpperCase()} (${bonusDesc.toUpperCase()})`
  );
  syncPostTutorialFrameLevel(state, ctx);
  return true;
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

/**
 * GEM USE 2 — FEAT NODE SOCKETING (Gems Removed from Inventory, Retained in Build, Refunded on Unsocket):
 * Installing the required Discipline + Reactor Gems unlocks and activates the Feat Node.
 * Unsocketing the Feat Node returns all retained gems back to the player's inventory.
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
    `SOCKETED ${socketedLabels.join(' + ').toUpperCase()} → ${feat.name.toUpperCase()} ACTIVE${hwStatus.met ? '' : ` (${hwStatus.reason.toUpperCase()})`}`
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
