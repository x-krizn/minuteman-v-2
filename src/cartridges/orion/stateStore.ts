/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionState } from './types';

let orionStateRef: OrionState | null = null;
let orionRoomsRef: Record<string, string[]> | null = null;
let onStateChangeListeners: Array<() => void> = [];

export function setOrionStateRef(state: OrionState): void {
  orionStateRef = state;
  notifyOrionStateChange();
}

export function getOrionStateRef(): OrionState | null {
  return orionStateRef;
}

export function setOrionRoomsRef(rooms: Record<string, string[]>): void {
  orionRoomsRef = rooms;
}

export function getOrionRoomsRef(): Record<string, string[]> | null {
  return orionRoomsRef;
}

export function subscribeOrionStateChange(listener: () => void): () => void {
  onStateChangeListeners.push(listener);
  return () => {
    onStateChangeListeners = onStateChangeListeners.filter((l) => l !== listener);
  };
}

export function notifyOrionStateChange(): void {
  for (const listener of onStateChangeListeners) {
    listener();
  }
}

export function saveOrionGame(state: OrionState): boolean {
  try {
    const saveData = {
      pilotName: state.pilotName,
      traitLine: state.traitLine,
      reactor: state.reactor,
      level: state.level,
      heat: state.heat,
      energy: state.energy,
      shields: state.shields,
      armor: state.armor,
      frame: state.frame,
      equippedWeapons: state.equippedWeapons,
      activeWeaponIndex: state.activeWeaponIndex,
      assignedActions: state.assignedActions,
      equippedFeats: state.equippedFeats,
      hasBoosterKit: state.hasBoosterKit,
      salvageScrap: state.salvageScrap,
      inventorySlots: state.inventorySlots,
      clearedRooms: state.clearedRooms,
      lootedCaches: state.lootedCaches,
      unlockedGates: state.unlockedGates,
      incursionEnabled: state.incursionEnabled,
      tutorialActive: state.tutorialActive,
      tutorialStep: state.tutorialStep,
      bypassProgressionGates: state.bypassProgressionGates,
      flags: state.flags,
      spawnAnchor: state.spawnAnchor,
      regionId: state.regionId,
      areaId: state.areaId,
      mapId: state.mapId,
      biomeId: state.biomeId,
      discoveredWaystations: state.discoveredWaystations,
      discoveredWaygates: state.discoveredWaygates,
      room: state.room,
      rx: state.rx,
      ry: state.ry,
      x: state.x,
      y: state.y,
    };
    localStorage.setItem('orion_save_slot_canonical', JSON.stringify(saveData));
    return true;
  } catch {
    return false;
  }
}

export function loadOrionGame(state: OrionState): boolean {
  try {
    const raw = localStorage.getItem('orion_save_slot_canonical');
    if (!raw) return false;
    const data = JSON.parse(raw);

    state.pilotName = data.pilotName ?? state.pilotName;
    state.traitLine = data.traitLine ?? state.traitLine;
    state.reactor = data.reactor ?? state.reactor;
    state.level = data.level ?? state.level;
    state.heat = data.heat ?? state.heat;
    state.energy = data.energy ?? state.energy;
    state.shields = data.shields ?? state.shields;
    state.armor = data.armor ?? state.armor;
    state.frame = data.frame ?? state.frame;
    state.equippedWeapons = data.equippedWeapons ?? state.equippedWeapons;
    state.activeWeaponIndex = data.activeWeaponIndex ?? state.activeWeaponIndex;
    if (data.assignedActions && typeof data.assignedActions === 'object') {
      state.assignedActions = { ...state.assignedActions, ...data.assignedActions };
    }
    if (Array.isArray(data.equippedFeats)) {
      state.equippedFeats = data.equippedFeats;
    }
    state.hasBoosterKit = data.hasBoosterKit ?? state.hasBoosterKit;
    state.salvageScrap = data.salvageScrap ?? state.salvageScrap;
    state.inventorySlots = consolidateInventorySlots(data.inventorySlots ?? state.inventorySlots);
    state.clearedRooms = data.clearedRooms ?? state.clearedRooms;
    state.lootedCaches = data.lootedCaches ?? state.lootedCaches;
    state.unlockedGates = data.unlockedGates ?? state.unlockedGates;
    state.incursionEnabled = data.incursionEnabled ?? state.incursionEnabled;
    state.tutorialActive = data.tutorialActive ?? state.tutorialActive;
    state.tutorialStep = data.tutorialStep ?? state.tutorialStep;
    state.bypassProgressionGates = data.bypassProgressionGates ?? state.bypassProgressionGates;
    state.flags = data.flags ?? state.flags;
    state.spawnAnchor = data.spawnAnchor ?? state.spawnAnchor;
    state.regionId = data.regionId ?? state.regionId;
    state.areaId = data.areaId ?? state.areaId;
    state.mapId = data.mapId ?? state.mapId;
    state.biomeId = data.biomeId ?? state.biomeId;
    if (Array.isArray(data.discoveredWaystations)) {
      state.discoveredWaystations = data.discoveredWaystations;
    }
    if (Array.isArray(data.discoveredWaygates)) {
      state.discoveredWaygates = data.discoveredWaygates;
    }
    state.room = data.room ?? state.room;
    state.rx = data.rx ?? state.rx;
    state.ry = data.ry ?? state.ry;
    state.x = data.x ?? state.x;
    state.y = data.y ?? state.y;

    notifyOrionStateChange();
    return true;
  } catch {
    return false;
  }
}

export function consolidateInventorySlots(
  slots: Array<{ itemId: string; count: number }>
): Array<{ itemId: string; count: number }> {
  const map = new Map<string, number>();
  for (const slot of slots) {
    map.set(slot.itemId, (map.get(slot.itemId) || 0) + slot.count);
  }
  return Array.from(map.entries()).map(([itemId, count]) => ({ itemId, count }));
}

export function addOrionInventoryItem(
  state: OrionState,
  itemId: string,
  count: number = 1
): void {
  const existing = state.inventorySlots.find((s) => s.itemId === itemId);
  if (existing) {
    existing.count += count;
  } else {
    state.inventorySlots.push({ itemId, count });
  }
}
