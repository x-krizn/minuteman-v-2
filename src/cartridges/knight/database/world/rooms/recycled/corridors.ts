/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../types';

/**
 * Canonical database definition for `dualLedgeCorridor` (`Dual Ledge Corridor`, id `'recycled_corridor_dual_ledge'`).
 */
export const dualLedgeCorridor: RoomDefinition = {
  id: 'recycled_corridor_dual_ledge',
  name: 'Dual Ledge Corridor',
  layout: [
    '##########',
    '#........#',
    '#........#',
    '#..###...#',
    '#........#',
    '#...###..#',
    '..........',
    '..........',
    '##########',
  ],
};

/**
 * Canonical database definition for `pillarsHall` (`Hall of Fallen Pillars`, id `'recycled_corridor_pillars'`).
 */
export const pillarsHall: RoomDefinition = {
  id: 'recycled_corridor_pillars',
  name: 'Hall of Fallen Pillars',
  layout: [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#..#..#..#',
    '#..#..#..#',
    '..........',
    '..........',
    '##########',
  ],
};
