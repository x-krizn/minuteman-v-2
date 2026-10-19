/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapCamelotWaygateDepths: MapDefinition = {
  id: 'map_camelot_waygate_depths',
  name: 'Deep Dungeon & Camelot Interior Waygate',
  title: 'Deep Dungeon (OD-BT-01) & Camelot Interior Threshold (UNDEFINED)',
  scope: 'local',
  areaId: 'camelot_interior',
  biomeId: 'camelot_waygate_sanctum',
  specStatus: 'UNDEFINED',
  docRef: 'border-town-v1.md · worlds.md §1',
  openDesignId: 'OD-BT-01',
  description:
    'Deep Dungeon (OD-BT-01) and Camelot Interior Waygate threshold. Currently UNDEFINED in zone docs and sealed in-game.',
  localRoomCoords: ['6,0'],
  globalRoomSlots: [
    {
      coord: '6,-1',
      globalRoomId: 'global_aether_conduit_hall',
      biomeId: 'camelot_waygate_sanctum',
      title: 'Northern Tuning Vault',
      bannerTitle: 'CAMELOT INTERIOR · NORTHERN TUNING VAULT',
    },
  ],
  connectedMapIds: [
    'map_border_town_cathedral',
    'map_tyrranus_gatehead',
    'global_aether_drift_bridge_map',
  ],
  zoneFeatures: [
    {
      name: 'Deep Dungeon',
      detail: 'UNDEFINED (OD-BT-01) → Camelot Waygate Key',
      status: 'UNDEFINED',
      openDesignId: 'OD-BT-01',
      coord: '6,0',
    },
    {
      name: 'CAMELOT INTERIOR',
      detail: 'Next major zone via waygate; no detail',
      status: 'UNDEFINED',
      coord: '6,0',
    },
  ],
};

export const room60WaygateSanctum: RoomDefinition = {
  id: 'room_6_0_waygate_sanctum',
  scope: 'local',
  coord: '6,0',
  mapId: 'map_camelot_waygate_depths',
  areaId: 'camelot_interior',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_waygate_sanctum',
  title: 'Deep Dungeon & Camelot Interior (Sealed)',
  bannerTitle: 'CAMELOT INTERIOR · DEEP DUNGEON & WAYGATE (UNDEFINED · OD-BT-01)',
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
