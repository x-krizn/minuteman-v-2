/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const room30BogPerimeterGate: RoomDefinition = {
  coord: '3,0',
  areaId: 'm00_the_bog',
  title: 'Bog Perimeter Gateway',
  bannerTitle: 'BOG EXIT PERIMETER · ORC PAIR',
  grid: [
    '##########',
    '#........#',
    '#..P..P..#',
    '#...o....#', // Orc Warrior (automatically spawns paired Orc Scout)
    '#..~~~~..#',
    '.......G..', // Bog Exit Gate (hidden until Poe resolved or Rusted Gate Key used)
    '.......G..',
    '#........#',
    '##########',
  ],
};
