/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';
import { getBiomeDefinition } from '../../biomes';
import { groundTile } from './floor';

// Auto-discover all tile entity modules in this directory via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./*.ts', { eager: true });

export const TILE_REGISTRY: Record<string, TileDefinition> = {};
export const TILE_BY_ID_REGISTRY: Record<string, TileDefinition> = {};

function isTileDefinition(val: unknown): val is TileDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'char' in val &&
    'type' in val &&
    'solid' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isTileDefinition(exportedValue)) {
      TILE_REGISTRY[exportedValue.char] = exportedValue;
      TILE_BY_ID_REGISTRY[exportedValue.id] = exportedValue;
    }
  }
}

/**
 * Resolve a tile character into its TileDefinition, honoring the active Biome's
 * tileTypes mapping when provided.
 */
export function getTileDefinition(char: string, biomeId?: string): TileDefinition {
  if (biomeId) {
    const biome = getBiomeDefinition(biomeId);
    const mappedId = biome.tileTypes?.[char];
    if (mappedId && TILE_BY_ID_REGISTRY[mappedId]) {
      return TILE_BY_ID_REGISTRY[mappedId];
    }
  }
  return TILE_REGISTRY[char] || TILE_REGISTRY['.'] || groundTile;
}
