/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  CORE_COMBAT_LAWS,
  doesPilotMeetFeatEquipmentRequirement,
  FRAME_FEAT_CATALOG,
  fundPilotSkillWithGem,
  GEMSTONE_CATALOG,
  GEMSTONE_REGISTRY,
  getInventoryGemCount,
  getRetainedBuildGemCounts,
  isFeatNodeAvailable,
  LEVEL_UNLOCK_SEQUENCE,
  normalizePilotSkills,
  PILOT_SKILL_DEFINITIONS,
  refundInventoryGem,
  toggleFeatNodeGemSocket,
} from '../../database/progression';
import {
  awakenLadyOfTheLake,
  evaluateCathedralDoorStatus,
  notifyOrionStateChange,
  setBypassProgressionGates,
  setTutorialStateActive,
  syncStateGates,
  triggerOrcRaid,
  triggerThreeKnightsTrial,
  TUTORIAL_STEP_DESCRIPTORS,
  TutorialStepId,
} from '../../systems';
import { FeatSynergyCategory, FeatTier, OrionState } from '../../types';
import { SpriteCanvasIcon } from './SatchelCanvases';

export interface SatchelFeatsTabProps {
  state: OrionState;
  isCheatMode: boolean;
  onResume: () => void;
  featTierFilter: 'ALL' | FeatTier;
  setFeatTierFilter: React.Dispatch<React.SetStateAction<'ALL' | FeatTier>>;
  featSynergyFilter: 'ALL' | FeatSynergyCategory;
  setFeatSynergyFilter: React.Dispatch<React.SetStateAction<'ALL' | FeatSynergyCategory>>;
}

export const SatchelFeatsTab: React.FC<SatchelFeatsTabProps> = ({
  state,
  isCheatMode,
  onResume,
  featTierFilter,
  setFeatTierFilter,
  featSynergyFilter,
  setFeatSynergyFilter,
}) => {
  const gates = syncStateGates(state);
  const doorStatus = evaluateCathedralDoorStatus(state);
  const normalizedSkills = normalizePilotSkills(state.pilotSkills);
  const retainedGems = getRetainedBuildGemCounts(state);

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
      {isCheatMode && (
        <>
          {/* Multi-Domain State & Gate Controller (Gated behind Drop-Pod Cheat Room) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
            <div className="text-[#38bdf8] font-bold text-[10px] flex items-center justify-between">
              <span>DROP-POD CHEAT ROOM — STATE & GATE CONTROLLER</span>
              <span className="text-[8.5px] text-[#94a3b8]">DEV CONSOLE</span>
            </div>

            {/* Gate 1: Tutorial State Isolation */}
            <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
              <div>
                <div className="font-bold text-[#e2e8f0] text-[9.5px]">
                  TUTORIAL STATE ({state.tutorialActive ? 'ACTIVE' : 'OFF · STANDARD WORLD'})
                </div>
                <div className="text-[8.5px] text-[#94a3b8]">
                  {state.tutorialActive
                    ? TUTORIAL_STEP_DESCRIPTORS[state.tutorialStep as TutorialStepId]?.objective ||
                      state.tutorialStep
                    : 'Areas act as standard gameworld zones without tutorial overrides.'}
                </div>
              </div>
              <button
                onClick={() => {
                  soundSystem.playSelect();
                  setTutorialStateActive(state, !state.tutorialActive);
                }}
                className={`px-2 py-0.5 rounded-xs font-bold text-[9px] cursor-pointer shrink-0 ml-2 ${
                  state.tutorialActive
                    ? 'bg-[#4f46e5] text-white border border-[#818cf8]'
                    : 'bg-[#1e293b] text-[#94a3b8] border border-[#475569]'
                }`}
              >
                {state.tutorialActive ? 'TUTORIAL ON' : 'STANDARD'}
              </button>
            </div>

            {/* Gate 2: Level Progression & Sandbox Gate Bypass */}
            <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
              <div>
                <div className="font-bold text-[#ffd27d] text-[9.5px]">
                  PROGRESSION LEVEL GATE: LVL {state.level} / 20
                </div>
                <div className="text-[8.5px] text-[#94a3b8]">
                  Hardpoints: {gates.maxWeaponSlots} · Skills: [{gates.unlockedSkillSlots.join(',')}
                  ] · Feats: {gates.featSlots}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => {
                    soundSystem.playMenuBeep();
                    state.level = Math.max(1, state.level - 1);
                    syncStateGates(state);
                    notifyOrionStateChange();
                  }}
                  className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[9px] cursor-pointer"
                >
                  -1
                </button>
                <button
                  onClick={() => {
                    soundSystem.playMenuBeep();
                    state.level = Math.min(20, state.level + 1);
                    syncStateGates(state);
                    notifyOrionStateChange();
                  }}
                  className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[9px] cursor-pointer"
                >
                  +1
                </button>
                <button
                  onClick={() => {
                    soundSystem.playSelect();
                    setBypassProgressionGates(state, !state.bypassProgressionGates);
                  }}
                  className={`px-1.5 py-0.5 rounded-xs font-bold text-[8.5px] cursor-pointer ${
                    state.bypassProgressionGates
                      ? 'bg-[#15803d] text-white border border-[#4ade80]'
                      : 'bg-[#1e293b] text-[#94a3b8] border border-[#475569]'
                  }`}
                >
                  {state.bypassProgressionGates ? 'BYPASS ON' : 'STRICT'}
                </button>
              </div>
            </div>
          </div>

          {/* Belldor Campaign & Secrets State Controller */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#c084fc]/40 space-y-1.5">
            <div className="text-[#c084fc] font-bold text-[10px] flex items-center justify-between">
              <span>BELLDOR CAMPAIGN & SECRETS STATE (CHEAT ROOM OVERRIDES)</span>
              <span className="text-[8.5px] text-[#94a3b8]">SANDBOX OVERRIDES ONLINE</span>
            </div>

            {/* Stage 1: The Poe & Bog Exit */}
            <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
              <div>
                <div className="font-bold text-[#7dd3fc] text-[9px]">
                  STAGE 1 · THE POE: {String(state.flags.poe_state || 'unmet').toUpperCase()}
                </div>
                <div className="text-[8px] text-[#94a3b8]">
                  Bog Exit: {state.flags.bog_exit_revealed ? 'REVEALED' : 'HIDDEN'} · Wurm Gift:{' '}
                  {state.flags.poe_lantern_gift ? 'ACTIVE' : 'NONE'}
                </div>
              </div>
              <button
                onClick={() => {
                  const order = ['unmet', 'helped', 'ignored', 'killed'];
                  const cur = String(state.flags.poe_state || 'unmet');
                  const next = order[(order.indexOf(cur) + 1) % order.length];
                  state.flags.poe_state = next;
                  state.flags.poe_lantern_gift = next === 'helped';
                  state.flags.bog_exit_revealed = next !== 'unmet';
                  soundSystem.playSelect();
                  notifyOrionStateChange();
                }}
                className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8.5px] text-[#38bdf8] cursor-pointer shrink-0 ml-2"
              >
                CYCLE POE
              </button>
            </div>

            {/* Part V Secrets: Bedivere's Ring, Numbered List & Lady of the Lake */}
            <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
              <div>
                <div className="font-bold text-[#e879f9] text-[9px]">
                  BEDIVERE RING:{' '}
                  {String(state.flags.bedivere_ring_choice || 'unchosen').toUpperCase()} · LIST:{' '}
                  {Number(state.flags.bedivere_list_items || 0)}/3
                </div>
                <div className="text-[8px] text-[#94a3b8]">
                  Ring taken = Loyalists hostile (+2 Trust needed). List 3/3 = Lady of the Lake.
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => {
                    const order = ['unchosen', 'taken', 'left'];
                    const cur = String(state.flags.bedivere_ring_choice || 'unchosen');
                    state.flags.bedivere_ring_choice =
                      order[(order.indexOf(cur) + 1) % order.length];
                    soundSystem.playSelect();
                    notifyOrionStateChange();
                  }}
                  className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                >
                  RING
                </button>
                <button
                  onClick={() => {
                    const next = (Number(state.flags.bedivere_list_items || 0) + 1) % 4;
                    state.flags.bedivere_list_items = next;
                    soundSystem.playSelect();
                    notifyOrionStateChange();
                  }}
                  className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                >
                  LIST +1
                </button>
                <button
                  onClick={() => {
                    state.flags.bedivere_list_items = 3;
                    awakenLadyOfTheLake(state);
                    onResume();
                  }}
                  className="px-1.5 py-0.5 bg-[#7e22ce] hover:bg-[#6b21a8] text-white rounded-xs font-bold text-[8px] cursor-pointer"
                >
                  LADY BOSS
                </button>
              </div>
            </div>

            {/* Stage 2: Orc Raid & Border Town Trust */}
            <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
              <div>
                <div className="font-bold text-[#fb923c] text-[9px]">
                  ORC RAID: {state.flags.orc_raid_active ? 'ACTIVE (BOG SEALED)' : 'INACTIVE'} ·
                  TRUST: {Number(state.flags.town_trust || 0)}
                </div>
                <div className="text-[8px] text-[#94a3b8]">
                  Orcs target NPCs first during raids. Saving NPCs increases Town Trust.
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => {
                    state.flags.town_trust = (Number(state.flags.town_trust || 0) + 1) % 6;
                    soundSystem.playMenuBeep();
                    notifyOrionStateChange();
                  }}
                  className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                >
                  TRUST +1
                </button>
                <button
                  onClick={() => {
                    triggerOrcRaid(state);
                    onResume();
                  }}
                  className="px-1.5 py-0.5 bg-[#9a3412] hover:bg-[#7c2d12] text-white rounded-xs font-bold text-[8px] cursor-pointer"
                >
                  START RAID
                </button>
              </div>
            </div>

            {/* Stage 2: Three Knights & 3-Way Cathedral Dungeon Door */}
            <div className="flex items-center justify-between bg-[#0f172a] p-1.5 rounded-xs border border-[#1e293b]">
              <div>
                <div className="font-bold text-[#ffd27d] text-[9px]">
                  DUNGEON DOOR: {doorStatus.canOpen ? 'READY TO OPEN' : 'LOCKED'}
                </div>
                <div className="text-[8px] text-[#94a3b8]">{doorStatus.reason}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => {
                    state.flags.grail_fragments =
                      (Number(state.flags.grail_fragments || 0) + 1) % 4;
                    soundSystem.playMenuBeep();
                    notifyOrionStateChange();
                  }}
                  className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                >
                  GRAIL +1
                </button>
                <button
                  onClick={() => {
                    state.flags.dungeon_switches =
                      (Number(state.flags.dungeon_switches || 0) + 1) % 4;
                    soundSystem.playMenuBeep();
                    notifyOrionStateChange();
                  }}
                  className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[8px] cursor-pointer"
                >
                  SWITCH +1
                </button>
                <button
                  onClick={() => {
                    triggerThreeKnightsTrial(state);
                    onResume();
                  }}
                  className="px-1.5 py-0.5 bg-[#312e81] hover:bg-[#3730a3] text-[#e2e8f0] border border-[#818cf8] rounded-xs font-bold text-[8px] cursor-pointer"
                >
                  3 KNIGHTS
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* NINE-GEMSTONE MATRIX & 3-WAY GEM PROGRESSION ENGINE */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#1e293b] pb-1">
          <span className="text-[#38bdf8] font-bold text-[10px]">
            NINE-GEMSTONE SYSTEM — PILOT SKILLS · FEAT NODE SOCKETS · EQUIPMENT MODS
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-1.5 py-0.5 rounded-xs font-bold text-[8px] ${
                gates.standardProgressionUnlocked
                  ? 'bg-[#064e3b] text-[#6ee7b7] border border-[#059669]'
                  : 'bg-[#451a03] text-[#fcd34d] border border-[#b45309]'
              }`}
            >
              {gates.standardProgressionUnlocked
                ? 'GEM SKILL PROGRESSION ONLINE'
                : 'TUTORIAL LOCKOUT (CLEAR TUTORIAL / LV 6 OR BYPASS)'}
            </span>
            {state.bypassProgressionGates && (
              <button
                onClick={() => {
                  soundSystem.playPowerup();
                  for (const gem of GEMSTONE_CATALOG) {
                    refundInventoryGem(state, gem.id, 1);
                  }
                  state.toastText = 'ADDED +1 OF ALL 9 CANONICAL GEMSTONES TO SATCHEL';
                  state.toastTimer = 2.4;
                  notifyOrionStateChange();
                }}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8]/60 rounded-xs font-bold text-[8px] text-[#7dd3fc] cursor-pointer"
              >
                +1 ALL 9 GEMS
              </button>
            )}
          </div>
        </div>

        {/* Canonical 9-Gemstone Key & Pouch Table */}
        <div className="space-y-1">
          <div className="text-[8.5px] text-[#94a3b8]">
            <b>Gem Uses:</b> (1) <b>Pilot Skill Level</b> = Gems permanently consumed · (2){' '}
            <b>Feat Node</b> = Gems removed from inventory, retained in build & refunded on unsocket ·
            (3) <b>Equipment Mod</b> = Gems spent, mod retained.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            {GEMSTONE_CATALOG.map((gem) => {
              const invCount = getInventoryGemCount(state, gem.id);
              const retainedCount = retainedGems[gem.id] || 0;
              return (
                <div
                  key={gem.id}
                  className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] flex items-center justify-between gap-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[8.5px] font-bold">
                      <SpriteCanvasIcon base64={gem.iconBase64} sizeClass="w-3.5 h-3.5" />
                      <span className="text-[#f8fafc] truncate">
                        {gem.name} (Col {gem.colIndex})
                      </span>
                    </div>
                    <div className="text-[7.5px] text-[#94a3b8] truncate">
                      {gem.assignment} · Res: {gem.primaryResource} · Funds:{' '}
                      {gem.fundsSkills.join(', ')}
                    </div>
                    <div className="text-[7.5px] text-[#cbd5e1] mt-0.5">
                      Inv: <b className="text-[#4ade80]">{invCount}</b>
                      {retainedCount > 0 ? (
                        <>
                          {' '}
                          · Retained: <b className="text-[#38bdf8]">{retainedCount}</b>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {state.bypassProgressionGates && (
                    <button
                      onClick={() => {
                        soundSystem.playCoin();
                        refundInventoryGem(state, gem.id, 1);
                        notifyOrionStateChange();
                      }}
                      className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-xs font-bold text-[7.5px] text-[#ffd27d] cursor-pointer shrink-0"
                      title={`Add 1 ${gem.name} to Satchel`}
                    >
                      +1
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Gem Use 1: 6 Combat Discipline Skills */}
        <div className="pt-1 border-t border-[#1e293b] space-y-1">
          <div className="flex items-center justify-between text-[8.5px]">
            <span className="font-bold text-[#ffd27d]">
              GEM USE 1 — 6 COMBAT DISCIPLINE SKILLS (LV 1–20 · GEMS PERMANENTLY CONSUMED):
            </span>
            <span className="text-[#7dd3fc] font-bold">
              UNLOCKED FEAT TIERS:{' '}
              {gates.unlockedFeatTiers.length > 0
                ? gates.unlockedFeatTiers.join(', ')
                : 'NONE (REACH SKILL LV 2)'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {PILOT_SKILL_DEFINITIONS.map((def) => {
              const prog = normalizedSkills[def.id];
              const lvl = prog?.level || 1;
              const invested = prog?.gemsInvested || 0;
              const [traitGemId, reactorGemId] = def.fundingGems;
              const traitGem = GEMSTONE_REGISTRY[traitGemId];
              const reactorGem = GEMSTONE_REGISTRY[reactorGemId];
              const haveTraitGem = getInventoryGemCount(state, traitGemId);
              const haveReactorGem = getInventoryGemCount(state, reactorGemId);
              const isActiveTrait = state.traitLine === def.id;

              return (
                <div
                  key={def.id}
                  className={`p-1.5 rounded-xs border space-y-1 ${
                    isActiveTrait
                      ? 'bg-[#172554]/50 border-[#38bdf8]/70'
                      : 'bg-[#0f172a] border-[#1e293b]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[8.5px]">
                    <span className="font-bold text-[#e2e8f0] truncate">
                      {def.name} {isActiveTrait ? '★' : ''}
                    </span>
                    <span className="font-bold text-[#38bdf8] shrink-0">
                      LV {lvl} / 20 ({invested} Gems)
                    </span>
                  </div>
                  <div className="text-[7.5px] text-[#94a3b8] leading-tight">
                    {def.relatedEquipment}
                  </div>
                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      onClick={() => {
                        const ok = fundPilotSkillWithGem(state, def.id, traitGemId, {
                          say: (txt) => {
                            state.toastText = txt;
                            state.toastTimer = 2.6;
                          },
                        });
                        if (ok) soundSystem.playPowerup();
                        else soundSystem.playMenuBeep();
                        syncStateGates(state);
                        notifyOrionStateChange();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-xs border text-[7.5px] font-bold cursor-pointer truncate ${
                        haveTraitGem > 0 && lvl < 20
                          ? 'bg-[#1e293b] hover:bg-[#334155] border-[#facc15]/60 text-[#fef08a]'
                          : 'bg-[#090d14] border-[#1e293b] text-[#64748b]'
                      }`}
                    >
                      <SpriteCanvasIcon base64={traitGem.iconBase64} sizeClass="w-3 h-3" />
                      <span>
                        Spend {traitGem.name} ({haveTraitGem})
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        const ok = fundPilotSkillWithGem(state, def.id, reactorGemId, {
                          say: (txt) => {
                            state.toastText = txt;
                            state.toastTimer = 2.6;
                          },
                        });
                        if (ok) soundSystem.playPowerup();
                        else soundSystem.playMenuBeep();
                        syncStateGates(state);
                        notifyOrionStateChange();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-xs border text-[7.5px] font-bold cursor-pointer truncate ${
                        haveReactorGem > 0 && lvl < 20
                          ? 'bg-[#1e293b] hover:bg-[#334155] border-[#38bdf8]/60 text-[#e0f2fe]'
                          : 'bg-[#090d14] border-[#1e293b] text-[#64748b]'
                      }`}
                    >
                      <SpriteCanvasIcon base64={reactorGem.iconBase64} sizeClass="w-3 h-3" />
                      <span>
                        Spend {reactorGem.name} ({haveReactorGem})
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gem Use 2: 97 Canonical Feat Nodes */}
        <div className="pt-1 border-t border-[#1e293b] space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1 text-[8.5px]">
            <span className="font-bold text-[#ffd27d]">
              GEM USE 2 — 97 FEAT NODES (CLASSLESS HARDWARE SYNERGY · GEMS REFUNDED ON UNSOCKET):
            </span>
            <span className="text-[#86efac] font-bold">
              ACTIVE FEATS: {state.equippedFeats.length} / {FRAME_FEAT_CATALOG.length}
            </span>
          </div>

          {/* Feat Tier & Synergy Category Filters */}
          <div className="flex flex-wrap items-center gap-1 text-[7.5px]">
            <span className="text-[#94a3b8] font-bold">TIER:</span>
            {(['ALL', 'I', 'II', 'III', 'IV', 'V'] as const).map((tOpt) => (
              <button
                key={tOpt}
                onClick={() => {
                  soundSystem.playSelect();
                  setFeatTierFilter(tOpt);
                }}
                className={`px-1.5 py-0.2 rounded-xs font-bold border cursor-pointer ${
                  featTierFilter === tOpt
                    ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                    : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b] hover:border-[#475569]'
                }`}
              >
                {tOpt === 'ALL' ? 'ALL TIERS' : `TIER ${tOpt}`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[7.5px]">
            <span className="text-[#94a3b8] font-bold">SYNERGY:</span>
            {(
              [
                'ALL',
                'Ballistics & Ordnance',
                'Melee & CQC',
                'Frame Plating & Defense',
                'Reactor & Thermal',
                'Mobility & Stealth',
                'Optics & Support',
              ] as const
            ).map((catOpt) => (
              <button
                key={catOpt}
                onClick={() => {
                  soundSystem.playSelect();
                  setFeatSynergyFilter(catOpt);
                }}
                className={`px-1.5 py-0.2 rounded-xs font-bold border cursor-pointer ${
                  featSynergyFilter === catOpt
                    ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                    : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b] hover:border-[#475569]'
                }`}
              >
                {catOpt === 'ALL' ? 'ALL SYNERGIES' : catOpt}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {FRAME_FEAT_CATALOG.filter((feat) => {
              if (featTierFilter !== 'ALL' && feat.tier !== featTierFilter) return false;
              const cat = feat.synergyCategory || 'Frame Plating & Defense';
              if (featSynergyFilter !== 'ALL' && cat !== featSynergyFilter) return false;
              return true;
            }).map((feat) => {
              const isTierOpen = isFeatNodeAvailable(state, feat);
              const isEquipped = state.equippedFeats.includes(feat.id);
              const hwCheck = doesPilotMeetFeatEquipmentRequirement(state, feat);
              const socketSummary = feat.gemSockets
                .map((s) => {
                  const g = GEMSTONE_REGISTRY[s.gemId];
                  const inv = getInventoryGemCount(state, s.gemId);
                  return `${s.count} ${g?.name || s.gemId} (${inv} inv)`;
                })
                .join(' + ');

              return (
                <button
                  key={feat.id}
                  onClick={() => {
                    const ok = toggleFeatNodeGemSocket(state, feat.id, {
                      say: (txt) => {
                        state.toastText = txt;
                        state.toastTimer = 2.6;
                      },
                    });
                    if (ok) soundSystem.playSelect();
                    else soundSystem.playMenuBeep();
                    syncStateGates(state);
                    notifyOrionStateChange();
                  }}
                  className={`p-1.5 rounded-xs border text-left transition-colors cursor-pointer ${
                    isEquipped
                      ? 'bg-[#172554]/80 border-[#38bdf8]'
                      : isTierOpen
                        ? 'bg-[#0f172a] border-[#1e293b] hover:border-[#475569]'
                        : 'bg-[#090d14] border-[#1e293b]/50 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                      [Tier {feat.tier} · Lv.{feat.requiredSkillLevel}+] {feat.name}
                    </span>
                    <span
                      className={`px-1 py-0.2 rounded-xs text-[7px] font-bold shrink-0 ${
                        isEquipped
                          ? 'bg-[#38bdf8] text-[#05070a]'
                          : feat.kind === 'system'
                            ? 'bg-[#064e3b] text-[#6ee7b7]'
                            : 'bg-[#3b0764] text-[#e879f9]'
                      }`}
                    >
                      {isEquipped
                        ? 'SOCKETED (CLICK TO REFUND)'
                        : `SOCKET (${feat.kind.toUpperCase()})`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[7px] mt-0.5">
                    <span className="text-[#7dd3fc] truncate">
                      {feat.synergyCategory || 'Frame Plating & Defense'}
                    </span>
                    <span
                      className={`font-bold shrink-0 ${
                        hwCheck.met ? 'text-[#4ade80]' : 'text-[#fbbf24]'
                      }`}
                    >
                      {hwCheck.met ? `✓ ${hwCheck.reason}` : `⚙ Req: ${hwCheck.reason}`}
                    </span>
                  </div>
                  <div className="text-[7.5px] text-[#86efac] mt-0.5">
                    + {feat.gainDescription}
                  </div>
                  <div className="text-[7.5px] text-[#fbbf24]">◆ Sockets: {socketSummary}</div>
                  {feat.unlocksDescription && (
                    <div className="text-[7px] text-[#94a3b8]">↳ {feat.unlocksDescription}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isCheatMode && (
        <>
          {/* Core Combat Laws */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
            <div className="text-[#ffd27d] font-bold text-[10px]">THE SIX CORE COMBAT LAWS:</div>
            {CORE_COMBAT_LAWS.map((law, idx) => (
              <div
                key={idx}
                className="text-[9px] text-[#cbd5e1] border-l-2 border-[#38bdf8] pl-1.5 py-0.5"
              >
                {law}
              </div>
            ))}
          </div>

          {/* Canonical Level 1-20 Sequence */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
            <div className="text-[#38bdf8] font-bold text-[10px]">
              LEVEL 1–20 UNLOCK SEQUENCE (CHEAT ROOM REFERENCE):
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {LEVEL_UNLOCK_SEQUENCE.map((lvl) => (
                <div
                  key={lvl.level}
                  className={`p-1 rounded-xs flex items-center justify-between gap-2 text-[8.5px] ${
                    state.level >= lvl.level || state.bypassProgressionGates
                      ? 'bg-[#1e293b] text-[#e2e8f0]'
                      : 'bg-[#090d14] text-[#64748b]'
                  }`}
                >
                  <div>
                    <span className="font-bold text-[#ffd27d]">
                      LV {lvl.level} [{lvl.band.toUpperCase()}]
                      {lvl.fixedEvent ? ` · ${lvl.fixedEvent}` : ''}:
                    </span>{' '}
                    <span>{lvl.unlock}</span>
                  </div>
                  <span className="italic text-[7.5px] shrink-0 text-[#94a3b8]">
                    {lvl.learningFocus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
