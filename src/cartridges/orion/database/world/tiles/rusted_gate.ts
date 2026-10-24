/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { drawBase64Sprite } from '../../../systems/renderSystem';
import { TileDefinition } from '../../../types';
import { bogTiles_14_11, bogTiles_15_10, bogTiles_15_11, bogTiles_15_12 } from './bog_tileset_atlas';

export const rustedGateTile: TileDefinition = {
  id: 'rusted_gate',
  char: 'G',
  name: 'Bog Exit / Perimeter Gate',
  type: 'gate',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#38bdf8',
  bakedFrontColor: '#0369a1',
  checkSolid(state, roomKey) {
    if (state.flags?.orc_raid_active) return true;
    return (
      !state.unlockedGates?.[roomKey] &&
      !state.clearedRooms?.[roomKey] &&
      !state.flags?.bog_exit_revealed
    );
  },
  renderLayer1(g, tx, ty, sx, sy, state) {
    const isOpen =
      !state.flags?.orc_raid_active &&
      Boolean(
        state.unlockedGates[state.room] ||
          state.clearedRooms[state.room] ||
          state.flags?.bog_exit_revealed
      );

    // Draw the stone gate arch base (14_11)
    const drewArch = drawBase64Sprite(
      g,
      {
        base64: bogTiles_14_11,
        cellWidth: TILE_SIZE,
        cellHeight: TILE_SIZE,
        col: 0,
        row: 0,
        renderWidth: TILE_SIZE,
        renderHeight: TILE_SIZE,
        anchor: 'top-left',
      },
      sx,
      sy,
      state.t
    );

    if (!isOpen) {
      // Overlay the iron portcullis grate (15_11 center gate or 15_10 / 15_12 side bars)
      const gateBarTile =
        (tx + ty) % 3 === 0 ? bogTiles_15_10 : (tx + ty) % 3 === 2 ? bogTiles_15_12 : bogTiles_15_11;
      const drewBars = drawBase64Sprite(
        g,
        {
          base64: gateBarTile,
          cellWidth: TILE_SIZE,
          cellHeight: TILE_SIZE,
          col: 0,
          row: 0,
          renderWidth: TILE_SIZE,
          renderHeight: TILE_SIZE,
          anchor: 'top-left',
        },
        sx,
        sy,
        state.t
      );
      if (drewArch || drewBars) {
        if (state.flags?.orc_raid_active) {
          g.fillStyle = 'rgba(239, 68, 68, 0.28)';
          g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        }
        return;
      }
    } else if (drewArch) {
      return;
    }

    g.fillStyle = state.flags?.orc_raid_active ? '#7f1d1d' : '#0369a1';
    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    if (!isOpen) {
      g.fillStyle = state.flags?.orc_raid_active ? '#f87171' : '#38bdf8';
      for (let bx = 2; bx < TILE_SIZE; bx += 3) {
        g.fillRect(sx + bx, sy + 2, 2, TILE_SIZE - 2);
      }
    } else {
      g.fillStyle = '#7dd3fc';
      g.fillRect(sx + 3, sy + 4, 10, 12);
    }
  },
};
