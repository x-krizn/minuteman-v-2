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

export const ORION_INITIAL_ROOMS = ORION_TUTORIAL_ROOMS;
