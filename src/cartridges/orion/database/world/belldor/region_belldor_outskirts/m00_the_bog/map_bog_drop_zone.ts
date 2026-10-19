/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../types';

export const mapBogDropZone: MapDefinition = {
  id: 'map_bog_drop_zone',
  name: 'Bog Drop-Pod Sector',
  title: 'Impact Crater & Fallen Scout Ridge',
  scope: 'local',
  areaId: 'm00_the_bog',
  biomeId: 'belldor_bog',
  description:
    'Local map unique to M00 — The Bog, assembled from the Drop-Pod Crater, Sir Bedivere’s Ridge, the Sunken Sinkhole, and procedural wetland flanks.',
  localRoomCoords: ['0,0', '1,0', '1,-1'],
  globalRoomSlots: [
    {
      coord: '0,1',
      globalRoomId: 'global_marsh_crossing',
      biomeId: 'belldor_bog',
      title: 'Southern Bog Shallows',
      bannerTitle: 'M00: SOUTHERN BOG SHALLOWS',
    },
    {
      coord: '1,1',
      globalRoomId: 'global_sinkhole_bridge',
      biomeId: 'belldor_bog',
      title: 'Mire Sinkhole Span',
      bannerTitle: 'M00: MIRE SINKHOLE SPAN',
    },
  ],
  connectedMapIds: ['map_deep_bog_maze', 'global_wetland_expanse_map'],
};

export const room00DropPodCrater: RoomDefinition = {
  id: 'room_0_0_drop_pod_crater',
  scope: 'local',
  coord: '0,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Drop-Pod Crater',
  bannerTitle: 'M00: DROP-POD CRATER (SPAWN ANCHOR & WAYSTATION)',
  grid: [
    '##########',
    '#::,,,,..#',
    '#:P,.,P..#',
    '#::.D....#',
    '#,,......#',
    '#,,~~~~...',
    '#..~~~~...',
    '#..,,,:::#',
    '####..####',
  ],
};

export const room10FallenScoutRidge: RoomDefinition = {
  id: 'room_1_0_fallen_scout_ridge',
  scope: 'local',
  coord: '1,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Fallen Scout Ridge',
  bannerTitle: 'FALLEN SCOUT RIDGE · SIR BEDIVERE',
  grid: [
    '####..####',
    '#,,,..:::#',
    '#,,.S.:::#',
    '#,,....::#',
    '#..____..#',
    '...____...',
    '...,..,...',
    '#,,,..,,,#',
    '####..####',
  ],
};

export const room1Neg1SunkenSinkhole: RoomDefinition = {
  id: 'room_1_neg1_sunken_sinkhole',
  scope: 'local',
  coord: '1,-1',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Sunken Sinkhole Island',
  bannerTitle: 'SUNKEN SINKHOLE ISLAND (SECRET)',
  grid: [
    '##########',
    '#..P..P..#',
    '#...C....#',
    '#.~~..~~.#',
    '#........#',
    '#..P..P...#',
    '#........#',
    '#........#',
    '####..####',
  ],
  cache: {
    scrap: 35,
    items: [
      { itemId: 'bedivere_relic', count: 1 },
      { itemId: 'corrupted_shard', count: 1 },
      { itemId: 'repair_kit', count: 2 },
    ],
    toast: 'LOOTED: +35 SCRAP, BEDIVERE RELIC (1/3), SHARD & REPAIR KITS',
  },
};
