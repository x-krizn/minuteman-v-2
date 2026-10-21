/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const rogueTrait: TraitLineWikiDefinition = {
  id: 'Rogue',
  name: 'Rogue',
  frameModel: 'VX Phantom',
  weightClass: 'light',
  defaultUtilityItem: 'Phase Nanite Injector',
  reactor: 'Ether',
  defaultDamageStyle: 'Blast',
  identity: 'Lightest stealth striker frame (VX Phantom, Light) with ablative plating and ambush burst.',
  lore: 'Ablative shielding deflects high-energy single hits during swift flanking runs; heavy weapons break stealth without System Feats.',
  baseShield: { type: 'energy', capacity: 40 },
  baseArmor: { type: 'Ablative', threshold: 12, rating: 8, durability: 40 },
  startingWeapons: ['khopesh', 'buckler_shield'],
};
