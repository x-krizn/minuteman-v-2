/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { drawBase64Sprite } from '../../../systems/renderSystem';
import { TileDefinition } from '../../../types';
import { DOODADS_01_BASE64, DOODAD_CELLS } from './doodads_atlas';

export const poeLanternTile: TileDefinition = {
  id: 'poe_lantern',
  char: 'L',
  name: 'Poe Lantern Anchor',
  type: 'lantern',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#38bdf8',
  bakedFrontColor: '#0284c7',
  renderProp25D(g, tx, ty, sx, sy, state) {
    const isLit =
      state.flags?.poe_state === 'helped' || Boolean(state.flags?.poe_lantern_gift);

    g.fillStyle = 'rgba(0, 0, 0, 0.35)';
    g.beginPath();
    g.ellipse(sx, sy + 1, 6, 2.5, 0, 0, Math.PI * 2);
    g.fill();

    // Base unlit Poe Lantern sprite (col: 0, row: 2)
    drawBase64Sprite(
      g,
      {
        base64: DOODADS_01_BASE64,
        cellWidth: 16,
        cellHeight: 16,
        col: DOODAD_CELLS.POE_LANTERN_UNLIT.col,
        row: DOODAD_CELLS.POE_LANTERN_UNLIT.row,
        renderWidth: 16,
        renderHeight: 16,
        anchor: 'bottom-center',
      },
      sx,
      ty * TILE_SIZE + 15,
      state.t
    );

    // Procedural lantern glow & flickering spirit flame layered inside the lantern housing
    const flicker = Math.sin(state.t * 9 + tx * 2.1 + ty) * 0.5;
    const pulse = 0.68 + Math.sin(state.t * 4.8 + tx) * 0.25;
    const flameY = ty * TILE_SIZE + 7;

    g.save();
    if (isLit) {
      // Spectral cyan-white Poe flame when illuminated
      g.fillStyle = `rgba(56, 189, 248, ${(pulse * 0.45).toFixed(2)})`;
      g.beginPath();
      g.arc(sx, flameY, 5.5, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#38bdf8';
      g.fillRect(Math.round(sx - 1.5), Math.round(flameY - 2 + flicker * 0.5), 3, 4);
      g.fillStyle = '#e0f2fe';
      g.fillRect(Math.round(sx - 1), Math.round(flameY - 1), 2, 2);

      // Floating spectral mote rising from the lit lantern
      const motePhase = (state.t * 1.4 + tx * 0.37) % 1;
      const moteX = sx + Math.sin(state.t * 3.5 + ty) * 2.5;
      const moteY = flameY - 2 - motePhase * 7;
      g.fillStyle = `rgba(125, 211, 252, ${((1 - motePhase) * 0.85).toFixed(2)})`;
      g.fillRect(Math.round(moteX), Math.round(moteY), 1, 1);
    } else {
      // Subtle warm amber pilot ember when unlit so the lantern anchor remains readable
      g.fillStyle = `rgba(245, 158, 11, ${(pulse * 0.32).toFixed(2)})`;
      g.beginPath();
      g.arc(sx, flameY, 3.2, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#fbbf24';
      g.fillRect(Math.round(sx - 1), Math.round(flameY - 1), 2, 2);
    }
    g.restore();
  },
};
