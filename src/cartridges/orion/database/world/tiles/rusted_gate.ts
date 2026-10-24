/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getRoomDimensions, TILE_SIZE } from '../../../constants';
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

    const { rows } = getRoomDimensions();
    let stairBase64 = bogTiles_15_12; // Default East transition stairs
    if (ty === 0) {
      stairBase64 = bogTiles_14_11; // North stairs
    } else if (ty >= rows - 1) {
      stairBase64 = bogTiles_15_11; // South stairs
    } else if (tx === 0) {
      stairBase64 = bogTiles_15_10; // West stairs
    }

    const drewStairs = drawBase64Sprite(
      g,
      {
        base64: stairBase64,
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
      g.fillStyle = state.flags?.orc_raid_active
        ? 'rgba(127, 29, 29, 0.55)'
        : 'rgba(15, 23, 42, 0.55)';
      g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      g.fillStyle = state.flags?.orc_raid_active ? '#f87171' : '#38bdf8';
      for (let bx = 2; bx < TILE_SIZE; bx += 4) {
        g.fillRect(sx + bx, sy + 2, 1, TILE_SIZE - 4);
      }
      return;
    }

    if (drewStairs) return;

    g.fillStyle = '#7dd3fc';
    g.fillRect(sx + 3, sy + 4, 10, 12);
  },
};
