/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const potionHpItem: ItemWikiDefinition = {
  id: 'potion_hp',
  symbol: '1',
  name: 'Health Elixir',
  category: 'potion',
  description: '+1 Flask charge replenish',
  lore: 'A soothing medicinal concoction in a sealed vial.',
  spriteIndex: 8,
  stat: 'hp',
  cost: 15,
  sellPrice: 8,
  canDrop: true,
  dropWeight: 0.2,
  effect: {
    type: 'restore_stat',
    stat: 'hp',
    amount: 1,
  },
};
