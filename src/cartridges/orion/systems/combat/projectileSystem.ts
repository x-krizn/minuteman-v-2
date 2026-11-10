/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { TILE_SIZE } from '../../constants';
import {
  classifyWeaponCombatArchetype,
  clampTempoMultiplier,
  COMBAT_TEMPO_CONSTANTS,
  getWeaponDefinition,
} from '../../database/equipment/weapons';
import {
  ACTION_MODIFICATION_CATALOG,
  computeInterfaceFeatModifiers,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
  resolveEquippedHardwareStats,
} from '../../database/progression';
import { OrionCombatContext, OrionState } from '../../types';
import {
  computeMeleeImpulse,
  computeMomentumFraction,
  computeRangedImpulse,
  formatInertiaOutcomeLabel,
  INERTIA_CONSTANTS,
  resolveEnemyInertiaProfile,
  resolveHitInertia,
  resolvePlayerInertiaProfile,
  resolveRecoil,
  resolveWeaponAttackInertiaSpec,
} from '../inertiaSystem';
import { isSolidAt, notifyOrionStateChange } from '../playerSystem';
import {
  evaluatePositionalHitQuality,
  getCombatAimVector,
  getLockedTarget,
  isTargetInDirectionalArc,
  isTargetInImpactZone,
  isTargetInThrustCorridor,
  normalizeAngleDiff,
  triggerEntityFlash,
} from './combatHelpers';
import { applyDamageToLayers, PERFECT_BLOCK_WINDOW_SEC } from './damageSystem';
import { getSkillCooldownKey } from './skillExecution';

/**
 * Executes `firePrimarySalvoShot` (fire primary salvo shot) in `projectileSystem.ts`. Mutates `state: OrionState`.
 */
export function firePrimarySalvoShot(
  state: OrionState,
  _ctx: OrionCombatContext,
  _isAuto: boolean,
  bowChargeRatio?: number
): boolean {
  const currentWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const weapon = getWeaponDefinition(currentWeaponId);
  if (!weapon) return false;

  const skill0 = weapon.moveset[0];
  const arch = classifyWeaponCombatArchetype(weapon, currentWeaponId);
  const isMeleeOrShield = Boolean(skill0?.noReload) || arch.isMeleeOrShield;

  const s1Key = getSkillCooldownKey(currentWeaponId, 0);

  if (isMeleeOrShield) {
    if ((state.meleeSequenceCooldownTimer || 0) > 0) {
      return false;
    }
    state.isReloading = false;
    state.reloadTimer = 0;
    state.ammo = state.maxAmmo;
  } else if (state.ammo <= 0) {
    const reloadDur = state.reloadDuration || weapon.reloadDurationSec;
    state.isReloading = true;
    state.reloadTimer = reloadDur;
    state.skillReloadTimers = state.skillReloadTimers || {};
    state.skillReloadTimers[s1Key] = reloadDur;
    soundSystem.playMenuBeep();
    notifyOrionStateChange();
    return false;
  }

  const installedRangedModId = state.equipmentSlots?.installedMods?.ranged;
  const rangedMod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === installedRangedModId);
  const hwStats = resolveEquippedHardwareStats(state);
  const tellMult = clampTempoMultiplier(
    (!isMeleeOrShield ? (rangedMod?.modifiers.tellDurationMult ?? 1.0) : 1.0) *
      hwStats.tellDurationMult
  );

  const comboSteps = isMeleeOrShield ? skill0.comboSequence : undefined;
  const currentStepIdx = comboSteps?.length
    ? (state.meleeComboStep || 0) % comboSteps.length
    : 0;
  const activeComboStep = comboSteps?.[currentStepIdx];

  state.activeSkillSlot = 0;
  state.activeActionId = null;
  state.activeSkillCooldownKey = s1Key;
  state.pendingBowChargeRatio = bowChargeRatio;

  if (isMeleeOrShield && activeComboStep) {
    const rawTell = Math.max(0.08, activeComboStep.tellDurationSec * tellMult);
    const minTotalStep = COMBAT_TEMPO_CONSTANTS.MELEE_COMBO_STEP_SEC.minFloor;
    const rawAction = Math.max(
      minTotalStep - rawTell,
      activeComboStep.actionDurationSec * tellMult
    );
    state.skillTellTimer = Number(rawTell.toFixed(3));
    state.skillTellMaxTimer = state.skillTellTimer;
    state.skillActionTimer = Number(rawAction.toFixed(3));
    state.skillActionMaxTimer = state.skillActionTimer;
    state.meleeComboResetTimer =
      (skill0.comboResetWindowSec ?? 1.45) + state.skillTellTimer + state.skillActionTimer;
  } else if (skill0.isChargeable && bowChargeRatio !== undefined) {
    // Bow release: immediate crisp release tell since the player already held draw
    state.skillTellTimer = 0.045;
    state.skillTellMaxTimer = 0.045;
    state.skillActionTimer = Math.max(0.22, skill0.actionDurationSec * tellMult);
    state.skillActionMaxTimer = state.skillActionTimer;
  } else {
    // Ranged Basic Attack: per-shot cadence decoupled from doubled magazine size (`shotsPerChain`)
    const rawTell = Math.max(0.065, skill0.tellDurationSec * tellMult);
    const minTotalShot = COMBAT_TEMPO_CONSTANTS.RANGED_BASIC_SHOT_SEC.minFloor;
    const rawAction = Math.max(
      minTotalShot - rawTell,
      skill0.actionDurationSec * tellMult
    );
    state.skillTellTimer = Number(rawTell.toFixed(3));
    state.skillTellMaxTimer = state.skillTellTimer;
    state.skillActionTimer = Number(rawAction.toFixed(3));
    state.skillActionMaxTimer = state.skillActionTimer;
  }
  return true;
}

/**
 * Executes a single basic attack chain strike/shot (`activeSkillSlot === 0`) when `skillTellTimer` reaches 0.
 */
export function executeBasicAttackShot(
  state: OrionState,
  ctx: OrionCombatContext,
  currentWeaponId: string,
  trailColor: string,
  coreColor: string
): void {
  const weapon = getWeaponDefinition(currentWeaponId);
  const action = weapon?.moveset[0];
  const arch = classifyWeaponCombatArchetype(weapon, currentWeaponId);
  const isMeleeOrShield = Boolean(action?.noReload) || arch.isMeleeOrShield;
  const isBowWeapon = arch.isBow || Boolean(action?.isChargeable);
  const gemVis = getWeaponGemVisuals(state, currentWeaponId);
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const loadPenalty = state.gates?.loadPenalty;
  const aim = getCombatAimVector(state);
  const gemCombatMods = getWeaponGemCombatModifiers(state, currentWeaponId);
  const overdriveMult =
    ((state.overdriveTimer || 0) > 0 ? 1.3 : 1.0) *
    featMods.damageMult *
    gemCombatMods.damageMult;

  if (!action) return;
  if (!isMeleeOrShield && state.ammo <= 0) return;

  const bowChargeRatio = isBowWeapon
    ? Math.max(0, Math.min(1, state.pendingBowChargeRatio ?? 0))
    : 0;
  state.pendingBowChargeRatio = undefined;

  if (!isMeleeOrShield) {
    state.ammo = Math.max(0, state.ammo - 1);
  } else {
    state.ammo = state.maxAmmo;
    state.isReloading = false;
  }

  const comboSteps = isMeleeOrShield ? action.comboSequence : undefined;
  const stepCount = comboSteps?.length || 1;
  const stepIdx = isMeleeOrShield ? (state.meleeComboStep || 0) % stepCount : 0;
  const comboStep = comboSteps?.[stepIdx];

  const bowHeatMult = isBowWeapon ? 1.0 + 0.65 * bowChargeRatio : 1.0;
  const bowDmgMult = isBowWeapon ? 1.0 + 0.85 * bowChargeRatio : 1.0;
  const comboDmgMult = comboStep?.damageMult ?? 1.0;

  const shotHeat =
    action.heatCost *
    bowHeatMult *
    (loadPenalty?.heatMult ?? 1.0) *
    featMods.heatGenMult;
  state.heat = Math.min(state.maxHeat, state.heat + shotHeat);
  state.heatDecayDelayTimer = Math.max(state.heatDecayDelayTimer || 0, 0.45);
  if (isBowWeapon && bowChargeRatio > 0.15 && state.gates?.energySystemActive) {
    const energyCost = Math.round(4 * bowChargeRatio);
    state.energy = Math.max(0, state.energy - energyCost);
  }
  const shotDmg = Math.round(action.damage * overdriveMult * bowDmgMult * comboDmgMult);

  // Advance Melee Combo Step & set internal reset timer / deliberate finisher recovery
  if (isMeleeOrShield) {
    const nextStep = ((state.meleeComboStep || 0) + 1) % stepCount;
    state.meleeComboStep = nextStep;
    if (nextStep === 0 && stepCount > 1) {
      const wClass = arch.weightClass;
      state.meleeSequenceCooldownTimer =
        wClass === 'light' ? 0.45 : wClass === 'heavy' ? 0.75 : 0.58;
      state.meleeComboResetTimer = 0;
    } else {
      state.meleeComboResetTimer = action.comboResetWindowSec ?? 1.45;
    }
  }

  // §3.5 Critical Frame State (LOCKED): 15% misfire chance per shot when Frame Integrity <= 40 HP
  const isCriticalMisfire = state.frame.integrity <= 40 && Math.random() < 0.15;

  if (isCriticalMisfire) {
    soundSystem.playMenuBeep();
    ctx.spawnParticles(
      state.x + aim.dx * 8,
      state.y + aim.dy * 8,
      state.z + 8,
      6,
      '#f87171',
      'MISFIRE! (CRITICAL)'
    );
  } else if (isMeleeOrShield) {
    const aimAngle = Math.atan2(aim.dy, aim.dx);
    const opticMult = (state.opticMarkTimer || 0) > 0 ? 1.25 : 1.0;
    const hasKnightsOath = state.equippedFeats.includes('knights_oath');
    const playerBasicProf = resolvePlayerInertiaProfile(state);
    const basicWeaponSpec = resolveWeaponAttackInertiaSpec(currentWeaponId, 0, state);
    const hwStats = resolveEquippedHardwareStats(state);

    // Apply Melee Attack Recoil / Movement Restriction (§2.3, §7)
    const meleeRecoilRes = resolveRecoil({
      recoilImpulseJ: basicWeaponSpec.attackWeight * basicWeaponSpec.attackSpeed * 0.45,
      shooterFrameWeight: playerBasicProf.totalBaseWeight,
      shooterStability: playerBasicProf.stability,
    });
    if (meleeRecoilRes.restrictionSec > 0) {
      state.recoilRestrictionTimer = Math.max(
        state.recoilRestrictionTimer || 0,
        meleeRecoilRes.restrictionSec
      );
      state.recoilSpeedMult = meleeRecoilRes.speedMultiplier;
    }

    let basicHitGrantedBonus = false;
    const resolveMeleeHit = (
      e: (typeof state.enemies)[number],
      stunSec: number = 0.22,
      knockbackDist: number = 0,
      extraArmorDent: number = 0,
      shieldBypassRatio: number = 0,
      maxReach: number = 28
    ) => {
      e.hurt = 0.2;
      const hitEval = evaluatePositionalHitQuality(
        currentWeaponId,
        state.x,
        state.y,
        aimAngle,
        maxReach,
        e.x,
        e.y,
        false
      );
      const totalDent =
        extraArmorDent +
        (comboStep?.extraArmorDent || 0) +
        gemCombatMods.extraArmorDentOnHit;
      if (totalDent > 0 && e.armor.durability > 0) {
        e.armor.durability = Math.max(0, e.armor.durability - totalDent);
      }

      // Resolve Melee Inertia (`J_melee = (attack_weight + m_attacker * μ_attacker * commitment) * attack_speed`)
      const kdx = e.x - state.x;
      const kdy = e.y - state.y;
      const kNorm = Math.hypot(kdx, kdy) || 1;
      const impDx = kdx / kNorm;
      const impDy = kdy / kNorm;

      const attackerMu = computeMomentumFraction(state.vx, state.vy, impDx, impDy);
      const stepKbScale = comboStep?.knockbackScale ?? 1.0;
      const impulseJ = computeMeleeImpulse(
        basicWeaponSpec.attackWeight *
          stepKbScale *
          (1 + knockbackDist * 0.04) *
          (hitEval.quality === 'sweet' ? 1.2 : 1.0),
        basicWeaponSpec.attackSpeed,
        playerBasicProf.totalBaseWeight,
        attackerMu,
        basicWeaponSpec.commitment
      );
      const eProf = resolveEnemyInertiaProfile(e);
      const defenderMu = computeMomentumFraction(e.vx || 0, e.vy || 0, -impDx, -impDy);
      const existingSpeed = Math.hypot(e.knockbackVx || 0, e.knockbackVy || 0);
      const inertiaRes = resolveHitInertia({
        impulseJ,
        defenderWeight: eProf.baseWeight,
        defenderMu,
        defenderStability: eProf.stability,
        isRanged: false,
        defenderShieldsActive: e.shields.capacity > 0,
        existingKnockbackSpeedPx: existingSpeed,
      });

      let nextKvx = (e.knockbackVx || 0) + impDx * inertiaRes.displacementSpeedPx;
      let nextKvy = (e.knockbackVy || 0) + impDy * inertiaRes.displacementSpeedPx;
      const nextMag = Math.hypot(nextKvx, nextKvy);
      if (nextMag > INERTIA_CONSTANTS.MAX_KNOCKBACK_SPEED_PX) {
        const capScale = INERTIA_CONSTANTS.MAX_KNOCKBACK_SPEED_PX / nextMag;
        nextKvx *= capScale;
        nextKvy *= capScale;
      }
      e.knockbackVx = nextKvx;
      e.knockbackVy = nextKvy;
      e.lastInertiaOutcome = inertiaRes.outcome;
      e.lastInertiaOutcomeTimer = 0.55;
      state.hitstopTimer = Math.max(
        state.hitstopTimer || 0,
        inertiaRes.hitstopSec + hitEval.extraHitstopSec
      );

      if (inertiaRes.outcome === 'none') {
        triggerEntityFlash(e, '#94a3b8', 0.08, 'armor_deflect');
        ctx.spawnParticles(e.x, e.y, e.z + 10, 3, '#94a3b8', '');
      } else if (inertiaRes.outcome === 'knockdown') {
        e.knockdownTimer = Math.max(e.knockdownTimer || 0, inertiaRes.knockdownSec);
        e.stun = Math.max(e.stun, inertiaRes.recoverySec);
        e.state = 'stagger';
        e.stateTimer = inertiaRes.recoverySec;
        e.stateMaxTimer = inertiaRes.recoverySec;
        e.knockbackVx *= 0.3;
        e.knockbackVy *= 0.3;
        const outFmt = formatInertiaOutcomeLabel('knockdown');
        triggerEntityFlash(e, outFmt.color, 0.22, 'stagger');
        ctx.spawnParticles(e.x, e.y, e.z + 12, 8, outFmt.color, outFmt.label);
      } else {
        e.stun = Math.max(e.stun, inertiaRes.recoverySec, stunSec * 0.5);
        if (
          (inertiaRes.outcome === 'stagger' || inertiaRes.outcome === 'knockback') &&
          e.state === 'windup'
        ) {
          e.state = 'stagger';
          e.stateTimer = inertiaRes.recoverySec;
          e.stateMaxTimer = inertiaRes.recoverySec;
          const outFmt = formatInertiaOutcomeLabel(inertiaRes.outcome);
          triggerEntityFlash(e, '#ffffff', 0.16, 'stagger');
          ctx.spawnParticles(e.x, e.y, e.z + 12, 5, outFmt.color, '');
        }
      }
      if (!basicHitGrantedBonus) {
        basicHitGrantedBonus = true;
        if (gemCombatMods.heatVentOnBasicHit > 0) {
          state.heat = Math.max(0, state.heat - gemCombatMods.heatVentOnBasicHit);
        }
        if (gemCombatMods.presenceGainOnHit > 0) {
          state.presence = Math.min(100, (state.presence || 0) + gemCombatMods.presenceGainOnHit);
        }
        if (weapon?.supportPulseOnHit) {
          const sp = weapon.supportPulseOnHit;
          if (sp.shieldRestore) {
            state.shields.overloaded = false;
            state.shields.capacity = Math.min(
              state.shields.maxCapacity,
              state.shields.capacity + sp.shieldRestore
            );
          }
          if (sp.armorRestore) {
            state.armor.durability = Math.min(
              state.armor.maxDurability,
              state.armor.durability + sp.armorRestore
            );
          }
          if (sp.heatVent) {
            state.heat = Math.max(0, state.heat - sp.heatVent);
          }
        }
      }
      const oathMult = hasKnightsOath && e.faction === 'camelot' ? 1.1 : 1.0;
      const isLockedOrStaggered =
        e.id === state.lockedTargetId || e.stun > 0 || (e.knockdownTimer || 0) > 0;
      const charoiteMult = isLockedOrStaggered
        ? gemCombatMods.lockedOrStaggeredDamageMult * hwStats.staggerDamageMult
        : 1.0;
      const adaptiveMult = weapon?.adaptiveDamageTypes ? 1.12 : 1.0;
      const hasAssassinate =
        (state.equippedFeats || []).some((f) =>
          ['assassinate', 'executioners_gambit'].includes(f)
        ) && e.frame.integrity <= e.frame.maxIntegrity * 0.4;
      const execMult = hasAssassinate ? 1.2 : 1.0;
      let backstabMult = 1.0;
      if (
        (state.equippedFeats || []).some((f) =>
          ['backstab_mastery', 'ambush_predator', 'surgical_precision'].includes(f)
        )
      ) {
        const enemyFaceAng = e.attackAngle ?? 0;
        const toEnemyAng = Math.atan2(e.y - state.y, e.x - state.x);
        if (
          Math.abs(normalizeAngleDiff(toEnemyAng, enemyFaceAng)) < Math.PI * 0.45 ||
          e.stun > 0
        ) {
          backstabMult = 1.2;
        }
      }
      const effDamage = Math.round(
        shotDmg *
          hitEval.damageMult *
          oathMult *
          opticMult *
          charoiteMult *
          adaptiveMult *
          execMult *
          backstabMult
      );
      const resolvedDmgType = weapon?.adaptiveDamageTypes
        ? e.shields.capacity > 0
          ? weapon.adaptiveDamageTypes[0]
          : weapon.adaptiveDamageTypes[1]
        : action.damageType;
      const layerOpts = {
        armorBypassRatio: hitEval.armorBypassRatio,
        hitQuality: hitEval.quality,
        onFlash: (color: string, dur: number, kind: string) =>
          triggerEntityFlash(e, color, dur, kind),
      };
      if (shieldBypassRatio > 0 && e.shields.capacity > 0) {
        const bypassed = Math.max(1, Math.round(effDamage * shieldBypassRatio));
        const normalPortion = Math.max(0, effDamage - bypassed);
        if (normalPortion > 0) {
          applyDamageToLayers(
            e.shields,
            e.armor,
            e.frame,
            normalPortion,
            resolvedDmgType,
            undefined,
            layerOpts
          );
        }
        const savedShield = e.shields.capacity;
        e.shields.capacity = 0;
        applyDamageToLayers(
          e.shields,
          e.armor,
          e.frame,
          bypassed,
          resolvedDmgType,
          (count, color) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, ''),
          layerOpts
        );
        e.shields.capacity = savedShield;
      } else {
        applyDamageToLayers(
          e.shields,
          e.armor,
          e.frame,
          effDamage,
          resolvedDmgType,
          (count, color) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, ''),
          layerOpts
        );
      }
      if (hitEval.quality === 'sweet') {
        soundSystem.playPowerup();
      }
      soundSystem.playHit();
    };

    state.bladeTrails = state.bladeTrails || [];

    if (comboStep) {
      // Fluid Weapon-Unique Combo Step Execution (thrust / slash / chop / slam / bash)
      state.bladeTrails.push({
        x: state.x,
        y: state.y,
        z: state.z,
        angle: aimAngle,
        arcSpan: comboStep.arcSpan,
        radius: comboStep.radius,
        length: comboStep.length,
        width: comboStep.width,
        style: comboStep.style,
        color: trailColor,
        coreColor,
        life: Math.max(0.18, comboStep.actionDurationSec * 0.92),
        maxLife: Math.max(0.18, comboStep.actionDurationSec * 0.92),
        flipDir: comboStep.flipDir,
      });

      const bypassShieldRatio = arch.hasShieldBypassEdge ? 0.25 : 0;

      for (const e of state.enemies) {
        if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
        let isHit = false;
        let reach = comboStep.radius + 4;
        if (comboStep.style === 'thrust') {
          reach = comboStep.length || comboStep.radius;
          isHit = isTargetInThrustCorridor(
            state.x,
            state.y,
            aimAngle,
            reach,
            comboStep.width || 12,
            e.x,
            e.y
          );
        } else if (comboStep.style === 'slam') {
          reach = (comboStep.length || 16) + (comboStep.width || 18) * 0.6;
          isHit = isTargetInImpactZone(
            state.x,
            state.y,
            aimAngle,
            comboStep.length || 16,
            comboStep.width || 18,
            e.x,
            e.y
          );
        } else {
          reach = comboStep.radius + 4;
          isHit = isTargetInDirectionalArc(
            state.x,
            state.y,
            aimAngle,
            reach,
            comboStep.arcSpan + 0.14,
            e.x,
            e.y
          );
        }

        if (isHit) {
          resolveMeleeHit(
            e,
            0.22 * (comboStep.damageMult || 1),
            Math.round(3 * (comboStep.knockbackScale || 1)),
            comboStep.extraArmorDent || 0,
            bypassShieldRatio,
            reach
          );
        }
      }

      // Preserve hybrid projectiles on Beam lances and Wave mana staves
      if (arch.isLanceOrPike && weapon?.primaryDamageType === 'Beam') {
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 128,
          vy: aim.dy * 128,
          vz: 0,
          damage: shotDmg,
          damageType: action.damageType,
          isPlayer: true,
          life: 0.72,
          radius: 4.5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 24,
        });
      } else if (arch.isBluntOrStaff && weapon?.primaryDamageType === 'Wave') {
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 118,
          vy: aim.dy * 118,
          vz: 0,
          damage: Math.round(shotDmg * 0.75),
          damageType: 'Wave',
          isPlayer: true,
          life: 0.68,
          radius: 4.5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 22,
        });
      }

      ctx.spawnParticles(
        state.x + aim.dx * 15,
        state.y + aim.dy * 15,
        state.z + 6,
        5,
        trailColor,
        ''
      );
      soundSystem.playSword();
    }
  } else {
    // Ranged Basic Shot (including Single-Shot Hold-to-Charge Bows)
    const hwStats = resolveEquippedHardwareStats(state);
    const accMult =
      (loadPenalty?.accuracyMult ?? 1.0) * featMods.accuracyMult * hwStats.accuracyMult;
    const spreadRad =
      isBowWeapon && bowChargeRatio >= 0.5
        ? 0
        : accMult < 1.0
          ? (Math.random() - 0.5) * 0.22 * Math.max(0.25, 2.0 - accMult)
          : 0;
    const baseAngle = Math.atan2(aim.dy, aim.dx) + spreadRad;

    const installedRangedModId = state.equipmentSlots?.installedMods?.ranged;
    const rangedMod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === installedRangedModId);
    const extraCount = isBowWeapon ? 0 : rangedMod?.modifiers.extraProjectiles || 0;
    const offsets = extraCount > 0 ? [-0.07, 0.07] : [0];
    const projColor = gemVis.gemId ? trailColor : weapon?.bladeTrailColor || '#ffd27d';
    const projTrail = gemVis.gemId ? coreColor : '#f59e0b';

    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: baseAngle,
      arcSpan: isBowWeapon ? Math.PI * (0.42 + 0.18 * bowChargeRatio) : Math.PI * 0.35,
      radius: isBowWeapon ? Math.round(14 + 5 * bowChargeRatio) : 12,
      style: 'volley',
      color: projColor,
      coreColor: projTrail,
      life: 0.16,
      maxLife: 0.16,
    });

    if (isBowWeapon && bowChargeRatio >= 0.85) {
      ctx.spawnParticles(
        state.x + aim.dx * 12,
        state.y + aim.dy * 12,
        state.z + 8,
        7,
        '#fde047',
        'FULL DRAW!'
      );
    }

    if (gemCombatMods.heatVentOnBasicHit > 0) {
      state.heat = Math.max(0, state.heat - gemCombatMods.heatVentOnBasicHit);
    }
    if (weapon?.supportPulseOnHit) {
      const sp = weapon.supportPulseOnHit;
      if (sp.shieldRestore) {
        state.shields.overloaded = false;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + Math.max(1, Math.round(sp.shieldRestore * 0.5))
        );
      }
      if (sp.armorRestore) {
        state.armor.durability = Math.min(
          state.armor.maxDurability,
          state.armor.durability + Math.max(1, Math.round(sp.armorRestore * 0.5))
        );
      }
      if (sp.heatVent) {
        state.heat = Math.max(0, state.heat - Math.max(1, Math.round(sp.heatVent * 0.5)));
      }
    }
    const lockedTarget = getLockedTarget(state);
    const adaptiveDmgType = weapon?.adaptiveDamageTypes
      ? lockedTarget && lockedTarget.shields.capacity <= 0
        ? weapon.adaptiveDamageTypes[1]
        : weapon.adaptiveDamageTypes[0]
      : action.damageType;
    const adaptiveShotDmg = weapon?.adaptiveDamageTypes ? Math.round(shotDmg * 1.12) : shotDmg;
    const bowSpeedMult = isBowWeapon ? 1.0 + 0.42 * bowChargeRatio : 1.0;
    const projSpeedScale = clampTempoMultiplier(
      gemCombatMods.projectileSpeedMult * hwStats.accuracyMult
    );
    const baseProjSpeed = (isBowWeapon ? 142 * bowSpeedMult : 128) * projSpeedScale;
    const projLife = isBowWeapon ? 0.92 + 0.42 * bowChargeRatio : 1.02;
    const rangedPlayerProf = resolvePlayerInertiaProfile(state);
    const rangedWeaponSpec = resolveWeaponAttackInertiaSpec(currentWeaponId, 0, state);
    const recoilJ = computeRangedImpulse(rangedWeaponSpec.projectileWeight, baseProjSpeed);
    const recoilRes = resolveRecoil({
      recoilImpulseJ: recoilJ,
      shooterFrameWeight: rangedPlayerProf.totalBaseWeight,
      shooterStability: rangedPlayerProf.stability,
    });
    if (recoilRes.restrictionSec > 0) {
      state.recoilRestrictionTimer = Math.max(
        state.recoilRestrictionTimer || 0,
        recoilRes.restrictionSec
      );
      state.recoilSpeedMult = recoilRes.speedMultiplier;
      if (recoilRes.kickbackSpeedPx > 0) {
        state.knockbackVx =
          (state.knockbackVx || 0) - aim.dx * recoilRes.kickbackSpeedPx * 0.35;
        state.knockbackVy =
          (state.knockbackVy || 0) - aim.dy * recoilRes.kickbackSpeedPx * 0.35;
      }
    }

    for (const off of offsets) {
      const ang = baseAngle + off;
      state.projectiles.push({
        x: state.x + Math.cos(ang) * 8,
        y: state.y + Math.sin(ang) * 8,
        z: state.z + 6,
        vx: Math.cos(ang) * baseProjSpeed,
        vy: Math.sin(ang) * baseProjSpeed,
        vz: 0,
        damage: adaptiveShotDmg,
        damageType: adaptiveDmgType,
        isPlayer: true,
        life: projLife,
        radius: isBowWeapon ? 3.5 + bowChargeRatio * 1.5 : 3,
        color: projColor,
        trailColor: projTrail,
        lightRadius: isBowWeapon ? Math.round(18 + 10 * bowChargeRatio) : 18,
        projectileWeight:
          rangedWeaponSpec.projectileWeight * (isBowWeapon ? 0.9 + 0.45 * bowChargeRatio : 1.0),
        projectileSpeed: baseProjSpeed,
      });
    }
    soundSystem.playLaser();
  }

  if (!isMeleeOrShield && state.ammo <= 0 && weapon) {
    const reloadDur = state.reloadDuration || weapon.reloadDurationSec;
    const s1Key = getSkillCooldownKey(currentWeaponId, 0);
    state.isReloading = true;
    state.reloadTimer = reloadDur;
    state.skillReloadTimers = state.skillReloadTimers || {};
    state.skillReloadTimers[s1Key] = reloadDur;
  }
}

/**
 * Updates active projectiles, wall collisions, and ranged Inertia v0 impacts (`J_ranged = projectile_weight × projectile_speed`).
 */
export function updateProjectiles(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;

    if (Math.random() < 0.6) {
      state.particles.push({
        x: p.x + (Math.random() - 0.5) * 4,
        y: p.y + (Math.random() - 0.5) * 4,
        z: p.z + (Math.random() - 0.5) * 2,
        vx: -p.vx * 0.1,
        vy: -p.vy * 0.1,
        vz: 4,
        life: 0.18,
        maxLife: 0.18,
        color: p.trailColor,
        size: 2,
        fade: true,
      });
    }

    const tx = Math.floor(p.x / TILE_SIZE);
    const ty = Math.floor(p.y / TILE_SIZE);
    if (isSolidAt(rooms, state, tx, ty, p.z)) {
      if (p.onImpact) {
        p.onImpact(p.x, p.y, p.z, state);
      }
      state.projectiles.splice(i, 1);
      continue;
    }

    if (p.isPlayer) {
      let hit = false;
      for (const e of state.enemies) {
        if (e.isSubmerged) continue;
        if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;

        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist < 14 && Math.abs(e.z - p.z) < 14) {
          hit = true;
          e.hurt = 0.2;
          const hitEval = evaluatePositionalHitQuality(
            'ranged_projectile',
            p.x,
            p.y,
            Math.atan2(p.vy, p.vx),
            14,
            e.x,
            e.y,
            true
          );

          // Resolve Ranged Inertia (`J_ranged = projectile_weight × projectile_speed`, NO shooter weight term — §2.6, §4, §9.6)
          const projSpeed = p.projectileSpeed || Math.hypot(p.vx, p.vy) || 185;
          const projWeight =
            p.projectileWeight ??
            (p.damageType === 'Blast'
              ? INERTIA_CONSTANTS.PROJECTILE_WEIGHT_BY_CLASS.heavy
              : p.damageType === 'Beam' || p.damageType === 'Pulse'
                ? INERTIA_CONSTANTS.PROJECTILE_WEIGHT_BY_CLASS.medium
                : INERTIA_CONSTANTS.PROJECTILE_WEIGHT_BY_CLASS.light);
          const impulseJ = computeRangedImpulse(projWeight, projSpeed);
          const eProf = resolveEnemyInertiaProfile(e);
          const defenderMu = computeMomentumFraction(e.vx || 0, e.vy || 0, -p.vx, -p.vy);
          const existingSpeed = Math.hypot(e.knockbackVx || 0, e.knockbackVy || 0);
          const inertiaRes = resolveHitInertia({
            impulseJ,
            defenderWeight: eProf.baseWeight,
            defenderMu,
            defenderStability: eProf.stability,
            isRanged: true,
            defenderShieldsActive: e.shields.capacity > 0,
            existingKnockbackSpeedPx: existingSpeed,
          });

          const pNorm = Math.hypot(p.vx, p.vy) || 1;
          const impDx = p.vx / pNorm;
          const impDy = p.vy / pNorm;
          let nextKvx = (e.knockbackVx || 0) + impDx * inertiaRes.displacementSpeedPx;
          let nextKvy = (e.knockbackVy || 0) + impDy * inertiaRes.displacementSpeedPx;
          const nextMag = Math.hypot(nextKvx, nextKvy);
          if (nextMag > INERTIA_CONSTANTS.MAX_KNOCKBACK_SPEED_PX) {
            const capScale = INERTIA_CONSTANTS.MAX_KNOCKBACK_SPEED_PX / nextMag;
            nextKvx *= capScale;
            nextKvy *= capScale;
          }
          e.knockbackVx = nextKvx;
          e.knockbackVy = nextKvy;
          e.lastInertiaOutcome = inertiaRes.outcome;
          e.lastInertiaOutcomeTimer = 0.55;
          state.hitstopTimer = Math.max(
            state.hitstopTimer || 0,
            inertiaRes.hitstopSec + hitEval.extraHitstopSec
          );

          if (inertiaRes.outcome === 'none') {
            triggerEntityFlash(e, '#94a3b8', 0.08, 'armor_deflect');
            ctx.spawnParticles(e.x, e.y, e.z + 10, 3, '#94a3b8', '');
          } else if (inertiaRes.outcome === 'knockdown') {
            e.knockdownTimer = Math.max(e.knockdownTimer || 0, inertiaRes.knockdownSec);
            e.stun = Math.max(e.stun, inertiaRes.recoverySec);
            e.state = 'stagger';
            e.stateTimer = inertiaRes.recoverySec;
            e.stateMaxTimer = inertiaRes.recoverySec;
            e.knockbackVx *= 0.25;
            e.knockbackVy *= 0.25;
            const outFmt = formatInertiaOutcomeLabel('knockdown');
            triggerEntityFlash(e, outFmt.color, 0.22, 'stagger');
            ctx.spawnParticles(e.x, e.y, e.z + 12, 8, outFmt.color, outFmt.label);
          } else {
            e.stun = Math.max(e.stun, inertiaRes.recoverySec);
            if (
              (inertiaRes.outcome === 'stagger' || inertiaRes.outcome === 'knockback') &&
              e.state === 'windup'
            ) {
              e.state = 'stagger';
              e.stateTimer = inertiaRes.recoverySec;
              e.stateMaxTimer = inertiaRes.recoverySec;
              const outFmt = formatInertiaOutcomeLabel(inertiaRes.outcome);
              triggerEntityFlash(e, '#ffffff', 0.16, 'stagger');
              ctx.spawnParticles(e.x, e.y, e.z + 12, 5, outFmt.color, '');
            }
          }

          const hasKnightsOath = state.equippedFeats.includes('knights_oath');
          const oathMult = hasKnightsOath && e.faction === 'camelot' ? 1.1 : 1.0;
          const opticMult = (state.opticMarkTimer || 0) > 0 ? 1.25 : 1.0;
          const hasBeamFocus =
            p.damageType === 'Beam' &&
            state.equippedFeats.some((f) =>
              ['beam_focus', 'sustained_channeling', 'solar_convergence'].includes(f)
            );
          const beamMult = hasBeamFocus ? 1.15 : 1.0;
          const hasAssassinate =
            state.equippedFeats.some((f) => ['assassinate', 'executioners_gambit'].includes(f)) &&
            e.frame.integrity <= e.frame.maxIntegrity * 0.4;
          const execMult = hasAssassinate ? 1.2 : 1.0;
          const effDamage = Math.round(
            p.damage * hitEval.damageMult * oathMult * opticMult * beamMult * execMult
          );

          applyDamageToLayers(
            e.shields,
            e.armor,
            e.frame,
            effDamage,
            p.damageType,
            (count, color) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, ''),
            {
              armorBypassRatio: hitEval.armorBypassRatio,
              hitQuality: hitEval.quality,
              onFlash: (color, dur, kind) => triggerEntityFlash(e, color, dur, kind),
            }
          );

          if (hitEval.quality === 'sweet') {
            soundSystem.playPowerup();
          }
          soundSystem.playHit();

          if (p.onImpact) {
            p.onImpact(p.x, p.y, p.z, state);
          }
          break;
        }
      }

      if (hit) {
        state.projectiles.splice(i, 1);
        continue;
      }
    } else {
      const dist = Math.hypot(state.x - p.x, state.y - p.y);
      if (dist < 12 && Math.abs(state.z - p.z) < 12 && !state.isBoosterDashing) {
        const isPerfectBlock = Boolean(
          state.isHoldingBlock && (state.blockHoldTimer || 0) <= PERFECT_BLOCK_WINDOW_SEC
        );
        const isGuarding = Boolean(state.isHoldingBlock || (state.blockTimer || 0) > 0);

        if (isPerfectBlock) {
          soundSystem.playPowerup();
          triggerEntityFlash(state, '#fde047', 0.16, 'parry');
          state.hitstopTimer = Math.max(state.hitstopTimer || 0, 0.05);
          state.shields.capacity = Math.min(
            state.shields.maxCapacity,
            state.shields.capacity + 10
          );
          state.heat = Math.max(0, state.heat - 8);
          ctx.spawnParticles(state.x, state.y, state.z + 10, 8, '#fde047', '');
        } else {
          soundSystem.playHit();
          const finalProjDamage = isGuarding
            ? Math.max(1, Math.round(p.damage * 0.35))
            : p.damage;
          if (isGuarding) {
            triggerEntityFlash(state, '#38bdf8', 0.1, 'shield');
            ctx.spawnParticles(state.x, state.y, state.z + 8, 4, '#38bdf8', '');
          } else {
            const projSpeed = p.projectileSpeed || Math.hypot(p.vx, p.vy) || 155;
            const projWeight = p.projectileWeight ?? 14;
            const impulseJ = computeRangedImpulse(projWeight, projSpeed);
            const playerProf = resolvePlayerInertiaProfile(state);
            const defenderMu = computeMomentumFraction(state.vx, state.vy, -p.vx, -p.vy);
            const existingPlayerKb = Math.hypot(state.knockbackVx || 0, state.knockbackVy || 0);
            const inertiaRes = resolveHitInertia({
              impulseJ,
              defenderWeight: playerProf.totalBaseWeight,
              defenderMu,
              defenderStability: playerProf.stability,
              isRanged: true,
              defenderShieldsActive: state.shields.capacity > 0,
              existingKnockbackSpeedPx: existingPlayerKb,
            });
            const pNorm = Math.hypot(p.vx, p.vy) || 1;
            let nextKvx =
              (state.knockbackVx || 0) + (p.vx / pNorm) * inertiaRes.displacementSpeedPx;
            let nextKvy =
              (state.knockbackVy || 0) + (p.vy / pNorm) * inertiaRes.displacementSpeedPx;
            const nextMag = Math.hypot(nextKvx, nextKvy);
            if (nextMag > INERTIA_CONSTANTS.MAX_KNOCKBACK_SPEED_PX) {
              const capScale = INERTIA_CONSTANTS.MAX_KNOCKBACK_SPEED_PX / nextMag;
              nextKvx *= capScale;
              nextKvy *= capScale;
            }
            state.knockbackVx = nextKvx;
            state.knockbackVy = nextKvy;
            state.lastInertiaOutcome = inertiaRes.outcome;
            state.lastInertiaOutcomeTimer = 0.65;
            state.lastImpactDv = inertiaRes.dv;
            state.lastImpactDvEff = inertiaRes.dvEff;
            state.hitstopTimer = Math.max(state.hitstopTimer || 0, inertiaRes.hitstopSec);

            if (inertiaRes.outcome === 'none') {
              triggerEntityFlash(state, '#94a3b8', 0.08, 'armor_deflect');
              ctx.spawnParticles(state.x, state.y, state.z + 10, 3, '#94a3b8', '');
            } else if (inertiaRes.outcome === 'flinch') {
              state.staggerRecoveryTimer = Math.max(
                state.staggerRecoveryTimer || 0,
                inertiaRes.recoverySec
              );
              state.isContinuousBoosting = false;
              state.isBoosterDashing = false;
            } else {
              if (inertiaRes.outcome === 'knockdown') {
                state.knockdownTimer = Math.max(
                  state.knockdownTimer || 0,
                  inertiaRes.knockdownSec
                );
                state.knockbackVx *= 0.25;
                state.knockbackVy *= 0.25;
              }
              state.staggerRecoveryTimer = Math.max(
                state.staggerRecoveryTimer || 0,
                inertiaRes.recoverySec
              );
              state.isContinuousBoosting = false;
              state.isBoosterDashing = false;
              state.glidePhase = 'winddown';
              if (state.skillTellTimer > 0) {
                state.skillTellTimer = 0;
                state.skillActionTimer = 0;
                state.activeSkillSlot = null;
                state.activeActionId = null;
              }
              const outFmt = formatInertiaOutcomeLabel(inertiaRes.outcome);
              triggerEntityFlash(state, '#ffffff', 0.16, 'stagger');
              ctx.spawnParticles(
                state.x,
                state.y,
                state.z + 12,
                5,
                outFmt.color,
                inertiaRes.outcome === 'knockdown' ? outFmt.label : ''
              );
            }
          }
          applyDamageToLayers(
            state.shields,
            state.armor,
            state.frame,
            finalProjDamage,
            p.damageType,
            (count, color) =>
              ctx.spawnParticles(state.x, state.y, state.z + 8, count, color, ''),
            {
              onFlash: (color, dur, kind) => triggerEntityFlash(state, color, dur, kind),
            }
          );
        }

        if (p.onImpact) {
          p.onImpact(p.x, p.y, p.z, state);
        }
        state.projectiles.splice(i, 1);
        continue;
      }
    }

    if (p.life <= 0) {
      state.projectiles.splice(i, 1);
    }
  }
}
