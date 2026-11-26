/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../../database/characters';
import { getWeaponDefinition } from '../../database/equipment/weapons';
import { getItemDefinition } from '../../database/items';
import {
  CANONICAL_FRAME_FEAT_REGISTRY,
  computeEffectivePlayerLightTiles,
  computePlayerLightStatBreakdown,
  computePlayerLoadMetrics,
  evaluateEmergentMetaClass,
  evaluateEquipmentFeatHandling,
  FEAT_TIER_MAX_SLOTS,
  getEquipmentDisplayName,
  getEquippedFeatCountByTier,
  getMaxSocketedFeatsForLevel,
} from '../../database/progression';
import {
  applyTraitLineProfile,
  getActiveWeaponStance,
  getOrionGraphicsSettings,
  hasInertialTelemetryModEquipped,
  hasPoeLanternGuidance,
  INERTIAL_TELEMETRY_SENSORY_ID,
  notifyOrionStateChange,
  resolvePlayerInertiaProfile,
  resolveWeaponAttackInertiaSpec,
  syncStateGates,
} from '../../systems';
import { OrionState } from '../../types';
import { enterTrainingSandboxRoom } from '../hud/HudTitleModal';
import { ALL_TRAIT_LINES } from './SatchelCanvases';

/**
 * Props for the Pilot Satchel Status Tab component.
 */
export interface SatchelStatusTabProps {
  state: OrionState;
  isCheatMode: boolean;
  onResume?: () => void;
  onLocateFeat?: (featId: string) => void;
}

type StatusViewSection = 'overview' | 'loadout' | 'physics';

/**
 * Pilot Satchel Status Tab displaying defense layer breakdowns, inertia telemetry,
 * equipment handling proficiency from the 113-feat constellation, and Main Hand (Right),
 * Side Hand (Left), and Auxiliary (Back) progression status.
 * Uses a clean 3-tab section switcher (`Overview & Defense`, `Equipped Loadout & Handling`, `Inertia & Physics`)
 * so only one focused diagnostic view is shown at a time.
 */
export const SatchelStatusTab: React.FC<SatchelStatusTabProps> = ({
  state,
  isCheatMode,
  onResume,
  onLocateFeat,
}) => {
  const [section, setSection] = useState<StatusViewSection>('overview');

  const gates = syncStateGates(state);
  const currentWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;

  const inertiaProf = resolvePlayerInertiaProfile(state);
  const wpnSpec = resolveWeaponAttackInertiaSpec(currentWeaponId, 0);
  const hudModActive = hasInertialTelemetryModEquipped(state);
  const effectiveLight = computeEffectivePlayerLightTiles(state);
  const lightBreakdown = computePlayerLightStatBreakdown(state);
  const baseEnemyLight = state.enemyBaseLight ?? 5;
  const lanternLit = hasPoeLanternGuidance(state);
  const loadMetrics = computePlayerLoadMetrics(state);
  const devMode = getOrionGraphicsSettings().devModeEnabled;
  const metaClass = evaluateEmergentMetaClass(state);
  const maxFeatsForLevel = getMaxSocketedFeatsForLevel(
    state.level,
    Boolean(state.bypassProgressionGates)
  );
  const tierVCount = getEquippedFeatCountByTier(state, 'V');

  const equippedSlotSummaries = [
    {
      slotLabel: 'MAIN HAND [R]',
      itemId: state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'long_sword',
    },
    {
      slotLabel: 'SIDE HAND [L]',
      itemId: state.equipmentSlots?.slot2 || null,
    },
    {
      slotLabel: 'AUXILIARY [BACK]',
      itemId: state.equipmentSlots?.slot3 || null,
    },
    {
      slotLabel: 'TORSO PLATING',
      itemId: state.equipmentSlots?.plating || null,
    },
    {
      slotLabel: 'HEAD DOME',
      itemId: state.equipmentSlots?.head || null,
    },
    {
      slotLabel: 'ARM APERTURE',
      itemId: state.equipmentSlots?.arms || null,
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-2 overflow-hidden text-[10px]">
      {/* Single Compact Sub-Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 py-1 bg-[#090d14] border border-[#1e293b] rounded-xs shrink-0">
        <div className="flex items-center gap-1">
          {(
            [
              { id: 'overview' as const, label: 'Overview & Defense' },
              { id: 'loadout' as const, label: 'Loadout & Handling' },
              { id: 'physics' as const, label: 'Load & Physics' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundSystem.playMenuBeep();
                setSection(tab.id);
              }}
              className={`px-2.5 py-0.5 rounded-xs font-bold text-[10px] transition-colors cursor-pointer ${
                section === tab.id
                  ? 'bg-[#38bdf8] text-[#05070a]'
                  : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#e2e8f0] border border-[#1e293b]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[9px] text-[#94a3b8] font-mono tabular-nums">
          <span>
            CLVL <b className="text-[#fde047]">{state.level}/20</b> · {gates.levelBand.toUpperCase()}
          </span>
          {(devMode || state.room === '-4,0') && (
            <button
              type="button"
              onClick={() => {
                enterTrainingSandboxRoom(state);
                onResume?.();
              }}
              title="Toggle Training Room (Drop Pod & Waygate Sandbox)"
              className={`px-2 py-0.5 text-[9px] font-bold rounded-xs border transition-colors cursor-pointer ${
                state.room === '-4,0'
                  ? 'bg-[#4c1d95] hover:bg-[#5b21b6] text-[#f0abfc] border-[#a855f7]'
                  : 'bg-[#0f172a] hover:bg-[#1e293b] text-[#93c5fd] border-[#3b82f6]/70'
              }`}
            >
              {state.room === '-4,0' ? '↩ Exit Training' : '⚔ Training Sandbox'}
            </button>
          )}
        </div>
      </div>

      {/* Focused Section Body */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
        {section === 'overview' && (
          <>
            {/* Emergent Historical Meta-Class & Constellation Synthesis */}
            <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#fde047] font-bold text-[11px]">
                    ⚔ {metaClass.title.toUpperCase()}
                  </span>
                  <span className="text-[9px] text-[#7dd3fc] font-bold">
                    · {metaClass.umbrellaCombination}
                  </span>
                </div>
                <span className="text-[9px] text-[#94a3b8] font-mono tabular-nums">
                  Feats <b className="text-[#38bdf8]">{(state.equippedFeats || []).length}/{maxFeatsForLevel}</b> · Apex T-V <b className="text-[#c084fc]">{tierVCount}/{FEAT_TIER_MAX_SLOTS.V}</b>
                </span>
              </div>

              <div className="text-[10px] text-[#cbd5e1] leading-snug">
                {metaClass.historicalFantasy}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#1e293b] text-[9px]">
                <div className="flex items-center gap-3 font-mono tabular-nums">
                  <span className="text-[#fb923c]">
                    Fighter: <b className="text-[#f8fafc]">{metaClass.umbrellaCounts.Fighter}</b>
                  </span>
                  <span className="text-[#64748b]">·</span>
                  <span className="text-[#38bdf8]">
                    Scholar: <b className="text-[#f8fafc]">{metaClass.umbrellaCounts.Scholar}</b>
                  </span>
                  <span className="text-[#64748b]">·</span>
                  <span className="text-[#c084fc]">
                    Rogue: <b className="text-[#f8fafc]">{metaClass.umbrellaCounts.Rogue}</b>
                  </span>
                </div>

                <span className="text-[#94a3b8]">
                  Stance:{' '}
                  <b className="text-[#fde047]">
                    {metaClass.activeSpecialistStanceName
                      ? metaClass.activeSpecialistStanceName
                      : getActiveWeaponStance(state).shortTag}
                  </b>
                </span>
              </div>

              {metaClass.matchedFeats.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#1e293b]/70">
                  <span className="text-[9px] text-[#94a3b8]">Signature Feats:</span>
                  {metaClass.matchedFeats.map((fName) => {
                    const matchedDef = Object.values(CANONICAL_FRAME_FEAT_REGISTRY).find(
                      (f) => f.name === fName
                    );
                    return (
                      <button
                        key={fName}
                        type="button"
                        onClick={() => {
                          if (matchedDef && onLocateFeat) {
                            soundSystem.playSelect();
                            onLocateFeat(matchedDef.id);
                          }
                        }}
                        className="px-1.5 py-0.5 rounded-xs bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-400/50 text-emerald-200 text-[9px] font-bold cursor-pointer"
                      >
                        {fName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Canonical Three Defense Layers + Reactor Heat */}
            <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#ffd27d] font-bold text-[11px]">
                  THREE DEFENSE LAYERS &amp; REACTOR
                </span>
                <span className="text-[9px] text-[#38bdf8] font-mono">
                  {trait.frameModel || 'PNSY W416'} · {trait.reactor.toUpperCase()} REACTOR
                </span>
              </div>

              {/* Layer 1: Shield */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#77c7ff] font-bold">
                    Layer 1 · Shield ({state.shields.type.toUpperCase()})
                  </span>
                  <span className="font-mono tabular-nums">
                    {devMode
                      ? `${Math.round(state.shields.capacity)} / ${state.shields.maxCapacity} ${
                          state.shields.overloaded ? '⚠ OVERLOADED' : ''
                        }`
                      : state.shields.overloaded
                        ? '⚠ OVERLOADED'
                        : `${Math.round(state.shields.capacity)} / ${state.shields.maxCapacity}`}
                  </span>
                </div>
                <svg
                  viewBox="0 0 100 4"
                  preserveAspectRatio="none"
                  className="w-full h-1.5 rounded-xs bg-[#1e293b] overflow-hidden"
                >
                  <rect
                    x="0"
                    y="0"
                    width={
                      state.shields.maxCapacity > 0
                        ? Math.max(
                            0,
                            Math.min(100, (state.shields.capacity / state.shields.maxCapacity) * 100)
                          )
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
                    Layer 2 · Armor ({state.armor.type.toUpperCase()}) · Thresh {state.armor.threshold} · Rating {state.armor.rating}
                  </span>
                  <span className="font-mono tabular-nums">
                    {devMode
                      ? `${Math.round(state.armor.durability)} / ${state.armor.maxDurability}`
                      : state.armor.durability <= 0
                        ? 'BREACHED'
                        : `${Math.round(state.armor.durability)} / ${state.armor.maxDurability}`}
                  </span>
                </div>
                <svg
                  viewBox="0 0 100 4"
                  preserveAspectRatio="none"
                  className="w-full h-1.5 rounded-xs bg-[#1e293b] overflow-hidden"
                >
                  <rect
                    x="0"
                    y="0"
                    width={
                      state.armor.maxDurability > 0
                        ? Math.max(
                            0,
                            Math.min(100, (state.armor.durability / state.armor.maxDurability) * 100)
                          )
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
                  <span
                    className={
                      state.frame.state === 'Critical'
                        ? 'text-[#ff9b9b] font-bold animate-pulse'
                        : 'text-[#8dd7ad] font-bold'
                    }
                  >
                    Layer 3 · Frame Integrity · {state.frame.state.toUpperCase()}
                  </span>
                  <span className="font-mono tabular-nums">
                    {state.frame.integrity} / 200
                  </span>
                </div>
                <svg
                  viewBox="0 0 100 4"
                  preserveAspectRatio="none"
                  className="w-full h-1.5 rounded-xs bg-[#1e293b] overflow-hidden"
                >
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
              <div className="space-y-0.5 pt-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#f97316] font-bold">Reactor Heat</span>
                  <span className="font-mono tabular-nums">
                    {Math.round(state.heat)} / {state.maxHeat}{' '}
                    {state.heat >= 80 ? '· OVERHEATING' : '· NOMINAL'}
                  </span>
                </div>
                <svg
                  viewBox="0 0 100 3"
                  preserveAspectRatio="none"
                  className="w-full h-1 rounded-xs bg-[#1e293b] overflow-hidden"
                >
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

            {/* Compact Vision & Light Breakdown */}
            <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#fbbf24]/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[#fde047] font-bold text-[10px]">
                  ☀ Effective Light: {effectiveLight} Tiles
                </span>
                {lanternLit && (
                  <span className="text-[9px] text-[#67e8f9]">· Poe Lantern (+1.0)</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[9px] text-[#94a3b8] font-mono tabular-nums">
                <span>
                  Base <b className="text-[#f8fafc]">{lightBreakdown.baseLight.toFixed(1)}</b>
                </span>
                <span>·</span>
                <span>
                  Feats{' '}
                  <b className="text-[#38bdf8]">
                    {lightBreakdown.featBonus >= 0
                      ? `+${lightBreakdown.featBonus}`
                      : lightBreakdown.featBonus}
                  </b>
                </span>
                <span>·</span>
                <span>
                  Gear{' '}
                  <b className="text-[#67e8f9]">
                    {lightBreakdown.hardwareAndItemBonus >= 0
                      ? `+${lightBreakdown.hardwareAndItemBonus}`
                      : lightBreakdown.hardwareAndItemBonus}
                  </b>
                </span>
                <span>·</span>
                <span>
                  Skills{' '}
                  <b className="text-[#c084fc]">
                    {lightBreakdown.skillAndSpellBonus >= 0
                      ? `+${lightBreakdown.skillAndSpellBonus}`
                      : lightBreakdown.skillAndSpellBonus}
                  </b>
                </span>
                {devMode && (
                  <>
                    <span>·</span>
                    <span>
                      Enemy Sight <b className="text-[#fda4af]">{baseEnemyLight}</b>
                    </span>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {section === 'loadout' && (
          <>
            {/* Active Frame Identity & Cheat Room Starting Kit Switcher */}
            <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[#ffd27d] font-bold text-[11px]">
                  PILOT CHASSIS · {trait.name.toUpperCase()} ({trait.frameModel || 'PNSY W416'})
                </span>
                {isCheatMode && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-[#94a3b8]">Sandbox Kit:</span>
                    <select
                      value={state.traitLine}
                      onChange={(e) => {
                        soundSystem.playSelect();
                        applyTraitLineProfile(
                          state,
                          e.target.value as (typeof ALL_TRAIT_LINES)[number]
                        );
                      }}
                      className="px-2 py-0.5 bg-[#05070a] border border-[#38bdf8]/60 rounded-xs text-[11px] font-bold text-[#fde047] focus:outline-none cursor-pointer"
                    >
                      {ALL_TRAIT_LINES.map((tl) => {
                        const prof = TRAIT_REGISTRY[tl];
                        return (
                          <option key={tl} value={tl}>
                            {prof.name} ({prof.frameModel} · {prof.reactor})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-[#cbd5e1] leading-snug">{trait.identity}</div>
            </div>

            {/* Clean Full-Width List of Equipped Slots & Feat Handling Proficiency */}
            <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1 pb-1 border-b border-[#1e293b]">
                <span className="font-bold text-[#38bdf8] text-[11px]">
                  EQUIPPED SLOTS &amp; FEAT PROFICIENCY
                </span>
                <span className="text-[9px] text-[#94a3b8]">
                  Stance: <b className="text-[#fde047]">{getActiveWeaponStance(state).shortTag}</b>
                </span>
              </div>

              <div className="divide-y divide-[#1e293b]">
                {equippedSlotSummaries.map((slotItem) => {
                  const evalRes = evaluateEquipmentFeatHandling(state, slotItem.itemId);
                  const displayName = slotItem.itemId
                    ? getWeaponDefinition(slotItem.itemId)?.name ||
                      getItemDefinition(slotItem.itemId)?.name ||
                      getEquipmentDisplayName(slotItem.itemId)
                    : 'Empty Slot';
                  const recFeat = evalRes.recommendedFeatId
                    ? CANONICAL_FRAME_FEAT_REGISTRY[evalRes.recommendedFeatId]
                    : undefined;

                  return (
                    <div
                      key={slotItem.slotLabel}
                      className="py-2 flex flex-col gap-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-[#7dd3fc] text-[9px] w-28 shrink-0">
                            {slotItem.slotLabel}
                          </span>
                          <span className="font-bold text-[#f8fafc] text-[10px] truncate">
                            {displayName}
                          </span>
                          {devMode && slotItem.itemId && (
                            <span className="text-[9px] text-[#64748b] font-mono">
                              [{slotItem.itemId}]
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {slotItem.itemId && (
                            <span
                              className={`text-[9px] font-bold ${
                                evalRes.proficiencyTier === 'mastered'
                                  ? 'text-[#86efac]'
                                  : evalRes.proficiencyTier === 'proficient'
                                    ? 'text-[#7dd3fc]'
                                    : evalRes.proficiencyTier === 'locked'
                                      ? 'text-[#fca5a5]'
                                      : 'text-[#94a3b8]'
                              }`}
                            >
                              {evalRes.badgeLabel}
                            </span>
                          )}
                          {slotItem.itemId && recFeat && onLocateFeat && (
                            <button
                              type="button"
                              onClick={() => {
                                soundSystem.playSelect();
                                onLocateFeat(recFeat.id);
                              }}
                              className="px-2 py-0.5 rounded-xs bg-[#1e1b4b] hover:bg-[#312e81] text-[#e9d5ff] border border-[#818cf8]/50 text-[9px] font-bold cursor-pointer"
                            >
                              Feat: {recFeat.name} →
                            </button>
                          )}
                        </div>
                      </div>

                      {slotItem.itemId && (
                        <div className="text-[9px] text-[#94a3b8] pl-0 sm:pl-30 leading-snug">
                          {evalRes.statusSummary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {section === 'physics' && (
          <>
            {/* Percentage Load Limit Matrix */}
            <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-bold text-[#ffd27d] text-[11px]">
                  EQUIP LOAD &amp; WEIGHT CAPACITY
                </span>
                <span
                  className={`font-bold text-[10px] font-mono tabular-nums ${
                    loadMetrics.loadBracket === 'light'
                      ? 'text-[#6ee7b7]'
                      : loadMetrics.loadBracket === 'medium'
                        ? 'text-[#7dd3fc]'
                        : loadMetrics.loadBracket === 'heavy'
                          ? 'text-[#fcd34d]'
                          : 'text-[#fca5a5] animate-pulse'
                  }`}
                >
                  {loadMetrics.equippedWeight} / {loadMetrics.maxCapacity} WT ({loadMetrics.loadPct}% ·{' '}
                  {loadMetrics.loadBracket.toUpperCase()})
                </span>
              </div>

              <div className="space-y-1">
                <svg
                  viewBox="0 0 100 5"
                  preserveAspectRatio="none"
                  className="w-full h-2 rounded-xs bg-[#1e293b] overflow-hidden"
                >
                  <rect
                    x="0"
                    y="0"
                    width={Math.max(0, Math.min(100, loadMetrics.loadPct))}
                    height="5"
                    fill={
                      loadMetrics.loadBracket === 'light'
                        ? '#34d399'
                        : loadMetrics.loadBracket === 'medium'
                          ? '#38bdf8'
                          : loadMetrics.loadBracket === 'heavy'
                            ? '#fbbf24'
                            : '#f87171'
                    }
                  />
                  <line x1="30" y1="0" x2="30" y2="5" stroke="#090d14" strokeWidth="0.8" />
                  <line x1="65" y1="0" x2="65" y2="5" stroke="#090d14" strokeWidth="0.8" />
                </svg>
                <div className="grid grid-cols-4 text-[9px] font-bold text-center">
                  <span
                    className={
                      loadMetrics.loadBracket === 'light' ? 'text-[#6ee7b7]' : 'text-[#64748b]'
                    }
                  >
                    0–30% LIGHT
                  </span>
                  <span
                    className={
                      loadMetrics.loadBracket === 'medium' ? 'text-[#7dd3fc]' : 'text-[#64748b]'
                    }
                  >
                    31–65% MEDIUM
                  </span>
                  <span
                    className={
                      loadMetrics.loadBracket === 'heavy' ? 'text-[#fcd34d]' : 'text-[#64748b]'
                    }
                  >
                    66–100% HEAVY
                  </span>
                  <span
                    className={
                      loadMetrics.loadBracket === 'overloaded' ? 'text-[#f87171]' : 'text-[#64748b]'
                    }
                  >
                    &gt;100% OVERLOAD
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1e293b] text-[9px] text-[#94a3b8]">
                <span>
                  Hardware{' '}
                  <b className="text-[#38bdf8]">
                    {loadMetrics.breakdown.headWeight +
                      loadMetrics.breakdown.armsWeight +
                      loadMetrics.breakdown.frameWeight}{' '}
                    WT
                  </b>{' '}
                  + Weapons <b className="text-[#38bdf8]">{loadMetrics.breakdown.weaponsWeight} WT</b>
                </span>
                <span
                  className={`font-bold ${
                    state.frame.integrity <= 40 || loadMetrics.loadBracket === 'overloaded'
                      ? 'text-[#f87171]'
                      : 'text-[#86efac]'
                  }`}
                >
                  {gates.loadPenalty.label}
                </span>
              </div>
            </div>

            {/* Inertia & Stability Physics Readout */}
            <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="font-bold text-[#38bdf8] text-[11px]">
                  INERTIA &amp; STABILITY TELEMETRY (Δv = J / m_eff)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    state.equipmentSlots = state.equipmentSlots || {
                      slot1: currentWeaponId,
                      slot2: null,
                      slot3: null,
                      head: null,
                      arms: null,
                      plating: null,
                      utility: null,
                      installedMods: {},
                    };
                    if (hudModActive) {
                      if (state.equipmentSlots.sensoryB === INERTIAL_TELEMETRY_SENSORY_ID) {
                        state.equipmentSlots.sensoryB = null;
                      }
                      if (
                        state.equipmentSlots.installedMods?.mobility ===
                        'mod_inertial_gyro_telemetry'
                      ) {
                        delete state.equipmentSlots.installedMods.mobility;
                      }
                      if (state.flags) {
                        state.flags.hud_inertia_telemetry_enabled = false;
                      }
                    } else {
                      state.equipmentSlots.sensoryB = INERTIAL_TELEMETRY_SENSORY_ID;
                    }
                    syncStateGates(state);
                    notifyOrionStateChange();
                  }}
                  className={`px-2 py-0.5 rounded-xs border font-bold text-[9px] cursor-pointer transition-colors ${
                    hudModActive
                      ? 'bg-[#0284c7] text-white border-[#38bdf8]'
                      : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#38bdf8]'
                  }`}
                >
                  {hudModActive ? '📡 HUD Gyro-Telemetry: ON' : '📡 Equip HUD Gyro-Telemetry'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                <div className="p-2 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="text-[#94a3b8]">Mass &amp; Charge Weight</div>
                  <div className="font-bold text-[#ffd27d] text-[10px] mt-0.5 font-mono">
                    {inertiaProf.totalBaseWeight} → {inertiaProf.maxChargeWeight} MAX
                  </div>
                  <div className="text-[#64748b] mt-0.5">Governs displacement (Δv = J / m_eff)</div>
                </div>

                <div className="p-2 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="text-[#94a3b8]">Stability (S) &amp; Deadband</div>
                  <div className="font-bold text-[#4ade80] text-[10px] mt-0.5 font-mono">
                    S = {inertiaProf.stability} (Ignore ≤ {inertiaProf.shrugOffDeadbandDv} Δv)
                  </div>
                  <div className="text-[#64748b] mt-0.5">Shrug-off &amp; poise recovery rate</div>
                </div>

                <div className="p-2 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="text-[#94a3b8]">Active Weapon Impulse</div>
                  <div className="font-bold text-[#7dd3fc] text-[10px] mt-0.5 font-mono">
                    {wpnSpec.isMelee
                      ? `ATK WT ${wpnSpec.attackWeight} · SPD ${wpnSpec.attackSpeed}`
                      : `PROJ WT ${wpnSpec.projectileWeight} · SPD ${wpnSpec.projectileSpeed}`}
                  </div>
                  <div className="text-[#64748b] mt-0.5">
                    {wpnSpec.isMelee
                      ? `Body Commit: ${Math.round(wpnSpec.commitment * 100)}%`
                      : 'Ranged J excludes shooter mass'}
                  </div>
                </div>

                <div className="p-2 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                  <div className="text-[#94a3b8]">Recoil Absorption</div>
                  <div className="font-bold text-[#c084fc] text-[10px] mt-0.5 truncate">
                    {inertiaProf.recoilAbsorptionLabel}
                  </div>
                  <div className="text-[#64748b] mt-0.5">Δv_recoil = J_recoil / m_frame</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
