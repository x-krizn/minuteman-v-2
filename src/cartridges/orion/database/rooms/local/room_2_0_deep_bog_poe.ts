/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const room20DeepBogPoe: RoomDefinition = {
  id: 'room_2_0_deep_bog_poe',
  scope: 'local',
  coord: '2,0',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'The Poe & Deep Bog',
  bannerTitle: 'DEEP BOG · THE POE & SUBMERGED WURM',
  grid: [
    '####..####', // North passage to global marsh room (2,-1)
    '#..L.....#', // Poe's Lantern Anchor (L)
    '#..p..P..#', // Drifting Poe Spirit (p)
    '#..~~~~..#',
    '#..~W~~..#', // Submerged Bog Wurm (W) lurking in Corrosive Bog Water (~)
    '..........',
    '..........',
    '#...E....#', // Bog Crawler
    '####..####', // South passage to global marsh room (2,1)
  ],
};
