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
  CONSTELLATION_UMBRELLAS,
  doesLoadoutMatchSpecialistStance,
  doesPilotMeetFeatEquipmentRequirement,
  evaluateActiveSpecialistStance,
  evaluateEmergentMetaClass,
  evaluateFeatChainPrerequisite,
  FEAT_CHAIN_NAMES,
  FEAT_CONSTELLATION_NODES,
  FEAT_TIER_MAX_SLOTS,
  findDependentDownstreamChainFeats,
  FRAME_FEAT_CATALOG,
  fundPilotSkillWithGem,
  GEMSTONE_REGISTRY,
  getEligibleSpecialistStances,
  getEquippedFeatCountByTier,
  getInventoryGemCount,
  getMaxSocketedFeatsForLevel,
  isFeatNodeAvailable,
  isStandardProgressionUnlocked,
  normalizeCanonicalFeatId,
  normalizePilotSkills,
  PILOT_SKILL_DEFINITIONS,
  setActiveSpecialistStance,
  SPECIALIST_STANCE_BY_FEAT_ID,
  SPECIALIST_STANCE_LIST,
  syncPostTutorialFrameLevel,
  toggleFeatNodeGemSocket,
} from '../../database/progression';
import {
  getOrionGraphicsSettings,
  notifyOrionStateChange,
  syncStateGates,
} from '../../systems';
import {
  ConstellationUmbrellaId,
  FeatChainId,
  FeatTier,
  GemId,
  OrionState,
  PilotSkillId,
} from '../../types';
import { ORION_HEX_BLUEPRINT_BASE64 } from '../hud/titleMenuAssets';
import { SpriteCanvasIcon } from './SatchelCanvases';

/**
 * Props for `SatchelFeatsTab`, the interactive 113-node Nested List Feat Navigator & Stance Selector.
 * Supports the React overlay HUD and mutates `state: OrionState` when funding skills, socketing feats, or switching stances.
 */
export interface SatchelFeatsTabProps {
  state: OrionState;
  isCheatMode?: boolean;
  initialFocusFeatId?: string | null;
  onClearFocusFeatId?: () => void;
  setToast?: (msg: string) => void;
}

type FeatListFilterMode =
  | 'all'
  | 'socketed'
  | 'available'
  | 'interface'
  | 'frame'
  | 'chains'
  | 'stances'
  | 'prereq';

/**
 * Renders the 113-Node Nested List Feat Navigator (`[SHIFT]` -> `FEATS`):
 * `Macro-Umbrella (Fighter / Scholar / Rogue) ▸ Discipline Sector (Warrior / Guardian / Wizard / Cleric / Marauder / Rogue) ▸ Chains (C-01..C-18), Core Tiers (I–V) & Specialist Stances`.
 * Also includes an explicit Stance Drop-Down Selector in the header bar for switching between `Base Weapon Moveset` and all currently eligible Specialist Stances.
 */
export const SatchelFeatsTab: React.FC<SatchelFeatsTabProps> = ({
  state,
  isCheatMode: propCheatMode,
  initialFocusFeatId,
  onClearFocusFeatId,
  setToast,
}) => {
  const devMode = getOrionGraphicsSettings().devModeEnabled;
  const [, setTick] = useState(0);
  const [selectedFeatId, setSelectedFeatId] = useState<string>(() => {
    if (initialFocusFeatId) {
      const norm = normalizeCanonicalFeatId(initialFocusFeatId);
      if (FRAME_FEAT_CATALOG.some((f) => f.id === norm)) {
        return norm;
      }
    }
    const firstEquipped = state.equippedFeats?.[0]
      ? normalizeCanonicalFeatId(state.equippedFeats[0])
      : 'booster_evasion';
    return FRAME_FEAT_CATALOG.some((f) => f.id === firstEquipped)
      ? firstEquipped
      : 'booster_evasion';
  });

  const [listFilter, setListFilter] = useState<FeatListFilterMode>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stanceDisciplineFilter, setStanceDisciplineFilter] = useState<'ALL' | PilotSkillId>(
    'ALL'
  );
  const [showSkillsDrawer, setShowSkillsDrawer] = useState<boolean>(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(
    Boolean(initialFocusFeatId)
  );

  // Accordion expansion states for the 3-level nested hierarchy:
  // Level 1: Umbrellas ('Fighter', 'Scholar', 'Rogue')
  const [expandedUmbrellas, setExpandedUmbrellas] = useState<
    Record<ConstellationUmbrellaId, boolean>
  >({
    Fighter: true,
    Scholar: true,
    Rogue: true,
  });

  // Level 2: Discipline Sectors ('Warrior', 'Guardian', 'Wizard', 'Cleric', 'Marauder', 'Rogue')
  const [expandedSectors, setExpandedSectors] = useState<
    Record<PilotSkillId, boolean>
  >({
    Warrior: true,
    Guardian: false,
    Wizard: false,
    Cleric: false,
    Marauder: false,
    Rogue: false,
  });

  // Level 3: Sub-groups inside a sector (`${skillId}:chains`, `${skillId}:core`, `${skillId}:stances`)
  const [expandedSubGroups, setExpandedSubGroups] = useState<
    Record<string, boolean>
  >({
    'Warrior:chains': true,
    'Warrior:core': true,
    'Warrior:stances': true,
    'Guardian:chains': true,
    'Guardian:core': true,
    'Guardian:stances': true,
    'Wizard:chains': true,
    'Wizard:core': true,
    'Wizard:stances': true,
    'Cleric:chains': true,
    'Cleric:core': true,
    'Cleric:stances': true,
    'Marauder:chains': true,
    'Marauder:core': true,
    'Marauder:stances': true,
    'Rogue:chains': true,
    'Rogue:core': true,
    'Rogue:stances': true,
  });

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
  const isCheatMode =
    propCheatMode !== undefined
      ? propCheatMode
      : devMode &&
        (state.room === '-4,0' || Boolean(state.bypassProgressionGates));
  const skillsMap = normalizePilotSkills(state.pilotSkills);
  const normalizedEquippedFeats = useMemo(
    () => (state.equippedFeats || []).map((id) => normalizeCanonicalFeatId(id)),
    [state.equippedFeats]
  );
  const maxFeatsForLevel = getMaxSocketedFeatsForLevel(
    state.level,
    Boolean(state.bypassProgressionGates)
  );
  const isLevelCapReached = normalizedEquippedFeats.length >= maxFeatsForLevel;
  const tierVUsed = getEquippedFeatCountByTier(state, 'V');
  const tierVCap = FEAT_TIER_MAX_SLOTS.V;

  const effectiveLoad = computeEffectiveLoadCapacity(
    state.traitLine,
    normalizedEquippedFeats,
    state
  );
  const featMods = computeInterfaceFeatModifiers(normalizedEquippedFeats);
  const effectiveLightTiles = computeEffectivePlayerLightTiles(state);
  const metaClassEval = useMemo(
    () => evaluateEmergentMetaClass(state),
    [state, normalizedEquippedFeats, state.equipmentSlots]
  );

  // Evaluate eligible & active Specialist Stances for the Broken-Up Stance Selector
  const eligibleStances = useMemo(
    () => getEligibleSpecialistStances(state),
    [state, normalizedEquippedFeats, state.equipmentSlots]
  );
  const eligibleStanceFeatIds = useMemo(
    () => new Set(eligibleStances.map((s) => s.featId)),
    [eligibleStances]
  );
  const socketedUnmetStances = useMemo(
    () =>
      SPECIALIST_STANCE_LIST.filter(
        (st) =>
          normalizedEquippedFeats.includes(st.featId) &&
          !eligibleStanceFeatIds.has(st.featId)
      ),
    [normalizedEquippedFeats, eligibleStanceFeatIds]
  );
  const catalogUnsocketedStances = useMemo(
    () =>
      SPECIALIST_STANCE_LIST.filter(
        (st) => !normalizedEquippedFeats.includes(st.featId)
      ),
    [normalizedEquippedFeats]
  );
  const filteredReadyStances = useMemo(
    () =>
      eligibleStances.filter(
        (st) =>
          stanceDisciplineFilter === 'ALL' ||
          st.skillId === stanceDisciplineFilter
      ),
    [eligibleStances, stanceDisciplineFilter]
  );
  const filteredSocketedUnmetStances = useMemo(
    () =>
      socketedUnmetStances.filter(
        (st) =>
          stanceDisciplineFilter === 'ALL' ||
          st.skillId === stanceDisciplineFilter
      ),
    [socketedUnmetStances, stanceDisciplineFilter]
  );
  const filteredCatalogUnsocketedStances = useMemo(
    () =>
      catalogUnsocketedStances.filter(
        (st) =>
          stanceDisciplineFilter === 'ALL' ||
          st.skillId === stanceDisciplineFilter
      ),
    [catalogUnsocketedStances, stanceDisciplineFilter]
  );
  const activeStanceEval = useMemo(
    () => evaluateActiveSpecialistStance(state),
    [state, normalizedEquippedFeats, state.equipmentSlots]
  );
  const activeStanceDropdownValue =
    activeStanceEval.active && activeStanceEval.stance
      ? activeStanceEval.stance.featId
      : 'base';

  // Enrich all 113 nodes with socket, prerequisite, and filter state
  const enrichedNodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FEAT_CONSTELLATION_NODES.map((node) => {
      const isEquipped = normalizedEquippedFeats.includes(node.feat.id);
      const chainEval = evaluateFeatChainPrerequisite(state, node.feat);
      const isAvailable = isFeatNodeAvailable(state, node.feat);
      const hwCheck = doesPilotMeetFeatEquipmentRequirement(state, node.feat);
      const hasAllGems = node.feat.gemSockets.every(
        (req) => getInventoryGemCount(state, req.gemId) >= req.count
      );
      const isTierVFull =
        !isEquipped && node.tier === 'V' && tierVUsed >= tierVCap;
      const isCapBlocked = !isEquipped && (isLevelCapReached || isTierVFull);
      const canSocketNow =
        !isEquipped &&
        progressionUnlocked &&
        isAvailable &&
        chainEval.met &&
        hasAllGems &&
        !isCapBlocked;

      let matchesMode = true;
      if (listFilter === 'chains') {
        matchesMode = Boolean(node.feat.chainId);
      } else if (listFilter === 'stances') {
        matchesMode = Boolean(node.feat.isSpecialistStance);
      } else if (listFilter === 'interface') {
        matchesMode = node.feat.rootDomain === 'interface';
      } else if (listFilter === 'frame') {
        matchesMode = node.feat.rootDomain === 'frame';
      } else if (listFilter === 'prereq') {
        matchesMode = node.handlingRole === 'prerequisite';
      } else if (listFilter === 'socketed') {
        matchesMode = isEquipped;
      } else if (listFilter === 'available') {
        matchesMode = canSocketNow || isEquipped;
      }

      let matchesSearch = true;
      if (q.length > 0) {
        const hay = [
          node.feat.name,
          node.feat.id,
          node.feat.chainId || '',
          node.feat.chainName || '',
          node.feat.gainDescription,
          node.feat.costDescription,
          node.handlingSummary,
          node.skillId,
          node.umbrella,
          ...node.targetEquipmentClasses,
        ]
          .join(' ')
          .toLowerCase();
        matchesSearch = hay.includes(q);
      }

      return {
        ...node,
        isEquipped,
        chainEval,
        isAvailable,
        hwCheck,
        hasAllGems,
        isTierVFull,
        isCapBlocked,
        canSocketNow,
        isVisible: matchesMode && matchesSearch,
      };
    });
  }, [
    state,
    normalizedEquippedFeats,
    state.pilotSkills,
    state.level,
    state.inventorySlots,
    progressionUnlocked,
    listFilter,
    searchQuery,
    isLevelCapReached,
    tierVUsed,
    tierVCap,
  ]);

  const nodeById = useMemo(() => {
    const map = new Map<string, (typeof enrichedNodes)[number]>();
    for (const n of enrichedNodes) {
      map.set(n.feat.id, n);
    }
    return map;
  }, [enrichedNodes]);

  const selectedNode = nodeById.get(selectedFeatId) || enrichedNodes[0];

  // Auto-expand and open inspector when navigating from Loadout / Status
  useEffect(() => {
    if (!initialFocusFeatId) return;
    const normId = normalizeCanonicalFeatId(initialFocusFeatId);
    const targetNode = nodeById.get(normId);
    if (targetNode) {
      setSelectedFeatId(targetNode.feat.id);
      setIsInspectorOpen(true);
      setExpandedUmbrellas((prev) => ({
        ...prev,
        [targetNode.umbrella]: true,
      }));
      setExpandedSectors((prev) => ({
        ...prev,
        [targetNode.skillId]: true,
      }));
      const subKey = targetNode.feat.isSpecialistStance
        ? `${targetNode.skillId}:stances`
        : targetNode.feat.chainId
          ? `${targetNode.skillId}:chains`
          : `${targetNode.skillId}:core`;
      setExpandedSubGroups((prev) => ({
        ...prev,
        [subKey]: true,
      }));
      setTimeout(() => {
        rowRefs.current[targetNode.feat.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 60);
      if (onClearFocusFeatId) onClearFocusFeatId();
    }
  }, [initialFocusFeatId, nodeById, onClearFocusFeatId]);

  const dependentDownstreamNodes = useMemo(
    () => findDependentDownstreamChainFeats(state, selectedNode.feat),
    [state, normalizedEquippedFeats, selectedNode.feat]
  );

  const visibleNodes = useMemo(() => {
    const list = enrichedNodes.filter((n) => n.isVisible);
    return list.length > 0 ? list : enrichedNodes;
  }, [enrichedNodes]);

  const handleCycleNode = (delta: number) => {
    soundSystem.playMenuBeep();
    const curIdx = visibleNodes.findIndex(
      (n) => n.feat.id === selectedNode.feat.id
    );
    const nextIdx =
      curIdx < 0
        ? 0
        : (curIdx + delta + visibleNodes.length) % visibleNodes.length;
    const nextNode = visibleNodes[nextIdx];
    if (nextNode) {
      setSelectedFeatId(nextNode.feat.id);
      setExpandedUmbrellas((prev) => ({
        ...prev,
        [nextNode.umbrella]: true,
      }));
      setExpandedSectors((prev) => ({
        ...prev,
        [nextNode.skillId]: true,
      }));
    }
  };

  const handleExpandOrCollapseAll = (expand: boolean) => {
    soundSystem.playSelect();
    setExpandedUmbrellas({
      Fighter: expand,
      Scholar: expand,
      Rogue: expand,
    });
    setExpandedSectors({
      Warrior: expand,
      Guardian: expand,
      Wizard: expand,
      Cleric: expand,
      Marauder: expand,
      Rogue: expand,
    });
    const nextSub: Record<string, boolean> = {};
    for (const arm of CONSTELLATION_DISCIPLINE_ARMS) {
      nextSub[`${arm.skillId}:chains`] = expand;
      nextSub[`${arm.skillId}:core`] = expand;
      nextSub[`${arm.skillId}:stances`] = expand;
    }
    setExpandedSubGroups(nextSub);
  };

  const handleAdjustCheatLevel = (delta: number) => {
    const nextLevel = Math.max(1, Math.min(20, (state.level || 1) + delta));
    state.level = nextLevel;
    syncStateGates(state);
    soundSystem.playSelect();
    notifyToast(
      `CHEAT: PILOT LEVEL SET TO CLVL ${nextLevel} (RULE P-01 FEAT CAP: ${nextLevel})`
    );
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

  const handleSelectStanceFromDropdown = (val: string) => {
    if (val === 'base') {
      setActiveSpecialistStance(state, 'base', sayCtx);
      soundSystem.playPowerup();
      forceRefresh();
      return;
    }

    const stanceDef = SPECIALIST_STANCE_BY_FEAT_ID[val];
    if (!stanceDef) return;

    const isAlreadySocketed = normalizedEquippedFeats.includes(stanceDef.featId);
    if (!isAlreadySocketed) {
      if (isCheatMode) {
        state.equippedFeats = [...(state.equippedFeats || []), stanceDef.featId];
        syncStateGates(state);
      } else {
        soundSystem.playSelect();
        setSelectedFeatId(stanceDef.featId);
        setIsInspectorOpen(true);
        notifyToast(
          `INSPECTING ${stanceDef.stanceName.toUpperCase()} — SOCKET FEAT & EQUIP ${stanceDef.requiredEquipmentLabel.toUpperCase()} TO ACTIVATE`
        );
        forceRefresh();
        return;
      }
    }

    const gearCheck = doesLoadoutMatchSpecialistStance(state, stanceDef);
    if (!gearCheck.matched) {
      soundSystem.playMenuBeep();
      setSelectedFeatId(stanceDef.featId);
      setIsInspectorOpen(true);
      notifyToast(
        `${stanceDef.stanceName.toUpperCase()} REQUIRES: ${stanceDef.requiredEquipmentLabel.toUpperCase()}`
      );
      forceRefresh();
      return;
    }

    setActiveSpecialistStance(state, stanceDef.featId, sayCtx);
    setSelectedFeatId(stanceDef.featId);
    soundSystem.playPowerup();
    forceRefresh();
  };

  const selectedSkillDef = PILOT_SKILL_DEFINITIONS.find(
    (s) => s.id === selectedNode.feat.requiredSkillId
  );
  const selectedSkillLevel =
    skillsMap[selectedNode.feat.requiredSkillId]?.level || 1;
  const selectedTierUsed = getEquippedFeatCountByTier(state, selectedNode.tier);

  const isFilteringActive =
    listFilter !== 'all' || searchQuery.trim().length > 0;

  // Compact 1-Line Feat Row (Zero-Pill Metadata + Direct Socket Action + Click to Open Detail Inspector)
  const renderFeatRow = (
    node: (typeof enrichedNodes)[number],
    contextTag?: string
  ) => {
    const isSelected = selectedNode.feat.id === node.feat.id;
    const stanceDef = SPECIALIST_STANCE_BY_FEAT_ID[node.feat.id];
    const isThisStanceActive =
      Boolean(stanceDef) &&
      activeStanceEval.active &&
      activeStanceEval.stance?.featId === node.feat.id;

    let statusText = 'Locked';
    let statusClass = 'bg-[#0f172a] text-[#64748b] border-[#1e293b]';

    if (node.isEquipped) {
      statusText = isThisStanceActive ? 'Active Stance' : 'Socketed ✓';
      statusClass = isThisStanceActive
        ? 'bg-amber-950/70 text-amber-200 border-amber-400/70'
        : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60';
    } else if (node.canSocketNow) {
      statusText = 'Socket';
      statusClass = 'bg-cyan-950/60 text-cyan-200 border-cyan-400/60 hover:bg-cyan-900/70';
    } else if (!node.chainEval.met && node.feat.chainId) {
      statusText = `Need ${node.feat.chainId}`;
    } else if (!node.isAvailable) {
      statusText = `Lv ${node.feat.requiredSkillLevel}`;
    } else if (!node.hasAllGems) {
      statusText = 'No Gem';
    } else if (node.isTierVFull) {
      statusText = 'T-V Cap';
    } else if (isLevelCapReached) {
      statusText = 'Cap Full';
    }

    return (
      <div
        key={`${contextTag || 'row'}-${node.feat.id}`}
        ref={(el) => {
          if (!contextTag || !rowRefs.current[node.feat.id]) {
            rowRefs.current[node.feat.id] = el;
          }
        }}
        onClick={() => {
          soundSystem.playSelect();
          setSelectedFeatId(node.feat.id);
          setIsInspectorOpen(true);
        }}
        className={`px-2.5 py-1.5 rounded-xs border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
          isSelected && isInspectorOpen
            ? 'bg-[#172554] border-[#fde047] text-[#f8fafc]'
            : node.isEquipped
              ? 'bg-[#062419]/65 border-emerald-500/40 text-[#e2e8f0] hover:bg-[#062e20]'
              : node.canSocketNow
                ? 'bg-[#081c29]/65 border-cyan-500/35 text-[#e2e8f0] hover:bg-[#0c2738]'
                : 'bg-[#05080f] border-[#1e293b]/80 text-[#94a3b8] hover:bg-[#0b111e] hover:text-[#cbd5e1]'
        }`}
      >
        {/* Left: Primary Name + Unboxed Metadata Summary */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span
            className="text-[10px] font-bold text-[#f8fafc] truncate"
            style={{ color: node.isEquipped ? '#86efac' : '#f8fafc' }}
          >
            {node.feat.name}
          </span>
          <span className="text-[9px] text-[#94a3b8] truncate">
            Tier {node.tier}
            {' · '}
            {node.feat.rootDomain === 'interface'
              ? node.feat.subBranch === '1A_combat_records'
                ? '1A Record'
                : '1B Link'
              : node.feat.rootDomain === 'frame'
                ? node.feat.subBranch === '2A_defensive_architecture'
                  ? '2A Defense'
                  : '2B Sub-System'
                : 'Reward'}
            {node.feat.chainId
              ? ` · ${node.feat.chainId} Step ${node.feat.chainStep}`
              : ''}
            {node.feat.isSpecialistStance
              ? ` · Stance (${node.hwCheck.met ? 'Gear Met' : 'Gear Unmet'})`
              : ''}
            {contextTag ? ` · ${contextTag}` : ''}
            {' · '}
            <span className="text-[#cbd5e1]">
              {stanceDef
                ? stanceDef.requiredEquipmentLabel
                : node.feat.gainDescription}
            </span>
          </span>
        </div>

        {/* Right: Quiet Gem Cost + Quick Socket / Inspect Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 text-[9px] text-[#cbd5e1] tabular-nums">
            {node.feat.gemSockets.map((req, gIdx) => {
              const gDef = GEMSTONE_REGISTRY[req.gemId];
              return (
                <span
                  key={`${node.feat.id}-g-${gIdx}`}
                  title={`${req.count}× ${gDef?.name || req.gemId}`}
                  className="inline-flex items-center gap-0.5"
                >
                  {gDef?.iconBase64 && (
                    <SpriteCanvasIcon
                      base64={gDef.iconBase64}
                      sizeClass="w-2.5 h-2.5"
                    />
                  )}
                  {req.count}
                </span>
              );
            })}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFeatId(node.feat.id);
              if (node.isEquipped || node.canSocketNow) {
                handleToggleFeatSocket(node.feat.id);
              } else {
                setIsInspectorOpen(true);
                soundSystem.playSelect();
              }
            }}
            className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border tabular-nums cursor-pointer whitespace-nowrap ${statusClass}`}
          >
            {statusText}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden text-[10px] relative">
      {/* Structured 2-Row Toolbar: Row 1 (Filters + Search + View Controls) & Row 2 (Dedicated Broken-Up Stance Selector) */}
      <div className="shrink-0 bg-[#080d16] border border-[#1e293b] rounded-xs px-2 py-1.5 space-y-1.5">
        {/* Toolbar Row 1: Filter Buttons + Search Input + Discipline Levels & Expand/Collapse */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 flex-wrap">
            {(
              [
                { id: 'all', label: `All (${enrichedNodes.length})` },
                {
                  id: 'socketed',
                  label: `Active (${normalizedEquippedFeats.length}/${maxFeatsForLevel})`,
                },
                { id: 'available', label: 'Ready' },
                {
                  id: 'interface',
                  label: `Interface (${enrichedNodes.filter((n) => n.feat.rootDomain === 'interface').length})`,
                },
                {
                  id: 'frame',
                  label: `Frame (${enrichedNodes.filter((n) => n.feat.rootDomain === 'frame').length})`,
                },
                { id: 'chains', label: 'Chains' },
                { id: 'stances', label: 'Stances' },
              ] as Array<{ id: FeatListFilterMode; label: string }>
            ).map((fOpt) => (
              <button
                key={fOpt.id}
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setListFilter(fOpt.id);
                }}
                className={`px-2 py-0.5 rounded-xs text-[9px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  listFilter === fOpt.id
                    ? 'bg-[#38bdf8] text-[#05070a]'
                    : 'bg-[#05080f] text-[#94a3b8] hover:text-[#f8fafc] border border-[#1e293b]'
                }`}
              >
                {fOpt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 w-36 sm:w-44">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feats..."
                className="w-full bg-[#05080f] border border-[#1e293b] focus:border-[#38bdf8] rounded-xs px-2 py-0.5 text-[11px] text-[#f8fafc] placeholder-[#64748b] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-1.5 py-0.5 rounded-xs bg-[#1e293b] text-[#cbd5e1] text-[9px] font-bold cursor-pointer whitespace-nowrap"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                setShowSkillsDrawer((v) => !v);
              }}
              className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer transition-colors whitespace-nowrap ${
                showSkillsDrawer
                  ? 'bg-[#c084fc] text-[#05070a] border-[#e9d5ff]'
                  : 'bg-[#0f172a] text-[#e9d5ff] border-[#c084fc]/50 hover:bg-[#1e293b]'
              }`}
            >
              {showSkillsDrawer ? 'Hide Skills' : 'Skills'}
            </button>

            <button
              type="button"
              onClick={() =>
                handleExpandOrCollapseAll(
                  !(
                    expandedSectors.Warrior &&
                    expandedSectors.Guardian &&
                    expandedSectors.Wizard
                  )
                )
              }
              className="px-2 py-0.5 rounded-xs bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] text-[9px] font-bold text-[#94a3b8] cursor-pointer whitespace-nowrap"
            >
              {expandedSectors.Warrior &&
              expandedSectors.Guardian &&
              expandedSectors.Wizard
                ? 'Collapse All'
                : 'Expand All'}
            </button>
          </div>
        </div>

        {/* Toolbar Row 2 & 3: Two-Line Broken-Up Stance Doctrine Selector */}
        <div className="pt-1 border-t border-[#1e293b]/80 space-y-1">
          {/* Stance Line 1: Stance Discipline Filter + Base Moveset / Inspect Stance Actions */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <label
                htmlFor="feats-tab-stance-discipline"
                className="text-[9px] font-bold text-[#fde047] whitespace-nowrap shrink-0"
              >
                Stance Discipline:
              </label>
              <select
                id="feats-tab-stance-discipline"
                aria-label="Filter Stances by Discipline"
                value={stanceDisciplineFilter}
                onChange={(e) => {
                  soundSystem.playSelect();
                  setStanceDisciplineFilter(
                    e.target.value as 'ALL' | PilotSkillId
                  );
                }}
                className="bg-[#05080f] text-[#cbd5e1] border border-[#334155] rounded-xs px-2 py-0.5 text-[11px] font-bold cursor-pointer focus:outline-none focus:border-[#38bdf8]"
              >
                <option value="ALL">All 6 Disciplines</option>
                <option value="Warrior">Warrior (Fighter)</option>
                <option value="Guardian">Guardian (Fighter)</option>
                <option value="Wizard">Wizard (Scholar)</option>
                <option value="Cleric">Cleric (Scholar)</option>
                <option value="Marauder">Marauder (Rogue)</option>
                <option value="Rogue">Rogue (Rogue)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectStanceFromDropdown('base')}
                className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer whitespace-nowrap ${
                  activeStanceDropdownValue === 'base'
                    ? 'bg-[#fde047] text-[#05070a] border-[#fde047]'
                    : 'bg-[#05080f] text-[#94a3b8] border-[#334155] hover:text-[#f8fafc]'
                }`}
              >
                Base Moveset
              </button>
              {activeStanceDropdownValue !== 'base' && (
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    setSelectedFeatId(activeStanceDropdownValue);
                    setIsInspectorOpen(true);
                  }}
                  className="px-2 py-0.5 rounded-xs bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] border border-[#38bdf8]/50 text-[9px] font-bold cursor-pointer whitespace-nowrap"
                >
                  Inspect Stance
                </button>
              )}
            </div>
          </div>

          {/* Stance Line 2: Full-Width Active Stance Doctrine Dropdown */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="feats-tab-stance-select"
              className="text-[9px] font-bold text-[#94a3b8] whitespace-nowrap shrink-0"
            >
              Active Stance:
            </label>
            <select
              id="feats-tab-stance-select"
              aria-label="Select Active Stance Doctrine"
              value={activeStanceDropdownValue}
              onChange={(e) => handleSelectStanceFromDropdown(e.target.value)}
              className="w-full min-w-0 bg-[#05080f] text-[#fde047] border border-[#eab308]/60 rounded-xs px-2 py-0.5 text-[11px] font-bold cursor-pointer focus:outline-none focus:border-[#fde047]"
            >
              <option value="base">
                Base Weapon Moveset (Standard Weapon Skills 1–5)
              </option>
              {filteredReadyStances.length > 0 && (
                <optgroup label="Ready (Socketed & Gear Met)">
                  {filteredReadyStances.map((stance) => (
                    <option key={stance.featId} value={stance.featId}>
                      {stance.stanceName} · {stance.skillId} ({stance.shortTag})
                    </option>
                  ))}
                </optgroup>
              )}
              {filteredSocketedUnmetStances.length > 0 && (
                <optgroup label="Socketed (Gear Requirement Unmet)">
                  {filteredSocketedUnmetStances.map((stance) => (
                    <option key={stance.featId} value={stance.featId}>
                      {stance.stanceName} · {stance.skillId} (Need:{' '}
                      {stance.requiredEquipmentLabel})
                    </option>
                  ))}
                </optgroup>
              )}
              {filteredCatalogUnsocketedStances.length > 0 && (
                <optgroup
                  label={
                    isCheatMode
                      ? 'Sandbox Catalog (Select to Auto-Socket)'
                      : 'Unsocketed Stances (Select to Inspect)'
                  }
                >
                  {filteredCatalogUnsocketedStances.map((stance) => (
                    <option key={stance.featId} value={stance.featId}>
                      {stance.stanceName} · {stance.skillId} (
                      {stance.requiredEquipmentLabel})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Collapsible Pilot Skills & Build Overview Drawer */}
      {showSkillsDrawer && (
        <div className="shrink-0 bg-[#080d16] border border-[#1e293b] rounded-xs p-2 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-[#94a3b8] pb-1 border-b border-[#1e293b]">
            <span>
              Emergent Class:{' '}
              <b className="text-[#fde047]">{metaClassEval.title}</b> · Feats:{' '}
              <b className="text-[#38bdf8]">
                {normalizedEquippedFeats.length}/{maxFeatsForLevel}
              </b>{' '}
              · Apex Tier V:{' '}
              <b className="text-[#c084fc]">
                {tierVUsed}/{tierVCap}
              </b>{' '}
              · Load Bracket:{' '}
              <b className="text-[#4ade80] uppercase">{effectiveLoad}</b>
              {devMode ? ` · Light: ${effectiveLightTiles}T` : ''}
            </span>
            <div className="flex items-center gap-1.5">
              {isCheatMode && (
                <span className="inline-flex items-center gap-1 text-amber-300">
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
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setShowBlueprintModal((v) => !v);
                }}
                className="px-1.5 py-0.5 rounded-xs bg-[#0f172a] border border-[#334155] text-[#cbd5e1] font-bold cursor-pointer whitespace-nowrap"
              >
                {showBlueprintModal ? 'Hide Diagram' : 'Hex Diagram'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {PILOT_SKILL_DEFINITIONS.map((skill) => {
              const currentLv = skillsMap[skill.id]?.level || 1;
              const armMeta = CONSTELLATION_DISCIPLINE_ARMS.find(
                (a) => a.skillId === skill.id
              );
              return (
                <div
                  key={skill.id}
                  className="p-1.5 rounded-xs bg-[#05080f] border border-[#1e293b] flex items-center justify-between gap-1.5"
                >
                  <div className="min-w-0">
                    <div
                      className="text-[9px] font-bold truncate"
                      style={{ color: armMeta?.color || '#38bdf8' }}
                    >
                      {skill.id} ({armMeta?.umbrella})
                    </div>
                    <div className="text-[9px] text-[#f8fafc] font-mono tabular-nums">
                      Lv {currentLv}/20
                      {isCheatMode && (
                        <span className="ml-1 inline-flex gap-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleAdjustCheatSkillLevel(skill.id, -1)
                            }
                            className="px-1 bg-amber-950/60 border border-amber-500/40 text-amber-200 rounded-xs cursor-pointer"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAdjustCheatSkillLevel(skill.id, 1)
                            }
                            className="px-1 bg-amber-950/60 border border-amber-500/40 text-amber-200 rounded-xs cursor-pointer"
                          >
                            +
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {skill.fundingGems.map((gemId) => {
                      const gDef = GEMSTONE_REGISTRY[gemId];
                      const have = getInventoryGemCount(state, gemId);
                      const canSpend =
                        progressionUnlocked && currentLv < 20 && have > 0;
                      return (
                        <button
                          key={`${skill.id}-fund-${gemId}`}
                          type="button"
                          disabled={!canSpend}
                          onClick={() =>
                            handleFundSkillWithGem(skill.id, gemId)
                          }
                          className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold inline-flex items-center gap-0.5 border ${
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
        </div>
      )}

      {/* 100% Full-Width Single-Focus 3-Level Nested Feat List */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#05080f] border border-[#1e293b] rounded-xs overflow-hidden">
        {showBlueprintModal ? (
          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-[#05080f] overflow-auto">
            <img
              src={ORION_HEX_BLUEPRINT_BASE64}
              alt="6-Sector Hexagonal Feat Grid Blueprint"
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded border border-[#1e293b] bg-white/95 p-1"
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
            {CONSTELLATION_UMBRELLAS.map((umbrella) => {
              const umbrellaNodes = enrichedNodes.filter(
                (n) => n.umbrella === umbrella.id
              );
              const visibleUmbrellaNodes = umbrellaNodes.filter(
                (n) => n.isVisible
              );
              if (isFilteringActive && visibleUmbrellaNodes.length === 0) {
                return null;
              }

              const umbrellaSocketedNodes = umbrellaNodes.filter(
                (n) => n.isEquipped
              );
              const umbrellaSocketedCount = umbrellaSocketedNodes.length;
              const umbrellaReadyCount = umbrellaNodes.filter(
                (n) => n.canSocketNow
              ).length;
              const isUmbrellaOpen =
                isFilteringActive || expandedUmbrellas[umbrella.id];

              return (
                <div
                  key={umbrella.id}
                  className="rounded-xs border border-[#1e293b] bg-[#080d16] overflow-hidden"
                >
                  {/* LEVEL 1: MACRO-UMBRELLA HEADER (TWO-LINE LAYOUT) */}
                  <button
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setExpandedUmbrellas((prev) => ({
                        ...prev,
                        [umbrella.id]: !prev[umbrella.id],
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 flex flex-col gap-0.5 text-left bg-[#0b1322] hover:bg-[#111c32] border-b border-[#1e293b] cursor-pointer transition-colors"
                  >
                    <div className="w-full flex items-center justify-between gap-2">
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: umbrella.color }}
                      >
                        {isUmbrellaOpen ? '▾' : '▸'} {umbrella.id} Umbrella (
                        {umbrella.sectors[0]} + {umbrella.sectors[1]})
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 text-[9px] font-mono tabular-nums text-[#94a3b8]">
                        <span className="text-emerald-300 font-bold">
                          {umbrellaSocketedCount} Active
                        </span>
                        <span>·</span>
                        <span className="text-cyan-300">
                          {umbrellaReadyCount} Ready
                        </span>
                        <span>·</span>
                        <span>
                          {visibleUmbrellaNodes.length}/{umbrellaNodes.length}
                        </span>
                      </div>
                    </div>
                    <div className="w-full flex items-center justify-between gap-2 text-[9px] text-[#94a3b8]">
                      <span className="truncate">{umbrella.summary}</span>
                      {!isUmbrellaOpen && umbrellaSocketedNodes.length > 0 && (
                        <span className="text-emerald-300/90 truncate max-w-[55%] shrink-0">
                          Socketed:{' '}
                          {umbrellaSocketedNodes
                            .map((n) => n.feat.name)
                            .join(', ')}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* LEVEL 2: DISCIPLINE SECTORS */}
                  {isUmbrellaOpen && (
                    <div className="p-2 space-y-2">
                      {umbrella.sectors.map((skillId) => {
                        const armMeta = CONSTELLATION_DISCIPLINE_ARMS.find(
                          (a) => a.skillId === skillId
                        );
                        const skillDef = PILOT_SKILL_DEFINITIONS.find(
                          (s) => s.id === skillId
                        );
                        const currentSkillLv = skillsMap[skillId]?.level || 1;

                        const sectorNodes = enrichedNodes.filter(
                          (n) => n.skillId === skillId
                        );
                        const visibleSectorNodes = sectorNodes.filter(
                          (n) => n.isVisible
                        );
                        if (
                          isFilteringActive &&
                          visibleSectorNodes.length === 0
                        ) {
                          return null;
                        }

                        const sectorSocketedNodes = sectorNodes.filter(
                          (n) => n.isEquipped
                        );
                        const sectorSocketedCount = sectorSocketedNodes.length;
                        const sectorReadyCount = sectorNodes.filter(
                          (n) => n.canSocketNow
                        ).length;
                        const isSectorOpen =
                          isFilteringActive || expandedSectors[skillId];

                        const sectorChainIds = Array.from(
                          new Set(
                            sectorNodes
                              .map((n) => n.feat.chainId)
                              .filter((cid): cid is FeatChainId => Boolean(cid))
                          )
                        ).sort();

                        const sectorChains = sectorChainIds
                          .map((chainId) => {
                            const allChainNodes = enrichedNodes
                              .filter((n) => n.feat.chainId === chainId)
                              .sort(
                                (a, b) =>
                                  (a.feat.chainStep || 1) -
                                  (b.feat.chainStep || 1)
                              );
                            const visibleChainNodes = allChainNodes.filter(
                              (n) => n.isVisible
                            );
                            return {
                              chainId,
                              chainName: FEAT_CHAIN_NAMES[chainId] || chainId,
                              allChainNodes,
                              visibleChainNodes,
                            };
                          })
                          .filter(
                            (c) =>
                              !isFilteringActive ||
                              c.visibleChainNodes.length > 0
                          );

                        const tierOrder: Record<FeatTier, number> = {
                          I: 1,
                          II: 2,
                          III: 3,
                          IV: 4,
                          V: 5,
                        };
                        const standaloneCoreNodes = sectorNodes
                          .filter(
                            (n) => !n.feat.chainId && !n.feat.isSpecialistStance
                          )
                          .sort(
                            (a, b) =>
                              tierOrder[a.tier] - tierOrder[b.tier] ||
                              a.feat.name.localeCompare(b.feat.name)
                          );
                        const visibleCoreNodes = standaloneCoreNodes.filter(
                          (n) => n.isVisible
                        );

                        const stanceNodes = sectorNodes
                          .filter((n) => Boolean(n.feat.isSpecialistStance))
                          .sort(
                            (a, b) =>
                              tierOrder[a.tier] - tierOrder[b.tier] ||
                              a.feat.name.localeCompare(b.feat.name)
                          );
                        const visibleStanceNodes = stanceNodes.filter(
                          (n) => n.isVisible
                        );

                        const chainsSubKey = `${skillId}:chains`;
                        const coreSubKey = `${skillId}:core`;
                        const stancesSubKey = `${skillId}:stances`;

                        const isChainsOpen =
                          isFilteringActive ||
                          expandedSubGroups[chainsSubKey] !== false;
                        const isCoreOpen =
                          isFilteringActive ||
                          expandedSubGroups[coreSubKey] !== false;
                        const isStancesOpen =
                          isFilteringActive ||
                          expandedSubGroups[stancesSubKey] !== false;

                        const activeChainsNodesCount = sectorChains.reduce(
                          (acc, c) =>
                            acc +
                            c.allChainNodes.filter(
                              (n) => n.isEquipped && n.skillId === skillId
                            ).length,
                          0
                        );
                        const activeCoreNodes = standaloneCoreNodes.filter(
                          (n) => n.isEquipped
                        );
                        const activeStanceNodes = stanceNodes.filter(
                          (n) => n.isEquipped
                        );

                        return (
                          <div
                            key={skillId}
                            className="rounded-xs border border-[#1e293b] bg-[#05080f] overflow-hidden"
                          >
                            {/* LEVEL 2: DISCIPLINE SECTOR HEADER (TWO-LINE LAYOUT) */}
                            <div className="px-2.5 py-1.5 bg-[#09101d] border-b border-[#1e293b] space-y-1">
                              {/* Line 1: Discipline Title + Level / Socketed / Ready Status */}
                              <button
                                type="button"
                                onClick={() => {
                                  soundSystem.playSelect();
                                  setExpandedSectors((prev) => ({
                                    ...prev,
                                    [skillId]: !prev[skillId],
                                  }));
                                }}
                                className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                              >
                                <span
                                  className="text-[10px] font-bold"
                                  style={{
                                    color: armMeta?.color || '#38bdf8',
                                  }}
                                >
                                  {isSectorOpen ? '▾' : '▸'} {skillId} Discipline
                                </span>
                                <span className="text-[9px] text-[#94a3b8] font-mono tabular-nums">
                                  Lv {currentSkillLv}/20 ·{' '}
                                  <b className="text-emerald-300">
                                    {sectorSocketedCount}/{sectorNodes.length}{' '}
                                    Socketed
                                  </b>{' '}
                                  ·{' '}
                                  <span className="text-cyan-300">
                                    {sectorReadyCount} Ready
                                  </span>
                                </span>
                              </button>

                              {/* Line 2: Discipline Summary / Collapsed Socketed Preview + Inline Gem Funding Buttons */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundSystem.playSelect();
                                    setExpandedSectors((prev) => ({
                                      ...prev,
                                      [skillId]: !prev[skillId],
                                    }));
                                  }}
                                  className="min-w-0 flex-1 text-left text-[9px] text-[#94a3b8] truncate cursor-pointer"
                                >
                                  {!isSectorOpen &&
                                  sectorSocketedNodes.length > 0 ? (
                                    <span>
                                      <b className="text-emerald-300">
                                        Active:{' '}
                                        {sectorSocketedNodes
                                          .map((n) => n.feat.name)
                                          .join(', ')}
                                      </b>{' '}
                                      · {skillDef?.relatedEquipment || skillDef?.name}
                                    </span>
                                  ) : (
                                    <span>
                                      {skillDef?.relatedEquipment || skillDef?.name}
                                    </span>
                                  )}
                                </button>

                                {/* Inline Discipline Gem Funding Buttons */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {skillDef?.fundingGems.map((gemId) => {
                                    const gDef = GEMSTONE_REGISTRY[gemId];
                                    const have = getInventoryGemCount(
                                      state,
                                      gemId
                                    );
                                    const canSpend =
                                      progressionUnlocked &&
                                      currentSkillLv < 20 &&
                                      have > 0;
                                    return (
                                      <button
                                        key={`${skillId}-inline-${gemId}`}
                                        type="button"
                                        disabled={!canSpend}
                                        title={`Spend 1 ${gDef?.name || gemId} to level up ${skillId} (Have ${have})`}
                                        onClick={() =>
                                          handleFundSkillWithGem(skillId, gemId)
                                        }
                                        className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold inline-flex items-center gap-0.5 border ${
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
                                        +Lv ({have})
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* LEVEL 3: CHAINS, STANDALONE CORE TIERS, AND SPECIALIST STANCES */}
                            {isSectorOpen && (
                              <div className="p-2 space-y-2">
                                {/* 3A: Selective Chains (C-01..C-18) */}
                                {sectorChains.length > 0 && (
                                  <div className="rounded-xs border border-[#1e293b]/80 bg-[#080d16]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundSystem.playSelect();
                                        setExpandedSubGroups((prev) => ({
                                          ...prev,
                                          [chainsSubKey]: !isChainsOpen,
                                        }));
                                      }}
                                      className="w-full px-2.5 py-1 flex flex-col gap-0.5 text-left bg-[#0c1626] hover:bg-[#111f35] cursor-pointer"
                                    >
                                      <div className="w-full flex items-center justify-between gap-2">
                                        <span className="text-[9px] font-bold text-[#7dd3fc]">
                                          {isChainsOpen ? '▾' : '▸'} Selective
                                          Feat Chains ({sectorChains.length})
                                        </span>
                                        <span className="text-[9px] font-mono tabular-nums text-[#94a3b8]">
                                          {activeChainsNodesCount} Active ·
                                          Tier-Jumping Enabled
                                        </span>
                                      </div>
                                      <div className="w-full text-[9px] text-[#94a3b8] truncate">
                                        {sectorChains
                                          .map(
                                            (c) =>
                                              `${c.chainId} ${c.chainName}`
                                          )
                                          .join(' · ')}
                                      </div>
                                    </button>

                                    {isChainsOpen && (
                                      <div className="p-2 space-y-2">
                                        {sectorChains.map((chain) => {
                                          const chainActiveCount =
                                            chain.allChainNodes.filter(
                                              (n) => n.isEquipped
                                            ).length;
                                          return (
                                            <div
                                              key={`${skillId}-${chain.chainId}`}
                                              className="space-y-1"
                                            >
                                              <div className="flex items-center justify-between gap-1 text-[9px] px-1">
                                                <span className="font-bold text-[#38bdf8]">
                                                  {chain.chainId}:{' '}
                                                  {chain.chainName}
                                                </span>
                                                <span className="font-mono tabular-nums text-[#94a3b8]">
                                                  {chainActiveCount}/
                                                  {chain.allChainNodes.length}{' '}
                                                  Active
                                                </span>
                                              </div>
                                              <div className="space-y-1">
                                                {(isFilteringActive
                                                  ? chain.visibleChainNodes
                                                  : chain.allChainNodes
                                                ).map((cNode) =>
                                                  renderFeatRow(
                                                    cNode,
                                                    cNode.skillId !== skillId
                                                      ? `Bridge: ${cNode.skillId}`
                                                      : undefined
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 3B: Standalone Core Feats (Tiers I–V) */}
                                {(!isFilteringActive ||
                                  visibleCoreNodes.length > 0) &&
                                  standaloneCoreNodes.length > 0 && (
                                    <div className="rounded-xs border border-[#1e293b]/80 bg-[#080d16]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          soundSystem.playSelect();
                                          setExpandedSubGroups((prev) => ({
                                            ...prev,
                                            [coreSubKey]: !isCoreOpen,
                                          }));
                                        }}
                                        className="w-full px-2.5 py-1 flex flex-col gap-0.5 text-left bg-[#0c1626] hover:bg-[#111f35] cursor-pointer"
                                      >
                                        <div className="w-full flex items-center justify-between gap-2">
                                          <span className="text-[9px] font-bold text-[#e2e8f0]">
                                            {isCoreOpen ? '▾' : '▸'} Standalone
                                            Core Feats (Tiers I–V)
                                          </span>
                                          <span className="text-[9px] font-mono tabular-nums text-[#94a3b8]">
                                            {activeCoreNodes.length}/
                                            {standaloneCoreNodes.length} Active
                                          </span>
                                        </div>
                                        <div className="w-full text-[9px] text-[#94a3b8] truncate">
                                          {activeCoreNodes.length > 0
                                            ? `Active: ${activeCoreNodes
                                                .map((n) => n.feat.name)
                                                .join(', ')}`
                                            : `Independent ${skillId} passive and tactical nodes across Tiers I–V`}
                                        </div>
                                      </button>

                                      {isCoreOpen && (
                                        <div className="p-2 space-y-1">
                                          {(isFilteringActive
                                            ? visibleCoreNodes
                                            : standaloneCoreNodes
                                          ).map((coreNode) =>
                                            renderFeatRow(coreNode)
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                {/* 3C: Specialist Martial Stances */}
                                {(!isFilteringActive ||
                                  visibleStanceNodes.length > 0) &&
                                  stanceNodes.length > 0 && (
                                    <div className="rounded-xs border border-amber-500/30 bg-[#080d16]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          soundSystem.playSelect();
                                          setExpandedSubGroups((prev) => ({
                                            ...prev,
                                            [stancesSubKey]: !isStancesOpen,
                                          }));
                                        }}
                                        className="w-full px-2.5 py-1 flex flex-col gap-0.5 text-left bg-amber-950/25 hover:bg-amber-950/40 cursor-pointer"
                                      >
                                        <div className="w-full flex items-center justify-between gap-2">
                                          <span className="text-[9px] font-bold text-amber-300">
                                            {isStancesOpen ? '▾' : '▸'}{' '}
                                            Specialist Martial Stances (
                                            {stanceNodes.length})
                                          </span>
                                          <span className="text-[9px] font-mono tabular-nums text-amber-200/80">
                                            {activeStanceNodes.length}/
                                            {stanceNodes.length} Socketed
                                          </span>
                                        </div>
                                        <div className="w-full text-[9px] text-amber-200/70 truncate">
                                          {stanceNodes
                                            .map((n) => n.feat.name)
                                            .join(' · ')}
                                        </div>
                                      </button>

                                      {isStancesOpen && (
                                        <div className="p-2 space-y-1">
                                          {(isFilteringActive
                                            ? visibleStanceNodes
                                            : stanceNodes
                                          ).map((sNode) => renderFeatRow(sNode))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pop-Up / Slide-Over Feat Detail Inspector Overlay */}
      {isInspectorOpen && selectedNode && (
        <div className="absolute inset-0 z-30 bg-[#05070a]/95 backdrop-blur-xs flex flex-col p-3 overflow-y-auto space-y-2.5 border border-[#38bdf8]/40 rounded-xs">
          {/* Inspector Top Bar: Back Button + Prev/Next Stepper */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#1e293b] shrink-0">
            <button
              type="button"
              onClick={() => {
                soundSystem.playMenuBeep();
                setIsInspectorOpen(false);
              }}
              className="px-2.5 py-1 rounded-xs bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] text-[10px] font-bold border border-[#475569] cursor-pointer whitespace-nowrap"
            >
              ← Back to Feat List
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleCycleNode(-1)}
                className="px-2 py-0.5 rounded-xs bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] text-[9px] font-bold text-[#38bdf8] cursor-pointer"
              >
                ◀ Prev
              </button>
              <span className="text-[9px] text-[#94a3b8] tabular-nums">
                #{selectedNode.index + 1}/{enrichedNodes.length}
              </span>
              <button
                type="button"
                onClick={() => handleCycleNode(1)}
                className="px-2 py-0.5 rounded-xs bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] text-[9px] font-bold text-[#38bdf8] cursor-pointer"
              >
                Next ▶
              </button>
            </div>
          </div>

          {/* Selected Feat Title & Unboxed Metadata */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[12px] font-bold text-[#f8fafc]">
                {selectedNode.feat.name}
                {devMode ? ` [${selectedNode.feat.id}]` : ''}
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-xs ${
                  selectedNode.isEquipped
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50'
                    : selectedNode.canSocketNow
                      ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-500/50'
                      : 'bg-[#0f172a] text-[#94a3b8] border border-[#1e293b]'
                }`}
              >
                {selectedNode.isEquipped
                  ? 'Socketed & Active'
                  : selectedNode.canSocketNow
                    ? 'Ready to Socket'
                    : 'Locked / Unsocketed'}
              </span>
            </div>

            <div className="text-[9px] text-[#94a3b8]">
              <span style={{ color: selectedNode.armColor }} className="font-bold">
                {selectedNode.umbrella} · {selectedNode.skillId}
              </span>
              {' · '}
              <span>
                Tier {selectedNode.tier}
                {selectedNode.tier === 'V'
                  ? ` (${selectedTierUsed}/${FEAT_TIER_MAX_SLOTS.V} Apex)`
                  : ''}
              </span>
              {' · '}
              <span>
                {selectedNode.feat.rootDomain === 'interface'
                  ? selectedNode.feat.subBranch === '1A_combat_records'
                    ? 'Interface 1A (Combat Record)'
                    : 'Interface 1B (Tactical Link)'
                  : selectedNode.feat.rootDomain === 'frame'
                    ? selectedNode.feat.subBranch === '2A_defensive_architecture'
                      ? 'Frame 2A (Defensive Architecture)'
                      : 'Frame 2B (Sub-System Tuning)'
                    : 'Campaign Reward'}
              </span>
              {' · '}
              <span>
                {selectedNode.feat.isSpecialistStance
                  ? 'Specialist Martial Stance'
                  : selectedNode.feat.chainId
                    ? `Chain ${selectedNode.feat.chainId} Step ${selectedNode.feat.chainStep}`
                    : 'Standalone Core Feat'}
              </span>
              {' · '}
              <span
                className={
                  selectedSkillLevel >= selectedNode.feat.requiredSkillLevel
                    ? 'text-emerald-300 font-bold'
                    : 'text-amber-300 font-bold'
                }
              >
                Requires {selectedSkillDef?.name || selectedNode.skillId} Lv{' '}
                {selectedNode.feat.requiredSkillLevel} (Current Lv{' '}
                {selectedSkillLevel})
              </span>
            </div>
          </div>

          {/* Combat Effect & Trade-Off */}
          <div className="p-2.5 rounded-xs bg-[#080d16] border border-[#1e293b] space-y-1">
            <div className="text-[10px] text-emerald-300 leading-snug">
              + {selectedNode.feat.gainDescription}
            </div>
            <div className="text-[10px] text-amber-300/90 leading-snug">
              − {selectedNode.feat.costDescription}
            </div>
            {selectedNode.feat.tradeOffDescription && (
              <div className="text-[9px] text-[#7dd3fc] leading-snug pt-0.5 border-t border-[#1e293b]/80">
                ⚖ Rule P-09 Trade-Off: {selectedNode.feat.tradeOffDescription}
              </div>
            )}
          </div>

          {/* Chain & Equipment Handling Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2 rounded-xs bg-[#080d16] border border-[#1e293b] space-y-1">
              <div className="flex items-center justify-between gap-1 text-[9px]">
                <span className="font-bold text-[#38bdf8]">
                  {selectedNode.feat.chainId
                    ? `Chain ${selectedNode.feat.chainId}: ${selectedNode.feat.chainName}`
                    : 'Chain Prerequisite'}
                </span>
                <span
                  className={
                    selectedNode.chainEval.met
                      ? 'text-emerald-300 font-bold'
                      : 'text-amber-300 font-bold'
                  }
                >
                  {selectedNode.chainEval.met ? 'Met' : 'Locked'}
                </span>
              </div>
              <div className="text-[9px] text-[#cbd5e1] leading-snug">
                {selectedNode.chainEval.reason}
              </div>
              {selectedNode.feat.chainId &&
                selectedNode.chainEval.earlierChainFeats.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedNode.chainEval.earlierChainFeats.map((anc) => {
                      const ancEquipped = normalizedEquippedFeats.includes(
                        anc.id
                      );
                      return (
                        <button
                          key={anc.id}
                          type="button"
                          onClick={() => {
                            soundSystem.playSelect();
                            setSelectedFeatId(anc.id);
                          }}
                          className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer ${
                            ancEquipped
                              ? 'bg-emerald-950/50 border-emerald-400/60 text-emerald-200'
                              : 'bg-[#0f172a] border-[#334155] text-[#94a3b8] hover:text-white'
                          }`}
                        >
                          {ancEquipped ? '✓ ' : ''}
                          {anc.name} (T-{anc.tier})
                        </button>
                      );
                    })}
                  </div>
                )}
              {dependentDownstreamNodes.length > 0 && (
                <div className="pt-1 text-[9px] text-amber-300">
                  Required by active feat:{' '}
                  <b>
                    {dependentDownstreamNodes
                      .map((d) => `${d.name} (T-${d.tier})`)
                      .join(', ')}
                  </b>
                </div>
              )}
            </div>

            <div className="p-2 rounded-xs bg-[#080d16] border border-[#1e293b] space-y-1">
              <div className="flex items-center justify-between gap-1 text-[9px]">
                <span className="font-bold text-[#fde047]">
                  Equipment & Trigger Check
                </span>
                <span
                  className={
                    selectedNode.hwCheck.met
                      ? 'text-emerald-300 font-bold'
                      : 'text-amber-300 font-bold'
                  }
                >
                  {selectedNode.hwCheck.met ? 'Loadout Met' : 'Loadout Unmet'}
                </span>
              </div>
              <div className="text-[9px] text-[#e2e8f0] leading-snug">
                {selectedNode.handlingSummary}
              </div>
              <div className="text-[9px] text-[#94a3b8]">
                Gear: {selectedNode.targetEquipmentClasses.join(' · ')} ·{' '}
                {selectedNode.hwCheck.reason}
              </div>
            </div>
          </div>

          {/* Gemstone Socket Requirements & Primary Action CTA */}
          <div className="p-2 rounded-xs bg-[#080d16] border border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-bold text-[#94a3b8]">
                Gem Cost (Refunded on Unsocket):
              </span>
              {selectedNode.feat.gemSockets.map((req, idx) => {
                const gDef = GEMSTONE_REGISTRY[req.gemId];
                const have = getInventoryGemCount(state, req.gemId);
                const enough = selectedNode.isEquipped || have >= req.count;
                return (
                  <span
                    key={`${selectedNode.feat.id}-sock-${idx}`}
                    className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-xs border tabular-nums ${
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
                    {!selectedNode.isEquipped && ` (Have ${have})`}
                  </span>
                );
              })}
            </div>

            <button
              type="button"
              disabled={
                selectedNode.isEquipped
                  ? !state.bypassProgressionGates &&
                    dependentDownstreamNodes.length > 0
                  : !progressionUnlocked ||
                    !selectedNode.chainEval.met ||
                    !selectedNode.isAvailable ||
                    !selectedNode.hasAllGems ||
                    selectedNode.isCapBlocked
              }
              onClick={() => handleToggleFeatSocket(selectedNode.feat.id)}
              className={`px-3 py-1.5 rounded-xs text-[10px] font-bold transition-colors shrink-0 ${
                selectedNode.isEquipped
                  ? dependentDownstreamNodes.length > 0 &&
                    !state.bypassProgressionGates
                    ? 'bg-[#1e293b] text-amber-300/80 border border-amber-500/40 cursor-not-allowed'
                    : 'bg-amber-500/20 border border-amber-400/70 text-amber-200 hover:bg-amber-500/30 cursor-pointer'
                  : selectedNode.isCapBlocked
                    ? 'bg-[#1e293b] text-amber-400/70 border border-amber-500/30 cursor-not-allowed'
                    : selectedNode.canSocketNow
                      ? 'bg-emerald-500/25 border border-emerald-400/70 text-emerald-200 hover:bg-emerald-500/35 cursor-pointer'
                      : 'bg-[#1e293b] text-[#64748b] border border-[#334155] cursor-not-allowed'
              }`}
            >
              {selectedNode.isEquipped
                ? dependentDownstreamNodes.length > 0 &&
                  !state.bypassProgressionGates
                  ? `Locked by ${dependentDownstreamNodes[0].name}`
                  : 'Unsocket Feat (Refund Gems)'
                : selectedNode.isTierVFull
                  ? `Tier V Apex Full (${tierVUsed}/${tierVCap})`
                  : isLevelCapReached
                    ? `Level Cap Reached (${normalizedEquippedFeats.length}/${maxFeatsForLevel})`
                    : !progressionUnlocked
                      ? 'Unlocks at Level 6'
                      : !selectedNode.chainEval.met
                        ? `Requires Chain ${selectedNode.feat.chainId}`
                        : !selectedNode.isAvailable
                          ? `Requires ${selectedNode.skillId} Lv ${selectedNode.feat.requiredSkillLevel}`
                          : !selectedNode.hasAllGems
                            ? 'Missing Required Gemstones'
                            : 'Socket Feat Node'}
            </button>
          </div>

          {/* Active Build Resonance Summary */}
          <div className="pt-1 border-t border-[#1e293b] text-[9px] text-[#94a3b8] flex flex-wrap items-center justify-between gap-2 tabular-nums">
            <span>
              Active Build Resonance ({normalizedEquippedFeats.length}/
              {maxFeatsForLevel} Feats · {metaClassEval.title}):
            </span>
            <span>
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
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
