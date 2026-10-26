/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AreaWikiDefinition,
  BiomeDefinition,
  MapDefinition,
  RegionDefinition,
  RoomDefinition,
} from '../../../types';

const DEFAULT_TILE_TYPES: Record<string, string> = {
  '.': 'floor',
  ',': 'grass',
  ':': 'ruins_floor',
  ';': 'mire_floor',
  '#': 'pylon_wall',
  P: 'pylon_pillar',
  '~': 'mud',
  _: 'chasm',
  D: 'drop_pod',
  S: 'fallen_scout',
  C: 'cache',
  V: 'chest',
  G: 'rusted_gate',
  '%': 'desync_wall',
  L: 'poe_lantern',
  '1': 'hidden_switch_1',
  '2': 'hidden_switch_2',
  '3': 'hidden_switch_3',
  '!': 'toggle_switch',
  M: 'cathedral_door',
  A: 'aether_waystation',
  Q: 'colossal_waygate',
};

// ─── GLOBAL BIOMES ───────────────────────────────────────────────────────────

export const globalAetherCavernsBiome: BiomeDefinition = {
  id: 'global_aether_caverns',
  name: 'Ætheric Drift Caverns (Global)',
  scope: 'global',
  world: 'Sea of Æther',
  description:
    'Crystalline inter-world drift caverns saturated with luminous æther currents and high-corrosion pools.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'dirt',
  tileTypes: { ...DEFAULT_TILE_TYPES },
  tileRules: {
    corrosiveWater: true,
    corrosiveDamagePerSec: 6.0,
    mudSlowMultiplier: 0.6,
    desyncPeriodSec: 3.0,
    aetherMistDensity: 0.8,
  },
  tileAssets: {
    groundPrimary: '#192538',
    groundSecondary: '#131d2d',
    mudColor: '#0e1624',
    waterColor: '#083344',
    waterRippleColor: '#06b6d4',
    pylonTop: '#0284c7',
    pylonFront: '#0f172a',
    pylonTrim: '#38bdf8',
    shadow: 'rgba(0, 0, 0, 0.5)',
    lightColor: '#22d3ee',
  },
  lightColor: '#22d3ee',
};

export const globalDesyncRuinsBiome: BiomeDefinition = {
  id: 'global_desync_ruins',
  name: 'Desynchronized Stone Ruins (Global)',
  scope: 'global',
  world: 'Shattered Worlds',
  description:
    'Procedural ruined masonry biome with rapid temporal wall phasing and ancient stone flagstones.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'ruins',
  tileTypes: { ...DEFAULT_TILE_TYPES },
  tileRules: {
    corrosiveWater: false,
    corrosiveDamagePerSec: 0,
    mudSlowMultiplier: 0.75,
    desyncPeriodSec: 2.8,
    aetherMistDensity: 0.45,
  },
  tileAssets: {
    groundPrimary: '#2a303c',
    groundSecondary: '#222731',
    mudColor: '#1a1e26',
    waterColor: '#1e293b',
    waterRippleColor: '#334155',
    pylonTop: '#64748b',
    pylonFront: '#334155',
    pylonTrim: '#94a3b8',
    shadow: 'rgba(0, 0, 0, 0.45)',
    lightColor: '#cbd5e1',
  },
  lightColor: '#cbd5e1',
};

export const globalToxicWetlandsBiome: BiomeDefinition = {
  id: 'global_toxic_wetlands',
  name: 'Toxic MarshWilds (Global)',
  scope: 'global',
  world: 'Shattered Worlds',
  description:
    'Procedural marshland biome supplying corrosive bog water, mud drag rules, and overgrown pylon assets to global wetland rooms.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'grass',
  tileTypes: { ...DEFAULT_TILE_TYPES },
  tileRules: {
    corrosiveWater: true,
    corrosiveDamagePerSec: 4.5,
    mudSlowMultiplier: 0.65,
    desyncPeriodSec: 4.0,
    aetherMistDensity: 0.4,
  },
  tileAssets: {
    groundPrimary: '#23313f',
    groundSecondary: '#1c2733',
    mudColor: '#152028',
    waterColor: '#132a38',
    waterRippleColor: '#24485c',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    pylonTrim: '#64748b',
    shadow: 'rgba(0, 0, 0, 0.4)',
    lightColor: '#67e8f9',
  },
  lightColor: '#67e8f9',
};

// ─── GLOBAL REGIONS & AREAS ──────────────────────────────────────────────────

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

export const globalAetherDriftCorridorArea: AreaWikiDefinition = {
  id: 'global_aether_drift_corridor_area',
  name: 'Æther Drift Corridor (Global)',
  title: 'Inter-World Tuning Span',
  scope: 'global',
  regionId: 'global_aether_sea_expanse',
  biomeId: 'global_aether_caverns',
  world: 'Shattered Worlds',
  recommendedLevels: 'Levels 5–8',
  description:
    'Global procedural conduit area linking waygate sanctums and adjacent worlds via crystalline root-bridges.',
  lore:
    'Pilots immune to raw æther can walk the calcified mineral bridges that still tether neighboring worlds together.',
  localMapIds: [],
  globalMapIds: ['global_aether_drift_bridge_map'],
  connectedAreaIds: ['camelot_interior', 'tyrranus_marble_gatehead'],
  spawnAnchor: { room: '6,-1', x: 80, y: 72 },
  exitAnchor: { room: '7,1', x: 80, y: 72 },
};

export const globalShatteredWildsArea: AreaWikiDefinition = {
  id: 'global_shattered_wilds_area',
  name: 'Shattered Wilds (Global)',
  title: 'Procedural Outskirts & Reedbeds',
  scope: 'global',
  regionId: 'global_aether_sea_expanse',
  biomeId: 'global_toxic_wetlands',
  world: 'Shattered Worlds',
  recommendedLevels: 'Levels 2–5',
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

// ─── GLOBAL MAPS & ROOM TEMPLATES ────────────────────────────────────────────

export const globalAetherDriftBridgeMap: MapDefinition = {
  id: 'global_aether_drift_bridge_map',
  name: 'Procedural Æther Drift Span',
  title: 'Tuning Crystal Causeway',
  scope: 'global',
  areaId: 'global_aether_drift_corridor_area',
  biomeId: 'global_aether_caverns',
  description:
    'Global procedural conduit map linking subterranean waygate sanctums and inter-world frontiers on foot.',
  localRoomCoords: [],
  globalRoomSlots: [
    {
      coord: '6,-1',
      globalRoomId: 'global_aether_conduit_hall',
      biomeId: 'global_aether_caverns',
      title: 'Tuning Crystal Gallery',
      bannerTitle: 'TUNING CRYSTAL GALLERY · ÆTHER DRIFT SPAN',
    },
    {
      coord: '7,1',
      globalRoomId: 'global_pillar_sanctuary',
      biomeId: 'tyrranus_colosseum_outpost',
      title: 'Imperial Aqueduct Ruins',
      bannerTitle: 'IMPERIAL AQUEDUCT RUINS · TYRRANUS OUTSKIRTS',
    },
  ],
  connectedMapIds: ['map_camelot_waygate_depths', 'map_tyrranus_gatehead'],
};

export const globalDesyncOutskirtsMap: MapDefinition = {
  id: 'global_desync_outskirts_map',
  name: 'Procedural Desync Outskirts',
  title: 'Flickering Stone Arcades',
  scope: 'global',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_desync_ruins',
  description:
    'Global procedural ruins map assembled from phasing stone arcade and colonnade rooms around Border Town.',
  localRoomCoords: [],
  globalRoomSlots: [
    {
      coord: '4,1',
      globalRoomId: 'global_ruined_arcade',
      biomeId: 'global_desync_ruins',
      title: 'Southern Market Shambles',
      bannerTitle: 'SOUTHERN MARKET SHAMBLES · DESYNC OUTSKIRTS',
    },
    {
      coord: '5,-1',
      globalRoomId: 'global_pillar_sanctuary',
      biomeId: 'global_desync_ruins',
      title: 'Northern Cloister Ruins',
      bannerTitle: 'NORTHERN CLOISTER RUINS · DESYNC OUTSKIRTS',
    },
    {
      coord: '5,1',
      globalRoomId: 'global_ruined_arcade',
      biomeId: 'global_desync_ruins',
      title: 'Collapsed Cathedral Nave',
      bannerTitle: 'COLLAPSED CATHEDRAL NAVE · DESYNC OUTSKIRTS',
    },
  ],
  connectedMapIds: [
    'map_border_town_market',
    'map_border_town_barracks',
    'map_border_town_cathedral',
  ],
};

export const globalWetlandExpanseMap: MapDefinition = {
  id: 'global_wetland_expanse_map',
  name: 'Procedural Wetland Expanse',
  title: 'Shifting Toxic Reedbeds',
  scope: 'global',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_toxic_wetlands',
  description:
    'Global procedural marshland map assembled from reusable wetland and sinkhole rooms to bridge bog sectors on foot.',
  localRoomCoords: [],
  globalRoomSlots: [
    {
      coord: '0,1',
      globalRoomId: 'global_marsh_crossing',
      biomeId: 'global_toxic_wetlands',
      title: 'Southern Reed Shallows',
      bannerTitle: 'SOUTHERN REED SHALLOWS · WETLAND EXPANSE',
    },
    {
      coord: '1,1',
      globalRoomId: 'global_sinkhole_bridge',
      biomeId: 'global_toxic_wetlands',
      title: 'Submerged Causeway',
      bannerTitle: 'SUBMERGED CAUSEWAY · WETLAND EXPANSE',
    },
    {
      coord: '2,-1',
      globalRoomId: 'global_marsh_crossing',
      biomeId: 'global_toxic_wetlands',
      title: 'Northern Mist Fen',
      bannerTitle: 'NORTHERN MIST FEN · WETLAND EXPANSE',
    },
  ],
  connectedMapIds: ['map_bog_drop_zone', 'map_deep_bog_maze', 'map_orc_siege_camp'],
};

export const globalAetherConduitHallRoom: RoomDefinition = {
  id: 'global_aether_conduit_hall',
  scope: 'global',
  coord: 'global:aether_conduit_hall',
  areaId: 'global_aether_drift_corridor_area',
  biomeId: 'global_aether_caverns',
  title: 'Ætheric Tuning Conduit',
  bannerTitle: 'ÆTHERIC TUNING CONDUIT · DRIFT BRIDGE',
  landmarkLabel: 'CRYSTALLINE TUNING SPAN',
  doorDirs: ['N', 'S', 'E', 'W'],
  cols: 16,
  rows: 11,
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.56,
    cornerShadowIntensity: 0.78,
    playerVisionRadiusPx: 64,
    ambientTintColor: '#22d3ee',
  },
  grid: [
    '######,,,,######',
    '#..P..~~~~..P..#',
    '#..~~~~~~~~~~..#',
    '#,..::::::::..,#',
    ',,..::P::P::..,,',
    '::::::....::::::',
    ',,..::P::P::..,,',
    '#,..::::::::..,#',
    '#..~~~~~~~~~~..#',
    '#..P..~~~~..P..#',
    '######,,,,######',
  ],
};

export const globalMarshCrossingRoom: RoomDefinition = {
  id: 'global_marsh_crossing',
  scope: 'global',
  coord: 'global:marsh_crossing',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_toxic_wetlands',
  title: 'Wetland Crossing',
  bannerTitle: 'WETLAND CROSSING · PROCEDURAL MARSH',
  landmarkLabel: 'DROWNED TIMBER & REED SHALLOWS',
  doorDirs: ['N', 'S', 'E', 'W'],
  cols: 16,
  rows: 12,
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

export const globalOrcOutpostCorridorRoom: RoomDefinition = {
  id: 'global_orc_outpost_corridor',
  scope: 'global',
  coord: 'global:orc_outpost_corridor',
  areaId: 'm01_orc_encampment',
  biomeId: 'orc_siege_encampment',
  title: 'Siege Trench Approach',
  bannerTitle: 'NOVARIN SIEGE TRENCH · ORC PATROL',
  landmarkLabel: 'FORTIFIED NOVARIN SIEGEWORKS',
  doorDirs: ['N', 'S', 'E', 'W'],
  cols: 14,
  rows: 13,
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

export const globalPillarSanctuaryRoom: RoomDefinition = {
  id: 'global_pillar_sanctuary',
  scope: 'global',
  coord: 'global:pillar_sanctuary',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_desync_ruins',
  title: 'Collapsed Colonnade',
  bannerTitle: 'COLLAPSED COLONNADE · SALVAGE SECTOR',
  landmarkLabel: 'SUNKEN MONASTIC PILLAR RING',
  doorDirs: ['N', 'S', 'E', 'W'],
  cols: 16,
  rows: 12,
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

export const globalRuinedArcadeRoom: RoomDefinition = {
  id: 'global_ruined_arcade',
  scope: 'global',
  coord: 'global:ruined_arcade',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_desync_ruins',
  title: 'Desynchronized Arcade',
  bannerTitle: 'DESYNCHRONIZED ARCADE · PHASING MASONRY',
  landmarkLabel: 'PHASING TEMPORAL MASONRY ARCADE',
  doorDirs: ['N', 'S', 'E', 'W'],
  cols: 16,
  rows: 12,
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

export const globalSinkholeBridgeRoom: RoomDefinition = {
  id: 'global_sinkhole_bridge',
  scope: 'global',
  coord: 'global:sinkhole_bridge',
  areaId: 'global_shattered_wilds_area',
  biomeId: 'global_toxic_wetlands',
  title: 'Abyssal Causeway',
  bannerTitle: 'ABYSSAL CAUSEWAY · ELEVATION CROSSING',
  landmarkLabel: 'ABYSSAL SINKHOLE SPAN',
  doorDirs: ['N', 'S', 'E', 'W'],
  cols: 16,
  rows: 11,
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

