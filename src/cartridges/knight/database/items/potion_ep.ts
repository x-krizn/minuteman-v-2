/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const potionEpItem: ItemWikiDefinition = {
  id: 'potion_ep',
  symbol: '3',
  name: 'Ether Draught',
  category: 'potion',
  description: 'Restores Energy Points for magic skills',
  lore: 'Distilled starlight providing immediate mental clarity.',
  spriteIndex: 10,
  stat: 'ep',
  cost: 15,
  sellPrice: 8,
  canDrop: true,
  dropWeight: 0.15,
  effect: {
    type: 'restore_stat',
    stat: 'ep',
    amount: 2,
  },
};
