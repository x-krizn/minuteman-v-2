/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapBorderTownCathedral: MapDefinition = {
  id: 'map_border_town_cathedral',
  name: 'Cathedral District & Dungeon Entrance',
  title: 'Lore Zone & Deep Dungeon Entrance (border-town-v1.md)',
  scope: 'local',
  areaId: 'camelot_border_town',
  biomeId: 'camelot_border_town',
  specStatus: 'LOCKED',
  docRef: 'border-town-v1.md',
  openDesignId: 'OD-BT-01',
  description:
    'Cathedral District lore zone and Dungeon Entrance guarded by Sir Bors. Leads toward the Deep Dungeon (UNDEFINED: OD-BT-01) and the Camelot Waygate Key.',
  localRoomCoords: ['5,0'],
  globalRoomSlots: [
    {
      coord: '5,1',
      globalRoomId: 'global_ruined_arcade',
      biomeId: 'camelot_border_town',
      title: 'Shattered Bellfry Nave',
      bannerTitle: 'CATHEDRAL DISTRICT · SHATTERED BELLFRY NAVE',
    },
  ],
  connectedMapIds: [
    'map_border_town_market',
    'map_border_town_barracks',
    'map_camelot_waygate_depths',
  ],
  zoneFeatures: [
    { name: 'Cathedral District (lore zone)', status: 'LOCKED', coord: '5,0' },
    {
      name: 'Dungeon Entrance → Deep Dungeon (OD-BT-01) → Camelot Waygate Key',
      status: 'UNDEFINED',
      openDesignId: 'OD-BT-01',
      coord: '5,0',
    },
  ],
};

export const room50BorderTownCathedral: RoomDefinition = {
  id: 'room_5_0_border_town_cathedral',
  scope: 'local',
  coord: '5,0',
  mapId: 'map_border_town_cathedral',
  areaId: 'camelot_border_town',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  title: 'Cathedral District & Dungeon Entrance',
  bannerTitle: 'CATHEDRAL DISTRICT · SIR BORS & DUNGEON ENTRANCE (OD-BT-01)',
  grid: [
    '####..####',
    '#..3..C..#',
    '#..P..P..#',
    '#...B....#',
    '#........#',
    '.......M..',
    '.......M..',
    '#........#',
    '####..####',
  ],
  cache: {
    scrap: 35,
    items: [{ itemId: 'dungeon_key', count: 1 }],
    toast: 'LOOTED CATHEDRAL RELIQUARY: +35 SCRAP & CAMELOT WAYGATE KEY',
  },
};
