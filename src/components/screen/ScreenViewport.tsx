/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
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
}

export const ScreenViewport: React.FC<ScreenViewportProps> = ({
  isCartridgeRunning,
  isLoading,
  title = '',
  lines = [],
  selectedIndex = -1,
  onLineClick,
  showScanlines = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize canvas CSS dimensions to maintain crisp integer or aspect ratio within viewport
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = document.getElementById('screen-canvas') as HTMLCanvasElement | null;
      if (!container || !canvas) return;

      const cw = container.clientWidth - 16;
      const ch = container.clientHeight - 16;
      if (cw <= 0 || ch <= 0) return;

      const surfaceW = 160;
      const surfaceH = 144;

      let scale = Math.min(cw / surfaceW, ch / surfaceH);
      if (scale >= 1) {
        scale = Math.floor(scale);
      }
      canvas.style.width = `${Math.floor(surfaceW * scale)}px`;
      canvas.style.height = `${Math.floor(surfaceH * scale)}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCartridgeRunning]);

  return (
    <div className="flex-1 min-w-0 min-h-0 m-3 sm:m-4 flex items-center justify-center relative">
      {/* Outer LCD Bezel Frame */}
      <div
        ref={containerRef}
        id="screen-viewport"
        className="w-full h-full max-w-[500px] max-h-[360px] bg-[#0f300f] border-4 border-[#0f35] rounded-lg flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]"
      >
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
