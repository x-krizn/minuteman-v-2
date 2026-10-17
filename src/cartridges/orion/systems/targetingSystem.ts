/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { getDirFromVector } from '../constants';
import { notifyOrionStateChange } from '../stateStore';
import { EnemyEntity, OrionCombatContext, OrionState } from '../types';

const MAX_LOCK_ON_RANGE = 135;

/**
 * Determine whether an entity in the current room is a valid hostile lock-on target.
 */
export function isTargetableEnemy(e: EnemyEntity): boolean {
  if (e.frame.integrity <= 0) return false;
  if (e.isSubmerged) return false;
  if (e.type === 'bog_poe') return false;
  if (e.type === 'town_npc' && e.npcDisposition !== 'feral') return false;
  return true;
}

/**
 * Return the currently locked enemy entity if valid and within range, otherwise null.
 */
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

/**
 * Tap [Y]: Cycle through valid hostile targets in the current room sorted by distance,
 * or clear lock-on after cycling past the last target (or if none are in range).
 */
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
      ctx.say(`TARGET LOCKED: ${first.name.toUpperCase()}`);
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
      ctx.say(`TARGET LOCKED: ${first.name.toUpperCase()}`);
    }
    notifyOrionStateChange();
    return first;
  }

  // If there are more targets, cycle to the next; if on the last target, clear lock
  if (currentIdx + 1 < candidates.length) {
    const next = candidates[currentIdx + 1];
    state.lockedTargetId = next.id;
    soundSystem.playSelect();
    if (ctx) {
      ctx.say(`TARGET LOCKED: ${next.name.toUpperCase()}`);
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

/**
 * Maintain target lock-on each frame:
 * - Clears lock if the target was defeated or went out of range.
 * - Automatically faces the locked target so the pilot strafes while moving and aims X, L, R at the target.
 */
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
