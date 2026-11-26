/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../../database/characters';
import { ENEMY_REGISTRY } from '../../database/enemies';
import { GEM_MOD_PREFIX_BY_ID } from '../../database/equipment';
import { getHardwareGemBonusDescription } from '../../database/equipment/chassis_hardware';
import { WEAPON_REGISTRY } from '../../database/equipment/weapons';
import { ITEM_REGISTRY } from '../../database/items';
import {
  GEMSTONE_REGISTRY,
  getWeaponComponentSlots,
  getWeaponInstanceEquipWeight,
  getWeaponSubtypeInfo,
  isEquipmentUnlocked,
  WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS,
} from '../../database/progression';
import { AREA_REGISTRY, LOCAL_ROOM_REGISTRY, REGION_REGISTRY } from '../../database/world';
import { formatOrionLoreLabel, getOrionGraphicsSettings } from '../../systems';
import {
  EnemyWikiDefinition,
  GemId,
  ItemWikiDefinition,
  OrionState,
  RoomDefinition,
  WEAPON_CATEGORIES,
  WeaponCategory,
  WeaponDefinition,
} from '../../types';
import { SpriteCanvasIcon } from './SatchelCanvases';

/**
 * Category tab identifier for the in-game Pilot Codex (`SatchelCodexTab`).
 */
export type CodexCategoryTab = 'bestiary' | 'arsenal' | 'relics' | 'chronicles';

/**
 * Props for `SatchelCodexTab`, the discovery-gated in-game Pilot Codex viewer.
 */
export interface SatchelCodexTabProps {
  state: OrionState;
}

interface ChronicleCodexEntry {
  id: string;
  kind: 'Frame Chassis' | 'Region' | 'Zone' | 'Landmark';
  title: string;
  subtitle: string;
  badgeColor: string;
  description: string;
  lore: string;
}

/**
 * Determines whether a specific enemy archetype has been discovered by the pilot
 * via sightings within light range, combat engagement, or narrative progression flags.
 */
export function isEnemyDiscoveredInCodex(state: OrionState, def: EnemyWikiDefinition): boolean {
  if (state.discoveredCodex?.enemies?.[def.type]) {
    return true;
  }
  for (const e of state.enemies || []) {
    if (e.type !== def.type) continue;
    const dist = Math.hypot(e.x - state.x, e.y - state.y);
    if (
      (!e.isSubmerged && dist <= 84) ||
      e.hurt > 0 ||
      e.frame.integrity < e.frame.maxIntegrity ||
      state.lockedTargetId === e.id
    ) {
      return true;
    }
  }
  const flags = state.flags || {};
  if (def.type === 'bog_poe' && (flags.poe_state || state.room === '0,0')) return true;
  if (def.type === 'orc_scout' && flags.scout_state) return true;
  if (def.type === 'percival_knight' && flags.percival_defeated) return true;
  if (def.type === 'tristan_knight' && flags.tristan_defeated) return true;
  if (def.type === 'bors_knight' && flags.bors_defeated) return true;
  if (def.type === 'lady_of_the_lake' && flags.lady_defeated) return true;
  if (def.type === 'town_npc' && (flags.town_trust || state.areaId.includes('border_town'))) {
    return true;
  }
  return false;
}

/**
 * Determines whether a weapon, shield, or catalyst has been discovered by the pilot
 * via starting kit, salvage drops, or unlocked equipment slots.
 */
export function isWeaponDiscoveredInCodex(state: OrionState, def: WeaponDefinition): boolean {
  if (state.discoveredCodex?.weapons?.[def.id]) {
    return true;
  }
  return isEquipmentUnlocked(state, def.id);
}

/**
 * Determines whether an item, consumable, relic, or gemstone has been discovered by the pilot.
 */
export function isItemDiscoveredInCodex(state: OrionState, def: ItemWikiDefinition): boolean {
  if (state.discoveredCodex?.items?.[def.id]) {
    return true;
  }
  if ((state.inventorySlots || []).some((s) => s.itemId === def.id && s.count > 0)) {
    return true;
  }
  const eq = state.equipmentSlots;
  if (
    eq?.slot2 === def.id ||
    eq?.slot3 === def.id ||
    (eq?.belt || []).some((b) => b === def.id)
  ) {
    return true;
  }
  if (def.id === 'trade_coin' && (state.salvageScrap || 0) > 0) {
    return true;
  }
  if (state.socketedFeatGems) {
    for (const gemMap of Object.values(state.socketedFeatGems)) {
      if ((gemMap as Record<string, number | undefined>)?.[def.id]) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Renders the discovery-gated in-game Pilot Codex (`BESTIARY`, `ARSENAL`, `RELICS`, and `CHRONICLES`)
 * using a Single-Focus Full-Width Compact List and a Slide-Over Codex Entry Detail Inspector.
 */
export const SatchelCodexTab: React.FC<SatchelCodexTabProps> = ({ state }) => {
  const [category, setCategory] = useState<CodexCategoryTab>('bestiary');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  const [arsenalClassFilter, setArsenalClassFilter] = useState<'ALL' | WeaponCategory>('ALL');
  const [arsenalSubtypeFilter, setArsenalSubtypeFilter] = useState<
    'ALL' | 'Custom' | 'Magitech' | 'Legendary'
  >('ALL');

  const devMode = getOrionGraphicsSettings().devModeEnabled;
  const q = searchQuery.trim().toLowerCase();

  const discoveredEnemies = useMemo(() => {
    const all = Object.values(ENEMY_REGISTRY);
    const unlocked = all.filter((e) => isEnemyDiscoveredInCodex(state, e));
    return {
      totalCount: all.length,
      items: unlocked
        .filter(
          (e) =>
            !q ||
            e.name.toLowerCase().includes(q) ||
            (e.faction || '').toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.lore.toLowerCase().includes(q)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
      unlockedCount: unlocked.length,
    };
  }, [state, state.enemies, state.discoveredCodex, state.flags, state.lockedTargetId, q]);

  const discoveredWeapons = useMemo(() => {
    const all = Object.values(WEAPON_REGISTRY).filter(
      (w) =>
        !w.id.startsWith('utility_') &&
        !w.id.startsWith('aux3_') &&
        !w.id.startsWith('aux4_')
    );
    const unlocked = all.filter((w) => isWeaponDiscoveredInCodex(state, w));
    return {
      totalCount: all.length,
      items: unlocked
        .filter((w) => {
          const stInfo = getWeaponSubtypeInfo(w.id);
          if (arsenalClassFilter !== 'ALL' && stInfo.category !== arsenalClassFilter) {
            return false;
          }
          if (arsenalSubtypeFilter !== 'ALL' && stInfo.variantSubtype !== arsenalSubtypeFilter) {
            return false;
          }
          return (
            !q ||
            w.name.toLowerCase().includes(q) ||
            stInfo.subtype.toLowerCase().includes(q) ||
            (w.weaponClass || w.class || '').toLowerCase().includes(q) ||
            w.description.toLowerCase().includes(q) ||
            w.lore.toLowerCase().includes(q)
          );
        })
        .sort((a, b) => {
          const sa = getWeaponSubtypeInfo(a.id);
          const sb = getWeaponSubtypeInfo(b.id);
          if (sa.category !== sb.category) return sa.category.localeCompare(sb.category);
          if (sa.functionalType !== sb.functionalType) {
            return sa.functionalType.localeCompare(sb.functionalType);
          }
          return a.name.localeCompare(b.name);
        }),
      unlockedCount: unlocked.length,
    };
  }, [
    state,
    state.equipmentSlots,
    state.equippedWeapons,
    state.discoveredCodex,
    q,
    arsenalClassFilter,
    arsenalSubtypeFilter,
  ]);

  const discoveredItems = useMemo(() => {
    const all = Object.values(ITEM_REGISTRY);
    const unlocked = all.filter((it) => isItemDiscoveredInCodex(state, it));
    return {
      totalCount: all.length,
      items: unlocked
        .filter(
          (it) =>
            !q ||
            it.name.toLowerCase().includes(q) ||
            it.category.toLowerCase().includes(q) ||
            it.description.toLowerCase().includes(q) ||
            it.lore.toLowerCase().includes(q)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
      unlockedCount: unlocked.length,
    };
  }, [
    state,
    state.inventorySlots,
    state.equipmentSlots,
    state.salvageScrap,
    state.discoveredCodex,
    q,
  ]);

  const discoveredChronicles = useMemo(() => {
    const entries: ChronicleCodexEntry[] = [];
    const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
    if (trait) {
      entries.push({
        id: `frame:${trait.id}`,
        kind: 'Frame Chassis',
        title: `${trait.name} (${trait.frameModel || 'PNSY W416'})`,
        subtitle: `${trait.reactor} Reactor · ${trait.defaultDamageStyle} Specialization`,
        badgeColor: '#38bdf8',
        description: trait.identity,
        lore: trait.lore,
      });
    }

    const allRegions = Object.values(REGION_REGISTRY);
    for (const reg of allRegions) {
      const isVisited =
        state.regionId === reg.id ||
        (state.discoveredWaygates || []).some((wg) => wg === reg.waygate?.id) ||
        reg.localAreaIds.includes(state.areaId);
      if (isVisited) {
        entries.push({
          id: `region:${reg.id}`,
          kind: 'Region',
          title: reg.title || reg.name,
          subtitle: `${reg.world} · ${reg.culture} (${reg.desyncStatus})`,
          badgeColor: '#c084fc',
          description: reg.description,
          lore: reg.lore,
        });
      }
    }

    const allAreas = Object.values(AREA_REGISTRY);
    for (const area of allAreas) {
      const isVisited =
        state.areaId === area.id ||
        (state.discoveredWaystations || []).some((ws) => ws === area.waystation?.id);
      if (isVisited) {
        entries.push({
          id: `area:${area.id}`,
          kind: 'Zone',
          title: formatOrionLoreLabel(area.title || area.name, devMode),
          subtitle: `Recommended Lv.${area.recommendedLevels} · ${area.world}`,
          badgeColor: '#50fa7b',
          description: area.description,
          lore: area.lore,
        });
      }
    }

    const allRooms: RoomDefinition[] = Object.values(LOCAL_ROOM_REGISTRY);
    for (const rm of allRooms) {
      if (rm.coord === '-4,0' && state.room !== '-4,0') continue;
      const exploredMap = state.exploredTiles?.[rm.coord];
      const hasExplored = Boolean(exploredMap && Object.keys(exploredMap).length > 0);
      const isVisited =
        state.room === rm.coord ||
        hasExplored ||
        Boolean(state.clearedRooms?.[rm.coord]);
      if (isVisited) {
        const cleanBanner = formatOrionLoreLabel(rm.bannerTitle, devMode);
        entries.push({
          id: `room:${rm.coord}`,
          kind: 'Landmark',
          title: formatOrionLoreLabel(rm.title, devMode),
          subtitle: devMode ? `Sector [${rm.coord}] · ${rm.bannerTitle}` : cleanBanner,
          badgeColor: '#fbbf24',
          description:
            rm.landmarkLabel ||
            (devMode
              ? `Charted sector [${rm.coord}] within ${rm.bannerTitle}.`
              : `Charted landmark within ${cleanBanner}.`),
          lore: `Safety Classification: ${(rm.lighting?.safetyTier || 'trail').toUpperCase()}. Field telemetry logged in Pilot Codex.`,
        });
      }
    }

    const totalPossible =
      1 + allRegions.length + allAreas.length + Math.max(1, allRooms.length - 1);

    return {
      totalCount: totalPossible,
      unlockedCount: entries.length,
      items: entries.filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.kind.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.lore.toLowerCase().includes(q)
      ),
    };
  }, [
    state,
    state.room,
    state.areaId,
    state.regionId,
    state.exploredTiles,
    state.clearedRooms,
    q,
    devMode,
  ]);

  const totalDiscovered =
    discoveredEnemies.unlockedCount +
    discoveredWeapons.unlockedCount +
    discoveredItems.unlockedCount +
    discoveredChronicles.unlockedCount;

  const totalCatalog =
    discoveredEnemies.totalCount +
    discoveredWeapons.totalCount +
    discoveredItems.totalCount +
    discoveredChronicles.totalCount;

  const activeEnemy =
    category === 'bestiary'
      ? discoveredEnemies.items.find((e) => e.type === selectedId) || null
      : null;
  const activeWeapon =
    category === 'arsenal'
      ? discoveredWeapons.items.find((w) => w.id === selectedId) || null
      : null;
  const activeItem =
    category === 'relics'
      ? discoveredItems.items.find((it) => it.id === selectedId) || null
      : null;
  const activeChronicle =
    category === 'chronicles'
      ? discoveredChronicles.items.find((c) => c.id === selectedId) || null
      : null;

  const openEntryInspector = (id: string) => {
    soundSystem.playSelect();
    setSelectedId(id);
    setIsInspectorOpen(true);
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden text-[10px]">
      {/* Clean Two-Row Codex Header: Category Tabs + Recorded Progress on Row 1, Search + Filters on Row 2 */}
      <div className="flex flex-col gap-1 px-2 py-1.5 bg-[#090d14] border border-[#1e293b] rounded-xs shrink-0">
        {/* Row 1: Category Tabs + Total Recorded Progress */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto min-w-0">
            {(
              [
                {
                  id: 'bestiary' as const,
                  label: 'Bestiary',
                  count: discoveredEnemies.unlockedCount,
                  total: discoveredEnemies.totalCount,
                  activeCls: 'bg-[#f43f5e] text-[#05070a]',
                },
                {
                  id: 'arsenal' as const,
                  label: 'Arsenal',
                  count: discoveredWeapons.unlockedCount,
                  total: discoveredWeapons.totalCount,
                  activeCls: 'bg-[#ffd27d] text-[#05070a]',
                },
                {
                  id: 'relics' as const,
                  label: 'Relics & Items',
                  count: discoveredItems.unlockedCount,
                  total: discoveredItems.totalCount,
                  activeCls: 'bg-[#50fa7b] text-[#05070a]',
                },
                {
                  id: 'chronicles' as const,
                  label: 'Chronicles',
                  count: discoveredChronicles.unlockedCount,
                  total: discoveredChronicles.totalCount,
                  activeCls: 'bg-[#38bdf8] text-[#05070a]',
                },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setCategory(t.id);
                  setSelectedId(null);
                  setIsInspectorOpen(false);
                }}
                className={`px-2 py-0.5 rounded-xs font-bold text-[10px] transition-colors cursor-pointer shrink-0 ${
                  category === t.id
                    ? t.activeCls
                    : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#e2e8f0] border border-[#1e293b]'
                }`}
              >
                {t.label} ({t.count}/{t.total})
              </button>
            ))}
          </div>

          <span className="text-[9px] font-mono tabular-nums text-[#94a3b8] shrink-0">
            Recorded <b className="text-[#38bdf8]">{totalDiscovered}/{totalCatalog}</b>
          </span>
        </div>

        {/* Row 2: Search Input + Optional Arsenal Class & Subtype Filters */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1e293b]/70">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search codex entries..."
            className="px-2 py-0.5 bg-[#05070a] border border-[#334155] rounded-xs text-[11px] text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#50fa7b] w-44 sm:w-52 shrink-0"
          />

          {category === 'arsenal' && (
            <div className="flex items-center gap-1.5 min-w-0">
              <select
                value={arsenalClassFilter}
                onChange={(e) => {
                  soundSystem.playSelect();
                  setArsenalClassFilter(e.target.value as 'ALL' | WeaponCategory);
                }}
                className="max-w-[155px] truncate px-2 py-0.5 bg-[#05070a] border border-[#334155] rounded-xs text-[11px] text-[#ffd27d] font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All 8 Classes</option>
                {WEAPON_CATEGORIES.map((catOpt) => (
                  <option key={catOpt} value={catOpt}>
                    {catOpt}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 shrink-0">
                {(['ALL', 'Custom', 'Magitech', 'Legendary'] as const).map((subOpt) => (
                  <button
                    key={subOpt}
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setArsenalSubtypeFilter(subOpt);
                    }}
                    className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer ${
                      arsenalSubtypeFilter === subOpt
                        ? 'bg-[#ffd27d] text-[#05070a] border-[#fde047]'
                        : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:text-[#e2e8f0]'
                    }`}
                  >
                    {subOpt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Compact Scannable Codex List */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#1e293b]/80 bg-[#090d14]/90 border border-[#1e293b] rounded-xs">
        {category === 'bestiary' &&
          (discoveredEnemies.items.length === 0 ? (
            <div className="p-6 text-center text-[#64748b] italic">
              No bestiary sightings match your query yet. Approach entities within your light radius
              or engage them in the bog to log their codex dossier.
            </div>
          ) : (
            discoveredEnemies.items.map((enemy) => (
              <button
                key={enemy.type}
                type="button"
                data-menu-focusable="true"
                onClick={() => openEntryInspector(enemy.type)}
                className="w-full px-2.5 py-2 hover:bg-[#1e293b]/70 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {enemy.sprite?.base64 ? (
                    <SpriteCanvasIcon
                      base64={enemy.sprite.base64}
                      cellWidth={enemy.sprite.cellWidth || 16}
                      cellHeight={enemy.sprite.cellHeight || 16}
                      sizeClass="w-5 h-5 shrink-0"
                    />
                  ) : (
                    <span
                      className="w-3.5 h-3.5 rounded-xs inline-block border border-black/40 shrink-0"
                      style={{ backgroundColor: enemy.emissiveColor || '#f43f5e' }}
                    />
                  )}
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-[#f8fafc] text-[11px]">{enemy.name}</span>
                    <span className="text-[#64748b] mx-1.5">·</span>
                    <span className="text-[9px] text-[#94a3b8]">
                      {(enemy.faction || 'hostile').toUpperCase()} · {enemy.damageType} ({enemy.damage} DMG)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[9px] font-mono tabular-nums text-[#38bdf8]">
                  <span>
                    SHLD {enemy.shields.capacity} · ARM {enemy.armor.threshold}/{enemy.armor.rating} · FRM {enemy.frameIntegrity}
                  </span>
                  <span className="text-[#64748b]">Inspect →</span>
                </div>
              </button>
            ))
          ))}

        {category === 'arsenal' &&
          (discoveredWeapons.items.length === 0 ? (
            <div className="p-6 text-center text-[#64748b] italic">
              No armaments recorded matching your filter. Salvage weapons or shields in the bog to
              unlock their technical schematics.
            </div>
          ) : (
            discoveredWeapons.items.map((w) => {
              const wt = getWeaponInstanceEquipWeight(w.id, state);
              const stInfo = getWeaponSubtypeInfo(w.id);
              const primaryAction = w.moveset?.[0];
              const primaryFamily = primaryAction?.damageFamily || 'Kinetic';
              return (
                <button
                  key={w.id}
                  type="button"
                  data-menu-focusable="true"
                  onClick={() => openEntryInspector(w.id)}
                  className="w-full px-2.5 py-2 hover:bg-[#1e293b]/70 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {w.iconSprite?.base64 && (
                      <SpriteCanvasIcon
                        base64={w.iconSprite.base64}
                        col={w.iconSprite.col || 0}
                        row={w.iconSprite.row || 0}
                        cellWidth={w.iconSprite.cellWidth || 16}
                        cellHeight={w.iconSprite.cellHeight || 16}
                        sizeClass="w-5 h-5 shrink-0"
                      />
                    )}
                    <div className="min-w-0 truncate">
                      <span className="font-bold text-[#ffd27d] text-[11px]">{w.name}</span>
                      <span className="text-[#64748b] mx-1.5">·</span>
                      <span className="text-[9px] text-[#94a3b8]">
                        {stInfo.variantSubtype} · {stInfo.category} ({stInfo.functionalType}) · {wt} WT
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-[9px] font-mono tabular-nums">
                    <span className="text-[#4ade80] font-bold">
                      {w.damagePerShot > 0
                        ? `${w.damagePerShot} ${w.primaryDamageType} (${primaryFamily})`
                        : `Guard (${w.primaryDamageType})`}
                    </span>
                    <span className="text-[#64748b]">Inspect →</span>
                  </div>
                </button>
              );
            })
          ))}

        {category === 'relics' &&
          (discoveredItems.items.length === 0 ? (
            <div className="p-6 text-center text-[#64748b] italic">
              No relics, consumables, or gemstones recorded yet. Loot caches and fallen foes to
              log field specimens.
            </div>
          ) : (
            discoveredItems.items.map((item) => {
              const isGem = item.id in GEMSTONE_REGISTRY;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-menu-focusable="true"
                  onClick={() => openEntryInspector(item.id)}
                  className="w-full px-2.5 py-2 hover:bg-[#1e293b]/70 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.iconSprite?.base64 ? (
                      <SpriteCanvasIcon
                        base64={item.iconSprite.base64}
                        cellWidth={item.iconSprite.cellWidth || 16}
                        cellHeight={item.iconSprite.cellHeight || 16}
                        sizeClass="w-5 h-5 shrink-0"
                      />
                    ) : (
                      <span
                        className="w-3.5 h-3.5 rounded-xs inline-block border border-black/40 shrink-0"
                        style={{ backgroundColor: item.iconColor }}
                      />
                    )}
                    <div className="min-w-0 truncate">
                      <span className="font-bold text-[#50fa7b] text-[11px]">{item.name}</span>
                      <span className="text-[#64748b] mx-1.5">·</span>
                      <span className="text-[9px] text-[#94a3b8]">
                        {isGem ? 'GEMSTONE' : item.category.toUpperCase()}
                        {item.lightBonus
                          ? ` · ${item.lightBonus > 0 ? `+${item.lightBonus}` : item.lightBonus} Light`
                          : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-[9px] font-mono tabular-nums text-[#ffd27d]">
                    <span>
                      Buy {item.buyPrice || 0}g · Sell {item.sellPrice || 0}g
                    </span>
                    <span className="text-[#64748b]">Inspect →</span>
                  </div>
                </button>
              );
            })
          ))}

        {category === 'chronicles' &&
          (discoveredChronicles.items.length === 0 ? (
            <div className="p-6 text-center text-[#64748b] italic">
              No chronicle entries match your filter.
            </div>
          ) : (
            discoveredChronicles.items.map((entry) => (
              <button
                key={entry.id}
                type="button"
                data-menu-focusable="true"
                onClick={() => openEntryInspector(entry.id)}
                className="w-full px-2.5 py-2 hover:bg-[#1e293b]/70 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
              >
                <div className="min-w-0 truncate">
                  <span className="font-bold text-[11px]" style={{ color: entry.badgeColor }}>
                    {entry.title}
                  </span>
                  <span className="text-[#64748b] mx-1.5">·</span>
                  <span className="text-[9px] text-[#94a3b8]">{entry.subtitle}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[9px] text-[#94a3b8]">
                  <span className="uppercase">{entry.kind}</span>
                  <span className="text-[#64748b]">Inspect →</span>
                </div>
              </button>
            ))
          ))}
      </div>

      {/* Pop-Up / Slide-Over Codex Entry Detail Inspector */}
      {isInspectorOpen &&
        (activeEnemy || activeWeapon || activeItem || activeChronicle) && (
          <div className="absolute inset-0 z-30 bg-[#05070a]/95 backdrop-blur-xs border border-[#38bdf8]/50 rounded-xs flex flex-col p-3 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b] shrink-0">
              <button
                type="button"
                data-menu-back="true"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setIsInspectorOpen(false);
                }}
                className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] font-bold text-[10px] rounded-xs border border-[#475569] cursor-pointer"
              >
                ← Back to Codex List
              </button>
              <span className="text-[9px] text-[#94a3b8] uppercase font-bold tracking-wider">
                Codex Archive Dossier · {category.toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
              {activeEnemy && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {activeEnemy.sprite?.base64 && (
                        <SpriteCanvasIcon
                          base64={activeEnemy.sprite.base64}
                          cellWidth={activeEnemy.sprite.cellWidth || 16}
                          cellHeight={activeEnemy.sprite.cellHeight || 16}
                          sizeClass="w-8 h-8"
                        />
                      )}
                      <div>
                        <div className="text-[13px] font-bold text-[#f8fafc]">
                          {activeEnemy.name}
                          {devMode && (
                            <span className="ml-2 text-[9px] text-[#64748b] font-mono">
                              [{activeEnemy.type}]
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-[#94a3b8]">
                          Faction: {(activeEnemy.faction || 'hostile').toUpperCase()} · Weight:{' '}
                          {(activeEnemy.weightClass || 'medium').toUpperCase()} · Speed:{' '}
                          {activeEnemy.speed}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[9px] font-mono">
                    <div className="p-2 bg-[#090d14] border border-[#1e293b] rounded-xs">
                      <div className="text-[#94a3b8]">ATTACK</div>
                      <div className="text-[#f43f5e] font-bold text-[10px]">
                        {activeEnemy.damage} {activeEnemy.damageType}
                      </div>
                    </div>
                    <div className="p-2 bg-[#090d14] border border-[#1e293b] rounded-xs">
                      <div className="text-[#94a3b8]">SHIELD (L1)</div>
                      <div className="text-[#77c7ff] font-bold text-[10px]">
                        {activeEnemy.shields.capacity} ({activeEnemy.shields.type})
                      </div>
                    </div>
                    <div className="p-2 bg-[#090d14] border border-[#1e293b] rounded-xs">
                      <div className="text-[#94a3b8]">ARMOR (L2)</div>
                      <div className="text-[#ffd27d] font-bold text-[10px]">
                        {activeEnemy.armor.type} · {activeEnemy.armor.threshold}/{activeEnemy.armor.rating} ({activeEnemy.armor.durability} DUR)
                      </div>
                    </div>
                    <div className="p-2 bg-[#090d14] border border-[#1e293b] rounded-xs">
                      <div className="text-[#94a3b8]">FRAME (L3)</div>
                      <div className="text-[#8dd7ad] font-bold text-[10px]">
                        {activeEnemy.frameIntegrity} HP
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-1.5">
                    <div className="text-[#e2e8f0] text-[10px] leading-relaxed">
                      {activeEnemy.description}
                    </div>
                    <div className="pt-1.5 border-t border-[#1e293b] text-[#fde68a] italic text-[10px] leading-relaxed">
                      “{activeEnemy.lore}”
                    </div>
                  </div>
                </>
              )}

              {activeWeapon && (
                <>
                  {(() => {
                    const wt = getWeaponInstanceEquipWeight(activeWeapon.id, state);
                    const compSlots = getWeaponComponentSlots(activeWeapon.id)
                      .join(' / ')
                      .toUpperCase();
                    const stInfo = getWeaponSubtypeInfo(activeWeapon.id);
                    const primaryAction = activeWeapon.moveset?.[0];
                    const primaryFamily = primaryAction?.damageFamily || 'Kinetic';
                    const isLegendary = stInfo.variantSubtype === 'Legendary';
                    const isMagitech = stInfo.variantSubtype === 'Magitech';

                    return (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {activeWeapon.iconSprite?.base64 && (
                              <SpriteCanvasIcon
                                base64={activeWeapon.iconSprite.base64}
                                col={activeWeapon.iconSprite.col || 0}
                                row={activeWeapon.iconSprite.row || 0}
                                cellWidth={activeWeapon.iconSprite.cellWidth || 16}
                                cellHeight={activeWeapon.iconSprite.cellHeight || 16}
                                sizeClass="w-8 h-8"
                              />
                            )}
                            <div>
                              <div className="text-[13px] font-bold text-[#ffd27d]">
                                {activeWeapon.name}
                                {devMode && (
                                  <span className="ml-2 text-[9px] text-[#64748b] font-mono">
                                    [{activeWeapon.id}]
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-[#94a3b8]">
                                {stInfo.variantSubtype} · {stInfo.category} ▸ {stInfo.functionalType}{' '}
                                · {wt} WT ({(activeWeapon.weightClass || 'medium').toUpperCase()}) ·{' '}
                                {activeWeapon.handing || '1-hand'} ·{' '}
                                {isLegendary
                                  ? `${activeWeapon.legendarySpec?.boundRelicSlots.length ?? 0} Lore-Bound Mount`
                                  : isMagitech
                                    ? '1 Gem Socket'
                                    : `3 Slots (${compSlots})`}
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-[#4ade80] font-mono">
                            {activeWeapon.damagePerShot > 0
                              ? `${activeWeapon.damagePerShot} ${activeWeapon.primaryDamageType} (${primaryFamily})`
                              : `Support / Guard (${activeWeapon.primaryDamageType})`}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-1.5">
                          <div className="text-[#e2e8f0] text-[10px] leading-relaxed">
                            {activeWeapon.description}
                          </div>
                          <div className="pt-1.5 border-t border-[#1e293b] text-[#fde68a] italic text-[10px] leading-relaxed">
                            “{activeWeapon.lore}”
                          </div>
                        </div>

                        {activeWeapon.legendarySpec && (
                          <div className="p-2.5 bg-[#090d14] border border-[#f59e0b]/50 rounded-xs space-y-1 text-[9px]">
                            <div className="font-bold text-[#fde047]">
                              ★ Folklore Origin (
                              {activeWeapon.legendarySpec.originWorldId
                                .replace(/_/g, ' ')
                                .toUpperCase()}
                              ) · {activeWeapon.legendarySpec.folkloreTradition.toUpperCase()}
                            </div>
                            <div className="text-[#cbd5e1]">
                              {activeWeapon.legendarySpec.innateMechanicSummary}
                            </div>
                            <div className="text-[#7dd3fc]">
                              <b>World &amp; Hazard Link:</b>{' '}
                              {activeWeapon.legendarySpec.areaLoreConnection}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="text-[9px] font-bold text-[#94a3b8] uppercase">
                            Weapon Moveset &amp; Action Spec
                          </div>
                          {activeWeapon.moveset.map((act, idx) => (
                            <div
                              key={`${act.name}-${idx}`}
                              className="px-2.5 py-1.5 bg-[#090d14] border border-[#1e293b] rounded-xs flex flex-wrap items-center justify-between gap-1 text-[9px]"
                            >
                              <span className="text-[#38bdf8] font-bold">
                                S{idx + 1}: {act.name}
                              </span>
                              <span className="text-[#94a3b8] font-mono">
                                {act.damage > 0 ? `${act.damage} DMG · ` : ''}
                                {act.damageType} ({act.damageFamily}) · CD {act.cooldownSec}s ·{' '}
                                {act.heatCost} Heat · {act.range}px RNG
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              {activeItem && (
                <>
                  {(() => {
                    const isGem = activeItem.id in GEMSTONE_REGISTRY;
                    return (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {activeItem.iconSprite?.base64 ? (
                              <SpriteCanvasIcon
                                base64={activeItem.iconSprite.base64}
                                cellWidth={activeItem.iconSprite.cellWidth || 16}
                                cellHeight={activeItem.iconSprite.cellHeight || 16}
                                sizeClass="w-8 h-8"
                              />
                            ) : (
                              <span
                                className="w-5 h-5 rounded-xs inline-block border border-black/40"
                                style={{ backgroundColor: activeItem.iconColor }}
                              />
                            )}
                            <div>
                              <div className="text-[13px] font-bold text-[#50fa7b]">
                                {activeItem.name}
                              </div>
                              <div className="text-[9px] text-[#94a3b8]">
                                0 WT · {isGem ? 'GEMSTONE' : activeItem.category.toUpperCase()} ·
                                Buy {activeItem.buyPrice || 0}g · Sell {activeItem.sellPrice || 0}g
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-1.5">
                          <div className="text-[#e2e8f0] text-[10px] leading-relaxed">
                            {activeItem.description}
                          </div>
                          {isGem && (
                            <div className="pt-1.5 border-t border-[#1e293b] space-y-1 text-[9px]">
                              <div className="text-[#86efac]">
                                + Weapon Socket ({GEM_MOD_PREFIX_BY_ID[activeItem.id as GemId]}):{' '}
                                {WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[activeItem.id as GemId]}
                              </div>
                              <div className="text-[#7dd3fc]">
                                + Exterior Armor Socket:{' '}
                                {getHardwareGemBonusDescription('plating', activeItem.id as GemId)}
                              </div>
                            </div>
                          )}
                          <div className="pt-1.5 border-t border-[#1e293b] text-[#fde68a] italic text-[10px] leading-relaxed">
                            “{activeItem.lore}”
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              {activeChronicle && (
                <>
                  <div>
                    <div
                      className="text-[13px] font-bold"
                      style={{ color: activeChronicle.badgeColor }}
                    >
                      {activeChronicle.title}
                    </div>
                    <div className="text-[9px] text-[#94a3b8]">
                      {activeChronicle.kind.toUpperCase()} · {activeChronicle.subtitle}
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-1.5">
                    <div className="text-[#e2e8f0] text-[10px] leading-relaxed">
                      {activeChronicle.description}
                    </div>
                    <div className="pt-1.5 border-t border-[#1e293b] text-[#fde68a] italic text-[10px] leading-relaxed">
                      “{activeChronicle.lore}”
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
};
