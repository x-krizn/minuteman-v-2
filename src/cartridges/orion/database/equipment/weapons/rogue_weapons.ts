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

// ─── ROGUE / RECON LINEAGE MAGITECH WEAPONS ─────────────────────────────────

/**
 * Canonical database definition for `sv12ViperWeapon` (`SV-12 Viper`, id `'sv12_viper'`, load `'light'`) — High fire rate, close-range burst.
 */
export const sv12ViperWeapon = buildMagitechWeapon({
  id: 'sv12_viper',
  name: 'SV-12 Viper',
  weaponClass: 'SMG',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#a855f7',
  identity: 'High fire rate, close-range burst',
  lore: 'Ultra-compact submachine gun spitting high-velocity caseless needles at blistering close-quarters fire rates.',
  shotsPerChain: 14,
  damagePerShot: 4,
  chainDurationSec: 1.1,
  reloadDurationSec: 2.1,
  range: 68,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Viper Needle Burst', desc: '14-round high-RPM close-range burst dealing 4 Pierce damage per shot.' },
    { name: 'Point-Blank Mag Dump', dmg: 24, cd: 4.0, heat: 12, desc: 'Concentrated close-range salvo that shreds exposed frame joints.' },
    { name: 'Evasive Strafe Volley', dmg: 18, cd: 4.5, heat: 10, desc: 'Rapid mobile burst fired on the move without accuracy loss.' },
    { name: 'Flechette Fan', dmg: 15, cd: 4.5, heat: 11, desc: 'Close-quarters cone burst that tags flanking enemies.' },
    { name: 'Venom Overdrive', dmg: 30, cd: 7.5, heat: 22, desc: 'Hyper-velocity magazine unload with bonus critical damage.' },
  ],
});

/**
 * Canonical database definition for `sv18SerpentWeapon` (`SV-18 Serpent`, id `'sv18_serpent'`, load `'light'`) — Suppressed, mid-range stealth operations.
 */
export const sv18SerpentWeapon = buildMagitechWeapon({
  id: 'sv18_serpent',
  name: 'SV-18 Serpent',
  weaponClass: 'Carbine',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#c084fc',
  identity: 'Suppressed, mid-range stealth operations',
  lore: 'Integrally suppressed recon carbine with baffled muzzle dampeners that preserve low Presence during mid-range ambushes.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.3,
  reloadDurationSec: 2.4,
  range: 95,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Suppressed 3x3 Burst', desc: '9-round baffled carbine chain dealing 6 Pierce damage with minimal acoustic signature.' },
    { name: 'Subsonic Vital Shot', dmg: 23, cd: 4.2, heat: 11, desc: 'Silent precision round that strikes weak points without raising Presence.' },
    { name: 'Ghost Flank Salvo', dmg: 20, cd: 5.0, heat: 13, desc: 'Double-tap ambush burst dealing bonus damage to distracted targets.' },
    { name: 'Sensor-Chaff Dart', dmg: 14, cd: 5.0, heat: 12, desc: 'Dampens enemy optic tracking and slows turn rate.' },
    { name: 'Silent Execution', dmg: 33, cd: 8.0, heat: 24, desc: 'High-penetration suppressed finisher calibrated for critical kills.' },
  ],
});

/**
 * Canonical database definition for `sr440ShadowfangWeapon` (`SR-440 Shadowfang`, id `'sr440_shadowfang'`, load `'medium'`) — Critical amplification, long-range precision.
 */
export const sr440ShadowfangWeapon = buildMagitechWeapon({
  id: 'sr440_shadowfang',
  name: 'SR-440 Shadowfang',
  weaponClass: 'Marksman Rifle',
  primaryDamageType: 'Pierce',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#e879f9',
  identity: 'Critical amplification, long-range precision',
  lore: 'Long-barrel coil marksman rifle with critical-point optics that amplify damage against locked or staggered targets.',
  shotsPerChain: 5,
  damagePerShot: 12,
  chainDurationSec: 1.5,
  reloadDurationSec: 2.9,
  range: 140,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Shadowfang Precision Sabot', desc: '5-shot marksman chain dealing 12 Pierce damage at extreme range.' },
    { name: 'Critical Seam Piercer', dmg: 30, cd: 5.0, heat: 16, desc: 'Pinpoint sabot round that bypasses armor threshold on locked targets.' },
    { name: 'Ricochet Killshot', dmg: 24, cd: 5.5, heat: 15, desc: 'High-velocity dart that skips between adjacent enemies.' },
    { name: 'Optic Mark Lock', dmg: 16, cd: 5.0, heat: 12, desc: 'Paints the target’s weak points, boosting follow-up precision damage.' },
    { name: 'Deadeye Rail Slug', dmg: 40, cd: 9.0, heat: 28, desc: 'Overcharged hyper-velocity marksman shot with maximum critical multiplier.' },
  ],
});

/**
 * Canonical database definition for `s4WhisperBladeWeapon` (`S-4 Whisper Blade`, id `'s4_whisper_blade'`, load `'light'`) — Monomolecular edge, dual-wield capable.
 */
export const s4WhisperBladeWeapon = buildMagitechWeapon({
  id: 's4_whisper_blade',
  name: 'S-4 Whisper Blade',
  weaponClass: 'Dagger',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#d8b4fe',
  identity: 'Monomolecular edge, dual-wield capable',
  lore: 'Zero-backlash monomolecular combat dagger engineered for dual-wielding and silent backstab executions.',
  shotsPerChain: 5,
  damagePerShot: 10,
  chainDurationSec: 0.75,
  reloadDurationSec: 0.35,
  range: 22,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Monomolecular Flurry', desc: '5-hit ultra-fast dagger chain dealing 10 Pierce damage per slash.' },
    { name: 'Ambush Backstab', dmg: 26, cd: 3.8, heat: 9, desc: 'High-critical precision thrust into exposed rear or flanked plating.' },
    { name: 'Arterial Tendon Cut', dmg: 18, cd: 4.2, heat: 8, desc: 'Cripples enemy actuator servos, reducing movement speed.' },
    { name: 'Block', dmg: 9, cd: 0, heat: 2, isBlock: true, desc: 'Hold to parry with reverse-grip dagger (0.34s Perfect Block window).' },
    { name: 'Phantom Throat-Slit', dmg: 31, cd: 7.0, heat: 18, desc: 'Instant gap-closing execution strike.' },
  ],
});

/**
 * Canonical database definition for `s6PhantomEdgeWeapon` (`S-6 Phantom Edge`, id `'s6_phantom_edge'`, load `'light'`) — Thermal-coated, heat-dampened strikes.
 */
export const s6PhantomEdgeWeapon = buildMagitechWeapon({
  id: 's6_phantom_edge',
  name: 'S-6 Phantom Edge',
  weaponClass: 'Knife',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#f0abfc',
  identity: 'Thermal-coated, heat-dampened strikes',
  lore: 'Thermal-absorbent stealth knife whose heat-dampened edge vents reactor heat on every close-quarters strike.',
  shotsPerChain: 5,
  damagePerShot: 10,
  chainDurationSec: 0.75,
  reloadDurationSec: 0.35,
  range: 22,
  supportPulseOnHit: { heatVent: 4 },
  isPlaceholderAsset: false,
  skills: [
    { name: 'Heat-Sink Knife Combo', desc: '5-hit stealth knife combo dealing 10 Pierce damage and venting 4 Heat per hit.' },
    { name: 'Zero-Signature Thrust', dmg: 23, cd: 4.0, heat: -8, desc: 'Dampened puncture strike that vents 8 Reactor Heat on impact.' },
    { name: 'Phase-Step Slice', dmg: 20, cd: 4.5, heat: 8, desc: 'Quick sidestep slash that evades incoming counter-attacks.' },
    { name: 'Block', dmg: 9, cd: 0, heat: 2, isBlock: true, desc: 'Hold to deflect with thermal-coated blade (0.34s Perfect Block window).' },
    { name: 'Eclipse Sever', dmg: 29, cd: 7.2, heat: 14, desc: 'Paired off-hand cross-slash that strips enemy shield harmonics.' },
  ],
});

/**
 * Canonical database definition for `greatBowWeapon` (`Arclight Great Bow`, id `'great_bow'`, load `'heavy'`) — High-draw torsion great bow firing heavy armor-piercing sabot arrows across long sightlines..
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
 * Canonical database definition for `quiverWeapon` (`Fletcher Munitions Quiver`, id `'quiver'`, load `'light'`) — Belt-fed fletcher quiver that grants +3 Magazine Capacity & -25% Reload Time when paired with ranged weapons, ....
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

// ─── ROGUE / RECON AUXILIARIES (Migrated from Utility, Aux 3 & Aux 4) ───────

/**
 * Canonical database definition for `utilityPhantomShroudAuxiliary` (`VX Smoke Dispersal System`, id `'utility_phantom_shroud'`, load `'medium'`) — Obscurement canisters and thermal masking (+14 Shield, +0.5 Light).
 */
export const utilityPhantomShroudAuxiliary = buildMagitechWeapon({
  id: 'utility_phantom_shroud',
  name: 'VX Smoke Dispersal System',
  weaponClass: 'Thermal Masking',
  primaryDamageType: 'Pulse',
  weightClass: 'medium',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  passiveShieldBonus: 14,
  passiveLightBonus: 0.5,
  supportPulseOnHit: { heatVent: 10, shieldRestore: 6 },
  bladeTrailColor: '#a855f7',
  identity: 'Obscurement canisters and thermal masking (+14 Shield, +0.5 Light)',
  lore: 'VX Phantom smoke and thermal-baffle auxiliary that purges reactor heat signature while painting hostiles with Optic Telemetry.',
  shotsPerChain: 3,
  damagePerShot: 10,
  chainDurationSec: 0.85,
  reloadDurationSec: 1.4,
  range: 70,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Thermal Canister', desc: 'Auxiliary focus node.' },
    { name: 'Baffle Vent', dmg: 12, cd: 4.0, heat: -10, desc: 'Auxiliary focus node.' },
    { name: 'Telemetry Ping', dmg: 14, cd: 4.5, heat: -8, desc: 'Auxiliary focus node.' },
    { name: 'Smoke Shroud Dispersal', dmg: 17, cd: 6.0, heat: -18, dt: 'Pulse', desc: 'Vents -18 Heat, restores +18 Shield, and marks targets with Optic Telemetry.' },
    { name: 'Phantom Blackout Volley', dmg: 27, cd: 8.0, heat: -25, dt: 'Pulse', desc: 'Purges -25 Heat and launches blinding chaff darts that stun and expose enemies.' },
  ],
});

/**
 * Canonical database definition for `aux3VxEclipseCloakAuxiliary` (`VX Eclipse Cloak Generator`, id `'aux3_vx_eclipse_cloak'`, load `'medium'`) — Active camouflage, heat masking (+14 Shield).
 */
export const aux3VxEclipseCloakAuxiliary = buildMagitechWeapon({
  id: 'aux3_vx_eclipse_cloak',
  name: 'VX Eclipse Cloak Generator',
  weaponClass: 'Stealth Cloak',
  primaryDamageType: 'Pulse',
  weightClass: 'medium',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  passiveShieldBonus: 14,
  supportPulseOnHit: { heatVent: 8, shieldRestore: 5 },
  bladeTrailColor: '#c084fc',
  identity: 'Active camouflage, heat masking (+14 Shield)',
  lore: 'Light-bending VX Eclipse refractive cloak generator that masks thermal output and dampens enemy lock-on priority.',
  shotsPerChain: 3,
  damagePerShot: 11,
  chainDurationSec: 0.85,
  reloadDurationSec: 1.3,
  range: 64,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Eclipse Shimmer', desc: 'Auxiliary focus node.' },
    { name: 'Heat Mask', dmg: 13, cd: 4.0, heat: -8, desc: 'Auxiliary focus node.' },
    { name: 'Null Signature', dmg: 15, cd: 4.5, heat: -8, desc: 'Auxiliary focus node.' },
    { name: 'Eclipse Camouflage Pulse', dmg: 18, cd: 5.5, heat: -12, dt: 'Pulse', desc: 'Engages active light-bending cloak, venting -12 Heat and marking weak points.' },
    { name: 'Shadow Ambush Discharge', dmg: 29, cd: 7.5, heat: 12, dt: 'Pulse', desc: ' Collapses the cloak field into a high-critical electromagnetic ambush strike.' },
  ],
});

/**
 * Canonical database definition for `aux4VxPhaseShiftAuxiliary` (`VX Phase-Shift Module`, id `'aux4_vx_phase_shift'`, load `'medium'`) — Brief intangibility burst & phase step (+16 Shield).
 */
export const aux4VxPhaseShiftAuxiliary = buildMagitechWeapon({
  id: 'aux4_vx_phase_shift',
  name: 'VX Phase-Shift Module',
  weaponClass: 'Phase-Shift Evasion',
  primaryDamageType: 'Wave',
  weightClass: 'medium',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  passiveShieldBonus: 16,
  supportPulseOnHit: { shieldRestore: 6, heatVent: 5 },
  bladeTrailColor: '#e879f9',
  identity: 'Brief intangibility burst & phase step (+16 Shield)',
  lore: 'Experimental VX phase-displacement module that briefly shifts the mech across Aether planes to evade incoming salvos.',
  shotsPerChain: 3,
  damagePerShot: 11,
  chainDurationSec: 0.85,
  reloadDurationSec: 1.4,
  range: 68,
  isPlaceholderAsset: false,
  skills: [
    { name: 'Phase Flicker', desc: 'Auxiliary focus node.' },
    { name: 'Aether Slip', dmg: 14, cd: 4.0, heat: 6, desc: 'Auxiliary focus node.' },
    { name: 'Displacement Echo', dmg: 16, cd: 4.5, heat: 8, desc: 'Auxiliary focus node.' },
    { name: 'Phase-Shift Blink', dmg: 19, cd: 5.5, heat: 8, dt: 'Wave', desc: 'Triggers a phase-shift evasion pulse that restores +14 Shield and slows pursuers.' },
    { name: 'Dimensional Shear Wave', dmg: 30, cd: 8.0, heat: 16, dt: 'Wave', desc: 'Re-materializes the phase field in a razor-sharp Wave shear.' },
  ],
});

