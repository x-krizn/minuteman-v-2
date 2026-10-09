/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { InGameInventory } from './InGameInventory';
import { InGameMenu } from './InGameMenu';
import { ScreenCanvas } from './ScreenCanvas';
import { ScreenText } from './ScreenText';

interface ScreenViewportProps {
  isCartridgeRunning: boolean;
  isLoading: boolean;
  title?: string;
  lines?: string[];
  selectedIndex?: number;
  onLineClick?: (index: number) => void;
  showScanlines?: boolean;
  inGameMenu?: 'none' | 'game-menu' | 'inventory';
  soundEnabled?: boolean;
  scanlinesEnabled?: boolean;
  onToggleSound?: () => void;
  onToggleScanlines?: () => void;
  onResume?: () => void;
  onExitCartridge?: () => void;
  onCloseInventory?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const ScreenViewport: React.FC<ScreenViewportProps> = ({
  isCartridgeRunning,
  isLoading,
  title = '',
  lines = [],
  selectedIndex = -1,
  onLineClick,
  showScanlines = true,
  inGameMenu = 'none',
  soundEnabled = true,
  scanlinesEnabled = true,
  onToggleSound = () => {},
  onToggleScanlines = () => {},
  onResume = () => {},
  onExitCartridge = () => {},
  onCloseInventory = () => {},
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize canvas CSS dimensions to fit viewport crisply with proper aspect ratio
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = document.getElementById('screen-canvas') as HTMLCanvasElement | null;
      if (!container || !canvas) return;

      const cw = container.clientWidth - 8;
      const ch = container.clientHeight - 8;
      if (cw <= 0 || ch <= 0) return;

      const surfaceW = 160;
      const surfaceH = 144;

      const maxScale = Math.min(cw / surfaceW, ch / surfaceH);
      // Half-step scaling gives maximum display coverage while keeping pixels sharp
      const chosenScale =
        maxScale >= 2.5
          ? Math.floor(maxScale * 2) / 2
          : Math.max(1, maxScale);

      const finalW = Math.floor(surfaceW * chosenScale);
      const finalH = Math.floor(surfaceH * chosenScale);
      canvas.style.width = `${finalW}px`;
      canvas.style.height = `${finalH}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isCartridgeRunning]);

  return (
    <div className="flex-1 min-w-0 min-h-0 p-2 sm:p-3 flex items-center justify-center relative overflow-hidden w-full">
      {/* Outer LCD Bezel Frame (Respects screen height without arbitrary cutoff) */}
      <div
        ref={containerRef}
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

        {/* IN-GAME MENUS (Contained directly inside LCD Screen Viewport) */}
        {isCartridgeRunning && inGameMenu === 'game-menu' && (
          <InGameMenu
            soundEnabled={soundEnabled}
            scanlinesEnabled={scanlinesEnabled}
            onToggleSound={onToggleSound}
            onToggleScanlines={onToggleScanlines}
            onResume={onResume}
            onExitCartridge={onExitCartridge}
            isFullscreen={isFullscreen}
            onToggleFullscreen={onToggleFullscreen}
          />
        )}

        {isCartridgeRunning && inGameMenu === 'inventory' && (
          <InGameInventory onClose={onCloseInventory} />
        )}

        {/* Text Layer (Shell menus, Splash, Debugger) */}
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
