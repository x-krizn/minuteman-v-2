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
}

export const SystemButtons: React.FC<SystemButtonsProps> = ({ scale, state }) => {
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

  return (
    <>
      {/* START BUTTON */}
      <button
        type="button"
        data-key="start"
        onPointerDown={(e) => handlePointerDown('start', e)}
        onPointerUp={(e) => handlePointerUp('start', e)}
        onPointerCancel={(e) => handlePointerCancel('start', e)}
        className="absolute border-none bg-transparent p-0 m-0 cursor-pointer touch-none select-none pixelated"
        style={{
          left: `${5 * s}px`,
          top: `${11 * s}px`,
          width: `${24 * s}px`,
          height: `${10 * s}px`,
          backgroundImage: `url("${PILL_IMG}")`,
          backgroundSize: '100% 100%',
          transform: state.start ? `translateY(${s}px)` : 'none',
          outline: 'none',
        }}
      />
      <span
        className="absolute pointer-events-none select-none font-bold"
        style={{
          left: `${5 * s}px`,
          top: `${23 * s}px`,
          fontSize: `${6 * s}px`,
          lineHeight: 1,
          color: '#5e5e4c',
          fontFamily: 'orion-font, monospace',
        }}
      >
        START
      </span>

      {/* SELECT (SHIFT) BUTTON */}
      <button
        type="button"
        data-key="select"
        onPointerDown={(e) => handlePointerDown('select', e)}
        onPointerUp={(e) => handlePointerUp('select', e)}
        onPointerCancel={(e) => handlePointerCancel('select', e)}
        className="absolute border-none bg-transparent p-0 m-0 cursor-pointer touch-none select-none pixelated"
        style={{
          left: `${42 * s}px`,
          top: `${11 * s}px`,
          width: `${24 * s}px`,
          height: `${10 * s}px`,
          backgroundImage: `url("${PILL_IMG}")`,
          backgroundSize: '100% 100%',
          transform: state.select ? `translateY(${s}px)` : 'none',
          outline: 'none',
        }}
      />
      <span
        className="absolute pointer-events-none select-none font-bold"
        style={{
          left: `${42 * s}px`,
          top: `${23 * s}px`,
          fontSize: `${6 * s}px`,
          lineHeight: 1,
          color: '#5e5e4c',
          fontFamily: 'orion-font, monospace',
        }}
      >
        SHIFT
      </span>

      {/* BRANDING */}
      <div
        className="absolute pointer-events-none select-none tracking-wider font-extrabold"
        style={{
          left: `${14 * s}px`,
          top: `${95 * s}px`,
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
