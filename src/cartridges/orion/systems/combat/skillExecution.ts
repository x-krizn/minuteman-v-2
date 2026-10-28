/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { WEAPON_SWAP_COOLDOWN } from '../../constants';
import {
  getClassUtilityDefinition,
  getResolvedActionDescriptor,
} from '../../database/equipment';
import {
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isBlockingWeapon,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
} from '../../database/equipment/weapons';
import { getItemDefinition } from '../../database/items';
import {
  computeInterfaceFeatModifiers,
  getEffectiveMainGrip,
  getOwnedWeaponCount,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
} from '../../database/progression';
import {
  ArmorState,
  DamageType,
  FrameState,
  OrionCombatContext,
  OrionState,
  ShieldState,
  WeaponStanceType,
} from '../../types';
import {
  computeMeleeImpulse,
  computeMomentumFraction,
  computeRangedImpulse,
  formatInertiaOutcomeLabel,
  resolveEnemyInertiaProfile,
  resolveHitInertia,
  resolvePlayerInertiaProfile,
  resolveRecoil,
  resolveWeaponAttackInertiaSpec,
} from '../inertiaSystem';
import { getActiveRoomBounds, notifyOrionStateChange } from '../playerSystem';
import {
  getCombatAimVector,
  getLockedTarget,
  isTargetInDirectionalArc,
  isTargetInImpactZone,
  isTargetInThrustCorridor,
  normalizeAngleDiff,
} from './combatHelpers';
import { PERFECT_BLOCK_WINDOW_SEC } from './damageSystem';

// ─── 1. ASSIGNABLE [L] & [R] MULTI-SOURCE ACTIONS ────────────────────────────

export function isActionUnlocked(
  state: OrionState,
  actionId: string
): { unlocked: boolean; reason: string } {
  if (state.bypassProgressionGates) {
    return { unlocked: true, reason: 'UNLOCKED (GATE BYPASS)' };
  }

  const desc = getResolvedActionDescriptor(state, actionId);
  const gates = state.gates;
  const lvl = state.level || 1;
  const isSet2 = state.activeWeaponIndex > 0;

  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    const unlockedSlots = gates?.unlockedSkillSlots ?? [0];
    if (unlockedSlots.includes(desc.weaponSkillSlot)) {
      return { unlocked: true, reason: 'READY' };
    }
    const actionNum = desc.weaponSkillSlot + 1;
    const reqLvl = isSet2
      ? actionNum <= 2
        ? 3
        : 4
      : actionNum === 2
        ? 2
        : 3;
    return {
      unlocked: false,
      reason: `UNLOCKS AT LEVEL ${reqLvl} (SET ${isSet2 ? 2 : 1} ACTION ${actionNum})`,
    };
  }

  if (desc.sourceCategory === 'hardware') {
    if (desc.hardwareSlot === 'Legs') {
      if (gates?.legsSlotActive || lvl >= 2) {
        return { unlocked: true, reason: 'READY (LEGS SLOT · LVL 2)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 2 (LEGS SLOT / POE)' };
    }
    if (desc.hardwareSlot === 'Head') {
      if (gates?.headSlotActive || lvl >= 3) {
        return { unlocked: true, reason: 'READY (HEAD SLOT · LVL 3)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 3 (HEAD SLOT / BORDER TOWN)' };
    }
    if (desc.hardwareSlot === 'Torso') {
      if ((gates?.auxSlotsUnlocked ?? 0) >= 2 || lvl >= 4) {
        return { unlocked: true, reason: 'READY (AUX SLOTS 1–2 · LVL 4)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 4 (AUX SLOTS 1–2)' };
    }
    if (desc.hardwareSlot === 'Arms') {
      if (gates?.armsSlotActive || lvl >= 5) {
        return { unlocked: true, reason: 'READY (ARMS SLOT & AUX 3–4 · LVL 5)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 5 (ARMS SLOT & AUX 3–4)' };
    }
  }

  if (desc.sourceCategory === 'reactor') {
    if (gates?.generatorSlotActive || lvl >= 4) {
      return { unlocked: true, reason: 'READY (GENERATOR SLOT · LVL 4)' };
    }
    return { unlocked: false, reason: 'UNLOCKS AT LEVEL 4 (GENERATOR SLOT)' };
  }

  if (desc.sourceCategory === 'utility') {
    if (gates?.utilitySlotActive || lvl >= 6) {
      return { unlocked: true, reason: 'READY (UTILITY SLOT [ACTION 6] · LVL 6)' };
    }
    return {
      unlocked: false,
      reason: 'UNLOCKS AT LEVEL 6 (BORDER TOWN COMPLETE · UTILITY SLOT)',
    };
  }

  if (desc.sourceCategory === 'belt') {
    const idx = desc.beltSlotIndex ?? 0;
    const reqLvl = idx === 0 || idx === 1 ? 1 : 2;
    if (lvl >= reqLvl || (gates?.beltSlotsUnlocked ?? 2) > idx) {
      return { unlocked: true, reason: `READY (BELT SLOT ${idx + 1} · LVL ${reqLvl})` };
    }
    return {
      unlocked: false,
      reason: `UNLOCKS AT LEVEL ${reqLvl} (BELT SLOT ${idx + 1} · POE / SCOUT)`,
    };
  }

  return { unlocked: true, reason: 'READY' };
}

export function assignTriggerAction(
  state: OrionState,
  trigger: 'L' | 'R',
  actionId: string
): void {
  state.assignedActions = state.assignedActions || {
    L: 'weapon_skill_1',
    R: 'weapon_skill_2',
  };
  state.assignedActions[trigger] = actionId;
  notifyOrionStateChange();
}

export function resetTriggerActionsToDefault(state: OrionState): void {
  state.assignedActions = {
    L: 'weapon_skill_1',
    R: 'weapon_skill_2',
  };
  notifyOrionStateChange();
}

export function getActionCooldown(state: OrionState, actionId: string): number {
  const desc = getResolvedActionDescriptor(state, actionId);
  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    return Math.max(
      0,
      state.skillCooldowns[desc.weaponSkillSlot] || 0,
      state.actionCooldowns?.[actionId] || 0
    );
  }
  return Math.max(0, state.actionCooldowns?.[actionId] || 0);
}

// [ORION-ANCHOR: COMBAT-ACTION-PAYLOAD]
export function executeActionPayload(
  state: OrionState,
  ctx: OrionCombatContext,
  actionId: string,
  applyDamageFn: (
    shields: ShieldState,
    armor: ArmorState,
    frame: FrameState,
    rawDamage: number,
    damageType: DamageType,
    spawnParticles?: (count: number, color: string, label: string) => void
  ) => void
): void {
  const desc = getResolvedActionDescriptor(state, actionId);
  const aim = getCombatAimVector(state);
  const aimAngle = Math.atan2(aim.dy, aim.dx);
  const currentWeaponId =
    desc.weaponId ||
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const weapon = getWeaponDefinition(currentWeaponId);
  const isMeleeOrShield =
    weapon?.equipmentRole === 'melee' ||
    weapon?.equipmentRole === 'shield' ||
    currentWeaponId === 'khopesh';
  const gemVis = getWeaponGemVisuals(state, currentWeaponId);
  const trailColor = gemVis.gemId
    ? gemVis.color
    : weapon?.bladeTrailColor || (isMeleeOrShield ? '#e879f9' : '#77c7ff');
  const coreColor = gemVis.gemId ? gemVis.coreColor : '#ffffff';

  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const gemCombatMods = getWeaponGemCombatModifiers(state, currentWeaponId);
  const overdriveMult =
    ((state.overdriveTimer || 0) > 0 ? 1.3 : 1.0) *
    featMods.damageMult *
    gemCombatMods.damageMult;
  const opticMult = (state.opticMarkTimer || 0) > 0 ? 1.25 : 1.0;
  const hasKnightsOath = state.equippedFeats.includes('knights_oath');
  const equippedFeats = state.equippedFeats || [];

  const computeEnemyDamage = (
    baseDmg: number,
    faction?: string,
    target?: (typeof state.enemies)[number],
    dmgType?: DamageType
  ) => {
    const oathMult = hasKnightsOath && faction === 'camelot' ? 1.1 : 1.0;
    const isLockedOrStaggered =
      target && (target.id === state.lockedTargetId || target.stun > 0);
    const charoiteMult = isLockedOrStaggered
      ? gemCombatMods.lockedOrStaggeredDamageMult
      : 1.0;
    const hasBeamFocus =
      dmgType === 'Beam' &&
      equippedFeats.some((f) =>
        ['beam_focus', 'sustained_channeling', 'solar_convergence'].includes(f)
      );
    const beamMult = hasBeamFocus ? 1.15 : 1.0;
    const hasAssassinate =
      target &&
      equippedFeats.some((f) => ['assassinate', 'executioners_gambit'].includes(f)) &&
      target.frame.integrity <= target.frame.maxIntegrity * 0.4;
    const execMult = hasAssassinate ? 1.2 : 1.0;
    let backstabMult = 1.0;
    if (
      target &&
      equippedFeats.some((f) =>
        ['backstab_mastery', 'ambush_predator', 'surgical_precision'].includes(f)
      )
    ) {
      const enemyFaceAng = target.attackAngle ?? 0;
      const toEnemyAng = Math.atan2(target.y - state.y, target.x - state.x);
      if (Math.abs(normalizeAngleDiff(toEnemyAng, enemyFaceAng)) < Math.PI * 0.45 || target.stun > 0) {
        backstabMult = 1.22;
      }
    }
    return Math.round(
      baseDmg * overdriveMult * opticMult * oathMult * charoiteMult * beamMult * execMult * backstabMult
    );
  };

  const playerInertiaProf = resolvePlayerInertiaProfile(state);
  const activeSlotNum = desc.weaponSkillSlot || 1;
  const weaponInertiaSpec = resolveWeaponAttackInertiaSpec(currentWeaponId, activeSlotNum);

  // Apply Weapon / Attack Recoil (§7 of `inertia-v0.md`: J_recoil / m_shooter_frame, no μ bonus)
  if (desc.sourceCategory === 'weapon') {
    const recoilJ = weaponInertiaSpec.isMelee
      ? weaponInertiaSpec.attackWeight * weaponInertiaSpec.attackSpeed * 0.55
      : computeRangedImpulse(
          weaponInertiaSpec.projectileWeight,
          weaponInertiaSpec.projectileSpeed
        );
    const recoilRes = resolveRecoil({
      recoilImpulseJ: recoilJ,
      shooterFrameWeight: playerInertiaProf.totalBaseWeight,
      shooterStability: playerInertiaProf.stability,
    });
    if (recoilRes.restrictionSec > 0) {
      state.recoilRestrictionTimer = Math.max(
        state.recoilRestrictionTimer || 0,
        recoilRes.restrictionSec
      );
      state.recoilSpeedMult = recoilRes.speedMultiplier;
      if (!weaponInertiaSpec.isMelee && recoilRes.kickbackSpeedPx > 0) {
        state.knockbackVx = (state.knockbackVx || 0) - aim.dx * recoilRes.kickbackSpeedPx * 0.4;
        state.knockbackVy = (state.knockbackVy || 0) - aim.dy * recoilRes.kickbackSpeedPx * 0.4;
      }
    }
  }

  let skillHitGrantedBonus = false;
  const applyHitToEnemy = (
    e: (typeof state.enemies)[number],
    baseDmg: number,
    dmgType: DamageType,
    stunSec: number = 0.35,
    knockbackDist: number = 0,
    extraArmorDent: number = 0
  ) => {
    e.hurt = 0.22;
    const totalArmorDent = extraArmorDent + gemCombatMods.extraArmorDentOnHit;
    if (totalArmorDent > 0 && e.armor.durability > 0) {
      e.armor.durability = Math.max(0, e.armor.durability - totalArmorDent);
    }

    // Resolve Melee Inertia (`J_melee = (attack_weight + m_attacker * μ_attacker * commitment) * attack_speed`, §4)
    const kdx = e.x - state.x;
    const kdy = e.y - state.y;
    const kNorm = Math.hypot(kdx, kdy) || 1;
    const impDx = kdx / kNorm;
    const impDy = kdy / kNorm;

    const attackerMu = computeMomentumFraction(
      state.vx + (state.isBoosterDashing ? state.boosterDirX * 95 : 0),
      state.vy + (state.isBoosterDashing ? state.boosterDirY * 95 : 0),
      impDx,
      impDy
    );
    const scaleMult = Math.max(0.75, Math.min(1.6, stunSec / 0.45 + Math.abs(knockbackDist) * 0.03));
    const impulseJ = computeMeleeImpulse(
      weaponInertiaSpec.attackWeight * scaleMult,
      weaponInertiaSpec.attackSpeed,
      playerInertiaProf.totalBaseWeight,
      attackerMu,
      weaponInertiaSpec.commitment
    );
    const eProf = resolveEnemyInertiaProfile(e);
    const defenderMu = computeMomentumFraction(e.vx || 0, e.vy || 0, -impDx, -impDy);
    const inertiaRes = resolveHitInertia({
      impulseJ,
      defenderWeight: eProf.baseWeight,
      defenderMu,
      defenderStability: eProf.stability,
    });

    const pullSign = knockbackDist < 0 ? -1 : 1;
    e.knockbackVx =
      (e.knockbackVx || 0) + impDx * pullSign * inertiaRes.displacementSpeedPx;
    e.knockbackVy =
      (e.knockbackVy || 0) + impDy * pullSign * inertiaRes.displacementSpeedPx;
    e.lastInertiaOutcome = inertiaRes.outcome;
    e.lastInertiaOutcomeTimer = 0.6;
    state.hitstopTimer = Math.max(state.hitstopTimer || 0, inertiaRes.hitstopSec);

    if (inertiaRes.outcome === 'none') {
      ctx.spawnParticles(e.x, e.y, e.z + 10, 3, '#94a3b8', 'BRACED');
    } else {
      e.stun = Math.max(e.stun, inertiaRes.recoverySec);
      if (inertiaRes.outcome === 'stagger' || inertiaRes.outcome === 'knockback') {
        if (e.state === 'windup') {
          e.state = 'stagger';
          e.stateTimer = inertiaRes.recoverySec;
        }
        const outFmt = formatInertiaOutcomeLabel(inertiaRes.outcome);
        ctx.spawnParticles(e.x, e.y, e.z + 12, 5, outFmt.color, outFmt.label);
      }
    }
    if (!skillHitGrantedBonus) {
      skillHitGrantedBonus = true;
      if (gemCombatMods.shieldRestoreOnSkillHit > 0) {
        state.shields.overloaded = false;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + gemCombatMods.shieldRestoreOnSkillHit
        );
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
    const resolvedDmgType = weapon?.adaptiveDamageTypes
      ? e.shields.capacity > 0
        ? weapon.adaptiveDamageTypes[0]
        : weapon.adaptiveDamageTypes[1]
      : dmgType;
    const adaptiveBonusMult = weapon?.adaptiveDamageTypes ? 1.12 : 1.0;
    applyDamageFn(
      e.shields,
      e.armor,
      e.frame,
      Math.round(computeEnemyDamage(baseDmg, e.faction, e, resolvedDmgType) * adaptiveBonusMult),
      resolvedDmgType,
      (count, color, label) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, label)
    );
    soundSystem.playHit();
  };

  const isSpearWeapon =
    currentWeaponId === 'short_spear' || currentWeaponId === 'ls900_swordspear';
  const isLanceWeapon =
    currentWeaponId === 'avalon_siege_lance' || currentWeaponId === 'hl220_lightburst_lance';
  const isStaffOrMaceWeapon =
    currentWeaponId === 'mace' ||
    currentWeaponId === 'wz200_manacore_staff' ||
    currentWeaponId === 'hallowed_scepter';
  const isAxeWeapon =
    currentWeaponId === 'hand_axe' || currentWeaponId === 'siegebreaker';
  const isDaggerWeapon =
    currentWeaponId === 's4_whisper_blade' || currentWeaponId === 's6_phantom_edge';
  const isBladeWeapon =
    currentWeaponId === 'long_sword' ||
    currentWeaponId === 'khopesh' ||
    currentWeaponId === 's2_turbine_khopesh' ||
    currentWeaponId === 'tig_edge' ||
    currentWeaponId === 'grace_edge';
  const isExplosiveOrdnanceWeapon =
    currentWeaponId === 'm350_mauler' ||
    currentWeaponId === 'ln1200_avalanche' ||
    currentWeaponId === 'lg950_tomahawk';
  const isRapidRotaryWeapon =
    currentWeaponId === 'b25_brushcutter' ||
    currentWeaponId === 'sv12_viper' ||
    currentWeaponId === 'm300_hasta' ||
    currentWeaponId === 'wz450_sparkstrike';

  // 1. WEAPON SKILLS (Slots 1..4)
  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    const slot = desc.weaponSkillSlot;
    const action = weapon?.moveset[slot] || desc;
    state.bladeTrails = state.bladeTrails || [];

    // ─── SLOT 1: PRIMARY SPECIAL SKILL ───────────────────────────────────────
    if (slot === 1) {
      if (isSpearWeapon) {
        state.isBoosterDashing = true;
        state.boosterTimer = 0.14;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.28,
          radius: 46,
          length: 48,
          width: 12,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 48, 12, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Pierce', 0.55, 6);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 22,
          state.y + aim.dy * 22,
          state.z + 6,
          8,
          trailColor,
          action.name || 'IMPALING SKEWER!'
        );
        soundSystem.playSword();
      } else if (isLanceWeapon) {
        state.isBoosterDashing = true;
        state.boosterTimer = 0.12;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.3,
          radius: 46,
          length: 48,
          width: 14,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 46, 14, e.x, e.y)) {
            applyHitToEnemy(e, Math.round(action.damage * 0.65), action.damageType || 'Beam', 0.6, 8);
          }
        }
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 245,
          vy: aim.dy * 245,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType || 'Pierce',
          isPlayer: true,
          life: 0.65,
          radius: 5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 28,
        });
        ctx.spawnParticles(
          state.x + aim.dx * 18,
          state.y + aim.dy * 18,
          state.z + 6,
          8,
          trailColor,
          action.name
        );
        soundSystem.playLaser();
      } else if (isStaffOrMaceWeapon) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.65,
          radius: 26,
          length: 18,
          width: 24,
          style: 'slam',
          color: trailColor,
          coreColor,
          life: 0.3,
          maxLife: 0.3,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInImpactZone(state.x, state.y, aimAngle, 18, 24, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Impact', 1.1, 8, 8);
          }
        }
        if (currentWeaponId === 'hallowed_scepter') {
          state.shields.overloaded = false;
          state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + 10);
          state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 6);
        }
        ctx.spawnParticles(
          state.x + aim.dx * 18,
          state.y + aim.dy * 18,
          state.z + 4,
          12,
          trailColor,
          action.name || 'OVERHEAD SLAM!'
        );
        soundSystem.playExplosion();
      } else if (isBladeWeapon || isDaggerWeapon) {
        state.isBoosterDashing = true;
        state.boosterTimer = isDaggerWeapon ? 0.16 : 0.14;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        const thrustLen = currentWeaponId === 'long_sword' ? 44 : isDaggerWeapon ? 36 : 40;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.3,
          radius: thrustLen,
          length: thrustLen,
          width: 11,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.25,
          maxLife: 0.25,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, thrustLen, 12, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Pierce', 0.55, 6);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 18,
          state.y + aim.dy * 18,
          state.z + 6,
          8,
          trailColor,
          action.name
        );
        soundSystem.playSword();
      } else if (isAxeWeapon) {
        state.isBoosterDashing = true;
        state.boosterTimer = 0.13;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        if (currentWeaponId === 'siegebreaker') {
          state.heat = Math.max(0, state.heat - 14);
        }
        state.bladeTrails.push({
          x: state.x + aim.dx * 6,
          y: state.y + aim.dy * 6,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.7,
          radius: currentWeaponId === 'siegebreaker' ? 32 : 26,
          width: 18,
          style: 'chop',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (
            isTargetInDirectionalArc(
              state.x,
              state.y,
              aimAngle,
              currentWeaponId === 'siegebreaker' ? 34 : 30,
              Math.PI * 0.8,
              e.x,
              e.y
            )
          ) {
            applyHitToEnemy(
              e,
              action.damage,
              action.damageType || 'Impact',
              0.7,
              8,
              currentWeaponId === 'siegebreaker' ? 8 : 5
            );
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 6,
          10,
          trailColor,
          action.name
        );
        soundSystem.playSword();
      } else if (weapon?.equipmentRole === 'shield') {
        const hasShieldChargeFeat = equippedFeats.some((f) =>
          ['shield_charge', 'shield_wall_advance', 'unstoppable_momentum'].includes(f)
        );
        const shieldRestore =
          currentWeaponId === 'pavise_shield'
            ? 35
            : currentWeaponId === 'buckler_shield' || currentWeaponId === 'aegis_charge_buckler'
              ? 18
              : 12;
        state.shields.overloaded = false;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + shieldRestore
        );
        if (
          currentWeaponId === 'heater_shield' ||
          currentWeaponId === 'aegis_charge_buckler' ||
          hasShieldChargeFeat
        ) {
          state.isBoosterDashing = true;
          state.boosterTimer = hasShieldChargeFeat ? 0.2 : 0.16;
          state.boosterDirX = aim.dx;
          state.boosterDirY = aim.dy;
        }
        const isPavisePlant = currentWeaponId === 'pavise_shield';
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: isPavisePlant ? Math.PI * 2 : Math.PI * 0.8,
          radius: isPavisePlant ? 30 : 28,
          width: 18,
          style: isPavisePlant ? 'shockwave' : 'bash',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        const chargeBonusMult = hasShieldChargeFeat ? 1.25 : 1.0;
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          const hit = isPavisePlant
            ? Math.hypot(e.x - state.x, e.y - state.y) <= 32
            : isTargetInDirectionalArc(state.x, state.y, aimAngle, 36, Math.PI * 0.9, e.x, e.y);
          if (hit) {
            applyHitToEnemy(
              e,
              Math.round(action.damage * chargeBonusMult),
              action.damageType || 'Impact',
              1.15,
              15
            );
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 8, 10, trailColor, action.name);
        soundSystem.playSword();
      } else {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.45,
          radius: 16,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.18,
          maxLife: 0.18,
        });
        if (currentWeaponId === 'quiver' || isRapidRotaryWeapon) {
          if (currentWeaponId === 'quiver') {
            state.ammo = Math.min(state.maxAmmo, state.ammo + 4);
            state.isReloading = false;
          }
          const volleyOffsets =
            currentWeaponId === 'b25_brushcutter'
              ? [-0.15, -0.05, 0.05, 0.15]
              : [-0.1, 0, 0.1];
          for (const off of volleyOffsets) {
            const ang = aimAngle + off;
            state.projectiles.push({
              x: state.x + Math.cos(ang) * 8,
              y: state.y + Math.sin(ang) * 8,
              z: state.z + 6,
              vx: Math.cos(ang) * 220,
              vy: Math.sin(ang) * 220,
              vz: 0,
              damage: Math.round(action.damage * 0.55 * overdriveMult),
              damageType: action.damageType || 'Pierce',
              isPlayer: true,
              life: 0.75,
              radius: 3.5,
              color: trailColor,
              trailColor: coreColor,
              lightRadius: 20,
            });
          }
        } else if (isExplosiveOrdnanceWeapon) {
          const locked = getLockedTarget(state);
          const aimVec = locked
            ? {
                dx: (locked.x - state.x) / (Math.hypot(locked.x - state.x, locked.y - state.y) || 1),
                dy: (locked.y - state.y) / (Math.hypot(locked.x - state.x, locked.y - state.y) || 1),
              }
            : aim;
          state.projectiles.push({
            x: state.x + aimVec.dx * 10,
            y: state.y + aimVec.dy * 10,
            z: state.z + 7,
            vx: aimVec.dx * (currentWeaponId === 'm350_mauler' ? 165 : 210),
            vy: aimVec.dy * (currentWeaponId === 'm350_mauler' ? 165 : 210),
            vz: currentWeaponId === 'm350_mauler' ? 14 : 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: 'Blast',
            isPlayer: true,
            life: 0.85,
            radius: 5.5,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 30,
            onImpact(x, y, _z, st) {
              soundSystem.playExplosion();
              st.bladeTrails = st.bladeTrails || [];
              st.bladeTrails.push({
                x,
                y,
                z: 0,
                angle: 0,
                arcSpan: Math.PI * 2,
                radius: 30,
                style: 'shockwave',
                color: trailColor,
                coreColor,
                life: 0.26,
                maxLife: 0.26,
              });
              for (const e of st.enemies) {
                if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                if (Math.hypot(e.x - x, e.y - y) < 32) {
                  e.stun = Math.max(e.stun, 0.85);
                  applyDamageFn(
                    e.shields,
                    e.armor,
                    e.frame,
                    computeEnemyDamage(Math.round(action.damage * 0.65), e.faction, e, 'Blast'),
                    'Blast'
                  );
                }
              }
            },
          });
        } else {
          const isHeavyBeamOrRail =
            currentWeaponId === 'great_bow' ||
            currentWeaponId === 'm450_pilum' ||
            currentWeaponId === 'sr440_shadowfang' ||
            currentWeaponId === 'wz800_arclight_cannon' ||
            currentWeaponId === 'wz650_prism_lance';
          state.projectiles.push({
            x: state.x + aim.dx * 10,
            y: state.y + aim.dy * 10,
            z: state.z + 6,
            vx: aim.dx * (isHeavyBeamOrRail ? 260 : 230),
            vy: aim.dy * (isHeavyBeamOrRail ? 260 : 230),
            vz: 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: action.damageType,
            isPlayer: true,
            life: 0.9,
            radius: isHeavyBeamOrRail ? 5.5 : 4.5,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 28,
          });
        }
        soundSystem.playLaser();
      }
      return;
    }

    // ─── SLOT 2: TACTICAL SECONDARY / CONTROL SKILL ──────────────────────────
    if (slot === 2) {
      if (isStaffOrMaceWeapon) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 2,
          radius: 38,
          style: 'shockwave',
          color: trailColor,
          coreColor,
          life: 0.32,
          maxLife: 0.32,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 38) {
            applyHitToEnemy(
              e,
              action.damage,
              action.damageType || (currentWeaponId === 'mace' ? 'Blast' : 'Wave'),
              1.25,
              10,
              6
            );
          }
        }
        if (currentWeaponId === 'hallowed_scepter') {
          state.shields.overloaded = false;
          state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + 14);
          state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 8);
        }
        ctx.spawnParticles(state.x, state.y, state.z + 6, 12, trailColor, action.name);
        soundSystem.playExplosion();
      } else if (
        currentWeaponId === 'buckler_shield' ||
        currentWeaponId === 'aegis_charge_buckler'
      ) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.65,
          radius: 20,
          style: 'bash',
          color: trailColor,
          coreColor,
          life: 0.22,
          maxLife: 0.22,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 180,
          vy: aim.dy * 180,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Impact',
          isPlayer: true,
          life: 0.65,
          radius: 5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 24,
        });
        soundSystem.playSword();
      } else if (currentWeaponId === 'pavise_shield') {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.85,
          radius: 28,
          length: 16,
          width: 24,
          style: 'slam',
          color: trailColor,
          coreColor,
          life: 0.32,
          maxLife: 0.32,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInImpactZone(state.x, state.y, aimAngle, 16, 26, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Blast', 1.35, 12, 8);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 4,
          12,
          trailColor,
          action.name
        );
        soundSystem.playExplosion();
      } else if (isAxeWeapon) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: currentWeaponId === 'siegebreaker' ? Math.PI * 0.95 : Math.PI * 0.58,
          radius: currentWeaponId === 'siegebreaker' ? 32 : 28,
          width: 16,
          style: 'chop',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (
            isTargetInDirectionalArc(
              state.x,
              state.y,
              aimAngle,
              currentWeaponId === 'siegebreaker' ? 36 : 32,
              Math.PI * 0.9,
              e.x,
              e.y
            )
          ) {
            applyHitToEnemy(
              e,
              action.damage,
              action.damageType || 'Impact',
              0.95,
              currentWeaponId === 'hand_axe' ? -12 : 10,
              6
            );
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 16,
          state.y + aim.dy * 16,
          state.z + 6,
          9,
          trailColor,
          action.name
        );
        soundSystem.playSword();
      } else if (isSpearWeapon) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 1.15,
          radius: 30,
          style: 'slash',
          color: trailColor,
          coreColor,
          life: 0.25,
          maxLife: 0.25,
        });
        const bounds = getActiveRoomBounds(state);
        state.x = Math.max(12, Math.min(bounds.widthPx - 12, state.x - aim.dx * 6));
        state.y = Math.max(12, Math.min(bounds.heightPx - 12, state.y - aim.dy * 6));
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 34, Math.PI * 1.2, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Wave', 1.1, 8);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 6, 8, trailColor, action.name);
        soundSystem.playSword();
      } else if (
        isBladeWeapon ||
        isDaggerWeapon ||
        currentWeaponId === 'heater_shield' ||
        isLanceWeapon
      ) {
        soundSystem.playSword();
        const isHeaterSlam = currentWeaponId === 'heater_shield';
        const reach = isLanceWeapon ? 40 : isHeaterSlam ? 28 : isDaggerWeapon ? 26 : 32;
        const span =
          currentWeaponId === 'long_sword'
            ? Math.PI * 1.35
            : isHeaterSlam
              ? Math.PI * 0.95
              : Math.PI * 1.15;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: span,
          radius: reach - 2,
          width: isHeaterSlam ? 18 : 14,
          style: isHeaterSlam ? 'bash' : 'slash',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        ctx.spawnParticles(state.x, state.y, state.z + 8, 10, trailColor, action.name);
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, reach, span + 0.15, e.x, e.y)) {
            if (currentWeaponId === 'khopesh' || currentWeaponId === 's2_turbine_khopesh' || isDaggerWeapon) {
              e.speed = Math.max(12, e.speed * 0.65);
            }
            applyHitToEnemy(
              e,
              action.damage,
              action.damageType || 'Pierce',
              isHeaterSlam ? 1.25 : 0.85,
              isLanceWeapon ? 16 : 8
            );
          }
        }
      } else if (
        currentWeaponId === 'great_bow' ||
        currentWeaponId === 'quiver' ||
        isRapidRotaryWeapon
      ) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.75,
          radius: 18,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.2,
          maxLife: 0.2,
        });
        const offsets =
          currentWeaponId === 'great_bow' || isRapidRotaryWeapon
            ? [-0.26, -0.13, 0, 0.13, 0.26]
            : [-0.36, -0.18, 0, 0.18, 0.36];
        const speed = currentWeaponId === 'quiver' ? 135 : 195;
        const life = currentWeaponId === 'quiver' ? 0.42 : 0.65;
        for (const off of offsets) {
          const ang = aimAngle + off;
          state.projectiles.push({
            x: state.x + Math.cos(ang) * 8,
            y: state.y + Math.sin(ang) * 8,
            z: state.z + 6,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            vz: 0,
            damage: Math.round(action.damage * 0.6 * overdriveMult),
            damageType: action.damageType || 'Pierce',
            isPlayer: true,
            life,
            radius: 3,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 16,
          });
        }
        soundSystem.playLaser();
      } else {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.45,
          radius: 15,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.18,
          maxLife: 0.18,
        });
        const slot2DmgType = action.damageType || 'Blast';
        state.projectiles.push({
          x: state.x + aim.dx * 8,
          y: state.y + aim.dy * 8,
          z: state.z + 8,
          vx: aim.dx * (slot2DmgType === 'Beam' || slot2DmgType === 'Pulse' ? 195 : 125),
          vy: aim.dy * (slot2DmgType === 'Beam' || slot2DmgType === 'Pulse' ? 195 : 125),
          vz: slot2DmgType === 'Blast' ? 20 : 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: slot2DmgType,
          isPlayer: true,
          life: 0.65,
          radius: 5,
          color: gemVis.gemId ? trailColor : slot2DmgType === 'Blast' ? '#ea580c' : trailColor,
          trailColor: gemVis.gemId ? coreColor : slot2DmgType === 'Blast' ? '#f97316' : coreColor,
          lightRadius: 30,
          onImpact(x, y, _z, st) {
            soundSystem.playExplosion();
            st.bladeTrails = st.bladeTrails || [];
            st.bladeTrails.push({
              x,
              y,
              z: 0,
              angle: 0,
              arcSpan: Math.PI * 2,
              radius: 32,
              style: 'shockwave',
              color: gemVis.gemId ? trailColor : '#fb923c',
              coreColor,
              life: 0.28,
              maxLife: 0.28,
            });
            for (const e of st.enemies) {
              if (e.isSubmerged) continue;
              if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
              if (Math.hypot(e.x - x, e.y - y) < 36) {
                e.stun = 1.2;
                applyDamageFn(
                  e.shields,
                  e.armor,
                  e.frame,
                  computeEnemyDamage(action.damage, e.faction, e, slot2DmgType),
                  slot2DmgType
                );
              }
            }
          },
        });
        soundSystem.playLaser();
      }
      return;
    }

    // ─── SLOT 3 (SKILL 4): BLOCK FOR ALL BLOCKING WEAPONS / SUPPRESSION FOR RANGED ───
    if (slot === 3) {
      if (action.isBlock || isBlockingWeapon(currentWeaponId)) {
        const isShieldEquip = weapon?.equipmentRole === 'shield';
        state.isHoldingBlock = true;
        state.blockHoldTimer = 0;
        state.blockTimer = 0.25;
        state.blockingWeaponId = currentWeaponId;

        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: isShieldEquip ? Math.PI * 0.95 : Math.PI * 0.75,
          radius: isShieldEquip ? 24 : 20,
          width: isShieldEquip ? 16 : 13,
          style: 'bash',
          color: '#38bdf8',
          coreColor: '#ffffff',
          life: 0.25,
          maxLife: 0.25,
        });

        ctx.spawnParticles(
          state.x + aim.dx * 10,
          state.y + aim.dy * 10,
          state.z + 8,
          8,
          '#38bdf8',
          'BLOCK (0.25s PERFECT)'
        );
      } else if (
        currentWeaponId === 'great_bow' ||
        currentWeaponId === 'quiver' ||
        currentWeaponId === 'aether_catalyst'
      ) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.4,
          radius: 16,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.18,
          maxLife: 0.18,
        });
        if (currentWeaponId === 'quiver' || currentWeaponId === 'aether_catalyst') {
          state.opticMarkTimer = 5.0;
        }
        state.projectiles.push({
          x: state.x + aim.dx * 9,
          y: state.y + aim.dy * 9,
          z: state.z + 6,
          vx: aim.dx * 210,
          vy: aim.dy * 210,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType || 'Pierce',
          isPlayer: true,
          life: 0.8,
          radius: 4,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 24,
          onImpact(x, y, _z, st) {
            for (const e of st.enemies) {
              if (Math.hypot(e.x - x, e.y - y) < 22) {
                e.stun = 0.9;
                e.speed = Math.max(12, e.speed * 0.6);
              }
            }
          },
        });
        soundSystem.playLaser();
      } else {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.65,
          radius: 16,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.18,
          maxLife: 0.18,
        });
        for (const offset of [-0.24, -0.08, 0.08, 0.24]) {
          const ang = aimAngle + offset;
          state.projectiles.push({
            x: state.x + Math.cos(ang) * 8,
            y: state.y + Math.sin(ang) * 8,
            z: state.z + 6,
            vx: Math.cos(ang) * 175,
            vy: Math.sin(ang) * 175,
            vz: 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: action.damageType || 'Pierce',
            isPlayer: true,
            life: 0.65,
            radius: 3,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 16,
          });
        }
        soundSystem.playLaser();
      }
      return;
    }

    // ─── SLOT 4: HEAVY FINISHER SKILL ────────────────────────────────────────
    if (slot === 4) {
      if (currentWeaponId === 'short_spear') {
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.3,
          radius: 38,
          length: 42,
          width: 11,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 240,
          vy: aim.dy * 240,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Pierce',
          isPlayer: true,
          life: 0.85,
          radius: 5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 28,
        });
        ctx.spawnParticles(
          state.x + aim.dx * 16,
          state.y + aim.dy * 16,
          state.z + 6,
          10,
          trailColor,
          action.name
        );
      } else if (currentWeaponId === 'mace') {
        soundSystem.playExplosion();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.8,
          radius: 26,
          length: 16,
          width: 24,
          style: 'slam',
          color: trailColor,
          coreColor,
          life: 0.32,
          maxLife: 0.32,
        });
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 2,
          radius: 42,
          style: 'shockwave',
          color: trailColor,
          coreColor,
          life: 0.36,
          maxLife: 0.36,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 44) {
            applyHitToEnemy(e, action.damage, 'Wave', 1.25, 12, 10);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 8, 16, trailColor, action.name);
      } else if (currentWeaponId === 'long_sword') {
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 1.15,
          radius: 32,
          style: 'slash',
          color: trailColor,
          coreColor,
          life: 0.3,
          maxLife: 0.3,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 34, Math.PI * 1.25, e.x, e.y)) {
            applyHitToEnemy(e, Math.round(action.damage * 0.65), 'Wave', 0.8, 8);
          }
        }
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 195,
          vy: aim.dy * 195,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Wave',
          isPlayer: true,
          life: 0.65,
          radius: 6,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 30,
        });
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 8,
          12,
          trailColor,
          action.name
        );
      } else if (currentWeaponId === 'avalon_siege_lance') {
        soundSystem.playLaser();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.35,
          radius: 54,
          length: 58,
          width: 16,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.34,
          maxLife: 0.34,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 58, 16, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Wave', 1.1, 14);
          }
        }
        state.projectiles.push({
          x: state.x + aim.dx * 14,
          y: state.y + aim.dy * 14,
          z: state.z + 6,
          vx: aim.dx * 240,
          vy: aim.dy * 240,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Wave',
          isPlayer: true,
          life: 0.85,
          radius: 6,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 34,
        });
        ctx.spawnParticles(state.x, state.y, state.z + 8, 14, trailColor, action.name);
      } else if (weapon?.equipmentRole === 'shield') {
        soundSystem.playExplosion();
        state.shields.overloaded = false;
        state.shields.overloadTimer = 0;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + 25
        );
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.9,
          radius: 30,
          width: 22,
          style: 'bash',
          color: trailColor,
          coreColor,
          life: 0.3,
          maxLife: 0.3,
        });
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 2,
          radius: 36,
          style: 'shockwave',
          color: trailColor,
          coreColor,
          life: 0.32,
          maxLife: 0.32,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 38) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Wave', 1.3, 14);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 8, 14, trailColor, action.name);
      } else if (isMeleeOrShield) {
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 2,
          radius: 30,
          style: 'whirlwind',
          color: trailColor,
          coreColor,
          life: 0.34,
          maxLife: 0.34,
        });
        ctx.spawnParticles(state.x, state.y, state.z + 8, 14, trailColor, action.name);
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 34) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Pierce', 1.0, 8);
          }
        }
      } else if (currentWeaponId === 'quiver') {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.85,
          radius: 20,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.24,
          maxLife: 0.24,
        });
        for (const off of [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36]) {
          const ang = aimAngle + off;
          state.projectiles.push({
            x: state.x + Math.cos(ang) * 8,
            y: state.y + Math.sin(ang) * 8,
            z: state.z + 6,
            vx: Math.cos(ang) * 210,
            vy: Math.sin(ang) * 210,
            vz: 0,
            damage: Math.round(action.damage * 0.6 * overdriveMult),
            damageType: 'Pierce',
            isPlayer: true,
            life: 0.75,
            radius: 3,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 18,
          });
        }
        soundSystem.playLaser();
      } else {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.5,
          radius: 18,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.22,
          maxLife: 0.22,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 240,
          vy: aim.dy * 240,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType || 'Beam',
          isPlayer: true,
          life: 0.85,
          radius: 5.5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 32,
          onImpact:
            currentWeaponId === 'great_bow'
              ? (x, y, _z, st) => {
                  soundSystem.playExplosion();
                  st.bladeTrails = st.bladeTrails || [];
                  st.bladeTrails.push({
                    x,
                    y,
                    z: 0,
                    angle: 0,
                    arcSpan: Math.PI * 2,
                    radius: 30,
                    style: 'shockwave',
                    color: trailColor,
                    coreColor,
                    life: 0.28,
                    maxLife: 0.28,
                  });
                }
              : undefined,
        });
        soundSystem.playLaser();
      }
      return;
    }
  }

  // 2. DEFENSIVE & HARDWARE MODULE ACTIONS
  if (actionId === 'mod_head_optic_scan') {
    state.opticMarkTimer = 6.0;
    for (const e of state.enemies) {
      if (e.type === 'bog_wurm') e.isSubmerged = false;
    }
    soundSystem.playPowerup();
    ctx.spawnParticles(state.x, state.y, state.z + 10, 10, '#38bdf8', 'OPTIC MARK +25%');
    return;
  }

  if (actionId === 'mod_torso_reactive_burst') {
    state.armor.durability = Math.min(
      state.armor.maxDurability,
      state.armor.durability + 22
    );
    soundSystem.playHeal();
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: 0,
      arcSpan: Math.PI * 2,
      radius: 34,
      style: 'shockwave',
      color: '#ffd27d',
      coreColor: '#fef08a',
      life: 0.28,
      maxLife: 0.28,
    });
    ctx.spawnParticles(state.x, state.y, state.z + 8, 12, '#ffd27d', '+22 ARMOR');
    for (const e of state.enemies) {
      if (e.isSubmerged) continue;
      if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
      if (Math.hypot(e.x - state.x, e.y - state.y) < 36) {
        e.stun = 1.1;
        applyDamageFn(
          e.shields,
          e.armor,
          e.frame,
          computeEnemyDamage(desc.damage, e.faction),
          'Impact'
        );
      }
    }
    return;
  }

  if (actionId === 'mod_arms_shock_grapple') {
    state.projectiles.push({
      x: state.x + aim.dx * 10,
      y: state.y + aim.dy * 10,
      z: state.z + 6,
      vx: aim.dx * 210,
      vy: aim.dy * 210,
      vz: 0,
      damage: Math.round(desc.damage * overdriveMult),
      damageType: 'Pulse',
      isPlayer: true,
      life: 0.75,
      radius: 4.5,
      color: '#38bdf8',
      trailColor: '#7dd3fc',
      lightRadius: 26,
      onImpact(x, y, _z, st) {
        for (const e of st.enemies) {
          if (Math.hypot(e.x - x, e.y - y) < 22) {
            e.stun = 1.2;
          }
        }
      },
    });
    soundSystem.playLaser();
    return;
  }

  if (actionId === 'mod_legs_seismic_stomp') {
    soundSystem.playExplosion();
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: aimAngle,
      arcSpan: Math.PI * 2,
      radius: 36,
      length: 0,
      width: 34,
      style: 'slam',
      color: '#fb923c',
      coreColor: '#ffedd5',
      life: 0.3,
      maxLife: 0.3,
    });
    ctx.spawnParticles(state.x, state.y, state.z + 4, 14, '#fb923c', 'SEISMIC SLAM!');
    for (const e of state.enemies) {
      if (e.isSubmerged) continue;
      if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
      const dist = Math.hypot(e.x - state.x, e.y - state.y);
      if (dist < 38) {
        e.stun = 1.3;
        applyDamageFn(
          e.shields,
          e.armor,
          e.frame,
          computeEnemyDamage(desc.damage, e.faction),
          'Impact'
        );
      }
    }
    return;
  }

  // 3. REACTOR & CORE ABILITIES
  if (actionId === 'reactor_thermal_vent') {
    soundSystem.playPowerup();
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: 0,
      arcSpan: Math.PI * 2,
      radius: 32,
      style: 'shockwave',
      color: '#f97316',
      coreColor: '#fed7aa',
      life: 0.28,
      maxLife: 0.28,
    });
    ctx.spawnParticles(state.x, state.y, state.z + 8, 12, '#f97316', '-45 HEAT VENT');
    for (const e of state.enemies) {
      if (e.isSubmerged) continue;
      if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
      if (Math.hypot(e.x - state.x, e.y - state.y) < 34) {
        applyDamageFn(
          e.shields,
          e.armor,
          e.frame,
          computeEnemyDamage(desc.damage, e.faction),
          'Wave'
        );
      }
    }
    return;
  }

  if (actionId === 'reactor_overdrive') {
    state.overdriveTimer = 6.0;
    state.isReloading = false;
    state.ammo = state.maxAmmo;
    soundSystem.playPowerup();
    ctx.spawnParticles(state.x, state.y, state.z + 10, 12, '#c084fc', 'OVERDRIVE +30%');
    return;
  }

  if (actionId === 'reactor_aegis_pulse') {
    state.shields.overloaded = false;
    state.shields.overloadTimer = 0;
    state.shields.capacity = Math.min(
      state.shields.maxCapacity,
      state.shields.capacity + 35
    );
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: 0,
      arcSpan: Math.PI * 2,
      radius: 28,
      style: 'shockwave',
      color: '#77c7ff',
      coreColor: '#e0f2fe',
      life: 0.26,
      maxLife: 0.26,
    });
    soundSystem.playHeal();
    ctx.spawnParticles(state.x, state.y, state.z + 8, 12, '#77c7ff', '+35 SHIELD');
    return;
  }

  // 4. CLASS UTILITY SLOT (ACTION 6 · UNLOCKED AT LEVEL 6)
  if (desc.sourceCategory === 'utility' || actionId === 'class_utility_slot') {
    const utilDef = getClassUtilityDefinition(
      state.equipmentSlots?.utility,
      state.traitLine
    );
    if (utilDef.shieldRestore > 0) {
      state.shields.overloaded = false;
      state.shields.overloadTimer = 0;
      state.shields.capacity = Math.min(
        state.shields.maxCapacity,
        state.shields.capacity + utilDef.shieldRestore
      );
    }
    if (utilDef.armorRestore > 0) {
      state.armor.durability = Math.min(
        state.armor.maxDurability,
        state.armor.durability + utilDef.armorRestore
      );
    }
    if (utilDef.energyRestore > 0) {
      state.energy = Math.min(state.maxEnergy, state.energy + utilDef.energyRestore);
    }
    if (utilDef.grantsOverdriveSec) {
      state.overdriveTimer = Math.max(
        state.overdriveTimer || 0,
        utilDef.grantsOverdriveSec
      );
    }
    if (utilDef.grantsOpticMarkSec) {
      state.opticMarkTimer = Math.max(
        state.opticMarkTimer || 0,
        utilDef.grantsOpticMarkSec
      );
    }
    soundSystem.playHeal();
    ctx.spawnParticles(
      state.x,
      state.y,
      state.z + 10,
      14,
      '#4ade80',
      `${utilDef.shortLabel} ONLINE`
    );
    return;
  }

  // 5. BELT SLOTS 1–4 (ACTIONS 7–10 · CONSUMABLE TACTICAL ITEMS)
  if (desc.sourceCategory === 'belt' && typeof desc.beltSlotIndex === 'number') {
    const idx = desc.beltSlotIndex;
    const itemId = state.equipmentSlots?.belt?.[idx];
    if (!itemId) return;
    const invIdx = state.inventorySlots.findIndex((s) => s.itemId === itemId);
    const itemDef = getItemDefinition(itemId);
    if (invIdx < 0 || !itemDef) {
      ctx.say(`BELT SLOT ${idx + 1} DEPLETED`);
      return;
    }

    const used = itemDef.onUse
      ? itemDef.onUse(state, { say: ctx.say, sound: ctx.sound })
      : false;
    if (used) {
      state.inventorySlots[invIdx].count -= 1;
      if (state.inventorySlots[invIdx].count <= 0) {
        state.inventorySlots.splice(invIdx, 1);
      }
      ctx.spawnParticles(
        state.x,
        state.y,
        state.z + 8,
        10,
        itemDef.iconColor || '#fbbf24',
        itemDef.name.toUpperCase()
      );
      notifyOrionStateChange();
    }
  }
}

export function activateUtilityOrBeltSlot(
  state: OrionState,
  actionId: string
): boolean {
  const status = isActionUnlocked(state, actionId);
  const ctx: OrionCombatContext = {
    state,
    sound: soundSystem,
    spawnParticles: (x, y, z, count, color, label) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 14 + Math.random() * 28;
        state.particles.push({
          x,
          y,
          z,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          vz: 15 + Math.random() * 25,
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.6,
          color,
          size: 2,
          label: i === 0 ? label : undefined,
          fade: true,
        });
      }
    },
    say: (text: string) => {
      state.toastText = text;
      state.toastTimer = 2.6;
    },
  };

  if (!status.unlocked) {
    soundSystem.playMenuBeep();
    ctx.say(status.reason);
    notifyOrionStateChange();
    return false;
  }

  const desc = getResolvedActionDescriptor(state, actionId);
  const cd = getActionCooldown(state, actionId);
  if (cd > 0) {
    soundSystem.playMenuBeep();
    ctx.say(`${desc.shortLabel} COOLDOWN (${cd.toFixed(1)}S)`);
    notifyOrionStateChange();
    return false;
  }

  if (desc.sourceCategory === 'belt' && typeof desc.beltSlotIndex === 'number') {
    const itemId = state.equipmentSlots?.belt?.[desc.beltSlotIndex];
    const invSlot = itemId
      ? state.inventorySlots.find((s) => s.itemId === itemId)
      : undefined;
    if (!itemId || !invSlot || invSlot.count <= 0) {
      soundSystem.playMenuBeep();
      ctx.say(`BELT SLOT ${desc.beltSlotIndex + 1} EMPTY`);
      notifyOrionStateChange();
      return false;
    }
  }

  state.actionCooldowns = state.actionCooldowns || {};
  state.actionCooldowns[actionId] = desc.cooldownSec;
  if (desc.heatCost > 0) {
    state.heat = Math.min(state.maxHeat, state.heat + desc.heatCost);
  } else if (desc.heatCost < 0) {
    state.heat = Math.max(0, state.heat + desc.heatCost);
  }

  executeActionPayload(state, ctx, actionId, () => undefined);
  notifyOrionStateChange();
  return true;
}

export function updateActionTimers(state: OrionState, dt: number): void {
  const reloadMult = (state.overdriveTimer || 0) > 0 ? 1.6 : 1.0;

  if (state.actionCooldowns) {
    for (const key of Object.keys(state.actionCooldowns)) {
      if (state.actionCooldowns[key] > 0) {
        const isReloadingKey = (state.skillReloadTimers?.[key] || 0) > 0;
        const rate = isReloadingKey ? reloadMult : 1.0;
        state.actionCooldowns[key] = Math.max(0, state.actionCooldowns[key] - dt * rate);
      }
    }
  }

  if (state.skillReloadTimers) {
    for (const key of Object.keys(state.skillReloadTimers)) {
      if (state.skillReloadTimers[key] > 0) {
        state.skillReloadTimers[key] = Math.max(
          0,
          state.skillReloadTimers[key] - dt * reloadMult
        );
      }
    }
  }

  if (state.skillActiveTimers) {
    for (const key of Object.keys(state.skillActiveTimers)) {
      const prev = state.skillActiveTimers[key];
      if (prev > 0) {
        const next = Math.max(0, prev - dt);
        state.skillActiveTimers[key] = next;
        if (next === 0) {
          const reloadDur = state.skillPendingReloadDurations?.[key] ?? 2.4;
          state.skillReloadTimers = state.skillReloadTimers || {};
          state.actionCooldowns = state.actionCooldowns || {};
          state.skillReloadTimers[key] = reloadDur;
          state.actionCooldowns[key] = reloadDur;
        }
      }
    }
  }

  if (state.isHoldingBlock) {
    state.blockHoldTimer = (state.blockHoldTimer || 0) + dt;
    state.blockTimer = Math.max(state.blockTimer || 0, 0.08);
  } else if (state.blockTimer && state.blockTimer > 0) {
    state.blockTimer = Math.max(0, state.blockTimer - dt);
    if (state.blockTimer <= 0) {
      state.blockingWeaponId = null;
      state.blockHoldTimer = 0;
    }
  }

  if (state.overdriveTimer && state.overdriveTimer > 0) {
    state.overdriveTimer = Math.max(0, state.overdriveTimer - dt);
  }
  if (state.opticMarkTimer && state.opticMarkTimer > 0) {
    state.opticMarkTimer = Math.max(0, state.opticMarkTimer - dt);
  }
}

// ─── 2. WEAPON STANCE, AUXILIARY SWAPS & RESOLVED SKILL SLOTS ────────────────

export interface ActiveWeaponStanceSummary {
  stance: WeaponStanceType;
  grip: '1h' | '2h';
  label: string;
  shortTag: string;
  description: string;
  actionGridRow: {
    ac1: boolean;
    ac2: boolean;
    ac3: boolean;
    ac4: boolean;
    ac5: boolean;
  };
}

export function getActiveWeaponStance(state: OrionState): ActiveWeaponStanceSummary {
  const slot1Id =
    state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2Id = state.equipmentSlots?.slot2 || null;
  const slot3Id = state.equipmentSlots?.slot3 || null;

  const w1 = getWeaponDefinition(slot1Id);
  const w2 = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
  const item2 = slot2Id && !w2 ? getItemDefinition(slot2Id) : undefined;
  const w3 = slot3Id ? getWeaponDefinition(slot3Id) : undefined;

  const grip = getEffectiveMainGrip(state);
  const isBow = isTwoHandOnlyWeapon(w1);

  if (item2 && slot2Id) {
    const auxProvidesAc4 = Boolean(w3 && isAuxiliaryEquipment(w3)) || grip === '2h' || isBow;
    return {
      stance: 'main_consumable',
      grip,
      label: 'SWAPPED CONSUMABLE STANCE',
      shortTag: 'CONSUMABLE [AC5]',
      description: `${w1?.name || slot1Id} (ac1–ac3)${
        w3 && isAuxiliaryEquipment(w3) ? ` + ${w3.name} (ac4)` : ''
      } + ${item2.name} (ac5)`,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: auxProvidesAc4,
        ac5: true,
      },
    };
  }

  if (w2 && isAuxiliaryEquipment(w2)) {
    return {
      stance: 'main_aux',
      grip: '1h',
      label: '1H + AUXILIARY STANCE',
      shortTag: '1H + AUX',
      description: `${w1?.name || slot1Id} (ac1–ac3) + ${w2.name} Auxiliary (ac4–ac5)`,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  if (grip === '2h' || isBow) {
    return {
      stance: 'power_2h',
      grip: '2h',
      label: 'TWO-HANDING, POWER STANCE',
      shortTag: '2H POWER',
      description: `${w1?.name || slot1Id} (2H) occupies Main & Side → ac1–ac5 = ${
        w1?.name || slot1Id
      } Skill 1–5`,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  if (
    w1 &&
    w2 &&
    isTrueWeaponEquipment(w1) &&
    isTrueWeaponEquipment(w2) &&
    w1.name === w2.name &&
    getOwnedWeaponCount(state, slot1Id) >= 2
  ) {
    return {
      stance: 'paired',
      grip: '1h',
      label: 'DUAL-WIELD, PAIRED STANCE',
      shortTag: 'DW PAIRED',
      description: `Main & Side match (${w1.name}, 2 separate items) → ac1–ac5 = ${w1.name} Skill 1–5`,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  if (w1 && w2 && isTrueWeaponEquipment(w2) && slot2Id !== slot1Id) {
    return {
      stance: 'unpaired',
      grip: '1h',
      label: 'DUAL-WIELD, UNPAIRED STANCE',
      shortTag: 'DW UNPAIRED',
      description: `ac1–ac3 = ${w1.name} Skill 1–3 · ac4 = ${w2.name} Skill 2 · ac5 = ${w2.name} Skill 3`,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  return {
    stance: 'single_1h',
    grip: '1h',
    label: 'ONE-HANDED GRIP (SINGLE)',
    shortTag: '1H SINGLE',
    description: `${w1?.name || slot1Id} (1H) → ac1–ac3 active, ac4–ac5 inactive`,
    actionGridRow: {
      ac1: true,
      ac2: true,
      ac3: true,
      ac4: false,
      ac5: false,
    },
  };
}

export function performAuxiliarySwap(
  state: OrionState,
  ctx?: { say: (text: string) => void },
  bypassCooldown: boolean = false
): boolean {
  if (!bypassCooldown && state.gates && !state.gates.canWeaponSwap) {
    soundSystem.playMenuBeep();
    ctx?.say('WEAPON SWAP LOCKED — INTERACT WITH THE POE [3,0] OR BEDIVERE [S] (LVL 2)');
    notifyOrionStateChange();
    return false;
  }

  if (!bypassCooldown && state.weaponSwapCooldown > 0) {
    soundSystem.playMenuBeep();
    ctx?.say(`SWAP COOLDOWN: ${state.weaponSwapCooldown.toFixed(1)}s`);
    notifyOrionStateChange();
    return false;
  }

  const slots = state.equipmentSlots;
  if (!slots) return false;

  const slot1 = slots.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2 = slots.slot2 || null;
  const slot3 = slots.slot3 || null;
  const is2HGrip = getEffectiveMainGrip(state) === '2h';

  if (!slot2 && !slot3) {
    soundSystem.playMenuBeep();
    ctx?.say('SIDE & AUXILIARY SLOTS EMPTY — NOTHING TO SWAP');
    notifyOrionStateChange();
    return false;
  }

  if (is2HGrip && slot2 === slot1 && getOwnedWeaponCount(state, slot1) < 2) {
    if (!slot3) {
      soundSystem.playMenuBeep();
      ctx?.say('AUXILIARY SLOT EMPTY — NO SWAP TARGET');
      notifyOrionStateChange();
      return false;
    }
    slots.slot2 = slot3;
    slots.slot3 = null;
    slots.mainGrip = isTwoHandOnlyWeapon(slot1) ? '2h' : '1h';
  } else {
    slots.slot2 = slot3;
    slots.slot3 = slot2;
    if (!slots.slot2) {
      slots.mainGrip = '2h';
    } else if (!isTwoHandOnlyWeapon(slot1)) {
      slots.mainGrip = '1h';
    }
  }

  const newSideId = slots.slot2;
  const newAuxId = slots.slot3;
  const newSideName = newSideId
    ? getWeaponDefinition(newSideId)?.name || getItemDefinition(newSideId)?.name || newSideId
    : 'NONE (MAIN 2H)';
  const newAuxName = newAuxId
    ? getWeaponDefinition(newAuxId)?.name || getItemDefinition(newAuxId)?.name || newAuxId
    : 'EMPTY';
  const swapMessage = `SWAPPED SIDE ⇄ AUX: SIDE [${newSideName.toUpperCase()}] · AUX [${newAuxName.toUpperCase()}]`;

  state.equippedWeapons = [
    slots.slot1,
    slots.slot2,
    slots.slot3,
  ].filter(Boolean) as string[];
  state.activeWeaponIndex = 0;

  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const swapPenaltyMult = state.gates?.loadPenalty?.swapTimeMult ?? 1.0;

  if (!bypassCooldown) {
    state.weaponSwapCooldown =
      WEAPON_SWAP_COOLDOWN * swapPenaltyMult * featMods.swapTimeMult;
  }

  state.activeSkillSlot = null;
  state.activeActionId = null;
  state.skillTellTimer = 0;
  state.skillActionTimer = 0;

  soundSystem.playPowerup();
  ctx?.say(swapMessage);
  notifyOrionStateChange();
  return true;
}

export interface ResolvedCombatSkill {
  id: string;
  cooldownKey: string;
  slotIndex: 1 | 2 | 3 | 4 | 5;
  name: string;
  shortLabel: string;
  sourceCategory: 'weapon' | 'belt' | 'utility';
  sourceSlotName: string;
  weaponId?: string;
  weaponMovesetSlot?: number;
  itemId?: string;
  itemCount?: number;
  damage?: number;
  damageType?: DamageType;
  heatCost?: number;
  cooldownSec?: number;
  currentCooldown: number;
  activatesReloadState?: boolean;
  isChain?: boolean;
  activeDurationSec?: number;
  reloadDurationSec?: number;
  activeRemaining?: number;
  isReloading?: boolean;
  isBlock?: boolean;
  description?: string;
  available: boolean;
  unavailableReason?: string;
}

export interface ResolvedCombatSkills {
  skill1: ResolvedCombatSkill | null;
  skill2: ResolvedCombatSkill | null;
  skill3: ResolvedCombatSkill | null;
  skill4: ResolvedCombatSkill | null;
  skill5: ResolvedCombatSkill | null;
}

export function getSkillCooldownKey(
  weaponOrItemId: string,
  movesetSlot?: number,
  instancePrefix: string = 'wpn'
): string {
  if (movesetSlot === undefined) {
    return `item:${weaponOrItemId}`;
  }
  return `${instancePrefix}:${weaponOrItemId}:s${movesetSlot}`;
}

export function getResolvedCombatSkills(state: OrionState): ResolvedCombatSkills {
  const slot1Id =
    state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2Id = state.equipmentSlots?.slot2 || null;
  const slot3Id = state.equipmentSlots?.slot3 || null;

  const w1 = getWeaponDefinition(slot1Id);
  const w2 = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
  const item2 = slot2Id && !w2 ? getItemDefinition(slot2Id) : undefined;
  const w3 = slot3Id ? getWeaponDefinition(slot3Id) : undefined;

  const mainGrip = getEffectiveMainGrip(state);
  const isBow = isTwoHandOnlyWeapon(w1);
  const isPowerStance2H = mainGrip === '2h' || isBow;
  const isPairedStance =
    !isPowerStance2H &&
    Boolean(
      w1 &&
        w2 &&
        isTrueWeaponEquipment(w1) &&
        isTrueWeaponEquipment(w2) &&
        w1.name === w2.name &&
        getOwnedWeaponCount(state, slot1Id) >= 2
    );
  const isUnpairedStance =
    !isPowerStance2H &&
    !isPairedStance &&
    Boolean(w1 && w2 && isTrueWeaponEquipment(w2) && slot2Id !== slot1Id);
  const isSideAuxiliary = Boolean(w2 && isAuxiliaryEquipment(w2));
  const isAuxlAuxiliary = Boolean(w3 && isAuxiliaryEquipment(w3));

  const getItemCount = (itemId: string) => {
    const inv = state.inventorySlots.find((s) => s.itemId === itemId);
    return inv ? inv.count : 0;
  };

  const buildWeaponSkill = (
    actionId: string,
    slotIndex: 1 | 2 | 3 | 4 | 5,
    weaponId: string,
    weaponDef: ReturnType<typeof getWeaponDefinition>,
    movesetSlot: number,
    sourceSlotName: string,
    instancePrefix: string = 'wpn'
  ): ResolvedCombatSkill => {
    const m = weaponDef?.moveset[movesetSlot];
    const cooldownKey = getSkillCooldownKey(weaponId, movesetSlot, instancePrefix);
    const isBlock = Boolean(
      m?.isBlock || (movesetSlot === 3 && isBlockingWeapon(weaponDef || weaponId))
    );
    const isChain = Boolean(!isBlock && (m?.isChain || movesetSlot === 0));
    const activeDurationSec = isBlock ? 0 : m?.activeDurationSec ?? 0;
    const activatesReloadState = !isBlock && (isChain || activeDurationSec > 0);
    const reloadDurationSec = isBlock
      ? undefined
      : m?.reloadDurationSec ??
        (movesetSlot === 0
          ? weaponDef?.reloadDurationSec ?? 1.2
          : activatesReloadState
            ? m?.cooldownSec ?? 3.5
            : undefined);

    const activeRemaining = isBlock
      ? state.isHoldingBlock
        ? Math.max(0.06, 0.25 - (state.blockHoldTimer || 0))
        : Math.max(0, state.blockTimer || 0)
      : Math.max(0, state.skillActiveTimers?.[cooldownKey] || 0);
    const reloadRemaining = isBlock
      ? 0
      : movesetSlot === 0 && state.isReloading
        ? Math.max(0, state.reloadTimer || 0)
        : Math.max(0, state.skillReloadTimers?.[cooldownKey] || 0);
    const separateCd = isBlock
      ? 0
      : movesetSlot === 0
        ? reloadRemaining
        : Math.max(0, state.actionCooldowns?.[cooldownKey] || 0, reloadRemaining);

    return {
      id: actionId,
      cooldownKey,
      slotIndex,
      name: isBlock ? 'Block (Hold · 0.25s Perfect)' : m?.name || `Skill ${slotIndex}`,
      shortLabel: (isBlock ? 'BLOCK' : m?.name || `SKILL ${slotIndex}`)
        .slice(0, 12)
        .toUpperCase(),
      sourceCategory: 'weapon',
      sourceSlotName,
      weaponId,
      weaponMovesetSlot: movesetSlot,
      damage: m?.damage,
      damageType: m?.damageType,
      heatCost: m?.heatCost,
      cooldownSec: isBlock || movesetSlot === 0 ? 0 : m?.cooldownSec ?? 4.0,
      currentCooldown: separateCd,
      activatesReloadState,
      isChain,
      activeDurationSec: activeDurationSec > 0 ? activeDurationSec : undefined,
      reloadDurationSec,
      activeRemaining,
      isReloading: reloadRemaining > 0,
      isBlock,
      description: m?.description,
      available: true,
    };
  };

  const skill1 = buildWeaponSkill(
    'weapon_skill_0',
    1,
    slot1Id,
    w1,
    0,
    `Main: ${w1?.name || slot1Id} [Skill 1]`
  );

  const skill2 = buildWeaponSkill(
    'weapon_skill_1',
    2,
    slot1Id,
    w1,
    1,
    `Main: ${w1?.name || slot1Id} [Skill 2]`
  );

  const skill3 = buildWeaponSkill(
    'weapon_skill_2',
    3,
    slot1Id,
    w1,
    2,
    `Main: ${w1?.name || slot1Id} [Skill 3]`
  );

  let skill4: ResolvedCombatSkill | null = null;
  let skill5: ResolvedCombatSkill | null = null;

  if (isSideAuxiliary && w2 && slot2Id) {
    skill4 = buildWeaponSkill(
      'weapon_slot2_skill4',
      4,
      slot2Id,
      w2,
      3,
      `Side Aux: ${w2.name} [Skill 4]`
    );
    skill5 = buildWeaponSkill(
      'weapon_slot2_skill5',
      5,
      slot2Id,
      w2,
      4,
      `Side Aux: ${w2.name} [Skill 5]`
    );
  } else if (item2 && slot2Id) {
    const count = getItemCount(slot2Id);
    const itemCooldownKey = getSkillCooldownKey(slot2Id);
    const cd = Math.max(
      0,
      state.actionCooldowns?.[itemCooldownKey] || 0,
      state.actionCooldowns?.[slot2Id] || 0
    );
    skill5 = {
      id: `item_${slot2Id}`,
      cooldownKey: itemCooldownKey,
      slotIndex: 5,
      name: `${item2.name} (×${count})`,
      shortLabel: `${item2.name.slice(0, 10).toUpperCase()} ×${count}`,
      sourceCategory: 'belt',
      sourceSlotName: `Side Consumable: ${item2.name} [Skill 5]`,
      itemId: slot2Id,
      itemCount: count,
      cooldownSec: 2.5,
      currentCooldown: cd,
      activatesReloadState: false,
      isChain: false,
      isReloading: false,
      description: item2.description,
      available: count > 0,
      unavailableReason: count <= 0 ? 'CONSUMABLE DEPLETED' : undefined,
    };

    if (isAuxlAuxiliary && w3 && slot3Id) {
      skill4 = buildWeaponSkill(
        'weapon_slot2_skill4',
        4,
        slot3Id,
        w3,
        3,
        `Auxl: ${w3.name} [Skill 4]`
      );
    } else if (isPowerStance2H && w1) {
      skill4 = buildWeaponSkill(
        'weapon_skill_3',
        4,
        slot1Id,
        w1,
        3,
        `Main (2H): ${w1.name} [Skill 4]`
      );
    } else {
      skill4 = {
        id: 'none',
        cooldownKey: 'none_ac4',
        slotIndex: 4,
        name: 'Skill 4 (Inactive)',
        shortLabel: 'NO [1H]',
        sourceCategory: 'weapon',
        sourceSlotName: '1H Grip: ac4 = no',
        currentCooldown: 0,
        available: false,
        unavailableReason: '1H GRIP HAS NO SKILL 4 (EQUIP AUXILIARY OR 2H)',
      };
    }
  } else if (isUnpairedStance && w2 && slot2Id) {
    skill4 = buildWeaponSkill(
      'weapon_slot2_skill4',
      4,
      slot2Id,
      w2,
      1,
      `Side (Unpaired): ${w2.name} [Skill 2]`,
      'wpn_side'
    );
    skill5 = buildWeaponSkill(
      'weapon_slot2_skill5',
      5,
      slot2Id,
      w2,
      2,
      `Side (Unpaired): ${w2.name} [Skill 3]`,
      'wpn_side'
    );
  } else if ((isPairedStance || isPowerStance2H) && w1) {
    const stanceSource = isPairedStance
      ? `Paired: ${w1.name}`
      : `Power Stance (2H): ${w1.name}`;

    skill4 = buildWeaponSkill(
      'weapon_skill_3',
      4,
      slot1Id,
      w1,
      3,
      `${stanceSource} [Skill 4]`
    );
    skill5 = buildWeaponSkill(
      'weapon_skill_4',
      5,
      slot1Id,
      w1,
      4,
      `${stanceSource} [Skill 5]`
    );
  } else {
    skill4 = {
      id: 'none',
      cooldownKey: 'none_ac4',
      slotIndex: 4,
      name: 'Skill 4 (Unavailable in 1H)',
      shortLabel: 'NO [1H]',
      sourceCategory: 'weapon',
      sourceSlotName: '1H Grip: ac4 = no',
      currentCooldown: 0,
      available: false,
      unavailableReason: '1H GRIP: SWITCH TO 2H OR EQUIP SIDE WEAPON / AUXILIARY',
    };
    skill5 = {
      id: 'none',
      cooldownKey: 'none_ac5',
      slotIndex: 5,
      name: 'Skill 5 (Unavailable in 1H)',
      shortLabel: 'NO [1H]',
      sourceCategory: 'weapon',
      sourceSlotName: '1H Grip: ac5 = no',
      currentCooldown: 0,
      available: false,
      unavailableReason: '1H GRIP: SWITCH TO 2H OR SWAP SIDE/AUX WITH [L]',
    };
  }

  return { skill1, skill2, skill3, skill4, skill5 };
}

export function triggerTacticalReload(
  state: OrionState,
  ctx: OrionCombatContext,
  targetSlots: Array<1 | 2 | 3 | 4 | 5> = [1]
): boolean {
  const skills = getResolvedCombatSkills(state);

  for (const slotNum of targetSlots) {
    if (slotNum === 1) continue;
    const sk = skills[`skill${slotNum}` as keyof ResolvedCombatSkills];
    if (!sk || !sk.available || !sk.activatesReloadState) continue;

    const activeRem = state.skillActiveTimers?.[sk.cooldownKey] || 0;
    if (activeRem > 0) {
      state.skillActiveTimers![sk.cooldownKey] = 0;
      const reloadDur =
        state.skillPendingReloadDurations?.[sk.cooldownKey] ??
        sk.reloadDurationSec ??
        2.4;
      state.skillReloadTimers = state.skillReloadTimers || {};
      state.actionCooldowns = state.actionCooldowns || {};
      state.skillReloadTimers[sk.cooldownKey] = reloadDur;
      state.actionCooldowns[sk.cooldownKey] = reloadDur;
      if (sk.isBlock) {
        state.blockTimer = 0;
        state.blockingWeaponId = null;
      }
      soundSystem.playPowerup();
      ctx.say(`${sk.shortLabel} RELOADING (${reloadDur.toFixed(1)}s)`);
      notifyOrionStateChange();
      return true;
    }
  }

  if (!targetSlots.includes(1)) {
    return false;
  }

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

  if (state.ammo >= state.maxAmmo && !state.isReloading) {
    ctx.say(isMeleeOrShield ? 'STANCE READY (FULL)' : 'MAGAZINE FULL');
    return false;
  }

  const reloadDur = state.reloadDuration || weapon.reloadDurationSec;
  const s1Key = getSkillCooldownKey(currentWeaponId, 0);
  state.activeSkillSlot = null;
  state.activeActionId = null;
  state.activeSkillCooldownKey = null;
  state.skillTellTimer = 0;
  state.skillActionTimer = 0;
  state.isReloading = true;
  state.reloadTimer = reloadDur;
  state.skillReloadTimers = state.skillReloadTimers || {};
  state.skillReloadTimers[s1Key] = reloadDur;

  soundSystem.playPowerup();
  ctx.say(isMeleeOrShield ? 'RECOVERING STANCE (RELOAD)' : 'TACTICAL RELOAD');
  notifyOrionStateChange();
  return true;
}

export function startHoldingBlock(
  state: OrionState,
  ctx?: OrionCombatContext,
  weaponIdOverride?: string
): boolean {
  const skills = getResolvedCombatSkills(state);
  const blockSkill = skills.skill4;
  if (!blockSkill || !blockSkill.available || !blockSkill.isBlock) {
    return false;
  }
  if (state.activeActionId) {
    return false;
  }
  if (state.activeSkillSlot === 0) {
    state.activeSkillSlot = null;
    state.activeSkillCooldownKey = null;
    state.skillTellTimer = 0;
    state.skillActionTimer = 0;
    state.combatQueuedChainShot = false;
  }

  const blockWpnId =
    weaponIdOverride ||
    blockSkill.weaponId ||
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[0] ||
    'long_sword';
  const weapon = getWeaponDefinition(blockWpnId);
  const isShieldEquip = weapon?.equipmentRole === 'shield';
  const aim = getCombatAimVector(state);
  const aimAngle = Math.atan2(aim.dy, aim.dx);

  if (!state.isHoldingBlock) {
    state.isHoldingBlock = true;
    state.blockHoldTimer = 0;
    state.blockTimer = PERFECT_BLOCK_WINDOW_SEC;
    state.blockingWeaponId = blockWpnId;

    soundSystem.playSword();
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: aimAngle,
      arcSpan: isShieldEquip ? Math.PI * 0.95 : Math.PI * 0.75,
      radius: isShieldEquip ? 24 : 20,
      width: isShieldEquip ? 16 : 13,
      style: 'bash',
      color: '#38bdf8',
      coreColor: '#ffffff',
      life: PERFECT_BLOCK_WINDOW_SEC,
      maxLife: PERFECT_BLOCK_WINDOW_SEC,
    });

    ctx?.spawnParticles(
      state.x + aim.dx * 8,
      state.y + aim.dy * 8,
      state.z + 8,
      6,
      '#38bdf8',
      'GUARD'
    );
    notifyOrionStateChange();
  }
  return true;
}

export function releaseHeldBlock(state: OrionState): void {
  if (state.isHoldingBlock || (state.blockTimer || 0) > 0) {
    state.isHoldingBlock = false;
    state.blockTimer = 0;
    state.blockHoldTimer = 0;
    state.blockingWeaponId = null;
    notifyOrionStateChange();
  }
}

export function activateResolvedCombatSkill(
  state: OrionState,
  ctx: OrionCombatContext,
  skillIndex: 1 | 2 | 3 | 4 | 5
): boolean {
  if (state.activeActionId) {
    return false;
  }
  if (state.activeSkillSlot !== null && state.activeSkillSlot !== 0) {
    return false;
  }
  if (state.activeSkillSlot === 0) {
    state.activeSkillSlot = null;
    state.activeSkillCooldownKey = null;
    state.skillTellTimer = 0;
    state.skillActionTimer = 0;
    state.combatQueuedChainShot = false;
  }

  const skills = getResolvedCombatSkills(state);
  const skillKey = `skill${skillIndex}` as keyof ResolvedCombatSkills;
  const skill = skills[skillKey];

  if (!skill || !skill.available) {
    soundSystem.playMenuBeep();
    ctx.say(skill?.unavailableReason || `SKILL ${skillIndex} UNAVAILABLE`);
    notifyOrionStateChange();
    return false;
  }

  if ((skill.activeRemaining || 0) > 0) {
    soundSystem.playMenuBeep();
    ctx.say(`${skill.shortLabel} ACTIVE (${skill.activeRemaining!.toFixed(1)}s)`);
    notifyOrionStateChange();
    return false;
  }

  if (skill.currentCooldown > 0) {
    soundSystem.playMenuBeep();
    const stateLabel = skill.isReloading ? 'RELOADING' : 'ON COOLDOWN';
    ctx.say(`${skill.shortLabel} ${stateLabel} (${skill.currentCooldown.toFixed(1)}s)`);
    notifyOrionStateChange();
    return false;
  }

  if (skill.sourceCategory === 'belt' && skill.itemId) {
    const itemId = skill.itemId;
    const invIdx = state.inventorySlots.findIndex((s) => s.itemId === itemId);
    const itemDef = getItemDefinition(itemId);
    if (invIdx < 0 || !itemDef) {
      soundSystem.playMenuBeep();
      ctx.say(`${skill.name} DEPLETED`);
      notifyOrionStateChange();
      return false;
    }

    const used = itemDef.onUse
      ? itemDef.onUse(state, { say: ctx.say, sound: ctx.sound })
      : false;
    if (used) {
      state.inventorySlots[invIdx].count -= 1;
      if (state.inventorySlots[invIdx].count <= 0) {
        state.inventorySlots.splice(invIdx, 1);
      }
      state.actionCooldowns = state.actionCooldowns || {};
      state.actionCooldowns[skill.cooldownKey] = skill.cooldownSec || 2.5;
      ctx.spawnParticles(
        state.x,
        state.y,
        state.z + 8,
        10,
        itemDef.iconColor || '#fbbf24',
        itemDef.name.toUpperCase()
      );
      notifyOrionStateChange();
      return true;
    }
    return false;
  }

  const desc = getResolvedActionDescriptor(state, skill.id);
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const gemCombatMods = getWeaponGemCombatModifiers(state, skill.weaponId);
  const heatPenaltyMult = state.gates?.loadPenalty?.heatMult ?? 1.0;

  const rawHeat = skill.heatCost ?? desc.heatCost ?? 0;
  if (rawHeat > 0) {
    const scaledHeat =
      rawHeat * heatPenaltyMult * featMods.heatGenMult * gemCombatMods.skillHeatCostMult;
    state.heat = Math.min(state.maxHeat, state.heat + scaledHeat);
  } else if (rawHeat < 0) {
    state.heat = Math.max(0, state.heat + rawHeat);
  }

  const cdScale = featMods.cooldownMult * gemCombatMods.skillCooldownMult;
  const finalCd = (skill.cooldownSec ?? desc.cooldownSec ?? 4.0) * cdScale;

  state.actionCooldowns = state.actionCooldowns || {};
  state.skillActiveTimers = state.skillActiveTimers || {};
  state.skillReloadTimers = state.skillReloadTimers || {};
  state.skillPendingReloadDurations = state.skillPendingReloadDurations || {};

  if (skill.isBlock) {
    startHoldingBlock(state, ctx, skill.weaponId);
    return true;
  }

  if (skill.activeDurationSec && skill.activeDurationSec > 0) {
    const reloadDur = (skill.reloadDurationSec ?? finalCd) * cdScale;
    state.skillActiveTimers[skill.cooldownKey] = skill.activeDurationSec;
    state.skillPendingReloadDurations[skill.cooldownKey] = reloadDur;
    state.actionCooldowns[skill.cooldownKey] = 0;
  } else if (skill.isChain) {
    const reloadDur = (skill.reloadDurationSec ?? finalCd) * cdScale;
    state.skillReloadTimers[skill.cooldownKey] = reloadDur;
    state.actionCooldowns[skill.cooldownKey] = reloadDur;
  } else {
    state.actionCooldowns[skill.cooldownKey] = finalCd;
  }

  if (skill.weaponMovesetSlot !== undefined) {
    state.activeSkillSlot = skill.weaponMovesetSlot;
  } else {
    state.activeSkillSlot = skillIndex;
  }

  state.activeActionId = skill.id;
  state.activeSkillCooldownKey = skill.cooldownKey;
  state.skillTellTimer = Math.max(0.05, desc.tellDurationSec);
  state.skillActionTimer = Math.max(0.15, desc.actionDurationSec);

  soundSystem.playCharge();
  notifyOrionStateChange();
  return true;
}
