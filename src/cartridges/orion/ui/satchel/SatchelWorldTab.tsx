/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  convertBogRoomPosToUnifiedPx,
  getUnifiedBogRoomPlacement,
  SUNKEN_BOG_EXPANSE_ROOM_ID,
} from '../../constants';
import {
  AREA_REGISTRY,
  getBiomeDefinition,
  U00_UNIVERSE_CATALOG,
  WAYGATE_REGISTRY,
  WAYSTATION_REGISTRY,
} from '../../database/world';
import {
  fastTravelViaWaygate,
  formatOrionLoreLabel,
  getActiveAetherNode,
  getOrionGraphicsSettings,
  getOrionRoomsRef,
  getRoomWorldInfo,
  hasPoeLanternGuidance,
  notifyOrionStateChange,
  resetAetherFogGraph,
  syncRoomHierarchyState,
  transitionViaAetherDoor,
  updateChunkedRoomStreaming,
} from '../../systems';
import {
  AetherCardinalDir,
  OrionState,
  UniverseWorldDefinition,
  UniverseWorldTier,
  WorldMapAccessMode,
} from '../../types';
import { AetherCosmosCanvas } from './AetherCosmosCanvas';
import { LocalMiniMapCanvas } from './LocalMiniMapCanvas';
import { PlanetMapModalView } from './PlanetMapModalView';

/**
 * Props for `SatchelWorldTab` (Context-routed Cartography panel: Local Mini-Map on `[SELECT]` Menu, Planet Map at Campfires, and Æther Map at Waygates).
 * Supports both Full Tactical and Compact Retro React HUD modes when rendered inside the Pilot Satchel, Pause Menu, or Campfire/Waygate modal.
 */
export interface SatchelWorldTabProps {
  state: OrionState;
  isCheatMode: boolean;
  onResume: () => void;
  /** Optional explicit access mode (`'menu'` | `'campfire'` | `'waygate'`). */
  accessMode?: WorldMapAccessMode;
}

/**
 * Pure helper that checks whether a room's world label string (for example `"Belldor (Camelot)"`)
 * matches a canonical `UniverseWorldDefinition` entry in `U00_UNIVERSE_CATALOG`.
 */
export function doesWorldStringMatchDef(
  worldStr: string | undefined,
  worldDef: UniverseWorldDefinition
): boolean {
  if (!worldStr) return worldDef.id === 'world_belldor';
  const norm = worldStr.trim().toLowerCase();
  const target = worldDef.name.trim().toLowerCase();
  const sub = (worldDef.subtitle || '').trim().toLowerCase();
  if (norm === target) return true;
  if (norm.startsWith(`${target} (`)) return true;
  if (sub && norm.includes(`(${sub})`)) return true;
  return false;
}

const BOG_LOCAL_WAYGATE_STOPS = [
  {
    id: 'wg_bog_drop_crater',
    name: 'Drop-Pod Impact Crater Waygate',
    room: '-3,0',
    localX: 136,
    localY: 84,
    areaName: 'M00 The Bog (West Crater)',
  },
  {
    id: 'wg_bog_first_campfire',
    name: 'First Campfire Sanctuary Conduit',
    room: '0,0',
    localX: 128,
    localY: 88,
    areaName: 'M00 The Bog (Central Clearing)',
  },
  {
    id: 'wg_bog_poe_lantern',
    name: 'Poe Lantern Clearing Conduit',
    room: '0,-2',
    localX: 128,
    localY: 88,
    areaName: 'M00 The Bog (Northern Branch)',
  },
  {
    id: 'wg_bog_exit_gate',
    name: 'Main Bog Perimeter Gate Conduit',
    room: '3,0',
    localX: 120,
    localY: 96,
    areaName: 'M00 The Bog (Eastern Gate)',
  },
];

/**
 * Routes cartography rendering by access context:
 * - `'menu'` (`[SELECT]` screen `MAP` tab & Pause Menu): renders the progressive, tile-accurate `LocalMiniMapCanvas`.
 * - `'campfire'` (Campfire interaction modal): renders the planetary overland `PlanetMapModalView` for within-planet campfire travel.
 * - `'waygate'` (Colossal Waygate interaction modal): renders the cosmic `u00` Æther Map orb and inter-world / local Waygate transit network.
 * Supports both HUD modes and mutates `state: OrionState` when fast traveling or warping in `-4,0` sandbox mode.
 */
export const SatchelWorldTab: React.FC<SatchelWorldTabProps> = ({
  state,
  isCheatMode,
  onResume,
  accessMode: propAccessMode,
}) => {
  const worldInfo = getRoomWorldInfo(state);
  const activeBiome = getBiomeDefinition(state.biomeId);
  const rooms = getOrionRoomsRef();
  const devMode = getOrionGraphicsSettings().devModeEnabled;

  // Resolve current world definition from player's active region/area
  const currentWorldDef =
    U00_UNIVERSE_CATALOG.find((w) => doesWorldStringMatchDef(worldInfo.worldName, w)) ||
    U00_UNIVERSE_CATALOG[0];

  const [selectedWorldId, setSelectedWorldId] = useState<string>(currentWorldDef.id);
  const [showCoordOverlay, setShowCoordOverlay] = useState<boolean>(false);
  const [tierFilter, setTierFilter] = useState<'all' | UniverseWorldTier>('all');
  const [cheatAuthorityOverride, setCheatAuthorityOverride] =
    useState<WorldMapAccessMode | null>(null);

  const baseAccessMode: WorldMapAccessMode =
    propAccessMode && propAccessMode !== 'none'
      ? propAccessMode
      : state.worldMapModalMode && state.worldMapModalMode !== 'none'
        ? state.worldMapModalMode
        : 'menu';

  const effectiveAccessMode: WorldMapAccessMode =
    cheatAuthorityOverride || baseAccessMode;

  const selectedWorld =
    U00_UNIVERSE_CATALOG.find((w) => w.id === selectedWorldId) || currentWorldDef;
  const isSelectedCurrentWorld = selectedWorld.id === currentWorldDef.id;
  const discoveredWg = state.discoveredWaygates || [];

  // Filter Colossal Waygates belonging to the selected World
  const worldWaygates = Object.values(WAYGATE_REGISTRY).filter((wg) =>
    doesWorldStringMatchDef(wg.world, selectedWorld)
  );

  const canFastTravelInterWorld = effectiveAccessMode === 'waygate';

  const handleBogConduitTransit = (stop: (typeof BOG_LOCAL_WAYGATE_STOPS)[number]) => {
    if (!rooms || !canFastTravelInterWorld) {
      soundSystem.playMenuBeep();
      return;
    }
    const placement = getUnifiedBogRoomPlacement(stop.room);
    if (!placement) return;
    const unifiedPos = convertBogRoomPosToUnifiedPx(
      stop.room,
      stop.localX,
      stop.localY,
      stop.room === '3,0' ? 20 : 16,
      stop.room === '3,0' ? 15 : 12
    );

    resetAetherFogGraph(rooms, state);
    state.frame.integrity = state.frame.maxIntegrity || 200;
    state.frame.state = 'Operational';
    state.armor.durability = state.armor.maxDurability;
    state.shields.capacity = state.shields.maxCapacity;
    state.shields.overloaded = false;
    state.heat = 0;

    state.room = SUNKEN_BOG_EXPANSE_ROOM_ID;
    state.rx = placement.rx;
    state.ry = placement.ry;
    state.x = unifiedPos.x;
    state.y = unifiedPos.y;
    state.z = 0;
    state.vz = 0;
    state.vx = 0;
    state.vy = 0;
    state.projectiles = [];
    state.pickups = [];
    state.flickerTimer = 0.5;
    state.spawnGraceTimer = 3.0;
    state.worldMapModalMode = 'none';

    syncRoomHierarchyState(state);
    updateChunkedRoomStreaming(rooms, state, true);
    soundSystem.playPowerup();
    state.toastText = `WAYGATE TRANSIT -> ${stop.name.toUpperCase()}`;
    state.toastTimer = 2.8;
    notifyOrionStateChange();
    onResume();
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-[10px] select-none">
      {/* Developer Sandbox Mode Switcher (only shown when devMode && isCheatMode) */}
      {devMode && isCheatMode && (
        <div className="p-1.5 bg-[#0b101d] rounded-xs border border-[#334155] flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-[8px] font-bold text-[#94a3b8]">
            DEV CARTOGRAPHY VIEW OVERRIDE:
          </span>
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'menu', label: 'LOCAL MINI-MAP (SELECT)' },
                { id: 'campfire', label: 'PLANET MAP (CAMPFIRE)' },
                { id: 'waygate', label: 'ÆTHER MAP (WAYGATE)' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setCheatAuthorityOverride(m.id);
                }}
                className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                  effectiveAccessMode === m.id
                    ? 'bg-[#2563eb] text-white border-[#93c5fd]'
                    : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                }`}
              >
                {m.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                state.discoveredWaystations = Object.keys(WAYSTATION_REGISTRY);
                state.discoveredWaygates = Object.keys(WAYGATE_REGISTRY);
                state.flags = state.flags || {};
                state.flags.campfire_unlocked = true;
                state.flags.first_campfire_lit = true;
                soundSystem.playPowerup();
                notifyOrionStateChange();
              }}
              className="px-1.5 py-0.5 bg-[#164e63] hover:bg-[#0e7490] text-[#e0f2fe] border border-[#22d3ee]/60 rounded-xs font-bold text-[7.5px] cursor-pointer"
            >
              ATTUNE ALL
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: [SELECT] SCREEN LOCAL MINI-MAP (Progressive Tile-Accurate Exploration Map) */}
      {effectiveAccessMode === 'menu' && <LocalMiniMapCanvas state={state} />}

      {/* VIEW 2: CAMPFIRE PLANET MAP (Current Planet Overland Regions, Areas & Within-Planet Campfire Travel) */}
      {effectiveAccessMode === 'campfire' && (
        <PlanetMapModalView
          state={state}
          isCheatMode={isCheatMode}
          onResume={onResume}
        />
      )}

      {/* VIEW 3: WAYGATE ÆTHER MAP (Cosmic Æther Sea Orb & Inter-World Colossal Waygate Network) */}
      {effectiveAccessMode === 'waygate' && (
        <>
          {/* 1. ÆTHER MAP HEADER & CURRENT WORLD SUMMARY */}
          <div className="p-2 bg-[#0b101d] rounded-xs border border-[#c084fc]/50 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-[#f3e8ff] text-[10.5px] tracking-wider">
                  ÆTHER MAP — COSMIC WAYGATE TRANSIT NETWORK
                </span>
                <span className="text-[#64748b]">·</span>
                <span className="text-[#67e8f9] font-bold text-[9px]">
                  Inter-World & Local Waygate Authority Active
                </span>
              </div>
              <span className="text-[8px] text-[#c084fc] font-bold">
                Current World: {currentWorldDef.name}
              </span>
            </div>
          </div>

          {/* 2. TWO-COLUMN COSMIC ÆTHER ORB & SELECTED WORLD WAYGATES */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
            {/* LEFT COLUMN (5 cols): COSMIC ÆTHER MAP ORB */}
            <div className="md:col-span-5 p-2 bg-[#090812] rounded-xs border border-[#3b2154] flex flex-col items-center space-y-1.5">
              <div className="w-full flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  {(
                    [
                      { id: 'all', label: 'ALL' },
                      { id: 'major', label: 'MAJOR (1-8)' },
                      { id: 'minor', label: 'MINOR (1-7)' },
                      { id: 'unstable', label: 'DRIFT' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        soundSystem.playMenuBeep();
                        setTierFilter(tab.id);
                      }}
                      className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                        tierFilter === tab.id
                          ? 'bg-[#581c87] text-[#f3e8ff] border-[#c084fc]'
                          : 'bg-[#130f24] text-[#94a3b8] border-[#2e1f47] hover:border-[#7e22ce]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {devMode && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setShowCoordOverlay((prev) => !prev);
                    }}
                    className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                      showCoordOverlay
                        ? 'bg-[#7f1d1d] text-[#fecaca] border-[#f87171]'
                        : 'bg-[#130f24] text-[#cbd5e1] border-[#3b2154] hover:border-[#a855f7]'
                    }`}
                  >
                    {showCoordOverlay ? '▣ ALIGNMENT: ON' : '▢ ALIGNMENT'}
                  </button>
                )}
              </div>

              <AetherCosmosCanvas
                selectedWorldId={selectedWorld.id}
                currentWorldId={currentWorldDef.id}
                tierFilter={tierFilter}
                showAlignmentGrid={devMode && showCoordOverlay}
                onSelectWorld={(id) => {
                  soundSystem.playSelect();
                  setSelectedWorldId(id);
                }}
              />

              <div className="w-full text-[7.5px] text-[#cbd5e1] flex items-center justify-between px-1">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full border border-[#c084fc] bg-[#1e1b4b]" />
                  Major Worlds
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full border border-[#38bdf8] bg-[#0f172a]" />
                  Minor Worlds
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 border border-[#f87171] bg-[#1f1224] rotate-45" />
                  Æther Drift
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN (7 cols): SELECTED WORLD COLOSSAL WAYGATES & CONDUITS */}
            <div className="md:col-span-7 p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
              <div className="p-2 bg-[#0f172a] rounded-xs border border-[#334155] space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-[#ffd27d] uppercase">
                      {selectedWorld.name}
                      {selectedWorld.subtitle ? ` (${selectedWorld.subtitle})` : ''}
                    </span>
                    <span className="text-[7.5px] text-[#c084fc] font-bold uppercase">
                      · {selectedWorld.tier} World
                    </span>
                    {isSelectedCurrentWorld && (
                      <span className="text-[7.5px] text-[#67e8f9] font-bold">
                        · ★ Current World
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[8.5px] text-[#94a3b8]">
                  Theme: <strong className="text-[#e2e8f0]">{selectedWorld.theme}</strong> · Origin:{' '}
                  <strong className="text-[#cbd5e1]">{selectedWorld.origin.toUpperCase()}</strong>
                </div>
                <div className="text-[8.5px] text-[#cbd5e1] leading-snug">
                  {selectedWorld.lore}
                </div>
              </div>

              {/* COLOSSAL WAYGATES (WORLD-TO-WORLD & CONDUIT TRANSIT) */}
              <div className="p-2 bg-[#0b111e] rounded-xs border border-[#1e293b] space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[#67e8f9] text-[9.5px]">
                    COLOSSAL WAYGATES IN {selectedWorld.name.toUpperCase()}
                  </span>
                  <span className="text-[7.5px] text-[#38bdf8]">
                    Waygate Authority Active
                  </span>
                </div>

                {worldWaygates.length === 0 && selectedWorld.id !== 'world_belldor' ? (
                  <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] text-[#94a3b8] text-[8.5px]">
                    No Colossal Waygate conduits unlocked in {selectedWorld.name}.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {worldWaygates.map((wg) => {
                      const wgArea = AREA_REGISTRY[wg.areaId];
                      const isUndefinedSpec = wgArea?.specStatus === 'UNDEFINED';
                      const isDiscovered =
                        discoveredWg.includes(wg.id) ||
                        effectiveAccessMode === 'waygate' ||
                        isCheatMode;
                      const isHere = state.room === wg.room;
                      const canTransit =
                        Boolean(rooms) &&
                        isDiscovered &&
                        !isUndefinedSpec &&
                        canFastTravelInterWorld &&
                        !isHere;

                      let wgButtonLabel = 'WAYGATE TRANSIT';
                      if (isUndefinedSpec) {
                        wgButtonLabel = 'SEALED';
                      } else if (isHere) {
                        wgButtonLabel = 'AT WAYGATE';
                      } else if (!isDiscovered) {
                        wgButtonLabel = 'UNDISCOVERED';
                      }

                      return (
                        <div
                          key={wg.id}
                          className="p-1.5 bg-[#090d16] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[#e0f2fe] text-[9.5px] truncate">
                              {formatOrionLoreLabel(wg.name, devMode)}
                            </div>
                            <div className="text-[8px] text-[#94a3b8] truncate">
                              {wg.world} · {wg.desyncStatus}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!canTransit}
                            onClick={() => {
                              if (!rooms || !canTransit) return;
                              if (fastTravelViaWaygate(rooms, state, wg.id)) {
                                state.worldMapModalMode = 'none';
                                onResume();
                              }
                            }}
                            className={`px-2 py-1 rounded-xs font-bold text-[8px] shrink-0 ${
                              canTransit
                                ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white border border-[#38bdf8] cursor-pointer'
                                : isUndefinedSpec
                                  ? 'bg-[#451a03] text-[#fcd34d] border border-[#b45309] cursor-not-allowed'
                                  : isHere
                                    ? 'bg-[#164e63] text-[#67e8f9] border border-[#22d3ee] cursor-default'
                                    : 'bg-[#1e293b] text-[#64748b] border border-[#334155] cursor-not-allowed'
                            }`}
                          >
                            {wgButtonLabel}
                          </button>
                        </div>
                      );
                    })}

                    {/* Local Bog Waygate Conduits inside Belldor */}
                    {selectedWorld.id === 'world_belldor' && (
                      <div className="pt-1 border-t border-[#1e293b] space-y-1">
                        <div className="text-[8px] font-bold text-[#7dd3fc]">
                          LOCAL BELLDOR WAYGATE CONDUITS (THE SUNKEN BOG):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {BOG_LOCAL_WAYGATE_STOPS.map((stop) => (
                            <div
                              key={stop.id}
                              className="p-1.5 bg-[#090d16] rounded-xs border border-[#1e293b] flex items-center justify-between gap-1.5"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-[#bae6fd] text-[8.5px] truncate">
                                  {formatOrionLoreLabel(stop.name, devMode)}
                                </div>
                                <div className="text-[7.5px] text-[#94a3b8] truncate">
                                  {formatOrionLoreLabel(stop.areaName, devMode)}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleBogConduitTransit(stop)}
                                className="px-1.5 py-0.5 rounded-xs font-bold text-[7.5px] shrink-0 bg-[#0284c7] hover:bg-[#0369a1] text-white border border-[#38bdf8] cursor-pointer"
                              >
                                TRANSIT
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. QUICK WORLD SELECTOR STRIP (All 20 Worlds in Catalog) */}
          <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1">
            <div className="text-[8.5px] font-bold text-[#94a3b8] flex items-center justify-between">
              <span>COSMIC WORLD ARCHIVE — SELECT ANY WORLD IN THE ÆTHER SEA</span>
              <span className="text-[#c084fc]">
                8 Major · 7 Minor · 5 Unstable Drift Worlds
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1">
              {U00_UNIVERSE_CATALOG.filter(
                (w) => tierFilter === 'all' || w.tier === tierFilter
              ).map((w) => {
                const isSel = w.id === selectedWorld.id;
                const isCur = w.id === currentWorldDef.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setSelectedWorldId(w.id);
                    }}
                    className={`p-1 rounded-xs border text-left cursor-pointer transition-colors flex items-center justify-between gap-1 ${
                      isSel
                        ? 'bg-[#1e1b4b] border-[#facc15] text-white'
                        : isCur
                          ? 'bg-[#083344]/60 border-[#22d3ee] text-[#e0f2fe]'
                          : 'bg-[#0f172a] border-[#1e293b] text-[#cbd5e1] hover:border-[#475569]'
                    }`}
                  >
                    <span className="truncate font-bold text-[8.5px]">{w.name}</span>
                    <span className="text-[7px] text-[#94a3b8] uppercase font-bold shrink-0">
                      {w.tier === 'major' ? 'MAJ' : w.tier === 'minor' ? 'MIN' : 'DRF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 4. CHEAT / SANDBOX ROOM DIAGNOSTICS: ÆTHER FOG TOPOLOGY (Gated behind Developer Mode) */}
      {devMode &&
        isCheatMode &&
        (() => {
          const activeNode = getActiveAetherNode(state);
          const hasLantern = hasPoeLanternGuidance(state);
          const totalGenerated = Object.keys(state.fogGraph?.nodes || {}).filter((k) =>
            k.startsWith('fog:')
          ).length;
          const dirs: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];

          return (
            <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#38bdf8] text-[9.5px]">
                  TRAINING SANDBOX — ÆTHER FOG 5-NODE TOPOLOGY & STEP TELEPORTER
                </span>
                <button
                  disabled={!rooms}
                  onClick={() => {
                    if (!rooms) return;
                    soundSystem.playSelect();
                    resetAetherFogGraph(rooms, state);
                  }}
                  className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#7dd3fc] border border-[#38bdf8]/40 rounded-xs font-bold text-[8px] cursor-pointer shrink-0"
                >
                  RESET FOG GRAPH (SEED #{state.fogGraph?.seed || 104729})
                </button>
              </div>

              <div className="text-[8px] text-[#cbd5e1] flex flex-wrap items-center gap-2">
                <span>
                  Node: <strong className="text-[#fbbf24]">{activeNode.nodeType.toUpperCase()}</strong>
                </span>
                <span>·</span>
                <span>
                  Wayfinding: <strong>{hasLantern ? 'POE LANTERN LIT' : '1-2PX SHIMMER'}</strong> ({totalGenerated} gen)
                </span>
                <span>·</span>
                <span>
                  Corrosive Water:{' '}
                  <strong>
                    {activeBiome.tileRules.corrosiveWater
                      ? `YES (${activeBiome.tileRules.corrosiveDamagePerSec}/s)`
                      : 'NO'}
                  </strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                <span className="text-[8px] text-[#94a3b8]">
                  Drop-Pod → First Campfire → Poe Lantern / Main Bog Gate
                </span>
                <div className="flex items-center gap-1">
                  {dirs.map((d) => {
                    const isTrue = activeNode.trueExitDir === d;
                    const isBlockedEnd =
                      activeNode.nodeType === 'end' && activeNode.returnDir !== d;
                    return (
                      <button
                        key={d}
                        disabled={!rooms || isBlockedEnd}
                        onClick={() => {
                          if (!rooms || isBlockedEnd) return;
                          if (transitionViaAetherDoor(rooms, state, d)) {
                            onResume();
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded-xs font-bold text-[8px] cursor-pointer ${
                          isBlockedEnd
                            ? 'bg-[#0f172a] text-[#475569] border border-[#1e293b] cursor-not-allowed'
                            : isTrue
                              ? 'bg-[#0c4a6e] hover:bg-[#075985] text-[#7dd3fc] border border-[#38bdf8]'
                              : 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] border border-[#475569]'
                        }`}
                      >
                        STEP {d} {isTrue ? '★' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};
