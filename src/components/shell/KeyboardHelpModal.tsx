/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface KeyboardHelpModalProps {
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e221e] border border-[#00ff33]/40 rounded-lg p-5 max-w-md w-full text-[#d0d0a8] font-mono text-xs shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#00ff33]/30 pb-2 text-[#00ff33]">
          <div className="font-bold text-sm tracking-wider">KEYBOARD CONTROLS</div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 border border-[#00ff33]/50 hover:bg-[#00ff33] hover:text-[#0f300f] transition-colors rounded-xs"
          >
            CLOSE
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Move / Directionals</span>
            <span className="text-white font-bold">WASD / Arrow Keys</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Button A: Jump (Air Jump)</span>
            <span className="text-emerald-400 font-bold">Z / Space</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Button B: Dash (Hold Sprint)</span>
            <span className="text-cyan-400 font-bold">X / Shift</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Button X: Attack (Hold Charge)</span>
            <span className="text-red-400 font-bold">C / J</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Button Y: Block (Tap Parry)</span>
            <span className="text-yellow-400 font-bold">V / K</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">L / R: Assignable Skills</span>
            <span className="text-purple-300 font-bold">Q / E (or U / I)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Cycle Skills</span>
            <span className="text-gray-300 font-bold">Hold Select + L / R</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">System (Start / Select)</span>
            <span className="text-amber-300 font-bold">Enter / Tab</span>
          </div>
        </div>

        <div className="text-[11px] text-gray-400 italic bg-black/40 p-2 rounded-sm border border-white/10">
          Tip: On touch screens or phones, the on-screen virtual stick and tactile buttons respond with haptic feedback!
        </div>
      </div>
    </div>
  );
};
