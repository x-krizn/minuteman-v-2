/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillDef } from '../../types';

export const fireballSkill: SkillDef = {
  id: 'fireball',
  name: 'FIREBOLT',
  costType: 'ep',
  cost: 1,
  iconIndex: 7,
  description: 'Launch piercing magical fire bolt.',
  cooldown: 0.4,
  execute: (state, ctx) => {
    const dir = state.face;
    state.projectiles.push({
      x: state.x + dir * 12,
      y: state.y - 8,
      vx: dir * 190,
      vy: 0,
      damage: 2,
      isPlayer: true,
      life: 1.2,
      radius: 4,
    });
    ctx.say('FIRE');
  },
};
