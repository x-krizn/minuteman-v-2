/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { DIR_VECTORS, getDirFromVector } from '../../constants';
import { EnemyEntity, OrionCombatContext, OrionState } from '../../types';
import { notifyOrionStateChange } from '../playerSystem';
import { getPointVisibilityFactor } from '../renderSystem';

// ─── TARGET LOCK-ON, AIMING & HITBOX GEOMETRY ────────────────────────────────

const MAX_LOCK_ON_RANGE = 165;

export function isTargetableEnemy(e: EnemyEntity, state?: OrionState): boolean {
  if (e.frame.integrity <= 0) return false;
  if (e.isSubmerged) return false;
  if (e.type === 'bog_poe') return false;
  if (e.type === 'town_npc' && e.npcDisposition !== 'feral') return false;
  if (state) {
    const vis = getPointVisibilityFactor(e.x, e.y, state);
    if (vis < 0.26 && e.hurt <= 0 && e.state !== 'windup') {
      return false;
    }
  }
  return true;
}

export function getLockedTarget(state: OrionState): EnemyEntity | null {
  if (state.lockedTargetId === null || state.lockedTargetId === undefined) {
    return null;
  }
  const target = state.enemies.find(
    (e) => e.id === state.lockedTargetId && isTargetableEnemy(e, state)
  );
  if (!target) return null;
  const dist = Math.hypot(target.x - state.x, target.y - state.y);
  if (dist > MAX_LOCK_ON_RANGE) return null;
  return target;
}

export function cycleTargetLock(
  state: OrionState,
  _ctx?: OrionCombatContext
): EnemyEntity | null {
  const candidates = state.enemies
    .filter((e) => isTargetableEnemy(e, state))
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
    notifyOrionStateChange();
    return null;
  }

  if (state.lockedTargetId === null || state.lockedTargetId === undefined) {
    const first = candidates[0];
    state.lockedTargetId = first.id;
    soundSystem.playSelect();
    notifyOrionStateChange();
    return first;
  }

  const currentIdx = candidates.findIndex((e) => e.id === state.lockedTargetId);
  if (currentIdx === -1) {
    const first = candidates[0];
    state.lockedTargetId = first.id;
    soundSystem.playSelect();
    notifyOrionStateChange();
    return first;
  }

  if (currentIdx + 1 < candidates.length) {
    const next = candidates[currentIdx + 1];
    state.lockedTargetId = next.id;
    soundSystem.playSelect();
    notifyOrionStateChange();
    return next;
  } else {
    state.lockedTargetId = null;
    soundSystem.playMenuBeep();
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

export function normalizeAngleDiff(a: number, b: number): number {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

/**
 * Triggers a fighting-game / Souls-style silhouette flash frame on an entity or player state.
 */
export function triggerEntityFlash(
  target: {
    flashColor?: string;
    flashTimer?: number;
    flashMaxTimer?: number;
    flashKind?: string;
  },
  color: string,
  durationSec: number,
  kind: string = 'hit'
): void {
  // Prioritize sweet-spot crits, shield breaks, and parries over weaker glances
  const isHighPriority =
    kind === 'sweet' || kind === 'parry' || kind === 'shield_break' || kind === 'stagger';
  if ((target.flashTimer || 0) > 0.04 && !isHighPriority && target.flashKind === 'sweet') {
    return;
  }
  target.flashColor = color;
  target.flashTimer = durationSec;
  target.flashMaxTimer = durationSec;
  target.flashKind = kind;
}

export type PositionalHitQuality = 'sweet' | 'normal' | 'sour';

export interface PositionalHitEvaluation {
  quality: PositionalHitQuality;
  damageMult: number;
  armorBypassRatio: number;
  extraHitstopSec: number;
}

/**
 * Evaluates positional accuracy ("sweet-spot" vs "sour-spot") for a melee strike or projectile impact.
 * Critical hits are a spatial accuracy variable rather than a random chance variable:
 * - Spear / Lance tip (`0.68 <= rNorm <= 1.05` & tight centerline): `1.35x` damage, `+40%` armor bypass.
 * - Hammer / Mace / Axe head (`0.60 <= rNorm <= 0.98`): `1.35x` damage, `+40%` armor bypass.
 * - Sword / Blade upper cutting sweet-spot (`0.54 <= rNorm <= 0.92` & centered arc): `1.30x` damage, `+35%` armor bypass.
 * - Haft / hilt / sour-spot (`rNorm < 0.42`): `0.72x` glancing damage, `-35%` armor bypass (enemy armor is 35% more effective).
 */
export function evaluatePositionalHitQuality(
  weaponId: string,
  ox: number,
  oy: number,
  aimAngle: number,
  maxReach: number,
  tx: number,
  ty: number,
  isRanged: boolean = false
): PositionalHitEvaluation {
  const dist = Math.hypot(tx - ox, ty - oy);

  if (isRanged) {
    // Ranged projectiles: dead-center impact (`dist <= 5.5px` from bolt core) is a sweet-spot critical
    if (dist <= 5.5) {
      return {
        quality: 'sweet',
        damageMult: 1.3,
        armorBypassRatio: 0.35,
        extraHitstopSec: 0.035,
      };
    }
    if (dist >= 11.5) {
      return {
        quality: 'sour',
        damageMult: 0.78,
        armorBypassRatio: -0.25,
        extraHitstopSec: 0,
      };
    }
    return {
      quality: 'normal',
      damageMult: 1.0,
      armorBypassRatio: 0,
      extraHitstopSec: 0,
    };
  }

  const rNorm = dist / Math.max(12, maxReach);
  const targetAng = Math.atan2(ty - oy, tx - ox);
  const angDiff = Math.abs(normalizeAngleDiff(targetAng, aimAngle));

  const isSpearOrLance =
    weaponId === 'short_spear' ||
    weaponId === 'ls900_swordspear' ||
    weaponId === 'avalon_siege_lance' ||
    weaponId === 'hl220_lightburst_lance';
  const isHammerMaceOrAxe =
    weaponId === 'mace' ||
    weaponId === 'wz200_manacore_staff' ||
    weaponId === 'hallowed_scepter' ||
    weaponId === 'hand_axe' ||
    weaponId === 'siegebreaker';

  if (isSpearOrLance) {
    // Spear / Lance: tipper sweet-spot at outer 68%..105% reach near thrust centerline; shaft sour-spot inside 45%
    if (rNorm >= 0.68 && rNorm <= 1.06 && angDiff <= 0.34) {
      return {
        quality: 'sweet',
        damageMult: 1.35,
        armorBypassRatio: 0.4,
        extraHitstopSec: 0.045,
      };
    }
    if (rNorm < 0.45) {
      return {
        quality: 'sour',
        damageMult: 0.72,
        armorBypassRatio: -0.35,
        extraHitstopSec: 0,
      };
    }
    return {
      quality: 'normal',
      damageMult: 1.0,
      armorBypassRatio: 0,
      extraHitstopSec: 0,
    };
  }

  if (isHammerMaceOrAxe) {
    // Hammer / Mace / Axe: heavy head sweet-spot at 60%..98% reach; handle/haft sour-spot inside 42%
    if (rNorm >= 0.6 && rNorm <= 1.0 && angDiff <= 0.48) {
      return {
        quality: 'sweet',
        damageMult: 1.35,
        armorBypassRatio: 0.4,
        extraHitstopSec: 0.045,
      };
    }
    if (rNorm < 0.42) {
      return {
        quality: 'sour',
        damageMult: 0.72,
        armorBypassRatio: -0.35,
        extraHitstopSec: 0,
      };
    }
    return {
      quality: 'normal',
      damageMult: 1.0,
      armorBypassRatio: 0,
      extraHitstopSec: 0,
    };
  }

  // Swords / Blades / Daggers / Shields: upper-blade cutting sweet-spot at 55%..92% reach near center of swing
  if (rNorm >= 0.55 && rNorm <= 0.94 && angDiff <= 0.36) {
    return {
      quality: 'sweet',
      damageMult: 1.3,
      armorBypassRatio: 0.35,
      extraHitstopSec: 0.04,
    };
  }
  if (rNorm < 0.36) {
    return {
      quality: 'sour',
      damageMult: 0.78,
      armorBypassRatio: -0.25,
      extraHitstopSec: 0,
    };
  }
  return {
    quality: 'normal',
    damageMult: 1.0,
    armorBypassRatio: 0,
    extraHitstopSec: 0,
  };
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
