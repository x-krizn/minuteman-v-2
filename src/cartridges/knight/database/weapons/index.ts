/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

// Dynamic auto-discovery: any weapon file added to this directory is automatically registered!
const weaponModules = import.meta.glob('./*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const collectedWeapons: WeaponDefinition[] = [];

for (const [path, mod] of Object.entries(weaponModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'category' in exp &&
      (exp as { category?: string }).category === 'weapon'
    ) {
      collectedWeapons.push(exp as WeaponDefinition);
    }
  }
}

export const ALL_WEAPONS: WeaponDefinition[] = collectedWeapons;

export const WEAPON_REGISTRY: Record<string, WeaponDefinition> = ALL_WEAPONS.reduce(
  (acc, w) => {
    acc[w.id] = w;
    return acc;
  },
  {} as Record<string, WeaponDefinition>
);

export function getWeaponDefinition(id?: string): WeaponDefinition {
  return (id && WEAPON_REGISTRY[id]) || WEAPON_REGISTRY['short_sword'] || ALL_WEAPONS[0];
}

export * from './short_sword';
