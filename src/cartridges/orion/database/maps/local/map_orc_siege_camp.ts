/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../types';

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
