/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { TILE_SIZE } from '../constants';
import { getBiomeDefinition, getTileDefinition } from '../database/world';
import { notifyOrionStateChange } from '../stateStore';
import { OrionCombatContext, OrionState } from '../types';
import { spawnEnemyByType } from './enemySystem';

let corrosionParticleTimer = 0;

/**
 * Determine whether a Desynchronizing Wall (%) is currently phased solid (intact)
 * or phased open (ruined) according to the active Biome's tileRules.desyncPeriodSec.
 */
export function isDesyncWallSolid(state: OrionState): boolean {
  const biome = getBiomeDefinition(state.biomeId);
  const period = Math.max(1.0, biome.tileRules?.desyncPeriodSec || 3.5);
  return Math.floor(state.t / period) % 2 === 0;
}

/**
 * Update environmental hazards across the current room using the active Biome's tileRules:
 * - Corrosive Water (~): Eats Layer 2 Armor Durability on BOTH the player and
 *   any non-aquatic enemy standing in it when biome.tileRules.corrosiveWater is true.
 */
export function updateEnvironmentalHazards(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  const roomData = rooms[state.room];
  if (!roomData) return;

  const biome = getBiomeDefinition(state.biomeId);
  const isBiomeCorrosive = biome.tileRules?.corrosiveWater ?? true;
  const corrosionRate = biome.tileRules?.corrosiveDamagePerSec ?? 5.0;

  corrosionParticleTimer -= dt;
  let spawnedCorrosionParticle = false;

  // 1. Player standing in Corrosive Water (~)
  if (isBiomeCorrosive && state.z <= 0 && !state.isFallingIntoPit) {
    const ptx = Math.floor(state.x / TILE_SIZE);
    const pty = Math.floor(state.y / TILE_SIZE);
    const pChar = roomData[pty]?.[ptx] || '.';
    const pTile = getTileDefinition(pChar, state.biomeId);

    if (pTile.isCorrosive && state.armor.durability > 0) {
      state.armor.durability = Math.max(0, state.armor.durability - corrosionRate * dt);
      if (corrosionParticleTimer <= 0) {
        ctx.spawnParticles(state.x, state.y, 4, 2, '#84cc16', 'CORROSION');
        spawnedCorrosionParticle = true;
      }
    }
  }

  // 2. Enemies standing in Corrosive Water (~)
  // ("It eats armor, and it does not care who is standing in it. That includes the things hunting you.")
  if (isBiomeCorrosive) {
    for (const e of state.enemies) {
      if (e.z > 2 || e.isFlying) continue;
      // The Bog Wurm and Lady of the Lake are native to the bog water
      if (e.type === 'bog_wurm' || e.type === 'lady_of_the_lake') continue;

      const etx = Math.floor(e.x / TILE_SIZE);
      const ety = Math.floor(e.y / TILE_SIZE);
      const eChar = roomData[ety]?.[etx] || '.';
      const eTile = getTileDefinition(eChar, state.biomeId);

      if (eTile.isCorrosive && e.armor.durability > 0) {
        e.armor.durability = Math.max(0, e.armor.durability - (corrosionRate + 1.5) * dt);
        if (corrosionParticleTimer <= 0) {
          ctx.spawnParticles(e.x, e.y, 4, 2, '#a3e635', 'ARMOR CORRODED');
          spawnedCorrosionParticle = true;
        }
      }
    }
  }

  if (spawnedCorrosionParticle) {
    corrosionParticleTimer = 0.75;
  }
}

/**
 * Trigger a dynamic Orc Raid in Camelot Border Town:
 * - War horn alert & red screen pulse
 * - Exit back to the Bog is sealed until the raid is dealt with
 * - Every NPC goes feral; Orcs target NPCs before targeting the pilot
 * - Saving NPCs increments state.flags.town_trust
 */
export function triggerOrcRaid(state: OrionState, ctx?: OrionCombatContext): void {
  state.flags = state.flags || {};
  state.flags.orc_raid_active = true;
  state.flickerTimer = 1.0;

  // Turn existing room NPCs feral
  let npcCount = 0;
  for (const e of state.enemies) {
    if (e.type === 'town_npc') {
      e.npcDisposition = 'feral';
      e.faction = 'npc'; // Keep faction 'npc' so Orcs prioritize them while NPCs also lash out
      npcCount++;
    }
  }

  // Ensure townsfolk are present if triggered in an empty street so raid defense can be tested
  if (npcCount === 0) {
    spawnEnemyByType(state, 'town_npc', 52, 56, {
      npcDisposition: 'feral',
      faction: 'npc',
      name: 'Panicked Town Citizen',
    });
    spawnEnemyByType(state, 'town_npc', 104, 88, {
      npcDisposition: 'feral',
      faction: 'npc',
      name: 'Panicked Town Merchant',
    });
  }

  // Spawn Orc Raid Pair (Warrior + Scout)
  spawnEnemyByType(state, 'orc_warrior', 32, 36);
  spawnEnemyByType(state, 'orc_scout', 124, 36);

  soundSystem.playExplosion();
  const msg = 'WAR HORN! ORC RAID — BOG EXIT SEALED & NPCS FERAL!';
  if (ctx) {
    ctx.say(msg);
  } else {
    state.toastText = msg;
    state.toastTimer = 3.0;
  }
  notifyOrionStateChange();
}

/**
 * Challenge all Three Knights (Percival, Tristan, Bors) simultaneously for the Knight's Oath feat.
 */
export function triggerThreeKnightsTrial(state: OrionState, ctx?: OrionCombatContext): void {
  state.flags = state.flags || {};
  state.flags.knights_pulled_together = true;

  // Remove any existing single knights to avoid duplicates before spawning the trio
  state.enemies = state.enemies.filter(
    (e) =>
      e.type !== 'percival_knight' &&
      e.type !== 'tristan_knight' &&
      e.type !== 'bors_knight'
  );

  spawnEnemyByType(state, 'percival_knight', 44, 42);
  spawnEnemyByType(state, 'tristan_knight', 116, 42);
  spawnEnemyByType(state, 'bors_knight', 80, 34);

  soundSystem.playCharge();
  const msg = 'THE THREE KNIGHTS ENGAGED AT ONCE — KNIGHT’S OATH TRIAL!';
  if (ctx) {
    ctx.say(msg);
  } else {
    state.toastText = msg;
    state.toastTimer = 3.0;
  }
  notifyOrionStateChange();
}

/**
 * Awaken the Lady of the Lake in the Bog water once Bedivere's Numbered List is complete (3/3).
 */
export function awakenLadyOfTheLake(state: OrionState, ctx?: OrionCombatContext): boolean {
  state.flags = state.flags || {};
  const existing = state.enemies.some((e) => e.type === 'lady_of_the_lake');
  if (existing) return false;

  spawnEnemyByType(state, 'lady_of_the_lake', 80, 64);
  soundSystem.playPowerup();
  const msg = 'THE WATER ANSWERS BEDIVERE’S LIST — LADY OF THE LAKE AWAKENED!';
  if (ctx) {
    ctx.say(msg);
  } else {
    state.toastText = msg;
    state.toastTimer = 3.2;
  }
  notifyOrionStateChange();
  return true;
}
