/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { DEFAULT_CALLSIGNS, TRAIT_LIST, TRAIT_REGISTRY } from '../../database/characters';
import { getClassUtilityDefinition } from '../../database/equipment';
import {
  GEMSTONE_REGISTRY,
  TRAIT_FUNDING_GEMS,
  unlockLevel2SecondaryWeapon,
} from '../../database/progression';
import {
  applyTraitLineProfile,
  createNewPilotGame,
  deletePilotFromRoster,
  getOrionRoomsRef,
  hibernateAllActiveExpanseEnemies,
  isChunkedExpanseRoom,
  loadPilotFromRoster,
  loadPilotRoster,
  notifyOrionStateChange,
  spawnRoomEnemies,
  syncRoomHierarchyState,
  syncStateGates,
} from '../../systems';
import { OrionState } from '../../types';

/**
 * Subview identifier for the Project Orion Title Menu (`'root'` main stack, `'new'` pilot bonding,
 * `'load'` saved pilot roster, or `'options'` display and vision radius settings).
 */
export type TitleMenuView = 'root' | 'new' | 'load' | 'options';

interface HudTitleModalProps {
  state: OrionState;
  titleTab: 'new' | 'load';
  setTitleTab: (tab: 'new' | 'load') => void;
  setShowPilotModal: (show: boolean) => void;
  forceRerender: () => void;
}

const MAIN_MENU_ITEMS: Array<{
  id: 'new' | 'load' | 'training' | 'options';
  label: string;
}> = [
  { id: 'new', label: 'New' },
  { id: 'load', label: 'Load' },
  { id: 'training', label: 'Training' },
  { id: 'options', label: 'Options' },
];

/**
 * Transitions the player directly into the `"-4,0"` Training Sandbox room (`10 x 9` tiles)
 * with progression gates bypassed (`bypassProgressionGates = true`) and secondary weapons unlocked.
 * Mutates `state: OrionState` in place.
 */
export function enterTrainingSandboxRoom(state: OrionState): void {
  const rooms = getOrionRoomsRef() || {};
  if (isChunkedExpanseRoom(state.room)) {
    hibernateAllActiveExpanseEnemies(state);
  }
  state.room = '-4,0';
  state.rx = -4;
  state.ry = 0;
  state.x = 96;
  state.y = 120;
  state.z = 0;
  state.vz = 0;
  state.vx = 0;
  state.vy = 0;
  state.projectiles = [];
  state.pickups = [];
  state.enemies = [];
  state.bypassProgressionGates = true;
  state.hasBoosterKit = true;
  unlockLevel2SecondaryWeapon(state);
  state.atTitleMenu = false;
  state.titleMenuSubView = 'root';
  state.spawnGraceTimer = 3.0;
  syncRoomHierarchyState(state);
  syncStateGates(state);
  spawnRoomEnemies(rooms, state);
  state.toastText = 'TRAINING SANDBOX [-4,0] · ALL TERMINALS & SATCHEL UNLOCKED';
  state.toastTimer = 3.0;
  soundSystem.playPowerup();
  notifyOrionStateChange();
}

/**
 * Renders the Project Orion Title & Pilot Menu modal (`New`, `Load`, `Training`, `Options`).
 * Supports both the React overlay HUD and pixel canvas HUD modes when `state.atTitleMenu` is active.
 * Mutates `state: OrionState` (`titleMenuCursor`, `titleMenuSubView`, `pilotName`, `baseLight`, etc.).
 */
export const HudTitleModal: React.FC<HudTitleModalProps> = ({
  state,
  titleTab: _titleTab,
  setTitleTab,
  setShowPilotModal,
  forceRerender,
}) => {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const subView: TitleMenuView = state.titleMenuSubView || 'root';
  const setSubView = (nextView: TitleMenuView) => {
    state.titleMenuSubView = nextView;
    forceRerender();
  };

  const roster = loadPilotRoster();
  const activeTrait = state.traitLine || 'Warrior';
  const traitProfile = TRAIT_REGISTRY[activeTrait] || TRAIT_REGISTRY.Warrior;
  const utilDef = getClassUtilityDefinition(undefined, activeTrait);
  const cursorIndex = Math.max(0, Math.min(3, state.titleMenuCursor ?? 0));
  const loadCursor = Math.max(
    0,
    Math.min(Math.max(0, roster.length - 1), state.titleMenuLoadCursor ?? 0)
  );
  const optionCursor = Math.max(0, Math.min(1, state.titleMenuOptionCursor ?? 0));

  // Paint the menu-example-001_6511d310.png backdrop onto a pixel canvas and seamlessly
  // reconstruct the dithered moonlit sky behind the static example text column (x: 21%..45%)
  // so only our interactive 4-item menu (New, Load, Training, Options — without Editor) is shown.
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.src = '/assets/aistudio/menu-example-001_6511d310.png';
    img.onload = () => {
      const w = img.naturalWidth || 690;
      const h = img.naturalHeight || 294;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Clean the baked left-edge logo (x: 0%..20%, y: 4%..42%) so it never clips when cropped to 10:9,
      // replacing it with the seamless dithered sky band so our standalone LOGO1_7ff3d8b5.png renders cleanly.
      const logoClearXEnd = Math.floor(w * 0.20);
      const logoClearYEnd = Math.floor(h * 0.42);
      const skyPatchX = Math.floor(w * 0.195);
      for (let y = Math.floor(h * 0.03); y < logoClearYEnd; y++) {
        for (let x = 0; x < logoClearXEnd; x++) {
          const idx = (y * w + x) * 4;
          const sX = Math.min(w - 1, skyPatchX + (x % 10));
          const sIdx = (y * w + sX) * 4;
          data[idx] = data[sIdx];
          data[idx + 1] = data[sIdx + 1];
          data[idx + 2] = data[sIdx + 2];
        }
      }

      // Clean the baked static menu text column (x: 21.5%..45.5%, y: 4%..98%)
      // by sampling the horizontal dithered sky/tree bands just outside the glyph strokes.
      const xStart = Math.floor(w * 0.215);
      const xEnd = Math.floor(w * 0.455);
      const leftAnchorX = Math.floor(w * 0.202);
      const rightAnchorX = Math.floor(w * 0.468);

      for (let y = Math.floor(h * 0.04); y < Math.floor(h * 0.98); y++) {
        for (let x = xStart; x <= xEnd; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const isRoyalBlueOutline = b > 140 && b - r > 45;
          const isBrightGlyphFill = r > 192 && g > 186 && b > 155;

          if (isRoyalBlueOutline || isBrightGlyphFill) {
            const t = (x - xStart) / Math.max(1, xEnd - xStart);
            const ditherOffset = ((x & 1) * 2 + (y & 1)) - 1;
            const sampleX =
              t < 0.42
                ? Math.max(0, leftAnchorX + (x & 3))
                : Math.min(w - 1, rightAnchorX - (x & 3));
            const sampleY = Math.max(0, Math.min(h - 1, y + ditherOffset));
            const sIdx = (sampleY * w + sampleX) * 4;
            data[idx] = data[sIdx];
            data[idx + 1] = data[sIdx + 1];
            data[idx + 2] = data[sIdx + 2];
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };
  }, []);

  const handleSelectMenuItem = (id: 'new' | 'load' | 'training' | 'options', idx: number) => {
    state.titleMenuCursor = idx;
    if (id === 'new') {
      soundSystem.playSelect();
      setTitleTab('new');
      setSubView('new');
    } else if (id === 'load') {
      soundSystem.playSelect();
      state.titleMenuLoadCursor = 0;
      setTitleTab('load');
      setSubView('load');
    } else if (id === 'training') {
      enterTrainingSandboxRoom(state);
      setShowPilotModal(false);
    } else if (id === 'options') {
      soundSystem.playSelect();
      state.titleMenuOptionCursor = 0;
      setSubView('options');
    }
    forceRerender();
  };

  return (
    <aside
      aria-label="Project Orion Main Menu"
      className="absolute inset-0 z-40 pointer-events-auto bg-[#120b18] flex flex-col justify-between select-none font-mono text-[#e2e8f0] overflow-hidden"
    >
      {/* Dithered Moonlit Tree Backdrop */}
      <canvas
        ref={bgCanvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-[58%_center] pointer-events-none [image-rendering:pixelated]"
      />

      {/* Subtle dark vignette for legibility when in subviews */}
      {subView !== 'root' && (
        <div className="absolute inset-0 bg-[#07050c]/86 backdrop-blur-[1px] pointer-events-none" />
      )}

      {/* ROOT MAIN MENU VIEW */}
      {subView === 'root' ? (
        <div className="relative z-10 flex-1 flex flex-col justify-between p-3 sm:p-4">
          {/* Top Bar: Left Project Orion Pixel Logo + Right Quick Resume Strip */}
          <div className="flex items-start justify-between gap-2">
            <img
              src="/assets/aistudio/LOGO1_7ff3d8b5.png"
              alt="Project Orion"
              className="w-24 sm:w-28 md:w-32 h-auto object-contain pointer-events-none [image-rendering:pixelated] drop-shadow-[0_2px_0_rgba(18,11,24,0.85)]"
            />

            <div className="flex items-center justify-end gap-2 flex-wrap">
              {roster.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (loadPilotFromRoster(state, roster[0].pilotId)) {
                      soundSystem.playPowerup();
                      state.atTitleMenu = false;
                      state.titleMenuSubView = 'root';
                      setShowPilotModal(false);
                      notifyOrionStateChange();
                    }
                  }}
                  className="px-2.5 py-1 bg-[#0b1329]/90 hover:bg-[#1e3a8a] text-[#f8fafc] border border-[#3b82f6] rounded-xs text-[9px] font-bold tracking-wider uppercase cursor-pointer shadow-md"
                >
                  ▶ CONTINUE: {roster[0].pilotName.toUpperCase()} (LV.{roster[0].level})
                </button>
              )}

              {state.t > 0.5 && (
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playMenuBeep();
                    state.atTitleMenu = false;
                    state.titleMenuSubView = 'root';
                    setShowPilotModal(false);
                    notifyOrionStateChange();
                  }}
                  className="px-2 py-1 bg-[#1e1b2e]/90 hover:bg-[#332d4d] text-[#fde047] border border-[#6366f1]/60 rounded-xs text-[9px] font-bold cursor-pointer"
                >
                  ✕ RESUME COCKPIT
                </button>
              )}
            </div>
          </div>

          {/* Left-Center Vertical Menu Stack (New, Load, Training, Options) */}
          <nav
            aria-label="Primary Title Navigation"
            className="my-auto pl-[10%] sm:pl-[14%] flex flex-col items-start gap-1.5 sm:gap-2.5"
          >
            {MAIN_MENU_ITEMS.map((item, idx) => {
              const isSelected = cursorIndex === idx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => {
                    if (state.titleMenuCursor !== idx) {
                      state.titleMenuCursor = idx;
                      soundSystem.playMenuBeep();
                      forceRerender();
                    }
                  }}
                  onClick={() => handleSelectMenuItem(item.id, idx)}
                  className={`group relative text-left font-black tracking-wide text-xl sm:text-2xl md:text-3xl leading-none px-2 py-0.5 cursor-pointer transition-transform duration-75 ${
                    isSelected
                      ? 'text-white translate-x-1 [text-shadow:-2px_-2px_0_#1d4ed8,2px_-2px_0_#1d4ed8,-2px_2px_0_#1d4ed8,2px_2px_0_#1d4ed8,0_3px_0_#1e3a8a]'
                      : 'text-[#d6ceb8] hover:text-white [text-shadow:-1px_-1px_0_#1e1624,2px_2px_0_#120b18]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.id === 'load' && roster.length > 0 && (
                    <span className="ml-2 align-middle text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#1e1b2e]/90 text-[#93c5fd] border border-[#3b82f6]/50 rounded-xs [text-shadow:none]">
                      {roster.length}
                    </span>
                  )}
                  {item.id === 'training' && isSelected && (
                    <span className="ml-2 align-middle text-[8.5px] font-mono font-bold px-1.5 py-0.5 bg-[#1d4ed8]/90 text-white border border-[#93c5fd] rounded-xs [text-shadow:none]">
                      SANDBOX [-4,0]
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Control Legend */}
          <div className="flex items-center justify-between text-[8.5px] text-[#cbd5e1]/90 bg-[#090612]/75 border border-[#2e233d] px-2.5 py-1 rounded-xs">
            <span>[↑/↓] NAVIGATE · [A / CLICK] OPEN SELECTION</span>
            <span>BELLDOR EXPEDITION · u00 COSMOS</span>
          </div>
        </div>
      ) : (
        /* SUBVIEWS: NEW PILOT / LOAD ROSTER / OPTIONS */
        <div className="relative z-10 flex-1 flex flex-col justify-between p-2.5 sm:p-3.5 overflow-y-auto">
          {/* Subview Top Bar */}
          <div className="border-b border-[#334155] pb-2 mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setSubView('root');
                }}
                className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] border border-[#475569] rounded-xs text-[9.5px] font-bold cursor-pointer"
              >
                ← MAIN MENU [B]
              </button>
              <span className="text-xs sm:text-sm font-black tracking-wider text-[#ffd27d]">
                {subView === 'new'
                  ? 'NEW GAME — PILOT & MECH FRAME BONDING'
                  : subView === 'load'
                    ? `LOAD GAME — SAVED PILOT ROSTER (${roster.length})`
                    : 'SYSTEM OPTIONS & 2.5D CONTROLS'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  enterTrainingSandboxRoom(state);
                  setShowPilotModal(false);
                }}
                className="px-2 py-0.5 bg-[#1d4ed8] hover:bg-[#2563eb] text-white border border-[#60a5fa] rounded-xs text-[9px] font-bold cursor-pointer"
              >
                ⚔ TRAINING [-4,0]
              </button>
            </div>
          </div>

          {subView === 'new' && (
            <div className="flex-1 flex flex-col justify-between space-y-2 text-[10px]">
              {/* Step 1: Starting Loadout Kit Selection */}
              <div>
                <div className="text-[9px] font-bold text-[#94a3b8] mb-1">
                  STEP 1 — SELECT STARTING LOADOUT KIT & MECH FRAME ([←/→] OR CLICK)
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
                            ? 'bg-[#1e293b] border-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.35)]'
                            : 'bg-[#090d16]/90 border-[#1e293b] hover:border-[#475569]'
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
              <div className="p-2 bg-[#0b111e]/95 border border-[#334155] rounded-xs space-y-1">
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

              {/* Step 2: Pilot Callsign & Deploy */}
              <div className="p-2 bg-[#0b111e]/95 border border-[#3b82f6]/60 rounded-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-[#ffd27d]">
                    STEP 2 — ENTER PILOT CALLSIGN & DEPLOY ([A] TO LAUNCH)
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
                    className="flex-1 bg-[#020617] border border-[#475569] focus:border-[#3b82f6] rounded-xs px-2.5 py-1.5 text-[11px] text-white font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const finalName =
                        state.pilotName.trim() || DEFAULT_CALLSIGNS[activeTrait];
                      createNewPilotGame(state, activeTrait, finalName);
                      state.atTitleMenu = false;
                      state.titleMenuSubView = 'root';
                      setShowPilotModal(false);
                      soundSystem.playPowerup();
                      notifyOrionStateChange();
                    }}
                    className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white border border-[#93c5fd] font-black text-[10.5px] rounded-xs shadow-md cursor-pointer shrink-0"
                  >
                    🚀 DEPLOY LV.1 (THE BOG)
                  </button>
                </div>
              </div>
            </div>
          )}

          {subView === 'load' && (
            <div className="flex-1 flex flex-col justify-between space-y-2 text-[10px]">
              <div className="space-y-1.5">
                {roster.length === 0 ? (
                  <div className="p-6 bg-[#0b111e]/95 border border-[#1e293b] rounded-xs text-center space-y-2">
                    <div className="text-[#94a3b8]">
                      No saved pilots found in localStorage roster yet.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTitleTab('new');
                        setSubView('new');
                      }}
                      className="px-3 py-1 bg-[#2563eb] text-white border border-[#93c5fd] font-bold rounded-xs text-[10px] cursor-pointer"
                    >
                      + CREATE YOUR FIRST PILOT
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                    {roster.map((entry, idx) => {
                      const isRowSel = idx === loadCursor;
                      const zoneLabel =
                        entry.areaId === 'camelot_border_town'
                          ? 'Camelot Border Town'
                          : entry.areaId === 'm01_orc_encampment'
                            ? 'Orc Encampment'
                            : entry.room === '-4,0'
                              ? 'Training Sandbox [-4,0]'
                              : 'The Bog';
                      const kitProfile = TRAIT_REGISTRY[entry.traitLine];
                      return (
                        <div
                          key={entry.pilotId}
                          onClick={() => {
                            state.titleMenuLoadCursor = idx;
                            forceRerender();
                          }}
                          className={`p-2 rounded-xs flex items-center justify-between gap-2 border ${
                            isRowSel
                              ? 'bg-[#1e293b] border-[#3b82f6]'
                              : 'bg-[#0b111e]/95 border-[#334155]'
                          }`}
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
                                  state.titleMenuSubView = 'root';
                                  setShowPilotModal(false);
                                  soundSystem.playPowerup();
                                  notifyOrionStateChange();
                                }
                              }}
                              className="px-2.5 py-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white border border-[#93c5fd] font-bold rounded-xs text-[9.5px] cursor-pointer"
                            >
                              ▶ LOAD [A]
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
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

          {subView === 'options' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div
                  onClick={() => {
                    state.titleMenuOptionCursor = 0;
                    forceRerender();
                  }}
                  className={`p-2 rounded-xs flex items-center justify-between border ${
                    optionCursor === 0
                      ? 'bg-[#1e293b] border-[#3b82f6]'
                      : 'bg-[#0b111e]/95 border-[#334155]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#f8fafc]">HUD TELEMETRY OVERLAY</div>
                    <div className="text-[8px] text-[#94a3b8]">Toggle high-contrast cockpit HUD</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      state.useStandardResolutionHud = !(state.useStandardResolutionHud ?? true);
                      soundSystem.playSelect();
                      forceRerender();
                    }}
                    className="px-2 py-1 bg-[#0f172a] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs font-bold text-[9px] cursor-pointer"
                  >
                    {(state.useStandardResolutionHud ?? true) ? 'HI-RES ON' : 'MINIMAL'}
                  </button>
                </div>

                <div
                  onClick={() => {
                    state.titleMenuOptionCursor = 1;
                    forceRerender();
                  }}
                  className={`p-2 rounded-xs flex items-center justify-between border ${
                    optionCursor === 1
                      ? 'bg-[#1e293b] border-[#3b82f6]'
                      : 'bg-[#0b111e]/95 border-[#334155]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#fde68a]">BASE LIGHT STAT (VISION)</div>
                    <div className="text-[8px] text-[#94a3b8]">Default 5 tiles (~half screen)</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        state.baseLight = Math.max(2, (state.baseLight ?? 5) - 1);
                        soundSystem.playMenuBeep();
                        forceRerender();
                      }}
                      className="px-2 py-0.5 bg-[#0f172a] text-white border border-[#475569] rounded-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-1.5 font-bold text-[#fde047]">
                      {state.baseLight ?? 5}T
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        state.baseLight = Math.min(12, (state.baseLight ?? 5) + 1);
                        soundSystem.playMenuBeep();
                        forceRerender();
                      }}
                      className="px-2 py-0.5 bg-[#0f172a] text-white border border-[#475569] rounded-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-[#0b111e]/95 border border-[#334155] rounded-xs space-y-1">
                <div className="font-bold text-[#ffd27d] text-[9.5px]">
                  2.5D MECH CONTROLS & WORLD MAP FAST TRAVEL LAWS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[8.5px] text-[#cbd5e1]">
                  <div>
                    <strong className="text-[#38bdf8]">D-PAD / WASD:</strong> 8-Way traversal
                  </div>
                  <div>
                    <strong className="text-[#38bdf8]">[A] INTERACT / JUMP:</strong> Leap pits, Campfires & Waygates
                  </div>
                  <div>
                    <strong className="text-[#38bdf8]">[B] DODGE / BOOST:</strong> Tap dodge, Hold continuous boost
                  </div>
                  <div>
                    <strong className="text-[#38bdf8]">[X / Y / R / L]:</strong> Primary Chain, Block/Skill, Heavy, Lock-On
                  </div>
                  <div className="sm:col-span-2 pt-0.5 text-[#fde68a]">
                    <strong>WORLD MAP AUTHORITY:</strong> Menu = View-Only · Campfire = Within-World Fast Travel · Waygate = World-to-World & Local Fast Travel
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
