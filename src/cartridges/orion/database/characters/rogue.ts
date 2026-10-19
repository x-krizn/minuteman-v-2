/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const rogueTrait: TraitLineWikiDefinition = {
  id: 'Rogue',
  name: 'Rogue',
  reactor: 'Ether',
  defaultDamageStyle: 'Blast',
  identity: 'High-mobility skirmisher with ablative plating and rapid burst discharges.',
  lore: 'Ablative shielding deflects high-energy single hits during swift flanking runs.',
  baseShield: { type: 'energy', capacity: 40 },
  baseArmor: { type: 'Ablative', threshold: 12, rating: 8, durability: 40 },
  startingWeapons: ['gladius_boltcaster'],
};
