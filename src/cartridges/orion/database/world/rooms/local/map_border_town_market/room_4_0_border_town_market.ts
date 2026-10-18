/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../../types';

export const room40BorderTownMarket: RoomDefinition = {
  id: 'room_4_0_border_town_market',
  scope: 'local',
  coord: '4,0',
  mapId: 'map_border_town_market',
  areaId: 'border_town_slums',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  title: 'Border Town Market',
  bannerTitle: 'CAMELOT BORDER TOWN · DESYNC MARKET & WAYSTATION',
  grid: [
    '####..####', // North passage to Barracks (4,-1)
    '#..1..C..#', // Hidden Switch #1 (1) & Market Cache (Bedivere List Relic #2)
    '#..%%%%..#', // Desynchronizing Market Walls (%)
    '#..N..N..#', // Border Town NPCs (Calm, Linger, Feral)
    '#......A.#', // Border Town Æther Waystation (A)
    '...P..N...',
    '...P......',
    '#........#',
    '####..####', // South passage to global desync arcade (4,1)
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
