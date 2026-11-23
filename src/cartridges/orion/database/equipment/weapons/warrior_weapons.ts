/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import { LONG_SWORD_STRIP_BASE64 } from './base_sprites';
import { buildMagitechWeapon } from './builder';

// ─── WARRIOR / ASSAULT LINEAGE MAGITECH PURIST RELICS (§3.1) ────────────────

/**
 * Canonical database definition for `n55GladiusWeapon` (`N-55 Gladius`, id `'n55_gladius'`, `11 WT`, `3` Open Slots: `CONTACT`, `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Repeating Arbalest` (`repeating_arbalest_specialist`, Tier II).
 */
export const n55GladiusWeapon = buildMagitechWeapon({
  id: 'n55_gladius',
  code: 'N-55',
  name: 'N-55 Gladius',
  weaponClass: 'Bolt Caster',
  primaryDamageType: 'Impact',
  weightClass: 'medium',
  explicitEquipWeight: 11,
  gripMode: '1H',
  architectureTier: 'REFERENCE_PLATFORM',
  openDomains: ['CONTACT', 'DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: '3-round stabilized kinetic burst salvo (BCU = 54 reference bolter).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'repeating_arbalest_specialist',
    effectSummary: 'Chu-Ko-Nu Volley: Firing from a dorsal carrier vents heat on the next bolt burst.',
  },
  flavorText: 'Warrior BCU = 54 reference bolter built on an open 3-domain military rail architecture.',
  skillCount: 3,
  loadoutSlots: ['Weapon 1', 'Weapon 2'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#f8fafc',
  identity: 'Reference Platform · Repeating Arbalest Stance (11 WT · 3 Open Mounts + 1G)',
  lore: 'Standard-issue BCU reference Bolt Caster engineered for disciplined 3-round kinetic burst salvos and recoil-stabilized frontline fire.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.5,
  reloadDurationSec: 3.15,
  range: 88,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Stabilized 3-Round Salvo', desc: 'Reference kinetic burst salvo dealing 6 Impact damage per bolt (54 BCU).' },
    { name: 'Hammerhead Impact Slug', dmg: 20, cd: 4.0, heat: 14, desc: 'High-mass kinetic slug that dents heavy armor plating.' },
    { name: 'Compensated Double-Tap', dmg: 16, cd: 5.0, heat: 12, desc: 'Gyro-stabilized two-round burst with tight grouping.' },
    { name: 'Suppressive Sweep', dmg: 12, cd: 5.5, heat: 16, desc: 'Horizontal suppression fan that slows advancing targets.' },
    { name: 'Overpressure Salvo', dmg: 30, cd: 8.5, heat: 28, desc: 'Full-chamber kinetic dump delivering high stagger pressure.' },
  ],
});

/**
 * Canonical database definition for `n20RotaryBandolierWeapon` (`N-20 Rotary Bandolier`, id `'n20_rotary_bandolier'`, `7 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Repeating Arbalest` (`repeating_arbalest_specialist`, Tier II).
 */
export const n20RotaryBandolierWeapon = buildMagitechWeapon({
  id: 'n20_rotary_bandolier',
  code: 'N-20',
  name: 'N-20 Rotary Bandolier',
  category: 'Carriers & Munitions',
  weaponClass: 'Bandolier',
  primaryDamageType: 'Impact',
  weightClass: 'light',
  explicitEquipWeight: 7,
  gripMode: 'DORSAL_CARRIER',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Motorized chest-to-back belt feed',
    REGULATION: null,
  },
  action1Signature: 'Eliminates burst-fire recoil drift during sustained volleys.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'repeating_arbalest_specialist',
    effectSummary: 'Chu-Ko-Nu Volley: Eliminates burst-fire recoil drift and vents heat on linked bolt bursts.',
  },
  flavorText: 'Motorized chest-to-back rotary belt feed engineered for the Repeating Arbalest stance.',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  bladeTrailColor: '#f87171',
  identity: 'Modular-Frame Relic · Repeating Arbalest Dorsal Feed (7 WT · 2 Open Mounts + 1G)',
  lore: 'Dorsal and chest-linked rotary bandolier with a sealed motorized belt feed that stabilizes rapid bolt-caster volleys.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.35,
  reloadDurationSec: 2.1,
  range: 84,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Rotary Feed Burst', desc: 'Stabilized belt-fed kinetic volley eliminating burst-fire recoil drift.' },
    { name: 'Belt-Link Overfeed', dmg: 18, cd: 4.2, heat: 11, desc: 'Cycles a high-density kinetic burst from the dorsal feed.' },
    { name: 'Recoil Damper Lock', dmg: 14, cd: 5.0, heat: 8, desc: 'Locks rotary tensioners to zero out spread.' },
    { name: 'Rapid Feed Cycle', dmg: 16, cd: 5.0, heat: -6, desc: 'Flushes spent casings to vent -6 Heat and speed reload.' },
    { name: 'Chu-Ko-Nu Saturation', dmg: 28, cd: 8.0, heat: 20, desc: 'Continuous motorized bolt stream across the forward firing lane.' },
  ],
});

/**
 * Canonical database definition for `n60LimitaneiSpathaWeapon` (`N-60 Limitanei Spatha`, id `'n60_limitanei_spatha'`, `9 WT`, `3` Open Slots: `CONTACT`, `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Limitanei` (`limitanei_specialist`, Tier II).
 */
export const n60LimitaneiSpathaWeapon = buildMagitechWeapon({
  id: 'n60_limitanei_spatha',
  code: 'N-60',
  name: 'N-60 Limitanei Spatha',
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
  action1Signature: 'Clean 4-step cut-and-thrust chain.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'limitanei_specialist',
    effectSummary: 'Plumbata & Spatha: Throwing a Plumbata empowers the next melee swing (+15% BCU).',
  },
  flavorText: 'Frontier service sword with balanced mil-spec tang and full 3-domain modular rails.',
  loadoutSlots: ['Weapon 1', 'Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#f8fafc',
  identity: 'Reference Platform · Limitanei Stance (9 WT · 3 Open Mounts + 1G)',
  lore: 'Frontier limitanei cavalry and infantry spatha built on a 3-slot open military reference tang for seamless dart-and-blade skirmishing.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 1.0,
  reloadDurationSec: 0.55,
  range: 28,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Limitanei Cut-and-Thrust', desc: 'Clean 4-step cut-and-thrust chain dealing 13 Pierce damage per strike.' },
    { name: 'Borderland Lunge', dmg: 23, cd: 4.2, heat: 11, desc: 'Forward skirmish thrust that capitalizes on Plumbata openings.' },
    { name: 'Edge-Turn Riposte', dmg: 19, cd: 4.8, heat: 12, desc: 'Crisp lateral cut that checks flanking rushers.' },
    { name: 'Block', dmg: 10, cd: 0, heat: 3, isBlock: true, desc: 'Hold to raise spatha cross-guard (0.34s Perfect Block window).' },
    { name: 'Frontier Decimation', dmg: 31, cd: 8.0, heat: 22, desc: 'Empowered driving thrust that punishes staggered targets.' },
  ],
});

/**
 * Canonical database definition for `n12PlumbataPodWeapon` (`N-12 Plumbata Pod`, id `'n12_plumbata_pod'`, `6 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Limitanei` (`limitanei_specialist`, Tier II).
 */
export const n12PlumbataPodWeapon = buildMagitechWeapon({
  id: 'n12_plumbata_pod',
  code: 'N-12',
  name: 'N-12 Plumbata Pod',
  category: 'Carriers & Munitions',
  weaponClass: 'Plumbata',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 6,
  gripMode: 'DORSAL_CARRIER',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Dorsal spring-ejection rail',
    REGULATION: null,
  },
  action1Signature: 'Lobs weighted kinetic darts in high arcs over shield walls.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'limitanei_specialist',
    effectSummary: 'Plumbata & Spatha: Weighted dart impacts mark targets so the next Spatha swing gains +15% BCU.',
  },
  flavorText: 'Dorsal spring-ejection plumbata rack that lobs lead-weighted kinetic darts over enemy barriers.',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  bladeTrailColor: '#fbbf24',
  identity: 'Modular-Frame Relic · Limitanei Dorsal Pod (6 WT · 2 Open Mounts + 1G)',
  lore: 'Sealed dorsal spring-ejection pod housing lead-weighted plumbata war-darts designed to arc over shield walls before melee contact.',
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDurationSec: 1.2,
  reloadDurationSec: 2.0,
  range: 78,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Arcing Plumbata Lob', desc: 'Lobs weighted kinetic darts in high arcs over shield walls (9 Pierce damage).' },
    { name: 'Lead-Weighted Pin', dmg: 20, cd: 4.2, heat: 10, desc: 'Heavy plumbata dart that weights down enemy shields.' },
    { name: 'Skirmish Volleys', dmg: 18, cd: 4.8, heat: 11, desc: 'Three-dart plunging fan that exposes frontline targets.' },
    { name: 'Spring-Rack Reset', dmg: 14, cd: 5.0, heat: 6, desc: 'Snap-loads the dorsal ejection rail and fires a quick dart.' },
    { name: 'Mattiobarbuli Rain', dmg: 29, cd: 8.0, heat: 20, desc: 'Full-pod high-angle plumbata salvo across the forward sector.' },
  ],
});

/**
 * Canonical database definition for `m450ArbalestGreatbowWeapon` (`M-450 Arbalest Greatbow`, id `'m450_arbalest_greatbow'`, `19 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Yeoman Longbow` (`longbow_specialist`, Tier II).
 */
export const m450ArbalestGreatbowWeapon = buildMagitechWeapon({
  id: 'm450_arbalest_greatbow',
  code: 'M-450',
  name: 'M-450 Arbalest Greatbow',
  category: 'Bows',
  weaponClass: 'Great Bow',
  primaryDamageType: 'Impact',
  weightClass: 'heavy',
  explicitEquipWeight: 19,
  gripMode: '2H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'High-poundage shock-rail war limbs (+6 THR pierce at full draw)',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'High-poundage shock-rail war limbs (+6 THR pierce at full draw).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'longbow_specialist',
    effectSummary: 'Agincourt Stake-Line: Stationary draws (μ = 0) vent -3 Reactor Heat.',
  },
  flavorText: 'Heavy torsion-rail war greatbow whose sealed shock limbs punch through hardened armor thresholds.',
  skillCount: 4,
  loadoutSlots: ['Weapon 3', 'Weapon 4'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#f97316',
  identity: 'Modular-Frame Relic · Yeoman Longbow Stance (19 WT · 2 Open Mounts + 1G)',
  lore: 'Heavy shock-rail greatbow firing high-impulse war shafts that punch +6 Armor THR pierce at full stationary draw.',
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDurationSec: 1.6,
  reloadDurationSec: 3.4,
  range: 130,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Shock-Rail Full Draw', desc: '4-shot heavy war-bow chain dealing 14 Impact damage (+6 THR pierce at full draw).' },
    { name: 'Agincourt Bodkin Impale', dmg: 28, cd: 5.0, heat: 18, desc: 'Channels a shock-rail war shaft through hardened plating.' },
    { name: 'Armor-Cracking Draw', dmg: 25, cd: 6.0, heat: 18, desc: 'Shatters hardened plating thresholds on direct hit.' },
    { name: 'Stake-Line Anchor Shot', dmg: 20, cd: 5.5, heat: 15, desc: 'High-impulse stake shaft that halts charging enemies.' },
    { name: 'Cataclysmic Skewer', dmg: 38, cd: 10.0, heat: 32, desc: 'Overcharged greatbow war-lance that pierces entire enemy formations.' },
  ],
});

/**
 * Canonical database definition for `m10BodkinQuiverWeapon` (`M-10 Bodkin Quiver`, id `'m10_bodkin_quiver'`, `6 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Yeoman Longbow` (`longbow_specialist`, Tier II).
 */
export const m10BodkinQuiverWeapon = buildMagitechWeapon({
  id: 'm10_bodkin_quiver',
  code: 'M-10',
  name: 'M-10 Bodkin Quiver',
  category: 'Carriers & Munitions',
  weaponClass: 'Quiver',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 6,
  gripMode: 'DORSAL_CARRIER',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Automated magnetic fletching feed',
    REGULATION: null,
  },
  action1Signature: 'Accelerates bow nock/draw cycle tempo by +10%.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'longbow_specialist',
    effectSummary: 'Agincourt Stake-Line: Automated magnetic fletching feed accelerates nock/draw tempo by +10%.',
  },
  flavorText: 'Dorsal quiver with a sealed magnetic fletching escalator that presents heavy bodkin shafts directly to the draw hand.',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  bladeTrailColor: '#fbbf24',
  identity: 'Modular-Frame Relic · Yeoman Longbow Dorsal Quiver (6 WT · 2 Open Mounts + 1G)',
  lore: 'Automated magnetic fletching quiver engineered to pair with the M-450 Arbalest Greatbow for sustained long-range stake-line volleys.',
  shotsPerChain: 10,
  damagePerShot: 6,
  chainDurationSec: 1.3,
  reloadDurationSec: 2.0,
  range: 95,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Magnetic Nock Feed', desc: 'Accelerates bow nock/draw cycle tempo by +10% while firing 6 Pierce bodkin darts.' },
    { name: 'Tempered Bodkin Sheaf', dmg: 20, cd: 4.0, heat: 10, desc: 'Feeds armor-piercing bodkin tips for the next salvo.' },
    { name: 'Stake-Line Resupply', dmg: 15, cd: 5.0, heat: -6, desc: 'Cycles magnetic feed rails and vents -6 Reactor Heat.' },
    { name: 'Pinned Corridor Volley', dmg: 18, cd: 5.0, heat: 12, desc: 'Arcs a cluster of heavy bodkin shafts into a target zone.' },
    { name: 'Yeoman Hailstorm', dmg: 30, cd: 8.0, heat: 20, desc: 'Empties the magnetic quiver rack in a high-angle armor-piercing rain.' },
  ],
});

/**
 * Canonical database definition for `s9TurbineOdachiWeapon` (`S-9 Turbine Odachi`, id `'s9_turbine_odachi'`, `16 WT`, `1` Open Slot: `REGULATION` + `1G`).
 * Paired Specialist Stance: `Odachi` (`odachi_specialist`, Tier III).
 */
export const s9TurbineOdachiWeapon = buildMagitechWeapon({
  id: 's9_turbine_odachi',
  code: 'S-9',
  name: 'S-9 Turbine Odachi',
  category: 'Blades: Curved',
  weaponClass: 'Odachi',
  primaryDamageType: 'Pierce',
  weightClass: 'heavy',
  explicitEquipWeight: 16,
  gripMode: '2H',
  architectureTier: 'SEMI_SEALED_ASSEMBLY',
  openDomains: ['REGULATION'],
  sealedDomains: {
    CONTACT: 'Turbine-vented great blade',
    DELIVERY: 'Two-handed counterbalanced tsuka assembly',
    REGULATION: null,
  },
  action1Signature: '3-step wide draw-cut sweep.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'odachi_specialist',
    effectSummary: 'Nodachi Battojutsu: Step 1 lunge distance increased by +25%.',
  },
  flavorText: 'Massive turbine-vented field sword whose sealed edge and two-handed tsuka propel devastating draw-cut lunges.',
  loadoutSlots: ['Weapon 1', 'Weapon 3'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#ef4444',
  identity: 'Semi-Sealed Assembly · Odachi Stance (16 WT · 1 Open Mount + 1G)',
  lore: 'Two-handed alchemic turbine odachi with a hermetically mated great-blade and long tsuka, leaving the rear exhaust regulation port open for tuning.',
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDurationSec: 1.15,
  reloadDurationSec: 0.65,
  range: 38,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Turbine Draw-Cut Sweep', desc: '3-step wide draw-cut sweep dealing 18 Pierce damage across a broad forward arc.' },
    { name: 'Battojutsu Turbine Lunge', dmg: 29, cd: 4.5, heat: 15, desc: 'High-speed spooling draw-slash with extended forward lunge.' },
    { name: 'Great-Blade Horizon Cleave', dmg: 25, cd: 5.2, heat: 16, desc: 'Wide anti-formation sweep that cuts through multiple targets.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to brace the odachi spine in two-handed guard (0.34s Perfect Block window).' },
    { name: 'Redline Swallow Sever', dmg: 38, cd: 9.0, heat: 26, desc: 'Full-turbine overhead draw-cut that cleaves through guarded frames.' },
  ],
});

// ─── BACKWARD-COMPATIBLE ALIAS EXPORTS & BASE CUSTOMIZABLE LONGSWORD ────────

/**
 * Backward-compatible alias for `n55GladiusWeapon`.
 */
export const gladiusBoltcasterWeapon: WeaponDefinition = {
  ...n55GladiusWeapon,
  id: 'gladius_boltcaster',
  name: 'Gladius Boltcaster (N-55)',
};

/**
 * Backward-compatible alias for `m450ArbalestGreatbowWeapon` (legacy `m450_pilum`).
 */
export const m450PilumWeapon: WeaponDefinition = {
  ...m450ArbalestGreatbowWeapon,
  id: 'm450_pilum',
};

/**
 * Backward-compatible alias for `n20RotaryBandolierWeapon` (legacy `utility_ichor_surge`).
 */
export const utilityIchorSurgeAuxiliary: WeaponDefinition = {
  ...n20RotaryBandolierWeapon,
  id: 'utility_ichor_surge',
};

/**
 * Backward-compatible alias for `n20RotaryBandolierWeapon` (legacy `aux3_pnsy_rockweiler_buckler`).
 */
export const aux3PnsyRockweilerBucklerAuxiliary: WeaponDefinition = {
  ...n20RotaryBandolierWeapon,
  id: 'aux3_pnsy_rockweiler_buckler',
};

/**
 * Backward-compatible alias for `n12PlumbataPodWeapon` (legacy `aux4_pnsy_rough_rider_booster`).
 */
export const aux4PnsyRoughRiderBoosterAuxiliary: WeaponDefinition = {
  ...n12PlumbataPodWeapon,
  id: 'aux4_pnsy_rough_rider_booster',
};

/**
 * Canonical database definition for `longSwordWeapon` (`Camelot Longsword`, id `'long_sword'`, load `'medium'`) — Balanced double-edged knightly magitech broadsword with wide sweeping arcs and disciplined reach.
 */
export const longSwordWeapon: WeaponDefinition = {
  id: 'long_sword',
  name: 'Camelot Longsword',
  category: 'Blades: Straight',
  weaponTier: 'customizable',
  class: 'Blade / Longsword (Weapon 1 / Aux 1)',
  weaponClass: 'Blade',
  loadoutSlots: ['Weapon 1', 'Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'medium',
  canBlock: true,
  bladeTrailColor: '#f8fafc',
  description: 'Balanced double-edged knightly magitech broadsword with wide sweeping arcs and disciplined reach.',
  lore:
    'Standard-issue melee blade of the Belldor frontline. Accepts Gem tuning along its fuller groove to channel elemental reactor arcs.',
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDurationSec: 1.2,
  reloadDurationSec: 0.65,
  primaryDamageType: 'Pierce',
  variantStripBase64: LONG_SWORD_STRIP_BASE64,
  hardpointSprite: {
    base64: LONG_SWORD_STRIP_BASE64,
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
    base64: LONG_SWORD_STRIP_BASE64,
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
      name: 'Knightly Four-Slash',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 14,
      tellDurationSec: 0.09,
      actionDurationSec: 0.32,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.65,
      heatCost: 3,
      range: 28,
      description: 'Four-strike measured broadsword sequence dealing 14 Pierce damage per slash.',
    },
    {
      slot: 1,
      name: 'Thrusting Advance',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 24,
      tellDurationSec: 0.2,
      actionDurationSec: 0.35,
      cooldownSec: 4.2,
      heatCost: 12,
      range: 36,
      description: 'Lunging point-first piercing thrust with high armor penetration.',
    },
    {
      slot: 2,
      name: 'Crescent Cleave',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.25,
      actionDurationSec: 0.4,
      cooldownSec: 5.0,
      heatCost: 14,
      range: 30,
      description: 'Horizontal sweeping blade arc that clips flanking combatants.',
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
      range: 24,
      description: 'Raise broadsword guard to deflect incoming attacks (0.34s Perfect Block window).',
    },
    {
      slot: 4,
      name: 'Execution Arc',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 32,
      tellDurationSec: 0.35,
      actionDurationSec: 0.6,
      cooldownSec: 8.0,
      heatCost: 26,
      range: 32,
      description: 'Two-handed overhead downward stroke that staggers armored combatants.',
    },
  ],
};
