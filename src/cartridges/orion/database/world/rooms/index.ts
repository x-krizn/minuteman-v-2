/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

// Recursive auto-discovery for global and hierarchy-nested local room modules
const globalModules = import.meta.glob<Record<string, unknown>>('./global/**/*.ts', { eager: true });
const localModules = import.meta.glob<Record<string, unknown>>('./local/**/*.ts', { eager: true });

export const GLOBAL_ROOM_REGISTRY: Record<string, RoomDefinition> = {};
export const LOCAL_ROOM_REGISTRY: Record<string, RoomDefinition> = {};
export const LOCAL_ROOM_BY_ID_REGISTRY: Record<string, RoomDefinition> = {};

function isRoomDefinition(val: unknown): val is RoomDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'coord' in val &&
    'grid' in val &&
    'areaId' in val
  );
}

for (const mod of Object.values(globalModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isRoomDefinition(exportedValue)) {
      const id = exportedValue.id || exportedValue.coord;
      GLOBAL_ROOM_REGISTRY[id] = exportedValue;
    }
  }
}

for (const mod of Object.values(localModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isRoomDefinition(exportedValue)) {
      LOCAL_ROOM_REGISTRY[exportedValue.coord] = exportedValue;
      if (exportedValue.id) {
        LOCAL_ROOM_BY_ID_REGISTRY[exportedValue.id] = exportedValue;
      }
    }
  }
}
