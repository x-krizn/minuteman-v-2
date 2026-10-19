/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../database/characters';
import { getResolvedActionDescriptor } from '../database/equipment';
import { getItemDefinition } from '../database/items';
import { LEVEL_UNLOCK_SEQUENCE, CORE_COMBAT_LAWS } from '../database/progression/canonical_progression';
import { getWeaponDefinition } from '../database/weapons';
import {
  AREA_REGISTRY,
  BIOME_REGISTRY,
  getBiomeDefinition,
  GLOBAL_ROOM_REGISTRY,
  LOCAL_ROOM_REGISTRY,
  MAP_REGISTRY,
  REGION_REGISTRY,
  WAYGATE_REGISTRY,
  WAYSTATION_REGISTRY,
} from '../database/world';
import {
  consolidateInventorySlots,
  getOrionRoomsRef,
  getOrionStateRef,
  notifyOrionStateChange,
  subscribeOrionStateChange,
} from '../stateStore';
import {
  applyTraitLineProfile,
  ASSIGNABLE_ACTION_CATALOG,
  assignTriggerAction,
  awakenLadyOfTheLake,
  evaluateCathedralDoorStatus,
  fastTravelToWaystation,
  fastTravelViaWaygate,
  getActionCooldown,
  getRoomWorldInfo,
  isActionUnlocked,
  performWeaponSwap,
  resetTriggerActionsToDefault,
  resolveTriggerAction,
  setBypassProgressionGates,
  setTutorialStateActive,
  syncStateGates,
  triggerOrcRaid,
  triggerThreeKnightsTrial,
  TUTORIAL_STEP_DESCRIPTORS,
  TutorialStepId,
} from '../systems';
import { TraitLine } from '../types';

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

          {/* 6 Canonical Trait Lines & 3 Reactor Families */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8] font-bold text-[10px]">SIX TRAIT LINES & REACTOR FAMILIES:</span>
              <span className="text-[8.5px] text-[#38bdf8] font-bold">{trait.reactor.toUpperCase()} REACTOR</span>
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
                    <div className="font-bold text-[9px] text-[#ffd27d]">{tl.toUpperCase()}</div>
                    <div className="text-[7.5px] text-[#7dd3fc]">{prof.reactor} · {prof.baseArmor.type}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-[#cbd5e1]">{trait.identity}</div>
            <div className="text-[9px] text-[#64748b] italic">{trait.lore}</div>
          </div>

          {/* Mobility & Equipped Feats */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between">
            <div>
              <div className="font-bold text-[#e2e8f0]">BOOSTER KIT & ACTIVE FEATS</div>
              <div className="text-[9px] text-[#94a3b8]">
                {state.equippedFeats.includes('knights_oath')
                  ? "Knight's Oath Feat Active (+25% dmg vs Camelot enemies)"
                  : gates.canBoosterDash
                  ? 'Tap [B] Dodge Burst · Hold [B] Continuous Boost (until overheat)'
                  : 'Booster Offline: Salvage Fallen Scout [S] or unlock Level 2 Legs slot'}
              </div>
            </div>
            <span className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${gates.canBoosterDash ? 'bg-[#15803d] text-white' : 'bg-[#334155] text-[#94a3b8]'}`}>
              {gates.canBoosterDash ? 'ONLINE' : 'OFFLINE'}
            </span>
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

          {/*Equipped Hardpoints Selector */}
          <div className="text-[10px] font-bold text-[#94a3b8]">
            EQUIPPED HARDPOINTS (TAP [Y] LOCK-ON · HOLD [Y] SWAP WEAPON · MAX SLOTS: {gates.maxWeaponSlots}):
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {state.equippedWeapons.map((wId, idx) => {
              const wDef = getWeaponDefinition(wId);
              const isSelected = idx === state.activeWeaponIndex;
              return (
                <button
                  key={`${wId}-${idx}`}
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
                  className={`p-2 rounded-xs border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#172554]/70 border-[#38bdf8] shadow-sm'
                      : 'bg-[#090d14] border-[#1e293b] hover:border-[#475569]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-[#94a3b8]">SLOT {idx + 1}</span>
                    <span
                      className={`px-1 py-0.2 rounded-xs text-[8px] font-bold ${
                        isSelected ? 'bg-[#38bdf8] text-[#05070a]' : 'bg-[#1e293b] text-[#94a3b8]'
                      }`}
                    >
                      {isSelected ? 'ACTIVE' : 'EQUIP'}
                    </span>
                  </div>
                  <div className="text-[10.5px] font-bold text-[#ffd27d] mt-0.5 truncate">
                    {wDef?.name || wId}
                  </div>
                  <div className="text-[8.5px] text-[#64748b] truncate">
                    {wDef?.class} · {wDef?.shotsPerChain} Rounds
                  </div>
                </button>
              );
            })}
          </div>

          {/* Multi-Source Assignable Action Catalog (Weapon Skills, Hardware Modules, Reactor Abilities) */}
          <div className="text-[10px] font-bold text-[#94a3b8] pt-1">
            ASSIGN [L] & [R] ACTIONS (WEAPON SKILLS · HARDWARE MODULES · REACTOR CORE):
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
                          : 'REACTOR'}
                      </span>
                      <span className="font-bold text-[#e2e8f0] truncate">{resolved.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
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
                  {def.onUse && (
                    <button
                      onClick={() => handleUseItem(slot.itemId)}
                      className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] font-bold rounded-xs border border-[#475569] text-[9px] shrink-0 ml-2"
                    >
                      USE
                    </button>
                  )}
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

          {/* Core Combat Laws */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
            <div className="text-[#ffd27d] font-bold text-[10px]">THE SIX CORE COMBAT LAWS:</div>
            {CORE_COMBAT_LAWS.map((law, idx) => (
              <div key={idx} className="text-[9px] text-[#cbd5e1] border-l-2 border-[#38bdf8] pl-1.5 py-0.5">
                {law}
              </div>
            ))}
          </div>

            {/* Level Unlocks Timeline */}
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
              <div className="text-[#38bdf8] font-bold text-[10px]">HORIZONTAL PROGRESSION TIMELINE (LEVELS 1–20):</div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {LEVEL_UNLOCK_SEQUENCE.map((lvl) => (
                  <div
                    key={lvl.level}
                    className={`p-1 rounded-xs flex items-center justify-between text-[9px] ${
                      state.level >= lvl.level || state.bypassProgressionGates
                        ? 'bg-[#1e293b] text-[#e2e8f0]'
                        : 'bg-[#090d14] text-[#64748b]'
                    }`}
                  >
                    <span className="font-bold">LVL {lvl.level}: {lvl.unlock}</span>
                    <span className="italic">{lvl.learningFocus}</span>
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

            {/* Lore Fast Travel 1: Colossal Waygates (Inter-World / Inter-Region Signature Transit) */}
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#67e8f9] text-[10px]">
                  COLOSSAL WAYGATES (Q) — INTER-WORLD ÆTHERIC SIGNATURE TRANSIT
                </span>
                <span className="text-[8px] text-[#94a3b8]">
                  Reads pilot ætheric signature across aligned worlds
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Object.values(WAYGATE_REGISTRY).map((wg) => {
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
                          Room [{wg.room}] · Alignment: {wg.desyncStatus}
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
                          isHere
                            ? 'bg-[#164e63] text-[#67e8f9] border border-[#22d3ee]'
                            : isDiscovered
                              ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
                              : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                        }`}
                      >
                        {isHere ? 'AT WAYGATE' : isDiscovered ? 'WAYGATE TRANSIT' : 'UNATTUNED'}
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
                  Entire world also traversable room-to-room on foot
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Object.values(WAYSTATION_REGISTRY).map((ws) => {
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
                          Area: {AREA_REGISTRY[ws.areaId]?.name || ws.areaId} · Room [{ws.room}]
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
                          isHere
                            ? 'bg-[#422006] text-[#fde68a] border border-[#f59e0b]'
                            : isDiscovered
                              ? 'bg-[#ca8a04] hover:bg-[#a16207] text-[#05070a]'
                              : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                        }`}
                      >
                        {isHere ? 'CURRENT ROOM' : isDiscovered ? 'FAST TRAVEL' : 'UNDISCOVERED'}
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
                  <div className="font-bold text-[#e2e8f0]">REGIONS ({Object.keys(REGION_REGISTRY).length})</div>
                  <div className="text-[#94a3b8]">Global & Local</div>
                </div>
                <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="font-bold text-[#38bdf8]">AREAS ({Object.keys(AREA_REGISTRY).length})</div>
                  <div className="text-[#94a3b8]">Global & Local</div>
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
