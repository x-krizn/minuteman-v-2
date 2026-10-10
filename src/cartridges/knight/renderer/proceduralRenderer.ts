/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition, SingleFrameAsset } from '../types';

const imageCache = new Map<string, HTMLImageElement>();

/**
 * Returns a decoded HTMLImageElement from cache, or initiates load.
 */
export function getCachedImage(uri: string): HTMLImageElement | null {
  if (!uri) return null;
  let img = imageCache.get(uri);
  if (!img) {
    img = new Image();
    img.src = uri;
    imageCache.set(uri, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export interface TransformOptions {
  rotation?: number; // Radians
  scaleX?: number;
  scaleY?: number;
  anchorX?: number;
  anchorY?: number;
  width?: number;
  height?: number;
  alpha?: number;
}

/**
 * Renders an image using the canvas transform matrix (rotation, flip, scale, pivot anchor).
 */
export function drawTransformedImage(
  g: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  opts: TransformOptions = {}
): void {
  const rotation = opts.rotation ?? 0;
  const scaleX = opts.scaleX ?? 1;
  const scaleY = opts.scaleY ?? 1;
  const width = opts.width ?? (img instanceof HTMLImageElement ? img.naturalWidth : 16);
  const height = opts.height ?? (img instanceof HTMLImageElement ? img.naturalHeight : 16);
  const ax = opts.anchorX ?? width / 2;
  const ay = opts.anchorY ?? height / 2;

  g.save();
  g.translate(Math.round(x), Math.round(y));

  if (opts.alpha !== undefined && opts.alpha < 1) {
    g.globalAlpha = opts.alpha;
  }

  if (rotation !== 0) {
    g.rotate(rotation);
  }

  if (scaleX !== 1 || scaleY !== 1) {
    g.scale(scaleX, scaleY);
  }

  g.drawImage(img, -ax, -ay, width, height);
  g.restore();
}

/**
 * Procedurally draws an energetic weapon slash trail arc.
 */
export function drawProceduralArcTrail(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: string,
  lineWidth = 2
): void {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = lineWidth;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(cx, cy, radius, startAngle, endAngle);
  g.stroke();
  g.restore();
}

/**
 * Attempts to procedurally render a standalone pickup asset.
 * Returns true if handled procedurally, false if renderer should fall back to sprite sheet.
 */
export function drawProceduralPickup(
  g: CanvasRenderingContext2D,
  it: ItemWikiDefinition,
  x: number,
  y: number,
  nowMs: number
): boolean {
  const asset = it.assets as SingleFrameAsset | undefined;
  if (!asset?.imageUri) {
    return false;
  }

  const img = getCachedImage(asset.imageUri);
  if (!img) {
    return false;
  }

  const bobCfg = asset.procedural?.bob ?? { amplitude: 1.5, speed: 250 };
  const bob = Math.round(Math.sin(nowMs / bobCfg.speed) * bobCfg.amplitude);

  const rotSpeed = asset.procedural?.rotationSpeed ?? 0;
  const rotation = rotSpeed !== 0 ? (nowMs / 1000) * rotSpeed : 0;

  drawTransformedImage(g, img, x, y + bob, {
    rotation,
    width: asset.width ?? 16,
    height: asset.height ?? 16,
    anchorX: asset.anchor?.x ?? 8,
    anchorY: asset.anchor?.y ?? 8,
  });

  return true;
}
