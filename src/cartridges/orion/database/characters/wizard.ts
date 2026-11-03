/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLineWikiDefinition } from '../../types';

/**
 * Canonical database definition for `wizardTrait` (`Arclight Artillery Kit`, id `'Wizard'`, load `'medium'`) — Arcanum Heavy Projector Coreplate & ARC Infinite Well Reactor Mk.VI (Medium Load) — crystal-lattice beam & wav....
 */
export const wizardTrait: TraitLineWikiDefinition = {
  id: 'Wizard',
  name: 'Arclight Artillery Kit',
  frameModel: 'ARC Arclight',
  weightClass: 'medium',
  defaultUtilityItem: 'ARC Rift Anchor',
  reactor: 'Ether',
  defaultDamageStyle: 'Blast',
  identity: 'Arcanum Heavy Projector Coreplate & ARC Infinite Well Reactor Mk.VI (Medium Load) — crystal-lattice beam & wave artillery kit.',
  lore: 'Reinforced crystal lattice and beam stabilizers engineered for sustained long-range energy discharge and overflow venting.',
  baseShield: { type: 'energy', capacity: 80 },
  baseArmor: { type: 'Layered', threshold: 5, rating: 4, durability: 60 },
  startingWeapons: ['great_bow', 'quiver'],
};
