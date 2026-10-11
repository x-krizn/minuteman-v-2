/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillDef } from '../../types';

export const shockwaveSkill: SkillDef = {
  id: 'shockwave',
  name: 'SLAMSURGE',
  costType: 'sp',
  cost: 2,
  iconIndex: 15,
  description: 'Ground slam sends armor-breaking surge.',
  cooldown: 0.8,
  execute: (state, ctx) => {
    ctx.say('SLAM');
    ctx.sound.playHeavyAttack();
    state.hitstop = 0.05;
    const dir = state.face;
    state.projectiles.push({
      x: state.x + dir * 8,
      y: state.y - 2,
      vx: dir * 130,
      vy: 0,
      damage: 3,
      isPlayer: true,
      life: 0.6,
      radius: 6,
    });
    ctx.spawnParticles(state.x, state.y, 14, '#ffdd55');
  },
};
