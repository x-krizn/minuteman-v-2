/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const groundTile: TileDefinition = {
  id: 'floor',
  char: '.',
  name: 'Solid Island Soil',
  type: 'floor',
  solid: false,
  blocksHeight: 0,
  bakedTopColor: '#334155',
};

export const mudTile: TileDefinition = {
  id: 'mud',
  char: '~',
  name: 'Corrosive Bog Water',
  type: 'mud',
  solid: false,
  isMud: true,
  isWater: true,
  isCorrosive: true,
  blocksHeight: 0,
  bakedTopColor: '#1e293b',
};

export const sinkholeTile: TileDefinition = {
  id: 'chasm',
  char: '_',
  name: 'Abyssal Sinkhole',
  type: 'chasm',
  solid: false,
  isChasm: true,
  blocksHeight: 0,
  bakedTopColor: '#090d14',
};

export const pylonWallTile: TileDefinition = {
  id: 'pylon_wall',
  char: '#',
  name: 'Ruined Pylon Wall',
  type: 'wall',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#475569',
  bakedFrontColor: '#1e293b',
};

export const desyncWallTile: TileDefinition = {
  id: 'desync_wall',
  char: '%',
  name: 'Desynchronizing Wall',
  type: 'desync_wall',
  solid: true,
  isDesync: true,
  blocksHeight: 2,
  bakedTopColor: '#a855f7',
  bakedFrontColor: '#4c1d95',
};

export const pylonPillarTile: TileDefinition = {
  id: 'pylon_pillar',
  char: 'P',
  name: 'Ruined Pylon',
  type: 'pylon',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#64748b',
  bakedFrontColor: '#334155',
};

export const dropPodTile: TileDefinition = {
  id: 'drop_pod',
  char: 'D',
  name: 'Drop-Pod Crater (Spawn Anchor)',
  type: 'crater',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#f1f5f9', // White anchor
  bakedFrontColor: '#64748b',
};

export const fallenScoutTile: TileDefinition = {
  id: 'fallen_scout',
  char: 'S',
  name: 'Bedivere / Fallen Knight (Setpiece)',
  type: 'scout',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#d946ef', // Magenta anchor
  bakedFrontColor: '#86198f',
};

export const poeLanternTile: TileDefinition = {
  id: 'poe_lantern',
  char: 'L',
  name: 'Poe Lantern Anchor',
  type: 'lantern',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#38bdf8',
  bakedFrontColor: '#0284c7',
};

export const cacheTile: TileDefinition = {
  id: 'cache',
  char: 'C',
  name: 'Scavenger Cache',
  type: 'cache',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#fbbf24',
  bakedFrontColor: '#92400e',
};

export const hiddenSwitchTile: TileDefinition = {
  id: 'hidden_switch',
  char: '1',
  name: 'Hidden Grail Switch',
  type: 'switch',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#4ade80',
  bakedFrontColor: '#166534',
};

export const rustedGateTile: TileDefinition = {
  id: 'rusted_gate',
  char: 'G',
  name: 'Bog Exit / Perimeter Gate',
  type: 'gate',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#38bdf8', // Blue anchor
  bakedFrontColor: '#0369a1',
};

export const cathedralDoorTile: TileDefinition = {
  id: 'cathedral_door',
  char: 'M',
  name: 'Cathedral Dungeon Door (3-Way Gate)',
  type: 'dungeon_door',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#c084fc',
  bakedFrontColor: '#581c87',
};

export const TILE_REGISTRY: Record<string, TileDefinition> = {
  '.': groundTile,
  '~': mudTile,
  '_': sinkholeTile,
  '#': pylonWallTile,
  '%': desyncWallTile,
  P: pylonPillarTile,
  D: dropPodTile,
  S: fallenScoutTile,
  L: poeLanternTile,
  C: cacheTile,
  '1': hiddenSwitchTile,
  '2': { ...hiddenSwitchTile, char: '2', name: 'Cathedral Altar Switch' },
  '3': { ...hiddenSwitchTile, char: '3', name: 'Barracks Armory Switch' },
  G: rustedGateTile,
  M: cathedralDoorTile,
};

export function getTileDefinition(char: string): TileDefinition {
  return TILE_REGISTRY[char] || groundTile;
}

