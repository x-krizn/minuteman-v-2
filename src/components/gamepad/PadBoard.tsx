/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GamepadButtons } from '../../types/input';
import { ActionButtons } from './ActionButtons';
import { DPad } from './DPad';
import { SystemButtons } from './SystemButtons';

interface PadBoardProps {
  scale: number;
  state: GamepadButtons;
}

export const PadBoard: React.FC<PadBoardProps> = ({ scale, state }) => {
  const s = scale;

  return (
    <div
      id="pad-board"
      className="relative select-none touch-none"
      style={{
        width: `${144 * s}px`,
        height: `${108 * s}px`,
      }}
    >
      <DPad scale={scale} state={state} />
      <ActionButtons scale={scale} state={state} />
      <SystemButtons scale={scale} state={state} />
    </div>
  );
};
