/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const clericTrait: TraitLineWikiDefinition = {
  id: 'Cleric',
  name: 'Cleric',
  reactor: 'Mana',
  defaultDamageStyle: 'Pierce',
  identity: 'Support and emergency repair specialist utilizing Mana field harmonizers.',
  lore: 'Capable of repairing frame integrity and field armor during engagements.',
  baseShield: { type: 'energy', capacity: 60 },
  baseArmor: { type: 'Reactive', threshold: 6, rating: 4, durability: 80 },
  startingWeapons: ['gladius_boltcaster'],
};
