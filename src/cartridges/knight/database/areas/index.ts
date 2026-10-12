/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaDefinition } from '../../types';

// Dynamic recursive auto-discovery of all area definitions
const areaModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const collectedAreas: AreaDefinition[] = [];

for (const [path, mod] of Object.entries(areaModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp &&
      'type' in exp
    ) {
      collectedAreas.push(exp as AreaDefinition);
    }
  }
}

export const ALL_AREAS: AreaDefinition[] = collectedAreas;

export const AREA_REGISTRY: Record<string, AreaDefinition> = ALL_AREAS.reduce(
  (acc, area) => {
    acc[area.id] = area;
    return acc;
  },
  {} as Record<string, AreaDefinition>
);

export function getAreaDefinition(id?: string): AreaDefinition | undefined {
  return (id && AREA_REGISTRY[id]) || AREA_REGISTRY['tutorial'] || ALL_AREAS[0];
}
