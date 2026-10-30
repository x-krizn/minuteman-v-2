/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import {
  executeContextMenuOption,
  getOrionRoomsRef,
  getOrionStateRef,
  spawnParticles,
} from '../systems';
import { HudDefenseBars } from './hud/HudDefenseBars';
import {
  getWorldRelativeClasses,
  HudSkillDeck,
  OUTLINED_TEXT,
  resolveToastPlacement,
} from './hud/HudSkillDeck';
import { HudTitleModal } from './hud/HudTitleModal';

export const OrionHud: React.FC = () => {
  const [, setTick] = useState(0);
  const [showPilotModal, setShowPilotModal] = useState(false);
  const [titleTab, setTitleTab] = useState<'new' | 'load'>('new');

  useEffect(() => {
    let animId: number;
    let lastTime = 0;
    const loop = (t: number) => {
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
    return (
      <HudTitleModal
        state={state}
        titleTab={titleTab}
        setTitleTab={setTitleTab}
        setShowPilotModal={setShowPilotModal}
        forceRerender={() => setTick((t) => t + 1)}
      />
    );
  }

  if (state.useStandardResolutionHud === false) return null;

  const toastPlacement =
    state.toastText && state.toastTimer > 0
      ? resolveToastPlacement(state, state.toastText)
      : null;

  const promptPositionClass = state.promptText
    ? getWorldRelativeClasses(state, state.x, state.y, state.z)
    : '';

  const contextMenu = state.contextMenu;

  return (
    <aside
      aria-label="Pilot Mech Cockpit Telemetry"
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5 sm:p-2 z-20 select-none font-mono text-[#e2e8f0] bg-transparent"
    >
      {/* 1. TOP BAR HUD CLUSTER (Transparent, Outlined Readouts) */}
      <HudDefenseBars
        state={state}
        onOpenPilotModal={() => setShowPilotModal(true)}
      />

      {/* 2. INTERACTABLE CONTEXT MENU OVERLAY */}
      {contextMenu && contextMenu.options.length > 0 && (
        <div
          role="dialog"
          aria-label={contextMenu.title}
          className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 min-w-[180px] sm:min-w-[215px] max-w-[88%] bg-[#090d16]/95 border border-[#38bdf8]/80 rounded-xs p-2 shadow-lg flex flex-col gap-1"
        >
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#1e293b]">
            <span className="text-[8.5px] sm:text-[9.5px] font-black tracking-wider uppercase text-[#38bdf8] truncate">
              {contextMenu.title}
            </span>
            <button
              type="button"
              onClick={() => {
                state.contextMenu = null;
                soundSystem.playMenuBeep();
                setTick((t) => t + 1);
              }}
              className="text-[7.5px] px-1 py-0.2 border border-[#475569] text-[#94a3b8] hover:text-white rounded-xs cursor-pointer"
            >
              [B] ESC
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {contextMenu.options.map((opt, idx) => {
              const isSelected = idx === contextMenu.selectedIndex;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onMouseEnter={() => {
                    contextMenu.selectedIndex = idx;
                    setTick((t) => t + 1);
                  }}
                  onClick={() => {
                    const roomsRef = getOrionRoomsRef() || {};
                    executeContextMenuOption(
                      roomsRef,
                      state,
                      {
                        state,
                        sound: soundSystem,
                        say: (msg: string) => {
                          state.toastText = msg;
                          state.toastTimer = 2.6;
                        },
                        spawnParticles: (x, y, z, count, color, label) =>
                          spawnParticles(state, x, y, z, count, color, label),
                      },
                      idx
                    );
                    setTick((t) => t + 1);
                  }}
                  className={`w-full text-left px-1.5 py-1 rounded-xs text-[8px] sm:text-[9px] font-bold tracking-wider uppercase flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#0284c7]/35 border border-[#38bdf8] text-[#fef08a]'
                      : 'bg-[#0f172a]/70 border border-transparent text-[#cbd5e1] hover:border-[#475569]'
                  }`}
                >
                  <span>
                    {isSelected ? '▸ ' : '  '}
                    {opt.label}
                  </span>
                  {isSelected && (
                    <span className="text-[7px] text-[#7dd3fc] font-extrabold">[A]</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-0.5 text-[6.5px] text-[#64748b] font-bold tracking-wider uppercase flex justify-between">
            <span>[↑/↓] SELECT</span>
            <span>[A] CONFIRM · [B] CANCEL</span>
          </div>
        </div>
      )}

      {/* 3. CONTEXTUAL OUTLINED POP-UP MESSAGES (Auto-expiring, no background container, relative to info) */}
      {!contextMenu && state.promptText && (
        <div
          aria-live="polite"
          className={`pointer-events-none absolute z-30 px-1.5 py-0.5 bg-transparent border border-[#facc15]/85 text-[#fef08a] rounded-xs text-[8.5px] sm:text-[9.5px] font-extrabold tracking-wider uppercase whitespace-nowrap ${OUTLINED_TEXT} ${promptPositionClass}`}
        >
          {state.promptText}
        </div>
      )}

      {state.toastText && state.toastTimer > 0 && toastPlacement && (
        <div
          aria-live="polite"
          className={`pointer-events-none absolute z-30 px-2 py-0.5 bg-transparent border rounded-xs text-[8.5px] sm:text-[9.5px] font-extrabold tracking-wider uppercase max-w-[82%] truncate ${OUTLINED_TEXT} ${toastPlacement.positionClass} ${toastPlacement.colorClass} ${
            state.toastTimer < 0.4 ? 'opacity-50' : 'opacity-100'
          } transition-opacity duration-150`}
        >
          {state.toastText}
        </div>
      )}

      {/* 4. BOTTOM 5-SKILL ICON BAR */}
      <HudSkillDeck state={state} />
    </aside>
  );
};

