/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../types';

export const camelotInteriorArea: AreaWikiDefinition = {
  id: 'camelot_interior',
  name: 'CAMELOT INTERIOR',
  title: 'Next Major Zone via Waygate (worlds.md §1 · UNDEFINED)',
  scope: 'local',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_waygate_sanctum',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 5–7',
  specStatus: 'UNDEFINED',
  docRef: 'worlds.md §1 · OD-BT-01',
  openDesignId: 'OD-BT-01',
  description:
    'Next major zone of Belldor accessed via the Camelot Waygate beneath the Deep Dungeon (OD-BT-01). Currently UNDEFINED in zone documentation and sealed behind Waygate/Aether Fog locks.',
  lore:
    'At the heart of Belldor stands a waygate of stone, root, and mineral that looks more like a canyon mouth than a building. Beyond it lies the Camelot Interior.',
  localMapIds: ['map_camelot_waygate_depths'],
  globalMapIds: ['global_aether_drift_bridge_map'],
  connectedAreaIds: [
    'camelot_border_town',
    'tyrranus_marble_gatehead',
    'global_aether_drift_corridor_area',
  ],
  spawnAnchor: { room: '6,0', x: 32, y: 96 },
  exitAnchor: { room: '6,0', x: 136, y: 96 },
  waystation: {
    id: 'ws_camelot_waygate_sanctum',
    name: 'Camelot Interior Waygate Plinth (Sealed)',
    regionId: 'region_belldor_camelot_heartland',
    areaId: 'camelot_interior',
    mapId: 'map_camelot_waygate_depths',
    room: '6,0',
    x: 48,
    y: 40,
    lore: 'Subterranean calibration plinth adjacent to the Camelot Waygate (Sealed · UNDEFINED spec).',
  },
  zoneFeatures: [
    {
      name: 'Deep Dungeon',
      detail: 'UNDEFINED (OD-BT-01) → Camelot Waygate Key',
      status: 'UNDEFINED',
      openDesignId: 'OD-BT-01',
      coord: '6,0',
    },
    {
      name: 'CAMELOT INTERIOR',
      detail: 'Next major zone via waygate; no detail',
      status: 'UNDEFINED',
      coord: '6,0',
    },
  ],
};
