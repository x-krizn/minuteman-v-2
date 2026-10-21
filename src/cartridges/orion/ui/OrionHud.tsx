/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import { TRAIT_LIST, TRAIT_REGISTRY } from '../database/characters';
import { getClassUtilityDefinition } from '../database/equipment';
import {
  GEMSTONE_CATALOG,
  GEMSTONE_REGISTRY,
  getInventoryGemCount,
  TRAIT_FUNDING_GEMS,
} from '../database/progression';
import { getWeaponDefinition } from '../database/weapons';
import {
  applyTraitLineProfile,
  createNewPilotGame,
  cycleTargetLock,
  deletePilotFromRoster,
  getActionCooldown,
  getLockedTarget,
  getOrionStateRef,
  getRoomWorldInfo,
  loadPilotFromRoster,
  loadPilotRoster,
  notifyOrionStateChange,
  performWeaponSwap,
  resolveTriggerAction,
  TUTORIAL_STEP_DESCRIPTORS,
  TutorialStepId,
} from '../systems';
import { TraitLine } from '../types';

const DEFAULT_CALLSIGNS: Record<TraitLine, string> = {
  Warrior: 'Pilot Vane',
  Marauder: 'Pilot Kael',
  Guardian: 'Pilot Seraph',
  Rogue: 'Pilot Nyx',
  Wizard: 'Pilot Soren',
  Cleric: 'Pilot Lyra',
};

export const OrionHud: React.FC = () => {
  const [, setTick] = useState(0);
  const [showPilotModal, setShowPilotModal] = useState(false);
  const [titleTab, setTitleTab] = useState<'new' | 'load'>('new');

  useEffect(() => {
    let animId: number;
    let lastTime = 0;
    const loop = (t: number) => {
      // 30 FPS throttle keeps battery and rendering performance optimal
      if (t - lastTime >= 32) {
        lastTime = t;
        setTick((prev) => (prev + 1) % 10000);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const state = getOrionStateRef();
  if (!state) return null;

  const isTitleMenuOpen = Boolean(state.atTitleMenu) || showPilotModal;

  if (isTitleMenuOpen) {
    const roster = loadPilotRoster();
    const activeTrait = state.traitLine || 'Warrior';
    const traitProfile = TRAIT_REGISTRY[activeTrait] || TRAIT_REGISTRY.Warrior;
    const utilDef = getClassUtilityDefinition(undefined, activeTrait);

    return (
      <aside
        aria-label="Project Orion Main Menu & Pilot Creation"
        className="absolute inset-0 z-40 pointer-events-auto bg-[#05070a]/92 backdrop-blur-xs flex flex-col justify-between p-2.5 sm:p-3.5 select-none font-mono text-[#e2e8f0] overflow-y-auto"
      >
        {/* Top Title Banner */}
        <div className="border-b border-[#1e293b] pb-2 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs sm:text-sm font-black tracking-wider text-[#ffd27d] flex items-center gap-2">
              <span>PROJECT ORION: BELLDOR EXPEDITION</span>
              <span className="text-[8.5px] px-1.5 py-0.5 bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40 rounded-xs font-bold">
                MAIN MENU
              </span>
            </div>
            <div className="text-[8.5px] text-[#94a3b8] tracking-wide mt-0.5">
              D-PAD / CLICK: SELECT TRAIT LINE · [A] DEPLOY NEW PILOT · [Y] CONTINUE
            </div>
          </div>

          {!state.atTitleMenu && (
            <button
              type="button"
              onClick={() => {
                soundSystem.playMenuBeep();
                setShowPilotModal(false);
              }}
              className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#facc15] border border-[#475569] rounded-xs text-[9.5px] font-bold cursor-pointer"
            >
              ✕ RESUME COCKPIT
            </button>
          )}
        </div>

        {/* Mode Switcher Bar: NEW GAME / LOAD GAME ROSTER / QUICK CONTINUE */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 my-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                setTitleTab('new');
              }}
              className={`px-2.5 py-1 rounded-xs text-[10px] font-bold border cursor-pointer transition-colors ${
                titleTab === 'new'
                  ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                  : 'bg-[#0f172a] text-[#cbd5e1] border-[#334155] hover:border-[#facc15]'
              }`}
            >
              ✨ NEW GAME (CREATE PILOT)
            </button>
            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                setTitleTab('load');
              }}
              className={`px-2.5 py-1 rounded-xs text-[10px] font-bold border cursor-pointer transition-colors ${
                titleTab === 'load'
                  ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                  : 'bg-[#0f172a] text-[#cbd5e1] border-[#334155] hover:border-[#38bdf8]'
              }`}
            >
              📂 LOAD GAME ({roster.length})
            </button>
          </div>

          {roster.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (loadPilotFromRoster(state, roster[0].pilotId)) {
                  soundSystem.playPowerup();
                  state.atTitleMenu = false;
                  setShowPilotModal(false);
                  notifyOrionStateChange();
                }
              }}
              className="px-2.5 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white border border-[#38bdf8] rounded-xs text-[9.5px] font-bold cursor-pointer"
            >
              ▶ [Y] CONTINUE: {roster[0].pilotName.toUpperCase()} ({roster[0].traitLine} LV.{roster[0].level})
            </button>
          )}
        </div>

        {/* Main Content Area */}
        {titleTab === 'new' ? (
          <div className="flex-1 flex flex-col justify-between space-y-2 text-[10px]">
            {/* Step 1: Trait Line Selection */}
            <div>
              <div className="text-[9px] font-bold text-[#94a3b8] mb-1">
                STEP 1 — SELECT TRAIT LINE & MECH FRAME (§2.4 LOCKED)
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {TRAIT_LIST.map((t) => {
                  const isSel = activeTrait === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        const isDefault =
                          Object.values(DEFAULT_CALLSIGNS).includes(state.pilotName) ||
                          !state.pilotName.trim();
                        applyTraitLineProfile(state, t.id);
                        if (isDefault) {
                          state.pilotName = DEFAULT_CALLSIGNS[t.id];
                        }
                        notifyOrionStateChange();
                      }}
                      className={`p-1.5 rounded-xs border text-left cursor-pointer transition-colors ${
                        isSel
                          ? 'bg-[#1e293b] border-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.25)]'
                          : 'bg-[#090d16] border-[#1e293b] hover:border-[#475569]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#ffd27d] text-[10px]">{t.name}</span>
                        <span className="text-[7.5px] px-1 bg-[#0f172a] text-[#38bdf8] border border-[#1e293b] rounded-xs font-bold">
                          {t.reactor}
                        </span>
                      </div>
                      <div className="text-[8px] text-[#cbd5e1] mt-0.5 truncate">
                        {t.frameModel} · {(t.weightClass || 'medium').toUpperCase()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Frame Specification Card */}
            <div className="p-2 bg-[#0b111e] border border-[#334155] rounded-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#38bdf8] text-[10px]">
                  FRAME: {traitProfile.frameModel} — {traitProfile.name.toUpperCase()}
                </span>
                <span className="text-[8px] px-1.5 py-0.5 bg-[#1e293b] text-[#facc15] rounded-xs font-bold">
                  BASE LOAD: {(traitProfile.weightClass || 'medium').toUpperCase()} · INTEGRITY: 200 HP
                </span>
              </div>
              <div className="text-[8.5px] text-[#cbd5e1] leading-snug">
                {traitProfile.identity}
              </div>
              <div className="grid grid-cols-4 gap-1 pt-0.5 text-[8px]">
                <div className="p-1 bg-[#090d16] border border-[#1e293b] rounded-xs">
                  <div className="text-[#94a3b8]">LAYER 1 SHIELD</div>
                  <div className="text-[#7dd3fc] font-bold">
                    {traitProfile.baseShield.capacity} ({traitProfile.baseShield.type.toUpperCase()})
                  </div>
                </div>
                <div className="p-1 bg-[#090d16] border border-[#1e293b] rounded-xs">
                  <div className="text-[#94a3b8]">LAYER 2 ARMOR</div>
                  <div className="text-[#fbbf24] font-bold">
                    {traitProfile.baseArmor.type} ({traitProfile.baseArmor.durability} DUR)
                  </div>
                </div>
                <div className="p-1 bg-[#090d16] border border-[#1e293b] rounded-xs">
                  <div className="text-[#94a3b8]">LV.6 UTILITY [ACT 6]</div>
                  <div className="text-[#4ade80] font-bold truncate">{utilDef.shortLabel}</div>
                </div>
                <div className="p-1 bg-[#090d16] border border-[#1e293b] rounded-xs">
                  <div className="text-[#94a3b8]">STARTER GEM POUCH</div>
                  {(() => {
                    const [tGemId, rGemId] = TRAIT_FUNDING_GEMS[activeTrait] || [
                      'spinel',
                      'hematite',
                    ];
                    const tGem = GEMSTONE_REGISTRY[tGemId];
                    const rGem = GEMSTONE_REGISTRY[rGemId];
                    return (
                      <div className="font-bold text-[#f8fafc] truncate">
                        <span style={{ color: tGem.hexColor }}>◆</span> {tGem.name} +{' '}
                        <span style={{ color: rGem.hexColor }}>◆</span> {rGem.name}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Step 2 & 3: Pilot Name Input + Deploy Button */}
            <div className="p-2 bg-[#0b111e] border border-[#facc15]/50 rounded-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-[#ffd27d]">
                  STEP 2 — ENTER PILOT CALLSIGN & DEPLOY AT LEVEL 1 (M00: THE BOG)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playMenuBeep();
                    state.pilotName = DEFAULT_CALLSIGNS[activeTrait];
                    notifyOrionStateChange();
                  }}
                  className="text-[8px] text-[#38bdf8] hover:underline cursor-pointer"
                >
                  Reset Callsign ({DEFAULT_CALLSIGNS[activeTrait]})
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={22}
                  value={state.pilotName}
                  onChange={(e) => {
                    state.pilotName = e.target.value;
                    setTick((t) => t + 1);
                  }}
                  placeholder="Enter Pilot Name..."
                  className="flex-1 bg-[#020617] border border-[#475569] focus:border-[#facc15] rounded-xs px-2.5 py-1.5 text-[11px] text-white font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const finalName =
                      state.pilotName.trim() || DEFAULT_CALLSIGNS[activeTrait];
                    createNewPilotGame(state, activeTrait, finalName);
                    state.atTitleMenu = false;
                    setShowPilotModal(false);
                    soundSystem.playPowerup();
                    notifyOrionStateChange();
                  }}
                  className="px-3.5 py-1.5 bg-[#facc15] hover:bg-[#fde047] text-[#05070a] font-black text-[10.5px] rounded-xs shadow-md cursor-pointer shrink-0"
                >
                  🚀 [A] DEPLOY LV.1 (M00 BOG)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* LOAD GAME — SAVED PILOT CHARACTER ROSTER (§2.4) */
          <div className="flex-1 flex flex-col justify-between space-y-2 text-[10px]">
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold text-[#94a3b8]">
                SAVED PILOT CHARACTER ROSTER (§2.4 — SELECT A PILOT TO LOAD)
              </div>
              {roster.length === 0 ? (
                <div className="p-6 bg-[#0b111e] border border-[#1e293b] rounded-xs text-center space-y-2">
                  <div className="text-[#94a3b8]">
                    No saved pilots found in localStorage roster yet.
                  </div>
                  <button
                    type="button"
                    onClick={() => setTitleTab('new')}
                    className="px-3 py-1 bg-[#facc15] text-[#05070a] font-bold rounded-xs text-[10px] cursor-pointer"
                  >
                    + CREATE YOUR FIRST PILOT
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                  {roster.map((entry) => {
                    const zoneLabel =
                      entry.areaId === 'camelot_border_town'
                        ? 'Camelot Border Town'
                        : entry.areaId === 'm01_orc_encampment'
                          ? 'M01 Orc Encampment'
                          : 'M00 The Bog';
                    return (
                      <div
                        key={entry.pilotId}
                        className="p-2 bg-[#0b111e] border border-[#334155] rounded-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[11px] text-[#ffd27d] truncate">
                              {entry.pilotName}
                            </span>
                            <span className="text-[8.5px] px-1.5 py-0.2 bg-[#090d16] text-[#38bdf8] border border-[#1e293b] rounded-xs font-bold">
                              LV.{entry.level} {entry.traitLine.toUpperCase()}
                            </span>
                            <span className="text-[8px] text-[#94a3b8]">
                              [{entry.frameModel} · {entry.reactor}]
                            </span>
                          </div>
                          <div className="text-[8.5px] text-[#94a3b8] mt-0.5">
                            Zone: <span className="text-[#cbd5e1]">{zoneLabel}</span> ({entry.room}) ·{' '}
                            {entry.tutorialActive ? 'Tutorial Onboarding' : 'Standard Progression'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (loadPilotFromRoster(state, entry.pilotId)) {
                                state.atTitleMenu = false;
                                setShowPilotModal(false);
                                soundSystem.playPowerup();
                                notifyOrionStateChange();
                              }
                            }}
                            className="px-2.5 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xs text-[9.5px] cursor-pointer"
                          >
                            ▶ LOAD PILOT
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              soundSystem.playMenuBeep();
                              deletePilotFromRoster(entry.pilotId);
                              setTick((t) => t + 1);
                            }}
                            className="px-2 py-1 bg-[#1e293b] hover:bg-[#7f1d1d] text-[#fca5a5] font-bold rounded-xs text-[9px] border border-[#334155] cursor-pointer"
                            title="Delete Pilot from Roster"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    );
  }

  if (state.useStandardResolutionHud === false) return null;

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
  const tutorialStepDesc = state.tutorialActive
    ? TUTORIAL_STEP_DESCRIPTORS[state.tutorialStep as TutorialStepId]
    : null;

  // Active Weapon & Magazine
  const currentWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const activeWeapon = getWeaponDefinition(currentWeaponId);
  const activeWeaponName = activeWeapon?.name || 'Gladius Boltcaster';
  const isKhopesh = currentWeaponId === 'khopesh';
  const ammo = state.ammo;
  const maxAmmo = state.maxAmmo || activeWeapon?.shotsPerChain || 9;
  const isReloading = state.isReloading;
  const reloadTimer = state.reloadTimer;
  const swapCooldown = state.weaponSwapCooldown || 0;
  const totalWeapons = state.equippedWeapons.length;

  // X Basic Attack + Assignable L & R Multi-Source Actions
  const move0Name = isKhopesh ? 'SICKLE COMBO' : 'AUTO-SALVO';
  const actionL = resolveTriggerAction(state, 'L');
  const actionR = resolveTriggerAction(state, 'R');
  const cdL = getActionCooldown(state, actionL.id);
  const cdR = getActionCooldown(state, actionR.id);
  const lockedEnemy = getLockedTarget(state);
  const yHoldPct = Math.min(100, ((state.yHoldTimer || 0) / 0.32) * 100);

  return (
    <aside
      aria-label="Pilot Mech Cockpit Telemetry"
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5 sm:p-2 z-20 select-none font-mono text-[#e2e8f0]"
    >
      {/* 1. TOP BAR HUD CLUSTER (Standard Resolution, High-Contrast Cockpit Readouts) */}
      <header className="w-full flex items-start justify-between gap-2 pt-6 sm:pt-1">
        {/* LEFT CLUSTER: Pilot Profile & The Three Defense Layers */}
        <section aria-label="Defense Gauges" className="flex flex-col gap-1 max-w-[200px] sm:max-w-[230px]">
          {/* Pilot Identity Header (Clickable to open §2.4 Pilot Creation / Load Roster) */}
          <button
            type="button"
            onClick={() => {
              soundSystem.playSelect();
              setShowPilotModal(true);
            }}
            title="Click to Create New Pilot or Switch Pilot Roster (§2.4)"
            className="pointer-events-auto flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-wider text-[#94a3b8] font-bold drop-shadow hover:text-white cursor-pointer text-left"
          >
            <span className="text-[#38bdf8] uppercase truncate max-w-[95px]">
              {state.pilotName}
            </span>
            <span className="text-[#475569]">·</span>
            <span className="text-[#cbd5e1]">
              {(TRAIT_REGISTRY[state.traitLine]?.frameModel || state.traitLine).toUpperCase()}
            </span>
            <span className="bg-[#1e293b]/90 text-[#38bdf8] border border-[#38bdf8]/40 px-1 py-0.2 rounded text-[8px] font-bold">
              LVL {state.level}
            </span>
          </button>

          {/* Defense Gauges Stack */}
          <div className="flex flex-col gap-0.8 bg-[#0b1322]/85 backdrop-blur-[2px] p-1.5 rounded border border-[#334155]/60 shadow-lg">
            {/* Layer 1: Shield Gauge */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center text-[8.5px] font-bold">
                <span className="text-[#38bdf8] flex items-center gap-1">
                  <span>🛡</span>
                  <span>SHIELD</span>
                </span>
                <span className={isShieldOverloaded ? 'text-[#ef4444] animate-pulse font-extrabold' : 'text-[#7dd3fc]'}>
                  {isShieldOverloaded
                    ? `OVERLOADED (${state.shields.overloadTimer.toFixed(1)}s)`
                    : `${Math.round(shieldCap)} / ${shieldMax}`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0f172a] rounded-full overflow-hidden border border-[#1e293b] mt-0.5">
                <div
                  className={`h-full transition-all duration-150 ${
                    isShieldOverloaded
                      ? 'bg-gradient-to-r from-[#dc2626] to-[#ef4444] animate-pulse'
                      : 'bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] shadow-[0_0_6px_rgba(56,189,248,0.7)]'
                  }`}
                  style={{ width: `${isShieldOverloaded ? 100 : shieldPct}%` }}
                />
              </div>
            </div>

            {/* Layer 2: Armor Gauge */}
            <div className="flex flex-col mt-0.5">
              <div className="flex justify-between items-center text-[8.5px] font-bold">
                <span className="text-[#fbbf24] flex items-center gap-1">
                  <span>⬡</span>
                  <span>ARMOR ({state.armor.type[0]})</span>
                </span>
                <span className="text-[#fde68a]">
                  {Math.round(armorDur)} / {armorMax}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0f172a] rounded-full overflow-hidden border border-[#1e293b] mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#d97706] to-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.6)] transition-all duration-150"
                  style={{ width: `${armorPct}%` }}
                />
              </div>
            </div>

            {/* Layer 3: Frame Integrity Gauge */}
            <div className="flex flex-col mt-0.5">
              <div className="flex justify-between items-center text-[8.5px] font-bold">
                <span className={isFrameCritical ? 'text-[#ef4444] font-black animate-pulse' : 'text-[#4ade80]'}>
                  FRAME HP {isFrameCritical ? '⚠️ CRITICAL' : ''}
                </span>
                <span className={isFrameCritical ? 'text-[#ef4444] font-black' : 'text-[#86efac]'}>
                  {frameHP} / {frameMax}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0f172a] rounded-full overflow-hidden border border-[#1e293b] mt-0.5">
                <div
                  className={`h-full transition-all duration-150 ${
                    isFrameCritical
                      ? 'bg-gradient-to-r from-[#b91c1c] to-[#ef4444] animate-pulse'
                      : 'bg-gradient-to-r from-[#16a34a] to-[#4ade80] shadow-[0_0_6px_rgba(74,222,128,0.5)]'
                  }`}
                  style={{ width: `${framePct}%` }}
                />
              </div>
            </div>

            {/* Reactor Heat */}
            <div className="flex flex-col mt-0.5">
              <div className="flex justify-between items-center text-[8px] font-bold">
                <span className={isOverheating ? 'text-[#ef4444] font-black animate-pulse' : 'text-[#f97316]'}>
                  HEAT {state.isContinuousBoosting ? '⚡ BOOSTING' : isOverheating ? '🔥 OVERHEAT' : ''}
                </span>
                <span className={isOverheating ? 'text-[#ef4444] font-bold' : 'text-[#fdba74]'}>
                  {Math.round(heat)}%
                </span>
              </div>
              <div className="w-full h-1 bg-[#0f172a] rounded-full overflow-hidden border border-[#1e293b] mt-0.5">
                <div
                  className={`h-full transition-all duration-150 ${
                    isOverheating
                      ? 'bg-gradient-to-r from-[#ea580c] via-[#ef4444] to-[#f87171] animate-pulse'
                      : 'bg-gradient-to-r from-[#ea580c] to-[#f97316]'
                  }`}
                  style={{ width: `${heatPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* CENTER CLUSTER: 5-Tier Nested World Location, Aether Fog Node Type & Target Lock-On */}
        <section aria-label="Sector Info" className="hidden xs:flex flex-col items-center">
          <div className="px-2.5 py-0.5 bg-[#090d14]/90 border border-[#38bdf8]/40 rounded text-[9px] text-[#7dd3fc] tracking-wider uppercase font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs">
            <span className="text-[#38bdf8]">⬢</span>
            <span>{worldInfo.roomTitle}</span>
            <span className="text-[#475569]">·</span>
            <span
              className={
                worldInfo.nodeType === 'key'
                  ? 'text-[#fbbf24]'
                  : worldInfo.nodeType === 'general'
                    ? 'text-[#38bdf8]'
                    : worldInfo.nodeType === 'side'
                      ? 'text-[#a78bfa]'
                      : worldInfo.nodeType === 'end'
                        ? 'text-[#4ade80]'
                        : 'text-[#f43f5e]'
              }
            >
              {worldInfo.nodeType.toUpperCase()} NODE
              {worldInfo.nodeType === 'general' && worldInfo.routeStep && worldInfo.routeTotal
                ? ` (${worldInfo.routeStep}/${worldInfo.routeTotal})`
                : worldInfo.nodeType === 'loop' && worldInfo.loopDepth > 0
                  ? ` (DEPTH ${worldInfo.loopDepth})`
                  : ''}
            </span>
          </div>
          <span className="text-[8px] text-[#94a3b8] tracking-widest mt-0.5 font-semibold uppercase">
            {worldInfo.mapName} · {worldInfo.areaName} · {worldInfo.worldName}
          </span>
          {lockedEnemy ? (
            <button
              onClick={() => cycleTargetLock(state)}
              className="pointer-events-auto mt-0.5 px-2 py-0.2 bg-[#0c4a6e]/90 border border-[#38bdf8] rounded text-[8px] text-[#e0f2fe] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer"
              title="Tap [Y] to cycle target lock"
            >
              <span className="text-[#fbbf24]">◎</span>
              <span>
                LOCKED: {lockedEnemy.name} ({lockedEnemy.frame.integrity} HP)
              </span>
            </button>
          ) : tutorialStepDesc ? (
            <div className="mt-0.5 px-2 py-0.2 bg-[#1e1b4b]/85 border border-[#818cf8]/40 rounded text-[7.5px] text-[#c7d2fe] font-bold tracking-wider uppercase">
              {tutorialStepDesc.title}
            </div>
          ) : null}
        </section>

        {/* RIGHT CLUSTER: Munitions, Scrap & Hardpoint */}
        <section aria-label="Munitions & Salvage" className="flex flex-col items-end gap-1 max-w-[175px]">
          {/* Salvage Scrap & Gemstone Counter */}
          <div className="flex items-center gap-1.5 bg-[#090d14]/85 border border-[#ca8a04]/50 px-2 py-0.8 rounded shadow-md backdrop-blur-xs">
            <span className="text-[#eab308]">⚙️</span>
            <span className="text-[10.5px] font-black text-[#fef08a] tracking-wider">
              {state.salvageScrap}
            </span>
            <span className="text-[8px] text-[#ca8a04] font-bold uppercase tracking-widest">SCRAP</span>
            <span className="text-[#334155]">·</span>
            <span className="text-[#38bdf8]">◆</span>
            <span className="text-[10.5px] font-black text-[#7dd3fc] tracking-wider">
              {GEMSTONE_CATALOG.reduce((sum, g) => sum + getInventoryGemCount(state, g.id), 0)}
            </span>
            <span className="text-[8px] text-[#38bdf8] font-bold uppercase tracking-widest">GEMS</span>
          </div>

          {/* Weapon Status & Ammo Magazine Box */}
          <div className="flex flex-col items-end bg-[#0b1322]/85 backdrop-blur-[2px] p-1.5 rounded border border-[#334155]/60 shadow-lg w-full">
            <div className="w-full flex items-center justify-between gap-1.5">
              <button
                onClick={() => {
                  performWeaponSwap(state, {
                    say: (txt) => {
                      state.toastText = txt;
                      state.toastTimer = 2.5;
                    },
                  });
                }}
                className={`pointer-events-auto px-1 py-0.2 rounded text-[7.5px] font-bold border transition-colors cursor-pointer ${
                  swapCooldown > 0
                    ? 'bg-[#1e293b] text-[#94a3b8] border-[#475569]'
                    : 'bg-[#422006]/80 hover:bg-[#713f12] text-[#fbbf24] border-[#f59e0b]/60'
                }`}
                title="Hold [Y] to Swap Weapon"
              >
                {swapCooldown > 0
                  ? `CD ${swapCooldown.toFixed(1)}s`
                  : `HOLD [Y] ${state.activeWeaponIndex + 1}/${totalWeapons}`}
              </button>
              <span
                className={`text-[7.5px] px-1 rounded font-bold border ${
                  isKhopesh
                    ? 'bg-[#701a75]/60 border-[#c084fc]/50 text-[#f0abfc]'
                    : 'bg-[#0369a1]/50 border-[#0284c7]/50 text-[#38bdf8]'
                }`}
              >
                {activeWeapon?.primaryDamageType.toUpperCase() || 'PIERCE'}
              </span>
            </div>

            {yHoldPct > 5 && !state.yHoldTriggeredSwap && (
              <div className="w-full h-1 bg-[#1e293b] rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-[#fbbf24] transition-all"
                  style={{ width: `${yHoldPct}%` }}
                />
              </div>
            )}

            <div className="text-[9px] font-bold text-[#f1f5f9] tracking-wider mt-0.5 truncate max-w-full">
              {activeWeaponName}
            </div>

            {/* Reloading Alert or Ammo Pips */}
            {isReloading ? (
              <div className="text-[9.5px] text-[#f59e0b] font-black tracking-wider animate-pulse mt-1 flex items-center gap-1">
                <span>🔄</span>
                <span>{isKhopesh ? 'STANCE' : 'RELOAD'} [{reloadTimer.toFixed(1)}s]</span>
              </div>
            ) : (
              <div className="flex flex-col items-end mt-1 w-full">
                <div className="flex justify-between items-center w-full text-[8.5px] font-bold text-[#93c5fd]">
                  <span className="text-[8px] text-[#64748b]">{isKhopesh ? 'COMBO' : 'MAG'}</span>
                  <span className={isKhopesh ? 'text-[#f0abfc]' : 'text-[#93c5fd]'}>
                    {ammo} / {maxAmmo}
                  </span>
                </div>
                {/* Segmented Ammo / Combo Rounds */}
                <div className="flex items-center gap-0.8 mt-0.5">
                  {Array.from({ length: maxAmmo }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-xs border transition-colors ${
                        isKhopesh ? 'w-3' : 'w-1.5'
                      } ${
                        i < ammo
                          ? isKhopesh
                            ? 'bg-[#e879f9] border-[#f5d0fe] shadow-[0_0_4px_rgba(232,121,249,0.85)]'
                            : 'bg-[#38bdf8] border-[#7dd3fc] shadow-[0_0_3px_rgba(56,189,248,0.8)]'
                          : 'bg-[#1e293b] border-[#334155]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </header>

      {/* 2. LOWER SECTION ALERTS & PROMPTS (Unobtrusive, docked directly above bottom controls) */}
      <section
        aria-label="Tactical Notifications"
        className="w-full flex flex-col items-center justify-end gap-1.5 mt-auto mb-1.5 px-3 z-30"
      >
        {/* Non-Interactive Pop-up Notification (Persists until superseded or clicked; never overrides Jump [A]) */}
        {state.toastText ? (
          <button
            onClick={() => {
              state.toastText = null;
              state.toastTimer = 0;
              notifyOrionStateChange();
            }}
            className="pointer-events-auto flex items-center gap-2.5 px-3 py-1 bg-[#090d14]/95 hover:bg-[#111827] border border-[#38bdf8]/80 text-[#7dd3fc] rounded-md shadow-xl text-[10px] sm:text-[11px] font-bold tracking-wider backdrop-blur-xs transition-colors cursor-pointer active:scale-95"
            title="Click to dismiss notification"
          >
            <span>⚡ {state.toastText}</span>
            <span className="bg-[#1e293b] border border-[#38bdf8]/50 text-[#38bdf8] px-1.5 py-0.2 rounded text-[8px] font-mono font-bold tracking-normal">
              ✕
            </span>
          </button>
        ) : null}
        {state.promptText ? (
          /* Contextual Interaction Prompt (Docked cleanly in lower section) */
          <button
            onClick={() => {
              state.promptText = null;
              notifyOrionStateChange();
            }}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1 bg-[#0b1329]/95 hover:bg-[#111c38] border border-[#f59e0b]/80 text-[#fef08a] rounded-md shadow-lg text-[10px] sm:text-[11px] font-bold tracking-wider backdrop-blur-xs transition-colors cursor-pointer active:scale-95"
            title="Click to dismiss prompt"
          >
            {/^\[A\]/i.test(state.promptText) ? (
              <span className="bg-[#f59e0b] text-[#0f172a] px-1.5 py-0.2 rounded font-black text-[9px] shadow-sm">
                A
              </span>
            ) : null}
            <span>{state.promptText.replace(/^\[A\]\s*/i, '')}</span>
          </button>
        ) : null}
      </section>

      {/* 3. BOTTOM CONTROL BAR (High-contrast controller guide at standard resolution) */}
      <footer className="w-full bg-[#090d14]/90 backdrop-blur-xs border-t border-[#334155]/70 rounded px-2 py-1 flex items-center justify-between text-[8.5px] sm:text-[9.5px] text-[#cbd5e1] tracking-wider shadow-lg">
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
          <span className="flex items-center gap-0.8">
            <kbd className="bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40 px-1 py-0.2 rounded font-bold text-[8px]">
              X
            </kbd>
            <span className={isKhopesh ? 'text-[#f0abfc]' : 'text-[#cbd5e1]'}>{move0Name}</span>
          </span>
          <span className="flex items-center gap-0.8">
            <kbd className="bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40 px-1 py-0.2 rounded font-bold text-[8px]">
              L
            </kbd>
            <span className={cdL > 0 ? 'text-[#64748b]' : 'text-[#cbd5e1]'}>
              {actionL.shortLabel} {cdL > 0 ? `(${cdL.toFixed(1)}s)` : ''}
            </span>
          </span>
          <span className="flex items-center gap-0.8">
            <kbd className="bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40 px-1 py-0.2 rounded font-bold text-[8px]">
              R
            </kbd>
            <span className={cdR > 0 ? 'text-[#64748b]' : 'text-[#cbd5e1]'}>
              {actionR.shortLabel} {cdR > 0 ? `(${cdR.toFixed(1)}s)` : ''}
            </span>
          </span>
          <button
            onClick={() => cycleTargetLock(state)}
            className="pointer-events-auto flex items-center gap-0.8 hover:text-[#fef08a] cursor-pointer"
            title="Tap [Y] to Lock-On Target · Hold [Y] to Swap Weapon"
          >
            <kbd className="bg-[#1e293b] text-[#fbbf24] border border-[#fbbf24]/40 px-1 py-0.2 rounded font-bold text-[8px]">
              Y
            </kbd>
            <span className={lockedEnemy ? 'text-[#38bdf8] font-bold' : 'text-[#fde68a] font-bold'}>
              {lockedEnemy ? 'LOCKED' : 'LOCK'} · HOLD SWAP
            </span>
          </button>
          <span className="flex items-center gap-0.8">
            <kbd className="bg-[#1e293b] text-[#f97316] border border-[#f97316]/40 px-1 py-0.2 rounded font-bold text-[8px]">
              B
            </kbd>
            <span className={state.isContinuousBoosting ? 'text-[#38bdf8] font-bold' : ''}>
              {state.isContinuousBoosting ? 'BOOSTING' : 'HOLD BOOST'}
            </span>
          </span>
          <span className="flex items-center gap-0.8">
            <kbd className="bg-[#1e293b] text-[#4ade80] border border-[#4ade80]/40 px-1 py-0.2 rounded font-bold text-[8px]">
              A
            </kbd>
            <span>JUMP / EXAMINE</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[8.5px] text-[#94a3b8] font-bold">
          <span>[START] MENU</span>
          <span>·</span>
          <span>[SELECT] SATCHEL</span>
        </div>
      </footer>
    </aside>
  );
};
