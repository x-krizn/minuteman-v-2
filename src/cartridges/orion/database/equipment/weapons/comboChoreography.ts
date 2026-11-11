/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionEffectStyle,
  MeleeComboStepSpec,
  ProjectileVisualShape,
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
 * visual/collision silhouette (`Bolts < Pulses < Waves`, `Beams`, `Arcs`), fan spread,
 * velocity scale, parabolic arc (`vz`), chain/pierce behavior, and muzzle trail style.
 */
export interface RangedBasicShotProfile {
  /** Number of sub-projectiles fired per basic shot (`1` for precision bolts/beams/waves, `2–3` for scatter/cluster) */
  projectilesPerShot: number;
  /** Angular spread in radians between sub-projectiles (`0` for single shot) */
  spreadAngleRad: number;
  /** Per-sub-projectile damage multiplier so multi-pellet shots preserve the BCU per-shot budget */
  perProjectileDamageMult: number;
  /** Projectile velocity multiplier relative to the baseline `128 px/s` */
  speedMult: number;
  /** Projectile lifetime multiplier */
  lifeMult: number;
  /** Projectile collision & visual radius (`Bolts ≈ 2.1–2.6 < Pulses ≈ 4.2 < Waves ≈ 6.8`) */
  projectileRadius: number;
  /** Visual & geometric archetype matching the weapon's authored description */
  visualShape: ProjectileVisualShape;
  /** Perpendicular wave crest width (`px`) for `wave` and `cord_whip` projectiles */
  waveSpanPx?: number;
  /** Collimated ray length (`px`) for coherent `beam` lances */
  beamLengthPx?: number;
  /** Secondary lightning arc jumps on hit for `arc` weapons (`Arc Caster`, `WZ-450 Sparkstrike`) */
  chainCount?: number;
  /** Search radius (`px`) for secondary `arc` jumps */
  chainRangePx?: number;
  /** Number of enemies a `beam`, `wave`, or heavy `arrow`/`javelin` can pierce through */
  pierceRemaining?: number;
  /** Soft-lock homing turn rate (`rad/s`) for guided `Battery` / `LG-950 Tomahawk` munitions */
  homingStrength?: number;
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
 * for any Bow, Caster, Carrier & Munition, or Magitech ranged weapon so its projectiles
 * visually and mechanically match its authored description (`Bolts < Pulses < Waves`,
 * collimated `Beams`, chaining `Arcs`, etc.).
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
        speedMult: 1.22,
        lifeMult: 1.18,
        projectileRadius: 4.2,
        visualShape: 'arrow',
        pierceRemaining: 1,
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
        speedMult: 1.14,
        lifeMult: 1.1,
        projectileRadius: 3.6,
        visualShape: 'arrow',
        muzzleStyle: 'volley',
        muzzleArcSpan: Math.PI * 0.36,
        muzzleRadius: 16,
      };
    }
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: weightClass === 'light' ? 1.1 : 1.05,
      lifeMult: 1.0,
      projectileRadius: 3.2,
      visualShape: 'arrow',
      muzzleStyle: 'volley',
      muzzleArcSpan: Math.PI * 0.42,
      muzzleRadius: 14,
    };
  }

  // 2. BEAM WEAPONS (Beam Caster, Stellar Caster, WZ-800 Arclight, WZ-650 Prism Lance, RS-450 Radiant, CL-700 Sanctifier, CL-500 Absolution)
  if (
    ft === 'beam caster' ||
    ft === 'stellar caster' ||
    idLower.includes('arclight') ||
    idLower.includes('prism') ||
    idLower.includes('radiant_projector') ||
    idLower.includes('sanctifier') ||
    idLower.includes('absolution') ||
    idLower.includes('beam')
  ) {
    const isHeavyBeam =
      ft === 'stellar caster' || weightClass === 'heavy' || idLower.includes('arclight');
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: isHeavyBeam ? 1.52 : 1.42,
      lifeMult: 1.15,
      projectileRadius: isHeavyBeam ? 4.4 : 3.4,
      visualShape: 'beam',
      beamLengthPx: isHeavyBeam ? 38 : 30,
      pierceRemaining: isHeavyBeam ? 2 : 1,
      muzzleStyle: 'thrust',
      muzzleArcSpan: Math.PI * 0.2,
      muzzleRadius: isHeavyBeam ? 20 : 17,
    };
  }

  // 3. ARC WEAPONS (Arc Caster, WZ-450 Sparkstrike): Crackling forked electricity that arcs between targets
  if (ft === 'arc caster' || idLower.includes('sparkstrike') || idLower.includes('arc_caster')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 1.18,
      lifeMult: 0.94,
      projectileRadius: 3.0,
      visualShape: 'arc',
      chainCount: 2,
      chainRangePx: 48,
      muzzleStyle: 'claw_bite',
      muzzleArcSpan: Math.PI * 0.48,
      muzzleRadius: 15,
    };
  }

  // 4. WAVE WEAPONS (Wave Caster, Sanctum Aether Catalyst, Restoration Field): Wide rolling horizontal wave crests (Radius 6.8 > Pulse 4.2 > Bolt 2.3)
  if (
    ft === 'wave caster' ||
    idLower.includes('wave_caster') ||
    idLower.includes('aether_catalyst') ||
    idLower.includes('restoration_field')
  ) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 0.96,
      lifeMult: 1.02,
      projectileRadius: 6.8,
      visualShape: 'wave',
      waveSpanPx: 20,
      pierceRemaining: 2,
      muzzleStyle: 'slash',
      muzzleArcSpan: Math.PI * 0.78,
      muzzleRadius: 18,
    };
  }

  // 5. PULSE WEAPONS (Pulse Caster, ARC Conductor, CL-350 Litany): Medium concentric harmonic rings (Radius 4.2: larger than Bolts 2.3, smaller than Waves 6.8)
  if (
    ft === 'pulse caster' ||
    idLower.includes('pulse_caster') ||
    idLower.includes('arc_conductor') ||
    idLower.includes('litany')
  ) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 1.04,
      lifeMult: 1.0,
      projectileRadius: 4.2,
      visualShape: 'pulse',
      muzzleStyle: 'shockwave',
      muzzleArcSpan: Math.PI * 0.45,
      muzzleRadius: 15,
    };
  }

  // 6. NOVA / METEORIC / BLAST CASTERS & GRENADE CANNONS (M-350 Mauler)
  if (ft === 'nova caster' || idLower.includes('nova_caster')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 0.88,
      lifeMult: 0.98,
      projectileRadius: 6.0,
      visualShape: 'nova_orb',
      impactAoERadius: 30,
      muzzleStyle: 'shockwave',
      muzzleArcSpan: Math.PI * 0.7,
      muzzleRadius: 18,
    };
  }
  if (ft === 'meteoric caster' || idLower.includes('meteoric')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 0.94,
      lifeMult: 1.15,
      projectileRadius: 5.5,
      visualShape: 'bolide',
      lobVz: 24,
      impactAoERadius: 28,
      muzzleStyle: 'slam',
      muzzleArcSpan: Math.PI * 0.65,
      muzzleRadius: 17,
    };
  }
  if (ft === 'blast caster' || idLower.includes('blast_caster') || idLower.includes('mauler')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 0.95,
      lifeMult: 0.96,
      projectileRadius: 4.6,
      visualShape: 'blast_shell',
      lobVz: 10,
      impactAoERadius: 25,
      muzzleStyle: 'shockwave',
      muzzleArcSpan: Math.PI * 0.6,
      muzzleRadius: 16,
    };
  }

  // 7. CARRIERS & MUNITIONS & SPECIALIST MAGITECH RANGED WEAPONS
  // 05. Sheaf: Multi-arrow fan spread
  if (ft === 'sheaf' || idLower.includes('sheaf')) {
    return {
      projectilesPerShot: 3,
      spreadAngleRad: 0.2,
      perProjectileDamageMult: 0.38,
      speedMult: 1.02,
      lifeMult: 0.86,
      projectileRadius: 3.0,
      visualShape: 'arrow',
      muzzleStyle: 'volley',
      muzzleArcSpan: Math.PI * 0.62,
      muzzleRadius: 15,
    };
  }
  // 02. Quiver & 03. Yebira: Fletched / whistling arrows
  if (ft === 'quiver' || ft === 'yebira') {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 1.12,
      lifeMult: 1.02,
      projectileRadius: 3.1,
      visualShape: 'arrow',
      muzzleStyle: 'volley',
      muzzleArcSpan: Math.PI * 0.38,
      muzzleRadius: 14,
    };
  }
  // 06. Rack (Ordnance Rack) & LN-1200 Avalanche: Finned rail rockets
  if (ft === 'rack' || idLower.includes('avalanche') || idLower.includes('rocket')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 1.08,
      lifeMult: 1.12,
      projectileRadius: 4.5,
      visualShape: 'rocket',
      lobVz: 6,
      impactAoERadius: 26,
      muzzleStyle: 'slam',
      muzzleArcSpan: Math.PI * 0.52,
      muzzleRadius: 16,
    };
  }
  // 04. Battery & LG-950 Tomahawk: Soft-lock homing micro-munitions / missiles
  if (ft === 'battery' || idLower.includes('tomahawk') || idLower.includes('battery')) {
    const isMissile = idLower.includes('tomahawk');
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 1.06,
      lifeMult: 1.14,
      projectileRadius: isMissile ? 4.2 : 3.8,
      visualShape: isMissile ? 'rocket' : 'pulse',
      homingStrength: 2.8,
      impactAoERadius: isMissile ? 22 : undefined,
      muzzleStyle: 'volley',
      muzzleArcSpan: Math.PI * 0.42,
      muzzleRadius: 15,
    };
  }
  // 07. Plumbata: Weighted high-angle plunging darts
  if (ft === 'plumbata' || idLower.includes('plumbata')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 0.96,
      lifeMult: 1.06,
      projectileRadius: 2.8,
      visualShape: 'dart',
      lobVz: 18,
      impactAoERadius: 16,
      muzzleStyle: 'thrust',
      muzzleArcSpan: Math.PI * 0.36,
      muzzleRadius: 14,
    };
  }
  // 08. Kaad: Weighted talisman-cord lash wave
  if (ft === 'kaad' || idLower.includes('kaad')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 0.92,
      lifeMult: 0.58,
      projectileRadius: 5.4,
      visualShape: 'cord_whip',
      waveSpanPx: 16,
      pierceRemaining: 1,
      muzzleStyle: 'slash',
      muzzleArcSpan: Math.PI * 0.72,
      muzzleRadius: 16,
    };
  }
  // 09. Pangao: Alchemist satchel volatile fire-flasks
  if (ft === 'pangao' || idLower.includes('pangao')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 0.92,
      lifeMult: 1.05,
      projectileRadius: 4.8,
      visualShape: 'blast_shell',
      lobVz: 18,
      impactAoERadius: 26,
      muzzleStyle: 'slam',
      muzzleArcSpan: Math.PI * 0.55,
      muzzleRadius: 15,
    };
  }
  // M-450 Pilum (Heavy Ballista): Shock-core javelins
  if (idLower.includes('pilum') || idLower.includes('ballista')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 1.24,
      lifeMult: 1.15,
      projectileRadius: 4.4,
      visualShape: 'javelin',
      pierceRemaining: 1,
      muzzleStyle: 'thrust',
      muzzleArcSpan: Math.PI * 0.3,
      muzzleRadius: 18,
    };
  }
  // 01. Bandolier: Quick-toss percussion cartridges / throwing knives
  if (ft === 'bandolier' || idLower.includes('bandolier')) {
    return {
      projectilesPerShot: 1,
      spreadAngleRad: 0,
      perProjectileDamageMult: 1.0,
      speedMult: 1.15,
      lifeMult: 0.88,
      projectileRadius: 2.6,
      visualShape: 'dart',
      muzzleStyle: 'volley',
      muzzleArcSpan: Math.PI * 0.35,
      muzzleRadius: 13,
    };
  }

  // 8. BOLT WEAPONS (Bolt Caster, N-55 Gladius, B-25 Brushcutter, SV-12 Viper, SV-18 Serpent, SR-440 Shadowfang, M-300 Hasta)
  // Compact, tight, high-velocity needle/bolt silhouette (Radius 2.1–2.6: strictly smaller than Pulses 4.2 and Waves 6.8)
  const boltRadius =
    weightClass === 'light' ? 2.1 : weightClass === 'heavy' || idLower.includes('shadowfang') ? 2.6 : 2.3;
  return {
    projectilesPerShot: 1,
    spreadAngleRad: 0,
    perProjectileDamageMult: 1.0,
    speedMult: idLower.includes('shadowfang') ? 1.38 : 1.22,
    lifeMult: 1.0,
    projectileRadius: boltRadius,
    visualShape: 'bolt',
    pierceRemaining: idLower.includes('shadowfang') ? 1 : 0,
    muzzleStyle: 'volley',
    muzzleArcSpan: Math.PI * 0.3,
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
