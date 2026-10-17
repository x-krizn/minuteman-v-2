/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegionDefinition } from '../../../types';

export const regionBelldorCamelotHeartland: RegionDefinition = {
  id: 'region_belldor_camelot_heartland',
  name: 'Belldor — Camelot Border Town & Sanctum',
  title: 'Contested Districts & Colossal Waygate',
  scope: 'local',
  world: 'Belldor (Camelot)',
  culture: 'Arthurian Knights & Grail Mythology',
  defaultBiomeId: 'camelot_border_town',
  desyncStatus: 'Drifting',
  description:
    'The contested gateway settlement of Camelot and the subterranean Cathedral sanctum housing the Camelot Waygate.',
  lore:
    'Before the catastrophe, Camelot was a center of magic and governance with one of the largest waygates in the network. Now factions fight over the waygate while cities flicker between ruin and restoration.',
  localAreaIds: ['border_town_slums', 'camelot_waygate_depths'],
  globalAreaIds: ['global_shattered_wilds_area', 'global_aether_drift_corridor_area'],
  connectedRegionIds: [
    'region_belldor_outskirts',
    'region_tyrranus_frontier',
    'global_aether_sea_expanse',
  ],
  waygate: {
    id: 'wg_camelot_sanctum',
    name: 'Camelot Colossal Waygate',
    world: 'Belldor (Camelot)',
    regionId: 'region_belldor_camelot_heartland',
    areaId: 'camelot_waygate_depths',
    mapId: 'map_camelot_waygate_depths',
    room: '6,0',
    x: 80,
    y: 56,
    desyncStatus: 'Drifting',
    lore: 'Colossal archway of stone, root, and mineral beneath the Cathedral. Reads your ætheric signature to carry you across worlds.',
  },
};
