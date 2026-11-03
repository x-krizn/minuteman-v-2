# Fix Blank/Black Screen After Title Menu & Load Game

Resolves the pitch-black game screen reported on PC and handheld viewports when starting a New Game or loading a saved pilot after the universal menu input update.

## User Review & Critical Decisions

> [!IMPORTANT]
> Root-cause analysis identified **three compounding issues** introduced across the universal menu navigation update and the Sunken Bog lighting/chunk renderer:
> 1. **Frame-Loop Draw Halt While Menu Overlays Are Active (`App.tsx`)**: When `universalMenuNavigator` was added to `App.tsx`, line 201 suppressed `input` whenever `menuNavResult.isMenuActive` was true (which includes `HudTitleModal` on the Title Screen because it carries `data-universal-menu="true"`), and prevented `cartridgeRunner.step` / `drawOrionGame` from advancing properly or caused the canvas to remain unrendered while transitioning out of the Title Menu.
> 2. **Darkness Pass & Shadow Cone Over-Occlusion (`effectsRenderer.ts`)**: In `drawDynamicLightingAndBloomPass`, Pass 2 fills an offscreen buffer with `98.5%` opaque abyssal black (`rgba(2, 5, 11, 0.985)`), punches out the player's light pool with `destination-out`, and then Pass 3 (`projectSoftOccluderShadowCones`) switches back to `source-over` and draws wide 3-lobe shadow cones (`spread: 1.42`) from every surrounding wall (`#`) and tree (`P`) tile—painting opaque black back over the player's light pool and inner core. Additionally, Pass 1's `multiply` composite pass and `destination-out` alpha stops can fail to clear on certain desktop GPU canvas contexts when offscreen buffers are reused without resetting composite state.
> 3. **Unpopulated Expanse Grid on First Frame (`playerSystem.ts`)**: When `createNewPilotGame` or `loadPilotFromRoster` sets `state.room = '-3,-1'`, `rooms['-3,-1']` starts as `260×162` solid `#` wall tiles until `updateChunkedRoomStreaming` runs. If a draw frame occurs before chunk streaming populates the `3×3` neighborhood around `(cx=3, cy=9)`, every tile around the player is `#` (opaque wall), causing 100% shadow occlusion across the entire viewport.

- **Confirmed Decision 1**: Ensure `cartridgeRunner.step` and `cart.draw` execute every frame even when overlays are open or closing, and prevent `App.tsx` from swallowing cartridge ticks or leaving stale DOM focus when transitioning out of `HudTitleModal`.
- **Confirmed Decision 2**: Fix `drawDynamicLightingAndBloomPass` and `projectSoftOccluderShadowCones` so obstacle shadows never overwrite the player's personal light core, and re-punch the warm inner core after shadow projection so the player mech and immediate surroundings are always clearly visible.
- **Confirmed Decision 3**: Synchronously invoke `updateChunkedRoomStreaming(roomsRef, state, true)` inside `createNewPilotGame`, `loadPilotFromRoster`, and `loadOrionGame` so the `260×162` Unified Bog grid is guaranteed populated before the very first render frame.

---

## 1. Overview & Core Concept

- **What It Does**: Restores immediate, reliable world rendering on PC and mobile when launching a New Game, continuing, or loading a pilot from the Title Menu or Start Menu.
- **Target Audience / Persona**: Players starting or loading an expedition in Project Orion using keyboard, gamepad, mouse, or touch controls.
- **Key Value**: Eliminates the black-screen lockup while preserving atmospheric bog lighting, directional tree/wall shadows, and universal controller/keyboard menu navigation.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Boot & Title Screen**: Player navigates `New` or `Load` via keyboard (`WASD`/Arrows + `J`/`Enter`), gamepad, or mouse click.
  2. **Deploy / Load Transition**: Selecting `DEPLOY LV.1 (THE BOG)` or `LOAD [A]` immediately closes `HudTitleModal`, clears any residual menu focus highlight, populates the Drop-Pod Awakening Hollow (`[-3,0]` on the Unified Bog Grid), centers the camera on the player mech, and renders the lit sanctuary hollow.
  3. **Sanctuary & Bog Visibility**: The player mech, surrounding bog water, moss tiles, downed trees, and terrain details are crisply illuminated within the player's Light radius (`5.0` tiles baseline), with soft rear shadow wedges cast behind trees and walls without blacking out the screen.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Decouple Menu Input Consumption from Canvas Rendering (`App.tsx`)**
  - *Chosen Approach*: When `inGameMenu !== 'none'` (`OrionSatchel` or `OrionGameMenu`), consume gameplay button presses so the player doesn't attack while in menus, but still allow `cartridgeRunner.draw` to keep the canvas live. When `inGameMenu === 'none'` and an in-cartridge modal (`HudTitleModal` or `WorldMapModal`) is active, let `universalMenuNavigator` drive focus/clicks without blocking `cartridgeRunner.step` from rendering the scene and advancing timers.
  - *Why*: Guarantees the `<canvas id="screen-canvas">` is continuously painted and never gets stuck on an unrendered black buffer after menu dismissal.

- **Decision 2: Protected Player Light Core & Safe Offscreen Composite Blending (`effectsRenderer.ts`)**
  - *Chosen Approach*:
    - Lower Sanctuary baseline ambient darkness so starting areas (`-3,0` Awakening Hollow and `0,0` Campfire) have readable ambient twilight (`0.72` max darkness in sanctuary, `0.86` on set-path trail) instead of `0.985` pitch black.
    - Narrow shadow cone angular spread (`occRadius` and `lobes`) and start shadows strictly behind the obstacle's back edge (`dist + 6px`).
    - Re-punch the player's inner sanctuary light core (`destination-out`) *after* `projectSoftOccluderShadowCones` so overlapping wall/tree shadow cones can never paint black over the player or their immediate tile neighborhood.
  - *Why*: Prevents dense wall/tree clusters or chunk borders from compounding `source-over` shadow cones into a 360-degree black sheet over the viewport.

- **Decision 3: Synchronous Chunk Hydration on New/Load (`playerSystem.ts` & `orionCartridge.ts`)**
  - *Chosen Approach*: Call `updateChunkedRoomStreaming(roomsRef, state, true)` and reset camera coordinates (`state.camX = undefined; state.camY = undefined`) immediately inside `createNewPilotGame`, `loadPilotFromRoster`, `loadOrionGame`, and `orionCartridge.init`.
  - *Why*: Ensures `rooms['-3,-1']` has its `3×3` active chunk window stamped with the Awakening Hollow tiles before the first `drawOrionGame` call executes.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Frame Loop (App.tsx)                             │
│  1. Read GameInput (Keyboard + Hardware Gamepad + Virtual Gamepad)       │
│  2. Step UniversalMenuNavigator (DOM Focus + [A] Click + [B] Back)       │
│  3. If Menu Handled Input -> Clear Gameplay Action Presses               │
│  4. Step CartridgeRunner -> cart.update() + cart.draw() (Always Draws)   │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                 New Game / Load Game (playerSystem.ts)                   │
│  1. Initialize or Hydrate OrionState (room = '-3,-1', x = 632, y = 1432) │
│  2. Reset Camera (camX = undefined, camY = undefined)                    │
│  3. Synchronously Run updateChunkedRoomStreaming(rooms, state, true)     │
│     -> Stamps [-3,0] Awakening Hollow 20x18 Block into 260x162 Grid      │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│               2.5D Renderer & Lighting Pass (effectsRenderer.ts)         │
│  1. Render Layer 0/1 Terrain, Water Reflections, Layer 2 Mech & Entities │
│  2. Pass 1: Subtle Cold Penumbra Grading (source-over tint buffer)       │
│  3. Pass 2: Darkness Buffer (destination-out multi-stop light pools)     │
│  4. Pass 3: Soft Rear Shadow Cones + Re-Punch Protected Player Core      │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - `UniversalMenuNavigator.step`: Blurs any active `<input>` and clears `[data-gamepad-focus]` immediately when `[data-universal-menu="true"]` unmounts on game launch.
  - `CartridgeRunner.step`: Separates menu-paused update skipping from canvas drawing so `cart.draw(this.surface)` always keeps the LCD viewport painted.
  - `createNewPilotGame` / `loadPilotFromRoster`: Synchronously stamps chunks `cx=2..4, cy=8..10` and snaps camera to the player's starting coordinates.
