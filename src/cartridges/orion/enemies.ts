/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { TILE_SIZE } from './constants';
import { getEnemyDefinition } from './database/enemies';
import { addOrionInventoryItem, notifyOrionStateChange } from './stateStore';
import { EnemyEntity, OrionCombatContext, OrionState } from './types';

let nextEnemyId = 1;

const CHAR_TO_ENEMY_TYPE: Record<string, string> = {
  E: 'bog_crawler',
  o: 'orc_warrior',
  s: 'orc_scout',
  W: 'bog_wurm',
  p: 'bog_poe',
  N: 'town_npc',
  K: 'percival_knight',
  T: 'tristan_knight',
  B: 'bors_knight',
};

export function spawnEnemyByType(
  state: OrionState,
  type: string,
  x: number,
  y: number,
  overrides?: Partial<EnemyEntity>
): EnemyEntity | null {
  const def = getEnemyDefinition(type);
  if (!def) return null;

  let faction: EnemyEntity['faction'] = 'hostile';
  if (type === 'bog_poe') faction = 'poe';
  else if (type === 'town_npc') faction = 'npc';
  else if (type === 'orc_warrior' || type === 'orc_scout') faction = 'orc';
  else if (
    type === 'percival_knight' ||
    type === 'tristan_knight' ||
    type === 'bors_knight'
  ) {
    faction = 'camelot';
  }

  const emissiveMap: Record<string, string> = {
    bog_crawler: '#ffd27d',
    orc_warrior: '#fb923c',
    orc_scout: '#fdba74',
    bog_wurm: '#38bdf8',
    bog_poe: '#7dd3fc',
    town_npc: '#94a3b8',
    percival_knight: '#60a5fa',
    tristan_knight: '#4ade80',
    bors_knight: '#b8a4ff',
    lady_of_the_lake: '#c084fc',
  };

  const entity: EnemyEntity = {
    id: nextEnemyId++,
    type,
    name: def.name,
    x,
    y,
    z: type === 'bog_poe' ? 8 : 0,
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
    tellRadius: type.includes('knight') || type === 'lady_of_the_lake' ? 34 : 26,
    isFlying: type === 'bog_poe',
    emissiveColor: emissiveMap[type] || '#ffd27d',
    faction,
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
  const hadPoe = state.enemies.some((e) => e.type === 'bog_poe' && e.frame.integrity > 0);
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

  let npcIndex = 0;

  for (let y = 0; y < room.length; y++) {
    for (let x = 0; x < room[y].length; x++) {
      const char = room[y][x];
      const type = CHAR_TO_ENEMY_TYPE[char];
      if (!type) continue;

      // Skip Poe if already helped or killed
      if (
        type === 'bog_poe' &&
        (state.flags?.poe_state === 'helped' || state.flags?.poe_state === 'killed')
      ) {
        continue;
      }

      const px = x * TILE_SIZE + 8;
      const py = y * TILE_SIZE + 8;

      if (type === 'town_npc') {
        const dispositions: Array<'calm' | 'linger' | 'feral'> = ['calm', 'linger', 'feral'];
        const disp = dispositions[npcIndex % 3];
        const isLoyalist = npcIndex % 2 === 0;
        npcIndex++;
        spawnEnemyByType(state, 'town_npc', px, py, {
          npcDisposition: disp,
          isLoyalist,
          faction: disp === 'feral' ? 'hostile' : 'npc',
          name: isLoyalist ? `Camelot Loyalist (${disp.toUpperCase()})` : `Town Scavenger (${disp.toUpperCase()})`,
        });
      } else if (type === 'orc_warrior') {
        spawnEnemyByType(state, 'orc_warrior', px, py);
        // Canonical Law: Orcs always come as a Warrior and a Scout pair
        const hasExplicitScout = room.some((r) => r.includes('s'));
        if (!hasExplicitScout) {
          spawnEnemyByType(state, 'orc_scout', Math.min(140, px + 18), Math.max(20, py - 12));
        }
      } else {
        spawnEnemyByType(state, type, px, py);
      }
    }
  }

  // Track if all 3 Knights are present simultaneously in this room for the Knight's Oath feat
  const hasPercival = state.enemies.some((e) => e.type === 'percival_knight');
  const hasTristan = state.enemies.some((e) => e.type === 'tristan_knight');
  const hasBors = state.enemies.some((e) => e.type === 'bors_knight');
  if (hasPercival && hasTristan && hasBors) {
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

      const defeatedType = e.type;
      state.enemies.splice(i, 1);

      state.flags = state.flags || {};

      // 1. Poe Killed Resolution
      if (defeatedType === 'bog_poe') {
        state.flags.poe_state = 'killed';
        state.flags.bog_exit_revealed = true;
        ctx.say('POE DESTROYED · BOG EXIT UNSEALED');
        notifyOrionStateChange();
      }

      // 2. Three Knights Grail Fragment & Knight's Oath Feat Check
      if (
        defeatedType === 'percival_knight' ||
        defeatedType === 'tristan_knight' ||
        defeatedType === 'bors_knight'
      ) {
        const curFrags = Number(state.flags.grail_fragments || 0);
        state.flags.grail_fragments = Math.min(3, curFrags + 1);
        addOrionInventoryItem(state, 'grail_fragment', 1);

        const remainingKnights = state.enemies.filter(
          (rem) =>
            rem.type === 'percival_knight' ||
            rem.type === 'tristan_knight' ||
            rem.type === 'bors_knight'
        );

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

      // 3. Lady of the Lake Secret Boss Defeat
      if (defeatedType === 'lady_of_the_lake') {
        state.flags.lady_of_the_lake_defeated = true;
        soundSystem.playPowerup();
        ctx.say('THE LADY OF THE LAKE HAS BEEN VANQUISHED!');
        notifyOrionStateChange();
      }

      // 4. Orc Raid Completion Check
      if (state.flags.orc_raid_active) {
        const remainingOrcs = state.enemies.filter((rem) => rem.faction === 'orc');
        if (remainingOrcs.length === 0) {
          state.flags.orc_raid_active = false;
          const survivors = Math.max(
            1,
            state.enemies.filter((rem) => rem.type === 'town_npc').length
          );
          const trustGain = state.flags.bedivere_ring_choice === 'taken' ? 1 : survivors;
          state.flags.town_trust = Number(state.flags.town_trust || 0) + trustGain;
          // Calm surviving NPCs after raid
          for (const rem of state.enemies) {
            if (rem.type === 'town_npc' && (!rem.isLoyalist || state.flags.bedivere_ring_choice !== 'taken')) {
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
      if (remainingHostiles.length === 0 && defeatedType !== 'bog_poe') {
        state.clearedRooms[state.room] = true;
        if (!state.toastText || state.toastTimer <= 0) {
          ctx.say('SECTOR SECURED');
        }
      }
    }
  }
}
