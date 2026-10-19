/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../../types';

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
    '#::L..,,,#', // Poe's Lantern Anchor (L) on Ruins flagstones
    '#::p..P,,#', // Drifting Poe Spirit (p) & Single Wall Pillar (P)
    '#..~~~~,,#',
    '#..~W~~..#', // Submerged Bog Wurm (W) lurking in Corrosive Aether (~)
    '...,.....:',
    '...,.....:',
    '#,,,E.:::#', // Bog Crawler
    '####..####', // South passage to global marsh room (2,1)
  ],
};
