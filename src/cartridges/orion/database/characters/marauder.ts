/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const marauderTrait: TraitLineWikiDefinition = {
  id: 'Marauder',
  name: 'Marauder',
  frameModel: 'RAD HAU',
  weightClass: 'superheavy',
  defaultUtilityItem: 'Slag Plate Welder',
  reactor: 'Ichor',
  defaultDamageStyle: 'Impact',
  identity: 'Super-heavy artillery frame (RAD HAU, Superheavy) with hardened composite plating and natural presence.',
  lore: 'Super-heavy frame stripped of shielding to mount thick, hardened composite plates without load penalty.',
  baseShield: { type: 'energy', capacity: 0 },
  baseArmor: { type: 'Hardened', threshold: 8, rating: 6, durability: 120 },
  startingWeapons: ['gladius_boltcaster'],
};
