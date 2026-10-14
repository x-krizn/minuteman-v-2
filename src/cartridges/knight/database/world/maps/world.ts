/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorldMapDefinition } from '../../../types';

export const realmWorldMap: WorldMapDefinition = {
  id: 'realm_of_the_knight',
  name: 'Subterranean Realm of the Vanguard',
  description: 'An ancient kingdom buried deep beneath mountain rock, connecting sacred sanctums, crypts, and overgrown ruins.',
  regionIds: ['ancient_depths', 'verdant_reach'],
  connections: [
    {
      fromRegionId: 'ancient_depths',
      toRegionId: 'verdant_reach',
      requirement: 'double_jump',
    },
  ],
};
