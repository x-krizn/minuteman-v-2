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
    '#..~~~~...',
    '#..~~~~...',
    '#........#',
    '##########',
  ],
  '1,0': [
    '####..####',
    '#........#',
    '#...S....#', // Fallen Scout (Magenta Micro-Setpiece: Khopesh & Booster Kit)
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
    '#...C....#', // Supply Cache
    '#.~~..~~.#',
    '#........#',
    '#..P..P..#',
    '#........#',
    '#........#',
    '####..####',
  ],
  '2,0': [
    '##########',
    '#........#',
    '#..P..P..#',
    '#...E....#', // Bog Crawler
    '#........#',
    '..........',
    '..........',
    '#........#',
    '##########',
  ],
  '3,0': [
    '##########',
    '#........#',
    '#..P..P..#',
    '#...B....#', // Sir Bors / Heavy Guardian
    '#........#',
    '.......G..', // Rusted Gate (Blue Transition Anchor)
    '.......G..',
    '#........#',
    '##########',
  ],
  '4,0': [
    '##########',
    '#..~~~~..#',
    '#...C....#', // Scavenger Depot Cache
    '#........#',
    '#...P....#',
    '...P..P..#',
    '...P..P..#',
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
    bannerTitle: 'FALLEN SCOUT RIDGE (MICRO-SETPIECE)',
    areaId: 'm00_the_bog',
  },
  '1,-1': {
    title: 'Sunken Sinkhole Island',
    bannerTitle: 'SUNKEN SINKHOLE ISLAND (SECRET)',
    areaId: 'm00_the_bog',
  },
  '2,0': {
    title: 'Marsh Sinkhole Crossings',
    bannerTitle: 'MARSH SINKHOLE CROSSINGS',
    areaId: 'm00_the_bog',
  },
  '3,0': {
    title: 'Rusted Perimeter Gateway',
    bannerTitle: 'PERIMETER FORTIFICATION · SIR BORS',
    areaId: 'm00_the_bog',
  },
  '4,0': {
    title: 'Border Town Slums',
    bannerTitle: 'BORDER TOWN SLUMS OUTSKIRTS',
    areaId: 'border_town_slums',
  },
};

export const ORION_CACHE_DEFINITIONS: Record<string, OrionCacheDefinition> = {
  '1,-1': {
    scrap: 35,
    items: [
      { itemId: 'corrupted_shard', count: 1 },
      { itemId: 'repair_kit', count: 2 },
    ],
    toast: 'LOOTED: +35 SCRAP, CORRUPTED SHARD, REPAIR KITS',
  },
  default: {
    scrap: 20,
    items: [{ itemId: 'grail_water', count: 1 }],
    toast: 'LOOTED: +20 SCRAP & GRAIL WATER',
  },
};

export const ORION_INITIAL_ROOMS = ORION_TUTORIAL_ROOMS;
