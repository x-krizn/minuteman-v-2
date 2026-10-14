/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegionDefinition } from '../../../types';

const regionModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const regionMap = new Map<string, RegionDefinition>();

for (const [path, mod] of Object.entries(regionModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp &&
      'areaIds' in exp
    ) {
      const region = exp as RegionDefinition;
      regionMap.set(region.id, region);
    }
  }
}

export const ALL_REGIONS: RegionDefinition[] = Array.from(regionMap.values());

export const REGION_REGISTRY: Record<string, RegionDefinition> = ALL_REGIONS.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<string, RegionDefinition>
);

export function getRegionDefinition(id: string): RegionDefinition | undefined {
  return REGION_REGISTRY[id];
}

export * from './ancient_depths';
export * from './verdant_reach';
