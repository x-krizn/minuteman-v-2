/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../../types';

export const room70TyrranusWaygateLanding: RoomDefinition = {
  id: 'room_7_0_tyrranus_waygate_landing',
  scope: 'local',
  coord: '7,0',
  mapId: 'map_tyrranus_gatehead',
  areaId: 'tyrranus_marble_gatehead',
  regionId: 'region_tyrranus_frontier',
  biomeId: 'tyrranus_colosseum_outpost',
  title: 'Tyrranus Waygate Colonnade',
  bannerTitle: 'TYRRANUS FRONTIER · IMPERIAL WAYGATE COLONNADE',
  grid: [
    '##########',
    '#..A..C..#', // Tyrranus Æther Waystation (A) & Imperial Cache (C)
    '#..P..P..#',
    '#....Q...#', // Colossal Tyrranus Waygate (Q)
    '#........#',
    '.........#', // West passage back across Æther Drift Span to Camelot Sanctum (6,0)
    '.........#',
    '#...o....#', // Contested frontier patrol
    '####..####', // South passage to global Tyrranus ruins (7,1)
  ],
  cache: {
    scrap: 60,
    items: [
      { itemId: 'repair_kit', count: 2 },
      { itemId: 'grail_water', count: 1 },
    ],
    toast: 'LOOTED TYRRANUS CACHE: +60 SCRAP, 2x REPAIR KITS & GRAIL WATER',
  },
};
