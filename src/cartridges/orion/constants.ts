/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AetherCardinalDir, OrionDir } from './types';

// Native retro console viewport dimensions (Integer-scaled LCD screen)
export const SCREEN_W = 160;
export const SCREEN_H = 144;

// 2.5D World Tile Metrics (10x9 = 160x144px is the default single-screen room size)
export const TILE_SIZE = 16;
export const COLS = 10;
export const ROWS = 9;

export interface RoomDimensions {
  cols: number;
  rows: number;
  widthPx: number;
  heightPx: number;
}

export function getRoomDimensions(roomGrid?: string[]): RoomDimensions {
  if (!roomGrid || roomGrid.length === 0) {
    return {
      cols: COLS,
      rows: ROWS,
      widthPx: COLS * TILE_SIZE,
      heightPx: ROWS * TILE_SIZE,
    };
  }
  const rows = roomGrid.length;
  let cols = 0;
  for (let i = 0; i < rows; i++) {
    if (roomGrid[i].length > cols) {
      cols = roomGrid[i].length;
    }
  }
  if (cols <= 0) cols = COLS;
  return {
    cols,
    rows,
    widthPx: cols * TILE_SIZE,
    heightPx: rows * TILE_SIZE,
  };
}

function isDoorwayOpeningChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return ch !== '#' && ch !== 'P' && ch !== '_';
}

/**
 * Locates the open doorway span and center pixel coordinates along a cardinal wall of `roomGrid`.
 * Falls back to proportional center coordinates if the wall has no carved opening.
 */
export function getRoomDoorwayCenterPx(
  roomGrid: string[] | undefined,
  edge: AetherCardinalDir
): { x: number; y: number; minPx: number; maxPx: number } {
  const { cols, rows, widthPx, heightPx } = getRoomDimensions(roomGrid);
  if (!roomGrid || roomGrid.length === 0) {
    return {
      x: widthPx * 0.5,
      y: heightPx * 0.5,
      minPx: 24,
      maxPx: Math.max(48, (edge === 'N' || edge === 'S' ? widthPx : heightPx) - 24),
    };
  }

  if (edge === 'N' || edge === 'S') {
    const rowIdx = edge === 'N' ? 0 : rows - 1;
    const rowStr = roomGrid[rowIdx] || '';
    const openCols: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (isDoorwayOpeningChar(rowStr[c])) {
        openCols.push(c);
      }
    }
    if (openCols.length > 0) {
      const minC = openCols[0];
      const maxC = openCols[openCols.length - 1];
      const minPx = minC * TILE_SIZE + 6;
      const maxPx = (maxC + 1) * TILE_SIZE - 6;
      return {
        x: (minPx + maxPx) * 0.5,
        y: edge === 'N' ? 10 : heightPx - 10,
        minPx,
        maxPx: Math.max(minPx, maxPx),
      };
    }
    const fallbackX = widthPx * 0.5;
    return {
      x: fallbackX,
      y: edge === 'N' ? 10 : heightPx - 10,
      minPx: Math.max(16, fallbackX - 12),
      maxPx: Math.min(widthPx - 16, fallbackX + 12),
    };
  } else {
    const colIdx = edge === 'W' ? 0 : cols - 1;
    const openRows: number[] = [];
    for (let r = 0; r < rows; r++) {
      if (isDoorwayOpeningChar(roomGrid[r]?.[colIdx])) {
        openRows.push(r);
      }
    }
    if (openRows.length > 0) {
      const minR = openRows[0];
      const maxR = openRows[openRows.length - 1];
      const minPx = minR * TILE_SIZE + 6;
      const maxPx = (maxR + 1) * TILE_SIZE - 6;
      return {
        x: edge === 'W' ? 10 : widthPx - 10,
        y: (minPx + maxPx) * 0.5,
        minPx,
        maxPx: Math.max(minPx, maxPx),
      };
    }
    const defaultRowCenter = rows === 9 ? 6 * TILE_SIZE : heightPx * 0.5;
    return {
      x: edge === 'W' ? 10 : widthPx - 10,
      y: defaultRowCenter,
      minPx: Math.max(16, defaultRowCenter - 12),
      maxPx: Math.min(heightPx - 16, defaultRowCenter + 12),
    };
  }
}

// 2.5D Depth & Perspective Parameters
export const Z_SCALE = 1.0;
export const SHADOW_SCALE = 0.85;

// Canonical Combat Laws & Metrics (LOCKED from Project Orion Wiki)
export const FRAME_INTEGRITY_BASE = 200; // Static Level 1 to 20
export const CRITICAL_FRAME_THRESHOLD = 40; // <= 20% integrity triggers Critical state
export const BASE_COMBAT_UNIT_BCU = 54; // 1 full auto-attack chain of reference weapon

// Reference Weapon: Gladius Boltcaster
export const GLADIUS_SHOTS_PER_CHAIN = 9;
export const GLADIUS_DAMAGE_PER_SHOT = 6;
export const GLADIUS_CHAIN_DURATION = 1.5; // seconds
export const GLADIUS_RELOAD_TIME = 3.15; // 9 * 0.35s
export const GLADIUS_FULL_CYCLE = 4.65; // 1.5s chain + 3.15s reload

// Global Rules
export const WEAPON_SWAP_COOLDOWN = 5.0; // 5 seconds globally
export const BOOSTER_DASH_DURATION = 0.22;
export const BOOSTER_DASH_COOLDOWN = 0.45;
export const BOOSTER_HEAT_COST = 20;

// Physics Speeds
export const WALK_SPEED = 56;
export const MUD_SPEED_PENALTY = 0.65; // Walking in deep bog mud
export const BOOSTER_SPEED = 150;
export const JUMP_VELOCITY = 175;
export const GRAVITY = 560;

// Colors
export const COLOR_SHIELD = '#77c7ff'; // Cyan / Blue
export const COLOR_ARMOR = '#ffd27d'; // Amber / Gold
export const COLOR_FRAME = '#8dd7ad'; // Emerald green
export const COLOR_CRITICAL = '#ff9b9b'; // Crimson
export const COLOR_HEAT = '#f97316'; // Orange
export const COLOR_ENERGY = '#a855f7'; // Purple

// Direction Vectors
export const DIR_VECTORS: Record<OrionDir, { dx: number; dy: number; angle: number }> = {
  N: { dx: 0, dy: -1, angle: -Math.PI / 2 },
  NE: { dx: 0.7071, dy: -0.7071, angle: -Math.PI / 4 },
  E: { dx: 1, dy: 0, angle: 0 },
  SE: { dx: 0.7071, dy: 0.7071, angle: Math.PI / 4 },
  S: { dx: 0, dy: 1, angle: Math.PI / 2 },
  SW: { dx: -0.7071, dy: 0.7071, angle: (3 * Math.PI) / 4 },
  W: { dx: -1, dy: 0, angle: Math.PI },
  NW: { dx: -0.7071, dy: -0.7071, angle: (-3 * Math.PI) / 4 },
};

export function getDirFromVector(dx: number, dy: number): OrionDir {
  if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) return 'S';
  const angle = Math.atan2(dy, dx);
  const octant = Math.round((8 * angle) / (2 * Math.PI) + 8) % 8;
  const dirs: OrionDir[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  return dirs[octant] || 'S';
}
