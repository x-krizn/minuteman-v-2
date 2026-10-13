/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const keyItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'key',
  symbol: 'K',
  name: 'Dungeon Key',
  category: 'key',
  description: 'Unlocks the fortified exit door of the floor.',
  lore: 'Forged of heavy iron to seal ancient chambers.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 2,
  assets: {
    type: 'single',
    imageUri: '',
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.5, speed: 300 },
      trail: { color: '#ffffaa', fadeMs: 120 },
    },
  },

  // 3. Stat Modifiers & Economy
  cost: 50,
  sellPrice: 20,

  // 4. Dungeon Spawning & Drop Rules
  canDrop: false,
  dropWeight: 0,
  spawning: {
    canDropFromEnemies: false,
    dropWeight: 0,
    dungeonRarity: 'legendary',
    proceduralPlacementSymbol: 'K',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'key',
    amount: 1,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.keys += 1;
      ctx.sound.playKey();
      ctx.say('KEY');
      ctx.spawnParticles(state.x, state.y - 6, 8, '#ffffaa');
    },
  },
};
