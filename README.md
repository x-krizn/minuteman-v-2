# Minuteman: Modular Virtual Handheld Console & Metroid-Souls Engine

An ultra-responsive retro handheld virtual console featuring decoupled engine systems, authentic tactile virtual controls, and a complete hybrid **Metroid-Souls** action slice with fighting-game-grade combat.

---

## 🎮 Combat Controls

| Button | Touch / Pad | Keyboard Key | Action & Fighting Game Details |
| :--- | :--- | :--- | :--- |
| **Move** | D-Pad Stick | `WASD` / `Arrow Keys` | Analog/digital 8-way navigation, crouching, and aiming. |
| **A** | Face Button A | `Z` / `Space` | **Jump**: Tap for short hops, hold for full height. Double-jump in air once unlocked. |
| **B** | Face Button B | `X` / `Shift` | **Dash / Sprint**: Tap for invulnerable dash burst (1 SP). Hold while moving to sprint at 1.5× speed. |
| **X** | Face Button X | `C` / `J` | **Attack / Charge**: Neutral stab, Forward step slash, Overhead anti-air (`Up+X`), and Downward low poke (`Down+X`). Hold to charge for heavy guard-breaking cleave. In air: Pogo bounce off enemies with `Down+X`! |
| **Y** | Face Button Y | `V` / `K` | **Block / Timed Parry**: Tap right before an attack to **Parry** (1.0s stagger stun, zero damage). Hold to Guard with stamina chip. |
| **L** | Left Trigger | `Q` / `U` | **Slot 1 Skill/Item**: Consumes its respective resource pool (e.g., Flask charges for healing). |
| **R** | Right Trigger | `E` / `I` | **Slot 2 Skill/Item**: Consumes its respective resource pool (e.g., Energy for Firebolt). |
| **START** | Pill Button | `Enter` | **Game Menu**: Pauses game and opens menu offering Settings (Audio, CRT), Save Game, Load Game, Checkpoint, and Exit. |
| **SHIFT** | Pill Button | `Tab` / `Backspace` | **Satchel / Inventory**: Opens equipment screen (assign L & R slots), character attributes, and Wandering Merchant. |

---

## 🎒 Modular Architecture

The engine has been decoupled into single-responsibility, performant modules:

```text
src/
├── types/
│   ├── input.ts              # Controller state, stick vectors, edge detection
│   ├── cartridge.ts          # Cartridge contract, surface, and sprite strip specs
│   ├── shell.ts              # System shell screens and menus
│   └── knight.ts             # Metroid-Souls state, entity, and combat types
├── engine/
│   ├── input/
│   │   ├── gamepadStore.ts   # Normalized analog stick math & digital thresholds
│   │   ├── inputReader.ts    # Frame edge transitions (held, pressed)
│   │   ├── keyboardMapper.ts # Desktop keyboard event synchronization
│   │   └── haptics.ts        # Mobile haptic feedback wrapper
│   └── core/
│       ├── assetLoader.ts    # High-performance sprite sheet slicing & caching
│       ├── registry.ts       # Cartridge registry and error log
│       ├── cartridgeRunner.ts# Lifecycle manager, isolation, and START+SELECT exit
│       ├── frameLoop.ts      # RAF animation loop with delta-time clamping & FPS
│       ├── soundSystem.ts    # 8-bit Web Audio chiptune synthesizer
│       └── shellStateMachine.ts # Console OS state machine (splash, menu, how-to, debug)
├── cartridges/
│   ├── templateCartridge.ts  # Minimal analog stick test cartridge
│   ├── walkTestCartridge.ts  # 3-frame animated knight walking cartridge
│   ├── knight/               # The Metroid-Souls game slice
│   │   ├── constants.ts      # Physics, dimensions, tile sizes, sword data
│   │   ├── levels.ts         # Tutorial rooms and safe room definitions
│   │   ├── proceduralFloor.ts# DFS procedural maze floor generator with shafts
│   │   ├── physics.ts        # Collision grid detection and sub-pixel stepping
│   │   ├── combat.ts         # Fighting game combat: Directionals, pogo, parry, charge
│   │   ├── skills.ts         # Assignable skills, spells, and projectile systems
│   │   ├── stateStore.ts     # Inventory state & wandering merchant store
│   │   ├── enemies.ts        # Patrol crawlers, shield sentries, and flying wisps
│   │   ├── pickups.ts        # Coins, keys, flask charges, and stat gems
│   │   ├── renderer.ts       # Pixelated layered renderer, HUD, and damage numbers
│   │   └── knightCartridge.ts# Unified Cartridge implementation
│   └── index.ts              # Cartridge registration bootstrap
└── components/
    ├── gamepad/              # Virtual D-Pad, tactile action buttons, pill buttons
    ├── screen/               # Integer-scaled canvas, retro green LCD viewport, CRT scanlines
    └── shell/                # Console bezel, inventory modal, and debugger overlay
```

---

## 🚀 GitHub Pages Deployment

This repository includes an automated GitHub Actions workflow (`.github/workflows/deploy.yml`).

### Setup in 2 steps:
1. Push this codebase to your GitHub repository on `main` or `master`.
2. In your GitHub repository:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, change the dropdown from *"Deploy from a branch"* to **"GitHub Actions"**.

### Troubleshooting Common GitHub Actions Failures:
1. **"Deployment failed with status 404" or "Resource not accessible by integration"**:
   - Go to **Settings** > **Pages** and confirm that **Source** is set to **"GitHub Actions"** (NOT *"Deploy from a branch"*).
   - Go to **Settings** > **Actions** > **General** > scroll down to **Workflow permissions** > select **"Read and write permissions"** and click Save.
2. **"Dependencies lock file is not found" or "ERESOLVE could not resolve dependency"**:
   - Resolved! A generated `package-lock.json` and `.npmrc` with `legacy-peer-deps=true` are now included in the repository.
   - The workflow runs `npm install --legacy-peer-deps` to ensure reliable builds across all Node environments.

GitHub Actions will automatically run the build and host your game at:
```
https://<username>.github.io/<repository-name>/
```

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build production bundle
npm run build
```
