/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const g = canvas.getContext('2d');
    if (!g) return;

    g.imageSmoothingEnabled = false;

    const surface: CartridgeSurface = {
      g,
      width,
      height,
      assets: {},
    };

    cartridgeRunner.setSurface(surface);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      id="screen-canvas"
      hidden={hidden}
      className={`pixelated bg-[#0f300f] max-w-full max-h-full object-contain ${
        hidden ? 'hidden' : 'block'
      }`}
      style={{
        imageRendering: 'pixelated',
      }}
    />
  );
};
