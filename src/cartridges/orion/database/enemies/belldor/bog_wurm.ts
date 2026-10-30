/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDirFromVector, TILE_SIZE } from '../../../constants';
import {
  canEnemyDetectPlayer,
  findNearestWaterTilePx,
  idlePatrolEnemy,
  stepEnemyWithCollision,
} from '../../../systems/enemyHelpers';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../../types';

export const bogWurmEnemy: EnemyWikiDefinition = {
  type: 'bog_wurm',
  name: 'The Bog Wurm',
  spawnChar: 'W',
  faction: 'hostile',
  emissiveColor: '#38bdf8',
  tellRadius: 26,
  visionRadiusTiles: 5,
  description: 'A snake-like hybrid of machine and flesh with glowing ætheric veins.',
  lore:
    'Can only submerge in corrosive bog water (~). When on dry ground and seeking stealth or regeneration, it slithers toward the nearest water pool first. Helping the Poe reveals its submerged form.',
  shields: { type: 'energy', capacity: 35 },
  armor: { type: 'Layered', threshold: 7, rating: 4, durability: 65 },
  frameIntegrity: 120,
  speed: 32,
  damage: 28,
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
    const tx = Math.floor(e.x / TILE_SIZE);
    const ty = Math.floor(e.y / TILE_SIZE);
    const onWater = rooms[state.room]?.[ty]?.[tx] === '~';

    // Strict rule: Bog Wurm can ONLY be submerged while standing on '~'
    if (!onWater) {
      e.isSubmerged = false;
    }

    if (e.stun > 0) {
      e.isSubmerged = false;
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const lanternReveals = Boolean(
      state.flags?.poe_lantern_gift || state.flags?.poe_state === 'helped'
    );

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (e.state === 'windup') {
      e.isSubmerged = false;
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.25;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(dy, dx);
        stepEnemyWithCollision(rooms, state, e, Math.cos(ang) * 18, Math.sin(ang) * 18);
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

    // Helper: seek nearest '~' tile when the wurm wants to submerge and is not currently on '~'
    const seekWaterToSubmerge = (speedMult: number = 1.0): boolean => {
      if (onWater) {
        e.isSubmerged = !e.isFogBoss && !lanternReveals;
        return true;
      }
      e.isSubmerged = false;
      const waterTarget = findNearestWaterTilePx(rooms, state, e.x, e.y, 10);
      if (waterTarget) {
        const wdx = waterTarget.x - e.x;
        const wdy = waterTarget.y - e.y;
        const wDist = Math.hypot(wdx, wdy) || 1;
        e.dir = getDirFromVector(wdx, wdy);
        stepEnemyWithCollision(
          rooms,
          state,
          e,
          (wdx / wDist) * e.speed * speedMult * dt,
          (wdy / wDist) * e.speed * speedMult * dt
        );
        const newTx = Math.floor(e.x / TILE_SIZE);
        const newTy = Math.floor(e.y / TILE_SIZE);
        if (rooms[state.room]?.[newTy]?.[newTx] === '~') {
          e.isSubmerged = !e.isFogBoss && !lanternReveals;
          return true;
        }
      }
      return false;
    };

    // Retreating to regenerate at < 65% HP: must reach '~' before it can submerge and heal
    if (e.frame.integrity < e.frame.maxIntegrity * 0.65 && e.attackCd > 0.4) {
      if (seekWaterToSubmerge(1.15)) {
        e.frame.integrity = Math.min(e.frame.maxIntegrity, e.frame.integrity + 9 * dt);
        e.t += dt * 3;
        const driftX = Math.cos(e.t) * e.speed * 0.45 * dt;
        const driftY = Math.sin(e.t) * e.speed * 0.45 * dt;
        const nextTx = Math.floor((e.x + driftX) / TILE_SIZE);
        const nextTy = Math.floor((e.y + driftY) / TILE_SIZE);
        if (rooms[state.room]?.[nextTy]?.[nextTx] === '~') {
          stepEnemyWithCollision(rooms, state, e, driftX, driftY);
        }
      }
      return;
    }

    if (!canEnemyDetectPlayer(rooms, state, e, e.isFogBoss ? 115 : 80)) {
      if (!onWater) {
        if (!seekWaterToSubmerge(0.85)) {
          idlePatrolEnemy(rooms, state, e, dt, 7);
        }
      } else {
        e.isSubmerged = e.isFogBoss ? false : !lanternReveals;
        idlePatrolEnemy(rooms, state, e, dt, 6);
        const afterTx = Math.floor(e.x / TILE_SIZE);
        const afterTy = Math.floor(e.y / TILE_SIZE);
        if (rooms[state.room]?.[afterTy]?.[afterTx] !== '~') {
          e.isSubmerged = false;
        }
      }
      return;
    }

    e.dir = getDirFromVector(dx, dy);

    if (e.isFogBoss) {
      e.isSubmerged = false;
    } else if (dist <= 52) {
      // Breaches to ambush when player is within striking range
      e.isSubmerged = false;
    } else if (!onWater) {
      // Wants to stalk submerged outside 52px but is not on '~' -> seek '~' first
      if (seekWaterToSubmerge(1.0)) {
        return;
      }
    } else {
      e.isSubmerged = !lanternReveals;
    }

    if (dist <= 34 && e.attackCd <= 0) {
      e.isSubmerged = false;
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
      e.hasStruckThisAttack = false;
      return;
    }

    stepEnemyWithCollision(
      rooms,
      state,
      e,
      (dx / dist) * e.speed * dt,
      (dy / dist) * e.speed * dt
    );
    const finalTx = Math.floor(e.x / TILE_SIZE);
    const finalTy = Math.floor(e.y / TILE_SIZE);
    if (rooms[state.room]?.[finalTy]?.[finalTx] !== '~') {
      e.isSubmerged = false;
    }
  },
};
