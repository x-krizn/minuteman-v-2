/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  getWeaponDefinition,
  WEAPON_REGISTRY,
} from '../../database/equipment/weapons';
import {
  acquireAdditionalWeaponCopy,
  ACTION_MODIFICATION_CATALOG,
  CANONICAL_FRAME_FEAT_REGISTRY,
  CanonicalHardwareItemDefinition,
  CHASSIS_HARDWARE_CATALOG,
  computePlayerLoadMetrics,
  CRAFTED_SUBMODULE_HARDWARE,
  createInitialEquipmentSlots,
  evaluateEquipmentFeatHandling,
  findHardwareItemByNameOrId,
  formatModifiedEquipmentName,
  GEMSTONE_CATALOG,
  GEMSTONE_REGISTRY,
  generateEquipmentModWithGems,
  getBespokeComponentsForWeaponClass,
  getEquipmentDisplayName,
  getEquipmentMaxModSlots,
  getHardwareBaseWeight,
  getHardwareCapacityBonus,
  getHardwareGemBonusDescription,
  getInventoryGemCount,
  getOwnedEquipmentInstances,
  getOwnedLootedComponentCount,
  getOwnedWeaponCount,
  getWeaponComponentSlots,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
  getWeaponInstanceEquipWeight,
  getWeaponSubtypeInfo,
  installBespokeWeaponComponent,
  installGemModOnEquipment,
  installLoreBoundRelicOnLegendary,
  isEquipmentUnlocked,
  isLoreBoundRelicUnlocked,
  parseEquipmentInstanceId,
  RECIPE_GEMSTONE_TO_ID,
  removeBespokeWeaponComponent,
  removeGemModFromEquipment,
  removeLoreBoundRelicFromLegendary,
  resolveWeaponModificationProfile,
  socketGemIntoWeaponComponent,
  socketResonanceGemIntoMagitechWeapon,
  unlockEquipmentItem,
  unsocketGemFromWeaponComponent,
  unsocketResonanceGemFromMagitechWeapon,
  validateWeaponComponentInstallation,
  WEAPON_COMPONENT_PART_CATALOG,
  WEAPON_DOMAIN_ANATOMY_LABELS,
  WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS,
  WEAPON_GEM_WEIGHT_DELTA,
} from '../../database/progression';
import {
  getOrionGraphicsSettings,
  notifyOrionStateChange,
  syncStateGates,
} from '../../systems';
import {
  GemId,
  ModDomain,
  OrionState,
  WEAPON_CATEGORIES,
  WeaponCategory,
  WeaponComponentSlotId,
} from '../../types';
import {
  EditableLoadoutSlot,
  HighResEquipmentArtCanvas,
  SpriteCanvasIcon,
} from './SatchelCanvases';

/** Top-level engineering workbench categories inside the `ARMORY` menu. */
export type ArmoryWorkbenchCategory = 'weapons' | 'chassis' | 'action_mods';

/** Chassis assembly groups inside the `ARMORY` Chassis Sub-Modules & Sockets view. */
export type ArmoryChassisGroup = 'head' | 'torso' | 'arms' | 'legs';

/**
 * Props for `SatchelArmoryTab`.
 * Supports both HUD modes and mutates `state: OrionState` when installing/removing
 * weapon component parts, sub-modules, action modifications, or gemstone sockets.
 */
export interface SatchelArmoryTabProps {
  state: OrionState;
  isCheatMode: boolean;
  initialFocusSlot?: EditableLoadoutSlot | null;
  initialFocusItemId?: string | null;
  onReturnToLoadout?: () => void;
  onLocateFeat?: (featId: string) => void;
}

/**
 * Renders the `ARMORY` modification workbench tab.
 * Consolidates all modification systems out of the Loadout screen:
 * 1. Weapon Component Parts & Weapon Gem Sockets (installable in any anatomical slot order)
 * 2. Chassis Internal Sub-Modules (`Optics`, `Sensory A/B`, `Actuators`, `Reactor Core`, `Leg Actuators`) & Hardware Gem Sockets
 * 3. Action Modifications (`Structure / Melee`, `Integration / Ranged`, `Mobility Kit`)
 * Applies semantic `Custom` prefix/suffix naming (`Custom <BaseName>` or `<BaseName> Custom` + `+II`/`+III`).
 */
export const SatchelArmoryTab: React.FC<SatchelArmoryTabProps> = ({
  state,
  isCheatMode,
  initialFocusSlot,
  initialFocusItemId,
  onReturnToLoadout,
  onLocateFeat,
}) => {
  const devMode = getOrionGraphicsSettings().devModeEnabled;
  const [category, setCategory] = useState<ArmoryWorkbenchCategory>('weapons');
  const [selectedWeaponInstanceId, setSelectedWeaponInstanceId] = useState<string>(() => {
    return (
      initialFocusItemId ||
      state.equipmentSlots?.slot1 ||
      state.equippedWeapons?.[0] ||
      'long_sword'
    );
  });
  const [selectedModSlotIndex, setSelectedModSlotIndex] = useState<number>(0);
  const [chassisGroup, setChassisGroup] = useState<ArmoryChassisGroup>('head');
  const [activeHardwareSlot, setActiveHardwareSlot] = useState<
    'head' | 'optics' | 'sensoryA' | 'sensoryB' | 'plating' | 'reactor' | 'arms' | 'actuators' | 'legs'
  >('head');
  const [activeActionModCategory, setActiveActionModCategory] = useState<
    'melee' | 'ranged' | 'mobility'
  >('melee');
  const [weaponCategoryFilter, setWeaponCategoryFilter] = useState<'ALL' | WeaponCategory>('ALL');
  const [componentDomainFilter, setComponentDomainFilter] = useState<'ALL' | ModDomain>('ALL');
  const [componentSourceFilter, setComponentSourceFilter] = useState<
    'ALL' | 'CRAFTED' | 'LOOTED'
  >('ALL');
  const [selectedComponentGemSocketIdx, setSelectedComponentGemSocketIdx] = useState<number>(0);

  // Synchronize workbench focus when jumping from Loadout "Modify in Armory" context action
  useEffect(() => {
    if (initialFocusItemId) {
      const wDef = getWeaponDefinition(initialFocusItemId);
      if (wDef) {
        setCategory('weapons');
        setSelectedWeaponInstanceId(initialFocusItemId);
        setSelectedModSlotIndex(0);
        return;
      }
      const hwDef = findHardwareItemByNameOrId(initialFocusItemId);
      if (hwDef) {
        setCategory('chassis');
        const s = hwDef.slot;
        if (s === 'head' || s === 'optics' || s === 'sensoryA' || s === 'sensoryB') {
          setChassisGroup('head');
          setActiveHardwareSlot(s);
        } else if (s === 'plating' || s === 'reactor') {
          setChassisGroup('torso');
          setActiveHardwareSlot(s);
        } else if (s === 'arms' || s === 'actuators') {
          setChassisGroup('arms');
          setActiveHardwareSlot(s);
        } else if (s === 'legs') {
          setChassisGroup('legs');
          setActiveHardwareSlot('legs');
        }
        setSelectedModSlotIndex(0);
        return;
      }
    }

    if (!initialFocusSlot) return;
    if (
      initialFocusSlot === 'slot1' ||
      initialFocusSlot === 'slot2' ||
      initialFocusSlot === 'slot3'
    ) {
      setCategory('weapons');
      const eq = state.equipmentSlots;
      const targetId =
        initialFocusSlot === 'slot1'
          ? eq?.slot1
          : initialFocusSlot === 'slot2'
            ? eq?.slot2
            : eq?.slot3;
      if (targetId) {
        setSelectedWeaponInstanceId(targetId);
      }
      setSelectedModSlotIndex(0);
    } else if (
      initialFocusSlot === 'mod_melee' ||
      initialFocusSlot === 'mod_ranged' ||
      initialFocusSlot === 'mod_mobility'
    ) {
      setCategory('action_mods');
      setActiveActionModCategory(
        initialFocusSlot === 'mod_melee'
          ? 'melee'
          : initialFocusSlot === 'mod_mobility'
            ? 'mobility'
            : 'ranged'
      );
    } else if (
      initialFocusSlot === 'head' ||
      initialFocusSlot === 'optics' ||
      initialFocusSlot === 'sensoryA' ||
      initialFocusSlot === 'sensoryB'
    ) {
      setCategory('chassis');
      setChassisGroup('head');
      setActiveHardwareSlot(initialFocusSlot);
      setSelectedModSlotIndex(0);
    } else if (initialFocusSlot === 'plating' || initialFocusSlot === 'reactor') {
      setCategory('chassis');
      setChassisGroup('torso');
      setActiveHardwareSlot(initialFocusSlot);
      setSelectedModSlotIndex(0);
    } else if (initialFocusSlot === 'arms' || initialFocusSlot === 'actuators') {
      setCategory('chassis');
      setChassisGroup('arms');
      setActiveHardwareSlot(initialFocusSlot);
      setSelectedModSlotIndex(0);
    } else if (initialFocusSlot === 'legs') {
      setCategory('chassis');
      setChassisGroup('legs');
      setActiveHardwareSlot('legs');
      setSelectedModSlotIndex(0);
    }
  }, [initialFocusSlot, initialFocusItemId, state.equipmentSlots]);

  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  const eq = state.equipmentSlots;
  const loadMetrics = computePlayerLoadMetrics(state);

  const sayCtx = {
    say: (txt: string) => {
      state.toastText = txt;
      state.toastTimer = 2.8;
    },
  };

  // Build list of all owned/equipped weapon & auxiliary instances for the Armory selector
  const ownedWeaponInstances = Object.values(WEAPON_REGISTRY)
    .filter((w) => isCheatMode || isEquipmentUnlocked(state, w.id))
    .flatMap((baseW) => {
      const instances = getOwnedEquipmentInstances(state, baseW.id);
      const list = instances.length > 0 ? instances : [baseW.id];
      return list.map((instanceId) => ({ baseW, instanceId }));
    });

  const activeWeaponDef =
    getWeaponDefinition(selectedWeaponInstanceId) ||
    getWeaponDefinition(eq.slot1 || 'long_sword');
  const activeWeaponBaseId = parseEquipmentInstanceId(
    activeWeaponDef?.id || selectedWeaponInstanceId
  ).baseId;
  const activeWeaponBaseDef =
    WEAPON_REGISTRY[activeWeaponBaseId] || activeWeaponDef;

  // Resolve currently equipped hardware item ID for the active hardware slot
  const getEquippedHardwareIdForSlot = (
    slot:
      | 'head'
      | 'optics'
      | 'sensoryA'
      | 'sensoryB'
      | 'plating'
      | 'reactor'
      | 'arms'
      | 'actuators'
      | 'legs'
  ): string => {
    switch (slot) {
      case 'head':
        return eq.head || '';
      case 'optics':
        return eq.headOptics || '';
      case 'sensoryA':
        return eq.sensoryA || '';
      case 'sensoryB':
        return eq.sensoryB || '';
      case 'plating':
        return eq.plating || '';
      case 'reactor':
        return eq.reactorCore || '';
      case 'arms':
        return eq.arms || '';
      case 'actuators':
        return eq.armActuators || '';
      case 'legs':
        return eq.legs || '';
    }
  };

  const setEquippedHardwareIdForSlot = (
    slot:
      | 'head'
      | 'optics'
      | 'sensoryA'
      | 'sensoryB'
      | 'plating'
      | 'reactor'
      | 'arms'
      | 'actuators'
      | 'legs',
    itemNameOrId: string
  ) => {
    switch (slot) {
      case 'head':
        eq.head = itemNameOrId;
        if (eq.armor) eq.armor.head = itemNameOrId;
        break;
      case 'optics':
        eq.headOptics = itemNameOrId;
        break;
      case 'sensoryA':
        eq.sensoryA = itemNameOrId;
        break;
      case 'sensoryB':
        eq.sensoryB = itemNameOrId;
        break;
      case 'plating':
        eq.plating = itemNameOrId;
        if (eq.armor) eq.armor.torso = itemNameOrId;
        break;
      case 'reactor': {
        eq.reactorCore = itemNameOrId;
        if (eq.armor) eq.armor.generator = itemNameOrId;
        const hw = findHardwareItemByNameOrId(itemNameOrId);
        if (hw?.reactorFamily) {
          state.reactor = hw.reactorFamily;
        }
        break;
      }
      case 'arms':
        eq.arms = itemNameOrId;
        if (eq.armor) eq.armor.arms = itemNameOrId;
        break;
      case 'actuators':
        eq.armActuators = itemNameOrId;
        break;
      case 'legs':
        eq.legs = itemNameOrId;
        if (eq.armor) eq.armor.legs = itemNameOrId;
        break;
    }
  };

  /**
   * Renders the any-order Mod & Gem Slot Matrix for any selected Weapon or Hardware instance.
   */
  const renderAnyOrderModWorkbench = (
    targetInstanceId: string,
    baseName: string,
    isWeaponItem: boolean,
    onInstanceUpdated: (newId: string) => void
  ) => {
    const { baseId, installedGems, slotGems } = parseEquipmentInstanceId(targetInstanceId);
    const maxSlots = getEquipmentMaxModSlots(targetInstanceId);
    const wDef = isWeaponItem ? getWeaponDefinition(baseId) : undefined;
    const isUniqueWeapon = Boolean(wDef?.weaponTier === 'unique');
    const clampedSlotIdx = Math.max(
      0,
      Math.min((isWeaponItem ? 3 : maxSlots) - 1, selectedModSlotIndex)
    ) as 0 | 1 | 2;

    // ─── LEGENDARY FOLKLORE ARTIFACTS (0 Standard Mods · 0 Gem Sockets · Optional Lore-Bound Companion Mount) ───
    if (isWeaponItem && wDef && wDef.weaponTier === 'legendary' && wDef.legendarySpec) {
      const legSpec = wDef.legendarySpec;
      const modProfile = resolveWeaponModificationProfile(state, targetInstanceId);
      const installedRelic = modProfile.installedLoreBoundRelic;
      const boundRelicSlot = legSpec.boundRelicSlots[0] || null;
      const isRelicUnlocked = boundRelicSlot
        ? isCheatMode || isLoreBoundRelicUnlocked(state, boundRelicSlot.id)
        : false;

      return (
        <div className="p-2 bg-[#070b12] rounded-xs border border-[#f59e0b]/60 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#1e293b] pb-1.5">
            <div>
              <div className="text-[10px] font-bold text-[#fde047] flex flex-wrap items-center gap-2">
                <span>
                  ★ LEGENDARY FOLKLORE ARTIFACT · 0 STANDARD MODS · 0 GEM SOCKETS (
                  {boundRelicSlot
                    ? `${installedRelic ? '1/1' : '0/1'} LORE-BOUND MOUNT`
                    : 'SEALED SINGULARITY RELIC'}
                  )
                </span>
                <span className="px-1.5 py-0.5 rounded-xs bg-[#451a03] text-[#fde047] border border-[#f59e0b]/60 text-[9px]">
                  ORIGIN WORLD: {legSpec.originWorldId.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <div className="text-[9px] text-[#94a3b8]">
                Legendary weapons reject all 61 standard component parts and all 11 elemental
                gemstones. Their combat geometry is permanently forged around their folklore origin
                and optional lore-bound companion relic.
              </div>
            </div>
            {(legSpec.maxObtainableCopies ?? 1) > 1 && (
              <button
                type="button"
                onClick={() => {
                  const ok = acquireAdditionalWeaponCopy(state, targetInstanceId, sayCtx);
                  if (ok) soundSystem.playPowerup();
                  else soundSystem.playMenuBeep();
                  notifyOrionStateChange();
                }}
                className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[9px] font-bold cursor-pointer"
              >
                + ACQUIRE PAIRED COPY (MAX {legSpec.maxObtainableCopies})
              </button>
            )}
          </div>

          {/* Folklore Origin & Innate Engine Hook Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#334155] space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-[#fde047]">
                  FOLKLORE TRADITION: {legSpec.folkloreTradition.toUpperCase()}
                </span>
                <span className="text-[8px] px-1.5 py-0.2 rounded-[2px] bg-[#451a03] text-[#fcd34d] font-bold">
                  ALWAYS ACTIVE
                </span>
              </div>
              <div className="text-[9px] text-[#86efac] leading-snug">
                {legSpec.innateMechanicSummary}
              </div>
              <div className="text-[8px] text-[#94a3b8] pt-1 border-t border-[#1e293b]">
                <b className="text-[#7dd3fc]">WORLD &amp; HAZARD CONNECTION:</b>{' '}
                {legSpec.areaLoreConnection}
              </div>
              <div className="text-[8px] text-[#cbd5e1]">
                <b className="text-[#ffd27d]">LORE DOSSIER:</b> {legSpec.loreDescription}
              </div>
            </div>

            {/* Lore-Bound Companion Mount Slot (or Standalone Relic Notice) */}
            {boundRelicSlot ? (
              <div
                className={`p-2 rounded-xs border flex flex-col justify-between gap-1.5 ${
                  installedRelic
                    ? 'bg-[#172554]/70 border-[#fde047]'
                    : 'bg-[#090d14] border-[#f59e0b]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold text-[#fde047]">
                      LORE-BOUND COMPANION MOUNT: {boundRelicSlot.name.toUpperCase()}
                    </span>
                    <span
                      className={`text-[8px] px-1.5 py-0.2 rounded-[2px] font-bold ${
                        installedRelic
                          ? 'bg-[#052e16] text-[#86efac] border border-[#22c55e]/50'
                          : isRelicUnlocked
                            ? 'bg-[#451a03] text-[#fde047] border border-[#f59e0b]/60'
                            : 'bg-[#1e293b] text-[#94a3b8]'
                      }`}
                    >
                      {installedRelic
                        ? 'MOUNTED'
                        : isRelicUnlocked
                          ? 'UNLOCKED · READY'
                          : 'LOCKED IN CAMPAIGN'}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#c084fc] font-bold mt-0.5">
                    {boundRelicSlot.name}
                    {boundRelicSlot.transformedWeaponTitle
                      ? ` → Transforms Title to “${boundRelicSlot.transformedWeaponTitle}”`
                      : ''}
                  </div>
                  <div className="text-[9px] text-[#cbd5e1] mt-0.5 leading-snug">
                    {boundRelicSlot.mechanicSummary}
                  </div>
                  <div className="text-[8px] text-[#94a3b8] mt-1">
                    <b className="text-[#ffd27d]">RELIC SOURCE:</b>{' '}
                    {boundRelicSlot.acquisitionSource}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e293b]">
                  <span className="text-[8px] text-[#7dd3fc] font-mono">
                    HOOK: {boundRelicSlot.grantedEngineHooks.join(' · ')}
                  </span>
                  {installedRelic ? (
                    <button
                      type="button"
                      onClick={() => {
                        const ok = removeLoreBoundRelicFromLegendary(
                          state,
                          targetInstanceId,
                          sayCtx
                        );
                        if (ok) {
                          soundSystem.playSelect();
                          syncStateGates(state);
                          onInstanceUpdated(targetInstanceId);
                          notifyOrionStateChange();
                        } else {
                          soundSystem.playMenuBeep();
                        }
                      }}
                      className="px-2 py-0.5 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/60 rounded-xs text-[9px] font-bold cursor-pointer"
                    >
                      UNMOUNT {boundRelicSlot.name.toUpperCase()}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!isRelicUnlocked}
                      onClick={() => {
                        const ok = installLoreBoundRelicOnLegendary(
                          state,
                          targetInstanceId,
                          boundRelicSlot.id,
                          sayCtx
                        );
                        if (ok) {
                          soundSystem.playPowerup();
                          syncStateGates(state);
                          onInstanceUpdated(targetInstanceId);
                          notifyOrionStateChange();
                        } else {
                          soundSystem.playMenuBeep();
                        }
                      }}
                      className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border ${
                        isRelicUnlocked
                          ? 'bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border-[#22c55e]/60 cursor-pointer'
                          : 'bg-[#0f172a] text-[#475569] border-[#1e293b] cursor-not-allowed'
                      }`}
                    >
                      {isRelicUnlocked
                        ? `MOUNT ${boundRelicSlot.name.toUpperCase()}`
                        : 'RELIC NOT YET ACQUIRED'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#334155] flex flex-col justify-between gap-1">
                <div>
                  <div className="text-[9px] font-bold text-[#fde047]">
                    SEALED FOLKLORE ARCHITECTURE (0 LORE-BOUND SLOTS)
                  </div>
                  <div className="text-[9px] text-[#cbd5e1] mt-0.5 leading-snug">
                    {wDef.id === 'leg_juuchi_yosamu'
                      ? 'Juuchi Yosamu has no open slots of its own, but can be mounted into Yawarakai-Te’s Lore-Bound Companion slot at this workbench to fuse both blades into “Yawarakai-Te & Juuchi Yosamu” (16 WT, 2× twin-blade strike execution, and continuous 20% all-phase DR).'
                      : wDef.id === 'leg_lake_of_fire_knife'
                        ? 'Up to 4 Knives of the Lake of Fire can be recovered across Golem, permitting true Main + Off-Hand dual-wielding in Slot 1 and Slot 2 to widen Action 3 Glance of the Gatekeeper.'
                        : 'Balmung is a strict two-handed singularity Zweihander (20 WT). Equipping Balmung locks Side Hand (Slot 2) while leaving the dorsal Aux Launcher mount (Slot 3) free.'}
                  </div>
                </div>
                <div className="text-[8px] text-[#7dd3fc] font-mono pt-1 border-t border-[#1e293b]">
                  ACTIVE ENGINE HOOKS: {modProfile.activeLegendaryHooks.join(' · ')}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ─── WEAPONS (72 Custom Archetypes + Magitech Purist Relics): 3 Physical Domains (Sealed vs. Open) + 1G Factory Resonance Socket ───
    if (isWeaponItem && wDef) {
      const weaponCategory: WeaponCategory = wDef.category || 'Blades: Straight';
      const modProfile = resolveWeaponModificationProfile(state, targetInstanceId);
      const domainLabels = WEAPON_DOMAIN_ANATOMY_LABELS[weaponCategory];
      const activeSlotState = modProfile.slots[clampedSlotIdx];
      const activeComponent = activeSlotState.component;
      const maxGemSocketsOnActive = activeComponent?.maxGemSlots ?? 0;
      const clampedGemIdx = Math.max(
        0,
        Math.min(Math.max(0, maxGemSocketsOnActive - 1), selectedComponentGemSocketIdx)
      );
      const bespokeClassParts = getBespokeComponentsForWeaponClass(weaponCategory).filter(
        (p) =>
          (componentDomainFilter === 'ALL' || p.domain === componentDomainFilter) &&
          (componentSourceFilter === 'ALL' || p.acquisitionSource === componentSourceFilter)
      );
      const openDomains = modProfile.openDomains;
      const sealedDomains = modProfile.sealedDomains;
      const resonanceGemId = modProfile.resonanceGem;
      const resonanceGemDef = resonanceGemId ? GEMSTONE_REGISTRY[resonanceGemId] : null;
      const archTierLabel =
        modProfile.architectureTier === 'SEALED_MONOLITH'
          ? 'SEALED MONOLITH · 0 OPEN + 1G'
          : modProfile.architectureTier === 'SEMI_SEALED_ASSEMBLY'
            ? 'SEMI-SEALED ASSEMBLY · 1 OPEN + 1G'
            : modProfile.architectureTier === 'MODULAR_FRAME_RELIC'
              ? 'MODULAR-FRAME RELIC · 2 OPEN + 1G'
              : 'REFERENCE PLATFORM · 3 OPEN + 1G';
      const domainOrder: readonly [ModDomain, ModDomain, ModDomain] = [
        'CONTACT',
        'DELIVERY',
        'REGULATION',
      ];

      return (
        <div className="p-2 bg-[#070b12] rounded-xs border border-[#1e293b] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#1e293b] pb-1.5">
            <div>
              <div className="text-[10px] font-bold text-[#fde047] flex flex-wrap items-center gap-2">
                <span>
                  {isUniqueWeapon
                    ? `MAGITECH PURIST RELIC · ${archTierLabel} (${modProfile.occupiedSlotCount}/${openDomains.length} OPEN MOUNTS · ${resonanceGemId ? '1/1G' : '0/1G'} RESONANCE)`
                    : `3 NON-SEQUENTIAL COMPONENT SLOTS (${modProfile.occupiedSlotCount}/3 OCCUPIED · ${modProfile.allSocketedGems.length} GEMS SOCKETED)`}
                </span>
                <span className="px-1.5 py-0.5 rounded-xs bg-[#1e293b] text-[#ffd27d] text-[9px]">
                  SCRAP POUCH: {isCheatMode ? '∞' : state.salvageScrap} SCRAP
                </span>
              </div>
              <div className="text-[9px] text-[#94a3b8]">
                {isUniqueWeapon ? (
                  <>
                    Magitech Purist relics feature a dedicated{' '}
                    <b className="text-[#c084fc]">1G Factory Resonance Socket</b> plus{' '}
                    <b className="text-[#7dd3fc]">{openDomains.length} Open Physical Mount(s)</b> (
                    {openDomains.length > 0 ? openDomains.join(', ') : 'All 3 Domains Factory-Sealed'}
                    ). Modified relics use post-nominal{' '}
                    <b className="text-[#fde047]">&lt;BaseName&gt; Custom (+II / +III)</b> naming.
                  </>
                ) : (
                  <>
                    Install up to 3 physical components in{' '}
                    <b className="text-[#7dd3fc]">any slot order</b> (at most 1 per domain:{' '}
                    <span className="text-[#fb923c]">CONTACT ({domainLabels.CONTACT})</span>,{' '}
                    <span className="text-[#38bdf8]">DELIVERY ({domainLabels.DELIVERY})</span>,{' '}
                    <span className="text-[#a78bfa]">REGULATION ({domainLabels.REGULATION})</span>).
                    Only <b className="text-[#fb923c]">CONTACT</b> components can convert Action 1
                    DamageType. Crafted parts expose <b className="text-[#e9d5ff]">1G</b>; Looted
                    field salvage exposes <b className="text-[#86efac]">1–3G</b>.
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const ok = acquireAdditionalWeaponCopy(state, targetInstanceId, sayCtx);
                if (ok) soundSystem.playPowerup();
                else soundSystem.playMenuBeep();
                notifyOrionStateChange();
              }}
              className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[9px] font-bold cursor-pointer"
            >
              + ACQUIRE 2ND COPY (PAIRED STANCE)
            </button>
          </div>

          {/* Magitech Purist Resonance & Dedicated 1G Factory Resonance Gem Socket */}
          {isUniqueWeapon && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {/* Purist Resonance Passive Card */}
              <div className="p-2 rounded-xs bg-[#090d14] border border-[#c084fc]/40 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {wDef.code && (
                      <span className="px-1.5 py-0.2 rounded-[2px] bg-[#1e1b4b] text-[#c4b5fd] border border-[#818cf8]/40 text-[9px] font-mono font-bold">
                        {wDef.code}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-[#e9d5ff]">
                      {modProfile.puristResonance?.title || 'PURIST RESONANCE'}
                    </span>
                    {wDef.legacyEpithet && (
                      <span className="text-[9px] italic text-[#fde047]">
                        “{wDef.legacyEpithet}”
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded-[2px] text-[8px] font-bold border ${
                      modProfile.puristResonanceActive
                        ? 'bg-[#052e16] text-[#86efac] border-[#22c55e]/50'
                        : 'bg-[#2e1065] text-[#ddd6fe] border-[#a855f7]/50'
                    }`}
                  >
                    {modProfile.puristResonanceActive
                      ? 'RESONANCE ACTIVE'
                      : 'RESONANCE DORMANT'}
                  </span>
                </div>
                {modProfile.puristResonance && (
                  <>
                    <div className="text-[8px] text-[#7dd3fc] font-bold">
                      PAIRED DOCTRINE: {modProfile.puristResonanceTargetLabel}
                    </div>
                    <div className="text-[9px] text-[#86efac] leading-tight">
                      ✦ {modProfile.puristResonance.effectSummary}
                    </div>
                  </>
                )}
                {wDef.action1Signature && (
                  <div className="text-[8px] text-[#cbd5e1] leading-tight pt-0.5 border-t border-[#1e293b]">
                    <b className="text-[#fde047]">Action 1 Signature:</b> {wDef.action1Signature}
                  </div>
                )}
              </div>

              {/* Dedicated 1G Factory Resonance Gem Socket Card */}
              <div className="p-2 rounded-xs bg-[#090d14] border border-[#38bdf8]/40 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-bold text-[#7dd3fc]">
                    FACTORY RESONANCE GEM SOCKET (1G)
                  </span>
                  {resonanceGemDef ? (
                    <div className="flex items-center gap-1">
                      <SpriteCanvasIcon
                        base64={resonanceGemDef.iconBase64}
                        sizeClass="w-3.5 h-3.5"
                      />
                      <span
                        className="text-[9px] font-bold"
                        style={{ color: resonanceGemDef.hexColor }}
                      >
                        {resonanceGemDef.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextId = unsocketResonanceGemFromMagitechWeapon(
                            state,
                            targetInstanceId,
                            sayCtx
                          );
                          if (nextId) {
                            soundSystem.playSelect();
                            syncStateGates(state);
                            onInstanceUpdated(nextId);
                            notifyOrionStateChange();
                          }
                        }}
                        className="px-1.5 py-0.2 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 rounded-xs text-[8px] font-bold cursor-pointer"
                      >
                        UNSOCKET
                      </button>
                    </div>
                  ) : (
                    <span className="text-[8px] px-1.5 py-0.2 rounded-[2px] bg-[#1e293b] text-[#94a3b8] font-bold">
                      EMPTY (0/1G)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {GEMSTONE_CATALOG.map((gem) => {
                    const invCount = getInventoryGemCount(state, gem.id);
                    const isCurrent = resonanceGemId === gem.id;
                    const canSocket = isCheatMode || invCount > 0 || isCurrent;
                    return (
                      <button
                        key={`res-gem-${gem.id}`}
                        type="button"
                        disabled={!canSocket || isCurrent}
                        onClick={() => {
                          const nextId = socketResonanceGemIntoMagitechWeapon(
                            state,
                            targetInstanceId,
                            gem.id,
                            sayCtx
                          );
                          if (nextId) {
                            soundSystem.playPowerup();
                            syncStateGates(state);
                            onInstanceUpdated(nextId);
                            notifyOrionStateChange();
                          } else {
                            soundSystem.playMenuBeep();
                          }
                        }}
                        title={WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[gem.id]}
                        className={`px-1.5 py-1 rounded-xs border text-left flex items-center justify-between gap-1 ${
                          isCurrent
                            ? 'bg-[#3b0764] border-[#fde047] text-[#fde047] cursor-default'
                            : canSocket
                              ? 'bg-[#05070a] hover:bg-[#0f172a] border-[#334155] hover:border-[#fde047] cursor-pointer'
                              : 'bg-[#05070a]/50 border-[#1e293b]/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <span
                          className="font-bold text-[8px] flex items-center gap-1 truncate"
                          style={{ color: gem.hexColor }}
                        >
                          <SpriteCanvasIcon
                            base64={gem.iconBase64}
                            sizeClass="w-3 h-3"
                          />
                          {gem.name}
                        </span>
                        <span className="text-[8px] text-[#94a3b8] font-bold shrink-0">
                          {isCurrent ? 'ACTIVE' : isCheatMode ? '∞' : `×${invCount}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3 Physical Domain / Component Slot Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {modProfile.slots.map((slotState) => {
              const idx = slotState.slotIndex;
              const fixedDomain = domainOrder[idx];
              const isDomainSealed = isUniqueWeapon && !openDomains.includes(fixedDomain);
              const sealedSpecText = isDomainSealed
                ? sealedDomains[fixedDomain] ||
                  'Hermetically sealed factory Magitech assembly.'
                : null;
              const comp = slotState.component;
              const isSelected = clampedSlotIdx === idx;
              const domainBadgeClass =
                (comp?.domain || fixedDomain) === 'CONTACT'
                  ? 'bg-[#431407] text-[#fdba74] border-[#f97316]/50'
                  : (comp?.domain || fixedDomain) === 'DELIVERY'
                    ? 'bg-[#082f49] text-[#7dd3fc] border-[#38bdf8]/50'
                    : 'bg-[#2e1065] text-[#ddd6fe] border-[#a78bfa]/50';

              if (isDomainSealed) {
                return (
                  <div
                    key={`bespoke-sealed-${idx}`}
                    className="p-2 rounded-xs border border-[#4c1d95]/60 bg-[#0b0716] flex flex-col justify-between gap-1.5 opacity-95"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-[#c4b5fd]">
                        {fixedDomain} · [{domainLabels[fixedDomain].toUpperCase()}]
                      </span>
                      <span className="text-[8px] px-1.5 py-0.2 rounded-[2px] font-bold bg-[#2e1065] text-[#e9d5ff] border border-[#a855f7]/50">
                        SEALED ASSEMBLY
                      </span>
                    </div>
                    <div className="text-[8px] text-[#cbd5e1] leading-snug">
                      {sealedSpecText}
                    </div>
                    <div className="text-[8px] text-[#a78bfa] italic pt-0.5 border-t border-[#1e1b4b]">
                      Factory-sealed Magitech hardware domain — physical aftermarket mods locked.
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`bespoke-slot-${idx}`}
                  role="button"
                  tabIndex={0}
                  data-menu-focusable="true"
                  onClick={() => {
                    soundSystem.playSelect();
                    setSelectedModSlotIndex(idx);
                    setSelectedComponentGemSocketIdx(0);
                  }}
                  className={`p-2 rounded-xs border transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-[#172554]/70 border-[#fde047] shadow-sm'
                      : comp
                        ? 'bg-[#0f172a] border-[#38bdf8]/50 hover:border-[#fde047]/70'
                        : 'bg-[#090d14] border-[#1e293b] hover:border-[#475569]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold text-[#7dd3fc]">
                      {isUniqueWeapon
                        ? `OPEN MOUNT · [${fixedDomain} · ${domainLabels[fixedDomain].toUpperCase()}]`
                        : `SLOT ${idx + 1} ${
                            comp
                              ? `· [${comp.domain} · ${domainLabels[comp.domain].toUpperCase()}]`
                              : '· [ANY DOMAIN]'
                          }`}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded-[2px] font-bold border ${
                        comp
                          ? comp.acquisitionSource === 'LOOTED'
                            ? 'bg-[#052e16] text-[#86efac] border-[#22c55e]/40'
                            : 'bg-[#3b0764] text-[#e9d5ff] border-[#c084fc]/40'
                          : 'bg-[#1e293b] text-[#94a3b8] border-[#334155]'
                      }`}
                    >
                      {comp
                        ? `${comp.acquisitionSource} · ${comp.maxGemSlots}G`
                        : 'OPEN MOUNT'}
                    </span>
                  </div>

                  {comp ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-[#fde047] truncate">
                            {comp.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span
                              className={`text-[8px] px-1 py-0.2 rounded-[2px] font-bold border ${domainBadgeClass}`}
                            >
                              {comp.domain}
                            </span>
                            {comp.damageTypeOverride && (
                              <span className="text-[8px] px-1 py-0.2 rounded-[2px] font-bold bg-[#450a0a] text-[#fca5a5] border border-[#ef4444]/50">
                                DMG → {comp.damageTypeOverride.toUpperCase()}
                              </span>
                            )}
                            <span className="text-[8px] text-[#94a3b8]">
                              {(comp.statModifiers.weightDelta ?? 0) >= 0
                                ? `+${comp.statModifiers.weightDelta ?? 0}`
                                : (comp.statModifiers.weightDelta ?? 0)}{' '}
                              WT
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextId = removeBespokeWeaponComponent(
                              state,
                              targetInstanceId,
                              idx,
                              sayCtx
                            );
                            if (nextId) {
                              soundSystem.playSelect();
                              syncStateGates(state);
                              onInstanceUpdated(nextId);
                              notifyOrionStateChange();
                            }
                          }}
                          className="px-1.5 py-0.5 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 rounded-xs text-[9px] font-bold cursor-pointer shrink-0"
                        >
                          STRIP PART
                        </button>
                      </div>

                      <div className="text-[8px] text-[#86efac] leading-tight">
                        + {comp.effectSummary}
                      </div>
                      <div className="text-[8px] text-[#f87171] leading-tight">
                        − {comp.tradeOffSummary}
                      </div>

                      {/* Nested Component Gem Sockets (1G on Crafted, 1-3G on Looted) */}
                      <div className="pt-1 border-t border-[#1e293b] space-y-1">
                        <div className="text-[8px] font-bold text-[#c084fc]">
                          COMPONENT GEM SOCKETS (
                          {slotState.socketedGems.filter(Boolean).length}/{comp.maxGemSlots}G):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: comp.maxGemSlots }).map((_, gIdx) => {
                            const gId = slotState.socketedGems[gIdx] || null;
                            const gDef = gId ? GEMSTONE_REGISTRY[gId] : null;
                            const isActiveSocket = isSelected && clampedGemIdx === gIdx;

                            return (
                              <div
                                key={`comp-gem-${idx}-${gIdx}`}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  soundSystem.playSelect();
                                  setSelectedModSlotIndex(idx);
                                  setSelectedComponentGemSocketIdx(gIdx);
                                }}
                                className={`px-1.5 py-0.5 rounded-xs border text-[8px] font-bold flex items-center gap-1 cursor-pointer ${
                                  isActiveSocket
                                    ? 'bg-[#3b0764] border-[#fde047] text-[#fde047]'
                                    : gDef
                                      ? 'bg-[#05070a] border-[#c084fc]/50 text-[#e2e8f0]'
                                      : 'bg-[#05070a] border-[#334155] text-[#94a3b8]'
                                }`}
                              >
                                {gDef ? (
                                  <>
                                    <SpriteCanvasIcon
                                      base64={gDef.iconBase64}
                                      sizeClass="w-3 h-3"
                                    />
                                    <span style={{ color: gDef.hexColor }}>{gDef.name}</span>
                                    <button
                                      type="button"
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        const nextId = unsocketGemFromWeaponComponent(
                                          state,
                                          targetInstanceId,
                                          idx,
                                          gIdx,
                                          sayCtx
                                        );
                                        if (nextId) {
                                          soundSystem.playSelect();
                                          syncStateGates(state);
                                          onInstanceUpdated(nextId);
                                          notifyOrionStateChange();
                                        }
                                      }}
                                      className="ml-0.5 text-[#fca5a5] hover:text-[#ef4444] font-bold cursor-pointer"
                                      title="Unsocket Gem"
                                    >
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <span>+ SOCKET G{gIdx + 1}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-[#64748b] italic pt-0.5">
                      {isUniqueWeapon
                        ? `Click to focus ${fixedDomain} (${domainLabels[fixedDomain]}) open mount & install a compatible component`
                        : `Click to focus Slot ${idx + 1} & install any Contact, Delivery, or Regulation component`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Nested Gemstone Infusion Bar for Active Installed Component */}
          {activeComponent && (
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#c084fc]/40 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-[#c084fc]">
                  SOCKET GEMSTONE INTO SLOT {clampedSlotIdx + 1} [{activeComponent.name.toUpperCase()}] ·
                  GEM SOCKET G{clampedGemIdx + 1} OF {activeComponent.maxGemSlots}G:
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: activeComponent.maxGemSlots }).map((_, gIdx) => (
                    <button
                      key={`pick-gsock-${gIdx}`}
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        setSelectedComponentGemSocketIdx(gIdx);
                      }}
                      className={`px-1.5 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
                        clampedGemIdx === gIdx
                          ? 'bg-[#c084fc] text-[#05070a] border-[#fde047]'
                          : 'bg-[#05070a] text-[#cbd5e1] border-[#334155]'
                      }`}
                    >
                      SOCKET G{gIdx + 1}{' '}
                      {activeSlotState.socketedGems[gIdx]
                        ? `(${GEMSTONE_REGISTRY[activeSlotState.socketedGems[gIdx]!]?.name})`
                        : '(EMPTY)'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                {GEMSTONE_CATALOG.map((gem) => {
                  const invCount = getInventoryGemCount(state, gem.id);
                  const canSocket = isCheatMode || invCount > 0;
                  const bonusDesc = WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[gem.id];
                  const wtDelta = WEAPON_GEM_WEIGHT_DELTA[gem.id];
                  return (
                    <button
                      key={gem.id}
                      type="button"
                      disabled={!canSocket}
                      onClick={() => {
                        const nextId = socketGemIntoWeaponComponent(
                          state,
                          targetInstanceId,
                          clampedSlotIdx,
                          clampedGemIdx,
                          gem.id,
                          sayCtx
                        );
                        if (nextId) {
                          soundSystem.playPowerup();
                          syncStateGates(state);
                          onInstanceUpdated(nextId);
                          notifyOrionStateChange();
                        } else {
                          soundSystem.playMenuBeep();
                        }
                      }}
                      className={`p-1.5 rounded-xs border text-left transition-colors flex flex-col justify-between gap-0.5 ${
                        canSocket
                          ? 'bg-[#05070a] hover:bg-[#0f172a] border-[#334155] hover:border-[#fde047] cursor-pointer'
                          : 'bg-[#05070a]/50 border-[#1e293b]/50 opacity-55 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="font-bold text-[9px] flex items-center gap-1"
                          style={{ color: gem.hexColor }}
                        >
                          <SpriteCanvasIcon
                            base64={gem.iconBase64}
                            sizeClass="w-3.5 h-3.5"
                          />
                          {gem.name}
                        </span>
                        <span className="text-[9px] text-[#94a3b8] font-bold">
                          {isCheatMode ? '∞' : `×${invCount}`} ({wtDelta >= 0 ? `+${wtDelta}` : wtDelta} WT)
                        </span>
                      </div>
                      <div className="text-[8px] text-[#cbd5e1] leading-tight">
                        {bonusDesc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Class-Specific Bespoke Component Catalog (28 Crafted Blueprints + 33 Looted Field Salvage) */}
          {(!isUniqueWeapon || openDomains.length > 0) && (
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#334155] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="text-[9px] font-bold text-[#fde047]">
                  BESPOKE [{weaponCategory.toUpperCase()}] COMPONENT CATALOG{' '}
                  {isUniqueWeapon
                    ? `→ OPEN MOUNTS: [${openDomains.join(', ')}]`
                    : `→ INSTALLING INTO SLOT ${clampedSlotIdx + 1}`}
                  :
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {(['ALL', 'CONTACT', 'DELIVERY', 'REGULATION'] as const).map((domOpt) => (
                    <button
                      key={domOpt}
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        setComponentDomainFilter(domOpt);
                      }}
                      className={`px-1.5 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
                        componentDomainFilter === domOpt
                          ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                          : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:border-[#38bdf8]/60'
                      }`}
                    >
                      {domOpt === 'ALL'
                        ? 'ALL DOMAINS'
                        : `${domOpt} (${domainLabels[domOpt]})`}
                    </button>
                  ))}
                  {(['ALL', 'CRAFTED', 'LOOTED'] as const).map((srcOpt) => (
                    <button
                      key={srcOpt}
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        setComponentSourceFilter(srcOpt);
                      }}
                      className={`px-1.5 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
                        componentSourceFilter === srcOpt
                          ? 'bg-[#fde047] text-[#05070a] border-[#ffd27d]'
                          : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:border-[#fde047]/60'
                      }`}
                    >
                      {srcOpt === 'ALL'
                        ? 'ALL SOURCES'
                        : srcOpt === 'CRAFTED'
                          ? 'CRAFTED (1G)'
                          : 'LOOTED SALVAGE (1–3G)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {bespokeClassParts.map((part) => {
                  const canonicalDomainSlot = (
                    part.domain === 'CONTACT' ? 0 : part.domain === 'DELIVERY' ? 1 : 2
                  ) as 0 | 1 | 2;
                  const existingDomainSlot = modProfile.slots.find(
                    (s) => s.component?.domain === part.domain
                  );
                  const targetSlotForPart = isUniqueWeapon
                    ? existingDomainSlot
                      ? existingDomainSlot.slotIndex
                      : canonicalDomainSlot
                    : existingDomainSlot
                      ? existingDomainSlot.slotIndex
                      : clampedSlotIdx;
                  const isDomainSealedOnRelic =
                    isUniqueWeapon && !openDomains.includes(part.domain);
                  const validation = validateWeaponComponentInstallation(
                    state,
                    targetInstanceId,
                    targetSlotForPart,
                    part.id
                  );
                  const isInstalledHere = modProfile.slots.some(
                    (s) => s.component?.id === part.id
                  );
                  const ownedLootCount =
                    part.acquisitionSource === 'LOOTED'
                      ? getOwnedLootedComponentCount(state, part.id)
                      : 0;
                  const costLabel =
                    part.acquisitionSource === 'LOOTED'
                      ? `SALVAGE STOCK: ${isCheatMode ? '∞' : `×${ownedLootCount}`}`
                      : `${part.recipe.scrapCost} Scrap + ${part.recipe.gemstoneCount}× ${part.recipe.gemstoneType} (${
                          isCheatMode
                            ? '∞'
                            : getInventoryGemCount(
                                state,
                                RECIPE_GEMSTONE_TO_ID[part.recipe.gemstoneType]
                              )
                        } owned)`;

                  return (
                    <div
                      key={part.id}
                      className={`p-2 rounded-xs border flex flex-col justify-between gap-1 ${
                        isInstalledHere
                          ? 'bg-[#172554]/60 border-[#fde047]'
                          : isDomainSealedOnRelic
                            ? 'bg-[#05070a]/50 border-[#1e293b]/50 opacity-55'
                            : 'bg-[#05070a] border-[#1e293b]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-[9px] text-[#e2e8f0] truncate">
                            {part.name}
                            {devMode ? ` [${part.id}]` : ''}
                          </span>
                          <span
                            className={`text-[8px] px-1 py-0.2 rounded-[2px] font-bold shrink-0 ${
                              part.domain === 'CONTACT'
                                ? 'bg-[#431407] text-[#fdba74]'
                                : part.domain === 'DELIVERY'
                                  ? 'bg-[#082f49] text-[#7dd3fc]'
                                  : 'bg-[#2e1065] text-[#ddd6fe]'
                            }`}
                          >
                            {part.domain}
                          </span>
                        </div>
                        <span
                          className={`text-[8px] px-1 py-0.2 rounded-[2px] font-bold shrink-0 ${
                            part.acquisitionSource === 'LOOTED'
                              ? 'bg-[#052e16] text-[#86efac] border border-[#22c55e]/40'
                              : 'bg-[#3b0764] text-[#e9d5ff] border border-[#c084fc]/40'
                          }`}
                        >
                          {part.acquisitionSource} · {part.maxGemSlots}G
                        </span>
                      </div>

                      <div className="text-[9px] text-[#86efac]">
                        + {part.effectSummary}
                        {part.damageTypeOverride ? (
                          <span className="ml-1 px-1 py-0.2 rounded-[2px] bg-[#450a0a] text-[#fde047] font-bold text-[8px]">
                            ACTION 1 → {part.damageTypeOverride.toUpperCase()}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[9px] text-[#f87171]">
                        − {part.tradeOffSummary} (
                        {(part.statModifiers.weightDelta ?? 0) >= 0
                          ? `+${part.statModifiers.weightDelta ?? 0}`
                          : (part.statModifiers.weightDelta ?? 0)}{' '}
                        WT)
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e293b]/80">
                        <span className="text-[8px] text-[#cbd5e1]">
                          {part.acquisitionSource === 'CRAFTED' ? 'Recipe: ' : ''}
                          <b className="text-[#ffd27d]">{costLabel}</b>
                        </span>
                        <button
                          type="button"
                          disabled={!validation.valid || isInstalledHere || isDomainSealedOnRelic}
                          onClick={() => {
                            const nextId = installBespokeWeaponComponent(
                              state,
                              targetInstanceId,
                              targetSlotForPart,
                              part.id,
                              sayCtx,
                              { autoReplaceConflictingDomain: true }
                            );
                            if (nextId) {
                              soundSystem.playPowerup();
                              setSelectedModSlotIndex(targetSlotForPart);
                              setSelectedComponentGemSocketIdx(0);
                              syncStateGates(state);
                              onInstanceUpdated(nextId);
                              notifyOrionStateChange();
                            } else {
                              soundSystem.playMenuBeep();
                            }
                          }}
                          className={`px-2 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer shrink-0 ${
                            isInstalledHere
                              ? 'bg-[#1e293b] text-[#fde047] border-[#fde047]/50 cursor-default'
                              : isDomainSealedOnRelic
                                ? 'bg-[#1e1b4b] text-[#a78bfa] border-[#4c1d95]/50 cursor-not-allowed'
                                : validation.valid
                                  ? 'bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border-[#22c55e]/60'
                                  : 'bg-[#0f172a] text-[#475569] border-[#1e293b] cursor-not-allowed'
                          }`}
                        >
                          {isInstalledHere
                            ? 'INSTALLED'
                            : isDomainSealedOnRelic
                              ? `SEALED (${part.domain})`
                              : existingDomainSlot
                                ? `REPLACE ${part.domain}`
                                : part.acquisitionSource === 'CRAFTED'
                                  ? `FORGE → ${isUniqueWeapon ? part.domain : `SLOT ${targetSlotForPart + 1}`}`
                                  : `INSTALL → ${isUniqueWeapon ? part.domain : `SLOT ${targetSlotForPart + 1}`}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    // ─── UNIQUE MAGITECH WEAPONS (1G Resonance Socket) & CHASSIS HARDWARE SOCKETS ───
    const anatomicalSlots: WeaponComponentSlotId[] = isWeaponItem
      ? getWeaponComponentSlots(baseId)
      : (['grip', 'focus', 'sight'] as WeaponComponentSlotId[]);
    const compMap = eq.installedWeaponComponents?.[targetInstanceId] || {};
    const hwItem = !isWeaponItem ? findHardwareItemByNameOrId(targetInstanceId) : undefined;
    const activeAnatomicalSlotName = anatomicalSlots[clampedSlotIdx];
    const currentSlotGem = slotGems[clampedSlotIdx] || null;
    const currentInstalledPartId =
      isWeaponItem && !isUniqueWeapon ? compMap[activeAnatomicalSlotName] : undefined;
    const currentInstalledPartDef = currentInstalledPartId
      ? WEAPON_COMPONENT_PART_CATALOG.find((p) => p.id === currentInstalledPartId)
      : undefined;

    // Compute what the Custom name will look like if a gem is installed in clampedSlotIdx
    const previewNextName = (candidateGemId: GemId) => {
      const previewSlots: Array<GemId | null> = Array.from(
        { length: maxSlots },
        (_, i) => (i === clampedSlotIdx ? candidateGemId : slotGems[i] || null)
      );
      return formatModifiedEquipmentName(baseName, previewSlots);
    };

    return (
      <div className="p-2 bg-[#070b12] rounded-xs border border-[#1e293b] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#1e293b] pb-1">
          <div>
            <div className="text-[10px] font-bold text-[#fde047]">
              {isUniqueWeapon
                ? `UNIQUE MAGITECH · FIXED COMPONENTS & 1 RESONANCE GEM SOCKET (${installedGems.length}/${maxSlots} OCCUPIED)`
                : `ANY-ORDER HARDWARE GEM SOCKETS (${installedGems.length}/${maxSlots} OCCUPIED)`}
            </div>
            <div className="text-[9px] text-[#94a3b8]">
              {isUniqueWeapon ? (
                <>
                  Unique Magitech ordnance features factory-sealed internal components and exposes{' '}
                  <b className="text-[#c084fc]">1 Resonance Gem Socket</b> for elemental tuning (
                  <span className="text-[#86efac]">
                    {formatModifiedEquipmentName(baseName, ['spinel'])}
                  </span>
                  ).
                </>
              ) : (
                <>
                  Select any slot below in any order to socket or remove a gemstone. Modified items
                  use semantic <b className="text-[#fde047]">Custom</b> naming.
                </>
              )}
            </div>
          </div>
          {isWeaponItem && (
            <button
              type="button"
              onClick={() => {
                const ok = acquireAdditionalWeaponCopy(state, targetInstanceId, sayCtx);
                if (ok) soundSystem.playPowerup();
                else soundSystem.playMenuBeep();
                notifyOrionStateChange();
              }}
              className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[9px] font-bold cursor-pointer"
            >
              + ACQUIRE 2ND COPY (PAIRED STANCE)
            </button>
          )}
        </div>

        {/* Interactive Slot Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {Array.from({ length: maxSlots }).map((_, idx) => {
            const sGem = slotGems[idx] || null;
            const gemInfo = sGem ? GEMSTONE_REGISTRY[sGem] : null;
            const slotLabel = isWeaponItem
              ? 'RESONANCE SOCKET'
              : `${hwItem?.canonicalSlotLabel.toUpperCase() || 'HARDWARE'} SOCKET ${idx + 1}`;
            const isSelected = clampedSlotIdx === idx;

            return (
              <div
                key={`mod-slot-${idx}`}
                role="button"
                tabIndex={0}
                data-menu-focusable="true"
                onClick={() => {
                  soundSystem.playSelect();
                  setSelectedModSlotIndex(idx);
                }}
                className={`p-2 rounded-xs border transition-colors cursor-pointer flex flex-col justify-between gap-1 ${
                  isSelected
                    ? 'bg-[#172554]/70 border-[#fde047] shadow-sm'
                    : sGem
                      ? 'bg-[#0f172a] border-[#38bdf8]/50 hover:border-[#fde047]/70'
                      : 'bg-[#090d14] border-[#1e293b] hover:border-[#475569]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-bold text-[#7dd3fc]">
                    SLOT {idx + 1} · [{slotLabel}]
                  </span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-[2px] font-bold ${
                      sGem
                        ? 'bg-[#052e16] text-[#86efac] border border-[#22c55e]/40'
                        : 'bg-[#1e293b] text-[#94a3b8]'
                    }`}
                  >
                    {sGem ? 'INSTALLED' : 'EMPTY'}
                  </span>
                </div>

                {gemInfo ? (
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <SpriteCanvasIcon
                        base64={gemInfo.iconBase64}
                        sizeClass="w-3.5 h-3.5"
                      />
                      <span
                        className="text-[9px] font-bold truncate"
                        style={{ color: gemInfo.hexColor }}
                      >
                        {`${gemInfo.name} Socket`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextId = removeGemModFromEquipment(
                          state,
                          targetInstanceId,
                          idx,
                          sayCtx
                        );
                        if (nextId) {
                          soundSystem.playSelect();
                          onInstanceUpdated(nextId);
                          notifyOrionStateChange();
                        }
                      }}
                      className="px-1.5 py-0.5 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 rounded-xs text-[9px] font-bold cursor-pointer shrink-0"
                    >
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <div className="text-[9px] text-[#64748b] italic pt-0.5">
                    Click to select & install gem in Slot {idx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Direct Gemstone Socket Installation */}
        <div className="p-2 bg-[#090d14] rounded-xs border border-[#334155] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-[#fde047]">
              CONFIGURING SLOT {clampedSlotIdx + 1}:{' '}
              {currentSlotGem
                ? `— CURRENT: ${(currentInstalledPartDef?.name || GEMSTONE_REGISTRY[currentSlotGem]?.name || '').toUpperCase()} (CLICK ANY OPTION TO REPLACE)`
                : '— READY FOR GEMSTONE INFUSION'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            {GEMSTONE_CATALOG.map((gem) => {
              const invCount = getInventoryGemCount(state, gem.id);
              const canSocket = isCheatMode || invCount > 0;
              const bonusDesc = isWeaponItem
                ? WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[gem.id]
                : getHardwareGemBonusDescription(hwItem?.slot || 'plating', gem.id);
              const wtDelta = WEAPON_GEM_WEIGHT_DELTA[gem.id];

              return (
                <button
                  key={gem.id}
                  type="button"
                  disabled={!canSocket}
                  onClick={() => {
                    const nextId = installGemModOnEquipment(
                      state,
                      targetInstanceId,
                      gem.id,
                      sayCtx,
                      {
                        slotIndex: clampedSlotIdx,
                        slotName: isWeaponItem ? activeAnatomicalSlotName : undefined,
                      }
                    );
                    if (nextId) {
                      soundSystem.playPowerup();
                      onInstanceUpdated(nextId);
                      notifyOrionStateChange();
                    } else {
                      soundSystem.playMenuBeep();
                    }
                  }}
                  className={`p-1.5 rounded-xs border text-left transition-colors flex flex-col justify-between gap-0.5 ${
                    canSocket
                      ? 'bg-[#05070a] hover:bg-[#0f172a] border-[#334155] hover:border-[#fde047] cursor-pointer'
                      : 'bg-[#05070a]/50 border-[#1e293b]/50 opacity-55 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="font-bold text-[9px] flex items-center gap-1"
                      style={{ color: gem.hexColor }}
                    >
                      <SpriteCanvasIcon
                        base64={gem.iconBase64}
                        sizeClass="w-3.5 h-3.5"
                      />
                      {gem.name}
                    </span>
                    <span className="text-[9px] text-[#94a3b8] font-bold">
                      {isCheatMode ? '∞' : `×${invCount}`}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#cbd5e1] leading-tight">
                    {bonusDesc}
                  </div>
                  {isWeaponItem && (
                    <div className="text-[9px] text-[#fde047] truncate">
                      → {previewNextName(gem.id)} ({wtDelta >= 0 ? `+${wtDelta}` : wtDelta} WT)
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
      {/* Armory Header & Workbench Category Bar */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold text-[#fb923c] flex items-center gap-2">
            <span>⚙ ARMORY MODIFICATION WORKBENCH</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-xs bg-[#1e293b] text-[#fde047]">
              LOAD: {loadMetrics.equippedWeight}/{loadMetrics.maxCapacity} WT (
              {loadMetrics.loadPct}% · {loadMetrics.loadBracket.toUpperCase()})
            </span>
          </div>
          <div className="text-[9px] text-[#94a3b8]">
            Install weapon component parts, internal chassis sub-modules, action modifications,
            and gemstone sockets in any slot order.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'weapons', label: '1. Weapon & Aux Mods' },
              { id: 'chassis', label: '2. Chassis Sub-Modules & Sockets' },
              { id: 'action_mods', label: '3. Action Modifications' },
            ] as Array<{ id: ArmoryWorkbenchCategory; label: string }>
          ).map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                setCategory(tabItem.id);
              }}
              className={`px-2 py-1 rounded-xs text-[9px] font-bold border cursor-pointer ${
                category === tabItem.id
                  ? 'bg-[#fb923c] text-[#05070a] border-[#fdba74]'
                  : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#fb923c]'
              }`}
            >
              {tabItem.label}
            </button>
          ))}
          {onReturnToLoadout && (
            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                onReturnToLoadout();
              }}
              className="px-2 py-1 rounded-xs text-[9px] font-bold bg-[#1e293b] hover:bg-[#334155] text-[#ffd27d] border border-[#ffd27d]/50 cursor-pointer"
            >
              ↩ MECH DOLL LOADOUT
            </button>
          )}
        </div>
      </div>

      {/* ─── WORKBENCH 1: WEAPONS & AUXILIARIES MODIFICATION ─── */}
      {category === 'weapons' && activeWeaponDef && activeWeaponBaseDef && (
        <div className="space-y-2">
          {/* Quick Equipped + Owned Weapon Selector with 8-Category Filter */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="text-[9px] font-bold text-[#ffd27d]">
                SELECT WEAPON OR AUXILIARY TO MODIFY:
              </div>
              <div className="flex flex-wrap gap-1">
                {(['ALL', ...WEAPON_CATEGORIES] as const).map((catOpt) => (
                  <button
                    key={catOpt}
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setWeaponCategoryFilter(catOpt);
                    }}
                    className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer ${
                      weaponCategoryFilter === catOpt
                        ? 'bg-[#ffd27d] text-[#05070a] border-[#fde047]'
                        : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:border-[#ffd27d]/60'
                    }`}
                  >
                    {catOpt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {ownedWeaponInstances
                .filter(
                  ({ baseW }) =>
                    weaponCategoryFilter === 'ALL' || baseW.category === weaponCategoryFilter
                )
                .map(({ instanceId }) => {
                  const w = getWeaponDefinition(instanceId);
                  if (!w) return null;
                  const isMain = eq.slot1 === instanceId;
                  const isSide = eq.slot2 === instanceId;
                  const isAux = eq.slot3 === instanceId;
                  const isSelected = selectedWeaponInstanceId === instanceId;
                  const gemVis = getWeaponGemVisuals(state, instanceId);
                  const strip = w.variantStripBase64 || w.hardpointSprite?.base64;
                  const isUnique = w.weaponTier === 'unique';
                  const isLegendary = w.weaponTier === 'legendary';
                  const stInfo = getWeaponSubtypeInfo(w.id);
                  const displayName = getEquipmentDisplayName(instanceId, state);

                  return (
                    <button
                      key={instanceId}
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        setSelectedWeaponInstanceId(instanceId);
                        setSelectedModSlotIndex(0);
                      }}
                      className={`px-2 py-1 rounded-xs border text-[9px] font-bold flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#172554] text-[#fde047] border-[#fde047]'
                          : 'bg-[#05070a] text-[#cbd5e1] border-[#1e293b] hover:border-[#38bdf8]'
                      }`}
                    >
                      <SpriteCanvasIcon
                        base64={strip}
                        col={gemVis.colIndex}
                        row={!gemVis.gemId ? (w.hardpointSprite?.row ?? 0) : 0}
                        sizeClass="w-3.5 h-3.5"
                      />
                      <span>{displayName}</span>
                      <span className="text-[9px] text-[#7dd3fc]">
                        [{stInfo.functionalType}]
                      </span>
                      <span
                        className={`text-[9px] font-mono ${
                          isLegendary
                            ? 'text-[#fde047]'
                            : isUnique
                              ? 'text-[#c084fc]'
                              : 'text-[#86efac]'
                        }`}
                      >
                        {isLegendary
                          ? `· Legendary (${w.legendarySpec?.boundRelicSlots.length ?? 0} Relic)`
                          : isUnique
                            ? `· Magitech (${w.openDomains?.length ?? 0}S+1G)`
                            : '· Custom (3S)'}
                      </span>
                      {isMain && (
                        <span className="px-1 py-0.2 bg-[#fde047]/20 text-[#fde047] rounded-[2px] text-[9px]">
                          MAIN
                        </span>
                      )}
                      {isSide && (
                        <span className="px-1 py-0.2 bg-[#38bdf8]/20 text-[#38bdf8] rounded-[2px] text-[9px]">
                          SIDE
                        </span>
                      )}
                      {isAux && (
                        <span className="px-1 py-0.2 bg-[#c084fc]/20 text-[#c084fc] rounded-[2px] text-[9px]">
                          AUX
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* High-Res Weapon Schematic + Live Combat Stat Readout */}
          <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#334155] flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <HighResEquipmentArtCanvas
              state={state}
              itemIdOrName={activeWeaponDef.id}
              sizeClass="w-28 h-28"
              highlightedModSlotIndex={selectedModSlotIndex}
            />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <div>
                  <div className="text-[11px] font-bold text-[#fde047]">
                    {getEquipmentDisplayName(activeWeaponDef.id, state)}{' '}
                    {devMode && (
                      <span className="text-[9px] font-mono text-[#64748b]">
                        [{activeWeaponDef.id}]
                      </span>
                    )}{' '}
                    <span className="text-[9px] text-[#94a3b8]">
                      (×{getOwnedWeaponCount(state, activeWeaponDef.id)} Owned)
                    </span>
                  </div>
                  <div className="text-[9px] text-[#7dd3fc]">
                    {getWeaponSubtypeInfo(activeWeaponBaseId).subtype} · Equip Weight:{' '}
                    <b>{getWeaponInstanceEquipWeight(activeWeaponDef.id, state)} WT</b> ·{' '}
                    {activeWeaponBaseDef.weaponTier === 'legendary' ? (
                      <span className="text-[#fde047] font-bold">
                        LEGENDARY FOLKLORE ARTIFACT · 0 STANDARD MODS · 0G (
                        {activeWeaponBaseDef.legendarySpec?.boundRelicSlots.length ?? 0} LORE-BOUND
                        COMPANION SLOT)
                      </span>
                    ) : activeWeaponBaseDef.weaponTier === 'unique' ? (
                      <span className="text-[#c084fc] font-bold">
                        {activeWeaponBaseDef.code ? `[${activeWeaponBaseDef.code}] · ` : ''}
                        {(activeWeaponBaseDef.architectureTier || 'MAGITECH_RELIC').replace(
                          /_/g,
                          ' '
                        )}{' '}
                        ({activeWeaponBaseDef.openDomains?.length ?? 0} OPEN MOUNTS + 1G RESONANCE)
                        {activeWeaponBaseDef.legacyEpithet
                          ? ` · “${activeWeaponBaseDef.legacyEpithet}”`
                          : ''}
                      </span>
                    ) : (
                      <>
                        3 Domains: [
                        {Object.values(
                          WEAPON_DOMAIN_ANATOMY_LABELS[
                            activeWeaponBaseDef.category || 'Blades: Straight'
                          ]
                        )
                          .join(' / ')
                          .toUpperCase()}
                        ]
                      </>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-xs bg-[#1e293b] text-[#86efac] text-[9px] font-bold">
                  {getWeaponGemVisuals(state, activeWeaponDef.id).label}
                </span>
              </div>

              <div className="text-[9px] text-[#cbd5e1]">{activeWeaponDef.description}</div>

              {/* Feat Handling & Prerequisite Status Banner */}
              {(() => {
                const handlingEval = evaluateEquipmentFeatHandling(state, activeWeaponDef.id);
                const recFeat = handlingEval.recommendedFeatId
                  ? CANONICAL_FRAME_FEAT_REGISTRY[handlingEval.recommendedFeatId]
                  : undefined;
                return (
                  <div className="p-1.5 bg-[#05070a] rounded-xs border border-[#1e293b] flex flex-wrap items-center justify-between gap-1.5 text-[9px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.2 rounded-[2px] font-bold border ${
                          handlingEval.proficiencyTier === 'mastered'
                            ? 'bg-[#052e16] text-[#86efac] border-[#22c55e]/50'
                            : handlingEval.proficiencyTier === 'proficient'
                              ? 'bg-[#0c4a6e] text-[#7dd3fc] border-[#38bdf8]/50'
                              : handlingEval.proficiencyTier === 'locked'
                                ? 'bg-[#450a0a] text-[#fca5a5] border-[#ef4444]/60'
                                : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155]'
                        }`}
                      >
                        {handlingEval.badgeLabel}
                      </span>
                      <span className="text-[#94a3b8]">{handlingEval.statusSummary}</span>
                    </div>
                    {recFeat && onLocateFeat && (
                      <button
                        type="button"
                        onClick={() => {
                          soundSystem.playSelect();
                          onLocateFeat(recFeat.id);
                        }}
                        className="px-1.5 py-0.5 rounded-xs bg-[#1e1b4b] hover:bg-[#312e81] text-[#e9d5ff] border border-[#818cf8]/50 font-bold text-[9px] cursor-pointer shrink-0"
                      >
                        FEAT GRID: {recFeat.name.toUpperCase()} →
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Canonical Moveset & Modifiers Summary */}
              {(() => {
                const mods = getWeaponGemCombatModifiers(state, activeWeaponDef.id);
                const modProf = mods.modificationProfile;
                const m1 = activeWeaponDef.moveset[0];
                const m2 = activeWeaponDef.moveset[1];
                const effDmgType =
                  modProf?.effectiveDamageType ||
                  m1?.damageType ||
                  activeWeaponDef.primaryDamageType;
                const isConverted = Boolean(modProf?.damageTypeConvertedFromContact);
                const tempoMult = modProf?.clampedTempoMultiplier ?? 1.0;
                const compStats = modProf?.statModifiers;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1">
                    <div className="p-1 bg-[#05070a] rounded-xs border border-[#1e293b]">
                      <div className="text-[9px] text-[#94a3b8]">ACTION 1 · DAMAGE TYPE</div>
                      <div className="text-[9px] font-bold text-[#fde047] flex items-center gap-1 flex-wrap">
                        <span>
                          {m1
                            ? `${Math.round(m1.damage * mods.damageMult)} (${effDmgType})`
                            : 'Utility'}
                        </span>
                        {isConverted && (
                          <span className="px-1 py-0.1 rounded-[2px] bg-[#431407] text-[#fdba74] text-[8px]">
                            CONTACT CONV
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-1 bg-[#05070a] rounded-xs border border-[#1e293b]">
                      <div className="text-[9px] text-[#94a3b8]">TEMPO (±30% CAP) & MODE</div>
                      <div className="text-[9px] font-bold text-[#38bdf8]">
                        ×{tempoMult.toFixed(2)} · {modProf?.effectiveAction1Mode || 'STANDARD'}
                        {m2
                          ? ` · S2 ${Math.round(m2.damage * mods.damageMult)}`
                          : ''}
                      </div>
                    </div>
                    <div className="p-1 bg-[#05070a] rounded-xs border border-[#1e293b]">
                      <div className="text-[9px] text-[#94a3b8]">DEFENSE / LAYER 2</div>
                      <div className="text-[9px] font-bold text-[#86efac]">
                        +{(activeWeaponDef.passiveShieldBonus || 0) + mods.maxShieldBonus} SHD
                        {(activeWeaponDef.passiveArmorBonus || 0) +
                          (compStats?.shieldDurabilityDelta || 0) !==
                        0
                          ? ` · +${(activeWeaponDef.passiveArmorBonus || 0) + (compStats?.shieldDurabilityDelta || 0)} DUR`
                          : ''}
                        {compStats?.armorThresholdDelta
                          ? ` · ${compStats.armorThresholdDelta > 0 ? `+${compStats.armorThresholdDelta}` : compStats.armorThresholdDelta} THR`
                          : ''}
                      </div>
                    </div>
                    <div className="p-1 bg-[#05070a] rounded-xs border border-[#1e293b]">
                      <div className="text-[9px] text-[#94a3b8]">HEAT / PIERCE / SHRED</div>
                      <div className="text-[9px] font-bold text-[#c084fc]">
                        HEAT ×{mods.skillHeatCostMult.toFixed(2)}
                        {compStats?.thrPierceDelta
                          ? ` · +${compStats.thrPierceDelta} THR PIERCE`
                          : ''}
                        {compStats && compStats.durShredMultiplier !== 1
                          ? ` · ×${compStats.durShredMultiplier.toFixed(2)} SHRED`
                          : ''}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Any-Order Slot Matrix for Active Weapon */}
          {renderAnyOrderModWorkbench(
            activeWeaponDef.id,
            activeWeaponBaseDef.name,
            true,
            (newId) => setSelectedWeaponInstanceId(newId)
          )}
        </div>
      )}

      {/* ─── WORKBENCH 2: CHASSIS INTERNAL SUB-MODULES & HARDWARE GEM SOCKETS ─── */}
      {category === 'chassis' && (
        <div className="space-y-2">
          {/* Anatomical Assembly Selector */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-[9px] font-bold text-[#38bdf8]">
                SELECT CHASSIS ASSEMBLY & INTERNAL SUB-MODULE SLOT:
              </span>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    {
                      id: 'head',
                      label: 'Head (Dome + Optics + Sensory A/B)',
                      defaultSlot: 'head' as const,
                    },
                    {
                      id: 'torso',
                      label: 'Torso (Frame Plating + Reactor Core)',
                      defaultSlot: 'plating' as const,
                    },
                    {
                      id: 'arms',
                      label: 'Arms (Aperture Plate + Arm Actuators)',
                      defaultSlot: 'arms' as const,
                    },
                    {
                      id: 'legs',
                      label: 'Legs (Leg Actuators / Striders)',
                      defaultSlot: 'legs' as const,
                    },
                  ]
                ).map((grp) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setChassisGroup(grp.id as ArmoryChassisGroup);
                      setActiveHardwareSlot(grp.defaultSlot);
                      setSelectedModSlotIndex(0);
                    }}
                    className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer ${
                      chassisGroup === grp.id
                        ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                        : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:border-[#38bdf8]'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Module Slot Tabs within Selected Assembly */}
            <div className="flex flex-wrap gap-1 pt-1 border-t border-[#1e293b]">
              {(chassisGroup === 'head'
                ? [
                    { slot: 'head' as const, label: 'Exterior: Dome Plate (Armor)' },
                    { slot: 'optics' as const, label: 'Sub-Mod 1: Head Optics' },
                    { slot: 'sensoryA' as const, label: 'Sub-Mod 2: Sensory A' },
                    { slot: 'sensoryB' as const, label: 'Sub-Mod 3: Sensory B' },
                  ]
                : chassisGroup === 'torso'
                  ? [
                      { slot: 'plating' as const, label: 'Exterior: Frame Plating (Armor)' },
                      { slot: 'reactor' as const, label: 'Sub-Mod 1: Reactor Core' },
                    ]
                  : chassisGroup === 'arms'
                    ? [
                        { slot: 'arms' as const, label: 'Exterior: Aperture Plate (Armor)' },
                        { slot: 'actuators' as const, label: 'Sub-Mod 1: Arm Actuators' },
                      ]
                    : [{ slot: 'legs' as const, label: 'Sub-Mod 2: Leg Actuators / Striders' }]
              ).map((subTab) => {
                const eqId = getEquippedHardwareIdForSlot(subTab.slot);
                const eqHw = findHardwareItemByNameOrId(eqId);
                return (
                  <button
                    key={subTab.slot}
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setActiveHardwareSlot(subTab.slot);
                      setSelectedModSlotIndex(0);
                    }}
                    className={`px-2 py-1 rounded-xs border text-left cursor-pointer ${
                      activeHardwareSlot === subTab.slot
                        ? 'bg-[#172554] border-[#fde047] text-[#fde047]'
                        : 'bg-[#05070a] border-[#1e293b] text-[#cbd5e1] hover:border-[#475569]'
                    }`}
                  >
                    <div className="text-[9px] font-bold">{subTab.label}</div>
                    <div className="text-[9px] text-[#86efac] truncate max-w-[180px]">
                      {eqHw?.name || eqId || 'None'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Hardware / Sub-Module Inspection + Gem Socket Matrix + Sub-Module Swapper */}
          {(() => {
            const currentHwId = getEquippedHardwareIdForSlot(activeHardwareSlot);
            const currentHw = findHardwareItemByNameOrId(currentHwId);
            const baseHwId = parseEquipmentInstanceId(currentHw?.id || currentHwId).baseId;
            const baseHw = findHardwareItemByNameOrId(baseHwId) || currentHw;
            const isExteriorArmor =
              activeHardwareSlot === 'head' ||
              activeHardwareSlot === 'plating' ||
              activeHardwareSlot === 'arms';

            const candidateHardwareItems: CanonicalHardwareItemDefinition[] = [
              ...CHASSIS_HARDWARE_CATALOG.filter((h) => h.slot === activeHardwareSlot),
              ...CRAFTED_SUBMODULE_HARDWARE.filter((h) => h.slot === activeHardwareSlot),
            ];

            return (
              <div className="space-y-2">
                {currentHw && baseHw && (
                  <>
                    <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#334155] flex flex-col sm:flex-row items-center sm:items-start gap-3">
                      <HighResEquipmentArtCanvas
                        state={state}
                        itemIdOrName={currentHw.id}
                        slotHint={activeHardwareSlot}
                        sizeClass="w-28 h-28"
                        highlightedModSlotIndex={selectedModSlotIndex}
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div>
                            <div className="text-[11px] font-bold text-[#38bdf8]">
                              {currentHw.name}
                              {devMode && (
                                <span className="ml-1.5 text-[9px] font-mono text-[#64748b]">
                                  [{currentHw.id}]
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-[#94a3b8]">
                              {currentHw.canonicalSlotLabel} · {currentHw.subtype} · Weight:{' '}
                              <b className="text-[#e2e8f0]">
                                {getHardwareBaseWeight(currentHw)} WT
                              </b>
                              {getHardwareCapacityBonus(currentHw) > 0
                                ? ` · Capacity: +${getHardwareCapacityBonus(currentHw)} WT`
                                : ''}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[9px] font-bold ${
                              isExteriorArmor
                                ? 'bg-[#1e293b] text-[#fde047]'
                                : 'bg-[#172554] text-[#7dd3fc]'
                            }`}
                          >
                            {isExteriorArmor
                              ? 'EXTERIOR ARMOR PLATING'
                              : 'INTERNAL SUB-MODULE (NO ARMOR VALUE)'}
                          </span>
                        </div>
                        <div className="text-[9px] text-[#cbd5e1]">{currentHw.description}</div>
                        <div className="flex flex-wrap gap-1 pt-0.5 text-[9px]">
                          {isExteriorArmor && currentHw.armorDurability ? (
                            <span className="px-1.5 py-0.5 bg-[#052e16] text-[#86efac] rounded-xs font-bold">
                              +{currentHw.armorDurability} Armor Dur · Rating{' '}
                              {currentHw.armorRating ?? 0} · Thresh{' '}
                              {currentHw.armorThreshold ?? 0}
                            </span>
                          ) : null}
                          {currentHw.shieldBonus ? (
                            <span className="px-1.5 py-0.5 bg-[#0c4a6e] text-[#7dd3fc] rounded-xs font-bold">
                              +{currentHw.shieldBonus} Shield
                            </span>
                          ) : null}
                          {currentHw.lightBonus ? (
                            <span className="px-1.5 py-0.5 bg-[#3b0764] text-[#e9d5ff] rounded-xs font-bold">
                              +{currentHw.lightBonus} Light Radius
                            </span>
                          ) : null}
                          {currentHw.stabilityBonus ? (
                            <span className="px-1.5 py-0.5 bg-[#1e293b] text-[#fde047] rounded-xs font-bold">
                              {currentHw.stabilityBonus > 0
                                ? `+${currentHw.stabilityBonus}`
                                : currentHw.stabilityBonus}{' '}
                              Stability
                            </span>
                          ) : null}
                          {currentHw.attackMassBonus ? (
                            <span className="px-1.5 py-0.5 bg-[#451a03] text-[#fdba74] rounded-xs font-bold">
                              +{currentHw.attackMassBonus} Strike Mass
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Any-Order Gem Sockets on this Hardware / Sub-Module */}
                    {renderAnyOrderModWorkbench(
                      currentHw.id,
                      baseHw.name,
                      false,
                      (newId) => {
                        setEquippedHardwareIdForSlot(activeHardwareSlot, newId);
                      }
                    )}
                  </>
                )}

                {/* Install / Swap Sub-Module or Hardware Piece */}
                <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
                  <div className="text-[9px] font-bold text-[#86efac]">
                    INSTALL OR CRAFT [{activeHardwareSlot.toUpperCase()}] HARDWARE / SUB-MODULE:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {candidateHardwareItems.map((hw) => {
                      const instances = getOwnedEquipmentInstances(state, hw.id);
                      const targetId = instances[0] || hw.id;
                      const resolvedHw = findHardwareItemByNameOrId(targetId) || hw;
                      const unlocked = isCheatMode || isEquipmentUnlocked(state, hw.id);
                      const isCrafted = hw.origin === 'crafted' && (hw.gemCost?.length || 0) > 0;
                      const canCraft =
                        isCrafted &&
                        (isCheatMode ||
                          (hw.gemCost || []).every(
                            (r) => getInventoryGemCount(state, r.gemId) >= r.count
                          ));
                      const isEquipped =
                        currentHw?.id === resolvedHw.id || currentHwId === resolvedHw.name;

                      return (
                        <div
                          key={hw.id}
                          className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                            isEquipped
                              ? 'bg-[#172554]/60 border-[#fde047]'
                              : 'bg-[#05070a] border-[#1e293b]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[9px] text-[#e2e8f0] truncate">
                              {resolvedHw.name}
                            </span>
                            <span className="text-[9px] text-[#94a3b8] shrink-0">
                              {getHardwareBaseWeight(resolvedHw)} WT
                              {getHardwareCapacityBonus(resolvedHw) > 0
                                ? ` · +${getHardwareCapacityBonus(resolvedHw)} CAP`
                                : ''}
                            </span>
                          </div>
                          <div className="text-[9px] text-[#cbd5e1]">
                            {resolvedHw.description}
                          </div>
                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            <span className="text-[9px] text-[#7dd3fc]">
                              {isCrafted
                                ? `Craft Cost: ${(hw.gemCost || [])
                                    .map(
                                      (r) =>
                                        `${r.count} ${GEMSTONE_REGISTRY[r.gemId]?.name || r.gemId}`
                                    )
                                    .join(' + ')}`
                                : `Max Gem Sockets: ${getEquipmentMaxModSlots(resolvedHw.id)}`}
                            </span>
                            <button
                              type="button"
                              disabled={isEquipped || (!unlocked && !canCraft)}
                              onClick={() => {
                                if (!unlocked && isCrafted && canCraft) {
                                  if (!isCheatMode) {
                                    for (const req of hw.gemCost || []) {
                                      const slot = state.inventorySlots.find(
                                        (s) => s.itemId === req.gemId
                                      );
                                      if (slot) slot.count -= req.count;
                                    }
                                    state.inventorySlots = state.inventorySlots.filter(
                                      (s) => s.count > 0
                                    );
                                  }
                                  unlockEquipmentItem(state, hw.id, sayCtx);
                                }
                                soundSystem.playPowerup();
                                setEquippedHardwareIdForSlot(
                                  activeHardwareSlot,
                                  resolvedHw.id
                                );
                                sayCtx.say(
                                  `INSTALLED ${resolvedHw.name.toUpperCase()} IN ${activeHardwareSlot.toUpperCase()}`
                                );
                                notifyOrionStateChange();
                              }}
                              className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer ${
                                isEquipped
                                  ? 'bg-[#1e293b] text-[#fde047] border-[#fde047]/50 cursor-default'
                                  : unlocked || canCraft
                                    ? 'bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border-[#22c55e]/60'
                                    : 'bg-[#0f172a] text-[#475569] border-[#1e293b] cursor-not-allowed'
                              }`}
                            >
                              {isEquipped
                                ? 'EQUIPPED'
                                : !unlocked && isCrafted
                                  ? 'CRAFT & INSTALL'
                                  : 'INSTALL'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── WORKBENCH 3: ACTION MODIFICATIONS (MELEE STRUCTURE / RANGED INTEGRATION / MOBILITY KIT) ─── */}
      {category === 'action_mods' && (
        <div className="space-y-2">
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[9px] font-bold text-[#c084fc]">
              SELECT ACTION MODIFICATION DOMAIN:
            </span>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'melee', label: 'Arm Mod 2 · Structure (Melee)' },
                  { id: 'ranged', label: 'Arm Mod 3 · Integration (Ranged)' },
                  { id: 'mobility', label: 'Frame Mod 3 · Mobility Kit (Dash)' },
                ] as const
              ).map((dom) => (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    setActiveActionModCategory(dom.id);
                  }}
                  className={`px-2 py-1 rounded-xs text-[9px] font-bold border cursor-pointer ${
                    activeActionModCategory === dom.id
                      ? 'bg-[#c084fc] text-[#05070a] border-[#e9d5ff]'
                      : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:border-[#c084fc]'
                  }`}
                >
                  {dom.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {ACTION_MODIFICATION_CATALOG.filter(
              (m) => m.targetCategory === activeActionModCategory
            ).map((mod) => {
              const isInstalled = eq.installedMods?.[activeActionModCategory] === mod.id;
              const isUnlocked =
                isCheatMode ||
                mod.origin === 'looted' ||
                (eq.unlockedMods || []).includes(mod.id);
              const canGenerate =
                !isUnlocked &&
                mod.gemCost.every(
                  (r) => getInventoryGemCount(state, r.gemId) >= r.count
                );
              const costText =
                mod.gemCost.length === 0
                  ? 'LOOTED ACTION MOD (0 GEMS)'
                  : mod.gemCost
                      .map(
                        (r) =>
                          `${r.count} ${GEMSTONE_REGISTRY[r.gemId]?.name || r.gemId}`
                      )
                      .join(' + ');

              return (
                <div
                  key={mod.id}
                  className={`p-2 rounded-xs border flex flex-col justify-between gap-1 ${
                    isInstalled
                      ? 'bg-[#172554]/60 border-[#fde047]'
                      : 'bg-[#090d14] border-[#1e293b]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-[9px] text-[#e2e8f0]">
                      {mod.name}
                      {devMode && (
                        <span className="ml-1 text-[9px] font-mono text-[#64748b]">
                          [{mod.id}]
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] text-[#94a3b8]">
                      {(mod.weightDelta ?? 0) >= 0
                        ? `+${mod.weightDelta ?? 0}`
                        : mod.weightDelta}{' '}
                      WT
                      {mod.capacityDelta
                        ? ` · ${mod.capacityDelta > 0 ? `+${mod.capacityDelta}` : mod.capacityDelta} CAP`
                        : ''}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#86efac]">+ {mod.gainDescription}</div>
                  <div className="text-[9px] text-[#f87171]">− {mod.drawbackDescription}</div>
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e293b]">
                    <span className="text-[9px] text-[#ffd27d]">{costText}</span>
                    <div className="flex items-center gap-1">
                      {isInstalled ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundSystem.playSelect();
                            if (eq.installedMods) {
                              delete eq.installedMods[activeActionModCategory];
                            }
                            sayCtx.say(`UNEQUIPPED ${mod.name.toUpperCase()}`);
                            notifyOrionStateChange();
                          }}
                          className="px-2 py-0.5 rounded-xs bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 text-[9px] font-bold cursor-pointer"
                        >
                          UNEQUIP
                        </button>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundSystem.playPowerup();
                            eq.installedMods = eq.installedMods || {};
                            eq.installedMods[activeActionModCategory] = mod.id;
                            sayCtx.say(
                              `INSTALLED ${mod.name.toUpperCase()} [${activeActionModCategory.toUpperCase()}]`
                            );
                            notifyOrionStateChange();
                          }}
                          className="px-2 py-0.5 rounded-xs bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border border-[#22c55e]/60 text-[9px] font-bold cursor-pointer"
                        >
                          INSTALL MOD
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canGenerate}
                          onClick={() => {
                            const ok = generateEquipmentModWithGems(state, mod.id, sayCtx);
                            if (ok) {
                              eq.installedMods = eq.installedMods || {};
                              eq.installedMods[activeActionModCategory] = mod.id;
                              soundSystem.playPowerup();
                              notifyOrionStateChange();
                            } else {
                              soundSystem.playMenuBeep();
                            }
                          }}
                          className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer ${
                            canGenerate
                              ? 'bg-[#3b0764] hover:bg-[#581c87] text-[#e9d5ff] border-[#c084fc]'
                              : 'bg-[#0f172a] text-[#475569] border-[#1e293b] cursor-not-allowed'
                          }`}
                        >
                          SYNTHESIZE & INSTALL
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
