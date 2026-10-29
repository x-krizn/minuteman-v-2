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

function handleGrailKnightDefeat(state: OrionState, ctx: OrionCombatContext): void {
  state.flags = state.flags || {};
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

export const tristanKnightEnemy: EnemyWikiDefinition = {
  type: 'tristan_knight',
  name: 'Sir Tristan (Corrupted Ranger)',
  spawnChar: 'T',
  faction: 'camelot',
  emissiveColor: '#4ade80',
  tellRadius: 34,
  description: 'A kiting archer with spread arrow volleys, smoke escapes, and cover-piercing sight.',
  lore:
    'Fragile if caught in close quarters, but punishes any pilot who stands still in the open.',
  shields: { type: 'energy', capacity: 45 },
  armor: { type: 'Ablative', threshold: 4, rating: 2, durability: 45 },
  frameIntegrity: 110,
  speed: 35,
  damage: 15,
  damageType: 'Pierce',
  tellDurationSec: 0.4,
  attackCooldownSec: 1.9,
  lootTable: [
    { itemId: 'trade_coin', chance: 1.0, count: 40 },
    { itemId: 'grail_fragment', chance: 1.0, count: 1 },
    { itemId: 'bedivere_relic', chance: 1.0, count: 1 },
  ],
  onDeath(state, _e, ctx) {
    handleGrailKnightDefeat(state, ctx);
  },
  render25D(g, e, _state, ey, isHurt) {
    g.fillStyle = isHurt ? '#ffffff' : '#065f46';
    g.fillRect(e.x - 5, ey - 17, 10, 17);
    g.fillStyle = '#6ee7b7';
    g.fillRect(e.x + 4, ey - 13, 4, 7);
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
        e.stateTimer = 0.2;
        const baseAngle = e.attackAngle ?? Math.atan2(dy, dx);
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: baseAngle,
          arcSpan: Math.PI * 0.52,
          radius: 18,
          style: 'volley',
          color: '#4ade80',
          coreColor: '#dcfce7',
          life: 0.2,
          maxLife: 0.2,
          isEnemy: true,
        });
        for (const offset of [-0.18, 0, 0.18]) {
          const ang = baseAngle + offset;
          state.projectiles.push({
            x: e.x + Math.cos(ang) * 8,
            y: e.y + Math.sin(ang) * 8,
            z: 6,
            vx: Math.cos(ang) * 135,
            vy: Math.sin(ang) * 135,
            vz: 0,
            damage: e.damage,
            damageType: 'Pierce',
            isPlayer: false,
            life: 1.2,
            radius: 2.5,
            color: '#4ade80',
            trailColor: '#16a34a',
            lightRadius: 16,
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

    const aggroRange = state.flags?.knights_pulled_together || e.isFogBoss ? 135 : 112;
    if (!canEnemyDetectPlayer(rooms, state, e, aggroRange)) {
      idlePatrolEnemy(rooms, state, e, dt, 7);
      return;
    }

    e.dir = getDirFromVector(dx, dy);

    if (dist < 30 && e.state === 'idle') {
      for (let i = 0; i < 6; i++) {
        state.particles.push({
          x: e.x + (Math.random() - 0.5) * 10,
          y: e.y + (Math.random() - 0.5) * 10,
          z: 6,
          vx: (Math.random() - 0.5) * 25,
          vy: (Math.random() - 0.5) * 25,
          vz: 12,
          life: 0.35,
          maxLife: 0.35,
          color: '#94a3b8',
          size: 3,
          fade: true,
        });
      }
      stepEnemyWithCollision(rooms, state, e, -(dx / dist) * 44, -(dy / dist) * 44);
      return;
    }

    if (e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
    }
  },
};
