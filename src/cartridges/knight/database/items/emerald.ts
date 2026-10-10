/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const emeraldItem: ItemWikiDefinition = {
  id: 'emerald',
  symbol: 'G',
  name: 'Emerald Gem',
  category: 'gem',
  description: '+1 Maximum Poise/Armor (AP)',
  lore: 'A verdant gem hardening the bearer against enemy flinch.',
  spriteIndex: 5,
  stat: 'ap',
  color: '#44cc44',
  cost: 25,
  sellPrice: 12,
  canDrop: true,
  dropWeight: 0.15,
  soldBy: ['wandering_merchant'],
  effect: {
    type: 'max_stat',
    stat: 'ap',
    amount: 1,
  },
};
