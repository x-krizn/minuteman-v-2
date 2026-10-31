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
import { getWeaponDefinition } from '../database/equipment/weapons';
import { getItemDefinition } from '../database/items';
import {
  getEffectiveMainGrip,
  getWeaponGemVisuals,
} from '../database/progression';
import { OrionDir, OrionGlidePhase, OrionState, TraitLine } from '../types';
import {
  getBase64Image,
  getOutlinedSpriteCanvas,
} from './render/spriteAtlasCache';

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
  const { framePlatingDef } = resolvePlayerSpriteParts(state);
  const loadCap =
    state.gates?.effectiveLoadCapacity || framePlatingDef.baseLoadCapacity || 'medium';

  const activeWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons?.[state.activeWeaponIndex || 0] ||
    'gladius_boltcaster';
  const weaponDef = getWeaponDefinition(activeWeaponId);
  const weaponWeight =
    state.gates?.activeWeaponWeight || weaponDef?.weightClass || 'medium';

  const frameScore =
    loadCap === 'superheavy' ? 2.4 : loadCap === 'heavy' ? 1.6 : loadCap === 'medium' ? 0.8 : 0;
  const weaponScore =
    weaponWeight === 'heavy' ? 1.2 : weaponWeight === 'medium' ? 0.5 : 0;
  const overloadBonus =
    (state.gates?.loadPenalty?.mobilityMult ?? 1) < 1 ? 1.0 : 0;

  const rawTier = Math.round(frameScore + weaponScore + overloadBonus);
  const weightTier = Math.max(0, Math.min(4, rawTier)) as 0 | 1 | 2 | 3 | 4;

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
  const isBolter = equipmentRole === 'ranged' && itemId !== 'great_bow';
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
  return { gripCellX: 8.0, gripCellY: 8.0, scale: handScale };
}

/**
 * Renders a single equipped weapon or auxiliary item at `(mx, my)` for the `'main'` (Right Hand),
 * `'side'` (Left Hand), or `'aux'` (Back Stowed) mount with a 1px post-processed silhouette outline.
 * Does not mutate `state: OrionState`.
 */
function drawSinglePlayerEquipmentMount(
  g: CanvasRenderingContext2D,
  state: OrionState,
  itemId: string,
  mountRole: 'main' | 'side' | 'aux',
  mx: number,
  my: number,
  scaleX: number,
  rotationRad: number,
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
      const row = spriteCfg.row ?? 0;
      const srcX = col * cellW;
      const srcY = row * cellH;

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
        if (scaleX !== 1) {
          g.scale(scaleX, 1);
        }
        if (rotationRad !== 0) {
          g.rotate(rotationRad);
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
  if (scaleX !== 1) {
    g.scale(scaleX, 1);
  }
  if (rotationRad !== 0) {
    g.rotate(rotationRad);
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
 * Renders the pilot's three weapon hardpoints (`Main Hand [Right]`, `Side Hand [Left]`, and `Aux [Back]`)
 * locked into the 4 canonical sprite facings ('N' | 'S' | 'E' | 'W') with locked-in relative coordinates.
 * Excludes consumables (flasks, potions) and aligns depth sorting with the character chassis.
 * Does not mutate `state: OrionState`.
 */
export function drawPlayerWeaponMounts25D(
  g: CanvasRenderingContext2D,
  state: OrionState,
  cx: number,
  cy: number,
  dir: OrionDir | 'N' | 'S' | 'E' | 'W',
  timeSec: number,
  pass: 'behindBody' | 'inFrontOfBody',
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

  // 1. AUX (BACK — slot3):
  //    - Facing North ('N'): back faces camera directly -> drawn inFrontOfBody centered on dorsal plate
  //    - Facing South ('S'), East ('E'), West ('W'): back is behind body -> drawn behindBody
  const auxPass: 'behindBody' | 'inFrontOfBody' = isNorth ? 'inFrontOfBody' : 'behindBody';
  if (auxId && auxPass === pass) {
    const auxDef = getWeaponDefinition(auxId);
    const auxIsBolter = auxDef?.equipmentRole === 'ranged' && auxId !== 'great_bow';

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
        : cy - 10.0;

    const auxScaleX = isWest ? -1 : 1;
    const auxRotRad = auxIsBolter
      ? isNorth
        ? -0.45
        : isEast || isWest
          ? -1.05
          : -0.85
      : 0;

    drawSinglePlayerEquipmentMount(
      g,
      state,
      auxId,
      'aux',
      bx,
      by,
      auxScaleX,
      auxRotRad,
      cardinalDir
    );
  }

  // 2. SIDE HAND (LEFT — slot2):
  //    - Facing South ('S'): screen-left near hand cuff -> inFrontOfBody
  //    - Facing North ('N'): screen-left far hand cuff (reaching forward) -> behindBody
  //    - Facing East ('E'): far background arm -> behindBody
  //    - Facing West ('W'): near foreground arm -> inFrontOfBody
  const sidePass: 'behindBody' | 'inFrontOfBody' =
    isNorth || isEast ? 'behindBody' : 'inFrontOfBody';
  if (sideId && sidePass === pass) {
    const sideDef = getWeaponDefinition(sideId);
    const sideIsMelee = sideDef?.equipmentRole === 'melee';
    const sideIsBolter = sideDef?.equipmentRole === 'ranged' && sideId !== 'great_bow';

    const lx = isEast
      ? cx + 2.5
      : isWest
        ? cx - 2.5
        : cx - 4.5;

    const ly = isEast
      ? cy - 7.5
      : isWest
        ? cy - 6.5
        : isNorth
          ? cy - 7.5
          : cy - 6.5;

    const sideScaleX = isEast ? 1 : -1;
    const sideRotRad = isEast
      ? sideIsMelee
        ? 0.40
        : sideIsBolter
          ? -0.10
          : 0
      : isWest
        ? sideIsMelee
          ? 0.12
          : 0
        : isNorth
          ? sideIsMelee
            ? -0.15
            : sideIsBolter
              ? 0.50
              : 0
          : sideIsMelee
            ? 0.15
            : sideIsBolter
              ? -0.22
              : 0;

    drawSinglePlayerEquipmentMount(
      g,
      state,
      sideId,
      'side',
      lx,
      ly,
      sideScaleX,
      sideRotRad,
      cardinalDir
    );
  }

  // 3. MAIN HAND (RIGHT — slot1):
  //    - Facing South ('S'): screen-right near hand cuff -> inFrontOfBody
  //    - Facing North ('N'): screen-right far hand cuff (reaching forward) -> behindBody
  //    - Facing East ('E'): near foreground arm -> inFrontOfBody
  //    - Facing West ('W'): far background arm -> behindBody
  const mainPass: 'behindBody' | 'inFrontOfBody' =
    isNorth || isWest ? 'behindBody' : 'inFrontOfBody';
  if (mainId && mainPass === pass) {
    const isAttacking = Boolean(
      options?.isAttacking ?? (state.activeSkillSlot !== null && state.skillActionTimer > 0)
    );
    const mainDef = getWeaponDefinition(mainId);
    const mainIsMelee = mainDef?.equipmentRole === 'melee';
    const mainIsBolter = mainDef?.equipmentRole === 'ranged' && mainId !== 'great_bow';
    const isSpearOrLance = mainId === 'short_spear' || mainId === 'avalon_siege_lance';
    const isMace = mainId === 'mace';
    const isShield = mainDef?.equipmentRole === 'shield';
    const isRanged = mainDef?.equipmentRole === 'ranged' || mainDef?.equipmentRole === 'quiver';

    const thrustOffset = isAttacking
      ? isSpearOrLance
        ? 4.5
        : isShield
          ? 3.5
          : isRanged
            ? -1.5
            : 2.5
      : 0;
    const swingRot = isAttacking
      ? isSpearOrLance || isShield || isRanged
        ? 0
        : isMace
          ? 0.65
          : (state.ammo % 2 === 0 ? 1 : -1) * 0.55
      : 0;
    const slamDropY = isAttacking && isMace ? 2.5 : 0;

    const baseRx = isEast
      ? cx + 2.5
      : isWest
        ? cx - 2.5
        : cx + 4.5;

    const baseRy = isEast
      ? cy - 6.5
      : isWest
        ? cy - 7.5
        : isNorth
          ? cy - 7.5
          : cy - 6.5;

    // Locked-in cardinal thrust along the 4 cardinal axes only (no diagonal offset)
    const thrustDx = isEast ? thrustOffset : isWest ? -thrustOffset : 0;
    const thrustDy = isSouth ? thrustOffset : isNorth ? -thrustOffset : 0;

    const rx = baseRx + thrustDx;
    const ry = baseRy + thrustDy + slamDropY;

    const mainScaleX = isWest ? -1 : 1;
    const baseMainRot =
      isEast || isWest
        ? mainIsMelee
          ? 0.12
          : 0
        : isNorth
          ? mainIsMelee
            ? -0.15
            : mainIsBolter
              ? -0.50
              : 0
          : mainIsMelee
            ? 0.15
            : mainIsBolter
              ? 0.22
              : 0;

    drawSinglePlayerEquipmentMount(
      g,
      state,
      mainId,
      'main',
      rx,
      ry,
      mainScaleX,
      baseMainRot + swingRot,
      cardinalDir
    );
  }
}

/**
 * Renders the modular player Mech sprite composed of 3 aligned `16x16` px armor layers
 * (`plating`, `arms`, `head`) plus depth-sorted `Main Hand (Right)`, `Side Hand (Left)`,
 * and `Aux (Back)` weapon mounts, with 1px post-processed outlines around each component.
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

  const activeFrameCol: 0 | 1 | 2 | 3 =
    options?.overrideFrame !== undefined
      ? options.overrideFrame
      : state.isBoosterDashing || state.isContinuousBoosting
        ? 3
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

  const cx = Math.round(x);
  const cy = Math.round(py);

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

  // Pass 1: Behind-body weapon mounts (Aux [Back] when facing South/East/West, or forward hands when facing North/East/West)
  if (!options?.hideWeaponMounts) {
    drawPlayerWeaponMounts25D(g, state, cx, cy, cardinalDir, timeSec, 'behindBody', options);
  }

  // Pass 2: 3-Layer Composite Mech Chassis (Frame Plating -> Arms -> Head), each with a 1px post-processed outline
  for (const slice of [platingSlice, armsSlice, headSlice]) {
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

  // Pass 3: Front-of-body weapon mounts (e.g., Main [Right] & Side [Left] when facing South, or Aux [Back] when facing North)
  if (!options?.hideWeaponMounts) {
    drawPlayerWeaponMounts25D(g, state, cx, cy, cardinalDir, timeSec, 'inFrontOfBody', options);
  }

  g.restore();
}
