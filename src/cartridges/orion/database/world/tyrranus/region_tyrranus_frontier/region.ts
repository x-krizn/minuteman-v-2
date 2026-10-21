/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegionDefinition } from '../../../../types';

export const regionTyrranusFrontier: RegionDefinition = {
  id: 'region_tyrranus_frontier',
  name: 'Tyrranus — Imperial Waygate Frontier',
  title: 'Greco-Roman Colonnade & Gatehead',
  scope: 'local',
  world: 'Tyrranus',
  culture: 'Greek and Roman',
  defaultBiomeId: 'tyrranus_colosseum_outpost',
  desyncStatus: 'Synchronized',
  description:
    'The marble frontier of Tyrranus where classical legions hold the other side of the Camelot Waygate alignment.',
  lore:
    'One of the major worlds in the waygate network. Its marble forums and bronze siege works test whether pilots learned the lessons of Belldor.',
  localAreaIds: ['tyrranus_marble_gatehead'],
  globalAreaIds: ['global_aether_drift_corridor_area'],
  connectedRegionIds: ['region_belldor_camelot_heartland', 'global_aether_sea_expanse'],
  waygate: {
    id: 'wg_tyrranus_colonnade',
    name: 'Tyrranus Colossal Waygate',
    world: 'Tyrranus',
    regionId: 'region_tyrranus_frontier',
    areaId: 'tyrranus_marble_gatehead',
    mapId: 'map_tyrranus_gatehead',
    room: '7,0',
    x: 104,
    y: 72,
    desyncStatus: 'Synchronized',
    lore: 'Marble-crowned archway at the heart of the Tyrranus Gatehead, aligned with the Belldor ætheric current.',
  },
};
