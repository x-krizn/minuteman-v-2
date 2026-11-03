/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition, StatType } from '../../types';
import { ALL_ITEMS, ITEM_REGISTRY } from '../items';

/**
 * Catalog entry representing a purchasable item in the Knight Satchel merchant tab.
 */
export interface VendorItemEntry {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'stat' | 'flask_max' | 'flask_refill';
  stat?: StatType;
}

/**
 * Alias for `VendorItemEntry` consumed by the Knight Satchel merchant UI.
 */
export type VendorItem = VendorItemEntry;

/**
 * Wiki definition describing an NPC merchant's greeting dialogue and default item IDs.
 */
export interface VendorWikiDefinition {
  id: string;
  name: string;
  title: string;
  dialogueGreeting: string;
  wares: string[]; // item IDs
}

/**
 * Canonical definition for Aldous (`wandering_merchant`), the sanctuary relic vendor.
 */
export const wanderingMerchant: VendorWikiDefinition = {
  id: 'wandering_merchant',
  name: 'Aldous',
  title: 'Wandering Relic Merchant',
  dialogueGreeting: 'Greetings, traveler. Deep ruins favor the prepared.',
  wares: [
    'ruby',
    'topaz',
    'sapphire',
    'emerald',
    'amethyst',
    'amber',
    'flask_shard',
    'flask_refill',
  ],
};

/**
 * Builds the `VendorItemEntry` catalog for the in-game Satchel UI from `ITEM_REGISTRY`.
 */
export function getMerchantCatalog(): VendorItemEntry[] {
  const result: VendorItemEntry[] = [];
  const added = new Set<string>();

  const processItem = (item: ItemWikiDefinition | undefined) => {
    if (!item || added.has(item.id)) return;
    added.add(item.id);

    let type: 'stat' | 'flask_max' | 'flask_refill' = 'stat';
    if (item.effect?.type === 'flask_max') type = 'flask_max';
    else if (item.effect?.type === 'flask_refill') type = 'flask_refill';

    result.push({
      id: item.id,
      name: item.name,
      description: item.description || '',
      cost: item.cost ?? 25,
      type,
      stat: item.stat,
    });
  };

  // 1. Process explicit wares in vendor list
  for (const itemId of wanderingMerchant.wares) {
    processItem(ITEM_REGISTRY[itemId]);
  }

  // 2. Automatically discover any newly created item that marks wandering_merchant
  for (const item of ALL_ITEMS) {
    if (
      item.vendors?.includes('wandering_merchant') ||
      item.soldBy?.includes('wandering_merchant')
    ) {
      processItem(item);
    }
  }

  return result;
}
