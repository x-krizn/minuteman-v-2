/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyType, EnemyWikiDefinition } from '../../types';

// Dynamic recursive auto-discovery — every new enemy file added is automatically detected!
const enemyModules = import.meta.glob('./**/*.ts', { eager: true });
const enemyMap = new Map<string, EnemyWikiDefinition>();

for (const path in enemyModules) {
  if (path.endsWith('index.ts')) continue;
  const mod = enemyModules[path] as Record<string, unknown>;
  for (const key in mod) {
    const val = mod[key];
    if (val && typeof val === 'object' && 'type' in val && 'name' in val) {
      const def = val as EnemyWikiDefinition;
      enemyMap.set(def.type, def);
    }
  }
}

/**
 * List of all auto-discovered `EnemyWikiDefinition` entries in the Knight cartridge.
 */
export const ALL_ENEMIES: EnemyWikiDefinition[] = Array.from(enemyMap.values());

/**
 * Lookup table mapping each `EnemyType` identifier to its `EnemyWikiDefinition`.
 */
export const ENEMY_REGISTRY: Record<EnemyType, EnemyWikiDefinition> = ALL_ENEMIES.reduce(
  (acc, e) => {
    acc[e.type] = e;
    return acc;
  },
  {} as Record<EnemyType, EnemyWikiDefinition>
);

/**
 * Returns the `EnemyWikiDefinition` for the specified `type`.
 */
export function getEnemyDefinition(type: EnemyType): EnemyWikiDefinition {
  return ENEMY_REGISTRY[type];
}
