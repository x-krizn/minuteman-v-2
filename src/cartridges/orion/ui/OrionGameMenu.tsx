/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import {
  getOrionStateRef,
  loadOrionGame,
  saveOrionGame,
  setTutorialStateActive,
} from '../systems';

export interface OrionGameMenuProps {
  soundEnabled: boolean;
  scanlinesEnabled: boolean;
  onToggleSound: () => void;
  onToggleScanlines: () => void;
  onResume: () => void;
  onExitCartridge: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  connectedGamepads?: string[];
}

export const OrionGameMenu: React.FC<OrionGameMenuProps> = ({
  soundEnabled,
  scanlinesEnabled,
  onToggleSound,
  onToggleScanlines,
  onResume,
  onExitCartridge,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [, setTick] = useState(0);

  const handleSave = () => {
    const state = getOrionStateRef();
    if (state && saveOrionGame(state)) {
      setFeedback('DROP-POD COCKPIT: GAME SAVED!');
      soundSystem.playSelect();
    } else {
      setFeedback('SAVE FAILED');
    }
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleLoad = () => {
    const state = getOrionStateRef();
    if (state && loadOrionGame(state)) {
      setFeedback('PILOT SYSTEMS RESTORED!');
      soundSystem.playSelect();
      setTimeout(() => {
        setFeedback(null);
        onResume();
      }, 700);
    } else {
      setFeedback('NO SAVE DATA FOUND');
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleSaveAndExit = () => {
    const state = getOrionStateRef();
    if (state) saveOrionGame(state);
    onExitCartridge();
  };

  return (
    <div className="absolute inset-0 z-20 bg-[#05070a]/95 backdrop-blur-xs flex flex-col p-2.5 sm:p-3 overflow-hidden text-[#e2e8f0] font-mono select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#1e293b]">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#ffd27d] tracking-wider">
          <span>PROJECT ORION — BELLDOR EXPEDITION</span>
          <span className="text-[10px] text-[#94a3b8] bg-[#1e293b] px-1 py-0.5 rounded-xs">
            START
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-400 font-semibold">PAUSED</span>
          <button
            onClick={() => {
              soundSystem.playSelect();
              onResume();
            }}
            className="text-[10px] px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#facc15] rounded-xs font-bold border border-[#475569]"
          >
            ✕ RESUME
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-2 py-1 px-2 bg-[#1e293b] border border-[#facc15] text-center text-[11px] text-[#facc15] font-bold animate-pulse rounded-xs shadow-sm">
          {feedback}
        </div>
      )}

      {showControls ? (
        /* Subview: Controls & 2.5D Mech Mechanics */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px] leading-snug">
          <div className="flex items-center justify-between pb-1 border-b border-[#334155]">
            <span className="font-bold text-[#facc15]">2.5D MECH CONTROLS & COMBAT LAWS</span>
            <button
              onClick={() => setShowControls(false)}
              className="text-[10px] underline text-[#94a3b8] hover:text-white"
            >
              ← Back
            </button>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="p-1.5 bg-[#1e293b] rounded-xs border border-[#334155]">
              <span className="text-[#facc15] font-bold">D-PAD / STICK:</span> 8-Way
              directional navigation on 2.5D ground plane (strafes while target locked).
            </div>
            <div className="p-1.5 bg-[#1e293b] rounded-xs border border-[#334155]">
              <span className="text-[#facc15] font-bold">[A] JUMP / EXAMINE:</span> Elevation leap
              over abyssal sinkholes (`_`), sync Spawn Anchors (`D`), loot Caches (`C`), or close pop-ups.
            </div>
            <div className="p-1.5 bg-[#1e293b] rounded-xs border border-[#334155]">
              <span className="text-[#facc15] font-bold">[B] TAP DODGE / HOLD CONTINUOUS BOOST:</span> Tap
              for a quick dodge burst; hold `[B]` for continuous thruster boost until release or Reactor Overheat (`100` Heat).
            </div>
            <div className="p-1.5 bg-[#1e293b] rounded-xs border border-[#334155]">
              <span className="text-[#facc15] font-bold">[Y] TAP LOCK-ON / HOLD WEAPON SWAP:</span> Tap
              `[Y]` to lock onto and cycle hostile targets; hold `[Y]` to swap between equipped weapon hardpoints.
            </div>
            <div className="p-1.5 bg-[#1e293b] rounded-xs border border-[#334155]">
              <span className="text-[#facc15] font-bold">[X] BASIC ATTACK (ALWAYS):</span> Fires active
              weapon's Basic Attack chain (Gladius 9-round salvo or Khopesh 3-hit combo).
            </div>
            <div className="p-1.5 bg-[#1e293b] rounded-xs border border-[#334155]">
              <span className="text-[#facc15] font-bold">[L / R] ASSIGNABLE ACTIONS:</span> Defaults to
              Weapon Skills 1 & 2; reassignable in `[SELECT]` Satchel to Weapon Skills, Hardware Modules, or Reactor Abilities.
            </div>
            <div className="p-1.5 bg-[#1e293b] rounded-xs border border-[#334155]">
              <span className="text-[#facc15] font-bold">[SHIFT / SELECT]:</span> Open Pilot Satchel,
              Action Loadout Binder, Trait Line Selector, & Multi-Domain State Gate Controller.
            </div>
          </div>
        </div>
      ) : (
        /* Main Menu Grid */
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-0.5">
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <button
              onClick={handleSave}
              className="py-1.5 px-2 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs text-[11px] font-bold text-left flex items-center justify-between"
            >
              <span>💾 SAVE GAME</span>
              <span className="text-[9px] text-[#94a3b8]">SLOT 1</span>
            </button>

            <button
              onClick={handleLoad}
              className="py-1.5 px-2 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs text-[11px] font-bold text-left flex items-center justify-between"
            >
              <span>📂 LOAD GAME</span>
              <span className="text-[9px] text-[#94a3b8]">RESTORE</span>
            </button>

            <button
              onClick={() => {
                soundSystem.playSelect();
                setShowControls(true);
              }}
              className="py-1.5 px-2 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs text-[11px] font-bold text-left flex items-center justify-between col-span-2"
            >
              <span>📖 2.5D MECH CONTROLS GUIDE</span>
              <span className="text-[9px] text-[#facc15]">VIEW →</span>
            </button>
          </div>

          {/* Quick Options Strip */}
          <div className="space-y-1 mb-2 bg-[#020617]/40 p-1.5 rounded-xs border border-[#1e293b]">
            <div className="flex items-center justify-between text-[10px]">
              <span>TUTORIAL STATE MODE</span>
              <button
                onClick={() => {
                  const state = getOrionStateRef();
                  if (state) {
                    setTutorialStateActive(state, !state.tutorialActive);
                    setFeedback(
                      state.tutorialActive
                        ? 'TUTORIAL STATE: ACTIVE'
                        : 'TUTORIAL STATE: OFF (STANDARD WORLD)'
                    );
                    soundSystem.playSelect();
                    setTick((t) => t + 1);
                    setTimeout(() => setFeedback(null), 1500);
                  }
                }}
                className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${
                  (getOrionStateRef()?.tutorialActive ?? true)
                    ? 'bg-[#4f46e5]/40 text-[#c7d2fe] border border-[#818cf8]/60'
                    : 'bg-[#334155] text-[#94a3b8] border border-[#475569]'
                }`}
              >
                {(getOrionStateRef()?.tutorialActive ?? true) ? 'ACTIVE' : 'STANDARD'}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span>CHIPTUNE AUDIO</span>
              <button
                onClick={onToggleSound}
                className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${
                  soundEnabled
                    ? 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/40'
                    : 'bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/40'
                }`}
              >
                {soundEnabled ? 'ON' : 'MUTED'}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span>RETRO SCANLINES</span>
              <button
                onClick={onToggleScanlines}
                className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${
                  scanlinesEnabled
                    ? 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/40'
                    : 'bg-[#334155] text-[#94a3b8] border border-[#475569]'
                }`}
              >
                {scanlinesEnabled ? 'CRT ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span>HUD RESOLUTION</span>
              <button
                onClick={() => {
                  const state = getOrionStateRef();
                  if (state) {
                    state.useStandardResolutionHud = !(state.useStandardResolutionHud ?? true);
                    setFeedback(state.useStandardResolutionHud ? 'HUD: HI-RES OVERLAY' : 'HUD: RETRO PIXEL CANVAS');
                    soundSystem.playSelect();
                    setTick((t) => t + 1);
                    setTimeout(() => setFeedback(null), 1500);
                  }
                }}
                className="px-1.5 py-0.5 rounded-xs font-bold text-[9px] bg-[#0284c7]/30 text-[#38bdf8] border border-[#0284c7]/50"
              >
                {(getOrionStateRef()?.useStandardResolutionHud ?? true) ? 'HI-RES' : 'RETRO'}
              </button>
            </div>

            {onToggleFullscreen && (
              <div className="flex items-center justify-between text-[10px]">
                <span>FULLSCREEN</span>
                <button
                  onClick={onToggleFullscreen}
                  className="px-1.5 py-0.5 rounded-xs font-bold text-[9px] bg-[#1e293b] text-[#facc15] border border-[#475569]"
                >
                  {isFullscreen ? 'EXIT' : 'EXPAND'}
                </button>
              </div>
            )}
          </div>

          {/* Exit Options */}
          <div className="pt-1 border-t border-[#334155] flex gap-1.5">
            <button
              onClick={handleSaveAndExit}
              className="flex-1 py-1 px-1.5 bg-[#451a03] hover:bg-[#78350f] text-[#fde047] border border-[#92400e] rounded-xs text-[10px] font-bold text-center"
            >
              💾 SAVE & EXIT
            </button>
            <button
              onClick={onExitCartridge}
              className="flex-1 py-1 px-1.5 bg-[#334155] hover:bg-[#475569] text-[#cbd5e1] border border-[#64748b] rounded-xs text-[10px] font-bold text-center"
            >
              🚪 QUIT TO CONSOLE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
