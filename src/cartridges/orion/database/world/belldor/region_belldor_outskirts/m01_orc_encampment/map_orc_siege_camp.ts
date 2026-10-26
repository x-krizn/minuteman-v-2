/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapOrcSiegeCamp: MapDefinition = {
  id: 'map_orc_siege_camp',
  name: 'M01 Orc Encampment Map',
  title: 'Orc Encampment (mapping-v0.md · UNDEFINED)',
  scope: 'local',
  areaId: 'm01_orc_encampment',
  biomeId: 'orc_siege_encampment',
  specStatus: 'UNDEFINED',
  docRef: 'mapping-v0.md',
  description:
    'M01 Orc Encampment sector (UNDEFINED in mapping-v0.md). Sealed behind an Aether Fog boundary during active traversal.',
  localRoomCoords: ['3,1'],
  globalRoomSlots: [],
  connectedMapIds: ['map_deep_bog_maze', 'global_wetland_expanse_map'],
  zoneFeatures: [
    {
      name: 'M01 ORC ENCAMPMENT',
      detail: 'UNDEFINED (mapping-v0.md)',
      status: 'UNDEFINED',
      coord: '3,1',
    },
  ],
};

export const room31OrcEncampmentSiege: RoomDefinition = {
  id: 'room_3_1_orc_encampment_siege',
  scope: 'local',
  coord: '3,1',
  mapId: 'map_orc_siege_camp',
  areaId: 'm01_orc_encampment',
  regionId: 'region_belldor_outskirts',
  biomeId: 'orc_siege_encampment',
  title: 'M01 Orc Encampment (Sealed)',
  bannerTitle: 'M01 ORC ENCAMPMENT · UNDEFINED SPEC (mapping-v0.md)',
  grid: [
    '####..####',
    '#..A..C..#',
    '#..P..P..#',
    '#...o....#',
    '#..~~~~..#',
    '.........#',
    '.........#',
    '#........#',
    '##########',
  ],
  cache: {
    scrap: 40,
    items: [
      { itemId: 'orc_war_paint', count: 2 },
      { itemId: 'demantoid_flask', count: 1 },
    ],
    toast: 'LOOTED SIEGE CACHE: +40 SCRAP, 2x ORC WAR PAINT & DEMANTOID FLASK',
  },
};
