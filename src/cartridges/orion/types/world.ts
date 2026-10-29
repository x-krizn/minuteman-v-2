/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Base64SpriteConfig, LightSourceConfig, WorldScope } from './common';
import type { OrionState } from './state';

// 2.5D World Tile
export type OrionTileType =
  | 'floor'
  | 'wall'
  | 'chasm'
  | 'mud'
  | 'water'
  | 'pylon'
  | 'crater'
  | 'reeds'
  | 'scout'
  | 'gate'
  | 'cache'
  | 'barricade'
  | 'desync_wall'
  | 'lantern'
  | 'switch'
  | 'dungeon_door'
  | 'waystation'
  | 'waygate';

export type BiomeWeatherType = 'none' | 'rain' | 'ash' | 'aether_mist';

export interface BiomePostProcessConfig {
  /** Ambient darkness veil opacity 0..0.75 (carved out by dynamic lights) */
  ambientDarkness?: number;
  /** Additive radial bloom multiplier 0..1.0 */
  bloomIntensity?: number;
  /** Atmospheric weather effect layer */
  weather?: BiomeWeatherType;
  /** Weather particle density multiplier 0..1.0 */
  weatherIntensity?: number;
  /** Render planar flipped + ripple-sheared reflections on Corrosive Aether / Bog Water ('~') */
  liquidReflection?: boolean;
  /** Optional per-biome CRT scanline pass */
  scanlines?: boolean;
}

export interface BiomeTileRules {
  corrosiveWater: boolean;
  corrosiveDamagePerSec: number;
  mudSlowMultiplier: number;
  desyncPeriodSec: number;
  aetherMistDensity: number;
}

export interface BiomeTileAssets {
  groundPrimary: string;
  groundSecondary: string;
  mudColor: string;
  waterColor: string;
  waterRippleColor: string;
  pylonTop: string;
  pylonFront: string;
  pylonTrim: string;
  shadow: string;
  lightColor: string;
}

// [ORION-ANCHOR: TYPES-WORLD-HIERARCHY]
export type ClusterTerrainType = 'dirt' | 'grass' | 'aether' | 'ruins' | 'mire';

export interface BiomeDefinition {
  id: string;
  name: string;
  scope: WorldScope;
  world: string;
  description: string;
  /** Maps tile characters (e.g. '.', ',', '~', ':', '#') to TileDefinition IDs for rooms in this biome */
  tileTypes: Record<string, string>;
  /** Optional biome-scoped enemy spawn character overrides (maps ASCII char -> EnemyWikiDefinition.type) */
  enemySpawnTypes?: Record<string, string>;
  /** Physics and environmental rules supplied by this biome to its rooms */
  tileRules: BiomeTileRules;
  /** Visual tile asset colors and lighting supplied by this biome to its rooms */
  tileAssets: BiomeTileAssets;
  /** Optional 4x5 (3x3-cluster, 192x240px) Base64 PNG or offscreen-baked biome tileset key for automatic 8-neighbor auto-tiling */
  clusterTileSheetBase64?: string;
  /** Default base terrain ('dirt' | 'grass' | 'aether' | 'ruins') when auto-tiling non-terrain cells */
  defaultClusterTerrain?: ClusterTerrainType;
  /** Optional post-processing, lighting, reflection, and weather layer configuration */
  postProcess?: BiomePostProcessConfig;
  lightColor: string;
}

export interface TileDefinition {
  id: string;
  char: string;
  name: string;
  type: OrionTileType;
  solid: boolean;
  isMud?: boolean;
  isWater?: boolean;
  isChasm?: boolean;
  isCorrosive?: boolean;
  isDesync?: boolean;
  blocksHeight: number;
  bakedTopColor?: string;
  bakedFrontColor?: string;
  /** Optional cluster auto-tiler terrain role ('dirt' | 'grass' | 'aether' | 'ruins') */
  clusterTerrain?: ClusterTerrainType;
  /** Optional sub-tile rearrangement granularity ('4x4' 4px micro-blocks or '2x2' 8px quadrants) */
  subTileMode?: '4x4' | '2x2';
  /** Optional embedded 16x16px Base64 PNG seed tile used by the Sub-Tile Micro-Composer */
  baseTileBase64?: string;
  /** Optional dynamic light source emitted by this tile/prop in the post-processing pass */
  lightSource?: LightSourceConfig;
  /** Optional 1px pixel-art outline color for Layer 2 props */
  outlineColor?: string;
  /** Optional embedded Base64 PNG or grid tilemap slice for Layer 0 ground/liquid */
  layer0Sprite?: Base64SpriteConfig;
  /** Optional embedded Base64 PNG or grid tilemap slice for Layer 1 walls/barriers */
  layer1Sprite?: Base64SpriteConfig;
  /** Optional embedded Base64 PNG or grid spritesheet slice for Layer 2 2.5D props */
  propSprite?: Base64SpriteConfig;
  /** Optional dynamic solid check (e.g. for locked gates or doors) */
  checkSolid?: (state: OrionState, roomKey: string) => boolean;
  renderLayer0?: (
    g: CanvasRenderingContext2D,
    tx: number,
    ty: number,
    sx: number,
    sy: number,
    state: OrionState
  ) => void;
  renderLayer1?: (
    g: CanvasRenderingContext2D,
    tx: number,
    ty: number,
    sx: number,
    sy: number,
    state: OrionState
  ) => void;
  renderProp25D?: (
    g: CanvasRenderingContext2D,
    tx: number,
    ty: number,
    sx: number,
    sy: number,
    state: OrionState
  ) => void;
}

export type AetherNodeType = 'key' | 'general' | 'side' | 'loop' | 'end';
export type AetherCardinalDir = 'N' | 'S' | 'E' | 'W';
export type AetherEndFeature = 'loot_cache' | 'mini_boss' | 'secret_switch' | 'dead_end';

export interface AetherGraphNode {
  id: string;
  nodeType: AetherNodeType;
  coord: string;
  title: string;
  bannerTitle: string;
  regionId: string;
  areaId: string;
  mapId: string;
  biomeId: string;
  /** Source and target key node coordinates when on a connecting route */
  sourceKeyCoord?: string;
  targetKeyCoord?: string;
  /** Current and total general-node steps along a route (side & loop nodes do not advance step) */
  routeStep?: number;
  routeTotal?: number;
  /** The doorway direction that advances the true general path or escapes a loop/side/end node */
  trueExitDir?: AetherCardinalDir;
  /** Entry doorway direction used to step back into the parent node */
  returnDir?: AetherCardinalDir;
  /** Parent node ID for side, loop, and end nodes (points to previous room when retracing steps) */
  parentNodeId?: string;
  /** Safe main-path room ID where the pilot entered the Æther Fog pocket (returned to when a max-depth boss is defeated) */
  anchorSafeNodeId?: string;
  /** Map-relative X/Y coordinates for mini-map and relative Aether loop positioning */
  mapRx?: number;
  mapRy?: number;
  /** Current Æther fog depth (0 = safe, 1 .. clvl + 1) */
  loopDepth?: number;
  /** Room step within current depth tier (1 .. loopDepth when loopDepth < loopMaxDepth, or room index at max depth) */
  loopStage?: number;
  /** Maximum Æther fog depth for the pocket (clvl + 1) */
  loopMaxDepth?: number;
  /** True if this max-depth room rolled a Fog Boss spawn (frequency = 1 / (clvl + 1)) */
  hasFogBoss?: boolean;
  /** In descending loop rooms (stage 4 or 5), doorway direction that pulls back into deeper Aether density */
  relapseDir?: AetherCardinalDir;
  /** Resolved cardinal doorway transitions persisted until Waystation rest */
  edges: Partial<Record<AetherCardinalDir, string>>;
  /** Rolled reward/encounter feature when nodeType === 'end' */
  endFeature?: AetherEndFeature;
  /** Optional generated grid for dynamic chunks so save/load restores them cleanly */
  grid?: string[];
}

export interface AetherFogGraphState {
  seed: number;
  nextCounter: number;
  activeNodeId: string;
  loopDepth: number;
  loopStage?: number;
  loopMaxDepth?: number;
  maxDepthNonBossStreak?: number;
  nodes: Record<string, AetherGraphNode>;
}

export type RoomSafetyTier = 'sanctuary' | 'trail' | 'hazard' | 'abyss';

export interface RoomLightingProfile {
  safetyTier?: RoomSafetyTier;
  /** Ambient darkness veil 0..0.85 (lower in safe sanctuaries, higher in hazard/abyss rooms) */
  ambientDarkness?: number;
  /** Corner ambient occlusion intensity 0..0.95 */
  cornerShadowIntensity?: number;
  /** Base player vision & threat awareness radius in pixels before Optics/Lantern bonuses */
  playerVisionRadiusPx?: number;
  /** Optional warm/cool ambient tint color for safe sanctuaries or deep hazards */
  ambientTintColor?: string;
}

export interface ContextualLootPool {
  /** Canonical weapon / shield / hardware IDs dropped or salvaged in this context */
  equipmentIds?: string[];
  /** Gemstone IDs favored in this context */
  gemIds?: string[];
  /** Consumable or key item IDs favored in this context */
  consumableIds?: string[];
  /** Base probability (0..1) of rolling an equipment drop on enemy kill or cache open */
  equipmentDropChance?: number;
}

export interface RoomDefinition {
  id?: string;
  scope?: WorldScope;
  nodeType?: AetherNodeType;
  coord: string;
  mapId?: string;
  areaId: string;
  regionId?: string;
  biomeId?: string;
  title: string;
  bannerTitle: string;
  /** Optional environmental storytelling landmark subtitle */
  landmarkLabel?: string;
  /** Optional room-level lighting, corner shadow, and player vision profile */
  lighting?: RoomLightingProfile;
  /** Optional room-specific contextual loot pool override */
  lootPool?: ContextualLootPool;
  /** Optional explicit grid column/row dimensions (derived automatically from grid if omitted) */
  cols?: number;
  rows?: number;
  /** True if this room uses dynamic 10x10 screen chunk streaming (100x90 tiles) */
  isChunkedExpanse?: boolean;
  grid: string[];
  /** Allowed doorway directions for global procedural template rooms */
  doorDirs?: Array<'N' | 'S' | 'E' | 'W'>;
  cache?: {
    scrap: number;
    items: Array<{ itemId: string; count: number }>;
    toast: string;
  };
}

export interface MapProceduralRoomSlot {
  coord: string;
  globalRoomId?: string;
  biomeId?: string;
  title?: string;
  bannerTitle?: string;
}

export type UniverseWorldTier = 'major' | 'minor' | 'unstable';
export type UniverseCanonOrigin = 'canon' | 'non-canon';
export type DesignSpecStatus = 'LOCKED' | 'UNDEFINED';

export interface ZoneFeatureSpec {
  name: string;
  detail?: string;
  status: DesignSpecStatus;
  openDesignId?: string;
  coord?: string;
}

export interface MapDefinition {
  id: string;
  name: string;
  title: string;
  scope: WorldScope;
  areaId: string;
  biomeId: string;
  description: string;
  /** Canonical coordinates of bespoke local rooms assembled into this map */
  localRoomCoords: string[];
  /** Coordinates filled by global rooms (procedural generation / hybrid stitching) */
  globalRoomSlots: MapProceduralRoomSlot[];
  /** Connected neighboring Map IDs for continuous on-foot traversal */
  connectedMapIds: string[];
  /** Design specification status (LOCKED vs UNDEFINED) */
  specStatus?: DesignSpecStatus;
  /** Source design document reference (e.g., bog-v2.md, border-town-v1.md, mapping-v0.md) */
  docRef?: string;
  /** Open design issue identifier if UNDEFINED (e.g., OD-BOG-01, OD-BT-01) */
  openDesignId?: string;
  /** Documented sub-features or sub-zones within this map/zone */
  zoneFeatures?: ZoneFeatureSpec[];
}

export interface UniverseWorldDefinition {
  id: string;
  index?: number;
  name: string;
  subtitle?: string;
  theme: string;
  tier: UniverseWorldTier;
  /** 'canon' = original story; 'non-canon' = derived of folklore, mythology, etc. */
  origin: UniverseCanonOrigin;
  specStatus: DesignSpecStatus;
  docRef?: string;
  hasZoneDocs: boolean;
  regionIds: string[];
  lore: string;
}

export interface WaystationNode {
  id: string;
  name: string;
  regionId: string;
  areaId: string;
  mapId: string;
  room: string;
  x: number;
  y: number;
  lore: string;
}

export interface WaygateNode {
  id: string;
  name: string;
  world: string;
  regionId: string;
  areaId: string;
  mapId: string;
  room: string;
  x: number;
  y: number;
  desyncStatus: 'Synchronized' | 'Drifting' | 'Severe Desync';
  lore: string;
}

export interface AreaWikiDefinition {
  id: string;
  name: string;
  title: string;
  scope: WorldScope;
  regionId: string;
  biomeId: string;
  world: string;
  recommendedLevels: string;
  description: string;
  lore: string;
  /** Local maps unique to this area */
  localMapIds: string[];
  /** Global maps used in procedural generation within this area */
  globalMapIds: string[];
  /** Connected neighboring Area IDs for continuous on-foot traversal */
  connectedAreaIds: string[];
  spawnAnchor: { room: string; x: number; y: number };
  exitAnchor: { room: string; x: number; y: number };
  waystation?: WaystationNode;
  /** Design specification status (LOCKED vs UNDEFINED) */
  specStatus?: DesignSpecStatus;
  /** Source design document reference (e.g., bog-v2.md, border-town-v1.md, mapping-v0.md) */
  docRef?: string;
  /** Open design issue identifier if UNDEFINED (e.g., OD-BOG-01, OD-BT-01) */
  openDesignId?: string;
  /** Documented sub-features or sub-zones within this area */
  zoneFeatures?: ZoneFeatureSpec[];
  /** Area-specific equipment, gemstone, and consumable loot table */
  lootPool?: ContextualLootPool;
}

export interface RegionDefinition {
  id: string;
  name: string;
  title: string;
  scope: WorldScope;
  world: string;
  culture: string;
  defaultBiomeId: string;
  desyncStatus: 'Synchronized' | 'Drifting' | 'Severe Desync';
  description: string;
  lore: string;
  /** Local areas unique to this region */
  localAreaIds: string[];
  /** Global areas used in procedural generation within this region */
  globalAreaIds: string[];
  /** Connected neighboring Region IDs for continuous on-foot traversal */
  connectedRegionIds: string[];
  waygate?: WaygateNode;
  /** Region-wide fallback equipment, gemstone, and consumable loot table */
  lootPool?: ContextualLootPool;
}
