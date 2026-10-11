/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillDef, SkillId } from '../../types';
import { healSkill } from './heal';
import { fireballSkill } from './fireball';
import { whirlwindSkill } from './whirlwind';
import { shockwaveSkill } from './shockwave';

// Dynamic auto-discovery: any new skill file added is automatically detected!
const skillModules = import.meta.glob('./*.ts', { eager: true });
const discoveredSkills: SkillDef[] = [];

for (const path in skillModules) {
  if (path.endsWith('index.ts')) continue;
  const mod = skillModules[path] as Record<string, any>;
  for (const key in mod) {
    const val = mod[key];
    if (val && typeof val === 'object' && val.id && val.name && val.costType) {
      if (!discoveredSkills.some((s) => s.id === val.id)) {
        discoveredSkills.push(val as SkillDef);
      }
    }
  }
}

const baseSkills: SkillDef[] = [
  healSkill,
  fireballSkill,
  whirlwindSkill,
  shockwaveSkill,
];

for (const s of discoveredSkills) {
  if (!baseSkills.some((b) => b.id === s.id)) {
    baseSkills.push(s);
  }
}

export const ALL_SKILLS: SkillDef[] = baseSkills;

export const SKILL_REGISTRY: Record<SkillId, SkillDef> = ALL_SKILLS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<SkillId, SkillDef>
);

export const COMPAT_SKILLS: Record<SkillId, SkillDef> = SKILL_REGISTRY;

export function getSkillDefinition(id: SkillId): SkillDef | undefined {
  return SKILL_REGISTRY[id];
}

export * from './heal';
export * from './fireball';
export * from './whirlwind';
export * from './shockwave';
