/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 5 (row = 4): Short Spear 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const SHORT_SPEAR_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAACIUlEQVR42u3XMUoDQRSA4T2JN7BxC5tcQCKClgt2YbGzyAFs9AYSWOw9gZ0XsMgRcg2bNCP/4gvDc8H35kVTZIRX/mQz+2VmbJrCv/T9V9pv5/PEFPfbeWIO1S+2i8SU9l33lpjSfrn8TMyh1r/v+8QUwyFu2zaV9h+zWahP6ybUbzbnob776EL9w+NrqH+6GUL9+/VzqKd19+N7W69DeOgjeOgjeOgjeOgjeOgjeOgjeOgjeOjdeHY/+gyPZfuiYZsEjMazODmx9dv5CEbjebltzD1gNJ7V6tTUc0wBRuOZrWamnmMKMBrPxdWdqeeYAozGc3Z2b15/wGg81vWX9z2BJ7nUDcPgwiPnLGAYeg8euaeMeNbN2HvwSA8Yht6DR+45gGHoPXjkngMYht6DR+45gGHoPXhk/QHD0HvwyD1HwNDvBY9n68rx8NDePscDGm+f4wGNt8/xgMbb53hA4+1zPKDx9jmekvXP8fA6io4ujcdz8+YXoB/e8wDsIBpPSZ/j8fTsQBqPC2D39gOPp2cH0nhc3z+4/rxrjccNqBTP7g6hHt66fUqv8ViPL+k1HuvxJb3GYz2+pNd4rMeX9BqP9fja1/pP4En/hkfvXjy89QtM9eCxAprqwWMFNNWDxwpoqgePFdBUDx4roL9Y/288v/dDf5n6y7boXz3p5cNrf2S94Il8eO2PtK+LV/uKp/YVT+0rntofSd+E4tofff8F0UG9oqP2apgAAAAASUVORK5CYII=';

export const shortSpearWeapon: WeaponDefinition = {
  id: 'short_spear',
  name: 'Vanguard Short Spear',
  class: 'Short Spear / Polearm',
  equipmentRole: 'melee',
  weightClass: 'light',
  bladeTrailColor: '#f8fafc',
  description: 'Agile leaf-bladed short spear built for long-reach precision thrusts and shield-wall skirmishing.',
  lore:
    'Favored by Belldor outriders and guardians who pair a fast thrusting polearm with an offhand Heater or Buckler shield.',
  shotsPerChain: 4,
  damagePerShot: 11,
  chainDurationSec: 0.95,
  reloadDurationSec: 0.45,
  primaryDamageType: 'Pierce',
  variantStripBase64: SHORT_SPEAR_STRIP_BASE64,
  hardpointSprite: {
    base64: SHORT_SPEAR_STRIP_BASE64,
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
    base64: SHORT_SPEAR_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  moveset: [
    {
      slot: 0,
      name: 'Phalanx Rapid Thrust',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 11,
      tellDurationSec: 0.07,
      actionDurationSec: 0.25,
      cooldownSec: 0,
      heatCost: 2,
      range: 34,
      description: 'Four-hit extended-reach spear thrust chain keeping hostiles at bay.',
    },
    {
      slot: 1,
      name: 'Impaling Skewer',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 25,
      tellDurationSec: 0.24,
      actionDurationSec: 0.35,
      cooldownSec: 4.0,
      heatCost: 11,
      range: 46,
      description: 'Deep armor-piercing lunge that punches through front-row targets.',
    },
    {
      slot: 2,
      name: 'Shaft Sweep Vault',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 14,
      tellDurationSec: 0.15,
      actionDurationSec: 0.3,
      cooldownSec: 4.2,
      heatCost: 9,
      range: 28,
      description: 'Low polearm sweep that trips and staggers nearby foes.',
    },
    {
      slot: 3,
      name: 'Viper Flurry',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.18,
      actionDurationSec: 0.35,
      cooldownSec: 4.8,
      heatCost: 12,
      range: 36,
      description: 'Triple rapid-fire spear jabs aimed at exposed actuator joints.',
    },
    {
      slot: 4,
      name: 'Javelin ReactorHurl',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 32,
      tellDurationSec: 0.32,
      actionDurationSec: 0.45,
      cooldownSec: 7.5,
      heatCost: 20,
      range: 95,
      description: 'Hurls a high-velocity kinetic spear bolt across the room.',
    },
  ],
};
