/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundSystem } from '../../engine/core/soundSystem';

// 8-way directional navigation
export type OrionDir = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

// Six Canonical Trait Lines
export type TraitLine = 'Warrior' | 'Marauder' | 'Guardian' | 'Rogue' | 'Wizard' | 'Cleric';

// Reactor Families
export type ReactorFamily = 'Ichor' | 'Mana' | 'Ether';

// Damage Taxonomy (LOCKED: Kinetic & Energy families)
export type DamageFamily = 'Kinetic' | 'Energy';
export type DamageType = 'Pierce' | 'Impact' | 'Blast' | 'Beam' | 'Pulse' | 'Wave';

// Armor Taxonomy
export type ArmorType = 'Ablative' | 'Reactive' | 'Hardened' | 'Layered';

// Defense Layer 1: Shields
export interface ShieldState {
  type: 'energy' | 'physical';
  capacity: number;
  maxCapacity: number;
  overloaded: boolean;
  overloadTimer: number;
  rechargeDelay: number;
}

// Defense Layer 2: Armor (Threshold, Rating, Degrading Durability)
export interface ArmorState {
  type: ArmorType;
  threshold: number; // Hits below threshold stopped completely
  rating: number; // Flat reduction on penetrating hits
  durability: number; // Current durability
  maxDurability: number; // Base durability
}

// Defense Layer 3: Frame Integrity (Static 200 HP)
export interface FrameState {
  integrity: number; // 200 base
  maxIntegrity: number; // 200 base (Static stats law)
  state: 'Operational' | 'Critical' | 'Defeated'; // <= 20% (40 HP) is Critical
}

// Loot drop entry
export interface LootEntry {
  itemId: string;
  chance: number;
  count?: number;
}

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

export type WorldScope = 'global' | 'local';

/**
 * Declarative Base64 PNG Sprite or Grid Spritesheet / Tilemap Configuration.
 * Supports both standalone Base64 PNGs and grid-sliced atlases/animation strips.
 */
export interface Base64SpriteConfig {
  /** Full `data:image/png;base64,...` URI, raw Base64 PNG payload, or registered atlas key */
  base64: string;
  /** Cell width in pixels when slicing a grid spritesheet or tilemap (defaults to full image width) */
  cellWidth?: number;
  /** Cell height in pixels when slicing a grid spritesheet or tilemap (defaults to full image height) */
  cellHeight?: number;
  /** Column index (0-based) in a grid tilemap or spritesheet */
  col?: number;
  /** Row index (0-based) in a grid tilemap or spritesheet */
  row?: number;
  /** Optional animation frame count (advances horizontally from `col` to `col + frameCount - 1`) */
  frameCount?: number;
  /** Optional animation speed in frames per second (default: 6) */
  fps?: number;
  /** Optional directional row mapping for 4-dir or 8-dir spritesheets */
  dirRowMap?: Partial<Record<OrionDir, number>>;
  /** Optional state row mapping for enemies (e.g. idle, patrol, windup, attack, recovery, stagger) */
  stateRowMap?: Record<string, number>;
  /** Destination render width in canvas pixels (defaults to cellWidth or image width) */
  renderWidth?: number;
  /** Destination render height in canvas pixels (defaults to cellHeight or image height) */
  renderHeight?: number;
  /** Pixel X offset from anchor point */
  offsetX?: number;
  /** Pixel Y offset from anchor point */
  offsetY?: number;
  /** Optional uniform scale multiplier (default: 1) */
  scale?: number;
  /** Anchor mode: 'top-left' (default for tiles) or 'bottom-center' (default for 2.5D props/entities) */
  anchor?: 'top-left' | 'center' | 'bottom-center';
  /** Optional 1px pixel-art silhouette outline color baked automatically offscreen */
  outlineColor?: string;
  /** If true, sprite is authored facing East ('E') and uses 2D canvas transforms for other directions */
  orientFromEast?: boolean;
}

export interface LightSourceConfig {
  color: string;
  radius: number;
  intensity?: number;
  pulseSpeed?: number;
  offsetY?: number;
}

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

export type ActionEffectStyle =
  | 'slash'
  | 'chop'
  | 'thrust'
  | 'slam'
  | 'bash'
  | 'whirlwind'
  | 'shockwave'
  | 'claw_bite'
  | 'volley';

export interface BladeTrailEffect {
  x: number;
  y: number;
  z: number;
  angle: number;
  arcSpan: number;
  radius: number;
  color: string;
  coreColor?: string;
  life: number;
  maxLife: number;
  flipDir?: boolean;
  style?: ActionEffectStyle;
  /** Linear reach for thrust/lunge corridors or forward offset for slams */
  length?: number;
  /** Corridor width for thrusts, shield wall width for bashes, or impact radius for slams */
  width?: number;
  /** Optional inner radius for shockwaves or thick cleaves */
  innerRadius?: number;
  /** True when emitted by an enemy attack */
  isEnemy?: boolean;
}

export interface BiomeTilesetCell {
  col: number;
  row: number;
  cellWidth?: number;
  cellHeight?: number;
  frameCount?: number;
  fps?: number;
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

export type ClusterTerrainType = 'dirt' | 'grass' | 'aether' | 'ruins';

export interface BiomeDefinition {
  id: string;
  name: string;
  scope: WorldScope;
  world: string;
  description: string;
  /** Maps tile characters (e.g. '.', ',', '~', ':', '#') to TileDefinition IDs for rooms in this biome */
  tileTypes: Record<string, string>;
  /** Physics and environmental rules supplied by this biome to its rooms */
  tileRules: BiomeTileRules;
  /** Visual tile asset colors and lighting supplied by this biome to its rooms */
  tileAssets: BiomeTileAssets;
  /** Optional 4x5 (3x3-cluster, 192x240px) Base64 PNG or offscreen-baked biome tileset key for automatic 8-neighbor auto-tiling */
  clusterTileSheetBase64?: string;
  /** Default base terrain ('dirt' | 'grass' | 'aether' | 'ruins') when auto-tiling non-terrain cells */
  defaultClusterTerrain?: ClusterTerrainType;
  /** Optional shared Base64 PNG tilemap / atlas for this biome */
  tileSheetBase64?: string;
  /** Default grid cell size in pixels for tileSheetBase64 (default: 16) */
  tileSheetCellSize?: number;
  /** Optional mapping of tile char ('.', '~', '#') or tile ID to [col, row] cell in tileSheetBase64 */
  tileSheetCoords?: Record<string, BiomeTilesetCell>;
  /** Optional post-processing, lighting, reflection, and weather layer configuration */
  postProcess?: BiomePostProcessConfig;
  /** Legacy palette alias for backward compatibility */
  palette: {
    ground: string;
    mud: string;
    water: string;
    pylonTop: string;
    pylonFront: string;
    shadow: string;
  };
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
  /** Parent node ID for side, loop, and end nodes */
  parentNodeId?: string;
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
  nodes: Record<string, AetherGraphNode>;
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
  /** Optional explicit grid column/row dimensions (derived automatically from grid if omitted) */
  cols?: number;
  rows?: number;
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
}

export type FrameLoadCapacity = 'light' | 'medium' | 'heavy' | 'superheavy';
export type WeaponWeightClass = 'light' | 'medium' | 'heavy';
export type LevelBand = 'Lesson' | 'Challenge' | 'Expression';

export type GemId =
  | 'moonstone'
  | 'spinel'
  | 'carnelian'
  | 'titanite'
  | 'demantoid'
  | 'kyanite'
  | 'charoite'
  | 'rubellite'
  | 'hematite';

export interface GemDefinition {
  id: GemId;
  name: string;
  colorName: string;
  hexColor: string;
  coreHexColor?: string;
  /** Column index (0..8) defined by Row 2 of the equipment & gem matrix */
  colIndex: number;
  /** Self-contained 16x16 Base64 PNG icon for this gemstone */
  iconBase64: string;
  assignment: string;
  identity: string;
  primaryResource: 'Heat' | 'Presence' | 'Energy' | 'n/a';
  reactor: ReactorFamily | 'n/a';
  fundsSkills: TraitLine[];
}

export type PilotSkillId = TraitLine;
export type FeatTier = 'I' | 'II' | 'III' | 'IV' | 'V';
export type FeatKind = 'system' | 'interface';

export interface PilotSkillProgress {
  id: PilotSkillId;
  name: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  relatedEquipment: string;
  gemsInvested?: number;
  fundingGems?: GemId[];
}

export interface FrameFeatDefinition {
  id: string;
  name: string;
  tier: FeatTier;
  kind: FeatKind;
  requiredSkillId: PilotSkillId;
  requiredSkillLevel: number;
  gainDescription: string;
  costDescription: string;
  /** Specific Trait + Reactor Gem Socket requirements (retained in build, refunded on unsocket) */
  gemSockets: Array<{ gemId: GemId; count: number }>;
  /** Equipment or mod capability unlocked by this feat */
  unlocksDescription?: string;
  /** For system feats: how many steps (+1) this raises frame load capacity */
  loadStepUp?: number;
  /** For interface feats: zero-sum static budget modifiers */
  modifiers?: {
    damageMult?: number;
    heatGenMult?: number;
    shieldCapDelta?: number;
    moveSpeedMult?: number;
    swapTimeMult?: number;
    heatVentMult?: number;
    armorDurabilityDelta?: number;
    cooldownMult?: number;
    accuracyMult?: number;
  };
}

export interface ActionModificationDefinition {
  id: string;
  name: string;
  targetCategory: 'ranged' | 'melee' | 'mobility' | 'all';
  gainDescription: string;
  drawbackDescription: string;
  /** 1-2 Gem cost permanently spent to generate this mod (mod is retained, gems are not) */
  gemCost: Array<{ gemId: GemId; count: number }>;
  modifiers: {
    extraProjectiles?: number;
    tellDurationMult?: number;
    extraDashDurationSec?: number;
    heatCostDelta?: number;
    hyperArmorWindup?: boolean;
    cooldownMult?: number;
  };
}

export interface OrionEquipmentSlots {
  /** Weapon Set 1 (2 slots, or 1 if two-handed) -> Actions 1-5 */
  weaponSet1: [string, string | null];
  /** Weapon Set 2 (2 slots, or 1 if two-handed) -> Actions 1-5 */
  weaponSet2: [string, string | null];
  /** Utility Slot (1 slot, sustain heal/repair) -> Action 6 */
  utility: string | null;
  /** Aux Slots (4 slots: specialized offensive/defensive/passive) -> Shared Actions 7-10 */
  aux: [string | null, string | null, string | null, string | null];
  /** Belt Slots (4 slots: stackable consumables) -> Shared Actions 7-10 */
  belt: [string | null, string | null, string | null, string | null];
  /** Armor & Generator Chassis Pieces */
  armor: {
    head: string;
    torso: string;
    arms: string;
    legs: string;
    generator: string;
  };
  /** Action Modifications installed per action slot key */
  installedMods: Record<string, string>;
  /** Action Modifications permanently generated via Gem synthesis and retained by the pilot */
  unlockedMods?: string[];
  /** Weapons, shields, and quivers discovered, salvaged, or unlocked by this pilot */
  unlockedEquipment?: string[];
  /** Per-weapon/shield/quiver Gem modification (null/undefined = unmodified Col 0; GemId = Col 0..8 & VFX color) */
  weaponGemMods?: Record<string, GemId | null>;
}

export interface LoadPenaltySummary {
  frameLoad: FrameLoadCapacity;
  weaponWeight: WeaponWeightClass;
  mobilityMult: number;
  heatMult: number;
  swapTimeMult: number;
  accuracyMult: number;
  stealthBroken: boolean;
  label: string;
}

// Trait Line Wiki Definition
export interface TraitLineWikiDefinition {
  id: TraitLine;
  name: string;
  /** Canonical Frame Model designation (e.g. PNSY W416, RAD HAU, Trinity DE-14) */
  frameModel?: string;
  /** Canonical base weight / load capacity class ('light' | 'medium' | 'heavy' | 'superheavy') */
  weightClass?: FrameLoadCapacity;
  /** Class default utility sustain item unlocked at Level 6 */
  defaultUtilityItem?: string;
  reactor: ReactorFamily;
  defaultDamageStyle: DamageType;
  identity: string;
  lore: string;
  baseShield: { type: 'energy' | 'physical'; capacity: number };
  baseArmor: { type: ArmorType; threshold: number; rating: number; durability: number };
  startingWeapons: string[];
  /** Optional embedded Base64 PNG sprite or directional spritesheet for the player mech */
  sprite?: Base64SpriteConfig;
}

// Moveset Action (One atomic unit of a 5-action moveset)
export interface ActionDefinition {
  slot: 0 | 1 | 2 | 3 | 4; // Skill 0 = Auto-attack, Skills 1-4 = Active abilities
  name: string;
  damageType: DamageType;
  damageFamily: DamageFamily;
  damage: number;
  tellDurationSec: number; // Every ability has a tell (windup)
  actionDurationSec: number;
  cooldownSec: number;
  heatCost: number;
  range: number;
  description: string;
  execute?: (state: OrionState, ctx: OrionCombatContext) => void;
}

// Weapon / Shield / Quiver Definition
export interface WeaponDefinition {
  id: string;
  name: string;
  class: string;
  /** Archetype role ('melee' | 'ranged' | 'shield' | 'quiver') */
  equipmentRole?: 'melee' | 'ranged' | 'shield' | 'quiver';
  /** Canonical weapon weight class ('light' | 'medium' | 'heavy') for the §3.4 Load Model */
  weightClass?: WeaponWeightClass;
  /** Passive Shield Capacity bonus when equipped (e.g. Heater / Buckler / Pavise shields) */
  passiveShieldBonus?: number;
  /** Default blade trail or projectile color when unmodified */
  bladeTrailColor?: string;
  description: string;
  lore: string;
  shotsPerChain: number; // 9 for Gladius Boltcaster
  damagePerShot: number; // 6 for Gladius (BCU = 54)
  chainDurationSec: number; // 1.5s
  reloadDurationSec: number; // 3.15s
  primaryDamageType: DamageType;
  moveset: ActionDefinition[]; // 5 actions
  /** Self-contained 144x16 (9 cols x 16px) Base64 PNG strip for Col 0..8 Gem variants */
  variantStripBase64?: string;
  /** Self-contained 16x16 Base64 PNG icons indexed by column (0..8) or GemId */
  gemVariantBase64?: Record<GemId, string>;
  /** Optional embedded Base64 PNG or directional spritesheet for the mech hardpoint */
  hardpointSprite?: Base64SpriteConfig;
  /** Optional embedded Base64 PNG icon for UI displays */
  iconSprite?: Base64SpriteConfig;
  renderHardpoint25D?: (
    g: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    dirDx: number,
    dirDy: number,
    state: OrionState
  ) => void;
}

// Enemy / NPC / Spirit Entity
export interface EnemyEntity {
  id: number;
  type: string;
  name: string;
  x: number;
  y: number;
  z: number;
  vz: number;
  shields: ShieldState;
  armor: ArmorState;
  frame: FrameState;
  dir: OrionDir;
  speed: number;
  damage: number;
  damageType: DamageType;
  stun: number;
  hurt: number;
  t: number;
  state: 'idle' | 'patrol' | 'windup' | 'attack' | 'recovery' | 'stagger';
  stateTimer: number;
  attackCd: number;
  tellRadius?: number;
  isFlying?: boolean;
  emissiveColor?: string;
  // Belldor Stage 1 & 2 AI State
  isSubmerged?: boolean; // Bog Wurm / Lady of the Lake submerged stealth
  hitsLanded?: number; // Bors stacking +10% damage per hit landed
  enraged?: boolean; // Bors <50% HP Grail Enrage
  faction?: 'hostile' | 'camelot' | 'orc' | 'npc' | 'poe';
  npcDisposition?: 'calm' | 'linger' | 'feral';
  isLoyalist?: boolean;
  lingerTimer?: number;
  attackAngle?: number;
  hasStruckThisAttack?: boolean;
}

// Enemy Wiki Definition (Self-Contained Entity Module Contract)
export interface EnemyWikiDefinition {
  type: string;
  name: string;
  spawnChar?: string;
  faction?: 'hostile' | 'camelot' | 'orc' | 'npc' | 'poe';
  defaultZ?: number;
  isFlying?: boolean;
  tellRadius?: number;
  emissiveColor?: string;
  companionSpawnType?: string;
  companionSpawnChar?: string;
  description: string;
  lore: string;
  shields: { type: 'energy' | 'physical'; capacity: number };
  armor: { type: ArmorType; threshold: number; rating: number; durability: number };
  frameIntegrity: number;
  speed: number;
  damage: number;
  damageType: DamageType;
  tellDurationSec: number;
  attackCooldownSec: number;
  lootTable: LootEntry[];
  /** Optional embedded Base64 PNG sprite or grid animation/directional spritesheet */
  sprite?: Base64SpriteConfig;
  shouldSkipSpawn?: (state: OrionState) => boolean;
  customSpawnSetup?: (
    state: OrionState,
    px: number,
    py: number,
    spawnCountOfType: number
  ) => Partial<EnemyEntity>;
  onDeath?: (state: OrionState, e: EnemyEntity, ctx: OrionCombatContext) => void;
  render25D?: (
    g: CanvasRenderingContext2D,
    e: EnemyEntity,
    state: OrionState,
    ey: number,
    isHurt: boolean,
    isWindup: boolean
  ) => boolean | void;
  update: (
    rooms: Record<string, string[]>,
    state: OrionState,
    e: EnemyEntity,
    dt: number
  ) => void;
}

// Item Definition
export interface ItemWikiDefinition {
  id: string;
  name: string;
  category: 'consumable' | 'equipment' | 'key' | 'valuable';
  description: string;
  lore: string;
  buyPrice: number;
  sellPrice: number;
  iconColor: string;
  /** Optional embedded Base64 PNG or spritesheet icon for world pickups and satchel UI */
  iconSprite?: Base64SpriteConfig;
  /** Optional custom callback when collected from a world pickup */
  onCollect?: (state: OrionState, ctx: OrionExecutionContext) => void;
  onUse?: (state: OrionState, ctx: OrionExecutionContext) => boolean;
}

// Pickups
export interface PickupEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  vz: number;
  kind: 'scrap' | 'key' | 'kit' | 'item';
  itemId?: string;
  value: number;
  color: string;
  t: number;
}

// Projectiles
export interface OrionProjectile {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  damageType: DamageType;
  isPlayer: boolean;
  life: number;
  radius: number;
  color: string;
  trailColor: string;
  lightRadius: number;
  onImpact?: (x: number, y: number, z: number, state: OrionState) => void;
}

// Particles
export interface OrionParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  label?: string;
  fade?: boolean;
}

// Contexts
export interface OrionCombatContext {
  state: OrionState;
  sound: SoundSystem;
  spawnParticles: (
    x: number,
    y: number,
    z: number,
    count: number,
    color: string,
    label?: string
  ) => void;
  say: (text: string) => void;
}

export interface OrionExecutionContext {
  say: (text: string) => void;
  sound: SoundSystem;
}

export type OrionActionSourceCategory =
  | 'weapon'
  | 'hardware'
  | 'reactor'
  | 'utility'
  | 'belt';

export interface OrionActionDescriptor {
  id: string;
  name: string;
  shortLabel: string;
  sourceCategory: OrionActionSourceCategory;
  sourceLabel: string;
  hardwareSlot?: 'Head' | 'Torso' | 'Arms' | 'Legs' | 'Reactor' | 'Utility' | 'Belt';
  weaponSkillSlot?: 1 | 2 | 3 | 4;
  beltSlotIndex?: 0 | 1 | 2 | 3;
  traitLineId?: TraitLine;
  sortOrder?: number;
  description: string;
  tellDurationSec: number;
  actionDurationSec: number;
  cooldownSec: number;
  heatCost: number; // Negative values vent heat
  damage: number;
  damageType: DamageType;
  damageFamily: DamageFamily;
  range: number;
  /** Optional embedded Base64 PNG icon for hardware/skill displays */
  iconSprite?: Base64SpriteConfig;
}

export interface OrionAssignedActions {
  L: string; // Default: 'weapon_skill_1'
  R: string; // Default: 'weapon_skill_2'
}

export interface OrionSavedPilotEntry {
  pilotId: string;
  pilotName: string;
  traitLine: TraitLine;
  frameModel: string;
  reactor: ReactorFamily;
  level: number;
  areaId: string;
  room: string;
  tutorialActive: boolean;
  updatedAt: number;
  savedDataJson: string;
}

// Master Player / Orion State
export interface OrionState {
  pilotId?: string;
  regionId?: string;
  areaId: string;
  mapId?: string;
  biomeId?: string;
  room: string;
  rx: number;
  ry: number;
  discoveredWaystations?: string[];
  discoveredWaygates?: string[];

  // 2.5D Position & Height
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  onGround: boolean;
  dir: OrionDir;
  faceX: number;
  faceY: number;
  t: number;
  /** Viewport camera top-left offset in world pixels (smoothly clamped to room bounds, or centered if smaller) */
  camX?: number;
  camY?: number;
  camRoomId?: string;

  // Pilot & Trait Line Identity
  pilotName: string;
  traitLine: TraitLine;
  reactor: ReactorFamily;

  // Level & Progression (LOCKED: Static stats law, 1-20 unlocks slots)
  level: number;
  heat: number;
  maxHeat: number;
  energy: number;
  maxEnergy: number;

  // The Three Defense Layers
  shields: ShieldState;
  armor: ArmorState;
  frame: FrameState;

  // Weapon Sets & Weapon Swap
  equippedWeapons: string[]; // [slot 1, slot 2]
  activeWeaponIndex: number;
  weaponSwapCooldown: number; // 5.0s global cooldown

  // Weapon State & Ammo
  ammo: number; // e.g. 9 for Gladius
  maxAmmo: number;
  isReloading: boolean;
  reloadTimer: number;
  reloadDuration: number;
  skillCooldowns: number[]; // Cooldowns for Skills 0..4

  // Active Skill / Action Windup & Tell
  activeSkillSlot: number | null;
  activeActionId?: string | null;
  skillTellTimer: number;
  skillActionTimer: number;

  // Assignable L & R Multi-Source Actions
  assignedActions: OrionAssignedActions;
  actionCooldowns: Record<string, number>;
  overdriveTimer?: number;
  opticMarkTimer?: number;

  // Target Lock-On & Y Hold Weapon Swap
  lockedTargetId: number | null;
  yHoldTimer?: number;
  yHoldTriggeredSwap?: boolean;
  wasYHeld?: boolean;

  // Booster Kit / Evasion (Tap Dodge Burst + Hold Continuous Boost)
  hasBoosterKit: boolean;
  isBoosterDashing: boolean;
  isContinuousBoosting?: boolean;
  bHoldTimer?: number;
  boosterTimer: number;
  boosterCooldown: number;
  boosterDirX: number;
  boosterDirY: number;

  // Inventory, Currencies & 3-Layer Build State (Pilot Skills, Frame Feats, 13-Slot Equipment)
  salvageScrap: number; // Currency
  inventorySlots: Array<{ itemId: string; count: number }>;
  equippedFeats: string[];
  socketedFeatGems?: Record<string, Partial<Record<GemId, number>>>; // Gems retained in build per Feat Node (refunded on unsocket)
  pilotSkills?: Record<PilotSkillId, PilotSkillProgress>;
  equipmentSlots?: OrionEquipmentSlots;
  presence?: number; // Force-reaction field (decays unless maintained)

  // World & Incursion State
  clearedRooms: Record<string, boolean>;
  lootedCaches: Record<string, boolean>;
  unlockedGates: Record<string, boolean>;
  incursionEnabled: boolean; // Æther Incursion (defaults ON)

  // Multi-Domain State Gates (System Mode, Progression Gates, Narrative Flags, Spawn Anchor)
  tutorialActive: boolean; // True only while tutorial state is active; areas act as standard world zones when false
  tutorialStep: string; // Current onboarding step identifier when tutorialActive is true
  bypassProgressionGates: boolean; // Dev/Sandbox override to unlock all hardware/skill gates regardless of level
  flags: Record<string, boolean | number | string>; // Persistent world & narrative state flags
  spawnAnchor: OrionSpawnAnchor; // Active Drop-Pod / Spawn Anchor coordinates for death/reboot
  gates?: OrionCapabilityGates; // Computed active hardware & skill capability gates
  fogGraph?: AetherFogGraphState; // Dynamic 5-node Aether Fog graph (key, general, side, loop, end)

  // Dynamic Entities & Visual Effect Layers
  enemies: EnemyEntity[];
  pickups: PickupEntity[];
  projectiles: OrionProjectile[];
  particles: OrionParticle[];
  bladeTrails?: BladeTrailEffect[];

  // Feedback & Toasts
  toastText: string | null;
  toastTimer: number;
  promptText: string | null;
  flickerTimer: number; // Desynchronization visual flicker
  useStandardResolutionHud?: boolean;
  isFallingIntoPit?: boolean; // Falling into abyssal sinkhole / pit
  dismissedPromptKey?: string | null; // Currently dismissed interactive prompt tile
  atTitleMenu?: boolean; // True on cartridge boot until New Game / Load Game / Continue is chosen
}

export interface OrionSpawnAnchor {
  areaId: string;
  room: string;
  x: number;
  y: number;
}

export interface OrionCapabilityGates {
  levelBand: LevelBand; // Lesson (1-5), Challenge (6-12), Expression (13-20)
  standardProgressionUnlocked: boolean; // Locked out until tutorial is cleared (or bypass enabled)
  maxWeaponSlots: number; // 1 (Lvl 1), 2 (Lvl 2), 4 (Lvl 13)
  unlockedSkillSlots: number[]; // Set 1 active action slots (0..4)
  set1UnlockedActions: number[]; // L1: [1], L2: [1,2], L3+: [1,2,3,4,5]
  set2UnlockedActions: number[]; // L1: [], L2: [1], L3: [1,2], L4+: [1,2,3,4,5]
  beltSlotsUnlocked: number; // L1: 2, L2+: 4
  auxSlotsUnlocked: number; // L1-3: 0, L4: 2, L5+: 4
  utilitySlotActive: boolean; // L6+
  legsSlotActive: boolean; // L2+
  headSlotActive: boolean; // L3+
  generatorSlotActive: boolean; // L4+
  armsSlotActive: boolean; // L5+
  canBoosterDash: boolean; // L1 basic dash / L2+ Legs slot
  canWeaponSwap: boolean; // L2+ (Poe interaction)
  heatSystemActive: boolean; // L4+ Generator slot
  energySystemActive: boolean; // L4+ Generator slot
  opticsActive: boolean; // L3+ Head slot
  armSidearmActive: boolean; // L5+ Arms slot
  defensiveSlots: number; // Aux slots (0 -> 2 at L4 -> 4 at L5)
  featSlots: number; // Number of unlocked Feat Tiers (I-V)
  unlockedFeatTiers: FeatTier[]; // Tiers I-V gated by pilot skill levels
  presenceActive: boolean; // Presence force-reaction field
  coreSystemActive: boolean; // Reactor identity specialization
  effectiveLoadCapacity: FrameLoadCapacity;
  activeWeaponWeight: WeaponWeightClass;
  loadPenalty: LoadPenaltySummary;
}
