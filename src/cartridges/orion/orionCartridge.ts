/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../engine/core/soundSystem';
import {
  Cartridge,
  CartridgeMenuMode,
  CartridgeOverlayProps,
  CartridgeSurface,
} from '../../types/cartridge';
import { GameInput } from '../../types/input';
import { handleCombatInput, updateCombat } from './combat';
import {
  BOOSTER_DASH_COOLDOWN,
  BOOSTER_DASH_DURATION,
  BOOSTER_HEAT_COST,
  BOOSTER_SPEED,
  COLS,
  DIR_VECTORS,
  getDirFromVector,
  JUMP_VELOCITY,
  MUD_SPEED_PENALTY,
  ROWS,
  SCREEN_H,
  SCREEN_W,
  TILE_SIZE,
  WALK_SPEED,
} from './constants';
import { TRAIT_REGISTRY } from './database/characters/trait_lines';
import { ORION_INITIAL_ROOMS } from './database/world';
import { spawnRoomEnemies, updateEnemies } from './enemies';
import { spawnParticles, updateParticles } from './particles';
import { moveEntityX, moveEntityY, updateElevationPhysics } from './physics';
import { updatePickups } from './pickups';
import { drawOrionGame } from './renderer';
import { updateProjectiles } from './skills';
import {
  addOrionInventoryItem,
  notifyOrionStateChange,
  saveOrionGame,
  setOrionStateRef,
} from './stateStore';
import { OrionCombatContext, OrionState } from './types';
import { OrionGameMenu, OrionHud, OrionSatchel } from './ui';

export function createOrionCartridge(): Cartridge {
  const rooms: Record<string, string[]> = { ...ORION_INITIAL_ROOMS };

  const defaultTrait = TRAIT_REGISTRY.Warrior;

  const state: OrionState = {
    room: '0,0',
    rx: 0,
    ry: 0,

    x: 48,
    y: 72,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    onGround: true,
    dir: 'S',
    faceX: 0,
    faceY: 1,
    t: 0,

    // Pilot & Trait Line Identity (Belldor Expedition)
    pilotName: 'Pilot Vane',
    traitLine: 'Warrior',
    reactor: defaultTrait.reactor,

    // Level & Progression
    level: 1,
    heat: 0,
    maxHeat: 100,
    energy: 100,
    maxEnergy: 100,

    // The Three Defense Layers
    shields: {
      type: defaultTrait.baseShield.type,
      capacity: defaultTrait.baseShield.capacity,
      maxCapacity: defaultTrait.baseShield.capacity,
      overloaded: false,
      overloadTimer: 0,
      rechargeDelay: 0,
    },
    armor: {
      type: defaultTrait.baseArmor.type,
      threshold: defaultTrait.baseArmor.threshold,
      rating: defaultTrait.baseArmor.rating,
      durability: defaultTrait.baseArmor.durability,
      maxDurability: defaultTrait.baseArmor.durability,
    },
    frame: {
      integrity: 200,
      maxIntegrity: 200,
      state: 'Operational',
    },

    // Weapons & Combat
    equippedWeapons: ['gladius_boltcaster', 'khopesh'],
    activeWeaponIndex: 0,
    weaponSwapCooldown: 0,

    ammo: 9,
    maxAmmo: 9,
    isReloading: false,
    reloadTimer: 0,
    reloadDuration: 3.15,
    skillCooldowns: [0, 0, 0, 0, 0],

    activeSkillSlot: null,
    skillTellTimer: 0,
    skillActionTimer: 0,

    // Booster Kit mobility
    hasBoosterKit: false,
    isBoosterDashing: false,
    boosterTimer: 0,
    boosterCooldown: 0,
    boosterDirX: 0,
    boosterDirY: 1,

    // Inventory & Currencies
    salvageScrap: 0,
    inventorySlots: [{ itemId: 'repair_kit', count: 2 }],
    equippedFeats: [],

    // World & APW Setpieces
    clearedRooms: {},
    lootedCaches: {},
    unlockedGates: {},
    incursionEnabled: true,

    // Entities
    enemies: [],
    pickups: [],
    projectiles: [],
    particles: [],

    toastText: 'M00: THE BOG — DROP-POD REBOOT',
    toastTimer: 3.5,
    promptText: null,
    flickerTimer: 0,
    useStandardResolutionHud: true,
    isFallingIntoPit: false,
    dismissedPromptKey: null,
  };

  setOrionStateRef(state);

  let currentMenuMode: CartridgeMenuMode = 'none';

  const combatCtx: OrionCombatContext = {
    state,
    sound: soundSystem,
    spawnParticles: (x, y, z, count, color, label) => {
      spawnParticles(state, x, y, z, count, color, label);
    },
    say: (text: string) => {
      state.toastText = text;
      state.toastTimer = 2.5;
    },
  };

  const ROOM_TITLES: Record<string, string> = {
    '0,0': 'M00: DROP-POD CRATER (SPAWN ANCHOR)',
    '1,0': 'FALLEN SCOUT RIDGE (MICRO-SETPIECE)',
    '1,-1': 'SUNKEN SINKHOLE ISLAND (SECRET)',
    '2,0': 'MARSH SINKHOLE CROSSINGS',
    '3,0': 'PERIMETER FORTIFICATION · SIR BORS',
    '4,0': 'BORDER TOWN SLUMS OUTSKIRTS',
  };

  function checkInteractivePrompt(): void {
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

    // 1. Drop-Pod Crater (White Spawn Anchor)
    if (currentTile === 'D' || facingTile === 'D') {
      candidateKey = `${state.room}:D`;
      candidateText = '[A] REBOOT SYSTEMS · PURGE HEAT & REPAIR';
    } else if (facingTile === 'S' || currentTile === 'S') {
      // 2. Fallen Scout (Magenta Micro-Setpiece)
      const scoutKey = `scout:${state.room}`;
      candidateKey = `${state.room}:${scoutKey}`;
      if (!state.lootedCaches[scoutKey]) {
        candidateText = '[A] SALVAGE FALLEN SCOUT (KHOPESH & BOOSTER)';
      } else {
        candidateText = 'FALLEN CAMELOT SCOUT (SALVAGED)';
      }
    } else if (facingTile === 'C') {
      // 3. Scavenger Cache
      const cacheKey = `${state.room}:${ax},${ay}`;
      candidateKey = `${state.room}:${cacheKey}`;
      if (!state.lootedCaches[cacheKey]) {
        candidateText = '[A] LOOT SCAVENGER CACHE';
      } else {
        candidateText = 'SCAVENGER CACHE (EMPTY)';
      }
    } else if (facingTile === 'G' || currentTile === 'G') {
      // 4. Perimeter Fortification Gate (Blue Transition Anchor)
      const isUnlocked = Boolean(state.unlockedGates[state.room]);
      if (!isUnlocked) {
        candidateKey = `${state.room}:gate`;
        const hasKey = state.inventorySlots.some((s) => s.itemId === 'rusted_gate_key');
        candidateText = hasKey
          ? '[A] UNLOCK PERIMETER GATE'
          : 'LOCKED GATE · REQUIRES RUSTED GATE KEY';
      }
    }

    // Check if dismissed to prevent screen clutter
    if (candidateKey) {
      if (state.dismissedPromptKey === candidateKey) {
        state.promptText = null;
        return;
      }
      state.promptText = candidateText;
    } else {
      // Stepped away from interactive object
      state.promptText = null;
      state.dismissedPromptKey = null;
    }
  }

  function handleInteraction(): boolean {
    const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
    const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
    const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);
    const tx = Math.floor(state.x / TILE_SIZE);
    const ty = Math.floor(state.y / TILE_SIZE);

    const roomData = rooms[state.room];
    if (!roomData) return false;

    // 1. Drop-Pod Crater (White Spawn Anchor)
    if (roomData[ty]?.[tx] === 'D' || roomData[ay]?.[ax] === 'D') {
      state.frame.integrity = 200;
      state.frame.state = 'Operational';
      state.armor.durability = state.armor.maxDurability;
      state.shields.capacity = state.shields.maxCapacity;
      state.shields.overloaded = false;
      state.heat = 0;
      state.ammo = state.maxAmmo;
      state.isReloading = false;
      saveOrionGame(state);
      soundSystem.playHeal();
      combatCtx.say('SYSTEMS REBOOTED · THERMAL PURGED (SAVED)');
      notifyOrionStateChange();
      return true;
    }

    // 2. Fallen Scout (Magenta Micro-Setpiece)
    if (roomData[ay]?.[ax] === 'S' || roomData[ty]?.[tx] === 'S') {
      const scoutKey = `scout:${state.room}`;
      if (!state.lootedCaches[scoutKey]) {
        state.lootedCaches[scoutKey] = true;
        state.hasBoosterKit = true;
        if (state.level < 2) state.level = 2; // Unlocks Legs & Booster Kit

        // Grant Scout Khopesh & Signet Ring
        if (!state.equippedWeapons.includes('khopesh')) {
          state.equippedWeapons.push('khopesh');
        }
        addOrionInventoryItem(state, 'bedivere_ring', 1);
        addOrionInventoryItem(state, 'repair_kit', 1);

        soundSystem.playPowerup();
        combatCtx.say('SALVAGED: SCOUT KHOPESH & BOOSTER KIT (LVL 2 UNLOCKED)');
        notifyOrionStateChange();
        return true;
      }
    }

    // 3. Scavenger Cache
    if (roomData[ay]?.[ax] === 'C') {
      const cacheKey = `${state.room}:${ax},${ay}`;
      if (!state.lootedCaches[cacheKey]) {
        state.lootedCaches[cacheKey] = true;
        soundSystem.playPowerup();

        if (state.room === '1,-1') {
          state.salvageScrap += 35;
          addOrionInventoryItem(state, 'corrupted_shard', 1);
          addOrionInventoryItem(state, 'repair_kit', 2);
          combatCtx.say('LOOTED: +35 SCRAP, CORRUPTED SHARD, REPAIR KITS');
        } else {
          state.salvageScrap += 20;
          addOrionInventoryItem(state, 'grail_water', 1);
          combatCtx.say('LOOTED: +20 SCRAP & GRAIL WATER');
        }
        notifyOrionStateChange();
        return true;
      }
    }

    // 4. Perimeter Fortification Gate (Blue Transition Anchor)
    if (roomData[ay]?.[ax] === 'G' || roomData[ty]?.[tx] === 'G') {
      if (state.unlockedGates[state.room]) return false;

      const keySlotIndex = state.inventorySlots.findIndex((s) => s.itemId === 'rusted_gate_key');
      if (keySlotIndex >= 0) {
        state.inventorySlots[keySlotIndex].count -= 1;
        if (state.inventorySlots[keySlotIndex].count <= 0) {
          state.inventorySlots.splice(keySlotIndex, 1);
        }
        state.unlockedGates[state.room] = true;
        state.clearedRooms[state.room] = true;

        // Open 'G' tiles in current room
        const curRoom = rooms[state.room];
        if (curRoom) {
          rooms[state.room] = curRoom.map((r) => r.replace(/G/g, '.'));
        }

        soundSystem.playPowerup();
        combatCtx.say('PERIMETER GATE UNLOCKED · BORDER TOWN ACCESS');
        notifyOrionStateChange();
        return true;
      } else {
        soundSystem.playMenuBeep();
        combatCtx.say('GATE LOCKED: DEFEAT SIR BORS FOR KEY');
        return true;
      }
    }

    return false;
  }

  function handleRoomTransition(): void {
    let transitioned = false;

    // East transition
    if (state.x >= SCREEN_W) {
      const nextRx = state.rx + 1;
      const nextKey = `${nextRx},${state.ry}`;
      if (rooms[nextKey]) {
        state.rx = nextRx;
        state.room = nextKey;
        // Place safely inside new room and clamp Y to doorway corridor (rows 5-6)
        state.x = 8;
        state.y = Math.max(84, Math.min(108, state.y));
        transitioned = true;
      } else {
        state.x = SCREEN_W - 4;
      }
    } else if (state.x < 0) {
      // West transition
      const nextRx = state.rx - 1;
      const nextKey = `${nextRx},${state.ry}`;
      if (rooms[nextKey]) {
        state.rx = nextRx;
        state.room = nextKey;
        state.x = SCREEN_W - 8;
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
        state.y = SCREEN_H - 8;
        state.x = Math.max(68, Math.min(92, state.x)); // Center X in doorway (cols 4-5)
        transitioned = true;
      } else {
        state.y = 4;
      }
    } else if (state.y >= SCREEN_H) {
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
        state.y = SCREEN_H - 4;
      }
    }

    if (transitioned) {
      state.projectiles = [];
      spawnRoomEnemies(rooms, state);
      soundSystem.playSelect();
      const title = ROOM_TITLES[state.room] || `M00: ROOM ${state.room}`;
      combatCtx.say(title);
      notifyOrionStateChange();
    }
  }

  return {
    id: 'orion',
    name: 'ORION: BELLDOR EXPEDITION',
    version: '1.0.0',
    description:
      'A 2.5D action-adventure Metroid-Souls RPG with Golden Sun baked perspective, 8-way traversal, Three Defense Layers, and orbital drop-pod Belldor lore.',

    init(surface: CartridgeSurface) {
      spawnRoomEnemies(rooms, state);
      setOrionStateRef(state);
    },

    onMenuToggle(menuMode: CartridgeMenuMode) {
      currentMenuMode = menuMode;
    },

    update(input: GameInput, dtSeconds: number) {
      const dt = Math.min(0.05, dtSeconds);
      state.t += dt;

      // Update toast timer
      if (state.toastTimer > 0) {
        state.toastTimer -= dt;
      }

      // 0. Abyssal Sinkhole / Pit Falling & Death
      if (state.isFallingIntoPit) {
        state.isBoosterDashing = false;
        updateElevationPhysics(rooms, state, dt);

        // Spawn void abyss particles
        if (Math.random() < 0.6) {
          state.particles.push({
            x: state.x + (Math.random() - 0.5) * 8,
            y: state.y + (Math.random() - 0.5) * 6,
            z: state.z,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            vz: -15,
            life: 0.3,
            maxLife: 0.3,
            color: '#090d14',
            size: 2,
            fade: true,
          });
        }

        // Once fallen deep into the abyss (z <= -35) -> Cause death!
        if (state.z <= -35) {
          soundSystem.playExplosion();
          state.frame.integrity = 200;
          state.frame.state = 'Operational';
          state.armor.durability = state.armor.maxDurability;
          state.shields.capacity = state.shields.maxCapacity;
          state.shields.overloaded = false;
          state.heat = 0;
          state.ammo = state.maxAmmo;
          state.isReloading = false;
          state.isFallingIntoPit = false;
          state.flickerTimer = 0.6;

          // Reboot at drop-pod crater (spawn anchor)
          state.room = '0,0';
          state.rx = 0;
          state.ry = 0;
          state.x = 48;
          state.y = 72;
          state.z = 0;
          state.vz = 0;
          state.onGround = true;

          combatCtx.say('FELL INTO ABYSSAL SINKHOLE · FRAME DESTROYED');
          spawnRoomEnemies(rooms, state);
          notifyOrionStateChange();
        }

        updateParticles(state, dt);
        return; // Bypass normal player controls while plummeting
      }

      // Check player defeat: Frame Integrity collapses
      if (state.frame.integrity <= 0) {
        soundSystem.playExplosion();
        state.frame.integrity = 200;
        state.frame.state = 'Operational';
        state.armor.durability = state.armor.maxDurability;
        state.shields.capacity = state.shields.maxCapacity;
        state.shields.overloaded = false;
        state.heat = 0;
        state.ammo = state.maxAmmo;
        state.isReloading = false;

        // Reboot at drop-pod crater
        state.room = '0,0';
        state.rx = 0;
        state.ry = 0;
        state.x = 48;
        state.y = 72;
        state.z = 0;
        state.vz = 0;
        combatCtx.say('FRAME DESTROYED · PILOT REBOOTED AT DROP-POD');
        spawnRoomEnemies(rooms, state);
        notifyOrionStateChange();
        return;
      }

      // Pause when menu is active
      if (currentMenuMode !== 'none') {
        return;
      }

      // 1. Directional Movement & Input
      const p = input.pressed;
      const h = input.held;
      const stick = input.stick;

      let moveDx = 0;
      let moveDy = 0;

      if (h.left || stick.x < -0.2) moveDx -= 1;
      if (h.right || stick.x > 0.2) moveDx += 1;
      if (h.up || stick.y < -0.2) moveDy -= 1;
      if (h.down || stick.y > 0.2) moveDy += 1;

      if (moveDx !== 0 || moveDy !== 0) {
        const norm = Math.hypot(moveDx, moveDy) || 1;
        state.faceX = moveDx / norm;
        state.faceY = moveDy / norm;
        state.dir = getDirFromVector(moveDx, moveDy);
      }

      // 2. Booster Kit Dash (B button)
      if (p.b && state.hasBoosterKit && state.boosterCooldown <= 0) {
        state.isBoosterDashing = true;
        state.boosterTimer = BOOSTER_DASH_DURATION;
        state.boosterCooldown = BOOSTER_DASH_COOLDOWN;
        state.heat = Math.min(state.maxHeat, state.heat + BOOSTER_HEAT_COST);

        const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
        state.boosterDirX = (moveDx !== 0 || moveDy !== 0) ? state.faceX : dirInfo.dx;
        state.boosterDirY = (moveDx !== 0 || moveDy !== 0) ? state.faceY : dirInfo.dy;
        soundSystem.playDash();

        // Booster exhaust particles
        for (let i = 0; i < 4; i++) {
          state.particles.push({
            x: state.x - state.boosterDirX * 6 + (Math.random() - 0.5) * 4,
            y: state.y - state.boosterDirY * 6 + (Math.random() - 0.5) * 4,
            z: state.z + 4,
            vx: -state.boosterDirX * 30 + (Math.random() - 0.5) * 10,
            vy: -state.boosterDirY * 30 + (Math.random() - 0.5) * 10,
            vz: 4,
            life: 0.25,
            maxLife: 0.25,
            color: '#77c7ff',
            size: 2,
            fade: true,
          });
        }
      }

      // Execute Movement
      if (state.isBoosterDashing) {
        state.boosterTimer -= dt;
        const step = BOOSTER_SPEED * dt;
        state.x = moveEntityX(rooms, state, state.x, state.y, state.z, state.boosterDirX * step);
        state.y = moveEntityY(rooms, state, state.x, state.y, state.z, state.boosterDirY * step);

        if (state.boosterTimer <= 0) {
          state.isBoosterDashing = false;
        }
      } else if (moveDx !== 0 || moveDy !== 0) {
        // Check if standing in deep bog mud
        const tx = Math.floor(state.x / TILE_SIZE);
        const ty = Math.floor(state.y / TILE_SIZE);
        const curChar = rooms[state.room]?.[ty]?.[tx] || '.';
        const inMud = curChar === '~' && state.z <= 0;
        const speed = WALK_SPEED * (inMud ? MUD_SPEED_PENALTY : 1.0);

        const stepX = state.faceX * speed * dt;
        const stepY = state.faceY * speed * dt;

        state.x = moveEntityX(rooms, state, state.x, state.y, state.z, stepX);
        state.y = moveEntityY(rooms, state, state.x, state.y, state.z, stepY);
      }

      // Update 2.5D vertical height z physics (including pit detection)
      updateElevationPhysics(rooms, state, dt);

      // If stepping or landing caused a pit fall, abort jump and combat
      if (state.isFallingIntoPit) {
        state.isBoosterDashing = false;
        return;
      }

      // 3. Jump (A button), Examine Interaction, or Close Pop-up Message
      if (p.a && !state.isBoosterDashing) {
        const tx = Math.floor(state.x / TILE_SIZE);
        const ty = Math.floor(state.y / TILE_SIZE);
        const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
        const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
        const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);
        const roomData = rooms[state.room];
        const facingTile = roomData?.[ay]?.[ax] || '.';
        const currentTileKey = `${state.room}:${tx},${ty}:${facingTile}`;

        // If an active pop-up toast message is displayed, pressing A closes it immediately!
        if (state.toastText && state.toastTimer > 0) {
          state.toastText = null;
          state.toastTimer = 0;
          state.promptText = null;
          state.dismissedPromptKey = currentTileKey;
          soundSystem.playSelect();
          notifyOrionStateChange();
        } else {
          const didInteract = handleInteraction();
          if (didInteract) {
            state.dismissedPromptKey = currentTileKey;
            soundSystem.playSelect();
            notifyOrionStateChange();
          } else if (state.promptText) {
            // Dismiss informative prompt cleanly
            state.promptText = null;
            state.dismissedPromptKey = currentTileKey;
            soundSystem.playSelect();
            notifyOrionStateChange();
          } else if (state.onGround) {
            // Elevation leap across sinkhole/chasm
            state.vz = JUMP_VELOCITY;
            state.onGround = false;
            soundSystem.playJump();
          }
        }
      }

      // 4. Combat & Moveset Handling (X, Y, L, R)
      handleCombatInput(
        {
          pressed: {
            a: p.a,
            b: p.b,
            x: p.x,
            y: p.y,
            l: p.l,
            r: p.r,
            select: p.select,
          },
          held: {
            x: h.x,
            y: h.y,
            b: h.b,
          },
        },
        state,
        combatCtx,
        dt
      );
      updateCombat(state, combatCtx, dt);

      // 5. Update Systems: Enemies, Projectiles, Pickups, Particles
      updateEnemies(rooms, state, combatCtx, dt);
      updateProjectiles(rooms, state, combatCtx, dt);
      updatePickups(state, combatCtx, dt);
      updateParticles(state, dt);

      // 6. Seamless Room Transitions
      handleRoomTransition();

      // 7. Contextual Interactive Prompts
      checkInteractivePrompt();
    },

    draw(surface: CartridgeSurface) {
      drawOrionGame(surface.g, rooms, state);
    },

    renderOverlay(props: CartridgeOverlayProps) {
      if (props.menuMode === 'game-menu') {
        return React.createElement(OrionGameMenu, {
          soundEnabled: props.soundEnabled,
          scanlinesEnabled: props.scanlinesEnabled,
          onToggleSound: props.onToggleSound,
          onToggleScanlines: props.onToggleScanlines,
          onResume: props.onResume,
          onExitCartridge: props.onExitCartridge,
          isFullscreen: props.isFullscreen,
          onToggleFullscreen: props.onToggleFullscreen,
          connectedGamepads: props.connectedGamepads,
        });
      }

      if (props.menuMode === 'inventory') {
        return React.createElement(OrionSatchel, { onResume: props.onResume });
      }

      if (props.menuMode === 'none') {
        return React.createElement(OrionHud);
      }

      return null;
    },
  };
}
