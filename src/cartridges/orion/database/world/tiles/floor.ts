/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const dirt01 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABgUlEQVR4AVTTvUoDURAF4HEMCELEBWuLLawsxLyAj+4LRCysLLawFlYMCEJ0vd/IDaSYzO85Z+Ymyc1ms9ze3ywPd+Mi5iNi6TaO41FP37y+ONc/c3x97GN3OsR2u423z4gGOlgbrJq5x+cp2NnJOhq4MPmeq7i+MPZvPR6GIaZpqqIYcSXtA1lzwefV774UFLAiBJznubYQ651frioXm7ExnwJDAFSc4wQAdaRAhPp2Yup8AgIYsioQ01Sn4m30xQh5OUusABQ7Wfs26oEMIGqvLgyPJ1CzLUuvSsnqyAwgoopYzsypiwEJihNYYLi/h5zZhKdsDgjYrDrBdLeEUXWjGgBFynqGbYlEzxnq9YgYFSlSAFRj7pd3open1/rdeEgb1wbAhn01vA2wq1NSk6t3Ebn5+ilLrE6ddwqwtfVswdsEyBnOscXhpywBQAJMVQzI1HofWI1PN7nFSwNgt6pNDKkZ7IRI9PXU/J3je9nVH0MBoVX7owEwt3cgsBqRPwAAAP//m3zZuQAAAAZJREFUAwB+VyJAhR+DRAAAAABJRU5ErkJggg==';

export const groundTile: TileDefinition = {
  id: 'floor',
  char: '.',
  name: 'Solid Island Soil',
  type: 'floor',
  solid: false,
  blocksHeight: 0,
  bakedTopColor: '#334155',
  clusterTerrain: 'dirt',
  subTileMode: '4x4',
  baseTileBase64: dirt01,
};
