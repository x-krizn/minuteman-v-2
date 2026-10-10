/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { hardwareGamepad } from './hardwareGamepad';

/**
 * Triggers vibration on mobile devices and connected physical gamepads.
 */
export function triggerHaptic(durationMs = 12, weak = 0.4, strong = 0.4): void {
  // Mobile touch vibration
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore vibration errors as per browser permission policy
    }
  }

  // Physical controller rumble
  hardwareGamepad.rumble(durationMs, weak, strong);
}
