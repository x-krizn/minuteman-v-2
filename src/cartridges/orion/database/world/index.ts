/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerBase64Atlas } from '../../systems/render/spriteAtlasCache';
import {
  bakeBiomeClusterTileset,
  BasicFourTilesInput,
} from '../../systems/render/worldRenderer';
import {
  AreaWikiDefinition,
  BiomeDefinition,
  ClusterTerrainType,
  EnemySpawnMap,
  EnemySpawnOverride,
  MapDefinition,
  RegionDefinition,
  RoomDefinition,
  TileDefinition,
  WaygateNode,
  WaystationNode,
} from '../../types';
import { registerBogTilesetAtlases } from './global/biomes/general/tiles/bog_tileset_atlas';
import { DOODADS_01_ATLAS_ID, DOODADS_01_BASE64 } from './global/biomes/general/tiles/doodads_atlas';
import { dirt01, groundTile } from './global/biomes/general/tiles/floor';
import { grass01 } from './global/biomes/general/tiles/grass';
import { mire01 } from './global/biomes/general/tiles/mire_floor';
import { aether01 } from './global/biomes/general/tiles/mud';
import { ruins01 } from './global/biomes/general/tiles/ruins_floor';
import { belldorBogBiome } from './overworld/belldor/biomes';
import { camelotBorderTownArea } from './overworld/belldor/region_belldor_camelot_heartland/camelot_border_town/area';
import { m00TheBogArea } from './overworld/belldor/region_belldor_outskirts/m00_the_bog/area';
import { regionBelldorOutskirts } from './overworld/belldor/region_belldor_outskirts/region';
import { U00_UNIVERSE_CATALOG, UNIVERSE_WORLD_BY_ID } from './universe';
import { auditWorldRegistries } from './worldAudit';

import {
  CHAR_TO_ENEMY_TYPE,
  ENEMY_REGISTRY,
  ENEMY_SPAWN_COLLISIONS,
  resolveEnemySpawnOverride,
  resolveEnemyTypeForChar,
} from '../enemies';

/**
 * Exported const `GLOBAL_REGION_REGISTRY` (global region registry) in `index.ts`.
 */
export const GLOBAL_REGION_REGISTRY: Record<string, RegionDefinition> = {};
/**
 * Exported const `LOCAL_REGION_REGISTRY` (local region registry) in `index.ts`.
 */
export const LOCAL_REGION_REGISTRY: Record<string, RegionDefinition> = {};
/**
 * Exported const `REGION_REGISTRY` (region registry) in `index.ts`.
 */
export const REGION_REGISTRY: Record<string, RegionDefinition> = {};
/**
 * Exported const `WAYGATE_REGISTRY` (waygate registry) in `index.ts`.
 */
export const WAYGATE_REGISTRY: Record<string, WaygateNode> = {};

/**
 * Exported const `GLOBAL_AREA_REGISTRY` (global area registry) in `index.ts`.
 */
export const GLOBAL_AREA_REGISTRY: Record<string, AreaWikiDefinition> = {};
/**
 * Exported const `LOCAL_AREA_REGISTRY` (local area registry) in `index.ts`.
 */
export const LOCAL_AREA_REGISTRY: Record<string, AreaWikiDefinition> = {};
/**
 * Exported const `AREA_REGISTRY` (area registry) in `index.ts`.
 */
export const AREA_REGISTRY: Record<string, AreaWikiDefinition> = {};
/**
 * Exported const `WAYSTATION_REGISTRY` (waystation registry) in `index.ts`.
 */
export const WAYSTATION_REGISTRY: Record<string, WaystationNode> = {};

/**
 * Exported const `GLOBAL_MAP_REGISTRY` (global map registry) in `index.ts`.
 */
export const GLOBAL_MAP_REGISTRY: Record<string, MapDefinition> = {};
/**
 * Exported const `LOCAL_MAP_REGISTRY` (local map registry) in `index.ts`.
 */
export const LOCAL_MAP_REGISTRY: Record<string, MapDefinition> = {};
/**
 * Exported const `MAP_REGISTRY` (map registry) in `index.ts`.
 */
export const MAP_REGISTRY: Record<string, MapDefinition> = {};

/**
 * Exported const `GLOBAL_ROOM_REGISTRY` (global room registry) in `index.ts`.
 */
export const GLOBAL_ROOM_REGISTRY: Record<string, RoomDefinition> = {};
/**
 * Exported const `LOCAL_ROOM_REGISTRY` (local room registry) in `index.ts`.
 */
export const LOCAL_ROOM_REGISTRY: Record<string, RoomDefinition> = {};
/**
 * Exported const `LOCAL_ROOM_BY_ID_REGISTRY` (local room by id registry) in `index.ts`.
 */
export const LOCAL_ROOM_BY_ID_REGISTRY: Record<string, RoomDefinition> = {};

/**
 * Exported const `GLOBAL_BIOME_REGISTRY` (global biome registry) in `index.ts`.
 */
export const GLOBAL_BIOME_REGISTRY: Record<string, BiomeDefinition> = {};
/**
 * Exported const `LOCAL_BIOME_REGISTRY` (local biome registry) in `index.ts`.
 */
export const LOCAL_BIOME_REGISTRY: Record<string, BiomeDefinition> = {};
/**
 * Exported const `BIOME_REGISTRY` (biome registry) in `index.ts`.
 */
export const BIOME_REGISTRY: Record<string, BiomeDefinition> = {};

/**
 * Exported const `TILE_REGISTRY` (tile registry) in `index.ts`.
 */
export const TILE_REGISTRY: Record<string, TileDefinition> = {};
/**
 * Exported const `TILE_BY_ID_REGISTRY` (tile by id registry) in `index.ts`.
 */
export const TILE_BY_ID_REGISTRY: Record<string, TileDefinition> = {};
/**
 * Exported const `TILE_CHAR_COLLISIONS` (tile char collisions) in `index.ts`.
 */
export const TILE_CHAR_COLLISIONS: string[] = [];

// [ORION-ANCHOR: WORLD-GLOB-REGISTRY]
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
  if (path === './index.ts' || path === './worldAudit.ts') continue;
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
      const existingTile = TILE_REGISTRY[exportedValue.char];
      if (existingTile && existingTile.id !== exportedValue.id) {
        const msg = `[Orion ASCII Audit] Duplicate global tile char '${exportedValue.char}' claimed by '${existingTile.id}' and '${exportedValue.id}'. Use biome.tileTypes to scope per biome.`;
        TILE_CHAR_COLLISIONS.push(msg);
      }
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
registerBogTilesetAtlases();
registerBase64Atlas(DOODADS_01_ATLAS_ID, DOODADS_01_BASE64, 16, 16);

/**
 * Exported const `WORLD_AUDIT_ISSUES` (world audit issues) in `index.ts`.
 */
export const WORLD_AUDIT_ISSUES: string[] = auditWorldRegistries({
  modules,
  universeCatalog: U00_UNIVERSE_CATALOG,
  regionRegistry: REGION_REGISTRY,
  localRegionRegistry: LOCAL_REGION_REGISTRY,
  globalRegionRegistry: GLOBAL_REGION_REGISTRY,
  areaRegistry: AREA_REGISTRY,
  localAreaRegistry: LOCAL_AREA_REGISTRY,
  globalAreaRegistry: GLOBAL_AREA_REGISTRY,
  mapRegistry: MAP_REGISTRY,
  localMapRegistry: LOCAL_MAP_REGISTRY,
  globalMapRegistry: GLOBAL_MAP_REGISTRY,
  localRoomRegistry: LOCAL_ROOM_REGISTRY,
  globalRoomRegistry: GLOBAL_ROOM_REGISTRY,
  biomeRegistry: BIOME_REGISTRY,
  tileRegistry: TILE_REGISTRY,
  tileByIdRegistry: TILE_BY_ID_REGISTRY,
  waygateRegistry: WAYGATE_REGISTRY,
  waystationRegistry: WAYSTATION_REGISTRY,
});

/**
 * Executes `getRegionDefinition` (get region definition) in `index.ts`.
 */
export function getRegionDefinition(regionId?: string): RegionDefinition {
  if (regionId && REGION_REGISTRY[regionId]) {
    return REGION_REGISTRY[regionId];
  }
  return regionBelldorOutskirts;
}

/**
 * Executes `getAreaDefinition` (get area definition) in `index.ts`.
 */
export function getAreaDefinition(areaId?: string): AreaWikiDefinition {
  if (areaId && AREA_REGISTRY[areaId]) {
    return AREA_REGISTRY[areaId];
  }
  return m00TheBogArea;
}

/**
 * Executes `getMapDefinition` (get map definition) in `index.ts`.
 */
export function getMapDefinition(mapId?: string): MapDefinition | undefined {
  if (mapId && MAP_REGISTRY[mapId]) {
    return MAP_REGISTRY[mapId];
  }
  return MAP_REGISTRY.map_bog_drop_zone;
}

/**
 * Executes `getBiomeDefinition` (get biome definition) in `index.ts`.
 */
export function getBiomeDefinition(biomeId?: string): BiomeDefinition {
  if (biomeId && BIOME_REGISTRY[biomeId]) {
    return BIOME_REGISTRY[biomeId];
  }
  return belldorBogBiome;
}

// [ORION-ANCHOR: ASCII-CHAR-REGISTRY]
/**
 * Executes `getTileDefinition` (get tile definition) in `index.ts`.
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

/**
 * Type contract for `RoomEnemyResolutionContext` (room enemy resolution context) in `index.ts`.
 * Supplies the spatial hierarchy (`Room -> Map -> Area -> Biome -> Global`) used to resolve a conserved
 * ASCII role character (`'E'`, `'W'`, `'p'`, `'K'`, `'o'`, `'s'`, `'N'`) to a concrete enemy archetype.
 */
export interface RoomEnemyResolutionContext {
  room?: string;
  mapId?: string;
  areaId?: string;
  biomeId?: string;
  roomEnemySpawnTypes?: EnemySpawnMap;
}

/**
 * Resolves a conserved ASCII room role character (`'E'`, `'W'`, `'p'`, `'K'`, `'o'`, `'s'`, `'N'`)
 * to a concrete Enemy type ID across the 5-tier spatial hierarchy:
 * `Room override -> Map -> Area -> Biome -> Global fallback`.
 */
export function resolveRoomEnemyTypeAtChar(
  char: string,
  contextOrBiomeId?: string | RoomEnemyResolutionContext,
  occurrenceIndex: number = 0
): string | undefined {
  const ctx: RoomEnemyResolutionContext =
    typeof contextOrBiomeId === 'string'
      ? { biomeId: contextOrBiomeId }
      : contextOrBiomeId || {};

  const localRoom = ctx.room ? LOCAL_ROOM_REGISTRY[ctx.room] : undefined;
  const globalRoom = ctx.room ? GLOBAL_ROOM_REGISTRY[ctx.room] : undefined;

  // 1. Room Override
  const roomOverride =
    ctx.roomEnemySpawnTypes?.[char] ??
    localRoom?.enemySpawnTypes?.[char] ??
    globalRoom?.enemySpawnTypes?.[char];
  const resolvedFromRoom = resolveEnemySpawnOverride(roomOverride, occurrenceIndex);
  if (resolvedFromRoom) {
    return resolvedFromRoom;
  }

  // 2. Map Override
  const effectiveMapId = ctx.mapId || localRoom?.mapId || globalRoom?.mapId;
  const mapDef = effectiveMapId ? MAP_REGISTRY[effectiveMapId] : undefined;
  const resolvedFromMap = resolveEnemySpawnOverride(
    mapDef?.enemySpawnTypes?.[char],
    occurrenceIndex
  );
  if (resolvedFromMap) {
    return resolvedFromMap;
  }

  // 3. Area Override
  const effectiveAreaId =
    ctx.areaId || mapDef?.areaId || localRoom?.areaId || globalRoom?.areaId;
  const areaDef = effectiveAreaId ? AREA_REGISTRY[effectiveAreaId] : undefined;
  const resolvedFromArea = resolveEnemySpawnOverride(
    areaDef?.enemySpawnTypes?.[char],
    occurrenceIndex
  );
  if (resolvedFromArea) {
    return resolvedFromArea;
  }

  // 4. Biome Default
  const effectiveBiomeId =
    ctx.biomeId ||
    localRoom?.biomeId ||
    globalRoom?.biomeId ||
    mapDef?.biomeId ||
    areaDef?.biomeId;
  if (effectiveBiomeId) {
    const biome = getBiomeDefinition(effectiveBiomeId);
    const resolvedFromBiome = resolveEnemySpawnOverride(
      biome.enemySpawnTypes?.[char],
      occurrenceIndex
    );
    if (resolvedFromBiome) {
      return resolvedFromBiome;
    }
  }

  // 5. Global Fallback
  return resolveEnemyTypeForChar(char, undefined, occurrenceIndex);
}

/**
 * Type contract for `AsciiRegistryEntry` (ascii registry entry) in `index.ts`.
 */
export interface AsciiRegistryEntry {
  char: string;
  category: 'tile' | 'enemy';
  id: string;
  name: string;
  solidOrFaction: string;
}

/**
 * Returns the complete Master ASCII Character Registry across all registered Tiles, Doodads,
 * and Enemy Spawn tokens, plus any detected global character collisions.
 */
export function getMasterAsciiCharacterRegistry(): {
  entries: AsciiRegistryEntry[];
  collisions: string[];
} {
  const entries: AsciiRegistryEntry[] = [];
  const crossDomainCollisions: string[] = [];

  for (const [char, tile] of Object.entries(TILE_REGISTRY)) {
    entries.push({
      char,
      category: 'tile',
      id: tile.id,
      name: tile.name,
      solidOrFaction: tile.solid ? 'solid' : 'walkable',
    });
  }

  for (const [char, enemyType] of Object.entries(CHAR_TO_ENEMY_TYPE)) {
    const enemy = ENEMY_REGISTRY[enemyType];
    if (TILE_REGISTRY[char]) {
      crossDomainCollisions.push(
        `[Orion ASCII Audit] Character '${char}' is registered as both Tile '${TILE_REGISTRY[char].id}' and Enemy '${enemyType}'.`
      );
    }
    entries.push({
      char,
      category: 'enemy',
      id: enemyType,
      name: enemy?.name || enemyType,
      solidOrFaction: enemy?.faction || 'hostile',
    });
  }

  return {
    entries,
    collisions: [
      ...TILE_CHAR_COLLISIONS,
      ...ENEMY_SPAWN_COLLISIONS,
      ...crossDomainCollisions,
      ...WORLD_AUDIT_ISSUES,
    ],
  };
}

export {
  aether01,
  belldorBogBiome,
  camelotBorderTownArea,
  dirt01,
  grass01,
  m00TheBogArea,
  mire01,
  regionBelldorOutskirts,
  ruins01,
  U00_UNIVERSE_CATALOG,
  UNIVERSE_WORLD_BY_ID,
};
/**
 * Re-exported 5-tier world hierarchy type contracts.
 */
export type {
  AreaWikiDefinition,
  BiomeDefinition,
  EnemySpawnMap,
  EnemySpawnOverride,
  MapDefinition,
  RegionDefinition,
  RoomDefinition,
};
