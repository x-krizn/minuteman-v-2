/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { getOrionStateRef } from '../systems';
import { HudDefenseBars } from './hud/HudDefenseBars';
import {
  getWorldRelativeClasses,
  HudSkillDeck,
  OUTLINED_TEXT,
  resolveToastPlacement,
} from './hud/HudSkillDeck';
import { HudTitleModal } from './hud/HudTitleModal';

export const OrionHud: React.FC = () => {
  const [, setTick] = useState(0);
  const [showPilotModal, setShowPilotModal] = useState(false);
  const [titleTab, setTitleTab] = useState<'new' | 'load'>('new');

  useEffect(() => {
    let animId: number;
    let lastTime = 0;
    const loop = (t: number) => {
      if (t - lastTime >= 32) {
        lastTime = t;
        setTick((prev) => (prev + 1) % 10000);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const state = getOrionStateRef();
  if (!state) return null;

  const isTitleMenuOpen = Boolean(state.atTitleMenu) || showPilotModal;

  if (isTitleMenuOpen) {
    return (
      <HudTitleModal
        state={state}
        titleTab={titleTab}
        setTitleTab={setTitleTab}
        setShowPilotModal={setShowPilotModal}
        forceRerender={() => setTick((t) => t + 1)}
      />
    );
  }

  if (state.useStandardResolutionHud === false) return null;

  const toastPlacement =
    state.toastText && state.toastTimer > 0
      ? resolveToastPlacement(state, state.toastText)
      : null;

  const promptPositionClass = state.promptText
    ? getWorldRelativeClasses(state, state.x, state.y, state.z)
    : '';

  return (
    <aside
      aria-label="Pilot Mech Cockpit Telemetry"
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5 sm:p-2 z-20 select-none font-mono text-[#e2e8f0] bg-transparent"
    >
      {/* 1. TOP BAR HUD CLUSTER (Transparent, Outlined Readouts) */}
      <HudDefenseBars
        state={state}
        onOpenPilotModal={() => setShowPilotModal(true)}
      />

      {/* 2. CONTEXTUAL OUTLINED POP-UP MESSAGES (Auto-expiring, no background container, relative to info) */}
      {state.promptText && (
        <div
          aria-live="polite"
          className={`pointer-events-none absolute z-30 px-1.5 py-0.5 bg-transparent border border-[#facc15]/85 text-[#fef08a] rounded-xs text-[8.5px] sm:text-[9.5px] font-extrabold tracking-wider uppercase whitespace-nowrap ${OUTLINED_TEXT} ${promptPositionClass}`}
        >
          {state.promptText}
        </div>
      )}

      {state.toastText && state.toastTimer > 0 && toastPlacement && (
        <div
          aria-live="polite"
          className={`pointer-events-none absolute z-30 px-2 py-0.5 bg-transparent border rounded-xs text-[8.5px] sm:text-[9.5px] font-extrabold tracking-wider uppercase max-w-[82%] truncate ${OUTLINED_TEXT} ${toastPlacement.positionClass} ${toastPlacement.colorClass} ${
            state.toastTimer < 0.4 ? 'opacity-50' : 'opacity-100'
          } transition-opacity duration-150`}
        >
          {state.toastText}
        </div>
      )}

      {/* 3. BOTTOM 5-SKILL ICON BAR */}
      <HudSkillDeck state={state} />
    </aside>
  );
};
