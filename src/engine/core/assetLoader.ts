/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssetLibrary, Strip, StripSpec } from '../../types/cartridge';

export const ASSET_LIMITS = {
  cellMax: 64,
  framesMax: 64,
  rowsMax: 16,
  fpsMax: 60,
  fileBytes: 32 * 1024,
  cartBytes: 256 * 1024,
};

const PNG_PREFIX = 'data:image/png;base64,';

export function validateSpec(cartId: string, id: string, s: StripSpec): number {
  const fail = (why: string) => {
    throw new Error(`${cartId}/${id}: ${why}`);
  };

  if (!/^[A-Za-z0-9_-]+$/.test(id)) fail('BAD ID');
  if (!s || typeof s !== 'object') fail('SPEC MUST BE AN OBJECT');
  if (typeof s.src !== 'string' || s.src.indexOf(PNG_PREFIX) !== 0) {
    fail('PNG DATA URI ONLY');
  }

  const whole = (v: number | undefined, lo: number, hi: number, name: string) => {
    if (v === undefined || !Number.isInteger(v) || v < lo || v > hi) {
      fail(`${name} MUST BE A WHOLE NUMBER ${lo} TO ${hi}`);
    }
  };

  whole(s.cw, 1, ASSET_LIMITS.cellMax, 'cw');
  whole(s.ch, 1, ASSET_LIMITS.cellMax, 'ch');
  whole(s.frames, 1, ASSET_LIMITS.framesMax, 'frames');
  if (s.rows !== undefined) whole(s.rows, 1, ASSET_LIMITS.rowsMax, 'rows');
  if (s.fps !== undefined) whole(s.fps, 0, ASSET_LIMITS.fpsMax, 'fps');
  if (s.ax !== undefined) whole(s.ax, 0, s.cw, 'ax');
  if (s.ay !== undefined) whole(s.ay, 0, s.ch, 'ay');

  const bytes = Math.floor(((s.src.length - PNG_PREFIX.length) * 3) / 4);
  if (bytes > ASSET_LIMITS.fileBytes) {
    fail(`FILE IS ${bytes} BYTES, LIMIT ${ASSET_LIMITS.fileBytes}`);
  }

  return bytes;
}

export function decodeImage(name: string, src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`${name}: IMAGE DID NOT DECODE`));
    img.src = src;
  });
}

export function makeStrip(id: string, s: StripSpec, img: HTMLImageElement): Strip {
  const { cw, ch, frames } = s;
  const rows = s.rows || 1;
  const n = frames * rows;
  const fps = s.fps || 0;
  const ax = s.ax || 0;
  const ay = s.ay || 0;

  const sheet = document.createElement('canvas');
  sheet.width = img.width;
  sheet.height = img.height;
  const sg = sheet.getContext('2d');
  if (sg) {
    sg.imageSmoothingEnabled = false;
    sg.drawImage(img, 0, 0);
  }

  return {
    id,
    cw,
    ch,
    frames,
    rows,
    fps,
    ax,
    ay,
    frameAt: (t: number) => (fps > 0 ? Math.floor(t * fps) % n : 0),
    draw: (
      g: CanvasRenderingContext2D,
      frameIdx: number,
      x: number,
      y: number,
      flipX = false
    ) => {
      const f = Math.floor(frameIdx) % n;
      const fi = f < 0 ? f + n : f;
      const sx = (fi % frames) * cw;
      const sy = Math.floor(fi / frames) * ch;
      const px = Math.round(x);
      const dy = Math.round(y) - ay;

      if (!flipX) {
        g.drawImage(sheet, sx, sy, cw, ch, px - ax, dy, cw, ch);
        return;
      }

      g.save();
      g.translate(px, 0);
      g.scale(-1, 1);
      g.drawImage(sheet, sx, sy, cw, ch, -ax, dy, cw, ch);
      g.restore();
    },
  };
}

export async function loadCartridgeAssets(
  cartId: string,
  specs?: Record<string, StripSpec>
): Promise<AssetLibrary> {
  if (!specs || typeof specs !== 'object') {
    return {};
  }

  const ids = Object.keys(specs);
  let totalBytes = 0;

  ids.forEach((id) => {
    totalBytes += validateSpec(cartId, id, specs[id]);
  });

  if (totalBytes > ASSET_LIMITS.cartBytes) {
    throw new Error(`ART IS ${totalBytes} BYTES, LIMIT ${ASSET_LIMITS.cartBytes}`);
  }

  const strips = await Promise.all(
    ids.map(async (id) => {
      const s = specs[id];
      const img = await decodeImage(`${cartId}/${id}`, s.src);
      const expectedW = s.cw * s.frames;
      const expectedH = s.ch * (s.rows || 1);
      if (img.width !== expectedW || img.height !== expectedH) {
        throw new Error(
          `${cartId}/${id}: IMAGE IS ${img.width}x${img.height}, EXPECTED ${expectedW}x${expectedH}`
        );
      }
      return makeStrip(id, s, img);
    })
  );

  const library: AssetLibrary = {};
  strips.forEach((st) => {
    library[st.id] = st;
  });
  return library;
}
