/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttackVariant, StatType } from './types';

export * from './assets';

/**
 * World grid tile dimension (`16` `px` square).
 */
export const TILE_SIZE = 16;
/**
 * Default single-screen room width in tiles (`10` `tiles` = `160` `px`).
 */
export const COLS = 10;
/**
 * Default single-screen room height in tiles (`9` `tiles` = `144` `px`).
 */
export const ROWS = 9;
/**
 * Native Orion viewport width (`160` `px`, equivalent to `10` `tiles` at `16` `px` per tile).
 */
export const SCREEN_W = 160;
/**
 * Native Orion viewport height (`144` `px`, equivalent to `9` `tiles` at `16` `px` per tile).
 */
export const SCREEN_H = 144;

/**
 * Exported const `HALF_WIDTH` (half width) in `constants.ts`.
 */
export const HALF_WIDTH = 4.5;
/**
 * Exported const `BODY_HEIGHT` (body height) in `constants.ts`.
 */
export const BODY_HEIGHT = 13;

/**
 * Downward vertical acceleration (`380` `px/s²` along the `z` axis) applied while airborne.
 */
export const GRAVITY = 700;
/**
 * Initial vertical jump impulse (`135` `px/s` along the `z` axis).
 */
export const JUMP_VELOCITY = 270;
/**
 * Exported const `RUN_SPEED` (run speed) in `constants.ts`.
 */
export const RUN_SPEED = 60;
/**
 * Exported const `SPRINT_SPEED` (sprint speed) in `constants.ts`.
 */
export const SPRINT_SPEED = 95;
/**
 * Exported const `DASH_SPEED` (dash speed) in `constants.ts`.
 */
export const DASH_SPEED = 180;
/**
 * Exported const `DASH_DURATION` (dash duration) in `constants.ts`.
 */
export const DASH_DURATION = 0.16;
/**
 * Exported const `DASH_COOLDOWN` (dash cooldown) in `constants.ts`.
 */
export const DASH_COOLDOWN = 0.35;
/**
 * Exported const `MAX_FALL_SPEED` (max fall speed) in `constants.ts`.
 */
export const MAX_FALL_SPEED = 320;

/**
 * Exported const `CHARGE_TIME_REQUIRED` (charge time required) in `constants.ts`.
 */
export const CHARGE_TIME_REQUIRED = 0.45;
/**
 * Exported const `PARRY_WINDOW_DURATION` (parry window duration) in `constants.ts`.
 */
export const PARRY_WINDOW_DURATION = 0.15;
/**
 * Exported const `STAMINA_REGEN_RATE` (stamina regen rate) in `constants.ts`.
 */
export const STAMINA_REGEN_RATE = 2.5; // SP per second

/**
 * Exported const `INITIAL_START` (initial start) in `constants.ts`.
 */
export const INITIAL_START = { room: '0,0', x: 32, y: 128 };
/**
 * Exported const `BG_COLOR` (bg color) in `constants.ts`.
 */
export const BG_COLOR = '#000000';

/**
 * Exported const `STAT_COLORS` (stat colors) in `constants.ts`.
 */
export const STAT_COLORS: Record<StatType, string> = {
  hp: '#ff5555',
  ap: '#44cc44',
  ep: '#6666ff',
  sp: '#cccc44',
};

/**
 * Sword Moves: Directional Ground & Jump Attacks.
 */
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
