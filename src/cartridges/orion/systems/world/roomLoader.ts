/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getRoomDimensions } from '../../constants';
import {
  AREA_REGISTRY,
  getAreaDefinition,
  getBiomeDefinition,
  getRegionDefinition,
  GLOBAL_ROOM_REGISTRY,
  LOCAL_ROOM_REGISTRY,
  MAP_REGISTRY,
  REGION_REGISTRY,
} from '../../database/world';
import {
  AetherCardinalDir,
  AetherEndFeature,
  AetherNodeType,
  ContextualLootPool,
  RoomDefinition,
  RoomLightingProfile,
} from '../../types';

// ─── 1. 5-TIER NESTED WORLD COMPOSER & ROOM REGISTRIES ───────────────────────

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

export const ALL_CARDINAL_DIRS: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];

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

export interface KeyNodeRouteDescriptor {
  targetKeyCoord: string;
  routeTotal: number;
  isDirectEndNode?: boolean;
}

// [ORION-ANCHOR: WORLD-KEY-ROUTES]
export const KEY_NODE_ROUTES: Record<
  string,
  Partial<Record<AetherCardinalDir, KeyNodeRouteDescriptor>>
> = {
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
export function getUndefinedZoneSealReason(coordOrNodeId: string): string | null {
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

export function getPrimaryKeyExitDir(coord: string): AetherCardinalDir | undefined {
  const routes = KEY_NODE_ROUTES[coord];
  if (!routes) return undefined;
  if (routes.E) return 'E';
  if (routes.S) return 'S';
  if (routes.N) return 'N';
  if (routes.W) return 'W';
  return undefined;
}

function isDoorwayOpeningChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return ch !== '#' && ch !== 'P' && ch !== '_';
}

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

export function buildEndNodeCacheDefinition(feature: AetherEndFeature): OrionCacheDefinition {
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

export function buildLoopNodeCacheDefinition(
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

export function decorateDynamicRoomGrid(
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

  if (!biomeHasCorrosiveWater) {
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (matrix[y][x] === '~') {
          matrix[y][x] = ':';
        }
      }
    }
  }

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

  if (nodeType === 'loop') {
    const effDepth = Math.max(1, loopDepth || 1);
    const hazardChar = biomeHasCorrosiveWater ? '~' : '_';

    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (matrix[y][x] === 'E' || matrix[y][x] === 'o' || matrix[y][x] === 's') {
          matrix[y][x] = '.';
        }
      }
    }

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

    if (effDepth === 1) {
      const cacheY = Math.min(rows - 3, midY + 3);
      if (matrix[cacheY] && matrix[cacheY][midX] === '.') {
        matrix[cacheY][midX] = 'C';
      }
    }

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

    const chestRow = Math.max(2, midY - 3);
    if (effDepth >= 2 && matrix[chestRow] && matrix[chestRow][midX] === '.') {
      matrix[chestRow][midX] = 'V';
      if (matrix[chestRow][midX - 1] === '.') matrix[chestRow][midX - 1] = ':';
      if (matrix[chestRow][midX + 1] === '.') matrix[chestRow][midX + 1] = ':';
    }
  }

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
