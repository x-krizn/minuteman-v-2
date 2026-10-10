/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { gamepadStore } from '../../engine/input/gamepadStore';
import { ButtonKey, GamepadButtons } from '../../types/input';

const FACE_G =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAv0lEQVR42tXVMQ6DMAwF0G+OlYUBDsTkK0TKlAPFA0uu1U6JCrJDS8hQjyDeN0Y4hIsKYXtp15kjtZ6jK5A5WvebAWShBUwpqfC6rjVAw8lCC7jvuwrP81wDNJws1AK1AA2fetDyRiklMMfDh5560BY+YVBRb7fWvId1PB723ndjn8YfjoI5UggbRAQ559tQzhkiUv/AsaPo7frc7WHGd3ENba7NZVkAAM45EwSgol8t+hJwLhH5bdEPPZqeOEzfw3Cu5MNQeBgAAAAASUVORK5CYII=';
const FACE_A =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAA3ElEQVR42tXVMQ6DIBQG4B/Ts5iYsHbo4DG8h9NbmF2YSK/h5BkcOriSmHAZO9Fo+4BWwlASFtGP30f0CSSG1v3GXScyIvacSIFEJrQe3eASQj2oRsXC1A37e0UysUc9uD5WFm5uDQBg6AZo3X8kFyE0BHIbcHiVg/o3UqMCkTkcdJWDxvAKhYbITRuqd7HE5eHpPmVje+MPS0FkhNY97GzhFncacouDne3rCyxbitzU72kPNT6Lc2j0tylbCQCor3UQBMCiqXa0AdhkK9np10Otq1hrEl+m/7mZPgH9eLnQWClkAwAAAABJRU5ErkJggg==';
const FACE_B =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAuUlEQVR42r2VOw7EIAxEx1xtz+LUVD4EFX1OkDskZ2MbkFgtjmEJa2kaEM/DRwPBqBB8ao2LRLpbRxZQJGrzXQ1a0AQgJUVlXtuRCi2AU1HdwITX0LNTGtzVUJGIBOBCf135TETix0W7Gegd3GFR0azbul75/Ybg1zleD94egG1/dfw4WCRSCB47gGMCdADY84sQibTM8VdO8EBOFLEVRr/AeTTh2GjAI9BW0LMiK+iXfU3U6X74M30Dgfrqe6Xu+roAAAAASUVORK5CYII=';
const FACE_X =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAyElEQVR42tXVsRGDMAwF0C8GoqAg02QBkoJKQ7hyg2vumCYuKLwQqcwFTjIEx0VUwvG+EIdMOChj+kW6zmwp9RwdgcxWu58MIA2NoHNiw+g6WgMknDQ0gvP8EuGmua0BEk4aqoFSgIRXOWh8I+cWMNvNh65y0BReoVBRbrfavIt1XB4ex2c29mn84SiYLRnTw/sBIUyXoRAmeD+sf2DZUeR2ve92M+OruIQm12bbPgAAdX1XQQAiemrRx4B9eT98t+iLHk2/OEzfd8Su4Aj5JZUAAAAASUVORK5CYII=';
const FACE_Y =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAA3ElEQVR42tWVMQ6DMAxFv1HP06FDOQ0XKAxMPkSmLGGulNPA0IELuVMQIBsqogy1lCVWnu0fJZ9wEs71ou0zezo6R2dAZm/lfyqgQQWAiAzqSnlropsGZfYQGQAA4/hRi6c80SudIVOKNdQC7qOuHwm+kaXKgaaJRAYw+81FVznQI3iFQkG53Vp6F+u4PLjr3tmwNeMPpWD25FyPECbEOF8GxTgjhGl5gWWlyO163+1G46twDap+9Okltu0TANA0dxMIQIWaDpLgAJYC+whhWpxEc5Fi1nTqV1fN9AueUMUZAHQcywAAAABJRU5ErkJggg==';

interface ButtonConfig {
  key: ButtonKey;
  label: string;
  x: number;
  y: number;
  faceImg: string;
  c: string;
  hi: string;
  lo: string;
}

const BUTTON_CONFIGS: ButtonConfig[] = [
  { key: 'l', label: 'L', x: 97, y: 18, faceImg: FACE_G, c: '#7d7d7d', hi: '#bcbcbc', lo: '#434343' },
  { key: 'r', label: 'R', x: 133, y: 18, faceImg: FACE_G, c: '#7d7d7d', hi: '#bcbcbc', lo: '#434343' },
  { key: 'y', label: 'Y', x: 115, y: 37, faceImg: FACE_Y, c: '#c8c864', hi: '#ffff96', lo: '#6b6b36' },
  { key: 'x', label: 'X', x: 97, y: 55, faceImg: FACE_X, c: '#6464c8', hi: '#9696ff', lo: '#36366b' },
  { key: 'b', label: 'B', x: 133, y: 55, faceImg: FACE_B, c: '#bc0000', hi: '#ff0000', lo: '#650000' },
  { key: 'a', label: 'A', x: 115, y: 74, faceImg: FACE_A, c: '#527252', hi: '#7bab7b', lo: '#2c3d2c' },
];

interface ActionButtonsProps {
  scale: number;
  state: GamepadButtons;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ scale, state }) => {
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
      {BUTTON_CONFIGS.map((btn) => {
        const isActive = Boolean(state[btn.key]);

        return (
          <button
            key={btn.key}
            type="button"
            data-key={btn.key}
            onPointerDown={(e) => handlePointerDown(btn.key, e)}
            onPointerUp={(e) => handlePointerUp(btn.key, e)}
            onPointerCancel={(e) => handlePointerCancel(btn.key, e)}
            className="absolute border-none bg-transparent p-0 m-0 cursor-pointer touch-none select-none pixelated"
            style={{
              left: `${btn.x * s}px`,
              top: `${btn.y * s}px`,
              width: `${22 * s}px`,
              height: `${22 * s}px`,
              backgroundImage: `url("${btn.faceImg}")`,
              backgroundSize: '100% 100%',
              transform: isActive ? `translateY(${s}px)` : 'none',
              outline: 'none',
            }}
          >
            {/* Centered Button Letter on Face */}
            <span
              className="absolute inset-0 flex items-center justify-center pointer-events-none font-bold"
              style={{
                fontSize: `${8 * s}px`,
                color: btn.lo,
                textShadow: `${s}px ${s}px 0 ${btn.hi}`,
                fontFamily: 'orion-font, monospace',
                lineHeight: 1,
              }}
            >
              {btn.label}
            </span>

            {/* Tactile Popup Bubble (Active indicator visible above user's thumb) */}
            {isActive && (
              <span
                className="absolute left-1/2 bottom-full flex items-center justify-center pointer-events-none font-bold z-20"
                style={{
                  transform: `translate(-50%, ${-3 * s}px)`,
                  width: `${24 * s}px`,
                  height: `${24 * s}px`,
                  border: `${2 * s}px solid #000`,
                  borderRadius: `${4 * s}px`,
                  backgroundColor: btn.c,
                  boxShadow: `0 ${s}px 0 rgba(0,0,0,0.35)`,
                  fontSize: `${12 * s}px`,
                  color: '#000',
                  fontFamily: 'orion-font, monospace',
                }}
              >
                {btn.label}
              </span>
            )}
          </button>
        );
      })}
    </>
  );
};
