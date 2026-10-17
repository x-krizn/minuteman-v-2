/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

export const gladiusBoltcasterWeapon: WeaponDefinition = {
  id: 'gladius_boltcaster',
  name: 'Gladius Boltcaster',
  class: 'Boltcaster / Rifle',
  description: 'The standard-issue reference ballistic rifle of the expeditionary pilots.',
  lore:
    'The Gladius Boltcaster fires high-velocity armor-piercing bolts in 9-round salvos. Its full burst defines the Base Combat Unit (54 BCU).',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.5,
  reloadDurationSec: 3.15, // 9 * 0.35s
  primaryDamageType: 'Pierce',
  renderHardpoint25D(g, wx, wy, _dirDx, dirDy) {
    // Gladius Boltcaster: Steel rifle barrel with amber muzzle
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
      description: 'Heavy armor-piercing round that punches straight through high-threshold armor.',
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
      heatCost: 35,
      range: 90,
      description: 'Sustained energy beam burning through shields and armor; generates significant heat.',
    },
  ],
};
