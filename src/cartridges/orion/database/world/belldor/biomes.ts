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
    groundPrimary: '#253243',
    groundSecondary: '#1f2a38',
    mudColor: '#17202a',
    waterColor: '#17202a',
    waterRippleColor: '#22303f',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    pylonTrim: '#64748b',
    shadow: 'rgba(0, 0, 0, 0.4)',
    lightColor: '#77c7ff',
  },
  lightColor: '#77c7ff',
};

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
    groundPrimary: '#2f2926',
    groundSecondary: '#26211e',
    mudColor: '#1c1816',
    waterColor: '#291d18',
    waterRippleColor: '#452c20',
    pylonTop: '#57534e',
    pylonFront: '#292524',
    pylonTrim: '#78716c',
    shadow: 'rgba(0, 0, 0, 0.45)',
    lightColor: '#f97316',
  },
  lightColor: '#f97316',
};

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
    groundPrimary: '#2c3340',
    groundSecondary: '#252b36',
    mudColor: '#1e242d',
    waterColor: '#1f2937',
    waterRippleColor: '#374151',
    pylonTop: '#64748b',
    pylonFront: '#334155',
    pylonTrim: '#94a3b8',
    shadow: 'rgba(0, 0, 0, 0.45)',
    lightColor: '#f59e0b',
  },
  lightColor: '#f59e0b',
};

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
    groundPrimary: '#1b2436',
    groundSecondary: '#151c2b',
    mudColor: '#0f172a',
    waterColor: '#0c4a6e',
    waterRippleColor: '#38bdf8',
    pylonTop: '#38bdf8',
    pylonFront: '#1e293b',
    pylonTrim: '#7dd3fc',
    shadow: 'rgba(0, 0, 0, 0.5)',
    lightColor: '#38bdf8',
  },
  lightColor: '#38bdf8',
};
