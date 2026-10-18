/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

// Auto-discover all weapon entity modules in this directory (including subfolders) via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

export const WEAPON_REGISTRY: Record<string, WeaponDefinition> = {};

function isWeaponDefinition(val: unknown): val is WeaponDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'moveset' in val &&
    'shotsPerChain' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isWeaponDefinition(exportedValue)) {
      WEAPON_REGISTRY[exportedValue.id] = exportedValue;
    }
  }
}

export function getWeaponDefinition(id: string): WeaponDefinition | undefined {
  return WEAPON_REGISTRY[id];
}
