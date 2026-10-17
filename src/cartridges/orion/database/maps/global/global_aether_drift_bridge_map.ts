/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../types';

export const globalAetherDriftBridgeMap: MapDefinition = {
  id: 'global_aether_drift_bridge_map',
  name: 'Procedural Æther Drift Span',
  title: 'Tuning Crystal Causeway',
  scope: 'global',
  areaId: 'global_aether_drift_corridor_area',
  biomeId: 'global_aether_caverns',
  description:
    'Global procedural conduit map linking subterranean waygate sanctums and inter-world frontiers on foot.',
  localRoomCoords: [],
  globalRoomSlots: [
    {
      coord: '6,-1',
      globalRoomId: 'global_aether_conduit_hall',
      biomeId: 'global_aether_caverns',
      title: 'Tuning Crystal Gallery',
      bannerTitle: 'TUNING CRYSTAL GALLERY · ÆTHER DRIFT SPAN',
    },
    {
      coord: '7,1',
      globalRoomId: 'global_pillar_sanctuary',
      biomeId: 'tyrranus_colosseum_outpost',
      title: 'Imperial Aqueduct Ruins',
      bannerTitle: 'IMPERIAL AQUEDUCT RUINS · TYRRANUS OUTSKIRTS',
    },
  ],
  connectedMapIds: ['map_camelot_waygate_depths', 'map_tyrranus_gatehead'],
};
