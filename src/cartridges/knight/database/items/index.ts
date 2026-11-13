/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

// Dynamic recursive auto-discovery — every item file committed to this directory or any subdirectory is automatically loaded!
const itemModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const itemMap = new Map<string, ItemWikiDefinition>();

for (const [path, mod] of Object.entries(itemModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp
    ) {
      const item = exp as ItemWikiDefinition;
      itemMap.set(item.id, item);
    }
  }
}

/**
 * Exported const `ALL_ITEMS` (all items) in `index.ts`.
 */
export const ALL_ITEMS: ItemWikiDefinition[] = Array.from(itemMap.values());

/**
 * Exported const `ITEM_REGISTRY` (item registry) in `index.ts`.
 */
export const ITEM_REGISTRY: Record<string, ItemWikiDefinition> = ALL_ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, ItemWikiDefinition>
);

/**
 * Exported const `ITEM_BY_SYMBOL` (item by symbol) in `index.ts`.
 */
export const ITEM_BY_SYMBOL: Record<string, ItemWikiDefinition> = ALL_ITEMS.reduce(
  (acc, item) => {
    if (item.symbol) {
      acc[item.symbol] = item;
    }
    if (item.spawning?.proceduralPlacementSymbol) {
      acc[item.spawning.proceduralPlacementSymbol] = item;
    }
    if (item.spawning?.legacyAliases) {
      item.spawning.legacyAliases.forEach((alias) => {
        acc[alias] = item;
      });
    }
    return acc;
  },
  {} as Record<string, ItemWikiDefinition>
);

/**
 * Executes `getItemDefinition` (get item definition) in `index.ts`.
 */
export function getItemDefinition(idOrSymbol: string): ItemWikiDefinition | undefined {
  return ITEM_REGISTRY[idOrSymbol] || ITEM_BY_SYMBOL[idOrSymbol];
}
