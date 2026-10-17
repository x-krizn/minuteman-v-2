/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const room40BorderTownMarket: RoomDefinition = {
  coord: '4,0',
  areaId: 'border_town_slums',
  title: 'Border Town Market',
  bannerTitle: 'CAMELOT BORDER TOWN · DESYNC MARKET',
  grid: [
    '####..####',
    '#..1..C..#', // Hidden Switch #1 (1) & Market Cache (Bedivere List Relic #2)
    '#..%%%%..#', // Desynchronizing Market Walls (%)
    '#..N..N..#', // Border Town NPCs (Calm, Linger, Feral)
    '#........#',
    '...P..N...',
    '...P.....',
    '#........#',
    '##########',
  ],
  cache: {
    scrap: 25,
    items: [
      { itemId: 'bedivere_relic', count: 1 },
      { itemId: 'grail_water', count: 1 },
    ],
    toast: 'LOOTED: +25 SCRAP, BEDIVERE RELIC (2/3) & GRAIL WATER',
  },
};
