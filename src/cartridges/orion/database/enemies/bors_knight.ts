/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { getDirFromVector } from '../../constants';
import { addOrionInventoryItem, notifyOrionStateChange } from '../../stateStore';
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

export const borsKnightEnemy: EnemyWikiDefinition = {
  type: 'bors_knight',
  name: 'Sir Bors (Berserk Striker)',
  spawnChar: 'B',
  faction: 'camelot',
  emissiveColor: '#b8a4ff',
  tellRadius: 34,
  description: 'A relentless brawler who grows stronger with every hit and enrages at half health.',
  lore:
    'Gains +10% damage per strike landed; below 50% HP enters Grail Overload with a deadly telegraphed execution lunge.',
  shields: { type: 'physical', capacity: 60 },
  armor: { type: 'Reactive', threshold: 8, rating: 5, durability: 80 },
  frameIntegrity: 160,
  speed: 24,
  damage: 22,
  damageType: 'Impact',
  tellDurationSec: 0.5,
  attackCooldownSec: 2.0,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 50 },
    { itemId: 'grail_fragment', chance: 1.0, count: 1 },
    { itemId: 'rusted_gate_key', chance: 1.0, count: 1 },
    { itemId: 'corrupted_shard', chance: 1.0, count: 1 },
  ],
  onDeath(state, _e, ctx) {
    handleGrailKnightDefeat(state, ctx);
  },
  render25D(g, e, _state, ey, isHurt) {
    g.fillStyle = isHurt ? '#ffffff' : '#312e81';
    g.fillRect(e.x - 8, ey - 20, 16, 20);
    g.fillStyle = (e.hitsLanded || 0) > 0 ? '#f43f5e' : '#b8a4ff';
    g.fillRect(e.x - 6, ey - 18, 12, 12);
  },
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    if (e.frame.integrity <= e.frame.maxIntegrity * 0.5 && !e.enraged) {
      e.enraged = true;
      e.speed = 33;
      e.emissiveColor = '#ef4444';
      state.toastText = 'SIR BORS ENRAGED — WATCH FOR KILLING LUNGE!';
      state.toastTimer = 2.2;
    }

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.25;
        const lungeDist = e.enraged ? 26 : 14;
        e.x = Math.max(12, Math.min(148, e.x + (dx / dist) * lungeDist));
        e.y = Math.max(12, Math.min(132, e.y + (dy / dist) * lungeDist));
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

    if (dist < 110) {
      if (dist <= (e.enraged ? 44 : 32) && e.attackCd <= 0) {
        e.state = 'windup';
        e.stateTimer = this.tellDurationSec;
        return;
      }

      const step = e.speed * dt;
      if (dist > 20) {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
      }
    }
  },
};
