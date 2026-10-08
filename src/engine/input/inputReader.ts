/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ButtonKey, GameInput, GamepadButtons } from '../../types/input';
import { gamepadStore } from './gamepadStore';

export class InputReader {
  private prevHeld: Partial<GamepadButtons> = {};

  /**
   * Reads current input state once per frame and calculates edge transitions (pressed).
   */
  public read(): GameInput {
    const held = gamepadStore.getState();
    const stick = gamepadStore.getStick();
    const pressed = {} as GamepadButtons;

    (Object.keys(held) as ButtonKey[]).forEach((k) => {
      pressed[k] = Boolean(held[k] && !this.prevHeld[k]);
    });

    this.prevHeld = held;
    return { held, pressed, stick };
  }

  public reset(): void {
    this.prevHeld = {};
  }
}

export const inputReader = new InputReader();
