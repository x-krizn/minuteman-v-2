/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../../../types';

export const tyrranusColosseumOutpostBiome: BiomeDefinition = {
  id: 'tyrranus_colosseum_outpost',
  name: 'Tyrranus Marble Gatehead',
  scope: 'local',
  world: 'Tyrranus',
  description:
    'Sun-bleached Greco-Roman marble colonnades and bronze conduits framing the Tyrranus Waygate frontier.',
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
    mudSlowMultiplier: 0.92,
    desyncPeriodSec: 3.8,
    aetherMistDensity: 0.25,
  },
  tileAssets: {
    groundPrimary: '#3b3731',
    groundSecondary: '#302c27',
    mudColor: '#26231f',
    waterColor: '#0e4f63',
    waterRippleColor: '#67e8f9',
    pylonTop: '#a8a29e',
    pylonFront: '#57534e',
    pylonTrim: '#fbbf24',
    shadow: 'rgba(0, 0, 0, 0.38)',
    lightColor: '#fde68a',
  },
  palette: {
    ground: '#3b3731',
    mud: '#26231f',
    water: '#0e4f63',
    pylonTop: '#a8a29e',
    pylonFront: '#57534e',
    shadow: 'rgba(0, 0, 0, 0.38)',
  },
  lightColor: '#fde68a',
};
