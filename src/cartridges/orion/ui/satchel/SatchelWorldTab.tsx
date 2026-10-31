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
  fastTravelToWaystation,
  fastTravelViaWaygate,
  getActiveAetherNode,
  getOrionRoomsRef,
  getRoomWorldInfo,
  hasPoeLanternGuidance,
  notifyOrionStateChange,
  ORION_ROOM_METADATA,
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

/**
 * Props for `SatchelWorldTab` (`u00` Cosmic World Map & Fast Travel panel).
 * Supports both HUD modes when rendered inside the Pilot Satchel, Pause Menu, or Campfire/Waygate modal.
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
 * Renders the interactive `u00` Cosmic World Map orb (`worldMap_77ef03c9.png`) and coordinate grid
 * (`map-v0_84bf584d.png`) with 20 plotted worlds (`Major 1..8`, `Minor 1..7`, `Unstable/Drift 1..10`).
 * Enforces fast-travel authority by `accessMode` (`'menu'`: view-only; `'campfire'`: within-world
 * campfires only; `'waygate'`: world-to-world and within-world). Supports both HUD modes and mutates
 * `state: OrionState` when fast traveling or warping in `-4,0` sandbox mode.
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

  // Resolve current world definition from player's active region/area
  const currentWorldDef =
    U00_UNIVERSE_CATALOG.find((w) => doesWorldStringMatchDef(worldInfo.worldName, w)) ||
    U00_UNIVERSE_CATALOG[0];

  const [selectedWorldId, setSelectedWorldId] = useState<string>(currentWorldDef.id);
  const [showCoordOverlay, setShowCoordOverlay] = useState<boolean>(false);
  const [tierFilter, setTierFilter] = useState<'all' | UniverseWorldTier>('all');
  const [cheatAuthorityOverride, setCheatAuthorityOverride] =
    useState<WorldMapAccessMode | null>(null);

  // Determine effective fast-travel authority:
  // - 'menu': View-only cartography (cannot fast travel)
  // - 'campfire': Fast travel restricted to within the current world (Campfire to Campfire)
  // - 'waygate': Fast travel unlocked world-to-world and within world
  const baseAccessMode: WorldMapAccessMode =
    propAccessMode && propAccessMode !== 'none'
      ? propAccessMode
      : state.worldMapModalMode && state.worldMapModalMode !== 'none'
        ? state.worldMapModalMode
        : isCheatMode
          ? 'waygate'
          : 'menu';

  const effectiveAccessMode: WorldMapAccessMode =
    cheatAuthorityOverride || baseAccessMode;

  const selectedWorld =
    U00_UNIVERSE_CATALOG.find((w) => w.id === selectedWorldId) || currentWorldDef;
  const isSelectedCurrentWorld = selectedWorld.id === currentWorldDef.id;

  const discoveredWs = (state.discoveredWaystations || []).filter(
    (id) => id !== 'ws_bog_drop_pod'
  );
  const discoveredWg = state.discoveredWaygates || [];

  // Filter Campfires (Waystations) belonging to the selected World
  const worldCampfires = Object.values(WAYSTATION_REGISTRY).filter((ws) => {
    if (ws.id === 'ws_bog_drop_pod') return false;
    const area = AREA_REGISTRY[ws.areaId];
    return doesWorldStringMatchDef(area?.world, selectedWorld);
  });

  // Filter Colossal Waygates belonging to the selected World
  const worldWaygates = Object.values(WAYGATE_REGISTRY).filter((wg) =>
    doesWorldStringMatchDef(wg.world, selectedWorld)
  );

  // Fast-travel permission helpers enforcing the user's exact rules:
  // - Waygate: world-to-world and within world
  // - Campfire: within world only
  // - Menu: view-only
  const canFastTravelWithinWorld =
    effectiveAccessMode === 'campfire' || effectiveAccessMode === 'waygate';
  const canFastTravelInterWorld = effectiveAccessMode === 'waygate';

  const handleBogConduitTransit = (stop: (typeof BOG_LOCAL_WAYGATE_STOPS)[number]) => {
    if (!rooms) return;
    if (!canFastTravelInterWorld && !(canFastTravelWithinWorld && isSelectedCurrentWorld)) {
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
      {/* 1. ACCESS AUTHORITY & CURRENT LOCATION BANNER */}
      <div className="p-2 bg-[#0b101d] rounded-xs border border-[#38bdf8]/50 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[#f8fafc] text-[10.5px] tracking-wider">
              COSMIC WORLD MAP & ÆTHER TRANSIT
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-xs font-extrabold text-[8.5px] border ${
                effectiveAccessMode === 'waygate'
                  ? 'bg-[#083344] text-[#67e8f9] border-[#22d3ee]'
                  : effectiveAccessMode === 'campfire'
                    ? 'bg-[#422006] text-[#fde047] border-[#f59e0b]'
                    : 'bg-[#1e293b] text-[#cbd5e1] border-[#475569]'
              }`}
            >
              {effectiveAccessMode === 'waygate'
                ? '❖ WAYGATE ACCESS: WORLD-TO-WORLD & WITHIN WORLD'
                : effectiveAccessMode === 'campfire'
                  ? '🔥 CAMPFIRE ACCESS: WITHIN-WORLD FAST TRAVEL ONLY'
                  : '👁 MENU ACCESS: VIEW-ONLY CARTOGRAPHY'}
            </span>
          </div>

          {isCheatMode && (
            <div className="flex items-center gap-1">
              {(['menu', 'campfire', 'waygate'] as WorldMapAccessMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    setCheatAuthorityOverride(m);
                  }}
                  className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer uppercase ${
                    effectiveAccessMode === m
                      ? 'bg-[#2563eb] text-white border-[#93c5fd]'
                      : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                  }`}
                >
                  {m}
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
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          <div className="p-1 bg-[#070a12] rounded-xs border border-[#1e293b]">
            <div className="text-[7.5px] text-[#94a3b8]">CURRENT WORLD</div>
            <div className="font-bold text-[#c084fc] truncate">
              {currentWorldDef.name} ({currentWorldDef.tier.toUpperCase()} #{currentWorldDef.mapCoord.mapCode})
            </div>
          </div>
          <div className="p-1 bg-[#070a12] rounded-xs border border-[#1e293b]">
            <div className="text-[7.5px] text-[#94a3b8]">ACTIVE ZONE</div>
            <div className="font-bold text-[#38bdf8] truncate">{worldInfo.areaName}</div>
          </div>
          <div className="p-1 bg-[#070a12] rounded-xs border border-[#1e293b]">
            <div className="text-[7.5px] text-[#94a3b8]">SECTOR</div>
            <div className="font-bold text-[#86efac] truncate">{worldInfo.roomTitle}</div>
          </div>
          <div className="p-1 bg-[#070a12] rounded-xs border border-[#1e293b]">
            <div className="text-[7.5px] text-[#94a3b8]">SPAWN ANCHOR</div>
            <div className="font-bold text-[#ffd27d] truncate">
              {ORION_ROOM_METADATA[state.spawnAnchor?.room || '-3,0']?.title ||
                `Room [${state.spawnAnchor?.room || '-3,0'}]`}
            </div>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN COSMIC ORB & SELECTED WORLD LOCAL INSPECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
        {/* LEFT COLUMN (5 cols): COSMIC WORLD MAP ORB (worldMap_77ef03c9.png + map-v0_84bf584d.png) */}
        <div className="md:col-span-5 p-2 bg-[#090812] rounded-xs border border-[#3b2154] flex flex-col items-center space-y-1.5">
          {/* Filter & Coordinate Overlay Controls */}
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
              title="Toggle canonical alignment rings & reference coordinate labels"
            >
              {showCoordOverlay ? '▣ ALIGNMENT: ON' : '▢ ALIGNMENT'}
            </button>
          </div>

          {/* Interactive Living Æther Cosmic Viewport */}
          <AetherCosmosCanvas
            selectedWorldId={selectedWorld.id}
            currentWorldId={currentWorldDef.id}
            tierFilter={tierFilter}
            showAlignmentGrid={showCoordOverlay}
            onSelectWorld={(id) => {
              soundSystem.playSelect();
              setSelectedWorldId(id);
            }}
          />

          {/* Orb Legend */}
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

        {/* RIGHT COLUMN (7 cols): SELECTED WORLD LOCAL CAMPFIRES & WAYGATES */}
        <div className="md:col-span-7 p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
          {/* Selected World Header Card */}
          <div className="p-2 bg-[#0f172a] rounded-xs border border-[#334155] space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-[#ffd27d] uppercase">
                  {selectedWorld.name}
                  {selectedWorld.subtitle ? ` (${selectedWorld.subtitle})` : ''}
                </span>
                <span
                  className={`text-[7.5px] px-1.5 py-0.5 rounded-xs font-bold border uppercase ${
                    selectedWorld.tier === 'major'
                      ? 'bg-[#3b0764] text-[#e9d5ff] border-[#a855f7]'
                      : selectedWorld.tier === 'minor'
                        ? 'bg-[#0c4a6e] text-[#bae6fd] border-[#38bdf8]'
                        : 'bg-[#450a0a] text-[#fecaca] border-[#f87171]'
                  }`}
                >
                  {selectedWorld.tier} NODE #{selectedWorld.mapCoord.mapCode}
                </span>
                {isSelectedCurrentWorld && (
                  <span className="text-[7.5px] px-1.5 py-0.5 bg-[#083344] text-[#67e8f9] border border-[#22d3ee] rounded-xs font-bold">
                    ★ CURRENT WORLD
                  </span>
                )}
              </div>

              <span
                className={`text-[7.5px] px-1.5 py-0.5 rounded-xs font-bold border ${
                  selectedWorld.specStatus === 'LOCKED'
                    ? 'bg-[#052e16] text-[#86efac] border-[#22c55e]/50'
                    : 'bg-[#451a03] text-[#fcd34d] border-[#b45309]'
                }`}
              >
                {selectedWorld.specStatus === 'LOCKED'
                  ? 'ACTIVE ZONE DOCS'
                  : 'ÆTHER FOG SEALED (UNDEFINED)'}
              </span>
            </div>

            <div className="text-[8.5px] text-[#94a3b8]">
              Theme: <strong className="text-[#e2e8f0]">{selectedWorld.theme}</strong> · Origin:{' '}
              <strong className="text-[#cbd5e1]">{selectedWorld.origin.toUpperCase()}</strong> ·
              Coord:{' '}
              <strong className="text-[#7dd3fc]">
                [{selectedWorld.mapCoord.xPct.toFixed(0)}%, {selectedWorld.mapCoord.yPct.toFixed(0)}%]
              </strong>
            </div>
            <div className="text-[8.5px] text-[#cbd5e1] leading-snug">{selectedWorld.lore}</div>
          </div>

          {/* SECTION A: LOCAL CAMPFIRES / WAYSTATIONS (WITHIN-WORLD FAST TRAVEL) */}
          <div className="p-2 bg-[#0b111e] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-[#fde047] text-[9.5px]">
                🔥 LOCAL CAMPFIRES & WAYSTATIONS IN {selectedWorld.name.toUpperCase()}
              </span>
              <span className="text-[7.5px] text-[#94a3b8]">
                Campfire = Within-World · Waygate = Any
              </span>
            </div>

            {worldCampfires.length === 0 ? (
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] text-[#94a3b8] text-[8.5px] italic">
                No local campfires charted in {selectedWorld.name} yet ({selectedWorld.specStatus}).
              </div>
            ) : (
              <div className="space-y-1">
                {worldCampfires.map((ws) => {
                  const wsArea = AREA_REGISTRY[ws.areaId];
                  const isUndefinedSpec = wsArea?.specStatus === 'UNDEFINED';
                  const isDiscovered = discoveredWs.includes(ws.id) || isCheatMode;
                  const isHere =
                    state.room === ws.room ||
                    (state.room === SUNKEN_BOG_EXPANSE_ROOM_ID &&
                      ws.room === '0,0' &&
                      state.rx === 0 &&
                      state.ry === 0);

                  // Campfire fast travel rule:
                  // - Allowed if effectiveAccessMode === 'campfire' AND within current world
                  // - Allowed if effectiveAccessMode === 'waygate' (within world or world-to-world)
                  const hasAuthority =
                    effectiveAccessMode === 'waygate' ||
                    (effectiveAccessMode === 'campfire' && isSelectedCurrentWorld);

                  const canTravel =
                    Boolean(rooms) &&
                    isDiscovered &&
                    !isUndefinedSpec &&
                    hasAuthority &&
                    !isHere;

                  let buttonLabel = 'FAST TRAVEL';
                  if (isUndefinedSpec) {
                    buttonLabel = 'FOG SEALED';
                  } else if (!isDiscovered) {
                    buttonLabel = 'UNDISCOVERED';
                  } else if (isHere) {
                    buttonLabel = 'AT CAMPFIRE';
                  } else if (effectiveAccessMode === 'menu') {
                    buttonLabel = 'VIEW ONLY (MENU)';
                  } else if (!isSelectedCurrentWorld && effectiveAccessMode === 'campfire') {
                    buttonLabel = 'REQUIRES WAYGATE';
                  }

                  return (
                    <div
                      key={ws.id}
                      className="p-1.5 bg-[#090d16] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#fef08a] text-[9.5px] truncate">
                          {ws.name}
                        </div>
                        <div className="text-[8px] text-[#94a3b8] truncate">
                          {wsArea?.name || ws.areaId} · Sector [{ws.room}]
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canTravel}
                        onClick={() => {
                          if (!rooms || !canTravel) return;
                          if (fastTravelToWaystation(rooms, state, ws.id)) {
                            state.worldMapModalMode = 'none';
                            onResume();
                          }
                        }}
                        className={`px-2 py-1 rounded-xs font-bold text-[8px] shrink-0 ${
                          canTravel
                            ? 'bg-[#ca8a04] hover:bg-[#eab308] text-[#05070a] cursor-pointer'
                            : isHere
                              ? 'bg-[#422006] text-[#fde68a] border border-[#f59e0b] cursor-default'
                              : 'bg-[#1e293b] text-[#64748b] border border-[#334155] cursor-not-allowed'
                        }`}
                      >
                        {buttonLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: COLOSSAL WAYGATES (WORLD-TO-WORLD & WITHIN-WORLD TRANSIT) */}
          <div className="p-2 bg-[#0b111e] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-[#67e8f9] text-[9.5px]">
                ❖ WAYGATES IN {selectedWorld.name.toUpperCase()} (WORLD-TO-WORLD & LOCAL)
              </span>
              <span className="text-[7.5px] text-[#38bdf8]">
                {effectiveAccessMode === 'waygate'
                  ? 'Waygate Authority Active'
                  : 'Requires Waygate (Q)'}
              </span>
            </div>

            {worldWaygates.length === 0 && selectedWorld.id !== 'world_belldor' ? (
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] text-[#94a3b8] text-[8.5px] italic">
                No Colossal Waygate coordinates unlocked in {selectedWorld.name} ({selectedWorld.specStatus}).
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
                    wgButtonLabel = 'SEALED (UNDEFINED)';
                  } else if (isHere) {
                    wgButtonLabel = 'AT WAYGATE';
                  } else if (effectiveAccessMode === 'menu') {
                    wgButtonLabel = 'VIEW ONLY (MENU)';
                  } else if (effectiveAccessMode === 'campfire') {
                    wgButtonLabel = 'REQUIRES WAYGATE';
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
                          {wg.name}
                        </div>
                        <div className="text-[8px] text-[#94a3b8] truncate">
                          {wg.world} · Sector [{wg.room}] · {wg.desyncStatus}
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
                      LOCAL BELLDOR WAYGATE CONDUITS (M00 UNIFIED BOG SPINE):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {BOG_LOCAL_WAYGATE_STOPS.map((stop) => {
                        const canUseConduit = canFastTravelInterWorld;
                        return (
                          <div
                            key={stop.id}
                            className="p-1.5 bg-[#090d16] rounded-xs border border-[#1e293b] flex items-center justify-between gap-1.5"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[#bae6fd] text-[8.5px] truncate">
                                {stop.name}
                              </div>
                              <div className="text-[7.5px] text-[#94a3b8] truncate">
                                {stop.areaName} [{stop.room}]
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!canUseConduit}
                              onClick={() => handleBogConduitTransit(stop)}
                              className={`px-1.5 py-0.5 rounded-xs font-bold text-[7.5px] shrink-0 ${
                                canUseConduit
                                  ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white border border-[#38bdf8] cursor-pointer'
                                  : 'bg-[#1e293b] text-[#64748b] border border-[#334155] cursor-not-allowed'
                              }`}
                            >
                              {canUseConduit ? 'TRANSIT' : 'WAYGATE ONLY'}
                            </button>
                          </div>
                        );
                      })}
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
          <span>u00 UNIVERSE COORDINATE INDEX — CLICK ANY WORLD TO INSPECT LOCAL NODES</span>
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
                <span className="truncate font-bold text-[8.5px]">
                  {w.mapCoord.mapCode}. {w.name}
                </span>
                <span
                  className={`text-[7px] px-1 rounded-xs uppercase font-bold shrink-0 ${
                    w.tier === 'major'
                      ? 'bg-[#3b0764] text-[#e9d5ff]'
                      : w.tier === 'minor'
                        ? 'bg-[#0c4a6e] text-[#bae6fd]'
                        : 'bg-[#450a0a] text-[#fecaca]'
                  }`}
                >
                  {w.tier === 'major' ? 'MAJ' : w.tier === 'minor' ? 'MIN' : 'DRF'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CHEAT / SANDBOX ROOM DIAGNOSTICS: ÆTHER FOG TOPOLOGY */}
      {isCheatMode &&
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
                  TRAINING SANDBOX [-4,0] — ÆTHER FOG 5-NODE TOPOLOGY & STEP TELEPORTER
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
                  Drop Pod [-3,0] → First Campfire [0,0] (3) → Poe Lantern [0,-2] (5) / Main Bog [3,0] (6)
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
