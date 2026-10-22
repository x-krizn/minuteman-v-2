/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  COLOR_ARMOR,
  COLOR_CRITICAL,
  COLOR_FRAME,
  COLOR_HEAT,
  COLOR_SHIELD,
  DIR_VECTORS,
  getRoomDimensions,
  getRoomDoorwayCenterPx,
  SCREEN_H,
  SCREEN_W,
  TILE_SIZE,
  Z_SCALE,
} from '../constants';
import { getTraitDefinition } from '../database/characters';
import { getEnemyDefinition } from '../database/enemies';
import { getCoinPickupSpriteBase64, getItemDefinition } from '../database/items';
import { getWeaponGemVisuals } from '../database/progression';
import { getWeaponDefinition } from '../database/weapons';
import { getBiomeDefinition, getTileDefinition } from '../database/world';
import {
  Base64SpriteConfig,
  BiomeDefinition,
  BiomeWeatherType,
  ClusterTerrainType,
  OrionDir,
  OrionState,
} from '../types';

// ─── 1. BASE64 ASSET LOADER & 1PX SILHOUETTE CACHE ───────────────────────────

export interface Base64AtlasDefinition {
  id: string;
  name?: string;
  base64: string;
  cellWidth?: number;
  cellHeight?: number;
  /** Optional pre-baked offscreen HTMLCanvasElement (zero-latency startup cache) */
  canvas?: HTMLCanvasElement;
}

export type CachedSpriteSource = HTMLImageElement | HTMLCanvasElement;

export const BASE64_ATLAS_REGISTRY: Record<string, Base64AtlasDefinition> = {};

const IMAGE_CACHE = new Map<string, CachedSpriteSource>();
const OUTLINE_CACHE = new Map<string, HTMLCanvasElement>();

function getSourceDimensions(src: CachedSpriteSource): {
  width: number;
  height: number;
  ready: boolean;
} {
  if (typeof HTMLCanvasElement !== 'undefined' && src instanceof HTMLCanvasElement) {
    return { width: src.width, height: src.height, ready: src.width > 0 && src.height > 0 };
  }
  const img = src as HTMLImageElement;
  return {
    width: img.naturalWidth || img.width || 0,
    height: img.naturalHeight || img.height || 0,
    ready: Boolean(img.complete && (img.naturalWidth > 0 || img.width > 0)),
  };
}

export function registerCanvasAtlas(
  id: string,
  canvas: HTMLCanvasElement,
  cellWidth?: number,
  cellHeight?: number,
  name?: string
): void {
  BASE64_ATLAS_REGISTRY[id] = {
    id,
    name: name || id,
    base64: id,
    cellWidth,
    cellHeight,
    canvas,
  };
  IMAGE_CACHE.set(id, canvas);
}

export function registerBase64Atlas(
  id: string,
  base64: string,
  cellWidth?: number,
  cellHeight?: number,
  canvas?: HTMLCanvasElement
): void {
  if (canvas) {
    registerCanvasAtlas(id, canvas, cellWidth, cellHeight);
    return;
  }
  BASE64_ATLAS_REGISTRY[id] = { id, base64, cellWidth, cellHeight };
  getBase64Image(id);
}

export function normalizeBase64DataUri(base64OrKey: string): string {
  const trimmed = base64OrKey.trim();
  if (!trimmed) return '';
  const registered = BASE64_ATLAS_REGISTRY[trimmed];
  const raw = registered ? registered.base64.trim() : trimmed;
  if (!raw || (raw === trimmed && registered?.canvas)) return '';
  if (raw.startsWith('data:image/')) {
    return raw;
  }
  return `data:image/png;base64,${raw}`;
}

export function getBase64Image(base64OrKey: string): CachedSpriteSource | null {
  if (!base64OrKey) return null;

  const cached = IMAGE_CACHE.get(base64OrKey);
  if (cached) {
    const dims = getSourceDimensions(cached);
    return dims.ready ? cached : null;
  }

  const registered = BASE64_ATLAS_REGISTRY[base64OrKey];
  if (registered?.canvas) {
    IMAGE_CACHE.set(base64OrKey, registered.canvas);
    return registered.canvas;
  }

  if (typeof Image === 'undefined') return null;

  const dataUri = normalizeBase64DataUri(base64OrKey);
  if (!dataUri) return null;

  const existingByUri = IMAGE_CACHE.get(dataUri);
  if (existingByUri) {
    IMAGE_CACHE.set(base64OrKey, existingByUri);
    const dims = getSourceDimensions(existingByUri);
    return dims.ready ? existingByUri : null;
  }

  const img = new Image();
  img.decoding = 'sync';
  img.src = dataUri;
  IMAGE_CACHE.set(base64OrKey, img);
  IMAGE_CACHE.set(dataUri, img);

  const dims = getSourceDimensions(img);
  return dims.ready ? img : null;
}

export function getOutlinedSpriteCanvas(
  sourceKey: string,
  src: CachedSpriteSource,
  srcX: number,
  srcY: number,
  cellW: number,
  cellH: number,
  outlineColor: string
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const cacheKey = `${sourceKey}:${srcX},${srcY},${cellW},${cellH}:${outlineColor}`;
  const existing = OUTLINE_CACHE.get(cacheKey);
  if (existing) return existing;

  const outW = cellW + 2;
  const outH = cellH + 2;
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;

  const sil = document.createElement('canvas');
  sil.width = cellW;
  sil.height = cellH;
  const sctx = sil.getContext('2d');
  if (sctx) {
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(src, srcX, srcY, cellW, cellH, 0, 0, cellW, cellH);
    sctx.globalCompositeOperation = 'source-in';
    sctx.fillStyle = outlineColor;
    sctx.fillRect(0, 0, cellW, cellH);

    ctx.drawImage(sil, 0, 1);
    ctx.drawImage(sil, 2, 1);
    ctx.drawImage(sil, 1, 0);
    ctx.drawImage(sil, 1, 2);
  }

  ctx.drawImage(src, srcX, srcY, cellW, cellH, 1, 1, cellW, cellH);
  OUTLINE_CACHE.set(cacheKey, canvas);
  return canvas;
}

export interface DrawBase64SpriteOptions {
  dir?: OrionDir;
  stateName?: string;
  isHurt?: boolean;
  outlineColor?: string;
  defaultAnchor?: 'top-left' | 'center' | 'bottom-center';
  defaultWidth?: number;
  defaultHeight?: number;
  /** If true, transforms a sprite authored facing East ('E') to match `dir` */
  transformFromEast?: boolean;
  /** Additional rotation offset in radians */
  extraRotationRad?: number;
}

/**
 * Computes 2D canvas scale & rotation transforms for sprites authored with the character facing East ('E').
 * - East ('E'): identity (scaleX = 1, scaleY = 1, rot = 0)
 * - West ('W'): horizontal flip (scaleX = -1, scaleY = 1, rot = 0)
 * - South ('S'): +90 deg clockwise rotation (scaleX = 1, scaleY = 1, rot = +PI/2)
 * - North ('N'): -90 deg counter-clockwise rotation (scaleX = 1, scaleY = 1, rot = -PI/2)
 * - Intercardinals ('NE', 'SE', 'NW', 'SW'): East or West-mirrored with +/-45 deg rotation
 */
export function getEastDirectionalTransform(dir: OrionDir = 'E'): {
  scaleX: number;
  scaleY: number;
  rotationRad: number;
} {
  switch (dir) {
    case 'E':
      return { scaleX: 1, scaleY: 1, rotationRad: 0 };
    case 'W':
      return { scaleX: -1, scaleY: 1, rotationRad: 0 };
    case 'S':
      return { scaleX: 1, scaleY: 1, rotationRad: Math.PI / 2 };
    case 'N':
      return { scaleX: 1, scaleY: 1, rotationRad: -Math.PI / 2 };
    case 'SE':
      return { scaleX: 1, scaleY: 1, rotationRad: Math.PI / 4 };
    case 'NE':
      return { scaleX: 1, scaleY: 1, rotationRad: -Math.PI / 4 };
    case 'SW':
      return { scaleX: -1, scaleY: 1, rotationRad: -Math.PI / 4 };
    case 'NW':
      return { scaleX: -1, scaleY: 1, rotationRad: Math.PI / 4 };
    default:
      return { scaleX: 1, scaleY: 1, rotationRad: 0 };
  }
}

export function drawBase64Sprite(
  g: CanvasRenderingContext2D,
  config: Base64SpriteConfig | undefined,
  sx: number,
  sy: number,
  timeSec: number = 0,
  options?: DrawBase64SpriteOptions
): boolean {
  if (!config || !config.base64) return false;
  const src = getBase64Image(config.base64);
  if (!src) return false;

  const dims = getSourceDimensions(src);
  if (!dims.ready) return false;

  const atlasDef = BASE64_ATLAS_REGISTRY[config.base64];
  const cellW = config.cellWidth || atlasDef?.cellWidth || dims.width;
  const cellH = config.cellHeight || atlasDef?.cellHeight || dims.height;
  if (cellW <= 0 || cellH <= 0) return false;

  const baseCol = config.col ?? 0;
  const frameCount = Math.max(1, config.frameCount ?? 1);
  const fps = Math.max(1, config.fps ?? 6);
  const animOffset = frameCount > 1 ? Math.floor(timeSec * fps) % frameCount : 0;
  const col = baseCol + animOffset;

  let row = config.row ?? 0;
  if (
    options?.stateName &&
    config.stateRowMap &&
    config.stateRowMap[options.stateName] !== undefined
  ) {
    row = config.stateRowMap[options.stateName];
  } else if (options?.dir && config.dirRowMap && config.dirRowMap[options.dir] !== undefined) {
    row = config.dirRowMap[options.dir]!;
  }

  const srcX = col * cellW;
  const srcY = row * cellH;

  const scale = config.scale ?? 1;
  const destW = (config.renderWidth ?? options?.defaultWidth ?? cellW) * scale;
  const destH = (config.renderHeight ?? options?.defaultHeight ?? cellH) * scale;

  const anchor = config.anchor ?? options?.defaultAnchor ?? 'top-left';
  const pivotX = sx + (config.offsetX ?? 0);
  const pivotY = sy + (config.offsetY ?? 0);

  const useEastTransform = Boolean(
    (config.orientFromEast || options?.transformFromEast) && options?.dir
  );
  const eastTransform = useEastTransform
    ? getEastDirectionalTransform(options!.dir!)
    : { scaleX: 1, scaleY: 1, rotationRad: 0 };
  const totalRotation = eastTransform.rotationRad + (options?.extraRotationRad ?? 0);
  const hasTransform =
    eastTransform.scaleX !== 1 || eastTransform.scaleY !== 1 || totalRotation !== 0;

  let drawX = hasTransform ? 0 : pivotX;
  let drawY = hasTransform ? 0 : pivotY;

  if (anchor === 'center') {
    drawX -= destW / 2;
    drawY -= destH / 2;
  } else if (anchor === 'bottom-center') {
    drawX -= destW / 2;
    drawY -= destH;
  }

  const prevSmoothing = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;

  if (hasTransform) {
    g.save();
    g.translate(Math.round(pivotX), Math.round(pivotY));
    if (eastTransform.scaleX !== 1 || eastTransform.scaleY !== 1) {
      g.scale(eastTransform.scaleX, eastTransform.scaleY);
    }
    if (totalRotation !== 0) {
      g.rotate(totalRotation);
    }
  }

  const activeOutline = config.outlineColor || options?.outlineColor;
  if (activeOutline) {
    const outlined = getOutlinedSpriteCanvas(
      config.base64,
      src,
      srcX,
      srcY,
      cellW,
      cellH,
      activeOutline
    );
    if (outlined) {
      g.drawImage(
        outlined,
        0,
        0,
        outlined.width,
        outlined.height,
        Math.round(drawX - scale),
        Math.round(drawY - scale),
        destW + scale * 2,
        destH + scale * 2
      );
    } else {
      g.drawImage(
        src,
        srcX,
        srcY,
        cellW,
        cellH,
        Math.round(drawX),
        Math.round(drawY),
        destW,
        destH
      );
    }
  } else {
    g.drawImage(
      src,
      srcX,
      srcY,
      cellW,
      cellH,
      Math.round(drawX),
      Math.round(drawY),
      destW,
      destH
    );
  }

  if (options?.isHurt) {
    g.fillStyle = 'rgba(255, 255, 255, 0.6)';
    g.fillRect(Math.round(drawX), Math.round(drawY), destW, destH);
  }

  if (hasTransform) {
    g.restore();
  }

  g.imageSmoothingEnabled = prevSmoothing;
  return true;
}

// ─── 2. SUB-TILE MICRO-COMPOSER (`4×4` of `4px` & `2×2` of `8px` Quadrants) ──

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

// ─── 3. 3×3 CLUSTER & 4×5 BIOME TILESET AUTO-TILER ───────────────────────────

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
};

const TERRAIN_PRIORITY: ClusterTerrainType[] = ['ruins', 'grass', 'dirt', 'aether'];

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
  return null;
}

export function isClusterSolidWallChar(char: string | undefined): boolean {
  return char === '#';
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

  const dryOrder: ClusterTerrainType[] = ['ruins', 'grass', 'dirt'];

  // Solid outer/inner walls ('#'): require at least 2 adjacent floor tiles of a non-default terrain
  // so single isolated doorway tell tiles don't turn adjacent wall blocks into mismatched terrain walls.
  if (rawChar === '#') {
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

  // Pillars ('P') and interactive props ('C', 'L', 'A', 'Q', '1', '2', '3', etc.):
  // Prefer adjacent dry floor terrain over 'aether' liquid ('~') so props bordering water sit on dry ground.
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

export function resolveClusterLayer0Coord(
  room: string[],
  tx: number,
  ty: number,
  biome: BiomeDefinition
): ResolvedClusterTileSlice | null {
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

  // Strict one-way transition priority: only transition toward a cardinal neighbor with higher priority
  // than `fromTerrain` so two terrains never draw opposing border strips across the same seam.
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

// ─── 4. MULTI-PASS 2.5D POST-PROCESSING & VISUAL EFFECT LAYERS ───────────────

export interface SceneLightEmitter {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function resolveBiomePostProcess(biome: BiomeDefinition): {
  ambientDarkness: number;
  bloomIntensity: number;
  weather: BiomeWeatherType;
  weatherIntensity: number;
  liquidReflection: boolean;
  scanlines: boolean;
} {
  const custom = biome.postProcess || {};
  let defaultWeather: BiomeWeatherType = 'none';
  if (biome.id.includes('bog') || biome.id.includes('wetland')) {
    defaultWeather = 'rain';
  } else if (biome.id.includes('orc') || biome.id.includes('tyrranus')) {
    defaultWeather = 'ash';
  } else if (
    biome.id.includes('waygate') ||
    biome.id.includes('aether') ||
    biome.id.includes('ruins') ||
    biome.id.includes('border_town')
  ) {
    defaultWeather = 'aether_mist';
  }

  return {
    ambientDarkness: custom.ambientDarkness ?? 0.24,
    bloomIntensity: custom.bloomIntensity ?? 0.55,
    weather: custom.weather ?? defaultWeather,
    weatherIntensity: custom.weatherIntensity ?? 0.65,
    liquidReflection: custom.liquidReflection ?? true,
    scanlines: custom.scanlines ?? false,
  };
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

  const { cols, rows } = getRoomDimensions(room);

  g.save();
  g.beginPath();
  let hasWater = false;
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
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

  for (let ty = 1; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
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
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
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

export function drawEnhancedProjectilesAndBladeTrails(
  g: CanvasRenderingContext2D,
  state: OrionState
): void {
  if (state.bladeTrails && state.bladeTrails.length > 0) {
    g.save();
    for (const trail of state.bladeTrails) {
      const progress = 1 - Math.max(0, trail.life / Math.max(0.01, trail.maxLife));
      const alpha = Math.max(0, 1 - progress * progress);
      const cy = trail.y - trail.z * Z_SCALE - 6;
      const style = trail.style || 'slash';
      const coreColor = trail.coreColor || '#ffffff';
      const cos = Math.cos(trail.angle);
      const sin = Math.sin(trail.angle);
      const px = -sin;
      const py = cos;

      g.save();
      g.globalCompositeOperation = 'lighter';

      if (style === 'thrust') {
        // 1. LINEAR PIERCING THRUST (Short Spear, Avalon Lance, Stinger Thrust, Enraged Bors Lunge)
        const reach = (trail.length || trail.radius || 36) * (0.65 + 0.35 * Math.min(1, progress * 2.2));
        const halfW = (trail.width || 9) * 0.5 * (1 - progress * 0.35);
        const startDist = 5 + progress * 4;
        const sx = trail.x + cos * startDist;
        const sy = cy + sin * startDist;
        const tipX = trail.x + cos * reach;
        const tipY = cy + sin * reach;
        const neckX = trail.x + cos * Math.max(startDist, reach - 7);
        const neckY = cy + sin * Math.max(startDist, reach - 7);

        // Outer piercing corridor diamond/lance body
        g.globalAlpha = alpha * 0.52;
        g.fillStyle = trail.color;
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(neckX + px * halfW, neckY + py * halfW);
        g.lineTo(tipX + cos * 3, tipY + sin * 3);
        g.lineTo(neckX - px * halfW, neckY - py * halfW);
        g.closePath();
        g.fill();

        // Air-displacement shock ring along the spear shaft
        const ringDist = startDist + (reach - startDist) * (0.45 + progress * 0.35);
        g.globalAlpha = alpha * 0.6;
        g.strokeStyle = trail.color;
        g.lineWidth = 1.4;
        g.beginPath();
        g.ellipse(
          trail.x + cos * ringDist,
          cy + sin * ringDist,
          2.5,
          halfW * 1.15,
          trail.angle,
          0,
          Math.PI * 2
        );
        g.stroke();

        // Razor-sharp inner needle core & tip flash
        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(tipX + cos * 2, tipY + sin * 2);
        g.stroke();

        g.fillStyle = coreColor;
        g.beginPath();
        g.arc(tipX, tipY, 2.2 * (1 - progress * 0.4), 0, Math.PI * 2);
        g.fill();
      } else if (style === 'slam') {
        // 2. BLUNT OVERHEAD CRUSH & GROUND IMPACT CRATER (Mace, Pavise Tremor, Normal Sir Bors)
        const offset = trail.length ?? 15;
        const impactR = (trail.width || trail.radius || 18) * (0.55 + progress * 0.55);
        const ix = trail.x + cos * offset;
        const iy = trail.y + sin * offset - trail.z * Z_SCALE;

        // Overhead downward crush streak
        if (offset > 0) {
          g.globalAlpha = alpha * 0.7;
          g.strokeStyle = trail.color;
          g.lineWidth = 5 * (1 - progress * 0.4);
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(trail.x + cos * 4, cy - 5 * (1 - progress));
          g.lineTo(ix, iy - 2);
          g.stroke();

          g.globalAlpha = alpha * 0.95;
          g.strokeStyle = coreColor;
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(trail.x + cos * 5, cy - 4 * (1 - progress));
          g.lineTo(ix, iy - 2);
          g.stroke();
        }

        // Ground-plane concussive crater ring (2.5D perspective ellipse)
        g.globalAlpha = alpha * 0.65;
        g.strokeStyle = trail.color;
        g.lineWidth = 3 * (1 - progress * 0.45);
        g.beginPath();
        g.ellipse(ix, iy + 2, impactR, impactR * 0.62, 0, 0, Math.PI * 2);
        g.stroke();

        g.globalAlpha = alpha * 0.9;
        g.strokeStyle = coreColor;
        g.lineWidth = 1.3;
        g.beginPath();
        g.ellipse(ix, iy + 2, impactR * 0.68, impactR * 0.42, 0, 0, Math.PI * 2);
        g.stroke();

        // Radial fracture spikes bursting from impact center
        g.strokeStyle = coreColor;
        g.lineWidth = 1.4;
        for (let k = 0; k < 6; k++) {
          const spkAng = trail.angle + (k * Math.PI) / 3 + 0.25;
          const r0 = impactR * 0.35;
          const r1 = impactR * 1.08;
          g.beginPath();
          g.moveTo(ix + Math.cos(spkAng) * r0, iy + 2 + Math.sin(spkAng) * r0 * 0.62);
          g.lineTo(ix + Math.cos(spkAng) * r1, iy + 2 + Math.sin(spkAng) * r1 * 0.62);
          g.stroke();
        }
      } else if (style === 'bash') {
        // 3. SHIELD BASH / PHALANX BARRIER SHOVE (Buckler, Heater, Pavise, Sir Percival)
        const pushDist = (trail.radius || 22) * (0.45 + progress * 0.55);
        const span = trail.arcSpan || Math.PI * 0.65;
        const startAng = trail.angle - span * 0.5;
        const endAng = trail.angle + span * 0.5;

        // Kinetic force lines pushing outward from wielder
        g.globalAlpha = alpha * 0.45;
        g.strokeStyle = trail.color;
        g.lineWidth = 2;
        for (const frac of [-0.32, 0, 0.32]) {
          const a = trail.angle + span * frac;
          g.beginPath();
          g.moveTo(trail.x + Math.cos(a) * 6, cy + Math.sin(a) * 6);
          g.lineTo(trail.x + Math.cos(a) * (pushDist - 2), cy + Math.sin(a) * (pushDist - 2));
          g.stroke();
        }

        // Thick double-banded phalanx wall arc
        g.globalAlpha = alpha * 0.65;
        g.strokeStyle = trail.color;
        g.lineWidth = 6.5 * (1 - progress * 0.3);
        g.lineCap = 'butt';
        g.beginPath();
        g.arc(trail.x, cy, pushDist, startAng, endAng);
        g.stroke();

        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2.2;
        g.beginPath();
        g.arc(trail.x, cy, pushDist + 1.5, startAng + 0.06, endAng - 0.06);
        g.stroke();
      } else if (style === 'chop') {
        // 4. HEAVY WEDGE AXE CHOP (Hand Axe, Orc Warrior, Scavenger)
        const dirSign = trail.flipDir ? -1 : 1;
        const span = trail.arcSpan || Math.PI * 0.62;
        const headAng = trail.angle + dirSign * span * (-0.45 + progress * 0.9);
        const tailAng = trail.angle - dirSign * span * 0.48;
        const rOuter = (trail.radius || 22) + progress * 2;
        const rInner = Math.max(6, rOuter - (trail.width || 12));

        // Heavy bearded-axe wedge polygon (thick at chopping head, narrow at tail)
        g.globalAlpha = alpha * 0.62;
        g.fillStyle = trail.color;
        g.beginPath();
        g.arc(trail.x, cy, rOuter, Math.min(tailAng, headAng), Math.max(tailAng, headAng));
        g.lineTo(
          trail.x + Math.cos(headAng) * rInner,
          cy + Math.sin(headAng) * rInner
        );
        g.arc(
          trail.x,
          cy,
          rInner + 4,
          Math.max(tailAng, headAng),
          Math.min(tailAng, headAng),
          true
        );
        g.closePath();
        g.fill();

        // Crisp outer cutting edge + chop impact spark at leading edge
        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2.4;
        g.lineCap = 'round';
        g.beginPath();
        g.arc(trail.x, cy, rOuter, Math.min(tailAng, headAng), Math.max(tailAng, headAng));
        g.stroke();

        const biteX = trail.x + Math.cos(headAng) * rOuter;
        const biteY = cy + Math.sin(headAng) * rOuter;
        g.fillStyle = coreColor;
        g.beginPath();
        g.arc(biteX, biteY, 2.5 * (1 - progress * 0.3), 0, Math.PI * 2);
        g.fill();
      } else if (style === 'whirlwind') {
        // 5. 360-DEGREE WHIRLWIND VORTEX CLEAVE (Whirlwind Sever, Berserker Cyclone)
        const r = (trail.radius || 28) * (0.8 + progress * 0.25);
        const rot = trail.angle + progress * Math.PI * 2.2;

        g.globalAlpha = alpha * 0.55;
        g.strokeStyle = trail.color;
        g.lineWidth = 6 * (1 - progress * 0.35);
        g.beginPath();
        g.arc(trail.x, cy, r, 0, Math.PI * 2);
        g.stroke();

        // Dual spinning inner & outer razor arcs
        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2.2;
        for (let b = 0; b < 2; b++) {
          const a0 = rot + b * Math.PI;
          g.beginPath();
          g.arc(trail.x, cy, r + (b === 0 ? 1.5 : -2), a0, a0 + Math.PI * 0.78);
          g.stroke();
        }
      } else if (style === 'shockwave') {
        // 6. EXPANDING 2.5D GROUND SHOCKWAVE / PULSE RING (Bell-Toll, Consecration, Bog Wurm, Reactor)
        const maxR = trail.radius || 32;
        const curR = maxR * (0.32 + progress * 0.68);
        const groundY = trail.y - trail.z * Z_SCALE + 1;

        g.globalAlpha = alpha * 0.6;
        g.strokeStyle = trail.color;
        g.lineWidth = 3.5 * (1 - progress * 0.45);
        g.beginPath();
        g.ellipse(trail.x, groundY, curR, curR * 0.65, 0, 0, Math.PI * 2);
        g.stroke();

        g.globalAlpha = alpha * 0.9;
        g.strokeStyle = coreColor;
        g.lineWidth = 1.4;
        g.beginPath();
        g.ellipse(trail.x, groundY, curR * 0.72, curR * 0.46, 0, 0, Math.PI * 2);
        g.stroke();
      } else if (style === 'claw_bite') {
        // 7. TWIN FANG / CLAW RAKE LUNGE (Bog Crawler, Bog Wurm, Feral Ambush)
        const reach = (trail.length || trail.radius || 22) * (0.55 + progress * 0.45);
        const spread = (trail.width || 12) * 0.5;
        for (const side of [-1, 1]) {
          const sx = trail.x + px * side * spread * 0.9;
          const sy = cy + py * side * spread * 0.9;
          const midX = trail.x + cos * (reach * 0.55) + px * side * spread * 0.55;
          const midY = cy + sin * (reach * 0.55) + py * side * spread * 0.55;
          const ex = trail.x + cos * reach + px * side * 1.5;
          const ey = cy + sin * reach + py * side * 1.5;

          g.globalAlpha = alpha * 0.65;
          g.strokeStyle = trail.color;
          g.lineWidth = 3.5 * (1 - progress * 0.35);
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(sx, sy);
          g.quadraticCurveTo(midX, midY, ex, ey);
          g.stroke();

          g.globalAlpha = alpha * 0.95;
          g.strokeStyle = coreColor;
          g.lineWidth = 1.5;
          g.beginPath();
          g.moveTo(sx, sy);
          g.quadraticCurveTo(midX, midY, ex, ey);
          g.stroke();
        }
      } else if (style === 'volley') {
        // 8. BOW RELEASE / BOLTCASTER MUZZLE CHEVRON WAVE (Great Bow, Gladius, Quiver, Tristan, Scout)
        const r = (trail.radius || 15) * (0.6 + progress * 0.5);
        const span = trail.arcSpan || Math.PI * 0.45;
        g.globalAlpha = alpha * 0.55;
        g.strokeStyle = trail.color;
        g.lineWidth = 3 * (1 - progress * 0.4);
        g.lineCap = 'round';
        g.beginPath();
        g.arc(trail.x, cy, r, trail.angle - span * 0.5, trail.angle + span * 0.5);
        g.stroke();

        g.globalAlpha = alpha * 0.9;
        g.strokeStyle = coreColor;
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(trail.x + cos * 5, cy + sin * 5);
        g.lineTo(trail.x + cos * (r + 4), cy + sin * (r + 4));
        g.stroke();
      } else {
        // 9. DIRECTIONAL CRESCENT SWORD / SHOTEL SLASH (Long Sword, Khopesh, Loyalist)
        const dirSign = trail.flipDir ? -1 : 1;
        const startAngle = trail.angle - trail.arcSpan * 0.5;
        const endAngle = trail.angle + trail.arcSpan * 0.5;
        const r = trail.radius + progress * 2.5;

        // Crescent fill body (thick in middle, tapered at ends)
        g.globalAlpha = alpha * 0.42;
        g.fillStyle = trail.color;
        g.beginPath();
        g.arc(trail.x, cy, r + 2, startAngle, endAngle);
        g.arc(
          trail.x - cos * 3,
          cy - sin * 3,
          Math.max(4, r - 4.5),
          endAngle,
          startAngle,
          true
        );
        g.closePath();
        g.fill();

        // Outer glowing slash trail
        g.globalAlpha = alpha * 0.65;
        g.strokeStyle = trail.color;
        g.lineWidth = 4.5 * (1 - progress * 0.4);
        g.lineCap = 'round';
        g.beginPath();
        g.arc(trail.x, cy, r, startAngle, endAngle);
        g.stroke();

        // Leading razor edge core
        const coreStart =
          dirSign > 0 ? startAngle + progress * trail.arcSpan * 0.25 : startAngle;
        const coreEnd =
          dirSign > 0 ? endAngle : endAngle - progress * trail.arcSpan * 0.25;
        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(trail.x, cy, r + 1, coreStart, coreEnd);
        g.stroke();
      }

      g.restore();
    }
    g.restore();
  }

  g.save();
  for (const p of state.projectiles) {
    const py = p.y - p.z * Z_SCALE;
    const speed = Math.hypot(p.vx, p.vy) || 1;
    const nx = p.vx / speed;
    const ny = p.vy / speed;
    const tailLen = Math.min(12, Math.max(4, speed * 0.055));

    g.strokeStyle = p.trailColor || p.color;
    g.globalAlpha = 0.65;
    g.lineWidth = Math.max(1.5, p.radius * 1.1);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(p.x, py);
    g.lineTo(p.x - nx * tailLen, py - ny * tailLen);
    g.stroke();

    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.42;
    g.fillStyle = p.trailColor || p.color;
    g.beginPath();
    g.arc(p.x, py, p.radius * 2.1, 0, Math.PI * 2);
    g.fill();
    g.restore();

    g.globalAlpha = 1.0;
    g.fillStyle = p.color;
    g.beginPath();
    g.arc(p.x, py, p.radius, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(p.x, py, Math.max(1, p.radius * 0.45), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

export function updateBladeTrails(state: OrionState, dt: number): void {
  if (!state.bladeTrails || state.bladeTrails.length === 0) return;
  for (let i = state.bladeTrails.length - 1; i >= 0; i--) {
    state.bladeTrails[i].life -= dt;
    if (state.bladeTrails[i].life <= 0) {
      state.bladeTrails.splice(i, 1);
    }
  }
}

export function drawBiomeWeatherLayer(
  g: CanvasRenderingContext2D,
  activeBiome: BiomeDefinition,
  state: OrionState
): void {
  const pp = resolveBiomePostProcess(activeBiome);
  if (pp.weather === 'none' || pp.weatherIntensity <= 0) return;

  g.save();
  const count = Math.round(18 * pp.weatherIntensity);

  if (pp.weather === 'rain') {
    g.strokeStyle = 'rgba(125, 211, 252, 0.32)';
    g.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 97.31;
      const cycle = (state.t * 1.8 + seed) % 1;
      const rx = ((seed * 43.7 + cycle * 28) % (SCREEN_W + 20)) - 10;
      const ry = cycle * (SCREEN_H + 16) - 8;

      g.beginPath();
      g.moveTo(rx, ry);
      g.lineTo(rx - 3, ry + 7);
      g.stroke();

      if (cycle > 0.85) {
        const splashR = (cycle - 0.85) * 20;
        const splashX = (seed * 61.3) % SCREEN_W;
        const splashY = (seed * 29.7) % SCREEN_H;
        g.strokeStyle = 'rgba(186, 230, 253, 0.25)';
        g.beginPath();
        g.ellipse(splashX, splashY, splashR, splashR * 0.45, 0, 0, Math.PI * 2);
        g.stroke();
        g.strokeStyle = 'rgba(125, 211, 252, 0.32)';
      }
    }
  } else if (pp.weather === 'ash') {
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 71.19;
      const px = (seed * 31 + state.t * 14 + Math.sin(state.t * 2 + i) * 6) % SCREEN_W;
      const py = (seed * 53 + state.t * 9) % SCREEN_H;
      const isEmber = i % 3 === 0;
      g.fillStyle = isEmber ? 'rgba(251, 146, 60, 0.65)' : 'rgba(148, 163, 184, 0.35)';
      g.fillRect(Math.round(px), Math.round(py), isEmber ? 2 : 1, isEmber ? 2 : 1);
    }
  } else if (pp.weather === 'aether_mist') {
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 59.47;
      const px = (seed * 37 + Math.sin(state.t * 1.4 + i) * 8 + SCREEN_W) % SCREEN_W;
      const py = (SCREEN_H - ((state.t * 10 + seed * 41) % SCREEN_H)) % SCREEN_H;
      const pulse = 0.25 + 0.35 * Math.sin(state.t * 3 + i * 1.7);
      g.fillStyle =
        i % 2 === 0
          ? `rgba(56, 189, 248, ${pulse.toFixed(2)})`
          : `rgba(192, 132, 252, ${pulse.toFixed(2)})`;
      g.fillRect(Math.round(px), Math.round(py), 1.5, 1.5);
    }
  }

  g.restore();
}

export function drawDynamicLightingAndBloomPass(
  g: CanvasRenderingContext2D,
  room: string[] | undefined,
  activeBiome: BiomeDefinition,
  state: OrionState,
  camX: number = 0,
  camY: number = 0
): void {
  const pp = resolveBiomePostProcess(activeBiome);
  const lights: SceneLightEmitter[] = [];

  if (!state.isFallingIntoPit) {
    const py = state.y - state.z * Z_SCALE - 8;
    const reactorColor =
      state.reactor === 'Ichor' ? '#f97316' : state.reactor === 'Mana' ? '#38bdf8' : '#c084fc';
    const boostMult = state.isContinuousBoosting || (state.overdriveTimer || 0) > 0 ? 1.35 : 1.0;
    lights.push({
      x: state.x,
      y: py,
      radius: 26 * boostMult,
      color: reactorColor,
      intensity: 0.26 * boostMult,
    });
  }

  const activeFogNode = state.fogGraph?.nodes?.[state.room];
  const hasLanternGuidance =
    state.flags?.poe_state === 'helped' ||
    Boolean(state.flags?.poe_lantern_gift) ||
    state.inventorySlots.some((s) => s.itemId === 'poe_lantern_charm');

  if (activeFogNode?.trueExitDir) {
    const dir = activeFogNode.trueExitDir;
    const doorPos = getRoomDoorwayCenterPx(room, dir);
    lights.push({
      x: doorPos.x,
      y: doorPos.y,
      radius: hasLanternGuidance ? 28 : 16,
      color: hasLanternGuidance ? '#38bdf8' : '#22d3ee',
      intensity: hasLanternGuidance ? 0.3 : 0.15,
    });
  }

  if (room) {
    const { cols, rows } = getRoomDimensions(room);
    const pulse = Math.sin(state.t * 4) * 2;
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const ch = room[ty]?.[tx];
        if (!ch || ch === '.' || ch === ',' || ch === ':' || ch === '#') continue;
        const cx = tx * TILE_SIZE + 8;
        const cy = ty * TILE_SIZE + 8;

        if (ch === 'L') {
          const isHelped = state.flags?.poe_state === 'helped';
          lights.push({
            x: cx,
            y: cy - 6,
            radius: (isHelped ? 34 : 22) + pulse,
            color: isHelped ? '#38bdf8' : '#fbbf24',
            intensity: isHelped ? 0.36 : 0.26,
          });
        } else if (ch === 'D') {
          lights.push({
            x: cx,
            y: cy - 4,
            radius: 28 + pulse,
            color: '#38bdf8',
            intensity: 0.28,
          });
        } else if (ch === 'A') {
          lights.push({
            x: cx,
            y: cy - 3,
            radius: 30 + pulse,
            color: '#f97316',
            intensity: 0.32,
          });
        } else if (ch === 'Q') {
          lights.push({
            x: cx,
            y: cy - 8,
            radius: 38 + pulse * 1.5,
            color: '#22d3ee',
            intensity: 0.38,
          });
        } else if (ch === '~' && (tx + ty) % 2 === 0) {
          lights.push({
            x: cx,
            y: cy,
            radius: 18,
            color: '#a855f7',
            intensity: 0.14,
          });
        }
      }
    }
  }

  for (const p of state.projectiles) {
    if (p.lightRadius && p.lightRadius > 0) {
      lights.push({
        x: p.x,
        y: p.y - p.z * Z_SCALE,
        radius: p.lightRadius,
        color: p.color,
        intensity: 0.25,
      });
    }
  }

  for (const e of state.enemies) {
    if (e.isSubmerged) continue;
    if (e.type === 'bog_poe' || e.type === 'lady_of_the_lake' || e.state === 'windup') {
      lights.push({
        x: e.x,
        y: e.y - e.z * Z_SCALE - 6,
        radius: e.state === 'windup' ? 24 : 20,
        color: e.state === 'windup' ? '#fbbf24' : e.emissiveColor || '#38bdf8',
        intensity: 0.24,
      });
    }
  }

  if (pp.bloomIntensity > 0 && lights.length > 0) {
    g.save();
    g.translate(-camX, -camY);
    g.globalCompositeOperation = 'lighter';
    for (const light of lights) {
      const alpha = Math.min(0.45, light.intensity * pp.bloomIntensity);
      const grad = g.createRadialGradient(light.x, light.y, 1, light.x, light.y, light.radius);
      grad.addColorStop(0, light.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.globalAlpha = alpha;
      g.fillStyle = grad;
      g.beginPath();
      g.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  if (pp.ambientDarkness > 0) {
    g.save();
    const vig = g.createRadialGradient(
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      SCREEN_W * 0.36,
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      SCREEN_W * 0.72
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, `rgba(6, 10, 18, ${pp.ambientDarkness.toFixed(2)})`);
    g.fillStyle = vig;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.restore();
  }

  if (state.flickerTimer > 0) {
    state.flickerTimer = Math.max(0, state.flickerTimer - 0.016);
    g.save();
    g.fillStyle = 'rgba(184, 164, 255, 0.09)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const tearY = Math.floor((state.t * 190) % SCREEN_H);
    g.fillStyle = 'rgba(56, 189, 248, 0.22)';
    g.fillRect(0, tearY, SCREEN_W, 2);
    g.fillStyle = 'rgba(232, 121, 249, 0.22)';
    g.fillRect(0, (tearY + 37) % SCREEN_H, SCREEN_W, 2);
    g.restore();
  }

  if (pp.scanlines) {
    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.14)';
    for (let y = 0; y < SCREEN_H; y += 2) {
      g.fillRect(0, y, SCREEN_W, 1);
    }
    g.restore();
  }
}

// ─── 5. 2.5D DEPTH-SORTED SCENE RENDERER (`drawOrionGame`) ───────────────────

export function drawOrionGame(
  g: CanvasRenderingContext2D,
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  g.fillStyle = '#090d14';
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const room = rooms[state.room];
  const { cols, rows, widthPx, heightPx } = getRoomDimensions(room);
  const activeBiome = getBiomeDefinition(state.biomeId);
  const defaultFloorTile = getTileDefinition('.', state.biomeId);

  // Compute smooth clamped camera (centered if room dimension is smaller than SCREEN_W / SCREEN_H)
  const targetCamX =
    widthPx <= SCREEN_W
      ? -Math.floor((SCREEN_W - widthPx) / 2)
      : Math.max(0, Math.min(widthPx - SCREEN_W, state.x - SCREEN_W / 2));
  const targetCamY =
    heightPx <= SCREEN_H
      ? -Math.floor((SCREEN_H - heightPx) / 2)
      : Math.max(0, Math.min(heightPx - SCREEN_H, state.y - SCREEN_H / 2));

  if (
    state.camRoomId !== state.room ||
    state.camX === undefined ||
    state.camY === undefined
  ) {
    state.camX = targetCamX;
    state.camY = targetCamY;
    state.camRoomId = state.room;
  } else {
    state.camX += (targetCamX - state.camX) * 0.22;
    state.camY += (targetCamY - state.camY) * 0.22;
  }

  const camX = Math.round(state.camX);
  const camY = Math.round(state.camY);

  g.save();
  g.translate(-camX, -camY);

  // 1. LAYER 0: Ground, Transitions, Corrosive Aether & Sinkholes
  if (room) {
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
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
  }

  // 2. LAYER 1: Baked 2.5D Walls, Desync Barriers & Gates
  if (room) {
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const char = room[ty]?.[tx] || '.';
        const tile = getTileDefinition(char, state.biomeId);
        const sx = tx * TILE_SIZE;
        const sy = ty * TILE_SIZE;

        const drewLayer1Sprite =
          drawBase64Sprite(g, tile.layer1Sprite, sx, sy, state.t, {
            defaultAnchor: 'top-left',
            defaultWidth: TILE_SIZE,
            defaultHeight: TILE_SIZE,
          }) ||
          (char === '#' && drawClusterBiomeWall(g, room, activeBiome, tx, ty, sx, sy, state.t));

        if (!drewLayer1Sprite) {
          tile.renderLayer1?.(g, tx, ty, sx, sy, state);
        }
      }
    }
  }

  // 3. LAYER 2: Collect & Depth-Sort Entities & Props
  interface RenderItem {
    y: number;
    draw: () => void;
  }
  const renderQueue: RenderItem[] = [];

  if (room) {
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const char = room[ty]?.[tx] || '.';
        const tile = getTileDefinition(char, state.biomeId);
        if (tile.propSprite || tile.renderProp25D || isClusterSingleWallChar(char)) {
          const sx = tx * TILE_SIZE + 8;
          const sy = ty * TILE_SIZE + 12;
          renderQueue.push({
            y: sy,
            draw: () => {
              const drewProp =
                drawBase64Sprite(g, tile.propSprite, sx, sy, state.t, {
                  defaultAnchor: 'bottom-center',
                }) ||
                (isClusterSingleWallChar(char) &&
                  drawClusterBiomeWall(
                    g,
                    room,
                    activeBiome,
                    tx,
                    ty,
                    tx * TILE_SIZE,
                    ty * TILE_SIZE,
                    state.t
                  ));
              if (!drewProp) {
                tile.renderProp25D?.(g, tx, ty, sx, sy, state);
              }
            },
          });
        }
      }
    }
  }

  for (const p of state.pickups) {
    renderQueue.push({
      y: p.y,
      draw: () => {
        const shadowR = Math.max(2, 5 * (1 - p.z / 60));
        g.fillStyle = 'rgba(0, 0, 0, 0.35)';
        g.beginPath();
        g.ellipse(p.x, p.y + 1, shadowR, shadowR * 0.5, 0, 0, Math.PI * 2);
        g.fill();

        const py = p.y - p.z * Z_SCALE;
        const bob = Math.sin(p.t * 5) * 2;
        const itemDef = p.itemId ? getItemDefinition(p.itemId) : undefined;

        const coinSpriteConfig =
          p.kind === 'scrap'
            ? {
                base64: getCoinPickupSpriteBase64(p.value || 1),
                cellWidth: 16,
                cellHeight: 16,
                col: 0,
                row: 0,
                renderWidth: 10,
                renderHeight: 10,
                anchor: 'bottom-center' as const,
                outlineColor: '#05070a',
              }
            : undefined;

        const drewIcon = drawBase64Sprite(
          g,
          itemDef?.iconSprite || coinSpriteConfig,
          p.x,
          py + bob,
          state.t,
          {
            defaultAnchor: 'bottom-center',
          }
        );

        if (!drewIcon) {
          if (p.kind === 'scrap') {
            g.fillStyle = '#ffd27d';
            g.fillRect(p.x - 2, py - 4 + bob, 4, 5);
            g.fillStyle = '#fffbeb';
            g.fillRect(p.x - 1, py - 3 + bob, 2, 2);
          } else {
            g.fillStyle = p.color || '#77c7ff';
            g.fillRect(p.x - 3, py - 5 + bob, 6, 6);
          }
        }
      },
    });
  }

  for (const e of state.enemies) {
    renderQueue.push({
      y: e.y,
      draw: () => {
        const ey = e.y - e.z * Z_SCALE;
        const isHurt = e.hurt > 0;
        const isWindup = e.state === 'windup';
        const def = getEnemyDefinition(e.type);

        if (e.isSubmerged && def?.render25D) {
          const handledFullDraw = def.render25D(g, e, state, ey, isHurt, isWindup);
          if (handledFullDraw === true) return;
        }

        const shadowR = Math.max(3, 8 * (1 - e.z / 60));
        g.fillStyle = 'rgba(0, 0, 0, 0.45)';
        g.beginPath();
        g.ellipse(e.x, e.y + 1, shadowR, shadowR * 0.5, 0, 0, Math.PI * 2);
        g.fill();

        if (isWindup) {
          const tellAng = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
          const tCos = Math.cos(tellAng);
          const tSin = Math.sin(tellAng);
          const tPx = -tSin;
          const tPy = tCos;
          const tellColor = e.emissiveColor || '#ffd27d';

          g.save();
          g.strokeStyle = tellColor;
          g.fillStyle = tellColor;
          g.lineWidth = 1.3;

          if (e.type === 'bors_knight' && e.enraged) {
            // Enraged Sir Bors: Long linear piercing lunge corridor telegraph
            const len = 38;
            const hw = 11;
            g.globalAlpha = 0.22;
            g.beginPath();
            g.moveTo(e.x + tPx * hw, e.y + tPy * hw);
            g.lineTo(e.x + tCos * len + tPx * hw, e.y + tSin * len + tPy * hw);
            g.lineTo(e.x + tCos * (len + 6), e.y + tSin * (len + 6));
            g.lineTo(e.x + tCos * len - tPx * hw, e.y + tSin * len - tPy * hw);
            g.lineTo(e.x - tPx * hw, e.y - tPy * hw);
            g.closePath();
            g.fill();
            g.globalAlpha = 0.85;
            g.stroke();
          } else if (e.type === 'bors_knight') {
            // Normal Sir Bors: Frontal ground slam impact circle telegraph
            const ix = e.x + tCos * 14;
            const iy = e.y + tSin * 14;
            g.globalAlpha = 0.2;
            g.beginPath();
            g.ellipse(ix, iy, 19, 13, 0, 0, Math.PI * 2);
            g.fill();
            g.globalAlpha = 0.85;
            g.stroke();
          } else if (e.type === 'percival_knight') {
            // Sir Percival: Wide phalanx shield-charge cone telegraph
            const r = 28;
            const span = Math.PI * 0.72;
            g.globalAlpha = 0.2;
            g.beginPath();
            g.moveTo(e.x, e.y);
            g.arc(e.x, e.y, r, tellAng - span * 0.5, tellAng + span * 0.5);
            g.closePath();
            g.fill();
            g.globalAlpha = 0.85;
            g.stroke();
          } else if (e.type === 'tristan_knight') {
            // Sir Tristan: 3-arrow fan trajectory lines
            g.globalAlpha = 0.75;
            for (const off of [-0.18, 0, 0.18]) {
              const a = tellAng + off;
              g.beginPath();
              g.moveTo(e.x + Math.cos(a) * 6, ey - 6 + Math.sin(a) * 6);
              g.lineTo(e.x + Math.cos(a) * 48, ey - 6 + Math.sin(a) * 48);
              g.stroke();
            }
          } else if (e.type === 'orc_scout') {
            // Orc Scout: Single ranged sightline ray
            g.globalAlpha = 0.75;
            g.beginPath();
            g.moveTo(e.x + tCos * 6, ey - 6 + tSin * 6);
            g.lineTo(e.x + tCos * 52, ey - 6 + tSin * 52);
            g.stroke();
          } else if (e.type === 'lady_of_the_lake') {
            // Lady of the Lake: 5-ray wave fan + radial water pulse ring
            g.globalAlpha = 0.65;
            for (const off of [-0.45, -0.22, 0, 0.22, 0.45]) {
              const a = tellAng + off;
              g.beginPath();
              g.moveTo(e.x + Math.cos(a) * 8, e.y + Math.sin(a) * 8);
              g.lineTo(e.x + Math.cos(a) * 42, e.y + Math.sin(a) * 42);
              g.stroke();
            }
            g.beginPath();
            g.ellipse(e.x, e.y, 26, 16, 0, 0, Math.PI * 2);
            g.stroke();
          } else {
            // Orc Warrior / Bog Crawler / Bog Wurm / Feral NPC: Directional attack sector
            const r = e.type === 'bog_wurm' ? 26 : 23;
            const span =
              e.type === 'bog_crawler'
                ? Math.PI * 0.55
                : e.type === 'orc_warrior'
                  ? Math.PI * 0.8
                  : Math.PI * 0.7;
            g.globalAlpha = 0.18;
            g.beginPath();
            g.moveTo(e.x, e.y);
            g.arc(e.x, e.y, r, tellAng - span * 0.5, tellAng + span * 0.5);
            g.closePath();
            g.fill();
            g.globalAlpha = 0.82;
            g.stroke();
          }
          g.restore();
        }

        const drewEnemySprite = drawBase64Sprite(g, def?.sprite, e.x, ey, state.t, {
          dir: e.dir,
          stateName: e.state,
          isHurt,
          defaultAnchor: 'bottom-center',
        });

        if (!drewEnemySprite) {
          if (def?.render25D) {
            def.render25D(g, e, state, ey, isHurt, isWindup);
          } else {
            g.fillStyle = isHurt ? '#ffffff' : e.emissiveColor || '#64748b';
            g.fillRect(e.x - 5, ey - 14, 10, 14);
          }
        }

        const barW = 16;
        g.fillStyle = '#000000';
        g.fillRect(e.x - barW / 2, ey - 22, barW, 3);
        const framePct = Math.max(0, e.frame.integrity / e.frame.maxIntegrity);
        g.fillStyle = e.npcDisposition === 'calm' ? '#7dd3fc' : '#8dd7ad';
        g.fillRect(e.x - barW / 2, ey - 22, barW * framePct, 3);

        if (state.lockedTargetId === e.id) {
          const pulse = 9 + Math.sin(state.t * 8) * 1.5;
          g.strokeStyle = '#38bdf8';
          g.lineWidth = 1.2;
          g.beginPath();
          g.arc(e.x, ey - 9, pulse, 0, Math.PI * 2);
          g.stroke();

          g.fillStyle = '#fbbf24';
          g.fillRect(e.x - pulse - 1, ey - 9 - pulse, 3, 1);
          g.fillRect(e.x + pulse - 2, ey - 9 - pulse, 3, 1);
          g.fillRect(e.x - pulse - 1, ey - 9 + pulse, 3, 1);
          g.fillRect(e.x + pulse - 2, ey - 9 + pulse, 3, 1);
        }
      },
    });
  }

  renderQueue.push({
    y: state.y,
    draw: () => {
      const isFalling = Boolean(state.isFallingIntoPit || state.z < 0);
      const scale = isFalling ? Math.max(0.15, 1 + state.z / 45) : 1.0;
      const alpha = isFalling ? Math.max(0, 1 + state.z / 40) : 1.0;

      if (!isFalling && state.z >= 0) {
        const shadowR = Math.max(3, 7 * (1 - state.z / 60));
        g.fillStyle = 'rgba(0, 0, 0, 0.45)';
        g.beginPath();
        g.ellipse(state.x, state.y + 1, shadowR, shadowR * 0.45, 0, 0, Math.PI * 2);
        g.fill();
      }

      const py = state.y - state.z * Z_SCALE;

      if (state.lockedTargetId !== null && !isFalling) {
        const lockedEnemy = state.enemies.find((en) => en.id === state.lockedTargetId);
        if (lockedEnemy) {
          g.strokeStyle = 'rgba(56, 189, 248, 0.28)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(state.x, py - 8);
          g.lineTo(lockedEnemy.x, lockedEnemy.y - lockedEnemy.z * Z_SCALE - 8);
          g.stroke();
        }
      }

      g.save();
      g.globalAlpha = alpha;
      if (scale < 1.0) {
        g.translate(state.x, py);
        g.scale(scale, scale);
        g.translate(-state.x, -py);
      }

      if (state.isBoosterDashing || state.isContinuousBoosting) {
        g.fillStyle = state.isContinuousBoosting ? '#38bdf8' : '#77c7ff';
        g.beginPath();
        g.arc(
          state.x - state.boosterDirX * 6,
          py - 6 - state.boosterDirY * 6,
          state.isContinuousBoosting ? 6 : 5,
          0,
          Math.PI * 2
        );
        g.fill();
      }

      const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
      const isFacingNorth = state.dir === 'N' || state.dir === 'NE' || state.dir === 'NW';
      const activeWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
      const weaponDef = getWeaponDefinition(activeWeaponId);
      const gemVis = getWeaponGemVisuals(state, activeWeaponId);

      const drawOffhandHardpoint = () => {
        if (state.equippedWeapons.length <= 1) return;
        const offIdx = (state.activeWeaponIndex + 1) % state.equippedWeapons.length;
        const offWeaponId = state.equippedWeapons[offIdx];
        const offDef = offWeaponId ? getWeaponDefinition(offWeaponId) : undefined;
        if (
          offDef &&
          (offDef.equipmentRole === 'shield' || offDef.equipmentRole === 'quiver') &&
          offDef.hardpointSprite
        ) {
          const offGemVis = getWeaponGemVisuals(state, offWeaponId);
          const ox = state.x - dirInfo.dx * 5 - dirInfo.dy * 4;
          const oy = py - 8 - dirInfo.dy * 3;
          drawBase64Sprite(
            g,
            {
              ...offDef.hardpointSprite,
              col: offGemVis.colIndex,
              renderWidth: 10,
              renderHeight: 10,
              orientFromEast: true,
            },
            ox,
            oy,
            state.t,
            {
              dir: state.dir,
              defaultAnchor: 'center',
              transformFromEast: true,
            }
          );
        }
      };

      const drawMainWeaponHardpoint = () => {
        const isAttacking = state.activeSkillSlot !== null && state.skillActionTimer > 0;
        const isSpearOrLance =
          activeWeaponId === 'short_spear' || activeWeaponId === 'avalon_siege_lance';
        const isMace = activeWeaponId === 'mace';
        const isShield = weaponDef?.equipmentRole === 'shield';
        const isRanged =
          weaponDef?.equipmentRole === 'ranged' || weaponDef?.equipmentRole === 'quiver';

        const thrustOffset = isAttacking
          ? isSpearOrLance
            ? 7
            : isShield
              ? 5
              : isRanged
                ? -1.5
                : 3
          : 0;
        const swingRot = isAttacking
          ? isSpearOrLance || isShield || isRanged
            ? 0
            : isMace
              ? 0.65
              : (state.ammo % 2 === 0 ? 1 : -1) * 0.52
          : 0;
        const slamDropY = isAttacking && isMace ? 3 : 0;

        const wx = state.x + dirInfo.dx * (7 + thrustOffset);
        const wy = py - 9 + dirInfo.dy * (5 + thrustOffset) + slamDropY;
        const mainHardpointSprite = weaponDef?.hardpointSprite
          ? {
              ...weaponDef.hardpointSprite,
              col: gemVis.colIndex,
              orientFromEast: true,
            }
          : undefined;

        const drewHardpointSprite = drawBase64Sprite(g, mainHardpointSprite, wx, wy, state.t, {
          dir: state.dir,
          defaultAnchor: 'center',
          transformFromEast: true,
          extraRotationRad: swingRot,
        });

        if (!drewHardpointSprite) {
          if (weaponDef?.renderHardpoint25D) {
            weaponDef.renderHardpoint25D(g, wx, wy, dirInfo.dx, dirInfo.dy, state);
          } else {
            g.fillStyle = '#94a3b8';
            g.fillRect(wx - 1, wy, 3, 6);
          }
        }
      };

      // When facing North, main weapon is in front of character (up-screen / behind body)
      if (isFacingNorth) {
        drawMainWeaponHardpoint();
      } else {
        drawOffhandHardpoint();
      }

      const traitDef = getTraitDefinition(state.traitLine);
      const drewPlayerSprite = drawBase64Sprite(g, traitDef?.sprite, state.x, py, state.t, {
        dir: state.dir,
        defaultAnchor: 'bottom-center',
      });

      if (!drewPlayerSprite) {
        const isCritical = state.frame.state === 'Critical';
        g.fillStyle = isCritical ? '#ff9b9b' : '#3b82f6';
        g.fillRect(state.x - 4, py - 13, 8, 11);

        const reactorColor =
          state.reactor === 'Ichor' ? '#ea580c' : state.reactor === 'Mana' ? '#38bdf8' : '#a855f7';
        g.fillStyle = reactorColor;
        g.fillRect(state.x - 2, py - 9, 4, 4);

        g.fillStyle = '#0f172a';
        g.fillRect(state.x - 3, py - 16, 6, 3);
        g.fillStyle = '#77c7ff';
        g.fillRect(state.x - 1, py - 15, 2, 1);
      }

      if (isFacingNorth) {
        drawOffhandHardpoint();
      } else {
        drawMainWeaponHardpoint();
      }

      g.restore();
    },
  });

  renderQueue.sort((a, b) => a.y - b.y);
  for (const item of renderQueue) {
    item.draw();
  }

  // 4. LAYER 3: Post-Processed Projectiles, Sweeping Blade Trails & Particles
  drawEnhancedProjectilesAndBladeTrails(g, state);

  for (const p of state.particles) {
    const py = p.y - p.z * Z_SCALE;
    if (p.label) {
      g.font = '6px "orion-font", monospace';
      g.fillStyle = '#000000';
      g.fillText(p.label, p.x + 0.5, py + 0.5);
      g.fillStyle = p.color;
      g.fillText(p.label, p.x, py);
    } else {
      g.fillStyle = p.color;
      g.fillRect(p.x, py, p.size, p.size);
    }
  }

  // End world-space camera translation before screen-space weather, vignette & HUD
  g.restore();

  // 4B. LAYER 3.5: Aether Fog Threshold Environmental Tells & Poe Lantern Resonance
  drawAetherFogWayfindingTells(g, state, room, camX, camY);

  // 5. LAYER 4: Biome Atmospheric Weather Pass
  drawBiomeWeatherLayer(g, activeBiome, state);

  // 6. LAYER 5: Dynamic Light Sources, Radial Bloom, Ambient Vignette & Desync Glitch Pass
  drawDynamicLightingAndBloomPass(g, room, activeBiome, state, camX, camY);

  // 7. LAYER 6: CANONICAL THREE DEFENSE LAYERS HUD
  if (!state.useStandardResolutionHud) {
    drawCanonicalHud(g, state);
  }
}

function drawAetherFogWayfindingTells(
  g: CanvasRenderingContext2D,
  state: OrionState,
  room: string[] | undefined,
  camX: number = 0,
  camY: number = 0
): void {
  const activeNode = state.fogGraph?.nodes?.[state.room];
  if (!activeNode) return;

  const hasLantern =
    state.flags?.poe_state === 'helped' ||
    Boolean(state.flags?.poe_lantern_gift) ||
    state.inventorySlots.some((s) => s.itemId === 'poe_lantern_charm');

  g.save();

  // If lost in a LOOP node, render a shifting peripheral Aether mist veil around the borders
  if (activeNode.nodeType === 'loop') {
    const mistPulse = 0.16 + 0.06 * Math.sin(state.t * 2.4);
    const mistGrad = g.createRadialGradient(
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      SCREEN_W * 0.24,
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      SCREEN_W * 0.68
    );
    mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    mistGrad.addColorStop(1, `rgba(34, 211, 238, ${mistPulse.toFixed(2)})`);
    g.fillStyle = mistGrad;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  // Doorway wayfinding:
  // - Lit Poe Lantern: reduced to the former "without" mode (5 subtle drifting motes, no wisp tether).
  // - Unlit ("without" mode): bare minimum 1-2 pixel faint shimmer right at the doorway threshold.
  const trueDir = activeNode.trueExitDir;
  if (trueDir) {
    g.save();
    g.translate(-camX, -camY);

    const doorPos = getRoomDoorwayCenterPx(room, trueDir);
    const doorX = doorPos.x;
    const doorY = doorPos.y;
    const flowDx = trueDir === 'E' ? 1 : trueDir === 'W' ? -1 : 0;
    const flowDy = trueDir === 'S' ? 1 : trueDir === 'N' ? -1 : 0;
    const perpDx = -flowDy;
    const perpDy = flowDx;

    if (hasLantern) {
      const moteCount = 5;
      for (let i = 0; i < moteCount; i++) {
        const phase = (state.t * 0.85 + i * 0.23) % 1;
        const spread = ((i % 5) - 2) * 4.5 + Math.sin(state.t * 3 + i) * 2;
        const distFromDoor = (1 - phase) * 18;
        const mx = doorX - flowDx * distFromDoor + perpDx * spread;
        const my = doorY - flowDy * distFromDoor + perpDy * spread;
        const alpha = Math.sin(phase * Math.PI) * 0.48;

        g.fillStyle = `rgba(56, 189, 248, ${alpha.toFixed(2)})`;
        g.fillRect(Math.round(mx), Math.round(my), 1.5, 1.5);
      }
    } else {
      // Bare-minimum unlit tell: faint 1-2px shimmer at doorway threshold
      for (let i = 0; i < 2; i++) {
        const phase = (state.t * 0.55 + i * 0.5) % 1;
        const spread = (i === 0 ? -1.5 : 1.5) + Math.sin(state.t * 2 + i) * 0.5;
        const distFromDoor = (1 - phase) * 5;
        const mx = doorX - flowDx * distFromDoor + perpDx * spread;
        const my = doorY - flowDy * distFromDoor + perpDy * spread;
        const alpha = Math.sin(phase * Math.PI) * 0.18;

        g.fillStyle = `rgba(56, 189, 248, ${alpha.toFixed(2)})`;
        g.fillRect(Math.round(mx), Math.round(my), 1, 1);
      }
    }

    g.restore();
  }

  g.restore();
}

function drawCanonicalHud(g: CanvasRenderingContext2D, state: OrionState): void {
  const barW = 44;
  const barH = 3;

  const shieldPct =
    state.shields.maxCapacity > 0
      ? Math.max(0, state.shields.capacity / state.shields.maxCapacity)
      : 0;
  g.fillStyle = '#000000';
  g.fillRect(4, 4, barW + 2, barH + 2);
  g.fillStyle = state.shields.overloaded ? '#ef4444' : COLOR_SHIELD;
  g.fillRect(5, 5, barW * (state.shields.overloaded ? 1 : shieldPct), barH);

  const armorPct = Math.max(0, state.armor.durability / state.armor.maxDurability);
  g.fillStyle = '#000000';
  g.fillRect(4, 9, barW + 2, barH + 2);
  g.fillStyle = COLOR_ARMOR;
  g.fillRect(5, 10, barW * armorPct, barH);

  const framePct = Math.max(0, state.frame.integrity / state.frame.maxIntegrity);
  const isCritical = state.frame.state === 'Critical';
  g.fillStyle = '#000000';
  g.fillRect(4, 14, barW + 2, barH + 2);
  g.fillStyle = isCritical ? COLOR_CRITICAL : COLOR_FRAME;
  g.fillRect(5, 15, barW * framePct, barH);

  const heatPct = Math.max(0, state.heat / state.maxHeat);
  g.fillStyle = '#000000';
  g.fillRect(4, 19, barW + 2, 2);
  g.fillStyle = COLOR_HEAT;
  g.fillRect(5, 20, barW * heatPct, 1);

  g.font = '6px "orion-font", monospace';
  g.fillStyle = '#ffffff';
  g.textAlign = 'left';
  g.fillText(
    `SHLD:${Math.round(state.shields.capacity)} ARM:${Math.round(state.armor.durability)} FRM:${state.frame.integrity}`,
    4,
    27
  );

  const activeWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const weaponDef = getWeaponDefinition(activeWeaponId);
  const isKhopesh = activeWeaponId === 'khopesh';

  g.textAlign = 'right';
  g.fillStyle = '#ffd27d';
  g.fillText(`SCRAP:${state.salvageScrap}`, SCREEN_W - 4, 9);

  if (state.isReloading) {
    g.fillStyle = '#f59e0b';
    g.fillText(isKhopesh ? 'STANCE...' : 'RELOADING...', SCREEN_W - 4, 17);
  } else {
    g.fillStyle = isKhopesh ? '#e879f9' : '#77c7ff';
    g.fillText(
      `${(weaponDef?.name || activeWeaponId).toUpperCase().slice(0, 8)} ${state.ammo}/${state.maxAmmo}`,
      SCREEN_W - 4,
      17
    );
  }

  g.textAlign = 'left';
  g.fillStyle = 'rgba(0, 0, 0, 0.7)';
  g.fillRect(4, SCREEN_H - 12, SCREEN_W - 8, 9);
  g.fillStyle = '#e2e8f0';
  g.fillText(
    isKhopesh
      ? '[X] SICKLE · [L] LUNGE · [R] DEFLECT · [Y] SWAP'
      : '[X] AUTO · [L] AP SLUG · [R] GRENADE · [Y] SWAP',
    6,
    SCREEN_H - 5
  );

  if (state.toastText && state.toastTimer > 0) {
    g.textAlign = 'center';
    g.fillStyle = 'rgba(0, 0, 0, 0.9)';
    g.fillRect(SCREEN_W / 2 - 62, SCREEN_H - 25, 124, 11);
    g.strokeStyle = '#38bdf8';
    g.lineWidth = 1;
    g.strokeRect(SCREEN_W / 2 - 61.5, SCREEN_H - 24.5, 123, 10);
    g.fillStyle = '#77c7ff';
    g.fillText(`${state.toastText} [A]`, SCREEN_W / 2, SCREEN_H - 17);
  } else if (state.promptText) {
    g.textAlign = 'center';
    g.fillStyle = 'rgba(0, 0, 0, 0.85)';
    g.fillRect(SCREEN_W / 2 - 58, SCREEN_H - 25, 116, 11);
    g.fillStyle = '#ffd27d';
    g.fillText(state.promptText, SCREEN_W / 2, SCREEN_H - 17);
  }
}
