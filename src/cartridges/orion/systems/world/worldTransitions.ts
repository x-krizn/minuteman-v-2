/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { getRoomDimensions, getRoomDoorwayCenterPx } from '../../constants';
import {
  AREA_REGISTRY,
  getAreaDefinition,
  getBiomeDefinition,
  getMapDefinition,
  getRegionDefinition,
  GLOBAL_ROOM_REGISTRY,
  WAYGATE_REGISTRY,
  WAYSTATION_REGISTRY,
} from '../../database/world';
import {
  AetherCardinalDir,
  AetherEndFeature,
  AetherFogGraphState,
  AetherGraphNode,
  AetherNodeType,
  OrionCombatContext,
  OrionState,
} from '../../types';
import { spawnEnemyByType, spawnRoomEnemies } from '../entitySystem';
import { notifyOrionStateChange, syncStateGates } from '../playerSystem';
import {
  ALL_CARDINAL_DIRS,
  buildEndNodeCacheDefinition,
  buildLoopNodeCacheDefinition,
  decorateDynamicRoomGrid,
  getOppositeCardinalDir,
  getUndefinedZoneSealReason,
  KEY_NODE_ROUTES,
  ORION_CACHE_DEFINITIONS,
  ORION_ROOM_METADATA,
  ORION_TUTORIAL_ROOMS,
  ROOM_REGISTRY,
} from './roomLoader';
import { getCanonicalRoomPersistenceKey } from './worldPersistence';

export { getRoomDoorwayCenterPx };

// [ORION-ANCHOR: AETHER-FOG-TOPOLOGY]
// ─── AETHER FOG 5-NODE GRAPH ENGINE & WORLD TRANSITIONS ──────────────────────

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

  if (currentNode.nodeType === 'loop') {
    const transInfo = getDoorwayAetherTransitionInfo(state, dir);

    if (transInfo.nextDepth === 0) {
      const escapeTarget = resolveSafeEmergenceNode(graph, currentNode);
      currentNode.edges[dir] = escapeTarget.id;
      return { targetNode: escapeTarget, isLoopCycle: false, escapedLoop: true };
    }

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

  const existingTargetId = currentNode.edges[dir];
  if (existingTargetId && graph.nodes[existingTargetId] && rooms[existingTargetId]) {
    const targetNode = graph.nodes[existingTargetId];
    return {
      targetNode,
      isLoopCycle: targetNode.nodeType === 'loop',
      escapedLoop: false,
    };
  }

  if (currentNode.nodeType === 'end') {
    const parentId = currentNode.parentNodeId || '0,0';
    const parentNode = graph.nodes[parentId] || graph.nodes['0,0'];
    currentNode.edges[dir] = parentNode.id;
    return { targetNode: parentNode, isLoopCycle: false, escapedLoop: false };
  }

  const maxDepth = getMaxAetherFogDepth(state);

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

    const sideNode = createDynamicAetherNode(rooms, state, currentNode, dir, 'side', {
      sourceKeyCoord: currentNode.sourceKeyCoord,
      targetKeyCoord: currentNode.targetKeyCoord,
      routeStep: currentNode.routeStep,
      routeTotal: currentNode.routeTotal,
    });
    currentNode.edges[dir] = sideNode.id;
    return { targetNode: sideNode, isLoopCycle: false, escapedLoop: false };
  }

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

export function clearAetherFogOnBossDefeat(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx?: OrionCombatContext
): void {
  const graph = ensureAetherFogGraph(state);
  const currentNode = getActiveAetherNode(state);
  const safeTarget = resolveSafeEmergenceNode(graph, currentNode);

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
