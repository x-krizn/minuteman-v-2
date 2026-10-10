/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const sapphireItem: ItemWikiDefinition = {
  id: 'sapphire',
  symbol: 'B',
  name: 'Sapphire Gem',
  category: 'gem',
  description: '+1 Maximum Energy (EP)',
  lore: 'An azure jewel radiating mystic energy for spells.',
  spriteIndex: 6,
  stat: 'ep',
  color: '#6666ff',
  cost: 25,
  sellPrice: 12,
  canDrop: true,
  dropWeight: 0.15,
  soldBy: ['wandering_merchant'],
  effect: {
    type: 'max_stat',
    stat: 'ep',
    amount: 1,
  },
};
