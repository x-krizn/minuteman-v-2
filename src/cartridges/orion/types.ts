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
  | 'barricade';

export interface TileDefinition {
  id: string;
  char: string;
  name: string;
  type: OrionTileType;
  solid: boolean;
  isMud?: boolean;
  isWater?: boolean;
  isChasm?: boolean;
  blocksHeight: number;
  bakedTopColor?: string;
  bakedFrontColor?: string;
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
}

// Enemy Entity
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
}

// Enemy Wiki Definition
export interface EnemyWikiDefinition {
  type: string;
  name: string;
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

// Master Player / Orion State
export interface OrionState {
  areaId: string;
  room: string;
  rx: number;
  ry: number;

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

  // Active Skill Windup & Tell
  activeSkillSlot: number | null;
  skillTellTimer: number;
  skillActionTimer: number;

  // Booster Kit / Evasion
  hasBoosterKit: boolean;
  isBoosterDashing: boolean;
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
