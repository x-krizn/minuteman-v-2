/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registry } from '../engine/core/registry';
import { createKnightCartridge } from './knight/knightCartridge';
import { createTemplateCartridge } from './templateCartridge';
import { createWalkTestCartridge } from './walkTestCartridge';

export function initializeCartridges(): void {
  // Register template first
  registry.register(createTemplateCartridge());
  // Register walk test
  registry.register(createWalkTestCartridge());
  // Register full knight metroidvania prototype
  registry.register(createKnightCartridge());
}

export {
  createKnightCartridge,
  createTemplateCartridge,
  createWalkTestCartridge,
};
