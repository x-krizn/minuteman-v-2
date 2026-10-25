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
  KeyK: 'b',
  KeyC: 'x', // Attack / Charge (X)
  KeyJ: 'x',
  KeyV: 'y', // Block / Parry (Y)
  KeyL: 'y',

  // Bumpers / Skills
  KeyQ: 'l', // Skill 1 (L)
  KeyU: 'l',
  KeyE: 'r', // Skill 2 (R)
  KeyO: 'r',

  // System Buttons
  // START -> Game Menu (Enter, P, Escape)
  Enter: 'start',
  KeyP: 'start',
  Escape: 'start',
  // SHIFT -> Inventory / Character Screen (ShiftLeft, ShiftRight, Tab, M)
  ShiftLeft: 'select',
  ShiftRight: 'select',
  Tab: 'select',
  KeyM: 'select',
  KeyI: 'select',
  Backspace: 'select',
};

function isEditableElement(el: EventTarget | Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  );
}

export class KeyboardMapper {
  private activeKeys: Set<string> = new Set();
  private keyboardStickActive = false;
  private attached = false;

  public init(): () => void {
    if (this.attached) return () => {};
    this.attached = true;

    const releaseAllKeyboardInputs = () => {
      this.activeKeys.clear();
      this.keyboardStickActive = false;
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
        gamepadStore.setButtonState(btn, false, false, 'keyboard');
      });
      gamepadStore.setStick(0, 0, 'keyboard');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not hijack keystrokes when typing inside a text input (e.g., Pilot Callsign)
      if (isEditableElement(e.target) || isEditableElement(document.activeElement)) {
        if (e.code === 'Escape' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

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
        gamepadStore.setButtonState(button, true, false, 'keyboard');
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
          gamepadStore.setButtonState(button, false, false, 'keyboard');
        }
        this.updateDerivedStick();
      }
    };

    const handleBlur = () => {
      releaseAllKeyboardInputs();
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (isEditableElement(e.target)) {
        releaseAllKeyboardInputs();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focusin', handleFocusIn);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focusin', handleFocusIn);
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

    const hasDir = sx !== 0 || sy !== 0;
    if (hasDir) {
      this.keyboardStickActive = true;
      gamepadStore.setStick(sx, sy, 'keyboard');
    } else if (this.keyboardStickActive) {
      this.keyboardStickActive = false;
      gamepadStore.setStick(0, 0, 'keyboard');
    }
  }
}

export const keyboardMapper = new KeyboardMapper();
