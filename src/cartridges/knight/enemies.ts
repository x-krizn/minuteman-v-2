/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyEntity, KnightState } from './types';
import { SCREEN_W, TILE_SIZE } from './constants';
import { solidAt } from './physics';
import { ENEMY_REGISTRY } from './database/enemies';
import { getItemDefinition } from './database/items';
import { soundSystem } from '../../engine/core/soundSystem';
import { spawnParticles } from './particles';

export function updateEnemies(
  rooms: Record<string, string[]>,
  state: KnightState,
  dt: number
): void {
  state.enemies.forEach((e) => {
    if (e.hp <= 0) return;

    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }

    if (e.type === 'crawler') {
      updateCrawler(rooms, state, e, dt);
    } else if (e.type === 'sentry') {
      updateSentry(rooms, state, e, dt);
    } else if (e.type === 'wisp') {
      updateWisp(state, e, dt);
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

  soundSystem.playHit();
  spawnParticles(state.particles, e.x, e.y - 6, 12, '#ff4444');

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

function updateCrawler(
  rooms: Record<string, string[]>,
  state: KnightState,
  e: EnemyEntity,
  dt: number
): void {
  const speed = ENEMY_REGISTRY.crawler.speed;
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

  if (wall || !floor || ahead < 4 || ahead > SCREEN_W - 4) {
    e.dir = -e.dir;
  } else {
    e.x = nx;
  }
}

function updateSentry(
  rooms: Record<string, string[]>,
  state: KnightState,
  e: EnemyEntity,
  dt: number
): void {
  // Sentry faces towards player if nearby
  const dist = Math.abs(state.x - e.x);
  if (dist < 60) {
    e.dir = state.x > e.x ? 1 : -1;
  }

  // Sentry walks cautiously
  const speed = ENEMY_REGISTRY.sentry.speed;
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

  if (!wall && floor && ahead >= 6 && ahead <= SCREEN_W - 6) {
    e.x = nx;
  }
}

function updateWisp(
  state: KnightState,
  e: EnemyEntity,
  dt: number
): void {
  // Flying wisp undulating sinusoidal hover
  e.vx = (e.vx || 0);
  e.vy = (e.vy || 0);

  const targetY = state.y - 12 + Math.sin(performance.now() / 300) * 8;
  const dx = state.x - e.x;
  const dy = targetY - e.y;

  e.dir = dx > 0 ? 1 : -1;
  const speed = ENEMY_REGISTRY.wisp.speed;
  e.x += Math.sign(dx) * speed * dt;
  e.y += Math.sign(dy) * (speed * 0.75) * dt;
}
