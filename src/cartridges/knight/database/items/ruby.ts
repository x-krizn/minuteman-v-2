/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const rubyItem: ItemWikiDefinition = {
  id: 'ruby',
  symbol: 'H',
  name: 'Red Ruby',
  category: 'gem',
  description: '+1 Maximum Health (HP)',
  lore: 'A cut crimson gemstone pulsating with vitality.',
  spriteIndex: 4,
  stat: 'hp',
  color: '#ff5555',
  cost: 25,
  sellPrice: 12,
  canDrop: true,
  dropWeight: 0.2,
  soldBy: ['wandering_merchant'],
  effect: {
    type: 'max_stat',
    stat: 'hp',
    amount: 1,
  },
};
