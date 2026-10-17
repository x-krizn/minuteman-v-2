/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegionDefinition } from '../../../types';

export const regionBelldorOutskirts: RegionDefinition = {
  id: 'region_belldor_outskirts',
  name: 'Belldor — Toxic Marshes & Siege Outskirts',
  title: 'Drowned Marshes & Novarin Encampment',
  scope: 'local',
  world: 'Belldor (Camelot)',
  culture: 'Arthurian Knights & Grail Mythology',
  defaultBiomeId: 'belldor_bog',
  desyncStatus: 'Drifting',
  description:
    'The outer marshlands of Belldor where drop-pod pilots land and Novarin orc raiders stage war-horn assaults.',
  lore:
    'A drowned maze of fallen trees, corrosive bog water, and ruined monastery pylons bordering the contested settlement of Camelot.',
  localAreaIds: ['m00_the_bog', 'orc_siege_encampment'],
  globalAreaIds: ['global_shattered_wilds_area'],
  connectedRegionIds: ['region_belldor_camelot_heartland', 'global_aether_sea_expanse'],
};
