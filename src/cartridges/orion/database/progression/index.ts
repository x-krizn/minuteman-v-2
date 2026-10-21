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

export { GEMSTONE_CATALOG, GEMSTONE_REGISTRY, TRAIT_FUNDING_GEMS };

export interface LevelUnlockInfo {
  level: number;
  band: LevelBand;
  fixedEvent?: string;
  unlock: string;
  learningFocus: string;
}

/**
 * §5 LEVEL SEQUENCE (LOCKED — pilot-frame-equipment-v0.md v0.7)
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
    unlock: 'Utility Slot active (Action 6) + Class Default Utility Item; Gem Skill Progression Unlocks',
    learningFocus: 'Self-sustain utility & Gemstone -> Pilot Skill -> Feat Node loop',
  },
  {
    level: 7,
    band: 'Challenge',
    unlock: 'Feat Tier I calibration (System & Interface Feat Nodes unlocked via Pilot Skills)',
    learningFocus: 'Socketing Trait + Reactor Gems into Tier I Feat Nodes',
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
    unlock: 'Level 20 Cap — All 6 Trait Line Skills, Feat Tiers I–V & 13 Equipment Slots mastered',
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

// ─── LAYER 1: 6 TRAIT LINE PILOT SKILLS (Funded by Matching Gems) ────────────

export const PILOT_SKILL_DEFINITIONS: Array<{
  id: PilotSkillId;
  name: string;
  fundingGems: [GemId, GemId];
  relatedEquipment: string;
}> = [
  {
    id: 'Warrior',
    name: 'Warrior (Fighter Mastery)',
    fundingGems: ['spinel', 'hematite'],
    relatedEquipment: 'Funded by Spinel (Trait) or Hematite (Ichor Reactor). Unlocks frontline & heat-driven Feat Nodes.',
  },
  {
    id: 'Marauder',
    name: 'Marauder (Barbarian Siege)',
    fundingGems: ['carnelian', 'hematite'],
    relatedEquipment: 'Funded by Carnelian (Trait) or Hematite (Ichor Reactor). Unlocks super-heavy load & Presence Feat Nodes.',
  },
  {
    id: 'Guardian',
    name: 'Guardian (Paladin Vanguard)',
    fundingGems: ['titanite', 'moonstone'],
    relatedEquipment: 'Funded by Titanite (Trait) or Moonstone (Mana Reactor). Unlocks shield bastion & Presence priority Feat Nodes.',
  },
  {
    id: 'Cleric',
    name: 'Cleric (Mage Support)',
    fundingGems: ['demantoid', 'moonstone'],
    relatedEquipment: 'Funded by Demantoid (Trait) or Moonstone (Mana Reactor). Unlocks repair, thermal venting & aura Feat Nodes.',
  },
  {
    id: 'Wizard',
    name: 'Wizard (Sorcerer Artillery)',
    fundingGems: ['kyanite', 'rubellite'],
    relatedEquipment: 'Funded by Kyanite (Trait) or Rubellite (Ether Reactor). Unlocks beam accuracy & Æther conduit Feat Nodes.',
  },
  {
    id: 'Rogue',
    name: 'Rogue (Thief Assassin)',
    fundingGems: ['charoite', 'rubellite'],
    relatedEquipment: 'Funded by Charoite (Trait) or Rubellite (Ether Reactor). Unlocks CQC gyros, evasion & stealth Feat Nodes.',
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
        level: Math.max(1, Math.min(20, Number(existing.level) || 1)),
        xp: Number(existing.xp) || 0,
        gemsInvested: Number(existing.gemsInvested) || 0,
      };
    }
  }
  return base;
}

// ─── LAYER 2: FRAME FEAT NODES (Specific Trait + Reactor Gem Sockets) ────────

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
    requiredSkillId: 'Warrior',
    requiredSkillLevel: 2,
    gainDescription: '+1 Frame Load Capacity Step (Light → Medium, Medium → Heavy)',
    costDescription: 'Sockets 1 Spinel + 1 Hematite (Retained in build, refunded on unsocket)',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    unlocksDescription: 'Unlocks Medium/Heavy weapon mounting without overload penalties',
    loadStepUp: 1,
  },
  {
    id: 'if_overclocked_actuator',
    name: 'Interface Feat I: Overclocked Firing Actuator',
    tier: 'I',
    kind: 'interface',
    requiredSkillId: 'Warrior',
    requiredSkillLevel: 2,
    gainDescription: '+15% Weapon Damage Output',
    costDescription: '+15% Weapon Heat Generation (Static Budget Trade)',
    gemSockets: [
      { gemId: 'spinel', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    unlocksDescription: 'Unlocks high-heat frontline striker cadence',
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
    requiredSkillId: 'Rogue',
    requiredSkillLevel: 2,
    gainDescription: '+10% Walk & Boost Mobility Speed',
    costDescription: '-10 Shield Max Capacity (Static Budget Trade)',
    gemSockets: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    unlocksDescription: 'Unlocks rapid CQC ambush & thruster evasion profiling',
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
    requiredSkillId: 'Marauder',
    requiredSkillLevel: 5,
    gainDescription: '+1 Frame Load Capacity Step (mounts Heavy/Superheavy gear without penalty)',
    costDescription: 'Sockets 1 Carnelian + 1 Hematite (Retained in build)',
    gemSockets: [
      { gemId: 'carnelian', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
    unlocksDescription: 'Unlocks Heavy/Superheavy artillery hardpoint clearance',
    loadStepUp: 1,
  },
  {
    id: 'if_capacitor_shunt',
    name: 'Interface Feat II: Shield Capacitor Shunt',
    tier: 'II',
    kind: 'interface',
    requiredSkillId: 'Guardian',
    requiredSkillLevel: 5,
    gainDescription: '+25 Shield Max Capacity',
    costDescription: '-12% Walk & Boost Speed (Static Budget Trade)',
    gemSockets: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    unlocksDescription: 'Unlocks vanguard aegis fortification & Presence soaking',
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
    requiredSkillId: 'Wizard',
    requiredSkillLevel: 5,
    gainDescription: '+15% Projectile Accuracy & Stability',
    costDescription: '+20% Weapon Swap Cooldown (5.0s → 6.0s)',
    gemSockets: [
      { gemId: 'kyanite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    unlocksDescription: 'Unlocks precision beam suppression & ranged mod stability',
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
    requiredSkillId: 'Cleric',
    requiredSkillLevel: 9,
    gainDescription: '+35% Passive Heat Venting Rate',
    costDescription: '-20 Armor Max Durability (Exposed Louvers)',
    gemSockets: [
      { gemId: 'demantoid', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    unlocksDescription: 'Unlocks rapid reactor cooling for sustained support cycling',
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
    requiredSkillId: 'Marauder',
    requiredSkillLevel: 14,
    gainDescription: '+1 Frame Load Capacity Step (unlocks Superheavy Ceiling on any Frame)',
    costDescription: 'Sockets 2 Carnelian + 1 Hematite (Retained in build)',
    gemSockets: [
      { gemId: 'carnelian', count: 2 },
      { gemId: 'hematite', count: 1 },
    ],
    unlocksDescription: 'Unlocks full Superheavy ordnance across any Trait Line frame',
    loadStepUp: 1,
  },
  {
    id: 'if_aether_synced_core',
    name: 'Interface Feat V: Æther-Synced Core Conduit',
    tier: 'V',
    kind: 'interface',
    requiredSkillId: 'Wizard',
    requiredSkillLevel: 18,
    gainDescription: '-25% Active Skill & Aux Cooldowns, -20% Weapon Swap Time',
    costDescription: '+15% Weapon Heat Generation (Static Budget Trade)',
    gemSockets: [
      { gemId: 'kyanite', count: 2 },
      { gemId: 'rubellite', count: 1 },
    ],
    unlocksDescription: 'Unlocks capstone Tier V rapid multi-weapon & Aux expression',
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
    requiredSkillId: 'Guardian',
    requiredSkillLevel: 1,
    gainDescription: '+25% Damage vs. Camelot Knights & Sanctum Constructs',
    costDescription: 'Sockets 1 Titanite + 1 Moonstone (or earned via Lady of the Lake)',
    gemSockets: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    unlocksDescription: 'Unlocks Belldor Sanctum knight-breaker resonance',
    modifiers: {},
  },
];

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
  // 2 of the Pilot's Primary Trait Gem + 2 of the Pilot's Primary Reactor Gem
  setCount(traitGem, 2);
  setCount(reactorGem, 2);

  return Array.from(map.entries()).map(([itemId, count]) => ({ itemId, count }));
}

export function createInitialEquipmentSlots(traitLine: TraitLine = 'Warrior'): OrionEquipmentSlots {
  const trait = TRAIT_REGISTRY[traitLine] || TRAIT_REGISTRY.Warrior;
  const w1 = trait.startingWeapons?.[0] || 'long_sword';
  return {
    weaponSet1: [w1, null],
    weaponSet2: ['', null],
    utility: DEFAULT_UTILITY_BY_TRAIT[traitLine] || 'utility_ichor_surge',
    aux: [
      'mod_head_optic_scan',
      'mod_torso_reactive_burst',
      'mod_arms_shock_grapple',
      'mod_legs_seismic_stomp',
    ],
    belt: ['repair_kit', 'grail_water', 'spinel_flask', 'kyanite_flask'],
    armor: {
      head: `${trait.frameModel || 'Mark-IV'} Sensor Visor`,
      torso: `${trait.frameModel || 'Mark-IV'} ${trait.baseArmor.type} Cuirass`,
      arms: `${trait.frameModel || 'Mark-IV'} Actuator Vambraces`,
      legs: `${trait.frameModel || 'Mark-IV'} Thruster Greaves`,
      generator: `${trait.reactor} Core Generator`,
    },
    installedMods: {},
    unlockedMods: [],
    unlockedEquipment: [w1],
    weaponGemMods: {},
  };
}

/**
 * Checks whether a weapon, shield, or quiver is unlocked/owned by the pilot.
 * When `bypassProgressionGates` is enabled (or tutorial is toggled off in sandbox), all 12 items are available.
 */
export function isEquipmentUnlocked(state: OrionState, weaponId: string): boolean {
  if (!weaponId) return false;
  if (state.bypassProgressionGates || !state.tutorialActive) return true;
  if (state.equippedWeapons?.includes(weaponId)) return true;
  const unlocked = state.equipmentSlots?.unlockedEquipment || [];
  return unlocked.includes(weaponId);
}

/**
 * Unlocks a weapon, shield, or quiver into `state.equipmentSlots.unlockedEquipment`.
 * If the pilot is at Level 2+ and only has 1 weapon equipped, automatically equips the new item into Set 2.
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

  const wasNew = !state.equipmentSlots.unlockedEquipment.includes(weaponId);
  if (wasNew) {
    state.equipmentSlots.unlockedEquipment.push(weaponId);
  }

  if (
    state.equippedWeapons.length < 2 &&
    (state.level >= 2 || !state.tutorialActive || state.bypassProgressionGates) &&
    state.equippedWeapons[0] !== weaponId
  ) {
    state.equippedWeapons.push(weaponId);
    state.equipmentSlots.weaponSet2 = [weaponId, null];
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

  unlockEquipmentItem(state, primary);
  unlockEquipmentItem(state, secondary);

  if (state.equippedWeapons.length === 0) {
    state.equippedWeapons = [primary, secondary];
  } else if (state.equippedWeapons.length === 1) {
    state.equippedWeapons.push(secondary);
  }
  if (state.equipmentSlots) {
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
  frameRepairOnSkillHit: number;
  heatVentOnBasicHit: number;
  armorRestoreOnKill: number;
  summaryLabel: string;
}

export const WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS: Record<GemId, string> = {
  moonstone: '+8 Max Shield & -10% Skill Cooldowns',
  spinel: '+15% Weapon DMG (+22% at ≥50 Heat)',
  carnelian: '+4 Armor Shred on Hit & +15 Presence',
  titanite: '+15 Max Shield & +4 Shield on Skill Hit',
  demantoid: '+3 Frame HP on Skill Hit & -15% Skill Heat Cost',
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

  const isRanged =
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
    frameRepairOnSkillHit: 0,
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
      base.frameRepairOnSkillHit = 3;
      base.skillHeatCostMult = 0.85;
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

export function isFeatNodeAvailable(
  state: OrionState,
  feat: FrameFeatDefinition
): boolean {
  if (state.bypassProgressionGates) return true;
  if (feat.id === 'knights_oath' && Boolean(state.flags?.lady_of_the_lake_defeated)) {
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
 * Consumes 1 assigned Trait Gem or Reactor Gem from inventory to raise a Trait Line Pilot Skill level (1–20).
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
      `${GEMSTONE_REGISTRY[gemId]?.name.toUpperCase() || gemId} DOES NOT FUND ${skillId.toUpperCase()}`
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
      `CONSUMED 1 ${gemName.toUpperCase()} → ${skillId.toUpperCase()} SKILL LV ${skill.level} · FEAT TIER ${newlyOpenedTier} UNLOCKED!`
    );
  } else {
    ctx?.say(
      `CONSUMED 1 ${gemName.toUpperCase()} → ${skillId.toUpperCase()} PILOT SKILL LV ${skill.level}/20`
    );
  }
  syncPostTutorialFrameLevel(state);
  return true;
}

/**
 * GEM USE 2 — FEAT NODE SOCKETING (Gems Removed from Inventory, Retained in Build, Refunded on Unsocket):
 * Installing the required Trait + Reactor Gems unlocks and activates the Feat Node.
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
    ctx?.say(
      `FEAT NODE LOCKED: REQUIRES ${feat.requiredSkillId.toUpperCase()} SKILL LV ${feat.requiredSkillLevel} (TIER ${feat.tier})`
    );
    return false;
  }

  // Check if player has all required Trait + Reactor Gems in inventory
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
  ctx?.say(
    `SOCKETED ${socketedLabels.join(' + ').toUpperCase()} (RETAINED IN BUILD) → ${feat.name.toUpperCase()} ACTIVE`
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
 * Gemstones are the sole currency for Pilot Skills, Feat Sockets, and Equipment Mods.
 * Preserved as a no-op hook for backward compatibility with combat callers.
 */
export function awardPilotSkillXp(
  _state: OrionState,
  _skillId: PilotSkillId,
  _amount: number,
  _ctx?: { say: (text: string) => void }
): boolean {
  return false;
}
