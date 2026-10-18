/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../../types';

export const room30BogPerimeterGate: RoomDefinition = {
  id: 'room_3_0_bog_perimeter_gate',
  scope: 'local',
  coord: '3,0',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Bog Perimeter Gateway',
  bannerTitle: 'BOG EXIT PERIMETER · ORC PAIR & SIEGE TRAIL',
  grid: [
    '##########',
    '#........#',
    '#..P..P..#',
    '#...o....#', // Orc Warrior (automatically spawns paired Orc Scout)
    '#..~~~~..#',
    '.......G..', // Bog Exit Gate (hidden until Poe resolved or Rusted Gate Key used)
    '.......G..',
    '#........#',
    '####..####', // South passage on foot to Novarin Orc Siege Encampment (3,1)
  ],
};
