/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const room50BorderTownCathedral: RoomDefinition = {
  id: 'room_5_0_border_town_cathedral',
  scope: 'local',
  coord: '5,0',
  mapId: 'map_border_town_cathedral',
  areaId: 'border_town_slums',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  title: 'Border Town Cathedral',
  bannerTitle: 'CATHEDRAL COURTYARD · SIR BORS & DUNGEON DOOR',
  grid: [
    '####..####', // North passage to global cloister (5,-1)
    '#..3.....#', // Hidden Switch #3 (3)
    '#..P..P..#',
    '#...B....#', // Sir Bors (B)
    '#........#',
    '.......M..', // Three-Way Cathedral Dungeon Door (M: Force / Exploration / Trust) -> leads east to (6,0)
    '.......M..',
    '#........#',
    '####..####', // South passage to global nave ruins (5,1)
  ],
};
