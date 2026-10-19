/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const guardianTrait: TraitLineWikiDefinition = {
  id: 'Guardian',
  name: 'Guardian',
  reactor: 'Mana',
  defaultDamageStyle: 'Pierce',
  identity: 'Defensive bastion fielding physical shields and layered composite armor.',
  lore: 'Equipped with heavy physical barriers that do not suffer energy overload.',
  baseShield: { type: 'physical', capacity: 100 },
  baseArmor: { type: 'Layered', threshold: 7, rating: 5, durability: 100 },
  startingWeapons: ['gladius_boltcaster'],
};
