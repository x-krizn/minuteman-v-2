/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';
import { getBiomeDefinition } from '../../biomes';

export const groundTile: TileDefinition = {
  id: 'floor',
  char: '.',
  name: 'Solid Island Soil',
  type: 'floor',
  solid: false,
  blocksHeight: 0,
  bakedTopColor: '#334155',
  renderLayer0(g, tx, ty, sx, sy, state) {
    const biome = getBiomeDefinition(state?.biomeId);
    const isAlt = (tx + ty) % 2 === 0;
    g.fillStyle = isAlt
      ? biome.tileAssets.groundPrimary || '#253243'
      : biome.tileAssets.groundSecondary || '#1f2a38';
    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    g.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    g.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  },
};
