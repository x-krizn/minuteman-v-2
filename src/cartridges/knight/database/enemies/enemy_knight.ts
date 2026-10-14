/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyWikiDefinition } from '../../types';
import { solidAt } from '../../physics';
import { COLS, TILE_SIZE } from '../../constants';

export const enemyKnightDef: EnemyWikiDefinition = {
  type: 'enemy_knight',
  name: 'Corrupted Knight',
  description: 'A fallen guardian automaton that mirrors the Proto Knight. Capable of raising its buckler to block incoming strikes and launching heavy slash combos.',
  hp: 6,
  maxHp: 6,
  poise: 3,
  speed: 36,
  damage: 2,
  lootTable: [
    { itemId: 'coin', chance: 0.9 },
    { itemId: 'potion_hp', chance: 0.25 },
    { itemId: 'sapphire', chance: 0.1 },
  ],
  assets: {
    imageUri: '', // Paste custom base64 sprite data URL to override rival knight sprite
    sheetIndex: -1,
    frameWidth: 16,
    frameHeight: 16,
    anchorX: 8,
    anchorY: 16,
  },
  update(rooms, state, e, dt) {
    const room = rooms[state.room];
    const roomWidth = (room?.[0]?.length || COLS) * TILE_SIZE;

    // Timers
    if (e.blockTimer && e.blockTimer > 0) {
      e.blockTimer -= dt;
      if (e.blockTimer <= 0) {
        e.isBlocking = false;
      }
    }

    if (e.attackTimer && e.attackTimer > 0) {
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) {
        e.isAttacking = false;
        e.aiState = 'patrol';
      }
    }

    const dx = state.x - e.x;
    const dy = Math.abs(state.y - e.y);
    const dist = Math.abs(dx);

    // AI State logic
    if (dist < 100 && dy < 28) {
      // Facing player
      e.dir = dx > 0 ? 1 : -1;

      // Defensive behavior: if player is attacking and within 45px, chance to raise shield
      if (state.atk > 0 && dist < 45 && !e.isBlocking && !e.isAttacking) {
        if (Math.random() < 0.6) {
          e.isBlocking = true;
          e.blockTimer = 0.5;
          e.aiState = 'block';
        }
      }

      // Attack behavior: if close enough and not blocked/attacking, initiate windup strike
      if (dist < 26 && !e.isAttacking && !e.isBlocking) {
        e.isAttacking = true;
        e.attackTimer = 0.6;
        e.aiState = 'attack';
      }

      // Movement towards player if not attacking/blocking
      if (!e.isBlocking && !e.isAttacking && dist > 20) {
        const nx = e.x + e.dir * 36 * dt;
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
        if (!wall && floor && ahead >= 8 && ahead <= roomWidth - 8) {
          e.x = nx;
        }
      }
    } else {
      // Idle patrol behavior
      e.aiState = 'patrol';
      const patrolSpeed = 20;
      const nx = e.x + e.dir * patrolSpeed * dt;
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

      if (!wall && floor && ahead >= 8 && ahead <= roomWidth - 8) {
        e.x = nx;
      } else {
        e.dir = -e.dir;
      }
    }
  },
  onDefeat(state, entity, ctx) {
    ctx.sound.playParry?.();
    ctx.spawnParticles(entity.x, entity.y - 8, 8, '#70a8ff', 'FALLEN');
  },
};
