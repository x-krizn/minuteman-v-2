/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registry } from '../engine/core/registry';
import { createKnightCartridge } from './knight';
import { createOrionCartridge } from './orion';

/**
 * Registers all built-in game cartridges (`orion` and `knight`) into the global `CartridgeRegistry` at startup.
 */
export function initializeCartridges(): void {
  // Register Orion 2.5D Action RPG cartridge
  registry.register(createOrionCartridge());

  // Register Knight Metroid-Souls cartridge
  registry.register(createKnightCartridge());
}

export { createKnightCartridge, createOrionCartridge };
