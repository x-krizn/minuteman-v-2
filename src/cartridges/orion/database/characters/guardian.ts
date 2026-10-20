/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

export const guardianTrait: TraitLineWikiDefinition = {
  id: 'Guardian',
  name: 'Guardian',
  frameModel: 'Trinity DE-14',
  weightClass: 'heavy',
  defaultUtilityItem: 'Bastion Barrier Capacitor',
  reactor: 'Mana',
  defaultDamageStyle: 'Pierce',
  identity: 'Defensive anchor frame (Trinity DE-14, Heavy) fielding physical shields and layered armor.',
  lore: 'Equipped with heavy physical barriers that do not suffer energy overload and draw focus via Presence.',
  baseShield: { type: 'physical', capacity: 100 },
  baseArmor: { type: 'Layered', threshold: 7, rating: 5, durability: 100 },
  startingWeapons: ['gladius_boltcaster'],
};
