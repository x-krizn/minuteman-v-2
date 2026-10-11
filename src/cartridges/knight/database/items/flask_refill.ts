/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const flaskRefillItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'flask_refill',
  name: 'Elixir Draft',
  category: 'potion',
  description: 'Refill all Flask charges',
  lore: 'A draught of restorative spring water brewed by forest hermits.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 8,
  assets: {
    type: 'single',
    imageUri: '',
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.2, speed: 220 },
      trail: { color: '#44ffff', fadeMs: 150 },
    },
  },

  // 3. Stat Modifiers & Economy
  cost: 10,
  sellPrice: 5,
  soldBy: ['wandering_merchant'],
  vendors: ['wandering_merchant'],

  // 4. Dungeon Spawning & Drop Rules
  canDrop: false,
  dropWeight: 0,
  spawning: {
    canDropFromEnemies: false,
    dropWeight: 0,
    dungeonRarity: 'common',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'flask_refill',
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.flasks = state.maxFlasks;
      ctx.sound.playCoin();
      ctx.say('FLASKS REFILLED');
      ctx.spawnParticles(state.x, state.y - 6, 6, '#44ffff');
    },
  },
};
