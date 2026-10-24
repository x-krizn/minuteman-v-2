/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { drawBase64Sprite } from '../../../systems/renderSystem';
import { TileDefinition } from '../../../types';
import { bogTiles_14_11, bogTiles_15_10, bogTiles_15_11, bogTiles_15_12 } from './bog_tileset_atlas';

export const cathedralDoorTile: TileDefinition = {
  id: 'cathedral_door',
  char: 'M',
  name: 'Cathedral Dungeon Door (3-Way Gate)',
  type: 'dungeon_door',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#c084fc',
  bakedFrontColor: '#581c87',
  checkSolid(state, roomKey) {
    return !state.flags?.cathedral_door_open && !state.unlockedGates?.[`${roomKey}:M`];
  },
  renderLayer1(g, tx, ty, sx, sy, state) {
    const isOpen = Boolean(
      state.flags?.cathedral_door_open || state.unlockedGates[`${state.room}:M`]
    );

    let stairBase64 = bogTiles_14_11;
    if (tx === 0) stairBase64 = bogTiles_15_10;
    else if (ty > 6) stairBase64 = bogTiles_15_11;
    else if (tx > 8) stairBase64 = bogTiles_15_12;

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
      g.fillStyle = 'rgba(69, 10, 10, 0.55)';
      g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      g.fillStyle = '#f59e0b';
      g.fillRect(sx + 1, sy + 1, TILE_SIZE - 2, 2);
      for (let bx = 3; bx < TILE_SIZE - 2; bx += 4) {
        g.fillRect(sx + bx, sy + 3, 1, TILE_SIZE - 4);
      }
      return;
    }

    if (drewStairs) return;

    g.fillStyle = '#fde68a';
    g.fillRect(sx + 3, sy + 3, 10, 12);
  },
};
