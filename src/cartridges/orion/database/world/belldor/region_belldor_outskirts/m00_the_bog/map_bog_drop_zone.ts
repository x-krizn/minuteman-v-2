/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapBogDropZone: MapDefinition = {
  id: 'map_bog_drop_zone',
  name: 'Drop-Pod Trail, First Campfire & Poe Branch',
  title: 'Drop-Pod Crater, Downed Trees, First Campfire & Poe Sanctuary (bog-v2.md)',
  scope: 'local',
  areaId: 'm00_the_bog',
  biomeId: 'belldor_bog',
  specStatus: 'LOCKED',
  docRef: 'bog-v2.md',
  description:
    'Opening trail of M00 The Bog: Drop-Pod Crater (-3,0) -> 3 rooms to First Campfire (0,0) -> 2-room side branch to Poe Lantern (0,-2, 5 rooms from Drop Pod) or 3-room main trail past Bedivere (1,0) to Main Bog Entrance (3,0, 6 rooms from Drop Pod).',
  localRoomCoords: ['-4,0', '-3,0', '-2,0', '-1,0', '0,0', '0,-1', '0,-2', '1,0'],
  globalRoomSlots: [
    {
      coord: '0,1',
      globalRoomId: 'global_bog_sunken_causeway',
      biomeId: 'belldor_bog',
      title: 'Southern Mud Causeway',
      bannerTitle: 'SOUTHERN MUD CAUSEWAY',
    },
    {
      coord: '1,-1',
      globalRoomId: 'global_bog_hollow_grove',
      biomeId: 'belldor_bog',
      title: 'Overgrown Pylon Grove',
      bannerTitle: 'OVERGROWN PYLON GROVE',
    },
  ],
  connectedMapIds: ['map_deep_bog_maze', 'global_wetland_expanse_map'],
  zoneFeatures: [
    { name: 'Drop-Pod Cheat Room Door', status: 'LOCKED', coord: '-3,0' },
    { name: 'Maze of downed trees', status: 'LOCKED', coord: '-2,0' },
    { name: 'First Campfire (Respawn & Transit)', status: 'LOCKED', coord: '0,0' },
    { name: 'The Poe & Poe Lantern (5 rooms from Drop Pod)', status: 'LOCKED', coord: '0,-2' },
    { name: "Bedivere's corpse (en route to Main Bog)", status: 'LOCKED', coord: '1,0' },
  ],
};

export const roomCheatPodBay: RoomDefinition = {
  id: 'room_neg4_0_cheat_pod_bay',
  scope: 'local',
  nodeType: 'end',
  coord: '-4,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Drop-Pod Bay (Cheat Room)',
  bannerTitle: 'DROP-POD BAY · DEVELOPER & TESTING TERMINALS',
  grid: [
    '##########',
    '#;;1::2;;#',
    '#;;....;;#',
    '#3;P;;P;!#',
    '#;;;;;;;;#',
    '#;;:..:;;#',
    '#C;;;;;;V#',
    '#;;;D;;;;#',
    '##########',
  ],
  cache: {
    scrap: 100,
    items: [
      { itemId: 'repair_kit', count: 3 },
      { itemId: 'grail_water', count: 2 },
    ],
    toast: 'TEST CACHE: +100 SCRAP, 3x REPAIR KIT & 2x GRAIL WATER',
  },
};

export const roomDropPodCrater: RoomDefinition = {
  id: 'room_neg3_0_drop_pod_crater',
  scope: 'local',
  coord: '-3,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Drop-Pod Impact Crater',
  bannerTitle: 'DROP-POD IMPACT CRATER',
  grid: [
    '##########',
    '#,,,..,,,#',
    '#,P,..P,,#',
    '#,...,D.,#',
    '#,..~~~~,#',
    '#,......,,',
    '#,......,,',
    '#,,,..,,,#',
    '##########',
  ],
};

export const roomDownedTreesWest: RoomDefinition = {
  id: 'room_neg2_0_downed_trees_west',
  scope: 'local',
  coord: '-2,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Downed Trees West',
  bannerTitle: 'MAZE OF DOWNED TREES (WEST)',
  grid: [
    '##########',
    '#,,P,,P,,#',
    '#,,....,,#',
    '#,..~~~~,#',
    '#,..s...,#',
    ',,......,,',
    ',,......,,',
    '#,,P,,C,,#',
    '##########',
  ],
  cache: {
    scrap: 15,
    items: [{ itemId: 'repair_kit', count: 1 }],
    toast: 'LOOTED: +15 SCRAP & FIELD REPAIR KIT',
  },
};

export const roomDownedTreesEast: RoomDefinition = {
  id: 'room_neg1_0_downed_trees_east',
  scope: 'local',
  coord: '-1,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Downed Trees East',
  bannerTitle: 'MAZE OF DOWNED TREES (EAST)',
  grid: [
    '##########',
    '#,,~~~~,,#',
    '#,P,..P,,#',
    '#,..s...,#',
    '#,......,#',
    ',,......,,',
    ',,......,,',
    '#,,~~~~,,#',
    '##########',
  ],
};

export const room00DropPodCrater: RoomDefinition = {
  id: 'room_0_0_first_campfire',
  scope: 'local',
  coord: '0,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Bog Outskirts Campfire',
  bannerTitle: 'FIRST CAMPFIRE CLEARING',
  grid: [
    '####,,####',
    '#,,,..,,,#',
    '#,P,::,P,#',
    '#,..A:..,#',
    '#,..::..,#',
    ',,......,,',
    ',,......,,',
    '#,,,..C,,#',
    '####,,####',
  ],
  cache: {
    scrap: 15,
    items: [{ itemId: 'repair_kit', count: 1 }],
    toast: 'LOOTED: +15 SCRAP & EMERGENCY REPAIR KIT',
  },
};

export const room0Neg1RuinBranch: RoomDefinition = {
  id: 'room_0_neg1_ruin_branch',
  scope: 'local',
  coord: '0,-1',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Overgrown Ruin Approach',
  bannerTitle: 'OVERGROWN RUIN APPROACH',
  grid: [
    '####::####',
    '#:::..:::#',
    '#:P::::P:#',
    '#,,~~~~,,#',
    '#,..s...,#',
    '#,......,#',
    '#:::..:::#',
    '#:P,..P,:#',
    '####,,####',
  ],
};

export const room0Neg2PoeLanternSanctuary: RoomDefinition = {
  id: 'room_0_neg2_poe_lantern_sanctuary',
  scope: 'local',
  coord: '0,-2',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Poe Lantern Clearing',
  bannerTitle: 'POE LANTERN CLEARING',
  grid: [
    '##########',
    '#::P::P::#',
    '#::.L..p:#',
    '#,,::::,,#',
    '#,,~~~~,,#',
    '#,......,,',
    '#,......,,',
    '#,P,V.,P,#',
    '####::####',
  ],
  cache: {
    scrap: 20,
    items: [{ itemId: 'poe_lantern_charm', count: 1 }],
    toast: 'LOOTED: +20 SCRAP & POE LANTERN CHARM',
  },
};

export const room10SunkenPylonTrail: RoomDefinition = {
  id: 'room_1_0_sunken_pylon_trail',
  scope: 'local',
  coord: '1,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: "Temple Ruins & Bedivere's Corpse",
  bannerTitle: "TEMPLE RUINS & SIR BEDIVERE'S CORPSE",
  grid: [
    '####,,####',
    '#::P,,P::#',
    '#::.S..::#',
    '#,,::::,,#',
    '#,,~~~~,,#',
    ',,......,,',
    ',,..s...,,',
    '#,,s..C,,#',
    '##########',
  ],
  cache: {
    scrap: 15,
    items: [{ itemId: 'bedivere_relic', count: 1 }],
    toast: 'LOOTED: +15 SCRAP & BEDIVERE RELIC (1/3)',
  },
};
