/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyWikiDefinition } from '../../types';

export const crawlerEnemy: EnemyWikiDefinition = {
  type: 'crawler',
  name: 'Crypt Crawler',
  description: 'A skittering quadruped creature patrolling dungeon corridors.',
  hp: 2,
  maxHp: 2,
  poise: 1,
  speed: 22,
  damage: 1,
  lootTable: [
    { itemId: 'coin', chance: 0.6 },
    { itemId: 'potion_hp', chance: 0.08 },
  ],
};
