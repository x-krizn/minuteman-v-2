/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const guardianTrait: TraitLineWikiDefinition = {
  id: 'Guardian',
  name: 'Dawnforge Vanguard Kit',
  frameModel: 'Trinity DE-14',
  weightClass: 'heavy',
  defaultUtilityItem: 'TI Lightwell Recovery System',
  reactor: 'Mana',
  defaultDamageStyle: 'Pierce',
  identity: 'Dawnforge Guardian Coreplate & TI Manaheart Reactor Mk.IV (Heavy Load) — physical barrier & layered anchor kit.',
  lore: 'Equipped with stabilizer anchors, shield emitters, and heavy physical barriers that draw focus via Presence.',
  baseShield: { type: 'physical', capacity: 100 },
  baseArmor: { type: 'Layered', threshold: 7, rating: 5, durability: 100 },
  startingWeapons: ['short_spear', 'heater_shield'],
};
