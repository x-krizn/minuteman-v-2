/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../types';

export const camelotWaygateDepthsArea: AreaWikiDefinition = {
  id: 'camelot_waygate_depths',
  name: 'Deep Dungeon & Camelot Waygate',
  title: 'Subterranean Waygate Sanctum',
  scope: 'local',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_waygate_sanctum',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 5–7',
  description:
    'Ancient vault beneath the Cathedral Dungeon Door housing the colossal Camelot Waygate and the foot-bridge across the ætheric drift.',
  lore:
    'At the heart of Belldor stands a waygate of stone, root, and mineral that looks more like a canyon mouth than a building. Walk through, and it reads your ætheric signature.',
  localMapIds: ['map_camelot_waygate_depths'],
  globalMapIds: ['global_aether_drift_bridge_map'],
  connectedAreaIds: [
    'border_town_slums',
    'tyrranus_marble_gatehead',
    'global_aether_drift_corridor_area',
  ],
  spawnAnchor: { room: '6,0', x: 32, y: 96 },
  exitAnchor: { room: '6,0', x: 136, y: 96 },
  waystation: {
    id: 'ws_camelot_waygate_sanctum',
    name: 'Waygate Sanctum Plinth',
    regionId: 'region_belldor_camelot_heartland',
    areaId: 'camelot_waygate_depths',
    mapId: 'map_camelot_waygate_depths',
    room: '6,0',
    x: 48,
    y: 40,
    lore: 'Subterranean calibration plinth adjacent to the colossal Camelot Waygate.',
  },
};
