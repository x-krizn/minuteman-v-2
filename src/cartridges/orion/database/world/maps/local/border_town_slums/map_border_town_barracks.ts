/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../../../types';

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
