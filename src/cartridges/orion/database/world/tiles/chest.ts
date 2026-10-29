/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { drawBase64Sprite } from '../../../systems/render/spriteAtlasCache';
import { TileDefinition } from '../../../types';
import { DOODADS_01_BASE64, DOODAD_CELLS, isRoomCacheLooted } from './doodads_atlas';

export const chestTile: TileDefinition = {
  id: 'chest',
  char: 'V',
  name: 'Treasure Chest',
  type: 'cache',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#f59e0b',
  bakedFrontColor: '#78350f',
  renderProp25D(g, tx, ty, sx, sy, state) {
    const isOpened = isRoomCacheLooted(state, tx, ty);
    const cell = isOpened ? DOODAD_CELLS.CHEST_OPENED : DOODAD_CELLS.CHEST_CLOSED;

    g.fillStyle = 'rgba(0, 0, 0, 0.42)';
    g.beginPath();
    g.ellipse(sx, sy + 1, 7.5, 3, 0, 0, Math.PI * 2);
    g.fill();

    drawBase64Sprite(
      g,
      {
        base64: DOODADS_01_BASE64,
        cellWidth: 16,
        cellHeight: 16,
        col: cell.col,
        row: cell.row,
        renderWidth: 16,
        renderHeight: 16,
        anchor: 'bottom-center',
      },
      sx,
      ty * TILE_SIZE + 15,
      state.t
    );

    if (!isOpened) {
      const glint = Math.sin(state.t * 3.5 + tx + ty) * 0.5 + 0.5;
      if (glint > 0.72) {
        g.fillStyle = `rgba(254, 240, 138, ${((glint - 0.72) * 3.2).toFixed(2)})`;
        g.fillRect(Math.round(sx - 1), Math.round(sy - 6), 2, 2);
      }
    }
  },
};
