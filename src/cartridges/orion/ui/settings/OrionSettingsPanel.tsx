/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  formatGamepadName,
  hardwareGamepad,
} from '../../../../engine/input/hardwareGamepad';
import {
  clearKeyboardSecondaryBinding,
  CONTROL_ACTION_DEFINITIONS,
  ControlBindingsConfig,
  formatGamepadButtonLabel,
  formatKeyCodeLabel,
  getControlBindings,
  resetGamepadBindingsToDefault,
  resetKeyboardBindingsToDefault,
  setGamepadBinding,
  setGamepadDeadzone,
  setGamepadTriggerThreshold,
  setGamepadVibrationEnabled,
  setInputCaptureActive,
  setKeyboardBinding,
  setVirtualGamepadLayout,
  startGamepadCaptureSession,
  startKeyboardCaptureSession,
  subscribeControlBindings,
  VirtualGamepadLayoutMode,
} from '../../../../engine/input/inputBindingsStore';
import { gamepadStore } from '../../../../engine/input/gamepadStore';
import { keyboardMapper } from '../../../../engine/input/keyboardMapper';
import { ButtonKey } from '../../../../types/input';
import {
  isAppFullscreen,
  toggleAppFullscreen,
} from '../../../../utils/fullscreen';
import {
  applyOrionGraphicsPreset,
  getOrionGraphicsSettings,
  notifyOrionStateChange,
  OrionGraphicsPreset,
  OrionGraphicsSettings,
  resetOrionGraphicsSettings,
  setTutorialStateActive,
  subscribeOrionGraphicsSettings,
  updateOrionGraphicsSettings,
  getOrionStateRef,
} from '../../systems';

/**
 * Top-level tab identifier for `OrionSettingsPanel`.
 */
export type OrionSettingsTab = 'controls' | 'graphics' | 'audio';

/**
 * Props for the unified `OrionSettingsPanel` component shared by the `[START]` Pause Menu and Title Screen.
 */
export interface OrionSettingsPanelProps {
  initialTab?: OrionSettingsTab;
  soundEnabled?: boolean;
  scanlinesEnabled?: boolean;
  isFullscreen?: boolean;
  connectedGamepads?: string[];
  onToggleSound?: () => void;
  onToggleScanlines?: () => void;
  onToggleFullscreen?: () => void;
  onNotifyToast?: (message: string) => void;
}

interface KeyboardCaptureTarget {
  action: ButtonKey;
  slotIndex: 0 | 1;
}

/**
 * Renders the unified 3-tab Settings interface (`Controls`, `Graphics`, `Audio & HUD`)
 * with interactive keyboard and physical gamepad button remapping, analog deadzone tuning,
 * and real-time post-processing graphics presets, toggles, and sliders.
 */
export const OrionSettingsPanel: React.FC<OrionSettingsPanelProps> = ({
  initialTab = 'controls',
  soundEnabled,
  scanlinesEnabled,
  isFullscreen,
  connectedGamepads,
  onToggleSound,
  onToggleScanlines: _onToggleScanlines,
  onToggleFullscreen,
  onNotifyToast,
}) => {
  const [activeTab, setActiveTab] = useState<OrionSettingsTab>(initialTab);
  const [controlSubMode, setControlSubMode] = useState<'keyboard' | 'gamepad'>('keyboard');
  const [bindings, setBindings] = useState<ControlBindingsConfig>(() => getControlBindings());
  const [graphics, setGraphics] = useState<OrionGraphicsSettings>(() => getOrionGraphicsSettings());
  const [kbCapture, setKbCapture] = useState<KeyboardCaptureTarget | null>(null);
  const [kbPreviewCode, setKbPreviewCode] = useState<string | null>(null);
  const [gpCaptureAction, setGpCaptureAction] = useState<ButtonKey | null>(null);
  const [gpPreviewBtnIdx, setGpPreviewBtnIdx] = useState<number | null>(null);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const triggerFeedback = (msg: string) => {
    if (onNotifyToast) {
      onNotifyToast(msg);
    }
    setLocalToast(msg);
  };

  useEffect(() => {
    if (!localToast) return;
    const timerId = window.setTimeout(() => {
      setLocalToast(null);
    }, 2200);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [localToast]);

  useEffect(() => {
    const unsubControls = subscribeControlBindings(() => {
      setBindings({ ...getControlBindings() });
    });
    const unsubGraphics = subscribeOrionGraphicsSettings((next) => {
      setGraphics({ ...next });
    });
    return () => {
      unsubControls();
      unsubGraphics();
      setInputCaptureActive(false);
    };
  }, []);

  // Interactive Keyboard Key Capture Session (release-gated, isolated from menus)
  useEffect(() => {
    if (!kbCapture) {
      setKbPreviewCode(null);
      return;
    }

    setKbPreviewCode(null);
    return startKeyboardCaptureSession({
      onFlushInputState: () => {
        keyboardMapper.releaseAll();
        gamepadStore.resetAll();
      },
      onKeyPreview: (code) => {
        setKbPreviewCode(code);
      },
      onKeyCaptured: (code) => {
        const { swappedWith } = setKeyboardBinding(
          kbCapture.action,
          kbCapture.slotIndex,
          code
        );
        soundSystem.playSelect();
        setKbPreviewCode(null);
        setKbCapture(null);
        const keyLabel = formatKeyCodeLabel(code);
        if (swappedWith) {
          triggerFeedback(
            `BOUND ${keyLabel} TO ${kbCapture.action.toUpperCase()} (SWAPPED WITH ${swappedWith.toUpperCase()})`
          );
        } else {
          triggerFeedback(`BOUND ${keyLabel} TO ${kbCapture.action.toUpperCase()}`);
        }
      },
      onCancel: () => {
        soundSystem.playMenuBeep();
        setKbPreviewCode(null);
        setKbCapture(null);
        triggerFeedback('KEY BINDING CANCELLED');
      },
    });
  }, [kbCapture]);

  // Interactive Physical Gamepad Button Capture Session (release-gated, isolated from menus)
  useEffect(() => {
    if (!gpCaptureAction) {
      setGpPreviewBtnIdx(null);
      return;
    }

    setGpPreviewBtnIdx(null);
    return startGamepadCaptureSession(
      () => hardwareGamepad.getFirstPressedRawButtonIndex(),
      (pressedIdx) => {
        const { swappedWith } = setGamepadBinding(gpCaptureAction, pressedIdx);
        soundSystem.playSelect();
        setGpPreviewBtnIdx(null);
        setGpCaptureAction(null);
        const btnLabel = formatGamepadButtonLabel(pressedIdx);
        if (swappedWith) {
          triggerFeedback(
            `BOUND ${btnLabel} TO ${gpCaptureAction.toUpperCase()} (SWAPPED WITH ${swappedWith.toUpperCase()})`
          );
        } else {
          triggerFeedback(`BOUND ${btnLabel} TO ${gpCaptureAction.toUpperCase()}`);
        }
      },
      () => {
        soundSystem.playMenuBeep();
        setGpPreviewBtnIdx(null);
        setGpCaptureAction(null);
        triggerFeedback('CONTROLLER BINDING CANCELLED');
      },
      (previewIdx) => {
        setGpPreviewBtnIdx(previewIdx);
      },
      () => {
        keyboardMapper.releaseAll();
        gamepadStore.resetAll();
      }
    );
  }, [gpCaptureAction]);

  const activeState = getOrionStateRef();
  const effectiveSoundEnabled = soundEnabled ?? soundSystem.isEnabled();
  const effectiveScanlines = scanlinesEnabled ?? graphics.scanlinesEnabled;
  const effectiveFullscreen = isFullscreen ?? isAppFullscreen();
  const activePads = connectedGamepads ?? hardwareGamepad.getConnectedNames();

  const handleSelectPreset = (preset: Exclude<OrionGraphicsPreset, 'custom'>) => {
    soundSystem.playSelect();
    const next = applyOrionGraphicsPreset(preset);
    if (activeState) {
      activeState.useStandardResolutionHud = next.hudResolution === 'hires';
      notifyOrionStateChange();
    }
    triggerFeedback(`APPLIED ${preset.toUpperCase()} GRAPHICS PRESET`);
  };

  const handleToggleScanlinesUnified = () => {
    soundSystem.playSelect();
    const nextVal = !effectiveScanlines;
    updateOrionGraphicsSettings({ scanlinesEnabled: nextVal });
    triggerFeedback(`CRT SCANLINES: ${nextVal ? 'ENABLED' : 'OFF'}`);
  };

  const handleToggleHudResolution = () => {
    soundSystem.playSelect();
    const currentHires = activeState
      ? (activeState.useStandardResolutionHud ?? true)
      : graphics.hudResolution === 'hires';
    const nextHires = !currentHires;
    if (activeState) {
      activeState.useStandardResolutionHud = nextHires;
      notifyOrionStateChange();
    }
    updateOrionGraphicsSettings({
      hudResolution: nextHires ? 'hires' : 'pixel',
      preset: graphics.preset,
    });
    setTick((t) => t + 1);
    triggerFeedback(
      nextHires ? 'HUD MODE: HI-RES TACTICAL OVERLAY' : 'HUD MODE: RETRO PIXEL CANVAS'
    );
  };

  const handleToggleSoundUnified = () => {
    if (onToggleSound) {
      onToggleSound();
    } else {
      soundSystem.toggle();
    }
    setTick((t) => t + 1);
    triggerFeedback(
      soundSystem.isEnabled() ? 'CHIPTUNE SYNTHESIZER: ACTIVE' : 'CHIPTUNE SYNTHESIZER: MUTED'
    );
  };

  const handleToggleFullscreenUnified = () => {
    soundSystem.playSelect();
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      toggleAppFullscreen();
    }
    setTick((t) => t + 1);
  };

  const activeCaptureActionDef = kbCapture
    ? CONTROL_ACTION_DEFINITIONS.find((a) => a.key === kbCapture.action)
    : gpCaptureAction
      ? CONTROL_ACTION_DEFINITIONS.find((a) => a.key === gpCaptureAction)
      : undefined;

  const handleSelectPadLayout = (mode: VirtualGamepadLayoutMode) => {
    soundSystem.playSelect();
    setVirtualGamepadLayout(mode);
    const label =
      mode === 'auto'
        ? 'AUTO SPLIT IN LANDSCAPE'
        : mode === 'bottom'
          ? 'CLASSIC BOTTOM DECK'
          : 'VIRTUAL GAMEPAD HIDDEN';
    triggerFeedback(`PAD LAYOUT: ${label}`);
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden text-[10px] font-mono select-none">
      {/* Isolated Key / Button Capture Pop-Up Modal */}
      {(kbCapture || gpCaptureAction) && activeCaptureActionDef && (
        <div
          role="dialog"
          aria-modal="true"
          data-menu-scope="true"
          aria-label="Remap In-Game Control"
          className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3"
        >
          <div className="w-full max-w-[320px] bg-slate-900 border-2 border-amber-400 rounded-xs p-3 shadow-2xl flex flex-col gap-2.5 text-center">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
              <span className="text-[9px] font-black tracking-wider text-amber-300 uppercase">
                {kbCapture ? 'REMAP IN-GAME KEY' : 'REMAP CONTROLLER BUTTON'}
              </span>
              <span className="text-[8.5px] font-bold text-slate-400">
                {kbCapture ? `SLOT ${kbCapture.slotIndex + 1}` : 'W3C PAD'}
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] font-black text-white">
                {activeCaptureActionDef.badge} · {activeCaptureActionDef.label}
              </div>
              <div className="text-[8.5px] text-slate-400">
                {activeCaptureActionDef.detail}
              </div>
            </div>

            {/* Live Key / Button Pop-Up Display */}
            <div className="py-3 px-2 bg-slate-950 border border-sky-500/60 rounded-xs flex flex-col items-center justify-center gap-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                {kbCapture
                  ? kbPreviewCode
                    ? 'KEY DETECTED (RELEASE TO BIND)'
                    : 'PRESS ANY KEY ON KEYBOARD'
                  : gpPreviewBtnIdx !== null
                    ? 'BUTTON DETECTED (RELEASE TO BIND)'
                    : 'PRESS ANY CONTROLLER BUTTON'}
              </span>
              <div
                className={`px-3 py-1.5 rounded-xs border font-black text-sm tracking-wider tabular-nums ${
                  kbPreviewCode || gpPreviewBtnIdx !== null
                    ? 'bg-amber-400 text-slate-950 border-amber-200'
                    : 'bg-slate-900 text-sky-300 border-slate-700 animate-pulse'
                }`}
              >
                {kbCapture
                  ? kbPreviewCode
                    ? formatKeyCodeLabel(kbPreviewCode)
                    : 'PRESS KEY...'
                  : gpPreviewBtnIdx !== null
                    ? formatGamepadButtonLabel(gpPreviewBtnIdx)
                    : 'PRESS BUTTON...'}
              </div>
              {kbCapture && (
                <span className="text-[8px] text-slate-400 tabular-nums">
                  Current:{' '}
                  <strong className="text-slate-200">
                    {formatKeyCodeLabel(
                      bindings.keyboard[kbCapture.action][kbCapture.slotIndex]
                    )}
                  </strong>
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
              {kbCapture && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyboardBinding(kbCapture.action, kbCapture.slotIndex, 'Escape');
                    soundSystem.playSelect();
                    setKbPreviewCode(null);
                    setKbCapture(null);
                    triggerFeedback(`BOUND ESC TO ${kbCapture.action.toUpperCase()}`);
                  }}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-sky-300 border border-sky-500/60 rounded-xs font-bold text-[8.5px] whitespace-nowrap cursor-pointer"
                >
                  BIND ESC
                </button>
              )}

              {kbCapture && kbCapture.slotIndex === 1 && bindings.keyboard[kbCapture.action][1] && (
                <button
                  type="button"
                  onClick={() => {
                    clearKeyboardSecondaryBinding(kbCapture.action);
                    soundSystem.playMenuBeep();
                    setKbPreviewCode(null);
                    setKbCapture(null);
                    triggerFeedback(
                      `CLEARED SECONDARY KEY FOR ${kbCapture.action.toUpperCase()}`
                    );
                  }}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-rose-300 border border-rose-500/50 rounded-xs font-bold text-[8.5px] whitespace-nowrap cursor-pointer"
                >
                  UNBIND
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setKbPreviewCode(null);
                  setGpPreviewBtnIdx(null);
                  setKbCapture(null);
                  setGpCaptureAction(null);
                  setInputCaptureActive(false);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xs font-bold text-[8.5px] whitespace-nowrap cursor-pointer"
              >
                CANCEL [ESC]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 3-Tab Bar (`[L]` / `[R]` compatible via data-menu-tabs="true") */}
      <div
        data-menu-tabs="true"
        className="flex items-center justify-between gap-1.5 pb-1.5 mb-2 border-b border-slate-800 shrink-0"
      >
        <div className="flex items-center gap-1">
          {(
            [
              { id: 'controls', label: 'CONTROLS' },
              { id: 'graphics', label: 'GRAPHICS' },
              { id: 'audio', label: 'AUDIO & HUD' },
            ] as const
          ).map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isTabActive}
                data-tab-active={isTabActive ? 'true' : 'false'}
                onClick={() => {
                  soundSystem.playSelect();
                  setKbCapture(null);
                  setGpCaptureAction(null);
                  setInputCaptureActive(false);
                  setActiveTab(tab.id);
                }}
                className={`px-2.5 py-1 rounded-xs font-bold text-[9.5px] tracking-wider whitespace-nowrap shrink-0 cursor-pointer border transition-colors ${
                  isTabActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/80'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-[8.5px] text-slate-400 hidden sm:inline whitespace-nowrap shrink-0">
          [L / R] SWITCH TAB
        </span>
      </div>

      {/* Inline Feedback Banner */}
      {localToast && (
        <div className="mb-1.5 py-1 px-2 bg-slate-900 border border-amber-400/80 text-amber-300 font-bold text-[9px] text-center rounded-xs shrink-0">
          {localToast}
        </div>
      )}

      {/* TAB 1: CONTROLS (Keyboard Keys + Physical Gamepad Buttons & Deadzone) */}
      {activeTab === 'controls' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Device Sub-Selector & Reset Defaults Bar */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5 shrink-0 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setKbCapture(null);
                  setGpCaptureAction(null);
                  setInputCaptureActive(false);
                  setControlSubMode('keyboard');
                }}
                className={`px-2 py-0.5 rounded-xs font-bold text-[9px] whitespace-nowrap shrink-0 cursor-pointer border ${
                  controlSubMode === 'keyboard'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/70'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                IN-GAME KEYS
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playMenuBeep();
                  setKbCapture(null);
                  setGpCaptureAction(null);
                  setInputCaptureActive(false);
                  setControlSubMode('gamepad');
                }}
                className={`px-2 py-0.5 rounded-xs font-bold text-[9px] whitespace-nowrap shrink-0 cursor-pointer border ${
                  controlSubMode === 'gamepad'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/70'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                GAMEPAD & DEADZONE {activePads.length > 0 ? `(${activePads.length})` : ''}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                setKbCapture(null);
                setGpCaptureAction(null);
                setInputCaptureActive(false);
                if (controlSubMode === 'keyboard') {
                  resetKeyboardBindingsToDefault();
                  triggerFeedback('IN-GAME KEYBOARD BINDINGS RESET TO DEFAULT');
                } else {
                  resetGamepadBindingsToDefault();
                  triggerFeedback('GAMEPAD BINDINGS & DEADZONE RESET TO DEFAULT');
                }
              }}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              RESET DEFAULTS
            </button>
          </div>

          {controlSubMode === 'keyboard' ? (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
              {/* Menu Isolation & Virtual Pad Layout Bar */}
              <div className="p-1.5 bg-slate-900/95 border border-slate-800 rounded-xs flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[8px] text-slate-300">
                  Remaps <strong className="text-sky-300">in-game controls</strong> only. Menus always use{' '}
                  <strong className="text-amber-300">Arrows/WASD · Enter · Esc · Q/E · Tab</strong>.
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {(
                    [
                      { id: 'auto', label: 'SPLIT WIDE' },
                      { id: 'bottom', label: 'BOTTOM' },
                      { id: 'hidden', label: 'HIDE PAD' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectPadLayout(opt.id)}
                      className={`px-1.5 py-0.5 rounded-xs font-bold text-[8px] whitespace-nowrap cursor-pointer border ${
                        bindings.virtualPadLayout === opt.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {CONTROL_ACTION_DEFINITIONS.map((act) => {
                const [primaryCode, secondaryCode] = bindings.keyboard[act.key];
                const isCapPrimary =
                  kbCapture?.action === act.key && kbCapture.slotIndex === 0;
                const isCapSecondary =
                  kbCapture?.action === act.key && kbCapture.slotIndex === 1;

                return (
                  <div
                    key={act.key}
                    className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-300 text-[9.5px] whitespace-nowrap">
                          {act.badge}
                        </span>
                        <span className="font-bold text-slate-100 text-[9.5px] truncate">
                          {act.label}
                        </span>
                      </div>
                      <div className="text-[8px] text-slate-400 truncate">{act.detail}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 tabular-nums">
                      <button
                        type="button"
                        onClick={() => {
                          soundSystem.playSelect();
                          setGpCaptureAction(null);
                          setKbCapture(
                            isCapPrimary ? null : { action: act.key, slotIndex: 0 }
                          );
                        }}
                        className={`min-w-[66px] px-2 py-1 rounded-xs font-bold text-[9px] text-center whitespace-nowrap cursor-pointer border transition-colors ${
                          isCapPrimary
                            ? 'bg-amber-500 text-slate-950 border-amber-300'
                            : 'bg-slate-950 text-sky-300 border-slate-700 hover:border-sky-400'
                        }`}
                        title="Click to bind Primary Key"
                      >
                        {isCapPrimary ? 'PRESS KEY...' : formatKeyCodeLabel(primaryCode)}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundSystem.playSelect();
                          setGpCaptureAction(null);
                          setKbCapture(
                            isCapSecondary ? null : { action: act.key, slotIndex: 1 }
                          );
                        }}
                        className={`min-w-[66px] px-2 py-1 rounded-xs font-bold text-[9px] text-center whitespace-nowrap cursor-pointer border transition-colors ${
                          isCapSecondary
                            ? 'bg-amber-500 text-slate-950 border-amber-300'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-sky-400'
                        }`}
                        title="Click to bind Secondary Key"
                      >
                        {isCapSecondary ? 'PRESS KEY...' : formatKeyCodeLabel(secondaryCode)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GAMEPAD BINDINGS, STICK DEADZONE & RUMBLE */
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
              {/* Connected Controller & Analog Calibration Strip */}
              <div className="p-2 bg-slate-900/95 border border-slate-800 rounded-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[9px]">
                  <span className="font-bold text-sky-300">
                    CONTROLLER:{' '}
                    {activePads.length > 0
                      ? formatGamepadName(activePads[0]).toUpperCase()
                      : 'STANDARD W3C PROFILE (NO PAD DETECTED)'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const nextVib = !bindings.vibrationEnabled;
                        setGamepadVibrationEnabled(nextVib);
                        soundSystem.playSelect();
                        if (nextVib) {
                          hardwareGamepad.rumble(120, 0.6, 0.6);
                        }
                        triggerFeedback(
                          `CONTROLLER RUMBLE: ${nextVib ? 'ENABLED' : 'DISABLED'}`
                        );
                      }}
                      className={`px-2 py-0.5 rounded-xs font-bold text-[8.5px] whitespace-nowrap cursor-pointer border ${
                        bindings.vibrationEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      RUMBLE: {bindings.vibrationEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Stick Deadzone & Trigger Threshold Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[8.5px] tabular-nums">
                      <span className="text-slate-300 font-bold">THUMBSTICK DEADZONE</span>
                      <span className="text-amber-300 font-bold">
                        {Math.round(bindings.stickDeadzone * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.45"
                      step="0.01"
                      value={bindings.stickDeadzone}
                      onChange={(e) => {
                        setGamepadDeadzone(parseFloat(e.target.value));
                      }}
                      className="w-full accent-amber-400 h-1.5 bg-slate-950 rounded-xs cursor-pointer"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[8.5px] tabular-nums">
                      <span className="text-slate-300 font-bold">TRIGGER THRESHOLD (L2/R2)</span>
                      <span className="text-amber-300 font-bold">
                        {Math.round(bindings.triggerThreshold * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.85"
                      step="0.05"
                      value={bindings.triggerThreshold}
                      onChange={(e) => {
                        setGamepadTriggerThreshold(parseFloat(e.target.value));
                      }}
                      className="w-full accent-amber-400 h-1.5 bg-slate-950 rounded-xs cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Gamepad Button Mapping Rows */}
              <div className="space-y-1">
                {CONTROL_ACTION_DEFINITIONS.map((act) => {
                  const btnIdx = bindings.gamepad[act.key];
                  const isCapturing = gpCaptureAction === act.key;

                  return (
                    <div
                      key={act.key}
                      className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-300 text-[9.5px] whitespace-nowrap">
                            {act.badge}
                          </span>
                          <span className="font-bold text-slate-100 text-[9.5px] truncate">
                            {act.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 tabular-nums">
                        <button
                          type="button"
                          onClick={() => {
                            const prevIdx = (btnIdx + 15) % 16;
                            setGamepadBinding(act.key, prevIdx);
                            soundSystem.playMenuBeep();
                          }}
                          className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xs text-[8.5px] font-bold cursor-pointer"
                          title="Previous Button Index"
                        >
                          ◀
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundSystem.playSelect();
                            setKbCapture(null);
                            setGpCaptureAction(isCapturing ? null : act.key);
                          }}
                          className={`min-w-[132px] px-2 py-0.5 rounded-xs font-bold text-[8.5px] text-center whitespace-nowrap cursor-pointer border transition-colors ${
                            isCapturing
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : 'bg-slate-950 text-sky-300 border-slate-700 hover:border-sky-400'
                          }`}
                          title="Click then press any physical controller button"
                        >
                          {isCapturing
                            ? 'PRESS PAD BTN...'
                            : formatGamepadButtonLabel(btnIdx)}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const nextIdx = (btnIdx + 1) % 16;
                            setGamepadBinding(act.key, nextIdx);
                            soundSystem.playMenuBeep();
                          }}
                          className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xs text-[8.5px] font-bold cursor-pointer"
                          title="Next Button Index"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRAPHICS (Quality Presets + Real-Time Visual Toggles & Sliders) */}
      {activeTab === 'graphics' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Quality Presets Strip */}
          <div className="flex items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[8.5px] font-bold text-slate-400 mr-1">PRESET:</span>
              {(
                [
                  { id: 'low', label: 'LOW' },
                  { id: 'medium', label: 'MEDIUM' },
                  { id: 'high', label: 'HIGH' },
                  { id: 'retro', label: 'RETRO CRT' },
                ] as const
              ).map((p) => {
                const isSel = graphics.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`px-2 py-0.5 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer border transition-colors ${
                      isSel
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
              {graphics.preset === 'custom' && (
                <span className="text-[8.5px] font-bold text-amber-300 px-1.5 py-0.5">
                  · CUSTOM
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                resetOrionGraphicsSettings();
                if (activeState) {
                  activeState.useStandardResolutionHud = true;
                  notifyOrionStateChange();
                }
                triggerFeedback('GRAPHICS RESET TO HIGH PRESET');
              }}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              RESET HIGH
            </button>
          </div>

          {/* Single-Scroll Granular Visual Controls */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
            {/* 1. Dynamic Lighting & Darkness Scale */}
            <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-100 text-[9.5px]">
                    DYNAMIC LIGHTING & SHADOW OCCLUSION
                  </div>
                  <div className="text-[8px] text-slate-400">
                    Raycast line-of-sight shadow cones behind trees, walls, and gates
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    updateOrionGraphicsSettings({
                      dynamicLighting: !graphics.dynamicLighting,
                    });
                  }}
                  className={`px-2.5 py-0.5 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer border ${
                    graphics.dynamicLighting
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {graphics.dynamicLighting ? 'ENABLED' : 'OFF (FULL BRIGHT)'}
                </button>
              </div>

              {graphics.dynamicLighting && (
                <div className="space-y-0.5 pt-1 border-t border-slate-800/70">
                  <div className="flex items-center justify-between text-[8.5px] tabular-nums">
                    <span className="text-slate-300">AMBIENT ABYSS DARKNESS DEPTH</span>
                    <span className="text-amber-300 font-bold">
                      {Math.round(graphics.ambientDarknessScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="1.20"
                    step="0.05"
                    value={graphics.ambientDarknessScale}
                    onChange={(e) => {
                      updateOrionGraphicsSettings({
                        ambientDarknessScale: parseFloat(e.target.value),
                      });
                    }}
                    className="w-full accent-amber-400 h-1.5 bg-slate-950 rounded-xs cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* 2. Bloom & Radial Light Glow */}
            <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-100 text-[9.5px]">
                    EMBER & SPIRIT RADIAL BLOOM
                  </div>
                  <div className="text-[8px] text-slate-400">
                    Additive light halos on campfires, lanterns, reactors, and projectiles
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    updateOrionGraphicsSettings({
                      bloomEnabled: !graphics.bloomEnabled,
                    });
                  }}
                  className={`px-2.5 py-0.5 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer border ${
                    graphics.bloomEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {graphics.bloomEnabled ? 'ENABLED' : 'OFF'}
                </button>
              </div>

              {graphics.bloomEnabled && (
                <div className="space-y-0.5 pt-1 border-t border-slate-800/70">
                  <div className="flex items-center justify-between text-[8.5px] tabular-nums">
                    <span className="text-slate-300">BLOOM GLOW INTENSITY</span>
                    <span className="text-amber-300 font-bold">
                      {Math.round(graphics.bloomIntensity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="1.50"
                    step="0.05"
                    value={graphics.bloomIntensity}
                    onChange={(e) => {
                      updateOrionGraphicsSettings({
                        bloomIntensity: parseFloat(e.target.value),
                      });
                    }}
                    className="w-full accent-amber-400 h-1.5 bg-slate-950 rounded-xs cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* 3. Atmospheric Weather & Miasma Particles */}
            <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-100 text-[9.5px]">
                    WEATHER, MIASMA & SPORE PARTICLES
                  </div>
                  <div className="text-[8px] text-slate-400">
                    Biome rain, volcanic ash, Aether mist, and low-lying bog miasma wisps
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    updateOrionGraphicsSettings({
                      weatherEnabled: !graphics.weatherEnabled,
                    });
                  }}
                  className={`px-2.5 py-0.5 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer border ${
                    graphics.weatherEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {graphics.weatherEnabled ? 'ENABLED' : 'OFF'}
                </button>
              </div>

              {graphics.weatherEnabled && (
                <div className="space-y-0.5 pt-1 border-t border-slate-800/70">
                  <div className="flex items-center justify-between text-[8.5px] tabular-nums">
                    <span className="text-slate-300">PARTICLE DENSITY SCALE</span>
                    <span className="text-amber-300 font-bold">
                      {Math.round(graphics.weatherIntensityScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="1.50"
                    step="0.05"
                    value={graphics.weatherIntensityScale}
                    onChange={(e) => {
                      updateOrionGraphicsSettings({
                        weatherIntensityScale: parseFloat(e.target.value),
                      });
                    }}
                    className="w-full accent-amber-400 h-1.5 bg-slate-950 rounded-xs cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* 4. Screen Shake & Hit-Stop Impulse Slider */}
            <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs space-y-1">
              <div className="flex items-center justify-between text-[9px] tabular-nums">
                <div>
                  <span className="font-bold text-slate-100">
                    SCREEN SHAKE & DESYNC GLITCH INTENSITY
                  </span>
                  <div className="text-[8px] text-slate-400">
                    Camera impact impulse on heavy hits and Aether loop transitions
                  </div>
                </div>
                <span className="text-amber-300 font-bold">
                  {Math.round(graphics.screenShakeScale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.50"
                step="0.05"
                value={graphics.screenShakeScale}
                onChange={(e) => {
                  updateOrionGraphicsSettings({
                    screenShakeScale: parseFloat(e.target.value),
                  });
                }}
                className="w-full accent-amber-400 h-1.5 bg-slate-950 rounded-xs cursor-pointer"
              />
            </div>

            {/* 5. 2x2 Grid of Individual Feature Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-100 text-[9px]">WATER REFLECTIONS</div>
                  <div className="text-[7.5px] text-slate-400">Mirrored entity & ripple pass</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    updateOrionGraphicsSettings({
                      liquidReflections: !graphics.liquidReflections,
                    });
                  }}
                  className={`px-2 py-0.5 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer border ${
                    graphics.liquidReflections
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {graphics.liquidReflections ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-100 text-[9px]">WEAPON BLADE TRAILS</div>
                  <div className="text-[7.5px] text-slate-400">Sweeping slash & thrust arcs</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    updateOrionGraphicsSettings({
                      bladeTrails: !graphics.bladeTrails,
                    });
                  }}
                  className={`px-2 py-0.5 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer border ${
                    graphics.bladeTrails
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {graphics.bladeTrails ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-100 text-[9px]">1PX SPRITE OUTLINES</div>
                  <div className="text-[7.5px] text-slate-400">Tactical silhouette contrast</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    updateOrionGraphicsSettings({
                      outlinePass: !graphics.outlinePass,
                    });
                  }}
                  className={`px-2 py-0.5 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer border ${
                    graphics.outlinePass
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {graphics.outlinePass ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-100 text-[9px]">CRT SCANLINES</div>
                  <div className="text-[7.5px] text-slate-400">Retro raster line overlay</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleScanlinesUnified}
                  className={`px-2 py-0.5 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer border ${
                    effectiveScanlines
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {effectiveScanlines ? 'CRT ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIO & HUD (Synthesizer Audio, HUD Resolution, Fullscreen & Sandbox Mode) */}
      {activeTab === 'audio' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
          {/* Chiptune Audio Synthesizer */}
          <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-slate-100 text-[9.5px]">
                CHIPTUNE WEBAUDIO SYNTHESIZER
              </div>
              <div className="text-[8px] text-slate-400">
                Procedural retro sound effects for combat, boosters, and menu telemetry
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!soundSystem.isEnabled()) {
                    handleToggleSoundUnified();
                  }
                  soundSystem.playPowerup();
                }}
                className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-sky-300 border border-slate-700 rounded-xs font-bold text-[8.5px] whitespace-nowrap cursor-pointer"
              >
                TEST SFX
              </button>
              <button
                type="button"
                onClick={handleToggleSoundUnified}
                className={`px-2.5 py-1 rounded-xs font-bold text-[8.5px] whitespace-nowrap cursor-pointer border ${
                  effectiveSoundEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                }`}
              >
                {effectiveSoundEnabled ? 'AUDIO ON' : 'MUTED'}
              </button>
            </div>
          </div>

          {/* Cockpit HUD Resolution Mode */}
          <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-slate-100 text-[9.5px]">
                COCKPIT HUD TELEMETRY RESOLUTION
              </div>
              <div className="text-[8px] text-slate-400">
                Switch between crisp high-resolution React overlay HUD and native 160x144 pixel HUD
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleHudResolution}
              className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/60 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {(activeState?.useStandardResolutionHud ?? graphics.hudResolution === 'hires')
                ? 'HI-RES OVERLAY'
                : 'PIXEL CANVAS'}
            </button>
          </div>

          {/* Virtual Gamepad Ergonomic Layout Mode */}
          <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="font-bold text-slate-100 text-[9.5px]">
                VIRTUAL GAMEPAD SHELL LAYOUT
              </div>
              <div className="text-[8px] text-slate-400">
                Split D-Pad &amp; Action buttons to screen sides in landscape (PC &amp; mobile), stack below, or hide
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(
                [
                  { id: 'auto', label: 'AUTO SPLIT' },
                  { id: 'bottom', label: 'BOTTOM' },
                  { id: 'hidden', label: 'HIDDEN' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPadLayout(opt.id)}
                  className={`px-2 py-1 rounded-xs font-bold text-[8.5px] whitespace-nowrap cursor-pointer border ${
                    bindings.virtualPadLayout === opt.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fullscreen Display Mode */}
          <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xs flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-slate-100 text-[9.5px]">DISPLAY VIEWPORT MODE</div>
              <div className="text-[8px] text-slate-400">
                Expand handheld shell to full browser screen
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleFullscreenUnified}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {effectiveFullscreen ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN'}
            </button>
          </div>

          {/* Sandbox Tutorial State Toggle (when in Training Sandbox [-4,0] or Cheat Mode) */}
          {activeState &&
            (activeState.room === '-4,0' || Boolean(activeState.bypassProgressionGates)) && (
              <div className="p-2 bg-slate-900/90 border border-indigo-500/40 rounded-xs flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-indigo-300 text-[9.5px]">
                    SANDBOX TUTORIAL PROGRESSION LOCK
                  </div>
                  <div className="text-[8px] text-slate-400">
                    Toggle M00 Bog onboarding tutorial state vs. unlocked standard progression
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTutorialStateActive(activeState, !activeState.tutorialActive);
                    soundSystem.playSelect();
                    setTick((t) => t + 1);
                    triggerFeedback(
                      activeState.tutorialActive
                        ? 'TUTORIAL STATE: ACTIVE'
                        : 'STANDARD PROGRESSION UNLOCKED'
                    );
                  }}
                  className={`px-2.5 py-1 rounded-xs font-bold text-[8.5px] whitespace-nowrap shrink-0 cursor-pointer border ${
                    activeState.tutorialActive
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/60'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60'
                  }`}
                >
                  {activeState.tutorialActive ? 'TUTORIAL ACTIVE' : 'STANDARD UNLOCKED'}
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
