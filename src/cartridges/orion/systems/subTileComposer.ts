/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClusterTerrainType } from '../types';
import { Base64AtlasDefinition, registerCanvasAtlas } from './base64AssetLoader';

/**
 * Sub-Tile Micro-Composer (`4×4` of `4×4px` Micro-Blocks & `2×2` of `8×8px` Quadrants)
 *
 * Takes the 4 compact `16×16px` base tiles (`dirt01`, `grass01`, `aether01`, `ruins01`):
 *  - Slices each `16×16px` base tile into **sixteen `4×4px` micro-blocks** (`4×4` groups of `4px`)
 *    and **four `8×8px` quadrants** (`2×2` groups of `8px`).
 *  - Rearranges the `4×4px` micro-blocks (`dirt`, `grass`, `aether`) and `8×8px` quadrants (`ruins`
 *    and `Row 5` walls/single pillars) to synthesize all 20 separated `3×3` clusters (`48×48px` each)
 *    plus the combined `192×240px` `ruins_tileset` sheet on offscreen canvases at startup.
 *  - If any of the 4 Base64 PNG strings (`dirt01`, `grass01`, `aether01`, `ruins01`) are edited,
 *    their `HTMLImageElement`s automatically re-bake the offscreen canvas cache in-place.
 */

export type RGB = [number, number, number];

export interface BasicFourTilesInput {
  dirt01: string;
  grass01: string;
  aether01: string;
  ruins01: string;
}

export interface TerrainMicroSeed {
  terrain: ClusterTerrainType;
  /** Sub-tile rearrangement mode: '4x4' (sixteen 4x4px groups) or '2x2' (four 8x8px quadrants) */
  mode: '4x4' | '2x2';
  /** Exact palette colors extracted from the 16x16 base tile (`dirt01`, `grass01`, `aether01`, `ruins01`) */
  palette: RGB[];
  /** Border/lip contour color and Row 5 wall shading derived from the base tile */
  wallShading: {
    edge: RGB;
    wallTop: RGB;
    wallFront: RGB;
    wallBrick: RGB;
    wallMortar: RGB;
    highlight: RGB;
  };
  /** Exact 16x16 pixel index grid (rows of 16 palette indices '0'..'5') decoded from the base tile PNG */
  grid16x16: string[];
  /** Optional runtime 16x16 RGBA pixel override loaded directly from HTMLImageElement */
  livePixels?: Uint8ClampedArray;
}

/**
 * Exact decoded 16x16 pixel grids & palettes from `dirt01`, `grass01`, `aether01`, and `ruins01`
 * so synchronous frame-0 baking is instant before async `HTMLImageElement` decoding completes.
 */
export const TERRAIN_MICRO_SEEDS: Record<ClusterTerrainType, TerrainMicroSeed> = {
  dirt: {
    terrain: 'dirt',
    mode: '4x4',
    palette: [
      [51, 51, 51],
      [44, 50, 38],
      [64, 48, 34],
      [0, 0, 0],
      [34, 34, 34],
    ],
    wallShading: {
      edge: [0, 0, 0],
      wallTop: [64, 48, 34],
      wallFront: [34, 34, 34],
      wallBrick: [51, 51, 51],
      wallMortar: [0, 0, 0],
      highlight: [84, 66, 48],
    },
    grid16x16: [
      '0120233342022132',
      '2403444444233020',
      '1203240340433222',
      '2402134430143101',
      '0344441320223222',
      '4440332413212122',
      '2314400421202244',
      '3442443321342414',
      '4430343020414312',
      '0433204430241422',
      '4340443314343210',
      '0432303423300412',
      '2424234221342141',
      '1212443421424444',
      '3004102444342043',
      '0123343422002022',
    ],
  },
  grass: {
    terrain: 'grass',
    mode: '4x4',
    palette: [
      [41, 31, 22],
      [123, 144, 81],
      [67, 79, 45],
      [50, 50, 15],
      [90, 105, 60],
    ],
    wallShading: {
      edge: [41, 31, 22],
      wallTop: [90, 105, 60],
      wallFront: [50, 50, 15],
      wallBrick: [67, 79, 45],
      wallMortar: [41, 31, 22],
      highlight: [123, 144, 81],
    },
    grid16x16: [
      '0123321343242424',
      '0343242424012301',
      '3324012302034303',
      '1142031143242341',
      '3210242441012243',
      '3431012342434043',
      '1242434312332133',
      '2012332134324242',
      '2034324242401230',
      '1331101130213012',
      '2424211242422434',
      '2102424410112332',
      '4310123424344324',
      '2424343123331401',
      '0123321343142424',
      '0343242424232102',
    ],
  },
  aether: {
    terrain: 'aether',
    mode: '4x4',
    palette: [
      [80, 41, 102],
      [133, 57, 105],
      [56, 30, 71],
      [50, 50, 111],
      [48, 54, 76],
      [0, 0, 0],
    ],
    wallShading: {
      edge: [0, 0, 0],
      wallTop: [133, 57, 105],
      wallFront: [56, 30, 71],
      wallBrick: [80, 41, 102],
      wallMortar: [0, 0, 0],
      highlight: [168, 78, 140],
    },
    grid16x16: [
      '0010000012300420',
      '0033002234002013',
      '2033023300224402',
      '3022001220440010',
      '2200123004201330',
      '0010340020330224',
      '4004002230223042',
      '0420104022001020',
      '2010020000102400',
      '4432001230040050',
      '0000123004201004',
      '1022340020100220',
      '0233202244322030',
      '0012404400133004',
      '1230042010000423',
      '3400201002202002',
    ],
  },
  ruins: {
    terrain: 'ruins',
    mode: '2x2',
    palette: [
      [250, 230, 180],
      [200, 185, 128],
      [150, 128, 75],
    ],
    wallShading: {
      edge: [110, 92, 52],
      wallTop: [250, 230, 180],
      wallFront: [150, 128, 75],
      wallBrick: [200, 185, 128],
      wallMortar: [110, 92, 52],
      highlight: [250, 230, 180],
    },
    grid16x16: [
      '0000011111111022',
      '2221022212222111',
      '1111011111111000',
      '0111110001110222',
      '2122221110221222',
      '1111110222121111',
      '2122212220111222',
      '1111100001111000',
      '1122201112222011',
      '0000011111111022',
      '2221022212222111',
      '1111011111111000',
      '0111110001110222',
      '2122221110221222',
      '1111110222121111',
      '2122212220111222',
    ],
  },
};

function hash2D(x: number, y: number, seed: number = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % 1000;
}

/**
 * Read an exact pixel `(sx, sy)` in `0..15` from the terrain's `16×16` base tile (`dirt01`, `grass01`, `aether01`, `ruins01`).
 */
export function getBaseTilePixel(terrain: ClusterTerrainType, sx: number, sy: number): RGB {
  const seed = TERRAIN_MICRO_SEEDS[terrain];
  const x = sx & 15;
  const y = sy & 15;
  if (seed.livePixels) {
    const idx = (y * 16 + x) * 4;
    return [seed.livePixels[idx], seed.livePixels[idx + 1], seed.livePixels[idx + 2]];
  }
  const ch = seed.grid16x16[y]?.[x] || '0';
  const palIdx = ch.charCodeAt(0) - 48;
  return seed.palette[palIdx] || seed.palette[0];
}

/**
 * Sample a pixel `(lx, ly)` in `0..15` for tile `(tc, tr)` in a `3×3` cluster by rearranging:
 * - The exact unmodified `16×16` base tile at center `(tc = 1, tr = 1)`
 * - Either `2×2` of `8×8px` quadrants (`ruins01`) or `4×4` of `4×4px` micro-blocks (`dirt01`, `grass01`, `aether01`)
 *   for the other 8 tiles in the `3×3` cluster!
 */
export function sampleSubTilePixel(
  terrain: ClusterTerrainType,
  tc: number,
  tr: number,
  lx: number,
  ly: number
): RGB {
  // Center tile (1, 1) of the 3x3 cluster is always the exact unmodified 16x16 base tile!
  if (tc === 1 && tr === 1) {
    return getBaseTilePixel(terrain, lx, ly);
  }

  const seed = TERRAIN_MICRO_SEEDS[terrain];

  if (seed.mode === '2x2') {
    // Rearrange 2x2 of 8x8px Quadrants (or 4x4px masonry sub-courses) from the 16x16 base tile
    const qx = lx >> 3; // 0..1
    const qy = ly >> 3; // 0..1
    const inX = lx & 7; // 0..7
    const inY = ly & 7; // 0..7

    const tileVariant = tc + tr * 3;
    // Permute which 8x8 quadrant (srcQx, srcQy) of ruins01 is placed in (qx, qy),
    // with horizontal mirroring on alternating variants so flagstone courses stay horizontal!
    const srcQx = (qx + tileVariant + qy) & 1;
    const srcQy = (qy + (tileVariant >> 1)) & 1;
    const flipX = ((tileVariant + qx + qy) & 1) === 1;
    const sampleX = srcQx * 8 + (flipX ? 7 - inX : inX);
    const sampleY = srcQy * 8 + inY;
    return getBaseTilePixel(terrain, sampleX, sampleY);
  }

  // Rearrange 4x4 of 4x4px Micro-Blocks from the 16x16 base tile (`dirt01`, `grass01`, `aether01`):
  const bx = lx >> 2; // 0..3
  const by = ly >> 2; // 0..3
  const mx = lx & 3; // 0..3
  const my = ly & 3; // 0..3

  const blockHash = hash2D(tc * 4 + bx, tr * 4 + by, terrain.charCodeAt(0));
  const srcBx = blockHash & 3; // 0..3 (which of the 4x4 micro-block columns in base tile)
  const srcBy = (blockHash >> 2) & 3; // 0..3 (which of the 4x4 micro-block rows in base tile)
  const flipMode = (blockHash >> 4) & 3;

  let rx = mx;
  let ry = my;
  if (flipMode === 1) {
    rx = 3 - mx;
  } else if (flipMode === 2) {
    ry = 3 - my;
  } else if (flipMode === 3) {
    rx = 3 - mx;
    ry = 3 - my;
  }

  return getBaseTilePixel(terrain, srcBx * 4 + rx, srcBy * 4 + ry);
}

/**
 * Sample a `from(to)` transition pixel `(lx, ly)` in `0..15` for cluster cell `(tc, tr)` in `0..2`.
 * The center tile `(tc=1, tr=1)` is the generic `from` tile; the outer 8 tiles substitute `4×4px`
 * micro-blocks (and `8×8px` corner/edge regions) from `toTerrain` along the transition direction.
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

  // Sub-tile 4x4px micro-block boundary + 1px organic pixel-art step
  const jitter = (hash2D(tc * 16 + lx, tr * 16 + ly, 77) % 3) - 1;
  const distN = ly + jitter;
  const distS = 15 - ly + jitter;
  const distW = lx + jitter;
  const distE = 15 - lx + jitter;
  const threshold = 5; // 1 micro-block (4px) + 1px organic edge

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
    return TERRAIN_MICRO_SEEDS[toTerrain].wallShading.edge;
  }
  return sampleSubTilePixel(fromTerrain, tc, tr, lx, ly);
}

/**
 * Sample a Row 5 Wall & Associated Floor pixel `(lx, ly)` in `0..15` for cluster cell `(tc, tr)` in `0..2`:
 * - `tr = 0`: Solid connected 2.5D wall `[left cap, center wall, right cap]` built by beveling the base tile's `8×8` / `4×4` sub-tiles
 * - `tr = 1`: Associated floor tiles `[left, center, right]` with top wall shadow
 * - `tr = 2`: Left (`tc=0`) & Right (`tc=2`) single 16x16 walls (`P`), Center (`tc=1`) associated floor
 */
function sampleWallSubTilePixel(
  terrain: ClusterTerrainType,
  tc: number,
  tr: number,
  lx: number,
  ly: number
): RGB {
  const w = TERRAIN_MICRO_SEEDS[terrain].wallShading;
  const baseRgb = sampleSubTilePixel(terrain, tc, tr, lx, ly);

  if (tr === 0) {
    const isLeftEdge = tc === 0 && lx === 0;
    const isRightEdge = tc === 2 && lx === 15;
    if (isLeftEdge || isRightEdge || ly === 0 || ly === 15) {
      return w.wallMortar;
    }
    // Top cap of solid wall (rows 1..4) textured using the base tile's sub-blocks brightened
    if (ly <= 4) {
      if ((lx + tc * 16) % 8 === 0 && ly > 1) return w.wallMortar;
      if (ly === 1 || (tc === 0 && lx === 1)) return w.highlight;
      return [
        Math.min(255, Math.round((baseRgb[0] + w.wallTop[0]) * 0.55)),
        Math.min(255, Math.round((baseRgb[1] + w.wallTop[1]) * 0.55)),
        Math.min(255, Math.round((baseRgb[2] + w.wallTop[2]) * 0.55)),
      ];
    }
    if (ly === 5) return w.wallMortar;

    // Front face of solid wall (rows 6..14) using the base tile's 8x8 / 4x4 texture with masonry joints
    const course = Math.floor((ly - 6) / 4);
    const isMortarRow = (ly - 6) % 4 === 3;
    const isMortarCol = (lx + course * 4) % 8 === 0;
    if (isMortarRow || isMortarCol) return w.wallMortar;
    return [
      Math.round(baseRgb[0] * 0.65 + w.wallFront[0] * 0.35),
      Math.round(baseRgb[1] * 0.65 + w.wallFront[1] * 0.35),
      Math.round(baseRgb[2] * 0.65 + w.wallFront[2] * 0.35),
    ];
  }

  if (tr === 1) {
    if (ly < 2) {
      return [
        Math.max(0, baseRgb[0] - 24),
        Math.max(0, baseRgb[1] - 24),
        Math.max(0, baseRgb[2] - 24),
      ];
    }
    return baseRgb;
  }

  // tr === 2: Left (tc=0) and Right (tc=2) are 16x16 Single Walls / Pillars; Center (tc=1) is floor
  if (tc === 0 || tc === 2) {
    if (lx >= 2 && lx <= 13 && ly >= 1 && ly <= 14) {
      if (lx === 2 || lx === 13 || ly === 1 || ly === 14) return w.wallMortar;
      if (ly <= 4) {
        return ly === 2 || lx === 3 ? w.highlight : w.wallTop;
      }
      if (ly === 5) return w.wallMortar;
      const isMortar = ly === 9 || ly === 12 || lx === 7;
      if (isMortar) return w.wallMortar;
      return [
        Math.round(baseRgb[0] * 0.7 + w.wallBrick[0] * 0.3),
        Math.round(baseRgb[1] * 0.7 + w.wallBrick[1] * 0.3),
        Math.round(baseRgb[2] * 0.7 + w.wallBrick[2] * 0.3),
      ];
    }
    if (lx >= 1 && lx <= 14 && ly === 15) {
      return w.edge;
    }
  }
  return baseRgb;
}

function renderClusterIntoCanvas(
  canvas: HTMLCanvasElement,
  pixelSampler: (tc: number, tr: number, lx: number, ly: number) => RGB
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

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
}

export interface BakedBiomeClusterCatalog {
  atlases: Base64AtlasDefinition[];
  masterAtlas: Base64AtlasDefinition;
}

let cachedCatalog: BakedBiomeClusterCatalog | null = null;

/**
 * Bake all 20 separated `3×3` cluster atlases (`48×48px`) and the combined `192×240px`
 * `ruins_tileset` once into offscreen canvases from the 4 base `16×16px` tiles
 * (`dirt01`, `grass01`, `aether01`, `ruins01`) and register them in `BASE64_ATLAS_REGISTRY`.
 */
export function bakeBiomeClusterTileset(
  baseTiles?: Partial<BasicFourTilesInput>,
  modes?: Partial<Record<ClusterTerrainType, '4x4' | '2x2'>>
): BakedBiomeClusterCatalog {
  if (modes) {
    for (const [terrain, mode] of Object.entries(modes) as Array<[ClusterTerrainType, '4x4' | '2x2']>) {
      if (mode && TERRAIN_MICRO_SEEDS[terrain]) {
        TERRAIN_MICRO_SEEDS[terrain].mode = mode;
      }
    }
  }

  if (cachedCatalog && !baseTiles) return cachedCatalog;

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
  const canvasBySpecId = new Map<string, HTMLCanvasElement>();

  const rebakeAll = () => {
    for (const spec of clusterSpecs) {
      let clusterCanvas = canvasBySpecId.get(spec.id);
      if (!clusterCanvas && typeof document !== 'undefined') {
        clusterCanvas = document.createElement('canvas');
        clusterCanvas.width = 48;
        clusterCanvas.height = 48;
        canvasBySpecId.set(spec.id, clusterCanvas);
      }
      if (clusterCanvas) {
        renderClusterIntoCanvas(clusterCanvas, spec.sampler);
        registerCanvasAtlas(spec.id, clusterCanvas, 16, 16, `${spec.id} (3x3 Sub-Tile Cluster)`);
        if (masterCtx) {
          masterCtx.drawImage(clusterCanvas, spec.cCol * 48, spec.cRow * 48);
        }
      }
    }
    if (masterCanvas) {
      registerCanvasAtlas(
        'ruins_tileset',
        masterCanvas,
        16,
        16,
        'Ruins 4x5 Cluster Biome Tileset (Baked from dirt01, grass01, aether01, ruins01)'
      );
    }
  };

  // Initial synchronous frame-0 bake from the exact decoded 16x16 grids
  rebakeAll();

  for (const spec of clusterSpecs) {
    atlases.push({
      id: spec.id,
      name: `${spec.id} (3x3 Sub-Tile Cluster)`,
      base64: spec.id,
      cellWidth: 16,
      cellHeight: 16,
      canvas: canvasBySpecId.get(spec.id),
    });
  }

  // Also bind live HTMLImageElement decoders to `dirt01`, `grass01`, `aether01`, `ruins01`
  // so editing any of the 4 Base64 PNG strings dynamically updates the baked clusters!
  if (baseTiles && typeof Image !== 'undefined' && typeof document !== 'undefined') {
    const entries: Array<[ClusterTerrainType, string | undefined]> = [
      ['dirt', baseTiles.dirt01],
      ['grass', baseTiles.grass01],
      ['aether', baseTiles.aether01],
      ['ruins', baseTiles.ruins01],
    ];
    for (const [terrain, src] of entries) {
      if (!src) continue;
      const img = new Image();
      img.onload = () => {
        const scratch = document.createElement('canvas');
        scratch.width = 16;
        scratch.height = 16;
        const sctx = scratch.getContext('2d');
        if (!sctx) return;
        sctx.drawImage(img, 0, 0, 16, 16);
        TERRAIN_MICRO_SEEDS[terrain].livePixels = sctx.getImageData(0, 0, 16, 16).data;
        rebakeAll();
      };
      img.src = src;
    }
  }

  const masterAtlas: Base64AtlasDefinition = {
    id: 'ruins_tileset',
    name: 'Ruins 4x5 Cluster Biome Tileset (Baked from dirt01, grass01, aether01, ruins01)',
    base64: 'ruins_tileset',
    cellWidth: 16,
    cellHeight: 16,
    canvas: masterCanvas,
  };

  cachedCatalog = { atlases, masterAtlas };
  return cachedCatalog;
}
