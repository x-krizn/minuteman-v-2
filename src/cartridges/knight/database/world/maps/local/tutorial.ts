/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalMapDefinition } from '../../../../types';

export const TUTORIAL_ROOMS: Record<string, string[]> = {
  '0,0': [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#..ooo...#',
    '#..###...#',
    '#.........',
    '#.........',
    '##########',
  ],
  '1,0': [
    '####..####',
    '#........#',
    '#...1....#',
    '#..####..#',
    '#........#',
    '#........#',
    '..........',
    '.....E....',
    '##########',
  ],
  '2,0': [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '.........#',
    '.......D.L',
    '##########',
  ],
  '3,0': [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '.G.B.Y.P.O.',
    '##########',
  ],
  '1,-1': [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#.E...KH.#',
    '####..####',
  ],
};

export const TUTORIAL_GREEN: Record<string, number> = {
  '0,0': 1,
  '1,0': 1,
  '2,0': 1,
  '3,0': 1,
  '1,-1': 1,
};

export const tutorialLocalMap: LocalMapDefinition = {
  id: 'tutorial',
  name: 'Awakening Descent',
  areaId: 'forgotten_crypt',
  description: 'The introductory chambers where the Proto Knight awakens and learns basic movement and sword strikes.',
  spawnPoint: { room: '0,0', x: 32, y: 128 },
  rooms: TUTORIAL_ROOMS,
  greenRooms: TUTORIAL_GREEN,
  defaultBiomeId: 'crypt',
};

// Aliases for backwards compatibility with legacy world runners
export const INITIAL_ROOMS = TUTORIAL_ROOMS;
export const INITIAL_GREEN = TUTORIAL_GREEN;
