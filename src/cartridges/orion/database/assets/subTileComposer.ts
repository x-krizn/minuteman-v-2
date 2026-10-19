/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClusterTerrainType } from '../../types';
import { Base64AtlasDefinition, registerCanvasAtlas } from './base64AssetLoader';

/**
 * Sub-Tile Micro-Composer (`4×4` of `4×4px` Micro-Blocks & `2×2` of `8×8px` Quadrants)
 *
 * Rather than hardcoding 180 full `16×16px` PNG tiles (>60 KB of Base64 strings),
 * this composer takes compact micro-tile seeds:
 *  - `4×4` mode (`4×4px` micro-blocks arranged in a `4×4` sub-grid = `16×16px` tile)
 *    for organic terrains (`dirt`, `grass`, `aether`) and stepped `from(to)` transitions.
 *  - `2×2` mode (`8×8px` quadrants `TL`, `TR`, `BL`, `BR` = `16×16px` tile)
 *    for architectural masonry (`ruins`), connected `Row 5` walls, and single pillars (`P`).
 *
 * At startup, all 20 `3×3` clusters (`48×48px` each) and the combined `192×240px`
 * `ruins_tileset` sheet are baked once into offscreen `HTMLCanvasElement` atlases
 * for zero-allocation 60fps rendering.
 */

export type RGB = [number, number, number];

export interface TerrainMicroSeed {
  terrain: ClusterTerrainType;
  /** Composition granularity: '4x4' (sixteen 4x4px micro-blocks) or '2x2' (four 8x8px quadrants) */
  mode: '4x4' | '2x2';
  palette: {
    base: RGB;
    dark: RGB;
    mid: RGB;
    light: RGB;
    edge: RGB;
    wallTop: RGB;
    wallFront: RGB;
    wallBrick: RGB;
    wallMortar: RGB;
  };
  /**
   * Four 4x4px micro-block pattern templates (each string is 4 rows of 4 chars:
   * '.' = base, 'd' = dark, 'm' = mid, 'l' = light, 'e' = edge).
   * Permuted and rotated/flipped across the 4x4 sub-grid of a 16x16 tile!
   */
  microBlocks4x4: [string[], string[], string[], string[]];
  /**
   * Four 8x8px quadrant templates [TL, TR, BL, BR] (each is 8 rows of 8 chars)
   * used when `mode === '2x2'` (or when assembling architectural flagstones & walls).
   */
  quadrants8x8?: [string[], string[], string[], string[]];
}

export const TERRAIN_MICRO_SEEDS: Record<ClusterTerrainType, TerrainMicroSeed> = {
  dirt: {
    terrain: 'dirt',
    mode: '4x4',
    palette: {
      base: [64, 48, 34],
      dark: [41, 31, 22],
      mid: [78, 58, 41],
      light: [96, 73, 52],
      edge: [30, 22, 16],
      wallTop: [96, 73, 52],
      wallFront: [54, 40, 28],
      wallBrick: [74, 55, 39],
      wallMortar: [32, 24, 17],
    },
    microBlocks4x4: [
      ['.m..', 'd..m', '..l.', '.d..'],
      ['m..d', '..l.', '.d.m', '...d'],
      ['.d..', '..m.', 'l..d', '.m..'],
      ['..d.', 'm...', '.ll.', 'd.m.'],
    ],
  },
  grass: {
    terrain: 'grass',
    mode: '4x4',
    palette: {
      base: [90, 105, 60],
      dark: [50, 62, 32],
      mid: [67, 79, 45],
      light: [123, 144, 81],
      edge: [38, 46, 24],
      wallTop: [108, 128, 72],
      wallFront: [58, 70, 38],
      wallBrick: [78, 92, 52],
      wallMortar: [36, 44, 24],
    },
    microBlocks4x4: [
      ['.l.m', 'm.l.', '.d.m', 'd...'],
      ['l.m.', '.l.d', 'm...', '.d.l'],
      ['.m.l', 'l.m.', '.d..', 'm.d.'],
      ['..l.', '.l.m', 'd.m.', '.d..'],
    ],
  },
  aether: {
    terrain: 'aether',
    mode: '4x4',
    palette: {
      base: [80, 41, 102],
      dark: [56, 30, 71],
      mid: [104, 48, 114],
      light: [168, 78, 148],
      edge: [38, 18, 52],
      wallTop: [133, 57, 105],
      wallFront: [64, 32, 82],
      wallBrick: [92, 44, 112],
      wallMortar: [36, 18, 48],
    },
    microBlocks4x4: [
      ['.m.l', 'd.m.', '..d.', 'm..d'],
      ['m.l.', '.m..', 'd..l', '.d.m'],
      ['..m.', 'l.m.', '.d..', 'd.m.'],
      ['.d.m', 'm..l', '.l.d', '..m.'],
    ],
  },
  ruins: {
    terrain: 'ruins',
    mode: '2x2',
    palette: {
      base: [200, 185, 128],
      dark: [136, 116, 75],
      mid: [172, 160, 128],
      light: [242, 224, 172],
      edge: [92, 78, 50],
      wallTop: [232, 214, 162],
      wallFront: [150, 128, 75],
      wallBrick: [184, 166, 114],
      wallMortar: [96, 80, 48],
    },
    microBlocks4x4: [
      ['eddd', 'dlll', 'dl..', 'dl.m'],
      ['ddde', 'lllm', '..m.', '.mm.'],
      ['dl..', 'dlm.', 'dlmm', 'eddd'],
      ['..m.', '.d..', 'mmmd', 'ddde'],
    ],
    quadrants8x8: [
      // TL 8x8 quadrant (chiseled flagstone course)
      [
        'eddddddd',
        'dlllllll',
        'dl....m.',
        'dl..d...',
        'dl.....m',
        'dl.m....',
        'dl....d.',
        'dmmmmmmm',
      ],
      // TR 8x8 quadrant
      [
        'ddddddde',
        'lllllllm',
        '....m..m',
        '.m.....m',
        '....d..m',
        '..l....m',
        '.....m.m',
        'mmmmmmme',
      ],
      // BL 8x8 quadrant (offset masonry course)
      [
        'ddddeddd',
        'lllldlll',
        '..m.dl..',
        '....dl.m',
        '.d..dl..',
        '....dl..',
        '..m.dl.m',
        'mmmmemmm',
      ],
      // BR 8x8 quadrant
      [
        'dddedddd',
        'llldllll',
        '.m.dl...',
        '...dl.d.',
        '...dl...',
        '.l.dl..m',
        '...dl...',
        'mmmemmmm',
      ],
    ],
  },
};

function hash2D(x: number, y: number, seed: number = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % 1000;
}

function tokenToRgb(token: string, pal: TerrainMicroSeed['palette']): RGB {
  if (token === 'd') return pal.dark;
  if (token === 'm') return pal.mid;
  if (token === 'l') return pal.light;
  if (token === 'e') return pal.edge;
  return pal.base;
}

/**
 * Sample a pixel `(lx, ly)` in `0..15` for tile `(tc, tr)` using either:
 * - `4×4` of `4×4px` Micro-Blocks (with deterministic rotation/mirroring per 4x4 sub-block), or
 * - `2×2` of `8×8px` Quadrants (with subtle per-quadrant permutation & grain).
 */
export function sampleSubTilePixel(
  terrain: ClusterTerrainType,
  tc: number,
  tr: number,
  lx: number,
  ly: number
): RGB {
  const seed = TERRAIN_MICRO_SEEDS[terrain];
  const pal = seed.palette;

  if (seed.mode === '2x2' && seed.quadrants8x8) {
    // 2x2 of 8x8px Quadrants
    const qx = lx >> 3; // 0 or 1
    const qy = ly >> 3; // 0 or 1
    const baseQuadIdx = qy * 2 + qx;
    // Permute interior details slightly across the 9 tiles of a 3x3 cluster
    const quadVariant = (baseQuadIdx + ((tc + tr * 2) % 2 === 1 && qy === 1 ? 0 : 0)) % 4;
    const quad = seed.quadrants8x8[quadVariant];
    const inX = lx & 7;
    const inY = ly & 7;
    const tok = quad[inY]?.[inX] || '.';
    // Add subtle weathering variation on '.' base pixels
    if (tok === '.') {
      const h = hash2D(tc * 16 + lx, tr * 16 + ly, 41);
      if (h < 85) return pal.dark;
      if (h < 220) return pal.mid;
      if (h > 920) return pal.light;
    }
    return tokenToRgb(tok, pal);
  }

  // 4x4 of 4x4px Micro-Blocks:
  // A 16x16 tile consists of 4x4 micro-blocks, each 4x4 pixels
  const bx = lx >> 2; // 0..3
  const by = ly >> 2; // 0..3
  const blockHash = hash2D(tc * 4 + bx, tr * 4 + by, terrain.charCodeAt(0));
  const blockIdx = blockHash % 4;
  const rot = (blockHash >> 2) % 4;

  let mx = lx & 3;
  let my = ly & 3;
  if (rot === 1) {
    const tmp = mx;
    mx = 3 - my;
    my = tmp;
  } else if (rot === 2) {
    mx = 3 - mx;
    my = 3 - my;
  } else if (rot === 3) {
    const tmp = mx;
    mx = my;
    my = 3 - tmp;
  }

  const block = seed.microBlocks4x4[blockIdx];
  const tok = block[my]?.[mx] || '.';
  return tokenToRgb(tok, pal);
}

/**
 * Sample a `from(to)` transition pixel `(lx, ly)` in `0..15` for cluster cell `(tc, tr)` in `0..2`.
 * Uses `4×4px` micro-block boundary substitution + organic 1px contour dithering so the outer 8 tiles
 * of the 3×3 cluster seamlessly transition from `fromTerrain` to `toTerrain`.
 */
function sampleTransitionSubTilePixel(
  fromTerrain: ClusterTerrainType,
  toTerrain: ClusterTerrainType,
  tc: number,
  tr: number,
  lx: number,
  ly: number
): RGB {
  if (tc === 1 && tr === 1) {
    return sampleSubTilePixel(fromTerrain, tc, tr, lx, ly);
  }

  const hasN = tr === 0;
  const hasS = tr === 2;
  const hasW = tc === 0;
  const hasE = tc === 2;

  // Sub-tile 4x4px micro-block coordinates (0..3, 0..3) + 1px organic jitter
  const jitter = (hash2D(tc * 16 + lx, tr * 16 + ly, 77) % 3) - 1;
  const distN = ly + jitter;
  const distS = 15 - ly + jitter;
  const distW = lx + jitter;
  const distE = 15 - lx + jitter;
  const threshold = 5; // 1 micro-block (4px) + 1px organic fringe

  let useTo = false;
  let isBorder = false;

  if (hasN && hasW) {
    useTo = (ly < threshold || lx < threshold) && lx + ly < 14 + jitter;
    isBorder = !useTo && (ly < threshold + 1 || lx < threshold + 1) && lx + ly < 16 + jitter;
  } else if (hasN && hasE) {
    const rx = 15 - lx;
    useTo = (ly < threshold || rx < threshold) && rx + ly < 14 + jitter;
    isBorder = !useTo && (ly < threshold + 1 || rx < threshold + 1) && rx + ly < 16 + jitter;
  } else if (hasS && hasW) {
    const ry = 15 - ly;
    useTo = (ry < threshold || lx < threshold) && lx + ry < 14 + jitter;
    isBorder = !useTo && (ry < threshold + 1 || lx < threshold + 1) && lx + ry < 16 + jitter;
  } else if (hasS && hasE) {
    const rx = 15 - lx;
    const ry = 15 - ly;
    useTo = (ry < threshold || rx < threshold) && rx + ry < 14 + jitter;
    isBorder = !useTo && (ry < threshold + 1 || rx < threshold + 1) && rx + ry < 16 + jitter;
  } else if (hasN) {
    useTo = distN < threshold;
    isBorder = distN === threshold;
  } else if (hasS) {
    useTo = distS < threshold;
    isBorder = distS === threshold;
  } else if (hasW) {
    useTo = distW < threshold;
    isBorder = distW === threshold;
  } else if (hasE) {
    useTo = distE < threshold;
    isBorder = distE === threshold;
  }

  if (useTo) {
    return sampleSubTilePixel(toTerrain, tc, tr, lx, ly);
  }
  if (isBorder) {
    return TERRAIN_MICRO_SEEDS[toTerrain].palette.edge;
  }
  return sampleSubTilePixel(fromTerrain, tc, tr, lx, ly);
}

/**
 * Sample a Row 5 Wall & Associated Floor pixel `(lx, ly)` in `0..15` for cluster cell `(tc, tr)` in `0..2`:
 * - `tr = 0`: Solid connected 2.5D wall `[left cap, center wall, right cap]` assembled from 8x8 quadrants
 * - `tr = 1`: Associated floor tiles `[left, center, right]` with top wall shadow
 * - `tr = 2`: Left (`tc=0`) & Right (`tc=2`) single 16x16 walls (`2x2` of `8x8` quadrants), Center (`tc=1`) floor
 */
function sampleWallSubTilePixel(
  terrain: ClusterTerrainType,
  tc: number,
  tr: number,
  lx: number,
  ly: number
): RGB {
  const p = TERRAIN_MICRO_SEEDS[terrain].palette;
  let rgb = sampleSubTilePixel(terrain, tc, tr, lx, ly);

  if (tr === 0) {
    const isLeftEdge = tc === 0 && lx === 0;
    const isRightEdge = tc === 2 && lx === 15;
    if (isLeftEdge || isRightEdge || ly === 0 || ly === 15) {
      return p.wallMortar;
    }
    if (ly <= 4) {
      if ((lx + tc * 16) % 8 === 0 && ly > 1) return p.wallMortar;
      return ly === 1 || (tc === 0 && lx === 1) ? p.light : p.wallTop;
    }
    if (ly === 5) return p.wallMortar;

    const course = Math.floor((ly - 6) / 3);
    const isMortarRow = (ly - 6) % 3 === 2;
    const isMortarCol = (lx + course * 4) % 8 === 0;
    if (isMortarRow || isMortarCol) return p.wallMortar;
    return course % 2 === 0 ? p.wallBrick : p.wallFront;
  }

  if (tr === 1) {
    if (ly < 2) {
      return [
        Math.max(0, rgb[0] - 22),
        Math.max(0, rgb[1] - 22),
        Math.max(0, rgb[2] - 22),
      ];
    }
    return rgb;
  }

  // tr === 2: Left (tc=0) and Right (tc=2) are 16x16 Single Walls / Pillars; Center (tc=1) is floor
  if (tc === 0 || tc === 2) {
    if (lx >= 2 && lx <= 13 && ly >= 1 && ly <= 14) {
      if (lx === 2 || lx === 13 || ly === 1 || ly === 14) return p.wallMortar;
      if (ly <= 4) return ly === 2 || lx === 3 ? p.light : p.wallTop;
      if (ly === 5) return p.wallMortar;
      const isMortar = ly === 9 || ly === 12 || lx === 7;
      return isMortar ? p.wallMortar : ly < 9 ? p.wallBrick : p.wallFront;
    }
    if (lx >= 1 && lx <= 14 && ly === 15) {
      return p.edge;
    }
  }
  return rgb;
}

function createOffscreenClusterCanvas(
  pixelSampler: (tc: number, tr: number, lx: number, ly: number) => RGB
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(48, 48);
  const data = imgData.data;

  for (let tr = 0; tr < 3; tr++) {
    for (let tc = 0; tc < 3; tc++) {
      for (let ly = 0; ly < 16; ly++) {
        for (let lx = 0; lx < 16; lx++) {
          const rgb = pixelSampler(tc, tr, lx, ly);
          const px = tc * 16 + lx;
          const py = tr * 16 + ly;
          const idx = (py * 48 + px) * 4;
          data[idx] = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
          data[idx + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export interface BakedBiomeClusterCatalog {
  atlases: Base64AtlasDefinition[];
  masterAtlas: Base64AtlasDefinition;
}

let cachedCatalog: BakedBiomeClusterCatalog | null = null;

/**
 * Bake all 20 separated `3×3` cluster atlases (`48×48px`) and the combined `192×240px`
 * `ruins_tileset` once into offscreen canvases and register them in `BASE64_ATLAS_REGISTRY`.
 */
export function bakeBiomeClusterTileset(): BakedBiomeClusterCatalog {
  if (cachedCatalog) return cachedCatalog;

  const clusterSpecs: Array<{
    id: string;
    cCol: number;
    cRow: number;
    sampler: (tc: number, tr: number, lx: number, ly: number) => RGB;
  }> = [
    // Row 1 (cRow = 0): General 3x3 clusters (no transitions)
    { id: 'dirt_general', cCol: 0, cRow: 0, sampler: (tc, tr, lx, ly) => sampleSubTilePixel('dirt', tc, tr, lx, ly) },
    { id: 'grass_general', cCol: 1, cRow: 0, sampler: (tc, tr, lx, ly) => sampleSubTilePixel('grass', tc, tr, lx, ly) },
    { id: 'aether_general', cCol: 2, cRow: 0, sampler: (tc, tr, lx, ly) => sampleSubTilePixel('aether', tc, tr, lx, ly) },
    { id: 'ruins_general', cCol: 3, cRow: 0, sampler: (tc, tr, lx, ly) => sampleSubTilePixel('ruins', tc, tr, lx, ly) },

    // Row 2 (cRow = 1): dirt(grass), grass(dirt), aether(dirt), ruins(dirt)
    { id: 'dirt_to_grass', cCol: 0, cRow: 1, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('dirt', 'grass', tc, tr, lx, ly) },
    { id: 'grass_to_dirt', cCol: 1, cRow: 1, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('grass', 'dirt', tc, tr, lx, ly) },
    { id: 'aether_to_dirt', cCol: 2, cRow: 1, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('aether', 'dirt', tc, tr, lx, ly) },
    { id: 'ruins_to_dirt', cCol: 3, cRow: 1, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('ruins', 'dirt', tc, tr, lx, ly) },

    // Row 3 (cRow = 2): dirt(aether), grass(aether), aether(grass), ruins(grass)
    { id: 'dirt_to_aether', cCol: 0, cRow: 2, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('dirt', 'aether', tc, tr, lx, ly) },
    { id: 'grass_to_aether', cCol: 1, cRow: 2, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('grass', 'aether', tc, tr, lx, ly) },
    { id: 'aether_to_grass', cCol: 2, cRow: 2, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('aether', 'grass', tc, tr, lx, ly) },
    { id: 'ruins_to_grass', cCol: 3, cRow: 2, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('ruins', 'grass', tc, tr, lx, ly) },

    // Row 4 (cRow = 3): dirt(ruins), grass(ruins), aether(ruins), ruins(aether)
    { id: 'dirt_to_ruins', cCol: 0, cRow: 3, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('dirt', 'ruins', tc, tr, lx, ly) },
    { id: 'grass_to_ruins', cCol: 1, cRow: 3, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('grass', 'ruins', tc, tr, lx, ly) },
    { id: 'aether_to_ruins', cCol: 2, cRow: 3, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('aether', 'ruins', tc, tr, lx, ly) },
    { id: 'ruins_to_aether', cCol: 3, cRow: 3, sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('ruins', 'aether', tc, tr, lx, ly) },

    // Row 5 (cRow = 4): Walls & associated floors
    { id: 'dirt_walls', cCol: 0, cRow: 4, sampler: (tc, tr, lx, ly) => sampleWallSubTilePixel('dirt', tc, tr, lx, ly) },
    { id: 'grass_walls', cCol: 1, cRow: 4, sampler: (tc, tr, lx, ly) => sampleWallSubTilePixel('grass', tc, tr, lx, ly) },
    { id: 'aether_walls', cCol: 2, cRow: 4, sampler: (tc, tr, lx, ly) => sampleWallSubTilePixel('aether', tc, tr, lx, ly) },
    { id: 'ruins_walls', cCol: 3, cRow: 4, sampler: (tc, tr, lx, ly) => sampleWallSubTilePixel('ruins', tc, tr, lx, ly) },
  ];

  const masterCanvas =
    typeof document !== 'undefined' ? document.createElement('canvas') : undefined;
  let masterCtx: CanvasRenderingContext2D | null = null;
  if (masterCanvas) {
    masterCanvas.width = 192;
    masterCanvas.height = 240;
    masterCtx = masterCanvas.getContext('2d');
  }

  const atlases: Base64AtlasDefinition[] = [];

  for (const spec of clusterSpecs) {
    const clusterCanvas = createOffscreenClusterCanvas(spec.sampler) || undefined;
    if (clusterCanvas) {
      registerCanvasAtlas(spec.id, clusterCanvas, 16, 16, `${spec.id} (3x3 Sub-Tile Cluster)`);
      if (masterCtx) {
        masterCtx.drawImage(clusterCanvas, spec.cCol * 48, spec.cRow * 48);
      }
    }
    atlases.push({
      id: spec.id,
      name: `${spec.id} (3x3 Sub-Tile Cluster)`,
      base64: spec.id,
      cellWidth: 16,
      cellHeight: 16,
      canvas: clusterCanvas,
    });
  }

  if (masterCanvas) {
    registerCanvasAtlas(
      'ruins_tileset',
      masterCanvas,
      16,
      16,
      'Ruins 4x5 Cluster Biome Tileset (Baked from 4x4 & 2x2 Sub-Tiles)'
    );
  }

  const masterAtlas: Base64AtlasDefinition = {
    id: 'ruins_tileset',
    name: 'Ruins 4x5 Cluster Biome Tileset (Baked from 4x4 & 2x2 Sub-Tiles)',
    base64: 'ruins_tileset',
    cellWidth: 16,
    cellHeight: 16,
    canvas: masterCanvas,
  };

  cachedCatalog = { atlases, masterAtlas };
  return cachedCatalog;
}
