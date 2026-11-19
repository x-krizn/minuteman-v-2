/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemySpawnMap } from '../../../types';

/**
 * Canonical default mapping of ASCII room characters to global `TileDefinition` IDs
 * shared across all overworld and inter-world biomes.
 */
export const DEFAULT_BIOME_TILE_TYPES: Record<string, string> = {
  '.': 'floor',
  ',': 'grass',
  ':': 'ruins_floor',
  ';': 'mire_floor',
  '#': 'pylon_wall',
  P: 'pylon_pillar',
  '~': 'mud',
  _: 'chasm',
  D: 'drop_pod',
  S: 'fallen_scout',
  C: 'cache',
  V: 'chest',
  G: 'rusted_gate',
  '%': 'desync_wall',
  L: 'poe_lantern',
  '1': 'hidden_switch_1',
  '2': 'hidden_switch_2',
  '3': 'hidden_switch_3',
  '!': 'toggle_switch',
  M: 'cathedral_door',
  A: 'aether_waystation',
  Q: 'colossal_waygate',
};

/**
 * Canonical default mapping of conserved ASCII role characters (`'E'`, `'W'`, `'p'`, `'K'`, `'o'`, `'s'`, `'N'`)
 * to concrete enemy archetype IDs shared across all overworld and inter-world biomes.
 */
export const DEFAULT_BIOME_ENEMY_SPAWN_TYPES: EnemySpawnMap = {
  E: 'bog_crawler',
  W: 'bog_wurm',
  p: 'bog_poe',
  K: 'camelot_knight',
  o: 'orc_warrior',
  s: 'orc_scout',
  N: 'town_npc',
};
