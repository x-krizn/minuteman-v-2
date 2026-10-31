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
 * Renders the 6-tab Pilot Satchel (`MECH STATUS`, `LOADOUT & STANCE`, `3-LAYER BUILD`,
 * `INVENTORY`, `WORLD MAP`, and `CODEX`). Supports both HUD modes and mutates `state: OrionState`
 * through its child tab components when equipping hardware, socketing feats, or using items.
 */
export const OrionSatchel: React.FC<OrionSatchelProps> = ({ onResume }) => {
  const [tab, setTab] = useState<
    'status' | 'weapons' | 'inventory' | 'world' | 'progression' | 'codex'
  >('status');
  const [isEditingLoadout, setIsEditingLoadout] = useState(false);
  const [editingSlot, setEditingSlot] = useState<EditableLoadoutSlot>('slot1');
  const [loadoutSubtypeFilter, setLoadoutSubtypeFilter] = useState<string>('ALL');
  const [invCategory, setInvCategory] = useState<EquipmentInventoryCategory>('all');
  const [invSubtype, setInvSubtype] = useState<string>('ALL');
  const [featTierFilter, setFeatTierFilter] = useState<'ALL' | FeatTier>('ALL');
  const [featSynergyFilter, setFeatSynergyFilter] = useState<'ALL' | FeatSynergyCategory>('ALL');
  const [, setRefresh] = useState(0);

  const openSlotEditor = (slot: EditableLoadoutSlot) => {
    soundSystem.playSelect();
    setTab('weapons');
    setIsEditingLoadout(true);
    setEditingSlot(slot);
    setLoadoutSubtypeFilter('ALL');
  };

  useEffect(() => {
    return subscribeOrionStateChange(() => setRefresh((r) => r + 1));
  }, []);

  const state = getOrionStateRef();
  if (!state) return null;

  state.flags = state.flags || {};
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
  const isCheatMode = state.room === '-4,0' || Boolean(state.bypassProgressionGates);

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
    <div className="absolute inset-0 z-20 bg-[#05070a]/95 backdrop-blur-xs flex flex-col p-2.5 overflow-hidden text-[#e2e8f0] font-mono select-none">
      {/* Top Header & Tabs */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#1e293b]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('status');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'status'
                ? 'bg-[#38bdf8] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            MECH STATUS
          </button>
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('weapons');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'weapons'
                ? 'bg-[#ffd27d] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            LOADOUT
          </button>
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('inventory');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'inventory'
                ? 'bg-[#8dd7ad] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            SATCHEL
          </button>
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('world');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'world'
                ? 'bg-[#22d3ee] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            {isCheatMode ? 'WORLD MAP & DEV' : 'WORLD MAP'}
          </button>
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('progression');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'progression'
                ? 'bg-[#c084fc] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            {isCheatMode ? 'CHEAT & GEMS' : 'SKILLS & GEMS'}
          </button>
          <button
            onClick={() => {
              soundSystem.playMenuBeep();
              setTab('codex');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors shrink-0 ${
              tab === 'codex'
                ? 'bg-[#50fa7b] text-[#05070a]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b]'
            }`}
          >
            CODEX
          </button>
          {state.room === '-4,0' && (
            <span className="px-1.5 py-0.5 bg-[#4c1d95] text-[#f0abfc] border border-[#a855f7] rounded-xs text-[8.5px] font-black shrink-0">
              TRAINING [-4,0]
            </span>
          )}
        </div>

        <button
          onClick={() => {
            soundSystem.playMenuBeep();
            onResume();
          }}
          className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] text-[10px] font-bold rounded-xs border border-[#334155] shrink-0"
        >
          CLOSE [SELECT]
        </button>
      </div>

      {/* Currency Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 bg-[#090d14] rounded-xs border border-[#1e293b] mb-1.5 text-[10px]">
        <span>
          PILOT: <b className="text-[#38bdf8]">{state.pilotName}</b> (
          {trait.frameModel || 'PNSY W416'})
        </span>
        <span>
          REACTOR:{' '}
          <b className="text-[#c084fc]">{state.equipmentSlots?.reactorCore || state.reactor}</b>
        </span>
        <span className="flex items-center gap-1">
          <SpriteCanvasIcon
            base64={GEMSTONE_REGISTRY.moonstone.iconBase64}
            sizeClass="w-3.5 h-3.5"
          />
          GEMS: <b className="text-[#4ade80]">{totalInvGems} INV</b> ·{' '}
          <b className="text-[#7dd3fc]">{totalRetainedGems} SOCKETED</b>
        </span>
        <span className="flex items-center gap-1">
          <SpriteCanvasIcon
            base64={getCoinPickupSpriteBase64(state.salvageScrap || 1)}
            sizeClass="w-3.5 h-3.5"
          />
          COINS / SCRAP: <b className="text-[#ffd27d]">{state.salvageScrap}</b>
        </span>
      </div>

      {tab === 'status' && <SatchelStatusTab state={state} isCheatMode={isCheatMode} />}

      {tab === 'weapons' && (
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
          onOpenInventoryTab={() => setTab('inventory')}
        />
      )}

      {tab === 'inventory' && (
        <SatchelInventoryTab
          state={state}
          isCheatMode={isCheatMode}
          invCategory={invCategory}
          setInvCategory={setInvCategory}
          invSubtype={invSubtype}
          setInvSubtype={setInvSubtype}
          openSlotEditor={openSlotEditor}
          onOpenProgressionTab={() => setTab('progression')}
          handleUseItem={handleUseItem}
        />
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
