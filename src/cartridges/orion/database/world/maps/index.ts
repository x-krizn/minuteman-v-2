/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export interface OrionRoomMetadata {
  title: string;
  bannerTitle: string;
  areaId: string;
}

export interface OrionCacheDefinition {
  scrap: number;
  items: Array<{ itemId: string; count: number }>;
  toast: string;
}

// Auto-discover all room modules in this directory via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./*.ts', { eager: true });

export const ROOM_REGISTRY: Record<string, RoomDefinition> = {};
export const ORION_TUTORIAL_ROOMS: Record<string, string[]> = {};
export const ORION_ROOM_METADATA: Record<string, OrionRoomMetadata> = {};
export const ORION_CACHE_DEFINITIONS: Record<string, OrionCacheDefinition> = {
  default: {
    scrap: 20,
    items: [{ itemId: 'grail_water', count: 1 }],
    toast: 'LOOTED: +20 SCRAP & GRAIL WATER',
  },
};

function isRoomDefinition(val: unknown): val is RoomDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'coord' in val &&
    'grid' in val &&
    'areaId' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isRoomDefinition(exportedValue)) {
      ROOM_REGISTRY[exportedValue.coord] = exportedValue;
      ORION_TUTORIAL_ROOMS[exportedValue.coord] = exportedValue.grid;
      ORION_ROOM_METADATA[exportedValue.coord] = {
        title: exportedValue.title,
        bannerTitle: exportedValue.bannerTitle,
        areaId: exportedValue.areaId,
      };
      if (exportedValue.cache) {
        ORION_CACHE_DEFINITIONS[exportedValue.coord] = exportedValue.cache;
      }
    }
  }
}

export const ORION_INITIAL_ROOMS = ORION_TUTORIAL_ROOMS;
