/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StaticAreaDefinition } from '../../types';

/**
 * Boss Sanctum / Grand Arena:
 * Demonstrates the multi-screen room architecture and smooth camera scrolling.
 * Room 'arena' spans 20 columns by 18 rows (2x2 full Game Boy screens = 320x288 px).
 */
export const bossArenaArea: StaticAreaDefinition = {
  id: 'boss_sanctum',
  name: 'Sanctum of Blades',
  category: 'boss',
  type: 'static',
  description: 'A grand vaulted colosseum where sovereign knights clash. Spans multi-screen scale with vertical battlements.',
  biomeId: 'sanctum',
  ambientColor: '#160d24',
  defaultStartRoom: 'arena',
  defaultStartPosition: { x: 48, y: 272 },

  rooms: {
    arena: [
      '####################',
      '#..................#',
      '#..1............H..#',
      '#.####........####.#',
      '#..................#',
      '#..................#',
      '#....##########....#',
      '#..................#',
      '#..oo..........oo..#',
      '#.####........####.#',
      '#..................#',
      '#..................#',
      '#....####..####....#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#<.................#',
      '####################',
    ],
  },

  greenRooms: {
    arena: 1,
  },

  safeRooms: {
    arena: 1,
  },

  checkpoints: {
    arena: { x: 48, y: 272 },
  },

  transitions: [
    {
      id: 'sanctum_to_grove',
      fromAreaId: 'boss_sanctum',
      fromRoom: 'arena',
      trigger: {
        type: 'door',
        tileChar: '<',
        keyRequired: false,
        prompt: 'RETURN TO GROVE',
      },
      toAreaId: 'tutorial',
      toRoom: '0,2',
      toPosition: { x: 48, y: 64 },
      bidirectional: true,
    },
  ],
};
