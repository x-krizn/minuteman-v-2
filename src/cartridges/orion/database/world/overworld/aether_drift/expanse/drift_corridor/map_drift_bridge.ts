/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../../types';

/**
 * Canonical database definition for `globalAetherDriftBridgeMap` (`Procedural Æther Drift Span`, id `'global_aether_drift_bridge_map'`, scope `'global'`) —
 * Global procedural conduit map supplying crystalline tuning-conduit room templates between subterranean waygate sanctums and inter-world frontiers.
 */
export const globalAetherDriftBridgeMap: MapDefinition = {
  id: 'global_aether_drift_bridge_map',
  name: 'Procedural Æther Drift Span',
  title: 'Tuning Crystal Causeway',
  scope: 'global',
  areaId: 'global_aether_drift_corridor_area',
  biomeId: 'global_aether_caverns',
  specStatus: 'LOCKED',
  docRef: 'mapping-v0.md',
  description:
    'Global procedural conduit map linking subterranean waygate sanctums and inter-world frontiers on foot.',
  localRoomCoords: [],
  globalRoomSlots: [],
  connectedMapIds: ['map_camelot_waygate_depths', 'map_tyrranus_gatehead'],
};

/**
 * Canonical database definition for `globalAetherConduitHallRoom` (`Ætheric Tuning Conduit`, id `'global_aether_conduit_hall'`, coord `"global:aether_conduit_hall"`, scope `'global'`, safety tier `'hazard'`).
 */
export const globalAetherConduitHallRoom: RoomDefinition = {
  id: 'global_aether_conduit_hall',
  scope: 'global',
  nodeType: 'general',
  coord: 'global:aether_conduit_hall',
  mapId: 'global_aether_drift_bridge_map',
  areaId: 'global_aether_drift_corridor_area',
  regionId: 'global_aether_sea_expanse',
  biomeId: 'global_aether_caverns',
  title: 'Ætheric Tuning Conduit',
  bannerTitle: 'ÆTHERIC TUNING CONDUIT · DRIFT BRIDGE',
  landmarkLabel: 'CRYSTALLINE TUNING SPAN',
  cols: 16,
  rows: 11,
  doorDirs: ['N', 'S', 'E', 'W'],
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.56,
    cornerShadowIntensity: 0.78,
    playerVisionRadiusPx: 64,
    ambientTintColor: '#22d3ee',
  },
  grid: [
    '######,,,,######',
    '#..P..~~~~..P..#',
    '#..~~~~~~~~~~..#',
    '#,..::::::::..,#',
    ',,..::P::P::..,,',
    '::::::....::::::',
    ',,..::P::P::..,,',
    '#,..::::::::..,#',
    '#..~~~~~~~~~~..#',
    '#..P..~~~~..P..#',
    '######,,,,######',
  ],
};
