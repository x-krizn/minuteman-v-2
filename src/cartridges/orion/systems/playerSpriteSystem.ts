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
import { OrionDir, OrionGlidePhase, OrionState, TraitLine } from '../types';

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
 * - 64x64 standalone 4-direction part sheet (4 directional rows x 4 glide frames)
 * - 64x16 standalone 1-row 4-frame strip
 * - Procedural fallback 64x16 strip for standalone parts without a Base64 PNG
 */
function resolvePartLayerSlice(
  slot: 'plating' | 'arms' | 'head',
  def: CanonicalHardwareItemDefinition | FramePlatingDefinition,
  dir: OrionDir,
  frameCol: number,
  isCriticalBlink: boolean
): ResolvedLayerSlice {
  const partSprite = def.partSprite;
  const cellW = partSprite?.cellWidth || 16;
  const cellH = partSprite?.cellHeight || 16;
  const frameCount = partSprite?.frameCount || 4;
  const frameIdx = Math.max(0, Math.min(frameCount - 1, frameCol % frameCount));

  const isWest = dir === 'W' || dir === 'NW' || dir === 'SW';
  const isNorth = dir === 'N';

  if (partSprite?.base64) {
    const img = getDecodedPartStripImage(partSprite.base64);
    if (img && img.complete && img.naturalWidth > 0) {
      const dirRows =
        partSprite.directionalRows ?? (img.naturalHeight >= cellH * 4 ? 4 : 1);

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
          srcX: frameIdx * cellW,
          srcY: dirRow * cellH,
          srcW: cellW,
          srcH: cellH,
          flipX: false,
        };
      }

      return {
        drawable: img,
        srcX: frameIdx * cellW,
        srcY: 0,
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
    srcX: (frameIdx % 4) * 16,
    srcY: 0,
    srcW: 16,
    srcH: 16,
    flipX: isWest,
  };
}

export interface DrawCompositePlayerOptions {
  dir?: OrionDir;
  /** Explicit 0-based frame column override (0 = Frame 1 Idle, 1 = Frame 2, 2 = Frame 3 Glide, 3 = Frame 4 Boost) */
  overrideFrame?: 0 | 1 | 2 | 3;
  isAttacking?: boolean;
}

/**
 * Renders the modular player Mech sprite composed of 3 aligned 16x16 px layers:
 * 1. Frame Plating (Torso & Legs — `state.equipmentSlots.plating`)
 * 2. Arms (Shoulders & Arms — `state.equipmentSlots.arms`)
 * 3. Head (Command Helm & Optics — `state.equipmentSlots.head`)
 *
 * Uses the active Magic-Current Glide state machine frame (`state.glideFrame`, or `options.overrideFrame`).
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
    dir,
    activeFrameCol,
    isCriticalBlink
  );
  const armsSlice = resolvePartLayerSlice('arms', armsDef, dir, activeFrameCol, false);
  const headSlice = resolvePartLayerSlice('head', headDef, dir, activeFrameCol, false);

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
