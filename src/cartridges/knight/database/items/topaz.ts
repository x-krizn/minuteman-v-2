/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const topazItem: ItemWikiDefinition = {
  id: 'topaz',
  symbol: 'Y',
  name: 'Topaz Gem',
  category: 'gem',
  description: '+1 Maximum Stamina (SP)',
  lore: 'A sparkling golden gem empowering rapid dashes and combat blocks.',
  spriteIndex: 7,
  stat: 'sp',
  color: '#cccc44',
  cost: 25,
  sellPrice: 12,
  canDrop: true,
  dropWeight: 0.15,
  soldBy: ['wandering_merchant'],
  effect: {
    type: 'max_stat',
    stat: 'sp',
    amount: 1,
  },
};
