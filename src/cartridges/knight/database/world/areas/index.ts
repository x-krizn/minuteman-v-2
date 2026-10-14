/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaDefinition } from '../../../types';

const areaModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const areaMap = new Map<string, AreaDefinition>();

for (const [path, mod] of Object.entries(areaModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp &&
      'regionId' in exp
    ) {
      const area = exp as AreaDefinition;
      areaMap.set(area.id, area);
    }
  }
}

export const ALL_AREAS: AreaDefinition[] = Array.from(areaMap.values());

export const AREA_REGISTRY: Record<string, AreaDefinition> = ALL_AREAS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<string, AreaDefinition>
);

export function getAreaDefinition(id?: string): AreaDefinition | undefined {
  if (!id) return undefined;
  return AREA_REGISTRY[id];
}

export * from './forgotten_crypt';
export * from './verdant_ruins';
export * from './boss_arena';
