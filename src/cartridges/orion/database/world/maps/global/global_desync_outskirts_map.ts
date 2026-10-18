/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../../types';

export const globalDesyncOutskirtsMap: MapDefinition = {
  id: 'global_desync_outskirts_map',
  name: 'Procedural Desync Outskirts',
  title: 'Flickering Stone Arcades',
  scope: 'global',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_desync_ruins',
  description:
    'Global procedural ruins map assembled from phasing stone arcade and colonnade rooms around Border Town.',
  localRoomCoords: [],
  globalRoomSlots: [
    {
      coord: '4,1',
      globalRoomId: 'global_ruined_arcade',
      biomeId: 'global_desync_ruins',
      title: 'Southern Market Shambles',
      bannerTitle: 'SOUTHERN MARKET SHAMBLES · DESYNC OUTSKIRTS',
    },
    {
      coord: '5,-1',
      globalRoomId: 'global_pillar_sanctuary',
      biomeId: 'global_desync_ruins',
      title: 'Northern Cloister Ruins',
      bannerTitle: 'NORTHERN CLOISTER RUINS · DESYNC OUTSKIRTS',
    },
    {
      coord: '5,1',
      globalRoomId: 'global_ruined_arcade',
      biomeId: 'global_desync_ruins',
      title: 'Collapsed Cathedral Nave',
      bannerTitle: 'COLLAPSED CATHEDRAL NAVE · DESYNC OUTSKIRTS',
    },
  ],
  connectedMapIds: [
    'map_border_town_market',
    'map_border_town_barracks',
    'map_border_town_cathedral',
  ],
};
