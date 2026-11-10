/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionEffectStyle,
  MeleeComboStepSpec,
  WeaponCategory,
  WeaponWeightClass,
} from '../../../types';

/**
 * Canonical Base Combat Unit (`1× BCU = 54`) reference constant used to normalize
 * weapon chains, bow draws, and tactical skill payloads across all 101 weapons.
 */
export const WEAPON_BCU_REFERENCE = 54;

/**
 * Ranged Basic Attack (`Slot 0`) functional shot profile describing projectile count,
 * fan spread, velocity scale, parabolic arc (`vz`), and visual trail style.
 */
export interface RangedBasicShotProfile {
  /** Number of sub-projectiles fired per basic shot (`1` for precision bolts/beams, `2–3` for scatter/cluster) */
  projectilesPerShot: number;
  /** Angular spread in radians between sub-projectiles (`0` for single shot) */
  spreadAngleRad: number;
  /** Per-sub-projectile damage multiplier so multi-pellet shots preserve the BCU per-shot budget */
  perProjectileDamageMult: number;
  /** Projectile velocity multiplier relative to the baseline `128 px/s` */
  speedMult: number;
  /** Projectile lifetime multiplier */
  lifeMult: number;
  /** Projectile collision & visual radius */
  projectileRadius: number;
  /** Optional initial vertical velocity (`vz`) for parabolic mortar/bolide/plumbata lobs */
  lobVz?: number;
  /** Optional AoE detonation radius on impact (`px`) for Blast/Meteoric/Nova/Rack shells */
  impactAoERadius?: number;
  /** Canvas trail effect style emitted at the muzzle on shot release */
  muzzleStyle: ActionEffectStyle;
  /** Muzzle arc span in radians */
  muzzleArcSpan: number;
  /** Muzzle effect radius in pixels */
  muzzleRadius: number;
}

/**
 * Resolves the functional-type-specific Ranged Basic Attack (`Slot 0`) shot profile
 * for any Bow, Caster, or Carrier & Munition weapon so its basic attack matches its authored description.
 * Does not mutate `state: OrionState`.
 */
export function resolveRangedBasicShotProfile(
  weaponId: string,
  category: WeaponCategory,
  functionalType: string,
  weightClass: WeaponWeightClass
): RangedBasicShotProfile {
  const ft = functionalType.toLowerCase();
  const idLower = weaponId.toLowerCase();

  // 1. BOWS: Single-shot hold-to-charge precision arrows with functional-type velocity & radius tuning
  if (category === 'Bows') {
    if (ft === 'great bow' || idLower.includes('great')) {
      return {
        projectilesPerShot: 1,
        spreadAngleRad: 0,
        perProjectileDamageMult: 1.0,
        speedMult: 1.18,
        lifeMult: 1.18,
        projectileRadius: 4.4,
        muzzleStyle: 'thrust',
        muzzleArcSpan: Math.PI * 0.28,
        muzzleRadius: 18,
      };
    }
    if (ft === 'long bow' || ft === 'compound' || ft === 'composite') {
      return {
        projectilesPerShot: 1,
        spreadAngleRad: 0,
        perProjectileDamageMult: 1.0,
        speedMult: 1.12,
        lifeMult: 1.1,
        projectileRadius: 3.8,
        muzzleStyle: 'volley',
        muzzleArcSpan: Math.PI * 0.36,
        muzzleRadius: 16,
      };
    }
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: weightClass === 'light' ? 1.08 : 1.04,
      lifeMult: 1.0,
      projectileRadius: 3.5,
      muzzleStyle: 'volley',
      muzzleArcSpan: Math.PI * 0.42,
      muzzleRadius: 14,
    };
  }

  // 2. CASTERS (01–09) & MAGITECH CASTERS
  if (category === 'Casters') {
    // 02. Beam Caster / 09. Stellar Caster: High-velocity collimated lance
    if (ft === 'beam caster' || ft === 'stellar caster' || idLower.includes('laser') || idLower.includes('prism')) {
      return {
        projectilesPerShot: 1,
        spreadAngleRad: 0,
        perProjectileDamageMult: 1.0,
        speedMult: ft === 'stellar caster' ? 1.32 : 1.24,
        lifeMult: 1.15,
        projectileRadius: ft === 'stellar caster' ? 4.5 : 3.6,
        muzzleStyle: 'thrust',
        muzzleArcSpan: Math.PI * 0.22,
        muzzleRadius: 18,
      };
    }
    // 03. Arc Caster: Twin forked lightning tines
    if (ft === 'arc caster') {
      return {
        projectilesPerShot: 2,
        spreadAngleRad: 0.14,
        perProjectileDamageMult: 0.54,
        speedMult: 1.14,
        lifeMult: 0.92,
        projectileRadius: 3.2,
        muzzleStyle: 'claw_bite',
        muzzleArcSpan: Math.PI * 0.48,
        muzzleRadius: 14,
      };
    }
    // 05. Wave Caster: Wide horizontal wave crest (3-node closely coupled wave)
    if (ft === 'wave caster') {
      return {
        projectilesPerShot: 3,
        spreadAngleRad: 0.16,
        perProjectileDamageMult: 0.38,
        speedMult: 0.98,
        lifeMult: 0.95,
        projectileRadius: 3.8,
        muzzleStyle: 'slash',
        muzzleArcSpan: Math.PI * 0.72,
        muzzleRadius: 16,
      };
    }
    // 06. Blast Caster / 07. Nova Caster / 08. Meteoric Caster: Explosive / Lobbed AoE shells
    if (ft === 'blast caster' || ft === 'nova caster' || ft === 'meteoric caster') {
      return {
        projectilesPerShot: 1,
        spreadAngleRad: 0,
        perProjectileDamageMult: 1.0,
        speedMult: ft === 'nova caster' ? 0.88 : 0.94,
        lifeMult: ft === 'meteoric caster' ? 1.15 : 0.95,
        projectileRadius: 4.6,
        lobVz: ft === 'meteoric caster' ? 22 : 10,
        impactAoERadius: ft === 'nova caster' ? 28 : 24,
        muzzleStyle: 'shockwave',
        muzzleArcSpan: Math.PI * 0.65,
        muzzleRadius: 16,
      };
    }
    // 01. Bolt Caster & 04. Pulse Caster (Default Caster)
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: ft === 'bolt caster' ? 1.12 : 1.02,
      lifeMult: 1.0,
      projectileRadius: ft === 'pulse caster' ? 3.8 : 3.2,
      muzzleStyle: 'volley',
      muzzleArcSpan: Math.PI * 0.35,
      muzzleRadius: 13,
    };
  }

  // 3. CARRIERS & MUNITIONS (01–09) & MAGITECH LAUNCHERS / DECK SWEEPERS
  if (
    ft === 'sheaf' ||
    idLower.includes('scatter') ||
    idLower.includes('sweeper') ||
    idLower.includes('blunder')
  ) {
    return {
      projectilesPerShot: 3,
      spreadAngleRad: 0.22,
      perProjectileDamageMult: 0.38,
      speedMult: 0.96,
      lifeMult: 0.82,
      projectileRadius: 3.0,
      muzzleStyle: 'volley',
      muzzleArcSpan: Math.PI * 0.62,
      muzzleRadius: 15,
    };
  }
  if (
    ft === 'rack' ||
    ft === 'pangao' ||
    ft === 'plumbata' ||
    idLower.includes('mortar') ||
    idLower.includes('howitzer') ||
    idLower.includes('grenade')
  ) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 0.92,
      lifeMult: 1.08,
      projectileRadius: 4.4,
      lobVz: 18,
      impactAoERadius: ft === 'plumbata' ? 18 : 24,
      muzzleStyle: 'slam',
      muzzleArcSpan: Math.PI * 0.55,
      muzzleRadius: 15,
    };
  }

  return {
    projectilesPerShot: 1,
    spreadAngleRad: 0,
    perProjectileDamageMult: 1.0,
    speedMult: 1.05,
    lifeMult: 1.0,
    projectileRadius: 3.2,
    muzzleStyle: 'volley',
    muzzleArcSpan: Math.PI * 0.35,
    muzzleRadius: 12,
  };
}

/**
 * Normalizes a combo step array so the average `damageMult` across the sequence equals `1.00`,
 * ensuring that `shotsPerChain * damagePerShot` exactly equals the weapon's BCU chain budget.
 */
function normalizeComboStepDamageMultipliers(steps: MeleeComboStepSpec[]): MeleeComboStepSpec[] {
  if (steps.length === 0) return steps;
  const avg = steps.reduce((acc, s) => acc + s.damageMult, 0) / steps.length;
  if (avg <= 0) return steps;
  return steps.map((s, idx) => ({
    ...s,
    stepIndex: idx,
    damageMult: Number((s.damageMult / avg).toFixed(2)),
  }));
}

/**
 * Generates a functional-type-specific, reload-free melee/shield combo sequence (`2–5` steps)
 * for all 72 Customizable functional weapon types and 29 Magitech weapons, matching each weapon's
 * authored Action 1 description and deliberate tempo (`Light = 0.35s`, `Medium = 0.45s`, `Heavy = 0.59s`).
 */
export function buildWeaponUniqueComboSequence(
  weaponId: string,
  category: WeaponCategory,
  functionalType: string,
  _weightClass: WeaponWeightClass,
  baseRange: number,
  stepBaseSec: number,
  minFloorSec: number,
  maxCapSec: number
): MeleeComboStepSpec[] {
  const r = Math.max(20, baseRange || 26);
  const makeTimings = (paceMult: number = 1.0, tellRatio: number = 0.35) => {
    const total = Math.max(minFloorSec, Math.min(maxCapSec, stepBaseSec * paceMult));
    const tellDurationSec = Number((total * tellRatio).toFixed(2));
    const actionDurationSec = Number((total - tellDurationSec).toFixed(2));
    return { tellDurationSec, actionDurationSec };
  };

  const ft = functionalType.toLowerCase();
  const idLower = weaponId.toLowerCase();

  // ==========================================================================
  // CATEGORY 1: SHIELDS (01–09)
  // ==========================================================================
  if (category === 'Shields') {
    // 01. Buckler: Fast 3-step fist-boss jab -> binding rim hook -> knuckle counter-bash
    if (ft === 'buckler') {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: 'Fist-Boss Jab',
          style: 'thrust',
          arcSpan: Math.PI * 0.32,
          radius: r,
          length: r + 3,
          width: 11,
          damageMult: 0.88,
          ...makeTimings(0.88, 0.32),
          flipDir: false,
          knockbackScale: 0.85,
        },
        {
          stepIndex: 1,
          label: 'Binding Rim Hook',
          style: 'slash',
          arcSpan: Math.PI * 0.62,
          radius: r + 1,
          width: 13,
          damageMult: 0.98,
          ...makeTimings(0.94),
          flipDir: true,
          knockbackScale: 0.95,
        },
        {
          stepIndex: 2,
          label: 'Knuckle-Boss Counter Bash',
          style: 'bash',
          arcSpan: Math.PI * 0.7,
          radius: r + 3,
          width: 16,
          damageMult: 1.14,
          ...makeTimings(1.06),
          flipDir: false,
          extraArmorDent: 3,
          knockbackScale: 1.25,
        },
      ]);
    }

    // 03. Tower & 05. Scutum: Heavy 2-to-3 step hydraulic wall press -> spiked drop / legion punch
    if (ft === 'tower' || ft === 'scutum') {
      const isTower = ft === 'tower';
      if (isTower) {
        return normalizeComboStepDamageMultipliers([
          {
            stepIndex: 0,
            label: 'Hydraulic Wall Press',
            style: 'bash',
            arcSpan: Math.PI * 0.72,
            radius: r,
            width: 20,
            damageMult: 0.9,
            ...makeTimings(1.05, 0.38),
            flipDir: false,
            extraArmorDent: 3,
            knockbackScale: 1.25,
          },
          {
            stepIndex: 1,
            label: 'Bulkhead Fortress Crush',
            style: 'slam',
            arcSpan: Math.PI * 0.88,
            radius: r + 4,
            length: 16,
            width: 22,
            damageMult: 1.1,
            ...makeTimings(1.2, 0.4),
            flipDir: false,
            extraArmorDent: 5,
            knockbackScale: 1.5,
          },
        ]);
      }
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: 'Curved Boss Punch',
          style: 'bash',
          arcSpan: Math.PI * 0.64,
          radius: r,
          width: 18,
          damageMult: 0.88,
          ...makeTimings(0.98),
          flipDir: false,
          knockbackScale: 1.1,
        },
        {
          stepIndex: 1,
          label: 'Legion Rim Check',
          style: 'bash',
          arcSpan: Math.PI * 0.74,
          radius: r + 2,
          width: 19,
          damageMult: 1.0,
          ...makeTimings(1.04),
          flipDir: true,
          knockbackScale: 1.2,
        },
        {
          stepIndex: 2,
          label: 'Testudo Wall Slam',
          style: 'slam',
          arcSpan: Math.PI * 0.84,
          radius: r + 4,
          length: 15,
          width: 21,
          damageMult: 1.12,
          ...makeTimings(1.16),
          flipDir: false,
          extraArmorDent: 4,
          knockbackScale: 1.4,
        },
      ]);
    }

    // 06. Disc, 07. Rhom, 08. Corona, 09. Mote: Agile / Energy Rim Slash -> Gyro Spin -> Pulse Slam
    if (ft === 'disc' || ft === 'rhom' || ft === 'corona' || ft === 'mote') {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: ft === 'rhom' ? 'Diamond Point Check' : 'Sharpened Rim Slice',
          style: ft === 'rhom' ? 'thrust' : 'slash',
          arcSpan: ft === 'rhom' ? Math.PI * 0.34 : Math.PI * 0.68,
          radius: r,
          length: ft === 'rhom' ? r + 4 : undefined,
          width: 13,
          damageMult: 0.88,
          ...makeTimings(0.92),
          flipDir: false,
        },
        {
          stepIndex: 1,
          label: ft === 'corona' ? 'Solar Halo Sweep' : 'Rotary Edge Backslash',
          style: 'slash',
          arcSpan: Math.PI * 0.78,
          radius: r + 2,
          width: 15,
          damageMult: 1.0,
          ...makeTimings(0.98),
          flipDir: true,
        },
        {
          stepIndex: 2,
          label: ft === 'mote' ? 'Hard-Light Projection Burst' : 'Gyro Rim Discharge',
          style: 'shockwave',
          arcSpan: Math.PI * 0.92,
          radius: r + 4,
          width: 18,
          damageMult: 1.12,
          ...makeTimings(1.1),
          flipDir: false,
          extraArmorDent: 3,
          knockbackScale: 1.2,
        },
      ]);
    }

    // 02. Heater, 04. Norman, and Magitech Shields
    return normalizeComboStepDamageMultipliers([
      {
        stepIndex: 0,
        label: ft === 'norman' ? 'Kite Rim Sweep' : 'Angled Plate Bash',
        style: 'bash',
        arcSpan: Math.PI * 0.6,
        radius: r,
        width: 15,
        damageMult: 0.88,
        ...makeTimings(0.95),
        flipDir: false,
        knockbackScale: 0.9,
      },
      {
        stepIndex: 1,
        label: ft === 'norman' ? 'Tapered Tail Pin' : 'Lower Wedge Thrust',
        style: 'thrust',
        arcSpan: Math.PI * 0.34,
        radius: r + 3,
        length: r + 4,
        width: 13,
        damageMult: 1.0,
        ...makeTimings(1.0),
        flipDir: true,
        knockbackScale: 1.05,
      },
      {
        stepIndex: 2,
        label: 'Vanguard Bulwark Slam',
        style: 'slam',
        arcSpan: Math.PI * 0.82,
        radius: r + 4,
        length: 14,
        width: 19,
        damageMult: 1.12,
        ...makeTimings(1.14),
        flipDir: false,
        extraArmorDent: 4,
        knockbackScale: 1.35,
      },
    ]);
  }

  // ==========================================================================
  // CATEGORY 4: SPEARS (01–09)
  // ==========================================================================
  if (category === 'Spears') {
    // 01. Short Spear & 03. Javelin: Rapid 4-to-5 step skirmish stabs + butt-spike sweep
    if (ft === 'short spear' || ft === 'javelin') {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: ft === 'javelin' ? 'Darting Point Jab' : 'Skirmish Lead Thrust',
          style: 'thrust',
          arcSpan: Math.PI * 0.2,
          radius: r,
          length: r + 2,
          width: 9,
          damageMult: 0.86,
          ...makeTimings(0.88, 0.3),
        },
        {
          stepIndex: 1,
          label: 'High-Seam Double Stab',
          style: 'thrust',
          arcSpan: Math.PI * 0.22,
          radius: r + 2,
          length: r + 4,
          width: 10,
          damageMult: 0.96,
          ...makeTimings(0.92, 0.32),
          flipDir: true,
        },
        {
          stepIndex: 2,
          label: 'Ferrule Butt-Spike Sweep',
          style: 'slash',
          arcSpan: Math.PI * 0.72,
          radius: Math.round(r * 0.86),
          width: 13,
          damageMult: 1.04,
          ...makeTimings(0.98),
        },
        {
          stepIndex: 3,
          label: ft === 'javelin' ? 'Ballistic Lunging Skewer' : 'Outrider Deep Impale',
          style: 'thrust',
          arcSpan: Math.PI * 0.26,
          radius: r + 6,
          length: r + 8,
          width: 12,
          damageMult: 1.14,
          ...makeTimings(1.1),
          extraArmorDent: 3,
          knockbackScale: 1.15,
        },
      ]);
    }

    // 02. Winged Spear, 04. Spetum, 05. Broad Spear, 06. Partisan: Thrust -> Lug/Crescent Hook -> Wide Pole Cleave -> Impale
    if (
      ft === 'winged spear' ||
      ft === 'spetum' ||
      ft === 'broad spear' ||
      ft === 'partisan'
    ) {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: ft === 'spetum' ? 'Trident-Point Probe' : 'Leaf-Head Thrust',
          style: 'thrust',
          arcSpan: Math.PI * 0.24,
          radius: r,
          length: r + 3,
          width: 11,
          damageMult: 0.88,
          ...makeTimings(0.94),
        },
        {
          stepIndex: 1,
          label: ft === 'winged spear' ? 'Cross-Lug Hook Slash' : 'Crescent Flank Sweep',
          style: 'chop',
          arcSpan: Math.PI * 0.74,
          radius: Math.round(r * 0.92),
          width: 14,
          damageMult: 0.98,
          ...makeTimings(0.98),
          flipDir: true,
        },
        {
          stepIndex: 2,
          label: ft === 'broad spear' ? 'Wide Leaf-Blade Cleave' : 'Figure-Eight Polearm Arc',
          style: 'slash',
          arcSpan: Math.PI * 0.88,
          radius: r + 1,
          width: 15,
          damageMult: 1.04,
          ...makeTimings(1.04),
          flipDir: false,
        },
        {
          stepIndex: 3,
          label: 'Two-Handed Breaching Skewer',
          style: 'thrust',
          arcSpan: Math.PI * 0.28,
          radius: r + 6,
          length: r + 9,
          width: 13,
          damageMult: 1.1,
          ...makeTimings(1.14),
          extraArmorDent: 4,
          knockbackScale: 1.25,
        },
      ]);
    }

    // 07. Boar Spear, 08. Pike, 09. Lance (and Magitech Lances): Long-reach heavy thrusting choreography
    return normalizeComboStepDamageMultipliers([
      {
        stepIndex: 0,
        label: ft === 'pike' ? 'SARISSA Long-Reach Poke' : 'Couched Point Thrust',
        style: 'thrust',
        arcSpan: Math.PI * 0.2,
        radius: r,
        length: r + 5,
        width: 11,
        damageMult: 0.9,
        ...makeTimings(0.96, 0.36),
      },
      {
        stepIndex: 1,
        label: ft === 'boar spear' ? 'Cross-Guard Stop-Thrust' : 'Heavy Shaft Sweep',
        style: ft === 'boar spear' ? 'thrust' : 'slash',
        arcSpan: ft === 'boar spear' ? Math.PI * 0.26 : Math.PI * 0.66,
        radius: ft === 'boar spear' ? r + 3 : Math.round(r * 0.84),
        length: ft === 'boar spear' ? r + 6 : undefined,
        width: 14,
        damageMult: 0.98,
        ...makeTimings(1.02),
        flipDir: true,
      },
      {
        stepIndex: 2,
        label: ft === 'lance' ? 'Full-Tilt Cavalry Drive' : 'Phalanx Breaching Impale',
        style: 'thrust',
        arcSpan: Math.PI * 0.28,
        radius: r + 8,
        length: r + 11,
        width: 15,
        damageMult: 1.12,
        ...makeTimings(1.18, 0.38),
        extraArmorDent: 5,
        knockbackScale: 1.35,
      },
    ]);
  }

  // ==========================================================================
  // CATEGORY 5: IMPACT & AXES (01–09)
  // ==========================================================================
  if (category === 'Impact & Axes') {
    // 01. Cudgel & 06. Tomahawk: Agile Light 4-step rapid clubbing / bearded hatchet chops
    if (ft === 'cudgel' || ft === 'tomahawk') {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: ft === 'tomahawk' ? 'Hatchet Forehand Hack' : 'Weighted Knot-Club Snap',
          style: 'chop',
          arcSpan: Math.PI * 0.56,
          radius: r,
          width: 13,
          damageMult: 0.88,
          ...makeTimings(0.9, 0.32),
          flipDir: false,
        },
        {
          stepIndex: 1,
          label: ft === 'tomahawk' ? 'Bearded Hook Pull-Cut' : 'Backhand Knee-Breaker',
          style: 'chop',
          arcSpan: Math.PI * 0.62,
          radius: r + 1,
          width: 14,
          damageMult: 0.96,
          ...makeTimings(0.94),
          flipDir: true,
          extraArmorDent: 2,
        },
        {
          stepIndex: 2,
          label: 'Rapid Cross-Body Hew',
          style: 'slash',
          arcSpan: Math.PI * 0.72,
          radius: r + 2,
          width: 14,
          damageMult: 1.04,
          ...makeTimings(0.98),
          flipDir: false,
        },
        {
          stepIndex: 3,
          label: ft === 'tomahawk' ? 'Skull-Splitter Drop' : 'Concussive Crown Bash',
          style: 'slam',
          arcSpan: Math.PI * 0.68,
          radius: r + 3,
          length: 14,
          width: 17,
          damageMult: 1.12,
          ...makeTimings(1.08),
          extraArmorDent: 4,
          knockbackScale: 1.2,
        },
      ]);
    }

    // 02. Mace, 03. Hammer, 04. Spike (Bec-de-Corbin): Armor-denting blunt + beak-puncture combos
    if (ft === 'mace' || ft === 'hammer' || ft === 'spike') {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: ft === 'spike' ? 'Crow’s-Beak Puncture' : 'Flanged Rib-Cracker',
          style: ft === 'spike' ? 'thrust' : 'chop',
          arcSpan: ft === 'spike' ? Math.PI * 0.34 : Math.PI * 0.58,
          radius: r,
          length: ft === 'spike' ? r + 4 : undefined,
          width: 14,
          damageMult: 0.9,
          ...makeTimings(0.96),
          flipDir: false,
          extraArmorDent: 3,
        },
        {
          stepIndex: 1,
          label: ft === 'hammer' ? 'Back-Spike Pry Strike' : 'Rising Pommel Uppercut',
          style: 'chop',
          arcSpan: Math.PI * 0.64,
          radius: r + 1,
          width: 15,
          damageMult: 1.0,
          ...makeTimings(1.02),
          flipDir: true,
          extraArmorDent: 4,
        },
        {
          stepIndex: 2,
          label: 'Plate-Caving Overhead Slam',
          style: 'slam',
          arcSpan: Math.PI * 0.76,
          radius: r + 4,
          length: 15,
          width: 20,
          damageMult: 1.1,
          ...makeTimings(1.16),
          extraArmorDent: 6,
          knockbackScale: 1.35,
        },
      ]);
    }

    // 07. Parashu & 09. Battle Axe: Medium crescent axe cleaves
    if (ft === 'parashu' || ft === 'battle axe') {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: 'Crescent Edge Chop',
          style: 'chop',
          arcSpan: Math.PI * 0.62,
          radius: r,
          width: 15,
          damageMult: 0.88,
          ...makeTimings(0.95),
          flipDir: false,
        },
        {
          stepIndex: 1,
          label: 'Bearded Shield-Hook Slash',
          style: 'chop',
          arcSpan: Math.PI * 0.68,
          radius: r + 1,
          width: 15,
          damageMult: 0.98,
          ...makeTimings(1.0),
          flipDir: true,
          extraArmorDent: 2,
        },
        {
          stepIndex: 2,
          label: 'Whirling Broad-Bit Sweep',
          style: 'whirlwind',
          arcSpan: Math.PI * 0.95,
          radius: r + 2,
          width: 16,
          damageMult: 1.04,
          ...makeTimings(1.05),
          flipDir: false,
        },
        {
          stepIndex: 3,
          label: 'Executioner Timber-Split',
          style: 'slam',
          arcSpan: Math.PI * 0.74,
          radius: r + 4,
          length: 16,
          width: 19,
          damageMult: 1.1,
          ...makeTimings(1.16),
          extraArmorDent: 5,
          knockbackScale: 1.3,
        },
      ]);
    }

    // 05. Mallet & 08. Labrys (Heavy 2H Greataxe / Great-Maul): 3-step high-impact seismic cleaves
    return normalizeComboStepDamageMultipliers([
      {
        stepIndex: 0,
        label: ft === 'labrys' ? 'Twin-Bit Forehand Cleave' : 'Great-Head Lateral Swing',
        style: 'chop',
        arcSpan: Math.PI * 0.76,
        radius: r,
        width: 17,
        damageMult: 0.9,
        ...makeTimings(1.0, 0.38),
        flipDir: false,
        extraArmorDent: 3,
      },
      {
        stepIndex: 1,
        label: ft === 'labrys' ? 'Reverse-Bit Whirlwind' : 'Crushing Backswing',
        style: ft === 'labrys' ? 'whirlwind' : 'chop',
        arcSpan: ft === 'labrys' ? Math.PI * 1.05 : Math.PI * 0.82,
        radius: r + 2,
        width: 18,
        damageMult: 0.98,
        ...makeTimings(1.06, 0.38),
        flipDir: true,
        extraArmorDent: 4,
      },
      {
        stepIndex: 2,
        label: ft === 'labrys' ? 'Labyrinth Earth-Splitter' : 'Seismic Pile-Driver Slam',
        style: 'slam',
        arcSpan: Math.PI * 0.88,
        radius: r + 5,
        length: 18,
        width: 24,
        damageMult: 1.12,
        ...makeTimings(1.2, 0.4),
        extraArmorDent: 7,
        knockbackScale: 1.45,
      },
    ]);
  }

  // ==========================================================================
  // CATEGORY 6: BLADES: CURVED (01–09)
  // ==========================================================================
  if (category === 'Blades: Curved') {
    // 01. Wakizashi: Blistering 5-step short-arc companion cuts
    if (ft === 'wakizashi') {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: 'Companion Snap-Draw',
          style: 'slash',
          arcSpan: Math.PI * 0.56,
          radius: r,
          width: 11,
          damageMult: 0.86,
          ...makeTimings(0.86, 0.3),
          flipDir: false,
        },
        {
          stepIndex: 1,
          label: 'Reverse-Grip Throat Cut',
          style: 'slash',
          arcSpan: Math.PI * 0.6,
          radius: r,
          width: 11,
          damageMult: 0.94,
          ...makeTimings(0.88, 0.3),
          flipDir: true,
        },
        {
          stepIndex: 2,
          label: 'Close-Corridor Diagonal Slice',
          style: 'slash',
          arcSpan: Math.PI * 0.64,
          radius: r + 1,
          width: 12,
          damageMult: 1.0,
          ...makeTimings(0.92),
          flipDir: false,
        },
        {
          stepIndex: 3,
          label: 'Spinning Tsuba Lacerate',
          style: 'whirlwind',
          arcSpan: Math.PI * 0.96,
          radius: r + 2,
          width: 12,
          damageMult: 1.06,
          ...makeTimings(0.96),
          flipDir: true,
        },
        {
          stepIndex: 4,
          label: 'Twin-Fang Conduit Sever',
          style: 'thrust',
          arcSpan: Math.PI * 0.28,
          radius: r + 4,
          length: r + 6,
          width: 11,
          damageMult: 1.14,
          ...makeTimings(1.05),
          extraArmorDent: 2,
        },
      ]);
    }

    // 03. Khopesh & 04. Shotel: Hooked sickle-sword around-guard slashes & shield wrenches
    if (ft === 'khopesh' || ft === 'shotel') {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label: ft === 'shotel' ? 'Around-Guard Reach Slash' : 'Outer-Arc Sickle Chop',
          style: 'chop',
          arcSpan: Math.PI * 0.68,
          radius: r,
          width: 13,
          damageMult: 0.88,
          ...makeTimings(0.92),
          flipDir: false,
        },
        {
          stepIndex: 1,
          label: ft === 'shotel' ? 'Inverted Kidney-Hook Stab' : 'Inner-Curve Shield Snag',
          style: ft === 'shotel' ? 'thrust' : 'chop',
          arcSpan: ft === 'shotel' ? Math.PI * 0.32 : Math.PI * 0.72,
          radius: r + 2,
          length: ft === 'shotel' ? r + 5 : undefined,
          width: 13,
          damageMult: 0.98,
          ...makeTimings(0.96),
          flipDir: true,
          extraArmorDent: 2,
        },
        {
          stepIndex: 2,
          label: 'Reaping Tendon Hook',
          style: 'slash',
          arcSpan: Math.PI * 0.84,
          radius: r + 2,
          width: 14,
          damageMult: 1.04,
          ...makeTimings(1.02),
          flipDir: false,
        },
        {
          stepIndex: 3,
          label: ft === 'shotel' ? 'Over-Shield Eclipse Impale' : 'Pharaoh’s Decapitating Hew',
          style: 'chop',
          arcSpan: Math.PI * 0.88,
          radius: r + 4,
          width: 16,
          damageMult: 1.1,
          ...makeTimings(1.12),
          flipDir: true,
          extraArmorDent: 4,
          knockbackScale: 1.2,
        },
      ]);
    }

    // 05. Odachi, 07. Falx, 09. Dadao: Heavy 2H sweeping / forward-curving cleavers (3 steps)
    if (ft === 'odachi' || ft === 'falx' || ft === 'dadao') {
      return normalizeComboStepDamageMultipliers([
        {
          stepIndex: 0,
          label:
            ft === 'falx'
              ? 'Inward Scythe Hook-Chop'
              : ft === 'dadao'
                ? 'Heavy Ring-Pommel Cleave'
                : 'Great-Field Horizontal Sweep',
          style: ft === 'odachi' ? 'slash' : 'chop',
          arcSpan: ft === 'odachi' ? Math.PI * 0.96 : Math.PI * 0.78,
          radius: r,
          width: 17,
          damageMult: 0.9,
          ...makeTimings(1.0, 0.38),
          flipDir: false,
          extraArmorDent: 3,
        },
        {
          stepIndex: 1,
          label:
            ft === 'falx'
              ? 'Dacian Shield-Ripping Drag'
              : ft === 'dadao'
                ? 'Rising Broad-Tip Uppercut'
                : 'Returning Cavalry-Feller Arc',
          style: 'slash',
          arcSpan: ft === 'odachi' ? Math.PI * 1.04 : Math.PI * 0.84,
          radius: r + 2,
          width: 18,
          damageMult: 0.98,
          ...makeTimings(1.06, 0.38),
          flipDir: true,
          extraArmorDent: 3,
        },
        {
          stepIndex: 2,
          label:
            ft === 'falx'
              ? 'Helm-Splitting Reaper Drop'
              : ft === 'dadao'
                ? 'Vanguard Guillotine Smash'
                : 'Heaven-to-Earth Horizon Split',
          style: ft === 'odachi' ? 'whirlwind' : 'slam',
          arcSpan: ft === 'odachi' ? Math.PI * 1.25 : Math.PI * 0.88,
          radius: r + 4,
          length: ft === 'odachi' ? undefined : 17,
          width: 21,
          damageMult: 1.12,
          ...makeTimings(1.18, 0.4),
          flipDir: false,
          extraArmorDent: 5,
          knockbackScale: 1.35,
        },
      ]);
    }

    // 02. Katana, 06. Kilij, 08. Dao (and Magitech Curved Blades): Fluid 4-step sabre / katana forms
    return normalizeComboStepDamageMultipliers([
      {
        stepIndex: 0,
        label: ft === 'kilij' ? 'Yelman Whip-Cut' : ft === 'dao' ? 'Ox-Tail Sweeping Cut' : 'Kesa-Giri Diagonal Draw',
        style: 'slash',
        arcSpan: Math.PI * 0.68,
        radius: r,
        width: 13,
        damageMult: 0.88,
        ...makeTimings(0.92),
        flipDir: false,
      },
      {
        stepIndex: 1,
        label: ft === 'kilij' ? 'False-Edge Yelman Backslash' : 'Rising Swallow Cut',
        style: 'slash',
        arcSpan: Math.PI * 0.74,
        radius: r + 1,
        width: 13,
        damageMult: 0.98,
        ...makeTimings(0.96),
        flipDir: true,
      },
      {
        stepIndex: 2,
        label: ft === 'dao' ? 'Spinning Broadsword Tempest' : 'Whirling Crescent Draw',
        style: 'whirlwind',
        arcSpan: Math.PI * 1.08,
        radius: r + 2,
        width: 14,
        damageMult: 1.04,
        ...makeTimings(1.04),
        flipDir: false,
      },
      {
        stepIndex: 3,
        label: 'Moonlight Severing Finisher',
        style: 'chop',
        arcSpan: Math.PI * 0.88,
        radius: r + 4,
        width: 16,
        damageMult: 1.1,
        ...makeTimings(1.12),
        flipDir: true,
        extraArmorDent: 3,
        knockbackScale: 1.2,
      },
    ]);
  }

  // ==========================================================================
  // CATEGORY 7: BLADES: STRAIGHT (01–09) & DEFAULT MELEE
  // ==========================================================================
  // 01. Cinquedea (and Rogue Short-Blades): 5-step close-range broad-base thrusts & lacerations
  if (
    ft === 'cinquedea' ||
    idLower.includes('whisper') ||
    idLower.includes('phantom') ||
    idLower.includes('dagger')
  ) {
    return normalizeComboStepDamageMultipliers([
      {
        stepIndex: 0,
        label: 'Five-Finger Seam Slice',
        style: 'slash',
        arcSpan: Math.PI * 0.54,
        radius: r,
        width: 10,
        damageMult: 0.86,
        ...makeTimings(0.86, 0.3),
        flipDir: false,
      },
      {
        stepIndex: 1,
        label: 'Backhand Arterial Cut',
        style: 'slash',
        arcSpan: Math.PI * 0.58,
        radius: r,
        width: 10,
        damageMult: 0.94,
        ...makeTimings(0.9, 0.3),
        flipDir: true,
      },
      {
        stepIndex: 2,
        label: 'Tapered Point Joint Puncture',
        style: 'thrust',
        arcSpan: Math.PI * 0.22,
        radius: r + 4,
        length: r + 6,
        width: 9,
        damageMult: 1.0,
        ...makeTimings(0.94),
      },
      {
        stepIndex: 3,
        label: 'Spinning Fullered Flurry',
        style: 'whirlwind',
        arcSpan: Math.PI * 0.98,
        radius: r + 2,
        width: 12,
        damageMult: 1.06,
        ...makeTimings(0.98),
        flipDir: true,
      },
      {
        stepIndex: 4,
        label: 'Mercy-Stroke Vital Impale',
        style: 'thrust',
        arcSpan: Math.PI * 0.26,
        radius: r + 6,
        length: r + 8,
        width: 11,
        damageMult: 1.14,
        ...makeTimings(1.08),
        extraArmorDent: 3,
      },
    ]);
  }

  // 03. Falchion & 06. Messer: Single-edged cleaver-sword hack -> nagel-guard hook -> heavy chop
  if (ft === 'falchion' || ft === 'messer') {
    return normalizeComboStepDamageMultipliers([
      {
        stepIndex: 0,
        label: ft === 'falchion' ? 'Cusped Tip Cleaver Hack' : 'Kriegsmesser Forehand Cut',
        style: 'chop',
        arcSpan: Math.PI * 0.64,
        radius: r,
        width: 14,
        damageMult: 0.88,
        ...makeTimings(0.94),
        flipDir: false,
      },
      {
        stepIndex: 1,
        label: ft === 'messer' ? 'Nagel Side-Lug Wrench' : 'Heavy Belly Back-Cleave',
        style: 'chop',
        arcSpan: Math.PI * 0.7,
        radius: r + 1,
        width: 15,
        damageMult: 0.98,
        ...makeTimings(0.98),
        flipDir: true,
        extraArmorDent: 2,
      },
      {
        stepIndex: 2,
        label: 'Clip-Point Estoc Drive',
        style: 'thrust',
        arcSpan: Math.PI * 0.26,
        radius: r + 4,
        length: r + 6,
        width: 12,
        damageMult: 1.04,
        ...makeTimings(1.02),
      },
      {
        stepIndex: 3,
        label: 'Butcher’s Overhead Split',
        style: 'slam',
        arcSpan: Math.PI * 0.78,
        radius: r + 3,
        length: 15,
        width: 18,
        damageMult: 1.1,
        ...makeTimings(1.14),
        extraArmorDent: 4,
        knockbackScale: 1.25,
      },
    ]);
  }

  // 07. Zweihander, 08. Flamberge, 09. Executioner Sword: Heavy 2H Greatswords (3 steps)
  if (ft === 'zweihander' || ft === 'flamberge' || ft === 'executioner sword') {
    const isExec = ft === 'executioner sword';
    const isFlam = ft === 'flamberge';
    return normalizeComboStepDamageMultipliers([
      {
        stepIndex: 0,
        label: isExec
          ? 'Square-Tipped Cleaver Sweep'
          : isFlam
            ? 'Undulated Flame-Edge Raking Cut'
            : 'Montante Corridor Sweep',
        style: isExec ? 'chop' : 'slash',
        arcSpan: Math.PI * 0.9,
        radius: r,
        width: 17,
        damageMult: 0.9,
        ...makeTimings(1.0, 0.38),
        flipDir: false,
        extraArmorDent: 3,
      },
      {
        stepIndex: 1,
        label: isExec
          ? 'Weighted Ricasso Back-Hew'
          : isFlam
            ? 'Parrying-Hook Sawing Riposte'
            : 'Zwerchhau High-Copter Arc',
        style: isExec ? 'chop' : 'whirlwind',
        arcSpan: isExec ? Math.PI * 0.86 : Math.PI * 1.1,
        radius: r + 2,
        width: 18,
        damageMult: 0.98,
        ...makeTimings(1.06, 0.38),
        flipDir: true,
        extraArmorDent: 3,
      },
      {
        stepIndex: 2,
        label: isExec
          ? 'Headsman’s Guillotine Drop'
          : isFlam
            ? 'Serrated Mordhau Impale'
            : 'Ritterbrecher Great Slam',
        style: isFlam ? 'thrust' : 'slam',
        arcSpan: isFlam ? Math.PI * 0.3 : Math.PI * 0.88,
        radius: r + 5,
        length: isFlam ? r + 9 : 18,
        width: isFlam ? 15 : 22,
        damageMult: 1.12,
        ...makeTimings(1.18, 0.4),
        flipDir: false,
        extraArmorDent: 6,
        knockbackScale: 1.4,
      },
    ]);
  }

  // 02. Spatha, 04. Arming Sword, 05. Bastard Sword (and Magitech Straight Swords): Balanced 4-step Knightly Swordsmanship
  return normalizeComboStepDamageMultipliers([
    {
      stepIndex: 0,
      label: ft === 'spatha' ? 'Legion Cavalry Slash' : 'Diagonal Zornhau Ward-Cut',
      style: 'slash',
      arcSpan: Math.PI * 0.68,
      radius: r,
      width: 13,
      damageMult: 0.88,
      ...makeTimings(0.94),
      flipDir: false,
    },
    {
      stepIndex: 1,
      label: 'Cruciform Cross-Cut',
      style: 'slash',
      arcSpan: Math.PI * 0.72,
      radius: r + 1,
      width: 13,
      damageMult: 0.98,
      ...makeTimings(0.98),
      flipDir: true,
    },
    {
      stepIndex: 2,
      label: ft === 'bastard sword' ? 'Half-Swording Armor Point' : 'Gladius Lunging Thrust',
      style: 'thrust',
      arcSpan: Math.PI * 0.24,
      radius: r + 5,
      length: r + 7,
      width: 12,
      damageMult: 1.04,
      ...makeTimings(1.02),
      extraArmorDent: 2,
    },
    {
      stepIndex: 3,
      label: 'High-Guard Pommel & Edge Cleave',
      style: 'chop',
      arcSpan: Math.PI * 0.82,
      radius: r + 4,
      width: 16,
      damageMult: 1.1,
      ...makeTimings(1.14),
      flipDir: false,
      extraArmorDent: 4,
      knockbackScale: 1.25,
    },
  ]);
}
