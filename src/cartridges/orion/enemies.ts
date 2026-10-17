/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { TILE_SIZE } from './constants';
import { CHAR_TO_ENEMY_TYPE, getEnemyDefinition } from './database/enemies';
import { notifyOrionStateChange } from './stateStore';
import { EnemyEntity, OrionCombatContext, OrionState } from './types';

let nextEnemyId = 1;

export function spawnEnemyByType(
  state: OrionState,
  type: string,
  x: number,
  y: number,
  overrides?: Partial<EnemyEntity>
): EnemyEntity | null {
  const def = getEnemyDefinition(type);
  if (!def) return null;

  const entity: EnemyEntity = {
    id: nextEnemyId++,
    type,
    name: def.name,
    x,
    y,
    z: def.defaultZ ?? 0,
    vz: 0,
    shields: {
      ...def.shields,
      maxCapacity: def.shields.capacity,
      overloaded: false,
      overloadTimer: 0,
      rechargeDelay: 0,
    },
    armor: { ...def.armor, maxDurability: def.armor.durability },
    frame: {
      integrity: def.frameIntegrity,
      maxIntegrity: def.frameIntegrity,
      state: 'Operational',
    },
    dir: 'S',
    speed: def.speed,
    damage: def.damage,
    damageType: def.damageType,
    stun: 0,
    hurt: 0,
    t: Math.random() * 5,
    state: 'idle',
    stateTimer: 0,
    attackCd: 1.2,
    tellRadius: def.tellRadius ?? 26,
    isFlying: Boolean(def.isFlying),
    emissiveColor: def.emissiveColor || '#ffd27d',
    faction: def.faction || 'hostile',
    hitsLanded: 0,
    ...overrides,
  };

  state.enemies.push(entity);
  return entity;
}

export function spawnRoomEnemies(
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  // Check if leaving a room where a Poe was left untouched -> marks Poe as 'ignored' & reveals Bog exit
  const hadPoe = state.enemies.some((e) => e.faction === 'poe' && e.frame.integrity > 0);
  if (hadPoe && (!state.flags?.poe_state || state.flags.poe_state === 'unmet')) {
    state.flags = state.flags || {};
    state.flags.poe_state = 'ignored';
    state.flags.bog_exit_revealed = true;
  }

  state.enemies = [];
  const room = rooms[state.room];
  if (!room) return;

  // Don't respawn hostiles if room cleared
  if (state.clearedRooms[state.room]) return;

  const spawnCountsByType: Record<string, number> = {};

  for (let y = 0; y < room.length; y++) {
    for (let x = 0; x < room[y].length; x++) {
      const char = room[y][x];
      const type = CHAR_TO_ENEMY_TYPE[char];
      if (!type) continue;

      const def = getEnemyDefinition(type);
      if (!def) continue;

      if (def.shouldSkipSpawn?.(state)) {
        continue;
      }

      const px = x * TILE_SIZE + 8;
      const py = y * TILE_SIZE + 8;
      const countOfType = spawnCountsByType[type] || 0;
      spawnCountsByType[type] = countOfType + 1;

      const customOverrides = def.customSpawnSetup?.(state, px, py, countOfType);
      spawnEnemyByType(state, type, px, py, customOverrides);

      // Data-driven companion pair spawning (e.g. Orc Warrior spawns paired Orc Scout if not explicitly placed)
      if (def.companionSpawnType) {
        const hasExplicitCompanion =
          def.companionSpawnChar && room.some((r) => r.includes(def.companionSpawnChar!));
        if (!hasExplicitCompanion) {
          spawnEnemyByType(
            state,
            def.companionSpawnType,
            Math.min(140, px + 18),
            Math.max(20, py - 12)
          );
        }
      }
    }
  }

  // Track if all 3 Camelot Knights are present simultaneously in this room for the Knight's Oath feat
  const camelotKnightTypes = new Set(
    state.enemies.filter((e) => e.faction === 'camelot').map((e) => e.type)
  );
  if (camelotKnightTypes.size >= 3) {
    state.flags = state.flags || {};
    state.flags.knights_pulled_together = true;
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

      const defeatedFaction = e.faction;
      state.enemies.splice(i, 1);
      state.flags = state.flags || {};

      // Execute entity-specific onDeath hook from its database module
      def?.onDeath?.(state, e, ctx);

      // Orc Raid Completion Check
      if (state.flags.orc_raid_active) {
        const remainingOrcs = state.enemies.filter((rem) => rem.faction === 'orc');
        if (remainingOrcs.length === 0) {
          state.flags.orc_raid_active = false;
          const survivors = Math.max(
            1,
            state.enemies.filter((rem) => rem.faction === 'npc').length
          );
          const trustGain = state.flags.bedivere_ring_choice === 'taken' ? 1 : survivors;
          state.flags.town_trust = Number(state.flags.town_trust || 0) + trustGain;
          for (const rem of state.enemies) {
            if (
              rem.type === 'town_npc' &&
              (!rem.isLoyalist || state.flags.bedivere_ring_choice !== 'taken')
            ) {
              rem.npcDisposition = 'calm';
              rem.faction = 'npc';
            }
          }
          soundSystem.playPowerup();
          ctx.say(`ORC RAID REPELLED! TOWN TRUST: ${state.flags.town_trust}/3`);
          notifyOrionStateChange();
        }
      }

      // Mark room cleared if no hostile enemies remain
      const remainingHostiles = state.enemies.filter(
        (rem) => rem.faction !== 'npc' && rem.faction !== 'poe'
      );
      if (remainingHostiles.length === 0 && defeatedFaction !== 'poe') {
        state.clearedRooms[state.room] = true;
        if (!state.toastText || state.toastTimer <= 0) {
          ctx.say('SECTOR SECURED');
        }
      }
    }
  }
}
