/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import {
  AETHER_CATALYST_STRIP,
} from './base_sprites';
import { buildMagitechWeapon } from './builder';

// ─── WIZARD / ARCANUM LINEAGE MAGITECH PURIST RELICS (§3.3 & §4) ────────────

/**
 * Canonical database definition for `wz310AetherSpathaWeapon` (`WZ-310 Aether Spatha`, id `'wz310_aether_spatha'`, `8 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Spellblade` (`battlemage_specialist`, Tier II).
 */
export const wz310AetherSpathaWeapon = buildMagitechWeapon({
  id: 'wz310_aether_spatha',
  code: 'WZ-310',
  name: 'WZ-310 Aether Spatha',
  category: 'Blades: Straight',
  weaponClass: 'Spatha',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 8,
  gripMode: '1H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Conduit-channeled blade whose 3rd combo step releases a short Pulse arc',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Conduit-channeled blade whose 3rd combo step releases a short Pulse arc.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'battlemage_specialist',
    effectSummary: 'Aether-Conduit Edge: Off-hand caster hits charge the blade for +15% BCU.',
  },
  flavorText: 'Arcanum spellblade spatha etched with sealed aether conduits that discharge a short Pulse arc on every third swing.',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#38bdf8',
  identity: 'Modular-Frame Relic · Spellblade Primary (8 WT · 2 Open Mounts + 1G)',
  lore: 'Conduit-channeled Arcanum spatha whose sealed fuller crystal stores off-hand caster charge and releases a short Pulse arc on the third combo step.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 0.9,
  reloadDurationSec: 0.45,
  range: 29,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Aether-Conduit 3rd-Step Arc', desc: '4-step spellblade chain dealing 13 Pierce damage and releasing a Pulse arc on step 3.' },
    { name: 'Charged Spellblade Thrust', dmg: 24, cd: 4.0, heat: 11, dt: 'Pulse', desc: 'Discharges stored off-hand caster charge in a piercing lightning lunge.' },
    { name: 'Conduit Edge Sweep', dmg: 19, cd: 4.5, heat: 11, desc: 'Sweeping arc that destabilizes enemy energy barriers.' },
    { name: 'Block', dmg: 10, cd: 0, heat: 2, isBlock: true, desc: 'Hold to project an aether-blade parry ward (0.34s Perfect Block window).' },
    { name: 'Battlemage Fulmination', dmg: 32, cd: 7.8, heat: 22, dt: 'Pulse', desc: 'Drives the spatha into the ground to detonate a chained Pulse burst.' },
  ],
});

/**
 * Canonical database definition for `wz450SparkstrikeWeapon` (`WZ-450 Sparkstrike`, id `'wz450_sparkstrike'`, `10 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Spellblade` (`battlemage_specialist`, Tier II).
 */
export const wz450SparkstrikeWeapon = buildMagitechWeapon({
  id: 'wz450_sparkstrike',
  code: 'WZ-450',
  name: 'WZ-450 Sparkstrike',
  category: 'Casters',
  weaponClass: 'Arc Caster',
  primaryDamageType: 'Pulse',
  weightClass: 'medium',
  explicitEquipWeight: 10,
  gripMode: '1H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Rapid-cycling arc induction coil',
    REGULATION: null,
  },
  action1Signature: 'Close-range chaining arc carbine.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'battlemage_specialist',
    effectSummary: 'Aether-Conduit Edge: Off-hand Sparkstrike hits charge the paired Spatha for +15% BCU.',
  },
  flavorText: 'Rapid-cycling arc induction carbine designed for one-handed Spellblade off-hand or primary discharge.',
  loadoutSlots: ['Weapon 3', 'Aux 2'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#22d3ee',
  identity: 'Modular-Frame Relic · Spellblade Arc Caster (10 WT · 2 Open Mounts + 1G)',
  lore: 'High-capacitance arc caster built around a sealed rapid-cycling induction coil for close-range chaining arc bursts.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.25,
  reloadDurationSec: 2.5,
  range: 82,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Chaining Arc Carbine Burst', desc: '9-shot close-range chaining arc burst dealing 6 Pulse damage per bolt.' },
    { name: 'Arc-Jolt Volley', dmg: 22, cd: 4.0, heat: 14, desc: 'Electromagnetic pulse burst that disrupts enemy shield regeneration.' },
    { name: 'Static Repulsor Blast', dmg: 20, cd: 5.0, heat: 15, dt: 'Wave', desc: 'Close-range shock discharge that pushes back melee rushers.' },
    { name: 'Chain-Spark Tag', dmg: 17, cd: 4.8, heat: 14, desc: 'Arcs secondary lightning between nearby enemies.' },
    { name: 'Capacitor Storm', dmg: 32, cd: 8.0, heat: 26, desc: 'Unleashes a rapid-fire storm of overcharged pulse bolts.' },
  ],
});

/**
 * Canonical database definition for `arcConductorWeapon` (`ARC Conductor`, id `'arc_conductor'`, `5 WT`, `0` Open Slots: `SEALED_MONOLITH` + `1G`).
 * Paired Specialist Stance: `Spellblade` (`battlemage_specialist`, Tier II).
 */
export const arcConductorWeapon = buildMagitechWeapon({
  id: 'arc_conductor',
  code: 'ARC-01',
  name: 'ARC Conductor',
  category: 'Casters',
  weaponClass: 'Arc Caster',
  primaryDamageType: 'Pulse',
  weightClass: 'light',
  explicitEquipWeight: 5,
  gripMode: '1H',
  architectureTier: 'SEALED_MONOLITH',
  openDomains: [],
  sealedDomains: {
    CONTACT: 'Hermetically sealed crystal discharge tip',
    DELIVERY: 'Hermetically sealed self-charging micro-capacitor core',
    REGULATION: 'Hermetically sealed thermal-null wand casing',
  },
  action1Signature: 'Ultralight 5 WT emergency arc-wand sidearm.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'battlemage_specialist',
    effectSummary: 'Aether-Conduit Edge: Ultralight 5 WT off-hand arc snaps charge the paired Spatha for +15% BCU.',
  },
  flavorText: 'Hermetically sealed ultralight 5 WT emergency arc-wand sidearm (1G only) for featherweight Spellblade rigs.',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#38bdf8',
  identity: 'Hermetically Sealed Monolith · Spellblade Ultralight Wand (5 WT · 0 Open Mounts + 1G)',
  lore: 'Compact holstered arc-wand sidearm with a hermetically sealed capacitor casing (5 WT, 0 component slots + 1G Resonance socket).',
  shotsPerChain: 6,
  damagePerShot: 8,
  chainDurationSec: 0.95,
  reloadDurationSec: 1.6,
  range: 70,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Quick-Draw Arc-Wand Snap', desc: '6-shot ultralight arc-wand chain dealing 8 Pulse damage per shot.' },
    { name: 'Overload Stun-Bolt', dmg: 19, cd: 3.8, heat: 10, desc: 'High-voltage sidearm shot that briefly staggers an approaching threat.' },
    { name: 'Capacitor Skim Shot', dmg: 17, cd: 4.2, heat: -6, desc: 'Siphons residual charge to vent 6 Reactor Heat on hit.' },
    { name: 'Point-Defense Double', dmg: 16, cd: 4.0, heat: 9, desc: 'Instant two-shot defensive snap fire.' },
    { name: 'Arc-Flash Discharge', dmg: 27, cd: 7.0, heat: 18, desc: 'Dumps the entire wand cell in a blinding pulse cone.' },
  ],
});

/**
 * Canonical database definition for `wz200ManacoreStaffWeapon` (`WZ-200 Manacore Staff`, id `'wz200_manacore_staff'`, `14 WT`, `1` Open Slot: `REGULATION` + `1G`).
 * Paired Specialist Stance: `Archmage Staff` (`manacore_staff_specialist`, Tier III).
 */
export const wz200ManacoreStaffWeapon = buildMagitechWeapon({
  id: 'wz200_manacore_staff',
  code: 'WZ-200',
  name: 'WZ-200 Manacore Staff',
  category: 'Spears',
  weaponClass: 'Partisan',
  primaryDamageType: 'Wave',
  weightClass: 'medium',
  explicitEquipWeight: 14,
  gripMode: '2H',
  architectureTier: 'SEMI_SEALED_ASSEMBLY',
  openDomains: ['REGULATION'],
  sealedDomains: {
    CONTACT: 'Mana-discharge polearm head & resonant Manacore crown',
    DELIVERY: 'Continuous crystal conduit shaft',
    REGULATION: null,
  },
  action1Signature: 'Mana-discharge polearm head and crystal conduit shaft.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'manacore_staff_specialist',
    effectSummary: 'Astral Fulcrum: Stationary casting (μ = 0) widens wave radius by +20%.',
  },
  flavorText: 'Conduit partisan staff crowned with a sealed Manacore sphere that detonates radial wave discharges.',
  loadoutSlots: ['Weapon 4'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#60a5fa',
  identity: 'Semi-Sealed Assembly · Archmage Staff Primary (14 WT · 1 Open Mount + 1G)',
  lore: 'Conduit partisan staff with a factory-sealed Manacore polearm head and crystal conduit shaft, exposing only its butt-cap regulation socket.',
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDurationSec: 1.2,
  reloadDurationSec: 0.7,
  range: 38,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Manacore Wave Pulse', desc: '4-stage conduit staff combo projecting 14 Wave (Mana) damage pulses.' },
    { name: 'Resonance Detonation', dmg: 28, cd: 5.0, heat: 18, desc: 'Radial AoE Mana discharge that clears surrounding space.' },
    { name: 'Area-Denial Flux Field', dmg: 24, cd: 6.0, heat: 20, desc: 'Plants a lingering Mana shock-ring that damages and slows intruders.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to project a Manacore repulsion ward (0.34s Perfect Block window).' },
    { name: 'Singularity Collapse', dmg: 38, cd: 9.5, heat: 32, desc: 'Implodes the staff’s Manacore field in a massive Wave blast.' },
  ],
});

/**
 * Canonical database definition for `wz650PrismLanceWeapon` (`WZ-650 Prism Lance`, id `'wz650_prism_lance'`, `12 WT`, `0` Open Slots: `SEALED_MONOLITH` + `1G`).
 * Paired Specialist Stance: `Archmage Staff` (`manacore_staff_specialist`, Tier III).
 */
export const wz650PrismLanceWeapon = buildMagitechWeapon({
  id: 'wz650_prism_lance',
  code: 'WZ-650',
  name: 'WZ-650 Prism Lance',
  category: 'Casters',
  weaponClass: 'Beam Caster',
  primaryDamageType: 'Beam',
  weightClass: 'medium',
  explicitEquipWeight: 12,
  gripMode: 'VERSATILE',
  allowOneHandGrip: true,
  architectureTier: 'SEALED_MONOLITH',
  openDomains: [],
  sealedDomains: {
    CONTACT: 'Hermetically sealed monolithic focusing-crystal barrel',
    DELIVERY: 'Hermetically sealed variable-aperture optical train',
    REGULATION: 'Hermetically sealed polychromatic harmonic heatsink',
  },
  action1Signature: 'Monolithic focusing-crystal barrel with variable beam intensity.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'manacore_staff_specialist',
    effectSummary: 'Astral Fulcrum: Stationary focus (μ = 0) amplifies variable prism beam coherence and wave radius by +20%.',
  },
  flavorText: 'Hermetically sealed monolithic focusing-crystal barrel (1G only) grown from a single synthetic sapphire boule.',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#7dd3fc',
  identity: 'Hermetically Sealed Monolith · Archmage Staff Beam Lance (12 WT · 0 Open Mounts + 1G)',
  lore: 'Monolithic crystal-focus beam lance grown as a single optical lattice (0 component slots + 1G Resonance socket).',
  shotsPerChain: 7,
  damagePerShot: 8,
  chainDurationSec: 1.4,
  reloadDurationSec: 2.8,
  range: 118,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Variable Prism Ray', desc: '7-shot monolithic crystal beam chain dealing 8 Beam damage per pulse.' },
    { name: 'High-Aperture Focus', dmg: 26, cd: 4.5, heat: 16, desc: 'Tightens the crystal lens for a high-penetration pinpoint beam.' },
    { name: 'Prismatic Split', dmg: 22, cd: 5.0, heat: 18, desc: 'Refracts the beam into a multi-angle prism fan.' },
    { name: 'Harmonic Lens Lock', dmg: 18, cd: 5.0, heat: 14, desc: 'Attunes crystal frequency to amplify subsequent Beam damage.' },
    { name: 'Spectrum Cascade', dmg: 35, cd: 8.5, heat: 28, desc: 'Fires a full-spectrum polychromatic beam burst.' },
  ],
});

/**
 * Canonical database definition for `wz800ArclightCannonWeapon` (`WZ-800 Arclight Cannon`, id `'wz800_arclight_cannon'`, `19 WT`, `1` Open Slot: `REGULATION` + `1G`).
 * Paired Core Feat Chain: `C-04` Beam Artillery (`Arcane Annihilation`).
 */
export const wz800ArclightCannonWeapon = buildMagitechWeapon({
  id: 'wz800_arclight_cannon',
  code: 'WZ-800',
  name: 'WZ-800 Arclight Cannon',
  category: 'Casters',
  weaponClass: 'Beam Caster',
  primaryDamageType: 'Beam',
  weightClass: 'heavy',
  explicitEquipWeight: 19,
  gripMode: '2H',
  architectureTier: 'SEMI_SEALED_ASSEMBLY',
  openDomains: ['REGULATION'],
  sealedDomains: {
    CONTACT: 'Heavy thermal focusing array',
    DELIVERY: 'High-capacity arclight capacitor bank',
    REGULATION: null,
  },
  action1Signature: 'Sustained thermal beam (+20% Armor DUR scour).',
  puristResonance: {
    triggerType: 'CORE_FEAT_CHAIN',
    targetId: 'C-04',
    effectSummary: 'C-04 Beam Artillery (Arcane Annihilation): While Anchored Focus is active, beam heat buildup is reduced by -15%.',
  },
  flavorText: 'Core-Chain C-04 Apex heavy beam cannon with a factory-sealed thermal focusing array and capacitor bank.',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#38bdf8',
  identity: 'Semi-Sealed Assembly · Core Chain C-04 Apex (19 WT · 1 Open Mount + 1G)',
  lore: 'Heavy crystal-lattice beam cannon that projects continuous long-range thermal lances (+20% Armor DUR scour) while exposing its rear cooling port.',
  shotsPerChain: 10,
  damagePerShot: 6,
  chainDurationSec: 1.7,
  reloadDurationSec: 3.3,
  range: 135,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Sustained Thermal Arclight', desc: '10-tick sustained thermal beam dealing 6 Beam damage per tick (+20% Armor DUR scour).' },
    { name: 'Ionizing Lance', dmg: 28, cd: 5.0, heat: 20, desc: 'High-output beam spike that overloads enemy energy shields.' },
    { name: 'Refraction Sweep', dmg: 24, cd: 5.5, heat: 22, desc: 'Sweeps a continuous laser arc across multiple targets.' },
    { name: 'Capacitor Vent Pulse', dmg: 18, cd: 5.0, heat: -10, dt: 'Pulse', desc: 'Discharges waste heat as a protective electromagnetic pulse.' },
    { name: 'Omega Convergence', dmg: 40, cd: 9.5, heat: 36, desc: 'Full-reactor arclight beam that bores through all targets in line.' },
  ],
});

// ─── BACKWARD-COMPATIBLE ALIAS EXPORTS & BASE CUSTOMIZABLE CATALYST ─────────

/**
 * Backward-compatible alias for `arcConductorWeapon` (legacy `utility_arclight_capacitor`).
 */
export const utilityArclightCapacitorAuxiliary: WeaponDefinition = {
  ...arcConductorWeapon,
  id: 'utility_arclight_capacitor',
};

/**
 * Backward-compatible alias for `wz650PrismLanceWeapon` (legacy `aux3_arc_prismatic_barrier`).
 */
export const aux3ArcPrismaticBarrierAuxiliary: WeaponDefinition = {
  ...wz650PrismLanceWeapon,
  id: 'aux3_arc_prismatic_barrier',
};

/**
 * Backward-compatible alias for `wz450SparkstrikeWeapon` (legacy `aux4_arc_feedback_capacitor`).
 */
export const aux4ArcFeedbackCapacitorAuxiliary: WeaponDefinition = {
  ...wz450SparkstrikeWeapon,
  id: 'aux4_arc_feedback_capacitor',
};

/**
 * Canonical database definition for `aetherCatalystWeapon` (`Sanctum Æther Catalyst`, id `'aether_catalyst'`, load `'light'`) — Resonant Grail-lattice catalyst auxiliary that channels reactor energy into Skill 4 & Skill 5 harmonic waves.
 */
export const aetherCatalystWeapon: WeaponDefinition = {
  id: 'aether_catalyst',
  name: 'Sanctum Æther Catalyst',
  category: 'Carriers & Munitions',
  weaponTier: 'customizable',
  class: 'Auxiliary Catalyst (Skill 4 & 5)',
  weaponClass: 'Catalyst',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  weightClass: 'light',
  passiveShieldBonus: 10,
  bladeTrailColor: '#c084fc',
  description:
    'Resonant Grail-lattice catalyst auxiliary that channels reactor energy into Skill 4 & Skill 5 harmonic waves.',
  lore:
    'Carried by Sanctum Clerics and Wizards in the Side Hand or Auxiliary slot. Auxiliaries provide only Skill 4 and Skill 5, replacing those slots when active.',
  shotsPerChain: 4,
  damagePerShot: 10,
  chainDurationSec: 1.0,
  reloadDurationSec: 1.6,
  primaryDamageType: 'Wave',
  variantStripBase64: AETHER_CATALYST_STRIP,
  hardpointSprite: {
    base64: AETHER_CATALYST_STRIP,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 12,
    renderHeight: 12,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: AETHER_CATALYST_STRIP,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  isPlaceholderAsset: false,
  moveset: [
    {
      slot: 0,
      name: 'Catalyst Pulse',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 10,
      tellDurationSec: 0.08,
      actionDurationSec: 0.25,
      cooldownSec: 0,
      heatCost: 2,
      range: 80,
      description: 'Auxiliary focus node (Auxiliaries only expose Skill 4 and Skill 5).',
    },
    {
      slot: 1,
      name: 'Resonance Channel',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 12,
      tellDurationSec: 0.1,
      actionDurationSec: 0.28,
      cooldownSec: 2.0,
      heatCost: 4,
      range: 85,
      description: 'Auxiliary focus node (Auxiliaries only expose Skill 4 and Skill 5).',
    },
    {
      slot: 2,
      name: 'Harmonic Attune',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 14,
      tellDurationSec: 0.12,
      actionDurationSec: 0.3,
      cooldownSec: 3.0,
      heatCost: 6,
      range: 90,
      description: 'Auxiliary focus node (Auxiliaries only expose Skill 4 and Skill 5).',
    },
    {
      slot: 3,
      name: 'Aether Disruption Wave',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 22,
      tellDurationSec: 0.18,
      actionDurationSec: 0.35,
      cooldownSec: 4.5,
      heatCost: 12,
      range: 85,
      description: 'Channels reactor wave energy to bleed directly through shields, hitting frame durability.',
    },
    {
      slot: 4,
      name: 'Catalytic Overcharge',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 30,
      tellDurationSec: 0.3,
      actionDurationSec: 0.55,
      cooldownSec: 7.0,
      heatCost: 20,
      range: 95,
      description: 'Supercharges the catalyst lattice to release a wide-angle wave pulse that destabilizes barriers.',
    },
  ],
};
