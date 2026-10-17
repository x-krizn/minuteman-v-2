/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const modLegsSeismicStompAction: OrionActionDescriptor = {
  id: 'mod_legs_seismic_stomp',
  name: 'Seismic Thruster Slam',
  shortLabel: 'SEISMIC SLAM',
  sourceCategory: 'hardware',
  sourceLabel: 'Legs Module [Booster]',
  hardwareSlot: 'Legs',
  sortOrder: 13,
  description:
    'Vector-pulses leg thrusters into the ground, dealing 22 Impact damage and stunning enemies within 38px.',
  tellDurationSec: 0.22,
  actionDurationSec: 0.35,
  cooldownSec: 6.0,
  heatCost: 16,
  damage: 22,
  damageType: 'Impact',
  damageFamily: 'Kinetic',
  range: 38,
};
