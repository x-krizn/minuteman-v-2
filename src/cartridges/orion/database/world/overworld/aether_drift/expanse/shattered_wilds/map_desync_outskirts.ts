/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../../types';

/**
 * Canonical database definition for `globalDesyncOutskirtsMap` (`Procedural Desync Outskirts`, id `'global_desync_outskirts_map'`, scope `'global'`) —
 * Global procedural ruins map supplying phasing stone arcade and colonnade room templates around Border Town.
 */
export const globalDesyncOutskirtsMap: MapDefinition = {
  id: 'global_desync_outskirts_map',
  name: 'Procedural Desync Outskirts',
  title: 'Flickering Stone Arcades',
  scope: 'global',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_desync_ruins',
  specStatus: 'LOCKED',
  docRef: 'mapping-v0.md',
  description:
    'Global procedural ruins map assembled from phasing stone arcade and colonnade rooms around Border Town.',
  localRoomCoords: [],
  globalRoomSlots: [],
  connectedMapIds: [
    'map_border_town_market',
    'map_border_town_barracks',
    'map_border_town_cathedral',
  ],
};

/**
 * Canonical database definition for `globalPillarSanctuaryRoom` (`Collapsed Colonnade`, id `'global_pillar_sanctuary'`, coord `"global:pillar_sanctuary"`, scope `'global'`, safety tier `'trail'`).
 */
export const globalPillarSanctuaryRoom: RoomDefinition = {
  id: 'global_pillar_sanctuary',
  scope: 'global',
  nodeType: 'general',
  coord: 'global:pillar_sanctuary',
  mapId: 'global_desync_outskirts_map',
  areaId: 'global_shattered_wilds_area',
  regionId: 'global_aether_sea_expanse',
  biomeId: 'global_desync_ruins',
  title: 'Collapsed Colonnade',
  bannerTitle: 'COLLAPSED COLONNADE · SALVAGE SECTOR',
  landmarkLabel: 'SUNKEN MONASTIC PILLAR RING',
  cols: 16,
  rows: 12,
  doorDirs: ['N', 'S', 'E', 'W'],
  lighting: {
    safetyTier: 'trail',
    ambientDarkness: 0.48,
    cornerShadowIntensity: 0.7,
    playerVisionRadiusPx: 70,
  },
  grid: [
    '######,,,,######',
    '#,,P,,::::,,P,,#',
    '#,,..::::::..,,#',
    '#,..::P::P::..,#',
    '#,..:::C::::..,#',
    ',,..::::::::..,,',
    ',,..::::::::..,,',
    '#,..::P::P::..,#',
    '#,..::::::::..,#',
    '#,,P,,::::,,P,,#',
    '#,,,........,,,#',
    '######,,,,######',
  ],
};

/**
 * Canonical database definition for `globalRuinedArcadeRoom` (`Desynchronized Arcade`, id `'global_ruined_arcade'`, coord `"global:ruined_arcade"`, scope `'global'`, safety tier `'hazard'`).
 */
export const globalRuinedArcadeRoom: RoomDefinition = {
  id: 'global_ruined_arcade',
  scope: 'global',
  nodeType: 'general',
  coord: 'global:ruined_arcade',
  mapId: 'global_desync_outskirts_map',
  areaId: 'global_shattered_wilds_area',
  regionId: 'global_aether_sea_expanse',
  biomeId: 'global_desync_ruins',
  title: 'Desynchronized Arcade',
  bannerTitle: 'DESYNCHRONIZED ARCADE · PHASING MASONRY',
  landmarkLabel: 'PHASING TEMPORAL MASONRY ARCADE',
  cols: 16,
  rows: 12,
  doorDirs: ['N', 'S', 'E', 'W'],
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.56,
    cornerShadowIntensity: 0.78,
    playerVisionRadiusPx: 60,
  },
  grid: [
    '######,,,,######',
    '#,,P,,::::,,P,,#',
    '#,,..%%%%%%..,,#',
    '#,..::!:::....,#',
    '#,..::::E:::..,#',
    ',,....::::....,,',
    ',,....::::....,,',
    '#,..::P::P::..,#',
    '#,..::::::::..,#',
    '#,,P,,....,,P,,#',
    '#,,,........,,,#',
    '######,,,,######',
  ],
};
