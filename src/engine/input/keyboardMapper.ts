/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ButtonKey } from '../../types/input';
import { gamepadStore } from './gamepadStore';

const KEY_MAPPINGS: Record<string, ButtonKey> = {
  // D-pad directions
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',

  // Face Buttons
  KeyZ: 'a', // Jump (A)
  Space: 'a',
  KeyX: 'b', // Dash / Sprint (B)
  ShiftLeft: 'b',
  KeyC: 'x', // Attack / Charge (X)
  KeyJ: 'x',
  KeyV: 'y', // Block / Parry (Y)
  KeyK: 'y',

  // Bumpers / Skills
  KeyQ: 'l', // Skill 1 (L)
  KeyU: 'l',
  KeyE: 'r', // Skill 2 (R)
  KeyI: 'r',

  // System
  Enter: 'start',
  Tab: 'select',
  Backspace: 'select',
  Escape: 'select',
};

export class KeyboardMapper {
  private activeKeys: Set<string> = new Set();
  private attached = false;

  public init(): () => void {
    if (this.attached) return () => {};
    this.attached = true;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser scrolling on game keys
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }

      const button = KEY_MAPPINGS[e.code];
      if (button) {
        this.activeKeys.add(e.code);
        gamepadStore.setButtonState(button, true, false);
        this.updateDerivedStick();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const button = KEY_MAPPINGS[e.code];
      if (button) {
        this.activeKeys.delete(e.code);
        // Only release if no other key mapping to the same button is held
        const stillHeld = Array.from(this.activeKeys).some(
          (k) => KEY_MAPPINGS[k] === button
        );
        if (!stillHeld) {
          gamepadStore.setButtonState(button, false, false);
        }
        this.updateDerivedStick();
      }
    };

    const handleBlur = () => {
      this.activeKeys.clear();
      (
        [
          'up',
          'down',
          'left',
          'right',
          'a',
          'b',
          'x',
          'y',
          'l',
          'r',
          'start',
          'select',
        ] as ButtonKey[]
      ).forEach((btn) => {
        gamepadStore.setButtonState(btn, false, false);
      });
      gamepadStore.setStick(0, 0);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      this.attached = false;
    };
  }

  private updateDerivedStick(): void {
    let sx = 0;
    let sy = 0;
    const isHeld = (btn: ButtonKey) =>
      Array.from(this.activeKeys).some((k) => KEY_MAPPINGS[k] === btn);

    if (isHeld('left')) sx -= 1;
    if (isHeld('right')) sx += 1;
    if (isHeld('up')) sy -= 1;
    if (isHeld('down')) sy += 1;

    // Normalize diagonal so speed doesn't exceed 1
    if (sx !== 0 && sy !== 0) {
      const invLen = 1 / Math.hypot(sx, sy);
      sx *= invLen;
      sy *= invLen;
    }

    // Only update stick if directional keys are driving it
    if (isHeld('left') || isHeld('right') || isHeld('up') || isHeld('down')) {
      gamepadStore.setStick(sx, sy);
    } else if (
      !isHeld('left') &&
      !isHeld('right') &&
      !isHeld('up') &&
      !isHeld('down')
    ) {
      // If no keyboard directions, stick can revert to 0 if not controlled by touch
      // Note: touch handlers explicitly write stick so this won't clobber active touches.
      const current = gamepadStore.getStick();
      if (
        (current.x === -1 || current.x === 1 || current.y === -1 || current.y === 1) ||
        Math.abs(current.x) >= 0.7 ||
        Math.abs(current.y) >= 0.7
      ) {
        gamepadStore.setStick(0, 0);
      }
    }
  }
}

export const keyboardMapper = new KeyboardMapper();
