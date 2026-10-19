/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapBorderTownBarracks: MapDefinition = {
  id: 'map_border_town_barracks',
  name: 'Border Town Barracks Quarter',
  title: 'Garrison Holdout of Percival & Tristan',
  scope: 'local',
  areaId: 'border_town_slums',
  biomeId: 'camelot_border_town',
  description:
    'Local map unique to Camelot Border Town housing the fortified knight garrison and secret armory switch.',
  localRoomCoords: ['4,-1'],
  globalRoomSlots: [
    {
      coord: '5,-1',
      globalRoomId: 'global_pillar_sanctuary',
      biomeId: 'camelot_border_town',
      title: 'Garrison Cloister Walk',
      bannerTitle: 'BORDER TOWN · GARRISON CLOISTER WALK',
    },
  ],
  connectedMapIds: ['map_border_town_market', 'map_border_town_cathedral'],
};

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
    '#..2..C..#',
    '#..K..T..#',
    '#........#',
    '#...o....#',
    '#..P..P...',
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
