/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../types';

export const globalSinkholeBridgeRoom: RoomDefinition = {
  id: 'global_sinkhole_bridge',
  scope: 'global',
  coord: 'global:sinkhole_bridge',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_toxic_wetlands',
  title: 'Abyssal Causeway',
  bannerTitle: 'ABYSSAL CAUSEWAY · ELEVATION CROSSING',
  doorDirs: ['N', 'S', 'E', 'W'],
  grid: [
    '####..####',
    '#........#',
    '#.._.._..#',
    '#.._.._..#',
    '#........#',
    '..........',
    '...E......',
    '#........#',
    '####..####',
  ],
};
