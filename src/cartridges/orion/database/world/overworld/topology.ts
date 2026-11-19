/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AetherCardinalDir,
  KeyNodeRouteDescriptor,
  RoomChunkPlacementSpec,
  RoomDefinition,
  SetPathCorridorSpec,
} from '../../../types';
import { room4Neg1BorderTownBarracks } from './belldor/camelot_heartland/border_town/map_barracks';
import { room50BorderTownCathedral } from './belldor/camelot_heartland/border_town/map_cathedral';
import { room40BorderTownMarket } from './belldor/camelot_heartland/border_town/map_market';
import { room60WaygateSanctum } from './belldor/camelot_heartland/camelot_interior/map_waygate_depths';
import { room31OrcEncampmentSiege } from './belldor/outskirts/orc_encampment/map_siege_camp';
import {
  mapBogChunkedExpanse,
  roomSunkenBogExpanse,
} from './belldor/outskirts/the_bog/map_chunked_expanse';
import {
  mapDeepBogMaze,
  room20DeepBogMaze,
  room21LadyOfTheLakeArena,
  room3Neg1BogLoopHollow,
  room30BogExitPerimeter,
} from './belldor/outskirts/the_bog/map_deep_maze';
import {
  mapBogDropZone,
  room0Neg1RuinBranch,
  room0Neg2PoeLanternSanctuary,
  room00DropPodCrater,
  room10SunkenPylonTrail,
  roomCheatPodBay,
  roomDownedTreesEast,
  roomDownedTreesWest,
  roomDropPodCrater,
} from './belldor/outskirts/the_bog/map_drop_zone';
import { room70TyrranusWaygateLanding } from './tyrranus/frontier/marble_gatehead/map_gatehead';

/**
 * Re-exported `KeyNodeRouteDescriptor`, `RoomChunkPlacementSpec`, and `SetPathCorridorSpec` types for overworld topology consumers.
 * Wiring: Re-exported by `src/cartridges/orion/constants.ts`.
 * Removal: None (shared overworld topology contract).
 */
export type { KeyNodeRouteDescriptor, RoomChunkPlacementSpec, SetPathCorridorSpec };

/**
 * Canonical room identifier (`'-3,-1'`) for the unified `26x18`-chunk Sunken Bog Expanse.
 * Wiring: Imported by `src/cartridges/orion/constants.ts` and re-exported across the engine.
 * Removal: Replaced inline constant in `src/cartridges/orion/constants.ts`.
 */
export const SUNKEN_BOG_EXPANSE_ROOM_ID: string = roomSunkenBogExpanse.coord;

/**
 * Mapping entry anchoring a canonical M00 Bog room (`"rx,ry"`) onto the Unified Sunken Bog Expanse chunk grid (`cx`, `cy`).
 * Wiring: Re-exported by `src/cartridges/orion/constants.ts` and consumed by Bog chunk streaming and minimap overlays.
 * Removal: Moved from `src/cartridges/orion/constants.ts`.
 */
export interface UnifiedBogRoomPlacement {
  roomCoord: string;
  rx: number;
  ry: number;
  startCx: number;
  startCy: number;
  chunksW: number;
  chunksH: number;
  title: string;
}

const AUTHORED_OVERWORLD_ROOMS: RoomDefinition[] = [
  roomCheatPodBay,
  roomDropPodCrater,
  roomDownedTreesWest,
  roomDownedTreesEast,
  room00DropPodCrater,
  room0Neg1RuinBranch,
  room0Neg2PoeLanternSanctuary,
  room10SunkenPylonTrail,
  room20DeepBogMaze,
  room21LadyOfTheLakeArena,
  room3Neg1BogLoopHollow,
  room30BogExitPerimeter,
  room31OrcEncampmentSiege,
  room40BorderTownMarket,
  room4Neg1BorderTownBarracks,
  room50BorderTownCathedral,
  room60WaygateSanctum,
  room70TyrranusWaygateLanding,
];

function buildKeyNodeRoutes(): Record<
  string,
  Partial<Record<AetherCardinalDir, KeyNodeRouteDescriptor>>
> {
  const routesByCoord: Record<
    string,
    Partial<Record<AetherCardinalDir, KeyNodeRouteDescriptor>>
  > = {};
  for (const room of AUTHORED_OVERWORLD_ROOMS) {
    if (room.routes) {
      routesByCoord[room.coord] = room.routes;
    }
  }
  return routesByCoord;
}

/**
 * Ordered progression spine mapping Set Path room coordinates (`"-3,0"` through `"6,0"`) to their `KeyNodeRouteDescriptor`, aggregated from authored overworld rooms.
 * Wiring: Imported and re-exported by `src/cartridges/orion/constants.ts` for `aetherWorldGen.ts` and `RoomGraphEditor.tsx`.
 * Removal: Replaced inline `KEY_NODE_ROUTES` table in `src/cartridges/orion/constants.ts`.
 */
export const KEY_NODE_ROUTES: Record<
  string,
  Partial<Record<AetherCardinalDir, KeyNodeRouteDescriptor>>
> = buildKeyNodeRoutes();

const BOG_PLACEMENT_COORD_ORDER: readonly string[] = [
  '-3,0',
  '-2,0',
  '-1,0',
  '0,0',
  '0,-1',
  '0,-2',
  '0,1',
  '1,0',
  '1,-1',
  '2,0',
  '2,1',
  '3,-1',
  '3,0',
];

function parseRoomCoordPair(coord: string): { rx: number; ry: number } {
  const [rxStr, ryStr] = coord.split(',');
  return {
    rx: Number(rxStr) || 0,
    ry: Number(ryStr) || 0,
  };
}

function buildUnifiedBogRoomPlacements(): UnifiedBogRoomPlacement[] {
  const byCoord: Record<string, UnifiedBogRoomPlacement> = {};

  for (const room of AUTHORED_OVERWORLD_ROOMS) {
    if (!room.chunkPlacement) continue;
    const { rx, ry } = parseRoomCoordPair(room.coord);
    byCoord[room.coord] = {
      roomCoord: room.coord,
      rx,
      ry,
      startCx: room.chunkPlacement.startCx,
      startCy: room.chunkPlacement.startCy,
      chunksW: room.chunkPlacement.chunksW,
      chunksH: room.chunkPlacement.chunksH,
      title: room.chunkPlacement.title ?? room.title,
    };
  }

  for (const mapDef of [mapBogDropZone, mapDeepBogMaze]) {
    for (const slot of mapDef.globalRoomSlots) {
      if (!slot.chunkPlacement || byCoord[slot.coord]) continue;
      const { rx, ry } = parseRoomCoordPair(slot.coord);
      byCoord[slot.coord] = {
        roomCoord: slot.coord,
        rx,
        ry,
        startCx: slot.chunkPlacement.startCx,
        startCy: slot.chunkPlacement.startCy,
        chunksW: slot.chunkPlacement.chunksW,
        chunksH: slot.chunkPlacement.chunksH,
        title: slot.chunkPlacement.title ?? slot.title ?? slot.coord,
      };
    }
  }

  return BOG_PLACEMENT_COORD_ORDER.map((coord) => byCoord[coord]).filter(
    (entry): entry is UnifiedBogRoomPlacement => Boolean(entry)
  );
}

/**
 * Every authored RoomDefinition and procedural slot in M00 The Bog placed onto the `26x18` chunk grid, aggregated from `overworld/belldor/outskirts/the_bog/`.
 * Wiring: Imported and re-exported by `src/cartridges/orion/constants.ts`.
 * Removal: Replaced inline `UNIFIED_BOG_ROOM_PLACEMENTS` array in `src/cartridges/orion/constants.ts`.
 */
export const UNIFIED_BOG_ROOM_PLACEMENTS: UnifiedBogRoomPlacement[] =
  buildUnifiedBogRoomPlacements();

/**
 * Lookup table mapping legacy M00 room coordinates (`"-3,0"`..`"3,0"`) to their `UnifiedBogRoomPlacement`.
 * Wiring: Imported and re-exported by `src/cartridges/orion/constants.ts`.
 * Removal: Replaced inline `UNIFIED_BOG_ROOM_BY_COORD` map in `src/cartridges/orion/constants.ts`.
 */
export const UNIFIED_BOG_ROOM_BY_COORD: Record<string, UnifiedBogRoomPlacement> =
  Object.fromEntries(UNIFIED_BOG_ROOM_PLACEMENTS.map((p) => [p.roomCoord, p]));

/**
 * Authored list of Set Path corridor chunks connecting the Drop-Pod Sanctuary to the Eastern Causeway, sourced from `mapBogChunkedExpanse.corridorChunks`.
 * Wiring: Imported and re-exported by `src/cartridges/orion/constants.ts`.
 * Removal: Replaced inline `SET_PATH_CORRIDOR_CHUNKS` array in `src/cartridges/orion/constants.ts`.
 */
export const SET_PATH_CORRIDOR_CHUNKS: SetPathCorridorSpec[] =
  mapBogChunkedExpanse.corridorChunks ?? [];

/**
 * Lookup map from chunk key `"cx,cy"` to its `SetPathCorridorSpec` along the Set Path.
 * Wiring: Imported and re-exported by `src/cartridges/orion/constants.ts`.
 * Removal: Replaced inline `SET_PATH_CORRIDOR_BY_CHUNK` record in `src/cartridges/orion/constants.ts`.
 */
export const SET_PATH_CORRIDOR_BY_CHUNK: Record<string, SetPathCorridorSpec> =
  Object.fromEntries(SET_PATH_CORRIDOR_CHUNKS.map((c) => [`${c.cx},${c.cy}`, c]));

function buildSetPathSpineCoords(): Array<{ cx: number; cy: number; title: string }> {
  const list: Array<{ cx: number; cy: number; title: string }> = [];
  for (const room of UNIFIED_BOG_ROOM_PLACEMENTS) {
    for (let dy = 0; dy < room.chunksH; dy++) {
      for (let dx = 0; dx < room.chunksW; dx++) {
        list.push({
          cx: room.startCx + dx,
          cy: room.startCy + dy,
          title: room.title,
        });
      }
    }
  }
  for (const corr of SET_PATH_CORRIDOR_CHUNKS) {
    list.push({ cx: corr.cx, cy: corr.cy, title: corr.title });
  }
  return list;
}

/**
 * Ordered list of `"cx,cy"` chunk coordinates forming the safe Set Path spine across the Sunken Bog.
 * Wiring: Imported and re-exported by `src/cartridges/orion/constants.ts`.
 * Removal: Replaced inline `SET_PATH_SPINE_COORDS` in `src/cartridges/orion/constants.ts`.
 */
export const SET_PATH_SPINE_COORDS: Array<{ cx: number; cy: number; title: string }> =
  buildSetPathSpineCoords();

/**
 * Fast membership `Set` of `"cx,cy"` chunk keys belonging to the safe Set Path spine (immutable static set populated once at module initialization; no runtime growth).
 * Wiring: Imported and re-exported by `src/cartridges/orion/constants.ts`.
 * Removal: Replaced inline `SET_PATH_SPINE_SET` in `src/cartridges/orion/constants.ts`.
 */
export const SET_PATH_SPINE_SET = new Set<string>(
  SET_PATH_SPINE_COORDS.map((c) => `${c.cx},${c.cy}`)
);

/**
 * Returns the `UnifiedBogRoomPlacement` for `roomCoord` if it is embedded in the Unified Sunken Bog Expanse.
 * Wiring: Imported and re-exported by `src/cartridges/orion/constants.ts`.
 * Removal: Moved from `src/cartridges/orion/constants.ts`.
 */
export function getUnifiedBogRoomPlacement(
  roomCoord: string | undefined
): UnifiedBogRoomPlacement | undefined {
  if (!roomCoord) return undefined;
  return UNIFIED_BOG_ROOM_BY_COORD[roomCoord];
}

/**
 * Returns the `UnifiedBogRoomPlacement` occupying chunk `(cx, cy)` on the Unified Sunken Bog Expanse, or `undefined`.
 * Wiring: Imported and re-exported by `src/cartridges/orion/constants.ts`.
 * Removal: Moved from `src/cartridges/orion/constants.ts`.
 */
export function getUnifiedBogRoomAtChunk(
  cx: number,
  cy: number
): UnifiedBogRoomPlacement | undefined {
  for (const p of UNIFIED_BOG_ROOM_PLACEMENTS) {
    if (
      cx >= p.startCx &&
      cx < p.startCx + p.chunksW &&
      cy >= p.startCy &&
      cy < p.startCy + p.chunksH
    ) {
      return p;
    }
  }
  return undefined;
}
