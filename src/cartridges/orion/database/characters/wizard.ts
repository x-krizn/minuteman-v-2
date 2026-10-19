/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const wizardTrait: TraitLineWikiDefinition = {
  id: 'Wizard',
  name: 'Wizard',
  reactor: 'Ether',
  defaultDamageStyle: 'Blast',
  identity: 'Energy artillery specialist wielding high-capacity energy shields.',
  lore: 'Channels reactor Ether into sustained beams and devastating wave energy.',
  baseShield: { type: 'energy', capacity: 80 },
  baseArmor: { type: 'Layered', threshold: 5, rating: 4, durability: 60 },
  startingWeapons: ['gladius_boltcaster'],
};
