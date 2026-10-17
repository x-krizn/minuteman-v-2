/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const room50BorderTownCathedral: RoomDefinition = {
  coord: '5,0',
  areaId: 'border_town_slums',
  title: 'Border Town Cathedral',
  bannerTitle: 'CATHEDRAL COURTYARD · SIR BORS & DUNGEON DOOR',
  grid: [
    '##########',
    '#..3.....#', // Hidden Switch #3 (3)
    '#..P..P..#',
    '#...B....#', // Sir Bors (B)
    '#........#',
    '.......M..', // Three-Way Cathedral Dungeon Door (M: Force / Exploration / Trust)
    '.......M..',
    '#........#',
    '##########',
  ],
};
