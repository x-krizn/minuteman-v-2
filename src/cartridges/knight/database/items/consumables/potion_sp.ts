/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const potionSpItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'potion_sp',
  symbol: '4',
  name: 'Vigor Brew',
  category: 'potion',
  description: 'Restores Stamina Points for dashes and blocks',
  lore: 'A spicy tincture that reinvigorates exhausted muscles.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 11,
  assets: {
    type: 'single',
    imageUri: '',
    sheetIndex: 11, // Legacy sprite sheet fallback
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.2, speed: 200 },
      trail: { color: '#ffcc44', fadeMs: 120 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'sp',
  cost: 15,
  sellPrice: 8,

  // 4. Dungeon Spawning & Drop Rules
  canDrop: true,
  dropWeight: 0.15,
  spawning: {
    canDropFromEnemies: true,
    dropWeight: 0.15,
    dungeonRarity: 'common',
    proceduralPlacementSymbol: '4',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'restore_stat',
    stat: 'sp',
    amount: 2,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.sp = Math.min(state.maxSp, state.sp + 2);
      ctx.sound.playCoin();
      ctx.say('+2 SP');
      ctx.spawnParticles(state.x, state.y - 6, 6, '#ffcc44');
    },
  },
};
