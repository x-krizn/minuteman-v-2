/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const warriorTrait: TraitLineWikiDefinition = {
  id: 'Warrior',
  name: 'Bastion Striker Kit',
  frameModel: 'PNSY W416',
  weightClass: 'medium',
  defaultUtilityItem: 'PNSY D-0g Repair Drone',
  reactor: 'Ichor',
  defaultDamageStyle: 'Impact',
  identity: 'BWI Bastion Coreplate & PNSY Alchemic Turbine Core Mk.IV (Medium Load) — frontline kinetic & thermal striker kit.',
  lore: 'A balanced starting rig engineered to hold ground, cycle burst-fire ballistics, and vent volatile turbine heat. Open to any build direction.',
  baseShield: { type: 'energy', capacity: 60 },
  baseArmor: { type: 'Reactive', threshold: 6, rating: 4, durability: 80 },
  startingWeapons: ['long_sword', 'gladius_boltcaster'],
};
