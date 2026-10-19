/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerBase64Atlas } from '../../../systems/base64AssetLoader';
import {
  BasicFourTilesInput,
  bakeBiomeClusterTileset,
} from '../../../systems/subTileComposer';
import { ClusterTerrainType, TileDefinition } from '../../../types';
import { getBiomeDefinition } from '../biomes';
import { dirt01, groundTile } from './floor';
import { grass01 } from './grass';
import { aether01 } from './mud';
import { ruins01 } from './ruins_floor';

// Auto-discover all tile entity modules in this directory (including subfolders) via Vite import.meta.glob
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

export const TILE_REGISTRY: Record<string, TileDefinition> = {};
export const TILE_BY_ID_REGISTRY: Record<string, TileDefinition> = {};

function isTileDefinition(val: unknown): val is TileDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'char' in val &&
    'type' in val &&
    'solid' in val
  );
}

const embeddedBaseTiles: Partial<BasicFourTilesInput> = {};
const embeddedModes: Partial<Record<ClusterTerrainType, '4x4' | '2x2'>> = {};

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isTileDefinition(exportedValue)) {
      TILE_REGISTRY[exportedValue.char] = exportedValue;
      TILE_BY_ID_REGISTRY[exportedValue.id] = exportedValue;

      // If this tile entry file embeds a 16x16 Base64 terrain seed (`floor.ts`, `grass.ts`, `mud.ts`, `ruins_floor.ts`),
      // register it as an atlas and feed it into the Sub-Tile Micro-Composer!
      if (exportedValue.baseTileBase64) {
        registerBase64Atlas(exportedValue.id, exportedValue.baseTileBase64, 16, 16);
      }
      if (exportedValue.clusterTerrain && exportedValue.baseTileBase64) {
        if (exportedValue.clusterTerrain === 'dirt') embeddedBaseTiles.dirt01 = exportedValue.baseTileBase64;
        if (exportedValue.clusterTerrain === 'grass') embeddedBaseTiles.grass01 = exportedValue.baseTileBase64;
        if (exportedValue.clusterTerrain === 'aether') embeddedBaseTiles.aether01 = exportedValue.baseTileBase64;
        if (exportedValue.clusterTerrain === 'ruins') embeddedBaseTiles.ruins01 = exportedValue.baseTileBase64;
      }
      if (exportedValue.clusterTerrain && exportedValue.subTileMode) {
        embeddedModes[exportedValue.clusterTerrain] = exportedValue.subTileMode;
      }
    }
  }
}

// Bake all 20 3x3 biome clusters directly from the assets embedded in floor.ts, grass.ts, mud.ts, and ruins_floor.ts!
bakeBiomeClusterTileset(embeddedBaseTiles, embeddedModes);

/**
 * Resolve a tile character into its TileDefinition, honoring the active Biome's
 * tileTypes mapping when provided.
 */
export function getTileDefinition(char: string, biomeId?: string): TileDefinition {
  if (biomeId) {
    const biome = getBiomeDefinition(biomeId);
    const mappedId = biome.tileTypes?.[char];
    if (mappedId && TILE_BY_ID_REGISTRY[mappedId]) {
      return TILE_BY_ID_REGISTRY[mappedId];
    }
  }
  return TILE_REGISTRY[char] || TILE_REGISTRY['.'] || groundTile;
}

export { dirt01, grass01, aether01, ruins01 };
