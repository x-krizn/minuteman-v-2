/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../types';

export const tyrranusMarbleGateheadArea: AreaWikiDefinition = {
  id: 'tyrranus_marble_gatehead',
  name: 'Tyrranus — Imperial Gatehead',
  title: 'Marble Colonnade & Waygate Plaza',
  scope: 'local',
  regionId: 'region_tyrranus_frontier',
  biomeId: 'tyrranus_colosseum_outpost',
  world: 'Tyrranus',
  recommendedLevels: 'Levels 6–8',
  description:
    'Sun-bleached Greco-Roman waygate plaza on the world of Tyrranus, linked to Belldor both by Colossal Waygate signature transit and the calcified Æther Drift Span.',
  lore:
    'Belldor teaches you how to fight; Tyrranus tests whether you learned. Classical legions and drifter warbands contest the marble gatehead.',
  localMapIds: ['map_tyrranus_gatehead'],
  globalMapIds: ['global_aether_drift_bridge_map'],
  connectedAreaIds: ['camelot_waygate_depths', 'global_aether_drift_corridor_area'],
  spawnAnchor: { room: '7,0', x: 48, y: 72 },
  exitAnchor: { room: '7,0', x: 80, y: 120 },
  waystation: {
    id: 'ws_tyrranus_gatehead',
    name: 'Tyrranus Colonnade Waystation',
    regionId: 'region_tyrranus_frontier',
    areaId: 'tyrranus_marble_gatehead',
    mapId: 'map_tyrranus_gatehead',
    room: '7,0',
    x: 48,
    y: 40,
    lore: 'Imperial bronze-and-crystal anchor overlooking the Tyrranus Waygate.',
  },
};
