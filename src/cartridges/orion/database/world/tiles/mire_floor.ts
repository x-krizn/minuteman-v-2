/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';
import { bogTiles_02_02 } from './bog_tileset_atlas';

export const mire01 = bogTiles_02_02;

export const mireFloorTile: TileDefinition = {
  id: 'mire_floor',
  char: ';',
  name: 'Dark Bog Mire & Dungeon Stone',
  type: 'floor',
  solid: false,
  blocksHeight: 0,
  bakedTopColor: '#1e242b',
  clusterTerrain: 'mire',
  subTileMode: '4x4',
  baseTileBase64: mire01,
};
