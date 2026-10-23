/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLine, TraitLineWikiDefinition } from '../../types';
import { warriorTrait } from './warrior';

// Auto-discover all character trait/frame entry modules in this directory via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

export const TRAIT_REGISTRY = {} as Record<TraitLine, TraitLineWikiDefinition>;

function isTraitLineWikiDefinition(val: unknown): val is TraitLineWikiDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'reactor' in val &&
    'baseShield' in val &&
    'baseArmor' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isTraitLineWikiDefinition(exportedValue)) {
      TRAIT_REGISTRY[exportedValue.id] = exportedValue;
    }
  }
}

export const TRAIT_LIST: TraitLineWikiDefinition[] = Object.values(TRAIT_REGISTRY);

export const DEFAULT_CALLSIGNS: Record<TraitLine, string> = {
  Warrior: 'Pilot Vane',
  Marauder: 'Pilot Kael',
  Guardian: 'Pilot Seraph',
  Rogue: 'Pilot Nyx',
  Wizard: 'Pilot Soren',
  Cleric: 'Pilot Lyra',
};

export function getTraitDefinition(id: TraitLine): TraitLineWikiDefinition {
  return TRAIT_REGISTRY[id] || warriorTrait;
}
