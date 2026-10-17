/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const reactorThermalVentAction: OrionActionDescriptor = {
  id: 'reactor_thermal_vent',
  name: 'Thermal Vent Purge',
  shortLabel: 'VENT HEAT',
  sourceCategory: 'reactor',
  sourceLabel: 'Reactor Core [Thermal]',
  hardwareSlot: 'Reactor',
  sortOrder: 20,
  description:
    'Opens emergency radiator baffles to immediately purge -45 Reactor Heat while scorching adjacent hostiles for 14 Wave damage.',
  tellDurationSec: 0.15,
  actionDurationSec: 0.3,
  cooldownSec: 6.5,
  heatCost: -45,
  damage: 14,
  damageType: 'Wave',
  damageFamily: 'Energy',
  range: 34,
};
