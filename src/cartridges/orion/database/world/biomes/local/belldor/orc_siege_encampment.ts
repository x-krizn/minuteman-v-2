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
    'Scorched forward siege trenches and ash-choked mud plains fortified by Novarin Orc Warlords.',
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
    corrosiveDamagePerSec: 3.5,
    mudSlowMultiplier: 0.65,
    desyncPeriodSec: 4.0,
    aetherMistDensity: 0.3,
  },
  tileAssets: {
    groundPrimary: '#2f2926',
    groundSecondary: '#26211e',
    mudColor: '#1c1816',
    waterColor: '#291d18',
    waterRippleColor: '#452c20',
    pylonTop: '#57534e',
    pylonFront: '#292524',
    pylonTrim: '#78716c',
    shadow: 'rgba(0, 0, 0, 0.45)',
    lightColor: '#f97316',
  },
  palette: {
    ground: '#2f2926',
    mud: '#1c1816',
    water: '#291d18',
    pylonTop: '#57534e',
    pylonFront: '#292524',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
  lightColor: '#f97316',
};
