/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../../types';

/**
 * Canonical database definition for `mapBorderTownBarracks` (`Barracks Quarter`, id `'map_border_town_barracks'`, scope `'local'`) —
 * Barracks Quarter of Camelot Border Town patrolled by Percival, Tristan, and Bors.
 */
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
  enemySpawnTypes: {
    K: ['percival_knight', 'tristan_knight'],
  },
  localRoomCoords: ['4,-1'],
  globalRoomSlots: [
    {
      coord: '5,-1',
      globalRoomId: 'global_pillar_sanctuary',
      biomeId: 'camelot_border_town',
      title: 'Garrison Cloister Walk',
      bannerTitle: 'GARRISON CLOISTER WALK',
    },
  ],
  connectedMapIds: ['map_border_town_market', 'map_border_town_cathedral'],
  zoneFeatures: [
    { name: 'Barracks Quarter (Percival/Tristan/Bors patrols)', status: 'LOCKED', coord: '4,-1' },
  ],
};

/**
 * Canonical database definition for `room4Neg1BorderTownBarracks` (`Barracks Quarter`, id `'room_4_neg1_border_town_barracks'`, coord `"4,-1"`, scope `'local'`, safety tier `'hazard'`).
 */
export const room4Neg1BorderTownBarracks: RoomDefinition = {
  id: 'room_4_neg1_border_town_barracks',
  scope: 'local',
  nodeType: 'key',
  coord: '4,-1',
  mapId: 'map_border_town_barracks',
  areaId: 'camelot_border_town',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  title: 'Barracks Quarter',
  bannerTitle: 'BARRACKS QUARTER',
  landmarkLabel: 'CAMELOT KNIGHT GARRISON & SECRET ARMORY SWITCH',
  cols: 10,
  rows: 9,
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.52,
    cornerShadowIntensity: 0.72,
    playerVisionRadiusPx: 80,
    ambientTintColor: '#d97706',
  },
  enemySpawnTypes: {
    K: ['percival_knight', 'tristan_knight'],
  },
  routes: {
    S: { targetKeyCoord: '4,0', routeTotal: 1 },
  },
  grid: [
    '##########',
    '#..2..V..#',
    '#..K..K..#',
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
      { itemId: 'demantoid_flask', count: 2 },
    ],
    toast: 'LOOTED: +30 SCRAP, BEDIVERE RELIC (3/3) & DEMANTOID FLASKS',
  },
};
