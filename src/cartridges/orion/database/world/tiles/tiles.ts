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
  name: 'Deep Marsh Mud',
  type: 'mud',
  solid: false,
  isMud: true,
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
  name: 'Fallen Scout (Micro-Setpiece)',
  type: 'scout',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#d946ef', // Magenta anchor
  bakedFrontColor: '#86198f',
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

export const rustedGateTile: TileDefinition = {
  id: 'rusted_gate',
  char: 'G',
  name: 'Rusted Gate (Transition Anchor)',
  type: 'gate',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#38bdf8', // Blue anchor
  bakedFrontColor: '#0369a1',
};

export const TILE_REGISTRY: Record<string, TileDefinition> = {
  '.': groundTile,
  '~': mudTile,
  '_': sinkholeTile,
  '#': pylonWallTile,
  P: pylonPillarTile,
  D: dropPodTile,
  S: fallenScoutTile,
  C: cacheTile,
  G: rustedGateTile,
};

export function getTileDefinition(char: string): TileDefinition {
  return TILE_REGISTRY[char] || groundTile;
}
