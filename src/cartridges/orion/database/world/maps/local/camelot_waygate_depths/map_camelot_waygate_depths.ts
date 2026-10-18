/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../../../types';

export const mapCamelotWaygateDepths: MapDefinition = {
  id: 'map_camelot_waygate_depths',
  name: 'Camelot Waygate Sanctum Map',
  title: 'Subterranean Archway of Stone & Root',
  scope: 'local',
  areaId: 'camelot_waygate_depths',
  biomeId: 'camelot_waygate_sanctum',
  description:
    'Local map unique to the Deep Dungeon beneath Camelot Cathedral, anchoring the colossal Camelot Waygate.',
  localRoomCoords: ['6,0'],
  globalRoomSlots: [
    {
      coord: '6,-1',
      globalRoomId: 'global_aether_conduit_hall',
      biomeId: 'camelot_waygate_sanctum',
      title: 'Northern Tuning Vault',
      bannerTitle: 'WAYGATE SANCTUM · NORTHERN TUNING VAULT',
    },
  ],
  connectedMapIds: [
    'map_border_town_cathedral',
    'map_tyrranus_gatehead',
    'global_aether_drift_bridge_map',
  ],
};
