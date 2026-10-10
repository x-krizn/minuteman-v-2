/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const amberItem: ItemWikiDefinition = {
  id: 'amber',
  symbol: 'O',
  name: 'Amber Crystal',
  category: 'shard',
  description: '+1 Max SP Stamina Boost',
  lore: 'Petrified sap infused with kinetic energy.',
  spriteIndex: 7,
  stat: 'sp',
  color: '#ff9900',
  cost: 30,
  sellPrice: 15,
  canDrop: true,
  dropWeight: 0.1,
  soldBy: ['wandering_merchant'],
  effect: {
    type: 'max_stat',
    stat: 'sp',
    amount: 1,
  },
};
