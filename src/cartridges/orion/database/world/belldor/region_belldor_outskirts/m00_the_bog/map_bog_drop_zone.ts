/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapBogDropZone: MapDefinition = {
  id: 'map_bog_drop_zone',
  name: 'Maze of Downed Trees & Bedivere’s Corpse',
  title: 'Drop-Pod Crater, Downed Trees & Monastery Ruins (bog-v2.md)',
  scope: 'local',
  areaId: 'm00_the_bog',
  biomeId: 'belldor_bog',
  specStatus: 'LOCKED',
  docRef: 'bog-v2.md',
  description:
    'Opening sector of M00 The Bog featuring the maze of downed trees, temple/monastery ruins, and Sir Bedivere’s corpse en route to the exit (yielding his signet ring + knight list).',
  localRoomCoords: ['0,0', '1,0'],
  globalRoomSlots: [
    {
      coord: '0,1',
      globalRoomId: 'global_bog_sunken_causeway',
      biomeId: 'belldor_bog',
      title: 'Southern Mud Causeway',
      bannerTitle: 'M00 THE BOG · SOUTHERN MUD CAUSEWAY',
    },
    {
      coord: '1,-1',
      globalRoomId: 'global_bog_hollow_grove',
      biomeId: 'belldor_bog',
      title: 'Overgrown Pylon Grove',
      bannerTitle: 'M00 THE BOG · OVERGROWN PYLON GROVE',
    },
  ],
  connectedMapIds: ['map_deep_bog_maze', 'global_wetland_expanse_map'],
  zoneFeatures: [
    { name: 'Maze of downed trees', status: 'LOCKED', coord: '0,0' },
    { name: 'Temple/monastery ruins', status: 'LOCKED', coord: '1,0' },
    { name: "Bedivere's corpse (en route to exit; ring + list)", status: 'LOCKED', coord: '1,0' },
  ],
};

export const room00DropPodCrater: RoomDefinition = {
  id: 'room_0_0_drop_pod_crater',
  scope: 'local',
  coord: '0,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Maze of Downed Trees (Drop-Pod)',
  bannerTitle: 'M00 THE BOG · MAZE OF DOWNED TREES & DROP-POD',
  grid: [
    '##########',
    '#,,....,,#',
    '#,P....P,#',
    '#...D....#',
    '#..~~~~..#',
    '#.......,,',
    '#.......,,',
    '#,,...C,,#',
    '####,,####',
  ],
  cache: {
    scrap: 15,
    items: [{ itemId: 'repair_kit', count: 1 }],
    toast: 'LOOTED: +15 SCRAP & EMERGENCY REPAIR KIT',
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
  bannerTitle: "M00 THE BOG · TEMPLE RUINS & SIR BEDIVERE'S CORPSE",
  grid: [
    '####,,####',
    '#,,~~~~,,#',
    '#..P..P..#',
    '#...S..s.#',
    '#........#',
    ',,......,,',
    ',,......,,',
    '#..s..C..#',
    '##########',
  ],
  cache: {
    scrap: 15,
    items: [{ itemId: 'bedivere_relic', count: 1 }],
    toast: 'LOOTED: +15 SCRAP & BEDIVERE RELIC (1/3)',
  },
};
