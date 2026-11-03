/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

/**
 * Canonical database definition for `jumpNode` (`Jump`, id `'jump'`, slot `'movement'`) — Leap into the air to navigate dungeon terrain..
 */
export const jumpNode: ProgressionNodeEntry = {
  id: 'jump',
  name: 'Jump',
  category: 'movement',
  description: 'Leap into the air to navigate dungeon terrain.',
  unlocks: [
    {
      type: 'core',
    },
  ],
};
