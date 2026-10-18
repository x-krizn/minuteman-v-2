/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../types';
import { belldorBogBiome } from './local/belldor/belldor_bog';

// Recursive auto-discovery for global and hierarchy-nested local biome modules
const globalModules = import.meta.glob<Record<string, unknown>>('./global/**/*.ts', { eager: true });
const localModules = import.meta.glob<Record<string, unknown>>('./local/**/*.ts', { eager: true });

export const GLOBAL_BIOME_REGISTRY: Record<string, BiomeDefinition> = {};
export const LOCAL_BIOME_REGISTRY: Record<string, BiomeDefinition> = {};
export const BIOME_REGISTRY: Record<string, BiomeDefinition> = {};

function isBiomeDefinition(val: unknown): val is BiomeDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'scope' in val &&
    'tileRules' in val &&
    'tileAssets' in val
  );
}

for (const mod of Object.values(globalModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isBiomeDefinition(exportedValue)) {
      GLOBAL_BIOME_REGISTRY[exportedValue.id] = exportedValue;
      BIOME_REGISTRY[exportedValue.id] = exportedValue;
    }
  }
}

for (const mod of Object.values(localModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isBiomeDefinition(exportedValue)) {
      LOCAL_BIOME_REGISTRY[exportedValue.id] = exportedValue;
      BIOME_REGISTRY[exportedValue.id] = exportedValue;
    }
  }
}

export function getBiomeDefinition(biomeId?: string): BiomeDefinition {
  if (biomeId && BIOME_REGISTRY[biomeId]) {
    return BIOME_REGISTRY[biomeId];
  }
  return belldorBogBiome;
}

export { belldorBogBiome };
export type { BiomeDefinition };
