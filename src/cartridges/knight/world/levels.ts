/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomTemplate, roomFromLegacy } from './roomSystem';

export const INITIAL_ROOMS: Record<string, string[]> = {
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
    '.....H....',
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
    '#.E....K.#',
    '####..####',
  ],
};

export const INITIAL_GREEN: Record<string, number> = {
  '0,0': 1,
  '1,0': 1,
  '2,0': 1,
  '3,0': 1,
  '1,-1': 1,
};

export function buildStaticRoomTemplates(): Record<string, RoomTemplate> {
  const out: Record<string, RoomTemplate> = {};
  Object.entries(INITIAL_ROOMS).forEach(([key, tiles]) => {
    out[key] = roomFromLegacy(key, tiles, INITIAL_GREEN[key] ? 'green' : 'stone');
  });
  return out;
}