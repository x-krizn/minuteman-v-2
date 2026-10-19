/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../../types';

export const globalAetherCavernsBiome: BiomeDefinition = {
  id: 'global_aether_caverns',
  name: 'Ætheric Drift Caverns (Global)',
  scope: 'global',
  world: 'Sea of Æther',
  description:
    'Crystalline inter-world drift caverns saturated with luminous æther currents and high-corrosion pools.',
  clusterTileSheetBase64: 'ruins_tileset',
  defaultClusterTerrain: 'dirt',
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
    corrosiveWater: true,
    corrosiveDamagePerSec: 6.0,
    mudSlowMultiplier: 0.6,
    desyncPeriodSec: 3.0,
    aetherMistDensity: 0.8,
  },
  tileAssets: {
    groundPrimary: '#192538',
    groundSecondary: '#131d2d',
    mudColor: '#0e1624',
    waterColor: '#083344',
    waterRippleColor: '#06b6d4',
    pylonTop: '#0284c7',
    pylonFront: '#0f172a',
    pylonTrim: '#38bdf8',
    shadow: 'rgba(0, 0, 0, 0.5)',
    lightColor: '#22d3ee',
  },
  palette: {
    ground: '#192538',
    mud: '#0e1624',
    water: '#083344',
    pylonTop: '#0284c7',
    pylonFront: '#0f172a',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  lightColor: '#22d3ee',
};
