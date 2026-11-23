/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import { buildMagitechWeapon } from './builder';

// ─── CLERIC / SANCTUM LINEAGE MAGITECH PURIST RELICS (§3.3 & §4) ────────────

/**
 * Canonical database definition for `cl210SanctumMaceWeapon` (`CL-210 Sanctum Mace`, id `'cl210_sanctum_mace'`, `11 WT`, `1` Open Slot: `DELIVERY` + `1G`).
 * Preserved Legacy Epithet: `"this hallowed scepter"`.
 * Paired Specialist Stance: `Scepter & Ward` (`scepter_orb_specialist`, Tier II).
 */
export const cl210SanctumMaceWeapon = buildMagitechWeapon({
  id: 'cl210_sanctum_mace',
  code: 'CL-210',
  name: 'CL-210 Sanctum Mace',
  legacyEpithet: 'this hallowed scepter',
  category: 'Impact & Axes',
  weaponClass: 'Mace',
  primaryDamageType: 'Wave',
  adaptiveDamageTypes: ['Wave', 'Impact'],
  weightClass: 'medium',
  explicitEquipWeight: 11,
  gripMode: '1H',
  allowOneHandGrip: true,
  architectureTier: 'SEMI_SEALED_ASSEMBLY',
  openDomains: ['DELIVERY'],
  sealedDomains: {
    CONTACT: 'Consecrated emitter crown',
    DELIVERY: null,
    REGULATION: 'Sealed reliquary harmonic core',
  },
  action1Signature: 'Melee sweeps pulse minor shield restoration on finisher.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'scepter_orb_specialist',
    effectSummary: 'Scepter & Ward: Finisher sweeps pulse minor shield restoration while orbiting Ward Motes intercept fire.',
  },
  flavorText: 'Pilots revere this hallowed scepter of the border cathedrals.',
  loadoutSlots: ['Weapon 1', 'Weapon 4'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  supportPulseOnHit: { shieldRestore: 4, armorRestore: 3 },
  bladeTrailColor: '#a7f3d0',
  identity: 'Semi-Sealed Assembly · Scepter & Ward Primary (11 WT · 1 Open Mount + 1G)',
  lore: 'Consecrated reliquary mace whose sealed emitter crown and relic core pulse minor shield restoration on combo finishers. Pilots revere "this hallowed scepter" of the border cathedrals.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 1.05,
  reloadDurationSec: 0.55,
  range: 32,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Sanctum Finisher Wave-Sweep', desc: '4-hit consecrated mace combo dealing 13 Wave damage and pulsing +4 Shield on finisher.' },
    { name: 'Consecrated Shock-Mace', dmg: 24, cd: 4.5, heat: 13, dt: 'Impact', desc: 'Crushing scepter blow that releases a shield-mending wave.' },
    { name: 'Ranged Sanctuary Orb', dmg: 21, cd: 5.0, heat: 14, dt: 'Wave', desc: 'Projects a ranged Mana orb (85 range) that damages foes and repairs 12 Shield.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to raise the Sanctum Mace ward (0.34s Perfect Block window).' },
    { name: 'Reliquary Benediction', dmg: 32, cd: 8.5, heat: 22, desc: 'Slams the scepter to unleash a radial Wave blast (+22 Shield & +15 Armor).' },
  ],
});

/**
 * Canonical database definition for `cl150WardMoteWeapon` (`CL-150 Ward Mote`, id `'cl150_ward_mote'`, `6 WT`, `0` Open Slots: `SEALED_MONOLITH` + `1G`).
 * Paired Specialist Stance: `Scepter & Ward` (`scepter_orb_specialist`, Tier II).
 */
export const cl150WardMoteWeapon = buildMagitechWeapon({
  id: 'cl150_ward_mote',
  code: 'CL-150',
  name: 'CL-150 Ward Mote',
  category: 'Carriers & Munitions',
  weaponClass: 'Mote',
  primaryDamageType: 'Pulse',
  weightClass: 'light',
  explicitEquipWeight: 6,
  gripMode: 'DORSAL_CARRIER',
  architectureTier: 'SEALED_MONOLITH',
  openDomains: [],
  sealedDomains: {
    CONTACT: 'Hermetically sealed orbiting harmonic micro-shield motes',
    DELIVERY: 'Hermetically sealed grav-tether suspension array',
    REGULATION: 'Hermetically sealed sanctum resonance governor',
  },
  action1Signature: 'Orbiting harmonic micro-shields intercepting dispersed spell fire.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'scepter_orb_specialist',
    effectSummary: 'Scepter & Ward: Orbiting harmonic micro-shields intercept dispersed spell fire and restore barrier stability.',
  },
  flavorText: 'Hermetically sealed orbiting harmonic micro-shields (1G only) that intercept dispersed spell fire.',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  passiveShieldBonus: 20,
  supportPulseOnHit: { shieldRestore: 10, armorRestore: 6 },
  bladeTrailColor: '#4ade80',
  identity: 'Hermetically Sealed Monolith · Scepter & Ward Mote (6 WT · 0 Open Mounts + 1G)',
  lore: 'Sanctum orbiting harmonic mote array sealed inside an unbroken crystal lattice (6 WT, 0 component slots + 1G Resonance socket).',
  shotsPerChain: 4,
  damagePerShot: 10,
  chainDurationSec: 0.95,
  reloadDurationSec: 1.5,
  range: 72,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Orbiting Micro-Shield Intercept', desc: 'Orbiting harmonic motes intercept dispersed spell fire and pulse 10 Pulse damage.' },
    { name: 'Sanctum Cleanse Mote', dmg: 16, cd: 4.5, heat: 8, desc: 'Purifies hazard buildup and restores +18 Shield.' },
    { name: 'Harmonic Triage Orbit', dmg: 18, cd: 5.0, heat: 10, desc: 'Mends +16 Armor Durability via tethered ward motes.' },
    { name: 'Aegis Triage Wave', dmg: 18, cd: 6.0, heat: 10, dt: 'Wave', desc: 'Emits a harmonic restoration wave (+20 Shield & +16 Armor) while pushing back foes.' },
    { name: 'Sanctum Renewal Chorus', dmg: 28, cd: 8.5, heat: 18, dt: 'Wave', desc: 'Full-field mote burst restoring +30 Shield & +24 Armor and staggering nearby threats.' },
  ],
});

/**
 * Canonical database definition for `cl500AbsolutionWeapon` (`CL-500 Absolution`, id `'cl500_absolution'`, `13 WT`, `1` Open Slot: `REGULATION` + `1G`).
 * Preserved Legacy Epithet: `"Grace Edge"`.
 * Paired Core Feat Chain: `C-18` Harmonic Triage (`Mass Restoration`).
 */
export const cl500AbsolutionWeapon = buildMagitechWeapon({
  id: 'cl500_absolution',
  code: 'CL-500',
  name: 'CL-500 Absolution',
  legacyEpithet: 'Grace Edge',
  category: 'Casters',
  weaponClass: 'Beam Caster',
  primaryDamageType: 'Beam',
  weightClass: 'medium',
  explicitEquipWeight: 13,
  gripMode: '2H',
  architectureTier: 'SEMI_SEALED_ASSEMBLY',
  openDomains: ['REGULATION'],
  sealedDomains: {
    CONTACT: 'Consecrated purification crystal emitter (Grace Edge core)',
    DELIVERY: 'Sealed heartwell harmonic focus chamber',
    REGULATION: null,
  },
  action1Signature: 'Damages enemies and restores ally/self shields in its path.',
  puristResonance: {
    triggerType: 'CORE_FEAT_CHAIN',
    targetId: 'C-18',
    effectSummary: 'C-18 Harmonic Triage (Mass Restoration): Sustained beam ticks restore ally and self shields along its path.',
  },
  flavorText: 'Carries the consecrated Grace Edge emitter core.',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#86efac',
  identity: 'Semi-Sealed Assembly · Core Chain C-18 Apex (13 WT · 1 Open Mount + 1G)',
  lore: 'Sanctum beam projector housing the consecrated "Grace Edge" purification crystal emitter core. Damages enemies and restores ally/self shields in its path.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.5,
  reloadDurationSec: 2.8,
  range: 96,
  supportPulseOnHit: { shieldRestore: 4, heatVent: 2 },
  isPlaceholderAsset: false,
  skills: [
    { name: 'Purification Beam Stream', desc: '9-tick sustained beam dealing 6 Beam damage and restoring +4 Shield / -2 Heat per hit.' },
    { name: 'Absolution Cleansing Wave', dmg: 21, cd: 4.8, heat: 14, dt: 'Wave', desc: 'Area purification pulse that restores 14 Shield and vents 8 Heat.' },
    { name: 'Refractive Grace Ray', dmg: 22, cd: 5.2, heat: 15, desc: 'Sustained Grace Edge beam that buffs armor rating while channeling.' },
    { name: 'Sanctified Curtain', dmg: 16, cd: 5.0, heat: 13, desc: 'Sweeps a protective light barrier across the firing lane.' },
    { name: 'Solar Benediction', dmg: 32, cd: 8.5, heat: 24, desc: 'High-output purification beam that fully stabilizes shield harmonics.' },
  ],
});

// ─── BACKWARD-COMPATIBLE ALIAS EXPORTS ──────────────────────────────────────

/**
 * Backward-compatible alias for `cl210SanctumMaceWeapon` (legacy `hallowed_scepter`).
 */
export const hallowedScepterWeapon: WeaponDefinition = {
  ...cl210SanctumMaceWeapon,
  id: 'hallowed_scepter',
};

/**
 * Backward-compatible alias for `cl500AbsolutionWeapon` (legacy `grace_edge`).
 */
export const graceEdgeWeapon: WeaponDefinition = {
  ...cl500AbsolutionWeapon,
  id: 'grace_edge',
};

/**
 * Backward-compatible alias for `cl500AbsolutionWeapon` (legacy `cl700_sanctifier`).
 */
export const cl700SanctifierWeapon: WeaponDefinition = {
  ...cl500AbsolutionWeapon,
  id: 'cl700_sanctifier',
};

/**
 * Backward-compatible alias for `cl210SanctumMaceWeapon` (legacy `cl350_litany`).
 */
export const cl350LitanyWeapon: WeaponDefinition = {
  ...cl210SanctumMaceWeapon,
  id: 'cl350_litany',
};

/**
 * Backward-compatible alias for `cl150WardMoteWeapon` (legacy `utility_sanctum_font`).
 */
export const utilitySanctumFontAuxiliary: WeaponDefinition = {
  ...cl150WardMoteWeapon,
  id: 'utility_sanctum_font',
};

/**
 * Backward-compatible alias for `cl150WardMoteWeapon` (legacy `aux3_sanc_restoration_field`).
 */
export const aux3SancRestorationFieldAuxiliary: WeaponDefinition = {
  ...cl150WardMoteWeapon,
  id: 'aux3_sanc_restoration_field',
};

/**
 * Backward-compatible alias for `cl150WardMoteWeapon` (legacy `aux4_sanc_martyrdom_plating`).
 */
export const aux4SancMartyrdomPlatingAuxiliary: WeaponDefinition = {
  ...cl150WardMoteWeapon,
  id: 'aux4_sanc_martyrdom_plating',
};
