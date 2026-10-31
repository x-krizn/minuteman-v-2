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

export const percivalKnightEnemy: EnemyWikiDefinition = {
  type: 'percival_knight',
  name: 'Sir Percival (Grail Knight)',
  spawnChar: 'K',
  faction: 'camelot',
  emissiveColor: '#60a5fa',
  tellRadius: 34,
  visionRadiusTiles: 5,
  description: 'A defensive Guardian anchor with a directional shield wall and closing charge.',
  lore:
    'Protects his comrades and recovers shields when badly hurt if not relentlessly pressured.',
  shields: { type: 'physical', capacity: 90 },
  armor: { type: 'Hardened', threshold: 9, rating: 6, durability: 90 },
  frameIntegrity: 150,
  speed: 22,
  damage: 28,
  damageType: 'Impact',
  tellDurationSec: 0.5,
  attackCooldownSec: 2.1,
  lootTable: [
    { itemId: 'trade_coin', chance: 1.0, count: 40 },
    { itemId: 'grail_fragment', chance: 1.0, count: 1 },
  ],
  onDeath(state, e, ctx) {
    handleGrailKnightDefeat(state, e, ctx);
  },
  render25D(g, e, state, ey, isHurt, isWindup) {
    const maxT = Math.max(0.05, e.stateMaxTimer || this.tellDurationSec);
    const windupPct = isWindup ? Math.max(0, Math.min(1, 1 - e.stateTimer / maxT)) : 0;
    const isAttack = e.state === 'attack';
    const isRegenShields = e.frame.integrity < e.frame.maxIntegrity * 0.5 && e.hurt <= 0;
    const crouchY = isWindup ? Math.round(windupPct * 2) : 0;

    // Heavy Camelot Guardian chassis
    g.fillStyle = isHurt ? '#ffffff' : '#1e3a8a';
    g.fillRect(e.x - 7, ey - 18 + crouchY, 14, 18 - crouchY);

    // Tower Shield posture: locked front-center when charging or regenerating shields, held at side otherwise
    const shieldCentered = isWindup || isAttack || isRegenShields;
    const shieldX = shieldCentered ? e.x - 5 : e.x - 9;
    const shieldW = shieldCentered ? 10 : 5;
    g.fillStyle = isWindup && windupPct > 0.6 ? '#fde047' : '#7dd3fc';
    g.fillRect(shieldX, ey - 15 + crouchY, shieldW, 13);

    if (isRegenShields && Math.floor(state.t * 6) % 2 === 0) {
      g.strokeStyle = '#38bdf8';
      g.lineWidth = 1;
      g.strokeRect(e.x - 8, ey - 19, 16, 19);
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

    if (e.frame.integrity < e.frame.maxIntegrity * 0.5 && e.hurt <= 0) {
      e.shields.capacity = Math.min(e.shields.maxCapacity, e.shields.capacity + 16 * dt);
    }

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.28;
        e.stateMaxTimer = 0.28;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(dy, dx);
        stepEnemyWithCollision(rooms, state, e, Math.cos(ang) * 24, Math.sin(ang) * 24);
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: ang,
          arcSpan: Math.PI * 0.72,
          radius: 26,
          width: 18,
          style: 'bash',
          color: '#60a5fa',
          coreColor: '#e0f2fe',
          life: 0.26,
          maxLife: 0.26,
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

    const aggroRange = state.flags?.knights_pulled_together || e.isFogBoss ? 130 : 105;
    if (!canEnemyDetectPlayer(rooms, state, e, aggroRange)) {
      idlePatrolEnemy(rooms, state, e, dt, 6);
      return;
    }

    e.dir = getDirFromVector(dx, dy);

    if (dist <= 48 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.stateMaxTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
      e.hasStruckThisAttack = false;
      return;
    }

    // Lore behavior: Sir Percival steps between wounded Camelot comrades (Tristan / Bors) and the player
    const woundedComrade = state.enemies.find(
      (ally) =>
        ally.id !== e.id &&
        ally.faction === 'camelot' &&
        ally.frame.integrity > 0 &&
        ally.frame.integrity < ally.frame.maxIntegrity * 0.75 &&
        Math.hypot(ally.x - e.x, ally.y - e.y) < 110
    );
    let moveDx = dx / dist;
    let moveDy = dy / dist;
    if (woundedComrade && dist > 30) {
      const guardX = (woundedComrade.x + state.x) * 0.5;
      const guardY = (woundedComrade.y + state.y) * 0.5;
      const gdx = guardX - e.x;
      const gdy = guardY - e.y;
      const gDist = Math.hypot(gdx, gdy) || 1;
      moveDx = moveDx * 0.6 + (gdx / gDist) * 0.4;
      moveDy = moveDy * 0.6 + (gdy / gDist) * 0.4;
    }

    if (dist > 20) {
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
