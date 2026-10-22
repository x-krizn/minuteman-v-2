/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
};
