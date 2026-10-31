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

export const orcScoutEnemy: EnemyWikiDefinition = {
  type: 'orc_scout',
  name: 'Orc Scout',
  spawnChar: 's',
  faction: 'orc',
  emissiveColor: '#fdba74',
  tellRadius: 26,
  visionRadiusTiles: 5,
  companionSpawnType: 'orc_warrior',
  companionSpawnChar: 'o',
  description: 'Ranged skirmisher that stays back, shoots from range, and slips away to heal if hurt.',
  lore:
    'Orcs always come as a Warrior and a Scout. Kill the Scout first, but do not let the Warrior reach you. If wounded and left unpressured, the Scout retreats to patch its frame.',
  shields: { type: 'energy', capacity: 15 },
  armor: { type: 'Ablative', threshold: 3, rating: 1, durability: 25 },
  frameIntegrity: 42,
  speed: 34,
  damage: 17,
  damageType: 'Pierce',
  tellDurationSec: 0.35,
  attackCooldownSec: 2.0,
  lootTable: [
    { itemId: 'demantoid_flask', chance: 0.45 },
  ],
  render25D(g, e, state, ey, isHurt, isWindup) {
    const maxT = Math.max(0.05, e.stateMaxTimer || this.tellDurationSec);
    const windupPct = isWindup ? Math.max(0, Math.min(1, 1 - e.stateTimer / maxT)) : 0;
    const kneelDrop = isWindup ? 2 : 0;
    const isHealing =
      !isWindup && e.state !== 'attack' && e.frame.integrity < e.frame.maxIntegrity * 0.6;

    // Scout body (drops to one knee when drawing bow)
    g.fillStyle = isHurt ? '#ffffff' : '#c2410c';
    g.fillRect(e.x - 4, ey - 13 + kneelDrop, 8, 13 - kneelDrop);

    const ang = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const bowX = e.x + cos * (isWindup ? 5 + windupPct * 2 : 4);
    const bowY = ey - 8 + kneelDrop + sin * 3;

    // Bow stave + taut nocked arrow during windup
    g.fillStyle = '#fed7aa';
    g.fillRect(Math.round(bowX) - 1, Math.round(bowY) - 3, 3, 6);
    if (isWindup) {
      g.fillStyle = windupPct > 0.6 ? '#fde047' : '#fb923c';
      g.fillRect(Math.round(bowX + cos * 3) - 1, Math.round(bowY + sin * 2) - 1, 3, 2);
    } else if (isHealing) {
      // Contextual self-mend flask held to chest
      g.fillStyle = '#4ade80';
      g.fillRect(e.x - 2, ey - 10, 3, 3);
    }
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
        e.stateTimer = 0.18;
        e.stateMaxTimer = 0.18;
        const ang = e.attackAngle ?? Math.atan2(dy, dx);
        const ldx = Math.cos(ang);
        const ldy = Math.sin(ang);
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: ang,
          arcSpan: Math.PI * 0.42,
          radius: 14,
          style: 'volley',
          color: '#fb923c',
          coreColor: '#ffedd5',
          life: 0.16,
          maxLife: 0.16,
          isEnemy: true,
        });
        state.projectiles.push({
          x: e.x + ldx * 8,
          y: e.y + ldy * 8,
          z: 6,
          vx: ldx * 115,
          vy: ldy * 115,
          vz: 0,
          damage: e.damage,
          damageType: 'Pierce',
          isPlayer: false,
          life: 1.1,
          radius: 2.5,
          color: '#fb923c',
          trailColor: '#ea580c',
          lightRadius: 14,
        });
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

    if (!target.isNpc && !canEnemyDetectPlayer(rooms, state, e, 96)) {
      idlePatrolEnemy(rooms, state, e, dt, 8);
      return;
    }

    e.dir = getDirFromVector(dx, dy);

    // Slip away to heal when hurt (<60% HP) with contextual green mend sparks
    const isHurtRetreating = e.frame.integrity < e.frame.maxIntegrity * 0.6;
    if (isHurtRetreating && dist < 75) {
      stepEnemyWithCollision(
        rooms,
        state,
        e,
        -(dx / dist) * e.speed * 1.1 * dt,
        -(dy / dist) * e.speed * 1.1 * dt
      );
      e.frame.integrity = Math.min(e.frame.maxIntegrity, e.frame.integrity + 7 * dt);
      if (Math.random() < 0.25) {
        state.particles.push({
          x: e.x + (Math.random() - 0.5) * 6,
          y: e.y + (Math.random() - 0.5) * 4,
          z: 6,
          vx: 0,
          vy: -8,
          vz: 10,
          life: 0.25,
          maxLife: 0.25,
          color: '#4ade80',
          size: 2,
          fade: true,
        });
      }
      return;
    }

    if (dist < 42) {
      stepEnemyWithCollision(
        rooms,
        state,
        e,
        -(dx / dist) * e.speed * 0.85 * dt,
        -(dy / dist) * e.speed * 0.85 * dt
      );
    } else if (dist > 82) {
      stepEnemyWithCollision(
        rooms,
        state,
        e,
        (dx / dist) * e.speed * 0.8 * dt,
        (dy / dist) * e.speed * 0.8 * dt
      );
    }

    if (dist <= 96 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.stateMaxTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
    }
  },
};
