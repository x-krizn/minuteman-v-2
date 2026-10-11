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
  const mod = skillModules[path] as Record<string, any>;
  for (const key in mod) {
    const val = mod[key];
    if (val && typeof val === 'object' && val.id && val.name) {
      skillMap.set(val.id, val as SkillDef);
    }
  }
}

export const ALL_SKILLS: SkillDef[] = Array.from(skillMap.values());

export const SKILL_REGISTRY: Record<SkillId, SkillDef> = ALL_SKILLS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<SkillId, SkillDef>
);

export function getSkillDefinition(id: SkillId): SkillDef | undefined {
  return SKILL_REGISTRY[id];
}
