/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDirFromVector } from '../../../constants';
import {
  canEnemyDetectPlayer,
  idlePatrolEnemy,
  stepEnemyWithCollision,
} from '../../../systems/enemyHelpers';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../../types';

export const bogCrawlerEnemy: EnemyWikiDefinition = {
  type: 'bog_crawler',
  name: 'Bog Crawler',
  spawnChar: 'E',
  faction: 'hostile',
  emissiveColor: '#ffd27d',
  tellRadius: 26,
  visionRadiusTiles: 5,
  description: 'An aggressive armored arthropod dwelling in the deep mud of M00.',
  lore:
    'Native to the toxic marshes of Belldor, it burrows beneath floating reeds and ambushes passing drop-pod pilots with sudden impact lunges.',
  shields: { type: 'energy', capacity: 0 },
  armor: { type: 'Hardened', threshold: 5, rating: 2, durability: 35 },
  frameIntegrity: 48,
  speed: 28,
  damage: 18,
  damageType: 'Impact',
  tellDurationSec: 0.35,
  attackCooldownSec: 1.8,
  lootTable: [
    { itemId: 'demantoid_flask', chance: 0.35 },
    { itemId: 'rusted_gate_key', chance: 0.25 },
  ],
  render25D(g, e, state, ey, isHurt, isWindup) {
    const maxT = Math.max(0.05, e.stateMaxTimer || this.tellDurationSec);
    const windupPct = isWindup ? Math.max(0, Math.min(1, 1 - e.stateTimer / maxT)) : 0;
    const isAttack = e.state === 'attack';
    const isRecovery = e.state === 'recovery';
    const ang = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    // Multi-frame posture: crouch low & coil back during windup, lunge forward during attack
    const coilOffset = isWindup ? -2.5 * windupPct : isAttack ? 3.5 : isRecovery ? -1.0 : 0;
    const crouchY = isWindup ? 1.5 * windupPct : 0;
    const bx = e.x + cos * coilOffset;
    const by = ey + sin * coilOffset * 0.5 + crouchY;

    // Segmented carapace body
    g.fillStyle = isHurt ? '#ffffff' : '#334155';
    g.beginPath();
    g.ellipse(bx, by - 5, isWindup ? 8 : 7, isWindup ? 4 : 5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = isHurt ? '#ffffff' : '#475569';
    g.fillRect(bx - 4, by - 8, 8, 3);

    // Articulated mandibles: spread wide during windup, snap shut on attack
    const spread = isWindup ? 3 + windupPct * 2.5 : isAttack ? 1.2 : 2.2;
    const reach = isWindup ? 5 + windupPct * 2 : isAttack ? 8 : 5;
    const px = -sin;
    const py = cos;
    const leftMx = bx + cos * reach + px * spread;
    const leftMy = by - 5 + sin * reach * 0.6 + py * spread * 0.6;
    const rightMx = bx + cos * reach - px * spread;
    const rightMy = by - 5 + sin * reach * 0.6 - py * spread * 0.6;

    g.fillStyle = isWindup ? '#fbbf24' : isAttack ? '#fef08a' : '#94a3b8';
    g.fillRect(Math.round(leftMx) - 1, Math.round(leftMy) - 2, 3, 3);
    g.fillRect(Math.round(rightMx) - 1, Math.round(rightMy) - 2, 3, 3);

    // Sweet-spot mandible tip glint right before strike
    if (isWindup && windupPct > 0.55) {
      g.fillStyle = '#ffffff';
      g.fillRect(Math.round(leftMx), Math.round(leftMy) - 1, 2, 2);
      g.fillRect(Math.round(rightMx), Math.round(rightMy) - 1, 2, 2);
    }
  },
  update(rooms, state: OrionState, e: EnemyEntity, dt: number) {
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
        e.stateMaxTimer = 0.2;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
        const ldx = Math.cos(ang);
        const ldy = Math.sin(ang);
        stepEnemyWithCollision(rooms, state, e, ldx * 14, ldy * 14);
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
        e.stateMaxTimer = 0.4;
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

    if (canEnemyDetectPlayer(rooms, state, e, 76)) {
      const dx = state.x - e.x;
      const dy = state.y - e.y;
      e.dir = getDirFromVector(dx, dy);

      if (distToPlayer <= 26 && e.attackCd <= 0) {
        e.state = 'windup';
        e.stateTimer = this.tellDurationSec;
        e.stateMaxTimer = this.tellDurationSec;
        e.attackAngle = Math.atan2(dy, dx);
        e.hasStruckThisAttack = false;
        return;
      }

      const step = e.speed * dt;
      if (distToPlayer > 18) {
        stepEnemyWithCollision(
          rooms,
          state,
          e,
          (dx / distToPlayer) * step,
          (dy / distToPlayer) * step
        );
      }
    } else {
      idlePatrolEnemy(rooms, state, e, dt, 8);
    }
  },
};
