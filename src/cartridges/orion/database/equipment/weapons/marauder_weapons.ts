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

// ─── MARAUDER / HEAVY ORDNANCE LINEAGE MAGITECH PURIST RELICS (§3.2 & §4) ───

/**
 * Canonical database definition for `b40RipperFalxWeapon` (`B-40 Ripper Falx`, id `'b40_ripper_falx'`, `15 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Shield-Breaker` (`shield_breaker_specialist`, Tier II).
 */
export const b40RipperFalxWeapon = buildMagitechWeapon({
  id: 'b40_ripper_falx',
  code: 'B-40',
  name: 'B-40 Ripper Falx',
  category: 'Blades: Curved',
  weaponClass: 'Falx',
  primaryDamageType: 'Pierce',
  weightClass: 'heavy',
  explicitEquipWeight: 15,
  gripMode: '2H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Forward-curving hook-blade (+25% Layer 2 Armor DUR shred)',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Forward-curving hook-blade (+25% Layer 2 Armor DUR shred).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'shield_breaker_specialist',
    effectSummary: 'Thracian Rhomphaia: Strikes against guarding targets deal +20% chip damage.',
  },
  flavorText: 'Two-handed forward-curving Thracian rhomphaia falx engineered to reach over shield rims and rip plating.',
  loadoutSlots: ['Weapon 1', 'Weapon 3'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#fb923c',
  identity: 'Modular-Frame Relic · Shield-Breaker Stance (15 WT · 2 Open Mounts + 1G)',
  lore: 'Two-handed forward-curving hook-blade whose sealed inner edge concentrates force into a beak that shreds +25% Layer 2 Armor Durability.',
  shotsPerChain: 3,
  damagePerShot: 17,
  chainDurationSec: 1.05,
  reloadDurationSec: 0.65,
  range: 34,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Falx Hook-Ripper Chain', desc: '3-step forward-curving hook-blade combo dealing 17 Pierce damage (+25% Armor DUR shred).' },
    { name: 'Rhomphaia Rim Wrench', dmg: 28, cd: 4.5, heat: 15, desc: 'Reaches over active shields to tear at upper carapace seams.' },
    { name: 'Plating Stripper Draw', dmg: 24, cd: 5.0, heat: 14, desc: 'Violent pull-cut that strips ablative and layered armor.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to brace the two-handed falx haft (0.34s Perfect Block window).' },
    { name: 'Dacian Shield-Splitter', dmg: 38, cd: 8.5, heat: 26, desc: 'Crushing overhead hook strike that collapses guard posture.' },
  ],
});

/**
 * Canonical database definition for `b55SkjaldborgAxeWeapon` (`B-55 Skjaldborg Axe`, id `'b55_skjaldborg_axe'`, `17 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Preserved Legacy Epithet: `"the Siegebreaker"`.
 * Paired Specialist Stance: `Viking Raider` (`viking_raider_specialist`, Tier II).
 */
export const b55SkjaldborgAxeWeapon = buildMagitechWeapon({
  id: 'b55_skjaldborg_axe',
  code: 'B-55',
  name: 'B-55 Skjaldborg Axe',
  legacyEpithet: 'the Siegebreaker',
  category: 'Impact & Axes',
  weaponClass: 'Battle Axe',
  primaryDamageType: 'Impact',
  weightClass: 'heavy',
  explicitEquipWeight: 17,
  gripMode: '2H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Integrated energy-vented broad-axe head',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Integrated energy-vented broad-axe head.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'viking_raider_specialist',
    effectSummary: 'Huscarl Skjaldborg: Guard breaks vent -5 Reactor Heat.',
  },
  flavorText: 'Known across the borderlands as the Siegebreaker.',
  loadoutSlots: ['Weapon 1', 'Aux 1'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  supportPulseOnHit: { heatVent: 5 },
  bladeTrailColor: '#f97316',
  identity: 'Modular-Frame Relic · Viking Raider Stance (17 WT · 2 Open Mounts + 1G)',
  lore: 'Colossal two-handed Dane broadaxe with exhaust vents along the sealed head that discharge reactor heat directly into crushing cleaves. Known across the borderlands as "the Siegebreaker".',
  shotsPerChain: 3,
  damagePerShot: 19,
  chainDurationSec: 1.15,
  reloadDurationSec: 0.75,
  range: 32,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Heavy Vent Cleave', desc: '3-hit energy-vented broadaxe combo dealing 19 Impact damage and venting 5 Heat per hit.' },
    { name: 'Thermal Exhaust Slam', dmg: 32, cd: 5.0, heat: -15, dt: 'Blast', desc: 'Slams the ground and vents 15 Reactor Heat in a fiery shockwave.' },
    { name: 'Skjaldborg Bearded Hook', dmg: 28, cd: 5.5, heat: 14, desc: 'Hooks enemy shields down to trigger a guard break.' },
    { name: 'Block', dmg: 14, cd: 0, heat: 4, isBlock: true, desc: 'Hold to brace behind the broadaxe head (0.34s Perfect Block window).' },
    { name: 'Siegebreaker Guillotine', dmg: 42, cd: 9.0, heat: 26, desc: 'High-commitment execution cleave with massive stagger force.' },
  ],
});

/**
 * Canonical database definition for `b80DoppelsoldnerGreatswordWeapon` (`B-80 Doppelsöldner Greatsword`, id `'b80_doppelsoldner_greatsword'`, `18 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Zweihander` (`zweihander_specialist`, Tier III).
 */
export const b80DoppelsoldnerGreatswordWeapon = buildMagitechWeapon({
  id: 'b80_doppelsoldner_greatsword',
  code: 'B-80',
  name: 'B-80 Doppelsöldner Greatsword',
  category: 'Blades: Straight',
  weaponClass: 'Zweihander',
  primaryDamageType: 'Impact',
  weightClass: 'heavy',
  explicitEquipWeight: 18,
  gripMode: '2H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Heavy shock-wave greatsword blade (+25% Impulse J)',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Heavy shock-wave greatsword blade (+25% Impulse J).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'zweihander_specialist',
    effectSummary: 'Landsknecht Doppelsöldner: Hitting 2+ targets vents -4 Reactor Heat.',
  },
  flavorText: 'Flamberge-lugged Landsknecht greatsword whose sealed shock-wave blade knocks pike and shield lines apart.',
  loadoutSlots: ['Weapon 1', 'Weapon 3'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#fb7185',
  identity: 'Modular-Frame Relic · Zweihander Stance (18 WT · 2 Open Mounts + 1G)',
  lore: 'Massive two-handed Landsknecht greatsword with parrying lugs and a sealed kinetic shock-core blade delivering +25% Impulse J.',
  shotsPerChain: 3,
  damagePerShot: 19,
  chainDurationSec: 1.2,
  reloadDurationSec: 0.75,
  range: 38,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Doppelsöldner Figure-Eight', desc: '3-stage wide greatsword figure-eight sweep dealing 19 Impact damage (+25% Impulse J).' },
    { name: 'Pike-Lopper Sweep', dmg: 30, cd: 5.0, heat: 16, desc: 'Wide 180-degree horizontal arc that batters grouped hostiles.' },
    { name: 'Parrying-Lug Ricasso Bash', dmg: 24, cd: 5.0, heat: 13, desc: 'Chokes up on the leather ricasso to deliver a high-poise guard crush.' },
    { name: 'Block', dmg: 14, cd: 0, heat: 3, isBlock: true, desc: 'Hold to brace the zweihander cross-guard and side rings (0.34s Perfect Block window).' },
    { name: 'Forlorn Hope Cleave', dmg: 41, cd: 9.0, heat: 28, desc: 'Devastating overhead shock-wave slam that scatters frontline formations.' },
  ],
});

/**
 * Canonical database definition for `m350MaulerWeapon` (`M-350 Mauler`, id `'m350_mauler'`, `14 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Siege Battery` (`artillery_battery_specialist`, Tier III).
 */
export const m350MaulerWeapon = buildMagitechWeapon({
  id: 'm350_mauler',
  code: 'M-350',
  name: 'M-350 Mauler',
  category: 'Casters',
  weaponClass: 'Blast Caster',
  primaryDamageType: 'Blast',
  weightClass: 'medium',
  explicitEquipWeight: 14,
  gripMode: 'VERSATILE',
  allowOneHandGrip: true,
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Three-round rotary grenade chamber',
    REGULATION: null,
  },
  action1Signature: 'Three-round rotary grenade chamber.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'artillery_battery_specialist',
    effectSummary: 'Bombardier Fire-Mission: Direct hits paint targets for +15% dorsal rocket lock speed.',
  },
  flavorText: 'Drum-fed rotary blast caster that paints impact zones for dorsal LN-1200 and LG-950 fire missions.',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#f97316',
  identity: 'Modular-Frame Relic · Siege Battery Primary (14 WT · 2 Open Mounts + 1G)',
  lore: 'Drum-fed blast caster built around a sealed three-round rotary grenade chamber that lobs proximity bursts and paints targets for dorsal rocket pods.',
  shotsPerChain: 3,
  damagePerShot: 16,
  chainDurationSec: 1.2,
  reloadDurationSec: 2.9,
  range: 84,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Three-Shot Rotary Thumper', desc: '3-grenade rotary chamber burst dealing 16 Blast damage per shell.' },
    { name: 'Airburst Shrapnel Shell', dmg: 24, cd: 4.5, heat: 16, desc: 'Detonates above cover to stagger grouped enemies.' },
    { name: 'Bouncing Concussion Round', dmg: 22, cd: 5.5, heat: 18, desc: 'High-impulse shell that knocks back frontline targets.' },
    { name: 'Thermobaric Target Paint', dmg: 20, cd: 6.0, heat: 20, desc: 'Ignites a blast pocket that paints targets for dorsal salvo lock.' },
    { name: 'Carpet Saturation', dmg: 34, cd: 8.5, heat: 30, desc: 'Rapid-fires a full drum of high-explosive shells.' },
  ],
});

/**
 * Canonical database definition for `ln1200AvalancheWeapon` (`LN-1200 Avalanche`, id `'ln1200_avalanche'`, `19 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Siege Battery` (`artillery_battery_specialist`, Tier III).
 */
export const ln1200AvalancheWeapon = buildMagitechWeapon({
  id: 'ln1200_avalanche',
  code: 'LN-1200',
  name: 'LN-1200 Avalanche',
  category: 'Carriers & Munitions',
  weaponClass: 'Rack',
  primaryDamageType: 'Blast',
  weightClass: 'heavy',
  explicitEquipWeight: 19,
  gripMode: 'DORSAL_CARRIER',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Automated dorsal salvo feed rails',
    REGULATION: null,
  },
  action1Signature: 'LN-1200 unguided rocket saturation salvo.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'artillery_battery_specialist',
    effectSummary: 'Bombardier Fire-Mission: Automated dorsal salvo rails cycle +15% faster against Mauler-painted targets.',
  },
  flavorText: 'Dorsal heavy rocket rack built for unguided area saturation and interference-baffled bombardments.',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  bladeTrailColor: '#ef4444',
  identity: 'Modular-Frame Relic · Siege Battery Rocket Rack (19 WT · 2 Open Mounts + 1G)',
  lore: 'Back-and-shoulder mounted heavy rocket rack equipped with sealed automated salvo feed rails for unguided rocket saturation.',
  shotsPerChain: 4,
  damagePerShot: 15,
  chainDurationSec: 1.6,
  reloadDurationSec: 3.6,
  range: 130,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Avalanche Rocket Saturation', desc: '4-rocket unguided dorsal saturation salvo dealing 15 Blast damage per warhead.' },
    { name: 'Chaff-Screen Volley', dmg: 25, cd: 5.5, heat: 20, desc: 'Launches rockets alongside interference chaff that bolsters shields.' },
    { name: 'Bunker-Buster Tandem', dmg: 30, cd: 6.5, heat: 24, desc: 'Tandem-charge warhead built to crack Hardened plating.' },
    { name: 'Shockwave Salvo', dmg: 22, cd: 5.5, heat: 18, desc: 'Staggering rocket ripple across a wide impact zone.' },
    { name: 'Full-Pod Avalanche', dmg: 40, cd: 10.0, heat: 36, desc: 'Fires every tube in a devastating long-range artillery strike.' },
  ],
});

/**
 * Canonical database definition for `lg950TomahawkWeapon` (`LG-950 Tomahawk`, id `'lg950_tomahawk'`, `18 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Siege Battery` (`artillery_battery_specialist`, Tier III).
 */
export const lg950TomahawkWeapon = buildMagitechWeapon({
  id: 'lg950_tomahawk',
  code: 'LG-950',
  name: 'LG-950 Tomahawk',
  category: 'Carriers & Munitions',
  weaponClass: 'Rack',
  primaryDamageType: 'Blast',
  weightClass: 'heavy',
  explicitEquipWeight: 18,
  gripMode: 'DORSAL_CARRIER',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Automated dorsal salvo feed rails',
    REGULATION: null,
  },
  action1Signature: 'LG-950 soft-lock multi-missile salvo.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'artillery_battery_specialist',
    effectSummary: 'Bombardier Fire-Mission: Direct Blast Caster hits accelerate dorsal soft-lock missile acquisition by +15%.',
  },
  flavorText: 'Back-mounted multi-cell guided missile rack utilizing soft-lock telemetry to track evasive targets.',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  bladeTrailColor: '#fb7185',
  identity: 'Modular-Frame Relic · Siege Battery Missile Rack (18 WT · 2 Open Mounts + 1G)',
  lore: 'Back-mounted multi-cell guided missile rack with sealed dorsal salvo feed rails and soft-lock telemetry.',
  shotsPerChain: 6,
  damagePerShot: 10,
  chainDurationSec: 1.7,
  reloadDurationSec: 3.5,
  range: 135,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Soft-Lock Multi-Missile Salvo', desc: '6-missile guided dorsal swarm dealing 10 Blast damage per warhead.' },
    { name: 'Top-Attack Javelin', dmg: 27, cd: 5.0, heat: 19, desc: 'Arcing missile that strikes from above, bypassing frontal shields.' },
    { name: 'Seeker Swarm', dmg: 24, cd: 6.0, heat: 21, desc: 'Homing cluster that tracks locked targets around cover.' },
    { name: 'Scramble Warhead', dmg: 19, cd: 5.5, heat: 17, desc: 'Disrupts enemy sensor lock and slows attack windups.' },
    { name: 'Tomahawk Saturation Strike', dmg: 38, cd: 9.5, heat: 35, desc: 'Locks all cells onto the primary target for maximum burst.' },
  ],
});

/**
 * Canonical database definition for `b25BrushcutterWeapon` (`B-25 Brushcutter`, id `'b25_brushcutter'`, `20 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Core Feat Chain: `C-10` Suppression (`Avalanche Surge`).
 */
export const b25BrushcutterWeapon = buildMagitechWeapon({
  id: 'b25_brushcutter',
  code: 'B-25',
  name: 'B-25 Brushcutter',
  category: 'Casters',
  weaponClass: 'Bolt Caster',
  primaryDamageType: 'Pierce',
  weightClass: 'heavy',
  explicitEquipWeight: 20,
  gripMode: '2H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Twin-rotor rotary gun receiver',
    REGULATION: null,
  },
  action1Signature: 'High-volume suppression streams.',
  puristResonance: {
    triggerType: 'CORE_FEAT_CHAIN',
    targetId: 'C-10',
    effectSummary: 'C-10 Suppression (Avalanche Surge): Applies 2x suppression stacks against targets behind cover or shields.',
  },
  flavorText: 'Core-Chain C-10 Apex twin-rotor rotary cannon that saturates firing lanes with flechette suppression streams.',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#fb923c',
  identity: 'Modular-Frame Relic · Core Chain C-10 Apex (20 WT · 2 Open Mounts + 1G)',
  lore: 'Twin-rotor rotary bolt caster that saturates firing arcs with high-velocity flechettes, applying double suppression stacks against shielded targets.',
  shotsPerChain: 16,
  damagePerShot: 4,
  chainDurationSec: 1.9,
  reloadDurationSec: 3.5,
  range: 92,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Twin-Rotor Suppression Stream', desc: '16-round high-volume rotary stream dealing 4 Pierce damage per round.' },
    { name: 'Intercept Curtain', dmg: 20, cd: 4.5, heat: 18, desc: 'Dense flechette wall that halts lunging enemies.' },
    { name: 'Rotor Spin-Up Shred', dmg: 24, cd: 5.5, heat: 20, desc: 'Spools both barrels to peak RPM to shred armor durability.' },
    { name: 'Lead Saturation', dmg: 16, cd: 5.0, heat: 16, desc: 'Wide-cone suppression sweep generating high Presence.' },
    { name: 'Melting Point Unload', dmg: 35, cd: 9.0, heat: 34, desc: 'Sustained rotary hailstorm until thermal limit.' },
  ],
});

// ─── BACKWARD-COMPATIBLE ALIAS EXPORTS & BASE CUSTOMIZABLE WEAPONS ──────────

/**
 * Backward-compatible alias for `b55SkjaldborgAxeWeapon` (legacy `siegebreaker`).
 */
export const siegebreakerWeapon: WeaponDefinition = {
  ...b55SkjaldborgAxeWeapon,
  id: 'siegebreaker',
};

/**
 * Backward-compatible alias for `ln1200AvalancheWeapon` (legacy `utility_siege_brace`).
 */
export const utilitySiegeBraceAuxiliary: WeaponDefinition = {
  ...ln1200AvalancheWeapon,
  id: 'utility_siege_brace',
};

/**
 * Backward-compatible alias for `ln1200AvalancheWeapon` (legacy `aux3_rad_kinetic_recycling`).
 */
export const aux3RadKineticRecyclingAuxiliary: WeaponDefinition = {
  ...ln1200AvalancheWeapon,
  id: 'aux3_rad_kinetic_recycling',
};

/**
 * Backward-compatible alias for `lg950TomahawkWeapon` (legacy `aux4_rad_ether_vapor`).
 */
export const aux4RadEtherVaporAuxiliary: WeaponDefinition = {
  ...lg950TomahawkWeapon,
  id: 'aux4_rad_ether_vapor',
};

/**
 * Canonical database definition for `maceWeapon` (`Sanctum Flange Mace`, id `'mace'`, load `'medium'`) — Weighted flanged morningstar mace engineered to dent heavy Ablative and Reactive armor.
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
 * Canonical database definition for `handAxeWeapon` (`Marauder Hand Axe`, id `'hand_axe'`, load `'heavy'`) — Heavy-bearded boarding and siege hand axe built for aggressive close-quarters hacking.
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
