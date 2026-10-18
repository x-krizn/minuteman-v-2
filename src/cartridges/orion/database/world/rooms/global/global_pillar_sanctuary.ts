/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../types';

export const globalPillarSanctuaryRoom: RoomDefinition = {
  id: 'global_pillar_sanctuary',
  scope: 'global',
  coord: 'global:pillar_sanctuary',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_desync_ruins',
  title: 'Collapsed Colonnade',
  bannerTitle: 'COLLAPSED COLONNADE · SALVAGE SECTOR',
  doorDirs: ['N', 'S', 'E', 'W'],
  grid: [
    '####..####',
    '#..P..P..#',
    '#...C....#',
    '#........#',
    '#..P..P..#',
    '..........',
    '..........',
    '#........#',
    '####..####',
  ],
};
