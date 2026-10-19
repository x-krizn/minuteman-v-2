/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../../../types';

export const camelotBorderTownBiome: BiomeDefinition = {
  id: 'camelot_border_town',
  name: 'Camelot Border Town Desync',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Half-ruined border settlement trapped in a temporal desynchronization loop between intact stone and shattered rubble.',
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
  palette: {
    ground: '#2c3340',
    mud: '#1e242d',
    water: '#1f2937',
    pylonTop: '#64748b',
    pylonFront: '#334155',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
  lightColor: '#f59e0b',
};
