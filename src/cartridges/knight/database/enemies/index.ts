/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyType, EnemyWikiDefinition } from '../../types';
import { crawlerEnemy } from './crawler';
import { sentryEnemy } from './sentry';
import { wispEnemy } from './wisp';

// Dynamic auto-discovery: any new enemy file added is automatically detected!
const enemyModules = import.meta.glob('./*.ts', { eager: true });
const discoveredEnemies: EnemyWikiDefinition[] = [];

for (const path in enemyModules) {
  if (path.endsWith('index.ts')) continue;
  const mod = enemyModules[path] as Record<string, any>;
  for (const key in mod) {
    const val = mod[key];
    if (val && typeof val === 'object' && val.type && val.name && val.hp !== undefined) {
      if (!discoveredEnemies.some((e) => e.type === val.type)) {
        discoveredEnemies.push(val as EnemyWikiDefinition);
      }
    }
  }
}

const baseEnemies: EnemyWikiDefinition[] = [
  crawlerEnemy,
  sentryEnemy,
  wispEnemy,
];

for (const e of discoveredEnemies) {
  if (!baseEnemies.some((b) => b.type === e.type)) {
    baseEnemies.push(e);
  }
}

export const ALL_ENEMIES: EnemyWikiDefinition[] = baseEnemies;

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

export * from './crawler';
export * from './sentry';
export * from './wisp';
