/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  CHUNK_COLS,
  CHUNK_H_PX,
  CHUNK_ROWS,
  CHUNK_W_PX,
  ChunkFogMetrics,
  computeChunkFogMetrics,
  convertBogRoomPosToUnifiedPx,
  EXPANSE_CHUNKS_X,
  EXPANSE_CHUNKS_Y,
  EXPANSE_TOTAL_COLS,
  EXPANSE_TOTAL_ROWS,
  getChunkCoordsFromPx,
  getChunkDistanceFromSetPath,
  getEffectiveRoomCoord,
  getUnifiedBogRoomAtChunk,
  getUnifiedBogRoomAtPx,
  getUnifiedBogRoomPlacement,
  isChunkedExpanseRoom,
  isDeepFogDungeonChunk,
  makeChunkPersistenceKey,
  SET_PATH_CORRIDOR_BY_CHUNK,
  SET_PATH_CORRIDOR_CHUNKS,
  SET_PATH_SPINE_COORDS,
  SET_PATH_SPINE_SET,
  SUNKEN_BOG_EXPANSE_ROOM_ID,
  TILE_SIZE,
  UNIFIED_BOG_ROOM_PLACEMENTS,
  UnifiedBogRoomPlacement,
} from '../../constants';
import { getEnemyDefinition } from '../../database/enemies';
import { getWeaponDefinition } from '../../database/equipment/weapons';
import { unlockEquipmentItem } from '../../database/progression';
import { resolveRoomEnemyTypeAtChar } from '../../database/world';
import { EnemyEntity, OrionCombatContext, OrionState } from '../../types';
import { spawnEnemyByType } from '../entitySystem';
import { addOrionInventoryItem, notifyOrionStateChange } from '../playerSystem';
import { ORION_ROOM_METADATA, ORION_TUTORIAL_ROOMS, ROOM_REGISTRY } from './roomLoader';
import {
  getCanonicalRoomPersistenceKey,
  resolveContextualEquipmentDrop,
  resolveContextualGemPool,
} from './worldPersistence';

// ─── UNIFIED BOG 26×18 CHUNK STREAMING & 3×3 ENEMY HIBERNATION (260×162 TILES) ─

export {
  CHUNK_COLS,
  CHUNK_H_PX,
  CHUNK_ROWS,
  CHUNK_W_PX,
  computeChunkFogMetrics,
  convertBogRoomPosToUnifiedPx,
  EXPANSE_CHUNKS_X,
  EXPANSE_CHUNKS_Y,
  EXPANSE_TOTAL_COLS,
  EXPANSE_TOTAL_ROWS,
  getChunkCoordsFromPx,
  getChunkDistanceFromSetPath,
  getEffectiveRoomCoord,
  getUnifiedBogRoomAtChunk,
  getUnifiedBogRoomAtPx,
  getUnifiedBogRoomPlacement,
  isChunkedExpanseRoom,
  isDeepFogDungeonChunk,
  makeChunkPersistenceKey,
  SET_PATH_CORRIDOR_BY_CHUNK,
  SET_PATH_CORRIDOR_CHUNKS,
  SET_PATH_SPINE_COORDS,
  SET_PATH_SPINE_SET,
  SUNKEN_BOG_EXPANSE_ROOM_ID,
  UNIFIED_BOG_ROOM_PLACEMENTS,
};
export type { ChunkFogMetrics, UnifiedBogRoomPlacement };

export interface ChunkEnemySpawnSpec {
  type: string;
  localTileX: number;
  localTileY: number;
  name?: string;
  emissiveColor?: string;
  isAbyssElite?: boolean;
  isDungeonGuardian?: boolean;
}

export interface ChunkBlueprint {
  title: string;
  isLandmark: boolean;
  isSetPath: boolean;
  hasDeepDungeon: boolean;
  authoredRoomCoord?: string;
  grid10x9: string[];
  spawns: ChunkEnemySpawnSpec[];
}

function hashChunk2D(seed: number, cx: number, cy: number, salt: number = 0): number {
  let h = (seed ^ (cx * 374761393) ^ (cy * 668265263) ^ (salt * 1442695041)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function isDoorwayOpeningTile(ch: string | undefined): boolean {
  if (!ch || ch === ' ') return false;
  return ch !== '#' && ch !== 'P' && ch !== '_';
}

/**
 * Checks whether a chunk `(cx, cy)` is inside or immediately adjacent (Chebyshev distance <= 1)
 * to a Sanctuary Room Node: Drop-Pod Impact Crater (`-3,0` at `cx=3..4, cy=9..10`)
 * or First Campfire (`0,0` at `cx=12..13, cy=9..10`).
 */
export function isNearSanctuaryRoom(cx: number, cy: number): boolean {
  const nearDropPod = cx >= 2 && cx <= 5 && cy >= 8 && cy <= 11;
  const nearCampfire = cx >= 11 && cx <= 14 && cy >= 8 && cy <= 11;
  return nearDropPod || nearCampfire;
}

/**
 * Stamps an authored `m00_the_bog` RoomDefinition (`16×12` up to `20×15` tiles)
 * directly onto its `2×2` chunk (`20×18` tile) block on the Unified Bog Grid.
 * Unfilled room-padding tiles default to solid walls (`#`), and causeways (`:`)
 * are only carved on cardinal sides where the room actually has a doorway opening.
 */
function stampAuthoredRoomToChunk10x9(
  placement: UnifiedBogRoomPlacement,
  subCx: number,
  subCy: number
): { title: string; grid10x9: string[] } {
  const roomDef = ROOM_REGISTRY[placement.roomCoord];
  const rawGrid =
    roomDef?.grid ||
    ORION_TUTORIAL_ROOMS[placement.roomCoord] ||
    ROOM_REGISTRY['0,0']?.grid ||
    [];
  const blockCols = CHUNK_COLS * 2; // 20
  const blockRows = CHUNK_ROWS * 2; // 18

  const rawRows = rawGrid.length;
  const rawCols = Math.max(1, ...rawGrid.map((r) => (r ? r.length : 0)));
  const offsetCol = Math.max(0, Math.floor((blockCols - rawCols) / 2));
  const offsetRow = Math.max(0, Math.floor((blockRows - rawRows) / 2));

  // Initialize 20x18 block with solid wall fallback ('#') for all unfilled/padding spots
  const block: string[][] = Array.from({ length: blockRows }, () =>
    Array.from({ length: blockCols }, () => '#')
  );

  // Stamp the authored RoomDefinition grid into the center of the 20x18 block
  for (let r = 0; r < rawRows && offsetRow + r < blockRows; r++) {
    const line = rawGrid[r] || '';
    for (let c = 0; c < rawCols && offsetCol + c < blockCols; c++) {
      const ch = line[c];
      block[offsetRow + r][offsetCol + c] = !ch || ch === ' ' ? '#' : ch;
    }
  }

  // Seal North, South, and West edges of Drop-Pod Impact Crater ('-3,0') so it forms an enclosed crater rim opening East
  if (placement.roomCoord === '-3,0') {
    for (let c = offsetCol; c < offsetCol + rawCols && c < blockCols; c++) {
      block[offsetRow][c] = '#';
      block[offsetRow + rawRows - 1][c] = '#';
    }
    for (let r = offsetRow; r < offsetRow + rawRows && r < blockRows; r++) {
      block[r][offsetCol] = '#';
    }
  }

  // Detect which cardinal walls of the stamped room have doorway openings
  let hasNorthDoor = false;
  let hasSouthDoor = false;
  for (let c = offsetCol + 1; c <= offsetCol + rawCols - 2 && c < blockCols; c++) {
    if (isDoorwayOpeningTile(block[offsetRow]?.[c])) hasNorthDoor = true;
    if (isDoorwayOpeningTile(block[offsetRow + rawRows - 1]?.[c])) hasSouthDoor = true;
  }

  let hasWestDoor = false;
  let hasEastDoor = false;
  for (let r = offsetRow + 1; r <= offsetRow + rawRows - 2 && r < blockRows; r++) {
    if (isDoorwayOpeningTile(block[r]?.[offsetCol])) hasWestDoor = true;
    if (isDoorwayOpeningTile(block[r]?.[offsetCol + rawCols - 1])) hasEastDoor = true;
  }

  // Only carve padding causeways on cardinal sides that actually have a doorway opening
  if (hasNorthDoor) {
    for (let r = 0; r < offsetRow; r++) {
      for (let c = 4; c <= 15; c++) {
        block[r][c] = ':';
      }
    }
    for (let c = 8; c <= 11; c++) {
      if (block[offsetRow]?.[c] === '#') block[offsetRow][c] = ':';
    }
  }

  if (hasSouthDoor) {
    for (let r = offsetRow + rawRows; r < blockRows; r++) {
      for (let c = 4; c <= 15; c++) {
        block[r][c] = ':';
      }
    }
    for (let c = 8; c <= 11; c++) {
      if (block[offsetRow + rawRows - 1]?.[c] === '#') {
        block[offsetRow + rawRows - 1][c] = ':';
      }
    }
  }

  if (hasWestDoor) {
    for (let r = 4; r <= 13; r++) {
      for (let c = 0; c < offsetCol; c++) {
        block[r][c] = ':';
      }
    }
    for (const r of [8, 9]) {
      if (block[r]?.[offsetCol] === '#') block[r][offsetCol] = ':';
    }
  }

  if (hasEastDoor) {
    const eastEdgeCol = offsetCol + rawCols - 1;
    if (placement.roomCoord === '3,0') {
      for (let r = offsetRow; r < offsetRow + rawRows && r < blockRows; r++) {
        if (block[r]?.[eastEdgeCol] === 'G') {
          block[r][eastEdgeCol] = ':';
        }
      }
    }
    for (let r = 4; r <= 13; r++) {
      for (let c = offsetCol + rawCols; c < blockCols; c++) {
        block[r][c] = placement.roomCoord === '3,0' && c === blockCols - 1 ? 'G' : ':';
      }
    }
    for (const r of [8, 9]) {
      if (block[r]?.[eastEdgeCol] === '#') block[r][eastEdgeCol] = ':';
    }
  }

  // For '3,0' (Main Bog Expanse & Exit Gate), ensure Rusted Gate ('G') seals the East exit border
  if (placement.roomCoord === '3,0') {
    for (let r = 4; r <= 13; r++) {
      block[r][blockCols - 1] = 'G';
    }
  }

  const startR = subCy * CHUNK_ROWS;
  const startC = subCx * CHUNK_COLS;
  const grid10x9: string[] = [];
  for (let r = 0; r < CHUNK_ROWS; r++) {
    grid10x9.push(block[startR + r].slice(startC, startC + CHUNK_COLS).join(''));
  }

  const quadrantTag = `${subCy === 0 ? 'N' : 'S'}${subCx === 0 ? 'W' : 'E'}`;
  const cleanTitle = (roomDef?.title || placement.title).replace(/^M0\d\s+THE\s+BOG\s*[·—-]\s*/i, '');
  return {
    title: `${cleanTitle} (${quadrantTag})`,
    grid10x9,
  };
}

/**
 * Builds a `10×9` Set-Path Corridor chunk connecting two adjacent authored Bog RoomDefinitions.
 * Corridors adjacent to Sanctuary nodes (`-3,0` Drop-Pod or `0,0` Campfire) have 0 spawns;
 * other Set-Path corridors spawn 0–1 enemy.
 */
function buildSetPathCorridorChunk10x9(
  cx: number,
  cy: number,
  orientation: 'H' | 'V' | 'CROSS',
  label: string,
  chunkHash: number
): ChunkBlueprint {
  const grid10x9 =
    orientation === 'H'
      ? [
          '###::::###',
          '#,P::::P,#',
          '#,~~::~~,#',
          '::::L:::::',
          '::::::::::',
          '::::C:::::',
          '#,~~::~~,#',
          '#,P::::P,#',
          '###::::###',
        ]
      : [
          '###::::###',
          '#,P::::P,#',
          '#,~~::~~,#',
          '#,.::::.,#',
          '::::L:::::',
          '#,.::C:.,#',
          '#,~~::~~,#',
          '#,P::::P,#',
          '###::::###',
        ];

  const isSanctuaryBuffer = isNearSanctuaryRoom(cx, cy);
  const shouldSpawnEnemy = !isSanctuaryBuffer && (chunkHash & 1) === 0;
  const spawnType = (chunkHash >>> 1) % 2 === 0 ? 'bog_crawler' : 'orc_scout';

  return {
    title: `Set-Path Causeway (${label})`,
    isLandmark: true,
    isSetPath: true,
    hasDeepDungeon: false,
    grid10x9,
    spawns: shouldSpawnEnemy
      ? [
          {
            type: spawnType,
            localTileX: 5,
            localTileY: 4,
            name: spawnType === 'bog_crawler' ? 'Causeway Skitterer' : 'Causeway Scout',
          },
        ]
      : [],
  };
}

// ─── 1. OFF-PATH WILDERNESS LANDMARK CHUNKS (10×9 TILES EACH) ────────────────

export const AUTHORED_LANDMARK_CHUNKS: Record<string, ChunkBlueprint> = {
  // Drowned Reliquary Shrine at Chunk (2, 3) (Off-Path Landmark)
  '2,3': {
    title: 'Drowned Reliquary Shrine',
    isLandmark: true,
    isSetPath: false,
    hasDeepDungeon: false,
    grid10x9: [
      '###....###',
      '#,P~~~~P,#',
      '#,~~::~~,#',
      '#,~:L!:~,#',
      '...:C::...',
      '#,~~::~~,#',
      '#,~~~~~~,#',
      '#,P....P,#',
      '###....###',
    ],
    spawns: [
      {
        type: 'bog_wurm',
        localTileX: 3,
        localTileY: 6,
        name: 'Reliquary Mire Wurm',
        emissiveColor: '#a855f7',
      },
      {
        type: 'orc_scout',
        localTileX: 7,
        localTileY: 4,
        name: 'Shrine Look-Out',
      },
    ],
  },

  // Overgrown Munitions Depot at Chunk (23, 3) (Off-Path Landmark)
  '23,3': {
    title: 'Overgrown Munitions Depot',
    isLandmark: true,
    isSetPath: false,
    hasDeepDungeon: false,
    grid10x9: [
      '###;;;;###',
      '###;;;;###',
      '##;;::;;##',
      '#,;:L:;;,#',
      ';;;:V:;;;;',
      '#,;;:C:;,#',
      '##;;::;;##',
      '###;;;;###',
      '###;;;;###',
    ],
    spawns: [
      {
        type: 'bors_knight',
        localTileX: 5,
        localTileY: 4,
        name: 'Depot Siege Warden',
        emissiveColor: '#f43f5e',
      },
      {
        type: 'orc_warrior',
        localTileX: 3,
        localTileY: 5,
        name: 'Munitions Marauder',
      },
    ],
  },
};

// ─── 2. DETERMINISTIC PROCEDURAL FILL CHUNK TEMPLATES (10×9 TILES) ───────────

const PROCEDURAL_BOG_CHUNK_TEMPLATES: Array<{
  title: string;
  grid10x9: string[];
}> = [
  {
    title: 'Downed Timber Crossing',
    grid10x9: [
      '###....###',
      '#,P....P,#',
      '#,##..##,#',
      '#,......,#',
      '..........',
      '#,..~~..,#',
      '#,##~~##,#',
      '#,......,#',
      '###....###',
    ],
  },
  {
    title: 'Mire Pool Causeway',
    grid10x9: [
      '###....###',
      '#,~~..~~,#',
      '#,~~::~~,#',
      '#,..::..,#',
      '....::....',
      '#,..::..,#',
      '#,~~::~~,#',
      '#,~~..~~,#',
      '###....###',
    ],
  },
  {
    title: 'Sunken Pillar Grove',
    grid10x9: [
      '###::::###',
      '#,P::::P,#',
      '#,..::..,#',
      '#,P.::.P,#',
      '::::..::::',
      '#,P.::.P,#',
      '#,..::..,#',
      '#,P::::P,#',
      '###::::###',
    ],
  },
  {
    title: 'Peat Bog Hollow',
    grid10x9: [
      '###;;;;###',
      '#,;;;;;;,#',
      '#,;.##.;,#',
      '#,;;..;;,#',
      ';;;;..;;;;',
      '#,;;..;;,#',
      '#,;.~~.;,#',
      '#,;;;;;;,#',
      '###;;;;###',
    ],
  },
  {
    title: 'Corrosive Creek Bridge',
    grid10x9: [
      '###....###',
      '#,~~~~~~,#',
      '#,~~::~~,#',
      '#,..::..,#',
      '::::..::::',
      '#,..::..,#',
      '#,~~::~~,#',
      '#,~~~~~~,#',
      '###....###',
    ],
  },
  {
    title: 'Overgrown Flagstone Trail',
    grid10x9: [
      '###....###',
      '#,P.::.P,#',
      '#,..::..,#',
      '#,##::##,#',
      '..........',
      '#,##::##,#',
      '#,..::..,#',
      '#,P.::.P,#',
      '###....###',
    ],
  },
];

const DEEP_FOG_DUNGEON_CHUNK_TEMPLATE: string[] = [
  '###....###',
  '#,P~~~~P,#',
  '#,~::::~,#',
  '#,::L:::,#',
  ':::V.D::::',
  '#,::::::,#',
  '#,~::::~,#',
  '#,P~~~~P,#',
  '###....###',
];

/**
 * Seals outer perimeter edges (`cx === 0`, `cx === 25`, `cy === 0`, `cy === 17`),
 * places off-path Lantern Anchors (`L`) and caches (`C`),
 * defaults any unfilled cell to `#`, and guarantees internal chunk border openings
 * for non-authored wilderness chunks.
 */
function finalizeChunkGridBorders(
  rawGrid10x9: string[],
  cx: number,
  cy: number,
  chunkHash: number,
  isLandmark: boolean,
  distFromSetPath: number,
  hasDeepDungeon: boolean,
  isAuthoredRoom: boolean = false
): string[] {
  const matrix = Array.from({ length: CHUNK_ROWS }, (_, r) => {
    const row = String(rawGrid10x9[r] ?? '');
    return row
      .padEnd(CHUNK_COLS, '#')
      .slice(0, CHUNK_COLS)
      .split('')
      .map((ch) => (!ch || ch === ' ' ? '#' : ch));
  });

  if (!isLandmark && !hasDeepDungeon && !isAuthoredRoom) {
    // Place off-path Lantern Anchors (`L`) in deep wilderness chunks so pilots can push back the fog
    if (distFromSetPath >= 2 && (chunkHash % 2 === 0 || distFromSetPath >= 3)) {
      const lCol = chunkHash % 2 === 0 ? 4 : 5;
      const lRow = 3;
      if (matrix[lRow]?.[lCol]) {
        matrix[lRow][lCol] = 'L';
      }
    }

    // Place procedural salvage caches (`C` or `V` in deep fog)
    if (chunkHash % 4 === 0 || (distFromSetPath >= 3 && chunkHash % 3 === 0)) {
      const cacheCol = chunkHash % 2 === 0 ? 3 : 6;
      const cacheRow = 5;
      if (
        matrix[cacheRow]?.[cacheCol] === '.' ||
        matrix[cacheRow]?.[cacheCol] === ':' ||
        matrix[cacheRow]?.[cacheCol] === ';'
      ) {
        matrix[cacheRow][cacheCol] = distFromSetPath >= 3 && chunkHash % 2 === 0 ? 'V' : 'C';
      }
    }
  }

  // Ensure internal chunk seam openings are walkable for procedural / corridor chunks
  // (Authored 20x18 room blocks already carve their exact doorway openings and keep closed walls solid '#')
  if (!isAuthoredRoom) {
    if (cy > 0) {
      matrix[0][4] = matrix[0][4] === '#' ? '.' : matrix[0][4];
      matrix[0][5] = matrix[0][5] === '#' ? '.' : matrix[0][5];
    }
    if (cy < EXPANSE_CHUNKS_Y - 1) {
      matrix[CHUNK_ROWS - 1][4] =
        matrix[CHUNK_ROWS - 1][4] === '#' ? '.' : matrix[CHUNK_ROWS - 1][4];
      matrix[CHUNK_ROWS - 1][5] =
        matrix[CHUNK_ROWS - 1][5] === '#' ? '.' : matrix[CHUNK_ROWS - 1][5];
    }
    if (cx > 0) {
      matrix[4][0] = matrix[4][0] === '#' ? '.' : matrix[4][0];
    }
    if (cx < EXPANSE_CHUNKS_X - 1) {
      matrix[4][CHUNK_COLS - 1] =
        matrix[4][CHUNK_COLS - 1] === '#' ? '.' : matrix[4][CHUNK_COLS - 1];
    }
  }

  // Seal outer perimeter of the 260x162 Expanse
  if (cy === 0) {
    for (let c = 0; c < CHUNK_COLS; c++) matrix[0][c] = '#';
  }
  if (cy === EXPANSE_CHUNKS_Y - 1) {
    for (let c = 0; c < CHUNK_COLS; c++) matrix[CHUNK_ROWS - 1][c] = '#';
  }
  if (cx === 0) {
    for (let r = 0; r < CHUNK_ROWS; r++) matrix[r][0] = '#';
  }
  if (cx === EXPANSE_CHUNKS_X - 1) {
    for (let r = 0; r < CHUNK_ROWS; r++) matrix[r][CHUNK_COLS - 1] = '#';
  }

  return matrix.map((r) => r.join(''));
}

export function resolveChunkBlueprint(
  seed: number,
  cx: number,
  cy: number,
  clvl: number = 1
): ChunkBlueprint {
  const key = `${cx},${cy}`;
  const chunkHash = hashChunk2D(seed, cx, cy) >>> 0;
  const distFromSetPath = getChunkDistanceFromSetPath(cx, cy);

  // 1. Authored M00 Bog RoomDefinition Node (2x2 chunk = 20x18 tile block)
  const bogRoomPlacement = getUnifiedBogRoomAtChunk(cx, cy);
  if (bogRoomPlacement) {
    const subCx = cx - bogRoomPlacement.startCx;
    const subCy = cy - bogRoomPlacement.startCy;
    const stamped = stampAuthoredRoomToChunk10x9(bogRoomPlacement, subCx, subCy);
    return {
      title: stamped.title,
      isLandmark: true,
      isSetPath: true,
      hasDeepDungeon: false,
      authoredRoomCoord: bogRoomPlacement.roomCoord,
      grid10x9: finalizeChunkGridBorders(
        stamped.grid10x9,
        cx,
        cy,
        chunkHash,
        true,
        0,
        false,
        true
      ),
      spawns: [],
    };
  }

  // 2. Set-Path Causeway Corridor Chunk (1-chunk connector between Bog rooms)
  const corridor = SET_PATH_CORRIDOR_BY_CHUNK[key];
  if (corridor) {
    const corrBp = buildSetPathCorridorChunk10x9(
      cx,
      cy,
      corridor.orientation,
      corridor.title,
      chunkHash
    );
    return {
      ...corrBp,
      grid10x9: finalizeChunkGridBorders(
        corrBp.grid10x9,
        cx,
        cy,
        chunkHash,
        true,
        0,
        false,
        false
      ),
    };
  }

  // 3. Hand-Authored Off-Path Wilderness Landmark Chunk
  const landmark = AUTHORED_LANDMARK_CHUNKS[key];
  if (landmark) {
    return {
      title: landmark.title,
      isLandmark: true,
      isSetPath: landmark.isSetPath,
      hasDeepDungeon: landmark.hasDeepDungeon,
      grid10x9: finalizeChunkGridBorders(
        landmark.grid10x9,
        cx,
        cy,
        chunkHash,
        true,
        distFromSetPath,
        false,
        false
      ),
      spawns: landmark.spawns,
    };
  }

  // 4. Deep-Fog Dungeon Chunk (distFromSetPath >= 3 -> spawns Aether Fog Loop Dungeon entrance 'D')
  const hasDeepDungeon = isDeepFogDungeonChunk(seed, cx, cy);
  if (hasDeepDungeon) {
    const dungeonGrid = finalizeChunkGridBorders(
      DEEP_FOG_DUNGEON_CHUNK_TEMPLATE,
      cx,
      cy,
      chunkHash,
      false,
      distFromSetPath,
      true,
      false
    );
    const wardenPool = [
      { type: 'percival_knight', title: 'Abyssal Dungeon Warden (Elite)' },
      { type: 'bors_knight', title: 'Deep-Fog Executioner (Elite)' },
      { type: 'tristan_knight', title: 'Mist-Bound Gatekeeper (Elite)' },
    ];
    const pickedWarden = wardenPool[chunkHash % wardenPool.length] || wardenPool[0];
    return {
      title: `Abyssal Fog Loop Dungeon [${cx},${cy}]`,
      isLandmark: false,
      isSetPath: false,
      hasDeepDungeon: true,
      grid10x9: dungeonGrid,
      spawns: [
        {
          type: pickedWarden.type,
          localTileX: 5,
          localTileY: 5,
          name: pickedWarden.title,
          emissiveColor: '#f43f5e',
          isAbyssElite: true,
          isDungeonGuardian: true,
        },
        {
          type: 'orc_warrior',
          localTileX: 3,
          localTileY: 4,
          name: 'Dungeon Fog Vanguard',
          emissiveColor: '#c084fc',
          isDungeonGuardian: true,
        },
      ],
    };
  }

  // 5. Procedural Off-Path Aether Fog Wilderness Chunk
  const template =
    PROCEDURAL_BOG_CHUNK_TEMPLATES[chunkHash % PROCEDURAL_BOG_CHUNK_TEMPLATES.length] ||
    PROCEDURAL_BOG_CHUNK_TEMPLATES[0];
  const finalizedGrid = finalizeChunkGridBorders(
    template.grid10x9,
    cx,
    cy,
    chunkHash,
    false,
    distFromSetPath,
    false,
    false
  );

  const spawns: ChunkEnemySpawnSpec[] = [];
  const effectiveTierScore = distFromSetPath + Math.floor(Math.max(1, clvl) / 2);

  // Enforce Sanctuary Buffer Zone around Drop-Pod (-3,0) and First Campfire (0,0) with zero adjacent off-path spawns
  if (distFromSetPath >= 1 && !isNearSanctuaryRoom(cx, cy)) {
    const primaryPool =
      effectiveTierScore <= 2
        ? ['bog_crawler', 'orc_scout']
        : effectiveTierScore <= 4
          ? ['orc_scout', 'orc_warrior', 'bog_crawler']
          : effectiveTierScore <= 6
            ? ['orc_warrior', 'bog_wurm', 'orc_scout']
            : ['orc_warrior', 'bog_wurm', 'percival_knight', 'tristan_knight'];

    // Lower base density: 0-1 enemies at dist 1; 1-2 enemies at dist 2+
    const shouldSpawnPrimary =
      distFromSetPath >= 2 || ((chunkHash >>> 2) % 2 === 0);

    if (shouldSpawnPrimary) {
      const typeA = primaryPool[chunkHash % primaryPool.length] || 'bog_crawler';
      const isDeepAbyss = distFromSetPath >= 3;
      spawns.push({
        type: typeA,
        localTileX: 3 + (chunkHash % 2),
        localTileY: 3 + ((chunkHash >>> 3) % 3),
        ...(isDeepAbyss
          ? {
              name: `Fog-Touched ${typeA.replace('_', ' ')}`,
              emissiveColor: distFromSetPath >= 4 ? '#f43f5e' : '#c084fc',
              isAbyssElite: distFromSetPath >= 4,
            }
          : {}),
      });
    }

    if (distFromSetPath >= 2 && ((chunkHash >>> 6) % 3 === 0 || distFromSetPath >= 3)) {
      const typeB = primaryPool[(chunkHash >>> 4) % primaryPool.length] || primaryPool[0] || 'orc_scout';
      spawns.push({
        type: typeB,
        localTileX: 6 - (chunkHash % 2),
        localTileY: 5 - ((chunkHash >>> 5) % 2),
        ...(distFromSetPath >= 3
          ? {
              emissiveColor: '#c084fc',
              isAbyssElite: distFromSetPath >= 4,
            }
          : {}),
      });
    }

    // Extra elite pack member only in deep off-path fog (distance >= 4)
    if (distFromSetPath >= 4) {
      const elitePool = ['orc_warrior', 'bog_wurm', 'tristan_knight', 'bors_knight'];
      const typeC = elitePool[(chunkHash >>> 7) % elitePool.length] || 'orc_warrior';
      const typeCLabel = String(typeC || 'elite').split('_')[0].toUpperCase();
      spawns.push({
        type: typeC,
        localTileX: 5,
        localTileY: 2 + (chunkHash % 2),
        name: `Abyss-Stalker (${typeCLabel})`,
        emissiveColor: '#f43f5e',
        isAbyssElite: true,
      });
    }
  }

  return {
    title: `${template.title} [${cx},${cy}]`,
    isLandmark: false,
    isSetPath: false,
    hasDeepDungeon: false,
    grid10x9: finalizedGrid,
    spawns,
  };
}

export function getActiveChunkLandmarkLabel(state: OrionState): string | null {
  if (!isChunkedExpanseRoom(state.room)) return null;
  const { cx, cy } = getChunkCoordsFromPx(state.x, state.y);
  const bogRoom = getUnifiedBogRoomAtChunk(cx, cy);
  if (bogRoom) {
    return `${bogRoom.title} [${bogRoom.roomCoord}]`;
  }
  const corridor = SET_PATH_CORRIDOR_BY_CHUNK[`${cx},${cy}`];
  if (corridor) {
    return `${corridor.title}`;
  }
  const lm = AUTHORED_LANDMARK_CHUNKS[`${cx},${cy}`];
  if (lm) return lm.title;
  const seed = state.fogGraph?.seed || 104729;
  if (isDeepFogDungeonChunk(seed, cx, cy)) {
    return `Abyssal Fog Loop Dungeon (${cx},${cy})`;
  }
  return `Off-Path Wilds (${cx},${cy})`;
}

/**
 * Ensures the target room grid is initialized to 260×162 tiles (`162` strings of length `260`),
 * defaulting all ungenerated tiles to solid walls (`#`).
 */
export function ensureExpanseGridAllocated(
  rooms: Record<string, string[]>,
  roomId: string
): string[] {
  let grid = rooms[roomId];
  if (
    !grid ||
    grid.length !== EXPANSE_TOTAL_ROWS ||
    (grid[0]?.length || 0) !== EXPANSE_TOTAL_COLS
  ) {
    const blankRow = '#'.repeat(EXPANSE_TOTAL_COLS);
    grid = Array.from({ length: EXPANSE_TOTAL_ROWS }, () => blankRow);
    rooms[roomId] = grid;
  }
  return grid;
}

/**
 * Stitches a `10×9` chunk grid into the `260×162` room array at chunk `(cx, cy)`.
 */
function stitchChunkIntoExpanseGrid(
  roomGrid: string[],
  cx: number,
  cy: number,
  chunkGrid10x9: string[]
): void {
  const startRow = cy * CHUNK_ROWS;
  const startCol = cx * CHUNK_COLS;

  for (let r = 0; r < CHUNK_ROWS; r++) {
    const targetRowIdx = startRow + r;
    const existingRow = roomGrid[targetRowIdx] || '#'.repeat(EXPANSE_TOTAL_COLS);
    const chunkRow = String(chunkGrid10x9[r] ?? '##########')
      .padEnd(CHUNK_COLS, '#')
      .slice(0, CHUNK_COLS);
    roomGrid[targetRowIdx] =
      existingRow.slice(0, startCol) +
      chunkRow +
      existingRow.slice(startCol + CHUNK_COLS);
  }
}

/**
 * Mutates a single tile `(gx, gy)` inside the `260×162` expanse grid.
 */
export function setExpanseGridTileAt(
  roomGrid: string[],
  gx: number,
  gy: number,
  char: string
): void {
  const row = roomGrid[gy];
  if (!row || gx < 0 || gx >= row.length) return;
  roomGrid[gy] = row.slice(0, gx) + char + row.slice(gx + 1);
}

/**
 * Spawns a chunk's initial enemies when that chunk is dynamically generated for the first time,
 * scaling enemy shields, armor, frame integrity, and damage by `fogIntensity` (`distFromSetPath` + `clvl`).
 */
function spawnChunkInitialEnemies(
  state: OrionState,
  roomId: string,
  cx: number,
  cy: number,
  blueprint: ChunkBlueprint
): void {
  const canonicalRoomKey = getCanonicalRoomPersistenceKey(state, roomId);
  const startCol = cx * CHUNK_COLS;
  const startRow = cy * CHUNK_ROWS;
  const metrics = computeChunkFogMetrics(state, cx, cy);

  // Scale enemy stats by Off-Path Fog Intensity and Soft-Cap Over-Depth
  const statMult =
    metrics.distFromSetPath === 0
      ? 1.0
      : 1 + metrics.fogIntensity * 0.34 + metrics.overDepth * 0.28;
  const dmgMult =
    metrics.distFromSetPath === 0
      ? 1.0
      : 1 + metrics.fogIntensity * 0.22 + metrics.overDepth * 0.18;
  const speedMult =
    metrics.distFromSetPath === 0
      ? 1.0
      : 1 + Math.min(0.35, metrics.fogIntensity * 0.08);

  for (let i = 0; i < blueprint.spawns.length; i++) {
    const spec = blueprint.spawns[i];
    const gx = startCol + spec.localTileX;
    const gy = startRow + spec.localTileY;
    const enemySpawnKey = `${canonicalRoomKey}:chunk:${cx},${cy}:enemy:${i}:${gx},${gy}`;

    if (state.clearedRooms?.[enemySpawnKey]) {
      continue;
    }

    const def = getEnemyDefinition(spec.type);
    if (!def || def.shouldSkipSpawn?.(state)) {
      continue;
    }

    const px = gx * TILE_SIZE + 8;
    const py = gy * TILE_SIZE + 8;
    const customOverrides = def.customSpawnSetup?.(state, px, py, i);
    const isAbyssElite = Boolean(spec.isAbyssElite || metrics.isSoftCapAbyss);
    const eliteMult = spec.isDungeonGuardian ? 1.25 : isAbyssElite ? 1.15 : 1.0;

    const spawned = spawnEnemyByType(state, spec.type, px, py, {
      ...customOverrides,
      ...(spec.name ? { name: spec.name } : {}),
      ...(spec.emissiveColor ? { emissiveColor: spec.emissiveColor } : {}),
      spawnKey: enemySpawnKey,
      fogDepth: metrics.distFromSetPath,
      fogIntensity: metrics.fogIntensity,
      isAbyssElite,
      isDungeonGuardian: Boolean(spec.isDungeonGuardian),
    });

    if (spawned && metrics.distFromSetPath > 0) {
      spawned.shields.maxCapacity = Math.round(
        spawned.shields.maxCapacity * statMult * eliteMult
      );
      spawned.shields.capacity = spawned.shields.maxCapacity;
      spawned.armor.maxDurability = Math.round(
        spawned.armor.maxDurability * statMult * eliteMult
      );
      spawned.armor.durability = spawned.armor.maxDurability;
      spawned.frame.maxIntegrity = Math.round(
        spawned.frame.maxIntegrity * statMult * eliteMult
      );
      spawned.frame.integrity = spawned.frame.maxIntegrity;
      spawned.damage = Math.round(
        spawned.damage * dmgMult * (spec.isDungeonGuardian ? 1.18 : 1.0)
      );
      spawned.speed = Math.round(spawned.speed * speedMult);
    }
  }

  // Also support any ASCII enemy spawn characters embedded directly in an authored Bog room's grid
  let embeddedIndex = 0;
  for (let r = 0; r < CHUNK_ROWS; r++) {
    for (let c = 0; c < CHUNK_COLS; c++) {
      const ch = blueprint.grid10x9[r]?.[c];
      if (!ch) continue;
      const charEnemyType = resolveRoomEnemyTypeAtChar(ch, state.biomeId);
      if (!charEnemyType) continue;
      const gx = startCol + c;
      const gy = startRow + r;
      const enemySpawnKey = `${canonicalRoomKey}:enemy:${gx},${gy}`;
      if (state.clearedRooms?.[enemySpawnKey]) continue;

      const def = getEnemyDefinition(charEnemyType);
      if (!def || def.shouldSkipSpawn?.(state)) continue;

      const px = gx * TILE_SIZE + 8;
      const py = gy * TILE_SIZE + 8;
      const customOverrides = def.customSpawnSetup?.(state, px, py, embeddedIndex++);
      spawnEnemyByType(state, charEnemyType, px, py, {
        ...customOverrides,
        spawnKey: enemySpawnKey,
        fogDepth: metrics.distFromSetPath,
        fogIntensity: metrics.fogIntensity,
      });

      if (def.companionSpawnType) {
        const compKey = `${enemySpawnKey}:companion`;
        if (!state.clearedRooms?.[compKey]) {
          const compDef = getEnemyDefinition(def.companionSpawnType);
          const compOverrides = compDef?.customSpawnSetup?.(state, px + 16, py, embeddedIndex++);
          spawnEnemyByType(state, def.companionSpawnType, px + 16, py, {
            ...compOverrides,
            spawnKey: compKey,
            fogDepth: metrics.distFromSetPath,
            fogIntensity: metrics.fogIntensity,
          });
        }
      }
    }
  }
}

/**
 * Checks whether all hostile guardians in a Deep-Fog Dungeon chunk (`cx, cy`) have been defeated.
 * When cleared, unlocks fast-travel back to the player's last safe Set-Path spot and places a Waygate (`Q`).
 */
export function checkAndUnlockClearedDeepFogDungeon(
  rooms: Record<string, string[]>,
  state: OrionState,
  cx?: number,
  cy?: number
): boolean {
  if (!isChunkedExpanseRoom(state.room)) return false;
  const metrics = computeChunkFogMetrics(state, cx, cy);
  if (!metrics.hasDeepDungeon || metrics.isDeepDungeonCleared) return false;

  const remainingInChunk = state.enemies.filter((e) => {
    if (e.faction === 'poe' || e.faction === 'npc') return false;
    const eCoords = getChunkCoordsFromPx(e.x, e.y);
    return eCoords.cx === metrics.cx && eCoords.cy === metrics.cy;
  });

  if (remainingInChunk.length > 0) return false;

  state.clearedDeepFogDungeons = state.clearedDeepFogDungeons || {};
  state.clearedDeepFogDungeons[metrics.chunkKey] = true;

  const roomGrid = rooms[state.room];
  if (roomGrid) {
    const waygateGx = metrics.cx * CHUNK_COLS + 4;
    const waygateGy = metrics.cy * CHUNK_ROWS + 4;
    setExpanseGridTileAt(roomGrid, waygateGx, waygateGy, 'Q');
  }

  soundSystem.playPowerup();
  state.toastText = `ABYSSAL DUNGEON CLEARED! USE [D] FOR FOG LOOP OR [Q] TO FAST-TRAVEL TO SAFE PATH`;
  state.toastTimer = 3.2;
  notifyOrionStateChange();
  return true;
}

/**
 * Awards the Deep-Fog Dungeon clear cache (if not yet claimed) and fast-travels the pilot
 * back to `state.lastSafeChunkCoord` on the Set-Path Spine.
 */
export function fastTravelFromDeepDungeonToSafeSpot(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx?: OrionCombatContext,
  overrideDungeonChunkKey?: string
): boolean {
  const metrics = computeChunkFogMetrics(state);
  const chunkKey = overrideDungeonChunkKey || metrics.chunkKey;
  const rewardKey = `dungeon_reward:${chunkKey}`;
  state.lootedCaches = state.lootedCaches || {};

  let rewardSummary = '';
  if (!state.lootedCaches[rewardKey]) {
    state.lootedCaches[rewardKey] = true;
    const effDist = Math.max(3, metrics.distFromSetPath);
    const effMult = Math.max(1.85, metrics.lootMultiplier);
    const bonusScrap = Math.round((35 + effDist * 15) * effMult);
    state.salvageScrap += bonusScrap;

    const gemPool = resolveContextualGemPool(state);
    const gemA = gemPool[Math.floor(Math.random() * gemPool.length)] || 'moonstone';
    const gemB = gemPool[(Math.floor(Math.random() * gemPool.length) + 1) % gemPool.length] || 'rubellite';
    addOrionInventoryItem(state, gemA, 1);
    addOrionInventoryItem(state, gemB, 1);
    addOrionInventoryItem(state, 'demantoid_flask', 1);

    const droppedGear = resolveContextualEquipmentDrop(state, {
      areaId: state.areaId,
      regionId: state.regionId,
      roomCoord: getEffectiveRoomCoord(state),
      allowSecondCopy: true,
    });
    if (droppedGear) {
      unlockEquipmentItem(state, droppedGear);
      const gName = getWeaponDefinition(droppedGear)?.name || droppedGear.toUpperCase();
      rewardSummary = ` · +${bonusScrap} SCRAP, +2 GEMS & ${gName.toUpperCase()}`;
    } else {
      rewardSummary = ` · +${bonusScrap} SCRAP & +2 GEMSTONES`;
    }
  }

  // Restore frame/armor/shields and clear heat on fast-travel return
  state.frame.integrity = state.frame.maxIntegrity || 200;
  state.frame.state = 'Operational';
  state.armor.durability = state.armor.maxDurability;
  state.shields.capacity = state.shields.maxCapacity;
  state.shields.overloaded = false;
  state.heat = 0;

  const defaultStart = convertBogRoomPosToUnifiedPx('-3,0', 120, 88, 16, 12);
  const safeSpot = state.lastSafeChunkCoord || {
    roomId: SUNKEN_BOG_EXPANSE_ROOM_ID,
    cx: 3,
    cy: 9,
    x: defaultStart.x,
    y: defaultStart.y,
    title: 'Drop-Pod Impact Crater',
  };

  hibernateAllActiveExpanseEnemies(state);
  state.room = safeSpot.roomId;
  state.x = safeSpot.x;
  state.y = safeSpot.y;
  state.z = 0;
  state.vz = 0;
  state.vx = 0;
  state.vy = 0;
  state.projectiles = [];
  state.pickups = [];
  state.flickerTimer = 0.55;

  updateChunkedRoomStreaming(rooms, state, true);
  soundSystem.playPowerup();

  const msg = `FAST-TRAVEL TO SAFE PATH: ${safeSpot.title.toUpperCase()} [${safeSpot.cx},${safeSpot.cy}]${rewardSummary}`;
  if (ctx) {
    ctx.say(msg);
  } else {
    state.toastText = msg;
    state.toastTimer = 3.2;
  }
  notifyOrionStateChange();
  return true;
}

/**
 * Dynamically streams the `3×3` active chunk window around the player in the `260×162` (`26×18` chunks) Unified Bog Grid,
 * generating unvisited off-screen chunks on-demand and hibernating/waking enemies outside the `3×3` window.
 */
export function updateChunkedRoomStreaming(
  rooms: Record<string, string[]>,
  state: OrionState,
  forceRefresh: boolean = false
): void {
  if (!isChunkedExpanseRoom(state.room)) {
    state.activeChunkX = undefined;
    state.activeChunkY = undefined;
    return;
  }

  state.generatedChunks = state.generatedChunks || {};
  state.hibernatedChunkEnemies = state.hibernatedChunkEnemies || {};
  state.litChunkLanterns = state.litChunkLanterns || {};
  state.clearedDeepFogDungeons = state.clearedDeepFogDungeons || {};

  const roomGrid = ensureExpanseGridAllocated(rooms, state.room);
  const { cx: playerCx, cy: playerCy } = getChunkCoordsFromPx(state.x, state.y);
  const prevCx = state.activeChunkX;
  const prevCy = state.activeChunkY;
  const chunkChanged = forceRefresh || prevCx !== playerCx || prevCy !== playerCy;

  state.activeChunkX = playerCx;
  state.activeChunkY = playerCy;

  const seed = state.fogGraph?.seed || 104729;
  const clvl = Math.max(1, state.level || 1);

  const activeBogRoom = getUnifiedBogRoomAtChunk(playerCx, playerCy);
  const activeCorridor = SET_PATH_CORRIDOR_BY_CHUNK[`${playerCx},${playerCy}`];
  const prevBogRoom =
    prevCx !== undefined && prevCy !== undefined
      ? getUnifiedBogRoomAtChunk(prevCx, prevCy)
      : undefined;

  if (activeBogRoom) {
    state.rx = activeBogRoom.rx;
    state.ry = activeBogRoom.ry;
  }

  // Record last safe spot whenever the pilot is on the Set-Path Spine (distFromSetPath === 0)
  const currentDist = getChunkDistanceFromSetPath(playerCx, playerCy);
  if (currentDist === 0) {
    const lm = AUTHORED_LANDMARK_CHUNKS[`${playerCx},${playerCy}`];
    const safeTitle =
      activeBogRoom?.title ||
      activeCorridor?.title ||
      lm?.title ||
      `Set-Path Spine (${playerCx},${playerCy})`;
    state.lastSafeChunkCoord = {
      roomId: state.room,
      cx: playerCx,
      cy: playerCy,
      x: playerCx * CHUNK_W_PX + Math.floor(CHUNK_W_PX * 0.5),
      y: playerCy * CHUNK_H_PX + Math.floor(CHUNK_H_PX * 0.52),
      title: safeTitle,
    };
  }

  // 1. Ensure all chunks in the 3x3 active neighborhood around (playerCx, playerCy) are generated & awake
  if (chunkChanged) {
    const minCx = Math.max(0, playerCx - 1);
    const maxCx = Math.min(EXPANSE_CHUNKS_X - 1, playerCx + 1);
    const minCy = Math.max(0, playerCy - 1);
    const maxCy = Math.min(EXPANSE_CHUNKS_Y - 1, playerCy + 1);

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const chunkKey = makeChunkPersistenceKey(state.room, cx, cy);

        if (!state.generatedChunks[chunkKey]) {
          const blueprint = resolveChunkBlueprint(seed, cx, cy, clvl);
          stitchChunkIntoExpanseGrid(roomGrid, cx, cy, blueprint.grid10x9);
          state.generatedChunks[chunkKey] = true;
          spawnChunkInitialEnemies(state, state.room, cx, cy, blueprint);
        }

        if (state.clearedDeepFogDungeons[chunkKey]) {
          setExpanseGridTileAt(
            roomGrid,
            cx * CHUNK_COLS + 4,
            cy * CHUNK_ROWS + 4,
            'Q'
          );
        }

        // If gate '3,0' was unlocked, ensure 'G' tiles in chunk (22, 9) and (22, 10) are open
        if (
          (state.unlockedGates?.['3,0'] ||
            state.unlockedGates?.[state.room] ||
            state.flags?.bog_exit_revealed) &&
          cx === 22 &&
          (cy === 9 || cy === 10)
        ) {
          for (let r = 0; r < CHUNK_ROWS; r++) {
            const gy = cy * CHUNK_ROWS + r;
            const gx = cx * CHUNK_COLS + (CHUNK_COLS - 1);
            if (roomGrid[gy]?.[gx] === 'G') {
              setExpanseGridTileAt(roomGrid, gx, gy, ':');
            }
          }
        }

        const hibernated = state.hibernatedChunkEnemies[chunkKey];
        if (hibernated && hibernated.length > 0) {
          for (const sleepingEnemy of hibernated) {
            if (!state.enemies.some((e) => e.id === sleepingEnemy.id)) {
              state.enemies.push(sleepingEnemy);
            }
          }
          delete state.hibernatedChunkEnemies[chunkKey];
        }
      }
    }

    // Update room landmark subtitle, lighting, loot pool & fog warning toast when entering a new chunk
    const metrics = computeChunkFogMetrics(state, playerCx, playerCy);
    const currentLandmark = AUTHORED_LANDMARK_CHUNKS[`${playerCx},${playerCy}`];
    if (ORION_ROOM_METADATA[state.room]) {
      const authoredRoomMeta = activeBogRoom
        ? ORION_ROOM_METADATA[activeBogRoom.roomCoord]
        : undefined;
      if (authoredRoomMeta) {
        ORION_ROOM_METADATA[state.room].title = authoredRoomMeta.title;
        ORION_ROOM_METADATA[state.room].bannerTitle = authoredRoomMeta.bannerTitle;
        ORION_ROOM_METADATA[state.room].lighting = authoredRoomMeta.lighting;
        ORION_ROOM_METADATA[state.room].lootPool = authoredRoomMeta.lootPool;
      }
      ORION_ROOM_METADATA[state.room].landmarkLabel = activeBogRoom
        ? `${activeBogRoom.title.toUpperCase()} [${activeBogRoom.roomCoord}] · SET PATH [${playerCx},${playerCy}]`
        : activeCorridor
          ? `${activeCorridor.title.toUpperCase()} [${playerCx},${playerCy}]`
          : currentLandmark
            ? `${currentLandmark.title.toUpperCase()} · [${playerCx},${playerCy}]`
            : metrics.hasDeepDungeon
              ? `ABYSSAL FOG LOOP DUNGEON [${playerCx},${playerCy}] · DIST ${metrics.distFromSetPath}`
              : `OFF-PATH WILDS [${playerCx},${playerCy}] · FOG ${Math.round(metrics.fogIntensity * 100)}%`;
    }

    if (!forceRefresh && (prevCx !== playerCx || prevCy !== playerCy)) {
      if (metrics.hasDeepDungeon && !metrics.isDeepDungeonCleared) {
        state.toastText = `ABYSSAL FOG DUNGEON DISCOVERED [${playerCx},${playerCy}] · ENTER [D] FOG LOOP OR DEFEAT WARDENS`;
        state.toastTimer = 2.8;
      } else if (metrics.isSoftCapAbyss) {
        state.toastText = `WARNING: DEEP ABYSS FOG (DIST ${metrics.distFromSetPath} > SAFE ${metrics.safeDepth}) · EXTREME ELITE DENSITY`;
        state.toastTimer = 2.6;
        state.flickerTimer = Math.max(state.flickerTimer || 0, 0.35);
      } else if (activeBogRoom && activeBogRoom.roomCoord !== prevBogRoom?.roomCoord) {
        state.toastText = `${activeBogRoom.title.toUpperCase()} [NODE ${activeBogRoom.roomCoord}]`;
        state.toastTimer = 2.0;
      } else if (currentLandmark) {
        state.toastText = `${currentLandmark.title.toUpperCase()} [${playerCx},${playerCy}]`;
        state.toastTimer = 2.0;
      } else if (
        metrics.distFromSetPath === 1 &&
        prevCx !== undefined &&
        getChunkDistanceFromSetPath(prevCx, prevCy ?? playerCy) === 0
      ) {
        state.toastText = `STEPPED OFF SET PATH · FOG INTENSITY ${Math.round(metrics.fogIntensity * 100)}% (LOOT ×${metrics.lootMultiplier})`;
        state.toastTimer = 2.2;
      }
    }
  }

  // Check if the player's current chunk is a Deep-Fog Dungeon whose guardians are now all defeated
  checkAndUnlockClearedDeepFogDungeon(rooms, state, playerCx, playerCy);

  // 2. Hibernate any active enemies whose current position is outside the 3x3 chunk window
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e: EnemyEntity = state.enemies[i];
    const { cx: eCx, cy: eCy } = getChunkCoordsFromPx(e.x, e.y);
    if (Math.abs(eCx - playerCx) > 1 || Math.abs(eCy - playerCy) > 1) {
      const targetChunkKey = makeChunkPersistenceKey(state.room, eCx, eCy);
      if (!state.hibernatedChunkEnemies[targetChunkKey]) {
        state.hibernatedChunkEnemies[targetChunkKey] = [];
      }
      // Preserve exact HP/shields/armor/position and reset transient mid-swing windup
      if (e.state === 'windup') {
        e.state = 'idle';
        e.stateTimer = 0;
      }
      state.hibernatedChunkEnemies[targetChunkKey].push(e);
      if (state.lockedTargetId === e.id) {
        state.lockedTargetId = null;
      }
      state.enemies.splice(i, 1);
    }
  }
}

/**
 * Hibernates all currently active enemies in a chunked expanse room before the player warps out,
 * so returning later via the Drop Pod Waygate restores their exact HP and positions.
 */
export function hibernateAllActiveExpanseEnemies(state: OrionState): void {
  if (!isChunkedExpanseRoom(state.room)) return;
  state.hibernatedChunkEnemies = state.hibernatedChunkEnemies || {};

  for (const e of state.enemies) {
    const { cx, cy } = getChunkCoordsFromPx(e.x, e.y);
    const chunkKey = makeChunkPersistenceKey(state.room, cx, cy);
    if (!state.hibernatedChunkEnemies[chunkKey]) {
      state.hibernatedChunkEnemies[chunkKey] = [];
    }
    if (!state.hibernatedChunkEnemies[chunkKey].some((existing) => existing.id === e.id)) {
      state.hibernatedChunkEnemies[chunkKey].push(e);
    }
  }

  state.enemies = [];
  state.lockedTargetId = null;
}

