/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 10 (row = 9): Buckler Shield 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const BUCKLER_SHIELD_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAACLklEQVR42u2WMU7DQBREfRLXaWjiAgoXdAgFIQEVlugsi44iB6CBG6BIET0noOMCKXKEXIMmTdAsns/KWeQdhQr9kb7260tjZdfPky0Kl8vlcrlcLpdpuVzu1ut1KPSqf1XX5kev+nfrwvzoVf9mc2x+9Kq/WTXmR6/6H5/ezI9e9T9f/5w/etX/cfVifvSqv6oq86OX4UmVAk+qFHhSpcCTKgWeVCnwpEqBJ1UKPKlS4ElVlrnrugALViqejfnbsgywYN3OZqHi2Zj/9e4bFqzb7SxUPBvzLxZHARas9MezMX+9qAMsWNttGyqejfnPL+8DLFib5j1UPBvzT6cPARas8/lnqHiWc/6AZXj+nOV8vz0s4X3379xmWQChwl9HL/TRw0Y3wB9PcRO5ABEe8/cQ5QJEeGI/5zkAER6KEOUCRHgoQpQLEOGhCFEuQIecfw/JXoBwLgEUlwoQEodfANNHAQiJwwRh+igAIXHoZ/ooACFxmEBMHwUgJA4TiOmjAITEYQIxfRSAkDg8f6aPAhASh+88Sp98gGDi3Sd+WO4GborC7j7oVYC6i8ruPuhVgNq2tLsPehWgSTuxuw96FaD69NbuPuhVgE7KM7v7oFcBIkQxPApAhGgAT/49iBAp8KQgUuBJQaTAk4JIgScFkQJPCiIFnhRECjwpiER49iCS4RlCpMLz2yZUP6FR4RlCpMIzhEiFZwiRCs8QIhWevzr/g+BxuVwul8vl+uf6AhY6IjsVw4nHAAAAAElFTkSuQmCC';

export const bucklerShieldWeapon: WeaponDefinition = {
  id: 'buckler_shield',
  name: 'Duelist Buckler',
  class: 'Buckler Shield (Main / Offhand)',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'light',
  passiveShieldBonus: 15,
  bladeTrailColor: '#f8fafc',
  description: 'Agile center-grip parrying buckler granting +15 Max Shield Capacity and rapid deflection ripostes.',
  lore:
    'Lightweight round buckler favored by Rogue and Warrior duelists who rely on timed parries without sacrificing mobility.',
  shotsPerChain: 4,
  damagePerShot: 9,
  chainDurationSec: 0.85,
  reloadDurationSec: 0.4,
  primaryDamageType: 'Impact',
  variantStripBase64: BUCKLER_SHIELD_STRIP_BASE64,
  hardpointSprite: {
    base64: BUCKLER_SHIELD_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 12,
    renderHeight: 12,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: BUCKLER_SHIELD_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  moveset: [
    {
      slot: 0,
      name: 'Buckler Knuckle Jab',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 9,
      tellDurationSec: 0.06,
      actionDurationSec: 0.22,
      cooldownSec: 0,
      heatCost: 1,
      range: 20,
      description: 'Fast four-hit buckler punch combo with near-instant windup.',
    },
    {
      slot: 1,
      name: 'Kinetic Deflect Parry',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 20,
      tellDurationSec: 0.12,
      actionDurationSec: 0.25,
      cooldownSec: 3.2,
      heatCost: 8,
      range: 24,
      description: 'Snap-parry that staggers close attackers and recharges +15 Shield.',
    },
    {
      slot: 2,
      name: 'Ricochet Disc Toss',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.2,
      actionDurationSec: 0.35,
      cooldownSec: 4.5,
      heatCost: 10,
      range: 70,
      description: 'Hurls the magnetized buckler rim at ranged targets before recalling it.',
    },
    {
      slot: 3,
      name: 'Feint & Sidestep Bash',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 15,
      tellDurationSec: 0.14,
      actionDurationSec: 0.28,
      cooldownSec: 4.0,
      heatCost: 9,
      range: 26,
      description: 'Quick glancing blow that opens enemy guard for follow-up strikes.',
    },
    {
      slot: 4,
      name: 'Capacitor Flash Counter',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 26,
      tellDurationSec: 0.28,
      actionDurationSec: 0.4,
      cooldownSec: 7.0,
      heatCost: 18,
      range: 30,
      description: 'Blinds and stuns adjacent hostiles with an overcharged buckler flash.',
    },
  ],
};
