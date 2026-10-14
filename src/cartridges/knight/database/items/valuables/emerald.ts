/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const emeraldItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'emerald',
  symbol: 'G',
  name: 'Emerald Gem',
  category: 'gem',
  description: '+1 Maximum Armor/Poise (AP)',
  lore: 'A verdant gem hardening the bearer against enemy flinch.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 5,
  assets: {
    type: 'single',
    imageUri: '',
    sheetIndex: 5, // Legacy sprite sheet fallback
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.5, speed: 250 },
      trail: { color: '#44cc44', fadeMs: 150 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'ap',
  color: '#44cc44',
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
    proceduralPlacementSymbol: 'G',
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
      ctx.spawnParticles(state.x, state.y - 8, 8, '#44cc44');
    },
  },
};
