/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../../engine/core/soundSystem';
import { getDirFromVector } from '../../../constants';
import {
  canEnemyDetectPlayer,
  idlePatrolEnemy,
  stepEnemyWithCollision,
} from '../../../systems/enemyHelpers';
import { notifyOrionStateChange } from '../../../systems/stateStore';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../../types';

export const ladyOfTheLakeEnemy: EnemyWikiDefinition = {
  type: 'lady_of_the_lake',
  name: 'The Lady of the Lake',
  faction: 'hostile',
  emissiveColor: '#c084fc',
  tellRadius: 34,
  visionRadiusTiles: 5,
  description: 'Something half machine and half serpent, an old name twisted by the æther.',
  lore:
    'Whoever collects all items on Bedivere’s numbered list and returns to the bog will find the water has been waiting.',
  shields: { type: 'energy', capacity: 80 },
  armor: { type: 'Reactive', threshold: 8, rating: 5, durability: 95 },
  frameIntegrity: 200,
  speed: 30,
  damage: 34,
  damageType: 'Wave',
  tellDurationSec: 0.55,
  attackCooldownSec: 2.0,
  lootTable: [
    { itemId: 'trade_coin', chance: 1.0, count: 100 },
    { itemId: 'corrupted_shard', chance: 1.0, count: 3 },
    { itemId: 'grail_water', chance: 1.0, count: 2 },
    { itemId: 'titanite', chance: 1.0, count: 1 },
    { itemId: 'moonstone', chance: 1.0, count: 1 },
  ],
  onDeath(state, _e, ctx) {
    state.flags = state.flags || {};
    state.flags.lady_of_the_lake_defeated = true;
    soundSystem.playPowerup();
    ctx.say('THE LADY OF THE LAKE VANQUISHED! · AVALON SIEGE LANCE & RELIC GEMSTONES RECOVERED!');
    notifyOrionStateChange();
  },
  render25D(g, e, state, ey, isHurt, isWindup) {
    const maxT = Math.max(0.05, e.stateMaxTimer || this.tellDurationSec);
    const windupPct = isWindup ? Math.max(0, Math.min(1, 1 - e.stateTimer / maxT)) : 0;
    const riseY = isWindup ? -Math.round(windupPct * 4) : 0;

    g.strokeStyle = '#38bdf8';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(e.x, e.y, 12 + windupPct * 3, 5, 0, 0, Math.PI * 2);
    g.stroke();

    g.fillStyle = isHurt ? '#ffffff' : '#7e22ce';
    g.fillRect(e.x - 6, ey - 20 + riseY, 12, 20 - riseY);
    g.fillStyle = '#e879f9';
    g.fillRect(e.x - 4, ey - 18 + riseY, 8, 10);

    // 5-orb arcane wave crown materializes during windup
    if (isWindup) {
      const orbCount = Math.max(1, Math.ceil(windupPct * 5));
      for (let i = 0; i < orbCount; i++) {
        const ang = -Math.PI * 0.8 + (i / 4) * Math.PI * 0.6 + state.t * 2;
        const ox = e.x + Math.cos(ang) * 9;
        const oy = ey - 16 + riseY + Math.sin(ang) * 5;
        g.fillStyle = windupPct > 0.65 ? '#fde047' : '#38bdf8';
        g.fillRect(Math.round(ox) - 1, Math.round(oy) - 1, 2, 2);
      }
    }
  },
  update(rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.3;
        e.stateMaxTimer = 0.3;
        e.hasStruckThisAttack = false;
        const baseAngle = e.attackAngle ?? Math.atan2(dy, dx);
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: baseAngle,
          arcSpan: Math.PI * 0.95,
          radius: 26,
          style: 'volley',
          color: '#c084fc',
          coreColor: '#f5d0fe',
          life: 0.26,
          maxLife: 0.26,
          isEnemy: true,
        });
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: baseAngle,
          arcSpan: Math.PI * 2,
          radius: 28,
          style: 'shockwave',
          color: '#38bdf8',
          coreColor: '#e0f2fe',
          life: 0.28,
          maxLife: 0.28,
          isEnemy: true,
        });
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

    if (!canEnemyDetectPlayer(rooms, state, e, 135)) {
      idlePatrolEnemy(rooms, state, e, dt, 8);
      return;
    }

    e.dir = getDirFromVector(dx, dy);
    e.t += dt;
    stepEnemyWithCollision(
      rooms,
      state,
      e,
      (dx / dist) * e.speed * 0.6 * dt + Math.cos(e.t * 2) * 12 * dt,
      (dy / dist) * e.speed * 0.6 * dt + Math.sin(e.t * 2) * 12 * dt
    );

    if (e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.stateMaxTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
      e.hasStruckThisAttack = false;
    }
  },
};
