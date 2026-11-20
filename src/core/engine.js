import { DEFAULT_TUNING } from './config.js';
import { createRng, round3, distanceXZ, transformMoveByCameraYaw } from './math.js';
import { MAPS } from './maps.js';

export class GameEngine {
  constructor(options = {}) {
    this.seed = options.seed ?? 42;
    this.rng = createRng(this.seed);
    this.night = options.night ?? 1;
    this.map = MAPS[this.night] || MAPS[1];
    this.tuning = { ...DEFAULT_TUNING, ...(options.tuning || {}) };

    this.sim_tick = 0;
    this.state = 'playing'; // 'playing' | 'paused' | 'won' | 'lost'
    this.is_paused = false;
    this.score = 0;
    this.initial_time_left_s = this.map.duration_s || this.tuning.night1_duration_s;
    this.time_left_s = this.initial_time_left_s;

    this.player = {
      pos: [...this.map.spawn],
      vel: [0.0, 0.0, 0.0],
      grounded: true,
      flames: this.tuning.flames,
      carried: 0,
      invuln_ticks: 0,
      pulse_cooldown_ticks: 0,
      dash_cd_ticks: 0,
      dash_ticks: 0,
      dash_dir: [0.0, 1.0],
      facing_dir: [...this.map.facing_dir],
      charm_ticks: 0,
      respawn_wait_ticks: 0,
      is_launched: false
    };

    // Lanterns
    this.lanterns = this.map.lanterns.map((l) => ({
      id: l.id,
      pos: [...l.pos],
      lit: false,
      deposited: 0,
      justLitTick: -1
    }));

    // Charms
    this.charms = (this.map.charms || []).map((c) => ({
      id: c.id,
      pos: [...c.pos],
      available: true,
      respawn_ticks: 0
    }));

    this.motes = [];
    this.shades = [];
    this.drifters = [];
    this.shadeIdCounter = 1;
    this.drifterIdCounter = 1;
    this.moteIdCounter = 1;

    // Wind (Night 3)
    this.wind = {
      active: false,
      dir_deg: 0.0,
      timer: 0
    };
    this.wind_enabled = options.scenario?.wind_enabled !== false;

    // Prev input state
    this.prevInputState = {
      move: [0, 0],
      cam_yaw_deg: 0,
      interact: false,
      pulse: false,
      dash: false,
      jump: false,
      pause: false
    };

    if (options.scenario) {
      this.loadScenario(options.scenario);
    } else {
      this.initDefaultEntities();
    }
  }

  initDefaultEntities() {
    // Motes
    const spawnPoints = this.map.getMoteSpawnPoints ? this.map.getMoteSpawnPoints() : [];
    const initialCount = Math.min(20, spawnPoints.length);
    for (let i = 0; i < initialCount; i++) {
      const pt = spawnPoints[i];
      this.motes.push({
        id: `M${this.moteIdCounter++}`,
        pos: [pt[0], pt[1] ?? 0.0, pt[2]],
        kind: 'random',
        ttl_ticks: 0
      });
    }
  }

  loadScenario(scenario) {
    if (scenario.player) {
      if (Array.isArray(scenario.player.pos)) {
        this.player.pos = [scenario.player.pos[0] ?? 0, scenario.player.pos[1] ?? 0, scenario.player.pos[2] ?? 0];
      }
      if (Array.isArray(scenario.player.vel)) {
        this.player.vel = [scenario.player.vel[0] ?? 0, scenario.player.vel[1] ?? 0, scenario.player.vel[2] ?? 0];
      }
      if (typeof scenario.player.flames === 'number') this.player.flames = scenario.player.flames;
      if (typeof scenario.player.carried === 'number') this.player.carried = scenario.player.carried;
      if (typeof scenario.player.invuln_ticks === 'number') this.player.invuln_ticks = scenario.player.invuln_ticks;
      if (typeof scenario.player.dash_cd_ticks === 'number') this.player.dash_cd_ticks = scenario.player.dash_cd_ticks;
      if (typeof scenario.player.pulse_cd_ticks === 'number') this.player.pulse_cooldown_ticks = scenario.player.pulse_cd_ticks;
      if (typeof scenario.player.charm_ticks === 'number') this.player.charm_ticks = scenario.player.charm_ticks;
    }

    if (typeof scenario.time_left_s === 'number') {
      this.initial_time_left_s = scenario.time_left_s;
      this.time_left_s = scenario.time_left_s;
    }

    if (Array.isArray(scenario.lanterns)) {
      for (const update of scenario.lanterns) {
        const lantern = this.lanterns.find((l) => l.id === update.id);
        if (lantern) {
          if (Array.isArray(update.pos)) lantern.pos = [update.pos[0], update.pos[1], update.pos[2]];
          if (typeof update.deposited === 'number') lantern.deposited = update.deposited;
          if (typeof update.lit === 'boolean') lantern.lit = update.lit;
        }
      }
    }

    if (scenario.random_motes === false) {
      this.motes = [];
      if (Array.isArray(scenario.motes)) {
        scenario.motes.forEach((m) => {
          if (Array.isArray(m)) {
            this.motes.push({ id: `M${this.moteIdCounter++}`, pos: [m[0], m[1] ?? 0, m[2]], kind: 'random', ttl_ticks: 0 });
          } else if (m && typeof m === 'object') {
            const pos = Array.isArray(m.pos) ? [m.pos[0], m.pos[1] ?? 0, m.pos[2]] : [0, 0, 0];
            this.motes.push({
              id: m.id || `M${this.moteIdCounter++}`,
              pos,
              kind: m.kind || 'random',
              ttl_ticks: typeof m.ttl_s === 'number' ? Math.round(m.ttl_s * 60) : 0
            });
          }
        });
      }
    } else {
      this.initDefaultEntities();
    }

    if (scenario.random_shades === false) {
      this.shades = [];
      if (Array.isArray(scenario.shades)) {
        scenario.shades.forEach((s) => {
          if (Array.isArray(s)) {
            this.shades.push({
              id: `S${this.shadeIdCounter++}`,
              pos: [s[0], s[1] ?? 0, s[2]],
              state: 'chase',
              stunned_ticks: 0,
              recoil_ticks: 0
            });
          } else if (s && typeof s === 'object') {
            const pos = Array.isArray(s.pos) ? [s.pos[0], s.pos[1] ?? 0, s.pos[2]] : [0, 0, 0];
            const id = s.id || `S${this.shadeIdCounter++}`;
            const state = s.state || 'chase';
            const stateTicks = s.state_ticks_left || 0;
            this.shades.push({
              id,
              pos,
              state,
              stunned_ticks: state === 'stunned' ? stateTicks : 0,
              recoil_ticks: state === 'recoil' ? stateTicks : 0
            });
          }
        });
      }
    }

    if (Array.isArray(scenario.drifters)) {
      this.drifters = scenario.drifters.map((d, idx) => ({
        id: d.id || `D${idx + 1}`,
        pos: Array.isArray(d.pos) ? [...d.pos] : [0, 0, 0],
        state: d.state || 'idle',
        stolen: d.stolen || 0,
        flee_ticks: 0
      }));
    }

    if (Array.isArray(scenario.charms)) {
      this.charms = scenario.charms.map((c, idx) => ({
        id: c.id || `C${idx + 1}`,
        pos: Array.isArray(c.pos) ? [...c.pos] : [0, 0, 0],
        available: c.available !== false,
        respawn_ticks: typeof c.respawn_s === 'number' ? Math.round(c.respawn_s * 60) : 0
      }));
    }
  }

  step(inputFrame = {}) {
    const currentTick = this.sim_tick + 1;
    const events = [];

    // --- STEP 1: READ INPUT & HANDLE PAUSE ---
    const pausePressed = !!inputFrame.pause && !this.prevInputState.pause;
    this.prevInputState.pause = !!inputFrame.pause;

    if (pausePressed) {
      this.is_paused = !this.is_paused;
      if (this.is_paused) {
        this.state = 'paused';
        events.push({ type: 'event', tick: currentTick, name: 'paused', data: {} });
        return events; // Stop step immediately!
      } else {
        this.state = 'playing';
        events.push({ type: 'event', tick: currentTick, name: 'resumed', data: {} });
      }
    }

    if (this.is_paused) {
      return events;
    }

    if (this.state !== 'playing') {
      return events;
    }

    // --- STEP 2: DECREMENT COUNTERS ---
    this.time_left_s = Math.max(0, this.initial_time_left_s - (this.sim_tick + 1) / 60);

    if (this.player.invuln_ticks > 0) this.player.invuln_ticks--;
    if (this.player.pulse_cooldown_ticks > 0) this.player.pulse_cooldown_ticks--;
    if (this.player.dash_cd_ticks > 0) this.player.dash_cd_ticks--;
    if (this.player.charm_ticks > 0) this.player.charm_ticks--;
    if (this.player.respawn_wait_ticks > 0) this.player.respawn_wait_ticks--;

    // TTL for dropped motes
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      if (m.kind === 'dropped' && m.ttl_ticks > 0) {
        m.ttl_ticks--;
        if (m.ttl_ticks <= 0) {
          this.motes.splice(i, 1);
        }
      }
    }

    // Charms respawn
    for (const c of this.charms) {
      if (!c.available && c.respawn_ticks > 0) {
        c.respawn_ticks--;
        if (c.respawn_ticks <= 0) c.available = true;
      }
    }

    // Wind timer (Night 3)
    if (this.night === 3 && this.wind_enabled) {
      const cycleTick = currentTick % 1800; // 30s cycle
      if (cycleTick >= 1500 && cycleTick < 1800) {
        // Last 5 seconds of 30s is active wind
        this.wind.active = true;
      } else {
        this.wind.active = false;
        if (cycleTick === 0) {
          this.wind.dir_deg = round3(this.rng() * 360);
        }
      }
    }

    // Edge detections
    const interactPressed = !!inputFrame.interact && !this.prevInputState.interact;
    const pulsePressed = !!inputFrame.pulse && !this.prevInputState.pulse;
    const dashPressed = !!inputFrame.dash && !this.prevInputState.dash;
    const jumpPressed = !!inputFrame.jump && !this.prevInputState.jump;
    this.prevInputState.interact = !!inputFrame.interact;
    this.prevInputState.pulse = !!inputFrame.pulse;
    this.prevInputState.dash = !!inputFrame.dash;
    this.prevInputState.jump = !!inputFrame.jump;

    // --- STEP 3: MOVE MÂY (JUMP, DASH, JUMP PAD, WIND, FALL) ---
    if (this.player.respawn_wait_ticks > 0) {
      // In respawn wait: cannot move, cannot pick up, cannot be hit
      if (this.player.respawn_wait_ticks === 1) {
        // Respawn at spawn point
        this.player.pos = [...this.map.spawn];
        this.player.vel = [0.0, 0.0, 0.0];
        this.player.grounded = true;
        this.player.invuln_ticks = 90;
        this.player.is_launched = false;
      }
    } else {
      const move = inputFrame.move || [0, 0];
      const camYawDeg = inputFrame.cam_yaw_deg || 0;
      const [worldDirX, worldDirZ] = transformMoveByCameraYaw(move, camYawDeg);

      if (worldDirX !== 0 || worldDirZ !== 0) {
        this.player.facing_dir = [worldDirX, worldDirZ];
      }

      // Jump
      if (jumpPressed && this.player.grounded) {
        this.player.vel[1] = 7.0;
        this.player.grounded = false;
      }

      // Dash
      if (dashPressed && this.player.dash_cd_ticks <= 0 && this.player.dash_ticks <= 0) {
        this.player.dash_ticks = 12; // 0.2s * 60
        this.player.dash_cd_ticks = this.player.charm_ticks > 0 ? 0 : 90;
        const [dirX, dirZ] = (worldDirX !== 0 || worldDirZ !== 0) ? [worldDirX, worldDirZ] : this.player.facing_dir;
        this.player.dash_dir = [dirX, dirZ];
        events.push({ type: 'event', tick: currentTick, name: 'dash', data: {} });
      }

      // Compute motion
      let moveSpeed = this.player.charm_ticks > 0 ? 7.2 : this.tuning.player_speed;
      if (this.player.dash_ticks > 0) {
        // Dashing: 14 m/s in dash_dir, maintains current Y height
        this.player.dash_ticks--;
        this.player.pos[0] = round3(this.player.pos[0] + this.player.dash_dir[0] * (14.0 / 60));
        this.player.pos[2] = round3(this.player.pos[2] + this.player.dash_dir[1] * (14.0 / 60));
      } else if (this.player.is_launched) {
        // In launch arc from jump pad
        this.player.pos[0] = round3(this.player.pos[0] + this.player.vel[0] / 60);
        this.player.pos[2] = round3(this.player.pos[2] + this.player.vel[2] / 60);
        this.player.vel[1] += -20.0 / 60; // gravity -20 m/s^2
        this.player.pos[1] = round3(this.player.pos[1] + this.player.vel[1] / 60);
      } else {
        // Normal motion
        let vx = worldDirX * moveSpeed;
        let vz = worldDirZ * moveSpeed;

        if (this.wind.active) {
          const wRad = (this.wind.dir_deg * Math.PI) / 180;
          vx += 2.0 * Math.cos(wRad);
          vz += 2.0 * Math.sin(wRad);
        }

        this.player.pos[0] = round3(this.player.pos[0] + vx / 60);
        this.player.pos[2] = round3(this.player.pos[2] + vz / 60);

        if (!this.player.grounded) {
          this.player.vel[1] += -20.0 / 60;
          this.player.pos[1] = round3(this.player.pos[1] + this.player.vel[1] / 60);
        }
      }

      // Ground & fall check
      const groundY = this.map.getGround(this.player.pos[0], this.player.pos[2]);
      if (groundY === null) {
        // Over void / off island!
        this.player.grounded = false;
        if (this.player.dash_ticks <= 0) {
          // If not dashing, gravity pulls down
          this.player.vel[1] += -20.0 / 60;
          this.player.pos[1] = round3(this.player.pos[1] + this.player.vel[1] / 60);
        }

        if (this.player.pos[1] < -10.0) {
          // Fall off island!
          this.player.flames -= 1;
          const lost = this.player.carried;
          this.player.carried = 0;
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'player_hit',
            data: {
              by: 'fall',
              flames: this.player.flames,
              dropped: 0,
              lost
            }
          });

          if (this.player.flames <= 0) {
            this.state = 'lost';
            events.push({
              type: 'event',
              tick: currentTick,
              name: 'game_over',
              data: { result: 'lost', reason: 'no_flames' }
            });
          } else {
            this.player.respawn_wait_ticks = 60;
          }
        }
      } else {
        // Ground exists
        if (this.player.pos[1] <= groundY) {
          this.player.pos[1] = groundY;
          this.player.vel[1] = 0.0;
          this.player.grounded = true;
          this.player.is_launched = false;
        }

        // Jump pads trigger
        if (this.map.jumpPads && this.player.grounded) {
          for (const pad of this.map.jumpPads) {
            const dist = distanceXZ(this.player.pos, pad.pos);
            if (dist <= pad.radius) {
              this.player.is_launched = true;
              this.player.grounded = false;
              this.player.vel[1] = pad.vy;

              if (pad.fixedDir) {
                this.player.vel[0] = pad.fixedDir[0] * pad.vHoriz;
                this.player.vel[2] = pad.fixedDir[1] * pad.vHoriz;
              } else if (pad.target) {
                const dx = pad.target[0] - pad.pos[0];
                const dz = pad.target[2] - pad.pos[2];
                const len = Math.hypot(dx, dz) || 1;
                this.player.vel[0] = (dx / len) * pad.vHoriz;
                this.player.vel[2] = (dz / len) * pad.vHoriz;
              }
              break;
            }
          }
        }
      }
    }

    // --- STEP 4: PICKUP MOTES & CHARMS ---
    if (this.state === 'playing' && this.player.respawn_wait_ticks <= 0) {
      // Charms
      for (const c of this.charms) {
        if (c.available) {
          const dXZ = distanceXZ(this.player.pos, c.pos);
          const dY = Math.abs(this.player.pos[1] - c.pos[1]);
          if (dXZ <= 1.0 && dY <= 1.5) {
            c.available = false;
            c.respawn_ticks = 2700;
            this.player.charm_ticks = 600;
            events.push({
              type: 'event',
              tick: currentTick,
              name: 'charm_picked',
              data: { charm_id: c.id, charm_ticks: 600 }
            });
          }
        }
      }

      // Motes
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const m = this.motes[i];
        const dXZ = distanceXZ(this.player.pos, m.pos);
        const dY = Math.abs(this.player.pos[1] - m.pos[1]);
        if (dXZ <= this.tuning.pickup_radius && dY <= 1.5 && this.player.carried < this.tuning.carry_capacity) {
          this.player.carried += 1;
          this.score += this.tuning.score.per_mote;
          this.motes.splice(i, 1);
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'mote_picked',
            data: { carried: this.player.carried }
          });
        }
      }
    }

    // --- STEP 5: INTERACT WITH LANTERN ---
    if (interactPressed && this.player.carried > 0 && this.state === 'playing') {
      let eligible = [];
      for (const lantern of this.lanterns) {
        if (!lantern.lit) {
          const dist = distanceXZ(this.player.pos, lantern.pos);
          if (dist <= this.tuning.interact_radius) {
            eligible.push({ lantern, dist });
          }
        }
      }

      if (eligible.length > 0) {
        // Sort closest first, tie-break by smaller id
        eligible.sort((a, b) => {
          if (Math.abs(a.dist - b.dist) > 0.0001) return a.dist - b.dist;
          return a.lantern.id.localeCompare(b.lantern.id);
        });

        const target = eligible[0].lantern;
        const needed = this.tuning.lantern_cost - target.deposited;
        const amount = Math.min(this.player.carried, needed);

        if (amount > 0) {
          this.player.carried -= amount;
          target.deposited += amount;
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'deposit',
            data: { lantern_id: target.id, amount, deposited: target.deposited }
          });

          if (target.deposited >= this.tuning.lantern_cost) {
            target.lit = true;
            target.justLitTick = currentTick;
            this.score += this.tuning.score.per_lantern;
            events.push({
              type: 'event',
              tick: currentTick,
              name: 'lantern_lit',
              data: { lantern_id: target.id }
            });

            if (this.lanterns.every((l) => l.lit)) {
              this.state = 'won';
              const secondsLeftBonus = Math.floor(this.time_left_s) * this.tuning.score.per_second_left;
              const flamesLeftBonus = this.player.flames * this.tuning.score.per_flame_left;
              this.score += secondsLeftBonus + flamesLeftBonus;
              events.push({
                type: 'event',
                tick: currentTick,
                name: 'game_over',
                data: { result: 'won', reason: 'all_lit' }
              });
            }
          }
        }
      }
    }

    // --- STEP 6: UPDATE SAFE ZONE ---
    for (const shade of this.shades) {
      for (const l of this.lanterns) {
        if (l.lit) {
          const dLantern = distanceXZ(shade.pos, l.pos);
          if (l.justLitTick >= 0 && currentTick - l.justLitTick <= 30 && dLantern < this.tuning.safe_radius) {
            // Push shade out to edge over <= 30 ticks
            const dx = shade.pos[0] - l.pos[0];
            const dz = shade.pos[2] - l.pos[2];
            const len = Math.hypot(dx, dz) || 1;
            shade.pos[0] = round3(l.pos[0] + (dx / len) * this.tuning.safe_radius);
            shade.pos[2] = round3(l.pos[2] + (dz / len) * this.tuning.safe_radius);
            shade.safePushActive = true;
          } else {
            shade.safePushActive = false;
          }
        }
      }
    }

    // --- STEP 7: PULSE ---
    if (pulsePressed && this.state === 'playing') {
      if (this.player.pulse_cooldown_ticks <= 0 && this.player.carried >= this.tuning.pulse_cost) {
        this.player.carried -= this.tuning.pulse_cost;
        this.player.pulse_cooldown_ticks = Math.round(this.tuning.pulse_cooldown_s * 60);

        const pulseCenter = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];
        const stunnedIds = [];

        // Hit Shades
        for (const shade of this.shades) {
          const dx = shade.pos[0] - pulseCenter[0];
          const dy = shade.pos[1] - pulseCenter[1];
          const dz = shade.pos[2] - pulseCenter[2];
          const dist3D = Math.hypot(dx, dy, dz);

          if (dist3D <= this.tuning.pulse_radius) {
            shade.stunned_ticks = Math.round(this.tuning.pulse_stun_s * 60);
            shade.state = 'stunned';
            shade.push_ticks_left = 15;
            stunnedIds.push(shade.id);
            this.score += this.tuning.score.per_stun;

            // Push direction
            const dXZ = Math.hypot(dx, dz);
            if (dXZ > 0.0001) {
              shade.push_vel = [(dx / dXZ) * (4.0 / 15), (dz / dXZ) * (4.0 / 15)];
            } else {
              shade.push_vel = [4.0 / 15, 0.0]; // +X if coincident
            }
          }
        }

        // Hit Drifters
        for (const drifter of this.drifters) {
          const dx = drifter.pos[0] - pulseCenter[0];
          const dy = drifter.pos[1] - pulseCenter[1];
          const dz = drifter.pos[2] - pulseCenter[2];
          if (Math.hypot(dx, dy, dz) <= this.tuning.pulse_radius) {
            if (drifter.state === 'chase') {
              drifter.state = 'flee';
              drifter.flee_ticks = 240;
            } else if (drifter.state === 'flee' && drifter.stolen > 0) {
              // Drop all stolen motes at current spot
              const dropCount = drifter.stolen;
              drifter.stolen = 0;
              drifter.flee_ticks = 120;
              for (let i = 0; i < dropCount; i++) {
                this.motes.push({
                  id: `M${this.moteIdCounter++}`,
                  pos: [...drifter.pos],
                  kind: 'dropped',
                  ttl_ticks: 480
                });
              }
              events.push({
                type: 'event',
                tick: currentTick,
                name: 'drifter_drop',
                data: { drifter_id: drifter.id, amount: dropCount }
              });
            }
          }
        }

        events.push({
          type: 'event',
          tick: currentTick,
          name: 'pulse',
          data: { stunned_ids: stunnedIds }
        });
      }
    }

    // --- STEP 8: MOVE SHADES AND DRIFTERS ---
    if (this.state === 'playing') {
      // Drifters motion
      for (let i = this.drifters.length - 1; i >= 0; i--) {
        const d = this.drifters[i];
        if (d.state === 'idle') {
          // Check transition to chase
          const distToPlayer = distanceXZ(d.pos, this.player.pos);
          if (this.player.carried >= 5 && distToPlayer <= 15.0) {
            d.state = 'chase';
          }
        } else if (d.state === 'chase') {
          const distToPlayer = distanceXZ(d.pos, this.player.pos);
          if (this.player.carried < 5 || distToPlayer > 18.0) {
            d.state = 'idle';
          } else {
            // Move toward player at 7 m/s
            const dx = this.player.pos[0] - d.pos[0];
            const dz = this.player.pos[2] - d.pos[2];
            const len = Math.hypot(dx, dz) || 1;
            d.pos[0] = round3(d.pos[0] + (dx / len) * (7.0 / 60));
            d.pos[2] = round3(d.pos[2] + (dz / len) * (7.0 / 60));
          }
        } else if (d.state === 'flee') {
          // Fly away from player at 7 m/s
          const dx = d.pos[0] - this.player.pos[0];
          const dz = d.pos[2] - this.player.pos[2];
          const len = Math.hypot(dx, dz) || 1;
          d.pos[0] = round3(d.pos[0] + (dx / len) * (7.0 / 60));
          d.pos[2] = round3(d.pos[2] + (dz / len) * (7.0 / 60));
          d.flee_ticks--;
          if (d.flee_ticks <= 0) {
            d.state = 'removed';
            this.drifters.splice(i, 1);
          }
        }
      }

      // Shades motion
      for (const shade of this.shades) {
        if (shade.stunned_ticks > 0) {
          shade.stunned_ticks--;
          if (shade.push_ticks_left > 0 && shade.push_vel) {
            shade.pos[0] = round3(shade.pos[0] + shade.push_vel[0]);
            shade.pos[2] = round3(shade.pos[2] + shade.push_vel[1]);
            shade.push_ticks_left--;
          }
          if (shade.stunned_ticks === 0) {
            shade.state = 'wander';
          }
        } else if (shade.recoil_ticks > 0) {
          shade.recoil_ticks--;
          if (shade.recoil_vel) {
            shade.pos[0] = round3(shade.pos[0] + shade.recoil_vel[0]);
            shade.pos[2] = round3(shade.pos[2] + shade.recoil_vel[1]);
          }
          if (shade.recoil_ticks === 0) {
            shade.state = 'wander';
          }
        } else {
          // Detection / give up chase
          const distToPlayer = distanceXZ(shade.pos, this.player.pos);
          if (distToPlayer <= 12.0) {
            shade.state = 'chase';
          } else if (distToPlayer > 18.0) {
            shade.state = 'wander';
          }

          if (shade.state === 'chase') {
            const dx = this.player.pos[0] - shade.pos[0];
            const dz = this.player.pos[2] - shade.pos[2];
            const len = Math.hypot(dx, dz) || 1;
            const speed = this.map.shadeSpeed || this.tuning.shade_speed;
            const step = speed / 60;
            const nextX = shade.pos[0] + (dx / len) * Math.min(len, step);
            const nextZ = shade.pos[2] + (dz / len) * Math.min(len, step);

            // Safe zone check (blocked at 6m)
            let blocked = false;
            for (const lantern of this.lanterns) {
              if (lantern.lit) {
                if (Math.hypot(nextX - lantern.pos[0], nextZ - lantern.pos[2]) < this.tuning.safe_radius) {
                  blocked = true;
                  break;
                }
              }
            }
            if (!blocked) {
              shade.pos[0] = round3(nextX);
              shade.pos[2] = round3(nextZ);
            }
          }
        }
      }
    }

    // --- STEP 9: TOUCH (DRIFTER FIRST, THEN SHADE IN ASCENDING ID ORDER) ---
    if (this.state === 'playing' && this.player.respawn_wait_ticks <= 0) {
      // 1. Drifter Steal
      for (const d of this.drifters) {
        if (d.state === 'chase' && distanceXZ(d.pos, this.player.pos) <= 1.2) {
          const stolen = Math.min(3, this.player.carried);
          this.player.carried -= stolen;
          d.stolen = stolen;
          d.state = 'flee';
          d.flee_ticks = 240;
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'drifter_steal',
            data: { drifter_id: d.id, amount: stolen, carried: this.player.carried }
          });
        }
      }

      // 2. Shades hit (max 1 flame lost per tick)
      let flameLostThisTick = false;
      const sortedShades = [...this.shades].sort((a, b) => a.id.localeCompare(b.id));

      for (const shade of sortedShades) {
        if (shade.state === 'chase' && !shade.safePushActive) {
          const dXZ = distanceXZ(shade.pos, this.player.pos);
          const dY = Math.abs(shade.pos[1] - this.player.pos[1]);

          if (dXZ <= this.tuning.shade_hit_radius && dY <= 1.5) {
            // Apply recoil (2m back over 60 ticks)
            const dx = shade.pos[0] - this.player.pos[0];
            const dz = shade.pos[2] - this.player.pos[2];
            const len = Math.hypot(dx, dz) || 1;
            shade.state = 'recoil';
            shade.recoil_ticks = 60;
            shade.recoil_vel = [(dx / len) * (2.0 / 60), (dz / len) * (2.0 / 60)];

            if (this.player.invuln_ticks <= 0 && !flameLostThisTick) {
              flameLostThisTick = true;
              this.player.flames -= 1;
              this.player.invuln_ticks = 90;

              const droppedCount = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
              this.player.carried -= droppedCount;

              // Scatter dropped motes on ring 1.5 - 2.5m around Mây (TTL = 480)
              for (let i = 0; i < droppedCount; i++) {
                const angle = this.rng() * Math.PI * 2;
                const r = 1.5 + this.rng() * 1.0;
                this.motes.push({
                  id: `M${this.moteIdCounter++}`,
                  pos: [
                    round3(this.player.pos[0] + r * Math.cos(angle)),
                    round3(this.player.pos[1]),
                    round3(this.player.pos[2] + r * Math.sin(angle))
                  ],
                  kind: 'dropped',
                  ttl_ticks: 480
                });
              }

              events.push({
                type: 'event',
                tick: currentTick,
                name: 'player_hit',
                data: {
                  by: 'shade',
                  flames: this.player.flames,
                  dropped: droppedCount
                }
              });

              if (this.player.flames <= 0) {
                this.state = 'lost';
                events.push({
                  type: 'event',
                  tick: currentTick,
                  name: 'game_over',
                  data: { result: 'lost', reason: 'no_flames' }
                });
                break;
              }
            }
          }
        }
      }
    }

    // --- STEP 10: SPAWN ENTITIES ACCORDING TO SCHEDULE ---
    if (this.state === 'playing') {
      // Motes spawn (at ticks 240, 480, ...)
      if (currentTick % 240 === 0 && this.motes.length < 30) {
        const spawnPoints = this.map.getMoteSpawnPoints ? this.map.getMoteSpawnPoints() : [];
        for (const pt of spawnPoints) {
          const occupied = this.motes.some((m) => distanceXZ(m.pos, pt) < 2.0);
          if (!occupied) {
            this.motes.push({
              id: `M${this.moteIdCounter++}`,
              pos: [pt[0], pt[1] ?? 0.0, pt[2]],
              kind: 'random',
              ttl_ticks: 0
            });
            break;
          }
        }
      }

      // Shades spawn
      if (currentTick === 300) {
        // Spawn 2 shades
        const shadePoints = this.map.getShadeSpawnPoints ? this.map.getShadeSpawnPoints() : [];
        let count = 0;
        for (const pt of shadePoints) {
          if (distanceXZ(this.player.pos, pt) >= 15.0) {
            const sid = `S${this.shadeIdCounter++}`;
            this.shades.push({ id: sid, pos: [...pt], state: 'chase', stunned_ticks: 0, recoil_ticks: 0 });
            events.push({ type: 'event', tick: currentTick, name: 'shade_spawned', data: { id: sid } });
            count++;
            if (count >= 2) break;
          }
        }
      } else if (currentTick > 300 && (currentTick - 300) % (this.map.shadeIntervalTicks || 480) === 0) {
        if (this.shades.length < (this.map.maxShades || 6)) {
          const shadePoints = this.map.getShadeSpawnPoints ? this.map.getShadeSpawnPoints() : [];
          for (const pt of shadePoints) {
            if (distanceXZ(this.player.pos, pt) >= 15.0) {
              const sid = `S${this.shadeIdCounter++}`;
              this.shades.push({ id: sid, pos: [...pt], state: 'chase', stunned_ticks: 0, recoil_ticks: 0 });
              events.push({ type: 'event', tick: currentTick, name: 'shade_spawned', data: { id: sid } });
              break;
            }
          }
        }
      }

      // Drifters spawn (Night 2 and 3: tick 1200, 2400...)
      if ((this.night === 2 || this.night === 3) && currentTick % 1200 === 0 && this.drifters.length < 2) {
        const did = `D${this.drifterIdCounter++}`;
        const angle = this.rng() * Math.PI * 2;
        const r = 25.0;
        this.drifters.push({
          id: did,
          pos: [round3(r * Math.cos(angle)), 1.0, round3(r * Math.sin(angle))],
          state: 'idle',
          stolen: 0,
          flee_ticks: 0
        });
      }
    }

    // --- STEP 11: WIN / LOSE CHECK ---
    if (this.state === 'playing') {
      if (this.player.flames <= 0) {
        this.state = 'lost';
        events.push({ type: 'event', tick: currentTick, name: 'game_over', data: { result: 'lost', reason: 'no_flames' } });
      } else if (this.lanterns.every((l) => l.lit)) {
        this.state = 'won';
        const secondsLeftBonus = Math.floor(this.time_left_s) * this.tuning.score.per_second_left;
        const flamesLeftBonus = this.player.flames * this.tuning.score.per_flame_left;
        this.score += secondsLeftBonus + flamesLeftBonus;
        events.push({ type: 'event', tick: currentTick, name: 'game_over', data: { result: 'won', reason: 'all_lit' } });
      } else if (this.time_left_s <= 0) {
        this.state = 'lost';
        events.push({ type: 'event', tick: currentTick, name: 'game_over', data: { result: 'lost', reason: 'dawn' } });
      }
    }

    this.sim_tick = currentTick;
    return events;
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.sim_tick,
      sim_tick: this.sim_tick,
      night: this.night,
      state: this.state,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      wind: {
        active: this.wind.active,
        dir_deg: this.wind.dir_deg
      },
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        vel: [round3(this.player.vel[0]), round3(this.player.vel[1]), round3(this.player.vel[2])],
        grounded: this.player.grounded,
        flames: this.player.flames,
        carried: this.player.carried,
        invuln: this.player.invuln_ticks > 0,
        dash_cd_s: round3(this.player.dash_cd_ticks / 60),
        pulse_cd_s: round3(this.player.pulse_cooldown_ticks / 60),
        charm_s: round3(this.player.charm_ticks / 60)
      },
      lanterns: this.lanterns.map((l) => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited
      })),
      shades: this.shades.map((s) => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state
      })),
      drifters: this.drifters.map((d) => ({
        id: d.id,
        pos: [round3(d.pos[0]), round3(d.pos[1]), round3(d.pos[2])],
        state: d.state,
        stolen: d.stolen
      })),
      charms: this.charms.map((c) => ({
        id: c.id,
        available: c.available,
        respawn_s: round3(c.respawn_ticks / 60)
      })),
      motes: this.motes.map((m) => ({
        id: m.id,
        pos: [round3(m.pos[0]), round3(m.pos[1]), round3(m.pos[2])],
        kind: m.kind,
        ttl_s: round3(m.ttl_ticks / 60)
      })),
      motes_active: this.motes.length
    };
  }

  getEnd() {
    return {
      type: 'end',
      ticks: this.sim_tick,
      state: this.state,
      score: this.score
    };
  }
}
