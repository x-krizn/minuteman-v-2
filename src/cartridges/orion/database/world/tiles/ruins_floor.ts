/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';

export const ruinsFloorTile: TileDefinition = {
  id: 'ruins_floor',
  char: ':',
  name: 'Ancient Ruins Flagstone',
  type: 'floor',
  solid: false,
  blocksHeight: 0,
  renderLayer0(g, tx, ty, sx, sy) {
    const isAlt = (tx + ty) % 2 === 0;
    g.fillStyle = isAlt ? '#2c3340' : '#252b36';
    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    g.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    g.lineWidth = 1;
    g.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  },
};
