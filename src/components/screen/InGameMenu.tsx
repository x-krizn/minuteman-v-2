/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  hasSavedKnightGame,
  loadSavedKnightGame,
  saveKnightGame,
} from '../../cartridges/knight/stateStore';
import { soundSystem } from '../../engine/core/soundSystem';

interface InGameMenuProps {
  soundEnabled: boolean;
  scanlinesEnabled: boolean;
  onToggleSound: () => void;
  onToggleScanlines: () => void;
  onResume: () => void;
  onExitCartridge: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const InGameMenu: React.FC<InGameMenuProps> = ({
  soundEnabled,
  scanlinesEnabled,
  onToggleSound,
  onToggleScanlines,
  onResume,
  onExitCartridge,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);

  const handleSave = () => {
    const res = saveKnightGame();
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 2200);
  };

  const handleLoad = () => {
    if (loadSavedKnightGame()) {
      setFeedback('SAVE LOADED!');
      setTimeout(() => {
        setFeedback(null);
        onResume();
      }, 900);
    } else {
      setFeedback('NO SAVE FILE FOUND');
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleSaveAndExit = () => {
    saveKnightGame();
    onExitCartridge();
  };

  return (
    <div className="absolute inset-0 z-20 bg-[#0a180a]/92 backdrop-blur-xs flex flex-col p-2.5 sm:p-3 overflow-hidden text-[#9ad482] font-mono select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#306028]">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#50fa7b] tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#50fa7b] animate-pulse inline-block" />
          <span>GAME MENU</span>
          <span className="text-[10px] text-[#70a860] bg-[#1a3818] px-1 py-0.2 rounded-xs">
            START
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-300 font-semibold">PAUSED</span>
          <button
            onClick={() => {
              soundSystem.playSelect();
              onResume();
            }}
            className="text-[10px] px-1.5 py-0.5 bg-[#1c381c] hover:bg-[#306028] text-[#9ad482] rounded-xs font-bold border border-[#306028]"
            title="Resume Game (B / START)"
          >
            ✕ RESUME
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-2 py-1 px-2 bg-[#123812] border border-[#50fa7b] text-center text-[11px] text-[#50fa7b] font-bold animate-pulse rounded-xs shadow-sm">
          {feedback}
        </div>
      )}

      {/* Main Content Area */}
      {showControls ? (
        /* Subview: Controls & Combat Mechanics */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px] leading-snug">
          <div className="flex items-center justify-between pb-1 border-b border-[#244820]">
            <span className="font-bold text-[#50fa7b]">COMBAT & CONTROLS GUIDE</span>
            <button
              onClick={() => {
                soundSystem.playSelect();
                setShowControls(false);
              }}
              className="text-[10px] px-1.5 py-0.5 bg-[#1c381c] text-[#9ad482] rounded-xs hover:bg-[#306028]"
            >
              ◀ BACK
            </button>
          </div>

          <div className="space-y-1.5 text-[10.5px]">
            <div className="bg-[#122412] p-1.5 rounded-xs border border-[#244820]">
              <span className="font-bold text-[#f1fa8c]">A BUTTON / SPACE:</span> Jump (tap for hop, hold for high, double jump once unlocked).
            </div>
            <div className="bg-[#122412] p-1.5 rounded-xs border border-[#244820]">
              <span className="font-bold text-[#f1fa8c]">B BUTTON / X KEY:</span> Dash (tap with invulnerability frames) or Sprint (hold to run faster; costs SP).
            </div>
            <div className="bg-[#122412] p-1.5 rounded-xs border border-[#244820]">
              <span className="font-bold text-[#f1fa8c]">X BUTTON / C KEY:</span> Attack (directional attacks, aerial slash, down pogo bounce on enemies; hold to charge heavy strike).
            </div>
            <div className="bg-[#122412] p-1.5 rounded-xs border border-[#244820]">
              <span className="font-bold text-[#f1fa8c]">Y BUTTON / V KEY:</span> Block & Parry (hold to guard; time right before impact for parry spark & counter!).
            </div>
            <div className="bg-[#122412] p-1.5 rounded-xs border border-[#244820]">
              <span className="font-bold text-[#f1fa8c]">L & R / Q & E:</span> Assignable Skills (Flask healing, Fireball projectile, Whirlwind blade, Ground slam).
            </div>
            <div className="bg-[#122412] p-1.5 rounded-xs border border-[#244820]">
              <span className="font-bold text-[#f1fa8c]">START / ENTER:</span> Game Menu (settings, options, save, exit).
            </div>
            <div className="bg-[#122412] p-1.5 rounded-xs border border-[#244820]">
              <span className="font-bold text-[#f1fa8c]">SHIFT / TAB / M:</span> Satchel & Character Screen (Equipment L/R, Stats, Merchant).
            </div>
          </div>
        </div>
      ) : (
        /* Options List */
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
          {/* Resume */}
          <button
            onClick={() => {
              soundSystem.playSelect();
              onResume();
            }}
            className="w-full text-left px-2.5 py-1.5 bg-[#1b3d1b] hover:bg-[#50fa7b] hover:text-[#0b1c0b] text-[#50fa7b] font-bold rounded-xs transition-colors flex justify-between items-center border border-[#306028]"
          >
            <span>▶ RESUME GAME</span>
            <span className="text-[10px] opacity-75 font-normal">START / B</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={() => {
              soundSystem.playSelect();
              onToggleSound();
            }}
            className="w-full text-left px-2.5 py-1.5 bg-[#142614] hover:bg-[#1e381e] text-[#9ad482] rounded-xs transition-colors flex justify-between items-center border border-[#224420]"
          >
            <span>🔊 SOUND FX</span>
            <span
              className={`px-1.5 py-0.2 rounded-xs font-bold text-[10px] ${
                soundEnabled
                  ? 'bg-[#1b481b] text-[#50fa7b] border border-[#306028]'
                  : 'bg-[#401818] text-[#ff79c6] border border-[#602020]'
              }`}
            >
              {soundEnabled ? 'ON' : 'MUTED'}
            </span>
          </button>

          {/* Scanlines Toggle */}
          <button
            onClick={() => {
              soundSystem.playSelect();
              onToggleScanlines();
            }}
            className="w-full text-left px-2.5 py-1.5 bg-[#142614] hover:bg-[#1e381e] text-[#9ad482] rounded-xs transition-colors flex justify-between items-center border border-[#224420]"
          >
            <span>📺 CRT SCANLINES</span>
            <span
              className={`px-1.5 py-0.2 rounded-xs font-bold text-[10px] ${
                scanlinesEnabled
                  ? 'bg-[#1b481b] text-[#50fa7b] border border-[#306028]'
                  : 'bg-[#223022] text-[#608060] border border-[#304030]'
              }`}
            >
              {scanlinesEnabled ? 'ENABLED' : 'OFF'}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              onClick={() => {
                soundSystem.playSelect();
                onToggleFullscreen();
              }}
              className="w-full text-left px-2.5 py-1.5 bg-[#142614] hover:bg-[#1e381e] text-[#9ad482] rounded-xs transition-colors flex justify-between items-center border border-[#224420]"
            >
              <span>⛶ FULLSCREEN MODE</span>
              <span
                className={`px-1.5 py-0.2 rounded-xs font-bold text-[10px] ${
                  isFullscreen
                    ? 'bg-[#1b481b] text-[#50fa7b] border border-[#306028]'
                    : 'bg-[#223022] text-[#80a080] border border-[#304030]'
                }`}
              >
                {isFullscreen ? 'ACTIVE' : 'WINDOWED'}
              </span>
            </button>
          )}

          {/* Controls Guide */}
          <button
            onClick={() => {
              soundSystem.playSelect();
              setShowControls(true);
            }}
            className="w-full text-left px-2.5 py-1.5 bg-[#142614] hover:bg-[#1e381e] text-[#9ad482] rounded-xs transition-colors flex justify-between items-center border border-[#224420]"
          >
            <span>❓ HOW TO PLAY & CONTROLS</span>
            <span className="text-[10px] opacity-75">VIEW</span>
          </button>

          {/* Save Progress */}
          <button
            onClick={handleSave}
            className="w-full text-left px-2.5 py-1.5 bg-[#142614] hover:bg-[#1e381e] text-[#9ad482] rounded-xs transition-colors flex justify-between items-center border border-[#224420]"
          >
            <span>💾 SAVE PROGRESS</span>
            <span className="text-[10px] opacity-75 text-amber-300 font-semibold">
              LOCAL FLASH
            </span>
          </button>

          {/* Load Save */}
          {hasSavedKnightGame() && (
            <button
              onClick={handleLoad}
              className="w-full text-left px-2.5 py-1.5 bg-[#142614] hover:bg-[#1e381e] text-[#9ad482] rounded-xs transition-colors flex justify-between items-center border border-[#224420]"
            >
              <span>📂 LOAD SAVED GAME</span>
              <span className="text-[10px] opacity-75">RESTORE</span>
            </button>
          )}

          {/* Save & Exit */}
          <button
            onClick={handleSaveAndExit}
            className="w-full text-left px-2.5 py-1.5 bg-[#142614] hover:bg-[#1e381e] text-[#9ad482] rounded-xs transition-colors flex justify-between items-center border border-[#224420]"
          >
            <span>💾 SAVE & EXIT TO CARTS</span>
            <span className="text-[10px] opacity-75">SHELL</span>
          </button>

          {/* Exit without Saving */}
          <button
            onClick={onExitCartridge}
            className="w-full text-left px-2.5 py-1.5 bg-[#201414] hover:bg-[#361a1a] text-[#ff79c6] rounded-xs transition-colors flex justify-between items-center border border-[#502424]"
          >
            <span>🚪 EXIT WITHOUT SAVING</span>
            <span className="text-[10px] opacity-75">QUIT</span>
          </button>
        </div>
      )}

      {/* Footer hint */}
      <div className="pt-1.5 mt-1 border-t border-[#244820] flex items-center justify-between text-[9px] text-[#609050]">
        <span>USE GAMEPAD OR TOUCH CONTROLS</span>
        <span>PRESS B OR START TO RESUME</span>
      </div>
    </div>
  );
};
