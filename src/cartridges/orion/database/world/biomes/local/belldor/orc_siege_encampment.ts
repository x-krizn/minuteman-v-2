/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../../../types';

export const orcSiegeEncampmentBiome: BiomeDefinition = {
  id: 'orc_siege_encampment',
  name: 'Novarin Orc Siegeworks',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Scorched earth, iron siege palisades, and acidic oil trenches staging Novarin orc raids against Camelot Border Town.',
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
    corrosiveDamagePerSec: 6.0,
    mudSlowMultiplier: 0.6,
    desyncPeriodSec: 4.5,
    aetherMistDensity: 0.3,
  },
  tileAssets: {
    groundPrimary: '#362624',
    groundSecondary: '#2b1e1c',
    mudColor: '#211513',
    waterColor: '#291811',
    waterRippleColor: '#ea580c',
    pylonTop: '#57534e',
    pylonFront: '#292524',
    pylonTrim: '#78716c',
    shadow: 'rgba(0, 0, 0, 0.45)',
    lightColor: '#fb923c',
  },
  palette: {
    ground: '#362624',
    mud: '#211513',
    water: '#291811',
    pylonTop: '#57534e',
    pylonFront: '#292524',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
  lightColor: '#fb923c',
};
