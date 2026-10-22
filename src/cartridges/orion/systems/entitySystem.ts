/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { GRAVITY, TILE_SIZE } from '../constants';
import { CHAR_TO_ENEMY_TYPE, getEnemyDefinition } from '../database/enemies';
import { getItemDefinition } from '../database/items';
import {
  getWeaponGemCombatModifiers,
  syncPostTutorialFrameLevel,
  unlockEquipmentItem,
  unlockLevel2SecondaryWeapon,
} from '../database/progression';
import { getWeaponDefinition } from '../database/weapons';
import { EnemyEntity, OrionCombatContext, OrionExecutionContext, OrionState } from '../types';
import { applyDamageToLayers } from './combatSystem';
import { addOrionInventoryItem, isSolidAt, notifyOrionStateChange, syncStateGates } from './playerSystem';
import { getCanonicalRoomPersistenceKey } from './worldSystem';

// ─── 1. 2.5D PARTICLES ───────────────────────────────────────────────────────

export function spawnParticles(
  state: OrionState,
  x: number,
  y: number,
  z: number,
  count: number,
  color: string,
  label?: string
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 35;
    state.particles.push({
      x,
      y,
      z,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 15 + Math.random() * 25,
      life: 0.35 + Math.random() * 0.2,
      maxLife: 0.5,
      color,
      size: 2 + Math.random() * 2,
      label: i === 0 ? label : undefined,
      fade: true,
    });
  }
}

export function updateParticles(state: OrionState, dt: number): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.vz -= 120 * dt;

    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

// ─── 2. ENEMY SPAWNING & AI ──────────────────────────────────────────────────

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
  state.enemies = [];
  const room = rooms[state.room];
  if (!room) return;

  const repeatableBogRooms = new Set(['0,-1', '0,-2', '1,0', '2,0', '3,0', '3,-1']);
  const isRepeatableBog = repeatableBogRooms.has(state.room);
  const canonicalRoomKey = getCanonicalRoomPersistenceKey(state, state.room);
  if (
    !isRepeatableBog &&
    (state.clearedRooms[state.room] || state.clearedRooms[canonicalRoomKey])
  ) {
    return;
  }

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

      const enemySpawnKey = `${canonicalRoomKey}:enemy:${x},${y}`;
      if (!isRepeatableBog && state.clearedRooms[enemySpawnKey]) {
        continue;
      }

      const px = x * TILE_SIZE + 8;
      const py = y * TILE_SIZE + 8;
      const countOfType = spawnCountsByType[type] || 0;
      spawnCountsByType[type] = countOfType + 1;

      const customOverrides = def.customSpawnSetup?.(state, px, py, countOfType);
      spawnEnemyByType(state, type, px, py, {
        ...customOverrides,
        spawnKey: enemySpawnKey,
      });

      if (def.companionSpawnType) {
        const hasExplicitCompanion =
          def.companionSpawnChar && room.some((r) => r.includes(def.companionSpawnChar!));
        const companionSpawnKey = `${enemySpawnKey}:companion`;
        if (!hasExplicitCompanion && !state.clearedRooms[companionSpawnKey]) {
          const maxRoomX = (room[0]?.length || 10) * TILE_SIZE - 20;
          spawnEnemyByType(
            state,
            def.companionSpawnType,
            Math.min(maxRoomX, px + 18),
            Math.max(20, py - 12),
            { spawnKey: companionSpawnKey }
          );
        }
      }
    }
  }

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

    const def = getEnemyDefinition(e.type);
    if (def) {
      def.update(rooms, state, e, dt);
    }

    if (e.frame.integrity <= 0) {
      soundSystem.playExplosion();

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

      let pId = 1000 + Math.floor(Math.random() * 9000);
      if (def?.lootTable) {
        for (const drop of def.lootTable) {
          if (Math.random() <= drop.chance) {
            const count = drop.count || 1;
            const dropDef = getItemDefinition(drop.itemId);
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
                color:
                  drop.itemId === 'salvage_scrap'
                    ? '#ffd27d'
                    : dropDef?.iconColor || '#77c7ff',
                t: Math.random() * 5,
              });
            }
          }
        }
      }

      // Canonical Gemstone Drop Table by Enemy Faction / Archetype (Tiered Drop Rates)
      if (e.faction !== 'poe' && e.faction !== 'npc') {
        const gemPoolByEnemy: Record<string, string[]> = {
          bog_crawler: ['hematite', 'spinel', 'charoite'],
          bog_wurm: ['rubellite', 'kyanite', 'charoite'],
          orc_scout: ['carnelian', 'hematite', 'spinel'],
          orc_warrior: ['carnelian', 'hematite', 'spinel'],
          percival_knight: ['titanite', 'moonstone', 'demantoid'],
          tristan_knight: ['charoite', 'rubellite', 'moonstone'],
          bors_knight: ['titanite', 'moonstone', 'spinel'],
          lady_of_the_lake: ['moonstone', 'rubellite', 'demantoid', 'kyanite'],
        };
        const dropChanceByEnemy: Record<string, number> = {
          bog_crawler: 0.22,
          orc_scout: 0.22,
          orc_warrior: 0.28,
          bog_wurm: 0.65,
          percival_knight: 1.0,
          tristan_knight: 1.0,
          bors_knight: 1.0,
          lady_of_the_lake: 1.0,
        };
        const dropChance = dropChanceByEnemy[e.type] ?? 0.25;
        if (Math.random() <= dropChance) {
          const pool = gemPoolByEnemy[e.type] || ['moonstone', 'rubellite', 'hematite'];
          const chosenGemId = pool[Math.floor(Math.random() * pool.length)];
          const gemDef = getItemDefinition(chosenGemId);
          state.pickups.push({
            id: pId++,
            x: e.x + (Math.random() - 0.5) * 10,
            y: e.y + (Math.random() - 0.5) * 10,
            z: 8,
            vz: 36,
            kind: 'item',
            itemId: chosenGemId,
            value: 1,
            color: gemDef?.iconColor || '#f8fafc',
            t: Math.random() * 5,
          });
        }
      }

      // Hematite weapon modification bonus: +4 Armor Durability restored on enemy kill
      const gemCombatMods = getWeaponGemCombatModifiers(state);
      if (gemCombatMods.armorRestoreOnKill > 0 && e.faction !== 'poe' && e.faction !== 'npc') {
        state.armor.durability = Math.min(
          state.armor.maxDurability,
          state.armor.durability + gemCombatMods.armorRestoreOnKill
        );
      }

      // Boss & Elite Equipment Discovery Unlocks
      const bossWeaponUnlockMap: Record<string, string> = {
        bog_wurm: 'short_spear',
        percival_knight: 'pavise_shield',
        tristan_knight: 'gladius_boltcaster',
        bors_knight: 'long_sword',
        lady_of_the_lake: 'avalon_siege_lance',
      };
      const bossWeaponId = bossWeaponUnlockMap[e.type];
      if (bossWeaponId && unlockEquipmentItem(state, bossWeaponId)) {
        const wName = getWeaponDefinition(bossWeaponId)?.name || bossWeaponId;
        ctx.say(`SALVAGED BOSS ARMAMENT: ${wName.toUpperCase()} UNLOCKED IN SATCHEL!`);
      }

      if (e.faction === 'poe') {
        if (state.level < 2) {
          state.level = 2;
        }
        unlockLevel2SecondaryWeapon(state);
      }

      const defeatedFaction = e.faction;
      if (e.spawnKey && defeatedFaction !== 'poe' && defeatedFaction !== 'npc') {
        state.clearedRooms[e.spawnKey] = true;
      }
      state.enemies.splice(i, 1);
      state.flags = state.flags || {};

      def?.onDeath?.(state, e, ctx);
      syncPostTutorialFrameLevel(state, ctx);
      syncStateGates(state);

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

      const remainingHostiles = state.enemies.filter(
        (rem) => rem.faction !== 'npc' && rem.faction !== 'poe'
      );
      if (remainingHostiles.length === 0 && defeatedFaction !== 'poe') {
        state.clearedRooms[state.room] = true;
        state.clearedRooms[getCanonicalRoomPersistenceKey(state, state.room)] = true;
        if (!state.toastText || state.toastTimer <= 0) {
          ctx.say('SECTOR SECURED');
        }
      }
    }
  }
}

// ─── 3. PROJECTILES ──────────────────────────────────────────────────────────

export function updateProjectiles(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;

    if (Math.random() < 0.6) {
      state.particles.push({
        x: p.x + (Math.random() - 0.5) * 4,
        y: p.y + (Math.random() - 0.5) * 4,
        z: p.z + (Math.random() - 0.5) * 2,
        vx: -p.vx * 0.1,
        vy: -p.vy * 0.1,
        vz: 4,
        life: 0.18,
        maxLife: 0.18,
        color: p.trailColor,
        size: 2,
        fade: true,
      });
    }

    const tx = Math.floor(p.x / TILE_SIZE);
    const ty = Math.floor(p.y / TILE_SIZE);
    if (isSolidAt(rooms, state, tx, ty, p.z)) {
      if (p.onImpact) {
        p.onImpact(p.x, p.y, p.z, state);
      }
      state.projectiles.splice(i, 1);
      continue;
    }

    if (p.isPlayer) {
      let hit = false;
      for (const e of state.enemies) {
        if (e.isSubmerged) continue;
        if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;

        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist < 14 && Math.abs(e.z - p.z) < 14) {
          hit = true;
          e.stun = 0.2;
          e.hurt = 0.2;

          const hasKnightsOath = state.equippedFeats.includes('knights_oath');
          const oathMult = hasKnightsOath && e.faction === 'camelot' ? 1.25 : 1.0;
          const opticMult = (state.opticMarkTimer || 0) > 0 ? 1.25 : 1.0;
          const effDamage = Math.round(p.damage * oathMult * opticMult);

          applyDamageToLayers(
            e.shields,
            e.armor,
            e.frame,
            effDamage,
            p.damageType,
            (count, color, label) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, label)
          );

          soundSystem.playHit();

          if (p.onImpact) {
            p.onImpact(p.x, p.y, p.z, state);
          }
          break;
        }
      }

      if (hit) {
        state.projectiles.splice(i, 1);
        continue;
      }
    } else {
      const dist = Math.hypot(state.x - p.x, state.y - p.y);
      if (dist < 12 && Math.abs(state.z - p.z) < 12 && !state.isBoosterDashing) {
        soundSystem.playHit();
        applyDamageToLayers(
          state.shields,
          state.armor,
          state.frame,
          p.damage,
          p.damageType,
          (count, color, label) => ctx.spawnParticles(state.x, state.y, state.z + 8, count, color, label)
        );

        if (p.onImpact) {
          p.onImpact(p.x, p.y, p.z, state);
        }
        state.projectiles.splice(i, 1);
        continue;
      }
    }

    if (p.life <= 0) {
      state.projectiles.splice(i, 1);
    }
  }
}

// ─── 4. LOOT PICKUPS ─────────────────────────────────────────────────────────

export function updatePickups(
  state: OrionState,
  ctx: OrionExecutionContext,
  dt: number
): void {
  for (let i = state.pickups.length - 1; i >= 0; i--) {
    const p = state.pickups[i];
    p.t += dt;

    if (p.z > 0 || p.vz !== 0) {
      p.z += p.vz * dt;
      p.vz -= GRAVITY * dt;
      if (p.z <= 0) {
        p.z = 0;
        p.vz = 0;
      }
    }

    const dist = Math.hypot(state.x - p.x, state.y - p.y);

    if (dist < 32) {
      const pullSpeed = 90 * dt;
      p.x += ((state.x - p.x) / dist) * pullSpeed;
      p.y += ((state.y - p.y) / dist) * pullSpeed;
    }

    if (dist < 10) {
      soundSystem.playCoin();

      if (p.kind === 'scrap' || p.itemId === 'salvage_scrap') {
        state.salvageScrap += p.value || 1;
        ctx.say(`+${p.value || 1} SALVAGE SCRAP`);
      } else if (p.itemId) {
        const itemDef = getItemDefinition(p.itemId);
        if (itemDef?.onCollect) {
          itemDef.onCollect(state, ctx);
        } else {
          addOrionInventoryItem(state, p.itemId, 1);
          ctx.say(`SALVAGED: ${itemDef?.name || p.itemId}`);
        }
      }

      state.pickups.splice(i, 1);
    }
  }
}

/**
 * Step all non-player dynamic entities (Enemies, Projectiles, Pickups, Particles).
 */
export function updateEntitySystem(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  updateEnemies(rooms, state, ctx, dt);
  updateProjectiles(rooms, state, ctx, dt);
  updatePickups(state, ctx, dt);
  updateParticles(state, dt);
}
