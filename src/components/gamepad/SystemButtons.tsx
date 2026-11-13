/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { gamepadStore } from '../../engine/input/gamepadStore';
import { ButtonKey, GamepadButtons } from '../../types/input';

const PILL_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAKCAYAAACuaZ5oAAAAfklEQVR42rWTMQ7AIAhFPx7LxQEP5MQhmDyQDC5cq12ahqbdtC9hMnmPQYCAajsALM3luKEoF+kYY2CFWitUG0Q63YEon3MuBUopjwjtlH9FCMDBzMg5YyfuDjNDws8k1QYzg7tv3161IYl02hmJcpFOr2/KzEuBKH89/nFoJ6NVeKi6LtDJAAAAAElFTkSuQmCC';

interface SystemButtonsProps {
  scale: number;
  state: GamepadButtons;
  activeKeyLabels?: Partial<Record<ButtonKey, string>>;
  boundKeyLabels?: Partial<Record<ButtonKey, string>>;
  compactWing?: boolean;
}

/**
 * Renders the `START` and `SELECT` system buttons on the virtual handheld deck,
 * reflecting remapped key assignments and synchronized pop-up key indicators when pressed.
 */
export const SystemButtons: React.FC<SystemButtonsProps> = ({
  scale,
  state,
  activeKeyLabels = {},
  boundKeyLabels = {},
  compactWing = false,
}) => {
  const s = scale;

  const handlePointerDown = (key: ButtonKey, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
    gamepadStore.setButtonState(key, true, true, 'touch');
  };

  const handlePointerUp = (key: ButtonKey, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    gamepadStore.setButtonState(key, false, false, 'touch');
  };

  const handlePointerCancel = (key: ButtonKey, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    gamepadStore.setButtonState(key, false, false, 'touch');
  };

  const startX = compactWing ? 6 : 5;
  const startY = compactWing ? 10 : 11;
  const selectX = compactWing ? 46 : 42;
  const selectY = compactWing ? 10 : 11;
  const brandX = compactWing ? 16 : 14;
  const brandY = compactWing ? 106 : 95;
  const startBound = boundKeyLabels.start || 'ENT';
  const selectBound = boundKeyLabels.select || 'TAB';

  return (
    <>
      {/* START BUTTON */}
      <button
        type="button"
        data-key="start"
        onPointerDown={(e) => handlePointerDown('start', e)}
        onPointerUp={(e) => handlePointerUp('start', e)}
        onPointerCancel={(e) => handlePointerCancel('start', e)}
        onLostPointerCapture={(e) => handlePointerCancel('start', e)}
        onContextMenu={(e) => e.preventDefault()}
        title={`START (Key: ${startBound})`}
        className="absolute border-none bg-transparent p-0 m-0 cursor-pointer touch-none select-none pixelated"
        style={{
          left: `${startX * s}px`,
          top: `${startY * s}px`,
          width: `${24 * s}px`,
          height: `${10 * s}px`,
          backgroundImage: `url("${PILL_IMG}")`,
          backgroundSize: '100% 100%',
          transform: state.start ? `translateY(${s}px)` : 'none',
          outline: 'none',
        }}
      >
        {state.start && (
          <span
            className="absolute left-1/2 bottom-full flex items-center justify-center pointer-events-none font-bold z-30 whitespace-nowrap"
            style={{
              transform: `translate(-50%, ${-2 * s}px)`,
              minWidth: `${26 * s}px`,
              height: `${16 * s}px`,
              paddingLeft: `${2 * s}px`,
              paddingRight: `${2 * s}px`,
              border: `${1.5 * s}px solid #000`,
              borderRadius: `${3 * s}px`,
              backgroundColor: '#9e9e86',
              boxShadow: `0 ${s}px 0 rgba(0,0,0,0.35)`,
              fontSize: `${7 * s}px`,
              color: '#000',
              fontFamily: 'orion-font, monospace',
              lineHeight: 1,
            }}
          >
            {activeKeyLabels.start || 'START'}
          </span>
        )}
      </button>
      <span
        className="absolute pointer-events-none select-none font-bold whitespace-nowrap"
        style={{
          left: `${startX * s}px`,
          top: `${(startY + 12) * s}px`,
          fontSize: `${4.8 * s}px`,
          lineHeight: 1,
          color: '#4e4e3d',
          fontFamily: 'orion-font, monospace',
        }}
      >
        STR·{startBound}
      </span>

      {/* SELECT BUTTON */}
      <button
        type="button"
        data-key="select"
        onPointerDown={(e) => handlePointerDown('select', e)}
        onPointerUp={(e) => handlePointerUp('select', e)}
        onPointerCancel={(e) => handlePointerCancel('select', e)}
        onLostPointerCapture={(e) => handlePointerCancel('select', e)}
        onContextMenu={(e) => e.preventDefault()}
        title={`SELECT (Key: ${selectBound})`}
        className="absolute border-none bg-transparent p-0 m-0 cursor-pointer touch-none select-none pixelated"
        style={{
          left: `${selectX * s}px`,
          top: `${selectY * s}px`,
          width: `${24 * s}px`,
          height: `${10 * s}px`,
          backgroundImage: `url("${PILL_IMG}")`,
          backgroundSize: '100% 100%',
          transform: state.select ? `translateY(${s}px)` : 'none',
          outline: 'none',
        }}
      >
        {state.select && (
          <span
            className="absolute left-1/2 bottom-full flex items-center justify-center pointer-events-none font-bold z-30 whitespace-nowrap"
            style={{
              transform: `translate(-50%, ${-2 * s}px)`,
              minWidth: `${26 * s}px`,
              height: `${16 * s}px`,
              paddingLeft: `${2 * s}px`,
              paddingRight: `${2 * s}px`,
              border: `${1.5 * s}px solid #000`,
              borderRadius: `${3 * s}px`,
              backgroundColor: '#9e9e86',
              boxShadow: `0 ${s}px 0 rgba(0,0,0,0.35)`,
              fontSize: `${7 * s}px`,
              color: '#000',
              fontFamily: 'orion-font, monospace',
              lineHeight: 1,
            }}
          >
            {activeKeyLabels.select || 'SELECT'}
          </span>
        )}
      </button>
      <span
        className="absolute pointer-events-none select-none font-bold whitespace-nowrap"
        style={{
          left: `${selectX * s}px`,
          top: `${(selectY + 12) * s}px`,
          fontSize: `${4.8 * s}px`,
          lineHeight: 1,
          color: '#4e4e3d',
          fontFamily: 'orion-font, monospace',
        }}
      >
        SEL·{selectBound}
      </span>

      {/* BRANDING */}
      <div
        className="absolute pointer-events-none select-none tracking-wider font-extrabold"
        style={{
          left: `${brandX * s}px`,
          top: `${brandY * s}px`,
          fontSize: `${5.5 * s}px`,
          lineHeight: 1,
          color: '#5e5e4c',
          fontFamily: 'orion-font, monospace',
        }}
      >
        MINUTEMAN
      </div>
    </>
  );
};

