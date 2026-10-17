/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COLS, ROWS } from '../../../constants';

/**
 * Procedural 2.5D Floor Generator
 * Generates an interconnected network of rooms with doorways, chasms, pillars, and enemy spawns.
 */
export function build25dFloor(
  depth: number = 1
): { rooms: Record<string, string[]>; startRoom: string } {
  const rooms: Record<string, string[]> = {};
  const visited = new Set<string>();
  const coords: Array<{ rx: number; ry: number }> = [{ rx: 0, ry: 0 }];
  visited.add('0,0');

  const targetCount = 6 + depth * 2;
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  while (coords.length < targetCount) {
    const parent = coords[Math.floor(Math.random() * coords.length)];
    const d = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = parent.rx + d.dx;
    const ny = parent.ry + d.dy;
    const key = `${nx},${ny}`;
    if (!visited.has(key)) {
      visited.add(key);
      coords.push({ rx: nx, ry: ny });
    }
  }

  // Create room matrices with doors aligned to adjacent rooms
  for (const c of coords) {
    const key = `${c.rx},${c.ry}`;
    const hasNorth = visited.has(`${c.rx},${c.ry - 1}`);
    const hasSouth = visited.has(`${c.rx},${c.ry + 1}`);
    const hasEast = visited.has(`${c.rx + 1},${c.ry}`);
    const hasWest = visited.has(`${c.rx - 1},${c.ry}`);

    const grid: string[][] = [];
    for (let y = 0; y < ROWS; y++) {
      grid[y] = [];
      for (let x = 0; x < COLS; x++) {
        const isBorder = x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1;
        grid[y][x] = isBorder ? '#' : '.';
      }
    }

    // Carve doorways
    if (hasNorth) {
      grid[0][4] = '.';
      grid[0][5] = '.';
    }
    if (hasSouth) {
      grid[ROWS - 1][4] = '.';
      grid[ROWS - 1][5] = '.';
    }
    if (hasWest) {
      grid[4][0] = '.';
      grid[5][0] = '.';
    }
    if (hasEast) {
      grid[4][COLS - 1] = '.';
      grid[5][COLS - 1] = '.';
    }

    // Add 2.5D interior features (pillars, chasms, water basins, chests, enemies)
    if (c.rx === 0 && c.ry === 0) {
      // Starting sanctuary
      grid[3][4] = 'M'; // Save Monolith
      grid[2][2] = 'P';
      grid[2][7] = 'P';
    } else {
      const roll = Math.random();
      if (roll < 0.25) {
        // Chasm room
        grid[3][3] = '_';
        grid[3][4] = '_';
        grid[3][5] = '_';
        grid[3][6] = '_';
        grid[4][3] = 'E';
      } else if (roll < 0.5) {
        // Water sanctuary
        grid[3][3] = '~';
        grid[3][4] = '~';
        grid[4][3] = '~';
        grid[4][4] = '~';
        grid[2][5] = 'C';
      } else if (roll < 0.75) {
        // Pillar arena
        grid[2][2] = 'P';
        grid[2][7] = 'P';
        grid[6][2] = 'P';
        grid[6][7] = 'P';
        grid[4][4] = 'E';
      } else {
        // Enemy den
        grid[3][3] = 'E';
        grid[5][6] = 'E';
      }
    }

    rooms[key] = grid.map((r) => r.join(''));
  }

  return { rooms, startRoom: '0,0' };
}
