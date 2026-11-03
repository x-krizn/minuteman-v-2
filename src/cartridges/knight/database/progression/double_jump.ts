/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

/**
 * Canonical database definition for `doubleJumpNode` (`Double Jump`, id `'double_jump'`, slot `'movement'`) — Perform a secondary ascension burst mid-air..
 */
export const doubleJumpNode: ProgressionNodeEntry = {
  id: 'double_jump',
  name: 'Double Jump',
  category: 'movement',
  description: 'Perform a secondary ascension burst mid-air.',
  parents: ['jump'],
  unlocks: [
    {
      type: 'loot',
      lootItemId: 'ability_double_jump',
    },
  ],
};
