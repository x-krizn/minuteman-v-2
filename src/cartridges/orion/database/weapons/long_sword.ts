/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 4 (row = 3): Long Sword 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const LONG_SWORD_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAABkElEQVR42u3XMWrDQBAFUJ3EN0hjFWl0gSATSEpBOrG4c+EDpEluEAQifU6QLhdwoSP4Gm7UTPhgw2S9ReavQQiNaj0Qq8/On6IgHzk/OX6s6zw/Tuvbsc3yTfOd5ff706TnH0KQrPAMwyCsP1SVtKsV7WUo5POloP3xeC9dd0f75tBI1VW0f337kofHLe3fn3tZr3e0/3n6yDr/sixhxcPj4ZlXeGD7vne/NH+r8LC9yf2Mvd887ie7edD0YdmZi00Jnu08F892Hmxa8GznwaYFz3YebFrwbOfJPX9sWud/L/96WafMGh5YfcXh4y2F+cqPtakwp7ylMMce4bEU5tgjPJbCHHuEx1KYU+dvKcyxRx5MhRkvX0LE3DzaWsNz5Y3hSXnrtqW9NTyxt4Yn9tbwpM7fum1pbw5PKkTM2PrzE4hrU3tmbGnPjC3tmbGlPTO2tGfG1i3Pn1rVw6YUHSLGRx/hfikeuA8bYUOkPfMR7mfsNY7HGestAXQ/Y5/C7M3lfmHeD899ji+ysPvF+18TYYxrzWcx7gAAAABJRU5ErkJggg==';

export const longSwordWeapon: WeaponDefinition = {
  id: 'long_sword',
  name: 'Camelot Long Sword',
  class: 'Long Sword / Blade',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'medium',
  canBlock: true,
  bladeTrailColor: '#f8fafc',
  description: 'Balanced double-edged knightly broadsword with wide sweeping arcs and disciplined reach.',
  lore:
    'Standard-issue melee blade of the Belldor frontline. Accepts Gem tuning along its fuller groove to channel elemental reactor arcs.',
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDurationSec: 1.2,
  reloadDurationSec: 0.65,
  primaryDamageType: 'Pierce',
  variantStripBase64: LONG_SWORD_STRIP_BASE64,
  hardpointSprite: {
    base64: LONG_SWORD_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 15,
    renderHeight: 15,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: LONG_SWORD_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  moveset: [
    {
      slot: 0,
      name: 'Knightly Four-Slash',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 14,
      tellDurationSec: 0.09,
      actionDurationSec: 0.32,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.65,
      heatCost: 3,
      range: 28,
      description: 'Four-stroke sweeping long sword combo dealing 14 Pierce damage per swing.',
    },
    {
      slot: 1,
      name: 'Vanguard Stinger Thrust',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 28,
      tellDurationSec: 0.26,
      actionDurationSec: 0.35,
      cooldownSec: 4.2,
      heatCost: 13,
      range: 42,
      description: 'Driving forward point-thrust that pierces shield and armor seams.',
    },
    {
      slot: 2,
      name: 'Crescent Cleave',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 20,
      tellDurationSec: 0.22,
      actionDurationSec: 0.35,
      cooldownSec: 5.0,
      heatCost: 14,
      range: 32,
      description: 'Wide horizontal cleave striking all targets in the frontal arc.',
    },
    {
      slot: 3,
      name: 'Block',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 14,
      tellDurationSec: 0.04,
      actionDurationSec: 0.2,
      cooldownSec: 0,
      isBlock: true,
      heatCost: 4,
      range: 24,
      description: 'Hold to raise crossguard blade block (0.25s Perfect Block window nullifies damage & staggers attackers). No cooldown.',
    },
    {
      slot: 4,
      name: 'Excalibur Judgment Arc',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 34,
      tellDurationSec: 0.38,
      actionDurationSec: 0.5,
      cooldownSec: 8.5,
      heatCost: 26,
      range: 68,
      description: 'Projects a high-commitment resonant blade wave forward along the swing vector.',
    },
  ],
};
