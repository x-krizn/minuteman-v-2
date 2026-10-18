/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../types';

export const globalAetherDriftCorridorArea: AreaWikiDefinition = {
  id: 'global_aether_drift_corridor_area',
  name: 'Æther Drift Corridor (Global)',
  title: 'Inter-World Tuning Span',
  scope: 'global',
  regionId: 'global_aether_sea_expanse',
  biomeId: 'global_aether_caverns',
  world: 'Shattered Worlds',
  recommendedLevels: 'Levels 5–8',
  description:
    'Global procedural conduit area linking waygate sanctums and adjacent worlds via crystalline root-bridges.',
  lore:
    'Pilots immune to raw æther can walk the calcified mineral bridges that still tether neighboring worlds together.',
  localMapIds: [],
  globalMapIds: ['global_aether_drift_bridge_map'],
  connectedAreaIds: ['camelot_waygate_depths', 'tyrranus_marble_gatehead'],
  spawnAnchor: { room: '6,-1', x: 80, y: 72 },
  exitAnchor: { room: '7,1', x: 80, y: 72 },
};
