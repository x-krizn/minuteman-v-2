/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cartridge } from '../../types/cartridge';

export const MAX_ERRORS = 20;

export class CartridgeRegistry {
  private static instance: CartridgeRegistry;
  private carts: Cartridge[] = [];
  private errors: string[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): CartridgeRegistry {
    if (!CartridgeRegistry.instance) {
      CartridgeRegistry.instance = new CartridgeRegistry();
    }
    return CartridgeRegistry.instance;
  }

  public register(cart: Cartridge): boolean {
    if (!cart || typeof cart !== 'object') {
      this.logError('REGISTER: NOT AN OBJECT');
      return false;
    }
    if (typeof cart.id !== 'string' || cart.id === '') {
      this.logError('REGISTER: MISSING ID');
      return false;
    }
    if (typeof cart.name !== 'string' || cart.name === '') {
      this.logError(`REGISTER ${cart.id}: MISSING NAME`);
      return false;
    }
    if (typeof cart.update !== 'function' || typeof cart.draw !== 'function') {
      this.logError(`REGISTER ${cart.id}: NEEDS update AND draw`);
      return false;
    }
    if (this.carts.some((c) => c.id === cart.id)) {
      this.logError(`REGISTER ${cart.id}: DUPLICATE ID`);
      return false;
    }

    this.carts.push(cart);
    this.notify();
    return true;
  }

  public getCartridges(): readonly Cartridge[] {
    return [...this.carts];
  }

  public getCartridge(id: string): Cartridge | undefined {
    return this.carts.find((c) => c.id === id);
  }

  public logError(msg: string): void {
    const entry = String(msg);
    this.errors.push(entry);
    if (this.errors.length > MAX_ERRORS) {
      this.errors.shift();
    }
    this.notify();
  }

  public getErrors(): readonly string[] {
    return [...this.errors];
  }

  public clearErrors(): void {
    this.errors = [];
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const registry = CartridgeRegistry.getInstance();
