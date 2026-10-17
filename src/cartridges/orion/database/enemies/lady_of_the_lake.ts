/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { getDirFromVector } from '../../constants';
import { notifyOrionStateChange } from '../../stateStore';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../types';

export const ladyOfTheLakeEnemy: EnemyWikiDefinition = {
  type: 'lady_of_the_lake',
  name: 'The Lady of the Lake',
  faction: 'hostile',
  emissiveColor: '#c084fc',
  tellRadius: 34,
  description: 'Something half machine and half serpent, an old name twisted by the æther.',
  lore:
    'Whoever collects all items on Bedivere’s numbered list and returns to the bog will find the water has been waiting.',
  shields: { type: 'energy', capacity: 80 },
  armor: { type: 'Reactive', threshold: 8, rating: 5, durability: 95 },
  frameIntegrity: 200,
  speed: 30,
  damage: 24,
  damageType: 'Wave',
  tellDurationSec: 0.55,
  attackCooldownSec: 2.0,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 100 },
    { itemId: 'corrupted_shard', chance: 1.0, count: 3 },
    { itemId: 'grail_water', chance: 1.0, count: 2 },
  ],
  onDeath(state, _e, ctx) {
    state.flags = state.flags || {};
    state.flags.lady_of_the_lake_defeated = true;
    soundSystem.playPowerup();
    ctx.say('THE LADY OF THE LAKE HAS BEEN VANQUISHED!');
    notifyOrionStateChange();
  },
  render25D(g, e, _state, ey, isHurt) {
    g.strokeStyle = '#38bdf8';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(e.x, e.y, 12, 5, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = isHurt ? '#ffffff' : '#7e22ce';
    g.fillRect(e.x - 6, ey - 20, 12, 20);
    g.fillStyle = '#e879f9';
    g.fillRect(e.x - 4, ey - 18, 8, 10);
  },
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.3;
        const baseAngle = Math.atan2(dy, dx);
        for (const offset of [-0.45, -0.22, 0, 0.22, 0.45]) {
          const ang = baseAngle + offset;
          state.projectiles.push({
            x: e.x + Math.cos(ang) * 10,
            y: e.y + Math.sin(ang) * 10,
            z: 8,
            vx: Math.cos(ang) * 125,
            vy: Math.sin(ang) * 125,
            vz: 0,
            damage: e.damage,
            damageType: 'Wave',
            isPlayer: false,
            life: 1.3,
            radius: 3.5,
            color: '#38bdf8',
            trailColor: '#c084fc',
            lightRadius: 24,
          });
        }
      }
      return;
    }

    if (e.state === 'attack') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'idle';
        e.attackCd = this.attackCooldownSec;
      }
      return;
    }

    e.t += dt;
    e.x = Math.max(
      20,
      Math.min(140, e.x + (dx / dist) * e.speed * 0.6 * dt + Math.cos(e.t * 2) * 12 * dt)
    );
    e.y = Math.max(
      20,
      Math.min(124, e.y + (dy / dist) * e.speed * 0.6 * dt + Math.sin(e.t * 2) * 12 * dt)
    );

    if (e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
    }
  },
};
