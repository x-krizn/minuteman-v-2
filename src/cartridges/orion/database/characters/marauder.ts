/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

/**
 * Canonical database definition for `marauderTrait` (`Fortress Siege Kit`, id `'Marauder'`, load `'heavy'`) — Fire & Ice Fortress Coreplate & RAD Battleheart Reactor Mk.V (Heavy Load) — heavy ordnance & hardened armor ki....
 */
export const marauderTrait: TraitLineWikiDefinition = {
  id: 'Marauder',
  name: 'Fortress Siege Kit',
  frameModel: 'RAD HAU',
  weightClass: 'heavy',
  defaultUtilityItem: 'RAD R463 Fathomless System',
  reactor: 'Ichor',
  defaultDamageStyle: 'Impact',
  identity: 'Fire & Ice Fortress Coreplate & RAD Battleheart Reactor Mk.V (Heavy Load) — heavy ordnance & hardened armor kit.',
  lore: 'A heavy siege starting rig stripped of energy shielding to mount thick hardened composite plates and heavy weapons supported by Siege Stability.',
  baseShield: { type: 'energy', capacity: 0 },
  baseArmor: { type: 'Hardened', threshold: 8, rating: 6, durability: 120 },
  startingWeapons: ['hand_axe', 'pavise_shield'],
};
