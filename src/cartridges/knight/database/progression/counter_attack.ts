/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

export const counterAttackNode: ProgressionNodeEntry = {
  id: 'counter_attack',
  name: 'Parry Counter Attack',
  category: 'offense',
  description: 'Unleash a lethal critical execution blow following a successful frame-perfect parry.',
  parents: ['parry'],
  staminaCost: 5,
  unlocks: [
    {
      type: 'feat',
      featCost: 200,
    },
  ],
  equipmentFilter: {
    requiresWeapon: true,
  },
};
