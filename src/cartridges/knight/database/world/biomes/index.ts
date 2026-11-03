/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../types';

// Dynamic auto-discovery for biomes
const biomeModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const biomeMap = new Map<string, BiomeDefinition>();

for (const [path, mod] of Object.entries(biomeModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp
    ) {
      const biome = exp as BiomeDefinition;
      biomeMap.set(biome.id, biome);
    }
  }
}

/**
 * Exported const `ALL_BIOMES` (all biomes) in `index.ts`.
 */
export const ALL_BIOMES: BiomeDefinition[] = Array.from(biomeMap.values());

/**
 * Exported const `BIOME_REGISTRY` (biome registry) in `index.ts`.
 */
export const BIOME_REGISTRY: Record<string, BiomeDefinition> = ALL_BIOMES.reduce(
  (acc, b) => {
    acc[b.id] = b;
    return acc;
  },
  {} as Record<string, BiomeDefinition>
);

/**
 * Executes `getBiomeDefinition` (get biome definition) in `index.ts`.
 */
export function getBiomeDefinition(id: string): BiomeDefinition | undefined {
  return BIOME_REGISTRY[id];
}
