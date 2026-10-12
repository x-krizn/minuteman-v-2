/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomOpenings } from './proceduralFloor';
import { parseImageUrlToRoom } from './bitmapParser';

/**
 * Socket Key generator: e.g. { N: true, S: true, E: true, W: false } -> "ENS"
 */
export function getSocketKey(m: RoomOpenings): string {
  const parts: string[] = [];
  if (m.N) parts.push('N');
  if (m.S) parts.push('S');
  if (m.E) parts.push('E');
  if (m.W) parts.push('W');
  return parts.sort().join('') || 'NONE';
}

/**
 * Handcrafted 10x9 room templates categorized by door socket configuration.
 * All templates respect the standard socket openings:
 * - N (North/Up): row 0, cols 4..5 open ('.')
 * - S (South/Down): row 8, cols 4..5 open ('.')
 * - W (West/Left): col 0, rows 6..7 open ('.')
 * - E (East/Right): col 9, rows 6..7 open ('.')
 */
export const PRESET_ROOM_TEMPLATES: Record<string, string[][]> = {
  // Horizontal Hallway (E + W)
  EW: [
    // Variant 1: Dual Pillar Bridges
    [
      '##########',
      '#........#',
      '#........#',
      '#..##..##.',
      '#........#',
      '#........#',
      '..........',
      '..........',
      '##########',
    ],
    // Variant 2: Stepped Stele Walkway
    [
      '##########',
      '#........#',
      '#...##...#',
      '#........#',
      '#.####.##.',
      '#........#',
      '..........',
      '..........',
      '##########',
    ],
    // Variant 3: Sunken Aqueduct with Upper Ledge
    [
      '##########',
      '#........#',
      '#.######.#',
      '#........#',
      '#........#',
      '#........#',
      '..........',
      '..........',
      '##########',
    ],
  ],

  // Vertical Shaft (N + S)
  NS: [
    // Variant 1: Alternating Wall Ledges (wall-jump & ladder chute)
    [
      '####..####',
      '#........#',
      '#.###....#',
      '#........#',
      '#....###.#',
      '#........#',
      '#.###....#',
      '#........#',
      '####..####',
    ],
    // Variant 2: Central Stepping Stones
    [
      '####..####',
      '#........#',
      '#...##...#',
      '#........#',
      '#..####..#',
      '#........#',
      '#...##...#',
      '#........#',
      '####..####',
    ],
  ],

  // Full 4-Way Junction (E + N + S + W)
  ENSW: [
    // Variant 1: Cruciform Arena with Central Battlement
    [
      '####..####',
      '#........#',
      '#........#',
      '#..####..#',
      '#........#',
      '#........#',
      '..........',
      '..........',
      '####..####',
    ],
    // Variant 2: Tiered Gallery with Drop Chutes
    [
      '####..####',
      '#........#',
      '#.##..##.#',
      '#........#',
      '#..####..#',
      '#........#',
      '..........',
      '..........',
      '####..####',
    ],
  ],

  // T-Junctions
  // East + South + West
  ESW: [
    [
      '##########',
      '#........#',
      '#........#',
      '#..####..#',
      '#........#',
      '#........#',
      '..........',
      '..........',
      '####..####',
    ],
  ],

  // East + North + West
  ENW: [
    [
      '####..####',
      '#........#',
      '#...##...#',
      '#........#',
      '#.######.#',
      '#........#',
      '..........',
      '..........',
      '##########',
    ],
  ],

  // North + South + West
  NSW: [
    [
      '####..####',
      '#........#',
      '#...##...#',
      '#........#',
      '#.####...#',
      '#........#',
      '..........',
      '.....#####',
      '####..####',
    ],
  ],

  // East + North + South
  ENS: [
    [
      '####..####',
      '#........#',
      '#...##...#',
      '#........#',
      '#...####.#',
      '#........#',
      '#####.....',
      '#####.....',
      '####..####',
    ],
  ],

  // Corners
  // East + South (ES)
  ES: [
    [
      '##########',
      '#........#',
      '#........#',
      '#...##...#',
      '#...####.#',
      '#........#',
      '#####.....',
      '#####.....',
      '####..####',
    ],
  ],

  // South + West (SW)
  SW: [
    [
      '##########',
      '#........#',
      '#........#',
      '#..##....#',
      '#.####...#',
      '#........#',
      '.....#####',
      '.....#####',
      '####..####',
    ],
  ],

  // East + North (EN)
  EN: [
    [
      '####..####',
      '#........#',
      '#........#',
      '#....###.#',
      '#........#',
      '#...####.#',
      '#####.....',
      '#####.....',
      '##########',
    ],
  ],

  // North + West (NW)
  NW: [
    [
      '####..####',
      '#........#',
      '#........#',
      '#.###....#',
      '#........#',
      '#.####...#',
      '.....#####',
      '.....#####',
      '##########',
    ],
  ],

  // Dead Ends (1 exit)
  // West only (W)
  W: [
    [
      '##########',
      '#........#',
      '#........#',
      '#..####..#',
      '#........#',
      '#........#',
      '.....#####',
      '.....#####',
      '##########',
    ],
  ],

  // East only (E)
  E: [
    [
      '##########',
      '#........#',
      '#........#',
      '#..####..#',
      '#........#',
      '#........#',
      '#####.....',
      '#####.....',
      '##########',
    ],
  ],

  // North only (N)
  N: [
    [
      '####..####',
      '#........#',
      '#..####..#',
      '#........#',
      '#.######.#',
      '#........#',
      '#........#',
      '#........#',
      '##########',
    ],
  ],

  // South only (S)
  S: [
    [
      '##########',
      '#........#',
      '#..####..#',
      '#........#',
      '#.######.#',
      '#........#',
      '#........#',
      '#........#',
      '####..####',
    ],
  ],
};

/**
 * Dropped-in PNG templates discovered dynamically via Vite.
 * Users can drop any 10x9 PNG into `src/cartridges/knight/assets/maps/dynamic/`
 * named e.g. `EW_corridor.png`, `NS_shaft.png`, `W_vault.png`, `ENSW_cross.png`.
 */
const dynamicMapFiles = import.meta.glob(
  '../assets/maps/dynamic/*.png',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

export const CUSTOM_DYNAMIC_TEMPLATES: Record<string, string[][]> = {};

// Asynchronously parse any committed dynamic template PNGs
export async function initCustomDynamicTemplates(): Promise<void> {
  for (const [path, url] of Object.entries(dynamicMapFiles)) {
    // Extract socket prefix from filename, e.g. "EW_corridor.png" -> "EW"
    const filename = path.split('/').pop() || '';
    const socketPrefix = filename.split('_')[0]?.toUpperCase();
    if (!socketPrefix) continue;

    try {
      const parsed = await parseImageUrlToRoom(url);
      if (parsed.tiles && parsed.tiles.length === 9) {
        if (!CUSTOM_DYNAMIC_TEMPLATES[socketPrefix]) {
          CUSTOM_DYNAMIC_TEMPLATES[socketPrefix] = [];
        }
        CUSTOM_DYNAMIC_TEMPLATES[socketPrefix].push(parsed.tiles);
      }
    } catch (err) {
      console.warn(`Failed to parse dynamic template ${path}:`, err);
    }
  }
}

// Kick off async parse in background
initCustomDynamicTemplates();

/**
 * Retrieves a matching template for a room's socket configuration.
 * Checks custom dropped-in templates first, then preset templates, and falls back to null.
 */
export function getMatchingRoomTemplate(m: RoomOpenings): string[] | null {
  const key = getSocketKey(m);

  // 1. Check custom user-committed PNG templates
  const customList = CUSTOM_DYNAMIC_TEMPLATES[key];
  if (customList && customList.length > 0) {
    const choice = customList[Math.floor(Math.random() * customList.length)];
    return [...choice];
  }

  // 2. Check preset authored templates
  const presetList = PRESET_ROOM_TEMPLATES[key];
  if (presetList && presetList.length > 0) {
    const choice = presetList[Math.floor(Math.random() * presetList.length)];
    return [...choice];
  }

  return null;
}
