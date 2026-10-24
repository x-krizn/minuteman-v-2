/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import {
  DIR_VECTORS,
  getRoomDimensions,
  getRoomDoorwayCenterPx,
  TILE_SIZE,
} from '../constants';
import {
  AREA_REGISTRY,
  getAreaDefinition,
  getBiomeDefinition,
  getMapDefinition,
  getRegionDefinition,
  getTileDefinition,
  GLOBAL_ROOM_REGISTRY,
  LOCAL_ROOM_REGISTRY,
  MAP_REGISTRY,
  REGION_REGISTRY,
  WAYGATE_REGISTRY,
  WAYSTATION_REGISTRY,
} from '../database/world';
import {
  getCanonicalRoomPersistenceKey,
  isRoomCacheLooted,
  markRoomCacheLooted,
} from '../database/world/tiles/doodads_atlas';
import {
  AetherCardinalDir,
  AetherEndFeature,
  AetherFogGraphState,
  AetherGraphNode,
  AetherNodeType,
  OrionCombatContext,
  OrionState,
  RoomDefinition,
} from '../types';
import { spawnEnemyByType, spawnRoomEnemies } from './entitySystem';
import {
  ACTION_MODIFICATION_CATALOG,
  GEMSTONE_CATALOG,
  isEquipmentUnlocked,
  refundInventoryGem,
  unlockEquipmentItem,
  unlockLevel2SecondaryWeapon,
} from '../database/progression';
import { getWeaponDefinition, WEAPON_REGISTRY } from '../database/weapons';
import {
  addOrionInventoryItem,
  getTutorialPromptOverride,
  notifyOrionStateChange,
  saveOrionGame,
  setOrionFlag,
  syncStateGates,
} from './playerSystem';

// ─── 1. 5-TIER NESTED WORLD COMPOSER & AETHER FOG 5-NODE TOPOLOGY ────────────

export interface OrionRoomMetadata {
  title: string;
  bannerTitle: string;
  regionId: string;
  areaId: string;
  mapId: string;
  biomeId: string;
  scope: 'global' | 'local';
  nodeType: AetherNodeType;
  trueExitDir?: AetherCardinalDir;
  routeStep?: number;
  routeTotal?: number;
  endFeature?: AetherEndFeature;
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

const ALL_CARDINAL_DIRS: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];

export function getOppositeCardinalDir(dir: AetherCardinalDir): AetherCardinalDir {
  switch (dir) {
    case 'N':
      return 'S';
    case 'S':
      return 'N';
    case 'E':
      return 'W';
    case 'W':
      return 'E';
  }
}

/**
 * Canonical routes between authored KEY nodes (Points of Interest).
 * Moving along a route dynamically generates `routeTotal` GENERAL nodes before arriving at `targetKeyCoord`.
 */
interface KeyNodeRouteDescriptor {
  targetKeyCoord: string;
  routeTotal: number;
  isDirectEndNode?: boolean;
}

const KEY_NODE_ROUTES: Record<string, Partial<Record<AetherCardinalDir, KeyNodeRouteDescriptor>>> = {
  '-3,0': {
    E: { targetKeyCoord: '-2,0', routeTotal: 0 },
  },
  '-2,0': {
    W: { targetKeyCoord: '-3,0', routeTotal: 0 },
    E: { targetKeyCoord: '-1,0', routeTotal: 0 },
  },
  '-1,0': {
    W: { targetKeyCoord: '-2,0', routeTotal: 0 },
    E: { targetKeyCoord: '0,0', routeTotal: 0 },
  },
  '0,0': {
    W: { targetKeyCoord: '-1,0', routeTotal: 0 },
    N: { targetKeyCoord: '0,-1', routeTotal: 0 },
    E: { targetKeyCoord: '1,0', routeTotal: 0 },
  },
  '0,-1': {
    S: { targetKeyCoord: '0,0', routeTotal: 0 },
    N: { targetKeyCoord: '0,-2', routeTotal: 0 },
    E: { targetKeyCoord: '3,-1', routeTotal: 0 },
  },
  '0,-2': {
    S: { targetKeyCoord: '0,-1', routeTotal: 0 },
    E: { targetKeyCoord: '3,-1', routeTotal: 0 },
  },
  '1,0': {
    W: { targetKeyCoord: '0,0', routeTotal: 0 },
    N: { targetKeyCoord: '1,-1', routeTotal: 0, isDirectEndNode: true },
    E: { targetKeyCoord: '2,0', routeTotal: 0 },
  },
  '2,0': {
    W: { targetKeyCoord: '1,0', routeTotal: 0 },
    E: { targetKeyCoord: '3,0', routeTotal: 0 },
    S: { targetKeyCoord: '2,1', routeTotal: 0 },
  },
  '2,1': {
    N: { targetKeyCoord: '2,0', routeTotal: 0 },
  },
  '3,-1': {
    W: { targetKeyCoord: '0,-2', routeTotal: 0 },
    S: { targetKeyCoord: '3,0', routeTotal: 0 },
    N: { targetKeyCoord: '0,-1', routeTotal: 0 },
  },
  '3,0': {
    W: { targetKeyCoord: '2,0', routeTotal: 0 },
    N: { targetKeyCoord: '3,-1', routeTotal: 0 },
    E: { targetKeyCoord: '4,0', routeTotal: 2 },
  },
  '4,0': {
    W: { targetKeyCoord: '3,0', routeTotal: 2 },
    N: { targetKeyCoord: '4,-1', routeTotal: 1 },
    E: { targetKeyCoord: '5,0', routeTotal: 2 },
  },
  '4,-1': {
    S: { targetKeyCoord: '4,0', routeTotal: 1 },
  },
  '5,0': {
    W: { targetKeyCoord: '4,0', routeTotal: 2 },
    E: { targetKeyCoord: '6,0', routeTotal: 1 },
  },
  '6,0': {
    W: { targetKeyCoord: '5,0', routeTotal: 1 },
    E: { targetKeyCoord: '7,0', routeTotal: 2 },
  },
};

function getUndefinedZoneSealReason(coordOrNodeId: string): string | null {
  const meta = ORION_ROOM_METADATA[coordOrNodeId];
  if (!meta) return null;
  const areaDef = AREA_REGISTRY[meta.areaId];
  const mapDef = MAP_REGISTRY[meta.mapId];
  if (areaDef?.specStatus === 'UNDEFINED') {
    const tag = areaDef.openDesignId || areaDef.docRef || 'UNDEFINED';
    return `${areaDef.name} [UNDEFINED · ${tag}]`;
  }
  if (mapDef?.specStatus === 'UNDEFINED') {
    const tag = mapDef.openDesignId || mapDef.docRef || 'UNDEFINED';
    return `${mapDef.name} [UNDEFINED · ${tag}]`;
  }
  return null;
}

function getPrimaryKeyExitDir(coord: string): AetherCardinalDir | undefined {
  const routes = KEY_NODE_ROUTES[coord];
  if (!routes) return undefined;
  if (routes.E) return 'E';
  if (routes.S) return 'S';
  if (routes.N) return 'N';
  if (routes.W) return 'W';
  return undefined;
}

/**
 * Carves open or seals cardinal perimeter doorways (`N`, `S`, `E`, `W`) on a room grid.
 * In the borderless Aether Fog engine:
 * - `key`, `general`, `side`, and `loop` nodes have all 4 cardinal doorways open so no room has a literal wall border.
 * - `end` nodes have ONLY their single `returnDir` doorway open (the other 3 walls are dead ends).
 */
function isDoorwayOpeningChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return ch !== '#' && ch !== 'P' && ch !== '_';
}

export { getRoomDoorwayCenterPx };

/**
 * Carves open or seals cardinal perimeter doorways (`N`, `S`, `E`, `W`) on a room grid of any size (`cols x rows`).
 * Preserves authored doorway openings when present, or carves a centered 2-tile doorway along solid walls.
 */
export function carveRoomCardinalDoors(
  rawGrid: string[],
  openDirs: AetherCardinalDir[]
): string[] {
  const { cols, rows } = getRoomDimensions(rawGrid);
  const openSet = new Set<AetherCardinalDir>(openDirs);
  const matrix = rawGrid.map((row) => row.padEnd(cols, '#').split(''));

  const nx1 = Math.max(1, Math.floor(cols / 2) - 1);
  const nx2 = Math.min(cols - 2, nx1 + 1);
  const wy1 = rows === 9 ? 5 : Math.max(1, Math.floor(rows / 2));
  const wy2 = Math.min(rows - 2, wy1 + 1);

  // North Wall (row = 0)
  const openNorth = openSet.has('N');
  if (matrix[0]) {
    if (!openNorth) {
      for (let c = 0; c < cols; c++) matrix[0][c] = '#';
    } else {
      const hasExistingNorth = matrix[0].some((ch) => isDoorwayOpeningChar(ch));
      if (!hasExistingNorth) {
        matrix[0][nx1] = '.';
        matrix[0][nx2] = '.';
      }
      if (matrix[1]) {
        for (let c = 1; c < cols - 1; c++) {
          if (isDoorwayOpeningChar(matrix[0][c]) && matrix[1][c] === '#') {
            matrix[1][c] = '.';
          }
        }
      }
    }
  }

  // South Wall (row = rows - 1)
  const openSouth = openSet.has('S');
  if (matrix[rows - 1]) {
    if (!openSouth) {
      for (let c = 0; c < cols; c++) matrix[rows - 1][c] = '#';
    } else {
      const hasExistingSouth = matrix[rows - 1].some((ch) => isDoorwayOpeningChar(ch));
      if (!hasExistingSouth) {
        matrix[rows - 1][nx1] = '.';
        matrix[rows - 1][nx2] = '.';
      }
      if (matrix[rows - 2]) {
        for (let c = 1; c < cols - 1; c++) {
          if (isDoorwayOpeningChar(matrix[rows - 1][c]) && matrix[rows - 2][c] === '#') {
            matrix[rows - 2][c] = '.';
          }
        }
      }
    }
  }

  // West Wall (col = 0)
  const openWest = openSet.has('W');
  if (!openWest) {
    for (let r = 0; r < rows; r++) {
      if (matrix[r]) matrix[r][0] = '#';
    }
  } else {
    const hasExistingWest = matrix.some((row) => isDoorwayOpeningChar(row[0]));
    if (!hasExistingWest && matrix[wy1] && matrix[wy2]) {
      matrix[wy1][0] = '.';
      matrix[wy2][0] = '.';
    }
    for (let r = 1; r < rows - 1; r++) {
      if (matrix[r] && isDoorwayOpeningChar(matrix[r][0]) && matrix[r][1] === '#') {
        matrix[r][1] = '.';
      }
    }
  }

  // East Wall (col = cols - 1)
  const openEast = openSet.has('E');
  if (!openEast) {
    for (let r = 0; r < rows; r++) {
      if (matrix[r]) matrix[r][cols - 1] = '#';
    }
  } else {
    const hasExistingEast = matrix.some((row) => isDoorwayOpeningChar(row[cols - 1]));
    if (!hasExistingEast && matrix[wy1] && matrix[wy2]) {
      matrix[wy1][cols - 1] = '.';
      matrix[wy2][cols - 1] = '.';
    }
    for (let r = 1; r < rows - 1; r++) {
      if (
        matrix[r] &&
        isDoorwayOpeningChar(matrix[r][cols - 1]) &&
        matrix[r][cols - 2] === '#'
      ) {
        matrix[r][cols - 2] = '.';
      }
    }
  }

  return matrix.map((r) => r.join(''));
}

function assembleNestedWorld(): void {
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

    const isCheatRoom = coord === '-4,0';
    const isSecretEndRoom = coord === '1,-1' || localRoom.nodeType === 'end';
    const nodeType: AetherNodeType = isSecretEndRoom ? 'end' : localRoom.nodeType || 'key';
    const openDirs: AetherCardinalDir[] = isCheatRoom
      ? []
      : isSecretEndRoom
        ? ['S']
        : ALL_CARDINAL_DIRS;
    const borderlessGrid = carveRoomCardinalDoors(localRoom.grid, openDirs);

    const resolvedRoom: RoomDefinition = {
      ...localRoom,
      scope: 'local',
      nodeType,
      regionId: regionDef.id,
      areaId: areaDef.id,
      mapId,
      biomeId: getBiomeDefinition(biomeId).id,
      grid: borderlessGrid,
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
      nodeType,
      trueExitDir: isSecretEndRoom ? 'S' : getPrimaryKeyExitDir(coord),
      endFeature: isSecretEndRoom ? 'loot_cache' : undefined,
    };

    if (resolvedRoom.cache) {
      ORION_CACHE_DEFINITIONS[coord] = resolvedRoom.cache;
    }
  }

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
          if (ROOM_REGISTRY[slot.coord]) continue;

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

          const isSlotEndRoom = slot.coord === '1,-1';
          const stitchedGrid = isSlotEndRoom
            ? decorateDynamicRoomGrid(template.grid, 'end', ['S'], 'S', 'loot_cache', 1)
            : carveRoomCardinalDoors(template.grid, ALL_CARDINAL_DIRS);
          const title = slot.title || template.title;
          const bannerTitle = slot.bannerTitle || title.toUpperCase();

          const stitchedRoom: RoomDefinition = {
            ...template,
            id: `${mapDef.id}:${slot.coord}`,
            scope: 'global',
            nodeType: isSlotEndRoom ? 'end' : 'general',
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
            nodeType: isSlotEndRoom ? 'end' : 'general',
            trueExitDir: isSlotEndRoom ? 'S' : 'E',
            routeStep: 1,
            routeTotal: 1,
            endFeature: isSlotEndRoom ? 'loot_cache' : undefined,
          };
          if (isSlotEndRoom) {
            ORION_CACHE_DEFINITIONS[slot.coord] = buildEndNodeCacheDefinition('loot_cache');
          }
        }
      }
    }
  }
}

assembleNestedWorld();

// ─── 2. AETHER FOG 5-NODE GRAPH ENGINE (KEY, GENERAL, SIDE, LOOP, END) ───────

function deterministicHash(seed: number, counter: number, salt: number = 0): number {
  let h = (seed ^ (counter * 374761393) ^ (salt * 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function hasPoeLanternGuidance(state: OrionState): boolean {
  if (state.flags?.poe_state === 'helped' || state.flags?.poe_lantern_gift) {
    return true;
  }
  return state.inventorySlots.some((s) => s.itemId === 'poe_lantern_charm');
}

export const AETHER_PYRAMID_DEPTHS = [0, 1, 2, 3, 2, 1, 0] as const;

function parseCoordPair(coord: string | undefined): { rx: number; ry: number } {
  if (!coord) return { rx: 0, ry: 0 };
  const [rxStr, ryStr] = coord.split(',');
  return {
    rx: Number.isFinite(Number(rxStr)) ? Number(rxStr) : 0,
    ry: Number.isFinite(Number(ryStr)) ? Number(ryStr) : 0,
  };
}

function stepMapCoords(
  rx: number,
  ry: number,
  dir: AetherCardinalDir
): { rx: number; ry: number } {
  switch (dir) {
    case 'E':
      return { rx: rx + 1, ry };
    case 'W':
      return { rx: rx - 1, ry };
    case 'S':
      return { rx, ry: ry + 1 };
    case 'N':
      return { rx, ry: ry - 1 };
  }
}

function getKeyBorderBranchType(
  seed: number,
  coord: string,
  dir: AetherCardinalDir
): AetherNodeType {
  const coordSalt = coord
    .split('')
    .reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 17), 0);
  const borderHash = deterministicHash(seed, coordSalt, dir.charCodeAt(0));
  return borderHash % 3 === 0 ? 'loop' : 'side';
}

export function ensureAetherFogGraph(state: OrionState): AetherFogGraphState {
  if (!state.fogGraph || !state.fogGraph.nodes) {
    const nodes: Record<string, AetherGraphNode> = {};

    for (const [coord, meta] of Object.entries(ORION_ROOM_METADATA)) {
      if (coord.startsWith('fog:')) continue;
      const isEnd = coord === '1,-1' || meta.nodeType === 'end';
      const edges: Partial<Record<AetherCardinalDir, string>> = {};
      if (coord === '1,0') {
        edges.N = '1,-1';
      } else if (coord === '1,-1') {
        edges.S = '1,0';
      }
      const parsed = parseCoordPair(coord);

      nodes[coord] = {
        id: coord,
        nodeType: isEnd ? 'end' : meta.nodeType === 'general' ? 'general' : 'key',
        coord,
        mapRx: parsed.rx,
        mapRy: parsed.ry,
        loopDepth: 0,
        loopStage: 0,
        title: meta.title,
        bannerTitle: meta.bannerTitle,
        regionId: meta.regionId,
        areaId: meta.areaId,
        mapId: meta.mapId,
        biomeId: meta.biomeId,
        trueExitDir: meta.trueExitDir,
        returnDir: isEnd ? 'S' : undefined,
        parentNodeId: isEnd ? '1,0' : undefined,
        edges,
        endFeature: meta.endFeature,
      };
    }

    state.fogGraph = {
      seed: 104729,
      nextCounter: 1,
      activeNodeId: state.room || '-3,0',
      loopDepth: 0,
      loopStage: 0,
      nodes,
    };
  }

  if (!state.fogGraph.nodes[state.room]) {
    const fallbackMeta = ORION_ROOM_METADATA[state.room] || ORION_ROOM_METADATA['-3,0'];
    const parsed = parseCoordPair(state.room);
    state.fogGraph.nodes[state.room] = {
      id: state.room,
      nodeType: fallbackMeta?.nodeType || 'key',
      coord: state.room,
      mapRx: parsed.rx,
      mapRy: parsed.ry,
      loopDepth: 0,
      loopStage: 0,
      title: fallbackMeta?.title || `Sector [${state.room}]`,
      bannerTitle: fallbackMeta?.bannerTitle || `SECTOR [${state.room}]`,
      regionId: fallbackMeta?.regionId || state.regionId || 'region_belldor_outskirts',
      areaId: fallbackMeta?.areaId || state.areaId || 'm00_the_bog',
      mapId: fallbackMeta?.mapId || state.mapId || 'map_bog_drop_zone',
      biomeId: fallbackMeta?.biomeId || state.biomeId || 'belldor_bog',
      trueExitDir: fallbackMeta?.trueExitDir || 'E',
      edges: {},
    };
  }

  state.fogGraph.activeNodeId = state.room;
  return state.fogGraph;
}

export function getActiveAetherNode(state: OrionState): AetherGraphNode {
  const graph = ensureAetherFogGraph(state);
  return graph.nodes[state.room] || graph.nodes['-3,0'] || graph.nodes['0,0'];
}

export function rehydrateAetherFogRooms(
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  const graph = ensureAetherFogGraph(state);
  for (const [id, grid] of Object.entries(ORION_TUTORIAL_ROOMS)) {
    rooms[id] = grid;
  }
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (id.startsWith('fog:') && node.grid && node.grid.length > 0) {
      rooms[id] = node.grid;
      ORION_ROOM_METADATA[id] = {
        title: node.title,
        bannerTitle: node.bannerTitle,
        regionId: node.regionId,
        areaId: node.areaId,
        mapId: node.mapId,
        biomeId: node.biomeId,
        scope: node.nodeType === 'key' ? 'local' : 'global',
        nodeType: node.nodeType,
        trueExitDir: node.trueExitDir,
        routeStep: node.routeStep,
        routeTotal: node.routeTotal,
        endFeature: node.endFeature,
      };
      if (node.nodeType === 'end' && node.endFeature && !ORION_CACHE_DEFINITIONS[id]) {
        ORION_CACHE_DEFINITIONS[id] = buildEndNodeCacheDefinition(node.endFeature);
      }
    }
  }
}

function buildEndNodeCacheDefinition(feature: AetherEndFeature): OrionCacheDefinition {
  if (feature === 'mini_boss') {
    return {
      scrap: 45,
      items: [
        { itemId: 'repair_kit', count: 2 },
        { itemId: 'corrupted_shard', count: 1 },
        { itemId: 'grail_water', count: 1 },
      ],
      toast: 'MINI-BOSS HORDE LOOTED: +45 SCRAP, SHARD & 2 REPAIR KITS',
    };
  }
  if (feature === 'secret_switch') {
    return {
      scrap: 35,
      items: [
        { itemId: 'poe_lantern_charm', count: 1 },
        { itemId: 'grail_water', count: 1 },
      ],
      toast: 'SHRINE CACHE LOOTED: +35 SCRAP, POE LANTERN CHARM & GRAIL WATER',
    };
  }
  if (feature === 'dead_end') {
    return {
      scrap: 20,
      items: [{ itemId: 'repair_kit', count: 1 }],
      toast: 'CUL-DE-SAC CACHE LOOTED: +20 SCRAP & FIELD REPAIR KIT',
    };
  }
  return {
    scrap: 30,
    items: [
      { itemId: 'repair_kit', count: 1 },
      { itemId: 'grail_water', count: 1 },
    ],
    toast: 'FOG END-CHEST OPENED: +30 SCRAP, REPAIR KIT & GRAIL WATER',
  };
}

export { getCanonicalRoomPersistenceKey, isRoomCacheLooted, markRoomCacheLooted };

/**
 * Resets all dynamically generated `general`, `side`, `loop`, and `end` chunks when resting at a Waystation.
 * Preserves authored `key` nodes, `nextCounter`, and cleared/looted persistence so dynamic rooms cannot be farmed infinitely.
 */
export function resetAetherFogGraph(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx?: OrionCombatContext
): void {
  const prevSeed = state.fogGraph?.seed || 104729;
  const prevCounter = state.fogGraph?.nextCounter || 1;

  for (const roomKey of Object.keys(rooms)) {
    if (roomKey.startsWith('fog:')) {
      delete rooms[roomKey];
      delete ORION_ROOM_METADATA[roomKey];
      delete ORION_CACHE_DEFINITIONS[roomKey];
    }
  }

  state.fogGraph = undefined;
  const freshGraph = ensureAetherFogGraph(state);
  freshGraph.seed = (prevSeed + 7919) % 9999991;
  freshGraph.nextCounter = prevCounter;
  freshGraph.loopDepth = 0;
  freshGraph.loopStage = 0;

  if (ctx) {
    ctx.say('ÆTHER FOG GRAPH RE-SYNCHRONIZED · DYNAMIC PATHS SHIFTED');
  }
  notifyOrionStateChange();
}

function pickTrueExitDir(
  entryFromParentDir: AetherCardinalDir,
  preferredDir: AetherCardinalDir | undefined,
  hashVal: number
): AetherCardinalDir {
  const returnDir = getOppositeCardinalDir(entryFromParentDir);
  const candidates = ALL_CARDINAL_DIRS.filter((d) => d !== returnDir);
  if (preferredDir && preferredDir !== returnDir && hashVal % 3 !== 0) {
    return preferredDir;
  }
  return candidates[hashVal % candidates.length] || entryFromParentDir;
}

const MINI_BOSS_ARENA_TEMPLATE_GRID: string[] = [
  '######..######',
  '#..:..::..:..#',
  '#.P........P.#',
  '#...~~..~~...#',
  '#............#',
  '.....:..:.....',
  '.....:..:.....',
  '#............#',
  '#.P.~~..~~.P.#',
  '#..:......:..#',
  '######..######',
];

function decorateDynamicRoomGrid(
  baseGrid: string[],
  nodeType: AetherNodeType,
  openDirs: AetherCardinalDir[],
  _trueExitDir: AetherCardinalDir | undefined,
  endFeature: AetherEndFeature | undefined,
  hashVal: number,
  loopDepth: number = 0
): string[] {
  const sourceGrid =
    nodeType === 'end' && endFeature === 'mini_boss'
      ? MINI_BOSS_ARENA_TEMPLATE_GRID
      : baseGrid;
  const carved = carveRoomCardinalDoors(sourceGrid, openDirs);
  const { cols, rows } = getRoomDimensions(carved);
  const matrix = carved.map((r) => r.split(''));

  const midX = Math.floor(cols / 2);
  const midY = Math.floor(rows / 2);

  // Populate END node special features (Loot Cache, Mini-Boss, Secret Switch, or Dead-End Ruins)
  if (nodeType === 'end') {
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (matrix[y][x] === 'E' || matrix[y][x] === 'o') {
          matrix[y][x] = '.';
        }
      }
    }

    if (endFeature === 'loot_cache') {
      matrix[midY][midX - 1] = ':';
      matrix[midY][midX] = 'V';
      if (matrix[midY - 1]) {
        matrix[midY - 1][midX - 1] = 'P';
        matrix[midY - 1][Math.min(cols - 2, midX + 1)] = 'P';
      }
    } else if (endFeature === 'mini_boss') {
      matrix[2][midX - 1] = 'V';
      matrix[2][midX] = ':';
      matrix[midY][midX - 1] = '.';
      matrix[midY][midX] = '.';
    } else if (endFeature === 'secret_switch') {
      const switchChar = String((hashVal % 3) + 1);
      matrix[Math.max(2, midY - 1)][Math.max(2, midX - 2)] = 'L';
      matrix[Math.max(2, midY - 1)][midX] = switchChar;
      matrix[midY][Math.min(cols - 2, midX + 1)] = 'C';
    } else if (endFeature === 'dead_end') {
      matrix[Math.max(2, midY - 1)][midX - 1] = 'P';
      matrix[Math.max(2, midY - 1)][midX] = 'P';
      matrix[midY][midX - 1] = ':';
      matrix[midY][midX] = 'C';
    }
  }

  // Loop nodes become progressively less traversable and more hazardous at deeper depths (1 -> 2 -> 3)
  if (nodeType === 'loop') {
    const effDepth = Math.max(1, Math.min(3, loopDepth || 1));

    // Depth 1+: Central corrosive Aether pool & surrounding bog mud
    if (matrix[midY]) {
      matrix[midY][midX - 1] = '~';
      matrix[midY][midX] = '~';
    }
    if (matrix[midY - 1]) {
      matrix[midY - 1][midX - 1] = ',';
      matrix[midY - 1][midX] = ',';
    }
    if (matrix[midY + 1]) {
      matrix[midY + 1][midX - 1] = ',';
      matrix[midY + 1][midX] = ',';
    }

    // Depth 2+: Corrosive trenches, calcified pillars, and phase-desync barriers constrict movement
    if (effDepth >= 2) {
      const topRow = Math.max(2, midY - 2);
      const botRow = Math.min(rows - 3, midY + 2);
      const leftCol = Math.max(2, midX - 3);
      const rightCol = Math.min(cols - 3, midX + 2);

      if (matrix[topRow]) {
        matrix[topRow][leftCol] = 'P';
        matrix[topRow][rightCol] = 'P';
        if (leftCol + 1 < midX - 1) matrix[topRow][leftCol + 1] = '~';
        if (rightCol - 1 > midX) matrix[topRow][rightCol - 1] = '~';
      }
      if (matrix[botRow]) {
        matrix[botRow][leftCol] = 'P';
        matrix[botRow][rightCol] = 'P';
        if (leftCol + 1 < midX - 1) matrix[botRow][leftCol + 1] = '~';
        if (rightCol - 1 > midX) matrix[botRow][rightCol - 1] = '~';
      }
      if (matrix[midY]) {
        if (leftCol >= 2) matrix[midY][leftCol] = 'X';
        if (rightCol <= cols - 3) matrix[midY][rightCol] = 'X';
      }
    }

    // Depth 3 (Apex): Abyssal sinkhole fissures ('_'), wider corrosive Aether channels ('~'), and desync gates ('X')
    if (effDepth >= 3) {
      const yUpper = Math.max(2, midY - 2);
      const yLower = Math.min(rows - 3, midY + 2);
      const xOuterL = Math.max(2, midX - 4);
      const xOuterR = Math.min(cols - 3, midX + 3);

      if (matrix[yUpper]) {
        matrix[yUpper][xOuterL] = '_';
        matrix[yUpper][xOuterR] = '_';
      }
      if (matrix[yLower]) {
        matrix[yLower][xOuterL] = '_';
        matrix[yLower][xOuterR] = '_';
      }
      if (matrix[midY - 1]) {
        matrix[midY - 1][Math.max(2, midX - 2)] = '~';
        matrix[midY - 1][Math.min(cols - 3, midX + 1)] = '~';
      }
      if (matrix[midY + 1]) {
        matrix[midY + 1][Math.max(2, midX - 2)] = '~';
        matrix[midY + 1][Math.min(cols - 3, midX + 1)] = '~';
      }
    }
  }

  return matrix.map((r) => r.join(''));
}

function createDynamicAetherNode(
  rooms: Record<string, string[]>,
  state: OrionState,
  parentNode: AetherGraphNode,
  moveDir: AetherCardinalDir,
  nodeType: AetherNodeType,
  options?: {
    sourceKeyCoord?: string;
    targetKeyCoord?: string;
    routeStep?: number;
    routeTotal?: number;
    loopStage?: number;
    loopDepth?: number;
    mapRx?: number;
    mapRy?: number;
    anchorSafeNodeId?: string;
  }
): AetherGraphNode {
  const graph = ensureAetherFogGraph(state);
  const counter = graph.nextCounter++;
  const hashVal = deterministicHash(graph.seed, counter, moveDir.charCodeAt(0));

  const id = `fog:${nodeType}:${counter}`;
  const returnDir = getOppositeCardinalDir(moveDir);

  const parentParsed = parseCoordPair(parentNode.coord);
  const baseRx = parentNode.mapRx ?? parentParsed.rx;
  const baseRy = parentNode.mapRy ?? parentParsed.ry;
  const steppedCoords = stepMapCoords(baseRx, baseRy, moveDir);
  const mapRx = options?.mapRx ?? steppedCoords.rx;
  const mapRy = options?.mapRy ?? steppedCoords.ry;

  const loopStage =
    nodeType === 'loop' ? Math.max(1, Math.min(5, options?.loopStage ?? 1)) : 0;
  const loopDepth =
    nodeType === 'loop'
      ? (options?.loopDepth ?? AETHER_PYRAMID_DEPTHS[loopStage] ?? 1)
      : 0;

  const templates = Object.values(GLOBAL_ROOM_REGISTRY);
  const chosenTemplate =
    templates[hashVal % Math.max(1, templates.length)] || ROOM_REGISTRY['0,1'] || ROOM_REGISTRY['0,0'];

  const inheritedBiomeId =
    nodeType === 'loop'
      ? 'global_aether_caverns'
      : parentNode.biomeId || state.biomeId || chosenTemplate?.biomeId || 'belldor_bog';

  let trueExitDir: AetherCardinalDir | undefined;
  let relapseDir: AetherCardinalDir | undefined;
  let endFeature: AetherEndFeature | undefined;
  let openDirs: AetherCardinalDir[] = ALL_CARDINAL_DIRS;
  let title = chosenTemplate?.title || 'Drifting Sector';
  let bannerTitle = '';

  if (nodeType === 'general') {
    trueExitDir = pickTrueExitDir(moveDir, moveDir, hashVal);
    title = chosenTemplate?.title || 'Æther Corridor';
    bannerTitle = title.toUpperCase();
  } else if (nodeType === 'side') {
    trueExitDir = pickTrueExitDir(moveDir, moveDir, hashVal + 1);
    title = chosenTemplate?.title || 'Drifting Wilds';
    bannerTitle = title.toUpperCase();
  } else if (nodeType === 'end') {
    openDirs = [returnDir];
    trueExitDir = returnDir;
    const features: AetherEndFeature[] = ['loot_cache', 'mini_boss', 'secret_switch', 'dead_end'];
    endFeature = features[hashVal % features.length];
    const featureLabels: Record<AetherEndFeature, string> = {
      loot_cache: 'Scavenger Supply Vault',
      mini_boss: 'Fog Mini-Boss Lair',
      secret_switch: 'Ancient Grail Shrine',
      dead_end: 'Calcified Mist Cul-de-Sac',
    };
    title = featureLabels[endFeature];
    bannerTitle = title.toUpperCase();
  } else if (nodeType === 'loop') {
    trueExitDir = pickTrueExitDir(moveDir, returnDir, hashVal + 3);
    const nonExitCandidates = ALL_CARDINAL_DIRS.filter((d) => d !== trueExitDir);
    relapseDir = nonExitCandidates[(hashVal + 1) % nonExitCandidates.length] || returnDir;
    title = `Æther Loop [Depth ${loopDepth}]`;
    bannerTitle = `ÆTHER LOOP · DEPTH ${loopDepth}`;
  }

  const grid = decorateDynamicRoomGrid(
    chosenTemplate?.grid || ROOM_REGISTRY['0,0'].grid,
    nodeType,
    openDirs,
    trueExitDir,
    endFeature,
    hashVal,
    loopDepth
  );

  const anchorSafeNodeId =
    options?.anchorSafeNodeId ||
    (parentNode.nodeType === 'loop' ? parentNode.parentNodeId : parentNode.id);

  const newNode: AetherGraphNode = {
    id,
    nodeType,
    coord: `${mapRx},${mapRy}`,
    mapRx,
    mapRy,
    loopDepth,
    loopStage,
    relapseDir,
    title,
    bannerTitle,
    regionId: parentNode.regionId || state.regionId || 'region_belldor_outskirts',
    areaId: parentNode.areaId || state.areaId || 'm00_the_bog',
    mapId: parentNode.mapId || state.mapId || 'map_bog_drop_zone',
    biomeId: getBiomeDefinition(inheritedBiomeId).id,
    sourceKeyCoord: options?.sourceKeyCoord ?? parentNode.sourceKeyCoord,
    targetKeyCoord: options?.targetKeyCoord ?? parentNode.targetKeyCoord,
    routeStep: options?.routeStep ?? parentNode.routeStep,
    routeTotal: options?.routeTotal ?? parentNode.routeTotal,
    trueExitDir,
    returnDir,
    parentNodeId: anchorSafeNodeId,
    edges:
      nodeType === 'loop'
        ? {}
        : {
            [returnDir]: parentNode.id,
          },
    endFeature,
    grid,
  };

  graph.nodes[id] = newNode;
  rooms[id] = grid;
  ORION_ROOM_METADATA[id] = {
    title: newNode.title,
    bannerTitle: newNode.bannerTitle,
    regionId: newNode.regionId,
    areaId: newNode.areaId,
    mapId: newNode.mapId,
    biomeId: newNode.biomeId,
    scope: 'global',
    nodeType: newNode.nodeType,
    trueExitDir: newNode.trueExitDir,
    routeStep: newNode.routeStep,
    routeTotal: newNode.routeTotal,
    endFeature: newNode.endFeature,
  };

  if (nodeType === 'end' && endFeature) {
    ORION_CACHE_DEFINITIONS[id] = buildEndNodeCacheDefinition(endFeature);
  }

  return newNode;
}

export interface DoorwayAetherTransitionInfo {
  dir: AetherCardinalDir;
  currentDepth: number;
  currentStage: number;
  nextDepth: number;
  nextStage: number;
  isLoopEntrance: boolean;
  increasesDensity: boolean;
}

/**
 * Pure, non-mutating inspection of any cardinal doorway (`N`, `S`, `E`, `W`) in the active room.
 * - Pyramid progression always follows: `SAFE (0) -> 1 -> 2 -> 3 -> 2 -> 1 -> SAFE (0)`.
 * - `increasesDensity` is true whenever stepping through `dir` moves to a strictly deeper Æther depth (`nextDepth > currentDepth`).
 * - `isLoopEntrance` is true when currently in a Safe room (`currentDepth === 0`) and `dir` enters an Æther Loop (`nextDepth === 1`).
 */
export function getDoorwayAetherTransitionInfo(
  state: OrionState,
  dir: AetherCardinalDir
): DoorwayAetherTransitionInfo {
  const graph = ensureAetherFogGraph(state);
  const currentNode = getActiveAetherNode(state);

  if (currentNode.nodeType === 'loop') {
    const currentStage = Math.max(
      1,
      Math.min(5, currentNode.loopStage ?? graph.loopStage ?? 1)
    );
    const currentDepth =
      currentNode.loopDepth ?? AETHER_PYRAMID_DEPTHS[currentStage] ?? 1;

    let nextStage = currentStage + 1;
    if (currentStage === 1) {
      nextStage = 2; // 1 -> 2
    } else if (currentStage === 2) {
      nextStage = 3; // 2 -> 3 (Apex)
    } else if (currentStage === 3) {
      nextStage = 4; // 3 -> 2 (Descending)
    } else if (currentStage === 4) {
      // At Stage 4 (Depth 2 descending), relapseDir surges back to Stage 3 (Depth 3); other doorways descend to Stage 5 (Depth 1)
      nextStage = dir === currentNode.relapseDir ? 3 : 5;
    } else {
      // At Stage 5 (Depth 1 descending), relapseDir surges back to Stage 2 (Depth 2); other doorways emerge to Safe (Stage 0, Depth 0)
      nextStage = dir === currentNode.relapseDir ? 2 : 0;
    }

    const nextDepth = AETHER_PYRAMID_DEPTHS[nextStage] ?? 0;
    return {
      dir,
      currentDepth,
      currentStage,
      nextDepth,
      nextStage,
      isLoopEntrance: false,
      increasesDensity: nextDepth > currentDepth,
    };
  }

  // Currently in a SAFE room (`currentDepth === 0`): check if `dir` is an Æther Loop entrance
  let isLoopEntrance = false;
  const existingTargetId = currentNode.edges[dir];
  if (existingTargetId && graph.nodes[existingTargetId]) {
    isLoopEntrance = graph.nodes[existingTargetId].nodeType === 'loop';
  } else if (currentNode.nodeType === 'end') {
    isLoopEntrance = false;
  } else if (currentNode.nodeType === 'key') {
    const keyCoord = currentNode.id.includes(',') ? currentNode.id : currentNode.coord;
    const route = KEY_NODE_ROUTES[keyCoord]?.[dir];
    if (route) {
      isLoopEntrance = Boolean(getUndefinedZoneSealReason(route.targetKeyCoord));
    } else {
      isLoopEntrance = getKeyBorderBranchType(graph.seed, keyCoord, dir) === 'loop';
    }
  } else if (currentNode.nodeType === 'general') {
    if (dir === currentNode.trueExitDir) {
      const step = currentNode.routeStep || 1;
      const total = currentNode.routeTotal || 1;
      if (step >= total && currentNode.targetKeyCoord) {
        isLoopEntrance = Boolean(getUndefinedZoneSealReason(currentNode.targetKeyCoord));
      }
    } else {
      isLoopEntrance = false;
    }
  } else if (currentNode.nodeType === 'side') {
    isLoopEntrance = dir !== currentNode.trueExitDir;
  }

  const nextStage = isLoopEntrance ? 1 : 0;
  const nextDepth = isLoopEntrance ? 1 : 0;

  return {
    dir,
    currentDepth: 0,
    currentStage: 0,
    nextDepth,
    nextStage,
    isLoopEntrance,
    increasesDensity: nextDepth > 0,
  };
}

function resolveSafeEmergenceNode(
  graph: AetherFogGraphState,
  currentNode: AetherGraphNode,
  dir: AetherCardinalDir
): AetherGraphNode {
  const baseRx = currentNode.mapRx ?? 0;
  const baseRy = currentNode.mapRy ?? 0;
  const stepped = stepMapCoords(baseRx, baseRy, dir);
  const candidateCoord = `${stepped.rx},${stepped.ry}`;

  // If the map-relative emergence coordinate matches an authored unsealed safe node in the same area, emerge there
  const candidateNode = graph.nodes[candidateCoord];
  if (
    candidateNode &&
    candidateNode.nodeType === 'key' &&
    candidateNode.id !== '-4,0' &&
    !getUndefinedZoneSealReason(candidateCoord)
  ) {
    return candidateNode;
  }

  if (currentNode.parentNodeId && graph.nodes[currentNode.parentNodeId]) {
    return graph.nodes[currentNode.parentNodeId];
  }
  return graph.nodes['0,0'] || Object.values(graph.nodes)[0];
}

function resolveNextAetherNode(
  rooms: Record<string, string[]>,
  state: OrionState,
  currentNode: AetherGraphNode,
  dir: AetherCardinalDir
): { targetNode: AetherGraphNode; isLoopCycle: boolean; escapedLoop: boolean } {
  const graph = ensureAetherFogGraph(state);

  // 1. Inside a LOOP node: follow the Pyramid progression `safe (0) -> 1 -> 2 -> 3 -> 2 -> 1 -> safe (0)`
  if (currentNode.nodeType === 'loop') {
    const transInfo = getDoorwayAetherTransitionInfo(state, dir);

    // Emerging back to SAFE (`nextStage === 0`) after descending through `3 -> 2 -> 1 -> safe`
    if (transInfo.nextStage === 0) {
      const escapeTarget = resolveSafeEmergenceNode(graph, currentNode, dir);
      currentNode.edges[dir] = escapeTarget.id;
      return { targetNode: escapeTarget, isLoopCycle: false, escapedLoop: true };
    }

    const existingLoopTargetId = currentNode.edges[dir];
    if (
      existingLoopTargetId &&
      graph.nodes[existingLoopTargetId] &&
      rooms[existingLoopTargetId] &&
      graph.nodes[existingLoopTargetId].loopStage === transInfo.nextStage
    ) {
      return {
        targetNode: graph.nodes[existingLoopTargetId],
        isLoopCycle: true,
        escapedLoop: false,
      };
    }

    const nextLoopNode = createDynamicAetherNode(rooms, state, currentNode, dir, 'loop', {
      sourceKeyCoord: currentNode.sourceKeyCoord,
      targetKeyCoord: currentNode.targetKeyCoord,
      routeStep: currentNode.routeStep,
      routeTotal: currentNode.routeTotal,
      loopStage: transInfo.nextStage,
      loopDepth: transInfo.nextDepth,
      anchorSafeNodeId: currentNode.parentNodeId,
    });
    currentNode.edges[dir] = nextLoopNode.id;
    return { targetNode: nextLoopNode, isLoopCycle: true, escapedLoop: false };
  }

  // 2. If edge from a non-loop node is already resolved in the current session, follow it
  const existingTargetId = currentNode.edges[dir];
  if (existingTargetId && graph.nodes[existingTargetId] && rooms[existingTargetId]) {
    const targetNode = graph.nodes[existingTargetId];
    return {
      targetNode,
      isLoopCycle: targetNode.nodeType === 'loop',
      escapedLoop: false,
    };
  }

  // 3. Inside an END node: only returnDir is open and returns to parent
  if (currentNode.nodeType === 'end') {
    const parentId = currentNode.parentNodeId || '0,0';
    const parentNode = graph.nodes[parentId] || graph.nodes['0,0'];
    currentNode.edges[dir] = parentNode.id;
    return { targetNode: parentNode, isLoopCycle: false, escapedLoop: false };
  }

  // 4. Inside a KEY node:
  if (currentNode.nodeType === 'key') {
    const keyCoord = currentNode.id.includes(',') ? currentNode.id : currentNode.coord;
    const route = KEY_NODE_ROUTES[keyCoord]?.[dir];
    if (route) {
      const sealReason = getUndefinedZoneSealReason(route.targetKeyCoord);
      if (sealReason) {
        const sealedLoop = createDynamicAetherNode(rooms, state, currentNode, dir, 'loop', {
          sourceKeyCoord: keyCoord,
          targetKeyCoord: route.targetKeyCoord,
          loopStage: 1,
          loopDepth: 1,
          anchorSafeNodeId: currentNode.id,
        });
        sealedLoop.bannerTitle = `SEALED BY ÆTHER FOG · ${sealReason.toUpperCase()}`;
        ORION_ROOM_METADATA[sealedLoop.id].bannerTitle = sealedLoop.bannerTitle;
        currentNode.edges[dir] = sealedLoop.id;
        return { targetNode: sealedLoop, isLoopCycle: true, escapedLoop: false };
      }

      if (route.isDirectEndNode || route.routeTotal <= 0) {
        const directTarget = graph.nodes[route.targetKeyCoord];
        if (directTarget) {
          currentNode.edges[dir] = directTarget.id;
          directTarget.edges[getOppositeCardinalDir(dir)] = currentNode.id;
          return { targetNode: directTarget, isLoopCycle: false, escapedLoop: false };
        }
      }

      const genNode = createDynamicAetherNode(rooms, state, currentNode, dir, 'general', {
        sourceKeyCoord: keyCoord,
        targetKeyCoord: route.targetKeyCoord,
        routeStep: 1,
        routeTotal: route.routeTotal,
      });
      currentNode.edges[dir] = genNode.id;
      return { targetNode: genNode, isLoopCycle: false, escapedLoop: false };
    }

    // Unmapped open border on a KEY node -> deterministically spawns a SIDE node or LOOP node (Stage 1, Depth 1)
    const branchType = getKeyBorderBranchType(graph.seed, keyCoord, dir);
    const branchNode = createDynamicAetherNode(rooms, state, currentNode, dir, branchType, {
      sourceKeyCoord: keyCoord,
      loopStage: branchType === 'loop' ? 1 : 0,
      loopDepth: branchType === 'loop' ? 1 : 0,
      anchorSafeNodeId: currentNode.id,
    });
    currentNode.edges[dir] = branchNode.id;
    return {
      targetNode: branchNode,
      isLoopCycle: branchType === 'loop',
      escapedLoop: false,
    };
  }

  // 5. Inside a GENERAL node:
  if (currentNode.nodeType === 'general') {
    if (dir === currentNode.trueExitDir) {
      const step = currentNode.routeStep || 1;
      const total = currentNode.routeTotal || 1;
      if (step >= total && currentNode.targetKeyCoord && graph.nodes[currentNode.targetKeyCoord]) {
        const sealReason = getUndefinedZoneSealReason(currentNode.targetKeyCoord);
        if (sealReason) {
          const sealedLoop = createDynamicAetherNode(rooms, state, currentNode, dir, 'loop', {
            sourceKeyCoord: currentNode.sourceKeyCoord,
            targetKeyCoord: currentNode.targetKeyCoord,
            loopStage: 1,
            loopDepth: 1,
            anchorSafeNodeId: currentNode.id,
          });
          sealedLoop.bannerTitle = `SEALED BY ÆTHER FOG · ${sealReason.toUpperCase()}`;
          ORION_ROOM_METADATA[sealedLoop.id].bannerTitle = sealedLoop.bannerTitle;
          currentNode.edges[dir] = sealedLoop.id;
          return { targetNode: sealedLoop, isLoopCycle: true, escapedLoop: false };
        }

        const destKeyNode = graph.nodes[currentNode.targetKeyCoord];
        currentNode.edges[dir] = destKeyNode.id;
        destKeyNode.edges[getOppositeCardinalDir(dir)] = currentNode.id;
        return { targetNode: destKeyNode, isLoopCycle: false, escapedLoop: false };
      }

      const nextGenNode = createDynamicAetherNode(rooms, state, currentNode, dir, 'general', {
        sourceKeyCoord: currentNode.sourceKeyCoord,
        targetKeyCoord: currentNode.targetKeyCoord,
        routeStep: step + 1,
        routeTotal: total,
      });
      currentNode.edges[dir] = nextGenNode.id;
      return { targetNode: nextGenNode, isLoopCycle: false, escapedLoop: false };
    }

    // Off-path exit from a GENERAL node -> spawns a SIDE node (does NOT increment routeStep)
    const sideNode = createDynamicAetherNode(rooms, state, currentNode, dir, 'side', {
      sourceKeyCoord: currentNode.sourceKeyCoord,
      targetKeyCoord: currentNode.targetKeyCoord,
      routeStep: currentNode.routeStep,
      routeTotal: currentNode.routeTotal,
    });
    currentNode.edges[dir] = sideNode.id;
    return { targetNode: sideNode, isLoopCycle: false, escapedLoop: false };
  }

  // 6. Inside a SIDE node:
  // `trueExitDir` leads to a rewarding END node; off-path exits lead into a LOOP node at Stage 1 (Depth 1)
  const targetType: AetherNodeType = dir === currentNode.trueExitDir ? 'end' : 'loop';
  const childNode = createDynamicAetherNode(rooms, state, currentNode, dir, targetType, {
    sourceKeyCoord: currentNode.sourceKeyCoord,
    targetKeyCoord: currentNode.targetKeyCoord,
    routeStep: currentNode.routeStep,
    routeTotal: currentNode.routeTotal,
    loopStage: targetType === 'loop' ? 1 : 0,
    loopDepth: targetType === 'loop' ? 1 : 0,
    anchorSafeNodeId: currentNode.id,
  });
  currentNode.edges[dir] = childNode.id;
  return {
    targetNode: childNode,
    isLoopCycle: targetType === 'loop',
    escapedLoop: false,
  };
}

function spawnDynamicNodeFeatures(
  rooms: Record<string, string[]>,
  state: OrionState,
  node: AetherGraphNode
): void {
  const canonicalKey = getCanonicalRoomPersistenceKey(state, node.id);
  const miniBossSpawnKey = `${canonicalKey}:mini_boss`;
  if (
    state.clearedRooms[node.id] ||
    state.clearedRooms[canonicalKey] ||
    state.clearedRooms[miniBossSpawnKey]
  ) {
    return;
  }
  const { widthPx, heightPx } = getRoomDimensions(rooms[node.id]);

  if (node.nodeType === 'end' && node.endFeature === 'mini_boss') {
    const bossPool = [
      { type: 'percival_knight', title: 'Æther-Bound Vanguard (Mini-Boss)' },
      { type: 'orc_warrior', title: 'Fog-Stalker Warbringer (Mini-Boss)' },
      { type: 'tristan_knight', title: 'Phantom Blade of the Mist (Mini-Boss)' },
    ];
    const pick = bossPool[node.id.length % bossPool.length];
    spawnEnemyByType(state, pick.type, Math.round(widthPx * 0.5), Math.round(heightPx * 0.46), {
      name: pick.title,
      emissiveColor: '#f43f5e',
      damage: 22,
      spawnKey: miniBossSpawnKey,
    });
    return;
  }

  // Scale Æther Loop difficulty by pyramid depth (1 -> 2 -> 3)
  if (node.nodeType === 'loop') {
    const depth = Math.max(1, Math.min(3, node.loopDepth || 1));
    const statMult = depth === 1 ? 1.15 : depth === 2 ? 1.4 : 1.75;
    const speedMult = depth === 1 ? 1.05 : depth === 2 ? 1.14 : 1.24;

    const spawnScaledLoopEnemy = (
      type: string,
      px: number,
      py: number,
      idx: number
    ) => {
      const e = spawnEnemyByType(state, type, px, py, {
        spawnKey: `${canonicalKey}:loop_depth_${depth}:${idx}`,
      });
      if (!e) return;
      e.shields.maxCapacity = Math.round(e.shields.maxCapacity * statMult);
      e.shields.capacity = e.shields.maxCapacity;
      e.armor.maxDurability = Math.round(e.armor.maxDurability * statMult);
      e.armor.durability = e.armor.maxDurability;
      e.frame.maxIntegrity = Math.round(e.frame.maxIntegrity * statMult);
      e.frame.integrity = e.frame.maxIntegrity;
      e.damage = Math.round(e.damage * statMult);
      e.speed = Math.round(e.speed * speedMult);
      e.emissiveColor = depth === 3 ? '#f43f5e' : depth === 2 ? '#c084fc' : '#38bdf8';
      if (type === 'bog_wurm') {
        e.isSubmerged = !hasPoeLanternGuidance(state);
      }
    };

    if (depth === 1) {
      spawnScaledLoopEnemy('bog_crawler', Math.round(widthPx * 0.34), Math.round(heightPx * 0.42), 0);
    } else if (depth === 2) {
      spawnScaledLoopEnemy('orc_warrior', Math.round(widthPx * 0.32), Math.round(heightPx * 0.38), 0);
      spawnScaledLoopEnemy('bog_wurm', Math.round(widthPx * 0.68), Math.round(heightPx * 0.62), 1);
    } else {
      spawnScaledLoopEnemy('orc_warrior', Math.round(widthPx * 0.28), Math.round(heightPx * 0.36), 0);
      spawnScaledLoopEnemy('bog_wurm', Math.round(widthPx * 0.72), Math.round(heightPx * 0.36), 1);
      spawnScaledLoopEnemy('percival_knight', Math.round(widthPx * 0.5), Math.round(heightPx * 0.64), 2);
    }
  }
}

export function transitionViaAetherDoor(
  rooms: Record<string, string[]>,
  state: OrionState,
  dir: AetherCardinalDir,
  ctx?: OrionCombatContext
): boolean {
  const graph = ensureAetherFogGraph(state);
  const currentNode = getActiveAetherNode(state);
  const prevAreaId = state.areaId;
  const prevRoomGrid = rooms[state.room];
  const departureDoor = getRoomDoorwayCenterPx(prevRoomGrid, dir);

  const { targetNode, escapedLoop } = resolveNextAetherNode(
    rooms,
    state,
    currentNode,
    dir
  );

  const targetRoomGrid = rooms[targetNode.id];
  if (!targetRoomGrid) return false;

  const nextDim = getRoomDimensions(targetRoomGrid);
  const arrivalEdge = getOppositeCardinalDir(dir);
  const arrivalDoor = getRoomDoorwayCenterPx(targetRoomGrid, arrivalEdge);

  if (dir === 'E' || dir === 'W') {
    const depSpan = Math.max(1, departureDoor.maxPx - departureDoor.minPx);
    const tNorm = Math.max(0, Math.min(1, (state.y - departureDoor.minPx) / depSpan));
    const alignedY =
      arrivalDoor.minPx + tNorm * Math.max(0, arrivalDoor.maxPx - arrivalDoor.minPx);
    state.x = dir === 'E' ? 10 : nextDim.widthPx - 10;
    state.y = Math.max(arrivalDoor.minPx, Math.min(arrivalDoor.maxPx, alignedY));
  } else {
    const depSpan = Math.max(1, departureDoor.maxPx - departureDoor.minPx);
    const tNorm = Math.max(0, Math.min(1, (state.x - departureDoor.minPx) / depSpan));
    const alignedX =
      arrivalDoor.minPx + tNorm * Math.max(0, arrivalDoor.maxPx - arrivalDoor.minPx);
    state.y = dir === 'S' ? 10 : nextDim.heightPx - 10;
    state.x = Math.max(arrivalDoor.minPx, Math.min(arrivalDoor.maxPx, alignedX));
  }

  // Map-relative coordinates (`rx`, `ry`) track both safe nodes and Æther Loop rooms relative to the map
  const parsedCoord = parseCoordPair(targetNode.coord);
  state.rx = targetNode.mapRx ?? parsedCoord.rx;
  state.ry = targetNode.mapRy ?? parsedCoord.ry;

  state.room = targetNode.id;
  graph.activeNodeId = targetNode.id;

  if (targetNode.nodeType === 'loop') {
    graph.loopStage = targetNode.loopStage ?? 1;
    graph.loopDepth = targetNode.loopDepth ?? AETHER_PYRAMID_DEPTHS[graph.loopStage] ?? 1;
    state.flickerTimer = 0.25 + graph.loopDepth * 0.1;
  } else {
    graph.loopStage = 0;
    graph.loopDepth = 0;
  }

  state.projectiles = [];
  state.pickups = [];

  syncRoomHierarchyState(state);

  spawnRoomEnemies(rooms, state);
  spawnDynamicNodeFeatures(rooms, state, targetNode);

  soundSystem.playSelect();
  const info = getRoomWorldInfo(state);

  // Room-to-room pop-ups are suppressed unless needed (sealed zone, entering/peaking/escaping an Æther Loop, or major area change)
  let toastMsg: string | null = null;
  if (targetNode.bannerTitle.startsWith('SEALED BY ÆTHER FOG')) {
    toastMsg = `${targetNode.bannerTitle} · ÆTHER LOOP DEPTH ${graph.loopDepth}`;
  } else if (currentNode.nodeType !== 'loop' && targetNode.nodeType === 'loop') {
    toastMsg = `ENTERING ÆTHER LOOP · DEPTH ${graph.loopDepth}`;
  } else if (
    targetNode.nodeType === 'loop' &&
    graph.loopDepth === 3 &&
    (currentNode.loopDepth || 0) < 3
  ) {
    toastMsg = 'ÆTHER DENSITY CRITICAL · DEPTH 3 APEX';
  } else if (escapedLoop) {
    toastMsg = `ÆTHER LOOP CLEARED · ${info.roomTitle.toUpperCase()}`;
  } else if (prevAreaId && state.areaId !== prevAreaId) {
    toastMsg = info.areaName.toUpperCase();
  }

  if (toastMsg) {
    if (ctx) {
      ctx.say(toastMsg);
    } else {
      state.toastText = toastMsg;
      state.toastTimer = 2.2;
    }
  }

  notifyOrionStateChange();
  return true;
}

// ─── 3. ENVIRONMENTAL HAZARDS, ORC RAIDS & WORLD TRIALS ──────────────────────

let corrosionParticleTimer = 0;

export function isDesyncWallSolid(state: OrionState): boolean {
  if (state.flags?.[`desync_lock:${state.room}`]) {
    return false;
  }
  const biome = getBiomeDefinition(state.biomeId);
  const loopDepth = state.fogGraph?.loopDepth || 0;
  // Deeper Æther loops cycle phase-desync barriers faster
  const depthPeriodMult = loopDepth >= 3 ? 0.55 : loopDepth === 2 ? 0.75 : 1.0;
  const period = Math.max(0.85, (biome.tileRules?.desyncPeriodSec || 3.5) * depthPeriodMult);
  return Math.floor(state.t / period) % 2 === 0;
}

export function updateEnvironmentalHazards(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  const roomData = rooms[state.room];
  if (!roomData) return;

  const biome = getBiomeDefinition(state.biomeId);
  const loopDepth = state.fogGraph?.loopDepth || 0;
  const isBiomeCorrosive = (biome.tileRules?.corrosiveWater ?? true) || loopDepth > 0;
  const baseCorrosionRate = biome.tileRules?.corrosiveDamagePerSec ?? 5.0;
  const corrosionRate = baseCorrosionRate * (1 + loopDepth * 0.45);

  corrosionParticleTimer -= dt;
  let spawnedCorrosionParticle = false;

  if (isBiomeCorrosive && state.z <= 0 && !state.isFallingIntoPit) {
    const ptx = Math.floor(state.x / TILE_SIZE);
    const pty = Math.floor(state.y / TILE_SIZE);
    const pChar = roomData[pty]?.[ptx] || '.';
    const pTile = getTileDefinition(pChar, state.biomeId);

    if (pTile.isCorrosive && state.armor.durability > 0) {
      state.armor.durability = Math.max(0, state.armor.durability - corrosionRate * dt);
      if (corrosionParticleTimer <= 0) {
        ctx.spawnParticles(state.x, state.y, 4, 2, '#84cc16', 'CORROSION');
        spawnedCorrosionParticle = true;
      }
    }
  }

  if (isBiomeCorrosive) {
    for (const e of state.enemies) {
      if (e.z > 2 || e.isFlying) continue;
      if (e.type === 'bog_wurm' || e.type === 'lady_of_the_lake') continue;

      const etx = Math.floor(e.x / TILE_SIZE);
      const ety = Math.floor(e.y / TILE_SIZE);
      const eChar = roomData[ety]?.[etx] || '.';
      const eTile = getTileDefinition(eChar, state.biomeId);

      if (eTile.isCorrosive && e.armor.durability > 0) {
        e.armor.durability = Math.max(0, e.armor.durability - (corrosionRate + 1.5) * dt);
        if (corrosionParticleTimer <= 0) {
          ctx.spawnParticles(e.x, e.y, 4, 2, '#a3e635', 'ARMOR CORRODED');
          spawnedCorrosionParticle = true;
        }
      }
    }
  }

  if (spawnedCorrosionParticle) {
    corrosionParticleTimer = 0.75;
  }
}

export function triggerOrcRaid(state: OrionState, ctx?: OrionCombatContext): void {
  state.flags = state.flags || {};
  state.flags.orc_raid_active = true;
  state.flickerTimer = 1.0;

  const { widthPx, heightPx } = getRoomDimensions(ORION_TUTORIAL_ROOMS[state.room]);

  let npcCount = 0;
  for (const e of state.enemies) {
    if (e.type === 'town_npc') {
      e.npcDisposition = 'feral';
      e.faction = 'npc';
      npcCount++;
    }
  }

  if (npcCount === 0) {
    spawnEnemyByType(state, 'town_npc', Math.round(widthPx * 0.34), Math.round(heightPx * 0.42), {
      npcDisposition: 'feral',
      faction: 'npc',
      name: 'Panicked Town Citizen',
    });
    spawnEnemyByType(state, 'town_npc', Math.round(widthPx * 0.66), Math.round(heightPx * 0.62), {
      npcDisposition: 'feral',
      faction: 'npc',
      name: 'Panicked Town Merchant',
    });
  }

  spawnEnemyByType(state, 'orc_warrior', Math.round(widthPx * 0.25), 36);
  spawnEnemyByType(state, 'orc_scout', Math.round(widthPx * 0.75), 36);

  soundSystem.playExplosion();
  const msg = 'WAR HORN! ORC RAID — BOG EXIT SEALED & NPCS FERAL!';
  if (ctx) {
    ctx.say(msg);
  } else {
    state.toastText = msg;
    state.toastTimer = 3.0;
  }
  notifyOrionStateChange();
}

export function triggerThreeKnightsTrial(state: OrionState, ctx?: OrionCombatContext): void {
  state.flags = state.flags || {};
  state.flags.knights_pulled_together = true;

  const { widthPx, heightPx } = getRoomDimensions(ORION_TUTORIAL_ROOMS[state.room]);

  state.enemies = state.enemies.filter(
    (e) =>
      e.type !== 'percival_knight' &&
      e.type !== 'tristan_knight' &&
      e.type !== 'bors_knight'
  );

  spawnEnemyByType(state, 'percival_knight', Math.round(widthPx * 0.28), Math.round(heightPx * 0.34));
  spawnEnemyByType(state, 'tristan_knight', Math.round(widthPx * 0.72), Math.round(heightPx * 0.34));
  spawnEnemyByType(state, 'bors_knight', Math.round(widthPx * 0.5), Math.round(heightPx * 0.26));

  soundSystem.playCharge();
  const msg = 'THE THREE KNIGHTS ENGAGED AT ONCE — KNIGHT’S OATH TRIAL!';
  if (ctx) {
    ctx.say(msg);
  } else {
    state.toastText = msg;
    state.toastTimer = 3.0;
  }
  notifyOrionStateChange();
}

export function awakenLadyOfTheLake(state: OrionState, ctx?: OrionCombatContext): boolean {
  state.flags = state.flags || {};
  const existing = state.enemies.some((e) => e.type === 'lady_of_the_lake');
  if (existing) return false;

  const { widthPx, heightPx } = getRoomDimensions(ORION_TUTORIAL_ROOMS[state.room]);
  spawnEnemyByType(
    state,
    'lady_of_the_lake',
    Math.round(widthPx * 0.5),
    Math.round(heightPx * 0.45)
  );
  soundSystem.playPowerup();
  const msg = 'THE WATER ANSWERS BEDIVERE’S LIST — LADY OF THE LAKE AWAKENED!';
  if (ctx) {
    ctx.say(msg);
  } else {
    state.toastText = msg;
    state.toastTimer = 3.2;
  }
  notifyOrionStateChange();
  return true;
}

// ─── 4. HIERARCHY STATE, FAST TRAVEL, ANCHORS & ROOM TRANSITIONS ─────────────

export function syncRoomHierarchyState(state: OrionState): void {
  ensureAetherFogGraph(state);
  const meta = ORION_ROOM_METADATA[state.room];
  const areaId = meta?.areaId || state.areaId || 'm00_the_bog';
  const areaDef = getAreaDefinition(areaId);
  const regionId = meta?.regionId || areaDef.regionId || 'region_belldor_outskirts';
  const regionDef = getRegionDefinition(regionId);
  const mapId = meta?.mapId || areaDef.localMapIds[0] || 'map_bog_drop_zone';
  const mapDef = getMapDefinition(mapId);
  const biomeId =
    meta?.biomeId ||
    mapDef?.biomeId ||
    areaDef.biomeId ||
    regionDef.defaultBiomeId ||
    'belldor_bog';

  state.regionId = regionDef.id;
  state.areaId = areaDef.id;
  state.mapId = mapDef?.id || mapId;
  state.biomeId = getBiomeDefinition(biomeId).id;

  state.discoveredWaystations = (state.discoveredWaystations || []).filter(
    (id) => id !== 'ws_bog_drop_pod'
  );
  state.discoveredWaygates = state.discoveredWaygates || [];

  if (
    regionDef.waygate &&
    regionDef.waygate.room === state.room &&
    !state.discoveredWaygates.includes(regionDef.waygate.id)
  ) {
    state.discoveredWaygates.push(regionDef.waygate.id);
  }
}

function stripParentAreaDesignator(raw: string): string {
  return raw
    .replace(
      /^(?:M0\d\s+THE\s+BOG|M0\d\s+SECRET\s+ARENA|M0\d\s+ORC\s+ENCAMPMENT|CAMELOT\s+BORDER\s+TOWN|CATHEDRAL\s+DISTRICT|DROP-POD\s+BAY|(?:GENERAL|SIDE|END|LOOP)\s+NODE(?:\s*\(\d+\/\d+\))?)\s*[·—-]\s*/i,
      ''
    )
    .replace(
      /^(?:Æther\s+Path\s*\(\d+\/\d+\)|Off-Path\s+Branch|Fog\s+Cul-de-Sac)\s*[·—-]\s*/i,
      ''
    )
    .trim();
}

export function getRoomWorldInfo(state: OrionState): {
  roomTitle: string;
  roomScope: 'global' | 'local';
  nodeType: AetherNodeType;
  trueExitDir?: AetherCardinalDir;
  routeStep?: number;
  routeTotal?: number;
  loopDepth: number;
  loopStage: number;
  endFeature?: AetherEndFeature;
  bannerTitle: string;
  mapName: string;
  mapScope: 'global' | 'local';
  areaName: string;
  areaScope: 'global' | 'local';
  regionName: string;
  regionScope: 'global' | 'local';
  biomeName: string;
  biomeScope: 'global' | 'local';
  worldName: string;
} {
  const graph = ensureAetherFogGraph(state);
  const activeNode = getActiveAetherNode(state);
  const meta = ORION_ROOM_METADATA[state.room];
  const areaId = meta?.areaId || state.areaId || 'm00_the_bog';
  const areaDef = AREA_REGISTRY[areaId] || getAreaDefinition('m00_the_bog');
  const regionDef = getRegionDefinition(meta?.regionId || state.regionId || areaDef.regionId);
  const mapDef = getMapDefinition(meta?.mapId || state.mapId || areaDef.localMapIds[0]);
  const biomeDef = getBiomeDefinition(
    meta?.biomeId || state.biomeId || mapDef?.biomeId || areaDef.biomeId
  );

  const rawRoomTitle =
    activeNode?.title || meta?.title || `Sector [${state.rx}, ${state.ry}]`;
  const cleanRoomTitle = stripParentAreaDesignator(rawRoomTitle) || rawRoomTitle;
  const rawBannerTitle =
    activeNode?.bannerTitle || meta?.bannerTitle || cleanRoomTitle.toUpperCase();
  const cleanBannerTitle =
    stripParentAreaDesignator(rawBannerTitle) || cleanRoomTitle.toUpperCase();

  return {
    roomTitle: cleanRoomTitle,
    roomScope: meta?.scope || 'local',
    nodeType: activeNode?.nodeType || meta?.nodeType || 'key',
    trueExitDir: activeNode?.trueExitDir || meta?.trueExitDir,
    routeStep: activeNode?.routeStep ?? meta?.routeStep,
    routeTotal: activeNode?.routeTotal ?? meta?.routeTotal,
    loopDepth: graph.loopDepth || 0,
    loopStage: graph.loopStage || 0,
    endFeature: activeNode?.endFeature || meta?.endFeature,
    bannerTitle: cleanBannerTitle,
    mapName: mapDef?.name || 'Bog Sector',
    mapScope: mapDef?.scope || 'local',
    areaName: areaDef.name.replace(/^M0\d\s+/i, ''),
    areaScope: areaDef.scope,
    regionName: regionDef.name,
    regionScope: regionDef.scope,
    biomeName: biomeDef.name,
    biomeScope: biomeDef.scope,
    worldName: regionDef.world || areaDef.world,
  };
}

export function fastTravelToWaystation(
  rooms: Record<string, string[]>,
  state: OrionState,
  waystationId: string,
  ctx?: OrionCombatContext
): boolean {
  if (state.flags?.orc_raid_active) {
    const msg = 'WAYSTATION LOCKED: DEAL WITH ACTIVE ORC RAID FIRST!';
    if (ctx) ctx.say(msg);
    else {
      state.toastText = msg;
      state.toastTimer = 2.5;
    }
    soundSystem.playMenuBeep();
    return false;
  }

  const ws = WAYSTATION_REGISTRY[waystationId];
  if (!ws || !rooms[ws.room]) return false;

  const targetArea = AREA_REGISTRY[ws.areaId];
  if (targetArea?.specStatus === 'UNDEFINED') {
    const tag = targetArea.openDesignId || targetArea.docRef || 'UNDEFINED';
    const msg = `SEALED BY ÆTHER FOG · ${targetArea.name} [UNDEFINED: ${tag}]`;
    if (ctx) ctx.say(msg);
    else {
      state.toastText = msg;
      state.toastTimer = 2.8;
    }
    soundSystem.playMenuBeep();
    return false;
  }

  resetAetherFogGraph(rooms, state);

  const [rxStr, ryStr] = ws.room.split(',');
  state.room = ws.room;
  state.rx = Number(rxStr) || 0;
  state.ry = Number(ryStr) || 0;
  state.x = ws.x;
  state.y = ws.y;
  state.z = 0;
  state.vz = 0;
  state.projectiles = [];
  state.pickups = [];

  syncRoomHierarchyState(state);
  state.spawnAnchor = {
    areaId: state.areaId,
    room: state.room,
    x: ws.x,
    y: ws.y,
  };
  state.frame.integrity = state.frame.maxIntegrity || 200;
  state.frame.state = 'Operational';
  state.armor.durability = state.armor.maxDurability;
  state.shields.capacity = state.shields.maxCapacity;
  state.shields.overloaded = false;
  state.heat = 0;

  spawnRoomEnemies(rooms, state);
  soundSystem.playPowerup();
  const msg = `ÆTHER WAYSTATION TRANSIT -> ${ws.name.toUpperCase()} · FRAME REPAIRED`;
  if (ctx) ctx.say(msg);
  else {
    state.toastText = msg;
    state.toastTimer = 2.8;
  }
  notifyOrionStateChange();
  return true;
}

export function fastTravelViaWaygate(
  rooms: Record<string, string[]>,
  state: OrionState,
  waygateId: string,
  ctx?: OrionCombatContext
): boolean {
  const wg = WAYGATE_REGISTRY[waygateId];
  if (!wg || !rooms[wg.room]) return false;

  // Interacting with a Waygate repairs Frame HP even if the destination is sealed
  state.frame.integrity = state.frame.maxIntegrity || 200;
  state.frame.state = 'Operational';
  state.armor.durability = state.armor.maxDurability;
  state.shields.capacity = state.shields.maxCapacity;
  state.shields.overloaded = false;
  state.heat = 0;

  const targetArea = AREA_REGISTRY[wg.areaId];
  if (targetArea?.specStatus === 'UNDEFINED') {
    const tag = targetArea.openDesignId || targetArea.docRef || 'worlds.md §1';
    const msg = `WAYGATE SEALED · FRAME REPAIRED · ${targetArea.name} / ${wg.world.toUpperCase()} [UNDEFINED: ${tag}]`;
    if (ctx) ctx.say(msg);
    else {
      state.toastText = msg;
      state.toastTimer = 3.2;
    }
    soundSystem.playHeal();
    notifyOrionStateChange();
    return false;
  }

  const [rxStr, ryStr] = wg.room.split(',');
  state.room = wg.room;
  state.rx = Number(rxStr) || 0;
  state.ry = Number(ryStr) || 0;
  state.x = wg.x;
  state.y = wg.y + 18;
  state.z = 0;
  state.vz = 0;
  state.projectiles = [];
  state.pickups = [];
  state.flickerTimer = 0.8;

  syncRoomHierarchyState(state);
  if (!state.discoveredWaygates?.includes(wg.id)) {
    state.discoveredWaygates = [...(state.discoveredWaygates || []), wg.id];
  }

  spawnRoomEnemies(rooms, state);
  soundSystem.playPowerup();
  const msg = `WAYGATE READS ÆTHERIC SIGNATURE -> ${wg.world.toUpperCase()} (${wg.name.toUpperCase()}) · FRAME REPAIRED`;
  if (ctx) ctx.say(msg);
  else {
    state.toastText = msg;
    state.toastTimer = 3.2;
  }
  notifyOrionStateChange();
  return true;
}

export function evaluateCathedralDoorStatus(state: OrionState): {
  canOpen: boolean;
  reason: string;
} {
  const flags = state.flags || {};
  const fragments = Number(flags.grail_fragments || 0);
  const switches = Number(flags.dungeon_switches || 0);
  const trust = Number(flags.town_trust || 0);
  const requiredTrust = flags.bedivere_ring_choice === 'taken' ? 5 : 3;

  if (fragments >= 3) {
    return { canOpen: true, reason: 'BY FORCE (3/3 GRAIL FRAGMENTS)' };
  }
  if (switches >= 3) {
    return { canOpen: true, reason: 'BY EXPLORATION (3/3 HIDDEN SWITCHES)' };
  }
  if (trust >= requiredTrust) {
    return { canOpen: true, reason: `BY TOWN TRUST (${trust}/${requiredTrust})` };
  }

  return {
    canOpen: false,
    reason: `FORCE (${fragments}/3) · SWITCHES (${switches}/3) · TRUST (${trust}/${requiredTrust})`,
  };
}

export function rebootAtSpawnAnchor(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  reasonToast: string
): void {
  state.frame.integrity = state.frame.maxIntegrity || 200;
  state.frame.state = 'Operational';
  state.armor.durability = state.armor.maxDurability;
  state.shields.capacity = state.shields.maxCapacity;
  state.shields.overloaded = false;
  state.heat = 0;
  state.ammo = state.maxAmmo;
  state.isReloading = false;
  state.isFallingIntoPit = false;
  state.isBoosterDashing = false;
  state.onGround = true;

  resetAetherFogGraph(rooms, state);

  const anchor = state.spawnAnchor || { areaId: 'm00_the_bog', room: '-3,0', x: 72, y: 72 };
  const [rxStr, ryStr] = anchor.room.split(',');
  state.areaId = anchor.areaId;
  state.room = anchor.room;
  state.rx = Number(rxStr) || 0;
  state.ry = Number(ryStr) || 0;
  state.x = anchor.x;
  state.y = anchor.y;
  state.z = 0;
  state.vz = 0;

  syncRoomHierarchyState(state);
  ctx.say(reasonToast);
  spawnRoomEnemies(rooms, state);
  syncStateGates(state);
  notifyOrionStateChange();
}

export function checkWorldInteractivePrompt(
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  state.flags = state.flags || {};
  const tx = Math.floor(state.x / TILE_SIZE);
  const ty = Math.floor(state.y / TILE_SIZE);

  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
  const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);

  const roomData = rooms[state.room];
  if (!roomData) {
    state.promptText = null;
    return;
  }

  const currentTile = roomData[ty]?.[tx] || '.';
  const facingTile = roomData[ay]?.[ax] || '.';

  const nearScout = currentTile === 'S' || facingTile === 'S';
  const scoutKey = `scout:${state.room}`;
  if (
    !nearScout &&
    state.lootedCaches[scoutKey] &&
    state.flags.bedivere_ring_choice === 'pending'
  ) {
    state.flags.bedivere_ring_choice = 'left';
    state.toastText = "LEFT BEDIVERE'S SIGNET RING BEHIND";
    state.toastTimer = 2.2;
    notifyOrionStateChange();
  }

  let candidateKey: string | null = null;
  let candidateText: string | null = null;

  const nearbyPoe = state.enemies.find(
    (e) => e.type === 'bog_poe' && Math.hypot(e.x - state.x, e.y - state.y) < 24
  );
  const nearbyCalmNpc = state.enemies.find(
    (e) =>
      e.type === 'town_npc' &&
      e.npcDisposition !== 'feral' &&
      Math.hypot(e.x - state.x, e.y - state.y) < 24
  );

  if (nearbyPoe && state.flags.poe_state !== 'helped') {
    candidateKey = `${state.room}:poe`;
    candidateText = '[A] HELP THE POE';
  } else if (facingTile === 'L' || currentTile === 'L') {
    candidateKey = `${state.room}:lantern`;
    candidateText =
      state.flags.poe_state === 'helped'
        ? 'POE LANTERN (LIT)'
        : '[A] LIGHT POE LANTERN';
  } else if (nearbyCalmNpc) {
    candidateKey = `${state.room}:npc:${nearbyCalmNpc.id}`;
    candidateText = nearbyCalmNpc.isLoyalist
      ? '[A] SPEAK WITH LOYALIST'
      : '[A] TRADE (15 SCRAP)';
  } else if (currentTile === 'D' || facingTile === 'D') {
    candidateKey = `${state.room}:D`;
    candidateText =
      state.room === '-4,0'
        ? '[A] EXIT CHEAT ROOM -> DROP-POD CRATER'
        : '[A] ENTER DROP-POD CHEAT ROOM';
  } else if (currentTile === 'A' || facingTile === 'A') {
    candidateKey = `${state.room}:A`;
    const wsCount = (state.discoveredWaystations || []).filter(
      (id) => id !== 'ws_bog_drop_pod'
    ).length;
    candidateText =
      wsCount > 1
        ? `[A] REST AT CAMPFIRE · TRANSIT (${wsCount} LIT)`
        : '[A] REST AT CAMPFIRE';
  } else if (currentTile === 'Q' || facingTile === 'Q') {
    candidateKey = `${state.room}:Q`;
    candidateText = '[A] STEP INTO WAYGATE';
  } else if (nearScout) {
    candidateKey = `${state.room}:${scoutKey}:${state.flags.bedivere_ring_choice || 'none'}`;
    const tutorialOverride = getTutorialPromptOverride(state, 'S');
    if (!state.lootedCaches[scoutKey]) {
      candidateText = tutorialOverride || '[A] EXAMINE FALLEN KNIGHT';
    } else if (
      !state.flags.bedivere_ring_choice ||
      state.flags.bedivere_ring_choice === 'pending'
    ) {
      candidateText = "[A] TAKE SIGNET RING";
    } else {
      candidateText = null;
    }
  } else if (
    facingTile === 'C' ||
    facingTile === 'V' ||
    currentTile === 'C' ||
    currentTile === 'V'
  ) {
    const isFacingCache = facingTile === 'C' || facingTile === 'V';
    const cx = isFacingCache ? ax : tx;
    const cy = isFacingCache ? ay : ty;
    const tileChar = isFacingCache ? facingTile : currentTile;
    const isChest = tileChar === 'V';
    const looted = isRoomCacheLooted(state, cx, cy);
    candidateKey = `${state.room}:cache:${cx},${cy}:${looted ? 'empty' : 'full'}`;
    if (!looted) {
      candidateText = isChest ? '[A] OPEN CHEST' : '[A] SEARCH CACHE';
    } else {
      candidateText = null;
    }
  } else if (facingTile === '1' || facingTile === '2' || facingTile === '3') {
    if (state.room === '-4,0') {
      candidateKey = `cheat_term:${facingTile}`;
      candidateText =
        facingTile === '1'
          ? `[A] TERMINAL 1: TOGGLE CHEAT MODE (${state.bypassProgressionGates ? 'ON' : 'OFF'})`
          : facingTile === '2'
            ? '[A] TERMINAL 2: UNLOCK ALL WEAPONS & MODS'
            : '[A] TERMINAL 3: GRANT +5 ALL GEMS & +200 SCRAP';
    } else {
      const switchKey = `switch:${state.room}:${facingTile}`;
      candidateKey = switchKey;
      candidateText = state.lootedCaches[switchKey]
        ? null
        : `[A] PULL SWITCH`;
    }
  } else if (facingTile === '!' || currentTile === '!') {
    if (state.room === '-4,0') {
      candidateKey = 'cheat_term:warp';
      candidateText = '[A] TERMINAL 4: WARP TO BOG / CAMPFIRE / LANTERN / TOWN';
    } else {
      const lx = facingTile === '!' ? ax : tx;
      const ly = facingTile === '!' ? ay : ty;
      const toggleKey = `switch:${state.room}:toggle:${lx},${ly}`;
      candidateKey = `${toggleKey}:${state.lootedCaches[toggleKey] ? 'on' : 'off'}`;
      candidateText = '[A] PULL LEVER';
    }
  } else if (facingTile === 'G' || currentTile === 'G') {
    if (state.flags.orc_raid_active) {
      candidateKey = `${state.room}:gate:raid`;
      candidateText = 'GATE SEALED';
    } else if (!state.unlockedGates[state.room]) {
      candidateKey = `${state.room}:gate`;
      const hasKey = state.inventorySlots.some((s) => s.itemId === 'rusted_gate_key');
      const poeResolved = Boolean(state.flags.bog_exit_revealed);
      candidateText =
        hasKey || poeResolved
          ? '[A] UNSEAL GATE'
          : 'GATE SEALED';
    }
  } else if (facingTile === 'M' || currentTile === 'M') {
    if (!state.flags.cathedral_door_open) {
      candidateKey = `${state.room}:cathedral_door`;
      const status = evaluateCathedralDoorStatus(state);
      candidateText = status.canOpen
        ? '[A] OPEN DUNGEON DOOR'
        : 'DUNGEON DOOR SEALED';
    }
  } else if (
    (currentTile === '~' || facingTile === '~') &&
    Number(state.flags.bedivere_list_items || 0) >= 3 &&
    !state.flags.lady_of_the_lake_defeated &&
    !state.enemies.some((e) => e.type === 'lady_of_the_lake')
  ) {
    candidateKey = `${state.room}:lady_of_the_lake`;
    candidateText = '[A] DISTURB THE BOG WATERS';
  }

  if (candidateKey && candidateText) {
    const cleanPrompt = candidateText.replace(/^\[A\]\s*/i, '');
    if (state.dismissedPromptKey === candidateKey) {
      state.promptText = null;
      return;
    }
    const prevKey = state.flags.__active_prompt_key;
    if (prevKey !== candidateKey) {
      state.flags.__active_prompt_key = candidateKey;
      state.flags.__active_prompt_t = state.t;
    }
    const elapsed = state.t - Number(state.flags.__active_prompt_t || state.t);
    if (elapsed > 2.6) {
      state.promptText = null;
    } else {
      state.promptText = cleanPrompt;
    }
  } else {
    state.promptText = null;
    state.dismissedPromptKey = null;
    if (state.flags.__active_prompt_key) {
      state.flags.__active_prompt_key = '';
    }
  }
}

export function executeWorldInteraction(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext
): boolean {
  state.flags = state.flags || {};
  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const ax = Math.floor((state.x + dirInfo.dx * 12) / TILE_SIZE);
  const ay = Math.floor((state.y + dirInfo.dy * 12) / TILE_SIZE);
  const tx = Math.floor(state.x / TILE_SIZE);
  const ty = Math.floor(state.y / TILE_SIZE);

  const roomData = rooms[state.room];
  if (!roomData) return false;

  const currentTile = roomData[ty]?.[tx] || '.';
  const facingTile = roomData[ay]?.[ax] || '.';

  const nearbyPoe = state.enemies.find(
    (e) => e.type === 'bog_poe' && Math.hypot(e.x - state.x, e.y - state.y) < 24
  );
  if (
    (nearbyPoe && state.flags.poe_state !== 'helped') ||
    ((facingTile === 'L' || currentTile === 'L') && state.flags.poe_state !== 'helped')
  ) {
    state.flags.poe_state = 'helped';
    state.flags.poe_lantern_gift = true;
    state.flags.bog_exit_revealed = true;
    if (state.level < 2) {
      state.level = 2;
    }
    unlockLevel2SecondaryWeapon(state);
    addOrionInventoryItem(state, 'poe_lantern_charm', 1);
    for (const e of state.enemies) {
      if (e.type === 'bog_wurm') e.isSubmerged = false;
    }
    syncStateGates(state);
    soundSystem.playPowerup();
    ctx.say('THE POE LANTERN IS LIT');
    notifyOrionStateChange();
    return true;
  }

  const nearbyCalmNpc = state.enemies.find(
    (e) =>
      e.type === 'town_npc' &&
      e.npcDisposition !== 'feral' &&
      Math.hypot(e.x - state.x, e.y - state.y) < 24
  );
  if (nearbyCalmNpc) {
    if (nearbyCalmNpc.isLoyalist) {
      if (state.flags.bedivere_ring_choice === 'taken') {
        nearbyCalmNpc.npcDisposition = 'feral';
        nearbyCalmNpc.faction = 'hostile';
        soundSystem.playMenuBeep();
        ctx.say('LOYALIST: "YOU ROBBED BEDIVERE’S CORPSE! DIE, GRAVE ROBBER!"');
      } else {
        soundSystem.playSelect();
        if (!state.lootedCaches[`npc_gift:${nearbyCalmNpc.id}`]) {
          state.lootedCaches[`npc_gift:${nearbyCalmNpc.id}`] = true;
          addOrionInventoryItem(state, 'repair_kit', 1);
          const giftedHeater = unlockEquipmentItem(state, 'heater_shield');
          ctx.say(
            giftedHeater
              ? 'LOYALIST: "YOU HONORED BEDIVERE. TAKE THIS HEATER SHIELD & FIELD PATCH!"'
              : 'LOYALIST: "YOU HONORED BEDIVERE. TAKE THIS FIELD PATCH."'
          );
        } else {
          ctx.say('LOYALIST: "MAY AVALON GUARD YOUR CHASSIS, PILOT."');
        }
      }
    } else {
      if (state.salvageScrap >= 15) {
        state.salvageScrap -= 15;
        addOrionInventoryItem(state, 'repair_kit', 1);
        const scavGearPool = ['buckler_shield', 'hand_axe', 'quiver', 'great_bow'];
        const nextGear = scavGearPool.find((id) => !isEquipmentUnlocked(state, id));
        if (nextGear) {
          unlockEquipmentItem(state, nextGear);
          const gName = getWeaponDefinition(nextGear)?.name || nextGear.toUpperCase();
          soundSystem.playPowerup();
          ctx.say(`TRADED 15 SCRAP: REPAIR KIT + SALVAGED ${gName.toUpperCase()} UNLOCKED!`);
        } else {
          soundSystem.playCoin();
          ctx.say('TRADED 15 SCRAP FOR FIELD REPAIR KIT');
        }
      } else {
        soundSystem.playMenuBeep();
        ctx.say('SCAVENGER: "15 SCRAP FOR A REPAIR KIT & SALVAGED HARDPOINT GEAR, PILOT."');
      }
    }
    notifyOrionStateChange();
    return true;
  }

  // Drop-Pod ('D') is exclusively the Cheat Room Door (no waystation or respawn responsibility)
  if (currentTile === 'D' || facingTile === 'D') {
    if (state.room === '-4,0') {
      state.room = '-3,0';
      state.rx = -3;
      state.ry = 0;
      state.x = 72;
      state.y = 72;
      state.z = 0;
      state.vz = 0;
      state.projectiles = [];
      state.pickups = [];
      syncRoomHierarchyState(state);
      spawnRoomEnemies(rooms, state);
      soundSystem.playSelect();
      ctx.say('EXITED DROP-POD CHEAT ROOM');
      notifyOrionStateChange();
      return true;
    } else {
      state.room = '-4,0';
      state.rx = -4;
      state.ry = 0;
      state.x = 72;
      state.y = 104;
      state.z = 0;
      state.vz = 0;
      state.projectiles = [];
      state.pickups = [];
      state.enemies = [];
      syncRoomHierarchyState(state);
      soundSystem.playPowerup();
      ctx.say('ENTERED DROP-POD CHEAT ROOM · DEV CONSOLES & SATCHEL UNLOCKED');
      notifyOrionStateChange();
      return true;
    }
  }

  // Campfires ('A') move the player's Spawn Anchor, repair the frame, and handle Waystation transit
  if (currentTile === 'A' || facingTile === 'A') {
    syncRoomHierarchyState(state);
    const areaDef = getAreaDefinition(state.areaId);
    const currentWsId = areaDef.waystation?.id;
    state.discoveredWaystations = (state.discoveredWaystations || []).filter(
      (id) => id !== 'ws_bog_drop_pod'
    );
    if (currentWsId && !state.discoveredWaystations.includes(currentWsId)) {
      state.discoveredWaystations.push(currentWsId);
    }

    // Resting at a Campfire resets all ephemeral general/side/loop/end fog nodes
    resetAetherFogGraph(rooms, state);

    state.spawnAnchor = {
      areaId: state.areaId,
      room: state.room,
      x: Math.round(state.x),
      y: Math.round(state.y),
    };
    state.frame.integrity = state.frame.maxIntegrity || 200;
    state.frame.state = 'Operational';
    state.armor.durability = state.armor.maxDurability;
    state.shields.capacity = state.shields.maxCapacity;
    state.shields.overloaded = false;
    state.heat = 0;
    state.ammo = state.maxAmmo;
    state.isReloading = false;
    saveOrionGame(state);

    const discovered = state.discoveredWaystations.filter((wsId) => {
      const wsNode = WAYSTATION_REGISTRY[wsId];
      const wsArea = wsNode ? AREA_REGISTRY[wsNode.areaId] : undefined;
      return wsArea?.specStatus !== 'UNDEFINED';
    });
    if (discovered.length > 1 && currentWsId) {
      const idx = discovered.indexOf(currentWsId);
      const nextWsId = discovered[(idx + 1) % discovered.length];
      if (nextWsId && nextWsId !== currentWsId) {
        return fastTravelToWaystation(rooms, state, nextWsId, ctx);
      }
    }

    soundSystem.playHeal();
    ctx.say(`RESTED AT ${areaDef.waystation?.name?.toUpperCase() || 'CAMPFIRE'} · SPAWN MOVED`);
    notifyOrionStateChange();
    return true;
  }

  if (currentTile === 'Q' || facingTile === 'Q') {
    syncRoomHierarchyState(state);
    const allWaygates = Object.values(WAYGATE_REGISTRY);
    for (const wg of allWaygates) {
      if (!state.discoveredWaygates?.includes(wg.id)) {
        state.discoveredWaygates = [...(state.discoveredWaygates || []), wg.id];
      }
    }
    const targetWaygateId =
      state.regionId === 'region_tyrranus_frontier'
        ? 'wg_camelot_sanctum'
        : 'wg_tyrranus_colonnade';
    return fastTravelViaWaygate(rooms, state, targetWaygateId, ctx);
  }

  if (facingTile === 'S' || currentTile === 'S') {
    const scoutKey = `scout:${state.room}`;
    if (!state.lootedCaches[scoutKey]) {
      state.lootedCaches[scoutKey] = true;
      state.hasBoosterKit = true;
      if (state.level < 2) {
        state.level = 2;
      }
      unlockLevel2SecondaryWeapon(state);
      unlockEquipmentItem(state, 'khopesh');
      addOrionInventoryItem(state, 'bedivere_list', 1);
      addOrionInventoryItem(state, 'repair_kit', 1);
      setOrionFlag(state, 'scout_salvaged', true);
      state.flags.bedivere_list_collected = true;
      state.flags.bedivere_ring_choice = 'pending';
      if (state.tutorialActive) {
        state.tutorialStep = 'traverse_sinkhole';
      }
      syncStateGates(state);
      soundSystem.playPowerup();
      ctx.say('SALVAGED KHOPESH & BEDIVERE’S LIST');
      notifyOrionStateChange();
      return true;
    } else if (state.flags.bedivere_ring_choice === 'pending') {
      state.flags.bedivere_ring_choice = 'taken';
      addOrionInventoryItem(state, 'bedivere_ring', 1);
      soundSystem.playCoin();
      ctx.say("TOOK BEDIVERE'S SIGNET RING");
      notifyOrionStateChange();
      return true;
    }
  }

  if (
    facingTile === 'C' ||
    facingTile === 'V' ||
    currentTile === 'C' ||
    currentTile === 'V'
  ) {
    const isFacingCache = facingTile === 'C' || facingTile === 'V';
    const cx = isFacingCache ? ax : tx;
    const cy = isFacingCache ? ay : ty;
    if (!isRoomCacheLooted(state, cx, cy)) {
      markRoomCacheLooted(state, cx, cy);
      soundSystem.playPowerup();

      const cacheDef = ORION_CACHE_DEFINITIONS[state.room] || ORION_CACHE_DEFINITIONS.default;
      state.salvageScrap += cacheDef.scrap;
      for (const item of cacheDef.items) {
        addOrionInventoryItem(state, item.itemId, item.count);
      }
      const traitGemByLine: Record<string, [string, string]> = {
        Warrior: ['spinel', 'hematite'],
        Marauder: ['carnelian', 'hematite'],
        Guardian: ['titanite', 'moonstone'],
        Cleric: ['demantoid', 'moonstone'],
        Wizard: ['kyanite', 'rubellite'],
        Rogue: ['charoite', 'rubellite'],
      };
      const [traitGem, reactorGem] = traitGemByLine[state.traitLine] || ['spinel', 'hematite'];
      addOrionInventoryItem(state, traitGem, 1);
      addOrionInventoryItem(state, reactorGem, 1);

      // Unlock a salvageable world weapon/shield/quiver from the cache pool
      const cacheWeaponOrder = [
        'short_spear',
        'buckler_shield',
        'hand_axe',
        'mace',
        'heater_shield',
        'great_bow',
        'quiver',
        'long_sword',
      ];
      const unlockedGearId = cacheWeaponOrder.find((wId) => !isEquipmentUnlocked(state, wId));
      let gearSuffix = '';
      if (unlockedGearId) {
        unlockEquipmentItem(state, unlockedGearId);
        const gearName = getWeaponDefinition(unlockedGearId)?.name || unlockedGearId;
        gearSuffix = ` · ${gearName.toUpperCase()}`;
      }

      if (Number(state.flags.bedivere_list_items || 0) < 3) {
        state.flags.bedivere_list_items = Number(state.flags.bedivere_list_items || 0) + 1;
        addOrionInventoryItem(state, 'bedivere_relic', 1);
      }
      ctx.say(`${cacheDef.toast}${gearSuffix}`);
      notifyOrionStateChange();
      return true;
    }
  }

  if (facingTile === '1' || facingTile === '2' || facingTile === '3') {
    if (state.room === '-4,0') {
      if (facingTile === '1') {
        state.bypassProgressionGates = !state.bypassProgressionGates;
        if (state.bypassProgressionGates) {
          state.hasBoosterKit = true;
          unlockLevel2SecondaryWeapon(state);
        }
        syncStateGates(state);
        soundSystem.playPowerup();
        ctx.say(
          state.bypassProgressionGates
            ? 'CHEAT ROOM MODE ENABLED · DEV UI & GATE BYPASS ACTIVE'
            : 'CHEAT ROOM MODE SET TO STRICT PLAYER PROGRESSION'
        );
        notifyOrionStateChange();
        return true;
      }
      if (facingTile === '2') {
        for (const w of Object.values(WEAPON_REGISTRY)) {
          unlockEquipmentItem(state, w.id);
        }
        if (state.equipmentSlots) {
          state.equipmentSlots.unlockedMods = ACTION_MODIFICATION_CATALOG.map((m) => m.id);
        }
        syncStateGates(state);
        soundSystem.playPowerup();
        ctx.say('UNLOCKED ALL WEAPONS, SHIELDS & ACTION MODS');
        notifyOrionStateChange();
        return true;
      }
      if (facingTile === '3') {
        for (const g of GEMSTONE_CATALOG) {
          refundInventoryGem(state, g.id, 5);
        }
        state.salvageScrap += 200;
        for (const id of [
          'repair_kit',
          'grail_water',
          'rusted_gate_key',
          'poe_lantern_charm',
          'bedivere_list',
          'bedivere_ring',
        ]) {
          addOrionInventoryItem(state, id, 1);
        }
        soundSystem.playPowerup();
        ctx.say('GRANTED +5 ALL GEMSTONES, +200 SCRAP & RELIC KEYS');
        notifyOrionStateChange();
        return true;
      }
    }

    const switchKey = `switch:${state.room}:${facingTile}`;
    if (!state.lootedCaches[switchKey]) {
      state.lootedCaches[switchKey] = true;
      state.flags[`${switchKey}:anim_t`] = state.t;
      state.flags[`${switchKey}:anim_dir`] = '123';
      const curSwitches = Math.min(3, Number(state.flags.dungeon_switches || 0) + 1);
      state.flags.dungeon_switches = curSwitches;
      soundSystem.playPowerup();
      ctx.say(`SWITCH PULLED (${curSwitches}/3)`);
      notifyOrionStateChange();
      return true;
    }
  }

  if (facingTile === '!' || currentTile === '!') {
    if (state.room === '-4,0') {
      const warpTargets = [
        { room: '0,0', x: 72, y: 80, label: 'FIRST CAMPFIRE (3 ROOMS FROM POD)' },
        { room: '0,-2', x: 72, y: 80, label: 'POE LANTERN SANCTUARY (5 ROOMS FROM POD)' },
        { room: '3,0', x: 72, y: 72, label: 'MAIN BOG ENTRANCE (6 ROOMS FROM POD)' },
        { room: '4,0', x: 72, y: 72, label: 'CAMELOT BORDER TOWN' },
      ];
      const nextIdx = (Number(state.flags.cheat_warp_idx || 0) % warpTargets.length);
      state.flags.cheat_warp_idx = nextIdx + 1;
      const dest = warpTargets[nextIdx];
      const [rxStr, ryStr] = dest.room.split(',');
      state.room = dest.room;
      state.rx = Number(rxStr) || 0;
      state.ry = Number(ryStr) || 0;
      state.x = dest.x;
      state.y = dest.y;
      state.z = 0;
      state.vz = 0;
      syncRoomHierarchyState(state);
      spawnRoomEnemies(rooms, state);
      soundSystem.playPowerup();
      ctx.say(`CHEAT WARP -> ${dest.label}`);
      notifyOrionStateChange();
      return true;
    }

    const lx = facingTile === '!' ? ax : tx;
    const ly = facingTile === '!' ? ay : ty;
    const toggleKey = `switch:${state.room}:toggle:${lx},${ly}`;
    const nextActive = !state.lootedCaches[toggleKey];
    state.lootedCaches[toggleKey] = nextActive;
    state.flags[`${toggleKey}:anim_t`] = state.t;
    state.flags[`${toggleKey}:anim_dir`] = nextActive ? '123' : '321';
    state.flags[`desync_lock:${state.room}`] = nextActive;
    soundSystem.playSelect();
    ctx.say(
      nextActive
        ? 'BARRIERS PHASE-LOCKED OPEN'
        : 'BARRIERS RESTORED'
    );
    notifyOrionStateChange();
    return true;
  }

  if (facingTile === 'G' || currentTile === 'G') {
    if (state.flags.orc_raid_active) {
      soundSystem.playMenuBeep();
      ctx.say('EXIT SEALED UNTIL ORC RAID IS DEALT WITH!');
      return true;
    }
    if (state.unlockedGates[state.room]) return false;

    const keySlotIndex = state.inventorySlots.findIndex((s) => s.itemId === 'rusted_gate_key');
    const poeResolved = Boolean(state.flags.bog_exit_revealed);

    if (keySlotIndex >= 0 || poeResolved) {
      if (keySlotIndex >= 0) {
        state.inventorySlots[keySlotIndex].count -= 1;
        if (state.inventorySlots[keySlotIndex].count <= 0) {
          state.inventorySlots.splice(keySlotIndex, 1);
        }
      }
      state.unlockedGates[state.room] = true;
      state.clearedRooms[state.room] = true;

      const curRoom = rooms[state.room];
      if (curRoom) {
        rooms[state.room] = curRoom.map((r) => r.replace(/G/g, '.'));
      }

      soundSystem.playPowerup();
      ctx.say('BOG PERIMETER GATE UNSEALED · BORDER TOWN ACCESS');
      notifyOrionStateChange();
      return true;
    } else {
      soundSystem.playMenuBeep();
      ctx.say('BOG EXIT HIDDEN: DEAL WITH THE POE OR DEFEAT GUARDIAN');
      return true;
    }
  }

  if (facingTile === 'M' || currentTile === 'M') {
    const status = evaluateCathedralDoorStatus(state);
    if (status.canOpen) {
      state.flags.cathedral_door_open = true;
      state.unlockedGates[`${state.room}:M`] = true;
      addOrionInventoryItem(state, 'dungeon_key', 1);
      const curRoom = rooms[state.room];
      if (curRoom) {
        rooms[state.room] = curRoom.map((r) => r.replace(/M/g, '.'));
      }
      soundSystem.playPowerup();
      ctx.say(
        `DUNGEON ENTRANCE OPENED (${status.reason}) · CAMELOT WAYGATE KEY ACQUIRED! [DEEP DUNGEON OD-BT-01 SEALED]`
      );
      notifyOrionStateChange();
      return true;
    } else {
      soundSystem.playMenuBeep();
      ctx.say(`DUNGEON ENTRANCE SEALED: NEED ${status.reason}`);
      return true;
    }
  }

  if (
    (currentTile === '~' || facingTile === '~') &&
    Number(state.flags.bedivere_list_items || 0) >= 3 &&
    !state.flags.lady_of_the_lake_defeated
  ) {
    return awakenLadyOfTheLake(state, ctx);
  }

  return false;
}

export function handleWorldRoomTransition(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext
): void {
  const { widthPx: roomW, heightPx: roomH } = getRoomDimensions(rooms[state.room]);

  if (state.x >= roomW) {
    transitionViaAetherDoor(rooms, state, 'E', ctx);
  } else if (state.x < 0) {
    transitionViaAetherDoor(rooms, state, 'W', ctx);
  } else if (state.y < 0) {
    transitionViaAetherDoor(rooms, state, 'N', ctx);
  } else if (state.y >= roomH) {
    transitionViaAetherDoor(rooms, state, 'S', ctx);
  }
}
