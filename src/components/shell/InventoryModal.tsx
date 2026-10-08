/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SKILLS } from '../../cartridges/knight/constants';
import {
  assignSkill,
  buyVendorItem,
  getKnightState,
  subscribeKnightState,
  VENDOR_ITEMS,
  VendorItem,
} from '../../cartridges/knight/stateStore';
import { SkillId } from '../../types/knight';

interface InventoryModalProps {
  onClose: () => void;
}

type TabType = 'equipment' | 'stats' | 'vendor';

export const InventoryModal: React.FC<InventoryModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('equipment');
  const [knightState, setKnightState] = useState(() => getKnightState());
  const [shopFeedback, setShopFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeKnightState(() => {
      setKnightState(getKnightState() ? { ...getKnightState()! } : null);
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
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#1b221b] border-2 border-[#00ff33]/40 rounded-xl max-w-xl w-full text-[#d0d0a8] font-mono shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#00ff33]/30 bg-[#121812]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wider text-emerald-400 text-sm">
              KNIGHT SATCHEL & INVENTORY
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs border border-[#00ff33]/50 text-[#00ff33] hover:bg-[#00ff33] hover:text-[#0f300f] rounded-xs font-bold transition-colors"
          >
            CLOSE (ESC)
          </button>
        </div>

        {/* Currency & Quick Belt Bar */}
        <div className="bg-[#161c16] px-4 py-2 border-b border-[#00ff33]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span>🪙 COINS:</span>
              <span className="text-sm">{st ? st.coins : 0}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <span>🧪 FLASKS:</span>
              <span className="text-sm">
                {st ? `${st.flasks}/${st.maxFlasks}` : '0/0'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <span>🗝️ KEYS:</span>
              <span className="text-sm">{st ? st.keys : 0}</span>
            </div>
          </div>
          <div className="text-[11px] text-gray-400">
            {st?.hasDouble ? '🪽 Double Jump Unlocked' : '🔒 Double Jump Locked'}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#00ff33]/20 bg-[#141a14]">
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 py-2 text-xs font-bold uppercase transition-colors border-b-2 ${
              activeTab === 'equipment'
                ? 'border-emerald-400 text-emerald-300 bg-[#182018]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Equipment (L & R)
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 text-xs font-bold uppercase transition-colors border-b-2 ${
              activeTab === 'stats'
                ? 'border-emerald-400 text-emerald-300 bg-[#182018]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Attributes & Stats
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`flex-1 py-2 text-xs font-bold uppercase transition-colors border-b-2 ${
              activeTab === 'vendor'
                ? 'border-amber-400 text-amber-300 bg-[#1f241a]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Wandering Merchant
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: EQUIPMENT & SKILLS */}
          {activeTab === 'equipment' && (
            <div className="space-y-3">
              <div className="text-gray-400 text-[11px] italic">
                Flasks are consumable pickup items, while Spells draw from Energy (EP) and combat skills draw from Stamina (SP). Click L or R on any card to equip.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(SKILLS).map((skill) => {
                  const isAssignedL = st?.assignedL === skill.id;
                  const isAssignedR = st?.assignedR === skill.id;

                  const costBadge =
                    skill.costType === 'flask'
                      ? '1 FLASK'
                      : skill.costType === 'ep'
                      ? `${skill.cost} EP`
                      : `${skill.cost} SP`;

                  const costColor =
                    skill.costType === 'flask'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : skill.costType === 'ep'
                      ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                      : 'bg-amber-950 text-amber-300 border-amber-500/40';

                  return (
                    <div
                      key={skill.id}
                      className="bg-[#131913] border border-[#00ff33]/20 rounded-lg p-3 flex flex-col justify-between hover:border-[#00ff33]/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-sm">
                            {skill.name}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-xs border font-semibold ${costColor}`}
                          >
                            {costBadge}
                          </span>
                        </div>
                        <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
                          {skill.description}
                        </p>
                      </div>

                      {/* Slot Assignment Controls */}
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleAssign('L', skill.id)}
                          className={`flex-1 py-1 px-2 rounded-xs text-[11px] font-bold border transition-colors ${
                            isAssignedL
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {isAssignedL ? '✓ EQUIPPED IN L' : 'ASSIGN TO L'}
                        </button>

                        <button
                          onClick={() => handleAssign('R', skill.id)}
                          className={`flex-1 py-1 px-2 rounded-xs text-[11px] font-bold border transition-colors ${
                            isAssignedR
                              ? 'bg-fuchsia-500 text-black border-fuchsia-400 shadow-sm'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {isAssignedR ? '✓ EQUIPPED IN R' : 'ASSIGN TO R'}
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-[#131913] p-4 rounded-lg border border-[#00ff33]/20">
                <div>
                  <div className="text-red-400 font-bold mb-1 flex items-center gap-1.5">
                    <span>❤️ HEALTH (HP):</span>
                    <span>{st?.hp} / {st?.maxHp}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: st?.maxHp || 4 }).map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block w-4 h-4 rounded-xs ${
                          i < (st?.hp || 0) ? 'bg-red-500' : 'bg-red-950/60 border border-red-800/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                    <span>⚡ STAMINA (SP):</span>
                    <span>{Math.floor(st?.sp || 0)} / {st?.maxSp}</span>
                  </div>
                  <div className="w-full bg-[#202010] h-4 rounded-xs overflow-hidden border border-yellow-800/40">
                    <div
                      className="bg-yellow-400 h-full transition-all duration-150"
                      style={{
                        width: `${Math.min(100, ((st?.sp || 0) / (st?.maxSp || 4)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-blue-400 font-bold mb-1 flex items-center gap-1.5">
                    <span>🔮 ENERGY (EP):</span>
                    <span>{st?.ep} / {st?.maxEp}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: st?.maxEp || 3 }).map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block w-3 h-3 rounded-full ${
                          i < (st?.ep || 0) ? 'bg-blue-400 shadow-[0_0_6px_#60a5fa]' : 'bg-blue-950 border border-blue-800/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                    <span>🛡️ ARMOR (AP):</span>
                    <span>{st?.ap} / {st?.maxAp}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: st?.maxAp || 2 }).map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block w-3 h-3 rounded-xs ${
                          i < (st?.ap || 0) ? 'bg-emerald-400' : 'bg-emerald-950 border border-emerald-800/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#131913] p-3 rounded-lg border border-white/10 space-y-2 text-[11px]">
                <div className="text-white font-bold">SOULS-LIKE COMBAT PROFILE</div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Dash (B)</span>
                  <span className="text-white">Invulnerable burst (1 SP)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Sprint (Hold B)</span>
                  <span className="text-white">High speed run (continuous SP)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Timed Parry (Y)</span>
                  <span className="text-emerald-400 font-semibold">1.0s Stagger stun & zero chip</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Heavy Charge Attack (X)</span>
                  <span className="text-amber-400 font-semibold">Guard-break & 3x damage</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WANDERING MERCHANT (VENDOR SHOP) */}
          {activeTab === 'vendor' && (
            <div className="space-y-4">
              <div className="bg-[#242618] border border-amber-500/30 p-3 rounded-lg flex items-start gap-3">
                <span className="text-2xl">🧙</span>
                <div>
                  <div className="font-bold text-amber-300 text-xs">
                    Old Hermit Merchant
                  </div>
                  <p className="text-[11px] text-amber-200/80 italic mt-0.5">
                    "Welcome, warrior. Trade your collected dungeon coins for eternal stat gems and flask shards to conquer the depths!"
                  </p>
                </div>
              </div>

              {shopFeedback && (
                <div className="p-2 rounded-sm bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-center font-bold animate-pulse">
                  {shopFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VENDOR_ITEMS.map((item) => {
                  const canAfford = Boolean(st && st.coins >= item.cost);

                  return (
                    <div
                      key={item.id}
                      className="bg-[#141914] border border-amber-500/20 rounded-lg p-3 flex flex-col justify-between hover:border-amber-500/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-sm">
                            {item.name}
                          </span>
                          <span className="text-amber-300 font-bold bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-xs text-[11px]">
                            🪙 {item.cost}
                          </span>
                        </div>
                        <p className="text-gray-400 text-[11px] leading-relaxed mb-3">
                          {item.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                        className={`w-full py-1.5 px-3 rounded-xs text-[11px] font-bold uppercase transition-colors ${
                          canAfford
                            ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-sm cursor-pointer'
                            : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? `BUY FOR ${item.cost} COINS` : `NEED ${item.cost} COINS`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
