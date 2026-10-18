/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../../types';

export const room1Neg1SunkenSinkhole: RoomDefinition = {
  id: 'room_1_neg1_sunken_sinkhole',
  scope: 'local',
  coord: '1,-1',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Sunken Sinkhole Island',
  bannerTitle: 'SUNKEN SINKHOLE ISLAND (SECRET)',
  grid: [
    '##########',
    '#..P..P..#',
    '#...C....#', // Supply Cache (contains Bedivere List Relic #1)
    '#.~~..~~.#',
    '#........#',
    '#..P..P...#',
    '#........#',
    '#........#',
    '####..####',
  ],
  cache: {
    scrap: 35,
    items: [
      { itemId: 'bedivere_relic', count: 1 },
      { itemId: 'corrupted_shard', count: 1 },
      { itemId: 'repair_kit', count: 2 },
    ],
    toast: 'LOOTED: +35 SCRAP, BEDIVERE RELIC (1/3), SHARD & REPAIR KITS',
  },
};
