/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';

export const ruins01 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABB0lEQVR4AcSSwQkCMRBFQ/rxsujBGmxDBLvYKhTEMrxYgYKyF3uwCC9r3uBbQhCvCs/JTP5k/2Q3v56nseV67sdfoN/1qxHy8bBPMjzuid9wuSVp86gXXbdcJMj8CWIwJ7Y5tW42T5JZIBJdUBf3iNR0TIwR2AhrlXUOEpqm/WIfvcQIJGHtM1esi02beBI1dMBaMiKKRCGniQjrzZYQl8ZCHfG7g/J0moRRaBTrxGyR04QaTRP13ZR1vR9vgUviNKERkTivkboPi7fAvGCjm8RaTB6UN+FhcQcmiMGc2ObUcCwxAiLRhQKie0Ry3EqMwEZYKxc0xWKTw4Cmuo5eYgSSsPaPD+kNAAD///WDcSkAAAAGSURBVAMA7UE+g9Zb3JsAAAAASUVORK5CYII=';

export const ruinsFloorTile: TileDefinition = {
  id: 'ruins_floor',
  char: ':',
  name: 'Ancient Ruins Flagstone',
  type: 'floor',
  solid: false,
  blocksHeight: 0,
  clusterTerrain: 'ruins',
  subTileMode: '2x2',
  baseTileBase64: ruins01,
  renderLayer0(g, tx, ty, sx, sy) {
    const isAlt = (tx + ty) % 2 === 0;
    g.fillStyle = isAlt ? '#2c3340' : '#252b36';
    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    g.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    g.lineWidth = 1;
    g.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  },
};
