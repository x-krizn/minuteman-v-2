/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const keyItem: ItemWikiDefinition = {
  id: 'key',
  symbol: 'K',
  name: 'Dungeon Key',
  category: 'key',
  description: 'Unlocks the fortified exit door of the floor.',
  lore: 'Forged of heavy iron to seal ancient chambers.',
  spriteIndex: 2,
  cost: 50,
  sellPrice: 20,
  canDrop: false,
  dropWeight: 0,
  effect: {
    type: 'key',
    amount: 1,
  },
};
