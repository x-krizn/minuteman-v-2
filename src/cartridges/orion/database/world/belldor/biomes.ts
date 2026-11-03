/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../types';

const DEFAULT_TILE_TYPES: Record<string, string> = {
  '.': 'floor',
  ',': 'grass',
  ':': 'ruins_floor',
  ';': 'mire_floor',
  '#': 'pylon_wall',
  P: 'pylon_pillar',
  '~': 'mud',
  _: 'chasm',
  D: 'drop_pod',
  S: 'fallen_scout',
  C: 'cache',
  V: 'chest',
  G: 'rusted_gate',
  '%': 'desync_wall',
  L: 'poe_lantern',
  '1': 'hidden_switch_1',
  '2': 'hidden_switch_2',
  '3': 'hidden_switch_3',
  '!': 'toggle_switch',
  M: 'cathedral_door',
  A: 'aether_waystation',
  Q: 'colossal_waygate',
};

/**
 * Canonical database definition for `belldorBogBiome` (`M00 Belldor Toxic Marshes`, id `'belldor_bog'`, scope `'local'`) — Deep toxic marshlands littered with orbital impact debris, ruined monastery pylons, and armor-eating bog water....
 */
export const belldorBogBiome: BiomeDefinition = {
  id: 'belldor_bog',
  name: 'M00 Belldor Toxic Marshes',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Deep toxic marshlands littered with orbital impact debris, ruined monastery pylons, and armor-eating bog water.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'dirt',
  tileTypes: { ...DEFAULT_TILE_TYPES },
  tileRules: {
    corrosiveWater: true,
    corrosiveDamagePerSec: 5.0,
    mudSlowMultiplier: 0.62,
    desyncPeriodSec: 3.5,
    aetherMistDensity: 0.5,
  },
  tileAssets: {
    groundPrimary: '#141d24',
    groundSecondary: '#11181f',
    mudColor: '#0f1716',
    waterColor: '#0b0e18',
    waterRippleColor: '#1f3430',
    pylonTop: '#33414d',
    pylonFront: '#151c24',
    pylonTrim: '#475563',
    shadow: 'rgba(2, 3, 10, 0.62)',
    lightColor: '#5694b8',
  },
  lightColor: '#5694b8',
  postProcess: {
    ambientDarkness: 0.94,
    bloomIntensity: 0.36,
    weather: 'rain',
    weatherIntensity: 0.65,
    liquidReflection: true,
    scanlines: false,
  },
};

/**
 * Canonical database definition for `orcSiegeEncampmentBiome` (`Novarin Orc Siegeworks`, id `'orc_siege_encampment'`, scope `'local'`) — Scorched forward siege trenches and ash-choked mud plains fortified by Novarin Orc Warlords..
 */
export const orcSiegeEncampmentBiome: BiomeDefinition = {
  id: 'orc_siege_encampment',
  name: 'Novarin Orc Siegeworks',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Scorched forward siege trenches and ash-choked mud plains fortified by Novarin Orc Warlords.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'dirt',
  tileTypes: { ...DEFAULT_TILE_TYPES },
  tileRules: {
    corrosiveWater: true,
    corrosiveDamagePerSec: 3.5,
    mudSlowMultiplier: 0.65,
    desyncPeriodSec: 4.0,
    aetherMistDensity: 0.3,
  },
  tileAssets: {
    groundPrimary: '#1c191a',
    groundSecondary: '#151314',
    mudColor: '#110f10',
    waterColor: '#140f12',
    waterRippleColor: '#2d201c',
    pylonTop: '#3f3d3e',
    pylonFront: '#1c1a1b',
    pylonTrim: '#575354',
    shadow: 'rgba(2, 3, 10, 0.65)',
    lightColor: '#d97706',
  },
  lightColor: '#d97706',
  postProcess: {
    ambientDarkness: 0.95,
    bloomIntensity: 0.38,
    weather: 'ash',
    weatherIntensity: 0.7,
    liquidReflection: true,
    scanlines: false,
  },
};

/**
 * Canonical database definition for `camelotBorderTownBiome` (`Camelot Border Town Desync`, id `'camelot_border_town'`, scope `'local'`) — Half-ruined border settlement trapped in a temporal desynchronization loop between intact stone and shattered ....
 */
export const camelotBorderTownBiome: BiomeDefinition = {
  id: 'camelot_border_town',
  name: 'Camelot Border Town Desync',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Half-ruined border settlement trapped in a temporal desynchronization loop between intact stone and shattered rubble.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'ruins',
  tileTypes: { ...DEFAULT_TILE_TYPES },
  tileRules: {
    corrosiveWater: false,
    corrosiveDamagePerSec: 0,
    mudSlowMultiplier: 0.78,
    desyncPeriodSec: 3.5,
    aetherMistDensity: 0.35,
  },
  tileAssets: {
    groundPrimary: '#1a2029',
    groundSecondary: '#141921',
    mudColor: '#10141b',
    waterColor: '#0e131d',
    waterRippleColor: '#242f3d',
    pylonTop: '#475569',
    pylonFront: '#1e2631',
    pylonTrim: '#64748b',
    shadow: 'rgba(2, 3, 10, 0.64)',
    lightColor: '#d97706',
  },
  lightColor: '#d97706',
  postProcess: {
    ambientDarkness: 0.95,
    bloomIntensity: 0.36,
    weather: 'aether_mist',
    weatherIntensity: 0.65,
    liquidReflection: true,
    scanlines: false,
  },
};

/**
 * Canonical database definition for `camelotWaygateSanctumBiome` (`Camelot Subterranean Waygate Vault`, id `'camelot_waygate_sanctum'`, scope `'local'`) — Ancient subterranean sanctum housing a Colossal Waygate that reads the pilot’s ætheric signature across the Se....
 */
export const camelotWaygateSanctumBiome: BiomeDefinition = {
  id: 'camelot_waygate_sanctum',
  name: 'Camelot Subterranean Waygate Vault',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Ancient subterranean sanctum housing a Colossal Waygate that reads the pilot’s ætheric signature across the Sea of Æther.',
  clusterTileSheetBase64: 'bog_tileset',
  defaultClusterTerrain: 'ruins',
  tileTypes: { ...DEFAULT_TILE_TYPES },
  tileRules: {
    corrosiveWater: false,
    corrosiveDamagePerSec: 0,
    mudSlowMultiplier: 0.85,
    desyncPeriodSec: 3.0,
    aetherMistDensity: 0.75,
  },
  tileAssets: {
    groundPrimary: '#111624',
    groundSecondary: '#0c101b',
    mudColor: '#080b14',
    waterColor: '#091e2e',
    waterRippleColor: '#1e5b7a',
    pylonTop: '#2b6cb0',
    pylonFront: '#121926',
    pylonTrim: '#4a8bb8',
    shadow: 'rgba(2, 3, 10, 0.68)',
    lightColor: '#38bdf8',
  },
  lightColor: '#38bdf8',
  postProcess: {
    ambientDarkness: 0.96,
    bloomIntensity: 0.4,
    weather: 'aether_mist',
    weatherIntensity: 0.75,
    liquidReflection: true,
    scanlines: false,
  },
};
