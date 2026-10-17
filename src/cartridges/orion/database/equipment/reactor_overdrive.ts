/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const reactorOverdriveAction: OrionActionDescriptor = {
  id: 'reactor_overdrive',
  name: 'Reactor Overdrive',
  shortLabel: 'OVERDRIVE',
  sourceCategory: 'reactor',
  sourceLabel: 'Reactor Core [Output]',
  hardwareSlot: 'Reactor',
  sortOrder: 21,
  description:
    'Surges reactor output (+20 Heat) to grant +30% weapon and skill damage and rapid reload recovery for 6.0s.',
  tellDurationSec: 0.18,
  actionDurationSec: 0.28,
  cooldownSec: 10.0,
  heatCost: 20,
  damage: 0,
  damageType: 'Beam',
  damageFamily: 'Energy',
  range: 0,
};
