/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { gamepadStore } from '../../engine/input/gamepadStore';
import {
  formatCompactKeyLabel,
  getControlBindings,
  subscribeControlBindings,
} from '../../engine/input/inputBindingsStore';
import { ButtonKey, GamepadButtons } from '../../types/input';
import { PadBoard, PadBoardWing } from './PadBoard';

interface VirtualGamepadProps {
  wing?: PadBoardWing;
  customScale?: number;
}

const ALL_KEYS: ButtonKey[] = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'x',
  'y',
  'l',
  'r',
  'start',
  'select',
];

function computeBoundKeyLabels(): Partial<Record<ButtonKey, string>> {
  const bindings = getControlBindings();
  const labels: Partial<Record<ButtonKey, string>> = {};
  for (const key of ALL_KEYS) {
    const code = bindings.keyboard[key]?.[0] || bindings.keyboard[key]?.[1];
    labels[key] = code ? formatCompactKeyLabel(code) : '—';
  }
  return labels;
}

/**
 * Renders the interactive on-screen handheld controller (`full` bottom deck or landscape `left`/`right` split wings)
 * and dispatches touch/pointer events to `gamepadStore` while reflecting live physical key labels in pop-up bubbles.
 */
export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  wing = 'full',
  customScale,
}) => {
  const [padState, setPadState] = useState<GamepadButtons>(() =>
    gamepadStore.getState()
  );
  const [activeKeyLabels, setActiveKeyLabels] = useState<Partial<Record<ButtonKey, string>>>(() =>
    gamepadStore.getActiveKeyLabels()
  );
  const [boundKeyLabels, setBoundKeyLabels] = useState<Partial<Record<ButtonKey, string>>>(() =>
    computeBoundKeyLabels()
  );
  const [autoScale, setAutoScale] = useState(2);

  // Subscribe to gamepad store state & active physical key label changes
  useEffect(() => {
    return gamepadStore.subscribe((newState, _stick, newKeyLabels) => {
      setPadState(newState);
      setActiveKeyLabels(newKeyLabels);
    });
  }, []);

  // Sync bound key hints when keyboard remaps change
  useEffect(() => {
    setBoundKeyLabels(computeBoundKeyLabels());
    return subscribeControlBindings(() => {
      setBoundKeyLabels(computeBoundKeyLabels());
    });
  }, []);

  // Compute responsive scale based on wing geometry and viewport dimensions
  useEffect(() => {
    if (customScale) {
      setAutoScale(customScale);
      return;
    }

    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (wing === 'full') {
        // Board dimensions: 160 x 100
        const maxW = Math.max(240, vw - 12);
        const scaleByWidth = maxW / 160;

        const isPortrait = vh >= vw;
        const targetPadHeightFraction = isPortrait ? 0.39 : 0.5;
        const maxH = Math.max(150, vh * targetPadHeightFraction - 20);
        const scaleByHeight = maxH / 100;

        const calculatedScale = Math.max(
          1.45,
          Math.min(Math.min(scaleByWidth, scaleByHeight), 2.75)
        );
        setAutoScale(calculatedScale);
      } else {
        // Split landscape wing dimensions: 76 x 114 (+ ~18 units headroom for pop-up key bubbles)
        const maxWingW = Math.max(104, Math.min(230, vw * 0.22 - 14));
        const scaleByWidth = maxWingW / 76;

        const maxWingH = Math.max(156, vh - 36);
        const scaleByHeight = maxWingH / 130;

        const calculatedScale = Math.max(
          1.2,
          Math.min(Math.min(scaleByWidth, scaleByHeight), 2.45)
        );
        setAutoScale(calculatedScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, [customScale, wing]);

  const scale = customScale ?? autoScale;

  if (wing === 'left' || wing === 'right') {
    const borderClass =
      wing === 'left'
        ? 'border-r border-[#b8b88e]/50'
        : 'border-l border-[#b8b88e]/50';
    return (
      <div
        id={`virtual-gamepad-${wing}`}
        className={`flex-none h-full bg-[#d0d0a8] relative flex justify-center items-center px-2.5 sm:px-3.5 py-3 select-none touch-none shadow-inner overflow-visible ${borderClass}`}
        style={{
          paddingLeft:
            wing === 'left' ? 'max(10px, env(safe-area-inset-left, 10px))' : undefined,
          paddingRight:
            wing === 'right' ? 'max(10px, env(safe-area-inset-right, 10px))' : undefined,
        }}
      >
        <PadBoard
          scale={scale}
          state={padState}
          wing={wing}
          activeKeyLabels={activeKeyLabels}
          boundKeyLabels={boundKeyLabels}
        />
      </div>
    );
  }

  return (
    <div
      id="virtual-gamepad"
      className="flex-none bg-[#d0d0a8] relative flex justify-center items-center py-1.5 px-2 select-none touch-none border-t border-[#b8b88e]/40 shadow-inner w-full overflow-visible"
      style={{
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <PadBoard
        scale={scale}
        state={padState}
        wing="full"
        activeKeyLabels={activeKeyLabels}
        boundKeyLabels={boundKeyLabels}
      />
    </div>
  );
};
