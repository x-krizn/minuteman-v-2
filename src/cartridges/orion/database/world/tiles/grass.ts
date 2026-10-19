/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { TileDefinition } from '../../../types';

export const grass01 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABdElEQVR4AXzRu0qDQRAF4GU7qyCigYCKIF6KgKZR0EattBEtLewtrX0Jn8GXsNNWO8FGQRAUAsFCLK1ivoUJy48k8DO3M+ecneT1xbnh1fXJ8OC4O+z1WuWT66nPLnbHPblZHXMa/W5v7lK70xplKU3PL5T84f4trW1106D/U2L/aZCWVmcL5uXxOUWdp2Z+S3MS0AyoFoo6H57vJx8HNXB7b7n0N49W0vfnR+pstIuTwOjby1jZZY+tAOq9v34lP0AzGLVninbLDagrTi93xm8D8FYRGUUYWGT6vvIEthysCQQI1SCDJRR1toTxPyDroYqMdQ7sEFSXJxhOAlK10BRSZ9eOv5ILqgZyM1bVSFgnpIZz8PIE7Oy4OnuAXMnNAMM6XH3Q8gRqWKkEEJk8ZiJHiLkS4TMQW1SRABoGiItQDFJzTuxmLGzWQAOgJhlSPfgQy5FYABCROhJnQaa2SAjGXTgqN6iBYQ3QAjJRHQJcEDb7AwAA//8ZAMG8AAAABklEQVQDAAkeMgeuxmtMAAAAAElFTkSuQmCC';

export const grassTile: TileDefinition = {
  id: 'grass',
  char: ',',
  name: 'Overgrown Marsh Grass',
  type: 'floor',
  solid: false,
  blocksHeight: 0,
  clusterTerrain: 'grass',
  subTileMode: '4x4',
  baseTileBase64: grass01,
  renderLayer0(g, tx, ty, sx, sy) {
    const isAlt = (tx + ty) % 2 === 0;
    g.fillStyle = isAlt ? '#1e3528' : '#182b20';
    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    g.fillStyle = '#2d4f3b';
    g.fillRect(sx + 3, sy + 4, 2, 3);
    g.fillRect(sx + 10, sy + 9, 2, 3);
  },
};
