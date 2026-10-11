/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

export const airDashNode: ProgressionNodeEntry = {
  id: 'air_dash',
  name: 'Air Dash',
  category: 'movement',
  description: 'Propel forward horizontally while airborne following a double jump.',
  parents: ['dash', 'double_jump'],
  staminaCost: 8,
  unlocks: [
    {
      type: 'feat',
      featCost: 150,
    },
  ],
};
