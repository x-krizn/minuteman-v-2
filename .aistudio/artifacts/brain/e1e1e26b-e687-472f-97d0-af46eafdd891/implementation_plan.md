# Menu Overhaul: Mech Doll Loadout, Armory Workbench & Semantic Custom Naming

## 1. Architectural Vision & Core Experience

This overhaul reorganizes the Orion tactical interface into clean, focused operational workspaces by separating **equipment rigging** (`LOADOUT`) from **hardware & weapon engineering** (`ARMORY`), clarifying tab nomenclature (`INVENTORY` and `SKILLS & FEATS`), and removing sequential slot constraints on modifications.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ORION TACTICAL INTERFACE                                  │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│ MECH STATUS  │   LOADOUT    │    ARMORY    │  INVENTORY   │SKILLS & FEATS│ WORLD / CDX │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────────┴──────────────┴─────────────┘
       │              │              │
       │              ▼              └────────────────────────────────────┐
       │   ┌──────────────────────────────────────────────────────────┐   │
       │   │                 LOADOUT: MECH DOLL SCREEN                │   │
       │   │                                                          │   │
       │   │    [HEAD / DOME]                  [MAIN HAND (R)]        │   │
       │   │          ╲                              ╱                │   │
       │   │    [TORSO / FRAME] ───► ┌────────┐ ◄─── [SIDE HAND (L)]  │   │
       │   │                         │ HIGH   │                       │   │
       │   │    [ARMS / APERTURE] ─► │  RES   │ ◄─── [AUXILIARY (B)]  │   │
       │   │                         │  MECH  │                       │   │
       │   │    [LEGS / STRIDERS] ─► └────────┘ ◄─── [TRIGGERS L/R]   │   │
       │   │                                                          │   │
       │   │    ┌────────────────────────────────────────────────┐    │   │
       │   │    │ SLOT CONTEXT MENU (On Node Click)              │    │   │
       │   │    │  • Equip / Swap Item (High-Res Picker)         │    │   │
       │   │    │  • Unequip Slot (Side / Aux)                   │    │   │
       │   │    │  • Stance / Grip Toggle (1H/2H or Side ⇄ Aux)  │    │   │
       │   │    │  • Modify in Armory ───────────────────────────┼────┼───┼──┐
       │   │    └────────────────────────────────────────────────┘    │   │  │
       │   └──────────────────────────────────────────────────────────┘   │  │
       │                                                                  ▼  ▼
       │   ┌────────────────────────────────────────────────────────────────────┐
       │   │                  ARMORY: MODIFICATION WORKBENCH                    │
       │   │                                                                    │
       │   │  1. Target Selector (Equipped or Inventory Weapon / Armor / Frame) │
       │   │  2. High-Resolution Schematic & Live Stat Delta Readout            │
       │   │  3. Any-Order Anatomical Slot Matrix:                              │
       │   │     ├─ Weapon Parts: [Barrel/Blade] [Receiver/Guard] [Mag/Pommel]  │
       │   │     ├─ Internal Sub-Modules: [Optics] [Sensory A/B] [Actuators]    │
       │   │     │                        [Reactor Core] [Leg Actuators]        │
       │   │     ├─ Action Mods: [Melee Structure] [Ranged Integration] [Dash]  │
       │   │     └─ Gemstone Sockets: [Socket I] [Socket II] [Socket III]       │
       │   │  4. Semantic Custom Naming Engine:                                 │
       │   │     ├─ Model Designation: "N-55 Gladius Custom (+II / +III)"       │
       │   │     └─ Standard Weapon/Armor: "Custom Camelot Longsword (+II)"     │
       │   └────────────────────────────────────────────────────────────────────┘
```

---

## 2. User Review & Critical Decisions

- **Menu Bar Nomenclature & Tab Structure**:
  - Rename `SATCHEL` to **`INVENTORY`**.
  - Rename `SKILLS & GEMS` to **`SKILLS & FEATS`** (and `CHEAT & FEATS` when developer cheat mode is active).
  - Introduce a dedicated **`ARMORY`** tab positioned alongside `LOADOUT`.
- **Complete Consolidation of Modifications into Armory**:
  - All modification systems move out of `LOADOUT` and into **`ARMORY`**:
    1. **Weapon Component Parts** (`Barrel`, `Receiver`, `Magazine`, `Grip`, `Blade`, `Guard`, `Pommel`, `Counterweight`, `Core`, `Cell`, etc.)
    2. **Chassis Internal Sub-Modules** (`Optics`, `Sensory A`, `Sensory B`, `Actuators`, `Reactor Core`, `Leg Actuators`)
    3. **Action Modifications** (`Structure / Melee`, `Integration / Ranged`, `Mobility Kit`)
    4. **Gemstone Sockets** on both weapons and chassis armor/sub-modules
- **Any-Order Mod & Gem Installation**:
  - Players can select and populate **any** anatomical component slot or gemstone socket directly in any order (e.g., installing a `Pommel` or `Magazine` mod or socketing `Slot 2` without being forced to fill `Slot 1` first).
  - Unfilled earlier slots remain empty (`null` / `''`) while preserving exact slot-to-component mapping.
- **Semantic `Custom` Naming Engine**:
  - Replace gem-specific prefixes (`Assault`, `Heavy`, `Aegis`, etc.) with a unified semantic **`Custom`** label and optional tier suffix (`+II`, `+III`, etc.) based on total installed modifications:
    - **Model Designations & Coded Titles** (items starting with alphanumeric model codes or faction initials such as `N-55 Gladius`, `M-300 Hasta`, `BWI Twinstrike Gauntlets`, `C-14 Impaler`) use a suffix: **`N-55 Gladius Custom`**, **`N-55 Gladius Custom +II`**, **`N-55 Gladius Custom +III`**.
    - **Standard Weapon & Armor Nouns** (such as `Camelot Longsword`, `Short Spear`, `Heater Shield`, `Aegis Dome Plate`) use a prefix: **`Custom Camelot Longsword`**, **`Custom Camelot Longsword +II`**, **`Custom Camelot Longsword +III`**.
- **Mech Doll Loadout Screen & Slot Context Menus**:
  - Replace the vertical scrolling card list in `LOADOUT` with an interactive **Mech Doll** layout featuring a central high-resolution composite mech viewport surrounded by clickable anatomical hardpoint nodes (`Head / Dome`, `Torso / Frame`, `Arms / Aperture`, `Legs / Striders`, `Main Hand [R]`, `Side Hand [L]`, `Auxiliary [Back]`, and `Trigger Bindings [L/R]`).
  - Clicking any slot node opens a contextual action menu with:
    1. **Equip / Swap**: Opens a focused modal/drawer for that specific slot with high-resolution item artwork and side-by-side stat delta badges.
    2. **Unequip**: Clears the slot (available on `Side Hand` and `Auxiliary`).
    3. **Stance / Grip Toggle**: Switches `Main Hand` between `1H Grip` and `2H Power Stance`, or swaps `Side Hand ⇄ Auxiliary [L]`.
    4. **Modify in Armory**: Jumps directly to the `ARMORY` tab with that exact item or chassis assembly pre-selected.

---

## 3. Core Feature Specifications

### A. High-Resolution Equipment & Mech Doll Artwork Renderer
- **High-Res Item Schematics**:
  - Upgrade item inspection previews on the `LOADOUT` Mech Doll picker and `ARMORY` workbench with a dedicated high-resolution canvas renderer (`128×128` to `192×192` crisp multi-pass rendering) that draws weapon geometry, armor silhouette contours, energy cores, installed component highlights, and socketed gemstone nodes with blueprint callout lines.
- **Central Mech Doll Viewport**:
  - Renders the live composite mech at high magnification with animated diagnostic scanlines, armor plating overlays, wielded Main/Side/Aux weapon silhouettes, and interactive hardpoint tether lines connecting each anatomical region to its surrounding slot node.
  - Displays a compact, always-visible **Chassis Load Limit & Encumbrance Bar** (`LIGHT` / `MEDIUM` / `HEAVY` / `OVERBURDENED`) and **Active Combat Stance Summary** in the Mech Doll header/footer.

### B. Mech Doll Slot Nodes & Context Menu Workflow
- **Anatomical Hardpoint Nodes**:
  - **Left Column (Chassis Armor)**: `Head (Dome Plate)`, `Torso (Frame Plating)`, `Arms (Aperture Plate)`, `Legs (Striders)`.
  - **Right Column (Ordnance & Bindings)**: `Main Hand [Right]`, `Side Hand [Left]`, `Auxiliary [Back]`, `Trigger Bindings [LMB / RMB]`.
- **Slot Node Visuals**:
  - Each node displays a high-resolution item thumbnail, semantic `Custom` name, weight (`WT`), primary domain stats (Armor Durability/Rating/Threshold or Weapon Damage/Cooldown), and small indicator pips showing installed mods/gems.
- **Context Menu & Focused Equipment Picker**:
  - Clicking a slot node opens an anchored tactical context menu (`Equip / Swap`, `Unequip`, `Stance / Grip Toggle`, `Modify in Armory`).
  - Selecting `Equip / Swap` opens a streamlined slot-specific equipment selector featuring a large high-resolution artwork preview of the hovered/selected item, lore description, full canonical stat breakdown, and net weight/armor/damage comparison against the currently equipped piece.

### C. Armory Modification Workbench (`ARMORY` Tab)
- **Three-Category Engineering Selector**:
  - **Weapons (`Main / Side / Aux & Inventory Weapons`)**: Select any weapon instance to inspect its high-resolution schematic and install/remove **Weapon Component Parts** and **Weapon Gem Sockets** in any anatomical slot order.
  - **Chassis Armor & Sub-Modules (`Head / Torso / Arms / Legs`)**: Select any anatomical assembly to install/swap its **Internal Sub-Modules** (`Optics`, `Sensory A/B`, `Actuators`, `Reactor Core`, `Leg Actuators`) and socket **Hardware Gemstones** (adapting gem bonuses to the host slot's physical domain).
  - **Action Modifications (`Melee / Ranged / Mobility`)**: Configure `Structure (Melee)`, `Integration (Ranged)`, and `Mobility Kit` action mods alongside their dedicated gem sockets.
- **Any-Order Slot Matrix**:
  - Each anatomical component slot (`Barrel`, `Receiver`, `Magazine`, `Grip`, `Blade`, `Guard`, `Pommel`, etc.) and gem socket (`Socket I`, `Socket II`, `Socket III`) is independently clickable.
  - Selecting a slot shows compatible parts/gems in inventory, previews the exact stat changes and resulting `Custom` item designation, and allows one-click installation, replacement, or removal in any order.

---

## 4. Verification & Polish Criteria
- Verify that all 7 top-level navigation tabs (`MECH STATUS`, `LOADOUT`, `ARMORY`, `INVENTORY`, `SKILLS & FEATS`, `WORLD MAP`, `CODEX`) render cleanly and support keyboard/mouse navigation.
- Verify that `Modify in Armory` from any `LOADOUT` Mech Doll slot context menu transitions directly to the `ARMORY` tab focused on that exact weapon or chassis assembly.
- Verify that installing mods or gems in any slot order (e.g., slot 3 first, then slot 1) persists accurately and formats item names using the semantic `Custom` prefix/suffix and `+II`/`+III` tier rules.
- Run strict documentation and build verification (`npm run wiki`, `lint_applet`, `compile_applet`).
