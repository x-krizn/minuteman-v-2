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

export interface VisibleTileBounds {
  minTx: number;
  maxTx: number;
  minTy: number;
  maxTy: number;
  cols: number;
  rows: number;
}

/**
 * Computes the camera-clamped visible tile coordinate window `[minTx..maxTx, minTy..maxTy]`
 * so rendering passes run in O(viewport) time even in 100x90 (10x10 screen) rooms.
 */
export function getVisibleTileBounds(
  roomGrid: string[] | undefined,
  camX: number = 0,
  camY: number = 0,
  marginTiles: number = 3
): VisibleTileBounds {
  const { cols, rows } = getRoomDimensions(roomGrid);
  const minTx = Math.max(0, Math.floor(camX / TILE_SIZE) - marginTiles);
  const maxTx = Math.min(cols - 1, Math.ceil((camX + SCREEN_W) / TILE_SIZE) + marginTiles);
  const minTy = Math.max(0, Math.floor(camY / TILE_SIZE) - marginTiles);
  const maxTy = Math.min(rows - 1, Math.ceil((camY + SCREEN_H) / TILE_SIZE) + marginTiles);
  return { minTx, maxTx, minTy, maxTy, cols, rows };
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
  const coordSalt = String(coord ?? '')
    .split('')
    .reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 17), 0);
  const borderHash = deterministicAetherHash(seed, coordSalt, dir.charCodeAt(0));
  return borderHash % 3 === 0 ? 'loop' : 'side';
}

export function hasPoeLanternGuidance(state: OrionState): boolean {
  return Boolean(state.flags?.poe_state === 'helped' || state.flags?.poe_lantern_gift);
}

export interface DoorwayAetherTransitionInfo {
  dir: AetherCardinalDir;
  currentDepth: number;
  currentStage: number;
  nextDepth: number;
  nextStage: number;
  maxDepth?: number;
  isLoopEntrance: boolean;
  increasesDensity: boolean;
  isRetrace?: boolean;
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

  const maxDepth =
    currentNode?.loopMaxDepth ?? graph?.loopMaxDepth ?? Math.max(2, (state.level || 1) + 1);

  if (currentNode.nodeType === 'loop') {
    const currentDepth = Math.max(
      1,
      Math.min(maxDepth, currentNode.loopDepth ?? graph?.loopDepth ?? 1)
    );
    const currentStage = Math.max(1, currentNode.loopStage ?? graph?.loopStage ?? 1);

    if (currentDepth < maxDepth) {
      if (dir === currentNode.returnDir) {
        let nextDepth = currentDepth;
        let nextStage = currentStage - 1;
        if (currentStage > 1) {
          nextDepth = currentDepth;
          nextStage = currentStage - 1;
        } else if (currentDepth > 1) {
          nextDepth = currentDepth - 1;
          nextStage = currentDepth - 1;
        } else {
          nextDepth = 0;
          nextStage = 0;
        }
        return {
          dir,
          currentDepth,
          currentStage,
          nextDepth,
          nextStage,
          maxDepth,
          isLoopEntrance: false,
          increasesDensity: false,
          isRetrace: true,
        };
      }

      const advancesToNextTier = currentStage >= currentDepth;
      const nextDepth = advancesToNextTier
        ? Math.min(maxDepth, currentDepth + 1)
        : currentDepth;
      const nextStage = advancesToNextTier ? 1 : currentStage + 1;

      return {
        dir,
        currentDepth,
        currentStage,
        nextDepth,
        nextStage,
        maxDepth,
        isLoopEntrance: false,
        increasesDensity: true,
        isRetrace: false,
      };
    }

    return {
      dir,
      currentDepth: maxDepth,
      currentStage,
      nextDepth: maxDepth,
      nextStage: currentStage + 1,
      maxDepth,
      isLoopEntrance: false,
      increasesDensity: true,
      isRetrace: false,
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

// ─── UNIFIED 26×18 SEAMLESS BOG GRID, ROOM NODES & OFF-PATH FOG METRICS ──────

export const CHUNK_COLS = COLS; // 10 tiles (160 px)
export const CHUNK_ROWS = ROWS; // 9 tiles (144 px)
export const CHUNK_W_PX = CHUNK_COLS * TILE_SIZE; // 160 px
export const CHUNK_H_PX = CHUNK_ROWS * TILE_SIZE; // 144 px

export const EXPANSE_CHUNKS_X = 26; // 260 tiles wide (4,160 px)
export const EXPANSE_CHUNKS_Y = 18; // 162 tiles tall (2,592 px)
export const EXPANSE_TOTAL_COLS = EXPANSE_CHUNKS_X * CHUNK_COLS; // 260
export const EXPANSE_TOTAL_ROWS = EXPANSE_CHUNKS_Y * CHUNK_ROWS; // 162

export const SUNKEN_BOG_EXPANSE_ROOM_ID = '-3,-1';

export interface UnifiedBogRoomPlacement {
  roomCoord: string;
  rx: number;
  ry: number;
  startCx: number;
  startCy: number;
  chunksW: number;
  chunksH: number;
  title: string;
}

/**
 * Every authored RoomDefinition in M00 The Bog is placed directly onto the 26×18 chunk grid
 * at `(startCx = 12 + rx * 3, startCy = 9 + ry * 3)` occupying a `2×2` chunk footprint (`20×18` tiles),
 * separated by 1-chunk Set-Path Corridors (`stride = 3` chunks).
 */
export const UNIFIED_BOG_ROOM_PLACEMENTS: UnifiedBogRoomPlacement[] = [
  { roomCoord: '-3,0', rx: -3, ry: 0, startCx: 3, startCy: 9, chunksW: 2, chunksH: 2, title: 'Drop-Pod Impact Crater' },
  { roomCoord: '-2,0', rx: -2, ry: 0, startCx: 6, startCy: 9, chunksW: 2, chunksH: 2, title: 'Downed Trees West' },
  { roomCoord: '-1,0', rx: -1, ry: 0, startCx: 9, startCy: 9, chunksW: 2, chunksH: 2, title: 'Downed Trees East' },
  { roomCoord: '0,0', rx: 0, ry: 0, startCx: 12, startCy: 9, chunksW: 2, chunksH: 2, title: 'Bog Outskirts Campfire' },
  { roomCoord: '0,-1', rx: 0, ry: -1, startCx: 12, startCy: 6, chunksW: 2, chunksH: 2, title: 'Overgrown Ruin Approach' },
  { roomCoord: '0,-2', rx: 0, ry: -2, startCx: 12, startCy: 3, chunksW: 2, chunksH: 2, title: 'Poe Lantern Clearing' },
  { roomCoord: '0,1', rx: 0, ry: 1, startCx: 12, startCy: 12, chunksW: 2, chunksH: 2, title: 'Southern Mud Causeway' },
  { roomCoord: '1,0', rx: 1, ry: 0, startCx: 15, startCy: 9, chunksW: 2, chunksH: 2, title: "Temple Ruins & Bedivere's Corpse" },
  { roomCoord: '1,-1', rx: 1, ry: -1, startCx: 15, startCy: 6, chunksW: 2, chunksH: 2, title: 'Overgrown Pylon Grove' },
  { roomCoord: '2,0', rx: 2, ry: 0, startCx: 18, startCy: 9, chunksW: 2, chunksH: 2, title: 'Corrosive Marsh Trail' },
  { roomCoord: '2,1', rx: 2, ry: 1, startCx: 18, startCy: 12, chunksW: 2, chunksH: 2, title: 'Lady of the Lake Arena' },
  { roomCoord: '3,-1', rx: 3, ry: -1, startCx: 21, startCy: 6, chunksW: 2, chunksH: 2, title: 'Northern Bog Hollow' },
  { roomCoord: '3,0', rx: 3, ry: 0, startCx: 21, startCy: 9, chunksW: 2, chunksH: 2, title: 'Main Bog Expanse & Exit Gate' },
];

export const UNIFIED_BOG_ROOM_BY_COORD: Record<string, UnifiedBogRoomPlacement> =
  Object.fromEntries(UNIFIED_BOG_ROOM_PLACEMENTS.map((p) => [p.roomCoord, p]));

export interface SetPathCorridorSpec {
  cx: number;
  cy: number;
  title: string;
  orientation: 'H' | 'V' | 'CROSS';
}

export const SET_PATH_CORRIDOR_CHUNKS: SetPathCorridorSpec[] = [
  // East-West Main Bog Trail Corridors (cy = 9..10)
  { cx: 5, cy: 9, title: 'Crater Furrow Causeway (North)', orientation: 'H' },
  { cx: 5, cy: 10, title: 'Crater Furrow Causeway (South)', orientation: 'H' },
  { cx: 8, cy: 9, title: 'Fallen Timber Bridge (North)', orientation: 'H' },
  { cx: 8, cy: 10, title: 'Fallen Timber Bridge (South)', orientation: 'H' },
  { cx: 11, cy: 9, title: 'Campfire West Approach (North)', orientation: 'H' },
  { cx: 11, cy: 10, title: 'Campfire West Approach (South)', orientation: 'H' },
  { cx: 14, cy: 9, title: 'Temple Nave Causeway (North)', orientation: 'H' },
  { cx: 14, cy: 10, title: 'Temple Nave Causeway (South)', orientation: 'H' },
  { cx: 17, cy: 9, title: 'Mire Basin Crossing (North)', orientation: 'H' },
  { cx: 17, cy: 10, title: 'Mire Basin Crossing (South)', orientation: 'H' },
  { cx: 20, cy: 9, title: 'Gatehouse Approach (North)', orientation: 'H' },
  { cx: 20, cy: 10, title: 'Gatehouse Approach (South)', orientation: 'H' },

  // North-South Campfire <-> Ruin <-> Poe Lantern & Southern Causeway (cx = 12..13)
  { cx: 12, cy: 8, title: 'Monastic Ruin Steps (West)', orientation: 'V' },
  { cx: 13, cy: 8, title: 'Monastic Ruin Steps (East)', orientation: 'V' },
  { cx: 12, cy: 5, title: 'Lantern Shrine Walk (West)', orientation: 'V' },
  { cx: 13, cy: 5, title: 'Lantern Shrine Walk (East)', orientation: 'V' },
  { cx: 12, cy: 11, title: 'Southern Causeway Steps (West)', orientation: 'V' },
  { cx: 13, cy: 11, title: 'Southern Causeway Steps (East)', orientation: 'V' },

  // North-South Temple <-> Pylon Grove (cx = 15..16)
  { cx: 15, cy: 8, title: 'Pylon Sanctuary Walk (West)', orientation: 'V' },
  { cx: 16, cy: 8, title: 'Pylon Sanctuary Walk (East)', orientation: 'V' },

  // North-South Marsh <-> Lady of the Lake Sanctum (cx = 18..19)
  { cx: 18, cy: 11, title: 'Drowned Sanctum Causeway (West)', orientation: 'V' },
  { cx: 19, cy: 11, title: 'Drowned Sanctum Causeway (East)', orientation: 'V' },

  // North-South Northern Bog Hollow <-> Exit Gate (cx = 21..22)
  { cx: 21, cy: 8, title: 'Northern Bastion Path (West)', orientation: 'V' },
  { cx: 22, cy: 8, title: 'Northern Bastion Path (East)', orientation: 'V' },

  // Northern Loop Causeway connecting Ruin/Pylon (0,-1 & 1,-1) <-> Northern Bog Hollow (3,-1)
  { cx: 14, cy: 6, title: 'Northern Reed Causeway', orientation: 'H' },
  { cx: 14, cy: 7, title: 'Northern Reed Causeway', orientation: 'H' },
  { cx: 17, cy: 6, title: 'Northern Mist Fen Trail', orientation: 'H' },
  { cx: 17, cy: 7, title: 'Northern Mist Fen Trail', orientation: 'H' },
  { cx: 18, cy: 6, title: 'Northern Mist Fen Trail', orientation: 'H' },
  { cx: 18, cy: 7, title: 'Northern Mist Fen Trail', orientation: 'H' },
  { cx: 19, cy: 6, title: 'Northern Mist Fen Trail', orientation: 'H' },
  { cx: 19, cy: 7, title: 'Northern Mist Fen Trail', orientation: 'H' },
  { cx: 20, cy: 6, title: 'Northern Mist Fen Trail', orientation: 'H' },
  { cx: 20, cy: 7, title: 'Northern Mist Fen Trail', orientation: 'H' },
];

export const SET_PATH_CORRIDOR_BY_CHUNK: Record<string, SetPathCorridorSpec> =
  Object.fromEntries(SET_PATH_CORRIDOR_CHUNKS.map((c) => [`${c.cx},${c.cy}`, c]));

function buildSetPathSpineCoords(): Array<{ cx: number; cy: number; title: string }> {
  const list: Array<{ cx: number; cy: number; title: string }> = [];
  for (const room of UNIFIED_BOG_ROOM_PLACEMENTS) {
    for (let dy = 0; dy < room.chunksH; dy++) {
      for (let dx = 0; dx < room.chunksW; dx++) {
        list.push({
          cx: room.startCx + dx,
          cy: room.startCy + dy,
          title: room.title,
        });
      }
    }
  }
  for (const corr of SET_PATH_CORRIDOR_CHUNKS) {
    list.push({ cx: corr.cx, cy: corr.cy, title: corr.title });
  }
  return list;
}

export const SET_PATH_SPINE_COORDS: Array<{ cx: number; cy: number; title: string }> =
  buildSetPathSpineCoords();

export const SET_PATH_SPINE_SET = new Set<string>(
  SET_PATH_SPINE_COORDS.map((c) => `${c.cx},${c.cy}`)
);

export function getUnifiedBogRoomPlacement(
  roomCoord: string | undefined
): UnifiedBogRoomPlacement | undefined {
  if (!roomCoord) return undefined;
  return UNIFIED_BOG_ROOM_BY_COORD[roomCoord];
}

export function getUnifiedBogRoomAtChunk(
  cx: number,
  cy: number
): UnifiedBogRoomPlacement | undefined {
  for (const p of UNIFIED_BOG_ROOM_PLACEMENTS) {
    if (
      cx >= p.startCx &&
      cx < p.startCx + p.chunksW &&
      cy >= p.startCy &&
      cy < p.startCy + p.chunksH
    ) {
      return p;
    }
  }
  return undefined;
}

export function getUnifiedBogRoomAtPx(
  x: number,
  y: number
): UnifiedBogRoomPlacement | undefined {
  const { cx, cy } = getChunkCoordsFromPx(x, y);
  return getUnifiedBogRoomAtChunk(cx, cy);
}

/**
 * Resolves the active authored RoomDefinition coordinate (e.g. `'-3,0'`, `'0,0'`, `'0,-2'`, `'1,0'`, `'3,0'`)
 * when the pilot is standing inside that room node on the Unified Bog Grid, or `state.room` otherwise.
 */
export function getEffectiveRoomCoord(state: OrionState): string {
  if (isChunkedExpanseRoom(state.room)) {
    const placement = getUnifiedBogRoomAtPx(state.x, state.y);
    if (placement) {
      return placement.roomCoord;
    }
  }
  return state.room;
}

/**
 * Converts a local Bog room coordinate (`'-3,0'`, `'0,0'`, `'0,-2'`, `'1,0'`, `'2,1'`, `'3,0'`, etc.)
 * and optional local room pixel `(localX, localY)` into world pixels `(x, y)` on the 26×18 Unified Bog Grid.
 */
export function convertBogRoomPosToUnifiedPx(
  roomCoord: string,
  localX?: number,
  localY?: number,
  roomCols: number = 16,
  roomRows: number = 12
): { x: number; y: number; rx: number; ry: number } {
  const placement =
    getUnifiedBogRoomPlacement(roomCoord) || UNIFIED_BOG_ROOM_PLACEMENTS[0];

  const blockStartTileX = placement.startCx * CHUNK_COLS;
  const blockStartTileY = placement.startCy * CHUNK_ROWS;
  const blockW = placement.chunksW * CHUNK_COLS; // 20
  const blockH = placement.chunksH * CHUNK_ROWS; // 18
  const padLeft = Math.max(0, Math.floor((blockW - roomCols) / 2));
  const padTop = Math.max(0, Math.floor((blockH - roomRows) / 2));

  const roomOriginPxX = (blockStartTileX + padLeft) * TILE_SIZE;
  const roomOriginPxY = (blockStartTileY + padTop) * TILE_SIZE;

  const maxLocalPxX = blockW * TILE_SIZE;
  const maxLocalPxY = blockH * TILE_SIZE;

  if (
    localX !== undefined &&
    localY !== undefined &&
    localX >= 0 &&
    localX <= maxLocalPxX &&
    localY >= 0 &&
    localY <= maxLocalPxY
  ) {
    return {
      x: roomOriginPxX + localX,
      y: roomOriginPxY + localY,
      rx: placement.rx,
      ry: placement.ry,
    };
  }

  return {
    x: (blockStartTileX + Math.floor(blockW / 2)) * TILE_SIZE,
    y: (blockStartTileY + Math.floor(blockH / 2)) * TILE_SIZE,
    rx: placement.rx,
    ry: placement.ry,
  };
}

export interface ChunkFogMetrics {
  cx: number;
  cy: number;
  chunkKey: string;
  distFromSetPath: number;
  clvl: number;
  safeDepth: number;
  overDepth: number;
  rawFogIntensity: number;
  fogIntensity: number;
  isSoftCapAbyss: boolean;
  isLanternLit: boolean;
  hasDeepDungeon: boolean;
  isDeepDungeonCleared: boolean;
  lootMultiplier: number;
  gemBonusChance: number;
}

function hashChunk2D(seed: number, cx: number, cy: number, salt: number = 0): number {
  let h = (seed ^ (cx * 374761393) ^ (cy * 668265263) ^ (salt * 1442695041)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function isChunkedExpanseRoom(roomId: string | undefined): boolean {
  if (!roomId) return false;
  return roomId === SUNKEN_BOG_EXPANSE_ROOM_ID;
}

export function getChunkCoordsFromPx(
  x: number,
  y: number
): { cx: number; cy: number } {
  const cx = Math.max(0, Math.min(EXPANSE_CHUNKS_X - 1, Math.floor(x / CHUNK_W_PX)));
  const cy = Math.max(0, Math.min(EXPANSE_CHUNKS_Y - 1, Math.floor(y / CHUNK_H_PX)));
  return { cx, cy };
}

export function makeChunkPersistenceKey(roomId: string, cx: number, cy: number): string {
  return `${roomId}:${cx},${cy}`;
}

export function getChunkDistanceFromSetPath(cx: number, cy: number): number {
  if (SET_PATH_SPINE_SET.has(`${cx},${cy}`)) return 0;
  let minDist = 99;
  for (const node of SET_PATH_SPINE_COORDS) {
    const d = Math.abs(cx - node.cx) + Math.abs(cy - node.cy);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

export function isDeepFogDungeonChunk(seed: number, cx: number, cy: number): boolean {
  const dist = getChunkDistanceFromSetPath(cx, cy);
  if (dist < 3) return false;
  // Guarantee signature deep-fog dungeons in outer off-path quadrants plus deterministic rolls
  if (
    (cx === 1 && cy === 9) ||
    (cx === 6 && cy === 4) ||
    (cx === 8 && cy === 14) ||
    (cx === 17 && cy === 2) ||
    (cx === 24 && cy === 9) ||
    (cx === 23 && cy === 14)
  ) {
    return true;
  }
  const h = hashChunk2D(seed, cx, cy, 77);
  return h % 6 === 0 || (dist >= 4 && h % 4 === 0);
}

export function computeChunkFogMetrics(
  state: OrionState,
  overrideCx?: number,
  overrideCy?: number
): ChunkFogMetrics {
  const coords =
    overrideCx !== undefined && overrideCy !== undefined
      ? { cx: overrideCx, cy: overrideCy }
      : getChunkCoordsFromPx(state.x, state.y);
  const { cx, cy } = coords;
  const roomId = state.room || SUNKEN_BOG_EXPANSE_ROOM_ID;
  const chunkKey = makeChunkPersistenceKey(roomId, cx, cy);
  const distFromSetPath = getChunkDistanceFromSetPath(cx, cy);
  const clvl = Math.max(1, state.level || 1);
  const hasLantern = hasPoeLanternGuidance(state);
  const safeDepth = 1 + Math.floor(clvl / 2) + (hasLantern ? 1 : 0);
  const overDepth = Math.max(0, distFromSetPath - safeDepth);
  const isLanternLit = Boolean(state.litChunkLanterns?.[chunkKey]);

  const rawFogIntensity =
    distFromSetPath === 0
      ? 0
      : Number(
          (
            distFromSetPath * (0.2 + clvl * 0.03) +
            overDepth * overDepth * 0.34
          ).toFixed(2)
        );

  const fogIntensity =
    distFromSetPath === 0
      ? 0
      : isLanternLit
        ? Number(Math.max(0.08, rawFogIntensity * 0.42).toFixed(2))
        : rawFogIntensity;

  const isSoftCapAbyss = overDepth > 0 && !isLanternLit;
  const seed = state.fogGraph?.seed || 104729;
  const hasDeepDungeon = isDeepFogDungeonChunk(seed, cx, cy);
  const isDeepDungeonCleared = Boolean(state.clearedDeepFogDungeons?.[chunkKey]);

  const lootMultiplier = Number(
    (1 + fogIntensity * 0.48 + (overDepth > 0 ? 0.35 : 0)).toFixed(2)
  );
  const gemBonusChance = Number(
    Math.min(0.9, fogIntensity * 0.2 + (overDepth > 0 ? 0.22 : 0)).toFixed(2)
  );

  return {
    cx,
    cy,
    chunkKey,
    distFromSetPath,
    clvl,
    safeDepth,
    overDepth,
    rawFogIntensity,
    fogIntensity,
    isSoftCapAbyss,
    isLanternLit,
    hasDeepDungeon,
    isDeepDungeonCleared,
    lootMultiplier,
    gemBonusChance,
  };
}


