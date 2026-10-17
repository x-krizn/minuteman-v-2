/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COLS, ROWS } from '../../../constants';
import { RoomDefinition } from '../../../types';
import { AREA_REGISTRY, getAreaDefinition } from '../../areas';
import { getBiomeDefinition } from '../../biomes';
import { MAP_REGISTRY } from '../../maps';
import { getRegionDefinition, REGION_REGISTRY } from '../../regions';
import { GLOBAL_ROOM_REGISTRY, LOCAL_ROOM_REGISTRY } from '../../rooms';

export interface OrionRoomMetadata {
  title: string;
  bannerTitle: string;
  regionId: string;
  areaId: string;
  mapId: string;
  biomeId: string;
  scope: 'global' | 'local';
}

export interface OrionCacheDefinition {
  scrap: number;
  items: Array<{ itemId: string; count: number }>;
  toast: string;
}

export const ROOM_REGISTRY: Record<string, RoomDefinition> = {};
export const ORION_TUTORIAL_ROOMS: Record<string, string[]> = {};
export const ORION_ROOM_METADATA: Record<string, OrionRoomMetadata> = {};
export const ORION_CACHE_DEFINITIONS: Record<string, OrionCacheDefinition> = {
  default: {
    scrap: 20,
    items: [{ itemId: 'grail_water', count: 1 }],
    toast: 'LOOTED: +20 SCRAP & GRAIL WATER',
  },
};

/**
 * Align the 4-edge doorway openings of a global procedural room template so that
 * doorways open ONLY into valid adjacent coordinates in the assembled world graph.
 */
function alignGlobalRoomDoors(
  rawGrid: string[],
  coord: string,
  allCoords: Set<string>
): string[] {
  const [rxStr, ryStr] = coord.split(',');
  const rx = Number(rxStr) || 0;
  const ry = Number(ryStr) || 0;

  const hasNorth = allCoords.has(`${rx},${ry - 1}`);
  const hasSouth = allCoords.has(`${rx},${ry + 1}`);
  const hasWest = allCoords.has(`${rx - 1},${ry}`);
  const hasEast = allCoords.has(`${rx + 1},${ry}`);

  const matrix = rawGrid.map((row) => row.split(''));

  // North edge (row 0, cols 4-5)
  if (matrix[0]) {
    matrix[0][4] = hasNorth ? '.' : '#';
    matrix[0][5] = hasNorth ? '.' : '#';
  }
  // South edge (row ROWS-1, cols 4-5)
  if (matrix[ROWS - 1]) {
    matrix[ROWS - 1][4] = hasSouth ? '.' : '#';
    matrix[ROWS - 1][5] = hasSouth ? '.' : '#';
  }
  // West edge (rows 5-6, col 0)
  if (matrix[5] && matrix[6]) {
    matrix[5][0] = hasWest ? '.' : '#';
    matrix[6][0] = hasWest ? '.' : '#';
  }
  // East edge (rows 5-6, col COLS-1)
  if (matrix[5] && matrix[6]) {
    matrix[5][COLS - 1] = hasEast ? '.' : '#';
    matrix[6][COLS - 1] = hasEast ? '.' : '#';
  }

  return matrix.map((r) => r.join(''));
}

/**
 * Assemble the complete 5-tier nested world (Regions -> Areas -> Maps -> Rooms -> Biomes),
 * anchoring bespoke Local Rooms first and stitching Global Rooms into procedural Map slots.
 */
function assembleNestedWorld(): void {
  const allCoords = new Set<string>();

  // Collect all valid coordinates from Local Rooms and Map Global Room Slots
  for (const coord of Object.keys(LOCAL_ROOM_REGISTRY)) {
    allCoords.add(coord);
  }
  for (const mapDef of Object.values(MAP_REGISTRY)) {
    for (const slot of mapDef.globalRoomSlots) {
      allCoords.add(slot.coord);
    }
  }

  // 1. Register all bespoke Local Rooms (highest precedence)
  for (const [coord, localRoom] of Object.entries(LOCAL_ROOM_REGISTRY)) {
    const areaDef = getAreaDefinition(localRoom.areaId);
    const regionDef = getRegionDefinition(localRoom.regionId || areaDef.regionId);
    const mapId = localRoom.mapId || areaDef.localMapIds[0] || 'map_bog_drop_zone';
    const mapDef = MAP_REGISTRY[mapId];
    const biomeId =
      localRoom.biomeId ||
      mapDef?.biomeId ||
      areaDef.biomeId ||
      regionDef.defaultBiomeId ||
      'belldor_bog';

    const resolvedRoom: RoomDefinition = {
      ...localRoom,
      scope: 'local',
      regionId: regionDef.id,
      areaId: areaDef.id,
      mapId,
      biomeId: getBiomeDefinition(biomeId).id,
    };

    ROOM_REGISTRY[coord] = resolvedRoom;
    ORION_TUTORIAL_ROOMS[coord] = resolvedRoom.grid;
    ORION_ROOM_METADATA[coord] = {
      title: resolvedRoom.title,
      bannerTitle: resolvedRoom.bannerTitle,
      regionId: regionDef.id,
      areaId: areaDef.id,
      mapId,
      biomeId: resolvedRoom.biomeId!,
      scope: 'local',
    };

    if (resolvedRoom.cache) {
      ORION_CACHE_DEFINITIONS[coord] = resolvedRoom.cache;
    }
  }

  // 2. Stitch Global Rooms into Map procedural slots (wherever a Local Room isn't already anchored)
  const globalRoomTemplates = Object.values(GLOBAL_ROOM_REGISTRY);

  for (const regionDef of Object.values(REGION_REGISTRY)) {
    const areaIds = [...regionDef.localAreaIds, ...regionDef.globalAreaIds];
    for (const areaId of areaIds) {
      const areaDef = AREA_REGISTRY[areaId];
      if (!areaDef) continue;
      const mapIds = [...areaDef.localMapIds, ...areaDef.globalMapIds];
      for (const mapId of mapIds) {
        const mapDef = MAP_REGISTRY[mapId];
        if (!mapDef) continue;

        for (const slot of mapDef.globalRoomSlots) {
          if (ROOM_REGISTRY[slot.coord]) continue; // Local room or earlier map already anchored here

          const template =
            (slot.globalRoomId && GLOBAL_ROOM_REGISTRY[slot.globalRoomId]) ||
            globalRoomTemplates[0];
          if (!template) continue;

          const resolvedBiomeId =
            slot.biomeId ||
            mapDef.biomeId ||
            areaDef.biomeId ||
            regionDef.defaultBiomeId ||
            template.biomeId ||
            'global_toxic_wetlands';

          const stitchedGrid = alignGlobalRoomDoors(template.grid, slot.coord, allCoords);
          const title = slot.title || `${mapDef.name} — ${template.title}`;
          const bannerTitle =
            slot.bannerTitle || `${areaDef.name.toUpperCase()} · ${title.toUpperCase()}`;

          const stitchedRoom: RoomDefinition = {
            ...template,
            id: `${mapDef.id}:${slot.coord}`,
            scope: 'global',
            coord: slot.coord,
            regionId: regionDef.id,
            areaId: areaDef.id,
            mapId: mapDef.id,
            biomeId: getBiomeDefinition(resolvedBiomeId).id,
            title,
            bannerTitle,
            grid: stitchedGrid,
          };

          ROOM_REGISTRY[slot.coord] = stitchedRoom;
          ORION_TUTORIAL_ROOMS[slot.coord] = stitchedGrid;
          ORION_ROOM_METADATA[slot.coord] = {
            title,
            bannerTitle,
            regionId: regionDef.id,
            areaId: areaDef.id,
            mapId: mapDef.id,
            biomeId: stitchedRoom.biomeId!,
            scope: 'global',
          };
        }
      }
    }
  }
}

assembleNestedWorld();

export const ORION_INITIAL_ROOMS = ORION_TUTORIAL_ROOMS;
