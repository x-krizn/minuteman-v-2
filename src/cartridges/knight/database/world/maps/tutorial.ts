/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tutorial map layout containing the fixed introductory chambers:
 * - 0,0: Awakening Chamber (intro jump tutorial with platform ledge)
 * - 1,0: Combat Grounds (crawler enemy and coin caches)
 * - 2,0: Key Chamber & Locked Gate (vertical drop, key puzzle, and locked exit)
 * - 3,0: Treasury / Gem Vault (gem rewards)
 * - 1,-1: The Hidden Belfry (secret room with rare drops)
 */
export const TUTORIAL_ROOMS: Record<string, string[]> = {
  '0,0': [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#..ooo...#',
    '#..#####.#',
    '#......#..',
    '#......#..',
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
    '.G.B.Y.P.O.',
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
    '#.E...KH.#',
    '####..####',
  ],
};

export const TUTORIAL_GREEN: Record<string, number> = {
  '0,0': 1,
  '1,0': 1,
  '2,0': 1,
  '3,0': 1,
  '1,-1': 1,
};

// Aliases for backwards compatibility with legacy level systems
export const INITIAL_ROOMS = TUTORIAL_ROOMS;
export const INITIAL_GREEN = TUTORIAL_GREEN;
