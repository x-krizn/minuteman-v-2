/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64AtlasDefinition } from './base64AssetLoader';
import { bakeBiomeClusterTileset } from './subTileComposer';

/**
 * Ruins Tileset — Basic 4 `16×16px` Base Tiles (`dirt01`, `grass01`, `aether01`, `ruins01`)
 *
 * At startup, `bakeBiomeClusterTileset()` slices these 4 compact `16×16px` PNGs into
 * `4×4` (`4px` micro-blocks) and `2×2` (`8px` quadrants) and bakes all 20 separated
 * `3×3` biome clusters (`48×48px` each) plus the `192×240px` `ruins_tileset` sheet
 * onto offscreen canvases for zero-cost 60fps auto-tiling.
 */

export const dirt01 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABgUlEQVR4AVTTvUoDURAF4HEMCELEBWuLLawsxLyAj+4LRCysLLawFlYMCEJ0vd/IDaSYzO85Z+Ymyc1ms9ze3ywPd+Mi5iNi6TaO41FP37y+ONc/c3x97GN3OsR2u423z4gGOlgbrJq5x+cp2NnJOhq4MPmeq7i+MPZvPR6GIaZpqqIYcSXtA1lzwefV774UFLAiBJznubYQ651frioXm7ExnwJDAFSc4wQAdaRAhPp2Yup8AgIYsioQ01Sn4m30xQh5OUusABQ7Wfs26oEMIGqvLgyPJ1CzLUuvSsnqyAwgoopYzsypiwEJihNYYLi/h5zZhKdsDgjYrDrBdLeEUXWjGgBFynqGbYlEzxnq9YgYFSlSAFRj7pd3open1/rdeEgb1wbAhn01vA2wq1NSk6t3Ebn5+ilLrE6ddwqwtfVswdsEyBnOscXhpywBQAJMVQzI1HofWI1PN7nFSwNgt6pNDKkZ7IRI9PXU/J3je9nVH0MBoVX7owEwt3cgsBqRPwAAAP//m3zZuQAAAAZJREFUAwB+VyJAhR+DRAAAAABJRU5ErkJggg==';

export const grass01 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABdElEQVR4AXzRu0qDQRAF4GU7qyCigYCKIF6KgKZR0EattBEtLewtrX0Jn8GXsNNWO8FGQRAUAsFCLK1ivoUJy48k8DO3M+ecneT1xbnh1fXJ8OC4O+z1WuWT66nPLnbHPblZHXMa/W5v7lK70xplKU3PL5T84f4trW1106D/U2L/aZCWVmcL5uXxOUWdp2Z+S3MS0AyoFoo6H57vJx8HNXB7b7n0N49W0vfnR+pstIuTwOjby1jZZY+tAOq9v34lP0AzGLVninbLDagrTi93xm8D8FYRGUUYWGT6vvIEthysCQQI1SCDJRR1toTxPyDroYqMdQ7sEFSXJxhOAlK10BRSZ9eOv5ILqgZyM1bVSFgnpIZz8PIE7Oy4OnuAXMnNAMM6XH3Q8gRqWKkEEJk8ZiJHiLkS4TMQW1SRABoGiItQDFJzTuxmLGzWQAOgJhlSPfgQy5FYABCROhJnQaa2SAjGXTgqN6iBYQ3QAjJRHQJcEDb7AwAA//8ZAMG8AAAABklEQVQDAAkeMgeuxmtMAAAAAElFTkSuQmCC';

export const aether01 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABhElEQVR4AWzTwSrEYRQF8NuVYZKysJioITbsNEU8gQ2lvIOy8hRewjso5TE8ACuhaBYWShoGDb+v+TRp1Jn57jn3nHu//9/kwfrRAE53jsu38yjw2+3dQadz8qdvbO0NcPoyhn/nH414aDaHVUT37b4A/96ajHavVzT88utC7C+ulP5EFGXkA9efXwtgZMCBsLvZp7h6+Y7G802kJl4FOLdmluJwql8amHCMIAw25yZCXzJpUgBBbXU1mDjd/YxqdFW64NQAjAiCSVZXC2O0KWNd3WDB6UMjwZmRgREY6QwgxEBDbJWaGTU71000aGSiOYNnI5BZXd4Co9dCsAkDTq0JavDl420YiKOnSQh3Z0QSGdRWxgnWRxN+cX2GjnIFhLsTq1GgGs8oTB+d8/e/sGySldAAjLZi1Ihj/H/FyqfVFJ42eGgMOBBmA8FqsJleA8pvAeHpMjMQfIMwoDMB3YaCyxWkmiBIM8Frcq5XtCkT0HnyazWS0SSCZALjuDuP6obZ+AcAAP//eXLM/wAAAAZJREFUAwDlSlPVTeH6vgAAAABJRU5ErkJggg==';

export const ruins01 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABB0lEQVR4AcSSwQkCMRBFQ/rxsujBGmxDBLvYKhTEMrxYgYKyF3uwCC9r3uBbQhCvCs/JTP5k/2Q3v56nseV67sdfoN/1qxHy8bBPMjzuid9wuSVp86gXXbdcJMj8CWIwJ7Y5tW42T5JZIBJdUBf3iNR0TIwR2AhrlXUOEpqm/WIfvcQIJGHtM1esi02beBI1dMBaMiKKRCGniQjrzZYQl8ZCHfG7g/J0moRRaBTrxGyR04QaTRP13ZR1vR9vgUviNKERkTivkboPi7fAvGCjm8RaTB6UN+FhcQcmiMGc2ObUcCwxAiLRhQKie0Ry3EqMwEZYKxc0xWKTw4Cmuo5eYgSSsPaPD+kNAAD///WDcSkAAAAGSURBVAMA7UE+g9Zb3JsAAAAASUVORK5CYII=';

export const BASIC_4_TILE_ATLASES: Base64AtlasDefinition[] = [
  { id: 'dirt01', name: 'Dirt Base 16x16 Tile', base64: dirt01, cellWidth: 16, cellHeight: 16 },
  { id: 'grass01', name: 'Grass Base 16x16 Tile', base64: grass01, cellWidth: 16, cellHeight: 16 },
  { id: 'aether01', name: 'Aether Base 16x16 Tile', base64: aether01, cellWidth: 16, cellHeight: 16 },
  { id: 'ruins01', name: 'Ruins Base 16x16 Tile', base64: ruins01, cellWidth: 16, cellHeight: 16 },
];

const baked = bakeBiomeClusterTileset({ dirt01, grass01, aether01, ruins01 });

export const ruins_tileset = 'ruins_tileset';

export const SEPARATED_CLUSTER_ATLASES: Base64AtlasDefinition[] = baked.atlases;

export const ruinsTilesetAtlas: Base64AtlasDefinition = baked.masterAtlas;
