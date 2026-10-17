/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

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
    '####..####', // North passage back to Bog Perimeter (3,0)
    '#..A..C..#', // Æther Waystation (A) & Siege Supply Cache (C)
    '#..P..P..#',
    '#...o....#', // Orc Pair staging raids
    '#..~~~~..#',
    '.........#', // West passage to global siege trench (2,1)
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
