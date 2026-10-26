/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDirFromVector, getRoomDimensions, TILE_SIZE } from '../../../constants';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../../types';

export const bogWurmEnemy: EnemyWikiDefinition = {
  type: 'bog_wurm',
  name: 'The Bog Wurm',
  spawnChar: 'W',
  faction: 'hostile',
  emissiveColor: '#38bdf8',
  tellRadius: 26,
  description: 'A snake-like hybrid of machine and flesh with glowing ætheric veins.',
  lore:
    'Hides invisible beneath corrosive bog water, strikes first, and retreats to heal when hurt. Helping the Poe back to its lantern reveals its submerged form.',
  shields: { type: 'energy', capacity: 35 },
  armor: { type: 'Layered', threshold: 7, rating: 4, durability: 65 },
  frameIntegrity: 120,
  speed: 32,
  damage: 20,
  damageType: 'Pulse',
  tellDurationSec: 0.45,
  attackCooldownSec: 2.0,
  lootTable: [
    { itemId: 'corrupted_shard', chance: 1.0, count: 1 },
    { itemId: 'bedivere_relic', chance: 1.0, count: 1 },
  ],
  render25D(g, e, state, ey, isHurt) {
    if (e.isSubmerged) {
      g.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      g.lineWidth = 1;
      g.beginPath();
      g.ellipse(e.x, e.y, 7 + Math.sin(state.t * 4) * 2, 3, 0, 0, Math.PI * 2);
      g.stroke();
      return true; // Skip standard shadow/bar while submerged
    }
    g.fillStyle = isHurt ? '#ffffff' : '#0284c7';
    g.beginPath();
    g.ellipse(e.x, ey - 9, 8, 10, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#38bdf8';
    g.fillRect(e.x - 4, ey - 15, 8, 4);
  },
  update(rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.isSubmerged = false;
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const tx = Math.floor(e.x / TILE_SIZE);
    const ty = Math.floor(e.y / TILE_SIZE);
    const onWater = rooms[state.room]?.[ty]?.[tx] === '~';
    const lanternReveals = Boolean(
      state.flags?.poe_lantern_gift || state.flags?.poe_state === 'helped'
    );

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    if (e.state === 'windup') {
      e.isSubmerged = false;
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.25;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(dy, dx);
        e.x += Math.cos(ang) * 18;
        e.y += Math.sin(ang) * 18;
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: ang,
          arcSpan: Math.PI * 0.75,
          radius: 26,
          length: 26,
          width: 14,
          style: 'claw_bite',
          color: '#38bdf8',
          coreColor: '#e0f2fe',
          life: 0.24,
          maxLife: 0.24,
          isEnemy: true,
        });
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: ang,
          arcSpan: Math.PI * 2,
          radius: 24,
          style: 'shockwave',
          color: '#38bdf8',
          coreColor: '#bae6fd',
          life: 0.26,
          maxLife: 0.26,
          isEnemy: true,
        });
      }
      return;
    }

    if (e.state === 'attack') {
      e.isSubmerged = false;
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'recovery';
        e.stateTimer = 0.5;
      }
      return;
    }

    if (e.state === 'recovery') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'idle';
        e.attackCd = this.attackCooldownSec;
      }
      return;
    }

    const { widthPx, heightPx } = getRoomDimensions(rooms[state.room]);

    if (e.frame.integrity < e.frame.maxIntegrity * 0.65 && e.attackCd > 0.4) {
      e.isSubmerged = !lanternReveals;
      e.frame.integrity = Math.min(e.frame.maxIntegrity, e.frame.integrity + 9 * dt);
      e.t += dt * 3;
      e.x = Math.max(20, Math.min(widthPx - 20, e.x + Math.cos(e.t) * e.speed * dt));
      e.y = Math.max(20, Math.min(heightPx - 20, e.y + Math.sin(e.t) * e.speed * dt));
      return;
    }

    if (e.isFogBoss) {
      e.isSubmerged = false;
    } else if (dist <= 52) {
      // Breaches to ambush when player is within striking range
      e.isSubmerged = false;
    } else {
      e.isSubmerged = onWater && !lanternReveals;
    }

    if (dist <= 34 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
      e.hasStruckThisAttack = false;
      return;
    }

    e.x += (dx / dist) * e.speed * dt;
    e.y += (dy / dist) * e.speed * dt;
  },
};
