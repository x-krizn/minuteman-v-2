/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const potionEpItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'potion_ep',
  symbol: '3',
  name: 'Ether Draught',
  category: 'potion',
  description: 'Restores Energy Points for magic skills',
  lore: 'Distilled starlight providing immediate mental clarity.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 10,
  assets: {
    type: 'single',
    imageUri: '',
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.2, speed: 200 },
      trail: { color: '#66aaff', fadeMs: 120 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'ep',
  cost: 15,
  sellPrice: 8,

  // 4. Dungeon Spawning & Drop Rules
  canDrop: true,
  dropWeight: 0.15,
  spawning: {
    canDropFromEnemies: true,
    dropWeight: 0.15,
    dungeonRarity: 'common',
    proceduralPlacementSymbol: '3',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'restore_stat',
    stat: 'ep',
    amount: 2,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.ep = Math.min(state.maxEp, state.ep + 2);
      ctx.sound.playCoin();
      ctx.say('+2 EP');
      ctx.spawnParticles(state.x, state.y - 6, 6, '#66aaff');
    },
  },
};
