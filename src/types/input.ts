/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Canonical handheld button identifier (`up`, `down`, `left`, `right`, `a`, `b`, `x`, `y`, `l`, `r`, `start`, `select`).
 */
export type ButtonKey =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'a'
  | 'b'
  | 'x'
  | 'y'
  | 'l'
  | 'r'
  | 'start'
  | 'select';

/**
 * Normalized 2D directional input vector (`x`, `y` in `-1..1` and magnitude `0..1`).
 */
export interface StickVector {
  x: number; // -1 to +1 (left to right)
  y: number; // -1 to +1 (up to down)
}

/**
 * Boolean state map across all 12 canonical `ButtonKey` inputs.
 */
export type GamepadButtons = Record<ButtonKey, boolean>;

/**
 * Per-frame input snapshot providing held `buttons`, edge-triggered `justPressed`/`justReleased`, and analog `stick` vector.
 */
export interface GameInput {
  held: GamepadButtons;
  pressed: GamepadButtons;
  stick: StickVector;
}
