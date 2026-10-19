/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const modHeadOpticScanAction: OrionActionDescriptor = {
  id: 'mod_head_optic_scan',
  name: 'Optic Target Painter',
  shortLabel: 'OPTIC PAINTER',
  sourceCategory: 'hardware',
  sourceLabel: 'Head Module [Optics]',
  hardwareSlot: 'Head',
  sortOrder: 10,
  description:
    'Sweeps the sector with targeting telemetry, revealing submerged threats and increasing damage taken by enemies by +25% for 6s.',
  tellDurationSec: 0.15,
  actionDurationSec: 0.25,
  cooldownSec: 7.0,
  heatCost: 10,
  damage: 0,
  damageType: 'Pulse',
  damageFamily: 'Energy',
  range: 120,
};

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
