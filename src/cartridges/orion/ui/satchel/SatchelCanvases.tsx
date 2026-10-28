/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  computePlayerWeightRecoveryProfile,
  drawCompositePlayerMech,
  subscribeToMechSpriteLoad,
} from '../../systems';
import { OrionDir, OrionGlidePhase, OrionState, TraitLine } from '../../types';

export const ALL_TRAIT_LINES: TraitLine[] = [
  'Warrior',
  'Marauder',
  'Guardian',
  'Rogue',
  'Wizard',
  'Cleric',
];

export type EditableLoadoutSlot =
  | 'slot1'
  | 'slot2'
  | 'slot3'
  | 'head'
  | 'sensoryA'
  | 'sensoryB'
  | 'arms'
  | 'legs'
  | 'plating'
  | 'reactor'
  | 'aux3'
  | 'aux4'
  | 'utility'
  | 'mod_ranged'
  | 'mod_melee'
  | 'mod_mobility'
  | 'bind_l'
  | 'bind_r';

export type EquipmentInventoryCategory =
  | 'all'
  | 'weapon'
  | 'auxiliary'
  | 'hardware'
  | 'utility'
  | 'mod'
  | 'consumable';

export const SpriteCanvasIcon: React.FC<{
  base64?: string;
  col?: number;
  row?: number;
  cellWidth?: number;
  cellHeight?: number;
  sizeClass?: string;
}> = ({ base64, col = 0, row = 0, cellWidth = 16, cellHeight = 16, sizeClass = 'w-4 h-4' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !base64) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 16, 16);
    const dataUri = base64.startsWith('data:image/')
      ? base64
      : `data:image/png;base64,${base64}`;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        col * cellWidth,
        row * cellHeight,
        cellWidth,
        cellHeight,
        0,
        0,
        16,
        16
      );
    };
    img.src = dataUri;
  }, [base64, col, row, cellWidth, cellHeight]);

  if (!base64) return null;
  return (
    <canvas
      ref={canvasRef}
      width={16}
      height={16}
      className={`${sizeClass} shrink-0 [image-rendering:pixelated]`}
    />
  );
};

interface ShowcaseKeyframe {
  phase: OrionGlidePhase;
  frame: 0 | 1 | 2 | 3;
  durationSec: number;
}

function buildGlideShowcaseTimeline(
  recoveryFrames: Array<0 | 1 | 2 | 3>,
  winddownStepSec: number
): ShowcaseKeyframe[] {
  return [
    // 1. Grounded Idle (Frame 1 / Col 0)
    { phase: 'idle', frame: 0, durationSec: 0.55 },
    // 2. Magic-Current Glide Windup (Frames 2 -> 3 -> 4 / Cols 1 -> 2 -> 3)
    { phase: 'windup', frame: 1, durationSec: 0.11 },
    { phase: 'windup', frame: 2, durationSec: 0.11 },
    { phase: 'windup', frame: 3, durationSec: 0.11 },
    // 3. Sustained Glide: return to Frame 3 (Col 2) with off-count shifts to Frame 2 (Col 1)
    { phase: 'glide', frame: 2, durationSec: 0.18 },
    { phase: 'glide', frame: 2, durationSec: 0.15 },
    { phase: 'glide', frame: 1, durationSec: 0.11 },
    { phase: 'glide', frame: 2, durationSec: 0.20 },
    { phase: 'glide', frame: 1, durationSec: 0.10 },
    { phase: 'glide', frame: 2, durationSec: 0.18 },
    // 4. Boost Surge (Frame 4 / Col 3) -> Return to Frame 3 (Col 2)
    { phase: 'boost', frame: 3, durationSec: 0.28 },
    { phase: 'glide', frame: 2, durationSec: 0.18 },
    // 5. Weight-Scaled Wind-Down Recovery (Frames 3 -> 2 -> 1)
    ...recoveryFrames.map((col) => ({
      phase: 'winddown' as OrionGlidePhase,
      frame: col,
      durationSec: winddownStepSec * 1.15,
    })),
  ];
}

const PREVIEW_DIRS: OrionDir[] = ['S', 'E', 'N', 'W'];

export const CompositeMechPreviewCanvas: React.FC<{
  state: OrionState;
  head?: string;
  arms?: string;
  plating?: string;
  weaponId?: string;
}> = ({ state, head, arms, plating, weaponId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewDirIdx, setPreviewDirIdx] = useState<number>(0);
  const [pausedFrame, setPausedFrame] = useState<0 | 1 | 2 | 3 | null>(null);

  useEffect(() => {
    let rafId = 0;
    const previewState: OrionState =
      state.equipmentSlots && (head || arms || plating || weaponId)
        ? {
            ...state,
            equipmentSlots: {
              ...state.equipmentSlots,
              ...(head ? { head } : {}),
              ...(arms ? { arms } : {}),
              ...(plating ? { plating } : {}),
              ...(weaponId ? { slot1: weaponId } : {}),
            },
          }
        : state;

    const weightProfile = computePlayerWeightRecoveryProfile(previewState);
    const timeline = buildGlideShowcaseTimeline(
      weightProfile.recoveryFrames,
      weightProfile.winddownStepSec
    );
    const totalCycleSec = timeline.reduce((acc, k) => acc + k.durationSec, 0);
    const activeDir = PREVIEW_DIRS[previewDirIdx % PREVIEW_DIRS.length] || state.dir || 'S';

    const resolveShowcaseStep = (tSec: number): ShowcaseKeyframe => {
      if (pausedFrame !== null) {
        const pausedPhase: OrionGlidePhase =
          pausedFrame === 0
            ? 'idle'
            : pausedFrame === 1
              ? 'windup'
              : pausedFrame === 2
                ? 'glide'
                : 'boost';
        return { phase: pausedPhase, frame: pausedFrame, durationSec: 1 };
      }
      let cursor = tSec % totalCycleSec;
      for (const kf of timeline) {
        if (cursor < kf.durationSec) return kf;
        cursor -= kf.durationSec;
      }
      return timeline[0];
    };

    const renderPreview = (nowMs?: number) => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;
      const tSec =
        typeof nowMs === 'number'
          ? nowMs / 1000
          : typeof performance !== 'undefined'
            ? performance.now() / 1000
            : state.t || 0;

      const step = resolveShowcaseStep(tSec);

      ctx.clearRect(0, 0, 32, 32);
      ctx.imageSmoothingEnabled = false;
      drawCompositePlayerMech(ctx, previewState, 16, 26, tSec, {
        dir: activeDir,
        overrideFrame: step.frame,
      });

      // Compact bottom HUD bar showing current showcase phase (IDLE / WINDUP / GLIDE / BOOST / RECOV) & Frame (F1..F4)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
      ctx.fillRect(0, 27, 32, 5);
      ctx.fillStyle =
        step.phase === 'boost'
          ? '#fb923c'
          : step.phase === 'glide'
            ? '#38bdf8'
            : step.phase === 'windup'
              ? '#fde047'
              : step.phase === 'winddown'
                ? '#c084fc'
                : '#94a3b8';
      // 4-frame indicator pips across bottom
      for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = i === step.frame ? 1 : 0.25;
        ctx.fillRect(4 + i * 6, 29, 4, 2);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (nowMs: number) => {
      renderPreview(nowMs);
      if (pausedFrame === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    renderPreview();
    if (pausedFrame === null) {
      rafId = window.requestAnimationFrame(tick);
    }
    const unsubscribe = subscribeToMechSpriteLoad(() => renderPreview());

    return () => {
      window.cancelAnimationFrame(rafId);
      unsubscribe();
    };
  }, [state, head, arms, plating, weaponId, state.traitLine, previewDirIdx, pausedFrame]);

  const activeDir = PREVIEW_DIRS[previewDirIdx % PREVIEW_DIRS.length] || 'S';

  return (
    <button
      type="button"
      onClick={(e) => {
        if (e.shiftKey) {
          setPausedFrame((prev) =>
            prev === null ? 0 : prev === 3 ? null : ((prev + 1) as 0 | 1 | 2 | 3)
          );
        } else {
          setPreviewDirIdx((prev) => (prev + 1) % PREVIEW_DIRS.length);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setPausedFrame((prev) =>
          prev === null ? 0 : prev === 3 ? null : ((prev + 1) as 0 | 1 | 2 | 3)
        );
      }}
      title={`Magic-Current Glide Preview (Facing ${activeDir}${pausedFrame !== null ? ` · Paused F${pausedFrame + 1}` : ''} — Click: Rotate S/E/N/W · Right-Click or Shift+Click: Step/Resume Frames F1–F4)`}
      className="relative w-10 h-10 shrink-0 bg-[#020617] border border-[#38bdf8]/40 hover:border-[#38bdf8] rounded-xs cursor-pointer p-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        width={32}
        height={32}
        className="w-full h-full [image-rendering:pixelated]"
      />
      {pausedFrame !== null && (
        <span className="absolute top-0.5 left-0.5 text-[6px] leading-none font-bold text-[#fde047] bg-[#020617]/85 px-0.5 rounded-xs">
          F{pausedFrame + 1}
        </span>
      )}
      <span className="absolute top-0.5 right-0.5 text-[6px] leading-none font-bold text-[#7dd3fc] bg-[#020617]/80 px-0.5 rounded-xs">
        {activeDir}
      </span>
    </button>
  );
};

