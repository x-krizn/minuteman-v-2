/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../database/characters';
import {
  CLASS_UTILITY_CATALOG,
  getClassUtilityDefinition,
  getResolvedActionDescriptor,
} from '../database/equipment';
import { getItemDefinition } from '../database/items';
import { getCoinPickupSpriteBase64 } from '../database/items/currency';
import {
  ACTION_MODIFICATION_CATALOG,
  CHASSIS_HARDWARE_CATALOG,
  CORE_COMBAT_LAWS,
  doesPilotMeetFeatEquipmentRequirement,
  FRAME_FEAT_CATALOG,
  fundPilotSkillWithGem,
  GEMSTONE_CATALOG,
  GEMSTONE_REGISTRY,
  generateEquipmentModWithGems,
  getEffectiveMainGrip,
  getInventoryGemCount,
  getOwnedWeaponCount,
  getRetainedBuildGemCounts,
  getWeaponGemVisuals,
  getWeaponSubtypeInfo,
  isEquipmentUnlocked,
  isFeatNodeAvailable,
  LEVEL_UNLOCK_SEQUENCE,
  normalizePilotSkills,
  PILOT_SKILL_DEFINITIONS,
  refundInventoryGem,
  setMainWeaponGrip,
  toggleFeatNodeGemSocket,
} from '../database/progression';
import {
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
  WEAPON_REGISTRY,
} from '../database/equipment/weapons';
import {
  addOrionInventoryItem,
  applyTraitLineProfile,
  ASSIGNABLE_ACTION_CATALOG,
  assignTriggerAction,
  awakenLadyOfTheLake,
  consolidateInventorySlots,
  evaluateCathedralDoorStatus,
  getActiveWeaponStance,
  getOrionStateRef,
  getResolvedCombatSkills,
  isActionUnlocked,
  notifyOrionStateChange,
  performAuxiliarySwap,
  resolvePlayerSpriteParts,
  setBypassProgressionGates,
  setTutorialStateActive,
  subscribeOrionStateChange,
  syncStateGates,
  triggerOrcRaid,
  triggerThreeKnightsTrial,
  TUTORIAL_STEP_DESCRIPTORS,
  TutorialStepId,
} from '../systems';
import { FeatSynergyCategory, FeatTier } from '../types';
import {
  ALL_TRAIT_LINES,
  CompositeMechPreviewCanvas,
  EditableLoadoutSlot,
  EquipmentInventoryCategory,
  SpriteCanvasIcon,
} from './satchel/SatchelCanvases';
import { SatchelWorldTab } from './satchel/SatchelWorldTab';

export interface OrionSatchelProps {
  onResume: () => void;
}

export const OrionSatchel: React.FC<OrionSatchelProps> = ({ onResume }) => {
  const [tab, setTab] = useState<'status' | 'weapons' | 'inventory' | 'world' | 'progression'>('status');
  const [isEditingLoadout, setIsEditingLoadout] = useState(false);
  const [editingSlot, setEditingSlot] = useState<EditableLoadoutSlot>('slot1');
  const [loadoutSubtypeFilter, setLoadoutSubtypeFilter] = useState<string>('ALL');
  const [invCategory, setInvCategory] = useState<EquipmentInventoryCategory>('all');
  const [invSubtype, setInvSubtype] = useState<string>('ALL');
  const [featTierFilter, setFeatTierFilter] = useState<'ALL' | FeatTier>('ALL');
  const [featSynergyFilter, setFeatSynergyFilter] = useState<'ALL' | FeatSynergyCategory>('ALL');
  const [, setRefresh] = useState(0);

  const openSlotEditor = (slot: EditableLoadoutSlot) => {
    soundSystem.playSelect();
    setTab('weapons');
    setIsEditingLoadout(true);
    setEditingSlot(slot);
    setLoadoutSubtypeFilter('ALL');
  };

  useEffect(() => {
    return subscribeOrionStateChange(() => setRefresh((r) => r + 1));
  }, []);

  const state = getOrionStateRef();
  if (!state) return null;

  state.flags = state.flags || {};
  const gates = syncStateGates(state);
  const doorStatus = evaluateCathedralDoorStatus(state);
  const currentWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const currentWeapon = getWeaponDefinition(currentWeaponId);
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
  const isCheatMode = state.room === '-4,0' || Boolean(state.bypassProgressionGates);

  const handleUseItem = (itemId: string) => {
    const itemDef = getItemDefinition(itemId);
    if (!itemDef?.onUse) return;

    const used = itemDef.onUse(state, {
      say: (txt) => {
        state.toastText = txt;
        state.toastTimer = 2.5;
      },
      sound: soundSystem,
    });

    if (used) {
      const slot = state.inventorySlots.find((s) => s.itemId === itemId);
      if (slot) {
        slot.count -= 1;
        if (slot.count <= 0) {
          state.inventorySlots = state.inventorySlots.filter((s) => s.itemId !== itemId);
        }
      }
      notifyOrionStateChange();
    }
  };

  return (
    <div className="absolute inset-0 z-20 bg-[#05070a]/95 backdrop-blur-xs flex flex-col p-2.5 overflow-hidden text-[#e2e8f0] font-mono select-none">
      {/* Top Header & Tabs */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#1e293b]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('status');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'status'
                ? 'bg-[#38bdf8] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            MECH STATUS
          </button>
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('weapons');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'weapons'
                ? 'bg-[#ffd27d] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            LOADOUT
          </button>
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('inventory');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'inventory'
                ? 'bg-[#8dd7ad] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            SATCHEL
          </button>
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('world');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'world'
                ? 'bg-[#22d3ee] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            {isCheatMode ? 'WORLD & FOG DEV' : 'CAMPFIRES'}
          </button>
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('progression');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'progression'
                ? 'bg-[#c084fc] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            {isCheatMode ? 'CHEAT & GEMS' : 'SKILLS & GEMS'}
          </button>
          {state.room === '-4,0' && (
            <span className="px-1.5 py-0.5 bg-[#4c1d95] text-[#f0abfc] border border-[#a855f7] rounded-xs text-[8.5px] font-black shrink-0">
              CHEAT ROOM ACTIVE
            </span>
          )}
        </div>

        <button
          onClick={() => {
            soundSystem.playMenuBeep();
            onResume();
          }}
          className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] text-[10px] font-bold rounded-xs border border-[#334155] shrink-0"
        >
          CLOSE [SELECT]
        </button>
      </div>

      {/* Currency Strip */}
      {(() => {
        const totalInvGems = GEMSTONE_CATALOG.reduce(
          (sum, g) => sum + getInventoryGemCount(state, g.id),
          0
        );
        const retainedMap = getRetainedBuildGemCounts(state);
        const totalRetainedGems = Object.values(retainedMap).reduce((a, b) => a + b, 0);
        return (
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 bg-[#090d14] rounded-xs border border-[#1e293b] mb-1.5 text-[10px]">
            <span>
              PILOT: <b className="text-[#38bdf8]">{state.pilotName}</b> ({trait.frameModel || 'PNSY W416'})
            </span>
            <span>
              REACTOR: <b className="text-[#c084fc]">{state.equipmentSlots?.reactorCore || state.reactor}</b>
            </span>
            <span className="flex items-center gap-1">
              <SpriteCanvasIcon
                base64={GEMSTONE_REGISTRY.moonstone.iconBase64}
                sizeClass="w-3.5 h-3.5"
              />
              GEMS: <b className="text-[#4ade80]">{totalInvGems} INV</b> ·{' '}
              <b className="text-[#7dd3fc]">{totalRetainedGems} SOCKETED</b>
            </span>
            <span className="flex items-center gap-1">
              <SpriteCanvasIcon
                base64={getCoinPickupSpriteBase64(state.salvageScrap || 1)}
                sizeClass="w-3.5 h-3.5"
              />
              COINS / SCRAP: <b className="text-[#ffd27d]">{state.salvageScrap}</b>
            </span>
          </div>
        );
      })()}

      {/* Tab: MECH STATUS & THREE DEFENSE LAYERS */}
      {tab === 'status' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
          {/* Defense Layers Breakdown */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="text-[#ffd27d] font-bold text-[11px] flex justify-between">
              <span>CANONICAL THREE DEFENSE LAYERS</span>
              <span className="text-[#94a3b8]">LEVEL {state.level} / 20</span>
            </div>

            {/* Layer 1: Shield */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px]">
                <span className="text-[#77c7ff] font-bold">LAYER 1: SHIELD ({state.shields.type.toUpperCase()})</span>
                <span>
                  {Math.round(state.shields.capacity)} / {state.shields.maxCapacity} {state.shields.overloaded ? '⚠ OVERLOADED' : ''}
                </span>
              </div>
              <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-1.5 rounded-xs bg-[#1e293b] overflow-hidden">
                <rect
                  x="0"
                  y="0"
                  width={
                    state.shields.maxCapacity > 0
                      ? Math.max(0, Math.min(100, (state.shields.capacity / state.shields.maxCapacity) * 100))
                      : 0
                  }
                  height="4"
                  fill="#77c7ff"
                />
              </svg>
            </div>

            {/* Layer 2: Armor */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px]">
                <span className="text-[#ffd27d] font-bold">
                  LAYER 2: ARMOR ({state.armor.type.toUpperCase()}) · THRESH {state.armor.threshold} · RATING {state.armor.rating}
                </span>
                <span>
                  {Math.round(state.armor.durability)} / {state.armor.maxDurability}
                </span>
              </div>
              <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-1.5 rounded-xs bg-[#1e293b] overflow-hidden">
                <rect
                  x="0"
                  y="0"
                  width={
                    state.armor.maxDurability > 0
                      ? Math.max(0, Math.min(100, (state.armor.durability / state.armor.maxDurability) * 100))
                      : 0
                  }
                  height="4"
                  fill="#ffd27d"
                />
              </svg>
            </div>

            {/* Layer 3: Frame Integrity */}
            <div className="space-y-0.5">
              <div className="flex justify-between items-center text-[9px]">
                <span className={state.frame.state === 'Critical' ? 'text-[#ff9b9b] font-bold animate-pulse' : 'text-[#8dd7ad] font-bold'}>
                  LAYER 3: FRAME INTEGRITY (STATIC 200 HP) · {state.frame.state.toUpperCase()}
                </span>
                <span>
                  {state.frame.integrity} / 200
                </span>
              </div>
              <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-1.5 rounded-xs bg-[#1e293b] overflow-hidden">
                <rect
                  x="0"
                  y="0"
                  width={Math.max(0, Math.min(100, (state.frame.integrity / 200) * 100))}
                  height="4"
                  fill={state.frame.state === 'Critical' ? '#ff9b9b' : '#8dd7ad'}
                />
              </svg>
            </div>

            {/* Heat Gauge */}
            <div className="space-y-0.5 pt-1">
              <div className="flex justify-between text-[9px]">
                <span className="text-[#f97316] font-bold">REACTOR HEAT</span>
                <span>{Math.round(state.heat)} / {state.maxHeat}</span>
              </div>
              <svg viewBox="0 0 100 3" preserveAspectRatio="none" className="w-full h-1 rounded-xs bg-[#1e293b] overflow-hidden">
                <rect
                  x="0"
                  y="0"
                  width={Math.max(0, Math.min(100, (state.heat / (state.maxHeat || 100)) * 100))}
                  height="3"
                  fill="#f97316"
                />
              </svg>
            </div>
          </div>

          {/* Active Frame Identity (Full 6-Kit Hot-Swap in Cheat Room Mode) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8] font-bold text-[10px]">
                {isCheatMode ? 'CHEAT ROOM STARTING KIT SWITCHER:' : 'PILOT MECH CHASSIS:'}
              </span>
              <span className="text-[8.5px] text-[#38bdf8] font-bold">
                FRAME: {trait.frameModel || 'PNSY W416'} · {trait.reactor.toUpperCase()} REACTOR
              </span>
            </div>
            {isCheatMode && (
              <div className="grid grid-cols-3 gap-1">
                {ALL_TRAIT_LINES.map((tl) => {
                  const prof = TRAIT_REGISTRY[tl];
                  const isCurrent = state.traitLine === tl;
                  return (
                    <button
                      key={tl}
                      onClick={() => {
                        soundSystem.playSelect();
                        applyTraitLineProfile(state, tl);
                      }}
                      className={`px-1.5 py-1 rounded-xs border text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#172554]/80 border-[#38bdf8] text-[#e2e8f0]'
                          : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8] hover:border-[#475569]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px] text-[#ffd27d] truncate">{prof.name}</span>
                        <span className="text-[7px] uppercase px-1 rounded-xs bg-[#1e293b] text-[#cbd5e1] shrink-0">
                          {prof.weightClass || 'medium'}
                        </span>
                      </div>
                      <div className="text-[7.5px] text-[#7dd3fc] truncate">
                        {prof.frameModel} · {prof.reactor} · {prof.baseArmor.type}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="text-[9.5px] text-[#cbd5e1]">{trait.identity}</div>
          </div>

          {/* §3.4 Frame Load Capacity vs. Weapon Weight Penalty & §3.5 Critical State */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#ffd27d] text-[10px]">
                FRAME LOAD CAPACITY & WEAPON WEIGHT MATRIX (§3.4):
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-xs font-bold text-[8px] ${
                  gates.loadPenalty.label.startsWith('OPTIMAL') ||
                  gates.loadPenalty.label.startsWith('HEAVY CHASSIS')
                    ? 'bg-[#064e3b] text-[#6ee7b7]'
                    : 'bg-[#451a03] text-[#fcd34d]'
                }`}
              >
                {gates.loadPenalty.label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[8.5px]">
              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="text-[#94a3b8] text-[7.5px]">BASE → EFFECTIVE LOAD</div>
                <div className="font-bold text-[#38bdf8] uppercase">
                  {trait.weightClass || 'medium'} → {gates.effectiveLoadCapacity}
                </div>
              </div>
              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="text-[#94a3b8] text-[7.5px]">ACTIVE WEAPON WEIGHT</div>
                <div className="font-bold text-[#ffd27d] uppercase">
                  {currentWeapon?.name} ({gates.activeWeaponWeight})
                </div>
              </div>
              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="text-[#94a3b8] text-[7.5px]">CRITICAL STATE (≤40 HP)</div>
                <div
                  className={`font-bold ${
                    state.frame.integrity <= 40 ? 'text-[#f87171]' : 'text-[#86efac]'
                  }`}
                >
                  {state.frame.integrity <= 40
                    ? '-30% SPD & 15% MISFIRE'
                    : 'NOMINAL (>20% HP)'}
                </div>
              </div>
            </div>
          </div>

          {/* §4.4 Simplified Equipment & Hardware System */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#38bdf8] text-[10px]">
                EQUIPMENT SLOTS 1–3 & SIMPLIFIED CHASSIS:
              </span>
              <span className="text-[8px] text-[#94a3b8]">
                BAND: <b className="text-[#c084fc]">{gates.levelBand.toUpperCase()}</b>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[8px]">
              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#ffd27d]/40">
                <div className="flex justify-between font-bold text-[#ffd27d]">
                  <span>MAIN HAND</span>
                  <span className="text-[#86efac]">
                    {getEffectiveMainGrip(state) === '2h' ? 'AC1–AC5 (2H)' : 'AC1, AC2, AC3'}
                  </span>
                </div>
                <div className="text-[#cbd5e1] truncate mt-0.5">
                  {getWeaponDefinition(state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster')?.name}
                  {getEffectiveMainGrip(state) === '2h' ? ' (2H)' : ' (1H)'}
                </div>
                <div className="text-[7px] text-[#94a3b8]">
                  Stance: {getActiveWeaponStance(state).shortTag}
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#38bdf8]/40">
                <div className="flex justify-between font-bold text-[#38bdf8]">
                  <span>SIDE HAND</span>
                  <span className="text-[#86efac]">AC4, AC5</span>
                </div>
                <div className="text-[#cbd5e1] truncate mt-0.5">
                  {getEffectiveMainGrip(state) === '2h' &&
                  state.equipmentSlots?.slot2 === state.equipmentSlots?.slot1
                    ? `${getWeaponDefinition(state.equipmentSlots?.slot1 || '')?.name} (2H)`
                    : getWeaponDefinition(state.equipmentSlots?.slot2 || '')?.name ||
                      getItemDefinition(state.equipmentSlots?.slot2 || '')?.name ||
                      (state.equipmentSlots?.slot2 ? state.equipmentSlots.slot2 : '—')}
                </div>
                <div className="text-[7px] text-[#94a3b8]">
                  {getActiveWeaponStance(state).label}
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#c084fc]/40">
                <div className="flex justify-between font-bold text-[#c084fc]">
                  <span>AUXILIARY</span>
                  <span className="text-[#86efac]">HOLD [L] SIDE⇄AUX</span>
                </div>
                <div className="text-[#cbd5e1] truncate mt-0.5">
                  {getWeaponDefinition(state.equipmentSlots?.slot3 || '')?.name ||
                    getItemDefinition(state.equipmentSlots?.slot3 || '')?.name ||
                    (state.equipmentSlots?.slot3 ? state.equipmentSlots.slot3 : '—')}
                </div>
                <div className="text-[7px] text-[#94a3b8]">
                  Main hand never swaps with [L] · Side & Aux switch
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#4ade80]">
                  <span>CHASSIS HARDWARE (4)</span>
                  <span className="text-[#38bdf8]">ARMOR</span>
                </div>
                <div className="text-[#94a3b8] truncate mt-0.5">
                  Head · Arms · Frame Plating
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#38bdf8]">
                  <span>UTILITY SLOT (1)</span>
                  <span className={gates.utilitySlotActive ? 'text-[#86efac]' : 'text-[#f59e0b]'}>
                    {gates.utilitySlotActive ? 'ONLINE' : 'LV 6'}
                  </span>
                </div>
                <div className="text-[#cbd5e1] truncate mt-0.5">
                  {getClassUtilityDefinition(state.equipmentSlots?.utility, state.traitLine).name}
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#e2e8f0]">
                  <span>CONTROLS ENGINE</span>
                  <span className="text-[#86efac]">AC1–AC5</span>
                </div>
                <div className="text-[#94a3b8] truncate mt-0.5">
                  X: ac1 · Y: ac2/ac4 · R: ac3/ac5 · L: Lock/Swap
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: LOADOUT & MULTI-SOURCE ACTIONS (Options only displayed when editing the loadout) */}
      {tab === 'weapons' &&
        (() => {
          const activeStance = getActiveWeaponStance(state);
          const resolvedSkills = getResolvedCombatSkills(state);
          const mainGrip = getEffectiveMainGrip(state);
          const slot1Id =
            state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
          const slot2Id = state.equipmentSlots?.slot2 || null;
          const slot3Id = state.equipmentSlots?.slot3 || null;
          const mainWpnDef = getWeaponDefinition(slot1Id);
          const isBowMain = isTwoHandOnlyWeapon(mainWpnDef);

          const currentHeadName =
            state.equipmentSlots?.head || `${trait.frameModel || 'Mark-IV'} Sensor Visor`;
          const currentSensoryAName =
            state.equipmentSlots?.sensoryA || 'Federated T7 Sensor Array';
          const currentSensoryBName =
            state.equipmentSlots?.sensoryB || 'Federated EchoPulse Scanner';
          const currentArmsName =
            state.equipmentSlots?.arms || `${trait.frameModel || 'Mark-IV'} Actuator Vambraces`;
          const currentLegsName =
            state.equipmentSlots?.legs || 'BWI Strider Leg Assembly';
          const currentPlatingName =
            state.equipmentSlots?.plating ||
            `${trait.frameModel || 'Mark-IV'} ${trait.baseArmor.type} Plating`;
          const currentReactorName =
            state.equipmentSlots?.reactorCore || 'PNSY Alchemic Turbine Core Mk.IV';
          const currentAux3Name =
            state.equipmentSlots?.aux3 || 'PNSY R-11 Rockweiler Buckler';
          const currentAux4Name =
            state.equipmentSlots?.aux4 || 'PNSY UF-9 Rough Rider Booster';
          const currentUtilDef = getClassUtilityDefinition(
            state.equipmentSlots?.utility,
            state.traitLine
          );
          const installedRangedMod = ACTION_MODIFICATION_CATALOG.find(
            (m) => m.id === state.equipmentSlots?.installedMods?.ranged
          );
          const installedMeleeMod = ACTION_MODIFICATION_CATALOG.find(
            (m) => m.id === state.equipmentSlots?.installedMods?.melee
          );
          const installedMobilityMod = ACTION_MODIFICATION_CATALOG.find(
            (m) => m.id === state.equipmentSlots?.installedMods?.mobility
          );
          const boundLDesc = getResolvedActionDescriptor(
            state,
            state.assignedActions?.L || 'weapon_skill_1'
          );
          const boundRDesc = getResolvedActionDescriptor(
            state,
            state.assignedActions?.R || 'weapon_skill_2'
          );

          return (
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
              {/* 1. Weapon Action Grid & Active Stance Resolution (ac1..ac5) + Loadout Edit Toggle */}
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <CompositeMechPreviewCanvas
                      state={state}
                      head={currentHeadName}
                      arms={currentArmsName}
                      plating={currentPlatingName}
                      weaponId={slot1Id}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#38bdf8] font-bold text-[10px]">
                          ACTIVE LOADOUT & STANCE:
                        </span>
                        <span className="text-[#ffd27d] font-black text-[9px]">
                          {activeStance.label}
                        </span>
                      </div>
                      <div className="text-[7.5px] text-[#94a3b8]">
                        16×16 4-FRAME COMPOSITE: HEAD ({resolvePlayerSpriteParts(state).headStyle.toUpperCase()}) · ARMS ({resolvePlayerSpriteParts(state).armsStyle.toUpperCase()}) · FRAME PLATING ({resolvePlayerSpriteParts(state).framePlatingStyle.toUpperCase()})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        soundSystem.playSelect();
                        setIsEditingLoadout((prev) => !prev);
                        setLoadoutSubtypeFilter('ALL');
                      }}
                      className={`px-2 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
                        isEditingLoadout
                          ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                          : 'bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] border-[#38bdf8]'
                      }`}
                    >
                      {isEditingLoadout ? '✓ DONE EDITING LOADOUT' : '✎ EDIT LOADOUT'}
                    </button>
                    <button
                      onClick={() => {
                        soundSystem.playSelect();
                        setTab('inventory');
                      }}
                      className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] border border-[#8dd7ad]/60 rounded-xs text-[8px] font-bold text-[#8dd7ad] cursor-pointer"
                    >
                      EQUIPMENT INVENTORY
                    </button>
                    <button
                      onClick={() => {
                        performAuxiliarySwap(
                          state,
                          {
                            say: (txt) => {
                              state.toastText = txt;
                              state.toastTimer = 2.5;
                            },
                          },
                          true
                        );
                      }}
                      className="px-1.5 py-0.5 bg-[#422006]/90 hover:bg-[#713f12] border border-[#f59e0b]/60 rounded-xs text-[8px] font-bold text-[#fbbf24] cursor-pointer"
                    >
                      SWAP SIDE ⇄ AUX [L]
                    </button>
                  </div>
                </div>

                <div className="text-[8px] text-[#cbd5e1]">
                  {activeStance.description} ·{' '}
                  <span className="text-[#94a3b8]">
                    {!slot2Id
                      ? 'No Side Hand equipped → Main Hand is automatically 2H.'
                      : 'Click any slot or EDIT LOADOUT to change equipped items.'}
                  </span>
                </div>

                {/* Canonical grip . ac1 . ac2 . ac3 . ac4 . ac5 . Reference Matrix + Resolved Skills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[7.5px]">
                  <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] font-mono">
                    <div className="text-[#94a3b8] font-bold mb-0.5">
                      GRIP MATRIX (1H / 2H / OFF):
                    </div>
                    <div className="grid grid-cols-6 gap-0.5 text-center font-bold border-b border-[#1e293b] pb-0.5 text-[#38bdf8]">
                      <span>GRIP</span>
                      <span>AC1</span>
                      <span>AC2</span>
                      <span>AC3</span>
                      <span>AC4</span>
                      <span>AC5</span>
                    </div>
                    {[
                      { g: '1h', vals: ['yes', 'yes', 'yes', 'no', 'no'], active: mainGrip === '1h' },
                      { g: '2h', vals: ['yes', 'yes', 'yes', 'yes', 'yes'], active: mainGrip === '2h' },
                      {
                        g: 'off',
                        vals: ['no', 'no', 'no', 'yes', 'yes'],
                        active: Boolean(slot2Id && mainGrip === '1h'),
                      },
                    ].map((row) => (
                      <div
                        key={row.g}
                        className={`grid grid-cols-6 gap-0.5 text-center py-0.2 ${
                          row.active ? 'text-[#ffd27d] font-bold' : 'text-[#64748b]'
                        }`}
                      >
                        <span className="uppercase">{row.g}</span>
                        {row.vals.map((v, i) => (
                          <span
                            key={i}
                            className={
                              v === 'yes'
                                ? row.active
                                  ? 'text-[#4ade80]'
                                  : 'text-[#94a3b8]'
                                : 'text-[#475569]'
                            }
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Resolved ac1..ac5 Live Readout */}
                  <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] space-y-0.5">
                    <div className="text-[#94a3b8] font-bold">
                      RESOLVED 5-ACTION LOADOUT (AC1–AC5):
                    </div>
                    {(
                      [
                        { key: 'AC1 [X]', sk: resolvedSkills.skill1 },
                        { key: 'AC2 [Y TAP]', sk: resolvedSkills.skill2 },
                        { key: 'AC3 [R TAP]', sk: resolvedSkills.skill3 },
                        { key: 'AC4 [Y HOLD]', sk: resolvedSkills.skill4 },
                        { key: 'AC5 [R HOLD]', sk: resolvedSkills.skill5 },
                      ] as const
                    ).map((entry) => (
                      <div
                        key={entry.key}
                        className="flex items-center justify-between gap-1 text-[7.5px]"
                      >
                        <span className="text-[#38bdf8] font-bold shrink-0">{entry.key}:</span>
                        <span
                          className={`truncate font-bold ${
                            entry.sk?.available ? 'text-[#ffd27d]' : 'text-[#64748b]'
                          }`}
                        >
                          {entry.sk?.available
                            ? `${entry.sk.name} (${entry.sk.sourceSlotName})`
                            : 'no (inactive)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Weapon, Auxiliary & Consumable Slots (Compact Summary Cards — No Inline Option Dump) */}
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-bold text-[#94a3b8]">
                  <span>
                    WEAPON, SIDE & AUXILIARY SLOTS
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-[#cbd5e1]">MAIN GRIP:</span>
                    <button
                      disabled={isBowMain || !slot2Id}
                      onClick={() => {
                        soundSystem.playSelect();
                        setMainWeaponGrip(state, '1h', {
                          say: (txt) => {
                            state.toastText = txt;
                            state.toastTimer = 2.5;
                          },
                        });
                        syncStateGates(state);
                        notifyOrionStateChange();
                      }}
                      title={
                        !slot2Id
                          ? 'No Side Hand equipped — Main Hand is automatically 2H'
                          : 'Switch Main Hand to 1H Grip'
                      }
                      className={`px-1.5 py-0.2 rounded-xs text-[7.5px] font-bold border ${
                        mainGrip === '1h'
                          ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                          : isBowMain || !slot2Id
                            ? 'bg-[#0f172a] text-[#475569] border-[#1e293b] cursor-not-allowed'
                            : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#38bdf8] cursor-pointer'
                      }`}
                    >
                      1H GRIP
                    </button>
                    <button
                      onClick={() => {
                        soundSystem.playSelect();
                        setMainWeaponGrip(state, '2h', {
                          say: (txt) => {
                            state.toastText = txt;
                            state.toastTimer = 2.5;
                          },
                        });
                        syncStateGates(state);
                        notifyOrionStateChange();
                      }}
                      className={`px-1.5 py-0.2 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                        mainGrip === '2h'
                          ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                          : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#ffd27d]'
                      }`}
                    >
                      2H POWER STANCE {!slot2Id ? '(AUTO: NO SIDE)' : isBowMain ? '(BOW 2H)' : ''}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {(
                    [
                      {
                        slotIdx: 0,
                        slotKey: 'slot1' as const,
                        label: 'MAIN HAND',
                        sub:
                          mainGrip === '2h'
                            ? '2H Power Stance → ac1–ac5'
                            : '1H Grip → ac1–ac3',
                        wId: slot1Id,
                      },
                      {
                        slotIdx: 1,
                        slotKey: 'slot2' as const,
                        label: 'SIDE HAND',
                        sub: !slot2Id
                          ? 'None Equipped → Main Hand Auto-2H'
                          : 'Off-Hand Weapon / Aux / Consumable',
                        wId: slot2Id || '',
                      },
                      {
                        slotIdx: 2,
                        slotKey: 'slot3' as const,
                        label: 'AUXILIARY',
                        sub: 'Swaps with Side Hand via [L]',
                        wId: slot3Id || '',
                      },
                    ] as const
                  ).map((sInfo) => {
                    const wId = sInfo.wId;
                    const wDef = wId ? getWeaponDefinition(wId) : undefined;
                    const itemDef = wId && !wDef ? getItemDefinition(wId) : undefined;
                    const isEditingThis =
                      isEditingLoadout && editingSlot === sInfo.slotKey;
                    const gemVis = wDef ? getWeaponGemVisuals(state, wId) : null;
                    const stripBase64 =
                      wDef?.variantStripBase64 || wDef?.hardpointSprite?.base64;
                    const subtypeInfo = wDef ? getWeaponSubtypeInfo(wId) : null;
                    const ownedCopies = wDef ? getOwnedWeaponCount(state, wId) : 0;

                    return (
                      <div
                        key={sInfo.slotKey}
                        className={`p-1.5 rounded-xs border transition-colors space-y-1 ${
                          isEditingThis
                            ? 'bg-[#172554]/80 border-[#facc15]'
                            : 'bg-[#0f172a] border-[#1e293b]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[8px] font-bold text-[#ffd27d]">
                            {sInfo.label}
                          </span>
                          <div className="flex items-center gap-1">
                            {sInfo.slotIdx >= 1 && wId && (
                              <button
                                onClick={() => {
                                  soundSystem.playMenuBeep();
                                  if (state.equipmentSlots) {
                                    state.equipmentSlots[sInfo.slotKey] = null;
                                    // Rule: if no side hand is equipped, main hand is automatically 2h
                                    if (!state.equipmentSlots.slot2) {
                                      state.equipmentSlots.mainGrip = '2h';
                                    }
                                  }
                                  state.equippedWeapons = [
                                    state.equipmentSlots?.slot1,
                                    state.equipmentSlots?.slot2,
                                    state.equipmentSlots?.slot3,
                                  ].filter(Boolean) as string[];
                                  syncStateGates(state);
                                  notifyOrionStateChange();
                                }}
                                className="px-1 py-0.2 rounded-xs text-[7px] font-bold bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] border border-[#475569] cursor-pointer"
                              >
                                UNEQUIP
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (isEditingThis) {
                                  setIsEditingLoadout(false);
                                } else {
                                  openSlotEditor(sInfo.slotKey);
                                }
                              }}
                              className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                                isEditingThis
                                  ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                                  : 'bg-[#1e293b] hover:bg-[#334155] text-[#7dd3fc] border-[#38bdf8]/60'
                              }`}
                            >
                              {isEditingThis ? 'EDITING' : 'EDIT'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 bg-[#090d14] px-1.5 py-1 rounded-xs border border-[#1e293b]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {stripBase64 && gemVis && (
                              <SpriteCanvasIcon
                                base64={stripBase64}
                                col={gemVis.colIndex}
                                sizeClass="w-5 h-5"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-[9px] font-bold text-[#ffd27d] truncate">
                                {wDef
                                  ? `${wDef.name}${
                                      sInfo.slotIdx === 0 && mainGrip === '2h' ? ' (2h)' : ''
                                    }`
                                  : itemDef?.name || 'None (Empty)'}
                              </div>
                              <div className="text-[7px] text-[#94a3b8] truncate">
                                {wDef && subtypeInfo
                                  ? `${subtypeInfo.subtype} · Copies: ×${ownedCopies}`
                                  : itemDef
                                    ? `Consumable · Skill 5 when in Side`
                                    : sInfo.sub}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Chassis Hardware, Tactical Utility, Action Mods & Trigger Bindings (Compact Cards — Options Hidden Until Editing) */}
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
                <div className="text-[9px] font-bold text-[#94a3b8]">
                  CHASSIS HARDWARE · REACTOR · AUXILIARY SYSTEMS · TACTICAL UTILITY · ACTION MODS · TRIGGERS
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[8px]">
                  {(
                    [
                      {
                        slot: 'head' as EditableLoadoutSlot,
                        label: 'HEAD OPTICS',
                        val: currentHeadName,
                        sub: 'Hardware · Optics',
                      },
                      {
                        slot: 'sensoryA' as EditableLoadoutSlot,
                        label: 'SENSORY A',
                        val: currentSensoryAName,
                        sub: 'Hardware · Field Monitor',
                      },
                      {
                        slot: 'sensoryB' as EditableLoadoutSlot,
                        label: 'SENSORY B',
                        val: currentSensoryBName,
                        sub: 'Hardware · Threat Scanner',
                      },
                      {
                        slot: 'arms' as EditableLoadoutSlot,
                        label: 'ARMS ACTUATORS',
                        val: currentArmsName,
                        sub: 'Hardware · Arm Assembly',
                      },
                      {
                        slot: 'legs' as EditableLoadoutSlot,
                        label: 'LEGS ACTUATORS',
                        val: currentLegsName,
                        sub: 'Hardware · Leg Assembly',
                      },
                      {
                        slot: 'plating' as EditableLoadoutSlot,
                        label: 'FRAME PLATING',
                        val: currentPlatingName,
                        sub: `Hardware · ${state.armor.type}`,
                      },
                      {
                        slot: 'reactor' as EditableLoadoutSlot,
                        label: 'REACTOR CORE',
                        val: currentReactorName,
                        sub: 'Core System · Generator',
                      },
                      {
                        slot: 'aux3' as EditableLoadoutSlot,
                        label: 'AUX 3 SYSTEM',
                        val: currentAux3Name,
                        sub: 'Defensive / Tactical Aux',
                      },
                      {
                        slot: 'aux4' as EditableLoadoutSlot,
                        label: 'AUX 4 SYSTEM',
                        val: currentAux4Name,
                        sub: 'Mobility / Evasion Aux',
                      },
                      {
                        slot: 'utility' as EditableLoadoutSlot,
                        label: 'UTILITY [ACT 6]',
                        val: currentUtilDef.name,
                        sub: `${currentUtilDef.frameModel} · ${currentUtilDef.shortLabel}`,
                      },
                      {
                        slot: 'mod_ranged' as EditableLoadoutSlot,
                        label: 'RANGED MOD',
                        val: installedRangedMod?.name || 'None Installed',
                        sub: 'Action Mod · Ranged',
                      },
                      {
                        slot: 'mod_melee' as EditableLoadoutSlot,
                        label: 'MELEE MOD',
                        val: installedMeleeMod?.name || 'None Installed',
                        sub: 'Action Mod · Melee',
                      },
                      {
                        slot: 'mod_mobility' as EditableLoadoutSlot,
                        label: 'MOBILITY MOD',
                        val: installedMobilityMod?.name || 'None Installed',
                        sub: 'Action Mod · Mobility',
                      },
                      {
                        slot: 'bind_l' as EditableLoadoutSlot,
                        label: 'TRIGGERS [L / R]',
                        val: `L: ${boundLDesc.shortLabel} · R: ${boundRDesc.shortLabel}`,
                        sub: 'Multi-Source Action Bindings',
                      },
                    ] as const
                  ).map((card) => {
                    const activeEdit =
                      isEditingLoadout &&
                      (editingSlot === card.slot ||
                        (card.slot === 'bind_l' && editingSlot === 'bind_r'));
                    return (
                      <div
                        key={card.slot}
                        className={`p-1.5 rounded-xs border flex flex-col justify-between gap-0.5 ${
                          activeEdit
                            ? 'bg-[#172554]/80 border-[#facc15]'
                            : 'bg-[#0f172a] border-[#1e293b]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[7.5px] text-[#38bdf8] truncate">
                            {card.label}
                          </span>
                          <button
                            onClick={() => {
                              if (activeEdit) setIsEditingLoadout(false);
                              else openSlotEditor(card.slot);
                            }}
                            className={`px-1 py-0.2 rounded-xs text-[6.5px] font-bold border cursor-pointer shrink-0 ${
                              activeEdit
                                ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                                : 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] border-[#475569]'
                            }`}
                          >
                            {activeEdit ? 'EDITING' : 'EDIT'}
                          </button>
                        </div>
                        <div className="font-bold text-[#ffd27d] truncate text-[8.5px]">
                          {card.val}
                        </div>
                        <div className="text-[7px] text-[#94a3b8] truncate">{card.sub}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. ON-DEMAND LOADOUT EDITOR PANEL (Only displayed when isEditingLoadout is true!) */}
              {isEditingLoadout && (
                <div className="p-2 bg-[#0b111e] rounded-xs border border-[#facc15] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#1e293b] pb-1">
                    <div className="text-[9.5px] font-bold text-[#facc15]">
                      LOADOUT EDITOR — SELECT SLOT & SUBTYPE TO EQUIP:
                    </div>
                    <button
                      onClick={() => {
                        soundSystem.playMenuBeep();
                        setIsEditingLoadout(false);
                      }}
                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#facc15] border border-[#facc15]/60 rounded-xs text-[8px] font-bold cursor-pointer"
                    >
                      ✕ CLOSE EDITOR
                    </button>
                  </div>

                  {/* Slot Selector Strip */}
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        { id: 'slot1', label: 'Main Hand' },
                        { id: 'slot2', label: 'Side Hand' },
                        { id: 'slot3', label: 'Auxiliary' },
                        { id: 'head', label: 'Head Optics' },
                        { id: 'sensoryA', label: 'Sensory A' },
                        { id: 'sensoryB', label: 'Sensory B' },
                        { id: 'arms', label: 'Arms Actuators' },
                        { id: 'legs', label: 'Legs Actuators' },
                        { id: 'plating', label: 'Frame Plating' },
                        { id: 'reactor', label: 'Reactor Core' },
                        { id: 'aux3', label: 'Aux 3 System' },
                        { id: 'aux4', label: 'Aux 4 System' },
                        { id: 'utility', label: 'Utility [Act 6]' },
                        { id: 'mod_ranged', label: 'Ranged Mod' },
                        { id: 'mod_melee', label: 'Melee Mod' },
                        { id: 'mod_mobility', label: 'Mobility Mod' },
                        { id: 'bind_l', label: 'Bindings [L/R]' },
                      ] as Array<{ id: EditableLoadoutSlot; label: string }>
                    ).map((sTab) => (
                      <button
                        key={sTab.id}
                        onClick={() => {
                          soundSystem.playSelect();
                          setEditingSlot(sTab.id);
                          setLoadoutSubtypeFilter('ALL');
                        }}
                        className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                          editingSlot === sTab.id
                            ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                            : 'bg-[#090d14] text-[#94a3b8] border-[#334155] hover:border-[#38bdf8]'
                        }`}
                      >
                        {sTab.label}
                      </button>
                    ))}
                  </div>

                  {/* A. Editing Main Hand / Side Hand / Auxiliary */}
                  {(editingSlot === 'slot1' ||
                    editingSlot === 'slot2' ||
                    editingSlot === 'slot3') &&
                    (() => {
                      const subtypeTabs =
                        editingSlot === 'slot1'
                          ? [
                              'ALL',
                              'Ranged · Bolter / Ballista',
                              'Ranged · Gatling / Ordnance',
                              'Ranged · Beam / Pulse',
                              'Ranged · SMG / Marksman',
                              'Ranged · Boltcaster',
                              'Ranged · 2H Bow',
                              'Melee · Blade',
                              'Melee · Blunt / Cleave',
                              'Melee · Polearm / Lance',
                            ]
                          : [
                              'ALL',
                              'Ranged · Bolter / Ballista',
                              'Ranged · Gatling / Ordnance',
                              'Ranged · Beam / Pulse',
                              'Ranged · SMG / Marksman',
                              'Ranged · Boltcaster',
                              'Melee · Blade',
                              'Melee · Blunt / Cleave',
                              'Melee · Polearm / Lance',
                              'Auxiliary · Shield',
                              'Auxiliary · Quiver',
                              'Auxiliary · Catalyst',
                              'Consumable',
                            ];

                      const activeSlotId =
                        editingSlot === 'slot1'
                          ? slot1Id
                          : editingSlot === 'slot2'
                            ? slot2Id
                            : slot3Id;

                      return (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[7.5px] text-[#94a3b8] font-bold">
                              SUBTYPE FILTER:
                            </span>
                            {subtypeTabs.map((st) => (
                              <button
                                key={st}
                                onClick={() => setLoadoutSubtypeFilter(st)}
                                className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                                  loadoutSubtypeFilter === st
                                    ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                                    : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b]'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {Object.values(WEAPON_REGISTRY)
                              .filter((candidate) => {
                                const unlocked =
                                  isCheatMode ||
                                  isEquipmentUnlocked(state, candidate.id) ||
                                  activeSlotId === candidate.id;
                                if (!unlocked) return false;
                                if (editingSlot === 'slot1' && !isTrueWeaponEquipment(candidate)) {
                                  return false;
                                }
                                if (editingSlot === 'slot2' && isTwoHandOnlyWeapon(candidate)) {
                                  return false;
                                }
                                const stInfo = getWeaponSubtypeInfo(candidate.id);
                                if (
                                  loadoutSubtypeFilter !== 'ALL' &&
                                  stInfo.subtype !== loadoutSubtypeFilter
                                ) {
                                  return false;
                                }
                                return true;
                              })
                              .map((candidate) => {
                                const candGemVis = getWeaponGemVisuals(state, candidate.id);
                                const candStrip =
                                  candidate.variantStripBase64 ||
                                  candidate.hardpointSprite?.base64;
                                const stInfo = getWeaponSubtypeInfo(candidate.id);
                                const copies = getOwnedWeaponCount(state, candidate.id);
                                const isEquippedHere = activeSlotId === candidate.id;

                                return (
                                  <div
                                    key={candidate.id}
                                    className={`p-1.5 rounded-xs border flex items-center justify-between gap-1.5 ${
                                      isEquippedHere
                                        ? 'bg-[#172554]/80 border-[#ffd27d]'
                                        : 'bg-[#090d14] border-[#1e293b]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <SpriteCanvasIcon
                                        base64={candStrip}
                                        col={candGemVis.colIndex}
                                        sizeClass="w-4 h-4"
                                      />
                                      <div className="min-w-0">
                                        <div className="text-[8.5px] font-bold text-[#e2e8f0] truncate flex items-center gap-1">
                                          <span>{candidate.name} (×{copies})</span>
                                          {candidate.isPlaceholderAsset && (
                                            <span
                                              className="text-[6px] px-1 py-0.2 bg-[#334155]/60 text-[#fbbf24] border border-[#fbbf24]/40 rounded-[2px] shrink-0"
                                              title={candidate.futureAssetPlanned || 'Placeholder visual asset: dedicated sprite planned'}
                                            >
                                              PLCH
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[7px] text-[#94a3b8] truncate">
                                          {stInfo.subtype} · {(candidate.weightClass || 'medium').toUpperCase()}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => {
                                          if (!state.equipmentSlots) return;
                                          soundSystem.playSelect();
                                          if (editingSlot === 'slot1') {
                                            state.equipmentSlots.slot1 = candidate.id;
                                            if (isTwoHandOnlyWeapon(candidate)) {
                                              if (
                                                state.equipmentSlots.slot2 &&
                                                !state.equipmentSlots.slot3
                                              ) {
                                                state.equipmentSlots.slot3 =
                                                  state.equipmentSlots.slot2;
                                              }
                                              state.equipmentSlots.slot2 = null;
                                              state.equipmentSlots.mainGrip = '2h';
                                            } else if (!state.equipmentSlots.slot2) {
                                              state.equipmentSlots.mainGrip = '2h';
                                            }
                                            state.maxAmmo = candidate.shotsPerChain;
                                            state.ammo = candidate.shotsPerChain;
                                            state.reloadDuration = candidate.reloadDurationSec;
                                          } else if (editingSlot === 'slot2') {
                                            if (
                                              candidate.id === slot1Id &&
                                              isTrueWeaponEquipment(candidate) &&
                                              copies < 2
                                            ) {
                                              setMainWeaponGrip(state, '2h', {
                                                say: (txt) => {
                                                  state.toastText = `${txt} (ACQUIRE 2ND COPY FOR 1H PAIRED STANCE)`;
                                                  state.toastTimer = 2.8;
                                                },
                                              });
                                            } else {
                                              state.equipmentSlots.slot2 = candidate.id;
                                              if (!isTwoHandOnlyWeapon(slot1Id)) {
                                                state.equipmentSlots.mainGrip = '1h';
                                              }
                                            }
                                          } else {
                                            state.equipmentSlots.slot3 = candidate.id;
                                          }
                                          state.equippedWeapons = [
                                            state.equipmentSlots.slot1,
                                            state.equipmentSlots.slot2,
                                            state.equipmentSlots.slot3,
                                          ].filter(Boolean) as string[];
                                          syncStateGates(state);
                                          notifyOrionStateChange();
                                        }}
                                        className={`px-2 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                                          isEquippedHere
                                            ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                                            : 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] border-[#475569]'
                                        }`}
                                      >
                                        {isEquippedHere ? 'EQUIPPED' : 'EQUIP'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                            {/* Consumable options when editing Side Hand or Auxiliary */}
                            {editingSlot !== 'slot1' &&
                              (loadoutSubtypeFilter === 'ALL' ||
                                loadoutSubtypeFilter === 'Consumable') &&
                              consolidateInventorySlots(state.inventorySlots)
                                .filter((s) => Boolean(getItemDefinition(s.itemId)?.onUse))
                                .map((invSlot) => {
                                  const itmDef = getItemDefinition(invSlot.itemId);
                                  if (!itmDef) return null;
                                  const isEquippedHere = activeSlotId === invSlot.itemId;
                                  return (
                                    <div
                                      key={invSlot.itemId}
                                      className={`p-1.5 rounded-xs border flex items-center justify-between gap-1.5 ${
                                        isEquippedHere
                                          ? 'bg-[#052e16]/80 border-[#4ade80]'
                                          : 'bg-[#090d14] border-[#1e293b]'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="text-[8.5px] font-bold text-[#86efac] truncate">
                                          {itmDef.name} (×{invSlot.count})
                                        </div>
                                        <div className="text-[7px] text-[#94a3b8] truncate">
                                          Consumable · Occupies Skill 5 when in Side Hand
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          if (!state.equipmentSlots) return;
                                          soundSystem.playSelect();
                                          state.equipmentSlots[editingSlot] = invSlot.itemId;
                                          if (
                                            editingSlot === 'slot2' &&
                                            !isTwoHandOnlyWeapon(slot1Id)
                                          ) {
                                            state.equipmentSlots.mainGrip = '1h';
                                          }
                                          state.equippedWeapons = [
                                            state.equipmentSlots.slot1,
                                            state.equipmentSlots.slot2,
                                            state.equipmentSlots.slot3,
                                          ].filter(Boolean) as string[];
                                          syncStateGates(state);
                                          notifyOrionStateChange();
                                        }}
                                        className={`px-2 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer shrink-0 ${
                                          isEquippedHere
                                            ? 'bg-[#4ade80] text-[#05070a] border-[#86efac]'
                                            : 'bg-[#1e293b] hover:bg-[#334155] text-[#86efac] border-[#4ade80]/60'
                                        }`}
                                      >
                                        {isEquippedHere ? 'EQUIPPED' : 'EQUIP'}
                                      </button>
                                    </div>
                                  );
                                })}
                          </div>
                        </div>
                      );
                    })()}

                  {/* B. Editing Chassis Hardware (Head Optics, Sensory A/B, Arms, Legs, Coreplate, Reactor, Aux 3/4) */}
                  {(editingSlot === 'head' ||
                    editingSlot === 'sensoryA' ||
                    editingSlot === 'sensoryB' ||
                    editingSlot === 'arms' ||
                    editingSlot === 'legs' ||
                    editingSlot === 'plating' ||
                    editingSlot === 'reactor' ||
                    editingSlot === 'aux3' ||
                    editingSlot === 'aux4') && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {CHASSIS_HARDWARE_CATALOG.filter((h) => h.slot === editingSlot).map((hw) => {
                        const curVal =
                          editingSlot === 'head'
                            ? currentHeadName
                            : editingSlot === 'sensoryA'
                              ? currentSensoryAName
                              : editingSlot === 'sensoryB'
                                ? currentSensoryBName
                                : editingSlot === 'arms'
                                  ? currentArmsName
                                  : editingSlot === 'legs'
                                    ? currentLegsName
                                    : editingSlot === 'plating'
                                      ? currentPlatingName
                                      : editingSlot === 'reactor'
                                        ? currentReactorName
                                        : editingSlot === 'aux3'
                                          ? currentAux3Name
                                          : currentAux4Name;
                        const isEquipped =
                          curVal === hw.name ||
                          Boolean(hw.legacyNames?.includes(curVal));
                        return (
                          <div
                            key={hw.id}
                            className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                              isEquipped
                                ? 'bg-[#172554]/80 border-[#38bdf8]'
                                : 'bg-[#090d14] border-[#1e293b]'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-[8.5px] text-[#ffd27d] flex items-center justify-between gap-1">
                                <span>{hw.name}</span>
                                {hw.isPlaceholderAsset && (
                                  <span
                                    className="text-[6px] px-1 py-0.2 bg-[#334155]/60 text-[#fbbf24] border border-[#fbbf24]/40 rounded-[2px]"
                                    title={hw.futureAssetPlanned || 'Placeholder visual asset: dedicated sprite planned'}
                                  >
                                    PLCH
                                  </span>
                                )}
                              </div>
                              <div className="text-[7px] text-[#38bdf8]">{hw.subtype}</div>
                              <div className="text-[7.5px] text-[#94a3b8] mt-0.5">
                                {hw.description}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (!state.equipmentSlots) return;
                                soundSystem.playSelect();
                                if (editingSlot === 'reactor') {
                                  state.equipmentSlots.reactorCore = hw.name;
                                } else {
                                  state.equipmentSlots[editingSlot] = hw.name;
                                }
                                if (editingSlot === 'plating' && hw.armorType) {
                                  state.armor.type = hw.armorType;
                                }
                                notifyOrionStateChange();
                              }}
                              className={`w-full py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                                isEquipped
                                  ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                                  : 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] border-[#475569]'
                              }`}
                            >
                              {isEquipped ? 'EQUIPPED' : 'EQUIP HARDWARE'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* C. Editing Tactical Utility Slot (Action 6 — Classless, open to all pilots) */}
                  {editingSlot === 'utility' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {CLASS_UTILITY_CATALOG.map((u) => {
                        const isSelected = currentUtilDef.id === u.id;
                        return (
                          <div
                            key={u.id}
                            className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                              isSelected
                                ? 'bg-[#052e16]/80 border-[#4ade80]'
                                : 'bg-[#090d14] border-[#1e293b]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[8.5px] text-[#ffd27d]">
                                  {u.name}
                                </span>
                                <span className="text-[7px] text-[#38bdf8]">{u.frameModel}</span>
                              </div>
                              <div className="text-[7.5px] text-[#94a3b8] mt-0.5">
                                {u.description}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                soundSystem.playSelect();
                                if (state.equipmentSlots) {
                                  state.equipmentSlots.utility = u.id;
                                  notifyOrionStateChange();
                                }
                              }}
                              className={`w-full py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                                isSelected
                                  ? 'bg-[#4ade80] text-[#05070a] border-[#86efac]'
                                  : 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] border-[#475569]'
                              }`}
                            >
                              {isSelected ? 'EQUIPPED' : 'EQUIP UTILITY'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* D. Editing Action Modifications (Ranged / Melee / Mobility) */}
                  {(editingSlot === 'mod_ranged' ||
                    editingSlot === 'mod_melee' ||
                    editingSlot === 'mod_mobility') &&
                    (() => {
                      const targetCat =
                        editingSlot === 'mod_ranged'
                          ? 'ranged'
                          : editingSlot === 'mod_melee'
                            ? 'melee'
                            : 'mobility';
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {ACTION_MODIFICATION_CATALOG.filter(
                            (m) =>
                              m.targetCategory === targetCat ||
                              (targetCat === 'ranged' && m.targetCategory === 'all')
                          ).map((mod) => {
                            const unlockedMods = state.equipmentSlots?.unlockedMods || [];
                            const isGenerated =
                              unlockedMods.includes(mod.id) || Boolean(state.bypassProgressionGates);
                            const isInstalled =
                              state.equipmentSlots?.installedMods?.[targetCat] === mod.id;
                            const costText = mod.gemCost
                              .map((c) => {
                                const g = GEMSTONE_REGISTRY[c.gemId];
                                const have = getInventoryGemCount(state, c.gemId);
                                return `${c.count} ${g?.name || c.gemId} (${have})`;
                              })
                              .join(' + ');

                            return (
                              <div
                                key={mod.id}
                                className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                                  isInstalled
                                    ? 'bg-[#2e1065]/70 border-[#c084fc]'
                                    : 'bg-[#090d14] border-[#1e293b]'
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-[8.5px] text-[#e2e8f0]">
                                    {mod.name} [{mod.targetCategory.toUpperCase()}]
                                  </div>
                                  <div className="text-[7.5px] text-[#86efac]">
                                    + {mod.gainDescription}
                                  </div>
                                  <div className="text-[7.5px] text-[#f87171]">
                                    − {mod.drawbackDescription}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e293b]">
                                  <span className="text-[7px] text-[#94a3b8]">
                                    {isGenerated ? 'Retained in Inventory' : `Cost: ${costText}`}
                                  </span>
                                  {isGenerated ? (
                                    <button
                                      onClick={() => {
                                        soundSystem.playSelect();
                                        if (!state.equipmentSlots) return;
                                        state.equipmentSlots.installedMods =
                                          state.equipmentSlots.installedMods || {};
                                        if (isInstalled) {
                                          delete state.equipmentSlots.installedMods[targetCat];
                                        } else {
                                          state.equipmentSlots.installedMods[targetCat] = mod.id;
                                        }
                                        notifyOrionStateChange();
                                      }}
                                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#c084fc] rounded-xs text-[7.5px] font-bold text-[#e9d5ff] cursor-pointer"
                                    >
                                      {isInstalled ? 'UNINSTALL' : 'INSTALL MOD'}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const ok = generateEquipmentModWithGems(state, mod.id, {
                                          say: (txt) => {
                                            state.toastText = txt;
                                            state.toastTimer = 2.6;
                                          },
                                        });
                                        if (ok) {
                                          soundSystem.playPowerup();
                                          if (state.equipmentSlots) {
                                            state.equipmentSlots.installedMods =
                                              state.equipmentSlots.installedMods || {};
                                            state.equipmentSlots.installedMods[targetCat] = mod.id;
                                          }
                                        } else {
                                          soundSystem.playMenuBeep();
                                        }
                                        notifyOrionStateChange();
                                      }}
                                      className="px-2 py-0.5 bg-[#4c1d95] hover:bg-[#5b21b6] border border-[#a855f7] rounded-xs text-[7.5px] font-bold text-white cursor-pointer"
                                    >
                                      ◆ GENERATE & INSTALL
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                  {/* E. Editing Multi-Source Trigger Action Bindings ([L] / [R]) */}
                  {(editingSlot === 'bind_l' || editingSlot === 'bind_r') && (
                    <div className="space-y-1 max-h-[210px] overflow-y-auto pr-1">
                      {ASSIGNABLE_ACTION_CATALOG.map((catalogItem) => {
                        const resolved = getResolvedActionDescriptor(state, catalogItem.id);
                        const unlockInfo = isActionUnlocked(state, catalogItem.id);
                        const isAssignedL =
                          (state.assignedActions?.L || 'weapon_skill_1') === catalogItem.id;
                        const isAssignedR =
                          (state.assignedActions?.R || 'weapon_skill_2') === catalogItem.id;

                        return (
                          <div
                            key={catalogItem.id}
                            className={`p-1.5 bg-[#090d14] rounded-xs border flex items-center justify-between gap-2 ${
                              unlockInfo.unlocked
                                ? 'border-[#1e293b]'
                                : 'border-[#334155]/40 opacity-60'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                                {resolved.name}{' '}
                                <span className="text-[7px] text-[#38bdf8]">
                                  [{resolved.sourceCategory.toUpperCase()}]
                                </span>
                              </div>
                              <div className="text-[7.5px] text-[#94a3b8] truncate">
                                {resolved.description}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  soundSystem.playSelect();
                                  assignTriggerAction(state, 'L', catalogItem.id);
                                }}
                                className={`px-1.5 py-0.5 rounded-xs font-bold text-[7.5px] border cursor-pointer ${
                                  isAssignedL
                                    ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                                    : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                                }`}
                              >
                                {isAssignedL ? 'BOUND [L]' : 'BIND L'}
                              </button>
                              <button
                                onClick={() => {
                                  soundSystem.playSelect();
                                  assignTriggerAction(state, 'R', catalogItem.id);
                                }}
                                className={`px-1.5 py-0.5 rounded-xs font-bold text-[7.5px] border cursor-pointer ${
                                  isAssignedR
                                    ? 'bg-[#c084fc] text-[#05070a] border-[#e879f9]'
                                    : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                                }`}
                              >
                                {isAssignedR ? 'BOUND [R]' : 'BIND R'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

      {/* Tab: EQUIPMENT INVENTORY & SATCHEL (All Equipment Types & Subtypes) */}
      {tab === 'inventory' &&
        (() => {
          const subtypeOptionsByCat: Record<EquipmentInventoryCategory, string[]> = {
            all: ['ALL'],
            weapon: [
              'ALL',
              'Ranged · Bolter / Ballista',
              'Ranged · Gatling / Ordnance',
              'Ranged · Beam / Pulse',
              'Ranged · SMG / Marksman',
              'Ranged · Boltcaster',
              'Ranged · 2H Bow',
              'Melee · Blade',
              'Melee · Blunt / Cleave',
              'Melee · Polearm / Lance',
            ],
            auxiliary: ['ALL', 'Auxiliary · Shield', 'Auxiliary · Quiver', 'Auxiliary · Catalyst'],
            hardware: [
              'ALL',
              'head',
              'sensoryA',
              'sensoryB',
              'arms',
              'legs',
              'plating',
              'reactor',
              'aux3',
              'aux4',
            ],
            utility: ['ALL'],
            mod: ['ALL', 'ranged', 'melee', 'mobility'],
            consumable: ['ALL', 'consumable', 'gemstone', 'relic'],
          };
          const activeSubtypes = subtypeOptionsByCat[invCategory] || ['ALL'];

          return (
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
              {/* Equipment Inventory Category & Subtype Filter Header */}
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-[#8dd7ad]">
                    EQUIPMENT INVENTORY (WEAPONS · AUXILIARIES · HARDWARE · TACTICAL UTILITIES · MODS · SATCHEL):
                  </span>
                  {isCheatMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          soundSystem.playPowerup();
                          for (const flaskId of [
                            'grail_water',
                            'demantoid_flask',
                            'spinel_flask',
                            'carnelian_flask',
                            'titanite_flask',
                            'kyanite_flask',
                            'charoite_flask',
                            'rubellite_flask',
                            'hematite_flask',
                          ]) {
                            addOrionInventoryItem(state, flaskId, 1);
                          }
                          state.toastText = 'ADDED +1 OF ALL 9 GEMSTONE BELT FLASKS TO SATCHEL';
                          state.toastTimer = 2.5;
                          notifyOrionStateChange();
                        }}
                        className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#8dd7ad]/60 rounded-xs font-bold text-[7.5px] text-[#8dd7ad] cursor-pointer"
                      >
                        +1 ALL FLASKS
                      </button>
                      <button
                        onClick={() => {
                          soundSystem.playPowerup();
                          for (const relicId of [
                            'rusted_gate_key',
                            'sanctum_lock',
                            'bedivere_ring',
                            'bedivere_list',
                            'bedivere_relic',
                          ]) {
                            addOrionInventoryItem(state, relicId, 1);
                          }
                          state.toastText = 'ADDED RELICS & KEYS TO SATCHEL';
                          state.toastTimer = 2.5;
                          notifyOrionStateChange();
                        }}
                        className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#ffd27d]/60 rounded-xs font-bold text-[7.5px] text-[#ffd27d] cursor-pointer"
                      >
                        +1 RELICS & KEYS
                      </button>
                    </div>
                  )}
                </div>

                {/* Primary Equipment Type Filter */}
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      { id: 'all', label: 'All Equipment' },
                      { id: 'weapon', label: 'Weapons' },
                      { id: 'auxiliary', label: 'Auxiliaries' },
                      { id: 'hardware', label: 'Chassis Hardware' },
                      { id: 'utility', label: 'Tactical Utilities' },
                      { id: 'mod', label: 'Action Mods' },
                      { id: 'consumable', label: 'Consumables & Satchel' },
                    ] as Array<{ id: EquipmentInventoryCategory; label: string }>
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        soundSystem.playSelect();
                        setInvCategory(cat.id);
                        setInvSubtype('ALL');
                      }}
                      className={`px-2 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
                        invCategory === cat.id
                          ? 'bg-[#8dd7ad] text-[#05070a] border-[#6ee7b7]'
                          : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#8dd7ad]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Subtype Filter */}
                {activeSubtypes.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[7.5px] text-[#94a3b8] font-bold">SUBTYPE:</span>
                    {activeSubtypes.map((st) => (
                      <button
                        key={st}
                        onClick={() => setInvSubtype(st)}
                        className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                          invSubtype === st
                            ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                            : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b]'
                        }`}
                      >
                        {st.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 1. Owned Weapons & Auxiliaries Inventory */}
              {(invCategory === 'all' ||
                invCategory === 'weapon' ||
                invCategory === 'auxiliary') && (
                <div className="space-y-1">
                  <div className="text-[8.5px] font-bold text-[#ffd27d]">
                    OWNED WEAPONS & AUXILIARIES INVENTORY:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {Object.values(WEAPON_REGISTRY)
                      .filter((w) => {
                        const unlocked = isCheatMode || isEquipmentUnlocked(state, w.id);
                        if (!unlocked) return false;
                        const isAux = isAuxiliaryEquipment(w);
                        if (invCategory === 'weapon' && isAux) return false;
                        if (invCategory === 'auxiliary' && !isAux) return false;
                        const stInfo = getWeaponSubtypeInfo(w.id);
                        if (invSubtype !== 'ALL' && stInfo.subtype !== invSubtype) return false;
                        return true;
                      })
                      .map((w) => {
                        const stInfo = getWeaponSubtypeInfo(w.id);
                        const copies = getOwnedWeaponCount(state, w.id);
                        const gemVis = getWeaponGemVisuals(state, w.id);
                        const strip = w.variantStripBase64 || w.hardpointSprite?.base64;
                        const inMain = state.equipmentSlots?.slot1 === w.id;
                        const inSide = state.equipmentSlots?.slot2 === w.id;
                        const inAux = state.equipmentSlots?.slot3 === w.id;

                        return (
                          <div
                            key={w.id}
                            className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <SpriteCanvasIcon
                                base64={strip}
                                col={gemVis.colIndex}
                                sizeClass="w-4 h-4"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-[9px] text-[#ffd27d] truncate">
                                  {w.name} <span className="text-[#94a3b8]">×{copies}</span>
                                </div>
                                <div className="text-[7.5px] text-[#7dd3fc] truncate">
                                  {stInfo.subtype} · {(w.weightClass || 'medium').toUpperCase()}
                                  {inMain ? ' · [MAIN]' : ''}
                                  {inSide ? ' · [SIDE]' : ''}
                                  {inAux ? ' · [AUX]' : ''}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                openSlotEditor(isAuxiliaryEquipment(w) ? 'slot2' : 'slot1')
                              }
                              className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                            >
                              EDIT IN LOADOUT
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 2. Chassis Hardware, Tactical Utilities & Retained Action Mods Inventory */}
              {(invCategory === 'all' ||
                invCategory === 'hardware' ||
                invCategory === 'utility' ||
                invCategory === 'mod') && (
                <div className="space-y-1">
                  <div className="text-[8.5px] font-bold text-[#38bdf8]">
                    CHASSIS HARDWARE, TACTICAL UTILITIES & ACTION MODS INVENTORY:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {(invCategory === 'all' || invCategory === 'hardware') &&
                      CHASSIS_HARDWARE_CATALOG.filter(
                        (hw) => invSubtype === 'ALL' || hw.slot === invSubtype
                      ).map((hw) => (
                        <div
                          key={hw.id}
                          className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate flex items-center gap-1">
                              <span>{hw.name}</span>
                              {hw.isPlaceholderAsset && (
                                <span
                                  className="text-[6px] px-1 py-0.2 bg-[#334155]/60 text-[#fbbf24] border border-[#fbbf24]/40 rounded-[2px] shrink-0"
                                  title={hw.futureAssetPlanned || 'Placeholder visual asset: dedicated sprite planned'}
                                >
                                  PLCH
                                </span>
                              )}
                            </div>
                            <div className="text-[7px] text-[#94a3b8] truncate">
                              Hardware · {hw.slot.toUpperCase()} · {hw.subtype}
                            </div>
                          </div>
                          <button
                            onClick={() => openSlotEditor(hw.slot)}
                            className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                          >
                            EDIT IN LOADOUT
                          </button>
                        </div>
                      ))}

                    {(invCategory === 'all' || invCategory === 'utility') &&
                      CLASS_UTILITY_CATALOG.map((u) => (
                        <div
                          key={u.id}
                          className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[8.5px] text-[#4ade80] truncate">
                              {u.name}
                            </div>
                            <div className="text-[7px] text-[#94a3b8] truncate">
                              Tactical Utility · {u.frameModel}
                            </div>
                          </div>
                          <button
                            onClick={() => openSlotEditor('utility')}
                            className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#4ade80] border border-[#4ade80]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                          >
                            EDIT IN LOADOUT
                          </button>
                        </div>
                      ))}

                    {(invCategory === 'all' || invCategory === 'mod') &&
                      ACTION_MODIFICATION_CATALOG.filter((m) => {
                        const retained =
                          (state.equipmentSlots?.unlockedMods || []).includes(m.id) ||
                          Boolean(state.bypassProgressionGates);
                        if (!retained && invCategory === 'all') return false;
                        if (invSubtype !== 'ALL' && m.targetCategory !== invSubtype) return false;
                        return true;
                      }).map((m) => (
                        <div
                          key={m.id}
                          className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[8.5px] text-[#c084fc] truncate">
                              {m.name}
                            </div>
                            <div className="text-[7px] text-[#94a3b8] truncate">
                              Action Mod · {m.targetCategory.toUpperCase()}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              openSlotEditor(
                                m.targetCategory === 'melee'
                                  ? 'mod_melee'
                                  : m.targetCategory === 'mobility'
                                    ? 'mod_mobility'
                                    : 'mod_ranged'
                              )
                            }
                            className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#c084fc] border border-[#c084fc]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                          >
                            EDIT IN LOADOUT
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 3. Consumables, Gemstones & Relics Satchel */}
              {(invCategory === 'all' || invCategory === 'consumable') && (
                <div className="space-y-1">
                  <div className="text-[8.5px] font-bold text-[#8dd7ad]">
                    SALVAGED CONSUMABLES, GEMSTONES & RELICS:
                  </div>
                  {state.inventorySlots.length === 0 ? (
                    <div className="text-center text-[#64748b] py-4 italic">
                      No salvage in satchel. Explore drop-pod marshlands and loot caches.
                    </div>
                  ) : (
                    consolidateInventorySlots(state.inventorySlots)
                      .filter((slot) => {
                        const def = getItemDefinition(slot.itemId);
                        if (!def) return false;
                        const isGem = slot.itemId in GEMSTONE_REGISTRY;
                        const cat = isGem ? 'gemstone' : def.category;
                        if (invCategory === 'consumable' && invSubtype !== 'ALL' && cat !== invSubtype) {
                          return false;
                        }
                        return true;
                      })
                      .map((slot, idx) => {
                        const def = getItemDefinition(slot.itemId);
                        if (!def) return null;
                        const isGem = slot.itemId in GEMSTONE_REGISTRY;
                        return (
                          <div
                            key={`${slot.itemId}-${idx}`}
                            className="flex items-center justify-between p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b]"
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="font-bold text-[#ffd27d] flex items-center gap-1.5 flex-wrap">
                                {def.iconSprite?.base64 ? (
                                  <SpriteCanvasIcon
                                    base64={def.iconSprite.base64}
                                    col={def.iconSprite.col || 0}
                                    sizeClass="w-4 h-4"
                                  />
                                ) : (
                                  <span className="text-[#38bdf8]">◆</span>
                                )}
                                <span>{def.name}</span>
                                <span className="text-[#94a3b8]">×{slot.count}</span>
                                <span className="text-[8px] text-[#94a3b8]">
                                  · {isGem ? 'gemstone' : def.category}
                                </span>
                              </div>
                              <div className="text-[8.5px] text-[#94a3b8]">{def.description}</div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {isGem && (
                                <button
                                  onClick={() => {
                                    soundSystem.playSelect();
                                    setTab('progression');
                                  }}
                                  className="px-1.5 py-1 bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] font-bold rounded-xs border border-[#38bdf8]/60 text-[8px] cursor-pointer"
                                >
                                  SKILLS / FEATS
                                </button>
                              )}
                              {def.category === 'consumable' && (
                                <button
                                  onClick={() => openSlotEditor('slot2')}
                                  className="px-1.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#86efac] font-bold rounded-xs border border-[#4ade80]/50 text-[8px] cursor-pointer"
                                >
                                  EQUIP IN LOADOUT
                                </button>
                              )}
                              {def.onUse && (
                                <button
                                  onClick={() => handleUseItem(slot.itemId)}
                                  className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] font-bold rounded-xs border border-[#475569] text-[8.5px] cursor-pointer"
                                >
                                  USE
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          );
        })()}

      {/* Tab: SKILLS, GEMS & (WHEN IN CHEAT ROOM) MULTI-DOMAIN STATE GATES */}
      {tab === 'progression' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
          {isCheatMode && (
            <>
              {/* Multi-Domain State & Gate Controller (Gated behind Drop-Pod Cheat Room) */}
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
                <div className="text-[#38bdf8] font-bold text-[10px] flex items-center justify-between">
                  <span>DROP-POD CHEAT ROOM — STATE & GATE CONTROLLER</span>
                  <span className="text-[8.5px] text-[#94a3b8]">DEV CONSOLE</span>
                </div>

                {/* Gate 1: Tutorial State Isolation */}
                <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
                  <div>
                    <div className="font-bold text-[#e2e8f0] text-[9.5px]">
                      TUTORIAL STATE ({state.tutorialActive ? 'ACTIVE' : 'OFF · STANDARD WORLD'})
                    </div>
                    <div className="text-[8.5px] text-[#94a3b8]">
                      {state.tutorialActive
                        ? TUTORIAL_STEP_DESCRIPTORS[state.tutorialStep as TutorialStepId]?.objective || state.tutorialStep
                        : 'Areas act as standard gameworld zones without tutorial overrides.'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundSystem.playSelect();
                      setTutorialStateActive(state, !state.tutorialActive);
                    }}
                    className={`px-2 py-0.5 rounded-xs font-bold text-[9px] cursor-pointer shrink-0 ml-2 ${
                      state.tutorialActive
                        ? 'bg-[#4f46e5] text-white border border-[#818cf8]'
                        : 'bg-[#1e293b] text-[#94a3b8] border border-[#475569]'
                    }`}
                  >
                    {state.tutorialActive ? 'TUTORIAL ON' : 'STANDARD'}
                  </button>
                </div>

                {/* Gate 2: Level Progression & Sandbox Gate Bypass */}
                <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
                  <div>
                    <div className="font-bold text-[#ffd27d] text-[9.5px]">
                      PROGRESSION LEVEL GATE: LVL {state.level} / 20
                    </div>
                    <div className="text-[8.5px] text-[#94a3b8]">
                      Hardpoints: {gates.maxWeaponSlots} · Skills: [{gates.unlockedSkillSlots.join(',')}] · Feats: {gates.featSlots}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        soundSystem.playMenuBeep();
                        state.level = Math.max(1, state.level - 1);
                        syncStateGates(state);
                        notifyOrionStateChange();
                      }}
                      className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[9px] cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => {
                        soundSystem.playMenuBeep();
                        state.level = Math.min(20, state.level + 1);
                        syncStateGates(state);
                        notifyOrionStateChange();
                      }}
                      className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[9px] cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => {
                        soundSystem.playSelect();
                        setBypassProgressionGates(state, !state.bypassProgressionGates);
                      }}
                      className={`px-1.5 py-0.5 rounded-xs font-bold text-[8.5px] cursor-pointer ${
                        state.bypassProgressionGates
                          ? 'bg-[#15803d] text-white border border-[#4ade80]'
                          : 'bg-[#1e293b] text-[#94a3b8] border border-[#475569]'
                      }`}
                    >
                      {state.bypassProgressionGates ? 'BYPASS ON' : 'STRICT'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Belldor Campaign & Secrets State Controller */}
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#c084fc]/40 space-y-1.5">
                <div className="text-[#c084fc] font-bold text-[10px] flex items-center justify-between">
                  <span>BELLDOR CAMPAIGN & SECRETS STATE (CHEAT ROOM OVERRIDES)</span>
                  <span className="text-[8.5px] text-[#94a3b8]">SANDBOX OVERRIDES ONLINE</span>
                </div>

                {/* Stage 1: The Poe & Bog Exit */}
                <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
                  <div>
                    <div className="font-bold text-[#7dd3fc] text-[9px]">
                      STAGE 1 · THE POE: {(String(state.flags.poe_state || 'unmet')).toUpperCase()}
                    </div>
                    <div className="text-[8px] text-[#94a3b8]">
                      Bog Exit: {state.flags.bog_exit_revealed ? 'REVEALED' : 'HIDDEN'} · Wurm Gift: {state.flags.poe_lantern_gift ? 'ACTIVE' : 'NONE'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const order = ['unmet', 'helped', 'ignored', 'killed'];
                      const cur = String(state.flags.poe_state || 'unmet');
                      const next = order[(order.indexOf(cur) + 1) % order.length];
                      state.flags.poe_state = next;
                      state.flags.poe_lantern_gift = next === 'helped';
                      state.flags.bog_exit_revealed = next !== 'unmet';
                      soundSystem.playSelect();
                      notifyOrionStateChange();
                    }}
                    className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8.5px] text-[#38bdf8] cursor-pointer shrink-0 ml-2"
                  >
                    CYCLE POE
                  </button>
                </div>

                {/* Part V Secrets: Bedivere's Ring, Numbered List & Lady of the Lake */}
                <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
                  <div>
                    <div className="font-bold text-[#e879f9] text-[9px]">
                      BEDIVERE RING: {(String(state.flags.bedivere_ring_choice || 'unchosen')).toUpperCase()} · LIST: {Number(state.flags.bedivere_list_items || 0)}/3
                    </div>
                    <div className="text-[8px] text-[#94a3b8]">
                      Ring taken = Loyalists hostile (+2 Trust needed). List 3/3 = Lady of the Lake.
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        const order = ['unchosen', 'taken', 'left'];
                        const cur = String(state.flags.bedivere_ring_choice || 'unchosen');
                        state.flags.bedivere_ring_choice = order[(order.indexOf(cur) + 1) % order.length];
                        soundSystem.playSelect();
                        notifyOrionStateChange();
                      }}
                      className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                    >
                      RING
                    </button>
                    <button
                      onClick={() => {
                        const next = (Number(state.flags.bedivere_list_items || 0) + 1) % 4;
                        state.flags.bedivere_list_items = next;
                        soundSystem.playSelect();
                        notifyOrionStateChange();
                      }}
                      className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                    >
                      LIST +1
                    </button>
                    <button
                      onClick={() => {
                        state.flags.bedivere_list_items = 3;
                        awakenLadyOfTheLake(state);
                        onResume();
                      }}
                      className="px-1.5 py-0.5 bg-[#7e22ce] hover:bg-[#6b21a8] text-white rounded-xs font-bold text-[8px] cursor-pointer"
                    >
                      LADY BOSS
                    </button>
                  </div>
                </div>

                {/* Stage 2: Orc Raid & Border Town Trust */}
                <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
                  <div>
                    <div className="font-bold text-[#fb923c] text-[9px]">
                      ORC RAID: {state.flags.orc_raid_active ? 'ACTIVE (BOG SEALED)' : 'INACTIVE'} · TRUST: {Number(state.flags.town_trust || 0)}
                    </div>
                    <div className="text-[8px] text-[#94a3b8]">
                      Orcs target NPCs first during raids. Saving NPCs increases Town Trust.
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        state.flags.town_trust = (Number(state.flags.town_trust || 0) + 1) % 6;
                        soundSystem.playMenuBeep();
                        notifyOrionStateChange();
                      }}
                      className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                    >
                      TRUST +1
                    </button>
                    <button
                      onClick={() => {
                        triggerOrcRaid(state);
                        onResume();
                      }}
                      className="px-1.5 py-0.5 bg-[#9a3412] hover:bg-[#7c2d12] text-white rounded-xs font-bold text-[8px] cursor-pointer"
                    >
                      START RAID
                    </button>
                  </div>
                </div>

                {/* Stage 2: Three Knights & 3-Way Cathedral Dungeon Door */}
                <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
                  <div>
                    <div className="font-bold text-[#ffd27d] text-[9px]">
                      DUNGEON DOOR: {doorStatus.canOpen ? 'READY TO OPEN' : 'LOCKED'}
                    </div>
                    <div className="text-[8px] text-[#94a3b8]">{doorStatus.reason}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        state.flags.grail_fragments = (Number(state.flags.grail_fragments || 0) + 1) % 4;
                        soundSystem.playMenuBeep();
                        notifyOrionStateChange();
                      }}
                      className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                    >
                      GRAIL +1
                    </button>
                    <button
                      onClick={() => {
                        state.flags.dungeon_switches = (Number(state.flags.dungeon_switches || 0) + 1) % 4;
                        soundSystem.playMenuBeep();
                        notifyOrionStateChange();
                      }}
                      className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                    >
                      SWITCH +1
                    </button>
                    <button
                      onClick={() => {
                        triggerThreeKnightsTrial(state);
                        onResume();
                      }}
                      className="px-1.5 py-0.5 bg-[#312e81] hover:bg-[#3730a3] text-[#e2e8f0] border border-[#818cf8] rounded-xs font-bold text-[8px] cursor-pointer"
                    >
                      3 KNIGHTS
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* NINE-GEMSTONE MATRIX & 3-WAY GEM PROGRESSION ENGINE */}
          {(() => {
            const normalizedSkills = normalizePilotSkills(state.pilotSkills);
            const retainedGems = getRetainedBuildGemCounts(state);

            return (
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#1e293b] pb-1">
                  <span className="text-[#38bdf8] font-bold text-[10px]">
                    NINE-GEMSTONE SYSTEM — PILOT SKILLS · FEAT NODE SOCKETS · EQUIPMENT MODS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded-xs font-bold text-[8px] ${
                        gates.standardProgressionUnlocked
                          ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                          : 'bg-[#451a03] text-[#fcd34d] border border-[#b45309]'
                      }`}
                    >
                      {gates.standardProgressionUnlocked
                        ? 'GEM SKILL PROGRESSION ONLINE'
                        : 'TUTORIAL LOCKOUT (CLEAR TUTORIAL / LV 6 OR BYPASS)'}
                    </span>
                    {state.bypassProgressionGates && (
                      <button
                        onClick={() => {
                          soundSystem.playPowerup();
                          for (const gem of GEMSTONE_CATALOG) {
                            refundInventoryGem(state, gem.id, 1);
                          }
                          state.toastText = 'ADDED +1 OF ALL 9 CANONICAL GEMSTONES TO SATCHEL';
                          state.toastTimer = 2.4;
                          notifyOrionStateChange();
                        }}
                        className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8]/60 rounded-xs font-bold text-[8px] text-[#7dd3fc] cursor-pointer"
                      >
                        +1 ALL 9 GEMS
                      </button>
                    )}
                  </div>
                </div>

                {/* Canonical 9-Gemstone Key & Pouch Table */}
                <div className="space-y-1">
                  <div className="text-[8.5px] text-[#94a3b8]">
                    <b>Gem Uses:</b> (1) <b>Pilot Skill Level</b> = Gems permanently consumed · (2) <b>Feat Node</b> = Gems removed from inventory, retained in build & refunded on unsocket · (3) <b>Equipment Mod</b> = Gems spent, mod retained.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    {GEMSTONE_CATALOG.map((gem) => {
                      const invCount = getInventoryGemCount(state, gem.id);
                      const retainedCount = retainedGems[gem.id] || 0;
                      return (
                        <div
                          key={gem.id}
                          className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] flex items-center justify-between gap-1.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-[8.5px] font-bold">
                              <SpriteCanvasIcon
                                base64={gem.iconBase64}
                                sizeClass="w-3.5 h-3.5"
                              />
                              <span className="text-[#f8fafc] truncate">
                                {gem.name} (Col {gem.colIndex})
                              </span>
                            </div>
                            <div className="text-[7.5px] text-[#94a3b8] truncate">
                              {gem.assignment} · Res: {gem.primaryResource} · Funds: {gem.fundsSkills.join(', ')}
                            </div>
                            <div className="text-[7.5px] text-[#cbd5e1] mt-0.5">
                              Inv: <b className="text-[#4ade80]">{invCount}</b>
                              {retainedCount > 0 ? (
                                <>
                                  {' '}
                                  · Retained: <b className="text-[#38bdf8]">{retainedCount}</b>
                                </>
                              ) : null}
                            </div>
                          </div>
                          {state.bypassProgressionGates && (
                            <button
                              onClick={() => {
                                soundSystem.playCoin();
                                refundInventoryGem(state, gem.id, 1);
                                notifyOrionStateChange();
                              }}
                              className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[7.5px] text-[#ffd27d] cursor-pointer shrink-0"
                              title={`Add 1 ${gem.name} to Satchel`}
                            >
                              +1
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gem Use 1: 6 Combat Discipline Skills (Levels 1-20 -> Unlocks 5 Feat Tiers I-V) */}
                <div className="pt-1 border-t border-[#1e293b] space-y-1">
                  <div className="flex items-center justify-between text-[8.5px]">
                    <span className="font-bold text-[#ffd27d]">
                      GEM USE 1 — 6 COMBAT DISCIPLINE SKILLS (LV 1–20 · GEMS PERMANENTLY CONSUMED):
                    </span>
                    <span className="text-[#7dd3fc] font-bold">
                      UNLOCKED FEAT TIERS: {gates.unlockedFeatTiers.length > 0 ? gates.unlockedFeatTiers.join(', ') : 'NONE (REACH SKILL LV 2)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {PILOT_SKILL_DEFINITIONS.map((def) => {
                      const prog = normalizedSkills[def.id];
                      const lvl = prog?.level || 1;
                      const invested = prog?.gemsInvested || 0;
                      const [traitGemId, reactorGemId] = def.fundingGems;
                      const traitGem = GEMSTONE_REGISTRY[traitGemId];
                      const reactorGem = GEMSTONE_REGISTRY[reactorGemId];
                      const haveTraitGem = getInventoryGemCount(state, traitGemId);
                      const haveReactorGem = getInventoryGemCount(state, reactorGemId);
                      const isActiveTrait = state.traitLine === def.id;

                      return (
                        <div
                          key={def.id}
                          className={`p-1.5 rounded-xs border space-y-1 ${
                            isActiveTrait
                              ? 'bg-[#172554]/50 border-[#38bdf8]/70'
                              : 'bg-[#0f172a] border-[#1e293b]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[8.5px]">
                            <span className="font-bold text-[#e2e8f0] truncate">
                              {def.name} {isActiveTrait ? '★' : ''}
                            </span>
                            <span className="font-bold text-[#38bdf8] shrink-0">
                              LV {lvl} / 20 ({invested} Gems)
                            </span>
                          </div>
                          <div className="text-[7.5px] text-[#94a3b8] leading-tight">
                            {def.relatedEquipment}
                          </div>
                          <div className="flex items-center gap-1 pt-0.5">
                            <button
                              onClick={() => {
                                const ok = fundPilotSkillWithGem(state, def.id, traitGemId, {
                                  say: (txt) => {
                                    state.toastText = txt;
                                    state.toastTimer = 2.6;
                                  },
                                });
                                if (ok) soundSystem.playPowerup();
                                else soundSystem.playMenuBeep();
                                syncStateGates(state);
                                notifyOrionStateChange();
                              }}
                              className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-xs border text-[7.5px] font-bold cursor-pointer truncate ${
                                haveTraitGem > 0 && lvl < 20
                                  ? 'bg-[#1e293b] hover:bg-[#334155] border-[#facc15]/60 text-[#fef08a]'
                                  : 'bg-[#090d14] border-[#1e293b] text-[#64748b]'
                              }`}
                            >
                              <SpriteCanvasIcon
                                base64={traitGem.iconBase64}
                                sizeClass="w-3 h-3"
                              />
                              <span>Spend {traitGem.name} ({haveTraitGem})</span>
                            </button>
                            <button
                              onClick={() => {
                                const ok = fundPilotSkillWithGem(state, def.id, reactorGemId, {
                                  say: (txt) => {
                                    state.toastText = txt;
                                    state.toastTimer = 2.6;
                                  },
                                });
                                if (ok) soundSystem.playPowerup();
                                else soundSystem.playMenuBeep();
                                syncStateGates(state);
                                notifyOrionStateChange();
                              }}
                              className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-xs border text-[7.5px] font-bold cursor-pointer truncate ${
                                haveReactorGem > 0 && lvl < 20
                                  ? 'bg-[#1e293b] hover:bg-[#334155] border-[#38bdf8]/60 text-[#e0f2fe]'
                                  : 'bg-[#090d14] border-[#1e293b] text-[#64748b]'
                              }`}
                            >
                              <SpriteCanvasIcon
                                base64={reactorGem.iconBase64}
                                sizeClass="w-3 h-3"
                              />
                              <span>Spend {reactorGem.name} ({haveReactorGem})</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gem Use 2: 97 Canonical Feat Nodes (Tiers I-V, Classless Hardware Synergy, Refunded on Unsocket) */}
                <div className="pt-1 border-t border-[#1e293b] space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[8.5px]">
                    <span className="font-bold text-[#ffd27d]">
                      GEM USE 2 — 97 FEAT NODES (CLASSLESS HARDWARE SYNERGY · GEMS REFUNDED ON UNSOCKET):
                    </span>
                    <span className="text-[#86efac] font-bold">
                      ACTIVE FEATS: {state.equippedFeats.length} / {FRAME_FEAT_CATALOG.length}
                    </span>
                  </div>

                  {/* Feat Tier & Synergy Category Filters */}
                  <div className="flex flex-wrap items-center gap-1 text-[7.5px]">
                    <span className="text-[#94a3b8] font-bold">TIER:</span>
                    {(['ALL', 'I', 'II', 'III', 'IV', 'V'] as const).map((tOpt) => (
                      <button
                        key={tOpt}
                        onClick={() => {
                          soundSystem.playSelect();
                          setFeatTierFilter(tOpt);
                        }}
                        className={`px-1.5 py-0.2 rounded-xs font-bold border cursor-pointer ${
                          featTierFilter === tOpt
                            ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                            : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b] hover:border-[#475569]'
                        }`}
                      >
                        {tOpt === 'ALL' ? 'ALL TIERS' : `TIER ${tOpt}`}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[7.5px]">
                    <span className="text-[#94a3b8] font-bold">SYNERGY:</span>
                    {(
                      [
                        'ALL',
                        'Ballistics & Ordnance',
                        'Melee & CQC',
                        'Frame Plating & Defense',
                        'Reactor & Thermal',
                        'Mobility & Stealth',
                        'Optics & Support',
                      ] as const
                    ).map((catOpt) => (
                      <button
                        key={catOpt}
                        onClick={() => {
                          soundSystem.playSelect();
                          setFeatSynergyFilter(catOpt);
                        }}
                        className={`px-1.5 py-0.2 rounded-xs font-bold border cursor-pointer ${
                          featSynergyFilter === catOpt
                            ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                            : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b] hover:border-[#475569]'
                        }`}
                      >
                        {catOpt === 'ALL' ? 'ALL SYNERGIES' : catOpt}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {FRAME_FEAT_CATALOG.filter((feat) => {
                      if (featTierFilter !== 'ALL' && feat.tier !== featTierFilter) return false;
                      const cat = feat.synergyCategory || 'Frame Plating & Defense';
                      if (featSynergyFilter !== 'ALL' && cat !== featSynergyFilter) return false;
                      return true;
                    }).map((feat) => {
                      const isTierOpen = isFeatNodeAvailable(state, feat);
                      const isEquipped = state.equippedFeats.includes(feat.id);
                      const hwCheck = doesPilotMeetFeatEquipmentRequirement(state, feat);
                      const socketSummary = feat.gemSockets
                        .map((s) => {
                          const g = GEMSTONE_REGISTRY[s.gemId];
                          const inv = getInventoryGemCount(state, s.gemId);
                          return `${s.count} ${g?.name || s.gemId} (${inv} inv)`;
                        })
                        .join(' + ');

                      return (
                        <button
                          key={feat.id}
                          onClick={() => {
                            const ok = toggleFeatNodeGemSocket(state, feat.id, {
                              say: (txt) => {
                                state.toastText = txt;
                                state.toastTimer = 2.6;
                              },
                            });
                            if (ok) soundSystem.playSelect();
                            else soundSystem.playMenuBeep();
                            syncStateGates(state);
                            notifyOrionStateChange();
                          }}
                          className={`p-1.5 rounded-xs border text-left transition-colors cursor-pointer ${
                            isEquipped
                              ? 'bg-[#172554]/80 border-[#38bdf8]'
                              : isTierOpen
                                ? 'bg-[#0f172a] border-[#1e293b] hover:border-[#475569]'
                                : 'bg-[#090d14] border-[#1e293b]/50 opacity-65'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                              [Tier {feat.tier} · Lv.{feat.requiredSkillLevel}+] {feat.name}
                            </span>
                            <span
                              className={`px-1 py-0.2 rounded-xs text-[7px] font-bold shrink-0 ${
                                isEquipped
                                  ? 'bg-[#38bdf8] text-[#05070a]'
                                  : feat.kind === 'system'
                                    ? 'bg-[#064e3b] text-[#6ee7b7]'
                                    : 'bg-[#3b0764] text-[#e879f9]'
                              }`}
                            >
                              {isEquipped
                                ? 'SOCKETED (CLICK TO REFUND)'
                                : `SOCKET (${feat.kind.toUpperCase()})`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-[7px] mt-0.5">
                            <span className="text-[#7dd3fc] truncate">
                              {feat.synergyCategory || 'Frame Plating & Defense'}
                            </span>
                            <span
                              className={`font-bold shrink-0 ${
                                hwCheck.met ? 'text-[#4ade80]' : 'text-[#fbbf24]'
                              }`}
                            >
                              {hwCheck.met
                                ? `✓ ${hwCheck.reason}`
                                : `⚙ Req: ${hwCheck.reason}`}
                            </span>
                          </div>
                          <div className="text-[7.5px] text-[#86efac] mt-0.5">
                            + {feat.gainDescription}
                          </div>
                          <div className="text-[7.5px] text-[#fbbf24]">
                            ◆ Sockets: {socketSummary}
                          </div>
                          {feat.unlocksDescription && (
                            <div className="text-[7px] text-[#94a3b8]">
                              ↳ {feat.unlocksDescription}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {isCheatMode && (
            <>
              {/* Core Combat Laws */}
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
                <div className="text-[#ffd27d] font-bold text-[10px]">THE SIX CORE COMBAT LAWS:</div>
                {CORE_COMBAT_LAWS.map((law, idx) => (
                  <div key={idx} className="text-[9px] text-[#cbd5e1] border-l-2 border-[#38bdf8] pl-1.5 py-0.5">
                    {law}
                  </div>
                ))}
              </div>

              {/* Canonical Level 1-20 Sequence */}
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
                <div className="text-[#38bdf8] font-bold text-[10px]">
                  LEVEL 1–20 UNLOCK SEQUENCE (CHEAT ROOM REFERENCE):
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  {LEVEL_UNLOCK_SEQUENCE.map((lvl) => (
                    <div
                      key={lvl.level}
                      className={`p-1 rounded-xs flex items-center justify-between gap-2 text-[8.5px] ${
                        state.level >= lvl.level || state.bypassProgressionGates
                          ? 'bg-[#1e293b] text-[#e2e8f0]'
                          : 'bg-[#090d14] text-[#64748b]'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#ffd27d]">
                          LV {lvl.level} [{lvl.band.toUpperCase()}]
                          {lvl.fixedEvent ? ` · ${lvl.fixedEvent}` : ''}:
                        </span>{' '}
                        <span>{lvl.unlock}</span>
                      </div>
                      <span className="italic text-[7.5px] shrink-0 text-[#94a3b8]">
                        {lvl.learningFocus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: CAMPFIRE FAST TRAVEL & (WHEN IN CHEAT ROOM) 5-TIER WORLD / FOG TOPOLOGY */}
      {tab === 'world' && (
        <SatchelWorldTab state={state} isCheatMode={isCheatMode} onResume={onResume} />
      )}
    </div>
  );
};
