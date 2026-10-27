/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CANONICAL_ARMS } from '../database/equipment/arms';
import {
  armor_sheets,
  plating_bwi_bastion,
  set_camelot_knight,
} from '../database/equipment/armor_sheets';
import { CanonicalHardwareItemDefinition } from '../database/equipment/chassis_hardware';
import { CANONICAL_HEAD_OPTICS } from '../database/equipment/head';
import {
  CANONICAL_FRAME_PLATING,
  FramePlatingDefinition,
} from '../database/equipment/plating';
import { OrionDir, OrionState, TraitLine } from '../types';

export interface ResolvedPlayerSpriteParts {
  /** Optional set index (0..11 for baseline sets, undefined for standalone pieces without a full set) */
  framePlatingSetIndex?: number;
  /** Optional set index (0..11 for baseline sets, undefined for standalone pieces without a full set) */
  armsSetIndex?: number;
  /** Optional set index (0..11 for baseline sets, undefined for standalone pieces without a full set) */
  headSetIndex?: number;
  /** Human-readable style/set label for Frame Plating */
  framePlatingStyle: string;
  /** Backward-compatible alias for framePlatingStyle */
  coreplateStyle: string;
  /** Human-readable style/set label for Shoulders & Arms */
  armsStyle: string;
  /** Human-readable style/set label for Head & Optics */
  headStyle: string;
  /** Resolved Frame Plating hardware definition */
  framePlatingDef: FramePlatingDefinition;
  /** Resolved Arms hardware definition */
  armsDef: CanonicalHardwareItemDefinition;
  /** Resolved Head hardware definition */
  headDef: CanonicalHardwareItemDefinition;
}

const DEFAULT_SET_INDEX_BY_TRAIT: Record<TraitLine, number> = {
  Warrior: 0,
  Marauder: 1,
  Guardian: 2,
  Rogue: 3,
  Wizard: 4,
  Cleric: 5,
};

function matchHardwareItem<
  T extends { id: string; name: string; legacyNames?: string[]; setIndex?: number; setId?: string },
>(catalog: T[], rawValue: string | null | undefined, fallbackSetIndex: number): T {
  const norm = (rawValue || '').trim().toLowerCase();
  if (norm) {
    const exact = catalog.find(
      (item) =>
        item.id.toLowerCase() === norm ||
        item.name.toLowerCase() === norm ||
        item.legacyNames?.some((l) => l.toLowerCase() === norm)
    );
    if (exact) return exact;

    const partial = catalog.find((item) => {
      const shortKey = item.id
        .replace(/^(coreplate_|hw_plating_|plating_|arms_|head_|optics_)/, '')
        .toLowerCase();
      return (
        norm.includes(shortKey) ||
        shortKey.split('_').some((tok) => tok.length >= 4 && norm.includes(tok))
      );
    });
    if (partial) return partial;
  }

  return (
    catalog.find((item) => item.setIndex === fallbackSetIndex) ||
    catalog[fallbackSetIndex % catalog.length] ||
    catalog[0]
  );
}

function formatPartStyleLabel(
  item: { name: string; setIndex?: number; setId?: string },
  stripSuffixRegex?: RegExp
): string {
  const cleanName = stripSuffixRegex ? item.name.replace(stripSuffixRegex, '') : item.name;
  if (typeof item.setIndex === 'number') {
    return `SET ${String(item.setIndex + 1).padStart(2, '0')} · ${cleanName}`;
  }
  if (item.setId) {
    return `${item.setId.toUpperCase()} · ${cleanName}`;
  }
  return `STANDALONE · ${cleanName}`;
}

/**
 * Resolves the pilot's active 3-piece mech visual loadout (Frame Plating [Torso/Legs], Shoulders/Arms, Head).
 * Each slot resolves independently: supports the 12 baseline sets (0..11), future sets (12+),
 * and standalone individual pieces that do not belong to a full 3-piece set.
 */
export function resolvePlayerSpriteParts(state: OrionState): ResolvedPlayerSpriteParts {
  const fallbackSetIdx = DEFAULT_SET_INDEX_BY_TRAIT[state.traitLine] ?? 0;

  const framePlatingDef = matchHardwareItem(
    CANONICAL_FRAME_PLATING,
    state.equipmentSlots?.plating,
    fallbackSetIdx
  );
  const armsDef = matchHardwareItem(
    CANONICAL_ARMS,
    state.equipmentSlots?.arms,
    fallbackSetIdx
  );
  const headDef = matchHardwareItem(
    CANONICAL_HEAD_OPTICS,
    state.equipmentSlots?.head,
    fallbackSetIdx
  );

  const framePlatingSetIndex = framePlatingDef.setIndex;
  const armsSetIndex = armsDef.setIndex;
  const headSetIndex = headDef.setIndex;

  const framePlatingStyle = formatPartStyleLabel(framePlatingDef, / Frame Plating$/i);
  const armsStyle = formatPartStyleLabel(armsDef);
  const headStyle = formatPartStyleLabel(headDef);

  return {
    framePlatingSetIndex,
    armsSetIndex,
    headSetIndex,
    framePlatingStyle,
    coreplateStyle: framePlatingStyle,
    armsStyle,
    headStyle,
    framePlatingDef,
    armsDef,
    headDef,
  };
}

// ─── 4-FRAME (16x16 PX PER CELL) ALIGNED PART STRIP / SHEET CACHE ─────────────

const decodedBase64ImageCache = new Map<string, HTMLImageElement>();
const bakedPartStripCache = new Map<string, HTMLCanvasElement>();
const spriteLoadListeners = new Set<() => void>();

export function subscribeToMechSpriteLoad(listener: () => void): () => void {
  spriteLoadListeners.add(listener);
  return () => {
    spriteLoadListeners.delete(listener);
  };
}

function getDecodedPartStripImage(base64: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  const cached = decodedBase64ImageCache.get(base64);
  if (cached) return cached;

  const dataUri = base64.startsWith('data:image/')
    ? base64
    : `data:image/png;base64,${base64}`;
  const img = new Image();
  img.onload = () => {
    for (const listener of spriteLoadListeners) {
      listener();
    }
  };
  img.src = dataUri;
  decodedBase64ImageCache.set(base64, img);
  return img;
}

// Pre-warm baseline armor sheets immediately in browser environments
if (typeof Image !== 'undefined') {
  getDecodedPartStripImage(plating_bwi_bastion);
  getDecodedPartStripImage(set_camelot_knight);
  getDecodedPartStripImage(armor_sheets);
}

/**
 * Applies a 1px dark silhouette outline (#020617) around non-transparent pixels within each 16x16 frame cell
 * of a 64x16 fallback strip so procedural standalone pieces read cleanly against any background.
 */
function apply1pxOutlinePer16x16Frame(ctx: CanvasRenderingContext2D, frameCount = 4): void {
  const width = frameCount * 16;
  const height = 16;
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;

  for (let f = 0; f < frameCount; f++) {
    const fStartX = f * 16;
    const fEndX = fStartX + 16;
    for (let y = 0; y < 16; y++) {
      for (let x = fStartX; x < fEndX; x++) {
        const idx = (y * width + x) * 4;
        if (src[idx + 3] > 0) continue;

        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        let hasOpaqueNeighbor = false;
        for (const [nx, ny] of neighbors) {
          if (nx < fStartX || nx >= fEndX || ny < 0 || ny >= 16) continue;
          const nIdx = (ny * width + nx) * 4;
          if (src[nIdx + 3] > 128) {
            hasOpaqueNeighbor = true;
            break;
          }
        }
        if (hasOpaqueNeighbor) {
          dst[idx] = 2;
          dst[idx + 1] = 6;
          dst[idx + 2] = 23;
          dst[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Bakes a 64x16 px (4 frames of 16x16 px) fallback Torso & Legs sprite strip for standalone Frame Plating items
 * that do not supply a Base64 PNG sprite sheet.
 */
function bakeFramePlatingStrip(
  def: FramePlatingDefinition,
  isNorth: boolean,
  isCriticalBlink: boolean
): HTMLCanvasElement {
  const cvs = document.createElement('canvas');
  cvs.width = 64;
  cvs.height = 16;
  const g = cvs.getContext('2d')!;
  g.imageSmoothingEnabled = false;

  const theme = def.spriteTheme || {
    baseArmorColor: '#334155',
    trimColor: '#38bdf8',
    reactorGlowColor: '#ea580c',
    legColor: '#1e293b',
    chassisWidth: 8,
    chassisHeight: 7,
    torsoStyle: 'angular',
  };

  const baseColor = isCriticalBlink ? '#7f1d1d' : theme.baseArmorColor;
  const trimColor = theme.trimColor;
  const coreColor = isCriticalBlink ? '#fca5a5' : theme.reactorGlowColor;
  const legColor = theme.legColor || '#0f172a';
  const torsoW = Math.max(6, Math.min(10, theme.chassisWidth || 8));
  const torsoH = Math.max(6, Math.min(8, theme.chassisHeight || 7));

  const leftLegs = [0, -1, 0, 1];
  const rightLegs = [0, 1, 0, -1];
  const torsoBobs = [0, -1, 0, -1];

  for (let frame = 0; frame < 4; frame++) {
    const ox = frame * 16;
    const cx = ox + 8;
    const bob = torsoBobs[frame];
    const torsoLeft = cx - Math.floor(torsoW / 2);
    const torsoTop = 6 + bob;

    const lLegY = 12 + leftLegs[frame];
    const rLegY = 12 + rightLegs[frame];
    g.fillStyle = legColor;
    g.fillRect(cx - 3, lLegY, 2, 3);
    g.fillRect(cx + 1, rLegY, 2, 3);
    g.fillStyle = trimColor;
    g.fillRect(cx - 3, lLegY + 2, 2, 1);
    g.fillRect(cx + 1, rLegY + 2, 2, 1);

    g.fillStyle = baseColor;
    g.fillRect(torsoLeft, torsoTop, torsoW, torsoH);

    g.fillStyle = trimColor;
    g.fillRect(torsoLeft + 1, torsoTop + torsoH - 1, torsoW - 2, 1);

    if (theme.torsoStyle === 'heavy') {
      g.fillStyle = trimColor;
      g.fillRect(torsoLeft, torsoTop + 1, 2, 2);
      g.fillRect(torsoLeft + torsoW - 2, torsoTop + 1, 2, 2);
    } else if (theme.torsoStyle === 'layered') {
      g.fillStyle = trimColor;
      g.fillRect(torsoLeft + 1, torsoTop, torsoW - 2, 1);
    } else if (theme.torsoStyle === 'sleek') {
      g.fillStyle = trimColor;
      g.fillRect(cx - 1, torsoTop + 1, 2, torsoH - 2);
    } else if (theme.torsoStyle === 'winged') {
      g.fillStyle = trimColor;
      g.fillRect(cx - 1, torsoTop, 2, torsoH - 1);
    }

    if (!isNorth) {
      g.fillStyle = '#090d16';
      g.fillRect(cx - 1, torsoTop + 2, 3, 3);
      g.fillStyle = coreColor;
      g.fillRect(cx, torsoTop + 2, 2, 2);
    } else {
      g.fillStyle = '#1e293b';
      g.fillRect(cx - 2, torsoTop + 1, 4, 4);
      g.fillStyle = coreColor;
      g.fillRect(cx - 2, torsoTop + 3, 1, 2);
      g.fillRect(cx + 1, torsoTop + 3, 1, 2);
    }
  }

  apply1pxOutlinePer16x16Frame(g, 4);
  return cvs;
}

/**
 * Bakes a 64x16 px (4 frames of 16x16 px) fallback Shoulders & Arms sprite strip for standalone Arms items
 * that do not supply a Base64 PNG sprite sheet.
 */
function bakeArmsStrip(def: CanonicalHardwareItemDefinition): HTMLCanvasElement {
  const cvs = document.createElement('canvas');
  cvs.width = 64;
  cvs.height = 16;
  const g = cvs.getContext('2d')!;
  g.imageSmoothingEnabled = false;

  const setIdx = def.setIndex ?? 0;
  const theme = def.spriteTheme || {};
  const armColor: string = theme.armColor || '#475569';
  const cuffColor: string = theme.cuffColor || '#38bdf8';
  const shoulderColor: string = theme.shoulderColor || armColor;
  const shoulderStyle: string = theme.shoulderStyle || 'angular';
  const armW: number = theme.armWidth || (setIdx % 6 === 3 ? 2 : 2);
  const armH = 6;

  const leftSwings = [0, 1, 0, -1];
  const rightSwings = [0, -1, 0, 1];
  const shoulderBobs = [0, -1, 0, -1];

  for (let frame = 0; frame < 4; frame++) {
    const ox = frame * 16;
    const cx = ox + 8;
    const bob = shoulderBobs[frame];
    const baseY = 6 + bob;

    const leftArmX = cx - 4 - armW;
    const rightArmX = cx + 4;
    const lY = baseY + leftSwings[frame];
    const rY = baseY + rightSwings[frame];

    g.fillStyle = shoulderColor;
    if (shoulderStyle === 'heavy') {
      g.fillRect(leftArmX - 1, baseY - 1, armW + 2, 3);
      g.fillRect(rightArmX - 1, baseY - 1, armW + 2, 3);
    } else if (shoulderStyle === 'prism') {
      const floatOff = frame % 2 === 0 ? -1 : 0;
      g.fillStyle = cuffColor;
      g.fillRect(leftArmX, baseY - 1 + floatOff, armW, 2);
      g.fillRect(rightArmX, baseY - 1 - floatOff, armW, 2);
    } else if (shoulderStyle === 'winged') {
      g.fillStyle = cuffColor;
      g.fillRect(leftArmX, baseY - 1, armW + 1, 2);
      g.fillRect(rightArmX - 1, baseY - 1, armW + 1, 2);
    } else {
      g.fillRect(leftArmX, baseY, armW + 1, 2);
      g.fillRect(rightArmX - 1, baseY, armW + 1, 2);
    }

    g.fillStyle = armColor;
    g.fillRect(leftArmX, lY + 1, armW, armH - 1);
    g.fillStyle = cuffColor;
    g.fillRect(leftArmX, lY + armH - 2, armW, 2);

    g.fillStyle = armColor;
    g.fillRect(rightArmX, rY + 1, armW, armH - 1);
    g.fillStyle = cuffColor;
    g.fillRect(rightArmX, rY + armH - 2, armW, 2);
  }

  apply1pxOutlinePer16x16Frame(g, 4);
  return cvs;
}

/**
 * Bakes a 64x16 px (4 frames of 16x16 px) fallback Head & Optics sprite strip for standalone Head items
 * that do not supply a Base64 PNG sprite sheet.
 */
function bakeHeadStrip(
  def: CanonicalHardwareItemDefinition,
  isNorth: boolean
): HTMLCanvasElement {
  const cvs = document.createElement('canvas');
  cvs.width = 64;
  cvs.height = 16;
  const g = cvs.getContext('2d')!;
  g.imageSmoothingEnabled = false;

  const theme = def.spriteTheme || {};
  const helmColor: string = theme.helmColor || '#334155';
  const visorColor: string = theme.visorColor || '#f97316';
  const crestColor: string = theme.crestColor || '#38bdf8';
  const crestStyle: string = theme.crestStyle || 'murmillio';

  const headW = 6;
  const headH = 4;
  const headBobs = [0, -1, 0, -1];

  for (let frame = 0; frame < 4; frame++) {
    const ox = frame * 16;
    const cx = ox + 8;
    const bob = headBobs[frame];
    const headLeft = cx - Math.floor(headW / 2);
    const headTop = 2 + bob;

    g.fillStyle = helmColor;
    g.fillRect(headLeft, headTop, headW, headH);

    g.fillStyle = crestColor;
    if (crestStyle === 'murmillio') {
      g.fillRect(cx - 1, headTop - 1, 2, 2);
    } else if (crestStyle === 'ironveil') {
      g.fillRect(headLeft, headTop, headW, 1);
      g.fillRect(headLeft, headTop - 1, 1, 2);
    } else if (crestStyle === 'aegis') {
      g.fillRect(headLeft + 1, headTop - 1, headW - 2, 1);
    } else if (crestStyle === 'veilsight') {
      g.fillRect(headLeft - 1, headTop, 1, 2);
      g.fillRect(headLeft + headW, headTop, 1, 2);
    } else if (crestStyle === 'omniscient') {
      g.fillStyle = visorColor;
      g.fillRect(cx - 1, headTop - 1, 2, 1);
    } else if (crestStyle === 'providence') {
      g.fillRect(cx - 2, headTop - 1, 4, 1);
    }

    if (!isNorth) {
      const visorX = headLeft + 1;
      const visorW = headW - 2;
      g.fillStyle = '#020617';
      g.fillRect(visorX, headTop + 1, visorW, 2);
      g.fillStyle = visorColor;
      if (crestStyle === 'veilsight') {
        g.fillRect(visorX, headTop + 1, 1, 1);
        g.fillRect(visorX + 2, headTop + 1, 1, 1);
      } else if (crestStyle === 'ironveil') {
        g.fillRect(visorX, headTop + 1, 1, 1);
        g.fillRect(visorX + visorW - 1, headTop + 1, 1, 1);
      } else {
        g.fillRect(visorX + 1, headTop + 1, Math.max(2, visorW - 1), 1);
      }
    }
  }

  apply1pxOutlinePer16x16Frame(g, 4);
  return cvs;
}

interface ResolvedLayerSlice {
  drawable: HTMLImageElement | HTMLCanvasElement;
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
  flipX: boolean;
}

/**
 * Resolves the exact 16x16 source rectangle and drawable for a single mech part layer (`plating`, `arms`, or `head`).
 * Supports:
 * - 192x768 master armor sheet (`armor_sheets` with `atlasColumn: 0|1|2`, `atlasSetRow: 0..11`, 4 directional rows x 4 frames)
 * - 64x64 standalone 4-direction part sheet (`plating_bwi_bastion`, 4 directional rows x 4 frames)
 * - 64x16 standalone 1-row 4-frame strip
 * - Procedural fallback 64x16 strip for standalone parts without a Base64 PNG
 */
function resolvePartLayerSlice(
  slot: 'plating' | 'arms' | 'head',
  def: CanonicalHardwareItemDefinition | FramePlatingDefinition,
  dir: OrionDir,
  step: number,
  isCriticalBlink: boolean
): ResolvedLayerSlice {
  const partSprite = def.partSprite;
  const cellW = partSprite?.cellWidth || 16;
  const cellH = partSprite?.cellHeight || 16;
  const frameCount = partSprite?.frameCount || 4;
  const frameIdx = step % frameCount;

  const isWest = dir === 'W' || dir === 'NW' || dir === 'SW';
  const isNorth = dir === 'N';

  if (partSprite?.base64) {
    const img = getDecodedPartStripImage(partSprite.base64);
    if (img && img.complete && img.naturalWidth > 0) {
      const dirRows =
        partSprite.directionalRows ?? (img.naturalHeight >= cellH * 4 ? 4 : 1);
      const isMasterAtlas =
        partSprite.atlasColumn !== undefined || img.naturalWidth >= cellW * frameCount * 3;

      const colIndex = isMasterAtlas
        ? (partSprite.atlasColumn ?? (slot === 'plating' ? 0 : slot === 'arms' ? 1 : 2))
        : 0;
      const maxSetRows = Math.max(1, Math.floor(img.naturalHeight / (dirRows * cellH)));
      const rawSetRowIndex = isMasterAtlas
        ? (partSprite.atlasSetRow ?? def.setIndex ?? 0)
        : 0;
      const setRowIndex = Math.min(rawSetRowIndex, maxSetRows - 1);

      const blockOriginX = colIndex * (frameCount * cellW);
      const blockOriginY = setRowIndex * (dirRows * cellH);

      if (dirRows >= 4) {
        // Row 0 = East/Right, Row 1 = West/Left, Row 2 = South/Down, Row 3 = North/Up
        const dirRow =
          dir === 'N'
            ? 3
            : dir === 'S'
              ? 2
              : isWest
                ? 1
                : 0;
        return {
          drawable: img,
          srcX: blockOriginX + frameIdx * cellW,
          srcY: blockOriginY + dirRow * cellH,
          srcW: cellW,
          srcH: cellH,
          flipX: false,
        };
      }

      return {
        drawable: img,
        srcX: blockOriginX + frameIdx * cellW,
        srcY: blockOriginY,
        srcW: cellW,
        srcH: cellH,
        flipX: isWest,
      };
    }
  }

  const key = `${slot}:${def.id}:${isNorth ? 'N' : 'S'}:${isCriticalBlink ? 'crit' : 'ok'}`;
  let baked = bakedPartStripCache.get(key);
  if (!baked) {
    if (slot === 'plating') {
      baked = bakeFramePlatingStrip(def as FramePlatingDefinition, isNorth, isCriticalBlink);
    } else if (slot === 'arms') {
      baked = bakeArmsStrip(def);
    } else {
      baked = bakeHeadStrip(def, isNorth);
    }
    bakedPartStripCache.set(key, baked);
  }

  return {
    drawable: baked,
    srcX: (step % 4) * 16,
    srcY: 0,
    srcW: 16,
    srcH: 16,
    flipX: isWest,
  };
}

export interface DrawCompositePlayerOptions {
  dir?: OrionDir;
  isMoving?: boolean;
  isAttacking?: boolean;
}

/**
 * Renders the modular player Mech sprite composed of 3 aligned 16x16 px layers:
 * 1. Frame Plating (Torso & Legs — `state.equipmentSlots.plating`)
 * 2. Arms (Shoulders & Arms — `state.equipmentSlots.arms`)
 * 3. Head (Command Helm & Optics — `state.equipmentSlots.head`)
 *
 * Supports the 12 baseline sets (0..11) from `armor_sheets` / `plating_bwi_bastion`,
 * future sets (12+), and standalone parts without a full set.
 */
export function drawCompositePlayerMech(
  g: CanvasRenderingContext2D,
  state: OrionState,
  x: number,
  py: number,
  timeSec: number,
  options?: DrawCompositePlayerOptions
): void {
  const { framePlatingDef, armsDef, headDef } = resolvePlayerSpriteParts(state);
  const dir = options?.dir || state.dir || 'S';
  const isMoving =
    options?.isMoving ?? (Math.abs(state.vx || 0) > 1 || Math.abs(state.vy || 0) > 1);
  const isCriticalBlink =
    state.frame?.state === 'Critical' && Math.floor(timeSec * 8) % 2 === 0;

  const step = isMoving ? Math.floor(timeSec * 8) : 0;

  const platingSlice = resolvePartLayerSlice(
    'plating',
    framePlatingDef,
    dir,
    step,
    isCriticalBlink
  );
  const armsSlice = resolvePartLayerSlice('arms', armsDef, dir, step, false);
  const headSlice = resolvePartLayerSlice('head', headDef, dir, step, false);

  const cx = Math.round(x);
  const cy = Math.round(py);

  g.save();
  g.imageSmoothingEnabled = false;

  for (const slice of [platingSlice, armsSlice, headSlice]) {
    if (slice.flipX) {
      g.save();
      g.translate(cx, cy);
      g.scale(-1, 1);
      g.drawImage(
        slice.drawable,
        slice.srcX,
        slice.srcY,
        slice.srcW,
        slice.srcH,
        -8,
        -16,
        16,
        16
      );
      g.restore();
    } else {
      g.drawImage(
        slice.drawable,
        slice.srcX,
        slice.srcY,
        slice.srcW,
        slice.srcH,
        cx - 8,
        cy - 16,
        16,
        16
      );
    }
  }

  g.restore();
}


