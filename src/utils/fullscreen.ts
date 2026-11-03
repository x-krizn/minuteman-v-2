/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns `true` when the document is currently in browser fullscreen mode (including WebKit/Moz vendor prefixes).
 */
export function isAppFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
      (document as unknown as { mozFullScreenElement?: Element }).mozFullScreenElement ||
      (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
  );
}

/**
 * Requests browser fullscreen mode on `target` (or `document.documentElement`) and returns `true` on success.
 */
export async function requestAppFullscreen(
  target: HTMLElement = document.documentElement
): Promise<boolean> {
  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
      return true;
    }
    const webkitTarget = target as unknown as {
      webkitRequestFullscreen?: (options?: unknown) => Promise<void> | void;
    };
    if (webkitTarget.webkitRequestFullscreen) {
      await webkitTarget.webkitRequestFullscreen();
      return true;
    }
    const msTarget = target as unknown as {
      msRequestFullscreen?: () => Promise<void> | void;
    };
    if (msTarget.msRequestFullscreen) {
      await msTarget.msRequestFullscreen();
      return true;
    }
  } catch {
    // Browsers reject if not called inside a user gesture or not supported
    return false;
  }
  return false;
}

/**
 * Exits browser fullscreen mode if active and returns `true` on success.
 */
export async function exitAppFullscreen(): Promise<boolean> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return true;
    }
    const webkitDoc = document as unknown as {
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    if (webkitDoc.webkitExitFullscreen) {
      await webkitDoc.webkitExitFullscreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Toggles browser fullscreen mode on or off and returns the resulting fullscreen state.
 */
export async function toggleAppFullscreen(
  target: HTMLElement = document.documentElement
): Promise<boolean> {
  if (isAppFullscreen()) {
    await exitAppFullscreen();
    return false;
  } else {
    return await requestAppFullscreen(target);
  }
}

/**
 * Subscribes `callback` to browser `fullscreenchange` events and returns an unsubscribe cleanup function.
 */
export function subscribeFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {};

  const handler = () => {
    callback(isAppFullscreen());
  };

  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('mozfullscreenchange', handler);
  document.addEventListener('MSFullscreenChange', handler);

  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('MSFullscreenChange', handler);
  };
}
