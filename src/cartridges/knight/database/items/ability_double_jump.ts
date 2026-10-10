/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const doubleJumpAbility: ItemWikiDefinition = {
  id: 'ability_double_jump',
  symbol: 'D',
  name: 'Winged Crest',
  category: 'ability',
  description: 'Unlocks Double Jump aerial ascension.',
  lore: 'An ancient knight relic blessing the wearer with a second stride in mid-air.',
  spriteIndex: -1,
  cost: 100,
  sellPrice: 50,
  canDrop: false,
  dropWeight: 0,
  effect: {
    type: 'double_jump',
  },
};
