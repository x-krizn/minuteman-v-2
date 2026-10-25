/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import {
  DIR_VECTORS,
  getDirFromVector,
  WEAPON_SWAP_COOLDOWN,
} from '../constants';
import {
  ASSIGNABLE_ACTION_CATALOG,
  getClassUtilityDefinition,
  getResolvedActionDescriptor,
} from '../database/equipment';
import { getItemDefinition } from '../database/items';
import {
  ACTION_MODIFICATION_CATALOG,
  computeInterfaceFeatModifiers,
  getEffectiveMainGrip,
  getOwnedWeaponCount,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
} from '../database/progression';
import {
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isBlockingWeapon,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
} from '../database/weapons';
import {
  ArmorState,
  DamageType,
  EnemyEntity,
  FrameState,
  OrionCombatContext,
  OrionState,
  ShieldState,
  WeaponStanceType,
} from '../types';
import { getActiveRoomBounds, notifyOrionStateChange } from './playerSystem';
import { updateBladeTrails } from './renderSystem';

// ─── 1. TARGET LOCK-ON & AIMING ──────────────────────────────────────────────

const MAX_LOCK_ON_RANGE = 165;

export function isTargetableEnemy(e: EnemyEntity): boolean {
  if (e.frame.integrity <= 0) return false;
  if (e.isSubmerged) return false;
  if (e.type === 'bog_poe') return false;
  if (e.type === 'town_npc' && e.npcDisposition !== 'feral') return false;
  return true;
}

export function getLockedTarget(state: OrionState): EnemyEntity | null {
  if (state.lockedTargetId === null || state.lockedTargetId === undefined) {
    return null;
  }
  const target = state.enemies.find(
    (e) => e.id === state.lockedTargetId && isTargetableEnemy(e)
  );
  if (!target) return null;
  const dist = Math.hypot(target.x - state.x, target.y - state.y);
  if (dist > MAX_LOCK_ON_RANGE) return null;
  return target;
}

export function cycleTargetLock(
  state: OrionState,
  ctx?: OrionCombatContext
): EnemyEntity | null {
  const candidates = state.enemies
    .filter((e) => isTargetableEnemy(e))
    .map((e) => ({
      entity: e,
      dist: Math.hypot(e.x - state.x, e.y - state.y),
    }))
    .filter((item) => item.dist <= MAX_LOCK_ON_RANGE)
    .sort((a, b) => a.dist - b.dist)
    .map((item) => item.entity);

  if (candidates.length === 0) {
    state.lockedTargetId = null;
    soundSystem.playMenuBeep();
    if (ctx) {
      ctx.say('NO HOSTILE TARGETS IN RANGE');
    }
    notifyOrionStateChange();
    return null;
  }

  if (state.lockedTargetId === null || state.lockedTargetId === undefined) {
    const first = candidates[0];
    state.lockedTargetId = first.id;
    soundSystem.playSelect();
    if (ctx) {
      const label = (first.name || first.type || 'HOSTILE').toUpperCase();
      ctx.say(`TARGET LOCKED: ${label}`);
    }
    notifyOrionStateChange();
    return first;
  }

  const currentIdx = candidates.findIndex((e) => e.id === state.lockedTargetId);
  if (currentIdx === -1) {
    const first = candidates[0];
    state.lockedTargetId = first.id;
    soundSystem.playSelect();
    if (ctx) {
      const label = (first.name || first.type || 'HOSTILE').toUpperCase();
      ctx.say(`TARGET LOCKED: ${label}`);
    }
    notifyOrionStateChange();
    return first;
  }

  if (currentIdx + 1 < candidates.length) {
    const next = candidates[currentIdx + 1];
    state.lockedTargetId = next.id;
    soundSystem.playSelect();
    if (ctx) {
      const label = (next.name || next.type || 'HOSTILE').toUpperCase();
      ctx.say(`TARGET LOCKED: ${label}`);
    }
    notifyOrionStateChange();
    return next;
  } else {
    state.lockedTargetId = null;
    soundSystem.playMenuBeep();
    if (ctx) {
      ctx.say('TARGET LOCK DISENGAGED');
    }
    notifyOrionStateChange();
    return null;
  }
}

export function updateTargetLock(state: OrionState): EnemyEntity | null {
  const target = getLockedTarget(state);
  if (!target) {
    if (state.lockedTargetId !== null) {
      state.lockedTargetId = null;
      notifyOrionStateChange();
    }
    return null;
  }

  const dx = target.x - state.x;
  const dy = target.y - state.y;
  const dist = Math.hypot(dx, dy) || 1;
  state.faceX = dx / dist;
  state.faceY = dy / dist;
  state.dir = getDirFromVector(dx, dy);

  return target;
}

export function getCombatAimVector(state: OrionState): { dx: number; dy: number } {
  const locked = getLockedTarget(state);
  if (locked) {
    const dx = locked.x - state.x;
    const dy = locked.y - state.y;
    const norm = Math.hypot(dx, dy) || 1;
    return { dx: dx / norm, dy: dy / norm };
  }
  if (state.faceX !== 0 || state.faceY !== 0) {
    const norm = Math.hypot(state.faceX, state.faceY) || 1;
    return { dx: state.faceX / norm, dy: state.faceY / norm };
  }
  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  return { dx: dirInfo.dx, dy: dirInfo.dy };
}

// ─── 2. ASSIGNABLE [L] & [R] MULTI-SOURCE ACTIONS ────────────────────────────

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

function normalizeAngleDiff(a: number, b: number): number {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

/**
 * Linear piercing corridor test (for Short Spear, Avalon Lance, Stinger Thrust, Enraged Bors Lunge).
 * Checks forward projection along `angle` within `[-4, length]` and perpendicular distance `<= halfWidth`.
 */
export function isTargetInThrustCorridor(
  ox: number,
  oy: number,
  angle: number,
  length: number,
  halfWidth: number,
  tx: number,
  ty: number
): boolean {
  const rx = tx - ox;
  const ry = ty - oy;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const forward = rx * cos + ry * sin;
  const perp = Math.abs(-rx * sin + ry * cos);
  return forward >= -4 && forward <= length && perp <= halfWidth;
}

/**
 * Directional sector/arc test (for Long Sword slashes, Shotel cleaves, Hand Axe chops, Shield bashes).
 */
export function isTargetInDirectionalArc(
  ox: number,
  oy: number,
  angle: number,
  reach: number,
  arcSpan: number,
  tx: number,
  ty: number
): boolean {
  const dist = Math.hypot(tx - ox, ty - oy);
  if (dist > reach) return false;
  if (dist < 6 || arcSpan >= Math.PI * 1.85) return true;
  const targetAng = Math.atan2(ty - oy, tx - ox);
  return Math.abs(normalizeAngleDiff(targetAng, angle)) <= arcSpan * 0.5 + 0.16;
}

/**
 * Concentrated circular impact zone test centered at `forwardOffset` ahead of the attacker (for Mace slams & Ground tremors).
 */
export function isTargetInImpactZone(
  ox: number,
  oy: number,
  angle: number,
  forwardOffset: number,
  radius: number,
  tx: number,
  ty: number
): boolean {
  const ix = ox + Math.cos(angle) * forwardOffset;
  const iy = oy + Math.sin(angle) * forwardOffset;
  return Math.hypot(tx - ix, ty - iy) <= radius;
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

  const computeEnemyDamage = (
    baseDmg: number,
    faction?: string,
    target?: (typeof state.enemies)[number]
  ) => {
    const oathMult = hasKnightsOath && faction === 'camelot' ? 1.25 : 1.0;
    const isLockedOrStaggered =
      target && (target.id === state.lockedTargetId || target.stun > 0);
    const charoiteMult = isLockedOrStaggered
      ? gemCombatMods.lockedOrStaggeredDamageMult
      : 1.0;
    return Math.round(baseDmg * overdriveMult * opticMult * oathMult * charoiteMult);
  };

  let skillHitGrantedBonus = false;
  const applyHitToEnemy = (
    e: (typeof state.enemies)[number],
    baseDmg: number,
    dmgType: DamageType,
    stunSec: number = 0.35,
    knockbackDist: number = 0,
    extraArmorDent: number = 0
  ) => {
    e.stun = Math.max(e.stun, stunSec);
    e.hurt = 0.22;
    const totalArmorDent = extraArmorDent + gemCombatMods.extraArmorDentOnHit;
    if (totalArmorDent > 0 && e.armor.durability > 0) {
      e.armor.durability = Math.max(0, e.armor.durability - totalArmorDent);
    }
    if (knockbackDist !== 0) {
      const bounds = getActiveRoomBounds(state);
      const kdx = e.x - state.x;
      const kdy = e.y - state.y;
      const kNorm = Math.hypot(kdx, kdy) || 1;
      e.x = Math.max(12, Math.min(bounds.widthPx - 12, e.x + (kdx / kNorm) * knockbackDist));
      e.y = Math.max(12, Math.min(bounds.heightPx - 12, e.y + (kdy / kNorm) * knockbackDist));
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
      Math.round(computeEnemyDamage(baseDmg, e.faction, e) * adaptiveBonusMult),
      resolvedDmgType,
      (count, color, label) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, label)
    );
    soundSystem.playHit();
  };

  // 1. WEAPON SKILLS (Slots 1..4)
  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    const slot = desc.weaponSkillSlot;
    const action = weapon?.moveset[slot] || desc;
    state.bladeTrails = state.bladeTrails || [];

    // ─── SLOT 1: PRIMARY SPECIAL SKILL ───────────────────────────────────────
    if (slot === 1) {
      if (currentWeaponId === 'short_spear') {
        // Impaling Skewer: Deep forward lunge + long narrow piercing corridor (48px reach, ±11px width)
        state.isBoosterDashing = true;
        state.boosterTimer = 0.14;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.25,
          radius: 46,
          length: 48,
          width: 11,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 48, 12, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Pierce', 0.55, 6);
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
      } else if (currentWeaponId === 'avalon_siege_lance') {
        // Breaching Bore: Heavy artillery lance thrust + high-velocity piercing sabot
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.3,
          radius: 44,
          length: 46,
          width: 14,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 245,
          vy: aim.dy * 245,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Pierce',
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
      } else if (currentWeaponId === 'mace') {
        // Skullcracker Overhead: Concentrated frontal overhead slam + crater shockwave + heavy stun
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.6,
          radius: 24,
          length: 18,
          width: 22,
          style: 'slam',
          color: trailColor,
          coreColor,
          life: 0.3,
          maxLife: 0.3,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInImpactZone(state.x, state.y, aimAngle, 18, 22, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Impact', 1.1, 8, 8);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 18,
          state.y + aim.dy * 18,
          state.z + 4,
          12,
          trailColor,
          action.name || 'SKULLCRACKER!'
        );
        soundSystem.playExplosion();
      } else if (currentWeaponId === 'long_sword' || currentWeaponId === 'khopesh') {
        // Vanguard Stinger Thrust / Execution Lunge: Forward dash + linear point thrust
        state.isBoosterDashing = true;
        state.boosterTimer = 0.14;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        const thrustLen = currentWeaponId === 'long_sword' ? 44 : 38;
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
            applyHitToEnemy(e, action.damage, 'Pierce', 0.5, 6);
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
      } else if (currentWeaponId === 'hand_axe') {
        // Guillotine Split: Leaping downward chop + impact split
        state.isBoosterDashing = true;
        state.boosterTimer = 0.12;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        state.bladeTrails.push({
          x: state.x + aim.dx * 6,
          y: state.y + aim.dy * 6,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.65,
          radius: 26,
          width: 16,
          style: 'chop',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 30, Math.PI * 0.75, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Pierce', 0.6, 6, 5);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 6,
          9,
          trailColor,
          action.name
        );
        soundSystem.playSword();
      } else if (weapon?.equipmentRole === 'shield') {
        // Shield Slot 1: Buckler Parry / Heater Shield Charge / Pavise Fortress Plant
        const shieldRestore =
          currentWeaponId === 'pavise_shield'
            ? 35
            : currentWeaponId === 'buckler_shield'
              ? 15
              : 10;
        state.shields.overloaded = false;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + shieldRestore
        );
        if (currentWeaponId === 'heater_shield') {
          state.isBoosterDashing = true;
          state.boosterTimer = 0.16;
          state.boosterDirX = aim.dx;
          state.boosterDirY = aim.dy;
        }
        const isPavisePlant = currentWeaponId === 'pavise_shield';
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: isPavisePlant ? Math.PI * 2 : Math.PI * 0.75,
          radius: isPavisePlant ? 30 : 26,
          width: 18,
          style: isPavisePlant ? 'shockwave' : 'bash',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          const hit = isPavisePlant
            ? Math.hypot(e.x - state.x, e.y - state.y) <= 32
            : isTargetInDirectionalArc(state.x, state.y, aimAngle, 34, Math.PI * 0.85, e.x, e.y);
          if (hit) {
            applyHitToEnemy(e, action.damage, action.damageType, 1.1, 14);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 8, 10, trailColor, action.name);
        soundSystem.playSword();
      } else {
        // Ranged Slot 1 (Boltcaster AP Slug / Great Bow Bodkin Rail-Shot / Quiver Snap-Load Salvo)
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
        if (currentWeaponId === 'quiver') {
          state.ammo = Math.min(state.maxAmmo, state.ammo + 4);
          state.isReloading = false;
          for (const off of [-0.1, 0, 0.1]) {
            const ang = aimAngle + off;
            state.projectiles.push({
              x: state.x + Math.cos(ang) * 8,
              y: state.y + Math.sin(ang) * 8,
              z: state.z + 6,
              vx: Math.cos(ang) * 215,
              vy: Math.sin(ang) * 215,
              vz: 0,
              damage: Math.round(action.damage * 0.55 * overdriveMult),
              damageType: 'Pierce',
              isPlayer: true,
              life: 0.75,
              radius: 3,
              color: trailColor,
              trailColor: coreColor,
              lightRadius: 20,
            });
          }
        } else {
          state.projectiles.push({
            x: state.x + aim.dx * 10,
            y: state.y + aim.dy * 10,
            z: state.z + 6,
            vx: aim.dx * (currentWeaponId === 'great_bow' ? 255 : 230),
            vy: aim.dy * (currentWeaponId === 'great_bow' ? 255 : 230),
            vz: 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: action.damageType,
            isPlayer: true,
            life: 0.9,
            radius: currentWeaponId === 'great_bow' ? 5 : 4.5,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 26,
          });
        }
        soundSystem.playLaser();
      }
      return;
    }

    // ─── SLOT 2: TACTICAL SECONDARY / CONTROL SKILL ──────────────────────────
    if (slot === 2) {
      if (currentWeaponId === 'mace') {
        // Bell-Toll Shockwave: Radial ground shockwave ring centered on player
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
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 36) {
            applyHitToEnemy(e, action.damage, 'Blast', 1.25, 10, 6);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 6, 12, trailColor, action.name);
        soundSystem.playExplosion();
      } else if (currentWeaponId === 'buckler_shield') {
        // Ricochet Disc Toss: Throws magnetized buckler projectile + bash arc
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.6,
          radius: 18,
          style: 'bash',
          color: trailColor,
          coreColor,
          life: 0.2,
          maxLife: 0.2,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 175,
          vy: aim.dy * 175,
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
        // Siegebreaker Tremor: Drives pavise spike into floor for frontal slam + tremor
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
      } else if (currentWeaponId === 'hand_axe') {
        // Bearded Hook Pull: Chop hook that pulls enemies toward the player and staggers them!
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.58,
          radius: 28,
          width: 14,
          style: 'chop',
          color: trailColor,
          coreColor,
          life: 0.25,
          maxLife: 0.25,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 32, Math.PI * 0.7, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Impact', 0.95, -12);
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
      } else if (currentWeaponId === 'short_spear') {
        // Shaft Sweep Vault: Wide low polearm sweep + vaults player slightly back to keep spear distance
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 1.05,
          radius: 28,
          style: 'slash',
          color: trailColor,
          coreColor,
          life: 0.24,
          maxLife: 0.24,
        });
        const bounds = getActiveRoomBounds(state);
        state.x = Math.max(12, Math.min(bounds.widthPx - 12, state.x - aim.dx * 7));
        state.y = Math.max(12, Math.min(bounds.heightPx - 12, state.y - aim.dy * 7));
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 32, Math.PI * 1.15, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Impact', 1.1, 8);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 6, 8, trailColor, action.name);
        soundSystem.playSword();
      } else if (
        currentWeaponId === 'long_sword' ||
        currentWeaponId === 'khopesh' ||
        currentWeaponId === 'heater_shield' ||
        currentWeaponId === 'avalon_siege_lance'
      ) {
        // Crescent Cleave / Hamstring Arc / Bell-Ringer Slam / Bastion Phalanx Sweep
        soundSystem.playSword();
        const isHeaterSlam = currentWeaponId === 'heater_shield';
        const reach = currentWeaponId === 'avalon_siege_lance' ? 40 : isHeaterSlam ? 28 : 32;
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
            if (currentWeaponId === 'khopesh') {
              e.speed = Math.max(12, e.speed * 0.65);
            }
            applyHitToEnemy(
              e,
              action.damage,
              action.damageType || 'Pierce',
              isHeaterSlam ? 1.25 : 0.85,
              currentWeaponId === 'avalon_siege_lance' ? 16 : 8
            );
          }
        }
      } else if (currentWeaponId === 'great_bow' || currentWeaponId === 'quiver') {
        // Broadhead Fan Volley / Caltrop Scatter
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
          currentWeaponId === 'great_bow'
            ? [-0.26, -0.13, 0, 0.13, 0.26]
            : [-0.36, -0.18, 0, 0.18, 0.36];
        const speed = currentWeaponId === 'great_bow' ? 195 : 135;
        const life = currentWeaponId === 'great_bow' ? 0.65 : 0.42;
        for (const off of offsets) {
          const ang = aimAngle + off;
          state.projectiles.push({
            x: state.x + Math.cos(ang) * 8,
            y: state.y + Math.sin(ang) * 8,
            z: state.z + 6,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            vz: 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: 'Pierce',
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
        // Concussion Grenade / Concussion Mortar (Gladius Boltcaster & Avalon Siege Lance)
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
        state.projectiles.push({
          x: state.x + aim.dx * 8,
          y: state.y + aim.dy * 8,
          z: state.z + 8,
          vx: aim.dx * 120,
          vy: aim.dy * 120,
          vz: 20,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Blast',
          isPlayer: true,
          life: 0.6,
          radius: 5,
          color: gemVis.gemId ? trailColor : '#ea580c',
          trailColor: gemVis.gemId ? coreColor : '#f97316',
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
                  computeEnemyDamage(action.damage, e.faction),
                  'Blast'
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
        // Skill 4 is ALWAYS Block for all equippable blocking weapons (held with 0.25s perfect window, no cooldown)
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
        // Pinning Tether Arrow / Tracer Tag Dart / Æther Refraction Ward
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
        // Gladius Boltcaster Suppression Arc (4-bolt horizontal fan)
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
        // Javelin ReactorHurl: Linear spear thrust release + high-velocity piercing javelin bolt
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
        // Sanctum Consecration Slam: Overhead slam + wide sanctum shockwave ring
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
        // Excalibur Judgment Arc: Wide crescent slash + resonant forward wave projectile
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
        // Grail Overcharge Barrage: Long reactor lance bore corridor + heavy wave projectile
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
        // Shield Slot 4: Capacitor Flash Counter / Sanctum Phalanx Wall / Citadel Aegis Overcharge
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
        // Khopesh Whirlwind Sever / Hand Axe Berserker Cyclone: 360-degree whirlwind vortex
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
        // Hurricane Quiver Dump: High-velocity 7-shaft fan
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
        // Gladius Overcharge Discharge / Great Bow Starfall Arc Barrage
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

  // Skills that are active for a duration transition into a reload state when their active duration ends
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

// ─── 3. THREE DEFENSE LAYERS, WEAPON SWAPS & COMBAT LOOP ─────────────────────

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

  // 1. Consumable swapped into Side Hand (consumables only occupy Skill 5; Aux Shield/Quiver/Catalyst in Auxl provides Skill 4)
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

  // 2. Auxiliary (Shield, Quiver, Catalyst) in Side Hand -> always replaces Skill 4 & Skill 5
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

  // 3. Two-Handing, Power Stance: main: sword1(2h), side: sword1(2h) (or 2H-only Bow)
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

  // 4. Dual-Wield, Paired Stance: main: sword1, side: sword1 (requires matching name & 2 separate items)
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

  // 5. Dual-Wield, Unpaired Stance: main: sword1, side: sword2 (any two weapons)
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

  // 6. Single 1H Weapon (Side Hand empty -> 1h: ac1=yes, ac2=yes, ac3=yes, ac4=no, ac5=no)
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

/**
 * Swapping weapons ([L] Hold):
 * - Main Hand (`slot1`) NEVER swaps with [L].
 * - Side Hand (`slot2`) and Auxiliary (`slot3`) switch places.
 */
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

  // If currently in 2H Power Stance (where slot2 mirrors slot1 as sword1(2h)) and Aux has an item:
  // Swapping Side <-> Aux brings Aux into Side and releases the 2H grip into 1H (unless Bow).
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
    // Standard Side <-> Aux swap (Main Hand never swaps with L)
    slots.slot2 = slot3;
    slots.slot3 = slot2;
    if (!slots.slot2) {
      // No Side Hand equipped -> Main Hand is automatically 2H
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

// [ORION-ANCHOR: COMBAT-DEFENSE-MATH]
export function applyDamageToLayers(
  shields: ShieldState,
  armor: ArmorState,
  frame: FrameState,
  rawDamage: number,
  _damageType: DamageType,
  spawnParticles?: (count: number, color: string, label: string) => void
): { absorbedByShield: number; stoppedByArmor: boolean; frameDamage: number } {
  let remaining = rawDamage;
  let absorbedByShield = 0;
  let stoppedByArmor = false;
  let frameDamage = 0;

  // 1. SHIELD LAYER
  if (shields.capacity > 0) {
    if (remaining <= shields.capacity) {
      shields.capacity -= remaining;
      absorbedByShield = remaining;
      remaining = 0;
      shields.rechargeDelay = 3.0;
      spawnParticles?.(4, '#77c7ff', 'SHIELD ABSORB');
      return { absorbedByShield, stoppedByArmor: false, frameDamage: 0 };
    } else {
      absorbedByShield = shields.capacity;
      remaining -= shields.capacity;
      shields.capacity = 0;
      shields.overloaded = true;
      shields.overloadTimer = 4.0;
      spawnParticles?.(8, '#77c7ff', 'SHIELD BROKEN!');
    }
  }

  // 2. ARMOR LAYER
  if (armor.durability > 0 && remaining > 0) {
    const durabilityLoss = Math.min(armor.durability, Math.max(3, Math.round(remaining * 0.3)));
    armor.durability -= durabilityLoss;

    const durRatio = Math.max(0.1, armor.durability / armor.maxDurability);
    const effThreshold = armor.threshold * durRatio;
    const effRating = armor.rating * durRatio;

    if (remaining < effThreshold) {
      stoppedByArmor = true;
      spawnParticles?.(5, '#ffd27d', 'ARMOR DEFLECT');
      return { absorbedByShield, stoppedByArmor: true, frameDamage: 0 };
    }

    remaining = Math.max(1, remaining - effRating);
    spawnParticles?.(5, '#ffd27d', 'ARMOR PIERCED');
  }

  // 3. FRAME INTEGRITY LAYER
  if (remaining > 0) {
    frameDamage = Math.round(remaining);
    frame.integrity = Math.max(0, frame.integrity - frameDamage);

    if (frame.integrity <= 0) {
      frame.state = 'Defeated';
      spawnParticles?.(12, '#ff9b9b', 'FRAME DESTROYED');
    } else if (frame.integrity <= 40) {
      frame.state = 'Critical';
      spawnParticles?.(8, '#ff9b9b', `CRITICAL! -${frameDamage}`);
    } else {
      frame.state = 'Operational';
      spawnParticles?.(6, '#8dd7ad', `-${frameDamage} FRAME`);
    }
  }

  return { absorbedByShield, stoppedByArmor, frameDamage };
}

export interface ResolvedCombatSkill {
  id: string;
  /** Unique per-weapon/per-item cooldown key so all skills track cooldowns separately */
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
  /** True only for skills that chain (`isChain`) or are active for a duration (`activeDurationSec > 0`) */
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

  // ac1 (Skill 1): Main Hand Skill 1 (moveset[0] — Chain Skill)
  const skill1 = buildWeaponSkill(
    'weapon_skill_0',
    1,
    slot1Id,
    w1,
    0,
    `Main: ${w1?.name || slot1Id} [Skill 1]`
  );

  // ac2 (Skill 2): Main Hand Skill 2 (moveset[1])
  const skill2 = buildWeaponSkill(
    'weapon_skill_1',
    2,
    slot1Id,
    w1,
    1,
    `Main: ${w1?.name || slot1Id} [Skill 2]`
  );

  // ac3 (Skill 3): Main Hand Skill 3 (moveset[2])
  const skill3 = buildWeaponSkill(
    'weapon_skill_2',
    3,
    slot1Id,
    w1,
    2,
    `Main: ${w1?.name || slot1Id} [Skill 3]`
  );

  // ─── ac4 (Skill 4) & ac5 (Skill 5) Resolution ───────────────────────────────
  let skill4: ResolvedCombatSkill | null = null;
  let skill5: ResolvedCombatSkill | null = null;

  // Case 1: Side Hand holds an Auxiliary (Shield, Quiver, Catalyst)
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
  }
  // Case 2: Side Hand holds a Swapped Consumable (consumables only occupy Skill 5)
  else if (item2 && slot2Id) {
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
  }
  // Case 3: Dual-Wield Unpaired Stance (main: sword1, side: sword2)
  // ac4 = sword2 skill 2, ac5 = sword2 skill 3 (tracked separately from main hand!)
  else if (isUnpairedStance && w2 && slot2Id) {
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
  }
  // Case 4: Dual-Wield Paired Stance OR Two-Handing Power Stance
  else if ((isPairedStance || isPowerStance2H) && w1) {
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
  }
  // Case 5: 1H Main Hand with Empty Side Hand -> ac4 = no, ac5 = no
  else {
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

  // Check if any targeted slot (2..5) has an active duration skill that can be ended early into reload,
  // or is a chain/duration skill:
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

  // Only Skill 1 (primary chain) reloads the main weapon chain/magazine when targetSlots includes 1
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

export function activateResolvedCombatSkill(
  state: OrionState,
  ctx: OrionCombatContext,
  skillIndex: 1 | 2 | 3 | 4 | 5
): boolean {
  // Special skills (2..5) can cancel an in-progress basic attack swing (activeSkillSlot === 0),
  // whereas an active special action (activeActionId !== null) cannot be interrupted.
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

  // If this skill is currently active for a duration, let the player know it is active
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

  // Belt item activation (tracked separately by skill.cooldownKey)
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

  // Weapon Skill Activation — Cooldowns tracked strictly per-skill via skill.cooldownKey
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

  // Block is held with a 0.25s Perfect Block window and NEVER goes on a cooldown or reload state!
  if (skill.isBlock) {
    startHoldingBlock(state, ctx, skill.weaponId);
    return true;
  }

  // Rule: "skills that chain or are active for a duration are the only skills that activate a reload state."
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
    // Standard instant skill — only sets its own separate cooldown; NEVER activates a reload state
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

export const PERFECT_BLOCK_WINDOW_SEC = 0.25;

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

export function firePrimarySalvoShot(
  state: OrionState,
  ctx: OrionCombatContext,
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
    ctx.say(isMeleeOrShield ? 'RECOVERING STANCE...' : 'RELOADING...');
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
  return true;
}

const DOUBLE_TAP_WINDOW_SEC = 0.26;
const HOLD_TRIGGER_THRESHOLD_SEC = 0.22;

export function handleCombatInput(
  input: {
    pressed: { a: boolean; b: boolean; x: boolean; y: boolean; l: boolean; r: boolean; select: boolean };
    held: { x: boolean; y: boolean; b: boolean; r?: boolean; l?: boolean };
  },
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  const currentWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const weapon = getWeaponDefinition(currentWeaponId);
  if (!weapon) return;

  const isMeleeOrShield =
    weapon.equipmentRole === 'melee' ||
    weapon.equipmentRole === 'shield' ||
    currentWeaponId === 'khopesh';

  // 1. Tick primary chain reloading
  if (state.isReloading) {
    const reloadMult = (state.overdriveTimer || 0) > 0 ? 1.6 : 1.0;
    state.reloadTimer -= dt * reloadMult;
    const s1Key = getSkillCooldownKey(currentWeaponId, 0);
    if (state.skillReloadTimers) {
      state.skillReloadTimers[s1Key] = Math.max(0, state.reloadTimer);
    }
    if (state.reloadTimer <= 0) {
      state.isReloading = false;
      state.ammo = state.maxAmmo;
      if (state.skillReloadTimers) {
        state.skillReloadTimers[s1Key] = 0;
      }
      soundSystem.playSelect();
      ctx.say(isMeleeOrShield ? 'BLADE STANCE READY' : 'MAGAZINE RELOADED');
      notifyOrionStateChange();
    }
  }

  // 2. Initialize timer objects on state
  state.combatInputTimers = state.combatInputTimers || { x: 0, y: 0, r: 0, l: 0 };
  state.combatHoldTimers = state.combatHoldTimers || { x: 0, y: 0, r: 0, l: 0 };
  state.combatHoldTriggered = state.combatHoldTriggered || {
    x: false,
    y: false,
    r: false,
    l: false,
  };
  state.combatTapPending = state.combatTapPending || {
    x: false,
    y: false,
    r: false,
    l: false,
  };
  state.combatDoubleTapPending = state.combatDoubleTapPending || {
    x: false,
    y: false,
    r: false,
    l: false,
  };

  // Tick down double-tap windows
  for (const k of ['x', 'y', 'r', 'l'] as const) {
    if (state.combatInputTimers[k] > 0) {
      state.combatInputTimers[k] = Math.max(0, state.combatInputTimers[k] - dt);
    }
  }

  const p = input.pressed;
  const h = {
    x: !!input.held.x,
    y: !!input.held.y,
    r: !!input.held.r,
    l: !!input.held.l,
  };

  // ─── [X] BUTTON: Single Tap = [chain manual] · Double Tap = [reload chain] · Hold = [chain auto] ───
  if (p.x) {
    state.combatHoldTimers.x = 0;
    state.combatHoldTriggered.x = false;

    const isMidBasicSwing = state.activeSkillSlot === 0 && !state.activeActionId;
    if (state.combatInputTimers.x > 0 && !isMidBasicSwing && state.ammo < state.maxAmmo && !state.isReloading) {
      // Double-tap from idle with partial ammo -> Tactical Reload
      state.combatInputTimers.x = 0;
      state.combatQueuedChainShot = false;
      triggerTacticalReload(state, ctx, [1]);
    } else {
      state.combatInputTimers.x = DOUBLE_TAP_WINDOW_SEC;
      if (!state.isReloading && !state.activeActionId) {
        if (state.activeSkillSlot === null) {
          firePrimarySalvoShot(state, ctx, false);
        } else if (state.activeSkillSlot === 0) {
          // Buffer the next manual shot in the chain so tapping [X] chains smoothly!
          state.combatQueuedChainShot = true;
        }
      }
    }
  }

  if (h.x) {
    state.combatHoldTimers.x += dt;
    if (state.combatHoldTimers.x >= HOLD_TRIGGER_THRESHOLD_SEC && !state.combatHoldTriggered.x) {
      state.combatHoldTriggered.x = true;
      state.combatActiveChain = true;
      state.combatInputTimers.x = 0;
    }
    if (
      state.combatActiveChain &&
      !state.isReloading &&
      state.activeSkillSlot === null &&
      !state.activeActionId
    ) {
      firePrimarySalvoShot(state, ctx, true);
    }
  } else {
    state.combatHoldTimers.x = 0;
    state.combatHoldTriggered.x = false;
    state.combatActiveChain = false;
  }

  // ─── [Y] BUTTON: Tap Release = [Skill 2] · Double Tap Release = [reload 2/4 or Skill 2] · Hold = [Skill 4 / Held Block] ───
  // Skill 2 NEVER activates on button-down or during a long-press hold for Skill 4!
  if (p.y) {
    const isDoubleTap = state.combatInputTimers.y > 0;
    state.combatInputTimers.y = isDoubleTap ? 0 : DOUBLE_TAP_WINDOW_SEC;
    state.combatHoldTimers.y = 0;
    state.combatHoldTriggered.y = false;
    state.combatTapPending.y = true;
    state.combatDoubleTapPending.y = isDoubleTap;
  }

  if (h.y) {
    state.combatHoldTimers.y += dt;
    const skills = getResolvedCombatSkills(state);
    const isSkill4Block = Boolean(skills.skill4?.available && skills.skill4?.isBlock);
    const yHoldThreshold = isSkill4Block ? 0.14 : HOLD_TRIGGER_THRESHOLD_SEC;

    if (state.combatHoldTimers.y >= yHoldThreshold) {
      state.combatTapPending.y = false;
      state.combatDoubleTapPending.y = false;
      state.combatInputTimers.y = 0;
      if (!state.combatHoldTriggered.y && !state.activeActionId) {
        state.combatHoldTriggered.y = true;
        if (isSkill4Block) {
          startHoldingBlock(state, ctx, skills.skill4?.weaponId);
        } else {
          activateResolvedCombatSkill(state, ctx, 4);
        }
      }
    }
  } else {
    if (state.isHoldingBlock) {
      releaseHeldBlock(state);
    }
    if (state.combatTapPending.y && !state.combatHoldTriggered.y) {
      const wasDoubleTap = state.combatDoubleTapPending.y;
      state.combatTapPending.y = false;
      state.combatDoubleTapPending.y = false;
      if (wasDoubleTap) {
        if (!triggerTacticalReload(state, ctx, [2, 4])) {
          activateResolvedCombatSkill(state, ctx, 2);
        }
      } else {
        activateResolvedCombatSkill(state, ctx, 2);
      }
    }
    state.combatHoldTimers.y = 0;
    state.combatHoldTriggered.y = false;
    state.combatTapPending.y = false;
    state.combatDoubleTapPending.y = false;
  }

  // ─── [R] BUTTON: Tap Release = [Skill 3] · Double Tap Release = [reload 3/5 or Skill 3] · Hold = [Skill 5] ───
  // Skill 3 NEVER activates on button-down or during a long-press hold for Skill 5!
  if (p.r) {
    const isDoubleTap = state.combatInputTimers.r > 0;
    state.combatInputTimers.r = isDoubleTap ? 0 : DOUBLE_TAP_WINDOW_SEC;
    state.combatHoldTimers.r = 0;
    state.combatHoldTriggered.r = false;
    state.combatTapPending.r = true;
    state.combatDoubleTapPending.r = isDoubleTap;
  }

  if (h.r) {
    state.combatHoldTimers.r += dt;
    if (state.combatHoldTimers.r >= HOLD_TRIGGER_THRESHOLD_SEC) {
      state.combatTapPending.r = false;
      state.combatDoubleTapPending.r = false;
      state.combatInputTimers.r = 0;
      if (!state.combatHoldTriggered.r && !state.activeActionId) {
        state.combatHoldTriggered.r = true;
        activateResolvedCombatSkill(state, ctx, 5);
      }
    }
  } else {
    if (state.combatTapPending.r && !state.combatHoldTriggered.r) {
      const wasDoubleTap = state.combatDoubleTapPending.r;
      state.combatTapPending.r = false;
      state.combatDoubleTapPending.r = false;
      if (wasDoubleTap) {
        if (!triggerTacticalReload(state, ctx, [3, 5])) {
          activateResolvedCombatSkill(state, ctx, 3);
        }
      } else {
        activateResolvedCombatSkill(state, ctx, 3);
      }
    }
    state.combatHoldTimers.r = 0;
    state.combatHoldTriggered.r = false;
    state.combatTapPending.r = false;
    state.combatDoubleTapPending.r = false;
  }

  // ─── [L] BUTTON: Single Tap Release = [lock/cycle] · Double Tap Release = [unlock] · Hold = [swap] ───
  if (p.l) {
    const isDoubleTap = state.combatInputTimers.l > 0 && state.lockedTargetId !== null;
    state.combatInputTimers.l = isDoubleTap ? 0 : DOUBLE_TAP_WINDOW_SEC;
    state.combatHoldTimers.l = 0;
    state.combatHoldTriggered.l = false;
    state.combatTapPending.l = true;
    state.combatDoubleTapPending.l = isDoubleTap;
  }

  if (h.l) {
    state.combatHoldTimers.l += dt;
    if (state.combatHoldTimers.l >= HOLD_TRIGGER_THRESHOLD_SEC) {
      state.combatTapPending.l = false;
      state.combatDoubleTapPending.l = false;
      state.combatInputTimers.l = 0;
      if (!state.combatHoldTriggered.l) {
        state.combatHoldTriggered.l = true;
        performAuxiliarySwap(state, ctx);
      }
    }
  } else {
    if (state.combatTapPending.l && !state.combatHoldTriggered.l) {
      const wasDoubleTap = state.combatDoubleTapPending.l;
      state.combatTapPending.l = false;
      state.combatDoubleTapPending.l = false;
      if (wasDoubleTap && state.lockedTargetId !== null) {
        state.lockedTargetId = null;
        soundSystem.playMenuBeep();
        ctx.say('TARGET UNLOCKED');
        notifyOrionStateChange();
      } else {
        cycleTargetLock(state, ctx);
      }
    }
    state.combatHoldTimers.l = 0;
    state.combatHoldTriggered.l = false;
    state.combatTapPending.l = false;
    state.combatDoubleTapPending.l = false;
  }
}

export function updateCombat(
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const loadPenalty = state.gates?.loadPenalty;

  if (state.weaponSwapCooldown > 0) {
    state.weaponSwapCooldown = Math.max(0, state.weaponSwapCooldown - dt);
  }

  if (state.boosterCooldown > 0) state.boosterCooldown = Math.max(0, state.boosterCooldown - dt);
  if (state.isBoosterDashing && !state.isContinuousBoosting) {
    state.boosterTimer -= dt;
    if (state.boosterTimer <= 0) state.isBoosterDashing = false;
  }

  for (let s = 0; s < state.skillCooldowns.length; s++) {
    if (state.skillCooldowns[s] > 0) {
      state.skillCooldowns[s] = Math.max(0, state.skillCooldowns[s] - dt);
    }
  }
  updateActionTimers(state, dt);
  updateBladeTrails(state, dt);

  if (state.shields.type === 'energy') {
    if (state.shields.overloaded) {
      state.shields.overloadTimer -= dt;
      if (state.shields.overloadTimer <= 0) {
        state.shields.overloaded = false;
      }
    } else if (state.shields.capacity < state.shields.maxCapacity) {
      if (state.shields.rechargeDelay > 0) {
        state.shields.rechargeDelay -= dt;
      } else {
        state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + 15 * dt);
      }
    }
  }

  if (state.heat > 0 && !state.isContinuousBoosting) {
    state.heat = Math.max(0, state.heat - 12 * featMods.heatVentMult * dt);
  }

  if (state.activeSkillSlot !== null || state.activeActionId) {
    const currentWeaponId =
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

    if (state.skillTellTimer > 0) {
      state.skillTellTimer -= dt;
      if (Math.random() < 0.4) {
        state.particles.push({
          x: state.x + (Math.random() - 0.5) * 8,
          y: state.y + (Math.random() - 0.5) * 8,
          z: state.z + 8,
          vx: 0,
          vy: -10,
          vz: 10,
          life: 0.2,
          maxLife: 0.2,
          color: trailColor,
          size: 2,
          fade: true,
        });
      }

      if (state.skillTellTimer <= 0) {
        if (state.activeSkillSlot === 0 && !state.activeActionId) {
          const action = weapon?.moveset[0];
          const aim = getCombatAimVector(state);
          const gemCombatMods = getWeaponGemCombatModifiers(state, currentWeaponId);
          const overdriveMult =
            ((state.overdriveTimer || 0) > 0 ? 1.3 : 1.0) *
            featMods.damageMult *
            gemCombatMods.damageMult;

          if (action && state.ammo > 0) {
            state.ammo -= 1;
            const shotHeat =
              action.heatCost * (loadPenalty?.heatMult ?? 1.0) * featMods.heatGenMult;
            state.heat = Math.min(state.maxHeat, state.heat + shotHeat);
            const shotDmg = Math.round(action.damage * overdriveMult);

            // §3.5 Critical Frame State (LOCKED): 15% misfire chance per shot when Frame Integrity <= 40 HP
            const isCriticalMisfire =
              state.frame.integrity <= 40 && Math.random() < 0.15;

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
              let basicHitGrantedBonus = false;
              const resolveMeleeHit = (
                e: (typeof state.enemies)[number],
                stunSec: number = 0.22,
                knockbackDist: number = 0,
                extraArmorDent: number = 0,
                shieldBypassRatio: number = 0
              ) => {
                e.stun = Math.max(e.stun, stunSec);
                e.hurt = 0.2;
                const totalDent = extraArmorDent + gemCombatMods.extraArmorDentOnHit;
                if (totalDent > 0 && e.armor.durability > 0) {
                  e.armor.durability = Math.max(0, e.armor.durability - totalDent);
                }
                if (knockbackDist > 0) {
                  const bounds = getActiveRoomBounds(state);
                  const kdx = e.x - state.x;
                  const kdy = e.y - state.y;
                  const kNorm = Math.hypot(kdx, kdy) || 1;
                  e.x = Math.max(12, Math.min(bounds.widthPx - 12, e.x + (kdx / kNorm) * knockbackDist));
                  e.y = Math.max(12, Math.min(bounds.heightPx - 12, e.y + (kdy / kNorm) * knockbackDist));
                }
                if (!basicHitGrantedBonus) {
                  basicHitGrantedBonus = true;
                  if (gemCombatMods.heatVentOnBasicHit > 0) {
                    state.heat = Math.max(0, state.heat - gemCombatMods.heatVentOnBasicHit);
                  }
                  if (gemCombatMods.presenceGainOnHit > 0) {
                    state.presence = Math.min(
                      100,
                      (state.presence || 0) + gemCombatMods.presenceGainOnHit
                    );
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
                const oathMult = hasKnightsOath && e.faction === 'camelot' ? 1.25 : 1.0;
                const isLockedOrStaggered =
                  e.id === state.lockedTargetId || e.stun > 0;
                const charoiteMult = isLockedOrStaggered
                  ? gemCombatMods.lockedOrStaggeredDamageMult
                  : 1.0;
                const adaptiveMult = weapon?.adaptiveDamageTypes ? 1.12 : 1.0;
                const effDamage = Math.round(shotDmg * oathMult * opticMult * charoiteMult * adaptiveMult);
                const resolvedDmgType = weapon?.adaptiveDamageTypes
                  ? e.shields.capacity > 0
                    ? weapon.adaptiveDamageTypes[0]
                    : weapon.adaptiveDamageTypes[1]
                  : action.damageType;
                if (shieldBypassRatio > 0 && e.shields.capacity > 0) {
                  const bypassed = Math.max(1, Math.round(effDamage * shieldBypassRatio));
                  const normalPortion = Math.max(0, effDamage - bypassed);
                  if (normalPortion > 0) {
                    applyDamageToLayers(e.shields, e.armor, e.frame, normalPortion, resolvedDmgType);
                  }
                  const savedShield = e.shields.capacity;
                  e.shields.capacity = 0;
                  applyDamageToLayers(
                    e.shields,
                    e.armor,
                    e.frame,
                    bypassed,
                    resolvedDmgType,
                    (count, color, label) =>
                      ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, label)
                  );
                  e.shields.capacity = savedShield;
                } else {
                  applyDamageToLayers(
                    e.shields,
                    e.armor,
                    e.frame,
                    effDamage,
                    resolvedDmgType,
                    (count, color, label) =>
                      ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, label)
                  );
                }
                soundSystem.playHit();
              };

              state.bladeTrails = state.bladeTrails || [];

              if (currentWeaponId === 'short_spear') {
                // Short Spear: Long linear piercing thrust corridor (38px reach, narrow ±10px corridor)
                const jitter = ((state.ammo % 3) - 1) * 0.04;
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle + jitter,
                  arcSpan: Math.PI * 0.22,
                  radius: 36,
                  length: 38,
                  width: 9,
                  style: 'thrust',
                  color: trailColor,
                  coreColor,
                  life: 0.2,
                  maxLife: 0.2,
                  flipDir: state.ammo % 2 === 0,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 38, 11, e.x, e.y)) {
                    resolveMeleeHit(e, 0.22, 3);
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
              } else if (currentWeaponId === 'avalon_siege_lance') {
                // Avalon Heavy Lance: Heavy lance bore thrust + kinetic siege slug
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle,
                  arcSpan: Math.PI * 0.28,
                  radius: 34,
                  length: 36,
                  width: 12,
                  style: 'thrust',
                  color: trailColor,
                  coreColor,
                  life: 0.24,
                  maxLife: 0.24,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 36, 13, e.x, e.y)) {
                    resolveMeleeHit(e, 0.35, 8);
                  }
                }
                state.projectiles.push({
                  x: state.x + aim.dx * 12,
                  y: state.y + aim.dy * 12,
                  z: state.z + 6,
                  vx: aim.dx * 165,
                  vy: aim.dy * 165,
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
              } else if (currentWeaponId === 'mace') {
                // Mace: Concentrated frontal blunt slam + ground impact ring & armor-denting crush
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle,
                  arcSpan: Math.PI * 0.55,
                  radius: 20,
                  length: 15,
                  width: 17,
                  style: 'slam',
                  color: trailColor,
                  coreColor,
                  life: 0.24,
                  maxLife: 0.24,
                  flipDir: state.ammo % 2 === 0,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (isTargetInImpactZone(state.x, state.y, aimAngle, 15, 18, e.x, e.y)) {
                    resolveMeleeHit(e, 0.34, 5, 4);
                  }
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
              } else if (currentWeaponId === 'hand_axe') {
                // Hand Axe: Tight, heavy wedge chop with high close-quarters bite
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle,
                  arcSpan: Math.PI * 0.62,
                  radius: 21,
                  width: 13,
                  style: 'chop',
                  color: trailColor,
                  coreColor,
                  life: 0.2,
                  maxLife: 0.2,
                  flipDir: state.ammo % 2 === 0,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 25, Math.PI * 0.7, e.x, e.y)) {
                    resolveMeleeHit(e, 0.25, 4, 2);
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
                // Shield (Buckler / Heater / Pavise): Blunt kinetic barrier bash wave with knockback
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
                    resolveMeleeHit(
                      e,
                      0.38,
                      currentWeaponId === 'pavise_shield' ? 10 : 7,
                      2
                    );
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
                // Long Sword & Khopesh (Shotel): Sweeping crescent blade slash
                const isLongSword = currentWeaponId === 'long_sword';
                const slashRadius = isLongSword ? 26 : 22;
                const slashArc = isLongSword ? Math.PI * 1.02 : Math.PI * 0.82;
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
                    // Shotel curved blade reaches around shields (bypasses 25% shield absorption)
                    resolveMeleeHit(
                      e,
                      0.22,
                      isLongSword ? 4 : 2,
                      0,
                      currentWeaponId === 'khopesh' ? 0.25 : 0
                    );
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
              // Apply accuracy spread if Load Penalty or Interface Feat modifies accuracy
              const accMult = (loadPenalty?.accuracyMult ?? 1.0) * featMods.accuracyMult;
              const spreadRad = accMult < 1.0 ? (Math.random() - 0.5) * 0.22 : 0;
              const baseAngle = Math.atan2(aim.dy, aim.dx) + spreadRad;

              const installedRangedModId = state.equipmentSlots?.installedMods?.ranged;
              const rangedMod = ACTION_MODIFICATION_CATALOG.find(
                (m) => m.id === installedRangedModId
              );
              const extraCount = rangedMod?.modifiers.extraProjectiles || 0;
              const offsets = extraCount > 0 ? [-0.07, 0.07] : [0];
              const projColor = gemVis.gemId
                ? trailColor
                : weapon?.bladeTrailColor || '#ffd27d';
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
              const adaptiveShotDmg = weapon?.adaptiveDamageTypes
                ? Math.round(shotDmg * 1.12)
                : shotDmg;
              const baseProjSpeed =
                (currentWeaponId === 'great_bow' ? 210 : 185) *
                gemCombatMods.projectileSpeedMult;
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
        } else if (state.activeActionId) {
          executeActionPayload(state, ctx, state.activeActionId, applyDamageToLayers);
        }
      }
    } else {
      state.skillActionTimer -= dt;
      if (state.skillActionTimer <= 0) {
        const finishedBasicShot = state.activeSkillSlot === 0 && !state.activeActionId;
        state.activeSkillSlot = null;
        state.activeActionId = null;
        state.activeSkillCooldownKey = null;
        if (finishedBasicShot && state.combatQueuedChainShot && !state.isReloading) {
          state.combatQueuedChainShot = false;
          firePrimarySalvoShot(state, ctx, false);
        }
      }
    }
  }

  for (const e of state.enemies) {
    if (e.type === 'bog_poe') continue;
    if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
    if (e.type === 'orc_scout' || e.type === 'tristan_knight') continue;

    if (e.state === 'attack' && e.stateTimer > 0.08 && !e.hasStruckThisAttack && !state.isBoosterDashing) {
      const ang = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
      let isHit = false;

      if (e.type === 'bors_knight') {
        if (e.enraged) {
          // Enraged Sir Bors: Long linear piercing execution lunge corridor
          isHit = isTargetInThrustCorridor(e.x, e.y, ang, 34, 13, state.x, state.y);
        } else {
          // Normal Sir Bors: Heavy frontal mace/maul slam impact zone
          isHit = isTargetInImpactZone(e.x, e.y, ang, 12, 20, state.x, state.y);
        }
      } else if (e.type === 'percival_knight') {
        // Sir Percival: Wide directional shield-wall charge bash
        isHit = isTargetInDirectionalArc(e.x, e.y, ang, 26, Math.PI * 0.8, state.x, state.y);
      } else if (e.type === 'orc_warrior') {
        // Orc Warrior: Heavy frontal boarding-axe chop & shield brawl sector
        isHit = isTargetInDirectionalArc(e.x, e.y, ang, 24, Math.PI * 0.85, state.x, state.y);
      } else if (e.type === 'bog_crawler') {
        // Bog Crawler: Narrow mandible/claw ambush lunge cone
        isHit = isTargetInDirectionalArc(e.x, e.y, ang, 22, Math.PI * 0.65, state.x, state.y);
      } else if (e.type === 'bog_wurm' || e.type === 'lady_of_the_lake') {
        // Bog Wurm / Lady of the Lake: Bio-electric pulse ring + fang strike
        isHit = Math.hypot(state.x - e.x, state.y - e.y) <= 25;
      } else {
        // Feral Town NPC (Loyalist sword slash or Scavenger chop)
        isHit = isTargetInDirectionalArc(
          e.x,
          e.y,
          ang,
          e.isLoyalist ? 23 : 21,
          e.isLoyalist ? Math.PI * 0.85 : Math.PI * 0.65,
          state.x,
          state.y
        );
      }

      if (isHit) {
        e.hasStruckThisAttack = true;
        e.stateTimer = 0.05;
        let hitDamage = e.damage;
        if (e.type === 'bors_knight') {
          e.hitsLanded = (e.hitsLanded || 0) + 1;
          hitDamage = Math.round(e.damage * (1 + 0.1 * (e.hitsLanded - 1)));
        }

        // Active Skill 4 Held Block mitigation (0.25s Perfect Block window vs Standard Held Block)
        if (state.isHoldingBlock || (state.blockTimer || 0) > 0) {
          const isShieldBlock = Boolean(
            state.blockingWeaponId && state.blockingWeaponId.includes('shield')
          );
          const isPerfectBlock = (state.blockHoldTimer ?? 0) <= PERFECT_BLOCK_WINDOW_SEC;

          if (isPerfectBlock) {
            // 0.25s Perfect Block: 0 damage taken, heavy parry stagger, shield restore & heat vent!
            e.stun = Math.max(e.stun, isShieldBlock ? 1.85 : 1.55);
            state.shields.overloaded = false;
            state.shields.capacity = Math.min(
              state.shields.maxCapacity,
              state.shields.capacity + (isShieldBlock ? 22 : 14)
            );
            state.heat = Math.max(0, state.heat - 14);
            soundSystem.playPowerup();
            soundSystem.playSword();
            ctx.spawnParticles(
              state.x,
              state.y,
              state.z + 10,
              12,
              '#facc15',
              'PERFECT BLOCK!'
            );
            continue;
          }

          const blockedDamage = Math.max(
            0,
            Math.round(hitDamage * (isShieldBlock ? 0.15 : 0.28))
          );
          e.stun = Math.max(e.stun, isShieldBlock ? 0.95 : 0.7);
          soundSystem.playSword();
          ctx.spawnParticles(
            state.x,
            state.y,
            state.z + 8,
            7,
            '#38bdf8',
            'BLOCKED'
          );
          if (blockedDamage > 0) {
            applyDamageToLayers(
              state.shields,
              state.armor,
              state.frame,
              blockedDamage,
              e.damageType
            );
          }
          continue;
        }

        if (e.type === 'percival_knight') {
          // Percival's shield rush knocks the player back slightly
          state.x = Math.max(12, Math.min(148, state.x + Math.cos(ang) * 8));
          state.y = Math.max(12, Math.min(132, state.y + Math.sin(ang) * 8));
        }

        soundSystem.playHit();
        applyDamageToLayers(
          state.shields,
          state.armor,
          state.frame,
          hitDamage,
          e.damageType,
          (count, color, label) => ctx.spawnParticles(state.x, state.y, state.z + 8, count, color, label)
        );
      }
    }
  }
}

export { ASSIGNABLE_ACTION_CATALOG, getResolvedActionDescriptor };
