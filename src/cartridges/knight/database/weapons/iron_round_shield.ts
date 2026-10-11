/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition, WeaponExecutionContext } from '../../types';

export const IRON_ROUND_SHIELD_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVR4nGNgGAXUB15eXv9x4SdPnvzPnz+fwYGBgYFBEknx/Pn/wfyPHz9A4hUVFeAc0tQyYALBpsEF/jOgu4Bh8GNgYGBg/PfvHwOaCxgGyACnAa2/jB5mDAwMjBhoGAAApY1eA2f7XJgAAAAASUVORK5CYII=';

export const ironRoundShield: WeaponDefinition = {
  // 1. Identity & Equipment Slot
  id: 'iron_round_shield',
  name: 'Iron Round Shield',
  category: 'shield',
  weaponType: 'shield',
  slot: 'off_hand',
  description: 'A reinforced wooden targe with iron banding.',
  lore: 'Stout enough to absorb arrows and deflect heavy blows, but cumbersome in tight spaces.',

  // 2. Base Defense & Poise Stats
  stats: {
    damage: 0,
    poiseDamage: 2,
    staminaCost: 3,
  },

  // 3. Supported & Innate Techniques
  supportedActions: ['block', 'parry', 'block_counter'],
  // This shield innately grants block_counter even if the knight hasn't learned the feat yet!
  innateFeats: ['block_counter'],

  // Incompatibilities: cannot perform aerial spinning sword attacks using a heavy round shield
  incompatibleActions: ['air_dash_attack'],

  // 4. Visual Assets
  assets: {
    imageUri: IRON_ROUND_SHIELD_PNG,
    impactParticleColor: '#94a3b8',
    anchorOffset: { x: 4, y: 8 },
  },

  // 5. Behavior Hooks
  hooks: {
    onEquip: (player) => {
      // Passive boost to max AP while holding shield
      player.maxAp = Math.max(player.maxAp, 4);
    },
    onSwing: (ctx: WeaponExecutionContext) => {
      ctx.sound.playShieldBlock?.();
      ctx.spawnParticles(ctx.player.x, ctx.player.y - 4, 3, '#94a3b8');
    },
  },
};
