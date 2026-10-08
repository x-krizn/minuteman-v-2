/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Triggers a short vibration if supported by the browser.
 */
export function triggerHaptic(durationMs = 10): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore vibration errors as per browser permission policy
    }
  }
}
