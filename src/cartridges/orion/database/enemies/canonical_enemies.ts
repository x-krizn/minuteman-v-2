/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../types';
import { getDirFromVector } from '../../constants';

export const bogCrawlerEnemy: EnemyWikiDefinition = {
  type: 'bog_crawler',
  name: 'Bog Crawler',
  description: 'An aggressive armored arthropod dwelling in the deep mud of M00.',
  lore:
    'Native to the toxic marshes of Belldor, it burrows beneath floating reeds and ambushes passing drop-pod pilots with sudden impact lunges.',
  shields: { type: 'energy', capacity: 0 },
  armor: { type: 'Hardened', threshold: 5, rating: 2, durability: 35 },
  frameIntegrity: 48,
  speed: 28,
  damage: 12,
  damageType: 'Impact',
  tellDurationSec: 0.35, // Clear windup tell before lunge
  attackCooldownSec: 1.8,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 6 },
    { itemId: 'repair_kit', chance: 0.35 },
    { itemId: 'rusted_gate_key', chance: 0.25 },
  ],
  update(rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }

    const distToPlayer = Math.hypot(state.x - e.x, state.y - e.y);

    if (e.attackCd > 0) {
      e.attackCd -= dt;
    }

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        // Unleash lunge
        e.state = 'attack';
        e.stateTimer = 0.2;
        // Pounce toward player
        const dx = state.x - e.x;
        const dy = state.y - e.y;
        const norm = Math.hypot(dx, dy) || 1;
        e.x += (dx / norm) * 14;
        e.y += (dy / norm) * 14;
      }
      return;
    }

    if (e.state === 'attack') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'recovery';
        e.stateTimer = 0.4;
      }
      return;
    }

    if (e.state === 'recovery') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'idle';
        e.attackCd = 1.8;
      }
      return;
    }

    // Notice player
    if (distToPlayer < 90) {
      const dx = state.x - e.x;
      const dy = state.y - e.y;
      e.dir = getDirFromVector(dx, dy);

      if (distToPlayer <= 26 && e.attackCd <= 0) {
        // Telegraph windup!
        e.state = 'windup';
        e.stateTimer = this.tellDurationSec;
        return;
      }

      // Step towards player through mud
      const step = e.speed * dt;
      if (distToPlayer > 18) {
        e.x += (dx / distToPlayer) * step;
        e.y += (dy / distToPlayer) * step;
      }
    } else {
      e.t += dt;
      e.x += Math.cos(e.t * 1.5) * 8 * dt;
      e.y += Math.sin(e.t * 1.5) * 8 * dt;
    }
  },
};

export const borsKnightEnemy: EnemyWikiDefinition = {
  type: 'bors_knight',
  name: 'Sir Bors (Corrupted)',
  description: 'A heavy berserk knight warped by the desynchronized Grail.',
  lore:
    'Gains +10% damage per strike landed; below 50% HP enters Grail Overload, ignoring heat penalties and executing low-integrity frames.',
  shields: { type: 'physical', capacity: 60 },
  armor: { type: 'Reactive', threshold: 8, rating: 5, durability: 80 },
  frameIntegrity: 160,
  speed: 24,
  damage: 22,
  damageType: 'Impact',
  tellDurationSec: 0.5,
  attackCooldownSec: 2.2,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 50 },
    { itemId: 'corrupted_shard', chance: 1.0 },
    { itemId: 'grail_water', chance: 1.0 },
  ],
  update(rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }

    const distToPlayer = Math.hypot(state.x - e.x, state.y - e.y);

    if (e.attackCd > 0) {
      e.attackCd -= dt;
    }

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.25;
      }
      return;
    }

    if (e.state === 'attack') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'idle';
        e.attackCd = 2.0;
      }
      return;
    }

    if (distToPlayer < 100) {
      const dx = state.x - e.x;
      const dy = state.y - e.y;
      e.dir = getDirFromVector(dx, dy);

      if (distToPlayer <= 32 && e.attackCd <= 0) {
        e.state = 'windup';
        e.stateTimer = this.tellDurationSec;
        return;
      }

      const step = e.speed * dt;
      if (distToPlayer > 22) {
        e.x += (dx / distToPlayer) * step;
        e.y += (dy / distToPlayer) * step;
      }
    }
  },
};

export const ENEMY_REGISTRY: Record<string, EnemyWikiDefinition> = {
  bog_crawler: bogCrawlerEnemy,
  bors_knight: borsKnightEnemy,
};

export function getEnemyDefinition(type: string): EnemyWikiDefinition | undefined {
  return ENEMY_REGISTRY[type];
}
