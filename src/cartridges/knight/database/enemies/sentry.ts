/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyWikiDefinition } from '../../types';
import { solidAt } from '../../physics';
import { COLS, TILE_SIZE } from '../../constants';

export const sentryEnemy: EnemyWikiDefinition = {
  type: 'sentry',
  name: 'Iron Sentry',
  description: 'An armored stationary construct patrolling stone walkways and alerting to intrusions.',
  hp: 3,
  maxHp: 3,
  poise: 2,
  speed: 12,
  damage: 1,
  lootTable: [
    { itemId: 'coin', chance: 0.8 },
    { itemId: 'potion_ap', chance: 0.15 },
    { itemId: 'emerald', chance: 0.05 },
  ],
  update(rooms, state, e, dt) {
    const room = rooms[state.room];
    const roomWidth = (room?.[0]?.length || COLS) * TILE_SIZE;

    // Sentry faces towards player if nearby
    const dist = Math.abs(state.x - e.x);
    if (dist < 60) {
      e.dir = state.x > e.x ? 1 : -1;
    }

    // Sentry walks cautiously
    const speed = 12;
    const nx = e.x + e.dir * speed * dt;
    const ahead = nx + e.dir * 7;
    const wall = solidAt(
      rooms,
      state,
      Math.floor(ahead / TILE_SIZE),
      Math.floor((e.y - 1) / TILE_SIZE)
    );
    const floor = solidAt(
      rooms,
      state,
      Math.floor(ahead / TILE_SIZE),
      Math.floor((e.y + 1) / TILE_SIZE)
    );

    if (!wall && floor && ahead >= 6 && ahead <= roomWidth - 6) {
      e.x = nx;
    }
  },
};
