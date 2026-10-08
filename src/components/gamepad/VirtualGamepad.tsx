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

  // Compute scale based on viewport width (144 board units wide)
  useEffect(() => {
    if (customScale) {
      setAutoScale(customScale);
      return;
    }

    const updateScale = () => {
      const vw = window.innerWidth;
      // 144 board units wide
      let calculatedScale = 2;
      if (vw < 330) {
        calculatedScale = 1.8;
      } else if (vw < 380) {
        calculatedScale = 2.1;
      } else if (vw < 440) {
        calculatedScale = 2.4;
      } else if (vw < 520) {
        calculatedScale = 2.7;
      } else {
        calculatedScale = 2.5;
      }
      setAutoScale(calculatedScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [customScale]);

  const scale = customScale ?? autoScale;

  return (
    <div
      id="virtual-gamepad"
      className="flex-none bg-[#d0d0a8] relative flex justify-center items-center py-2 px-1 select-none touch-none border-t border-[#b8b88e]/40 shadow-inner"
      style={{
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
      }}
    >
      <PadBoard scale={scale} state={padState} />
    </div>
  );
};
