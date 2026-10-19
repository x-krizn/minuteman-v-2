/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapBorderTownMarket: MapDefinition = {
  id: 'map_border_town_market',
  name: 'Border Town Market District',
  title: 'Desynchronizing Market & Waystation',
  scope: 'local',
  areaId: 'border_town_slums',
  biomeId: 'camelot_border_town',
  description:
    'Local map unique to Camelot Border Town where buildings flicker between intact and ruined and scavengers trade amidst Grail Sickness.',
  localRoomCoords: ['4,0'],
  globalRoomSlots: [
    {
      coord: '4,1',
      globalRoomId: 'global_ruined_arcade',
      biomeId: 'camelot_border_town',
      title: 'Southern Shantytown Arcade',
      bannerTitle: 'BORDER TOWN · SOUTHERN SHANTYTOWN ARCADE',
    },
  ],
  connectedMapIds: [
    'map_deep_bog_maze',
    'map_border_town_barracks',
    'map_border_town_cathedral',
    'global_desync_outskirts_map',
  ],
};

export const room40BorderTownMarket: RoomDefinition = {
  id: 'room_4_0_border_town_market',
  scope: 'local',
  coord: '4,0',
  mapId: 'map_border_town_market',
  areaId: 'border_town_slums',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  title: 'Border Town Market',
  bannerTitle: 'CAMELOT BORDER TOWN · DESYNC MARKET & WAYSTATION',
  grid: [
    '####::####',
    '#::1::C::#',
    '#::%%%%::#',
    '#.:N::N:.#',
    '#..::::A:#',
    '::.P::N:::',
    '::.P::::,,',
    '#..::::,,#',
    '####::####',
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
