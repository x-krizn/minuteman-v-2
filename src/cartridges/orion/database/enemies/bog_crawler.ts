/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDirFromVector } from '../../constants';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../types';

export const bogCrawlerEnemy: EnemyWikiDefinition = {
  type: 'bog_crawler',
  name: 'Bog Crawler',
  spawnChar: 'E',
  faction: 'hostile',
  emissiveColor: '#ffd27d',
  tellRadius: 26,
  description: 'An aggressive armored arthropod dwelling in the deep mud of M00.',
  lore:
    'Native to the toxic marshes of Belldor, it burrows beneath floating reeds and ambushes passing drop-pod pilots with sudden impact lunges.',
  shields: { type: 'energy', capacity: 0 },
  armor: { type: 'Hardened', threshold: 5, rating: 2, durability: 35 },
  frameIntegrity: 48,
  speed: 28,
  damage: 12,
  damageType: 'Impact',
  tellDurationSec: 0.35,
  attackCooldownSec: 1.8,
  lootTable: [
    { itemId: 'demantoid_flask', chance: 0.35 },
    { itemId: 'rusted_gate_key', chance: 0.25 },
  ],
  render25D(g, e, _state, ey, isHurt, isWindup) {
    g.fillStyle = isHurt ? '#ffffff' : '#334155';
    g.beginPath();
    g.ellipse(e.x, ey - 5, 7, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = isWindup ? '#ff9b9b' : '#64748b';
    g.fillRect(e.x - 7, ey - 8, 3, 4);
    g.fillRect(e.x + 4, ey - 8, 3, 4);
  },
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }

    const distToPlayer = Math.hypot(state.x - e.x, state.y - e.y);
    if (e.attackCd > 0) e.attackCd -= dt;

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.2;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
        const ldx = Math.cos(ang);
        const ldy = Math.sin(ang);
        e.x += ldx * 14;
        e.y += ldy * 14;
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: ang,
          arcSpan: Math.PI * 0.55,
          radius: 20,
          length: 22,
          width: 12,
          style: 'claw_bite',
          color: '#fbbf24',
          coreColor: '#fef08a',
          life: 0.2,
          maxLife: 0.2,
          isEnemy: true,
        });
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

    if (distToPlayer < 90) {
      const dx = state.x - e.x;
      const dy = state.y - e.y;
      e.dir = getDirFromVector(dx, dy);

      if (distToPlayer <= 26 && e.attackCd <= 0) {
        e.state = 'windup';
        e.stateTimer = this.tellDurationSec;
        e.attackAngle = Math.atan2(dy, dx);
        e.hasStruckThisAttack = false;
        return;
      }

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
