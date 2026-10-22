/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { drawBase64Sprite } from '../../../systems/renderSystem';
import { TileDefinition } from '../../../types';
import { DOODADS_01_BASE64, DOODAD_CELLS } from './doodads_atlas';

export const colossalWaygateTile: TileDefinition = {
  id: 'colossal_waygate',
  char: 'Q',
  name: 'Colossal Waygate (Inter-World Signature Archway)',
  type: 'waygate',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#67e8f9',
  bakedFrontColor: '#164e63',
  renderProp25D(g, tx, ty, sx, sy, state) {
    const tileBottomY = ty * TILE_SIZE + 16;
    const bobOffset = Math.sin(state.t * 3.2 + tx * 0.7) * 2.2;
    const pulse = 0.65 + Math.sin(state.t * 4.0) * 0.3;

    // Ground shadow
    g.fillStyle = 'rgba(0, 0, 0, 0.5)';
    g.beginPath();
    g.ellipse(sx, sy + 2, 8.5, 3.5, 0, 0, Math.PI * 2);
    g.fill();

    // 1. Waygate Base Plinth (col: 1, row: 0) anchored at the tile floor
    drawBase64Sprite(
      g,
      {
        base64: DOODADS_01_BASE64,
        cellWidth: 16,
        cellHeight: 16,
        col: DOODAD_CELLS.WAYGATE_BASE.col,
        row: DOODAD_CELLS.WAYGATE_BASE.row,
        renderWidth: 16,
        renderHeight: 16,
        anchor: 'bottom-center',
      },
      sx,
      tileBottomY,
      state.t
    );

    // Procedural Ætheric conduit column & glow between base and floating top orb
    const orbBottomY = tileBottomY - 10 + bobOffset;
    const orbCenterY = orbBottomY - 8;

    g.save();
    g.fillStyle = `rgba(34, 211, 238, ${(pulse * 0.28).toFixed(2)})`;
    g.beginPath();
    g.arc(sx, orbCenterY, 8, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = `rgba(192, 132, 252, ${(pulse * 0.24).toFixed(2)})`;
    g.beginPath();
    g.ellipse(sx, tileBottomY - 5, 5, 2, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // 2. Waygate Floating Top Orb (col: 1, row: 2) bobbing above the base
    drawBase64Sprite(
      g,
      {
        base64: DOODADS_01_BASE64,
        cellWidth: 16,
        cellHeight: 16,
        col: DOODAD_CELLS.WAYGATE_TOP.col,
        row: DOODAD_CELLS.WAYGATE_TOP.row,
        renderWidth: 16,
        renderHeight: 16,
        anchor: 'bottom-center',
      },
      sx,
      Math.round(orbBottomY),
      state.t
    );

    // Orbiting Æther motes rising from the base into the floating orb
    g.save();
    for (let i = 0; i < 2; i++) {
      const phase = (state.t * 1.3 + i * 0.5) % 1;
      const mx = sx + Math.cos(state.t * 3.8 + i * Math.PI) * 5;
      const my = tileBottomY - 4 - phase * 14;
      g.fillStyle = i === 0 ? '#67e8f9' : '#e879f9';
      g.globalAlpha = Math.sin(phase * Math.PI) * 0.85;
      g.fillRect(Math.round(mx), Math.round(my), 1.5, 1.5);
    }
    g.restore();
  },
};
