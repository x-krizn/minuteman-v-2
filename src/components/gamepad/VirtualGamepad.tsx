/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { gamepadStore } from '../../engine/input/gamepadStore';
import { GamepadButtons, StickVector } from '../../types/input';
import { PadBoard } from './PadBoard';

interface VirtualGamepadProps {
  customScale?: number;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({ customScale }) => {
  const [padState, setPadState] = useState<GamepadButtons>(() =>
    gamepadStore.getState()
  );
  const [, setStick] = useState<StickVector>(() => gamepadStore.getStick());
  const [autoScale, setAutoScale] = useState(2);

  // Subscribe to gamepad store state changes
  useEffect(() => {
    return gamepadStore.subscribe((newState, newStick) => {
      setPadState(newState);
      setStick(newStick);
    });
  }, []);

  // Compute scale based dynamically on BOTH viewport width AND height
  useEffect(() => {
    if (customScale) {
      setAutoScale(customScale);
      return;
    }

    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Board dimensions are 160 units wide x 100 units high
      // Available width: leave at least 12px margin
      const maxW = Math.max(260, vw - 12);
      const scaleByWidth = maxW / 160;

      // Available height: gamepad should comfortably occupy at most 38%-42% of viewport height in portrait
      const isPortrait = vh >= vw;
      const targetPadHeightFraction = isPortrait ? 0.39 : 0.52;
      const maxH = Math.max(160, vh * targetPadHeightFraction - 20);
      const scaleByHeight = maxH / 100;

      // Safe scale is the minimum of width and height constraints
      let calculatedScale = Math.min(scaleByWidth, scaleByHeight);

      // Keep within comfortable ergonomic limits
      calculatedScale = Math.max(1.5, Math.min(calculatedScale, 2.75));

      setAutoScale(calculatedScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, [customScale]);

  const scale = customScale ?? autoScale;

  return (
    <div
      id="virtual-gamepad"
      className="flex-none bg-[#d0d0a8] relative flex justify-center items-center py-1.5 px-2 select-none touch-none border-t border-[#b8b88e]/40 shadow-inner w-full"
      style={{
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <PadBoard scale={scale} state={padState} />
    </div>
  );
};
