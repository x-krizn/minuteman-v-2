/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';
import { getBiomeDefinition } from '../biomes';

export const mudTile: TileDefinition = {
  id: 'mud',
  char: '~',
  name: 'Corrosive Bog Water',
  type: 'mud',
  solid: false,
  isMud: true,
  isWater: true,
  isCorrosive: true,
  blocksHeight: 0,
  bakedTopColor: '#1e293b',
  renderLayer0(g, tx, ty, sx, sy, state) {
    const biome = getBiomeDefinition(state?.biomeId);
    g.fillStyle = biome.tileAssets.waterColor || '#17202a';
    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    const ripple = Math.sin(state.t * 2 + tx * 2 + ty) * 1.5;
    g.fillStyle = biome.tileAssets.waterRippleColor || '#22303f';
    g.fillRect(sx + 2, sy + 5 + ripple, 5, 1);
    g.fillRect(sx + 8, sy + 11 - ripple, 4, 1);
  },
};
