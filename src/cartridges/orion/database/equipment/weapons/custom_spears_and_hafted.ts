/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../../types';
import {
  HAND_AXE_STRIP,
  MACE_STRIP,
  SHORT_SPEAR_STRIP,
} from './base_sprites';
import { buildCustomizableWeapon } from './builder';

// ============================================================================
// CATEGORY 4: SPEARS (01–09)
// ============================================================================

/**
 * 01. Short Spear — Manageable six-foot shaft tipped with a simple iron point, balanced for quick one-handed thrusts or two-handed skirmishing.
 */
export const spear01ShortWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'spear_01_short',
  name: 'Short Spear',
  category: 'Spears',
  archetypeNumber: '01',
  description:
    'A handy six-foot thrusting spear built for swift one-on-one skirmishing and close-quarters combat.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 32,
  shotsPerChain: 5,
  damagePerShot: 11,
  chainDuration: 0.9,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: SHORT_SPEAR_STRIP,
  actions: [
    { slot: 1, name: 'Skirmish Thrust', description: 'Quick, disciplined one-handed spear thrusts that keep foes at bay.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Double-Tap Viper', description: 'Two rapid lunging stabs aimed at exposed shoulder and visor seams.', damageMultiplier: 1.35, rangeMultiplier: 1.1, cooldown: 3.5, energyCost: 11 },
    { slot: 3, name: 'Butt-Spike Reverse', description: 'Spin the ash haft to club a flanking attacker with the iron ferrule.', damageMultiplier: 1.7, rangeMultiplier: 0.95, cooldown: 6.2, energyCost: 16 },
    { slot: 4, name: 'Shaft Cross-Parry', description: 'Angle the six-foot shaft to deflect incoming melee swings.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Outrider Impale', description: 'Explosive forward sprint-thrust that pins the target in place.', damageMultiplier: 2.1, rangeMultiplier: 1.35, cooldown: 10.5, energyCost: 22 },
  ],
});

/**
 * 02. Winged Spear — Thrusting spear featuring two prominent lugs at the base of the blade to prevent over-penetration and trap enemy weapons.
 */
export const spear02WingedWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'spear_02_winged',
  name: 'Winged Spear',
  category: 'Spears',
  archetypeNumber: '02',
  description:
    'A thrusting spear flanked by side lugs behind the head to prevent over-penetration and entangle enemy weapon shafts.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 34,
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDuration: 0.95,
  reloadDuration: 0.5,
  canBlock: true,
  spriteStripBase64: SHORT_SPEAR_STRIP,
  actions: [
    { slot: 1, name: 'Lugged Thrust', description: 'Measured spear thrust that stops cleanly at the cross-lugs.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Wing-Hook Twist', description: 'Catch the enemy’s shield rim on the side lugs and wrench it open.', damageMultiplier: 1.4, rangeMultiplier: 1.05, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Stop-Rib Shove', description: 'Drive the cross-wings into the target’s chest to shove them back.', damageMultiplier: 1.75, rangeMultiplier: 1.15, cooldown: 7.0, energyCost: 18 },
    { slot: 4, name: 'Lugged Bind-Parry', description: 'Trap an incoming blade between the socket wings and counter-twist.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Hearthguard Pin', description: 'Deep lunging impale followed by a violent wrenching extraction.', damageMultiplier: 2.2, rangeMultiplier: 1.3, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 03. Javelin — Light, front-weighted spear tapered for aerodynamic flight, equally suited for rapid close-quarters stabs or hurling.
 */
export const spear03JavelinWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'spear_03_javelin',
  name: 'Javelin',
  category: 'Spears',
  archetypeNumber: '03',
  description:
    'A light, front-weighted throwing shaft weighted for maximum aerodynamic piercing upon ballistic impact.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 36,
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDuration: 0.85,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: SHORT_SPEAR_STRIP,
  actions: [
    { slot: 1, name: 'Darting Stab', description: 'Agile, front-weighted stabs that recover almost instantly.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Amentum Hurl', description: 'Sling a Spare Javelin at high velocity using a leather throwing loop.', damageMultiplier: 1.45, rangeMultiplier: 2.2, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Soft-Iron Bend Pin', description: 'Pierce an enemy shield with a long shank that drags their guard down.', damageMultiplier: 1.75, rangeMultiplier: 1.8, cooldown: 6.8, energyCost: 18 },
    { slot: 4, name: 'Peltast Vault', description: 'Deflect a strike and hop backward to throwing range.', damageMultiplier: 0.6, rangeMultiplier: 0.7, cooldown: 0.6, energyCost: 6 },
    { slot: 5, name: 'Sky-Spear Volley', description: 'Hurl three aerodynamic javelins in rapid succession before closing in.', damageMultiplier: 2.2, rangeMultiplier: 2.4, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 04. Spetum — Long polearm with a central thrusting spearhead flanked by two angled, crescent-shaped side blades for hooking and slashing.
 */
export const spear04SpetumWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'spear_04_spetum',
  name: 'Spetum',
  category: 'Spears',
  archetypeNumber: '04',
  description:
    'A long thrusting spear featuring two sharp, crescent-shaped side blades designed to hook armor and parry strikes.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 38,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 1.0,
  reloadDuration: 0.55,
  canBlock: true,
  spriteStripBase64: SHORT_SPEAR_STRIP,
  actions: [
    { slot: 1, name: 'Trident-Point Thrust', description: 'Long-reach central thrust backed by two crescent side-prongs.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Crescent Flank-Hook', description: 'Snag enemy leg or shoulder plating with the curved side-blades.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Ranseur Disarm Sweep', description: 'Wide two-handed figure-eight slash that punishes grouped targets.', damageMultiplier: 1.8, rangeMultiplier: 1.15, cooldown: 7.4, energyCost: 19 },
    { slot: 4, name: 'Forked Catch-Guard', description: 'Catch an incoming overhead strike in the crescent fork.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.6, energyCost: 5 },
    { slot: 5, name: 'Impale & Drag', description: 'Drive all three points home and haul the target off-balance.', damageMultiplier: 2.25, rangeMultiplier: 1.3, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 05. Broad Spear — Heavy-duty spear sporting a wide, leaf-shaped blade capable of delivering deep, cleaving cuts as well as punctures.
 */
export const spear05BroadWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'spear_05_broad',
  name: 'Broad Spear',
  category: 'Spears',
  archetypeNumber: '05',
  description:
    'A wide, leaf-bladed spear optimized to deliver vicious cutting wounds alongside heavy forward thrusts.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 36,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 1.05,
  reloadDuration: 0.55,
  canBlock: true,
  spriteStripBase64: SHORT_SPEAR_STRIP,
  actions: [
    { slot: 1, name: 'Leaf-Blade Thrust', description: 'Heavy two-handed puncture that leaves wide structural tears.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Hewing Spear Cut', description: 'Whip the wide double-edged head in a bone-chopping horizontal slash.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.3, energyCost: 13 },
    { slot: 3, name: 'Riving Lunge', description: 'Step in with full torso torque to split light shields.', damageMultiplier: 1.8, rangeMultiplier: 1.25, cooldown: 7.5, energyCost: 19 },
    { slot: 4, name: 'Wide-Socket Guard', description: 'Brace the thick ash shaft and broad head against frontal assaults.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.6, energyCost: 5 },
    { slot: 5, name: 'Whirling Leaf Tempest', description: 'Alternate sweeping cuts and deep thrusts in a relentless combo.', damageMultiplier: 2.25, rangeMultiplier: 1.25, cooldown: 11.8, energyCost: 25 },
  ],
});

/**
 * 06. Partisan — Aristocratic double-edged spear with symmetrical basal wings, balanced for nimble parrying and sweeping slashes.
 */
export const spear06PartisanWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'spear_06_partisan',
  name: 'Partisan',
  category: 'Spears',
  archetypeNumber: '06',
  description:
    'A broad double-edged spear head mounted with sharp basal projections, serving both as an officer’s insignia and a lethal thrusting tool.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 38,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 1.0,
  reloadDuration: 0.55,
  canBlock: true,
  spriteStripBase64: SHORT_SPEAR_STRIP,
  actions: [
    { slot: 1, name: 'Officer’s Thrust', description: 'Poised, razor-accurate thrust along the central medial ridge.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Winged Riposte Slash', description: 'Parry with the basal lugs and immediately draw-cut across the visor.', damageMultiplier: 1.45, rangeMultiplier: 1.1, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Royal Guard Sweep', description: 'Graceful 180-degree sweeping arc that clears the vanguard lane.', damageMultiplier: 1.8, rangeMultiplier: 1.2, cooldown: 7.2, energyCost: 19 },
    { slot: 4, name: 'Symmetrical Wing Parry', description: 'Catch enemy strikes cleanly in the upturned basal crescents.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Sovereign’s Verdict', description: 'Triple precision thrust culminating in a high-impulse finishing lunge.', damageMultiplier: 2.3, rangeMultiplier: 1.35, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 07. Pike — Extremely long infantry polearm designed for formation warfare, keeping threats at a massive distance.
 */
export const spear07PikeWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'spear_07_pike',
  name: 'Pike',
  category: 'Spears',
  archetypeNumber: '07',
  description:
    'An impressively reaching pole topped with a compact steel point, built to break cavalry charges in massive phalanxes.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Pierce',
  range: 46,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.15,
  reloadDuration: 0.65,
  canBlock: true,
  spriteStripBase64: SHORT_SPEAR_STRIP,
  actions: [
    { slot: 1, name: 'Stand-Off Poke', description: 'Long-range two-handed pike thrust that strikes before foes can close.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Cheek-Strap Hedge', description: 'Double-extended thrust that halts sprinting enemies in their tracks.', damageMultiplier: 1.5, rangeMultiplier: 1.15, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Phalanx Sky-Clear', description: 'Heave the twenty-foot shaft upward and slam it down across the lane.', damageMultiplier: 1.85, rangeMultiplier: 1.1, cooldown: 8.2, energyCost: 21 },
    { slot: 4, name: 'Grounded Butt-Brace', description: 'Anchor the pike butt against the boot heel to reflect charging mass.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Push of Pike', description: 'Relentless forward march of heavy steel points that shatters enemy lines.', damageMultiplier: 2.35, rangeMultiplier: 1.3, cooldown: 12.5, energyCost: 28 },
  ],
});

/**
 * 08. Boar Spear — Thick-shafted hunting spear reinforced with a heavy cross-guard behind the head to hold back charging beasts.
 */
export const spear08BoarWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'spear_08_boar',
  name: 'Boar Spear',
  category: 'Spears',
  archetypeNumber: '08',
  description:
    'A thick-shafted spear fitted with a sturdy cross-bar designed to halt charging beasts and armored vanguards dead in their tracks.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Pierce',
  range: 38,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.1,
  reloadDuration: 0.6,
  canBlock: true,
  spriteStripBase64: SHORT_SPEAR_STRIP,
  actions: [
    { slot: 1, name: 'Stop-Toggle Thrust', description: 'Heavy leaf-head thrust backed by the iron cross-toggle.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Charge-Halt Bar', description: 'Catch a rushing target on the cross-guard and zero their velocity.', damageMultiplier: 1.5, rangeMultiplier: 1.1, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Beast-Feller Wrench', description: 'Deep gut-level puncture followed by aleveraged ground slam.', damageMultiplier: 1.9, rangeMultiplier: 1.15, cooldown: 8.0, energyCost: 21 },
    { slot: 4, name: 'Cross-Bar Anchor', description: 'Lock the leather-bound ash shaft with both hands to absorb heavy charges.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Goring Counter-Thrust', description: 'Use the enemy’s own forward momentum to multiply penetration damage.', damageMultiplier: 2.4, rangeMultiplier: 1.25, cooldown: 12.5, energyCost: 28 },
  ],
});

/**
 * 09. Lance — Heavy, tapered cavalry polearm fitted with a flared hand-guard (vamplate), engineered to channel forward momentum into a single point.
 */
export const spear09LanceWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'spear_09_lance',
  name: 'Lance',
  category: 'Spears',
  archetypeNumber: '09',
  description:
    'A heavy, tapered cavalry spear fitted with a vamplate guard, designed to deliver the crushing momentum of a charge.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Impact',
  range: 42,
  shotsPerChain: 3,
  damagePerShot: 19,
  chainDuration: 1.2,
  reloadDuration: 0.7,
  canBlock: true,
  spriteStripBase64: SHORT_SPEAR_STRIP,
  actions: [
    { slot: 1, name: 'Couched Drive', description: 'Lock the tapered lance under the arm and drive forward with thruster mass.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Vamplate Ram', description: 'Follow a deep thrust with a concussive vamplate cone check.', damageMultiplier: 1.55, rangeMultiplier: 1.2, cooldown: 5.2, energyCost: 16 },
    { slot: 3, name: 'Tilt-Barrier Charge', description: 'Full-burn thruster joust that sends every target in the lane airborne.', damageMultiplier: 1.95, rangeMultiplier: 1.45, cooldown: 8.8, energyCost: 23 },
    { slot: 4, name: 'Vamplate Cone Deflect', description: 'Angle the flared steel hand-shield to glance off incoming fire.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Grand List Breaker', description: 'Overload rear thrusters for a cataclysmic armor-shattering lance impact.', damageMultiplier: 2.5, rangeMultiplier: 1.55, cooldown: 13.5, energyCost: 30 },
  ],
});

// ============================================================================
// CATEGORY 5: IMPACT & AXES (01–09)
// ============================================================================

/**
 * 01. Cudgel — Simple, heavy-headed club of banded hardwood or iron, relying on raw, unrefined leverage to bruise and stagger.
 */
export const hafted01CudgelWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'hafted_01_cudgel',
  name: 'Cudgel',
  category: 'Impact & Axes',
  archetypeNumber: '01',
  description:
    'A weighted hardwood club reinforced with metal studs, delivering blunt concussive force through brute leverage.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Impact',
  range: 24,
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDuration: 0.85,
  reloadDuration: 0.45,
  canBlock: true,
  spriteStripBase64: MACE_STRIP,
  actions: [
    { slot: 1, name: 'Banded Club Thump', description: 'Brisk, unfussy iron-banded blows that rattle enemy sensors.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Knee-Capper Crack', description: 'Low horizontal swing aimed squarely at leg actuators.', damageMultiplier: 1.35, rangeMultiplier: 1.0, cooldown: 3.5, energyCost: 11 },
    { slot: 3, name: 'Skull-Ringer Overhead', description: 'Two-handed overhand drop that dazes light and medium targets.', damageMultiplier: 1.7, rangeMultiplier: 1.05, cooldown: 6.2, energyCost: 16 },
    { slot: 4, name: 'Stout Haft Block', description: 'Catch the strike on the iron-shod oak shaft.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Trench Brawler Flurry', description: 'Relentless four-blow concussive beatdown.', damageMultiplier: 2.1, rangeMultiplier: 1.15, cooldown: 10.0, energyCost: 22 },
  ],
});

/**
 * 02. Mace — Balanced metal shaft crowned with a flanged or knobbed head, engineered to dent plate and transfer shockwaves.
 */
export const hafted02MaceWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'hafted_02_mace',
  name: 'Mace',
  category: 'Impact & Axes',
  archetypeNumber: '02',
  description:
    'A flanged steel head mounted on an iron shaft, engineered specifically to crush rigid plate and cause trauma beneath armor.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Impact',
  range: 25,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.0,
  reloadDuration: 0.55,
  canBlock: true,
  spriteStripBase64: MACE_STRIP,
  actions: [
    { slot: 1, name: 'Flanged Crush', description: 'Concentrate kinetic shock onto steel flanges to buckle armor plates.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Pauldron Dent', description: 'Descending diagonal strike that degrades target armor efficiency.', damageMultiplier: 1.45, rangeMultiplier: 1.05, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Internal Bell-Ringer', description: 'Chest-level concussive blow that sends shockwaves into Layer 3 structure.', damageMultiplier: 1.8, rangeMultiplier: 1.1, cooldown: 7.4, energyCost: 19 },
    { slot: 4, name: 'Steel Haft Ward', description: 'Parry with the reinforced tubular steel shaft.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.6, energyCost: 5 },
    { slot: 5, name: 'Armor-Crumple Slam', description: 'Leap and bring the flanged head down with full servo torque.', damageMultiplier: 2.25, rangeMultiplier: 1.2, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 03. Spike — Focused hafted weapon featuring a single heavy, curved steel pick designed to punch directly through thick plating.
 */
export const hafted03SpikeWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'hafted_03_spike',
  name: 'Spike',
  category: 'Impact & Axes',
  archetypeNumber: '03',
  description:
    'A dedicated armor-piercing war pick designed to concentrate striking force onto a fine steel tooth.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 24,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 0.9,
  reloadDuration: 0.5,
  canBlock: true,
  spriteStripBase64: MACE_STRIP,
  actions: [
    { slot: 1, name: 'Crow’s Beak Peck', description: 'Focus the entire swing mass onto a single hardened steel spike.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Plate-Can Opener', description: 'Hook the pick into a chest seam and rip outward.', damageMultiplier: 1.4, rangeMultiplier: 1.05, cooldown: 3.8, energyCost: 12 },
    { slot: 3, name: 'Visor Puncture', description: 'High-arcing overhead pick strike that ignores angled helm deflection.', damageMultiplier: 1.8, rangeMultiplier: 1.1, cooldown: 6.8, energyCost: 18 },
    { slot: 4, name: 'Beak Hook-Parry', description: 'Snag an enemy haft behind the curved pick head.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Core-Tapper Finisher', description: 'Drive the armor spike deep into the target’s reactor housing.', damageMultiplier: 2.2, rangeMultiplier: 1.15, cooldown: 11.0, energyCost: 24 },
  ],
});

/**
 * 04. Hammer — Compact, utilitarian war-hammer with a flat striking face and a rear counterweight, built for crisp, bone-breaking blows.
 */
export const hafted04HammerWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'hafted_04_hammer',
  name: 'Hammer',
  category: 'Impact & Axes',
  archetypeNumber: '04',
  description:
    'A compact war hammer featuring a flat striking face for crushing bone and an opposing beak for puncturing helmets.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Impact',
  range: 25,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.0,
  reloadDuration: 0.55,
  canBlock: true,
  spriteStripBase64: MACE_STRIP,
  actions: [
    { slot: 1, name: 'Checkered Face Strike', description: 'Crisp, non-glancing war-hammer blows that bite into curved plate.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: ' Flip-Beak Twin', description: 'Strike with the flat face then rotate the wrist to sink the rear fluke.', damageMultiplier: 1.45, rangeMultiplier: 1.05, cooldown: 4.2, energyCost: 13 },
    { slot: 3, name: 'Anvil-Drop', description: 'Crushing downward blow that zeroes enemy jump/glide momentum.', damageMultiplier: 1.85, rangeMultiplier: 1.1, cooldown: 7.5, energyCost: 19 },
    { slot: 4, name: 'Langet Guard Block', description: 'Block along the steel-strapped langets protecting the upper haft.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.6, energyCost: 5 },
    { slot: 5, name: 'Forge-Master’s Stroke', description: 'Full-torque two-handed swing that shatters shields and poise alike.', damageMultiplier: 2.3, rangeMultiplier: 1.2, cooldown: 11.8, energyCost: 26 },
  ],
});

/**
 * 05. Mallet — Enormous two-handed maul with an oversized block head of wood, lead, or stone, meant to flatten targets through sheer mass.
 */
export const hafted05MalletWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'hafted_05_mallet',
  name: 'Mallet',
  category: 'Impact & Axes',
  archetypeNumber: '05',
  description:
    'A heavy two-handed lead or iron head built for devastating, unbalanced blows that shatter defenses and stagger frames.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Impact',
  range: 28,
  shotsPerChain: 2,
  damagePerShot: 28,
  chainDuration: 1.25,
  reloadDuration: 0.75,
  canBlock: true,
  spriteStripBase64: MACE_STRIP,
  actions: [
    { slot: 1, name: 'Lead-Block Heave', description: 'Ponderous, ground-shaking swings of an oversized siege maul.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Stake-Driver Slam', description: 'Overhead two-handed smash that craters the floor and staggers foes.', damageMultiplier: 1.55, rangeMultiplier: 1.1, cooldown: 5.5, energyCost: 16 },
    { slot: 3, name: 'Pendulum Golf-Swing', description: 'Low-to-high uppercut swing that launches targets backward.', damageMultiplier: 1.95, rangeMultiplier: 1.2, cooldown: 8.8, energyCost: 23 },
    { slot: 4, name: 'Block-Head Bulwark', description: 'Plant the massive mallet head in front of the torso as an iron wall.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.8, energyCost: 6 },
    { slot: 5, name: 'Tectonic Crater', description: 'Thruster-assisted leap slam that releases a 360-degree seismic shockwave.', damageMultiplier: 2.5, rangeMultiplier: 1.35, cooldown: 14.0, energyCost: 30 },
  ],
});

/**
 * 06. Tomahawk — Light, straight-hafted axe with a narrow bit, balanced for fast, aggressive hacking in close quarters or spinning throws.
 */
export const hafted06TomahawkWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'hafted_06_tomahawk',
  name: 'Tomahawk',
  category: 'Impact & Axes',
  archetypeNumber: '06',
  description:
    'A light, nimble throwing axe balanced with a straight haft, equally lethal in close melee or spun from the hand.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Light',
  primaryDamageType: 'Pierce',
  range: 24,
  shotsPerChain: 5,
  damagePerShot: 11,
  chainDuration: 0.85,
  reloadDuration: 0.4,
  canBlock: true,
  spriteStripBase64: HAND_AXE_STRIP,
  actions: [
    { slot: 1, name: 'Outrider Chop', description: 'Snappy, wrist-driven axe chops with minimal recovery lag.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Beard-Hook Pull', description: 'Hook the lower axe beard behind the target’s guard and yank.', damageMultiplier: 1.35, rangeMultiplier: 1.05, cooldown: 3.5, energyCost: 11 },
    { slot: 3, name: 'End-Over-End Hurl', description: 'Spin-throw a balanced tomahawk at mid-range targets.', damageMultiplier: 1.75, rangeMultiplier: 2.0, cooldown: 6.5, energyCost: 17 },
    { slot: 4, name: 'Haft Cross-Check', description: 'Deflect an attack with the straight hickory haft and step inside.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Scalp-Hunter Blitz', description: 'Furious five-hit chopping combination that shreds light armor.', damageMultiplier: 2.15, rangeMultiplier: 1.2, cooldown: 10.5, energyCost: 23 },
  ],
});

/**
 * 07. Parashu — Broad, crescent-bladed war-axe weighted toward the tip to deliver deep, shearing cuts through limbs and shields.
 */
export const hafted07ParashuWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'hafted_07_parashu',
  name: 'Parashu',
  category: 'Impact & Axes',
  archetypeNumber: '07',
  description:
    'An ancient, crescent-bladed war axe from the southern mountain traditions, balanced for deep cleaving arc strikes.',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'Medium',
  primaryDamageType: 'Pierce',
  range: 27,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDuration: 0.95,
  reloadDuration: 0.5,
  canBlock: true,
  spriteStripBase64: HAND_AXE_STRIP,
  actions: [
    { slot: 1, name: 'Crescent Shear', description: 'Sweeping draw-chop with the long curved parashu edge.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Counter-Spike Jab', description: 'Thrust with the top point to catch retreating enemies.', damageMultiplier: 1.4, rangeMultiplier: 1.15, cooldown: 4.0, energyCost: 12 },
    { slot: 3, name: 'Shield-Rim Cleaver', description: 'Heavy diagonal hew engineered to bite deep into off-hand shields.', damageMultiplier: 1.8, rangeMultiplier: 1.1, cooldown: 7.2, energyCost: 19 },
    { slot: 4, name: 'Brazen Haft Parry', description: 'Receive the enemy blow on the brass-ringed hardwood shaft.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.5, energyCost: 5 },
    { slot: 5, name: 'Mountain-Splitter', description: 'Whirling double-circle momentum chop that cleaves through guards.', damageMultiplier: 2.25, rangeMultiplier: 1.25, cooldown: 11.5, energyCost: 25 },
  ],
});

/**
 * 08. Labrys — Heavy, symmetrical double-bitted axe that uses its considerable rotational momentum to chain follow-up swings.
 */
export const hafted08LabrysWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'hafted_08_labrys',
  name: 'Labrys',
  category: 'Impact & Axes',
  archetypeNumber: '08',
  description:
    'A classical symmetrical double-bitted war axe representing divine balance and royal execution, dangerous on both forward and backswings.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Impact',
  range: 30,
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDuration: 1.1,
  reloadDuration: 0.65,
  canBlock: true,
  spriteStripBase64: HAND_AXE_STRIP,
  actions: [
    { slot: 1, name: 'Twin-Moon Hew', description: 'Symmetrical forehand and backhand cleaves with zero re-alignment delay.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Backswing Reap', description: 'Use the momentum of a missed or blocked swing to whip the rear bit home.', damageMultiplier: 1.5, rangeMultiplier: 1.1, cooldown: 4.8, energyCost: 15 },
    { slot: 3, name: 'Labyrinth Cyclone', description: '360-degree two-handed rotational sweep that clears all surrounding threats.', damageMultiplier: 1.9, rangeMultiplier: 1.2, cooldown: 8.2, energyCost: 21 },
    { slot: 4, name: 'Double-Bit Cross Guard', description: 'Hold the wide twin-bladed head horizontally to block heavy strikes.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Minotaur’s Guillotine', description: 'Crushing overhead execution chop driven by full servo output.', damageMultiplier: 2.4, rangeMultiplier: 1.25, cooldown: 12.8, energyCost: 28 },
  ],
});

/**
 * 09. Battle Axe — Long-hafted, two-handed military axe with a wide, flared edge built to cleave through heavy infantry lines.
 */
export const hafted09BattleWeapon: WeaponDefinition = buildCustomizableWeapon({
  id: 'hafted_09_battle',
  name: 'Battle Axe',
  category: 'Impact & Axes',
  archetypeNumber: '09',
  description:
    'A purpose-built broad axe perched on a long haft, designed to sever limbs and split weak shields.',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'Heavy',
  primaryDamageType: 'Impact',
  range: 32,
  shotsPerChain: 3,
  damagePerShot: 19,
  chainDuration: 1.15,
  reloadDuration: 0.7,
  canBlock: true,
  spriteStripBase64: HAND_AXE_STRIP,
  actions: [
    { slot: 1, name: 'Dane-Axe Cleave', description: 'Long-reach two-handed axe swing with terrifying edge velocity.', damageMultiplier: 1.0, rangeMultiplier: 1.0, cooldown: 0, energyCost: 0 },
    { slot: 2, name: 'Horned Tip Thrust', description: 'Jab the upturned upper horn of the axe head into visor slits.', damageMultiplier: 1.5, rangeMultiplier: 1.15, cooldown: 5.0, energyCost: 15 },
    { slot: 3, name: 'Shield-Wall Rifter', description: 'Hook the lower beard over an enemy shield and chop into the frame behind it.', damageMultiplier: 1.95, rangeMultiplier: 1.2, cooldown: 8.5, energyCost: 22 },
    { slot: 4, name: 'Long-Haft Brace', description: 'Slide hands wide along the five-foot ash shaft to parry heavy blows.', damageMultiplier: 0.5, rangeMultiplier: 0.5, cooldown: 0.7, energyCost: 6 },
    { slot: 5, name: 'Huscarl’s Timber-Fall', description: 'Full-step overhead cleave that splits armor and sends targets sprawling.', damageMultiplier: 2.45, rangeMultiplier: 1.3, cooldown: 13.0, energyCost: 29 },
  ],
});
