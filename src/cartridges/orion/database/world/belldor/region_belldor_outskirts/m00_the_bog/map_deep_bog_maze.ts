/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapDeepBogMaze: MapDefinition = {
  id: 'map_deep_bog_maze',
  name: 'Deep Bog, The Poe & Lady of the Lake Arena',
  title: 'Temple Ruins, Poe Clearing & Secret Lake Arena (bog-v2.md)',
  scope: 'local',
  areaId: 'm00_the_bog',
  biomeId: 'belldor_bog',
  specStatus: 'LOCKED',
  docRef: 'bog-v2.md',
  openDesignId: 'OD-BOG-01',
  description:
    'Deep marsh maze housing the Temple/Monastery ruins, corrosive bog water zones, The Poe (rescuable NPC that triggers L2 and unlocks exit), and the secret Lady of the Lake arena. Trap systems remain UNDEFINED (OD-BOG-01).',
  localRoomCoords: ['2,0', '3,0', '2,1'],
  globalRoomSlots: [
    {
      coord: '2,-1',
      globalRoomId: 'global_bog_hollow_grove',
      biomeId: 'belldor_bog',
      title: 'Northern Reed Hollow',
      bannerTitle: 'M00 THE BOG · NORTHERN REED HOLLOW',
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
      name: 'Trap systems',
      detail: 'UNDEFINED (OD-BOG-01)',
      status: 'UNDEFINED',
      openDesignId: 'OD-BOG-01',
    },
    {
      name: 'The Poe (rescuable NPC; triggers L2, unlocks exit)',
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
  title: 'Deep Bog Ruins & Corrosive Water',
  bannerTitle: 'M00 THE BOG · MONASTERY RUINS & CORROSIVE WATER',
  grid: [
    '####..####',
    '#..~~~~..#',
    '#.,P..P,.#',
    '#.W....W.#',
    '#..~~~~..#',
    ',,......,,',
    ',,......,,',
    '#..~~~~..#',
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
  bannerTitle: 'M00 SECRET ARENA · LADY OF THE LAKE (RETURN TRIGGER)',
  grid: [
    '####,,####',
    '#,,~~~~,,#',
    '#~~~~~~~,#',
    '#~..L..~,#',
    '#~.....~,#',
    ',,..C...,,',
    ',,......,,',
    '#,,~~~~,,#',
    '####,,####',
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

export const room30BogExitPerimeter: RoomDefinition = {
  id: 'room_3_0_bog_exit_perimeter',
  scope: 'local',
  coord: '3,0',
  mapId: 'map_deep_bog_maze',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'The Poe & Bog Exit Perimeter',
  bannerTitle: 'M00 THE BOG · THE POE & BORDER TOWN EXIT GATE',
  grid: [
    '##########',
    '#..~~~~.C#',
    '#..P..P..#',
    '#...E..o.#',
    '#........#',
    ',,.......G',
    ',,.......G',
    '#..W.....#',
    '####..####',
  ],
  cache: {
    scrap: 20,
    items: [{ itemId: 'poe_lantern_charm', count: 1 }],
    toast: 'LOOTED: +20 SCRAP & POE LANTERN CHARM',
  },
};
