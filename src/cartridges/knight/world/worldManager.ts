/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { AreaDefinition, AreaRuntimeState, AreaTransition, KnightState } from '../types';
import { getAreaDefinition } from '../database/areas';
import { buildFloor } from './proceduralFloor';
import { loadAreaBitmaps } from './bitmapParser';
import { resolveStuck } from '../physics';

/**
 * World Manager handles:
 * 1. Stringing together static and dynamic areas.
 * 2. Caching and persisting area states so players can return to previously visited areas.
 * 3. Bidirectional transitions (doors, stairs, boundaries).
 */

export function getOrCreateAreaRuntime(
  areaId: string,
  state: KnightState
): AreaRuntimeState {
  if (!state.areaStates) {
    state.areaStates = {};
  }

  // If already visited and cached, return the persisted state
  if (state.areaStates[areaId]) {
    return state.areaStates[areaId];
  }

  const def = getAreaDefinition(areaId);
  if (!def) {
    throw new Error(`Area definition not found: ${areaId}`);
  }

  const runtime: AreaRuntimeState = {
    areaId: def.id,
    rooms: {},
    greenRooms: {},
    safeRooms: {},
    visitedRooms: {},
    cleared: false,
  };

  if (def.type === 'static') {
    // Deep copy authored static rooms
    runtime.rooms = JSON.parse(JSON.stringify(def.rooms));
    runtime.greenRooms = { ...(def.greenRooms || {}) };
    runtime.safeRooms = { ...(def.safeRooms || {}) };

    // Load any committed repository PNG bitmaps
    if (def.bitmapRooms) {
      loadAreaBitmaps(def).then((loaded) => {
        Object.assign(runtime.rooms, loaded);
      });
    }
  } else if (def.type === 'dynamic') {
    // Generate procedural dynamic floor
    buildFloor(state, runtime.rooms, runtime.greenRooms, runtime.safeRooms);

    // Place a return entrance '<' in the start cell if returning to a previous area is supported
    if (state.floor && typeof state.floor === 'object') {
      const f = state.floor as {
        x0: number;
        y0: number;
        start: [number, number];
      };
      const startKey = `${f.x0 + f.start[0]},${f.y0 + f.start[1]}`;
      const startRoom = runtime.rooms[startKey];
      if (startRoom) {
        // Place return staircase / arch at (7, 1) in the starting room
        runtime.rooms[startKey] = startRoom.map((row, y) =>
          y === 7 ? row.slice(0, 1) + '<' + row.slice(2) : row
        );
      }
    }
  }

  state.areaStates[areaId] = runtime;
  return runtime;
}

/**
 * Saves current room state into active area cache
 */
export function syncActiveAreaCache(
  state: KnightState,
  activeRooms: Record<string, string[]>,
  activeGreen: Record<string, number>,
  activeSafe: Record<string, number>
): void {
  const currentId = state.currentAreaId || 'tutorial';
  if (!state.areaStates) {
    state.areaStates = {};
  }

  state.areaStates[currentId] = {
    areaId: currentId,
    rooms: { ...activeRooms },
    greenRooms: { ...activeGreen },
    safeRooms: { ...activeSafe },
    visitedRooms: state.areaStates[currentId]?.visitedRooms || {},
    cleared: state.areaStates[currentId]?.cleared || false,
    metadata: state.areaStates[currentId]?.metadata,
  };
}

/**
 * Seamlessly transition the player between areas
 */
export function transitionToArea(
  state: KnightState,
  transition: AreaTransition,
  activeRooms: Record<string, string[]>,
  activeGreen: Record<string, number>,
  activeSafe: Record<string, number>,
  enterRoomFn: (roomKey: string) => void,
  say: (text: string) => void
): void {
  // 1. Persist current area state before leaving
  syncActiveAreaCache(state, activeRooms, activeGreen, activeSafe);

  // 2. Fetch or restore target area runtime state
  const targetRuntime = getOrCreateAreaRuntime(transition.toAreaId, state);

  // 3. Clear and copy target area into active rooms
  Object.keys(activeRooms).forEach((k) => delete activeRooms[k]);
  Object.assign(activeRooms, targetRuntime.rooms);

  Object.keys(activeGreen).forEach((k) => delete activeGreen[k]);
  Object.assign(activeGreen, targetRuntime.greenRooms);

  Object.keys(activeSafe).forEach((k) => delete activeSafe[k]);
  Object.assign(activeSafe, targetRuntime.safeRooms);

  // 4. Update state tracking
  state.currentAreaId = transition.toAreaId;

  // Resolve target room coordinates
  let targetRoomKey = transition.toRoom;
  if (targetRoomKey === 'start' && state.floor && typeof state.floor === 'object') {
    const f = state.floor as { x0: number; y0: number; start: [number, number] };
    targetRoomKey = `${f.x0 + f.start[0]},${f.y0 + f.start[1]}`;
  }

  // 5. Position player
  state.x = transition.toPosition.x;
  state.y = transition.toPosition.y;
  state.vx = 0;
  state.vy = 0;
  state.warpCooldown = 1.0; // 1-second immunity from re-triggering transitions immediately

  // 6. Enter target room
  enterRoomFn(targetRoomKey);

  // 6b. Ensure player is completely un-stuck from any boundary tiles
  resolveStuck(activeRooms, state);

  // 7. Area display banner & sound
  const targetDef = getAreaDefinition(transition.toAreaId);
  const areaName = targetDef?.name || transition.toAreaId.toUpperCase();
  say(transition.trigger.prompt ? `${transition.trigger.prompt}: ${areaName}` : areaName);
  soundSystem.playUnlock();

  if (transition.onTransition) {
    transition.onTransition(state);
  }
}

/**
 * Checks for interactive doors/stairs/portals connecting areas
 */
export function checkDoorTransition(
  state: KnightState,
  tileChar: string,
  activeRooms: Record<string, string[]>,
  activeGreen: Record<string, number>,
  activeSafe: Record<string, number>,
  enterRoomFn: (roomKey: string) => void,
  say: (text: string) => void
): boolean {
  const currentAreaId = state.currentAreaId || 'tutorial';
  const areaDef = getAreaDefinition(currentAreaId);
  if (!areaDef) return false;

  // Find transition matching current area, current room (or dynamic 'start'/'door'), and tile
  const trans = areaDef.transitions.find((t) => {
    if (t.trigger.type !== 'door' && t.trigger.type !== 'portal') return false;
    if (t.trigger.tileChar && t.trigger.tileChar !== tileChar) return false;

    // Check room match: either explicit room key or dynamic 'start'/'door' alias
    if (t.fromRoom === state.room) return true;
    if (t.fromRoom === 'start' && state.floor && typeof state.floor === 'object') {
      const f = state.floor as { x0: number; y0: number; start: [number, number] };
      const startKey = `${f.x0 + f.start[0]},${f.y0 + f.start[1]}`;
      if (startKey === state.room) return true;
    }
    if (t.fromRoom === 'door' && state.floor && typeof state.floor === 'object') {
      const f = state.floor as { x0: number; y0: number; door: [number, number] };
      const doorKey = `${f.x0 + f.door[0]},${f.y0 + f.door[1]}`;
      if (doorKey === state.room) return true;
    }

    return false;
  });

  if (!trans) return false;

  // Check key requirement
  if (trans.trigger.keyRequired) {
    if (state.keys <= 0) {
      say('LOCKED DOOR: REQUIRES KEY (🗝️)');
      soundSystem.playMenuBeep();
      return false;
    }
    state.keys--;
    state.got[`${state.room}:${tileChar}`] = true;
    // Replace locked tile 'L' with empty passage '.'
    const roomRows = activeRooms[state.room];
    if (roomRows) {
      activeRooms[state.room] = roomRows.map((row) =>
        row.includes(tileChar) ? row.replace(tileChar, '.') : row
      );
    }
  }

  transitionToArea(
    state,
    trans,
    activeRooms,
    activeGreen,
    activeSafe,
    enterRoomFn,
    say
  );
  return true;
}
