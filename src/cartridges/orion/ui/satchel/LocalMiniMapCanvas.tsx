/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  CHUNK_COLS,
  CHUNK_ROWS,
  getEffectiveRoomCoord,
  getRoomDimensions,
  isChunkedExpanseRoom,
  makeChunkPersistenceKey,
  TILE_SIZE,
  UNIFIED_BOG_ROOM_PLACEMENTS,
} from '../../constants';
import {
  formatOrionLoreLabel,
  getActiveChunkLandmarkLabel,
  getOrionGraphicsSettings,
  getOrionRoomsRef,
  getRoomWorldInfo,
  isRoomCacheLooted,
} from '../../systems';
import { OrionDir, OrionState } from '../../types';

/**
 * Props for `LocalMiniMapCanvas` (`[SELECT]` screen progressive tile-accurate Local Mini-Map).
 * Supports both Full Tactical and Compact Retro React HUD modes. Does not mutate `state: OrionState`.
 * Wiring: Rendered by `SatchelWorldTab` in `src/cartridges/orion/ui/satchel/SatchelWorldTab.tsx` when `effectiveAccessMode === 'menu'`.
 * Removal: Delete `src/cartridges/orion/ui/satchel/LocalMiniMapCanvas.tsx` and remove its `<LocalMiniMapCanvas />` branch in `SatchelWorldTab.tsx`.
 */
export interface LocalMiniMapCanvasProps {
  state: OrionState;
}

interface DiscoveredLandmarkMarker {
  id: string;
  char: string;
  tx: number;
  ty: number;
  label: string;
  category:
    | 'campfire'
    | 'waygate'
    | 'drop_pod'
    | 'lantern'
    | 'gate'
    | 'cache'
    | 'switch'
    | 'scout';
  statusLabel: string;
  color: string;
}

interface ExploredSectorZone {
  roomCoord: string;
  title: string;
  minTx: number;
  maxTx: number;
  minTy: number;
  maxTy: number;
  centerTx: number;
  centerTy: number;
}

const CANVAS_W = 360;
const CANVAS_H = 224;

function resolveTileTerrainColor(ch: string): { fill: string; ridge?: string } {
  switch (ch) {
    case '#':
      return { fill: '#111827', ridge: '#334155' };
    case 'P':
      return { fill: '#475569', ridge: '#94a3b8' };
    case '~':
      return { fill: '#0e7490', ridge: '#155e75' };
    case ':':
      return { fill: '#64748b' };
    case ';':
      return { fill: '#1e293b' };
    case ',':
      return { fill: '#164e35' };
    case '_':
      return { fill: '#020617', ridge: '#7f1d1d' };
    case '%':
      return { fill: '#581c87', ridge: '#a855f7' };
    default:
      return { fill: '#3f2e21' };
  }
}

function getFacingAngleRad(dir: OrionDir): number {
  switch (dir) {
    case 'E':
      return 0;
    case 'SE':
      return Math.PI * 0.25;
    case 'S':
      return Math.PI * 0.5;
    case 'SW':
      return Math.PI * 0.75;
    case 'W':
      return Math.PI;
    case 'NW':
      return -Math.PI * 0.75;
    case 'N':
      return -Math.PI * 0.5;
    case 'NE':
      return -Math.PI * 0.25;
  }
}

function resolveLandmarkForTile(
  ch: string,
  tx: number,
  ty: number,
  state: OrionState,
  devMode: boolean
): DiscoveredLandmarkMarker | null {
  const effectiveRoom = getEffectiveRoomCoord(state);
  if (ch === 'A') {
    const isLit = Boolean(state.flags?.first_campfire_lit || state.flags?.campfire_unlocked);
    return {
      id: `lm:A:${tx},${ty}`,
      char: 'A',
      tx,
      ty,
      label: formatOrionLoreLabel('Waystation Hearth', devMode),
      category: 'campfire',
      statusLabel: isLit ? 'Hearth Kindled' : 'Cold Hearth Stones',
      color: isLit ? '#f59e0b' : '#94a3b8',
    };
  }
  if (ch === 'Q') {
    return {
      id: `lm:Q:${tx},${ty}`,
      char: 'Q',
      tx,
      ty,
      label: formatOrionLoreLabel('Colossal Waygate', devMode),
      category: 'waygate',
      statusLabel: 'Æther Conduit',
      color: '#c084fc',
    };
  }
  if (ch === 'D') {
    return {
      id: `lm:D:${tx},${ty}`,
      char: 'D',
      tx,
      ty,
      label: formatOrionLoreLabel('Drop-Pod Anchor', devMode),
      category: 'drop_pod',
      statusLabel: 'Spawn Sanctuary',
      color: '#38bdf8',
    };
  }
  if (ch === 'L') {
    const cx = Math.floor(tx / CHUNK_COLS);
    const cy = Math.floor(ty / CHUNK_ROWS);
    const chunkKey = makeChunkPersistenceKey(state.room, cx, cy);
    const isLit = Boolean(
      state.litChunkLanterns?.[chunkKey] ||
        state.flags?.poe_state === 'companion' ||
        state.flags?.poe_state === 'helped'
    );
    return {
      id: `lm:L:${tx},${ty}`,
      char: 'L',
      tx,
      ty,
      label: formatOrionLoreLabel('Poe Lantern Shrine', devMode),
      category: 'lantern',
      statusLabel: isLit ? 'Lantern Ignited' : 'Unlit Shrine',
      color: isLit ? '#22d3ee' : '#64748b',
    };
  }
  if (ch === 'G' || ch === 'M') {
    const isCathedral = ch === 'M';
    const isOpen = Boolean(
      state.unlockedGates?.[effectiveRoom] ||
        state.unlockedGates?.[`${effectiveRoom}:${tx},${ty}`] ||
        (isCathedral && state.flags?.cathedral_door_opened) ||
        (!isCathedral && state.flags?.bog_gate_opened)
    );
    return {
      id: `lm:${ch}:${tx},${ty}`,
      char: ch,
      tx,
      ty,
      label: isCathedral ? 'Cathedral Great Doors' : 'Iron Perimeter Gate',
      category: 'gate',
      statusLabel: isOpen ? 'Unbarred' : 'Sealed',
      color: isOpen ? '#4ade80' : '#f43f5e',
    };
  }
  if (ch === 'C' || ch === 'V') {
    const isChest = ch === 'V';
    const isLooted = isRoomCacheLooted(state, tx, ty);
    return {
      id: `lm:${ch}:${tx},${ty}`,
      char: ch,
      tx,
      ty,
      label: isChest ? 'Sunken Reliquary' : 'Supply Cache',
      category: 'cache',
      statusLabel: isLooted ? 'Opened' : 'Unopened',
      color: isLooted ? '#475569' : '#facc15',
    };
  }
  if (ch === '1' || ch === '2' || ch === '3' || ch === '!') {
    return {
      id: `lm:sw:${tx},${ty}`,
      char: ch,
      tx,
      ty,
      label: 'Counterweight Lever',
      category: 'switch',
      statusLabel: 'Mechanism',
      color: '#fb923c',
    };
  }
  if (ch === 'S') {
    const looted = Boolean(state.lootedCaches?.[`scout:${effectiveRoom}`]);
    return {
      id: `lm:S:${tx},${ty}`,
      char: 'S',
      tx,
      ty,
      label: 'Fallen Silver Giant',
      category: 'scout',
      statusLabel: looted ? 'Searched' : 'Unsearched',
      color: '#e2e8f0',
    };
  }
  return null;
}

/**
 * Renders the progressive, tile-accurate Local Mini-Map on the `[SELECT]` screen `MAP` tab.
 * Draws only tiles revealed in `state.exploredTiles[state.room]` along with discovered landmarks,
 * explored sector outlines, and the pilot's live position and facing chevron.
 * Supports both Full Tactical and Compact Retro React HUD modes. Does not mutate `state: OrionState`.
 * Wiring: Imported by `src/cartridges/orion/ui/satchel/SatchelWorldTab.tsx`.
 * Removal: Delete this file and remove `<LocalMiniMapCanvas />` from `SatchelWorldTab.tsx`.
 */
export const LocalMiniMapCanvas: React.FC<LocalMiniMapCanvasProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const devMode = getOrionGraphicsSettings().devModeEnabled;
  const rooms = getOrionRoomsRef();
  const roomGrid = rooms?.[state.room];
  const worldInfo = getRoomWorldInfo(state);
  const isExpanse = isChunkedExpanseRoom(state.room);
  const { cols, rows } = getRoomDimensions(roomGrid);

  const playerTx = Math.max(0, Math.min(cols - 1, Math.floor(state.x / TILE_SIZE)));
  const playerTy = Math.max(0, Math.min(rows - 1, Math.floor(state.y / TILE_SIZE)));

  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 4>(isExpanse ? 2 : 4);
  const [panOffsetTiles, setPanOffsetTiles] = useState<{ dx: number; dy: number }>({
    dx: 0,
    dy: 0,
  });
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    baseDx: number;
    baseDy: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    baseDx: 0,
    baseDy: 0,
  });

  // Build effective explored tile lookup (merging persistent exploredTiles with immediate player vision halo)
  const exploredSnapshot = useMemo(() => {
    const rawExplored = state.exploredTiles?.[state.room] || {};
    const merged: Record<string, boolean> = { ...rawExplored };
    const haloRadius = 4;
    for (let dy = -haloRadius; dy <= haloRadius; dy++) {
      for (let dx = -haloRadius; dx <= haloRadius; dx++) {
        if (dx * dx + dy * dy <= haloRadius * haloRadius) {
          const tx = playerTx + dx;
          const ty = playerTy + dy;
          if (tx >= 0 && tx < cols && ty >= 0 && ty < rows) {
            merged[`${tx},${ty}`] = true;
          }
        }
      }
    }

    const landmarks: DiscoveredLandmarkMarker[] = [];
    const seenGateCategories = new Set<string>();
    let exploredCount = 0;

    if (roomGrid) {
      for (const key of Object.keys(merged)) {
        if (!merged[key]) continue;
        const commaIdx = key.indexOf(',');
        if (commaIdx < 0) continue;
        const tx = Number(key.slice(0, commaIdx));
        const ty = Number(key.slice(commaIdx + 1));
        if (!Number.isFinite(tx) || !Number.isFinite(ty)) continue;
        if (ty < 0 || ty >= rows || tx < 0 || tx >= cols) continue;
        exploredCount++;
        const ch = roomGrid[ty]?.[tx];
        if (!ch || ch === '.' || ch === ',' || ch === '#' || ch === ':' || ch === ';' || ch === '~') {
          continue;
        }
        const lm = resolveLandmarkForTile(ch, tx, ty, state, devMode);
        if (lm) {
          // Deduplicate multi-tile gate spans within the same 4-tile cluster
          if (lm.category === 'gate') {
            const clusterKey = `${lm.char}:${Math.floor(tx / 4)},${Math.floor(ty / 4)}`;
            if (seenGateCategories.has(clusterKey)) continue;
            seenGateCategories.add(clusterKey);
          }
          landmarks.push(lm);
        }
      }
    }

    const exploredZones: ExploredSectorZone[] = [];
    if (isExpanse) {
      for (const p of UNIFIED_BOG_ROOM_PLACEMENTS) {
        const minTx = p.startCx * CHUNK_COLS;
        const maxTx = (p.startCx + p.chunksW) * CHUNK_COLS - 1;
        const minTy = p.startCy * CHUNK_ROWS;
        const maxTy = (p.startCy + p.chunksH) * CHUNK_ROWS - 1;
        let hasExploredTile = false;
        for (let ty = minTy; ty <= maxTy && !hasExploredTile; ty += 2) {
          for (let tx = minTx; tx <= maxTx; tx += 2) {
            if (merged[`${tx},${ty}`] || merged[`${tx + 1},${ty}`]) {
              hasExploredTile = true;
              break;
            }
          }
        }
        if (hasExploredTile) {
          exploredZones.push({
            roomCoord: p.roomCoord,
            title: formatOrionLoreLabel(p.title, devMode),
            minTx,
            maxTx,
            minTy,
            maxTy,
            centerTx: Math.floor((minTx + maxTx) * 0.5),
            centerTy: Math.floor((minTy + maxTy) * 0.5),
          });
        }
      }
    }

    return {
      merged,
      exploredCount,
      landmarks,
      exploredZones,
    };
  }, [
    state,
    state.room,
    state.exploredTiles,
    state.lootedCaches,
    state.unlockedGates,
    state.litChunkLanterns,
    roomGrid,
    cols,
    rows,
    playerTx,
    playerTy,
    isExpanse,
    devMode,
  ]);

  const tilePixelSize = useMemo(() => {
    if (!isExpanse) {
      return zoomLevel === 1 ? 6 : zoomLevel === 2 ? 9 : 13;
    }
    return zoomLevel === 1 ? 2 : zoomLevel === 2 ? 4 : 7;
  }, [isExpanse, zoomLevel]);

  const centerTileX = playerTx + panOffsetTiles.dx;
  const centerTileY = playerTy + panOffsetTiles.dy;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;

    g.fillStyle = '#05070a';
    g.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle cartography background grid hairlines
    g.strokeStyle = 'rgba(30, 41, 59, 0.35)';
    g.lineWidth = 1;
    const gridStepPx = Math.max(16, tilePixelSize * 10);
    const originScreenX = Math.floor(CANVAS_W * 0.5 - centerTileX * tilePixelSize);
    const originScreenY = Math.floor(CANVAS_H * 0.5 - centerTileY * tilePixelSize);

    for (let sx = originScreenX % gridStepPx; sx < CANVAS_W; sx += gridStepPx) {
      if (sx < 0) continue;
      g.beginPath();
      g.moveTo(sx + 0.5, 0);
      g.lineTo(sx + 0.5, CANVAS_H);
      g.stroke();
    }
    for (let sy = originScreenY % gridStepPx; sy < CANVAS_H; sy += gridStepPx) {
      if (sy < 0) continue;
      g.beginPath();
      g.moveTo(0, sy + 0.5);
      g.lineTo(CANVAS_W, sy + 0.5);
      g.stroke();
    }

    if (!roomGrid) return;

    // 1. Draw all explored tiles with tile-accurate terrain colors
    const { merged, landmarks, exploredZones } = exploredSnapshot;
    const halfTilesW = Math.ceil(CANVAS_W / (2 * tilePixelSize)) + 2;
    const halfTilesH = Math.ceil(CANVAS_H / (2 * tilePixelSize)) + 2;
    const minVisTx = Math.max(0, Math.floor(centerTileX - halfTilesW));
    const maxVisTx = Math.min(cols - 1, Math.ceil(centerTileX + halfTilesW));
    const minVisTy = Math.max(0, Math.floor(centerTileY - halfTilesH));
    const maxVisTy = Math.min(rows - 1, Math.ceil(centerTileY + halfTilesH));

    for (let ty = minVisTy; ty <= maxVisTy; ty++) {
      const rowStr = roomGrid[ty] || '';
      const sy = Math.floor(CANVAS_H * 0.5 + (ty - centerTileY) * tilePixelSize);
      for (let tx = minVisTx; tx <= maxVisTx; tx++) {
        if (!merged[`${tx},${ty}`]) continue;
        const ch = rowStr[tx] || '.';
        const sx = Math.floor(CANVAS_W * 0.5 + (tx - centerTileX) * tilePixelSize);
        const { fill, ridge } = resolveTileTerrainColor(ch);
        g.fillStyle = fill;
        g.fillRect(sx, sy, tilePixelSize, tilePixelSize);
        if (ridge && tilePixelSize >= 3) {
          g.fillStyle = ridge;
          g.fillRect(sx, sy, tilePixelSize, 1);
        }
      }
    }

    // 2. Draw subtle outlines around explored sector zones in the Unified Bog Expanse
    for (const zone of exploredZones) {
      const zx = Math.floor(CANVAS_W * 0.5 + (zone.minTx - centerTileX) * tilePixelSize);
      const zy = Math.floor(CANVAS_H * 0.5 + (zone.minTy - centerTileY) * tilePixelSize);
      const zw = (zone.maxTx - zone.minTx + 1) * tilePixelSize;
      const zh = (zone.maxTy - zone.minTy + 1) * tilePixelSize;
      if (zx + zw < 0 || zx > CANVAS_W || zy + zh < 0 || zy > CANVAS_H) continue;

      g.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      g.lineWidth = 1;
      g.strokeRect(zx + 0.5, zy + 0.5, zw - 1, zh - 1);

      if (tilePixelSize >= 3) {
        g.font = 'bold 8px monospace';
        g.textAlign = 'center';
        g.fillStyle = 'rgba(5, 7, 10, 0.85)';
        const labelX = Math.max(44, Math.min(CANVAS_W - 44, zx + zw * 0.5));
        const labelY = Math.max(12, Math.min(CANVAS_H - 6, zy + 10));
        g.fillText(zone.title, labelX + 1, labelY + 1);
        g.fillStyle = '#bae6fd';
        g.fillText(zone.title, labelX, labelY);
      }
    }

    // 3. Draw discovered landmark markers on explored tiles
    for (const lm of landmarks) {
      const lx = Math.floor(
        CANVAS_W * 0.5 + (lm.tx + 0.5 - centerTileX) * tilePixelSize
      );
      const ly = Math.floor(
        CANVAS_H * 0.5 + (lm.ty + 0.5 - centerTileY) * tilePixelSize
      );
      if (lx < -8 || lx > CANVAS_W + 8 || ly < -8 || ly > CANVAS_H + 8) continue;

      const isSelected = lm.id === selectedLandmarkId;
      const markerR = Math.max(3, Math.min(6, Math.floor(tilePixelSize * 0.85)));

      if (isSelected) {
        g.strokeStyle = '#ffffff';
        g.lineWidth = 1.5;
        g.strokeRect(lx - markerR - 2, ly - markerR - 2, (markerR + 2) * 2, (markerR + 2) * 2);
      }

      g.fillStyle = '#020617';
      g.fillRect(lx - markerR - 1, ly - markerR - 1, (markerR + 1) * 2, (markerR + 1) * 2);
      g.fillStyle = lm.color;
      g.fillRect(lx - markerR, ly - markerR, markerR * 2, markerR * 2);
    }

    // 4. Draw Companion Poe orb if active
    if (state.flags?.poe_state === 'companion' && state.poeCompanion) {
      const poeTx = state.poeCompanion.x / TILE_SIZE;
      const poeTy = state.poeCompanion.y / TILE_SIZE;
      const px = Math.floor(CANVAS_W * 0.5 + (poeTx - centerTileX) * tilePixelSize);
      const py = Math.floor(CANVAS_H * 0.5 + (poeTy - centerTileY) * tilePixelSize);
      g.fillStyle = '#22d3ee';
      g.beginPath();
      g.arc(px, py, 3, 0, Math.PI * 2);
      g.fill();
    }

    // 5. Draw Pilot Mech directional chevron at live position
    const pilotScreenX = Math.floor(
      CANVAS_W * 0.5 + (state.x / TILE_SIZE - centerTileX) * tilePixelSize
    );
    const pilotScreenY = Math.floor(
      CANVAS_H * 0.5 + (state.y / TILE_SIZE - centerTileY) * tilePixelSize
    );
    const angle = getFacingAngleRad(state.dir || 'S');

    g.save();
    g.translate(pilotScreenX, pilotScreenY);
    g.rotate(angle);

    // Outer tactical beacon ring
    g.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(0, 0, 6.5, 0, Math.PI * 2);
    g.stroke();

    // Directional pilot chevron
    g.fillStyle = '#38bdf8';
    g.strokeStyle = '#020617';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(6, 0);
    g.lineTo(-4.5, -4);
    g.lineTo(-2.5, 0);
    g.lineTo(-4.5, 4);
    g.closePath();
    g.fill();
    g.stroke();

    g.fillStyle = '#ffffff';
    g.fillRect(-1, -1, 2, 2);
    g.restore();
  }, [
    roomGrid,
    cols,
    rows,
    centerTileX,
    centerTileY,
    tilePixelSize,
    exploredSnapshot,
    selectedLandmarkId,
    state.x,
    state.y,
    state.dir,
    state.flags?.poe_state,
    state.poeCompanion,
  ]);

  const activeLocationName = formatOrionLoreLabel(
    getActiveChunkLandmarkLabel(state) || worldInfo.roomTitle,
    devMode
  );
  const activeAreaName = formatOrionLoreLabel(worldInfo.areaName, devMode);
  const selectedLandmark =
    exploredSnapshot.landmarks.find((l) => l.id === selectedLandmarkId) || null;

  const panStep = isExpanse ? 12 : 4;

  return (
    <div className="space-y-2 text-[10px] select-none">
      {/* 1. LOCAL MINI-MAP HEADER & LOCATION STATUS */}
      <div className="p-2 bg-[#0b101d] rounded-xs border border-[#38bdf8]/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-black text-[#f8fafc] text-[10.5px] tracking-wider">
            LOCAL MINI-MAP — PROGRESSIVE EXPLORATION CARTOGRAPHY
          </span>
          <span className="text-[#64748b]">·</span>
          <span className="text-[#38bdf8] font-bold">{activeAreaName}</span>
          <span className="text-[#64748b]">·</span>
          <span className="text-[#86efac] font-bold">{activeLocationName}</span>
        </div>

        <div className="flex items-center gap-2 text-[8.5px] text-[#94a3b8] tabular-nums">
          <span>Charted Tiles: {exploredSnapshot.exploredCount}</span>
          <span>·</span>
          <span>Landmarks: {exploredSnapshot.landmarks.length}</span>
        </div>
      </div>

      {/* 2. TWO-COLUMN LOCAL MINI-MAP CANVAS & DISCOVERED LANDMARKS SIDEBAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
        {/* LEFT COLUMN (8 cols): INTERACTIVE TILE-ACCURATE MINI-MAP VIEWPORT */}
        <div className="md:col-span-8 p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
          {/* Toolbar: Zoom & Pan Controls */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-[#94a3b8] font-bold mr-0.5">ZOOM</span>
              {([1, 2, 4] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => {
                    soundSystem.playMenuBeep();
                    setZoomLevel(z);
                  }}
                  className={`px-2 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer tabular-nums ${
                    zoomLevel === z
                      ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                      : 'bg-[#0f172a] text-[#cbd5e1] border-[#334155] hover:border-[#38bdf8]'
                  }`}
                >
                  {z}×
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setPanOffsetTiles((p) => ({ ...p, dy: p.dy - panStep }));
                }}
                className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] rounded-xs text-[8px] font-bold cursor-pointer"
                title="Pan North"
              >
                ▲ N
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setPanOffsetTiles((p) => ({ ...p, dy: p.dy + panStep }));
                }}
                className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] rounded-xs text-[8px] font-bold cursor-pointer"
                title="Pan South"
              >
                ▼ S
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setPanOffsetTiles((p) => ({ ...p, dx: p.dx - panStep }));
                }}
                className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] rounded-xs text-[8px] font-bold cursor-pointer"
                title="Pan West"
              >
                ◀ W
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setPanOffsetTiles((p) => ({ ...p, dx: p.dx + panStep }));
                }}
                className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] rounded-xs text-[8px] font-bold cursor-pointer"
                title="Pan East"
              >
                ▶ E
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setPanOffsetTiles({ dx: 0, dy: 0 });
                  setSelectedLandmarkId(null);
                }}
                className="px-2 py-0.5 bg-[#0c4a6e] hover:bg-[#075985] text-[#e0f2fe] border border-[#38bdf8] rounded-xs text-[8px] font-bold cursor-pointer"
              >
                CENTER ON PILOT
              </button>
            </div>
          </div>

          {/* Pixel-Art Local Mini-Map Canvas */}
          <div className="relative w-full bg-[#05070a] border border-[#1e293b] rounded-xs overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={(e) => {
                dragStateRef.current = {
                  active: true,
                  startX: e.clientX,
                  startY: e.clientY,
                  baseDx: panOffsetTiles.dx,
                  baseDy: panOffsetTiles.dy,
                };
              }}
              onPointerMove={(e) => {
                if (!dragStateRef.current.active) return;
                const deltaX = e.clientX - dragStateRef.current.startX;
                const deltaY = e.clientY - dragStateRef.current.startY;
                const scale = Math.max(1, tilePixelSize);
                setPanOffsetTiles({
                  dx: Math.round(dragStateRef.current.baseDx - deltaX / scale),
                  dy: Math.round(dragStateRef.current.baseDy - deltaY / scale),
                });
              }}
              onPointerUp={() => {
                dragStateRef.current.active = false;
              }}
              onPointerLeave={() => {
                dragStateRef.current.active = false;
              }}
              className="w-full h-[210px] sm:h-[240px] object-contain cursor-grab active:cursor-grabbing"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Terrain & Marker Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[7.5px] text-[#94a3b8]">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#38bdf8] border border-white" />
                Pilot
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#f59e0b]" />
                Campfire
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#c084fc]" />
                Waygate
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#22d3ee]" />
                Lantern
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#facc15]" />
                Cache / Reliquary
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#f43f5e]" />
                Gate
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#3f2e21]" />
                Peat
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#164e35]" />
                Moss
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#64748b]" />
                Causeway
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#0e7490]" />
                Mire Water
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): CHARTED SECTORS & DISCOVERED LANDMARKS */}
        <div className="md:col-span-4 p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
          {/* Selected Landmark Inspector or guidance note */}
          <div className="p-2 bg-[#0f172a] rounded-xs border border-[#334155] space-y-1">
            <div className="text-[8px] font-bold text-[#94a3b8]">
              {selectedLandmark ? 'SELECTED LANDMARK' : 'CARTOGRAPHY NOTES'}
            </div>
            {selectedLandmark ? (
              <div className="space-y-0.5">
                <div className="text-[10px] font-black text-[#f8fafc]">
                  {selectedLandmark.label}
                </div>
                <div className="text-[8.5px] text-[#7dd3fc]">
                  Status: {selectedLandmark.statusLabel}
                </div>
              </div>
            ) : (
              <div className="text-[8.5px] text-[#cbd5e1] leading-snug">
                Terrain and landmarks are drawn automatically as your vision illuminates the fog.
                Rest at a Campfire to open the Planet Map, or attune a Colossal Waygate to open the
                Æther Map.
              </div>
            )}
          </div>

          {/* Charted Sector Landmarks List */}
          <div className="space-y-1">
            <div className="text-[8.5px] font-bold text-[#fde047] flex items-center justify-between">
              <span>DISCOVERED LANDMARKS</span>
              <span className="text-[#94a3b8] tabular-nums">
                {exploredSnapshot.landmarks.length}
              </span>
            </div>

            {exploredSnapshot.landmarks.length === 0 ? (
              <div className="p-2 bg-[#05070a] rounded-xs border border-[#1e293b] text-[8.5px] text-[#94a3b8]">
                No interactive landmarks charted in the immediate vicinity yet. Explore outward to
                reveal campfires, shrines, gates, and caches.
              </div>
            ) : (
              <div className="max-h-[164px] overflow-y-auto space-y-1 pr-0.5">
                {exploredSnapshot.landmarks.map((lm) => {
                  const isSel = lm.id === selectedLandmarkId;
                  return (
                    <button
                      key={lm.id}
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        setSelectedLandmarkId(lm.id);
                        setPanOffsetTiles({
                          dx: lm.tx - playerTx,
                          dy: lm.ty - playerTy,
                        });
                      }}
                      className={`w-full p-1.5 rounded-xs border text-left cursor-pointer flex items-center justify-between gap-1.5 transition-colors ${
                        isSel
                          ? 'bg-[#0c4a6e] border-[#38bdf8] text-white'
                          : 'bg-[#0b111e] border-[#1e293b] text-[#cbd5e1] hover:border-[#475569]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="inline-block w-2.5 h-2.5 shrink-0 border border-[#020617]"
                          style={{ backgroundColor: lm.color }}
                        />
                        <span className="font-bold text-[8.5px] truncate">{lm.label}</span>
                      </div>
                      <span className="text-[7.5px] text-[#94a3b8] shrink-0">
                        {lm.statusLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Charted Sector Zones in the Unified Expanse */}
          {exploredSnapshot.exploredZones.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-[#1e293b]">
              <div className="text-[8.5px] font-bold text-[#7dd3fc] flex items-center justify-between">
                <span>CHARTED SECTORS</span>
                <span className="text-[#94a3b8] tabular-nums">
                  {exploredSnapshot.exploredZones.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-[110px] overflow-y-auto pr-0.5">
                {exploredSnapshot.exploredZones.map((z) => (
                  <button
                    key={z.roomCoord}
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setPanOffsetTiles({
                        dx: z.centerTx - playerTx,
                        dy: z.centerTy - playerTy,
                      });
                    }}
                    className="p-1 bg-[#0b111e] hover:bg-[#1e293b] border border-[#1e293b] rounded-xs text-left text-[8px] font-bold text-[#bae6fd] truncate cursor-pointer"
                  >
                    {z.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
