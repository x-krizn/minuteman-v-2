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
    'Procedural ruined stone biome supplying rapid temporal phase-flicker rules, non-corrosive rain basins, and fractured masonry assets.',
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
    mudSlowMultiplier: 0.8,
    desyncPeriodSec: 2.8,
    aetherMistDensity: 0.65,
  },
  tileAssets: {
    groundPrimary: '#2e293a',
    groundSecondary: '#252030',
    mudColor: '#1f1b29',
    waterColor: '#1e293b',
    waterRippleColor: '#38bdf8',
    pylonTop: '#64748b',
    pylonFront: '#334155',
    pylonTrim: '#94a3b8',
    shadow: 'rgba(0, 0, 0, 0.45)',
    lightColor: '#c084fc',
  },
  palette: {
    ground: '#2e293a',
    mud: '#1f1b29',
    water: '#1e293b',
    pylonTop: '#64748b',
    pylonFront: '#334155',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
  lightColor: '#c084fc',
};
