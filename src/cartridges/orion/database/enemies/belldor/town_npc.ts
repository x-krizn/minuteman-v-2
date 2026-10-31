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

export const townNpcEntity: EnemyWikiDefinition = {
  type: 'town_npc',
  name: 'Border Town Survivor',
  spawnChar: 'N',
  faction: 'npc',
  emissiveColor: '#94a3b8',
  tellRadius: 24,
  visionRadiusTiles: 5,
  description: 'A citizen of the contested settlement suffering from Grail Sickness.',
  lore:
    'Some are calm enough to trade, some turn hostile if you linger, and Loyalists attack anyone carrying Bedivere’s Signet Ring as a grave robber.',
  shields: { type: 'physical', capacity: 20 },
  armor: { type: 'Hardened', threshold: 4, rating: 2, durability: 30 },
  frameIntegrity: 50,
  speed: 24,
  damage: 18,
  damageType: 'Impact',
  tellDurationSec: 0.4,
  attackCooldownSec: 1.8,
  lootTable: [{ itemId: 'trade_coin', chance: 0.8, count: 5 }],
  customSpawnSetup(_state, _px, _py, spawnCountOfType) {
    const dispositions: Array<'calm' | 'linger' | 'feral'> = ['calm', 'linger', 'feral'];
    const disp = dispositions[spawnCountOfType % 3];
    const isLoyalist = spawnCountOfType % 2 === 0;
    return {
      npcDisposition: disp,
      isLoyalist,
      faction: disp === 'feral' ? 'hostile' : 'npc',
      name: isLoyalist
        ? `Camelot Loyalist (${disp.toUpperCase()})`
        : `Town Scavenger (${disp.toUpperCase()})`,
    };
  },
  render25D(g, e, state, ey, isHurt, isWindup) {
    const maxT = Math.max(0.05, e.stateMaxTimer || this.tellDurationSec);
    const windupPct = isWindup ? Math.max(0, Math.min(1, 1 - e.stateTimer / maxT)) : 0;
    const isAggravated = e.npcDisposition === 'linger' && (e.lingerTimer || 0) > 0.3;
    const jitterX = isAggravated ? Math.round(Math.sin(state.t * 32) * 1.2) : 0;

    const dispColor =
      e.npcDisposition === 'feral'
        ? '#dc2626'
        : e.npcDisposition === 'linger'
          ? '#d97706'
          : '#475569';
    g.fillStyle = isHurt ? '#ffffff' : dispColor;
    g.fillRect(e.x - 4 + jitterX, ey - 13, 8, 13);
    g.fillStyle = e.isLoyalist ? '#93c5fd' : '#cbd5e1';
    g.fillRect(e.x - 3 + jitterX, ey - 15, 6, 3);

    // Raised weapon posture during feral windup or attack
    if (e.npcDisposition === 'feral') {
      const armY = isWindup ? ey - 14 - Math.round(windupPct * 4) : ey - 10;
      g.fillStyle = isWindup && windupPct > 0.55 ? '#fde047' : '#e2e8f0';
      g.fillRect(e.x + 4 + jitterX, armY, 3, 5);
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

    if (state.flags?.orc_raid_active) {
      e.npcDisposition = 'feral';
      e.faction = 'hostile';
    }

    if (
      e.isLoyalist &&
      state.flags?.bedivere_ring_choice === 'taken' &&
      e.npcDisposition !== 'feral'
    ) {
      e.npcDisposition = 'feral';
      e.faction = 'hostile';
      e.name = 'Loyalist Avenger (Hostile)';
      e.flashColor = '#ef4444';
      e.flashTimer = 0.2;
      e.flashMaxTimer = 0.2;
      e.flashKind = 'stagger';
    }

    if (e.npcDisposition === 'linger') {
      if (dist < 38) {
        e.lingerTimer = (e.lingerTimer || 0) + dt;
        if (Math.random() < 0.25) {
          state.particles.push({
            x: e.x + (Math.random() - 0.5) * 6,
            y: e.y + (Math.random() - 0.5) * 4,
            z: 8,
            vx: 0,
            vy: -6,
            vz: 10,
            life: 0.22,
            maxLife: 0.22,
            color: '#c084fc',
            size: 2,
            fade: true,
          });
        }
        if (e.lingerTimer >= 2.5) {
          e.npcDisposition = 'feral';
          e.faction = 'hostile';
          e.name = 'Feral Grail-Sick Citizen';
          e.flashColor = '#ef4444';
          e.flashTimer = 0.22;
          e.flashMaxTimer = 0.22;
          e.flashKind = 'stagger';
        }
      } else {
        e.lingerTimer = Math.max(0, (e.lingerTimer || 0) - dt * 0.5);
      }
    }

    if (e.npcDisposition === 'feral') {
      if (e.state === 'windup') {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.state = 'attack';
          e.stateTimer = 0.2;
          e.stateMaxTimer = 0.2;
          e.hasStruckThisAttack = false;
          const ang = e.attackAngle ?? Math.atan2(dy, dx);
          stepEnemyWithCollision(rooms, state, e, Math.cos(ang) * 10, Math.sin(ang) * 10);
          state.bladeTrails = state.bladeTrails || [];
          state.bladeTrails.push({
            x: e.x,
            y: e.y,
            z: e.z,
            angle: ang,
            arcSpan: e.isLoyalist ? Math.PI * 0.85 : Math.PI * 0.6,
            radius: e.isLoyalist ? 22 : 20,
            style: e.isLoyalist ? 'slash' : 'chop',
            color: e.isLoyalist ? '#93c5fd' : '#f87171',
            coreColor: '#ffffff',
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
          e.state = 'idle';
          e.attackCd = this.attackCooldownSec;
        }
        return;
      }
      if (!canEnemyDetectPlayer(rooms, state, e, 84)) {
        idlePatrolEnemy(rooms, state, e, dt, 5);
        return;
      }
      e.dir = getDirFromVector(dx, dy);
      if (dist <= 24 && e.attackCd <= 0) {
        e.state = 'windup';
        e.stateTimer = this.tellDurationSec;
        e.stateMaxTimer = this.tellDurationSec;
        e.attackAngle = Math.atan2(dy, dx);
        e.hasStruckThisAttack = false;
        return;
      }
      if (dist > 16) {
        stepEnemyWithCollision(
          rooms,
          state,
          e,
          (dx / dist) * e.speed * dt,
          (dy / dist) * e.speed * dt
        );
      }
    } else {
      idlePatrolEnemy(rooms, state, e, dt, 5);
    }
  },
};
