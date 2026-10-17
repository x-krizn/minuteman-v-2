/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { performWeaponSwap } from '../combat';
import { getWeaponDefinition } from '../database/weapons';
import { getOrionStateRef, notifyOrionStateChange } from '../stateStore';
import {
  getRoomWorldInfo,
  TUTORIAL_STEP_DESCRIPTORS,
  TutorialStepId,
} from '../systems';

export const OrionHud: React.FC = () => {
  const [, setTick] = useState(0);

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
  if (!state || state.useStandardResolutionHud === false) return null;

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

  const move0Name = isKhopesh ? 'SICKLE COMBO' : 'AUTO-SALVO';
  const move1Name = isKhopesh ? 'EXEC LUNGE' : 'AP SLUG';
  const move2Name = isKhopesh ? 'SWEEP DEFLECT' : 'GRENADE';
  const cd1 = state.skillCooldowns[1] || 0;
  const cd2 = state.skillCooldowns[2] || 0;

  return (
    <aside
      aria-label="Pilot Mech Cockpit Telemetry"
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5 sm:p-2 z-20 select-none font-mono text-[#e2e8f0]"
    >
      {/* 1. TOP BAR HUD CLUSTER (Standard Resolution, High-Contrast Cockpit Readouts) */}
      <header className="w-full flex items-start justify-between gap-2 pt-6 sm:pt-1">
        {/* LEFT CLUSTER: Pilot Profile & The Three Defense Layers */}
        <section aria-label="Defense Gauges" className="flex flex-col gap-1 max-w-[200px] sm:max-w-[230px]">
          {/* Pilot Identity Header */}
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-wider text-[#94a3b8] font-bold drop-shadow">
            <span className="text-[#38bdf8] uppercase">VANE</span>
            <span className="text-[#475569]">·</span>
            <span className="text-[#cbd5e1]">{state.traitLine.toUpperCase()}</span>
            <span className="bg-[#1e293b]/90 text-[#38bdf8] border border-[#38bdf8]/40 px-1 py-0.2 rounded text-[8px] font-bold">
              LVL {state.level}
            </span>
          </div>

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
                  HEAT {isOverheating ? '🔥 OVERHEAT' : ''}
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

        {/* CENTER CLUSTER: Sector, World Location & Tutorial State Indicator */}
        <section aria-label="Sector Info" className="hidden xs:flex flex-col items-center">
          <div className="px-2.5 py-0.5 bg-[#090d14]/90 border border-[#38bdf8]/40 rounded-full text-[9px] text-[#7dd3fc] tracking-wider uppercase font-bold flex items-center gap-1 shadow-md backdrop-blur-xs">
            <span className="text-[#38bdf8]">⬢</span>
            <span>{worldInfo.roomTitle}</span>
          </div>
          <span className="text-[8px] text-[#94a3b8] tracking-widest mt-0.5 font-semibold uppercase">
            {worldInfo.areaName} · {worldInfo.worldName}
          </span>
          {tutorialStepDesc && (
            <div className="mt-0.5 px-2 py-0.2 bg-[#1e1b4b]/85 border border-[#818cf8]/40 rounded text-[7.5px] text-[#c7d2fe] font-bold tracking-wider uppercase">
              {tutorialStepDesc.title}
            </div>
          )}
        </section>

        {/* RIGHT CLUSTER: Munitions, Scrap & Hardpoint */}
        <section aria-label="Munitions & Salvage" className="flex flex-col items-end gap-1 max-w-[170px]">
          {/* Salvage Scrap Counter */}
          <div className="flex items-center gap-1.5 bg-[#090d14]/85 border border-[#ca8a04]/50 px-2 py-0.8 rounded shadow-md backdrop-blur-xs">
            <span className="text-[#eab308]">⚙️</span>
            <span className="text-[10.5px] font-black text-[#fef08a] tracking-wider">
              {state.salvageScrap}
            </span>
            <span className="text-[8px] text-[#ca8a04] font-bold uppercase tracking-widest">SCRAP</span>
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
                title="Swap Weapon [Y]"
              >
                {swapCooldown > 0 ? `CD ${swapCooldown.toFixed(1)}s` : `[Y] ${state.activeWeaponIndex + 1}/${totalWeapons}`}
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
        {/* Pop-up Message Notification (Closes immediately when [A] is pressed or clicked) */}
        {state.toastText && state.toastTimer > 0 ? (
          <button
            onClick={() => {
              state.toastText = null;
              state.toastTimer = 0;
              notifyOrionStateChange();
            }}
            className="pointer-events-auto flex items-center gap-2.5 px-3 py-1 bg-[#090d14]/95 hover:bg-[#111827] border border-[#38bdf8]/80 text-[#7dd3fc] rounded-md shadow-xl text-[10px] sm:text-[11px] font-bold tracking-wider backdrop-blur-xs transition-colors cursor-pointer active:scale-95"
            title="Press [A] or click to close"
          >
            <span>⚡ {state.toastText}</span>
            <span className="bg-[#1e293b] border border-[#38bdf8]/50 text-[#38bdf8] px-1.5 py-0.2 rounded text-[8px] font-mono font-bold tracking-normal">
              [A] CLOSE
            </span>
          </button>
        ) : state.promptText ? (
          /* Contextual Interaction Prompt (Docked cleanly in lower section) */
          <button
            onClick={() => {
              state.promptText = null;
              notifyOrionStateChange();
            }}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1 bg-[#0b1329]/95 hover:bg-[#111c38] border border-[#f59e0b]/80 text-[#fef08a] rounded-md shadow-lg text-[10px] sm:text-[11px] font-bold tracking-wider backdrop-blur-xs transition-colors cursor-pointer active:scale-95"
            title="Press [A] or click to interact/close"
          >
            <span className="bg-[#f59e0b] text-[#0f172a] px-1.5 py-0.2 rounded font-black text-[9px] shadow-sm">
              A
            </span>
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
            <span className={cd1 > 0 ? 'text-[#64748b]' : 'text-[#cbd5e1]'}>
              {move1Name} {cd1 > 0 ? `(${cd1.toFixed(1)}s)` : ''}
            </span>
          </span>
          <span className="flex items-center gap-0.8">
            <kbd className="bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40 px-1 py-0.2 rounded font-bold text-[8px]">
              R
            </kbd>
            <span className={cd2 > 0 ? 'text-[#64748b]' : 'text-[#cbd5e1]'}>
              {move2Name} {cd2 > 0 ? `(${cd2.toFixed(1)}s)` : ''}
            </span>
          </span>
          <button
            onClick={() => {
              performWeaponSwap(state, {
                say: (txt) => {
                  state.toastText = txt;
                  state.toastTimer = 2.5;
                },
              });
            }}
            className="pointer-events-auto flex items-center gap-0.8 hover:text-[#fef08a] cursor-pointer"
          >
            <kbd className="bg-[#1e293b] text-[#fbbf24] border border-[#fbbf24]/40 px-1 py-0.2 rounded font-bold text-[8px]">
              Y
            </kbd>
            <span className={swapCooldown > 0 ? 'text-[#64748b]' : 'text-[#fde68a] font-bold'}>
              SWAP {swapCooldown > 0 ? `(${swapCooldown.toFixed(1)}s)` : `[${state.activeWeaponIndex + 1}/${totalWeapons}]`}
            </span>
          </button>
          <span className="flex items-center gap-0.8">
            <kbd className="bg-[#1e293b] text-[#f97316] border border-[#f97316]/40 px-1 py-0.2 rounded font-bold text-[8px]">
              B
            </kbd>
            <span>DASH</span>
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
