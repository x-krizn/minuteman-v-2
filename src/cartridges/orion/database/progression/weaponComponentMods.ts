/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Action1Mode,
  Action1Override,
  DamageType,
  FeatChainId,
  GemId,
  InstalledWeaponComponentSlotRecord,
  LegendaryEngineHook,
  LegendaryWeaponDefinition,
  LoreBoundAttachment,
  MagitechArchitectureTier,
  ModDomain,
  OrionState,
  PuristResonancePassive,
  WeaponCategory,
  WeaponComponentMod,
} from '../../types';
import {
  buildEquipmentInstanceId,
  formatModifiedEquipmentName,
  isCanonicalGemId,
  parseEquipmentInstanceId,
} from '../equipment/mod_naming';
import {
  canInstallComponentOnMagitech,
  getWeaponDefinition,
  LEGENDARY_WEAPONS_BY_ID,
  LORE_BOUND_ATTACHMENT_BY_ID,
  resolveWeaponFunctionalType,
  WEAPON_REGISTRY,
} from '../equipment/weapons';
import { GEMSTONE_REGISTRY } from '../items/gemstones';
import {
  CANONICAL_FRAME_FEAT_CATALOG,
  FEAT_CHAIN_NAMES,
} from './canonical_feats';
import { SPECIALIST_STANCE_LIST } from './specialistStances';
import {
  BESPOKE_WEAPON_COMPONENT_BY_ID,
  BESPOKE_WEAPON_COMPONENT_CATALOG,
  LOOTED_WEAPON_COMPONENT_POOL,
  mapDomainToLegacyComponentSlot,
  RECIPE_GEMSTONE_TO_ID,
  resolveWeaponClassAction1Mode,
} from './weaponComponentCatalog';

/**
 * Fully resolved runtime modification profile for a weapon instance (`Project Orion — Magitech Purist Weapon Overhaul.md` & Custom Weapon Modification Overhaul).
 */
export interface ResolvedWeaponModificationProfile {
  baseId: string;
  instanceId: string;
  weaponClass: WeaponCategory;
  functionalType: string;
  isUniqueMagitech: boolean;
  isLegendary: boolean;
  legendarySpec?: LegendaryWeaponDefinition;
  installedLoreBoundRelic: LoreBoundAttachment | null;
  activeLegendaryHooks: LegendaryEngineHook[];
  architectureTier?: MagitechArchitectureTier;
  openDomains: ModDomain[];
  sealedDomains: Record<ModDomain, string | null>;
  resonanceGem: GemId | null;
  puristResonance?: PuristResonancePassive;
  puristResonanceActive: boolean;
  puristResonanceTargetLabel: string;
  populatedSlotCount: number;
  semanticDisplayName: string;
  slotRecords: Record<0 | 1 | 2, InstalledWeaponComponentSlotRecord | null>;
  installedMods: Array<{ slotIndex: 0 | 1 | 2; mod: WeaponComponentMod }>;
  contactMod: WeaponComponentMod | null;
  deliveryMod: WeaponComponentMod | null;
  regulationMod: WeaponComponentMod | null;
  socketedGems: GemId[];
  baseDamageType: DamageType;
  effectiveDamageType: DamageType;
  damageTypeConverted: boolean;
  baseAction1Mode: Action1Mode;
  effectiveAction1Mode: Action1Mode;
  behavioralOverride: Action1Override | null;
  ammoMultiplier: number;
  reloadTimeMultiplier: number;
  volleyBonusCount: number;
  comboStepCountOverride: number | null;
  finisherReachMultiplier: number;
  secondaryProjectile: Action1Override['secondaryProjectile'] | null;
  /** Total physical weight delta (`WT`) from components + socketed component gems */
  weightDelta: number;
  /** Unclamped combat tempo multiplier (`1.0 + sum(tempoDelta)`) */
  rawTempoMultiplier: number;
  /** Combat tempo multiplier strictly clamped to `[0.70, 1.30]` (`±30%`) */
  clampedTempoMultiplier: number;
  /** Melee impulse multiplier (`1.0 + sum(impulseMultDelta)`) */
  meleeImpulseMultiplier: number;
  /** Ranged impulse multiplier (`1.0 + sum(rangedImpulseMultDelta)`) */
  rangedImpulseMultiplier: number;
  /** Flat Armor Threshold (`THR`) penetration delta (`+` ignores enemy THR; `-` reduces THR bypass) */
  thrPierceDelta: number;
  /** Layer 2 Armor Durability (`DUR`) shred multiplier (`1.0 + sum(durShredMultDelta)`) */
  durShredMultiplier: number;
  /** Layer 1 Shield damage multiplier (`1.0 + sum(shieldDmgMultDelta)`) */
  shieldDamageMultiplier: number;
  /** Flat Stability (`S`) delta */
  stabilityDelta: number;
  /** Flat Reactor Heat added per swing/shot/wave */
  heatPerActionDelta: number;
  /** Multiplicative Reactor Heat cost scalar */
  heatCostMultiplier: number;
  /** Flat Reactor Heat vented on hit */
  heatVentOnHit: number;
  /** Flat Reactor Heat vented on block/parry */
  heatVentOnBlock: number;
  /** Bonus seconds added to Action 4 Perfect Parry / Block window (`+0.05s`) */
  parryWindowBonusSec: number;
  /** Weapon swap cooldown time multiplier (`1.0 - sum(swapSpeedMultDelta)`) */
  swapTimeMultiplier: number;
  /** Ranged / hit-stop recoil multiplier (`1.0 + sum(recoilMultDelta)`) */
  recoilMultiplier: number;
  /** Effective range / thrust reach multiplier (`1.0 + sum(rangeMultDelta)`) */
  rangeMultiplier: number;
  /** Horizontal cleave arc / projectile width multiplier (`1.0 + sum(cleaveArcMultDelta)`) */
  cleaveArcMultiplier: number;
  /** Base Combat Unit (`BCU`) damage multiplier (`1.0 + sum(bcuMultDelta)`) */
  bcuDamageMultiplier: number;
  /** Extra BCU multiplier on combo finisher steps (`1.0 + sum(finisherBcuMultDelta)`) */
  finisherBcuMultiplier: number;
  /** Extra BCU multiplier on Combo Step 1 (`1.0 + sum(step1BcuMultDelta)`) */
  step1BcuMultiplier: number;
  /** Forward lunge step distance multiplier (`1.0 + sum(lungeMultDelta)`) */
  lungeDistanceMultiplier: number;
  /** Forward glide Directional Charge (`μ`) bonus multiplier */
  muChargeMultiplier: number;
  /** Target Directional Charge (`μ`) stripped on hit (`0..1`) */
  targetMuStripOnHit: number;
  /** Duration in seconds of `-15%` armor repair / shield regen debuff on hit */
  shieldRegenDebuffSec: number;
  /** Bow Action 1 draw duration multiplier (`1.0 + sum(drawTimeMultDelta)`) */
  bowDrawTimeMultiplier: number;
  /** Bow peak draw-hold energy/heat drain multiplier (`1.0 + sum(drawHoldDrainMultDelta)`) */
  bowDrawHoldDrainMultiplier: number;
  /** True when moving aim sway at full draw is eliminated (`Harmonic Dampener Rod`) */
  eliminateMoveAimSway: boolean;
  /** Shield-only Layer 2 Armor Durability (`DUR`) delta (`0` for non-Shields per Physical Domain Separation) */
  shieldDurabilityDelta: number;
  /** Shield-only Layer 2 Armor Threshold (`THR`) delta (`0` for non-Shields) */
  armorThresholdDelta: number;
  /** Shield-only Layer 2 Armor Rating (`RTG`) delta (`0` for non-Shields) */
  armorRatingDelta: number;
  /** Active guard mitigation multiplier (`1.0 + sum(guardMitigationMultDelta)`) */
  guardMitigationMultiplier: number;
  /** Internal ammo capacity delta for carriers */
  internalAmmoDelta: number;
  /** Projectile velocity multiplier (`1.0 + sum(projectileVelocityMultDelta)`) */
  projectileVelocityMultiplier: number;
  /** Alias for `populatedSlotCount` (count of occupied component slots `0..3`) */
  occupiedSlotCount: number;
  /** Alias for `socketedGems` across all installed components */
  allSocketedGems: GemId[];
  /** Alias for `damageTypeConverted` (true when a CONTACT component overrides base DamageType) */
  damageTypeConvertedFromContact: boolean;
  /** Ordered 3-slot array (`0`, `1`, `2`) with resolved component definition and nested gem sockets */
  slots: Array<{
    slotIndex: 0 | 1 | 2;
    component: WeaponComponentMod | null;
    socketedGems: Array<GemId | null>;
  }>;
  /** Aggregated stat modifier bundle for combat and UI consumers */
  statModifiers: {
    weightDelta: number;
    rawTempoMultiplier: number;
    clampedTempoMultiplier: number;
    meleeImpulseMultiplier: number;
    rangedImpulseMultiplier: number;
    thrPierceDelta: number;
    durShredMultiplier: number;
    shieldDamageMultiplier: number;
    stabilityDelta: number;
    heatPerActionDelta: number;
    heatCostMultiplier: number;
    heatVentOnHit: number;
    heatVentOnBlock: number;
    parryWindowBonusSec: number;
    swapTimeMultiplier: number;
    recoilMultiplier: number;
    rangeMultiplier: number;
    finisherReachMultiplier: number;
    cleaveArcMultiplier: number;
    bcuDamageMultiplier: number;
    finisherBcuMultiplier: number;
    step1BcuMultiplier: number;
    lungeDistanceMultiplier: number;
    muChargeMultiplier: number;
    targetMuStripOnHit: number;
    shieldRegenDebuffSec: number;
    bowDrawTimeMultiplier: number;
    bowDrawHoldDrainMultiplier: number;
    eliminateMoveAimSway: boolean;
    shieldDurabilityDelta: number;
    armorThresholdDelta: number;
    armorRatingDelta: number;
    guardMitigationMultiplier: number;
    internalAmmoDelta: number;
    projectileVelocityMultiplier: number;
  };
}

/**
 * Result of validating a candidate weapon component installation in a target slot (`0`, `1`, or `2`).
 */
export interface WeaponComponentValidationResult {
  valid: boolean;
  reason: string;
  conflictingDomainSlotIndex: 0 | 1 | 2 | null;
  conflictingBehavioralSlotIndex: 0 | 1 | 2 | null;
}

const GEM_SOCKET_WEIGHT_DELTA: Record<GemId, number> = {
  moonstone: 1,
  spinel: 2,
  carnelian: 3,
  titanite: 2,
  demantoid: 1,
  kyanite: 1,
  charoite: -2,
  rubellite: 2,
  hematite: 2,
};

/**
 * Resolves the 3 positional component slot records (`0 | 1 | 2`) for a weapon instance from `state.equipmentSlots`.
 * Gracefully migrates any legacy `installedWeaponComponents` entries if present.
 */
export function getWeaponInstanceSlotRecords(
  state: OrionState | undefined,
  weaponInstanceId: string | null | undefined
): Record<0 | 1 | 2, InstalledWeaponComponentSlotRecord | null> {
  const empty: Record<0 | 1 | 2, InstalledWeaponComponentSlotRecord | null> = {
    0: null,
    1: null,
    2: null,
  };
  if (!weaponInstanceId || !state?.equipmentSlots) return empty;

  const eq = state.equipmentSlots;
  const direct = eq.installedWeaponComponentSlots?.[weaponInstanceId];
  if (direct) {
    return {
      0: direct[0]
        ? {
            partId: direct[0].partId,
            socketedGems: [...direct[0].socketedGems],
          }
        : null,
      1: direct[1]
        ? {
            partId: direct[1].partId,
            socketedGems: [...direct[1].socketedGems],
          }
        : null,
      2: direct[2]
        ? {
            partId: direct[2].partId,
            socketedGems: [...direct[2].socketedGems],
          }
        : null,
    };
  }

  // Fallback for legacy `installedWeaponComponents` map
  const legacyMap = eq.installedWeaponComponents?.[weaponInstanceId];
  const { slotGems } = parseEquipmentInstanceId(weaponInstanceId);
  if (legacyMap) {
    const entries = Object.values(legacyMap);
    for (let i = 0; i < Math.min(3, entries.length); i++) {
      const partId = entries[i];
      if (partId && BESPOKE_WEAPON_COMPONENT_BY_ID[partId]) {
        const slotIdx = i as 0 | 1 | 2;
        const g = slotGems[slotIdx] || null;
        empty[slotIdx] = {
          partId,
          socketedGems: g ? [g] : [],
        };
      }
    }
  }
  return empty;
}

/**
 * Resolves the dedicated `1G` Factory Resonance Gem socketed on a `Magitech` Purist Relic.
 */
export function getMagitechResonanceGem(
  state: OrionState | undefined,
  weaponInstanceId: string | null | undefined
): GemId | null {
  if (!weaponInstanceId) return null;
  const { baseId, installedGems } = parseEquipmentInstanceId(weaponInstanceId);
  const wDef = getWeaponDefinition(baseId) || getWeaponDefinition(weaponInstanceId);
  if (!wDef || wDef.weaponTier !== 'unique') return null;

  const map = state?.equipmentSlots?.installedMagitechResonanceGems;
  if (map) {
    if (weaponInstanceId in map) {
      const g = map[weaponInstanceId];
      return isCanonicalGemId(g) ? g : null;
    }
    if (baseId in map) {
      const g = map[baseId];
      return isCanonicalGemId(g) ? g : null;
    }
  }

  // Fallback for legacy single-gem composite instance IDs when no open-domain components are installed
  const slotRecords = getWeaponInstanceSlotRecords(state, weaponInstanceId);
  const hasAnyComponent = Boolean(slotRecords[0] || slotRecords[1] || slotRecords[2]);
  if (!hasAnyComponent && installedGems.length > 0 && isCanonicalGemId(installedGems[0])) {
    return installedGems[0];
  }
  return null;
}

/**
 * Evaluates whether a `Magitech` Purist Relic's `puristResonance` passive is currently active
 * based on the pilot's socketed Specialist Martial Stance or Core Feat Chain (`C-03`, `C-04`, `C-10`, `C-14`, `C-18`).
 */
export function evaluateMagitechPuristResonance(
  state: OrionState | undefined,
  weaponInstanceId: string | null | undefined
): {
  active: boolean;
  passive: PuristResonancePassive | null;
  targetLabel: string;
} {
  if (!weaponInstanceId) {
    return { active: false, passive: null, targetLabel: '' };
  }
  const { baseId } = parseEquipmentInstanceId(weaponInstanceId);
  const wDef = getWeaponDefinition(baseId) || getWeaponDefinition(weaponInstanceId);
  const passive = wDef?.puristResonance || null;
  if (!passive) {
    return { active: false, passive: null, targetLabel: '' };
  }

  const equippedFeats = state?.equippedFeats || [];
  if (passive.triggerType === 'SPECIALIST_STANCE') {
    const stanceDef = SPECIALIST_STANCE_LIST.find(
      (s) => s.featId === passive.targetId
    );
    const featDef = CANONICAL_FRAME_FEAT_CATALOG.find(
      (f) => f.id === passive.targetId
    );
    const targetLabel =
      stanceDef?.featName || featDef?.name || passive.targetId;
    const active = equippedFeats.includes(passive.targetId);
    return { active, passive, targetLabel };
  }

  // CORE_FEAT_CHAIN
  const chainId = passive.targetId as FeatChainId;
  const chainName = FEAT_CHAIN_NAMES[chainId] || passive.targetId;
  const targetLabel = `Core Chain ${chainId} (${chainName})`;
  const active = equippedFeats.some((fid) => {
    const f = CANONICAL_FRAME_FEAT_CATALOG.find((item) => item.id === fid);
    return f?.chainId === chainId;
  });
  return { active, passive, targetLabel };
}

/**
 * Resolves the lore-bound companion relic currently mounted on a `Legendary` weapon instance.
 */
export function getInstalledLoreBoundRelic(
  state: OrionState | undefined,
  weaponInstanceId: string | null | undefined
): LoreBoundAttachment | null {
  if (!weaponInstanceId) return null;
  const { baseId } = parseEquipmentInstanceId(weaponInstanceId);
  const wDef = getWeaponDefinition(baseId) || getWeaponDefinition(weaponInstanceId);
  const spec = wDef?.legendarySpec || LEGENDARY_WEAPONS_BY_ID[baseId];
  if (!spec || spec.boundRelicSlots.length === 0) return null;

  const map = state?.equipmentSlots?.installedLoreBoundRelics;
  const installedId = map?.[weaponInstanceId] ?? map?.[baseId] ?? null;
  if (!installedId) return null;

  return (
    spec.boundRelicSlots.find((b) => b.id === installedId) ||
    LORE_BOUND_ATTACHMENT_BY_ID[installedId] ||
    null
  );
}

/**
 * Checks whether a lore-bound companion relic is unlocked/owned by the pilot
 * (via `ownedLoreBoundRelics`, world flags, standalone ownership for `leg_juuchi_yosamu`, or Cheat/Training mode).
 */
export function isLoreBoundRelicUnlocked(
  state: OrionState | undefined,
  attachmentId: string
): boolean {
  if (!state || !attachmentId) return false;
  if (state.bypassProgressionGates || state.room === '-4,0') return true;

  const attachment = LORE_BOUND_ATTACHMENT_BY_ID[attachmentId];
  if (!attachment) return false;

  const ownedCount = state.equipmentSlots?.ownedLoreBoundRelics?.[attachmentId] ?? 0;
  if (ownedCount > 0) return true;

  if (attachmentId === 'leg_juuchi_yosamu') {
    const ownedWpnCount = state.equipmentSlots?.ownedWeaponCounts?.leg_juuchi_yosamu ?? 0;
    const inUnlocked = Boolean(
      state.equipmentSlots?.unlockedEquipment?.includes('leg_juuchi_yosamu')
    );
    if (ownedWpnCount > 0 || inUnlocked) return true;
  }

  if (
    attachment.requiredWorldFlags.length > 0 &&
    attachment.requiredWorldFlags.every((flag) => Boolean(state.flags?.[flag]))
  ) {
    return true;
  }

  return false;
}

/**
 * Returns the number of copies of a lore-bound companion relic available to the pilot.
 */
export function getOwnedLoreBoundRelicCount(
  state: OrionState | undefined,
  attachmentId: string
): number {
  if (!state || !attachmentId) return 0;
  if (state.bypassProgressionGates || state.room === '-4,0') return 1;
  const direct = state.equipmentSlots?.ownedLoreBoundRelics?.[attachmentId] ?? 0;
  if (direct > 0) return direct;
  return isLoreBoundRelicUnlocked(state, attachmentId) ? 1 : 0;
}

/**
 * Grants a lore-bound companion relic to the pilot's inventory (`state.equipmentSlots.ownedLoreBoundRelics`).
 * Mutates `state: OrionState`.
 */
export function grantLoreBoundRelic(
  state: OrionState,
  attachmentId: string,
  count: number = 1,
  ctx?: { say: (text: string) => void }
): boolean {
  const attachment = LORE_BOUND_ATTACHMENT_BY_ID[attachmentId];
  if (!attachment || count <= 0 || !state.equipmentSlots) return false;

  state.equipmentSlots.ownedLoreBoundRelics =
    state.equipmentSlots.ownedLoreBoundRelics || {};
  state.equipmentSlots.ownedLoreBoundRelics[attachmentId] =
    (state.equipmentSlots.ownedLoreBoundRelics[attachmentId] || 0) + count;

  if (attachment.canBeEquippedStandalone) {
    state.equipmentSlots.unlockedEquipment =
      state.equipmentSlots.unlockedEquipment || [];
    if (!state.equipmentSlots.unlockedEquipment.includes(attachmentId)) {
      state.equipmentSlots.unlockedEquipment.push(attachmentId);
    }
    state.equipmentSlots.ownedWeaponCounts =
      state.equipmentSlots.ownedWeaponCounts || {};
    state.equipmentSlots.ownedWeaponCounts[attachmentId] = Math.max(
      1,
      state.equipmentSlots.ownedWeaponCounts[attachmentId] || 0
    );
  }

  ctx?.say(`CLAIMED LORE-BOUND RELIC: ${attachment.name.toUpperCase()}!`);
  return true;
}

/**
 * Installs a lore-bound companion relic (`attachmentId`) onto a `Legendary` weapon (`weaponInstanceId`)
 * at the Armory Workbench, transforming its title and activating its companion engine hooks.
 * Mutates `state: OrionState`.
 */
export function installLoreBoundRelicOnLegendary(
  state: OrionState,
  weaponInstanceId: string,
  attachmentId: string,
  ctx?: { say: (text: string) => void }
): boolean {
  if (!state.equipmentSlots) return false;
  const { baseId } = parseEquipmentInstanceId(weaponInstanceId);
  const wDef = getWeaponDefinition(baseId) || getWeaponDefinition(weaponInstanceId);
  const spec = wDef?.legendarySpec || LEGENDARY_WEAPONS_BY_ID[baseId];
  if (!wDef || !spec) return false;

  const allowedRelic = spec.boundRelicSlots.find((b) => b.id === attachmentId);
  if (!allowedRelic) {
    ctx?.say(`${wDef.name.toUpperCase()} CANNOT ACCEPT THIS COMPANION RELIC.`);
    return false;
  }

  if (!isLoreBoundRelicUnlocked(state, attachmentId)) {
    ctx?.say(
      `REQUIRES ${allowedRelic.name.toUpperCase()} (${allowedRelic.acquisitionSource.toUpperCase()})`
    );
    return false;
  }

  // If fusing Juuchi Yosamu into Yawarakai-Te while Juuchi Yosamu is equipped in another hand slot, unequip the standalone copy
  if (attachmentId === 'leg_juuchi_yosamu') {
    if (
      state.equipmentSlots.slot2 &&
      parseEquipmentInstanceId(state.equipmentSlots.slot2).baseId === 'leg_juuchi_yosamu'
    ) {
      state.equipmentSlots.slot2 = null;
    }
    if (
      state.equipmentSlots.slot1 &&
      baseId !== 'leg_juuchi_yosamu' &&
      parseEquipmentInstanceId(state.equipmentSlots.slot1).baseId === 'leg_juuchi_yosamu'
    ) {
      state.equipmentSlots.slot1 = weaponInstanceId;
    }
  }

  state.equipmentSlots.installedLoreBoundRelics =
    state.equipmentSlots.installedLoreBoundRelics || {};
  state.equipmentSlots.installedLoreBoundRelics[baseId] = attachmentId;
  state.equipmentSlots.installedLoreBoundRelics[weaponInstanceId] = attachmentId;

  const transformedTitle = allowedRelic.transformedWeaponTitle || wDef.name;
  ctx?.say(
    `MOUNTED ${allowedRelic.name.toUpperCase()} → ${transformedTitle.toUpperCase()}`
  );
  return true;
}

/**
 * Unmounts the lore-bound companion relic from a `Legendary` weapon (`weaponInstanceId`)
 * at the Armory Workbench, returning the companion relic to inventory.
 * Mutates `state: OrionState`.
 */
export function removeLoreBoundRelicFromLegendary(
  state: OrionState,
  weaponInstanceId: string,
  ctx?: { say: (text: string) => void }
): boolean {
  if (!state.equipmentSlots?.installedLoreBoundRelics) return false;
  const { baseId } = parseEquipmentInstanceId(weaponInstanceId);
  const wDef = getWeaponDefinition(baseId) || getWeaponDefinition(weaponInstanceId);
  const installed = getInstalledLoreBoundRelic(state, weaponInstanceId);
  if (!installed) return false;

  state.equipmentSlots.installedLoreBoundRelics[baseId] = null;
  state.equipmentSlots.installedLoreBoundRelics[weaponInstanceId] = null;

  ctx?.say(
    `UNMOUNTED ${installed.name.toUpperCase()} FROM ${(wDef?.name || baseId).toUpperCase()}`
  );
  return true;
}

/**
 * Collects all active `LegendaryEngineHook` values across the pilot's currently equipped weapons
 * (or for a specific `specificWeaponId` when provided), including any mounted lore-bound companion relics.
 */
export function getActiveLegendaryEngineHooks(
  state: OrionState | undefined,
  specificWeaponId?: string | null
): Set<LegendaryEngineHook> {
  const hooks = new Set<LegendaryEngineHook>();
  if (!state) return hooks;

  const eq = state.equipmentSlots;
  const weaponIds = specificWeaponId
    ? [specificWeaponId]
    : ([
        eq?.slot1,
        eq?.slot2,
        eq?.slot3,
        ...(state.equippedWeapons || []),
      ].filter(Boolean) as string[]);

  for (const id of weaponIds) {
    const profile = resolveWeaponModificationProfile(state, id);
    for (const h of profile.activeLegendaryHooks) {
      hooks.add(h);
    }
  }
  return hooks;
}

/**
 * Deterministically evaluates the complete runtime modification profile for any weapon instance (`Project Orion — Magitech Purist Weapon Overhaul.md` & Custom Weapon Modification Overhaul).
 * Pure function: does not mutate `state: OrionState`.
 */
export function resolveWeaponModificationProfile(
  state: OrionState | undefined,
  weaponInstanceId: string | null | undefined
): ResolvedWeaponModificationProfile {
  const fallbackId = weaponInstanceId || 'straight_04_arming';
  const {
    baseId: rawBaseId,
    installedGems: parsedGems,
    slotTokens,
    populatedSlotCount: parsedPopulatedCount,
  } = parseEquipmentInstanceId(fallbackId);
  const wDef =
    getWeaponDefinition(rawBaseId) ||
    getWeaponDefinition(fallbackId) ||
    WEAPON_REGISTRY.straight_04_arming;
  const baseId = wDef ? parseEquipmentInstanceId(wDef.id).baseId : rawBaseId;
  const baseDef = WEAPON_REGISTRY[baseId] || wDef;
  const weaponClass: WeaponCategory = baseDef?.category || 'Blades: Straight';
  const functionalType = resolveWeaponFunctionalType(
    baseId,
    weaponClass,
    baseDef?.weaponClass,
    baseDef?.name
  );
  const isLegendary = Boolean(
    baseDef?.weaponTier === 'legendary' ||
      baseDef?.isLegendary ||
      LEGENDARY_WEAPONS_BY_ID[baseId]
  );
  const legendarySpec =
    baseDef?.legendarySpec || LEGENDARY_WEAPONS_BY_ID[baseId];
  const installedLoreBoundRelic = isLegendary
    ? getInstalledLoreBoundRelic(state, fallbackId)
    : null;
  const activeLegendaryHooks: LegendaryEngineHook[] = isLegendary
    ? Array.from(
        new Set<LegendaryEngineHook>([
          ...(legendarySpec?.innateEngineHooks || []),
          ...(installedLoreBoundRelic?.grantedEngineHooks || []),
        ])
      )
    : [];

  const isUniqueMagitech = Boolean(baseDef?.weaponTier === 'unique');
  const openDomains: ModDomain[] = isLegendary
    ? []
    : isUniqueMagitech
      ? baseDef?.openDomains ?? ['REGULATION']
      : ['CONTACT', 'DELIVERY', 'REGULATION'];
  const sealedDomains: Record<ModDomain, string | null> = isLegendary
    ? {
        CONTACT: 'Immutable Folklore Relic',
        DELIVERY: 'Immutable Folklore Relic',
        REGULATION: 'Immutable Folklore Relic',
      }
    : isUniqueMagitech
      ? baseDef?.sealedDomains ?? {
          CONTACT: openDomains.includes('CONTACT') ? null : 'Factory-Sealed Contact Assembly',
          DELIVERY: openDomains.includes('DELIVERY') ? null : 'Factory-Sealed Delivery Assembly',
          REGULATION: openDomains.includes('REGULATION') ? null : 'Factory-Sealed Regulation Assembly',
        }
      : { CONTACT: null, DELIVERY: null, REGULATION: null };
  const architectureTier = isUniqueMagitech
    ? baseDef?.architectureTier ??
      (openDomains.length === 0
        ? 'SEALED_MONOLITH'
        : openDomains.length === 1
          ? 'SEMI_SEALED_ASSEMBLY'
          : openDomains.length === 2
            ? 'MODULAR_FRAME_RELIC'
            : 'REFERENCE_PLATFORM')
    : undefined;
  const resonanceGem = isUniqueMagitech ? getMagitechResonanceGem(state, fallbackId) : null;
  const resonanceEval = isUniqueMagitech
    ? evaluateMagitechPuristResonance(state, fallbackId)
    : { active: false, passive: null, targetLabel: '' };

  const baseDamageType: DamageType = baseDef?.primaryDamageType || 'Pierce';
  const baseAction1Mode = resolveWeaponClassAction1Mode(weaponClass);

  const slotRecords = getWeaponInstanceSlotRecords(state, fallbackId);
  const installedMods: Array<{ slotIndex: 0 | 1 | 2; mod: WeaponComponentMod }> = [];
  let contactMod: WeaponComponentMod | null = null;
  let deliveryMod: WeaponComponentMod | null = null;
  let regulationMod: WeaponComponentMod | null = null;
  const socketedGems: GemId[] = [];

  if (!isLegendary) {
    if (resonanceGem) {
      socketedGems.push(resonanceGem);
    }

    for (const idx of [0, 1, 2] as const) {
      const rec = slotRecords[idx];
      if (!rec) continue;
      const mod = BESPOKE_WEAPON_COMPONENT_BY_ID[rec.partId];
      if (
        mod &&
        mod.weaponClass === weaponClass &&
        (!isUniqueMagitech || openDomains.includes(mod.domain))
      ) {
        installedMods.push({ slotIndex: idx, mod });
        if (mod.domain === 'CONTACT' && !contactMod) contactMod = mod;
        if (mod.domain === 'DELIVERY' && !deliveryMod) deliveryMod = mod;
        if (mod.domain === 'REGULATION' && !regulationMod) regulationMod = mod;
      }
      for (const g of rec.socketedGems) {
        if (isCanonicalGemId(g)) {
          socketedGems.push(g);
        }
      }
    }

    // If no component slot records exist yet on a Custom weapon with direct gem instance ID
    if (!isUniqueMagitech && installedMods.length === 0 && parsedGems.length > 0) {
      for (const g of parsedGems) {
        socketedGems.push(g);
      }
    }
  }

  const populatedSlotCount = isLegendary
    ? installedLoreBoundRelic
      ? 1
      : 0
    : installedMods.length > 0
      ? installedMods.length
      : isUniqueMagitech
        ? resonanceGem
          ? 1
          : 0
        : Math.max(parsedPopulatedCount, parsedGems.length);

  // Rule 2.3: Resolve Effective Damage Type deterministically from CONTACT domain component only
  let effectiveDamageType: DamageType =
    contactMod?.damageTypeOverride ?? baseDamageType;
  if (
    contactMod?.id === 'wmod_carrier_concussive_shock_charge' &&
    functionalType === 'Rack'
  ) {
    effectiveDamageType = 'Blast';
  }
  const damageTypeConverted = effectiveDamageType !== baseDamageType;

  // Rule 2.4 & §4 Step 3: Accumulate Stats & Action 1 Overrides
  let weightDelta = 0;
  let tempoDelta = 0;
  let impulseMultDelta = 0;
  let rangedImpulseMultDelta = 0;
  let thrPierceDelta = 0;
  let durShredMultDelta = 0;
  let shieldDmgMultDelta = 0;
  let stabilityDelta = 0;
  let heatPerActionDelta = 0;
  let heatCostMultDelta = 0;
  let heatVentOnHit = 0;
  let heatVentOnBlock = 0;
  let parryWindowBonusSec = 0;
  let swapSpeedMultDelta = 0;
  let recoilMultDelta = 0;
  let rangeMultDelta = 0;
  let cleaveArcMultDelta = 0;
  let bcuMultDelta = 0;
  let finisherBcuMultDelta = 0;
  let step1BcuMultDelta = 0;
  let lungeMultDelta = 0;
  let muChargeMultDelta = 0;
  let targetMuStripOnHit = 0;
  let shieldRegenDebuffSec = 0;
  let drawTimeMultDelta = 0;
  let drawHoldDrainMultDelta = 0;
  let eliminateMoveAimSway = false;
  let shieldDurabilityDelta = 0;
  let armorThresholdDelta = 0;
  let armorRatingDelta = 0;
  let guardMitigationMultDelta = 0;
  let internalAmmoDelta = 0;
  let projectileVelocityMultDelta = 0;

  let effectiveAction1Mode: Action1Mode = baseAction1Mode;
  let behavioralOverride: Action1Override | null = null;
  let ammoMultiplier = 1.0;
  let reloadTimeMultiplier = 1.0;
  let volleyBonusCount = 0;
  let comboStepCountOverride: number | null = null;
  let finisherReachMultiplier = 1.0;
  let secondaryProjectile: Action1Override['secondaryProjectile'] | null = null;

  for (const { mod } of installedMods) {
    const s = mod.statModifiers;
    weightDelta += s.weightDelta ?? 0;
    tempoDelta += s.tempoDelta ?? 0;
    impulseMultDelta += s.impulseMultDelta ?? 0;
    rangedImpulseMultDelta += s.rangedImpulseMultDelta ?? 0;
    thrPierceDelta += s.thrPierceDelta ?? 0;
    durShredMultDelta += s.durShredMultDelta ?? 0;
    shieldDmgMultDelta += s.shieldDmgMultDelta ?? 0;
    stabilityDelta += s.stabilityDelta ?? 0;
    heatPerActionDelta += s.heatPerActionDelta ?? 0;
    heatCostMultDelta += s.heatCostMultDelta ?? 0;
    heatVentOnHit += s.heatVentOnHit ?? 0;
    heatVentOnBlock += s.heatVentOnBlock ?? 0;
    parryWindowBonusSec += s.parryWindowBonusSec ?? 0;
    swapSpeedMultDelta += s.swapSpeedMultDelta ?? 0;
    recoilMultDelta += s.recoilMultDelta ?? 0;
    rangeMultDelta += s.rangeMultDelta ?? 0;
    cleaveArcMultDelta += s.cleaveArcMultDelta ?? 0;
    bcuMultDelta += s.bcuMultDelta ?? 0;
    finisherBcuMultDelta += s.finisherBcuMultDelta ?? 0;
    step1BcuMultDelta += s.step1BcuMultDelta ?? 0;
    lungeMultDelta += s.lungeMultDelta ?? 0;
    muChargeMultDelta += s.muChargeMultDelta ?? 0;
    targetMuStripOnHit += s.targetMuStripOnHit ?? 0;
    shieldRegenDebuffSec = Math.max(
      shieldRegenDebuffSec,
      s.shieldRegenDebuffSec ?? 0
    );
    drawTimeMultDelta += s.drawTimeMultDelta ?? 0;
    drawHoldDrainMultDelta += s.drawHoldDrainMultDelta ?? 0;
    if ((s.eliminateMoveAimSway ?? 0) > 0) {
      eliminateMoveAimSway = true;
    }
    // Physical Domain Separation (§2.5): Only Shields modify Layer 2 Armor stats
    if (weaponClass === 'Shields') {
      shieldDurabilityDelta += s.shieldDurabilityDelta ?? 0;
      armorThresholdDelta += s.armorThresholdDelta ?? 0;
      armorRatingDelta += s.armorRatingDelta ?? 0;
    }
    guardMitigationMultDelta += s.guardMitigationMultDelta ?? 0;
    internalAmmoDelta += s.internalAmmoDelta ?? 0;
    projectileVelocityMultDelta += s.projectileVelocityMultDelta ?? 0;

    if (mod.action1Override) {
      const a1 = mod.action1Override;
      if (a1.kind === 'BEHAVIORAL' && !behavioralOverride) {
        behavioralOverride = a1;
        if (a1.setsMode) {
          effectiveAction1Mode = a1.setsMode;
        }
        if (a1.secondaryProjectile) {
          secondaryProjectile = a1.secondaryProjectile;
        }
      }
      if (typeof a1.ammoMultiplier === 'number') {
        ammoMultiplier *= a1.ammoMultiplier;
      }
      if (typeof a1.reloadTimeMultiplier === 'number') {
        reloadTimeMultiplier *= a1.reloadTimeMultiplier;
      }
      if (typeof a1.volleyBonusCount === 'number') {
        volleyBonusCount += a1.volleyBonusCount;
      }
      if (typeof a1.comboStepCountOverride === 'number') {
        comboStepCountOverride = a1.comboStepCountOverride;
      }
      if (typeof a1.finisherReachMultiplier === 'number') {
        finisherReachMultiplier *= a1.finisherReachMultiplier;
      }
    }
  }

  // Apply active Magitech Purist Resonance bonuses when the paired Specialist Stance or Core Feat Chain is socketed
  if (isUniqueMagitech && resonanceEval.active) {
    switch (baseId) {
      case 's3_viper_partisan':
        tempoDelta += 0.12;
        break;
      case 'ti110_aegis_buckler':
        impulseMultDelta += 0.15;
        break;
      case 'n60_limitanei_spatha':
      case 'n12_plumbata_pod':
        bcuMultDelta += 0.15;
        break;
      case 'm450_arbalest_greatbow':
        thrPierceDelta += 6;
        heatVentOnHit += 3;
        break;
      case 'm10_bodkin_quiver':
        drawTimeMultDelta -= 0.1;
        tempoDelta += 0.1;
        break;
      case 'n55_gladius':
      case 'n20_rotary_bandolier':
        heatVentOnHit += 2;
        recoilMultDelta -= 0.25;
        break;
      case 'n75_praetorian_spatha':
        thrPierceDelta += 4;
        stabilityDelta += 4;
        break;
      case 'ti400_aegis_scutum':
        impulseMultDelta += 0.25;
        stabilityDelta += 4;
        break;
      case 'ls900_swordspear':
        cleaveArcMultDelta += 0.2;
        break;
      case 'hl110_dawnblade':
      case 'ti350_radiant_corona':
        heatVentOnHit += 2;
        heatVentOnBlock += 5;
        break;
      case 's9_turbine_odachi':
        lungeMultDelta += 0.25;
        break;
      case 'hl310_sarissa_pike':
        targetMuStripOnHit = 1.0;
        break;
      case 'hl220_lightburst_lance':
        muChargeMultDelta += 0.25;
        impulseMultDelta += 0.2;
        break;
      case 's6_phantom_messer':
      case 'vx10_eclipse_disc':
        heatVentOnBlock += 5;
        parryWindowBonusSec += 0.05;
        break;
      case 's2_turbine_khopesh':
      case 'sv12_viper':
        reloadTimeMultiplier *= 0.85;
        break;
      case 's8_ghost_katana':
      case 's4_whisper_wakizashi':
        thrPierceDelta += 3;
        break;
      case 'sv22_stiletto_spatha':
      case 's5_whisper_cinquedea':
        thrPierceDelta += 5;
        heatVentOnHit += 3;
        parryWindowBonusSec += 0.05;
        break;
      case 'm300_cantabrian_recurve':
      case 'vx15_ghost_yebira':
        drawTimeMultDelta -= 0.18;
        eliminateMoveAimSway = true;
        break;
      case 'b40_ripper_falx':
        durShredMultDelta += 0.25;
        shieldDmgMultDelta += 0.2;
        break;
      case 'b55_skjaldborg_axe':
        heatVentOnHit += 5;
        break;
      case 'b80_doppelsoldner_greatsword':
        impulseMultDelta += 0.25;
        heatVentOnHit += 4;
        break;
      case 'm350_mauler':
      case 'ln1200_avalanche':
      case 'lg950_tomahawk':
        reloadTimeMultiplier *= 0.85;
        break;
      case 'wz310_aether_spatha':
      case 'wz450_sparkstrike':
      case 'arc_conductor':
        bcuMultDelta += 0.15;
        break;
      case 'cl210_sanctum_mace':
      case 'cl150_ward_mote':
        guardMitigationMultDelta += 0.15;
        heatVentOnBlock += 3;
        break;
      case 'wz200_manacore_staff':
      case 'wz650_prism_lance':
        cleaveArcMultDelta += 0.2;
        break;
      case 'sr440_shadowfang':
        thrPierceDelta += 6;
        bcuMultDelta += 0.2;
        break;
      case 'wz800_arclight_cannon':
        durShredMultDelta += 0.2;
        heatCostMultDelta -= 0.15;
        break;
      case 'b25_brushcutter':
        rangedImpulseMultDelta += 0.2;
        shieldDmgMultDelta += 0.15;
        break;
      case 'rs450_radiant_projector':
        cleaveArcMultDelta += 0.2;
        break;
      case 'cl500_absolution':
        heatVentOnHit += 3;
        bcuMultDelta += 0.12;
        break;
    }
  }

  // Apply resonance modifiers from Gemstones (1G Factory Resonance Gem + Gems socketed inside open-domain components)
  for (const g of socketedGems) {
    weightDelta += GEM_SOCKET_WEIGHT_DELTA[g] ?? 0;
    switch (g) {
      case 'moonstone':
        shieldDmgMultDelta += 0.08;
        bcuMultDelta -= 0.03;
        break;
      case 'spinel':
        bcuMultDelta += (state?.heat ?? 0) >= 50 ? 0.12 : 0.08;
        heatCostMultDelta += 0.08;
        break;
      case 'carnelian':
        durShredMultDelta += 0.1;
        impulseMultDelta += 0.1;
        rangedImpulseMultDelta += 0.1;
        tempoDelta -= 0.04;
        break;
      case 'titanite':
        stabilityDelta += 2;
        if (weaponClass === 'Shields') {
          shieldDurabilityDelta += 10;
        }
        break;
      case 'demantoid':
        heatCostMultDelta -= 0.1;
        projectileVelocityMultDelta -= 0.04;
        break;
      case 'kyanite':
        projectileVelocityMultDelta += 0.1;
        rangeMultDelta += 0.08;
        heatCostMultDelta += 0.05;
        break;
      case 'charoite':
        tempoDelta += 0.05;
        impulseMultDelta -= 0.06;
        break;
      case 'rubellite':
        bcuMultDelta += 0.08;
        heatCostMultDelta += 0.08;
        break;
      case 'hematite':
        heatVentOnHit += 2;
        tempoDelta -= 0.04;
        break;
    }
  }

  // Apply Legendary combined weight override (e.g. Yawarakai-Te + Juuchi Yosamu -> 16 WT)
  if (
    isLegendary &&
    installedLoreBoundRelic?.combinedWeightOverride !== undefined
  ) {
    const baseWt =
      legendarySpec?.weight ?? baseDef?.explicitEquipWeight ?? 9;
    weightDelta += installedLoreBoundRelic.combinedWeightOverride - baseWt;
  }

  const rawTempoMultiplier = Number((1 + tempoDelta).toFixed(3));
  // Rule 2.5: Cumulative Combat Tempo Hard Cap (±30% -> [0.70, 1.30])
  const clampedTempoMultiplier = Number(
    Math.max(0.7, Math.min(1.3, rawTempoMultiplier)).toFixed(3)
  );

  // Semantic Naming for Legendary Relics (Lore-Bound Transformed Title), Magitech Relics (<BaseName> Custom, +II, +III), and Custom Weapons
  let semanticDisplayName: string;
  if (isLegendary) {
    semanticDisplayName =
      installedLoreBoundRelic?.transformedWeaponTitle ||
      baseDef?.name ||
      baseId;
  } else if (isUniqueMagitech && installedMods.length > 0) {
    const tierSuffix =
      installedMods.length >= 3
        ? ' +III'
        : installedMods.length === 2
          ? ' +II'
          : '';
    semanticDisplayName = `${baseDef?.name || baseId} Custom${tierSuffix}`;
  } else {
    semanticDisplayName = formatModifiedEquipmentName(
      baseDef?.name || baseId,
      slotTokens,
      populatedSlotCount
    );
  }

  const resolvedStatModifiers = {
    weightDelta,
    rawTempoMultiplier,
    clampedTempoMultiplier,
    meleeImpulseMultiplier: Number(Math.max(0.4, 1 + impulseMultDelta).toFixed(2)),
    rangedImpulseMultiplier: Number(
      Math.max(0.4, 1 + rangedImpulseMultDelta).toFixed(2)
    ),
    thrPierceDelta,
    durShredMultiplier: Number(Math.max(0.5, 1 + durShredMultDelta).toFixed(2)),
    shieldDamageMultiplier: Number(
      Math.max(0.5, 1 + shieldDmgMultDelta).toFixed(2)
    ),
    stabilityDelta,
    heatPerActionDelta,
    heatCostMultiplier: Number(Math.max(0.4, 1 + heatCostMultDelta).toFixed(2)),
    heatVentOnHit,
    heatVentOnBlock,
    parryWindowBonusSec: Number(parryWindowBonusSec.toFixed(3)),
    swapTimeMultiplier: Number(
      Math.max(0.7, Math.min(1.3, 1 - swapSpeedMultDelta)).toFixed(2)
    ),
    recoilMultiplier: Number(Math.max(0.25, 1 + recoilMultDelta).toFixed(2)),
    rangeMultiplier: Number(Math.max(0.5, 1 + rangeMultDelta).toFixed(2)),
    finisherReachMultiplier: Number(finisherReachMultiplier.toFixed(2)),
    cleaveArcMultiplier: Number(
      Math.max(0.5, 1 + cleaveArcMultDelta).toFixed(2)
    ),
    bcuDamageMultiplier: Number(Math.max(0.35, 1 + bcuMultDelta).toFixed(2)),
    finisherBcuMultiplier: Number(
      Math.max(0.5, 1 + finisherBcuMultDelta).toFixed(2)
    ),
    step1BcuMultiplier: Number(Math.max(0.5, 1 + step1BcuMultDelta).toFixed(2)),
    lungeDistanceMultiplier: Number(
      Math.max(0.5, 1 + lungeMultDelta).toFixed(2)
    ),
    muChargeMultiplier: Number(Math.max(0.5, 1 + muChargeMultDelta).toFixed(2)),
    targetMuStripOnHit: Number(
      Math.max(0, Math.min(1, targetMuStripOnHit)).toFixed(2)
    ),
    shieldRegenDebuffSec,
    bowDrawTimeMultiplier: Number(
      Math.max(0.7, Math.min(1.3, 1 + drawTimeMultDelta)).toFixed(2)
    ),
    bowDrawHoldDrainMultiplier: Number(
      Math.max(0.2, 1 + drawHoldDrainMultDelta).toFixed(2)
    ),
    eliminateMoveAimSway,
    shieldDurabilityDelta,
    armorThresholdDelta,
    armorRatingDelta,
    guardMitigationMultiplier: Number(
      Math.max(0.5, 1 + guardMitigationMultDelta).toFixed(2)
    ),
    internalAmmoDelta,
    projectileVelocityMultiplier: Number(
      Math.max(0.5, 1 + projectileVelocityMultDelta).toFixed(2)
    ),
  };

  const slots: ResolvedWeaponModificationProfile['slots'] = (
    [0, 1, 2] as const
  ).map((slotIndex) => {
    const rec = slotRecords[slotIndex];
    const comp = rec ? BESPOKE_WEAPON_COMPONENT_BY_ID[rec.partId] || null : null;
    const validComp =
      comp &&
      comp.weaponClass === weaponClass &&
      (!isUniqueMagitech || openDomains.includes(comp.domain))
        ? comp
        : null;
    return {
      slotIndex,
      component: validComp,
      socketedGems: rec ? [...rec.socketedGems] : [],
    };
  });

  return {
    baseId,
    instanceId: fallbackId,
    weaponClass,
    functionalType,
    isUniqueMagitech,
    isLegendary,
    legendarySpec,
    installedLoreBoundRelic,
    activeLegendaryHooks,
    architectureTier,
    openDomains,
    sealedDomains,
    resonanceGem,
    puristResonance: resonanceEval.passive || undefined,
    puristResonanceActive: resonanceEval.active,
    puristResonanceTargetLabel: resonanceEval.targetLabel,
    populatedSlotCount,
    occupiedSlotCount: populatedSlotCount,
    semanticDisplayName,
    slotRecords,
    slots,
    installedMods,
    contactMod,
    deliveryMod,
    regulationMod,
    socketedGems,
    allSocketedGems: socketedGems,
    baseDamageType,
    effectiveDamageType,
    damageTypeConverted,
    damageTypeConvertedFromContact: damageTypeConverted,
    baseAction1Mode,
    effectiveAction1Mode,
    behavioralOverride,
    ammoMultiplier: Number(ammoMultiplier.toFixed(2)),
    reloadTimeMultiplier: Number(reloadTimeMultiplier.toFixed(2)),
    volleyBonusCount,
    comboStepCountOverride,
    secondaryProjectile,
    ...resolvedStatModifiers,
    statModifiers: resolvedStatModifiers,
  };
}

/**
 * Validates whether a bespoke weapon component (`candidatePartId`) can be installed into `targetSlotIndex` (`0 | 1 | 2`)
 * on `weaponInstanceId`, enforcing:
 * 1. Weapon Class Match (`mod.weaponClass === weapon.category`)
 * 2. Magitech Sealed vs. Exposed Domain Rules (`canInstallComponentOnMagitech` when `weaponTier === 'unique'`)
 * 3. Domain Uniqueness Guardrail (at most one component per `CONTACT`, `DELIVERY`, or `REGULATION` domain)
 * 4. Single-Behavior Guardrail (at most one `BEHAVIORAL` Action 1 override)
 * 5. Mode Compatibility Guardrail (`requiresMode` matches the weapon's Action 1 mode)
 */
export function validateWeaponComponentInstallation(
  state: OrionState | undefined,
  weaponInstanceId: string,
  targetSlotIndex: 0 | 1 | 2,
  candidatePartId: string
): WeaponComponentValidationResult {
  const mod = BESPOKE_WEAPON_COMPONENT_BY_ID[candidatePartId];
  if (!mod) {
    return {
      valid: false,
      reason: 'Unknown component specification',
      conflictingDomainSlotIndex: null,
      conflictingBehavioralSlotIndex: null,
    };
  }
  const { baseId } = parseEquipmentInstanceId(weaponInstanceId);
  const wDef = getWeaponDefinition(baseId) || getWeaponDefinition(weaponInstanceId);
  if (!wDef) {
    return {
      valid: false,
      reason: 'Weapon definition not found',
      conflictingDomainSlotIndex: null,
      conflictingBehavioralSlotIndex: null,
    };
  }
  if (wDef.weaponTier === 'legendary' || wDef.isLegendary) {
    return {
      valid: false,
      reason:
        'Legendary folklore relics cannot accept standard components (lore-bound companion relics only).',
      conflictingDomainSlotIndex: null,
      conflictingBehavioralSlotIndex: null,
    };
  }
  if (wDef.category !== mod.weaponClass) {
    return {
      valid: false,
      reason: `Requires weapon class ${mod.weaponClass} (current: ${wDef.category || 'Unknown'})`,
      conflictingDomainSlotIndex: null,
      conflictingBehavioralSlotIndex: null,
    };
  }

  const slotRecords = getWeaponInstanceSlotRecords(state, weaponInstanceId);
  const otherInstalledDomains = new Set<ModDomain>();
  let conflictingDomainSlotIndex: 0 | 1 | 2 | null = null;
  let conflictingBehavioralSlotIndex: 0 | 1 | 2 | null = null;

  for (const idx of [0, 1, 2] as const) {
    if (idx === targetSlotIndex) continue;
    const rec = slotRecords[idx];
    if (!rec) continue;
    const otherMod = BESPOKE_WEAPON_COMPONENT_BY_ID[rec.partId];
    if (!otherMod) continue;
    otherInstalledDomains.add(otherMod.domain);
    if (otherMod.domain === mod.domain) {
      conflictingDomainSlotIndex = idx;
    }
    if (
      mod.action1Override?.kind === 'BEHAVIORAL' &&
      otherMod.action1Override?.kind === 'BEHAVIORAL'
    ) {
      conflictingBehavioralSlotIndex = idx;
    }
  }

  // Enforce Magitech Sealed vs. Exposed Domain rules (§2.2 & §5)
  if (wDef.weaponTier === 'unique') {
    const magitechCheck = canInstallComponentOnMagitech(
      {
        weaponClass: wDef.category || mod.weaponClass,
        openDomains: wDef.openDomains || [],
        sealedDomains: wDef.sealedDomains || {
          CONTACT: 'Factory-Sealed Assembly',
          DELIVERY: 'Factory-Sealed Assembly',
          REGULATION: 'Factory-Sealed Assembly',
        },
      },
      mod.weaponClass,
      mod.domain,
      otherInstalledDomains
    );
    if (!magitechCheck.ok) {
      return {
        valid: false,
        reason: magitechCheck.reason || `${mod.domain} is factory-sealed on ${wDef.name}.`,
        conflictingDomainSlotIndex,
        conflictingBehavioralSlotIndex,
      };
    }
  }

  const baseAction1Mode = resolveWeaponClassAction1Mode(wDef.category);
  if (
    mod.action1Override?.requiresMode &&
    mod.action1Override.requiresMode !== baseAction1Mode
  ) {
    return {
      valid: false,
      reason: `Requires Action 1 mode ${mod.action1Override.requiresMode}`,
      conflictingDomainSlotIndex: null,
      conflictingBehavioralSlotIndex: null,
    };
  }

  if (conflictingDomainSlotIndex !== null) {
    const otherMod =
      BESPOKE_WEAPON_COMPONENT_BY_ID[
        slotRecords[conflictingDomainSlotIndex]?.partId || ''
      ];
    return {
      valid: false,
      reason: `${mod.domain} domain already occupied in Slot ${conflictingDomainSlotIndex + 1} (${otherMod?.name || 'Component'})`,
      conflictingDomainSlotIndex,
      conflictingBehavioralSlotIndex,
    };
  }

  if (conflictingBehavioralSlotIndex !== null) {
    const otherMod =
      BESPOKE_WEAPON_COMPONENT_BY_ID[
        slotRecords[conflictingBehavioralSlotIndex]?.partId || ''
      ];
    return {
      valid: false,
      reason: `Action 1 Behavioral slot already active in Slot ${conflictingBehavioralSlotIndex + 1} (${otherMod?.name || 'Component'})`,
      conflictingDomainSlotIndex: null,
      conflictingBehavioralSlotIndex,
    };
  }

  return {
    valid: true,
    reason: 'Compatible',
    conflictingDomainSlotIndex: null,
    conflictingBehavioralSlotIndex: null,
  };
}

/**
 * Returns the number of salvaged copies of a `LOOTED` weapon component currently in the pilot's inventory.
 */
export function getOwnedLootedComponentCount(
  state: OrionState | undefined,
  partId: string
): number {
  if (!state || !partId) return 0;
  if (state.bypassProgressionGates || state.room === '-4,0') return 3;
  return Math.max(
    0,
    state.equipmentSlots?.ownedLootedComponents?.[partId] ?? 0
  );
}

/**
 * Grants `count` salvaged copies of a `LOOTED` weapon component to `state.equipmentSlots.ownedLootedComponents`.
 * Never grants `CRAFTED` components (`Project Orion — Weapon Modification Overhaul Specification.md` §2.2).
 * Mutates `state: OrionState`.
 */
export function grantLootedWeaponComponent(
  state: OrionState,
  partId: string,
  count: number = 1,
  ctx?: { say: (text: string) => void }
): boolean {
  const mod = BESPOKE_WEAPON_COMPONENT_BY_ID[partId];
  if (!mod || mod.acquisitionSource !== 'LOOTED' || count <= 0) {
    return false;
  }
  if (!state.equipmentSlots) return false;
  state.equipmentSlots.ownedLootedComponents =
    state.equipmentSlots.ownedLootedComponents || {};
  state.equipmentSlots.ownedLootedComponents[partId] =
    (state.equipmentSlots.ownedLootedComponents[partId] || 0) + count;
  ctx?.say(
    `SALVAGED ${mod.weaponClass.toUpperCase()} COMPONENT: ${mod.name.toUpperCase()} [${mod.domain} · ${mod.maxGemSlots}G]`
  );
  return true;
}

/**
 * Deterministically selects and grants a field-discovered `LOOTED` weapon component from a cache or boss drop.
 * Prefers components matching the pilot's currently equipped weapon classes. Mutates `state: OrionState`.
 */
export function rollAndGrantFieldLootedComponent(
  state: OrionState,
  seedIndex: number,
  ctx?: { say: (text: string) => void }
): WeaponComponentMod | null {
  if (LOOTED_WEAPON_COMPONENT_POOL.length === 0) return null;
  const eq = state.equipmentSlots;
  const equippedIds = [eq?.slot1, eq?.slot2, eq?.slot3].filter(
    Boolean
  ) as string[];
  const equippedClasses = new Set<WeaponCategory>();
  for (const id of equippedIds) {
    const wDef = getWeaponDefinition(id);
    if (wDef?.category) equippedClasses.add(wDef.category);
  }
  const preferredPool = LOOTED_WEAPON_COMPONENT_POOL.filter((m) =>
    equippedClasses.has(m.weaponClass)
  );
  const activePool =
    preferredPool.length > 0 && seedIndex % 3 !== 0
      ? preferredPool
      : LOOTED_WEAPON_COMPONENT_POOL;
  const chosen =
    activePool[Math.abs(seedIndex) % activePool.length] ||
    LOOTED_WEAPON_COMPONENT_POOL[0];
  if (!chosen) return null;
  grantLootedWeaponComponent(state, chosen.id, 1, ctx);
  return chosen;
}

/**
 * Computes the 3-slot composite token array (`Array<GemId | 'mod' | null>`) from a weapon's 3 slot records.
 */
function buildSlotTokensFromRecords(
  records: Record<0 | 1 | 2, InstalledWeaponComponentSlotRecord | null>
): Array<GemId | 'mod' | null> {
  return ([0, 1, 2] as const).map((idx) => {
    const rec = records[idx];
    if (!rec) return null;
    const firstGem = rec.socketedGems.find((g): g is GemId =>
      isCanonicalGemId(g)
    );
    return firstGem || 'mod';
  });
}

/**
 * Synchronizes a weapon instance upgrade/downgrade (`oldInstanceId -> newInstanceId`) across `state.equipmentSlots`,
 * updating `ownedWeaponCounts`, `unlockedEquipment`, equipped `slot1`/`slot2`/`slot3`, and `installedWeaponComponentSlots`.
 * Mutates `state: OrionState`.
 */
function transitionWeaponInstanceState(
  state: OrionState,
  oldInstanceId: string,
  newInstanceId: string,
  nextRecords: Record<0 | 1 | 2, InstalledWeaponComponentSlotRecord | null>,
  weaponClass: WeaponCategory
): void {
  const eq = state.equipmentSlots;
  if (!eq) return;
  eq.ownedWeaponCounts = eq.ownedWeaponCounts || {};
  eq.unlockedEquipment = eq.unlockedEquipment || [];
  eq.installedWeaponComponentSlots = eq.installedWeaponComponentSlots || {};
  eq.installedWeaponComponents = eq.installedWeaponComponents || {};
  eq.installedMagitechResonanceGems = eq.installedMagitechResonanceGems || {};

  // Carry over dedicated 1G Factory Resonance Gem if transitioning a Magitech weapon instance ID
  if (
    oldInstanceId in eq.installedMagitechResonanceGems &&
    !(newInstanceId in eq.installedMagitechResonanceGems)
  ) {
    eq.installedMagitechResonanceGems[newInstanceId] =
      eq.installedMagitechResonanceGems[oldInstanceId];
  }

  // Store updated 3-slot records under newInstanceId
  const hasAnyRecord = Boolean(
    nextRecords[0] || nextRecords[1] || nextRecords[2]
  );
  if (hasAnyRecord) {
    eq.installedWeaponComponentSlots[newInstanceId] = {
      ...(nextRecords[0] ? { 0: nextRecords[0] } : {}),
      ...(nextRecords[1] ? { 1: nextRecords[1] } : {}),
      ...(nextRecords[2] ? { 2: nextRecords[2] } : {}),
    };
    const legacyCompMap: Record<string, string> = {};
    for (const idx of [0, 1, 2] as const) {
      const rec = nextRecords[idx];
      if (!rec) continue;
      const mod = BESPOKE_WEAPON_COMPONENT_BY_ID[rec.partId];
      if (mod) {
        const legacySlot = mapDomainToLegacyComponentSlot(
          weaponClass,
          mod.domain
        );
        legacyCompMap[legacySlot] = mod.id;
      }
    }
    eq.installedWeaponComponents[newInstanceId] = legacyCompMap;
  } else {
    delete eq.installedWeaponComponentSlots[newInstanceId];
    delete eq.installedWeaponComponents[newInstanceId];
  }

  if (oldInstanceId === newInstanceId) return;

  const oldCount = Math.max(1, eq.ownedWeaponCounts[oldInstanceId] ?? 1);
  const remainingOld = Math.max(0, oldCount - 1);
  eq.ownedWeaponCounts[oldInstanceId] = remainingOld;
  if (remainingOld <= 0) {
    eq.unlockedEquipment = eq.unlockedEquipment.filter(
      (u) => u !== oldInstanceId
    );
    delete eq.installedWeaponComponentSlots[oldInstanceId];
    delete eq.installedWeaponComponents[oldInstanceId];
    delete eq.installedMagitechResonanceGems[oldInstanceId];
  }

  eq.ownedWeaponCounts[newInstanceId] =
    (eq.ownedWeaponCounts[newInstanceId] || 0) + 1;
  if (!eq.unlockedEquipment.includes(newInstanceId)) {
    eq.unlockedEquipment.push(newInstanceId);
  }

  let usedOldCopies = 0;
  const replaceSlotIfMatched = (
    val: string | null | undefined
  ): string | null => {
    if (!val) return null;
    if (val === oldInstanceId) {
      usedOldCopies += 1;
      if (usedOldCopies > remainingOld) {
        return newInstanceId;
      }
    }
    return val;
  };

  eq.slot1 = replaceSlotIfMatched(eq.slot1);
  eq.slot2 = replaceSlotIfMatched(eq.slot2);
  eq.slot3 = replaceSlotIfMatched(eq.slot3);

  state.equippedWeapons = (state.equippedWeapons || []).map((w) =>
    w === oldInstanceId && remainingOld === 0 ? newInstanceId : w
  );
}

/**
 * Helper to check inventory gem count without circular imports.
 */
function hasEnoughGemsInInventory(
  state: OrionState,
  gemId: GemId,
  needed: number
): boolean {
  const slot = state.inventorySlots.find((s) => s.itemId === gemId);
  return (slot?.count ?? 0) >= needed;
}

/**
 * Helper to deduct gems from `state.inventorySlots`. Mutates `state: OrionState`.
 */
function deductGemsFromInventory(
  state: OrionState,
  gemId: GemId,
  count: number
): boolean {
  const idx = state.inventorySlots.findIndex((s) => s.itemId === gemId);
  if (idx < 0 || state.inventorySlots[idx].count < count) return false;
  state.inventorySlots[idx].count -= count;
  if (state.inventorySlots[idx].count <= 0) {
    state.inventorySlots.splice(idx, 1);
  }
  return true;
}

/**
 * Helper to refund gems into `state.inventorySlots`. Mutates `state: OrionState`.
 */
function addGemsToInventory(
  state: OrionState,
  gemId: GemId,
  count: number
): void {
  if (count <= 0) return;
  const existing = state.inventorySlots.find((s) => s.itemId === gemId);
  if (existing) {
    existing.count += count;
  } else {
    state.inventorySlots.push({ itemId: gemId, count });
  }
}

/**
 * Installs or replaces a Bespoke Weapon Component (`partId`) in `slotIndex` (`0 | 1 | 2`) on `sourceInstanceId`:
 * - Supports both `Custom` weapons (`3` open domains) and `Magitech` Purist Relics (`0` to `3` open domains governed by `openDomains`).
 * - Enforces non-sequential slot installation, domain uniqueness (`CONTACT`, `DELIVERY`, `REGULATION`), sealed-domain protection, and Action 1 behavioral safety.
 * - If `autoReplaceConflictingDomain` is true and another slot holds the same domain, automatically relocates/replaces that domain slot.
 * - For `CRAFTED` parts: deducts `recipe.scrapCost` from `state.salvageScrap` and `recipe.gemstoneCount` from inventory.
 * - For `LOOTED` parts: consumes `1` copy from `state.equipmentSlots.ownedLootedComponents` (and refunds any displaced `LOOTED` part).
 * - Preserves existing socketed gems in that slot up to `mod.maxGemSlots` (refunding overflow gems to inventory).
 * Mutates `state: OrionState`.
 */
export function installBespokeWeaponComponent(
  state: OrionState,
  sourceInstanceId: string,
  slotIndex: 0 | 1 | 2,
  partId: string,
  ctx?: { say: (text: string) => void },
  options?: { autoReplaceConflictingDomain?: boolean }
): string | null {
  const mod = BESPOKE_WEAPON_COMPONENT_BY_ID[partId];
  if (!mod || !state.equipmentSlots) return null;

  const { baseId } = parseEquipmentInstanceId(sourceInstanceId);
  const wDef =
    getWeaponDefinition(baseId) || getWeaponDefinition(sourceInstanceId);
  if (!wDef) {
    return null;
  }

  let effectiveSlotIndex: 0 | 1 | 2 = slotIndex;
  let validation = validateWeaponComponentInstallation(
    state,
    sourceInstanceId,
    effectiveSlotIndex,
    partId
  );

  if (
    !validation.valid &&
    options?.autoReplaceConflictingDomain &&
    validation.conflictingDomainSlotIndex !== null
  ) {
    effectiveSlotIndex = validation.conflictingDomainSlotIndex;
    validation = validateWeaponComponentInstallation(
      state,
      sourceInstanceId,
      effectiveSlotIndex,
      partId
    );
  }

  if (!validation.valid) {
    ctx?.say(validation.reason.toUpperCase());
    return null;
  }

  const slotRecords = getWeaponInstanceSlotRecords(state, sourceInstanceId);
  const existingRecord = slotRecords[effectiveSlotIndex];
  if (existingRecord?.partId === partId) {
    ctx?.say(`${mod.name.toUpperCase()} IS ALREADY INSTALLED IN SLOT ${effectiveSlotIndex + 1}`);
    return sourceInstanceId;
  }

  const isFreeSandbox =
    Boolean(state.bypassProgressionGates) || state.room === '-4,0';

  // Verify & deduct crafting or looted inventory requirements
  if (!isFreeSandbox) {
    if (mod.acquisitionSource === 'CRAFTED') {
      const reqGemId = RECIPE_GEMSTONE_TO_ID[mod.recipe.gemstoneType];
      const reqGemCount = mod.recipe.gemstoneCount;
      const reqScrap = mod.recipe.scrapCost;
      if ((state.salvageScrap || 0) < reqScrap) {
        ctx?.say(
          `REQUIRES ${reqScrap} SCRAP TO FORGE ${mod.name.toUpperCase()} (HAVE ${state.salvageScrap || 0})`
        );
        return null;
      }
      if (!hasEnoughGemsInInventory(state, reqGemId, reqGemCount)) {
        const gName = GEMSTONE_REGISTRY[reqGemId]?.name || reqGemId;
        ctx?.say(
          `REQUIRES ${reqGemCount} ${gName.toUpperCase()} + ${reqScrap} SCRAP TO FORGE ${mod.name.toUpperCase()}`
        );
        return null;
      }
      state.salvageScrap = Math.max(0, (state.salvageScrap || 0) - reqScrap);
      deductGemsFromInventory(state, reqGemId, reqGemCount);
    } else {
      const ownedLooted = getOwnedLootedComponentCount(state, mod.id);
      if (ownedLooted <= 0) {
        ctx?.say(
          `NO SALVAGED COPY OF ${mod.name.toUpperCase()} IN INVENTORY (DISCOVER IN FIELD CACHES & DROPS)`
        );
        return null;
      }
      state.equipmentSlots.ownedLootedComponents =
        state.equipmentSlots.ownedLootedComponents || {};
      state.equipmentSlots.ownedLootedComponents[mod.id] = Math.max(
        0,
        ownedLooted - 1
      );
    }
  }

  // Refund displaced LOOTED component and any overflow socketed gems
  const prevGems = existingRecord ? [...existingRecord.socketedGems] : [];
  if (existingRecord && !isFreeSandbox) {
    const prevMod = BESPOKE_WEAPON_COMPONENT_BY_ID[existingRecord.partId];
    if (prevMod && prevMod.acquisitionSource === 'LOOTED') {
      state.equipmentSlots.ownedLootedComponents =
        state.equipmentSlots.ownedLootedComponents || {};
      state.equipmentSlots.ownedLootedComponents[prevMod.id] =
        (state.equipmentSlots.ownedLootedComponents[prevMod.id] || 0) + 1;
    }
  }

  const keptGems: Array<GemId | null> = Array.from(
    { length: mod.maxGemSlots },
    (_, i) => (isCanonicalGemId(prevGems[i]) ? prevGems[i] : null)
  );
  for (let i = mod.maxGemSlots; i < prevGems.length; i++) {
    const overflowGem = prevGems[i];
    if (isCanonicalGemId(overflowGem) && !isFreeSandbox) {
      addGemsToInventory(state, overflowGem, 1);
    }
  }

  slotRecords[effectiveSlotIndex] = {
    partId: mod.id,
    socketedGems: keptGems,
  };

  const nextTokens = buildSlotTokensFromRecords(slotRecords);
  const newInstanceId = buildEquipmentInstanceId(baseId, nextTokens);
  transitionWeaponInstanceState(
    state,
    sourceInstanceId,
    newInstanceId,
    slotRecords,
    mod.weaponClass
  );

  // Record unlock tag for post-tutorial level progression
  state.equipmentSlots.unlockedMods = state.equipmentSlots.unlockedMods || [];
  const unlockTag = `wpn_gem:${newInstanceId}`;
  if (!state.equipmentSlots.unlockedMods.includes(unlockTag)) {
    state.equipmentSlots.unlockedMods.push(unlockTag);
  }

  const resolvedProfile = resolveWeaponModificationProfile(state, newInstanceId);
  ctx?.say(
    `INSTALLED ${mod.name.toUpperCase()} [SLOT ${effectiveSlotIndex + 1} · ${mod.domain}] → ${resolvedProfile.semanticDisplayName.toUpperCase()}`
  );
  return newInstanceId;
}

/**
 * Strips/removes an installed weapon component from `slotIndex` (`0 | 1 | 2`) on `sourceInstanceId`:
 * - Refunds all Gemstones socketed inside that component back to the pilot's Gemstone inventory.
 * - If the stripped component was `LOOTED`, returns `1` copy to `state.equipmentSlots.ownedLootedComponents`.
 * Mutates `state: OrionState`.
 */
export function removeBespokeWeaponComponent(
  state: OrionState,
  sourceInstanceId: string,
  slotIndex: 0 | 1 | 2,
  ctx?: { say: (text: string) => void }
): string | null {
  if (!state.equipmentSlots) return null;
  const { baseId } = parseEquipmentInstanceId(sourceInstanceId);
  const wDef =
    getWeaponDefinition(baseId) || getWeaponDefinition(sourceInstanceId);
  const weaponClass: WeaponCategory = wDef?.category || 'Blades: Straight';

  const slotRecords = getWeaponInstanceSlotRecords(state, sourceInstanceId);
  const removedRec = slotRecords[slotIndex];
  if (!removedRec) return null;

  const isFreeSandbox =
    Boolean(state.bypassProgressionGates) || state.room === '-4,0';
  const removedMod = BESPOKE_WEAPON_COMPONENT_BY_ID[removedRec.partId];

  if (!isFreeSandbox) {
    for (const g of removedRec.socketedGems) {
      if (isCanonicalGemId(g)) {
        addGemsToInventory(state, g, 1);
      }
    }
    if (removedMod && removedMod.acquisitionSource === 'LOOTED') {
      state.equipmentSlots.ownedLootedComponents =
        state.equipmentSlots.ownedLootedComponents || {};
      state.equipmentSlots.ownedLootedComponents[removedMod.id] =
        (state.equipmentSlots.ownedLootedComponents[removedMod.id] || 0) + 1;
    }
  }

  slotRecords[slotIndex] = null;
  const nextTokens = buildSlotTokensFromRecords(slotRecords);
  const newInstanceId = buildEquipmentInstanceId(baseId, nextTokens);
  transitionWeaponInstanceState(
    state,
    sourceInstanceId,
    newInstanceId,
    slotRecords,
    weaponClass
  );

  const resolvedProfile = resolveWeaponModificationProfile(state, newInstanceId);
  ctx?.say(
    `STRIPPED ${removedMod?.name.toUpperCase() || 'COMPONENT'} FROM SLOT ${slotIndex + 1} → ${resolvedProfile.semanticDisplayName.toUpperCase()}`
  );
  return newInstanceId;
}

/**
 * Sockets a Gemstone (`gemId`) into `gemSocketIndex` (`0` for Crafted `1G`, `0..2` for Looted `1..3G`)
 * inside the component installed at `slotIndex` (`0 | 1 | 2`) on `sourceInstanceId`.
 * Mutates `state: OrionState`.
 */
export function socketGemIntoWeaponComponent(
  state: OrionState,
  sourceInstanceId: string,
  slotIndex: 0 | 1 | 2,
  gemSocketIndex: number,
  gemId: GemId,
  ctx?: { say: (text: string) => void }
): string | null {
  if (!state.equipmentSlots || !isCanonicalGemId(gemId)) return null;
  const { baseId } = parseEquipmentInstanceId(sourceInstanceId);
  const wDef =
    getWeaponDefinition(baseId) || getWeaponDefinition(sourceInstanceId);
  const weaponClass: WeaponCategory = wDef?.category || 'Blades: Straight';

  const slotRecords = getWeaponInstanceSlotRecords(state, sourceInstanceId);
  const rec = slotRecords[slotIndex];
  if (!rec) {
    ctx?.say(`INSTALL A COMPONENT IN SLOT ${slotIndex + 1} BEFORE SOCKETING A GEMSTONE`);
    return null;
  }
  const mod = BESPOKE_WEAPON_COMPONENT_BY_ID[rec.partId];
  if (!mod) return null;

  if (gemSocketIndex < 0 || gemSocketIndex >= mod.maxGemSlots) {
    ctx?.say(
      `${mod.name.toUpperCase()} SUPPORTS AT MOST ${mod.maxGemSlots} GEM SOCKET${mod.maxGemSlots > 1 ? 'S' : ''}`
    );
    return null;
  }

  const isFreeSandbox =
    Boolean(state.bypassProgressionGates) || state.room === '-4,0';
  const prevGem = rec.socketedGems[gemSocketIndex] || null;
  if (prevGem === gemId) return sourceInstanceId;

  if (!isFreeSandbox) {
    if (!hasEnoughGemsInInventory(state, gemId, 1)) {
      const gName = GEMSTONE_REGISTRY[gemId]?.name || gemId;
      ctx?.say(`REQUIRES 1 ${gName.toUpperCase()} IN INVENTORY TO SOCKET`);
      return null;
    }
    deductGemsFromInventory(state, gemId, 1);
    if (isCanonicalGemId(prevGem)) {
      addGemsToInventory(state, prevGem, 1);
    }
  }

  const nextGems: Array<GemId | null> = Array.from(
    { length: mod.maxGemSlots },
    (_, i) =>
      i === gemSocketIndex
        ? gemId
        : isCanonicalGemId(rec.socketedGems[i])
          ? rec.socketedGems[i]
          : null
  );

  slotRecords[slotIndex] = {
    partId: rec.partId,
    socketedGems: nextGems,
  };

  const nextTokens = buildSlotTokensFromRecords(slotRecords);
  const newInstanceId = buildEquipmentInstanceId(baseId, nextTokens);
  transitionWeaponInstanceState(
    state,
    sourceInstanceId,
    newInstanceId,
    slotRecords,
    weaponClass
  );

  const gName = GEMSTONE_REGISTRY[gemId]?.name || gemId;
  ctx?.say(
    `SOCKETED ${gName.toUpperCase()} INTO ${mod.name.toUpperCase()} [SOCKET ${gemSocketIndex + 1}/${mod.maxGemSlots}]`
  );
  return newInstanceId;
}

/**
 * Unsockets a Gemstone from `gemSocketIndex` (`0..2`) inside the component installed at `slotIndex` (`0 | 1 | 2`)
 * on `sourceInstanceId`, refunding the Gemstone to the pilot's inventory.
 * Mutates `state: OrionState`.
 */
export function unsocketGemFromWeaponComponent(
  state: OrionState,
  sourceInstanceId: string,
  slotIndex: 0 | 1 | 2,
  gemSocketIndex: number,
  ctx?: { say: (text: string) => void }
): string | null {
  if (!state.equipmentSlots) return null;
  const { baseId } = parseEquipmentInstanceId(sourceInstanceId);
  const wDef =
    getWeaponDefinition(baseId) || getWeaponDefinition(sourceInstanceId);
  const weaponClass: WeaponCategory = wDef?.category || 'Blades: Straight';

  const slotRecords = getWeaponInstanceSlotRecords(state, sourceInstanceId);
  const rec = slotRecords[slotIndex];
  if (!rec) return null;
  const mod = BESPOKE_WEAPON_COMPONENT_BY_ID[rec.partId];
  if (!mod) return null;

  const removedGem = rec.socketedGems[gemSocketIndex];
  if (!isCanonicalGemId(removedGem)) return null;

  const isFreeSandbox =
    Boolean(state.bypassProgressionGates) || state.room === '-4,0';
  if (!isFreeSandbox) {
    addGemsToInventory(state, removedGem, 1);
  }

  const nextGems: Array<GemId | null> = Array.from(
    { length: mod.maxGemSlots },
    (_, i) =>
      i === gemSocketIndex
        ? null
        : isCanonicalGemId(rec.socketedGems[i])
          ? rec.socketedGems[i]
          : null
  );

  slotRecords[slotIndex] = {
    partId: rec.partId,
    socketedGems: nextGems,
  };

  const nextTokens = buildSlotTokensFromRecords(slotRecords);
  const newInstanceId = buildEquipmentInstanceId(baseId, nextTokens);
  transitionWeaponInstanceState(
    state,
    sourceInstanceId,
    newInstanceId,
    slotRecords,
    weaponClass
  );

  const gName = GEMSTONE_REGISTRY[removedGem]?.name || removedGem;
  ctx?.say(
    `UNSOCKETED ${gName.toUpperCase()} FROM ${mod.name.toUpperCase()} (REFUNDED TO INVENTORY)`
  );
  return newInstanceId;
}

/**
 * Sockets a Gemstone (`gemId`) into a `Magitech` Purist Relic's dedicated `1G` Factory Resonance Gem Socket.
 * Works independently of the relic's `0` to `3` open physical component mounts (`openDomains`).
 * Mutates `state: OrionState`.
 */
export function socketResonanceGemIntoMagitechWeapon(
  state: OrionState,
  sourceInstanceId: string,
  gemId: GemId,
  ctx?: { say: (text: string) => void }
): string | null {
  if (!state.equipmentSlots || !isCanonicalGemId(gemId)) return null;
  const { baseId } = parseEquipmentInstanceId(sourceInstanceId);
  const wDef =
    getWeaponDefinition(baseId) || getWeaponDefinition(sourceInstanceId);
  if (!wDef || wDef.weaponTier !== 'unique') {
    return null;
  }

  const prevGem = getMagitechResonanceGem(state, sourceInstanceId);
  if (prevGem === gemId) return sourceInstanceId;

  const isFreeSandbox =
    Boolean(state.bypassProgressionGates) || state.room === '-4,0';
  if (!isFreeSandbox) {
    if (!hasEnoughGemsInInventory(state, gemId, 1)) {
      const gName = GEMSTONE_REGISTRY[gemId]?.name || gemId;
      ctx?.say(`REQUIRES 1 ${gName.toUpperCase()} IN INVENTORY TO SOCKET`);
      return null;
    }
    deductGemsFromInventory(state, gemId, 1);
    if (isCanonicalGemId(prevGem)) {
      addGemsToInventory(state, prevGem, 1);
    }
  }

  state.equipmentSlots.installedMagitechResonanceGems =
    state.equipmentSlots.installedMagitechResonanceGems || {};
  state.equipmentSlots.installedMagitechResonanceGems[sourceInstanceId] = gemId;
  state.equipmentSlots.installedMagitechResonanceGems[baseId] = gemId;

  // Record unlock tag for post-tutorial level progression
  state.equipmentSlots.unlockedMods = state.equipmentSlots.unlockedMods || [];
  const unlockTag = `wpn_gem:${baseId}::${gemId}`;
  if (!state.equipmentSlots.unlockedMods.includes(unlockTag)) {
    state.equipmentSlots.unlockedMods.push(unlockTag);
  }

  const gName = GEMSTONE_REGISTRY[gemId]?.name || gemId;
  ctx?.say(
    `SOCKETED ${gName.toUpperCase()} INTO ${wDef.name.toUpperCase()} [1G FACTORY RESONANCE SOCKET]`
  );
  return sourceInstanceId;
}

/**
 * Unsockets the Gemstone from a `Magitech` Purist Relic's dedicated `1G` Factory Resonance Gem Socket,
 * refunding the Gemstone to the pilot's inventory.
 * Mutates `state: OrionState`.
 */
export function unsocketResonanceGemFromMagitechWeapon(
  state: OrionState,
  sourceInstanceId: string,
  ctx?: { say: (text: string) => void }
): string | null {
  if (!state.equipmentSlots) return null;
  const { baseId } = parseEquipmentInstanceId(sourceInstanceId);
  const wDef =
    getWeaponDefinition(baseId) || getWeaponDefinition(sourceInstanceId);
  if (!wDef || wDef.weaponTier !== 'unique') {
    return null;
  }

  const removedGem = getMagitechResonanceGem(state, sourceInstanceId);
  if (!isCanonicalGemId(removedGem)) return null;

  const isFreeSandbox =
    Boolean(state.bypassProgressionGates) || state.room === '-4,0';
  if (!isFreeSandbox) {
    addGemsToInventory(state, removedGem, 1);
  }

  state.equipmentSlots.installedMagitechResonanceGems =
    state.equipmentSlots.installedMagitechResonanceGems || {};
  state.equipmentSlots.installedMagitechResonanceGems[sourceInstanceId] = null;
  state.equipmentSlots.installedMagitechResonanceGems[baseId] = null;

  const gName = GEMSTONE_REGISTRY[removedGem]?.name || removedGem;
  ctx?.say(
    `UNSOCKETED ${gName.toUpperCase()} FROM ${wDef.name.toUpperCase()} [1G FACTORY RESONANCE SOCKET]`
  );
  return sourceInstanceId;
}

export {
  BESPOKE_WEAPON_COMPONENT_BY_ID,
  BESPOKE_WEAPON_COMPONENT_CATALOG,
  LOOTED_WEAPON_COMPONENT_POOL,
  type ModDomain,
  RECIPE_GEMSTONE_TO_ID,
  resolveWeaponClassAction1Mode,
};
