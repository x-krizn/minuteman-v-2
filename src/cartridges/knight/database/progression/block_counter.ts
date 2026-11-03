/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

/**
 * Canonical database definition for `blockCounterNode` (`Block Counter`, id `'block_counter'`, slot `'defense'`) — Riposte immediately after soaking an impact with your guard..
 */
export const blockCounterNode: ProgressionNodeEntry = {
  id: 'block_counter',
  name: 'Block Counter',
  category: 'defense',
  description: 'Riposte immediately after soaking an impact with your guard.',
  parents: ['block'],
  staminaCost: 6,
  unlocks: [
    {
      type: 'feat',
      featCost: 160,
    },
  ],
  equipmentFilter: {
    requiresWeapon: true,
  },
};
