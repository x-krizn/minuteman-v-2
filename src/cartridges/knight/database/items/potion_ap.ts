/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const potionApItem: ItemWikiDefinition = {
  id: 'potion_ap',
  symbol: '2',
  name: 'Armor Tonic',
  category: 'potion',
  description: 'Restores Armor Poise points',
  lore: 'A thick draught that hardens the sinews.',
  spriteIndex: 9,
  stat: 'ap',
  cost: 15,
  sellPrice: 8,
  canDrop: true,
  dropWeight: 0.15,
  effect: {
    type: 'restore_stat',
    stat: 'ap',
    amount: 2,
  },
};
