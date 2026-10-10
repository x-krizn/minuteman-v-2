/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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

export interface MenuItem {
  label: string;
  go: ShellScreen;
}
