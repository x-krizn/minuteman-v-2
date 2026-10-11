/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const amethystItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'amethyst',
  symbol: 'P',
  name: 'Amethyst Shard',
  category: 'shard',
  description: '+1 Max AP & Armor Reinforce',
  lore: 'A crystalline purple shard from the deep subterranean caves.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 5,
  assets: {
    type: 'single',
    imageUri: '',
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.5, speed: 250 },
      trail: { color: '#b044ff', fadeMs: 150 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'ap',
  color: '#b044ff',
  cost: 30,
  sellPrice: 15,
  soldBy: ['wandering_merchant'],
  vendors: ['wandering_merchant'],

  // 4. Dungeon Spawning & Drop Rules
  canDrop: true,
  dropWeight: 0.1,
  spawning: {
    canDropFromEnemies: true,
    dropWeight: 0.1,
    dungeonRarity: 'rare',
    proceduralPlacementSymbol: 'P',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'max_stat',
    stat: 'ap',
    amount: 1,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.maxAp += 1;
      state.ap = state.maxAp;
      ctx.sound.playKey();
      ctx.say('+1 MAX AP');
      ctx.spawnParticles(state.x, state.y - 8, 8, '#b044ff');
    },
  },
};
