/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemySpawnMap, EnemySpawnOverride, EnemyWikiDefinition } from '../../types';

// [ORION-ANCHOR: ENEMY-GLOB-REGISTRY]
// Auto-discover all enemy entity modules in this directory (including subfolders) via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

/**
 * Exported const `ENEMY_REGISTRY` (enemy registry) in `index.ts`.
 */
export const ENEMY_REGISTRY: Record<string, EnemyWikiDefinition> = {};
/**
 * Exported const `CHAR_TO_ENEMY_TYPE` (char to enemy type) in `index.ts`.
 */
export const CHAR_TO_ENEMY_TYPE: Record<string, string> = {};
/**
 * Exported const `ENEMY_SPAWN_COLLISIONS` (enemy spawn collisions) in `index.ts`.
 */
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
        }
        CHAR_TO_ENEMY_TYPE[exportedValue.spawnChar] = exportedValue.type;
      }
    }
  }
}

// [ORION-ANCHOR: ENEMY-SPAWN-RESOLVER]
/**
 * Executes `getEnemyDefinition` (get enemy definition) in `index.ts`.
 */
export function getEnemyDefinition(type: string): EnemyWikiDefinition | undefined {
  return ENEMY_REGISTRY[type];
}

/**
 * Resolves a single `EnemySpawnOverride` (`string | string[]`) to an enemy type ID using `occurrenceIndex` (`0`-based).
 */
export function resolveEnemySpawnOverride(
  override: EnemySpawnOverride | undefined,
  occurrenceIndex: number = 0
): string | undefined {
  if (!override) return undefined;
  if (typeof override === 'string') return override;
  if (override.length === 0) return undefined;
  const safeIdx = Math.max(0, Math.floor(occurrenceIndex)) % override.length;
  return override[safeIdx];
}

/**
 * Executes `resolveEnemyTypeForChar` (resolve enemy type for char) in `index.ts`.
 */
export function resolveEnemyTypeForChar(
  char: string,
  biomeEnemyMap?: EnemySpawnMap,
  occurrenceIndex: number = 0
): string | undefined {
  const mapped = resolveEnemySpawnOverride(biomeEnemyMap?.[char], occurrenceIndex);
  if (mapped) {
    return mapped;
  }
  return CHAR_TO_ENEMY_TYPE[char];
}

/**
 * Executes `getEnemyBySpawnChar` (get enemy by spawn char) in `index.ts`.
 */
export function getEnemyBySpawnChar(
  char: string,
  biomeEnemyMap?: EnemySpawnMap,
  occurrenceIndex: number = 0
): EnemyWikiDefinition | undefined {
  const type = resolveEnemyTypeForChar(char, biomeEnemyMap, occurrenceIndex);
  return type ? ENEMY_REGISTRY[type] : undefined;
}
