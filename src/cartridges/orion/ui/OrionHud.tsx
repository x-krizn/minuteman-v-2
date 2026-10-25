/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import { DEFAULT_CALLSIGNS, TRAIT_LIST, TRAIT_REGISTRY } from '../database/characters';
import { getClassUtilityDefinition } from '../database/equipment';
import {
  GEMSTONE_CATALOG,
  GEMSTONE_REGISTRY,
  getEffectiveMainGrip,
  getInventoryGemCount,
  TRAIT_FUNDING_GEMS,
} from '../database/progression';
import { getWeaponDefinition } from '../database/weapons';
import { getItemDefinition } from '../database/items';
import {
  activateResolvedCombatSkill,
  applyTraitLineProfile,
  createNewPilotGame,
  cycleTargetLock,
  deletePilotFromRoster,
  firePrimarySalvoShot,
  getDoorwayAetherTransitionInfo,
  getLockedTarget,
  getOrionStateRef,
  getResolvedCombatSkills,
  getRoomWorldInfo,
  hasPoeLanternGuidance,
  loadPilotFromRoster,
  loadPilotRoster,
  notifyOrionStateChange,
  PERFECT_BLOCK_WINDOW_SEC,
  performAuxiliarySwap,
  releaseHeldBlock,
  ResolvedCombatSkill,
  spawnParticles,
  startHoldingBlock,
  TUTORIAL_STEP_DESCRIPTORS,
  TutorialStepId,
} from '../systems';
import { AetherCardinalDir, OrionState } from '../types';

const OUTLINED_TEXT =
  '[text-shadow:_-1px_-1px_0_#020617,_1px_-1px_0_#020617,_-1px_1px_0_#020617,_1px_1px_0_#020617,_0_1px_3px_#020617]';

const WORLD_X_CLASSES = [
  'left-[18%]',
  'left-[26%]',
  'left-[34%]',
  'left-[42%]',
  'left-[50%]',
  'left-[58%]',
  'left-[66%]',
  'left-[74%]',
  'left-[82%]',
] as const;

const WORLD_Y_CLASSES = [
  'top-[16%]',
  'top-[24%]',
  'top-[32%]',
  'top-[40%]',
  'top-[48%]',
  'top-[56%]',
  'top-[64%]',
  'top-[72%]',
] as const;

function getWorldRelativeClasses(
  state: OrionState,
  wx: number,
  wy: number,
  wz: number = 0
): string {
  const camX = Math.round(state.camX || 0);
  const camY = Math.round(state.camY || 0);
  const normX = Math.max(0, Math.min(1, (wx - camX) / 160));
  const normY = Math.max(0, Math.min(1, (wy - wz * 0.75 - 16 - camY) / 144));
  const xIdx = Math.min(
    WORLD_X_CLASSES.length - 1,
    Math.max(0, Math.round(normX * (WORLD_X_CLASSES.length - 1)))
  );
  const yIdx = Math.min(
    WORLD_Y_CLASSES.length - 1,
    Math.max(0, Math.round(normY * (WORLD_Y_CLASSES.length - 1)))
  );
  return `${WORLD_X_CLASSES[xIdx]} ${WORLD_Y_CLASSES[yIdx]} -translate-x-1/2 -translate-y-1/2`;
}

function resolveToastPlacement(
  state: OrionState,
  text: string
): { positionClass: string; colorClass: string } {
  const upper = text.toUpperCase();

  // 1. Target Lock-On -> relative to locked enemy (or player if unlocked)
  if (upper.includes('TARGET LOCK') || upper.includes('TARGET UNLOCK') || upper.includes('HOSTILE TARGET')) {
    const locked = getLockedTarget(state);
    const pos = locked
      ? getWorldRelativeClasses(state, locked.x, locked.y, locked.z)
      : getWorldRelativeClasses(state, state.x, state.y, state.z);
    return {
      positionClass: pos,
      colorClass: 'text-[#38bdf8] border-[#38bdf8]/80',
    };
  }

  // 2. Munitions, Reload & Weapon Swap -> relative to top-right weapon/ammo readout
  if (
    upper.includes('RELOAD') ||
    upper.includes('MAGAZINE') ||
    upper.includes('STANCE') ||
    upper.includes('SWAPPED') ||
    upper.includes('SWAP') ||
    upper.includes('AUXILIARY')
  ) {
    return {
      positionClass: 'top-14 right-2 text-right',
      colorClass: 'text-[#fbbf24] border-[#fbbf24]/80',
    };
  }

  // 3. Defense Layers, Reactor Heat, Boost & Frame Status -> relative to top-left gauges
  if (
    upper.includes('OVERHEAT') ||
    upper.includes('BOOSTER') ||
    upper.includes('SHIELD') ||
    upper.includes('ARMOR') ||
    upper.includes('CRITICAL') ||
    upper.includes('FRAME DESTROYED') ||
    upper.includes('SINKHOLE') ||
    upper.includes('REBOOTED')
  ) {
    return {
      positionClass: 'top-16 left-2 text-left',
      colorClass: upper.includes('OVERHEAT') || upper.includes('DESTROYED') || upper.includes('CRITICAL')
        ? 'text-[#f87171] border-[#f87171]/80'
        : 'text-[#7dd3fc] border-[#38bdf8]/80',
    };
  }

  // 4. Skill Cooldown / Belt Depleted -> relative to bottom 5-skill icon bar
  if (
    upper.includes('COOLDOWN') ||
    upper.includes('UNAVAILABLE') ||
    upper.includes('DEPLETED') ||
    upper.includes('BELT SLOT') ||
    upper.includes('EQUIP OFF-HAND')
  ) {
    return {
      positionClass: 'bottom-11 left-1/2 -translate-x-1/2 text-center',
      colorClass: 'text-[#fde68a] border-[#fbbf24]/75',
    };
  }

  // 5. World Interaction, Loot, Salvage, Campfire, NPC -> relative to player in world space
  if (
    upper.includes('LOOTED') ||
    upper.includes('SALVAGED') ||
    upper.includes('SCRAP') ||
    upper.includes('RESTED') ||
    upper.includes('CAMPFIRE') ||
    upper.includes('LANTERN') ||
    upper.includes('LOYALIST') ||
    upper.includes('SCAVENGER') ||
    upper.includes('TRADED') ||
    upper.includes('SWITCH') ||
    upper.includes('BARRIERS') ||
    upper.includes('SIGNET RING') ||
    upper.includes('GATE') ||
    upper.includes('DUNGEON') ||
    upper.includes('WAYGATE') ||
    upper.includes('WAYSTATION')
  ) {
    return {
      positionClass: getWorldRelativeClasses(state, state.x, state.y, state.z),
      colorClass: 'text-[#fef08a] border-[#facc15]/80',
    };
  }

  // 6. Default: Sector / Room Transition & Level Banners -> relative to top-center sector header
  return {
    positionClass: 'top-6 left-1/2 -translate-x-1/2 text-center',
    colorClass: 'text-[#7dd3fc] border-[#38bdf8]/75',
  };
}

function renderSkillGlyph(skill: ResolvedCombatSkill | null, index: number): React.ReactNode {
  if (!skill || !skill.available || skill.id === 'none') {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" strokeDasharray="2 2" />
      </svg>
    );
  }

  // Belt Consumables
  if (skill.sourceCategory === 'belt') {
    if (skill.itemId === 'repair_kit') {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          <rect x="4" y="4" width="16" height="16" rx="3" strokeWidth="1.6" />
        </svg>
      );
    }
    if (skill.itemId === 'grail_water') {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3c-4 5-6 8-6 11a6 6 0 0012 0c0-3-2-6-6-11z" />
        </svg>
      );
    }
    if (skill.itemId === 'poe_lantern_charm') {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#22d3ee]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 4h6M8 8h8l-1 11H9L8 8zM12 11v4" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fbbf24]" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="4" width="10" height="16" rx="4" />
        <path d="M7 12h10" />
      </svg>
    );
  }

  const wId = skill.weaponId || '';
  const isShield = wId.includes('shield');
  const isCatalyst = wId.includes('catalyst');
  const isBowOrQuiver = wId === 'great_bow' || wId === 'quiver';
  const isSpearOrLance = wId === 'short_spear' || wId === 'avalon_siege_lance';
  const isMace = wId === 'mace';
  const isAxe = wId === 'hand_axe';
  const isSwordOrKhopesh = wId === 'long_sword' || wId === 'khopesh';

  if (isCatalyst) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#e879f9]" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 19,9 12,22 5,9" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  // Slot 1: Primary Attack
  if (index === 0) {
    if (isShield) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
        </svg>
      );
    }
    if (isBowOrQuiver) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 19L19 5M19 5h-6M19 5v6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 8c5 0 8 3 8 8" strokeLinecap="round" />
        </svg>
      );
    }
    if (isSpearOrLance) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#7dd3fc]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20L20 4M14 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (isMace) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fbbf24]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 19l9-9" strokeLinecap="round" />
          <polygon points="14,4 20,4 20,10 14,10" />
        </svg>
      );
    }
    if (isAxe) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fb923c]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 19L17 7" strokeLinecap="round" />
          <path d="M13 4c4 0 7 3 7 7-3 1-5 0-7-2" strokeLinejoin="round" />
        </svg>
      );
    }
    if (isSwordOrKhopesh) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#e879f9]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20L19 5M14 5h5v5M7 13l4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    // Default Ranged Boltcaster Crosshair
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="6" />
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
      </svg>
    );
  }

  // Slot 2: Tactical / Blast / Guard / Volley
  if (index === 1) {
    if (isShield || isSwordOrKhopesh) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fbbf24]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
          <path d="M9 12h6M12 9v6" strokeLinecap="round" />
        </svg>
      );
    }
    if (isBowOrQuiver) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fde047]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M6 17L4 7M18 17l2-10" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fbbf24]" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,3 14.8,8.8 21,9.5 16.5,14 17.8,20.2 12,17 6.2,20.2 7.5,14 3,9.5 9.2,8.8" />
      </svg>
    );
  }

  // Slot 3: Flurry / Sunder / Suppression
  if (index === 2) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#c084fc]" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 3L5 14h6l-1 7 9-11h-6l1-7z" strokeLinejoin="round" />
      </svg>
    );
  }

  // Slot 4: Block (for all equippable blocking weapons) or Ranged Suppression
  if (index === 3 || skill.isBlock) {
    if (skill.isBlock) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
          <path d="M12 7v9M8.5 11h7" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,3 21,12 12,21 3,12" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  // Slot 5: Heavy Finisher / Quiver Dump
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#f472b6]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6L12 2z" strokeLinejoin="round" />
    </svg>
  );
}

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
              D-PAD / CLICK: SELECT TRAIT LINE · DEPLOY NEW PILOT OR CONTINUE
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
              ▶ CONTINUE: {roster[0].pilotName.toUpperCase()} ({roster[0].traitLine} LV.{roster[0].level})
            </button>
          )}
        </div>

        {/* Main Content Area */}
        {titleTab === 'new' ? (
          <div className="flex-1 flex flex-col justify-between space-y-2 text-[10px]">
            {/* Step 1: Trait Line Selection */}
            <div>
              <div className="text-[9px] font-bold text-[#94a3b8] mb-1">
                STEP 1 — SELECT TRAIT LINE & MECH FRAME
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

  // Resolved 5-Skill Moveset & Target Lock
  const combatSkills = getResolvedCombatSkills(state);
  const skillSlots: Array<ResolvedCombatSkill | null> = [
    combatSkills.skill1,
    combatSkills.skill2,
    combatSkills.skill3,
    combatSkills.skill4,
    combatSkills.skill5,
  ];
  const lockedEnemy = getLockedTarget(state);

  const hudCombatCtx = {
    state,
    sound: soundSystem,
    spawnParticles: (x: number, y: number, z: number, count: number, color: string, label?: string) => {
      spawnParticles(state, x, y, z, count, color, label);
    },
    say: (txt: string) => {
      state.toastText = txt;
      state.toastTimer = 2.2;
    },
  };

  const toastPlacement =
    state.toastText && state.toastTimer > 0
      ? resolveToastPlacement(state, state.toastText)
      : null;

  const promptPositionClass = state.promptText
    ? getWorldRelativeClasses(state, state.x, state.y, state.z)
    : '';

  return (
    <aside
      aria-label="Pilot Mech Cockpit Telemetry"
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5 sm:p-2 z-20 select-none font-mono text-[#e2e8f0] bg-transparent"
    >
      {/* 1. TOP BAR HUD CLUSTER (Transparent, Outlined Readouts) */}
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
              setShowPilotModal(true);
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
          </div>
        </section>

        {/* CENTER CLUSTER: Room Title, Map-Relative Mini-Map & Æther Pyramid Gauge (SAFE · 1 · 2 · 3 · 2 · 1 · SAFE) */}
        <section
          aria-label="Sector Info & Mini-Map"
          className={`hidden xs:flex flex-col items-center gap-0.5 bg-transparent ${OUTLINED_TEXT}`}
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

          {/* Map-Relative Mini-Map (5x3 local window around [state.rx, state.ry]) + Æther Fog Depth Gauge */}
          {(() => {
            const hasLantern = hasPoeLanternGuidance(state);
            const curStage = worldInfo.loopStage || 0;
            const curDepth = worldInfo.loopDepth || 0;
            const maxDepth = Math.max(2, worldInfo.loopMaxDepth || (state.level || 1) + 1);
            const inLoop = worldInfo.nodeType === 'loop' || curDepth > 0;
            const nodesMap = state.fogGraph?.nodes || {};

            const dirByDelta = (dx: number, dy: number): AetherCardinalDir | null => {
              if (dx === 0 && dy === -1) return 'N';
              if (dx === 0 && dy === 1) return 'S';
              if (dx === 1 && dy === 0) return 'E';
              if (dx === -1 && dy === 0) return 'W';
              return null;
            };

            const depthSteps: Array<{ label: string; depth: number }> = [
              { label: 'SAFE', depth: 0 },
              ...Array.from({ length: maxDepth }, (_, idx) => ({
                label: String(idx + 1),
                depth: idx + 1,
              })),
            ];

            return (
              <div className="flex flex-col items-center gap-0.5 bg-transparent">
                {/* 5x3 Map-Relative Grid */}
                <div
                  aria-label="Map-Relative Mini-Map"
                  className="grid grid-cols-5 gap-0.5 p-0.5 bg-transparent"
                >
                  {[-1, 0, 1].map((dy) =>
                    [-2, -1, 0, 1, 2].map((dx) => {
                      const cellRx = state.rx + dx;
                      const cellRy = state.ry + dy;
                      const isCenter = dx === 0 && dy === 0;
                      const adjDir = dirByDelta(dx, dy);
                      const transInfo = adjDir
                        ? getDoorwayAetherTransitionInfo(state, adjDir)
                        : null;

                      const authoredNode = nodesMap[`${cellRx},${cellRy}`];
                      const dynamicNodeAtCell = Object.values(nodesMap).find(
                        (n) =>
                          n.id.startsWith('fog:') &&
                          n.mapRx === cellRx &&
                          n.mapRy === cellRy
                      );
                      const cellNode = dynamicNodeAtCell || authoredNode;

                      const isDensityWarning = Boolean(
                        inLoop && transInfo?.increasesDensity
                      );
                      const isPoeLoopReveal = Boolean(
                        !inLoop && transInfo?.isLoopEntrance && hasLantern
                      );

                      let cellClass = 'border-[#334155]/45 text-[#475569]';
                      let symbol = '·';

                      if (isCenter) {
                        cellClass = inLoop
                          ? curDepth >= maxDepth
                            ? 'border-[#f43f5e] text-[#fda4af] font-black'
                            : 'border-[#c084fc] text-[#e9d5ff] font-black'
                          : 'border-[#38bdf8] text-[#7dd3fc] font-black';
                        symbol = inLoop ? String(curDepth) : '◈';
                      } else if (isDensityWarning) {
                        cellClass =
                          (transInfo?.nextDepth || 0) >= maxDepth
                            ? 'border-[#f43f5e]/90 text-[#f43f5e] font-black'
                            : 'border-[#c084fc]/90 text-[#e879f9] font-black';
                        symbol = '!';
                      } else if (isPoeLoopReveal) {
                        cellClass = 'border-[#22d3ee]/90 text-[#22d3ee] font-black';
                        symbol = '◎';
                      } else if (cellNode) {
                        if (cellNode.nodeType === 'loop') {
                          cellClass = 'border-[#a855f7]/70 text-[#d8b4fe]';
                          symbol = String(cellNode.loopDepth || 1);
                        } else if (cellNode.nodeType === 'end') {
                          cellClass = 'border-[#fbbf24]/75 text-[#fde047]';
                          symbol = '★';
                        } else {
                          cellClass = 'border-[#64748b]/75 text-[#cbd5e1]';
                          symbol = '□';
                        }
                      }

                      return (
                        <div
                          key={`${dx},${dy}`}
                          className={`w-3.5 h-2.5 rounded-[1px] border bg-transparent flex items-center justify-center text-[6.5px] leading-none ${cellClass}`}
                          title={
                            isCenter
                              ? `Current [${cellRx},${cellRy}] ${inLoop ? `· Æther Depth ${curDepth}/${maxDepth}` : '· Safe'}`
                              : isDensityWarning
                                ? `Warning: Increased Æther Density (Depth ${transInfo?.nextDepth}/${maxDepth})`
                                : isPoeLoopReveal
                                  ? 'Poe Lamp Reveal: Æther Fog Entrance (Depth 1)'
                                  : cellNode
                                    ? `${cellNode.title} [${cellRx},${cellRy}]`
                                    : `Uncharted [${cellRx},${cellRy}]`
                          }
                        >
                          {symbol}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Æther Fog Depth Gauge: SAFE · 1 .. (clvl + 1) + Room Progress */}
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
                {lockedEnemy.name} ({lockedEnemy.frame.integrity} HP)
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

      {/* 2. CONTEXTUAL OUTLINED POP-UP MESSAGES (Auto-expiring, no background container, relative to info) */}
      {state.promptText && (
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

      {/* 3. BOTTOM 5-SKILL ICON BAR (Transparent, 5 Skill Icons with Cooldown Timer Overlay, No A/B/L/X/Y/R) */}
      <footer className="w-full flex items-center justify-center pb-0.5 bg-transparent">
        <div
          aria-label="Combat Skill Icons"
          className="flex items-center gap-1.5 sm:gap-2 bg-transparent"
        >
          {skillSlots.map((skill, idx) => {
            const slotNum = (idx + 1) as 1 | 2 | 3 | 4 | 5;
            const rawCd =
              idx === 0 && isReloading
                ? reloadTimer
                : skill?.currentCooldown || 0;
            const activeRem = skill?.activeRemaining || 0;
            const isDurationActive = activeRem > 0.05;
            const onCooldown = rawCd > 0.05;
            const isSkillReloading = Boolean(
              (idx === 0 && isReloading) || (skill?.isReloading && onCooldown)
            );
            const isAvailable = Boolean(skill && skill.available && skill.id !== 'none');
            const isActiveSlot =
              (idx === 0 && state.combatActiveChain) ||
              isDurationActive ||
              Boolean(
                skill?.cooldownKey &&
                  state.activeSkillCooldownKey === skill.cooldownKey &&
                  state.skillActionTimer > 0
              );

            const isHeldBlockSlot = Boolean(skill?.isBlock && state.isHoldingBlock);
            const isPerfectBlockActive = Boolean(
              isHeldBlockSlot && (state.blockHoldTimer || 0) <= PERFECT_BLOCK_WINDOW_SEC
            );

            const borderColorClass = !isAvailable
              ? 'border-[#334155]/45 opacity-40'
              : isPerfectBlockActive
                ? 'border-[#38bdf8] scale-110'
                : isHeldBlockSlot
                  ? 'border-[#93c5fd] scale-105'
                  : isDurationActive
                    ? 'border-[#4ade80] scale-105'
                    : isActiveSlot
                      ? 'border-white scale-105'
                      : isSkillReloading
                        ? 'border-[#f59e0b]/90'
                        : onCooldown
                          ? 'border-[#64748b]/80'
                          : idx === 0
                            ? 'border-[#38bdf8]/85 hover:border-[#7dd3fc]'
                            : idx === 1
                              ? 'border-[#fbbf24]/85 hover:border-[#fde047]'
                              : idx === 2
                                ? 'border-[#c084fc]/85 hover:border-[#e9d5ff]'
                                : idx === 3
                                  ? 'border-[#38bdf8]/75 hover:border-[#7dd3fc]'
                                  : 'border-[#f472b6]/80 hover:border-[#fbcfe8]';

            return (
              <button
                key={slotNum}
                type="button"
                onPointerDown={() => {
                  if (skill?.isBlock) {
                    startHoldingBlock(state, hudCombatCtx);
                  }
                }}
                onPointerUp={() => {
                  if (skill?.isBlock) {
                    releaseHeldBlock(state);
                  }
                }}
                onPointerLeave={() => {
                  if (skill?.isBlock && state.isHoldingBlock) {
                    releaseHeldBlock(state);
                  }
                }}
                onPointerCancel={() => {
                  if (skill?.isBlock && state.isHoldingBlock) {
                    releaseHeldBlock(state);
                  }
                }}
                onClick={() => {
                  if (skill?.isBlock) return;
                  if (idx === 0) {
                    firePrimarySalvoShot(state, hudCombatCtx, false);
                  } else {
                    activateResolvedCombatSkill(state, hudCombatCtx, slotNum);
                  }
                }}
                title={
                  skill
                    ? `${skill.name}${
                        skill.isBlock
                          ? ' [Hold: 0.25s Perfect Block Window · No Cooldown]'
                          : isDurationActive
                            ? ` [ACTIVE ${activeRem.toFixed(1)}s]`
                            : isSkillReloading
                              ? ` [RELOAD ${rawCd.toFixed(1)}s]`
                              : onCooldown
                                ? ` (${rawCd.toFixed(1)}s)`
                                : ''
                      }`
                    : `Skill ${slotNum}`
                }
                className={`pointer-events-auto relative w-7 h-7 sm:w-8 sm:h-8 rounded-xs border bg-transparent flex items-center justify-center transition-transform cursor-pointer drop-shadow-[0_1px_2px_rgba(2,6,23,0.95)] ${borderColorClass}`}
              >
                {/* Skill Icon SVG */}
                <span className={onCooldown ? 'opacity-35' : 'opacity-95'}>
                  {renderSkillGlyph(skill, idx)}
                </span>

                {/* Consumable Stack Count */}
                {skill?.sourceCategory === 'belt' &&
                  typeof skill.itemCount === 'number' &&
                  !onCooldown && (
                    <span
                      className={`absolute bottom-0 right-0.5 text-[7px] font-black text-[#fef08a] leading-none ${OUTLINED_TEXT}`}
                    >
                      {skill.itemCount}
                    </span>
                  )}

                {/* Overlaid Held Block / Perfect Window, Active Duration, or Cooldown/Reload Timer */}
                {isHeldBlockSlot ? (
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-[7px] font-black ${
                      isPerfectBlockActive ? 'text-[#38bdf8]' : 'text-[#bae6fd]'
                    } tracking-tighter ${OUTLINED_TEXT}`}
                  >
                    {isPerfectBlockActive ? 'PERF' : 'HOLD'}
                  </span>
                ) : isDurationActive ? (
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-[8.5px] sm:text-[9px] font-black text-[#4ade80] tracking-tighter ${OUTLINED_TEXT}`}
                  >
                    {activeRem.toFixed(1)}
                  </span>
                ) : onCooldown ? (
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-[8.5px] sm:text-[9px] font-black ${
                      isSkillReloading ? 'text-[#fbbf24]' : 'text-white'
                    } tracking-tighter ${OUTLINED_TEXT}`}
                  >
                    {rawCd.toFixed(1)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </footer>
    </aside>
  );
};

