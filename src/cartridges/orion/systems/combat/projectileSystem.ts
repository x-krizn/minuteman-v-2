/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { TILE_SIZE } from '../../constants';
import { getWeaponDefinition } from '../../database/equipment/weapons';
import {
  ACTION_MODIFICATION_CATALOG,
  computeInterfaceFeatModifiers,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
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

export function firePrimarySalvoShot(
  state: OrionState,
  _ctx: OrionCombatContext,
  _isAuto: boolean
): boolean {
  const currentWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const weapon = getWeaponDefinition(currentWeaponId);
  if (!weapon) return false;

  const isMeleeOrShield =
    weapon.equipmentRole === 'melee' ||
    weapon.equipmentRole === 'shield' ||
    currentWeaponId === 'khopesh';

  const s1Key = getSkillCooldownKey(currentWeaponId, 0);

  if (state.ammo <= 0) {
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
  const tellMult = !isMeleeOrShield ? (rangedMod?.modifiers.tellDurationMult ?? 1.0) : 1.0;

  const skill0 = weapon.moveset[0];
  state.activeSkillSlot = 0;
  state.activeActionId = null;
  state.activeSkillCooldownKey = s1Key;
  state.skillTellTimer = Math.max(0.04, skill0.tellDurationSec * tellMult);
  state.skillTellMaxTimer = state.skillTellTimer;
  const perShotAction = isMeleeOrShield
    ? Math.max(
        0.18,
        weapon.chainDurationSec / Math.max(1, weapon.shotsPerChain) - skill0.tellDurationSec
      )
    : Math.max(
        0.08,
        weapon.chainDurationSec / Math.max(1, weapon.shotsPerChain) - skill0.tellDurationSec
      );
  state.skillActionTimer = perShotAction;
  state.skillActionMaxTimer = perShotAction;
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
  const isMeleeOrShield =
    weapon?.equipmentRole === 'melee' ||
    weapon?.equipmentRole === 'shield' ||
    currentWeaponId === 'khopesh';
  const gemVis = getWeaponGemVisuals(state, currentWeaponId);
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const loadPenalty = state.gates?.loadPenalty;
  const action = weapon?.moveset[0];
  const aim = getCombatAimVector(state);
  const gemCombatMods = getWeaponGemCombatModifiers(state, currentWeaponId);
  const overdriveMult =
    ((state.overdriveTimer || 0) > 0 ? 1.3 : 1.0) *
    featMods.damageMult *
    gemCombatMods.damageMult;

  if (!action || state.ammo <= 0) return;

  state.ammo -= 1;
  const shotHeat =
    action.heatCost * (loadPenalty?.heatMult ?? 1.0) * featMods.heatGenMult;
  state.heat = Math.min(state.maxHeat, state.heat + shotHeat);
  const shotDmg = Math.round(action.damage * overdriveMult);

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
    const basicWeaponSpec = resolveWeaponAttackInertiaSpec(currentWeaponId, 0);

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
      const totalDent = extraArmorDent + gemCombatMods.extraArmorDentOnHit;
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
      const impulseJ = computeMeleeImpulse(
        basicWeaponSpec.attackWeight *
          (1 + knockbackDist * 0.04) *
          (hitEval.quality === 'sweet' ? 1.2 : 1.0),
        basicWeaponSpec.attackSpeed,
        playerBasicProf.totalBaseWeight,
        attackerMu,
        basicWeaponSpec.commitment
      );
      const eProf = resolveEnemyInertiaProfile(e);
      const defenderMu = computeMomentumFraction(e.vx || 0, e.vy || 0, -impDx, -impDy);
      const inertiaRes = resolveHitInertia({
        impulseJ,
        defenderWeight: eProf.baseWeight,
        defenderMu,
        defenderStability: eProf.stability,
      });

      e.knockbackVx = (e.knockbackVx || 0) + impDx * inertiaRes.displacementSpeedPx;
      e.knockbackVy = (e.knockbackVy || 0) + impDy * inertiaRes.displacementSpeedPx;
      e.lastInertiaOutcome = inertiaRes.outcome;
      e.lastInertiaOutcomeTimer = 0.55;
      state.hitstopTimer = Math.max(
        state.hitstopTimer || 0,
        inertiaRes.hitstopSec + hitEval.extraHitstopSec
      );

      if (inertiaRes.outcome === 'none') {
        triggerEntityFlash(e, '#94a3b8', 0.08, 'armor_deflect');
        ctx.spawnParticles(e.x, e.y, e.z + 10, 3, '#94a3b8', '');
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
      const isLockedOrStaggered = e.id === state.lockedTargetId || e.stun > 0;
      const charoiteMult = isLockedOrStaggered ? gemCombatMods.lockedOrStaggeredDamageMult : 1.0;
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

    if (currentWeaponId === 'short_spear' || currentWeaponId === 'ls900_swordspear') {
      const jitter = ((state.ammo % 3) - 1) * 0.04;
      state.bladeTrails.push({
        x: state.x,
        y: state.y,
        z: state.z,
        angle: aimAngle + jitter,
        arcSpan: Math.PI * 0.24,
        radius: 38,
        length: 40,
        width: 10,
        style: 'thrust',
        color: trailColor,
        coreColor,
        life: 0.2,
        maxLife: 0.2,
        flipDir: state.ammo % 2 === 0,
      });
      for (const e of state.enemies) {
        if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
        if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 40, 12, e.x, e.y)) {
          resolveMeleeHit(e, 0.22, 3, 0, 0, 40);
        }
      }
      ctx.spawnParticles(
        state.x + aim.dx * 22,
        state.y + aim.dy * 22,
        state.z + 6,
        5,
        trailColor,
        ''
      );
      soundSystem.playSword();
    } else if (
      currentWeaponId === 'avalon_siege_lance' ||
      currentWeaponId === 'hl220_lightburst_lance'
    ) {
      state.bladeTrails.push({
        x: state.x,
        y: state.y,
        z: state.z,
        angle: aimAngle,
        arcSpan: Math.PI * 0.28,
        radius: 36,
        length: 38,
        width: 12,
        style: 'thrust',
        color: trailColor,
        coreColor,
        life: 0.24,
        maxLife: 0.24,
      });
      for (const e of state.enemies) {
        if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
        if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 38, 13, e.x, e.y)) {
          resolveMeleeHit(e, 0.35, 8, 0, 0, 38);
        }
      }
      state.projectiles.push({
        x: state.x + aim.dx * 12,
        y: state.y + aim.dy * 12,
        z: state.z + 6,
        vx: aim.dx * 175,
        vy: aim.dy * 175,
        vz: 0,
        damage: shotDmg,
        damageType: action.damageType,
        isPlayer: true,
        life: 0.55,
        radius: 4.5,
        color: trailColor,
        trailColor: coreColor,
        lightRadius: 24,
      });
      soundSystem.playSword();
    } else if (
      currentWeaponId === 'mace' ||
      currentWeaponId === 'wz200_manacore_staff' ||
      currentWeaponId === 'hallowed_scepter'
    ) {
      state.bladeTrails.push({
        x: state.x,
        y: state.y,
        z: state.z,
        angle: aimAngle,
        arcSpan: Math.PI * 0.58,
        radius: 22,
        length: 16,
        width: 18,
        style: 'slam',
        color: trailColor,
        coreColor,
        life: 0.24,
        maxLife: 0.24,
        flipDir: state.ammo % 2 === 0,
      });
      for (const e of state.enemies) {
        if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
        if (isTargetInImpactZone(state.x, state.y, aimAngle, 16, 20, e.x, e.y)) {
          resolveMeleeHit(e, 0.34, 5, 4, 0, 26);
        }
      }
      if (
        currentWeaponId === 'wz200_manacore_staff' ||
        currentWeaponId === 'hallowed_scepter'
      ) {
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 165,
          vy: aim.dy * 165,
          vz: 0,
          damage: Math.round(shotDmg * 0.75),
          damageType: 'Wave',
          isPlayer: true,
          life: 0.5,
          radius: 4.5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 22,
        });
      }
      ctx.spawnParticles(
        state.x + aim.dx * 15,
        state.y + aim.dy * 15,
        state.z + 4,
        6,
        trailColor,
        ''
      );
      soundSystem.playSword();
    } else if (currentWeaponId === 'hand_axe' || currentWeaponId === 'siegebreaker') {
      const isSiegebreaker = currentWeaponId === 'siegebreaker';
      state.bladeTrails.push({
        x: state.x,
        y: state.y,
        z: state.z,
        angle: aimAngle,
        arcSpan: isSiegebreaker ? Math.PI * 0.75 : Math.PI * 0.62,
        radius: isSiegebreaker ? 26 : 21,
        width: isSiegebreaker ? 16 : 13,
        style: 'chop',
        color: trailColor,
        coreColor,
        life: 0.22,
        maxLife: 0.22,
        flipDir: state.ammo % 2 === 0,
      });
      for (const e of state.enemies) {
        if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
        if (
          isTargetInDirectionalArc(
            state.x,
            state.y,
            aimAngle,
            isSiegebreaker ? 30 : 25,
            isSiegebreaker ? Math.PI * 0.8 : Math.PI * 0.7,
            e.x,
            e.y
          )
        ) {
          resolveMeleeHit(
            e,
            isSiegebreaker ? 0.35 : 0.25,
            isSiegebreaker ? 6 : 4,
            isSiegebreaker ? 5 : 2,
            0,
            isSiegebreaker ? 30 : 25
          );
        }
      }
      ctx.spawnParticles(
        state.x + aim.dx * 13,
        state.y + aim.dy * 13,
        state.z + 6,
        5,
        trailColor,
        ''
      );
      soundSystem.playSword();
    } else if (weapon?.equipmentRole === 'shield') {
      const bashRadius =
        currentWeaponId === 'pavise_shield'
          ? 24
          : currentWeaponId === 'heater_shield'
            ? 21
            : 19;
      const bashArc =
        currentWeaponId === 'pavise_shield'
          ? Math.PI * 0.75
          : currentWeaponId === 'heater_shield'
            ? Math.PI * 0.65
            : Math.PI * 0.55;
      state.bladeTrails.push({
        x: state.x,
        y: state.y,
        z: state.z,
        angle: aimAngle,
        arcSpan: bashArc,
        radius: bashRadius,
        width: currentWeaponId === 'pavise_shield' ? 18 : 14,
        style: 'bash',
        color: trailColor,
        coreColor,
        life: 0.22,
        maxLife: 0.22,
        flipDir: state.ammo % 2 === 0,
      });
      for (const e of state.enemies) {
        if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
        if (
          isTargetInDirectionalArc(
            state.x,
            state.y,
            aimAngle,
            bashRadius + 4,
            bashArc + 0.15,
            e.x,
            e.y
          )
        ) {
          resolveMeleeHit(e, 0.38, currentWeaponId === 'pavise_shield' ? 10 : 7, 2, 0, bashRadius + 4);
        }
      }
      ctx.spawnParticles(
        state.x + aim.dx * 11,
        state.y + aim.dy * 11,
        state.z + 6,
        5,
        trailColor,
        ''
      );
      soundSystem.playSword();
    } else {
      const isLongBlade =
        currentWeaponId === 'long_sword' ||
        currentWeaponId === 'tig_edge' ||
        currentWeaponId === 'grace_edge';
      const slashRadius = isLongBlade ? 26 : 22;
      const slashArc = isLongBlade ? Math.PI * 1.02 : Math.PI * 0.82;
      state.bladeTrails.push({
        x: state.x,
        y: state.y,
        z: state.z,
        angle: aimAngle,
        arcSpan: slashArc,
        radius: slashRadius,
        style: 'slash',
        color: trailColor,
        coreColor,
        life: 0.22,
        maxLife: 0.22,
        flipDir: state.ammo % 2 === 0,
      });
      for (const e of state.enemies) {
        if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
        if (
          isTargetInDirectionalArc(
            state.x,
            state.y,
            aimAngle,
            slashRadius + 4,
            slashArc + 0.12,
            e.x,
            e.y
          )
        ) {
          const bypassShieldRatio =
            currentWeaponId === 'khopesh' ||
            currentWeaponId === 's2_turbine_khopesh' ||
            currentWeaponId === 's4_whisper_blade' ||
            currentWeaponId === 's6_phantom_edge'
              ? 0.25
              : 0;
          resolveMeleeHit(e, 0.22, isLongBlade ? 4 : 2, 0, bypassShieldRatio, slashRadius + 4);
        }
      }
      ctx.spawnParticles(
        state.x + aim.dx * 14,
        state.y + aim.dy * 14,
        state.z + 6,
        5,
        trailColor,
        ''
      );
      soundSystem.playSword();
    }
  } else {
    // Ranged Basic Shot
    const accMult = (loadPenalty?.accuracyMult ?? 1.0) * featMods.accuracyMult;
    const spreadRad = accMult < 1.0 ? (Math.random() - 0.5) * 0.22 : 0;
    const baseAngle = Math.atan2(aim.dy, aim.dx) + spreadRad;

    const installedRangedModId = state.equipmentSlots?.installedMods?.ranged;
    const rangedMod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === installedRangedModId);
    const extraCount = rangedMod?.modifiers.extraProjectiles || 0;
    const offsets = extraCount > 0 ? [-0.07, 0.07] : [0];
    const projColor = gemVis.gemId ? trailColor : weapon?.bladeTrailColor || '#ffd27d';
    const projTrail = gemVis.gemId ? coreColor : '#f59e0b';

    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: baseAngle,
      arcSpan: currentWeaponId === 'great_bow' ? Math.PI * 0.45 : Math.PI * 0.35,
      radius: currentWeaponId === 'great_bow' ? 15 : 12,
      style: 'volley',
      color: projColor,
      coreColor: projTrail,
      life: 0.15,
      maxLife: 0.15,
    });

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
    const baseProjSpeed =
      (currentWeaponId === 'great_bow' ? 210 : 185) * gemCombatMods.projectileSpeedMult;
    const rangedPlayerProf = resolvePlayerInertiaProfile(state);
    const rangedWeaponSpec = resolveWeaponAttackInertiaSpec(currentWeaponId, 0);
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
        life: 0.75,
        radius: currentWeaponId === 'great_bow' ? 4 : 3,
        color: projColor,
        trailColor: projTrail,
        lightRadius: 18,
        projectileWeight: rangedWeaponSpec.projectileWeight,
        projectileSpeed: baseProjSpeed,
      });
    }
    soundSystem.playLaser();
  }

  if (state.ammo <= 0 && weapon) {
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
          const inertiaRes = resolveHitInertia({
            impulseJ,
            defenderWeight: eProf.baseWeight,
            defenderMu,
            defenderStability: eProf.stability,
          });

          const pNorm = Math.hypot(p.vx, p.vy) || 1;
          const impDx = p.vx / pNorm;
          const impDy = p.vy / pNorm;
          e.knockbackVx = (e.knockbackVx || 0) + impDx * inertiaRes.displacementSpeedPx;
          e.knockbackVy = (e.knockbackVy || 0) + impDy * inertiaRes.displacementSpeedPx;
          e.lastInertiaOutcome = inertiaRes.outcome;
          e.lastInertiaOutcomeTimer = 0.55;
          state.hitstopTimer = Math.max(
            state.hitstopTimer || 0,
            inertiaRes.hitstopSec + hitEval.extraHitstopSec
          );

          if (inertiaRes.outcome === 'none') {
            triggerEntityFlash(e, '#94a3b8', 0.08, 'armor_deflect');
            ctx.spawnParticles(e.x, e.y, e.z + 10, 3, '#94a3b8', '');
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
            const projWeight = p.projectileWeight ?? 22;
            const impulseJ = computeRangedImpulse(projWeight, projSpeed);
            const playerProf = resolvePlayerInertiaProfile(state);
            const defenderMu = computeMomentumFraction(state.vx, state.vy, -p.vx, -p.vy);
            const inertiaRes = resolveHitInertia({
              impulseJ,
              defenderWeight: playerProf.totalBaseWeight,
              defenderMu,
              defenderStability: playerProf.stability,
            });
            const pNorm = Math.hypot(p.vx, p.vy) || 1;
            state.knockbackVx =
              (state.knockbackVx || 0) + (p.vx / pNorm) * inertiaRes.displacementSpeedPx;
            state.knockbackVy =
              (state.knockbackVy || 0) + (p.vy / pNorm) * inertiaRes.displacementSpeedPx;
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
              ctx.spawnParticles(state.x, state.y, state.z + 12, 5, outFmt.color, '');
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
