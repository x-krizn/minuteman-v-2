/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalMapDefinition } from '../../../../types';

const localMapModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const localMapStorage = new Map<string, LocalMapDefinition>();

for (const [path, mod] of Object.entries(localMapModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp &&
      'spawnPoint' in exp &&
      'rooms' in exp
    ) {
      const mapDef = exp as LocalMapDefinition;
      localMapStorage.set(mapDef.id, mapDef);
    }
  }
}

export const ALL_LOCAL_MAPS: LocalMapDefinition[] = Array.from(localMapStorage.values());

export const LOCAL_MAP_REGISTRY: Record<string, LocalMapDefinition> = ALL_LOCAL_MAPS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<string, LocalMapDefinition>
);

export function getLocalMapDefinition(id: string): LocalMapDefinition | undefined {
  return LOCAL_MAP_REGISTRY[id];
}

export * from './tutorial';
