/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BoundingBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export type StatType = 'hp' | 'ap' | 'ep' | 'sp';

export interface BaseEntry {
  id: string; // Unique entity identifier, e.g. 'short_sword', 'desert'
  name: string; // Display name
  kind?: 'item' | 'weapon' | 'skill' | 'enemy' | 'biome' | 'tile' | 'map' | string;
  description?: string;
}

export interface ItemDef {
  i: number; // sprite cell index, -1 for special
  k: string;
  s?: StatType;
}

export interface SingleFrameAsset {
  type?: 'single';
  imageUri: string;
  width?: number;
  height?: number;
  anchor?: { x: number; y: number };
  procedural?: {
    bob?: { amplitude: number; speed: number };
    trail?: { color: string; fadeMs?: number };
    rotationSpeed?: number;
  };
}

export interface MultiFrameAsset {
  type: 'sheet';
  sheetUri: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps?: number;
  loop?: boolean;
  anchor?: { x: number; y: number };
}

export type EntityAsset =
  | SingleFrameAsset
  | MultiFrameAsset
  | { spriteIndex: number; sheetName?: string };

export interface ItemExecutionContext {
  sound: any;
  say: (text: string) => void;
  spawnParticles: (
    x: number,
    y: number,
    count: number,
    color: string,
    text?: string
  ) => void;
}

export interface ItemWikiDefinition extends BaseEntry {
  id: string;
  name: string;
  symbol?: string; // e.g. 'H', 'o', 'K', 'D', '1'
  category?: string;
  description?: string;
  lore?: string;
  spriteIndex?: number;
  assets?: SingleFrameAsset | MultiFrameAsset;
  stat?: StatType;
  color?: string;
  cost?: number;
  sellPrice?: number;
  canDrop?: boolean;
  dropWeight?: number;
  soldBy?: string[];
  vendors?: string[];
  spawning?: {
    canDropFromEnemies?: boolean;
    dropWeight?: number;
    dungeonRarity?: string;
    proceduralPlacementSymbol?: string;
    legacyAliases?: string[];
  };
  effect?: {
    type?: string;
    stat?: StatType;
    amount?: number;
  };
  hooks?: {
    onCollect?: (state: KnightState, ctx: ItemExecutionContext) => void;
  };
}

export interface WeaponExecutionContext {
  player: KnightState;
  state: KnightState;
  sound: any;
  spawnParticles: (
    x: number,
    y: number,
    count: number,
    color: string,
    text?: string
  ) => void;
  say: (message: string) => void;
}

export interface WeaponDefinition extends BaseEntry {
  id: string;
  name: string;
  category?: string;
  weaponType?: 'sword' | 'dagger' | 'spear' | 'axe' | 'shield' | 'blunt' | string;
  slot?: 'main_hand' | 'off_hand' | 'armor' | 'trinket' | string;
  description?: string;
  lore?: string;
  stats?: {
    damage?: number;
    poiseDamage?: number;
    staminaCost?: number;
    speed?: number;
    critChance?: number;
    critMultiplier?: number;
  };
  supportedActions?: string[]; // IDs of actions this weapon explicitly supports (e.g. ['attack', 'block', 'parry'])
  incompatibleActions?: string[]; // Actions blocked while this is equipped
  innateFeats?: string[]; // Feats inherently granted by this item without spending skill points
  assets?: {
    imageUri?: string;
    spriteIndex?: number;
    slashTrailColor?: string;
    impactParticleColor?: string;
    anchorOffset?: { x: number; y: number };
    procedural?: {
      bob?: { amplitude: number; speed: number };
      trail?: { color: string; fadeMs?: number };
    };
  };
  frameData?: {
    startupTicks?: number;
    activeTicks?: number;
    recoveryTicks?: number;
    canCancelIntoRoll?: boolean;
    hitbox?: {
      offsetX: number;
      offsetY: number;
      width: number;
      height: number;
    };
  };
  hooks?: {
    onEquip?: (player: KnightState) => void;
    onSwing?: (ctx: WeaponExecutionContext) => void;
    onHit?: (target: EnemyEntity, ctx: WeaponExecutionContext) => void;
  };
}

// ---------------------------------------------------------------------------
// Progression & Skill Tree Nodes (Entry-Driven)
// ---------------------------------------------------------------------------

export type ProgressionUnlockType = 'core' | 'loot' | 'feat';

export interface ProgressionRequirement {
  type: ProgressionUnlockType;
  lootItemId?: string; // e.g. 'ability_double_jump' or 'dungeon_key'
  featCost?: number; // Cost in coins/feat points if unlocked at vendor/altar
  requiredLevel?: number;
}

export interface ProgressionEquipmentFilter {
  requiresWeapon?: boolean; // Must have weapon equipped
  allowedWeaponTypes?: string[]; // e.g. ['sword', 'dagger'] or ['shield']
  disallowedWeaponTypes?: string[]; // Explicit exclusions
  allowedSlots?: ('main_hand' | 'off_hand')[];
  specificWeaponIds?: string[];
}

export interface ProgressionExecutionContext {
  player: KnightState;
  state: KnightState;
  sound: any;
  say: (text: string) => void;
  spawnParticles: (
    x: number,
    y: number,
    count: number,
    color: string,
    text?: string
  ) => void;
}

export interface ProgressionNodeEntry extends BaseEntry {
  id: string; // Unique action ID: 'jump', 'double_jump', 'attack', 'block', 'parry', 'counter_attack'
  name: string; // Display name
  description?: string;
  category?: 'movement' | 'offense' | 'defense' | 'utility' | string;
  icon?: string; // optional sprite or unicode icon

  // Tree Hierarchy
  parents?: string[]; // IDs of required parent nodes that must be active/mastered

  // Unlock Gates
  unlocks: ProgressionRequirement[];

  // Hardware/Equipment Compatibility
  equipmentFilter?: ProgressionEquipmentFilter;

  // Stun / Frame / Cost Data
  staminaCost?: number;
  energyCost?: number;
  cooldownFrames?: number;

  // Action hook on trigger
  execute?: (ctx: ProgressionExecutionContext) => boolean | void;
}

// ---------------------------------------------------------------------------
// Equipment & Inventory Slots
// ---------------------------------------------------------------------------

export interface EquipmentLoadout {
  mainHand?: string; // weapon ID
  offHand?: string; // shield / parrying dagger ID
  armor?: string; // armor item ID
  trinket?: string; // relic / accessory ID
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export type EnemyType = 'crawler' | 'sentry' | 'wisp' | string;

export interface EnemyExecutionContext {
  sound: any;
  say?: (text: string) => void;
  spawnParticles: (
    x: number,
    y: number,
    count: number,
    color: string,
    text?: string
  ) => void;
}

export interface EnemyWikiDefinition {
  type: EnemyType;
  name: string;
  description: string;
  hp: number;
  maxHp: number;
  poise: number;
  speed: number;
  damage: number;
  lootTable?: { itemId: string; chance: number }[];
  assets?: SingleFrameAsset | MultiFrameAsset;
  update?: (
    rooms: Record<string, string[]>,
    state: KnightState,
    entity: EnemyEntity,
    dt: number
  ) => void;
  onDefeat?: (
    state: KnightState,
    entity: EnemyEntity,
    ctx: EnemyExecutionContext
  ) => void;
}

export interface EnemyEntity {
  id?: number;
  type: EnemyType;
  x: number;
  y: number;
  dir: number; // -1 or 1
  hp: number;
  maxHp: number;
  stun: number;
  poise: number;
  attackTimer?: number;
  isAttacking?: boolean;
  isBlocking?: boolean;
  blockTimer?: number;
  vx?: number;
  vy?: number;
  aiState?: 'patrol' | 'alert' | 'windup' | 'attack' | 'block';
  animTimer?: number;
}

export interface PickupEntity {
  x: number;
  y: number;
  c: string; // char symbol e.g. 'o', 'K', 'H'
  id: string; // room:tx,ty
}

export interface AttackVariant {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export type SkillId = 'heal' | 'fireball' | 'whirlwind' | 'shockwave' | string;

export interface SkillExecutionContext {
  say: (t: string) => void;
  sound: any;
  spawnParticles: (
    x: number,
    y: number,
    count: number,
    color: string,
    text?: string
  ) => void;
}

export interface SkillDef {
  id: SkillId;
  name: string;
  costType: 'ep' | 'sp' | 'flask';
  cost: number;
  iconIndex: number;
  description: string;
  cooldown: number;
  assets?: SingleFrameAsset;
  execute?: (state: KnightState, ctx: SkillExecutionContext) => void;
}

export interface ProjectileEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  life: number;
  radius: number;
}

export interface CombatParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  text?: string;
}

export interface DashGhost {
  x: number;
  y: number;
  face: number;
  alpha: number;
}

export interface KnightState {
  room: string;
  rx: number;
  ry: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ground: boolean;
  jumping: boolean;
  face: number; // 1 = right, -1 = left
  t: number; // walk animation timer

  // Stats
  hp: number;
  maxHp: number;
  ap: number; // Poise / Armor Points
  maxAp: number;
  ep: number; // Energy / Magic Points
  maxEp: number;
  sp: number; // Stamina Points (Souls-like meter for dash/sprint/block)
  maxSp: number;
  spRegenTimer: number;

  coins: number;
  keys: number;
  flasks: number;
  maxFlasks: number;
  inventoryOpen: boolean;
  menuMode?: 'play' | 'pause' | 'inventory';

  // Platforming
  hasDouble: boolean;
  airJumps: number;
  coyote: number;
  buffer: number;

  // Fighting game movement: Dash & Sprint (B)
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  isSprinting: boolean;
  dashGhosts: DashGhost[];

  // Weapon & Equipment
  equippedWeapon?: string;
  loadout?: EquipmentLoadout;
  inventorySlots?: InventorySlot[];
  unlockedFeats?: string[]; // IDs of feats learned by player (e.g. 'air_dash', 'counter_attack')

  // Fighting game combat: Attack & Charge (X)
  atk: number; // attack active timer
  atkCd: number; // attack cooldown
  atkV: number; // attack variation 0: stab, 1: slash up, 2: slash forward, 3: slash down, 4: heavy charged
  swung: number[]; // enemy indices hit in current swing
  chargeTimer: number; // how long X has been held
  isCharging: boolean;
  isCharged: boolean;
  isHeavyAttack: boolean;

  // Fighting game defense: Block & Parry (Y)
  isBlocking: boolean;
  parryWindow: number; // active frames right after pressing Y
  parrySparkTimer: number;
  blockStun: number;

  // Fighting game feel: Hitstop (frame freeze on big impact)
  hitstop: number;

  // Assigned Skills (L & R)
  assignedL: SkillId;
  assignedR: SkillId;
  skillCdL: number;
  skillCdR: number;
  unlockedSkills: SkillId[];

  // Combat Entities
  projectiles: ProjectileEntity[];
  particles: CombatParticle[];

  // Status
  inv: number; // invulnerability timer
  kb: number; // knockback timer
  got: Record<string, boolean>; // collected item keys
  enemies: EnemyEntity[];
  picks: PickupEntity[];
  checkpoint: { room: string; x: number; y: number } | null;
  cleared: number;
  nextStart: { x: number; y: number };
  floor: unknown;
  currentAreaId?: string;
  camX?: number;
  camY?: number;

  msg: string;
  msgT: number;
}

export interface CharacterDefinition extends BaseEntry {
  id: string;
  name: string;
  category: 'player' | 'enemy' | 'npc';
  description?: string;
  lore?: string;

  stats: {
    hp: number;
    maxHp: number;
    ap: number;
    maxAp: number;
    ep: number;
    maxEp: number;
    sp: number;
    maxSp: number;
    flasks?: number;
    maxFlasks?: number;
    poise?: number;
  };

  movement: {
    runSpeed: number;
    sprintSpeed: number;
    dashSpeed: number;
    jumpVelocity: number;
    gravity: number;
  };

  sprite: {
    sheetUri: string;
    frameWidth: number;
    frameHeight: number;
    frames: number;
    fps: number;
    anchorX: number;
    anchorY: number;
  };

  startingLoadout?: {
    weapon: string;
    shield?: string;
    skills?: {
      assignedL: SkillId;
      assignedR: SkillId;
    };
  };

  ai?: {
    detectionRange: number;
    attackRange: number;
    blockChance: number;
    parryWindow: number;
    patrolSpeed: number;
  };
}

export interface BiomeDefinition extends BaseEntry {
  id: string;
  name: string;
  description?: string;
  bgColor?: string;
  ambientColor?: string;
  dustColor?: string;
  tileset?: {
    type?: 'single' | 'sheet';
    imageUri?: string;
    sheetUri?: string;
    tileSize?: number;
  };
  environmentalHooks?: {
    onStep?: (player: KnightState) => void;
    onRoomEnter?: (state: KnightState) => void;
  };
}

export interface TileExecutionContext {
  sound?: any;
  say?: (text: string) => void;
  spawnParticles?: (
    x: number,
    y: number,
    count: number,
    color: string,
    text?: string
  ) => void;
}

export interface TileDefinition extends BaseEntry {
  id: string;
  symbol: string;
  name: string;
  category?: 'terrain' | 'hazard' | 'structure' | 'interactive' | string;
  solid?: boolean;
  oneWay?: boolean;
  hazard?: boolean;
  spriteIndex?: number;
  color?: string;
  trigger?: {
    onStep?: (player: KnightState, ctx: TileExecutionContext) => void;
    onHit?: (state: KnightState, ctx: TileExecutionContext) => void;
  };
  hooks?: {
    canPass?: (state: KnightState, roomKey: string) => boolean;
  };
}

export interface RoomDefinition extends BaseEntry {
  id: string; // e.g. '0,0' or 'desert_passage'
  name: string;
  layout: string[];
  biome?: string; // ID of biome (defaults to 'crypt')
  exits?: Record<'N' | 'S' | 'E' | 'W' | string, string>;
  initialSpawns?: {
    type: string;
    x: number;
    y: number;
  }[];
  initialPickups?: {
    symbol: string;
    x: number;
    y: number;
  }[];
}

