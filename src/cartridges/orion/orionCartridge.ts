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
import { TRAIT_REGISTRY } from './database/characters';
import {
  checkWorldInteractivePrompt,
  drawOrionGame,
  handleCombatInput,
  handleWorldRoomTransition,
  ORION_TUTORIAL_ROOMS,
  setOrionRoomsRef,
  setOrionStateRef,
  spawnParticles,
  spawnRoomEnemies,
  syncRoomHierarchyState,
  syncStateGates,
  updateCombat,
  updateEnemies,
  updateEnvironmentalHazards,
  updateParticles,
  updatePickups,
  updatePlayerSystem,
  updateProjectiles,
} from './systems';
import { OrionCombatContext, OrionState } from './types';
import { OrionGameMenu, OrionHud, OrionSatchel } from './ui';

export function createOrionCartridge(): Cartridge {
  const rooms: Record<string, string[]> = { ...ORION_TUTORIAL_ROOMS };

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
      if (currentMenuMode !== 'none') return;

      const dt = Math.min(0.05, dtSeconds);
      state.t += dt;

      // 1. Player Controller, 2.5D Physics, Boosters, Jump/Interact, Tutorial & Defeat Reboot
      const canContinue = updatePlayerSystem(input, rooms, state, combatCtx, dt);
      if (!canContinue) return;

      // 2. Combat & Moveset Handling (X, Y, L, R)
      const p = input.pressed;
      const h = input.held;
      handleCombatInput(
        {
          pressed: {
            a: p.a,
            b: false,
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

      // 3. Environmental Hazards, Enemies, Projectiles, Pickups, Particles
      updateEnvironmentalHazards(rooms, state, combatCtx, dt);
      updateEnemies(rooms, state, combatCtx, dt);
      updateProjectiles(rooms, state, combatCtx, dt);
      updatePickups(state, combatCtx, dt);
      updateParticles(state, dt);

      // 4. Seamless World Room Transitions & Contextual Prompts
      handleWorldRoomTransition(rooms, state, combatCtx);
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
