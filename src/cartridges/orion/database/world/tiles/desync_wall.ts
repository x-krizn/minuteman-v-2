/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';

export const desyncWallTile: TileDefinition = {
  id: 'desync_wall',
  char: '%',
  name: 'Desynchronizing Wall',
  type: 'desync_wall',
  solid: true,
  isDesync: true,
  blocksHeight: 2,
  bakedTopColor: '#a855f7',
  bakedFrontColor: '#4c1d95',
  renderLayer1(g, _tx, _ty, sx, sy, state) {
    const isSolidPhase = Math.floor(state.t / 3.5) % 2 === 0;
    if (isSolidPhase) {
      g.fillStyle = '#a855f7';
      g.fillRect(sx, sy, TILE_SIZE, 5);
      g.fillStyle = '#581c87';
      g.fillRect(sx, sy + 5, TILE_SIZE, 11);
      g.fillStyle = 'rgba(192, 132, 252, 0.45)';
      g.fillRect(sx + 2, sy + 7, TILE_SIZE - 4, 2);
    } else {
      g.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      g.lineWidth = 1;
      g.strokeRect(sx + 1.5, sy + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
    }
  },
};
