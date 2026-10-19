/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COLS, ROWS, TILE_SIZE } from '../constants';
import { BiomeDefinition, ClusterTerrainType } from '../types';
import { BASE64_ATLAS_REGISTRY, drawBase64Sprite } from './base64AssetLoader';

/**
 * Separated 3×3 Cluster & 4×5 Biome Tileset Auto-Tiler
 *
 * Supports both:
 * 1. Separated 3×3 Cluster Atlases (`48×48px` each = `3×3` of `16×16px` tiles):
 *    - Row 1 (General 9 tiles): `dirt_general`, `grass_general`, `aether_general`, `ruins_general`
 *    - Row 2 (Transfers):       `dirt_to_grass`, `grass_to_dirt`, `aether_to_dirt`, `ruins_to_dirt`
 *    - Row 3 (Transfers):       `dirt_to_aether`, `grass_to_aether`, `aether_to_grass`, `ruins_to_grass`
 *    - Row 4 (Transfers):       `dirt_to_ruins`, `grass_to_ruins`, `aether_to_ruins`, `ruins_to_aether`
 *    - Row 5 (Walls & Floors):  `dirt_walls`, `grass_walls`, `aether_walls`, `ruins_walls`
 *      - Top row (`localRow = 0`): Solid connected wall `[left, center, right]`
 *      - Middle row (`localRow = 1`): Associated floors `[left, center, right]`
 *      - Bottom row (`localRow = 2`): Left (`0`) & Right (`2`) single walls, Center (`1`) floor
 * 2. Combined 4-Column × 5-Row Atlas (`192×240px` = `12×15` tiles of `16×16px`, e.g. `ruins_tileset`)
 */

export const TERRAIN_CLUSTER_COL: Record<ClusterTerrainType, number> = {
  dirt: 0,
  grass: 1,
  aether: 2,
  ruins: 3,
};

export const GENERAL_CLUSTER_ATLAS_ID: Record<ClusterTerrainType, string> = {
  dirt: 'dirt_general',
  grass: 'grass_general',
  aether: 'aether_general',
  ruins: 'ruins_general',
};

export const WALL_CLUSTER_ATLAS_ID: Record<ClusterTerrainType, string> = {
  dirt: 'dirt_walls',
  grass: 'grass_walls',
  aether: 'aether_walls',
  ruins: 'ruins_walls',
};

/**
 * Lookup table for `from(to)` transition clusters across Rows 2, 3, and 4:
 * Includes both the separated 3×3 cluster `atlasId` and `[clusterCol, clusterRow]` in the 4×5 sheet.
 */
const TRANSITION_CLUSTER_MAP: Record<
  ClusterTerrainType,
  Partial<
    Record<
      ClusterTerrainType,
      { atlasId: string; clusterCol: number; clusterRow: number }
    >
  >
> = {
  dirt: {
    grass: { atlasId: 'dirt_to_grass', clusterCol: 0, clusterRow: 1 }, // Row 2, Col 1: dirt(grass)
    aether: { atlasId: 'dirt_to_aether', clusterCol: 0, clusterRow: 2 }, // Row 3, Col 1: dirt(aether)
    ruins: { atlasId: 'dirt_to_ruins', clusterCol: 0, clusterRow: 3 }, // Row 4, Col 1: dirt(ruins)
  },
  grass: {
    dirt: { atlasId: 'grass_to_dirt', clusterCol: 1, clusterRow: 1 }, // Row 2, Col 2: grass(dirt)
    aether: { atlasId: 'grass_to_aether', clusterCol: 1, clusterRow: 2 }, // Row 3, Col 2: grass(aether)
    ruins: { atlasId: 'grass_to_ruins', clusterCol: 1, clusterRow: 3 }, // Row 4, Col 2: grass(ruins)
  },
  aether: {
    dirt: { atlasId: 'aether_to_dirt', clusterCol: 2, clusterRow: 1 }, // Row 2, Col 3: aether(dirt)
    grass: { atlasId: 'aether_to_grass', clusterCol: 2, clusterRow: 2 }, // Row 3, Col 3: aether(grass)
    ruins: { atlasId: 'aether_to_ruins', clusterCol: 2, clusterRow: 3 }, // Row 4, Col 3: aether(ruins)
  },
  ruins: {
    dirt: { atlasId: 'ruins_to_dirt', clusterCol: 3, clusterRow: 1 }, // Row 2, Col 4: ruins(dirt)
    grass: { atlasId: 'ruins_to_grass', clusterCol: 3, clusterRow: 2 }, // Row 3, Col 4: ruins(grass)
    aether: { atlasId: 'ruins_to_aether', clusterCol: 3, clusterRow: 3 }, // Row 4, Col 4: ruins(aether)
  },
};

const TERRAIN_PRIORITY: ClusterTerrainType[] = ['aether', 'ruins', 'grass', 'dirt'];

export interface ResolvedClusterTileSlice {
  /** Separated 3x3 cluster atlas ID (e.g. 'dirt_to_grass', 'ruins_walls') */
  clusterAtlasId: string;
  /** Local column (0..2) inside the 3x3 cluster */
  localCol: number;
  /** Local row (0..2) inside the 3x3 cluster */
  localRow: number;
  /** Global column (0..11) inside the combined 4x5 cluster sheet */
  col: number;
  /** Global row (0..14) inside the combined 4x5 cluster sheet */
  row: number;
}

/**
 * Map a single explicit terrain character to its ClusterTerrainType, or null if the character
 * is a wall, chasm, doodad/prop, or enemy spawn token.
 */
export function charToExplicitTerrain(char: string | undefined): ClusterTerrainType | null {
  if (!char) return null;
  if (char === '.') return 'dirt';
  if (char === ',') return 'grass';
  if (char === '~') return 'aether';
  if (char === ':') return 'ruins';
  return null;
}

/**
 * Check if a room character is a solid perimeter/interior wall (`#`)
 */
export function isClusterSolidWallChar(char: string | undefined): boolean {
  return char === '#';
}

/**
 * Check if a room character is a standalone single wall / interior pillar (`P`)
 */
export function isClusterSingleWallChar(char: string | undefined): boolean {
  return char === 'P';
}

/**
 * Resolve the effective base terrain (`dirt`, `grass`, `aether`, `ruins`) for cell `(tx, ty)` in `room`.
 * If the cell holds a wall, doodad/prop (`L`, `C`, `D`, `A`, `Q`), or enemy spawn token, it inherits
 * the nearest neighbor's explicit floor terrain (falling back to `biome.defaultClusterTerrain` or `'dirt'`).
 */
export function resolveRoomBaseTerrain(
  room: string[],
  tx: number,
  ty: number,
  biome: BiomeDefinition
): ClusterTerrainType {
  const clampedX = Math.max(0, Math.min(COLS - 1, tx));
  const clampedY = Math.max(0, Math.min(ROWS - 1, ty));
  const rawChar = room[clampedY]?.[clampedX];

  const direct = charToExplicitTerrain(rawChar);
  if (direct) return direct;

  // Inspect cardinal neighbors first, then diagonal neighbors
  const offsets: Array<[number, number]> = [
    [0, 1],
    [0, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ];

  for (const [dx, dy] of offsets) {
    const nx = clampedX + dx;
    const ny = clampedY + dy;
    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
      const neighborTerrain = charToExplicitTerrain(room[ny]?.[nx]);
      if (neighborTerrain) {
        return neighborTerrain;
      }
    }
  }

  return biome.defaultClusterTerrain || 'dirt';
}

/**
 * Deterministic spatial hash in `0..8` for selecting among the 9 general tiles in Row 1 (Cluster Row 0).
 */
function hashGeneralTileOffset(tx: number, ty: number): { localCol: number; localRow: number } {
  const h = Math.abs((tx * 73856093) ^ (ty * 19349663) ^ ((tx + 3) * (ty + 7) * 83492791)) % 9;
  return {
    localCol: h % 3,
    localRow: Math.floor(h / 3),
  };
}

/**
 * Resolve the Layer 0 separated 3×3 cluster slice AND 4×5 sheet coordinate for `(tx, ty)`.
 */
export function resolveClusterLayer0Coord(
  room: string[],
  tx: number,
  ty: number,
  biome: BiomeDefinition
): ResolvedClusterTileSlice | null {
  const char = room[ty]?.[tx] || '.';

  // Open chasms/sinkholes ('_') use their abyssal void renderer on Layer 0
  if (char === '_') return null;

  const fromTerrain = resolveRoomBaseTerrain(room, tx, ty, biome);
  const baseClusterCol = TERRAIN_CLUSTER_COL[fromTerrain];

  // If this cell is a Wall ('#') or Single Pillar ('P'), draw the associated floor from Row 5 (clusterRow = 4, localRow = 1)
  if (isClusterSolidWallChar(char) || isClusterSingleWallChar(char)) {
    const floorLocalCol = (tx + ty) % 3;
    const floorLocalRow = 1;
    return {
      clusterAtlasId: WALL_CLUSTER_ATLAS_ID[fromTerrain],
      localCol: floorLocalCol,
      localRow: floorLocalRow,
      col: baseClusterCol * 3 + floorLocalCol,
      row: 4 * 3 + floorLocalRow,
    };
  }

  const nTerrain = ty > 0 ? resolveRoomBaseTerrain(room, tx, ty - 1, biome) : fromTerrain;
  const sTerrain = ty < ROWS - 1 ? resolveRoomBaseTerrain(room, tx, ty + 1, biome) : fromTerrain;
  const wTerrain = tx > 0 ? resolveRoomBaseTerrain(room, tx - 1, ty, biome) : fromTerrain;
  const eTerrain = tx < COLS - 1 ? resolveRoomBaseTerrain(room, tx + 1, ty, biome) : fromTerrain;
  const nwTerrain =
    tx > 0 && ty > 0 ? resolveRoomBaseTerrain(room, tx - 1, ty - 1, biome) : fromTerrain;
  const neTerrain =
    tx < COLS - 1 && ty > 0 ? resolveRoomBaseTerrain(room, tx + 1, ty - 1, biome) : fromTerrain;
  const swTerrain =
    tx > 0 && ty < ROWS - 1 ? resolveRoomBaseTerrain(room, tx - 1, ty + 1, biome) : fromTerrain;
  const seTerrain =
    tx < COLS - 1 && ty < ROWS - 1
      ? resolveRoomBaseTerrain(room, tx + 1, ty + 1, biome)
      : fromTerrain;

  // Check if any neighbor in the 8-neighborhood has a different terrain `toTerrain`
  let targetToTerrain: ClusterTerrainType | null = null;
  for (const candidate of TERRAIN_PRIORITY) {
    if (candidate === fromTerrain) continue;
    if (
      nTerrain === candidate ||
      sTerrain === candidate ||
      wTerrain === candidate ||
      eTerrain === candidate ||
      nwTerrain === candidate ||
      neTerrain === candidate ||
      swTerrain === candidate ||
      seTerrain === candidate
    ) {
      targetToTerrain = candidate;
      break;
    }
  }

  if (targetToTerrain) {
    const cluster = TRANSITION_CLUSTER_MAP[fromTerrain]?.[targetToTerrain];
    if (cluster) {
      const n = nTerrain === targetToTerrain;
      const s = sTerrain === targetToTerrain;
      const w = wTerrain === targetToTerrain;
      const e = eTerrain === targetToTerrain;
      const nw = nwTerrain === targetToTerrain;
      const ne = neTerrain === targetToTerrain;
      const sw = swTerrain === targetToTerrain;
      const se = seTerrain === targetToTerrain;

      let localCol = 1;
      let localRow = 1;

      if ((n && w) || (!n && !s && !w && !e && nw)) {
        localCol = 0;
        localRow = 0;
      } else if ((n && e) || (!n && !s && !w && !e && ne)) {
        localCol = 2;
        localRow = 0;
      } else if ((s && w) || (!n && !s && !w && !e && sw)) {
        localCol = 0;
        localRow = 2;
      } else if ((s && e) || (!n && !s && !w && !e && se)) {
        localCol = 2;
        localRow = 2;
      } else if (n) {
        localCol = 1;
        localRow = 0;
      } else if (s) {
        localCol = 1;
        localRow = 2;
      } else if (w) {
        localCol = 0;
        localRow = 1;
      } else if (e) {
        localCol = 2;
        localRow = 1;
      }

      return {
        clusterAtlasId: cluster.atlasId,
        localCol,
        localRow,
        col: cluster.clusterCol * 3 + localCol,
        row: cluster.clusterRow * 3 + localRow,
      };
    }
  }

  // No transition: pick deterministically from the 9 general tiles in Row 1 (Cluster Row 0)
  const { localCol, localRow } = hashGeneralTileOffset(tx, ty);
  return {
    clusterAtlasId: GENERAL_CLUSTER_ATLAS_ID[fromTerrain],
    localCol,
    localRow,
    col: baseClusterCol * 3 + localCol,
    row: localRow,
  };
}

/**
 * Resolve the Row 5 (`clusterRow = 4`, tile rows `12..14`) wall or single-wall tile coordinate
 * for `#` (solid wall) or `P` (single wall / interior pillar).
 * - Top row of cluster (`localRow = 0`): Solid connected wall `[left, center, right]`
 * - Bottom row left (`localRow = 2, localCol = 0`) & right (`localRow = 2, localCol = 2`): Single walls
 */
export function resolveClusterWallCoord(
  room: string[],
  tx: number,
  ty: number,
  biome: BiomeDefinition
): ResolvedClusterTileSlice | null {
  const char = room[ty]?.[tx] || '.';
  const isWall = isClusterSolidWallChar(char);
  const isSinglePillar = isClusterSingleWallChar(char);

  if (!isWall && !isSinglePillar) return null;

  const terrain = resolveRoomBaseTerrain(room, tx, ty, biome);
  const clusterCol = TERRAIN_CLUSTER_COL[terrain];
  const baseRow = 4 * 3; // Row 5 (Cluster Row 4 -> tile rows 12..14)
  const wallAtlasId = WALL_CLUSTER_ATLAS_ID[terrain];

  if (isSinglePillar) {
    // Bottom row left (0) or right (2) single wall tile
    const singleLocalCol = (tx + ty) % 2 === 0 ? 0 : 2;
    return {
      clusterAtlasId: wallAtlasId,
      localCol: singleLocalCol,
      localRow: 2,
      col: clusterCol * 3 + singleLocalCol,
      row: baseRow + 2,
    };
  }

  const leftChar = tx > 0 ? room[ty]?.[tx - 1] : '#';
  const rightChar = tx < COLS - 1 ? room[ty]?.[tx + 1] : '#';
  const hasLeftWall = isClusterSolidWallChar(leftChar);
  const hasRightWall = isClusterSolidWallChar(rightChar);

  // Isolated single-tile '#' wall uses bottom-left or bottom-right single wall in Row 5
  if (!hasLeftWall && !hasRightWall) {
    const singleLocalCol = (tx + ty) % 2 === 0 ? 0 : 2;
    return {
      clusterAtlasId: wallAtlasId,
      localCol: singleLocalCol,
      localRow: 2,
      col: clusterCol * 3 + singleLocalCol,
      row: baseRow + 2,
    };
  }

  // Connected solid wall span uses top row (localRow = 0) of Row 5
  let localCol = 1;
  if (!hasLeftWall && hasRightWall) {
    localCol = 0; // Left wall cap
  } else if (hasLeftWall && !hasRightWall) {
    localCol = 2; // Right wall cap
  } else {
    localCol = 1; // Continuous center wall
  }

  return {
    clusterAtlasId: wallAtlasId,
    localCol,
    localRow: 0,
    col: clusterCol * 3 + localCol,
    row: baseRow + 0,
  };
}

/**
 * Draw a Layer 0 ground/transition tile from the separated 3×3 Cluster Atlas (or combined 4×5 sheet).
 */
export function drawClusterBiomeLayer0(
  g: CanvasRenderingContext2D,
  room: string[],
  biome: BiomeDefinition,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
  timeSec: number = 0
): boolean {
  if (!biome.clusterTileSheetBase64) return false;
  const slice = resolveClusterLayer0Coord(room, tx, ty, biome);
  if (!slice) return false;

  const cellSize = biome.tileSheetCellSize || TILE_SIZE;

  // Prefer the separated 3x3 cluster atlas if registered (localCol 0..2, localRow 0..2)
  if (BASE64_ATLAS_REGISTRY[slice.clusterAtlasId]) {
    const drewSeparated = drawBase64Sprite(
      g,
      {
        base64: slice.clusterAtlasId,
        cellWidth: cellSize,
        cellHeight: cellSize,
        col: slice.localCol,
        row: slice.localRow,
        renderWidth: TILE_SIZE,
        renderHeight: TILE_SIZE,
        anchor: 'top-left',
      },
      sx,
      sy,
      timeSec
    );
    if (drewSeparated) return true;
  }

  return drawBase64Sprite(
    g,
    {
      base64: biome.clusterTileSheetBase64,
      cellWidth: cellSize,
      cellHeight: cellSize,
      col: slice.col,
      row: slice.row,
      renderWidth: TILE_SIZE,
      renderHeight: TILE_SIZE,
      anchor: 'top-left',
    },
    sx,
    sy,
    timeSec
  );
}

/**
 * Draw a Row 5 solid wall (`#`) or single-wall pillar (`P`) from the separated 3×3 Wall Cluster Atlas (or combined 4×5 sheet).
 */
export function drawClusterBiomeWall(
  g: CanvasRenderingContext2D,
  room: string[],
  biome: BiomeDefinition,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
  timeSec: number = 0
): boolean {
  if (!biome.clusterTileSheetBase64) return false;
  const slice = resolveClusterWallCoord(room, tx, ty, biome);
  if (!slice) return false;

  const cellSize = biome.tileSheetCellSize || TILE_SIZE;

  // Prefer the separated 3x3 wall cluster atlas if registered (localCol 0..2, localRow 0..2)
  if (BASE64_ATLAS_REGISTRY[slice.clusterAtlasId]) {
    const drewSeparated = drawBase64Sprite(
      g,
      {
        base64: slice.clusterAtlasId,
        cellWidth: cellSize,
        cellHeight: cellSize,
        col: slice.localCol,
        row: slice.localRow,
        renderWidth: TILE_SIZE,
        renderHeight: TILE_SIZE,
        anchor: 'top-left',
      },
      sx,
      sy,
      timeSec
    );
    if (drewSeparated) return true;
  }

  return drawBase64Sprite(
    g,
    {
      base64: biome.clusterTileSheetBase64,
      cellWidth: cellSize,
      cellHeight: cellSize,
      col: slice.col,
      row: slice.row,
      renderWidth: TILE_SIZE,
      renderHeight: TILE_SIZE,
      anchor: 'top-left',
    },
    sx,
    sy,
    timeSec
  );
}
