/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KnightState } from './types';

export interface RoomOpenings {
  N: boolean;
  S: boolean;
  E: boolean;
  W: boolean;
}

export const DIRS: Record<'N' | 'S' | 'E' | 'W', [number, number, 'N' | 'S' | 'E' | 'W']> = {
  N: [0, -1, 'S'],
  S: [0, 1, 'N'],
  E: [1, 0, 'W'],
  W: [-1, 0, 'E'],
};

export function floorSize(cleared: number): { cols: number; rows: number } {
  return {
    cols: Math.min(10, 3 + cleared),
    rows: Math.min(5, 2 + Math.floor(cleared / 2)),
  };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function withTile(room: string[], r: number, c: number, ch: string): string[] {
  return room.map((row, y) =>
    y === r ? row.slice(0, c) + ch + row.slice(c + 1) : row
  );
}

export function makeCell(m: RoomOpenings, decor: number): string[] {
  const g: string[][] = [];
  for (let r = 0; r < 9; r++) {
    const row: string[] = [];
    for (let c = 0; c < 10; c++) {
      let ch = '.';
      if (r === 0) ch = m.N && (c === 4 || c === 5) ? '.' : '#';
      else if (r === 8) ch = m.S && (c === 4 || c === 5) ? '.' : '#';
      else if (c === 0) ch = m.W && r >= 6 ? '.' : '#';
      else if (c === 9) ch = m.E && r >= 6 ? '.' : '#';
      row.push(ch);
    }
    g.push(row);
  }

  if (m.N) {
    for (let c = 3; c <= 6; c++) g[3][c] = '#';
  } else if (decor === 1 && !m.S) {
    for (let c = 1; c <= 3; c++) {
      g[5][c] = '#';
      g[4][c] = 'o';
    }
  } else if (decor === 2 && !m.S) {
    for (let c = 6; c <= 8; c++) g[5][c] = '#';
    g[4][7] = 'o';
  } else if (decor === 3 && !m.S) {
    g[7][4] = '#';
    g[7][5] = '#';
  }

  return g.map((row) => row.join(''));
}

export function buildFloor(
  state: KnightState,
  roomsMap: Record<string, string[]>,
  greenRooms: Record<string, number>,
  safeRooms: Record<string, number>
): void {
  const { cols, rows } = floorSize(state.cleared);
  const x0 = state.nextStart.x;
  const sr = Math.floor(Math.random() * rows);
  const y0 = state.nextStart.y - sr;

  const open: RoomOpenings[][] = [];
  for (let c = 0; c < cols; c++) {
    open.push([]);
    for (let r = 0; r < rows; r++) {
      open[c].push({ N: false, S: false, E: false, W: false });
    }
  }

  const inside = (c: number, r: number) => c >= 0 && c < cols && r >= 0 && r < rows;

  const canLink = (c: number, r: number, d: 'N' | 'S' | 'E' | 'W') => {
    const nc = c + DIRS[d][0];
    const nr = r + DIRS[d][1];
    if (d === 'N') return !open[c][r].S && !open[nc][nr].N;
    if (d === 'S') return !open[c][r].N && !open[nc][nr].S;
    return true;
  };

  const link = (c: number, r: number, d: 'N' | 'S' | 'E' | 'W') => {
    const nc = c + DIRS[d][0];
    const nr = r + DIRS[d][1];
    open[c][r][d] = true;
    open[nc][nr][DIRS[d][2]] = true;
  };

  const seen: Record<string, boolean> = { [`0,${sr}`]: true };
  const stack: [number, number][] = [[0, sr]];

  while (stack.length) {
    const [c, r] = stack[stack.length - 1];
    const opts = (['N', 'S', 'E', 'W'] as const).filter(
      (d) =>
        inside(c + DIRS[d][0], r + DIRS[d][1]) &&
        !seen[`${c + DIRS[d][0]},${r + DIRS[d][1]}`] &&
        canLink(c, r, d)
    );
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const d = pick(opts);
    link(c, r, d);
    seen[`${c + DIRS[d][0]},${r + DIRS[d][1]}`] = true;
    stack.push([c + DIRS[d][0], r + DIRS[d][1]]);
  }

  for (let i = Math.floor(cols * rows * 0.15); i > 0; i--) {
    const c = Math.floor(Math.random() * cols);
    const r = Math.floor(Math.random() * rows);
    const d = pick(['N', 'S', 'E', 'W'] as const);
    if (inside(c + DIRS[d][0], r + DIRS[d][1]) && canLink(c, r, d)) {
      link(c, r, d);
    }
  }

  const dist: Record<string, number> = { [`0,${sr}`]: 0 };
  const q: [number, number][] = [[0, sr]];
  while (q.length) {
    const [c, r] = q.shift()!;
    (['N', 'S', 'E', 'W'] as const).forEach((d) => {
      const nc = c + DIRS[d][0];
      const nr = r + DIRS[d][1];
      if (open[c][r][d] && dist[`${nc},${nr}`] === undefined) {
        dist[`${nc},${nr}`] = dist[`${c},${r}`] + 1;
        q.push([nc, nr]);
      }
    });
  }

  const deg = (c: number, r: number) =>
    (['N', 'S', 'E', 'W'] as const).filter((d) => open[c][r][d]).length;

  let door = [cols - 1, 0];
  for (let r = 0; r < rows; r++) {
    if (dist[`${cols - 1},${r}`] > dist[`${door[0]},${door[1]}`]) {
      door = [cols - 1, r];
    }
  }

  let keyCell: [number, number] | null = null;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (
        (c === 0 && r === sr) ||
        (c === door[0] && r === door[1]) ||
        deg(c, r) !== 1
      ) {
        continue;
      }
      if (!keyCell || dist[`${c},${r}`] > dist[`${keyCell[0]},${keyCell[1]}`]) {
        keyCell = [c, r];
      }
    }
  }

  if (!keyCell) {
    keyCell = [Math.floor(cols / 2), sr === 0 ? 1 : 0];
  }

  const enemyProb = Math.min(0.85, 0.2 + 0.12 * state.cleared);

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const key = `${x0 + c},${y0 + r}`;
      const m = { ...open[c][r] };
      const isStart = c === 0 && r === sr;
      const isDoor = c === door[0] && r === door[1];
      const isKey = c === keyCell[0] && r === keyCell[1];

      if (isStart) m.W = true;
      if (isDoor) m.E = true;

      let room = makeCell(m, Math.floor(Math.random() * 4));

      if (isStart) {
        // Safe rooms: spawn coins by default; rare chance of potion
        if (Math.random() < 0.15) {
          room = withTile(room, 7, 6, '1');
        } else {
          room = withTile(room, 7, 6, 'o');
        }
        greenRooms[key] = 1;
        safeRooms[key] = 1;
      } else {
        if (isKey) {
          room = withTile(room, 7, 7, 'K');
        }
        let enemyCount = 0;
        [2, 7, 3, 6].forEach((col) => {
          if (
            !m.S &&
            enemyCount < 2 &&
            room[7][col] === '.' &&
            Math.random() < enemyProb
          ) {
            room = withTile(room, 7, col, 'E');
            enemyCount++;
          }
        });

        if (room[7][1] === '.' && Math.random() < 0.4) {
          room = withTile(room, 7, 1, 'o');
        }
        // Dead ends: significantly reduced potion frequency (rare 12% drop, otherwise coins or gems)
        if (deg(c, r) === 1 && room[7][8] === '.') {
          const rand = Math.random();
          if (rand < 0.12) {
            room = withTile(room, 7, 8, Math.random() < 0.5 ? '1' : '3');
          } else if (rand < 0.45) {
            const gemOpts = ['H', 'G', 'B', 'Y', 'P', 'R', 'O'];
            room = withTile(room, 7, 8, pick(gemOpts));
          }
        }
      }

      if (isDoor) {
        room = withTile(withTile(room, 6, 9, '#'), 7, 9, 'L');
      }

      roomsMap[key] = room;
    }
  }

  state.nextStart = { x: x0 + cols, y: y0 + door[1] };
  state.floor = { x0, y0, cols, rows, start: [0, sr], door, key: keyCell, open };
}
