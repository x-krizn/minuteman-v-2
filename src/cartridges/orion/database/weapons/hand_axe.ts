/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 7 (row = 6): Hand Axe 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const HAND_AXE_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAABlUlEQVR42u2YMWrDQBBF9yS+QRqrSKMLBJlAUgrSicVdCh8gTXKDIBDpc4J0uYALHcHXcKNmwjcMjLWxrJlNFc0HFUK83WV4Gg0KwePxeDwej8dzMV3cEC7nnTfBcVNQjNG0ABFR13XOL5F3eZz/E3mwCK6z56P7qc2b1Srh92U5m/94CglPfZjNt+1Nwh8Ot7P5si0Tvt7Xs/m7+23Cv7x+zubX6+eEf3vMq//3wzsp5En4oihIJQ+n7/urVkqeD48MVUUQR8OzPCd+qAjiaHiWh3mIo+FZHqQZGoI4Gp7lQer6iyCOhmd5kN3uSBAnp/4QR8OzPAjuIc4kP/5s5cgjeYs8Z7xBnjGvlUfyFnkkb5FH8hZ5xvU3yBOy5JHtjOWZWuASL+XBG6HmhTzoSBae5UFH0vJSHnQkLS/lQUfS8lIedCRL/VkeS/2lPNDhV35qYM6Rh+cd6+F53rHKw/OOVR6ed6zy8LxjlYfnHas8PO/k1D9LHm5jeGbZ3Pl/zl+DpzZ2fuF87n8e55fNhyzY+cXzP83zfXBCFaelAAAAAElFTkSuQmCC';

export const handAxeWeapon: WeaponDefinition = {
  id: 'hand_axe',
  name: 'Marauder Hand Axe',
  class: 'Hand Axe / Cleaver',
  equipmentRole: 'melee',
  weightClass: 'light',
  bladeTrailColor: '#f8fafc',
  description: 'Heavy-bearded boarding and siege hand axe built for aggressive close-quarters hacking.',
  lore:
    'A brutal close-combat tomahawk favored by Marauder and Warrior pilots. Can be swung in rapid arcs or hurled at retreating targets.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 1.0,
  reloadDurationSec: 0.5,
  primaryDamageType: 'Pierce',
  variantStripBase64: HAND_AXE_STRIP_BASE64,
  hardpointSprite: {
    base64: HAND_AXE_STRIP_BASE64,
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
    base64: HAND_AXE_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  moveset: [
    {
      slot: 0,
      name: 'Rending Hack Chain',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 13,
      tellDurationSec: 0.08,
      actionDurationSec: 0.28,
      cooldownSec: 0,
      heatCost: 3,
      range: 24,
      description: 'Four-hit aggressive axe chop combo dealing 13 Pierce damage per strike.',
    },
    {
      slot: 1,
      name: 'Guillotine Split',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 27,
      tellDurationSec: 0.26,
      actionDurationSec: 0.35,
      cooldownSec: 4.2,
      heatCost: 13,
      range: 28,
      description: 'Leaping downward axe cleave that bites deep into frame integrity.',
    },
    {
      slot: 2,
      name: 'Bearded Hook Pull',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 15,
      tellDurationSec: 0.16,
      actionDurationSec: 0.3,
      cooldownSec: 4.5,
      heatCost: 10,
      range: 30,
      description: 'Hooks an enemy shield or limb with the axe beard to stagger them.',
    },
    {
      slot: 3,
      name: 'Tomahawk Hurl',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 22,
      tellDurationSec: 0.2,
      actionDurationSec: 0.35,
      cooldownSec: 5.0,
      heatCost: 12,
      range: 80,
      description: 'Hurls a spinning kinetic hand-axe projectile at mid-range targets.',
    },
    {
      slot: 4,
      name: 'Berserker Cyclone',
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      damage: 32,
      tellDurationSec: 0.35,
      actionDurationSec: 0.55,
      cooldownSec: 8.0,
      heatCost: 25,
      range: 32,
      description: ' High-heat spinning cleave that shreds all nearby hostiles.',
    },
  ],
};
