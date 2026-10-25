/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const clericTrait: TraitLineWikiDefinition = {
  id: 'Cleric',
  name: 'Sanctum Support Kit',
  frameModel: 'SANC Sanctum',
  weightClass: 'medium',
  defaultUtilityItem: 'SANC Radiant Ward Projector',
  reactor: 'Mana',
  defaultDamageStyle: 'Pierce',
  identity: 'Sanctum Support Coreplate & SANC Heartwell Reactor Mk.IV (Medium Load) — distributed buffer & harmonic support kit.',
  lore: 'Stabilizes defensive barriers, vents thermal load, and distributes reactor overflow to shield and plating buffers.',
  baseShield: { type: 'energy', capacity: 60 },
  baseArmor: { type: 'Reactive', threshold: 6, rating: 4, durability: 80 },
  startingWeapons: ['mace', 'heater_shield'],
};
