/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ButtonKey, GamepadButtons } from '../../types/input';
import { ActionButtons } from './ActionButtons';
import { DPad } from './DPad';
import { SystemButtons } from './SystemButtons';

/**
 * Which section of the virtual gamepad `PadBoard` should render.
 */
export type PadBoardWing = 'full' | 'left' | 'right';

interface PadBoardProps {
  scale: number;
  state: GamepadButtons;
  wing?: PadBoardWing;
  activeKeyLabels?: Partial<Record<ButtonKey, string>>;
  boundKeyLabels?: Partial<Record<ButtonKey, string>>;
}

/**
 * Renders the handheld controller faceplate housing `DPad`, `ActionButtons`, and `SystemButtons`
 * either as a single bottom unit (`wing="full"`) or split into symmetric left/right landscape wings.
 */
export const PadBoard: React.FC<PadBoardProps> = ({
  scale,
  state,
  wing = 'full',
  activeKeyLabels = {},
  boundKeyLabels = {},
}) => {
  const s = scale;
  const boardW = wing === 'full' ? 160 : 76;
  const boardH = wing === 'full' ? 100 : 114;

  return (
    <div
      id={wing === 'full' ? 'pad-board' : `pad-board-${wing}`}
      className="relative select-none touch-none mx-auto overflow-visible"
      style={{
        width: `${boardW * s}px`,
        height: `${boardH * s}px`,
      }}
    >
      {wing === 'full' && (
        <>
          <DPad
            scale={scale}
            state={state}
            activeKeyLabels={activeKeyLabels}
            boundKeyLabels={boundKeyLabels}
          />
          <ActionButtons
            scale={scale}
            state={state}
            activeKeyLabels={activeKeyLabels}
            boundKeyLabels={boundKeyLabels}
          />
          <SystemButtons
            scale={scale}
            state={state}
            activeKeyLabels={activeKeyLabels}
            boundKeyLabels={boundKeyLabels}
          />
        </>
      )}

      {wing === 'left' && (
        <>
          <SystemButtons
            scale={scale}
            state={state}
            activeKeyLabels={activeKeyLabels}
            boundKeyLabels={boundKeyLabels}
            compactWing
          />
          <DPad
            scale={scale}
            state={state}
            offsetX={4}
            offsetY={34}
            activeKeyLabels={activeKeyLabels}
            boundKeyLabels={boundKeyLabels}
          />
        </>
      )}

      {wing === 'right' && (
        <ActionButtons
          scale={scale}
          state={state}
          activeKeyLabels={activeKeyLabels}
          boundKeyLabels={boundKeyLabels}
          originOffsetX={88}
          originOffsetY={2}
        />
      )}
    </div>
  );
};

