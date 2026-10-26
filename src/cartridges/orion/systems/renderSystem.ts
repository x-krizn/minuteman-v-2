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
  getDoorwayAetherTransitionInfo,
  getRoomDimensions,
  getRoomDoorwayCenterPx,
  hasPoeLanternGuidance,
  PERFECT_BLOCK_WINDOW_SEC,
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
import {
  getBiomeDefinition,
  getTileDefinition,
  GLOBAL_ROOM_REGISTRY,
  LOCAL_ROOM_REGISTRY,
} from '../database/world';
import { drawCompositePlayerMech } from './playerSpriteSystem';
import {
  AetherCardinalDir,
  Base64SpriteConfig,
  BiomeDefinition,
  BiomeWeatherType,
  ClusterTerrainType,
  OrionDir,
  OrionState,
  RoomLightingProfile,
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

// ─── 3. 3×3 CLUSTER & 4×5 BIOME TILESET AUTO-TILER ───────────────────────────

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
    grass: { clusterRow: 0, clusterCol: 1 }, // Rows 01..03, Cols 04..06
    dirt: { clusterRow: 0, clusterCol: 2 }, // Rows 01..03, Cols 07..09
    ruins: { clusterRow: 0, clusterCol: 3 }, // Rows 01..03, Cols 10..12
    aether: { clusterRow: 0, clusterCol: 4 }, // Rows 01..03, Cols 13..15
  },
  grass: {
    mire: { clusterRow: 1, clusterCol: 1 }, // Rows 04..06, Cols 04..06
    dirt: { clusterRow: 1, clusterCol: 2 }, // Rows 04..06, Cols 07..09
    ruins: { clusterRow: 1, clusterCol: 3 }, // Rows 04..06, Cols 10..12
    aether: { clusterRow: 1, clusterCol: 4 }, // Rows 04..06, Cols 13..15
  },
  dirt: {
    grass: { clusterRow: 2, clusterCol: 1 }, // Rows 07..09, Cols 04..06
    mire: { clusterRow: 2, clusterCol: 2 }, // Rows 07..09, Cols 07..09
    ruins: { clusterRow: 2, clusterCol: 3 }, // Rows 07..09, Cols 10..12
    aether: { clusterRow: 2, clusterCol: 4 }, // Rows 07..09, Cols 13..15
  },
  ruins: {
    grass: { clusterRow: 3, clusterCol: 1 }, // Rows 10..12, Cols 04..06
    dirt: { clusterRow: 3, clusterCol: 2 }, // Rows 10..12, Cols 07..09
    mire: { clusterRow: 3, clusterCol: 3 }, // Rows 10..12, Cols 10..12
    // Note: ruins only transitions to water ('aether') as a raised platform / bridge via Cluster (5,3) (Rows 13..15, Cols 07..09)
  },
  aether: {
    mire: { clusterRow: 4, clusterCol: 1 }, // Rows 13..15, Cols 04..06
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

  // Solid outer/inner walls ('#'):
  // In the Swamp Biome ('bog_tileset'), tree walls connect with grass before dirt whenever possible,
  // so any wall touching grass prefers 'grass' over 'dirt'.
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

  // Pillars ('P') and interactive props ('C', 'L', 'A', 'Q', '1', '2', '3', etc.):
  // Prefer grass before dirt for 'P' tree pillars in bog_tileset so trees connect with grass first.
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

  // 1. PITFALLS / CHASMS ('_'): Use the 4 tiles that fade to black (02_05, 05_05, 08_05, 11_05)
  if (char === '_') {
    const northChar = ty > 0 ? room[ty - 1]?.[tx] : undefined;
    const pitTerrain =
      northChar && northChar !== '_'
        ? resolveRoomBaseTerrain(room, tx, ty - 1, biome)
        : resolveRoomBaseTerrain(room, tx, ty, biome);
    if (pitTerrain === 'mire') return makeBogTileSlice(2, 5); // 02_05: Dark stone fading to black
    if (pitTerrain === 'grass') return makeBogTileSlice(5, 5); // 05_05: Grass fading to black
    if (pitTerrain === 'ruins') return makeBogTileSlice(11, 5); // 11_05: Ruins brick fading to black
    return makeBogTileSlice(8, 5); // 08_05: Dirt fading to black
  }

  const fromTerrain = resolveRoomBaseTerrain(room, tx, ty, biome);
  const baseClusterRow = BOG_BASE_CLUSTER_ROW[fromTerrain];

  // 2. DUNGEON ENTRANCES ('M') & PERIMETER ROOM TRANSITIONS (Stair Tiles):
  // Stone stairs: 14_11 (N), 15_10 (W), 15_11 (S), 15_12 (E)
  // Dirt/Wood stairs: 14_14 (N), 15_13 (W), 15_14 (S), 15_15 (E)
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

  // 3. Under solid walls ('#') or pillars/trees ('P'), draw the matching base terrain floor
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

  // 4. RAISED RUINS PLATFORM / BRIDGE OVER WATER (Cluster 5,3: Rows 13..15, Cols 07..09):
  // Ruins (':') only transitions to water ('~') when used as a bridge or raised platform:
  // - Row 13 (13_07..13_09): Raised platform south edge (ruins continues North, water to South)
  // - Row 15 (15_07..15_09): Narrow bridge deck over water (water to North and South)
  // - Row 14 (14_07..14_09, 2nd from last row, middle cluster col): Retaining walls in the water tile directly South of the raised ruins platform/bridge
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

  // 5. 8-NEIGHBOR TERRAIN TRANSITIONS:
  // In each 3x3 transition cluster, `targetToTerrain` is in the CENTER (1,1) and `fromTerrain` is on the OUTSIDE.
  // Therefore:
  // - Neighbor to South (s) -> Top row of cluster (localRow = 0)
  // - Neighbor to North (n) -> Bottom row of cluster (localRow = 2)
  // - Neighbor to East  (e) -> Left col of cluster (localCol = 0)
  // - Neighbor to West  (w) -> Right col of cluster (localCol = 2)
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

  let spanCol = 1; // 0 = left end, 1 = middle, 2 = right end
  if (!hasLeftWall && hasRightWall) {
    spanCol = 0;
  } else if (hasLeftWall && !hasRightWall) {
    spanCol = 2;
  } else {
    spanCol = (tx + ty) % 3;
  }

  // 1. TEMPLE / MONASTERY RUINS FLOOR (':') -> Ruined Stone Walls (Cluster 5,4: 13_10..13_12 & 14_10, 14_12)
  if (terrain === 'ruins') {
    if (isSinglePillar || (!hasLeftWall && !hasRightWall)) {
      return (tx + ty) % 2 === 0 ? makeBogTileSlice(14, 10) : makeBogTileSlice(14, 12);
    }
    return makeBogTileSlice(13, 10 + spanCol);
  }

  // 2. DUNGEON / DARK STONE FLOOR (';') -> Dark Stone Walls (Row 1 centers: 02_08, 02_11, 02_14)
  if (terrain === 'mire') {
    const stoneCols = [8, 11, 14];
    if (isSinglePillar || (!hasLeftWall && !hasRightWall)) {
      return makeBogTileSlice(2, stoneCols[(tx + ty) % 3] || 11);
    }
    return makeBogTileSlice(2, stoneCols[spanCol] || 11);
  }

  // 3. WATER / CORROSIVE AETHER ('~') -> Water-Base Walls (14_07..14_09 & 11_14)
  if (terrain === 'aether') {
    if (isSinglePillar || (!hasLeftWall && !hasRightWall)) {
      return makeBogTileSlice(11, 14);
    }
    return makeBogTileSlice(14, 7 + spanCol);
  }

  // 4. FOREST / MARSH GRASS (',') -> Swamp Tree Walls (13_13..13_15 & 14_13, 14_15)
  //    or Grass-Topped Dirt Walls (05_08, 05_11, 05_14) when directly overlooking dirt
  if (terrain === 'grass') {
    if (isSinglePillar || (!hasLeftWall && !hasRightWall)) {
      return (tx + ty) % 2 === 0 ? makeBogTileSlice(14, 13) : makeBogTileSlice(14, 15);
    }
    if (southIsDirt && (tx + ty) % 2 === 0) {
      const grassDirtCols = [8, 11, 14]; // 05_08, 05_11, 05_14 grass-topped dirt walls
      return makeBogTileSlice(5, grassDirtCols[spanCol] || 11);
    }
    return makeBogTileSlice(13, 13 + spanCol); // Swamp tree canopy walls (13_13..13_15)
  }

  // 5. BOG MUD / PEAT DIRT ('.') -> Brown Dirt Walls (Row 3 centers: 08_08, 08_11, 08_14)
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

// [ORION-ANCHOR: RENDER-VISION-LIGHTING]
export interface ResolvedRoomLightingState {
  safetyTier: 'sanctuary' | 'trail' | 'hazard' | 'abyss';
  ambientDarkness: number;
  cornerShadowIntensity: number;
  effectiveVisionRadiusPx: number;
  ambientTintColor?: string;
  staticLightAnchors: Array<{ x: number; y: number; radius: number; color: string }>;
}

export function resolveRoomLightingProfile(
  state: OrionState,
  room?: string[]
): ResolvedRoomLightingState {
  const activeNode = state.fogGraph?.nodes?.[state.room];
  const localDef = LOCAL_ROOM_REGISTRY[state.room];
  const globalDef = activeNode?.id ? GLOBAL_ROOM_REGISTRY[activeNode.id] : undefined;
  const authoredProfile: RoomLightingProfile | undefined =
    localDef?.lighting || globalDef?.lighting;

  const isLoop = activeNode?.nodeType === 'loop';
  const loopDepth = Math.max(0, state.fogGraph?.loopDepth || activeNode?.loopDepth || 0);

  let safetyTier: 'sanctuary' | 'trail' | 'hazard' | 'abyss' =
    authoredProfile?.safetyTier ||
    (isLoop
      ? loopDepth >= 2
        ? 'abyss'
        : 'hazard'
      : state.room === '0,0' || state.room === '0,-2' || state.room === '-3,0' || state.room === '-4,0'
        ? 'sanctuary'
        : 'trail');

  const baseDarkness =
    authoredProfile?.ambientDarkness ??
    (safetyTier === 'sanctuary'
      ? 0.2
      : safetyTier === 'trail'
        ? 0.45
        : safetyTier === 'hazard'
          ? 0.58
          : 0.66);
  const ambientDarkness = isLoop
    ? Math.min(0.78, Math.max(baseDarkness, 0.54 + loopDepth * 0.06))
    : baseDarkness;

  const baseCornerShadow =
    authoredProfile?.cornerShadowIntensity ??
    (safetyTier === 'sanctuary'
      ? 0.38
      : safetyTier === 'trail'
        ? 0.66
        : safetyTier === 'hazard'
          ? 0.78
          : 0.86);
  const cornerShadowIntensity = isLoop
    ? Math.min(0.9, Math.max(baseCornerShadow, 0.72 + loopDepth * 0.05))
    : baseCornerShadow;

  const baseVisionPx =
    authoredProfile?.playerVisionRadiusPx ??
    (safetyTier === 'sanctuary'
      ? 124
      : safetyTier === 'trail'
        ? 74
        : safetyTier === 'hazard'
          ? 58
          : 50);
  const loopAdjustedVision = isLoop
    ? Math.max(42, baseVisionPx - loopDepth * 5)
    : baseVisionPx;

  // Hardware & Lantern bonuses to player vision & threat awareness
  const hasOpticsHead = Boolean(state.equipmentSlots?.head || state.gates?.opticsActive);
  const hasSensors = Boolean(state.equipmentSlots?.sensoryA || state.equipmentSlots?.sensoryB);
  const isOpticPulseActive = (state.opticMarkTimer || 0) > 0;
  const hasLantern = hasPoeLanternGuidance(state);

  const effectiveVisionRadiusPx =
    loopAdjustedVision +
    (hasOpticsHead ? 14 : 0) +
    (hasSensors ? 10 : 0) +
    (isOpticPulseActive ? 24 : 0) +
    (hasLantern ? 16 : 0);

  const staticLightAnchors: Array<{ x: number; y: number; radius: number; color: string }> = [];
  if (room) {
    const { cols, rows } = getRoomDimensions(room);
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const ch = room[ty]?.[tx];
        if (!ch) continue;
        const cx = tx * TILE_SIZE + 8;
        const cy = ty * TILE_SIZE + 8;
        if (ch === 'A') {
          staticLightAnchors.push({ x: cx, y: cy, radius: 74, color: '#f59e0b' });
        } else if (ch === 'L') {
          const isLit = state.flags?.poe_state === 'helped' || hasLantern;
          staticLightAnchors.push({
            x: cx,
            y: cy,
            radius: isLit ? 68 : 42,
            color: isLit ? '#22d3ee' : '#fbbf24',
          });
        } else if (ch === 'D') {
          staticLightAnchors.push({ x: cx, y: cy, radius: 56, color: '#38bdf8' });
        } else if (ch === 'Q') {
          staticLightAnchors.push({ x: cx, y: cy, radius: 76, color: '#22d3ee' });
        }
      }
    }
  }

  return {
    safetyTier,
    ambientDarkness,
    cornerShadowIntensity,
    effectiveVisionRadiusPx,
    ambientTintColor: authoredProfile?.ambientTintColor,
    staticLightAnchors,
  };
}

/**
 * Computes how visible a world coordinate `(x, y)` is to the pilot (`0.0` = shrouded in darkness, `1.0` = clear sight).
 * Combines the pilot's active vision & sensor cone with static sanctuary lights (Campfire, Poe Lantern, Drop-Pod Beacon, Waygate)
 * and active projectiles.
 */
export function getPointVisibilityFactor(
  x: number,
  y: number,
  state: OrionState,
  room?: string[]
): number {
  const lighting = resolveRoomLightingProfile(state, room);
  if (lighting.safetyTier === 'sanctuary' && lighting.ambientDarkness <= 0.24) {
    return 1.0;
  }

  const visionR = lighting.effectiveVisionRadiusPx;
  const distToPlayer = Math.hypot(x - state.x, y - state.y);

  // Directional forward awareness cone extends slightly further in the direction the pilot is facing
  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const dx = x - state.x;
  const dy = y - state.y;
  const dot = distToPlayer > 1 ? (dx * dirInfo.dx + dy * dirInfo.dy) / distToPlayer : 1;
  const directionalBonus = dot > 0.25 ? 1 + (dot - 0.25) * 0.24 : 1.0;
  const effPlayerR = visionR * directionalBonus;

  let bestVis = 0;
  if (distToPlayer <= effPlayerR * 0.78) {
    bestVis = 1.0;
  } else if (distToPlayer < effPlayerR * 1.38) {
    const t = (distToPlayer - effPlayerR * 0.78) / (effPlayerR * 0.6);
    bestVis = Math.max(0, 1 - t);
  }

  for (const anchor of lighting.staticLightAnchors) {
    const d = Math.hypot(x - anchor.x, y - anchor.y);
    if (d <= anchor.radius * 0.75) {
      return 1.0;
    }
    if (d < anchor.radius * 1.25) {
      const aVis = 1 - (d - anchor.radius * 0.75) / (anchor.radius * 0.5);
      if (aVis > bestVis) bestVis = aVis;
    }
  }

  for (const p of state.projectiles) {
    if (p.lightRadius && p.lightRadius > 0) {
      const d = Math.hypot(x - p.x, y - p.y);
      const pr = p.lightRadius * 1.6;
      if (d < pr) {
        const pVis = Math.max(0, 1 - d / pr);
        if (pVis > bestVis) bestVis = pVis;
      }
    }
  }

  return Math.max(0, Math.min(1, bestVis));
}

function drawDirectionalCastShadowsAndLandmarks(
  g: CanvasRenderingContext2D,
  room: string[],
  state: OrionState
): void {
  const { cols, rows, widthPx, heightPx } = getRoomDimensions(room);
  const lighting = resolveRoomLightingProfile(state, room);

  g.save();

  // 1. Sub-zone environmental storytelling ground landmarks
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const ch = room[ty]?.[tx];
      const cx = tx * TILE_SIZE + 8;
      const cy = ty * TILE_SIZE + 8;

      if (ch === 'D' && state.room === '-3,0') {
        // Drop-Pod Orbital Impact Scorch Rings & Fissure Glow
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
        // Sanctuary Campfire Warm Hearth Flagstone Ring
        const hearthPulse = 26 + Math.sin(state.t * 3.5) * 2;
        const hearthGrad = g.createRadialGradient(cx, cy, 4, cx, cy, hearthPulse);
        hearthGrad.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
        hearthGrad.addColorStop(0.6, 'rgba(249, 115, 22, 0.12)');
        hearthGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        g.fillStyle = hearthGrad;
        g.beginPath();
        g.arc(cx, cy, hearthPulse, 0, Math.PI * 2);
        g.fill();
      } else if (ch === 'L') {
        // Poe Lantern Sanctuary Resonance Ring
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
        // Sir Bedivere's Broken Temple Memorial Halo
        g.strokeStyle = 'rgba(148, 163, 184, 0.26)';
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(cx, cy + 2, 18, 11, 0, 0, Math.PI * 2);
        g.stroke();
      } else if (ch === '_') {
        // Conceal distant sinkhole/pit traps in mire shadow until within vision/optics range
        const trapVis = getPointVisibilityFactor(cx, cy, state);
        if (trapVis < 0.65) {
          const concealAlpha = Math.min(0.78, (0.65 - trapVis) * 1.15);
          g.fillStyle = `rgba(18, 22, 28, ${concealAlpha.toFixed(2)})`;
          g.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  // 2. Angled South-East 2.5D Cast Shadows from Walls ('#', '%'), Pillars ('P'), Gates ('G') & Wreckage ('D')
  const isDesyncSolidNow = Math.floor(state.t / 3.5) % 2 === 0;
  g.fillStyle = 'rgba(2, 6, 16, 0.36)';
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
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
        // Long angled pillar/pod shadow cast to the south-east
        g.beginPath();
        g.ellipse(sx + 13, sy + 14, 7, 4, 0.35, 0, Math.PI * 2);
        g.fill();
      } else {
        // Wall / Felled-Tree cast shadow onto walkable south & east neighbors
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

  // 3. World-Space Room Corner Darkness Gradients (makes room corners & recesses darker)
  const cornerAlpha = Math.min(0.86, lighting.cornerShadowIntensity * 0.72);
  if (cornerAlpha > 0.05) {
    const cornerRadius = Math.max(56, Math.min(widthPx, heightPx) * 0.52);
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

// [ORION-ANCHOR: RENDER-POST-PROCESS]
export function drawDynamicLightingAndBloomPass(
  g: CanvasRenderingContext2D,
  room: string[] | undefined,
  activeBiome: BiomeDefinition,
  state: OrionState,
  camX: number = 0,
  camY: number = 0
): void {
  const pp = resolveBiomePostProcess(activeBiome);
  const roomLighting = resolveRoomLightingProfile(state, room);
  const lights: SceneLightEmitter[] = [];

  if (!state.isFallingIntoPit) {
    const py = state.y - state.z * Z_SCALE - 8;
    const reactorColor =
      state.reactor === 'Ichor' ? '#f97316' : state.reactor === 'Mana' ? '#38bdf8' : '#c084fc';
    const boostMult = state.isContinuousBoosting || (state.overdriveTimer || 0) > 0 ? 1.35 : 1.0;
    lights.push({
      x: state.x,
      y: py,
      radius: 28 * boostMult,
      color: reactorColor,
      intensity: 0.26 * boostMult,
    });
  }

  const activeFogNode = state.fogGraph?.nodes?.[state.room];
  const hasLanternGuidance = hasPoeLanternGuidance(state);
  const cardinalDirs: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];

  if (activeFogNode && room) {
    for (const dir of cardinalDirs) {
      const transInfo = getDoorwayAetherTransitionInfo(state, dir);
      const isLoopDensityWarning =
        activeFogNode.nodeType === 'loop' && transInfo.increasesDensity;
      const isPoeLoopEntranceReveal =
        activeFogNode.nodeType !== 'loop' &&
        transInfo.isLoopEntrance &&
        hasLanternGuidance;

      if (isLoopDensityWarning || isPoeLoopEntranceReveal) {
        const doorPos = getRoomDoorwayCenterPx(room, dir);
        lights.push({
          x: doorPos.x,
          y: doorPos.y,
          radius: isLoopDensityWarning ? 18 + transInfo.nextDepth * 4 : 24,
          color: isLoopDensityWarning
            ? transInfo.nextDepth >= 3
              ? '#f43f5e'
              : '#c084fc'
            : '#22d3ee',
          intensity: isLoopDensityWarning ? 0.18 + transInfo.nextDepth * 0.05 : 0.26,
        });
      }
    }
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
            radius: (isHelped ? 46 : 28) + pulse,
            color: isHelped ? '#38bdf8' : '#fbbf24',
            intensity: isHelped ? 0.42 : 0.28,
          });
        } else if (ch === 'D') {
          lights.push({
            x: cx,
            y: cy - 4,
            radius: 36 + pulse,
            color: '#38bdf8',
            intensity: 0.32,
          });
        } else if (ch === 'A') {
          lights.push({
            x: cx,
            y: cy - 3,
            radius: 52 + pulse * 1.2,
            color: '#f97316',
            intensity: 0.42,
          });
        } else if (ch === 'Q') {
          lights.push({
            x: cx,
            y: cy - 8,
            radius: 48 + pulse * 1.5,
            color: '#22d3ee',
            intensity: 0.4,
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
      const alpha = Math.min(0.48, light.intensity * pp.bloomIntensity);
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

  // Dynamic Vision & Threat Shroud (brighter in sanctuaries, constricting in dark/hazard rooms)
  const effectiveDarkness = Math.max(pp.ambientDarkness * 0.5, roomLighting.ambientDarkness);
  if (effectiveDarkness > 0.05) {
    g.save();
    const playerScreenX = Math.max(0, Math.min(SCREEN_W, state.x - camX));
    const playerScreenY = Math.max(
      0,
      Math.min(SCREEN_H, state.y - state.z * Z_SCALE - camY - 6)
    );

    // Expand clear radius when standing near a Sanctuary hearth/lantern
    let nearSanctuaryBoost = 0;
    for (const anchor of roomLighting.staticLightAnchors) {
      const d = Math.hypot(state.x - anchor.x, state.y - anchor.y);
      if (d < anchor.radius * 1.2) {
        nearSanctuaryBoost = Math.max(
          nearSanctuaryBoost,
          (1 - d / (anchor.radius * 1.2)) * 42
        );
      }
    }

    const innerClearR = Math.max(
      20,
      Math.min(
        SCREEN_W * 0.55,
        roomLighting.effectiveVisionRadiusPx * 0.46 + nearSanctuaryBoost * 0.5
      )
    );
    const outerShroudR = Math.max(
      innerClearR + 28,
      Math.min(
        SCREEN_W * 0.95,
        roomLighting.effectiveVisionRadiusPx * 1.08 + nearSanctuaryBoost
      )
    );

    const vig = g.createRadialGradient(
      playerScreenX,
      playerScreenY,
      innerClearR,
      playerScreenX,
      playerScreenY,
      outerShroudR
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(
      0.62,
      `rgba(4, 8, 16, ${(effectiveDarkness * 0.55).toFixed(2)})`
    );
    vig.addColorStop(1, `rgba(2, 5, 12, ${effectiveDarkness.toFixed(2)})`);
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

    // 1C. LAYER 0.5: Directional 2.5D Wall/Tree Shadows, Landmarks & Room Corner Darkness
    drawDirectionalCastShadowsAndLandmarks(g, room, state);
  }

  // 2. LAYER 1: Baked 2.5D Walls, Desync Barriers & Gates
  if (room) {
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
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

        // Compute dynamic player awareness & visibility factor for this entity
        const isFriendlyOrSanctuary =
          e.type === 'bog_poe' || (e.type === 'town_npc' && e.npcDisposition !== 'feral');
        const rawVis = getPointVisibilityFactor(e.x, e.y, state, room);
        const visFactor =
          isFriendlyOrSanctuary || isHurt || isWindup || (state.opticMarkTimer || 0) > 0
            ? Math.max(rawVis, 0.85)
            : rawVis;

        // If a hostile enemy is outside the pilot's vision/sensor radius, shroud them in darkness
        // and reveal only subtle emissive eye glints or mire ripples!
        if (visFactor < 0.26 && !isFriendlyOrSanctuary) {
          g.save();
          const glintPulse = 0.25 + 0.2 * Math.sin(state.t * 5 + e.id);
          g.fillStyle = e.emissiveColor || '#ef4444';
          g.globalAlpha = glintPulse;
          g.fillRect(Math.round(e.x - 2), Math.round(ey - 10), 1.5, 1.5);
          g.fillRect(Math.round(e.x + 1), Math.round(ey - 10), 1.5, 1.5);
          g.restore();
          return;
        }

        if (e.isSubmerged && def?.render25D) {
          const handledFullDraw = def.render25D(g, e, state, ey, isHurt, isWindup);
          if (handledFullDraw === true) return;
        }

        g.save();
        if (visFactor < 0.95) {
          g.globalAlpha = Math.max(0.28, Math.min(1, 0.2 + visFactor * 0.85));
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

        if (visFactor >= 0.45 || isHurt || state.lockedTargetId === e.id) {
          const barW = 16;
          g.fillStyle = '#000000';
          g.fillRect(e.x - barW / 2, ey - 22, barW, 3);
          const framePct = Math.max(0, e.frame.integrity / e.frame.maxIntegrity);
          g.fillStyle = e.npcDisposition === 'calm' ? '#7dd3fc' : '#8dd7ad';
          g.fillRect(e.x - barW / 2, ey - 22, barW * framePct, 3);
        }

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

        g.restore();
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
        drawCompositePlayerMech(g, state, state.x, py, state.t, {
          dir: state.dir,
          isAttacking: state.activeSkillSlot !== null && state.skillActionTimer > 0,
        });
      }

      if (isFacingNorth) {
        drawOffhandHardpoint();
      } else {
        drawMainWeaponHardpoint();
      }

      if (state.isHoldingBlock) {
        const isPerfectWindow =
          (state.blockHoldTimer || 0) <= PERFECT_BLOCK_WINDOW_SEC;
        const blockAng = Math.atan2(dirInfo.dy, dirInfo.dx);
        g.save();
        g.strokeStyle = isPerfectWindow ? '#38bdf8' : '#93c5fd';
        g.lineWidth = isPerfectWindow ? 2.2 : 1.4;
        g.globalAlpha = isPerfectWindow ? 0.95 : 0.65;
        g.beginPath();
        g.arc(
          state.x,
          py - 8,
          isPerfectWindow ? 12 : 10,
          blockAng - Math.PI * 0.42,
          blockAng + Math.PI * 0.42
        );
        g.stroke();
        g.restore();
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

  const hasLantern = hasPoeLanternGuidance(state);

  g.save();

  // If inside an Æther Loop node, render a peripheral Æther mist veil scaled by depth (1 .. clvl+1)
  if (activeNode.nodeType === 'loop') {
    const maxDepth = Math.max(
      2,
      activeNode.loopMaxDepth || state.fogGraph?.loopMaxDepth || (state.level || 1) + 1
    );
    const loopDepth = Math.max(
      1,
      Math.min(maxDepth, state.fogGraph?.loopDepth || activeNode.loopDepth || 1)
    );
    const depthRatio = loopDepth / maxDepth;
    const baseMist = 0.12 + depthRatio * 0.24;
    const mistPulse = baseMist + 0.05 * Math.sin(state.t * (2.0 + depthRatio * 1.8));
    const innerR = SCREEN_W * Math.max(0.12, 0.28 - depthRatio * 0.14);
    const mistGrad = g.createRadialGradient(
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      innerR,
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      SCREEN_W * 0.68
    );
    mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    const veilRgb =
      loopDepth >= maxDepth
        ? '244, 63, 94'
        : loopDepth >= 2
          ? '192, 132, 252'
          : '34, 211, 238';
    mistGrad.addColorStop(1, `rgba(${veilRgb}, ${mistPulse.toFixed(2)})`);
    g.fillStyle = mistGrad;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  // Doorway Path Effect Rules:
  // 1. Inside an Æther Loop: path effect is applied ONLY to doorways where `increasesDensity` is true
  //    as a warning of increased Æther density in the next room/depth.
  // 2. Outside an Æther Loop (Safe room): the Poe Lamp reveals Æther Loop entrances (`isLoopEntrance`),
  //    but NEVER directs the player to any goals (`trueExitDir` is never highlighted).
  if (room) {
    const cardinalDirs: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];
    const maxDepth = Math.max(
      2,
      activeNode.loopMaxDepth || state.fogGraph?.loopMaxDepth || (state.level || 1) + 1
    );
    g.save();
    g.translate(-camX, -camY);

    for (const dir of cardinalDirs) {
      const transInfo = getDoorwayAetherTransitionInfo(state, dir);
      const isLoopDensityWarning =
        activeNode.nodeType === 'loop' && transInfo.increasesDensity;
      const isPoeLoopEntranceReveal =
        activeNode.nodeType !== 'loop' && transInfo.isLoopEntrance && hasLantern;

      if (!isLoopDensityWarning && !isPoeLoopEntranceReveal) {
        continue;
      }

      const doorPos = getRoomDoorwayCenterPx(room, dir);
      const doorX = doorPos.x;
      const doorY = doorPos.y;
      const flowDx = dir === 'E' ? 1 : dir === 'W' ? -1 : 0;
      const flowDy = dir === 'S' ? 1 : dir === 'N' ? -1 : 0;
      const perpDx = -flowDy;
      const perpDy = flowDx;

      if (isLoopDensityWarning) {
        const nextDepth = transInfo.nextDepth;
        const moteCount = Math.min(11, 3 + nextDepth * 2);
        const rgb = nextDepth >= maxDepth ? '244, 63, 94' : '192, 132, 252';
        for (let i = 0; i < moteCount; i++) {
          const phase = (state.t * (0.75 + nextDepth * 0.16) + i * 0.19) % 1;
          const spread =
            ((i % 5) - 2) * 4.2 + Math.sin(state.t * (2.6 + nextDepth * 0.4) + i) * 2.2;
          const distFromDoor = (1 - phase) * Math.min(28, 12 + nextDepth * 3);
          const mx = doorX - flowDx * distFromDoor + perpDx * spread;
          const my = doorY - flowDy * distFromDoor + perpDy * spread;
          const alpha = Math.sin(phase * Math.PI) * Math.min(0.85, 0.38 + nextDepth * 0.1);

          g.fillStyle = `rgba(${rgb}, ${alpha.toFixed(2)})`;
          g.fillRect(
            Math.round(mx),
            Math.round(my),
            nextDepth >= maxDepth ? 2 : 1.5,
            nextDepth >= maxDepth ? 2 : 1.5
          );
        }
      } else if (isPoeLoopEntranceReveal) {
        // Poe Lamp reveals Æther Loop entrance in a Safe room (cyan-violet lantern resonance)
        const moteCount = 5;
        for (let i = 0; i < moteCount; i++) {
          const phase = (state.t * 0.85 + i * 0.21) % 1;
          const spread = ((i % 5) - 2) * 4.0 + Math.sin(state.t * 3 + i) * 1.8;
          const distFromDoor = (1 - phase) * 15;
          const mx = doorX - flowDx * distFromDoor + perpDx * spread;
          const my = doorY - flowDy * distFromDoor + perpDy * spread;
          const alpha = Math.sin(phase * Math.PI) * 0.52;

          g.fillStyle =
            i % 2 === 0
              ? `rgba(34, 211, 238, ${alpha.toFixed(2)})`
              : `rgba(192, 132, 252, ${alpha.toFixed(2)})`;
          g.fillRect(Math.round(mx), Math.round(my), 1.5, 1.5);
        }
      }
    }

    g.restore();
  }

  g.restore();
}

function drawOutlinedCanvasText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillColor: string,
  outlineColor: string = '#020617'
): void {
  g.fillStyle = outlineColor;
  g.fillText(text, x - 1, y);
  g.fillText(text, x + 1, y);
  g.fillText(text, x, y - 1);
  g.fillText(text, x, y + 1);
  g.fillStyle = fillColor;
  g.fillText(text, x, y);
}

function drawCanonicalHud(g: CanvasRenderingContext2D, state: OrionState): void {
  const barW = 40;
  const barH = 2;

  const shieldPct =
    state.shields.maxCapacity > 0
      ? Math.max(0, state.shields.capacity / state.shields.maxCapacity)
      : 0;
  g.strokeStyle = '#020617';
  g.lineWidth = 1;
  g.strokeRect(3.5, 3.5, barW + 1, barH + 1);
  g.fillStyle = state.shields.overloaded ? '#ef4444' : COLOR_SHIELD;
  g.fillRect(4, 4, barW * (state.shields.overloaded ? 1 : shieldPct), barH);

  const armorPct = Math.max(0, state.armor.durability / state.armor.maxDurability);
  g.strokeRect(3.5, 7.5, barW + 1, barH + 1);
  g.fillStyle = COLOR_ARMOR;
  g.fillRect(4, 8, barW * armorPct, barH);

  const framePct = Math.max(0, state.frame.integrity / state.frame.maxIntegrity);
  const isCritical = state.frame.state === 'Critical';
  g.strokeRect(3.5, 11.5, barW + 1, barH + 1);
  g.fillStyle = isCritical ? COLOR_CRITICAL : COLOR_FRAME;
  g.fillRect(4, 12, barW * framePct, barH);

  const heatPct = Math.max(0, state.heat / state.maxHeat);
  if (heatPct > 0) {
    g.fillStyle = COLOR_HEAT;
    g.fillRect(4, 16, barW * heatPct, 1);
  }

  g.font = '6px "orion-font", monospace';
  const activeWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const isKhopesh = activeWeaponId === 'khopesh';

  g.textAlign = 'right';
  drawOutlinedCanvasText(g, `${state.salvageScrap}`, SCREEN_W - 4, 9, '#ffd27d');
  if (state.isReloading) {
    drawOutlinedCanvasText(
      g,
      `${state.reloadTimer.toFixed(1)}s`,
      SCREEN_W - 4,
      16,
      '#f59e0b'
    );
  } else {
    drawOutlinedCanvasText(
      g,
      `${state.ammo}/${state.maxAmmo}`,
      SCREEN_W - 4,
      16,
      isKhopesh ? '#e879f9' : '#77c7ff'
    );
  }

  // 5 Skill Icon slots along bottom center (transparent with cooldown overlay)
  const slotSize = 9;
  const gap = 3;
  const totalW = 5 * slotSize + 4 * gap;
  const startX = Math.floor((SCREEN_W - totalW) / 2);
  const slotY = SCREEN_H - slotSize - 3;
  const cds = [
    state.isReloading ? state.reloadTimer : 0,
    Math.max(0, state.skillCooldowns?.[1] || 0, state.actionCooldowns?.['weapon_skill_1'] || 0),
    Math.max(0, state.skillCooldowns?.[2] || 0, state.actionCooldowns?.['weapon_skill_2'] || 0),
    Math.max(0, state.skillCooldowns?.[3] || 0, state.actionCooldowns?.['weapon_skill_3'] || 0),
    Math.max(0, state.skillCooldowns?.[4] || 0, state.actionCooldowns?.['weapon_skill_4'] || 0),
  ];
  const slotColors = ['#38bdf8', '#fbbf24', '#c084fc', '#4ade80', '#f472b6'];

  g.textAlign = 'center';
  for (let i = 0; i < 5; i++) {
    const sx = startX + i * (slotSize + gap);
    const cd = cds[i];
    g.strokeStyle = cd > 0 ? '#475569' : slotColors[i];
    g.strokeRect(sx + 0.5, slotY + 0.5, slotSize - 1, slotSize - 1);
    if (cd > 0) {
      drawOutlinedCanvasText(
        g,
        cd.toFixed(1),
        sx + slotSize / 2,
        slotY + slotSize - 2,
        '#f8fafc'
      );
    } else {
      g.fillStyle = slotColors[i];
      g.fillRect(sx + 3, slotY + 3, 3, 3);
    }
  }

  // Contextual Outlined Pop-ups (no background container)
  const camX = Math.round(state.camX || 0);
  const camY = Math.round(state.camY || 0);
  const px = Math.max(24, Math.min(SCREEN_W - 24, state.x - camX));
  const py = Math.max(18, Math.min(SCREEN_H - 22, state.y - state.z * Z_SCALE - camY - 16));

  if (state.promptText) {
    g.textAlign = 'center';
    drawOutlinedCanvasText(g, state.promptText, px, py, '#fef08a');
  }

  if (state.toastText && state.toastTimer > 0) {
    g.textAlign = 'center';
    drawOutlinedCanvasText(g, state.toastText, SCREEN_W / 2, 18, '#7dd3fc');
  }
}

