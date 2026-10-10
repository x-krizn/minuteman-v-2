/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const flaskShardItem: ItemWikiDefinition = {
  id: 'flask_shard',
  name: 'Flask Shard',
  category: 'shard',
  description: '+1 Max Flask Capacity',
  lore: 'A fragment of emerald glass capable of expanding your healing vessel.',
  spriteIndex: 8,
  cost: 40,
  sellPrice: 20,
  canDrop: false,
  dropWeight: 0,
  soldBy: ['wandering_merchant'],
  effect: {
    type: 'flask_max',
    amount: 1,
  },
};
