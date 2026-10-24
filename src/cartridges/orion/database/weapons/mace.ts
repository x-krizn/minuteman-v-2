/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 6 (row = 5): Mace 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const MACE_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAACCElEQVR42u2YMU7DQBBFfZLcgCYuaHIBlAgJSkt0kUVHkQPQwA1QpIieE9BxgRQ+Qq5B4wb0V/xhAK1mNgEL8Kz0tevZeSTYT2tEVcWIESPGrx0vn0Yp38/nwmJdzPeK74fnl/1SeKxL+aZ5FB7rUn61ehYe66Hvf9u2wmN9kDylEvHLY9br0oePWa+H4ikPZr0ulQezXpfKg1mvh7r/lAezXrvl6bouhUNfe748+7ezWQqvPb8EHrR8XlelCN+X8bvdcUoJD1HY32ybFF57JIIo7L++eUiRn+eQCKKw//Z8k8Jrj0T6/j+d3aWU3H+Iwv66rlN47ZIIjZvN+5dmWLN4CJPjsWcK3FVZHnsWD2FyPPZMAbZNlseexUOYHI89i4cwOR57Fg9hcjz2LB7C5HjsmQKhEaZh1mHNI9ByMpHTh2HNI9D9RSWnD8OaR6D1+khOH4Y1j0Cz9UxOH4Y1j0Anp5dy+jCseQSaTq/k9GFY8wiEe83Th2HNIxAeA08fhjXX+w+NfP8xrJmvgMkk9WHWYc3iIQp6MeuwZvEQBb2YdVizeIiCXsw6rFk8REEvZh3WLB6ioBezDms/ff8hyttz/hBVM06gdvHFPmWh62+onIDB/3Me8rSLWoB95OHrLviR8Vqeff5vBJ4fHvzI+O+QJ/iR8nHzgg95gg95gv9bfHUQHPzo+VduYHGa/3UAgwAAAABJRU5ErkJggg==';

export const maceWeapon: WeaponDefinition = {
  id: 'mace',
  name: 'Sanctum Flange Mace',
  class: 'Heavy Mace / Blunt',
  equipmentRole: 'melee',
  handing: '1-hand',
  weightClass: 'medium',
  canBlock: true,
  bladeTrailColor: '#f8fafc',
  description: 'Weighted flanged morningstar mace engineered todent heavy Ablative and Reactive armor.',
  lore:
    'Wielded by Cleric and Guardian war-priests of Belldor. Its heavy Impact blows bypass blade-deflecting plating and crack armor durability.',
  shotsPerChain: 3,
  damagePerShot: 16,
  chainDurationSec: 1.1,
  reloadDurationSec: 0.6,
  primaryDamageType: 'Impact',
  variantStripBase64: MACE_STRIP_BASE64,
  hardpointSprite: {
    base64: MACE_STRIP_BASE64,
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
    base64: MACE_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  moveset: [
    {
      slot: 0,
      name: 'Crushing Flange Combo',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 16,
      tellDurationSec: 0.11,
      actionDurationSec: 0.36,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.6,
      heatCost: 4,
      range: 25,
      description: 'Three-hit heavy Impact mace chain that dents armor plating.',
    },
    {
      slot: 1,
      name: 'Skullcracker Overhead',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 30,
      tellDurationSec: 0.32,
      actionDurationSec: 0.4,
      cooldownSec: 4.8,
      heatCost: 15,
      range: 28,
      description: 'High-commitment overhead smash that inflicts heavy Impact damage and stuns.',
    },
    {
      slot: 2,
      name: 'Armor-Sunder Swing',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 20,
      tellDurationSec: 0.2,
      actionDurationSec: 0.35,
      cooldownSec: 5.0,
      heatCost: 13,
      range: 26,
      description: 'Targeted horizontal blow designed to strip Layer 2 Armor Durability.',
    },
    {
      slot: 3,
      name: 'Block',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 14,
      tellDurationSec: 0.05,
      actionDurationSec: 0.2,
      cooldownSec: 0,
      isBlock: true,
      heatCost: 4,
      range: 24,
      description: 'Hold to raise reinforced mace shaft guard (0.25s Perfect Block window nullifies damage & staggers attackers). No cooldown.',
    },
    {
      slot: 4,
      name: 'Sanctum Consecration Slam',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 36,
      tellDurationSec: 0.4,
      actionDurationSec: 0.55,
      cooldownSec: 9.0,
      heatCost: 28,
      range: 42,
      description: 'Channels reactor energy into the mace head for a massive sanctum blast.',
    },
  ],
};
