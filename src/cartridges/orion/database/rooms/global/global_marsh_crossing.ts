/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const globalMarshCrossingRoom: RoomDefinition = {
  id: 'global_marsh_crossing',
  scope: 'global',
  coord: 'global:marsh_crossing',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_toxic_wetlands',
  title: 'Wetland Crossing',
  bannerTitle: 'WETLAND CROSSING · PROCEDURAL MARSH',
  doorDirs: ['N', 'S', 'E', 'W'],
  grid: [
    '####..####',
    '#........#',
    '#..P..P..#',
    '#..~~~~..#',
    '#..~~~~..#',
    '..........',
    '...E......',
    '#........#',
    '####..####',
  ],
};
