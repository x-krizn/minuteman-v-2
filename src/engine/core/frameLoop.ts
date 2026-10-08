/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class FrameLoop {
  private running = false;
  private lastTime = 0;
  private rafId: number | null = null;
  private maxDeltaMs = 100;
  private stepCallback: ((dtSeconds: number, nowMs: number) => void) | null = null;
  private fps = 60;
  private framesCount = 0;
  private fpsTimer = 0;

  public setMaxDeltaMs(ms: number): void {
    this.maxDeltaMs = ms;
  }

  public getFps(): number {
    return this.fps;
  }

  public start(stepCallback: (dtSeconds: number, nowMs: number) => void): void {
    if (this.running) return;
    this.running = true;
    this.stepCallback = stepCallback;
    this.lastTime = performance.now();
    this.fpsTimer = this.lastTime;
    this.framesCount = 0;

    const tick = (now: number) => {
      if (!this.running) return;

      const rawDelta = now - this.lastTime;
      const dtMs = Math.min(Math.max(rawDelta, 0), this.maxDeltaMs);
      this.lastTime = now;

      // Track FPS
      this.framesCount++;
      if (now - this.fpsTimer >= 1000) {
        this.fps = this.framesCount;
        this.framesCount = 0;
        this.fpsTimer = now;
      }

      if (this.stepCallback) {
        this.stepCallback(dtMs / 1000, now);
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  public stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

export const frameLoop = new FrameLoop();
