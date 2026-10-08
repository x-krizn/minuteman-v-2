/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../engine/core/soundSystem';

interface ConsoleBezelProps {
  soundEnabled: boolean;
  scanlinesEnabled: boolean;
  onToggleSound: () => void;
  onToggleScanlines: () => void;
  onOpenDebug: () => void;
  onOpenHelp: () => void;
  onOpenInventory: () => void;
  activeCartName?: string;
  onQuitToMenu?: () => void;
}

export const ConsoleBezel: React.FC<ConsoleBezelProps> = ({
  soundEnabled,
  scanlinesEnabled,
  onToggleSound,
  onToggleScanlines,
  onOpenDebug,
  onOpenHelp,
  onOpenInventory,
  activeCartName,
  onQuitToMenu,
}) => {
  return (
    <header className="flex-none px-4 py-2 bg-[#b8b88e] border-b border-[#a0a078] flex items-center justify-between text-[#404030] text-xs select-none">
      {/* Left: Power indicator & Console identity */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"
          title="Console Power ON"
        />
        <span className="font-extrabold tracking-wider text-[11px] font-mono">
          MINUTEMAN
        </span>
        {activeCartName ? (
          <span className="text-[10px] bg-[#404030]/10 px-1.5 py-0.5 rounded-xs font-mono font-semibold">
            {activeCartName}
          </span>
        ) : (
          <span className="text-[10px] text-[#606048] italic font-mono hidden sm:inline">
            SYSTEM SHELL
          </span>
        )}
      </div>

      {/* Right: Quick console buttons */}
      <div className="flex items-center gap-1.5 font-mono text-[11px]">
        {/* INVENTORY / SATCHEL BUTTON */}
        <button
          onClick={onOpenInventory}
          className="px-2 py-0.5 bg-[#404030]/20 hover:bg-[#404030]/35 text-[#202010] rounded-xs font-bold border border-[#404030]/30 transition-colors flex items-center gap-1"
          title="Open Inventory, Equipment & Merchant"
        >
          <span>🎒</span>
          <span>BAG</span>
        </button>

        {activeCartName && onQuitToMenu && (
          <button
            onClick={onQuitToMenu}
            className="px-2 py-0.5 bg-[#8a8a70]/30 hover:bg-[#8a8a70]/50 text-[#303020] rounded-xs font-bold transition-colors"
            title="Leave Cartridge"
          >
            EXIT CART
          </button>
        )}

        <button
          onClick={onToggleSound}
          className={`px-2 py-0.5 rounded-xs font-semibold transition-colors ${
            soundEnabled
              ? 'bg-[#527252] text-[#d0d0a8]'
              : 'bg-[#8a8a70]/40 text-[#50503c]'
          }`}
          title="Toggle 8-bit Audio Synthesizer"
        >
          {soundEnabled ? 'SFX ON' : 'SFX MUTED'}
        </button>

        <button
          onClick={onToggleScanlines}
          className={`px-2 py-0.5 rounded-xs font-semibold transition-colors hidden sm:block ${
            scanlinesEnabled
              ? 'bg-[#527252] text-[#d0d0a8]'
              : 'bg-[#8a8a70]/40 text-[#50503c]'
          }`}
          title="Toggle CRT Scanline Effect"
        >
          CRT
        </button>

        <button
          onClick={onOpenHelp}
          className="px-2 py-0.5 bg-[#8a8a70]/30 hover:bg-[#8a8a70]/50 text-[#303020] rounded-xs font-semibold transition-colors"
          title="Keyboard and Controls Guide"
        >
          KEYS
        </button>

        <button
          onClick={onOpenDebug}
          className="px-2 py-0.5 bg-[#8a8a70]/30 hover:bg-[#8a8a70]/50 text-[#303020] rounded-xs font-semibold transition-colors"
          title="System Debugger"
        >
          DEBUG
        </button>
      </div>
    </header>
  );
};
