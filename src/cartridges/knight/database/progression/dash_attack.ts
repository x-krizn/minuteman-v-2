/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

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
