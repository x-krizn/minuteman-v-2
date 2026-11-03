/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

/**
 * Canonical database definition for `dashAttackNode` (`Dash Attack`, id `'dash_attack'`, slot `'offense'`) — Thrust or cleave instantaneously out of a sprint or dash..
 */
export const dashAttackNode: ProgressionNodeEntry = {
  id: 'dash_attack',
  name: 'Dash Attack',
  category: 'offense',
  description: 'Thrust or cleave instantaneously out of a sprint or dash.',
  parents: ['attack', 'dash'],
  staminaCost: 6,
  unlocks: [
    {
      type: 'feat',
      featCost: 120,
    },
  ],
  equipmentFilter: {
    requiresWeapon: true,
  },
};
