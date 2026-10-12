/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyEntity, KnightState } from './types';
import { ENEMY_REGISTRY } from './database/enemies';
import { getItemDefinition } from './database/items';
import { soundSystem } from '../../engine/core/soundSystem';
import { spawnParticles } from './particles';
import { solidAt } from './physics';
import { TILE_SIZE } from './constants';

/**
 * Generic enemy update loop delegating AI to registered definitions
 */
export function updateEnemies(
  rooms: Record<string, string[]>,
  state: KnightState,
  dt: number
): void {
  state.enemies.forEach((e) => {
    if (e.hp <= 0) return;

    // Apply gravity to ground enemies (non-flying)
    if (e.type !== 'wisp') {
      const footTx = Math.floor(e.x / TILE_SIZE);
      const footTy = Math.floor((e.y + 1) / TILE_SIZE);
      const isGrounded =
        solidAt(rooms, state, footTx, footTy) ||
        solidAt(rooms, state, Math.floor((e.x - 4) / TILE_SIZE), footTy) ||
        solidAt(rooms, state, Math.floor((e.x + 4) / TILE_SIZE), footTy);

      if (!isGrounded) {
        e.vy = Math.min((e.vy || 0) + 600 * dt, 280);
        const nextY = e.y + e.vy * dt;
        const currentTy = Math.floor(e.y / TILE_SIZE);
        const nextTy = Math.floor(nextY / TILE_SIZE);

        let landed = false;
        for (let ty = currentTy + 1; ty <= nextTy; ty++) {
          if (
            solidAt(rooms, state, footTx, ty) ||
            solidAt(rooms, state, Math.floor((e.x - 4) / TILE_SIZE), ty) ||
            solidAt(rooms, state, Math.floor((e.x + 4) / TILE_SIZE), ty)
          ) {
            e.y = ty * TILE_SIZE;
            e.vy = 0;
            landed = true;
            break;
          }
        }

        if (!landed) {
          e.y = nextY;
          if (e.stun > 0) {
            e.stun -= dt;
          }
          return; // While airborne / falling, do not execute lateral patrol AI
        }
      } else {
        e.vy = 0;
      }
    }

    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }

    const def = ENEMY_REGISTRY[e.type];
    if (def?.update) {
      def.update(rooms, state, e, dt);
    }
  });
}

/**
 * Handles enemy defeat, death effects, and wiki-defined loot table drops
 */
export function defeatEnemy(
  state: KnightState,
  e: EnemyEntity,
  say?: (text: string) => void
): void {
  e.hp = 0;
  const def = ENEMY_REGISTRY[e.type];
  if (!def) return;

  if (def.onDefeat) {
    def.onDefeat(state, e, {
      sound: soundSystem,
      say,
      spawnParticles: (x, y, count, color, text) =>
        spawnParticles(state.particles, x, y, count, color, text),
    });
  } else {
    soundSystem.playHit();
    spawnParticles(state.particles, e.x, e.y - 6, 12, '#ff4444');
  }

  // Roll loot from database wiki definition
  if (def.lootTable && def.lootTable.length > 0) {
    def.lootTable.forEach((entry) => {
      if (Math.random() <= entry.chance) {
        const item = getItemDefinition(entry.itemId);
        if (item) {
          state.picks.push({
            x: e.x + (Math.random() * 8 - 4),
            y: e.y - 8,
            c: item.symbol || item.id,
            id: `drop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          });
        }
      }
    });
  }
}
