/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArmorType,
  Base64SpriteConfig,
  DamageType,
  FrameLoadCapacity,
  ReactorFamily,
  TraitLine,
  WeaponWeightClass,
} from './common';
import { ActionDefinition, OrionExecutionContext } from './combat';
import type { OrionState } from './state';

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

export type FeatSynergyCategory =
  | 'Ballistics & Ordnance'
  | 'Melee & CQC'
  | 'Frame Plating & Defense'
  | 'Reactor & Thermal'
  | 'Mobility & Stealth'
  | 'Optics & Support';

export interface FrameFeatDefinition {
  id: string;
  name: string;
  tier: FeatTier;
  kind: FeatKind;
  requiredSkillId: PilotSkillId;
  requiredSkillLevel: number;
  /** Functional hardware/weapon synergy category for classless UI filtering */
  synergyCategory?: FeatSynergyCategory;
  /** Canonical Weapon Family or Hardware prerequisite (e.g. 'Bolter', 'Energy Shield', 'Heavy Frame Plating') — never restricted by class */
  requiredEquipment?: string;
  gainDescription: string;
  costDescription: string;
  /** Specific Gem Socket requirements (retained in build, refunded on unsocket) */
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
    /** Flat Light stat modifier in tiles (e.g. +0.5 or +1.0) */
    lightDelta?: number;
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
    stabilityBonus?: number;
    enableInertiaHudTelemetry?: boolean;
    /** Flat Light stat modifier in tiles */
    lightDelta?: number;
  };
}

export type WeaponHanding = '1-hand' | '2-hand' | 'off-hand-only' | 'buff-accessory';
export type WeaponGripMode = '1h' | '2h';
export type WeaponStanceType =
  | 'paired'
  | 'unpaired'
  | 'power_2h'
  | 'main_aux'
  | 'main_consumable'
  | 'single_1h';

export interface OrionEquipmentSlots {
  /** Main Hand (Weapon Slot 1): 1H or 2H Weapon -> ac1, ac2, ac3 (and ac4, ac5 in Paired or 2H Power Stance) */
  slot1: string | null;
  /** Side Hand (Weapon/Aux/Consumable Slot 2): Off-hand Weapon, Auxiliary, or Swapped Consumable */
  slot2: string | null;
  /** Auxiliary Slot (Slot 3): Auxiliary (Shield/Quiver/Catalyst), Consumable, or Weapon -> swaps with Side Hand via [L] */
  slot3: string | null;
  /** Active grip for Main Hand weapon ('1h' or '2h'). Bows are strictly '2h'. Switched in Equipment Screen. */
  mainGrip?: WeaponGripMode;
  /** Tracks how many separate instances of each weapon ID the pilot owns (Paired stance requires 2 separate items). */
  ownedWeaponCounts?: Record<string, number>;
  /** Mech Hardware & Tactical Systems */
  head: string | null;
  arms: string | null;
  plating: string | null;
  utility: string | null;
  legs?: string | null;
  reactorCore?: string | null;
  sensoryA?: string | null;
  sensoryB?: string | null;
  aux3?: string | null;
  aux4?: string | null;

  /** Backward-compatible aliases for saves and legacy systems */
  weaponSet1?: [string, string | null];
  weaponSet2?: [string, string | null];
  aux?: [string | null, string | null, string | null, string | null];
  belt?: [string | null, string | null, string | null, string | null];
  armor?: {
    head: string;
    torso: string;
    arms: string;
    legs: string;
    generator: string;
  };
  installedMods: Record<string, string>;
  unlockedMods?: string[];
  unlockedEquipment?: string[];
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

// Starting Loadout Kit Definition (Internal TraitLine id preserved for save compatibility)
export interface TraitLineWikiDefinition {
  id: TraitLine;
  name: string;
  /** Canonical Frame Model designation (e.g. PNSY W416, RAD HAU, Trinity DE-14) */
  frameModel?: string;
  /** Canonical base weight / load capacity class ('light' | 'medium' | 'heavy' | 'superheavy') */
  weightClass?: FrameLoadCapacity;
  /** Default tactical utility sustain item unlocked at Level 6 */
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

// Weapon / Shield / Quiver / Catalyst Definition
export interface WeaponDefinition {
  id: string;
  name: string;
  class: string;
  /** Canonical weapon family classification (e.g. 'Bolter', 'Polybolos', 'Ballista', 'Beam Projector', 'Hybrid Rifle') */
  weaponClass?: string;
  /** Canonical active skill count (e.g. 3 or 4) */
  skillCount?: number;
  /** Canonical loadout slot affinity (e.g. ['Weapon 1', 'Weapon 2'] or ['Aux 1', 'Aux 2']) */
  loadoutSlots?: string[];
  /** Adaptive damage types for hybrid weapons (e.g. ['Beam', 'Pierce'] on CL-700 Sanctifier) */
  adaptiveDamageTypes?: [DamageType, DamageType];
  /** Support pulse effect on hit / sustained fire / crit (e.g. shield or armor restoration) */
  supportPulseOnHit?: {
    shieldRestore?: number;
    armorRestore?: number;
    heatVent?: number;
  };
  /** Archetype role ('melee' | 'ranged' | 'shield' | 'quiver' | 'catalyst') */
  equipmentRole?: 'melee' | 'ranged' | 'shield' | 'quiver' | 'catalyst';
  /** Weapon handing classification ('1-hand' | '2-hand' | 'off-hand-only' | 'buff-accessory') */
  handing?: WeaponHanding;
  /** Canonical weapon weight class ('light' | 'medium' | 'heavy') for the §3.4 Load Model */
  weightClass?: WeaponWeightClass;
  /** Optional numeric attack weight (`m_attack`) for the Inertia System (`inertia-v0.md`) */
  baseAttackWeight?: number;
  /** Optional numeric attack speed (`v_attack`) for the Inertia System (`inertia-v0.md`) */
  baseAttackSpeed?: number;
  /** Optional numeric projectile weight (`m_projectile`) for ranged attacks & recoil (`inertia-v0.md`) */
  projectileWeight?: number;
  /** True if this weapon is an equippable blocking weapon (Skill 4 is always Block) */
  canBlock?: boolean;
  /** Passive Shield Capacity bonus when equipped (e.g. Heater / Buckler / Pavise shields) */
  passiveShieldBonus?: number;
  /** Passive Light stat bonus in tiles when equipped in Main Hand, Side Hand, or Aux */
  passiveLightBonus?: number;
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
  /** Whether this weapon currently uses a recycled/placeholder visual asset */
  isPlaceholderAsset?: boolean;
  /** Future asset design notes or plans for dedicated custom artwork */
  futureAssetPlanned?: string;
  renderHardpoint25D?: (
    g: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    dirDx: number,
    dirDy: number,
    state: OrionState
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
  /** Passive Light stat bonus in tiles when equipped or carried */
  lightBonus?: number;
  /** Optional embedded Base64 PNG or spritesheet icon for world pickups and satchel UI */
  iconSprite?: Base64SpriteConfig;
  /** Optional custom callback when collected from a world pickup */
  onCollect?: (state: OrionState, ctx: OrionExecutionContext) => void;
  onUse?: (state: OrionState, ctx: OrionExecutionContext) => boolean;
}
