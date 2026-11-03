/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillDef, SkillId } from '../../types';

// Dynamic recursive auto-discovery: any new skill file added to this directory or subdirectories is automatically detected!
const skillModules = import.meta.glob('./**/*.ts', { eager: true });
const skillMap = new Map<string, SkillDef>();

for (const path in skillModules) {
  if (path.endsWith('index.ts')) continue;
  const mod = skillModules[path] as Record<string, unknown>;
  for (const key in mod) {
    const val = mod[key];
    if (val && typeof val === 'object' && 'id' in val && 'name' in val) {
      const def = val as SkillDef;
      skillMap.set(def.id, def);
    }
  }
}

/**
 * List of all auto-discovered `SkillDef` entries in the Knight cartridge.
 */
export const ALL_SKILLS: SkillDef[] = Array.from(skillMap.values());

/**
 * Lookup table mapping each `SkillId` to its `SkillDef` configuration.
 */
export const SKILL_REGISTRY: Record<SkillId, SkillDef> = ALL_SKILLS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<SkillId, SkillDef>
);

/**
 * Returns the `SkillDef` for the given `id`, or `undefined` if not registered.
 */
export function getSkillDefinition(id: SkillId): SkillDef | undefined {
  return SKILL_REGISTRY[id];
}
