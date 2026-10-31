/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../../database/characters';
import { ENEMY_REGISTRY } from '../../database/enemies';
import { WEAPON_REGISTRY } from '../../database/equipment/weapons';
import { ITEM_REGISTRY } from '../../database/items';
import { AREA_REGISTRY, LOCAL_ROOM_REGISTRY, REGION_REGISTRY } from '../../database/world';
import {
  EnemyWikiDefinition,
  ItemWikiDefinition,
  OrionState,
  RoomDefinition,
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
  // Check active visible/engaged enemies in the current room
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
  const eq = state.equipmentSlots;
  if (eq?.slot1 === def.id || eq?.slot2 === def.id || eq?.slot3 === def.id) {
    return true;
  }
  if ((state.equippedWeapons || []).includes(def.id)) {
    return true;
  }
  if ((eq?.ownedWeaponCounts?.[def.id] || 0) > 0) {
    return true;
  }
  if ((eq?.unlockedEquipment || []).includes(def.id)) {
    return true;
  }
  return false;
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
 * Renders the discovery-gated in-game Pilot Codex (`BESTIARY`, `ARSENAL`, `RELICS`, and `CHRONICLES`).
 * Only entries that the pilot has actually encountered, salvaged, or explored are displayed.
 */
export const SatchelCodexTab: React.FC<SatchelCodexTabProps> = ({ state }) => {
  const [category, setCategory] = useState<CodexCategoryTab>('bestiary');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    const all = Object.values(WEAPON_REGISTRY);
    const unlocked = all.filter((w) => isWeaponDiscoveredInCodex(state, w));
    return {
      totalCount: all.length,
      items: unlocked
        .filter(
          (w) =>
            !q ||
            w.name.toLowerCase().includes(q) ||
            (w.weaponClass || w.class || '').toLowerCase().includes(q) ||
            w.description.toLowerCase().includes(q) ||
            w.lore.toLowerCase().includes(q)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
      unlockedCount: unlocked.length,
    };
  }, [state, state.equipmentSlots, state.equippedWeapons, state.discoveredCodex, q]);

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
  }, [state, state.inventorySlots, state.equipmentSlots, state.salvageScrap, state.discoveredCodex, q]);

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
          title: area.title || area.name,
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
        entries.push({
          id: `room:${rm.coord}`,
          kind: 'Landmark',
          title: rm.title,
          subtitle: `Sector [${rm.coord}] · ${rm.bannerTitle}`,
          badgeColor: '#fbbf24',
          description:
            rm.landmarkLabel ||
            `Charted sector [${rm.coord}] within ${rm.bannerTitle}.`,
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
  }, [state, state.room, state.areaId, state.regionId, state.exploredTiles, state.clearedRooms, q]);

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

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden text-[10px]">
      {/* Codex Header & Discovery Progress */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 py-1 bg-[#090d14] border border-[#1e293b] rounded-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[#50fa7b] font-bold tracking-wide">
            📖 PILOT FIELD CODEX
          </span>
          <span className="text-[#64748b]">·</span>
          <span className="text-[#94a3b8] text-[9px]">
            ONLY SIGHTED & SALVAGED ENTRIES RECORDED
          </span>
        </div>
        <span className="text-[9.5px] font-bold text-[#38bdf8]">
          RECORDED: {totalDiscovered} / {totalCatalog}
        </span>
      </div>

      {/* Category Tabs & Search Input */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              {
                id: 'bestiary' as const,
                label: 'BESTIARY',
                count: discoveredEnemies.unlockedCount,
                total: discoveredEnemies.totalCount,
                activeCls: 'bg-[#f43f5e] text-[#05070a]',
              },
              {
                id: 'arsenal' as const,
                label: 'ARSENAL',
                count: discoveredWeapons.unlockedCount,
                total: discoveredWeapons.totalCount,
                activeCls: 'bg-[#ffd27d] text-[#05070a]',
              },
              {
                id: 'relics' as const,
                label: 'RELICS & ITEMS',
                count: discoveredItems.unlockedCount,
                total: discoveredItems.totalCount,
                activeCls: 'bg-[#50fa7b] text-[#05070a]',
              },
              {
                id: 'chronicles' as const,
                label: 'CHRONICLES',
                count: discoveredChronicles.unlockedCount,
                total: discoveredChronicles.totalCount,
                activeCls: 'bg-[#38bdf8] text-[#05070a]',
              },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                soundSystem.playMenuBeep();
                setCategory(t.id);
                setSelectedId(null);
              }}
              className={`px-2 py-0.5 rounded-xs font-bold text-[9.5px] transition-colors cursor-pointer shrink-0 ${
                category === t.id
                  ? t.activeCls
                  : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#1e293b] border border-[#1e293b]'
              }`}
            >
              {t.label} ({t.count}/{t.total})
            </button>
          ))}
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recorded codex..."
          className="px-2 py-0.5 bg-[#090d14] border border-[#334155] rounded-xs text-[9.5px] text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#50fa7b] w-44 max-w-full"
        />
      </div>

      {/* Discovered Entries View */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
        {category === 'bestiary' &&
          (discoveredEnemies.items.length === 0 ? (
            <div className="p-4 text-center text-[#64748b] bg-[#090d14]/70 border border-[#1e293b] rounded-xs italic">
              No bestiary sightings match your query yet. Approach entities within your light radius
              or engage them in the bog to log their codex dossier.
            </div>
          ) : (
            discoveredEnemies.items.map((enemy) => {
              const isExpanded = selectedId === enemy.type;
              return (
                <div
                  key={enemy.type}
                  onClick={() => {
                    soundSystem.playSelect();
                    setSelectedId(isExpanded ? null : enemy.type);
                  }}
                  className="p-2 bg-[#0f172a]/90 hover:bg-[#1e293b]/90 border border-[#334155] rounded-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {enemy.sprite?.base64 ? (
                        <SpriteCanvasIcon
                          base64={enemy.sprite.base64}
                          cellWidth={enemy.sprite.cellWidth || 16}
                          cellHeight={enemy.sprite.cellHeight || 16}
                          sizeClass="w-5 h-5"
                        />
                      ) : (
                        <span
                          className="w-3.5 h-3.5 rounded-xs inline-block border border-black/40"
                          style={{ backgroundColor: enemy.emissiveColor || '#f43f5e' }}
                        />
                      )}
                      <div>
                        <span className="font-bold text-[#f8fafc] text-[10.5px]">
                          {enemy.name}
                        </span>
                        <span className="ml-2 text-[8.5px] uppercase text-[#94a3b8]">
                          {(enemy.faction || 'hostile').toUpperCase()} · {enemy.damageType} ({enemy.damage} DMG)
                        </span>
                      </div>
                    </div>
                    <span className="text-[8.5px] text-[#38bdf8]">
                      SHLD {enemy.shields.capacity} · ARM {enemy.armor.threshold}/{enemy.armor.rating} · FRM {enemy.frameIntegrity}
                    </span>
                  </div>

                  <p className="mt-1 text-[#cbd5e1] text-[9.5px] leading-snug">
                    {enemy.description}
                  </p>

                  {isExpanded && (
                    <div className="mt-1.5 pt-1.5 border-t border-[#334155]/80 space-y-1 text-[9.5px]">
                      <div className="text-[#fde68a] italic leading-snug">
                        “{enemy.lore}”
                      </div>
                      <div className="flex flex-wrap gap-3 text-[8.5px] text-[#94a3b8] pt-0.5">
                        <span>Armor Type: {enemy.armor.type}</span>
                        <span>Armor Durability: {enemy.armor.durability}</span>
                        <span>Weight Class: {(enemy.weightClass || 'medium').toUpperCase()}</span>
                        <span>Speed: {enemy.speed}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ))}

        {category === 'arsenal' &&
          (discoveredWeapons.items.length === 0 ? (
            <div className="p-4 text-center text-[#64748b] bg-[#090d14]/70 border border-[#1e293b] rounded-xs italic">
              No armaments recorded matching your filter. Salvage weapons or shields in the bog to
              unlock their technical schematics.
            </div>
          ) : (
            discoveredWeapons.items.map((w) => {
              const isExpanded = selectedId === w.id;
              return (
                <div
                  key={w.id}
                  onClick={() => {
                    soundSystem.playSelect();
                    setSelectedId(isExpanded ? null : w.id);
                  }}
                  className="p-2 bg-[#0f172a]/90 hover:bg-[#1e293b]/90 border border-[#334155] rounded-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {w.iconSprite?.base64 && (
                        <SpriteCanvasIcon
                          base64={w.iconSprite.base64}
                          cellWidth={w.iconSprite.cellWidth || 16}
                          cellHeight={w.iconSprite.cellHeight || 16}
                          sizeClass="w-5 h-5"
                        />
                      )}
                      <div>
                        <span className="font-bold text-[#ffd27d] text-[10.5px]">
                          {w.name}
                        </span>
                        <span className="ml-2 text-[8.5px] text-[#94a3b8]">
                          {w.weaponClass || w.class} · {(w.weightClass || 'medium').toUpperCase()} · {w.handing || '1-hand'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[8.5px] text-[#4ade80]">
                      {w.damagePerShot} {w.primaryDamageType} · {w.shotsPerChain}x CHAIN
                    </span>
                  </div>

                  <p className="mt-1 text-[#cbd5e1] text-[9.5px] leading-snug">
                    {w.description}
                  </p>

                  {isExpanded && (
                    <div className="mt-1.5 pt-1.5 border-t border-[#334155]/80 space-y-1 text-[9.5px]">
                      <div className="text-[#fde68a] italic leading-snug">
                        “{w.lore}”
                      </div>
                      <div className="grid grid-cols-1 gap-1 pt-1">
                        {w.moveset.map((act, idx) => (
                          <div
                            key={`${act.name}-${idx}`}
                            className="px-1.5 py-0.5 bg-[#090d14] border border-[#1e293b] rounded-xs flex items-center justify-between text-[8.5px]"
                          >
                            <span className="text-[#38bdf8] font-bold">
                              S{idx + 1}: {act.name}
                            </span>
                            <span className="text-[#94a3b8]">
                              {act.damage} {act.damageType} · CD {act.cooldownSec}s
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ))}

        {category === 'relics' &&
          (discoveredItems.items.length === 0 ? (
            <div className="p-4 text-center text-[#64748b] bg-[#090d14]/70 border border-[#1e293b] rounded-xs italic">
              No relics, consumables, or gemstones recorded yet. Loot caches and fallen foes to
              log field specimens.
            </div>
          ) : (
            discoveredItems.items.map((item) => {
              const isExpanded = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    soundSystem.playSelect();
                    setSelectedId(isExpanded ? null : item.id);
                  }}
                  className="p-2 bg-[#0f172a]/90 hover:bg-[#1e293b]/90 border border-[#334155] rounded-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.iconSprite?.base64 ? (
                        <SpriteCanvasIcon
                          base64={item.iconSprite.base64}
                          cellWidth={item.iconSprite.cellWidth || 16}
                          cellHeight={item.iconSprite.cellHeight || 16}
                          sizeClass="w-5 h-5"
                        />
                      ) : (
                        <span
                          className="w-3.5 h-3.5 rounded-xs inline-block border border-black/40"
                          style={{ backgroundColor: item.iconColor }}
                        />
                      )}
                      <div>
                        <span className="font-bold text-[#50fa7b] text-[10.5px]">
                          {item.name}
                        </span>
                        <span className="ml-2 text-[8.5px] uppercase text-[#94a3b8]">
                          {item.category}
                          {item.lightBonus ? ` · +${item.lightBonus} LIGHT` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="text-[8.5px] text-[#ffd27d]">
                      VAL {item.sellPrice}c
                    </span>
                  </div>

                  <p className="mt-1 text-[#cbd5e1] text-[9.5px] leading-snug">
                    {item.description}
                  </p>

                  {isExpanded && (
                    <div className="mt-1.5 pt-1.5 border-t border-[#334155]/80 text-[#fde68a] italic text-[9.5px] leading-snug">
                      “{item.lore}”
                    </div>
                  )}
                </div>
              );
            })
          ))}

        {category === 'chronicles' &&
          (discoveredChronicles.items.length === 0 ? (
            <div className="p-4 text-center text-[#64748b] bg-[#090d14]/70 border border-[#1e293b] rounded-xs italic">
              No chronicle entries match your filter.
            </div>
          ) : (
            discoveredChronicles.items.map((entry) => {
              const isExpanded = selectedId === entry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => {
                    soundSystem.playSelect();
                    setSelectedId(isExpanded ? null : entry.id);
                  }}
                  className="p-2 bg-[#0f172a]/90 hover:bg-[#1e293b]/90 border border-[#334155] rounded-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span
                        className="font-bold text-[10.5px]"
                        style={{ color: entry.badgeColor }}
                      >
                        {entry.title}
                      </span>
                      <span className="ml-2 text-[8.5px] text-[#94a3b8]">
                        {entry.subtitle}
                      </span>
                    </div>
                    <span className="text-[8.5px] uppercase text-[#64748b]">
                      {entry.kind}
                    </span>
                  </div>

                  <p className="mt-1 text-[#cbd5e1] text-[9.5px] leading-snug">
                    {entry.description}
                  </p>

                  {isExpanded && (
                    <div className="mt-1.5 pt-1.5 border-t border-[#334155]/80 text-[#fde68a] italic text-[9.5px] leading-snug">
                      “{entry.lore}”
                    </div>
                  )}
                </div>
              );
            })
          ))}
      </div>
    </div>
  );
};
