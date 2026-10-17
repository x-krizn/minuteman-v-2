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
      if (state.flags?.orc_raid_active) return true; // Sealed during Orc Raid
      return !state.unlockedGates?.[state.room] && !state.clearedRooms?.[state.room] && !state.flags?.bog_exit_revealed;
    }
    if (char === 'M') {
      return !state.flags?.cathedral_door_open && !state.unlockedGates?.[`${state.room}:M`];
    }

    const tile = getTileDefinition(char);
    if (!tile.solid) return false;

    // Desynchronizing market walls (%) phase between intact (solid) and ruined (passable)
    if (tile.isDesync && Math.floor(state.t / 3.5) % 2 !== 0) {
      return false;
    }

    // Chasms are open holes, not impassable walls; entities can fall into them
    if (tile.isChasm) {
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
    if (state.flags?.orc_raid_active) return true;
    return !state.unlockedGates?.[neighborKey] && !state.clearedRooms?.[neighborKey] && !state.flags?.bog_exit_revealed;
  }
  if (nChar === 'M') {
    return !state.flags?.cathedral_door_open && !state.unlockedGates?.[`${neighborKey}:M`];
  }

  const tile = getTileDefinition(nChar);
  if (!tile.solid) return false;
  if (tile.isDesync && Math.floor(state.t / 3.5) % 2 !== 0) return false;
  if (tile.isChasm) return false;

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
 * Update 2.5D vertical height z physics (Jumping and Falling into Chasms)
 */
export function updateElevationPhysics(
  rooms: Record<string, string[]>,
  state: OrionState,
  dt: number
): void {
  // If actively falling into the abyssal pit, plummet into negative elevation
  if (state.isFallingIntoPit) {
    state.vz -= GRAVITY * dt * 1.5;
    state.z += state.vz * dt;
    state.onGround = false;
    return;
  }

  const tx = Math.floor(state.x / TILE_SIZE);
  const ty = Math.floor(state.y / TILE_SIZE);
  const currentRoom = rooms[state.room];
  const char = currentRoom?.[ty]?.[tx] || '.';
  const tile = getTileDefinition(char);

  if (state.z > 0 || state.vz !== 0) {
    state.z += state.vz * dt;
    state.vz -= GRAVITY * dt;

    if (state.z <= 0) {
      if (tile.isChasm) {
        // Player missed jump or landed in the pit!
        state.isFallingIntoPit = true;
        state.onGround = false;
        state.vz = Math.min(state.vz, -35);
      } else {
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
      }
    } else {
      state.onGround = false;
    }
  } else {
    // Ground level (z <= 0)
    if (tile.isChasm) {
      // Stepped directly onto pit hole!
      state.isFallingIntoPit = true;
      state.onGround = false;
      state.vz = -35;
    } else {
      state.z = 0;
      state.vz = 0;
      state.onGround = true;
    }
  }
}
