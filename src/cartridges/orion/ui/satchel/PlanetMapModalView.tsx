/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { SUNKEN_BOG_EXPANSE_ROOM_ID } from '../../constants';
import {
  AREA_REGISTRY,
  REGION_REGISTRY,
  U00_UNIVERSE_CATALOG,
  WAYSTATION_REGISTRY,
} from '../../database/world';
import {
  fastTravelToWaystation,
  formatOrionLoreLabel,
  getOrionGraphicsSettings,
  getOrionRoomsRef,
  getRoomWorldInfo,
  ORION_ROOM_METADATA,
} from '../../systems';
import { AreaWikiDefinition, OrionState, UniverseWorldDefinition } from '../../types';

/**
 * Props for `PlanetMapModalView` (Campfire-triggered Planet Map & Within-Planet Campfire Fast-Travel menu).
 * Supports both Full Tactical and Compact Retro React HUD modes. Mutates `state: OrionState` when fast traveling to an attuned campfire.
 * Wiring: Rendered by `SatchelWorldTab` in `src/cartridges/orion/ui/satchel/SatchelWorldTab.tsx` when `effectiveAccessMode === 'campfire'`.
 * Removal: Delete `src/cartridges/orion/ui/satchel/PlanetMapModalView.tsx` and remove its `<PlanetMapModalView />` branch in `SatchelWorldTab.tsx`.
 */
export interface PlanetMapModalViewProps {
  state: OrionState;
  isCheatMode: boolean;
  onResume: () => void;
}

function matchesPlanetDef(
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

/**
 * Renders the dedicated Planet Map menu opened from an in-world Campfire (`A` / Waystation).
 * Displays the active planet's regions, connected overland areas, and all planetary campfires for within-planet travel.
 * Supports both Full Tactical and Compact Retro React HUD modes and mutates `state: OrionState` when fast traveling.
 * Wiring: Imported by `src/cartridges/orion/ui/satchel/SatchelWorldTab.tsx`.
 * Removal: Delete this file and remove `<PlanetMapModalView />` from `SatchelWorldTab.tsx`.
 */
export const PlanetMapModalView: React.FC<PlanetMapModalViewProps> = ({
  state,
  isCheatMode,
  onResume,
}) => {
  const worldInfo = getRoomWorldInfo(state);
  const rooms = getOrionRoomsRef();
  const devMode = getOrionGraphicsSettings().devModeEnabled;

  const currentPlanet = useMemo(
    () =>
      U00_UNIVERSE_CATALOG.find((w) => matchesPlanetDef(worldInfo.worldName, w)) ||
      U00_UNIVERSE_CATALOG[0],
    [worldInfo.worldName]
  );

  const planetAreas = useMemo(() => {
    const list = Object.values(AREA_REGISTRY).filter(
      (a) => a.scope === 'local' && matchesPlanetDef(a.world, currentPlanet)
    );
    return list;
  }, [currentPlanet]);

  const planetRegions = useMemo(() => {
    return Object.values(REGION_REGISTRY).filter(
      (r) => r.scope === 'local' && matchesPlanetDef(r.world, currentPlanet)
    );
  }, [currentPlanet]);

  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    () => state.areaId || planetAreas[0]?.id || 'm00_the_bog'
  );

  const selectedArea: AreaWikiDefinition | undefined =
    AREA_REGISTRY[selectedAreaId] ||
    planetAreas.find((a) => a.id === state.areaId) ||
    planetAreas[0];

  const discoveredWs = (state.discoveredWaystations || []).filter(
    (id) => id !== 'ws_bog_drop_pod'
  );

  const planetCampfires = useMemo(() => {
    return Object.values(WAYSTATION_REGISTRY).filter((ws) => {
      if (ws.id === 'ws_bog_drop_pod') return false;
      const area = AREA_REGISTRY[ws.areaId];
      return matchesPlanetDef(area?.world, currentPlanet);
    });
  }, [currentPlanet]);

  return (
    <div className="space-y-2 text-[10px] select-none">
      {/* 1. PLANET MAP HEADER & CURRENT PLANET SUMMARY */}
      <div className="p-2 bg-[#0b101d] rounded-xs border border-[#f59e0b]/50 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-[#fef08a] text-[11px] tracking-wider">
              PLANET MAP — {currentPlanet.name.toUpperCase()}
              {currentPlanet.subtitle ? ` (${currentPlanet.subtitle.toUpperCase()})` : ''}
            </span>
            <span className="text-[#64748b]">·</span>
            <span className="text-[#cbd5e1] text-[9px]">{currentPlanet.theme}</span>
          </div>
          <span className="text-[9px] font-bold text-[#fde047]">
            Campfire Network · Within-Planet Travel
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <div className="p-1.5 bg-[#070a12] rounded-xs border border-[#1e293b]">
            <div className="text-[9px] text-[#94a3b8]">ACTIVE REGION</div>
            <div className="font-bold text-[#f8fafc] truncate">
              {formatOrionLoreLabel(worldInfo.regionName, devMode)}
            </div>
          </div>
          <div className="p-1.5 bg-[#070a12] rounded-xs border border-[#1e293b]">
            <div className="text-[9px] text-[#94a3b8]">CURRENT AREA</div>
            <div className="font-bold text-[#38bdf8] truncate">
              {formatOrionLoreLabel(worldInfo.areaName, devMode)}
            </div>
          </div>
          <div className="p-1.5 bg-[#070a12] rounded-xs border border-[#1e293b]">
            <div className="text-[9px] text-[#94a3b8]">ACTIVE HEARTH ANCHOR</div>
            <div className="font-bold text-[#ffd27d] truncate">
              {formatOrionLoreLabel(
                ORION_ROOM_METADATA[state.spawnAnchor?.room || '-3,0']?.title ||
                  'Drop-Pod Impact Crater',
                devMode
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN PLANETARY OVERLAND REGIONS & CAMPFIRE TRAVEL NETWORK */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
        {/* LEFT COLUMN (6 cols): PLANETARY REGIONS & OVERLAND AREA NODES */}
        <div className="md:col-span-6 p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#f8fafc] text-[10px]">
              OVERLAND REGIONS & TERRITORIES
            </span>
            <span className="text-[9px] text-[#94a3b8] tabular-nums">
              {planetRegions.length} Regions · {planetAreas.length} Areas
            </span>
          </div>

          {/* Interactive Overland Node Diagram by Region */}
          <div className="space-y-2">
            {planetRegions.map((reg) => {
              const regAreas = planetAreas.filter((a) => a.regionId === reg.id);
              const isCurrentRegion = state.regionId === reg.id;
              return (
                <div
                  key={reg.id}
                  className={`p-2 rounded-xs border space-y-1.5 ${
                    isCurrentRegion
                      ? 'bg-[#0c1424] border-[#38bdf8]/60'
                      : 'bg-[#070a12] border-[#1e293b]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-[10px] text-[#e2e8f0]">
                      {formatOrionLoreLabel(reg.name, devMode)}
                    </span>
                    <span className="text-[9px] text-[#94a3b8]">
                      {isCurrentRegion ? 'Current Region' : reg.culture}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {regAreas.map((area) => {
                      const isSel = selectedArea?.id === area.id;
                      const isHere = state.areaId === area.id;
                      const areaWs = area.waystation;
                      const hasCampfire =
                        Boolean(areaWs && areaWs.id !== 'ws_bog_drop_pod');
                      const isCampfireLit = Boolean(
                        areaWs && (discoveredWs.includes(areaWs.id) || isCheatMode)
                      );

                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => {
                            soundSystem.playSelect();
                            setSelectedAreaId(area.id);
                          }}
                          className={`p-1.5 rounded-xs border text-left cursor-pointer transition-colors space-y-0.5 ${
                            isSel
                              ? 'bg-[#1e293b] border-[#facc15] text-white'
                              : isHere
                                ? 'bg-[#083344]/60 border-[#22d3ee] text-[#e0f2fe]'
                                : 'bg-[#0b111e] border-[#1e293b] text-[#cbd5e1] hover:border-[#475569]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[9px] truncate">
                              {formatOrionLoreLabel(area.name, devMode)}
                            </span>
                            {isHere && (
                              <span className="text-[9px] text-[#67e8f9] font-bold shrink-0">
                                ★ HERE
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-[#94a3b8] flex items-center gap-1">
                            <span>
                              {hasCampfire
                                ? isCampfireLit
                                  ? 'Hearth Kindled'
                                  : 'Hearth Unkindled'
                                : 'No Hearth'}
                            </span>
                            <span>·</span>
                            <span className="truncate">{area.recommendedLevels}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Area Lore & Territorial Details */}
          {selectedArea && (
            <div className="p-2 bg-[#0f172a] rounded-xs border border-[#334155] space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-[10px] text-[#fde047]">
                  {formatOrionLoreLabel(selectedArea.name, devMode)}
                </span>
                <span className="text-[9px] text-[#94a3b8]">
                  {selectedArea.recommendedLevels}
                </span>
              </div>
              <div className="text-[9px] text-[#cbd5e1] leading-snug">
                {selectedArea.description}
              </div>
              {selectedArea.lore && (
                <div className="pt-1 border-t border-[#1e293b] text-[9px] text-[#94a3b8] leading-snug">
                  {selectedArea.lore}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (6 cols): PLANETARY CAMPFIRE FAST-TRAVEL LIST */}
        <div className="md:col-span-6 p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#fde047] text-[10px]">
              KINDLED CAMPFIRES IN {currentPlanet.name.toUpperCase()}
            </span>
            <span className="text-[9px] text-[#94a3b8] tabular-nums">
              {
                planetCampfires.filter(
                  (ws) => discoveredWs.includes(ws.id) || isCheatMode
                ).length
              }{' '}
              / {planetCampfires.length} Kindled
            </span>
          </div>

          <div className="text-[9px] text-[#94a3b8] leading-snug">
            Select any kindled hearth on {currentPlanet.name} to travel across the planet. Inter-world
            transit across the Æther Sea requires a Colossal Waygate.
          </div>

          {planetCampfires.length === 0 ? (
            <div className="p-2 bg-[#05070a] rounded-xs border border-[#1e293b] text-[#94a3b8] text-[9px]">
              No campfires charted on {currentPlanet.name}.
            </div>
          ) : (
            <div className="space-y-1.5">
              {planetCampfires.map((ws) => {
                const wsArea = AREA_REGISTRY[ws.areaId];
                const isUndefinedSpec = wsArea?.specStatus === 'UNDEFINED';
                const isDiscovered = discoveredWs.includes(ws.id) || isCheatMode;
                const isHere =
                  state.room === ws.room ||
                  (state.room === SUNKEN_BOG_EXPANSE_ROOM_ID &&
                    ws.room === '0,0' &&
                    state.rx === 0 &&
                    state.ry === 0);

                const canTravel =
                  Boolean(rooms) && isDiscovered && !isUndefinedSpec && !isHere;

                let buttonLabel = 'TRAVEL TO HEARTH';
                if (isUndefinedSpec) {
                  buttonLabel = 'FOG SEALED';
                } else if (!isDiscovered) {
                  buttonLabel = 'UNKINDLED';
                } else if (isHere) {
                  buttonLabel = 'AT THIS HEARTH';
                }

                return (
                  <div
                    key={ws.id}
                    className={`p-2 rounded-xs border flex items-center justify-between gap-2 ${
                      isHere
                        ? 'bg-[#1c1408] border-[#f59e0b]'
                        : isDiscovered
                          ? 'bg-[#0b111e] border-[#334155]'
                          : 'bg-[#070a12] border-[#1e293b] opacity-75'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-bold text-[#fef08a] text-[10px] truncate">
                        {formatOrionLoreLabel(ws.name, devMode)}
                      </div>
                      <div className="text-[9px] text-[#94a3b8] truncate">
                        {formatOrionLoreLabel(wsArea?.name || ws.areaId, devMode)}
                        {' · '}
                        {isDiscovered ? 'Hearth Attuned' : 'Not Yet Kindled'}
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
                      className={`px-2.5 py-1 rounded-xs font-bold text-[9px] shrink-0 ${
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
      </div>
    </div>
  );
};
