/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

// Auto-discover all item entity modules in this directory (including subfolders) via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

export const ITEM_REGISTRY: Record<string, ItemWikiDefinition> = {};

function isItemWikiDefinition(val: unknown): val is ItemWikiDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'category' in val &&
    'iconColor' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isItemWikiDefinition(exportedValue)) {
      ITEM_REGISTRY[exportedValue.id] = exportedValue;
    }
  }
}

export function getItemDefinition(id: string): ItemWikiDefinition | undefined {
  return ITEM_REGISTRY[id];
}
