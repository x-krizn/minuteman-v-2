/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import {
  bow_composite,
  bow_compound,
  bow_flat,
  bow_great,
  bow_long,
  bow_recurve,
  bow_reflex,
  bow_self,
  bow_short,
  shield_buckler,
  shield_corona,
  shield_disc,
  shield_heater,
  shield_mote,
  shield_norman,
  shield_rhom,
  shield_scutum,
  shield_tower,
} from './base_sprites';
import { buildCustomizableWeapon } from './builder';

// ============================================================================
// CATEGORY 1: SHIELDS (01–09)
// ============================================================================

/**
 * 01. Buckler — Small round metal boss shield held in the fist for active parrying and hand protection.
 */
export const shield01BucklerWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'shield_01_buckler',
  name: 'Buckler',
  category: 'Shields',
  archetypeNumber: '01',
  description:
    'A compact, fist-held iron boss designed for active parrying, deflection, and close-quarters hand-to-hand binding.',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'Light',
  primaryDamageType: 'Impact',
  range: 22,
  shotsPerChain: 3,
  damagePerShot: 12,
  chainDuration: 0.85,
  reloadDuration: 0.4,
  canBlock: true,
  passiveArmorBonus: 6,
  passiveShieldBonus: 18,
  spriteStripBase64: shield_buckler,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Boss Jab', description: 'Punch forward with the reinforced center boss to interrupt close combos.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Binding Rim Hook', description: 'Trap an incoming weapon along the buckler rim and twist off-line.', damageMultiplier: 1.35, rangeMultiplier: 1.05, cooldown: 3.5, energyCost: 10 },
    { slot: 3, name: 'Snap Counter-Bash', description: 'Explosive short-range knuckle-boss strike that staggers light frames.', damageMultiplier: 1.65, rangeMultiplier: 1.1, cooldown: 6.0, energyCost: 16 },
    { slot: 4, name: 'Active Fist Deflect', description: 'Project the buckler forward at arm’s length to close off attack cones.', damageMultiplier: 0.5, rangeMultiplier: 0.6, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Duelist Riposte Stance', description: 'Prime wrist actuators for an instant zero-lag counter-parry window.', damageMultiplier: 2.0, rangeMultiplier: 1.15, cooldown: 10.0, energyCost: 22 },
  ],
});

/**
 * 02. Heater — Classic flat-topped triangular shield tapering to a point, balancing torso coverage with maneuverability.
 */
export const shield02HeaterWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'shield_02_heater',
  name: 'Heater',
  category: 'Shields',
  archetypeNumber: '02',
  description:
    'A compact, triangular cavalry shield offering high torso coverage without impeding weapon clearance enabling high mobility.',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'Medium',
  primaryDamageType: 'Impact',
  range: 24,
  shotsPerChain: 3,
  damagePerShot: 13,
  chainDuration: 0.95,
  reloadDuration: 0.5,
  canBlock: true,
  passiveArmorBonus: 12,
  passiveShieldBonus: 28,
  spriteStripBase64: shield_heater,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Heater Bash', description: 'Drive the angled steel face forward to push back encroaching melee foes.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Point Wedge Thrust', description: 'Ram the tapered lower point into armor joints at close quarters.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Vanguard Shield Charge', description: 'Sprint behind the angled plate to bowl through a frontline blockade.', damageMultiplier: 1.75, rangeMultiplier: 1.35, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Knightly High Guard', description: 'Lock the flat top edge below the visor line to absorb heavy strikes.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.6, energyCost: 5 },
    { slot: 5, name: 'Counter-Slam', description: 'Release stored block tension in a concussive shoulder-driven check.', damageMultiplier: 2.1, rangeMultiplier: 1.2, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 03. Tower — Massive rectangular siege shield providing near-total body cover at the cost of mobility.
 */
export const shield03TowerWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'shield_03_tower',
  name: 'Tower',
  category: 'Shields',
  archetypeNumber: '03',
  description:
    'A heavy, slightly curved full-length pavis designed to establish a portable defensive wall against ranged volleys.',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'Heavy',
  primaryDamageType: 'Impact',
  range: 22,
  shotsPerChain: 2,
  damagePerShot: 18,
  chainDuration: 1.15,
  reloadDuration: 0.65,
  canBlock: true,
  passiveArmorBonus: 20,
  passiveShieldBonus: 45,
  spriteStripBase64: shield_tower,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Wall Press', description: 'Heave the full-length steel bulkhead forward with hydraulic force.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Spiked Base Drop', description: 'Slam the reinforced bottom edge onto enemy foot actuators.', damageMultiplier: 1.5, rangeMultiplier: 1.05, cooldown: 5.0, energyCost: 14 },
    { slot: 3, name: 'Battering Ram', description: 'Unstoppable two-step bulwark charge that crushes enemy poise.', damageMultiplier: 1.9, rangeMultiplier: 1.25, cooldown: 8.5, energyCost: 22 },
    { slot: 4, name: 'Siege Pavise Brace', description: 'Plant the tower shield into the ground as an immovable bunker wall.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.8, energyCost: 6 },
    { slot: 5, name: 'Fortress Shockwave', description: 'Detonate kinetic dampers along the shield face to knock back all nearby threats.', damageMultiplier: 2.3, rangeMultiplier: 1.35, cooldown: 13.0, energyCost: 28 },
  ],
});

/**
 * 04. Norman — Elongated teardrop-shaped kite shield designed to protect the lower body and legs during close-quarters combat.
 */
export const shield04NormanWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'shield_04_norman',
  name: 'Norman',
  category: 'Shields',
  archetypeNumber: '04',
  description:
    "A teardrop kite shield elongated at the base to protect a rider's flank and leg, tapering upward for upper-body warding.",
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'Medium',
  primaryDamageType: 'Impact',
  range: 25,
  shotsPerChain: 3,
  damagePerShot: 13,
  chainDuration: 1.0,
  reloadDuration: 0.5,
  canBlock: true,
  passiveArmorBonus: 14,
  passiveShieldBonus: 32,
  spriteStripBase64: shield_norman,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Kite Rim Sweep', description: 'Swing the elongated teardrop rim across the engagement lane.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Low Sweep Ward', description: 'Drive the tapered tail down to pin and crush low lunging attackers.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 4.2, energyCost: 12 },
    { slot: 3, name: 'Outrider Lance-Check', description: 'Angled glide-check that deflects incoming projectiles while advancing.', damageMultiplier: 1.75, rangeMultiplier: 1.3, cooldown: 7.2, energyCost: 18 },
    { slot: 4, name: 'Teardrop Full Guard', description: 'Cover torso and leg actuators behind the curved kite profile.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.6, energyCost: 5 },
    { slot: 5, name: 'Cavalry Wedge Impact', description: 'High-momentum shoulder ram that splits enemy formations.', damageMultiplier: 2.15, rangeMultiplier: 1.35, cooldown: 11.5, energyCost: 24 },
  ],
});

/**
 * 05. Scutum — Curved semi-cylindrical rectangular shield engineered to deflect glancing blows and lock into defensive walls.
 */
export const shield05ScutumWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'shield_05_scutum',
  name: 'Scutum',
  category: 'Shields',
  archetypeNumber: '05',
  description:
    'A semi-cylindrical curved rectangular shield engineered for overlapping frontline legion formations and devastating forward shield-punches.',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'Heavy',
  primaryDamageType: 'Impact',
  range: 24,
  shotsPerChain: 3,
  damagePerShot: 15,
  chainDuration: 1.05,
  reloadDuration: 0.55,
  canBlock: true,
  passiveArmorBonus: 18,
  passiveShieldBonus: 38,
  spriteStripBase64: shield_scutum,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Umbo Punch', description: 'Horizontal fist-grip punch using the iron spindle boss.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Legion Rim Lift', description: 'Uppercut with the top bronze-bound rim to expose the target’s throat.', damageMultiplier: 1.45, rangeMultiplier: 1.05, cooldown: 4.5, energyCost: 13 },
    { slot: 3, name: 'Testudo Advance', description: 'Lock the curved cylinder into a relentless forward march.', damageMultiplier: 1.85, rangeMultiplier: 1.25, cooldown: 8.0, energyCost: 20 },
    { slot: 4, name: 'Cylindrical Deflection', description: 'Angle the curved face so heavy kinetic impacts glance harmlessly aside.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Phalanx Breaker', description: 'Crushing two-stage shield slam that knocks an entire line off balance.', damageMultiplier: 2.25, rangeMultiplier: 1.3, cooldown: 12.0, energyCost: 26 },
  ],
});

/**
 * 06. Corona — Radiant halo-like energy emitter that projects a blazing ring of thermal light to incinerate incoming projectiles.
 */
export const shield06CoronaWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'shield_06_corona',
  name: 'Corona',
  category: 'Shields',
  archetypeNumber: '06',
  description:
    'A radiant magitech projection ring generating a localized solar flare field that incinerates incoming projectiles on impact.',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'Medium',
  primaryDamageType: 'Beam',
  range: 28,
  shotsPerChain: 3,
  damagePerShot: 13,
  chainDuration: 0.95,
  reloadDuration: 0.5,
  canBlock: true,
  passiveArmorBonus: 4,
  passiveShieldBonus: 34,
  passiveLightBonus: 0.5,
  spriteStripBase64: shield_corona,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Solar Rim Sear', description: 'Slash with the superheated plasma halo to scorch nearby enemies.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Prominence Flare', description: 'Pulse a blinding thermal corona that melts incoming ordinance.', damageMultiplier: 1.45, rangeMultiplier: 1.2, cooldown: 4.5, energyCost: 14 },
    { slot: 3, name: 'Photosphere Vent', description: 'Eject a searing radial ring of Beam energy around the frame.', damageMultiplier: 1.8, rangeMultiplier: 1.35, cooldown: 7.5, energyCost: 20 },
    { slot: 4, name: 'Radiant Aegis Field', description: 'Project the full thermal ring to vaporize ballistic fire on contact.', damageMultiplier: 0.5, rangeMultiplier: 0.6, cooldown: 0.6, energyCost: 6 },
    { slot: 5, name: 'Supernova Riposte', description: 'Discharge absorbed block heat as a concentrated solar lance.', damageMultiplier: 2.25, rangeMultiplier: 1.5, cooldown: 11.5, energyCost: 26 },
  ],
});

/**
 * 07. Mote — Swarm of free-floating, reactive micro-plates that orbit the user and dynamically drift to intercept strikes.
 */
export const shield07MoteWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'shield_07_mote',
  name: 'Mote',
  category: 'Shields',
  archetypeNumber: '07',
  description:
    'A swarm of orbiting micro-kinetic shields that dynamically drift to intercept incoming ballistics and dispersed spell fire.',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'Light',
  primaryDamageType: 'Pulse',
  range: 36,
  shotsPerChain: 4,
  damagePerShot: 10,
  chainDuration: 0.85,
  reloadDuration: 0.45,
  canBlock: true,
  passiveArmorBonus: 4,
  passiveShieldBonus: 26,
  passiveLightBonus: 0.25,
  spriteStripBase64: shield_mote,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Mote Dart Volley', description: 'Flick orbiting micro-plates outward to pepper close targets.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Intercept Orbit', description: 'Command the swarm to converge on a target and disrupt their aim.', damageMultiplier: 1.35, rangeMultiplier: 1.25, cooldown: 3.8, energyCost: 12 },
    { slot: 3, name: 'Kinetic Cloud Shred', description: 'Spin the micro-plates into a localized buzzsaw vortex.', damageMultiplier: 1.7, rangeMultiplier: 1.2, cooldown: 6.5, energyCost: 18 },
    { slot: 4, name: 'Reactive Swarm Guard', description: 'Condense all orbiting motes along the active threat vector.', damageMultiplier: 0.5, rangeMultiplier: 0.6, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Scatter-Lock Burst', description: 'Detonate the swarm’s magnetic tether to stun surrounding foes before reforming.', damageMultiplier: 2.1, rangeMultiplier: 1.4, cooldown: 10.5, energyCost: 24 },
  ],
});

/**
 * 08. Disc — Sleek forearm-mounted projector that generates a flat, revolving circular barrier of hard-light to disperse momentum.
 */
export const shield08DiscWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'shield_08_disc',
  name: 'Disc',
  category: 'Shields',
  archetypeNumber: '08',
  description:
    'A revolving hard-light barrier that rotates around the forearm to disperse ballistic momentum through centrifugal force.',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'Light',
  primaryDamageType: 'Wave',
  range: 30,
  shotsPerChain: 4,
  damagePerShot: 11,
  chainDuration: 0.9,
  reloadDuration: 0.45,
  canBlock: true,
  passiveArmorBonus: 5,
  passiveShieldBonus: 30,
  passiveLightBonus: 0.25,
  spriteStripBase64: shield_disc,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Gyro-Rim Slice', description: 'Clip targets with the high-RPM hard-light disc edge.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Ricochet Throw', description: 'Sling the revolving hard-light disc out and recall it to the forearm mount.', damageMultiplier: 1.4, rangeMultiplier: 1.45, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Centrifugal Dispersal', description: 'Spin the barrier to over-speed, flinging nearby threats sideways.', damageMultiplier: 1.75, rangeMultiplier: 1.2, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Rotary Phase Guard', description: 'Engage gyroscopic spin to deflect projectiles at shallow angles.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Harmonic Wave Shatter', description: 'Release rotational energy as a sweeping concussive Wave crest.', damageMultiplier: 2.15, rangeMultiplier: 1.4, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 09. Rhom — Angular geometric force-field generator that projects an asymmetrical diamond lattice designed to shatter impacts.
 */
export const shield09RhomWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'shield_09_rhom',
  name: 'Rhom',
  category: 'Shields',
  archetypeNumber: '09',
  description:
    'An asymmetric rhombus-phase energy lattice calibrated to shatter high-caliber kinetic munitions and thermal lances.',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'Heavy',
  primaryDamageType: 'Beam',
  range: 28,
  shotsPerChain: 2,
  damagePerShot: 19,
  chainDuration: 1.1,
  reloadDuration: 0.6,
  canBlock: true,
  passiveArmorBonus: 8,
  passiveShieldBonus: 48,
  passiveLightBonus: 0.5,
  spriteStripBase64: shield_rhom,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Lattice Wedge Strike', description: 'Drive the crystalline diamond apex into the target’s guard.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Refraction Prism Shear', description: 'Split incoming energy along the rhombus facets into twin counter-beams.', damageMultiplier: 1.5, rangeMultiplier: 1.3, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Geometric Lock-Wall', description: 'Expand the diamond lattice into an interlocking hard-light bastion.', damageMultiplier: 1.9, rangeMultiplier: 1.25, cooldown: 8.2, energyCost: 22 },
    { slot: 4, name: 'Asymmetric Phase Brace', description: 'Align the steepest lattice facet to shatter heavy artillery and lances.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Crystalline Lattice Collapse', description: 'Implode and re-project the rhombus barrier, firing fractal shards forward.', damageMultiplier: 2.35, rangeMultiplier: 1.45, cooldown: 12.5, energyCost: 28 },
  ],
});

// ============================================================================
// CATEGORY 2: BOWS (01–09)
// ============================================================================

/**
 * 01. Self Bow — Traditional bow carved from a single stave of seasoned wood; simple, reliable, and steady in the hand.
 */
export const bow01SelfWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'bow_01_self',
  name: 'Self Bow',
  category: 'Bows',
  archetypeNumber: '01',
  description:
    'A primitive bow fashioned from a single continuous stave of conditioned hardwood, dependable in its structural simplicity.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 100,
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDuration: 1.25,
  reloadDuration: 1.9,
  spriteStripBase64: bow_self,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Seasoned Loose', description: 'Steady, rhythmic arrow release from a single-stave yew frame.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Double-Nock', description: 'Loose two hunting shafts simultaneously along a tight horizontal spread.', damageMultiplier: 1.4, rangeMultiplier: 1.05, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Pinning Bodkin', description: 'Aimed draw that punches through light leg armor to slow movement.', damageMultiplier: 1.75, rangeMultiplier: 1.2, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Outrider Backstep', description: 'Vault backward while loosing a snap-shot at the pursuer.', damageMultiplier: 1.1, rangeMultiplier: 0.9, cooldown: 4.5, energyCost: 10 },
    { slot: 5, name: 'Forester’s Volley', description: 'Rapid five-arrow arcing barrage over low cover.', damageMultiplier: 2.15, rangeMultiplier: 1.25, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 02. Short Bow — Compact, lightweight bow built for quick drawing and firing on the move or from tight cover.
 */
export const bow02ShortWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'bow_02_short',
  name: 'Short Bow',
  category: 'Bows',
  archetypeNumber: '02',
  description:
    'A lightweight, quick-drawing bow optimized for swift skirmishing, outrider maneuvers, and confined ambushes.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 90,
  shotsPerChain: 7,
  damagePerShot: 8,
  chainDuration: 1.1,
  reloadDuration: 1.7,
  spriteStripBase64: bow_short,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Skirmish Snap-Loose', description: 'Blistering short-draw arrow cadence engineered for mobile kiting.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Ambush Triple-Tap', description: 'Three rapid-fire shafts loosed from hip-level in a split second.', damageMultiplier: 1.35, rangeMultiplier: 0.95, cooldown: 3.5, energyCost: 11 },
    { slot: 3, name: 'Tendon Clipper', description: 'Low-angle shot aimed at exposed knee and ankle joints.', damageMultiplier: 1.65, rangeMultiplier: 1.1, cooldown: 6.0, energyCost: 16 },
    { slot: 4, name: 'Tuck & Roll Draw', description: 'Evasive dash that immediately chambers the next arrow.', damageMultiplier: 1.05, rangeMultiplier: 0.85, cooldown: 4.0, energyCost: 10 },
    { slot: 5, name: 'Outrider Storm', description: 'Unleash a frantic seven-shaft fan while strafing at full speed.', damageMultiplier: 2.1, rangeMultiplier: 1.15, cooldown: 10.0, energyCost: 22 },
  ],
});

/**
 * 03. Flat Bow — Wide, flat-limbed bow that distributes tension evenly across its stave for smooth, consistent accuracy.
 */
export const bow03FlatWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'bow_03_flat',
  name: 'Flat Bow',
  category: 'Bows',
  archetypeNumber: '03',
  description:
    'A broad-limbed stave engineered to distribute mechanical stress evenly, yielding a stable, high-efficiency draw.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 108,
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDuration: 1.3,
  reloadDuration: 2.0,
  spriteStripBase64: bow_flat,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Broad-Limb Release', description: 'Vibration-free flat-stave shot with pinpoint trajectory stability.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Measured Twin-Shot', description: 'Two evenly spaced arrows placed along the same sightline.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Broadhead Cutter', description: 'Heavy razor-tipped arrow that tears through unshielded plating.', damageMultiplier: 1.75, rangeMultiplier: 1.15, cooldown: 7.2, energyCost: 18 },
    { slot: 4, name: 'Stave Deflect', description: 'Use the wide ash limbs to parry a close-quarters lunge and step clear.', damageMultiplier: 0.8, rangeMultiplier: 0.6, cooldown: 4.5, energyCost: 10 },
    { slot: 5, name: 'Dead-Calm Anchor', description: 'Zero-sway full draw that threads an arrow through the smallest visor slit.', damageMultiplier: 2.2, rangeMultiplier: 1.35, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 04. Recurve Bow — Graceful bow with tips that curve away from the archer, imparting high velocity without requiring a massive frame.
 */
export const bow04RecurveWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'bow_04_recurve',
  name: 'Recurve Bow',
  category: 'Bows',
  archetypeNumber: '04',
  description:
    'A bow with limbs that curve outward at the tips, accelerating arrow velocity without requiring an oversized draw length.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 115,
  shotsPerChain: 5,
  damagePerShot: 11,
  chainDuration: 1.25,
  reloadDuration: 2.1,
  spriteStripBase64: bow_recurve,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Recurve Whip-Shot', description: 'High-velocity arrow propelled by outward-snapping limb tips.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Curved Flight Pair', description: 'Loose twin high-tension shafts that converge at mid-range.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.5, energyCost: 13 },
    { slot: 3, name: 'Armor-Seam Needle', description: 'Flat-trajectory shot with minimal drop over long sightlines.', damageMultiplier: 1.8, rangeMultiplier: 1.25, cooldown: 7.5, energyCost: 19 },
    { slot: 4, name: 'Wind-Step Release', description: 'Glide laterally on thrusters while releasing a stabilized counter-shot.', damageMultiplier: 1.15, rangeMultiplier: 1.0, cooldown: 5.0, energyCost: 12 },
    { slot: 5, name: 'Crescent Sky-Barrage', description: 'Rapid-fire recurve cadence that rains high-velocity shafts onto a zone.', damageMultiplier: 2.25, rangeMultiplier: 1.3, cooldown: 12.0, energyCost: 26 },
  ],
});

/**
 * 05. Reflex Bow — High-tension bow whose entire limbs curve forward when unstrung, demanding heavy draw strength for explosive speed.
 */
export const bow05ReflexWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'bow_05_reflex',
  name: 'Reflex Bow',
  category: 'Bows',
  archetypeNumber: '05',
  description:
    'An aggressively pre-stressed limb profile that curves completely away from the archer when unstrung, delivering snap-fire power.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 105,
  shotsPerChain: 6,
  damagePerShot: 9,
  chainDuration: 1.15,
  reloadDuration: 1.8,
  spriteStripBase64: bow_reflex,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Reflex Snap-Dart', description: 'Supersonic short-flight shaft launched from pre-stressed limbs.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Whip-String Double', description: 'Two lightning-fast arrows released before the first strikes home.', damageMultiplier: 1.4, rangeMultiplier: 1.05, cooldown: 3.8, energyCost: 12 },
    { slot: 3, name: 'Over-Tension Spike', description: 'Pull past the reflex stop to launch an armor-cracking dart.', damageMultiplier: 1.8, rangeMultiplier: 1.2, cooldown: 6.8, energyCost: 18 },
    { slot: 4, name: 'Snap-Pivot Evade', description: 'Use limb recoil to kick off into a fast lateral dodge.', damageMultiplier: 1.1, rangeMultiplier: 0.9, cooldown: 4.2, energyCost: 11 },
    { slot: 5, name: 'Flash-Draw Flurry', description: 'Empty an entire clip of light war darts in a blur of string tension.', damageMultiplier: 2.15, rangeMultiplier: 1.2, cooldown: 10.5, energyCost: 24 },
  ],
});

/**
 * 06. Composite Bow — Laminated bow crafted from horn, wood, and sinew to pack heavy stopping power into a compact frame.
 */
export const bow06CompositeWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'bow_06_composite',
  name: 'Composite Bow',
  category: 'Bows',
  archetypeNumber: '06',
  description:
    'A layered construct of horn, wood, and sinew bonded with alchemical resin, producing immense kinetic energy for its compact frame.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 112,
  shotsPerChain: 5,
  damagePerShot: 11,
  chainDuration: 1.2,
  reloadDuration: 2.0,
  spriteStripBase64: bow_composite,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Horn-Belly Loose', description: 'Punchy, high-impulse arrow driven by compressed horn and sinew layers.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Steppe Twin-Loose', description: 'Two heavy cavalry shafts loosed in rapid succession while moving.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.3, energyCost: 13 },
    { slot: 3, name: 'Chisel-Point Punch', description: 'Heavy war arrow engineered to split mail and composite plating.', damageMultiplier: 1.8, rangeMultiplier: 1.2, cooldown: 7.4, energyCost: 19 },
    { slot: 4, name: 'Parting Shot', description: 'Turn in the saddle/thruster glide to loose a full-power rearward shot.', damageMultiplier: 1.2, rangeMultiplier: 1.05, cooldown: 4.8, energyCost: 12 },
    { slot: 5, name: 'Khan’s Salvo', description: 'Sustained high-impact volley that knocks targets out of sprint.', damageMultiplier: 2.25, rangeMultiplier: 1.25, cooldown: 11.8, energyCost: 25 },
  ],
});

/**
 * 07. Long Bow — Tall stave reaching nearly the height of its user, built for long-range volleys and deep armor penetration.
 */
export const bow07LongWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'bow_07_long',
  name: 'Long Bow',
  category: 'Bows',
  archetypeNumber: '07',
  description:
    'A tall, high-draw-weight war bow capable of driving heavy bodkin shafts clean through reinforced armor plating at distance.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Pierce',
  range: 135,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 1.45,
  reloadDuration: 2.4,
  spriteStripBase64: bow_long,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'War-Shaft Draw', description: 'Ear-to-ear draw driving a yard-long bodkin shaft at extreme range.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Plate-Piercer Bodkin', description: 'Tempered steel needle point that ignores angled armor deflection.', damageMultiplier: 1.5, rangeMultiplier: 1.2, cooldown: 5.0, energyCost: 15 },
    { slot: 3, name: 'High-Arc Rain', description: 'Loft heavy war arrows steeply to strike behind frontline shields.', damageMultiplier: 1.85, rangeMultiplier: 1.35, cooldown: 8.2, energyCost: 21 },
    { slot: 4, name: 'Archer’s Stake Brace', description: 'Plant footing to steady aim and resist incoming knockback.', damageMultiplier: 0.7, rangeMultiplier: 0.7, cooldown: 5.0, energyCost: 10 },
    { slot: 5, name: 'Agincourt Cloud', description: 'Darken the lane with a devastating four-shaft long-range salvo.', damageMultiplier: 2.35, rangeMultiplier: 1.4, cooldown: 13.0, energyCost: 28 },
  ],
});

/**
 * 08. Compound Bow — Mechanically assisted bow utilizing pulleys and cables to maximize projectile force while reducing hold fatigue.
 */
export const bow08CompoundWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'bow_08_compound',
  name: 'Compound Bow',
  category: 'Bows',
  archetypeNumber: '08',
  description:
    'An engineered pulley-and-cam mechanical rig that reduces holding weight at full draw while maximizing projectile speed.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 128,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 1.3,
  reloadDuration: 2.2,
  spriteStripBase64: bow_compound,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Cam-Lock Release', description: 'High-let-off pulley draw firing carbon-core darts at flat rifle speeds.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Twin-Cam Sabot', description: 'Fire two sub-caliber flechettes from a single mechanical release.', damageMultiplier: 1.45, rangeMultiplier: 1.15, cooldown: 4.5, energyCost: 14 },
    { slot: 3, name: 'Zero-Creep Snipe', description: 'Hold at 85% let-off to line up a surgical weak-point puncture.', damageMultiplier: 1.85, rangeMultiplier: 1.3, cooldown: 7.8, energyCost: 20 },
    { slot: 4, name: 'Cable Dampened Step', description: 'Silent side-step while maintaining full cam tension.', damageMultiplier: 1.1, rangeMultiplier: 1.0, cooldown: 4.8, energyCost: 11 },
    { slot: 5, name: 'Overdrive Pulley Salvo', description: 'Lock the eccentric cams to maximum tension for a blistering power sequence.', damageMultiplier: 2.3, rangeMultiplier: 1.35, cooldown: 12.2, energyCost: 26 },
  ],
});

/**
 * 09. Great Bow — Monstrous oversized war-bow that must be anchored to the ground to launch javelin-sized shafts.
 */
export const bow09GreatWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'bow_09_great',
  name: 'Great Bow',
  category: 'Bows',
  archetypeNumber: '09',
  description:
    'A monstrous oversized war bow anchored by raw foot-pounds, launching heavy harpoons capable of staggering armored constructs.',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Pierce',
  range: 145,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.55,
  reloadDuration: 2.6,
  spriteStripBase64: bow_great,
  isPlaceholderAsset: false,
  actions: [
    { slot: 1, name: 'Harpoon Shaft Loose', description: 'Launch a javelin-caliber iron shaft that staggers heavy frames.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Construct Skewer', description: 'Over-drawn steel stake that punches through frontline targets.', damageMultiplier: 1.55, rangeMultiplier: 1.25, cooldown: 5.5, energyCost: 16 },
    { slot: 3, name: 'Siege Anchor Shot', description: 'Ground-spiked firing stance that sends enemies skidding backward.', damageMultiplier: 1.95, rangeMultiplier: 1.35, cooldown: 9.0, energyCost: 23 },
    { slot: 4, name: 'Limb-Plant Vault', description: 'Use the grounded bow stave as a lever to heave clear of melee rushes.', damageMultiplier: 0.9, rangeMultiplier: 0.75, cooldown: 5.5, energyCost: 12 },
    { slot: 5, name: 'Dragonslayer Bolt', description: 'Full-frame hydraulic draw launching an explosive-tipped siege harpoon.', damageMultiplier: 2.45, rangeMultiplier: 1.5, cooldown: 14.0, energyCost: 30 },
  ],
});
