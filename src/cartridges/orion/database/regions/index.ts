/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegionDefinition, WaygateNode } from '../../types';
import { regionBelldorOutskirts } from './local/region_belldor_outskirts';

// Auto-discover all global and local region modules via Vite import.meta.glob
const globalModules = import.meta.glob<Record<string, unknown>>('./global/*.ts', { eager: true });
const localModules = import.meta.glob<Record<string, unknown>>('./local/*.ts', { eager: true });

export const GLOBAL_REGION_REGISTRY: Record<string, RegionDefinition> = {};
export const LOCAL_REGION_REGISTRY: Record<string, RegionDefinition> = {};
export const REGION_REGISTRY: Record<string, RegionDefinition> = {};
export const WAYGATE_REGISTRY: Record<string, WaygateNode> = {};

function isRegionDefinition(val: unknown): val is RegionDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'scope' in val &&
    'localAreaIds' in val &&
    'globalAreaIds' in val
  );
}

for (const mod of Object.values(globalModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isRegionDefinition(exportedValue)) {
      GLOBAL_REGION_REGISTRY[exportedValue.id] = exportedValue;
      REGION_REGISTRY[exportedValue.id] = exportedValue;
      if (exportedValue.waygate) {
        WAYGATE_REGISTRY[exportedValue.waygate.id] = exportedValue.waygate;
      }
    }
  }
}

for (const mod of Object.values(localModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isRegionDefinition(exportedValue)) {
      LOCAL_REGION_REGISTRY[exportedValue.id] = exportedValue;
      REGION_REGISTRY[exportedValue.id] = exportedValue;
      if (exportedValue.waygate) {
        WAYGATE_REGISTRY[exportedValue.waygate.id] = exportedValue.waygate;
      }
    }
  }
}

export function getRegionDefinition(regionId?: string): RegionDefinition {
  if (regionId && REGION_REGISTRY[regionId]) {
    return REGION_REGISTRY[regionId];
  }
  return regionBelldorOutskirts;
}

export { regionBelldorOutskirts };
export type { RegionDefinition };
