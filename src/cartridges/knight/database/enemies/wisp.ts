/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyWikiDefinition } from '../../types';

export const wispEnemy: EnemyWikiDefinition = {
  type: 'wisp',
  name: 'Grave Wisp',
  description: 'An ethereal flame floating along sinusoidal trajectories through stone chambers.',
  hp: 1,
  maxHp: 1,
  poise: 0,
  speed: 28,
  damage: 1,
  lootTable: [
    { itemId: 'coin', chance: 0.5 },
    { itemId: 'potion_ep', chance: 0.2 },
    { itemId: 'sapphire', chance: 0.05 },
  ],
};
