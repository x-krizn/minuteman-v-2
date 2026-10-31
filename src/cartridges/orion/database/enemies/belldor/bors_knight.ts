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
import { addOrionInventoryItem, notifyOrionStateChange } from '../../../systems/stateStore';
import { EnemyEntity, EnemyWikiDefinition, OrionCombatContext, OrionState } from '../../../types';

function handleGrailKnightDefeat(
  state: OrionState,
  e: EnemyEntity,
  ctx: OrionCombatContext
): void {
  state.flags = state.flags || {};
  if (!e.isFogBoss && !e.isDungeonGuardian && !e.isAbyssElite) {
    state.flags[`grail_knight_defeated:${e.type}`] = true;
  }
  const curFrags = Number(state.flags.grail_fragments || 0);
  state.flags.grail_fragments = Math.min(3, curFrags + 1);
  addOrionInventoryItem(state, 'grail_fragment', 1);

  const remainingKnights = state.enemies.filter((rem) => rem.faction === 'camelot');
  if (remainingKnights.length === 0 && state.flags.knights_pulled_together) {
    state.flags.knights_oath_earned = true;
    if (!state.equippedFeats.includes('knights_oath')) {
      state.equippedFeats.push('knights_oath');
      addOrionInventoryItem(state, 'knights_oath', 1);
    }
    soundSystem.playPowerup();
    ctx.say("3V1 VICTORY! FEAT EARNED: KNIGHT'S OATH (+25% VS CAMELOT)");
  } else {
    ctx.say(`GRAIL FRAGMENT RECOVERED (${state.flags.grail_fragments}/3)`);
  }
  notifyOrionStateChange();
}

export const borsKnightEnemy: EnemyWikiDefinition = {
  type: 'bors_knight',
  name: 'Sir Bors (Berserk Striker)',
  spawnChar: 'B',
  faction: 'camelot',
  emissiveColor: '#b8a4ff',
  tellRadius: 34,
  visionRadiusTiles: 5,
  description: 'A relentless brawler who grows stronger with every hit and enrages at half health.',
  lore:
    'Gains +10% damage per strike landed; below 50% HP enters Grail Overload with a deadly telegraphed execution lunge.',
  shields: { type: 'physical', capacity: 60 },
  armor: { type: 'Reactive', threshold: 8, rating: 5, durability: 80 },
  frameIntegrity: 160,
  speed: 24,
  damage: 32,
  damageType: 'Impact',
  tellDurationSec: 0.5,
  attackCooldownSec: 2.0,
  lootTable: [
    { itemId: 'trade_coin', chance: 1.0, count: 50 },
    { itemId: 'grail_fragment', chance: 1.0, count: 1 },
    { itemId: 'rusted_gate_key', chance: 1.0, count: 1 },
    { itemId: 'corrupted_shard', chance: 1.0, count: 1 },
  ],
  onDeath(state, e, ctx) {
    handleGrailKnightDefeat(state, e, ctx);
  },
  render25D(g, e, state, ey, isHurt, isWindup) {
    const maxT = Math.max(0.05, e.stateMaxTimer || this.tellDurationSec);
    const windupPct = isWindup ? Math.max(0, Math.min(1, 1 - e.stateTimer / maxT)) : 0;
    const isAttack = e.state === 'attack';
    const crouchY = isWindup && e.enraged ? Math.round(windupPct * 3) : 0;

    // Berserk Striker heavy chassis
    g.fillStyle = isHurt ? '#ffffff' : e.enraged ? '#450a0a' : '#312e81';
    g.fillRect(e.x - 8, ey - 20 + crouchY, 16, 20 - crouchY);
    g.fillStyle = e.enraged ? '#ef4444' : (e.hitsLanded || 0) > 0 ? '#f43f5e' : '#b8a4ff';
    g.fillRect(e.x - 6, ey - 18 + crouchY, 12, 12);

    // Weapon posture:
    // - Normal windup: raises heavy maul overhead
    // - Enraged windup: coils execution lance low behind hip with crimson tip glint
    const ang = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    if (e.enraged) {
      const thrustExtend = isWindup ? -4 * windupPct : isAttack ? 8 : 2;
      const wx = e.x + cos * (6 + thrustExtend);
      const wy = ey - 10 + crouchY + sin * (4 + thrustExtend * 0.5);
      g.fillStyle = isWindup && windupPct > 0.5 ? '#fde047' : '#fca5a5';
      g.fillRect(Math.round(wx) - 2, Math.round(wy) - 2, 5, 4);
    } else {
      const maulY = isWindup
        ? ey - 22 - Math.round(windupPct * 6)
        : isAttack
          ? ey - 6
          : ey - 15;
      g.fillStyle = isWindup && windupPct > 0.5 ? '#fde047' : '#d8b4fe';
      g.fillRect(e.x + 6, maulY, 5, 6);
    }
  },
  update(rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    if (e.frame.integrity <= e.frame.maxIntegrity * 0.5 && !e.enraged) {
      e.enraged = true;
      e.speed = 33;
      e.emissiveColor = '#ef4444';
      e.flashColor = '#ef4444';
      e.flashTimer = 0.24;
      e.flashMaxTimer = 0.24;
      e.flashKind = 'stagger';
      for (let i = 0; i < 10; i++) {
        state.particles.push({
          x: e.x + (Math.random() - 0.5) * 10,
          y: e.y + (Math.random() - 0.5) * 8,
          z: 8,
          vx: (Math.random() - 0.5) * 24,
          vy: (Math.random() - 0.5) * 24,
          vz: 16,
          life: 0.35,
          maxLife: 0.35,
          color: '#ef4444',
          size: 3,
          fade: true,
        });
      }
    }

    // Continuous crimson reactor steam while enraged
    if (e.enraged && Math.random() < 0.22) {
      state.particles.push({
        x: e.x + (Math.random() - 0.5) * 8,
        y: e.y + (Math.random() - 0.5) * 6,
        z: 10,
        vx: 0,
        vy: -10,
        vz: 12,
        life: 0.22,
        maxLife: 0.22,
        color: '#f87171',
        size: 2,
        fade: true,
      });
    }

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.25;
        e.stateMaxTimer = 0.25;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(dy, dx);
        const lungeDist = e.enraged ? 26 : 14;
        stepEnemyWithCollision(
          rooms,
          state,
          e,
          Math.cos(ang) * lungeDist,
          Math.sin(ang) * lungeDist
        );
        state.bladeTrails = state.bladeTrails || [];
        if (e.enraged) {
          state.bladeTrails.push({
            x: e.x - Math.cos(ang) * 8,
            y: e.y - Math.sin(ang) * 8,
            z: e.z,
            angle: ang,
            arcSpan: Math.PI * 0.35,
            radius: 36,
            length: 38,
            width: 14,
            style: 'thrust',
            color: '#ef4444',
            coreColor: '#fecaca',
            life: 0.26,
            maxLife: 0.26,
            isEnemy: true,
          });
        } else {
          state.bladeTrails.push({
            x: e.x,
            y: e.y,
            z: e.z,
            angle: ang,
            arcSpan: Math.PI * 0.7,
            radius: 22,
            length: 16,
            width: 18,
            style: 'slam',
            color: '#b8a4ff',
            coreColor: '#f3e8ff',
            life: 0.25,
            maxLife: 0.25,
            isEnemy: true,
          });
        }
      }
      return;
    }

    if (e.state === 'attack') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'idle';
        e.attackCd = e.enraged ? 1.35 : 2.0;
      }
      return;
    }

    const aggroRange = state.flags?.knights_pulled_together || e.isFogBoss ? 130 : 105;
    if (!canEnemyDetectPlayer(rooms, state, e, aggroRange)) {
      idlePatrolEnemy(rooms, state, e, dt, 6);
      return;
    }

    e.dir = getDirFromVector(dx, dy);

    if (dist <= (e.enraged ? 44 : 32) && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.stateMaxTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
      e.hasStruckThisAttack = false;
      return;
    }

    const step = e.speed * dt;
    if (dist > 20) {
      stepEnemyWithCollision(rooms, state, e, (dx / dist) * step, (dy / dist) * step);
    }
  },
};
