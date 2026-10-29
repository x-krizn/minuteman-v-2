/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { drawBase64Sprite } from '../../../systems/render/spriteAtlasCache';
import { TileDefinition } from '../../../types';
import { getAreaDefinition } from '../index';
import { DOODADS_01_BASE64, DOODAD_CELLS } from './doodads_atlas';

export const aetherWaystationTile: TileDefinition = {
  id: 'aether_waystation',
  char: 'A',
  name: 'Æther Waystation Campfire (Area Fast Travel Anchor)',
  type: 'waystation',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#f97316',
  bakedFrontColor: '#7c2d12',
  renderProp25D(g, tx, ty, sx, sy, state) {
    const areaDef = getAreaDefinition(state.areaId);
    const wsId = areaDef?.waystation?.id;
    const isLit =
      Boolean(wsId && state.discoveredWaystations?.includes(wsId)) ||
      (state.discoveredWaystations?.length ?? 0) > 0;

    g.fillStyle = 'rgba(0, 0, 0, 0.42)';
    g.beginPath();
    g.ellipse(sx, sy + 1, 7.5, 3, 0, 0, Math.PI * 2);
    g.fill();

    // Base unlit Campfire sprite (col: 1, row: 1)
    drawBase64Sprite(
      g,
      {
        base64: DOODADS_01_BASE64,
        cellWidth: 16,
        cellHeight: 16,
        col: DOODAD_CELLS.CAMPFIRE_UNLIT.col,
        row: DOODAD_CELLS.CAMPFIRE_UNLIT.row,
        renderWidth: 16,
        renderHeight: 16,
        anchor: 'bottom-center',
      },
      sx,
      ty * TILE_SIZE + 15,
      state.t
    );

    // Layer procedural fire and rising sparks over the campfire logs when lit/attuned
    if (isLit) {
      const baseFireY = ty * TILE_SIZE + 9;
      const sway = Math.sin(state.t * 10 + tx) * 1.1;
      const stretch = Math.sin(state.t * 14 + ty) * 1.2;
      const pulse = 0.65 + Math.sin(state.t * 6.5) * 0.25;

      g.save();
      // Warm ground firelight halo
      g.fillStyle = `rgba(249, 115, 22, ${(pulse * 0.35).toFixed(2)})`;
      g.beginPath();
      g.arc(sx, baseFireY - 2, 6.5, 0, Math.PI * 2);
      g.fill();

      // Outer crimson-orange flame tongue
      g.fillStyle = '#ea580c';
      g.beginPath();
      g.moveTo(sx - 4, baseFireY + 1);
      g.lineTo(sx + sway, baseFireY - 7 - stretch);
      g.lineTo(sx + 4, baseFireY + 1);
      g.closePath();
      g.fill();

      // Mid amber flame tongue
      g.fillStyle = '#f97316';
      g.beginPath();
      g.moveTo(sx - 3, baseFireY + 1);
      g.lineTo(sx - sway * 0.6, baseFireY - 5 - stretch * 0.6);
      g.lineTo(sx + 3, baseFireY + 1);
      g.closePath();
      g.fill();

      // Bright yellow-white heart of the fire
      g.fillStyle = '#facc15';
      g.fillRect(Math.round(sx - 1.5), Math.round(baseFireY - 3), 3, 3);
      g.fillStyle = '#fef08a';
      g.fillRect(Math.round(sx - 0.5), Math.round(baseFireY - 2), 1, 2);

      // Rising pixel embers
      for (let i = 0; i < 2; i++) {
        const sparkCycle = (state.t * 1.8 + i * 0.5) % 1;
        const sparkX = sx + Math.sin(state.t * 5 + i * 3.1) * 3;
        const sparkY = baseFireY - 4 - sparkCycle * 8;
        g.fillStyle = i === 0 ? '#fb923c' : '#fde047';
        g.globalAlpha = Math.max(0, 1 - sparkCycle);
        g.fillRect(Math.round(sparkX), Math.round(sparkY), 1, 1);
      }
      g.restore();
    }
  },
};
