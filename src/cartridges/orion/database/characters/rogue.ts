/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const rogueTrait: TraitLineWikiDefinition = {
  id: 'Rogue',
  name: 'Phantom Recon Kit',
  frameModel: 'VX Phantom',
  weightClass: 'light',
  defaultUtilityItem: 'VX Smoke Dispersal System',
  reactor: 'Ether',
  defaultDamageStyle: 'Blast',
  identity: 'Shadowcraft Recon Coreplate & VX Phantom Core Mk.III (Light Load) — low-emission stealth & high-mobility burst kit.',
  lore: 'Ablative plating and emission dampeners built for swift flanking runs; heavy weapons can be mounted by socketing Load-Bearing System Feats.',
  baseShield: { type: 'energy', capacity: 40 },
  baseArmor: { type: 'Ablative', threshold: 12, rating: 8, durability: 40 },
  startingWeapons: ['khopesh', 'buckler_shield'],
};
