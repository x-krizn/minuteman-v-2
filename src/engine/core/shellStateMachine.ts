/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cartridge } from '../../types/cartridge';
import { GameInput } from '../../types/input';
import { MenuItem, ShellScreen } from '../../types/shell';
import { cartridgeRunner } from './cartridgeRunner';
import { registry } from './registry';
import { soundSystem } from './soundSystem';

export const MENU_ITEMS: MenuItem[] = [
  { label: 'PLAY KNIGHT', go: 'carts' },
  { label: 'HOW-TO & COMBAT', go: 'howto' },
  { label: 'SETTINGS', go: 'settings' },
  { label: 'DEBUGGER', go: 'debug' },
  { label: 'CREDITS', go: 'credits' },
  { label: 'EXIT', go: 'exit' },
];

export const HOWTO_LINES = [
  'A: JUMP (MID-AIR JUMP)',
  'B: DASH (HOLD SPRINT)',
  'X: ATTACK (HOLD CHARGE)',
  'Y: BLOCK (TIMED PARRY)',
  'L / R: ASSIGNED SKILLS',
  'START: MENU & SAVE',
  'SHIFT: SATCHEL & SHOP',
];

export class ShellStateMachine {
  private currentScreen: ShellScreen = 'splash';
  private splashMs = 0;
  private menuIndex = 0;
  private cartIndex = 0;
  private splashDurationMs = 1500;
  private onScreenChangeCallback: (() => void) | null = null;

  public setOnScreenChange(cb: () => void): void {
    this.onScreenChangeCallback = cb;
  }

  public getScreen(): ShellScreen {
    return this.currentScreen;
  }

  public setScreen(screen: ShellScreen): void {
    if (this.currentScreen !== screen) {
      this.currentScreen = screen;
      this.notify();
    }
  }

  public getMenuIndex(): number {
    return this.menuIndex;
  }

  public getCartIndex(): number {
    return this.cartIndex;
  }

  public setMenuIndex(idx: number): void {
    this.menuIndex = idx;
    this.notify();
  }

  public setCartIndex(idx: number): void {
    this.cartIndex = idx;
    this.notify();
  }

  public selectCurrentMenuItem(): void {
    soundSystem.playSelect();
    const item = MENU_ITEMS[this.menuIndex];
    if (item) {
      this.setScreen(item.go);
    }
  }

  public launchCartridgeAtIndex(idx: number): void {
    const carts = registry.getCartridges();
    if (idx >= 0 && idx < carts.length) {
      soundSystem.playSelect();
      cartridgeRunner.startCart(carts[idx]);
    }
  }

  public step(input: GameInput, dtSeconds: number): void {
    const p = input.pressed;
    const dtMs = dtSeconds * 1000;

    switch (this.currentScreen) {
      case 'splash': {
        this.splashMs += dtMs;
        const anyPress = Object.keys(p).some((k) => p[k as keyof typeof p]);
        if (this.splashMs >= this.splashDurationMs || anyPress) {
          this.setScreen('menu');
        }
        break;
      }

      case 'menu': {
        const count = MENU_ITEMS.length;
        if (p.up) {
          this.menuIndex = (this.menuIndex + count - 1) % count;
          soundSystem.playMenuBeep();
          this.notify();
        } else if (p.down) {
          this.menuIndex = (this.menuIndex + 1) % count;
          soundSystem.playMenuBeep();
          this.notify();
        }

        if (p.a || p.start) {
          this.selectCurrentMenuItem();
        }
        break;
      }

      case 'carts': {
        const carts = registry.getCartridges();
        if (p.b) {
          soundSystem.playMenuBeep();
          this.setScreen('menu');
          break;
        }
        if (carts.length === 0) {
          break;
        }

        const count = carts.length;
        if (this.cartIndex >= count) this.cartIndex = 0;

        if (p.up) {
          this.cartIndex = (this.cartIndex + count - 1) % count;
          soundSystem.playMenuBeep();
          this.notify();
        } else if (p.down) {
          this.cartIndex = (this.cartIndex + 1) % count;
          soundSystem.playMenuBeep();
          this.notify();
        }

        if (p.a || p.start) {
          this.launchCartridgeAtIndex(this.cartIndex);
        }
        break;
      }

      case 'howto':
      case 'settings':
      case 'credits':
      case 'exit': {
        if (p.b) {
          soundSystem.playMenuBeep();
          this.setScreen('menu');
        }
        break;
      }

      case 'debug': {
        if (p.b) {
          soundSystem.playMenuBeep();
          this.setScreen('menu');
        }
        break;
      }

      default:
        this.setScreen('menu');
    }
  }

  public getScreenContent(input?: GameInput): {
    title: string;
    lines: string[];
    selectedIndex: number;
  } {
    switch (this.currentScreen) {
      case 'splash':
        return {
          title: '',
          lines: ['GAMES, BUDDY.'],
          selectedIndex: -1,
        };

      case 'menu':
        return {
          title: 'minuteman Shell Menu',
          lines: MENU_ITEMS.map((m) => m.label),
          selectedIndex: this.menuIndex,
        };

      case 'carts': {
        const carts = registry.getCartridges();
        if (carts.length === 0) {
          return {
            title: 'Cartridges',
            lines: ['NO CARTRIDGES.', '', 'B: BACK'],
            selectedIndex: -1,
          };
        }
        return {
          title: 'Cartridges',
          lines: carts.map((c) => c.name),
          selectedIndex: this.cartIndex,
        };
      }

      case 'howto':
        return {
          title: 'How-To',
          lines: [...HOWTO_LINES, '', 'B: BACK'],
          selectedIndex: -1,
        };

      case 'settings':
        return {
          title: 'Settings',
          lines: [
            soundSystem.isEnabled() ? 'AUDIO: ENABLED' : 'AUDIO: MUTED',
            'CONTROLS: TOUCH & KEYS',
            '',
            'B: BACK',
          ],
          selectedIndex: -1,
        };

      case 'debug': {
        const down = input
          ? Object.keys(input.held).filter((k) => input.held[k as keyof typeof input.held])
          : [];
        const errors = registry.getErrors();
        const lines = [
          `PAD: ${down.length ? down.join(' ').toUpperCase() : 'NONE'}`,
          `CARTS: ${registry.getCartridges().length}`,
          '',
          `ERRORS: ${errors.length ? '' : 'NONE'}`,
          ...errors.slice(-4),
          '',
          'B: BACK',
        ];
        return {
          title: 'Debugger',
          lines,
          selectedIndex: -1,
        };
      }

      case 'credits':
        return {
          title: 'Credits',
          lines: [
            'MINUTEMAN CONSOLE',
            'KNIGHT: METROID-SOULS',
            'MODULAR ENGINE v1.0',
            '',
            'B: BACK',
          ],
          selectedIndex: -1,
        };

      case 'exit':
        return {
          title: 'Exit',
          lines: ['SAFE TO CLOSE THIS TAB.', '', 'B: BACK'],
          selectedIndex: -1,
        };
    }
  }

  private notify(): void {
    if (this.onScreenChangeCallback) {
      this.onScreenChangeCallback();
    }
  }
}

export const shellStateMachine = new ShellStateMachine();
