/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../../../types';

export const mapBorderTownCathedral: MapDefinition = {
  id: 'map_border_town_cathedral',
  name: 'Border Town Cathedral District',
  title: 'Defiled Grail Altar & Dungeon Door',
  scope: 'local',
  areaId: 'border_town_slums',
  biomeId: 'camelot_border_town',
  description:
    'Local map unique to Camelot Border Town where Sir Bors guards the Three-Way Cathedral Dungeon Door.',
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
};
