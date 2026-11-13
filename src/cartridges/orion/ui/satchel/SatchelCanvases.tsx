/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { getWeaponDefinition } from '../../database/equipment/weapons';
import {
  findHardwareItemByNameOrId,
  GEMSTONE_REGISTRY,
  getEquipmentMaxModSlots,
  getWeaponComponentSlots,
  getWeaponGemVisuals,
  getWeaponSubtypeInfo,
  parseEquipmentInstanceId,
} from '../../database/progression';
import {
  computePlayerWeightRecoveryProfile,
  drawCompositePlayerMech,
  resolveSpriteStripSliceCoords,
  subscribeToMechSpriteLoad,
} from '../../systems';
import { GemId, OrionDir, OrionGlidePhase, OrionState, TraitLine } from '../../types';

/** Ordered list of all 6 Starting Loadout Kit trait identifiers (`v0.8`). */
export const ALL_TRAIT_LINES: TraitLine[] = [
  'Warrior',
  'Marauder',
  'Guardian',
  'Rogue',
  'Wizard',
  'Cleric',
];

/** Equipment and action-binding slot keys editable inside the Pilot Satchel (`[SELECT]`). */
export type EditableLoadoutSlot =
  | 'slot1'
  | 'slot2'
  | 'slot3'
  | 'head'
  | 'optics'
  | 'sensoryA'
  | 'sensoryB'
  | 'arms'
  | 'actuators'
  | 'legs'
  | 'plating'
  | 'reactor'
  | 'mod_ranged'
  | 'mod_melee'
  | 'mod_mobility'
  | 'bind_l'
  | 'bind_r';

/** Category filter tabs for the Pilot Satchel equipment & consumable inventory view. */
export type EquipmentInventoryCategory =
  | 'all'
  | 'weapon'
  | 'auxiliary'
  | 'hardware'
  | 'mod'
  | 'consumable';

/**
 * Renders a `16x16` pixel-art icon sliced from a Base64 sprite sheet at `(col, row)`.
 * Supports both HUD modes inside the React Pilot Satchel overlay.
 */
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
      const { srcX, srcY } = resolveSpriteStripSliceCoords(
        img.naturalWidth || img.width,
        img.naturalHeight || img.height,
        col,
        row,
        cellWidth,
        cellHeight
      );
      ctx.drawImage(
        img,
        srcX,
        srcY,
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

/**
 * High-resolution (`128x128` internal canvas) equipment schematic & artwork renderer.
 * Draws high-resolution vector technical schematics, upscaled sprite artwork, anatomical mod slot
 * callout markers, and socketed gemstone indicators for any weapon, auxiliary, or hardware piece.
 * Supports both HUD modes inside the Pilot Satchel (`LOADOUT` Mech Doll & `ARMORY` Workbench).
 */
export const HighResEquipmentArtCanvas: React.FC<{
  state: OrionState;
  itemIdOrName: string | null | undefined;
  slotHint?: EditableLoadoutSlot;
  sizeClass?: string;
  highlightedModSlotIndex?: number | null;
}> = ({
  state,
  itemIdOrName,
  slotHint,
  sizeClass = 'w-20 h-20',
  highlightedModSlotIndex = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const W = 128;
    const H = 128;
    ctx.clearRect(0, 0, W, H);

    // 1. High-resolution blueprint background & grid
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 8, W / 2, H / 2, 72);
    bgGrad.addColorStop(0, '#0c192c');
    bgGrad.addColorStop(1, '#040811');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.09)';
    ctx.lineWidth = 1;
    for (let x = 16; x < W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 16; y < H; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Corner framing ticks
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
    ctx.lineWidth = 1.5;
    const cLen = 10;
    for (const [cx, cy, dx, dy] of [
      [4, 4, 1, 1],
      [W - 4, 4, -1, 1],
      [4, H - 4, 1, -1],
      [W - 4, H - 4, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * cLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * cLen, cy);
      ctx.stroke();
    }

    if (!itemIdOrName) {
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(28, 28, 72, 72);
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EMPTY HARDPOINT', W / 2, H / 2 + 3);
      return;
    }

    const { baseId, slotGems, installedGems } = parseEquipmentInstanceId(itemIdOrName);
    const wDef = getWeaponDefinition(itemIdOrName);
    const hwDef = !wDef ? findHardwareItemByNameOrId(itemIdOrName) : undefined;
    const maxSlots = getEquipmentMaxModSlots(itemIdOrName);
    const primaryGem: GemId | null = installedGems[0] || null;
    const primaryGemColor = primaryGem ? GEMSTONE_REGISTRY[primaryGem]?.hexColor : null;

    // Helper to draw socketed gem nodes & component callouts
    const drawModSlotNodes = (slotLabels: string[]) => {
      const nodePositions: Array<[number, number]> =
        maxSlots === 1
          ? [[64, 108]]
          : maxSlots === 2
            ? [
                [42, 108],
                [86, 108],
              ]
            : [
                [28, 108],
                [64, 108],
                [100, 108],
              ];

      for (let i = 0; i < maxSlots; i++) {
        const [nx, ny] = nodePositions[i] || [64, 108];
        const gemId = slotGems[i] || null;
        const gemInfo = gemId ? GEMSTONE_REGISTRY[gemId] : null;
        const isHighlighted = highlightedModSlotIndex === i;

        // Callout line to schematic center
        ctx.strokeStyle = gemInfo
          ? `${gemInfo.hexColor}88`
          : isHighlighted
            ? '#fde047aa'
            : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = isHighlighted ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(nx, ny - 8);
        ctx.lineTo(44 + i * 20, 66);
        ctx.stroke();

        // Slot pill box
        ctx.fillStyle = gemInfo ? '#0f172a' : '#090d14';
        ctx.strokeStyle = isHighlighted
          ? '#fde047'
          : gemInfo
            ? gemInfo.hexColor
            : 'rgba(100, 116, 139, 0.5)';
        ctx.lineWidth = isHighlighted ? 1.75 : 1.2;
        ctx.beginPath();
        ctx.roundRect(nx - 15, ny - 8, 30, 14, 2);
        ctx.fill();
        ctx.stroke();

        // Gem diamond pip + slot label
        ctx.fillStyle = gemInfo ? gemInfo.hexColor : '#64748b';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        const shortSlot = (slotLabels[i] || `S${i + 1}`).slice(0, 4).toUpperCase();
        ctx.fillText(gemInfo ? `◆${shortSlot}` : `◇${shortSlot}`, nx, ny + 1.5);
      }
    };

    if (wDef) {
      const gemVis = getWeaponGemVisuals(state, itemIdOrName);
      const stInfo = getWeaponSubtypeInfo(baseId);
      const accentColor = primaryGemColor || gemVis.color || '#38bdf8';
      const compSlots = getWeaponComponentSlots(baseId);

      // Draw high-resolution vector weapon schematic silhouette in background
      ctx.save();
      ctx.translate(W / 2, 52);
      ctx.strokeStyle = accentColor;
      ctx.fillStyle = `${accentColor}26`;
      ctx.lineWidth = 2;

      const sub = stInfo.subtype.toLowerCase();
      if (sub.includes('shield')) {
        // High-res shield crest schematic
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(26, -18);
        ctx.lineTo(22, 14);
        ctx.lineTo(0, 32);
        ctx.lineTo(-22, 14);
        ctx.lineTo(-26, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, -2, 10, 0, Math.PI * 2);
        ctx.stroke();
      } else if (sub.includes('bow')) {
        // High-res compound great-bow arc
        ctx.beginPath();
        ctx.arc(-8, 0, 32, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 30);
        ctx.stroke();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(26, 0);
        ctx.stroke();
      } else if (sub.includes('polearm') || sub.includes('lance')) {
        // High-res lance / polearm schematic
        ctx.rotate(-Math.PI / 5);
        ctx.beginPath();
        ctx.moveTo(-38, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(14, -9);
        ctx.lineTo(38, 0);
        ctx.lineTo(14, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (sub.includes('axe') || sub.includes('blunt')) {
        // High-res great-axe / mace schematic
        ctx.rotate(-Math.PI / 5);
        ctx.beginPath();
        ctx.moveTo(-34, 0);
        ctx.lineTo(24, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(6, -18);
        ctx.quadraticCurveTo(28, -22, 26, 0);
        ctx.quadraticCurveTo(28, 22, 6, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (sub.includes('blade') || sub.includes('dagger')) {
        // High-res sword / khopesh schematic
        ctx.rotate(-Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(-34, 0);
        ctx.lineTo(-16, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-16, -11);
        ctx.lineTo(-16, 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-15, -5);
        ctx.lineTo(28, -3);
        ctx.lineTo(36, 0);
        ctx.lineTo(28, 3);
        ctx.lineTo(-15, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (sub.includes('quiver') || sub.includes('catalyst')) {
        // High-res auxiliary pod / catalyst core
        ctx.beginPath();
        ctx.roundRect(-20, -24, 40, 48, 6);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // High-res ranged rifle / bolter / cannon schematic
        ctx.beginPath();
        ctx.roundRect(-34, -8, 48, 14, 2);
        ctx.fill();
        ctx.stroke();
        // Barrel assembly
        ctx.beginPath();
        ctx.moveTo(14, -4);
        ctx.lineTo(38, -4);
        ctx.moveTo(14, 2);
        ctx.lineTo(38, 2);
        ctx.stroke();
        // Grip & magazine
        ctx.beginPath();
        ctx.moveTo(-18, 6);
        ctx.lineTo(-24, 20);
        ctx.moveTo(-2, 6);
        ctx.lineTo(2, 22);
        ctx.stroke();
        // Sight rail
        ctx.beginPath();
        ctx.rect(-14, -14, 20, 5);
        ctx.stroke();
      }
      ctx.restore();

      // Overlay crisp 4x sprite icon if present
      const strip = wDef.variantStripBase64 || wDef.hardpointSprite?.base64;
      if (strip) {
        const dataUri = strip.startsWith('data:image/')
          ? strip
          : `data:image/png;base64,${strip}`;
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 10;
          const defaultRow = !gemVis.gemId ? (wDef.hardpointSprite?.row ?? 0) : 0;
          const { srcX, srcY } = resolveSpriteStripSliceCoords(
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            gemVis.colIndex,
            defaultRow,
            16,
            16
          );
          ctx.drawImage(
            img,
            srcX,
            srcY,
            16,
            16,
            W / 2 - 28,
            52 - 28,
            56,
            56
          );
          ctx.restore();
        };
        img.src = dataUri;
      }

      // Top classification header inside schematic
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(stInfo.subtype.toUpperCase().slice(0, 22), 8, 13);

      drawModSlotNodes(compSlots);
      return;
    }

    if (hwDef) {
      const slot = hwDef.slot || slotHint || 'plating';
      const accentColor =
        primaryGemColor ||
        hwDef.spriteTheme?.reactorGlowColor ||
        hwDef.spriteTheme?.visorColor ||
        hwDef.spriteTheme?.trimColor ||
        (hwDef.reactorFamily === 'Ichor'
          ? '#fb7185'
          : hwDef.reactorFamily === 'Mana'
            ? '#38bdf8'
            : hwDef.reactorFamily === 'Ether'
              ? '#c084fc'
              : '#38bdf8');
      const baseColor =
        hwDef.spriteTheme?.baseArmorColor ||
        hwDef.spriteTheme?.helmColor ||
        hwDef.spriteTheme?.armColor ||
        hwDef.spriteTheme?.legColor ||
        '#334155';

      ctx.save();
      ctx.translate(W / 2, 54);
      ctx.fillStyle = `${baseColor}88`;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;

      if (slot === 'head') {
        // High-res Command Dome helmet schematic
        ctx.beginPath();
        ctx.moveTo(-24, 16);
        ctx.lineTo(-26, -6);
        ctx.quadraticCurveTo(-24, -28, 0, -30);
        ctx.quadraticCurveTo(24, -28, 26, -6);
        ctx.lineTo(24, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Visor slit
        ctx.fillStyle = accentColor;
        ctx.fillRect(-16, -6, 32, 7);
        // Crest fin
        ctx.beginPath();
        ctx.moveTo(0, -34);
        ctx.lineTo(-5, -18);
        ctx.lineTo(5, -18);
        ctx.closePath();
        ctx.fill();
      } else if (slot === 'plating') {
        // High-res Frame Plating cuirass + pauldrons + core aperture
        ctx.beginPath();
        ctx.moveTo(-32, -22);
        ctx.lineTo(32, -22);
        ctx.lineTo(26, 24);
        ctx.lineTo(0, 30);
        ctx.lineTo(-26, 24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Reactor chest core ring
        ctx.strokeStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, -2, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `${accentColor}aa`;
        ctx.beginPath();
        ctx.arc(0, -2, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (slot === 'arms') {
        // High-res Twin Aperture Gauntlets & Spaulders
        for (const dir of [-1, 1]) {
          ctx.beginPath();
          ctx.roundRect(dir * 18 - 11, -24, 22, 46, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = accentColor;
          ctx.fillRect(dir * 18 - 7, -4, 14, 5);
          ctx.fillStyle = `${baseColor}88`;
        }
      } else if (slot === 'legs') {
        // High-res Strider Greaves & Hydraulic Pistons
        for (const dir of [-1, 1]) {
          ctx.beginPath();
          ctx.roundRect(dir * 15 - 9, -24, 18, 48, 3);
          ctx.fill();
          ctx.stroke();
          // Knee thruster vent
          ctx.fillStyle = accentColor;
          ctx.fillRect(dir * 15 - 6, -6, 12, 4);
          ctx.fillStyle = `${baseColor}88`;
        }
      } else if (slot === 'reactor') {
        // High-res Reactor Core containment torus
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
      } else if (slot === 'actuators') {
        // High-res Servo & Gyro Actuator schematic
        ctx.beginPath();
        ctx.arc(-12, -6, 14, 0, Math.PI * 2);
        ctx.arc(12, 8, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(-12, -6);
        ctx.lineTo(12, 8);
        ctx.stroke();
      } else {
        // Optics & Sensory Array multi-lens scanner schematic
        ctx.beginPath();
        ctx.roundRect(-28, -18, 56, 36, 8);
        ctx.fill();
        ctx.stroke();
        for (const lx of [-14, 0, 14]) {
          ctx.fillStyle = accentColor;
          ctx.beginPath();
          ctx.arc(lx, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(hwDef.canonicalSlotLabel.toUpperCase().slice(0, 22), 8, 13);

      const gemSlotLabels = Array.from({ length: maxSlots }, (_, i) => `G${i + 1}`);
      drawModSlotNodes(gemSlotLabels);
    }
  }, [state, itemIdOrName, slotHint, highlightedModSlotIndex]);

  return (
    <div
      className={`relative ${sizeClass} shrink-0 bg-[#040811] border border-[#38bdf8]/40 rounded-xs overflow-hidden shadow-inner`}
    >
      <canvas ref={canvasRef} width={128} height={128} className="w-full h-full block" />
    </div>
  );
};

/**
 * Interactive high-resolution central Mech Doll canvas (`160x180` internal resolution)
 * for the `LOADOUT` screen. Renders the composite mech at high magnification with anatomical
 * hardpoint callout rings (`Head`, `Torso`, `Arms`, `Legs`, `Main Hand`, `Side Hand`, `Aux`)
 * and directional/frame inspection controls.
 */
export const HighResMechDollCanvas: React.FC<{
  state: OrionState;
  selectedSlot: EditableLoadoutSlot | null;
  hoveredSlot: EditableLoadoutSlot | null;
  onSelectSlot?: (slot: EditableLoadoutSlot) => void;
}> = ({ state, selectedSlot, hoveredSlot }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewDirIdx, setPreviewDirIdx] = useState<number>(0);
  const [pausedFrame, setPausedFrame] = useState<0 | 1 | 2 | 3 | null>(0);

  useEffect(() => {
    let rafId = 0;
    let cancelled = false;
    const weightProfile = computePlayerWeightRecoveryProfile(state);
    const timeline = buildGlideShowcaseTimeline(
      weightProfile.recoveryFrames,
      weightProfile.winddownStepSec
    );
    const totalCycleSec = timeline.reduce((acc, k) => acc + k.durationSec, 0);
    const activeDir = PREVIEW_DIRS[previewDirIdx % PREVIEW_DIRS.length] || 'S';

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

    const renderDoll = (nowMs?: number) => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;
      const W = 160;
      const H = 180;
      const tSec =
        typeof nowMs === 'number'
          ? nowMs / 1000
          : typeof performance !== 'undefined'
            ? performance.now() / 1000
            : state.t || 0;

      ctx.clearRect(0, 0, W, H);

      // 1. Hangar gantry background & radial schematic grid
      const bgGrad = ctx.createRadialGradient(W / 2, H / 2 - 6, 10, W / 2, H / 2, 95);
      bgGrad.addColorStop(0, '#0f233f');
      bgGrad.addColorStop(0.65, '#071120');
      bgGrad.addColorStop(1, '#030710');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 20; x < W; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 20; y < H; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Pedestal platform rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(W / 2, 138, 52, 16, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(W / 2, 138, 36, 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Render 32x32 mech onto offscreen canvas and scale 3.5x (112x112) crisp pixelated
      const step = resolveShowcaseStep(tSec);
      const off = document.createElement('canvas');
      off.width = 32;
      off.height = 32;
      const offCtx = off.getContext('2d');
      if (offCtx) {
        offCtx.imageSmoothingEnabled = false;
        drawCompositePlayerMech(offCtx, state, 16, 26, tSec, {
          dir: activeDir,
          overrideFrame: step.frame,
        });
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, 32, 32, W / 2 - 56, 28, 112, 112);
        ctx.restore();
      }

      // 3. Highlight active/hovered anatomical zone on the Mech Doll
      const focusSlot = hoveredSlot || selectedSlot;
      if (focusSlot) {
        const zoneCoords: Record<string, { x: number; y: number; r: number; color: string; label: string }> = {
          head: { x: W / 2, y: 58, r: 18, color: '#38bdf8', label: 'DOME / HEAD' },
          optics: { x: W / 2, y: 58, r: 16, color: '#38bdf8', label: 'HEAD OPTICS' },
          sensoryA: { x: W / 2, y: 58, r: 16, color: '#38bdf8', label: 'SENSORY A' },
          sensoryB: { x: W / 2, y: 58, r: 16, color: '#38bdf8', label: 'SENSORY B' },
          plating: { x: W / 2, y: 86, r: 22, color: '#a855f7', label: 'FRAME PLATING' },
          reactor: { x: W / 2, y: 86, r: 16, color: '#c084fc', label: 'REACTOR CORE' },
          arms: { x: W / 2 - 22, y: 84, r: 18, color: '#fb923c', label: 'ARMS / APERTURE' },
          actuators: { x: W / 2 - 22, y: 84, r: 16, color: '#fb923c', label: 'ACTUATORS' },
          legs: { x: W / 2, y: 116, r: 20, color: '#4ade80', label: 'LEGS / STRIDERS' },
          slot1: { x: W / 2 + 26, y: 86, r: 20, color: '#fde047', label: 'MAIN HAND [R]' },
          slot2: { x: W / 2 - 26, y: 88, r: 20, color: '#38bdf8', label: 'SIDE HAND [L]' },
          slot3: { x: W / 2 + 18, y: 62, r: 18, color: '#c084fc', label: 'AUXILIARY [BACK]' },
          bind_l: { x: W / 2 + 26, y: 86, r: 16, color: '#fde047', label: 'LEFT TRIGGER [L]' },
          bind_r: { x: W / 2 - 26, y: 88, r: 16, color: '#38bdf8', label: 'RIGHT TRIGGER [R]' },
        };
        const z = zoneCoords[focusSlot];
        if (z) {
          ctx.save();
          ctx.strokeStyle = z.color;
          ctx.lineWidth = 1.75;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
          ctx.fillRect(8, 6, W - 16, 14);
          ctx.fillStyle = z.color;
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`TARGET HARDPOINT: ${z.label}`, W / 2, 15.5);
          ctx.restore();
        }
      }

      // Bottom status strip
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(0, H - 18, W, 18);
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`FACING: ${activeDir}`, 8, H - 6.5);
      ctx.textAlign = 'right';
      ctx.fillStyle = pausedFrame !== null ? '#fde047' : '#86efac';
      ctx.fillText(
        pausedFrame !== null ? `POSE F${pausedFrame + 1}` : `LIVE GLIDE`,
        W - 8,
        H - 6.5
      );
    };

    const scheduleNextTick = () => {
      if (!cancelled && pausedFrame === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const tick = (nowMs: number) => {
      if (cancelled) return;
      renderDoll(nowMs);
      scheduleNextTick();
    };

    renderDoll();
    scheduleNextTick();
    const unsubscribe = subscribeToMechSpriteLoad(() => renderDoll());

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      unsubscribe();
    };
  }, [state, state.equipmentSlots, selectedSlot, hoveredSlot, previewDirIdx, pausedFrame]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-40 h-44 sm:w-44 sm:h-48 bg-[#030710] border border-[#38bdf8]/50 rounded-xs overflow-hidden shadow-lg">
        <canvas ref={canvasRef} width={160} height={180} className="w-full h-full block" />
      </div>
      <div className="flex items-center gap-1 mt-1">
        <button
          type="button"
          onClick={() => setPreviewDirIdx((prev) => (prev + 1) % PREVIEW_DIRS.length)}
          className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#7dd3fc] border border-[#38bdf8]/40 rounded-xs text-[7.5px] font-bold cursor-pointer"
        >
          ↻ ROTATE VIEW ({PREVIEW_DIRS[previewDirIdx % PREVIEW_DIRS.length]})
        </button>
        <button
          type="button"
          onClick={() =>
            setPausedFrame((prev) =>
              prev === null ? 0 : prev === 3 ? null : ((prev + 1) as 0 | 1 | 2 | 3)
            )
          }
          className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#fde047] border border-[#fde047]/40 rounded-xs text-[7.5px] font-bold cursor-pointer"
        >
          {pausedFrame !== null ? `▶ POSE F${pausedFrame + 1} (STEP / ANIMATE)` : '⏸ PAUSE POSE'}
        </button>
      </div>
    </div>
  );
};


