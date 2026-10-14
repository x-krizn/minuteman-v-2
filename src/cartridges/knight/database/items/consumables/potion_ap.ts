/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const potionApItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'potion_ap',
  symbol: '2',
  name: 'Armor Tonic',
  category: 'potion',
  description: 'Restores Armor Poise points',
  lore: 'A thick draught that hardens the sinews.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 9,
  assets: {
    type: 'single',
    imageUri: '',
    sheetIndex: 9, // Legacy sprite sheet fallback
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.2, speed: 200 },
      trail: { color: '#88ffaa', fadeMs: 120 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'ap',
  cost: 15,
  sellPrice: 8,

  // 4. Dungeon Spawning & Drop Rules
  canDrop: true,
  dropWeight: 0.15,
  spawning: {
    canDropFromEnemies: true,
    dropWeight: 0.15,
    dungeonRarity: 'common',
    proceduralPlacementSymbol: '2',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'restore_stat',
    stat: 'ap',
    amount: 2,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.ap = Math.min(state.maxAp, state.ap + 2);
      ctx.sound.playCoin();
      ctx.say('+2 AP');
      ctx.spawnParticles(state.x, state.y - 6, 6, '#88ffaa');
    },
  },
};
