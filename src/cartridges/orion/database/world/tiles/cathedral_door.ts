/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';

export const cathedralDoorTile: TileDefinition = {
  id: 'cathedral_door',
  char: 'M',
  name: 'Cathedral Dungeon Door (3-Way Gate)',
  type: 'dungeon_door',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#c084fc',
  bakedFrontColor: '#581c87',
  renderLayer1(g, _tx, _ty, sx, sy, state) {
    const isOpen = Boolean(
      state.flags?.cathedral_door_open || state.unlockedGates[`${state.room}:M`]
    );
    g.fillStyle = '#450a0a';
    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    if (!isOpen) {
      g.fillStyle = '#f59e0b';
      g.fillRect(sx + 1, sy + 1, TILE_SIZE - 2, 3);
      for (let bx = 3; bx < TILE_SIZE - 2; bx += 4) {
        g.fillRect(sx + bx, sy + 4, 2, TILE_SIZE - 5);
      }
    } else {
      g.fillStyle = '#fde68a';
      g.fillRect(sx + 3, sy + 3, 10, 12);
    }
  },
};
