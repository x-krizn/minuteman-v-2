/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

export const coinItem: ItemWikiDefinition = {
  // 1. Identity & Metadata
  id: 'coin',
  symbol: 'o',
  name: 'Gold Coin',
  category: 'coin',
  description: 'Glinting currency used for trade and upgrades.',
  lore: 'Minted during the golden age of the kingdom.',

  // 2. Visual Assets & Procedural Rendering
  spriteIndex: 0,
  assets: {
    type: 'single',
    imageUri: '',
    width: 16,
    height: 16,
    anchor: { x: 8, y: 8 },
    procedural: {
      bob: { amplitude: 0, speed: 0 },
      trail: { color: '#ffdd00', fadeMs: 100 },
    },
  },

  // 3. Stat Modifiers & Economy
  cost: 1,
  sellPrice: 1,

  // 4. Dungeon Spawning & Drop Rules
  canDrop: true,
  dropWeight: 0.8,
  spawning: {
    canDropFromEnemies: true,
    dropWeight: 0.8,
    dungeonRarity: 'common',
    proceduralPlacementSymbol: 'o',
  },

  // 5. Execution Hook (Self-Contained Rule Execution)
  effect: {
    type: 'currency',
    amount: 1,
  },
  hooks: {
    onCollect: (state, ctx) => {
      state.coins += 1;
      ctx.sound.playCoin();
      ctx.spawnParticles(state.x, state.y - 4, 4, '#ffdd00');
    },
  },
};
