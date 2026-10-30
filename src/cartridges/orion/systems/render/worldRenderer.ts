/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getRoomDimensions,
  getVisibleTileBounds,
  hasPoeLanternGuidance,
  TILE_SIZE,
  Z_SCALE,
} from '../../constants';
import { getTileDefinition } from '../../database/world';
import { BiomeDefinition, ClusterTerrainType, OrionState } from '../../types';
import {
  getPointVisibilityFactor,
  resolveBiomePostProcess,
  resolveRoomLightingProfile,
} from './effectsRenderer';
import {
  BASE64_ATLAS_REGISTRY,
  Base64AtlasDefinition,
  drawBase64Sprite,
  registerCanvasAtlas,
} from './spriteAtlasCache';

// ─── 1. SUB-TILE MICRO-COMPOSER (`4×4` of `4px` & `2×2` of `8px` Quadrants) ──

export type RGB = [number, number, number];

export interface BasicFourTilesInput {
  dirt01: string;
  grass01: string;
  aether01: string;
  ruins01: string;
}

export interface TerrainMicroSeed {
  terrain: ClusterTerrainType;
  mode: '4x4' | '2x2';
  palette: RGB[];
  wallShading: {
    edge: RGB;
    wallTop: RGB;
    wallFront: RGB;
    wallBrick: RGB;
    wallMortar: RGB;
    highlight: RGB;
  };
  grid16x16: string[];
  livePixels?: Uint8ClampedArray;
}

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
  mire: {
    terrain: 'mire',
    mode: '4x4',
    palette: [
      [28, 32, 38],
      [38, 43, 50],
      [20, 23, 28],
      [12, 14, 18],
      [48, 54, 62],
    ],
    wallShading: {
      edge: [12, 14, 18],
      wallTop: [68, 76, 86],
      wallFront: [38, 43, 50],
      wallBrick: [48, 54, 62],
      wallMortar: [12, 14, 18],
      highlight: [94, 104, 118],
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
};

function hash2D(x: number, y: number, seed: number = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % 1000;
}

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

export function sampleSubTilePixel(
  terrain: ClusterTerrainType,
  tc: number,
  tr: number,
  lx: number,
  ly: number
): RGB {
  if (tc === 1 && tr === 1) {
    return getBaseTilePixel(terrain, lx, ly);
  }

  const seed = TERRAIN_MICRO_SEEDS[terrain];

  if (seed.mode === '2x2') {
    const qx = lx >> 3;
    const qy = ly >> 3;
    const inX = lx & 7;
    const inY = ly & 7;

    const tileVariant = tc + tr * 3;
    const srcQx = (qx + tileVariant + qy) & 1;
    const srcQy = (qy + (tileVariant >> 1)) & 1;
    const flipX = ((tileVariant + qx + qy) & 1) === 1;
    const sampleX = srcQx * 8 + (flipX ? 7 - inX : inX);
    const sampleY = srcQy * 8 + inY;
    return getBaseTilePixel(terrain, sampleX, sampleY);
  }

  const bx = lx >> 2;
  const by = ly >> 2;
  const mx = lx & 3;
  const my = ly & 3;

  const blockHash = hash2D(tc * 4 + bx, tr * 4 + by, terrain.charCodeAt(0));
  const srcBx = blockHash & 3;
  const srcBy = (blockHash >> 2) & 3;
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

  const jitter = (hash2D(tc * 16 + lx, tr * 16 + ly, 77) % 3) - 1;
  const distN = ly + jitter;
  const distS = 15 - ly + jitter;
  const distW = lx + jitter;
  const distE = 15 - lx + jitter;
  const threshold = 5;

  let useTo = false;
  let isBorder = false;

  if (hasN && hasW) {
    useTo = distN < threshold || distW < threshold || lx + ly + jitter < threshold + 3;
    isBorder =
      !useTo &&
      (distN === threshold || distW === threshold || lx + ly + jitter === threshold + 3);
  } else if (hasN && hasE) {
    const rx = 15 - lx;
    useTo = distN < threshold || distE < threshold || rx + ly + jitter < threshold + 3;
    isBorder =
      !useTo &&
      (distN === threshold || distE === threshold || rx + ly + jitter === threshold + 3);
  } else if (hasS && hasW) {
    const ry = 15 - ly;
    useTo = distS < threshold || distW < threshold || lx + ry + jitter < threshold + 3;
    isBorder =
      !useTo &&
      (distS === threshold || distW === threshold || lx + ry + jitter === threshold + 3);
  } else if (hasS && hasE) {
    const rx = 15 - lx;
    const ry = 15 - ly;
    useTo = distS < threshold || distE < threshold || rx + ry + jitter < threshold + 3;
    isBorder =
      !useTo &&
      (distS === threshold || distE === threshold || rx + ry + jitter === threshold + 3);
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

// [ORION-ANCHOR: RENDER-CLUSTER-BAKE]
export function bakeBiomeClusterTileset(
  baseTiles?: Partial<BasicFourTilesInput>,
  modes?: Partial<Record<ClusterTerrainType, '4x4' | '2x2'>>
): BakedBiomeClusterCatalog {
  if (modes) {
    for (const [terrain, mode] of Object.entries(modes) as Array<
      [ClusterTerrainType, '4x4' | '2x2']
    >) {
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
    {
      id: 'dirt_general',
      cCol: 0,
      cRow: 0,
      sampler: (tc, tr, lx, ly) => sampleSubTilePixel('dirt', tc, tr, lx, ly),
    },
    {
      id: 'grass_general',
      cCol: 1,
      cRow: 0,
      sampler: (tc, tr, lx, ly) => sampleSubTilePixel('grass', tc, tr, lx, ly),
    },
    {
      id: 'aether_general',
      cCol: 2,
      cRow: 0,
      sampler: (tc, tr, lx, ly) => sampleSubTilePixel('aether', tc, tr, lx, ly),
    },
    {
      id: 'ruins_general',
      cCol: 3,
      cRow: 0,
      sampler: (tc, tr, lx, ly) => sampleSubTilePixel('ruins', tc, tr, lx, ly),
    },
    {
      id: 'dirt_to_grass',
      cCol: 0,
      cRow: 1,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('dirt', 'grass', tc, tr, lx, ly),
    },
    {
      id: 'grass_to_dirt',
      cCol: 1,
      cRow: 1,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('grass', 'dirt', tc, tr, lx, ly),
    },
    {
      id: 'aether_to_dirt',
      cCol: 2,
      cRow: 1,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('aether', 'dirt', tc, tr, lx, ly),
    },
    {
      id: 'ruins_to_dirt',
      cCol: 3,
      cRow: 1,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('ruins', 'dirt', tc, tr, lx, ly),
    },
    {
      id: 'dirt_to_aether',
      cCol: 0,
      cRow: 2,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('dirt', 'aether', tc, tr, lx, ly),
    },
    {
      id: 'grass_to_aether',
      cCol: 1,
      cRow: 2,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('grass', 'aether', tc, tr, lx, ly),
    },
    {
      id: 'aether_to_grass',
      cCol: 2,
      cRow: 2,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('aether', 'grass', tc, tr, lx, ly),
    },
    {
      id: 'ruins_to_grass',
      cCol: 3,
      cRow: 2,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('ruins', 'grass', tc, tr, lx, ly),
    },
    {
      id: 'dirt_to_ruins',
      cCol: 0,
      cRow: 3,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('dirt', 'ruins', tc, tr, lx, ly),
    },
    {
      id: 'grass_to_ruins',
      cCol: 1,
      cRow: 3,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('grass', 'ruins', tc, tr, lx, ly),
    },
    {
      id: 'aether_to_ruins',
      cCol: 2,
      cRow: 3,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('aether', 'ruins', tc, tr, lx, ly),
    },
    {
      id: 'ruins_to_aether',
      cCol: 3,
      cRow: 3,
      sampler: (tc, tr, lx, ly) => sampleTransitionSubTilePixel('ruins', 'aether', tc, tr, lx, ly),
    },
    {
      id: 'dirt_walls',
      cCol: 0,
      cRow: 4,
      sampler: (tc, tr, lx, ly) => sampleWallSubTilePixel('dirt', tc, tr, lx, ly),
    },
    {
      id: 'grass_walls',
      cCol: 1,
      cRow: 4,
      sampler: (tc, tr, lx, ly) => sampleWallSubTilePixel('grass', tc, tr, lx, ly),
    },
    {
      id: 'aether_walls',
      cCol: 2,
      cRow: 4,
      sampler: (tc, tr, lx, ly) => sampleWallSubTilePixel('aether', tc, tr, lx, ly),
    },
    {
      id: 'ruins_walls',
      cCol: 3,
      cRow: 4,
      sampler: (tc, tr, lx, ly) => sampleWallSubTilePixel('ruins', tc, tr, lx, ly),
    },
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

// ─── 2. 3×3 CLUSTER & 4×5 BIOME TILESET AUTO-TILER ───────────────────────────

export const TERRAIN_CLUSTER_COL: Record<ClusterTerrainType, number> = {
  dirt: 0,
  grass: 1,
  aether: 2,
  ruins: 3,
  mire: 0,
};

export const GENERAL_CLUSTER_ATLAS_ID: Record<ClusterTerrainType, string> = {
  dirt: 'dirt_general',
  grass: 'grass_general',
  aether: 'aether_general',
  ruins: 'ruins_general',
  mire: 'dirt_general',
};

export const WALL_CLUSTER_ATLAS_ID: Record<ClusterTerrainType, string> = {
  dirt: 'dirt_walls',
  grass: 'grass_walls',
  aether: 'aether_walls',
  ruins: 'ruins_walls',
  mire: 'dirt_walls',
};

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
    grass: { atlasId: 'dirt_to_grass', clusterCol: 0, clusterRow: 1 },
    aether: { atlasId: 'dirt_to_aether', clusterCol: 0, clusterRow: 2 },
    ruins: { atlasId: 'dirt_to_ruins', clusterCol: 0, clusterRow: 3 },
  },
  grass: {
    dirt: { atlasId: 'grass_to_dirt', clusterCol: 1, clusterRow: 1 },
    aether: { atlasId: 'grass_to_aether', clusterCol: 1, clusterRow: 2 },
    ruins: { atlasId: 'grass_to_ruins', clusterCol: 1, clusterRow: 3 },
  },
  aether: {
    dirt: { atlasId: 'aether_to_dirt', clusterCol: 2, clusterRow: 1 },
    grass: { atlasId: 'aether_to_grass', clusterCol: 2, clusterRow: 2 },
    ruins: { atlasId: 'aether_to_ruins', clusterCol: 2, clusterRow: 3 },
  },
  ruins: {
    dirt: { atlasId: 'ruins_to_dirt', clusterCol: 3, clusterRow: 1 },
    grass: { atlasId: 'ruins_to_grass', clusterCol: 3, clusterRow: 2 },
    aether: { atlasId: 'ruins_to_aether', clusterCol: 3, clusterRow: 3 },
  },
  mire: {
    grass: { atlasId: 'dirt_to_grass', clusterCol: 0, clusterRow: 1 },
    aether: { atlasId: 'dirt_to_aether', clusterCol: 0, clusterRow: 2 },
    ruins: { atlasId: 'dirt_to_ruins', clusterCol: 0, clusterRow: 3 },
  },
};

const TERRAIN_PRIORITY: ClusterTerrainType[] = ['ruins', 'grass', 'dirt', 'mire', 'aether'];

// ─── SWAMP BIOME (`bog_tileset` 15×15 / 5×5 Cluster Sheet) TABLES ────────────

const BOG_BASE_CLUSTER_ROW: Record<ClusterTerrainType, number> = {
  mire: 0, // Rows 01..03, Cols 01..03 (Dark Mire / Dungeon Stone)
  grass: 1, // Rows 04..06, Cols 01..03 (Marsh Grass / Forest)
  dirt: 2, // Rows 07..09, Cols 01..03 (Brown Peat / Bog Dirt)
  ruins: 3, // Rows 10..12, Cols 01..03 (Pale Temple / Monastery Brick)
  aether: 4, // Rows 13..15, Cols 01..03 (Corrosive Swamp Water)
};

const BOG_TRANSITION_CLUSTER_MAP: Record<
  ClusterTerrainType,
  Partial<Record<ClusterTerrainType, { clusterCol: number; clusterRow: number }>>
> = {
  mire: {
    grass: { clusterRow: 0, clusterCol: 1 },
    dirt: { clusterRow: 0, clusterCol: 2 },
    ruins: { clusterRow: 0, clusterCol: 3 },
    aether: { clusterRow: 0, clusterCol: 4 },
  },
  grass: {
    mire: { clusterRow: 1, clusterCol: 1 },
    dirt: { clusterRow: 1, clusterCol: 2 },
    ruins: { clusterRow: 1, clusterCol: 3 },
    aether: { clusterRow: 1, clusterCol: 4 },
  },
  dirt: {
    grass: { clusterRow: 2, clusterCol: 1 },
    mire: { clusterRow: 2, clusterCol: 2 },
    ruins: { clusterRow: 2, clusterCol: 3 },
    aether: { clusterRow: 2, clusterCol: 4 },
  },
  ruins: {
    grass: { clusterRow: 3, clusterCol: 1 },
    dirt: { clusterRow: 3, clusterCol: 2 },
    mire: { clusterRow: 3, clusterCol: 3 },
  },
  aether: {
    mire: { clusterRow: 4, clusterCol: 1 },
  },
};

const BOG_TERRAIN_PRIORITY: ClusterTerrainType[] = [
  'aether',
  'ruins',
  'grass',
  'dirt',
  'mire',
];

function makeBogTileSlice(row1Based: number, col1Based: number): ResolvedClusterTileSlice {
  const r = Math.max(1, Math.min(15, row1Based));
  const c = Math.max(1, Math.min(15, col1Based));
  const rr = String(r).padStart(2, '0');
  const cc = String(c).padStart(2, '0');
  return {
    clusterAtlasId: `bogTiles_${rr}_${cc}`,
    localCol: 0,
    localRow: 0,
    col: c - 1,
    row: r - 1,
  };
}

export interface ResolvedClusterTileSlice {
  clusterAtlasId: string;
  localCol: number;
  localRow: number;
  col: number;
  row: number;
}

export function charToExplicitTerrain(char: string | undefined): ClusterTerrainType | null {
  if (!char) return null;
  if (char === '.') return 'dirt';
  if (char === ',') return 'grass';
  if (char === '~') return 'aether';
  if (char === ':') return 'ruins';
  if (char === ';') return 'mire';
  return null;
}

export function isClusterSolidWallChar(char: string | undefined): boolean {
  return char === '#' || char === '%';
}

export function isClusterSingleWallChar(char: string | undefined): boolean {
  return char === 'P';
}

export function resolveRoomBaseTerrain(
  room: string[],
  tx: number,
  ty: number,
  biome: BiomeDefinition
): ClusterTerrainType {
  const { cols, rows } = getRoomDimensions(room);
  const clampedX = Math.max(0, Math.min(cols - 1, tx));
  const clampedY = Math.max(0, Math.min(rows - 1, ty));
  const rawChar = room[clampedY]?.[clampedX];

  const direct = charToExplicitTerrain(rawChar);
  if (direct) return direct;

  const defaultTerrain = biome.defaultClusterTerrain || 'dirt';
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

  const counts: Record<ClusterTerrainType, number> = {
    dirt: 0,
    grass: 0,
    aether: 0,
    ruins: 0,
    mire: 0,
  };

  for (const [dx, dy] of offsets) {
    const nx = clampedX + dx;
    const ny = clampedY + dy;
    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
      const neighborTerrain = charToExplicitTerrain(room[ny]?.[nx]);
      if (neighborTerrain) {
        counts[neighborTerrain]++;
      }
    }
  }

  const dryOrder: ClusterTerrainType[] = ['ruins', 'grass', 'dirt', 'mire'];

  if (isClusterSolidWallChar(rawChar)) {
    if (biome.clusterTileSheetBase64 === 'bog_tileset') {
      if (counts.ruins >= 2 && counts.ruins >= counts.grass) return 'ruins';
      if (counts.mire >= 2 && counts.mire >= counts.grass) return 'mire';
      if (counts.grass >= 1) return 'grass';
      if (counts.dirt >= 1) return 'dirt';
      if (counts.ruins >= 1) return 'ruins';
      if (counts.mire >= 1) return 'mire';
      return defaultTerrain;
    }

    let bestDry: ClusterTerrainType = defaultTerrain;
    let bestCount = counts[defaultTerrain] || 0;
    for (const candidate of dryOrder) {
      if (counts[candidate] >= 2 && counts[candidate] > bestCount) {
        bestDry = candidate;
        bestCount = counts[candidate];
      }
    }
    return bestDry;
  }

  if (rawChar === 'P' && biome.clusterTileSheetBase64 === 'bog_tileset') {
    if (counts.ruins >= 2 && counts.ruins > counts.grass) return 'ruins';
    if (counts.mire >= 2 && counts.mire > counts.grass) return 'mire';
    if (counts.grass >= 1) return 'grass';
  }

  let bestPropTerrain: ClusterTerrainType | null = null;
  let bestPropCount = 0;
  for (const candidate of dryOrder) {
    if (counts[candidate] > bestPropCount) {
      bestPropTerrain = candidate;
      bestPropCount = counts[candidate];
    }
  }
  if (bestPropTerrain) return bestPropTerrain;
  if (counts.aether > 0) return 'aether';

  return defaultTerrain;
}

function hashGeneralTileOffset(tx: number, ty: number): { localCol: number; localRow: number } {
  const h = Math.abs((tx * 73856093) ^ (ty * 19349663) ^ ((tx + 3) * (ty + 7) * 83492791)) % 9;
  return {
    localCol: h % 3,
    localRow: Math.floor(h / 3),
  };
}

function resolveBogClusterLayer0Coord(
  room: string[],
  tx: number,
  ty: number,
  biome: BiomeDefinition
): ResolvedClusterTileSlice | null {
  const char = room[ty]?.[tx] || '.';
  const { cols, rows } = getRoomDimensions(room);

  if (char === '_') {
    const northChar = ty > 0 ? room[ty - 1]?.[tx] : undefined;
    const pitTerrain =
      northChar && northChar !== '_'
        ? resolveRoomBaseTerrain(room, tx, ty - 1, biome)
        : resolveRoomBaseTerrain(room, tx, ty, biome);
    if (pitTerrain === 'mire') return makeBogTileSlice(2, 5);
    if (pitTerrain === 'grass') return makeBogTileSlice(5, 5);
    if (pitTerrain === 'ruins') return makeBogTileSlice(11, 5);
    return makeBogTileSlice(8, 5);
  }

  const fromTerrain = resolveRoomBaseTerrain(room, tx, ty, biome);
  const baseClusterRow = BOG_BASE_CLUSTER_ROW[fromTerrain];

  if (char === 'M') {
    if (ty === rows - 1) return makeBogTileSlice(15, 11);
    if (tx === 0) return makeBogTileSlice(15, 10);
    if (tx === cols - 1) return makeBogTileSlice(15, 12);
    return makeBogTileSlice(14, 11);
  }

  const isWalkableDoorway =
    !isClusterSolidWallChar(char) &&
    char !== 'P' &&
    char !== '~' &&
    (ty === 0 || ty === rows - 1 || tx === 0 || tx === cols - 1);
  if (isWalkableDoorway) {
    const useStoneStairs = fromTerrain === 'ruins' || fromTerrain === 'mire' || char === 'G';
    if (ty === 0) {
      return useStoneStairs ? makeBogTileSlice(14, 11) : makeBogTileSlice(14, 14);
    }
    if (ty === rows - 1) {
      return useStoneStairs ? makeBogTileSlice(15, 11) : makeBogTileSlice(15, 14);
    }
    if (tx === 0) {
      return useStoneStairs ? makeBogTileSlice(15, 10) : makeBogTileSlice(15, 13);
    }
    if (tx === cols - 1) {
      return useStoneStairs ? makeBogTileSlice(15, 12) : makeBogTileSlice(15, 15);
    }
  }

  if (isClusterSolidWallChar(char) || isClusterSingleWallChar(char)) {
    const { localCol, localRow } = hashGeneralTileOffset(tx, ty);
    return makeBogTileSlice(baseClusterRow * 3 + localRow + 1, localCol + 1);
  }

  const nTerrain = ty > 0 ? resolveRoomBaseTerrain(room, tx, ty - 1, biome) : fromTerrain;
  const sTerrain = ty < rows - 1 ? resolveRoomBaseTerrain(room, tx, ty + 1, biome) : fromTerrain;
  const wTerrain = tx > 0 ? resolveRoomBaseTerrain(room, tx - 1, ty, biome) : fromTerrain;
  const eTerrain = tx < cols - 1 ? resolveRoomBaseTerrain(room, tx + 1, ty, biome) : fromTerrain;
  const nwTerrain =
    ty > 0 && tx > 0 ? resolveRoomBaseTerrain(room, tx - 1, ty - 1, biome) : fromTerrain;
  const neTerrain =
    ty > 0 && tx < cols - 1 ? resolveRoomBaseTerrain(room, tx + 1, ty - 1, biome) : fromTerrain;
  const swTerrain =
    ty < rows - 1 && tx > 0 ? resolveRoomBaseTerrain(room, tx - 1, ty + 1, biome) : fromTerrain;
  const seTerrain =
    ty < rows - 1 && tx < cols - 1
      ? resolveRoomBaseTerrain(room, tx + 1, ty + 1, biome)
      : fromTerrain;

  if (fromTerrain === 'ruins' && sTerrain === 'aether') {
    const wIsRuins = wTerrain === 'ruins';
    const eIsRuins = eTerrain === 'ruins';
    const bridgeCol = !wIsRuins && eIsRuins ? 7 : wIsRuins && !eIsRuins ? 9 : 8;
    const bridgeRow = nTerrain === 'aether' ? 15 : 13;
    return makeBogTileSlice(bridgeRow, bridgeCol);
  }

  if (fromTerrain === 'aether' && nTerrain === 'ruins') {
    const nwIsRuins = nwTerrain === 'ruins';
    const neIsRuins = neTerrain === 'ruins';
    const wallCol = !nwIsRuins && neIsRuins ? 7 : nwIsRuins && !neIsRuins ? 9 : 8;
    return makeBogTileSlice(14, wallCol);
  }

  let targetToTerrain: ClusterTerrainType | null = null;
  for (const candidate of BOG_TERRAIN_PRIORITY) {
    if (candidate === fromTerrain) break;
    if (!BOG_TRANSITION_CLUSTER_MAP[fromTerrain]?.[candidate]) continue;
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
    const cluster = BOG_TRANSITION_CLUSTER_MAP[fromTerrain]?.[targetToTerrain];
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

      if (s && e) {
        localCol = 0;
        localRow = 0;
      } else if (s && w) {
        localCol = 2;
        localRow = 0;
      } else if (n && e) {
        localCol = 0;
        localRow = 2;
      } else if (n && w) {
        localCol = 2;
        localRow = 2;
      } else if (s) {
        localCol = 1;
        localRow = 0;
      } else if (n) {
        localCol = 1;
        localRow = 2;
      } else if (e) {
        localCol = 0;
        localRow = 1;
      } else if (w) {
        localCol = 2;
        localRow = 1;
      } else if (se) {
        localCol = 0;
        localRow = 0;
      } else if (sw) {
        localCol = 2;
        localRow = 0;
      } else if (ne) {
        localCol = 0;
        localRow = 2;
      } else if (nw) {
        localCol = 2;
        localRow = 2;
      }

      if (localCol !== 1 || localRow !== 1) {
        return makeBogTileSlice(
          cluster.clusterRow * 3 + localRow + 1,
          cluster.clusterCol * 3 + localCol + 1
        );
      }
    }
  }

  const { localCol, localRow } = hashGeneralTileOffset(tx, ty);
  return makeBogTileSlice(baseClusterRow * 3 + localRow + 1, localCol + 1);
}

function resolveBogClusterWallCoord(
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
  const { cols, rows } = getRoomDimensions(room);
  const leftChar = tx > 0 ? room[ty]?.[tx - 1] : '#';
  const rightChar = tx < cols - 1 ? room[ty]?.[tx + 1] : '#';
  const southChar = ty < rows - 1 ? room[ty + 1]?.[tx] : '#';

  const hasLeftWall = isClusterSolidWallChar(leftChar);
  const hasRightWall = isClusterSolidWallChar(rightChar);
  const southIsDirt = southChar === '.';

  let spanCol = 1;
  if (!hasLeftWall && hasRightWall) {
    spanCol = 0;
  } else if (hasLeftWall && !hasRightWall) {
    spanCol = 2;
  } else {
    spanCol = (tx + ty) % 3;
  }

  if (terrain === 'ruins') {
    if (isSinglePillar || (!hasLeftWall && !hasRightWall)) {
      return (tx + ty) % 2 === 0 ? makeBogTileSlice(14, 10) : makeBogTileSlice(14, 12);
    }
    return makeBogTileSlice(13, 10 + spanCol);
  }

  if (terrain === 'mire') {
    const stoneCols = [8, 11, 14];
    if (isSinglePillar || (!hasLeftWall && !hasRightWall)) {
      return makeBogTileSlice(2, stoneCols[(tx + ty) % 3] || 11);
    }
    return makeBogTileSlice(2, stoneCols[spanCol] || 11);
  }

  if (terrain === 'aether') {
    if (isSinglePillar || (!hasLeftWall && !hasRightWall)) {
      return makeBogTileSlice(11, 14);
    }
    return makeBogTileSlice(14, 7 + spanCol);
  }

  if (terrain === 'grass') {
    if (isSinglePillar || (!hasLeftWall && !hasRightWall)) {
      return (tx + ty) % 2 === 0 ? makeBogTileSlice(14, 13) : makeBogTileSlice(14, 15);
    }
    if (southIsDirt && (tx + ty) % 2 === 0) {
      const grassDirtCols = [8, 11, 14];
      return makeBogTileSlice(5, grassDirtCols[spanCol] || 11);
    }
    return makeBogTileSlice(13, 13 + spanCol);
  }

  const dirtWallCols = [8, 11, 14];
  if (isSinglePillar || (!hasLeftWall && !hasRightWall)) {
    return makeBogTileSlice(8, dirtWallCols[(tx + ty) % 3] || 11);
  }
  return makeBogTileSlice(8, dirtWallCols[spanCol] || 11);
}

export function resolveClusterLayer0Coord(
  room: string[],
  tx: number,
  ty: number,
  biome: BiomeDefinition
): ResolvedClusterTileSlice | null {
  if (biome.clusterTileSheetBase64 === 'bog_tileset') {
    return resolveBogClusterLayer0Coord(room, tx, ty, biome);
  }

  const char = room[ty]?.[tx] || '.';
  if (char === '_') return null;

  const fromTerrain = resolveRoomBaseTerrain(room, tx, ty, biome);
  const baseClusterCol = TERRAIN_CLUSTER_COL[fromTerrain];

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

  const { cols, rows } = getRoomDimensions(room);
  const nTerrain = ty > 0 ? resolveRoomBaseTerrain(room, tx, ty - 1, biome) : fromTerrain;
  const sTerrain = ty < rows - 1 ? resolveRoomBaseTerrain(room, tx, ty + 1, biome) : fromTerrain;
  const wTerrain = tx > 0 ? resolveRoomBaseTerrain(room, tx - 1, ty, biome) : fromTerrain;
  const eTerrain = tx < cols - 1 ? resolveRoomBaseTerrain(room, tx + 1, ty, biome) : fromTerrain;

  let targetToTerrain: ClusterTerrainType | null = null;
  for (const candidate of TERRAIN_PRIORITY) {
    if (candidate === fromTerrain) break;
    if (
      nTerrain === candidate ||
      sTerrain === candidate ||
      wTerrain === candidate ||
      eTerrain === candidate
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

      let localCol = 1;
      let localRow = 1;

      if (n && w) {
        localCol = 0;
        localRow = 0;
      } else if (n && e) {
        localCol = 2;
        localRow = 0;
      } else if (s && w) {
        localCol = 0;
        localRow = 2;
      } else if (s && e) {
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

  const { localCol, localRow } = hashGeneralTileOffset(tx, ty);
  return {
    clusterAtlasId: GENERAL_CLUSTER_ATLAS_ID[fromTerrain],
    localCol,
    localRow,
    col: baseClusterCol * 3 + localCol,
    row: localRow,
  };
}

export function resolveClusterWallCoord(
  room: string[],
  tx: number,
  ty: number,
  biome: BiomeDefinition
): ResolvedClusterTileSlice | null {
  if (biome.clusterTileSheetBase64 === 'bog_tileset') {
    return resolveBogClusterWallCoord(room, tx, ty, biome);
  }

  const char = room[ty]?.[tx] || '.';
  const isWall = isClusterSolidWallChar(char);
  const isSinglePillar = isClusterSingleWallChar(char);

  if (!isWall && !isSinglePillar) return null;

  const terrain = resolveRoomBaseTerrain(room, tx, ty, biome);
  const clusterCol = TERRAIN_CLUSTER_COL[terrain];
  const baseRow = 4 * 3;
  const wallAtlasId = WALL_CLUSTER_ATLAS_ID[terrain];

  if (isSinglePillar) {
    const singleLocalCol = (tx + ty) % 2 === 0 ? 0 : 2;
    return {
      clusterAtlasId: wallAtlasId,
      localCol: singleLocalCol,
      localRow: 2,
      col: clusterCol * 3 + singleLocalCol,
      row: baseRow + 2,
    };
  }

  const { cols } = getRoomDimensions(room);
  const leftChar = tx > 0 ? room[ty]?.[tx - 1] : '#';
  const rightChar = tx < cols - 1 ? room[ty]?.[tx + 1] : '#';
  const hasLeftWall = isClusterSolidWallChar(leftChar);
  const hasRightWall = isClusterSolidWallChar(rightChar);

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

  let localCol = 1;
  if (!hasLeftWall && hasRightWall) {
    localCol = 0;
  } else if (hasLeftWall && !hasRightWall) {
    localCol = 2;
  } else {
    localCol = 1;
  }

  return {
    clusterAtlasId: wallAtlasId,
    localCol,
    localRow: 0,
    col: clusterCol * 3 + localCol,
    row: baseRow + 0,
  };
}

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

  const cellSize = TILE_SIZE;

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

  const cellSize = TILE_SIZE;

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

export function drawPlanarWaterReflections(
  g: CanvasRenderingContext2D,
  room: string[] | undefined,
  activeBiome: BiomeDefinition,
  state: OrionState
): void {
  if (!room) return;
  const pp = resolveBiomePostProcess(activeBiome);
  if (!pp.liquidReflection) return;

  const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(
    room,
    state.camX || 0,
    state.camY || 0,
    3
  );

  g.save();
  g.beginPath();
  let hasWater = false;
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (room[ty]?.[tx] === '~') {
        g.rect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        hasWater = true;
      }
    }
  }

  if (!hasWater) {
    g.restore();
    return;
  }

  g.clip();

  for (let ty = Math.max(1, minTy); ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (room[ty]?.[tx] !== '~') continue;
      const northChar = room[ty - 1]?.[tx];
      const sx = tx * TILE_SIZE;
      const sy = ty * TILE_SIZE;
      const rippleShift = Math.sin(state.t * 4.5 + tx * 1.3 + ty * 0.9) * 1.5;

      if (northChar === 'P' || northChar === '#') {
        g.fillStyle = 'rgba(200, 185, 128, 0.22)';
        g.fillRect(sx + 3 + rippleShift, sy, 10, 8);
        g.fillStyle = 'rgba(255, 255, 255, 0.12)';
        g.fillRect(sx + 4 - rippleShift, sy + 3, 8, 1);
      } else if (northChar === 'L') {
        const lanternColor =
          state.flags?.poe_state === 'helped'
            ? 'rgba(56, 189, 248, 0.38)'
            : 'rgba(251, 191, 36, 0.35)';
        g.fillStyle = lanternColor;
        g.beginPath();
        g.ellipse(sx + 8 + rippleShift, sy + 5, 4, 6, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  for (const e of state.enemies) {
    if (e.isSubmerged) continue;
    const ripple = Math.sin(state.t * 5 + e.x * 0.2) * 1.5;
    const ry = e.y + 2 + e.z * Z_SCALE * 0.5;
    g.fillStyle = e.emissiveColor || '#94a3b8';
    g.globalAlpha = 0.24;
    g.fillRect(e.x - 4 + ripple, ry, 8, 9);
    g.fillRect(e.x - 5 - ripple * 0.6, ry + 3, 10, 2);
  }

  if (!state.isFallingIntoPit) {
    const ripple = Math.sin(state.t * 5.5 + state.x * 0.25) * 1.5;
    const ry = state.y + 2 + state.z * Z_SCALE * 0.5;
    const reactorColor =
      state.reactor === 'Ichor' ? '#ea580c' : state.reactor === 'Mana' ? '#38bdf8' : '#a855f7';

    g.globalAlpha = 0.26;
    g.fillStyle = '#3b82f6';
    g.fillRect(state.x - 4 + ripple, ry, 8, 9);
    g.fillStyle = reactorColor;
    g.fillRect(state.x - 2 - ripple * 0.5, ry + 3, 4, 3);
  }

  g.globalAlpha = 0.28;
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (room[ty]?.[tx] !== '~') continue;
      const sx = tx * TILE_SIZE;
      const sy = ty * TILE_SIZE;
      const wave = Math.sin(state.t * 3 + tx * 1.7 + ty * 2.1) * 2.5;
      g.fillStyle = activeBiome.tileAssets.waterRippleColor || '#a855f7';
      g.fillRect(Math.round(sx + 3 + wave), Math.round(sy + 4), 5, 1);
      g.fillRect(Math.round(sx + 8 - wave), Math.round(sy + 11), 4, 1);
    }
  }

  g.restore();
}

export function drawDirectionalCastShadowsAndLandmarks(
  g: CanvasRenderingContext2D,
  room: string[],
  state: OrionState
): void {
  const { widthPx, heightPx } = getRoomDimensions(room);
  const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(
    room,
    state.camX || 0,
    state.camY || 0,
    4
  );
  const lighting = resolveRoomLightingProfile(state, room);

  g.save();

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const ch = room[ty]?.[tx];
      const cx = tx * TILE_SIZE + 8;
      const cy = ty * TILE_SIZE + 8;

      if (ch === 'D' && state.room === '-3,0') {
        g.strokeStyle = 'rgba(15, 23, 42, 0.55)';
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(cx + 8, cy + 6, 34, 22, -0.15, 0, Math.PI * 2);
        g.stroke();

        g.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(cx + 6, cy + 4, 22, 14, -0.15, 0, Math.PI * 2);
        g.stroke();
      } else if (ch === 'A') {
        const isLit =
          state.room === '0,0' || state.rx === 0 && state.ry === 0
            ? Boolean(state.flags?.first_campfire_lit)
            : true;
        if (isLit) {
          const hearthPulse = 26 + Math.sin(state.t * 3.5) * 2;
          const hearthGrad = g.createRadialGradient(cx, cy, 4, cx, cy, hearthPulse);
          hearthGrad.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
          hearthGrad.addColorStop(0.6, 'rgba(249, 115, 22, 0.12)');
          hearthGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          g.fillStyle = hearthGrad;
          g.beginPath();
          g.arc(cx, cy, hearthPulse, 0, Math.PI * 2);
          g.fill();
        }
      } else if (ch === 'L') {
        const isLit = state.flags?.poe_state === 'helped' || hasPoeLanternGuidance(state);
        const lRadius = (isLit ? 28 : 18) + Math.sin(state.t * 3) * 2;
        const lGrad = g.createRadialGradient(cx, cy, 3, cx, cy, lRadius);
        lGrad.addColorStop(
          0,
          isLit ? 'rgba(34, 211, 238, 0.28)' : 'rgba(251, 191, 36, 0.2)'
        );
        lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        g.fillStyle = lGrad;
        g.beginPath();
        g.arc(cx, cy, lRadius, 0, Math.PI * 2);
        g.fill();
      } else if (ch === 'S') {
        g.strokeStyle = 'rgba(148, 163, 184, 0.26)';
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(cx, cy + 2, 18, 11, 0, 0, Math.PI * 2);
        g.stroke();
      } else if (ch === '_') {
        const trapVis = getPointVisibilityFactor(cx, cy, state, room);
        if (trapVis < 0.65) {
          const concealAlpha = Math.min(0.78, (0.65 - trapVis) * 1.15);
          g.fillStyle = `rgba(18, 22, 28, ${concealAlpha.toFixed(2)})`;
          g.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  const isDesyncSolidNow = Math.floor(state.t / 3.5) % 2 === 0;
  g.fillStyle = 'rgba(2, 6, 16, 0.36)';
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const ch = room[ty]?.[tx];
      const isSolidWallTile = ch === '#' || (ch === '%' && isDesyncSolidNow);
      if (!isSolidWallTile && ch !== 'P' && ch !== 'G' && ch !== 'D') continue;
      const sx = tx * TILE_SIZE;
      const sy = ty * TILE_SIZE;

      const eastChar = room[ty]?.[tx + 1];
      const southChar = room[ty + 1]?.[tx];
      const seChar = room[ty + 1]?.[tx + 1];
      const southIsWall = southChar === '#' || (southChar === '%' && isDesyncSolidNow);
      const eastIsWall = eastChar === '#' || (eastChar === '%' && isDesyncSolidNow);
      const seIsWall = seChar === '#' || (seChar === '%' && isDesyncSolidNow);

      if (ch === 'P' || ch === 'D') {
        g.beginPath();
        g.ellipse(sx + 13, sy + 14, 7, 4, 0.35, 0, Math.PI * 2);
        g.fill();
      } else {
        if (southChar && !southIsWall && southChar !== '_') {
          g.fillRect(sx + 2, sy + TILE_SIZE, TILE_SIZE - 1, 5);
        }
        if (eastChar && !eastIsWall && eastChar !== '_') {
          g.fillRect(sx + TILE_SIZE, sy + 3, 5, TILE_SIZE - 2);
        }
        if (
          seChar &&
          !seIsWall &&
          seChar !== '_' &&
          !southIsWall &&
          !eastIsWall
        ) {
          g.fillRect(sx + TILE_SIZE, sy + TILE_SIZE, 4, 4);
        }
      }
    }
  }

  const cornerAlpha = Math.min(0.86, lighting.cornerShadowIntensity * 0.72);
  if (cornerAlpha > 0.05) {
    const cornerRadius = Math.max(56, Math.min(320, Math.min(widthPx, heightPx) * 0.52));
    const corners = [
      { x: 0, y: 0 },
      { x: widthPx, y: 0 },
      { x: 0, y: heightPx },
      { x: widthPx, y: heightPx },
    ];
    for (const c of corners) {
      const cGrad = g.createRadialGradient(c.x, c.y, 6, c.x, c.y, cornerRadius);
      cGrad.addColorStop(0, `rgba(2, 5, 13, ${cornerAlpha.toFixed(2)})`);
      cGrad.addColorStop(0.55, `rgba(4, 8, 18, ${(cornerAlpha * 0.48).toFixed(2)})`);
      cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = cGrad;
      g.fillRect(
        Math.max(0, c.x - cornerRadius),
        Math.max(0, c.y - cornerRadius),
        cornerRadius * 2,
        cornerRadius * 2
      );
    }
  }

  g.restore();
}

export function renderWorldLayer0And1(
  g: CanvasRenderingContext2D,
  room: string[] | undefined,
  activeBiome: BiomeDefinition,
  state: OrionState
): void {
  if (!room) return;
  const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(
    room,
    state.camX || 0,
    state.camY || 0,
    2
  );
  const defaultFloorTile = getTileDefinition('.', state.biomeId);

  // 1. LAYER 0: Ground, Transitions, Corrosive Aether & Sinkholes
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const char = room[ty]?.[tx] || '.';
      const tile = getTileDefinition(char, state.biomeId);
      const sx = tx * TILE_SIZE;
      const sy = ty * TILE_SIZE;

      const drewTileSprite =
        drawBase64Sprite(g, tile.layer0Sprite, sx, sy, state.t, {
          defaultAnchor: 'top-left',
          defaultWidth: TILE_SIZE,
          defaultHeight: TILE_SIZE,
        }) ||
        drawClusterBiomeLayer0(g, room, activeBiome, tx, ty, sx, sy, state.t);

      if (!drewTileSprite) {
        if (tile.renderLayer0) {
          tile.renderLayer0(g, tx, ty, sx, sy, state);
        } else {
          defaultFloorTile.renderLayer0?.(g, tx, ty, sx, sy, state);
        }
      }
    }
  }

  // 1B. POST-PROCESS PASS 1: Planar Water / Corrosive Aether ('~') Reflections
  drawPlanarWaterReflections(g, room, activeBiome, state);

  // 1C. LAYER 0.5: Directional 2.5D Wall/Tree Shadows, Landmarks & Room Corner Darkness
  drawDirectionalCastShadowsAndLandmarks(g, room, state);

  // 2. LAYER 1: Baked 2.5D Walls, Desync Barriers & Gates
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const char = room[ty]?.[tx] || '.';
      const tile = getTileDefinition(char, state.biomeId);
      const sx = tx * TILE_SIZE;
      const sy = ty * TILE_SIZE;

      if (tile.isDesync) {
        const isSolidPhase = Math.floor(state.t / 3.5) % 2 === 0;
        const phaseProgress = (state.t % 3.5) / 3.5;
        const isTransitioning = phaseProgress > 0.82;
        g.save();
        if (isSolidPhase) {
          g.globalAlpha = isTransitioning
            ? 0.65 + 0.35 * Math.sin(state.t * 36)
            : 1;
        } else {
          g.globalAlpha = isTransitioning
            ? 0.25 + 0.2 * Math.sin(state.t * 36)
            : 0.22;
        }
        const drewDesyncClusterWall =
          drawBase64Sprite(g, tile.layer1Sprite, sx, sy, state.t, {
            defaultAnchor: 'top-left',
            defaultWidth: TILE_SIZE,
            defaultHeight: TILE_SIZE,
          }) ||
          drawClusterBiomeWall(g, room, activeBiome, tx, ty, sx, sy, state.t);
        if (!drewDesyncClusterWall) {
          tile.renderLayer1?.(g, tx, ty, sx, sy, state);
        }
        g.restore();
        continue;
      }

      const drewLayer1Sprite =
        drawBase64Sprite(g, tile.layer1Sprite, sx, sy, state.t, {
          defaultAnchor: 'top-left',
          defaultWidth: TILE_SIZE,
          defaultHeight: TILE_SIZE,
        }) ||
        (isClusterSolidWallChar(char) &&
          drawClusterBiomeWall(g, room, activeBiome, tx, ty, sx, sy, state.t));

      if (!drewLayer1Sprite) {
        tile.renderLayer1?.(g, tx, ty, sx, sy, state);
      }
    }
  }
}
