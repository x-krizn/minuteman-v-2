/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArmorState,
  FrameLoadCapacity,
  FrameState,
  LevelBand,
  OrionDir,
  ReactorFamily,
  ShieldState,
  TraitLine,
  WeaponWeightClass,
} from './common';
import {
  BladeTrailEffect,
  InertiaModifiers,
  InertiaOutcomeBand,
  OrionAssignedActions,
  OrionParticle,
  OrionProjectile,
} from './combat';
import {
  FeatTier,
  GemId,
  LoadPenaltySummary,
  OrionEquipmentSlots,
  PilotSkillId,
  PilotSkillProgress,
} from './equipment';
import { EnemyEntity, PickupEntity } from './entities';
import { AetherFogGraphState } from './world';

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

export type OrionGlidePhase = 'idle' | 'windup' | 'glide' | 'boost' | 'winddown';

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
  /** Magic-current glide animation phase ('idle' | 'windup' | 'glide' | 'boost' | 'winddown') */
  glidePhase?: OrionGlidePhase;
  /** Active 0-based sprite column (0 = Frame 1 Idle, 1 = Frame 2, 2 = Frame 3 Glide, 3 = Frame 4 Boost/Apex) */
  glideFrame?: 0 | 1 | 2 | 3;
  /** Step index within the active windup, sustained glide cadence, or weight-scaled wind-down sequence */
  glideStepIndex?: number;
  /** Elapsed time in seconds within the current glide animation step */
  glideStepTimer?: number;
  /** Weight-scaled recovery frame sequence (0-based columns) for the active wind-down phase */
  glideRecoveryFrames?: Array<0 | 1 | 2 | 3>;
  /** Residual X velocity during weight-scaled stopping inertia */
  glideInertiaVx?: number;
  /** Residual Y velocity during weight-scaled stopping inertia */
  glideInertiaVy?: number;
  /** Physical displacement velocity from incoming Inertia impulse (`Δv = J / m_eff`) or recoil */
  knockbackVx?: number;
  knockbackVy?: number;
  /** Remaining duration of weapon recoil movement restriction (`Δv_recoil_eff / (k2 * S)`) */
  recoilRestrictionTimer?: number;
  /** Active movement speed multiplier during weapon recoil restriction */
  recoilSpeedMult?: number;
  /** Active hitstop freeze-frame timer in seconds */
  hitstopTimer?: number;
  /** Spawn / reboot grace period timer in seconds during which enemies cannot aggro onto the player */
  spawnGraceTimer?: number;
  /** Active stagger/knockback recovery timer in seconds (`Δv_eff / (k2 * S)`) */
  staggerRecoveryTimer?: number;
  /** Current directional forward momentum fraction `μ` (0..1) */
  currentMu?: number;
  /** Current base frame + loadout weight `m` */
  baseWeight?: number;
  /** Current effective weight `m_eff = m * (1 + μ)` */
  effectiveWeight?: number;
  /** Current frame stability `S` (governs shrug-off deadband `k1 * S` and recovery `k2 * S`) */
  stability?: number;
  /** Most recent collision outcome band (`none` | `flinch` | `stagger` | `knockback`) */
  lastInertiaOutcome?: InertiaOutcomeBand;
  /** Visual feedback timer for the most recent inertia outcome */
  lastInertiaOutcomeTimer?: number;
  /** Last raw physical velocity change `Δv = J / m_eff` */
  lastImpactDv?: number;
  /** Last stability-reduced reaction severity `Δv_eff = max(0, Δv - k1 * S)` */
  lastImpactDvEff?: number;
  /** Optional external modifiers for Weight `m` and Stability `S` (feats, mods, Anchored state) */
  inertiaModifiers?: InertiaModifiers;
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
  activeSkillCooldownKey?: string | null;
  skillTellTimer: number;
  skillActionTimer: number;

  // Assignable L & R Multi-Source Actions & Separate Per-Skill Cooldown/Active/Reload Tracking
  assignedActions: OrionAssignedActions;
  actionCooldowns: Record<string, number>;
  skillActiveTimers?: Record<string, number>;
  skillReloadTimers?: Record<string, number>;
  skillPendingReloadDurations?: Record<string, number>;
  blockTimer?: number;
  isHoldingBlock?: boolean;
  blockHoldTimer?: number;
  blockingWeaponId?: string | null;
  overdriveTimer?: number;
  opticMarkTimer?: number;

  // Target Lock-On & Multi-Function Input State
  lockedTargetId: number | null;
  combatInputTimers?: Record<'x' | 'y' | 'r' | 'l', number>;
  combatHoldTimers?: Record<'x' | 'y' | 'r' | 'l', number>;
  combatHoldTriggered?: Record<'x' | 'y' | 'r' | 'l', boolean>;
  combatTapPending?: Record<'x' | 'y' | 'r' | 'l', boolean>;
  combatDoubleTapPending?: Record<'x' | 'y' | 'r' | 'l', boolean>;
  combatQueuedChainShot?: boolean;
  combatActiveChain?: boolean;

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

  // Dynamic Off-Screen Chunk Streaming & Enemy Hibernation (100x90 / 10x10 Chunks)
  activeChunkX?: number;
  activeChunkY?: number;
  generatedChunks?: Record<string, boolean>;
  hibernatedChunkEnemies?: Record<string, EnemyEntity[]>;
  /** Last visited Set-Path Spine chunk coordinates for fast-travel return after clearing a Deep-Fog Dungeon */
  lastSafeChunkCoord?: {
    roomId: string;
    cx: number;
    cy: number;
    x: number;
    y: number;
    title: string;
  };
  /** Off-path chunk Lantern Anchors ignited by the pilot (`${roomId}:${cx},${cy}` -> true) */
  litChunkLanterns?: Record<string, boolean>;
  /** Deep-Fog Dungeon chunks cleared by the pilot (`${roomId}:${cx},${cy}` -> true) */
  clearedDeepFogDungeons?: Record<string, boolean>;

  // Feedback, Light, Fog-of-War Exploration & Interactable Context Menu
  /** Base player Light stat in tiles (defaults to 5 tiles = half one screen; modified by feats, items, skills, and spells) */
  baseLight?: number;
  /** Temporary Light stat modifier in tiles from active skills, spells, or status effects */
  lightBuffDelta?: number;
  /** Remaining duration in seconds for `lightBuffDelta` */
  lightBuffTimer?: number;
  /** Base enemy Light / Vision radius stat in tiles (defaults to 5 tiles = half one screen) */
  enemyBaseLight?: number;
  /** Persistent explored tile coordinates per room (`exploredTiles[roomKey]["tx,ty"] = true`) */
  exploredTiles?: Record<string, Record<string, boolean>>;
  /** Active world interactable context menu state */
  contextMenu?: OrionContextMenuState | null;
  toastText: string | null;
  toastTimer: number;
  promptText: string | null;
  flickerTimer: number; // Desynchronization visual flicker
  useStandardResolutionHud?: boolean;
  isFallingIntoPit?: boolean; // Falling into abyssal sinkhole / pit
  dismissedPromptKey?: string | null; // Currently dismissed interactive prompt tile
  atTitleMenu?: boolean; // True on cartridge boot until New Game / Load Game / Continue is chosen
  titleMenuCursor?: number; // Selected index on the main title menu (0: New, 1: Load, 2: Training, 3: Options)
  titleMenuSubView?: 'root' | 'new' | 'load' | 'options'; // Active subview inside the Main Menu
  titleMenuLoadCursor?: number; // Selected pilot index inside the Load Roster subview
  titleMenuOptionCursor?: number; // Selected setting row inside the Options subview
  /** Active World Map modal access authority: 'menu' (view-only), 'campfire' (within world), or 'waygate' (world-to-world & within world) */
  worldMapModalMode?: 'none' | 'menu' | 'campfire' | 'waygate';
}

export interface OrionContextMenuOption {
  id: string;
  label: string;
  detail?: string;
  disabled?: boolean;
}

export interface OrionContextMenuState {
  title: string;
  subtitle?: string;
  targetType: string;
  targetKey?: string;
  x?: number;
  y?: number;
  worldX?: number;
  worldY?: number;
  tx?: number;
  ty?: number;
  entityId?: number;
  selectedIndex: number;
  options: OrionContextMenuOption[];
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
