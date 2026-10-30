/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../../database/characters';
import { getClassUtilityDefinition } from '../../database/equipment';
import { getItemDefinition } from '../../database/items';
import {
  adjustEnemyBaseLight,
  adjustPlayerBaseLight,
  computeEffectivePlayerLightTiles,
  getEffectiveMainGrip,
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
import { ALL_TRAIT_LINES } from './SatchelCanvases';

export interface SatchelStatusTabProps {
  state: OrionState;
  isCheatMode: boolean;
}

export const SatchelStatusTab: React.FC<SatchelStatusTabProps> = ({ state, isCheatMode }) => {
  const gates = syncStateGates(state);
  const currentWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const currentWeapon = getWeaponDefinition(currentWeaponId);
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;

  const inertiaProf = resolvePlayerInertiaProfile(state);
  const wpnSpec = resolveWeaponAttackInertiaSpec(currentWeaponId, 0);
  const hudModActive = hasInertialTelemetryModEquipped(state);
  const effectiveLight = computeEffectivePlayerLightTiles(state);
  const basePlayerLight = state.baseLight ?? 5;
  const baseEnemyLight = state.enemyBaseLight ?? 5;
  const lanternLit = hasPoeLanternGuidance(state);

  return (
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

      {/* Light Stat & Vision Radius Controls */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#fbbf24]/50 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[#fde047] font-bold text-[10.5px]">
            ☀ LIGHT STAT &amp; VISION RADIUS (BASE 5 ≈ ½ SCREEN)
          </span>
          <span className="px-1.5 py-0.5 rounded-xs bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fde047] font-black text-[9.5px]">
            EFFECTIVE LIGHT: {effectiveLight} ({Math.round(effectiveLight * 13.6)}px)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          {/* Player Base Light Adjuster */}
          <div className="p-1.5 bg-[#06090e] rounded-xs border border-[#1e293b] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[8.5px]">
              <span className="text-[#cbd5e1] font-bold">PLAYER BASE LIGHT</span>
              <span className="text-[#fde047] font-black">{basePlayerLight}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  adjustPlayerBaseLight(state, -0.5);
                  notifyOrionStateChange();
                }}
                className="flex-1 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] font-bold rounded-xs border border-[#475569] cursor-pointer text-[8.5px]"
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  state.baseLight = 5;
                  notifyOrionStateChange();
                }}
                className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] font-bold rounded-xs border border-[#334155] cursor-pointer text-[8px]"
              >
                5.0
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  adjustPlayerBaseLight(state, 0.5);
                  notifyOrionStateChange();
                }}
                className="flex-1 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] font-bold rounded-xs border border-[#475569] cursor-pointer text-[8.5px]"
              >
                +0.5
              </button>
            </div>
          </div>

          {/* Enemy Vision Radius Adjuster */}
          <div className="p-1.5 bg-[#06090e] rounded-xs border border-[#1e293b] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[8.5px]">
              <span className="text-[#fda4af] font-bold">ENEMY VISION STAT</span>
              <span className="text-[#f43f5e] font-black">
                {baseEnemyLight} ({Math.round(baseEnemyLight * 14)}px)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  adjustEnemyBaseLight(state, -0.5);
                  notifyOrionStateChange();
                }}
                className="flex-1 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] font-bold rounded-xs border border-[#475569] cursor-pointer text-[8.5px]"
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  adjustEnemyBaseLight(state, 5 - baseEnemyLight);
                  notifyOrionStateChange();
                }}
                className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] font-bold rounded-xs border border-[#334155] cursor-pointer text-[8px]"
              >
                5.0
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  adjustEnemyBaseLight(state, 0.5);
                  notifyOrionStateChange();
                }}
                className="flex-1 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] font-bold rounded-xs border border-[#475569] cursor-pointer text-[8.5px]"
              >
                +0.5
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-1 text-[8px] text-[#94a3b8] pt-0.5">
          <span>
            UNEXPLORED EDGE: <strong className="text-[#f8fafc]">BLACK FADE</strong> · EXPLORED EDGE:{' '}
            <strong className="text-[#94a3b8]">SLATE GRAY FADE</strong>
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
              {state.frame.integrity <= 40 ? '-30% SPD & 15% MISFIRE' : 'NOMINAL (>20% HP)'}
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
              {
                getWeaponDefinition(
                  state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster'
                )?.name
              }
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
            <div className="text-[7px] text-[#94a3b8]">{getActiveWeaponStance(state).label}</div>
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
            <div className="text-[#94a3b8] truncate mt-0.5">Head · Arms · Frame Plating</div>
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
  );
};
