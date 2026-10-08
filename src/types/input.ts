/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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

export interface StickVector {
  x: number; // -1 to +1 (left to right)
  y: number; // -1 to +1 (up to down)
}

export type GamepadButtons = Record<ButtonKey, boolean>;

export interface GameInput {
  held: GamepadButtons;
  pressed: GamepadButtons;
  stick: StickVector;
}
