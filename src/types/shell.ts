/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Active screen identifier (`boot`, `menu`, `howto`, `credits`, `cartridge`) in `ShellStateMachine`.
 */
export type ShellScreen =
  | 'splash'
  | 'menu'
  | 'carts'
  | 'howto'
  | 'settings'
  | 'debug'
  | 'credits'
  | 'exit';

/**
 * Menu entry descriptor (`id`, `label`, `target`) used by the system shell menu.
 */
export interface MenuItem {
  label: string;
  go: ShellScreen;
}
