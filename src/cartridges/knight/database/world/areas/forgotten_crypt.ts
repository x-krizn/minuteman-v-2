/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaDefinition } from '../../../types';

export const forgottenCryptArea: AreaDefinition = {
  id: 'forgotten_crypt',
  name: 'Forgotten Crypt',
  regionId: 'ancient_depths',
  description: 'A subterranean labyrinth of crypt chambers, cold flagstones, and forgotten sentinels.',
  lore: 'The eternal resting grounds of the kingdom’s vanguard knights, where the Proto Knight awakens.',
  biomeId: 'crypt',
  localMapIds: ['tutorial', 'crypt_floor_1'],
  threatLevel: 1,
};
