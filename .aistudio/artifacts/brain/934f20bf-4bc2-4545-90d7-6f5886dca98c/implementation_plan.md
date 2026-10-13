# Modular Character Architecture & 4-Frame Proto Knight

Establishes an entry-driven character system under `database/characters/` for player and NPC knight archetypes, defining base stats, movement velocities, sprite configurations, and starting loadouts, while integrating the updated 4-frame `proto_knight` animation cycle.

> [!IMPORTANT]
> **User Decisions Confirmed**:
> 1. **Directory Location**: Stored in `src/cartridges/knight/database/characters/` with dedicated entry files for player and NPC archetypes.
> 2. **Character Specification Contract**: Defines base stats (`hp`, `ap`, `ep`, `sp`, `flasks`), movement velocities (run speed, sprint speed, dash speed, jump velocity), sprite configuration (sheet URI, frame dimensions, FPS, anchor), and initial equipment loadout.
> 3. **Enemy Knight Combat Behavior**: Mirrors player abilities with state-machine AI for patrolling, shield blocking/parrying, and telegraphed melee attacks.
> 4. **Updated 4-Frame Sprite**: Upgrades the knight walk cycle from 3 frames to 4 frames (72x18 sprite sheet: standing, forward stride, passing stride, reverse stride).

---

## 1. Overview & Core Concept

### What It Delivers
- **`proto_knight.ts`**: The canonical player character archetype definition. Centralizes the previously hardcoded player constants (`hp: 4`, `sp: 4`, `ep: 3`, `ap: 2`, `flasks: 3`, movement speeds, jump velocity, starting weapon `short_sword`, and starter skills `heal` & `fireball`).
- **`enemy_knight.ts`**: Hostile rival knight archetype. Shares the knight silhouette and physical footprint, equipped with a sword and shield, featuring reactive AI (alert patrol, shield block when attacked, and thrust/slash combos).
- **Auto-Discovery Registry**: `database/characters/index.ts` scanning via `import.meta.glob('./**/*.ts')`, exposing `CHARACTER_REGISTRY` and helper `getCharacterDefinition(id)`.
- **4-Frame Animation Engine**: Replaces the 3-frame legacy sprite asset with the 4-frame walk cycle, adjusting frame duration (`fps: 8`) and frame width (18px) for natural, fluid locomotion.

---

## 2. User Experience & Visual Design

### Animation & Visual Motion
- **4-Frame Locomotion**: The new walk cycle features a 4-step sequence:
  - Frame 0: Upright neutral stance
  - Frame 1: Right leg forward stride
  - Frame 2: Upright passing leg transition
  - Frame 3: Left leg forward stride
- **Visual Feedback**:
  - Player knight retains smooth turn flipping (`face: 1 | -1`).
  - Enemy knights render with distinct armor tinting or pauldron shading while maintaining equal hitbox clarity.
  - Blocking and parrying sparks trigger identically for both player and enemy knights.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Dedicated `database/characters/` vs. Merging into `enemies/`
- **Chosen Approach**: Create a dedicated `database/characters/` directory housing player and NPC archetypes (`proto_knight.ts`, `enemy_knight.ts`), matching the existing database pattern (`items/`, `skills/`, `world/`).
- **Why**: Keeps the player's core identity and stats entry-driven, making future class selection or character skins straightforward, while allowing enemy knights to inherit or reference shared humanoid traits.
- **Alternatives Considered**: Putting `proto_knight` in `knightCartridge.ts` as constants. Rejected because it violates the modular entry-driven architecture of the project.

### Decision 2: Enemy Knight Behavior Architecture
- **Chosen Approach**: Enemy knights use a modular state machine in `enemies.ts` that mirrors player mechanics:
  - **Patrol**: Pace territory until the player enters detection radius.
  - **Engagement & Standoff**: Advance to melee distance with occasional shield raises (blocking player slashes).
  - **Telegraphed Attack**: Charge attack with visual anticipation before striking, vulnerable to player parry.
- **Why**: Delivers true fighting-game / Metroid-Souls dueling dynamics rather than simple crawler hazard collisions.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│               src/cartridges/knight/database/characters/              │
├────────────────────────────────┬───────────────────────────────────────┤
│        proto_knight.ts         │            enemy_knight.ts            │
│  - ID: 'proto_knight'          │  - ID: 'enemy_knight'                 │
│  - Base HP: 4, AP: 2, SP: 4    │  - Base HP: 5, Poise: 3               │
│  - Speeds: Run 80, Sprint 120  │  - Weapon: 'short_sword'              │
│  - 4-Frame Sprite Sheet        │  - AI: Patrol, Block, Slash           │
│  - Loadout: 'short_sword'      │  - Drops: Coins / Emerald             │
└────────────────────────────────┴───────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Character Registry (index.ts)                       │
│    ALL_CHARACTERS, CHARACTER_REGISTRY, getCharacterDefinition(id)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
          ┌────────────────────────┴────────────────────────┐
          ▼                                                 ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│      knightCartridge.ts       │         │       enemies.ts / AI         │
│  - Initializes player stats   │         │  - Enemy knight state machine │
│  - Configures 4-frame sprite  │         │  - Shield parry / attack wind │
└───────────────────────────────┘         └───────────────────────────────┘
```

### Character Definition Contract (`CharacterDefinition`)

```typescript
export interface CharacterDefinition extends BaseEntry {
  id: string; // 'proto_knight', 'enemy_knight'
  name: string;
  category: 'player' | 'enemy' | 'npc';
  description?: string;
  lore?: string;

  stats: {
    hp: number;
    maxHp: number;
    ap: number;
    maxAp: number;
    ep: number;
    maxEp: number;
    sp: number;
    maxSp: number;
    flasks?: number;
    maxFlasks?: number;
    poise?: number;
  };

  movement: {
    runSpeed: number;
    sprintSpeed: number;
    dashSpeed: number;
    jumpVelocity: number;
    gravity: number;
  };

  sprite: {
    sheetUri: string;
    frameWidth: number;
    frameHeight: number;
    frames: number;
    fps: number;
    anchorX: number;
    anchorY: number;
  };

  startingLoadout?: {
    weapon: string;
    shield?: string;
    skills?: {
      assignedL: SkillId;
      assignedR: SkillId;
    };
  };

  ai?: {
    detectionRange: number;
    attackRange: number;
    blockChance: number;
    parryWindow: number;
    patrolSpeed: number;
  };
}
```

### Implementation Steps
1. **Extend Type Contract**:
   - Add `CharacterDefinition` interface and relevant character types to `src/cartridges/knight/types.ts`.
2. **Encode 4-Frame Sprite Sheet**:
   - Encode the 4-frame `proto_knight` sprite (72x18 PNG) into base64 in `src/cartridges/knight/assets/sprites.ts`.
   - Update cartridge asset definition to `{ cw: 18, ch: 18, frames: 4, fps: 8, ax: 9, ay: 18 }`.
3. **Build Character Database**:
   - Create `src/cartridges/knight/database/characters/proto_knight.ts`.
   - Create `src/cartridges/knight/database/characters/enemy_knight.ts`.
   - Create `src/cartridges/knight/database/characters/index.ts` with dynamic auto-discovery and exports in `database/index.ts`.
4. **Integrate Player Initialization**:
   - In `knightCartridge.ts`, initialize player state variables (`hp`, `sp`, `ep`, `ap`, `flasks`, speeds, starting weapon) from `getCharacterDefinition('proto_knight')`.
5. **Implement Enemy Knight AI**:
   - In `enemies.ts`, add enemy knight behavior handler (patrol, alert, block/shield raise, and telegraphed swing).
   - Register enemy knight in `database/enemies/` so it can be spawned procedural or statically in dungeon rooms.
6. **Verification**:
   - Run `compile_applet` and `lint_applet` to ensure zero compilation regressions and smooth animation.
