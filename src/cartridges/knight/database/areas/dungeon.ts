/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicAreaDefinition } from '../../types';

export const dungeonArea: DynamicAreaDefinition = {
  id: 'dungeon',
  name: 'Procedural Catacombs',
  category: 'dungeon',
  type: 'dynamic',
  description: 'An ever-shifting subterranean labyrinth of crumbling arches, patrolling wisps, and sealed relics.',
  biomeId: 'crypt',
  ambientColor: '#121218',
  defaultStartRoom: '0,0',
  defaultStartPosition: { x: 48, y: 128 },

  generatorConfig: {
    cols: (cleared: number) => Math.min(10, 3 + cleared),
    rows: (cleared: number) => Math.min(5, 2 + Math.floor(cleared / 2)),
    enemyProbability: 0.35,
    decorFrequency: 0.4,
    safeRoomStart: true,
    theme: 'crypt',
  },

  transitions: [
    {
      id: 'dungeon_to_grove',
      fromAreaId: 'dungeon',
      fromRoom: 'start',
      trigger: {
        type: 'door',
        tileChar: '<',
        keyRequired: false,
        prompt: 'RETURN TO GROVE',
      },
      toAreaId: 'tutorial',
      toRoom: '2,2',
      toPosition: { x: 96, y: 128 },
    },
    {
      id: 'dungeon_to_boss',
      fromAreaId: 'dungeon',
      fromRoom: 'door',
      trigger: {
        type: 'door',
        tileChar: 'L',
        keyRequired: true,
        prompt: 'ENTER BOSS SANCTUM',
      },
      toAreaId: 'boss_sanctum',
      toRoom: 'arena',
      toPosition: { x: 48, y: 272 },
    },
  ],
};
