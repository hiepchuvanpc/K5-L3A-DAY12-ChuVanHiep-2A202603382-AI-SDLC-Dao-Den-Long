import { DEFAULT_TUNING } from './config.js';
import { createRng, round3, distanceXZ, transformMoveByCameraYaw } from './math.js';

export class GameEngine {
  constructor(options = {}) {
    this.seed = options.seed ?? 42;
    this.rng = createRng(this.seed);
    this.night = options.night ?? 1;
    this.tuning = { ...DEFAULT_TUNING, ...(options.tuning || {}) };

    this.sim_tick = 0;
    this.state = 'playing'; // 'playing' | 'won' | 'lost'
    this.score = 0;
    this.initial_time_left_s = this.tuning.night1_duration_s;
    this.time_left_s = this.tuning.night1_duration_s;

    this.player = {
      pos: [0.0, 0.0, 0.0],
      flames: this.tuning.flames,
      carried: 0,
      invuln_ticks: 0,
      pulse_cooldown_ticks: 0
    };

    this.lanterns = [
      { id: 'L1', pos: [0.0, 0.0, 25.0], lit: false, deposited: 0 },
      { id: 'L2', pos: [23.776, 0.0, 7.725], lit: false, deposited: 0 },
      { id: 'L3', pos: [14.695, 0.0, -20.225], lit: false, deposited: 0 },
      { id: 'L4', pos: [-14.695, 0.0, -20.225], lit: false, deposited: 0 },
      { id: 'L5', pos: [-23.776, 0.0, 7.725], lit: false, deposited: 0 }
    ];

    this.motes = [];
    this.shades = [];
    this.events = [];
    this.shadeIdCounter = 1;

    // Previous input state for edge detection
    this.prevInputState = {
      interact: false,
      pulse: false,
      jump: false
    };

    if (options.scenario) {
      this.loadScenario(options.scenario);
    } else {
      this.initDefaultEntities();
    }
  }

  initDefaultEntities() {
    // Default motes
    const numMotes = 20;
    for (let i = 0; i < numMotes; i++) {
      const radius = 5 + this.rng() * 30;
      const angle = this.rng() * Math.PI * 2;
      const x = round3(radius * Math.cos(angle));
      const z = round3(radius * Math.sin(angle));
      this.motes.push({
        id: `M${i + 1}`,
        pos: [x, 0.0, z]
      });
    }

    // Default shades
    const numShades = 2;
    for (let i = 0; i < numShades; i++) {
      const radius = 28 + this.rng() * 8;
      const angle = (i * Math.PI) + (this.rng() * 0.5);
      const x = round3(radius * Math.cos(angle));
      const z = round3(radius * Math.sin(angle));
      this.shades.push({
        id: `S${this.shadeIdCounter++}`,
        pos: [x, 0.0, z],
        state: 'chase',
        stunned_ticks: 0
      });
    }
  }

  loadScenario(scenario) {
    if (scenario.player) {
      if (Array.isArray(scenario.player.pos)) {
        this.player.pos = [scenario.player.pos[0] ?? 0, scenario.player.pos[1] ?? 0, scenario.player.pos[2] ?? 0];
      }
      if (typeof scenario.player.flames === 'number') {
        this.player.flames = scenario.player.flames;
      }
      if (typeof scenario.player.carried === 'number') {
        this.player.carried = scenario.player.carried;
      }
    }

    if (typeof scenario.time_left_s === 'number') {
      this.initial_time_left_s = scenario.time_left_s;
      this.time_left_s = scenario.time_left_s;
    }

    // Lanterns update
    if (Array.isArray(scenario.lanterns)) {
      for (const update of scenario.lanterns) {
        const lantern = this.lanterns.find((l) => l.id === update.id);
        if (lantern) {
          if (Array.isArray(update.pos)) {
            lantern.pos = [update.pos[0], update.pos[1], update.pos[2]];
          }
          if (typeof update.deposited === 'number') {
            lantern.deposited = update.deposited;
          }
          if (typeof update.lit === 'boolean') {
            lantern.lit = update.lit;
          }
        }
      }
    }

    // Motes
    if (scenario.random_motes === false) {
      this.motes = [];
      if (Array.isArray(scenario.motes)) {
        scenario.motes.forEach((m, idx) => {
          if (Array.isArray(m)) {
            this.motes.push({ id: `M${idx + 1}`, pos: [m[0], m[1] ?? 0, m[2]] });
          } else if (m && typeof m === 'object' && Array.isArray(m.pos)) {
            this.motes.push({ id: m.id || `M${idx + 1}`, pos: [m.pos[0], m.pos[1] ?? 0, m.pos[2]] });
          }
        });
      }
    } else {
      this.initDefaultMotes();
    }

    // Shades
    if (scenario.random_shades === false) {
      this.shades = [];
      if (Array.isArray(scenario.shades)) {
        scenario.shades.forEach((s, idx) => {
          if (Array.isArray(s)) {
            this.shades.push({
              id: `S${this.shadeIdCounter++}`,
              pos: [s[0], s[1] ?? 0, s[2]],
              state: 'chase',
              stunned_ticks: 0
            });
          } else if (s && typeof s === 'object') {
            const pos = Array.isArray(s.pos) ? [s.pos[0], s.pos[1] ?? 0, s.pos[2]] : [0, 0, 0];
            const id = s.id || `S${this.shadeIdCounter++}`;
            this.shades.push({
              id,
              pos,
              state: s.state || 'chase',
              stunned_ticks: 0
            });
          }
        });
      }
    } else {
      this.initDefaultShades();
    }
  }

  initDefaultMotes() {
    this.motes = [];
    const numMotes = 20;
    for (let i = 0; i < numMotes; i++) {
      const radius = 5 + this.rng() * 30;
      const angle = this.rng() * Math.PI * 2;
      const x = round3(radius * Math.cos(angle));
      const z = round3(radius * Math.sin(angle));
      this.motes.push({
        id: `M${i + 1}`,
        pos: [x, 0.0, z]
      });
    }
  }

  initDefaultShades() {
    this.shades = [];
    const numShades = 2;
    for (let i = 0; i < numShades; i++) {
      const radius = 28 + this.rng() * 8;
      const angle = (i * Math.PI) + (this.rng() * 0.5);
      const x = round3(radius * Math.cos(angle));
      const z = round3(radius * Math.sin(angle));
      this.shades.push({
        id: `S${this.shadeIdCounter++}`,
        pos: [x, 0.0, z],
        state: 'chase',
        stunned_ticks: 0
      });
    }
  }

  /**
   * Executes 1 step of simulation (from tick k to tick k+1).
   * @param {Object} inputFrame - active input state for this tick
   * @returns {Array} events occurred during this tick
   */
  step(inputFrame = {}) {
    if (this.state !== 'playing') {
      return [];
    }

    const currentTick = this.sim_tick + 1;
    const events = [];

    // 1. Timers
    this.time_left_s = Math.max(0, this.initial_time_left_s - currentTick / 60);
    if (this.player.invuln_ticks > 0) {
      this.player.invuln_ticks--;
    }
    if (this.player.pulse_cooldown_ticks > 0) {
      this.player.pulse_cooldown_ticks--;
    }

    // Edge detections
    const interactPressed = !!inputFrame.interact && !this.prevInputState.interact;
    const pulsePressed = !!inputFrame.pulse && !this.prevInputState.pulse;
    this.prevInputState.interact = !!inputFrame.interact;
    this.prevInputState.pulse = !!inputFrame.pulse;
    this.prevInputState.jump = !!inputFrame.jump;

    // 2. Player Movement
    const move = inputFrame.move || [0, 0];
    const camYawDeg = inputFrame.cam_yaw_deg || 0;
    const [worldDirX, worldDirZ] = transformMoveByCameraYaw(move, camYawDeg);

    if (worldDirX !== 0 || worldDirZ !== 0) {
      const moveDistance = this.tuning.player_speed / 60;
      this.player.pos[0] = round3(this.player.pos[0] + worldDirX * moveDistance);
      this.player.pos[2] = round3(this.player.pos[2] + worldDirZ * moveDistance);
    }

    // 3. Interact (Deposit into Lantern)
    if (interactPressed && this.player.carried > 0) {
      // Find eligible unlit lanterns within interact_radius
      let closestLantern = null;
      let closestDist = Infinity;
      for (const lantern of this.lanterns) {
        if (!lantern.lit) {
          const dist = distanceXZ(this.player.pos, lantern.pos);
          if (dist <= this.tuning.interact_radius && dist < closestDist) {
            closestDist = dist;
            closestLantern = lantern;
          }
        }
      }

      if (closestLantern) {
        const needed = this.tuning.lantern_cost - closestLantern.deposited;
        const depositAmount = Math.min(this.player.carried, needed);
        if (depositAmount > 0) {
          this.player.carried -= depositAmount;
          closestLantern.deposited += depositAmount;
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'deposit',
            data: {
              lantern_id: closestLantern.id,
              amount: depositAmount,
              deposited: closestLantern.deposited
            }
          });

          if (closestLantern.deposited >= this.tuning.lantern_cost) {
            closestLantern.lit = true;
            this.score += this.tuning.score.per_lantern;
            events.push({
              type: 'event',
              tick: currentTick,
              name: 'lantern_lit',
              data: {
                lantern_id: closestLantern.id
              }
            });

            // Check Win condition
            const allLit = this.lanterns.every((l) => l.lit);
            if (allLit) {
              this.state = 'won';
              const secondsLeftBonus = Math.floor(this.time_left_s) * this.tuning.score.per_second_left;
              const flamesLeftBonus = this.player.flames * this.tuning.score.per_flame_left;
              this.score += secondsLeftBonus + flamesLeftBonus;
              events.push({
                type: 'event',
                tick: currentTick,
                name: 'game_over',
                data: {
                  result: 'won',
                  reason: 'all_lit'
                }
              });
            }
          }
        }
      }
    }

    // 4. Pulse (Repel and stun Shades)
    if (pulsePressed && this.state === 'playing') {
      if (this.player.pulse_cooldown_ticks <= 0 && this.player.carried >= this.tuning.pulse_cost) {
        this.player.carried -= this.tuning.pulse_cost;
        this.player.pulse_cooldown_ticks = Math.round(this.tuning.pulse_cooldown_s * 60);

        const stunnedIds = [];
        for (const shade of this.shades) {
          const dist = distanceXZ(this.player.pos, shade.pos);
          if (dist <= this.tuning.pulse_radius) {
            shade.stunned_ticks = Math.round(this.tuning.pulse_stun_s * 60);
            shade.state = 'stunned';
            stunnedIds.push(shade.id);
            this.score += this.tuning.score.per_stun;

            // Push shade away from player along player -> shade vector
            const dx = shade.pos[0] - this.player.pos[0];
            const dz = shade.pos[2] - this.player.pos[2];
            const len = Math.hypot(dx, dz);
            let pushX = 0;
            let pushZ = this.tuning.pulse_push_m;
            if (len > 0.0001) {
              pushX = (dx / len) * this.tuning.pulse_push_m;
              pushZ = (dz / len) * this.tuning.pulse_push_m;
            }
            shade.pos[0] = round3(shade.pos[0] + pushX);
            shade.pos[2] = round3(shade.pos[2] + pushZ);
          }
        }

        events.push({
          type: 'event',
          tick: currentTick,
          name: 'pulse',
          data: {
            stunned_ids: stunnedIds
          }
        });
      }
    }

    // 5. Pickup motes
    if (this.state === 'playing') {
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const mote = this.motes[i];
        const dist = distanceXZ(this.player.pos, mote.pos);
        if (dist <= this.tuning.pickup_radius && this.player.carried < this.tuning.carry_capacity) {
          this.player.carried += 1;
          this.score += this.tuning.score.per_mote;
          this.motes.splice(i, 1);
          events.push({
            type: 'event',
            tick: currentTick,
            name: 'mote_picked',
            data: {
              carried: this.player.carried
            }
          });
        }
      }
    }

    // 6. Shades AI and Player Hit
    if (this.state === 'playing') {
      for (const shade of this.shades) {
        if (shade.stunned_ticks > 0) {
          shade.stunned_ticks--;
          if (shade.stunned_ticks === 0) {
            shade.state = 'chase';
          }
        } else {
          shade.state = 'chase';
          const dx = this.player.pos[0] - shade.pos[0];
          const dz = this.player.pos[2] - shade.pos[2];
          const dist = Math.hypot(dx, dz);

          if (dist > 0.0001) {
            const step = this.tuning.shade_speed / 60;
            const stepX = (dx / dist) * Math.min(dist, step);
            const stepZ = (dz / dist) * Math.min(dist, step);
            const nextX = shade.pos[0] + stepX;
            const nextZ = shade.pos[2] + stepZ;

            // Safe radius check: Shade cannot enter safe_radius of any lit lantern
            let insideSafeZone = false;
            for (const lantern of this.lanterns) {
              if (lantern.lit) {
                const distToLit = Math.hypot(nextX - lantern.pos[0], nextZ - lantern.pos[2]);
                if (distToLit < this.tuning.safe_radius) {
                  insideSafeZone = true;
                  break;
                }
              }
            }

            if (!insideSafeZone) {
              shade.pos[0] = round3(nextX);
              shade.pos[2] = round3(nextZ);
            }
          }

          // Check hit player
          if (this.player.invuln_ticks <= 0 && this.state === 'playing') {
            const distToPlayer = distanceXZ(shade.pos, this.player.pos);
            if (distToPlayer <= this.tuning.shade_hit_radius) {
              this.player.flames -= 1;
              this.player.invuln_ticks = Math.round(this.tuning.invuln_s * 60);
              const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
              this.player.carried -= dropped;

              events.push({
                type: 'event',
                tick: currentTick,
                name: 'player_hit',
                data: {
                  by: 'shade',
                  flames: this.player.flames,
                  dropped
                }
              });

              if (this.player.flames <= 0) {
                this.state = 'lost';
                events.push({
                  type: 'event',
                  tick: currentTick,
                  name: 'game_over',
                  data: {
                    result: 'lost',
                    reason: 'no_flames'
                  }
                });
              }
            }
          }
        }
      }
    }

    // 7. Dawn / Timeout
    if (this.time_left_s <= 0 && this.state === 'playing') {
      this.state = 'lost';
      events.push({
        type: 'event',
        tick: currentTick,
        name: 'game_over',
        data: {
          result: 'lost',
          reason: 'dawn'
        }
      });
    }

    this.sim_tick = currentTick;
    return events;
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.sim_tick,
      sim_tick: this.sim_tick,
      state: this.state,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        flames: this.player.flames,
        carried: this.player.carried
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
