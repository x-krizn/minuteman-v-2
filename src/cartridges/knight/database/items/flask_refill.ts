/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const flaskRefillItem: ItemWikiDefinition = {
  id: 'flask_refill',
  name: 'Elixir Draft',
  category: 'potion',
  description: 'Refill all Flask charges',
  lore: 'A draught of restorative spring water brewed by forest hermits.',
  spriteIndex: 8,
  cost: 10,
  sellPrice: 5,
  canDrop: false,
  dropWeight: 0,
  soldBy: ['wandering_merchant'],
  effect: {
    type: 'flask_refill',
  },
};
