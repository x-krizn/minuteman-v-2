/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { initializeCartridges } from './cartridges';
import {
  getOrionGraphicsSettings,
  subscribeOrionGraphicsSettings,
  updateOrionGraphicsSettings,
} from './cartridges/orion/systems/graphicsSettingsStore';
import { VirtualGamepad } from './components/gamepad/VirtualGamepad';
import { ScreenViewport } from './components/screen/ScreenViewport';
import { cartridgeRunner } from './engine/core/cartridgeRunner';
import { frameLoop } from './engine/core/frameLoop';
import { registry } from './engine/core/registry';
import { shellStateMachine } from './engine/core/shellStateMachine';
import { soundSystem } from './engine/core/soundSystem';
import {
  formatGamepadName,
  hardwareGamepad,
} from './engine/input/hardwareGamepad';
import {
  getControlBindings,
  setVirtualGamepadLayout,
  subscribeControlBindings,
  VirtualGamepadLayoutMode,
} from './engine/input/inputBindingsStore';
import { inputReader } from './engine/input/inputReader';
import { keyboardMapper } from './engine/input/keyboardMapper';
import { universalMenuNavigator } from './engine/input/menuNavigation';
import { CartridgeMenuMode } from './types/cartridge';
import { ShellScreen } from './types/shell';
import {
  isAppFullscreen,
  requestAppFullscreen,
  subscribeFullscreenChange,
  toggleAppFullscreen,
} from './utils/fullscreen';

type EffectivePadMode = 'split' | 'bottom' | 'hidden';

function resolveEffectivePadMode(
  preference: VirtualGamepadLayoutMode,
  vw: number,
  vh: number
): EffectivePadMode {
  if (preference === 'hidden') return 'hidden';
  if (preference === 'bottom') return 'bottom';
  // Auto: split controls onto left and right sides in landscape viewports on both PC and mobile
  if (vw > vh && vw >= 580 && vh >= 280) {
    return 'split';
  }
  return 'bottom';
}

/**
 * Root React application component mounting the handheld console shell, `ScreenViewport` (`160x144` `px`), and responsive `VirtualGamepad`.
 */
export default function App() {
  const [screen, setScreen] = useState<ShellScreen>('splash');
  const [activeCartridgeName, setActiveCartridgeName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(
    () => getOrionGraphicsSettings().scanlinesEnabled
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectedGamepads, setConnectedGamepads] = useState<string[]>(() =>
    hardwareGamepad.getConnectedNames()
  );
  const [gamepadToast, setGamepadToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [virtualPadLayout, setVirtualPadLayoutState] = useState<VirtualGamepadLayoutMode>(
    () => getControlBindings().virtualPadLayout
  );
  const [viewportSize, setViewportSize] = useState<{ vw: number; vh: number }>(() => ({
    vw: typeof window !== 'undefined' ? window.innerWidth : 800,
    vh: typeof window !== 'undefined' ? window.innerHeight : 600,
  }));

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

  // Sync fullscreen state, graphics scanlines state, virtual pad preference, and viewport size
  useEffect(() => {
    setIsFullscreen(isAppFullscreen());
    const unsubFs = subscribeFullscreenChange((fs) => {
      setIsFullscreen(fs);
    });
    const unsubGfx = subscribeOrionGraphicsSettings((gfx) => {
      setScanlinesEnabled(gfx.scanlinesEnabled);
    });
    const unsubBindings = subscribeControlBindings(() => {
      setVirtualPadLayoutState(getControlBindings().virtualPadLayout);
    });

    const handleResize = () => {
      setViewportSize({
        vw: window.innerWidth,
        vh: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      unsubFs();
      unsubGfx();
      unsubBindings();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
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
          const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
          const activeTag = activeEl?.tagName;
          const activeInputType =
            activeEl instanceof HTMLInputElement ? (activeEl.type || 'text').toLowerCase() : '';
          const isTypingInInput =
            activeTag === 'TEXTAREA' ||
            (activeTag === 'INPUT' &&
              ['text', 'search', 'password', 'email', 'url', 'tel', 'number'].includes(
                activeInputType
              ));
          const isTitleModalOpen =
            typeof document !== 'undefined' &&
            Boolean(document.querySelector('[aria-label="Project Orion Main Menu"]'));
          let menuConsumedInput = false;

          // Emergency escape hatch: hold START + SHIFT together
          if (
            !isTypingInInput &&
            input.held.start &&
            input.held.select &&
            (input.pressed.start || input.pressed.select)
          ) {
            cartridgeRunner.stopCart();
            shellStateMachine.setScreen('carts');
            updateInGameMenu('none');
            return;
          }

          if (isTitleModalOpen) {
            // While on the Title Menu, never open the in-game pause/satchel overlay on START/SELECT.
            // Pressing START acts as Confirm [A] on the Title Menu.
            if (currentMenu !== 'none') {
              updateInGameMenu('none');
            }
            if (!isTypingInInput && input.pressed.start && !input.held.select) {
              input.pressed.a = true;
              input.pressed.start = false;
            }
            if (!isTypingInInput && input.pressed.select && !input.held.start) {
              input.pressed.select = false;
            }
          } else {
            // START button: Game Menu
            if (!isTypingInInput && input.pressed.start && !input.held.select) {
              menuConsumedInput = true;
              if (currentMenu === 'game-menu') {
                updateInGameMenu('none');
              } else {
                updateInGameMenu('game-menu');
              }
            }

            // SHIFT (Select) button: Inventory / Character screen
            if (!isTypingInInput && input.pressed.select && !input.held.start) {
              menuConsumedInput = true;
              if (currentMenu === 'inventory') {
                updateInGameMenu('none');
              } else {
                updateInGameMenu('inventory');
              }
            }
          }

          // Step universal menu navigator for any active menu overlay (Satchel, Start Menu, Title Menu, World Map Modal)
          let menuNavResult = {
            isMenuActive: false,
            handledInput: false,
            shouldCloseRootMenu: false,
          };
          try {
            menuNavResult = universalMenuNavigator.step(input, dtSeconds);
          } catch (navErr) {
            registry.logError(
              `MENU_NAV: ${navErr instanceof Error ? navErr.message : String(navErr)}`
            );
          }

          // B button while in-game menu is open: Close root menu only if [B] did not step back from a nested subview
          if (
            !isTypingInInput &&
            currentMenu !== 'none' &&
            (menuNavResult.shouldCloseRootMenu || (!menuNavResult.isMenuActive && input.pressed.b))
          ) {
            menuConsumedInput = true;
            updateInGameMenu('none');
          } else if (menuNavResult.isMenuActive && menuNavResult.handledInput) {
            menuConsumedInput = true;
          }

          if (menuConsumedInput || menuNavResult.isMenuActive) {
            input.pressed.a = false;
            input.pressed.b = false;
            input.pressed.x = false;
            input.pressed.y = false;
            input.pressed.l = false;
            input.pressed.r = false;
            input.pressed.up = false;
            input.pressed.down = false;
            input.pressed.left = false;
            input.pressed.right = false;
            input.held.up = false;
            input.held.down = false;
            input.held.left = false;
            input.held.right = false;
            input.held.a = false;
            input.held.b = false;
            input.held.x = false;
            input.held.y = false;
            input.held.l = false;
            input.held.r = false;
            input.pressed.start = false;
            input.pressed.select = false;
          }
        }

        // Step active cartridge or shell state machine
        if (isCartActive) {
          cartridgeRunner.step(input, dtSeconds);
        } else {
          shellStateMachine.step(input, dtSeconds);
          setScreenContent(shellStateMachine.getScreenContent(input));
        }
      } catch (err) {
        registry.logError(`LOOP: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    return () => {
      cleanupKeyboard();
      universalMenuNavigator.dispose();
      frameLoop.stop();
      cartridgeRunner.stopCart();
    };
  }, []); // Run ONCE on mount; never tear down on menu toggle!

  const handleToggleSound = () => {
    const updated = soundSystem.toggle();
    setSoundEnabled(updated);
  };

  const handleToggleScanlines = () => {
    const next = !getOrionGraphicsSettings().scanlinesEnabled;
    updateOrionGraphicsSettings({ scanlinesEnabled: next });
    setScanlinesEnabled(next);
  };

  const handleCyclePadLayout = () => {
    const order: VirtualGamepadLayoutMode[] = ['auto', 'bottom', 'hidden'];
    const next = order[(order.indexOf(virtualPadLayout) + 1) % order.length];
    setVirtualGamepadLayout(next);
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
  const effectivePadMode = resolveEffectivePadMode(
    virtualPadLayout,
    viewportSize.vw,
    viewportSize.vh
  );

  const containerClass =
    effectivePadMode === 'split'
      ? 'w-full h-full max-w-[1440px] flex flex-row bg-[#d0d0a8] relative overflow-hidden select-none touch-none items-stretch justify-between'
      : effectivePadMode === 'hidden'
        ? 'w-full h-full max-w-[960px] flex flex-col bg-[#242420] relative overflow-hidden select-none touch-none justify-center'
        : 'w-full h-full max-w-[560px] flex flex-col bg-[#d0d0a8] relative overflow-hidden select-none touch-none justify-between';

  const screenNode = (
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
      padLayoutMode={virtualPadLayout}
      onCyclePadLayout={handleCyclePadLayout}
      expandedLayout={effectivePadMode !== 'bottom'}
      connectedGamepads={connectedGamepads}
      gamepadToast={gamepadToast}
    >
      {/* Active Cartridge In-Game Overlay via Cartridge Interface */}
      {isCartRunning &&
        (() => {
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
  );

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] flex flex-col bg-[#242420] text-[#1a1a1a] select-none touch-none overscroll-none overflow-hidden items-center justify-center p-0 m-0"
      style={{
        height: '100dvh',
      }}
    >
      <main id="game-container" className={containerClass}>
        {effectivePadMode === 'split' ? (
          <>
            <VirtualGamepad wing="left" />
            {screenNode}
            <VirtualGamepad wing="right" />
          </>
        ) : (
          <>
            {screenNode}
            {effectivePadMode === 'bottom' && <VirtualGamepad wing="full" />}
          </>
        )}
      </main>
    </div>
  );
}
