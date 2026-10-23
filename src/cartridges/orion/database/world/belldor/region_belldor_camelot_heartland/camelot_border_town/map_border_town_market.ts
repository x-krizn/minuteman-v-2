/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapBorderTownMarket: MapDefinition = {
  id: 'map_border_town_market',
  name: 'Outer Perimeter & Market District',
  title: 'Spawn from the Bog & Central Hub (border-town-v1.md)',
  scope: 'local',
  areaId: 'camelot_border_town',
  biomeId: 'camelot_border_town',
  specStatus: 'LOCKED',
  docRef: 'border-town-v1.md',
  description:
    'Outer Perimeter (spawn from M00 The Bog) and the Market District central hub where buildings flicker between intact and ruined.',
  localRoomCoords: ['4,0'],
  globalRoomSlots: [
    {
      coord: '4,1',
      globalRoomId: 'global_ruined_arcade',
      biomeId: 'camelot_border_town',
      title: 'Outer Perimeter Arcade',
      bannerTitle: 'OUTER PERIMETER ARCADE',
    },
  ],
  connectedMapIds: [
    'map_deep_bog_maze',
    'map_border_town_barracks',
    'map_border_town_cathedral',
    'global_desync_outskirts_map',
  ],
  zoneFeatures: [
    { name: 'Outer Perimeter (spawn from the Bog)', status: 'LOCKED', coord: '4,0' },
    { name: 'Market District (central hub)', status: 'LOCKED', coord: '4,0' },
  ],
};

export const room40BorderTownMarket: RoomDefinition = {
  id: 'room_4_0_border_town_market',
  scope: 'local',
  coord: '4,0',
  mapId: 'map_border_town_market',
  areaId: 'camelot_border_town',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  title: 'Outer Perimeter & Market District',
  bannerTitle: 'OUTER PERIMETER & MARKET HUB',
  cols: 16,
  rows: 12,
  grid: [
    '#######::#######',
    '#:::1::::::C:::#',
    '#..P::%%%%::P..#',
    '#...::N::N::...#',
    '#..::::::::::..#',
    '::..P::N:::A..::',
    '::..P::::::::.,,',
    '#..::::::::::,,#',
    '#...::N:::::...#',
    '#..P::::::::P..#',
    '#::::::..::::::#',
    '#######::#######',
  ],
  cache: {
    scrap: 25,
    items: [
      { itemId: 'bedivere_relic', count: 1 },
      { itemId: 'grail_water', count: 1 },
    ],
    toast: 'LOOTED: +25 SCRAP, BEDIVERE RELIC (2/3) & GRAIL WATER',
  },
};
