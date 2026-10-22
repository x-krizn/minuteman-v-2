/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../database/characters';
import {
  CLASS_UTILITY_CATALOG,
  getClassUtilityDefinition,
  getResolvedActionDescriptor,
} from '../database/equipment';
import { getItemDefinition } from '../database/items';
import { getCoinPickupSpriteBase64 } from '../database/items/salvage_scrap';
import {
  ACTION_MODIFICATION_CATALOG,
  CORE_COMBAT_LAWS,
  FRAME_FEAT_CATALOG,
  fundPilotSkillWithGem,
  GEMSTONE_CATALOG,
  GEMSTONE_REGISTRY,
  generateEquipmentModWithGems,
  getInventoryGemCount,
  getRetainedBuildGemCounts,
  getWeaponGemVisuals,
  isEquipmentUnlocked,
  isFeatNodeAvailable,
  LEVEL_UNLOCK_SEQUENCE,
  normalizePilotSkills,
  PILOT_SKILL_DEFINITIONS,
  refundInventoryGem,
  toggleFeatNodeGemSocket,
} from '../database/progression';
import { getWeaponDefinition, WEAPON_REGISTRY } from '../database/weapons';
import {
  AREA_REGISTRY,
  getBiomeDefinition,
  U00_UNIVERSE_CATALOG,
  WAYGATE_REGISTRY,
  WAYSTATION_REGISTRY,
} from '../database/world';
import {
  activateUtilityOrBeltSlot,
  addOrionInventoryItem,
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
  ORION_ROOM_METADATA,
  performAuxiliarySwap,
  resetAetherFogGraph,
  resetTriggerActionsToDefault,
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

const SpriteCanvasIcon: React.FC<{
  base64?: string;
  col?: number;
  cellWidth?: number;
  cellHeight?: number;
  sizeClass?: string;
}> = ({ base64, col = 0, cellWidth = 16, cellHeight = 16, sizeClass = 'w-4 h-4' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !base64) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 16, 16);
    const dataUri = base64.startsWith('data:image/')
      ? base64
      : `data:image/png;base64,${base64}`;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, col * cellWidth, 0, cellWidth, cellHeight, 0, 0, 16, 16);
    };
    img.src = dataUri;
  }, [base64, col, cellWidth, cellHeight]);

  if (!base64) return null;
  return (
    <canvas
      ref={canvasRef}
      width={16}
      height={16}
      className={`${sizeClass} shrink-0 [image-rendering:pixelated]`}
    />
  );
};

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
              PILOT: <b className="text-[#38bdf8]">{state.pilotName}</b> ({state.traitLine})
            </span>
            <span>
              REACTOR: <b className="text-[#c084fc]">{state.reactor}</b>
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

          {/* Active Frame Identity (Full 6-Class Hot-Swap only in Cheat Room Mode) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8] font-bold text-[10px]">
                {isCheatMode ? 'CHEAT ROOM CLASS SWITCHER:' : 'PILOT MECH CHASSIS:'}
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
                  <span>SLOT 1 (MAIN-HAND)</span>
                  <span className="text-[#86efac]">SKILLS 1, 2, 3</span>
                </div>
                <div className="text-[#cbd5e1] truncate mt-0.5">
                  {getWeaponDefinition(state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster')?.name}
                </div>
                <div className="text-[7px] text-[#94a3b8]">
                  Handing: {getWeaponDefinition(state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster')?.handing || '1-hand'}
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#38bdf8]/40">
                <div className="flex justify-between font-bold text-[#38bdf8]">
                  <span>SLOT 2 (OFF-HAND / BELT)</span>
                  <span className="text-[#86efac]">SKILLS 4, 5</span>
                </div>
                <div className="text-[#cbd5e1] truncate mt-0.5">
                  {getWeaponDefinition(state.equipmentSlots?.slot2 || state.equippedWeapons[1] || '')?.name ||
                    getItemDefinition(state.equipmentSlots?.slot2 || '')?.name ||
                    (state.equipmentSlots?.slot2 ? state.equipmentSlots.slot2 : '—')}
                </div>
                <div className="text-[7px] text-[#94a3b8]">
                  {getWeaponDefinition(state.equipmentSlots?.slot1 || '')?.handing === '2-hand'
                    ? (getItemDefinition(state.equipmentSlots?.slot2 || '') ? 'Belt Consumable Active' : 'Dormant (2H Main Equipped)')
                    : 'Off-Hand Handing Active'}
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#c084fc]/40">
                <div className="flex justify-between font-bold text-[#c084fc]">
                  <span>SLOT 3 (AUX / BUFF / BELT)</span>
                  <span className="text-[#86efac]">HOLD [L] SWAP</span>
                </div>
                <div className="text-[#cbd5e1] truncate mt-0.5">
                  {getWeaponDefinition(state.equipmentSlots?.slot3 || '')?.name ||
                    getItemDefinition(state.equipmentSlots?.slot3 || '')?.name ||
                    (state.equipmentSlots?.slot3 ? state.equipmentSlots.slot3 : '—')}
                </div>
                <div className="text-[7px] text-[#94a3b8]">
                  Swaps with Slot 1 (or 2 if off-hand)
                </div>
              </div>

              <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="flex justify-between font-bold text-[#4ade80]">
                  <span>CHASSIS HARDWARE (4)</span>
                  <span className="text-[#38bdf8]">ARMOR</span>
                </div>
                <div className="text-[#94a3b8] truncate mt-0.5">
                  Head · Arms · Plating (Cuirass)
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
                  <span className="text-[#86efac]">5 SKILLS</span>
                </div>
                <div className="text-[#94a3b8] truncate mt-0.5">
                  X: S1 · Y: S2/S4 · R: S3/S5 · L: Lock/Swap
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: MULTI-SOURCE ACTIONS (X, L, R) & WEAPON HARDPOINTS */}
      {tab === 'weapons' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
          {/* Active Action Bindings Summary (X, Y, R, L) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#38bdf8] font-bold text-[10px]">
                COMBAT CONTROLLER ENGINE & 5-SKILL MAPPINGS
              </span>
              <button
                onClick={() => {
                  soundSystem.playSelect();
                  resetTriggerActionsToDefault(state);
                }}
                className="px-1.5 py-0.2 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs text-[8px] font-bold text-[#ffd27d] cursor-pointer"
              >
                DEFAULT BINDINGS
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[8px]">
              {/* X: Skill 1 */}
              <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                <div className="text-[#38bdf8] font-bold">[X] SKILL 1</div>
                <div className="text-[#ffd27d] font-bold truncate mt-0.5">
                  {currentWeapon?.moveset[0]?.name || 'Primary Salvo'}
                </div>
                <div className="text-[7px] text-[#94a3b8] mt-0.5">
                  Tap: Manual · 2x: Reload · Hold: Auto Chain
                </div>
              </div>

              {/* Y: Skill 2 & Skill 4 */}
              <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#fbbf24]/40">
                <div className="text-[#fbbf24] font-bold">[Y] SKILL 2 / 4</div>
                <div className="text-[#e2e8f0] font-bold truncate mt-0.5">
                  {currentWeapon?.moveset[1]?.name || 'Special 1'}
                </div>
                <div className="text-[7px] text-[#94a3b8] mt-0.5">
                  Tap: Skill 2 · 2x: Reload · Hold: Skill 4
                </div>
              </div>

              {/* R: Skill 3 & Skill 5 */}
              <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#c084fc]/40">
                <div className="text-[#c084fc] font-bold">[R] SKILL 3 / 5</div>
                <div className="text-[#e2e8f0] font-bold truncate mt-0.5">
                  {currentWeapon?.moveset[2]?.name || 'Special 2'}
                </div>
                <div className="text-[7px] text-[#94a3b8] mt-0.5">
                  Tap: Skill 3 · 2x: Reload · Hold: Skill 5
                </div>
              </div>

              {/* L: Lock-On & Swap */}
              <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#38bdf8]/50">
                <div className="text-[#38bdf8] font-bold">[L] LOCK / SWAP</div>
                <div className="text-[#e2e8f0] font-bold truncate mt-0.5">
                  {state.lockedTargetId ? 'Target Locked' : 'Auto-Aim / Cycle'}
                </div>
                <div className="text-[7px] text-[#94a3b8] mt-0.5">
                  Tap: Lock/Cycle · 2x: Unlock · Hold: Swap Aux
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Slots 1, 2, 3 (Main-Hand, Off-Hand/Belt, Auxiliary/Buff/Belt) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between text-[9.5px] font-bold text-[#94a3b8]">
              <span>
                EQUIPMENT SLOTS 1–3 (MAIN-HAND · OFF-HAND · AUXILIARY · EFF LOAD: {gates.effectiveLoadCapacity.toUpperCase()})
              </span>
              <span className="text-[#ffd27d]">{gates.loadPenalty.label}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {[
                {
                  slotIdx: 0,
                  slotKey: 'slot1' as const,
                  label: 'SLOT 1 · MAIN-HAND',
                  sub: 'Skills 1, 2, 3 (+ 4, 5 if 2H)',
                  wId: state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster',
                },
                {
                  slotIdx: 1,
                  slotKey: 'slot2' as const,
                  label: 'SLOT 2 · OFF-HAND / BELT',
                  sub: 'Skills 4, 5 (or Belt Item)',
                  wId: state.equipmentSlots?.slot2 || state.equippedWeapons[1] || '',
                },
                {
                  slotIdx: 2,
                  slotKey: 'slot3' as const,
                  label: 'SLOT 3 · AUX / BUFF / BELT',
                  sub: 'Hold [L] to swap with Slot 1/2',
                  wId: state.equipmentSlots?.slot3 || '',
                },
              ].map((sInfo) => {
                const wId = sInfo.wId;
                const wDef = wId ? getWeaponDefinition(wId) : undefined;
                const itemDef = wId && !wDef ? getItemDefinition(wId) : undefined;
                const isSelected = sInfo.slotIdx === 0;
                const gemVis = wDef ? getWeaponGemVisuals(state, wId) : null;
                const stripBase64 = wDef?.variantStripBase64 || wDef?.hardpointSprite?.base64;

                return (
                  <div
                    key={sInfo.slotKey}
                    className={`p-1.5 rounded-xs border transition-colors space-y-1 ${
                      isSelected
                        ? 'bg-[#172554]/70 border-[#38bdf8]'
                        : 'bg-[#0f172a] border-[#1e293b]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold text-[#ffd27d]">
                        {sInfo.label}
                      </span>
                      {sInfo.slotIdx === 2 && wId && (
                        <button
                          onClick={() => {
                            performAuxiliarySwap(state, {
                              say: (txt) => {
                                state.toastText = txt;
                                state.toastTimer = 2.5;
                              },
                            });
                          }}
                          className="px-1.5 py-0.2 rounded-xs text-[7.5px] font-bold bg-[#422006]/90 hover:bg-[#713f12] text-[#fbbf24] border border-[#f59e0b]/60 cursor-pointer"
                        >
                          SWAP [L]
                        </button>
                      )}
                    </div>

                    <div className="text-[7px] text-[#94a3b8]">
                      {sInfo.sub}
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
                          <div className="text-[9.5px] font-bold text-[#ffd27d] truncate">
                            {wDef?.name || itemDef?.name || (wId ? wId : '(Empty Slot)')}
                          </div>
                          {wDef && (
                            <div className="text-[7.5px] text-[#7dd3fc] truncate">
                              {wDef.handing?.toUpperCase()} · {(wDef.equipmentRole || 'melee').toUpperCase()} · {(wDef.weightClass || 'medium').toUpperCase()}
                              {wDef.passiveShieldBonus ? ` · +${wDef.passiveShieldBonus} SHIELD` : ''}
                            </div>
                          )}
                          {itemDef && (
                            <div className="text-[7.5px] text-[#4ade80] truncate">
                              BELT CONSUMABLE · {itemDef.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Equip Discovered Weapon */}
                    <div className="space-y-0.5 pt-0.5">
                      <div className="text-[7.5px] text-[#94a3b8] font-bold">
                        EQUIP INTO {sInfo.slotKey.toUpperCase()}:
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {Object.values(WEAPON_REGISTRY)
                          .filter(
                            (candidate) =>
                              isCheatMode ||
                              isEquipmentUnlocked(state, candidate.id) ||
                              wId === candidate.id
                          )
                          .map((candidate) => {
                            const candGemVis = getWeaponGemVisuals(state, candidate.id);
                            const candStrip =
                              candidate.variantStripBase64 || candidate.hardpointSprite?.base64;
                            const unlocked =
                              isCheatMode || isEquipmentUnlocked(state, candidate.id);
                            return (
                              <button
                                key={candidate.id}
                                disabled={!unlocked}
                                onClick={() => {
                                  if (!unlocked) return;
                                  soundSystem.playSelect();
                                  if (state.equipmentSlots) {
                                    state.equipmentSlots[sInfo.slotKey] = candidate.id;
                                  }
                                  state.equippedWeapons = [
                                    state.equipmentSlots?.slot1,
                                    state.equipmentSlots?.slot2,
                                    state.equipmentSlots?.slot3,
                                  ].filter(Boolean) as string[];
                                  if (sInfo.slotIdx === 0) {
                                    state.maxAmmo = candidate.shotsPerChain;
                                    state.ammo = candidate.shotsPerChain;
                                    state.reloadDuration = candidate.reloadDurationSec;
                                  }
                                  syncStateGates(state);
                                  notifyOrionStateChange();
                                }}
                                className={`flex items-center gap-0.5 px-1 py-0.5 rounded-xs text-[7px] font-bold border ${
                                  wId === candidate.id
                                    ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24] cursor-pointer'
                                    : 'bg-[#090d14] text-[#94a3b8] border-[#334155] hover:border-[#64748b] cursor-pointer'
                                }`}
                              >
                                <SpriteCanvasIcon
                                  base64={candStrip}
                                  col={candGemVis.colIndex}
                                  sizeClass="w-3 h-3"
                                />
                                <span>{candidate.name.split(' ')[0]}</span>
                              </button>
                            );
                          })}

                        {/* If Slot 2 or Slot 3: Allow slotting Consumables directly */}
                        {sInfo.slotIdx >= 1 &&
                          state.inventorySlots
                            .filter(
                              (s) => Boolean(getItemDefinition(s.itemId)?.onUse)
                            )
                            .map((invSlot) => {
                              const itmDef = getItemDefinition(invSlot.itemId);
                              if (!itmDef) return null;
                              const isCur = wId === invSlot.itemId;
                              return (
                                <button
                                  key={invSlot.itemId}
                                  onClick={() => {
                                    soundSystem.playSelect();
                                    if (state.equipmentSlots) {
                                      state.equipmentSlots[sInfo.slotKey] = invSlot.itemId;
                                    }
                                    state.equippedWeapons = [
                                      state.equipmentSlots?.slot1,
                                      state.equipmentSlots?.slot2,
                                      state.equipmentSlots?.slot3,
                                    ].filter(Boolean) as string[];
                                    syncStateGates(state);
                                    notifyOrionStateChange();
                                  }}
                                  title={`Slot Belt Consumable: ${itmDef.name} (x${invSlot.count})`}
                                  className={`flex items-center gap-0.5 px-1 py-0.5 rounded-xs text-[7px] font-bold border cursor-pointer ${
                                    isCur
                                      ? 'bg-[#4ade80] text-[#05070a] border-[#86efac]'
                                      : 'bg-[#090d14] text-[#86efac] border-[#166534] hover:border-[#4ade80]'
                                  }`}
                                >
                                  <span>🧪 {itmDef.name.split(' ')[0]} (x{invSlot.count})</span>
                                </button>
                              );
                            })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* §4.2 Equipment Action Modifications (Gem Use 3: Gems Spent to Generate; Mod Retained) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-[#c084fc]">
                EQUIPMENT ACTION MODS (GEM USE 3 — GEMS SPENT TO GENERATE; MOD RETAINED):
              </span>
              <span className="text-[8px] text-[#94a3b8]">
                {(state.equipmentSlots?.unlockedMods || []).length} / {ACTION_MODIFICATION_CATALOG.length} MODS RETAINED
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ACTION_MODIFICATION_CATALOG.map((mod) => {
                const slotKey = mod.targetCategory === 'all' ? 'ranged' : mod.targetCategory;
                const unlockedMods = state.equipmentSlots?.unlockedMods || [];
                const isGenerated =
                  unlockedMods.includes(mod.id) || Boolean(state.bypassProgressionGates);
                const isInstalled = state.equipmentSlots?.installedMods?.[slotKey] === mod.id;
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
                        : isGenerated
                          ? 'bg-[#0f172a] border-[#334155]'
                          : 'bg-[#0b111d] border-[#1e293b]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                          {mod.name} [{mod.targetCategory.toUpperCase()}]
                        </span>
                        <span
                          className={`text-[7px] font-bold px-1 rounded-xs ${
                            isInstalled
                              ? 'bg-[#c084fc] text-[#05070a]'
                              : isGenerated
                                ? 'bg-[#064e3b] text-[#6ee7b7]'
                                : 'bg-[#1e293b] text-[#fbbf24]'
                          }`}
                        >
                          {isInstalled
                            ? 'INSTALLED'
                            : isGenerated
                              ? 'RETAINED'
                              : 'UNSYNTHESIZED'}
                        </span>
                      </div>
                      <div className="text-[7.5px] text-[#86efac] mt-0.5">
                        + {mod.gainDescription}
                      </div>
                      <div className="text-[7.5px] text-[#f87171]">
                        − {mod.drawbackDescription}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e293b]/80">
                      <span className="text-[7.5px] text-[#cbd5e1] truncate">
                        {isGenerated ? 'Mod Retained in Build' : `Recipe: ${costText}`}
                      </span>
                      {isGenerated ? (
                        <button
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
                          className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#c084fc]/60 rounded-xs text-[7.5px] font-bold text-[#e9d5ff] cursor-pointer shrink-0"
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
                                state.equipmentSlots.installedMods[slotKey] = mod.id;
                              }
                            } else {
                              soundSystem.playMenuBeep();
                            }
                            notifyOrionStateChange();
                          }}
                          className="px-2 py-0.5 bg-[#4c1d95] hover:bg-[#5b21b6] border border-[#a855f7] rounded-xs text-[7.5px] font-bold text-white cursor-pointer shrink-0"
                        >
                          ◆ GENERATE MOD
                        </button>
                      )}
                    </div>
                  </div>
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
              {CLASS_UTILITY_CATALOG.filter(
                (u) => isCheatMode || u.traitLine === state.traitLine
              ).map((u) => {
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
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-[#94a3b8]">
              SALVAGED CONSUMABLES, GEMSTONES, RELICS & BELT FLASKS:
            </span>
            {isCheatMode && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    soundSystem.playPowerup();
                    for (const flaskId of [
                      'grail_water',
                      'repair_kit',
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
                  className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#8dd7ad]/60 rounded-xs font-bold text-[8px] text-[#8dd7ad] cursor-pointer"
                >
                  +1 ALL 9 FLASKS
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
                      'poe_lantern_charm',
                    ]) {
                      addOrionInventoryItem(state, relicId, 1);
                    }
                    state.toastText = 'ADDED ROW 1 KEYS, LOCK & RELIC ARTIFACTS TO SATCHEL';
                    state.toastTimer = 2.5;
                    notifyOrionStateChange();
                  }}
                  className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#ffd27d]/60 rounded-xs font-bold text-[8px] text-[#ffd27d] cursor-pointer"
                >
                  +1 RELICS & KEYS
                </button>
              </div>
            )}
          </div>
          {state.inventorySlots.length === 0 ? (
            <div className="text-center text-[#64748b] py-6 italic">No salvage in satchel. Explore drop-pod marshlands and loot caches.</div>
          ) : (
            consolidateInventorySlots(state.inventorySlots).map((slot, idx) => {
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
                      <span className="ml-1 text-[8px] uppercase px-1 py-0.2 rounded-xs bg-[#1e293b] text-[#94a3b8]">
                        {isGem ? 'gemstone' : def.category}
                      </span>
                    </div>
                    <div className="text-[9px] text-[#94a3b8]">{def.description}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isGem && (
                      <>
                        <button
                          onClick={() => {
                            soundSystem.playSelect();
                            setTab('progression');
                          }}
                          className="px-1.5 py-1 bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] font-bold rounded-xs border border-[#38bdf8]/60 text-[8px] cursor-pointer"
                          title="Level Pilot Skills or Socket Feat Nodes with this Gem"
                        >
                          SKILLS / FEATS
                        </button>
                        <button
                          onClick={() => {
                            soundSystem.playSelect();
                            setTab('weapons');
                          }}
                          className="px-1.5 py-1 bg-[#3b0764] hover:bg-[#4c1d95] text-[#e9d5ff] font-bold rounded-xs border border-[#c084fc]/60 text-[8px] cursor-pointer"
                          title="Modify Weapons or Generate Equipment Action Mods with this Gem"
                        >
                          MODIFY GEAR
                        </button>
                      </>
                    )}
                    {def.category === 'consumable' &&
                      [0, 1, 2, 3].map((bIdx) => {
                        const isSlotted = state.equipmentSlots?.belt?.[bIdx] === slot.itemId;
                        return (
                          <button
                            key={bIdx}
                            onClick={() => {
                              soundSystem.playSelect();
                              if (state.equipmentSlots) {
                                const belt: [string | null, string | null, string | null, string | null] =
                                  state.equipmentSlots.belt ? [...state.equipmentSlots.belt] : [null, null, null, null];
                                belt[bIdx] = slot.itemId;
                                state.equipmentSlots.belt = belt;
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

                {/* Gem Use 1: 6 Trait Line Pilot Skills (Levels 1-20 -> Unlocks 5 Feat Tiers I-V) */}
                <div className="pt-1 border-t border-[#1e293b] space-y-1">
                  <div className="flex items-center justify-between text-[8.5px]">
                    <span className="font-bold text-[#ffd27d]">
                      GEM USE 1 — 6 TRAIT LINE PILOT SKILLS (LV 1–20 · GEMS PERMANENTLY CONSUMED):
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

                {/* Gem Use 2: Feat Nodes (Tiers I-V, Specific Trait + Reactor Gem Sockets, Refunded on Unsocket) */}
                <div className="pt-1 border-t border-[#1e293b] space-y-1">
                  <div className="flex items-center justify-between text-[8.5px]">
                    <span className="font-bold text-[#ffd27d]">
                      GEM USE 2 — FEAT NODES (SOCKET GEMS RETAINED IN BUILD · REFUNDED ON UNSOCKET):
                    </span>
                    <span className="text-[#86efac] font-bold">
                      ACTIVE FEATS: {state.equippedFeats.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {FRAME_FEAT_CATALOG.map((feat) => {
                      const isTierOpen = isFeatNodeAvailable(state, feat);
                      const isEquipped = state.equippedFeats.includes(feat.id);
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
                              [{feat.tier} · {feat.requiredSkillId} Lv.{feat.requiredSkillLevel}] {feat.name}
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
      {tab === 'world' && (() => {
        const worldInfo = getRoomWorldInfo(state);
        const activeBiome = getBiomeDefinition(state.biomeId);
        const rooms = getOrionRoomsRef();
        const discoveredWs = (state.discoveredWaystations || []).filter(
          (id) => id !== 'ws_bog_drop_pod'
        );
        const discoveredWg = state.discoveredWaygates || [];

        return (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px]">
            {/* Current Location Summary */}
            <div className="p-2 bg-[#0f172a] rounded-xs border border-[#22d3ee]/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#22d3ee] text-[10px]">
                  {isCheatMode
                    ? 'ACTIVE 5-TIER NESTED WORLD HIERARCHY (CHEAT ROOM VIEW)'
                    : 'CURRENT LOCATION & SPAWN ANCHOR'}
                </span>
                {isCheatMode && (
                  <button
                    onClick={() => {
                      state.discoveredWaystations = Object.keys(WAYSTATION_REGISTRY);
                      state.discoveredWaygates = Object.keys(WAYGATE_REGISTRY);
                      soundSystem.playPowerup();
                      notifyOrionStateChange();
                    }}
                    className="px-1.5 py-0.5 bg-[#164e63] hover:bg-[#0e7490] text-[#e0f2fe] border border-[#22d3ee]/60 rounded-xs font-bold text-[8px] cursor-pointer"
                  >
                    ATTUNE ALL CAMPFIRES & WAYGATES
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1">
                <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
                  <div className="text-[8px] text-[#94a3b8]">ZONE</div>
                  <div className="font-bold text-[#38bdf8] truncate">{worldInfo.areaName}</div>
                </div>
                <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
                  <div className="text-[8px] text-[#94a3b8]">SECTOR</div>
                  <div className="font-bold text-[#86efac] truncate">{worldInfo.roomTitle}</div>
                </div>
                <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
                  <div className="text-[8px] text-[#94a3b8]">BIOME</div>
                  <div className="font-bold text-[#c084fc] truncate">{worldInfo.biomeName}</div>
                </div>
                <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
                  <div className="text-[8px] text-[#94a3b8]">SPAWN ANCHOR</div>
                  <div className="font-bold text-[#ffd27d] truncate">
                    {ORION_ROOM_METADATA[state.spawnAnchor?.room || '-3,0']?.title ||
                      `Room [${state.spawnAnchor?.room || '-3,0'}]`}
                  </div>
                </div>
              </div>
              {isCheatMode && (
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
              )}
            </div>

            {/* Discovered Campfires (Waystation Fast Travel — Spawn Moves with Campfires) */}
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#ffd27d] text-[10px]">
                  CAMPFIRE WAYSTATIONS (A) — RESPAWN & FAST TRAVEL
                </span>
                <span className="text-[8px] text-[#94a3b8]">
                  Resting at a campfire moves your spawn anchor
                </span>
              </div>
              {(() => {
                const visibleWaystations = Object.values(WAYSTATION_REGISTRY).filter(
                  (ws) => isCheatMode || discoveredWs.includes(ws.id)
                );
                if (visibleWaystations.length === 0) {
                  return (
                    <div className="p-3 bg-[#0f172a] rounded-xs border border-[#1e293b] text-[#94a3b8] text-center italic">
                      No campfires attuned yet. Explore beyond the Drop-Pod crater to find and rest at the First Campfire.
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {visibleWaystations.map((ws) => {
                      const wsArea = AREA_REGISTRY[ws.areaId];
                      const isUndefinedSpec = wsArea?.specStatus === 'UNDEFINED';
                      const isDiscovered = discoveredWs.includes(ws.id) || isCheatMode;
                      const isHere = state.room === ws.room;
                      return (
                        <div
                          key={ws.id}
                          className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-[#fef08a] text-[9.5px]">{ws.name}</div>
                            <div className="text-[8px] text-[#94a3b8]">
                              {wsArea?.name || ws.areaId}
                              {isCheatMode ? ` · Room [${ws.room}]` : ''}
                            </div>
                          </div>
                          <button
                            disabled={!isDiscovered || !rooms || isUndefinedSpec}
                            onClick={() => {
                              if (!rooms) return;
                              if (fastTravelToWaystation(rooms, state, ws.id)) {
                                onResume();
                              }
                            }}
                            className={`px-2 py-1 rounded-xs font-bold text-[8.5px] shrink-0 cursor-pointer ${
                              isUndefinedSpec
                                ? 'bg-[#451a03] text-[#fcd34d] border border-[#b45309] cursor-not-allowed'
                                : isHere
                                  ? 'bg-[#422006] text-[#fde68a] border border-[#f59e0b]'
                                  : 'bg-[#ca8a04] hover:bg-[#a16207] text-[#05070a]'
                            }`}
                          >
                            {isUndefinedSpec
                              ? 'FOG SEALED'
                              : isHere
                                ? 'AT CAMPFIRE'
                                : 'FAST TRAVEL'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Discovered Colossal Waygates (Shown if discovered or in Cheat Room Mode) */}
            {(discoveredWg.length > 0 || isCheatMode) && (
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#67e8f9] text-[10px]">
                    COLOSSAL WAYGATES (Q) — INTER-WORLD TRANSIT
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {Object.values(WAYGATE_REGISTRY)
                    .filter((wg) => isCheatMode || discoveredWg.includes(wg.id))
                    .map((wg) => {
                      const wgArea = AREA_REGISTRY[wg.areaId];
                      const isUndefinedSpec = wgArea?.specStatus === 'UNDEFINED';
                      const isDiscovered = discoveredWg.includes(wg.id) || isCheatMode;
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
                            {isCheatMode && (
                              <div className="text-[8px] text-[#94a3b8]">
                                Room [{wg.room}] · Alignment: {wg.desyncStatus}
                              </div>
                            )}
                          </div>
                          <button
                            disabled={!isDiscovered || !rooms || isUndefinedSpec}
                            onClick={() => {
                              if (!rooms) return;
                              if (fastTravelViaWaygate(rooms, state, wg.id)) {
                                onResume();
                              }
                            }}
                            className={`px-2 py-1 rounded-xs font-bold text-[8.5px] shrink-0 cursor-pointer ${
                              isUndefinedSpec
                                ? 'bg-[#451a03] text-[#fcd34d] border border-[#b45309] cursor-not-allowed'
                                : isHere
                                  ? 'bg-[#164e63] text-[#67e8f9] border border-[#22d3ee]'
                                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
                            }`}
                          >
                            {isUndefinedSpec
                              ? 'SEALED'
                              : isHere
                                ? 'AT WAYGATE'
                                : 'TRANSIT'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Cheat Room Only: Aether Fog 5-Node Graph Engine & Universe Catalog */}
            {isCheatMode && (() => {
              const activeNode = getActiveAetherNode(state);
              const hasLantern = hasPoeLanternGuidance(state);
              const totalGenerated = Object.keys(state.fogGraph?.nodes || {}).filter((k) =>
                k.startsWith('fog:')
              ).length;
              const dirs: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];
              const majorWorlds = U00_UNIVERSE_CATALOG.filter((w) => w.tier === 'major');

              return (
                <>
                  <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#38bdf8] text-[10px]">
                        CHEAT ROOM — ÆTHER FOG 5-NODE TOPOLOGY & STEP TELEPORTER
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
                          {hasLantern ? 'POE LANTERN LIT' : '1-2PX SHIMMER'} · {totalGenerated} GEN
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                      <span className="text-[8px] text-[#94a3b8]">
                        Drop Pod [-3,0] → First Campfire [0,0] (3) → Poe Lantern [0,-2] (5) / Main Bog [3,0] (6)
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

                  <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
                    <div className="font-bold text-[#fbbf24] text-[10px]">
                      CHEAT ROOM — u00 UNIVERSE CATALOG ({majorWorlds.length} MAJOR WORLDS):
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[8px]">
                      {majorWorlds.map((w) => (
                        <div
                          key={w.id}
                          className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b] flex flex-col justify-between"
                        >
                          <span className="font-bold text-[#f8fafc] truncate">
                            {w.index}. {w.name}
                          </span>
                          <span className="text-[7.5px] text-[#94a3b8]">{w.theme}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        );
      })()}
    </div>
  );
};
