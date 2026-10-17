/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const reactorAegisPulseAction: OrionActionDescriptor = {
  id: 'reactor_aegis_pulse',
  name: 'Aegis Barrier Pulse',
  shortLabel: 'AEGIS PULSE',
  sourceCategory: 'reactor',
  sourceLabel: 'Reactor Core [Shields]',
  hardwareSlot: 'Reactor',
  sortOrder: 22,
  description:
    'Channels reactor energy (+18 Heat) into Layer 1 Shields, restoring +35 Shield Capacity and clearing Shield Overload.',
  tellDurationSec: 0.16,
  actionDurationSec: 0.28,
  cooldownSec: 7.5,
  heatCost: 18,
  damage: 0,
  damageType: 'Pulse',
  damageFamily: 'Energy',
  range: 0,
};
