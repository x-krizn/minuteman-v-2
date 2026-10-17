/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { COLS, DIR_VECTORS, ROWS, TILE_SIZE } from '../constants';
import { AREA_REGISTRY } from '../database/areas/m00_the_bog';
import {
  ORION_CACHE_DEFINITIONS,
  ORION_ROOM_METADATA,
} from '../database/world/maps/tutorial';
import { spawnRoomEnemies } from '../enemies';
import {
  addOrionInventoryItem,
  notifyOrionStateChange,
  saveOrionGame,
} from '../stateStore';
import { OrionCombatContext, OrionState } from '../types';
import { syncStateGates } from './stateSystem';
import {
  getTutorialPromptOverride,
  handleTutorialAnchorInteraction,
} from './tutorialSystem';

/**
 * Retrieve structured display metadata for the pilot's current room and area
 * from the world database.
 */
export function getRoomWorldInfo(state: OrionState): {
  roomTitle: string;
  bannerTitle: string;
  areaName: string;
  worldName: string;
} {
  const meta = ORION_ROOM_METADATA[state.room];
  const areaId = meta?.areaId || state.areaId || 'm00_the_bog';
  const areaDef = AREA_REGISTRY[areaId] || AREA_REGISTRY.m00_the_bog;

  return {
    roomTitle: meta?.title || `Sector [${state.rx}, ${state.ry}]`,
    bannerTitle: meta?.bannerTitle || `${areaDef.name.toUpperCase()} [${state.rx},${state.ry}]`,
    areaName: areaDef.name,
    worldName: areaDef.world,
  };
}

/**
 * Reboot the pilot's mech at the active Spawn Anchor (state.spawnAnchor),
 * restoring all Three Defense Layers and purging reactor heat.
 */
export function rebootAtSpawnAnchor(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  reasonToast: string
): void {
  state.frame.integrity = state.frame.maxIntegrity || 200;
  state.frame.state = 'Operational';
  state.armor.durability = state.armor.maxDurability;
  state.shields.capacity = state.shields.maxCapacity;
  state.shields.overloaded = false;
  state.heat = 0;
  state.ammo = state.maxAmmo;
  state.isReloading = false;
  state.isFallingIntoPit = false;
  state.isBoosterDashing = false;
  state.onGround = true;

  const anchor = state.spawnAnchor || { areaId: 'm00_the_bog', room: '0,0', x: 48, y: 72 };
  const [rxStr, ryStr] = anchor.room.split(',');
  state.areaId = anchor.areaId;
  state.room = anchor.room;
  state.rx = Number(rxStr) || 0;
  state.ry = Number(ryStr) || 0;
  state.x = anchor.x;
  state.y = anchor.y;
  state.z = 0;
  state.vz = 0;

  ctx.say(reasonToast);
  spawnRoomEnemies(rooms, state);
  syncStateGates(state);
  notifyOrionStateChange();
}

/**
 * Evaluate contextual interactive prompts for anchors/setpieces in the current room.
 * Consults tutorialSystem only when state.tutorialActive is true.
 */
export function checkWorldInteractivePrompt(
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  const tx = Math.floor(state.x / TILE_SIZE);
  const ty = Math.floor(state.y / TILE_SIZE);

  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
  const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);

  const roomData = rooms[state.room];
  if (!roomData) {
    state.promptText = null;
    return;
  }

  const currentTile = roomData[ty]?.[tx] || '.';
  const facingTile = roomData[ay]?.[ax] || '.';

  let candidateKey: string | null = null;
  let candidateText: string | null = null;

  // 1. White Spawn Anchor: Drop-Pod Crater (D)
  if (currentTile === 'D' || facingTile === 'D') {
    candidateKey = `${state.room}:D`;
    candidateText = '[A] SYNC SPAWN ANCHOR · PURGE HEAT & REPAIR';
  } else if (facingTile === 'S' || currentTile === 'S') {
    // 2. Magenta Micro-Setpiece: Fallen Scout (S)
    const scoutKey = `scout:${state.room}`;
    candidateKey = `${state.room}:${scoutKey}`;
    const tutorialOverride = getTutorialPromptOverride(state, 'S');
    if (tutorialOverride) {
      candidateText = tutorialOverride;
    } else if (!state.lootedCaches[scoutKey]) {
      candidateText = '[A] SALVAGE FALLEN SCOUT (KHOPESH & BOOSTER)';
    } else {
      candidateText = 'FALLEN CAMELOT SCOUT (SALVAGED)';
    }
  } else if (facingTile === 'C') {
    // 3. Supply / Scavenger Cache (C)
    const cacheKey = `${state.room}:${ax},${ay}`;
    candidateKey = `${state.room}:${cacheKey}`;
    if (!state.lootedCaches[cacheKey]) {
      candidateText = '[A] LOOT SCAVENGER CACHE';
    } else {
      candidateText = 'SCAVENGER CACHE (EMPTY)';
    }
  } else if (facingTile === 'G' || currentTile === 'G') {
    // 4. Blue Transition Anchor: Perimeter Gate (G)
    const isUnlocked = Boolean(state.unlockedGates[state.room]);
    if (!isUnlocked) {
      candidateKey = `${state.room}:gate`;
      const hasKey = state.inventorySlots.some((s) => s.itemId === 'rusted_gate_key');
      candidateText = hasKey
        ? '[A] UNLOCK PERIMETER GATE'
        : 'LOCKED GATE · REQUIRES RUSTED GATE KEY';
    }
  }

  if (candidateKey) {
    if (state.dismissedPromptKey === candidateKey) {
      state.promptText = null;
      return;
    }
    state.promptText = candidateText;
  } else {
    state.promptText = null;
    state.dismissedPromptKey = null;
  }
}

/**
 * Execute an interaction with an anchor or setpiece tile in the world.
 * Delegates to tutorialSystem when state.tutorialActive is true, otherwise executes standard world logic.
 */
export function executeWorldInteraction(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext
): boolean {
  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
  const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);
  const tx = Math.floor(state.x / TILE_SIZE);
  const ty = Math.floor(state.y / TILE_SIZE);

  const roomData = rooms[state.room];
  if (!roomData) return false;

  const currentTile = roomData[ty]?.[tx] || '.';
  const facingTile = roomData[ay]?.[ax] || '.';

  // 1. White Spawn Anchor: Drop-Pod Crater (D)
  if (currentTile === 'D' || facingTile === 'D') {
    // Dynamically bind spawnAnchor to this room and position
    state.spawnAnchor = {
      areaId: state.areaId,
      room: state.room,
      x: Math.round(state.x),
      y: Math.round(state.y),
    };
    state.frame.integrity = state.frame.maxIntegrity || 200;
    state.frame.state = 'Operational';
    state.armor.durability = state.armor.maxDurability;
    state.shields.capacity = state.shields.maxCapacity;
    state.shields.overloaded = false;
    state.heat = 0;
    state.ammo = state.maxAmmo;
    state.isReloading = false;
    saveOrionGame(state);
    soundSystem.playHeal();
    ctx.say('SPAWN ANCHOR SYNCED · SYSTEMS REBOOTED (SAVED)');
    notifyOrionStateChange();
    return true;
  }

  // 2. Magenta Micro-Setpiece: Fallen Scout (S)
  if (facingTile === 'S' || currentTile === 'S') {
    if (handleTutorialAnchorInteraction(state, ctx, 'S')) {
      return true;
    }

    const scoutKey = `scout:${state.room}`;
    if (!state.lootedCaches[scoutKey]) {
      state.lootedCaches[scoutKey] = true;
      state.hasBoosterKit = true;
      if (!state.equippedWeapons.includes('khopesh')) {
        state.equippedWeapons.push('khopesh');
      }
      addOrionInventoryItem(state, 'bedivere_ring', 1);
      addOrionInventoryItem(state, 'repair_kit', 1);
      syncStateGates(state);
      soundSystem.playPowerup();
      ctx.say('SALVAGED: SCOUT KHOPESH & BOOSTER KIT');
      notifyOrionStateChange();
      return true;
    }
  }

  // 3. Supply / Scavenger Cache (C)
  if (facingTile === 'C') {
    const cacheKey = `${state.room}:${ax},${ay}`;
    if (!state.lootedCaches[cacheKey]) {
      state.lootedCaches[cacheKey] = true;
      soundSystem.playPowerup();

      const cacheDef = ORION_CACHE_DEFINITIONS[state.room] || ORION_CACHE_DEFINITIONS.default;
      state.salvageScrap += cacheDef.scrap;
      for (const item of cacheDef.items) {
        addOrionInventoryItem(state, item.itemId, item.count);
      }
      ctx.say(cacheDef.toast);
      notifyOrionStateChange();
      return true;
    }
  }

  // 4. Blue Transition Anchor: Perimeter Gate (G)
  if (facingTile === 'G' || currentTile === 'G') {
    if (state.unlockedGates[state.room]) return false;

    const keySlotIndex = state.inventorySlots.findIndex((s) => s.itemId === 'rusted_gate_key');
    if (keySlotIndex >= 0) {
      state.inventorySlots[keySlotIndex].count -= 1;
      if (state.inventorySlots[keySlotIndex].count <= 0) {
        state.inventorySlots.splice(keySlotIndex, 1);
      }
      state.unlockedGates[state.room] = true;
      state.clearedRooms[state.room] = true;

      // Open 'G' gate tiles in the current room
      const curRoom = rooms[state.room];
      if (curRoom) {
        rooms[state.room] = curRoom.map((r) => r.replace(/G/g, '.'));
      }

      soundSystem.playPowerup();
      ctx.say('PERIMETER GATE UNLOCKED · BORDER TOWN ACCESS');
      notifyOrionStateChange();
      return true;
    } else {
      soundSystem.playMenuBeep();
      ctx.say('GATE LOCKED: DEFEAT GUARDIAN OR FIND KEY');
      return true;
    }
  }

  return false;
}

/**
 * Handle seamless room boundary transitions and area updates.
 */
export function handleWorldRoomTransition(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext
): void {
  const roomW = COLS * TILE_SIZE;
  const roomH = ROWS * TILE_SIZE;

  let transitioned = false;

  // East transition
  if (state.x >= roomW) {
    const nextRx = state.rx + 1;
    const nextKey = `${nextRx},${state.ry}`;
    if (rooms[nextKey]) {
      state.rx = nextRx;
      state.room = nextKey;
      state.x = 8;
      state.y = Math.max(84, Math.min(108, state.y));
      transitioned = true;
    } else {
      state.x = roomW - 4;
    }
  } else if (state.x < 0) {
    // West transition
    const nextRx = state.rx - 1;
    const nextKey = `${nextRx},${state.ry}`;
    if (rooms[nextKey]) {
      state.rx = nextRx;
      state.room = nextKey;
      state.x = roomW - 8;
      state.y = Math.max(84, Math.min(108, state.y));
      transitioned = true;
    } else {
      state.x = 4;
    }
  }

  // North transition
  if (state.y < 0) {
    const nextRy = state.ry - 1;
    const nextKey = `${state.rx},${nextRy}`;
    if (rooms[nextKey]) {
      state.ry = nextRy;
      state.room = nextKey;
      state.y = roomH - 8;
      state.x = Math.max(68, Math.min(92, state.x));
      transitioned = true;
    } else {
      state.y = 4;
    }
  } else if (state.y >= roomH) {
    // South transition
    const nextRy = state.ry + 1;
    const nextKey = `${state.rx},${nextRy}`;
    if (rooms[nextKey]) {
      state.ry = nextRy;
      state.room = nextKey;
      state.y = 8;
      state.x = Math.max(68, Math.min(92, state.x));
      transitioned = true;
    } else {
      state.y = roomH - 4;
    }
  }

  if (transitioned) {
    state.projectiles = [];
    state.pickups = [];

    const meta = ORION_ROOM_METADATA[state.room];
    if (meta?.areaId) {
      state.areaId = meta.areaId;
    }

    spawnRoomEnemies(rooms, state);
    soundSystem.playSelect();
    const info = getRoomWorldInfo(state);
    ctx.say(info.bannerTitle);
    notifyOrionStateChange();
  }
}

