/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../../types';

/**
 * Canonical database definition for `globalShatteredWildsArea` (`Shattered Wilds (Global)`, id `'global_shattered_wilds_area'`, scope `'global'`) —
 * Global procedural wildlands area assembled from wetland and desynchronized ruins maps to bridge bespoke territories on foot.
 */
export const globalShatteredWildsArea: AreaWikiDefinition = {
  id: 'global_shattered_wilds_area',
  name: 'Shattered Wilds (Global)',
  title: 'Procedural Outskirts & Reedbeds',
  scope: 'global',
  regionId: 'global_aether_sea_expanse',
  biomeId: 'global_toxic_wetlands',
  world: 'Shattered Worlds',
  recommendedLevels: 'Levels 2–5',
  specStatus: 'LOCKED',
  docRef: 'mapping-v0.md',
  description:
    'Global procedural wildlands area assembled from global wetland and desynchronized ruins maps to bridge bespoke territories on foot.',
  lore:
    'Where tuning crystals were stripped away, shifting marshlands and fractured arcades drift between settled regions.',
  localMapIds: [],
  globalMapIds: ['global_wetland_expanse_map', 'global_desync_outskirts_map'],
  connectedAreaIds: ['m00_the_bog', 'm01_orc_encampment', 'camelot_border_town'],
  spawnAnchor: { room: '0,1', x: 80, y: 72 },
  exitAnchor: { room: '4,1', x: 80, y: 72 },
};
