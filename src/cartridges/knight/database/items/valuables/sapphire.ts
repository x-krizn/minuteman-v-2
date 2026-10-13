/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const sapphireItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'sapphire',
  symbol: 'B',
  name: 'Sapphire Gem',
  category: 'gem',
  description: '+1 Maximum Energy (EP)',
  lore: 'An azure jewel radiating mystic energy for spells.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 6,
  assets: {
    type: 'single',
    imageUri: '',
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.5, speed: 250 },
      trail: { color: '#6666ff', fadeMs: 150 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'ep',
  color: '#6666ff',
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
    proceduralPlacementSymbol: 'B',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'max_stat',
    stat: 'ep',
    amount: 1,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.maxEp += 1;
      state.ep = state.maxEp;
      ctx.sound.playKey();
      ctx.say('+1 MAX EP');
      ctx.spawnParticles(state.x, state.y - 8, 8, '#6666ff');
    },
  },
};
