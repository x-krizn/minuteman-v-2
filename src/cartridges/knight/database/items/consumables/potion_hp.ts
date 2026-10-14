/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const potionHpItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'potion_hp',
  symbol: '1',
  name: 'Health Elixir',
  category: 'potion',
  description: '+1 Flask charge replenish',
  lore: 'A soothing medicinal concoction in a sealed vial.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 8,
  assets: {
    type: 'single',
    imageUri: '',
    sheetIndex: 8, // Legacy sprite sheet fallback
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.2, speed: 200 },
      trail: { color: '#44ff66', fadeMs: 120 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'hp',
  cost: 15,
  sellPrice: 8,

  // 4. Dungeon Spawning & Drop Rules
  canDrop: true,
  dropWeight: 0.2,
  spawning: {
    canDropFromEnemies: true,
    dropWeight: 0.2,
    dungeonRarity: 'common',
    proceduralPlacementSymbol: '1',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'restore_stat',
    stat: 'hp',
    amount: 1,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.flasks = Math.min(state.maxFlasks, state.flasks + 1);
      ctx.sound.playCoin();
      ctx.say(`+1 FLASK (${state.flasks}/${state.maxFlasks})`);
      ctx.spawnParticles(state.x, state.y - 6, 6, '#44ff66');
    },
  },
};
