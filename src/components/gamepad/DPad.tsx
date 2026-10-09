/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  gamepadStore,
  STICK_RADIUS_FRAC,
} from '../../engine/input/gamepadStore';
import { GamepadButtons } from '../../types/input';

const DPAD_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACi0lEQVR42u2bPW7DMAyFade5lJcM8oE8BdDWTgE0Zc4FeohIgxaj18hF0i5J4bqRbYrUjxER8OIgkt4XWRRfZIASJV46qtAdKNV/U75/OJyqzdK9iyddVIDJZoBS/ffhcAKtNamdrutAqT7YTKhCi7fWktra7/dBIbyFEi+EgNvtRm7ver3CbreD8/kTlOrfL5evD87x1q+eBQqAlJ0PwwDDMLwmgLHwlBDq1OJTQ6hzEJ8SQp2L+FQQShaI2VnbtiCldH4upYS2baMCaGITt9Y6IVC3zZsAkEpoWQN8ZkDoWpzgMaBiropslqq6nMJ3PHct1WoAHGZG13W/Kz9172CMIY/FBaEJZWZorckQxuI5xvIMQuUyMzjy8cPN8WmPS/y0vamzFDQLWGtBaw3GGNQWl1t80jSIhRBTPAkAxsxYC8FHPNVUqX3FY6u3JQi+4qlVZEMRP763ZpF7QHhkh3FQxGPH4Q2Ao1a31oIQAowxf+4LIdhWewyEOqb4nIyXUgxhASyZGbkE1lRpsM+vlBKOxyP73p6jdpBSotcR9CMwdXQwxKepbnxhd4zTGekj3tsRGkPApK25VDdNkWvTKnYcLACwHa7d5PhCyLoWwO7wfAuoLAH4FjYxIdRT70ypnqVjalXHCcHlBfwzRJ4ZI77BVdKOTRXKWFxHbJxuKdUU5XKVxr+gb8ydL3Jmgfvj4GWLh3KTlerBczx4W3zpi3MzJ+SixX1SrPwzlFO5Gvuf4SQzoJwQycx4iQpgjZ8Q23OICmDucASlpN3UGuCCkEJ8sjT4zFRJdWokSRrkMjM2DSC18LITLAACAeA0VZbMDI4I/tIUxchYMjOyj5d+bY7LH9j0i5MlSuQfP0U5eUJLlsbCAAAAAElFTkSuQmCC';

interface DPadProps {
  scale: number;
  state: GamepadButtons;
}

export const DPad: React.FC<DPadProps> = ({ scale, state }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
    track(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerId.current) return;
    e.preventDefault();
    track(e.clientX, e.clientY);
  };

  const handleRelease = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerId.current) return;
    e.preventDefault();
    activePointerId.current = null;
    gamepadStore.setStick(0, 0);
  };

  const track = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const centerX = r.left + r.width / 2;
    const centerY = r.top + r.height / 2;
    const radius = r.width * STICK_RADIUS_FRAC;

    const v = gamepadStore.vectorFromOffset(
      clientX - centerX,
      clientY - centerY,
      radius
    );
    gamepadStore.setStick(v.x, v.y);
  };

  const s = scale;

  return (
    <div
      ref={containerRef}
      id="dpad-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      onLostPointerCapture={handleRelease}
      className="absolute touch-none select-none"
      style={{
        left: `${2 * s}px`,
        top: `${28 * s}px`,
        width: `${68 * s}px`,
        height: `${68 * s}px`,
      }}
    >
      {/* Base DPad art */}
      <div
        className="absolute pointer-events-none pixelated"
        style={{
          left: `${2 * s}px`,
          top: `${2 * s}px`,
          width: `${64 * s}px`,
          height: `${64 * s}px`,
          backgroundImage: `url("${DPAD_IMG}")`,
          backgroundSize: '100% 100%',
        }}
      />

      {/* Up arm lit */}
      <div
        className={`absolute pointer-events-none pixelated transition-all ${
          state.up ? 'block' : 'hidden'
        }`}
        style={{
          left: `${2 * s}px`,
          top: `${2 * s}px`,
          width: `${64 * s}px`,
          height: `${64 * s}px`,
          backgroundImage: `url("${DPAD_IMG}")`,
          backgroundSize: '100% 100%',
          filter: 'brightness(0.65)',
          clipPath: `inset(${3 * s}px ${20 * s}px ${44 * s}px ${20 * s}px)`,
        }}
      />

      {/* Down arm lit */}
      <div
        className={`absolute pointer-events-none pixelated transition-all ${
          state.down ? 'block' : 'hidden'
        }`}
        style={{
          left: `${2 * s}px`,
          top: `${2 * s}px`,
          width: `${64 * s}px`,
          height: `${64 * s}px`,
          backgroundImage: `url("${DPAD_IMG}")`,
          backgroundSize: '100% 100%',
          filter: 'brightness(0.65)',
          clipPath: `inset(${44 * s}px ${20 * s}px ${3 * s}px ${20 * s}px)`,
        }}
      />

      {/* Left arm lit */}
      <div
        className={`absolute pointer-events-none pixelated transition-all ${
          state.left ? 'block' : 'hidden'
        }`}
        style={{
          left: `${2 * s}px`,
          top: `${2 * s}px`,
          width: `${64 * s}px`,
          height: `${64 * s}px`,
          backgroundImage: `url("${DPAD_IMG}")`,
          backgroundSize: '100% 100%',
          filter: 'brightness(0.65)',
          clipPath: `inset(${20 * s}px ${44 * s}px ${20 * s}px ${3 * s}px)`,
        }}
      />

      {/* Right arm lit */}
      <div
        className={`absolute pointer-events-none pixelated transition-all ${
          state.right ? 'block' : 'hidden'
        }`}
        style={{
          left: `${2 * s}px`,
          top: `${2 * s}px`,
          width: `${64 * s}px`,
          height: `${64 * s}px`,
          backgroundImage: `url("${DPAD_IMG}")`,
          backgroundSize: '100% 100%',
          filter: 'brightness(0.65)',
          clipPath: `inset(${20 * s}px ${3 * s}px ${20 * s}px ${44 * s}px)`,
        }}
      />
    </div>
  );
};
