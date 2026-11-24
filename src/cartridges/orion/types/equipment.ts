/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ActionDefinition, OrionExecutionContext } from './combat';
import type {
  ArmorType,
  Base64SpriteConfig,
  DamageType,
  FrameLoadCapacity,
  ReactorFamily,
  TraitLine,
  WeaponWeightClass,
} from './common';
import type { OrionState } from './state';

/**
 * Type contract for `GemId` (gem id) in `equipment.ts`.
 */
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

/**
 * Type contract for `GemDefinition` (gem definition) in `equipment.ts`.
 */
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

/**
 * Type contract for `PilotSkillId` (pilot skill id) in `equipment.ts`.
 */
export type PilotSkillId = TraitLine;
/**
 * Type contract for `FeatTier` (feat tier) in `equipment.ts`.
 */
export type FeatTier = 'I' | 'II' | 'III' | 'IV' | 'V';
/**
 * Type contract for `FeatKind` (feat kind) in `equipment.ts`.
 */
export type FeatKind = 'system' | 'interface';

/**
 * Type contract for `PilotSkillProgress` (pilot skill progress) in `equipment.ts`.
 */
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

/**
 * Type contract for `FeatSynergyCategory` (feat synergy category) in `equipment.ts`.
 */
export type FeatSynergyCategory =
  | 'Ballistics & Ordnance'
  | 'Melee & CQC'
  | 'Frame Plating & Defense'
  | 'Reactor & Thermal'
  | 'Mobility & Stealth'
  | 'Optics & Support';

/**
 * Macro-hemisphere archetype umbrella in the 113-node Feat Constellation (`Fighter`, `Scholar`, `Rogue`).
 */
export type ConstellationUmbrellaId = 'Fighter' | 'Scholar' | 'Rogue';

/**
 * Canonical 18 mechanical customization chain identifiers (`C-01` through `C-18`).
 */
export type FeatChainId =
  | 'C-01'
  | 'C-02'
  | 'C-03'
  | 'C-04'
  | 'C-05'
  | 'C-06'
  | 'C-07'
  | 'C-08'
  | 'C-09'
  | 'C-10'
  | 'C-11'
  | 'C-12'
  | 'C-13'
  | 'C-14'
  | 'C-15'
  | 'C-16'
  | 'C-17'
  | 'C-18';

/**
 * Type contract for `FrameFeatDefinition` (frame feat definition) in `equipment.ts`.
 */
export interface FrameFeatDefinition {
  id: string;
  name: string;
  tier: FeatTier;
  kind: FeatKind;
  requiredSkillId: PilotSkillId;
  requiredSkillLevel: number;
  /** Macro-hemisphere umbrella ('Fighter' | 'Scholar' | 'Rogue') in the 113-node Constellation */
  umbrella?: ConstellationUmbrellaId;
  /** Optional mechanical customization chain ID ('C-01'..'C-18'); omitted for Standalone & Specialist Stance feats */
  chainId?: FeatChainId;
  /** Human-readable chain name (e.g. 'Cloak & Infiltration', 'Directional Guard & Barrier') */
  chainName?: string;
  /** Step index (1..5) within its mechanical customization chain (`1` = Entry node; `2..5` = unlocked when any earlier step `< chainStep` in the same `chainId` is socketed) */
  chainStep?: 1 | 2 | 3 | 4 | 5;
  /** True for campaign reward feats such as `Knight's Oath` */
  isRewardFeat?: boolean;
  /** True for the 22 Specialist Martial Stance standalone doctrines */
  isSpecialistStance?: boolean;
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

/**
 * Type contract for `WeaponComponentSlotId` (weapon component slot id) in `equipment.ts`.
 */
export type WeaponComponentSlotId =
  | 'hilt'
  | 'grip'
  | 'blade'
  | 'head'
  | 'tip'
  | 'focus'
  | 'catalyst'
  | 'actuator'
  | 'sight';

/**
 * Type contract for `StaticSubModSlotId` (static sub mod slot id) in `equipment.ts`.
 */
export type StaticSubModSlotId =
  | 'optics'
  | 'sensoryA'
  | 'sensoryB'
  | 'actuators'
  | 'structure'
  | 'integration'
  | 'reactor'
  | 'legs'
  | 'mobility';

/**
 * Type contract for `ModPartOrigin` (mod part origin) in `equipment.ts`.
 */
export type ModPartOrigin = 'crafted' | 'looted';
/**
 * Type contract for `LoadBracket` (load bracket) in `equipment.ts`.
 */
export type LoadBracket = 'light' | 'medium' | 'heavy' | 'overloaded';

/**
 * Physical domain for weapon component modifications (`Project Orion — Weapon Modification Overhaul Specification.md` §2.1).
 * A weapon may hold at most one component per domain across its 3 non-sequential slots.
 */
export type ModDomain = 'CONTACT' | 'DELIVERY' | 'REGULATION';

/**
 * Action 1 execution mode gating for parametric and behavioral weapon component overrides (`Project Orion — Weapon Modification Overhaul Specification.md` §2.4 & §4).
 */
export type Action1Mode = 'MAGAZINE' | 'DRAW_CHARGE' | 'MELEE_COMBO' | 'BURST_VOLLEY';

/**
 * Crafting recipe required at the Armory Workbench for `CRAFTED` weapon components (`Project Orion — Weapon Modification Overhaul Specification.md` §2.2 & §4).
 */
export interface CraftingRecipe {
  scrapCost: number;
  gemstoneType:
    | 'Moonstone'
    | 'Spinel'
    | 'Carnelian'
    | 'Titanite'
    | 'Demantoid'
    | 'Kyanite'
    | 'Charoite'
    | 'Rubellite'
    | 'Hematite';
  gemstoneCount: number;
}

/**
 * Parametric or behavioral Action 1 modification defined by a weapon component (`Project Orion — Weapon Modification Overhaul Specification.md` §2.4 & §4).
 * At most one `'BEHAVIORAL'` Action 1 override may be active on a weapon at a time.
 */
export interface Action1Override {
  kind: 'PARAMETRIC' | 'BEHAVIORAL';
  requiresMode?: Action1Mode;
  setsMode?: Action1Mode;
  ammoMultiplier?: number;
  reloadTimeMultiplier?: number;
  volleyBonusCount?: number;
  comboStepCountOverride?: number;
  finisherReachMultiplier?: number;
  secondaryProjectile?: {
    damageType: DamageType;
    bcuScale: number;
    rangeMeters: number;
    triggerStep: 'STEP_1' | 'FINISHER' | 'EVERY_SHOT';
  };
}

/**
 * Numeric stat modifiers carried by a weapon component (`Project Orion — Weapon Modification Overhaul Specification.md` §3 & §4).
 */
export interface WeaponComponentStatModifiers {
  weightDelta?: number;
  tempoDelta?: number;
  impulseMultDelta?: number;
  rangedImpulseMultDelta?: number;
  thrPierceDelta?: number;
  durShredMultDelta?: number;
  shieldDmgMultDelta?: number;
  stabilityDelta?: number;
  heatPerActionDelta?: number;
  heatCostMultDelta?: number;
  heatVentOnHit?: number;
  heatVentOnBlock?: number;
  parryWindowBonusSec?: number;
  swapSpeedMultDelta?: number;
  recoilMultDelta?: number;
  rangeMultDelta?: number;
  cleaveArcMultDelta?: number;
  bcuMultDelta?: number;
  finisherBcuMultDelta?: number;
  step1BcuMultDelta?: number;
  lungeMultDelta?: number;
  muChargeMultDelta?: number;
  targetMuStripOnHit?: number;
  shieldRegenDebuffSec?: number;
  drawTimeMultDelta?: number;
  drawHoldDrainMultDelta?: number;
  eliminateMoveAimSway?: number;
  shieldDurabilityDelta?: number;
  armorThresholdDelta?: number;
  armorRatingDelta?: number;
  guardMitigationMultDelta?: number;
  internalAmmoDelta?: number;
  projectileVelocityMultDelta?: number;
}

/**
 * Discriminated union for the 61 Bespoke Weapon Components across the 8 Weapon Classes (`Project Orion — Weapon Modification Overhaul Specification.md` §3 & §4).
 * Enforces strict mutual exclusion between `CRAFTED` (1G socket, requires recipe) and `LOOTED` (1–3G sockets, recipe is null).
 */
export type WeaponComponentMod =
  | {
      id: string;
      name: string;
      weaponClass: WeaponCategory;
      domain: ModDomain;
      acquisitionSource: 'CRAFTED';
      maxGemSlots: 1;
      recipe: CraftingRecipe;
      damageTypeOverride?: DamageType;
      action1Override?: Action1Override;
      statModifiers: WeaponComponentStatModifiers;
      effectSummary: string;
      tradeOffSummary: string;
      primaryGemId: GemId;
    }
  | {
      id: string;
      name: string;
      weaponClass: WeaponCategory;
      domain: ModDomain;
      acquisitionSource: 'LOOTED';
      maxGemSlots: 1 | 2 | 3;
      recipe: null;
      damageTypeOverride?: DamageType;
      action1Override?: Action1Override;
      statModifiers: WeaponComponentStatModifiers;
      effectSummary: string;
      tradeOffSummary: string;
      primaryGemId: GemId;
    };

/**
 * Per-slot installation state for one of the 3 non-sequential weapon slots (`Slot 1`, `Slot 2`, `Slot 3`),
 * storing the installed component ID and its nested Gemstone sockets (`1G` for Crafted, `1..3G` for Looted).
 */
export interface InstalledWeaponComponentSlotRecord {
  partId: string;
  socketedGems: Array<GemId | null>;
}

/**
 * Lore-driven hardware architecture tier for `Magitech` Purist Relics (`Project Orion — Magitech Purist Weapon Overhaul.md` §2.1 & §5).
 */
export type MagitechArchitectureTier =
  | 'SEALED_MONOLITH' // 0 open component slots + 1G
  | 'SEMI_SEALED_ASSEMBLY' // 1 open component slot  + 1G
  | 'MODULAR_FRAME_RELIC' // 2 open component slots + 1G
  | 'REFERENCE_PLATFORM'; // 3 open component slots + 1G

/**
 * Purist Resonance Passive triggered when a Magitech Relic's paired Specialist Stance or Core Feat Chain is socketed (`Project Orion — Magitech Purist Weapon Overhaul.md` §3–§5).
 */
export interface PuristResonancePassive {
  triggerType: 'SPECIALIST_STANCE' | 'CORE_FEAT_CHAIN';
  /** Canonical Specialist Stance feat ID (e.g. `'spear_buckler_specialist'`) or Core Feat Chain ID (`'C-03'`, `'C-04'`, `'C-10'`, `'C-14'`, `'C-18'`) */
  targetId: string;
  /** Optional display title for the resonance doctrine (e.g. `'Darting Viper'`, `'Huscarl Skjaldborg'`) */
  title?: string;
  effectSummary: string;
  /** Optional numeric combat modifiers activated while the Purist Resonance trigger is satisfied */
  combatModifiers?: WeaponComponentStatModifiers;
}

/**
 * Standalone TypeScript data schema for a Groomed `Magitech` Purist Weapon (`Project Orion — Magitech Purist Weapon Overhaul.md` §5).
 */
export interface MagitechWeaponDefinition {
  id: string;
  code: string;
  name: string;
  legacyEpithet?: string;
  flavorText: string;
  weaponClass: WeaponCategory;
  functionalType: string;
  baseDamageType: DamageType;
  weight: number;
  gripMode: '1H' | '2H' | 'VERSATILE' | 'DORSAL_CARRIER';
  architectureTier: MagitechArchitectureTier;
  openDomains: ModDomain[];
  sealedDomains: Record<ModDomain, string | null>;
  resonanceGemSlots: 1;
  action1Signature: string;
  puristResonance: PuristResonancePassive;
}

/**
 * Exclusive engine boundary hooks granted by Legendary folklore relics and their lore-bound companion pieces (`Project Orion — Legendary Weapons Framework.md` §9).
 */
export type LegendaryEngineHook =
  | 'BYPASS_LAYER1_SHIELDS'
  | 'PREVENT_LETHAL_DOT'
  | 'DR_OUTSIDE_ACTIVE_HIT_FRAMES'
  | 'DR_DURING_ACTIVE_HIT_FRAMES'
  | 'TWIN_BLADE_DUAL_EXECUTION'
  | 'UNBREAKABLE_DIRECTIONAL_GUARD'
  | 'BYPASS_BOSS_CC_IMMUNITY_PETRIFY'
  | 'PERMANENT_KILL_PREVENT_RESURRECT'
  | 'ALWAYS_HYPER_ARMOR'
  | 'ZERO_HIT_STOP'
  | 'PERFECT_BLOCK_MELEE_AUTO_COUNTER'
  | 'IMMUNE_TO_OVERHEAT_LOCKOUT';

/**
 * Named lore-bound companion artifact that can be slotted into a specific Legendary weapon (`Project Orion — Legendary Weapons Framework.md` §2 Law 4 & §9).
 */
export interface LoreBoundAttachment {
  id: string;
  name: string;
  originWorldId: string;
  requiredWorldFlags: string[];
  acquisitionSource: string;
  canBeEquippedStandalone?: boolean;
  transformedWeaponTitle?: string;
  combinedWeightOverride?: number;
  internalCooldownSeconds?: number;
  grantedEngineHooks: LegendaryEngineHook[];
  mechanicSummary: string;
}

/**
 * Standalone TypeScript data schema for a canonical Legendary Folklore Weapon (`Project Orion — Legendary Weapons Framework.md` §9).
 */
export interface LegendaryWeaponDefinition {
  id: string;
  tier: 'LEGENDARY';
  name: string;
  originWorldId: string;
  folkloreTradition: string;
  areaLoreConnection: string;
  weaponClass: WeaponCategory;
  functionalClass: string;
  damageType: DamageType;
  weight: number;
  maxObtainableCopies?: number;
  armorProfile?: {
    durability: number;
    rating: number;
    threshold: number;
  };
  gripMode: '1H' | '2H' | 'VERSATILE' | 'DORSAL_CARRIER';
  legendaryGripOverride?: boolean;
  strictTwoHandedNoOffhand?: boolean;
  allowDorsalLauncherOnly?: boolean;
  countsAsPairedOffhandBlade?: boolean;
  allowStandardMods: false;
  maxGemSlots: 0;
  boundRelicSlots: LoreBoundAttachment[];
  innateEngineHooks: LegendaryEngineHook[];
  action3Override?: {
    name: string;
    effectType: 'STUN_BLIND_CONE';
    stunSeconds: number;
    blindSeconds: number;
    widensWhenDualWielded?: boolean;
  };
  innateMechanicSummary: string;
  loreDescription: string;
}

/**
 * Type contract for `WeaponComponentPartDefinition` (weapon component part definition) in `equipment.ts`.
 */
export interface WeaponComponentPartDefinition {
  id: string;
  name: string;
  componentSlot: WeaponComponentSlotId;
  origin: ModPartOrigin;
  /** Crafted parts can have at most 1 gem slot (0 | 1); looted standalone parts may have 1..3 gem slots */
  maxGemSlots: 0 | 1 | 2 | 3;
  /** Variable gem cost when origin === 'crafted' (empty for looted standalone parts) */
  gemCost: Array<{ gemId: GemId; count: number }>;
  /** Primary gemstone affiliation driving the <Prefix> <Base Name> [+II/+III] convention */
  primaryGemId: GemId;
  gainDescription: string;
  drawbackDescription: string;
  /** Zero-sum physical weight delta affecting both Equip Load and Inertia Mass */
  weightDelta: number;
  attackWeightDelta?: number;
  projectileWeightDelta?: number;
  /** Canonical Weapon Class (`WeaponCategory`) for the 61 Bespoke Weapon Components */
  weaponClass?: WeaponCategory;
  /** Physical anatomical domain (`CONTACT` | `DELIVERY` | `REGULATION`) */
  domain?: ModDomain;
  /** Scrap cost required when forging a `CRAFTED` weapon component */
  scrapCost?: number;
  /** Damage type override (only permitted on `CONTACT` domain components) */
  damageTypeOverride?: DamageType;
  /** Parametric or behavioral Action 1 override */
  action1Override?: Action1Override;
  /** Structured numeric stat modifiers */
  statModifiers?: WeaponComponentStatModifiers;
}

/**
 * Type contract for `ActionModificationDefinition` (action modification definition) in `equipment.ts`.
 */
export interface ActionModificationDefinition {
  id: string;
  name: string;
  targetCategory: 'ranged' | 'melee' | 'mobility' | 'all';
  /** Canonical static mod slot category: Structure (Arms Mod 2), Integration (Arms Mod 3), or Mobility Kit (Frame Mod 3) */
  slotCategory?: 'structure' | 'integration' | 'mobility';
  /** Whether this mod part is crafted from gems (<=1 gem slot) or looted standalone (1..3 gem slots) */
  origin?: ModPartOrigin;
  /** Maximum additional gem slots on this mod component (0..1 for crafted, 1..3 for looted standalone) */
  maxGemSlots?: 0 | 1 | 2 | 3;
  gainDescription: string;
  drawbackDescription: string;
  /** Variable Gem cost permanently spent to craft this mod (empty for looted standalone mod parts) */
  gemCost: Array<{ gemId: GemId; count: number }>;
  /** Physical equip & inertia weight delta (+heavier / -lighter) */
  weightDelta?: number;
  /** Frame load capacity delta granted by Frame Mod 3 (Mobility Kit) */
  capacityDelta?: number;
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

/**
 * Type contract for `WeaponHanding` (weapon handing) in `equipment.ts`.
 */
export type WeaponHanding = '1-hand' | '2-hand' | 'off-hand-only' | 'buff-accessory';
/**
 * Type contract for `WeaponGripMode` (weapon grip mode) in `equipment.ts`.
 */
export type WeaponGripMode = '1h' | '2h';
/**
 * Type contract for `WeaponStanceType` (weapon stance type) in `equipment.ts`.
 */
export type WeaponStanceType =
  | 'paired'
  | 'unpaired'
  | 'power_2h'
  | 'main_aux'
  | 'main_consumable'
  | 'single_1h';

/**
 * Type contract for `OrionEquipmentSlots` (orion equipment slots) in `equipment.ts`.
 */
export interface OrionEquipmentSlots {
  /** Main Hand (Weapon Slot 1): 1H or 2H Weapon -> ac1, ac2, ac3 (and ac4, ac5 in Paired or 2H Power Stance) */
  slot1: string | null;
  /** Side Hand (Weapon Slot 2): 1H Weapon, Shield, or Carrier (or 2H Weapon if Feat/Unique/Legendary override is active). Carriers in slot2 still render dorsally on the back. */
  slot2: string | null;
  /** Auxiliary Slot (Back Mount Slot 3): Back-mounted Launchers & Carriers only. Stays on the back and takes skill ownership when swapped to. */
  slot3: string | null;
  /** Active grip for Main Hand weapon ('1h' or '2h'). 2H weapons default to '2h' unless overridden. */
  mainGrip?: WeaponGripMode;
  /** True when the Back-Mounted Auxiliary Launcher (slot3) has been swapped to and holds active combat ownership of Skills 4 & 5 while remaining on the back. */
  auxActive?: boolean;
  /** Active Specialist Stance override mode ('auto' = Active Specialist Doctrine when requirements met, 'base' = Base Weapon Moveset). */
  stanceOverrideMode?: 'auto' | 'base';
  /** Tracks how many separate instances of each weapon ID the pilot owns (Paired stance requires 2 separate items). */
  ownedWeaponCounts?: Record<string, number>;
  /**
   * Static Equipment Slots & Sub-Mods:
   * - Head: Armor = Dome Plate (`head`), Mod 1 = Optics (`headOptics`), Mod 2 = Sensory A (`sensoryA`), Mod 3 = Sensory B (`sensoryB`)
   * - Arms: Armor = Aperture Plate (`arms`), Mod 1 = Actuators (`armActuators`), Mod 2 = Structure (`installedMods.melee`), Mod 3 = Integration (`installedMods.ranged`)
   * - Frame: Armor = Frame Plating (`plating`), Mod 1 = Reactor Core (`reactorCore`), Mod 2 = Leg Actuators (`legs`), Mod 3 = Mobility Kit (`installedMods.mobility`)
   */
  head: string | null;
  headOptics?: string | null;
  arms: string | null;
  armActuators?: string | null;
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
  /** Tracks named component parts installed on weapon instances (`weaponInstanceId -> { [componentSlot]: partId }`) */
  installedWeaponComponents?: Record<string, Record<string, string>>;
  /** Tracks the 3 non-sequential weapon component slots (`0 | 1 | 2`) and their nested Gem sockets (`1G` Crafted / `1..3G` Looted) per weapon instance */
  installedWeaponComponentSlots?: Record<
    string,
    Partial<Record<0 | 1 | 2, InstalledWeaponComponentSlotRecord>>
  >;
  /** Tracks the dedicated `1G` Factory Resonance Gem socketed on any Magitech Purist Relic (`weaponInstanceId -> GemId | null`) */
  installedMagitechResonanceGems?: Record<string, GemId | null>;
  /** Tracks the lore-bound companion relic installed on a Legendary weapon (`weaponBaseOrInstanceId -> attachmentId | null`) */
  installedLoreBoundRelics?: Record<string, string | null>;
  /** Inventory counts of lore-bound companion relics owned by the pilot (`attachmentId -> count`) */
  ownedLoreBoundRelics?: Record<string, number>;
  /** Inventory counts of salvaged `LOOTED` weapon components owned by the pilot (`partId -> count`) */
  ownedLootedComponents?: Record<string, number>;
  /** Unlocked Cyclopean Dwarf Forge Armor Blueprint IDs (`bp_armor_camelot_knight`, `bp_armor_novarin_outrider`, `bp_armor_novarin_keshig`, `bp_armor_novarin_tarkhan`) */
  unlockedBlueprints?: string[];
  unlockedMods?: string[];
  unlockedEquipment?: string[];
  weaponGemMods?: Record<string, GemId | null>;
}

/**
 * Exterior Armor anatomical slot identifier (`Project Orion — AI Studio Implementation Spec (Exterior Armor & Gem Socketing).md` §2).
 */
export type ExteriorArmorSlot = 'plating' | 'head' | 'arms';

/**
 * Acquisition pathway for an Exterior Armor piece (`Project Orion — AI Studio Implementation Spec (Exterior Armor & Gem Socketing).md` §2).
 * - `'starter_post_boss'`: Chosen as starter archetype or recovered from Camelot post-boss chambers/caches.
 * - `'forge_blueprint'`: Crafted exclusively at a Cyclopean Dwarf Forge from a salvaged blueprint + Scrap + Gemstones.
 */
export type ArmorAcquisitionType = 'starter_post_boss' | 'forge_blueprint';

/**
 * Canonical Gemstone identifier alias (`Project Orion — AI Studio Implementation Spec (Exterior Armor & Gem Socketing).md` §2).
 */
export type GemstoneId = GemId;

/**
 * Lowercase reactor family identifier (`'ichor' | 'mana' | 'ether'`) used by the Exterior Armor Socket Calculation Engine (§2 & §6).
 */
export type ExteriorReactorFamily = 'ichor' | 'mana' | 'ether';

/**
 * Unified stat delta payload for Exterior Armor base modifiers, per-slot Gemstone sockets, and 3-tier Resonance Combos
 * (`Project Orion — AI Studio Implementation Spec (Exterior Armor & Gem Socketing).md` §2, §5, & §6).
 */
export interface StatDelta {
  armorDurability?: number;
  armorRating?: number;
  armorThreshold?: number;
  shieldCapacity?: number;
  shieldRechargeRatePct?: number; // e.g. +0.06 = +6%
  shieldRechargeDelayPct?: number; // e.g. -0.10 = -10%
  stability?: number;
  heatCapacity?: number;
  heatDissipationPct?: number; // e.g. +0.08 = +8%
  heatCostPct?: number; // e.g. -0.08 = -8%
  energyCapacityPct?: number; // e.g. +0.10 = +10%
  moveSpeedPct?: number; // e.g. -0.05 = -5%
  dashIFrameSec?: number; // e.g. +0.04 = +0.04s
  stealthSignaturePct?: number; // e.g. -0.10 = -10%
  opticsRangeM?: number; // e.g. +1.5 = +1.5m
  lightRadiusM?: number; // e.g. +1.0 = +1.0m
  lockOnSpeedPct?: number; // e.g. +0.12 = +12%
  projectileTrackingPct?: number; // e.g. +0.10 = +10%
  meleeTempoPct?: number; // e.g. +0.06 = +6%
  reloadDrawSpeedPct?: number; // e.g. +0.08 = +8%
  weaponSwapSpeedPct?: number; // e.g. +0.15 = +15%
  recoilControlPct?: number; // e.g. +0.12 = +12%
  guardMitigationPct?: number; // e.g. +0.08 = +8%
  parryWindowSec?: number; // e.g. +0.04 = +0.04s
  supportRepairPowerPct?: number; // e.g. +0.10 = +10%
  armorRepairEfficiencyPct?: number; // e.g. +0.12 = +12%
  loadCapacity?: number; // e.g. +4 = +4 WT capacity
  effectiveWeightDelta?: number; // e.g. -2 = -2 WT effective weight
  chargeMassPct?: number; // e.g. +0.10 = +10% directional charge mass
  chargeStability?: number; // e.g. +4 stability during directional charge
}

/**
 * Canonical Exterior Armor Piece definition (`Project Orion — AI Studio Implementation Spec (Exterior Armor & Gem Socketing).md` §2 & §3).
 */
export interface ExteriorArmorPiece {
  id: string;
  name: string;
  slot: ExteriorArmorSlot;
  setId: string; // 'set_00' .. 'set_05', 'set_12' .. 'set_15'
  weight: number;
  baseLoadCapacity?: number; // Only defined on 'plating' slot (84..116 WT)
  armor: {
    durability: number;
    rating: number;
    threshold: number;
  };
  shieldBonus: number;
  gemSockets: 2 | 3;
  acquisition: ArmorAcquisitionType;
  blueprintId?: string; // Defined if acquisition === 'forge_blueprint'
  baseModifiers: StatDelta;
  tradeOffSummary: string;
}

/**
 * Cyclopean Dwarf Forge recipe definition (`Project Orion — AI Studio Implementation Spec (Exterior Armor & Gem Socketing).md` §2 & §4).
 */
export interface ForgeRecipe {
  outputArmorId: string;
  blueprintId: string;
  scrapCost: number;
  gemCosts: Array<{ gemId: GemstoneId; count: number }>;
}

/**
 * Active Gemstone Resonance Combo descriptor (Tier 2 Two-Gem Pair or Tier 3 Three-Gem Triad on an Exterior Armor piece).
 */
export interface ArmorGemResonanceCombo {
  id:
    | 'ichor_crucible'
    | 'mana_sanctuary'
    | 'ether_astral'
    | 'prismatic_core'
    | 'tempered_crux'
    | 'siege_bastion'
    | 'aegis_lattice'
    | 'sanctum_choir'
    | 'prism_conduit'
    | 'veil_specter'
    | 'forge_quench'
    | 'mirrored_glaze'
    | 'dusk_striker';
  name: string;
  tier: 2 | 3;
  positiveBoost: number;
  boostedGems: 'ALL' | [GemstoneId, GemstoneId];
  flatBonus: StatDelta;
  grantsPrismaticUniversalAffinity?: boolean;
  summary: string;
}

/**
 * Per-socket evaluation breakdown returned by the Exterior Armor Socket Calculation Engine (§6).
 */
export interface ExteriorArmorSocketDetail {
  socketIndex: number;
  gemId: GemstoneId;
  occurrenceIndex: number; // 0 = 1st copy (1.0), 1 = 2nd copy (0.7), 2 = 3rd copy (0.4)
  duplicateScalar: number; // 1.0 | 0.7 | 0.4
  comboPositiveBoost: number; // 0 | 0.25 | 0.30 | 0.35
  reactorBoost: number; // 0 | 0.20
  prismaticBoost: number; // 0 | 0.10
  positiveMultiplier: number;
  drawbackMultiplier: number;
  scaledPositive: StatDelta;
  scaledDrawback: StatDelta;
}

/**
 * Complete evaluation result for a single Exterior Armor piece's socketed gemstones and active resonance combos (§6).
 */
export interface ExteriorArmorSocketEvalResult {
  pieceId: string;
  slot: ExteriorArmorSlot;
  activeCombo: ArmorGemResonanceCombo | null;
  prismaticUniversalAffinityActive: boolean;
  socketDetails: ExteriorArmorSocketDetail[];
  totalGemAndComboDelta: StatDelta;
}

/**
 * Internal Chassis Sub-System anatomical slot identifier (`Project Orion — AI Studio Implementation Spec (Internal Sub-Systems).md` §2).
 */
export type SubSystemSlot =
  | 'reactor'
  | 'optics'
  | 'sensory_a'
  | 'sensory_b'
  | 'actuators'
  | 'legs'
  | 'aux_3'
  | 'aux_4'
  | 'utility';

/**
 * Two-Tier Internal Sub-System classification (`Project Orion — AI Studio Implementation Spec (Internal Sub-Systems).md` §1 & §2):
 * - `'mech_unique_tech'`: Proprietary manufacturer systems native to the 6 Starting Loadout Kits (`Sets 0–5`).
 * - `'material_looted'`: Field-salvaged sub-system parts named strictly by physical/material construction.
 * - `'material_crafted'`: Workbench-crafted sub-system parts synthesized from Scrap + Gemstones.
 */
export type SubSystemOrigin =
  | 'mech_unique_tech'
  | 'material_looted'
  | 'material_crafted';

/**
 * Structured stat modifiers for Internal Chassis Sub-Systems and Reactor/Optics Gemstone sockets (`Project Orion — AI Studio Implementation Spec (Internal Sub-Systems).md` §2–§4).
 */
export interface SubSystemStatDelta {
  loadCapacity?: number;
  effectiveWeightDelta?: number;
  weight?: number;
  shield?: number;
  stability?: number;
  strikeMass?: number;
  strideSpeedPct?: number;
  heatVentingPct?: number;
  cooldownPct?: number;
  swingWindupPct?: number;
  lockAccuracyPct?: number;
  staggerDamagePct?: number;
  lightRadius?: number;
  enablesInertiaHud?: boolean;
}

/**
 * Canonical Internal Chassis Sub-System Module definition (`Project Orion — AI Studio Implementation Spec (Internal Sub-Systems).md` §2 & §3).
 */
export interface SubSystemModule {
  id: string;
  name: string;
  slot: SubSystemSlot;
  origin: SubSystemOrigin;
  heritageOrMaterial: string;
  reactorFamily?: ExteriorReactorFamily;
  weight: number;
  capacityBonus?: number;
  maxGemSlots: 0 | 1 | 2;
  modifiers: SubSystemStatDelta;
  craftRecipe?: {
    scrapCost: number;
    gemCosts: Partial<Record<GemstoneId, number>>;
  };
}

/**
 * Type contract for `LoadPenaltySummary` (load penalty summary) in `equipment.ts`.
 */
export interface LoadPenaltySummary {
  frameLoad: FrameLoadCapacity;
  weaponWeight: WeaponWeightClass;
  equippedWeight?: number;
  maxCapacity?: number;
  loadPct?: number;
  loadBracket?: LoadBracket;
  mobilityMult: number;
  heatMult: number;
  swapTimeMult: number;
  accuracyMult: number;
  stealthBroken: boolean;
  label: string;
}

/**
 * Starting Loadout Kit Definition (Internal TraitLine id preserved for save compatibility).
 */
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

/**
 * Canonical 8 broad weapon categories (`docs/EQUIPMENT_AND_FEATS.md §1`) housing the 72 customizable archetypes
 * and the 29 dissolved Unique Magitech weapons (`101` total).
 */
export type WeaponCategory =
  | 'Shields'
  | 'Bows'
  | 'Casters'
  | 'Spears'
  | 'Impact & Axes'
  | 'Blades: Curved'
  | 'Blades: Straight'
  | 'Carriers & Munitions';

/**
 * Ordered list of the 8 canonical weapon categories (`docs/EQUIPMENT_AND_FEATS.md §1`).
 */
export const WEAPON_CATEGORIES: WeaponCategory[] = [
  'Shields',
  'Bows',
  'Casters',
  'Spears',
  'Impact & Axes',
  'Blades: Curved',
  'Blades: Straight',
  'Carriers & Munitions',
];

/**
 * Customization tier for a weapon:
 * - `'customizable'`: 72 modular weapons with `3` component slots & nested gem sockets
 * - `'unique'`: 37 Magitech Purist relics with `0..3` open mil-spec mounts & `1` resonance gem socket
 * - `'legendary'`: Mythic folklore artifacts with `0` standard mods, `0` gem sockets, and optional lore-bound companion relics
 */
export type WeaponTier = 'customizable' | 'unique' | 'legendary';

/**
 * Weapon / Shield / Quiver / Catalyst Definition.
 */
export interface WeaponDefinition {
  id: string;
  name: string;
  class: string;
  /** Canonical broad weapon category (`'Shields' | 'Bows' | 'Casters' | 'Spears' | 'Impact & Axes' | 'Blades: Curved' | 'Blades: Straight' | 'Carriers & Munitions'`) */
  category?: WeaponCategory;
  /** Customization tier (`'customizable'` = 3 component & gem slots; `'unique'` = fixed parts & 1 gem socket) */
  weaponTier?: WeaponTier;
  /** Two-digit archetype index (`'01'`..`'09'`) within its category for the 72 customizable weapons */
  archetypeNumber?: string;
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
  /** True if this 2H weapon has a Unique, Legendary, or Counterbalanced property allowing 1H grip */
  allowOneHandGrip?: boolean;
  /** True if this 2H weapon can be equipped in the Side Hand slot (slot2) via Unique/Legendary property */
  allowSideSlot?: boolean;
  /** True if this weapon is a Legendary-tier relic */
  isLegendary?: boolean;
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
  /** Passive Armor Durability bonus when equipped (e.g. Kinetic Recycling / Martyrdom / Repair Auxiliaries) */
  passiveArmorBonus?: number;
  /** Passive Light stat bonus in tiles when equipped in Main Hand, Side Hand, or Aux */
  passiveLightBonus?: number;
  /** Default blade trail or projectile color when unmodified */
  bladeTrailColor?: string;
  /** Manufacturer model code for Magitech Purist Relics (e.g. `'S-3'`, `'TI-110'`, `'B-55'`, `'CL-210'`) */
  code?: string;
  /** Preserved historical or campaign epithet (e.g. `'the Siegebreaker'`, `'this hallowed scepter'`, `'Grace Edge'`, `'the Aegis Charge Buckler'`) */
  legacyEpithet?: string;
  /** Codex and Armory flavor text quote */
  flavorText?: string;
  /** Exact Equip Weight (`WT`) specified by the Magitech Purist Weapon Overhaul table (`5`..`20 WT`) */
  explicitEquipWeight?: number;
  /** Magitech grip classification (`'1H' | '2H' | 'VERSATILE' | 'DORSAL_CARRIER'`) */
  gripMode?: '1H' | '2H' | 'VERSATILE' | 'DORSAL_CARRIER';
  /** Lore-driven hardware architecture tier (`0..3` open component slots + `1G` Resonance Gem Socket) */
  architectureTier?: MagitechArchitectureTier;
  /** Exposed physical component domains (`CONTACT`, `DELIVERY`, `REGULATION`) on this weapon (`0..3` domains) */
  openDomains?: ModDomain[];
  /** Sealed physical domain descriptions (`null` for open domains; non-null factory assembly description for sealed domains) */
  sealedDomains?: Record<ModDomain, string | null>;
  /** Number of dedicated Factory Resonance Gem Sockets (`1` for all Magitech Purist Relics) */
  resonanceGemSlots?: 1;
  /** Bespoke Action 1 moveset/emitter signature summary */
  action1Signature?: string;
  /** Purist Resonance Passive activated when the paired Specialist Stance or Core Feat Chain is socketed */
  puristResonance?: PuristResonancePassive;
  /** Canonical Legendary Folklore Weapon metadata and engine hooks (`weaponTier === 'legendary'`) */
  legendarySpec?: LegendaryWeaponDefinition;
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

/**
 * Item Definition.
 */
export interface ItemWikiDefinition {
  id: string;
  name: string;
  category: 'consumable' | 'equipment' | 'key' | 'valuable' | 'blueprint';
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
