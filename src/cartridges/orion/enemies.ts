/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { TILE_SIZE } from './constants';
import { getEnemyDefinition } from './database/enemies';
import { EnemyEntity, OrionCombatContext, OrionState } from './types';

let nextEnemyId = 1;

export function spawnRoomEnemies(
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  state.enemies = [];
  const room = rooms[state.room];
  if (!room) return;

  // Don't spawn if room cleared
  if (state.clearedRooms[state.room]) return;

  for (let y = 0; y < room.length; y++) {
    for (let x = 0; x < room[y].length; x++) {
      const char = room[y][x];
      if (char === 'E') {
        const def = getEnemyDefinition('bog_crawler');
        if (def) {
          state.enemies.push({
            id: nextEnemyId++,
            type: 'bog_crawler',
            name: def.name,
            x: x * TILE_SIZE + 8,
            y: y * TILE_SIZE + 8,
            z: 0,
            vz: 0,
            shields: { ...def.shields, maxCapacity: def.shields.capacity, overloaded: false, overloadTimer: 0, rechargeDelay: 0 },
            armor: { ...def.armor, maxDurability: def.armor.durability },
            frame: { integrity: def.frameIntegrity, maxIntegrity: def.frameIntegrity, state: 'Operational' },
            dir: 'S',
            speed: def.speed,
            damage: def.damage,
            damageType: def.damageType,
            stun: 0,
            hurt: 0,
            t: Math.random() * 5,
            state: 'idle',
            stateTimer: 0,
            attackCd: 1.0,
            tellRadius: 28,
            emissiveColor: '#ffd27d',
          });
        }
      } else if (char === 'B') {
        const def = getEnemyDefinition('bors_knight');
        if (def) {
          state.enemies.push({
            id: nextEnemyId++,
            type: 'bors_knight',
            name: def.name,
            x: x * TILE_SIZE + 8,
            y: y * TILE_SIZE + 8,
            z: 0,
            vz: 0,
            shields: { ...def.shields, maxCapacity: def.shields.capacity, overloaded: false, overloadTimer: 0, rechargeDelay: 0 },
            armor: { ...def.armor, maxDurability: def.armor.durability },
            frame: { integrity: def.frameIntegrity, maxIntegrity: def.frameIntegrity, state: 'Operational' },
            dir: 'S',
            speed: def.speed,
            damage: def.damage,
            damageType: def.damageType,
            stun: 0,
            hurt: 0,
            t: 0,
            state: 'idle',
            stateTimer: 0,
            attackCd: 1.5,
            tellRadius: 36,
            emissiveColor: '#b8a4ff',
          });
        }
      }
    }
  }
}

export function updateEnemies(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];

    if (e.hurt > 0) e.hurt -= dt;

    // Call database-defined enemy AI
    const def = getEnemyDefinition(e.type);
    if (def) {
      def.update(rooms, state, e, dt);
    }

    // Check defeat (Frame integrity <= 0)
    if (e.frame.integrity <= 0) {
      soundSystem.playExplosion();

      // Death explosion particles
      for (let p = 0; p < 10; p++) {
        const angle = (Math.PI * 2 * p) / 10;
        state.particles.push({
          x: e.x,
          y: e.y,
          z: e.z + 8,
          vx: Math.cos(angle) * 45,
          vy: Math.sin(angle) * 45,
          vz: 20,
          life: 0.4,
          maxLife: 0.4,
          color: e.emissiveColor || '#ffd27d',
          size: 3,
          fade: true,
        });
      }

      // Roll loot table
      if (def?.lootTable) {
        let pId = 1000 + Math.floor(Math.random() * 9000);
        for (const drop of def.lootTable) {
          if (Math.random() <= drop.chance) {
            const count = drop.count || 1;
            for (let c = 0; c < count; c++) {
              state.pickups.push({
                id: pId++,
                x: e.x + (Math.random() - 0.5) * 12,
                y: e.y + (Math.random() - 0.5) * 12,
                z: 6,
                vz: 30 + Math.random() * 20,
                kind: drop.itemId === 'salvage_scrap' ? 'scrap' : 'item',
                itemId: drop.itemId,
                value: 1,
                color: drop.itemId === 'salvage_scrap' ? '#ffd27d' : '#77c7ff',
                t: Math.random() * 5,
              });
            }
          }
        }
      }

      state.enemies.splice(i, 1);

      if (state.enemies.length === 0) {
        state.clearedRooms[state.room] = true;
        ctx.say('SECTOR SECURED');
      }
    }
  }
}
