/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { drawCompositePlayerMech, subscribeToMechSpriteLoad } from '../../systems';
import { OrionState, TraitLine } from '../../types';

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

export const CompositeMechPreviewCanvas: React.FC<{
  state: OrionState;
  head?: string;
  arms?: string;
  plating?: string;
  weaponId?: string;
}> = ({ state, head, arms, plating, weaponId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const renderPreview = () => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, 32, 32);
      ctx.imageSmoothingEnabled = false;
      drawCompositePlayerMech(ctx, state, 16, 28, state.t || 0, {
        dir: 'S',
        isMoving: false,
      });
    };

    renderPreview();
    return subscribeToMechSpriteLoad(renderPreview);
  }, [state, head, arms, plating, weaponId, state.traitLine]);

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      className="w-10 h-10 shrink-0 [image-rendering:pixelated] bg-[#020617] border border-[#38bdf8]/40 rounded-xs"
    />
  );
};
