/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

export const dashNode: ProgressionNodeEntry = {
  id: 'dash',
  name: 'Dash',
  category: 'movement',
  description: 'Quick ground dash granting brief evasion and rapid repositioning.',
  staminaCost: 6,
  unlocks: [
    {
      type: 'loot',
      lootItemId: 'ability_dash', // Acquired from boots/dash orb or unlocked via exploration
    },
    // Also unlockable as core if starting build provides it
    {
      type: 'core',
    },
  ],
};
