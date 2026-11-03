/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

/**
 * Canonical database definition for `blockNode` (`Block`, id `'block'`, slot `'defense'`) — Raise weapon or shield to mitigate incoming physical trauma..
 */
export const blockNode: ProgressionNodeEntry = {
  id: 'block',
  name: 'Block',
  category: 'defense',
  description: 'Raise weapon or shield to mitigate incoming physical trauma.',
  staminaCost: 3,
  unlocks: [
    {
      type: 'core',
    },
  ],
  equipmentFilter: {
    requiresWeapon: true,
  },
};
