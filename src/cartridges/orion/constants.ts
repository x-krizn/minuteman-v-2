/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getUnifiedBogRoomAtChunk,
  getUnifiedBogRoomPlacement,
  KEY_NODE_ROUTES,
  KeyNodeRouteDescriptor,
  SET_PATH_CORRIDOR_BY_CHUNK,
  SET_PATH_CORRIDOR_CHUNKS,
  SET_PATH_SPINE_COORDS,
  SET_PATH_SPINE_SET,
  SetPathCorridorSpec,
  SUNKEN_BOG_EXPANSE_ROOM_ID,
  UNIFIED_BOG_ROOM_BY_COORD,
  UNIFIED_BOG_ROOM_PLACEMENTS,
  UnifiedBogRoomPlacement,
} from './database/world/overworld/topology';
import { AetherCardinalDir, AetherNodeType, OrionDir, OrionState, PilotSkillId } from './types';

/**
 * Native Orion viewport width (`160` `px`, equivalent to `10` `tiles` at `16` `px` per tile).
 */
export const SCREEN_W = 160;
/**
 * Native Orion viewport height (`144` `px`, equivalent to `9` `tiles` at `16` `px` per tile).
 */
export const SCREEN_H = 144;

/**
 * World grid tile dimension (`16` `px` square).
 */
export const TILE_SIZE = 16;
/**
 * Default single-screen room width in tiles (`10` `tiles` = `160` `px`).
 */
export const COLS = 10;
/**
 * Default single-screen room height in tiles (`9` `tiles` = `144` `px`).
 */
export const ROWS = 9;

/**
 * Resolved grid dimensions (`cols`, `rows` in `tiles`) and pixel bounds (`widthPx`, `heightPx` in `px`) for a room.
 */
export interface RoomDimensions {
  cols: number;
  rows: number;
  widthPx: number;
  heightPx: number;
}

/**
 * Computes the tile (`cols`, `rows`) and pixel (`widthPx`, `heightPx`) dimensions of `roomGrid`, defaulting to `10 x 9` (`160x144` `px`).
 */
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

/**
 * Camera-clamped inclusive tile index window (`minTx..maxTx`, `minTy..maxTy`) for viewport culling.
 */
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

/**
 * Vertical 2.5D projection factor (`1.0` `px` per `z` unit) converting elevation `z` into screen-space `Y` offset.
 */
export const Z_SCALE = 1.0;

/**
 * Duration in seconds (`0.34` `s`) after raising a shield during which incoming hits trigger a Perfect Block (`mechanics-v1.md §5`).
 */
export const PERFECT_BLOCK_WINDOW_SEC = 0.34; // 0.34s perfect block window on held block

/**
 * Cooldown in seconds (`5.0` `s`) enforced between auxiliary weapon swaps.
 */
export const WEAPON_SWAP_COOLDOWN = 5.0; // 5 seconds globally
/**
 * Active impulse duration in seconds (`0.20` `s`) of a booster evade dash.
 */
export const BOOSTER_DASH_DURATION = 0.2;
/**
 * Recovery cooldown in seconds (`0.75` `s`) between consecutive booster dashes.
 */
export const BOOSTER_DASH_COOLDOWN = 0.75;
/**
 * Reactor heat generated (`22` heat units) when triggering a booster dash.
 */
export const BOOSTER_HEAT_COST = 22;

/**
 * Base mech ground movement speed (`44` `px/s`, or `2.75` `tiles/s`).
 */
export const WALK_SPEED = 44;
/**
 * Movement speed multiplier (`0.65`) applied when wading through mire or mud terrain tiles.
 */
export const MUD_SPEED_PENALTY = 0.65; // Walking in deep bog mud
/**
 * Peak ground velocity (`124` `px/s`) applied during an active booster dash.
 */
export const BOOSTER_SPEED = 124;
/**
 * Initial vertical jump impulse (`175` `px/s` along the `z` axis).
 */
export const JUMP_VELOCITY = 175;
/**
 * Downward vertical acceleration (`560` `px/s²` along the `z` axis) applied while airborne.
 */
export const GRAVITY = 560;

/**
 * Canonical HUD and telemetry hex color (`#77c7ff`) for Defense Layer 1 (Shields).
 */
export const COLOR_SHIELD = '#77c7ff'; // Cyan / Blue
/**
 * Canonical HUD and telemetry hex color (`#ffd27d`) for Defense Layer 2 (Armor).
 */
export const COLOR_ARMOR = '#ffd27d'; // Amber / Gold
/**
 * Canonical HUD and telemetry hex color (`#8dd7ad`) for Defense Layer 3 (Frame Integrity).
 */
export const COLOR_FRAME = '#8dd7ad'; // Emerald green
/**
 * Canonical HUD and telemetry hex color (`#ff9b9b`) for Critical Frame state (`<= 40` HP).
 */
export const COLOR_CRITICAL = '#ff9b9b'; // Crimson
/**
 * Canonical HUD and telemetry hex color (`#f97316`) for Reactor Heat warnings.
 */
export const COLOR_HEAT = '#f97316'; // Orange

/**
 * Normalized 2D unit vectors (`x`, `y`) for all 8 canonical `OrionDir` compass directions (`N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`).
 */
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

/**
 * Quantizes a 2D movement or aim vector `(dx, dy)` into the nearest 8-way `OrionDir` compass direction.
 */
export function getDirFromVector(dx: number, dy: number): OrionDir {
  if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) return 'S';
  const angle = Math.atan2(dy, dx);
  const octant = Math.round((8 * angle) / (2 * Math.PI) + 8) % 8;
  const dirs: OrionDir[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  return dirs[octant] || 'S';
}

// ─── AETHER PYRAMID & DOORWAY TRANSITION HELPERS ─────────────────────────────

/**
 * Canonical Æther Fog depth tiers (`1..4`) mapping distance from the Set Path to procedural room complexity.
 */
export const AETHER_PYRAMID_DEPTHS = [0, 1, 2, 3, 2, 1, 0] as const;

/**
 * Route metadata describing a canonical Set Path key room (`coord`, `title`, `exitDir`, `nextKeyCoord`) and its progression spine `KEY_NODE_ROUTES`.
 */
export { KEY_NODE_ROUTES, type KeyNodeRouteDescriptor };

/**
 * Computes a deterministic 32-bit unsigned integer hash from a string seed for procedural Æther room and chunk generation.
 */
export function deterministicAetherHash(
  seed: number,
  counter: number,
  salt: number = 0
): number {
  let h = (seed ^ (counter * 374761393) ^ (salt * 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Determines whether exiting `coord` along `dir` leads along the Set Path (`'key'`), into a loop, or into an Æther Fog branch.
 */
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

/**
 * Returns `true` when the pilot has earned Poe's spectral lantern guidance (`poe_state === 'helped'` or `'companion'`).
 */
export function hasPoeLanternGuidance(state: OrionState): boolean {
  return Boolean(
    state.flags?.poe_state === 'companion' ||
      state.flags?.poe_state === 'helped' ||
      state.flags?.poe_lantern_gift
  );
}

const PILOT_SKILL_GEM_COLORS: Record<
  PilotSkillId,
  { hexColor: string; coreHexColor: string; skillId: PilotSkillId }
> = {
  Warrior: { hexColor: '#ef4444', coreHexColor: '#fca5a5', skillId: 'Warrior' }, // Spinel
  Marauder: { hexColor: '#f97316', coreHexColor: '#fdba74', skillId: 'Marauder' }, // Carnelian
  Guardian: { hexColor: '#facc15', coreHexColor: '#fef08a', skillId: 'Guardian' }, // Titanite
  Cleric: { hexColor: '#22c55e', coreHexColor: '#86efac', skillId: 'Cleric' }, // Demantoid
  Wizard: { hexColor: '#38bdf8', coreHexColor: '#bae6fd', skillId: 'Wizard' }, // Kyanite
  Rogue: { hexColor: '#a855f7', coreHexColor: '#d8b4fe', skillId: 'Rogue' }, // Charoite
};

/**
 * Resolves the Companion Poe orb's primary & core hex colors based on the pilot's highest Pilot Skill level.
 * When multiple skills are tied for highest level, falls back to the pilot's starting Trait Line primary gemstone color.
 */
export function resolveCompanionPoeColor(state: OrionState): {
  hexColor: string;
  coreHexColor: string;
  skillId: PilotSkillId;
} {
  const fallbackTraitSkill: PilotSkillId =
    state.traitLine && PILOT_SKILL_GEM_COLORS[state.traitLine]
      ? state.traitLine
      : 'Warrior';
  const skills = state.pilotSkills;
  if (!skills) {
    return PILOT_SKILL_GEM_COLORS[fallbackTraitSkill];
  }

  const orderedIds: PilotSkillId[] = [
    'Warrior',
    'Marauder',
    'Guardian',
    'Cleric',
    'Wizard',
    'Rogue',
  ];

  let maxLevel = -1;
  for (const id of orderedIds) {
    const lvl = skills[id]?.level ?? 1;
    if (lvl > maxLevel) {
      maxLevel = lvl;
    }
  }

  const topAtMaxLevel = orderedIds.filter((id) => (skills[id]?.level ?? 1) === maxLevel);
  if (topAtMaxLevel.length === 1) {
    return PILOT_SKILL_GEM_COLORS[topAtMaxLevel[0]];
  }

  // If tied at max level, check if any tied skill has strictly more invested gems/XP
  let maxProgressScore = -1;
  for (const id of topAtMaxLevel) {
    const score = (skills[id]?.gemsInvested ?? 0) * 100 + (skills[id]?.xp ?? 0);
    if (score > maxProgressScore) {
      maxProgressScore = score;
    }
  }

  const topAtMaxScore = topAtMaxLevel.filter(
    (id) => (skills[id]?.gemsInvested ?? 0) * 100 + (skills[id]?.xp ?? 0) === maxProgressScore
  );
  if (topAtMaxScore.length === 1 && maxProgressScore > 0) {
    return PILOT_SKILL_GEM_COLORS[topAtMaxScore[0]];
  }

  // Tie-breaker: use the pilot's Trait Line primary gemstone color if it's among the tied highest skills
  if (topAtMaxLevel.includes(fallbackTraitSkill)) {
    return PILOT_SKILL_GEM_COLORS[fallbackTraitSkill];
  }

  return PILOT_SKILL_GEM_COLORS[topAtMaxLevel[0] || fallbackTraitSkill];
}

/**
 * Returns `true` when developer progression bypass (`bypassProgressionGates`) is enabled on `state`.
 */
export function isCheatModeActive(state: OrionState): boolean {
  return Boolean(
    state.bypassProgressionGates ||
      state.room === '-4,0' ||
      getEffectiveRoomCoord(state) === '-4,0'
  );
}

/**
 * Descriptor for a cardinal doorway transition, including target coordinate, safety tier, and whether it enters Æther Fog.
 */
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

/**
 * Width of a single streaming expanse chunk in tiles (`10` `tiles` = `160` `px`).
 */
export const CHUNK_COLS = COLS; // 10 tiles (160 px)
/**
 * Height of a single streaming expanse chunk in tiles (`9` `tiles` = `144` `px`).
 */
export const CHUNK_ROWS = ROWS; // 9 tiles (144 px)
/**
 * Width of a single streaming expanse chunk in pixels (`160` `px`).
 */
export const CHUNK_W_PX = CHUNK_COLS * TILE_SIZE; // 160 px
/**
 * Height of a single streaming expanse chunk in pixels (`144` `px`).
 */
export const CHUNK_H_PX = CHUNK_ROWS * TILE_SIZE; // 144 px

/**
 * Horizontal chunk count (`26` chunks) across the Unified Sunken Bog Expanse (`4160` `px` total width).
 */
export const EXPANSE_CHUNKS_X = 26; // 260 tiles wide (4,160 px)
/**
 * Vertical chunk count (`18` chunks) across the Unified Sunken Bog Expanse (`2592` `px` total height).
 */
export const EXPANSE_CHUNKS_Y = 18; // 162 tiles tall (2,592 px)
/**
 * Total tile columns (`260` `tiles`) across the Unified Sunken Bog Expanse.
 */
export const EXPANSE_TOTAL_COLS = EXPANSE_CHUNKS_X * CHUNK_COLS; // 260
/**
 * Total tile rows (`162` `tiles`) across the Unified Sunken Bog Expanse.
 */
export const EXPANSE_TOTAL_ROWS = EXPANSE_CHUNKS_Y * CHUNK_ROWS; // 162

/**
 * Re-exported Unified Sunken Bog Expanse room placements, Set Path corridor chunks, and chunk lookup helpers sourced from `database/world/overworld/topology.ts`.
 */
export {
  getUnifiedBogRoomAtChunk,
  getUnifiedBogRoomPlacement,
  SET_PATH_CORRIDOR_BY_CHUNK,
  SET_PATH_CORRIDOR_CHUNKS,
  SET_PATH_SPINE_COORDS,
  SET_PATH_SPINE_SET,
  type SetPathCorridorSpec,
  SUNKEN_BOG_EXPANSE_ROOM_ID,
  UNIFIED_BOG_ROOM_BY_COORD,
  UNIFIED_BOG_ROOM_PLACEMENTS,
  type UnifiedBogRoomPlacement,
};

/**
 * Resolves a world pixel position `(x, y)` in `px` on the Unified Sunken Bog Expanse to its enclosing `UnifiedBogRoomPlacement`.
 */
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

/**
 * Computed Æther Fog depth (`0..4`), Manhattan distance from the Set Path, and deep-fog dungeon status for a chunk `(cx, cy)`.
 */
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

/**
 * Returns `true` if `roomId` uses the continuous `26x18` chunk-streaming expanse architecture.
 */
export function isChunkedExpanseRoom(roomId: string | undefined): boolean {
  if (!roomId) return false;
  return roomId === SUNKEN_BOG_EXPANSE_ROOM_ID;
}

/**
 * Converts world pixel coordinates `(x, y)` in `px` into clamped chunk indices `{ cx, cy }` (`0..25`, `0..17`).
 */
export function getChunkCoordsFromPx(
  x: number,
  y: number
): { cx: number; cy: number } {
  const cx = Math.max(0, Math.min(EXPANSE_CHUNKS_X - 1, Math.floor(x / CHUNK_W_PX)));
  const cy = Math.max(0, Math.min(EXPANSE_CHUNKS_Y - 1, Math.floor(y / CHUNK_H_PX)));
  return { cx, cy };
}

/**
 * Formats chunk coordinates `(cx, cy)` into the canonical `"cx,cy"` persistence key.
 */
export function makeChunkPersistenceKey(roomId: string, cx: number, cy: number): string {
  return `${roomId}:${cx},${cy}`;
}

/**
 * Computes the minimum Manhattan chunk distance from `(cx, cy)` to any Set Path spine or landmark chunk.
 */
export function getChunkDistanceFromSetPath(cx: number, cy: number): number {
  if (SET_PATH_SPINE_SET.has(`${cx},${cy}`)) return 0;
  let minDist = 99;
  for (const node of SET_PATH_SPINE_COORDS) {
    const d = Math.abs(cx - node.cx) + Math.abs(cy - node.cy);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Returns `true` if chunk `(cx, cy)` is an authored or procedural deep-fog dungeon vault off the Set Path.
 */
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

/**
 * Computes `ChunkFogMetrics` (fog depth, Set Path distance, and lantern suppression) for chunk `(cx, cy)` given `state`.
 */
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
  const isLanternLit = hasLantern || Boolean(state.litChunkLanterns?.[chunkKey]);

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


