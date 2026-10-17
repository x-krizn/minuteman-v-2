/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';

export const sinkholeTile: TileDefinition = {
  id: 'chasm',
  char: '_',
  name: 'Abyssal Sinkhole',
  type: 'chasm',
  solid: false,
  isChasm: true,
  blocksHeight: 0,
  bakedTopColor: '#090d14',
  renderLayer0(g, _tx, _ty, sx, sy) {
    g.fillStyle = '#05070a';
    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    g.fillStyle = 'rgba(0, 0, 0, 0.7)';
    g.fillRect(sx, sy, TILE_SIZE, 3);
  },
};
