/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { initializeCartridges } from './cartridges';
import { VirtualGamepad } from './components/gamepad/VirtualGamepad';
import { ScreenViewport } from './components/screen/ScreenViewport';
import { DebugOverlay } from './components/shell/DebugOverlay';
import { cartridgeRunner } from './engine/core/cartridgeRunner';
import { frameLoop } from './engine/core/frameLoop';
import { registry } from './engine/core/registry';
import { shellStateMachine } from './engine/core/shellStateMachine';
import { soundSystem } from './engine/core/soundSystem';
import { inputReader } from './engine/input/inputReader';
import { keyboardMapper } from './engine/input/keyboardMapper';
import {
  formatGamepadName,
  hardwareGamepad,
} from './engine/input/hardwareGamepad';
import { ShellScreen } from './types/shell';
import { CartridgeMenuMode } from './types/cartridge';
import {
  isAppFullscreen,
  requestAppFullscreen,
  subscribeFullscreenChange,
  toggleAppFullscreen,
} from './utils/fullscreen';

export default function App() {
  const [screen, setScreen] = useState<ShellScreen>('splash');
  const [activeCartridgeName, setActiveCartridgeName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [fps, setFps] = useState(60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectedGamepads, setConnectedGamepads] = useState<string[]>(() =>
    hardwareGamepad.getConnectedNames()
  );
  const [gamepadToast, setGamepadToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // In-game menus contained directly inside LCD screen
  const [inGameMenu, setInGameMenu] = useState<CartridgeMenuMode>('none');
  const inGameMenuRef = useRef<CartridgeMenuMode>('none');

  const updateInGameMenu = (menu: CartridgeMenuMode) => {
    inGameMenuRef.current = menu;
    setInGameMenu(menu);
    const active = cartridgeRunner.getActive();
    if (active?.onMenuToggle) {
      active.onMenuToggle(menu);
    }
  };

  // Screen text display state
  const [screenContent, setScreenContent] = useState(() =>
    shellStateMachine.getScreenContent()
  );

  // Sync fullscreen state
  useEffect(() => {
    setIsFullscreen(isAppFullscreen());
    return subscribeFullscreenChange((fs) => {
      setIsFullscreen(fs);
    });
  }, []);

  // Listen to physical hardware gamepad connections and display retro toasts
  useEffect(() => {
    return hardwareGamepad.subscribe((notif) => {
      setConnectedGamepads(hardwareGamepad.getConnectedNames());
      const formatted = formatGamepadName(notif.name);
      const text =
        notif.type === 'connected'
          ? `🎮 ${formatted.toUpperCase()} CONNECTED`
          : `🎮 ${formatted.toUpperCase()} DISCONNECTED`;

      setGamepadToast(text);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setGamepadToast(null);
      }, 3000);
    });
  }, []);

  // On mobile browsers, attempt fullscreen on first user touch gesture; ensure window focus for gamepad API
  useEffect(() => {
    const handleInitialTouch = () => {
      if (typeof window !== 'undefined') {
        window.focus();
      }
      if (
        !isAppFullscreen() &&
        typeof navigator !== 'undefined' &&
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      ) {
        requestAppFullscreen().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', handleInitialTouch);
    return () => {
      window.removeEventListener('pointerdown', handleInitialTouch);
    };
  }, []);

  useEffect(() => {
    // 1. Initialize registered cartridges
    initializeCartridges();

    // 2. Attach desktop keyboard controls
    const cleanupKeyboard = keyboardMapper.init();

    // 3. Connect cartridge runner status callbacks
    cartridgeRunner.setOnQuit(() => {
      shellStateMachine.setScreen('carts');
      setActiveCartridgeName(undefined);
      updateInGameMenu('none');
    });

    cartridgeRunner.setOnStatusChange(() => {
      const active = cartridgeRunner.getActive();
      setActiveCartridgeName(active ? active.name : undefined);
      setIsLoading(cartridgeRunner.getIsLoading());
    });

    // 4. Connect shell screen change callback
    shellStateMachine.setOnScreenChange(() => {
      setScreen(shellStateMachine.getScreen());
      setScreenContent(shellStateMachine.getScreenContent());
    });

    // 5. Start unified frame loop (Lifecycle runs continuously without tearing down on menu open/close)
    frameLoop.start((dtSeconds) => {
      try {
        const input = inputReader.read();
        const isCartActive = Boolean(cartridgeRunner.getActive());

        // Handle in-game system buttons:
        // START -> Game Menu (settings, options, save, exit)
        // SHIFT (Select) -> Inventory / Character Screen
        if (isCartActive) {
          const currentMenu = inGameMenuRef.current;

          // Emergency escape hatch: hold START + SHIFT together
          if (
            input.held.start &&
            input.held.select &&
            (input.pressed.start || input.pressed.select)
          ) {
            cartridgeRunner.stopCart();
            shellStateMachine.setScreen('carts');
            updateInGameMenu('none');
            return;
          }

          // START button: Game Menu
          if (input.pressed.start && !input.held.select) {
            if (currentMenu === 'game-menu') {
              updateInGameMenu('none');
            } else {
              updateInGameMenu('game-menu');
            }
          }

          // SHIFT (Select) button: Inventory / Character screen
          if (input.pressed.select && !input.held.start) {
            if (currentMenu === 'inventory') {
              updateInGameMenu('none');
            } else {
              updateInGameMenu('inventory');
            }
          }

          // B button while menu is open: Close and resume game
          if (input.pressed.b && currentMenu !== 'none') {
            updateInGameMenu('none');
          }
        }

        // Step active cartridge or shell state machine
        if (isCartActive) {
          cartridgeRunner.step(input, dtSeconds);
        } else {
          shellStateMachine.step(input, dtSeconds);
          setScreenContent(shellStateMachine.getScreenContent(input));
        }

        setFps(frameLoop.getFps());
      } catch (err) {
        registry.logError(`LOOP: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    return () => {
      cleanupKeyboard();
      frameLoop.stop();
      cartridgeRunner.stopCart();
    };
  }, []); // Run ONCE on mount; never tear down on menu toggle!

  const handleToggleSound = () => {
    const updated = soundSystem.toggle();
    setSoundEnabled(updated);
  };

  const handleToggleScanlines = () => {
    setScanlinesEnabled((prev) => !prev);
  };

  const handleLineClick = (index: number) => {
    if (screen === 'menu') {
      shellStateMachine.setMenuIndex(index);
      shellStateMachine.selectCurrentMenuItem();
    } else if (screen === 'carts') {
      shellStateMachine.setCartIndex(index);
      shellStateMachine.launchCartridgeAtIndex(index);
    }
  };

  const isCartRunning = Boolean(activeCartridgeName);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] flex flex-col bg-[#242420] text-[#1a1a1a] select-none touch-none overscroll-none overflow-hidden items-center justify-center p-0 m-0"
      style={{
        height: '100dvh',
      }}
    >
      {/* Handheld Console Device Body: Clean Authentic Layout (Screen on Top, Gamepad on Bottom) */}
      <main
        id="game-container"
        className="w-full h-full max-w-[560px] flex flex-col bg-[#d0d0a8] relative overflow-hidden select-none touch-none justify-between"
      >
        {/* Top: LCD Screen Viewport (takes all flexible vertical height; contains in-game menus inside) */}
        <ScreenViewport
          isCartridgeRunning={isCartRunning}
          isLoading={isLoading}
          title={screenContent.title}
          lines={screenContent.lines}
          selectedIndex={screenContent.selectedIndex}
          onLineClick={handleLineClick}
          showScanlines={scanlinesEnabled}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => toggleAppFullscreen()}
          connectedGamepads={connectedGamepads}
          gamepadToast={gamepadToast}
        >
          {/* Active Cartridge In-Game Overlay via Cartridge Interface */}
          {isCartRunning && inGameMenu !== 'none' && (() => {
            const active = cartridgeRunner.getActive();
            if (active?.renderOverlay) {
              return active.renderOverlay({
                menuMode: inGameMenu,
                soundEnabled,
                scanlinesEnabled,
                isFullscreen,
                onToggleSound: handleToggleSound,
                onToggleScanlines: handleToggleScanlines,
                onToggleFullscreen: () => toggleAppFullscreen(),
                onResume: () => updateInGameMenu('none'),
                onExitCartridge: () => {
                  cartridgeRunner.stopCart();
                  shellStateMachine.setScreen('carts');
                  updateInGameMenu('none');
                },
                connectedGamepads,
              });
            }
            return null;
          })()}
        </ScreenViewport>

        {/* Bottom: Virtual Gamepad (D-Pad, Action Buttons, START & SHIFT Pills) - Dynamically Scaled */}
        <VirtualGamepad />
      </main>

      {/* Optional Debug Inspector Modal */}
      {showDebug && (
        <DebugOverlay fps={fps} onClose={() => setShowDebug(false)} />
      )}
    </div>
  );
}
