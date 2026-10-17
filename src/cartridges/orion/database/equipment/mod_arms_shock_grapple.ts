/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const modArmsShockGrappleAction: OrionActionDescriptor = {
  id: 'mod_arms_shock_grapple',
  name: 'Arc Tether Shot',
  shortLabel: 'ARC TETHER',
  sourceCategory: 'hardware',
  sourceLabel: 'Arms Module [Sidearm]',
  hardwareSlot: 'Arms',
  sortOrder: 12,
  description:
    'Fires a high-velocity electromagnetic tether bolt that deals 20 Pulse damage, overloads Energy Shields, and stuns for 1.2s.',
  tellDurationSec: 0.2,
  actionDurationSec: 0.3,
  cooldownSec: 5.5,
  heatCost: 14,
  damage: 20,
  damageType: 'Pulse',
  damageFamily: 'Energy',
  range: 95,
};
