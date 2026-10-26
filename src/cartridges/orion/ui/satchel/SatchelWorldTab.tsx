/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
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
  transitionViaAetherDoor,
} from '../../systems';
import { AetherCardinalDir, OrionState } from '../../types';

export interface SatchelWorldTabProps {
  state: OrionState;
  isCheatMode: boolean;
  onResume: () => void;
}

export const SatchelWorldTab: React.FC<SatchelWorldTabProps> = ({
  state,
  isCheatMode,
  onResume,
}) => {
  const worldInfo = getRoomWorldInfo(state);
  const activeBiome = getBiomeDefinition(state.biomeId);
  const rooms = getOrionRoomsRef();
  const discoveredWs = (state.discoveredWaystations || []).filter(
    (id) => id !== 'ws_bog_drop_pod'
  );
  const discoveredWg = state.discoveredWaygates || [];

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px]">
      {/* Current Location Summary */}
      <div className="p-2 bg-[#0f172a] rounded-xs border border-[#22d3ee]/50 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#22d3ee] text-[10px]">
            {isCheatMode
              ? 'ACTIVE 5-TIER NESTED WORLD HIERARCHY (CHEAT ROOM VIEW)'
              : 'CURRENT LOCATION & SPAWN ANCHOR'}
          </span>
          {isCheatMode && (
            <button
              onClick={() => {
                state.discoveredWaystations = Object.keys(WAYSTATION_REGISTRY);
                state.discoveredWaygates = Object.keys(WAYGATE_REGISTRY);
                soundSystem.playPowerup();
                notifyOrionStateChange();
              }}
              className="px-1.5 py-0.5 bg-[#164e63] hover:bg-[#0e7490] text-[#e0f2fe] border border-[#22d3ee]/60 rounded-xs font-bold text-[8px] cursor-pointer"
            >
              ATTUNE ALL CAMPFIRES & WAYGATES
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1">
          <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
            <div className="text-[8px] text-[#94a3b8]">ZONE</div>
            <div className="font-bold text-[#38bdf8] truncate">{worldInfo.areaName}</div>
          </div>
          <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
            <div className="text-[8px] text-[#94a3b8]">SECTOR</div>
            <div className="font-bold text-[#86efac] truncate">{worldInfo.roomTitle}</div>
          </div>
          <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
            <div className="text-[8px] text-[#94a3b8]">BIOME</div>
            <div className="font-bold text-[#c084fc] truncate">{worldInfo.biomeName}</div>
          </div>
          <div className="p-1 bg-[#090d14] rounded-xs border border-[#1e293b]">
            <div className="text-[8px] text-[#94a3b8]">SPAWN ANCHOR</div>
            <div className="font-bold text-[#ffd27d] truncate">
              {ORION_ROOM_METADATA[state.spawnAnchor?.room || '-3,0']?.title ||
                `Room [${state.spawnAnchor?.room || '-3,0'}]`}
            </div>
          </div>
        </div>
        {isCheatMode && (
          <div className="text-[8.5px] text-[#cbd5e1] pt-0.5 flex flex-wrap items-center gap-2">
            <span>
              BIOME RULES: Corrosive Water:{' '}
              <strong
                className={
                  activeBiome.tileRules.corrosiveWater ? 'text-[#84cc16]' : 'text-[#94a3b8]'
                }
              >
                {activeBiome.tileRules.corrosiveWater
                  ? `YES (${activeBiome.tileRules.corrosiveDamagePerSec}/s)`
                  : 'NO'}
              </strong>
            </span>
            <span>·</span>
            <span>
              Mud Speed: <strong>{Math.round(activeBiome.tileRules.mudSlowMultiplier * 100)}%</strong>
            </span>
            <span>·</span>
            <span>
              Desync Cadence: <strong>{activeBiome.tileRules.desyncPeriodSec}s</strong>
            </span>
          </div>
        )}
      </div>

      {/* Discovered Campfires (Waystation Fast Travel — Spawn Moves with Campfires) */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#ffd27d] text-[10px]">
            CAMPFIRE WAYSTATIONS (A) — RESPAWN & FAST TRAVEL
          </span>
          <span className="text-[8px] text-[#94a3b8]">
            Resting at a campfire moves your spawn anchor
          </span>
        </div>
        {(() => {
          const visibleWaystations = Object.values(WAYSTATION_REGISTRY).filter(
            (ws) => isCheatMode || discoveredWs.includes(ws.id)
          );
          if (visibleWaystations.length === 0) {
            return (
              <div className="p-3 bg-[#0f172a] rounded-xs border border-[#1e293b] text-[#94a3b8] text-center italic">
                No campfires attuned yet. Explore beyond the Drop-Pod crater to find and rest at the First Campfire.
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {visibleWaystations.map((ws) => {
                const wsArea = AREA_REGISTRY[ws.areaId];
                const isUndefinedSpec = wsArea?.specStatus === 'UNDEFINED';
                const isDiscovered = discoveredWs.includes(ws.id) || isCheatMode;
                const isHere = state.room === ws.room;
                return (
                  <div
                    key={ws.id}
                    className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-[#fef08a] text-[9.5px]">{ws.name}</div>
                      <div className="text-[8px] text-[#94a3b8]">
                        {wsArea?.name || ws.areaId}
                        {isCheatMode ? ` · Room [${ws.room}]` : ''}
                      </div>
                    </div>
                    <button
                      disabled={!isDiscovered || !rooms || isUndefinedSpec}
                      onClick={() => {
                        if (!rooms) return;
                        if (fastTravelToWaystation(rooms, state, ws.id)) {
                          onResume();
                        }
                      }}
                      className={`px-2 py-1 rounded-xs font-bold text-[8.5px] shrink-0 cursor-pointer ${
                        isUndefinedSpec
                          ? 'bg-[#451a03] text-[#fcd34d] border border-[#b45309] cursor-not-allowed'
                          : isHere
                            ? 'bg-[#422006] text-[#fde68a] border border-[#f59e0b]'
                            : 'bg-[#ca8a04] hover:bg-[#a16207] text-[#05070a]'
                      }`}
                    >
                      {isUndefinedSpec
                        ? 'FOG SEALED'
                        : isHere
                          ? 'AT CAMPFIRE'
                          : 'FAST TRAVEL'}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Discovered Colossal Waygates (Shown if discovered or in Cheat Room Mode) */}
      {(discoveredWg.length > 0 || isCheatMode) && (
        <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#67e8f9] text-[10px]">
              COLOSSAL WAYGATES (Q) — INTER-WORLD TRANSIT
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {Object.values(WAYGATE_REGISTRY)
              .filter((wg) => isCheatMode || discoveredWg.includes(wg.id))
              .map((wg) => {
                const wgArea = AREA_REGISTRY[wg.areaId];
                const isUndefinedSpec = wgArea?.specStatus === 'UNDEFINED';
                const isDiscovered = discoveredWg.includes(wg.id) || isCheatMode;
                const isHere = state.room === wg.room;
                return (
                  <div
                    key={wg.id}
                    className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-[#e0f2fe] text-[9.5px]">
                        {wg.name} · <span className="text-[#38bdf8]">{wg.world}</span>
                      </div>
                      {isCheatMode && (
                        <div className="text-[8px] text-[#94a3b8]">
                          Room [{wg.room}] · Alignment: {wg.desyncStatus}
                        </div>
                      )}
                    </div>
                    <button
                      disabled={!isDiscovered || !rooms || isUndefinedSpec}
                      onClick={() => {
                        if (!rooms) return;
                        if (fastTravelViaWaygate(rooms, state, wg.id)) {
                          onResume();
                        }
                      }}
                      className={`px-2 py-1 rounded-xs font-bold text-[8.5px] shrink-0 cursor-pointer ${
                        isUndefinedSpec
                          ? 'bg-[#451a03] text-[#fcd34d] border border-[#b45309] cursor-not-allowed'
                          : isHere
                            ? 'bg-[#164e63] text-[#67e8f9] border border-[#22d3ee]'
                            : 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
                      }`}
                    >
                      {isUndefinedSpec ? 'SEALED' : isHere ? 'AT WAYGATE' : 'TRANSIT'}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Cheat Room Only: Aether Fog 5-Node Graph Engine & Universe Catalog */}
      {isCheatMode &&
        (() => {
          const activeNode = getActiveAetherNode(state);
          const hasLantern = hasPoeLanternGuidance(state);
          const totalGenerated = Object.keys(state.fogGraph?.nodes || {}).filter((k) =>
            k.startsWith('fog:')
          ).length;
          const dirs: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];
          const majorWorlds = U00_UNIVERSE_CATALOG.filter((w) => w.tier === 'major');

          return (
            <>
              <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#38bdf8] text-[10px]">
                    CHEAT ROOM — ÆTHER FOG 5-NODE TOPOLOGY & STEP TELEPORTER
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[8.5px]">
                  <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                    <div className="text-[#94a3b8] text-[7.5px]">ACTIVE NODE TYPE</div>
                    <div className="font-bold text-[#fbbf24]">
                      {activeNode.nodeType.toUpperCase()} NODE
                    </div>
                  </div>
                  <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                    <div className="text-[#94a3b8] text-[7.5px]">ROUTE / BRANCH STATUS</div>
                    <div className="font-bold text-[#38bdf8]">
                      {activeNode.nodeType === 'general'
                        ? `STEP ${activeNode.routeStep || 1} OF ${activeNode.routeTotal || 1}`
                        : activeNode.nodeType === 'side'
                          ? 'OFF-PATH (NO PROGRESS)'
                          : activeNode.nodeType === 'loop'
                            ? `FOG DEPTH ${worldInfo.loopDepth}/${worldInfo.loopMaxDepth} (${
                                worldInfo.loopDepth >= worldInfo.loopMaxDepth
                                  ? worldInfo.hasFogBoss
                                    ? 'MAX · BOSS'
                                    : `MAX · 1/${worldInfo.loopMaxDepth}`
                                  : `RM ${worldInfo.loopStage}/${worldInfo.loopDepth}`
                              })`
                            : activeNode.nodeType === 'end'
                              ? `END (${(activeNode.endFeature || 'loot_cache').toUpperCase()})`
                              : 'POINT OF INTEREST'}
                    </div>
                  </div>
                  <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                    <div className="text-[#94a3b8] text-[7.5px]">TRUE PATH / ESCAPE TELL</div>
                    <div className="font-bold text-[#86efac]">
                      {activeNode.trueExitDir
                        ? `THRESHOLD [${activeNode.trueExitDir}]`
                        : 'ALL CARDINAL EXITS'}
                    </div>
                  </div>
                  <div className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b]">
                    <div className="text-[#94a3b8] text-[7.5px]">WAYFINDING & CHUNKS</div>
                    <div className="font-bold text-[#e2e8f0]">
                      {hasLantern ? 'POE LANTERN LIT' : '1-2PX SHIMMER'} · {totalGenerated} GEN
                    </div>
                  </div>
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

              <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
                <div className="font-bold text-[#fbbf24] text-[10px]">
                  CHEAT ROOM — u00 UNIVERSE CATALOG ({majorWorlds.length} MAJOR WORLDS):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[8px]">
                  {majorWorlds.map((w) => (
                    <div
                      key={w.id}
                      className="p-1 bg-[#0f172a] rounded-xs border border-[#1e293b] flex flex-col justify-between"
                    >
                      <span className="font-bold text-[#f8fafc] truncate">
                        {w.index}. {w.name}
                      </span>
                      <span className="text-[7.5px] text-[#94a3b8]">{w.theme}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
    </div>
  );
};
