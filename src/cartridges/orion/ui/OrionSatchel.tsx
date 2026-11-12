/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../database/characters';
import { getItemDefinition } from '../database/items';
import { getCoinPickupSpriteBase64 } from '../database/items/currency';
import {
  computePlayerLoadMetrics,
  GEMSTONE_CATALOG,
  GEMSTONE_REGISTRY,
  getInventoryGemCount,
  getRetainedBuildGemCounts,
} from '../database/progression';
import {
  getOrionStateRef,
  notifyOrionStateChange,
  subscribeOrionStateChange,
} from '../systems';
import { FeatSynergyCategory, FeatTier } from '../types';
import {
  EditableLoadoutSlot,
  EquipmentInventoryCategory,
  SpriteCanvasIcon,
} from './satchel/SatchelCanvases';
import { SatchelArmoryTab } from './satchel/SatchelArmoryTab';
import { SatchelCodexTab } from './satchel/SatchelCodexTab';
import { SatchelFeatsTab } from './satchel/SatchelFeatsTab';
import { SatchelInventoryTab, SatchelLoadoutTab } from './satchel/SatchelLoadoutTab';
import { SatchelStatusTab } from './satchel/SatchelStatusTab';
import { SatchelWorldTab } from './satchel/SatchelWorldTab';

/**
 * Props for the `OrionSatchel` (`[SELECT]` / `[SHIFT]`) Pilot Satchel overlay.
 * Supports both the React overlay HUD and pixel canvas HUD modes.
 */
export interface OrionSatchelProps {
  onResume: () => void;
}

/**
 * Renders the consolidated 5-tab Pilot Tactical Menu (`STATUS`, `LOADOUT`, `FEATS`, `MAP`, `CODEX`)
 * with a 3-mode segmented switcher inside `LOADOUT` (`MECH DOLL & SLOTS`, `ARMORY WORKBENCH`, `CARGO INVENTORY`)
 * and direct deep-linking into the 96-node Pan-and-Zoom Hexagonal Feat Constellation.
 * Supports both HUD modes and mutates `state: OrionState` through its child tab components.
 */
export const OrionSatchel: React.FC<OrionSatchelProps> = ({ onResume }) => {
  const [tab, setTab] = useState<'status' | 'weapons' | 'progression' | 'world' | 'codex'>(
    'status'
  );
  const [loadoutSubMode, setLoadoutSubMode] = useState<'slots' | 'armory' | 'inventory'>('slots');
  const [isEditingLoadout, setIsEditingLoadout] = useState(false);
  const [editingSlot, setEditingSlot] = useState<EditableLoadoutSlot>('slot1');
  const [loadoutSubtypeFilter, setLoadoutSubtypeFilter] = useState<string>('ALL');
  const [armoryFocusSlot, setArmoryFocusSlot] = useState<EditableLoadoutSlot | null>('slot1');
  const [armoryFocusItemId, setArmoryFocusItemId] = useState<string | null>(null);
  const [invCategory, setInvCategory] = useState<EquipmentInventoryCategory>('all');
  const [invSubtype, setInvSubtype] = useState<string>('ALL');
  const [featTierFilter, setFeatTierFilter] = useState<'ALL' | FeatTier>('ALL');
  const [featSynergyFilter, setFeatSynergyFilter] = useState<'ALL' | FeatSynergyCategory>('ALL');
  const [focusFeatId, setFocusFeatId] = useState<string | null>(null);
  const [, setRefresh] = useState(0);

  const openSlotEditor = (slot: EditableLoadoutSlot) => {
    soundSystem.playSelect();
    setTab('weapons');
    setLoadoutSubMode('slots');
    setIsEditingLoadout(true);
    setEditingSlot(slot);
    setLoadoutSubtypeFilter('ALL');
  };

  const openInArmory = (slot?: EditableLoadoutSlot, itemId?: string) => {
    soundSystem.playSelect();
    if (slot) setArmoryFocusSlot(slot);
    setArmoryFocusItemId(itemId || null);
    setTab('weapons');
    setLoadoutSubMode('armory');
  };

  const openFeatInConstellation = (featId: string) => {
    soundSystem.playSelect();
    setFocusFeatId(featId);
    setTab('progression');
  };

  useEffect(() => {
    return subscribeOrionStateChange(() => setRefresh((r) => r + 1));
  }, []);

  const state = getOrionStateRef();
  if (!state) return null;

  state.flags = state.flags || {};
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
  const isCheatMode = state.room === '-4,0' || Boolean(state.bypassProgressionGates);
  const loadMetrics = computePlayerLoadMetrics(state);

  const handleUseItem = (itemId: string) => {
    const itemDef = getItemDefinition(itemId);
    if (!itemDef?.onUse) return;

    const used = itemDef.onUse(state, {
      say: (txt) => {
        state.toastText = txt;
        state.toastTimer = 2.5;
      },
      sound: soundSystem,
    });

    if (used) {
      const slot = state.inventorySlots.find((s) => s.itemId === itemId);
      if (slot) {
        slot.count -= 1;
        if (slot.count <= 0) {
          state.inventorySlots = state.inventorySlots.filter((s) => s.itemId !== itemId);
        }
      }
      notifyOrionStateChange();
    }
  };

  const totalInvGems = GEMSTONE_CATALOG.reduce(
    (sum, g) => sum + getInventoryGemCount(state, g.id),
    0
  );
  const retainedMap = getRetainedBuildGemCounts(state);
  const totalRetainedGems = Object.values(retainedMap).reduce((a, b) => a + b, 0);

  return (
    <div
      data-universal-menu="true"
      className="absolute inset-0 z-20 bg-[#05070a]/95 backdrop-blur-xs flex flex-col p-2.5 overflow-hidden text-[#e2e8f0] font-mono select-none"
    >
      {/* Consolidated 5-Tab Top Header Bar (Zero Horizontal Overflow) */}
      <div className="flex items-center justify-between gap-1.5 pb-1.5 mb-1 border-b border-[#1e293b]">
        <div data-menu-tabs="true" className="flex items-center gap-1 min-w-0">
          <span className="text-[7.5px] font-bold text-[#64748b] px-1 py-0.5 border border-[#1e293b] rounded-xs shrink-0">
            [L/R]
          </span>
          <button
            data-tab-active={tab === 'status' ? 'true' : 'false'}
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('status');
            }}
            className={`px-2 py-0.5 text-[9.5px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer ${
              tab === 'status'
                ? 'bg-[#38bdf8] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            STATUS
          </button>
          <button
            data-tab-active={tab === 'weapons' ? 'true' : 'false'}
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('weapons');
            }}
            className={`px-2 py-0.5 text-[9.5px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer ${
              tab === 'weapons'
                ? 'bg-[#ffd27d] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            LOADOUT
          </button>
          <button
            data-tab-active={tab === 'progression' ? 'true' : 'false'}
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('progression');
            }}
            className={`px-2 py-0.5 text-[9.5px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer ${
              tab === 'progression'
                ? 'bg-[#c084fc] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            FEATS [96]
          </button>
          <button
            data-tab-active={tab === 'world' ? 'true' : 'false'}
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('world');
            }}
            className={`px-2 py-0.5 text-[9.5px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer ${
              tab === 'world'
                ? 'bg-[#22d3ee] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            MAP
          </button>
          <button
            data-tab-active={tab === 'codex' ? 'true' : 'false'}
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('codex');
            }}
            className={`px-2 py-0.5 text-[9.5px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer ${
              tab === 'codex'
                ? 'bg-[#50fa7b] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            CODEX
          </button>
        </div>

        <button
          onClick={() => {
            soundSystem.playMenuBeep();
            onResume();
          }}
          className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] text-[9.5px] font-bold rounded-xs border border-[#334155] shrink-0 cursor-pointer"
        >
          CLOSE [SELECT]
        </button>
      </div>

      {/* Unboxed 1-Line Tactical Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-1 pb-1.5 mb-1.5 border-b border-[#1e293b]/80 text-[9px] text-[#94a3b8] tabular-nums">
        <span>
          PILOT <b className="text-[#38bdf8]">{state.pilotName}</b> ({trait.frameModel || 'PNSY W416'})
        </span>
        <span>·</span>
        <span>
          LOAD{' '}
          <b
            className={
              loadMetrics.loadBracket === 'light'
                ? 'text-[#86efac]'
                : loadMetrics.loadBracket === 'medium'
                  ? 'text-[#7dd3fc]'
                  : loadMetrics.loadBracket === 'heavy'
                    ? 'text-[#fde047]'
                    : 'text-[#fca5a5]'
            }
          >
            {loadMetrics.equippedWeight}/{loadMetrics.maxCapacity} WT ({loadMetrics.loadPct}%)
          </b>
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <SpriteCanvasIcon
            base64={GEMSTONE_REGISTRY.moonstone.iconBase64}
            sizeClass="w-3 h-3"
          />
          GEMS <b className="text-[#4ade80]">{totalInvGems} INV</b> /{' '}
          <b className="text-[#7dd3fc]">{totalRetainedGems} SOCKETED</b>
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <SpriteCanvasIcon
            base64={getCoinPickupSpriteBase64(state.salvageScrap || 1)}
            sizeClass="w-3 h-3"
          />
          SCRAP <b className="text-[#ffd27d]">{state.salvageScrap}</b>
        </span>
      </div>

      {tab === 'status' && (
        <SatchelStatusTab
          state={state}
          isCheatMode={isCheatMode}
          onResume={onResume}
          onLocateFeat={openFeatInConstellation}
        />
      )}

      {tab === 'weapons' && (
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
          {/* Segmented Sub-Mode Bar inside Consolidated LOADOUT Tab */}
          <div className="flex items-center justify-between gap-1 px-1.5 py-1 bg-[#090d14] rounded-xs border border-[#1e293b] shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setLoadoutSubMode('slots');
                }}
                className={`px-2 py-0.5 rounded-xs text-[8.5px] font-bold border transition-colors cursor-pointer ${
                  loadoutSubMode === 'slots'
                    ? 'bg-[#ffd27d] text-[#05070a] border-[#fde047]'
                    : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:border-[#ffd27d]/60'
                }`}
              >
                1. MECH DOLL &amp; SLOTS
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setLoadoutSubMode('armory');
                }}
                className={`px-2 py-0.5 rounded-xs text-[8.5px] font-bold border transition-colors cursor-pointer ${
                  loadoutSubMode === 'armory'
                    ? 'bg-[#fb923c] text-[#05070a] border-[#fdba74]'
                    : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:border-[#fb923c]/60'
                }`}
              >
                2. ARMORY WORKBENCH ⚙
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setLoadoutSubMode('inventory');
                }}
                className={`px-2 py-0.5 rounded-xs text-[8.5px] font-bold border transition-colors cursor-pointer ${
                  loadoutSubMode === 'inventory'
                    ? 'bg-[#8dd7ad] text-[#05070a] border-[#6ee7b7]'
                    : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:border-[#8dd7ad]/60'
                }`}
              >
                3. CARGO INVENTORY
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                setTab('progression');
              }}
              className="px-2 py-0.5 rounded-xs text-[8px] font-bold bg-[#1e1b4b] hover:bg-[#312e81] text-[#e9d5ff] border border-[#818cf8]/50 cursor-pointer shrink-0"
            >
              ❖ FEAT CONSTELLATION →
            </button>
          </div>

          {loadoutSubMode === 'slots' && (
            <SatchelLoadoutTab
              state={state}
              isCheatMode={isCheatMode}
              isEditingLoadout={isEditingLoadout}
              setIsEditingLoadout={setIsEditingLoadout}
              editingSlot={editingSlot}
              setEditingSlot={setEditingSlot}
              loadoutSubtypeFilter={loadoutSubtypeFilter}
              setLoadoutSubtypeFilter={setLoadoutSubtypeFilter}
              openSlotEditor={openSlotEditor}
              onOpenInventoryTab={() => setLoadoutSubMode('inventory')}
              onOpenArmory={openInArmory}
              onLocateFeat={openFeatInConstellation}
            />
          )}

          {loadoutSubMode === 'armory' && (
            <SatchelArmoryTab
              state={state}
              isCheatMode={isCheatMode}
              initialFocusSlot={armoryFocusSlot}
              initialFocusItemId={armoryFocusItemId}
              onReturnToLoadout={() => setLoadoutSubMode('slots')}
              onLocateFeat={openFeatInConstellation}
            />
          )}

          {loadoutSubMode === 'inventory' && (
            <SatchelInventoryTab
              state={state}
              isCheatMode={isCheatMode}
              invCategory={invCategory}
              setInvCategory={setInvCategory}
              invSubtype={invSubtype}
              setInvSubtype={setInvSubtype}
              openSlotEditor={openSlotEditor}
              onOpenProgressionTab={() => setTab('progression')}
              onOpenArmory={openInArmory}
              handleUseItem={handleUseItem}
            />
          )}
        </div>
      )}

      {tab === 'progression' && (
        <SatchelFeatsTab
          state={state}
          isCheatMode={isCheatMode}
          onResume={onResume}
          featTierFilter={featTierFilter}
          setFeatTierFilter={setFeatTierFilter}
          featSynergyFilter={featSynergyFilter}
          setFeatSynergyFilter={setFeatSynergyFilter}
          initialFocusFeatId={focusFeatId}
          onClearFocusFeatId={() => setFocusFeatId(null)}
        />
      )}

      {tab === 'world' && (
        <SatchelWorldTab
          state={state}
          isCheatMode={isCheatMode}
          onResume={onResume}
          accessMode="menu"
        />
      )}

      {tab === 'codex' && <SatchelCodexTab state={state} />}
    </div>
  );
};


