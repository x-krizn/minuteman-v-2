/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoundingBox, EnemyEntity, KnightState } from './types';
import {
  BODY_HEIGHT,
  COLS,
  HALF_WIDTH,
  ROWS,
  TILE_SIZE,
} from './constants';

export function solidChar(
  key: string,
  c: string,
  got: Record<string, boolean>
): boolean {
  return c === '#' || (c === 'L' && !got[`${key}:L`]);
}

export function neighbor(
  rooms: Record<string, string[]>,
  rx: number,
  ry: number,
  dx: number,
  dy: number
): string[] | undefined {
  return rooms[`${rx + dx},${ry + dy}`];
}

export function solidAt(
  rooms: Record<string, string[]>,
  state: KnightState,
  tx: number,
  ty: number
): boolean {
  if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
    const currentRoom = rooms[state.room];
    if (!currentRoom) return true;
    return solidChar(state.room, currentRoom[ty][tx], state.got);
  }

  const dx = tx < 0 ? -1 : tx >= COLS ? 1 : 0;
  const dy = ty < 0 ? -1 : ty >= ROWS ? 1 : 0;
  if (dx && dy) return true;

  const n = neighbor(rooms, state.rx, state.ry, dx, dy);
  if (!n) return true;

  const neighborKey = `${state.rx + dx},${state.ry + dy}`;
  return solidChar(
    neighborKey,
    n[(ty + ROWS) % ROWS][(tx + COLS) % COLS],
    state.got
  );
}

export function hits(
  rooms: Record<string, string[]>,
  state: KnightState,
  x: number,
  y: number
): boolean {
  const x0 = Math.floor((x - HALF_WIDTH) / TILE_SIZE);
  const x1 = Math.floor((x + HALF_WIDTH - 0.001) / TILE_SIZE);
  const y0 = Math.floor((y - BODY_HEIGHT) / TILE_SIZE);
  const y1 = Math.floor((y - 0.001) / TILE_SIZE);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (solidAt(rooms, state, tx, ty)) return true;
    }
  }
  return false;
}

export function moveX(
  rooms: Record<string, string[]>,
  state: KnightState,
  dx: number
): void {
  const sg = Math.sign(dx);
  let n = Math.abs(dx);
  while (n > 0) {
    const s = Math.min(1, n);
    if (hits(rooms, state, state.x + sg * s, state.y)) {
      state.vx = 0;
      return;
    }
    state.x += sg * s;
    n -= s;
  }
}

export function moveY(
  rooms: Record<string, string[]>,
  state: KnightState,
  dy: number
): void {
  state.ground = false;
  const sg = Math.sign(dy);
  let n = Math.abs(dy);
  while (n > 0) {
    const s = Math.min(1, n);
    if (hits(rooms, state, state.x, state.y + sg * s)) {
      if (sg > 0) {
        state.ground = true;
        state.y = Math.floor((state.y + s - 0.001) / TILE_SIZE) * TILE_SIZE;
      }
      state.vy = 0;
      return;
    }
    state.y += sg * s;
    n -= s;
  }
}

export function overlap(a: BoundingBox, b: BoundingBox): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

export function bodyBox(state: KnightState): BoundingBox {
  return {
    x0: state.x - HALF_WIDTH,
    x1: state.x + HALF_WIDTH,
    y0: state.y - BODY_HEIGHT,
    y1: state.y,
  };
}

export function enemyBox(e: EnemyEntity): BoundingBox {
  const h = e.type === 'sentry' ? 14 : e.type === 'wisp' ? 8 : 10;
  const w = e.type === 'sentry' ? 7 : 6;
  return {
    x0: e.x - w,
    x1: e.x + w,
    y0: e.y - h,
    y1: e.y,
  };
}

export const ROW_CEILING = 0;
export const ROW_WALL_A = 1;
export const ROW_FLOOR = 3;

export function isWall(
  rooms: Record<string, string[]>,
  state: KnightState,
  tx: number,
  ty: number
): boolean {
  return solidAt(rooms, state, tx, ty - 1) && solidAt(rooms, state, tx, ty + 1);
}

export function tileIndex(
  rooms: Record<string, string[]>,
  state: KnightState,
  tx: number,
  ty: number
): number {
  let row: number;
  if (!solidAt(rooms, state, tx, ty - 1)) {
    row = ROW_FLOOR;
  } else if (!solidAt(rooms, state, tx, ty + 1)) {
    row = ROW_CEILING;
  } else {
    let k = 0;
    while (
      ty - k - 1 >= 0 &&
      solidAt(rooms, state, tx, ty - k - 1) &&
      isWall(rooms, state, tx, ty - k - 1)
    ) {
      k++;
    }
    row = ROW_WALL_A + (k % 2);
  }

  const h =
    ((tx * 73856093) ^
      (ty * 19349663) ^
      (state.rx * 83492791) ^
      (state.ry * 49979687)) >>>
    0;
  return row * 4 + ((h >>> 8) % 4);
}
