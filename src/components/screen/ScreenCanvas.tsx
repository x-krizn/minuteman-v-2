/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cartridgeRunner } from '../../engine/core/cartridgeRunner';
import { CartridgeSurface } from '../../types/cartridge';

interface ScreenCanvasProps {
  hidden: boolean;
  width?: number;
  height?: number;
}

export const ScreenCanvas: React.FC<ScreenCanvasProps> = ({
  hidden,
  width = 160,
  height = 144,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);

  // Initialize and register canvas drawing surface with CartridgeRunner
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const g = canvas.getContext('2d', { alpha: false });
    if (!g) return;

    // Ensure nearest-neighbor pixelated rendering without blurring across all engines
    g.imageSmoothingEnabled = false;
    const ctx = g as unknown as Record<string, boolean>;
    if ('webkitImageSmoothingEnabled' in ctx) ctx.webkitImageSmoothingEnabled = false;
    if ('mozImageSmoothingEnabled' in ctx) ctx.mozImageSmoothingEnabled = false;
    if ('msImageSmoothingEnabled' in ctx) ctx.msImageSmoothingEnabled = false;

    const surface: CartridgeSurface = {
      g,
      width,
      height,
      assets: {},
    };

    cartridgeRunner.setSurface(surface);
  }, [width, height]);

  // Dynamically compute and adjust display resolution to the device screen viewport
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const updateDisplayResolution = () => {
      const containerW = parent.clientWidth;
      const containerH = parent.clientHeight;
      if (containerW <= 0 || containerH <= 0) return;

      // Small 4px padding so the canvas sits cleanly recessed inside the LCD bezel frame
      const padding = 8;
      const maxAvailableW = Math.max(160, containerW - padding);
      const maxAvailableH = Math.max(144, containerH - padding);

      const targetAspect = width / height; // 160 / 144 = 1.11111...
      const containerAspect = maxAvailableW / maxAvailableH;

      let fitW: number;
      let fitH: number;

      if (containerAspect > targetAspect) {
        // Constrained by height (landscape, tablet, desktop)
        fitH = maxAvailableH;
        fitW = Math.round(maxAvailableH * targetAspect);
      } else {
        // Constrained by width (portrait mobile phone)
        fitW = maxAvailableW;
        fitH = Math.round(maxAvailableW / targetAspect);
      }

      setDisplaySize({ width: fitW, height: fitH });
    };

    updateDisplayResolution();

    const ro = new ResizeObserver(() => {
      updateDisplayResolution();
    });
    ro.observe(parent);

    window.addEventListener('resize', updateDisplayResolution);
    window.addEventListener('orientationchange', updateDisplayResolution);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDisplayResolution);
      window.removeEventListener('orientationchange', updateDisplayResolution);
    };
  }, [width, height, hidden]);

  return (
    <canvas
      ref={canvasRef}
      id="screen-canvas"
      hidden={hidden}
      className={`pixelated bg-[#0f300f] select-none ${
        hidden ? 'hidden' : 'block'
      }`}
      style={{
        width: displaySize ? `${displaySize.width}px` : '100%',
        height: displaySize ? `${displaySize.height}px` : 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: `${width} / ${height}`,
        imageRendering: 'pixelated',
      }}
    />
  );
};
