/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';
import { SHORT_SPEAR_STRIP_BASE64 } from './short_spear';

export const avalonSiegeLanceWeapon: WeaponDefinition = {
  id: 'avalon_siege_lance',
  name: 'Avalon Heavy Lance',
  class: 'Heavy Artillery Lance',
  equipmentRole: 'melee',
  handing: '2-hand',
  weightClass: 'heavy',
  bladeTrailColor: '#f8fafc',
  description: 'Heavy two-stage kinetic siege lance requiring Heavy load capacity or System Feats to mount without penalty.',
  lore:
    'Standard garrison heavy weapon of the Camelot Barracks Quarter. Delivers high-commitment Impact and Blast payloads at the cost of heavy chassis load.',
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDurationSec: 1.8,
  reloadDurationSec: 3.6,
  primaryDamageType: 'Impact',
  variantStripBase64: SHORT_SPEAR_STRIP_BASE64,
  hardpointSprite: {
    base64: SHORT_SPEAR_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 16,
    renderHeight: 16,
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
  renderHardpoint25D(g, wx, wy, _dirDx, dirDy) {
    g.fillStyle = '#475569';
    g.fillRect(wx - 2, wy - 1, 4, 8);
    g.fillStyle = '#38bdf8';
    g.fillRect(wx - 1, wy + (dirDy >= 0 ? 6 : -2), 2, 2);
  },
  moveset: [
    {
      slot: 0,
      name: 'SiegeSlug Salvo',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.16,
      actionDurationSec: 0.6,
      cooldownSec: 0,
      heatCost: 6,
      range: 120,
      description: 'Heavy 3-round kinetic slug chain (54 BCU total). High commitment tell.',
    },
    {
      slot: 1,
      name: 'Breaching Bore',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 28,
      tellDurationSec: 0.28,
      actionDurationSec: 0.35,
      cooldownSec: 4.5,
      heatCost: 16,
      range: 135,
      description: 'High-velocity armor-piercing sabot round.',
    },
    {
      slot: 2,
      name: 'Concussion Mortar',
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      damage: 26,
      tellDurationSec: 0.32,
      actionDurationSec: 0.4,
      cooldownSec: 6.0,
      heatCost: 20,
      range: 110,
      description: 'Lobbed artillery shell that staggers armored targets.',
    },
    {
      slot: 3,
      name: 'Bastion Sweep',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 24,
      tellDurationSec: 0.25,
      actionDurationSec: 0.35,
      cooldownSec: 7.0,
      heatCost: 18,
      range: 42,
      description: 'Wide heavy lance sweep that knocks back close-range attackers.',
    },
    {
      slot: 4,
      name: 'Grail Overcharge Barrage',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 42,
      tellDurationSec: 0.45,
      actionDurationSec: 0.55,
      cooldownSec: 11.0,
      heatCost: 34,
      range: 135,
      description: 'Full-commitment reactor discharge through the heavy lance bore.',
    },
  ],
};
