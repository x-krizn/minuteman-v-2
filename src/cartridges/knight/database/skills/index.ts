/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillDef, SkillId } from '../../types';
import { healSkill } from './heal';
import { fireballSkill } from './fireball';
import { whirlwindSkill } from './whirlwind';
import { shockwaveSkill } from './shockwave';

export const ALL_SKILLS: SkillDef[] = [
  healSkill,
  fireballSkill,
  whirlwindSkill,
  shockwaveSkill,
];

export const SKILL_REGISTRY: Record<SkillId, SkillDef> = {
  heal: healSkill,
  fireball: fireballSkill,
  whirlwind: whirlwindSkill,
  shockwave: shockwaveSkill,
};

export const COMPAT_SKILLS: Record<SkillId, SkillDef> = SKILL_REGISTRY;

export function getSkillDefinition(id: SkillId): SkillDef | undefined {
  return SKILL_REGISTRY[id];
}

export * from './heal';
export * from './fireball';
export * from './whirlwind';
export * from './shockwave';
