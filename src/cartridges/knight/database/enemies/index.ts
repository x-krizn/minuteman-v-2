/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyType, EnemyWikiDefinition } from '../../types';
import { crawlerEnemy } from './crawler';
import { sentryEnemy } from './sentry';
import { wispEnemy } from './wisp';

export const ALL_ENEMIES: EnemyWikiDefinition[] = [
  crawlerEnemy,
  sentryEnemy,
  wispEnemy,
];

export const ENEMY_REGISTRY: Record<EnemyType, EnemyWikiDefinition> = {
  crawler: crawlerEnemy,
  sentry: sentryEnemy,
  wisp: wispEnemy,
};

export function getEnemyDefinition(type: EnemyType): EnemyWikiDefinition {
  return ENEMY_REGISTRY[type];
}

export * from './crawler';
export * from './sentry';
export * from './wisp';
