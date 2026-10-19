/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../../../types';

export const camelotWaygateSanctumBiome: BiomeDefinition = {
  id: 'camelot_waygate_sanctum',
  name: 'Camelot Subterranean Waygate Vault',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description:
    'Ancient subterranean sanctum housing a Colossal Waygate that reads the pilot’s ætheric signature across the Sea of Æther.',
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
    mudSlowMultiplier: 0.85,
    desyncPeriodSec: 3.0,
    aetherMistDensity: 0.75,
  },
  tileAssets: {
    groundPrimary: '#1b2436',
    groundSecondary: '#151c2b',
    mudColor: '#0f172a',
    waterColor: '#0c4a6e',
    waterRippleColor: '#38bdf8',
    pylonTop: '#38bdf8',
    pylonFront: '#1e293b',
    pylonTrim: '#7dd3fc',
    shadow: 'rgba(0, 0, 0, 0.5)',
    lightColor: '#38bdf8',
  },
  palette: {
    ground: '#1b2436',
    mud: '#0f172a',
    water: '#0c4a6e',
    pylonTop: '#38bdf8',
    pylonFront: '#1e293b',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  lightColor: '#38bdf8',
};
