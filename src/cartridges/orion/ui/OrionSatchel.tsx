/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import { performWeaponSwap } from '../combat';
import { getItemDefinition } from '../database/items';
import { getWeaponDefinition } from '../database/weapons';
import { TRAIT_REGISTRY } from '../database/characters/trait_lines';
import { LEVEL_UNLOCK_SEQUENCE, CORE_COMBAT_LAWS } from '../database/progression/canonical_progression';
import {
  consolidateInventorySlots,
  getOrionStateRef,
  notifyOrionStateChange,
  subscribeOrionStateChange,
} from '../stateStore';
import {
  applyTraitLineProfile,
  setBypassProgressionGates,
  setTutorialStateActive,
  syncStateGates,
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
  const [tab, setTab] = useState<'status' | 'weapons' | 'inventory' | 'progression'>('status');
  const [, setRefresh] = useState(0);

  useEffect(() => {
    return subscribeOrionStateChange(() => setRefresh((r) => r + 1));
  }, []);

  const state = getOrionStateRef();
  if (!state) return null;

  const gates = syncStateGates(state);
  const currentWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const currentWeapon = getWeaponDefinition(currentWeaponId);
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;

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
            WEAPONS
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

          {/* Mobility Systems */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between">
            <div>
              <div className="font-bold text-[#e2e8f0]">BOOSTER KIT ASSEMBLY</div>
              <div className="text-[9px] text-[#94a3b8]">
                {gates.canBoosterDash
                  ? 'Active: Lateral evasion dash (+20 Heat) & chasm clearance'
                  : 'Inactive: Salvage Fallen Scout [S] or unlock Level 2 Legs slot'}
              </div>
            </div>
            <span className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${gates.canBoosterDash ? 'bg-[#15803d] text-white' : 'bg-[#334155] text-[#94a3b8]'}`}>
              {gates.canBoosterDash ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      )}

      {/* Tab: WEAPONS & MOVESET */}
      {tab === 'weapons' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
          {/* Equipped Hardpoints Selector */}
          <div className="text-[10px] font-bold text-[#94a3b8]">
            EQUIPPED HARDPOINTS (PRESS [Y] IN COMBAT TO SWAP · MAX SLOTS: {gates.maxWeaponSlots}):
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

          {/* Active Weapon Card */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] text-[#94a3b8]">ACTIVE WEAPON (SLOT {state.activeWeaponIndex + 1}):</span>
                <div className="text-[#ffd27d] font-bold text-[11px]">{currentWeapon?.name}</div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-[#38bdf8]">
                  {currentWeaponId === 'khopesh' ? 'COMBO' : 'AMMO'}: {state.ammo} / {state.maxAmmo}
                </span>
                <div className="text-[9px] text-[#94a3b8]">
                  SWAP CD: {state.weaponSwapCooldown > 0 ? `${state.weaponSwapCooldown.toFixed(1)}s` : 'READY'}
                </div>
              </div>
            </div>
            <div className="text-[9px] text-[#94a3b8]">{currentWeapon?.description}</div>
          </div>

          {/* 5-Action Moveset List */}
          <div className="text-[10px] font-bold text-[#94a3b8] pt-1">EQUIPPED MOVESET & COMBAT TELLS:</div>
          <div className="space-y-1">
            {currentWeapon?.moveset.map((action) => {
              const isUnlocked = gates.unlockedSkillSlots.includes(action.slot);
              return (
                <div
                  key={action.slot}
                  className={`p-1.5 bg-[#090d14] rounded-xs border space-y-0.5 ${
                    isUnlocked ? 'border-[#1e293b]' : 'border-[#334155]/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#e2e8f0]">
                      [{action.slot === 0 ? 'X BUTTON' : action.slot === 1 ? 'L TRIGGER' : action.slot === 2 ? 'R TRIGGER' : `SLOT ${action.slot}`}] {action.name}
                    </span>
                    <span className="text-[9px] text-[#ffd27d]">
                      {isUnlocked ? `${action.damage} ${action.damageType} (${action.damageFamily})` : 'LOCKED (LVL 4+)'}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#94a3b8]">{action.description}</div>
                  <div className="flex gap-2 text-[8px] text-[#64748b]">
                    <span>TELL: {action.tellDurationSec}s</span>
                    <span>COOLDOWN: {action.cooldownSec}s</span>
                    <span>HEAT: +{action.heatCost}</span>
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

      {/* Tab: MULTI-DOMAIN STATE GATES, PROGRESSION & CORE COMBAT LAWS */}
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

            {/* Gate 3: Active Spawn Anchor & Incursion State */}
            <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b] text-[8.5px]">
              <span className="text-[#94a3b8]">
                SPAWN ANCHOR: <b className="text-[#e2e8f0]">{state.spawnAnchor.areaId} [{state.spawnAnchor.room}]</b>
              </span>
              <span className="text-[#94a3b8]">
                INCURSION: <b className="text-[#c084fc]">{state.incursionEnabled ? 'ACTIVE' : 'DORMANT'}</b>
              </span>
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
    </div>
  );
};
