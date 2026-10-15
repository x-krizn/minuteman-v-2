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
  update(_rooms, state, e, dt) {
    const targetY = state.y - 12 + Math.sin(performance.now() / 300) * 8;
    const dx = state.x - e.x;
    const dy = targetY - e.y;

    e.dir = dx > 0 ? 1 : -1;
    const speed = 28;
    e.x += Math.sign(dx) * speed * dt;
    e.y += Math.sign(dy) * (speed * 0.75) * dt;
  },
};
