/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyWikiDefinition } from '../../types';

export const sentryEnemy: EnemyWikiDefinition = {
  type: 'sentry',
  name: 'Iron Sentry',
  description: 'An armored stationary construct armed with high-velocity projectile shots.',
  hp: 3,
  maxHp: 3,
  poise: 2,
  speed: 0,
  damage: 1,
  lootTable: [
    { itemId: 'coin', chance: 0.8 },
    { itemId: 'potion_ap', chance: 0.15 },
    { itemId: 'emerald', chance: 0.05 },
  ],
};
