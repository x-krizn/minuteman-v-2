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
  checkWorldInteractivePrompt,
  createInitialOrionState,
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
  const state: OrionState = createInitialOrionState();

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
