/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import { DEFAULT_CALLSIGNS, TRAIT_LIST, TRAIT_REGISTRY } from '../database/characters';
import { getClassUtilityDefinition } from '../database/equipment';
import {
  createNewPilotGame,
  deletePilotFromRoster,
  formatOrionLoreLabel,
  getOrionGraphicsSettings,
  getOrionStateRef,
  loadOrionGame,
  loadPilotFromRoster,
  loadPilotRoster,
  notifyOrionStateChange,
  saveOrionGame,
  setTutorialStateActive,
  subscribeOrionGraphicsSettings,
  toggleOrionDevMode,
  updateOrionGraphicsSettings,
} from '../systems';
import { OrionSavedPilotEntry, TraitLine } from '../types';
import { enterTrainingSandboxRoom } from './hud/HudTitleModal';
import { SatchelCodexTab } from './satchel/SatchelCodexTab';
import { SatchelWorldTab } from './satchel/SatchelWorldTab';
import { OrionSettingsPanel } from './settings/OrionSettingsPanel';

/**
 * Props for the `OrionGameMenu` pause overlay (`[START]` menu).
 * Supports both the React overlay HUD and pixel canvas HUD modes.
 */
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

type MenuSubView = 'main' | 'new_pilot' | 'load_roster' | 'world_map' | 'controls' | 'codex';

/**
 * Renders the `[START]` pause menu for Project Orion with a clean, spacious vertical command list
 * and dedicated full-width sub-views (`Pilot Roster [Save / Load / New]`, `Exploration Map`, `Field Codex`,
 * `Settings & Controls`, and `Training Sandbox`).
 */
export const OrionGameMenu: React.FC<OrionGameMenuProps> = ({
  soundEnabled,
  scanlinesEnabled,
  onToggleSound,
  onToggleScanlines,
  onResume,
  onExitCartridge,
  isFullscreen = false,
  onToggleFullscreen,
  connectedGamepads,
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

  const [devMode, setDevMode] = useState<boolean>(
    () => getOrionGraphicsSettings().devModeEnabled
  );

  const toastTimerRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubGfx = subscribeOrionGraphicsSettings((next) => {
      setDevMode(next.devModeEnabled);
    });
    return () => {
      unsubGfx();
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
  }, []);

  const showToast = (msg: string, ms: number = 2000) => {
    setFeedback(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      setFeedback(null);
    }, ms);
  };

  const scheduleDelayedResume = (delayMs: number = 650) => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      resumeTimerRef.current = null;
      onResume();
    }, delayMs);
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
      scheduleDelayedResume(650);
    } else {
      showToast('FAILED TO RESTORE PILOT');
    }
  };

  const handleQuickLoadLast = () => {
    const state = getOrionStateRef();
    if (state && loadOrionGame(state)) {
      showToast(`RESTORED ${state.pilotName.toUpperCase()}!`, 900);
      soundSystem.playPowerup();
      scheduleDelayedResume(650);
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
    const finalName = newPilotName.trim() || DEFAULT_CALLSIGNS[selectedTrait];
    const kit = TRAIT_REGISTRY[selectedTrait] || TRAIT_REGISTRY.Warrior;
    createNewPilotGame(state, selectedTrait, finalName);
    setRoster(loadPilotRoster());
    soundSystem.playPowerup();
    showToast(
      `DEPLOYING ${finalName.toUpperCase()} (${(kit.frameModel || 'MARK-IV').toUpperCase()}) · ${
        devMode ? 'LVL 1 M00 BOG' : 'THE BOG'
      }`,
      900
    );
    scheduleDelayedResume(650);
  };

  const handleSaveAndExit = () => {
    const state = getOrionStateRef();
    if (state) saveOrionGame(state);
    onExitCartridge();
  };

  const traitProfile = TRAIT_REGISTRY[selectedTrait] || TRAIT_REGISTRY.Warrior;
  const utilityDef = getClassUtilityDefinition(undefined, selectedTrait);

  return (
    <div
      data-universal-menu="true"
      className="absolute inset-0 z-20 bg-[#05070a]/95 backdrop-blur-xs flex flex-col p-2.5 sm:p-3 overflow-hidden text-[#e2e8f0] font-mono select-none"
    >
      {/* Single Compact Top Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#1e293b] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[12px] sm:text-[13px] text-[#ffd27d] tracking-wider">
            ORION COMMAND
          </span>
          {activeState && (
            <span className="text-[10px] text-[#94a3b8]">
              · <b className="text-[#38bdf8]">{activeState.pilotName}</b> ({TRAIT_REGISTRY[activeState.traitLine]?.frameModel || 'Mark-IV'} Lv.{activeState.level})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {subView !== 'main' && (
            <button
              type="button"
              data-menu-back="true"
              onClick={() => {
                soundSystem.playMenuBeep();
                setSubView('main');
              }}
              className="text-[10px] px-2.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#e2e8f0] rounded-xs font-bold border border-[#334155] cursor-pointer"
            >
              ← Menu
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundSystem.playSelect();
              onResume();
            }}
            className="text-[10px] px-2.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#facc15] rounded-xs font-bold border border-[#475569] cursor-pointer"
          >
            Resume [Start]
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-2 py-1.5 px-2.5 bg-[#1e293b] border border-[#facc15] text-center text-[11px] leading-snug text-[#facc15] font-bold animate-pulse rounded-xs shadow-sm whitespace-normal break-words shrink-0">
          {feedback}
        </div>
      )}

      {subView === 'new_pilot' ? (
        /* Subview 1: NEW PILOT CREATION */
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-[10px] leading-snug">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#facc15] text-[11px]">
              DEPLOY NEW PILOT &amp; CHASSIS (LEVEL 1 START)
            </span>
            <button
              type="button"
              onClick={() => {
                soundSystem.playMenuBeep();
                setSubView('load_roster');
              }}
              className="text-[10px] text-[#38bdf8] hover:underline cursor-pointer"
            >
              View Saved Roster ({roster.length}) →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {TRAIT_LIST.map((t) => {
              const isSelected = t.id === selectedTrait;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    setSelectedTrait(t.id);
                    if (
                      Object.values(DEFAULT_CALLSIGNS).includes(newPilotName) ||
                      !newPilotName.trim()
                    ) {
                      setNewPilotName(DEFAULT_CALLSIGNS[t.id]);
                    }
                  }}
                  className={`p-2 rounded-xs border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1e293b] border-[#facc15] text-white'
                      : 'bg-[#090d16] border-[#1e293b] text-[#94a3b8] hover:border-[#475569]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] text-[#ffd27d]">{t.name}</span>
                    <span className="text-[9px] text-[#38bdf8]">{t.reactor}</span>
                  </div>
                  <div className="text-[9px] text-[#cbd5e1] mt-0.5">
                    {t.frameModel || 'Mark-IV'} · {(t.weightClass || 'medium').toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Frame Telemetry Summary */}
          <div className="p-2.5 bg-[#0b111e] border border-[#334155] rounded-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[#38bdf8] text-[10px]">
                {traitProfile.frameModel} ({traitProfile.name.toUpperCase()})
              </span>
              <span className="text-[9px] text-[#94a3b8] font-mono">
                Shield: <b className="text-[#7dd3fc]">{traitProfile.baseShield.type.toUpperCase()}</b> · Armor:{' '}
                <b className="text-[#fbbf24]">{traitProfile.baseArmor.type}</b> · Lv.6 Utility:{' '}
                <b className="text-[#4ade80]">{utilityDef.shortLabel}</b>
              </span>
            </div>
            <div className="text-[10px] text-[#cbd5e1]">{traitProfile.identity}</div>
          </div>

          {/* Callsign & Deploy Action */}
          <div className="p-2.5 bg-[#0b111e] border border-[#334155] rounded-xs flex flex-wrap items-center gap-2">
            <input
              type="text"
              maxLength={22}
              value={newPilotName}
              onChange={(e) => setNewPilotName(e.target.value)}
              placeholder="Enter Pilot Callsign..."
              className="flex-1 min-w-[160px] bg-[#020617] border border-[#475569] focus:border-[#facc15] rounded-xs px-2.5 py-1 text-[11px] text-white font-mono outline-none"
            />
            <button
              type="button"
              onClick={() => {
                soundSystem.playMenuBeep();
                setNewPilotName(DEFAULT_CALLSIGNS[selectedTrait]);
              }}
              className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] text-[10px] rounded-xs border border-[#334155] cursor-pointer"
            >
              Default Name
            </button>
            <button
              type="button"
              onClick={handleCreateNewPilot}
              className="px-3 py-1 bg-[#facc15] hover:bg-[#fde047] text-[#05070a] font-bold text-[10px] rounded-xs cursor-pointer"
            >
              🚀 Deploy Lv.1 Pilot
            </button>
          </div>
        </div>
      ) : subView === 'load_roster' ? (
        /* Subview 2: PILOT ROSTER (SAVE / LOAD / NEW PILOT) */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px] leading-snug">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#334155]">
            <span className="font-bold text-[#facc15] text-[11px]">
              PILOT ROSTER ({roster.length} SAVED)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSave}
                className="px-2.5 py-1 bg-[#065f46] hover:bg-[#047857] text-[#a7f3d0] border border-[#10b981]/50 font-bold text-[10px] rounded-xs cursor-pointer"
              >
                💾 Save Active Pilot
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setSubView('new_pilot');
                }}
                className="px-2.5 py-1 bg-[#facc15] hover:bg-[#fde047] text-[#05070a] font-bold text-[10px] rounded-xs cursor-pointer"
              >
                + New Pilot
              </button>
            </div>
          </div>

          {roster.length === 0 ? (
            <div className="p-6 bg-[#0b111e] border border-[#1e293b] rounded-xs text-center space-y-2">
              <div className="text-[#94a3b8] text-[10px]">No saved pilots in roster yet.</div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubView('new_pilot')}
                  className="px-3 py-1 bg-[#facc15] text-[#05070a] font-bold rounded-xs text-[10px] cursor-pointer"
                >
                  + Create New Pilot
                </button>
                <button
                  type="button"
                  onClick={handleQuickLoadLast}
                  className="px-3 py-1 bg-[#1e293b] border border-[#475569] text-[#e2e8f0] font-bold rounded-xs text-[10px] cursor-pointer"
                >
                  Restore Last Autosave
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#1e293b] bg-[#090d14] border border-[#1e293b] rounded-xs">
              {roster.map((entry) => {
                const isCurrent = activeState?.pilotId === entry.pilotId;
                const rawZoneLabel =
                  entry.areaId === 'camelot_border_town'
                    ? 'Camelot Border Town'
                    : entry.areaId === 'm01_orc_encampment'
                      ? 'M01 Orc Encampment'
                      : 'M00 The Bog';
                const zoneLabel = formatOrionLoreLabel(rawZoneLabel, devMode);
                const kitProfile = TRAIT_REGISTRY[entry.traitLine];
                return (
                  <div
                    key={entry.pilotId}
                    className={`p-2.5 flex items-center justify-between gap-2 ${
                      isCurrent ? 'bg-[#1e293b]/60' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[11px] text-[#ffd27d] truncate">
                          {entry.pilotName}
                        </span>
                        <span className="text-[9px] text-[#38bdf8] font-bold">
                          Lv.{entry.level} {(kitProfile?.name || entry.frameModel).toUpperCase()}
                        </span>
                        <span className="text-[9px] text-[#94a3b8]">
                          · {entry.frameModel} · {zoneLabel}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] text-[#4ade80] font-bold">· ACTIVE</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadPilotEntry(entry.pilotId, entry.pilotName)}
                        className="px-2.5 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-[10px] rounded-xs cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePilotEntry(entry.pilotId, entry.pilotName)}
                        className="px-2 py-1 bg-[#1e293b] hover:bg-[#7f1d1d] text-[#fca5a5] font-bold text-[9px] rounded-xs border border-[#334155] cursor-pointer"
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
      ) : subView === 'world_map' && activeState ? (
        /* Subview 3: Exploration Mini-Map */
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SatchelWorldTab
            state={activeState}
            isCheatMode={
              devMode &&
              (activeState.room === '-4,0' || Boolean(activeState.bypassProgressionGates))
            }
            onResume={onResume}
            accessMode="menu"
          />
        </div>
      ) : subView === 'controls' ? (
        /* Subview 4: Unified Settings (Controls, Graphics, Audio & HUD) */
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <OrionSettingsPanel
            soundEnabled={soundEnabled}
            scanlinesEnabled={scanlinesEnabled}
            isFullscreen={isFullscreen}
            connectedGamepads={connectedGamepads}
            onToggleSound={onToggleSound}
            onToggleFullscreen={onToggleFullscreen}
            onNotifyToast={(msg) => showToast(msg, 1800)}
          />
        </div>
      ) : subView === 'codex' && activeState ? (
        /* Subview 5: Discovery-Gated In-Game Pilot Codex */
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SatchelCodexTab state={activeState} />
        </div>
      ) : (
        /* Main Pause View: Clean Centered Command Stack + Single Quick-Toggle Bar */
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-md w-full mx-auto space-y-1.5 my-auto py-1">
            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                onResume();
              }}
              className="w-full py-2 px-3 bg-[#1e293b] hover:bg-[#334155] border border-[#facc15]/70 rounded-xs text-[11px] font-bold flex items-center justify-between cursor-pointer"
            >
              <span className="text-[#fde047]">▶ RESUME EXPEDITION</span>
              <span className="text-[9px] text-[#94a3b8]">RETURN TO FIELD</span>
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleSave}
                className="py-2 px-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] rounded-xs text-[11px] font-bold flex items-center justify-between cursor-pointer"
              >
                <span className="text-[#4ade80]">💾 SAVE PILOT</span>
                <span className="text-[9px] text-[#94a3b8]">QUICK SYNC</span>
              </button>

              <button
                type="button"
                onClick={handleOpenLoadRoster}
                className="py-2 px-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/50 rounded-xs text-[11px] font-bold flex items-center justify-between cursor-pointer"
              >
                <span className="text-[#7dd3fc]">📂 PILOT ROSTER</span>
                <span className="text-[9px] text-[#94a3b8]">LOAD / NEW ({roster.length}) →</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setSubView('world_map');
                }}
                className="py-2 px-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] rounded-xs text-[11px] font-bold flex items-center justify-between cursor-pointer"
              >
                <span className="text-[#e9d5ff]">🗺 LOCAL MAP</span>
                <span className="text-[9px] text-[#94a3b8]">CARTOGRAPHY →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setSubView('codex');
                }}
                className="py-2 px-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] rounded-xs text-[11px] font-bold flex items-center justify-between cursor-pointer"
              >
                <span className="text-[#50fa7b]">📖 FIELD CODEX</span>
                <span className="text-[9px] text-[#94a3b8]">ARCHIVES →</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setSubView('controls');
                }}
                className="py-2 px-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] rounded-xs text-[11px] font-bold flex items-center justify-between cursor-pointer"
              >
                <span className="text-[#fde047]">⚙ SETTINGS</span>
                <span className="text-[9px] text-[#94a3b8]">CONTROLS · GFX →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const state = getOrionStateRef();
                  if (state) {
                    enterTrainingSandboxRoom(state);
                    onResume();
                  }
                }}
                className="py-2 px-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#3b82f6]/60 rounded-xs text-[11px] font-bold flex items-center justify-between cursor-pointer"
              >
                <span className="text-[#93c5fd]">
                  {activeState?.room === '-4,0' ? '↩ EXIT SANDBOX' : '⚔ TRAINING ROOM'}
                </span>
                <span className="text-[9px] text-[#60a5fa]">
                  {activeState?.room === '-4,0' ? 'FIELD' : 'POD & WAYGATE'}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Bar: Inline Quick Toggles + Exit Controls */}
          <div className="pt-2 border-t border-[#1e293b] space-y-1.5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 py-1 bg-[#090d14] border border-[#1e293b] rounded-xs text-[9px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={onToggleSound}
                  className={`px-2 py-0.5 rounded-xs font-bold border cursor-pointer ${
                    soundEnabled
                      ? 'bg-[#22c55e]/20 text-[#4ade80] border-[#22c55e]/40'
                      : 'bg-[#ef4444]/20 text-[#f87171] border-[#ef4444]/40'
                  }`}
                >
                  Audio: {soundEnabled ? 'ON' : 'MUTED'}
                </button>

                <button
                  type="button"
                  onClick={onToggleScanlines}
                  className={`px-2 py-0.5 rounded-xs font-bold border cursor-pointer ${
                    scanlinesEnabled
                      ? 'bg-[#22c55e]/20 text-[#4ade80] border-[#22c55e]/40'
                      : 'bg-[#1e293b] text-[#94a3b8] border-[#334155]'
                  }`}
                >
                  CRT: {scanlinesEnabled ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const state = getOrionStateRef();
                    if (state) {
                      const nextHires = !(state.useStandardResolutionHud ?? true);
                      state.useStandardResolutionHud = nextHires;
                      updateOrionGraphicsSettings({
                        hudResolution: nextHires ? 'hires' : 'pixel',
                      });
                      notifyOrionStateChange();
                      showToast(
                        nextHires
                          ? 'HUD: TACTICAL RETRO OVERLAY'
                          : 'HUD: COMPACT RETRO OVERLAY',
                        1500
                      );
                      soundSystem.playSelect();
                      setTick((t) => t + 1);
                    }
                  }}
                  className="px-2 py-0.5 rounded-xs font-bold bg-[#0284c7]/25 text-[#38bdf8] border border-[#0284c7]/50 cursor-pointer"
                >
                  HUD:{' '}
                  {(getOrionStateRef()?.useStandardResolutionHud ?? true) ? 'TACTICAL' : 'COMPACT'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextDev = toggleOrionDevMode();
                    notifyOrionStateChange();
                    showToast(
                      nextDev
                        ? 'DEVELOPER MODE: ON (ENGINE METADATA VISIBLE)'
                        : 'DEVELOPER MODE: OFF (CLEAN UI)',
                      1500
                    );
                    soundSystem.playSelect();
                    setTick((t) => t + 1);
                  }}
                  className={`px-2 py-0.5 rounded-xs font-bold border cursor-pointer ${
                    devMode
                      ? 'bg-[#f59e0b]/25 text-[#fde047] border-[#f59e0b]/70'
                      : 'bg-[#1e293b] text-[#94a3b8] border-[#334155]'
                  }`}
                >
                  Dev: {devMode ? 'ON' : 'OFF'}
                </button>

                {devMode &&
                  (activeState?.room === '-4,0' ||
                    Boolean(activeState?.bypassProgressionGates)) && (
                    <button
                      type="button"
                      onClick={() => {
                        const state = getOrionStateRef();
                        if (state) {
                          setTutorialStateActive(state, !state.tutorialActive);
                          showToast(
                            state.tutorialActive
                              ? 'TUTORIAL STATE: ACTIVE'
                              : 'TUTORIAL CLEARED: STANDARD PROGRESSION',
                            1500
                          );
                          soundSystem.playSelect();
                          setTick((t) => t + 1);
                        }
                      }}
                      className="px-2 py-0.5 rounded-xs font-bold bg-[#4f46e5]/30 text-[#c7d2fe] border border-[#818cf8]/50 cursor-pointer"
                    >
                      {(getOrionStateRef()?.tutorialActive ?? true)
                        ? 'Tutorial Lockout'
                        : 'Standard Unlocked'}
                    </button>
                  )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const state = getOrionStateRef();
                    if (state) {
                      saveOrionGame(state);
                      state.atTitleMenu = true;
                    }
                    soundSystem.playSelect();
                    onResume();
                  }}
                  className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8]/40 rounded-xs font-bold text-[#7dd3fc] cursor-pointer"
                >
                  Title Screen
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  className="px-2 py-0.5 bg-[#7f1d1d]/60 hover:bg-[#991b1b] border border-[#ef4444]/50 rounded-xs font-bold text-[#fecaca] cursor-pointer"
                >
                  Save &amp; Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
