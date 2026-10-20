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
import {
  ACTION_MODIFICATION_CATALOG,
  awardPilotSkillXp,
  CORE_COMBAT_LAWS,
  FEAT_TIER_SKILL_THRESHOLDS,
  FRAME_FEAT_CATALOG,
  LEVEL_UNLOCK_SEQUENCE,
  PILOT_SKILL_DEFINITIONS,
} from '../database/progression';
import { getWeaponDefinition, WEAPON_REGISTRY } from '../database/weapons';
import {
  AREA_REGISTRY,
  BIOME_REGISTRY,
  getBiomeDefinition,
  GLOBAL_ROOM_REGISTRY,
  LOCAL_ROOM_REGISTRY,
  MAP_REGISTRY,
  U00_UNIVERSE_CATALOG,
  WAYGATE_REGISTRY,
  WAYSTATION_REGISTRY,
} from '../database/world';
import {
  activateUtilityOrBeltSlot,
  applyTraitLineProfile,
  ASSIGNABLE_ACTION_CATALOG,
  assignTriggerAction,
  awakenLadyOfTheLake,
  consolidateInventorySlots,
  evaluateCathedralDoorStatus,
  fastTravelToWaystation,
  fastTravelViaWaygate,
  getActionCooldown,
  getActiveAetherNode,
  getOrionRoomsRef,
  getOrionStateRef,
  getRoomWorldInfo,
  hasPoeLanternGuidance,
  isActionUnlocked,
  notifyOrionStateChange,
  performWeaponSwap,
  resetAetherFogGraph,
  resetTriggerActionsToDefault,
  resolveTriggerAction,
  setBypassProgressionGates,
  setTutorialStateActive,
  subscribeOrionStateChange,
  syncStateGates,
  transitionViaAetherDoor,
  triggerOrcRaid,
  triggerThreeKnightsTrial,
  TUTORIAL_STEP_DESCRIPTORS,
  TutorialStepId,
} from '../systems';
import { AetherCardinalDir, TraitLine } from '../types';

export interface OrionSatchelProps {
  onResume: () => void;
}

const ALL_TRAIT_LINES: TraitLine[] = [
  'Warrior',
  'Marauder',
  'Guardian',
  'Rogue',
  'Wizard',
  'Cleric',
];

export const OrionSatchel: React.FC<OrionSatchelProps> = ({ onResume }) => {
  const [tab, setTab] = useState<'status' | 'weapons' | 'inventory' | 'world' | 'progression'>('status');
  const [, setRefresh] = useState(0);

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
  const activeL = resolveTriggerAction(state, 'L');
  const activeR = resolveTriggerAction(state, 'R');

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
            ACTIONS & WPN
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
            WORLD & WAYGATES
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
            STATES & LAWS
          </button>
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
      <div className="flex items-center justify-between px-2 py-1 bg-[#090d14] rounded-xs border border-[#1e293b] mb-1.5 text-[10px]">
        <span>
          PILOT: <b className="text-[#38bdf8]">{state.pilotName}</b> ({state.traitLine})
        </span>
        <span>
          REACTOR: <b className="text-[#c084fc]">{state.reactor}</b>
        </span>
        <span>
          SCRAP: <b className="text-[#ffd27d]">{state.salvageScrap}</b>
        </span>
      </div>

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
              <div className="w-full bg-[#1e293b] h-1.5 rounded-xs overflow-hidden">
                <div
                  className="bg-[#77c7ff] h-full transition-all"
                  style={{
                    width: `${state.shields.maxCapacity > 0 ? (state.shields.capacity / state.shields.maxCapacity) * 100 : 0}%`,
                  }}
                />
              </div>
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
              <div className="w-full bg-[#1e293b] h-1.5 rounded-xs overflow-hidden">
                <div
                  className="bg-[#ffd27d] h-full transition-all"
                  style={{
                    width: `${state.armor.maxDurability > 0 ? (state.armor.durability / state.armor.maxDurability) * 100 : 0}%`,
                  }}
                />
              </div>
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
              <div className="w-full bg-[#1e293b] h-1.5 rounded-xs overflow-hidden">
                <div
                  className={`h-full transition-all ${state.frame.state === 'Critical' ? 'bg-[#ff9b9b]' : 'bg-[#8dd7ad]'}`}
                  style={{ width: `${(state.frame.integrity / 200) * 100}%` }}
                />
              </div>
            </div>

            {/* Heat Gauge */}
            <div className="space-y-0.5 pt-1">
              <div className="flex justify-between text-[9px]">
                <span className="text-[#f97316] font-bold">REACTOR HEAT</span>
                <span>{Math.round(state.heat)} / {state.maxHeat}</span>
              </div>
              <div className="w-full bg-[#1e293b] h-1 rounded-xs overflow-hidden">
                <div
                  className="bg-[#f97316] h-full transition-all"
                  style={{ width: `${(state.heat / state.maxHeat) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 6 Canonical Trait Lines, Frames & Weight Classes (§3.2 LOCKED) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8] font-bold text-[10px]">
                CANONICAL FRAMES & TRAIT LINES (§3.2 LOCKED):
              </span>
              <span className="text-[8.5px] text-[#38bdf8] font-bold">
                FRAME: {trait.frameModel || 'PNSY W416'} · {trait.reactor.toUpperCase()} REACTOR
              </span>
            </div>
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
                      <span className="font-bold text-[9px] text-[#ffd27d]">{tl.toUpperCase()}</span>
                      <span className="text-[7px] uppercase px-1 rounded-xs bg-[#1e293b] text-[#cbd5e1]">
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

          {/* §4.4 Canonical 13-Slot Equipment + 4-Armor & Generator Taxonomy */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#38bdf8] text-[10px]">
                13 EQUIPMENT SLOTS + 4 ARMOR & GENERATOR (§4.4 LOCKED):
              </span>
              <span className="text-[8px] text-[#94a3b8]">
                BAND: <b className="text-[#c084fc]">{gates.levelBand.toUpperCase()}</b>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[8px]">
              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#ffd27d]">
                  <span>WPN SET 1 (2 SLOTS)</span>
                  <span className="text-[#86efac]">ACT {gates.set1UnlockedActions.join(',')}</span>
                </div>
                <div className="text-[#cbd5e1] truncate">
                  Main 1: {getWeaponDefinition(state.equippedWeapons[0] || 'gladius_boltcaster')?.name}
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#ffd27d]">
                  <span>WPN SET 2 (2 SLOTS)</span>
                  <span className={gates.canWeaponSwap ? 'text-[#86efac]' : 'text-[#f59e0b]'}>
                    {gates.canWeaponSwap
                      ? `ACT ${gates.set2UnlockedActions.join(',')}`
                      : 'LOCKED (LV 2)'}
                  </span>
                </div>
                <div className="text-[#cbd5e1] truncate">
                  Main 3: {getWeaponDefinition(state.equippedWeapons[1] || 'khopesh')?.name}
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#38bdf8]">
                  <span>UTILITY (1 SLOT · ACT 6)</span>
                  <span className={gates.utilitySlotActive ? 'text-[#86efac]' : 'text-[#f59e0b]'}>
                    {gates.utilitySlotActive ? 'ONLINE (LV 6)' : 'LOCKED (LV 6)'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-[#cbd5e1] truncate">
                    {getClassUtilityDefinition(state.equipmentSlots?.utility, state.traitLine).name}
                  </span>
                  <button
                    onClick={() => {
                      activateUtilityOrBeltSlot(state, 'class_utility_slot');
                    }}
                    className="px-1.5 py-0.2 bg-[#1e293b] hover:bg-[#334155] text-[#4ade80] border border-[#475569] rounded-xs font-bold text-[7.5px] shrink-0 cursor-pointer"
                  >
                    USE [6]
                  </button>
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#c084fc]">
                  <span>AUX SLOTS (4 · ACT 7–10)</span>
                  <span className="text-[#86efac]">{gates.auxSlotsUnlocked}/4 ONLINE</span>
                </div>
                <div className="text-[#94a3b8] truncate">
                  Lv 4: Aux 1–2 · Lv 5: Aux 3–4
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#8dd7ad]">
                  <span>BELT SLOTS (4 · ACT 7–10)</span>
                  <span className="text-[#86efac]">{gates.beltSlotsUnlocked}/4 ONLINE</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {[0, 1, 2, 3].map((bIdx) => {
                    const bItem = state.equipmentSlots?.belt?.[bIdx];
                    const bDef = bItem ? getItemDefinition(bItem) : undefined;
                    return (
                      <button
                        key={bIdx}
                        onClick={() => {
                          activateUtilityOrBeltSlot(state, `belt_slot_${bIdx + 1}`);
                        }}
                        title={bDef ? `Trigger Belt ${bIdx + 1}: ${bDef.name}` : `Belt ${bIdx + 1} Empty`}
                        className="px-1 py-0.2 bg-[#090d14] hover:bg-[#1e293b] border border-[#334155] rounded-xs text-[7px] text-[#cbd5e1] truncate flex-1 cursor-pointer"
                      >
                        B{bIdx + 1}:{bDef ? bDef.name.split(' ')[0] : '—'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#e2e8f0]">
                  <span>ARMOR & GEN (5 SLOTS)</span>
                  <span className="text-[#38bdf8]">CHASSIS</span>
                </div>
                <div className="text-[#94a3b8] truncate">
                  Torso(L1) · Legs({gates.legsSlotActive ? 'ON' : 'L2'}) · Head({gates.headSlotActive ? 'ON' : 'L3'}) · Gen({gates.generatorSlotActive ? 'ON' : 'L4'}) · Arms({gates.armsSlotActive ? 'ON' : 'L5'})
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: MULTI-SOURCE ACTIONS (X, L, R) & WEAPON HARDPOINTS */}
      {tab === 'weapons' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
          {/* Active Action Bindings Summary (X = Basic Always, L & R = Assignable) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#38bdf8] font-bold text-[10px]">
                ACTIVE COMBAT BINDINGS (X · L · R)
              </span>
              <button
                onClick={() => {
                  soundSystem.playSelect();
                  resetTriggerActionsToDefault(state);
                }}
                className="px-1.5 py-0.2 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs text-[8px] font-bold text-[#ffd27d] cursor-pointer"
              >
                DEFAULT WEAPON SKILLS
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 text-[8.5px]">
              {/* X: Basic Attack Always */}
              <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="text-[#94a3b8] font-bold">[X] BASIC ATTACK (LOCKED)</div>
                <div className="text-[#ffd27d] font-bold truncate mt-0.5">
                  {currentWeapon?.moveset[0]?.name || 'Auto-Salvo'}
                </div>
                <div className="text-[7.5px] text-[#64748b] truncate">
                  {currentWeapon?.name} [Slot 0]
                </div>
              </div>

              {/* L: Assignable Trigger */}
              <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#38bdf8]/50">
                <div className="text-[#38bdf8] font-bold">[L] ASSIGNED ACTION</div>
                <div className="text-[#e2e8f0] font-bold truncate mt-0.5">
                  {activeL.name}
                </div>
                <div className="text-[7.5px] text-[#7dd3fc] truncate">
                  {activeL.sourceLabel}
                </div>
              </div>

              {/* R: Assignable Trigger */}
              <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#c084fc]/50">
                <div className="text-[#c084fc] font-bold">[R] ASSIGNED ACTION</div>
                <div className="text-[#e2e8f0] font-bold truncate mt-0.5">
                  {activeR.name}
                </div>
                <div className="text-[7.5px] text-[#e879f9] truncate">
                  {activeR.sourceLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Equipped Weapon Sets (Set 1 & Set 2) + Weapon Weight Class Swapper */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between text-[9.5px] font-bold text-[#94a3b8]">
              <span>
                WEAPON SETS 1 & 2 (5.0S BASE SWAP CD · EFF LOAD: {gates.effectiveLoadCapacity.toUpperCase()})
              </span>
              <span className="text-[#ffd27d]">{gates.loadPenalty.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {state.equippedWeapons.map((wId, idx) => {
                const wDef = getWeaponDefinition(wId);
                const isSelected = idx === state.activeWeaponIndex;
                return (
                  <div
                    key={`${wId}-${idx}`}
                    className={`p-1.5 rounded-xs border transition-colors ${
                      isSelected
                        ? 'bg-[#172554]/70 border-[#38bdf8]'
                        : 'bg-[#0f172a] border-[#1e293b]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold text-[#94a3b8]">
                        WEAPON SET {idx + 1} ({wDef?.weightClass?.toUpperCase() || 'MEDIUM'})
                      </span>
                      <button
                        onClick={() => {
                          if (!isSelected) {
                            performWeaponSwap(
                              state,
                              {
                                say: (txt) => {
                                  state.toastText = txt;
                                  state.toastTimer = 2.5;
                                },
                              },
                              idx,
                              true
                            );
                          }
                        }}
                        className={`px-1.5 py-0.2 rounded-xs text-[8px] font-bold cursor-pointer ${
                          isSelected
                            ? 'bg-[#38bdf8] text-[#05070a]'
                            : 'bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155]'
                        }`}
                      >
                        {isSelected ? 'ACTIVE SET' : 'ACTIVATE'}
                      </button>
                    </div>
                    <div className="text-[10px] font-bold text-[#ffd27d] mt-0.5 truncate">
                      {wDef?.name || wId}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {Object.values(WEAPON_REGISTRY).map((candidate) => (
                        <button
                          key={candidate.id}
                          onClick={() => {
                            soundSystem.playSelect();
                            state.equippedWeapons[idx] = candidate.id;
                            if (idx === state.activeWeaponIndex) {
                              state.maxAmmo = candidate.shotsPerChain;
                              state.ammo = candidate.shotsPerChain;
                              state.reloadDuration = candidate.reloadDurationSec;
                            }
                            syncStateGates(state);
                            notifyOrionStateChange();
                          }}
                          className={`px-1 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                            wId === candidate.id
                              ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                              : 'bg-[#090d14] text-[#94a3b8] border-[#334155]'
                          }`}
                        >
                          {candidate.weightClass?.toUpperCase()}: {candidate.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* §4.2 Equipment Action Modifications (Gain + Drawback) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
            <div className="text-[9.5px] font-bold text-[#c084fc]">
              EQUIPMENT ACTION MODIFICATIONS (§4.2 — BEHAVIOR GAIN + DRAWBACK):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              {ACTION_MODIFICATION_CATALOG.map((mod) => {
                const slotKey = mod.targetCategory;
                const isInstalled = state.equipmentSlots?.installedMods?.[slotKey] === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      soundSystem.playSelect();
                      if (!state.equipmentSlots) return;
                      state.equipmentSlots.installedMods =
                        state.equipmentSlots.installedMods || {};
                      if (isInstalled) {
                        delete state.equipmentSlots.installedMods[slotKey];
                      } else {
                        state.equipmentSlots.installedMods[slotKey] = mod.id;
                      }
                      notifyOrionStateChange();
                    }}
                    className={`p-1.5 rounded-xs border text-left cursor-pointer ${
                      isInstalled
                        ? 'bg-[#2e1065]/70 border-[#c084fc]'
                        : 'bg-[#0f172a] border-[#1e293b] hover:border-[#475569]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                        {mod.name}
                      </span>
                      <span className="text-[7px] font-bold px-1 rounded-xs bg-[#1e293b] text-[#c084fc]">
                        {isInstalled ? 'INSTALLED' : 'INSTALL'}
                      </span>
                    </div>
                    <div className="text-[7.5px] text-[#86efac] mt-0.5">+ {mod.gainDescription}</div>
                    <div className="text-[7.5px] text-[#f87171]">− {mod.drawbackDescription}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* §4.2 Class Utility Slot (Action 6 · Lv 6) Selector & Trigger */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-[#4ade80]">
                CLASS UTILITY SLOT (ACTION 6 · UNLOCKED AT LEVEL 6: BORDER TOWN COMPLETE):
              </span>
              <button
                onClick={() => {
                  activateUtilityOrBeltSlot(state, 'class_utility_slot');
                }}
                className="px-2 py-0.5 bg-[#14532d] hover:bg-[#166534] border border-[#4ade80] rounded-xs text-[8px] font-bold text-white cursor-pointer"
              >
                ⚡ TRIGGER ACTION 6
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {CLASS_UTILITY_CATALOG.map((u) => {
                const currentUtilId =
                  state.equipmentSlots?.utility ||
                  getClassUtilityDefinition(undefined, state.traitLine).id;
                const isSelected = currentUtilId === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      soundSystem.playSelect();
                      if (state.equipmentSlots) {
                        state.equipmentSlots.utility = u.id;
                        notifyOrionStateChange();
                      }
                    }}
                    className={`p-1.5 rounded-xs border text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#052e16]/80 border-[#4ade80]'
                        : 'bg-[#0f172a] border-[#1e293b] hover:border-[#475569]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[8.5px] text-[#ffd27d] truncate">
                        {u.shortLabel}
                      </span>
                      <span className="text-[7px] px-1 bg-[#090d14] text-[#38bdf8] rounded-xs">
                        {u.traitLine}
                      </span>
                    </div>
                    <div className="text-[7.5px] text-[#cbd5e1] truncate mt-0.5">{u.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Source Assignable Action Catalog (Weapon Skills, Hardware Modules, Reactor, Utility & Belt) */}
          <div className="text-[10px] font-bold text-[#94a3b8] pt-1">
            ASSIGN [L] & [R] ACTIONS (WEAPON · HARDWARE · REACTOR · LV.6 UTILITY · BELT 1–4):
          </div>
          <div className="space-y-1">
            {ASSIGNABLE_ACTION_CATALOG.map((catalogItem) => {
              const resolved = getResolvedActionDescriptor(state, catalogItem.id);
              const unlockInfo = isActionUnlocked(state, catalogItem.id);
              const isAssignedL = (state.assignedActions?.L || 'weapon_skill_1') === catalogItem.id;
              const isAssignedR = (state.assignedActions?.R || 'weapon_skill_2') === catalogItem.id;
              const cd = getActionCooldown(state, catalogItem.id);

              const badgeColor =
                resolved.sourceCategory === 'weapon'
                  ? 'bg-[#1e293b] text-[#ffd27d]'
                  : resolved.sourceCategory === 'hardware'
                    ? 'bg-[#0c4a6e] text-[#7dd3fc]'
                    : resolved.sourceCategory === 'utility'
                      ? 'bg-[#14532d] text-[#86efac]'
                      : resolved.sourceCategory === 'belt'
                        ? 'bg-[#422006] text-[#fde047]'
                        : 'bg-[#3b0764] text-[#e879f9]';

              return (
                <div
                  key={catalogItem.id}
                  className={`p-1.5 bg-[#090d14] rounded-xs border space-y-0.5 ${
                    unlockInfo.unlocked ? 'border-[#1e293b]' : 'border-[#334155]/40 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`px-1 py-0.2 rounded-xs text-[7.5px] font-bold uppercase shrink-0 ${badgeColor}`}>
                        {resolved.sourceCategory === 'weapon'
                          ? 'WEAPON'
                          : resolved.sourceCategory === 'hardware'
                            ? resolved.hardwareSlot || 'MODULE'
                            : resolved.sourceCategory === 'utility'
                              ? 'UTILITY [ACT 6]'
                              : resolved.sourceCategory === 'belt'
                                ? `BELT ${(resolved.beltSlotIndex ?? 0) + 1}`
                                : 'REACTOR'}
                      </span>
                      <span className="font-bold text-[#e2e8f0] truncate">{resolved.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {(resolved.sourceCategory === 'utility' ||
                        resolved.sourceCategory === 'belt') && (
                        <button
                          onClick={() => {
                            activateUtilityOrBeltSlot(state, catalogItem.id);
                          }}
                          className="px-1.5 py-0.2 rounded-xs font-bold text-[8px] border bg-[#14532d]/80 hover:bg-[#166534] text-[#86efac] border-[#4ade80]/60 cursor-pointer"
                        >
                          USE
                        </button>
                      )}
                      <button
                        onClick={() => {
                          soundSystem.playSelect();
                          assignTriggerAction(state, 'L', catalogItem.id);
                        }}
                        className={`px-1.5 py-0.2 rounded-xs font-bold text-[8px] border cursor-pointer ${
                          isAssignedL
                            ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                            : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#38bdf8]'
                        }`}
                      >
                        {isAssignedL ? 'BOUND [L]' : 'BIND L'}
                      </button>
                      <button
                        onClick={() => {
                          soundSystem.playSelect();
                          assignTriggerAction(state, 'R', catalogItem.id);
                        }}
                        className={`px-1.5 py-0.2 rounded-xs font-bold text-[8px] border cursor-pointer ${
                          isAssignedR
                            ? 'bg-[#c084fc] text-[#05070a] border-[#e879f9]'
                            : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#c084fc]'
                        }`}
                      >
                        {isAssignedR ? 'BOUND [R]' : 'BIND R'}
                      </button>
                    </div>
                  </div>

                  <div className="text-[8.5px] text-[#94a3b8]">{resolved.description}</div>
                  <div className="flex items-center justify-between text-[8px] text-[#64748b]">
                    <div className="flex gap-2">
                      <span>SOURCE: {resolved.sourceLabel}</span>
                      <span>TELL: {resolved.tellDurationSec}s</span>
                      <span>CD: {cd > 0 ? `${cd.toFixed(1)}s` : `${resolved.cooldownSec}s`}</span>
                      <span>
                        HEAT: {resolved.heatCost >= 0 ? `+${resolved.heatCost}` : `${resolved.heatCost}`}
                      </span>
                    </div>
                    <span className={unlockInfo.unlocked ? 'text-[#4ade80] font-bold' : 'text-[#f59e0b]'}>
                      {unlockInfo.reason}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: SATCHEL & INVENTORY */}
      {tab === 'inventory' && (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 text-[10px]">
          <div className="text-[10px] font-bold text-[#94a3b8]">SALVAGED CONSUMABLES & ARTIFACTS:</div>
          {state.inventorySlots.length === 0 ? (
            <div className="text-center text-[#64748b] py-6 italic">No salvage in satchel. Explore drop-pod marshlands and loot caches.</div>
          ) : (
            consolidateInventorySlots(state.inventorySlots).map((slot, idx) => {
              const def = getItemDefinition(slot.itemId);
              if (!def) return null;
              return (
                <div
                  key={`${slot.itemId}-${idx}`}
                  className="flex items-center justify-between p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b]"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#ffd27d]">
                      {def.name} <span className="text-[#94a3b8]">×{slot.count}</span>
                      <span className="ml-1 text-[8px] uppercase px-1 py-0.2 rounded-xs bg-[#1e293b] text-[#94a3b8]">
                        {def.category}
                      </span>
                    </div>
                    <div className="text-[9px] text-[#94a3b8]">{def.description}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {def.category === 'consumable' &&
                      [0, 1, 2, 3].map((bIdx) => {
                        const isSlotted = state.equipmentSlots?.belt?.[bIdx] === slot.itemId;
                        return (
                          <button
                            key={bIdx}
                            onClick={() => {
                              soundSystem.playSelect();
                              if (state.equipmentSlots) {
                                state.equipmentSlots.belt[bIdx] = slot.itemId;
                                notifyOrionStateChange();
                              }
                            }}
                            className={`px-1.5 py-1 rounded-xs border font-bold text-[8px] cursor-pointer ${
                              isSlotted
                                ? 'bg-[#422006] text-[#fde047] border-[#eab308]'
                                : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#eab308]'
                            }`}
                            title={`Assign ${def.name} to Belt Slot ${bIdx + 1} (Action ${7 + bIdx})`}
                          >
                            B{bIdx + 1}
                          </button>
                        );
                      })}
                    {def.onUse && (
                      <button
                        onClick={() => handleUseItem(slot.itemId)}
                        className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] font-bold rounded-xs border border-[#475569] text-[9px]"
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

      {/* Tab: MULTI-DOMAIN STATE GATES, BELLDOR CAMPAIGN & CORE COMBAT LAWS */}
      {tab === 'progression' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
          {/* Multi-Domain State & Gate Controller */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
            <div className="text-[#38bdf8] font-bold text-[10px] flex items-center justify-between">
              <span>MULTI-DOMAIN STATE & GATE CONTROLLER</span>
              <span className="text-[8.5px] text-[#94a3b8]">ISOLATED SYSTEMS</span>
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

          {/* Belldor Campaign & Secrets State Controller (Stage 1, Stage 2 & Part V) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#c084fc]/40 space-y-1.5">
            <div className="text-[#c084fc] font-bold text-[10px] flex items-center justify-between">
              <span>BELLDOR CAMPAIGN & SECRETS STATE (STAGE 1 & 2)</span>
              <span className="text-[8.5px] text-[#94a3b8]">PROJECT ORION INDEX</span>
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

          {/* LAYER 1 & LAYER 2: PILOT SKILLS -> FEAT TIERS (I–V) -> SYSTEM & INTERFACE FEATS */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#38bdf8] font-bold text-[10px]">
                3-LAYER GATING CHAIN: PILOT SKILLS → FEAT TIERS → FRAME FEATS (v0.7)
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-xs font-bold text-[8px] ${
                  gates.standardProgressionUnlocked
                    ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                    : 'bg-[#451a03] text-[#fcd34d] border border-[#b45309]'
                }`}
              >
                {gates.standardProgressionUnlocked
                  ? 'USE-BASED PROGRESSION UNLOCKED'
                  : 'LOCKED UNTIL TUTORIAL CLEARED (LV 6)'}
              </span>
            </div>

            <div className="text-[8.5px] text-[#94a3b8]">
              Use equipment → Pilot skills level → Feat Tiers open (I: Lv2, II: Lv5, III: Lv9, IV: Lv14, V: Lv18) → System Feats raise Load Limit & Interface Feats trade Static Budget stats.
            </div>

            {/* Pilot Skills List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {PILOT_SKILL_DEFINITIONS.map((def) => {
                const prog = state.pilotSkills?.[def.id];
                const lvl = prog?.level || 1;
                const xp = Math.round(prog?.xp || 0);
                const nextXp = prog?.nextLevelXp || 40;
                return (
                  <div
                    key={def.id}
                    className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[8.5px]">
                        <span className="font-bold text-[#e2e8f0] truncate">{def.name}</span>
                        <span className="font-bold text-[#38bdf8]">
                          LV {lvl} ({xp}/{nextXp} XP)
                        </span>
                      </div>
                      <div className="text-[7.5px] text-[#64748b] truncate">
                        {def.relatedEquipment}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        soundSystem.playSelect();
                        if (!gates.standardProgressionUnlocked) {
                          state.toastText =
                            'STANDARD SKILL PROGRESSION LOCKED UNTIL TUTORIAL CLEARED (OR TURN TUTORIAL OFF)';
                          state.toastTimer = 2.6;
                        } else {
                          awardPilotSkillXp(state, def.id, 25, {
                            say: (txt) => {
                              state.toastText = txt;
                              state.toastTimer = 2.5;
                            },
                          });
                        }
                        syncStateGates(state);
                        notifyOrionStateChange();
                      }}
                      className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] text-[#ffd27d] cursor-pointer shrink-0"
                    >
                      +25 XP
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Frame Feats (System vs Interface — Re-distributable at any time, no active cap) */}
            <div className="pt-1 border-t border-[#1e293b] space-y-1">
              <div className="flex items-center justify-between text-[8.5px]">
                <span className="font-bold text-[#ffd27d]">
                  FRAME FEATURES (FEATS) — RE-DISTRIBUTABLE AT ANY TIME (NO ACTIVE LIMIT):
                </span>
                <span className="text-[#7dd3fc] font-bold">
                  OPEN TIERS: {gates.unlockedFeatTiers.length > 0 ? gates.unlockedFeatTiers.join(', ') : 'NONE (LEVEL SKILLS TO LV 2)'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {FRAME_FEAT_CATALOG.map((feat) => {
                  const skillLvl = state.pilotSkills?.[feat.requiredSkillId]?.level || 1;
                  const isTierOpen =
                    Boolean(state.bypassProgressionGates) ||
                    gates.unlockedFeatTiers.includes(feat.tier) ||
                    skillLvl >= feat.requiredSkillLevel ||
                    (feat.id === 'knights_oath' && Boolean(state.flags?.lady_of_the_lake_defeated));
                  const isEquipped = state.equippedFeats.includes(feat.id);

                  return (
                    <button
                      key={feat.id}
                      onClick={() => {
                        if (!isTierOpen) {
                          soundSystem.playMenuBeep();
                          state.toastText = `TIER ${feat.tier} LOCKED: REQUIRES ${feat.requiredSkillId.toUpperCase()} LV ${FEAT_TIER_SKILL_THRESHOLDS[feat.tier]}`;
                          state.toastTimer = 2.5;
                          notifyOrionStateChange();
                          return;
                        }
                        soundSystem.playSelect();
                        if (isEquipped) {
                          state.equippedFeats = state.equippedFeats.filter((id) => id !== feat.id);
                        } else {
                          state.equippedFeats = [...state.equippedFeats, feat.id];
                        }
                        syncStateGates(state);
                        notifyOrionStateChange();
                      }}
                      className={`p-1.5 rounded-xs border text-left transition-colors cursor-pointer ${
                        isEquipped
                          ? 'bg-[#172554]/80 border-[#38bdf8]'
                          : isTierOpen
                            ? 'bg-[#0f172a] border-[#1e293b] hover:border-[#475569]'
                            : 'bg-[#090d14] border-[#1e293b]/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                          [{feat.tier}] {feat.name}
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
                          {isEquipped ? 'ACTIVE' : feat.kind.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[7.5px] text-[#86efac] mt-0.5">+ {feat.gainDescription}</div>
                      <div className="text-[7.5px] text-[#fbbf24]">⚖ {feat.costDescription}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Core Combat Laws */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
            <div className="text-[#ffd27d] font-bold text-[10px]">THE SIX CORE COMBAT LAWS:</div>
            {CORE_COMBAT_LAWS.map((law, idx) => (
              <div key={idx} className="text-[9px] text-[#cbd5e1] border-l-2 border-[#38bdf8] pl-1.5 py-0.5">
                {law}
              </div>
            ))}
          </div>

          {/* Canonical Level 1-20 Sequence (§5 LOCKED: Lesson 1-5, Challenge 6-12, Expression 13-20) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
            <div className="text-[#38bdf8] font-bold text-[10px]">
              §5 LEVEL SEQUENCE (LOCKED — LESSON 1–5 · CHALLENGE 6–12 · EXPRESSION 13–20):
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
        </div>
      )}

      {/* TAB: 5-TIER NESTED WORLD ARCHITECTURE & LORE FAST TRAVEL */}
      {tab === 'world' && (() => {
        const worldInfo = getRoomWorldInfo(state);
        const activeBiome = getBiomeDefinition(state.biomeId);
        const rooms = getOrionRoomsRef();
        const discoveredWs = state.discoveredWaystations || ['ws_bog_drop_pod'];
        const discoveredWg = state.discoveredWaygates || [];

        return (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px]">
            {/* Active 5-Tier Nested Location Breadcrumb */}
            <div className="p-2 bg-[#0f172a] rounded-xs border border-[#22d3ee]/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#22d3ee] text-[10px]">
                  ACTIVE 5-TIER NESTED WORLD HIERARCHY (ON-FOOT & LORE TRANSIT)
                </span>
                <button
                  onClick={() => {
                    state.discoveredWaystations = Object.keys(WAYSTATION_REGISTRY);
                    state.discoveredWaygates = Object.keys(WAYGATE_REGISTRY);
                    soundSystem.playPowerup();
                    notifyOrionStateChange();
                  }}
                  className="px-1.5 py-0.5 bg-[#164e63] hover:bg-[#0e7490] text-[#e0f2fe] border border-[#22d3ee]/60 rounded-xs font-bold text-[8px] cursor-pointer"
                >
                  ATTUNE ALL WAYSTATIONS & WAYGATES
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 pt-1">
                <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
                  <div className="text-[8px] text-[#94a3b8]">1. REGION ({worldInfo.regionScope.toUpperCase()})</div>
                  <div className="font-bold text-[#f8fafc] truncate">{worldInfo.regionName}</div>
                </div>
                <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
                  <div className="text-[8px] text-[#94a3b8]">2. AREA ({worldInfo.areaScope.toUpperCase()})</div>
                  <div className="font-bold text-[#38bdf8] truncate">{worldInfo.areaName}</div>
                </div>
                <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
                  <div className="text-[8px] text-[#94a3b8]">3. MAP ({worldInfo.mapScope.toUpperCase()})</div>
                  <div className="font-bold text-[#ffd27d] truncate">{worldInfo.mapName}</div>
                </div>
                <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
                  <div className="text-[8px] text-[#94a3b8]">4. ROOM [{state.room}] ({worldInfo.roomScope.toUpperCase()})</div>
                  <div className="font-bold text-[#86efac] truncate">{worldInfo.roomTitle}</div>
                </div>
                <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
                  <div className="text-[8px] text-[#94a3b8]">5. BIOME ({worldInfo.biomeScope.toUpperCase()})</div>
                  <div className="font-bold text-[#c084fc] truncate">{worldInfo.biomeName}</div>
                </div>
              </div>
              <div className="text-[8.5px] text-[#cbd5e1] pt-0.5 flex flex-wrap items-center gap-2">
                <span>
                  BIOME RULES: Corrosive Water:{' '}
                  <strong className={activeBiome.tileRules.corrosiveWater ? 'text-[#84cc16]' : 'text-[#94a3b8]'}>
                    {activeBiome.tileRules.corrosiveWater
                      ? `YES (${activeBiome.tileRules.corrosiveDamagePerSec}/s)`
                      : 'NO'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Mud Speed: <strong>{Math.round(activeBiome.tileRules.mudSlowMultiplier * 100)}%</strong>
                </span>
                <span>·</span>
                <span>
                  Desync Cadence: <strong>{activeBiome.tileRules.desyncPeriodSec}s</strong>
                </span>
              </div>
            </div>

            {/* Aether Fog 5-Node Graph Engine (Key, General, Side, Loop, End) */}
            {(() => {
              const activeNode = getActiveAetherNode(state);
              const hasLantern = hasPoeLanternGuidance(state);
              const totalGenerated = Object.keys(state.fogGraph?.nodes || {}).filter((k) =>
                k.startsWith('fog:')
              ).length;
              const dirs: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];

              return (
                <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#38bdf8] text-[10px]">
                      ÆTHER FOG 5-NODE TOPOLOGY (KEY · GENERAL · SIDE · LOOP · END)
                    </span>
                    <button
                      disabled={!rooms}
                      onClick={() => {
                        if (!rooms) return;
                        soundSystem.playSelect();
                        resetAetherFogGraph(rooms, state);
                      }}
                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#7dd3fc] border border-[#38bdf8]/40 rounded-xs font-bold text-[8px] cursor-pointer shrink-0"
                    >
                      RESET FOG GRAPH (SEED #{state.fogGraph?.seed || 104729})
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[8.5px]">
                    <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                      <div className="text-[#94a3b8] text-[7.5px]">ACTIVE NODE TYPE</div>
                      <div className="font-bold text-[#fbbf24]">
                        {activeNode.nodeType.toUpperCase()} NODE
                      </div>
                    </div>
                    <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                      <div className="text-[#94a3b8] text-[7.5px]">ROUTE / BRANCH STATUS</div>
                      <div className="font-bold text-[#38bdf8]">
                        {activeNode.nodeType === 'general'
                          ? `STEP ${activeNode.routeStep || 1} OF ${activeNode.routeTotal || 1}`
                          : activeNode.nodeType === 'side'
                            ? 'OFF-PATH (NO PROGRESS)'
                            : activeNode.nodeType === 'loop'
                              ? `FOG LOOP (DEPTH ${worldInfo.loopDepth})`
                              : activeNode.nodeType === 'end'
                                ? `END (${(activeNode.endFeature || 'loot_cache').toUpperCase()})`
                                : 'POINT OF INTEREST'}
                      </div>
                    </div>
                    <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                      <div className="text-[#94a3b8] text-[7.5px]">TRUE PATH / ESCAPE TELL</div>
                      <div className="font-bold text-[#86efac]">
                        {activeNode.trueExitDir
                          ? `THRESHOLD [${activeNode.trueExitDir}]`
                          : 'ALL CARDINAL EXITS'}
                      </div>
                    </div>
                    <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                      <div className="text-[#94a3b8] text-[7.5px]">WAYFINDING & CHUNKS</div>
                      <div className="font-bold text-[#e2e8f0]">
                        {hasLantern ? 'POE LANTERN ACTIVE' : 'MOTE TELLS ONLY'} · {totalGenerated} GEN
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                    <span className="text-[8px] text-[#94a3b8]">
                      No literal border walls: open doorways dynamically generate General, Side, End, or silent Loop chunks.
                    </span>
                    <div className="flex items-center gap-1">
                      {dirs.map((d) => {
                        const isTrue = activeNode.trueExitDir === d;
                        const isBlockedEnd =
                          activeNode.nodeType === 'end' && activeNode.returnDir !== d;
                        return (
                          <button
                            key={d}
                            disabled={!rooms || isBlockedEnd}
                            onClick={() => {
                              if (!rooms || isBlockedEnd) return;
                              if (transitionViaAetherDoor(rooms, state, d)) {
                                onResume();
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded-xs font-bold text-[8px] cursor-pointer ${
                              isBlockedEnd
                                ? 'bg-[#0f172a] text-[#475569] border border-[#1e293b] cursor-not-allowed'
                                : isTrue
                                  ? 'bg-[#0c4a6e] hover:bg-[#075985] text-[#7dd3fc] border border-[#38bdf8]'
                                  : 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] border border-[#475569]'
                            }`}
                          >
                            STEP {d} {isTrue ? '★' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* u00 Universe 20-World Catalog & Belldor Canonical 4-Zone Spec */}
            {(() => {
              const majorWorlds = U00_UNIVERSE_CATALOG.filter((w) => w.tier === 'major');
              const minorWorlds = U00_UNIVERSE_CATALOG.filter((w) => w.tier === 'minor');
              const unstableWorlds = U00_UNIVERSE_CATALOG.filter((w) => w.tier === 'unstable');
              const belldorZones = [
                AREA_REGISTRY.m00_the_bog,
                AREA_REGISTRY.camelot_border_town,
                AREA_REGISTRY.m01_orc_encampment,
                AREA_REGISTRY.camelot_interior,
              ].filter(Boolean);

              return (
                <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#1e293b] pb-1">
                    <span className="font-bold text-[#fbbf24] text-[10px]">
                      u00 UNIVERSE CATALOG (worlds.md §1 · 8 MAJOR, 7 MINOR, 5 UNSTABLE)
                    </span>
                    <span className="text-[8px] text-[#94a3b8]">
                      CANON = Original Story · NON-CANON = Folklore / Mythology
                    </span>
                  </div>

                  {/* Belldor 4-Zone Breakdown */}
                  <div className="space-y-1">
                    <div className="text-[8.5px] font-bold text-[#38bdf8]">
                      1. BELLDOR (CAMELOT) — ARTHURIAN, CANON · 4 ZONES (ONLY WORLD WITH ZONE DOCS):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {belldorZones.map((zone) => {
                        const isLocked = zone.specStatus === 'LOCKED';
                        const isCurrent = state.areaId === zone.id;
                        return (
                          <div
                            key={zone.id}
                            className={`p-1.5 rounded-xs border ${
                              isCurrent
                                ? 'bg-[#0f172a] border-[#38bdf8]'
                                : 'bg-[#0b111d] border-[#1e293b]'
                            } space-y-1`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[#f8fafc] text-[9px]">
                                {zone.name}
                              </span>
                              <span
                                className={`px-1 py-0.5 rounded-xs font-bold text-[7.5px] ${
                                  isLocked
                                    ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                                    : 'bg-[#451a03] text-[#fcd34d] border border-[#b45309]'
                                }`}
                              >
                                {zone.specStatus || 'LOCKED'}
                                {zone.docRef ? ` · ${zone.docRef}` : ''}
                              </span>
                            </div>
                            {zone.zoneFeatures && zone.zoneFeatures.length > 0 && (
                              <div className="space-y-0.5 pt-0.5 border-t border-[#1e293b]/70">
                                {zone.zoneFeatures.map((feat, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-1 text-[7.5px]"
                                  >
                                    <span className="text-[#cbd5e1] truncate">
                                      • {feat.name}
                                      {feat.detail ? ` — ${feat.detail}` : ''}
                                    </span>
                                    <span
                                      className={`shrink-0 font-bold ${
                                        feat.status === 'UNDEFINED'
                                          ? 'text-[#fbbf24]'
                                          : 'text-[#86efac]'
                                      }`}
                                    >
                                      {feat.openDesignId || feat.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 8 Major Worlds */}
                  <div className="space-y-1 pt-1 border-t border-[#1e293b]">
                    <div className="text-[8.5px] font-bold text-[#e2e8f0]">
                      MAJOR WORLDS (1–8 · worlds.md §1, LOCKED):
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[8px]">
                      {majorWorlds.map((w) => (
                        <div
                          key={w.id}
                          className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b] flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[#f8fafc] truncate">
                              {w.index}. {w.name}
                              {w.subtitle ? ` (${w.subtitle})` : ''}
                            </span>
                            <span
                              className={`text-[7px] font-bold px-1 rounded-xs ${
                                w.origin === 'canon'
                                  ? 'bg-[#1e1b4b] text-[#c4b5fd]'
                                  : 'bg-[#1e293b] text-[#94a3b8]'
                              }`}
                            >
                              {w.origin.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[7.5px] text-[#94a3b8] mt-0.5">
                            <span>{w.theme}</span>
                            <span
                              className={
                                w.hasZoneDocs ? 'text-[#86efac] font-bold' : 'text-[#fbbf24]'
                              }
                            >
                              {w.hasZoneDocs ? 'ZONE DOCS' : 'NO ZONE DOCS'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Minor & Unstable Worlds */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-[#1e293b] text-[8px]">
                    <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                      <div className="font-bold text-[#94a3b8] mb-0.5">
                        MINOR WORLDS ({minorWorlds.length} · ALL UNDEFINED):
                      </div>
                      <div className="text-[#cbd5e1]">
                        {minorWorlds.map((w) => w.name).join(' · ')}
                      </div>
                    </div>
                    <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                      <div className="font-bold text-[#f43f5e] mb-0.5">
                        UNSTABLE WORLDS ({unstableWorlds.length} · ALL UNDEFINED):
                      </div>
                      <div className="text-[#cbd5e1]">
                        {unstableWorlds.map((w) => w.name).join(' · ')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Lore Fast Travel 1: Colossal Waygates (Inter-World / Inter-Region Signature Transit) */}
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#67e8f9] text-[10px]">
                  COLOSSAL WAYGATES (Q) — INTER-WORLD ÆTHERIC SIGNATURE TRANSIT
                </span>
                <span className="text-[8px] text-[#94a3b8]">
                  UNDEFINED destination zones are sealed behind Waygate locks
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Object.values(WAYGATE_REGISTRY).map((wg) => {
                  const wgArea = AREA_REGISTRY[wg.areaId];
                  const isUndefinedSpec = wgArea?.specStatus === 'UNDEFINED';
                  const isDiscovered =
                    discoveredWg.includes(wg.id) || Boolean(state.bypassProgressionGates);
                  const isHere = state.room === wg.room;
                  return (
                    <div
                      key={wg.id}
                      className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-[#e0f2fe] text-[9.5px]">
                          {wg.name} · <span className="text-[#38bdf8]">{wg.world}</span>
                        </div>
                        <div className="text-[8px] text-[#94a3b8]">
                          Room [{wg.room}] ·{' '}
                          {isUndefinedSpec
                            ? `UNDEFINED (${wgArea?.openDesignId || wgArea?.docRef || 'worlds.md §1'})`
                            : `Alignment: ${wg.desyncStatus}`}
                        </div>
                      </div>
                      <button
                        disabled={!isDiscovered || !rooms}
                        onClick={() => {
                          if (!rooms) return;
                          if (fastTravelViaWaygate(rooms, state, wg.id)) {
                            onResume();
                          }
                        }}
                        className={`px-2 py-1 rounded-xs font-bold text-[8.5px] shrink-0 cursor-pointer ${
                          isUndefinedSpec
                            ? 'bg-[#451a03] text-[#fcd34d] border border-[#b45309]'
                            : isHere
                              ? 'bg-[#164e63] text-[#67e8f9] border border-[#22d3ee]'
                              : isDiscovered
                                ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
                                : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                        }`}
                      >
                        {isUndefinedSpec
                          ? 'SEALED (UNDEFINED)'
                          : isHere
                            ? 'AT WAYGATE'
                            : isDiscovered
                              ? 'WAYGATE TRANSIT'
                              : 'UNATTUNED'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lore Fast Travel 2: Æther Waystations (Discovered Area Fast Travel) */}
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#ffd27d] text-[10px]">
                  ÆTHER WAYSTATIONS (D / A) — DISCOVERED AREA FAST TRAVEL
                </span>
                <span className="text-[8px] text-[#94a3b8]">
                  LOCKED zones allow transit · UNDEFINED zones are veiled in Aether Fog
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Object.values(WAYSTATION_REGISTRY).map((ws) => {
                  const wsArea = AREA_REGISTRY[ws.areaId];
                  const isUndefinedSpec = wsArea?.specStatus === 'UNDEFINED';
                  const isDiscovered =
                    discoveredWs.includes(ws.id) || Boolean(state.bypassProgressionGates);
                  const isHere = state.room === ws.room;
                  return (
                    <div
                      key={ws.id}
                      className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-[#fef08a] text-[9.5px]">{ws.name}</div>
                        <div className="text-[8px] text-[#94a3b8]">
                          Zone: {wsArea?.name || ws.areaId} ·{' '}
                          {isUndefinedSpec
                            ? `UNDEFINED (${wsArea?.openDesignId || wsArea?.docRef})`
                            : `Room [${ws.room}]`}
                        </div>
                      </div>
                      <button
                        disabled={!isDiscovered || !rooms}
                        onClick={() => {
                          if (!rooms) return;
                          if (fastTravelToWaystation(rooms, state, ws.id)) {
                            onResume();
                          }
                        }}
                        className={`px-2 py-1 rounded-xs font-bold text-[8.5px] shrink-0 cursor-pointer ${
                          isUndefinedSpec
                            ? 'bg-[#451a03] text-[#fcd34d] border border-[#b45309]'
                            : isHere
                              ? 'bg-[#422006] text-[#fde68a] border border-[#f59e0b]'
                              : isDiscovered
                                ? 'bg-[#ca8a04] hover:bg-[#a16207] text-[#05070a]'
                                : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                        }`}
                      >
                        {isUndefinedSpec
                          ? 'FOG SEALED'
                          : isHere
                            ? 'CURRENT ROOM'
                            : isDiscovered
                              ? 'FAST TRAVEL'
                              : 'UNDISCOVERED'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5-Tier Global & Local Registry Summary */}
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
              <div className="text-[#c084fc] font-bold text-[9.5px]">
                NESTED ARCHITECTURE REGISTRIES (GLOBAL PROCEDURAL & LOCAL BESPOKE):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 text-[8.5px]">
                <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="font-bold text-[#e2e8f0]">
                    WORLDS ({U00_UNIVERSE_CATALOG.length})
                  </div>
                  <div className="text-[#94a3b8]">8 Major · 7 Minor · 5 Unstable</div>
                </div>
                <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="font-bold text-[#38bdf8]">AREAS ({Object.keys(AREA_REGISTRY).length})</div>
                  <div className="text-[#94a3b8]">LOCKED & UNDEFINED</div>
                </div>
                <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="font-bold text-[#ffd27d]">MAPS ({Object.keys(MAP_REGISTRY).length})</div>
                  <div className="text-[#94a3b8]">Global & Local</div>
                </div>
                <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="font-bold text-[#86efac]">
                    ROOMS ({Object.keys(LOCAL_ROOM_REGISTRY).length}L + {Object.keys(GLOBAL_ROOM_REGISTRY).length}G)
                  </div>
                  <div className="text-[#94a3b8]">Hybrid Stitched</div>
                </div>
                <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="font-bold text-[#c084fc]">BIOMES ({Object.keys(BIOME_REGISTRY).length})</div>
                  <div className="text-[#94a3b8]">Types, Rules, Assets</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
