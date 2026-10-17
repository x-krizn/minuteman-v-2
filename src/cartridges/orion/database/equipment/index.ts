/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor, OrionState } from '../../types';
import { getWeaponDefinition } from '../weapons';

export type { OrionActionDescriptor } from '../../types';

// Auto-discover all assignable action modules in this directory via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./*.ts', { eager: true });

const discoveredActions: OrionActionDescriptor[] = [];

function isOrionActionDescriptor(val: unknown): val is OrionActionDescriptor {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'sourceCategory' in val &&
    'shortLabel' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isOrionActionDescriptor(exportedValue)) {
      discoveredActions.push(exportedValue);
    }
  }
}

export const ASSIGNABLE_ACTION_CATALOG: OrionActionDescriptor[] = discoveredActions.sort(
  (a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)
);

/**
 * Resolve any assignable action ID into its concrete action descriptor for the pilot's current state
 * (dynamically binding weapon_skill_1..4 to the currently active weapon's moveset).
 */
export function getResolvedActionDescriptor(
  state: OrionState,
  actionId: string
): OrionActionDescriptor {
  const base =
    ASSIGNABLE_ACTION_CATALOG.find((a) => a.id === actionId) ||
    ASSIGNABLE_ACTION_CATALOG[0];

  if (base && base.sourceCategory === 'weapon' && base.weaponSkillSlot) {
    const currentWeaponId =
      state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
    const weapon = getWeaponDefinition(currentWeaponId);
    const move = weapon?.moveset[base.weaponSkillSlot];
    if (move && weapon) {
      return {
        ...base,
        name: move.name,
        shortLabel: move.name.toUpperCase(),
        sourceLabel: `${weapon.name} [Skill ${base.weaponSkillSlot}]`,
        description: move.description,
        tellDurationSec: move.tellDurationSec,
        actionDurationSec: move.actionDurationSec,
        cooldownSec: move.cooldownSec,
        heatCost: move.heatCost,
        damage: move.damage,
        damageType: move.damageType,
        damageFamily: move.damageFamily,
        range: move.range,
      };
    }
  }

  return base;
}
