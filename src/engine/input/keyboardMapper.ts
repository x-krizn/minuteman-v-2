/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ButtonKey } from '../../types/input';
import { gamepadStore } from './gamepadStore';
import {
  formatCompactKeyLabel,
  isInputCaptureActive,
  resolveKeyboardCodeToButton,
  resolveMenuKeyboardCodeToButton,
  subscribeControlBindings,
} from './inputBindingsStore';

function isEditableElement(el: EventTarget | Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || el.isContentEditable) return true;
  if (tag === 'INPUT') {
    const type = ((el as HTMLInputElement).type || 'text').toLowerCase();
    return (
      type === 'text' ||
      type === 'search' ||
      type === 'password' ||
      type === 'email' ||
      type === 'url' ||
      type === 'tel' ||
      type === 'number'
    );
  }
  return false;
}

/**
 * Returns true when a universal menu overlay or shell screen is active so keyboard input
 * routes through fixed menu navigation keys instead of customized in-game controls.
 */
function isMenuKeyboardContextActive(): boolean {
  if (typeof document === 'undefined') return false;
  const viewport = document.getElementById('screen-viewport');
  if (!viewport) return true;
  if (viewport.querySelector('[data-universal-menu="true"]')) return true;
  const canvas = document.getElementById('screen-canvas');
  if (!canvas || canvas.hasAttribute('hidden')) return true;
  return false;
}

/**
 * Maps physical keyboard events into `gamepadStore` using fixed menu navigation bindings
 * when a menu is active and customizable bindings from `inputBindingsStore` during gameplay.
 */
export class KeyboardMapper {
  private activeKeyButtons: Map<string, ButtonKey> = new Map();
  private keyboardStickActive = false;
  private attached = false;

  /**
   * Clears all currently held keyboard button states and stick vectors.
   */
  public releaseAll(): void {
    this.activeKeyButtons.clear();
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
  }

  public init(): () => void {
    if (this.attached) return () => {};
    this.attached = true;

    const releaseAllKeyboardInputs = () => {
      this.releaseAll();
    };

    const unsubBindings = subscribeControlBindings(() => {
      releaseAllKeyboardInputs();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputCaptureActive()) {
        releaseAllKeyboardInputs();
        return;
      }

      // Do not hijack keystrokes when typing inside a text input (e.g., Pilot Callsign)
      if (isEditableElement(e.target) || isEditableElement(document.activeElement)) {
        if (e.code === 'Escape' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      const isMenu = isMenuKeyboardContextActive();
      const button = isMenu
        ? resolveMenuKeyboardCodeToButton(e.code)
        : resolveKeyboardCodeToButton(e.code);

      // Prevent default browser scrolling or button activation on bound keys or navigation keys
      if (
        button ||
        ['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }

      if (button) {
        this.activeKeyButtons.set(e.code, button);
        const keyLabel = formatCompactKeyLabel(e.code);
        gamepadStore.setButtonState(button, true, false, 'keyboard', keyLabel);
        this.updateDerivedStick();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isInputCaptureActive()) {
        releaseAllKeyboardInputs();
        return;
      }

      const trackedButton = this.activeKeyButtons.get(e.code);
      const fallbackButton = isMenuKeyboardContextActive()
        ? resolveMenuKeyboardCodeToButton(e.code)
        : resolveKeyboardCodeToButton(e.code);
      const button = trackedButton ?? fallbackButton;

      if (button) {
        this.activeKeyButtons.delete(e.code);
        // Only release if no other held key maps to the same button
        const stillHeld = Array.from(this.activeKeyButtons.values()).some((b) => b === button);
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
      unsubBindings();
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
    const heldButtons = new Set(this.activeKeyButtons.values());

    if (heldButtons.has('left')) sx -= 1;
    if (heldButtons.has('right')) sx += 1;
    if (heldButtons.has('up')) sy -= 1;
    if (heldButtons.has('down')) sy += 1;

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

/**
 * Shared singleton instance of `KeyboardMapper`.
 */
export const keyboardMapper = new KeyboardMapper();

