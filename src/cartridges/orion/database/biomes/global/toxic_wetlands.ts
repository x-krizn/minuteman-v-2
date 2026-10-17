/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../types';

const DEFAULT_TILE_TYPES: Record<string, string> = {
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
};

export const globalToxicWetlandsBiome: BiomeDefinition = {
  id: 'global_toxic_wetlands',
  name: 'Toxic MarshWilds (Global)',
  scope: 'global',
  world: 'Shattered Worlds',
  description:
    'Procedural marshland biome supplying corrosive bog water, mud drag rules, and overgrown pylon assets to global wetland rooms.',
  tileTypes: { ...DEFAULT_TILE_TYPES },
  tileRules: {
    corrosiveWater: true,
    corrosiveDamagePerSec: 4.5,
    mudSlowMultiplier: 0.65,
    desyncPeriodSec: 4.0,
    aetherMistDensity: 0.4,
  },
  tileAssets: {
    groundPrimary: '#23313f',
    groundSecondary: '#1c2733',
    mudColor: '#152028',
    waterColor: '#132a38',
    waterRippleColor: '#24485c',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    pylonTrim: '#64748b',
    shadow: 'rgba(0, 0, 0, 0.4)',
    lightColor: '#67e8f9',
  },
  palette: {
    ground: '#23313f',
    mud: '#152028',
    water: '#132a38',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
  lightColor: '#67e8f9',
};
