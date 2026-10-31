/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArmorState,
  ArmorType,
  Base64SpriteConfig,
  DamageType,
  FrameLoadCapacity,
  FrameState,
  LootEntry,
  OrionDir,
  ShieldState,
} from './common';
import { InertiaOutcomeBand, OrionCombatContext } from './combat';
import type { OrionState } from './state';

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
  /** Initial duration of the active enemy state (used for normalized multi-frame animation progress) */
  stateMaxTimer?: number;
  /** Active combat flash-frame tint color */
  flashColor?: string;
  /** Remaining combat flash-frame timer in seconds */
  flashTimer?: number;
  /** Initial combat flash-frame duration in seconds */
  flashMaxTimer?: number;
  /** Semantic flash-frame effect kind ('sweet' | 'hit' | 'armor_deflect' | 'armor_shred' | 'shield' | 'shield_break' | 'parry' | 'stagger' | 'ready') */
  flashKind?: string;
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
  spawnKey?: string;
  /** True if this enemy is a max-depth Æther Fog Boss whose defeat clears the fog and returns the pilot to the main path */
  isFogBoss?: boolean;
  /** Æther Fog depth (1 .. clvl + 1) or Off-Path chunk distance where this enemy was spawned, used for loot/gem drop scaling */
  fogDepth?: number;
  /** Continuous off-path Æther Fog intensity multiplier at spawn (scales loot, essence, and gem drops) */
  fogIntensity?: number;
  /** True if spawned in the deep off-path soft-cap abyss zone */
  isAbyssElite?: boolean;
  /** True if this enemy guards a random deep-fog dungeon entrance */
  isDungeonGuardian?: boolean;
  /** Runtime velocity & Inertia System (`inertia-v0.md`) state */
  vx?: number;
  vy?: number;
  prevX?: number;
  prevY?: number;
  knockbackVx?: number;
  knockbackVy?: number;
  currentMu?: number;
  baseWeight?: number;
  effectiveWeight?: number;
  stability?: number;
  hitstopTimer?: number;
  lastInertiaOutcome?: InertiaOutcomeBand;
  lastInertiaOutcomeTimer?: number;
  /** Enemy Light / vision radius in tiles (defaults to 5 tiles = 80px) */
  visionRadiusTiles?: number;
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
  /** Optional enemy Light / vision radius in tiles (defaults to 5 tiles = 80px) */
  visionRadiusTiles?: number;
  /** Optional enemy frame weight class for Inertia System (`inertia-v0.md`) */
  weightClass?: FrameLoadCapacity;
  /** Optional numeric frame mass (`m`) override for Inertia System (`inertia-v0.md`) */
  baseWeight?: number;
  /** Optional numeric frame stability (`S`) override for Inertia System (`inertia-v0.md`) */
  baseStability?: number;
  /** Optional melee attack weight (`m_attack`) for Inertia System (`inertia-v0.md`) */
  attackWeight?: number;
  /** Optional melee attack speed (`v_attack`) for Inertia System (`inertia-v0.md`) */
  attackSpeed?: number;
  /** Optional melee commitment factor (`0..1`) for Inertia System (`inertia-v0.md`) */
  commitment?: number;
  /** Optional ranged projectile weight (`m_projectile`) for Inertia System (`inertia-v0.md`) */
  projectileWeight?: number;
  lootTable: LootEntry[];
  /** Optional enemy-specific equipment & weapon drop pool */
  equipmentLootPool?: string[];
  /** Base chance (0..1) for this enemy to drop a weapon/equipment piece from its pool */
  equipmentDropChance?: number;
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
