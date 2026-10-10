/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SKILLS } from '../constants';
import {
  assignSkill,
  buyVendorItem,
  getKnightState,
  subscribeKnightState,
  VENDOR_ITEMS,
  VendorItem,
} from '../stateStore';
import { SkillId } from '../types';

export interface KnightSatchelProps {
  onClose: () => void;
}

type TabType = 'equipment' | 'stats' | 'merchant';

export const KnightSatchel: React.FC<KnightSatchelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('equipment');
  const [knightState, setKnightState] = useState(() => getKnightState());
  const [shopFeedback, setShopFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeKnightState(() => {
      const current = getKnightState();
      setKnightState(current ? { ...current } : null);
    });
    return unsub;
  }, []);

  const st = knightState;

  const handleAssign = (slot: 'L' | 'R', skillId: SkillId) => {
    assignSkill(slot, skillId);
  };

  const handleBuy = (item: VendorItem) => {
    const res = buyVendorItem(item);
    setShopFeedback(res.message);
    setTimeout(() => {
      setShopFeedback(null);
    }, 2200);
  };

  return (
    <div className="absolute inset-0 z-20 bg-[#0a180a]/92 backdrop-blur-xs flex flex-col p-2 sm:p-2.5 overflow-hidden text-[#9ad482] font-mono select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-[#306028]">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#50fa7b]">
          <span className="w-2 h-2 rounded-full bg-[#50fa7b] animate-pulse inline-block" />
          <span>KNIGHT SATCHEL</span>
          <span className="text-[10px] text-[#70a860] bg-[#1a3818] px-1 py-0.2 rounded-xs">
            SHIFT
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] px-1.5 py-0.5 bg-[#1c381c] hover:bg-[#306028] text-[#9ad482] rounded-xs font-bold border border-[#306028]"
          title="Resume Game (B / SHIFT)"
        >
          ✕ CLOSE
        </button>
      </div>

      {/* Resource Strip */}
      <div className="flex items-center justify-between px-1.5 py-0.8 bg-[#122412] border-b border-[#244820] text-[10px] sm:text-[11px] my-1 rounded-xs">
        <div className="flex items-center gap-3">
          <span className="text-amber-300 font-bold">🪙 {st ? st.coins : 0} COINS</span>
          <span className="text-[#50fa7b] font-bold">
            🧪 {st ? `${st.flasks}/${st.maxFlasks}` : '0/0'} FLASKS
          </span>
          <span className="text-cyan-300 font-bold">🗝️ {st ? st.keys : 0} KEYS</span>
        </div>
        <span className="text-[9.5px] text-[#70a860]">
          {st?.hasDouble ? '🪽 D-JUMP ON' : '🔒 D-JUMP'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#244820] mb-1.5 bg-[#0e1c0e] rounded-xs overflow-hidden">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex-1 py-1 text-[10px] font-bold uppercase transition-colors text-center ${
            activeTab === 'equipment'
              ? 'bg-[#1e441e] text-[#50fa7b] border-b-2 border-[#50fa7b]'
              : 'text-[#609050] hover:text-[#9ad482]'
          }`}
        >
          1. EQUIPMENT (L/R)
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-1 text-[10px] font-bold uppercase transition-colors text-center ${
            activeTab === 'stats'
              ? 'bg-[#1e441e] text-[#50fa7b] border-b-2 border-[#50fa7b]'
              : 'text-[#609050] hover:text-[#9ad482]'
          }`}
        >
          2. ATTRIBUTES
        </button>
        <button
          onClick={() => setActiveTab('merchant')}
          className={`flex-1 py-1 text-[10px] font-bold uppercase transition-colors text-center ${
            activeTab === 'merchant'
              ? 'bg-[#1e441e] text-amber-300 border-b-2 border-amber-400'
              : 'text-[#609050] hover:text-amber-200'
          }`}
        >
          3. MERCHANT
        </button>
      </div>

      {shopFeedback && (
        <div className="mb-1 py-0.5 px-2 bg-[#123812] border border-[#50fa7b] text-center text-[10px] text-[#50fa7b] font-bold animate-pulse rounded-xs shadow-sm">
          {shopFeedback}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
        {/* TAB 1: EQUIPMENT */}
        {activeTab === 'equipment' && (
          <div className="space-y-1.5">
            <div className="text-[9.5px] text-[#609050] italic px-1">
              Assign abilities to L and R bumpers. Flask uses pickup charges; Spells cost EP; Skills cost SP.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {Object.values(SKILLS).map((skill) => {
                const isAssignedL = st?.assignedL === skill.id;
                const isAssignedR = st?.assignedR === skill.id;

                const costBadge =
                  skill.costType === 'flask'
                    ? '1 FLASK'
                    : skill.costType === 'ep'
                    ? `${skill.cost} EP`
                    : `${skill.cost} SP`;

                const badgeColor =
                  skill.costType === 'flask'
                    ? 'bg-[#1a3d1a] text-[#50fa7b]'
                    : skill.costType === 'ep'
                    ? 'bg-[#1a2d44] text-[#8be9fd]'
                    : 'bg-[#3d3214] text-[#f1fa8c]';

                return (
                  <div
                    key={skill.id}
                    className="bg-[#122412] border border-[#244820] rounded-xs p-1.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-[#e6f5d0] text-[11px]">
                          {skill.name}
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded-xs font-semibold ${badgeColor}`}
                        >
                          {costBadge}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-[#70a860] leading-tight mb-1.5">
                        {skill.description}
                      </p>
                    </div>

                    <div className="flex gap-1 pt-1 border-t border-[#1a381a]">
                      <button
                        onClick={() => handleAssign('L', skill.id)}
                        className={`flex-1 py-0.8 px-1 rounded-xs text-[10px] font-bold transition-colors ${
                          isAssignedL
                            ? 'bg-[#50fa7b] text-[#0b1c0b]'
                            : 'bg-[#183018] text-[#8ec878] hover:bg-[#244820]'
                        }`}
                      >
                        {isAssignedL ? '✓ L SLOT' : 'EQUIP L'}
                      </button>
                      <button
                        onClick={() => handleAssign('R', skill.id)}
                        className={`flex-1 py-0.8 px-1 rounded-xs text-[10px] font-bold transition-colors ${
                          isAssignedR
                            ? 'bg-[#bd93f9] text-[#0b1c0b]'
                            : 'bg-[#183018] text-[#8ec878] hover:bg-[#244820]'
                        }`}
                      >
                        {isAssignedR ? '✓ R SLOT' : 'EQUIP R'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ATTRIBUTES & STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-1.5 bg-[#122412] p-2 rounded-xs border border-[#244820]">
            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              <div>
                <div className="text-red-400 font-bold mb-0.5 flex justify-between">
                  <span>❤️ HEALTH (HP)</span>
                  <span>{st?.hp} / {st?.maxHp}</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: st?.maxHp || 4 }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block w-3.5 h-3.5 rounded-xs ${
                        i < (st?.hp || 0)
                          ? 'bg-red-500'
                          : 'bg-red-950 border border-red-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-yellow-400 font-bold mb-0.5 flex justify-between">
                  <span>⚡ STAMINA (SP)</span>
                  <span>{Math.floor(st?.sp || 0)} / {st?.maxSp}</span>
                </div>
                <div className="w-full bg-[#1e2010] h-3.5 rounded-xs overflow-hidden border border-yellow-800/60">
                  <div
                    className="bg-yellow-400 h-full transition-all duration-150"
                    style={{
                      width: `${Math.min(100, ((st?.sp || 0) / (st?.maxSp || 4)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="text-cyan-400 font-bold mb-0.5 flex justify-between">
                  <span>🔷 ENERGY (EP)</span>
                  <span>{st?.ep} / {st?.maxEp}</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: st?.maxEp || 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block w-3.5 h-3.5 rounded-xs ${
                        i < (st?.ep || 0)
                          ? 'bg-cyan-400'
                          : 'bg-cyan-950 border border-cyan-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-emerald-400 font-bold mb-0.5 flex justify-between">
                  <span>🛡️ POISE (AP)</span>
                  <span>{st?.ap} / {st?.maxAp}</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: st?.maxAp || 2 }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block w-3.5 h-3.5 rounded-xs ${
                        i < (st?.ap || 0)
                          ? 'bg-emerald-400'
                          : 'bg-emerald-950 border border-emerald-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1a381a] space-y-1 text-[10px] text-[#70a860]">
              <div className="flex justify-between">
                <span>MID-AIR DOUBLE JUMP:</span>
                <span className={st?.hasDouble ? 'text-[#50fa7b] font-bold' : 'text-gray-400'}>
                  {st?.hasDouble ? 'UNLOCKED' : 'LOCKED (FIND JUMP ARTIFACT)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>DUNGEON FLOORS CLEARED:</span>
                <span className="text-[#f1fa8c] font-bold">{st?.cleared || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WANDERING MERCHANT */}
        {activeTab === 'merchant' && (
          <div className="space-y-1.5">
            <div className="text-[9.5px] text-[#80a860] italic px-1">
              Exchange coins found in the dungeon for permanent attribute gems & flask shards.
            </div>

            <div className="space-y-1">
              {VENDOR_ITEMS.map((item) => {
                const canAfford = Boolean(st && st.coins >= item.cost);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-1.5 bg-[#122412] border border-[#244820] rounded-xs"
                  >
                    <div>
                      <div className="font-bold text-[#f1fa8c] text-[11px]">
                        {item.name}
                      </div>
                      <div className="text-[9.5px] text-[#70a860]">
                        {item.description}
                      </div>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => handleBuy(item)}
                      className={`px-2 py-1 rounded-xs font-bold text-[10px] transition-colors border ${
                        canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-black border-amber-300'
                          : 'bg-[#182418] text-[#506850] border-[#223322] cursor-not-allowed opacity-60'
                      }`}
                    >
                      BUY ({item.cost}c)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="pt-1 mt-1 border-t border-[#244820] flex items-center justify-between text-[9px] text-[#609050]">
        <span>USE TABS TO BROWSE</span>
        <span>PRESS B OR SHIFT TO RESUME</span>
      </div>
    </div>
  );
};
