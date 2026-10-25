/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyWikiDefinition } from '../../types';

// [ORION-ANCHOR: ENEMY-GLOB-REGISTRY]
// Auto-discover all enemy entity modules in this directory (including subfolders) via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

export const ENEMY_REGISTRY: Record<string, EnemyWikiDefinition> = {};
export const CHAR_TO_ENEMY_TYPE: Record<string, string> = {};
export const ENEMY_SPAWN_COLLISIONS: string[] = [];

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
        const existing = CHAR_TO_ENEMY_TYPE[exportedValue.spawnChar];
        if (existing && existing !== exportedValue.type) {
          const msg = `[Orion ASCII Audit] Duplicate global enemy spawnChar '${exportedValue.spawnChar}' claimed by '${existing}' and '${exportedValue.type}'. Use biome.enemySpawnTypes to scope per biome.`;
          ENEMY_SPAWN_COLLISIONS.push(msg);
          console.warn(msg);
        }
        CHAR_TO_ENEMY_TYPE[exportedValue.spawnChar] = exportedValue.type;
      }
    }
  }
}

// [ORION-ANCHOR: ENEMY-SPAWN-RESOLVER]
export function getEnemyDefinition(type: string): EnemyWikiDefinition | undefined {
  return ENEMY_REGISTRY[type];
}

export function resolveEnemyTypeForChar(
  char: string,
  biomeEnemyMap?: Record<string, string>
): string | undefined {
  if (biomeEnemyMap && biomeEnemyMap[char]) {
    return biomeEnemyMap[char];
  }
  return CHAR_TO_ENEMY_TYPE[char];
}

export function getEnemyBySpawnChar(
  char: string,
  biomeEnemyMap?: Record<string, string>
): EnemyWikiDefinition | undefined {
  const type = resolveEnemyTypeForChar(char, biomeEnemyMap);
  return type ? ENEMY_REGISTRY[type] : undefined;
}
