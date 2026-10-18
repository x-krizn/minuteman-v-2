/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../../types';

export const room60WaygateSanctum: RoomDefinition = {
  id: 'room_6_0_waygate_sanctum',
  scope: 'local',
  coord: '6,0',
  mapId: 'map_camelot_waygate_depths',
  areaId: 'camelot_waygate_depths',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_waygate_sanctum',
  title: 'Camelot Waygate Sanctum',
  bannerTitle: 'DEEP DUNGEON SANCTUM · COLOSSAL CAMELOT WAYGATE',
  grid: [
    '####..####', // North passage to global tuning cavern (6,-1)
    '#..A..C..#', // Sanctum Æther Waystation (A) & Tuning Cache (C)
    '#..P..P..#',
    '#....Q...#', // Colossal Camelot Waygate (Q) — reads pilot's ætheric signature
    '#........#',
    '..........', // West to Cathedral (5,0), East on foot across Æther Drift Span to Tyrranus (7,0)
    '..........',
    '#..P..P..#',
    '##########',
  ],
  cache: {
    scrap: 50,
    items: [
      { itemId: 'grail_water', count: 2 },
      { itemId: 'corrupted_shard', count: 2 },
    ],
    toast: 'LOOTED WAYGATE VAULT: +50 SCRAP, 2x GRAIL WATER & 2x SHARDS',
  },
};
