/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemDef, ItemWikiDefinition } from '../../types';
import { rubyItem } from './ruby';
import { sapphireItem } from './sapphire';
import { emeraldItem } from './emerald';
import { topazItem } from './topaz';
import { amethystItem } from './amethyst';
import { amberItem } from './amber';
import { coinItem } from './coin';
import { keyItem } from './key';
import { doubleJumpAbility } from './ability_double_jump';
import { flaskShardItem } from './flask_shard';
import { flaskRefillItem } from './flask_refill';
import { potionHpItem } from './potion_hp';
import { potionApItem } from './potion_ap';
import { potionEpItem } from './potion_ep';
import { potionSpItem } from './potion_sp';

// Dynamic auto-discovery: any item file committed to this directory is automatically loaded!
const itemModules = import.meta.glob('./*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const discoveredItems: ItemWikiDefinition[] = [];

for (const [path, mod] of Object.entries(itemModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp &&
      'category' in exp
    ) {
      discoveredItems.push(exp as ItemWikiDefinition);
    }
  }
}

// Static baseline fallback ensuring complete typing & order stability
const staticBaseline: ItemWikiDefinition[] = [
  rubyItem,
  sapphireItem,
  emeraldItem,
  topazItem,
  amethystItem,
  amberItem,
  coinItem,
  keyItem,
  doubleJumpAbility,
  flaskShardItem,
  flaskRefillItem,
  potionHpItem,
  potionApItem,
  potionEpItem,
  potionSpItem,
];

// Combine unique by ID (discovered items take priority or append new files)
const itemMap = new Map<string, ItemWikiDefinition>();
staticBaseline.forEach((item) => itemMap.set(item.id, item));
discoveredItems.forEach((item) => itemMap.set(item.id, item));

export const ALL_ITEMS: ItemWikiDefinition[] = Array.from(itemMap.values());

export const ITEM_REGISTRY: Record<string, ItemWikiDefinition> = ALL_ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, ItemWikiDefinition>
);

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
 * Backward compatibility map matching legacy ITEMS structure
 */
export const COMPAT_ITEMS: Record<string, ItemDef> = {
  o: { i: coinItem.spriteIndex, k: 'coin' },
  K: { i: keyItem.spriteIndex, k: 'key' },
  D: { i: doubleJumpAbility.spriteIndex, k: 'ability' },
  H: { i: rubyItem.spriteIndex, k: 'gem', s: 'hp' },
  G: { i: emeraldItem.spriteIndex, k: 'gem', s: 'ap' },
  B: { i: sapphireItem.spriteIndex, k: 'gem', s: 'ep' },
  Y: { i: topazItem.spriteIndex, k: 'gem', s: 'sp' },
  P: { i: amethystItem.spriteIndex, k: 'gem', s: 'ap' },
  R: { i: rubyItem.spriteIndex, k: 'gem', s: 'hp' },
  O: { i: amberItem.spriteIndex, k: 'gem', s: 'sp' },
  '1': { i: potionHpItem.spriteIndex, k: 'potion', s: 'hp' },
  '2': { i: potionApItem.spriteIndex, k: 'potion', s: 'ap' },
  '3': { i: potionEpItem.spriteIndex, k: 'potion', s: 'ep' },
  '4': { i: potionSpItem.spriteIndex, k: 'potion', s: 'sp' },
};

export function getItemDefinition(idOrSymbol: string): ItemWikiDefinition | undefined {
  return ITEM_REGISTRY[idOrSymbol] || ITEM_BY_SYMBOL[idOrSymbol];
}

export * from './ruby';
export * from './sapphire';
export * from './emerald';
export * from './topaz';
export * from './amethyst';
export * from './amber';
export * from './coin';
export * from './key';
export * from './ability_double_jump';
export * from './flask_shard';
export * from './flask_refill';
export * from './potion_hp';
export * from './potion_ap';
export * from './potion_ep';
export * from './potion_sp';
