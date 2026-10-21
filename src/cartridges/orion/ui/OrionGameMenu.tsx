/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import { TRAIT_LIST, TRAIT_REGISTRY } from '../database/characters';
import { getClassUtilityDefinition } from '../database/equipment';
import {
  createNewPilotGame,
  deletePilotFromRoster,
  getOrionStateRef,
  loadOrionGame,
  loadPilotFromRoster,
  loadPilotRoster,
  saveOrionGame,
  setTutorialStateActive,
} from '../systems';
import { OrionSavedPilotEntry, TraitLine } from '../types';

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

type MenuSubView = 'main' | 'new_pilot' | 'load_roster' | 'controls';

const SAMPLE_CALLSIGNS: Record<TraitLine, string> = {
  Warrior: 'Pilot Vane',
  Marauder: 'Pilot Kael',
  Guardian: 'Pilot Seraph',
  Rogue: 'Pilot Nyx',
  Wizard: 'Pilot Soren',
  Cleric: 'Pilot Lyra',
};

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
  const activeState = getOrionStateRef();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [subView, setSubView] = useState<MenuSubView>('main');
  const [selectedTrait, setSelectedTrait] = useState<TraitLine>(
    activeState?.traitLine || 'Warrior'
  );
  const [newPilotName, setNewPilotName] = useState<string>('Pilot Vane');
  const [roster, setRoster] = useState<OrionSavedPilotEntry[]>(() => loadPilotRoster());
  const [, setTick] = useState(0);

  const showToast = (msg: string, ms: number = 2000) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), ms);
  };

  const handleSave = () => {
    const state = getOrionStateRef();
    if (state && saveOrionGame(state)) {
      setRoster(loadPilotRoster());
      showToast(`PILOT "${state.pilotName.toUpperCase()}" SAVED TO ROSTER!`);
      soundSystem.playSelect();
    } else {
      showToast('SAVE FAILED');
    }
  };

  const handleOpenLoadRoster = () => {
    soundSystem.playSelect();
    setRoster(loadPilotRoster());
    setSubView('load_roster');
  };

  const handleLoadPilotEntry = (pilotId: string, pilotName: string) => {
    const state = getOrionStateRef();
    if (state && loadPilotFromRoster(state, pilotId)) {
      showToast(`PILOT "${pilotName.toUpperCase()}" SYSTEMS RESTORED!`, 900);
      soundSystem.playPowerup();
      setTimeout(() => {
        onResume();
      }, 650);
    } else {
      showToast('FAILED TO RESTORE PILOT');
    }
  };

  const handleQuickLoadLast = () => {
    const state = getOrionStateRef();
    if (state && loadOrionGame(state)) {
      showToast(`RESTORED ${state.pilotName.toUpperCase()}!`, 900);
      soundSystem.playPowerup();
      setTimeout(() => {
        onResume();
      }, 650);
    } else {
      showToast('NO SAVE DATA FOUND');
    }
  };

  const handleDeletePilotEntry = (pilotId: string, pilotName: string) => {
    soundSystem.playMenuBeep();
    const updated = deletePilotFromRoster(pilotId);
    setRoster(updated);
    showToast(`REMOVED "${pilotName.toUpperCase()}" FROM ROSTER`);
  };

  const handleCreateNewPilot = () => {
    const state = getOrionStateRef();
    if (!state) return;
    const finalName = newPilotName.trim() || SAMPLE_CALLSIGNS[selectedTrait];
    createNewPilotGame(state, selectedTrait, finalName);
    setRoster(loadPilotRoster());
    soundSystem.playPowerup();
    showToast(
      `DEPLOYING ${finalName.toUpperCase()} (${selectedTrait.toUpperCase()}) · LVL 1 M00 BOG`,
      900
    );
    setTimeout(() => {
      onResume();
    }, 650);
  };

  const handleSaveAndExit = () => {
    const state = getOrionStateRef();
    if (state) saveOrionGame(state);
    onExitCartridge();
  };

  const traitProfile = TRAIT_REGISTRY[selectedTrait] || TRAIT_REGISTRY.Warrior;
  const utilityDef = getClassUtilityDefinition(undefined, selectedTrait);

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
          {activeState && (
            <span className="text-[9px] text-[#38bdf8] bg-[#0f172a] border border-[#1e293b] px-1.5 py-0.5 rounded-xs">
              {activeState.pilotName} · {activeState.traitLine} Lv.{activeState.level}
            </span>
          )}
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
        <div className="mb-2 py-1 px-2 bg-[#1e293b] border border-[#facc15] text-center text-[10px] text-[#facc15] font-bold animate-pulse rounded-xs shadow-sm">
          {feedback}
        </div>
      )}

      {subView === 'new_pilot' ? (
        /* Subview 1: §2.4 NEW GAME — PILOT CREATION (Trait Line -> Pilot Name -> Level 1 Start) */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px] leading-snug">
          <div className="flex items-center justify-between pb-1 border-b border-[#334155]">
            <span className="font-bold text-[#facc15]">
              §2.4 NEW GAME — PILOT & FRAME BONDING (LEVEL 1 START)
            </span>
            <button
              onClick={() => {
                soundSystem.playMenuBeep();
                setSubView('main');
              }}
              className="text-[10px] underline text-[#94a3b8] hover:text-white"
            >
              ← Back
            </button>
          </div>

          {/* Step 1: Trait Line Selection */}
          <div>
            <div className="text-[9px] text-[#94a3b8] font-bold mb-1">
              1. SELECT TRAIT LINE & MECH CHASSIS
            </div>
            <div className="grid grid-cols-3 gap-1">
              {TRAIT_LIST.map((t) => {
                const isSelected = t.id === selectedTrait;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      soundSystem.playSelect();
                      setSelectedTrait(t.id);
                      if (
                        Object.values(SAMPLE_CALLSIGNS).includes(newPilotName) ||
                        !newPilotName.trim()
                      ) {
                        setNewPilotName(SAMPLE_CALLSIGNS[t.id]);
                      }
                    }}
                    className={`p-1.5 rounded-xs border text-left transition-colors ${
                      isSelected
                        ? 'bg-[#1e293b] border-[#facc15] text-white'
                        : 'bg-[#090d16] border-[#1e293b] text-[#94a3b8] hover:border-[#475569]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] text-[#ffd27d]">{t.name}</span>
                      <span className="text-[8px] px-1 bg-[#0f172a] text-[#38bdf8] rounded-xs">
                        {t.reactor}
                      </span>
                    </div>
                    <div className="text-[8px] text-[#cbd5e1] mt-0.5">
                      {t.frameModel || 'Mark-IV'} · {(t.weightClass || 'medium').toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Frame Telemetry Preview */}
          <div className="p-2 bg-[#0b111e] border border-[#334155] rounded-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#38bdf8] text-[10px]">
                CHASSIS: {traitProfile.frameModel} ({traitProfile.name.toUpperCase()})
              </span>
              <span className="text-[8.5px] px-1.5 py-0.5 bg-[#1e293b] text-[#facc15] rounded-xs font-bold">
                LOAD: {(traitProfile.weightClass || 'medium').toUpperCase()} · HP: 200
              </span>
            </div>
            <div className="text-[9px] text-[#cbd5e1]">{traitProfile.identity}</div>
            <div className="grid grid-cols-3 gap-1 pt-1 text-[8.5px]">
              <div className="p-1 bg-[#090d16] border border-[#1e293b] rounded-xs">
                <div className="text-[#94a3b8]">SHIELD (L1)</div>
                <div className="text-[#7dd3fc] font-bold">
                  {traitProfile.baseShield.capacity} ({traitProfile.baseShield.type.toUpperCase()})
                </div>
              </div>
              <div className="p-1 bg-[#090d16] border border-[#1e293b] rounded-xs">
                <div className="text-[#94a3b8]">ARMOR (L2)</div>
                <div className="text-[#fbbf24] font-bold">
                  {traitProfile.baseArmor.type} · {traitProfile.baseArmor.durability} DUR
                </div>
              </div>
              <div className="p-1 bg-[#090d16] border border-[#1e293b] rounded-xs">
                <div className="text-[#94a3b8]">LV.6 UTILITY</div>
                <div className="text-[#4ade80] font-bold truncate">{utilityDef.shortLabel}</div>
              </div>
            </div>
          </div>

          {/* Step 2: Pilot Name */}
          <div className="p-2 bg-[#0b111e] border border-[#334155] rounded-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] text-[#94a3b8] font-bold">
                2. ENTER PILOT CALLSIGN / NAME
              </label>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setNewPilotName(SAMPLE_CALLSIGNS[selectedTrait]);
                }}
                className="text-[8.5px] text-[#38bdf8] hover:underline"
              >
                Use Default ({SAMPLE_CALLSIGNS[selectedTrait]})
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                maxLength={22}
                value={newPilotName}
                onChange={(e) => setNewPilotName(e.target.value)}
                placeholder="Enter Pilot Name..."
                className="flex-1 bg-[#020617] border border-[#475569] focus:border-[#facc15] rounded-xs px-2 py-1 text-[11px] text-white font-mono outline-none"
              />
              <button
                type="button"
                onClick={handleCreateNewPilot}
                className="px-3 py-1 bg-[#facc15] hover:bg-[#fde047] text-[#05070a] font-bold text-[10px] rounded-xs shadow-xs"
              >
                🚀 DEPLOY LV.1 (M00 BOG)
              </button>
            </div>
          </div>
        </div>
      ) : subView === 'load_roster' ? (
        /* Subview 2: §2.4 LOAD GAME — PILOT CHARACTER ROSTER */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px] leading-snug">
          <div className="flex items-center justify-between pb-1 border-b border-[#334155]">
            <span className="font-bold text-[#facc15]">
              §2.4 LOAD GAME — SAVED PILOT CHARACTER ROSTER ({roster.length})
            </span>
            <button
              onClick={() => {
                soundSystem.playMenuBeep();
                setSubView('main');
              }}
              className="text-[10px] underline text-[#94a3b8] hover:text-white"
            >
              ← Back
            </button>
          </div>

          {roster.length === 0 ? (
            <div className="p-4 bg-[#0b111e] border border-[#1e293b] rounded-xs text-center space-y-2">
              <div className="text-[#94a3b8] text-[10px]">
                NO SAVED PILOTS IN ROSTER YET.
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setSubView('new_pilot')}
                  className="px-2.5 py-1 bg-[#facc15] text-[#05070a] font-bold rounded-xs text-[10px]"
                >
                  + CREATE NEW PILOT
                </button>
                <button
                  onClick={handleQuickLoadLast}
                  className="px-2.5 py-1 bg-[#1e293b] border border-[#475569] text-[#e2e8f0] font-bold rounded-xs text-[10px]"
                >
                  TRY LEGACY SLOT
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {roster.map((entry) => {
                const isCurrent = activeState?.pilotId === entry.pilotId;
                const zoneLabel =
                  entry.areaId === 'camelot_border_town'
                    ? 'Camelot Border Town'
                    : entry.areaId === 'm01_orc_encampment'
                      ? 'M01 Orc Encampment'
                      : 'M00 The Bog';
                return (
                  <div
                    key={entry.pilotId}
                    className={`p-2 rounded-xs border flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'bg-[#1e293b]/90 border-[#38bdf8]'
                        : 'bg-[#0b111e] border-[#334155]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[11px] text-[#ffd27d] truncate">
                          {entry.pilotName}
                        </span>
                        <span className="text-[8.5px] px-1 py-0.2 bg-[#090d16] text-[#38bdf8] border border-[#1e293b] rounded-xs font-bold">
                          LV.{entry.level} {entry.traitLine.toUpperCase()}
                        </span>
                        <span className="text-[8px] text-[#94a3b8]">
                          [{entry.frameModel} · {entry.reactor}]
                        </span>
                        {isCurrent && (
                          <span className="text-[8px] px-1 bg-[#22c55e]/20 text-[#4ade80] rounded-xs font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[8.5px] text-[#94a3b8] mt-0.5">
                        Zone: <span className="text-[#cbd5e1]">{zoneLabel}</span> ({entry.room}) ·{' '}
                        {entry.tutorialActive ? 'Tutorial Onboarding' : 'Standard Progression'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleLoadPilotEntry(entry.pilotId, entry.pilotName)}
                        className="px-2 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-[9.5px] rounded-xs"
                      >
                        LOAD
                      </button>
                      <button
                        onClick={() => handleDeletePilotEntry(entry.pilotId, entry.pilotName)}
                        className="px-1.5 py-1 bg-[#1e293b] hover:bg-[#7f1d1d] text-[#fca5a5] font-bold text-[9px] rounded-xs border border-[#334155]"
                        title="Delete Pilot Save"
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
      ) : subView === 'controls' ? (
        /* Subview 3: Controls & 2.5D Mech Mechanics */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px] leading-snug">
          <div className="flex items-center justify-between pb-1 border-b border-[#334155]">
            <span className="font-bold text-[#facc15]">2.5D MECH CONTROLS & COMBAT LAWS</span>
            <button
              onClick={() => setSubView('main')}
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
              <span className="text-[#facc15] font-bold">[L / R] ASSIGNABLE ACTIONS:</span> Bindable in
              `[SELECT]` Satchel to Weapon Skills, Hardware Modules, Reactor Abilities, Level 6 Class Utility (`Action 6`), or Belt Slots (`Actions 7–10`).
            </div>
            <div className="p-1.5 bg-[#1e293b] rounded-xs border border-[#334155]">
              <span className="text-[#facc15] font-bold">[SHIFT / SELECT]:</span> Open Pilot Satchel,
              13-Slot Equipment Grid, 3-Layer Build & Feats, and Action Binder.
            </div>
          </div>
        </div>
      ) : (
        /* Main Menu Grid */
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-0.5">
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <button
              onClick={() => {
                soundSystem.playSelect();
                setSubView('new_pilot');
              }}
              className="py-1.5 px-2 bg-[#1e293b] hover:bg-[#334155] border border-[#facc15]/60 rounded-xs text-[10.5px] font-bold text-left flex items-center justify-between"
            >
              <span className="text-[#ffd27d]">✨ NEW GAME</span>
              <span className="text-[8.5px] text-[#94a3b8]">NEW PILOT</span>
            </button>

            <button
              onClick={handleOpenLoadRoster}
              className="py-1.5 px-2 bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8]/60 rounded-xs text-[10.5px] font-bold text-left flex items-center justify-between"
            >
              <span className="text-[#7dd3fc]">📂 LOAD GAME</span>
              <span className="text-[8.5px] text-[#94a3b8]">ROSTER ({roster.length})</span>
            </button>

            <button
              onClick={handleSave}
              className="py-1.5 px-2 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs text-[10.5px] font-bold text-left flex items-center justify-between"
            >
              <span>💾 SAVE PILOT</span>
              <span className="text-[8.5px] text-[#4ade80]">SYNC ROSTER</span>
            </button>

            <button
              onClick={() => {
                soundSystem.playSelect();
                setSubView('controls');
              }}
              className="py-1.5 px-2 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs text-[10.5px] font-bold text-left flex items-center justify-between"
            >
              <span>📖 CONTROLS</span>
              <span className="text-[8.5px] text-[#facc15]">GUIDE →</span>
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
                    showToast(
                      state.tutorialActive
                        ? 'TUTORIAL STATE: ACTIVE (STANDARD PROGRESSION LOCKED)'
                        : 'TUTORIAL CLEARED: STANDARD PROGRESSION UNLOCKED',
                      1500
                    );
                    soundSystem.playSelect();
                    setTick((t) => t + 1);
                  }
                }}
                className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${
                  (getOrionStateRef()?.tutorialActive ?? true)
                    ? 'bg-[#4f46e5]/40 text-[#c7d2fe] border border-[#818cf8]/60'
                    : 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/40'
                }`}
              >
                {(getOrionStateRef()?.tutorialActive ?? true)
                  ? 'TUTORIAL LOCKOUT'
                  : 'STANDARD UNLOCKED'}
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
                    state.useStandardResolutionHud = !(
                      state.useStandardResolutionHud ?? true
                    );
                    showToast(
                      state.useStandardResolutionHud
                        ? 'HUD: HI-RES OVERLAY'
                        : 'HUD: RETRO PIXEL CANVAS',
                      1500
                    );
                    soundSystem.playSelect();
                    setTick((t) => t + 1);
                  }
                }}
                className="px-1.5 py-0.5 rounded-xs font-bold text-[9px] bg-[#0284c7]/30 text-[#38bdf8] border border-[#0284c7]/50"
              >
                {(getOrionStateRef()?.useStandardResolutionHud ?? true)
                  ? 'HI-RES OVERLAY'
                  : 'PIXEL CANVAS'}
              </button>
            </div>

            {onToggleFullscreen && (
              <div className="flex items-center justify-between text-[10px]">
                <span>DISPLAY MODE</span>
                <button
                  onClick={onToggleFullscreen}
                  className="px-1.5 py-0.5 rounded-xs font-bold text-[9px] bg-[#1e293b] text-[#e2e8f0] border border-[#475569]"
                >
                  {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
                </button>
              </div>
            )}
          </div>

          {/* Bottom Exit Bar */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#1e293b]">
            <button
              onClick={() => {
                const state = getOrionStateRef();
                if (state) {
                  saveOrionGame(state);
                  state.atTitleMenu = true;
                }
                soundSystem.playSelect();
                onResume();
              }}
              className="flex-1 py-1 px-2 bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8]/50 rounded-xs text-[10px] font-bold text-[#7dd3fc] text-center cursor-pointer"
            >
              MAIN TITLE / PILOT MENU
            </button>
            <button
              onClick={handleSaveAndExit}
              className="flex-1 py-1 px-2 bg-[#7f1d1d]/60 hover:bg-[#991b1b] border border-[#ef4444]/50 rounded-xs text-[10px] font-bold text-[#fecaca] text-center cursor-pointer"
            >
              SAVE & EXIT CARTRIDGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
