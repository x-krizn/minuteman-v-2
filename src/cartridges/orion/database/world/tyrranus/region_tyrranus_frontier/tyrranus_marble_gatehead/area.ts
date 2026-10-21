/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../types';

export const tyrranusMarbleGateheadArea: AreaWikiDefinition = {
  id: 'tyrranus_marble_gatehead',
  name: 'Tyrranus — Imperial Gatehead',
  title: 'Greco-Roman Frontier (worlds.md §1 · UNDEFINED)',
  scope: 'local',
  regionId: 'region_tyrranus_frontier',
  biomeId: 'tyrranus_colosseum_outpost',
  world: 'Tyrranus',
  recommendedLevels: 'Levels 6–8',
  specStatus: 'UNDEFINED',
  docRef: 'worlds.md §1, LOCKED (Zone docs UNDEFINED)',
  description:
    'Non-canon Greco-Roman world of Tyrranus (#2 Major World in u00 Universe). Zone documentation is currently UNDEFINED and sealed behind Waygate lock.',
  lore:
    'Belldor teaches you how to fight; Tyrranus tests whether you learned. Derived from Greco-Roman mythology.',
  localMapIds: ['map_tyrranus_gatehead'],
  globalMapIds: ['global_aether_drift_bridge_map'],
  connectedAreaIds: ['camelot_interior', 'global_aether_drift_corridor_area'],
  spawnAnchor: { room: '7,0', x: 72, y: 96 },
  exitAnchor: { room: '7,0', x: 112, y: 160 },
  waystation: {
    id: 'ws_tyrranus_gatehead',
    name: 'Tyrranus Colonnade Waystation (Sealed)',
    regionId: 'region_tyrranus_frontier',
    areaId: 'tyrranus_marble_gatehead',
    mapId: 'map_tyrranus_gatehead',
    room: '7,0',
    x: 72,
    y: 40,
    lore: 'Imperial bronze-and-crystal anchor overlooking the Tyrranus Waygate (Sealed · Zone docs UNDEFINED).',
  },
};
