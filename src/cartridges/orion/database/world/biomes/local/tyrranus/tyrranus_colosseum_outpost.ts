/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../../../types';

export const tyrranusColosseumOutpostBiome: BiomeDefinition = {
  id: 'tyrranus_colosseum_outpost',
  name: 'Tyrranus Marble Gatehead',
  scope: 'local',
  world: 'Tyrranus (Rome)',
  description:
    'Imperial marble causeways and crimson-lit legionnaire bastions on the aligned world of Tyrranus.',
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
    mudSlowMultiplier: 0.8,
    desyncPeriodSec: 3.5,
    aetherMistDensity: 0.25,
  },
  tileAssets: {
    groundPrimary: '#362b2e',
    groundSecondary: '#2b2225',
    mudColor: '#1f181b',
    waterColor: '#3b1c24',
    waterRippleColor: '#f43f5e',
    pylonTop: '#9f1239',
    pylonFront: '#4c0519',
    pylonTrim: '#fbbf24',
    shadow: 'rgba(0, 0, 0, 0.45)',
    lightColor: '#fb7185',
  },
  palette: {
    ground: '#362b2e',
    mud: '#1f181b',
    water: '#3b1c24',
    pylonTop: '#9f1239',
    pylonFront: '#4c0519',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
  lightColor: '#fb7185',
};
