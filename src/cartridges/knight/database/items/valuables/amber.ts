/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const amberItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'amber',
  symbol: 'O',
  name: 'Amber Crystal',
  category: 'shard',
  description: '+1 Max SP Stamina Boost',
  lore: 'Petrified sap infused with kinetic energy.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 7,
  assets: {
    type: 'single',
    imageUri: '',
    sheetIndex: 7, // Legacy sprite sheet fallback
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.5, speed: 250 },
      trail: { color: '#ff9900', fadeMs: 150 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'sp',
  color: '#ff9900',
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
    proceduralPlacementSymbol: 'O',
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
      ctx.spawnParticles(state.x, state.y - 8, 8, '#ff9900');
    },
  },
};
