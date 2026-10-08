/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { registry } from '../../engine/core/registry';
import { gamepadStore } from '../../engine/input/gamepadStore';
import { ButtonKey, GamepadButtons, StickVector } from '../../types/input';

interface DebugOverlayProps {
  fps: number;
  onClose: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ fps, onClose }) => {
  const [buttons, setButtons] = useState<GamepadButtons>(() =>
    gamepadStore.getState()
  );
  const [stick, setStick] = useState<StickVector>(() => gamepadStore.getStick());
  const [errors, setErrors] = useState<readonly string[]>(() =>
    registry.getErrors()
  );

  useEffect(() => {
    const unsubPad = gamepadStore.subscribe((st, sk) => {
      setButtons(st);
      setStick(sk);
    });
    const unsubReg = registry.subscribe(() => {
      setErrors(registry.getErrors());
    });
    return () => {
      unsubPad();
      unsubReg();
    };
  }, []);

  const activeKeys = (Object.keys(buttons) as ButtonKey[]).filter(
    (k) => buttons[k]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#182018] border border-[#00ff33]/40 rounded-lg p-5 max-w-lg w-full text-[#00ff33] font-mono text-xs shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#00ff33]/30 pb-2">
          <div className="font-bold text-sm tracking-wider flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00ff33] animate-pulse" />
            MINUTEMAN ENGINE DEBUGGER
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 border border-[#00ff33]/50 hover:bg-[#00ff33] hover:text-[#0f300f] transition-colors rounded-xs"
          >
            ESC / CLOSE
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[#0f180f] p-3 rounded-sm border border-[#00ff33]/20">
          <div>
            <div className="text-gray-400 text-[10px] uppercase">Engine Performance</div>
            <div className="text-base font-bold text-emerald-400">{fps} FPS</div>
          </div>
          <div>
            <div className="text-gray-400 text-[10px] uppercase">Analog Stick</div>
            <div className="text-sm">
              X: {stick.x.toFixed(2)} | Y: {stick.y.toFixed(2)}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-400 text-[10px] uppercase">Active Inputs</div>
            <div className="text-sm font-semibold text-amber-300">
              {activeKeys.length > 0 ? activeKeys.join(', ').toUpperCase() : 'NONE'}
            </div>
          </div>
        </div>

        <div>
          <div className="text-gray-400 text-[10px] uppercase mb-1">
            Registered Cartridges ({registry.getCartridges().length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {registry.getCartridges().map((c) => (
              <span
                key={c.id}
                className="px-2 py-0.5 bg-[#00ff33]/15 text-[#00ff33] border border-[#00ff33]/30 rounded-xs"
              >
                {c.name} ({c.id})
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-[10px] uppercase">
              Engine Error Log ({errors.length})
            </span>
            {errors.length > 0 && (
              <button
                onClick={() => registry.clearErrors()}
                className="text-[10px] text-red-400 hover:underline"
              >
                Clear Log
              </button>
            )}
          </div>
          <div className="bg-black/60 border border-[#00ff33]/20 rounded-sm p-2 max-h-32 overflow-y-auto space-y-1">
            {errors.length === 0 ? (
              <div className="text-gray-500 italic">No errors logged. All systems nominal.</div>
            ) : (
              errors.map((err, i) => (
                <div key={i} className="text-red-400 break-words">
                  &gt; {err}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
