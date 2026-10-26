/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDirFromVector } from '../../../constants';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../../types';

export const townNpcEntity: EnemyWikiDefinition = {
  type: 'town_npc',
  name: 'Border Town Survivor',
  spawnChar: 'N',
  faction: 'npc',
  emissiveColor: '#94a3b8',
  tellRadius: 24,
  description: 'A citizen of the contested settlement suffering from Grail Sickness.',
  lore:
    'Some are calm enough to trade, some turn hostile if you linger, and Loyalists attack anyone carrying Bedivere’s Signet Ring as a grave robber.',
  shields: { type: 'physical', capacity: 20 },
  armor: { type: 'Hardened', threshold: 4, rating: 2, durability: 30 },
  frameIntegrity: 50,
  speed: 24,
  damage: 12,
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
  render25D(g, e, _state, ey, isHurt) {
    const dispColor =
      e.npcDisposition === 'feral'
        ? '#dc2626'
        : e.npcDisposition === 'linger'
        ? '#d97706'
        : '#475569';
    g.fillStyle = isHurt ? '#ffffff' : dispColor;
    g.fillRect(e.x - 4, ey - 13, 8, 13);
    g.fillStyle = e.isLoyalist ? '#93c5fd' : '#cbd5e1';
    g.fillRect(e.x - 3, ey - 15, 6, 3);
  },
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
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
    }

    if (e.npcDisposition === 'linger') {
      if (dist < 38) {
        e.lingerTimer = (e.lingerTimer || 0) + dt;
        if (e.lingerTimer >= 2.5) {
          e.npcDisposition = 'feral';
          e.faction = 'hostile';
          e.name = 'Feral Grail-Sick Citizen';
          state.toastText = 'GRAIL SICKNESS FLARED — CITIZEN TURNED FERAL!';
          state.toastTimer = 2.2;
        }
      } else {
        e.lingerTimer = Math.max(0, (e.lingerTimer || 0) - dt * 0.5);
      }
    }

    if (e.npcDisposition === 'feral') {
      e.dir = getDirFromVector(dx, dy);
      if (e.state === 'windup') {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.state = 'attack';
          e.stateTimer = 0.2;
          e.hasStruckThisAttack = false;
          const ang = e.attackAngle ?? Math.atan2(dy, dx);
          e.x += Math.cos(ang) * 10;
          e.y += Math.sin(ang) * 10;
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
      if (dist <= 24 && e.attackCd <= 0) {
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
    } else {
      e.t += dt;
      e.x += Math.cos(e.t * 1.1) * 5 * dt;
      e.y += Math.sin(e.t * 1.1) * 5 * dt;
    }
  },
};
