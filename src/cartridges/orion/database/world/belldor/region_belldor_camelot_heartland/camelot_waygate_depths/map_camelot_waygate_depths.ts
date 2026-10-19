/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapCamelotWaygateDepths: MapDefinition = {
  id: 'map_camelot_waygate_depths',
  name: 'Camelot Waygate Sanctum Map',
  title: 'Subterranean Archway of Stone & Root',
  scope: 'local',
  areaId: 'camelot_waygate_depths',
  biomeId: 'camelot_waygate_sanctum',
  description:
    'Local map unique to the Deep Dungeon beneath Camelot Cathedral, anchoring the colossal Camelot Waygate.',
  localRoomCoords: ['6,0'],
  globalRoomSlots: [
    {
      coord: '6,-1',
      globalRoomId: 'global_aether_conduit_hall',
      biomeId: 'camelot_waygate_sanctum',
      title: 'Northern Tuning Vault',
      bannerTitle: 'WAYGATE SANCTUM · NORTHERN TUNING VAULT',
    },
  ],
  connectedMapIds: [
    'map_border_town_cathedral',
    'map_tyrranus_gatehead',
    'global_aether_drift_bridge_map',
  ],
};

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
    '####..####',
    '#..A..C..#',
    '#..P..P..#',
    '#....Q...#',
    '#........#',
    '..........',
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
