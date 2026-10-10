/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScreenCanvas } from './ScreenCanvas';
import { ScreenText } from './ScreenText';

export interface ScreenViewportProps {
  isCartridgeRunning: boolean;
  isLoading: boolean;
  title?: string;
  lines?: string[];
  selectedIndex?: number;
  onLineClick?: (index: number) => void;
  showScanlines?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  connectedGamepads?: string[];
  gamepadToast?: string | null;
  children?: React.ReactNode;
}

export const ScreenViewport: React.FC<ScreenViewportProps> = ({
  isCartridgeRunning,
  isLoading,
  title = '',
  lines = [],
  selectedIndex = -1,
  onLineClick,
  showScanlines = true,
  isFullscreen = false,
  onToggleFullscreen,
  connectedGamepads = [],
  gamepadToast = null,
  children,
}) => {
  return (
    <div className="flex-1 min-w-0 min-h-0 p-2 sm:p-3 flex items-center justify-center relative overflow-hidden w-full">
      {/* Outer LCD Bezel Frame (Respects screen height without arbitrary cutoff) */}
      <div
        id="screen-viewport"
        className="w-full h-full max-w-[540px] bg-[#0f300f] border-4 border-[#0f35] rounded-xl flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_16px_rgba(0,0,0,0.85)]"
      >
        {/* Mobile Fullscreen Corner Toggle */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="absolute top-1.5 right-1.5 z-30 px-2 py-0.8 bg-[#122412]/85 hover:bg-[#1e3c1e] text-[#50fa7b] border border-[#2e5c2e]/60 rounded-xs font-mono text-[9.5px] tracking-wider transition-colors flex items-center gap-1 shadow-sm active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Mobile)'}
          >
            <span>{isFullscreen ? '✕' : '⛶'}</span>
            <span className="hidden xs:inline">{isFullscreen ? 'WINDOW' : 'FULLSCREEN'}</span>
          </button>
        )}

        {/* Hardware Gamepad Connected Badge */}
        {connectedGamepads.length > 0 && (
          <div
            className="absolute top-1.5 left-1.5 z-30 px-1.5 py-0.8 bg-[#122412]/85 text-[#50fa7b] border border-[#2e5c2e]/60 rounded-xs font-mono text-[9.5px] tracking-wider flex items-center gap-1 shadow-sm"
            title={`Physical Controller Connected: ${connectedGamepads.join(', ')}`}
          >
            <span>🎮</span>
            <span className="font-bold">{connectedGamepads.length}</span>
          </div>
        )}

        {/* Gamepad Toast Banner */}
        {gamepadToast && (
          <div className="absolute top-8 inset-x-2 z-40 flex justify-center pointer-events-none transition-all duration-300">
            <div className="bg-[#0b200b]/95 border-2 border-[#50fa7b] text-[#50fa7b] px-3 py-1 rounded-xs font-mono text-[10px] sm:text-[11px] font-bold tracking-wider shadow-xl flex items-center gap-1.5 animate-pulse text-center">
              <span>{gamepadToast}</span>
            </div>
          </div>
        )}

        {/* CRT Scanline Overlay */}
        {showScanlines && <div className="absolute inset-0 scanlines z-10 pointer-events-none" />}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="z-20 text-[#00ff33] text-sm tracking-widest animate-pulse font-mono">
            LOADING...
          </div>
        )}

        {/* Game Canvas */}
        <ScreenCanvas hidden={!isCartridgeRunning || isLoading} />

        {/* Active Cartridge In-Game Overlay (Menus / HUD / Inventory) */}
        {isCartridgeRunning && children}

        {/* Console Shell Text Layer (Shell menus, Splash, Debugger) */}
        {!isCartridgeRunning && !isLoading && (
          <div className="z-10 p-2 max-w-full max-h-full">
            <ScreenText
              title={title}
              lines={lines}
              selectedIndex={selectedIndex}
              onLineClick={onLineClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

