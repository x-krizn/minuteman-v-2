/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const doubleJumpAbility: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'ability_double_jump',
  symbol: 'D',
  name: 'Winged Crest',
  category: 'ability',
  description: 'Unlocks Double Jump aerial ascension.',
  lore: 'An ancient knight relic blessing the wearer with a second stride in mid-air.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: -1,
  assets: {
    type: 'single',
    imageUri: '',
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 1.5, speed: 250 },
      trail: { color: '#66ccff', fadeMs: 200 },
    },
  },

  // 3. Stat Modifiers & Economy
  cost: 100,
  sellPrice: 50,

  // 4. Dungeon Spawning & Drop Rules
  canDrop: false,
  dropWeight: 0,
  spawning: {
    canDropFromEnemies: false,
    dropWeight: 0,
    dungeonRarity: 'legendary',
    proceduralPlacementSymbol: 'D',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'double_jump',
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.hasDouble = true;
      ctx.sound.playDoubleJump();
      ctx.say('DOUBLE JUMP');
      ctx.spawnParticles(state.x, state.y - 6, 12, '#66ccff');
    },
  },
};
