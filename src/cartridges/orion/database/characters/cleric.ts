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
  identity: 'Support anchor frame (SANC Sanctum, Medium) utilizing Mana field harmonizers to reinforce ally shields and armor plating.',
  lore: 'Stabilizes defensive barriers, vents thermal load, and manages target priority; true frame reconstruction requires rare materials and unknown ætheric magics beyond field kits.',
  baseShield: { type: 'energy', capacity: 60 },
  baseArmor: { type: 'Reactive', threshold: 6, rating: 4, durability: 80 },
  startingWeapons: ['mace', 'heater_shield'],
};
