/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../../../types';

export const belldorBogBiome: BiomeDefinition = {
  id: 'belldor_bog',
  name: 'M00 Belldor Toxic Marshes',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Deep toxic marshlands littered with orbital impact debris, ruined monastery pylons, and armor-eating bog water.',
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
  palette: {
    ground: '#253243',
    mud: '#17202a',
    water: '#0c4a6e',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
  lightColor: '#77c7ff',
};
