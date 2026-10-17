/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const globalOrcOutpostCorridorRoom: RoomDefinition = {
  id: 'global_orc_outpost_corridor',
  scope: 'global',
  coord: 'global:orc_outpost_corridor',
  areaId: 'orc_siege_encampment',
  biomeId: 'orc_siege_encampment',
  title: 'Siege Trench Approach',
  bannerTitle: 'NOVARIN SIEGE TRENCH · ORC PATROL',
  doorDirs: ['N', 'S', 'E', 'W'],
  grid: [
    '####..####',
    '#..P..P..#',
    '#........#',
    '#...o....#',
    '#..~~~~..#',
    '..........',
    '..........',
    '#........#',
    '####..####',
  ],
};
