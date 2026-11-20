/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  getActionPrimaryKeyBadge,
  subscribeControlBindings,
} from '../../../../engine/input/inputBindingsStore';
import { getWeaponDefinition } from '../../database/equipment/weapons';
import { getItemDefinition } from '../../database/items';
import {
  computeEffectivePlayerLightTiles,
  GEMSTONE_CATALOG,
  getEffectiveMainGrip,
  getInventoryGemCount,
} from '../../database/progression';
import {
  computeChunkFogMetrics,
  cycleTargetLock,
  formatInertiaOutcomeLabel,
  formatOrionLoreLabel,
  getActiveChunkLandmarkLabel,
  getLockedTarget,
  getRoomWorldInfo,
  hasInertialTelemetryModEquipped,
  isChunkedExpanseRoom,
  performAuxiliarySwap,
  resolvePlayerInertiaProfile,
} from '../../systems';
import { OrionState } from '../../types';
import { OUTLINED_TEXT } from './HudSkillDeck';

/**
 * Props for `HudDefenseBars`.
 * Supports both Full Tactical and Compact Retro React HUD modes.
 */
export interface HudDefenseBarsProps {
  state: OrionState;
  onOpenPilotModal: () => void;
  compactRetro?: boolean;
  devMode?: boolean;
}

/**
 * Renders the top cockpit telemetry bar (Three Defense Layers on the left, Sector & Æther Depth Gauge
 * in the center, and Salvage/Light plus `Main Hand (Right)`, `Side Hand (Left)`, and `Aux (Back)` weapon
 * readouts on the right). Supports both Full Tactical and Compact Retro React HUD modes, gates engine
 * testing metadata behind `devMode`, and mutates `state: OrionState` when cycling target lock or swapping `Side ⇄ Aux`.
 */
export const HudDefenseBars: React.FC<HudDefenseBarsProps> = ({
  state,
  onOpenPilotModal,
  compactRetro = false,
  devMode = false,
}) => {
  const [, setBindingsTick] = useState(0);
  useEffect(() => {
    return subscribeControlBindings(() => {
      setBindingsTick((t) => (t + 1) % 1000);
    });
  }, []);
  const lKeyBadge = getActionPrimaryKeyBadge('l');
  // The Three Defense Layers
  const shieldCap = state.shields.capacity;
  const shieldMax = state.shields.maxCapacity || 100;
  const shieldPct = Math.max(0, Math.min(100, (shieldCap / shieldMax) * 100));
  const isShieldOverloaded = state.shields.overloaded;

  const armorDur = state.armor.durability;
  const armorMax = state.armor.maxDurability || 80;
  const armorPct = Math.max(0, Math.min(100, (armorDur / armorMax) * 100));

  const frameHP = state.frame.integrity;
  const frameMax = state.frame.maxIntegrity || 200;
  const framePct = Math.max(0, Math.min(100, (frameHP / frameMax) * 100));
  const isFrameCritical = frameHP <= 40;

  const heat = state.heat;
  const maxHeat = state.maxHeat || 100;
  const heatPct = Math.max(0, Math.min(100, (heat / maxHeat) * 100));
  const isOverheating = heatPct >= 80;

  // Generic World & Sector Metadata via worldSystem
  const worldInfo = getRoomWorldInfo(state);
  const isCheatMode = state.room === '-4,0' || Boolean(state.bypassProgressionGates);

  // Active Weapon & Equipment Slots: Main Hand (Right), Side Hand (Left), and Aux (Back)
  const slot1Id = state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2Id =
    state.equipmentSlots !== undefined
      ? state.equipmentSlots.slot2
      : state.equippedWeapons[1] || null;
  const slot3Id = state.equipmentSlots?.slot3 || state.equippedWeapons[2] || null;
  const mainGrip = getEffectiveMainGrip(state);

  const activeWeapon = getWeaponDefinition(slot1Id);
  const activeWeaponName = `${activeWeapon?.name || 'Gladius Boltcaster'}${mainGrip === '2h' ? ' (2H)' : ' (1H)'}${devMode ? ` [${slot1Id}]` : ''}`;
  const sideDisplayName = slot2Id
    ? `${getWeaponDefinition(slot2Id)?.name || getItemDefinition(slot2Id)?.name || slot2Id}${
        mainGrip === '2h' && slot2Id === slot1Id ? ' (2H)' : ''
      }${devMode ? ` [${slot2Id}]` : ''}`
    : mainGrip === '2h'
      ? '2H Grip'
      : 'Empty';
  const auxDisplayName = slot3Id
    ? `${getWeaponDefinition(slot3Id)?.name || getItemDefinition(slot3Id)?.name || slot3Id}${devMode ? ` [${slot3Id}]` : ''}`
    : 'Empty';

  const isKhopesh = slot1Id === 'khopesh';
  const ammo = state.ammo;
  const maxAmmo = state.maxAmmo || activeWeapon?.shotsPerChain || 9;
  const isReloading = state.isReloading;
  const reloadTimer = state.reloadTimer;
  const lockedEnemy = getLockedTarget(state);
  const cleanRoomTitle = formatOrionLoreLabel(
    getActiveChunkLandmarkLabel(state) || worldInfo.roomTitle,
    devMode
  );

  return (
    <header className="w-full flex items-start justify-between gap-2 pt-5 sm:pt-1 bg-transparent">
      {/* LEFT CLUSTER: Pilot Profile & The Three Defense Layers */}
      <section
        aria-label="Defense Gauges"
        className={`flex flex-col gap-0.5 ${
          compactRetro ? 'w-[116px] sm:w-[132px]' : 'w-[134px] sm:w-[154px]'
        } bg-[#05070a]/80 border border-[#1e293b]/90 px-1.5 py-1 rounded-[1px] shadow-[2px_2px_0_#020617] ${OUTLINED_TEXT}`}
      >
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => {
              soundSystem.playSelect();
              onOpenPilotModal();
            }}
            className="pointer-events-auto flex items-center gap-1 text-[9px] sm:text-[10px] tracking-wider text-[#cbd5e1] font-bold hover:text-white cursor-pointer text-left bg-transparent"
          >
            <span className="text-[#38bdf8] uppercase truncate max-w-[74px]">
              {state.pilotName}
            </span>
            <span className="text-[#64748b]">·</span>
            <span className="text-[#fde047] text-[9px] font-extrabold">
              LV.{state.level}
            </span>
          </button>
          {devMode && (
            <span
              title="Developer Mode Active (Press F3 or ` to toggle)"
              className="px-1 py-0.1 rounded-[1px] bg-[#451a03] border border-[#f59e0b]/80 text-[#fde047] text-[9px] font-black tracking-wider"
            >
              DEV
            </span>
          )}
        </div>

        {/* Crisp Retro-Modern Segmented Defense Gauges Stack */}
        <div className="flex flex-col gap-0.5 bg-transparent">
          {/* Layer 1: Shield */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-[9px] font-bold leading-none">
              <span className="text-[#38bdf8] tracking-wider">SHLD</span>
              <span className={isShieldOverloaded ? 'text-[#ef4444] animate-pulse font-black' : 'text-[#7dd3fc] tabular-nums'}>
                {isShieldOverloaded
                  ? devMode
                    ? `OVLD ${state.shields.overloadTimer.toFixed(1)}s`
                    : 'OVERLOAD'
                  : devMode
                    ? `${Math.round(shieldCap)}/${shieldMax}`
                    : ''}
              </span>
            </div>
            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-1.5 mt-0.5 overflow-visible">
              <rect x="0" y="0" width="100" height="4" fill="#090d16" stroke="#020617" strokeWidth="1.2" />
              <rect
                x="0"
                y="0"
                width={isShieldOverloaded ? 100 : shieldPct}
                height="4"
                fill={isShieldOverloaded ? '#ef4444' : '#38bdf8'}
              />
              <line x1="25" y1="0" x2="25" y2="4" stroke="#020617" strokeWidth="0.8" />
              <line x1="50" y1="0" x2="50" y2="4" stroke="#020617" strokeWidth="0.8" />
              <line x1="75" y1="0" x2="75" y2="4" stroke="#020617" strokeWidth="0.8" />
            </svg>
          </div>

          {/* Layer 2: Armor */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-[9px] font-bold leading-none">
              <span className="text-[#fbbf24] tracking-wider">ARM ({state.armor.type[0]})</span>
              {devMode && (
                <span className="text-[#fde68a] tabular-nums">
                  {Math.round(armorDur)}/{armorMax}
                </span>
              )}
            </div>
            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-1.5 mt-0.5 overflow-visible">
              <rect x="0" y="0" width="100" height="4" fill="#090d16" stroke="#020617" strokeWidth="1.2" />
              <rect x="0" y="0" width={armorPct} height="4" fill="#fbbf24" />
              <line x1="25" y1="0" x2="25" y2="4" stroke="#020617" strokeWidth="0.8" />
              <line x1="50" y1="0" x2="50" y2="4" stroke="#020617" strokeWidth="0.8" />
              <line x1="75" y1="0" x2="75" y2="4" stroke="#020617" strokeWidth="0.8" />
            </svg>
          </div>

          {/* Layer 3: Frame Integrity */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-[9px] font-bold leading-none">
              <span className={isFrameCritical ? 'text-[#ef4444] animate-pulse font-black tracking-wider' : 'text-[#4ade80] tracking-wider'}>
                FRAME {isFrameCritical ? 'CRIT' : ''}
              </span>
              {devMode && (
                <span className={isFrameCritical ? 'text-[#ef4444] font-black tabular-nums' : 'text-[#86efac] tabular-nums'}>
                  {frameHP}/{frameMax}
                </span>
              )}
            </div>
            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-1.5 mt-0.5 overflow-visible">
              <rect x="0" y="0" width="100" height="4" fill="#090d16" stroke="#020617" strokeWidth="1.2" />
              <rect
                x="0"
                y="0"
                width={framePct}
                height="4"
                fill={isFrameCritical ? '#ef4444' : '#4ade80'}
              />
              <line x1="25" y1="0" x2="25" y2="4" stroke="#020617" strokeWidth="0.8" />
              <line x1="50" y1="0" x2="50" y2="4" stroke="#020617" strokeWidth="0.8" />
              <line x1="75" y1="0" x2="75" y2="4" stroke="#020617" strokeWidth="0.8" />
            </svg>
          </div>

          {/* Reactor Heat (only prominent when > 0 or boosting) */}
          {(heat > 0.5 || state.isContinuousBoosting) && (
            <div className="flex flex-col">
              <div className="flex justify-between items-center text-[9px] font-bold leading-none">
                <span className={isOverheating ? 'text-[#ef4444] animate-pulse font-black' : 'text-[#f97316]'}>
                  {isOverheating ? 'HEAT OVHT' : 'HEAT'}
                </span>
                {devMode && (
                  <span className={isOverheating ? 'text-[#ef4444] tabular-nums' : 'text-[#fdba74] tabular-nums'}>
                    {Math.round(heat)}%
                  </span>
                )}
              </div>
              <svg viewBox="0 0 100 3" preserveAspectRatio="none" className="w-full h-1 mt-0.5 overflow-visible">
                <rect x="0" y="0" width="100" height="3" fill="#090d16" stroke="#020617" strokeWidth="1.2" />
                <rect
                  x="0"
                  y="0"
                  width={heatPct}
                  height="3"
                  fill={isOverheating ? '#ef4444' : '#f97316'}
                />
              </svg>
            </div>
          )}

          {/* Conditional HUD Inertia Telemetry (rendered when Inertial Gyro-Telemetry Mod is equipped or Dev Mode is on) */}
          {(hasInertialTelemetryModEquipped(state) || devMode) &&
            (() => {
              const iProf = resolvePlayerInertiaProfile(state);
              const muPct = Math.round((state.currentMu || 0) * 100);
              const mEff = Math.round(state.effectiveWeight || iProf.totalBaseWeight);
              const hasRecentOutcome =
                (state.lastInertiaOutcomeTimer || 0) > 0 && state.lastInertiaOutcome;
              const outInfo = hasRecentOutcome
                ? // Safe: `hasRecentOutcome` checks `Boolean(state.lastInertiaOutcome)` on the line above
                  formatInertiaOutcomeLabel(state.lastInertiaOutcome!)
                : null;
              return (
                <div className="mt-0.5 pt-0.5 border-t border-[#1e293b]/70 flex flex-col gap-0.2 text-[9px] font-bold leading-tight">
                  <div className="flex justify-between items-center text-[#7dd3fc]">
                    <span>
                      m_eff {mEff} {muPct >= 55 ? `⚡CHG ${muPct}%` : `(${muPct}% μ)`}
                    </span>
                    <span className="text-[#4ade80]">
                      S:{iProf.stability} (≤{iProf.shrugOffDeadbandDv})
                    </span>
                  </div>
                  {outInfo ? (
                    <div className="flex justify-between items-center text-[#fbbf24]">
                      <span>IMP: {outInfo.label}</span>
                      <span>
                        Δv:{Math.round(state.lastImpactDv || 0)}→
                        {Math.round(state.lastImpactDvEff || 0)}
                      </span>
                    </div>
                  ) : (state.recoilRestrictionTimer || 0) > 0 ? (
                    <div className="text-[#c084fc]">
                      RECOIL DAMPING ({Math.round((state.recoilSpeedMult ?? 1) * 100)}% SPD)
                    </div>
                  ) : null}
                </div>
              );
            })()}
        </div>
      </section>

      {/* CENTER CLUSTER: Room Title & Optional Developer Mode Telemetry (No Coordinates on HUD) */}
      <section
        aria-label="Sector Info & Æther Gauge"
        className={`flex flex-col items-center gap-0.5 bg-transparent ${OUTLINED_TEXT}`}
      >
        <div className="px-2 py-0.5 bg-[#05070a]/80 border border-[#1e293b]/90 rounded-[1px] shadow-[2px_2px_0_#020617] text-[9px] sm:text-[10px] text-[#e2e8f0] tracking-wider uppercase font-bold flex items-center gap-1">
          <span>{cleanRoomTitle}</span>
          {devMode && isCheatMode && (
            <>
              <span className="text-[#64748b]">·</span>
              <span className="text-[#fbbf24]">
                {worldInfo.nodeType.toUpperCase()}
              </span>
            </>
          )}
        </div>

        {/* Æther Fog Depth Gauge, Path Status & Lantern Status (Gated behind Developer Mode) */}
        {devMode &&
          (() => {
            if (isChunkedExpanseRoom(state.room)) {
              const fog = computeChunkFogMetrics(state);
              const isSetPath = fog.distFromSetPath === 0;
              const fogPct = Math.round(fog.fogIntensity * 100);

              return (
                <div className="flex flex-wrap items-center justify-center gap-1 text-[9px] tracking-tighter font-bold bg-transparent">
                  <span
                    className={`px-1 rounded-[1px] border bg-[#05070a]/80 ${
                      isSetPath
                        ? 'text-[#4ade80] border-[#4ade80]/85 font-black'
                        : fog.isSoftCapAbyss
                          ? 'text-[#f43f5e] border-[#f43f5e]/85 font-black animate-pulse'
                          : 'text-[#c084fc] border-[#c084fc]/85 font-black'
                    }`}
                  >
                    {isSetPath
                      ? 'SET PATH · SAFE'
                      : fog.isSoftCapAbyss
                        ? `ABYSS CAP · DIST ${fog.distFromSetPath} (SAFE ≤${fog.safeDepth})`
                        : `OFF-PATH · DIST ${fog.distFromSetPath}/${fog.safeDepth}`}
                  </span>
                  {!isSetPath && (
                    <span
                      className={`px-1 rounded-[1px] border bg-[#05070a]/80 ${
                        fog.isSoftCapAbyss
                          ? 'border-[#f43f5e]/80 text-[#fda4af]'
                          : 'border-[#38bdf8]/75 text-[#7dd3fc]'
                      }`}
                    >
                      FOG {fogPct}% · LOOT ×{fog.lootMultiplier}
                    </span>
                  )}
                  {fog.isLanternLit && (
                    <span className="px-1 rounded-[1px] border border-[#22d3ee]/85 bg-[#05070a]/80 text-[#67e8f9] font-black">
                      LANTERN LIT
                    </span>
                  )}
                  {fog.hasDeepDungeon && (
                    <span
                      className={`px-1 rounded-[1px] border bg-[#05070a]/80 font-black ${
                        fog.isDeepDungeonCleared
                          ? 'border-[#4ade80]/85 text-[#86efac]'
                          : 'border-[#fbbf24]/85 text-[#fde047]'
                      }`}
                    >
                      {fog.isDeepDungeonCleared
                        ? 'RUIN SANCTUM CLEARED'
                        : 'SUNKEN RUIN SANCTUM'}
                    </span>
                  )}
                </div>
              );
            }

            const curStage = worldInfo.loopStage || 0;
            const curDepth = worldInfo.loopDepth || 0;
            const maxDepth = Math.max(2, worldInfo.loopMaxDepth || (state.level || 1) + 1);
            const inLoop = worldInfo.nodeType === 'loop' || curDepth > 0;

            const depthSteps: Array<{ label: string; depth: number }> = [
              { label: 'SAFE', depth: 0 },
              ...Array.from({ length: maxDepth }, (_, idx) => ({
                label: String(idx + 1),
                depth: idx + 1,
              })),
            ];

            return (
              <div className="flex items-center gap-0.5 text-[9px] tracking-tighter font-bold bg-[#05070a]/80 px-1 py-0.5 rounded-[1px] border border-[#1e293b]/80">
                {depthSteps.map((step, i) => {
                  const isActiveStep = inLoop
                    ? curDepth === step.depth
                    : step.depth === 0;
                  const activeColor =
                    step.depth >= maxDepth
                      ? 'text-[#f43f5e] border-[#f43f5e]/85'
                      : step.depth >= 2
                        ? 'text-[#c084fc] border-[#c084fc]/85'
                        : step.depth === 1
                          ? 'text-[#22d3ee] border-[#22d3ee]/85'
                          : 'text-[#4ade80] border-[#4ade80]/80';

                  return (
                    <React.Fragment key={step.depth}>
                      <span
                        className={`px-1 rounded-[1px] border ${
                          isActiveStep
                            ? `${activeColor} font-black`
                            : 'border-transparent text-[#64748b]'
                        }`}
                      >
                        {step.label}
                      </span>
                      {i < depthSteps.length - 1 && (
                        <span className="text-[#475569]">·</span>
                      )}
                    </React.Fragment>
                  );
                })}
                {inLoop && (
                  <span
                    className={`ml-0.5 px-1 rounded-[1px] border ${
                      curDepth >= maxDepth
                        ? 'border-[#f43f5e]/80 text-[#fda4af]'
                        : 'border-[#a855f7]/60 text-[#d8b4fe]'
                    }`}
                  >
                    {curDepth >= maxDepth
                      ? worldInfo.hasFogBoss
                        ? 'MAX·BOSS'
                        : `MAX·1/${maxDepth}`
                      : `RM ${Math.max(1, curStage)}/${curDepth}`}
                  </span>
                )}
              </div>
            );
          })()}

        {lockedEnemy && (
          <button
            type="button"
            onClick={() => cycleTargetLock(state)}
            className="pointer-events-auto mt-0.5 px-1.5 py-0.5 bg-[#05070a]/85 border border-[#38bdf8]/80 rounded-[1px] shadow-[1px_1px_0_#020617] text-[9px] text-[#7dd3fc] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer"
          >
            <span className="text-[#fbbf24]">◎</span>
            <span>
              {lockedEnemy.name || lockedEnemy.type}
              {devMode ? ` (${lockedEnemy.frame.integrity} HP)` : ''}
            </span>
          </button>
        )}
      </section>

      {/* RIGHT CLUSTER: Munitions, Salvage & 3-Slot Weapon Readout (Main [R], Side [L], Aux [Back]) */}
      <section
        aria-label="Munitions & Salvage"
        className={`flex flex-col items-end gap-0.5 ${
          compactRetro ? 'max-w-[132px]' : 'max-w-[162px]'
        } bg-[#05070a]/80 border border-[#1e293b]/90 px-1.5 py-1 rounded-[1px] shadow-[2px_2px_0_#020617] ${OUTLINED_TEXT}`}
      >
        {/* Salvage Scrap, Gemstone Counter & Dev-Mode Player Light Stat */}
        <div className="flex items-center gap-1 text-[9px] font-bold bg-transparent tabular-nums">
          <span className="text-[#fef08a]">⚙ {state.salvageScrap}</span>
          <span className="text-[#475569]">·</span>
          <span className="text-[#7dd3fc]">
            ◆ {GEMSTONE_CATALOG.reduce((sum, g) => sum + getInventoryGemCount(state, g.id), 0)}
          </span>
          {devMode && (
            <>
              <span className="text-[#475569]">·</span>
              <span
                className="text-[#fde047]"
                title="Light Stat (Base 5 tiles; modified by feats, items, hardware, skills, and spells)"
              >
                ☀{computeEffectivePlayerLightTiles(state)}
              </span>
            </>
          )}
        </div>

        {/* Main Hand (Right), Side Hand (Left), and Aux (Back) Readouts + Segmented Ammo Pips */}
        <div className="flex flex-col items-end bg-transparent w-full gap-0.5">
          {/* 1. MAIN HAND (RIGHT) */}
          <div className="flex items-center justify-end gap-1 max-w-full text-[9px] font-bold leading-none">
            {!compactRetro && <span className="text-[#fde047] shrink-0">R·MAIN:</span>}
            <span className="text-[#f8fafc] truncate">{activeWeaponName}</span>
          </div>

          {!compactRetro && (
            <>
              {/* 2. SIDE HAND (LEFT) */}
              <button
                type="button"
                onClick={() => {
                  performAuxiliarySwap(state, {
                    say: (txt) => {
                      state.toastText = txt;
                      state.toastTimer = 2.2;
                    },
                  });
                }}
                title={`Side Hand (Left) · Click or Hold [L · ${lKeyBadge}] to swap Side (Left) ⇄ Aux (Back)`}
                className="pointer-events-auto flex items-center justify-end gap-1 max-w-full text-[9px] font-bold leading-none hover:text-[#fbbf24] cursor-pointer bg-transparent"
              >
                <span className="text-[#38bdf8] shrink-0">L·SIDE:</span>
                <span className="text-[#cbd5e1] truncate">{sideDisplayName}</span>
              </button>

              {/* 3. AUXILIARY (BACK) */}
              <button
                type="button"
                onClick={() => {
                  performAuxiliarySwap(state, {
                    say: (txt) => {
                      state.toastText = txt;
                      state.toastTimer = 2.2;
                    },
                  });
                }}
                title={`Auxiliary (Back) · Click or Hold [L · ${lKeyBadge}] to swap Side (Left) ⇄ Aux (Back)`}
                className="pointer-events-auto flex items-center justify-end gap-1 max-w-full text-[9px] font-bold leading-none hover:text-[#fbbf24] cursor-pointer bg-transparent"
              >
                <span className="text-[#c084fc] shrink-0">B·AUX:</span>
                <span className="text-[#cbd5e1] truncate">{auxDisplayName}</span>
              </button>
            </>
          )}

          {isReloading ? (
            <div className="text-[9px] text-[#f59e0b] font-black tracking-wider animate-pulse mt-0.5">
              {isKhopesh ? 'STANCE' : 'RELOAD'} {reloadTimer.toFixed(1)}s
            </div>
          ) : (
            <div className="flex items-center gap-0.5 mt-0.5">
              {Array.from({ length: maxAmmo }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-[1px] border transition-colors ${
                    isKhopesh ? 'w-2.5' : 'w-1.5'
                  } ${
                    i < ammo
                      ? isKhopesh
                        ? 'bg-[#e879f9] border-[#020617]'
                        : 'bg-[#38bdf8] border-[#020617]'
                      : 'bg-[#090d16] border-[#475569]/80'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </header>
  );
};
