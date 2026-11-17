/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AreaWikiDefinition,
  BiomeDefinition,
  MapDefinition,
  RegionDefinition,
  RoomDefinition,
  TileDefinition,
  UniverseWorldDefinition,
  WaygateNode,
  WaystationNode,
} from '../../types';

/**
 * Input registries and raw glob modules inspected by `auditWorldRegistries`.
 */
export interface WorldAuditInput {
  modules: Record<string, Record<string, unknown>>;
  universeCatalog: UniverseWorldDefinition[];
  regionRegistry: Record<string, RegionDefinition>;
  localRegionRegistry: Record<string, RegionDefinition>;
  globalRegionRegistry: Record<string, RegionDefinition>;
  areaRegistry: Record<string, AreaWikiDefinition>;
  localAreaRegistry: Record<string, AreaWikiDefinition>;
  globalAreaRegistry: Record<string, AreaWikiDefinition>;
  mapRegistry: Record<string, MapDefinition>;
  localMapRegistry: Record<string, MapDefinition>;
  globalMapRegistry: Record<string, MapDefinition>;
  localRoomRegistry: Record<string, RoomDefinition>;
  globalRoomRegistry: Record<string, RoomDefinition>;
  biomeRegistry: Record<string, BiomeDefinition>;
  tileRegistry: Record<string, TileDefinition>;
  tileByIdRegistry: Record<string, TileDefinition>;
  waygateRegistry: Record<string, WaygateNode>;
  waystationRegistry: Record<string, WaystationNode>;
}

function isObjectRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function recordSeen(
  seen: Map<string, string>,
  key: string,
  path: string,
  label: string,
  issues: string[]
): void {
  const prev = seen.get(key);
  if (prev) {
    issues.push(`[Orion World Audit] Duplicate ${label} '${key}' in '${path}' and '${prev}'.`);
  } else {
    seen.set(key, path);
  }
}

function auditDuplicateDefinitions(
  modules: Record<string, Record<string, unknown>>,
  issues: string[]
): void {
  const seen = {
    region: new Map<string, string>(),
    area: new Map<string, string>(),
    map: new Map<string, string>(),
    localCoord: new Map<string, string>(),
    localRoomId: new Map<string, string>(),
    globalRoomId: new Map<string, string>(),
    biome: new Map<string, string>(),
    tile: new Map<string, string>(),
    waygate: new Map<string, string>(),
    waystation: new Map<string, string>(),
  };

  for (const [path, mod] of Object.entries(modules)) {
    if (path === './index.ts' || path === './worldAudit.ts') continue;
    for (const val of Object.values(mod)) {
      if (!isObjectRecord(val)) continue;
      if ('id' in val && 'scope' in val && 'localAreaIds' in val && 'globalAreaIds' in val) {
        recordSeen(seen.region, String(val.id), path, 'Region id', issues);
        if (isObjectRecord(val.waygate) && typeof val.waygate.id === 'string') {
          recordSeen(seen.waygate, val.waygate.id, path, 'Waygate id', issues);
        }
      } else if ('id' in val && 'scope' in val && 'localMapIds' in val && 'globalMapIds' in val) {
        recordSeen(seen.area, String(val.id), path, 'Area id', issues);
        if (isObjectRecord(val.waystation) && typeof val.waystation.id === 'string') {
          recordSeen(seen.waystation, val.waystation.id, path, 'Waystation id', issues);
        }
      } else if ('id' in val && 'scope' in val && 'localRoomCoords' in val && 'globalRoomSlots' in val) {
        recordSeen(seen.map, String(val.id), path, 'Map id', issues);
      } else if ('coord' in val && 'grid' in val && 'areaId' in val) {
        const coord = String(val.coord);
        const id = typeof val.id === 'string' ? val.id : undefined;
        if (val.scope === 'global') {
          recordSeen(seen.globalRoomId, id || coord, path, 'Global Room id', issues);
        } else {
          recordSeen(seen.localCoord, coord, path, 'Local Room coord', issues);
          if (id) recordSeen(seen.localRoomId, id, path, 'Local Room id', issues);
        }
      } else if ('id' in val && 'scope' in val && 'tileRules' in val && 'tileAssets' in val) {
        recordSeen(seen.biome, String(val.id), path, 'Biome id', issues);
      } else if ('id' in val && 'char' in val && 'type' in val && 'solid' in val) {
        recordSeen(seen.tile, String(val.id), path, 'Tile id', issues);
      }
    }
  }
}

function auditUniverseAndRegions(
  input: WorldAuditInput,
  validRoomCoords: Set<string>,
  issues: string[]
): void {
  const seenWorlds = new Set<string>();
  for (const world of input.universeCatalog) {
    if (seenWorlds.has(world.id)) {
      issues.push(`[Orion World Audit] Duplicate UniverseWorld id '${world.id}'.`);
    }
    seenWorlds.add(world.id);
    for (const regionId of world.regionIds) {
      if (!input.regionRegistry[regionId]) {
        issues.push(`[Orion World Audit] World '${world.id}' references unknown Region '${regionId}'.`);
      }
    }
  }

  for (const region of Object.values(input.regionRegistry)) {
    if (!input.biomeRegistry[region.defaultBiomeId]) {
      issues.push(`[Orion World Audit] Region '${region.id}' references unknown defaultBiomeId '${region.defaultBiomeId}'.`);
    }
    for (const areaId of region.localAreaIds) {
      if (!input.localAreaRegistry[areaId]) {
        issues.push(`[Orion World Audit] Region '${region.id}' references unknown localAreaId '${areaId}'.`);
      }
    }
    for (const areaId of region.globalAreaIds) {
      if (!input.globalAreaRegistry[areaId]) {
        issues.push(`[Orion World Audit] Region '${region.id}' references unknown globalAreaId '${areaId}'.`);
      }
    }
    for (const connId of region.connectedRegionIds) {
      if (!input.regionRegistry[connId]) {
        issues.push(`[Orion World Audit] Region '${region.id}' references unknown connectedRegionId '${connId}'.`);
      }
    }
    const wg = region.waygate;
    if (wg) {
      if (wg.regionId !== region.id || !input.regionRegistry[wg.regionId]) {
        issues.push(`[Orion World Audit] Waygate '${wg.id}' has mismatched or unknown regionId '${wg.regionId}'.`);
      }
      if (!input.areaRegistry[wg.areaId]) {
        issues.push(`[Orion World Audit] Waygate '${wg.id}' references unknown areaId '${wg.areaId}'.`);
      }
      if (!input.mapRegistry[wg.mapId]) {
        issues.push(`[Orion World Audit] Waygate '${wg.id}' references unknown mapId '${wg.mapId}'.`);
      }
      if (!validRoomCoords.has(wg.room)) {
        issues.push(`[Orion World Audit] Waygate '${wg.id}' references unknown room coord '${wg.room}'.`);
      }
    }
  }
}

function auditAreas(
  input: WorldAuditInput,
  validRoomCoords: Set<string>,
  issues: string[]
): void {
  for (const area of Object.values(input.areaRegistry)) {
    if (!input.regionRegistry[area.regionId]) {
      issues.push(`[Orion World Audit] Area '${area.id}' references unknown regionId '${area.regionId}'.`);
    }
    if (!input.biomeRegistry[area.biomeId]) {
      issues.push(`[Orion World Audit] Area '${area.id}' references unknown biomeId '${area.biomeId}'.`);
    }
    for (const mapId of area.localMapIds) {
      if (!input.localMapRegistry[mapId]) {
        issues.push(`[Orion World Audit] Area '${area.id}' references unknown localMapId '${mapId}'.`);
      }
    }
    for (const mapId of area.globalMapIds) {
      if (!input.globalMapRegistry[mapId]) {
        issues.push(`[Orion World Audit] Area '${area.id}' references unknown globalMapId '${mapId}'.`);
      }
    }
    for (const connId of area.connectedAreaIds) {
      if (!input.areaRegistry[connId]) {
        issues.push(`[Orion World Audit] Area '${area.id}' references unknown connectedAreaId '${connId}'.`);
      }
    }
    if (!validRoomCoords.has(area.spawnAnchor.room)) {
      issues.push(`[Orion World Audit] Area '${area.id}' spawnAnchor references unknown room '${area.spawnAnchor.room}'.`);
    }
    if (!validRoomCoords.has(area.exitAnchor.room)) {
      issues.push(`[Orion World Audit] Area '${area.id}' exitAnchor references unknown room '${area.exitAnchor.room}'.`);
    }
    const ws = area.waystation;
    if (ws) {
      if (!input.regionRegistry[ws.regionId]) {
        issues.push(`[Orion World Audit] Waystation '${ws.id}' references unknown regionId '${ws.regionId}'.`);
      }
      if (ws.areaId !== area.id || !input.areaRegistry[ws.areaId]) {
        issues.push(`[Orion World Audit] Waystation '${ws.id}' has mismatched or unknown areaId '${ws.areaId}'.`);
      }
      if (!input.mapRegistry[ws.mapId]) {
        issues.push(`[Orion World Audit] Waystation '${ws.id}' references unknown mapId '${ws.mapId}'.`);
      }
      if (!validRoomCoords.has(ws.room)) {
        issues.push(`[Orion World Audit] Waystation '${ws.id}' references unknown room coord '${ws.room}'.`);
      }
    }
  }
}

function auditMaps(input: WorldAuditInput, issues: string[]): void {
  const seenSlottedCoords = new Map<string, string>();
  for (const mapDef of Object.values(input.mapRegistry)) {
    if (!input.areaRegistry[mapDef.areaId]) {
      issues.push(`[Orion World Audit] Map '${mapDef.id}' references unknown areaId '${mapDef.areaId}'.`);
    }
    if (!input.biomeRegistry[mapDef.biomeId]) {
      issues.push(`[Orion World Audit] Map '${mapDef.id}' references unknown biomeId '${mapDef.biomeId}'.`);
    }
    for (const coord of mapDef.localRoomCoords) {
      if (!input.localRoomRegistry[coord]) {
        issues.push(`[Orion World Audit] Map '${mapDef.id}' references unknown localRoomCoord '${coord}'.`);
      }
    }
    for (const slot of mapDef.globalRoomSlots) {
      if (input.localRoomRegistry[slot.coord]) {
        issues.push(`[Orion World Audit] Map '${mapDef.id}' globalRoomSlot '${slot.coord}' collides with a Local Room coord.`);
      }
      recordSeen(seenSlottedCoords, slot.coord, mapDef.id, 'globalRoomSlot coord', issues);
      if (slot.globalRoomId && !input.globalRoomRegistry[slot.globalRoomId]) {
        issues.push(`[Orion World Audit] Map '${mapDef.id}' slot '${slot.coord}' references unknown globalRoomId '${slot.globalRoomId}'.`);
      }
      if (slot.biomeId && !input.biomeRegistry[slot.biomeId]) {
        issues.push(`[Orion World Audit] Map '${mapDef.id}' slot '${slot.coord}' references unknown biomeId '${slot.biomeId}'.`);
      }
    }
    for (const connId of mapDef.connectedMapIds) {
      if (!input.mapRegistry[connId]) {
        issues.push(`[Orion World Audit] Map '${mapDef.id}' references unknown connectedMapId '${connId}'.`);
      }
    }
  }
}

function auditRoomsAndBiomes(input: WorldAuditInput, issues: string[]): void {
  for (const biome of Object.values(input.biomeRegistry)) {
    for (const [char, tileId] of Object.entries(biome.tileTypes)) {
      if (!input.tileByIdRegistry[tileId]) {
        issues.push(`[Orion World Audit] Biome '${biome.id}' maps char '${char}' to unknown Tile id '${tileId}'.`);
      }
    }
  }

  const allRooms = [
    ...Object.values(input.localRoomRegistry),
    ...Object.values(input.globalRoomRegistry),
  ];
  for (const room of allRooms) {
    const label = room.id || room.coord;
    if (!input.areaRegistry[room.areaId]) {
      issues.push(`[Orion World Audit] Room '${label}' references unknown areaId '${room.areaId}'.`);
    }
    if (room.scope === 'global') {
      if (room.mapId && !input.mapRegistry[room.mapId]) {
        issues.push(`[Orion World Audit] Global Room '${label}' references unknown mapId '${room.mapId}'.`);
      }
    } else if (!room.mapId || !input.mapRegistry[room.mapId]) {
      issues.push(`[Orion World Audit] Local Room '${label}' (${room.coord}) has missing or unknown mapId '${room.mapId ?? ''}'.`);
    }
    if (room.regionId && !input.regionRegistry[room.regionId]) {
      issues.push(`[Orion World Audit] Room '${label}' references unknown regionId '${room.regionId}'.`);
    }
    const resolvedBiomeId =
      room.biomeId ||
      (room.mapId ? input.mapRegistry[room.mapId]?.biomeId : undefined) ||
      input.areaRegistry[room.areaId]?.biomeId;
    if (!resolvedBiomeId || !input.biomeRegistry[resolvedBiomeId]) {
      issues.push(`[Orion World Audit] Room '${label}' has missing or unknown biomeId '${room.biomeId ?? ''}'.`);
    }
  }
}

/**
 * Audits all populated Orion world registries for duplicate IDs/coordinates and broken
 * cross-references across `Universe -> Region -> Area -> Map -> Room -> Biome -> Tile`.
 *
 * Wiring: `src/cartridges/orion/database/world/index.ts` (`WORLD_AUDIT_ISSUES = auditWorldRegistries(...)`
 * and `...WORLD_AUDIT_ISSUES` in `getMasterAsciiCharacterRegistry()`).
 * Removal: Delete `src/cartridges/orion/database/world/worldAudit.ts` and remove the `auditWorldRegistries`
 * import, `WORLD_AUDIT_ISSUES` export, and `...WORLD_AUDIT_ISSUES` spread in `src/cartridges/orion/database/world/index.ts`.
 */
export function auditWorldRegistries(input: WorldAuditInput): string[] {
  const issues: string[] = [];
  const validRoomCoords = new Set<string>(Object.keys(input.localRoomRegistry));
  for (const mapDef of Object.values(input.mapRegistry)) {
    for (const slot of mapDef.globalRoomSlots) {
      validRoomCoords.add(slot.coord);
    }
  }

  auditDuplicateDefinitions(input.modules, issues);
  auditUniverseAndRegions(input, validRoomCoords, issues);
  auditAreas(input, validRoomCoords, issues);
  auditMaps(input, issues);
  auditRoomsAndBiomes(input, issues);

  return issues;
}
