/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 11 (row = 10): Pavise Shield 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const PAVISE_SHIELD_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAADe0lEQVR4nO2YMW4TURRFZyXZAU1c0HgDyBISlJboIouOIguggR0gSxY9K6BjAym8hGwjjRvQk7g/lzv3/Xn+SWiSkZ7+6M0/I8/zyR0r00TH7+IxJccL/4z5uHA8HkvlbhK902ZTqpQ/bUr1VPzV6apUGb/d/ixVxl9f35Xqqea/2+1KNeMzeXAsSZR9eBxLD5F9+Y1fkOAx+EyU3rUleXAsSZTJg2NJoseYfyZK71oT6HA4NDHiHLXUYx4f7Ga9boW93MO+GY8v9ji1arJSD/sy/vb2dSvw3Mt4iLG92bYCzz3sUx5ifP7yoxV47mGf8hDj6/tDK/Dcw75s/r/efWsFnnvZ/CHGarVqBZ572Md8E4hXV7pHHwCCsDAqD1YnAARhYVQerI6HICyMyoPVCQRBWBiVB6sTCIKwMCoPVicQBGFhVB6sbv4QhIVRebA6gSAIC6PyYP1HoGiwOCyKEyvOg2GexWFRnFhxPuNJHBbFiRXnjneiOLEcz+KwKE6sOFeexWFRnFhxrjyLw6I4seLczd+J4sRy82dxWBQnFvoTHypRL4Vm8DRNVxcX3fRheWKv8t8/9NOH5Ym9yu/3r7rpw/LEXuXX+3U3fVie2Kv8m7cfu+nD8sRe5S8vP3XTh+WJvdn8s/Rhedz846dQL31Yntg7oxFLXPy+0757AE2f6LFYWDOBNH2ix2JhzQTS9Ikei4U1E0jzJ3osFtZMIE2f6LFYWDOBNH2ix2JhzQTS9OH587VMIE2fv6LMUsgKxO+2XtFNZryTyMmT8U4iJ0/GO4mcPBnvJHLyZLyTyMmT8U4iJ09v/kuvsN78nUROHsdbiTSBMnn0IbIEyj488yyRJlAmD/MskSZQJg/zLJEmUCYP8yyRJlAmD/MskSZQJo/OP0ugyvxZIk2grjwTCdR7nVUeABJxoV8RCBJxoV8RCBJxoV8R6F6i+0K/IhAk4kK/IhAk4kK/On/97VOdP6TR3z7cz/h2k+w/kIuwPIRWlYcsWlUesmhVeciiVeUhi1aVhyxa/2v+kEWrwtsUGhXonPRhXlNoVKBz0od5TaFRgc5JH+Y1hUYFOid9mNcUOkugKUmhMpz8FZzLj6QP8yPpw/xI+jA/kj7Mj6QP8w+d/1D66E1G5HEPMcqPyMP8iDzMj8jD/Ig8zI/Iw/xD5z8sD99kGH7hnwX/B4rVYGOI3f9nAAAAAElFTkSuQmCC';

export const paviseShieldWeapon: WeaponDefinition = {
  id: 'pavise_shield',
  name: 'Siege Pavise Bulwark',
  class: 'Tower Pavise Shield (Main / Offhand)',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'heavy',
  canBlock: true,
  passiveShieldBonus: 45,
  bladeTrailColor: '#f8fafc',
  description: 'Massive full-frame siege pavise granting +45 Max Shield Capacity and heavy fortress-ram impacts.',
  lore:
    'Engineered for Guardian and Marauder frames advancing under heavy Bolt Caster and Great Bow fire.',
  shotsPerChain: 2,
  damagePerShot: 18,
  chainDurationSec: 1.2,
  reloadDurationSec: 0.8,
  primaryDamageType: 'Impact',
  variantStripBase64: PAVISE_SHIELD_STRIP_BASE64,
  hardpointSprite: {
    base64: PAVISE_SHIELD_STRIP_BASE64,
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
    base64: PAVISE_SHIELD_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  moveset: [
    {
      slot: 0,
      name: 'Pavise Battering Ram',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.14,
      actionDurationSec: 0.4,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.8,
      heatCost: 4,
      range: 24,
      description: 'Two-stage heavy tower-shield ram dealing 18 Impact damage per shove.',
    },
    {
      slot: 1,
      name: 'Iron Curtain Sweep',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 22,
      tellDurationSec: 0.24,
      actionDurationSec: 0.38,
      cooldownSec: 5.2,
      heatCost: 15,
      range: 28,
      description: 'Clears the frontal cone with a sweeping heavy bulwark shove.',
    },
    {
      slot: 2,
      name: 'Siegebreaker Tremor',
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      damage: 28,
      tellDurationSec: 0.34,
      actionDurationSec: 0.45,
      cooldownSec: 6.5,
      heatCost: 18,
      range: 34,
      description: 'Drives the pavise spike into the floor to unleash a wide Blast tremor.',
    },
    {
      slot: 3,
      name: 'Block',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 20,
      tellDurationSec: 0.1,
      actionDurationSec: 0.35,
      cooldownSec: 4.0,
      activeDurationSec: 3.0,
      reloadDurationSec: 4.0,
      isBlock: true,
      heatCost: 14,
      range: 28,
      description: 'Plants the tower pavise for 3.0s to block incoming attacks (+35 Shield), then enters reload recovery.',
    },
    {
      slot: 4,
      name: 'Citadel Aegis Overcharge',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 36,
      tellDurationSec: 0.42,
      actionDurationSec: 0.55,
      cooldownSec: 9.5,
      heatCost: 28,
      range: 40,
      description: 'Full-commitment shield discharge that crushes surrounding armor and restores shield.',
    },
  ],
};
