/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../types';

export const globalAetherCavernsBiome: BiomeDefinition = {
  id: 'global_aether_caverns',
  name: 'Ætheric Drift Caverns (Global)',
  scope: 'global',
  world: 'Shattered Worlds',
  description:
    'Subterranean mineral-and-root passages resonating with tuning crystal frequencies between waygate anchors.',
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
    mudSlowMultiplier: 0.85,
    desyncPeriodSec: 2.2,
    aetherMistDensity: 0.85,
  },
  tileAssets: {
    groundPrimary: '#17253b',
    groundSecondary: '#111c2d',
    mudColor: '#0f172a',
    waterColor: '#083344',
    waterRippleColor: '#22d3ee',
    pylonTop: '#38bdf8',
    pylonFront: '#1e3a5f',
    pylonTrim: '#7dd3fc',
    shadow: 'rgba(0, 0, 0, 0.5)',
    lightColor: '#38bdf8',
  },
  palette: {
    ground: '#17253b',
    mud: '#0f172a',
    water: '#083344',
    pylonTop: '#38bdf8',
    pylonFront: '#1e3a5f',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  lightColor: '#38bdf8',
};
