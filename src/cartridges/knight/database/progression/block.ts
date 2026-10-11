/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

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
