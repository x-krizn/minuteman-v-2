/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDirFromVector } from '../../constants';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../types';

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
  tellRadius: 26,
  companionSpawnType: 'orc_scout',
  companionSpawnChar: 's',
  description: 'A shield-bearing brawler who closes distance aggressively and hits hard.',
  lore:
    'Orcs always patrol Belldor in pairs: a Warrior and a Scout. The Warrior anchors the front line with a physical bulwark while the Scout fires from cover.',
  shields: { type: 'physical', capacity: 45 },
  armor: { type: 'Hardened', threshold: 6, rating: 3, durability: 45 },
  frameIntegrity: 60,
  speed: 30,
  damage: 16,
  damageType: 'Impact',
  tellDurationSec: 0.4,
  attackCooldownSec: 1.6,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 8 },
    { itemId: 'orc_war_paint', chance: 0.35 },
  ],
  render25D(g, e, _state, ey, isHurt) {
    g.fillStyle = isHurt ? '#ffffff' : '#9a3412';
    g.fillRect(e.x - 6, ey - 15, 12, 15);
    g.fillStyle = '#fdba74';
    g.fillRect(e.x - 8, ey - 12, 4, 10);
  },
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const target = getOrcTarget(state, e);
    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.22;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(dy, dx);
        e.x += Math.cos(ang) * 12;
        e.y += Math.sin(ang) * 12;
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: ang,
          arcSpan: Math.PI * 0.8,
          radius: 24,
          width: 14,
          style: 'chop',
          color: '#fb923c',
          coreColor: '#ffedd5',
          life: 0.22,
          maxLife: 0.22,
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

    if (dist <= 26 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
      e.hasStruckThisAttack = false;
      return;
    }

    if (dist > 16) {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
    }
  },
};
