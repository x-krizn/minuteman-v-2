/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ButtonKey } from '../../types/input';

/**
 * Primary and secondary `KeyboardEvent.code` pair assigned to a virtual handheld button.
 */
export type KeyboardBindingPair = [string, string | null];

/**
 * Persistent configuration for customizable keyboard bindings, W3C gamepad button assignments,
 * analog thumbstick deadzone, trigger actuation threshold, and haptic rumble feedback.
 */
export interface ControlBindingsConfig {
  keyboard: Record<ButtonKey, KeyboardBindingPair>;
  gamepad: Record<ButtonKey, number>;
  stickDeadzone: number;
  triggerThreshold: number;
  vibrationEnabled: boolean;
}

/**
 * Metadata describing a remappable handheld action row in the Controls Settings UI.
 */
export interface ControlActionDefinition {
  key: ButtonKey;
  badge: string;
  label: string;
  detail: string;
  category: 'movement' | 'combat' | 'system';
}

const STORAGE_KEY = 'orion_control_bindings_v1';

/**
 * Canonical ordered list of all 12 remappable virtual handheld actions.
 */
export const CONTROL_ACTION_DEFINITIONS: ControlActionDefinition[] = [
  {
    key: 'up',
    badge: 'D-UP',
    label: 'Move Up / North',
    detail: '8-way ground traversal & menu navigation up',
    category: 'movement',
  },
  {
    key: 'down',
    badge: 'D-DOWN',
    label: 'Move Down / South',
    detail: '8-way ground traversal & menu navigation down',
    category: 'movement',
  },
  {
    key: 'left',
    badge: 'D-LEFT',
    label: 'Move Left / West',
    detail: '8-way ground traversal & menu navigation left',
    category: 'movement',
  },
  {
    key: 'right',
    badge: 'D-RIGHT',
    label: 'Move Right / East',
    detail: '8-way ground traversal & menu navigation right',
    category: 'movement',
  },
  {
    key: 'a',
    badge: '[A]',
    label: 'Jump / Interact / Confirm',
    detail: 'Leap sinkholes, rest at Campfires, use Waygates, confirm',
    category: 'combat',
  },
  {
    key: 'b',
    badge: '[B]',
    label: 'Dodge / Boost / Cancel',
    detail: 'Tap for dodge burst; hold for thruster boost; menu back',
    category: 'combat',
  },
  {
    key: 'x',
    badge: '[X]',
    label: 'Skill 1 (Primary Chain)',
    detail: 'Tap/hold primary weapon combo chain; double-tap reload',
    category: 'combat',
  },
  {
    key: 'y',
    badge: '[Y]',
    label: 'Skill 2 / Hold Block',
    detail: 'Tap for Skill 2; hold for Skill 4 or Shield/Blade Block',
    category: 'combat',
  },
  {
    key: 'l',
    badge: '[L]',
    label: 'Target Lock / Swap Aux',
    detail: 'Tap to lock/cycle targets; hold to swap Side Hand ⇄ Aux',
    category: 'combat',
  },
  {
    key: 'r',
    badge: '[R]',
    label: 'Skill 3 / Hold Heavy',
    detail: 'Tap for Skill 3; hold for Skill 5 heavy finisher',
    category: 'combat',
  },
  {
    key: 'start',
    badge: 'START',
    label: 'Pause & System Menu',
    detail: 'Open in-game [START] menu (Roster, World Map, Settings)',
    category: 'system',
  },
  {
    key: 'select',
    badge: 'SELECT',
    label: 'Pilot Satchel & Loadout',
    detail: 'Open [SELECT] Satchel (Status, Loadout, Feat Constellation)',
    category: 'system',
  },
];

/**
 * Factory default control bindings for Keyboard and W3C Standard Gamepad.
 */
export const DEFAULT_CONTROL_BINDINGS: ControlBindingsConfig = {
  keyboard: {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    a: ['Space', 'KeyZ'],
    b: ['KeyK', 'KeyX'],
    x: ['KeyJ', 'KeyC'],
    y: ['KeyL', 'KeyV'],
    l: ['KeyQ', 'KeyU'],
    r: ['KeyE', 'KeyO'],
    start: ['Enter', 'Escape'],
    select: ['Tab', 'ShiftLeft'],
  },
  gamepad: {
    a: 0,
    b: 1,
    x: 2,
    y: 3,
    l: 4,
    r: 5,
    select: 8,
    start: 9,
    up: 12,
    down: 13,
    left: 14,
    right: 15,
  },
  stickDeadzone: 0.18,
  triggerThreshold: 0.35,
  vibrationEnabled: true,
};

const ALL_BUTTON_KEYS: ButtonKey[] = [
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
];

function cloneBindings(src: ControlBindingsConfig): ControlBindingsConfig {
  const keyboard = {} as Record<ButtonKey, KeyboardBindingPair>;
  const gamepad = {} as Record<ButtonKey, number>;
  for (const key of ALL_BUTTON_KEYS) {
    const pair = src.keyboard[key] || DEFAULT_CONTROL_BINDINGS.keyboard[key];
    keyboard[key] = [pair[0], pair[1] ?? null];
    gamepad[key] =
      typeof src.gamepad[key] === 'number'
        ? src.gamepad[key]
        : DEFAULT_CONTROL_BINDINGS.gamepad[key];
  }
  return {
    keyboard,
    gamepad,
    stickDeadzone: Math.max(0.05, Math.min(0.45, src.stickDeadzone ?? 0.18)),
    triggerThreshold: Math.max(0.1, Math.min(0.85, src.triggerThreshold ?? 0.35)),
    vibrationEnabled: src.vibrationEnabled ?? true,
  };
}

function loadStoredBindings(): ControlBindingsConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return cloneBindings(DEFAULT_CONTROL_BINDINGS);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneBindings(DEFAULT_CONTROL_BINDINGS);
    const parsed = JSON.parse(raw) as Partial<ControlBindingsConfig>;
    return cloneBindings({
      keyboard: {
        ...DEFAULT_CONTROL_BINDINGS.keyboard,
        ...(parsed.keyboard || {}),
      },
      gamepad: {
        ...DEFAULT_CONTROL_BINDINGS.gamepad,
        ...(parsed.gamepad || {}),
      },
      stickDeadzone:
        typeof parsed.stickDeadzone === 'number'
          ? parsed.stickDeadzone
          : DEFAULT_CONTROL_BINDINGS.stickDeadzone,
      triggerThreshold:
        typeof parsed.triggerThreshold === 'number'
          ? parsed.triggerThreshold
          : DEFAULT_CONTROL_BINDINGS.triggerThreshold,
      vibrationEnabled:
        typeof parsed.vibrationEnabled === 'boolean'
          ? parsed.vibrationEnabled
          : DEFAULT_CONTROL_BINDINGS.vibrationEnabled,
    });
  } catch {
    return cloneBindings(DEFAULT_CONTROL_BINDINGS);
  }
}

let activeBindings: ControlBindingsConfig = loadStoredBindings();
let keyboardLookupCache: Record<string, ButtonKey> = {};
let gamepadLookupCache: Record<number, ButtonKey> = {};
let inputCaptureActive = false;
const listeners: Set<() => void> = new Set();

function rebuildLookupCaches(): void {
  const kbMap: Record<string, ButtonKey> = {
    // Convenient secondary system aliases if not claimed by a custom binding
    KeyP: 'start',
    ShiftRight: 'select',
    KeyM: 'select',
    KeyI: 'select',
    Backspace: 'select',
  };
  for (const btn of ALL_BUTTON_KEYS) {
    const [primary, secondary] = activeBindings.keyboard[btn];
    if (primary) kbMap[primary] = btn;
    if (secondary) kbMap[secondary] = btn;
  }
  keyboardLookupCache = kbMap;

  const gpMap: Record<number, ButtonKey> = {
    // Default analog triggers L2(6)/R2(7) mirror L/R unless explicitly bound
    6: 'l',
    7: 'r',
  };
  for (const btn of ALL_BUTTON_KEYS) {
    const idx = activeBindings.gamepad[btn];
    if (typeof idx === 'number' && idx >= 0) {
      gpMap[idx] = btn;
    }
  }
  gamepadLookupCache = gpMap;
}

rebuildLookupCaches();

function persistAndNotify(): void {
  rebuildLookupCaches();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeBindings));
    } catch {
      // Ignore storage quota errors
    }
  }
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignore subscriber errors
    }
  });
}

/**
 * Returns the current active `ControlBindingsConfig` snapshot.
 */
export function getControlBindings(): ControlBindingsConfig {
  return activeBindings;
}

/**
 * Subscribes to changes in keyboard/gamepad bindings or deadzone settings.
 */
export function subscribeControlBindings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Resolves a physical `KeyboardEvent.code` to its bound `ButtonKey`, or `undefined` if unbound.
 */
export function resolveKeyboardCodeToButton(code: string): ButtonKey | undefined {
  return keyboardLookupCache[code];
}

/**
 * Resolves a W3C physical gamepad button index (`0..15`) to its bound `ButtonKey`.
 */
export function resolveGamepadIndexToButton(buttonIndex: number): ButtonKey | undefined {
  return gamepadLookupCache[buttonIndex];
}

/**
 * Returns true while the Controls UI is actively waiting for the user to press a key or gamepad button.
 */
export function isInputCaptureActive(): boolean {
  return inputCaptureActive;
}

/**
 * Enables or disables interactive key/button capture lock so global menu navigation pauses during binding.
 */
export function setInputCaptureActive(active: boolean): void {
  inputCaptureActive = active;
}

/**
 * Assigns a `KeyboardEvent.code` to `action` at `slotIndex` (`0` = Primary, `1` = Secondary).
 * Automatically swaps bindings if `newCode` was already assigned to another action.
 */
export function setKeyboardBinding(
  action: ButtonKey,
  slotIndex: 0 | 1,
  newCode: string
): { swappedWith?: ButtonKey } {
  const prevCode = activeBindings.keyboard[action][slotIndex];
  let swappedWith: ButtonKey | undefined;

  for (const otherKey of ALL_BUTTON_KEYS) {
    const pair = activeBindings.keyboard[otherKey];
    for (const s of [0, 1] as const) {
      if (pair[s] === newCode && (otherKey !== action || s !== slotIndex)) {
        const fallbackCode =
          prevCode || pair[0] || DEFAULT_CONTROL_BINDINGS.keyboard[otherKey][0];
        if (s === 0) {
          pair[0] = fallbackCode;
        } else {
          pair[1] = otherKey === action ? prevCode : fallbackCode;
        }
        if (otherKey !== action) {
          swappedWith = otherKey;
        }
      }
    }
  }

  activeBindings.keyboard[action][slotIndex] = newCode;
  persistAndNotify();
  return { swappedWith };
}

/**
 * Assigns a W3C gamepad button index (`0..15`) to `action`.
 * Automatically swaps with any action previously bound to `buttonIndex`.
 */
export function setGamepadBinding(
  action: ButtonKey,
  buttonIndex: number
): { swappedWith?: ButtonKey } {
  const prevIndex = activeBindings.gamepad[action];
  let swappedWith: ButtonKey | undefined;

  for (const otherKey of ALL_BUTTON_KEYS) {
    if (otherKey !== action && activeBindings.gamepad[otherKey] === buttonIndex) {
      activeBindings.gamepad[otherKey] = prevIndex;
      swappedWith = otherKey;
    }
  }

  activeBindings.gamepad[action] = buttonIndex;
  persistAndNotify();
  return { swappedWith };
}

/**
 * Updates the analog stick radial deadzone (`0.05` to `0.45`).
 */
export function setGamepadDeadzone(deadzone: number): void {
  activeBindings.stickDeadzone = Math.max(0.05, Math.min(0.45, Number(deadzone.toFixed(2))));
  persistAndNotify();
}

/**
 * Updates the analog trigger actuation threshold (`0.10` to `0.85`).
 */
export function setGamepadTriggerThreshold(threshold: number): void {
  activeBindings.triggerThreshold = Math.max(0.1, Math.min(0.85, Number(threshold.toFixed(2))));
  persistAndNotify();
}

/**
 * Enables or disables physical controller dual-rumble vibration feedback.
 */
export function setGamepadVibrationEnabled(enabled: boolean): void {
  activeBindings.vibrationEnabled = enabled;
  persistAndNotify();
}

/**
 * Resets keyboard bindings back to factory defaults.
 */
export function resetKeyboardBindingsToDefault(): void {
  const defaults = cloneBindings(DEFAULT_CONTROL_BINDINGS);
  activeBindings.keyboard = defaults.keyboard;
  persistAndNotify();
}

/**
 * Resets gamepad button bindings, deadzone, trigger threshold, and vibration to factory defaults.
 */
export function resetGamepadBindingsToDefault(): void {
  const defaults = cloneBindings(DEFAULT_CONTROL_BINDINGS);
  activeBindings.gamepad = defaults.gamepad;
  activeBindings.stickDeadzone = defaults.stickDeadzone;
  activeBindings.triggerThreshold = defaults.triggerThreshold;
  activeBindings.vibrationEnabled = defaults.vibrationEnabled;
  persistAndNotify();
}

/**
 * Formats a `KeyboardEvent.code` into a concise, human-readable keycap label.
 */
export function formatKeyCodeLabel(code: string | null | undefined): string {
  if (!code) return 'UNBOUND';
  if (code.startsWith('Key')) return code.slice(3).toUpperCase();
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `NUM ${code.slice(6).toUpperCase()}`;
  switch (code) {
    case 'ArrowUp':
      return '↑ UP';
    case 'ArrowDown':
      return '↓ DOWN';
    case 'ArrowLeft':
      return '← LEFT';
    case 'ArrowRight':
      return '→ RIGHT';
    case 'Space':
      return 'SPACE';
    case 'Enter':
      return 'ENTER';
    case 'Escape':
      return 'ESC';
    case 'Tab':
      return 'TAB';
    case 'ShiftLeft':
      return 'L-SHIFT';
    case 'ShiftRight':
      return 'R-SHIFT';
    case 'ControlLeft':
      return 'L-CTRL';
    case 'ControlRight':
      return 'R-CTRL';
    case 'AltLeft':
      return 'L-ALT';
    case 'AltRight':
      return 'R-ALT';
    case 'Backspace':
      return 'BACKSPACE';
    case 'CapsLock':
      return 'CAPS';
    case 'BracketLeft':
      return '[';
    case 'BracketRight':
      return ']';
    case 'Semicolon':
      return ';';
    case 'Quote':
      return "'";
    case 'Comma':
      return ',';
    case 'Period':
      return '.';
    case 'Slash':
      return '/';
    case 'Backslash':
      return '\\';
    case 'Minus':
      return '-';
    case 'Equal':
      return '=';
    case 'Backquote':
      return '`';
    default:
      return code.toUpperCase();
  }
}

/**
 * Formats a W3C standard gamepad button index (`0..15`) into a clear controller button label.
 */
export function formatGamepadButtonLabel(buttonIndex: number): string {
  switch (buttonIndex) {
    case 0:
      return 'A / CROSS (BTN 0)';
    case 1:
      return 'B / CIRCLE (BTN 1)';
    case 2:
      return 'X / SQUARE (BTN 2)';
    case 3:
      return 'Y / TRIANGLE (BTN 3)';
    case 4:
      return 'LB / L1 (BTN 4)';
    case 5:
      return 'RB / R1 (BTN 5)';
    case 6:
      return 'LT / L2 (BTN 6)';
    case 7:
      return 'RT / R2 (BTN 7)';
    case 8:
      return 'VIEW / SELECT (BTN 8)';
    case 9:
      return 'MENU / START (BTN 9)';
    case 10:
      return 'L3 STICK (BTN 10)';
    case 11:
      return 'R3 STICK (BTN 11)';
    case 12:
      return 'D-PAD UP (BTN 12)';
    case 13:
      return 'D-PAD DOWN (BTN 13)';
    case 14:
      return 'D-PAD LEFT (BTN 14)';
    case 15:
      return 'D-PAD RIGHT (BTN 15)';
    default:
      return `BUTTON ${buttonIndex}`;
  }
}

/**
 * Starts a temporary capture-phase keyboard listener that intercepts the next key press
 * for interactive key remapping. Returns a cleanup function that removes the listener.
 */
export function startKeyboardCaptureSession(
  onKeyCaptured: (code: string) => void,
  onCancel: () => void
): () => void {
  inputCaptureActive = true;
  const handleKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.code === 'Escape') {
      inputCaptureActive = false;
      onCancel();
      return;
    }
    inputCaptureActive = false;
    onKeyCaptured(e.code);
  };
  window.addEventListener('keydown', handleKeyDown, true);
  return () => {
    window.removeEventListener('keydown', handleKeyDown, true);
  };
}

/**
 * Starts a temporary animation-frame polling session that detects the next physical
 * W3C gamepad button press (or Escape key to cancel). Returns a cleanup function.
 */
export function startGamepadCaptureSession(
  readFirstPressedButton: () => number | null,
  onButtonCaptured: (buttonIndex: number) => void,
  onCancel: () => void
): () => void {
  inputCaptureActive = true;
  let animId = 0;
  let waitingForRelease = true;

  const handleEscCancel = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      inputCaptureActive = false;
      onCancel();
    }
  };

  window.addEventListener('keydown', handleEscCancel, true);

  const pollFrame = () => {
    const pressedIdx = readFirstPressedButton();
    if (waitingForRelease) {
      if (pressedIdx === null) {
        waitingForRelease = false;
      }
      animId = requestAnimationFrame(pollFrame);
      return;
    }
    if (pressedIdx !== null) {
      inputCaptureActive = false;
      onButtonCaptured(pressedIdx);
      return;
    }
    animId = requestAnimationFrame(pollFrame);
  };

  animId = requestAnimationFrame(pollFrame);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', handleEscCancel, true);
  };
}

