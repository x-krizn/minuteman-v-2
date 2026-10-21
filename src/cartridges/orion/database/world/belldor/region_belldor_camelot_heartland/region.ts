/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegionDefinition } from '../../../../types';

export const regionBelldorCamelotHeartland: RegionDefinition = {
  id: 'region_belldor_camelot_heartland',
  name: 'Belldor — Camelot Border Town & Interior',
  title: 'Camelot Border Town (LOCKED) & Camelot Interior (UNDEFINED)',
  scope: 'local',
  world: 'Belldor (Camelot)',
  culture: 'Arthurian (Canon Original Story)',
  defaultBiomeId: 'camelot_border_town',
  desyncStatus: 'Drifting',
  description:
    'The contested gateway settlement of Camelot Border Town (border-town-v1.md, LOCKED) and the sealed Deep Dungeon / Camelot Interior Waygate (UNDEFINED, OD-BT-01).',
  lore:
    'Before the catastrophe, Camelot was a center of magic and governance with one of the largest waygates in the network. Now factions fight over the waygate while cities flicker between ruin and restoration.',
  localAreaIds: ['camelot_border_town', 'camelot_interior'],
  globalAreaIds: ['global_shattered_wilds_area', 'global_aether_drift_corridor_area'],
  connectedRegionIds: [
    'region_belldor_outskirts',
    'region_tyrranus_frontier',
    'global_aether_sea_expanse',
  ],
  waygate: {
    id: 'wg_camelot_sanctum',
    name: 'Camelot Interior Waygate (Sealed · OD-BT-01)',
    world: 'Belldor (Camelot)',
    regionId: 'region_belldor_camelot_heartland',
    areaId: 'camelot_interior',
    mapId: 'map_camelot_waygate_depths',
    room: '6,0',
    x: 104,
    y: 72,
    desyncStatus: 'Drifting',
    lore: 'Colossal archway of stone, root, and mineral beneath the Cathedral leading to Camelot Interior and the wider u00 Universe.',
  },
};
