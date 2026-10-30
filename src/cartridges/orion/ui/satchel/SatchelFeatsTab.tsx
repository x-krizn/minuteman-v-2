/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  computeEffectiveLoadCapacity,
  computeEffectivePlayerLightTiles,
  computeInterfaceFeatModifiers,
  doesPilotMeetFeatEquipmentRequirement,
  FEAT_TIER_MAX_SLOTS,
  FRAME_FEAT_CATALOG,
  fundPilotSkillWithGem,
  GEMSTONE_REGISTRY,
  getEquippedFeatCountByTier,
  getInventoryGemCount,
  isFeatNodeAvailable,
  isStandardProgressionUnlocked,
  normalizePilotSkills,
  PILOT_SKILL_DEFINITIONS,
  syncPostTutorialFrameLevel,
  toggleFeatNodeGemSocket,
} from '../../database/progression';
import { notifyOrionStateChange, syncStateGates } from '../../systems';
import {
  FeatSynergyCategory,
  FeatTier,
  FrameFeatDefinition,
  GemId,
  OrionState,
  PilotSkillId,
} from '../../types';
import { SpriteCanvasIcon } from './SatchelCanvases';

interface SatchelFeatsTabProps {
  state: OrionState;
  isCheatMode?: boolean;
  onResume?: () => void;
  featTierFilter?: FeatTier | 'ALL';
  setFeatTierFilter?: React.Dispatch<React.SetStateAction<FeatTier | 'ALL'>>;
  featSynergyFilter?: FeatSynergyCategory | 'ALL';
  setFeatSynergyFilter?: React.Dispatch<React.SetStateAction<FeatSynergyCategory | 'ALL'>>;
  setToast?: (msg: string) => void;
}

const SYNERGY_CATEGORIES: FeatSynergyCategory[] = [
  'Ballistics & Ordnance',
  'Melee & CQC',
  'Frame Plating & Defense',
  'Reactor & Thermal',
  'Mobility & Stealth',
  'Optics & Support',
];

const FEAT_TIERS: FeatTier[] = ['I', 'II', 'III', 'IV', 'V'];

interface HexNodeDescriptor {
  index: number;
  ring: 'inner' | 'middle' | 'outer';
  armIndex: number;
  armLabel: string;
  category: FeatSynergyCategory;
  centerQ: number;
  centerR: number;
  color: string;
}

// 6-Finger Hexagonal Lattice (3 rings x 6 arms = 18 '+' pentomino nodes around hollow center core)
const SIX_ARM_AXIAL_DIRS: Array<{
  dq: number;
  dr: number;
  label: string;
  category: FeatSynergyCategory;
  color: string;
}> = [
  {
    dq: 0,
    dr: -1,
    label: 'N · BALLISTICS & ORDNANCE',
    category: 'Ballistics & Ordnance',
    color: '#38bdf8',
  },
  {
    dq: 1,
    dr: -1,
    label: 'NE · REACTOR & THERMAL',
    category: 'Reactor & Thermal',
    color: '#f97316',
  },
  {
    dq: 1,
    dr: 0,
    label: 'SE · PLATING & DEFENSE',
    category: 'Frame Plating & Defense',
    color: '#a855f7',
  },
  {
    dq: 0,
    dr: 1,
    label: 'S · MOBILITY & STEALTH',
    category: 'Mobility & Stealth',
    color: '#22c55e',
  },
  {
    dq: -1,
    dr: 1,
    label: 'SW · OPTICS & SUPPORT',
    category: 'Optics & Support',
    color: '#eab308',
  },
  {
    dq: -1,
    dr: 0,
    label: 'NW · MELEE & CQC',
    category: 'Melee & CQC',
    color: '#f43f5e',
  },
];

const PLUS_PENTOMINO_OFFSETS: Array<{ dq: number; dr: number; role: 'center' | 'petal' }> = [
  { dq: 0, dr: 0, role: 'center' },
  { dq: 0, dr: -1, role: 'petal' },
  { dq: 1, dr: -1, role: 'petal' },
  { dq: 0, dr: 1, role: 'petal' },
  { dq: -1, dr: 1, role: 'petal' },
];

const HEX_18_NODES: HexNodeDescriptor[] = (() => {
  const list: HexNodeDescriptor[] = [];
  const ringRadii: Array<{ ring: 'inner' | 'middle' | 'outer'; dist: number }> = [
    { ring: 'inner', dist: 2 },
    { ring: 'middle', dist: 4 },
    { ring: 'outer', dist: 6 },
  ];
  let idx = 0;
  for (const rInfo of ringRadii) {
    for (let arm = 0; arm < SIX_ARM_AXIAL_DIRS.length; arm++) {
      const dir = SIX_ARM_AXIAL_DIRS[arm];
      list.push({
        index: idx++,
        ring: rInfo.ring,
        armIndex: arm,
        armLabel: dir.label,
        category: dir.category,
        centerQ: dir.dq * rInfo.dist,
        centerR: dir.dr * rInfo.dist,
        color: dir.color,
      });
    }
  }
  return list;
})();

function axialToPixel(q: number, r: number, hexRadius: number): { x: number; y: number } {
  const x = hexRadius * 1.5 * q;
  const y = hexRadius * Math.sqrt(3) * (r + q / 2);
  return { x, y };
}

function getHexPolygonPoints(cx: number, cy: number, radius: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return pts.join(' ');
}

export const SatchelFeatsTab: React.FC<SatchelFeatsTabProps> = ({ state, setToast }) => {
  const [, setTick] = useState(0);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<PilotSkillId | 'ALL'>('ALL');
  const [selectedHexNodeIdx, setSelectedHexNodeIdx] = useState<number>(0);
  const [showHexGridDiagram, setShowHexGridDiagram] = useState<boolean>(true);
  const [showReferencePng, setShowReferencePng] = useState<boolean>(false);

  const forceRefresh = () => {
    notifyOrionStateChange();
    setTick((t) => t + 1);
  };

  const notifyToast = (msg: string) => {
    state.toastText = msg;
    state.toastTimer = 2.6;
    if (setToast) setToast(msg);
  };

  const sayCtx = useMemo(
    () => ({
      say: (msg: string) => {
        state.toastText = msg;
        state.toastTimer = 2.6;
        if (setToast) setToast(msg);
      },
    }),
    [setToast, state]
  );

  const progressionUnlocked = isStandardProgressionUnlocked(state);
  const isCheatMode = state.room === '-4,0' || Boolean(state.bypassProgressionGates);
  const skillsMap = normalizePilotSkills(state.pilotSkills);
  const effectiveLoad = computeEffectiveLoadCapacity(
    state.traitLine,
    state.equippedFeats || [],
    state
  );
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const effectiveLightTiles = computeEffectivePlayerLightTiles(state);
  const baseLightTiles = typeof state.baseLight === 'number' ? state.baseLight : 5;

  const filteredFeats = useMemo(() => {
    if (selectedSkillFilter === 'ALL') return FRAME_FEAT_CATALOG;
    return FRAME_FEAT_CATALOG.filter((f) => f.requiredSkillId === selectedSkillFilter);
  }, [selectedSkillFilter]);

  // Map the 18 Hex '+' Pentomino Nodes to Feats in the catalog
  const hexNodeAssignments = useMemo(() => {
    return HEX_18_NODES.map((node) => {
      const catFeats = FRAME_FEAT_CATALOG.filter((f) => f.synergyCategory === node.category);
      const ringIdx = node.ring === 'inner' ? 0 : node.ring === 'middle' ? 1 : 2;
      const feat: FrameFeatDefinition | undefined =
        catFeats[ringIdx] || FRAME_FEAT_CATALOG[node.index % FRAME_FEAT_CATALOG.length];
      const isEquipped = feat ? state.equippedFeats.includes(feat.id) : false;
      const isAvailable = feat ? isFeatNodeAvailable(state, feat) : false;
      return {
        node,
        feat,
        isEquipped,
        isAvailable,
      };
    });
  }, [state, state.equippedFeats, state.pilotSkills, state.level]);

  const activeHexAssignment = hexNodeAssignments[selectedHexNodeIdx] || hexNodeAssignments[0];

  const handleAdjustCheatLevel = (delta: number) => {
    const nextLevel = Math.max(1, Math.min(20, (state.level || 1) + delta));
    state.level = nextLevel;
    syncStateGates(state);
    soundSystem.playSelect();
    notifyToast(`CHEAT: PILOT LEVEL SET TO CLVL ${nextLevel}`);
    forceRefresh();
  };

  const handleAdjustBaseLight = (delta: number) => {
    const nextLight = Math.max(2, Math.min(12, baseLightTiles + delta));
    state.baseLight = nextLight;
    soundSystem.playSelect();
    notifyToast(`BASE LIGHT STAT SET TO ${nextLight} TILES (${nextLight * 16}PX)`);
    forceRefresh();
  };

  const handleAdjustCheatSkillLevel = (skillId: PilotSkillId, delta: number) => {
    state.pilotSkills = normalizePilotSkills(state.pilotSkills);
    const current = state.pilotSkills[skillId]?.level || 1;
    const next = Math.max(1, Math.min(20, current + delta));
    state.pilotSkills[skillId].level = next;
    syncPostTutorialFrameLevel(state);
    syncStateGates(state);
    soundSystem.playSelect();
    notifyToast(`CHEAT: ${skillId.toUpperCase()} SET TO LV ${next}`);
    forceRefresh();
  };

  const handleFundSkillWithGem = (skillId: PilotSkillId, gemId: GemId) => {
    const ok = fundPilotSkillWithGem(state, skillId, gemId, sayCtx);
    if (ok) {
      syncStateGates(state);
      soundSystem.playPowerup();
      forceRefresh();
    } else {
      soundSystem.playMenuBeep();
    }
  };

  const handleToggleFeatSocket = (featId: string) => {
    const ok = toggleFeatNodeGemSocket(state, featId, sayCtx);
    if (ok) {
      syncStateGates(state);
      soundSystem.playSelect();
      forceRefresh();
    } else {
      soundSystem.playMenuBeep();
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 pb-2">
      {/* Header Banner: Standard Progression Gate Status */}
      <div
        className={`rounded-lg border p-3 ${
          progressionUnlocked
            ? 'border-[#38bdf8]/40 bg-[#071526]'
            : 'border-amber-500/40 bg-amber-950/20'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#7dd3fc]">
              §1.3 PILOT SKILLS &amp; 6-FINGER HEX FEAT MATRIX
            </div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">
              {progressionUnlocked
                ? 'Standard Progression ACTIVE — Spend Gems on Pilot Skills and socket Gems into the 18 Hex Feat Nodes.'
                : 'Tutorial Phase (Levels 1–5) — Standard Skill & Feat Tree unlocks at Level 6 (after Border Town) or via Cheat Terminal 1.'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <div className="px-2 py-1 rounded bg-[#0b1320] border border-[#1e293b] flex items-center gap-1.5">
              <span className="text-[#94a3b8]">CLVL:</span>{' '}
              {isCheatMode && (
                <button
                  type="button"
                  onClick={() => handleAdjustCheatLevel(-1)}
                  className="px-1 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold hover:bg-amber-500/30 cursor-pointer"
                  title="Decrease Pilot Level (Cheat Mode)"
                >
                  -
                </button>
              )}
              <span className="text-[#f8fafc] font-bold">{state.level}</span>
              {isCheatMode && (
                <button
                  type="button"
                  onClick={() => handleAdjustCheatLevel(1)}
                  className="px-1 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold hover:bg-amber-500/30 cursor-pointer"
                  title="Increase Pilot Level (Cheat Mode)"
                >
                  +
                </button>
              )}
            </div>
            <div className="px-2 py-1 rounded bg-[#0b1320] border border-[#1e293b] flex items-center gap-1.5">
              <span className="text-[#94a3b8]">LIGHT:</span>{' '}
              {isCheatMode && (
                <button
                  type="button"
                  onClick={() => handleAdjustBaseLight(-1)}
                  className="px-1 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold hover:bg-amber-500/30 cursor-pointer"
                  title="Decrease Base Light Stat (Tiles)"
                >
                  -
                </button>
              )}
              <span
                className="text-cyan-300 font-bold"
                title={`Base ${baseLightTiles} tiles (${effectiveLightTiles * 16}px effective radius)`}
              >
                {effectiveLightTiles} TILES
              </span>
              {isCheatMode && (
                <button
                  type="button"
                  onClick={() => handleAdjustBaseLight(1)}
                  className="px-1 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold hover:bg-amber-500/30 cursor-pointer"
                  title="Increase Base Light Stat (Tiles)"
                >
                  +
                </button>
              )}
            </div>
            <div className="px-2 py-1 rounded bg-[#0b1320] border border-[#1e293b]">
              <span className="text-[#94a3b8]">LOAD CAP:</span>{' '}
              <span className="text-emerald-300 font-bold uppercase">{effectiveLoad}</span>
            </div>
          </div>
        </div>

        {/* Per-Tier Feat Slot Caps: Tier I: 6, Tier II: 5, Tier III: 4, Tier IV: 3, Tier V: 2 */}
        <div className="mt-2.5 pt-2 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#94a3b8]">
            PER-TIER FEAT SLOT LIMITS (MAX 20 TOTAL):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {FEAT_TIERS.map((tier) => {
              const used = getEquippedFeatCountByTier(state, tier);
              const cap = FEAT_TIER_MAX_SLOTS[tier];
              const isFull = used >= cap;
              return (
                <div
                  key={tier}
                  className={`px-2 py-0.5 rounded border text-[9.5px] font-bold ${
                    isFull
                      ? 'border-amber-400/70 bg-amber-950/40 text-amber-200'
                      : used > 0
                        ? 'border-[#38bdf8]/50 bg-[#0c243c] text-[#7dd3fc]'
                        : 'border-[#1e293b] bg-[#0b1320] text-[#64748b]'
                  }`}
                >
                  TIER {tier}: {used}/{cap}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6-Finger Hexagonal Lattice (18 '+' Pentomino Nodes + Hollow Center Core) */}
      <div className="rounded-lg border border-[#1e293b] bg-[#0b1320] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
              6-FINGER HEXAGONAL FEAT LATTICE (18 &apos;+&apos; PENTOMINO NODES · HOLLOW CORE)
            </div>
            <div className="text-[9px] text-[#94a3b8]">
              6 discipline arms × 3 concentric rings = 18 overlapping 5-hex &apos;+&apos; nodes surrounding the central Mech Reactor core. Click any node to inspect or socket Gems.
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowReferencePng((v) => !v)}
              className={`px-2 py-1 rounded text-[9px] font-bold uppercase border cursor-pointer ${
                showReferencePng
                  ? 'border-amber-400 bg-amber-950/40 text-amber-200'
                  : 'border-[#1e293b] bg-[#070b12] text-[#94a3b8] hover:text-white'
              }`}
            >
              {showReferencePng ? 'HIDE BLUEPRINT PNG' : 'VIEW BLUEPRINT PNG'}
            </button>
            <button
              type="button"
              onClick={() => setShowHexGridDiagram((v) => !v)}
              className="px-2 py-1 rounded text-[9px] font-bold uppercase border border-[#1e293b] bg-[#070b12] text-[#7dd3fc] hover:text-white cursor-pointer"
            >
              {showHexGridDiagram ? 'COLLAPSE LATTICE' : 'EXPAND LATTICE'}
            </button>
          </div>
        </div>

        {showReferencePng && (
          <div className="mb-3 rounded border border-amber-500/40 bg-[#05080f] p-2 flex flex-col items-center">
            <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300 mb-1">
              CANONICAL 18-NODE 6-FINGER HEXAGONAL FEAT TREE BLUEPRINT
            </div>
            <img
              src="/assets/aistudio/Untitled_11-09-2025_04-32-55_8cfb2b22.png"
              alt="18-Node 6-Finger Hexagonal Feat Grid Blueprint"
              className="max-h-56 w-auto rounded border border-[#1e293b] bg-white/95 p-1"
            />
          </div>
        )}

        {showHexGridDiagram && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-7 flex flex-col items-center justify-center rounded border border-[#1e293b] bg-[#060b13] p-2">
              <svg
                viewBox="-175 -165 350 330"
                className="w-full max-w-[360px] h-auto select-none"
                role="img"
                aria-label="6-Finger Hexagonal Feat Grid"
              >
                {/* Subtle radial rings */}
                <circle
                  cx="0"
                  cy="0"
                  r="46"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="92"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="138"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />

                {/* Hollow Central Core (7-hex flower void) */}
                {[
                  { q: 0, r: 0 },
                  { q: 0, r: -1 },
                  { q: 1, r: -1 },
                  { q: 1, r: 0 },
                  { q: 0, r: 1 },
                  { q: -1, r: 1 },
                  { q: -1, r: 0 },
                ].map((cell, idx) => {
                  const pt = axialToPixel(cell.q, cell.r, 11.5);
                  return (
                    <polygon
                      key={`core-${idx}`}
                      points={getHexPolygonPoints(pt.x, pt.y, 10.8)}
                      fill={idx === 0 ? '#0f172a' : '#090f1a'}
                      stroke="#334155"
                      strokeWidth="1"
                    />
                  );
                })}
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="6.5"
                  fontWeight="bold"
                >
                  CORE
                </text>

                {/* Render 18 '+' Pentomino Nodes */}
                {hexNodeAssignments.map((item) => {
                  const { node, feat, isEquipped, isAvailable } = item;
                  const isSelected = selectedHexNodeIdx === node.index;
                  const centerPt = axialToPixel(node.centerQ, node.centerR, 11.5);

                  return (
                    <g
                      key={`hex-node-${node.index}`}
                      onClick={() => {
                        soundSystem.playSelect();
                        setSelectedHexNodeIdx(node.index);
                      }}
                      className="cursor-pointer"
                    >
                      {PLUS_PENTOMINO_OFFSETS.map((off, pIdx) => {
                        const cellQ = node.centerQ + off.dq;
                        const cellR = node.centerR + off.dr;
                        const pt = axialToPixel(cellQ, cellR, 11.5);
                        const isCenterCell = off.role === 'center';
                        const fill = isEquipped
                          ? isCenterCell
                            ? node.color
                            : `${node.color}55`
                          : isSelected
                            ? isCenterCell
                              ? '#1e3a5f'
                              : '#172554'
                            : isAvailable
                              ? isCenterCell
                                ? '#162235'
                                : '#0d1624'
                              : '#080d16';
                        const stroke = isSelected
                          ? '#facc15'
                          : isEquipped
                            ? node.color
                            : isAvailable
                              ? '#475569'
                              : '#1e293b';

                        return (
                          <polygon
                            key={`cell-${node.index}-${pIdx}`}
                            points={getHexPolygonPoints(pt.x, pt.y, isCenterCell ? 10.6 : 9.4)}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={isSelected ? '1.5' : isCenterCell ? '1.2' : '0.75'}
                            opacity={isCenterCell ? 0.96 : 0.72}
                          />
                        );
                      })}
                      <text
                        x={centerPt.x}
                        y={centerPt.y + 2.5}
                        textAnchor="middle"
                        fill={isEquipped ? '#020617' : isSelected ? '#fef08a' : '#e2e8f0'}
                        fontSize="6.5"
                        fontWeight="bold"
                      >
                        {feat ? feat.tier : node.index + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Hex Node Inspector */}
            <div className="lg:col-span-5 rounded border border-[#1e293b] bg-[#070b12] p-3 space-y-2">
              {activeHexAssignment && activeHexAssignment.feat ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border"
                      style={{
                        borderColor: `${activeHexAssignment.node.color}66`,
                        color: activeHexAssignment.node.color,
                        backgroundColor: `${activeHexAssignment.node.color}15`,
                      }}
                    >
                      NODE #{activeHexAssignment.node.index + 1} ·{' '}
                      {activeHexAssignment.node.ring.toUpperCase()} RING
                    </span>
                    <span className="text-[9px] text-[#94a3b8] font-bold">
                      TIER {activeHexAssignment.feat.tier} (
                      {getEquippedFeatCountByTier(state, activeHexAssignment.feat.tier)}/
                      {FEAT_TIER_MAX_SLOTS[activeHexAssignment.feat.tier]} SLOTS)
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[#f8fafc] uppercase">
                    {activeHexAssignment.feat.name}
                  </div>
                  <div className="text-[9.5px] text-emerald-300">
                    + {activeHexAssignment.feat.gainDescription}
                  </div>
                  <div className="text-[9px] text-amber-300/90">
                    − {activeHexAssignment.feat.costDescription}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {activeHexAssignment.feat.gemSockets.map((req, idx) => {
                      const gDef = GEMSTONE_REGISTRY[req.gemId];
                      const have = getInventoryGemCount(state, req.gemId);
                      return (
                        <span
                          key={`${activeHexAssignment.feat!.id}-hex-req-${idx}`}
                          className={`inline-flex items-center gap-1 text-[8.5px] px-1.5 py-0.5 rounded border ${
                            activeHexAssignment.isEquipped || have >= req.count
                              ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200'
                              : 'border-[#1e293b] bg-[#0b1320] text-[#94a3b8]'
                          }`}
                        >
                          {gDef?.iconBase64 && (
                            <SpriteCanvasIcon
                              base64={gDef.iconBase64}
                              sizeClass="w-3 h-3"
                            />
                          )}
                          {req.count}× {gDef?.name || req.gemId}
                        </span>
                      );
                    })}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatSocket(activeHexAssignment.feat!.id)}
                      className={`w-full px-2.5 py-1.5 rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                        activeHexAssignment.isEquipped
                          ? 'bg-amber-500/20 border border-amber-400/60 text-amber-200 hover:bg-amber-500/30'
                          : activeHexAssignment.isAvailable && progressionUnlocked
                            ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/30'
                            : 'bg-[#1e293b] text-[#64748b]'
                      }`}
                    >
                      {activeHexAssignment.isEquipped
                        ? 'UNSOCKET FEAT NODE (REFUND GEMS)'
                        : 'SOCKET GEMS INTO HEX NODE'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* 6 Combat Discipline Pilot Skills Grid */}
      <div className="rounded-lg border border-[#1e293b] bg-[#0b1320] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
            6 COMBAT DISCIPLINE PILOT SKILLS (FUNDED BY GEMSTONES · LV 1–20)
          </div>
          <button
            type="button"
            onClick={() => setSelectedSkillFilter('ALL')}
            className={`text-[9px] px-2 py-0.5 rounded border cursor-pointer ${
              selectedSkillFilter === 'ALL'
                ? 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#f8fafc]'
                : 'border-[#1e293b] text-[#94a3b8] hover:text-white'
            }`}
          >
            SHOW ALL FEATS ({FRAME_FEAT_CATALOG.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PILOT_SKILL_DEFINITIONS.map((skill) => {
            const currentLv = skillsMap[skill.id]?.level || 1;
            const primaryGemDef = GEMSTONE_REGISTRY[skill.fundingGems[0]];
            const isSelected = selectedSkillFilter === skill.id;

            return (
              <div
                key={skill.id}
                onClick={() =>
                  setSelectedSkillFilter(isSelected ? 'ALL' : skill.id)
                }
                className={`rounded border p-2.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#38bdf8] bg-[#10233a]'
                    : 'border-[#1e293b] bg-[#070b12] hover:border-[#334155]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {primaryGemDef?.iconBase64 ? (
                      <SpriteCanvasIcon
                        base64={primaryGemDef.iconBase64}
                        sizeClass="w-3.5 h-3.5 shrink-0"
                      />
                    ) : (
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: primaryGemDef?.hexColor || '#38bdf8' }}
                      />
                    )}
                    <span className="text-[10px] font-bold text-[#f8fafc] uppercase">
                      {skill.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isCheatMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdjustCheatSkillLevel(skill.id, -1);
                        }}
                        className="px-1 py-0.5 rounded text-[8.5px] font-bold bg-amber-500/20 border border-amber-400/50 text-amber-200 hover:bg-amber-500/30 cursor-pointer"
                        title="Decrease Skill Level (Cheat Mode)"
                      >
                        -
                      </button>
                    )}
                    <span className="text-[9.5px] font-mono text-[#7dd3fc]">
                      LV {currentLv}/20
                    </span>
                    {isCheatMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdjustCheatSkillLevel(skill.id, 1);
                        }}
                        className="px-1 py-0.5 rounded text-[8.5px] font-bold bg-amber-500/20 border border-amber-400/50 text-amber-200 hover:bg-amber-500/30 cursor-pointer"
                        title="Increase Skill Level (Cheat Mode)"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[9px] text-[#94a3b8] mt-1 line-clamp-1">
                  {skill.relatedEquipment}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {skill.fundingGems.map((gemId) => {
                    const gDef = GEMSTONE_REGISTRY[gemId];
                    const have = getInventoryGemCount(state, gemId);
                    const canSpend = progressionUnlocked && currentLv < 20 && have > 0;
                    return (
                      <button
                        key={`${skill.id}-fund-${gemId}`}
                        type="button"
                        disabled={!canSpend}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFundSkillWithGem(skill.id, gemId);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase inline-flex items-center gap-1 border ${
                          canSpend
                            ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/30 cursor-pointer'
                            : 'bg-[#0b1320] border-[#1e293b] text-[#475569] cursor-not-allowed'
                        }`}
                      >
                        {gDef?.iconBase64 && (
                          <SpriteCanvasIcon
                            base64={gDef.iconBase64}
                            sizeClass="w-3 h-3"
                          />
                        )}
                        +1 LV ({gDef?.name || gemId}: {have})
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Synergy Summary Strip & Active Stat Modifiers */}
      <div className="rounded-lg border border-[#1e293b] bg-[#0b1320] p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8] mb-2">
          §2.2 FEAT SYNERGY RESONANCE &amp; ACTIVE MODIFIERS ({state.equippedFeats.length} SOCKETED)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
          {SYNERGY_CATEGORIES.map((cat) => {
            const count = (state.equippedFeats || []).filter((id) => {
              const f = FRAME_FEAT_CATALOG.find((item) => item.id === id);
              return f?.synergyCategory === cat;
            }).length;
            return (
              <div
                key={cat}
                className={`rounded border px-2 py-1.5 text-[9px] ${
                  count > 0
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                    : 'border-[#1e293b] bg-[#070b12] text-[#64748b]'
                }`}
              >
                <div className="font-bold truncate">{cat.toUpperCase()}</div>
                <div className="text-[8.5px]">{count} ACTIVE NODES</div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 text-[9px] text-[#cbd5e1] pt-1 border-t border-[#1e293b]">
          <span>DMG: {(featMods.damageMult * 100).toFixed(0)}%</span>
          <span>·</span>
          <span>HEAT GEN: {(featMods.heatGenMult * 100).toFixed(0)}%</span>
          <span>·</span>
          <span>
            SHIELD Δ:{' '}
            {featMods.shieldCapDelta >= 0
              ? `+${featMods.shieldCapDelta}`
              : featMods.shieldCapDelta}
          </span>
          <span>·</span>
          <span>
            ARMOR Δ:{' '}
            {featMods.armorDurabilityDelta >= 0
              ? `+${featMods.armorDurabilityDelta}`
              : featMods.armorDurabilityDelta}
          </span>
          <span>·</span>
          <span>SPEED: {(featMods.moveSpeedMult * 100).toFixed(0)}%</span>
          <span>·</span>
          <span>CD: {(featMods.cooldownMult * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Feat Node Socket List */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#7dd3fc]">
          FEAT NODES — SOCKET GEMS TO UNLOCK (UNSOCKET REFUNDS GEMS TO INVENTORY)
        </div>

        {filteredFeats.map((feat) => {
          const isEquipped = state.equippedFeats.includes(feat.id);
          const isAvailable = isFeatNodeAvailable(state, feat);
          const hwCheck = doesPilotMeetFeatEquipmentRequirement(state, feat);
          const skillDef = PILOT_SKILL_DEFINITIONS.find((s) => s.id === feat.requiredSkillId);
          const tierCount = getEquippedFeatCountByTier(state, feat.tier);
          const tierMax = FEAT_TIER_MAX_SLOTS[feat.tier];
          const isTierFull = !isEquipped && tierCount >= tierMax;

          const hasAllGems = feat.gemSockets.every(
            (req) => getInventoryGemCount(state, req.gemId) >= req.count
          );

          return (
            <div
              key={feat.id}
              className={`rounded-lg border p-2.5 transition-colors ${
                isEquipped
                  ? hwCheck.met
                    ? 'border-emerald-400/60 bg-emerald-950/20'
                    : 'border-amber-400/60 bg-amber-950/20'
                  : isAvailable && !isTierFull
                    ? 'border-[#1e293b] bg-[#0b1320]'
                    : 'border-[#1e293b]/50 bg-[#070b12]/70 opacity-75'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1e293b] text-[#7dd3fc]">
                      TIER {feat.tier} ({tierCount}/{tierMax})
                    </span>
                    <span className="text-[10.5px] font-bold text-[#f8fafc] uppercase">
                      {feat.name}
                    </span>
                    {feat.synergyCategory && (
                      <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#1e293b] text-[#94a3b8]">
                        {feat.synergyCategory}
                      </span>
                    )}
                    {feat.loadStepUp && (
                      <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold">
                        +{feat.loadStepUp} LOAD STEP
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] text-emerald-300 mt-1">
                    + {feat.gainDescription}
                  </div>
                  <div className="text-[9px] text-amber-300/90 mt-0.5">
                    − {feat.costDescription}
                  </div>
                  <div className="text-[8.5px] text-[#94a3b8] mt-1">
                    REQ: {skillDef?.name.toUpperCase()} LV {feat.requiredSkillLevel} ·{' '}
                    <span className={hwCheck.met ? 'text-emerald-300' : 'text-amber-300'}>
                      {hwCheck.reason}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    !isEquipped &&
                    (!progressionUnlocked || !isAvailable || !hasAllGems || isTierFull)
                  }
                  onClick={() => handleToggleFeatSocket(feat.id)}
                  className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                    isEquipped
                      ? 'bg-amber-500/20 border border-amber-400/60 text-amber-200 hover:bg-amber-500/30 cursor-pointer'
                      : isTierFull
                        ? 'bg-[#1e293b] text-amber-400/70 cursor-not-allowed'
                        : progressionUnlocked && isAvailable && hasAllGems
                          ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/30 cursor-pointer'
                          : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  {isEquipped
                    ? 'UNSOCKET (REFUND)'
                    : isTierFull
                      ? `TIER ${feat.tier} FULL (${tierCount}/${tierMax})`
                      : 'SOCKET GEMS'}
                </button>
              </div>

              {/* Gem Socket Requirements */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-[#1e293b]/70">
                <span className="text-[8.5px] text-[#64748b] uppercase font-bold">
                  SOCKET COST:
                </span>
                {feat.gemSockets.map((req, idx) => {
                  const gDef = GEMSTONE_REGISTRY[req.gemId];
                  const have = getInventoryGemCount(state, req.gemId);
                  const enough = isEquipped || have >= req.count;
                  return (
                    <span
                      key={`${feat.id}-sock-${idx}`}
                      className={`inline-flex items-center gap-1 text-[8.5px] px-1.5 py-0.5 rounded border ${
                        isEquipped
                          ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                          : enough
                            ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200'
                            : 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                      }`}
                    >
                      {gDef?.iconBase64 ? (
                        <SpriteCanvasIcon
                          base64={gDef.iconBase64}
                          sizeClass="w-3 h-3 shrink-0"
                        />
                      ) : (
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: gDef?.hexColor || '#38bdf8' }}
                        />
                      )}
                      {req.count}× {gDef?.name || req.gemId}
                      {!isEquipped && ` (${have})`}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
