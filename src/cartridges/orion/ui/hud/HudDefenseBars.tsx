/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { getWeaponDefinition } from '../../database/equipment/weapons';
import { getItemDefinition } from '../../database/items';
import {
  GEMSTONE_CATALOG,
  getEffectiveMainGrip,
  getInventoryGemCount,
} from '../../database/progression';
import {
  cycleTargetLock,
  formatInertiaOutcomeLabel,
  getLockedTarget,
  getRoomWorldInfo,
  hasInertialTelemetryModEquipped,
  performAuxiliarySwap,
  resolvePlayerInertiaProfile,
  TUTORIAL_STEP_DESCRIPTORS,
  TutorialStepId,
} from '../../systems';
import { OrionState } from '../../types';
import { OUTLINED_TEXT } from './HudSkillDeck';

interface HudDefenseBarsProps {
  state: OrionState;
  onOpenPilotModal: () => void;
}

export const HudDefenseBars: React.FC<HudDefenseBarsProps> = ({
  state,
  onOpenPilotModal,
}) => {
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
  const tutorialStepDesc =
    isCheatMode && state.tutorialActive
      ? TUTORIAL_STEP_DESCRIPTORS[state.tutorialStep as TutorialStepId]
      : null;

  // Active Weapon & Equipment Slots
  const slot1Id = state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2Id =
    state.equipmentSlots !== undefined
      ? state.equipmentSlots.slot2
      : state.equippedWeapons[1] || null;
  const slot3Id = state.equipmentSlots?.slot3 || null;
  const mainGrip = getEffectiveMainGrip(state);

  const activeWeapon = getWeaponDefinition(slot1Id);
  const activeWeaponName = `${activeWeapon?.name || 'Gladius Boltcaster'}${mainGrip === '2h' ? ' (2h)' : ''}`;
  const isKhopesh = slot1Id === 'khopesh';
  const ammo = state.ammo;
  const maxAmmo = state.maxAmmo || activeWeapon?.shotsPerChain || 9;
  const isReloading = state.isReloading;
  const reloadTimer = state.reloadTimer;
  const lockedEnemy = getLockedTarget(state);

  return (
    <header className="w-full flex items-start justify-between gap-2 pt-5 sm:pt-1 bg-transparent">
      {/* LEFT CLUSTER: Pilot Profile & The Three Defense Layers */}
      <section
        aria-label="Defense Gauges"
        className={`flex flex-col gap-0.5 w-[132px] sm:w-[152px] bg-transparent ${OUTLINED_TEXT}`}
      >
        <button
          type="button"
          onClick={() => {
            soundSystem.playSelect();
            onOpenPilotModal();
          }}
          className="pointer-events-auto flex items-center gap-1 text-[8.5px] sm:text-[9px] tracking-wider text-[#cbd5e1] font-bold hover:text-white cursor-pointer text-left bg-transparent"
        >
          <span className="text-[#38bdf8] uppercase truncate max-w-[78px]">
            {state.pilotName}
          </span>
          <span className="text-[#64748b]">·</span>
          <span className="text-[#fde047] text-[8px] font-extrabold">
            LV.{state.level}
          </span>
        </button>

        {/* Transparent Defense Gauges Stack */}
        <div className="flex flex-col gap-0.5 bg-transparent">
          {/* Layer 1: Shield */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-[7.5px] font-bold leading-none">
              <span className="text-[#38bdf8]">SHLD</span>
              <span className={isShieldOverloaded ? 'text-[#ef4444] animate-pulse font-black' : 'text-[#7dd3fc]'}>
                {isShieldOverloaded
                  ? `OVLD ${state.shields.overloadTimer.toFixed(1)}s`
                  : `${Math.round(shieldCap)}/${shieldMax}`}
              </span>
            </div>
            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-1 mt-0.5 overflow-visible">
              <rect x="0" y="0" width="100" height="4" rx="1" fill="none" stroke="#020617" strokeWidth="1.5" />
              <rect
                x="0"
                y="0"
                width={isShieldOverloaded ? 100 : shieldPct}
                height="4"
                rx="1"
                fill={isShieldOverloaded ? '#ef4444' : '#38bdf8'}
              />
            </svg>
          </div>

          {/* Layer 2: Armor */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-[7.5px] font-bold leading-none">
              <span className="text-[#fbbf24]">ARM ({state.armor.type[0]})</span>
              <span className="text-[#fde68a]">
                {Math.round(armorDur)}/{armorMax}
              </span>
            </div>
            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-1 mt-0.5 overflow-visible">
              <rect x="0" y="0" width="100" height="4" rx="1" fill="none" stroke="#020617" strokeWidth="1.5" />
              <rect x="0" y="0" width={armorPct} height="4" rx="1" fill="#fbbf24" />
            </svg>
          </div>

          {/* Layer 3: Frame Integrity */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-[7.5px] font-bold leading-none">
              <span className={isFrameCritical ? 'text-[#ef4444] animate-pulse font-black' : 'text-[#4ade80]'}>
                FRAME {isFrameCritical ? 'CRIT' : ''}
              </span>
              <span className={isFrameCritical ? 'text-[#ef4444] font-black' : 'text-[#86efac]'}>
                {frameHP}/{frameMax}
              </span>
            </div>
            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-1 mt-0.5 overflow-visible">
              <rect x="0" y="0" width="100" height="4" rx="1" fill="none" stroke="#020617" strokeWidth="1.5" />
              <rect
                x="0"
                y="0"
                width={framePct}
                height="4"
                rx="1"
                fill={isFrameCritical ? '#ef4444' : '#4ade80'}
              />
            </svg>
          </div>

          {/* Reactor Heat (only prominent when > 0 or boosting) */}
          {(heat > 0.5 || state.isContinuousBoosting) && (
            <div className="flex flex-col">
              <div className="flex justify-between items-center text-[7px] font-bold leading-none">
                <span className={isOverheating ? 'text-[#ef4444] animate-pulse font-black' : 'text-[#f97316]'}>
                  HEAT
                </span>
                <span className={isOverheating ? 'text-[#ef4444]' : 'text-[#fdba74]'}>
                  {Math.round(heat)}%
                </span>
              </div>
              <svg viewBox="0 0 100 3" preserveAspectRatio="none" className="w-full h-0.5 mt-0.5 overflow-visible">
                <rect x="0" y="0" width="100" height="3" rx="1" fill="none" stroke="#020617" strokeWidth="1.5" />
                <rect
                  x="0"
                  y="0"
                  width={heatPct}
                  height="3"
                  rx="1"
                  fill={isOverheating ? '#ef4444' : '#f97316'}
                />
              </svg>
            </div>
          )}

          {/* Conditional HUD Inertia Telemetry (ONLY rendered when Inertial Gyro-Telemetry Mod is equipped — §1, §8) */}
          {hasInertialTelemetryModEquipped(state) &&
            (() => {
              const iProf = resolvePlayerInertiaProfile(state);
              const muPct = Math.round((state.currentMu || 0) * 100);
              const mEff = Math.round(state.effectiveWeight || iProf.totalBaseWeight);
              const hasRecentOutcome =
                (state.lastInertiaOutcomeTimer || 0) > 0 && state.lastInertiaOutcome;
              const outInfo = hasRecentOutcome
                ? formatInertiaOutcomeLabel(state.lastInertiaOutcome!)
                : null;
              return (
                <div className="mt-0.5 pt-0.5 border-t border-[#1e293b]/70 flex flex-col gap-0.2 text-[6.5px] font-bold leading-tight">
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

      {/* CENTER CLUSTER: Room Title & Æther Depth Gauge */}
      <section
        aria-label="Sector Info & Æther Gauge"
        className={`flex flex-col items-center gap-0.5 bg-transparent ${OUTLINED_TEXT}`}
      >
        <div className="text-[8.5px] sm:text-[9px] text-[#cbd5e1] tracking-wider uppercase font-bold flex items-center gap-1 bg-transparent">
          <span>{worldInfo.roomTitle}</span>
          <span className="text-[#64748b]">·</span>
          <span className="text-[#94a3b8] text-[7.5px]">
            [{state.rx},{state.ry}]
          </span>
          {isCheatMode && (
            <>
              <span className="text-[#64748b]">·</span>
              <span className="text-[#fbbf24]">
                {worldInfo.nodeType.toUpperCase()}
              </span>
            </>
          )}
        </div>

        {/* Æther Fog Depth Gauge (SAFE · 1 .. clvl+1) */}
        {(() => {
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
            <div className="flex items-center gap-0.5 text-[6.5px] tracking-tighter font-bold bg-transparent">
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

        {lockedEnemy ? (
          <button
            type="button"
            onClick={() => cycleTargetLock(state)}
            className="pointer-events-auto mt-0.5 px-1.5 py-0.2 bg-transparent border border-[#38bdf8]/80 rounded-xs text-[7.5px] text-[#7dd3fc] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer"
          >
            <span className="text-[#fbbf24]">◎</span>
            <span>
              {lockedEnemy.name || lockedEnemy.type} ({lockedEnemy.frame.integrity} HP)
            </span>
          </button>
        ) : tutorialStepDesc ? (
          <div className="mt-0.5 px-1.5 py-0.2 bg-transparent border border-[#818cf8]/60 rounded-xs text-[7px] text-[#c7d2fe] font-bold tracking-wider uppercase">
            {tutorialStepDesc.title}
          </div>
        ) : null}
      </section>

      {/* RIGHT CLUSTER: Munitions & Salvage (Transparent, Outlined) */}
      <section
        aria-label="Munitions & Salvage"
        className={`flex flex-col items-end gap-0.5 max-w-[145px] bg-transparent ${OUTLINED_TEXT}`}
      >
        {/* Salvage Scrap & Gemstone Counter */}
        <div className="flex items-center gap-1.5 text-[8.5px] font-bold bg-transparent">
          <span className="text-[#fef08a]">⚙ {state.salvageScrap}</span>
          <span className="text-[#475569]">·</span>
          <span className="text-[#7dd3fc]">
            ◆ {GEMSTONE_CATALOG.reduce((sum, g) => sum + getInventoryGemCount(state, g.id), 0)}
          </span>
        </div>

        {/* Active Weapon & Segmented Ammo Pips */}
        <div className="flex flex-col items-end bg-transparent w-full">
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
            className="pointer-events-auto text-[8.5px] font-bold text-[#f1f5f9] hover:text-[#fbbf24] tracking-wider truncate max-w-full cursor-pointer bg-transparent"
            title={
              slot3Id || slot2Id
                ? `Main: ${activeWeaponName} · Click [L] to swap Side (${slot2Id ? getWeaponDefinition(slot2Id)?.name || getItemDefinition(slot2Id)?.name || slot2Id : 'Empty'}) ⇄ Aux (${slot3Id ? getWeaponDefinition(slot3Id)?.name || getItemDefinition(slot3Id)?.name || slot3Id : 'Empty'})`
                : activeWeaponName
            }
          >
            {activeWeaponName}
          </button>
          {slot2Id && (
            <div className="text-[7px] text-[#94a3b8] truncate max-w-full">
              {getWeaponDefinition(slot2Id)?.name || getItemDefinition(slot2Id)?.name || slot2Id}
              {mainGrip === '2h' && slot2Id === slot1Id ? ' (2h)' : ''}
            </div>
          )}

          {isReloading ? (
            <div className="text-[8.5px] text-[#f59e0b] font-black tracking-wider animate-pulse mt-0.5">
              {isKhopesh ? 'STANCE' : 'RELOAD'} {reloadTimer.toFixed(1)}s
            </div>
          ) : (
            <div className="flex items-center gap-0.5 mt-0.5">
              {Array.from({ length: maxAmmo }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-xs border transition-colors ${
                    isKhopesh ? 'w-2.5' : 'w-1.5'
                  } ${
                    i < ammo
                      ? isKhopesh
                        ? 'bg-[#e879f9] border-[#020617]'
                        : 'bg-[#38bdf8] border-[#020617]'
                      : 'bg-transparent border-[#475569]/80'
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
