/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64AtlasDefinition, registerBase64Atlas } from './base64AssetLoader';

// Auto-discover any Base64 or offscreen-baked atlas modules dropped into ./database/assets/**/*.ts
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
  if (
    path === './index.ts' ||
    path === './base64AssetLoader.ts' ||
    path === './clusterAutoTiler.ts' ||
    path === './subTileComposer.ts'
  )
    continue;
  for (const exportedValue of Object.values(mod)) {
    if (isBase64AtlasDefinition(exportedValue)) {
      registerBase64Atlas(
        exportedValue.id,
        exportedValue.base64,
        exportedValue.cellWidth,
        exportedValue.cellHeight,
        exportedValue.canvas
      );
    } else if (Array.isArray(exportedValue)) {
      for (const item of exportedValue) {
        if (isBase64AtlasDefinition(item)) {
          registerBase64Atlas(
            item.id,
            item.base64,
            item.cellWidth,
            item.cellHeight,
            item.canvas
          );
        }
      }
    }
  }
}

export * from './base64AssetLoader';
export * from './subTileComposer';
export * from './clusterAutoTiler';
export * from './ruins_tileset';
