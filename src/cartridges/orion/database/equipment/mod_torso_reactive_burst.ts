/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const modTorsoReactiveBurstAction: OrionActionDescriptor = {
  id: 'mod_torso_reactive_burst',
  name: 'Ablative Reactive Burst',
  shortLabel: 'REACTIVE ARMOR',
  sourceCategory: 'hardware',
  sourceLabel: 'Torso Module [Plating]',
  hardwareSlot: 'Torso',
  sortOrder: 11,
  description:
    'Detonates reactive counter-plates to restore +22 Armor Durability and stagger nearby attackers with an Impact wave.',
  tellDurationSec: 0.18,
  actionDurationSec: 0.3,
  cooldownSec: 8.0,
  heatCost: 14,
  damage: 14,
  damageType: 'Impact',
  damageFamily: 'Kinetic',
  range: 36,
};
