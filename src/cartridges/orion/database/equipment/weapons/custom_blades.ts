/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import {
  LONG_SWORD_STRIP,
  SHOTEL_STRIP,
} from './base_sprites';
import { buildCustomizableWeapon } from './builder';

// ============================================================================
// CATEGORY 6: BLADES: CURVED (01–09)
// ============================================================================

/**
 * 01. Wakizashi — Short, single-edged companion blade with a slight curve, prized for lightning-fast draws and close-quarters precision.
 */
export const curved01WakizashiWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'curved_01_wakizashi',
  name: 'Wakizashi',
  category: 'Blades: Curved',
  archetypeNumber: '01',
  description:
    'A traditional companion sidearm forged by eastern guildsmiths for rapid duels and close-quarters defense.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 22,
  shotsPerChain: 5,
  damagePerShot: 11,
  chainDuration: 0.75,
  reloadDuration: 0.35,
  canBlock: true,
  spriteStripBase64: SHOTEL_STRIP,
  actions: [
    { slot: 1, name: 'Companion Snap-Cut', description: 'Blistering short-arc draw-cuts designed for cramped corridors.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Reverse-Grip Throat Slice', description: 'Flip the short blade to shear exposed neck and cable conduits.', damageMultiplier: 1.35, rangeMultiplier: 1.0, cooldown: 3.4, energyCost: 10 },
    { slot: 3, name: 'Step-In Iai Flash', description: 'Dart inside the enemy’s reach to deliver a twin diagonal slash.', damageMultiplier: 1.7, rangeMultiplier: 1.15, cooldown: 6.0, energyCost: 16 },
    { slot: 4, name: 'Tsuba Deflection', description: 'Slip the incoming strike off the iron disc guard and pivot clear.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.4, energyCost: 5 },
    { slot: 5, name: 'Five-Petal Sever', description: 'Five instantaneous close-range slashes before the target can recover.', damageMultiplier: 2.1, rangeMultiplier: 1.15, cooldown: 9.8, energyCost: 22 },
  ],
});

/**
 * 02. Katana — Slender, single-edged curved sword designed for fluid two-handed or one-handed drawing cuts that slice cleanly.
 */
export const curved02KatanaWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'curved_02_katana',
  name: 'Katana',
  category: 'Blades: Curved',
  archetypeNumber: '02',
  description:
    'A medium-length curved blade designed for slashing and piercing, folded in master smithing traditions, a deadly tool in skilled hands.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 28,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 0.9,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: SHOTEL_STRIP,
  actions: [
    { slot: 1, name: 'kesa-Giri Draw Cut', description: 'Fluid diagonal slicing strokes along the tempered curved edge.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Rising Swallow Cut', description: 'Snap the blade upward from a low scabbard stance to catch lunges.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Iai Dash-Sever', description: 'Glide past the target at full thruster burn while delivering a delayed slash.', damageMultiplier: 1.8, rangeMultiplier: 1.35, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Mune-Ridge Deflect', description: 'Angle the thick unsharpened spine to glance off heavy blows.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Moonlight Crescent', description: 'Unleash a razor-sharp vacuum wave from a perfected overhead draw.', damageMultiplier: 2.25, rangeMultiplier: 1.45, cooldown: 11.2, energyCost: 24 },
  ],
});

/**
 * 03. Khopesh — Hooked sickle-sword sharpened on the outer curve, engineered to catch shields and deliver axe-like chopping power.
 */
export const curved03KhopeshWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'curved_03_khopesh',
  name: 'Khopesh',
  category: 'Blades: Curved',
  archetypeNumber: '03',
  description:
    'An ancient sickle-sword featuring an outer-curved forward edge designed to hook shields and deliver sweeping slashes.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 25,
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDuration: 0.85,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: SHOTEL_STRIP,
  actions: [
    { slot: 1, name: 'Outer-Arc Chop', description: 'Axe-weighted sickle chops that bite through light and medium plating.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Shield-Rim Snag', description: 'Hook the inner sickle curve over the enemy’s guard to expose their chest.', damageMultiplier: 1.4, rangeMultiplier: 1.05, cooldown: 3.8, energyCost: 12 },
    { slot: 3, name: 'Sun-Dynasty Cleave', description: 'Spinning forward lunge that strikes twice along the hooked belly.', damageMultiplier: 1.75, rangeMultiplier: 1.2, cooldown: 6.8, energyCost: 18 },
    { slot: 4, name: 'Crook-Spine Bind', description: 'Catch and lock an incoming blade in the straight lower ricasso.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Pharaoh’s Judgment', description: 'Wrench the target’s guard open and follow with a brutal decapitating hew.', damageMultiplier: 2.2, rangeMultiplier: 1.25, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 04. Shotel — Deeply curved, nearly semicircular blade that can be used to hook and stab around an opponent's guard or shield.
 */
export const curved04ShotelWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'curved_04_shotel',
  name: 'Shotel',
  category: 'Blades: Curved',
  archetypeNumber: '04',
  description:
    'A deeply curved, sickle-like highlands blade engineered to reach around shields and bypass an opponent’s guard.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 26,
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDuration: 0.85,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: SHOTEL_STRIP,
  actions: [
    { slot: 1, name: 'Hooked Reach Slash', description: 'Whip the semicircular blade around frontal shields to sting the flank.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Kidney-Hook Peck', description: 'Invert the hilt to sink the curved point behind the target’s shoulder.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 3.9, energyCost: 12 },
    { slot: 3, name: 'Highlander Tendon Reap', description: 'Low sweeping hook that trips advancing vanguards.', damageMultiplier: 1.75, rangeMultiplier: 1.15, cooldown: 6.8, energyCost: 18 },
    { slot: 4, name: 'Sickle-Curve Ward', description: 'Deflect strikes off the double-edged outer curve.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Eclipse Bypass', description: 'Ignore frontal block frames with a devastating over-the-shield impale.', damageMultiplier: 2.2, rangeMultiplier: 1.3, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 05. Odachi — Impossibly long, sweeping two-handed field sword built to cut down cavalry and cleave through multiple ranks in a single arc.
 */
export const curved05OdachiWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'curved_05_odachi',
  name: 'Odachi',
  category: 'Blades: Curved',
  archetypeNumber: '05',
  description:
    'An immense two-handed battlefield sword with a sweeping edge, deployed to sweep through mounted vanguards on open fields.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Pierce',
  range: 36,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.15,
  reloadDuration: 0.65,
  canBlock: true,
  spriteStripBase64: SHOTEL_STRIP,
  actions: [
    { slot: 1, name: 'Great-Field Sweep', description: 'Massive two-handed horizontal arcs that span the entire corridor.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Cavalry-Feller Cut', description: 'Low sweeping draw-cut that shears through leg actuators at long reach.', damageMultiplier: 1.5, rangeMultiplier: 1.15, cooldown: 5.0, energyCost: 15 },
    { slot: 3, name: 'Heaven-to-Earth Split', description: 'Towering overhead slash that cleaves through shields and staggered ranks.', damageMultiplier: 1.9, rangeMultiplier: 1.25, cooldown: 8.4, energyCost: 22 },
    { slot: 4, name: 'Half-Spine Brace', description: 'Grip the wrapped ricasso with the off-hand to block heavy charges.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Horizon-Severing Arc', description: 'Full-rotation great-blade tempest that hits every enemy in a wide radius.', damageMultiplier: 2.4, rangeMultiplier: 1.4, cooldown: 13.0, energyCost: 28 },
  ],
});

/**
 * 06. Kilij — Sabre that curves sharply toward a flared, double-edged tip (yelman), adding brutal weight and speed to the end of every slash.
 */
export const curved06KilijWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'curved_06_kilij',
  name: 'Kilij',
  category: 'Blades: Curved',
  archetypeNumber: '06',
  description:
    'A nomad cavalry sabre with a flared, double-edged tip that shifts kinetic mass forward to produce devastating draw-cuts.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 27,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 0.9,
  reloadDuration: 0.5,
  canBlock: true,
  spriteStripBase64: SHOTEL_STRIP,
  actions: [
    { slot: 1, name: 'Yelman Whip-Cut', description: 'Forward-weighted sabre slashes that accelerate through the target.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'False-Edge Backslash', description: 'Flick the sharpened rear yelman edge on the recovery stroke.', damageMultiplier: 1.4, rangeMultiplier: 1.05, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Corsair Glide-Hew', description: 'High-speed thruster pass that delivers a deep shearing cut.', damageMultiplier: 1.8, rangeMultiplier: 1.25, cooldown: 7.2, energyCost: 19 },
    { slot: 4, name: 'Quillon Pistol-Grip Parry', description: 'Use the flared crossguard and angled pommel to deflect strikes effortlessly.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Crescent Gale', description: 'Whirling four-stroke sabre combination that overwhelms single-target guards.', damageMultiplier: 2.25, rangeMultiplier: 1.25, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 07. Falx — Ferocious two-handed blade that curves forward like a scythe, concentrating immense tearing force into its inward-facing point.
 */
export const curved07FalxWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'curved_07_falx',
  name: 'Falx',
  category: 'Blades: Curved',
  archetypeNumber: '07',
  description:
    'A fearsome two-handed forward-curving war blade designed to hook over tower shields and split helmets with a scythe-like chop.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Pierce',
  range: 32,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.1,
  reloadDuration: 0.6,
  canBlock: true,
  spriteStripBase64: SHOTEL_STRIP,
  actions: [
    { slot: 1, name: 'Inward Scythe Rip', description: 'Drive the forward-curving point into plating and drag backward.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Helm-Cracker Hook', description: 'Reach over the top edge of tower shields to spike the head unit.', damageMultiplier: 1.5, rangeMultiplier: 1.15, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Dacian Shield-Tear', description: 'Wrench an enemy’s defensive guard completely open.', damageMultiplier: 1.9, rangeMultiplier: 1.2, cooldown: 8.2, energyCost: 21 },
    { slot: 4, name: 'Two-Handed Haft Block', description: 'Absorb impacts along the long ash grip.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Reaper’s Harvest', description: 'Brutal downward hook-and-rip execution that bypasses block mitigation.', damageMultiplier: 2.4, rangeMultiplier: 1.3, cooldown: 12.8, energyCost: 28 },
  ],
});

/**
 * 08. Dao — Sturdy, broad-bladed single-edged sabre with a gentle curve, favored for its durability and aggressive sweeping momentum.
 */
export const curved08DaoWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'curved_08_dao',
  name: 'Dao',
  category: 'Blades: Curved',
  archetypeNumber: '08',
  description:
    'A single-edged broadsword from the eastern manufacturing clans featuring a flared slashing belly, balanced for rapid sweeping forms.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 27,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 0.9,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: SHOTEL_STRIP,
  actions: [
    { slot: 1, name: 'Ox-Tail Broad Slash', description: 'Forceful, continuous wrapping slashes that never lose momentum.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Coiling Body Wrap', description: 'Spin the broad blade around the shoulders to parry and strike in one motion.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.1, energyCost: 13 },
    { slot: 3, name: 'Tiger-Pounce Cleave', description: 'Explosive forward leap-slash that cracks medium armor.', damageMultiplier: 1.8, rangeMultiplier: 1.25, cooldown: 7.2, energyCost: 19 },
    { slot: 4, name: 'Thick-Spine Ward', description: 'Catch heavy blows squarely on the reinforced back-spine of the sabre.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Fierce Tiger Eight-Cut', description: 'Unrelenting sequence of figure-eight broadsword slashes.', damageMultiplier: 2.25, rangeMultiplier: 1.25, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 09. Dadao — Heavy, cleaver-like war-blade with a long handle and a massive, top-heavy head built for brutal, armor-shearing chops.
 */
export const curved09DadaoWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'curved_09_dadao',
  name: 'Dadao',
  category: 'Blades: Curved',
  archetypeNumber: '09',
  description:
    'A heavy, two-handed military cleaver built with a broad tip, designed for brutal overhead chops through frontline armor lines.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Impact',
  range: 31,
  shotsPerChain: 3,
  damagePerShot: 19,
  chainDuration: 1.15,
  reloadDuration: 0.65,
  canBlock: true,
  spriteStripBase64: SHOTEL_STRIP,
  actions: [
    { slot: 1, name: 'War-Cleaver Chop', description: 'Top-heavy two-handed cleaver blows that combine blade bite with hammer shock.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Ring-Pommel Hook', description: 'Strike with the heavy iron ring pommel to stun close targets.', damageMultiplier: 1.5, rangeMultiplier: 1.0, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Vanguard Splitter', description: 'Diagonal downward chop that shears through raised weapon guards.', damageMultiplier: 1.9, rangeMultiplier: 1.2, cooldown: 8.4, energyCost: 22 },
    { slot: 4, name: 'Broad-Belly Block', description: 'Hold the palm-wide cleaver flat to stop incoming attacks cold.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Iron-Gate Execution', description: 'Two-step overhead guillotine chop that shatters Layer 2 armor.', damageMultiplier: 2.45, rangeMultiplier: 1.3, cooldown: 13.0, energyCost: 29 },
  ],
});

// ============================================================================
// CATEGORY 7: BLADES: STRAIGHT (01–09)
// ============================================================================

/**
 * 01. Cinquedea — Heavy, civilian short-sword with a broad, five-finger-wide base that tapers steeply to a sharp thrusting point.
 */
export const straight01CinquedeaWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'straight_01_cinquedea',
  name: 'Cinquedea',
  category: 'Blades: Straight',
  archetypeNumber: '01',
  description:
    'A broad, five-finger-wide guild dagger tapering sharply to a thrusting point, lethal in crowded alley ambushes.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 22,
  shotsPerChain: 5,
  damagePerShot: 11,
  chainDuration: 0.75,
  reloadDuration: 0.35,
  canBlock: true,
  spriteStripBase64: LONG_SWORD_STRIP,
  actions: [
    { slot: 1, name: 'Five-Finger Thrust', description: 'Wide-based short-blade thrusts that leave gaping structural punctures.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Alleyway Riposte', description: 'Deflect with the arched guard and drive the triangular point into the ribs.', damageMultiplier: 1.35, rangeMultiplier: 1.05, cooldown: 3.4, energyCost: 10 },
    { slot: 3, name: 'Broad-Base Slash', description: 'Surprise horizontal cut using the heavy five-finger-wide blade belly.', damageMultiplier: 1.7, rangeMultiplier: 1.1, cooldown: 6.0, energyCost: 16 },
    { slot: 4, name: 'Fullered Wedge Parry', description: 'Catch enemy blades on the multi-fullered wide base.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.4, energyCost: 5 },
    { slot: 5, name: 'Bravo’s Ambush', description: 'Rapid five-thrust flurry aimed at armor joints at point-blank range.', damageMultiplier: 2.1, rangeMultiplier: 1.15, cooldown: 9.8, energyCost: 22 },
  ],
});

/**
 * 02. Spatha — Straight, parallel-edged cavalry sword of medium length, designed for reliable, disciplined slashing and thrusting in formation.
 */
export const straight02SpathaWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'straight_02_spatha',
  name: 'Spatha',
  category: 'Blades: Straight',
  archetypeNumber: '02',
  description:
    'A straight, medium-length double-edged cavalry sword engineered by frontier garrisons for sweeping mounted slashes.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 28,
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDuration: 0.9,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: LONG_SWORD_STRIP,
  actions: [
    { slot: 1, name: 'Limitanei Slash', description: 'Disciplined, parallel-edged cuts and thrusts with steady recovery.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Formation Double-Thrust', description: 'Two low, level stabs intended to slip past shield walls.', damageMultiplier: 1.4, rangeMultiplier: 1.1, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Cavalry Pass Cut', description: 'Sweeping glide-slash that maintains forward movement speed.', damageMultiplier: 1.75, rangeMultiplier: 1.25, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Iron Guard Ward', description: 'Hold the broad parallel blade upright to deflect incoming strikes.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Centurion’s Charge', description: 'Coordinated shield-step and deep lunging impale.', damageMultiplier: 2.2, rangeMultiplier: 1.3, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 03. Falchion — Single-edged straight sword that widens dramatically toward the tip, combining the handling of a sword with the cleaving weight of an axe.
 */
export const straight03FalchionWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'straight_03_falchion',
  name: 'Falchion',
  category: 'Blades: Straight',
  archetypeNumber: '03',
  description:
    'A single-edged heavy blade combining the balance of a sword with the forward weight and cutting bite of an axe.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 26,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 0.95,
  reloadDuration: 0.5,
  canBlock: true,
  spriteStripBase64: LONG_SWORD_STRIP,
  actions: [
    { slot: 1, name: 'Cleaver-Tip Hew', description: 'Tip-heavy chops that bite deep into padded and plated frames.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Clipped-Point Thrust', description: 'Drive the angled cusped tip into mail and cable bundles.', damageMultiplier: 1.4, rangeMultiplier: 1.05, cooldown: 4.1, energyCost: 13 },
    { slot: 3, name: 'Men-at-Arms Hack', description: 'Brutal two-stroke downward chop that cracks off-hand guards.', damageMultiplier: 1.8, rangeMultiplier: 1.15, cooldown: 7.2, energyCost: 19 },
    { slot: 4, name: 'Thick-Back Parry', description: 'Catch enemy weapons on the heavy unsharpened spine.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Butcher’s Verdict', description: 'Overhand cleaving finisher that staggers even heavy constructs.', damageMultiplier: 2.25, rangeMultiplier: 1.2, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 04. Arming Sword — Quintessential knightly sidearm featuring a cruciform hilt and a double-edged blade balanced for one-handed use with a shield.
 */
export const straight04ArmingWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'straight_04_arming',
  name: 'Arming Sword',
  category: 'Blades: Straight',
  archetypeNumber: '04',
  description:
    'The quintessential knightly one-handed cross-hilted sword, balanced for agile thrusts, cuts, and paired shield maneuvers.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 28,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 0.9,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: LONG_SWORD_STRIP,
  actions: [
    { slot: 1, name: 'Knightly Cut & Thrust', description: 'Balanced cruciform swordplay alternating diagonal cuts and crisp thrusts.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Pommel Mordhau Check', description: 'Step inside and crack the enemy’s helm with the wheel pommel.', damageMultiplier: 1.4, rangeMultiplier: 1.0, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Lunge of Chivalry', description: 'Extended one-handed thrust that finds the gap between pauldron and helm.', damageMultiplier: 1.8, rangeMultiplier: 1.25, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Cruciform Cross-Guard', description: 'Bind the incoming weapon against the straight steel quillons.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Vanguard Reckoning', description: 'Fluid three-cut combination capped by an armor-piercing estoc lunge.', damageMultiplier: 2.25, rangeMultiplier: 1.3, cooldown: 11.2, energyCost: 24 },
  ],
});

/**
 * 05. Bastard Sword — Versatile hand-and-a-half sword with an extended grip, allowing the wielder to switch seamlessly between one- and two-handed leverage.
 */
export const straight05BastardWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'straight_05_bastard',
  name: 'Bastard Sword',
  category: 'Blades: Straight',
  archetypeNumber: '05',
  description:
    'A hand-and-a-half sword featuring an extended grip, allowing the wielder to switch fluidly between one-handed guard and two-handed power.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 30,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 0.95,
  reloadDuration: 0.5,
  canBlock: true,
  spriteStripBase64: LONG_SWORD_STRIP,
  actions: [
    { slot: 1, name: 'Hand-and-a-Half Sweep', description: 'Long-reach cuts that leverage the extended scent-stopper pommel.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Half-Sword Point Drive', description: 'Grip the mid-blade to guide the rigid tip into thick armor joints.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Zornhau Wrath-Stroke', description: 'Explosive diagonal master-cut that beats aside enemy guards.', damageMultiplier: 1.85, rangeMultiplier: 1.2, cooldown: 7.4, energyCost: 19 },
    { slot: 4, name: 'Hanging Point Guard', description: 'Hold the blade in a high hanging ward to deflect and counter-thrust.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Knight-Errant Tempest', description: 'Seamless 1H-to-2H combo finishing with a devastating overhead cleave.', damageMultiplier: 2.3, rangeMultiplier: 1.3, cooldown: 11.8, energyCost: 25 },
  ],
});

/**
 * 06. Messer — Rugged, single-edged blade constructed like a massive knife, featuring a distinctive side-nail guard (nagel) to protect the knuckles.
 */
export const straight06MesserWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'straight_06_messer',
  name: 'Messer',
  category: 'Blades: Straight',
  archetypeNumber: '06',
  description:
    'A heavy, single-edged knife-sword fitted with a distinct guard lug, favored by frontline skirmishers and duelists.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 27,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 0.9,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: LONG_SWORD_STRIP,
  actions: [
    { slot: 1, name: 'Landsknecht Hew', description: 'Aggressive, workmanlike cuts from a slab-tang knife-sword.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Nagel Bind & Slice', description: 'Trap the opponent’s blade on the side-lug and shear across their wrist.', damageMultiplier: 1.45, rangeMultiplier: 1.05, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Dussack Winding Thrust', description: 'Wind the hilt high around the guard to thrust straight into the visor.', damageMultiplier: 1.8, rangeMultiplier: 1.15, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Knuckle-Nail Guard', description: 'Catch sliding blades on the protruding iron nagel.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Gassenhauer Brawler', description: 'Relentless close-in bind, pommel bash, and throat-cutting sequence.', damageMultiplier: 2.25, rangeMultiplier: 1.2, cooldown: 11.2, energyCost: 24 },
  ],
});

/**
 * 07. Zweihander — Colossal two-handed greatsword sporting secondary parrying lugs above the ricasso, swung in wide figure-eights to break pike lines.
 */
export const straight07ZweihanderWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'straight_07_zweihander',
  name: 'Zweihander',
  category: 'Blades: Straight',
  archetypeNumber: '07',
  description:
    'A massive double-handed sword with flanged parrying lugs, wielded by frontline shock infantry to break spear lines.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Impact',
  range: 36,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.15,
  reloadDuration: 0.65,
  canBlock: true,
  spriteStripBase64: LONG_SWORD_STRIP,
  actions: [
    { slot: 1, name: 'Montante Figure-Eight', description: 'Continuous two-handed greatsword arcs that create a zone of denial.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Parierhaken Catch', description: 'Choke up on the leather ricasso and snag polearms with the parrying hooks.', damageMultiplier: 1.5, rangeMultiplier: 1.15, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Doppelsöldner Breach', description: 'Whirling double-circle advance that knocks entire squads backward.', damageMultiplier: 1.9, rangeMultiplier: 1.25, cooldown: 8.5, energyCost: 22 },
    { slot: 4, name: 'Ricasso Wide-Ward', description: 'Brace the six-foot steel blade diagonally across the chassis.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Forlorn Hope Cleave', description: 'Full-commitment overhead smash that shatters guards and shields.', damageMultiplier: 2.45, rangeMultiplier: 1.35, cooldown: 13.0, energyCost: 29 },
  ],
});

/**
 * 08. Flamberge — Undulating, wave-bladed greatsword designed to transmit jarring vibrations into parrying weapons and saw through wounds.
 */
export const straight08FlambergeWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'straight_08_flamberge',
  name: 'Flamberge',
  category: 'Blades: Straight',
  archetypeNumber: '08',
  description:
    'A greatsword with an undulating, wave-shaped blade designed to induce heavy blade vibrations on parry and tear ragged cuts.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Pierce',
  range: 35,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.15,
  reloadDuration: 0.65,
  canBlock: true,
  spriteStripBase64: LONG_SWORD_STRIP,
  actions: [
    { slot: 1, name: 'Flame-Wave Draw', description: 'Serrated undulating cuts that rasp and saw through composite plating.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Chatter-Parry Bind', description: 'Rasp the wavy edge along an enemy weapon to numb their actuators.', damageMultiplier: 1.5, rangeMultiplier: 1.1, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Serpentine Impale', description: 'Deep two-handed thrust that widens the wound channel on withdrawal.', damageMultiplier: 1.9, rangeMultiplier: 1.25, cooldown: 8.4, energyCost: 22 },
    { slot: 4, name: 'Undulating Guard', description: 'Catch and slow sliding strikes along the wave-contoured edges.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Crimson Maelstrom', description: 'Sweeping three-rotation wave-blade vortex that shreds everything in reach.', damageMultiplier: 2.4, rangeMultiplier: 1.35, cooldown: 12.8, energyCost: 28 },
  ],
});

/**
 * 09. Executioner — Heavy, flat-tipped greatsword devoid of a thrusting point, concentrating all its mass into a wide, guillotine-like chopping blade.
 */
export const straight09ExecutionerWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'straight_09_executioner',
  name: 'Executioner',
  category: 'Blades: Straight',
  archetypeNumber: '09',
  description:
    'A heavy, flat-tipped two-handed blade balanced purely for forward momentum and decapitating downward chops.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Impact',
  range: 32,
  shotsPerChain: 2,
  damagePerShot: 28,
  chainDuration: 1.25,
  reloadDuration: 0.75,
  canBlock: true,
  spriteStripBase64: LONG_SWORD_STRIP,
  actions: [
    { slot: 1, name: 'Headsman’s Hew', description: 'Ponderous, square-tipped horizontal cleaves with immense terminal mass.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Scaffold Sweep', description: 'Low ankle-height chop that fells charging enemies like timber.', damageMultiplier: 1.55, rangeMultiplier: 1.1, cooldown: 5.5, energyCost: 16 },
    { slot: 3, name: 'Sentence of Iron', description: 'Crushing downward chop that ignores partial block frames.', damageMultiplier: 1.95, rangeMultiplier: 1.15, cooldown: 8.8, energyCost: 23 },
    { slot: 4, name: 'Slab-Blade Wall', description: 'Present the four-inch-wide flat of the blade as an iron shield.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.8, energyCost: 6 },
    { slot: 5, name: 'Final Guillotine', description: 'Full-power overhead execution strike that cleaves through Layer 2 and Layer 3.', damageMultiplier: 2.55, rangeMultiplier: 1.25, cooldown: 14.0, energyCost: 30 },
  ],
});
