/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64AtlasDefinition, registerBase64Atlas } from './base64AssetLoader';

// Auto-discover any Base64 atlas modules dropped into ./database/assets/**/*.ts
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

function isBase64AtlasDefinition(val: unknown): val is Base64AtlasDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'base64' in val &&
    typeof (val as Base64AtlasDefinition).base64 === 'string'
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts' || path === './base64AssetLoader.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isBase64AtlasDefinition(exportedValue)) {
      registerBase64Atlas(
        exportedValue.id,
        exportedValue.base64,
        exportedValue.cellWidth,
        exportedValue.cellHeight
      );
    }
  }
}

export * from './base64AssetLoader';
