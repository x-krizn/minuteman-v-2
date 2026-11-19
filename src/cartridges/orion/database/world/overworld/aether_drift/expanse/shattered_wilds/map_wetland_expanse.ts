/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../../types';

/**
 * Canonical database definition for `globalWetlandExpanseMap` (`Procedural Wetland Expanse`, id `'global_wetland_expanse_map'`, scope `'global'`) —
 * Global procedural marshland map supplying reusable wetland, siege trench, and sinkhole room templates across bog sectors.
 */
export const globalWetlandExpanseMap: MapDefinition = {
  id: 'global_wetland_expanse_map',
  name: 'Procedural Wetland Expanse',
  title: 'Shifting Toxic Reedbeds',
  scope: 'global',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_toxic_wetlands',
  specStatus: 'LOCKED',
  docRef: 'mapping-v0.md',
  description:
    'Global procedural marshland map assembled from reusable wetland and sinkhole rooms to bridge bog sectors on foot.',
  localRoomCoords: [],
  globalRoomSlots: [],
  connectedMapIds: ['map_bog_drop_zone', 'map_deep_bog_maze', 'map_orc_siege_camp'],
};

/**
 * Canonical database definition for `globalMarshCrossingRoom` (`Wetland Crossing`, id `'global_marsh_crossing'`, coord `"global:marsh_crossing"`, scope `'global'`, safety tier `'hazard'`).
 */
export const globalMarshCrossingRoom: RoomDefinition = {
  id: 'global_marsh_crossing',
  scope: 'global',
  nodeType: 'general',
  coord: 'global:marsh_crossing',
  mapId: 'global_wetland_expanse_map',
  areaId: 'global_shattered_wilds_area',
  regionId: 'global_aether_sea_expanse',
  biomeId: 'global_toxic_wetlands',
  title: 'Wetland Crossing',
  bannerTitle: 'WETLAND CROSSING · PROCEDURAL MARSH',
  landmarkLabel: 'DROWNED TIMBER & REED SHALLOWS',
  cols: 16,
  rows: 12,
  doorDirs: ['N', 'S', 'E', 'W'],
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.58,
    cornerShadowIntensity: 0.78,
    playerVisionRadiusPx: 60,
  },
  grid: [
    '######,,,,######',
    '#,,,..~~~~..,,,#',
    '#,,P,.;;;;.,P,,#',
    '#,..;;~~~~;;..,#',
    '#,..~~~~~~~~..,#',
    ',,....::::....,,',
    ',,..E.::::....,,',
    '#,..~~~~~~~~..,#',
    '#,..;;~~~~;;..,#',
    '#,,P,.;;;;.,P,,#',
    '#,,,........,,,#',
    '######,,,,######',
  ],
};

/**
 * Canonical database definition for `globalSinkholeBridgeRoom` (`Abyssal Causeway`, id `'global_sinkhole_bridge'`, coord `"global:sinkhole_bridge"`, scope `'global'`, safety tier `'abyss'`).
 */
export const globalSinkholeBridgeRoom: RoomDefinition = {
  id: 'global_sinkhole_bridge',
  scope: 'global',
  nodeType: 'general',
  coord: 'global:sinkhole_bridge',
  mapId: 'global_wetland_expanse_map',
  areaId: 'global_shattered_wilds_area',
  regionId: 'global_aether_sea_expanse',
  biomeId: 'global_toxic_wetlands',
  title: 'Abyssal Causeway',
  bannerTitle: 'ABYSSAL CAUSEWAY · ELEVATION CROSSING',
  landmarkLabel: 'ABYSSAL SINKHOLE SPAN',
  cols: 16,
  rows: 11,
  doorDirs: ['N', 'S', 'E', 'W'],
  lighting: {
    safetyTier: 'abyss',
    ambientDarkness: 0.64,
    cornerShadowIntensity: 0.84,
    playerVisionRadiusPx: 54,
  },
  grid: [
    '######,,,,######',
    '#;;___....___;;#',
    '#;;____::____;;#',
    '#,.___::::___.,#',
    ',,...::::::...,,',
    ',,..E::::::...,,',
    ',,...::::::...,,',
    '#,.___::::___.,#',
    '#;;____::____;;#',
    '#;;___....___;;#',
    '######,,,,######',
  ],
};

/**
 * Canonical database definition for `globalOrcOutpostCorridorRoom` (`Siege Trench Approach`, id `'global_orc_outpost_corridor'`, coord `"global:orc_outpost_corridor"`, scope `'global'`, safety tier `'hazard'`).
 */
export const globalOrcOutpostCorridorRoom: RoomDefinition = {
  id: 'global_orc_outpost_corridor',
  scope: 'global',
  nodeType: 'general',
  coord: 'global:orc_outpost_corridor',
  mapId: 'global_wetland_expanse_map',
  areaId: 'm01_orc_encampment',
  regionId: 'region_belldor_outskirts',
  biomeId: 'orc_siege_encampment',
  title: 'Siege Trench Approach',
  bannerTitle: 'NOVARIN SIEGE TRENCH · ORC PATROL',
  landmarkLabel: 'FORTIFIED NOVARIN SIEGEWORKS',
  cols: 14,
  rows: 13,
  doorDirs: ['N', 'S', 'E', 'W'],
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.54,
    cornerShadowIntensity: 0.76,
    playerVisionRadiusPx: 62,
    ambientTintColor: '#f97316',
  },
  grid: [
    '#####,,,,#####',
    '#,,P,....,P,,#',
    '#,,..::::..,,#',
    '#,..~~~~~~..,#',
    '#,....o.....,#',
    '#,..::::::..,#',
    ',,..........,,',
    ',,..........,,',
    '#,..P....P..,#',
    '#,....s.....,#',
    '#,..~~~~~~..,#',
    '#,,........,,#',
    '#####,,,,#####',
  ],
};
