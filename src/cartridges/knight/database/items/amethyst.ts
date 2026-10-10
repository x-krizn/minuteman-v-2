/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const amethystItem: ItemWikiDefinition = {
  id: 'amethyst',
  symbol: 'P',
  name: 'Amethyst Shard',
  category: 'shard',
  description: '+1 Max AP & Armor Reinforce',
  lore: 'A crystalline purple shard from the deep subterranean caves.',
  spriteIndex: 5,
  stat: 'ap',
  color: '#b044ff',
  cost: 30,
  sellPrice: 15,
  canDrop: true,
  dropWeight: 0.1,
  soldBy: ['wandering_merchant'],
  effect: {
    type: 'max_stat',
    stat: 'ap',
    amount: 1,
  },
};
