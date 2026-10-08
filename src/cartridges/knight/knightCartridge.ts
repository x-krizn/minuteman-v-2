/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { Cartridge, CartridgeSurface } from '../../types/cartridge';
import { GameInput } from '../../types/input';
import { EnemyEntity, KnightState, SkillId } from '../../types/knight';
import { handleAttackInput, handleBlockInput, updateCombat } from './combat';
import {
  COLS,
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  GRAVITY,
  HALF_WIDTH,
  INITIAL_START,
  ITEMS,
  ITEMS_PNG,
  JUMP_VELOCITY,
  KNIGHT_PNG,
  MAX_FALL_SPEED,
  ROWS,
  RUN_SPEED,
  SCREEN_H,
  SCREEN_W,
  SKILLS,
  SPRINT_SPEED,
  STAMINA_REGEN_RATE,
  TILE_SIZE,
  TILES_G_PNG,
  TILES_PNG,
} from './constants';
import { updateEnemies } from './enemies';
import { INITIAL_GREEN, INITIAL_ROOMS } from './levels';
import { moveX, moveY } from './physics';
import { updatePickups } from './pickups';
import { buildFloor } from './proceduralFloor';
import { drawKnightGame } from './renderer';
import { castSkill, spawnParticles, updateParticles, updateProjectiles } from './skills';
import { notifyStateChange, setKnightStateRef } from './stateStore';

export function createKnightCartridge(): Cartridge {
  const rooms: Record<string, string[]> = {};
  const greenRooms: Record<string, number> = {};
  const safeRooms: Record<string, number> = {};

  const ALL_SKILL_IDS: SkillId[] = ['heal', 'fireball', 'whirlwind', 'shockwave'];

  const state: KnightState = {
    room: '0,0',
    rx: 0,
    ry: 0,
    x: 32,
    y: 128,
    vx: 0,
    vy: 0,
    ground: false,
    jumping: false,
    face: 1,
    t: 0,

    hp: 4,
    maxHp: 4,
    ap: 2,
    maxAp: 2,
    ep: 3,
    maxEp: 3,
    sp: 4,
    maxSp: 4,
    spRegenTimer: 0,

    coins: 0,
    keys: 0,
    flasks: 3,
    maxFlasks: 5,
    inventoryOpen: false,

    menuMode: 'play',
    menuIndex: 0,
    invTab: 'gear',
    invIndex: 0,
    menuMsg: '',
    menuMsgT: 0,

    hasDouble: false,
    airJumps: 0,
    coyote: 0,
    buffer: 0,

    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    isSprinting: false,
    dashGhosts: [],

    atk: 0,
    atkCd: 0,
    atkV: 0,
    swung: [],
    chargeTimer: 0,
    isCharging: false,
    isCharged: false,
    isHeavyAttack: false,

    isBlocking: false,
    parryWindow: 0,
    parrySparkTimer: 0,
    blockStun: 0,

    hitstop: 0,

    assignedL: 'heal',
    assignedR: 'fireball',
    skillCdL: 0,
    skillCdR: 0,
    unlockedSkills: ['heal', 'fireball', 'whirlwind', 'shockwave'],

    projectiles: [],
    particles: [],

    inv: 0,
    kb: 0,
    got: {},
    enemies: [],
    picks: [],
    checkpoint: null,
    cleared: 0,
    nextStart: { x: 4, y: 0 },
    floor: null,
    msg: '',
    msgT: 0,
  };

  let fontFamily = 'orion-font, monospace';

  const say = (text: string) => {
    state.msg = text;
    state.msgT = 1.8;
  };

  const enterRoom = (key: string) => {
    state.room = key;
    const [rx, ry] = key.split(',').map(Number);
    state.rx = rx;
    state.ry = ry;
    state.enemies = [];
    state.picks = [];
    state.projectiles = [];
    state.particles = [];

    const roomData = rooms[key];
    if (roomData) {
      roomData.forEach((row, ty) => {
        for (let tx = 0; tx < COLS; tx++) {
          const c = row[tx];
          if (c === 'E') {
            // Determine enemy type based on room location / cleared count
            let type: EnemyEntity['type'] = 'crawler';
            let enemyHp = 2;

            if (state.cleared > 0 || (rx >= 2 && ry === 0)) {
              if (tx % 2 === 0) {
                type = 'sentry';
                enemyHp = 4;
              } else if (ty <= 3) {
                type = 'wisp';
                enemyHp = 2;
              }
            }

            state.enemies.push({
              type,
              x: tx * TILE_SIZE + 8,
              y: (ty + 1) * TILE_SIZE,
              dir: -1,
              hp: enemyHp,
              maxHp: enemyHp,
              stun: 0,
              poise: enemyHp * 2,
            });
          } else if (ITEMS[c] && !state.got[`${key}:${tx},${ty}`]) {
            state.picks.push({
              x: tx * TILE_SIZE + 8,
              y: ty * TILE_SIZE + 8,
              c,
              id: `${key}:${tx},${ty}`,
            });
          }
        }
      });
    }

    if (safeRooms[key] && !(state.checkpoint && state.checkpoint.room === key)) {
      state.checkpoint = { room: key, x: 32, y: 128 };
      state.flasks = state.maxFlasks;
      say('RESTED: FLASKS REFILLED');
      notifyStateChange();
    }
  };

  const respawn = () => {
    const cp = state.checkpoint || INITIAL_START;
    state.x = cp.x;
    state.y = cp.y;
    state.vx = 0;
    state.vy = 0;
    state.hp = state.maxHp;
    state.sp = state.maxSp;
    state.ep = state.maxEp;
    state.flasks = state.maxFlasks;
    state.inv = 0;
    state.kb = 0;
    state.atk = 0;
    state.isDashing = false;
    state.isBlocking = false;
    notifyStateChange();
    enterRoom(cp.room);
  };

  const cycleSkill = (isLeft: boolean) => {
    const current = isLeft ? state.assignedL : state.assignedR;
    const idx = ALL_SKILL_IDS.indexOf(current);
    const nextSkill = ALL_SKILL_IDS[(idx + 1) % ALL_SKILL_IDS.length];
    if (isLeft) {
      state.assignedL = nextSkill;
      say(`L: ${SKILLS[nextSkill].name}`);
    } else {
      state.assignedR = nextSkill;
      say(`R: ${SKILLS[nextSkill].name}`);
    }
    soundSystem.playMenuBeep();
  };

  return {
    id: 'knight',
    name: 'KNIGHT: HYBRID METROID-SOULS',
    version: '0.2',
    description: 'Metroid-Souls with Fighting Game Combat: Jump, Dash/Sprint, Attack/Charge, Block/Parry, Skills.',

    assets: {
      knight: { src: KNIGHT_PNG, cw: 18, ch: 18, frames: 3, fps: 6, ax: 9, ay: 18 },
      tiles: { src: TILES_PNG, cw: 16, ch: 16, frames: 4, rows: 4 },
      tilesG: { src: TILES_G_PNG, cw: 16, ch: 16, frames: 4, rows: 4 },
      items: { src: ITEMS_PNG, cw: 16, ch: 16, frames: 4, rows: 4, ax: 8, ay: 8 },
    },

    init: () => {
      try {
        fontFamily = getComputedStyle(document.body).fontFamily || 'orion-font, monospace';
      } catch {
        // default fallback
      }

      Object.keys(rooms).forEach((k) => delete rooms[k]);
      Object.assign(rooms, JSON.parse(JSON.stringify(INITIAL_ROOMS)));

      Object.keys(greenRooms).forEach((k) => delete greenRooms[k]);
      Object.assign(greenRooms, { ...INITIAL_GREEN });

      Object.keys(safeRooms).forEach((k) => delete safeRooms[k]);

      Object.assign(state, {
        got: {},
        cleared: 0,
        nextStart: { x: 4, y: 0 },
        floor: null,
        hasDouble: false,
        maxHp: 4,
        hp: 4,
        face: 1,
        t: 0,
        maxAp: 2,
        ap: 2,
        maxEp: 3,
        ep: 3,
        maxSp: 4,
        sp: 4,
        coins: 0,
        keys: 0,
        flasks: 3,
        maxFlasks: 5,
        inventoryOpen: false,
        atkV: 0,
        coyote: 0,
        buffer: 0,
        airJumps: 0,
        jumping: false,
        ground: false,
        inv: 0,
        kb: 0,
        atk: 0,
        atkCd: 0,
        swung: [],
        chargeTimer: 0,
        isCharging: false,
        isCharged: false,
        isHeavyAttack: false,
        isBlocking: false,
        parryWindow: 0,
        parrySparkTimer: 0,
        blockStun: 0,
        isDashing: false,
        dashTimer: 0,
        dashCooldown: 0,
        isSprinting: false,
        dashGhosts: [],
        hitstop: 0,
        assignedL: 'heal',
        assignedR: 'fireball',
        skillCdL: 0,
        skillCdR: 0,
        projectiles: [],
        particles: [],
        msg: '',
        msgT: 0,
        checkpoint: null,
      });

      setKnightStateRef(state);
      respawn();
    },

    destroy: () => {
      setKnightStateRef(null);
    },

    update: (input: GameInput, rawDt: number) => {
      if (state.inventoryOpen) {
        return; // Paused while browsing inventory
      }

      const dt = Math.min(rawDt, 0.033);

      // Hitstop freeze frame handling
      if (state.hitstop > 0) {
        state.hitstop -= dt;
        return;
      }

      const sx = input.stick.x;
      const sy = input.stick.y;

      // Update cooldowns & timers
      state.coyote -= dt;
      state.buffer -= dt;
      state.inv -= dt;
      state.kb -= dt;
      state.atk -= dt;
      state.atkCd -= dt;
      state.msgT -= dt;
      state.dashCooldown -= dt;
      state.skillCdL -= dt;
      state.skillCdR -= dt;
      if (state.parrySparkTimer > 0) state.parrySparkTimer -= dt;

      // --- 1. SOULS-LIKE STAMINA REGENERATION ---
      if (!state.isSprinting && !state.isBlocking && !state.isDashing && state.sp < state.maxSp) {
        state.sp = Math.min(state.maxSp, state.sp + STAMINA_REGEN_RATE * dt);
      }

      // --- 2. CONTROLS: B = DASH (TAP) / SPRINT (HOLD) ---
      if (input.pressed.b && state.dashCooldown <= 0 && state.sp >= 1) {
        state.isDashing = true;
        state.dashTimer = DASH_DURATION;
        state.dashCooldown = DASH_COOLDOWN;
        state.sp = Math.max(0, state.sp - 1);
        soundSystem.playDash();
        spawnParticles(state.particles, state.x, state.y - 8, 5, '#ffffff');
      }

      if (state.isDashing) {
        state.dashTimer -= dt;
        state.vx = state.face * DASH_SPEED;
        // Spawn dash ghost
        if (Math.random() < 0.6) {
          state.dashGhosts.push({
            x: state.x,
            y: state.y,
            face: state.face,
            alpha: 1.0,
          });
        }
        if (state.dashTimer <= 0) {
          state.isDashing = false;
        }
      } else if (input.held.b && Math.abs(sx) > 0.1 && state.sp > 0) {
        // Holding B while moving = SPRINT
        state.isSprinting = true;
        state.sp = Math.max(0, state.sp - 1.2 * dt);
      } else {
        state.isSprinting = false;
      }

      // Fade dash ghosts
      state.dashGhosts = state.dashGhosts
        .map((g) => ({ ...g, alpha: g.alpha - dt * 4 }))
        .filter((g) => g.alpha > 0);

      // --- 3. CONTROLS: A = JUMP (VARIABLE HEIGHT & DOUBLE JUMP) ---
      if (input.pressed.a) {
        state.buffer = 0.1;
      }

      if (state.kb <= 0 && !state.isDashing) {
        const moveSpeed = state.isSprinting ? SPRINT_SPEED : RUN_SPEED;
        state.vx = sx * moveSpeed;
        if (sx > 0.1) state.face = 1;
        else if (sx < -0.1) state.face = -1;
      }

      // --- 4. CONTROLS: X = ATTACK & CHARGE ---
      handleAttackInput(state, input.held.x, input.pressed.x, sx, sy, dt, say);

      // --- 5. CONTROLS: Y = BLOCK & PARRY (CAN HOLD) ---
      handleBlockInput(state, input.held.y, input.pressed.y, dt);

      // --- 6. CONTROLS: L & R = ASSIGNABLE SKILL / ITEM ---
      if (input.pressed.l) {
        if (input.held.select || input.held.start) {
          cycleSkill(true);
        } else {
          castSkill(state, state.assignedL, true, say);
        }
      }

      if (input.pressed.r) {
        if (input.held.select || input.held.start) {
          cycleSkill(false);
        } else {
          castSkill(state, state.assignedR, false, say);
        }
      }

      // Jump execution
      if (state.buffer > 0) {
        if (state.coyote > 0) {
          state.vy = -JUMP_VELOCITY;
          state.coyote = 0;
          state.buffer = 0;
          state.jumping = true;
          soundSystem.playJump();
        } else if (state.airJumps > 0) {
          state.vy = -JUMP_VELOCITY;
          state.airJumps--;
          state.buffer = 0;
          state.jumping = true;
          soundSystem.playDoubleJump();
        }
      }

      // Variable jump height
      if (state.jumping && !input.held.a && state.vy < -JUMP_VELOCITY * 0.4) {
        state.vy = -JUMP_VELOCITY * 0.4;
      }
      if (state.vy >= 0) {
        state.jumping = false;
      }

      // Gravity and movement
      state.vy = Math.min(state.vy + GRAVITY * dt, MAX_FALL_SPEED);
      moveX(rooms, state, state.vx * dt);
      moveY(rooms, state, state.vy * dt);

      // Grounding checks
      if (state.ground) {
        state.coyote = 0.08;
        state.airJumps = state.hasDouble ? 1 : 0;
      }
      state.t = state.ground && Math.abs(state.vx) > 1 ? state.t + dt : 0;

      // Room transitions
      if (state.x < 0) {
        state.x += SCREEN_W;
        enterRoom(`${state.rx - 1},${state.ry}`);
      } else if (state.x >= SCREEN_W) {
        state.x -= SCREEN_W;
        enterRoom(`${state.rx + 1},${state.ry}`);
      }
      if (state.y < 0) {
        state.y += SCREEN_H;
        enterRoom(`${state.rx},${state.ry - 1}`);
      } else if (state.y > SCREEN_H) {
        state.y -= SCREEN_H;
        enterRoom(`${state.rx},${state.ry + 1}`);
      }

      // Update projectiles and particles
      updateProjectiles(rooms, state, dt);
      state.particles = updateParticles(state.particles, dt);

      // Update enemies
      updateEnemies(rooms, state, dt);

      // Update combat & collisions
      updateCombat(
        state,
        () => {
          say('YOU DIED');
          soundSystem.playHit();
          respawn();
        },
        say
      );

      // Locked door interaction
      const lx = Math.floor((state.x + state.face * (HALF_WIDTH + 1)) / TILE_SIZE);
      const ly = Math.floor((state.y - 8) / TILE_SIZE);
      const currentRoomData = rooms[state.room];

      if (
        state.keys > 0 &&
        Math.abs(sx) > 0.1 &&
        lx >= 0 &&
        lx < COLS &&
        ly >= 0 &&
        ly < ROWS &&
        currentRoomData &&
        currentRoomData[ly][lx] === 'L' &&
        !state.got[`${state.room}:L`]
      ) {
        state.keys--;
        state.got[`${state.room}:L`] = true;
        state.cleared++;
        soundSystem.playUnlock();
        say(state.room === '2,0' ? 'TUTORIAL CLEARED' : 'FLOOR CLEARED');
        buildFloor(state, rooms, greenRooms, safeRooms);
      }

      // Pickups
      updatePickups(state, say);
    },

    draw: (surface: CartridgeSurface) => {
      drawKnightGame(surface, state, rooms, greenRooms, fontFamily);
    },
  };
}
