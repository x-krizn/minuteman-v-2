/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../constants';
import { EnemyEntity, OrionState } from '../types';
import { moveEntityX, moveEntityY } from './playerSystem';

/**
 * Checks whether a tile character blocks enemy line-of-sight (solid wall '#' or sealed gate 'G'/'M').
 */
function isTileBlockingSight(
  char: string | undefined,
  state: OrionState
): boolean {
  if (!char || char === ' ' || char === '#') return true;
  if (char === 'G') {
    const gateUnlocked = Boolean(
      state.unlockedGates?.[state.room] ||
        state.unlockedGates?.['3,0'] ||
        state.flags?.bog_exit_revealed
    );
    return !gateUnlocked;
  }
  if (char === 'M') {
    return !state.flags?.cathedral_door_open;
  }
  return false;
}

/**
 * Ray-marches across the tile grid from `(x0, y0)` to `(x1, y1)` and returns `false`
 * if any solid wall (`#`) or closed gate (`G`, `M`) blocks line-of-sight.
 */
export function hasTileLineOfSight(
  rooms: Record<string, string[]>,
  state: OrionState,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): boolean {
  const roomGrid = rooms[state.room];
  if (!roomGrid || roomGrid.length === 0) return false;

  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;

  const steps = Math.max(2, Math.ceil(dist / 6));
  const startTx = Math.floor(x0 / TILE_SIZE);
  const startTy = Math.floor(y0 / TILE_SIZE);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const sx = x0 + dx * t;
    const sy = y0 + dy * t;
    const tx = Math.floor(sx / TILE_SIZE);
    const ty = Math.floor(sy / TILE_SIZE);

    if (tx === startTx && ty === startTy) continue;
    const ch = roomGrid[ty]?.[tx];
    if (isTileBlockingSight(ch, state)) {
      return false;
    }
  }
  return true;
}

/**
 * Evaluates whether an enemy `e` can currently detect and aggro onto the player:
 * - Respects the spawn/reboot grace timer (`state.spawnGraceTimer > 0`), unless the player damaged `e`.
 * - Uses the enemy's modifiable `Light` / vision radius (`(e.visionRadiusTiles ?? 5) * TILE_SIZE`, base 5 tiles = 80px)
 *   as its sight range (extended slightly if recently hurt or in boss/trial state).
 * - Requires unobstructed tile line-of-sight (`hasTileLineOfSight`), preventing aggro through `#` walls or across sealed rooms.
 */
export function canEnemyDetectPlayer(
  rooms: Record<string, string[]>,
  state: OrionState,
  e: EnemyEntity,
  baseAggroRadiusPx?: number
): boolean {
  const wasDamagedRecently = (e.hurt || 0) > 0;
  if ((state.spawnGraceTimer || 0) > 0 && !wasDamagedRecently) {
    return false;
  }

  const visionTiles = Math.max(
    1,
    e.visionRadiusTiles ?? state.enemyBaseLight ?? 5
  );
  const visionRadiusPx = visionTiles * 14;
  const rawRadius =
    e.isFogBoss || state.flags?.knights_pulled_together
      ? Math.max(visionRadiusPx, baseAggroRadiusPx ?? visionRadiusPx)
      : visionRadiusPx;

  const dist = Math.hypot(state.x - e.x, state.y - e.y);
  const effectiveRadius = wasDamagedRecently ? rawRadius * 1.45 : rawRadius;

  if (dist > effectiveRadius) {
    return false;
  }

  return hasTileLineOfSight(rooms, state, e.x, e.y, state.x, state.y);
}

/**
 * Finds the pixel center `(x, y)` of the nearest corrosive water tile (`'~'`) within `maxSearchRadiusTiles`
 * of `(fromX, fromY)` in the active room grid. Used by Bog Wurms that must reach `'~'` before submerging.
 */
export function findNearestWaterTilePx(
  rooms: Record<string, string[]>,
  state: OrionState,
  fromX: number,
  fromY: number,
  maxSearchRadiusTiles: number = 9
): { x: number; y: number } | null {
  const roomGrid = rooms[state.room];
  if (!roomGrid || roomGrid.length === 0) return null;

  const centerTx = Math.floor(fromX / TILE_SIZE);
  const centerTy = Math.floor(fromY / TILE_SIZE);
  let bestDistSq = Infinity;
  let bestTarget: { x: number; y: number } | null = null;

  const minTy = Math.max(0, centerTy - maxSearchRadiusTiles);
  const maxTy = Math.min(roomGrid.length - 1, centerTy + maxSearchRadiusTiles);

  for (let ty = minTy; ty <= maxTy; ty++) {
    const row = roomGrid[ty];
    if (!row) continue;
    const minTx = Math.max(0, centerTx - maxSearchRadiusTiles);
    const maxTx = Math.min(row.length - 1, centerTx + maxSearchRadiusTiles);
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (row[tx] === '~') {
        const wx = tx * TILE_SIZE + 8;
        const wy = ty * TILE_SIZE + 8;
        const dSq = (wx - fromX) * (wx - fromX) + (wy - fromY) * (wy - fromY);
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestTarget = { x: wx, y: wy };
        }
      }
    }
  }

  return bestTarget;
}

/**
 * Moves an enemy along X and Y using axis-separated tile collision (`moveEntityX` / `moveEntityY`)
 * so enemies cannot walk, kite, or lunge through solid `#` walls or closed gates.
 */
export function stepEnemyWithCollision(
  rooms: Record<string, string[]>,
  state: OrionState,
  e: EnemyEntity,
  dx: number,
  dy: number,
  radius: number = 4
): void {
  if (dx !== 0) {
    e.x = moveEntityX(rooms, state, e.x, e.y, e.z, dx, radius);
  }
  if (dy !== 0) {
    e.y = moveEntityY(rooms, state, e.x, e.y, e.z, dy, radius);
  }
}

/**
 * Gently patrols an un-aggroed enemy in place while respecting wall and pillar collisions.
 */
export function idlePatrolEnemy(
  rooms: Record<string, string[]>,
  state: OrionState,
  e: EnemyEntity,
  dt: number,
  speed: number = 8
): void {
  e.t += dt;
  const dx = Math.cos(e.t * 1.4) * speed * dt;
  const dy = Math.sin(e.t * 1.4) * speed * dt;
  stepEnemyWithCollision(rooms, state, e, dx, dy);
}
