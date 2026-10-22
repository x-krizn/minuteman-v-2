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
  isEquipmentUnlocked,
  unlockEquipmentItem,
  unlockLevel2SecondaryWeapon,
} from '../database/progression';
import { getWeaponDefinition } from '../database/weapons';
import {
  addOrionInventoryItem,
  getTutorialPromptOverride,
  handleTutorialAnchorInteraction,
  notifyOrionStateChange,
  saveOrionGame,
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
  '0,0': {
    E: { targetKeyCoord: '1,0', routeTotal: 1 },
    S: { targetKeyCoord: '0,1', routeTotal: 1 },
  },
  '1,0': {
    W: { targetKeyCoord: '0,0', routeTotal: 1 },
    N: { targetKeyCoord: '1,-1', routeTotal: 0, isDirectEndNode: true },
    E: { targetKeyCoord: '2,0', routeTotal: 2 },
    S: { targetKeyCoord: '1,1', routeTotal: 1 },
  },
  '2,0': {
    W: { targetKeyCoord: '1,0', routeTotal: 2 },
    E: { targetKeyCoord: '3,0', routeTotal: 1 },
    S: { targetKeyCoord: '2,1', routeTotal: 1 },
  },
  '2,1': {
    N: { targetKeyCoord: '2,0', routeTotal: 1 },
  },
  '3,0': {
    W: { targetKeyCoord: '2,0', routeTotal: 1 },
    E: { targetKeyCoord: '4,0', routeTotal: 2 },
    S: { targetKeyCoord: '3,1', routeTotal: 1 },
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

    const isSecretEndRoom = coord === '1,-1' || localRoom.nodeType === 'end';
    const nodeType: AetherNodeType = isSecretEndRoom ? 'end' : localRoom.nodeType || 'key';
    const openDirs: AetherCardinalDir[] = isSecretEndRoom ? ['S'] : ALL_CARDINAL_DIRS;
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
          const title = slot.title || `${mapDef.name} — ${template.title}`;
          const bannerTitle =
            slot.bannerTitle || `${areaDef.name.toUpperCase()} · ${title.toUpperCase()}`;

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

export const ORION_INITIAL_ROOMS = ORION_TUTORIAL_ROOMS;

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

      nodes[coord] = {
        id: coord,
        nodeType: isEnd ? 'end' : meta.nodeType === 'general' ? 'general' : 'key',
        coord,
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
      activeNodeId: state.room || '0,0',
      loopDepth: 0,
      nodes,
    };
  }

  if (!state.fogGraph.nodes[state.room]) {
    const fallbackMeta = ORION_ROOM_METADATA[state.room] || ORION_ROOM_METADATA['0,0'];
    state.fogGraph.nodes[state.room] = {
      id: state.room,
      nodeType: fallbackMeta?.nodeType || 'key',
      coord: state.room,
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
  return graph.nodes[state.room] || graph.nodes['0,0'];
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
  hashVal: number
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

  // Loop nodes have eerie shifting Aether pools and Poe lantern echoes
  if (nodeType === 'loop' && matrix[midY]) {
    matrix[midY][midX - 1] = '~';
    matrix[midY][midX] = '~';
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
  }
): AetherGraphNode {
  const graph = ensureAetherFogGraph(state);
  const counter = graph.nextCounter++;
  const hashVal = deterministicHash(graph.seed, counter, moveDir.charCodeAt(0));

  const id = `fog:${nodeType}:${counter}`;
  const returnDir = getOppositeCardinalDir(moveDir);

  const templates = Object.values(GLOBAL_ROOM_REGISTRY);
  const chosenTemplate =
    templates[hashVal % Math.max(1, templates.length)] || ROOM_REGISTRY['0,1'] || ROOM_REGISTRY['0,0'];

  const inheritedBiomeId =
    nodeType === 'loop'
      ? 'global_aether_caverns'
      : parentNode.biomeId || state.biomeId || chosenTemplate?.biomeId || 'belldor_bog';

  let trueExitDir: AetherCardinalDir | undefined;
  let endFeature: AetherEndFeature | undefined;
  let openDirs: AetherCardinalDir[] = ALL_CARDINAL_DIRS;
  let title = chosenTemplate?.title || 'Drifting Sector';
  let bannerTitle = '';

  if (nodeType === 'general') {
    const step = options?.routeStep ?? 1;
    const total = options?.routeTotal ?? 2;
    trueExitDir = pickTrueExitDir(moveDir, moveDir, hashVal);
    const targetMeta =
      (options?.targetKeyCoord && ORION_ROOM_METADATA[options.targetKeyCoord]) || undefined;
    const destLabel = targetMeta ? targetMeta.title.toUpperCase() : 'KEY POINT OF INTEREST';
    title = `Æther Path (${step}/${total}) — ${chosenTemplate?.title || 'Corridor'}`;
    bannerTitle = `GENERAL NODE (${step}/${total}) · PATH TO ${destLabel}`;
  } else if (nodeType === 'side') {
    trueExitDir = pickTrueExitDir(moveDir, moveDir, hashVal + 1);
    title = `Off-Path Branch — ${chosenTemplate?.title || 'Wilds'}`;
    bannerTitle = `SIDE NODE · OFF-PATH BRANCH (NO ROUTE PROGRESS)`;
  } else if (nodeType === 'end') {
    openDirs = [returnDir];
    trueExitDir = returnDir;
    const features: AetherEndFeature[] = ['loot_cache', 'mini_boss', 'secret_switch', 'dead_end'];
    endFeature = features[hashVal % features.length];
    const featureLabels: Record<AetherEndFeature, string> = {
      loot_cache: 'SCAVENGER SUPPLY VAULT',
      mini_boss: 'FOG MINI-BOSS LAIR',
      secret_switch: 'ANCIENT GRAIL SHRINE',
      dead_end: 'CALCIFIED MIST DEAD-END',
    };
    title = `Fog Cul-de-Sac — ${featureLabels[endFeature]}`;
    bannerTitle = `END NODE · ${featureLabels[endFeature]}`;
  } else if (nodeType === 'loop') {
    trueExitDir = pickTrueExitDir(moveDir, returnDir, hashVal + 3);
    title = `Shifting Æther Mist`;
    bannerTitle = `LOOP NODE · LOST IN THE ÆTHER FOG`;
  }

  const grid = decorateDynamicRoomGrid(
    chosenTemplate?.grid || ROOM_REGISTRY['0,0'].grid,
    nodeType,
    openDirs,
    trueExitDir,
    endFeature,
    hashVal
  );

  const newNode: AetherGraphNode = {
    id,
    nodeType,
    coord: parentNode.coord,
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
    parentNodeId: parentNode.id,
    edges: {
      [returnDir]: parentNode.id,
    },
    endFeature,
    grid,
  };

  if (nodeType === 'loop' && trueExitDir) {
    // In a loop node, only `trueExitDir` escapes back to the parent node; other exits cycle in the fog.
    newNode.edges = {
      [trueExitDir]: parentNode.id,
    };
  }

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

function resolveNextAetherNode(
  rooms: Record<string, string[]>,
  state: OrionState,
  currentNode: AetherGraphNode,
  dir: AetherCardinalDir
): { targetNode: AetherGraphNode; isLoopCycle: boolean; escapedLoop: boolean } {
  const graph = ensureAetherFogGraph(state);

  // 1. If edge is already resolved in the current session, follow it
  const existingTargetId = currentNode.edges[dir];
  if (existingTargetId && graph.nodes[existingTargetId] && rooms[existingTargetId]) {
    const targetNode = graph.nodes[existingTargetId];
    const escapedLoop = currentNode.nodeType === 'loop' && targetNode.nodeType !== 'loop';
    const isLoopCycle = currentNode.nodeType === 'loop' && targetNode.nodeType === 'loop';
    return { targetNode, isLoopCycle, escapedLoop };
  }

  // 2. Inside a LOOP node: `trueExitDir` escapes to parent; all other exits silently cycle between loop nodes
  if (currentNode.nodeType === 'loop') {
    if (dir === currentNode.trueExitDir && currentNode.parentNodeId) {
      const escapeTarget = graph.nodes[currentNode.parentNodeId] || graph.nodes['0,0'];
      currentNode.edges[dir] = escapeTarget.id;
      return { targetNode: escapeTarget, isLoopCycle: false, escapedLoop: true };
    }

    // Create or cycle into a paired sibling loop node that shares the same escape anchor
    const escapeAnchorNode =
      (currentNode.parentNodeId && graph.nodes[currentNode.parentNodeId]) || currentNode;
    const siblingLoop = createDynamicAetherNode(rooms, state, escapeAnchorNode, dir, 'loop', {
      sourceKeyCoord: currentNode.sourceKeyCoord,
      targetKeyCoord: currentNode.targetKeyCoord,
      routeStep: currentNode.routeStep,
      routeTotal: currentNode.routeTotal,
    });
    // Wire silent cycle between the two loop chunks
    currentNode.edges[dir] = siblingLoop.id;
    const oppDir = getOppositeCardinalDir(dir);
    if (siblingLoop.trueExitDir !== oppDir) {
      siblingLoop.edges[oppDir] = currentNode.id;
    }
    return { targetNode: siblingLoop, isLoopCycle: true, escapedLoop: false };
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
    const route = KEY_NODE_ROUTES[currentNode.coord]?.[dir];
    if (route) {
      const sealReason = getUndefinedZoneSealReason(route.targetKeyCoord);
      if (sealReason) {
        const sealedLoop = createDynamicAetherNode(rooms, state, currentNode, dir, 'loop', {
          sourceKeyCoord: currentNode.coord,
          targetKeyCoord: route.targetKeyCoord,
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
        sourceKeyCoord: currentNode.coord,
        targetKeyCoord: route.targetKeyCoord,
        routeStep: 1,
        routeTotal: route.routeTotal,
      });
      currentNode.edges[dir] = genNode.id;
      return { targetNode: genNode, isLoopCycle: false, escapedLoop: false };
    }

    // Unmapped open border on a KEY node -> dynamically spawns a SIDE node or LOOP node
    const borderHash = deterministicHash(
      graph.seed,
      graph.nextCounter,
      currentNode.coord.charCodeAt(0) + dir.charCodeAt(0)
    );
    const branchType: AetherNodeType = borderHash % 3 === 0 ? 'loop' : 'side';
    const branchNode = createDynamicAetherNode(rooms, state, currentNode, dir, branchType, {
      sourceKeyCoord: currentNode.coord,
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
  // `trueExitDir` leads to a rewarding END node; off-path exits lead into a LOOP node!
  const targetType: AetherNodeType = dir === currentNode.trueExitDir ? 'end' : 'loop';
  const childNode = createDynamicAetherNode(rooms, state, currentNode, dir, targetType, {
    sourceKeyCoord: currentNode.sourceKeyCoord,
    targetKeyCoord: currentNode.targetKeyCoord,
    routeStep: currentNode.routeStep,
    routeTotal: currentNode.routeTotal,
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
  const prevRoomGrid = rooms[state.room];
  const departureDoor = getRoomDoorwayCenterPx(prevRoomGrid, dir);

  const { targetNode, isLoopCycle, escapedLoop } = resolveNextAetherNode(
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

  const [rxStr, ryStr] = targetNode.coord.split(',');
  if (!isLoopCycle) {
    if (dir === 'E') state.rx = (Number(rxStr) || state.rx) + (targetNode.nodeType === 'key' ? 0 : 1);
    else if (dir === 'W') state.rx = (Number(rxStr) || state.rx) - (targetNode.nodeType === 'key' ? 0 : 1);
    else if (dir === 'S') state.ry = (Number(ryStr) || state.ry) + (targetNode.nodeType === 'key' ? 0 : 1);
    else if (dir === 'N') state.ry = (Number(ryStr) || state.ry) - (targetNode.nodeType === 'key' ? 0 : 1);
  }
  if (targetNode.nodeType === 'key') {
    state.rx = Number(rxStr) || 0;
    state.ry = Number(ryStr) || 0;
  }

  state.room = targetNode.id;
  graph.activeNodeId = targetNode.id;

  if (targetNode.nodeType === 'loop') {
    graph.loopDepth = (graph.loopDepth || 0) + 1;
    state.flickerTimer = 0.35;
  } else {
    graph.loopDepth = 0;
  }

  state.projectiles = [];
  state.pickups = [];

  const prevRegionId = state.regionId;
  const prevAreaId = state.areaId;
  syncRoomHierarchyState(state);

  spawnRoomEnemies(rooms, state);
  spawnDynamicNodeFeatures(rooms, state, targetNode);

  soundSystem.playSelect();
  const info = getRoomWorldInfo(state);

  let toastMsg = info.bannerTitle;
  if (isLoopCycle) {
    toastMsg = targetNode.bannerTitle.startsWith('SEALED BY ÆTHER FOG')
      ? `${targetNode.bannerTitle} · REDIRECTED TO FOG LOOP`
      : `LOST IN ÆTHER FOG (LOOP DEPTH ${graph.loopDepth}) · FOLLOW THE TELL`;
  } else if (escapedLoop) {
    toastMsg = `ÆTHER FOG CLEARED · RETURNED TO ${info.roomTitle.toUpperCase()}`;
  } else if (state.regionId !== prevRegionId) {
    toastMsg = `REGION ENTERED: ${info.regionName.toUpperCase()} · ${info.bannerTitle}`;
  } else if (state.areaId !== prevAreaId) {
    toastMsg = `AREA ENTERED: ${info.areaName.toUpperCase()} · ${info.bannerTitle}`;
  }

  if (ctx) {
    ctx.say(toastMsg);
  } else {
    state.toastText = toastMsg;
    state.toastTimer = 2.6;
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
  const period = Math.max(1.0, biome.tileRules?.desyncPeriodSec || 3.5);
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
  const isBiomeCorrosive = biome.tileRules?.corrosiveWater ?? true;
  const corrosionRate = biome.tileRules?.corrosiveDamagePerSec ?? 5.0;

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

  state.discoveredWaystations = state.discoveredWaystations || ['ws_bog_drop_pod'];
  state.discoveredWaygates = state.discoveredWaygates || [];

  if (
    areaDef.waystation &&
    areaDef.waystation.room === state.room &&
    !state.discoveredWaystations.includes(areaDef.waystation.id)
  ) {
    state.discoveredWaystations.push(areaDef.waystation.id);
  }

  if (
    regionDef.waygate &&
    regionDef.waygate.room === state.room &&
    !state.discoveredWaygates.includes(regionDef.waygate.id)
  ) {
    state.discoveredWaygates.push(regionDef.waygate.id);
  }
}

export function getRoomWorldInfo(state: OrionState): {
  roomTitle: string;
  roomScope: 'global' | 'local';
  nodeType: AetherNodeType;
  trueExitDir?: AetherCardinalDir;
  routeStep?: number;
  routeTotal?: number;
  loopDepth: number;
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

  return {
    roomTitle: activeNode?.title || meta?.title || `Sector [${state.rx}, ${state.ry}]`,
    roomScope: meta?.scope || 'local',
    nodeType: activeNode?.nodeType || meta?.nodeType || 'key',
    trueExitDir: activeNode?.trueExitDir || meta?.trueExitDir,
    routeStep: activeNode?.routeStep ?? meta?.routeStep,
    routeTotal: activeNode?.routeTotal ?? meta?.routeTotal,
    loopDepth: graph.loopDepth || 0,
    endFeature: activeNode?.endFeature || meta?.endFeature,
    bannerTitle:
      activeNode?.bannerTitle ||
      meta?.bannerTitle ||
      `${areaDef.name.toUpperCase()} [${state.rx},${state.ry}]`,
    mapName: mapDef?.name || 'Bog Sector',
    mapScope: mapDef?.scope || 'local',
    areaName: areaDef.name,
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

  spawnRoomEnemies(rooms, state);
  soundSystem.playPowerup();
  const msg = `ÆTHER WAYSTATION TRANSIT -> ${ws.name.toUpperCase()} · FOG GRAPH RESET`;
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

  const targetArea = AREA_REGISTRY[wg.areaId];
  if (targetArea?.specStatus === 'UNDEFINED') {
    const tag = targetArea.openDesignId || targetArea.docRef || 'worlds.md §1';
    const msg = `WAYGATE SEALED · ${targetArea.name} / ${wg.world.toUpperCase()} [UNDEFINED: ${tag}]`;
    if (ctx) ctx.say(msg);
    else {
      state.toastText = msg;
      state.toastTimer = 3.2;
    }
    soundSystem.playMenuBeep();
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
  const msg = `WAYGATE READS ÆTHERIC SIGNATURE -> ${wg.world.toUpperCase()} (${wg.name.toUpperCase()})`;
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

  const anchor = state.spawnAnchor || { areaId: 'm00_the_bog', room: '0,0', x: 48, y: 72 };
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

function getNearbyDoorwayDirection(
  roomData: string[],
  tx: number,
  ty: number
): AetherCardinalDir | null {
  const { cols, rows } = getRoomDimensions(roomData);
  const nDoor = getRoomDoorwayCenterPx(roomData, 'N');
  const sDoor = getRoomDoorwayCenterPx(roomData, 'S');
  const wDoor = getRoomDoorwayCenterPx(roomData, 'W');
  const eDoor = getRoomDoorwayCenterPx(roomData, 'E');
  const px = tx * TILE_SIZE + 8;
  const py = ty * TILE_SIZE + 8;

  if (ty <= 1 && Math.abs(px - nDoor.x) <= 28) return 'N';
  if (ty >= rows - 2 && Math.abs(px - sDoor.x) <= 28) return 'S';
  if (tx <= 1 && Math.abs(py - wDoor.y) <= 28) return 'W';
  if (tx >= cols - 2 && Math.abs(py - eDoor.y) <= 28) return 'E';
  return null;
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
    candidateText = '[A] HELP POE BACK TO ITS LANTERN (OR IGNORE / ATTACK)';
  } else if (facingTile === 'L' || currentTile === 'L') {
    candidateKey = `${state.room}:lantern`;
    candidateText =
      state.flags.poe_state === 'helped'
        ? 'POE LANTERN (ILLUMINATED · BOG WURM & FOG PATHS REVEALED)'
        : '[A] GUIDE POE TO LANTERN & RECEIVE GIFT';
  } else if (nearbyCalmNpc) {
    candidateKey = `${state.room}:npc:${nearbyCalmNpc.id}`;
    candidateText = nearbyCalmNpc.isLoyalist
      ? '[A] SPEAK WITH CAMELOT LOYALIST'
      : '[A] TRADE WITH BORDER TOWN SCAVENGER (15 SCRAP -> REPAIR KIT)';
  } else if (currentTile === 'D' || facingTile === 'D') {
    candidateKey = `${state.room}:D`;
    const wsCount = (state.discoveredWaystations || []).length;
    candidateText =
      wsCount > 1
        ? `[A] SYNC DROP-POD WAYSTATION · RESET FOG & FAST TRAVEL (${wsCount} ATTUNED)`
        : '[A] SYNC SPAWN ANCHOR, RESET FOG GRAPH & ATTUNE WAYSTATION';
  } else if (currentTile === 'A' || facingTile === 'A') {
    candidateKey = `${state.room}:A`;
    const wsCount = (state.discoveredWaystations || []).length;
    candidateText =
      wsCount > 1
        ? `[A] ATTUNE ÆTHER WAYSTATION · RESET FOG & TRANSIT (${wsCount} ATTUNED)`
        : '[A] ATTUNE ÆTHER WAYSTATION · RESET FOG & REPAIR';
  } else if (currentTile === 'Q' || facingTile === 'Q') {
    candidateKey = `${state.room}:Q`;
    const destWorld =
      state.regionId === 'region_tyrranus_frontier' ? 'BELLDOR (CAMELOT)' : 'TYRRANUS FRONTIER';
    candidateText = `[A] WALK THROUGH COLOSSAL WAYGATE -> READ ÆTHERIC SIGNATURE TO ${destWorld}`;
  } else if (nearScout) {
    candidateKey = `${state.room}:${scoutKey}:${state.flags.bedivere_ring_choice || 'none'}`;
    const tutorialOverride = getTutorialPromptOverride(state, 'S');
    if (!state.lootedCaches[scoutKey]) {
      candidateText =
        tutorialOverride || "[A] EXAMINE BEDIVERE (BOOSTER, KHOPESH & NUMBERED LIST)";
    } else if (
      !state.flags.bedivere_ring_choice ||
      state.flags.bedivere_ring_choice === 'pending'
    ) {
      candidateText = "[A] TAKE BEDIVERE'S SIGNET RING (OR WALK AWAY TO LEAVE IT)";
    } else {
      candidateText =
        state.flags.bedivere_ring_choice === 'taken'
          ? 'BEDIVERE (SIGNET RING TAKEN)'
          : 'BEDIVERE (SIGNET RING LEFT IN PEACE)';
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
      candidateText = isChest ? '[A] OPEN TREASURE CHEST' : '[A] LOOT SCAVENGER CACHE';
    } else {
      candidateText = isChest ? 'TREASURE CHEST (OPENED)' : 'SCAVENGER CACHE (EMPTY)';
    }
  } else if (facingTile === '1' || facingTile === '2' || facingTile === '3') {
    const switchKey = `switch:${state.room}:${facingTile}`;
    candidateKey = switchKey;
    candidateText = state.lootedCaches[switchKey]
      ? `HIDDEN GRAIL SWITCH #${facingTile} (LOCKED IN POSITION 3)`
      : `[A] PULL HIDDEN GRAIL SWITCH #${facingTile}`;
  } else if (facingTile === '!' || currentTile === '!') {
    const lx = facingTile === '!' ? ax : tx;
    const ly = facingTile === '!' ? ay : ty;
    const toggleKey = `switch:${state.room}:toggle:${lx},${ly}`;
    candidateKey = `${toggleKey}:${state.lootedCaches[toggleKey] ? 'on' : 'off'}`;
    candidateText = state.lootedCaches[toggleKey]
      ? '[A] TOGGLE ÆTHER LEVER (3 -> 2 -> 1 · RESTORE DESYNC PHASE)'
      : '[A] TOGGLE ÆTHER LEVER (1 -> 2 -> 3 · STABILIZE DESYNC BARRIERS)';
  } else if (facingTile === 'G' || currentTile === 'G') {
    if (state.flags.orc_raid_active) {
      candidateKey = `${state.room}:gate:raid`;
      candidateText = 'BOG EXIT SEALED DURING ORC RAID!';
    } else if (!state.unlockedGates[state.room]) {
      candidateKey = `${state.room}:gate`;
      const hasKey = state.inventorySlots.some((s) => s.itemId === 'rusted_gate_key');
      const poeResolved = Boolean(state.flags.bog_exit_revealed);
      candidateText =
        hasKey || poeResolved
          ? '[A] UNSEAL BOG EXIT GATE'
          : 'BOG EXIT HIDDEN · RESOLVE THE POE OR FIND GATE KEY';
    }
  } else if (facingTile === 'M' || currentTile === 'M') {
    if (!state.flags.cathedral_door_open) {
      candidateKey = `${state.room}:cathedral_door`;
      const status = evaluateCathedralDoorStatus(state);
      candidateText = status.canOpen
        ? `[A] OPEN CATHEDRAL DUNGEON DOOR (${status.reason})`
        : `DUNGEON DOOR LOCKED · ${status.reason}`;
    }
  } else if (
    (currentTile === '~' || facingTile === '~') &&
    Number(state.flags.bedivere_list_items || 0) >= 3 &&
    !state.flags.lady_of_the_lake_defeated &&
    !state.enemies.some((e) => e.type === 'lady_of_the_lake')
  ) {
    candidateKey = `${state.room}:lady_of_the_lake`;
    candidateText = '[A] THE BOG WATER WAITS — AWAKEN THE LADY OF THE LAKE';
  } else {
    // Contextual Aether Fog doorway wayfinding cues
    const activeNode = getActiveAetherNode(state);
    const nearDir = getNearbyDoorwayDirection(roomData, tx, ty);
    if (nearDir && activeNode.trueExitDir) {
      const hasLantern = hasPoeLanternGuidance(state);
      if (nearDir === activeNode.trueExitDir) {
        candidateKey = `${state.room}:fog_tell:${nearDir}`;
        if (activeNode.nodeType === 'loop') {
          candidateText = hasLantern
            ? `POE LANTERN BLAZES · ESCAPE FOG LOOP [${nearDir}]`
            : `SUBTLE ÆTHER MOTES DRIFT OUTWARD · STABLE SEAM [${nearDir}]`;
        } else if (activeNode.nodeType === 'general') {
          candidateText = hasLantern
            ? `POE LANTERN RESONATES · TRUE PATH [${nearDir}] (${activeNode.routeStep || 1}/${activeNode.routeTotal || 1})`
            : `FAINT ÆTHER MOTES DRIFT TOWARD [${nearDir}] THRESHOLD`;
        } else if (activeNode.nodeType === 'side') {
          candidateText = `CONCENTRATED ÆTHER SIGNATURE AHEAD -> END POCKET [${nearDir}]`;
        }
      } else if (activeNode.nodeType === 'loop' && hasLantern) {
        candidateKey = `${state.room}:fog_false:${nearDir}`;
        candidateText = `POE LANTERN DIMS · LOOPING MIST THRESHOLD [${nearDir}]`;
      }
    }
  }

  if (candidateKey) {
    if (state.dismissedPromptKey === candidateKey) {
      state.promptText = null;
      return;
    }
    state.promptText = candidateText;
  } else {
    state.promptText = null;
    state.dismissedPromptKey = null;
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
    ctx.say('POE HELPED · LV 2 WEAPON SET 2 ONLINE & POE LANTERN GIFT GRANTED!');
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

  if (
    currentTile === 'D' ||
    facingTile === 'D' ||
    currentTile === 'A' ||
    facingTile === 'A'
  ) {
    syncRoomHierarchyState(state);
    const areaDef = getAreaDefinition(state.areaId);
    const currentWsId = areaDef.waystation?.id;
    state.discoveredWaystations = state.discoveredWaystations || ['ws_bog_drop_pod'];
    if (currentWsId && !state.discoveredWaystations.includes(currentWsId)) {
      state.discoveredWaystations.push(currentWsId);
    }

    // Resting at a Waystation resets all ephemeral general/side/loop/end fog nodes
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
    ctx.say(
      `WAYSTATION ATTUNED (${areaDef.waystation?.name || 'DROP-POD'}) · FOG GRAPH RESET`
    );
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
      handleTutorialAnchorInteraction(state, ctx, 'S');
      state.lootedCaches[scoutKey] = true;
      state.hasBoosterKit = true;
      if (state.level < 2) {
        state.level = 2;
      }
      unlockLevel2SecondaryWeapon(state);
      unlockEquipmentItem(state, 'khopesh');
      addOrionInventoryItem(state, 'bedivere_list', 1);
      addOrionInventoryItem(state, 'repair_kit', 1);
      state.flags.bedivere_list_collected = true;
      state.flags.bedivere_ring_choice = 'pending';
      syncStateGates(state);
      soundSystem.playPowerup();
      ctx.say("FOUND BOOSTER, KHOPESH & BEDIVERE'S LIST · [A] TAKE RING OR WALK AWAY");
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
        gearSuffix = ` · UNLOCKED ${gearName.toUpperCase()}`;
      }

      if (Number(state.flags.bedivere_list_items || 0) < 3) {
        state.flags.bedivere_list_items = Number(state.flags.bedivere_list_items || 0) + 1;
        addOrionInventoryItem(state, 'bedivere_relic', 1);
      }
      ctx.say(
        `${cacheDef.toast} · +1 ${traitGem.toUpperCase()} & +1 ${reactorGem.toUpperCase()}${gearSuffix}`
      );
      notifyOrionStateChange();
      return true;
    }
  }

  if (facingTile === '1' || facingTile === '2' || facingTile === '3') {
    const switchKey = `switch:${state.room}:${facingTile}`;
    if (!state.lootedCaches[switchKey]) {
      state.lootedCaches[switchKey] = true;
      state.flags[`${switchKey}:anim_t`] = state.t;
      state.flags[`${switchKey}:anim_dir`] = '123';
      const curSwitches = Math.min(3, Number(state.flags.dungeon_switches || 0) + 1);
      state.flags.dungeon_switches = curSwitches;
      soundSystem.playPowerup();
      ctx.say(`HIDDEN GRAIL SWITCH PULLED (1 -> 2 -> 3) · (${curSwitches}/3 ACTIVE)`);
      notifyOrionStateChange();
      return true;
    }
  }

  if (facingTile === '!' || currentTile === '!') {
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
        ? 'ÆTHER LEVER TOGGLED (1 -> 2 -> 3) · DESYNC BARRIERS PHASE-LOCKED OPEN'
        : 'ÆTHER LEVER TOGGLED (3 -> 2 -> 1) · DESYNC BARRIERS RESTORED'
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

/**
 * Step environmental hazards, seamless borderless Aether Fog room transitions, and contextual prompts.
 */
export function updateWorldSystem(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  ensureAetherFogGraph(state);
  updateEnvironmentalHazards(rooms, state, ctx, dt);
  handleWorldRoomTransition(rooms, state, ctx);
  checkWorldInteractivePrompt(rooms, state);
}
