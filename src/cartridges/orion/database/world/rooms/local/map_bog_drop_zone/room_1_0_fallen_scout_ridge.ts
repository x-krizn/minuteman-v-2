/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../../types';

export const room10FallenScoutRidge: RoomDefinition = {
  id: 'room_1_0_fallen_scout_ridge',
  scope: 'local',
  coord: '1,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Fallen Scout Ridge',
  bannerTitle: 'FALLEN SCOUT RIDGE · SIR BEDIVERE',
  grid: [
    '####..####', // North passage to Sunken Sinkhole (1,-1)
    '#........#',
    '#...S....#', // Bedivere / Fallen Scout (Booster Kit, Khopesh, Signet Ring, Numbered List)
    '#........#',
    '#..____..#',
    '...____...',
    '..........',
    '#........#',
    '####..####', // South passage to procedural global room (1,1)
  ],
};
