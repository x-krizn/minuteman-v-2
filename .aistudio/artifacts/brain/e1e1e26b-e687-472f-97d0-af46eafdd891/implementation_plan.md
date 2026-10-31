# Bog Awakening, Poe Companion Orb & Diegetic Discovery Overhaul

This update transforms Project Orion's opening narrative and exploration model: the pilot awakens alone in the Bog with no memory of their origin or awareness that they are inside a mech, the Drop Pod and Waygate are relocated exclusively to the Training Room, quest pop-ups and explicit guidance flags are replaced with diegetic dialogue and inspection clues, caches are scattered unpredictably, and the Bog Poe can be accepted as a persistent companion orb tinted by the pilot's highest skill color that drifts toward nearby quest objectives.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and UX decisions were confirmed during interactive planning and govern this implementation:

- **Confirmed Decision 1 — Training Room Access (`[-4,0]`)**: With the Drop Pod (`D`) and Waygate (`Q`) removed from the Bog (`[-3,0]`) and housed inside the `[-4,0]` Training Sandbox, players can enter or exit the Training Room at any time via a toggle in the `[START]` Menu and the `[SELECT]` Satchel Menu.
- **Confirmed Decision 2 — Poe Encounter Choices (`Accept`, `Decline`, `Attack`)**: Speaking with the Poe in the Bog presents a permanent choice to **Accept Companion** (the Poe bonds with the pilot as a traveling orb), **Decline** (the Poe remains at its shrine while the pilot travels solo), or **Attack** (destroying the spirit for a Corrupted Shard).
- **Confirmed Decision 3 — Companion Poe Skill Color & Tie-Breaker**: The companion Poe renders as a small trailing orb colored after the gemstone of the pilot's highest-level Pilot Skill (`Warrior` → Spinel Red, `Marauder` → Carnelian Orange, `Guardian` → Titanite Yellow, `Cleric` → Demantoid Green, `Wizard` → Kyanite Blue, `Rogue` → Charoite Purple). When skills are tied (such as at Level 1), it defaults to the pilot's starting Trait Line primary gemstone color.
- **Confirmed Decision 4 — Minimal Prompts & Diegetic Context Clues**: All automatic quest/tutorial pop-up banners, HUD tutorial step badges, and parenthetical action hints (e.g., `(UNLOCK CAMPFIRES)`, `(GEAR & GEMS)`) are removed. Interaction prompts remain minimal (e.g., `TALK`, `EXAMINE`, `REST`, `SEARCH`), while rich narrative context clues are delivered when the player chooses **Inspect** or **Speak**.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Amnesiac Bog Awakening & Training Room Relocation**: Removes the Drop Pod (`D`) and Waygate (`Q`) from the Bog's starting clearing (`[-3,0]`), turning it into the **Mire Awakening Hollow**—a quiet, overgrown marsh basin where the pilot stirs alone without memories or awareness of their mechanical body. The Drop Pod (`D`) and Waygate (`Q`) remain in the `[-4,0]` Training Room, which can be entered or exited via the Start Menu and Satchel Menu.
  2. **The Poe Companion Decision & Trailing Orb**: When encountering the Poe near the First Campfire (`[0,0]`) or Lantern Clearing (`[0,-2]`), the player can **Accept** its company, **Decline** to walk alone, or **Attack** it. If accepted, the standalone NPC despawns and becomes a persistent, depth-sorted trailing orb that follows the pilot across all rooms and worlds.
  3. **Objective Hovering & Dynamic Skill Color**: The companion Poe orb glows in the hex color of the pilot's highest-level Pilot Skill (using the Trait Line's primary gemstone color on ties). Whenever an unresolved quest objective or key discovery is within view in the current room (e.g., unlit First Campfire, Sir Bedivere's remains, sealed Bog Gate, shimmering Lake waters when holding 3 relics, Grail Switches, or Cathedral Door), the Poe detaches from the pilot's shoulder and hovers around that objective in a gentle figure-eight orbit.
  4. **Diegetic Context Clues & Less Predictable Caches**: Strips out automatic tutorial/quest toast banners and HUD objective spoilers, shifting all guidance into atmospheric **Inspect** descriptions and NPC/Poe dialogues that reflect the pilot's disorientation (feeling iron joints, warm ichor/mana hums, and forgotten names). Overhauls cache placement so caches are no longer stamped in fixed corridor centers or predictable grid rows, instead appearing organically in tucked alcoves, ruins, and irregular off-path pockets.
- **Target Audience / Persona**: Players seeking an atmospheric, curiosity-driven action RPG where world lore, mechanical self-discovery, and navigation emerge through observation and companionship rather than UI checklists.
- **Key Value**: Aligns gameplay and world design with the canon story while turning the Poe into a meaningful narrative and visual companion.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Awakening in the Bog (`[-3,0]`)**: New pilots begin in the **Mire Awakening Hollow** with no boot-up telemetry toast or drop-pod wreckage. Inspecting the surroundings reveals moss-draped stone and the strange sensation of heavy iron limbs answering thoughts of movement.
  2. **Meeting the Poe (`[0,0]` / `[0,-2]`)**: Approaching the Poe shows a minimal prompt (`SPEAK`). Opening the interaction menu offers:
     - **Accept Companion ("Walk with me through the mire")** — Bonds the Poe as a traveling companion orb.
     - **Decline ("I walk alone")** — The Poe stays by the hearth/lantern; the pilot still learns how to kindle the cold embers through observation.
     - **Inspect** — Diegetic sensory observation of the floating spirit.
  3. **Traveling with the Companion Poe**:
     - Under normal exploration, the Poe orb trails smoothly behind and above the pilot (`z = 10..14`), casting a subtle point light and leaving soft motes in the color of the pilot's highest Pilot Skill.
     - When an important, unresolved quest objective enters the camera viewport, the Poe glides over to hover and circle above that tile/entity until the objective is resolved or the player walks out of range.
  4. **Training Room Toggle (`[-4,0]`)**: Opening `[START]` or the `[SELECT]` Satchel displays a **Training Room** toggle button that teleports the pilot into `[-4,0]` (where the Drop Pod, Waygate, and diagnostic terminals live) or returns them to their exact prior world coordinates.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Eerie, mythic 2.5D pixel-art marshland where ancient Arthurian relics and mechanical nature blur together.
  - *Color Palette & Mood*: Companion Poe orb dynamically adopts the 6 Discipline Gemstone palettes:
    - `Warrior` (Spinel): `#ef4444` core / `#fecaca` halo
    - `Marauder` (Carnelian): `#f97316` core / `#fed7aa` halo
    - `Guardian` (Titanite): `#facc15` core / `#fef08a` halo
    - `Cleric` (Demantoid): `#22c55e` core / `#bbf7d0` halo
    - `Wizard` (Kyanite): `#38bdf8` core / `#bae6fd` halo
    - `Rogue` (Charoite): `#a855f7` core / `#e9d5ff` halo
  - *Interactive Feedback & Motion*: Minimal 1–2 word world prompts (`SPEAK`, `REST`, `EXAMINE`, `SEARCH`, `UNSEAL`) with zero spoiler parentheticals; rich diegetic prose on `Inspect` and `Talk`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Persistent Companion State vs. Room-Bound Enemy Entity**
  - *Chosen Approach*: Track the companion Poe directly on `OrionState` (`flags.poe_companion_active`, plus smooth world-space coordinates `poeCompanionX`, `poeCompanionY`, `poeCompanionZ`) updated every frame alongside the player, while suppressing the static `bog_poe` room spawn once accepted.
  - *Why*: Allows the Poe to seamlessly follow the pilot across chunk boundaries, room transitions, and worlds without being hibernated or despawned by the room enemy loader.
- **Decision 2: Seeded Multi-Candidate Cache Scattering**
  - *Chosen Approach*: Remove fixed center-corridor caches (`::::C:::::`) from Set-Path connectors and replace fixed row-5 procedural cache placement with a seeded scan of valid tucked terrain candidates (alcoves adjacent to trees/pillars/ruins) at lower, varied frequency (`~18%` in outer chunks, higher in deep fog).
  - *Why*: Eliminates the predictable "center of every hallway / row 5 of every chunk" pattern while keeping cache loot deterministic per world seed so `lootedCaches` persistence remains rock-solid.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌───────────────────────────────────────────────────────────────────────────┐
│                         OrionState (Core State)                           │
│  • flags.poe_state: 'unmet' | 'companion' | 'declined' | 'killed'         │
│  • poeCompanion: { x, y, z, targetObjectiveX?, targetObjectiveY? }        │
│  • preTrainingReturnAnchor: { room, rx, ry, x, y, areaId }                │
└───────────────┬───────────────────────────────────────────┬───────────────┘
                │                                           │
                ▼                                           ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────┐
│   World, Narrative & Cache Systems    │   │   Companion Poe & Renderer    │
│  • [-3,0] Mire Awakening Hollow       │   │  • Highest Skill Gem Color    │
│    (No Drop Pod 'D' or Waygate 'Q')   │   │    (Trait Gem tie-breaker)    │
│  • [-4,0] Training Room hosts D & Q   │   │  • Trails pilot or hovers     │
│    + Start/Satchel Enter/Return toggle│   │    over visible quest targets │
│  • Minimal Prompts + Rich Diegetic    │   │  • Emits dynamic point light  │
│    Inspect / Dialogue Clues           │   │    in 2.5D lighting pass      │
│  • Organic Alcove Cache Scattering    │   │                               │
└───────────────────────────────────────┘   └───────────────────────────────┘
```

- **Data Model & State**:
  - `state.flags.poe_state`: `'unmet' | 'companion' | 'declined' | 'killed'`.
  - `state.poeCompanion`: Transient runtime physics state `{ x: number; y: number; z: number; vx: number; vy: number; hoveringObjective: boolean }` initialized at the player's position on room transitions and updated each frame when `state.flags.poe_state === 'companion'`.
  - `state.preTrainingReturnAnchor`: Stores `{ room, rx, ry, x, y, areaId, bypassProgressionGates }` when entering `[-4,0]` from the Start or Satchel menu so the player can toggle back to their exact Bog/World position.
- **Interactive Component & State Mapping**:
  - **Poe Context Menu**: When `poe_state === 'unmet'`, interacting with the Poe opens choices: `Accept Companion`, `Decline Offer`, `Inspect`, and `Leave`. Selecting `Accept Companion` sets `poe_state = 'companion'`, unlocks campfire attunement, removes the room `bog_poe` entity, and spawns the companion orb at the Poe's position. Selecting `Decline Offer` sets `poe_state = 'declined'`, unlocks campfire attunement via spoken clue, and leaves the Poe at its clearing.
  - **Objective Scanner (`resolveVisibleQuestObjectivePx`)**: Scans the current camera viewport for active quest landmarks in priority order:
    1. Unlit First Campfire (`A` in `0,0` when `!first_campfire_lit`)
    2. Unexamined Fallen Knight (`S` in `1,0` when `!scout_salvaged`)
    3. Shimmering Bog Waters (`~` in `2,1` when `bedivere_list_items >= 3 && !lady_of_the_lake_defeated`)
    4. Sealed Bog Perimeter Gate (`G` in `3,0` when `!unlockedGates`)
    5. Unpulled Grail Switches (`1`, `2`, `3` in Border Town when not yet pulled)
    6. Sealed Cathedral Door (`M` when `canOpen` is true)
  - **Silent Progression**: Level-ups (`Lv.2`–`Lv.6`) and room transitions update capabilities silently without pop-up banners or HUD tutorial badges.
