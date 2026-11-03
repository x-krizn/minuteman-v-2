/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameInput } from '../../types/input';

/**
 * Result returned each frame by the universal menu navigator.
 */
export interface MenuNavigationStepResult {
  /** Whether a universal menu container is currently active on screen. */
  isMenuActive: boolean;
  /** Whether a directional, confirm, back, or bumper input was handled by the menu. */
  handledInput: boolean;
  /** Whether pressing [B] at the root level of an in-game menu should close the menu overlay. */
  shouldCloseRootMenu: boolean;
}

type Direction = 'up' | 'down' | 'left' | 'right';

const FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[role="button"]:not([aria-disabled="true"])',
  '[data-menu-focusable="true"]:not([aria-disabled="true"])',
].join(', ');

const INITIAL_REPEAT_DELAY = 0.25;
const REPEAT_INTERVAL = 0.095;

/**
 * Checks if an HTML or SVG element is visible and interactable inside the viewport.
 */
function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

/**
 * Provides unified 2D spatial focus navigation, [A] activation, [B] hierarchical back,
 * and [L]/[R] tab cycling for all menus across Keyboard, Physical Gamepad,
 * Virtual Handheld Controls, and Mouse/Touch.
 */
export class UniversalMenuNavigator {
  private currentFocusedEl: HTMLElement | null = null;
  private lastScopeEl: HTMLElement | null = null;
  private heldDirection: Direction | null = null;
  private holdTimer = 0;
  private pointerListenersAttached = false;
  private boundPointerOver: ((e: Event) => void) | null = null;

  /**
   * Attaches pointer hover listener to `#screen-viewport` so mouse/touch focus stays synced
   * with keyboard/gamepad focus.
   */
  private ensurePointerSync(): void {
    if (this.pointerListenersAttached || typeof document === 'undefined') return;
    const viewport = document.getElementById('screen-viewport');
    if (!viewport) return;

    this.boundPointerOver = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const focusable = target.closest(FOCUSABLE_SELECTOR) as HTMLElement | null;
      if (focusable && focusable.closest('[data-universal-menu="true"]') && isElementVisible(focusable)) {
        this.setFocus(focusable, false);
      }
    };

    viewport.addEventListener('mouseover', this.boundPointerOver, { passive: true });
    this.pointerListenersAttached = true;
  }

  /**
   * Cleans up any attached DOM listeners and active focus attributes.
   */
  public dispose(): void {
    if (this.boundPointerOver && typeof document !== 'undefined') {
      const viewport = document.getElementById('screen-viewport');
      viewport?.removeEventListener('mouseover', this.boundPointerOver);
    }
    this.pointerListenersAttached = false;
    this.boundPointerOver = null;
    this.clearFocus();
  }

  /**
   * Clears the current gamepad focus highlight.
   */
  public clearFocus(): void {
    if (this.currentFocusedEl) {
      this.currentFocusedEl.removeAttribute('data-gamepad-focus');
      this.currentFocusedEl = null;
    }
    if (typeof document !== 'undefined') {
      document.querySelectorAll('[data-gamepad-focus="true"]').forEach(el => {
        el.removeAttribute('data-gamepad-focus');
      });
    }
  }

  /**
   * Sets the active focused element, scrolling it into view if needed and invoking `.focus()`
   * for non-text-input elements so `onFocus` preview handlers trigger immediately.
   */
  private setFocus(el: HTMLElement | null, scrollIntoView = true): void {
    if (this.currentFocusedEl && this.currentFocusedEl !== el) {
      this.currentFocusedEl.removeAttribute('data-gamepad-focus');
    }
    this.currentFocusedEl = el;
    if (!el) return;

    el.setAttribute('data-gamepad-focus', 'true');
    if (scrollIntoView && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    const tag = el.tagName.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
      try {
        el.focus({ preventScroll: true });
      } catch {
        // Ignore SVG or non-standard focus errors
      }
    }
  }

  /**
   * Finds the topmost active `[data-universal-menu="true"]` container and any nested
   * `[data-menu-scope="true"]` sub-modal inside `#screen-viewport`.
   */
  private getActiveMenuContainers(): { rootMenu: HTMLElement; activeScope: HTMLElement } | null {
    if (typeof document === 'undefined') return null;
    const viewport = document.getElementById('screen-viewport') ?? document.body;
    const menus = Array.from(viewport.querySelectorAll<HTMLElement>('[data-universal-menu="true"]')).filter(isElementVisible);
    if (menus.length === 0) return null;

    const rootMenu = menus[menus.length - 1];
    const subScopes = Array.from(rootMenu.querySelectorAll<HTMLElement>('[data-menu-scope="true"]')).filter(isElementVisible);
    const activeScope = subScopes.length > 0 ? subScopes[subScopes.length - 1] : rootMenu;
    return { rootMenu, activeScope };
  }

  /**
   * Collects all visible, enabled focusable elements within the active scope.
   */
  private getFocusableElements(scope: HTMLElement): HTMLElement[] {
    return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isElementVisible);
  }

  /**
   * Picks the default initial focus element inside a menu scope.
   */
  private pickInitialFocus(scope: HTMLElement, candidates: HTMLElement[]): HTMLElement | null {
    if (candidates.length === 0) return null;
    const preferred = scope.querySelector<HTMLElement>('[data-menu-autofocus="true"]');
    if (preferred && candidates.includes(preferred)) return preferred;

    // Prefer the first non-back, non-tab content interactive element if available
    const contentEl = candidates.find(
      el => !el.closest('[data-menu-tabs="true"]') && el.getAttribute('data-menu-back') !== 'true'
    );
    return contentEl ?? candidates[0];
  }

  /**
   * Computes the next element in the requested 2D direction using bounding client rectangles.
   */
  private findNextElement(current: HTMLElement, candidates: HTMLElement[], dir: Direction): HTMLElement | null {
    const curRect = current.getBoundingClientRect();
    const curCx = curRect.left + curRect.width / 2;
    const curCy = curRect.top + curRect.height / 2;

    let bestCandidate: HTMLElement | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      if (candidate === current) continue;
      const rect = candidate.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cx - curCx;
      const dy = cy - curCy;

      // Check horizontal/vertical overlap to favor aligned columns or rows
      const horizOverlap = Math.max(0, Math.min(curRect.right, rect.right) - Math.max(curRect.left, rect.left));
      const vertOverlap = Math.max(0, Math.min(curRect.bottom, rect.bottom) - Math.max(curRect.top, rect.top));

      let primaryDist = 0;
      let orthoDist = 0;
      let hasOverlap = false;

      if (dir === 'up') {
        if (cy >= curCy - 3) continue;
        primaryDist = curCy - cy;
        orthoDist = Math.abs(dx);
        hasOverlap = horizOverlap > 4;
      } else if (dir === 'down') {
        if (cy <= curCy + 3) continue;
        primaryDist = cy - curCy;
        orthoDist = Math.abs(dx);
        hasOverlap = horizOverlap > 4;
      } else if (dir === 'left') {
        if (cx >= curCx - 3) continue;
        primaryDist = curCx - cx;
        orthoDist = Math.abs(dy);
        hasOverlap = vertOverlap > 4;
      } else if (dir === 'right') {
        if (cx <= curCx + 3) continue;
        primaryDist = cx - curCx;
        orthoDist = Math.abs(dy);
        hasOverlap = vertOverlap > 4;
      }

      // Strongly prefer elements in the same visual row/column (overlapping orthographic projection)
      const orthoWeight = hasOverlap ? 0.35 : 2.65;
      const score = primaryDist + orthoDist * orthoWeight;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Cycles the active tab inside `[data-menu-tabs="true"]` when `[L]` or `[R]` is pressed.
   */
  private cycleTab(rootMenu: HTMLElement, delta: -1 | 1): boolean {
    const tabBar = rootMenu.querySelector<HTMLElement>('[data-menu-tabs="true"]');
    if (!tabBar || !isElementVisible(tabBar)) return false;

    const tabs = Array.from(tabBar.querySelectorAll<HTMLElement>('button:not(:disabled), [role="tab"]:not([aria-disabled="true"])')).filter(
      isElementVisible
    );
    if (tabs.length < 2) return false;

    let activeIndex = tabs.findIndex(
      t => t.getAttribute('data-tab-active') === 'true' || t.getAttribute('aria-selected') === 'true'
    );
    if (activeIndex < 0) {
      // Fallback: look for the tab button that currently has focus or default to 0
      activeIndex = this.currentFocusedEl ? tabs.indexOf(this.currentFocusedEl) : 0;
      if (activeIndex < 0) activeIndex = 0;
    }

    const nextIndex = (activeIndex + delta + tabs.length) % tabs.length;
    const targetTab = tabs[nextIndex];
    if (!targetTab) return false;

    targetTab.click();
    this.setFocus(targetTab, true);
    return true;
  }

  /**
   * Steps the menu navigation state for the current frame.
   */
  public step(input: GameInput, dtSeconds: number): MenuNavigationStepResult {
    this.ensurePointerSync();

    const containers = this.getActiveMenuContainers();
    if (!containers) {
      this.heldDirection = null;
      this.holdTimer = 0;
      this.lastScopeEl = null;
      if (this.currentFocusedEl) {
        this.clearFocus();
      }
      return {
        isMenuActive: false,
        handledInput: false,
        shouldCloseRootMenu: false,
      };
    }

    const { rootMenu, activeScope } = containers;
    const candidates = this.getFocusableElements(activeScope);

    // Ensure valid current focus inside activeScope
    if (
      this.lastScopeEl !== activeScope ||
      !this.currentFocusedEl ||
      !candidates.includes(this.currentFocusedEl)
    ) {
      this.lastScopeEl = activeScope;
      const initial = this.pickInitialFocus(activeScope, candidates);
      this.setFocus(initial, true);
    } else if (!this.currentFocusedEl.hasAttribute('data-gamepad-focus')) {
      this.currentFocusedEl.setAttribute('data-gamepad-focus', 'true');
    }

    let handledInput = false;
    let shouldCloseRootMenu = false;

    // 1. Handle [L] / [R] shoulder buttons to cycle top-level tabs
    if (input.pressed.l) {
      if (this.cycleTab(rootMenu, -1)) {
        handledInput = true;
      }
    } else if (input.pressed.r) {
      if (this.cycleTab(rootMenu, 1)) {
        handledInput = true;
      }
    }

    // 2. Handle 2D directional navigation (with hold auto-repeat)
    const activeDir: Direction | null = input.held.up
      ? 'up'
      : input.held.down
      ? 'down'
      : input.held.left
      ? 'left'
      : input.held.right
      ? 'right'
      : null;

    const freshDirPress =
      (activeDir === 'up' && input.pressed.up) ||
      (activeDir === 'down' && input.pressed.down) ||
      (activeDir === 'left' && input.pressed.left) ||
      (activeDir === 'right' && input.pressed.right);

    let triggerMove: Direction | null = null;
    if (!activeDir) {
      this.heldDirection = null;
      this.holdTimer = 0;
    } else if (freshDirPress || this.heldDirection !== activeDir) {
      this.heldDirection = activeDir;
      this.holdTimer = INITIAL_REPEAT_DELAY;
      triggerMove = activeDir;
    } else {
      this.holdTimer -= dtSeconds;
      if (this.holdTimer <= 0) {
        this.holdTimer += REPEAT_INTERVAL;
        triggerMove = activeDir;
      }
    }

    if (triggerMove && candidates.length > 0) {
      const current = this.currentFocusedEl ?? candidates[0];
      // Support <input type="range"> adjustment with left/right
      if (
        current.tagName.toLowerCase() === 'input' &&
        (current as HTMLInputElement).type === 'range' &&
        (triggerMove === 'left' || triggerMove === 'right')
      ) {
        const rangeInput = current as HTMLInputElement;
        const min = parseFloat(rangeInput.min || '0');
        const max = parseFloat(rangeInput.max || '100');
        const step = parseFloat(rangeInput.step || '1') || (max - min) / 20;
        const curVal = parseFloat(rangeInput.value || '0');
        const nextVal = Math.max(min, Math.min(max, curVal + (triggerMove === 'right' ? step : -step)));
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        nativeInputValueSetter?.call(rangeInput, String(nextVal));
        rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
        rangeInput.dispatchEvent(new Event('change', { bubbles: true }));
        handledInput = true;
      } else {
        const nextEl = this.findNextElement(current, candidates, triggerMove);
        if (nextEl) {
          this.setFocus(nextEl, true);
        }
        handledInput = true;
      }
    }

    // 3. Handle [A] button to activate/click the focused element
    if (input.pressed.a && this.currentFocusedEl) {
      const el = this.currentFocusedEl;
      const tag = el.tagName.toLowerCase();
      if (tag === 'input' && (el as HTMLInputElement).type === 'text') {
        if (document.activeElement === el) {
          el.blur();
        } else {
          el.focus();
        }
      } else if (tag === 'select') {
        const selectEl = el as HTMLSelectElement;
        if (selectEl.options.length > 0) {
          selectEl.selectedIndex = (selectEl.selectedIndex + 1) % selectEl.options.length;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        el.click();
      }
      handledInput = true;
    }

    // 4. Handle [B] button for hierarchical back / close
    if (input.pressed.b) {
      const activeDocEl = document.activeElement as HTMLElement | null;
      if (
        activeDocEl &&
        (activeDocEl.tagName.toLowerCase() === 'input' || activeDocEl.tagName.toLowerCase() === 'textarea') &&
        (activeDocEl as HTMLInputElement).type !== 'range'
      ) {
        activeDocEl.blur();
        handledInput = true;
      } else {
        const backBtn =
          activeScope.querySelector<HTMLElement>('[data-menu-back="true"]') ??
          rootMenu.querySelector<HTMLElement>('[data-menu-back="true"]');
        if (backBtn && isElementVisible(backBtn)) {
          backBtn.click();
          handledInput = true;
        } else {
          shouldCloseRootMenu = true;
          handledInput = true;
        }
      }
    }

    return {
      isMenuActive: true,
      handledInput,
      shouldCloseRootMenu,
    };
  }
}

/**
 * Shared singleton instance of the universal menu navigator.
 */
export const universalMenuNavigator = new UniversalMenuNavigator();
