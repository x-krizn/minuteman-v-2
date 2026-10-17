/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyWikiDefinition } from '../../types';

// Auto-discover all enemy entity modules in this directory via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./*.ts', { eager: true });

export const ENEMY_REGISTRY: Record<string, EnemyWikiDefinition> = {};
export const CHAR_TO_ENEMY_TYPE: Record<string, string> = {};

function isEnemyWikiDefinition(val: unknown): val is EnemyWikiDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'type' in val &&
    'name' in val &&
    'frameIntegrity' in val &&
    'update' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isEnemyWikiDefinition(exportedValue)) {
      ENEMY_REGISTRY[exportedValue.type] = exportedValue;
      if (exportedValue.spawnChar) {
        CHAR_TO_ENEMY_TYPE[exportedValue.spawnChar] = exportedValue.type;
      }
    }
  }
}

export function getEnemyDefinition(type: string): EnemyWikiDefinition | undefined {
  return ENEMY_REGISTRY[type];
}

export function getEnemyBySpawnChar(char: string): EnemyWikiDefinition | undefined {
  const type = CHAR_TO_ENEMY_TYPE[char];
  return type ? ENEMY_REGISTRY[type] : undefined;
}
