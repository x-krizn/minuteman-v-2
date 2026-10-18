/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../constants';
import { Base64SpriteConfig, BiomeDefinition, OrionDir } from '../../types';

export interface Base64AtlasDefinition {
  id: string;
  name?: string;
  base64: string;
  cellWidth?: number;
  cellHeight?: number;
}

/**
 * Shared Base64 Atlas Registry (maps human-readable atlas IDs to Base64 PNG strings)
 */
export const BASE64_ATLAS_REGISTRY: Record<string, Base64AtlasDefinition> = {};

/**
 * Singleton pre-decoded HTMLImageElement cache keyed by normalized data URI or atlas ID.
 * Ensures zero-allocation 60fps blitting once decoded in browser memory.
 */
const IMAGE_CACHE = new Map<string, HTMLImageElement>();

/**
 * Register a named Base64 PNG sprite or grid tileset/spritesheet in the global atlas registry.
 */
export function registerBase64Atlas(
  id: string,
  base64: string,
  cellWidth?: number,
  cellHeight?: number
): void {
  BASE64_ATLAS_REGISTRY[id] = { id, base64, cellWidth, cellHeight };
  // Pre-warm the image cache immediately in browser environments
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
  if (!raw) return '';
  if (raw.startsWith('data:image/')) {
    return raw;
  }
  return `data:image/png;base64,${raw}`;
}

/**
 * Retrieve (or lazily instantiate and cache) a decoded HTMLImageElement for a Base64 string or atlas ID.
 */
export function getBase64Image(base64OrKey: string): HTMLImageElement | null {
  if (!base64OrKey || typeof Image === 'undefined') return null;

  const cached = IMAGE_CACHE.get(base64OrKey);
  if (cached) {
    return cached.complete && cached.naturalWidth > 0 ? cached : null;
  }

  const dataUri = normalizeBase64DataUri(base64OrKey);
  if (!dataUri) return null;

  const existingByUri = IMAGE_CACHE.get(dataUri);
  if (existingByUri) {
    IMAGE_CACHE.set(base64OrKey, existingByUri);
    return existingByUri.complete && existingByUri.naturalWidth > 0 ? existingByUri : null;
  }

  const img = new Image();
  img.decoding = 'sync';
  img.src = dataUri;
  IMAGE_CACHE.set(base64OrKey, img);
  IMAGE_CACHE.set(dataUri, img);

  return img.complete && img.naturalWidth > 0 ? img : null;
}

export interface DrawBase64SpriteOptions {
  dir?: OrionDir;
  stateName?: string;
  isHurt?: boolean;
  defaultAnchor?: 'top-left' | 'center' | 'bottom-center';
  defaultWidth?: number;
  defaultHeight?: number;
}

/**
 * Draw an individual Base64 PNG or slice a cell/animation frame from a Base64 grid spritesheet/tilemap.
 * Returns `true` if drawn, or `false` if no valid image is ready (allowing automatic procedural fallback).
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
  const img = getBase64Image(config.base64);
  if (!img) return false;

  const atlasDef = BASE64_ATLAS_REGISTRY[config.base64];
  const cellW = config.cellWidth || atlasDef?.cellWidth || img.naturalWidth;
  const cellH = config.cellHeight || atlasDef?.cellHeight || img.naturalHeight;
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
  g.drawImage(img, srcX, srcY, cellW, cellH, Math.round(drawX), Math.round(drawY), destW, destH);

  // Optional hurt flash overlay for 2.5D entities
  if (options?.isHurt) {
    g.fillStyle = 'rgba(255, 255, 255, 0.55)';
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
