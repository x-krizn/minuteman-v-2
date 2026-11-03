/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getRoomDimensions, RoomDimensions } from '../constants';
import { OrionState } from '../types';

let orionStateRef: OrionState | null = null;
let orionRoomsRef: Record<string, string[]> | null = null;
let onStateChangeListeners: Array<() => void> = [];

/**
 * Binds the active `OrionState` reference into the shared store so React overlays and callbacks can read live state.
 */
export function setOrionStateRef(state: OrionState): void {
  orionStateRef = state;
  notifyOrionStateChange();
}

/**
 * Returns the currently bound `OrionState` reference, or `null` before cartridge initialization.
 */
export function getOrionStateRef(): OrionState | null {
  return orionStateRef;
}

/**
 * Binds the active room ASCII grid dictionary (`Record<string, string[]>`) into the shared store.
 */
export function setOrionRoomsRef(rooms: Record<string, string[]>): void {
  orionRoomsRef = rooms;
}

/**
 * Returns the currently bound room ASCII grid dictionary (`Record<string, string[]>`), or `null`.
 */
export function getOrionRoomsRef(): Record<string, string[]> | null {
  return orionRoomsRef;
}

/**
 * Returns the pixel and tile `RoomDimensions` (`cols`, `rows`, `widthPx`, `heightPx`) for the active room in `state`.
 */
export function getActiveRoomBounds(
  state: OrionState,
  rooms?: Record<string, string[]> | null
): RoomDimensions {
  const mapRef = rooms || orionRoomsRef;
  return getRoomDimensions(mapRef?.[state.room]);
}

/**
 * Subscribes `listener` to state change notifications for React HUD/Satchel re-renders and returns an unsubscribe cleanup callback.
 */
export function subscribeOrionStateChange(listener: () => void): () => void {
  onStateChangeListeners.push(listener);
  return () => {
    onStateChangeListeners = onStateChangeListeners.filter((l) => l !== listener);
  };
}

/**
 * Broadcasts a state change event to all registered React HUD and Satchel subscribers.
 */
export function notifyOrionStateChange(): void {
  for (const listener of onStateChangeListeners) {
    listener();
  }
}

/**
 * Merges duplicate `itemId` entries and strips zero-count stacks from an inventory slot array.
 */
export function consolidateInventorySlots(
  slots: Array<{ itemId: string; count: number }>
): Array<{ itemId: string; count: number }> {
  const map = new Map<string, number>();
  for (const slot of slots) {
    map.set(slot.itemId, (map.get(slot.itemId) || 0) + slot.count);
  }
  return Array.from(map.entries()).map(([itemId, count]) => ({ itemId, count }));
}

/**
 * Adds `count` units of `itemId` to `state.inventorySlots`, consolidating stacks and notifying HUD subscribers. Mutates `state: OrionState`.
 */
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
