/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';

export const pylonWallTile: TileDefinition = {
  id: 'pylon_wall',
  char: '#',
  name: 'Ruined Pylon Wall',
  type: 'wall',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#475569',
  bakedFrontColor: '#1e293b',
  renderLayer1(g, _tx, _ty, sx, sy) {
    g.fillStyle = this.bakedTopColor || '#475569';
    g.fillRect(sx, sy, TILE_SIZE, 5);
    g.fillStyle = '#64748b';
    g.fillRect(sx, sy, TILE_SIZE, 1);

    g.fillStyle = this.bakedFrontColor || '#1e293b';
    g.fillRect(sx, sy + 5, TILE_SIZE, 11);
    g.fillStyle = '#0f172a';
    g.fillRect(sx, sy + 9, TILE_SIZE, 1);

    g.fillStyle = 'rgba(0, 0, 0, 0.35)';
    g.fillRect(sx, sy + 16, TILE_SIZE, 3);
  },
};
