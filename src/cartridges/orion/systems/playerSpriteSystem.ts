/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CANONICAL_ARMS } from '../database/equipment/arms';
import { CanonicalHardwareItemDefinition } from '../database/equipment/chassis_hardware';
import { CANONICAL_HEAD_OPTICS } from '../database/equipment/head';
import {
  CANONICAL_FRAME_PLATING,
  FramePlatingDefinition,
} from '../database/equipment/plating';
import {
  classifyWeaponCombatArchetype,
  getWeaponDefinition,
} from '../database/equipment/weapons';
import { getItemDefinition } from '../database/items';
import {
  computePlayerLoadMetrics,
  getEffectiveMainGrip,
  getWeaponGemVisuals,
} from '../database/progression';
import { OrionDir, OrionGlidePhase, OrionState, TraitLine } from '../types';
import {
  getBase64Image,
  getOutlinedSpriteCanvas,
  resolveSpriteStripSliceCoords,
} from './render/spriteAtlasCache';

/**
 * Type contract for `ResolvedPlayerSpriteParts` (resolved player sprite parts) in `playerSpriteSystem.ts`.
 */
export interface ResolvedPlayerSpriteParts {
  /** Optional set index (0..11 for baseline sets, undefined for standalone pieces without a full set) */
  framePlatingSetIndex?: number;
  /** Optional set index (0..11 for baseline sets, undefined for standalone pieces without a full set) */
  armsSetIndex?: number;
  /** Optional set index (0..11 for baseline sets, undefined for standalone pieces without a full set) */
  headSetIndex?: number;
  /** Human-readable style/set label for Frame Plating */
  framePlatingStyle: string;
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
 * Each slot resolves independently: supports the 12 baseline sets (0..11), additional sets (12+),
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
    armsStyle,
    headStyle,
    framePlatingDef,
    armsDef,
    headDef,
  };
}

// ─── MAGIC-CURRENT GLIDE STATE MACHINE & WEIGHT-SCALED RECOVERY ───────────────
//
// Orion Mechs channel raw magic currents to glide rather than running on foot:
// - Frame 1 (0-based Col 0): Grounded Idle posture ('idle')
// - Frames 2, 3, 4 (0-based Cols 1, 2, 3): Glide Windup steps ('windup')
// - Frame 3 (0-based Col 2) with off-count shifts to Frame 2 (0-based Col 1): Sustained Glide ('glide')
// - Frame 4 (0-based Col 3): Active Boost surge ('boost'); returns directly to Frame 3 (Col 2) when boost ends
// - Frames 3 -> 2 -> 1 (Cols 2 -> 1 -> 0): Weight-scaled Wind-Down recovery ('winddown') when movement stops

/**
 * Type contract for `PlayerWeightRecoveryProfile` (player weight recovery profile) in `playerSpriteSystem.ts`.
 */
export interface PlayerWeightRecoveryProfile {
  /** 0 = Feather/Light, 1 = Medium, 2 = Heavy, 3 = Superheavy, 4 = Overloaded */
  weightTier: 0 | 1 | 2 | 3 | 4;
  /** Human-readable weight class badge for UI/Satchel inspection */
  weightLabel: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'SUPERHEAVY' | 'OVERLOADED';
  /** 0-based sprite column sequence during wind-down before settling to Col 0 (Frame 1 Idle) */
  recoveryFrames: Array<0 | 1 | 2 | 3>;
  /** Duration in seconds per wind-down recovery step */
  winddownStepSec: number;
  /** Fraction of movement velocity carried into stopping glide inertia */
  inertiaCarryMult: number;
  /** Exponential velocity decay rate (1/s) during wind-down glide recovery */
  inertiaDecayRate: number;
}

const WINDUP_SEQUENCE: Array<0 | 1 | 2 | 3> = [1, 2, 3]; // 1-based Frames 2, 3, 4
const WINDUP_STEP_SEC = 0.08;

/**
 * Sustained glide holds Frame 3 (0-based Col 2) as primary posture,
 * with off-count rhythmic shifts to Frame 2 (0-based Col 1) before returning to Frame 3.
 */
const GLIDE_CADENCE_STEPS: Array<{ frame: 0 | 1 | 2 | 3; durationSec: number }> = [
  { frame: 2, durationSec: 0.16 }, // Frame 3 (beat 1)
  { frame: 2, durationSec: 0.14 }, // Frame 3 (beat 2)
  { frame: 1, durationSec: 0.10 }, // Frame 2 (off-count shift)
  { frame: 2, durationSec: 0.18 }, // Frame 3 (beat 3)
  { frame: 2, durationSec: 0.12 }, // Frame 3 (beat 4)
  { frame: 1, durationSec: 0.09 }, // Frame 2 (syncopated off-count shift)
];

/**
 * Computes the pilot's weight-scaled wind-down recovery sequence and physical stopping inertia
 * from their equipped Frame Plating load class, active Weapon weight class, and overload state.
 */
export function computePlayerWeightRecoveryProfile(
  state: OrionState
): PlayerWeightRecoveryProfile {
  const loadMetrics = computePlayerLoadMetrics(state);
  const bracket = state.gates?.loadPenalty?.loadBracket || loadMetrics.loadBracket;

  const weightTier: 0 | 1 | 2 | 3 | 4 =
    bracket === 'overloaded'
      ? 4
      : bracket === 'heavy'
        ? loadMetrics.loadPct >= 85
          ? 3
          : 2
        : bracket === 'medium'
          ? 1
          : 0;

  switch (weightTier) {
    case 0:
      return {
        weightTier: 0,
        weightLabel: 'LIGHT',
        recoveryFrames: [2, 1], // Frame 3 -> Frame 2 -> Idle (Frame 1)
        winddownStepSec: 0.065,
        inertiaCarryMult: 0.35,
        inertiaDecayRate: 14.0,
      };
    case 1:
      return {
        weightTier: 1,
        weightLabel: 'MEDIUM',
        recoveryFrames: [2, 2, 1], // Frame 3 (x2) -> Frame 2 -> Idle (Frame 1)
        winddownStepSec: 0.075,
        inertiaCarryMult: 0.48,
        inertiaDecayRate: 10.5,
      };
    case 2:
      return {
        weightTier: 2,
        weightLabel: 'HEAVY',
        recoveryFrames: [2, 2, 1, 1], // Frame 3 (x2) -> Frame 2 (x2) -> Idle (Frame 1)
        winddownStepSec: 0.085,
        inertiaCarryMult: 0.62,
        inertiaDecayRate: 8.0,
      };
    case 3:
      return {
        weightTier: 3,
        weightLabel: 'SUPERHEAVY',
        recoveryFrames: [2, 2, 2, 1, 1], // Frame 3 (x3) -> Frame 2 (x2) -> Idle (Frame 1)
        winddownStepSec: 0.092,
        inertiaCarryMult: 0.74,
        inertiaDecayRate: 6.2,
      };
    case 4:
    default:
      return {
        weightTier: 4,
        weightLabel: 'OVERLOADED',
        recoveryFrames: [2, 2, 2, 1, 1, 1], // Frame 3 (x3) -> Frame 2 (x3) -> Idle (Frame 1)
        winddownStepSec: 0.10,
        inertiaCarryMult: 0.86,
        inertiaDecayRate: 4.8,
      };
  }
}

/**
 * Advances the player Mech's 4-frame Magic-Current Glide state machine (`state.glidePhase` & `state.glideFrame`).
 */
export function stepPlayerGlideAnimation(
  state: OrionState,
  dt: number,
  hasMoveInput: boolean,
  isBoosting: boolean
): void {
  const profile = computePlayerWeightRecoveryProfile(state);
  const phase: OrionGlidePhase = state.glidePhase || 'idle';

  // 1. Active Boost overrides directly to Frame 4 (0-based Col 3)
  if (isBoosting) {
    state.glidePhase = 'boost';
    state.glideFrame = 3;
    state.glideStepIndex = 0;
    state.glideStepTimer = 0;
    return;
  }

  // 2. Exiting Boost: return directly to Frame 3 (0-based Col 2) in sustained glide,
  // or begin weight-scaled wind-down from Frame 3 if directional input has stopped.
  if (phase === 'boost') {
    if (hasMoveInput) {
      state.glidePhase = 'glide';
      state.glideFrame = 2; // Frame 3
      state.glideStepIndex = 0;
      state.glideStepTimer = 0;
    } else {
      state.glidePhase = 'winddown';
      state.glideRecoveryFrames = [...profile.recoveryFrames];
      state.glideStepIndex = 0;
      state.glideStepTimer = 0;
      state.glideFrame = state.glideRecoveryFrames[0] ?? 2;
    }
    return;
  }

  // 3. Grounded Idle (Frame 1 / Col 0)
  if (phase === 'idle') {
    if (hasMoveInput) {
      state.glidePhase = 'windup';
      state.glideStepIndex = 0;
      state.glideStepTimer = 0;
      state.glideFrame = WINDUP_SEQUENCE[0]; // Frame 2 (Col 1)
    } else {
      state.glideFrame = 0; // Frame 1 (Col 0)
    }
    return;
  }

  // 4. Glide Windup (Frames 2 -> 3 -> 4 / Cols 1 -> 2 -> 3)
  if (phase === 'windup') {
    if (!hasMoveInput) {
      // Stopped mid-windup: wind down smoothly from current posture
      const currentCol = state.glideFrame ?? 1;
      const filteredRecovery =
        currentCol <= 1
          ? profile.recoveryFrames.filter((c) => c <= 1)
          : profile.recoveryFrames;
      state.glidePhase = 'winddown';
      state.glideRecoveryFrames =
        filteredRecovery.length > 0 ? [...filteredRecovery] : [1];
      state.glideStepIndex = 0;
      state.glideStepTimer = 0;
      state.glideFrame = state.glideRecoveryFrames[0] ?? 1;
      return;
    }

    state.glideStepTimer = (state.glideStepTimer || 0) + dt;
    while (state.glideStepTimer >= WINDUP_STEP_SEC) {
      state.glideStepTimer -= WINDUP_STEP_SEC;
      state.glideStepIndex = (state.glideStepIndex || 0) + 1;
      if (state.glideStepIndex >= WINDUP_SEQUENCE.length) {
        // Windup complete (reached Frame 4) -> return to Frame 3 (Col 2) for sustained glide
        state.glidePhase = 'glide';
        state.glideStepIndex = 0;
        state.glideStepTimer = 0;
        state.glideFrame = GLIDE_CADENCE_STEPS[0].frame; // Frame 3 (Col 2)
        return;
      }
      state.glideFrame = WINDUP_SEQUENCE[state.glideStepIndex];
    }
    return;
  }

  // 5. Sustained Magic-Current Glide (Frame 3 [Col 2] with off-count shifts to Frame 2 [Col 1])
  if (phase === 'glide') {
    if (!hasMoveInput) {
      state.glidePhase = 'winddown';
      state.glideRecoveryFrames = [...profile.recoveryFrames];
      state.glideStepIndex = 0;
      state.glideStepTimer = 0;
      state.glideFrame = state.glideRecoveryFrames[0] ?? 2;
      return;
    }

    const stepIdx = (state.glideStepIndex || 0) % GLIDE_CADENCE_STEPS.length;
    const currentStep = GLIDE_CADENCE_STEPS[stepIdx];
    state.glideFrame = currentStep.frame;
    state.glideStepTimer = (state.glideStepTimer || 0) + dt;

    if (state.glideStepTimer >= currentStep.durationSec) {
      state.glideStepTimer -= currentStep.durationSec;
      const nextIdx = (stepIdx + 1) % GLIDE_CADENCE_STEPS.length;
      state.glideStepIndex = nextIdx;
      state.glideFrame = GLIDE_CADENCE_STEPS[nextIdx].frame;
    }
    return;
  }

  // 6. Weight-Scaled Wind-Down Recovery (Frames 3 -> 2 -> 1 / Cols 2 -> 1 -> 0)
  if (phase === 'winddown') {
    if (hasMoveInput) {
      // Movement resumed before settling to Frame 1:
      // If still on Frame 3 (Col 2), resume sustained glide immediately;
      // if on Frame 2 (Col 1), surge through Frame 3 -> 4 windup.
      if ((state.glideFrame ?? 1) >= 2) {
        state.glidePhase = 'glide';
        state.glideStepIndex = 0;
        state.glideStepTimer = 0;
        state.glideFrame = 2;
      } else {
        state.glidePhase = 'windup';
        state.glideStepIndex = 1; // Resume from Frame 3 (Col 2) -> Frame 4 (Col 3)
        state.glideStepTimer = 0;
        state.glideFrame = WINDUP_SEQUENCE[1];
      }
      return;
    }

    const recoverySeq =
      state.glideRecoveryFrames && state.glideRecoveryFrames.length > 0
        ? state.glideRecoveryFrames
        : profile.recoveryFrames;

    state.glideStepTimer = (state.glideStepTimer || 0) + dt;
    while (state.glideStepTimer >= profile.winddownStepSec) {
      state.glideStepTimer -= profile.winddownStepSec;
      state.glideStepIndex = (state.glideStepIndex || 0) + 1;
      if (state.glideStepIndex >= recoverySeq.length) {
        // Recovery finished -> grounded Idle at Frame 1 (Col 0)
        state.glidePhase = 'idle';
        state.glideFrame = 0;
        state.glideStepIndex = 0;
        state.glideStepTimer = 0;
        state.glideInertiaVx = 0;
        state.glideInertiaVy = 0;
        return;
      }
      state.glideFrame = recoverySeq[state.glideStepIndex];
    }
  }
}

// ─── 4-FRAME (16x16 PX PER CELL) ALIGNED PART STRIP / SHEET CACHE ─────────────

const decodedBase64ImageCache = new Map<string, HTMLImageElement>();
const bakedPartStripCache = new Map<string, HTMLCanvasElement>();
const spriteLoadListeners = new Set<() => void>();

/**
 * Executes `subscribeToMechSpriteLoad` (subscribe to mech sprite load) in `playerSpriteSystem.ts`.
 */
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

// Pre-warm all catalog part sheets immediately in browser environments
if (typeof Image !== 'undefined') {
  for (const item of CANONICAL_FRAME_PLATING) {
    if (item.partSprite?.base64) getDecodedPartStripImage(item.partSprite.base64);
  }
  for (const item of CANONICAL_ARMS) {
    if (item.partSprite?.base64) getDecodedPartStripImage(item.partSprite.base64);
  }
  for (const item of CANONICAL_HEAD_OPTICS) {
    if (item.partSprite?.base64) getDecodedPartStripImage(item.partSprite.base64);
  }
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
 * Frame 0 = Grounded Idle; Frames 1, 2, 3 = Progressive Magic-Current Glide & Boost posture.
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

  // Magic-current hover/glide elevation per frame:
  // Frame 0 (Idle): grounded; Frame 1 (Windup/Off-count): slight lift;
  // Frame 2 (Sustained Glide): hover stance; Frame 3 (Boost): full surge
  const leftLegLift = [0, -1, -1, -2];
  const rightLegLift = [0, 0, -1, -2];
  const torsoBobs = [0, -1, -1, -2];

  for (let frame = 0; frame < 4; frame++) {
    const ox = frame * 16;
    const cx = ox + 8;
    const bob = torsoBobs[frame];
    const torsoLeft = cx - Math.floor(torsoW / 2);
    const torsoTop = 6 + bob;

    const lLegY = 12 + leftLegLift[frame];
    const rLegY = 12 + rightLegLift[frame];
    g.fillStyle = legColor;
    g.fillRect(cx - 3, lLegY, 2, 3);
    g.fillRect(cx + 1, rLegY, 2, 3);
    g.fillStyle = frame >= 2 ? coreColor : trimColor;
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

  // Glide arm sweep: grounded neutral (0) -> windup (1) -> sustained glide (2) -> boost surge (3)
  const leftSweeps = [0, 0, -1, -1];
  const rightSweeps = [0, -1, -1, -2];
  const shoulderBobs = [0, -1, -1, -2];

  for (let frame = 0; frame < 4; frame++) {
    const ox = frame * 16;
    const cx = ox + 8;
    const bob = shoulderBobs[frame];
    const baseY = 6 + bob;

    const leftArmX = cx - 4 - armW;
    const rightArmX = cx + 4;
    const lY = baseY + leftSweeps[frame];
    const rY = baseY + rightSweeps[frame];

    g.fillStyle = shoulderColor;
    if (shoulderStyle === 'heavy') {
      g.fillRect(leftArmX - 1, baseY - 1, armW + 2, 3);
      g.fillRect(rightArmX - 1, baseY - 1, armW + 2, 3);
    } else if (shoulderStyle === 'prism') {
      const floatOff = frame >= 2 ? -1 : 0;
      g.fillStyle = cuffColor;
      g.fillRect(leftArmX, baseY - 1 + floatOff, armW, 2);
      g.fillRect(rightArmX, baseY - 1 + floatOff, armW, 2);
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
  const headBobs = [0, -1, -1, -2];

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
  sourceKey: string;
  drawable: HTMLImageElement | HTMLCanvasElement;
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
  flipX: boolean;
  needsPostOutline: boolean;
}

/**
 * Resolves the exact 16x16 source rectangle and drawable for a single mech part layer (`plating`, `arms`, or `head`).
 * Supports:
 * - 64x64 standalone 4-direction part sheet (4 directional rows x 4 glide frames)
 * - 64x16 standalone 1-row 4-frame strip
 * - Procedural fallback 64x16 strip for standalone parts without a Base64 PNG
 */
function resolvePartLayerSlice(
  slot: 'plating' | 'arms' | 'head',
  def: CanonicalHardwareItemDefinition | FramePlatingDefinition,
  dir: OrionDir | 'N' | 'S' | 'E' | 'W',
  frameCol: number,
  isCriticalBlink: boolean
): ResolvedLayerSlice {
  const cardinalDir = toCardinalFacing(dir);
  const partSprite = def.partSprite;
  const cellW = partSprite?.cellWidth || 16;
  const cellH = partSprite?.cellHeight || 16;
  const frameCount = partSprite?.frameCount || 4;
  const frameIdx = Math.max(0, Math.min(frameCount - 1, frameCol % frameCount));

  const isWest = cardinalDir === 'W';
  const isNorth = cardinalDir === 'N';

  if (partSprite?.base64) {
    const img = getDecodedPartStripImage(partSprite.base64);
    if (img && img.complete && img.naturalWidth > 0) {
      const dirRows =
        partSprite.directionalRows ?? (img.naturalHeight >= cellH * 4 ? 4 : 1);

      if (dirRows >= 4) {
        // Row 0 = East/Right, Row 1 = West/Left, Row 2 = South/Down, Row 3 = North/Up
        const dirRow =
          cardinalDir === 'N'
            ? 3
            : cardinalDir === 'S'
              ? 2
              : cardinalDir === 'W'
                ? 1
                : 0;
        return {
          sourceKey: `${slot}:${def.id}:sheet`,
          drawable: img,
          srcX: frameIdx * cellW,
          srcY: dirRow * cellH,
          srcW: cellW,
          srcH: cellH,
          flipX: false,
          needsPostOutline: true,
        };
      }

      return {
        sourceKey: `${slot}:${def.id}:strip`,
        drawable: img,
        srcX: frameIdx * cellW,
        srcY: 0,
        srcW: cellW,
        srcH: cellH,
        flipX: isWest,
        needsPostOutline: true,
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
    sourceKey: key,
    drawable: baked,
    srcX: (frameIdx % 4) * 16,
    srcY: 0,
    srcW: 16,
    srcH: 16,
    flipX: isWest,
    needsPostOutline: false,
  };
}

/**
 * Type contract for `DrawCompositePlayerOptions` (draw composite player options) in `playerSpriteSystem.ts`.
 */
export interface DrawCompositePlayerOptions {
  dir?: OrionDir;
  /** Explicit 0-based frame column override (`0` = Frame 1 Idle, `1` = Frame 2, `2` = Frame 3 Glide, `3` = Frame 4 Boost) */
  overrideFrame?: 0 | 1 | 2 | 3;
  isAttacking?: boolean;
  /** Optional override for Main Hand (`slot1`, Right) weapon ID in preview canvases */
  mainWeaponId?: string | null;
  /** Optional override for Side Hand (`slot2`, Left) weapon/item ID in preview canvases */
  sideWeaponId?: string | null;
  /** Optional override for Auxiliary (`slot3`, Back) weapon/item ID in preview canvases */
  auxWeaponId?: string | null;
  /** Set `true` to suppress rendering the Main (Right), Side (Left), and Aux (Back) weapon hardpoints */
  hideWeaponMounts?: boolean;
}

/**
 * Resolves an 8-way OrionDir into one of the 4 canonical sprite facings ('N' | 'S' | 'E' | 'W')
 * so character chassis layers and weapon hardpoints are always 100% locked to the same 4 facings.
 */
export function toCardinalFacing(dir: OrionDir | string | undefined): 'N' | 'S' | 'E' | 'W' {
  if (!dir) return 'S';
  if (dir === 'N' || dir === 'S' || dir === 'E' || dir === 'W') return dir;
  switch (dir) {
    case 'NE':
    case 'SE':
      return 'E';
    case 'NW':
    case 'SW':
      return 'W';
    default:
      return 'S';
  }
}

/**
 * Determines whether an equipped item ID should be visually rendered on the player sprite hardpoints.
 * Excludes consumables (flasks, draughts, potions), gemstones, currency, and non-combat inventory items.
 */
export function isRenderableWeaponMount(itemId: string | null | undefined): boolean {
  if (!itemId) return false;
  const itemDef = getItemDefinition(itemId);
  if (
    itemDef?.category === 'consumable' ||
    itemDef?.category === 'key' ||
    itemDef?.category === 'valuable'
  ) {
    return false;
  }
  const weaponDef = getWeaponDefinition(itemId);
  if (!weaponDef) return false;
  return true;
}

const CARDINAL_MOUNT_VECTORS: Record<'N' | 'S' | 'E' | 'W', { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  S: { dx: 0, dy: 1 },
  E: { dx: 1, dy: 0 },
  W: { dx: -1, dy: 0 },
};

const COMPONENT_OUTLINE_COLOR = '#05070a';

/**
 * Resolves the grip/mount pivot coordinate `(gripCellX, gripCellY)` inside a `16x16` weapon sprite cell
 * so rotations and flips stay locked to the Mech's hand or dorsal back mount.
 * Does not mutate `state: OrionState`.
 */
function resolveEquipmentCellGripPivot(
  itemId: string,
  equipmentRole: string | undefined,
  mountRole: 'main' | 'side' | 'aux'
): { gripCellX: number; gripCellY: number; scale: number } {
  const arch = classifyWeaponCombatArchetype(getWeaponDefinition(itemId), itemId);
  const isBolter = equipmentRole === 'ranged' && !arch.isBow;
  const isMelee = equipmentRole === 'melee';
  const isShield = equipmentRole === 'shield';
  const isCatalyst = equipmentRole === 'catalyst';

  if (mountRole === 'aux') {
    // Back-stowed items pivot around their visual center of mass
    if (isBolter) {
      return { gripCellX: 6.5, gripCellY: 13.0, scale: 0.68 };
    }
    if (isShield || isCatalyst) {
      return { gripCellX: 8.0, gripCellY: 8.0, scale: 0.68 };
    }
    return { gripCellX: 8.0, gripCellY: 8.0, scale: 0.68 };
  }

  // Hand-held Main (Right) or Side (Left) mounts pivot around the weapon's hilt / handle
  const handScale = mountRole === 'main' ? 0.78 : 0.72;
  if (isMelee) {
    // Melee strips (Long Sword, Shotel, Mace, Axe, Spear) have their hilt at bottom-left (3.5, 12.5)
    return { gripCellX: 3.5, gripCellY: 12.5, scale: handScale };
  }
  if (isBolter) {
    // Boltcaster strip has its grip/receiver at bottom-left (3.5, 13.0)
    return { gripCellX: 3.5, gripCellY: 13.0, scale: handScale };
  }
  if (isShield || isCatalyst) {
    return { gripCellX: 8.0, gripCellY: 8.0, scale: 0.72 };
  }
  return { gripCellX: 6.5, gripCellY: 8.5, scale: handScale };
}

/**
 * 2.5D perspective transform and choreography state for a single weapon hardpoint (`main`, `side`, or `aux`).
 */
interface HardpointProjection25D {
  /** Horizontal hand/mount mirror (`1` = East-authored right hand, `-1` = mirrored West/left hand) */
  flipX: number;
  /** Local weapon rotation in radians (applied after screen-space foreshortening and flipX) */
  rotationRad: number;
  /** Screen-space horizontal perspective foreshortening (`1.0` in E/W profile, `0.64..0.95` in N/S) */
  foreshortenScaleX: number;
  /** Screen-space vertical perspective foreshortening (`1.0` in E/W profile, `0.78..0.96` in N/S) */
  foreshortenScaleY: number;
  /** Screen-space horizontal shear (`g.transform(1, skewY, skewX, 1, 0, 0)`) for 2.5D isometric depth */
  skewX: number;
  /** Screen-space vertical shear for 2.5D isometric depth */
  skewY: number;
  /** Atmospheric depth darkening (`0..0.28`) when recessed behind the torso in North/South facings */
  depthShadeAlpha: number;
  /** True when a Caster/Carrier is aimed South toward the camera and should render a foreshortened muzzle bore */
  showSouthMuzzleCue: boolean;
  /** Projected screen-space unit vector `(aimCos, aimSin)` along the weapon's barrel/blade axis */
  aimCos: number;
  aimSin: number;
}

/**
 * Computes class-specific 2.5D angles, perspective foreshortening (`foreshortenScaleX/Y`), isometric shear (`skewX/Y`),
 * and depth shading for East-authored weapon strips so North (`N`) and South (`S`) facings look three-dimensional
 * rather than like flat 2D paper stickers.
 * Does not mutate `state: OrionState`.
 */
function resolveClassBaseProjection25D(
  weaponDef: ReturnType<typeof getWeaponDefinition>,
  arch: ReturnType<typeof classifyWeaponCombatArchetype>,
  mountRole: 'main' | 'side' | 'aux',
  cardinalDir: 'N' | 'S' | 'E' | 'W',
  isGuarding: boolean
): Omit<HardpointProjection25D, 'aimCos' | 'aimSin'> {
  const isNorth = cardinalDir === 'N';
  const isSouth = cardinalDir === 'S';
  const isWest = cardinalDir === 'W';
  const isEast = cardinalDir === 'E';

  const isBow = arch.isBow;
  const isShield = arch.isShield;
  const isSpear = arch.isSpearOrPolearm;
  const isImpactOrAxe = arch.isImpactOrAxe || arch.isBluntOrStaff;
  const isRangedCasterOrCarrier =
    (weaponDef?.equipmentRole === 'ranged' || arch.isQuiverOrBandolier) && !isBow;

  // 1. AUX BACK-STOWED MOUNT (slot3)
  if (mountRole === 'aux') {
    if (isNorth) {
      // Back faces camera: diagonal dorsal stow across the backplate with subtle planar compression
      return {
        flipX: 1,
        rotationRad: isRangedCasterOrCarrier ? -0.52 : isShield ? -0.12 : -0.26,
        foreshortenScaleX: 0.88,
        foreshortenScaleY: 0.92,
        skewX: -0.08,
        skewY: 0.04,
        depthShadeAlpha: 0,
        showSouthMuzzleCue: false,
      };
    }
    if (isSouth) {
      // Front faces camera: stowed behind the torso, foreshortened upper pommel/barrel peeking over shoulder
      return {
        flipX: 1,
        rotationRad: isRangedCasterOrCarrier ? -0.78 : -0.18,
        foreshortenScaleX: 0.74,
        foreshortenScaleY: 0.78,
        skewX: 0.1,
        skewY: 0,
        depthShadeAlpha: 0.24,
        showSouthMuzzleCue: false,
      };
    }
    // East / West profile back stow
    return {
      flipX: isWest ? -1 : 1,
      rotationRad: isRangedCasterOrCarrier ? -1.02 : -0.15,
      foreshortenScaleX: 0.86,
      foreshortenScaleY: 0.94,
      skewX: 0,
      skewY: 0,
      depthShadeAlpha: 0.14,
      showSouthMuzzleCue: false,
    };
  }

  // Handedness sign: Main Hand (Right) = +1 on S/N/E and -1 on W; Side Hand (Left) = +1 on E and -1 on S/N/W
  const flipX = mountRole === 'main' ? (isWest ? -1 : 1) : isEast ? 1 : -1;
  const sideSign = mountRole === 'main' ? 1 : -1;

  // 2. EAST / WEST SIDE PROFILE (Native orientation for East-authored weapon strips)
  if (isEast || isWest) {
    const isFarArm = (mountRole === 'main' && isWest) || (mountRole === 'side' && isEast);
    const profileRot =
      mountRole === 'side' && isEast
        ? isShield
          ? 0.08
          : isRangedCasterOrCarrier
            ? -0.08
            : 0.34
        : isShield
          ? 0
          : isBow
            ? 0.05
            : isSpear
              ? 0.22
              : isRangedCasterOrCarrier
                ? 0.04
                : 0.12;
    return {
      flipX,
      rotationRad: profileRot,
      foreshortenScaleX: isFarArm ? 0.92 : 1.0,
      foreshortenScaleY: isFarArm ? 0.94 : 1.0,
      skewX: 0,
      skewY: 0,
      depthShadeAlpha: isFarArm ? 0.12 : 0,
      showSouthMuzzleCue: false,
    };
  }

  // 3. SOUTH FACING ('S' — Toward the Camera):
  //    Compensates for the East-authored diagonal (-45° on melee/spears/axes, -22° on casters)
  //    so weapons angle downward-forward toward the camera with 2.5D perspective foreshortening.
  if (isSouth) {
    if (isShield) {
      return {
        flipX,
        rotationRad: isGuarding ? 0.06 : 0.18,
        foreshortenScaleX: isGuarding ? 0.95 : 0.78,
        foreshortenScaleY: 0.96,
        skewX: -0.08 * sideSign,
        skewY: 0.04,
        depthShadeAlpha: 0,
        showSouthMuzzleCue: false,
      };
    }
    if (isBow) {
      return {
        flipX,
        rotationRad: 0.56,
        foreshortenScaleX: 0.68,
        foreshortenScaleY: 0.92,
        skewX: -0.15 * sideSign,
        skewY: 0.06,
        depthShadeAlpha: 0,
        showSouthMuzzleCue: false,
      };
    }
    if (isRangedCasterOrCarrier) {
      return {
        flipX,
        rotationRad: 0.92,
        foreshortenScaleX: 0.72,
        foreshortenScaleY: 0.86,
        skewX: -0.16 * sideSign,
        skewY: 0.08,
        depthShadeAlpha: 0,
        showSouthMuzzleCue: true,
      };
    }
    if (isSpear) {
      return {
        flipX,
        rotationRad: 1.28,
        foreshortenScaleX: 0.7,
        foreshortenScaleY: 0.9,
        skewX: -0.18 * sideSign,
        skewY: 0.08,
        depthShadeAlpha: 0,
        showSouthMuzzleCue: false,
      };
    }
    if (isImpactOrAxe) {
      return {
        flipX,
        rotationRad: 1.08,
        foreshortenScaleX: 0.78,
        foreshortenScaleY: 0.88,
        skewX: -0.12 * sideSign,
        skewY: 0.06,
        depthShadeAlpha: 0,
        showSouthMuzzleCue: false,
      };
    }
    // Straight & Curved Blades
    return {
      flipX,
      rotationRad: 1.14,
      foreshortenScaleX: 0.75,
      foreshortenScaleY: 0.88,
      skewX: -0.14 * sideSign,
      skewY: 0.06,
      depthShadeAlpha: 0,
      showSouthMuzzleCue: false,
    };
  }

  // 4. NORTH FACING ('N' — Away from the Camera, rendered in behindBody pass):
  //    Angles weapons up-forward away from the camera with tips peeking past the shoulders,
  //    perspective foreshortening, and a subtle atmospheric depth tint.
  if (isShield) {
    return {
      flipX,
      rotationRad: -0.16,
      foreshortenScaleX: isGuarding ? 0.86 : 0.76,
      foreshortenScaleY: 0.9,
      skewX: 0.08 * sideSign,
      skewY: -0.04,
      depthShadeAlpha: 0.18,
      showSouthMuzzleCue: false,
    };
  }
  if (isBow) {
    return {
      flipX,
      rotationRad: -0.48,
      foreshortenScaleX: 0.68,
      foreshortenScaleY: 0.86,
      skewX: 0.12 * sideSign,
      skewY: -0.05,
      depthShadeAlpha: 0.2,
      showSouthMuzzleCue: false,
    };
  }
  if (isRangedCasterOrCarrier) {
    return {
      flipX,
      rotationRad: -0.66,
      foreshortenScaleX: 0.72,
      foreshortenScaleY: 0.82,
      skewX: 0.14 * sideSign,
      skewY: -0.06,
      depthShadeAlpha: 0.22,
      showSouthMuzzleCue: false,
    };
  }
  if (isSpear) {
    return {
      flipX,
      rotationRad: -0.38,
      foreshortenScaleX: 0.7,
      foreshortenScaleY: 0.85,
      skewX: 0.14 * sideSign,
      skewY: -0.06,
      depthShadeAlpha: 0.2,
      showSouthMuzzleCue: false,
    };
  }
  if (isImpactOrAxe) {
    return {
      flipX,
      rotationRad: -0.28,
      foreshortenScaleX: 0.76,
      foreshortenScaleY: 0.84,
      skewX: 0.1 * sideSign,
      skewY: -0.05,
      depthShadeAlpha: 0.2,
      showSouthMuzzleCue: false,
    };
  }
  // Straight & Curved Blades
  return {
    flipX,
    rotationRad: -0.32,
    foreshortenScaleX: 0.74,
    foreshortenScaleY: 0.84,
    skewX: 0.12 * sideSign,
    skewY: -0.05,
    depthShadeAlpha: 0.2,
    showSouthMuzzleCue: false,
  };
}

/**
 * Finalizes the projected screen-space unit vector `(aimCos, aimSin)` of the weapon's shaft/barrel
 * after applying `rotationRad`, `flipX`, and `foreshortenScaleX/Y` so attachment overlays and muzzle cues align.
 */
function finalizeHardpointProjection25D(
  base: Omit<HardpointProjection25D, 'aimCos' | 'aimSin'>,
  intrinsicAngleRad: number
): HardpointProjection25D {
  const localAngle = intrinsicAngleRad + base.rotationRad;
  const rawX = Math.cos(localAngle) * base.flipX;
  const rawY = Math.sin(localAngle);
  const sx = (rawX + base.skewX * rawY) * base.foreshortenScaleX;
  const sy = (rawY + base.skewY * rawX) * base.foreshortenScaleY;
  const len = Math.hypot(sx, sy) || 1;
  return {
    ...base,
    aimCos: sx / len,
    aimSin: sy / len,
  };
}

/**
 * Renders a single equipped weapon or auxiliary item at `(mx, my)` for the `'main'` (Right Hand),
 * `'side'` (Left Hand), or `'aux'` (Back Stowed) mount with 2.5D perspective foreshortening,
 * isometric shear, depth shading, and a 1px post-processed silhouette outline.
 * Does not mutate `state: OrionState`.
 */
function drawSinglePlayerEquipmentMount(
  g: CanvasRenderingContext2D,
  state: OrionState,
  itemId: string,
  mountRole: 'main' | 'side' | 'aux',
  mx: number,
  my: number,
  proj: HardpointProjection25D,
  cardinalDir: 'N' | 'S' | 'E' | 'W' = 'S'
): void {
  if (!itemId || !isRenderableWeaponMount(itemId)) return;
  const weaponDef = getWeaponDefinition(itemId);
  const spriteCfg = weaponDef?.hardpointSprite;
  const gemVis = getWeaponGemVisuals(state, itemId);

  if (spriteCfg?.base64) {
    const src = getBase64Image(spriteCfg.base64);
    if (src) {
      const cellW = spriteCfg.cellWidth || 16;
      const cellH = spriteCfg.cellHeight || 16;
      const col = weaponDef ? gemVis.colIndex : (spriteCfg.col ?? 0);
      const row = weaponDef && gemVis.gemId ? 0 : (spriteCfg.row ?? 0);
      const srcW = 'naturalWidth' in src ? src.naturalWidth || src.width : src.width;
      const srcH = 'naturalHeight' in src ? src.naturalHeight || src.height : src.height;
      const { srcX, srcY } = resolveSpriteStripSliceCoords(
        srcW,
        srcH,
        col,
        row,
        cellW,
        cellH
      );

      const outlined = getOutlinedSpriteCanvas(
        spriteCfg.base64,
        src,
        srcX,
        srcY,
        cellW,
        cellH,
        COMPONENT_OUTLINE_COLOR
      );

      if (outlined) {
        const { gripCellX, gripCellY, scale } = resolveEquipmentCellGripPivot(
          itemId,
          weaponDef?.equipmentRole,
          mountRole
        );
        const destW = outlined.width * scale;
        const destH = outlined.height * scale;
        const drawX = -(gripCellX + 1) * scale;
        const drawY = -(gripCellY + 1) * scale;

        g.save();
        g.translate(Math.round(mx), Math.round(my));
        if (proj.foreshortenScaleX !== 1 || proj.foreshortenScaleY !== 1) {
          g.scale(proj.foreshortenScaleX, proj.foreshortenScaleY);
        }
        if (proj.skewX !== 0 || proj.skewY !== 0) {
          g.transform(1, proj.skewY, proj.skewX, 1, 0, 0);
        }
        if (proj.flipX !== 1) {
          g.scale(proj.flipX, 1);
        }
        if (proj.rotationRad !== 0) {
          g.rotate(proj.rotationRad);
        }
        if (proj.depthShadeAlpha > 0) {
          g.globalAlpha = Math.max(0.72, 1 - proj.depthShadeAlpha * 0.65);
        }
        g.drawImage(
          outlined,
          0,
          0,
          outlined.width,
          outlined.height,
          drawX,
          drawY,
          destW,
          destH
        );
        g.restore();

        // Foreshortened South-facing Caster/Carrier muzzle bore cue so the barrel reads aimed at the camera
        if (proj.showSouthMuzzleCue) {
          const muzzleX = Math.round(mx + proj.aimCos * 4.5);
          const muzzleY = Math.round(my + proj.aimSin * 4.5);
          const boreGlow = gemVis.gemId
            ? gemVis.color
            : weaponDef?.bladeTrailColor || '#38bdf8';
          g.save();
          g.fillStyle = COMPONENT_OUTLINE_COLOR;
          g.fillRect(muzzleX - 1, muzzleY - 1, 3, 3);
          g.fillStyle = '#0f172a';
          g.fillRect(muzzleX, muzzleY, 2, 2);
          g.fillStyle = boreGlow;
          g.fillRect(muzzleX, muzzleY, 1, 1);
          g.restore();
        }
        return;
      }
    }
  }

  if (weaponDef?.renderHardpoint25D && mountRole !== 'aux') {
    const dirVec = CARDINAL_MOUNT_VECTORS[cardinalDir] || CARDINAL_MOUNT_VECTORS.S;
    weaponDef.renderHardpoint25D(g, mx, my, dirVec.dx, dirVec.dy, state);
    return;
  }

  // Fallback pixel-art hardpoint silhouette with 1px dark outline (#05070a)
  g.save();
  g.translate(Math.round(mx), Math.round(my));
  if (proj.foreshortenScaleX !== 1 || proj.foreshortenScaleY !== 1) {
    g.scale(proj.foreshortenScaleX, proj.foreshortenScaleY);
  }
  if (proj.flipX !== 1) {
    g.scale(proj.flipX, 1);
  }
  if (proj.rotationRad !== 0) {
    g.rotate(proj.rotationRad);
  }
  if (itemId.includes('catalyst')) {
    g.fillStyle = COMPONENT_OUTLINE_COLOR;
    g.fillRect(-3, -3, 6, 6);
    g.fillStyle = '#e879f9';
    g.fillRect(-2, -2, 4, 4);
    g.fillStyle = '#f8fafc';
    g.fillRect(-1, -1, 2, 2);
  } else if (itemId.includes('shield') || itemId.includes('buckler')) {
    g.fillStyle = COMPONENT_OUTLINE_COLOR;
    g.fillRect(-3, -4, 6, 8);
    g.fillStyle = '#38bdf8';
    g.fillRect(-2, -3, 4, 6);
    g.fillStyle = '#bae6fd';
    g.fillRect(-1, -2, 2, 4);
  } else if (mountRole === 'aux') {
    g.fillStyle = COMPONENT_OUTLINE_COLOR;
    g.fillRect(-2, -4, 4, 8);
    g.fillStyle = '#c084fc';
    g.fillRect(-1, -3, 2, 6);
    g.fillStyle = '#fde047';
    g.fillRect(-1, -3, 2, 2);
  } else {
    g.fillStyle = COMPONENT_OUTLINE_COLOR;
    g.fillRect(-2, -4, 4, 8);
    g.fillStyle = mountRole === 'main' ? '#38bdf8' : '#94a3b8';
    g.fillRect(-1, -3, 2, 6);
  }
  g.restore();
}

/**
 * Renders a crisp pixel-art attachment/grip overlay (`1px` `#05070a` outline + equipped Arms/Plating palette)
 * aligned to the weapon's 2.5D projected axis `(aimCos, aimSin)` so that:
 * - Hand-held weapons (`main` / `side`) have the Mech's gauntlet knuckle clasp wrapped **in front of the weapon handle/hilt**,
 *   making the sword/axe/spear handle visibly tuck behind the front arm/hand while the blade extends outward.
 * - `2-hand` weapons and `Bows` show the secondary support hand clasping the foregrip or drawing the bowstring.
 * - `Shields` show an armored forearm strap and boss clamp locking the shield to the arm cuff.
 * - `Aux` (back-stowed) weapons show a dorsal magnetic holster clamp or diagonal shoulder-sling latch.
 * Does not mutate `state: OrionState`.
 */
function drawEquipmentAttachmentOverlay(
  g: CanvasRenderingContext2D,
  state: OrionState,
  mountRole: 'main' | 'side' | 'aux',
  mx: number,
  my: number,
  cardinalDir: 'N' | 'S' | 'E' | 'W',
  options?: {
    isShield?: boolean;
    isBow?: boolean;
    isTwoHanded?: boolean;
    bowChargePct?: number;
    aimCos?: number;
    aimSin?: number;
    trailColor?: string;
  }
): void {
  const { framePlatingDef, armsDef } = resolvePlayerSpriteParts(state);
  const cuffColor = armsDef.spriteTheme?.cuffColor || '#38bdf8';
  const armColor = armsDef.spriteTheme?.armColor || '#475569';
  const trimColor = framePlatingDef.spriteTheme?.trimColor || '#38bdf8';
  const coreColor = framePlatingDef.spriteTheme?.reactorGlowColor || '#ea580c';

  const rx = Math.round(mx);
  const ry = Math.round(my);

  g.save();
  if (mountRole === 'aux') {
    if (cardinalDir === 'N') {
      // Dorsal magnetic holster bracket clamped across the stowed weapon spine on the backplate
      g.fillStyle = COMPONENT_OUTLINE_COLOR;
      g.fillRect(rx - 3, ry - 2, 6, 4);
      g.fillStyle = armColor;
      g.fillRect(rx - 2, ry - 1, 4, 2);
      g.fillStyle = coreColor;
      g.fillRect(rx - 1, ry - 1, 2, 1);
    } else {
      // Shoulder-collar sling latch peeking over the torso armor so the back weapon looks strapped on
      const latchX = cardinalDir === 'W' ? rx - 1 : rx + 1;
      g.fillStyle = COMPONENT_OUTLINE_COLOR;
      g.fillRect(latchX - 2, ry + 1, 4, 3);
      g.fillStyle = trimColor;
      g.fillRect(latchX - 1, ry + 2, 2, 1);
    }
    g.restore();
    return;
  }

  // SHIELD FOREARM STRAP & BOSS CLAMP
  if (options?.isShield) {
    g.fillStyle = COMPONENT_OUTLINE_COLOR;
    g.fillRect(rx - 2, ry - 2, 4, 4);
    g.fillStyle = trimColor;
    g.fillRect(rx - 1, ry - 1, 2, 2);
    g.fillStyle = '#f8fafc';
    g.fillRect(rx, ry - 1, 1, 1);
    g.restore();
    return;
  }

  // HAND GAUNTLET KNUCKLE CLASP OVER THE WEAPON HANDLE/HILT PIVOT
  // Drawn ON TOP of the weapon hilt so the handle tucks behind the front hand/fingers!
  if (cardinalDir !== 'N') {
    g.fillStyle = COMPONENT_OUTLINE_COLOR;
    g.fillRect(rx - 2, ry - 2, 4, 4);
    g.fillStyle = armColor;
    g.fillRect(rx - 1, ry - 1, 2, 2);
    g.fillStyle = cuffColor;
    g.fillRect(rx - 1, ry, 2, 1);
  }

  const dirVec = CARDINAL_MOUNT_VECTORS[cardinalDir] || CARDINAL_MOUNT_VECTORS.S;
  const aimCos = options?.aimCos ?? dirVec.dx;
  const aimSin = options?.aimSin ?? dirVec.dy;

  // BOW DRAW-STRING, ARROW SHAFT & OFF-HAND NOCK CLASP (Foreshortened in N/S)
  if (options?.isBow) {
    const chargePct = Math.max(0, Math.min(1, options.bowChargePct || 0));
    const isNS = cardinalDir === 'N' || cardinalDir === 'S';
    const pullDist = (isNS ? 1.6 : 2.0) + chargePct * (isNS ? 2.6 : 3.5);
    const limbSpan = isNS ? 3.0 : 4.0;
    const perpX = -aimSin * limbSpan;
    const perpY = aimCos * limbSpan;

    const nockX = Math.round(rx - aimCos * pullDist);
    const nockY = Math.round(ry - aimSin * pullDist);
    const tipX = Math.round(rx + aimCos * (isNS ? 4.0 : 5.0));
    const tipY = Math.round(ry + aimSin * (isNS ? 4.0 : 5.0));

    // Taut bowstring lines from upper/lower limb tips to nock hand
    g.strokeStyle = chargePct > 0.8 ? '#fde047' : '#cbd5e1';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(rx + perpX, ry + perpY);
    g.lineTo(nockX, nockY);
    g.lineTo(rx - perpX, ry - perpY);
    g.stroke();

    // Nocked arrow shaft & glowing arrowhead when charging
    if (chargePct > 0.02) {
      g.strokeStyle = options.trailColor || '#38bdf8';
      g.beginPath();
      g.moveTo(nockX, nockY);
      g.lineTo(tipX, tipY);
      g.stroke();
      g.fillStyle = chargePct >= 0.85 ? '#fde047' : '#ffffff';
      g.fillRect(tipX - 1, tipY - 1, 2, 2);
    }

    // Off-hand draw gauntlet clasp at the string nock
    g.fillStyle = COMPONENT_OUTLINE_COLOR;
    g.fillRect(nockX - 1, nockY - 1, 3, 3);
    g.fillStyle = cuffColor;
    g.fillRect(nockX, nockY, 1, 1);
  } else if (options?.isTwoHanded && cardinalDir !== 'N') {
    // TWO-HANDED (2H) SECONDARY FOREGRIP GAUNTLET CLASP ALONG PROJECTED SHAFT AXIS
    const foreX = Math.round(rx + aimCos * 2.4);
    const foreY = Math.round(ry + aimSin * 2.4);
    g.fillStyle = COMPONENT_OUTLINE_COLOR;
    g.fillRect(foreX - 1, foreY - 1, 3, 3);
    g.fillStyle = cuffColor;
    g.fillRect(foreX, foreY, 1, 1);
  }

  g.restore();
}

/**
 * Resolves the active move style (`slash`, `chop`, `thrust`, `slam`, `bash`, `whirlwind`, `volley`, etc.)
 * for the currently winding-up or executing weapon attack/skill so weapon hardpoints animate to match.
 */
function resolveActiveWeaponMoveStyle(
  state: OrionState,
  mainDef: ReturnType<typeof getWeaponDefinition>,
  mainArch: ReturnType<typeof classifyWeaponCombatArchetype>
): string {
  const slot = state.activeSkillSlot;
  if (slot === 0 && mainDef?.moveset[0]?.comboSequence?.length) {
    const seq = mainDef.moveset[0].comboSequence;
    // During windup, state.meleeComboStep is the current step; during action, executeBasicAttackShot incremented it by 1
    const isWinding = (state.skillTellTimer || 0) > 0;
    const rawStep = state.meleeComboStep || 0;
    const idx = isWinding
      ? rawStep % seq.length
      : (rawStep - 1 + seq.length) % seq.length;
    return seq[idx]?.style || 'slash';
  }
  if (slot !== null && slot >= 1 && slot <= 4 && mainDef?.moveset[slot]) {
    const act = mainDef.moveset[slot];
    const txt = `${act.name} ${act.description}`.toLowerCase();
    if (
      txt.includes('full-rotation') ||
      txt.includes('horizon-severing') ||
      txt.includes('whirl') ||
      txt.includes('tempest') ||
      txt.includes('spin')
    ) {
      return 'whirlwind';
    }
    if (
      txt.includes('slam') ||
      txt.includes('drop') ||
      txt.includes('split') ||
      txt.includes('guillotine') ||
      txt.includes('downdraft')
    ) {
      return 'slam';
    }
    if (
      txt.includes('thrust') ||
      txt.includes('impale') ||
      txt.includes('skewer') ||
      txt.includes('stab') ||
      txt.includes('lance') ||
      txt.includes('beam') ||
      txt.includes('ray')
    ) {
      return 'thrust';
    }
    if (
      txt.includes('hook') ||
      txt.includes('snag') ||
      txt.includes('wrench') ||
      txt.includes('chop') ||
      txt.includes('hew') ||
      txt.includes('cleave')
    ) {
      return 'chop';
    }
    if (mainArch.isShield || txt.includes('bash') || txt.includes('ram') || txt.includes('press')) {
      return 'bash';
    }
  }
  if (mainArch.isSpearOrPolearm) return 'thrust';
  if (mainArch.isBluntOrStaff || mainArch.isImpactOrAxe) return 'chop';
  if (mainArch.isShield) return 'bash';
  if (!mainArch.isMeleeOrShield) return 'volley';
  return 'slash';
}

/**
 * Renders the pilot's three weapon hardpoints (`Main Hand [Right]`, `Side Hand [Left]`, and `Aux [Back]`)
 * across three anatomical depth passes (`'behindBody'`, `'betweenPlatingAndArms'`, `'inFrontOfBody'`)
 * with class-specific 2.5D North/South perspective foreshortening, procedural gauntlet/holster attachment overlays,
 * and facing-aligned Main + Side Hand choreography.
 * Does not mutate `state: OrionState`.
 */
export function drawPlayerWeaponMounts25D(
  g: CanvasRenderingContext2D,
  state: OrionState,
  cx: number,
  cy: number,
  dir: OrionDir | 'N' | 'S' | 'E' | 'W',
  timeSec: number,
  pass: 'behindBody' | 'betweenPlatingAndArms' | 'inFrontOfBody',
  options?: DrawCompositePlayerOptions
): void {
  void timeSec;
  const cardinalDir = toCardinalFacing(dir);

  const rawMainId =
    options?.mainWeaponId !== undefined
      ? options.mainWeaponId || ''
      : state.equipmentSlots?.slot1 ||
        state.equippedWeapons?.[state.activeWeaponIndex || 0] ||
        'gladius_boltcaster';
  const mainId = isRenderableWeaponMount(rawMainId) ? rawMainId : null;

  const rawSideId =
    options?.sideWeaponId !== undefined
      ? options.sideWeaponId
      : state.equipmentSlots !== undefined
        ? state.equipmentSlots.slot2
        : state.equippedWeapons?.[1] || null;
  const mainGrip = getEffectiveMainGrip(state);
  const sideCandidate =
    rawSideId && !(mainGrip === '2h' && rawSideId === rawMainId) ? rawSideId : null;
  const sideId = isRenderableWeaponMount(sideCandidate) ? sideCandidate : null;

  const rawAuxId =
    options?.auxWeaponId !== undefined
      ? options.auxWeaponId
      : state.equipmentSlots?.slot3 || state.equippedWeapons?.[2] || null;
  const auxId = isRenderableWeaponMount(rawAuxId) ? rawAuxId : null;

  const isNorth = cardinalDir === 'N';
  const isEast = cardinalDir === 'E';
  const isWest = cardinalDir === 'W';
  const isSouth = cardinalDir === 'S';
  const isNS = isNorth || isSouth;

  const isWindingUp = Boolean(
    state.activeSkillSlot !== null && (state.skillTellTimer || 0) > 0
  );
  const isAttacking = Boolean(
    options?.isAttacking ??
      (state.activeSkillSlot !== null &&
        (state.skillTellTimer || 0) <= 0 &&
        (state.skillActionTimer || 0) > 0)
  );
  const windupMax = Math.max(0.05, state.skillTellMaxTimer || 0.14);
  const windupPct = isWindingUp
    ? Math.max(0, Math.min(1, 1 - (state.skillTellTimer || 0) / windupMax))
    : 0;
  const actionMax = Math.max(0.08, state.skillActionMaxTimer || 0.22);
  const actionElapsedPct = isAttacking
    ? Math.max(0, Math.min(1, 1 - (state.skillActionTimer || 0) / actionMax))
    : 0;
  const isFollowThrough = isAttacking && actionElapsedPct > 0.6;
  const recoveryLerp = isFollowThrough ? 1 - (actionElapsedPct - 0.6) / 0.4 : 1.0;
  const isGuarding = Boolean(state.isHoldingBlock || (state.blockTimer || 0) > 0);

  // 1. AUX (BACK — slot3):
  //    - Facing North ('N'): back faces camera directly -> drawn inFrontOfBody centered on dorsal plate with magnetic holster bracket
  //    - Facing South ('S'), East ('E'), West ('W'): weapon drawn behindBody, plus shoulder sling latch in betweenPlatingAndArms
  const auxPass: 'behindBody' | 'inFrontOfBody' = isNorth ? 'inFrontOfBody' : 'behindBody';
  if (auxId) {
    const auxDef = getWeaponDefinition(auxId);
    const auxArch = classifyWeaponCombatArchetype(auxDef, auxId);

    const bx = isNorth
      ? cx
      : isEast
        ? cx - 3.5
        : isWest
          ? cx + 3.5
          : cx - 2.5;

    const by = isNorth
      ? cy - 8.5
      : isEast || isWest
        ? cy - 9.0
        : cy - 9.5;

    if (auxPass === pass) {
      const auxBaseProj = resolveClassBaseProjection25D(
        auxDef,
        auxArch,
        'aux',
        cardinalDir,
        false
      );
      const auxIntrinsic =
        auxDef?.equipmentRole === 'melee'
          ? -0.785
          : auxDef?.equipmentRole === 'ranged' && !auxArch.isBow
            ? -0.38
            : 0;
      const auxProj = finalizeHardpointProjection25D(auxBaseProj, auxIntrinsic);

      drawSinglePlayerEquipmentMount(
        g,
        state,
        auxId,
        'aux',
        bx,
        by,
        auxProj,
        cardinalDir
      );

      if (isNorth) {
        drawEquipmentAttachmentOverlay(g, state, 'aux', bx, by, cardinalDir);
      }
    } else if (!isNorth && pass === 'betweenPlatingAndArms') {
      drawEquipmentAttachmentOverlay(g, state, 'aux', bx, by - 2, cardinalDir);
    }
  }

  // 2. SIDE HAND (LEFT — slot2):
  //    - Facing South ('S') or West ('W'): near foreground arm -> inFrontOfBody (with gauntlet clasp over hilt)
  //    - Facing East ('E'): far profile arm -> betweenPlatingAndArms (sandwiched in front of torso, behind near arm!)
  //    - Facing North ('N'): far forward-reaching arm -> behindBody (foreshortened with tip peeking past left shoulder)
  const sidePass: 'behindBody' | 'betweenPlatingAndArms' | 'inFrontOfBody' = isNorth
    ? 'behindBody'
    : isEast
      ? 'betweenPlatingAndArms'
      : 'inFrontOfBody';

  if (sideId && sidePass === pass) {
    const sideDef = getWeaponDefinition(sideId);
    const sideArch = classifyWeaponCombatArchetype(sideDef, sideId);
    const sideIsMelee = sideDef?.equipmentRole === 'melee';
    const sideIsBolter = sideDef?.equipmentRole === 'ranged' && !sideArch.isBow;
    const sideIsShield = sideArch.isShield;
    const isOddComboStep = ((state.meleeComboStep || 0) % 2) === 1;

    const sideBaseProj = resolveClassBaseProjection25D(
      sideDef,
      sideArch,
      'side',
      cardinalDir,
      isGuarding
    );

    let sideThrustOffset = 0;
    let sideSwingRot = 0;
    let sideLiftY = 0;
    let sideLateralSweepX = 0;
    let sideDynamicScaleXMult = 1.0;

    if (isGuarding) {
      // Active Shield / Weapon Guard: project forward and raise into high ward stance
      sideThrustOffset = sideIsShield ? 2.6 : 1.8;
      sideLiftY = -1.5;
      sideSwingRot = isNS ? -0.14 : isWest ? 0.22 : -0.22;
      if (isSouth && sideIsShield) {
        sideLateralSweepX = 1.6;
      }
    } else if (isWindingUp) {
      if (sideIsMelee && isOddComboStep) {
        sideSwingRot = -0.48 * windupPct;
        sideThrustOffset = -1.2 * windupPct;
        if (isNS) {
          sideLateralSweepX = -1.6 * windupPct;
        }
      } else if (sideIsShield && state.activeSkillSlot !== null && state.activeSkillSlot >= 1) {
        sideThrustOffset = -1.4 * windupPct;
      }
    } else if (isAttacking) {
      if (sideIsMelee && (isOddComboStep || (state.activeSkillSlot || 0) >= 1)) {
        sideSwingRot = 0.68 * recoveryLerp;
        sideThrustOffset = 3.2 * recoveryLerp;
        if (isNS) {
          // Cross-body N/S off-hand slash sweeps toward centerline with perspective compression
          sideLateralSweepX = 3.0 * recoveryLerp;
          sideDynamicScaleXMult = 0.88;
        }
      } else if (sideIsShield && (state.activeSkillSlot || 0) >= 1) {
        sideThrustOffset = 3.8 * recoveryLerp;
        if (isNS) {
          sideLateralSweepX = 2.0 * recoveryLerp;
        }
      } else if (sideIsBolter) {
        sideThrustOffset = -1.4 * recoveryLerp;
      }
    }

    const baseLx = isEast
      ? cx + 2.5
      : isWest
        ? cx - 2.5
        : cx - 4.2;

    const baseLy = isEast
      ? cy - 7.5
      : isWest
        ? cy - 6.5
        : isNorth
          ? cy - 8.2
          : cy - 6.2;

    const sideDx =
      (isEast ? sideThrustOffset : isWest ? -sideThrustOffset : 0) + sideLateralSweepX;
    const sideDy = isSouth ? sideThrustOffset : isNorth ? -sideThrustOffset : 0;
    const lx = baseLx + sideDx;
    const ly = baseLy + sideDy + sideLiftY;

    const sideIntrinsic = sideIsMelee ? -0.785 : sideIsBolter ? -0.38 : 0;
    const sideProj = finalizeHardpointProjection25D(
      {
        ...sideBaseProj,
        rotationRad: sideBaseProj.rotationRad + sideSwingRot,
        foreshortenScaleX: sideBaseProj.foreshortenScaleX * sideDynamicScaleXMult,
      },
      sideIntrinsic
    );

    drawSinglePlayerEquipmentMount(
      g,
      state,
      sideId,
      'side',
      lx,
      ly,
      sideProj,
      cardinalDir
    );

    drawEquipmentAttachmentOverlay(g, state, 'side', lx, ly, cardinalDir, {
      isShield: sideIsShield,
      aimCos: sideProj.aimCos,
      aimSin: sideProj.aimSin,
    });

    if (isGuarding && sideIsShield) {
      g.save();
      g.fillStyle = (state.blockHoldTimer || 0) <= 0.34 ? '#fde047' : '#38bdf8';
      g.fillRect(Math.round(lx) - 1, Math.round(ly) - 3, 2, 2);
      g.restore();
    }
  }

  // 3. MAIN HAND (RIGHT — slot1):
  //    - Facing South ('S') or East ('E'): near foreground arm -> inFrontOfBody (with gauntlet clasp over hilt)
  //    - Facing West ('W'): far profile arm -> betweenPlatingAndArms (sandwiched in front of torso, behind near arm!)
  //    - Facing North ('N'): far forward-reaching arm -> behindBody (foreshortened with tip peeking past right shoulder)
  const mainPass: 'behindBody' | 'betweenPlatingAndArms' | 'inFrontOfBody' = isNorth
    ? 'behindBody'
    : isWest
      ? 'betweenPlatingAndArms'
      : 'inFrontOfBody';

  if (mainId && mainPass === pass) {
    const mainDef = getWeaponDefinition(mainId);
    const mainArch = classifyWeaponCombatArchetype(mainDef, mainId);
    const mainIsMelee = mainDef?.equipmentRole === 'melee';
    const isBow = mainArch.isBow;
    const isRanged = mainDef?.equipmentRole === 'ranged' || mainArch.isQuiverOrBandolier;
    const activeStyle = resolveActiveWeaponMoveStyle(state, mainDef, mainArch);
    const swingParity = ((state.meleeComboStep || state.ammo) % 2 === 0) ? 1 : -1;

    const mainBaseProj = resolveClassBaseProjection25D(
      mainDef,
      mainArch,
      'main',
      cardinalDir,
      isGuarding
    );

    const bowChargePct =
      isBow && state.isChargingBow
        ? Math.max(
            0,
            Math.min(1, (state.bowChargeTimer || 0) / Math.max(0.25, state.bowMaxChargeSec || 1.15))
          )
        : 0;

    // Style-Specific 3-Phase Keyframes (Windup -> Active Strike -> Follow-Through)
    // Includes dedicated N/S lateral sweep and dynamic foreshortening so N/S swings sweep across the facing axis
    let thrustOffset = 0;
    let swingRot = 0;
    let slamDropY = 0;
    let lateralSweepX = 0;
    let dynamicScaleXMult = 1.0;
    let dynamicScaleYMult = 1.0;

    if (isBow && state.isChargingBow) {
      thrustOffset = 1.6 + bowChargePct * 1.2;
      swingRot = isNS ? 0.08 * bowChargePct : -0.18 * bowChargePct;
      slamDropY = -0.8 * bowChargePct;
      if (isNS) {
        dynamicScaleXMult = 1 - bowChargePct * 0.1;
      }
    } else if (isWindingUp) {
      if (activeStyle === 'thrust') {
        thrustOffset = -2.8 * windupPct;
        if (isNS) {
          // Align shaft along the N/S thrust line on windup
          swingRot = (isSouth ? 0.22 : -0.22) * windupPct;
          dynamicScaleXMult = 1 - 0.12 * windupPct;
        }
      } else if (activeStyle === 'slam') {
        swingRot = -0.78 * windupPct;
        slamDropY = -3.2 * windupPct;
        if (isNS) {
          lateralSweepX = -1.2 * windupPct;
          dynamicScaleYMult = 1 + 0.08 * windupPct;
        }
      } else if (activeStyle === 'chop') {
        swingRot = -0.66 * windupPct;
        slamDropY = -2.0 * windupPct;
        thrustOffset = -1.0 * windupPct;
        if (isNS) {
          lateralSweepX = 1.4 * windupPct;
        }
      } else if (activeStyle === 'whirlwind') {
        swingRot = -swingParity * 0.85 * windupPct;
      } else if (activeStyle === 'bash') {
        thrustOffset = -1.8 * windupPct;
      } else if (isRanged) {
        thrustOffset = 1.0 * windupPct;
      } else {
        // 'slash': Wind up outward before sweeping across the facing plane
        swingRot = -swingParity * 0.56 * windupPct;
        thrustOffset = -1.2 * windupPct;
        if (isNS) {
          lateralSweepX = swingParity * 2.0 * windupPct;
        }
      }
    } else if (isAttacking) {
      if (activeStyle === 'thrust') {
        thrustOffset = 6.2 * recoveryLerp;
        if (isNS) {
          // Point blade/spear straight along the South (+Y) or North (-Y) vector with shaft foreshortening
          swingRot = (isSouth ? 0.34 : -0.3) * recoveryLerp;
          lateralSweepX = -1.2 * recoveryLerp;
          dynamicScaleXMult = 1 - 0.16 * recoveryLerp;
        }
      } else if (activeStyle === 'slam') {
        swingRot = 0.84 * recoveryLerp;
        slamDropY = (isNorth ? -2.8 : 3.4) * recoveryLerp;
        thrustOffset = 2.6 * recoveryLerp;
        if (isNS) {
          lateralSweepX = -1.8 * recoveryLerp;
          dynamicScaleXMult = 1 - 0.18 * recoveryLerp;
        }
      } else if (activeStyle === 'chop') {
        swingRot = 0.74 * recoveryLerp;
        slamDropY = (isNorth ? -2.2 : 2.4) * recoveryLerp;
        thrustOffset = 2.8 * recoveryLerp;
        if (isNS) {
          lateralSweepX = -2.2 * recoveryLerp;
          dynamicScaleXMult = 1 - 0.15 * recoveryLerp;
        }
      } else if (activeStyle === 'whirlwind') {
        swingRot = swingParity * actionElapsedPct * Math.PI * 2;
        thrustOffset = 2.5 * recoveryLerp;
        if (isNS) {
          lateralSweepX = Math.cos(actionElapsedPct * Math.PI * 2) * 3.2;
          dynamicScaleXMult = 0.78 + 0.22 * Math.abs(Math.cos(actionElapsedPct * Math.PI * 2));
        }
      } else if (activeStyle === 'bash') {
        thrustOffset = 4.4 * recoveryLerp;
        if (isNS) {
          lateralSweepX = -1.5 * recoveryLerp;
        }
      } else if (isRanged) {
        thrustOffset = -2.2 * recoveryLerp;
        swingRot = isNS ? 0.08 * recoveryLerp : -0.14 * recoveryLerp;
      } else {
        // 'slash': Sweep horizontally across the South/North facing arc with apex perspective compression
        swingRot = swingParity * 0.78 * recoveryLerp;
        thrustOffset = 3.2 * recoveryLerp;
        if (isNS) {
          lateralSweepX = -swingParity * 3.8 * recoveryLerp;
          dynamicScaleXMult = 1 - 0.14 * recoveryLerp;
        }
      }
    }

    const baseRx = isEast
      ? cx + 2.5
      : isWest
        ? cx - 2.5
        : cx + 4.2;

    const baseRy = isEast
      ? cy - 6.5
      : isWest
        ? cy - 7.5
        : isNorth
          ? cy - 8.2
          : cy - 6.2;

    const thrustDx =
      (isEast ? thrustOffset : isWest ? -thrustOffset : 0) + lateralSweepX;
    const thrustDy = isSouth ? thrustOffset : isNorth ? -thrustOffset : 0;

    const rx = baseRx + thrustDx;
    const ry = baseRy + thrustDy + slamDropY;

    const mainIntrinsic =
      mainIsMelee ? -0.785 : isRanged && !isBow ? -0.38 : 0;
    const mainProj = finalizeHardpointProjection25D(
      {
        ...mainBaseProj,
        rotationRad: mainBaseProj.rotationRad + swingRot,
        foreshortenScaleX: mainBaseProj.foreshortenScaleX * dynamicScaleXMult,
        foreshortenScaleY: mainBaseProj.foreshortenScaleY * dynamicScaleYMult,
      },
      mainIntrinsic
    );

    drawSinglePlayerEquipmentMount(
      g,
      state,
      mainId,
      'main',
      rx,
      ry,
      mainProj,
      cardinalDir
    );

    drawEquipmentAttachmentOverlay(g, state, 'main', rx, ry, cardinalDir, {
      isShield: mainArch.isShield,
      isBow,
      isTwoHanded: (mainGrip === '2h' && !sideId) || mainDef?.handing === '2-hand',
      bowChargePct,
      aimCos: mainProj.aimCos,
      aimSin: mainProj.aimSin,
      trailColor: mainDef?.bladeTrailColor,
    });

    // Subtle 2px windup glint at the projected weapon head/tip on final windup frames
    if (isWindingUp && windupPct > 0.55) {
      const tipGlintX = Math.round(rx + mainProj.aimCos * 5.0);
      const tipGlintY = Math.round(ry + mainProj.aimSin * 5.0);
      g.save();
      g.fillStyle = '#fde047';
      g.fillRect(tipGlintX - 1, tipGlintY - 1, 2, 2);
      g.restore();
    }
  }
}

/**
 * Helper to draw a single resolved `16x16` chassis part layer (`plating`, `arms`, or `head`) with its `1px` post-outline.
 */
function drawSingleMechLayerSlice(
  g: CanvasRenderingContext2D,
  slice: ResolvedLayerSlice,
  cx: number,
  cy: number
): void {
  const outlinedPart = slice.needsPostOutline
    ? getOutlinedSpriteCanvas(
        slice.sourceKey,
        slice.drawable,
        slice.srcX,
        slice.srcY,
        slice.srcW,
        slice.srcH,
        COMPONENT_OUTLINE_COLOR
      )
    : null;

  if (outlinedPart) {
    if (slice.flipX) {
      g.save();
      g.translate(cx, cy);
      g.scale(-1, 1);
      g.drawImage(
        outlinedPart,
        0,
        0,
        outlinedPart.width,
        outlinedPart.height,
        -9,
        -17,
        18,
        18
      );
      g.restore();
    } else {
      g.drawImage(
        outlinedPart,
        0,
        0,
        outlinedPart.width,
        outlinedPart.height,
        cx - 9,
        cy - 17,
        18,
        18
      );
    }
  } else if (slice.flipX) {
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

/**
 * Renders the modular player Mech sprite composed of 3 aligned `16x16` px armor layers
 * (`plating`, `arms`, `head`) interleaved with 3 anatomical weapon passes
 * (`behindBody` -> `plating` -> `betweenPlatingAndArms` -> `arms & head` -> `inFrontOfBody` + gauntlet grip clasps).
 * Locked to 4 canonical sprite facings ('N' | 'S' | 'E' | 'W') with locked-in weapon coordinates.
 * Does not mutate `state: OrionState`.
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
  const rawDir = options?.dir || state.dir || 'S';
  const cardinalDir = toCardinalFacing(rawDir);
  const isCriticalBlink =
    state.frame?.state === 'Critical' && Math.floor(timeSec * 8) % 2 === 0;

  const isWindingUp =
    !options?.hideWeaponMounts &&
    state.activeSkillSlot !== null &&
    (state.skillTellTimer || 0) > 0;
  const isStriking =
    !options?.hideWeaponMounts &&
    state.activeSkillSlot !== null &&
    (state.skillTellTimer || 0) <= 0 &&
    (state.skillActionTimer || 0) > 0;

  const activeFrameCol: 0 | 1 | 2 | 3 =
    options?.overrideFrame !== undefined
      ? options.overrideFrame
      : state.isBoosterDashing || state.isContinuousBoosting
        ? 3
        : isWindingUp
          ? 1
          : isStriking
            ? 2
            : (state.glideFrame ?? 0);

  const platingSlice = resolvePartLayerSlice(
    'plating',
    framePlatingDef,
    cardinalDir,
    activeFrameCol,
    isCriticalBlink
  );
  const armsSlice = resolvePartLayerSlice('arms', armsDef, cardinalDir, activeFrameCol, false);
  const headSlice = resolvePartLayerSlice('head', headDef, cardinalDir, activeFrameCol, false);

  const postureShiftY = isWindingUp ? 1 : 0;
  const cx = Math.round(x);
  const cy = Math.round(py) + postureShiftY;

  g.save();
  g.imageSmoothingEnabled = false;

  // Subtle magic-current ground resonance ring when gliding, winding up, or boosting
  const phase = state.glidePhase || 'idle';
  if (activeFrameCol > 0 || phase !== 'idle') {
    const auraAlpha =
      activeFrameCol === 3 ? 0.42 : activeFrameCol === 2 ? 0.28 : 0.18;
    const auraRadiusX = activeFrameCol === 3 ? 6.5 : 5.2;
    g.save();
    g.fillStyle =
      framePlatingDef.spriteTheme?.reactorGlowColor || '#38bdf8';
    g.globalAlpha = auraAlpha;
    g.beginPath();
    g.ellipse(cx, cy - 1, auraRadiusX, 2.2, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // Pass 1: Behind-body weapon mounts (Aux [Back] when facing South/East/West, or forward hands when facing North)
  if (!options?.hideWeaponMounts) {
    drawPlayerWeaponMounts25D(g, state, cx, cy, cardinalDir, timeSec, 'behindBody', options);
  }

  // Pass 2: Torso & Legs Frame Plating Layer
  drawSingleMechLayerSlice(g, platingSlice, cx, cy);

  // Pass 3: Between-Plating-And-Arms weapon mounts (far-side profile hand in East/West facings + Aux shoulder sling latch)
  if (!options?.hideWeaponMounts) {
    drawPlayerWeaponMounts25D(
      g,
      state,
      cx,
      cy,
      cardinalDir,
      timeSec,
      'betweenPlatingAndArms',
      options
    );
  }

  // Pass 4: Shoulders/Arms & Head/Optics Layers
  drawSingleMechLayerSlice(g, armsSlice, cx, cy);
  drawSingleMechLayerSlice(g, headSlice, cx, cy);

  // Pass 5: Front-of-body weapon mounts + Gauntlet Knuckle Grip Clasps (sword handles tucked behind front hand)
  if (!options?.hideWeaponMounts) {
    drawPlayerWeaponMounts25D(g, state, cx, cy, cardinalDir, timeSec, 'inFrontOfBody', options);
  }

  // Pass 6: Fighting-Game / Souls Silhouette Flash-Frame Overlay
  if (!options?.hideWeaponMounts && (state.flashTimer || 0) > 0) {
    const flashColor = state.flashColor || '#ffffff';
    const flashKind = state.flashKind || 'hit';
    const flashMax = Math.max(0.05, state.flashMaxTimer || 0.12);
    const flashRatio = Math.max(0, Math.min(1, (state.flashTimer || 0) / flashMax));
    const isStrobeWhite =
      (flashKind === 'sweet' || flashKind === 'parry' || flashKind === 'stagger') &&
      flashRatio > 0.55;

    g.save();
    g.globalAlpha = Math.min(0.85, 0.35 + flashRatio * 0.5);
    g.strokeStyle = isStrobeWhite ? '#ffffff' : flashColor;
    g.lineWidth = 1.2;
    g.strokeRect(cx - 6, cy - 15, 12, 14);
    if (flashKind === 'parry' || flashKind === 'sweet') {
      g.fillStyle = '#ffffff';
      g.fillRect(cx - 7, cy - 9, 14, 2);
      g.fillRect(cx - 1, cy - 15, 2, 14);
    } else if (flashKind === 'ready' || flashKind === 'shield') {
      g.fillStyle = flashColor;
      g.globalAlpha = flashRatio * 0.45;
      g.fillRect(cx - 5, cy - 14, 10, 12);
    }
    g.restore();
  }

  g.restore();
}
