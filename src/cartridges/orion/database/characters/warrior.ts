/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const warriorTrait: TraitLineWikiDefinition = {
  id: 'Warrior',
  name: 'Warrior',
  frameModel: 'PNSY W416',
  weightClass: 'medium',
  defaultUtilityItem: 'Ichor Field Autoinjector',
  reactor: 'Ichor',
  defaultDamageStyle: 'Impact',
  identity: 'Pre-configured Ichor fighter frame (PNSY W416, Medium) with reactive armor and energy shields.',
  lore: 'Frontline mechs deployed to hold ground and absorb sustained kinetic fire.',
  baseShield: { type: 'energy', capacity: 60 },
  baseArmor: { type: 'Reactive', threshold: 6, rating: 4, durability: 80 },
  startingWeapons: ['gladius_boltcaster'],
};
