/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const coinItem: ItemWikiDefinition = {
  id: 'coin',
  symbol: 'o',
  name: 'Gold Coin',
  category: 'coin',
  description: 'Glinting currency used for trade and upgrades.',
  lore: 'Minted during the golden age of the kingdom.',
  spriteIndex: 0,
  cost: 1,
  sellPrice: 1,
  canDrop: true,
  dropWeight: 0.8,
  effect: {
    type: 'currency',
    amount: 1,
  },
};
