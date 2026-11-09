/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import {
  AETHER_CATALYST_STRIP,
  BOLT_CASTER_STRIP,
  QUIVER_STRIP,
} from './base_sprites';
import { buildCustomizableWeapon } from './builder';

// ============================================================================
// CATEGORY 3: CASTERS (01–09)
// ============================================================================

/**
 * 01. Bolt Caster — A direct-channel focal barrel designed to condense raw ether into high-velocity, single-shot kinetic penetrators.
 */
export const caster01BoltWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'caster_01_bolt',
  name: 'Bolt Caster',
  category: 'Casters',
  archetypeNumber: '01',
  description:
    'A direct-channel focal barrel designed to condense raw ether into high-velocity, single-shot kinetic penetrators.',
  equipmentRole: 'ranged',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 92,
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDuration: 1.35,
  reloadDuration: 2.4,
  spriteStripBase64: BOLT_CASTER_STRIP,
  actions: [
    { slot: 1, name: 'Condensed Bolt Stream', description: 'Rapid-fire ether-condensed kinetic bolts from a one-handed barrel.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Flechette Burst', description: 'Three-round hyper-velocity bolt burst aimed at armor seams.', damageMultiplier: 1.35, rangeMultiplier: 1.05, cooldown: 3.8, energyCost: 12 },
    { slot: 3, name: 'Over-Pressured Spike', description: 'Compress the focal chamber to fire a heavy armor-piercing slug.', damageMultiplier: 1.75, rangeMultiplier: 1.2, cooldown: 6.8, energyCost: 18 },
    { slot: 4, name: 'Chamber Vent Step', description: 'Bleed barrel pressure to jet laterally while clearing heat.', damageMultiplier: 0.8, rangeMultiplier: 0.8, cooldown: 4.5, energyCost: 10 },
    { slot: 5, name: 'Rotary Bolt Barrage', description: 'Unleash a continuous 9-bolt cyclic volley along the sightline.', damageMultiplier: 2.15, rangeMultiplier: 1.2, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 02. Beam Caster — A continuous collimated emitter that sustains a coherent lance of focused thermal energy to scour armor seams.
 */
export const caster02BeamWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'caster_02_beam',
  name: 'Beam Caster',
  category: 'Casters',
  archetypeNumber: '02',
  description:
    'A continuous collimated emitter that sustains a coherent lance of focused thermal energy to scour armor seams.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Beam',
  range: 118,
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDuration: 1.45,
  reloadDuration: 2.7,
  spriteStripBase64: BOLT_CASTER_STRIP,
  actions: [
    { slot: 1, name: 'Collimated Ray', description: 'Sustain a coherent thermal beam that scours target plating.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Focal Lens Sweep', description: 'Rake the focused beam horizontally across an advancing squad.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 4.5, energyCost: 14 },
    { slot: 3, name: 'Thermal Bore Lance', description: 'Lock the aperture onto a single point to melt through heavy shields.', damageMultiplier: 1.8, rangeMultiplier: 1.25, cooldown: 7.5, energyCost: 20 },
    { slot: 4, name: 'Refractive Glare', description: 'Flash the primary lens to blind optics and step out of line-of-fire.', damageMultiplier: 0.75, rangeMultiplier: 0.7, cooldown: 5.0, energyCost: 11 },
    { slot: 5, name: 'Prismatic Overburn', description: 'Overcharge all alignment lenses into a blinding continuous cutting ray.', damageMultiplier: 2.25, rangeMultiplier: 1.35, cooldown: 12.0, energyCost: 26 },
  ],
});

/**
 * 03. Arc Caster — A conductively tuned emitter fork that discharges cascading chain lightning to leap across clustered targets.
 */
export const caster03ArcWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'caster_03_arc',
  name: 'Arc Caster',
  category: 'Casters',
  archetypeNumber: '03',
  description:
    'A conductively tuned emitter fork that discharges cascading chain lightning to leap across clustered targets.',
  equipmentRole: 'ranged',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pulse',
  range: 84,
  shotsPerChain: 8,
  damagePerShot: 7,
  chainDuration: 1.25,
  reloadDuration: 2.3,
  spriteStripBase64: BOLT_CASTER_STRIP,
  actions: [
    { slot: 1, name: 'Forked Arc Discharge', description: 'Snap high-voltage lightning between the twin emitter tines.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Chain-Jump Surge', description: 'Launch an ionized arc that leaps across clustered enemy frames.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 4.0, energyCost: 13 },
    { slot: 3, name: 'Actuator Lock Jolt', description: 'High-amperage shock that disrupts target weapon stability.', damageMultiplier: 1.75, rangeMultiplier: 1.15, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Static Ground-Step', description: 'Discharge residual static to boost thruster evasion.', damageMultiplier: 0.85, rangeMultiplier: 0.75, cooldown: 4.5, energyCost: 10 },
    { slot: 5, name: 'Tempest Cage', description: 'Saturate the forward cone with cascading high-voltage lightning.', damageMultiplier: 2.2, rangeMultiplier: 1.25, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 04. Pulse Caster — A cyclic resonance chamber firing rhythmic concussive soundwaves to rupture internal components and stagger advances.
 */
export const caster04PulseWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'caster_04_pulse',
  name: 'Pulse Caster',
  category: 'Casters',
  archetypeNumber: '04',
  description:
    'A cyclic resonance chamber firing rhythmic concussive soundwaves to rupture internal components and stagger advances.',
  equipmentRole: 'ranged',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pulse',
  range: 88,
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDuration: 1.3,
  reloadDuration: 2.5,
  spriteStripBase64: BOLT_CASTER_STRIP,
  actions: [
    { slot: 1, name: 'Staccato Pulse', description: 'Rhythmic three-round resonance bursts that shake target poise.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Harmonic Double-Tap', description: 'Two phase-locked pulses that overload energy shield harmonics.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Concussive Thumper', description: 'Low-frequency pulse ring that knocks rushing enemies backward.', damageMultiplier: 1.8, rangeMultiplier: 1.15, cooldown: 7.2, energyCost: 19 },
    { slot: 4, name: 'Resonance Recoil-Hop', description: 'Fire a downward pulse wave to vault clear of CQC traps.', damageMultiplier: 0.9, rangeMultiplier: 0.8, cooldown: 4.8, energyCost: 11 },
    { slot: 5, name: 'Cyclic Over-Harmonic', description: 'Lock the resonance chamber into maximum staccato output.', damageMultiplier: 2.25, rangeMultiplier: 1.25, cooldown: 11.8, energyCost: 26 },
  ],
});

/**
 * 05. Wave Caster — A wide-aperture diffuser that unleashes rolling horizontal crests of force to clear infantry lanes and sweeps.
 */
export const caster05WaveWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'caster_05_wave',
  name: 'Wave Caster',
  category: 'Casters',
  archetypeNumber: '05',
  description:
    'A wide-aperture diffuser that unleashes rolling horizontal crests of force to clear infantry lanes and sweeps.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Wave',
  range: 95,
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDuration: 1.4,
  reloadDuration: 2.6,
  spriteStripBase64: BOLT_CASTER_STRIP,
  actions: [
    { slot: 1, name: 'Horizon Crest', description: 'Project a wide horizontal energy wave that sweeps across the lane.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Cross-Rip Ripple', description: 'Launch two intersecting wave crests that shear through cover.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.5, energyCost: 14 },
    { slot: 3, name: 'Undertow Surge', description: 'Heavy low-frequency crest that drags and destabilizes frontline foes.', damageMultiplier: 1.8, rangeMultiplier: 1.2, cooldown: 7.5, energyCost: 20 },
    { slot: 4, name: 'Backwash Glide', description: 'Ride the reverse pressure wave backward to re-establish spacing.', damageMultiplier: 0.85, rangeMultiplier: 0.8, cooldown: 5.0, energyCost: 12 },
    { slot: 5, name: 'Tidal Bore', description: 'Full-aperture harmonic tsunami that scours the entire forward corridor.', damageMultiplier: 2.3, rangeMultiplier: 1.3, cooldown: 12.2, energyCost: 27 },
  ],
});

/**
 * 06. Blast Caster — A high-pressure compression nozzle delivering volatile shockwave detonations at close-to-medium range.
 */
export const caster06BlastWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'caster_06_blast',
  name: 'Blast Caster',
  category: 'Casters',
  archetypeNumber: '06',
  description:
    'A high-pressure compression nozzle delivering volatile shockwave detonations at close-to-medium range.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Blast',
  range: 82,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 1.35,
  reloadDuration: 2.8,
  spriteStripBase64: BOLT_CASTER_STRIP,
  actions: [
    { slot: 1, name: 'Compression Shell', description: 'Vent a volatile plasma-compression charge that detonates on contact.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Breacher Double-Blast', description: 'Two close-range shockwave blasts that crack heavy armor plates.', damageMultiplier: 1.5, rangeMultiplier: 1.0, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Thermobaric Bloom', description: 'Delayed-fuse fuel-air charge that engulfs entrenched defenders.', damageMultiplier: 1.85, rangeMultiplier: 1.15, cooldown: 8.0, energyCost: 21 },
    { slot: 4, name: 'Recoil Blast-Jump', description: 'Vent the compression nozzle at the ground to blast away from danger.', damageMultiplier: 1.0, rangeMultiplier: 0.75, cooldown: 5.0, energyCost: 12 },
    { slot: 5, name: 'Siege Howitzer Vent', description: 'Dump the entire capacitor bank into a single devastating Blast shell.', damageMultiplier: 2.35, rangeMultiplier: 1.25, cooldown: 12.5, energyCost: 28 },
  ],
});

/**
 * 07. Nova Caster — An omnidirectional release matrix that discharges an expanding radial burst of energy from the operator’s core.
 */
export const caster07NovaWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'caster_07_nova',
  name: 'Nova Caster',
  category: 'Casters',
  archetypeNumber: '07',
  description:
    'An omnidirectional release matrix that discharges an expanding radial burst of energy from the operator’s core.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Wave',
  range: 72,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.5,
  reloadDuration: 3.1,
  spriteStripBase64: BOLT_CASTER_STRIP,
  actions: [
    { slot: 1, name: 'Radial Core Pulse', description: 'Vent an expanding sphere of pressurized ether from the core housing.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Ring Expansion', description: 'Project a chest-high shock ring that sweeps surrounding swarmers.', damageMultiplier: 1.5, rangeMultiplier: 1.15, cooldown: 5.2, energyCost: 16 },
    { slot: 3, name: 'Core Implosion-Pull', description: 'Briefly invert pressure to tug nearby targets off-balance before venting.', damageMultiplier: 1.9, rangeMultiplier: 1.1, cooldown: 8.5, energyCost: 22 },
    { slot: 4, name: 'Pressure Shunt', description: 'Convert internal core heat into a temporary kinetic buffer.', damageMultiplier: 0.6, rangeMultiplier: 0.6, cooldown: 5.5, energyCost: 12 },
    { slot: 5, name: 'Cataclysmic Nova', description: 'Release full containment in a blinding omnidirectional blast wave.', damageMultiplier: 2.45, rangeMultiplier: 1.35, cooldown: 13.5, energyCost: 30 },
  ],
});

/**
 * 08. Meteoric Caster — An atmospheric ionization channel that commands violent, weather-born aerial barrages and crushing downdrafts.
 */
export const caster08MeteoricWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'caster_08_meteoric',
  name: 'Meteoric Caster',
  category: 'Casters',
  archetypeNumber: '08',
  description:
    'An atmospheric ionization channel that commands violent, weather-born aerial barrages and crushing downdrafts.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Blast',
  range: 125,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.6,
  reloadDuration: 3.3,
  spriteStripBase64: BOLT_CASTER_STRIP,
  actions: [
    { slot: 1, name: 'Molten Bolide', description: 'Lob a blazing orb of ionized slag that craters the target zone.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Chondrite Cluster', description: 'Launch a fracturing meteoric shell that rains three sub-impacts.', damageMultiplier: 1.55, rangeMultiplier: 1.15, cooldown: 5.5, energyCost: 17 },
    { slot: 3, name: 'Atmospheric Downdraft', description: 'Call down a vertical thermal hammer that crushes entrenched guards.', damageMultiplier: 1.95, rangeMultiplier: 1.25, cooldown: 9.0, energyCost: 23 },
    { slot: 4, name: 'Cinder Shroud', description: 'Vent superheated ash to obscure thermal tracking while retreating.', damageMultiplier: 0.75, rangeMultiplier: 0.7, cooldown: 5.5, energyCost: 12 },
    { slot: 5, name: 'Extinction Fall', description: 'Channel a massive orbital fire-stone that scorches an entire sector.', damageMultiplier: 2.5, rangeMultiplier: 1.4, cooldown: 14.0, energyCost: 30 },
  ],
});

/**
 * 09. Stellar Caster — An astrological focus tuned to deep-space geometry, drawing down the devastating, hyper-dense fusion energy of falling stars.
 */
export const caster09StellarWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'caster_09_stellar',
  name: 'Stellar Caster',
  category: 'Casters',
  archetypeNumber: '09',
  description:
    'An astrological focus tuned to deep-space geometry, drawing down the devastating, hyper-dense fusion energy of falling stars.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Beam',
  range: 140,
  shotsPerChain: 2,
  damagePerShot: 27,
  chainDuration: 1.7,
  reloadDuration: 3.5,
  spriteStripBase64: BOLT_CASTER_STRIP,
  actions: [
    { slot: 1, name: 'Star-Fire Lance', description: 'Discharge a hyper-dense lance of fusion light across extreme distances.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Syzygy Alignment', description: 'Align twin astrolabe rings to pierce multiple targets in a line.', damageMultiplier: 1.55, rangeMultiplier: 1.25, cooldown: 5.8, energyCost: 18 },
    { slot: 3, name: 'Coronal Mass Ejection', description: 'Searing cosmic radiation burst that strips Layer 1 shields instantly.', damageMultiplier: 2.0, rangeMultiplier: 1.3, cooldown: 9.5, energyCost: 24 },
    { slot: 4, name: 'Zenith Phase-Shift', description: 'Bend ambient starlight around the frame to slip out of lock-on.', damageMultiplier: 0.7, rangeMultiplier: 0.75, cooldown: 6.0, energyCost: 14 },
    { slot: 5, name: 'Quasar Convergence', description: 'Focus the full astrological array into a cataclysmic pillar of stellar fire.', damageMultiplier: 2.55, rangeMultiplier: 1.5, cooldown: 14.5, energyCost: 32 },
  ],
});

// ============================================================================
// CATEGORY 8: CARRIERS & MUNITIONS (01–09)
// ============================================================================

/**
 * 01. Bandolier — A chest-slung webbing harness fitted with dedicated loops to carry loose cartridges, shells, or small munitions.
 */
export const carrier01BandolierWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'carrier_01_bandolier',
  name: 'Bandolier',
  category: 'Carriers & Munitions',
  archetypeNumber: '01',
  description:
    'A chest-slung webbing harness fitted with dedicated loops to carry loose cartridges, shells, or small munitions.',
  equipmentRole: 'quiver',
  handing: 'buff-accessory',
  weightClass: 'Light',
  primaryDamageType: 'Impact',
  range: 78,
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDuration: 1.05,
  reloadDuration: 3.0,
  spriteStripBase64: QUIVER_STRIP,
  actions: [
    { slot: 1, name: 'Chest-Loop Quick Toss', description: 'Snatch and hurl balanced cartridges and small munitions from the chest strap.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Shell-Strip Pitch', description: 'Sling a primed concussion cartridge that shatters against armor.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Fan of Shells', description: 'Draw three weighted sub-munitions from consecutive loops in one sweep.', damageMultiplier: 1.75, rangeMultiplier: 1.15, cooldown: 6.8, energyCost: 17 },
    { slot: 4, name: 'Speed-Loader Strip', description: 'Slap a fresh munition strip into the primary weapon while moving.', damageMultiplier: 1.3, rangeMultiplier: 1.0, cooldown: 4.5, energyCost: 11 },
    { slot: 5, name: 'Grenadier’s Sweep', description: 'Pull the pin cord across the entire bandolier and hurl a cluster of shells.', damageMultiplier: 2.2, rangeMultiplier: 1.25, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 02. Quiver — A reinforced leather or hardened chassis container worn on the hip or flank, designed for rapid dispensing while mobile.
 */
export const carrier02QuiverWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'carrier_02_quiver',
  name: 'Quiver',
  category: 'Carriers & Munitions',
  archetypeNumber: '02',
  description:
    'A reinforced leather or hardened chassis container worn on the hip or flank, designed for rapid dispensing while mobile.',
  equipmentRole: 'quiver',
  handing: 'buff-accessory',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 85,
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDuration: 1.05,
  reloadDuration: 3.2,
  spriteStripBase64: QUIVER_STRIP,
  actions: [
    { slot: 1, name: 'Rapid Shaft Feed', description: 'Quick-draw indexed shafts to maintain uninterrupted ranged pressure while mobile.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Bodkin Reserve Pull', description: 'Draw tempered armor-piercing shafts for the next volley.', damageMultiplier: 1.35, rangeMultiplier: 1.1, cooldown: 4.0, energyCost: 10 },
    { slot: 3, name: 'Flechette Fan', description: 'Loose a handful of light hunting darts in a close defensive cone.', damageMultiplier: 1.6, rangeMultiplier: 0.95, cooldown: 6.5, energyCost: 15 },
    { slot: 4, name: 'Speed-Index Reload', description: 'Spring-loaded shaft indexing that accelerates ranged reload recovery.', damageMultiplier: 1.25, rangeMultiplier: 1.1, cooldown: 4.5, energyCost: 12 },
    { slot: 5, name: 'Quiver Dump Salvo', description: 'Empty every ready compartment in a saturating arrow cloud.', damageMultiplier: 2.1, rangeMultiplier: 1.2, cooldown: 10.5, energyCost: 22 },
  ],
});

/**
 * 03. Yebira — An open-face rig of eastern origin designed to secure and display medium munitions individually for rapid draw.
 */
export const carrier03YebiraWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'carrier_03_yebira',
  name: 'Yebira',
  category: 'Carriers & Munitions',
  archetypeNumber: '03',
  description:
    'An open-face rig of eastern origin designed to secure and display medium munitions individually for rapid draw.',
  equipmentRole: 'quiver',
  handing: 'buff-accessory',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 92,
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDuration: 1.1,
  reloadDuration: 3.0,
  spriteStripBase64: QUIVER_STRIP,
  actions: [
    { slot: 1, name: 'Side-Slip Draw', description: 'Pull a medium war-shaft laterally through the retention cord without lifting.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Kabura-Ya Signal Shot', description: 'Loose a whistling bulb-arrow that marks the target for bonus precision.', damageMultiplier: 1.4, rangeMultiplier: 1.2, cooldown: 4.2, energyCost: 12 },
    { slot: 3, name: 'Karimata Forked Cutter', description: 'Draw a crescent-tipped rope-cutter shaft that shears exposed cabling.', damageMultiplier: 1.8, rangeMultiplier: 1.15, cooldown: 7.2, energyCost: 18 },
    { slot: 4, name: 'Glide-Nock Flow', description: 'Synchronize thruster glide with open-frame drawing for zero movement penalty.', damageMultiplier: 1.3, rangeMultiplier: 1.1, cooldown: 4.8, energyCost: 12 },
    { slot: 5, name: 'Fan of the Rising Sun', description: 'Draw and loose the entire fanned display in a sweeping arc.', damageMultiplier: 2.25, rangeMultiplier: 1.3, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 04. Battery — An integrated multi-cell energy cell and munitions cluster rigged for synchronized, sequential salvo discharges.
 */
export const carrier04BatteryWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'carrier_04_battery',
  name: 'Battery',
  category: 'Carriers & Munitions',
  archetypeNumber: '04',
  description:
    'An integrated multi-cell energy cell and munitions cluster rigged for synchronized, sequential salvo discharges.',
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  weightClass: 'Medium',
  primaryDamageType: 'Pulse',
  range: 90,
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDuration: 1.15,
  reloadDuration: 3.0,
  passiveLightBonus: 0.25,
  spriteStripBase64: AETHER_CATALYST_STRIP,
  actions: [
    { slot: 1, name: 'Cell Salvo', description: 'Sequential pulse-cell discharge from the shoulder/off-hand battery.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Synchronized Micro-Swarm', description: 'Fire a guided cluster of micro-munitions that track moving targets.', damageMultiplier: 1.45, rangeMultiplier: 1.15, cooldown: 4.5, energyCost: 14 },
    { slot: 3, name: 'Capacitor Over-Feed', description: 'Route reserve battery cells into the main weapon to amplify output.', damageMultiplier: 1.8, rangeMultiplier: 1.2, cooldown: 7.5, energyCost: 19 },
    { slot: 4, name: 'Harmonic Cell Pulse', description: 'Discharge a defensive EM ring while cycling spent tubes.', damageMultiplier: 1.25, rangeMultiplier: 0.9, cooldown: 5.0, energyCost: 12 },
    { slot: 5, name: 'All-Tube Alpha Strike', description: 'Open every battery hatch for a simultaneous multi-cell bombardment.', damageMultiplier: 2.3, rangeMultiplier: 1.3, cooldown: 12.0, energyCost: 26 },
  ],
});

/**
 * 05. Sheaf — A tightly bound tactical bundle of standardized munitions wrapped for rapid field distribution and logistics.
 */
export const carrier05SheafWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'carrier_05_sheaf',
  name: 'Sheaf',
  category: 'Carriers & Munitions',
  archetypeNumber: '05',
  description:
    'A tightly bound tactical bundle of standardized munitions wrapped for rapid field distribution and logistics.',
  equipmentRole: 'quiver',
  handing: 'buff-accessory',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 88,
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDuration: 1.1,
  reloadDuration: 3.4,
  spriteStripBase64: QUIVER_STRIP,
  actions: [
    { slot: 1, name: 'Pitch-Shaft Draw', description: 'Snatch standardized war-munitions directly from the bound tactical sheaf.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Planted Resupply', description: 'Spike the sheaf upright to boost sustained fire cadence.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 4.2, energyCost: 12 },
    { slot: 3, name: 'Incendiary Pitch Volley', description: 'Ignite resin-wrapped munition tips for a searing arc volley.', damageMultiplier: 1.75, rangeMultiplier: 1.2, cooldown: 7.2, energyCost: 18 },
    { slot: 4, name: 'Cord-Cut Quickdraw', description: 'Slash the binding cord to fan-fire four war-shafts at once.', damageMultiplier: 1.35, rangeMultiplier: 1.05, cooldown: 5.0, energyCost: 13 },
    { slot: 5, name: 'Logistics Barrage', description: 'Unleash the entire bound bundle in a relentless sky-darkening barrage.', damageMultiplier: 2.2, rangeMultiplier: 1.3, cooldown: 11.5, energyCost: 24 },
  ],
});

/**
 * 06. Rack — An open-frame mechanical rail assembly mounted to hardpoints, holding heavy ordnance ready for automated feed cycles.
 */
export const carrier06RackWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'carrier_06_rack',
  name: 'Rack',
  category: 'Carriers & Munitions',
  archetypeNumber: '06',
  description:
    'An open-frame mechanical rail assembly mounted to hardpoints, holding heavy ordnance ready for automated feed cycles.',
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  weightClass: 'Heavy',
  primaryDamageType: 'Blast',
  range: 100,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 1.25,
  reloadDuration: 3.4,
  spriteStripBase64: QUIVER_STRIP,
  actions: [
    { slot: 1, name: 'Rail Rocket Release', description: 'Ignite a rail-mounted rocket pod downrange.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Twin Sabot Launch', description: 'Fire two heavy rail-locked ordnance rounds simultaneously.', damageMultiplier: 1.45, rangeMultiplier: 1.15, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Shrapnel Airburst', description: 'Timed rail munition that detonates above shielded infantry.', damageMultiplier: 1.85, rangeMultiplier: 1.2, cooldown: 8.0, energyCost: 20 },
    { slot: 4, name: 'Autoloader Cycle', description: 'Hydraulically index the next ordnance rack while clearing backblast.', damageMultiplier: 1.3, rangeMultiplier: 1.1, cooldown: 5.5, energyCost: 14 },
    { slot: 5, name: 'Full-Frame Ripple Fire', description: 'Launch every rail on the assembly in a rolling artillery barrage.', damageMultiplier: 2.35, rangeMultiplier: 1.35, cooldown: 13.0, energyCost: 28 },
  ],
});

/**
 * 07. Plumbata — Weighted darts tipped with heavy core weights, loosed underhand in high arcs to rain down behind shield walls.
 */
export const carrier07PlumbataWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'carrier_07_plumbata',
  name: 'Plumbata',
  category: 'Carriers & Munitions',
  archetypeNumber: '07',
  description:
    'Weighted darts tipped with heavy core weights, loosed underhand in high arcs to rain down behind shield walls.',
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 82,
  shotsPerChain: 5,
  damagePerShot: 11,
  chainDuration: 1.0,
  reloadDuration: 2.8,
  spriteStripBase64: QUIVER_STRIP,
  actions: [
    { slot: 1, name: 'Underhand Dart Pitch', description: 'Loft a lead-weighted dart in a steep arc that drops onto enemy helms.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Plunging Pair', description: 'Loose two weighted darts that bypass frontal shield blocks from above.', damageMultiplier: 1.45, rangeMultiplier: 1.15, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Lead-Belly Crippler', description: 'Heavy barbed plumbata that embeds in shields and drags down guard speed.', damageMultiplier: 1.8, rangeMultiplier: 1.2, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Shield-Clip Draw', description: 'Snap a fresh dart from the off-hand clip while stepping back.', damageMultiplier: 1.2, rangeMultiplier: 1.0, cooldown: 4.5, energyCost: 11 },
    { slot: 5, name: 'Legionnaire’s Prelude', description: 'Rapid five-dart plunging barrage right before melee engagement.', damageMultiplier: 2.25, rangeMultiplier: 1.3, cooldown: 11.5, energyCost: 24 },
  ],
});

/**
 * 08. Kaad — Consecrated wraps wound along the hands and forearms, trailing weighted cords used to bind incoming strikes and whip mid-range targets.
 */
export const carrier08KaadWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'carrier_08_kaad',
  name: 'Kaad',
  category: 'Carriers & Munitions',
  archetypeNumber: '08',
  description:
    'Consecrated wraps wound along the hands and forearms, trailing weighted cords used to bind incoming strikes and whip mid-range targets.',
  equipmentRole: 'catalyst',
  handing: 'off-hand-only',
  weightClass: 'Light',
  primaryDamageType: 'Wave',
  range: 54,
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDuration: 0.95,
  reloadDuration: 2.2,
  canBlock: true,
  passiveArmorBonus: 6,
  passiveShieldBonus: 16,
  passiveLightBonus: 0.25,
  spriteStripBase64: AETHER_CATALYST_STRIP,
  actions: [
    { slot: 1, name: 'Weighted Cord Lash', description: 'Snap the talisman-weighted cords to whip mid-range targets.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Silk-Bind Entangle', description: 'Wrap an attacker’s weapon haft in consecrated cord and yank them off-line.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Mantra Palm Wave', description: 'Channel harmonic Wave energy through the forearm wraps.', damageMultiplier: 1.8, rangeMultiplier: 1.2, cooldown: 6.8, energyCost: 18 },
    { slot: 4, name: 'Consecrated Forearm Bind', description: 'Cross the wrapped forearms to bind incoming strikes and absorb kinetic shock.', damageMultiplier: 0.6, rangeMultiplier: 0.5, cooldown: 0.6, energyCost: 5 },
    { slot: 5, name: 'Sutra of Unbinding', description: 'Unspool all weighted cords in a whirling harmonic tempest around the pilot.', damageMultiplier: 2.25, rangeMultiplier: 1.35, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 09. Pangao — A protected, shock-dampened shoulder satchel engineered to transport volatile bombs, powder flasks, and other explosives.
 */
export const carrier09PangaoWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'carrier_09_pangao',
  name: 'Pangao',
  category: 'Carriers & Munitions',
  archetypeNumber: '09',
  description:
    'A protected, shock-dampened shoulder satchel engineered to transport volatile bombs, powder flasks, and other explosives.',
  equipmentRole: 'quiver',
  handing: 'off-hand-only',
  weightClass: 'Medium',
  primaryDamageType: 'Blast',
  range: 76,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.2,
  reloadDuration: 3.1,
  spriteStripBase64: QUIVER_STRIP,
  actions: [
    { slot: 1, name: 'Powder Flask Pitch', description: 'Sling a volatile black-powder flask from the shock-dampened satchel.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Cluster Bomb Toss', description: 'Hurl a fused bundle of ceramic bombs that detonate across the lane.', damageMultiplier: 1.5, rangeMultiplier: 1.1, cooldown: 4.6, energyCost: 15 },
    { slot: 3, name: 'Alchemical Fire-Pot', description: 'Lob a heavy incendiary canister that cracks Layer 2 armor.', damageMultiplier: 1.85, rangeMultiplier: 1.15, cooldown: 7.8, energyCost: 20 },
    { slot: 4, name: 'Flash-Powder Screen', description: 'Crack a blinding powder charge underfoot to jet clear of melee.', damageMultiplier: 1.1, rangeMultiplier: 0.85, cooldown: 5.0, energyCost: 12 },
    { slot: 5, name: 'Satchel Demolition', description: 'Prime the reserve demolition charge for a massive siege detonation.', damageMultiplier: 2.4, rangeMultiplier: 1.3, cooldown: 12.5, energyCost: 28 },
  ],
});
