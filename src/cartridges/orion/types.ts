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

export interface BiomeDefinition {
  id: string;
  name: string;
  scope: WorldScope;
  world: string;
  description: string;
  /** Maps tile characters (e.g. '.', '#', '~') to TileDefinition IDs for rooms in this biome */
  tileTypes: Record<string, string>;
  /** Physics and environmental rules supplied by this biome to its rooms */
  tileRules: BiomeTileRules;
  /** Visual tile asset colors and lighting supplied by this biome to its rooms */
  tileAssets: BiomeTileAssets;
  /** Optional shared Base64 PNG tilemap / atlas for this biome */
  tileSheetBase64?: string;
  /** Default grid cell size in pixels for tileSheetBase64 (default: 16) */
  tileSheetCellSize?: number;
  /** Optional mapping of tile char ('.', '~', '#') or tile ID to [col, row] cell in tileSheetBase64 */
  tileSheetCoords?: Record<string, BiomeTilesetCell>;
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
  /** Optional embedded Base64 PNG or grid tilemap slice for Layer 0 ground/liquid */
  layer0Sprite?: Base64SpriteConfig;
  /** Optional embedded Base64 PNG or grid tilemap slice for Layer 1 walls/barriers */
  layer1Sprite?: Base64SpriteConfig;
  /** Optional embedded Base64 PNG or grid spritesheet slice for Layer 2 2.5D props */
  propSprite?: Base64SpriteConfig;
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

export interface RoomDefinition {
  id?: string;
  scope?: WorldScope;
  coord: string;
  mapId?: string;
  areaId: string;
  regionId?: string;
  biomeId?: string;
  title: string;
  bannerTitle: string;
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

// Trait Line Wiki Definition
export interface TraitLineWikiDefinition {
  id: TraitLine;
  name: string;
  reactor: ReactorFamily;
  defaultDamageStyle: DamageType;
  identity: string;
  lore: string;
  baseShield: { type: 'energy' | 'physical'; capacity: number };
  baseArmor: { type: ArmorType; threshold: number; rating: number; durability: number };
  startingWeapons: string[];
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

// Weapon Definition
export interface WeaponDefinition {
  id: string;
  name: string;
  class: string;
  description: string;
  lore: string;
  shotsPerChain: number; // 9 for Gladius Boltcaster
  damagePerShot: number; // 6 for Gladius (BCU = 54)
  chainDurationSec: number; // 1.5s
  reloadDurationSec: number; // 3.15s
  primaryDamageType: DamageType;
  moveset: ActionDefinition[]; // 5 actions
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

export type OrionActionSourceCategory = 'weapon' | 'hardware' | 'reactor';

export interface OrionActionDescriptor {
  id: string;
  name: string;
  shortLabel: string;
  sourceCategory: OrionActionSourceCategory;
  sourceLabel: string;
  hardwareSlot?: 'Head' | 'Torso' | 'Arms' | 'Legs' | 'Reactor';
  weaponSkillSlot?: 1 | 2 | 3 | 4;
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

// Master Player / Orion State
export interface OrionState {
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

  // Inventory & Currencies
  salvageScrap: number; // Currency
  inventorySlots: Array<{ itemId: string; count: number }>;
  equippedFeats: string[];

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

  // Dynamic Entities
  enemies: EnemyEntity[];
  pickups: PickupEntity[];
  projectiles: OrionProjectile[];
  particles: OrionParticle[];

  // Feedback & Toasts
  toastText: string | null;
  toastTimer: number;
  promptText: string | null;
  flickerTimer: number; // Desynchronization visual flicker
  useStandardResolutionHud?: boolean;
  isFallingIntoPit?: boolean; // Falling into abyssal sinkhole / pit
  dismissedPromptKey?: string | null; // Currently dismissed interactive prompt tile
}

export interface OrionSpawnAnchor {
  areaId: string;
  room: string;
  x: number;
  y: number;
}

export interface OrionCapabilityGates {
  maxWeaponSlots: number; // 1 (Lvl 1), 2 (Lvl 3), 4 (Lvl 13)
  unlockedSkillSlots: number[]; // [0] (Lvl 1), [0,1,2] (Lvl 4), [0,1,2,3,4] (Lvl 6)
  canBoosterDash: boolean; // Lvl 2+ & hasBoosterKit (or bypass)
  canWeaponSwap: boolean; // Lvl 3+ & >1 weapon equipped (or bypass)
  heatSystemActive: boolean; // Lvl 5+ Generator slot
  energySystemActive: boolean; // Lvl 5+ Generator slot
  opticsActive: boolean; // Lvl 7+ Head slot
  armSidearmActive: boolean; // Lvl 8+ Arm slot
  defensiveSlots: number; // 0 -> 1 (Lvl 10) -> 3 (Lvl 11)
  featSlots: number; // 0 -> 1 (Lvl 9) -> 2 (Lvl 12) -> 3 (Lvl 14) -> 4 (Lvl 16) -> 5 (Lvl 18)
  presenceActive: boolean; // Lvl 15+ Presence system
  coreSystemActive: boolean; // Lvl 17+ Core reactor identity
}
