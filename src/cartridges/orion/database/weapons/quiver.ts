/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 14 (row = 13): Quiver 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const QUIVER_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAABY0lEQVR42u2WMUoDURCG9yS5gU22sNkLSIKg5YLdsthZ5AA2eoOwEOw9gZ0XSJEj5Bo2rxn5nz4YQnx5Mwu+5v9gGAL5FnaYzJ+mIYQQQgghhNgREdGfd+NadF3yw2o1zw91/SEMs/y+/5jlbzZfVec/jqPflzNoeVy3cvpAXcNiIXgB9H3XxbL4bw+NYAHQ5fBTFn+arqKPfjxex7L43dQJFgi93/exLP7N7aNggdCfX95jWfzl8kmwQOiv97tY3vl/3m1jWXyswO8CSdu2sYx+/gKVPCD3CyjyQ10/d4FK/NwFKvFzF+g/5p+7QEULdBpl3gekF3H7oa6fFsnrp0Xy+mmRas0/LZLrAuUiLFfwEVv6lFp9xJaOMquP2NJRZvURWzrKrD5iS0eZ1Uds6Siz+oitOfNHbOkos/pnL9CfXyr4M+f2Q11fXyCPry+Qx9cXqMb89QXy+IQQQgghhJACvgFTvSjeUrUhkAAAAABJRU5ErkJggg==';

export const quiverWeapon: WeaponDefinition = {
  id: 'quiver',
  name: 'Fletcher Munitions Quiver',
  class: 'Ranged Quiver (Offhand / Set)',
  equipmentRole: 'quiver',
  weightClass: 'light',
  bladeTrailColor: '#f8fafc',
  description: 'Belt-fed fletcher quiver that grants +3 Magazine Capacity & -25% Reload Time when paired with ranged weapons, or fires rapid flechettes.',
  lore:
    'Houses Gem-tipped bolts and heavy arrows in an automated spring-rack. Essential companion for Great Bow and Bolt Caster specialists.',
  shotsPerChain: 12,
  damagePerShot: 5,
  chainDurationSec: 1.4,
  reloadDurationSec: 2.0,
  primaryDamageType: 'Pierce',
  variantStripBase64: QUIVER_STRIP_BASE64,
  hardpointSprite: {
    base64: QUIVER_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 13,
    renderHeight: 13,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: QUIVER_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  moveset: [
    {
      slot: 0,
      name: 'Quick-Draw Flechette',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 5,
      tellDurationSec: 0.06,
      actionDurationSec: 1.2,
      cooldownSec: 0,
      heatCost: 2,
      range: 90,
      description: 'Rapid 12-dart flechette stream from the mechanized quiver rack.',
    },
    {
      slot: 1,
      name: 'Snap-Load Salvo',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 20,
      tellDurationSec: 0.18,
      actionDurationSec: 0.3,
      cooldownSec: 4.0,
      heatCost: 10,
      range: 95,
      description: 'Fires a 3-bolt burst while immediately refilling active magazine rounds.',
    },
    {
      slot: 2,
      name: 'Caltrop Scatter',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 16,
      tellDurationSec: 0.15,
      actionDurationSec: 0.3,
      cooldownSec: 5.0,
      heatCost: 11,
      range: 45,
      description: 'Scatters armor-piercing flechette spikes to slow pursuing enemies.',
    },
    {
      slot: 3,
      name: 'Tracer Tag Dart',
      damageType: 'Pierce',
      damageFamily: 'Energy',
      damage: 14,
      tellDurationSec: 0.15,
      actionDurationSec: 0.3,
      cooldownSec: 4.5,
      heatCost: 9,
      range: 110,
      description: 'Tags targets with a luminescent Gem tracer (+25% Optic Vulnerability).',
    },
    {
      slot: 4,
      name: 'Hurricane Quiver Dump',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 30,
      tellDurationSec: 0.32,
      actionDurationSec: 0.5,
      cooldownSec: 8.0,
      heatCost: 22,
      range: 100,
      description: 'Empties an entire rack of Gem-tipped shafts in a high-velocity fan.',
    },
  ],
};
