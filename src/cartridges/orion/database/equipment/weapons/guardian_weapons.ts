/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import {
  HEATER_SHIELD_STRIP_BASE64,
  PAVISE_SHIELD_STRIP_BASE64,
  SHORT_SPEAR_STRIP_BASE64,
} from './base_sprites';
import { buildMagitechWeapon } from './builder';

// ─── GUARDIAN / VANGUARD LINEAGE MAGITECH PURIST RELICS (§3.1 & §4) ─────────

/**
 * Canonical database definition for `s3ViperPartisanWeapon` (`S-3 Viper Partisan`, id `'s3_viper_partisan'`, `6 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Spear & Buckler` (`spear_buckler_specialist`, Tier I).
 */
export const s3ViperPartisanWeapon = buildMagitechWeapon({
  id: 's3_viper_partisan',
  code: 'S-3',
  name: 'S-3 Viper Partisan',
  category: 'Spears',
  weaponClass: 'Short Spear',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 6,
  gripMode: '1H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Serrated viper spearhead',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'High-cadence 4-step darting thrust chain.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'spear_buckler_specialist',
    effectSummary: 'Darting Viper: Stepping backward after a thrust grants +12% next-thrust speed.',
  },
  flavorText: 'Agility-tuned short spear with a factory-sealed serrated viper head built for rapid darting thrusts.',
  loadoutSlots: ['Weapon 1', 'Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#38bdf8',
  identity: 'Modular-Frame Relic · Spear & Buckler Stance (6 WT · 2 Open Mounts + 1G)',
  lore: 'Lightweight frontline partisan with a sealed serrated viper spearhead and modular haft/counterweight mounts.',
  shotsPerChain: 4,
  damagePerShot: 12,
  chainDurationSec: 0.85,
  reloadDurationSec: 0.45,
  range: 34,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Darting Viper Thrust', desc: 'High-cadence 4-step darting thrust chain dealing 12 Pierce damage.' },
    { name: 'Serrated Seam Puncture', dmg: 22, cd: 4.0, heat: 10, desc: 'Precision spear lunge that exploits buckler deflections.' },
    { name: 'Viper Retreat Jab', dmg: 18, cd: 4.5, heat: 10, desc: 'Quick thrust paired with a micro-backstep to prime Darting Viper.' },
    { name: 'Block', dmg: 11, cd: 0, heat: 2, isBlock: true, desc: 'Hold to parry with the reinforced partisan shaft (0.34s Perfect Block window).' },
    { name: 'Fang Flurry', dmg: 29, cd: 7.5, heat: 20, desc: 'Rapid multi-point spear barrage that shreds exposed joints.' },
  ],
});

/**
 * Canonical database definition for `ti110AegisBucklerWeapon` (`TI-110 Aegis Buckler`, id `'ti110_aegis_buckler'`, `7 WT`, `1` Open Slot: `DELIVERY` + `1G`).
 * Preserved Legacy Epithet: `"the Aegis Charge Buckler"`.
 * Paired Specialist Stance: `Spear & Buckler` (`spear_buckler_specialist`, Tier I).
 */
export const ti110AegisBucklerWeapon = buildMagitechWeapon({
  id: 'ti110_aegis_buckler',
  code: 'TI-110',
  name: 'TI-110 Aegis Buckler',
  legacyEpithet: 'the Aegis Charge Buckler',
  category: 'Shields',
  weaponClass: 'Buckler',
  primaryDamageType: 'Impact',
  weightClass: 'light',
  explicitEquipWeight: 7,
  gripMode: '1H',
  architectureTier: 'SEMI_SEALED_ASSEMBLY',
  openDomains: ['DELIVERY'],
  sealedDomains: {
    CONTACT: 'Kinetic-boss hard-light buckler face',
    DELIVERY: null,
    REGULATION: 'Sealed Aegis charge-impulse condenser',
  },
  action1Signature: 'Concussive boss jab (+15% Impulse J).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'spear_buckler_specialist',
    effectSummary: 'Darting Viper: Concussive boss jabs (+15% Impulse J) destabilize targets for follow-up spear thrusts.',
  },
  flavorText: 'Field-designated the Aegis Charge Buckler by Vanguard instructors.',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  canBlock: true,
  passiveShieldBonus: 25,
  passiveArmorBonus: 8,
  bladeTrailColor: '#facc15',
  identity: 'Semi-Sealed Assembly · Spear & Buckler Stance (7 WT · 1 Open Mount + 1G)',
  lore: 'Kinetic-boss hard-light buckler (+25 Max Shield, +8 Armor Durability). Field-designated "the Aegis Charge Buckler" by Vanguard instructors.',
  shotsPerChain: 3,
  damagePerShot: 12,
  chainDurationSec: 0.95,
  reloadDurationSec: 0.45,
  range: 24,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Concussive Boss Jab', desc: '3-hit concussive boss jab combo dealing 12 Impact damage (+15% Impulse J).' },
    { name: 'Shield Charge Strike', dmg: 24, cd: 4.5, heat: 12, desc: 'Thrust-assisted shield charge slam enabling the Shield Charge feat.' },
    { name: 'Deflection Ward', dmg: 16, cd: 5.0, heat: 10, desc: 'Active parry ward that sheds projectile damage and resets shield recharge.' },
    { name: 'Block', dmg: 10, cd: 0, heat: 2, isBlock: true, desc: 'Hold to deploy the Aegis buckler barrier (0.34s Perfect Block window).' },
    { name: 'Aegis Citadel Slam', dmg: 30, cd: 8.0, heat: 22, desc: 'Overcharged kinetic shield burst that stuns and knocks back frontline hostiles.' },
  ],
});

/**
 * Canonical database definition for `n75PraetorianSpathaWeapon` (`N-75 Praetorian Spatha`, id `'n75_praetorian_spatha'`, `9 WT`, `3` Open Slots: `CONTACT`, `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Legionary` (`legionary_specialist`, Tier II).
 */
export const n75PraetorianSpathaWeapon = buildMagitechWeapon({
  id: 'n75_praetorian_spatha',
  code: 'N-75',
  name: 'N-75 Praetorian Spatha',
  category: 'Blades: Straight',
  weaponClass: 'Spatha',
  primaryDamageType: 'Pierce',
  weightClass: 'medium',
  explicitEquipWeight: 9,
  gripMode: '1H',
  architectureTier: 'REFERENCE_PLATFORM',
  openDomains: ['CONTACT', 'DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Linear thrust combo (+4 Armor THR pierce).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'legionary_specialist',
    effectSummary: 'Pilum & Scutum: Striking from behind active guard grants +4 Stability (S).',
  },
  flavorText: 'Heavy legionary short-arc stabbing sword built on a 3-domain military reference tang.',
  loadoutSlots: ['Weapon 1', 'Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#facc15',
  identity: 'Reference Platform · Legionary Stance (9 WT · 3 Open Mounts + 1G)',
  lore: 'Heavy Praetorian short-arc thrusting spatha designed to stab around the rim of a tower scutum with +4 Armor THR pierce.',
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDurationSec: 1.05,
  reloadDurationSec: 0.55,
  range: 28,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Praetorian Linear Thrust', desc: '4-step linear thrust combo dealing 14 Pierce damage (+4 Armor THR pierce).' },
    { name: 'Shield-Wall Overstab', dmg: 24, cd: 4.2, heat: 12, desc: 'Compact high-stability thrust delivered over the top of an active shield guard.' },
    { name: 'Pommel Fracture Check', dmg: 18, cd: 4.8, heat: 11, dt: 'Impact', desc: 'Short-arc guard check that reinforces pilot Poise.' },
    { name: 'Block', dmg: 11, cd: 0, heat: 3, isBlock: true, desc: 'Hold to raise Praetorian cross-guard (0.34s Perfect Block window).' },
    { name: 'Centurion Impale', dmg: 33, cd: 8.0, heat: 24, desc: 'Driving armor-splitting thrust that cracks heavy frontal plating.' },
  ],
});

/**
 * Canonical database definition for `ti400AegisScutumWeapon` (`TI-400 Aegis Scutum`, id `'ti400_aegis_scutum'`, `18 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Legionary` (`legionary_specialist`, Tier II).
 */
export const ti400AegisScutumWeapon = buildMagitechWeapon({
  id: 'ti400_aegis_scutum',
  code: 'TI-400',
  name: 'TI-400 Aegis Scutum',
  category: 'Shields',
  weaponClass: 'Scutum',
  primaryDamageType: 'Impact',
  weightClass: 'heavy',
  explicitEquipWeight: 18,
  gripMode: '1H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Curved hard-light reinforced legionary wall',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Heavy forward shield-punch (+25% Impulse J).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'legionary_specialist',
    effectSummary: 'Pilum & Scutum: Heavy forward shield-punches (+25% Impulse J) anchor the line and grant +4 Stability (S).',
  },
  flavorText: 'Curved hard-light reinforced legionary tower scutum engineered for close-order shield walls.',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  canBlock: true,
  passiveShieldBonus: 42,
  passiveArmorBonus: 18,
  bladeTrailColor: '#fde047',
  identity: 'Modular-Frame Relic · Legionary Scutum (18 WT · 2 Open Mounts + 1G)',
  lore: 'Semi-cylindrical Trinity Industries legionary scutum with a sealed hard-light outer wall and customizable strapping and boss electronics.',
  shotsPerChain: 2,
  damagePerShot: 16,
  chainDurationSec: 1.1,
  reloadDurationSec: 0.6,
  range: 24,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Scutum Forward Punch', desc: 'Heavy forward shield-punch dealing 16 Impact damage (+25% Impulse J).' },
    { name: 'Testudo Lock Advance', dmg: 22, cd: 5.0, heat: 13, desc: 'Braces the curved scutum wall while marching forward through incoming fire.' },
    { name: 'Hard-Light Rim Repel', dmg: 18, cd: 5.5, heat: 12, desc: 'Pulses the scutum face to restore +15 Shield and shove attackers.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 2, isBlock: true, desc: 'Plant the TI-400 Aegis Scutum wall (0.34s Perfect Block window).' },
    { name: 'Praetorian Bastion Crush', dmg: 32, cd: 8.5, heat: 22, desc: 'Full-mass tower shield slam that floors frontline hostiles.' },
  ],
});

/**
 * Canonical database definition for `ls900SwordspearWeapon` (`LS-900 Swordspear`, id `'ls900_swordspear'`, `12 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Spear & Shield` (`spear_shield_specialist`, Tier II).
 */
export const ls900SwordspearWeapon = buildMagitechWeapon({
  id: 'ls900_swordspear',
  code: 'LS-900',
  name: 'LS-900 Swordspear',
  category: 'Spears',
  weaponClass: 'Broad Spear',
  primaryDamageType: 'Wave',
  weightClass: 'medium',
  explicitEquipWeight: 12,
  gripMode: 'VERSATILE',
  allowOneHandGrip: true,
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Mana-channeling broad leaf-blade',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Wide horizontal mana-wave cleave arc.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'spear_shield_specialist',
    effectSummary: 'Hoplite Othismos: Forward directional charge (μ) widens cleave arc by +20%.',
  },
  flavorText: 'Sanctified broad leaf-spear that channels reactor Mana into sweeping horizontal wave cleaves.',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#facc15',
  identity: 'Modular-Frame Relic · Spear & Shield Stance (12 WT · 2 Open Mounts + 1G)',
  lore: 'Sanctified broad-bladed swordspear that channels reactor Mana along its extended haft to project sweeping wave cleaves.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 1.0,
  reloadDurationSec: 0.55,
  range: 36,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Mana-Wave Cleave', desc: '4-hit wide horizontal mana-wave cleave arc dealing 13 Wave (Mana) damage.' },
    { name: 'Crescent Resonator Sweep', dmg: 24, cd: 4.5, heat: 12, desc: 'Projects a Mana wave arc that hits multiple frontline enemies.' },
    { name: 'Impaling Vanguard Thrust', dmg: 22, cd: 5.0, heat: 14, dt: 'Pierce', desc: 'Long-reach piercing thrust that draws enemy Presence.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to parry with the reinforced polearm shaft (0.34s Perfect Block window).' },
    { name: 'Swordspear Tempest', dmg: 34, cd: 8.5, heat: 24, desc: 'Whirling Mana-charged halberd storm that restores 8 Shield on hit.' },
  ],
});

/**
 * Canonical database definition for `hl110DawnbladeWeapon` (`HL-110 Dawnblade`, id `'hl110_dawnblade'`, `12 WT`, `3` Open Slots: `CONTACT`, `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Knightly Bastard` (`knightly_bastard_specialist`, Tier II).
 */
export const hl110DawnbladeWeapon = buildMagitechWeapon({
  id: 'hl110_dawnblade',
  code: 'HL-110',
  name: 'HL-110 Dawnblade',
  category: 'Blades: Straight',
  weaponClass: 'Bastard Sword',
  primaryDamageType: 'Pierce',
  weightClass: 'medium',
  explicitEquipWeight: 12,
  gripMode: 'VERSATILE',
  allowOneHandGrip: true,
  architectureTier: 'REFERENCE_PLATFORM',
  openDomains: ['CONTACT', 'DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: '2H swings emit radiant edge trails.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'knightly_bastard_specialist',
    effectSummary: 'Fiore Posta di Donna: Toggling 1H/2H grip vents -5 Reactor Heat.',
  },
  flavorText: 'Versatile 1H/2H Dawnforge knightly bastard blade built on a full 3-domain reference architecture.',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#fef08a',
  identity: 'Reference Platform · Knightly Bastard Stance (12 WT · 3 Open Mounts + 1G)',
  lore: 'Hand-and-a-half Dawnforge reference blade whose fuller conduits project radiant edge trails during two-handed swings.',
  shotsPerChain: 4,
  damagePerShot: 15,
  chainDurationSec: 1.05,
  reloadDurationSec: 0.6,
  range: 32,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Radiant Bastard Arc', desc: '4-step versatile sword combo; 2H swings emit radiant edge trails (15 Pierce damage).' },
    { name: 'Posta di Donna Wrath', dmg: 26, cd: 4.4, heat: 13, desc: 'High-guard diagonal descent that cleaves through enemy wards.' },
    { name: 'Half-Sword Point Thrust', dmg: 22, cd: 4.8, heat: 11, desc: 'Braced close-quarters armor-gap thrust.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to raise the Dawnblade cross-guard (0.34s Perfect Block window).' },
    { name: 'Dawnforge Solar Cleave', dmg: 35, cd: 8.5, heat: 24, dt: 'Beam', desc: 'Unleashes a coherent radiant wave along the blade edge.' },
  ],
});

/**
 * Canonical database definition for `ti350RadiantCoronaWeapon` (`TI-350 Radiant Corona`, id `'ti350_radiant_corona'`, `11 WT`, `1` Open Slot: `DELIVERY` + `1G`).
 * Paired Specialist Stance: `Knightly Bastard` (`knightly_bastard_specialist`, Tier II).
 */
export const ti350RadiantCoronaWeapon = buildMagitechWeapon({
  id: 'ti350_radiant_corona',
  code: 'TI-350',
  name: 'TI-350 Radiant Corona',
  category: 'Shields',
  weaponClass: 'Corona',
  primaryDamageType: 'Beam',
  weightClass: 'medium',
  explicitEquipWeight: 11,
  gripMode: '1H',
  architectureTier: 'SEMI_SEALED_ASSEMBLY',
  openDomains: ['DELIVERY'],
  sealedDomains: {
    CONTACT: 'Solar-flare projection ring',
    DELIVERY: null,
    REGULATION: 'Hermetic photonic halo regulator',
  },
  action1Signature: 'Scorches melee attackers on guard contact.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'knightly_bastard_specialist',
    effectSummary: 'Fiore Posta di Donna: Solar-flare projection ring scorches attackers on guard contact and vents heat on grip transitions.',
  },
  flavorText: 'Forearm-mounted solar-flare projection ring that leaves the hand free to transition between 1H and 2H bastard sword grips.',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  canBlock: true,
  passiveShieldBonus: 26,
  passiveLightBonus: 0.5,
  supportPulseOnHit: { shieldRestore: 8 },
  bladeTrailColor: '#fde047',
  identity: 'Semi-Sealed Assembly · Knightly Bastard Corona (11 WT · 1 Open Mount + 1G)',
  lore: 'Trinity Industries solar-flare corona barrier ring that scorches melee attackers on guard contact while permitting versatile 1H/2H bastard-sword transitions.',
  shotsPerChain: 3,
  damagePerShot: 12,
  chainDurationSec: 0.95,
  reloadDurationSec: 0.5,
  range: 28,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Corona Scorch Guard', desc: '3-hit photonic ring strike that scorches melee attackers on guard contact (12 Beam damage).' },
    { name: 'Solar Flare Riposte', dmg: 21, cd: 4.5, heat: 10, desc: 'Blinding photonic halo flash that restores +15 Shield.' },
    { name: 'Halo Lattice Lock', dmg: 16, cd: 5.0, heat: 11, desc: 'Stabilizes the projection ring against energy and kinetic fire.' },
    { name: 'Block', dmg: 11, cd: 0, heat: 2, isBlock: true, desc: 'Hold to project the TI-350 Radiant Corona ring (0.34s Perfect Block window).' },
    { name: 'Corona Supernova', dmg: 30, cd: 8.0, heat: 20, dt: 'Beam', desc: 'Expands the solar-flare ring in a searing 360-degree Beam burst.' },
  ],
});

/**
 * Canonical database definition for `hl310SarissaPikeWeapon` (`HL-310 Sarissa Pike`, id `'hl310_sarissa_pike'`, `18 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Phalanx` (`phalanx_specialist`, Tier III).
 */
export const hl310SarissaPikeWeapon = buildMagitechWeapon({
  id: 'hl310_sarissa_pike',
  code: 'HL-310',
  name: 'HL-310 Sarissa Pike',
  category: 'Spears',
  weaponClass: 'Pike',
  primaryDamageType: 'Pierce',
  weightClass: 'heavy',
  explicitEquipWeight: 18,
  gripMode: 'VERSATILE',
  allowOneHandGrip: true,
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Long-reach phalanx spearhead (1H-eligible with Phalanx Specialist)',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Long-reach phalanx spearhead (1H-eligible with Phalanx Specialist).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'phalanx_specialist',
    effectSummary: 'Syntagma Sarissa: Halts enemy forward charge (μ) on hit.',
  },
  flavorText: 'Counterweighted Macedonian-pattern magitech sarissa pike engineered to lock behind a heavy shield wall.',
  loadoutSlots: ['Weapon 1', 'Weapon 3'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#fef08a',
  identity: 'Modular-Frame Relic · Phalanx Stance (18 WT · 2 Open Mounts + 1G)',
  lore: 'Extreme-reach Dawnforge phalanx pike whose counterbalanced butt-spike allows one-handed deployment alongside a shield under Phalanx Specialist.',
  shotsPerChain: 3,
  damagePerShot: 17,
  chainDurationSec: 1.1,
  reloadDurationSec: 0.65,
  range: 46,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Syntagma Long Thrust', desc: '3-stage extreme-reach pike thrust dealing 17 Pierce damage and halting enemy charge.' },
    { name: 'Charge-Breaker Impale', dmg: 30, cd: 5.0, heat: 16, desc: 'Braced anti-cavalry thrust that zeroes hostile forward momentum.' },
    { name: 'Butt-Spike Counter Check', dmg: 20, cd: 4.8, heat: 12, dt: 'Impact', desc: 'Strikes close-in flankers with the weighted bronze butt-spike.' },
    { name: 'Block', dmg: 13, cd: 0, heat: 3, isBlock: true, desc: 'Hold to lock the sarissa shaft in phalanx guard (0.34s Perfect Block window).' },
    { name: 'Macedonian Wall Skewer', dmg: 38, cd: 9.0, heat: 26, desc: 'Full-extension linear impalement that pierces every target in a deep corridor.' },
  ],
});

/**
 * Canonical database definition for `hl220LightburstLanceWeapon` (`HL-220 Lightburst Lance`, id `'hl220_lightburst_lance'`, `18 WT`, `1` Open Slot: `REGULATION` + `1G`).
 * Paired Specialist Stance: `Cataphract` (`cataphract_specialist`, Tier III).
 */
export const hl220LightburstLanceWeapon = buildMagitechWeapon({
  id: 'hl220_lightburst_lance',
  code: 'HL-220',
  name: 'HL-220 Lightburst Lance',
  category: 'Spears',
  weaponClass: 'Lance',
  primaryDamageType: 'Beam',
  weightClass: 'heavy',
  explicitEquipWeight: 18,
  gripMode: '2H',
  architectureTier: 'SEMI_SEALED_ASSEMBLY',
  openDomains: ['REGULATION'],
  sealedDomains: {
    CONTACT: 'Reactor-linked photonic lance head',
    DELIVERY: 'Integrated heavy vamplate and shock-absorber shaft',
    REGULATION: null,
  },
  action1Signature: 'Focused light discharge on thrust impact.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'cataphract_specialist',
    effectSummary: 'Contus Clibanarii: High-speed glide hits convert excess impulse into grounded knockdown.',
  },
  flavorText: 'Heavy cavalry-grade magitech lance cabled directly to the reactor core.',
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#fef08a',
  identity: 'Semi-Sealed Assembly · Cataphract Stance (18 WT · 1 Open Mount + 1G)',
  lore: 'Heavy cavalry-grade magitech lance cabled directly to the reactor core to unleash a focused light discharge on thrust impact.',
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDurationSec: 1.1,
  reloadDurationSec: 0.7,
  range: 42,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Lightburst Thrust Chain', desc: '3-stage reactor-linked lance thrust discharging focused Beam light (18 Beam damage).' },
    { name: 'Judgment Strike', dmg: 36, cd: 6.0, heat: 22, desc: 'Canonical reactor-linked lance charge that blasts targets with coherent light.' },
    { name: 'Radiant Pennant Sweep', dmg: 24, cd: 5.0, heat: 16, dt: 'Wave', desc: 'Cleaves a photonic arc that bolsters pilot Presence.' },
    { name: 'Block', dmg: 14, cd: 0, heat: 3, isBlock: true, desc: 'Hold to plant the lance vamplate guard (0.34s Perfect Block window).' },
    { name: 'Dawnbreaker Cataclysm', dmg: 40, cd: 9.5, heat: 30, desc: 'Fires a long-range heavy beam straight from the lance tip.' },
  ],
});

/**
 * Canonical database definition for `rs450RadiantProjectorWeapon` (`RS-450 Radiant Projector`, id `'rs450_radiant_projector'`, `12 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Core Feat Chain: `C-14` Vanguard Ward (`Radiant Convergence`).
 */
export const rs450RadiantProjectorWeapon = buildMagitechWeapon({
  id: 'rs450_radiant_projector',
  code: 'RS-450',
  name: 'RS-450 Radiant Projector',
  category: 'Casters',
  weaponClass: 'Beam Caster',
  primaryDamageType: 'Beam',
  weightClass: 'medium',
  explicitEquipWeight: 12,
  gripMode: '1H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Harmonic prism oscillator',
    REGULATION: null,
  },
  action1Signature: 'Mid-range beam emitter reinforcing Layer 1 Shields on hit.',
  puristResonance: {
    triggerType: 'CORE_FEAT_CHAIN',
    targetId: 'C-14',
    effectSummary: 'C-14 Vanguard Ward (Radiant Convergence): Firing from inside a Radiant Sphere widens beam thickness.',
  },
  flavorText: 'Core-Chain C-14 Apex beam emitter coupling coherent photonic offense with Layer 1 Shield reinforcement.',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#fde047',
  identity: 'Modular-Frame Relic · Core Chain C-14 Apex (12 WT · 2 Open Mounts + 1G)',
  lore: 'Harmonic beam emitter built around a sealed prism oscillator that couples offensive coherent light with a feedback loop reinforcing Layer 1 Shields.',
  shotsPerChain: 8,
  damagePerShot: 7,
  chainDurationSec: 1.4,
  reloadDurationSec: 2.8,
  range: 90,
  supportPulseOnHit: { shieldRestore: 3 },
  isPlaceholderAsset: false,
  skills: [
    { name: 'Radiant Coherence Beam', desc: '8-tick mid-range beam dealing 7 Beam damage and reinforcing Layer 1 Shields (+3 Shield per hit).' },
    { name: 'Aegis Refraction Pulse', dmg: 20, cd: 4.5, heat: 14, desc: 'Searing light burst that restores 12 Shield capacity on impact.' },
    { name: 'Harmonic Lock Ray', dmg: 22, cd: 5.5, heat: 16, desc: 'Sustained focus beam that weakens enemy damage output.' },
    { name: 'Blinding Flare', dmg: 15, cd: 5.0, heat: 14, dt: 'Wave', desc: 'Wide-angle photonic flash that interrupts enemy windups.' },
    { name: 'Solbright Convergence', dmg: 32, cd: 8.5, heat: 26, desc: 'High-intensity beam discharge that overcharges barrier harmonics.' },
  ],
});

// ─── BACKWARD-COMPATIBLE ALIAS EXPORTS & BASE CUSTOMIZABLE WEAPONS ──────────

/**
 * Backward-compatible alias for `hl220LightburstLanceWeapon`.
 */
export const avalonSiegeLanceWeapon: WeaponDefinition = {
  ...hl220LightburstLanceWeapon,
  id: 'avalon_siege_lance',
  name: 'Avalon Siege Lance (HL-220)',
};

/**
 * Backward-compatible alias for `s3ViperPartisanWeapon` (legacy `tig_edge`).
 */
export const tigEdgeWeapon: WeaponDefinition = {
  ...s3ViperPartisanWeapon,
  id: 'tig_edge',
};

/**
 * Backward-compatible alias for `ti110AegisBucklerWeapon` (legacy `aegis_charge_buckler`).
 */
export const aegisChargeBucklerWeapon: WeaponDefinition = {
  ...ti110AegisBucklerWeapon,
  id: 'aegis_charge_buckler',
};

/**
 * Backward-compatible alias for `ti110AegisBucklerWeapon` (legacy `buckler_shield`).
 */
export const bucklerShieldWeapon: WeaponDefinition = {
  ...ti110AegisBucklerWeapon,
  id: 'buckler_shield',
};

/**
 * Backward-compatible alias for `ti350RadiantCoronaWeapon` (legacy `utility_aegis_pulse`).
 */
export const utilityAegisPulseAuxiliary: WeaponDefinition = {
  ...ti350RadiantCoronaWeapon,
  id: 'utility_aegis_pulse',
};

/**
 * Backward-compatible alias for `ti400AegisScutumWeapon` (legacy `aux3_ti_aegis_hardlight`).
 */
export const aux3TiAegisHardlightAuxiliary: WeaponDefinition = {
  ...ti400AegisScutumWeapon,
  id: 'aux3_ti_aegis_hardlight',
};

/**
 * Backward-compatible alias for `ti350RadiantCoronaWeapon` (legacy `aux4_ti_radiant_sphere`).
 */
export const aux4TiRadiantSphereAuxiliary: WeaponDefinition = {
  ...ti350RadiantCoronaWeapon,
  id: 'aux4_ti_radiant_sphere',
};

/**
 * Canonical database definition for `heaterShieldWeapon` (`Knightly Heater Shield`, id `'heater_shield'`, load `'medium'`) — Broad triangular heraldic heater shield (+28 Max Shield, +12 Armor Durability) optimized for reliable guard arcs.
 */
export const heaterShieldWeapon: WeaponDefinition = {
  id: 'heater_shield',
  name: 'Knightly Heater Shield',
  category: 'Shields',
  weaponTier: 'customizable',
  class: 'Heater Shield (Offhand Auxiliary)',
  weaponClass: 'Physical Shield',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'medium',
  canBlock: true,
  passiveShieldBonus: 28,
  passiveArmorBonus: 12,
  bladeTrailColor: '#f8fafc',
  description: 'Broad triangular heraldic heater shield (+28 Max Shield, +12 Armor Durability) optimized for reliable guard arcs.',
  lore:
    'Forged from heavy cathedral steel alloys and laminated with resonance damping layers. Provides high passive Shield Capacity.',
  shotsPerChain: 3,
  damagePerShot: 12,
  chainDurationSec: 1.0,
  reloadDurationSec: 0.5,
  primaryDamageType: 'Impact',
  variantStripBase64: HEATER_SHIELD_STRIP_BASE64,
  hardpointSprite: {
    base64: HEATER_SHIELD_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 14,
    renderHeight: 14,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: HEATER_SHIELD_STRIP_BASE64,
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
      name: 'Vanguard Shield Bash',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 12,
      tellDurationSec: 0.08,
      actionDurationSec: 0.28,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.5,
      heatCost: 2,
      range: 22,
      description: 'Forceful shield-face strikes that generate threat and push back attackers.',
    },
    {
      slot: 1,
      name: 'Shield Charge',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 22,
      tellDurationSec: 0.2,
      actionDurationSec: 0.35,
      cooldownSec: 4.5,
      heatCost: 12,
      range: 40,
      description: 'Forward sprint with shield braced, stunning the first enemy impacted.',
    },
    {
      slot: 2,
      name: 'Fortress Stand',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 0,
      tellDurationSec: 0.1,
      actionDurationSec: 0.4,
      cooldownSec: 6.0,
      heatCost: 14,
      range: 24,
      description: 'Brace stance that immediately resets shield recharge delay and grants 2.0s poise.',
    },
    {
      slot: 3,
      name: 'Block',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 10,
      tellDurationSec: 0.04,
      actionDurationSec: 0.2,
      cooldownSec: 0,
      isBlock: true,
      heatCost: 2,
      range: 24,
      description: 'Hold to raise heater shield guard against incoming fire (0.34s Perfect Block window).',
    },
    {
      slot: 4,
      name: 'Bulwark Repel',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 28,
      tellDurationSec: 0.3,
      actionDurationSec: 0.55,
      cooldownSec: 7.5,
      heatCost: 20,
      range: 26,
      description: 'Explosive outward shield thrust that staggers attacking groups.',
    },
  ],
};

/**
 * Canonical database definition for `paviseShieldWeapon` (`Aegis Pavise Tower Shield`, id `'pavise_shield'`, load `'heavy'`) — Massive full-length fortress pavise shield granting +45 Max Shield Capacity, +20 Armor Durability, and immovable barrier lock.
 */
export const paviseShieldWeapon: WeaponDefinition = {
  id: 'pavise_shield',
  name: 'Aegis Pavise Tower Shield',
  category: 'Shields',
  weaponTier: 'customizable',
  class: 'Pavise Tower Shield (Offhand Auxiliary)',
  weaponClass: 'Physical Shield',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'heavy',
  canBlock: true,
  passiveShieldBonus: 45,
  passiveArmorBonus: 20,
  bladeTrailColor: '#f8fafc',
  description: 'Massive full-length fortress pavise shield granting +45 Max Shield Capacity, +20 Armor Durability, and immovable barrier lock.',
  lore:
    'Towering field barrier engineered for siege defense. Its hydraulic ground anchors lock the pilot into position while soaking artillery fire.',
  shotsPerChain: 2,
  damagePerShot: 16,
  chainDurationSec: 1.2,
  reloadDurationSec: 0.7,
  primaryDamageType: 'Impact',
  variantStripBase64: PAVISE_SHIELD_STRIP_BASE64,
  hardpointSprite: {
    base64: PAVISE_SHIELD_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 16,
    renderHeight: 16,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: PAVISE_SHIELD_STRIP_BASE64,
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
      name: 'Pavise Ram Blow',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 16,
      tellDurationSec: 0.12,
      actionDurationSec: 0.4,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.7,
      heatCost: 3,
      range: 22,
      description: 'Crushing heavy shield ram blow that commands huge enemy Presence.',
    },
    {
      slot: 1,
      name: 'Hydraulic Earth Anchor',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.22,
      actionDurationSec: 0.45,
      cooldownSec: 5.5,
      heatCost: 15,
      range: 26,
      description: 'Drives anchors into the earth, emitting a kinetic shock that repels surrounding rushers.',
    },
    {
      slot: 2,
      name: 'Aegis Sanctuary Ward',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 0,
      tellDurationSec: 0.15,
      actionDurationSec: 0.4,
      cooldownSec: 7.0,
      heatCost: 18,
      range: 30,
      description: 'Projects a reinforced directional barrier that reduces incoming damage by 50% for 3.0s.',
    },
    {
      slot: 3,
      name: 'Block',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 12,
      tellDurationSec: 0.04,
      actionDurationSec: 0.2,
      cooldownSec: 0,
      isBlock: true,
      heatCost: 2,
      range: 26,
      description: 'Plant the tower pavise into the ground (0.34s Perfect Block window, high stability).',
    },
    {
      slot: 4,
      name: 'Cathedral Bastion Slam',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 32,
      tellDurationSec: 0.4,
      actionDurationSec: 0.7,
      cooldownSec: 9.0,
      heatCost: 25,
      range: 28,
      description: 'Overcharged barrier slam that staggers all hostiles in a forward 90-degree arc.',
    },
  ],
};

/**
 * Canonical database definition for `shortSpearWeapon` (`Camelot Short Spear`, id `'short_spear'`, load `'medium'`) — Swift, precise knightly thrusting spear engineered to bypass gaps in heavy enemy plating.
 */
export const shortSpearWeapon: WeaponDefinition = {
  id: 'short_spear',
  name: 'Camelot Short Spear',
  category: 'Spears',
  weaponTier: 'customizable',
  class: 'Short Spear / Thrust (Weapon 1 / Aux 1)',
  weaponClass: 'Polearm',
  loadoutSlots: ['Weapon 1', 'Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'medium',
  canBlock: true,
  bladeTrailColor: '#f8fafc',
  description: 'Swift, precise knightly thrusting spear engineered to bypass gaps in heavy enemy plating.',
  lore:
    'Belldor frontline spear designed for disciplined phalanx thrusts. Highly effective against beasts and armored foes alike.',
  shotsPerChain: 4,
  damagePerShot: 12,
  chainDurationSec: 1.0,
  reloadDurationSec: 0.55,
  primaryDamageType: 'Pierce',
  variantStripBase64: SHORT_SPEAR_STRIP_BASE64,
  hardpointSprite: {
    base64: SHORT_SPEAR_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 15,
    renderHeight: 15,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: SHORT_SPEAR_STRIP_BASE64,
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
      name: 'Phalanx Thrust Cadence',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 12,
      tellDurationSec: 0.08,
      actionDurationSec: 0.28,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.55,
      heatCost: 2,
      range: 34,
      description: 'Four rapid inline spear thrusts with superior forward reach.',
    },
    {
      slot: 1,
      name: 'Vaulting Impale',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 24,
      tellDurationSec: 0.18,
      actionDurationSec: 0.35,
      cooldownSec: 4.2,
      heatCost: 12,
      range: 42,
      description: 'Forward lunge that drives the spearhead deep into armored gaps.',
    },
    {
      slot: 2,
      name: 'Sweeping Haft Trip',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 16,
      tellDurationSec: 0.22,
      actionDurationSec: 0.38,
      cooldownSec: 5.0,
      heatCost: 12,
      range: 30,
      description: 'Horizontal pole sweep that checks surrounding enemies.',
    },
    {
      slot: 3,
      name: 'Block',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 10,
      tellDurationSec: 0.04,
      actionDurationSec: 0.2,
      cooldownSec: 0,
      isBlock: true,
      heatCost: 3,
      range: 24,
      description: 'Hold spear haft in two-handed parry stance (0.34s Perfect Block window).',
    },
    {
      slot: 4,
      name: 'Skewer & Hurling Slam',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 32,
      tellDurationSec: 0.32,
      actionDurationSec: 0.6,
      cooldownSec: 8.0,
      heatCost: 24,
      range: 36,
      description: 'Heavy commitment thrust that impales and throws back the target.',
    },
  ],
};
