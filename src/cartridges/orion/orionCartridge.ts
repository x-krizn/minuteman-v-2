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
  DIR_VECTORS,
  getDirFromVector,
  JUMP_VELOCITY,
  MUD_SPEED_PENALTY,
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
  notifyOrionStateChange,
  setOrionStateRef,
} from './stateStore';
import {
  checkWorldInteractivePrompt,
  executeWorldInteraction,
  handleWorldRoomTransition,
  rebootAtSpawnAnchor,
  syncStateGates,
  updateTutorialSystem,
} from './systems';
import { OrionCombatContext, OrionState } from './types';
import { OrionGameMenu, OrionHud, OrionSatchel } from './ui';

export function createOrionCartridge(): Cartridge {
  const rooms: Record<string, string[]> = { ...ORION_INITIAL_ROOMS };

  const defaultTrait = TRAIT_REGISTRY.Warrior;

  const state: OrionState = {
    areaId: 'm00_the_bog',
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

    // Multi-Domain State Gates
    tutorialActive: true,
    tutorialStep: 'drop_pod_boot',
    bypassProgressionGates: false,
    flags: {},
    spawnAnchor: {
      areaId: 'm00_the_bog',
      room: '0,0',
      x: 48,
      y: 72,
    },

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

  syncStateGates(state);
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

  return {
    id: 'orion',
    name: 'ORION: BELLDOR EXPEDITION',
    version: '1.0.0',
    description:
      'A 2.5D action-adventure Metroid-Souls RPG with Golden Sun baked perspective, 8-way traversal, Three Defense Layers, and orbital drop-pod Belldor lore.',

    init(_surface: CartridgeSurface) {
      syncStateGates(state);
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

        // Once fallen deep into the abyss (z <= -35) -> Reboot at active Spawn Anchor
        if (state.z <= -35) {
          soundSystem.playExplosion();
          state.flickerTimer = 0.6;
          rebootAtSpawnAnchor(
            rooms,
            state,
            combatCtx,
            'FELL INTO ABYSSAL SINKHOLE · FRAME DESTROYED'
          );
        }

        updateParticles(state, dt);
        return; // Bypass normal player controls while plummeting
      }

      // Check player defeat: Frame Integrity collapses -> Reboot at active Spawn Anchor
      if (state.frame.integrity <= 0) {
        soundSystem.playExplosion();
        state.flickerTimer = 0.6;
        rebootAtSpawnAnchor(
          rooms,
          state,
          combatCtx,
          'FRAME DESTROYED · PILOT REBOOTED AT ANCHOR'
        );
        return;
      }

      // Pause when menu is active
      if (currentMenuMode !== 'none') {
        return;
      }

      // Sync active capability gates
      const gates = syncStateGates(state);

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

      // 2. Booster Kit Dash (B button) - governed by capability gate
      if (p.b) {
        if (gates.canBoosterDash && state.boosterCooldown <= 0) {
          state.isBoosterDashing = true;
          state.boosterTimer = BOOSTER_DASH_DURATION;
          state.boosterCooldown = BOOSTER_DASH_COOLDOWN;
          state.heat = Math.min(state.maxHeat, state.heat + BOOSTER_HEAT_COST);

          const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
          state.boosterDirX = moveDx !== 0 || moveDy !== 0 ? state.faceX : dirInfo.dx;
          state.boosterDirY = moveDx !== 0 || moveDy !== 0 ? state.faceY : dirInfo.dy;
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
        } else if (!gates.canBoosterDash) {
          soundSystem.playMenuBeep();
          combatCtx.say('BOOSTER KIT OFFLINE — SALVAGE FALLEN SCOUT [S]');
          notifyOrionStateChange();
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
          const didInteract = executeWorldInteraction(rooms, state, combatCtx);
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
            b: false, // Handled above with gate check and exhaust particles
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

      // 6. Isolated Tutorial System (active ONLY when state.tutorialActive === true)
      updateTutorialSystem(state, combatCtx, dt);

      // 7. Seamless World Room Transitions
      handleWorldRoomTransition(rooms, state, combatCtx);

      // 8. Contextual World Interactive Prompts
      checkWorldInteractivePrompt(rooms, state);
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
