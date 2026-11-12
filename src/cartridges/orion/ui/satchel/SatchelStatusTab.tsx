/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../../database/characters';
import { getItemDefinition } from '../../database/items';
import {
  CANONICAL_FRAME_FEAT_REGISTRY,
  computeEffectivePlayerLightTiles,
  computePlayerLightStatBreakdown,
  computePlayerLoadMetrics,
  evaluateEquipmentFeatHandling,
  getEquipmentDisplayName,
} from '../../database/progression';
import { getWeaponDefinition } from '../../database/equipment/weapons';
import {
  applyTraitLineProfile,
  getActiveWeaponStance,
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

/**
 * Pilot Satchel Status Tab displaying defense layer breakdowns, inertia telemetry,
 * equipment handling proficiency from the 96-feat constellation, and Main Hand (Right),
 * Side Hand (Left), and Auxiliary (Back) progression status.
 * Supports both HUD modes inside the Pilot Satchel overlay. Mutates `state: OrionState` only via debug/light adjustments.
 */
export const SatchelStatusTab: React.FC<SatchelStatusTabProps> = ({
  state,
  isCheatMode,
  onResume,
  onLocateFeat,
}) => {
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
    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-[10px]">
      {/* Defense Layers Breakdown */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="text-[#ffd27d] font-bold text-[10.5px] flex flex-wrap items-center justify-between gap-1">
          <span>CANONICAL THREE DEFENSE LAYERS</span>
          <div className="flex items-center gap-2">
            <span className="text-[#94a3b8] text-[9px]">
              CLVL {state.level} / 20 ({gates.levelBand.toUpperCase()})
            </span>
            <button
              type="button"
              onClick={() => {
                enterTrainingSandboxRoom(state);
                onResume?.();
              }}
              title="Toggle [-4,0] Training Room (Drop Pod & Waygate Sandbox)"
              className={`px-2 py-0.5 text-[8px] font-bold rounded-xs border transition-colors cursor-pointer ${
                state.room === '-4,0'
                  ? 'bg-[#4c1d95] hover:bg-[#5b21b6] text-[#f0abfc] border-[#a855f7]'
                  : 'bg-[#0f172a] hover:bg-[#1e293b] text-[#93c5fd] border-[#3b82f6]/70'
              }`}
            >
              {state.room === '-4,0' ? '↩ EXIT TRAINING [-4,0]' : '⚔ TRAINING ROOM [-4,0]'}
            </button>
          </div>
        </div>

        {/* Layer 1: Shield */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[9px]">
            <span className="text-[#77c7ff] font-bold">
              LAYER 1: SHIELD ({state.shields.type.toUpperCase()})
            </span>
            <span>
              {Math.round(state.shields.capacity)} / {state.shields.maxCapacity}{' '}
              {state.shields.overloaded ? '⚠ OVERLOADED' : ''}
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
              LAYER 2: ARMOR ({state.armor.type.toUpperCase()}) · THRESH {state.armor.threshold} ·
              RATING {state.armor.rating}
            </span>
            <span>
              {Math.round(state.armor.durability)} / {state.armor.maxDurability}
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
              LAYER 3: FRAME INTEGRITY (STATIC 200 HP) · {state.frame.state.toUpperCase()}
            </span>
            <span>{state.frame.integrity} / 200</span>
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
        <div className="space-y-0.5 pt-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-[#f97316] font-bold">REACTOR HEAT</span>
            <span>
              {Math.round(state.heat)} / {state.maxHeat}
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

      {/* Light Stat & Vision Radius Breakdown */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#fbbf24]/50 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[#fde047] font-bold text-[10.5px]">
            ☀ LIGHT STAT &amp; VISION RADIUS (BASE 5 TILES)
          </span>
          <span className="px-1.5 py-0.5 rounded-xs bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fde047] font-black text-[9.5px]">
            EFFECTIVE LIGHT: {effectiveLight} ({Math.round(effectiveLight * 16)}px)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
          <div className="p-1.5 bg-[#06090e] rounded-xs border border-[#1e293b] flex items-center justify-between text-[8.5px]">
            <span className="text-[#94a3b8] font-bold">BASE</span>
            <span className="text-[#f8fafc] font-black">{lightBreakdown.baseLight.toFixed(1)}</span>
          </div>
          <div className="p-1.5 bg-[#06090e] rounded-xs border border-[#1e293b] flex items-center justify-between text-[8.5px]">
            <span className="text-[#94a3b8] font-bold">FEATS / MODS</span>
            <span className="text-[#38bdf8] font-black">
              {lightBreakdown.featBonus >= 0 ? `+${lightBreakdown.featBonus}` : lightBreakdown.featBonus}
            </span>
          </div>
          <div className="p-1.5 bg-[#06090e] rounded-xs border border-[#1e293b] flex items-center justify-between text-[8.5px]">
            <span className="text-[#94a3b8] font-bold">GEAR / ITEMS</span>
            <span className="text-[#67e8f9] font-black">
              {lightBreakdown.hardwareAndItemBonus >= 0
                ? `+${lightBreakdown.hardwareAndItemBonus}`
                : lightBreakdown.hardwareAndItemBonus}
            </span>
          </div>
          <div className="p-1.5 bg-[#06090e] rounded-xs border border-[#1e293b] flex items-center justify-between text-[8.5px]">
            <span className="text-[#94a3b8] font-bold">SKILLS / SPELLS</span>
            <span className="text-[#c084fc] font-black">
              {lightBreakdown.skillAndSpellBonus >= 0
                ? `+${lightBreakdown.skillAndSpellBonus}`
                : lightBreakdown.skillAndSpellBonus}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-1 text-[8px] text-[#94a3b8] pt-0.5">
          <span>
            ENEMY BASE SIGHT: <strong className="text-[#fda4af]">{baseEnemyLight} TILES</strong> ·
            UNEXPLORED: <strong className="text-[#f8fafc]">BLACK FADE</strong> · EXPLORED:{' '}
            <strong className="text-[#94a3b8]">SLATE FADE</strong>
          </span>
          <span className="text-[#67e8f9]">
            {lanternLit ? 'POE LANTERN +1.0 ACTIVE' : 'POE LANTERN UNLIT'}
          </span>
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

      {/* §3.4 Percentage Load Limit Matrix (0-30% Light, 31-65% Medium, 66-100% Heavy, >100% Overloaded) */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-bold text-[#ffd27d] text-[10px]">
            EQUIP LOAD LIMIT &amp; WEIGHT CAPACITY (FRAME MODS + FEATS):
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-xs font-bold text-[8px] ${
              loadMetrics.loadBracket === 'light'
                ? 'bg-[#064e3b] text-[#6ee7b7]'
                : loadMetrics.loadBracket === 'medium'
                  ? 'bg-[#172554] text-[#7dd3fc]'
                  : loadMetrics.loadBracket === 'heavy'
                    ? 'bg-[#451a03] text-[#fcd34d]'
                    : 'bg-[#7f1d1d] text-[#fca5a5] animate-pulse'
            }`}
          >
            {loadMetrics.equippedWeight} / {loadMetrics.maxCapacity} WT ({loadMetrics.loadPct}% ·{' '}
            {loadMetrics.loadBracket.toUpperCase()})
          </span>
        </div>

        {/* Percentage Load Bar with 30% / 65% / 100% Bracket Ticks */}
        <div className="space-y-0.5">
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
          <div className="grid grid-cols-4 text-[7.5px] font-bold text-center">
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
              100%&lt; OVERLOADED
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 text-[8.5px]">
          <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
            <div className="text-[#94a3b8] text-[7.5px]">EQUIPPED WEIGHT BREAKDOWN</div>
            <div className="font-bold text-[#38bdf8]">
              HW{' '}
              {loadMetrics.breakdown.headWeight +
                loadMetrics.breakdown.armsWeight +
                loadMetrics.breakdown.frameWeight}{' '}
              + WPN {loadMetrics.breakdown.weaponsWeight} = {loadMetrics.equippedWeight} WT
            </div>
          </div>
          <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
            <div className="text-[#94a3b8] text-[7.5px]">MAX CAPACITY (FRAME + FEATS)</div>
            <div className="font-bold text-[#ffd27d]">
              {loadMetrics.maxCapacity} WT CAP ({gates.effectiveLoadCapacity.toUpperCase()})
            </div>
          </div>
          <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
            <div className="text-[#94a3b8] text-[7.5px]">LOAD EFFECT &amp; CRITICAL STATE</div>
            <div
              className={`font-bold truncate ${
                state.frame.integrity <= 40 || loadMetrics.loadBracket === 'overloaded'
                  ? 'text-[#f87171]'
                  : 'text-[#86efac]'
              }`}
            >
              {gates.loadPenalty.label}
            </div>
          </div>
        </div>
      </div>

      {/* INERTIA SYSTEM READOUT (`inertia-v0.md`: Weight m, Stability S, Charge m_eff, Recoil & HUD Mod) */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-bold text-[#38bdf8] text-[10px]">
            INERTIA & STABILITY PHYSICS READOUT (Δv = J / m_eff):
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
                if (state.equipmentSlots.installedMods?.mobility === 'mod_inertial_gyro_telemetry') {
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
            className={`px-1.5 py-0.5 rounded-xs border font-bold text-[8px] cursor-pointer transition-colors ${
              hudModActive
                ? 'bg-[#0284c7] text-white border-[#38bdf8]'
                : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#38bdf8]'
            }`}
          >
            {hudModActive
              ? '📡 HUD GYRO-TELEMETRY MOD: EQUIPPED'
              : '📡 EQUIP HUD GYRO-TELEMETRY (SENSORY B)'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[8.5px]">
          <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
            <div className="text-[#94a3b8] text-[7.5px]">WEIGHT (m → CHARGE m_eff)</div>
            <div className="font-bold text-[#ffd27d]">
              {inertiaProf.totalBaseWeight} → {inertiaProf.maxChargeWeight} MAX
            </div>
            <div className="text-[7px] text-[#64748b]">Governs displacement (Δv = J / m_eff)</div>
          </div>

          <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
            <div className="text-[#94a3b8] text-[7.5px]">STABILITY (S) & DEADBAND</div>
            <div className="font-bold text-[#4ade80]">
              S = {inertiaProf.stability} (IGNORE ≤ {inertiaProf.shrugOffDeadbandDv} Δv)
            </div>
            <div className="text-[7px] text-[#64748b]">
              Governs shrug-off (k1·S) & recovery (k2·S)
            </div>
          </div>

          <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
            <div className="text-[#94a3b8] text-[7.5px]">WEAPON IMPULSE SPEC</div>
            <div className="font-bold text-[#7dd3fc]">
              {wpnSpec.isMelee
                ? `ATK WT ${wpnSpec.attackWeight} · SPD ${wpnSpec.attackSpeed}`
                : `PROJ WT ${wpnSpec.projectileWeight} · SPD ${wpnSpec.projectileSpeed}`}
            </div>
            <div className="text-[7px] text-[#64748b]">
              {wpnSpec.isMelee
                ? `Body Commit: ${Math.round(wpnSpec.commitment * 100)}%`
                : 'Ranged J excludes shooter weight'}
            </div>
          </div>

          <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
            <div className="text-[#94a3b8] text-[7.5px]">RECOIL ABSORPTION (§7)</div>
            <div className="font-bold text-[#c084fc] truncate">
              {inertiaProf.recoilAbsorptionLabel}
            </div>
            <div className="text-[7px] text-[#64748b]">Δv_recoil = J_recoil / m_frame</div>
          </div>
        </div>
      </div>

      {/* §4.4 Equipment Slots 1–3 & Feat Handling Proficiency Summary */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-bold text-[#38bdf8] text-[10px]">
            EQUIPPED HARDWARE &amp; FEAT HANDLING PROFICIENCY (96-NODE CONSTELLATION):
          </span>
          <span className="text-[8px] text-[#94a3b8]">
            STANCE: <b className="text-[#fde047]">{getActiveWeaponStance(state).shortTag}</b> · BAND:{' '}
            <b className="text-[#c084fc]">{gates.levelBand.toUpperCase()}</b>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[8px]">
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
                className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[#7dd3fc] text-[7.5px]">
                    {slotItem.slotLabel}
                  </span>
                  {slotItem.itemId && (
                    <span
                      className={`px-1 py-0.2 rounded-[2px] text-[6.8px] font-bold border ${
                        evalRes.proficiencyTier === 'mastered'
                          ? 'bg-[#052e16] text-[#86efac] border-[#22c55e]/50'
                          : evalRes.proficiencyTier === 'proficient'
                            ? 'bg-[#0c4a6e] text-[#7dd3fc] border-[#38bdf8]/50'
                            : evalRes.proficiencyTier === 'locked'
                              ? 'bg-[#450a0a] text-[#fca5a5] border-[#ef4444]/60'
                              : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155]'
                      }`}
                    >
                      {evalRes.badgeLabel}
                    </span>
                  )}
                </div>

                <div className="font-bold text-[#f8fafc] text-[8.5px] truncate">{displayName}</div>
                {slotItem.itemId && (
                  <div className="text-[7px] text-[#94a3b8] leading-snug">
                    {evalRes.statusSummary}
                  </div>
                )}

                {slotItem.itemId && recFeat && onLocateFeat && (
                  <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-[#1e293b]">
                    <span className="text-[6.8px] text-[#c084fc] truncate">
                      Feat: <b>{recFeat.name}</b> ({recFeat.tier})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        onLocateFeat(recFeat.id);
                      }}
                      className="px-1.5 py-0.2 rounded-[2px] bg-[#1e1b4b] hover:bg-[#312e81] text-[#e9d5ff] border border-[#818cf8]/50 text-[6.8px] font-bold cursor-pointer shrink-0"
                    >
                      VIEW IN FEAT GRID →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
