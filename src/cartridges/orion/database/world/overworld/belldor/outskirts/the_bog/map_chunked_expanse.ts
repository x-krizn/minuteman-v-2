/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition, RoomDefinition } from '../../../../../../types';

const INITIAL_EXPANSE_ROW = '#'.repeat(260);
const INITIAL_EXPANSE_GRID: string[] = Array.from({ length: 162 }, () => INITIAL_EXPANSE_ROW);

/**
 * Canonical database definition for `mapBogChunkedExpanse` (`Unified Bog Grid (26x18 Seamless Room-Node & Fog Sector)`, id `'map_bog_chunked_expanse'`, scope `'local'`) —
 * Unified `260 x 162` tile (`26 x 18` screen chunks, `4160 x 2592` `px`) seamless Bog sector where all authored M00 The Bog `RoomDefinition` nodes are placed directly onto the grid by coordinate and connected by co-located Set-Path corridor chunks.
 */
export const mapBogChunkedExpanse: MapDefinition = {
  id: 'map_bog_chunked_expanse',
  name: 'Unified Bog Grid (26x18 Seamless Room-Node & Fog Sector)',
  title: 'M00 The Bog · Unified Seamless Room-Node & Off-Path Fog Grid',
  scope: 'local',
  areaId: 'm00_the_bog',
  biomeId: 'belldor_bog',
  specStatus: 'LOCKED',
  docRef: 'bog-v2.md',
  description:
    'Unified 260x162 tile (26x18 screen chunks, 4,160x2,592 px) seamless Bog sector where all authored M00 The Bog RoomDefinitions (-3,0 Drop Pod through 3,0 Exit Gate, 0,-2 Poe Lantern, and 2,1 Lady of the Lake) are placed directly onto the grid by coordinate and size, connected by Set-Path corridor chunks, and surrounded by dynamic off-path Aether Fog with Lantern Anchors and Fog Loop Dungeons.',
  localRoomCoords: ['-3,-1'],
  globalRoomSlots: [],
  connectedMapIds: ['map_bog_drop_zone', 'map_deep_bog_maze', 'map_border_town_market'],
  corridorChunks: [
    // East-West Main Bog Trail Corridors (cy = 9..10)
    { cx: 5, cy: 9, title: 'Hollow Mire Causeway (North)', orientation: 'H' },
    { cx: 5, cy: 10, title: 'Hollow Mire Causeway (South)', orientation: 'H' },
    { cx: 8, cy: 9, title: 'Fallen Timber Bridge (North)', orientation: 'H' },
    { cx: 8, cy: 10, title: 'Fallen Timber Bridge (South)', orientation: 'H' },
    { cx: 11, cy: 9, title: 'Campfire West Approach (North)', orientation: 'H' },
    { cx: 11, cy: 10, title: 'Campfire West Approach (South)', orientation: 'H' },
    { cx: 14, cy: 9, title: 'Temple Nave Causeway (North)', orientation: 'H' },
    { cx: 14, cy: 10, title: 'Temple Nave Causeway (South)', orientation: 'H' },
    { cx: 17, cy: 9, title: 'Mire Basin Crossing (North)', orientation: 'H' },
    { cx: 17, cy: 10, title: 'Mire Basin Crossing (South)', orientation: 'H' },
    { cx: 20, cy: 9, title: 'Gatehouse Approach (North)', orientation: 'H' },
    { cx: 20, cy: 10, title: 'Gatehouse Approach (South)', orientation: 'H' },

    // North-South Campfire <-> Ruin <-> Poe Lantern & Southern Causeway (cx = 12..13)
    { cx: 12, cy: 8, title: 'Monastic Ruin Steps (West)', orientation: 'V' },
    { cx: 13, cy: 8, title: 'Monastic Ruin Steps (East)', orientation: 'V' },
    { cx: 12, cy: 5, title: 'Lantern Shrine Walk (West)', orientation: 'V' },
    { cx: 13, cy: 5, title: 'Lantern Shrine Walk (East)', orientation: 'V' },
    { cx: 12, cy: 11, title: 'Southern Causeway Steps (West)', orientation: 'V' },
    { cx: 13, cy: 11, title: 'Southern Causeway Steps (East)', orientation: 'V' },

    // North-South Temple <-> Pylon Grove (cx = 15..16)
    { cx: 15, cy: 8, title: 'Pylon Sanctuary Walk (West)', orientation: 'V' },
    { cx: 16, cy: 8, title: 'Pylon Sanctuary Walk (East)', orientation: 'V' },

    // North-South Marsh <-> Lady of the Lake Sanctum (cx = 18..19)
    { cx: 18, cy: 11, title: 'Drowned Sanctum Causeway (West)', orientation: 'V' },
    { cx: 19, cy: 11, title: 'Drowned Sanctum Causeway (East)', orientation: 'V' },

    // North-South Northern Bog Hollow <-> Exit Gate (cx = 21..22)
    { cx: 21, cy: 8, title: 'Northern Bastion Path (West)', orientation: 'V' },
    { cx: 22, cy: 8, title: 'Northern Bastion Path (East)', orientation: 'V' },

    // Northern Loop Causeway connecting Ruin/Pylon (0,-1 & 1,-1) <-> Northern Bog Hollow (3,-1)
    { cx: 14, cy: 6, title: 'Northern Reed Causeway', orientation: 'H' },
    { cx: 14, cy: 7, title: 'Northern Reed Causeway', orientation: 'H' },
    { cx: 17, cy: 6, title: 'Northern Mist Fen Trail', orientation: 'H' },
    { cx: 17, cy: 7, title: 'Northern Mist Fen Trail', orientation: 'H' },
    { cx: 18, cy: 6, title: 'Northern Mist Fen Trail', orientation: 'H' },
    { cx: 18, cy: 7, title: 'Northern Mist Fen Trail', orientation: 'H' },
    { cx: 19, cy: 6, title: 'Northern Mist Fen Trail', orientation: 'H' },
    { cx: 19, cy: 7, title: 'Northern Mist Fen Trail', orientation: 'H' },
    { cx: 20, cy: 6, title: 'Northern Mist Fen Trail', orientation: 'H' },
    { cx: 20, cy: 7, title: 'Northern Mist Fen Trail', orientation: 'H' },
  ],
  zoneFeatures: [
    { name: 'Drop-Pod Impact Crater (-3,0 · Chunks 3..4, 9..10)', status: 'LOCKED', coord: '-3,-1' },
    { name: 'Bog Outskirts Campfire (0,0 · Chunks 12..13, 9..10)', status: 'LOCKED', coord: '-3,-1' },
    { name: 'Poe Lantern Clearing (0,-2 · Chunks 12..13, 3..4)', status: 'LOCKED', coord: '-3,-1' },
    { name: "Sir Bedivere's Temple (1,0 · Chunks 15..16, 9..10)", status: 'LOCKED', coord: '-3,-1' },
    { name: 'Lady of the Lake Arena (2,1 · Chunks 18..19, 12..13)', status: 'LOCKED', coord: '-3,-1' },
    { name: 'Main Bog Exit Gatehouse (3,0 · Chunks 21..22, 9..10)', status: 'LOCKED', coord: '-3,-1' },
  ],
};

/**
 * Canonical database definition for `roomSunkenBogExpanse` (`M00 The Bog (Unified Grid)`, id `'room_neg3_neg1_sunken_bog_expanse'`, coord `"-3,-1"`, scope `'local'`, safety tier `'trail'`).
 */
export const roomSunkenBogExpanse: RoomDefinition = {
  id: 'room_neg3_neg1_sunken_bog_expanse',
  scope: 'local',
  nodeType: 'key',
  coord: '-3,-1',
  mapId: 'map_bog_chunked_expanse',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'M00 The Bog (Unified Grid)',
  bannerTitle: 'M00 THE BOG · SEAMLESS ROOM-NODE & FOG SECTOR',
  landmarkLabel: 'DROP-POD IMPACT CRATER · SET PATH [-3,0]',
  cols: 260,
  rows: 162,
  isChunkedExpanse: true,
  lighting: {
    safetyTier: 'trail',
    ambientDarkness: 0.34,
    cornerShadowIntensity: 0.48,
    playerVisionRadiusPx: 92,
    ambientTintColor: '#22d3ee',
  },
  lootPool: {
    equipmentIds: [
      's2_turbine_khopesh',
      'aegis_charge_buckler',
      'm300_hasta',
      'ls900_swordspear',
      'sv12_viper',
      'arc_conductor',
      'grace_edge',
    ],
    gemIds: ['spinel', 'hematite', 'moonstone', 'charoite', 'rubellite', 'kyanite'],
    equipmentDropChance: 0.55,
  },
  grid: INITIAL_EXPANSE_GRID,
  cache: {
    scrap: 35,
    items: [
      { itemId: 'demantoid_flask', count: 1 },
      { itemId: 'grail_water', count: 1 },
    ],
    toast: 'LOOTED EXPANSE CACHE: +35 SCRAP, DEMANTOID FLASK & GRAIL WATER',
  },
};
