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
} from '../database/progression';
import {
  getOrionGraphicsSettings,
  getOrionStateRef,
  notifyOrionStateChange,
  subscribeOrionGraphicsSettings,
  subscribeOrionStateChange,
} from '../systems';
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
 * and direct deep-linking into the 118-node Pan-and-Zoom Hexagonal Feat Constellation.
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
    const unsubState = subscribeOrionStateChange(() => setRefresh((r) => r + 1));
    const unsubGfx = subscribeOrionGraphicsSettings(() => setRefresh((r) => r + 1));
    return () => {
      unsubState();
      unsubGfx();
    };
  }, []);

  const state = getOrionStateRef();
  if (!state) return null;

  state.flags = state.flags || {};
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
  const devMode = getOrionGraphicsSettings().devModeEnabled;
  const isCheatMode =
    devMode && (state.room === '-4,0' || Boolean(state.bypassProgressionGates));
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

  return (
    <div
      data-universal-menu="true"
      className="absolute inset-0 z-20 bg-[#05070a]/95 backdrop-blur-xs flex flex-col p-2 overflow-hidden text-[#e2e8f0] font-mono select-none"
    >
      {/* Structured 2-Row Top Header: Row 1 (Tabs + Close) & Row 2 (Pilot Telemetry) */}
      <div className="shrink-0 mb-1.5 pb-1.5 border-b border-[#1e293b] space-y-1">
        {/* Row 1: Primary Navigation Tabs + Close Button */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div data-menu-tabs="true" className="flex flex-wrap items-center gap-1 min-w-0">
            <span className="text-[9px] font-bold text-[#64748b] px-1 py-0.5 border border-[#1e293b] rounded-xs shrink-0">
              [L/R]
            </span>
            <button
              data-tab-active={tab === 'status' ? 'true' : 'false'}
              onClick={() => {
                soundSystem.playMenuBeep();
                setTab('status');
              }}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap ${
                tab === 'status'
                  ? 'bg-[#38bdf8] text-[#05070a]'
                  : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
              }`}
            >
              Status
            </button>
            <button
              data-tab-active={tab === 'weapons' ? 'true' : 'false'}
              onClick={() => {
                soundSystem.playMenuBeep();
                setTab('weapons');
              }}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap ${
                tab === 'weapons'
                  ? 'bg-[#ffd27d] text-[#05070a]'
                  : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
              }`}
            >
              Loadout
            </button>
            <button
              data-tab-active={tab === 'progression' ? 'true' : 'false'}
              onClick={() => {
                soundSystem.playMenuBeep();
                setTab('progression');
              }}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap ${
                tab === 'progression'
                  ? 'bg-[#c084fc] text-[#05070a]'
                  : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
              }`}
            >
              Feats ({(state.equippedFeats || []).length})
            </button>
            <button
              data-tab-active={tab === 'world' ? 'true' : 'false'}
              onClick={() => {
                soundSystem.playMenuBeep();
                setTab('world');
              }}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap ${
                tab === 'world'
                  ? 'bg-[#22d3ee] text-[#05070a]'
                  : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
              }`}
            >
              Map
            </button>
            <button
              data-tab-active={tab === 'codex' ? 'true' : 'false'}
              onClick={() => {
                soundSystem.playMenuBeep();
                setTab('codex');
              }}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap ${
                tab === 'codex'
                  ? 'bg-[#50fa7b] text-[#05070a]'
                  : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
              }`}
            >
              Codex
            </button>
          </div>

          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              onResume();
            }}
            className="px-2.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] text-[10px] font-bold rounded-xs border border-[#334155] shrink-0 cursor-pointer whitespace-nowrap"
          >
            Close [Select]
          </button>
        </div>

        {/* Row 2: Dedicated Pilot Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-0.5 bg-[#090d14] border border-[#1e293b] rounded-xs text-[9px] text-[#94a3b8] tabular-nums">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="text-[#f8fafc] font-bold truncate">{state.pilotName}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#7dd3fc] truncate">
              {trait.name} ({trait.frameModel || 'PNSY W416'})
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#fde047] font-bold">Lv.{state.level}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`font-bold ${
                loadMetrics.loadBracket === 'light'
                  ? 'text-[#86efac]'
                  : loadMetrics.loadBracket === 'medium'
                    ? 'text-[#7dd3fc]'
                    : loadMetrics.loadBracket === 'heavy'
                      ? 'text-[#fde047]'
                      : 'text-[#fca5a5]'
              }`}
            >
              Load {loadMetrics.equippedWeight}/{loadMetrics.maxCapacity} WT ({loadMetrics.loadPct}% ·{' '}
              {loadMetrics.loadBracket.toUpperCase()})
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-[#4ade80] font-bold">
              <SpriteCanvasIcon
                base64={GEMSTONE_REGISTRY.moonstone.iconBase64}
                sizeClass="w-2.5 h-2.5"
              />
              {totalInvGems} Gems
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-[#ffd27d] font-bold">
              <SpriteCanvasIcon
                base64={getCoinPickupSpriteBase64(state.salvageScrap || 1)}
                sizeClass="w-2.5 h-2.5"
              />
              {state.salvageScrap} Scrap
            </span>
          </div>
        </div>
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
          {/* Compact 1-Row Sub-Mode Bar inside Consolidated LOADOUT Tab */}
          <div className="flex items-center justify-between gap-2 px-1.5 py-1 bg-[#090d14] rounded-xs border border-[#1e293b] shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setLoadoutSubMode('slots');
                }}
                className={`px-2.5 py-0.5 rounded-xs text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  loadoutSubMode === 'slots'
                    ? 'bg-[#ffd27d] text-[#05070a]'
                    : 'bg-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                Equipped Slots
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setLoadoutSubMode('armory');
                }}
                className={`px-2.5 py-0.5 rounded-xs text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  loadoutSubMode === 'armory'
                    ? 'bg-[#fb923c] text-[#05070a]'
                    : 'bg-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                Armory Workbench
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setLoadoutSubMode('inventory');
                }}
                className={`px-2.5 py-0.5 rounded-xs text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  loadoutSubMode === 'inventory'
                    ? 'bg-[#8dd7ad] text-[#05070a]'
                    : 'bg-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                Cargo Inventory
              </button>
            </div>
            <span className="text-[9px] text-[#64748b] tabular-nums hidden sm:inline">
              {trait.name} · {loadMetrics.loadBracket.toUpperCase()} LOAD
            </span>
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


