/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const potionSpItem: ItemWikiDefinition = {
  id: 'potion_sp',
  symbol: '4',
  name: 'Vigor Brew',
  category: 'potion',
  description: 'Restores Stamina Points for dashes and blocks',
  lore: 'A spicy tincture that reinvigorates exhausted muscles.',
  spriteIndex: 11,
  stat: 'sp',
  cost: 15,
  sellPrice: 8,
  canDrop: true,
  dropWeight: 0.15,
  effect: {
    type: 'restore_stat',
    stat: 'sp',
    amount: 2,
  },
};
