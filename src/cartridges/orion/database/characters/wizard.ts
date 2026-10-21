/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const wizardTrait: TraitLineWikiDefinition = {
  id: 'Wizard',
  name: 'Wizard',
  frameModel: 'ARC Arclight',
  weightClass: 'light',
  defaultUtilityItem: 'Ether Siphon Conduit',
  reactor: 'Ether',
  defaultDamageStyle: 'Blast',
  identity: 'Energy artillery frame (ARC Arclight, Light) wielding high-capacity energy shields and long-range beams.',
  lore: 'Channels reactor Ether into sustained beams and devastating wave energy.',
  baseShield: { type: 'energy', capacity: 80 },
  baseArmor: { type: 'Layered', threshold: 5, rating: 4, durability: 60 },
  startingWeapons: ['great_bow', 'quiver'],
};
