/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyWikiDefinition } from '../../types';
import { solidAt } from '../../physics';
import { COLS, TILE_SIZE } from '../../constants';

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
  assets: {
    imageUri: '', // Paste custom base64 sprite data URL to override procedural crawler render
    sheetIndex: -1,
    frameWidth: 16,
    frameHeight: 16,
    anchorX: 8,
    anchorY: 16,
  },
  update(rooms, state, e, dt) {
    const room = rooms[state.room];
    const roomWidth = (room?.[0]?.length || COLS) * TILE_SIZE;
    const speed = 22;
    const nx = e.x + e.dir * speed * dt;
    const ahead = nx + e.dir * 6;
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

    if (wall || !floor || ahead < 4 || ahead > roomWidth - 4) {
      e.dir = -e.dir;
    } else {
      e.x = nx;
    }
  },
};
