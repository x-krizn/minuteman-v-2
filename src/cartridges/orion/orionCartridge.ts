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
import { TRAIT_LIST } from './database/characters';
import {
  applyTraitLineProfile,
  checkWorldInteractivePrompt,
  createInitialOrionState,
  createNewPilotGame,
  drawOrionGame,
  handleCombatInput,
  handleWorldRoomTransition,
  loadPilotFromRoster,
  loadPilotRoster,
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
import { OrionCombatContext, OrionState, TraitLine } from './types';
import { OrionGameMenu, OrionHud, OrionSatchel } from './ui';

const DEFAULT_CALLSIGNS: Record<TraitLine, string> = {
  Warrior: 'Pilot Vane',
  Marauder: 'Pilot Kael',
  Guardian: 'Pilot Seraph',
  Rogue: 'Pilot Nyx',
  Wizard: 'Pilot Soren',
  Cleric: 'Pilot Lyra',
};

export function createOrionCartridge(): Cartridge {
  const rooms: Record<string, string[]> = { ...ORION_TUTORIAL_ROOMS };
  const state: OrionState = createInitialOrionState();

  syncRoomHierarchyState(state);
  syncStateGates(state);
  setOrionRoomsRef(rooms);
  setOrionStateRef(state);

  let currentMenuMode: CartridgeMenuMode = 'none';
  let titleMenuBootGuard = 0.35;

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
      state.atTitleMenu = true;
      titleMenuBootGuard = 0.35;
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

      // While on the boot Main Menu / Pilot Creation screen, animate ambient world and handle gamepad selection
      if (state.atTitleMenu) {
        updateParticles(state, dt);
        if (titleMenuBootGuard > 0) {
          titleMenuBootGuard = Math.max(0, titleMenuBootGuard - dt);
          return;
        }
        const isTypingInput =
          typeof document !== 'undefined' &&
          document.activeElement?.tagName === 'INPUT';
        if (!isTypingInput) {
          const p = input.pressed;
          const traitIds = TRAIT_LIST.map((t) => t.id);
          const curIdx = Math.max(0, traitIds.indexOf(state.traitLine));

          if (p.left || p.up) {
            const nextTrait =
              traitIds[(curIdx + traitIds.length - 1) % traitIds.length];
            const isDefaultCallsign = Object.values(DEFAULT_CALLSIGNS).includes(
              state.pilotName
            );
            applyTraitLineProfile(state, nextTrait);
            if (isDefaultCallsign) {
              state.pilotName = DEFAULT_CALLSIGNS[nextTrait];
            }
            soundSystem.playMenuBeep();
          } else if (p.right || p.down) {
            const nextTrait = traitIds[(curIdx + 1) % traitIds.length];
            const isDefaultCallsign = Object.values(DEFAULT_CALLSIGNS).includes(
              state.pilotName
            );
            applyTraitLineProfile(state, nextTrait);
            if (isDefaultCallsign) {
              state.pilotName = DEFAULT_CALLSIGNS[nextTrait];
            }
            soundSystem.playMenuBeep();
          } else if (p.a) {
            createNewPilotGame(
              state,
              state.traitLine,
              state.pilotName || DEFAULT_CALLSIGNS[state.traitLine]
            );
            soundSystem.playPowerup();
          } else if (p.y) {
            const roster = loadPilotRoster();
            if (roster.length > 0 && loadPilotFromRoster(state, roster[0].pilotId)) {
              soundSystem.playPowerup();
            }
          }
        }
        return;
      }

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
            r: h.r,
            l: h.l,
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
