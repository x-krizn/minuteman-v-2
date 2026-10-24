/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AetherCardinalDir, AetherNodeType, OrionDir, OrionState } from './types';

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
export const PERFECT_BLOCK_WINDOW_SEC = 0.25; // 0.25s perfect block window on held block

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

// ─── AETHER PYRAMID & DOORWAY TRANSITION HELPERS ─────────────────────────────

export const AETHER_PYRAMID_DEPTHS = [0, 1, 2, 3, 2, 1, 0] as const;

export interface KeyNodeRouteDescriptor {
  targetKeyCoord: string;
  routeTotal: number;
  isDirectEndNode?: boolean;
}

export const KEY_NODE_ROUTES: Record<
  string,
  Partial<Record<AetherCardinalDir, KeyNodeRouteDescriptor>>
> = {
  '-3,0': {
    E: { targetKeyCoord: '-2,0', routeTotal: 0 },
  },
  '-2,0': {
    W: { targetKeyCoord: '-3,0', routeTotal: 0 },
    E: { targetKeyCoord: '-1,0', routeTotal: 0 },
  },
  '-1,0': {
    W: { targetKeyCoord: '-2,0', routeTotal: 0 },
    E: { targetKeyCoord: '0,0', routeTotal: 0 },
  },
  '0,0': {
    W: { targetKeyCoord: '-1,0', routeTotal: 0 },
    N: { targetKeyCoord: '0,-1', routeTotal: 0 },
    E: { targetKeyCoord: '1,0', routeTotal: 0 },
  },
  '0,-1': {
    S: { targetKeyCoord: '0,0', routeTotal: 0 },
    N: { targetKeyCoord: '0,-2', routeTotal: 0 },
    E: { targetKeyCoord: '3,-1', routeTotal: 0 },
  },
  '0,-2': {
    S: { targetKeyCoord: '0,-1', routeTotal: 0 },
    E: { targetKeyCoord: '3,-1', routeTotal: 0 },
  },
  '1,0': {
    W: { targetKeyCoord: '0,0', routeTotal: 0 },
    N: { targetKeyCoord: '1,-1', routeTotal: 0, isDirectEndNode: true },
    E: { targetKeyCoord: '2,0', routeTotal: 0 },
  },
  '2,0': {
    W: { targetKeyCoord: '1,0', routeTotal: 0 },
    E: { targetKeyCoord: '3,0', routeTotal: 0 },
    S: { targetKeyCoord: '2,1', routeTotal: 0 },
  },
  '2,1': {
    N: { targetKeyCoord: '2,0', routeTotal: 0 },
  },
  '3,-1': {
    W: { targetKeyCoord: '0,-2', routeTotal: 0 },
    S: { targetKeyCoord: '3,0', routeTotal: 0 },
    N: { targetKeyCoord: '0,-1', routeTotal: 0 },
  },
  '3,0': {
    W: { targetKeyCoord: '2,0', routeTotal: 0 },
    N: { targetKeyCoord: '3,-1', routeTotal: 0 },
    E: { targetKeyCoord: '4,0', routeTotal: 2 },
  },
  '4,0': {
    W: { targetKeyCoord: '3,0', routeTotal: 2 },
    N: { targetKeyCoord: '4,-1', routeTotal: 1 },
    E: { targetKeyCoord: '5,0', routeTotal: 2 },
  },
  '4,-1': {
    S: { targetKeyCoord: '4,0', routeTotal: 1 },
  },
  '5,0': {
    W: { targetKeyCoord: '4,0', routeTotal: 2 },
    E: { targetKeyCoord: '6,0', routeTotal: 1 },
  },
  '6,0': {
    W: { targetKeyCoord: '5,0', routeTotal: 1 },
    E: { targetKeyCoord: '7,0', routeTotal: 2 },
  },
};

export function deterministicAetherHash(
  seed: number,
  counter: number,
  salt: number = 0
): number {
  let h = (seed ^ (counter * 374761393) ^ (salt * 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function getKeyBorderBranchType(
  seed: number,
  coord: string,
  dir: AetherCardinalDir
): AetherNodeType {
  const coordSalt = coord
    .split('')
    .reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 17), 0);
  const borderHash = deterministicAetherHash(seed, coordSalt, dir.charCodeAt(0));
  return borderHash % 3 === 0 ? 'loop' : 'side';
}

export function hasPoeLanternGuidance(state: OrionState): boolean {
  if (state.flags?.poe_state === 'helped' || state.flags?.poe_lantern_gift) {
    return true;
  }
  return state.inventorySlots.some((s) => s.itemId === 'poe_lantern_charm');
}

export interface DoorwayAetherTransitionInfo {
  dir: AetherCardinalDir;
  currentDepth: number;
  currentStage: number;
  nextDepth: number;
  nextStage: number;
  isLoopEntrance: boolean;
  increasesDensity: boolean;
}

/**
 * Pure, non-mutating inspection of any cardinal doorway (`N`, `S`, `E`, `W`) in the active room.
 * - Pyramid progression always follows: `SAFE (0) -> 1 -> 2 -> 3 -> 2 -> 1 -> SAFE (0)`.
 * - `increasesDensity` is true whenever stepping through `dir` moves to a strictly deeper Æther depth (`nextDepth > currentDepth`).
 * - `isLoopEntrance` is true when currently in a Safe room (`currentDepth === 0`) and `dir` enters an Æther Loop (`nextDepth === 1`).
 */
export function getDoorwayAetherTransitionInfo(
  state: OrionState,
  dir: AetherCardinalDir
): DoorwayAetherTransitionInfo {
  const graph = state.fogGraph;
  const currentNode =
    graph?.nodes?.[state.room] ||
    graph?.nodes?.['-3,0'] ||
    graph?.nodes?.['0,0'];

  if (!currentNode) {
    return {
      dir,
      currentDepth: 0,
      currentStage: 0,
      nextDepth: 0,
      nextStage: 0,
      isLoopEntrance: false,
      increasesDensity: false,
    };
  }

  if (currentNode.nodeType === 'loop') {
    const currentStage = Math.max(
      1,
      Math.min(5, currentNode.loopStage ?? graph?.loopStage ?? 1)
    );
    const currentDepth =
      currentNode.loopDepth ?? AETHER_PYRAMID_DEPTHS[currentStage] ?? 1;

    let nextStage = currentStage + 1;
    if (currentStage === 1) {
      nextStage = 2; // 1 -> 2
    } else if (currentStage === 2) {
      nextStage = 3; // 2 -> 3 (Apex)
    } else if (currentStage === 3) {
      nextStage = 4; // 3 -> 2 (Descending)
    } else if (currentStage === 4) {
      nextStage = dir === currentNode.relapseDir ? 3 : 5;
    } else {
      nextStage = dir === currentNode.relapseDir ? 2 : 0;
    }

    const nextDepth = AETHER_PYRAMID_DEPTHS[nextStage] ?? 0;
    return {
      dir,
      currentDepth,
      currentStage,
      nextDepth,
      nextStage,
      isLoopEntrance: false,
      increasesDensity: nextDepth > currentDepth,
    };
  }

  // Currently in a SAFE room (`currentDepth === 0`): check if `dir` is an Æther Loop entrance
  let isLoopEntrance = false;
  const existingTargetId = currentNode.edges?.[dir];
  if (existingTargetId && graph?.nodes?.[existingTargetId]) {
    isLoopEntrance = graph.nodes[existingTargetId].nodeType === 'loop';
  } else if (currentNode.nodeType === 'end') {
    isLoopEntrance = false;
  } else if (currentNode.nodeType === 'key') {
    const keyCoord = currentNode.id.includes(',') ? currentNode.id : currentNode.coord;
    const route = KEY_NODE_ROUTES[keyCoord]?.[dir];
    if (route) {
      isLoopEntrance = route.targetKeyCoord === '7,0';
    } else {
      isLoopEntrance =
        getKeyBorderBranchType(graph?.seed || 104729, keyCoord, dir) === 'loop';
    }
  } else if (currentNode.nodeType === 'general') {
    if (dir === currentNode.trueExitDir) {
      const step = currentNode.routeStep || 1;
      const total = currentNode.routeTotal || 1;
      if (step >= total && currentNode.targetKeyCoord) {
        isLoopEntrance = currentNode.targetKeyCoord === '7,0';
      }
    } else {
      isLoopEntrance = false;
    }
  } else if (currentNode.nodeType === 'side') {
    isLoopEntrance = dir !== currentNode.trueExitDir;
  }

  const nextStage = isLoopEntrance ? 1 : 0;
  const nextDepth = isLoopEntrance ? 1 : 0;

  return {
    dir,
    currentDepth: 0,
    currentStage: 0,
    nextDepth,
    nextStage,
    isLoopEntrance,
    increasesDensity: nextDepth > 0,
  };
}
