/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const flaskShardItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'flask_shard',
  name: 'Flask Shard',
  category: 'shard',
  description: '+1 Max Flask Capacity',
  lore: 'A fragment of emerald glass capable of expanding your healing vessel.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 8,
  assets: {
    type: 'single',
    imageUri: '',
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.5, speed: 220 },
      trail: { color: '#44ff88', fadeMs: 150 },
    },
  },

  // 3. Stat Modifiers & Economy
  cost: 40,
  sellPrice: 20,
  soldBy: ['wandering_merchant'],
  vendors: ['wandering_merchant'],

  // 4. Dungeon Spawning & Drop Rules
  canDrop: false,
  dropWeight: 0,
  spawning: {
    canDropFromEnemies: false,
    dropWeight: 0,
    dungeonRarity: 'rare',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'flask_max',
    amount: 1,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.maxFlasks += 1;
      state.flasks += 1;
      ctx.sound.playKey();
      ctx.say('+1 MAX FLASK');
      ctx.spawnParticles(state.x, state.y - 6, 8, '#44ff88');
    },
  },
};
