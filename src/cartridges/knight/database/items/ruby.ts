/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const rubyItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'ruby',
  symbol: 'H',
  name: 'Red Ruby',
  category: 'gem',
  description: '+1 Maximum Health (HP)',
  lore: 'A cut crimson gemstone pulsating with vitality.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 4,
  assets: {
    type: 'single',
    imageUri: '', // Uses sprite sheet fallback when empty
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.5, speed: 250 },
      trail: { color: '#ff5555', fadeMs: 150 },
    },
  },

  // 3. Stat Modifiers & Economy
  stat: 'hp',
  color: '#ff5555',
  cost: 25,
  sellPrice: 12,
  soldBy: ['wandering_merchant'],
  vendors: ['wandering_merchant'],

  // 4. Dungeon Spawning & Drop Rules
  canDrop: true,
  dropWeight: 0.2,
  spawning: {
    canDropFromEnemies: true,
    dropWeight: 0.2,
    dungeonRarity: 'uncommon',
    proceduralPlacementSymbol: 'H',
    legacyAliases: ['R'],
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'max_stat',
    stat: 'hp',
    amount: 1,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.maxHp += 1;
      state.hp = state.maxHp;
      ctx.sound.playKey();
      ctx.say('+1 MAX HP');
      ctx.spawnParticles(state.x, state.y - 8, 8, '#ff5555');
    },
  },
};
