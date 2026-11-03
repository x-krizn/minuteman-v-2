/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

/**
 * Canonical database definition for `attackNode` (`Basic Attack`, id `'attack'`, slot `'offense'`) — Standard melee strike with equipped weapon..
 */
export const attackNode: ProgressionNodeEntry = {
  id: 'attack',
  name: 'Basic Attack',
  category: 'offense',
  description: 'Standard melee strike with equipped weapon.',
  staminaCost: 4,
  unlocks: [
    {
      type: 'core',
    },
  ],
  equipmentFilter: {
    requiresWeapon: true,
  },
};
