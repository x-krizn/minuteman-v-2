/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapBorderTownBarracks: MapDefinition = {
  id: 'map_border_town_barracks',
  name: 'Barracks Quarter',
  title: 'Percival / Tristan / Bors Patrols (border-town-v1.md)',
  scope: 'local',
  areaId: 'camelot_border_town',
  biomeId: 'camelot_border_town',
  specStatus: 'LOCKED',
  docRef: 'border-town-v1.md',
  description:
    'Barracks Quarter of Camelot Border Town patrolled by Percival, Tristan, and Bors.',
  localRoomCoords: ['4,-1'],
  globalRoomSlots: [
    {
      coord: '5,-1',
      globalRoomId: 'global_pillar_sanctuary',
      biomeId: 'camelot_border_town',
      title: 'Garrison Cloister Walk',
      bannerTitle: 'CAMELOT BORDER TOWN · GARRISON CLOISTER WALK',
    },
  ],
  connectedMapIds: ['map_border_town_market', 'map_border_town_cathedral'],
  zoneFeatures: [
    { name: 'Barracks Quarter (Percival/Tristan/Bors patrols)', status: 'LOCKED', coord: '4,-1' },
  ],
};

export const room4Neg1BorderTownBarracks: RoomDefinition = {
  id: 'room_4_neg1_border_town_barracks',
  scope: 'local',
  coord: '4,-1',
  mapId: 'map_border_town_barracks',
  areaId: 'camelot_border_town',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  title: 'Barracks Quarter',
  bannerTitle: 'CAMELOT BORDER TOWN · BARRACKS QUARTER (PERCIVAL & TRISTAN)',
  grid: [
    '##########',
    '#..2..V..#',
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
