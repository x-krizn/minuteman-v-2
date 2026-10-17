/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../types';

export const camelotBorderTownBiome: BiomeDefinition = {
  id: 'camelot_border_town',
  name: 'Camelot Border Town Desync',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Contested settlement cobblestones and gothic arcades flickering between intact masonry and shattered ruin under Grail Sickness.',
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
    mudSlowMultiplier: 0.78,
    desyncPeriodSec: 3.0,
    aetherMistDensity: 0.35,
  },
  tileAssets: {
    groundPrimary: '#2b2d3c',
    groundSecondary: '#232533',
    mudColor: '#1e202b',
    waterColor: '#1e293b',
    waterRippleColor: '#475569',
    pylonTop: '#64748b',
    pylonFront: '#334155',
    pylonTrim: '#94a3b8',
    shadow: 'rgba(0, 0, 0, 0.42)',
    lightColor: '#ffd27d',
  },
  palette: {
    ground: '#2b2d3c',
    mud: '#1e202b',
    water: '#1e293b',
    pylonTop: '#64748b',
    pylonFront: '#334155',
    shadow: 'rgba(0, 0, 0, 0.42)',
  },
  lightColor: '#ffd27d',
};
