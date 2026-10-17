/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const room20DeepBogPoe: RoomDefinition = {
  coord: '2,0',
  areaId: 'm00_the_bog',
  title: 'The Poe & Deep Bog',
  bannerTitle: 'DEEP BOG · THE POE & SUBMERGED WURM',
  grid: [
    '##########',
    '#..L.....#', // Poe's Lantern Anchor (L)
    '#..p..P..#', // Drifting Poe Spirit (p)
    '#..~~~~..#',
    '#..~W~~..#', // Submerged Bog Wurm (W) lurking in Corrosive Bog Water (~)
    '..........',
    '..........',
    '#...E....#', // Bog Crawler
    '##########',
  ],
};
