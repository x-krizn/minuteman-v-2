/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KnightState, TileDefinition } from '../../../types';

// Dynamic recursive auto-discovery: any new tile file added is automatically detected!
const tileModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const tileMap = new Map<string, TileDefinition>();

for (const [path, mod] of Object.entries(tileModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'symbol' in exp &&
      'name' in exp
    ) {
      const tile = exp as TileDefinition;
      tileMap.set(tile.id, tile);
    }
  }
}

export const ALL_TILES: TileDefinition[] = Array.from(tileMap.values());

export const TILE_REGISTRY: Record<string, TileDefinition> = ALL_TILES.reduce(
  (acc, tile) => {
    acc[tile.id] = tile;
    return acc;
  },
  {} as Record<string, TileDefinition>
);

export const TILE_BY_SYMBOL: Record<string, TileDefinition> = ALL_TILES.reduce(
  (acc, tile) => {
    acc[tile.symbol] = tile;
    return acc;
  },
  {} as Record<string, TileDefinition>
);

export function getTileDefinition(idOrSymbol: string): TileDefinition | undefined {
  return TILE_REGISTRY[idOrSymbol] || TILE_BY_SYMBOL[idOrSymbol];
}

/**
 * Checks whether a given character at room coordinates is solid,
 * delegating to the tile definition's hooks (e.g. unlocked doors).
 */
export function isSolidTile(
  char: string,
  roomKey: string,
  stateGot: Record<string, boolean>,
  state?: KnightState
): boolean {
  if (char === '#') return true;
  if (char === 'L') {
    return !stateGot[`${roomKey}:L`];
  }
  const tile = TILE_BY_SYMBOL[char];
  if (!tile) return false;
  if (tile.hooks?.canPass && state) {
    return !tile.hooks.canPass(state, roomKey);
  }
  return Boolean(tile.solid);
}
