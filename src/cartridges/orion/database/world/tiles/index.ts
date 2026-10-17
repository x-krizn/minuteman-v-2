/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';
import { groundTile } from './floor';

// Auto-discover all tile entity modules in this directory via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./*.ts', { eager: true });

export const TILE_REGISTRY: Record<string, TileDefinition> = {};

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
    }
  }
}

export function getTileDefinition(char: string): TileDefinition {
  return TILE_REGISTRY[char] || TILE_REGISTRY['.'] || groundTile;
}
