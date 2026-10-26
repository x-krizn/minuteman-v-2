/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../types';

export const camelotBorderTownArea: AreaWikiDefinition = {
  id: 'camelot_border_town',
  name: 'CAMELOT BORDER TOWN',
  title: 'Outer Perimeter, Market, Barracks & Cathedral (border-town-v1.md · LOCKED)',
  scope: 'local',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 3–6',
  specStatus: 'LOCKED',
  docRef: 'border-town-v1.md',
  openDesignId: 'OD-BT-01',
  description:
    'Locked second zone of Belldor comprising the Outer Perimeter (spawn from the Bog), Market District (central hub), Barracks Quarter (Percival/Tristan/Bors patrols), Cathedral District (lore zone), and the Dungeon Entrance leading to the Deep Dungeon (UNDEFINED: OD-BT-01) and Camelot Waygate Key.',
  lore:
    'Everyone here suffers from Grail Sickness. Factions fight over the road to the Camelot Waygate while Novarin orc raids strike without warning.',
  localMapIds: [
    'map_border_town_market',
    'map_border_town_barracks',
    'map_border_town_cathedral',
  ],
  globalMapIds: ['global_desync_outskirts_map'],
  connectedAreaIds: ['m00_the_bog', 'camelot_interior', 'global_shattered_wilds_area'],
  spawnAnchor: { room: '4,0', x: 32, y: 96 },
  exitAnchor: { room: '5,0', x: 208, y: 96 },
  waystation: {
    id: 'ws_border_town_market',
    name: 'Border Town Market Waystation',
    regionId: 'region_belldor_camelot_heartland',
    areaId: 'camelot_border_town',
    mapId: 'map_border_town_market',
    room: '4,0',
    x: 200,
    y: 88,
    lore: 'Flickering market spire in the central hub that holds local alignment despite the town’s temporal drift.',
  },
  zoneFeatures: [
    {
      name: 'Outer Perimeter',
      detail: 'Spawn from the Bog',
      status: 'LOCKED',
      coord: '4,0',
    },
    {
      name: 'Market District',
      detail: 'Central hub',
      status: 'LOCKED',
      coord: '4,0',
    },
    {
      name: 'Barracks Quarter',
      detail: 'Percival/Tristan/Bors patrols',
      status: 'LOCKED',
      coord: '4,-1',
    },
    {
      name: 'Cathedral District',
      detail: 'Lore zone',
      status: 'LOCKED',
      coord: '5,0',
    },
    {
      name: 'Dungeon Entrance → Deep Dungeon → Camelot Waygate Key',
      detail: 'Deep Dungeon — UNDEFINED (OD-BT-01)',
      status: 'UNDEFINED',
      openDesignId: 'OD-BT-01',
      coord: '5,0',
    },
  ],
  lootPool: {
    equipmentIds: [
      'rs450_radiant_projector',
      'hl220_lightburst_lance',
      'tig_edge',
      'sv18_serpent',
      'sr440_shadowfang',
      's6_phantom_edge',
      'wz650_prism_lance',
      'wz800_arclight_cannon',
      'cl700_sanctifier',
      'cl500_absolution',
      'hallowed_scepter',
    ],
    gemIds: ['titanite', 'moonstone', 'demantoid', 'kyanite', 'charoite'],
    consumableIds: ['demantoid_flask', 'grail_water'],
    equipmentDropChance: 0.55,
  },
};
