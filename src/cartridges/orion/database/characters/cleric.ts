/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const clericTrait: TraitLineWikiDefinition = {
  id: 'Cleric',
  name: 'Cleric',
  frameModel: 'SANC Sanctum',
  weightClass: 'medium',
  defaultUtilityItem: 'Sanctum Harmonicdrone',
  reactor: 'Mana',
  defaultDamageStyle: 'Pierce',
  identity: 'Support anchor frame (SANC Sanctum, Medium) utilizing Mana field harmonizers to repair allies.',
  lore: 'Capable of repairing frame integrity and managing target priority during engagements.',
  baseShield: { type: 'energy', capacity: 60 },
  baseArmor: { type: 'Reactive', threshold: 6, rating: 4, durability: 80 },
  startingWeapons: ['gladius_boltcaster'],
};
