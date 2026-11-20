import { DEFAULT_TUNING } from './config.js';
import { createRng, round3, round1, distanceXZ, transformMoveByCameraYaw } from './math.js';
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
      capacity: this.tuning.carry_capacity,
      successful_lights: 0,
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
      fuel: 0.0,
      fuel_units: 0,
      ever_lit: false,
      relit_count: 0,
      safePushTick: -1
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
      if (typeof scenario.player.successful_lights === 'number') {
        this.player.successful_lights = scenario.player.successful_lights;
        this.player.capacity = Math.min(this.tuning.capacity_max, 10 + 2 * this.player.successful_lights);
      }
      if (typeof scenario.player.capacity === 'number') {
        this.player.capacity = scenario.player.capacity;
      }
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
          if (typeof update.ever_lit === 'boolean') lantern.ever_lit = update.ever_lit;
          if (typeof update.relit_count === 'number') lantern.relit_count = update.relit_count;

          if (typeof update.fuel === 'number') {
            lantern.fuel = update.fuel;
            lantern.fuel_units = Math.round(update.fuel * 60);
          } else if (update.lit === true) {
            lantern.fuel = 100.0;
            lantern.fuel_units = 6000;
            lantern.ever_lit = true;
          }
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
              target_lantern_id: null,
              drain_ticks: 0,
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
              target_lantern_id: s.target_lantern_id || null,
              drain_ticks: s.drain_ticks || 0,
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
        return events;
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

    // --- STEP 2: DECREMENT COUNTERS & FUEL DECAY / DRAIN ---
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
        this.wind.active = true;
      } else {
        this.wind.active = false;
        if (cycleTick === 0) {
          this.wind.dir_deg = round3(this.rng() * 360);
        }
      }
    }

    // Lantern Fuel Decay (1.0/s) & Shade Drain (5.0/s per shade)
    for (const lantern of this.lanterns) {
      if (lantern.lit) {
        let decayUnits = 1; // 1/60th per tick

        const drainingShades = this.shades.filter(
          (s) => s.state === 'drain' && s.target_lantern_id === lantern.id
        );
        decayUnits += drainingShades.length * 5; // 5/60th per shade

        lantern.fuel_units = Math.max(0, lantern.fuel_units - decayUnits);
        lantern.fuel = lantern.fuel_units / 60;

        // Emit fuel_drain event every 60 ticks per draining shade
        for (const shade of drainingShades) {
          shade.drain_ticks = (shade.drain_ticks || 0) + 1;
          if (shade.drain_ticks % 60 === 0) {
            events.push({
              type: 'event',
              tick: currentTick,
              name: 'fuel_drain',
              data: {
                lantern_id: lantern.id,
                shade_id: shade.id,
                fuel: round1(lantern.fuel)
              }
            });
          }
        }

        // Extinguish when fuel <= 0
        if (lantern.fuel_units <= 0) {
          lantern.lit = false;
          lantern.deposited = 0;
          lantern.fuel = 0.0;
          lantern.fuel_units = 0;
          lantern.ever_lit = true;

          events.push({
            type: 'event',
            tick: currentTick,
            name: 'lantern_out',
            data: { lantern_id: lantern.id }
          });

          // Shades draining this lantern return to wander
          for (const shade of drainingShades) {
            shade.state = 'wander';
            shade.target_lantern_id = null;
            shade.drain_ticks = 0;
          }
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
      if (this.player.respawn_wait_ticks === 1) {
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

      // Motion computation
      let moveSpeed = this.player.charm_ticks > 0 ? 7.2 : this.tuning.player_speed;
      if (this.player.dash_ticks > 0) {
        this.player.dash_ticks--;
        this.player.pos[0] = round3(this.player.pos[0] + this.player.dash_dir[0] * (14.0 / 60));
        this.player.pos[2] = round3(this.player.pos[2] + this.player.dash_dir[1] * (14.0 / 60));
      } else if (this.player.is_launched) {
        this.player.pos[0] = round3(this.player.pos[0] + this.player.vel[0] / 60);
        this.player.pos[2] = round3(this.player.pos[2] + this.player.vel[2] / 60);
        this.player.vel[1] += -20.0 / 60;
        this.player.pos[1] = round3(this.player.pos[1] + this.player.vel[1] / 60);
      } else {
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
        this.player.grounded = false;
        if (this.player.dash_ticks <= 0) {
          this.player.vel[1] += -20.0 / 60;
          this.player.pos[1] = round3(this.player.pos[1] + this.player.vel[1] / 60);
        }

        if (this.player.pos[1] < -10.0) {
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

      // Motes (dynamic capacity limit, scoring on deposit per Contract v1.2)
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const m = this.motes[i];
        const dXZ = distanceXZ(this.player.pos, m.pos);
        const dY = Math.abs(this.player.pos[1] - m.pos[1]);
        if (dXZ <= this.tuning.pickup_radius && dY <= 1.5 && this.player.carried < this.player.capacity) {
          this.player.carried += 1;
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

    // --- STEP 5: INTERACT WITH LANTERN (NEW LIGHT, RELIGHT, OR REFUEL) ---
    if (interactPressed && this.player.carried > 0 && this.state === 'playing') {
      let eligible = [];
      for (const lantern of this.lanterns) {
        const dist = distanceXZ(this.player.pos, lantern.pos);
        if (dist <= this.tuning.interact_radius) {
          if (!lantern.lit) {
            const cost = lantern.ever_lit ? this.tuning.relight_cost : this.tuning.lantern_cost;
            if (lantern.deposited < cost) {
              eligible.push({ lantern, dist, type: 'light' });
            }
          } else {
            if (lantern.fuel < 100) {
              eligible.push({ lantern, dist, type: 'refuel' });
            }
          }
        }
      }

      if (eligible.length > 0) {
        eligible.sort((a, b) => {
          if (Math.abs(a.dist - b.dist) > 0.0001) return a.dist - b.dist;
          return a.lantern.id.localeCompare(b.lantern.id);
        });

        const selected = eligible[0];
        const target = selected.lantern;

        if (selected.type === 'refuel') {
          // Refuel lit lantern
          const used = Math.min(this.player.carried, Math.ceil((100 - target.fuel) / 10));
          if (used > 0) {
            this.player.carried -= used;
            target.fuel_units = Math.min(6000, target.fuel_units + used * 10 * 60);
            target.fuel = target.fuel_units / 60;
            this.score += 5 * used;

            events.push({
              type: 'event',
              tick: currentTick,
              name: 'refuel',
              data: {
                lantern_id: target.id,
                amount: used,
                fuel: round1(target.fuel)
              }
            });

            // If refueled to >= 30, safe zone restored, push shades out and release drain
            if (target.fuel >= 30) {
              target.safePushTick = currentTick;
              for (const shade of this.shades) {
                if (distanceXZ(shade.pos, target.pos) <= this.tuning.safe_radius) {
                  shade.safePushActive = true;
                }
                if (shade.state === 'drain' && shade.target_lantern_id === target.id) {
                  shade.state = 'wander';
                  shade.target_lantern_id = null;
                  shade.drain_ticks = 0;
                }
              }
            }
          }
        } else {
          // Light unlit lantern (first time or relight)
          const cost = target.ever_lit ? this.tuning.relight_cost : this.tuning.lantern_cost;
          const needed = cost - target.deposited;
          const amount = Math.min(this.player.carried, needed);

          if (amount > 0) {
            this.player.carried -= amount;
            target.deposited += amount;
            this.score += 5 * amount;

            events.push({
              type: 'event',
              tick: currentTick,
              name: 'deposit',
              data: { lantern_id: target.id, amount, deposited: target.deposited }
            });

            if (target.deposited >= cost) {
              const isRelight = target.ever_lit;
              target.lit = true;
              target.fuel = 100.0;
              target.fuel_units = 6000;
              target.deposited = 0;
              target.safePushTick = currentTick;

              this.player.successful_lights++;
              this.player.capacity = Math.min(this.tuning.capacity_max, 10 + 2 * this.player.successful_lights);

              if (isRelight) {
                target.relit_count = (target.relit_count || 0) + 1;
                this.score += 40;
                events.push({
                  type: 'event',
                  tick: currentTick,
                  name: 'lantern_lit',
                  data: { lantern_id: target.id, relight: true }
                });
              } else {
                target.ever_lit = true;
                this.score += 100;
                events.push({
                  type: 'event',
                  tick: currentTick,
                  name: 'lantern_lit',
                  data: { lantern_id: target.id, relight: false }
                });
              }

              // Push shades within 6m out
              for (const shade of this.shades) {
                if (distanceXZ(shade.pos, target.pos) <= this.tuning.safe_radius) {
                  shade.safePushActive = true;
                }
                if (shade.state === 'drain' && shade.target_lantern_id === target.id) {
                  shade.state = 'wander';
                  shade.target_lantern_id = null;
                  shade.drain_ticks = 0;
                }
              }
            }
          }
        }
      }
    }

    // --- STEP 6: UPDATE SAFE ZONE (ONLY ACTIVE WHEN LIT AND FUEL >= 30) ---
    for (const shade of this.shades) {
      let inPush = false;
      for (const l of this.lanterns) {
        if (l.lit && l.fuel >= 30) {
          const dLantern = distanceXZ(shade.pos, l.pos);
          if (l.safePushTick >= 0 && currentTick - l.safePushTick <= 30 && dLantern < this.tuning.safe_radius) {
            const dx = shade.pos[0] - l.pos[0];
            const dz = shade.pos[2] - l.pos[2];
            const len = Math.hypot(dx, dz) || 1;
            shade.pos[0] = round3(l.pos[0] + (dx / len) * this.tuning.safe_radius);
            shade.pos[2] = round3(l.pos[2] + (dz / len) * this.tuning.safe_radius);
            inPush = true;
          }
        }
      }
      shade.safePushActive = inPush;
    }

    // --- STEP 7: PULSE (+15 IF HIT SHADE IN DRAIN STATE) ---
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
            const wasDraining = shade.state === 'drain';
            shade.stunned_ticks = Math.round(this.tuning.pulse_stun_s * 60);
            shade.state = 'stunned';
            shade.target_lantern_id = null;
            shade.push_ticks_left = 15;
            stunnedIds.push(shade.id);
            this.score += wasDraining ? 15 : 5;

            const dXZ = Math.hypot(dx, dz);
            if (dXZ > 0.0001) {
              shade.push_vel = [(dx / dXZ) * (4.0 / 15), (dz / dXZ) * (4.0 / 15)];
            } else {
              shade.push_vel = [4.0 / 15, 0.0];
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
          const distToPlayer = distanceXZ(d.pos, this.player.pos);
          if (this.player.carried >= 5 && distToPlayer <= 15.0) {
            d.state = 'chase';
          }
        } else if (d.state === 'chase') {
          const distToPlayer = distanceXZ(d.pos, this.player.pos);
          if (this.player.carried < 5 || distToPlayer > 18.0) {
            d.state = 'idle';
          } else {
            const dx = this.player.pos[0] - d.pos[0];
            const dz = this.player.pos[2] - d.pos[2];
            const len = Math.hypot(dx, dz) || 1;
            d.pos[0] = round3(d.pos[0] + (dx / len) * (7.0 / 60));
            d.pos[2] = round3(d.pos[2] + (dz / len) * (7.0 / 60));
          }
        } else if (d.state === 'flee') {
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

      // Shades motion & state machine
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
        } else if (shade.state === 'drain') {
          // Check transitions from drain
          const distToPlayer = distanceXZ(shade.pos, this.player.pos);
          const tLan = this.lanterns.find((l) => l.id === shade.target_lantern_id);

          if (distToPlayer <= 6.0) {
            shade.state = 'chase';
            shade.target_lantern_id = null;
            shade.drain_ticks = 0;
          } else if (!tLan || !tLan.lit || tLan.fuel >= 30 || distanceXZ(shade.pos, tLan.pos) > 2.0) {
            shade.state = 'wander';
            shade.target_lantern_id = null;
            shade.drain_ticks = 0;
          }
        } else if (shade.state === 'chase') {
          const distToPlayer = distanceXZ(shade.pos, this.player.pos);
          if (distToPlayer > 18.0) {
            shade.state = 'wander';
          } else {
            const dx = this.player.pos[0] - shade.pos[0];
            const dz = this.player.pos[2] - shade.pos[2];
            const len = Math.hypot(dx, dz) || 1;
            const speed = this.map.shadeSpeed || this.tuning.shade_speed;
            const step = speed / 60;
            const nextX = shade.pos[0] + (dx / len) * Math.min(len, step);
            const nextZ = shade.pos[2] + (dz / len) * Math.min(len, step);

            // Safe zone check: blocked at 6m ONLY if lantern lit and fuel >= 30
            let blocked = false;
            for (const lantern of this.lanterns) {
              if (lantern.lit && lantern.fuel >= 30) {
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
        } else {
          // Wander / Spawning state:
          const distToPlayer = distanceXZ(shade.pos, this.player.pos);
          if (distToPlayer <= 12.0) {
            shade.state = 'chase';
            shade.target_lantern_id = null;
          } else {
            // Seek weak lit lantern (fuel < 30) first; if none, seek unlit lantern
            let candidateLanterns = [];
            const weakLit = this.lanterns.filter((l) => l.lit && l.fuel < 30);
            if (weakLit.length > 0) {
              candidateLanterns = weakLit;
            } else {
              candidateLanterns = this.lanterns.filter((l) => !l.lit);
            }

            if (candidateLanterns.length > 0) {
              candidateLanterns.sort((a, b) => {
                const da = distanceXZ(shade.pos, a.pos);
                const db = distanceXZ(shade.pos, b.pos);
                if (Math.abs(da - db) > 0.0001) return da - db;
                return a.id.localeCompare(b.id);
              });

              const targetLantern = candidateLanterns[0];
              shade.target_lantern_id = targetLantern.id;
              const distToTarget = distanceXZ(shade.pos, targetLantern.pos);

              if (targetLantern.lit && targetLantern.fuel < 30 && distToTarget <= 2.0) {
                shade.state = 'drain';
                shade.drain_ticks = 0;
              } else {
                // Move towards target lantern
                const dx = targetLantern.pos[0] - shade.pos[0];
                const dz = targetLantern.pos[2] - shade.pos[2];
                const len = Math.hypot(dx, dz) || 1;
                const speed = this.map.shadeSpeed || this.tuning.shade_speed;
                const step = speed / 60;
                const nextX = shade.pos[0] + (dx / len) * Math.min(len, step);
                const nextZ = shade.pos[2] + (dz / len) * Math.min(len, step);

                let blocked = false;
                for (const lantern of this.lanterns) {
                  if (lantern.lit && lantern.fuel >= 30) {
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

                if (targetLantern.lit && targetLantern.fuel < 30 && distanceXZ(shade.pos, targetLantern.pos) <= 2.0) {
                  shade.state = 'drain';
                  shade.drain_ticks = 0;
                }
              }
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

      if (currentTick === 300) {
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

    // --- STEP 11: WIN / LOSE CHECK (SURVIVAL TILL DAWN) ---
    if (this.state === 'playing') {
      if (this.player.flames <= 0) {
        this.state = 'lost';
        events.push({ type: 'event', tick: currentTick, name: 'game_over', data: { result: 'lost', reason: 'no_flames' } });
      } else if (this.time_left_s <= 0) {
        const litCount = this.lanterns.filter((l) => l.lit).length;
        const threshold = Math.ceil((this.tuning.win_ratio || 0.6) * this.lanterns.length);

        if (litCount >= threshold) {
          this.state = 'won';
          let dawnBonus = 0;
          for (const l of this.lanterns) {
            if (l.lit) {
              dawnBonus += 50 + Math.floor(l.fuel);
            }
          }
          dawnBonus += 50 * this.player.flames;
          this.score += dawnBonus;

          events.push({
            type: 'event',
            tick: currentTick,
            name: 'game_over',
            data: { result: 'won', reason: 'dawn_survived' }
          });
        } else {
          this.state = 'lost';
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'game_over',
            data: { result: 'lost', reason: 'dawn' }
          });
        }
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
        capacity: this.player.capacity,
        invuln: this.player.invuln_ticks > 0,
        dash_cd_s: round3(this.player.dash_cd_ticks / 60),
        pulse_cd_s: round3(this.player.pulse_cooldown_ticks / 60),
        charm_s: round3(this.player.charm_ticks / 60)
      },
      lanterns: this.lanterns.map((l) => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited,
        fuel: l.lit ? round1(l.fuel) : 0,
        ever_lit: !!l.ever_lit,
        relit_count: l.relit_count || 0
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
