/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

export const khopeshWeapon: WeaponDefinition = {
  id: 'khopesh',
  name: 'Scout Khopesh',
  class: 'Curved Blade',
  description: 'A heavy curved sickle-sword salvaged from the fallen scout in M00.',
  lore:
    'Crafted from forged chassis alloy. In the hands of an agile pilot, its hook-shaped curve slices through armor joints with Pierce damage.',
  shotsPerChain: 3,
  damagePerShot: 12,
  chainDurationSec: 0.9,
  reloadDurationSec: 0.5,
  primaryDamageType: 'Pierce',
  renderHardpoint25D(g, wx, wy, dirDx) {
    // Scout Khopesh: Gleaming curved magenta/violet sickle blade
    g.fillStyle = '#c084fc';
    g.fillRect(wx - 2, wy - 1, 4, 7);
    g.fillStyle = '#f0abfc';
    g.fillRect(wx + (dirDx >= 0 ? 1 : -2), wy - 2, 2, 4);
  },
  moveset: [
    {
      slot: 0,
      name: 'Sickle Combo',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 12,
      tellDurationSec: 0.08,
      actionDurationSec: 0.3,
      cooldownSec: 0,
      heatCost: 2,
      range: 24,
      description: 'Three-hit rapid curved blade combo dealing 12 Pierce damage per slice.',
    },
    {
      slot: 1,
      name: 'Execution Lunge',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 26,
      tellDurationSec: 0.3,
      actionDurationSec: 0.4,
      cooldownSec: 4.5,
      heatCost: 12,
      range: 36,
      description: 'High-commitment forward thrust dealing critical Pierce damage.',
    },
    {
      slot: 2,
      name: 'Sweep Deflection',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 6,
      tellDurationSec: 0.1,
      actionDurationSec: 0.25,
      cooldownSec: 3.5,
      heatCost: 8,
      range: 20,
      description: 'Deflect incoming attack to create a brief stagger window.',
    },
    {
      slot: 3,
      name: 'Hamstring Arc',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 14,
      tellDurationSec: 0.2,
      actionDurationSec: 0.35,
      cooldownSec: 5.0,
      heatCost: 10,
      range: 28,
      description: 'Low sweeping strike that slows enemy movement speed.',
    },
    {
      slot: 4,
      name: 'Whirlwind Sever',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 28,
      tellDurationSec: 0.35,
      actionDurationSec: 0.6,
      cooldownSec: 8.0,
      heatCost: 24,
      range: 30,
      description: 'Full 360-degree radial cleave cutting through surrounding enemies.',
    },
  ],
};
