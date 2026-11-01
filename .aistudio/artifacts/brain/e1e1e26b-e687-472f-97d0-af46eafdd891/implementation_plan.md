# Intuitive Equipment & Sub-Module Stat Architecture Plan

## 1. Exterior Plating vs. Internal Sub-Module Separation
Enforce a strict physical boundary between **exterior armor shells** and **internal sub-modules** mounted beneath the plating:
- **Exterior Armor & Shields Only (`plating`, `head` Dome Plate, `arms` Aperture Plate, and Shield Auxiliaries)**:
  - Exclusively own **Armor Durability**, **Armor Rating**, and **Armor Threshold**.
  - `resolveEquippedHardwareStats` will aggregate `armorDurability`, `armorRating`, and `armorThreshold` **only** from `plating` (Frame Plating), `head` (Dome Plate), `arms` (Aperture Plate), and equipped Shield Auxiliaries.
- **Internal Sub-Modules (`optics`, `sensoryA`, `sensoryB`, `actuators`, `structure`, `integration`, `reactor`, `legs`, `mobility`)**:
  - Stripped of all `armorDurability`, `armorRating`, and `armorThreshold` values across base items, crafted sub-modules, and auxiliary catalysts.

## 2. Mechanical Stat Domains per Sub-Module Slot
Extend `CanonicalHardwareItemDefinition` and `resolveEquippedHardwareStats` with domain-specific combat and physics modifiers so every internal part grants stats matching what it physically does:

| Slot | Physical Role | Allowed Stat Gains | Zero-Sum Drawbacks |
| :--- | :--- | :--- | :--- |
| **Dome Plate (`head`)** | Exterior head armor shell | Armor Durability, Armor Rating, Visor Shielding | Equip Weight (`WT`) |
| **Optics (`optics`)** | Targeting lenses & night-vision | Light Radius (`lightBonus`), Ranged/Lock Accuracy (`accuracyMult`), Weak-Point/Stagger Damage (`staggerDamageMult`) | Equip Weight (`WT`) or Heat Draw |
| **Sensory A & B (`sensoryA`, `sensoryB`)** | Battlefield radar, gyros & telemetry | Light/Detection Radius (`lightBonus`), Skill Cooldown Telemetry (`cooldownMult`), Gyro Poise (`stabilityBonus`) | Equip Weight (`WT`) |
| **Aperture Plate (`arms`)** | Exterior shoulder/forearm armor | Armor Durability, Armor Rating, Pauldron Shielding | Equip Weight (`WT`) |
| **Actuators (`actuators`)** | Internal arm servos & wrist gyros | Attack Impulse Mass (`attackMassBonus`), Swing Windup Speed (`tellDurationMult`), Recoil Poise (`stabilityBonus`), CQC Cooldown (`cooldownMult`) | Equip Weight (`WT`) or Servo Heat |
| **Structure & Integration (`melee`, `ranged` mods)** | Internal arm framing & power couplings | Poise (`stabilityBonus`), Hyper-Armor Windup, Skill Heat Reduction (`heatCostDelta`), Cooldowns (`cooldownMult`) | Equip Weight (`WT`) or Tell Windup |
| **Frame Plating (`plating`)** | Primary chassis torso/leg armor | Base Load Capacity, Armor Type, Armor Durability, Armor Rating, Armor Threshold, Base Shield | Equip Weight (`WT`) |
| **Reactor Core (`reactor`)** | Internal powerplant & heatsink | Reactor Family, Load Capacity (`capacityBonus`), Thermal Venting (`heatVentMult`), Barrier Projection (`shieldBonus`) | Equip Weight (`WT`) |
| **Leg Actuators (`legs`)** | Internal drive pistons & stabilizers | Load Capacity (`capacityBonus`), Stride/Glide Speed (`moveSpeedMult`), Grounding Poise (`stabilityBonus`) | Equip Weight (`WT`) |
| **Mobility Kit (`mobility` mod)** | Thruster vectoring & suspension | Load Capacity (`capacityDelta`), Move/Dash Speed (`moveSpeedMult`), Thermal Efficiency (`heatVentMult`) | Equip Weight (`WT`) or Shield/Heat trade-off |

## 3. Slot-Adaptive Gemstone Socketing (`findHardwareItemByNameOrId`)
Update hardware Gemstone modification logic so socketing a Gem into an item adapts to the **host slot's physical function** rather than applying generic armor/shield numbers to internal parts:
- **Exterior Plating (`plating`, `head`, `arms`)**:
  - *Hematite / Carnelian*: +Armor Durability, +Armor Threshold (+WT).
  - *Titanite / Moonstone*: +Shield Capacity, +Armor Rating (+WT).
  - *Spinel / Rubellite / Demantoid*: Balanced +Armor Durability & +Shield Capacity (+WT).
  - *Kyanite / Charoite*: Ultralight weight reduction (`-WT`) or Visor Light with reduced Armor Durability.
- **Arm Actuators (`actuators`)**:
  - *Carnelian / Hematite*: +Attack Impulse Mass (`+m_attack`) & +Recoil Stability (`+S`) (+WT).
  - *Spinel / Rubellite*: Faster Swing Windup (`-tellDurationMult`) & CQC Cooldown reduction (+WT).
  - *Titanite / Demantoid*: +Parry/Guard Stability (`+S`) & Cooldown reduction (+WT).
  - *Charoite / Kyanite*: Ultralight Servo reduction (`-WT`) & faster Windup (`-tellDurationMult`).
- **Optics & Sensory (`optics`, `sensoryA`, `sensoryB`)**:
  - *Kyanite / Charoite / Moonstone*: +Light Radius (`+lightBonus`) & +Targeting Accuracy (`+accuracyMult`) or `-WT`.
  - *Titanite / Carnelian / Hematite*: +Gyro Stability (`+S`) & Threat Telemetry Cooldown reduction (+WT).
  - *Spinel / Rubellite / Demantoid*: +Weak-Point/Stagger Damage (`+staggerDamageMult`) & faster Cooldowns (+WT).
- **Reactor Cores (`reactor`)**:
  - *Hematite / Carnelian / Spinel*: +Load Capacity (`+capacityBonus`) & +Thermal Venting (`+heatVentMult`) (+WT).
  - *Moonstone / Titanite / Demantoid*: +Barrier Shield Output (`+shieldBonus`) & +Thermal Venting (+WT).
  - *Rubellite / Kyanite / Charoite*: +Thermal Venting (`+heatVentMult`) & lighter condenser mass (`-WT`).
- **Leg Actuators (`legs`)**:
  - *Carnelian / Hematite / Titanite*: +Load Capacity (`+capacityBonus`) & +Footing Stability (`+S`) (+WT).
  - *Charoite / Kyanite / Spinel*: +Stride/Move Speed (`+moveSpeedMult`) & Ultralight reduction (`-WT`).
  - *Moonstone / Demantoid / Rubellite*: Balanced +Load Capacity & +Move Speed (+WT).

## 4. Combat, Inertia & UI Stat Readout Integration
- **Combat & Movement (`combatSystem.ts`, `playerSystem.ts`, `inertiaSystem.ts`)**:
  - Wire resolved hardware `moveSpeedMult`, `heatVentMult`, `cooldownMult`, `tellDurationMult`, `accuracyMult`, `staggerDamageMult`, `stabilityBonus`, and `attackMassBonus` into player movement speed, reactor cooling, weapon tell/cooldown calculations, and inertia impulse (`m_attack` & `S`).
- **Equipment Screen & Satchel Tooltips (`OrionSatchelModal.tsx`, `OrionEquipmentModal.tsx`)**:
  - Display the exact domain-specific stat badges on each hardware piece and sub-module (e.g., `+12% Swing Speed`, `+8 Attack Mass`, `+10 Stability`, `+15% Heat Vent`, `+6% Move Speed`, `+1.0 Light`) and remove any Armor badges from internal sub-modules.
