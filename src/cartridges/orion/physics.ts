/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COLS, GRAVITY, ROWS, TILE_SIZE } from './constants';
import { OrionState } from './types';
import { getTileDefinition } from './database/world';

/**
 * Check if a world coordinate is solid or impassable.
 * Supports cross-room doorway checks when checking tiles beyond current room boundaries.
 */
export function isSolidAt(
  rooms: Record<string, string[]>,
  state: OrionState,
  tx: number,
  ty: number,
  z: number = 0
): boolean {
  // 1. Inside current room
  if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
    const room = rooms[state.room];
    if (!room || !room[ty]) return true;

    const char = room[ty][tx] || '.';
    if (char === 'G') {
      // Perimeter / Sun Gate: solid unless unlocked or cleared
      return !state.unlockedGates?.[state.room] && !state.clearedRooms?.[state.room];
    }

    const tile = getTileDefinition(char);
    if (!tile.solid) return false;

    // Chasms can be crossed if jumping
    if (tile.isChasm && z > 2) {
      return false;
    }

    return true;
  }

  // 2. Beyond room boundaries: check neighbor room
  const dx = tx < 0 ? -1 : tx >= COLS ? 1 : 0;
  const dy = ty < 0 ? -1 : ty >= ROWS ? 1 : 0;

  // Diagonal corner between rooms is impassable
  if (dx !== 0 && dy !== 0) {
    return true;
  }

  const neighborKey = `${state.rx + dx},${state.ry + dy}`;
  const neighborRoom = rooms[neighborKey];
  if (!neighborRoom) {
    // World boundary edge (no room exists)
    return true;
  }

  const ntx = ((tx % COLS) + COLS) % COLS;
  const nty = ((ty % ROWS) + ROWS) % ROWS;
  const nChar = neighborRoom[nty]?.[ntx] || '.';

  if (nChar === 'G') {
    return !state.unlockedGates?.[neighborKey] && !state.clearedRooms?.[neighborKey];
  }

  const tile = getTileDefinition(nChar);
  if (!tile.solid) return false;
  if (tile.isChasm && z > 2) return false;

  return tile.solid;
}

/**
 * Attempt to move an entity in X by dx with sub-pixel collision sliding
 */
export function moveEntityX(
  rooms: Record<string, string[]>,
  state: OrionState,
  x: number,
  y: number,
  z: number,
  dx: number,
  radius: number = 4
): number {
  if (dx === 0) return x;

  const targetX = x + dx;
  const sign = Math.sign(dx);
  const checkX = targetX + sign * radius;

  const topY = y - radius * 0.5;
  const bottomY = y + radius * 0.5;

  const tx = Math.floor(checkX / TILE_SIZE);
  // Clamp perpendicular Y checks to valid room rows so top/bottom void doesn't block X sliding
  const ty1 = Math.max(0, Math.min(ROWS - 1, Math.floor(topY / TILE_SIZE)));
  const ty2 = Math.max(0, Math.min(ROWS - 1, Math.floor(bottomY / TILE_SIZE)));

  if (
    isSolidAt(rooms, state, tx, ty1, z) ||
    isSolidAt(rooms, state, tx, ty2, z)
  ) {
    // Snap to edge
    if (dx > 0) {
      return tx * TILE_SIZE - radius - 0.05;
    } else {
      return (tx + 1) * TILE_SIZE + radius + 0.05;
    }
  }

  return targetX;
}

/**
 * Attempt to move an entity in Y by dy with sub-pixel collision sliding
 */
export function moveEntityY(
  rooms: Record<string, string[]>,
  state: OrionState,
  x: number,
  y: number,
  z: number,
  dy: number,
  radius: number = 4
): number {
  if (dy === 0) return y;

  const targetY = y + dy;
  const sign = Math.sign(dy);
  const checkY = targetY + sign * radius * 0.5;

  const leftX = x - radius;
  const rightX = x + radius;

  const ty = Math.floor(checkY / TILE_SIZE);
  // Clamp perpendicular X checks to valid room cols so left/right void doesn't block Y sliding
  const tx1 = Math.max(0, Math.min(COLS - 1, Math.floor(leftX / TILE_SIZE)));
  const tx2 = Math.max(0, Math.min(COLS - 1, Math.floor(rightX / TILE_SIZE)));

  if (
    isSolidAt(rooms, state, tx1, ty, z) ||
    isSolidAt(rooms, state, tx2, ty, z)
  ) {
    // Snap to edge
    if (dy > 0) {
      return ty * TILE_SIZE - radius * 0.5 - 0.05;
    } else {
      return (ty + 1) * TILE_SIZE + radius * 0.5 + 0.05;
    }
  }

  return targetY;
}

/**
 * Update 2.5D vertical height z physics (Jumping and Falling)
 */
export function updateElevationPhysics(state: OrionState, dt: number): void {
  if (state.z > 0 || state.vz !== 0) {
    state.z += state.vz * dt;
    state.vz -= GRAVITY * dt;

    if (state.z <= 0) {
      state.z = 0;
      state.vz = 0;
      state.onGround = true;

      // Dust puff particles on landing
      for (let i = 0; i < 4; i++) {
        state.particles.push({
          x: state.x + (Math.random() - 0.5) * 8,
          y: state.y + (Math.random() - 0.5) * 4,
          z: 0,
          vx: (Math.random() - 0.5) * 25,
          vy: (Math.random() - 0.5) * 15,
          vz: 8,
          life: 0.25,
          maxLife: 0.25,
          color: '#e2d4b7',
          size: 2,
          fade: true,
        });
      }
    } else {
      state.onGround = false;
    }
  } else {
    state.z = 0;
    state.vz = 0;
    state.onGround = true;
  }
}
