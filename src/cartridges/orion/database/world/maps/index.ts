/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../types';

// Recursive auto-discovery for global and hierarchy-nested local map modules
const globalModules = import.meta.glob<Record<string, unknown>>('./global/**/*.ts', { eager: true });
const localModules = import.meta.glob<Record<string, unknown>>('./local/**/*.ts', { eager: true });

export const GLOBAL_MAP_REGISTRY: Record<string, MapDefinition> = {};
export const LOCAL_MAP_REGISTRY: Record<string, MapDefinition> = {};
export const MAP_REGISTRY: Record<string, MapDefinition> = {};

function isMapDefinition(val: unknown): val is MapDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'scope' in val &&
    'localRoomCoords' in val &&
    'globalRoomSlots' in val
  );
}

for (const mod of Object.values(globalModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isMapDefinition(exportedValue)) {
      GLOBAL_MAP_REGISTRY[exportedValue.id] = exportedValue;
      MAP_REGISTRY[exportedValue.id] = exportedValue;
    }
  }
}

for (const mod of Object.values(localModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isMapDefinition(exportedValue)) {
      LOCAL_MAP_REGISTRY[exportedValue.id] = exportedValue;
      MAP_REGISTRY[exportedValue.id] = exportedValue;
    }
  }
}

export function getMapDefinition(mapId?: string): MapDefinition | undefined {
  if (mapId && MAP_REGISTRY[mapId]) {
    return MAP_REGISTRY[mapId];
  }
  return MAP_REGISTRY.map_bog_drop_zone;
}
