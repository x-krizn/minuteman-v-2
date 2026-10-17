/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDirFromVector, TILE_SIZE } from '../../constants';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../types';

/**
 * Helper to find target for Orc Raiders (targets Town NPCs before targeting the Player during Raids)
 */
function getOrcTarget(state: OrionState, self: EnemyEntity): { x: number; y: number; isNpc: boolean; npcEntity?: EnemyEntity } {
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

export const bogCrawlerEnemy: EnemyWikiDefinition = {
  type: 'bog_crawler',
  name: 'Bog Crawler',
  description: 'An aggressive armored arthropod dwelling in the deep mud of M00.',
  lore:
    'Native to the toxic marshes of Belldor, it burrows beneath floating reeds and ambushes passing drop-pod pilots with sudden impact lunges.',
  shields: { type: 'energy', capacity: 0 },
  armor: { type: 'Hardened', threshold: 5, rating: 2, durability: 35 },
  frameIntegrity: 48,
  speed: 28,
  damage: 12,
  damageType: 'Impact',
  tellDurationSec: 0.35,
  attackCooldownSec: 1.8,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 6 },
    { itemId: 'repair_kit', chance: 0.35 },
    { itemId: 'rusted_gate_key', chance: 0.25 },
  ],
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }

    const distToPlayer = Math.hypot(state.x - e.x, state.y - e.y);
    if (e.attackCd > 0) e.attackCd -= dt;

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.2;
        const dx = state.x - e.x;
        const dy = state.y - e.y;
        const norm = Math.hypot(dx, dy) || 1;
        e.x += (dx / norm) * 14;
        e.y += (dy / norm) * 14;
      }
      return;
    }

    if (e.state === 'attack') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'recovery';
        e.stateTimer = 0.4;
      }
      return;
    }

    if (e.state === 'recovery') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'idle';
        e.attackCd = 1.8;
      }
      return;
    }

    if (distToPlayer < 90) {
      const dx = state.x - e.x;
      const dy = state.y - e.y;
      e.dir = getDirFromVector(dx, dy);

      if (distToPlayer <= 26 && e.attackCd <= 0) {
        e.state = 'windup';
        e.stateTimer = this.tellDurationSec;
        return;
      }

      const step = e.speed * dt;
      if (distToPlayer > 18) {
        e.x += (dx / distToPlayer) * step;
        e.y += (dy / distToPlayer) * step;
      }
    } else {
      e.t += dt;
      e.x += Math.cos(e.t * 1.5) * 8 * dt;
      e.y += Math.sin(e.t * 1.5) * 8 * dt;
    }
  },
};

/**
 * STAGE 1 & 2: ORC WARRIOR (Shield-bearing brawler that pairs with an Orc Scout)
 */
export const orcWarriorEnemy: EnemyWikiDefinition = {
  type: 'orc_warrior',
  name: 'Orc Warrior',
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
        e.x += (dx / dist) * 12;
        e.y += (dy / dist) * 12;
        if (target.isNpc && target.npcEntity && dist < 24) {
          target.npcEntity.frame.integrity = Math.max(0, target.npcEntity.frame.integrity - e.damage);
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
      return;
    }

    if (dist > 16) {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
    }
  },
};

/**
 * STAGE 1 & 2: ORC SCOUT (Ranged kiter that slips away to heal when hurt)
 */
export const orcScoutEnemy: EnemyWikiDefinition = {
  type: 'orc_scout',
  name: 'Orc Scout',
  description: 'Ranged skirmisher that stays back, shoots from range, and slips away to heal if hurt.',
  lore:
    'Kill the Scout first, but do not let the Warrior reach you. If wounded and left unpressured, the Scout retreats to patch its frame.',
  shields: { type: 'energy', capacity: 15 },
  armor: { type: 'Ablative', threshold: 3, rating: 1, durability: 25 },
  frameIntegrity: 42,
  speed: 34,
  damage: 10,
  damageType: 'Pierce',
  tellDurationSec: 0.35,
  attackCooldownSec: 2.0,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 7 },
    { itemId: 'repair_kit', chance: 0.45 },
  ],
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

    // Slip away to heal when hurt (<60% HP)
    const isHurtRetreating = e.frame.integrity < e.frame.maxIntegrity * 0.6;
    if (isHurtRetreating && dist < 75) {
      e.x = Math.max(16, Math.min(144, e.x - (dx / dist) * e.speed * 1.1 * dt));
      e.y = Math.max(16, Math.min(128, e.y - (dy / dist) * e.speed * 1.1 * dt));
      // Self-heal while slipping away
      e.frame.integrity = Math.min(e.frame.maxIntegrity, e.frame.integrity + 7 * dt);
      return;
    }

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.15;
        // Fire ranged bolt
        state.projectiles.push({
          x: e.x + (dx / dist) * 8,
          y: e.y + (dy / dist) * 8,
          z: 6,
          vx: (dx / dist) * 115,
          vy: (dy / dist) * 115,
          vz: 0,
          damage: e.damage,
          damageType: 'Pierce',
          isPlayer: false,
          life: 1.1,
          radius: 2.5,
          color: '#fb923c',
          trailColor: '#ea580c',
          lightRadius: 14,
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

    if (dist < 42) {
      // Keep distance
      e.x = Math.max(16, Math.min(144, e.x - (dx / dist) * e.speed * 0.85 * dt));
      e.y = Math.max(16, Math.min(128, e.y - (dy / dist) * e.speed * 0.85 * dt));
    } else if (dist > 88) {
      e.x += (dx / dist) * e.speed * 0.8 * dt;
      e.y += (dy / dist) * e.speed * 0.8 * dt;
    }

    if (dist <= 105 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
    }
  },
};

/**
 * STAGE 1 MINI-BOSS: THE BOG WURM (Submerges invisible in water, strikes first, retreats to heal)
 */
export const bogWurmEnemy: EnemyWikiDefinition = {
  type: 'bog_wurm',
  name: 'The Bog Wurm',
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
    { itemId: 'salvage_scrap', chance: 1.0, count: 30 },
    { itemId: 'corrupted_shard', chance: 1.0, count: 1 },
    { itemId: 'bedivere_relic', chance: 1.0, count: 1 },
  ],
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
    const lanternReveals = Boolean(state.flags?.poe_lantern_gift);

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    if (e.state === 'windup') {
      e.isSubmerged = false; // Surfaces with a tell right before striking
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.25;
        e.x += (dx / dist) * 18;
        e.y += (dy / dist) * 18;
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

    // When hurt, retreats into bog water and submerges to heal
    if (e.frame.integrity < e.frame.maxIntegrity * 0.65 && e.attackCd > 0.4) {
      e.isSubmerged = !lanternReveals;
      e.frame.integrity = Math.min(e.frame.maxIntegrity, e.frame.integrity + 9 * dt);
      e.t += dt * 3;
      e.x = Math.max(20, Math.min(140, e.x + Math.cos(e.t) * e.speed * dt));
      e.y = Math.max(20, Math.min(124, e.y + Math.sin(e.t) * e.speed * dt));
      return;
    }

    // Hide invisible beneath water unless revealed by Poe's Lantern Gift
    e.isSubmerged = onWater && !lanternReveals;

    if (dist <= 34 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      return;
    }

    e.x += (dx / dist) * e.speed * dt;
    e.y += (dy / dist) * e.speed * dt;
  },
};

/**
 * STAGE 1 SPIRIT: THE POE (Floating lantern-spirit in the Bog)
 */
export const bogPoeEntity: EnemyWikiDefinition = {
  type: 'bog_poe',
  name: 'Poe (Lantern Spirit)',
  description: 'A small floating lantern-spirit that manifests where the æther is thick.',
  lore:
    'Helping it back to its lantern earns a gift that reveals the Bog Wurm. Ignoring or killing it also reveals the way out of the bog.',
  shields: { type: 'energy', capacity: 10 },
  armor: { type: 'Ablative', threshold: 1, rating: 0, durability: 10 },
  frameIntegrity: 25,
  speed: 26,
  damage: 0,
  damageType: 'Pulse',
  tellDurationSec: 0.5,
  attackCooldownSec: 2.0,
  lootTable: [{ itemId: 'corrupted_shard', chance: 1.0, count: 1 }],
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    e.t += dt;
    e.z = 8 + Math.sin(e.t * 3.5) * 3;

    if (state.flags?.poe_state === 'following') {
      const dx = state.x - e.x;
      const dy = state.y - 12 - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 14) {
        e.x += (dx / dist) * 42 * dt;
        e.y += (dy / dist) * 42 * dt;
      }
    } else {
      e.x += Math.cos(e.t * 1.6) * 10 * dt;
      e.y += Math.sin(e.t * 1.6) * 10 * dt;
    }
  },
};

/**
 * STAGE 2: BORDER TOWN NPC (Grail Sickness & Loyalist Ring Reaction)
 */
export const townNpcEntity: EnemyWikiDefinition = {
  type: 'town_npc',
  name: 'Border Town Survivor',
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
  lootTable: [{ itemId: 'salvage_scrap', chance: 0.8, count: 5 }],
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    // 1. During an Orc Raid, every NPC goes feral
    if (state.flags?.orc_raid_active) {
      e.npcDisposition = 'feral';
      e.faction = 'hostile';
    }

    // 2. Loyalist reaction to Bedivere's Signet Ring
    if (e.isLoyalist && state.flags?.bedivere_ring_choice === 'taken' && e.npcDisposition !== 'feral') {
      e.npcDisposition = 'feral';
      e.faction = 'hostile';
      e.name = 'Loyalist Avenger (Hostile)';
    }

    // 3. Grail Sickness Linger Check: turns hostile if player lingers within 36px for >2.5s
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

    // Feral combat AI
    if (e.npcDisposition === 'feral') {
      e.dir = getDirFromVector(dx, dy);
      if (e.state === 'windup') {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.state = 'attack';
          e.stateTimer = 0.2;
          e.x += (dx / dist) * 10;
          e.y += (dy / dist) * 10;
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
        return;
      }
      if (dist > 16) {
        e.x += (dx / dist) * e.speed * dt;
        e.y += (dy / dist) * e.speed * dt;
      }
    } else {
      // Calm / Unstable patrol
      e.t += dt;
      e.x += Math.cos(e.t * 1.1) * 5 * dt;
      e.y += Math.sin(e.t * 1.1) * 5 * dt;
    }
  },
};

/**
 * STAGE 2 BOSS 1: SIR PERCIVAL, GRAIL KNIGHT (Guardian shield wall, charge, shield recovery)
 */
export const percivalKnightEnemy: EnemyWikiDefinition = {
  type: 'percival_knight',
  name: 'Sir Percival (Grail Knight)',
  description: 'A defensive Guardian anchor with a directional shield wall and closing charge.',
  lore:
    'Protects his comrades and recovers shields when badly hurt if not relentlessly pressured.',
  shields: { type: 'physical', capacity: 90 },
  armor: { type: 'Hardened', threshold: 9, rating: 6, durability: 90 },
  frameIntegrity: 150,
  speed: 22,
  damage: 19,
  damageType: 'Impact',
  tellDurationSec: 0.5,
  attackCooldownSec: 2.1,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 40 },
    { itemId: 'grail_fragment', chance: 1.0, count: 1 },
  ],
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    // Recovers shields when badly hurt (<50% HP)
    if (e.frame.integrity < e.frame.maxIntegrity * 0.5 && e.hurt <= 0) {
      e.shields.capacity = Math.min(e.shields.maxCapacity, e.shields.capacity + 16 * dt);
    }

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.28;
        // Shield charge closes distance
        e.x = Math.max(16, Math.min(144, e.x + (dx / dist) * 24));
        e.y = Math.max(16, Math.min(128, e.y + (dy / dist) * 24));
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

    if (dist <= 48 && e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
      return;
    }

    if (dist > 20) {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
    }
  },
};

/**
 * STAGE 2 BOSS 2: SIR TRISTAN, CORRUPTED RANGER (Kiting archer, arrow volleys, smoke escape)
 */
export const tristanKnightEnemy: EnemyWikiDefinition = {
  type: 'tristan_knight',
  name: 'Sir Tristan (Corrupted Ranger)',
  description: 'A kiting archer with spread arrow volleys, smoke escapes, and cover-piercing sight.',
  lore:
    'Fragile if caught in close quarters, but punishes any pilot who stands still in the open.',
  shields: { type: 'energy', capacity: 45 },
  armor: { type: 'Ablative', threshold: 4, rating: 2, durability: 45 },
  frameIntegrity: 110,
  speed: 35,
  damage: 15,
  damageType: 'Pierce',
  tellDurationSec: 0.4,
  attackCooldownSec: 1.9,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 40 },
    { itemId: 'grail_fragment', chance: 1.0, count: 1 },
    { itemId: 'bedivere_relic', chance: 1.0, count: 1 },
  ],
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    // Smoke escape if cornered (<30px)
    if (dist < 30 && e.state === 'idle') {
      for (let i = 0; i < 6; i++) {
        state.particles.push({
          x: e.x + (Math.random() - 0.5) * 10,
          y: e.y + (Math.random() - 0.5) * 10,
          z: 6,
          vx: (Math.random() - 0.5) * 25,
          vy: (Math.random() - 0.5) * 25,
          vz: 12,
          life: 0.35,
          maxLife: 0.35,
          color: '#94a3b8',
          size: 3,
          fade: true,
        });
      }
      e.x = state.x > 80 ? 28 : 132;
      e.y = state.y > 72 ? 28 : 116;
      return;
    }

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.2;
        const baseAngle = Math.atan2(dy, dx);
        // 3-arrow spread volley
        for (const offset of [-0.18, 0, 0.18]) {
          const ang = baseAngle + offset;
          state.projectiles.push({
            x: e.x + Math.cos(ang) * 8,
            y: e.y + Math.sin(ang) * 8,
            z: 6,
            vx: Math.cos(ang) * 135,
            vy: Math.sin(ang) * 135,
            vz: 0,
            damage: e.damage,
            damageType: 'Pierce',
            isPlayer: false,
            life: 1.2,
            radius: 2.5,
            color: '#4ade80',
            trailColor: '#16a34a',
            lightRadius: 16,
          });
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

    if (e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
    }
  },
};

/**
 * STAGE 2 BOSS 3: SIR BORS, BERSERK STRIKER (Stacking hit buff + 50% HP Grail Enrage + Lunge)
 */
export const borsKnightEnemy: EnemyWikiDefinition = {
  type: 'bors_knight',
  name: 'Sir Bors (Berserk Striker)',
  description: 'A relentless brawler who grows stronger with every hit and enrages at half health.',
  lore:
    'Gains +10% damage per strike landed; below 50% HP enters Grail Overload with a deadly telegraphed execution lunge.',
  shields: { type: 'physical', capacity: 60 },
  armor: { type: 'Reactive', threshold: 8, rating: 5, durability: 80 },
  frameIntegrity: 160,
  speed: 24,
  damage: 22,
  damageType: 'Impact',
  tellDurationSec: 0.5,
  attackCooldownSec: 2.0,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 50 },
    { itemId: 'grail_fragment', chance: 1.0, count: 1 },
    { itemId: 'rusted_gate_key', chance: 1.0, count: 1 },
    { itemId: 'corrupted_shard', chance: 1.0, count: 1 },
  ],
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    // Enter Grail Enrage below 50% Frame Integrity
    if (e.frame.integrity <= e.frame.maxIntegrity * 0.5 && !e.enraged) {
      e.enraged = true;
      e.speed = 33;
      e.emissiveColor = '#ef4444';
      state.toastText = 'SIR BORS ENRAGED — WATCH FOR KILLING LUNGE!';
      state.toastTimer = 2.2;
    }

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.25;
        // Killing lunge covers extra distance when enraged
        const lungeDist = e.enraged ? 26 : 14;
        e.x = Math.max(12, Math.min(148, e.x + (dx / dist) * lungeDist));
        e.y = Math.max(12, Math.min(132, e.y + (dy / dist) * lungeDist));
      }
      return;
    }

    if (e.state === 'attack') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'idle';
        e.attackCd = e.enraged ? 1.35 : 2.0;
      }
      return;
    }

    if (dist < 110) {
      if (dist <= (e.enraged ? 44 : 32) && e.attackCd <= 0) {
        e.state = 'windup';
        e.stateTimer = this.tellDurationSec;
        return;
      }

      const step = e.speed * dt;
      if (dist > 20) {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
      }
    }
  },
};

/**
 * PART V SECRET BOSS: THE LADY OF THE LAKE (Awakens in Bog water once Bedivere's List is complete)
 */
export const ladyOfTheLakeEnemy: EnemyWikiDefinition = {
  type: 'lady_of_the_lake',
  name: 'The Lady of the Lake',
  description: 'Something half machine and half serpent, an old name twisted by the æther.',
  lore:
    'Whoever collects all items on Bedivere’s numbered list and returns to the bog will find the water has been waiting.',
  shields: { type: 'energy', capacity: 80 },
  armor: { type: 'Reactive', threshold: 8, rating: 5, durability: 95 },
  frameIntegrity: 200,
  speed: 30,
  damage: 24,
  damageType: 'Wave',
  tellDurationSec: 0.55,
  attackCooldownSec: 2.0,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 100 },
    { itemId: 'corrupted_shard', chance: 1.0, count: 3 },
    { itemId: 'grail_water', chance: 1.0, count: 2 },
  ],
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    if (e.stun > 0) {
      e.stun -= dt;
      return;
    }
    if (e.attackCd > 0) e.attackCd -= dt;

    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.dir = getDirFromVector(dx, dy);

    if (e.state === 'windup') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'attack';
        e.stateTimer = 0.3;
        // Unleash radial 5-way æther wave fan
        const baseAngle = Math.atan2(dy, dx);
        for (const offset of [-0.45, -0.22, 0, 0.22, 0.45]) {
          const ang = baseAngle + offset;
          state.projectiles.push({
            x: e.x + Math.cos(ang) * 10,
            y: e.y + Math.sin(ang) * 10,
            z: 8,
            vx: Math.cos(ang) * 125,
            vy: Math.sin(ang) * 125,
            vz: 0,
            damage: e.damage,
            damageType: 'Wave',
            isPlayer: false,
            life: 1.3,
            radius: 3.5,
            color: '#38bdf8',
            trailColor: '#c084fc',
            lightRadius: 24,
          });
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

    e.t += dt;
    e.x = Math.max(20, Math.min(140, e.x + (dx / dist) * e.speed * 0.6 * dt + Math.cos(e.t * 2) * 12 * dt));
    e.y = Math.max(20, Math.min(124, e.y + (dy / dist) * e.speed * 0.6 * dt + Math.sin(e.t * 2) * 12 * dt));

    if (e.attackCd <= 0) {
      e.state = 'windup';
      e.stateTimer = this.tellDurationSec;
    }
  },
};

export const ENEMY_REGISTRY: Record<string, EnemyWikiDefinition> = {
  bog_crawler: bogCrawlerEnemy,
  orc_warrior: orcWarriorEnemy,
  orc_scout: orcScoutEnemy,
  bog_wurm: bogWurmEnemy,
  bog_poe: bogPoeEntity,
  town_npc: townNpcEntity,
  percival_knight: percivalKnightEnemy,
  tristan_knight: tristanKnightEnemy,
  bors_knight: borsKnightEnemy,
  lady_of_the_lake: ladyOfTheLakeEnemy,
};

export function getEnemyDefinition(type: string): EnemyWikiDefinition | undefined {
  return ENEMY_REGISTRY[type];
}
