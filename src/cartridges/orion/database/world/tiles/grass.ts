/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';

export const grassTile: TileDefinition = {
  id: 'grass',
  char: ',',
  name: 'Overgrown Marsh Grass',
  type: 'floor',
  solid: false,
  blocksHeight: 0,
  renderLayer0(g, tx, ty, sx, sy) {
    const isAlt = (tx + ty) % 2 === 0;
    g.fillStyle = isAlt ? '#1e3528' : '#182b20';
    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    g.fillStyle = '#2d4f3b';
    g.fillRect(sx + 3, sy + 4, 2, 3);
    g.fillRect(sx + 10, sy + 9, 2, 3);
  },
};
