/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillDef } from '../../types';

export const healSkill: SkillDef = {
  id: 'heal',
  name: 'FLASK',
  costType: 'flask',
  cost: 1,
  iconIndex: 8,
  description: 'Consume 1 Flask charge to restore 2 HP.',
  cooldown: 0.8,
  execute: (state, ctx) => {
    state.hp = Math.min(state.maxHp, state.hp + 2);
    ctx.say(`+2 HP (FLASKS: ${state.flasks})`);
    ctx.spawnParticles(state.x, state.y - 8, 8, '#44ff88', '+2');
  },
};
