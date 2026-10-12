/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttackVariant, StatType } from './types';

export * from './assets';

export const TILE_SIZE = 16;
export const COLS = 10;
export const ROWS = 9;
export const SCREEN_W = 160;
export const SCREEN_H = 144;

export const HALF_WIDTH = 5;
export const BODY_HEIGHT = 16;

export const GRAVITY = 700;
export const JUMP_VELOCITY = 270;
export const RUN_SPEED = 60;
export const SPRINT_SPEED = 95;
export const DASH_SPEED = 180;
export const DASH_DURATION = 0.16;
export const DASH_COOLDOWN = 0.35;
export const MAX_FALL_SPEED = 320;

export const CHARGE_TIME_REQUIRED = 0.45;
export const PARRY_WINDOW_DURATION = 0.15;
export const STAMINA_REGEN_RATE = 2.5; // SP per second

export const INITIAL_START = { room: '0,0', x: 32, y: 128 };
export const BG_COLOR = '#000000';

export const STAT_COLORS: Record<StatType, string> = {
  hp: '#ff5555',
  ap: '#44cc44',
  ep: '#6666ff',
  sp: '#cccc44',
};

// Sword Moves: Directional Ground & Jump Attacks
export const SWORD_ATTACKS: AttackVariant[] = [
  { x0: 2, x1: 15, y0: 4, y1: 8 }, // 0: neutral ground stab
  { x0: -6, x1: 6, y0: -14, y1: -2 }, // 1: upward ground anti-air slash
  { x0: 3, x1: 15, y0: 3, y1: 13 }, // 2: forward ground slash
  { x0: 2, x1: 14, y0: 6, y1: 16 }, // 3: low ground poke
  { x0: 0, x1: 18, y0: -6, y1: 16 }, // 4: heavy charged forward strike
  { x0: 3, x1: 16, y0: 2, y1: 14 }, // 5: aerial forward jump slash
  { x0: -8, x1: 8, y0: -16, y1: -4 }, // 6: aerial upward jump slash
  { x0: -6, x1: 6, y0: 4, y1: 18 }, // 7: aerial downward jump thrust (pogo)
];
