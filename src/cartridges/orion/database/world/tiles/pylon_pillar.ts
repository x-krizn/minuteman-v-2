/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';
import { getBiomeDefinition } from '../../biomes';

export const pylonPillarTile: TileDefinition = {
  id: 'pylon_pillar',
  char: 'P',
  name: 'Ruined Pylon',
  type: 'pylon',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#64748b',
  bakedFrontColor: '#334155',
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    const biome = getBiomeDefinition(state?.biomeId);
    g.fillStyle = biome.tileAssets.shadow || 'rgba(0, 0, 0, 0.4)';
    g.beginPath();
    g.ellipse(sx, sy, 6, 3, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = biome.tileAssets.pylonFront || '#334155';
    g.fillRect(sx - 4, sy - 18, 8, 18);
    g.fillStyle = biome.tileAssets.pylonTop || '#64748b';
    g.fillRect(sx - 2, sy - 18, 2, 18);
    g.fillStyle = biome.tileAssets.pylonTrim || '#94a3b8';
    g.fillRect(sx - 4, sy - 20, 8, 3);
  },
};
