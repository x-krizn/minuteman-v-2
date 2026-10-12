/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StaticAreaDefinition } from '../../types';

export const tutorialArea: StaticAreaDefinition = {
  id: 'tutorial',
  name: 'Forgotten Grove',
  category: 'tutorial',
  type: 'static',
  description: 'An overgrown sanctuary carved from mossy ruins. Perfect for mastering movement and blade discipline.',
  biomeId: 'forest',
  ambientColor: '#102210',
  defaultStartRoom: '0,0',
  defaultStartPosition: { x: 120, y: 32 },

  rooms: {
    // Row 0: Top Chambers
    // 0,0: Hero Awakening at peak of ramp, descends down-left
    '0,0': [
      '##########',
      '#......P.#',
      '#.....#..#',
      '#....#...#',
      '#...#....#',
      '#..#.....#',
      '#.#......#',
      '#........#',
      '#..#######',
    ],
    // 1,0: Key Chamber with enemy and key, room door leading down to 1,1
    '1,0': [
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#..####..#',
      '#........#',
      '#.E....K.#',
      '####..####',
    ],
    // 2,0: Upper Battlements with high ledge
    '2,0': [
      '##########',
      '#........#',
      '#.####...#',
      '#........#',
      '#........#',
      '#....##..#',
      '#........#',
      '#........#',
      '###....###',
    ],

    // Row 1: Mid Chambers
    // 0,1: Stepped platforms, drops from 0,0, enemy on floor, blue door East to 1,1
    '0,1': [
      '#..#######',
      '#........#',
      '#........#',
      '#.####...#',
      '#........#',
      '#........#',
      '#.........',
      '#..E......',
      '##########',
    ],
    // 1,1: Central Hub with floating platform, enemy, connecting to 1,0, 0,1, and 2,1
    '1,1': [
      '####..####',
      '#........#',
      '#........#',
      '#..####..#',
      '#........#',
      '#........#',
      '..........',
      '...E......',
      '##########',
    ],
    // 2,1: Diagonal Descent Ramp with blue gate, drops into 2,2
    '2,1': [
      '###....###',
      '#........#',
      '#........#',
      '#.#......#',
      '#..#.....#',
      '#...#....#',
      '.....#...#',
      '......#..#',
      '####.....#',
    ],

    // Row 2: Lower Chambers & Sanctuaries
    // 0,2: Campfire Sanctuary with long horizontal shelf and campfire checkpoint
    '0,2': [
      '##########',
      '#........#',
      '#........#',
      '#..O.....#',
      '#######..#',
      '#........#',
      '#.........',
      '#.........',
      '##########',
    ],
    // 1,2: Relic Vault with Double Jump Relic (Winged Crest)
    '1,2': [
      '##########',
      '#........#',
      '#........#',
      '#...D....#',
      '#..####..#',
      '#........#',
      '..........',
      '..........',
      '##########',
    ],
    // 2,2: Boss Chamber & Catacombs Gate (requires Key K to enter Catacombs)
    '2,2': [
      '####.....#',
      '#........#',
      '#........#',
      '#........#',
      '#.....H..#',
      '#....###.#',
      '..........',
      '....E..L.#',
      '##########',
    ],
  },

  greenRooms: {
    '0,0': 1,
    '1,0': 1,
    '2,0': 1,
    '0,1': 1,
    '1,1': 1,
    '2,1': 1,
    '0,2': 1,
    '1,2': 1,
    '2,2': 1,
  },

  safeRooms: {
    '0,0': 1,
    '0,2': 1,
  },

  checkpoints: {
    '0,0': { x: 120, y: 32 },
    '0,2': { x: 48, y: 64 },
  },

  transitions: [
    {
      id: 'grove_to_dungeon',
      fromAreaId: 'tutorial',
      fromRoom: '2,2',
      trigger: {
        type: 'door',
        tileChar: 'L',
        keyRequired: true,
        prompt: 'ENTER CATACOMBS',
      },
      toAreaId: 'dungeon',
      toRoom: 'start',
      toPosition: { x: 48, y: 128 },
      bidirectional: true,
    },
  ],
};
