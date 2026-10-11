/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

export const dropAttackNode: ProgressionNodeEntry = {
  id: 'drop_attack',
  name: 'Drop Attack',
  category: 'offense',
  description: 'Plunge downward from high altitude dealing crushing impact damage.',
  parents: ['attack', 'double_jump'],
  staminaCost: 10,
  unlocks: [
    {
      type: 'feat',
      featCost: 180,
    },
  ],
  equipmentFilter: {
    requiresWeapon: true,
  },
};
