/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../../../types';

export const mapTyrranusGatehead: MapDefinition = {
  id: 'map_tyrranus_gatehead',
  name: 'Tyrranus Waygate Colonnade Map',
  title: 'Greco-Roman Frontier Gatehead',
  scope: 'local',
  areaId: 'tyrranus_marble_gatehead',
  biomeId: 'tyrranus_colosseum_outpost',
  description:
    'Local map unique to the Tyrranus Frontier, reachable via the Camelot Waygate or on foot across the Æther Drift Span.',
  localRoomCoords: ['7,0'],
  globalRoomSlots: [
    {
      coord: '7,1',
      globalRoomId: 'global_pillar_sanctuary',
      biomeId: 'tyrranus_colosseum_outpost',
      title: 'Imperial Marble Forum',
      bannerTitle: 'TYRRANUS FRONTIER · IMPERIAL MARBLE FORUM',
    },
  ],
  connectedMapIds: ['map_camelot_waygate_depths', 'global_aether_drift_bridge_map'],
};
