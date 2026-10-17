/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const room4Neg1BorderTownBarracks: RoomDefinition = {
  id: 'room_4_neg1_border_town_barracks',
  scope: 'local',
  coord: '4,-1',
  mapId: 'map_border_town_barracks',
  areaId: 'border_town_slums',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  title: 'Border Town Barracks',
  bannerTitle: 'BORDER TOWN BARRACKS · PERCIVAL & TRISTAN',
  grid: [
    '##########',
    '#..2..C..#', // Hidden Switch #2 (2) & Barracks Cache (Bedivere List Relic #3)
    '#..K..T..#', // Sir Percival (K) & Sir Tristan (T)
    '#........#',
    '#...o....#', // Orc Pair in the Barracks
    '#..P..P...', // East passage to global northern cloister (5,-1)
    '#.........',
    '#........#',
    '####..####',
  ],
  cache: {
    scrap: 30,
    items: [
      { itemId: 'bedivere_relic', count: 1 },
      { itemId: 'repair_kit', count: 2 },
    ],
    toast: 'LOOTED: +30 SCRAP, BEDIVERE RELIC (3/3) & REPAIR KITS',
  },
};
