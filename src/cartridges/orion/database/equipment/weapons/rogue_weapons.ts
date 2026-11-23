/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import {
  GREAT_BOW_STRIP_BASE64,
  QUIVER_STRIP_BASE64,
} from './base_sprites';
import { buildMagitechWeapon } from './builder';

// ─── ROGUE / RECON LINEAGE MAGITECH PURIST RELICS (§3.2 & §4) ───────────────

/**
 * Canonical database definition for `s6PhantomMesserWeapon` (`S-6 Phantom Messer`, id `'s6_phantom_messer'`, `5 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Sword & Buckler` (`sword_buckler_specialist`, Tier I).
 */
export const s6PhantomMesserWeapon = buildMagitechWeapon({
  id: 's6_phantom_messer',
  code: 'S-6',
  name: 'S-6 Phantom Messer',
  category: 'Blades: Curved',
  weaponClass: 'Messer',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 5,
  gripMode: '1H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Thermal-coated low-emission stealth blade',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Silent 4-step slash chain.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'sword_buckler_specialist',
    effectSummary: 'I.33 Ward & Bind: Parries mask thermal signature for 1.5s.',
  },
  flavorText: 'Thermal-coated single-edged stealth messer built for silent I.33 sword-and-buckler binds.',
  loadoutSlots: ['Weapon 1', 'Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  supportPulseOnHit: { heatVent: 4 },
  bladeTrailColor: '#f0abfc',
  identity: 'Modular-Frame Relic · Sword & Buckler Stance (5 WT · 2 Open Mounts + 1G)',
  lore: 'Thermal-absorbent stealth messer whose sealed low-emission blade vents reactor heat on every close-quarters slash.',
  shotsPerChain: 4,
  damagePerShot: 11,
  chainDurationSec: 0.78,
  reloadDurationSec: 0.38,
  range: 25,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Silent Messer Slash Chain', desc: 'Silent 4-step slash chain dealing 11 Pierce damage and venting 4 Heat per hit.' },
    { name: 'Zero-Signature Thrust', dmg: 23, cd: 4.0, heat: -8, desc: 'Dampened puncture strike that vents 8 Reactor Heat on impact.' },
    { name: 'Nagel Bind Slice', dmg: 20, cd: 4.5, heat: 8, desc: 'Traps the opponent’s weapon on the messer side-nail before slicing.' },
    { name: 'Block', dmg: 9, cd: 0, heat: 2, isBlock: true, desc: 'Hold to deflect with thermal-coated blade (0.34s Perfect Block window).' },
    { name: 'Eclipse Sever', dmg: 29, cd: 7.2, heat: 14, desc: 'Paired cross-slash that strips enemy shield harmonics.' },
  ],
});

/**
 * Canonical database definition for `vx10EclipseDiscWeapon` (`VX-10 Eclipse Disc`, id `'vx10_eclipse_disc'`, `6 WT`, `0` Open Slots: `SEALED_MONOLITH` + `1G`).
 * Paired Specialist Stance: `Sword & Buckler` (`sword_buckler_specialist`, Tier I).
 */
export const vx10EclipseDiscWeapon = buildMagitechWeapon({
  id: 'vx10_eclipse_disc',
  code: 'VX-10',
  name: 'VX-10 Eclipse Disc',
  category: 'Shields',
  weaponClass: 'Disc',
  primaryDamageType: 'Wave',
  weightClass: 'light',
  explicitEquipWeight: 6,
  gripMode: '1H',
  architectureTier: 'SEALED_MONOLITH',
  openDomains: [],
  sealedDomains: {
    CONTACT: 'Hermetically sealed revolving hard-light forearm disc',
    DELIVERY: 'Hermetically sealed gyro-bearing forearm mount',
    REGULATION: 'Hermetically sealed centrifugal wave phase-loop',
  },
  action1Signature: 'Centrifugal wave deflection against grazing fire.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'sword_buckler_specialist',
    effectSummary: 'I.33 Ward & Bind: Centrifugal disc parries mask thermal signature for 1.5s.',
  },
  flavorText: 'Hermetically sealed revolving hard-light forearm disc (1G only) engineered for centrifugal wave deflection.',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  canBlock: true,
  passiveShieldBonus: 20,
  supportPulseOnHit: { heatVent: 6, shieldRestore: 5 },
  bladeTrailColor: '#c084fc',
  identity: 'Hermetically Sealed Monolith · Sword & Buckler Disc (6 WT · 0 Open Mounts + 1G)',
  lore: 'Single-piece VX Phantom gyro-stabilized hard-light disc shield whose sealed housing cannot be opened without ruining harmonic alignment.',
  shotsPerChain: 3,
  damagePerShot: 11,
  chainDurationSec: 0.85,
  reloadDurationSec: 0.45,
  range: 24,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Centrifugal Wave Deflect', desc: '3-hit spinning forearm disc strike dealing 11 Wave damage and deflecting grazing fire.' },
    { name: 'Eclipse Rim Ricochet', dmg: 19, cd: 4.2, heat: -6, desc: 'Spins the disc rim to vent -6 Heat and stagger melee attackers.' },
    { name: 'Refractive Shimmer Ward', dmg: 15, cd: 4.8, heat: 8, desc: 'Restores +14 Shield and dampens thermal lock-on.' },
    { name: 'Block', dmg: 10, cd: 0, heat: 2, isBlock: true, desc: 'Hold to spin up the VX-10 Eclipse Disc guard (0.34s Perfect Block window).' },
    { name: 'Gyro Wave Discharge', dmg: 28, cd: 7.5, heat: 16, dt: 'Wave', desc: 'Releases stored rotational energy in a razor-sharp Wave ring.' },
  ],
});

/**
 * Canonical database definition for `s2TurbineKhopeshWeapon` (`S-2 Turbine Khopesh`, id `'s2_turbine_khopesh'`, `7 WT`, `1` Open Slot: `REGULATION` + `1G`).
 * Paired Specialist Stance: `Boarder` (`pistol_cutlass_specialist`, Tier I).
 */
export const s2TurbineKhopeshWeapon = buildMagitechWeapon({
  id: 's2_turbine_khopesh',
  code: 'S-2',
  name: 'S-2 Turbine Khopesh',
  category: 'Blades: Curved',
  weaponClass: 'Khopesh',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 7,
  gripMode: '1H',
  architectureTier: 'SEMI_SEALED_ASSEMBLY',
  openDomains: ['REGULATION'],
  sealedDomains: {
    CONTACT: 'Motorized sickle-sword turbine edge',
    DELIVERY: 'Sealed hooked boarding grip & drive train',
    REGULATION: null,
  },
  action1Signature: 'Shield-hooking sweep that strips guard stability.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'pistol_cutlass_specialist',
    effectSummary: 'Brace & Cutlass: Off-hand caster shots reload +15% faster after a melee hit.',
  },
  flavorText: 'Alchemic turbine-assisted sickle-sword built to hook shields aside for point-blank pistol volleys.',
  loadoutSlots: ['Weapon 1', 'Aux 1', 'Aux 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#ef4444',
  identity: 'Semi-Sealed Assembly · Boarder Stance (7 WT · 1 Open Mount + 1G)',
  lore: 'Alchemic turbine-assisted curved khopesh with a factory-sealed motorized blade and hooked grip, leaving its rear exhaust regulation port open.',
  shotsPerChain: 4,
  damagePerShot: 11,
  chainDurationSec: 0.85,
  reloadDurationSec: 0.45,
  range: 25,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Turbine Shield-Hook Sweep', desc: '4-hit high-RPM hooked khopesh sweep dealing 11 Pierce damage and stripping guard stability.' },
    { name: 'Spooling Lunge', dmg: 24, cd: 4.0, heat: 11, desc: 'Turbine-boosted gap closer that bypasses frontal guard.' },
    { name: 'Cross-Rotor Riposte', dmg: 18, cd: 4.8, heat: 10, desc: 'Scissoring slash optimized for pistol-and-cutlass boarding stances.' },
    { name: 'Block', dmg: 10, cd: 0, heat: 3, isBlock: true, desc: 'Hold to raise turbine blade guard (0.34s Perfect Block window).' },
    { name: 'Redline Cyclone', dmg: 29, cd: 7.5, heat: 22, desc: 'Vents turbine exhaust into a 360-degree razor cleave.' },
  ],
});

/**
 * Canonical database definition for `sv12ViperWeapon` (`SV-12 Viper`, id `'sv12_viper'`, `6 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Boarder` (`pistol_cutlass_specialist`, Tier I).
 */
export const sv12ViperWeapon = buildMagitechWeapon({
  id: 'sv12_viper',
  code: 'SV-12',
  name: 'SV-12 Viper',
  category: 'Casters',
  weaponClass: 'Bolt Caster',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 6,
  gripMode: '1H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'High-cyclic micro-bolt receiver',
    REGULATION: null,
  },
  action1Signature: 'Rapid close-quarters machine-pistol burst (2x salvo).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'pistol_cutlass_specialist',
    effectSummary: 'Brace & Cutlass: Off-hand Viper bursts reload +15% faster after a melee hit.',
  },
  flavorText: 'Ultra-compact high-cyclic micro-bolt pistol engineered for point-blank boarding actions.',
  loadoutSlots: ['Weapon 1', 'Aux 2'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#a855f7',
  identity: 'Modular-Frame Relic · Boarder Sidearm (6 WT · 2 Open Mounts + 1G)',
  lore: 'Ultra-compact machine-pistol bolt caster spitting high-velocity caseless needles at blistering close-quarters fire rates.',
  shotsPerChain: 14,
  damagePerShot: 4,
  chainDurationSec: 1.1,
  reloadDurationSec: 2.1,
  range: 68,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Viper Machine-Pistol Burst', desc: '14-round high-RPM close-quarters 2x salvo dealing 4 Pierce damage per shot.' },
    { name: 'Point-Blank Mag Dump', dmg: 24, cd: 4.0, heat: 12, desc: 'Concentrated close-range salvo that shreds exposed frame joints.' },
    { name: 'Evasive Strafe Volley', dmg: 18, cd: 4.5, heat: 10, desc: 'Rapid mobile burst fired on the move without accuracy loss.' },
    { name: 'Flechette Fan', dmg: 15, cd: 4.5, heat: 11, desc: 'Close-quarters cone burst that tags flanking enemies.' },
    { name: 'Venom Overdrive', dmg: 30, cd: 7.5, heat: 22, desc: 'Hyper-velocity magazine unload with bonus critical damage.' },
  ],
});

/**
 * Canonical database definition for `s8GhostKatanaWeapon` (`S-8 Ghost Katana`, id `'s8_ghost_katana'`, `9 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Daisho` (`daisho_specialist`, Tier II).
 */
export const s8GhostKatanaWeapon = buildMagitechWeapon({
  id: 's8_ghost_katana',
  code: 'S-8',
  name: 'S-8 Ghost Katana',
  category: 'Blades: Curved',
  weaponClass: 'Katana',
  primaryDamageType: 'Pierce',
  weightClass: 'medium',
  explicitEquipWeight: 9,
  gripMode: '1H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Master-folded eastern draw-cut blade',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Precision 4-step curved combo.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'daisho_specialist',
    effectSummary: 'Niten Ichi-Ryu: Paired off-hand slashes ignore +3 Armor THR.',
  },
  flavorText: 'Master-folded harmonic katana whose sealed razor nagasa pairs with the S-4 Whisper Wakizashi.',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#e879f9',
  identity: 'Modular-Frame Relic · Daisho Stance Primary (9 WT · 2 Open Mounts + 1G)',
  lore: 'Master-folded eastern draw-cut blade with a factory-sealed monomolecular edge and customizable tsuka and tsuba mounts.',
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDurationSec: 0.92,
  reloadDurationSec: 0.48,
  range: 30,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Ghost Iai 4-Step Combo', desc: 'Precision 4-step curved draw-cut combo dealing 14 Pierce damage per slash.' },
    { name: 'Niten Cross-Cut', dmg: 25, cd: 4.2, heat: 11, desc: 'Synchronized main-hand draw cut that exposes armor seams.' },
    { name: 'Mist-Step Draw', dmg: 20, cd: 4.6, heat: 10, desc: 'Gliding lateral slash with minimal recovery.' },
    { name: 'Block', dmg: 11, cd: 0, heat: 2, isBlock: true, desc: 'Hold to parry along the katana mune spine (0.34s Perfect Block window).' },
    { name: 'Void Horizon Sever', dmg: 33, cd: 8.0, heat: 22, desc: 'Lightning-fast iaijutsu dash cut that bypasses frontal guard.' },
  ],
});

/**
 * Canonical database definition for `s4WhisperWakizashiWeapon` (`S-4 Whisper Wakizashi`, id `'s4_whisper_wakizashi'`, `5 WT`, `0` Open Slots: `SEALED_MONOLITH` + `1G`).
 * Paired Specialist Stance: `Daisho` (`daisho_specialist`, Tier II).
 */
export const s4WhisperWakizashiWeapon = buildMagitechWeapon({
  id: 's4_whisper_wakizashi',
  code: 'S-4',
  name: 'S-4 Whisper Wakizashi',
  category: 'Blades: Curved',
  weaponClass: 'Wakizashi',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 5,
  gripMode: '1H',
  architectureTier: 'SEALED_MONOLITH',
  openDomains: [],
  sealedDomains: {
    CONTACT: 'Hermetically sealed single-piece monomolecular companion blade',
    DELIVERY: 'Hermetically sealed full-tang acoustic-damped tsuka',
    REGULATION: 'Hermetically sealed zero-backlash harmonic node',
  },
  action1Signature: 'Rapid close-quarters counter-cuts.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'daisho_specialist',
    effectSummary: 'Niten Ichi-Ryu: Paired off-hand wakizashi slashes ignore +3 Armor THR.',
  },
  flavorText: 'Single-piece monomolecular companion blade (1G only) forged for Daisho Niten Ichi-Ryu pairing.',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#d8b4fe',
  identity: 'Hermetically Sealed Monolith · Daisho Companion (5 WT · 0 Open Mounts + 1G)',
  lore: 'Zero-backlash monomolecular companion wakizashi forged from a continuous crystal-steel billet (0 component slots + 1G Resonance socket).',
  shotsPerChain: 5,
  damagePerShot: 10,
  chainDurationSec: 0.75,
  reloadDurationSec: 0.35,
  range: 23,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Whisper Counter-Cut Flurry', desc: '5-hit rapid close-quarters counter-cuts dealing 10 Pierce damage per slash.' },
    { name: 'Niten Off-Hand Bind', dmg: 23, cd: 3.8, heat: 9, desc: 'Traps an incoming strike and counters across the seam (+3 THR ignore in Daisho).' },
    { name: 'Arterial Tendon Cut', dmg: 18, cd: 4.2, heat: 8, desc: 'Cripples enemy actuator servos, reducing movement speed.' },
    { name: 'Block', dmg: 9, cd: 0, heat: 2, isBlock: true, desc: 'Hold to parry with companion wakizashi (0.34s Perfect Block window).' },
    { name: 'Silent Throat-Sever', dmg: 31, cd: 7.0, heat: 18, desc: 'Instant gap-closing companion execution strike.' },
  ],
});

/**
 * Canonical database definition for `sv22StilettoSpathaWeapon` (`SV-22 Stiletto Spatha`, id `'sv22_stiletto_spatha'`, `8 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Rapier & Dagger` (`rapier_dagger_specialist`, Tier II).
 */
export const sv22StilettoSpathaWeapon = buildMagitechWeapon({
  id: 'sv22_stiletto_spatha',
  code: 'SV-22',
  name: 'SV-22 Stiletto Spatha',
  category: 'Blades: Straight',
  weaponClass: 'Spatha',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 8,
  gripMode: '1H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Needle-tapered linear thrusting blade (+5 THR pierce)',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Needle-tapered linear thrusting blade (+5 THR pierce).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'rapier_dagger_specialist',
    effectSummary: 'Destreza & Main-Gauche: Backstab/flank thrusts vent -3 Reactor Heat.',
  },
  flavorText: 'Needle-tapered dueling spatha engineered for La Verdadera Destreza geometry and armor-gap thrusts.',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#c084fc',
  identity: 'Modular-Frame Relic · Rapier & Dagger Primary (8 WT · 2 Open Mounts + 1G)',
  lore: 'Hollow-ground needle-tapered thrusting spatha whose sealed diamond cross-section blade punches +5 Armor THR pierce on linear lunges.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 0.85,
  reloadDurationSec: 0.42,
  range: 32,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Destreza Needle Lunge', desc: '4-step linear thrusting chain dealing 13 Pierce damage (+5 Armor THR pierce).' },
    { name: 'Estocada Seam Puncture', dmg: 25, cd: 4.0, heat: 10, desc: 'Pinpoint vitals thrust that vents heat when striking flanked targets.' },
    { name: 'Circle of Iron Feint', dmg: 19, cd: 4.5, heat: 9, desc: 'Angled stepping thrust that slips around frontal shields.' },
    { name: 'Block', dmg: 10, cd: 0, heat: 2, isBlock: true, desc: 'Hold to deflect with swept-hilt guard rings (0.34s Perfect Block window).' },
    { name: 'Vitals Skewer', dmg: 32, cd: 7.5, heat: 20, desc: 'Deep commitment thrust calibrated for critical weak-point kills.' },
  ],
});

/**
 * Canonical database definition for `s5WhisperCinquedeaWeapon` (`S-5 Whisper Cinquedea`, id `'s5_whisper_cinquedea'`, `5 WT`, `0` Open Slots: `SEALED_MONOLITH` + `1G`).
 * Paired Specialist Stance: `Rapier & Dagger` (`rapier_dagger_specialist`, Tier II).
 */
export const s5WhisperCinquedeaWeapon = buildMagitechWeapon({
  id: 's5_whisper_cinquedea',
  code: 'S-5',
  name: 'S-5 Whisper Cinquedea',
  category: 'Blades: Straight',
  weaponClass: 'Cinquedea',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 5,
  gripMode: '1H',
  architectureTier: 'SEALED_MONOLITH',
  openDomains: [],
  sealedDomains: {
    CONTACT: 'Hermetically sealed five-finger monomolecular parrying blade',
    DELIVERY: 'Hermetically sealed arched quillions & acoustic grip',
    REGULATION: 'Hermetically sealed deflection harmonic dampener',
  },
  action1Signature: 'Widens off-hand deflection timing.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'rapier_dagger_specialist',
    effectSummary: 'Destreza & Main-Gauche: Widens off-hand deflection timing and vents -3 Heat on flank ripostes.',
  },
  flavorText: 'Broad five-finger monomolecular parrying dagger (1G only) forged from a single crystal-steel monolith.',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#f0abfc',
  identity: 'Hermetically Sealed Monolith · Rapier & Dagger Companion (5 WT · 0 Open Mounts + 1G)',
  lore: 'Broad five-finger monomolecular main-gauche parrying cinquedea whose sealed fullers catch and turn heavy enemy blades.',
  shotsPerChain: 5,
  damagePerShot: 10,
  chainDurationSec: 0.75,
  reloadDurationSec: 0.35,
  range: 22,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Main-Gauche Deflect Jab', desc: '5-hit parrying dagger chain dealing 10 Pierce damage and widening deflection timing.' },
    { name: 'Quillion Blade Catch', dmg: 22, cd: 3.8, heat: 8, desc: 'Locks the attacker’s weapon in the arched guard and punctures the joint.' },
    { name: 'Flank Riposte', dmg: 19, cd: 4.2, heat: -3, desc: 'Quick off-hand thrust that vents -3 Reactor Heat.' },
    { name: 'Block', dmg: 10, cd: 0, heat: 2, isBlock: true, desc: 'Hold to raise the five-finger cinquedea parry guard (0.34s Perfect Block window).' },
    { name: 'Misericorde Coup de Grâce', dmg: 30, cd: 7.0, heat: 16, desc: 'Lethal armor-visor puncture against staggered targets.' },
  ],
});

/**
 * Canonical database definition for `m300CantabrianRecurveWeapon` (`M-300 Cantabrian Recurve`, id `'m300_cantabrian_recurve'`, `8 WT`, `2` Open Slots: `DELIVERY`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Mounted Archer` (`mounted_archer_specialist`, Tier II).
 */
export const m300CantabrianRecurveWeapon = buildMagitechWeapon({
  id: 'm300_cantabrian_recurve',
  code: 'M-300',
  name: 'M-300 Cantabrian Recurve',
  category: 'Bows',
  weaponClass: 'Recurve Bow',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 8,
  gripMode: '2H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['DELIVERY', 'REGULATION'],
  sealedDomains: {
    CONTACT: 'Outward-curved mobile reflex limbs (-18% draw time while gliding)',
    DELIVERY: null,
    REGULATION: null,
  },
  action1Signature: 'Outward-curved mobile reflex limbs (-18% draw time while gliding).',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'mounted_archer_specialist',
    effectSummary: 'Parthian Cantabrian: Moving shots suffer zero accuracy penalty.',
  },
  flavorText: 'Composite magitech horse-bow engineered for high-speed Cantabrian circle and Parthian glide volleys.',
  skillCount: 3,
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#fbbf24',
  identity: 'Modular-Frame Relic · Mounted Archer Stance (8 WT · 2 Open Mounts + 1G)',
  lore: 'Short-limb composite recurve bow whose sealed reflex tips reduce draw time by 18% while the pilot is gliding or strafing.',
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDurationSec: 1.35,
  reloadDurationSec: 2.1,
  range: 108,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Cantabrian Glide Shot', desc: '6-arrow mobile reflex chain dealing 9 Pierce damage (-18% draw time while gliding).' },
    { name: 'Parthian Retreat Volley', dmg: 21, cd: 4.2, heat: 12, desc: 'Fires a precision double-shaft backward while dashing away.' },
    { name: 'Thumb-Draw Snap Fan', dmg: 22, cd: 5.0, heat: 14, desc: 'Rapid three-arrow spread fired at peak lateral velocity.' },
    { name: 'Evasive Skirmish Arc', dmg: 16, cd: 4.8, heat: 12, desc: 'Mobile suppressive shot that tags pursuing rushers.' },
    { name: 'Steppe Cyclone Barrage', dmg: 32, cd: 8.5, heat: 24, desc: 'Unleashes a continuous high-speed arrow stream while circling the target.' },
  ],
});

/**
 * Canonical database definition for `vx15GhostYebiraWeapon` (`VX-15 Ghost Yebira`, id `'vx15_ghost_yebira'`, `6 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Specialist Stance: `Mounted Archer` (`mounted_archer_specialist`, Tier II).
 */
export const vx15GhostYebiraWeapon = buildMagitechWeapon({
  id: 'vx15_ghost_yebira',
  code: 'VX-15',
  name: 'VX-15 Ghost Yebira',
  category: 'Carriers & Munitions',
  weaponClass: 'Yebira',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  explicitEquipWeight: 6,
  gripMode: 'DORSAL_CARRIER',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Open-face low-emission magnetic draw rack',
    REGULATION: null,
  },
  action1Signature: 'Arrow trails leave minimal visual signature.',
  puristResonance: {
    triggerType: 'SPECIALIST_STANCE',
    targetId: 'mounted_archer_specialist',
    effectSummary: 'Parthian Cantabrian: Low-emission magnetic draw rack masks arrow trail signatures during mobile fire.',
  },
  flavorText: 'Open-face low-emission magnetic yebira arrow rack built for stealthy mobile archery.',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  bladeTrailColor: '#a855f7',
  identity: 'Modular-Frame Relic · Mounted Archer Yebira (6 WT · 2 Open Mounts + 1G)',
  lore: 'VX Phantom open-face magnetic yebira arrow carrier that dampens projectile wake signatures and feeds mobile recurve volleys.',
  shotsPerChain: 12,
  damagePerShot: 5,
  chainDurationSec: 1.25,
  reloadDurationSec: 1.9,
  range: 85,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Low-Signature Arrow Feed', desc: '12-dart magnetic yebira burst leaving minimal visual signature (5 Pierce damage).' },
    { name: 'Whisper-Fletch Volley', dmg: 18, cd: 4.0, heat: -6, desc: 'Fires acoustic-baffled shafts while venting -6 Reactor Heat.' },
    { name: 'Magnetic Thumb-Rack', dmg: 15, cd: 4.5, heat: 8, desc: 'Presents three pre-aligned shafts for instant mobile nocking.' },
    { name: 'Chaff-Tipped Skirmish Dart', dmg: 16, cd: 5.0, heat: 10, desc: 'Scatters sensor-blinding chaff along the flight path.' },
    { name: 'Phantom Steppe Rain', dmg: 28, cd: 7.5, heat: 18, desc: 'Silent saturation fan from the open-face yebira rack.' },
  ],
});

/**
 * Canonical database definition for `sr440ShadowfangWeapon` (`SR-440 Shadowfang`, id `'sr440_shadowfang'`, `11 WT`, `2` Open Slots: `CONTACT`, `REGULATION` + `1G`).
 * Paired Core Feat Chain: `C-03` Stealth Sniper (`Phantom Sniper`).
 */
export const sr440ShadowfangWeapon = buildMagitechWeapon({
  id: 'sr440_shadowfang',
  code: 'SR-440',
  name: 'SR-440 Shadowfang',
  category: 'Casters',
  weaponClass: 'Bolt Caster',
  primaryDamageType: 'Pierce',
  weightClass: 'medium',
  explicitEquipWeight: 11,
  gripMode: '2H',
  architectureTier: 'MODULAR_FRAME_RELIC',
  openDomains: ['CONTACT', 'REGULATION'],
  sealedDomains: {
    CONTACT: null,
    DELIVERY: 'Suppressed electromagnetic accelerator rail',
    REGULATION: null,
  },
  action1Signature: 'High-velocity marksman bolt (+6 THR pierce).',
  puristResonance: {
    triggerType: 'CORE_FEAT_CHAIN',
    targetId: 'C-03',
    effectSummary: 'C-03 Stealth Sniper (Phantom Sniper): Breaking stealth with a stationary shot (μ = 0) adds +20% weak-point damage.',
  },
  flavorText: 'Core-Chain C-03 Apex marksman bolt caster built around a sealed suppressed electromagnetic rail.',
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#e879f9',
  identity: 'Modular-Frame Relic · Core Chain C-03 Apex (11 WT · 2 Open Mounts + 1G)',
  lore: 'Long-barrel suppressed coil marksman bolt caster with critical-point optics that amplify weak-point damage from stationary stealth ambushes.',
  shotsPerChain: 5,
  damagePerShot: 12,
  chainDurationSec: 1.5,
  reloadDurationSec: 2.9,
  range: 140,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Shadowfang Marksman Bolt', desc: '5-shot high-velocity marksman chain dealing 12 Pierce damage (+6 THR pierce).' },
    { name: 'Critical Seam Piercer', dmg: 30, cd: 5.0, heat: 16, desc: 'Pinpoint sabot round that bypasses armor threshold on locked targets.' },
    { name: 'Ricochet Killshot', dmg: 24, cd: 5.5, heat: 15, desc: 'High-velocity dart that skips between adjacent enemies.' },
    { name: 'Optic Mark Lock', dmg: 16, cd: 5.0, heat: 12, desc: 'Paints the target’s weak points, boosting follow-up precision damage.' },
    { name: 'Deadeye Rail Slug', dmg: 40, cd: 9.0, heat: 28, desc: 'Overcharged hyper-velocity marksman shot with maximum critical multiplier.' },
  ],
});

// ─── BACKWARD-COMPATIBLE ALIAS EXPORTS & BASE CUSTOMIZABLE WEAPONS ──────────

/**
 * Backward-compatible alias for `s2TurbineKhopeshWeapon`.
 */
export const khopeshWeapon: WeaponDefinition = {
  ...s2TurbineKhopeshWeapon,
  id: 'khopesh',
  name: 'Turbine Khopesh (S-2)',
};

/**
 * Backward-compatible alias for `m300CantabrianRecurveWeapon` (legacy `m300_hasta`).
 */
export const m300HastaWeapon: WeaponDefinition = {
  ...m300CantabrianRecurveWeapon,
  id: 'm300_hasta',
};

/**
 * Backward-compatible alias for `sv22StilettoSpathaWeapon` (legacy `sv18_serpent`).
 */
export const sv18SerpentWeapon: WeaponDefinition = {
  ...sv22StilettoSpathaWeapon,
  id: 'sv18_serpent',
};

/**
 * Backward-compatible alias for `s4WhisperWakizashiWeapon` (legacy `s4_whisper_blade`).
 */
export const s4WhisperBladeWeapon: WeaponDefinition = {
  ...s4WhisperWakizashiWeapon,
  id: 's4_whisper_blade',
};

/**
 * Backward-compatible alias for `s6PhantomMesserWeapon` (legacy `s6_phantom_edge`).
 */
export const s6PhantomEdgeWeapon: WeaponDefinition = {
  ...s6PhantomMesserWeapon,
  id: 's6_phantom_edge',
};

/**
 * Backward-compatible alias for `vx15GhostYebiraWeapon` (legacy `utility_phantom_shroud`).
 */
export const utilityPhantomShroudAuxiliary: WeaponDefinition = {
  ...vx15GhostYebiraWeapon,
  id: 'utility_phantom_shroud',
};

/**
 * Backward-compatible alias for `vx10EclipseDiscWeapon` (legacy `aux3_vx_eclipse_cloak`).
 */
export const aux3VxEclipseCloakAuxiliary: WeaponDefinition = {
  ...vx10EclipseDiscWeapon,
  id: 'aux3_vx_eclipse_cloak',
};

/**
 * Backward-compatible alias for `vx10EclipseDiscWeapon` (legacy `aux4_vx_phase_shift`).
 */
export const aux4VxPhaseShiftAuxiliary: WeaponDefinition = {
  ...vx10EclipseDiscWeapon,
  id: 'aux4_vx_phase_shift',
};

/**
 * Canonical database definition for `greatBowWeapon` (`Arclight Great Bow`, id `'great_bow'`, load `'heavy'`) — High-draw torsion great bow firing heavy armor-piercing sabot arrows across long sightlines.
 */
export const greatBowWeapon: WeaponDefinition = {
  id: 'great_bow',
  name: 'Arclight Great Bow',
  category: 'Bows',
  weaponTier: 'customizable',
  class: 'Heavy Great Bow (Weapon 3 / Weapon 4)',
  weaponClass: 'Great Bow',
  loadoutSlots: ['Weapon 3', 'Weapon 4'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'heavy',
  bladeTrailColor: '#f8fafc',
  description: 'High-draw torsion great bow firing heavy armor-piercing sabot arrows across long sightlines.',
  lore:
    'Crafted in the New Novarin and Belldor frontier traditions. Pairs naturally with a Fletcher Quiver in the offhand for extended salvos.',
  shotsPerChain: 5,
  damagePerShot: 11,
  chainDurationSec: 1.5,
  reloadDurationSec: 2.4,
  primaryDamageType: 'Pierce',
  variantStripBase64: GREAT_BOW_STRIP_BASE64,
  hardpointSprite: {
    base64: GREAT_BOW_STRIP_BASE64,
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
    base64: GREAT_BOW_STRIP_BASE64,
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
      name: 'Heavy Draw Arrow',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 11,
      tellDurationSec: 0.12,
      actionDurationSec: 0.35,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 2.4,
      heatCost: 2,
      range: 120,
      description: 'Five heavy high-tension kinetic arrow shots at long range.',
    },
    {
      slot: 1,
      name: 'Piercing Armor-Spike',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 24,
      tellDurationSec: 0.25,
      actionDurationSec: 0.4,
      cooldownSec: 4.8,
      heatCost: 12,
      range: 135,
      description: 'Full-draw sabot shaft that penetrates deep into enemy armor plating.',
    },
    {
      slot: 2,
      name: 'Rain of Arrows',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.3,
      actionDurationSec: 0.5,
      cooldownSec: 5.5,
      heatCost: 16,
      range: 100,
      description: 'High-arc arrow volley that blankets a wide target cluster.',
    },
    {
      slot: 3,
      name: 'Tactical Backstep Shot',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 14,
      tellDurationSec: 0.1,
      actionDurationSec: 0.35,
      cooldownSec: 6.0,
      heatCost: 14,
      range: 70,
      description: 'Quick rearward evasion hop while releasing a defensive arrow.',
    },
    {
      slot: 4,
      name: 'Dragon-Piercer Rail Shaft',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 36,
      tellDurationSec: 0.45,
      actionDurationSec: 0.7,
      cooldownSec: 9.0,
      heatCost: 28,
      range: 150,
      description: 'Maximum-tension siege arrow that staggers all enemies along its flight path.',
    },
  ],
};

/**
 * Canonical database definition for `quiverWeapon` (`Fletcher Munitions Quiver`, id `'quiver'`, load `'light'`) — Belt-fed fletcher quiver that grants +3 Magazine Capacity & -25% Reload Time when paired with ranged weapons, or fires rapid flechettes.
 */
export const quiverWeapon: WeaponDefinition = {
  id: 'quiver',
  name: 'Fletcher Munitions Quiver',
  category: 'Carriers & Munitions',
  weaponTier: 'customizable',
  class: 'Ranged Quiver (Offhand / Set)',
  weaponClass: 'Quiver',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'quiver',
  handing: 'buff-accessory',
  weightClass: 'light',
  bladeTrailColor: '#f8fafc',
  description: 'Belt-fed fletcher quiver that grants +3 Magazine Capacity & -25% Reload Time when paired with ranged weapons, or fires rapid flechettes.',
  lore:
    'Houses Gem-tipped bolts and heavy arrows in an automated spring-rack. Essential companion for Great Bow and Bolt Caster specialists.',
  shotsPerChain: 12,
  damagePerShot: 5,
  chainDurationSec: 1.4,
  reloadDurationSec: 2.0,
  primaryDamageType: 'Pierce',
  variantStripBase64: QUIVER_STRIP_BASE64,
  hardpointSprite: {
    base64: QUIVER_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 13,
    renderHeight: 13,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: QUIVER_STRIP_BASE64,
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
      name: 'Quick-Draw Flechette',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 5,
      tellDurationSec: 0.06,
      actionDurationSec: 1.2,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 2.0,
      heatCost: 1,
      range: 65,
      description: 'Rapid 12-round flechette burst from the automated quiver spring-rack.',
    },
    {
      slot: 1,
      name: 'Broadhead Volley',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 16,
      tellDurationSec: 0.15,
      actionDurationSec: 0.35,
      cooldownSec: 3.5,
      heatCost: 8,
      range: 75,
      description: 'Triple broadhead fan that damages and slows advancing rushers.',
    },
    {
      slot: 2,
      name: 'Automated Mag-Reload',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 0,
      tellDurationSec: 0.08,
      actionDurationSec: 0.25,
      cooldownSec: 5.0,
      heatCost: 6,
      range: 20,
      description: 'Instantly refills 50% of the active weapon magazine.',
    },
    {
      slot: 3,
      name: 'Barbed Arrow Trap',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.2,
      actionDurationSec: 0.35,
      cooldownSec: 6.0,
      heatCost: 12,
      range: 50,
      description: 'Plants a spring-loaded arrow trap that triggers when stepped upon.',
    },
    {
      slot: 4,
      name: 'Flechette Hailstorm',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 28,
      tellDurationSec: 0.3,
      actionDurationSec: 0.6,
      cooldownSec: 7.5,
      heatCost: 20,
      range: 80,
      description: 'Empties the quiver magazine in a saturation fan.',
    },
  ],
};
