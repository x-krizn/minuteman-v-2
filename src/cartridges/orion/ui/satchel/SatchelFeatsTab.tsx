/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  computeEffectiveLoadCapacity,
  computeEffectivePlayerLightTiles,
  computeInterfaceFeatModifiers,
  CONSTELLATION_DISCIPLINE_ARMS,
  CONSTELLATION_TIER_RADII,
  doesPilotMeetFeatEquipmentRequirement,
  FEAT_CONSTELLATION_EDGES,
  FEAT_CONSTELLATION_NODES,
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
  GemId,
  OrionState,
  PilotSkillId,
} from '../../types';
import { ORION_HEX_BLUEPRINT_BASE64 } from '../hud/titleMenuAssets';
import { SpriteCanvasIcon } from './SatchelCanvases';

/**
 * Props for `SatchelFeatsTab`, the interactive 96-node 6-Arm Hexagonal Feat Constellation.
 * Supports the React overlay HUD and mutates `state: OrionState` when funding skills or socketing feats.
 */
export interface SatchelFeatsTabProps {
  state: OrionState;
  isCheatMode?: boolean;
  onResume?: () => void;
  featTierFilter?: FeatTier | 'ALL';
  setFeatTierFilter?: React.Dispatch<React.SetStateAction<FeatTier | 'ALL'>>;
  featSynergyFilter?: FeatSynergyCategory | 'ALL';
  setFeatSynergyFilter?: React.Dispatch<React.SetStateAction<FeatSynergyCategory | 'ALL'>>;
  initialFocusFeatId?: string | null;
  onClearFocusFeatId?: () => void;
  setToast?: (msg: string) => void;
}

const FEAT_TIERS: FeatTier[] = ['I', 'II', 'III', 'IV', 'V'];

type ConstellationFilterMode = 'all' | 'prereq' | 'socketed' | 'available';

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

/**
 * Renders the unified 96-Node 6-Arm Hexagonal Feat Constellation (`[SHIFT]` -> `FEATS`).
 * Every canonical feat lives directly on the pan-and-zoom hexagonal lattice, paired with a
 * single-scroll side inspector for equipment prerequisites, handling proficiency, and gem socketing.
 */
export const SatchelFeatsTab: React.FC<SatchelFeatsTabProps> = ({
  state,
  initialFocusFeatId,
  onClearFocusFeatId,
  setToast,
}) => {
  const [, setTick] = useState(0);
  const [selectedFeatId, setSelectedFeatId] = useState<string>(() => {
    if (initialFocusFeatId && FRAME_FEAT_CATALOG.some((f) => f.id === initialFocusFeatId)) {
      return initialFocusFeatId;
    }
    return state.equippedFeats?.[0] || 'booster_evasion';
  });
  const [activeArmFilter, setActiveArmFilter] = useState<PilotSkillId | 'ALL'>('ALL');
  const [constellationFilter, setConstellationFilter] =
    useState<ConstellationFilterMode>('all');
  const [showSkillsDrawer, setShowSkillsDrawer] = useState<boolean>(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState<boolean>(false);

  // Pan & Zoom state for the 96-node SVG constellation
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    moved: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0,
    moved: false,
  });

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

  // Focus & pan to `initialFocusFeatId` when jumping from Loadout / Inventory
  useEffect(() => {
    if (!initialFocusFeatId) return;
    const targetNode = FEAT_CONSTELLATION_NODES.find(
      (n) => n.feat.id === initialFocusFeatId
    );
    if (targetNode) {
      setSelectedFeatId(targetNode.feat.id);
      setZoom(1.45);
      setPan({ x: -targetNode.x * 0.65, y: -targetNode.y * 0.65 });
      if (onClearFocusFeatId) onClearFocusFeatId();
    }
  }, [initialFocusFeatId, onClearFocusFeatId]);

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

  // Compute node states for all 96 feats on the constellation
  const enrichedNodes = useMemo(() => {
    return FEAT_CONSTELLATION_NODES.map((node) => {
      const isEquipped = (state.equippedFeats || []).includes(node.feat.id);
      const isAvailable = isFeatNodeAvailable(state, node.feat);
      const hwCheck = doesPilotMeetFeatEquipmentRequirement(state, node.feat);
      const hasAllGems = node.feat.gemSockets.every(
        (req) => getInventoryGemCount(state, req.gemId) >= req.count
      );
      const tierCount = getEquippedFeatCountByTier(state, node.tier);
      const tierMax = FEAT_TIER_MAX_SLOTS[node.tier];
      const isTierFull = !isEquipped && tierCount >= tierMax;
      const canSocketNow =
        !isEquipped && progressionUnlocked && isAvailable && hasAllGems && !isTierFull;

      const matchesArm =
        activeArmFilter === 'ALL' ||
        node.skillId === activeArmFilter ||
        node.isCoreNode;

      let matchesMode = true;
      if (constellationFilter === 'prereq') {
        matchesMode = node.handlingRole === 'prerequisite';
      } else if (constellationFilter === 'socketed') {
        matchesMode = isEquipped;
      } else if (constellationFilter === 'available') {
        matchesMode = canSocketNow || isEquipped;
      }

      return {
        ...node,
        isEquipped,
        isAvailable,
        hwCheck,
        hasAllGems,
        isTierFull,
        canSocketNow,
        isHighlighted: matchesArm && matchesMode,
      };
    });
  }, [
    state,
    state.equippedFeats,
    state.pilotSkills,
    state.level,
    state.inventorySlots,
    progressionUnlocked,
    activeArmFilter,
    constellationFilter,
  ]);

  const nodeById = useMemo(() => {
    const map = new Map<string, (typeof enrichedNodes)[number]>();
    for (const n of enrichedNodes) {
      map.set(n.feat.id, n);
    }
    return map;
  }, [enrichedNodes]);

  const selectedNode =
    nodeById.get(selectedFeatId) || enrichedNodes[0];

  const navigableNodes = useMemo(() => {
    const list = enrichedNodes.filter((n) => n.isHighlighted);
    return list.length > 0 ? list : enrichedNodes;
  }, [enrichedNodes]);

  const handleCycleNode = (delta: number) => {
    soundSystem.playMenuBeep();
    const curIdx = navigableNodes.findIndex((n) => n.feat.id === selectedNode.feat.id);
    const nextIdx =
      curIdx < 0
        ? 0
        : (curIdx + delta + navigableNodes.length) % navigableNodes.length;
    const nextNode = navigableNodes[nextIdx];
    if (nextNode) {
      setSelectedFeatId(nextNode.feat.id);
    }
  };

  const handleFocusArm = (skillId: PilotSkillId | 'ALL') => {
    soundSystem.playSelect();
    setActiveArmFilter(skillId);
    if (skillId === 'ALL') {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      return;
    }
    const armMeta = CONSTELLATION_DISCIPLINE_ARMS.find((a) => a.skillId === skillId);
    if (armMeta) {
      const rad = (armMeta.angleDeg * Math.PI) / 180;
      const focusR = 165;
      setZoom(1.38);
      setPan({
        x: Number((-Math.cos(rad) * focusR * 0.65).toFixed(1)),
        y: Number((-Math.sin(rad) * focusR * 0.65).toFixed(1)),
      });
      const firstInArm = enrichedNodes.find(
        (n) => !n.isCoreNode && n.skillId === skillId && n.tier === 'I'
      );
      if (firstInArm) {
        setSelectedFeatId(firstInArm.feat.id);
      }
    }
  };

  const handleAdjustCheatLevel = (delta: number) => {
    const nextLevel = Math.max(1, Math.min(20, (state.level || 1) + delta));
    state.level = nextLevel;
    syncStateGates(state);
    soundSystem.playSelect();
    notifyToast(`CHEAT: PILOT LEVEL SET TO CLVL ${nextLevel}`);
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

  // Compute dynamic SVG viewBox from zoom & pan
  const baseHalfSpan = 355;
  const halfSpan = baseHalfSpan / zoom;
  const vbMinX = -halfSpan - pan.x;
  const vbMinY = -halfSpan - pan.y;
  const vbSize = halfSpan * 2;

  const selectedSkillDef = PILOT_SKILL_DEFINITIONS.find(
    (s) => s.id === selectedNode.feat.requiredSkillId
  );
  const selectedSkillLevel = skillsMap[selectedNode.feat.requiredSkillId]?.level || 1;
  const selectedTierUsed = getEquippedFeatCountByTier(state, selectedNode.tier);
  const selectedTierCap = FEAT_TIER_MAX_SLOTS[selectedNode.tier];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden text-[10px]">
      {/* Top Compact Control Bar: Tier Slot Counters + Discipline Arm Jump + Pilot Skill Drawer Toggle */}
      <div className="shrink-0 bg-[#080d16] border border-[#1e293b] rounded-xs px-2 py-1.5 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[10px] text-[#f8fafc] tracking-wide">
              96-NODE HEX FEAT CONSTELLATION
            </span>
            <span className="text-[8.5px] text-[#94a3b8]">
              SOCKETED: <b className="text-[#38bdf8]">{state.equippedFeats.length}/20</b> · LOAD CAP:{' '}
              <b className="text-[#4ade80] uppercase">{effectiveLoad}</b> · LIGHT:{' '}
              <b className="text-[#fde047]">{effectiveLightTiles}T</b>
            </span>
            {isCheatMode && (
              <span className="inline-flex items-center gap-1 text-[8.5px] text-amber-300">
                CLVL {state.level}
                <button
                  type="button"
                  onClick={() => handleAdjustCheatLevel(-1)}
                  className="px-1 bg-amber-950/60 border border-amber-500/40 rounded-xs cursor-pointer"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustCheatLevel(1)}
                  className="px-1 bg-amber-950/60 border border-amber-500/40 rounded-xs cursor-pointer"
                >
                  +
                </button>
              </span>
            )}
          </div>

          {/* Per-Tier Capacity Summary */}
          <div className="flex items-center gap-1 text-[8px] font-mono tabular-nums">
            {FEAT_TIERS.map((tier) => {
              const used = getEquippedFeatCountByTier(state, tier);
              const cap = FEAT_TIER_MAX_SLOTS[tier];
              return (
                <span
                  key={tier}
                  className={`px-1.5 py-0.5 rounded-xs border ${
                    used >= cap
                      ? 'border-amber-400/60 bg-amber-950/30 text-amber-200 font-bold'
                      : used > 0
                        ? 'border-[#38bdf8]/40 bg-[#0c243c] text-[#7dd3fc]'
                        : 'border-[#1e293b] bg-[#05080f] text-[#64748b]'
                  }`}
                >
                  T{tier}:{used}/{cap}
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                setShowSkillsDrawer((v) => !v);
              }}
              className={`ml-1 px-2 py-0.5 rounded-xs font-bold border cursor-pointer transition-colors whitespace-nowrap ${
                showSkillsDrawer
                  ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                  : 'bg-[#0f172a] text-[#7dd3fc] border-[#38bdf8]/50 hover:bg-[#1e293b]'
              }`}
            >
              {showSkillsDrawer ? '▾ HIDE PILOT SKILLS' : '▸ LEVEL PILOT SKILLS (GEMS)'}
            </button>
          </div>
        </div>

        {/* 6 Discipline Arm Quick-Focus Bar */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e293b]/80 overflow-x-auto">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleFocusArm('ALL')}
              className={`px-1.5 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer whitespace-nowrap ${
                activeArmFilter === 'ALL'
                  ? 'bg-[#f8fafc] text-[#05070a] border-white'
                  : 'bg-[#05080f] text-[#94a3b8] border-[#1e293b] hover:text-white'
              }`}
            >
              ALL 6 ARMS (96)
            </button>
            {CONSTELLATION_DISCIPLINE_ARMS.map((arm) => {
              const lv = skillsMap[arm.skillId]?.level || 1;
              const isSelected = activeArmFilter === arm.skillId;
              return (
                <button
                  key={arm.skillId}
                  type="button"
                  onClick={() => handleFocusArm(arm.skillId)}
                  className="px-1.5 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: isSelected ? arm.color : '#05080f',
                    color: isSelected ? '#05070a' : arm.color,
                    borderColor: isSelected ? arm.color : `${arm.color}44`,
                  }}
                >
                  {arm.compassCode} · {arm.skillId.toUpperCase()} (LV.{lv})
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Pilot Skills Gemstone Funding Drawer */}
        {showSkillsDrawer && (
          <div className="pt-1.5 border-t border-[#1e293b] grid grid-cols-2 sm:grid-cols-3 gap-1">
            {PILOT_SKILL_DEFINITIONS.map((skill) => {
              const currentLv = skillsMap[skill.id]?.level || 1;
              const armMeta = CONSTELLATION_DISCIPLINE_ARMS.find(
                (a) => a.skillId === skill.id
              );
              return (
                <div
                  key={skill.id}
                  className="p-1.5 rounded-xs bg-[#05080f] border border-[#1e293b] flex flex-col justify-between gap-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-[8px] font-bold truncate"
                      style={{ color: armMeta?.color || '#38bdf8' }}
                    >
                      {skill.id.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isCheatMode && (
                        <button
                          type="button"
                          onClick={() => handleAdjustCheatSkillLevel(skill.id, -1)}
                          className="px-1 bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[7.5px] rounded-xs cursor-pointer"
                        >
                          -
                        </button>
                      )}
                      <span className="text-[8px] font-bold text-[#f8fafc] tabular-nums">
                        LV {currentLv}/20
                      </span>
                      {isCheatMode && (
                        <button
                          type="button"
                          onClick={() => handleAdjustCheatSkillLevel(skill.id, 1)}
                          className="px-1 bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[7.5px] rounded-xs cursor-pointer"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {skill.fundingGems.map((gemId) => {
                      const gDef = GEMSTONE_REGISTRY[gemId];
                      const have = getInventoryGemCount(state, gemId);
                      const canSpend = progressionUnlocked && currentLv < 20 && have > 0;
                      return (
                        <button
                          key={`${skill.id}-fund-${gemId}`}
                          type="button"
                          disabled={!canSpend}
                          onClick={() => handleFundSkillWithGem(skill.id, gemId)}
                          className={`px-1 py-0.5 rounded-xs text-[7.5px] font-bold inline-flex items-center gap-0.5 border ${
                            canSpend
                              ? 'bg-emerald-950/60 border-emerald-400/60 text-emerald-200 hover:bg-emerald-900/60 cursor-pointer'
                              : 'bg-[#080d16] border-[#1e293b] text-[#475569] cursor-not-allowed'
                          }`}
                        >
                          {gDef?.iconBase64 && (
                            <SpriteCanvasIcon
                              base64={gDef.iconBase64}
                              sizeClass="w-2.5 h-2.5"
                            />
                          )}
                          +1 ({have})
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Split Workspace: Left Interactive Constellation Canvas + Right Single-Scroll Node Inspector */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-1.5 overflow-hidden">
        {/* LEFT PANE (7 Columns): Pan-and-Zoom 96-Node 6-Arm Hexagonal Constellation */}
        <div className="col-span-7 min-h-0 flex flex-col bg-[#05080f] border border-[#1e293b] rounded-xs relative overflow-hidden">
          {/* Top-Left Filter Overlay */}
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-wrap items-center gap-1 pointer-events-auto">
            {(
              [
                { id: 'all', label: 'ALL (96)' },
                { id: 'prereq', label: 'EQP PREREQS' },
                { id: 'socketed', label: `ACTIVE (${state.equippedFeats.length})` },
                { id: 'available', label: 'UNLOCKABLE' },
              ] as Array<{ id: ConstellationFilterMode; label: string }>
            ).map((fOpt) => (
              <button
                key={fOpt.id}
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setConstellationFilter(fOpt.id);
                }}
                className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                  constellationFilter === fOpt.id
                    ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                    : 'bg-[#080d16]/90 text-[#94a3b8] border-[#1e293b] hover:text-white'
                }`}
              >
                {fOpt.label}
              </button>
            ))}
          </div>

          {/* Bottom-Left Zoom & Reset Controls */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between gap-1 pointer-events-auto">
            <div className="flex items-center gap-1 bg-[#080d16]/90 border border-[#1e293b] rounded-xs p-0.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.2).toFixed(2))))}
                className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#e2e8f0] rounded-xs text-[8px] font-bold cursor-pointer"
                title="Zoom Out"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#7dd3fc] rounded-xs text-[7.5px] font-bold cursor-pointer"
                title="Reset Pan & Zoom"
              >
                {Math.round(zoom * 100)}% · FIT
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.2).toFixed(2))))}
                className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#e2e8f0] rounded-xs text-[8px] font-bold cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowBlueprintModal((v) => !v)}
              className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                showBlueprintModal
                  ? 'bg-amber-400 text-[#05070a] border-amber-300'
                  : 'bg-[#080d16]/90 text-[#94a3b8] border-[#1e293b] hover:text-white'
              }`}
            >
              {showBlueprintModal ? 'CLOSE REF' : 'REF DIAGRAM'}
            </button>
          </div>

          {showBlueprintModal ? (
            <div className="flex-1 flex flex-col items-center justify-center p-3 bg-[#05080f]">
              <img
                src={ORION_HEX_BLUEPRINT_BASE64}
                alt="6-Finger Hexagonal Feat Grid Blueprint"
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain rounded border border-[#1e293b] bg-white/95 p-1"
              />
            </div>
          ) : (
            /* Interactive Draggable & Zoomable 96-Node Hexagonal Constellation SVG */
            <svg
              viewBox={`${vbMinX.toFixed(1)} ${vbMinY.toFixed(1)} ${vbSize.toFixed(1)} ${vbSize.toFixed(1)}`}
              className="w-full h-full flex-1 select-none cursor-grab active:cursor-grabbing"
              role="img"
              aria-label="96-Node 6-Arm Hexagonal Feat Constellation"
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.16 : -0.16;
                setZoom((z) => Math.max(0.65, Math.min(2.4, Number((z + delta).toFixed(2)))));
              }}
              onPointerDown={(e) => {
                dragRef.current = {
                  active: true,
                  startX: e.clientX,
                  startY: e.clientY,
                  origPanX: pan.x,
                  origPanY: pan.y,
                  moved: false,
                };
              }}
              onPointerMove={(e) => {
                if (!dragRef.current.active) return;
                const dx = e.clientX - dragRef.current.startX;
                const dy = e.clientY - dragRef.current.startY;
                if (Math.hypot(dx, dy) > 4) {
                  dragRef.current.moved = true;
                }
                const scaleFactor = (2.1 / zoom);
                setPan({
                  x: Math.max(-280, Math.min(280, dragRef.current.origPanX + dx * scaleFactor)),
                  y: Math.max(-280, Math.min(280, dragRef.current.origPanY + dy * scaleFactor)),
                });
              }}
              onPointerUp={() => {
                dragRef.current.active = false;
              }}
              onPointerLeave={() => {
                dragRef.current.active = false;
              }}
            >
              {/* Concentric Tier Rings (Tier I..V) */}
              {FEAT_TIERS.map((tier) => {
                const r = CONSTELLATION_TIER_RADII[tier];
                return (
                  <g key={`ring-${tier}`}>
                    <circle
                      cx="0"
                      cy="0"
                      r={r}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="0.9"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="0"
                      y={-r + 8}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="7"
                      fontWeight="bold"
                    >
                      TIER {tier}
                    </text>
                  </g>
                );
              })}

              {/* 6 Radial Discipline Spine Guides & Outer Sector Headers */}
              {CONSTELLATION_DISCIPLINE_ARMS.map((arm) => {
                const rad = (arm.angleDeg * Math.PI) / 180;
                const x1 = Math.cos(rad) * 32;
                const y1 = Math.sin(rad) * 32;
                const x2 = Math.cos(rad) * 325;
                const y2 = Math.sin(rad) * 325;
                const labelX = Math.cos(rad) * 342;
                const labelY = Math.sin(rad) * 342;
                return (
                  <g key={`arm-guide-${arm.skillId}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={arm.color}
                      strokeOpacity="0.18"
                      strokeWidth="1.2"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={arm.color}
                      fontSize="8.5"
                      fontWeight="bold"
                    >
                      {arm.compassCode} · {arm.skillId.toUpperCase()}
                    </text>
                  </g>
                );
              })}

              {/* Directed Constellation Edges Connecting Prerequisite & Tier Nodes */}
              {FEAT_CONSTELLATION_EDGES.map((edge, idx) => {
                const fromNode = nodeById.get(edge.fromFeatId);
                const toNode = nodeById.get(edge.toFeatId);
                if (!fromNode || !toNode) return null;
                const bothEquipped = fromNode.isEquipped && toNode.isEquipped;
                const touchesSelected =
                  selectedNode.feat.id === fromNode.feat.id ||
                  selectedNode.feat.id === toNode.feat.id;
                const dimmed = !fromNode.isHighlighted && !toNode.isHighlighted;

                return (
                  <line
                    key={`edge-${idx}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={
                      touchesSelected
                        ? '#fde047'
                        : bothEquipped
                          ? edge.color
                          : '#1e293b'
                    }
                    strokeWidth={touchesSelected ? '1.8' : bothEquipped ? '1.5' : '0.85'}
                    strokeOpacity={dimmed ? 0.15 : touchesSelected ? 0.95 : bothEquipped ? 0.85 : 0.45}
                    strokeDasharray={edge.kind === 'bridge' ? '2 2' : undefined}
                  />
                );
              })}

              {/* Render All 96 Feat Hex Nodes */}
              {enrichedNodes.map((node) => {
                const isSelected = selectedNode.feat.id === node.feat.id;
                const hexR = node.isCoreNode ? 18 : isSelected ? 14.5 : 12;
                const fill = node.isEquipped
                  ? node.armColor
                  : isSelected
                    ? '#1e3a8a'
                    : node.canSocketNow
                      ? '#0f291e'
                      : node.isAvailable
                        ? '#111c2d'
                        : '#070b12';
                const stroke = isSelected
                  ? '#fde047'
                  : node.isEquipped
                    ? '#ffffff'
                    : node.canSocketNow
                      ? '#4ade80'
                      : node.handlingRole === 'prerequisite'
                        ? node.armColor
                        : '#334155';

                return (
                  <g
                    key={node.feat.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => {
                      if (dragRef.current.moved) return;
                      soundSystem.playSelect();
                      setSelectedFeatId(node.feat.id);
                    }}
                    className="cursor-pointer"
                    opacity={node.isHighlighted || isSelected ? 1 : 0.22}
                  >
                    {/* Outer selection or prerequisite halo */}
                    {(isSelected || node.handlingRole === 'prerequisite') && (
                      <polygon
                        points={getHexPolygonPoints(0, 0, hexR + 2.8)}
                        fill="none"
                        stroke={isSelected ? '#fde047' : node.armColor}
                        strokeWidth={isSelected ? '1.6' : '0.8'}
                        strokeOpacity={isSelected ? 0.95 : 0.55}
                      />
                    )}

                    {/* Main Hex Cell */}
                    <polygon
                      points={getHexPolygonPoints(0, 0, hexR)}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? '2' : node.isEquipped ? '1.5' : '1'}
                    />

                    {/* Tier Numeral or Core Star */}
                    <text
                      x="0"
                      y={node.handlingRole === 'prerequisite' ? '0.5' : '2.5'}
                      textAnchor="middle"
                      fill={
                        node.isEquipped
                          ? '#020617'
                          : isSelected
                            ? '#fef08a'
                            : '#f8fafc'
                      }
                      fontSize={node.isCoreNode ? '8' : '6.8'}
                      fontWeight="bold"
                    >
                      {node.isCoreNode ? 'CORE' : node.tier}
                    </text>

                    {/* Equipment Prerequisite / Load Step Sub-tag inside hex */}
                    {node.handlingRole === 'prerequisite' && !node.isCoreNode && (
                      <text
                        x="0"
                        y="6.8"
                        textAnchor="middle"
                        fill={node.isEquipped ? '#020617' : '#fde047'}
                        fontSize="4.5"
                        fontWeight="bold"
                      >
                        {node.feat.loadStepUp ? `+${node.feat.loadStepUp}LD` : 'EQP'}
                      </text>
                    )}

                    {/* Show Feat Name label when selected or zoomed in */}
                    {(isSelected || zoom >= 1.35) && (
                      <text
                        x="0"
                        y={hexR + 8}
                        textAnchor="middle"
                        fill={isSelected ? '#fde047' : '#cbd5e1'}
                        fontSize="5.8"
                        fontWeight="bold"
                      >
                        {node.feat.name.length > 18
                          ? `${node.feat.name.slice(0, 16)}..`
                          : node.feat.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* RIGHT PANE (5 Columns, Single Vertical Scroll): Selected Feat Node & Equipment Handling Inspector */}
        <div className="col-span-5 min-h-0 flex flex-col bg-[#080d16] border border-[#1e293b] rounded-xs p-2 overflow-y-auto space-y-2">
          {/* Prev / Next Node Stepper */}
          <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-[#1e293b] shrink-0">
            <button
              type="button"
              onClick={() => handleCycleNode(-1)}
              className="px-2 py-0.5 rounded-xs bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] text-[8px] font-bold text-[#38bdf8] cursor-pointer"
            >
              ◀ PREV
            </button>
            <span className="text-[8px] font-bold text-[#94a3b8] tabular-nums">
              NODE #{selectedNode.index + 1} / {enrichedNodes.length} · {selectedNode.compassCode}
            </span>
            <button
              type="button"
              onClick={() => handleCycleNode(1)}
              className="px-2 py-0.5 rounded-xs bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] text-[8px] font-bold text-[#38bdf8] cursor-pointer"
            >
              NEXT ▶
            </button>
          </div>

          {/* Selected Feat Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span
                className="text-[8px] font-bold uppercase"
                style={{ color: selectedNode.armColor }}
              >
                {selectedNode.skillId.toUpperCase()} · TIER {selectedNode.tier} (
                {selectedTierUsed}/{selectedTierCap} SLOTS)
              </span>
              <span
                className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-xs ${
                  selectedNode.isEquipped
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50'
                    : selectedNode.canSocketNow
                      ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-500/50'
                      : 'bg-[#0f172a] text-[#94a3b8] border border-[#1e293b]'
                }`}
              >
                {selectedNode.isEquipped
                  ? 'SOCKETED & ACTIVE'
                  : selectedNode.canSocketNow
                    ? 'READY TO SOCKET'
                    : 'LOCKED / UNSOCKETED'}
              </span>
            </div>

            <div className="text-[11px] font-bold text-[#f8fafc] uppercase leading-tight">
              {selectedNode.feat.name}
            </div>

            <div className="text-[8px] text-[#94a3b8]">
              SKILL PREREQ:{' '}
              <b
                className={
                  selectedSkillLevel >= selectedNode.feat.requiredSkillLevel
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }
              >
                {selectedSkillDef?.name || selectedNode.skillId} LV{' '}
                {selectedNode.feat.requiredSkillLevel} (CURRENT: LV {selectedSkillLevel})
              </b>
            </div>
          </div>

          {/* Equipment Handling & Prerequisite Unlocks Box */}
          <div className="p-2 rounded-xs bg-[#05080f] border border-[#1e293b] space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] font-bold text-[#fde047] uppercase">
                {selectedNode.handlingRole === 'prerequisite'
                  ? '★ EQUIPMENT PREREQUISITE UNLOCK'
                  : '⚙ EQUIPMENT HANDLING PROFICIENCY'}
              </span>
              {selectedNode.feat.loadStepUp && (
                <span className="text-[7.5px] font-bold text-emerald-300">
                  +{selectedNode.feat.loadStepUp} LOAD STEP (+22 WT)
                </span>
              )}
            </div>
            <div className="text-[8.5px] text-[#e2e8f0] leading-snug">
              {selectedNode.handlingSummary}
            </div>
            <div className="text-[7.5px] text-[#94a3b8]">
              AFFECTED GEAR:{' '}
              <span className="text-[#7dd3fc]">
                {selectedNode.targetEquipmentClasses.join(' · ')}
              </span>
            </div>
            <div className="text-[7.5px] pt-0.5 border-t border-[#1e293b]/70">
              LOADOUT CHECK:{' '}
              <span
                className={
                  selectedNode.hwCheck.met ? 'text-emerald-300 font-bold' : 'text-amber-300'
                }
              >
                {selectedNode.hwCheck.reason} ({selectedNode.hwCheck.met ? 'MET' : 'UNMET'})
              </span>
            </div>
          </div>

          {/* Combat Effect & Trade-Off */}
          <div className="p-2 rounded-xs bg-[#05080f] border border-[#1e293b] space-y-1">
            <div className="text-[8.5px] text-emerald-300 leading-snug">
              + {selectedNode.feat.gainDescription}
            </div>
            <div className="text-[8px] text-amber-300/90 leading-snug">
              − {selectedNode.feat.costDescription}
            </div>
          </div>

          {/* Gemstone Socket Requirements */}
          <div className="space-y-1">
            <div className="text-[8px] font-bold text-[#94a3b8] uppercase">
              GEM SOCKET REQUIREMENTS (REFUNDED ON UNSOCKET):
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {selectedNode.feat.gemSockets.map((req, idx) => {
                const gDef = GEMSTONE_REGISTRY[req.gemId];
                const have = getInventoryGemCount(state, req.gemId);
                const enough = selectedNode.isEquipped || have >= req.count;
                return (
                  <span
                    key={`${selectedNode.feat.id}-sock-${idx}`}
                    className={`inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-xs border tabular-nums ${
                      selectedNode.isEquipped
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                        : enough
                          ? 'border-cyan-500/40 bg-cyan-950/25 text-cyan-200'
                          : 'border-rose-500/40 bg-rose-950/25 text-rose-300'
                    }`}
                  >
                    {gDef?.iconBase64 && (
                      <SpriteCanvasIcon
                        base64={gDef.iconBase64}
                        sizeClass="w-3 h-3 shrink-0"
                      />
                    )}
                    {req.count}× {gDef?.name || req.gemId}
                    {!selectedNode.isEquipped && ` (HAVE ${have})`}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button: Socket / Unsocket */}
          <button
            type="button"
            disabled={
              !selectedNode.isEquipped &&
              (!progressionUnlocked ||
                !selectedNode.isAvailable ||
                !selectedNode.hasAllGems ||
                selectedNode.isTierFull)
            }
            onClick={() => handleToggleFeatSocket(selectedNode.feat.id)}
            className={`w-full py-1.5 px-2.5 rounded-xs text-[9px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
              selectedNode.isEquipped
                ? 'bg-amber-500/20 border border-amber-400/70 text-amber-200 hover:bg-amber-500/30 cursor-pointer'
                : selectedNode.isTierFull
                  ? 'bg-[#1e293b] text-amber-400/70 border border-amber-500/30 cursor-not-allowed'
                  : selectedNode.canSocketNow
                    ? 'bg-emerald-500/25 border border-emerald-400/70 text-emerald-200 hover:bg-emerald-500/35 cursor-pointer'
                    : 'bg-[#1e293b] text-[#64748b] border border-[#334155] cursor-not-allowed'
            }`}
          >
            {selectedNode.isEquipped
              ? 'UNSOCKET FEAT NODE (REFUND GEMS)'
              : selectedNode.isTierFull
                ? `TIER ${selectedNode.tier} SLOTS FULL (${selectedTierUsed}/${selectedTierCap})`
                : !progressionUnlocked
                  ? 'UNLOCKS AT LEVEL 6 (OR CHEAT MODE)'
                  : !selectedNode.isAvailable
                    ? `REQUIRES ${selectedNode.skillId.toUpperCase()} LV ${selectedNode.feat.requiredSkillLevel}`
                    : !selectedNode.hasAllGems
                      ? 'MISSING REQUIRED GEMSTONES'
                      : 'SOCKET GEMS INTO FEAT NODE'}
          </button>

          {/* Compact Total Active Modifiers Footer */}
          <div className="pt-1.5 border-t border-[#1e293b] text-[7.5px] text-[#94a3b8] space-y-0.5">
            <div className="font-bold text-[#7dd3fc]">
              ACTIVE CONSTELLATION RESONANCE ({state.equippedFeats.length} SOCKETED):
            </div>
            <div className="tabular-nums">
              DMG {(featMods.damageMult * 100).toFixed(0)}% · HEAT{' '}
              {(featMods.heatGenMult * 100).toFixed(0)}% · SHD{' '}
              {featMods.shieldCapDelta >= 0
                ? `+${featMods.shieldCapDelta}`
                : featMods.shieldCapDelta}{' '}
              · ARM{' '}
              {featMods.armorDurabilityDelta >= 0
                ? `+${featMods.armorDurabilityDelta}`
                : featMods.armorDurabilityDelta}{' '}
              · SPD {(featMods.moveSpeedMult * 100).toFixed(0)}% · CD{' '}
              {(featMods.cooldownMult * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
