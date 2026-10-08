/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class SoundSystem {
  private static instance: SoundSystem;
  private ctx: AudioContext | null = null;
  private enabled = true;

  private constructor() {}

  public static getInstance(): SoundSystem {
    if (!SoundSystem.instance) {
      SoundSystem.instance = new SoundSystem();
    }
    return SoundSystem.instance;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  private initCtx(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTone(freqStart: number, freqEnd: number, duration: number, type: OscillatorType = 'square', volume = 0.08): void {
    const ctx = this.initCtx();
    if (!ctx || !this.enabled) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), ctx.currentTime + duration);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  }

  public playJump(): void {
    this.playTone(180, 440, 0.12, 'square', 0.06);
  }

  public playDoubleJump(): void {
    this.playTone(320, 680, 0.15, 'triangle', 0.07);
  }

  public playSword(): void {
    this.playTone(380, 140, 0.08, 'sawtooth', 0.05);
  }

  public playHit(): void {
    this.playTone(150, 60, 0.14, 'square', 0.08);
  }

  public playCoin(): void {
    this.playTone(880, 1320, 0.09, 'sine', 0.05);
  }

  public playKey(): void {
    this.playTone(580, 960, 0.18, 'triangle', 0.07);
  }

  public playUnlock(): void {
    this.playTone(400, 800, 0.25, 'square', 0.08);
  }

  public playMenuBeep(): void {
    this.playTone(600, 600, 0.04, 'square', 0.03);
  }

  public playSelect(): void {
    this.playTone(480, 720, 0.07, 'square', 0.05);
  }

  public playDash(): void {
    this.playTone(320, 100, 0.12, 'sawtooth', 0.06);
  }

  public playParry(): void {
    this.playTone(920, 1480, 0.22, 'triangle', 0.12);
  }

  public playBlock(): void {
    this.playTone(160, 90, 0.1, 'square', 0.07);
  }

  public playCharge(): void {
    this.playTone(220, 660, 0.2, 'sine', 0.04);
  }

  public playHeavyAttack(): void {
    this.playTone(120, 50, 0.2, 'sawtooth', 0.1);
  }

  public playSpellCast(): void {
    this.playTone(520, 1040, 0.18, 'sine', 0.08);
  }

  public playPogo(): void {
    this.playTone(280, 750, 0.14, 'triangle', 0.08);
  }
}

export const soundSystem = SoundSystem.getInstance();
