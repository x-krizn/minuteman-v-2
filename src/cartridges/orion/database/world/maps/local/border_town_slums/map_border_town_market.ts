/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../../../types';

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
