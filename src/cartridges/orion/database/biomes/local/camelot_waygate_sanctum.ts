/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../types';

export const camelotWaygateSanctumBiome: BiomeDefinition = {
  id: 'camelot_waygate_sanctum',
  name: 'Camelot Subterranean Waygate Sanctum',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Ancient stone, root, and mineral vault beneath the Cathedral housing the colossal Camelot Waygate.',
  tileTypes: {
    '.': 'floor',
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
    mudSlowMultiplier: 0.9,
    desyncPeriodSec: 2.5,
    aetherMistDensity: 0.75,
  },
  tileAssets: {
    groundPrimary: '#1a2736',
    groundSecondary: '#141f2c',
    mudColor: '#0f172a',
    waterColor: '#0c4a6e',
    waterRippleColor: '#38bdf8',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    pylonTrim: '#38bdf8',
    shadow: 'rgba(0, 0, 0, 0.5)',
    lightColor: '#38bdf8',
  },
  palette: {
    ground: '#1a2736',
    mud: '#0f172a',
    water: '#0c4a6e',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  lightColor: '#38bdf8',
};
