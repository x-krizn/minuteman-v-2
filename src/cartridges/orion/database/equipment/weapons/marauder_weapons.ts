/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import {
  HAND_AXE_STRIP_BASE64,
  MACE_STRIP_BASE64,
} from './base_sprites';
import { buildMagitechWeapon } from './builder';

// ─── MARAUDER / HEAVY ORDNANCE LINEAGE MAGITECH WEAPONS ─────────────────────

/**
 * Canonical database definition for `b25BrushcutterWeapon` (`B-25 Brushcutter`, id `'b25_brushcutter'`, load `'heavy'`) — Twin-rotor, intercept + suppression.
 */
export const b25BrushcutterWeapon = buildMagitechWeapon({
  id: 'b25_brushcutter',
  name: 'B-25 Brushcutter',
  weaponClass: 'Gatling Gun',
  primaryDamageType: 'Pierce',
  weightClass: 'heavy',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#fb923c',
  identity: 'Twin-rotor, intercept + suppression',
  lore: 'Twin-rotor rotary cannon that saturates firing arcs with high-velocity flechettes, intercepting incoming Rushers and stripping shields.',
  shotsPerChain: 16,
  damagePerShot: 4,
  chainDurationSec: 1.9,
  reloadDurationSec: 3.5,
  range: 92,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Twin-Rotor Barrage', desc: '16-round rotary burst dealing 4 Pierce damage per round.' },
    { name: 'Intercept Curtain', dmg: 20, cd: 4.5, heat: 18, desc: 'Dense flechette wall that halts lunging enemies.' },
    { name: 'Rotor Spin-Up Shred', dmg: 24, cd: 5.5, heat: 20, desc: 'Spools both barrels to peak RPM to shred armor durability.' },
    { name: 'Lead Saturation', dmg: 16, cd: 5.0, heat: 16, desc: 'Wide-cone suppression sweep generating high Presence.' },
    { name: 'Melting Point Unload', dmg: 35, cd: 9.0, heat: 34, desc: 'Sustained rotary hailstorm until thermal limit.' },
  ],
});

/**
 * Canonical database definition for `m350MaulerWeapon` (`M-350 Mauler`, id `'m350_mauler'`, load `'medium'`) — Three-shot burst suppression.
 */
export const m350MaulerWeapon = buildMagitechWeapon({
  id: 'm350_mauler',
  name: 'M-350 Mauler',
  weaponClass: 'Grenade Cannon',
  primaryDamageType: 'Blast',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#f97316',
  identity: 'Three-shot burst suppression',
  lore: 'Drum-fed grenade cannon lobbing three-round proximity bursts that detonate across clustered hostiles.',
  shotsPerChain: 3,
  damagePerShot: 16,
  chainDurationSec: 1.2,
  reloadDurationSec: 2.9,
  range: 84,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Three-Shot Thumper Burst', desc: '3-grenade burst dealing 16 Blast damage per shell.' },
    { name: 'Airburst Shrapnel Shell', dmg: 24, cd: 4.5, heat: 16, desc: 'Detonates above cover to stagger grouped enemies.' },
    { name: 'Bouncing Concussion Round', dmg: 22, cd: 5.5, heat: 18, desc: 'High-impulse shell that knocks back frontline targets.' },
    { name: 'Thermobaric Canister', dmg: 20, cd: 6.0, heat: 20, desc: 'Ignites a blast pocket that saps enemy armor rating.' },
    { name: 'Carpet Saturation', dmg: 34, cd: 8.5, heat: 30, desc: 'Rapid-fires a full drum of high-explosive shells.' },
  ],
});

/**
 * Canonical database definition for `ln1200AvalancheWeapon` (`LN-1200 Avalanche`, id `'ln1200_avalanche'`, load `'heavy'`) — Long-range, interference shielding.
 */
export const ln1200AvalancheWeapon = buildMagitechWeapon({
  id: 'ln1200_avalanche',
  name: 'LN-1200 Avalanche',
  category: 'Carriers & Munitions',
  weaponClass: 'Rocket System',
  primaryDamageType: 'Blast',
  weightClass: 'heavy',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  bladeTrailColor: '#ef4444',
  identity: 'Long-range, interference shielding',
  lore: 'Back-and-shoulder mounted heavy rocket pod equipped with electromagnetic interference baffles that resist counter-fire during salvo lock.',
  shotsPerChain: 4,
  damagePerShot: 15,
  chainDurationSec: 1.6,
  reloadDurationSec: 3.6,
  range: 130,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Avalanche Rocket Pod', desc: '4-rocket long-range salvo dealing 15 Blast damage per warhead.' },
    { name: 'Chaff-Screen Volley', dmg: 25, cd: 5.5, heat: 20, desc: 'Launches rockets alongside interference chaff that bolsters shields.' },
    { name: 'Bunker-Buster Tandem', dmg: 30, cd: 6.5, heat: 24, desc: 'Tandem-charge warhead built to crack Hardened plating.' },
    { name: 'Shockwave Salvo', dmg: 22, cd: 5.5, heat: 18, desc: 'Staggering rocket ripple across a wide impact zone.' },
    { name: 'Full-Pod Avalanche', dmg: 40, cd: 10.0, heat: 36, desc: 'Fires every tube in a devastating long-range artillery strike.' },
  ],
});

/**
 * Canonical database definition for `lg950TomahawkWeapon` (`LG-950 Tomahawk`, id `'lg950_tomahawk'`, load `'heavy'`) — Long-range, soft lock.
 */
export const lg950TomahawkWeapon = buildMagitechWeapon({
  id: 'lg950_tomahawk',
  name: 'LG-950 Tomahawk',
  category: 'Carriers & Munitions',
  weaponClass: 'Missile System',
  primaryDamageType: 'Blast',
  weightClass: 'heavy',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  bladeTrailColor: '#fb7185',
  identity: 'Long-range, soft lock',
  lore: 'Back-mounted multi-cell guided missile rack utilizing soft-lock telemetry to track evasive targets across long sightlines.',
  shotsPerChain: 6,
  damagePerShot: 10,
  chainDurationSec: 1.7,
  reloadDurationSec: 3.5,
  range: 135,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Soft-Lock Micromissiles', desc: '6-missile guided swarm dealing 10 Blast damage per warhead.' },
    { name: 'Top-Attack Javelin', dmg: 27, cd: 5.0, heat: 19, desc: 'Arcing missile that strikes from above, bypassing frontal shields.' },
    { name: 'Seeker Swarm', dmg: 24, cd: 6.0, heat: 21, desc: 'Homing cluster that tracks locked targets around cover.' },
    { name: 'Scramble Warhead', dmg: 19, cd: 5.5, heat: 17, desc: 'Disrupts enemy sensor lock and slows attack windups.' },
    { name: 'Tomahawk Saturation Strike', dmg: 38, cd: 9.5, heat: 35, desc: 'Locks all cells onto the primary target for maximum burst.' },
  ],
});

/**
 * Canonical database definition for `siegebreakerWeapon` (`Siegebreaker`, id `'siegebreaker'`, load `'heavy'`) — Two-handed, integrated energy vent.
 */
export const siegebreakerWeapon = buildMagitechWeapon({
  id: 'siegebreaker',
  name: 'Siegebreaker',
  weaponClass: 'Battle Axe',
  primaryDamageType: 'Impact',
  weightClass: 'heavy',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#f97316',
  identity: 'Two-handed, integrated energy vent',
  lore: 'Colossal two-handed siege greataxe with exhaust vents along the spine that discharge reactor heat directly into crushing cleaves.',
  shotsPerChain: 3,
  damagePerShot: 19,
  chainDurationSec: 1.15,
  reloadDurationSec: 0.75,
  range: 32,
  supportPulseOnHit: { heatVent: 5 },
  isPlaceholderAsset: false,
  skills: [
    { name: 'Heavy Vent Cleave', desc: '3-hit two-handed greataxe combo dealing 19 Impact damage and venting 5 Heat per hit.' },
    { name: 'Thermal Exhaust Slam', dmg: 32, cd: 5.0, heat: -15, dt: 'Blast', desc: 'Slams the ground and vents 15 Reactor Heat in a fiery shockwave.' },
    { name: 'Hull-Splitter Overhead', dmg: 28, cd: 5.5, heat: 14, desc: 'Crushing vertical chop that sunders armor threshold.' },
    { name: 'Block', dmg: 14, cd: 0, heat: 4, isBlock: true, desc: 'Hold to brace behind the broadaxe head (0.34s Perfect Block window).' },
    { name: 'Cataclysmic Guillotine', dmg: 42, cd: 9.0, heat: 26, desc: 'High-commitment execution cleave with massive stagger force.' },
  ],
});

/**
 * Canonical database definition for `maceWeapon` (`Sanctum Flange Mace`, id `'mace'`, load `'medium'`) — Weighted flanged morningstar mace engineered to dent heavy Ablative and Reactive armor..
 */
export const maceWeapon: WeaponDefinition = {
  id: 'mace',
  name: 'Sanctum Flange Mace',
  category: 'Impact & Axes',
  weaponTier: 'customizable',
  class: 'Heavy Mace / Blunt (Weapon 1 / Aux 1)',
  weaponClass: 'Blunt',
  loadoutSlots: ['Weapon 1', 'Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'medium',
  canBlock: true,
  bladeTrailColor: '#f8fafc',
  description: 'Weighted flanged morningstar mace engineered to dent heavy Ablative and Reactive armor.',
  lore:
    'Wielded by Cleric and Guardian war-priests of Belldor. Its heavy Impact blows bypass blade-deflecting plating and crack armor durability.',
  shotsPerChain: 3,
  damagePerShot: 16,
  chainDurationSec: 1.1,
  reloadDurationSec: 0.6,
  primaryDamageType: 'Impact',
  variantStripBase64: MACE_STRIP_BASE64,
  hardpointSprite: {
    base64: MACE_STRIP_BASE64,
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
    base64: MACE_STRIP_BASE64,
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
      name: 'Crushing Flange Combo',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 16,
      tellDurationSec: 0.11,
      actionDurationSec: 0.36,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.6,
      heatCost: 4,
      range: 24,
      description: 'Triple heavy blunt impact strikes dealing 16 Impact damage per blow.',
    },
    {
      slot: 1,
      name: 'Armor-Cracking Skullbash',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 26,
      tellDurationSec: 0.22,
      actionDurationSec: 0.38,
      cooldownSec: 4.5,
      heatCost: 14,
      range: 26,
      description: 'High-mass overhead strike that damages armor threshold and staggers.',
    },
    {
      slot: 2,
      name: 'Groundbreaker Sweep',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 20,
      tellDurationSec: 0.26,
      actionDurationSec: 0.42,
      cooldownSec: 5.2,
      heatCost: 16,
      range: 28,
      description: 'Low horizontal swing that can trip and unbalance charging rushers.',
    },
    {
      slot: 3,
      name: 'Block',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 10,
      tellDurationSec: 0.05,
      actionDurationSec: 0.2,
      cooldownSec: 0,
      isBlock: true,
      heatCost: 4,
      range: 22,
      description: 'Raise the haft and flanged head in cross-guard (0.34s Perfect Block window).',
    },
    {
      slot: 4,
      name: 'Seismic Impact Quake',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 34,
      tellDurationSec: 0.38,
      actionDurationSec: 0.65,
      cooldownSec: 8.5,
      heatCost: 28,
      range: 30,
      description: 'Overcharged kinetic hammer blow that concusses targets.',
    },
  ],
};

/**
 * Canonical database definition for `handAxeWeapon` (`Marauder Hand Axe`, id `'hand_axe'`, load `'heavy'`) — Heavy-bearded boarding and siege hand axe built for aggressive close-quarters hacking..
 */
export const handAxeWeapon: WeaponDefinition = {
  id: 'hand_axe',
  name: 'Marauder Hand Axe',
  category: 'Impact & Axes',
  weaponTier: 'customizable',
  class: 'Hand Axe / Cleaver (Weapon 1 / Aux 1)',
  weaponClass: 'Blade',
  loadoutSlots: ['Weapon 1', 'Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'heavy',
  canBlock: true,
  bladeTrailColor: '#f8fafc',
  description: 'Heavy-bearded boarding and siege hand axe built for aggressive close-quarters hacking.',
  lore:
    'A brutal close-combat tomahawk favored by Marauder and Warrior pilots. Can be swung in rapid arcs or hurled at retreating targets.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 1.0,
  reloadDurationSec: 0.5,
  primaryDamageType: 'Pierce',
  variantStripBase64: HAND_AXE_STRIP_BASE64,
  hardpointSprite: {
    base64: HAND_AXE_STRIP_BASE64,
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
    base64: HAND_AXE_STRIP_BASE64,
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
      name: 'Rending Hack Chain',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 13,
      tellDurationSec: 0.08,
      actionDurationSec: 0.28,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.5,
      heatCost: 2,
      range: 24,
      description: 'Four rapid close-range chopping strikes dealing 13 Pierce damage.',
    },
    {
      slot: 1,
      name: 'Hooking Cleave',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 22,
      tellDurationSec: 0.18,
      actionDurationSec: 0.32,
      cooldownSec: 3.8,
      heatCost: 10,
      range: 26,
      description: 'Bearded axe bite that hooks and pulls shields aside.',
    },
    {
      slot: 2,
      name: 'Thrown Tomahawk',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 20,
      tellDurationSec: 0.24,
      actionDurationSec: 0.38,
      cooldownSec: 4.8,
      heatCost: 12,
      range: 52,
      description: 'Hurls a spare boarding axe into a retreating or elevated hostile.',
    },
    {
      slot: 3,
      name: 'Block',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 8,
      tellDurationSec: 0.04,
      actionDurationSec: 0.18,
      cooldownSec: 0,
      isBlock: true,
      heatCost: 3,
      range: 20,
      description: 'Raise the reinforced axe haft to deflect weapon strikes (0.34s Perfect Block window).',
    },
    {
      slot: 4,
      name: 'Execution Hack',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 30,
      tellDurationSec: 0.32,
      actionDurationSec: 0.55,
      cooldownSec: 7.5,
      heatCost: 22,
      range: 26,
      description: 'Two-handed commitment chop that deals critical damage to staggered frames.',
    },
  ],
};

// ─── MARAUDER / HEAVY ORDNANCE AUXILIARIES (Migrated from Utility, Aux 3 & Aux 4) ───

/**
 * Canonical database definition for `utilitySiegeBraceAuxiliary` (`RAD R463 Fathomless System`, id `'utility_siege_brace'`, load `'medium'`) — Excess energy repairs subsystems and vents heat (+14 Shield, active Armor knit).
 */
export const utilitySiegeBraceAuxiliary = buildMagitechWeapon({
  id: 'utility_siege_brace',
  name: 'RAD R463 Fathomless System',
  weaponClass: 'Self-Repair Subsystem',
  primaryDamageType: 'Impact',
  weightClass: 'medium',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  passiveShieldBonus: 14,
  supportPulseOnHit: { armorRestore: 16, heatVent: 8 },
  bladeTrailColor: '#f97316',
  identity: 'Excess energy repairs subsystems and vents heat (+14 Shield, active Armor knit)',
  lore: 'RAD HAU Fathomless self-repair auxiliary that converts waste reactor heat into rapid plating reconstruction on strike.',
  shotsPerChain: 3,
  damagePerShot: 11,
  chainDurationSec: 1.0,
  reloadDurationSec: 1.6,
  range: 48,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Fathomless Purge', desc: 'Auxiliary focus node.' },
    { name: 'Plating Knit', dmg: 14, cd: 4.5, heat: -8, desc: 'Auxiliary focus node.' },
    { name: 'Thermal Siphon', dmg: 16, cd: 5.0, heat: -10, desc: 'Auxiliary focus node.' },
    { name: 'Fathomless Armor Brace', dmg: 18, cd: 7.0, heat: -14, dt: 'Impact', desc: 'Vents -14 Heat while restoring +24 Armor Durability and repelling nearby foes.' },
    { name: 'Deep-Core Reconstruction', dmg: 28, cd: 9.5, heat: -20, dt: 'Blast', desc: 'Purges -20 Reactor Heat into +45 Armor Durability and a concussive shockwave.' },
  ],
});

/**
 * Canonical database definition for `aux3RadKineticRecyclingAuxiliary` (`RAD R-22 Bastion Kinetic Recycling`, id `'aux3_rad_kinetic_recycling'`, load `'medium'`) — Kinetic capacitor recycles stress into repair & venting (+18 Shield).
 */
export const aux3RadKineticRecyclingAuxiliary = buildMagitechWeapon({
  id: 'aux3_rad_kinetic_recycling',
  name: 'RAD R-22 Bastion Kinetic Recycling',
  weaponClass: 'Kinetic Capacitor',
  primaryDamageType: 'Impact',
  weightClass: 'medium',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  passiveShieldBonus: 18,
  supportPulseOnHit: { armorRestore: 12, heatVent: 6 },
  bladeTrailColor: '#fb923c',
  identity: 'Kinetic capacitor recycles stress into repair & venting (+18 Shield)',
  lore: 'RAD R-22 kinetic recycling capacitor that absorbs kinetic stress and re-routes it into active plating weld pulses and thermal venting.',
  shotsPerChain: 3,
  damagePerShot: 12,
  chainDurationSec: 1.0,
  reloadDurationSec: 1.5,
  range: 42,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Kinetic Absorption', desc: 'Auxiliary focus node.' },
    { name: 'Stress Recycle', dmg: 15, cd: 4.5, heat: -6, desc: 'Auxiliary focus node.' },
    { name: 'Bastion Shunt', dmg: 17, cd: 5.0, heat: -6, desc: 'Auxiliary focus node.' },
    { name: 'Kinetic Recycle Pulse', dmg: 20, cd: 6.0, heat: -8, dt: 'Impact', desc: 'Recycles kinetic energy to mend +18 Armor Durability and stagger nearby enemies.' },
    { name: 'Bastion Payback Wave', dmg: 32, cd: 8.5, heat: 16, dt: 'Blast', desc: 'Discharges stored kinetic stress in an armor-cracking blast.' },
  ],
});

/**
 * Canonical database definition for `aux4RadEtherVaporAuxiliary` (`RAD UF-12 Ether Vapor Launcher`, id `'aux4_rad_ether_vapor'`, load `'medium'`) — Vision obscurement, targeting scramble (+18 Shield, +0.5 Light).
 */
export const aux4RadEtherVaporAuxiliary = buildMagitechWeapon({
  id: 'aux4_rad_ether_vapor',
  name: 'RAD UF-12 Ether Vapor Launcher',
  weaponClass: 'Interference Launcher',
  primaryDamageType: 'Blast',
  weightClass: 'medium',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  passiveShieldBonus: 18,
  passiveLightBonus: 0.5,
  bladeTrailColor: '#f43f5e',
  identity: 'Vision obscurement, targeting scramble (+18 Shield, +0.5 Light)',
  lore: 'Multi-tube Ether vapor canister launcher that blankets the combat zone in sensor-scrambling aerosol clouds.',
  shotsPerChain: 3,
  damagePerShot: 11,
  chainDurationSec: 1.0,
  reloadDurationSec: 1.6,
  range: 76,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Vapor Canister', desc: 'Auxiliary focus node.' },
    { name: 'Chaff Cloud', dmg: 14, cd: 4.5, heat: 8, desc: 'Auxiliary focus node.' },
    { name: 'Scramble Mist', dmg: 16, cd: 5.0, heat: 10, desc: 'Auxiliary focus node.' },
    { name: 'Ether Chaff Barrage', dmg: 20, cd: 6.0, heat: 10, dt: 'Blast', desc: 'Fires interference vapor canisters that scramble enemy optics and mark targets.' },
    { name: 'Ignited Vapor Detonation', dmg: 31, cd: 8.5, heat: 20, dt: 'Blast', desc: 'Ignites the dispersed Ether vapor cloud for heavy area Blast damage.' },
  ],
});

