/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition, WeaponExecutionContext } from '../../types';

export const shortSwordWeapon: WeaponDefinition = {
  // 1. Identity & Equipment Slot
  id: 'short_sword',
  name: 'Iron Shortsword',
  category: 'weapon',
  slot: 'main_hand',
  description: 'A nimble, balanced blade favored by dungeon vanguards.',
  lore: 'Forged from low-grade bog iron, yet light enough to strike in rapid succession.',

  // 2. Base Combat Stats
  stats: {
    damage: 1,
    poiseDamage: 1,
    staminaCost: 4,
    critChance: 0.15,
    critMultiplier: 2.0,
  },

  // 3. Visual Assets (Single Sprite & FX Colors)
  assets: {
    // Uses blade frame 12/14 from items sprite sheet or standalone transform
    spriteIndex: 12,
    slashTrailColor: '#e2e8f0', // Crisp silver blade trail
    impactParticleColor: '#f8fafc',
    anchorOffset: { x: 4, y: 8 },
  },

  // 4. Fighting Game Style Frame Data
  frameData: {
    startupTicks: 2,
    activeTicks: 3,
    recoveryTicks: 4,
    canCancelIntoRoll: true,
    hitbox: {
      offsetX: 10,
      offsetY: -4,
      width: 14,
      height: 12,
    },
  },

  // 5. Behavior Hooks & Sub-rules
  hooks: {
    onEquip: (_player) => {
      // Base equip hook
    },

    onSwing: (ctx: WeaponExecutionContext) => {
      ctx.sound.playSword();
      ctx.spawnParticles(ctx.player.x + ctx.player.face * 8, ctx.player.y - 6, 2, '#cbd5e1');
    },

    onHit: (target, ctx: WeaponExecutionContext) => {
      const isCrit = Math.random() < (shortSwordWeapon.stats.critChance ?? 0.15);
      const mult = isCrit ? (shortSwordWeapon.stats.critMultiplier ?? 2.0) : 1;
      const baseDmg = ctx.state.isHeavyAttack ? 3 : shortSwordWeapon.stats.damage;
      const finalDamage = Math.round(baseDmg * mult);

      target.hp -= finalDamage;
      target.stun = ctx.state.isHeavyAttack ? 0.6 : 0.25;
      target.x += ctx.player.face * (ctx.state.isHeavyAttack ? 14 : 7);

      if (isCrit) {
        ctx.sound.playCharge();
        ctx.spawnParticles(target.x, target.y - 6, 8, '#f59e0b', `CRIT -${finalDamage}`);
        ctx.say('CRITICAL!');
      } else {
        ctx.sound.playHit();
        ctx.spawnParticles(
          target.x,
          target.y - 6,
          ctx.state.isHeavyAttack ? 10 : 5,
          ctx.state.isHeavyAttack ? '#ff8800' : '#ffff44',
          `-${finalDamage}`
        );
      }
    },
  },
};
