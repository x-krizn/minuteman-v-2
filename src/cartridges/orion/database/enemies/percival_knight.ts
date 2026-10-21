/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { getDirFromVector, getRoomDimensions } from '../../constants';
import { addOrionInventoryItem, notifyOrionStateChange } from '../../systems/playerSystem';
import { EnemyEntity, EnemyWikiDefinition, OrionCombatContext, OrionState } from '../../types';

function handleGrailKnightDefeat(state: OrionState, ctx: OrionCombatContext): void {
  state.flags = state.flags || {};
  const curFrags = Number(state.flags.grail_fragments || 0);
  state.flags.grail_fragments = Math.min(3, curFrags + 1);
  addOrionInventoryItem(state, 'grail_fragment', 1);

  const remainingKnights = state.enemies.filter((rem) => rem.faction === 'camelot');
  if (remainingKnights.length === 0 && state.flags.knights_pulled_together) {
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
  description: 'A defensive Guardian anchor with a directional shield wall and closing charge.',
  lore:
    'Protects his comrades and recovers shields when badly hurt if not relentlessly pressured.',
  shields: { type: 'physical', capacity: 90 },
  armor: { type: 'Hardened', threshold: 9, rating: 6, durability: 90 },
  frameIntegrity: 150,
  speed: 22,
  damage: 19,
  damageType: 'Impact',
  tellDurationSec: 0.5,
  attackCooldownSec: 2.1,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 40 },
    { itemId: 'grail_fragment', chance: 1.0, count: 1 },
  ],
  onDeath(state, _e, ctx) {
    handleGrailKnightDefeat(state, ctx);
  },
  render25D(g, e, _state, ey, isHurt) {
    g.fillStyle = isHurt ? '#ffffff' : '#1e3a8a';
    g.fillRect(e.x - 7, ey - 18, 14, 18);
    g.fillStyle = '#7dd3fc';
    g.fillRect(e.x - 9, ey - 14, 4, 12);
  },
  update(rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const { widthPx, heightPx } = getRoomDimensions(rooms[state.room]);
    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    if (e.frame.integrity < e.frame.maxIntegrity * 0.5 && e.hurt <= 0) {
      e.shields.capacity = Math.min(e.shields.maxCapacity, e.shields.capacity + 16 * dt);
    }

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.28;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(dy, dx);
        e.x = Math.max(16, Math.min(widthPx - 16, e.x + Math.cos(ang) * 24));
        e.y = Math.max(16, Math.min(heightPx - 16, e.y + Math.sin(ang) * 24));
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

    if (dist <= 48 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
      e.hasStruckThisAttack = false;
      return;
    }

    if (dist > 20) {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
    }
  },
};
