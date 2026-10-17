/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const globalRuinedArcadeRoom: RoomDefinition = {
  id: 'global_ruined_arcade',
  scope: 'global',
  coord: 'global:ruined_arcade',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_desync_ruins',
  title: 'Desynchronized Arcade',
  bannerTitle: 'DESYNCHRONIZED ARCADE · PHASING MASONRY',
  doorDirs: ['N', 'S', 'E', 'W'],
  grid: [
    '####..####',
    '#..P..P..#',
    '#..%%%%..#',
    '#........#',
    '#...E....#',
    '..........',
    '..........',
    '#..P..P..#',
    '####..####',
  ],
};
