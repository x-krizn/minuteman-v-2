/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const topazItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'topaz',
  symbol: 'Y',
  name: 'Topaz Gem',
  category: 'gem',
  description: '+1 Maximum Stamina (SP)',
  lore: 'A sparkling golden gem empowering rapid dashes and combat blocks.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 7,
  assets: {
    type: 'single',
    imageUri: '',
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.5, speed: 250 },
      trail: { color: '#cccc44', fadeMs: 150 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'sp',
  color: '#cccc44',
  cost: 25,
  sellPrice: 12,
  soldBy: ['wandering_merchant'],
  vendors: ['wandering_merchant'],

  // 4. Dungeon Spawning & Drop Rules
  canDrop: true,
  dropWeight: 0.15,
  spawning: {
    canDropFromEnemies: true,
    dropWeight: 0.15,
    dungeonRarity: 'uncommon',
    proceduralPlacementSymbol: 'Y',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'max_stat',
    stat: 'sp',
    amount: 1,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.maxSp += 1;
      state.sp = state.maxSp;
      ctx.sound.playKey();
      ctx.say('+1 MAX SP');
      ctx.spawnParticles(state.x, state.y - 8, 8, '#cccc44');
    },
  },
};
