/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

export const airDashAttackNode: ProgressionNodeEntry = {
  id: 'air_dash_attack',
  name: 'Air Dash Attack',
  category: 'offense',
  description: 'Unleash a high-speed forward piercing thrust out of an air dash.',
  parents: ['air_attack'],
  staminaCost: 8,
  unlocks: [
    {
      type: 'feat',
      featCost: 220,
    },
  ],
  equipmentFilter: {
    requiresWeapon: true,
  },
};
