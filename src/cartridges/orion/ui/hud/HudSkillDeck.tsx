/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  activateResolvedCombatSkill,
  firePrimarySalvoShot,
  getLockedTarget,
   getResolvedCombatSkills,
  PERFECT_BLOCK_WINDOW_SEC,
  releaseHeldBlock,
  ResolvedCombatSkill,
  spawnParticles,
  startHoldingBlock,
} from '../../systems';
import { OrionState } from '../../types';

export const OUTLINED_TEXT =
  '[text-shadow:_-1px_-1px_0_#020617,_1px_-1px_0_#020617,_-1px_1px_0_#020617,_1px_1px_0_#020617,_0_1px_3px_#020617]';

const WORLD_X_CLASSES = [
  'left-[18%]',
  'left-[26%]',
  'left-[34%]',
  'left-[42%]',
  'left-[50%]',
  'left-[58%]',
  'left-[66%]',
  'left-[74%]',
  'left-[82%]',
] as const;

const WORLD_Y_CLASSES = [
  'top-[16%]',
  'top-[24%]',
  'top-[32%]',
  'top-[40%]',
  'top-[48%]',
  'top-[56%]',
  'top-[64%]',
  'top-[72%]',
] as const;

export function getWorldRelativeClasses(
  state: OrionState,
  wx: number,
  wy: number,
  wz: number = 0
): string {
  const camX = Math.round(state.camX || 0);
  const camY = Math.round(state.camY || 0);
  const normX = Math.max(0, Math.min(1, (wx - camX) / 160));
  const normY = Math.max(0, Math.min(1, (wy - wz * 0.75 - 16 - camY) / 144));
  const xIdx = Math.min(
    WORLD_X_CLASSES.length - 1,
    Math.max(0, Math.round(normX * (WORLD_X_CLASSES.length - 1)))
  );
  const yIdx = Math.min(
    WORLD_Y_CLASSES.length - 1,
    Math.max(0, Math.round(normY * (WORLD_Y_CLASSES.length - 1)))
  );
  return `${WORLD_X_CLASSES[xIdx]} ${WORLD_Y_CLASSES[yIdx]} -translate-x-1/2 -translate-y-1/2`;
}

export function resolveToastPlacement(
  state: OrionState,
  text: string
): { positionClass: string; colorClass: string } {
  const upper = text.toUpperCase();

  if (
    upper.includes('TARGET LOCK') ||
    upper.includes('TARGET UNLOCK') ||
    upper.includes('HOSTILE TARGET')
  ) {
    const locked = getLockedTarget(state);
    const pos = locked
      ? getWorldRelativeClasses(state, locked.x, locked.y, locked.z)
      : getWorldRelativeClasses(state, state.x, state.y, state.z);
    return {
      positionClass: pos,
      colorClass: 'text-[#38bdf8] border-[#38bdf8]/80',
    };
  }

  if (
    upper.includes('RELOAD') ||
    upper.includes('MAGAZINE') ||
    upper.includes('STANCE') ||
    upper.includes('SWAPPED') ||
    upper.includes('SWAP') ||
    upper.includes('AUXILIARY')
  ) {
    return {
      positionClass: 'top-14 right-2 text-right',
      colorClass: 'text-[#fbbf24] border-[#fbbf24]/80',
    };
  }

  if (
    upper.includes('OVERHEAT') ||
    upper.includes('BOOSTER') ||
    upper.includes('SHIELD') ||
    upper.includes('ARMOR') ||
    upper.includes('CRITICAL') ||
    upper.includes('FRAME DESTROYED') ||
    upper.includes('SINKHOLE') ||
    upper.includes('REBOOTED')
  ) {
    return {
      positionClass: 'top-16 left-2 text-left',
      colorClass:
        upper.includes('OVERHEAT') ||
        upper.includes('DESTROYED') ||
        upper.includes('CRITICAL')
          ? 'text-[#f87171] border-[#f87171]/80'
          : 'text-[#7dd3fc] border-[#38bdf8]/80',
    };
  }

  if (
    upper.includes('COOLDOWN') ||
    upper.includes('UNAVAILABLE') ||
    upper.includes('DEPLETED') ||
    upper.includes('BELT SLOT') ||
    upper.includes('EQUIP OFF-HAND')
  ) {
    return {
      positionClass: 'bottom-11 left-1/2 -translate-x-1/2 text-center',
      colorClass: 'text-[#fde68a] border-[#fbbf24]/75',
    };
  }

  if (
    upper.includes('LOOTED') ||
    upper.includes('SALVAGED') ||
    upper.includes('SCRAP') ||
    upper.includes('RESTED') ||
    upper.includes('CAMPFIRE') ||
    upper.includes('LANTERN') ||
    upper.includes('LOYALIST') ||
    upper.includes('SCAVENGER') ||
    upper.includes('TRADED') ||
    upper.includes('SWITCH') ||
    upper.includes('BARRIERS') ||
    upper.includes('SIGNET RING') ||
    upper.includes('GATE') ||
    upper.includes('DUNGEON') ||
    upper.includes('WAYGATE') ||
    upper.includes('WAYSTATION')
  ) {
    return {
      positionClass: getWorldRelativeClasses(state, state.x, state.y, state.z),
      colorClass: 'text-[#fef08a] border-[#facc15]/80',
    };
  }

  return {
    positionClass: 'top-6 left-1/2 -translate-x-1/2 text-center',
    colorClass: 'text-[#7dd3fc] border-[#38bdf8]/75',
  };
}

export function renderSkillGlyph(
  skill: ResolvedCombatSkill | null,
  index: number
): React.ReactNode {
  if (!skill || !skill.available || skill.id === 'none') {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" strokeDasharray="2 2" />
      </svg>
    );
  }

  if (skill.sourceCategory === 'belt') {
    if (skill.itemId === 'demantoid_flask') {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          <rect x="4" y="4" width="16" height="16" rx="3" strokeWidth="1.6" />
        </svg>
      );
    }
    if (skill.itemId === 'grail_water') {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3c-4 5-6 8-6 11a6 6 0 0012 0c0-3-2-6-6-11z" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fbbf24]" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="4" width="10" height="16" rx="4" />
        <path d="M7 12h10" />
      </svg>
    );
  }

  const wId = skill.weaponId || '';
  const isShield = wId.includes('shield');
  const isCatalyst = wId.includes('catalyst');
  const isBowOrQuiver = wId === 'great_bow' || wId === 'quiver';
  const isSpearOrLance = wId === 'short_spear' || wId === 'avalon_siege_lance';
  const isMace = wId === 'mace';
  const isAxe = wId === 'hand_axe';
  const isSwordOrKhopesh = wId === 'long_sword' || wId === 'khopesh';

  if (isCatalyst) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#e879f9]" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 19,9 12,22 5,9" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (index === 0) {
    if (isShield) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
        </svg>
      );
    }
    if (isBowOrQuiver) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 19L19 5M19 5h-6M19 5v6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 8c5 0 8 3 8 8" strokeLinecap="round" />
        </svg>
      );
    }
    if (isSpearOrLance) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#7dd3fc]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20L20 4M14 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (isMace) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fbbf24]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 19l9-9" strokeLinecap="round" />
          <polygon points="14,4 20,4 20,10 14,10" />
        </svg>
      );
    }
    if (isAxe) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fb923c]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 19L17 7" strokeLinecap="round" />
          <path d="M13 4c4 0 7 3 7 7-3 1-5 0-7-2" strokeLinejoin="round" />
        </svg>
      );
    }
    if (isSwordOrKhopesh) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#e879f9]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20L19 5M14 5h5v5M7 13l4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="6" />
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
      </svg>
    );
  }

  if (index === 1) {
    if (isShield || isSwordOrKhopesh) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fbbf24]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
          <path d="M9 12h6M12 9v6" strokeLinecap="round" />
        </svg>
      );
    }
    if (isBowOrQuiver) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fde047]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M6 17L4 7M18 17l2-10" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#fbbf24]" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,3 14.8,8.8 21,9.5 16.5,14 17.8,20.2 12,17 6.2,20.2 7.5,14 3,9.5 9.2,8.8" />
      </svg>
    );
  }

  if (index === 2) {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#c084fc]" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 3L5 14h6l-1 7 9-11h-6l1-7z" strokeLinejoin="round" />
      </svg>
    );
  }

  if (index === 3 || skill.isBlock) {
    if (skill.isBlock) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
          <path d="M12 7v9M8.5 11h7" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,3 21,12 12,21 3,12" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#f472b6]" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6L12 2z" strokeLinejoin="round" />
    </svg>
  );
}

interface HudSkillDeckProps {
  state: OrionState;
}

export const HudSkillDeck: React.FC<HudSkillDeckProps> = ({ state }) => {
  const combatSkills = getResolvedCombatSkills(state);
  const skillSlots: Array<ResolvedCombatSkill | null> = [
    combatSkills.skill1,
    combatSkills.skill2,
    combatSkills.skill3,
    combatSkills.skill4,
    combatSkills.skill5,
  ];
  const isReloading = state.isReloading;
  const reloadTimer = state.reloadTimer;

  const hudCombatCtx = {
    state,
    sound: soundSystem,
    spawnParticles: (x: number, y: number, z: number, count: number, color: string, label?: string) => {
      spawnParticles(state, x, y, z, count, color, label);
    },
    say: (txt: string) => {
      state.toastText = txt;
      state.toastTimer = 2.2;
    },
  };

  return (
    <footer className="w-full flex items-center justify-center pb-0.5 bg-transparent">
      <div
        aria-label="Combat Skill Icons"
        className="flex items-center gap-1.5 sm:gap-2 bg-transparent"
      >
        {skillSlots.map((skill, idx) => {
          const slotNum = (idx + 1) as 1 | 2 | 3 | 4 | 5;
          const rawCd =
            idx === 0 && isReloading
              ? reloadTimer
              : skill?.currentCooldown || 0;
          const activeRem = skill?.activeRemaining || 0;
          const isDurationActive = activeRem > 0.05;
          const onCooldown = rawCd > 0.05;
          const isSkillReloading = Boolean(
            (idx === 0 && isReloading) || (skill?.isReloading && onCooldown)
          );
          const isAvailable = Boolean(skill && skill.available && skill.id !== 'none');
          const isActiveSlot =
            (idx === 0 && state.combatActiveChain) ||
            isDurationActive ||
            Boolean(
              skill?.cooldownKey &&
                state.activeSkillCooldownKey === skill.cooldownKey &&
                state.skillActionTimer > 0
            );

          const isHeldBlockSlot = Boolean(skill?.isBlock && state.isHoldingBlock);
          const isPerfectBlockActive = Boolean(
            isHeldBlockSlot && (state.blockHoldTimer || 0) <= PERFECT_BLOCK_WINDOW_SEC
          );

          const borderColorClass = !isAvailable
            ? 'border-[#334155]/45 opacity-40'
            : isPerfectBlockActive
              ? 'border-[#38bdf8] scale-110'
              : isHeldBlockSlot
                ? 'border-[#93c5fd] scale-105'
                : isDurationActive
                  ? 'border-[#4ade80] scale-105'
                  : isActiveSlot
                    ? 'border-white scale-105'
                    : isSkillReloading
                      ? 'border-[#f59e0b]/90'
                      : onCooldown
                        ? 'border-[#64748b]/80'
                        : idx === 0
                          ? 'border-[#38bdf8]/85 hover:border-[#7dd3fc]'
                          : idx === 1
                            ? 'border-[#fbbf24]/85 hover:border-[#fde047]'
                            : idx === 2
                              ? 'border-[#c084fc]/85 hover:border-[#e9d5ff]'
                              : idx === 3
                                ? 'border-[#38bdf8]/75 hover:border-[#7dd3fc]'
                                : 'border-[#f472b6]/80 hover:border-[#fbcfe8]';

          return (
            <button
              key={slotNum}
              type="button"
              onPointerDown={() => {
                if (skill?.isBlock) {
                  startHoldingBlock(state, hudCombatCtx);
                }
              }}
              onPointerUp={() => {
                if (skill?.isBlock) {
                  releaseHeldBlock(state);
                }
              }}
              onPointerLeave={() => {
                if (skill?.isBlock && state.isHoldingBlock) {
                  releaseHeldBlock(state);
                }
              }}
              onPointerCancel={() => {
                if (skill?.isBlock && state.isHoldingBlock) {
                  releaseHeldBlock(state);
                }
              }}
              onClick={() => {
                if (skill?.isBlock) return;
                if (idx === 0) {
                  firePrimarySalvoShot(state, hudCombatCtx, false);
                } else {
                  activateResolvedCombatSkill(state, hudCombatCtx, slotNum);
                }
              }}
              title={
                skill
                  ? `${skill.name}${
                      skill.isBlock
                        ? ' [Hold: 0.25s Perfect Block Window · No Cooldown]'
                        : isDurationActive
                          ? ` [ACTIVE ${activeRem.toFixed(1)}s]`
                          : isSkillReloading
                            ? ` [RELOAD ${rawCd.toFixed(1)}s]`
                            : onCooldown
                              ? ` (${rawCd.toFixed(1)}s)`
                              : ''
                    }`
                  : `Skill ${slotNum}`
              }
              className={`pointer-events-auto relative w-7 h-7 sm:w-8 sm:h-8 rounded-xs border bg-transparent flex items-center justify-center transition-transform cursor-pointer drop-shadow-[0_1px_2px_rgba(2,6,23,0.95)] ${borderColorClass}`}
            >
              {/* Skill Icon SVG */}
              <span className={onCooldown ? 'opacity-35' : 'opacity-95'}>
                {renderSkillGlyph(skill, idx)}
              </span>

              {/* Consumable Stack Count */}
              {skill?.sourceCategory === 'belt' &&
                typeof skill.itemCount === 'number' &&
                !onCooldown && (
                  <span
                    className={`absolute bottom-0 right-0.5 text-[7px] font-black text-[#fef08a] leading-none ${OUTLINED_TEXT}`}
                  >
                    {skill.itemCount}
                  </span>
                )}

              {/* Overlaid Held Block / Perfect Window, Active Duration, or Cooldown/Reload Timer */}
              {isHeldBlockSlot ? (
                <span
                  className={`absolute inset-0 flex items-center justify-center text-[7px] font-black ${
                    isPerfectBlockActive ? 'text-[#38bdf8]' : 'text-[#bae6fd]'
                  } tracking-tighter ${OUTLINED_TEXT}`}
                >
                  {isPerfectBlockActive ? 'PERF' : 'HOLD'}
                </span>
              ) : isDurationActive ? (
                <span
                  className={`absolute inset-0 flex items-center justify-center text-[8.5px] sm:text-[9px] font-black text-[#4ade80] tracking-tighter ${OUTLINED_TEXT}`}
                >
                  {activeRem.toFixed(1)}
                </span>
              ) : onCooldown ? (
                <span
                  className={`absolute inset-0 flex items-center justify-center text-[8.5px] sm:text-[9px] font-black ${
                    isSkillReloading ? 'text-[#fbbf24]' : 'text-white'
                  } tracking-tighter ${OUTLINED_TEXT}`}
                >
                  {rawCd.toFixed(1)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </footer>
  );
};
