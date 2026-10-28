# Orion Magic-Current Glide Animation & Codebase Grooming

Upgrade Orion mech locomotion from a static or walking-style loop to an authentic **Magic-Current Glide Animation State Machine**, paired with weight-scaled stopping recovery, an interactive Satchel preview cycle, and a comprehensive organization and cleanup pass for commit preparation.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and gameplay decisions incorporate your confirmed preferences from the clarification step and are ready for execution upon approval:

- **Confirmed Decision 1 — Weight-Scaled Stopping Inertia & Recovery**: When directional input stops, both the visual wind-down frame timing (`Frame 3 → Frame 2 → Frame 1`) and a brief physical stopping deceleration/inertia scale proportionally with total equipped frame + weapon weight. Light frames settle crisply, while heavy bastion frames exhibit palpable momentum and longer recovery steps before returning to idle.
- **Confirmed Decision 2 — Satchel Mech Preview Showcase Cycle**: The Satchel composite mech preview canvas will continuously demonstrate the full magic-current locomotion loop—cycling cleanly through **Idle** (`Frame 1`), **Windup** (`Frames 2 → 3 → 4`), **Sustained Glide** (`Frame 3` with off-count shifts to `Frame 2`), and **Wind-Down** (`Frames 3 → 2 → 1`)—while allowing instant directional rotation.
- **Confirmed Decision 3 — Full Codebase Organization, Grooming & Commit Prep**: Once the glide state machine is verified, we will split per-piece sprite sheets into clean equipment slot modules, remove redundant master atlas exports, strip dead code/unused imports/legacy aliases, update authoring documentation, and provide a structured commit summary.

---

### 1. Overview & Core Concept

- **What It Does**: Replaces static frame clamping with a stateful 4-frame magic-current glide controller across all layered mech equipment sprites (Legs, Coreplate, Arms, Head, and Thrusters), synchronizes physical deceleration with frame recovery weight, and reorganizes equipment sprite registries into a clean, maintainable structure.
- **Target Audience / Persona**: Players piloting customizable Orion mechs in tactical top-down combat and authors/developers maintaining modular armor sets and standalone equipment pieces.
- **Key Value**: Mechs visually and physically feel like high-mass war machines surfing raw magic currents rather than infantry running on foot, while the codebase becomes clean, modular, and ready for version-control commits.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Standing Idle (`Frame 1` / Index `0`)**: When stationary on the field, the mech holds its grounded idle posture (`Frame 1`).
  2. **Glide Windup (`Frames 2 → 3 → 4` / Indices `1 → 2 → 3`)**: Engaging movement initiates the magic-current surge, stepping sequentially through `Frame 2`, `Frame 3`, and `Frame 4` as the chassis lifts into its glide posture.
  3. **Sustained Magic Glide (`Frame 3` with Off-Count Shifts to `Frame 2` / Index `2 ↔ 1`)**: After completing windup, sustained movement holds `Frame 3` as the primary glide frame and periodically pulses to `Frame 2` on an off-beat rhythm before returning to `Frame 3`, creating a hovering current cadence rather than a pedestrian stride.
  4. **Active Boost (`Frame 4` / Index `3`)**: Engaging thrusters/boost immediately locks the chassis into `Frame 4` (maximum forward surge). Releasing boost while still moving returns directly to `Frame 3` (sustained glide) without re-triggering windup.
  5. **Weight-Scaled Wind-Down & Recovery (`Frames 3 → 2 → 1` / Indices `2 → 1 → 0`)**: Releasing movement input transitions the mech into a wind-down recovery phase rather than snapping abruptly to `Frame 1`. The mech steps down from `Frame 3` to `Frame 2` and finally settles into `Frame 1`, accompanied by a brief weight-scaled physical glide carry-over.
  6. **Satchel Loadout Inspection**: Opening the Satchel displays the composite mech preview cycling smoothly through Idle, Windup, Sustained Glide, and Wind-Down so players can inspect how their mixed-and-matched armor pieces animate together.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Tactical retro-futuristic pixel-art mecha HUD with crisp dark slate surfaces (`#0F172A`), high-contrast tabular telemetry, and magic-current cyan/amber accents.
  - *Color Palette & Mood*: Follows the 60-30-10 discipline—60% deep arena and tactical slate canvas, 30% structural equipment panels with hairline borders, and 10% focal accents (`#38BDF8` magic-current cyan, `#F59E0B` thruster/weight telemetry amber, `#10B981` nominal load emerald).
  - *Typography & Hierarchy*: Clean geometric sans headings paired with `tabular-nums` monospace readouts for weight, mobility ratios, and frame state indicators. Zero decorative pills or clutter.
- **Interactive Feedback & Motion**:
  - Immediate visual frame response ($\le 16\text{ms}$ frame tick responsiveness) when initiating movement or triggering boost.
  - Smooth deceleration vector decay during wind-down so visual recovery frames (`3 → 2 → 1`) match the mech's physical stopping momentum.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Explicit 5-Phase Locomotion State Machine vs. Linear Frame Timer**
  - *Chosen Approach*: Model player animation as an explicit state machine (`IDLE`, `WINDUP`, `GLIDE`, `BOOST`, `WINDDOWN`) stored on the player state and shared with the sprite renderer.
  - *Why*: A simple modulo timer (`tick % 4`) treats movement as a repetitive walk cycle and snaps to `0` on stop. An explicit state machine guarantees exact transitions (`1 → 2 → 3 → 4` windup, `3 ↔ 2` off-count glide, `4` boost → `3` glide, and weight-scaled `3 → 2 → 1` wind-down).
  - *Alternatives Considered*: Stateless tick-based formulas were rejected because they cannot remember whether the mech is winding up, sustaining a glide, exiting a boost, or recovering from movement.
- **Decision 2 — Coupled Physical Stopping Inertia & Visual Recovery Scaling**
  - *Chosen Approach*: Compute a normalized weight ratio from total equipped chassis + weapon mass (`totalWeight` vs. `weightCapacity` and base weight brackets) that scales both the wind-down frame durations and a brief velocity decay vector when directional keys are released.
  - *Why*: Tying physical deceleration to visual recovery frames makes heavy sets (e.g., Bastion or Camelot Knight pieces) feel tangibly heavier than lightweight reconnaissance frames.
- **Decision 3 — Per-Slot Sprite Sheet Organization & Master Atlas Cleanup**
  - *Chosen Approach*: Organize equipment sprite data by slot (Head, Coreplate, Arms, Legs, Thrusters) with dedicated per-piece entries and standalone part support, while removing redundant full-sheet master atlas exports and unused legacy aliases.
  - *Why*: Reduces bundle bloat, eliminates confusion over where individual armor pieces or non-set standalone parts live, and prepares the repository for clean commits.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Player Locomotion & Input                         │
│  Directional Input + Boost State + Total Equipped Weight (Chassis+Wpn)  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Magic-Current Glide State Machine                      │
│                                                                         │
│  ┌──────────┐   Move Start    ┌────────────────────┐                    │
│  │   IDLE   │ ──────────────► │       WINDUP       │                    │
│  │ (Frame 1)│                 │ (Frames 2 → 3 → 4) │                    │
│  └────▲─────┘                 └─────────┬──────────┘                    │
│       │                                 │ Windup Complete               │
│       │ Recovery Complete               ▼                               │
│  ┌────┴─────┐   Move Stop     ┌────────────────────┐   Boost Active     │
│  │ WINDDOWN │ ◄────────────── │   SUSTAINED GLIDE  │ ───────────────┐   │
│  │(3 → 2 →1)│                 │ (Frame 3 + 2 Shift)│                ▼   │
│  │+ Inertia │ ──────────────► └─────────▲──────────┘          ┌─────────┐
│  └──────────┘   Re-engage               │ Boost Released      │  BOOST  │
│                 Move                    └──────────────────── │(Frame 4)│
│                                                               └─────────┘
└───────────────────┬───────────────────────────────────┬─────────────────┘
                    │                                   │
                    ▼                                   ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│      In-Game Composite Renderer       │ │  Satchel Mech Preview Canvas  │
│  Draws 64×64 Directional Quad (0..3)  │ │  Loops Idle → Windup → Glide  │
│  Across Legs, Core, Arms, Head, Jet   │ │  → Wind-Down Showcase Cycle   │
└───────────────────────────────────────┘ └───────────────────────────────┘
```

- **Data Model & State**:
  - **Sprite Frame Mapping (1-Based Spec to 0-Based Atlas Column)**:
    - `Frame 1` (Idle) $\rightarrow$ Column `0`
    - `Frame 2` (Windup Start / Glide Off-Count / Wind-Down Step) $\rightarrow$ Column `1`
    - `Frame 3` (Windup Mid / Primary Sustained Glide / Post-Boost / Wind-Down Start) $\rightarrow$ Column `2`
    - `Frame 4` (Windup Peak / Active Boost) $\rightarrow$ Column `3`
  - **Player Locomotion State**:
    - `glidePhase`: `'idle' | 'windup' | 'glide' | 'boost' | 'winddown'`
    - `glideStep`: Current step within the active phase (e.g., windup stage, off-count cadence counter, or wind-down recovery stage)
    - `glideTimer`: Tick accumulator advancing against weight-scaled thresholds
    - `glideVelocity`: Last active movement vector (`vx`, `vy`) decayed smoothly during the `'winddown'` phase based on total equipped weight
  - **Modular Equipment Sprite Registry**:
    - Slot-organized sprite modules (`head`, `core`, `arms`, `legs`, `thrusters`) exporting individual piece base64 sheets (`64×64` per piece, `4×4` directional/frame grid, or `64×192` 3-part set strips sliced per slot) with clean lookup helpers and expansion slots for standalone non-set parts.

- **Interactive Component & State Mapping**:
  - **Movement Initiation**: Pressing directional inputs while in `idle` or `winddown` transitions `glidePhase` to `'windup'`, stepping through columns `1 → 2 → 3` (`Frames 2, 3, 4`).
  - **Sustained Glide Cadence**: Completing column `3` in `'windup'` transitions to `'glide'` at column `2` (`Frame 3`). While in `'glide'`, an off-count cadence timer holds column `2` for the main beat (e.g., ~3 beats) and shifts briefly to column `1` (`Frame 2`) for 1 off-count beat before returning to column `2`.
  - **Boost Override & Return**: Activating boost from any moving phase transitions immediately to `'boost'` and locks column `3` (`Frame 4`). Releasing boost while directional input remains held returns directly to `'glide'` at column `2` (`Frame 3`).
  - **Weight-Scaled Wind-Down & Inertia**: Releasing directional input from `'windup'`, `'glide'`, or `'boost'` transitions to `'winddown'`. Both the residual glide velocity decay and the frame durations for `Column 2 (Frame 3) → Column 1 (Frame 2) → Column 0 (Frame 1)` scale with total equipped weight (`recoveryTicks = baseTicks + weightFactor`).
  - **Satchel Preview Controller**: Runs a self-contained deterministic showcase state machine on the preview canvas (`Idle → Windup 2-3-4 → Sustained Glide 3-3-2-3 → Wind-Down 3-2-1`) and supports directional rotation buttons (`S`, `W`, `E`, `N`) and optional animation pause/phase inspection.
