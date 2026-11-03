/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterDefinition } from '../../types';

// Dynamic recursive auto-discovery for character archetypes
const characterModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const characterMap = new Map<string, CharacterDefinition>();

for (const [path, mod] of Object.entries(characterModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp &&
      'stats' in exp
    ) {
      const char = exp as CharacterDefinition;
      characterMap.set(char.id, char);
    }
  }
}

/**
 * Exported const `ALL_CHARACTERS` (all characters) in `index.ts`.
 */
export const ALL_CHARACTERS: CharacterDefinition[] = Array.from(characterMap.values());

/**
 * Exported const `CHARACTER_REGISTRY` (character registry) in `index.ts`.
 */
export const CHARACTER_REGISTRY: Record<string, CharacterDefinition> = ALL_CHARACTERS.reduce(
  (acc, char) => {
    acc[char.id] = char;
    return acc;
  },
  {} as Record<string, CharacterDefinition>
);

/**
 * Executes `getCharacterDefinition` (get character definition) in `index.ts`.
 */
export function getCharacterDefinition(id: string): CharacterDefinition | undefined {
  return CHARACTER_REGISTRY[id];
}

export * from './proto_knight';
export * from './enemy_knight';
