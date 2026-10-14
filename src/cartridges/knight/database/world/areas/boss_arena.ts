/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaDefinition } from '../../../types';

export const bossArenaArea: AreaDefinition = {
  id: 'boss_arena',
  name: 'Trial Grounds',
  regionId: 'ancient_depths',
  description: 'A grand vaulted rotunda designed for combat honor and knighthood trials.',
  lore: 'Here, elite corrupted knights and colossal automatons challenge those seeking passage deeper into the realm.',
  biomeId: 'crypt',
  localMapIds: ['boss_chamber'],
  threatLevel: 5,
};
