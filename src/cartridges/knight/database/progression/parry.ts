/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

/**
 * Canonical database definition for `parryNode` (`Parry`, id `'parry'`, slot `'defense'`) — Deflect an incoming strike at the precise moment of contact to stagger the attacker..
 */
export const parryNode: ProgressionNodeEntry = {
  id: 'parry',
  name: 'Parry',
  category: 'defense',
  description: 'Deflect an incoming strike at the precise moment of contact to stagger the attacker.',
  staminaCost: 5,
  unlocks: [
    {
      type: 'core',
    },
  ],
  equipmentFilter: {
    requiresWeapon: true,
  },
};
