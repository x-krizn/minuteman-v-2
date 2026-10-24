/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

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
    'Main Bog expanse starting 6 rooms from the Drop Pod (3 rooms past the First Campfire), featuring corrosive bog water zones, repeatable exploration loops back to the Poe Lantern branch, and the secret Lady of the Lake arena.',
  localRoomCoords: ['2,0', '3,0', '3,-1', '2,1'],
  globalRoomSlots: [
    {
      coord: '2,-1',
      globalRoomId: 'global_bog_hollow_grove',
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

export const room20DeepBogMaze: RoomDefinition = {
  id: 'room_2_0_deep_bog_maze',
  scope: 'local',
  coord: '2,0',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Corrosive Marsh Trail',
  bannerTitle: 'CORROSIVE MARSH TRAIL',
  grid: [
    '####..####',
    '#;;~~~~;;#',
    '#;,P::P,;#',
    '#.W.::.W.#',
    '#;;~~~~;;#',
    ',,......,,',
    ',,......,,',
    '#;;~~~~;;#',
    '####,,####',
  ],
};

export const room21LadyOfTheLakeArena: RoomDefinition = {
  id: 'room_2_1_lady_of_the_lake_arena',
  scope: 'local',
  coord: '2,1',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Lady of the Lake Arena',
  bannerTitle: 'LADY OF THE LAKE ARENA',
  cols: 14,
  rows: 11,
  grid: [
    '######,,######',
    '#:::~~~~~~:::#',
    '#:~~~~~~~~~~:#',
    '#,~~::P::P~~,#',
    '#,~~..::::~~,#',
    ',,....V:....,,',
    ',,....::....,,',
    '#,~~::P::P~~,#',
    '#:~~~~~~~~~~:#',
    '#:::~~~~~~:::#',
    '######,,######',
  ],
  cache: {
    scrap: 45,
    items: [
      { itemId: 'grail_water', count: 2 },
      { itemId: 'corrupted_shard', count: 1 },
    ],
    toast: 'LOOTED LAKE SANCTUM: +45 SCRAP, 2x GRAIL WATER & SHARD',
  },
};

export const room3Neg1BogLoopHollow: RoomDefinition = {
  id: 'room_3_neg1_bog_loop_hollow',
  scope: 'local',
  coord: '3,-1',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Northern Bog Hollow',
  bannerTitle: 'NORTHERN BOG HOLLOW',
  grid: [
    '####..####',
    '#,,~~~~,,#',
    '#,P.;;.P,#',
    '#.;s..W;.#',
    '#;;~~~~;;#',
    ',,......,,',
    ',,......,,',
    '#,P..C.P,#',
    '####..####',
  ],
  cache: {
    scrap: 20,
    items: [{ itemId: 'repair_kit', count: 1 }],
    toast: 'LOOTED: +20 SCRAP & FIELD REPAIR KIT',
  },
};

export const room30BogExitPerimeter: RoomDefinition = {
  id: 'room_3_0_bog_exit_perimeter',
  scope: 'local',
  coord: '3,0',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Main Bog Expanse & Exit Gate',
  bannerTitle: 'MAIN BOG EXPANSE & EXIT GATE',
  cols: 14,
  rows: 11,
  grid: [
    '######..######',
    '#...~~~~~~;V;#',
    '#..P..~~~~;;P#',
    '#..:.E....s;;#',
    '#..........;;#',
    ',,.........::G',
    ',,.........::G',
    '#...~~~~...;;#',
    '#..P..W...P;;#',
    '#..........;;#',
    '######..######',
  ],
  cache: {
    scrap: 25,
    items: [{ itemId: 'rusted_gate_key', count: 1 }],
    toast: 'LOOTED: +25 SCRAP & RUSTED GATE KEY',
  },
};
