/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { initializeCartridges } from './cartridges';
import { getKnightState } from './cartridges/knight/stateStore';
import { VirtualGamepad } from './components/gamepad/VirtualGamepad';
import { ScreenViewport } from './components/screen/ScreenViewport';
import { ConsoleBezel } from './components/shell/ConsoleBezel';
import { DebugOverlay } from './components/shell/DebugOverlay';
import { InventoryModal } from './components/shell/InventoryModal';
import { KeyboardHelpModal } from './components/shell/KeyboardHelpModal';
import { cartridgeRunner } from './engine/core/cartridgeRunner';
import { frameLoop } from './engine/core/frameLoop';
import { registry } from './engine/core/registry';
import { shellStateMachine } from './engine/core/shellStateMachine';
import { soundSystem } from './engine/core/soundSystem';
import { inputReader } from './engine/input/inputReader';
import { keyboardMapper } from './engine/input/keyboardMapper';
import { ShellScreen } from './types/shell';

export default function App() {
  const [screen, setScreen] = useState<ShellScreen>('splash');
  const [activeCartridgeName, setActiveCartridgeName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [fps, setFps] = useState(60);

  // Sync inventory pause with knight game state
  useEffect(() => {
    const st = getKnightState();
    if (st) {
      st.inventoryOpen = showInventory;
    }
  }, [showInventory]);

  // Screen text display state
  const [screenContent, setScreenContent] = useState(() =>
    shellStateMachine.getScreenContent()
  );

  useEffect(() => {
    // 1. Initialize registered cartridges
    initializeCartridges();

    // 2. Attach desktop keyboard controls
    const cleanupKeyboard = keyboardMapper.init();

    // 3. Connect cartridge runner status callbacks
    cartridgeRunner.setOnQuit(() => {
      shellStateMachine.setScreen('carts');
      setActiveCartridgeName(undefined);
      setShowInventory(false);
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

    // 5. Start unified frame loop
    frameLoop.start((dtSeconds) => {
      try {
        const input = inputReader.read();

        // Check if player pressed START during knight gameplay to open/close inventory
        if (
          cartridgeRunner.getActive()?.id === 'knight' &&
          input.pressed.start &&
          !input.held.select
        ) {
          setShowInventory((prev) => !prev);
        }

        if (cartridgeRunner.getActive()) {
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
  }, []);

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
    <div className="w-screen h-screen flex flex-col bg-[#242420] text-[#1a1a1a] select-none touch-none overscroll-none overflow-hidden items-center justify-center p-0 sm:p-3">
      {/* Handheld Console Device Body */}
      <main
        id="game-container"
        className="w-full h-full sm:max-w-[420px] sm:max-h-[820px] sm:rounded-2xl flex flex-col bg-[#d0d0a8] shadow-2xl relative overflow-hidden border-0 sm:border-4 sm:border-[#9c9c7c]"
      >
        {/* Top Console Bezel Bar */}
        <ConsoleBezel
          soundEnabled={soundEnabled}
          scanlinesEnabled={scanlinesEnabled}
          onToggleSound={handleToggleSound}
          onToggleScanlines={handleToggleScanlines}
          onOpenDebug={() => setShowDebug(true)}
          onOpenHelp={() => setShowHelp(true)}
          onOpenInventory={() => setShowInventory((prev) => !prev)}
          activeCartName={activeCartridgeName}
          onQuitToMenu={() => {
            cartridgeRunner.stopCart();
            shellStateMachine.setScreen('carts');
            setShowInventory(false);
          }}
        />

        {/* Middle: Screen Viewport */}
        <ScreenViewport
          isCartridgeRunning={isCartRunning}
          isLoading={isLoading}
          title={screenContent.title}
          lines={screenContent.lines}
          selectedIndex={screenContent.selectedIndex}
          onLineClick={handleLineClick}
          showScanlines={scanlinesEnabled}
        />

        {/* Bottom: Virtual Gamepad (D-Pad, Action Buttons, Pill Buttons) */}
        <VirtualGamepad />
      </main>

      {/* Full Inventory Modal */}
      {showInventory && (
        <InventoryModal onClose={() => setShowInventory(false)} />
      )}

      {/* Debug Inspector Modal */}
      {showDebug && (
        <DebugOverlay fps={fps} onClose={() => setShowDebug(false)} />
      )}

      {/* Keyboard Controls Help Modal */}
      {showHelp && (
        <KeyboardHelpModal onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
