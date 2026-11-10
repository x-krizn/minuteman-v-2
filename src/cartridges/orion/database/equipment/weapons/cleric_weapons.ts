/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildMagitechWeapon } from './builder';

// ─── CLERIC / SANCTUM LINEAGE MAGITECH WEAPONS ──────────────────────────────

/**
 * Canonical database definition for `cl700SanctifierWeapon` (`CL-700 Sanctifier`, id `'cl700_sanctifier'`, load `'medium'`) — Adaptive damage type per target.
 */
export const cl700SanctifierWeapon = buildMagitechWeapon({
  id: 'cl700_sanctifier',
  name: 'CL-700 Sanctifier',
  weaponClass: 'Hybrid Rifle',
  primaryDamageType: 'Beam',
  adaptiveDamageTypes: ['Beam', 'Pierce'],
  weightClass: 'medium',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#4ade80',
  identity: 'Adaptive damage type per target',
  lore: 'Dual-chamber sanctum hybrid rifle that automatically adapts between coherent Beam (vs. Shields/Armor) and kinetic Pierce per target.',
  shotsPerChain: 8,
  damagePerShot: 7,
  chainDurationSec: 1.4,
  reloadDurationSec: 2.7,
  range: 100,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Adaptive Sanctifier Salvo', desc: '8-shot hybrid burst adapting between Beam and Pierce damage based on target defense.' },
    { name: 'Dual-Phase Piercer', dmg: 23, cd: 4.5, heat: 14, dt: 'Pierce', desc: 'Fires a kinetic-core bolt wrapped in a shield-stripping beam sheath.' },
    { name: 'Harmonic Target Mark', dmg: 19, cd: 5.0, heat: 13, desc: 'Attunes target resonance so all damage types strike at peak efficiency.' },
    { name: 'Sanctum Warden Burst', dmg: 18, cd: 5.0, heat: 12, desc: 'Defensive burst that restores 6 Shield capacity on hit.' },
    { name: 'Equilibrium Convergence', dmg: 33, cd: 8.5, heat: 25, desc: 'Simultaneous Beam + Pierce discharge that pierces all defense layers.' },
  ],
});

/**
 * Canonical database definition for `cl500AbsolutionWeapon` (`CL-500 Absolution`, id `'cl500_absolution'`, load `'medium'`) — Area purification, ally buff on sustained fire.
 */
export const cl500AbsolutionWeapon = buildMagitechWeapon({
  id: 'cl500_absolution',
  name: 'CL-500 Absolution',
  weaponClass: 'Beam Projector',
  primaryDamageType: 'Beam',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#86efac',
  identity: 'Area purification, ally buff on sustained fire',
  lore: 'Sanctum beam projector whose sustained purification ray cleanses hazard build-up and reinforces allied/pilot shield buffers.',
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
    { name: 'Refractive Grace Ray', dmg: 22, cd: 5.2, heat: 15, desc: 'Sustained beam that buffs armor rating while channeling.' },
    { name: 'Sanctified Curtain', dmg: 16, cd: 5.0, heat: 13, desc: 'Sweeps a protective light barrier across the firing lane.' },
    { name: 'Solar Benediction', dmg: 32, cd: 8.5, heat: 24, desc: 'High-output purification beam that fully stabilizes shield harmonics.' },
  ],
});

/**
 * Canonical database definition for `cl350LitanyWeapon` (`CL-350 Litany`, id `'cl350_litany'`, load `'medium'`) — Ally buff application on hit.
 */
export const cl350LitanyWeapon = buildMagitechWeapon({
  id: 'cl350_litany',
  name: 'CL-350 Litany',
  weaponClass: 'Support Carbine',
  primaryDamageType: 'Pulse',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#34d399',
  identity: 'Ally buff application on hit',
  lore: 'Harmonic support carbine whose telemetry-linked pulse rounds trigger restorative shield and plating micro-buffs on every hit.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.3,
  reloadDurationSec: 2.5,
  range: 88,
  supportPulseOnHit: { shieldRestore: 3, armorRestore: 2 },
  isPlaceholderAsset: false,
  skills: [
    { name: 'Litany Harmonic Burst', desc: '9-shot support carbine burst dealing 6 Pulse damage and restoring +3 Shield / +2 Armor on hit.' },
    { name: 'Resonant Beacon Shot', dmg: 20, cd: 4.2, heat: 12, desc: 'Tags target with a harmonic beacon that restores 10 Shield on follow-up hits.' },
    { name: 'Plating Knit Volley', dmg: 19, cd: 5.0, heat: 14, desc: 'Nanite-carrier pulse burst that repairs +10 Armor durability.' },
    { name: 'Pacifying Cadence', dmg: 16, cd: 4.8, heat: 12, desc: 'Dampens target aggression and reduces incoming hit damage.' },
    { name: 'Chorus of Renewal', dmg: 30, cd: 8.0, heat: 22, desc: 'Full-cadence pulse salvo that restores 20 Shield and 12 Armor.' },
  ],
});

/**
 * Canonical database definition for `hallowedScepterWeapon` (`Hallowed Scepter`, id `'hallowed_scepter'`, load `'medium'`) — Melee + ranged healing pulses.
 */
export const hallowedScepterWeapon = buildMagitechWeapon({
  id: 'hallowed_scepter',
  name: 'Hallowed Scepter',
  weaponClass: 'Hybrid Staff',
  primaryDamageType: 'Wave',
  adaptiveDamageTypes: ['Wave', 'Impact'],
  weightClass: 'medium',
  loadoutSlots: ['Weapon 4'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#a7f3d0',
  identity: 'Melee + ranged healing pulses',
  lore: 'Reliquary hybrid mace-staff that combines heavy Impact strikes with ranged Mana-wave restoration pulses.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 1.05,
  reloadDurationSec: 0.55,
  range: 34,
  supportPulseOnHit: { shieldRestore: 4, armorRestore: 3 },
  isPlaceholderAsset: false,
  skills: [
    { name: 'Scepter Wave-Strike', desc: '4-hit hybrid melee/wave combo dealing 13 Wave/Impact damage and pulsing +4 Shield / +3 Armor.' },
    { name: 'Consecrated Shock-Mace', dmg: 24, cd: 4.5, heat: 13, dt: 'Impact', desc: 'Crushing scepter blow that releases a shield-mending wave.' },
    { name: 'Ranged Sanctuary Orb', dmg: 21, cd: 5.0, heat: 14, dt: 'Wave', desc: 'Projects a ranged Mana orb (85 range) that damages foes and repairs 12 Shield.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to raise the Hallowed Scepter ward (0.25s Perfect Block window).' },
    { name: 'Reliquary Benediction', dmg: 32, cd: 8.5, heat: 22, desc: 'Slams the scepter to unleash a radial Wave blast (+22 Shield & +15 Armor).' },
  ],
});

/**
 * Canonical database definition for `graceEdgeWeapon` (`Grace Edge`, id `'grace_edge'`, load `'light'`) — Healing pulse on critical hit.
 */
export const graceEdgeWeapon = buildMagitechWeapon({
  id: 'grace_edge',
  name: 'Grace Edge',
  weaponClass: 'Consecrated Blade',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#6ee7b7',
  identity: 'Healing pulse on critical hit',
  lore: 'Slender consecrated sidearm blade wired with a heartwell capacitor that emits a restorative shield/plating pulse on critical strikes.',
  shotsPerChain: 4,
  damagePerShot: 11,
  chainDurationSec: 0.8,
  reloadDurationSec: 0.4,
  range: 24,
  supportPulseOnHit: { shieldRestore: 5, armorRestore: 2 },
  isPlaceholderAsset: false,
  skills: [
    { name: 'Consecrated Rapier Slash', desc: '4-hit precision blade combo dealing 11 Pierce damage and pulsing +5 Shield on hit.' },
    { name: 'Mercy Critical Lunge', dmg: 23, cd: 4.0, heat: 10, desc: 'High-precision thrust that triggers a double healing pulse (+14 Shield).' },
    { name: 'Heartwell Riposte', dmg: 18, cd: 4.5, heat: 9, desc: 'Graceful counter-slash that vents 6 Heat and mends 8 Armor.' },
    { name: 'Block', dmg: 11, cd: 0, heat: 2, isBlock: true, desc: 'Hold to parry with the consecrated blade (0.25s Perfect Block window).' },
    { name: 'Halo Sever', dmg: 28, cd: 7.5, heat: 18, dt: 'Wave', desc: 'Sweeping luminous arc that damages hostiles and restores 16 Shield.' },
  ],
});

// ─── CLERIC / SANCTUM AUXILIARIES (Migrated from Utility, Aux 3 & Aux 4) ────

/**
 * Canonical database definition for `utilitySanctumFontAuxiliary` (`SANC Radiant Ward Projector`, id `'utility_sanctum_font'`, load `'medium'`) — Deployable barrier absorbs status effects and damage (+20 Shield, +16 Armor).
 */
export const utilitySanctumFontAuxiliary = buildMagitechWeapon({
  id: 'utility_sanctum_font',
  name: 'SANC Radiant Ward Projector',
  weaponClass: 'Status Ward Barrier',
  primaryDamageType: 'Wave',
  weightClass: 'medium',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  canBlock: true,
  passiveShieldBonus: 20,
  passiveArmorBonus: 16,
  supportPulseOnHit: { shieldRestore: 12, armorRestore: 10 },
  bladeTrailColor: '#4ade80',
  identity: 'Deployable barrier absorbs status effects and damage (+20 Shield, +16 Armor)',
  lore: 'Sanctum Radiant Ward Projector converted into an off-hand/back Auxiliary shield that purifies status buildup and mends both defense layers.',
  shotsPerChain: 3,
  damagePerShot: 10,
  chainDurationSec: 0.95,
  reloadDurationSec: 0.5,
  range: 34,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Ward Pulse', desc: 'Consecrated barrier pulse.' },
    { name: 'Sanctum Cleanse', dmg: 16, cd: 4.5, heat: 8, desc: 'Purifies hazard buildup and restores +18 Shield.' },
    { name: 'Font of Grace', dmg: 18, cd: 5.0, heat: 10, desc: 'Mends +18 Armor Durability.' },
    { name: 'Block', dmg: 10, cd: 0, heat: 2, isBlock: true, desc: 'Hold to deploy the SANC Radiant Ward barrier (0.25s Perfect Block window).' },
    { name: 'Benediction Sanctuary Wave', dmg: 28, cd: 8.5, heat: 14, dt: 'Wave', desc: 'Radiates a consecrated ward wave that restores +30 Shield and +25 Armor.' },
  ],
});

/**
 * Canonical database definition for `aux3SancRestorationFieldAuxiliary` (`SANC Aegis Restoration Field`, id `'aux3_sanc_restoration_field'`, load `'medium'`) — Area-effect shield and armor repair field (+22 Shield, active Armor mend).
 */
export const aux3SancRestorationFieldAuxiliary = buildMagitechWeapon({
  id: 'aux3_sanc_restoration_field',
  name: 'SANC Aegis Restoration Field',
  weaponClass: 'Repair Field',
  primaryDamageType: 'Wave',
  weightClass: 'medium',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  passiveShieldBonus: 22,
  supportPulseOnHit: { shieldRestore: 12, armorRestore: 12 },
  bladeTrailColor: '#34d399',
  identity: 'Area-effect shield and armor repair field (+22 Shield, active Armor mend)',
  lore: 'Sanctum harmonic emitter that projects a continuous restoration field, knitting damaged frame plating and recharging barriers.',
  shotsPerChain: 3,
  damagePerShot: 10,
  chainDurationSec: 0.95,
  reloadDurationSec: 1.5,
  range: 72,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Restoration Pulse', desc: 'Auxiliary focus node.' },
    { name: 'Aegis Knit', dmg: 14, cd: 4.5, heat: 8, desc: 'Auxiliary focus node.' },
    { name: 'Harmonic Triage', dmg: 16, cd: 5.0, heat: 10, desc: 'Auxiliary focus node.' },
    { name: 'Aegis Triage Wave', dmg: 18, cd: 6.0, heat: 10, dt: 'Wave', desc: 'Emits a harmonic restoration wave (+20 Shield & +20 Armor) while pushing back foes.' },
    { name: 'Sanctum Renewal Chorus', dmg: 28, cd: 8.5, heat: 18, dt: 'Wave', desc: 'Full-field triage burst restoring +32 Shield & +28 Armor and staggering nearby threats.' },
  ],
});

/**
 * Canonical database definition for `aux4SancMartyrdomPlatingAuxiliary` (`SANC Martyrdom Plating`, id `'aux4_sanc_martyrdom_plating'`, load `'medium'`) — Reactive armor redirects damage into counter-waves (+24 Armor, +10 Shield).
 */
export const aux4SancMartyrdomPlatingAuxiliary = buildMagitechWeapon({
  id: 'aux4_sanc_martyrdom_plating',
  name: 'SANC Martyrdom Plating',
  weaponClass: 'Martyrdom System',
  primaryDamageType: 'Impact',
  weightClass: 'medium',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  passiveArmorBonus: 24,
  passiveShieldBonus: 10,
  supportPulseOnHit: { armorRestore: 12, shieldRestore: 6 },
  bladeTrailColor: '#6ee7b7',
  identity: 'Reactive armor redirects damage into counter-waves (+24 Armor, +10 Shield)',
  lore: 'Sanctum Martyrdom sacrificial plating auxiliary that fortifies structural durability and discharges absorbed trauma as restorative waves.',
  shotsPerChain: 3,
  damagePerShot: 11,
  chainDurationSec: 1.0,
  reloadDurationSec: 1.5,
  range: 56,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Martyrdom Brace', desc: 'Auxiliary focus node.' },
    { name: 'Trauma Shunt', dmg: 15, cd: 4.5, heat: 8, desc: 'Auxiliary focus node.' },
    { name: 'Sacrificial Ward', dmg: 17, cd: 5.0, heat: 10, desc: 'Auxiliary focus node.' },
    { name: 'Martyrdom Vow Pulse', dmg: 20, cd: 6.0, heat: 10, dt: 'Wave', desc: 'Fortifies plating (+22 Armor) and releases a consecrated wave.' },
    { name: 'Retribution Covenant', dmg: 31, cd: 8.5, heat: 18, dt: 'Wave', desc: 'Discharges accumulated plating stress into a high-impact Wave blast (+25 Armor).' },
  ],
});

