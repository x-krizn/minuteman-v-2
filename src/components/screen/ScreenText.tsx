/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ScreenTextProps {
  title?: string;
  lines: string[];
  selectedIndex?: number;
  onLineClick?: (index: number) => void;
}

export const ScreenText: React.FC<ScreenTextProps> = ({
  title,
  lines,
  selectedIndex = -1,
  onLineClick,
}) => {
  return (
    <div
      id="screen-text"
      className="text-center max-w-full max-h-full overflow-hidden p-2 text-[#00ff33] select-none tracking-widest font-normal"
      style={{
        fontFamily: 'orion-font, monospace',
        textShadow: '0 0 4px rgba(0, 255, 51, 0.4)',
      }}
    >
      {title && (
        <div className="mb-3 text-[13px] uppercase font-bold tracking-wider opacity-90 border-b border-[#00ff33]/30 pb-1">
          {title}
        </div>
      )}

      <div className="flex flex-col gap-0.5 text-[11px]">
        {lines.map((line, i) => {
          const isSelected = i === selectedIndex;
          const isBlank = line === '';

          return (
            <div
              key={i}
              onClick={() => onLineClick?.(i)}
              className={`px-2 py-0.5 rounded-xs transition-colors duration-75 ${
                isBlank ? 'h-3' : ''
              } ${
                isSelected
                  ? 'bg-[#00ff33] text-[#0f300f] font-bold shadow-sm'
                  : 'hover:text-white cursor-pointer'
              }`}
            >
              {isBlank ? '\u00A0' : line}
            </div>
          );
        })}
      </div>
    </div>
  );
};
