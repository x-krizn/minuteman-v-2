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
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAADZUlEQVR42u3WMWobURQF0FmJd5DGKtJoA0EQSEpBOmHSpfAC0iQ7CAKRPitIlw240BK8jTRuEh7kfq7v3PfnzUdOYw88/vD0r9B8Hz9pmuj6U7ym5HrJP+N8vHA+n0vl3iR6D7tdqdL8w65UT5U/PBxKleX3+5+lyvK3t79L9VTnf3NzU6pZPsODawlR9uFxLT1E9sdv+QUEl8hnUHqvLeHBtYQow4NrCdElzj+D0nutATqdTg1G3KOWepzHB7vbblthL/ewb5bHH/Y8tWpYqYd9Wf7+/nUr5LmX5QFjf7dvhTz3sE/zgPH5y49WyHMP+zQPGF/fn1ohzz3sy87/17tvrZDnXnb+gLHZbFohzz3s43wDxKsr3aMPACAMRvFgdQAAhMEoHqwuDyAMRvFgdYAAhMEoHqwOEIAwGMWD1QECEAajeLC68wcQBqN4sDpAAMJgFA/WR4CiwXAYioMV95HhPMNhKA5W3M/yBIehOFhx7/IOioPl8gyHoThYca95hsNQHKy41zzDYSgOVty783dQHCx3/gyHoThY6D/6HaSIelNoFp6m6XB11Z0+jCf2av77h/70YTyxV/PH46vu9GE8sVfz2+O2O30YT+zV/Ju3H7vTh/HEXs1fX3/qTh/GE3uz88+mD+Nx5x8/hXrTh/HE3lkaY4mLv++07x5Ap0/0GBbWDJBOn+gxLKwZIJ0+0WNYWDNAOn+ix7CwZoB0+kSPYWHNAOn0iR7DwpoB0unD58+vZYB0+vyDMptCFhB/t/WK3mSWd4gcnizvEDk8Wd4hcniyvEPk8GR5h8jhyfIOkcPTO/+lr7De+TtEDo/LW0Q6gTI8GSKdQNmHzxDpBMrwZIh0AmV4MkQ6gTI8GSKdQBmeDJFOoAxPhkgnUOX8GZFOoC4eBtT7Oqs8ABBxoV8BBERc6FcAAREX+hVAQMSFfgUQEHGhXwEERFzoV89ff/tUzx9o9LcP96fexYi0FsPyEFrVPLBoVfPAolXNA4tWNQ8sWtU8sGj9r/MHFq1K3k6hUUBrpk9vCo0CWjN9elNoFNCa6dObQqOA1kyf3hRaBSibQuVw8l+wNj8yfXpTaG1+ZPr0ptDa/Mj0ueT5D02fDNHqsDzEaH4Ej0M0mh/B4xCN5kfwXPL8h/HwmwyHX/LPIv8XgjFggTGITlsAAAAASUVORK5CYII=';

export const paviseShieldWeapon: WeaponDefinition = {
  id: 'pavise_shield',
  name: 'Siege Pavise Bulwark',
  class: 'Tower Pavise Shield (Main / Offhand)',
  equipmentRole: 'shield',
  weightClass: 'heavy',
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
      heatCost: 4,
      range: 24,
      description: 'Two-stage heavy tower-shield ram dealing 18 Impact damage per shove.',
    },
    {
      slot: 1,
      name: 'Fortress Plant & Fortify',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 20,
      tellDurationSec: 0.28,
      actionDurationSec: 0.4,
      cooldownSec: 5.5,
      heatCost: 14,
      range: 28,
      description: 'Plants the pavise into the ground, restoring +35 Shield Capacity and staggering nearby foes.',
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
