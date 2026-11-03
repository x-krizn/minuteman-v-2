/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

/**
 * Canonical database definition for `reactorThermalVentAction` (`Thermal Vent Purge`, id `'reactor_thermal_vent'`) — Opens emergency radiator baffles to immediately purge -45 Reactor Heat while scorching adjacent hostiles for 1....
 */
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

/**
 * Canonical database definition for `reactorOverdriveAction` (`Reactor Overdrive`, id `'reactor_overdrive'`) — Surges reactor output (+20 Heat) to grant +30% weapon and skill damage and rapid reload recovery for 6.0s..
 */
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

/**
 * Canonical database definition for `reactorAegisPulseAction` (`Aegis Barrier Pulse`, id `'reactor_aegis_pulse'`) — Channels reactor energy (+18 Heat) into Layer 1 Shields, restoring +35 Shield Capacity and clearing Shield Ove....
 */
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
