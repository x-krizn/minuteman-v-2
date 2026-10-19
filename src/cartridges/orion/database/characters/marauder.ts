/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const marauderTrait: TraitLineWikiDefinition = {
  id: 'Marauder',
  name: 'Marauder',
  reactor: 'Ichor',
  defaultDamageStyle: 'Impact',
  identity: 'Aggressive heavy-armor striker with no shields and high durability.',
  lore: 'Heavy frame stripped of shielding to mount thick, hardened composite plates.',
  baseShield: { type: 'energy', capacity: 0 },
  baseArmor: { type: 'Hardened', threshold: 8, rating: 6, durability: 120 },
  startingWeapons: ['gladius_boltcaster'],
};
