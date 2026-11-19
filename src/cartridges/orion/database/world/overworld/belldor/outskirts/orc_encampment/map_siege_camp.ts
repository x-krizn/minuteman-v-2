/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../../types';

/**
 * Canonical database definition for `mapOrcSiegeCamp` (`M01 Orc Encampment Map`, id `'map_orc_siege_camp'`, scope `'local'`) —
 * M01 Orc Encampment sector (`UNDEFINED` in `mapping-v0.md`). Sealed behind an Æther Fog boundary during active traversal.
 */
export const mapOrcSiegeCamp: MapDefinition = {
  id: 'map_orc_siege_camp',
  name: 'M01 Orc Encampment Map',
  title: 'Orc Encampment (mapping-v0.md · UNDEFINED)',
  scope: 'local',
  areaId: 'm01_orc_encampment',
  biomeId: 'orc_siege_encampment',
  specStatus: 'UNDEFINED',
  docRef: 'mapping-v0.md',
  description:
    'M01 Orc Encampment sector (UNDEFINED in mapping-v0.md). Sealed behind an Aether Fog boundary during active traversal.',
  localRoomCoords: ['3,1'],
  globalRoomSlots: [],
  connectedMapIds: ['map_deep_bog_maze', 'global_wetland_expanse_map'],
  zoneFeatures: [
    {
      name: 'M01 ORC ENCAMPMENT',
      detail: 'UNDEFINED (mapping-v0.md)',
      status: 'UNDEFINED',
      coord: '3,1',
    },
  ],
};

/**
 * Canonical database definition for `room31OrcEncampmentSiege` (`M01 Orc Encampment (Sealed)`, id `'room_3_1_orc_encampment_siege'`, coord `"3,1"`, scope `'local'`, safety tier `'hazard'`).
 */
export const room31OrcEncampmentSiege: RoomDefinition = {
  id: 'room_3_1_orc_encampment_siege',
  scope: 'local',
  nodeType: 'key',
  coord: '3,1',
  mapId: 'map_orc_siege_camp',
  areaId: 'm01_orc_encampment',
  regionId: 'region_belldor_outskirts',
  biomeId: 'orc_siege_encampment',
  title: 'M01 Orc Encampment (Sealed)',
  bannerTitle: 'M01 ORC ENCAMPMENT · UNDEFINED SPEC (mapping-v0.md)',
  landmarkLabel: 'NOVARIN SIEGE PALISADE & WAR HORN BASTION',
  cols: 10,
  rows: 9,
  lighting: {
    safetyTier: 'hazard',
    ambientDarkness: 0.56,
    cornerShadowIntensity: 0.76,
    playerVisionRadiusPx: 72,
    ambientTintColor: '#f97316',
  },
  grid: [
    '####..####',
    '#..A..C..#',
    '#..P..P..#',
    '#...o....#',
    '#..~~~~..#',
    '.........#',
    '.........#',
    '#........#',
    '##########',
  ],
  cache: {
    scrap: 40,
    items: [
      { itemId: 'orc_war_paint', count: 2 },
      { itemId: 'demantoid_flask', count: 1 },
    ],
    toast: 'LOOTED SIEGE CACHE: +40 SCRAP, 2x ORC WAR PAINT & DEMANTOID FLASK',
  },
};
