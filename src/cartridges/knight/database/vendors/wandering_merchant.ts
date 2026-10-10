/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatType } from '../../types';
import { ITEM_REGISTRY } from '../items';

export interface VendorItemEntry {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'stat' | 'flask_max' | 'flask_refill';
  stat?: StatType;
}

export type VendorItem = VendorItemEntry;

export interface VendorWikiDefinition {
  id: string;
  name: string;
  title: string;
  dialogueGreeting: string;
  wares: string[]; // item IDs
}

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
 * Builds the VendorItem list for the in-game Satchel UI dynamically from the item wiki database!
 */
export function getMerchantCatalog(): VendorItemEntry[] {
  const result: VendorItemEntry[] = [];
  for (const itemId of wanderingMerchant.wares) {
    const item = ITEM_REGISTRY[itemId];
    if (!item) continue;

    let type: 'stat' | 'flask_max' | 'flask_refill' = 'stat';
    if (item.effect.type === 'flask_max') type = 'flask_max';
    else if (item.effect.type === 'flask_refill') type = 'flask_refill';

    result.push({
      id: item.id,
      name: item.name,
      description: item.description,
      cost: item.cost ?? 25,
      type,
      stat: item.stat,
    });
  }
  return result;
}
