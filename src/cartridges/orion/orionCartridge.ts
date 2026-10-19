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
import { TRAIT_REGISTRY } from './database/characters';
import { getBiomeDefinition, ORION_INITIAL_ROOMS } from './database/world';
import {
  notifyOrionStateChange,
  setOrionRoomsRef,
  setOrionStateRef,
} from './stateStore';
import {
  checkWorldInteractivePrompt,
  cycleTargetLock,
  drawOrionGame,
  executeWorldInteraction,
  handleCombatInput,
  handleWorldRoomTransition,
  moveEntityX,
  moveEntityY,
  performWeaponSwap,
  rebootAtSpawnAnchor,
  spawnParticles,
  spawnRoomEnemies,
  syncRoomHierarchyState,
  syncStateGates,
  updateCombat,
  updateElevationPhysics,
  updateEnemies,
  updateEnvironmentalHazards,
  updateParticles,
  updatePickups,
  updateProjectiles,
  updateTargetLock,
  updateTutorialSystem,
} from './systems';
import { OrionCombatContext, OrionState } from './types';
import { OrionGameMenu, OrionHud, OrionSatchel } from './ui';

const Y_HOLD_SWAP_THRESHOLD_SEC = 0.32;
const B_HOLD_CONTINUOUS_THRESHOLD_SEC = 0.14;
const CONTINUOUS_BOOST_HEAT_PER_SEC = 28;

export function createOrionCartridge(): Cartridge {
  const rooms: Record<string, string[]> = { ...ORION_INITIAL_ROOMS };

  const defaultTrait = TRAIT_REGISTRY.Warrior;

  const state: OrionState = {
    regionId: 'region_belldor_outskirts',
    areaId: 'm00_the_bog',
    mapId: 'map_bog_drop_zone',
    biomeId: 'belldor_bog',
    room: '0,0',
    rx: 0,
    ry: 0,
    discoveredWaystations: ['ws_bog_drop_pod'],
    discoveredWaygates: [],

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
    activeActionId: null,
    skillTellTimer: 0,
    skillActionTimer: 0,

    // Assignable L & R Multi-Source Actions (Default: Weapon Skills 1 & 2)
    assignedActions: {
      L: 'weapon_skill_1',
      R: 'weapon_skill_2',
    },
    actionCooldowns: {},
    overdriveTimer: 0,
    opticMarkTimer: 0,

    // Target Lock-On & Y Hold Weapon Swap
    lockedTargetId: null,
    yHoldTimer: 0,
    yHoldTriggeredSwap: false,
    wasYHeld: false,

    // Booster Kit mobility (Tap Dodge Burst + Hold Continuous Boost)
    hasBoosterKit: false,
    isBoosterDashing: false,
    isContinuousBoosting: false,
    bHoldTimer: 0,
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

    // Multi-Domain State Gates & Belldor Campaign Flags
    tutorialActive: true,
    tutorialStep: 'drop_pod_boot',
    bypassProgressionGates: false,
    flags: {
      poe_state: 'unmet',
      poe_lantern_gift: false,
      bog_exit_revealed: false,
      bedivere_ring_choice: 'unchosen',
      bedivere_list_collected: false,
      bedivere_list_items: 0,
      lady_of_the_lake_defeated: false,
      orc_raid_active: false,
      town_trust: 0,
      grail_fragments: 0,
      dungeon_switches: 0,
      knights_pulled_together: false,
      cathedral_door_open: false,
    },
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

  syncRoomHierarchyState(state);
  syncStateGates(state);
  setOrionRoomsRef(rooms);
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
      syncRoomHierarchyState(state);
      syncStateGates(state);
      spawnRoomEnemies(rooms, state);
      setOrionRoomsRef(rooms);
      setOrionStateRef(state);
    },

    onMenuToggle(menuMode: CartridgeMenuMode) {
      currentMenuMode = menuMode;
    },

    update(input: GameInput, dtSeconds: number) {
      const dt = Math.min(0.05, dtSeconds);
      state.t += dt;

      // 0. Abyssal Sinkhole / Pit Falling & Death
      if (state.isFallingIntoPit) {
        state.isBoosterDashing = false;
        state.isContinuousBoosting = false;
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

      const hasMoveInput = moveDx !== 0 || moveDy !== 0;
      const moveNorm = Math.hypot(moveDx, moveDy) || 1;
      const normMoveX = hasMoveInput ? moveDx / moveNorm : 0;
      const normMoveY = hasMoveInput ? moveDy / moveNorm : 0;

      // Update facing from movement only when NOT locked onto a target
      if (hasMoveInput && state.lockedTargetId === null) {
        state.faceX = normMoveX;
        state.faceY = normMoveY;
        state.dir = getDirFromVector(moveDx, moveDy);
      }

      // 1B. [Y] Button Multi-Function: Tap Y = Lock-On Target, Hold Y (>= 0.32s) = Weapon Swap
      if (h.y) {
        state.yHoldTimer = (state.yHoldTimer || 0) + dt;
        if (state.yHoldTimer >= Y_HOLD_SWAP_THRESHOLD_SEC && !state.yHoldTriggeredSwap) {
          state.yHoldTriggeredSwap = true;
          performWeaponSwap(state, combatCtx);
        }
        state.wasYHeld = true;
      } else {
        if (state.wasYHeld) {
          // Released Y: if held less than threshold, execute Tap Y Target Lock-On!
          if (!state.yHoldTriggeredSwap) {
            cycleTargetLock(state, combatCtx);
          }
          state.yHoldTimer = 0;
          state.yHoldTriggeredSwap = false;
          state.wasYHeld = false;
        }
      }

      // Maintain target lock-on (strafing / auto-facing locked target)
      updateTargetLock(state);

      // 2. [B] Button Dual-Mode Boost:
      // - Tap B: Quick dodge burst
      // - Hold B: Continuous thruster boost until release or overheat (100 Heat)
      if (p.b) {
        state.bHoldTimer = 0;
        if (!gates.canBoosterDash) {
          soundSystem.playMenuBeep();
          combatCtx.say('BOOSTER KIT OFFLINE — SALVAGE FALLEN SCOUT [S]');
          notifyOrionStateChange();
        } else if (state.heat >= state.maxHeat) {
          soundSystem.playMenuBeep();
          combatCtx.say('REACTOR OVERHEATED — VENT HEAT BEFORE BOOSTING');
          notifyOrionStateChange();
        } else if (state.boosterCooldown <= 0) {
          state.isBoosterDashing = true;
          state.boosterTimer = BOOSTER_DASH_DURATION;
          state.boosterCooldown = BOOSTER_DASH_COOLDOWN * 0.65;
          state.heat = Math.min(state.maxHeat, state.heat + BOOSTER_HEAT_COST * 0.7);

          const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
          state.boosterDirX = hasMoveInput ? normMoveX : state.faceX || dirInfo.dx;
          state.boosterDirY = hasMoveInput ? normMoveY : state.faceY || dirInfo.dy;
          soundSystem.playDash();

          // Initial dodge burst exhaust particles
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
      }

      if (h.b && gates.canBoosterDash) {
        state.bHoldTimer = (state.bHoldTimer || 0) + dt;
        if (state.bHoldTimer >= B_HOLD_CONTINUOUS_THRESHOLD_SEC && state.heat < state.maxHeat) {
          state.isContinuousBoosting = true;
          state.isBoosterDashing = true;
          const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
          state.boosterDirX = hasMoveInput ? normMoveX : state.boosterDirX || dirInfo.dx;
          state.boosterDirY = hasMoveInput ? normMoveY : state.boosterDirY || dirInfo.dy;

          state.heat = Math.min(state.maxHeat, state.heat + CONTINUOUS_BOOST_HEAT_PER_SEC * dt);

          // Continuous thruster exhaust stream
          if (Math.random() < 0.75) {
            state.particles.push({
              x: state.x - state.boosterDirX * 6 + (Math.random() - 0.5) * 4,
              y: state.y - state.boosterDirY * 6 + (Math.random() - 0.5) * 4,
              z: state.z + 4,
              vx: -state.boosterDirX * 35 + (Math.random() - 0.5) * 12,
              vy: -state.boosterDirY * 35 + (Math.random() - 0.5) * 12,
              vz: 3,
              life: 0.2,
              maxLife: 0.2,
              color: state.heat > 80 ? '#f97316' : '#38bdf8',
              size: 2,
              fade: true,
            });
          }

          // Cut continuous boost if reactor reaches max heat (100)
          if (state.heat >= state.maxHeat) {
            state.isContinuousBoosting = false;
            state.isBoosterDashing = false;
            state.boosterCooldown = 0.85;
            soundSystem.playMenuBeep();
            combatCtx.say('REACTOR OVERHEAT — CONTINUOUS BOOST CUT!');
            notifyOrionStateChange();
          }
        }
      } else {
        if (state.isContinuousBoosting) {
          state.isContinuousBoosting = false;
          state.isBoosterDashing = false;
        }
        state.bHoldTimer = 0;
      }

      // Execute Movement
      if (state.isBoosterDashing) {
        if (!state.isContinuousBoosting) {
          state.boosterTimer -= dt;
          if (state.boosterTimer <= 0) {
            state.isBoosterDashing = false;
          }
        }
        const boostSpeed = state.isContinuousBoosting ? BOOSTER_SPEED * 0.88 : BOOSTER_SPEED;
        const step = boostSpeed * dt;
        state.x = moveEntityX(rooms, state, state.x, state.y, state.z, state.boosterDirX * step);
        state.y = moveEntityY(rooms, state, state.x, state.y, state.z, state.boosterDirY * step);
      } else if (hasMoveInput) {
        // Check if standing in deep bog mud / water using active Biome's tileRules
        const tx = Math.floor(state.x / TILE_SIZE);
        const ty = Math.floor(state.y / TILE_SIZE);
        const curChar = rooms[state.room]?.[ty]?.[tx] || '.';
        const inMud = curChar === '~' && state.z <= 0;
        const biomeMudMult =
          getBiomeDefinition(state.biomeId).tileRules?.mudSlowMultiplier ?? MUD_SPEED_PENALTY;
        const speed = WALK_SPEED * (inMud ? biomeMudMult : 1.0);

        // Move along normMoveX/normMoveY so pilot can strafe while locked onto a target!
        const stepX = normMoveX * speed * dt;
        const stepY = normMoveY * speed * dt;

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

      // 3. Jump (A button) or Execute Interactive World Anchor (Non-interactive popups never override Jump)
      if (p.a && !state.isBoosterDashing) {
        const tx = Math.floor(state.x / TILE_SIZE);
        const ty = Math.floor(state.y / TILE_SIZE);
        const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
        const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
        const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);
        const roomData = rooms[state.room];
        const facingTile = roomData?.[ay]?.[ax] || '.';
        const currentTileKey = `${state.room}:${tx},${ty}:${facingTile}`;

        const didInteract = executeWorldInteraction(rooms, state, combatCtx);
        if (didInteract) {
          state.dismissedPromptKey = currentTileKey;
          soundSystem.playSelect();
          notifyOrionStateChange();
        } else if (state.onGround) {
          // Elevation leap across sinkhole/chasm (never blocked by non-interactive popups)
          state.vz = JUMP_VELOCITY;
          state.onGround = false;
          soundSystem.playJump();
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

      // 5. Update Systems: Environmental Hazards (Corrosive Bog Water), Enemies, Projectiles, Pickups, Particles
      updateEnvironmentalHazards(rooms, state, combatCtx, dt);
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
