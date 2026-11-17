/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDirFromVector, TILE_SIZE } from '../../../constants';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../../types';

function isTileSolidForKnight(
  char: string | undefined,
  state: OrionState
): boolean {
  if (!char || char === ' ' || char === '#' || char === 'P' || char === '_') {
    return true;
  }
  if (char === '%') {
    return Math.floor((state.t || 0) / 3.5) % 2 === 0;
  }
  if (char === 'G') {
    const gateUnlocked = Boolean(
      state.unlockedGates?.[state.room] ||
        state.unlockedGates?.['3,0'] ||
        state.flags?.bog_exit_revealed
    );
    return !gateUnlocked;
  }
  if (char === 'M') {
    return !state.flags?.cathedral_door_open;
  }
  return false;
}

function canPositionFitKnight(
  roomGrid: string[] | undefined,
  state: OrionState,
  x: number,
  y: number,
  radius: number = 4
): boolean {
  if (!roomGrid || roomGrid.length === 0) return false;
  const minTx = Math.floor((x - radius) / TILE_SIZE);
  const maxTx = Math.floor((x + radius) / TILE_SIZE);
  const minTy = Math.floor((y - radius) / TILE_SIZE);
  const maxTy = Math.floor((y + radius) / TILE_SIZE);

  for (let ty = minTy; ty <= maxTy; ty++) {
    const row = roomGrid[ty];
    if (!row) return false;
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (isTileSolidForKnight(row[tx], state)) {
        return false;
      }
    }
  }
  return true;
}

function stepKnightWithCollision(
  rooms: Record<string, string[]>,
  state: OrionState,
  e: EnemyEntity,
  dx: number,
  dy: number
): void {
  const roomGrid = rooms[state.room];
  if (dx !== 0 && canPositionFitKnight(roomGrid, state, e.x + dx, e.y)) {
    e.x += dx;
  }
  if (dy !== 0 && canPositionFitKnight(roomGrid, state, e.x, e.y + dy)) {
    e.y += dy;
  }
}

function canKnightDetectPlayer(
  rooms: Record<string, string[]>,
  state: OrionState,
  e: EnemyEntity,
  baseAggroRadiusPx: number
): boolean {
  const wasDamagedRecently = (e.hurt || 0) > 0;
  if ((state.spawnGraceTimer || 0) > 0 && !wasDamagedRecently) {
    return false;
  }
  const visionTiles = Math.max(1, e.visionRadiusTiles ?? state.enemyBaseLight ?? 5);
  const rawRadius = Math.max(visionTiles * TILE_SIZE, baseAggroRadiusPx);
  const dist = Math.hypot(state.x - e.x, state.y - e.y);
  if (dist > (wasDamagedRecently ? rawRadius * 1.45 : rawRadius)) {
    return false;
  }
  const roomGrid = rooms[state.room];
  if (!roomGrid || roomGrid.length === 0) return false;
  const steps = Math.max(2, Math.ceil(dist / 6));
  const startTx = Math.floor(e.x / TILE_SIZE);
  const startTy = Math.floor(e.y / TILE_SIZE);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const tx = Math.floor((e.x + (state.x - e.x) * t) / TILE_SIZE);
    const ty = Math.floor((e.y + (state.y - e.y) * t) / TILE_SIZE);
    if (tx === startTx && ty === startTy) continue;
    const ch = roomGrid[ty]?.[tx];
    if (ch && ch !== '_' && isTileSolidForKnight(ch, state)) {
      return false;
    }
  }
  return true;
}

/**
 * Canonical database definition for `camelotKnightEnemy` (`Camelot Knight-Errant`, id `'camelot_knight'`, spawnChar `'K'`) —
 * Generic armored Camelot vanguard patrolling Belldor garrisons and desynchronized ruins with a warded heater shield and broadsword cleave.
 *
 * Wiring: Auto-discovered by the enemy module scanner in `src/cartridges/orion/database/enemies/index.ts`
 * and resolved as the global fallback for `'K'` in `resolveRoomEnemyTypeAtChar` (`src/cartridges/orion/database/world/index.ts`).
 * Removal: Delete `src/cartridges/orion/database/enemies/belldor/camelot_knight.ts` and restore `spawnChar: 'K'` on `percivalKnightEnemy`.
 */
export const camelotKnightEnemy: EnemyWikiDefinition = {
  type: 'camelot_knight',
  name: 'Camelot Knight-Errant',
  spawnChar: 'K',
  faction: 'camelot',
  emissiveColor: '#93c5fd',
  tellRadius: 30,
  visionRadiusTiles: 5,
  description:
    'An armored Camelot garrison knight wielding a warded heater shield and broadsword cleave.',
  lore:
    'Standard line-knights of Camelot who still hold their patrol posts across Belldor while named Grail Knights command the inner sanctums.',
  shields: { type: 'physical', capacity: 65 },
  armor: { type: 'Hardened', threshold: 7, rating: 4, durability: 65 },
  frameIntegrity: 115,
  speed: 20,
  damage: 24,
  damageType: 'Impact',
  tellDurationSec: 0.8,
  attackCooldownSec: 2.5,
  weightClass: 'heavy',
  baseWeight: 155,
  baseStability: 64,
  attackWeight: 52,
  attackSpeed: 142,
  commitment: 0.9,
  lootTable: [
    { itemId: 'trade_coin', chance: 1.0, count: 16 },
    { itemId: 'demantoid_flask', chance: 0.4, count: 1 },
  ],
  render25D(g, e, state, ey, isHurt, isWindup) {
    const maxT = Math.max(0.05, e.stateMaxTimer || this.tellDurationSec);
    const windupPct = isWindup ? Math.max(0, Math.min(1, 1 - e.stateTimer / maxT)) : 0;
    const isAttack = e.state === 'attack';
    const crouchY = isWindup ? Math.round(windupPct * 2) : 0;

    // Camelot Knight-Errant steel & royal-blue tabard chassis
    g.fillStyle = isHurt ? '#ffffff' : '#1e3a8a';
    g.fillRect(e.x - 6, ey - 17 + crouchY, 12, 17 - crouchY);
    g.fillStyle = isHurt ? '#ffffff' : '#64748b';
    g.fillRect(e.x - 4, ey - 15 + crouchY, 8, 9);

    // Warded Heater Shield on left arm
    const shieldX = isWindup ? e.x - 9 : e.x - 8;
    g.fillStyle = '#93c5fd';
    g.fillRect(shieldX, ey - 13 + crouchY, 4, 10);

    // Broadsword posture on right arm
    const ang = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
    const bladeY = isWindup
      ? ey - 16 - Math.round(windupPct * 5)
      : isAttack
        ? ey - 7
        : ey - 13;
    g.fillStyle = isWindup && windupPct > 0.55 ? '#fde047' : '#e2e8f0';
    g.fillRect(e.x + (Math.cos(ang) >= 0 ? 5 : -8), bladeY, 3, 6);
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
        e.stateTimer = 0.25;
        e.stateMaxTimer = 0.25;
        e.hasStruckThisAttack = false;
        const ang = e.attackAngle ?? Math.atan2(dy, dx);
        stepKnightWithCollision(rooms, state, e, Math.cos(ang) * 18, Math.sin(ang) * 18);
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: e.x,
          y: e.y,
          z: e.z,
          angle: ang,
          arcSpan: Math.PI * 0.75,
          radius: 24,
          width: 15,
          style: 'chop',
          color: '#60a5fa',
          coreColor: '#e0f2fe',
          life: 0.24,
          maxLife: 0.24,
          isEnemy: true,
        });
      }
      return;
    }

    if (e.state === 'attack') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'recovery';
        e.stateTimer = 0.72;
        e.stateMaxTimer = 0.72;
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

    if (!canKnightDetectPlayer(rooms, state, e, 96)) {
      e.t += dt;
      stepKnightWithCollision(
        rooms,
        state,
        e,
        Math.cos(e.t * 1.4) * 6 * dt,
        Math.sin(e.t * 1.4) * 6 * dt
      );
      return;
    }

    e.dir = getDirFromVector(dx, dy);

    if (dist <= 34 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      e.stateMaxTimer = this.tellDurationSec;
      e.attackAngle = Math.atan2(dy, dx);
      e.hasStruckThisAttack = false;
      return;
    }

    if (dist > 18) {
      const step = e.speed * dt;
      stepKnightWithCollision(rooms, state, e, (dx / dist) * step, (dy / dist) * step);
    }
  },
};
