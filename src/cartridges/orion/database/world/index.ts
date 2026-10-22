/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BasicFourTilesInput,
  bakeBiomeClusterTileset,
  registerBase64Atlas,
} from '../../systems/renderSystem';
import {
  AreaWikiDefinition,
  BiomeDefinition,
  ClusterTerrainType,
  MapDefinition,
  RegionDefinition,
  RoomDefinition,
  TileDefinition,
  WaygateNode,
  WaystationNode,
} from '../../types';
import { belldorBogBiome } from './belldor/biomes';
import { camelotBorderTownArea } from './belldor/region_belldor_camelot_heartland/camelot_border_town/area';
import { m00TheBogArea } from './belldor/region_belldor_outskirts/m00_the_bog/area';
import { regionBelldorOutskirts } from './belldor/region_belldor_outskirts/region';
import { U00_UNIVERSE_CATALOG, UNIVERSE_WORLD_BY_ID } from './universe';
import { dirt01, groundTile } from './tiles/floor';
import { DOODADS_01_ATLAS_ID, DOODADS_01_BASE64 } from './tiles/doodads_atlas';
import { grass01 } from './tiles/grass';
import { aether01 } from './tiles/mud';
import { ruins01 } from './tiles/ruins_floor';

export const GLOBAL_REGION_REGISTRY: Record<string, RegionDefinition> = {};
export const LOCAL_REGION_REGISTRY: Record<string, RegionDefinition> = {};
export const REGION_REGISTRY: Record<string, RegionDefinition> = {};
export const WAYGATE_REGISTRY: Record<string, WaygateNode> = {};

export const GLOBAL_AREA_REGISTRY: Record<string, AreaWikiDefinition> = {};
export const LOCAL_AREA_REGISTRY: Record<string, AreaWikiDefinition> = {};
export const AREA_REGISTRY: Record<string, AreaWikiDefinition> = {};
export const WAYSTATION_REGISTRY: Record<string, WaystationNode> = {};

export const GLOBAL_MAP_REGISTRY: Record<string, MapDefinition> = {};
export const LOCAL_MAP_REGISTRY: Record<string, MapDefinition> = {};
export const MAP_REGISTRY: Record<string, MapDefinition> = {};

export const GLOBAL_ROOM_REGISTRY: Record<string, RoomDefinition> = {};
export const LOCAL_ROOM_REGISTRY: Record<string, RoomDefinition> = {};
export const LOCAL_ROOM_BY_ID_REGISTRY: Record<string, RoomDefinition> = {};

export const GLOBAL_BIOME_REGISTRY: Record<string, BiomeDefinition> = {};
export const LOCAL_BIOME_REGISTRY: Record<string, BiomeDefinition> = {};
export const BIOME_REGISTRY: Record<string, BiomeDefinition> = {};

export const TILE_REGISTRY: Record<string, TileDefinition> = {};
export const TILE_BY_ID_REGISTRY: Record<string, TileDefinition> = {};

/**
 * Single Polymorphic Auto-Discovery World Registry
 *
 * Scans the entire `database/world/` spatial hierarchy (`World -> Region -> Area -> Map + Rooms`,
 * `global/`, and `tiles/`) in a single pass and classifies exported definitions by their structural shape.
 */
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

function isRegionDefinition(val: unknown): val is RegionDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'scope' in val &&
    'localAreaIds' in val &&
    'globalAreaIds' in val
  );
}

function isAreaDefinition(val: unknown): val is AreaWikiDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'scope' in val &&
    'localMapIds' in val &&
    'globalMapIds' in val
  );
}

function isMapDefinition(val: unknown): val is MapDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'scope' in val &&
    'localRoomCoords' in val &&
    'globalRoomSlots' in val
  );
}

function isRoomDefinition(val: unknown): val is RoomDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'coord' in val &&
    'grid' in val &&
    'areaId' in val
  );
}

function isBiomeDefinition(val: unknown): val is BiomeDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'scope' in val &&
    'tileRules' in val &&
    'tileAssets' in val
  );
}

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
    if (isRegionDefinition(exportedValue)) {
      REGION_REGISTRY[exportedValue.id] = exportedValue;
      if (exportedValue.scope === 'global') {
        GLOBAL_REGION_REGISTRY[exportedValue.id] = exportedValue;
      } else {
        LOCAL_REGION_REGISTRY[exportedValue.id] = exportedValue;
      }
      if (exportedValue.waygate) {
        WAYGATE_REGISTRY[exportedValue.waygate.id] = exportedValue.waygate;
      }
    } else if (isAreaDefinition(exportedValue)) {
      AREA_REGISTRY[exportedValue.id] = exportedValue;
      if (exportedValue.scope === 'global') {
        GLOBAL_AREA_REGISTRY[exportedValue.id] = exportedValue;
      } else {
        LOCAL_AREA_REGISTRY[exportedValue.id] = exportedValue;
      }
      if (exportedValue.waystation) {
        WAYSTATION_REGISTRY[exportedValue.waystation.id] = exportedValue.waystation;
      }
    } else if (isMapDefinition(exportedValue)) {
      MAP_REGISTRY[exportedValue.id] = exportedValue;
      if (exportedValue.scope === 'global') {
        GLOBAL_MAP_REGISTRY[exportedValue.id] = exportedValue;
      } else {
        LOCAL_MAP_REGISTRY[exportedValue.id] = exportedValue;
      }
    } else if (isRoomDefinition(exportedValue)) {
      if (exportedValue.scope === 'global') {
        const id = exportedValue.id || exportedValue.coord;
        GLOBAL_ROOM_REGISTRY[id] = exportedValue;
      } else {
        LOCAL_ROOM_REGISTRY[exportedValue.coord] = exportedValue;
        if (exportedValue.id) {
          LOCAL_ROOM_BY_ID_REGISTRY[exportedValue.id] = exportedValue;
        }
      }
    } else if (isBiomeDefinition(exportedValue)) {
      BIOME_REGISTRY[exportedValue.id] = exportedValue;
      if (exportedValue.scope === 'global') {
        GLOBAL_BIOME_REGISTRY[exportedValue.id] = exportedValue;
      } else {
        LOCAL_BIOME_REGISTRY[exportedValue.id] = exportedValue;
      }
    } else if (isTileDefinition(exportedValue)) {
      TILE_REGISTRY[exportedValue.char] = exportedValue;
      TILE_BY_ID_REGISTRY[exportedValue.id] = exportedValue;

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

// Bake all 20 3x3 biome clusters directly from the 4 embedded 16x16 base tiles
bakeBiomeClusterTileset(embeddedBaseTiles, embeddedModes);
registerBase64Atlas(DOODADS_01_ATLAS_ID, DOODADS_01_BASE64, 16, 16);

export function getRegionDefinition(regionId?: string): RegionDefinition {
  if (regionId && REGION_REGISTRY[regionId]) {
    return REGION_REGISTRY[regionId];
  }
  return regionBelldorOutskirts;
}

export function getAreaDefinition(areaId?: string): AreaWikiDefinition {
  if (areaId && AREA_REGISTRY[areaId]) {
    return AREA_REGISTRY[areaId];
  }
  return m00TheBogArea;
}

export function getMapDefinition(mapId?: string): MapDefinition | undefined {
  if (mapId && MAP_REGISTRY[mapId]) {
    return MAP_REGISTRY[mapId];
  }
  return MAP_REGISTRY.map_bog_drop_zone;
}

export function getBiomeDefinition(biomeId?: string): BiomeDefinition {
  if (biomeId && BIOME_REGISTRY[biomeId]) {
    return BIOME_REGISTRY[biomeId];
  }
  return belldorBogBiome;
}

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

export {
  aether01,
  belldorBogBiome,
  camelotBorderTownArea,
  dirt01,
  grass01,
  m00TheBogArea,
  regionBelldorOutskirts,
  ruins01,
  U00_UNIVERSE_CATALOG,
  UNIVERSE_WORLD_BY_ID,
};
export type { AreaWikiDefinition, BiomeDefinition, MapDefinition, RegionDefinition, RoomDefinition };
