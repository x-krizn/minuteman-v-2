/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProgressionNodeEntry } from '../../types';

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
