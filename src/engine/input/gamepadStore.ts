/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ButtonKey, GamepadButtons, StickVector } from '../../types/input';
import { triggerHaptic } from './haptics';

export const STICK_RADIUS_FRAC = 0.41;
export const STICK_DEADZONE = 0.2;
export const DIGITAL_THRESHOLD = 0.4;

export class GamepadStore {
  private static instance: GamepadStore;

  private state: GamepadButtons = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    l: false,
    r: false,
    x: false,
    y: false,
    start: false,
    select: false,
  };

  private stick: StickVector = { x: 0, y: 0 };
  private buttonSources: Map<ButtonKey, Set<string>> = new Map();
  private listeners: Set<(state: GamepadButtons, stick: StickVector) => void> = new Set();

  private constructor() {}

  public static getInstance(): GamepadStore {
    if (!GamepadStore.instance) {
      GamepadStore.instance = new GamepadStore();
    }
    return GamepadStore.instance;
  }

  public getState(): GamepadButtons {
    return { ...this.state };
  }

  public getStick(): StickVector {
    return { ...this.stick };
  }

  public setButtonState(
    key: ButtonKey,
    isActive: boolean,
    vibrate = true,
    source = 'default'
  ): void {
    let sources = this.buttonSources.get(key);
    if (!sources) {
      sources = new Set<string>();
      this.buttonSources.set(key, sources);
    }

    if (isActive) {
      sources.add(source);
    } else {
      sources.delete(source);
    }

    const nextIsActive = sources.size > 0;
    if (this.state[key] !== nextIsActive) {
      this.state[key] = nextIsActive;
      if (nextIsActive && vibrate) {
        triggerHaptic(10);
      }
      this.notify();
    }
  }

  public setStick(x: number, y: number, source = 'stick'): void {
    if (this.stick.x === x && this.stick.y === y) return;
    this.stick.x = x;
    this.stick.y = y;

    // Derive directional digital buttons from stick
    this.setButtonState('left', x < -DIGITAL_THRESHOLD, false, source);
    this.setButtonState('right', x > DIGITAL_THRESHOLD, false, source);
    this.setButtonState('up', y < -DIGITAL_THRESHOLD, false, source);
    this.setButtonState('down', y > DIGITAL_THRESHOLD, false, source);

    this.notify();
  }

  public resetAll(): void {
    this.buttonSources.clear();
    (Object.keys(this.state) as ButtonKey[]).forEach((k) => {
      this.state[k] = false;
    });
    this.stick = { x: 0, y: 0 };
    this.notify();
  }

  /**
   * Translates pointer delta into normalized vector with deadzone and clamping
   */
  public vectorFromOffset(dx: number, dy: number, radius: number): StickVector {
    const nx = dx / radius;
    const ny = dy / radius;
    const len = Math.hypot(nx, ny);

    if (len <= STICK_DEADZONE) {
      return { x: 0, y: 0 };
    }

    const out = Math.min(1, (len - STICK_DEADZONE) / (1 - STICK_DEADZONE));
    return {
      x: (nx / len) * out,
      y: (ny / len) * out,
    };
  }

  public subscribe(fn: (state: GamepadButtons, stick: StickVector) => void): () => void {
    this.listeners.add(fn);
    fn(this.getState(), this.getStick());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(): void {
    const snapshotState = this.getState();
    const snapshotStick = this.getStick();
    this.listeners.forEach((fn) => fn(snapshotState, snapshotStick));
  }
}

export const gamepadStore = GamepadStore.getInstance();
