/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition, WaystationNode } from '../../types';
import { borderTownSlumsArea } from './local/border_town_slums';
import { m00TheBogArea } from './local/m00_the_bog';

// Auto-discover all global and local area modules via Vite import.meta.glob
const globalModules = import.meta.glob<Record<string, unknown>>('./global/*.ts', { eager: true });
const localModules = import.meta.glob<Record<string, unknown>>('./local/*.ts', { eager: true });

export const GLOBAL_AREA_REGISTRY: Record<string, AreaWikiDefinition> = {};
export const LOCAL_AREA_REGISTRY: Record<string, AreaWikiDefinition> = {};
export const AREA_REGISTRY: Record<string, AreaWikiDefinition> = {};
export const WAYSTATION_REGISTRY: Record<string, WaystationNode> = {};

function isAreaDefinition(val: unknown): val is AreaWikiDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'scope' in val &&
    'localMapIds' in val &&
    'globalMapIds' in val
  );
}

for (const mod of Object.values(globalModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isAreaDefinition(exportedValue)) {
      GLOBAL_AREA_REGISTRY[exportedValue.id] = exportedValue;
      AREA_REGISTRY[exportedValue.id] = exportedValue;
      if (exportedValue.waystation) {
        WAYSTATION_REGISTRY[exportedValue.waystation.id] = exportedValue.waystation;
      }
    }
  }
}

for (const mod of Object.values(localModules)) {
  for (const exportedValue of Object.values(mod)) {
    if (isAreaDefinition(exportedValue)) {
      LOCAL_AREA_REGISTRY[exportedValue.id] = exportedValue;
      AREA_REGISTRY[exportedValue.id] = exportedValue;
      if (exportedValue.waystation) {
        WAYSTATION_REGISTRY[exportedValue.waystation.id] = exportedValue.waystation;
      }
    }
  }
}

export function getAreaDefinition(areaId?: string): AreaWikiDefinition {
  if (areaId && AREA_REGISTRY[areaId]) {
    return AREA_REGISTRY[areaId];
  }
  return m00TheBogArea;
}

export { borderTownSlumsArea, m00TheBogArea };
export type { AreaWikiDefinition };
