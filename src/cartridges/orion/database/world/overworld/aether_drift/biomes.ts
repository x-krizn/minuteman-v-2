/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../../types';
import {
  DEFAULT_BIOME_ENEMY_SPAWN_TYPES,
  DEFAULT_BIOME_TILE_TYPES,
} from '../../global/templates';

/**
 * Canonical database definition for `globalAetherCavernsBiome` (`Ætheric Drift Caverns (Global)`, id `'global_aether_caverns'`, scope `'global'`) —
 * Crystalline inter-world drift caverns saturated with luminous æther currents and high-corrosion pools.
 */
export const globalAetherCavernsBiome: BiomeDefinition = {
  id: 'global_aether_caverns',
  name: 'Ætheric Drift Caverns (Global)',
  scope: 'global',
  world: 'Sea of Æther',
  description:
    'Crystalline inter-world drift caverns saturated with luminous æther currents and high-corrosion pools.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'dirt',
  tileTypes: { ...DEFAULT_BIOME_TILE_TYPES },
  enemySpawnTypes: { ...DEFAULT_BIOME_ENEMY_SPAWN_TYPES },
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
  postProcess: {
    ambientDarkness: 0.95,
    bloomIntensity: 0.4,
    weather: 'aether_mist',
    weatherIntensity: 0.8,
    liquidReflection: true,
    scanlines: false,
  },
};

/**
 * Canonical database definition for `globalDesyncRuinsBiome` (`Desynchronized Stone Ruins (Global)`, id `'global_desync_ruins'`, scope `'global'`) —
 * Procedural ruined masonry biome with rapid temporal wall phasing and ancient stone flagstones.
 */
export const globalDesyncRuinsBiome: BiomeDefinition = {
  id: 'global_desync_ruins',
  name: 'Desynchronized Stone Ruins (Global)',
  scope: 'global',
  world: 'Shattered Worlds',
  description:
    'Procedural ruined masonry biome with rapid temporal wall phasing and ancient stone flagstones.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'ruins',
  tileTypes: { ...DEFAULT_BIOME_TILE_TYPES },
  enemySpawnTypes: { ...DEFAULT_BIOME_ENEMY_SPAWN_TYPES },
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
  postProcess: {
    ambientDarkness: 0.94,
    bloomIntensity: 0.35,
    weather: 'aether_mist',
    weatherIntensity: 0.5,
    liquidReflection: true,
    scanlines: false,
  },
};

/**
 * Canonical database definition for `globalToxicWetlandsBiome` (`Toxic MarshWilds (Global)`, id `'global_toxic_wetlands'`, scope `'global'`) —
 * Procedural marshland biome supplying corrosive bog water, mud drag rules, and overgrown pylon assets to global wetland rooms.
 */
export const globalToxicWetlandsBiome: BiomeDefinition = {
  id: 'global_toxic_wetlands',
  name: 'Toxic MarshWilds (Global)',
  scope: 'global',
  world: 'Shattered Worlds',
  description:
    'Procedural marshland biome supplying corrosive bog water, mud drag rules, and overgrown pylon assets to global wetland rooms.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'grass',
  tileTypes: { ...DEFAULT_BIOME_TILE_TYPES },
  enemySpawnTypes: { ...DEFAULT_BIOME_ENEMY_SPAWN_TYPES },
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
  postProcess: {
    ambientDarkness: 0.94,
    bloomIntensity: 0.36,
    weather: 'rain',
    weatherIntensity: 0.55,
    liquidReflection: true,
    scanlines: false,
  },
};
