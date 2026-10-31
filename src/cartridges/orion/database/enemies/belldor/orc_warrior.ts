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

function getOrcTarget(
  state: OrionState,
  self: EnemyEntity
): { x: number; y: number; isNpc: boolean; npcEntity?: EnemyEntity } {
  if (state.flags?.orc_raid_active) {
    let closestNpc: EnemyEntity | undefined;
    let closestDist = Infinity;
    for (const other of state.enemies) {
      if (other.id !== self.id && other.faction === 'npc' && other.frame.integrity > 0) {
        const d = Math.hypot(other.x - self.x, other.y - self.y);
        if (d < closestDist) {
          closestDist = d;
          closestNpc = other;
        }
      }
    }
    if (closestNpc) {
      return { x: closestNpc.x, y: closestNpc.y, isNpc: true, npcEntity: closestNpc };
    }
  }
  return { x: state.x, y: state.y, isNpc: false };
}

export const orcWarriorEnemy: EnemyWikiDefinition = {
  type: 'orc_warrior',
  name: 'Orc Warrior',
  spawnChar: 'o',
  faction: 'orc',
  emissiveColor: '#fb923c',
  tellRadius: 28,
  visionRadiusTiles: 5,
  companionSpawnType: 'orc_scout',
  companionSpawnChar: 's',
  description: 'A heavy shield-bearing brawler who closes distance relentlessly and hits like a siege ram.',
  lore:
    'Orcs always patrol Belldor in pairs: a heavy Warrior and a Scout. The Warrior anchors the front line with heavy hardened plating and a high-impulse boarding axe while the Scout fires from cover.',
  shields: { type: 'physical', capacity: 60 },
  armor: { type: 'Hardened', threshold: 9, rating: 4, durability: 75 },
  frameIntegrity: 95,
  speed: 26,
  damage: 28,
  damageType: 'Impact',
  tellDurationSec: 0.44,
  attackCooldownSec: 1.65,
  weightClass: 'heavy',
  baseWeight: 185,
  baseStability: 72,
  attackWeight: 68,
  attackSpeed: 158,
  commitment: 1.0,
  lootTable: [
    { itemId: 'trade_coin', chance: 1.0, count: 8 },
    { itemId: 'orc_war_paint', chance: 0.35 },
  ],
  render25D(g, e, _state, ey, isHurt, isWindup) {
    const maxT = Math.max(0.05, e.stateMaxTimer || this.tellDurationSec);
    const windupPct = isWindup ? Math.max(0, Math.min(1, 1 - e.stateTimer / maxT)) : 0;
    const isAttack = e.state === 'attack';
    const braceCrouch = isWindup ? 1 : 0;

    // Heavy armored torso
    g.fillStyle = isHurt ? '#ffffff' : '#7c2d12';
    g.fillRect(e.x - 7, ey - 16 + braceCrouch, 14, 16 - braceCrouch);
    g.fillStyle = '#ea580c';
    g.fillRect(e.x - 5, ey - 14 + braceCrouch, 10, 8);

    // Left-hand heavy boarding shield (tucked wide during windup to expose overhead chop)
    const shieldOffsetX = isWindup ? -10 : -9;
    g.fillStyle = '#fdba74';
    g.fillRect(e.x + shieldOffsetX, ey - 13 + braceCrouch, 4, 11);

    // Right-hand boarding axe (raised high overhead during windup, slammed down during attack)
    const axeY = isWindup
      ? ey - 16 - Math.round(windupPct * 6)
      : isAttack
        ? ey - 6
        : ey - 12;
    g.fillStyle = isWindup && windupPct > 0.55 ? '#fde047' : '#cbd5e1';
    g.fillRect(e.x + 6, axeY, 4, 5);
  },
  update(rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const target = getOrcTarget(state, e);
    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.24;
        e.stateMaxTimer = 0.24;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(dy, dx);
        stepEnemyWithCollision(rooms, state, e, Math.cos(ang) * 15, Math.sin(ang) * 15);
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: ang,
          arcSpan: Math.PI * 0.85,
          radius: 26,
          width: 16,
          style: 'chop',
          color: '#fb923c',
          coreColor: '#ffedd5',
          life: 0.24,
          maxLife: 0.24,
          isEnemy: true,
        });
        if (target.isNpc && target.npcEntity && dist < 24) {
          target.npcEntity.frame.integrity = Math.max(
            0,
            target.npcEntity.frame.integrity - e.damage
          );
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

    if (!target.isNpc && !canEnemyDetectPlayer(rooms, state, e, 84)) {
      idlePatrolEnemy(rooms, state, e, dt, 8);
      return;
    }

    e.dir = getDirFromVector(dx, dy);

    if (dist <= 26 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.stateMaxTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
      e.hasStruckThisAttack = false;
      return;
    }

    // Lore behavior: Orc Warrior intercepts the line between a wounded Orc Scout and the player
    const woundedScout = state.enemies.find(
      (ally) =>
        ally.type === 'orc_scout' &&
        ally.frame.integrity > 0 &&
        ally.frame.integrity < ally.frame.maxIntegrity * 0.7 &&
        Math.hypot(ally.x - e.x, ally.y - e.y) < 95
    );
    let moveDx = dx / dist;
    let moveDy = dy / dist;
    if (woundedScout && dist > 28) {
      const screenX = (woundedScout.x + state.x) * 0.5;
      const screenY = (woundedScout.y + state.y) * 0.5;
      const sdx = screenX - e.x;
      const sdy = screenY - e.y;
      const sDist = Math.hypot(sdx, sdy) || 1;
      moveDx = (moveDx * 0.65 + (sdx / sDist) * 0.35);
      moveDy = (moveDy * 0.65 + (sdy / sDist) * 0.35);
    }

    if (dist > 16) {
      stepEnemyWithCollision(
        rooms,
        state,
        e,
        moveDx * e.speed * dt,
        moveDy * e.speed * dt
      );
    }
  },
};
