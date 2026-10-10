/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ButtonKey, GameInput, GamepadButtons } from '../../types/input';
import { gamepadStore } from './gamepadStore';
import { hardwareGamepad } from './hardwareGamepad';

export class InputReader {
  private prevHeld: Partial<GamepadButtons> = {};

  /**
   * Reads current input state once per frame and calculates edge transitions (pressed).
   */
  public read(): GameInput {
    // 1. Poll physical hardware gamepads via HTML5 Gamepad API
    hardwareGamepad.poll();

    const held = gamepadStore.getState();
    const rawStick = gamepadStore.getStick();

    // 2. Unify Analog Stick and Digital D-Pad into seamless dual representations
    let unifiedX = rawStick.x;
    let unifiedY = rawStick.y;

    if (unifiedX === 0) {
      if (held.left) unifiedX = -1;
      else if (held.right) unifiedX = 1;
    }
    if (unifiedY === 0) {
      if (held.up) unifiedY = -1;
      else if (held.down) unifiedY = 1;
    }

    // Ensure digital directional buttons reflect analog stick tilt beyond threshold
    if (unifiedX < -0.35) held.left = true;
    if (unifiedX > 0.35) held.right = true;
    if (unifiedY < -0.35) held.up = true;
    if (unifiedY > 0.35) held.down = true;

    const stick = { x: unifiedX, y: unifiedY };
    const pressed = {} as GamepadButtons;

    (Object.keys(held) as ButtonKey[]).forEach((k) => {
      pressed[k] = Boolean(held[k] && !this.prevHeld[k]);
    });

    this.prevHeld = { ...held };
    return { held, pressed, stick };
  }

  public reset(): void {
    this.prevHeld = {};
  }
}

export const inputReader = new InputReader();
