/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../constants';
import { Base64SpriteConfig, BiomeDefinition, OrionDir } from '../types';

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

/**
 * Shared Atlas Registry (maps human-readable atlas IDs to Base64 PNGs or baked offscreen Canvases)
 */
export const BASE64_ATLAS_REGISTRY: Record<string, Base64AtlasDefinition> = {};

/**
 * Singleton pre-decoded HTMLImageElement / HTMLCanvasElement cache keyed by atlas ID or data URI.
 * Ensures zero-allocation 60fps blitting once decoded or baked in browser memory.
 */
const IMAGE_CACHE = new Map<string, CachedSpriteSource>();

/**
 * Offscreen 1px pixel-art silhouette outline cache keyed by `${sourceKey}:${srcX},${srcY},${cellW},${cellH}:${outlineColor}`
 */
const OUTLINE_CACHE = new Map<string, HTMLCanvasElement>();

function getSourceDimensions(src: CachedSpriteSource): { width: number; height: number; ready: boolean } {
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

/**
 * Register a pre-baked offscreen HTMLCanvasElement directly into the global atlas registry.
 * Eliminates large Base64 strings in source files while rendering immediately on frame 0.
 */
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

/**
 * Register a named Base64 PNG sprite or grid tileset/spritesheet in the global atlas registry.
 */
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

/**
 * Normalize an atlas key, raw Base64 payload, or full `data:image/png;base64,...` URI
 * into a valid Image `src` data URI.
 */
export function normalizeBase64DataUri(base64OrKey: string): string {
  const trimmed = base64OrKey.trim();
  if (!trimmed) return '';
  const registered = BASE64_ATLAS_REGISTRY[trimmed];
  const raw = registered ? registered.base64.trim() : trimmed;
  if (!raw || raw === trimmed && registered?.canvas) return '';
  if (raw.startsWith('data:image/')) {
    return raw;
  }
  return `data:image/png;base64,${raw}`;
}

/**
 * Retrieve (or lazily instantiate and cache) a decoded HTMLImageElement or pre-baked HTMLCanvasElement.
 */
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

/**
 * Bake and cache a 1px pixel-art silhouette outline around a sprite slice `(srcX, srcY, cellW, cellH)`
 * on an offscreen canvas (`cellW + 2` by `cellH + 2`).
 */
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

  // Stamp 4-neighbor silhouette copies in `outlineColor`
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

  // Draw crisp original sprite in center
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
}

/**
 * Draw an individual Base64 PNG, offscreen-baked sub-tile canvas, or grid spritesheet slice.
 * Supports automatic 1px pixel-art outlines (`outlineColor`) and hurt flashes.
 */
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

  // Resolve grid column (supports horizontal strip animation via frameCount & fps)
  const baseCol = config.col ?? 0;
  const frameCount = Math.max(1, config.frameCount ?? 1);
  const fps = Math.max(1, config.fps ?? 6);
  const animOffset = frameCount > 1 ? Math.floor(timeSec * fps) % frameCount : 0;
  const col = baseCol + animOffset;

  // Resolve grid row (supports stateRowMap and dirRowMap overrides for spritesheets)
  let row = config.row ?? 0;
  if (options?.stateName && config.stateRowMap && config.stateRowMap[options.stateName] !== undefined) {
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
  let drawX = sx + (config.offsetX ?? 0);
  let drawY = sy + (config.offsetY ?? 0);

  if (anchor === 'center') {
    drawX -= destW / 2;
    drawY -= destH / 2;
  } else if (anchor === 'bottom-center') {
    drawX -= destW / 2;
    drawY -= destH;
  }

  const prevSmoothing = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;

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
      g.drawImage(src, srcX, srcY, cellW, cellH, Math.round(drawX), Math.round(drawY), destW, destH);
    }
  } else {
    g.drawImage(src, srcX, srcY, cellW, cellH, Math.round(drawX), Math.round(drawY), destW, destH);
  }

  // Optional hurt flash overlay for 2.5D entities
  if (options?.isHurt) {
    g.fillStyle = 'rgba(255, 255, 255, 0.6)';
    g.fillRect(Math.round(drawX), Math.round(drawY), destW, destH);
  }

  g.imageSmoothingEnabled = prevSmoothing;
  return true;
}

/**
 * Draw a tile cell from a Biome's shared Base64 PNG tilemap (`biome.tileSheetBase64`)
 * if `biome.tileSheetCoords[tileKey]` is defined.
 */
export function drawBiomeSheetTile(
  g: CanvasRenderingContext2D,
  biome: BiomeDefinition,
  tileKey: string,
  sx: number,
  sy: number,
  timeSec: number = 0
): boolean {
  if (!biome.tileSheetBase64 || !biome.tileSheetCoords) return false;
  const cell = biome.tileSheetCoords[tileKey];
  if (!cell) return false;

  const defaultCellSize = biome.tileSheetCellSize || TILE_SIZE;
  return drawBase64Sprite(
    g,
    {
      base64: biome.tileSheetBase64,
      cellWidth: cell.cellWidth || defaultCellSize,
      cellHeight: cell.cellHeight || defaultCellSize,
      col: cell.col,
      row: cell.row,
      frameCount: cell.frameCount,
      fps: cell.fps,
      renderWidth: TILE_SIZE,
      renderHeight: TILE_SIZE,
      anchor: 'top-left',
    },
    sx,
    sy,
    timeSec
  );
}
