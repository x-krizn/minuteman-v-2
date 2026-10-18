/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../../types';

export const globalWetlandExpanseMap: MapDefinition = {
  id: 'global_wetland_expanse_map',
  name: 'Procedural Wetland Expanse',
  title: 'Shifting Toxic Reedbeds',
  scope: 'global',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_toxic_wetlands',
  description:
    'Global procedural marshland map assembled from reusable wetland and sinkhole rooms to bridge bog sectors on foot.',
  localRoomCoords: [],
  globalRoomSlots: [
    {
      coord: '0,1',
      globalRoomId: 'global_marsh_crossing',
      biomeId: 'global_toxic_wetlands',
      title: 'Southern Reed Shallows',
      bannerTitle: 'SOUTHERN REED SHALLOWS · WETLAND EXPANSE',
    },
    {
      coord: '1,1',
      globalRoomId: 'global_sinkhole_bridge',
      biomeId: 'global_toxic_wetlands',
      title: 'Submerged Causeway',
      bannerTitle: 'SUBMERGED CAUSEWAY · WETLAND EXPANSE',
    },
    {
      coord: '2,-1',
      globalRoomId: 'global_marsh_crossing',
      biomeId: 'global_toxic_wetlands',
      title: 'Northern Mist Fen',
      bannerTitle: 'NORTHERN MIST FEN · WETLAND EXPANSE',
    },
  ],
  connectedMapIds: ['map_bog_drop_zone', 'map_deep_bog_maze', 'map_orc_siege_camp'],
};
