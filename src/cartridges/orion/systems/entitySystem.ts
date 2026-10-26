/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { GRAVITY, TILE_SIZE } from '../constants';
import { getEnemyDefinition } from '../database/enemies';
import { getItemDefinition } from '../database/items';
import { resolveRoomEnemyTypeAtChar } from '../database/world';
import {
  getWeaponGemCombatModifiers,
  syncPostTutorialFrameLevel,
  unlockEquipmentItem,
  unlockLevel2SecondaryWeapon,
} from '../database/progression';
import { getWeaponDefinition } from '../database/equipment/weapons';
import { EnemyEntity, OrionCombatContext, OrionExecutionContext, OrionState } from '../types';
import { applyDamageToLayers, PERFECT_BLOCK_WINDOW_SEC } from './combatSystem';
import { addOrionInventoryItem, isSolidAt, notifyOrionStateChange, syncStateGates } from './playerSystem';
import {
  clearAetherFogOnBossDefeat,
  ENEMY_EQUIPMENT_DROP_POOLS,
  getCanonicalRoomPersistenceKey,
  getMaxAetherFogDepth,
  resolveContextualEquipmentDrop,
  resolveContextualGemPool,
} from './worldSystem';

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
    name: overrides?.name || def.name,
  };

  state.enemies.push(entity);
  return entity;
}

// [ORION-ANCHOR: ENTITY-SPAWN-ROOM]
export function spawnRoomEnemies(
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  state.enemies = [];
  state.lockedTargetId = null;
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
      const type = resolveRoomEnemyTypeAtChar(char, state.biomeId);
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
      const maxFogDepth = getMaxAetherFogDepth(state);
      const effDepth = Math.max(
        0,
        Math.min(maxFogDepth, e.fogDepth ?? state.fogGraph?.loopDepth ?? 0)
      );

      if (def?.lootTable) {
        for (const drop of def.lootTable) {
          const scaledChance = Math.min(1, drop.chance * (1 + effDepth * 0.2));
          if (Math.random() <= scaledChance) {
            const baseCount = drop.count || 1;
            const isCurrency = drop.itemId === 'trade_coin';
            const count = isCurrency
              ? baseCount + effDepth * 2 + (e.isFogBoss ? 6 : 0)
              : baseCount + (effDepth >= 3 && Math.random() < 0.35 ? 1 : 0);
            const dropDef = getItemDefinition(drop.itemId);
            for (let c = 0; c < count; c++) {
              state.pickups.push({
                id: pId++,
                x: e.x + (Math.random() - 0.5) * 12,
                y: e.y + (Math.random() - 0.5) * 12,
                z: 6,
                vz: 30 + Math.random() * 20,
                kind: isCurrency ? 'scrap' : 'item',
                itemId: drop.itemId,
                value: 1,
                color: isCurrency ? '#ffd27d' : dropDef?.iconColor || '#77c7ff',
                t: Math.random() * 5,
              });
            }
          }
        }
      }

      // Canonical Gemstone Drop Table by Enemy / Area / Region (Scaled by Æther Depth 1..clvl+1)
      if (e.faction !== 'poe' && e.faction !== 'npc') {
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
        const baseChance = e.isFogBoss ? 1.0 : dropChanceByEnemy[e.type] ?? 0.25;
        const dropChance = Math.min(1, baseChance * (1 + effDepth * 0.22));
        const pool = resolveContextualGemPool(state, e.type);
        if (Math.random() <= dropChance) {
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
        // Bonus gemstone roll at deep fog tiers or on fog boss kill
        if (e.isFogBoss || (effDepth >= 3 && Math.random() < 0.12 * effDepth)) {
          const bonusGemId = pool[Math.floor(Math.random() * pool.length)];
          const bonusGemDef = getItemDefinition(bonusGemId);
          state.pickups.push({
            id: pId++,
            x: e.x + (Math.random() - 0.5) * 12,
            y: e.y + (Math.random() - 0.5) * 12,
            z: 9,
            vz: 40,
            kind: 'item',
            itemId: bonusGemId,
            value: 1,
            color: bonusGemDef?.iconColor || '#f8fafc',
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

      // Contextual Enemy -> Room -> Area -> Region Equipment & 2nd Copy Drop Roll
      if (e.faction !== 'poe' && e.faction !== 'npc') {
        const enemyEquipConfig = ENEMY_EQUIPMENT_DROP_POOLS[e.type];
        const baseEquipChance = e.isFogBoss
          ? 1.0
          : def?.equipmentDropChance ?? enemyEquipConfig?.baseChance ?? 0.12;
        const scaledEquipChance = Math.min(1, baseEquipChance * (1 + effDepth * 0.25));
        if (Math.random() <= scaledEquipChance) {
          const droppedEquipId = resolveContextualEquipmentDrop(state, {
            enemyType: e.type,
            roomCoord: state.room,
            areaId: state.areaId,
            regionId: state.regionId,
            allowSecondCopy: true,
          });
          if (droppedEquipId) {
            state.pickups.push({
              id: pId++,
              x: e.x + (Math.random() - 0.5) * 8,
              y: e.y + (Math.random() - 0.5) * 8,
              z: 10,
              vz: 42,
              kind: 'item',
              itemId: droppedEquipId,
              value: 1,
              color: '#38bdf8',
              t: Math.random() * 5,
            });
          }
        }
      }

      if (e.faction === 'poe') {
        if (state.level < 2) {
          state.level = 2;
        }
        unlockLevel2SecondaryWeapon(state);
      }

      const defeatedFaction = e.faction;
      const defeatedFogBoss = Boolean(e.isFogBoss);
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
      }

      // Defeating a boss at max Æther fog depth clears the fog and returns the player to the main path
      if (defeatedFogBoss) {
        for (const p of state.pickups) {
          if (p.kind === 'scrap') {
            state.salvageScrap += p.value;
          } else if (p.itemId) {
            addOrionInventoryItem(state, p.itemId, p.value);
          }
        }
        state.pickups = [];
        clearAetherFogOnBossDefeat(rooms, state, ctx);
        break;
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
          const oathMult = hasKnightsOath && e.faction === 'camelot' ? 1.1 : 1.0;
          const opticMult = (state.opticMarkTimer || 0) > 0 ? 1.25 : 1.0;
          const hasBeamFocus =
            p.damageType === 'Beam' &&
            state.equippedFeats.some((f) =>
              ['beam_focus', 'sustained_channeling', 'solar_convergence'].includes(f)
            );
          const beamMult = hasBeamFocus ? 1.15 : 1.0;
          const hasAssassinate =
            state.equippedFeats.some((f) => ['assassinate', 'executioners_gambit'].includes(f)) &&
            e.frame.integrity <= e.frame.maxIntegrity * 0.4;
          const execMult = hasAssassinate ? 1.2 : 1.0;
          const effDamage = Math.round(p.damage * oathMult * opticMult * beamMult * execMult);

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
        const isPerfectBlock = Boolean(
          state.isHoldingBlock && (state.blockHoldTimer || 0) <= PERFECT_BLOCK_WINDOW_SEC
        );
        const isGuarding = Boolean(state.isHoldingBlock || (state.blockTimer || 0) > 0);

        if (isPerfectBlock) {
          soundSystem.playPowerup();
          state.shields.capacity = Math.min(
            state.shields.maxCapacity,
            state.shields.capacity + 10
          );
          state.heat = Math.max(0, state.heat - 8);
          ctx.spawnParticles(state.x, state.y, state.z + 10, 8, '#38bdf8', 'PERFECT BLOCK!');
        } else {
          soundSystem.playHit();
          const finalProjDamage = isGuarding
            ? Math.max(1, Math.round(p.damage * 0.35))
            : p.damage;
          if (isGuarding) {
            ctx.spawnParticles(state.x, state.y, state.z + 8, 4, '#38bdf8', 'BLOCKED');
          }
          applyDamageToLayers(
            state.shields,
            state.armor,
            state.frame,
            finalProjDamage,
            p.damageType,
            (count, color, label) =>
              ctx.spawnParticles(state.x, state.y, state.z + 8, count, color, label)
          );
        }

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

      if (p.kind === 'scrap' || p.itemId === 'trade_coin') {
        state.salvageScrap += p.value || 1;
        ctx.say(`+${p.value || 1} TRADE COINS`);
      } else if (p.itemId) {
        const weaponDef = getWeaponDefinition(p.itemId);
        if (weaponDef) {
          const wasFirstCopy = unlockEquipmentItem(state, weaponDef.id);
          soundSystem.playPowerup();
          ctx.say(
            wasFirstCopy
              ? `SALVAGED ARMAMENT: ${weaponDef.name.toUpperCase()} UNLOCKED!`
              : `SALVAGED 2ND COPY: ${weaponDef.name.toUpperCase()} (PAIRED STANCE)!`
          );
          notifyOrionStateChange();
        } else {
          const itemDef = getItemDefinition(p.itemId);
          if (itemDef?.onCollect) {
            itemDef.onCollect(state, ctx);
          } else {
            addOrionInventoryItem(state, p.itemId, 1);
            ctx.say(`SALVAGED: ${itemDef?.name || p.itemId}`);
          }
        }
      }

      state.pickups.splice(i, 1);
    }
  }
}
