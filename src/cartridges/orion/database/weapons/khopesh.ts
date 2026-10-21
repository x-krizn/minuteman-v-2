/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 8 (row = 7): Shotel / Scout Khopesh 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const SHOTEL_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAACB0lEQVR42u2YMUoDURRFZyXZgU1S2GQDkiBoOWA3DHYWWYCN7kACg70rsHMDKWYJ2YbNNE9uzIWf75A3PzcwSP6HW7yQE8aXk897FkU++eSTz784ZmYK3y0WGt+Ny1ddJfFl+Snxq9X3qP2v61rii7ZtTZFoM5+b8kdYW5giwXZ7LfHlpjRFoueXD1Mker1vTJHo6+5N6v9sNrOzSJT5zI92C4FXfgU7vhuXV24h8MotBF65hc7Rf+kWygJlgbJAWaBxBKI8TdOY8vAYppUvH8O0wmOYVuTBMK3Ig2FakQfDtNJ/DNOKPBim3XU9vmX4Gj7EEwgPGQ9boTzVZGLeut3L7+V5fyhO5iHPen1l3rrex1Oe+fr4DwCS9PGU5+b20bx1vY+nPNPp08n9hzxe/yFJHx/IY0flwZt524TiDJWH6zqZVHm4rh/wCfJwXY/5ofJwXQ/5FHm4rod8ijxc10M+RR6u63H/h8rDdT3kk+SBJEj4AXxtiDx4SAQ1kyIPJEFQMynyQBIk5FPkgSQIaiZFHkiCoGZS5IEkCGomRZ6+/qfIs5dkJw3jytPUyz83DKUZIg/kiyVBzXgP/3vNHUqCmvHkAR5Lgprx5AEfS4Ka8eQBH0uCmvHkAR9Lgprx5AEfS4KaGdL/WBLUjCtPvTz9v4zgIVjmL5A/hzyZv1y+kODMXzz/A+vg6IDUnx8ZAAAAAElFTkSuQmCC';

export const khopeshWeapon: WeaponDefinition = {
  id: 'khopesh',
  name: 'Scout Shotel (Khopesh)',
  class: 'Shotel / Curved Blade',
  equipmentRole: 'melee',
  weightClass: 'light',
  bladeTrailColor: '#f8fafc',
  description: 'A curved shield-reaching shotel sickle-blade salvaged from the fallen scout in M00.',
  lore:
    'Crafted from forged chassis alloy. Its hook-shaped shotel curve reaches around enemy shields and slices through armor joints with Pierce damage.',
  shotsPerChain: 3,
  damagePerShot: 12,
  chainDurationSec: 0.9,
  reloadDurationSec: 0.5,
  primaryDamageType: 'Pierce',
  variantStripBase64: SHOTEL_STRIP_BASE64,
  hardpointSprite: {
    base64: SHOTEL_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 14,
    renderHeight: 14,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: SHOTEL_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  renderHardpoint25D(g, wx, wy, dirDx) {
    g.fillStyle = '#cbd5e1';
    g.fillRect(wx - 2, wy - 1, 4, 7);
    g.fillStyle = '#f8fafc';
    g.fillRect(wx + (dirDx >= 0 ? 1 : -2), wy - 2, 2, 4);
  },
  moveset: [
    {
      slot: 0,
      name: 'Shotel Sickle Combo',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 12,
      tellDurationSec: 0.08,
      actionDurationSec: 0.3,
      cooldownSec: 0,
      heatCost: 2,
      range: 24,
      description: 'Three-hit rapid curved shotel combo dealing 12 Pierce damage per slice.',
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
