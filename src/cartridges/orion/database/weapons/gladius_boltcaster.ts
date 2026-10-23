/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 12 (row = 11): Bolt Caster 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const BOLT_CASTER_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAAA8klEQVR42u2VMQrCMBhGc5IO3Ry6tIMImQtSEHUs6GIpOjn0AILYG0ghuDs4u3mBDh6h13DpEkmovwVLWnSSfg8eGcJLIPwQxgAAAAAAAAAAAAAAAAAAAP4DIYRsU4EefWPMGOvqB+rgyLJk5jjanHOyDALS1J8WTEpReX9blgFp6rPMkXnOtUUxJLv2POPSv/jaMA/JqIxIUz+erOVytdfuDmcyDK+kqXfdrZwOYm06F2SSPMi2909HG+1tdiS7vr9abNvWep5HxnFMNvZqeNRmPTLZdLk6A30P+/rwfPPtvS6vphN9z3r2y/DUBxB9P/snNOgshRDu7iEAAAAASUVORK5CYII=';

export const gladiusBoltcasterWeapon: WeaponDefinition = {
  id: 'gladius_boltcaster',
  name: 'Gladius Bolt Caster',
  class: 'Bolt Caster / Rifle',
  equipmentRole: 'ranged',
  handing: '1-hand',
  weightClass: 'medium',
  bladeTrailColor: '#f8fafc',
  description: 'The standard-issue reference ballistic bolt caster of the expeditionary pilots.',
  lore:
    'The Gladius Bolt Caster fires high-velocity armor-piercing bolts in 9-round salvos. Its full burst defines the Base Combat Unit (54 BCU).',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.5,
  reloadDurationSec: 3.15,
  primaryDamageType: 'Pierce',
  variantStripBase64: BOLT_CASTER_STRIP_BASE64,
  hardpointSprite: {
    base64: BOLT_CASTER_STRIP_BASE64,
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
    base64: BOLT_CASTER_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  renderHardpoint25D(g, wx, wy, _dirDx, dirDy) {
    g.fillStyle = '#94a3b8';
    g.fillRect(wx - 1, wy, 3, 6);
    g.fillStyle = '#fbbf24';
    g.fillRect(wx - 1, wy + (dirDy >= 0 ? 5 : -1), 3, 2);
  },
  moveset: [
    {
      slot: 0,
      name: 'Gladius Auto-Salvo',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 6,
      tellDurationSec: 0.08,
      actionDurationSec: 1.5,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 3.15,
      heatCost: 4,
      range: 85,
      description: 'Standard 9-round burst chain dealing 6 Pierce damage per shot (54 BCU total).',
    },
    {
      slot: 1,
      name: 'AP Penetrator Slug',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.25,
      actionDurationSec: 0.35,
      cooldownSec: 4.0,
      heatCost: 15,
      range: 110,
      description: 'Heavy armor-piercing bolt that punches straight through high-threshold armor.',
    },
    {
      slot: 2,
      name: 'Concussion Grenade',
      damageType: 'Blast',
      damageFamily: 'Kinetic',
      damage: 24,
      tellDurationSec: 0.35,
      actionDurationSec: 0.45,
      cooldownSec: 6.5,
      heatCost: 22,
      range: 75,
      description: 'High-explosive canister inflicting Blast damage and opening a crowd-control window.',
    },
    {
      slot: 3,
      name: 'Suppression Arc',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 8,
      tellDurationSec: 0.15,
      actionDurationSec: 0.4,
      cooldownSec: 5.0,
      heatCost: 18,
      range: 65,
      description: 'Horizontal fan of 4 flechette bolts to suppress advancing swarms.',
    },
    {
      slot: 4,
      name: 'Overcharge Discharge',
      damageType: 'Beam',
      damageFamily: 'Energy',
      damage: 32,
      tellDurationSec: 0.45,
      actionDurationSec: 0.8,
      cooldownSec: 9.0,
      activeDurationSec: 0.8,
      reloadDurationSec: 9.0,
      heatCost: 35,
      range: 90,
      description: 'Sustained energy beam active for 0.8s burning through shields and armor, then enters reload recovery.',
    },
  ],
};
