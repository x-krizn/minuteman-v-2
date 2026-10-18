/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegionDefinition } from '../../../../types';

export const globalAetherSeaExpanseRegion: RegionDefinition = {
  id: 'global_aether_sea_expanse',
  name: 'The Æther Drift & Shattered Wilds (Global)',
  title: 'Drifting Inter-World Expanse',
  scope: 'global',
  world: 'Shattered Worlds',
  culture: 'Unclaimed Ætheric Frontier',
  defaultBiomeId: 'global_aether_caverns',
  desyncStatus: 'Severe Desync',
  description:
    'Global procedural macro-region spanning the drifting wildlands and calcified mineral bridges between the Shattered Worlds.',
  lore:
    'After the dwarven mining operation stripped the tuning crystals, the worlds drifted out of alignment. Only pilots can walk these exposed ætheric spans unprotected.',
  localAreaIds: [],
  globalAreaIds: ['global_shattered_wilds_area', 'global_aether_drift_corridor_area'],
  connectedRegionIds: [
    'region_belldor_outskirts',
    'region_belldor_camelot_heartland',
    'region_tyrranus_frontier',
  ],
};
