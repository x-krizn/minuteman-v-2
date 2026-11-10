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
  CanonicalHardwareItemDefinition,
  CHASSIS_HARDWARE_CATALOG,
  computePlayerLoadMetrics,
  CRAFTED_SUBMODULE_HARDWARE,
  createInitialEquipmentSlots,
  findHardwareItemByNameOrId,
  formatModifiedEquipmentName,
  GEMSTONE_CATALOG,
  GEMSTONE_REGISTRY,
  generateEquipmentModWithGems,
  getEquipmentMaxModSlots,
  getHardwareBaseWeight,
  getHardwareCapacityBonus,
  getHardwareGemBonusDescription,
  getInventoryGemCount,
  getOwnedEquipmentInstances,
  getOwnedWeaponCount,
  getWeaponComponentSlots,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
  getWeaponInstanceEquipWeight,
  getWeaponSubtypeInfo,
  installGemModOnEquipment,
  isEquipmentUnlocked,
  parseEquipmentInstanceId,
  removeGemModFromEquipment,
  unlockEquipmentItem,
  WEAPON_COMPONENT_PART_CATALOG,
  WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS,
  WEAPON_GEM_WEIGHT_DELTA,
} from '../../database/progression';
import { notifyOrionStateChange } from '../../systems';
import {
  GemId,
  OrionState,
  WEAPON_CATEGORIES,
  WeaponCategory,
  WeaponComponentPartDefinition,
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
}) => {
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
    const anatomicalSlots: WeaponComponentSlotId[] = isWeaponItem
      ? getWeaponComponentSlots(baseId)
      : (['grip', 'focus', 'sight'] as WeaponComponentSlotId[]);
    const compMap = eq.installedWeaponComponents?.[targetInstanceId] || {};
    const hwItem = !isWeaponItem ? findHardwareItemByNameOrId(targetInstanceId) : undefined;
    const clampedSlotIdx = Math.max(0, Math.min(maxSlots - 1, selectedModSlotIndex));
    const activeAnatomicalSlotName = anatomicalSlots[clampedSlotIdx];
    const wDef = isWeaponItem ? getWeaponDefinition(baseId) : undefined;
    const isUniqueWeapon = Boolean(wDef?.weaponTier === 'unique');
    const currentSlotGem = slotGems[clampedSlotIdx] || null;
    const currentInstalledPartId =
      isWeaponItem && !isUniqueWeapon ? compMap[activeAnatomicalSlotName] : undefined;
    const currentInstalledPartDef = currentInstalledPartId
      ? WEAPON_COMPONENT_PART_CATALOG.find((p) => p.id === currentInstalledPartId)
      : undefined;

    const compatibleWeaponParts: WeaponComponentPartDefinition[] =
      isWeaponItem && !isUniqueWeapon
        ? WEAPON_COMPONENT_PART_CATALOG.filter(
            (p) => p.componentSlot === activeAnatomicalSlotName
          )
        : [];

    // Compute what the Custom name will look like if a gem/part is installed in clampedSlotIdx
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
            <div className="text-[9.5px] font-bold text-[#fde047]">
              {isUniqueWeapon
                ? `UNIQUE MAGITECH · FIXED COMPONENTS & 1 RESONANCE GEM SOCKET (${installedGems.length}/${maxSlots} OCCUPIED)`
                : `ANY-ORDER MODIFICATION SLOTS (${installedGems.length}/${maxSlots} OCCUPIED)`}
            </div>
            <div className="text-[7.5px] text-[#94a3b8]">
              {isUniqueWeapon ? (
                <>
                  Unique Magitech ordnance features factory-sealed internal components (Hilt, Grip,
                  Blade, Actuator) and exposes <b className="text-[#c084fc]">1 Resonance Gem Socket</b>{' '}
                  for elemental domain tuning (
                  <span className="text-[#86efac]">
                    {formatModifiedEquipmentName(baseName, ['spinel'])}
                  </span>
                  ).
                </>
              ) : (
                <>
                  Select any slot below in any order to install, replace, or remove a component part
                  or gemstone. Modified items use semantic <b className="text-[#fde047]">Custom</b>{' '}
                  naming (
                  <span className="text-[#86efac]">
                    {formatModifiedEquipmentName(baseName, ['spinel'])}
                  </span>{' '}
                  /{' '}
                  <span className="text-[#86efac]">
                    {formatModifiedEquipmentName(baseName, ['spinel', 'carnelian'])}
                  </span>
                  ).
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
              className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[7.5px] font-bold cursor-pointer"
            >
              + ACQUIRE 2ND COPY (PAIRED STANCE)
            </button>
          )}
        </div>

        {/* Interactive Slot Selector Buttons (Install in ANY Order) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {Array.from({ length: maxSlots }).map((_, idx) => {
            const sGem = slotGems[idx] || null;
            const gemInfo = sGem ? GEMSTONE_REGISTRY[sGem] : null;
            const slotLabel = isWeaponItem
              ? anatomicalSlots[idx]?.toUpperCase() || `SLOT ${idx + 1}`
              : `${hwItem?.canonicalSlotLabel.toUpperCase() || 'HARDWARE'} SOCKET ${idx + 1}`;
            const partId = isWeaponItem ? compMap[anatomicalSlots[idx]] : undefined;
            const partDef = partId
              ? WEAPON_COMPONENT_PART_CATALOG.find((p) => p.id === partId)
              : undefined;
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
                  <span className="text-[8px] font-bold text-[#7dd3fc]">
                    SLOT {idx + 1} · [{slotLabel}]
                  </span>
                  <span
                    className={`text-[7px] px-1 py-0.2 rounded-[2px] font-bold ${
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
                        className="text-[8.5px] font-bold truncate"
                        style={{ color: gemInfo.hexColor }}
                      >
                        {partDef ? partDef.name : `${gemInfo.name} Socket`}
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
                      className="px-1.5 py-0.5 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 rounded-xs text-[7px] font-bold cursor-pointer shrink-0"
                    >
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <div className="text-[7.5px] text-[#64748b] italic pt-0.5">
                    Click to select & install mod in Slot {idx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Slot Installation Options */}
        <div className="p-2 bg-[#090d14] rounded-xs border border-[#334155] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-bold text-[#fde047]">
              CONFIGURING SLOT {clampedSlotIdx + 1}: [
              {isWeaponItem
                ? anatomicalSlots[clampedSlotIdx]?.toUpperCase()
                : `GEM SOCKET ${clampedSlotIdx + 1}`}
              ]{' '}
              {currentSlotGem
                ? `— CURRENT: ${(currentInstalledPartDef?.name || GEMSTONE_REGISTRY[currentSlotGem]?.name || '').toUpperCase()} (CLICK ANY OPTION TO REPLACE)`
                : '— READY FOR INSTALLATION'}
            </span>
          </div>

          {/* 1. Named Anatomical Weapon Component Parts (if Weapon/Auxiliary) */}
          {isWeaponItem && compatibleWeaponParts.length > 0 && (
            <div className="space-y-1">
              <div className="text-[7.5px] font-bold text-[#7dd3fc]">
                A. COMPATIBLE [{activeAnatomicalSlotName.toUpperCase()}] COMPONENT PARTS (CRAFTED OR LOOTED):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {compatibleWeaponParts.map((part) => {
                  const canAfford =
                    isCheatMode ||
                    part.origin === 'looted' ||
                    part.gemCost.every(
                      (req) => getInventoryGemCount(state, req.gemId) >= req.count
                    );
                  const costLabel =
                    part.origin === 'looted'
                      ? 'LOOTED PART (0 GEMS)'
                      : part.gemCost
                          .map(
                            (r) =>
                              `${r.count} ${GEMSTONE_REGISTRY[r.gemId]?.name || r.gemId}`
                          )
                          .join(' + ');
                  const isCurrentlyInstalled = currentInstalledPartId === part.id;

                  return (
                    <div
                      key={part.id}
                      className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                        isCurrentlyInstalled
                          ? 'bg-[#172554]/60 border-[#fde047]'
                          : 'bg-[#05070a] border-[#1e293b]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                          {part.name}
                        </span>
                        <span
                          className={`text-[6.8px] px-1 py-0.2 rounded-[2px] font-bold shrink-0 ${
                            part.origin === 'looted'
                              ? 'bg-[#052e16] text-[#86efac]'
                              : 'bg-[#3b0764] text-[#e9d5ff]'
                          }`}
                        >
                          {part.origin.toUpperCase()} · {part.maxGemSlots}G
                        </span>
                      </div>
                      <div className="text-[7px] text-[#86efac]">+ {part.gainDescription}</div>
                      <div className="text-[6.8px] text-[#f87171]">
                        − {part.drawbackDescription} (
                        {part.weightDelta >= 0 ? `+${part.weightDelta}` : part.weightDelta}{' '}
                        WT)
                      </div>
                      <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-[#1e293b]/70">
                        <span className="text-[6.8px] text-[#94a3b8]">
                          Cost: <b className="text-[#ffd27d]">{costLabel}</b> →{' '}
                          <span className="text-[#fde047]">
                            {previewNextName(part.primaryGemId)}
                          </span>
                        </span>
                        <button
                          type="button"
                          disabled={!canAfford || isCurrentlyInstalled}
                          onClick={() => {
                            const nextId = installGemModOnEquipment(
                              state,
                              targetInstanceId,
                              part.primaryGemId,
                              sayCtx,
                              {
                                slotIndex: clampedSlotIdx,
                                slotName: activeAnatomicalSlotName,
                                partDef: part,
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
                          className={`px-2 py-0.5 rounded-xs text-[7px] font-bold border cursor-pointer shrink-0 ${
                            isCurrentlyInstalled
                              ? 'bg-[#1e293b] text-[#fde047] border-[#fde047]/50 cursor-default'
                              : canAfford
                                ? 'bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border-[#22c55e]/60'
                                : 'bg-[#0f172a] text-[#475569] border-[#1e293b] cursor-not-allowed'
                          }`}
                        >
                          {isCurrentlyInstalled
                            ? 'INSTALLED'
                            : currentSlotGem
                              ? `REPLACE SLOT ${clampedSlotIdx + 1}`
                              : `INSTALL IN SLOT ${clampedSlotIdx + 1}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Direct Gemstone Socket Installation (Available for both Weapons and Hardware in Any Slot Order) */}
          <div className="space-y-1">
            <div className="text-[7.5px] font-bold text-[#c084fc]">
              {isWeaponItem
                ? `B. DIRECT GEMSTONE INFUSION INTO SLOT ${clampedSlotIdx + 1} [${activeAnatomicalSlotName.toUpperCase()}]:`
                : `SOCKET GEMSTONE INTO ${hwItem?.canonicalSlotLabel.toUpperCase() || 'HARDWARE'} SLOT ${clampedSlotIdx + 1}:`}
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
                        className="font-bold text-[8px] flex items-center gap-1"
                        style={{ color: gem.hexColor }}
                      >
                        <SpriteCanvasIcon
                          base64={gem.iconBase64}
                          sizeClass="w-3.5 h-3.5"
                        />
                        {gem.name}
                      </span>
                      <span className="text-[7px] text-[#94a3b8] font-bold">
                        {isCheatMode ? '∞' : `×${invCount}`}
                      </span>
                    </div>
                    <div className="text-[6.8px] text-[#cbd5e1] leading-tight">
                      {bonusDesc}
                    </div>
                    {isWeaponItem && (
                      <div className="text-[6.5px] text-[#fde047] truncate">
                        → {previewNextName(gem.id)} ({wtDelta >= 0 ? `+${wtDelta}` : wtDelta}{' '}
                        WT)
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
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
          <div className="text-[10.5px] font-bold text-[#fb923c] flex items-center gap-2">
            <span>⚙ ARMORY MODIFICATION WORKBENCH</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-xs bg-[#1e293b] text-[#fde047]">
              LOAD: {loadMetrics.equippedWeight}/{loadMetrics.maxCapacity} WT (
              {loadMetrics.loadPct}% · {loadMetrics.loadBracket.toUpperCase()})
            </span>
          </div>
          <div className="text-[8px] text-[#94a3b8]">
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
              className={`px-2 py-1 rounded-xs text-[8.5px] font-bold border cursor-pointer ${
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
              className="px-2 py-1 rounded-xs text-[8px] font-bold bg-[#1e293b] hover:bg-[#334155] text-[#ffd27d] border border-[#ffd27d]/50 cursor-pointer"
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
              <div className="text-[8.5px] font-bold text-[#ffd27d]">
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
                    className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
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
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
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
                  const stInfo = getWeaponSubtypeInfo(w.id);

                  return (
                    <button
                      key={instanceId}
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        setSelectedWeaponInstanceId(instanceId);
                        setSelectedModSlotIndex(0);
                      }}
                      className={`px-2 py-1 rounded-xs border text-[8px] font-bold flex items-center gap-1.5 cursor-pointer ${
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
                      <span>{w.name}</span>
                      <span className="text-[6.5px] text-[#7dd3fc]">
                        [{stInfo.functionalType}]
                      </span>
                      <span
                        className={`text-[6.5px] font-mono ${
                          isUnique ? 'text-[#c084fc]' : 'text-[#86efac]'
                        }`}
                      >
                        {isUnique ? '· Magitech (1G)' : '· Custom (3S)'}
                      </span>
                      {isMain && (
                        <span className="px-1 py-0.2 bg-[#fde047]/20 text-[#fde047] rounded-[2px] text-[6.5px]">
                          MAIN
                        </span>
                      )}
                      {isSide && (
                        <span className="px-1 py-0.2 bg-[#38bdf8]/20 text-[#38bdf8] rounded-[2px] text-[6.5px]">
                          SIDE
                        </span>
                      )}
                      {isAux && (
                        <span className="px-1 py-0.2 bg-[#c084fc]/20 text-[#c084fc] rounded-[2px] text-[6.5px]">
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
                    {activeWeaponDef.name}{' '}
                    <span className="text-[8.5px] text-[#94a3b8]">
                      (×{getOwnedWeaponCount(state, activeWeaponDef.id)} Owned)
                    </span>
                  </div>
                  <div className="text-[8px] text-[#7dd3fc]">
                    {getWeaponSubtypeInfo(activeWeaponBaseId).subtype} · Equip Weight:{' '}
                    <b>{getWeaponInstanceEquipWeight(activeWeaponDef.id, state)} WT</b> ·{' '}
                    {activeWeaponBaseDef.weaponTier === 'unique' ? (
                      <span className="text-[#c084fc] font-bold">
                        FIXED INTERNAL PARTS · 1 RESONANCE GEM SOCKET
                      </span>
                    ) : (
                      <>
                        3 Component Slots: [
                        {getWeaponComponentSlots(activeWeaponBaseId).join(' / ').toUpperCase()}]
                      </>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-xs bg-[#1e293b] text-[#86efac] text-[8px] font-bold">
                  {getWeaponGemVisuals(state, activeWeaponDef.id).label}
                </span>
              </div>

              <div className="text-[8px] text-[#cbd5e1]">{activeWeaponDef.description}</div>

              {/* Canonical Moveset & Modifiers Summary */}
              {(() => {
                const mods = getWeaponGemCombatModifiers(state, activeWeaponDef.id);
                const m1 = activeWeaponDef.moveset[0];
                const m2 = activeWeaponDef.moveset[1];
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1">
                    <div className="p-1 bg-[#05070a] rounded-xs border border-[#1e293b]">
                      <div className="text-[6.8px] text-[#94a3b8]">PRIMARY DMG</div>
                      <div className="text-[8.5px] font-bold text-[#fde047]">
                        {m1
                          ? `${Math.round(m1.damage * mods.damageMult)} (${m1.damageType})`
                          : 'Utility'}
                      </div>
                    </div>
                    <div className="p-1 bg-[#05070a] rounded-xs border border-[#1e293b]">
                      <div className="text-[6.8px] text-[#94a3b8]">SECONDARY / ART</div>
                      <div className="text-[8.5px] font-bold text-[#38bdf8]">
                        {m2
                          ? `${Math.round(m2.damage * mods.damageMult)} · ${(m2.cooldownSec * mods.skillCooldownMult).toFixed(1)}s`
                          : 'Passive'}
                      </div>
                    </div>
                    <div className="p-1 bg-[#05070a] rounded-xs border border-[#1e293b]">
                      <div className="text-[6.8px] text-[#94a3b8]">PASSIVE DEFENSE</div>
                      <div className="text-[8.5px] font-bold text-[#86efac]">
                        +{ (activeWeaponDef.passiveShieldBonus || 0) + mods.maxShieldBonus } SHD
                        {activeWeaponDef.passiveArmorBonus
                          ? ` · +${activeWeaponDef.passiveArmorBonus} ARM`
                          : ''}
                      </div>
                    </div>
                    <div className="p-1 bg-[#05070a] rounded-xs border border-[#1e293b]">
                      <div className="text-[6.8px] text-[#94a3b8]">HEAT / COOLDOWN</div>
                      <div className="text-[8.5px] font-bold text-[#c084fc]">
                        CD ×{mods.skillCooldownMult.toFixed(2)} · HEAT ×
                        {mods.skillHeatCostMult.toFixed(2)}
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
              <span className="text-[8.5px] font-bold text-[#38bdf8]">
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
                    className={`px-2 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
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
                    <div className="text-[7.5px] font-bold">{subTab.label}</div>
                    <div className="text-[8px] text-[#86efac] truncate max-w-[180px]">
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
                            </div>
                            <div className="text-[8px] text-[#94a3b8]">
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
                            className={`px-2 py-0.5 rounded-xs text-[7.5px] font-bold ${
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
                        <div className="text-[8px] text-[#cbd5e1]">{currentHw.description}</div>
                        <div className="flex flex-wrap gap-1 pt-0.5 text-[7.5px]">
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
                  <div className="text-[8.5px] font-bold text-[#86efac]">
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
                            <span className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                              {resolvedHw.name}
                            </span>
                            <span className="text-[7px] text-[#94a3b8] shrink-0">
                              {getHardwareBaseWeight(resolvedHw)} WT
                              {getHardwareCapacityBonus(resolvedHw) > 0
                                ? ` · +${getHardwareCapacityBonus(resolvedHw)} CAP`
                                : ''}
                            </span>
                          </div>
                          <div className="text-[7.2px] text-[#cbd5e1]">
                            {resolvedHw.description}
                          </div>
                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            <span className="text-[6.8px] text-[#7dd3fc]">
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
                              className={`px-2 py-0.5 rounded-xs text-[7px] font-bold border cursor-pointer ${
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
            <span className="text-[8.5px] font-bold text-[#c084fc]">
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
                  className={`px-2 py-1 rounded-xs text-[8px] font-bold border cursor-pointer ${
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
                    <span className="font-bold text-[9px] text-[#e2e8f0]">{mod.name}</span>
                    <span className="text-[7px] text-[#94a3b8]">
                      {(mod.weightDelta ?? 0) >= 0
                        ? `+${mod.weightDelta ?? 0}`
                        : mod.weightDelta}{' '}
                      WT
                      {mod.capacityDelta
                        ? ` · ${mod.capacityDelta > 0 ? `+${mod.capacityDelta}` : mod.capacityDelta} CAP`
                        : ''}
                    </span>
                  </div>
                  <div className="text-[7.5px] text-[#86efac]">+ {mod.gainDescription}</div>
                  <div className="text-[7px] text-[#f87171]">− {mod.drawbackDescription}</div>
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e293b]">
                    <span className="text-[7px] text-[#ffd27d]">{costText}</span>
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
                          className="px-2 py-0.5 rounded-xs bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 text-[7px] font-bold cursor-pointer"
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
                          className="px-2 py-0.5 rounded-xs bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border border-[#22c55e]/60 text-[7px] font-bold cursor-pointer"
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
                          className={`px-2 py-0.5 rounded-xs text-[7px] font-bold border cursor-pointer ${
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
