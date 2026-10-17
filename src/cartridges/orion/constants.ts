/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionDir } from './types';

// Native retro console viewport dimensions (Integer-scaled LCD screen)
export const SCREEN_W = 160;
export const SCREEN_H = 144;

// 2.5D World Tile Metrics
export const TILE_SIZE = 16;
export const COLS = 10;
export const ROWS = 9;

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
