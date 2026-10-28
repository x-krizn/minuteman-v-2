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
  ContextualLootPool,
  OrionCombatContext,
  OrionState,
  RoomDefinition,
  RoomLightingProfile,
} from '../types';
import { spawnEnemyByType, spawnRoomEnemies } from './entitySystem';
import {
  ACTION_MODIFICATION_CATALOG,
  GEMSTONE_CATALOG,
  getOwnedWeaponCount,
  isEquipmentUnlocked,
  refundInventoryGem,
  unlockEquipmentItem,
  unlockLevel2SecondaryWeapon,
} from '../database/progression';
import {
  getWeaponDefinition,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
  WEAPON_REGISTRY,
} from '../database/equipment/weapons';
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
  landmarkLabel?: string;
  lighting?: RoomLightingProfile;
  lootPool?: ContextualLootPool;
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

// [ORION-ANCHOR: WORLD-KEY-ROUTES]
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

// [ORION-ANCHOR: U00-ZONE-SEALS]
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

// [ORION-ANCHOR: WORLD-COMPOSER-INIT]
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
      landmarkLabel: resolvedRoom.landmarkLabel,
      lighting: resolvedRoom.lighting,
      lootPool: resolvedRoom.lootPool,
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
            landmarkLabel: stitchedRoom.landmarkLabel,
            lighting: stitchedRoom.lighting,
            lootPool: stitchedRoom.lootPool,
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

// [ORION-ANCHOR: AETHER-FOG-TOPOLOGY]
// ─── 2. AETHER FOG 5-NODE GRAPH ENGINE (KEY, GENERAL, SIDE, LOOP, END) ───────

function deterministicHash(seed: number, counter: number, salt: number = 0): number {
  let h = (seed ^ (counter * 374761393) ^ (salt * 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function hasPoeLanternGuidance(state: OrionState): boolean {
  return Boolean(state.flags?.poe_state === 'helped' || state.flags?.poe_lantern_gift);
}

export const AETHER_PYRAMID_DEPTHS = [0, 1, 2, 3, 2, 1, 0] as const;

export function getMaxAetherFogDepth(state: OrionState): number {
  return Math.max(2, (state.level || 1) + 1);
}

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
        loopMaxDepth: getMaxAetherFogDepth(state),
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
      loopMaxDepth: getMaxAetherFogDepth(state),
      maxDepthNonBossStreak: 0,
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
      loopMaxDepth: getMaxAetherFogDepth(state),
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
        { itemId: 'demantoid_flask', count: 2 },
        { itemId: 'corrupted_shard', count: 1 },
        { itemId: 'grail_water', count: 1 },
      ],
      toast: 'MINI-BOSS HORDE LOOTED: +45 SCRAP, SHARD & 2 REPAIR FLASKS',
    };
  }
  if (feature === 'secret_switch') {
    return {
      scrap: 35,
      items: [
        { itemId: 'demantoid_flask', count: 1 },
        { itemId: 'grail_water', count: 1 },
      ],
      toast: 'SHRINE CACHE LOOTED: +35 SCRAP, DEMANTOID FLASK & GRAIL WATER',
    };
  }
  if (feature === 'dead_end') {
    return {
      scrap: 20,
      items: [{ itemId: 'demantoid_flask', count: 1 }],
      toast: 'CUL-DE-SAC CACHE LOOTED: +20 SCRAP & DEMANTOID FLASK',
    };
  }
  return {
    scrap: 30,
    items: [
      { itemId: 'demantoid_flask', count: 1 },
      { itemId: 'grail_water', count: 1 },
    ],
    toast: 'FOG END-CHEST OPENED: +30 SCRAP, REPAIR FLASK & GRAIL WATER',
  };
}

function buildLoopNodeCacheDefinition(
  depth: number,
  maxDepth: number,
  hasFogBoss: boolean
): OrionCacheDefinition {
  if (depth >= maxDepth && hasFogBoss) {
    return {
      scrap: 50,
      items: [
        { itemId: 'demantoid_flask', count: 2 },
        { itemId: 'corrupted_shard', count: 1 },
        { itemId: 'grail_water', count: 2 },
      ],
      toast: 'LOOTED FOG BOSS RELIQUARY: +50 SCRAP, CORRUPTED SHARD & GRAIL WATER',
    };
  }
  if (depth >= maxDepth) {
    return {
      scrap: 35,
      items: [
        { itemId: 'demantoid_flask', count: 1 },
        { itemId: 'corrupted_shard', count: 1 },
      ],
      toast: 'LOOTED MAX-DEPTH CACHE: +35 SCRAP & CORRUPTED SHARD',
    };
  }
  return {
    scrap: 20 + depth * 5,
    items: [{ itemId: 'demantoid_flask', count: 1 }],
    toast: `LOOTED FOG DEPTH ${depth} CACHE: +${20 + depth * 5} SCRAP & REPAIR FLASK`,
  };
}

export { getCanonicalRoomPersistenceKey, isRoomCacheLooted, markRoomCacheLooted };

// [ORION-ANCHOR: CONTEXTUAL-LOOT-TABLES]
export const ENEMY_EQUIPMENT_DROP_POOLS: Record<
  string,
  { equipmentIds: string[]; baseChance: number }
> = {
  bog_crawler: {
    equipmentIds: ['s2_turbine_khopesh', 's4_whisper_blade', 'tig_edge', 'arc_conductor'],
    baseChance: 0.14,
  },
  bog_wurm: {
    equipmentIds: ['ls900_swordspear', 'wz450_sparkstrike', 'cl350_litany', 'grace_edge'],
    baseChance: 0.28,
  },
  orc_scout: {
    equipmentIds: ['sv12_viper', 'sv18_serpent', 's6_phantom_edge', 'm300_hasta'],
    baseChance: 0.2,
  },
  orc_warrior: {
    equipmentIds: ['b25_brushcutter', 'm350_mauler', 'siegebreaker', 'm450_pilum'],
    baseChance: 0.28,
  },
  percival_knight: {
    equipmentIds: ['aegis_charge_buckler', 'hl220_lightburst_lance', 'rs450_radiant_projector', 'tig_edge'],
    baseChance: 1.0,
  },
  tristan_knight: {
    equipmentIds: ['sr440_shadowfang', 'sv18_serpent', 's4_whisper_blade', 's6_phantom_edge'],
    baseChance: 1.0,
  },
  bors_knight: {
    equipmentIds: ['m450_pilum', 'm300_hasta', 'n55_gladius', 's2_turbine_khopesh'],
    baseChance: 1.0,
  },
  lady_of_the_lake: {
    equipmentIds: [
      'wz650_prism_lance',
      'wz200_manacore_staff',
      'hallowed_scepter',
      'grace_edge',
      'cl500_absolution',
    ],
    baseChance: 1.0,
  },
};

export interface ContextualLootQuery {
  enemyType?: string;
  roomCoord?: string;
  areaId?: string;
  regionId?: string;
  allowSecondCopy?: boolean;
}

/**
 * Resolves a contextual weapon or equipment drop across the hierarchy:
 * `Enemy Archetype -> Room Pool -> Area Pool -> Region Pool`.
 * Prioritizes unlocking unowned 1st copies from the specific context first;
 * once 1st copies are owned, can award a 2nd copy (`x2`) of a 1H weapon for Dual-Wield Paired Stance.
 */
export function resolveContextualEquipmentDrop(
  state: OrionState,
  query: ContextualLootQuery
): string | undefined {
  const roomKey = query.roomCoord || state.room;
  const meta = ORION_ROOM_METADATA[roomKey];
  const areaId = query.areaId || meta?.areaId || state.areaId || 'm00_the_bog';
  const areaDef = AREA_REGISTRY[areaId];
  const regionId =
    query.regionId || meta?.regionId || state.regionId || areaDef?.regionId || 'region_belldor_outskirts';
  const regionDef = REGION_REGISTRY[regionId];

  const enemyPool = query.enemyType
    ? ENEMY_EQUIPMENT_DROP_POOLS[query.enemyType]?.equipmentIds || []
    : [];
  const roomPool = meta?.lootPool?.equipmentIds || ROOM_REGISTRY[roomKey]?.lootPool?.equipmentIds || [];
  const areaPool = areaDef?.lootPool?.equipmentIds || [];
  const regionPool = regionDef?.lootPool?.equipmentIds || [];

  const combinedOrderedPool = Array.from(
    new Set([
      ...enemyPool,
      ...roomPool,
      ...areaPool,
      ...regionPool,
    ])
  ).filter((id) => Boolean(getWeaponDefinition(id)));

  // 1. First copy from the most specific contextual pool
  const firstCopyId = combinedOrderedPool.find((id) => !isEquipmentUnlocked(state, id));
  if (firstCopyId) {
    return firstCopyId;
  }

  // 2. Second copy (`x2` for Paired Stance) from contextual pool or player's unlocked 1H weapons
  if (query.allowSecondCopy !== false) {
    const secondCopyCandidates = Array.from(
      new Set([
        ...combinedOrderedPool,
        ...(state.equippedWeapons || []),
        ...(state.equipmentSlots?.unlockedEquipment || []),
      ])
    );
    const secondCopyId = secondCopyCandidates.find((id) => {
      const def = getWeaponDefinition(id);
      return (
        def &&
        isTrueWeaponEquipment(def) &&
        !isTwoHandOnlyWeapon(def) &&
        getOwnedWeaponCount(state, id) < 2
      );
    });
    if (secondCopyId) {
      return secondCopyId;
    }
  }

  return undefined;
}

export function resolveContextualGemPool(
  state: OrionState,
  enemyType?: string
): string[] {
  const gemPoolByEnemy: Record<string, string[]> = {
    bog_crawler: ['hematite', 'spinel', 'charoite'],
    bog_wurm: ['rubellite', 'kyanite', 'charoite'],
    orc_scout: ['carnelian', 'hematite', 'spinel'],
    orc_warrior: ['carnelian', 'hematite', 'spinel'],
    percival_knight: ['titanite', 'moonstone', 'demantoid'],
    tristan_knight: ['charoite', 'rubellite', 'moonstone'],
    bors_knight: ['titanite', 'moonstone', 'spinel'],
    lady_of_the_lake: ['moonstone', 'rubellite', 'demantoid', 'kyanite'],
  };
  if (enemyType && gemPoolByEnemy[enemyType]) {
    return gemPoolByEnemy[enemyType];
  }
  const meta = ORION_ROOM_METADATA[state.room];
  if (meta?.lootPool?.gemIds && meta.lootPool.gemIds.length > 0) {
    return meta.lootPool.gemIds;
  }
  const areaDef = AREA_REGISTRY[meta?.areaId || state.areaId || 'm00_the_bog'];
  if (areaDef?.lootPool?.gemIds && areaDef.lootPool.gemIds.length > 0) {
    return areaDef.lootPool.gemIds;
  }
  const regionDef = REGION_REGISTRY[meta?.regionId || state.regionId || 'region_belldor_outskirts'];
  if (regionDef?.lootPool?.gemIds && regionDef.lootPool.gemIds.length > 0) {
    return regionDef.lootPool.gemIds;
  }
  return ['moonstone', 'rubellite', 'hematite', 'spinel'];
}

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

  if (state.clearedRooms) {
    for (const key of Object.keys(state.clearedRooms)) {
      if (
        key.startsWith('fog:') ||
        key.startsWith('fog_slot:loop') ||
        key.startsWith('fog_slot:side') ||
        key.startsWith('fog_slot:end')
      ) {
        delete state.clearedRooms[key];
      }
    }
  }

  state.fogGraph = undefined;
  const freshGraph = ensureAetherFogGraph(state);
  freshGraph.seed = (prevSeed + 7919) % 9999991;
  freshGraph.nextCounter = prevCounter;
  freshGraph.loopDepth = 0;
  freshGraph.loopStage = 0;
  freshGraph.loopMaxDepth = getMaxAetherFogDepth(state);
  freshGraph.maxDepthNonBossStreak = 0;

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
  '######,,,,######',
  '#,,:..::::..:,,#',
  '#,P,..::::..,P,#',
  '#,..~~~::~~~..,#',
  '#,..~~~~~~~~..,#',
  ',,....::::....,,',
  ',,....::::....,,',
  '#,..~~~~~~~~..,#',
  '#,..~~~::~~~..,#',
  '#,P,..::::..,P,#',
  '#,,:........:,,#',
  '######,,,,######',
];

function decorateDynamicRoomGrid(
  baseGrid: string[],
  nodeType: AetherNodeType,
  openDirs: AetherCardinalDir[],
  _trueExitDir: AetherCardinalDir | undefined,
  endFeature: AetherEndFeature | undefined,
  hashVal: number,
  loopDepth: number = 0,
  biomeHasCorrosiveWater: boolean = true
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

  // If the biome does not feature bog water, replace template '~' cells with flagstones/dirt so non-bog fog stays dry
  if (!biomeHasCorrosiveWater) {
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (matrix[y][x] === '~') {
          matrix[y][x] = ':';
        }
      }
    }
  }

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

  // Loop nodes become progressively less traversable and more hazardous at deeper depths (1 .. clvl + 1)
  if (nodeType === 'loop') {
    const effDepth = Math.max(1, loopDepth || 1);
    const hazardChar = biomeHasCorrosiveWater ? '~' : '_';

    // Clear residual static template enemies so spawnDynamicNodeFeatures has full authority over scaled encounters
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (matrix[y][x] === 'E' || matrix[y][x] === 'o' || matrix[y][x] === 's') {
          matrix[y][x] = '.';
        }
      }
    }

    // Depth 1+: Central hazard obstacle
    if (matrix[midY]) {
      matrix[midY][midX - 1] = hazardChar;
      matrix[midY][midX] = hazardChar;
    }
    if (biomeHasCorrosiveWater) {
      if (matrix[midY - 1]) {
        matrix[midY - 1][midX - 1] = ',';
        matrix[midY - 1][midX] = ',';
      }
      if (matrix[midY + 1]) {
        matrix[midY + 1][midX - 1] = ',';
        matrix[midY + 1][midX] = ',';
      }
    }

    // Depth 1: Supply cache near entry clearing
    if (effDepth === 1) {
      const cacheY = Math.min(rows - 3, midY + 3);
      if (matrix[cacheY] && matrix[cacheY][midX] === '.') {
        matrix[cacheY][midX] = 'C';
      }
    }

    // Depth 2+: Pillars and phase-desync barriers constrict movement + interactive toggle lever or cache
    if (effDepth >= 2) {
      const topRow = Math.max(2, midY - 2);
      const botRow = Math.min(rows - 3, midY + 2);
      const leftCol = Math.max(2, midX - 3);
      const rightCol = Math.min(cols - 3, midX + 2);

      if (matrix[topRow]) {
        matrix[topRow][leftCol] = 'P';
        matrix[topRow][rightCol] = 'P';
        if (leftCol + 1 < midX - 1) matrix[topRow][leftCol + 1] = hazardChar;
        if (rightCol - 1 > midX) matrix[topRow][rightCol - 1] = hazardChar;
      }
      if (matrix[botRow]) {
        matrix[botRow][leftCol] = 'P';
        matrix[botRow][rightCol] = 'P';
        if (leftCol + 1 < midX - 1) matrix[botRow][leftCol + 1] = hazardChar;
        if (rightCol - 1 > midX) matrix[botRow][rightCol - 1] = hazardChar;
      }
      if (matrix[midY]) {
        if (leftCol >= 2) matrix[midY][leftCol] = '%';
        if (rightCol <= cols - 3) matrix[midY][rightCol] = '%';
      }

      const switchY = Math.max(2, midY - 3);
      if (matrix[switchY] && matrix[switchY][midX] === '.') {
        matrix[switchY][midX] = hashVal % 2 === 0 ? '!' : 'C';
      }
    }

    // Depth 3+: Sinkhole pitfalls ('_') and narrower channels
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
        matrix[midY - 1][Math.max(2, midX - 2)] = hazardChar;
        matrix[midY - 1][Math.min(cols - 3, midX + 1)] = hazardChar;
      }
      if (matrix[midY + 1]) {
        matrix[midY + 1][Math.max(2, midX - 2)] = hazardChar;
        matrix[midY + 1][Math.min(cols - 3, midX + 1)] = hazardChar;
      }
    }

    // Max Depth: Chamber feature — dais with Reliquary Chest ('V') for Boss / deep salvage
    const chestRow = Math.max(2, midY - 3);
    if (effDepth >= 2 && matrix[chestRow] && matrix[chestRow][midX] === '.') {
      matrix[chestRow][midX] = 'V';
      if (matrix[chestRow][midX - 1] === '.') matrix[chestRow][midX - 1] = ':';
      if (matrix[chestRow][midX + 1] === '.') matrix[chestRow][midX + 1] = ':';
    }
  }

  // Ensure general and side rooms have at least one supply cache if none present
  if (nodeType === 'general' || nodeType === 'side') {
    let hasLoot = false;
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (matrix[y][x] === 'C' || matrix[y][x] === 'V') {
          hasLoot = true;
          break;
        }
      }
    }
    if (!hasLoot && matrix[midY]) {
      const targetCol = hashVal % 2 === 0 ? Math.max(2, midX - 2) : Math.min(cols - 3, midX + 2);
      if (matrix[midY][targetCol] === '.') {
        matrix[midY][targetCol] = 'C';
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
    loopMaxDepth?: number;
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

  const loopMaxDepth =
    nodeType === 'loop'
      ? Math.max(
          2,
          options?.loopMaxDepth ??
            parentNode.loopMaxDepth ??
            graph.loopMaxDepth ??
            getMaxAetherFogDepth(state)
        )
      : getMaxAetherFogDepth(state);

  const loopDepth =
    nodeType === 'loop'
      ? Math.max(1, Math.min(loopMaxDepth, options?.loopDepth ?? 1))
      : 0;
  const loopStage =
    nodeType === 'loop' ? Math.max(1, options?.loopStage ?? 1) : 0;

  const templates = Object.values(GLOBAL_ROOM_REGISTRY);
  const chosenTemplate =
    templates[hashVal % Math.max(1, templates.length)] || ROOM_REGISTRY['0,1'] || ROOM_REGISTRY['0,0'];

  // Preserve the area/region's biome so non-bog fog does not force corrosive bog water
  const inheritedBiomeId =
    parentNode.biomeId || state.biomeId || chosenTemplate?.biomeId || 'belldor_bog';
  const resolvedBiome = getBiomeDefinition(inheritedBiomeId);
  const biomeHasCorrosiveWater = Boolean(resolvedBiome.tileRules?.corrosiveWater);

  let trueExitDir: AetherCardinalDir | undefined;
  let endFeature: AetherEndFeature | undefined;
  let openDirs: AetherCardinalDir[] = ALL_CARDINAL_DIRS;
  let title = chosenTemplate?.title || 'Drifting Sector';
  let bannerTitle = '';
  let hasFogBoss = false;

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
    // At max depth (clvl + 1), 1 in (clvl + 1) rooms spawns a Fog Boss (frequency = 1 / loopMaxDepth)
    if (loopDepth >= loopMaxDepth) {
      const nonBossStreak = graph.maxDepthNonBossStreak || 0;
      const rolledBoss =
        hashVal % loopMaxDepth === 0 || nonBossStreak + 1 >= loopMaxDepth;
      if (rolledBoss) {
        hasFogBoss = true;
        graph.maxDepthNonBossStreak = 0;
      } else {
        hasFogBoss = false;
        graph.maxDepthNonBossStreak = nonBossStreak + 1;
      }
      title = hasFogBoss
        ? `Æther Fog [Max Depth ${loopDepth} · Boss]`
        : `Æther Fog [Max Depth ${loopDepth}]`;
      bannerTitle = hasFogBoss
        ? `MAX DEPTH ${loopDepth} · FOG BOSS LAIR`
        : `ÆTHER FOG · MAX DEPTH ${loopDepth}`;
    } else {
      trueExitDir = returnDir;
      title = `Æther Fog [Depth ${loopDepth} · ${loopStage}/${loopDepth}]`;
      bannerTitle = `ÆTHER FOG · DEPTH ${loopDepth} (${loopStage}/${loopDepth})`;
    }
  }

  const grid = decorateDynamicRoomGrid(
    chosenTemplate?.grid || ROOM_REGISTRY['0,0'].grid,
    nodeType,
    openDirs,
    trueExitDir,
    endFeature,
    hashVal,
    loopDepth,
    biomeHasCorrosiveWater
  );

  const anchorSafeNodeId =
    options?.anchorSafeNodeId ||
    (parentNode.nodeType === 'loop'
      ? parentNode.anchorSafeNodeId || parentNode.parentNodeId
      : parentNode.id);

  // Before reaching maxDepth, returnDir links back to parentNode so the player can retrace steps to safety.
  // Once at maxDepth (loopDepth >= loopMaxDepth), all 4 doors remain unlocked and cycle into random maxDepth rooms until a Boss is defeated.
  const edges: Partial<Record<AetherCardinalDir, string>> =
    nodeType === 'loop' && loopDepth >= loopMaxDepth
      ? {}
      : {
          [returnDir]: parentNode.id,
        };

  const newNode: AetherGraphNode = {
    id,
    nodeType,
    coord: `${mapRx},${mapRy}`,
    mapRx,
    mapRy,
    loopDepth,
    loopStage,
    loopMaxDepth,
    hasFogBoss,
    title,
    bannerTitle,
    regionId: parentNode.regionId || state.regionId || 'region_belldor_outskirts',
    areaId: parentNode.areaId || state.areaId || 'm00_the_bog',
    mapId: parentNode.mapId || state.mapId || 'map_bog_drop_zone',
    biomeId: resolvedBiome.id,
    sourceKeyCoord: options?.sourceKeyCoord ?? parentNode.sourceKeyCoord,
    targetKeyCoord: options?.targetKeyCoord ?? parentNode.targetKeyCoord,
    routeStep: options?.routeStep ?? parentNode.routeStep,
    routeTotal: options?.routeTotal ?? parentNode.routeTotal,
    trueExitDir,
    returnDir,
    parentNodeId: parentNode.id,
    anchorSafeNodeId,
    edges,
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
  } else if (nodeType === 'loop') {
    ORION_CACHE_DEFINITIONS[id] = buildLoopNodeCacheDefinition(
      loopDepth,
      loopMaxDepth,
      hasFogBoss
    );
  } else if (nodeType === 'general' || nodeType === 'side') {
    ORION_CACHE_DEFINITIONS[id] = {
      scrap: 15 + (options?.routeStep || 1) * 5,
      items: [{ itemId: 'demantoid_flask', count: 1 }],
      toast: `LOOTED SUPPLY CRATE: +${15 + (options?.routeStep || 1) * 5} SCRAP & DEMANTOID FLASK`,
    };
  }

  return newNode;
}

export interface DoorwayAetherTransitionInfo {
  dir: AetherCardinalDir;
  currentDepth: number;
  currentStage: number;
  nextDepth: number;
  nextStage: number;
  maxDepth: number;
  isLoopEntrance: boolean;
  increasesDensity: boolean;
  isRetrace: boolean;
}

/**
 * Pure, non-mutating inspection of any cardinal doorway (`N`, `S`, `E`, `W`) in the active room:
 * - Max depth is `clvl + 1` (`getMaxAetherFogDepth(state)`).
 * - Each depth `d` (`1 <= d < maxDepth`) has `d` rooms (`stage 1 .. d`) before advancing to depth `d + 1`.
 * - While `currentDepth < maxDepth`, stepping through `returnDir` retraces your steps (`(d, k) -> (d, k - 1)` or `(d - 1, d - 1)` or Safe `0`).
 * - Once at `currentDepth >= maxDepth`, all 4 doorways remain unlocked (player can run from boss rooms) and lead into random `maxDepth` rooms until a Boss is defeated.
 */
export function getDoorwayAetherTransitionInfo(
  state: OrionState,
  dir: AetherCardinalDir
): DoorwayAetherTransitionInfo {
  const graph = ensureAetherFogGraph(state);
  const currentNode = getActiveAetherNode(state);
  const maxDepth =
    currentNode.loopMaxDepth ?? graph.loopMaxDepth ?? getMaxAetherFogDepth(state);

  if (currentNode.nodeType === 'loop') {
    const currentDepth = Math.max(
      1,
      Math.min(maxDepth, currentNode.loopDepth ?? graph.loopDepth ?? 1)
    );
    const currentStage = Math.max(1, currentNode.loopStage ?? graph.loopStage ?? 1);

    // 1. Before reaching maxDepth: player can retrace steps via returnDir or push deeper
    if (currentDepth < maxDepth) {
      if (dir === currentNode.returnDir) {
        let nextDepth = currentDepth;
        let nextStage = currentStage - 1;
        if (currentStage > 1) {
          nextDepth = currentDepth;
          nextStage = currentStage - 1;
        } else if (currentDepth > 1) {
          nextDepth = currentDepth - 1;
          nextStage = currentDepth - 1;
        } else {
          nextDepth = 0;
          nextStage = 0;
        }
        return {
          dir,
          currentDepth,
          currentStage,
          nextDepth,
          nextStage,
          maxDepth,
          isLoopEntrance: false,
          increasesDensity: false,
          isRetrace: true,
        };
      }

      // Moving deeper: each depth `d` requires `d` rooms before advancing to `d + 1`
      const advancesToNextTier = currentStage >= currentDepth;
      const nextDepth = advancesToNextTier
        ? Math.min(maxDepth, currentDepth + 1)
        : currentDepth;
      const nextStage = advancesToNextTier ? 1 : currentStage + 1;

      return {
        dir,
        currentDepth,
        currentStage,
        nextDepth,
        nextStage,
        maxDepth,
        isLoopEntrance: false,
        increasesDensity: true,
        isRetrace: false,
      };
    }

    // 2. At maxDepth (clvl + 1): doors do not lock; all 4 doorways cycle into random maxDepth rooms until a Boss is defeated
    return {
      dir,
      currentDepth: maxDepth,
      currentStage,
      nextDepth: maxDepth,
      nextStage: currentStage + 1,
      maxDepth,
      isLoopEntrance: false,
      increasesDensity: true,
      isRetrace: false,
    };
  }

  // Currently in a SAFE room (`currentDepth === 0`): check if `dir` is an Æther Fog pocket entrance
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
    maxDepth,
    isLoopEntrance,
    increasesDensity: nextDepth > 0,
    isRetrace: false,
  };
}

function resolveSafeEmergenceNode(
  graph: AetherFogGraphState,
  currentNode: AetherGraphNode
): AetherGraphNode {
  const anchorId = currentNode.anchorSafeNodeId || currentNode.parentNodeId;
  if (anchorId && graph.nodes[anchorId]) {
    return graph.nodes[anchorId];
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

  // 1. Inside a LOOP node:
  if (currentNode.nodeType === 'loop') {
    const transInfo = getDoorwayAetherTransitionInfo(state, dir);

    // Retracing from Depth 1 (Room 1/1) back to the main path (`nextDepth === 0`)
    if (transInfo.nextDepth === 0) {
      const escapeTarget = resolveSafeEmergenceNode(graph, currentNode);
      currentNode.edges[dir] = escapeTarget.id;
      return { targetNode: escapeTarget, isLoopCycle: false, escapedLoop: true };
    }

    // While below maxDepth (`currentDepth < maxDepth`), retrace or reuse already-visited loop edges
    if (transInfo.currentDepth < transInfo.maxDepth) {
      const existingLoopTargetId = currentNode.edges[dir];
      if (
        existingLoopTargetId &&
        graph.nodes[existingLoopTargetId] &&
        rooms[existingLoopTargetId]
      ) {
        return {
          targetNode: graph.nodes[existingLoopTargetId],
          isLoopCycle: true,
          escapedLoop: false,
        };
      }
    }

    // Create the next deeper room (or a new random max-depth room when at maxDepth)
    const nextLoopNode = createDynamicAetherNode(rooms, state, currentNode, dir, 'loop', {
      sourceKeyCoord: currentNode.sourceKeyCoord,
      targetKeyCoord: currentNode.targetKeyCoord,
      routeStep: currentNode.routeStep,
      routeTotal: currentNode.routeTotal,
      loopStage: transInfo.nextStage,
      loopDepth: transInfo.nextDepth,
      loopMaxDepth: transInfo.maxDepth,
      anchorSafeNodeId: currentNode.anchorSafeNodeId || currentNode.parentNodeId,
    });
    if (transInfo.currentDepth < transInfo.maxDepth) {
      currentNode.edges[dir] = nextLoopNode.id;
    }
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

  const maxDepth = getMaxAetherFogDepth(state);

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
          loopMaxDepth: maxDepth,
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

    // Unmapped open border on a KEY node -> deterministically spawns a SIDE node or LOOP node (Depth 1, Room 1/1)
    const branchType = getKeyBorderBranchType(graph.seed, keyCoord, dir);
    const branchNode = createDynamicAetherNode(rooms, state, currentNode, dir, branchType, {
      sourceKeyCoord: keyCoord,
      loopStage: branchType === 'loop' ? 1 : 0,
      loopDepth: branchType === 'loop' ? 1 : 0,
      loopMaxDepth: maxDepth,
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
            loopMaxDepth: maxDepth,
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
  // `trueExitDir` leads to a rewarding END node; off-path exits lead into a LOOP node at Depth 1 (Room 1/1)
  const targetType: AetherNodeType = dir === currentNode.trueExitDir ? 'end' : 'loop';
  const childNode = createDynamicAetherNode(rooms, state, currentNode, dir, targetType, {
    sourceKeyCoord: currentNode.sourceKeyCoord,
    targetKeyCoord: currentNode.targetKeyCoord,
    routeStep: currentNode.routeStep,
    routeTotal: currentNode.routeTotal,
    loopStage: targetType === 'loop' ? 1 : 0,
    loopDepth: targetType === 'loop' ? 1 : 0,
    loopMaxDepth: maxDepth,
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
    (node.nodeType === 'end' && state.clearedRooms[miniBossSpawnKey])
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

  // Active patrols along general inter-key corridors
  if (node.nodeType === 'general') {
    const step = node.routeStep || 1;
    if (step % 2 === 1) {
      spawnEnemyByType(
        state,
        'orc_scout',
        Math.round(widthPx * 0.65),
        Math.round(heightPx * 0.45),
        {
          name: 'Ætheric Scout',
          spawnKey: `${canonicalKey}:scout`,
          emissiveColor: '#38bdf8',
        }
      );
    } else {
      spawnEnemyByType(
        state,
        'orc_warrior',
        Math.round(widthPx * 0.35),
        Math.round(heightPx * 0.45),
        {
          name: 'Waystation Interceptor',
          spawnKey: `${canonicalKey}:warrior`,
          emissiveColor: '#f97316',
        }
      );
      spawnEnemyByType(
        state,
        'orc_scout',
        Math.round(widthPx * 0.70),
        Math.round(heightPx * 0.55),
        {
          name: 'Ætheric Scout',
          spawnKey: `${canonicalKey}:scout`,
          emissiveColor: '#38bdf8',
        }
      );
    }
    return;
  }

  // Off-path side wilds skirmish
  if (node.nodeType === 'side') {
    const isBogBiome =
      node.biomeId === 'belldor_bog' || node.biomeId === 'global_toxic_wetlands';
    spawnEnemyByType(
      state,
      'orc_warrior',
      Math.round(widthPx * 0.38),
      Math.round(heightPx * 0.42),
      {
        name: 'Wilds Marauder',
        spawnKey: `${canonicalKey}:warrior`,
        emissiveColor: '#c084fc',
      }
    );
    spawnEnemyByType(
      state,
      isBogBiome ? 'bog_wurm' : 'orc_scout',
      Math.round(widthPx * 0.66),
      Math.round(heightPx * 0.55),
      {
        name: isBogBiome ? 'Fen Lurker' : 'Wilds Scout',
        spawnKey: `${canonicalKey}:add`,
        emissiveColor: '#c084fc',
      }
    );
    return;
  }

  // Scale Æther Fog enemy stats & spawns by depth (1 .. clvl + 1)
  if (node.nodeType === 'loop') {
    const maxDepth = node.loopMaxDepth ?? getMaxAetherFogDepth(state);
    const depth = Math.max(1, Math.min(maxDepth, node.loopDepth || 1));
    const statMult = 1 + depth * 0.22;
    const speedMult = 1 + Math.min(0.45, depth * 0.06);
    const isBogBiome =
      node.biomeId === 'belldor_bog' || node.biomeId === 'global_toxic_wetlands';

    const spawnScaledLoopEnemy = (
      type: string,
      px: number,
      py: number,
      idx: number,
      isBoss: boolean = false,
      bossTitle?: string
    ) => {
      const bossMult = isBoss ? 1.35 : 1.0;
      const e = spawnEnemyByType(state, type, px, py, {
        ...(bossTitle ? { name: bossTitle } : {}),
        spawnKey: `${canonicalKey}:loop_depth_${depth}:${idx}`,
        isFogBoss: isBoss,
        fogDepth: depth,
      });
      if (!e) return;
      e.shields.maxCapacity = Math.round(e.shields.maxCapacity * statMult * bossMult);
      e.shields.capacity = e.shields.maxCapacity;
      e.armor.maxDurability = Math.round(e.armor.maxDurability * statMult * bossMult);
      e.armor.durability = e.armor.maxDurability;
      e.frame.maxIntegrity = Math.round(e.frame.maxIntegrity * statMult * bossMult);
      e.frame.integrity = e.frame.maxIntegrity;
      e.damage = Math.round(e.damage * statMult * (isBoss ? 1.2 : 1.0));
      e.speed = Math.round(e.speed * speedMult);
      e.emissiveColor = isBoss
        ? '#f43f5e'
        : depth >= maxDepth
          ? '#fb7185'
          : depth >= 2
            ? '#c084fc'
            : '#38bdf8';
      if (type === 'bog_wurm') {
        e.isSubmerged = isBoss ? false : !hasPoeLanternGuidance(state);
      }
    };

    // If this max-depth room rolled a Boss (1 in clvl + 1 rooms), spawn the Fog Boss!
    if (depth >= maxDepth && node.hasFogBoss) {
      const fogBossPool = isBogBiome
        ? [
            { type: 'bog_wurm', title: `Elder Æther Wurm (Depth ${depth} Boss)` },
            { type: 'orc_warrior', title: `Fog-Bound Warlord (Depth ${depth} Boss)` },
            { type: 'percival_knight', title: `Drifting Grail Warden (Depth ${depth} Boss)` },
          ]
        : [
            { type: 'percival_knight', title: `Drifting Grail Warden (Depth ${depth} Boss)` },
            { type: 'tristan_knight', title: `Mist-Stalker Ranger (Depth ${depth} Boss)` },
            { type: 'bors_knight', title: `Desynchronized Berserker (Depth ${depth} Boss)` },
          ];
      const pick = fogBossPool[node.id.length % fogBossPool.length];
      spawnScaledLoopEnemy(
        pick.type,
        Math.round(widthPx * 0.5),
        Math.round(heightPx * 0.45),
        0,
        true,
        pick.title
      );
      // Spawn two tactical adds for the boss encounter
      spawnScaledLoopEnemy(
        'orc_scout',
        Math.round(widthPx * 0.28),
        Math.round(heightPx * 0.62),
        1,
        false,
        'Warlord Vanguard'
      );
      spawnScaledLoopEnemy(
        isBogBiome ? 'bog_wurm' : 'tristan_knight',
        Math.round(widthPx * 0.72),
        Math.round(heightPx * 0.62),
        2,
        false,
        isBogBiome ? 'Bog Thrall' : 'Phantasm Guard'
      );
      return;
    }

    // At Max Depth (non-boss chamber while hunting the boss): spawn an Elite Fog Strike Team!
    if (depth >= maxDepth) {
      spawnScaledLoopEnemy(
        'orc_warrior',
        Math.round(widthPx * 0.32),
        Math.round(heightPx * 0.40),
        0,
        false,
        'Elite Fog Vanguard'
      );
      spawnScaledLoopEnemy(
        'orc_scout',
        Math.round(widthPx * 0.68),
        Math.round(heightPx * 0.40),
        1,
        false,
        'Mist Sniper'
      );
      spawnScaledLoopEnemy(
        isBogBiome ? 'bog_wurm' : 'tristan_knight',
        Math.round(widthPx * 0.50),
        Math.round(heightPx * 0.64),
        2,
        false,
        isBogBiome ? 'Æther Lurker' : 'Phantom Knight'
      );
      return;
    }

    if (depth === 1) {
      // Canonical Orc pair: Warrior + Scout
      spawnScaledLoopEnemy(
        'orc_warrior',
        Math.round(widthPx * 0.34),
        Math.round(heightPx * 0.42),
        0
      );
      spawnScaledLoopEnemy(
        'orc_scout',
        Math.round(widthPx * 0.66),
        Math.round(heightPx * 0.58),
        1
      );
    } else if (depth === 2) {
      // Depth 2: Orc Warrior + Scout + Bog Wurm / Knight
      spawnScaledLoopEnemy(
        'orc_warrior',
        Math.round(widthPx * 0.32),
        Math.round(heightPx * 0.38),
        0
      );
      spawnScaledLoopEnemy(
        'orc_scout',
        Math.round(widthPx * 0.68),
        Math.round(heightPx * 0.62),
        1
      );
      spawnScaledLoopEnemy(
        isBogBiome ? 'bog_wurm' : 'tristan_knight',
        Math.round(widthPx * 0.5),
        Math.round(heightPx * 0.50),
        2
      );
    } else {
      // Depth 3+: Orc Warrior + 2 Orc Scouts + Bog Wurm (in Bog) or Knight (outside Bog)
      spawnScaledLoopEnemy(
        'orc_warrior',
        Math.round(widthPx * 0.28),
        Math.round(heightPx * 0.36),
        0
      );
      spawnScaledLoopEnemy(
        'orc_scout',
        Math.round(widthPx * 0.72),
        Math.round(heightPx * 0.36),
        1
      );
      spawnScaledLoopEnemy(
        isBogBiome ? 'bog_wurm' : 'tristan_knight',
        Math.round(widthPx * 0.5),
        Math.round(heightPx * 0.65),
        2
      );
    }
  }
}

/**
 * Clears the Æther Fog and returns the player to the last room they stood on along the main path
 * when a Fog Boss is defeated at `maxDepth = clvl + 1`.
 */
export function clearAetherFogOnBossDefeat(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx?: OrionCombatContext
): void {
  const graph = ensureAetherFogGraph(state);
  const currentNode = getActiveAetherNode(state);
  const safeTarget = resolveSafeEmergenceNode(graph, currentNode);

  // Remove dynamic loop nodes so the cleared fog pocket dissolves
  for (const [nodeId, n] of Object.entries(graph.nodes)) {
    if (nodeId.startsWith('fog:loop:') || n.nodeType === 'loop') {
      delete graph.nodes[nodeId];
      delete rooms[nodeId];
      delete ORION_ROOM_METADATA[nodeId];
      delete ORION_CACHE_DEFINITIONS[nodeId];
    }
  }

  if (state.clearedRooms) {
    for (const key of Object.keys(state.clearedRooms)) {
      if (
        key.startsWith('fog:') ||
        key.startsWith('fog_slot:loop') ||
        key.startsWith('fog_slot:side') ||
        key.startsWith('fog_slot:end')
      ) {
        delete state.clearedRooms[key];
      }
    }
  }
  for (const n of Object.values(graph.nodes)) {
    for (const d of ALL_CARDINAL_DIRS) {
      const targetId = n.edges[d];
      if (targetId && !graph.nodes[targetId]) {
        delete n.edges[d];
      }
    }
  }

  const targetGrid = rooms[safeTarget.id] || ORION_TUTORIAL_ROOMS[safeTarget.id];
  if (targetGrid) {
    rooms[safeTarget.id] = targetGrid;
    const dim = getRoomDimensions(targetGrid);
    state.x = Math.round(dim.widthPx * 0.5);
    state.y = Math.round(dim.heightPx * 0.52);
  }

  const parsed = parseCoordPair(safeTarget.coord);
  state.rx = safeTarget.mapRx ?? parsed.rx;
  state.ry = safeTarget.mapRy ?? parsed.ry;
  state.room = safeTarget.id;

  graph.activeNodeId = safeTarget.id;
  graph.loopDepth = 0;
  graph.loopStage = 0;
  graph.loopMaxDepth = getMaxAetherFogDepth(state);
  graph.maxDepthNonBossStreak = 0;

  state.projectiles = [];
  state.pickups = [];

  syncRoomHierarchyState(state);
  spawnRoomEnemies(rooms, state);

  soundSystem.playPowerup();
  const info = getRoomWorldInfo(state);
  const msg = `FOG BOSS DEFEATED · ÆTHER FOG CLEARED -> ${info.roomTitle.toUpperCase()}`;
  if (ctx) {
    ctx.say(msg);
  } else {
    state.toastText = msg;
    state.toastTimer = 2.8;
  }
  notifyOrionStateChange();
}

// [ORION-ANCHOR: ROOM-TRANSITION-GATE]
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

  // Map-relative coordinates (`rx`, `ry`) track both safe nodes and Æther Fog rooms relative to the map
  const parsedCoord = parseCoordPair(targetNode.coord);
  state.rx = targetNode.mapRx ?? parsedCoord.rx;
  state.ry = targetNode.mapRy ?? parsedCoord.ry;

  state.room = targetNode.id;
  graph.activeNodeId = targetNode.id;

  if (targetNode.nodeType === 'loop') {
    graph.loopStage = targetNode.loopStage ?? 1;
    graph.loopDepth = targetNode.loopDepth ?? 1;
    graph.loopMaxDepth = targetNode.loopMaxDepth ?? getMaxAetherFogDepth(state);
    state.flickerTimer = 0.22 + Math.min(0.45, graph.loopDepth * 0.08);
  } else {
    graph.loopStage = 0;
    graph.loopDepth = 0;
    graph.loopMaxDepth = getMaxAetherFogDepth(state);
    graph.maxDepthNonBossStreak = 0;
  }

  state.projectiles = [];
  state.pickups = [];

  syncRoomHierarchyState(state);

  spawnRoomEnemies(rooms, state);
  spawnDynamicNodeFeatures(rooms, state, targetNode);

  soundSystem.playSelect();
  const info = getRoomWorldInfo(state);

  // Room-to-room pop-ups are suppressed unless needed (sealed zone, entering fog, reaching max depth, boss room, or escaping fog)
  let toastMsg: string | null = null;
  if (targetNode.bannerTitle.startsWith('SEALED BY ÆTHER FOG')) {
    toastMsg = `${targetNode.bannerTitle} · DEPTH ${graph.loopDepth}/${graph.loopMaxDepth}`;
  } else if (targetNode.nodeType === 'loop' && targetNode.hasFogBoss) {
    toastMsg = `MAX DEPTH ${graph.loopDepth} · FOG BOSS ENCOUNTER (DEFEAT TO CLEAR FOG)`;
  } else if (currentNode.nodeType !== 'loop' && targetNode.nodeType === 'loop') {
    toastMsg = `ENTERING ÆTHER FOG · DEPTH 1/${graph.loopMaxDepth}`;
  } else if (
    targetNode.nodeType === 'loop' &&
    graph.loopDepth >= (graph.loopMaxDepth || 2) &&
    (currentNode.loopDepth || 0) < (graph.loopMaxDepth || 2)
  ) {
    toastMsg = `MAX ÆTHER DEPTH ${graph.loopDepth} · FIND & DEFEAT A BOSS TO ESCAPE`;
  } else if (escapedLoop) {
    toastMsg = `RETRACED OUT OF ÆTHER FOG · ${info.roomTitle.toUpperCase()}`;
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
  // Deeper Æther fog cycles phase-desync barriers faster
  const depthPeriodMult = Math.max(0.45, 1 - loopDepth * 0.12);
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
  // Bog water is corrosive because of the bog biome, not the Æther fog itself
  const isBiomeCorrosive = Boolean(biome.tileRules?.corrosiveWater);
  const baseCorrosionRate = biome.tileRules?.corrosiveDamagePerSec ?? 5.0;
  const corrosionRate = baseCorrosionRate * (1 + loopDepth * 0.25);

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
  loopMaxDepth: number;
  hasFogBoss: boolean;
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
    loopMaxDepth:
      activeNode?.loopMaxDepth || graph.loopMaxDepth || getMaxAetherFogDepth(state),
    hasFogBoss: Boolean(activeNode?.hasFogBoss),
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

// [ORION-ANCHOR: WAYSTATION-WAYGATE-TRAVEL]
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
  state.vx = 0;
  state.vy = 0;
  state.glidePhase = 'idle';
  state.glideFrame = 0;
  state.glideStepIndex = 0;
  state.glideStepTimer = 0;
  state.glideInertiaVx = 0;
  state.glideInertiaVy = 0;
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
  state.vx = 0;
  state.vy = 0;
  state.glidePhase = 'idle';
  state.glideFrame = 0;
  state.glideStepIndex = 0;
  state.glideStepTimer = 0;
  state.glideInertiaVx = 0;
  state.glideInertiaVy = 0;
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
  state.isContinuousBoosting = false;
  state.onGround = true;
  state.vx = 0;
  state.vy = 0;
  state.glidePhase = 'idle';
  state.glideFrame = 0;
  state.glideStepIndex = 0;
  state.glideStepTimer = 0;
  state.glideInertiaVx = 0;
  state.glideInertiaVy = 0;

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
          addOrionInventoryItem(state, 'demantoid_flask', 1);
          const giftedHeater = unlockEquipmentItem(state, 'heater_shield');
          ctx.say(
            giftedHeater
              ? 'LOYALIST: "YOU HONORED BEDIVERE. TAKE THIS HEATER SHIELD & DEMANTOID FLASK!"'
              : 'LOYALIST: "YOU HONORED BEDIVERE. TAKE THIS DEMANTOID FLASK."'
          );
        } else {
          ctx.say('LOYALIST: "MAY AVALON GUARD YOUR CHASSIS, PILOT."');
        }
      }
    } else {
      if (state.salvageScrap >= 15) {
        state.salvageScrap -= 15;
        addOrionInventoryItem(state, 'demantoid_flask', 1);
        const nextGear = resolveContextualEquipmentDrop(state, {
          areaId: state.areaId,
          regionId: state.regionId,
          roomCoord: state.room,
          allowSecondCopy: true,
        });
        if (nextGear) {
          const wasFirstCopy = unlockEquipmentItem(state, nextGear);
          const gName = getWeaponDefinition(nextGear)?.name || nextGear.toUpperCase();
          soundSystem.playPowerup();
          ctx.say(
            wasFirstCopy
              ? `TRADED 15 SCRAP: DEMANTOID FLASK + SALVAGED ${gName.toUpperCase()} UNLOCKED!`
              : `TRADED 15 SCRAP: DEMANTOID FLASK + 2ND COPY OF ${gName.toUpperCase()} (PAIRED STANCE)!`
          );
        } else {
          soundSystem.playCoin();
          ctx.say('TRADED 15 SCRAP FOR DEMANTOID REPAIR FLASK');
        }
      } else {
        soundSystem.playMenuBeep();
        ctx.say('SCAVENGER: "15 SCRAP FOR A DEMANTOID FLASK & SALVAGED HARDPOINT GEAR, PILOT."');
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
      state.x = 120;
      state.y = 88;
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
      state.x = 96;
      state.y = 120;
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
      addOrionInventoryItem(state, 'demantoid_flask', 1);
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

      // Contextual Enemy -> Room -> Area -> Region Equipment & 2nd Copy Resolution
      const unlockedGearId = resolveContextualEquipmentDrop(state, {
        areaId: state.areaId,
        regionId: state.regionId,
        roomCoord: state.room,
        allowSecondCopy: true,
      });
      let gearSuffix = '';
      if (unlockedGearId) {
        const wasFirstCopy = unlockEquipmentItem(state, unlockedGearId);
        const gearName = getWeaponDefinition(unlockedGearId)?.name || unlockedGearId;
        gearSuffix = wasFirstCopy
          ? ` · ${gearName.toUpperCase()}`
          : ` · 2ND ${gearName.toUpperCase()} (PAIRED)`;
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
        state.flags.poe_lantern_gift = true;
        for (const id of [
          'demantoid_flask',
          'grail_water',
          'rusted_gate_key',
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
        { room: '0,0', x: 128, y: 88, label: 'FIRST CAMPFIRE (3 ROOMS FROM POD)' },
        { room: '0,-2', x: 128, y: 88, label: 'POE LANTERN SANCTUARY (5 ROOMS FROM POD)' },
        { room: '3,0', x: 120, y: 96, label: 'MAIN BOG ENTRANCE (6 ROOMS FROM POD)' },
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
