/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64AtlasDefinition } from './base64AssetLoader';
import { bakeBiomeClusterTileset } from './subTileComposer';

/**
 * Compact Sub-Tile Biome Cluster Registry (~1 KB source file instead of >60 KB of hardcoded Base64!)
 *
 * At startup, `bakeBiomeClusterTileset()` assembles all 20 separated `3×3` clusters (`48×48px` each)
 * and the combined `192×240px` `ruins_tileset` once onto offscreen canvases from `4×4px` micro-blocks
 * (`dirt`, `grass`, `aether`) and `8×8px` quadrants (`ruins` masonry & `Row 5` walls/single pillars).
 */
const baked = bakeBiomeClusterTileset();

export const ruins_tileset = 'ruins_tileset';

export const SEPARATED_CLUSTER_ATLASES: Base64AtlasDefinition[] = baked.atlases;

export const ruinsTilesetAtlas: Base64AtlasDefinition = baked.masterAtlas;
