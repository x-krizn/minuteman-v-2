/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillDef } from '../../types';

export const whirlwindSkill: SkillDef = {
  id: 'whirlwind',
  name: 'WHIRLWIND',
  costType: 'sp',
  cost: 1,
  iconIndex: 14,
  description: 'Spinning blade strikes all around.',
  cooldown: 0.6,
  execute: (state, ctx) => {
    state.atk = 0.25;
    state.atkV = 2;
    state.swung = [];
    ctx.say('WHIRLWIND');
    ctx.sound.playHeavyAttack();
    ctx.spawnParticles(state.x, state.y - 8, 12, '#99ddff');

    state.enemies.forEach((e) => {
      if (e.hp > 0 && Math.hypot(e.x - state.x, e.y - state.y) < 28) {
        e.hp -= 2;
        e.stun = 0.4;
        e.x += Math.sign(e.x - state.x || 1) * 12;
        ctx.sound.playHit();
      }
    });
  },
};
