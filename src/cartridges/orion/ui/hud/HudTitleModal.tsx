/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { DEFAULT_CALLSIGNS, TRAIT_LIST, TRAIT_REGISTRY } from '../../database/characters';
import { getClassUtilityDefinition } from '../../database/equipment';
import { GEMSTONE_REGISTRY, TRAIT_FUNDING_GEMS } from '../../database/progression';
import {
  applyTraitLineProfile,
  createNewPilotGame,
  deletePilotFromRoster,
  loadPilotFromRoster,
  loadPilotRoster,
  notifyOrionStateChange,
} from '../../systems';
import { OrionState } from '../../types';

interface HudTitleModalProps {
  state: OrionState;
  titleTab: 'new' | 'load';
  setTitleTab: (tab: 'new' | 'load') => void;
  setShowPilotModal: (show: boolean) => void;
  forceRerender: () => void;
}

export const HudTitleModal: React.FC<HudTitleModalProps> = ({
  state,
  titleTab,
  setTitleTab,
  setShowPilotModal,
  forceRerender,
}) => {
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
            D-PAD / CLICK: SELECT STARTING LOADOUT KIT · DEPLOY NEW PILOT OR CONTINUE
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
            ▶ CONTINUE: {roster[0].pilotName.toUpperCase()} ({roster[0].frameModel} LV.{roster[0].level})
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {titleTab === 'new' ? (
        <div className="flex-1 flex flex-col justify-between space-y-2 text-[10px]">
          {/* Step 1: Starting Loadout Kit Selection */}
          <div>
            <div className="text-[9px] font-bold text-[#94a3b8] mb-1">
              STEP 1 — SELECT STARTING LOADOUT KIT & MECH FRAME (CLASSLESS — ALL GEAR & FEATS OPEN)
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
                      ◆ {tGem.name} + ◆ {rGem.name}
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
                STEP 2 — ENTER PILOT CALLSIGN & DEPLOY
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
                  forceRerender();
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
                🚀 DEPLOY LV.1 (THE BOG)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* LOAD GAME — SAVED PILOT CHARACTER ROSTER (§2.4) */
        <div className="flex-1 flex flex-col justify-between space-y-2 text-[10px]">
          <div className="space-y-1.5">
            <div className="text-[9px] font-bold text-[#94a3b8]">
              SAVED PILOT CHARACTER ROSTER
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
                        ? 'Orc Encampment'
                        : 'The Bog';
                  const kitProfile = TRAIT_REGISTRY[entry.traitLine];
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
                            LV.{entry.level} {(kitProfile?.name || entry.frameModel).toUpperCase()}
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
                            forceRerender();
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
};
