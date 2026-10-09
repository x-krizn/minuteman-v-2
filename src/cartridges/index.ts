/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registry } from '../engine/core/registry';
import { createKnightCartridge } from './knight/knightCartridge';

export function initializeCartridges(): void {
  // Register Knight Metroid-Souls cartridge
  registry.register(createKnightCartridge());
}

export { createKnightCartridge };
