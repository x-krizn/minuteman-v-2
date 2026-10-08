/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cartridge, CartridgeSurface } from '../../types/cartridge';
import { GameInput } from '../../types/input';
import { loadCartridgeAssets } from './assetLoader';
import { registry } from './registry';

export class CartridgeRunner {
  private activeCart: Cartridge | null = null;
  private isReady = false;
  private isLoading = false;
  private runToken = 0;
  private surface: CartridgeSurface | null = null;
  private onQuitCallback: (() => void) | null = null;
  private onStatusChangeCallback: (() => void) | null = null;

  public setSurface(surface: CartridgeSurface): void {
    this.surface = surface;
  }

  public setOnQuit(cb: () => void): void {
    this.onQuitCallback = cb;
  }

  public setOnStatusChange(cb: () => void): void {
    this.onStatusChangeCallback = cb;
  }

  public getActive(): Cartridge | null {
    return this.activeCart;
  }

  public getIsReady(): boolean {
    return this.isReady;
  }

  public getIsLoading(): boolean {
    return this.isLoading;
  }

  public startCart(cart: Cartridge): void {
    this.stopCart();
    this.activeCart = cart;
    this.isReady = false;
    this.isLoading = true;
    const token = ++this.runToken;

    if (!this.surface) {
      registry.logError(`${cart.id}: Surface not mounted`);
      this.stopCart();
      return;
    }

    this.surface.g.clearRect(0, 0, this.surface.width, this.surface.height);
    this.surface.assets = {};
    this.notifyStatus();

    const proceedWithInit = () => {
      let initResult: void | Promise<void>;
      try {
        initResult = typeof cart.init === 'function' ? cart.init(this.surface!) : undefined;
      } catch (err) {
        this.failCart(cart, 'init', err);
        return;
      }

      if (initResult && typeof (initResult as Promise<void>).then === 'function') {
        (initResult as Promise<void>).then(
          () => {
            if (token === this.runToken) {
              this.isReady = true;
              this.isLoading = false;
              this.notifyStatus();
            }
          },
          (err) => {
            if (token === this.runToken) {
              this.failCart(cart, 'init', err);
            }
          }
        );
      } else {
        this.isReady = true;
        this.isLoading = false;
        this.notifyStatus();
      }
    };

    if (!cart.assets || Object.keys(cart.assets).length === 0) {
      proceedWithInit();
      return;
    }

    loadCartridgeAssets(cart.id, cart.assets).then(
      (lib) => {
        if (token === this.runToken && this.surface) {
          this.surface.assets = lib;
          proceedWithInit();
        }
      },
      (err) => {
        if (token === this.runToken) {
          this.failCart(cart, 'assets', err);
        }
      }
    );
  }

  public step(input: GameInput, dtSeconds: number): void {
    const cart = this.activeCart;
    if (!cart) return;

    // Guaranteed escape hatch: START + SELECT pressed together leaves game
    if (
      input.held.start &&
      input.held.select &&
      (input.pressed.start || input.pressed.select)
    ) {
      this.stopCart();
      if (this.onQuitCallback) {
        this.onQuitCallback();
      }
      return;
    }

    if (!this.isReady || !this.surface) {
      return;
    }

    try {
      cart.update(input, dtSeconds);
    } catch (err) {
      this.failCart(cart, 'update', err);
      return;
    }

    try {
      cart.draw(this.surface);
    } catch (err) {
      this.failCart(cart, 'draw', err);
    }
  }

  public stopCart(): void {
    this.runToken++;
    const cart = this.activeCart;
    this.activeCart = null;
    this.isReady = false;
    this.isLoading = false;

    if (this.surface) {
      this.surface.assets = {};
      this.surface.g.clearRect(0, 0, this.surface.width, this.surface.height);
    }

    if (cart && typeof cart.destroy === 'function') {
      try {
        cart.destroy();
      } catch (err) {
        registry.logError(`${cart.id} destroy: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    this.notifyStatus();
  }

  private failCart(cart: Cartridge, stage: string, err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    registry.logError(`${cart.id} ${stage}: ${msg}`);
    this.stopCart();
    if (this.onQuitCallback) {
      this.onQuitCallback();
    }
  }

  private notifyStatus(): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback();
    }
  }
}

export const cartridgeRunner = new CartridgeRunner();
