/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

/**
 * Canonical database definition for `mapDeepBogMaze` (`Main Bog Expanse & Lady of the Lake Arena`, id `'map_deep_bog_maze'`, coord `"2,-1"`, scope `'local'`) — Expansive multi-screen Main Bog sectors featuring deep corrosive mire basins, stepping-stone ruins, submerged ....
 */
export const mapDeepBogMaze: MapDefinition = {
  id: 'map_deep_bog_maze',
  name: 'Main Bog Expanse & Lady of the Lake Arena',
  title: 'Corrosive Marsh Trail, Main Bog Expanse & Secret Lake Arena (bog-v2.md)',
  scope: 'local',
  areaId: 'm00_the_bog',
  biomeId: 'belldor_bog',
  specStatus: 'LOCKED',
  docRef: 'bog-v2.md',
  openDesignId: 'OD-BOG-01',
  description:
    'Expansive multi-screen Main Bog sectors featuring deep corrosive mire basins, stepping-stone ruins, submerged Bog Wurm ambushes, repeatable exploration loops back to the Poe Lantern branch, and the 20x15 Lady of the Lake Sanctum arena.',
  localRoomCoords: ['2,0', '3,0', '3,-1', '2,1'],
  globalRoomSlots: [
    {
      coord: '2,-1',
      globalRoomId: 'global_marsh_crossing',
      biomeId: 'belldor_bog',
      title: 'Northern Reed Hollow',
      bannerTitle: 'NORTHERN REED HOLLOW',
    },
  ],
  connectedMapIds: [
    'map_bog_drop_zone',
    'map_border_town_market',
    'map_orc_siege_camp',
    'global_wetland_expanse_map',
  ],
  zoneFeatures: [
    { name: 'Corrosive bog water zones', status: 'LOCKED', coord: '2,0' },
    {
      name: 'Main Bog Entrance & Perimeter Gate',
      status: 'LOCKED',
      coord: '3,0',
    },
    {
      name: 'Lady of the Lake arena (secret boss, return trigger)',
      status: 'LOCKED',
      coord: '2,1',
    },
  ],
};

/**
 * Canonical database definition for `room20DeepBogMaze` (`Corrosive Marsh Trail`, id `'room_2_0_deep_bog_maze'`, coord `"2,0"`, scope `'local'`, safety tier `'hazard'`).
 */
export const room20DeepBogMaze: RoomDefinition = {
  id: 'room_2_0_deep_bog_maze',
  scope: 'local',
  coord: '2,0',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Corrosive Marsh Trail',
  bannerTitle: 'CORROSIVE MARSH TRAIL · ACIDIC MIRE BASIN',
  landmarkLabel: 'STEPPING-STONE CAUSEWAY & CORROSIVE BASIN',
  cols: 18,
  rows: 13,
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.62,
    cornerShadowIntensity: 0.82,
    playerVisionRadiusPx: 80,
    ambientTintColor: '#a855f7',
  },
  lootPool: {
    equipmentIds: ['ls900_swordspear', 'wz450_sparkstrike', 'cl350_litany', 'sv12_viper'],
    gemIds: ['rubellite', 'kyanite', 'charoite'],
    equipmentDropChance: 0.45,
  },
  grid: [
    '#######,,,,#######',
    '#,,~~~~,,,,~~~~,,#',
    '#,P,~~~~..~~~~,P,#',
    '#,;;~~~::::~~~;;,#',
    '#,;;W..::::..W;;,#',
    ',,.....::::.....,,',
    ',,:::::P::P:::::,,',
    ',,.....::::.....,,',
    '#,;;s..::::..;;;,#',
    '#,;;~~~::::~~~;;,#',
    '#,P,~~~~..~~~~,P,#',
    '#,,,...::::...,,,#',
    '#######,,,,#######',
  ],
};

/**
 * Canonical database definition for `room21LadyOfTheLakeArena` (`Lady of the Lake Arena`, id `'room_2_1_lady_of_the_lake_arena'`, coord `"2,1"`, scope `'local'`, safety tier `'abyss'`).
 */
export const room21LadyOfTheLakeArena: RoomDefinition = {
  id: 'room_2_1_lady_of_the_lake_arena',
  scope: 'local',
  coord: '2,1',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Lady of the Lake Arena',
  bannerTitle: 'LADY OF THE LAKE ARENA · DROWNED AMPHITHEATER',
  landmarkLabel: 'FLOODED SANCTUM OF THE LADY OF THE LAKE',
  cols: 20,
  rows: 15,
  lighting: {
    safetyTier: 'abyss',
    ambientDarkness: 0.66,
    cornerShadowIntensity: 0.86,
    playerVisionRadiusPx: 80,
    ambientTintColor: '#22d3ee',
  },
  lootPool: {
    equipmentIds: [
      'wz650_prism_lance',
      'wz200_manacore_staff',
      'hallowed_scepter',
      'grace_edge',
      'hl220_lightburst_lance',
    ],
    gemIds: ['moonstone', 'rubellite', 'demantoid', 'kyanite'],
    equipmentDropChance: 1.0,
  },
  grid: [
    '########,,,,########',
    '#,,,P::::::::::P,,,#',
    '#,,..::::::::::..,,#',
    '#,..~~~::::::~~~..,#',
    '#,~~~~~~::::~~~~~~,#',
    '#,~~~P::::::::P~V~,#',
    ',,~~::::::::::::~~,,',
    ',,::::::~~~~::::::,,',
    ',,~~::::::::::::~~,,',
    '#,~~~P::::::::P~~~,#',
    '#,~~~~~~::::~~~~~~,#',
    '#,..~~~::::::~~~..,#',
    '#,,..::::..::::..,,#',
    '#,,,P,,......,,P,,,#',
    '########,,,,########',
  ],
  cache: {
    scrap: 55,
    items: [
      { itemId: 'grail_water', count: 2 },
      { itemId: 'corrupted_shard', count: 1 },
    ],
    toast: 'LOOTED LAKE SANCTUM: +55 SCRAP, 2x GRAIL WATER & CORRUPTED SHARD',
  },
};

/**
 * Canonical database definition for `room3Neg1BogLoopHollow` (`Northern Bog Hollow`, id `'room_3_neg1_bog_loop_hollow'`, coord `"3,-1"`, scope `'local'`, safety tier `'hazard'`).
 */
export const room3Neg1BogLoopHollow: RoomDefinition = {
  id: 'room_3_neg1_bog_loop_hollow',
  scope: 'local',
  coord: '3,-1',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Northern Bog Hollow',
  bannerTitle: 'NORTHERN BOG HOLLOW · MIST FEN',
  landmarkLabel: 'SUNKEN REED HOLLOW & WURM BASIN',
  cols: 16,
  rows: 12,
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.58,
    cornerShadowIntensity: 0.78,
    playerVisionRadiusPx: 80,
  },
  lootPool: {
    equipmentIds: ['m300_hasta', 'sv12_viper', 's4_whisper_blade', 'cl350_litany'],
    gemIds: ['charoite', 'rubellite', 'hematite'],
    equipmentDropChance: 0.5,
  },
  grid: [
    '######,,,,######',
    '#,,~~~~,,~~~~,,#',
    '#,P,~~~..~~~,P,#',
    '#,;;..s..W..;;,#',
    '#,;;..~~~~..;;,#',
    ',,....~~~~....,,',
    ',,....::::....,,',
    '#,;;..::::..;C,#',
    '#,P,..::::..,P,#',
    '#,,,..::::..,,,#',
    '#,,,,......,,,,#',
    '######,,,,######',
  ],
  cache: {
    scrap: 24,
    items: [{ itemId: 'demantoid_flask', count: 1 }],
    toast: 'LOOTED MIST HOLLOW: +24 SCRAP & DEMANTOID FLASK',
  },
};

/**
 * Canonical database definition for `room30BogExitPerimeter` (`Main Bog Expanse & Exit Gate`, id `'room_3_0_bog_exit_perimeter'`, coord `"3,0"`, scope `'local'`, safety tier `'hazard'`).
 */
export const room30BogExitPerimeter: RoomDefinition = {
  id: 'room_3_0_bog_exit_perimeter',
  scope: 'local',
  coord: '3,0',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Main Bog Expanse & Exit Gate',
  bannerTitle: 'MAIN BOG EXPANSE & PERIMETER GATEHOUSE',
  landmarkLabel: 'FORTIFIED BOG GATEHOUSE & BASTION',
  cols: 18,
  rows: 13,
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.56,
    cornerShadowIntensity: 0.76,
    playerVisionRadiusPx: 80,
  },
  lootPool: {
    equipmentIds: [
      'b25_brushcutter',
      'm350_mauler',
      'siegebreaker',
      'm450_pilum',
      'rs450_radiant_projector',
    ],
    gemIds: ['carnelian', 'titanite', 'spinel'],
    equipmentDropChance: 0.65,
  },
  grid: [
    '#######,,,,#######',
    '#,,,..::::::..:V:#',
    '#,,P,::::::::,::P#',
    '#,,,.~~~~~~..::::#',
    '#,;;.~~~~~~.s::::#',
    ',,....o......::::G',
    ',,...........::::G',
    ',,...........::::#',
    '#,;;.~~~~~~..::::#',
    '#,,P,~~W~~~.,P:::#',
    '#,,,.........::::#',
    '#,,,,........::::#',
    '#######,,,,#######',
  ],
  cache: {
    scrap: 30,
    items: [{ itemId: 'rusted_gate_key', count: 1 }],
    toast: 'LOOTED GATEHOUSE BASTION: +30 SCRAP & RUSTED GATE KEY',
  },
};
