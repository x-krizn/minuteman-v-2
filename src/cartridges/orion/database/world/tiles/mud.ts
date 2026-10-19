/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';
import { getBiomeDefinition } from '../biomes';

export const aether01 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABhElEQVR4AWzTwSrEYRQF8NuVYZKysJioITbsNEU8gQ2lvIOy8hRewjso5TE8ACuhaBYWShoGDb+v+TRp1Jn57jn3nHu//9/kwfrRAE53jsu38yjw2+3dQadz8qdvbO0NcPoyhn/nH414aDaHVUT37b4A/96ajHavVzT88utC7C+ulP5EFGXkA9efXwtgZMCBsLvZp7h6+Y7G802kJl4FOLdmluJwql8amHCMIAw25yZCXzJpUgBBbXU1mDjd/YxqdFW64NQAjAiCSVZXC2O0KWNd3WDB6UMjwZmRgREY6QwgxEBDbJWaGTU71000aGSiOYNnI5BZXd4Co9dCsAkDTq0JavDl420YiKOnSQh3Z0QSGdRWxgnWRxN+cX2GjnIFhLsTq1GgGs8oTB+d8/e/sGySldAAjLZi1Ihj/H/FyqfVFJ42eGgMOBBmA8FqsJleA8pvAeHpMjMQfIMwoDMB3YaCyxWkmiBIM8Frcq5XtCkT0HnyazWS0SSCZALjuDuP6obZ+AcAAP//eXLM/wAAAAZJREFUAwDlSlPVTeH6vgAAAABJRU5ErkJggg==';

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
  clusterTerrain: 'aether',
  subTileMode: '4x4',
  baseTileBase64: aether01,
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
