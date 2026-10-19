/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapOrcSiegeCamp: MapDefinition = {
  id: 'map_orc_siege_camp',
  name: 'Novarin Siege Staging Grounds',
  title: 'Orc Encampment & War Horn Palisade',
  scope: 'local',
  areaId: 'orc_siege_encampment',
  biomeId: 'orc_siege_encampment',
  description:
    'Local map unique to the Orc Siege Encampment where Novarin raiders muster war horns against Border Town.',
  localRoomCoords: ['3,1'],
  globalRoomSlots: [
    {
      coord: '2,1',
      globalRoomId: 'global_orc_outpost_corridor',
      biomeId: 'orc_siege_encampment',
      title: 'Western Siege Trench',
      bannerTitle: 'WESTERN SIEGE TRENCH · ORC ENCAMPMENT',
    },
  ],
  connectedMapIds: ['map_deep_bog_maze', 'global_wetland_expanse_map'],
};

export const room31OrcEncampmentSiege: RoomDefinition = {
  id: 'room_3_1_orc_encampment_siege',
  scope: 'local',
  coord: '3,1',
  mapId: 'map_orc_siege_camp',
  areaId: 'orc_siege_encampment',
  regionId: 'region_belldor_outskirts',
  biomeId: 'orc_siege_encampment',
  title: 'Novarin Orc Siege Camp',
  bannerTitle: 'ORC SIEGE ENCAMPMENT · WAR HORN MUSTER & WAYSTATION',
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
      { itemId: 'repair_kit', count: 1 },
    ],
    toast: 'LOOTED SIEGE CACHE: +40 SCRAP, 2x ORC WAR PAINT & REPAIR KIT',
  },
};
