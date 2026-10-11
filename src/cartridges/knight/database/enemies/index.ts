/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyType, EnemyWikiDefinition } from '../../types';

// Dynamic recursive auto-discovery: any new enemy file added is automatically detected!
const enemyModules = import.meta.glob('./**/*.ts', { eager: true });
const enemyMap = new Map<string, EnemyWikiDefinition>();

for (const path in enemyModules) {
  if (path.endsWith('index.ts')) continue;
  const mod = enemyModules[path] as Record<string, any>;
  for (const key in mod) {
    const val = mod[key];
    if (val && typeof val === 'object' && val.type && val.name) {
      enemyMap.set(val.type, val as EnemyWikiDefinition);
    }
  }
}

export const ALL_ENEMIES: EnemyWikiDefinition[] = Array.from(enemyMap.values());

export const ENEMY_REGISTRY: Record<EnemyType, EnemyWikiDefinition> = ALL_ENEMIES.reduce(
  (acc, e) => {
    acc[e.type] = e;
    return acc;
  },
  {} as Record<EnemyType, EnemyWikiDefinition>
);

export function getEnemyDefinition(type: EnemyType): EnemyWikiDefinition {
  return ENEMY_REGISTRY[type];
}
