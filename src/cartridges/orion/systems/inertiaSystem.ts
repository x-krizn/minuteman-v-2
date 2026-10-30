/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PROJECT ORION — INERTIA SYSTEM (`inertia-v0.md`)
 * Weight, Momentum, Stability, and Hit Reaction — Simplified Physics Model
 *
 * Core Physics Basis (§3 & §4 of `inertia-v0.md`):
 *   momentum:                p = m · v
 *   impulse:                 J = Δp
 *   velocity change:         Δv = J / m
 *   defender effective mass: m_eff = m_defender × (1 + μ_defender)
 *   melee impulse:           attack_mass_eff = attack_weight + attacker_frame_weight × μ_attacker × commitment
 *                            J_melee         = attack_mass_eff × attack_speed
 *   ranged impulse:          J_ranged        = projectile_weight × projectile_speed   (NO shooter weight term)
 *   hit reaction:            Δv              = J / m_eff
 *                            Δv_eff          = max(0, Δv - k1 · S)
 *                            recovery        = Δv_eff / (k2 · S)
 *                            outcome         = band(Δv_eff) -> 'none' | 'flinch' | 'stagger' | 'knockback'
 *   recoil (§7):             J_recoil        = projectile_weight × projectile_speed
 *                            Δv_recoil       = J_recoil / m_shooter_frame             (no μ bonus)
 *                            Δv_recoil_eff   = max(0, Δv_recoil - k1 · S)
 *                            restriction     = Δv_recoil_eff / (k2 · S)
 *
 * Validation Invariants (§9):
 *   1. Heavier defender -> smaller Δv, all else equal.
 *   2. Higher S -> smaller Δv_eff and shorter recovery.
 *   3. Defender moving toward the hit -> larger m_eff.
 *   4. Defender moving away or sideways -> no charge bonus (μ = 0).
 *   5. Larger attack_weight × attack_speed -> larger J; big slow hits overcome a charging heavy.
 *   6. Ranged J is strictly independent of shooter weight.
 *   7. Recoil effect decreases as frame weight and S increase.
 *   8. Inertia NEVER alters damage dealt or taken (BCU invariant).
 *   9. Identical behavior in PvP and PvE (Unification Law).
 */

import { getEnemyDefinition } from '../database/enemies';
import { getWeaponDefinition } from '../database/equipment/weapons';
import {
  ACTION_MODIFICATION_CATALOG,
  computeEffectiveLoadCapacity,
  findHardwareItemByNameOrId,
} from '../database/progression';
import {
  AttackCommitmentClass,
  EnemyEntity,
  FrameLoadCapacity,
  InertiaModifiers,
  InertiaOutcomeBand,
  OrionState,
  WeaponWeightClass,
} from '../types';

// ─── 1. TUNABLE CONSTANTS & OPEN DECISION DEFAULTS (§4, §11 of `inertia-v0.md`) ───

export const INERTIA_CONSTANTS = {
  /** OD-INR-01: Global reference glide speed (px/s) used to normalize forward momentum fraction μ */
  REFERENCE_SPEED: 180,
  /** OD-INR-10: Stability deadband constant k1 (sets shrug-off threshold `k1 · S`) */
  K1_DEADBAND: 0.45,
  /** OD-INR-10: Stability recovery constant k2 (sets recovery rate `k2 · S`) */
  K2_RECOVERY: 1.25,
  /** §8 Player Legibility: Minimum forward momentum fraction μ to display visible Charge State */
  CHARGE_VISUAL_MU_THRESHOLD: 0.55,

  /** OD-INR-03: Outcome band thresholds on Δv_eff */
  BAND_FLINCH_MAX: 25,
  BAND_STAGGER_MAX: 55,

  /** OD-INR-04: Numeric mass scale for Frame weight classes */
  FRAME_WEIGHT_BY_CLASS: {
    light: 80,
    medium: 110,
    heavy: 150,
    superheavy: 200,
  } as Record<FrameLoadCapacity, number>,

  /** OD-INR-04: Numeric mass scale for Weapon weight classes */
  WEAPON_WEIGHT_BY_CLASS: {
    light: 18,
    medium: 35,
    heavy: 65,
  } as Record<WeaponWeightClass, number>,

  /** OD-INR-04: Numeric mass scale for Projectiles */
  PROJECTILE_WEIGHT_BY_CLASS: {
    light: 8,
    medium: 20,
    heavy: 45,
  } as Record<WeaponWeightClass, number>,

  /** OD-INR-07: Commitment factor scaling how much of attacker frame momentum transfers into melee */
  COMMITMENT_BY_CLASS: {
    poke: 0.35,
    slash: 0.65,
    heavy: 1.0,
  } as Record<AttackCommitmentClass, number>,
} as const;

export const INERTIAL_TELEMETRY_SENSORY_ID = 'sensory_b_inertial_gyro_telemetry';
export const INERTIAL_TELEMETRY_MOD_ID = 'mod_inertial_gyro_telemetry';

// ─── 2. CORE PHYSICS EQUATIONS (§4 – §7 of `inertia-v0.md`) ──────────────────

/**
 * Computes forward momentum fraction `μ` (0 to 1) along a target/incoming directional axis.
 * `μ = clamp(speed_toward_axis / reference_speed, 0, 1)`
 * Returns `0` when stationary, moving away (`dot <= 0`), or moving perpendicular/sideways.
 */
export function computeMomentumFraction(
  vx: number,
  vy: number,
  axisDirX: number,
  axisDirY: number,
  referenceSpeed: number = INERTIA_CONSTANTS.REFERENCE_SPEED
): number {
  const axisNorm = Math.hypot(axisDirX, axisDirY);
  if (axisNorm <= 0.0001 || referenceSpeed <= 0) return 0;
  const nx = axisDirX / axisNorm;
  const ny = axisDirY / axisNorm;
  const speedTowardAxis = vx * nx + vy * ny;
  if (speedTowardAxis <= 0) return 0;
  return Math.max(0, Math.min(1, speedTowardAxis / referenceSpeed));
}

/**
 * Computes Defender Effective Weight (`m_eff`) with directional charge bonus (§4, §6):
 * `m_eff = m_defender × (1 + μ_defender)`
 */
export function computeEffectiveWeight(baseWeight: number, muDefender: number): number {
  const clampedMu = Math.max(0, Math.min(1, muDefender));
  return Math.max(1, baseWeight) * (1 + clampedMu);
}

/**
 * Computes Frame Stability (`S`, §5, OD-INR-06):
 * Derived from frame weight + armor rating + hardware/feat/mod bonuses.
 * Separate from weight `m` so a light frame can be built stable and a heavy frame is likely (not guaranteed) to be.
 */
export function computeStability(
  frameWeight: number,
  armorRating: number,
  modifiers?: InertiaModifiers
): number {
  const baseS = frameWeight * 0.35 + armorRating * 0.85;
  const flat = modifiers?.stabilityFlat ?? 0;
  const mult = modifiers?.stabilityMult ?? 1.0;
  return Math.max(5, Math.round((baseS + flat) * mult));
}

/**
 * Computes Outgoing Melee Impulse (`J_melee`, §4):
 * `attack_mass_eff = attack_weight + attacker_frame_weight × μ_attacker × commitment`
 * `J_melee         = attack_mass_eff × attack_speed`
 */
export function computeMeleeImpulse(
  attackWeight: number,
  attackSpeed: number,
  attackerFrameWeight: number,
  attackerMu: number,
  commitment: number = 1.0
): number {
  const clampedMu = Math.max(0, Math.min(1, attackerMu));
  const clampedCommitment = Math.max(0, Math.min(1.5, commitment));
  const attackMassEff =
    Math.max(1, attackWeight) +
    Math.max(0, attackerFrameWeight) * clampedMu * clampedCommitment;
  return attackMassEff * Math.max(1, attackSpeed);
}

/**
 * Computes Outgoing Ranged Impulse (`J_ranged`, §2.6, §4, §9.6):
 * `J_ranged = projectile_weight × projectile_speed`
 * Explicitly includes NO shooter weight term.
 */
export function computeRangedImpulse(
  projectileWeight: number,
  projectileSpeed: number
): number {
  return Math.max(1, projectileWeight) * Math.max(1, projectileSpeed);
}

/**
 * Maps stability-reduced velocity change `Δv_eff` onto the 4 outcome bands (§4, §8, OD-INR-03):
 * `'none' | 'flinch' | 'stagger' | 'knockback'`
 */
export function classifyInertiaOutcomeBand(dvEff: number): InertiaOutcomeBand {
  if (dvEff <= 0.001) return 'none';
  if (dvEff < INERTIA_CONSTANTS.BAND_FLINCH_MAX) return 'flinch';
  if (dvEff < INERTIA_CONSTANTS.BAND_STAGGER_MAX) return 'stagger';
  return 'knockback';
}

export interface HitInertiaResolution {
  /** Outgoing impulse J transferred by the hit */
  impulseJ: number;
  /** Defender effective weight `m_eff = m_defender × (1 + μ_defender)` */
  defenderEffectiveWeight: number;
  /** Raw physical velocity change `Δv = J / m_eff` (governs displacement) */
  dv: number;
  /** Stability deadband `k1 · S` */
  deadbandThreshold: number;
  /** Stability-reduced reaction severity `Δv_eff = max(0, Δv - k1 · S)` */
  dvEff: number;
  /** Categorized hit reaction outcome band */
  outcome: InertiaOutcomeBand;
  /** Recovery duration in seconds (`Δv_eff / (k2 · S)` snapped/bounded for Law 2 consistency) */
  recoverySec: number;
  /** Hitstop freeze-frame duration in seconds */
  hitstopSec: number;
  /** Physical displacement velocity magnitude applied along the impact vector (px/s) */
  displacementSpeedPx: number;
}

/**
 * Resolves a hit's physical displacement (`Δv`), reaction outcome band (`band(Δv_eff)`),
 * recovery duration (`Δv_eff / (k2 · S)`), and hitstop freeze frames (§4, §5).
 */
export function resolveHitInertia(params: {
  impulseJ: number;
  defenderWeight: number;
  defenderMu: number;
  defenderStability: number;
}): HitInertiaResolution {
  const defenderEffectiveWeight = computeEffectiveWeight(
    params.defenderWeight,
    params.defenderMu
  );
  const dv = params.impulseJ / defenderEffectiveWeight;
  const s = Math.max(5, params.defenderStability);
  const deadbandThreshold = INERTIA_CONSTANTS.K1_DEADBAND * s;
  const dvEff = Math.max(0, dv - deadbandThreshold);
  const outcome = classifyInertiaOutcomeBand(dvEff);
  const rawRecovery = dvEff / Math.max(1, INERTIA_CONSTANTS.K2_RECOVERY * s);

  let recoverySec = 0;
  let hitstopSec = 0.018;
  let displacementSpeedPx = 0;

  if (outcome === 'none') {
    // Shrugged off inside stability deadband (k1 · S): no interruption, minor physical slide from weight Δv
    recoverySec = 0;
    hitstopSec = 0.018;
    displacementSpeedPx = Math.min(42, dv * 0.65);
  } else if (outcome === 'flinch') {
    // Light reaction: brief movement flinch, drops boost to glide without cancelling weapon tells
    recoverySec = Math.max(0.08, Math.min(0.18, rawRecovery));
    hitstopSec = 0.036;
    displacementSpeedPx = Math.min(95, Math.max(24, dv * 1.15));
  } else if (outcome === 'stagger') {
    // Heavy reaction: interrupts active weapon tells & forces glide wind-down
    recoverySec = Math.max(0.24, Math.min(0.45, Math.max(0.28, rawRecovery)));
    hitstopSec = 0.062;
    displacementSpeedPx = Math.min(145, Math.max(55, dv * 1.4));
  } else {
    // Knockback: full action cancel + high-velocity displacement slide + Law 2 0.75s baseline scaled by S
    recoverySec = Math.max(0.48, Math.min(0.75, Math.max(0.55, rawRecovery)));
    hitstopSec = 0.088;
    displacementSpeedPx = Math.min(220, Math.max(95, dv * 1.75));
  }

  return {
    impulseJ: params.impulseJ,
    defenderEffectiveWeight,
    dv,
    deadbandThreshold,
    dvEff,
    outcome,
    recoverySec,
    hitstopSec,
    displacementSpeedPx,
  };
}

export interface RecoilInertiaResolution {
  recoilImpulseJ: number;
  dvRecoil: number;
  dvRecoilEff: number;
  restrictionSec: number;
  speedMultiplier: number;
  kickbackSpeedPx: number;
}

/**
 * Resolves Weapon Recoil using the exact same impulse rule (§7):
 * `J_recoil      = projectile_weight × projectile_speed`
 * `Δv_recoil     = J_recoil / m_shooter_frame` (no μ charge bonus)
 * `Δv_recoil_eff = max(0, Δv_recoil - k1 · S)`
 * `restriction   = Δv_recoil_eff / (k2 · S)`
 */
export function resolveRecoil(params: {
  recoilImpulseJ: number;
  shooterFrameWeight: number;
  shooterStability: number;
}): RecoilInertiaResolution {
  const mShooter = Math.max(1, params.shooterFrameWeight);
  const s = Math.max(5, params.shooterStability);
  const dvRecoil = params.recoilImpulseJ / mShooter;
  const dvRecoilEff = Math.max(0, dvRecoil - INERTIA_CONSTANTS.K1_DEADBAND * s);

  if (dvRecoilEff <= 0.001) {
    return {
      recoilImpulseJ: params.recoilImpulseJ,
      dvRecoil,
      dvRecoilEff: 0,
      restrictionSec: 0,
      speedMultiplier: 1.0,
      kickbackSpeedPx: 0,
    };
  }

  const rawRestriction = dvRecoilEff / Math.max(1, INERTIA_CONSTANTS.K2_RECOVERY * s);
  const restrictionSec = Math.max(0.05, Math.min(0.32, rawRestriction));
  const speedMultiplier = Math.max(0.45, Math.min(0.92, 1 - dvRecoilEff / 110));
  const kickbackSpeedPx = Math.min(85, dvRecoilEff * 1.15);

  return {
    recoilImpulseJ: params.recoilImpulseJ,
    dvRecoil,
    dvRecoilEff,
    restrictionSec,
    speedMultiplier,
    kickbackSpeedPx,
  };
}

// ─── 3. ACTOR & WEAPON INERTIA PROFILE RESOLVERS ─────────────────────────────

export interface ActorInertiaProfile {
  weightClass: FrameLoadCapacity;
  frameMass: number;
  weaponMass: number;
  totalBaseWeight: number;
  stability: number;
  shrugOffDeadbandDv: number;
  maxChargeWeight: number;
  recoilAbsorptionLabel: string;
}

/**
 * Checks whether the pilot currently has the Inertial Gyro-Telemetry equipment mod or sensory array installed.
 * By design (§1, §8, user specification), HUD inertia telemetry is hidden unless this mod is equipped.
 */
export function hasInertialTelemetryModEquipped(state: OrionState): boolean {
  const slots = state.equipmentSlots;
  if (!slots) return false;
  if (
    slots.sensoryA === INERTIAL_TELEMETRY_SENSORY_ID ||
    slots.sensoryB === INERTIAL_TELEMETRY_SENSORY_ID ||
    slots.aux3 === INERTIAL_TELEMETRY_SENSORY_ID ||
    slots.aux4 === INERTIAL_TELEMETRY_SENSORY_ID
  ) {
    return true;
  }
  const installedMods = Object.values(slots.installedMods || {});
  if (installedMods.includes(INERTIAL_TELEMETRY_MOD_ID)) {
    return true;
  }
  return Boolean(state.flags?.hud_inertia_telemetry_enabled);
}

/**
 * Computes the player mech's current Weight (`m`), Stability (`S`), Deadband (`k1 · S`),
 * and Charge Capacity (`m_eff` max) from equipped chassis hardware, weapons, feats, and mods.
 */
export function resolvePlayerInertiaProfile(state: OrionState): ActorInertiaProfile {
  const effectiveLoadClass = computeEffectiveLoadCapacity(
    state.traitLine,
    state.equippedFeats || [],
    state
  );
  const baseFrameMass =
    INERTIA_CONSTANTS.FRAME_WEIGHT_BY_CLASS[effectiveLoadClass] ?? 110;

  const activeWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const activeWeapon = getWeaponDefinition(activeWeaponId);
  const weaponWeightClass: WeaponWeightClass = activeWeapon?.weightClass || 'medium';
  const weaponMass =
    activeWeapon?.baseAttackWeight ??
    INERTIA_CONSTANTS.WEAPON_WEIGHT_BY_CLASS[weaponWeightClass] ??
    35;

  // Off-hand shield or secondary weapon contributes partial carried mass
  const slot2Id = state.equipmentSlots?.slot2;
  const slot2Def = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
  const offhandMass =
    slot2Def && slot2Id !== activeWeaponId
      ? Math.round(
          (INERTIA_CONSTANTS.WEAPON_WEIGHT_BY_CLASS[slot2Def.weightClass || 'light'] || 18) *
            0.4
        )
      : 0;

  // Collect Stability & Weight modifiers from feats, mods, and hardware
  const equippedFeats = state.equippedFeats || [];
  let stabilityFlat = state.inertiaModifiers?.stabilityFlat || 0;
  let stabilityMult = state.inertiaModifiers?.stabilityMult || 1.0;
  const weightFlat = state.inertiaModifiers?.weightFlat || 0;
  const weightMult = state.inertiaModifiers?.weightMult || 1.0;

  if (
    equippedFeats.some((f) =>
      [
        'siege_anchor',
        'unstoppable_momentum',
        'bastion_core',
        'fortress_protocol',
        'shield_wall_advance',
        'gyro_stabilizer',
      ].includes(f)
    )
  ) {
    stabilityFlat += 14;
  }

  if (state.isHoldingBlock) {
    const isShield = Boolean(
      state.blockingWeaponId && state.blockingWeaponId.includes('shield')
    );
    stabilityFlat += isShield ? 22 : 12;
  }

  const installedMods = Object.values(state.equipmentSlots?.installedMods || {});
  for (const modId of installedMods) {
    const modDef = ACTION_MODIFICATION_CATALOG.find((m) => m.id === modId);
    if (modDef?.modifiers.stabilityBonus) {
      stabilityFlat += modDef.modifiers.stabilityBonus;
    }
    if (modDef?.modifiers.hyperArmorWindup && (state.skillTellTimer || 0) > 0) {
      stabilityFlat += 18;
    }
  }

  // Check auxiliary/legs hardware for gyro/stabilizer keywords
  const aux3Item = findHardwareItemByNameOrId(state.equipmentSlots?.aux3);
  const aux4Item = findHardwareItemByNameOrId(state.equipmentSlots?.aux4);
  const legsItem = findHardwareItemByNameOrId(state.equipmentSlots?.legs);
  for (const hw of [aux3Item, aux4Item, legsItem]) {
    if (!hw) continue;
    const descLower = `${hw.name} ${hw.subtype} ${hw.description}`.toLowerCase();
    if (
      descLower.includes('gyro') ||
      descLower.includes('stabiliz') ||
      descLower.includes('anchor') ||
      descLower.includes('recoil')
    ) {
      stabilityFlat += 10;
    }
  }

  const totalBaseWeight = Math.round(
    (baseFrameMass + weaponMass * 0.45 + offhandMass + weightFlat) * weightMult
  );
  const armorRating = state.armor?.rating ?? 8;
  const stability = computeStability(totalBaseWeight, armorRating, {
    stabilityFlat,
    stabilityMult,
  });
  const shrugOffDeadbandDv = Math.round(INERTIA_CONSTANTS.K1_DEADBAND * stability);
  const maxChargeWeight = Math.round(totalBaseWeight * 2);

  const recoilAbsorptionLabel =
    stability >= 75
      ? 'SIEGE-GRADE (IGNORES HEAVY RECOIL)'
      : stability >= 58
        ? 'HIGH (SHRUGS OFF STANDARD RECOIL)'
        : stability >= 44
          ? 'BALANCED (MODERATE RECOIL DAMPING)'
          : 'LIGHT (HIGH RECOIL DRIFT ON HEAVY ARMS)';

  return {
    weightClass: effectiveLoadClass,
    frameMass: baseFrameMass,
    weaponMass,
    totalBaseWeight,
    stability,
    shrugOffDeadbandDv,
    maxChargeWeight,
    recoilAbsorptionLabel,
  };
}

export interface WeaponAttackInertiaSpec {
  attackWeight: number;
  attackSpeed: number;
  commitment: number;
  projectileWeight: number;
  projectileSpeed: number;
  isMelee: boolean;
}

/**
 * Resolves numeric attack weight (`m_attack`), attack speed (`v_attack`), commitment (`c_atk`),
 * and projectile weight (`m_projectile`) for any weapon action slot (0..4).
 */
export function resolveWeaponAttackInertiaSpec(
  weaponId: string,
  slot: number = 0
): WeaponAttackInertiaSpec {
  const weapon = getWeaponDefinition(weaponId);
  const weightClass: WeaponWeightClass = weapon?.weightClass || 'medium';
  const action = weapon?.moveset?.[slot];
  const isMelee =
    weapon?.equipmentRole === 'melee' ||
    weapon?.equipmentRole === 'shield' ||
    weaponId === 'khopesh';

  const baseAttackWeight =
    action?.attackWeight ??
    weapon?.baseAttackWeight ??
    INERTIA_CONSTANTS.WEAPON_WEIGHT_BY_CLASS[weightClass] ??
    35;

  // Slot 0 = auto chain, Slot 1 = primary lunge/strike, Slot 2 = heavy slam/shockwave, Slot 4 = finisher
  const slotWeightMult =
    slot === 4 ? 1.55 : slot === 2 ? 1.35 : slot === 1 ? 1.2 : 1.0;

  let commitment =
    action?.commitment ??
    (slot === 0
      ? weightClass === 'light'
        ? INERTIA_CONSTANTS.COMMITMENT_BY_CLASS.poke
        : INERTIA_CONSTANTS.COMMITMENT_BY_CLASS.slash
      : slot === 1 || slot === 2 || slot === 4
        ? INERTIA_CONSTANTS.COMMITMENT_BY_CLASS.heavy
        : INERTIA_CONSTANTS.COMMITMENT_BY_CLASS.slash);

  // Spears/Daggers on basic poke have lower body commitment; shields/maces/axes have higher commitment
  if (
    slot === 0 &&
    (weaponId === 'short_spear' ||
      weaponId === 's4_whisper_blade' ||
      weaponId === 's6_phantom_edge')
  ) {
    commitment = INERTIA_CONSTANTS.COMMITMENT_BY_CLASS.poke;
  } else if (
    weapon?.equipmentRole === 'shield' ||
    weaponId === 'mace' ||
    weaponId === 'siegebreaker' ||
    weaponId === 'avalon_siege_lance'
  ) {
    commitment = Math.max(commitment, 0.85);
  }

  const baseSpeed =
    action?.attackSpeed ??
    weapon?.baseAttackSpeed ??
    (weightClass === 'heavy' ? 145 : weightClass === 'medium' ? 125 : 110);
  const slotSpeedMult = slot === 4 ? 1.3 : slot === 2 ? 1.22 : slot === 1 ? 1.15 : 1.0;

  const projectileWeight =
    action?.projectileWeight ??
    weapon?.projectileWeight ??
    (weaponId === 'm350_mauler' ||
    weaponId === 'ln1200_avalanche' ||
    weaponId === 'lg950_tomahawk' ||
    weaponId === 'm450_pilum' ||
    weaponId === 'wz800_arclight_cannon'
      ? INERTIA_CONSTANTS.PROJECTILE_WEIGHT_BY_CLASS.heavy
      : weightClass === 'heavy'
        ? 36
        : weightClass === 'medium'
          ? INERTIA_CONSTANTS.PROJECTILE_WEIGHT_BY_CLASS.medium
          : INERTIA_CONSTANTS.PROJECTILE_WEIGHT_BY_CLASS.light);

  const projectileSpeed =
    weightClass === 'heavy' ? 235 : weightClass === 'medium' ? 195 : 180;

  return {
    attackWeight: Math.round(baseAttackWeight * slotWeightMult),
    attackSpeed: Math.round(baseSpeed * slotSpeedMult),
    commitment,
    projectileWeight: Math.round(
      projectileWeight * (slot >= 1 ? 1.25 : 1.0)
    ),
    projectileSpeed,
    isMelee,
  };
}

export interface EnemyInertiaProfile {
  baseWeight: number;
  stability: number;
  attackWeight: number;
  attackSpeed: number;
  commitment: number;
  projectileWeight: number;
}

/**
 * Resolves an enemy entity's Weight (`m`), Stability (`S`), and outgoing attack inertia parameters (§10).
 * Ensures PvP/PvE Unification Law compliance: enemies use the exact same formulas as the player mech.
 */
export function resolveEnemyInertiaProfile(e: EnemyEntity): EnemyInertiaProfile {
  const def = getEnemyDefinition(e.type);

  // Default archetype mappings for Belldor & Fog enemies
  let defaultWeight = 110;
  let defaultAttackWeight = 35;
  let defaultAttackSpeed = 125;
  let defaultCommitment = 0.75;
  let defaultProjWeight = 18;

  switch (e.type) {
    case 'bog_crawler':
      defaultWeight = 75;
      defaultAttackWeight = 20;
      defaultAttackSpeed = 115;
      defaultCommitment = 0.55;
      break;
    case 'orc_scout':
      defaultWeight = 90;
      defaultAttackWeight = 22;
      defaultAttackSpeed = 120;
      defaultCommitment = 0.5;
      defaultProjWeight = 16;
      break;
    case 'orc_warrior':
      // Heavy Strike boarding-axe brawler
      defaultWeight = 185;
      defaultAttackWeight = 68;
      defaultAttackSpeed = 158;
      defaultCommitment = 1.0;
      break;
    case 'percival_knight':
      // Sir Percival: Heavy Guardian Shield Bash & Charging Ram
      defaultWeight = 175;
      defaultAttackWeight = 58;
      defaultAttackSpeed = 150;
      defaultCommitment = 1.0;
      break;
    case 'bors_knight':
      // Sir Bors: Berserk Maul Slam / Enraged Execution Lunge (Big Slow Hit that breaks a Charging Heavy!)
      defaultWeight = 165;
      defaultAttackWeight = e.enraged ? 78 : 66;
      defaultAttackSpeed = e.enraged ? 175 : 155;
      defaultCommitment = 1.0;
      break;
    case 'tristan_knight':
      defaultWeight = 105;
      defaultAttackWeight = 28;
      defaultAttackSpeed = 130;
      defaultCommitment = 0.5;
      defaultProjWeight = 26;
      break;
    case 'bog_wurm':
    case 'lady_of_the_lake':
      defaultWeight = 210;
      defaultAttackWeight = 72;
      defaultAttackSpeed = 155;
      defaultCommitment = 0.9;
      defaultProjWeight = 34;
      break;
    default:
      if (e.isFogBoss) {
        defaultWeight = 195;
        defaultAttackWeight = 70;
        defaultAttackSpeed = 160;
        defaultCommitment = 1.0;
      }
      break;
  }

  const baseWeight = def?.baseWeight ?? defaultWeight;
  const armorRating = e.armor?.rating ?? def?.armor?.rating ?? 6;
  const stability =
    def?.baseStability ??
    computeStability(baseWeight, armorRating, {
      stabilityFlat: e.isFogBoss ? 14 : 0,
    });

  return {
    baseWeight,
    stability,
    attackWeight: def?.attackWeight ?? defaultAttackWeight,
    attackSpeed: def?.attackSpeed ?? defaultAttackSpeed,
    commitment: def?.commitment ?? defaultCommitment,
    projectileWeight: def?.projectileWeight ?? defaultProjWeight,
  };
}

/**
 * Formats an outcome band for visual/telemetry display.
 */
export function formatInertiaOutcomeLabel(outcome: InertiaOutcomeBand): {
  label: string;
  color: string;
} {
  switch (outcome) {
    case 'none':
      return { label: 'BRACED (SHRUGGED)', color: '#94a3b8' };
    case 'flinch':
      return { label: 'FLINCH!', color: '#fde047' };
    case 'stagger':
      return { label: 'STAGGER!', color: '#fb923c' };
    case 'knockback':
      return { label: 'KNOCKBACK!', color: '#f43f5e' };
  }
}
