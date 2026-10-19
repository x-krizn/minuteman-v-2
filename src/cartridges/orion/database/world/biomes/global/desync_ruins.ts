/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../../types';

export const globalDesyncRuinsBiome: BiomeDefinition = {
  id: 'global_desync_ruins',
  name: 'Desynchronized Stone Ruins (Global)',
  scope: 'global',
  world: 'Shattered Worlds',
  description:
    'Procedural ruined masonry biome with rapid temporal wall phasing and ancient stone flagstones.',
  clusterTileSheetBase64: 'ruins_tileset',
  defaultClusterTerrain: 'ruins',
  tileTypes: {
    '.': 'floor',
    ',': 'grass',
    ':': 'ruins_floor',
    '#': 'pylon_wall',
    P: 'pylon_pillar',
    '~': 'mud',
    _: 'chasm',
    D: 'drop_pod',
    S: 'fallen_scout',
    C: 'cache',
    G: 'rusted_gate',
    '%': 'desync_wall',
    L: 'poe_lantern',
    '1': 'hidden_switch',
    '2': 'hidden_switch',
    '3': 'hidden_switch',
    M: 'cathedral_door',
    A: 'aether_waystation',
    Q: 'colossal_waygate',
  },
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
  palette: {
    ground: '#2a303c',
    mud: '#1a1e26',
    water: '#1e293b',
    pylonTop: '#64748b',
    pylonFront: '#334155',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
  lightColor: '#cbd5e1',
};
