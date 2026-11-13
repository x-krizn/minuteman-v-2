/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ButtonKey } from '../../types/input';
import { gamepadStore } from './gamepadStore';
import {
  DEFAULT_CONTROL_BINDINGS,
  formatCompactGamepadButtonLabel,
  getControlBindings,
  isInputCaptureActive,
  resolveGamepadIndexToButton,
} from './inputBindingsStore';

/**
 * Connection event payload emitted when a physical W3C gamepad connects or disconnects.
 */
export interface GamepadNotification {
  type: 'connected' | 'disconnected';
  name: string;
}

/**
 * Formats a raw browser `Gamepad.id` string into a clean human-readable controller label.
 */
export function formatGamepadName(rawId: string): string {
  if (!rawId) return 'Gamepad Controller';
  if (/Xbox/i.test(rawId)) return 'Xbox Controller';
  if (/DualSense|0ce6|PlayStation 5|PS5/i.test(rawId)) return 'DualSense Controller';
  if (/DualShock|054c|PlayStation/i.test(rawId)) return 'PlayStation Controller';
  if (/Switch|Joy-Con|Pro Controller|057e/i.test(rawId)) return 'Nintendo Switch Controller';
  if (/8BitDo/i.test(rawId)) return '8BitDo Controller';
  return rawId.replace(/\s*\([^)]*\)/g, '').trim() || 'Gamepad Controller';
}

/**
 * Singleton manager that polls physical W3C Gamepad API devices each frame,
 * normalizes axes and buttons into `gamepadStore` using `inputBindingsStore`, and dispatches rumble effects.
 */
export class HardwareGamepadManager {
  private static instance: HardwareGamepadManager;
  private prevHardwareButtons: Set<ButtonKey> = new Set();
  private hardwareStickActive = false;
  private connectedNames: string[] = [];
  private listeners: Set<(notification: GamepadNotification) => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepadconnected', this.handleConnected);
      window.addEventListener('gamepaddisconnected', this.handleDisconnected);
    }
  }

  /**
   * Unregisters window `gamepadconnected` and `gamepaddisconnected` event listeners and clears subscribers.
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('gamepadconnected', this.handleConnected);
      window.removeEventListener('gamepaddisconnected', this.handleDisconnected);
    }
    this.listeners.clear();
  }

  public static getInstance(): HardwareGamepadManager {
    if (!HardwareGamepadManager.instance) {
      HardwareGamepadManager.instance = new HardwareGamepadManager();
    }
    return HardwareGamepadManager.instance;
  }

  private handleConnected = (e: GamepadEvent) => {
    if (typeof window !== 'undefined') {
      try {
        window.focus();
      } catch {
        // Safe focus attempt
      }
    }
    const name = e.gamepad.id || `Gamepad ${e.gamepad.index + 1}`;
    if (!this.connectedNames.includes(name)) {
      this.connectedNames.push(name);
    }
    this.notify({ type: 'connected', name });
  };

  private handleDisconnected = (e: GamepadEvent) => {
    const name = e.gamepad.id || `Gamepad ${e.gamepad.index + 1}`;
    this.connectedNames = this.connectedNames.filter((n) => n !== name);
    this.notify({ type: 'disconnected', name });
  };

  public getConnectedNames(): string[] {
    return [...this.connectedNames];
  }

  public subscribe(fn: (notification: GamepadNotification) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(notification: GamepadNotification): void {
    this.listeners.forEach((fn) => {
      try {
        fn(notification);
      } catch {
        // Safe listener execution
      }
    });
  }

  /**
   * Returns the W3C index (`0..15`) of the first currently pressed physical gamepad button,
   * or `null` if no button is pressed. Used during interactive button remapping.
   */
  public getFirstPressedRawButtonIndex(): number | null {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return null;
    }
    const gamepads = navigator.getGamepads();
    if (!gamepads) return null;
    const threshold = getControlBindings().triggerThreshold;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || !gp.connected || !gp.buttons) continue;
      for (let bIdx = 0; bIdx < Math.min(16, gp.buttons.length); bIdx++) {
        const btn = gp.buttons[bIdx];
        if (!btn) continue;
        const isPressed =
          typeof btn === 'number'
            ? btn > threshold
            : Boolean(btn.pressed || (btn.value ?? 0) > threshold);
        if (isPressed) {
          return bIdx;
        }
      }
    }
    return null;
  }

  /**
   * Polls all connected physical gamepads and updates gamepadStore.
   * Called once per frame in the main loop.
   */
  public poll(): void {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return;
    }

    if (isInputCaptureActive()) {
      if (this.prevHardwareButtons.size > 0) {
        this.prevHardwareButtons.forEach((btn) => {
          gamepadStore.setButtonState(btn, false, false, 'hardware');
        });
        this.prevHardwareButtons.clear();
      }
      if (this.hardwareStickActive) {
        gamepadStore.setStick(0, 0, 'hardware');
        this.hardwareStickActive = false;
      }
      return;
    }

    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    const bindings = getControlBindings();
    const stickDeadzone = bindings.stickDeadzone;
    const triggerThreshold = bindings.triggerThreshold;

    let foundActive = false;
    const currentHardwareButtons: Set<ButtonKey> = new Set();
    const hardwareButtonLabels: Partial<Record<ButtonKey, string>> = {};
    let stickX = 0;
    let stickY = 0;
    const currentNames: string[] = [];

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || !gp.connected) continue;

      foundActive = true;
      const gpName = gp.id || `Gamepad ${gp.index + 1}`;
      currentNames.push(gpName);

      // Update connected names and notify if not already tracked
      if (!this.connectedNames.includes(gpName)) {
        this.connectedNames.push(gpName);
        this.notify({ type: 'connected', name: gpName });
      }

      // 1. Read Buttons with safe fallback
      if (gp.buttons && gp.buttons.length > 0) {
        gp.buttons.forEach((btn, index) => {
          if (!btn) return;
          const isPressed =
            typeof btn === 'number'
              ? btn > triggerThreshold
              : Boolean(btn.pressed || (btn.value ?? 0) > triggerThreshold);

          const mappedKey = resolveGamepadIndexToButton(index);
          if (mappedKey && isPressed) {
            currentHardwareButtons.add(mappedKey);
            if (DEFAULT_CONTROL_BINDINGS.gamepad[mappedKey] !== index) {
              hardwareButtonLabels[mappedKey] = formatCompactGamepadButtonLabel(index);
            }
          }
        });
      }

      // 2. Read Left Thumbstick (Axes 0 and 1)
      if (gp.axes && gp.axes.length >= 2) {
        const rawX = gp.axes[0] ?? 0;
        const rawY = gp.axes[1] ?? 0;
        const dist = Math.hypot(rawX, rawY);

        if (dist > stickDeadzone) {
          const clamped = Math.min(1, (dist - stickDeadzone) / (1 - stickDeadzone));
          stickX = (rawX / dist) * clamped;
          stickY = (rawY / dist) * clamped;
        }
      }

      // 3. Fallback: Check D-pad axes for older / non-standard controllers
      if (
        gp.axes &&
        !currentHardwareButtons.has('left') &&
        !currentHardwareButtons.has('right') &&
        !currentHardwareButtons.has('up') &&
        !currentHardwareButtons.has('down')
      ) {
        // Standard D-pad axes (axes 4 & 5 or 6 & 7)
        if (gp.axes.length >= 5) {
          const dpadAxisX = gp.axes[4] ?? gp.axes[6] ?? 0;
          const dpadAxisY = gp.axes[5] ?? gp.axes[7] ?? 0;
          if (dpadAxisX < -0.5) currentHardwareButtons.add('left');
          else if (dpadAxisX > 0.5) currentHardwareButtons.add('right');
          if (dpadAxisY < -0.5) currentHardwareButtons.add('up');
          else if (dpadAxisY > 0.5) currentHardwareButtons.add('down');
        }

        // POV Hat Axis (often axis 9 on DirectInput pads)
        if (
          gp.axes.length >= 10 &&
          gp.axes[9] !== undefined &&
          gp.axes[9] <= 1.05 &&
          gp.axes[9] >= -1.05
        ) {
          const pov = gp.axes[9];
          if (pov >= -1.05 && pov < -0.85) currentHardwareButtons.add('up');
          else if (pov >= -0.85 && pov < -0.55) {
            currentHardwareButtons.add('up');
            currentHardwareButtons.add('right');
          } else if (pov >= -0.55 && pov < -0.3) currentHardwareButtons.add('right');
          else if (pov >= -0.3 && pov < 0.0) {
            currentHardwareButtons.add('down');
            currentHardwareButtons.add('right');
          } else if (pov >= 0.0 && pov < 0.3) currentHardwareButtons.add('down');
          else if (pov >= 0.3 && pov < 0.55) {
            currentHardwareButtons.add('down');
            currentHardwareButtons.add('left');
          } else if (pov >= 0.55 && pov < 0.85) currentHardwareButtons.add('left');
          else if (pov >= 0.85 && pov <= 1.05) {
            currentHardwareButtons.add('up');
            currentHardwareButtons.add('left');
          }
        }
      }
    }

    // If analog stick is centered across all pads, derive stick movement from hardware D-pad buttons
    if (stickX === 0) {
      if (currentHardwareButtons.has('left')) stickX = -1;
      else if (currentHardwareButtons.has('right')) stickX = 1;
    }
    if (stickY === 0) {
      if (currentHardwareButtons.has('up')) stickY = -1;
      else if (currentHardwareButtons.has('down')) stickY = 1;
    }

    // Check for gamepads that were disconnected
    const disconnected = this.connectedNames.filter((n) => !currentNames.includes(n));
    if (disconnected.length > 0) {
      this.connectedNames = currentNames;
      disconnected.forEach((n) => this.notify({ type: 'disconnected', name: n }));
    }

    if (!foundActive) {
      // Clear previously held hardware buttons if all controllers disconnected
      if (this.prevHardwareButtons.size > 0) {
        this.prevHardwareButtons.forEach((btn) => {
          gamepadStore.setButtonState(btn, false, false, 'hardware');
        });
        this.prevHardwareButtons.clear();
      }
      if (this.hardwareStickActive) {
        gamepadStore.setStick(0, 0, 'hardware');
        this.hardwareStickActive = false;
      }
      return;
    }

    // 3. Sync Buttons to gamepadStore using 'hardware' source
    currentHardwareButtons.forEach((btn) => {
      gamepadStore.setButtonState(btn, true, false, 'hardware', hardwareButtonLabels[btn]);
    });

    this.prevHardwareButtons.forEach((btn) => {
      if (!currentHardwareButtons.has(btn)) {
        gamepadStore.setButtonState(btn, false, false, 'hardware');
      }
    });

    this.prevHardwareButtons = currentHardwareButtons;

    // 4. Sync Stick to gamepadStore using 'hardware' source
    if (stickX !== 0 || stickY !== 0) {
      this.hardwareStickActive = true;
      gamepadStore.setStick(stickX, stickY, 'hardware');
    } else if (this.hardwareStickActive) {
      this.hardwareStickActive = false;
      gamepadStore.setStick(0, 0, 'hardware');
    }
  }

  /**
   * Triggers hardware rumble vibration actuator on connected gamepads
   */
  public rumble(durationMs = 80, weakMagnitude = 0.5, strongMagnitude = 0.5): void {
    if (!getControlBindings().vibrationEnabled) {
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return;
    }

    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || !gp.connected) continue;

      const actuator = (
        gp as unknown as {
          vibrationActuator?: { playEffect: (type: string, options: unknown) => Promise<unknown> };
        }
      ).vibrationActuator;
      if (actuator && typeof actuator.playEffect === 'function') {
        try {
          actuator
            .playEffect('dual-rumble', {
              startDelay: 0,
              duration: durationMs,
              weakMagnitude,
              strongMagnitude,
            })
            .catch(() => {});
        } catch {
          // Ignore vibration permission errors
        }
      }
    }
  }
}

/**
 * Shared singleton instance of `HardwareGamepadManager` used by the engine input loop.
 */
export const hardwareGamepad = HardwareGamepadManager.getInstance();
