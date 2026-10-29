/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getRoomDimensions, RoomDimensions } from '../constants';
import { OrionState } from '../types';

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

export function getActiveRoomBounds(
  state: OrionState,
  rooms?: Record<string, string[]> | null
): RoomDimensions {
  const mapRef = rooms || orionRoomsRef;
  return getRoomDimensions(mapRef?.[state.room]);
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
