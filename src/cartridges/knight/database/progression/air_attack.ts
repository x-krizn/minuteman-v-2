/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

/**
 * Canonical database definition for `airAttackNode` (`Air Attack`, id `'air_attack'`, slot `'offense'`) — Execute airborne slashes during jumps..
 */
export const airAttackNode: ProgressionNodeEntry = {
  id: 'air_attack',
  name: 'Air Attack',
  category: 'offense',
  description: 'Execute airborne slashes during jumps.',
  parents: ['attack', 'air_dash'],
  staminaCost: 5,
  unlocks: [
    {
      type: 'feat',
      featCost: 140,
    },
  ],
  equipmentFilter: {
    requiresWeapon: true,
  },
};
