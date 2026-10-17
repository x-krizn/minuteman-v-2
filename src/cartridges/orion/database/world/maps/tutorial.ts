/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Canonical M00 — The Bog Map Layout:
 * Grid of 10x9 rooms adhering to the Anchored Procedural Wraparound (APW) model:
 * - '0,0': Drop-Pod Crater (White Spawn Anchor, initial boot & basic controls)
 * - '1,0': Fallen Scout Ridge (Magenta Micro-Setpiece with Khopesh, Booster Kit, Bedivere's Ring)
 * - '1,-1': Sunken Cache Island (Secret northern sinkhole chamber with field repair kits)
 * - '2,0': Marshlands & Sinkhole Crossings (Bog Crawler encounters, practicing tells & defense layers)
 * - '3,0': Perimeter Fortification & Rusted Gate (Blue Transition Anchor leading to Border Town Slums)
 * - '4,0': Border Town Slums Outskirts (Levels 3–4 safe perimeter and scavenger depot)
 */
export const ORION_TUTORIAL_ROOMS: Record<string, string[]> = {
  '0,0': [
    '##########',
    '#........#',
    '#..P..P..#',
    '#...D....#', // Drop-Pod Crater (White Spawn Anchor)
    '#........#',
    '#..~~~~...', // Corrosive Bog Water (~)
    '#..~~~~...',
    '#........#',
    '##########',
  ],
  '1,0': [
    '####..####',
    '#........#',
    '#...S....#', // Bedivere / Fallen Scout (Booster Kit, Khopesh, Signet Ring, Numbered List)
    '#........#',
    '#..____..#',
    '...____...',
    '..........',
    '#........#',
    '##########',
  ],
  '1,-1': [
    '##########',
    '#..P..P..#',
    '#...C....#', // Supply Cache (contains Bedivere List Relic #1)
    '#.~~..~~.#',
    '#........#',
    '#..P..P..#',
    '#........#',
    '#........#',
    '####..####',
  ],
  '2,0': [
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
  '3,0': [
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
  '4,0': [
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
  '4,-1': [
    '##########',
    '#..2..C..#', // Hidden Switch #2 (2) & Barracks Cache (Bedivere List Relic #3)
    '#..K..T..#', // Sir Percival (K) & Sir Tristan (T)
    '#........#',
    '#...o....#', // Orc Pair in the Barracks
    '#..P..P..#',
    '#........#',
    '#........#',
    '####..####',
  ],
  '5,0': [
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

export interface OrionRoomMetadata {
  title: string;
  bannerTitle: string;
  areaId: string;
}

export interface OrionCacheDefinition {
  scrap: number;
  items: Array<{ itemId: string; count: number }>;
  toast: string;
}

export const ORION_ROOM_METADATA: Record<string, OrionRoomMetadata> = {
  '0,0': {
    title: 'Drop-Pod Crater',
    bannerTitle: 'M00: DROP-POD CRATER (SPAWN ANCHOR)',
    areaId: 'm00_the_bog',
  },
  '1,0': {
    title: 'Fallen Scout Ridge',
    bannerTitle: 'FALLEN SCOUT RIDGE · SIR BEDIVERE',
    areaId: 'm00_the_bog',
  },
  '1,-1': {
    title: 'Sunken Sinkhole Island',
    bannerTitle: 'SUNKEN SINKHOLE ISLAND (SECRET)',
    areaId: 'm00_the_bog',
  },
  '2,0': {
    title: 'The Poe & Deep Bog',
    bannerTitle: 'DEEP BOG · THE POE & SUBMERGED WURM',
    areaId: 'm00_the_bog',
  },
  '3,0': {
    title: 'Bog Perimeter Gateway',
    bannerTitle: 'BOG EXIT PERIMETER · ORC PAIR',
    areaId: 'm00_the_bog',
  },
  '4,0': {
    title: 'Border Town Market',
    bannerTitle: 'CAMELOT BORDER TOWN · DESYNC MARKET',
    areaId: 'border_town_slums',
  },
  '4,-1': {
    title: 'Border Town Barracks',
    bannerTitle: 'BORDER TOWN BARRACKS · PERCIVAL & TRISTAN',
    areaId: 'border_town_slums',
  },
  '5,0': {
    title: 'Border Town Cathedral',
    bannerTitle: 'CATHEDRAL COURTYARD · SIR BORS & DUNGEON DOOR',
    areaId: 'border_town_slums',
  },
};

export const ORION_CACHE_DEFINITIONS: Record<string, OrionCacheDefinition> = {
  '1,-1': {
    scrap: 35,
    items: [
      { itemId: 'bedivere_relic', count: 1 },
      { itemId: 'corrupted_shard', count: 1 },
      { itemId: 'repair_kit', count: 2 },
    ],
    toast: "LOOTED: +35 SCRAP, BEDIVERE RELIC (1/3), SHARD & REPAIR KITS",
  },
  '4,0': {
    scrap: 25,
    items: [
      { itemId: 'bedivere_relic', count: 1 },
      { itemId: 'grail_water', count: 1 },
    ],
    toast: "LOOTED: +25 SCRAP, BEDIVERE RELIC (2/3) & GRAIL WATER",
  },
  '4,-1': {
    scrap: 30,
    items: [
      { itemId: 'bedivere_relic', count: 1 },
      { itemId: 'repair_kit', count: 2 },
    ],
    toast: "LOOTED: +30 SCRAP, BEDIVERE RELIC (3/3) & REPAIR KITS",
  },
  default: {
    scrap: 20,
    items: [{ itemId: 'grail_water', count: 1 }],
    toast: 'LOOTED: +20 SCRAP & GRAIL WATER',
  },
};

export const ORION_INITIAL_ROOMS = ORION_TUTORIAL_ROOMS;
