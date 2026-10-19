/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';

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
  renderLayer1(g, _tx, _ty, sx, sy, state) {
    const isOpen =
      !state.flags?.orc_raid_active &&
      Boolean(
        state.unlockedGates[state.room] ||
          state.clearedRooms[state.room] ||
          state.flags?.bog_exit_revealed
      );
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
