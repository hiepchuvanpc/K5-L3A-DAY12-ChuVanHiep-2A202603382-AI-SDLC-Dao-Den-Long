import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/core/engine.js';

test('FEATURE: Dash mechanic moves at 14 m/s and triggers event', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3, dash_cd_ticks: 0 },
    random_motes: false,
    random_shades: false
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({ dash: true, move: [0, 1] }); // dash forward

  const dashEvent = events.find((e) => e.name === 'dash');
  assert.ok(dashEvent);
  assert.ok(engine.player.pos[2] > 0.2); // moved fast forward
  assert.equal(engine.player.dash_cd_ticks, 90); // 1.5s cd
});

test('FEATURE: Fall off island (Y < -10) deals 1 damage, loses all motes, waits 60 ticks', () => {
  const scenario = {
    // Start way off island in the void below -10
    player: { pos: [50, -10.1, 0], carried: 7, flames: 3 },
    random_motes: false,
    random_shades: false
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({});

  const fallEvent = events.find((e) => e.name === 'player_hit' && e.data.by === 'fall');
  assert.ok(fallEvent);
  assert.equal(fallEvent.data.flames, 2);
  assert.equal(fallEvent.data.lost, 7);
  assert.equal(fallEvent.data.dropped, 0);
  assert.equal(engine.player.carried, 0);
  assert.equal(engine.player.respawn_wait_ticks, 60);
});

test('FEATURE: Drifter steals motes when carried >= 5 and within 15m, flee drops motes when pulsed', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 6, flames: 3 },
    random_motes: false,
    random_shades: false,
    drifters: [{ id: 'D1', pos: [0, 0, 1.0], state: 'chase', stolen: 0 }]
  };

  const engine = new GameEngine({ seed: 42, night: 2, scenario });
  // Step 1: Touch -> steal
  const events1 = engine.step({});
  const stealEvent = events1.find((e) => e.name === 'drifter_steal');
  assert.ok(stealEvent);
  assert.equal(stealEvent.data.amount, 3);
  assert.equal(engine.player.carried, 3);

  const drifter = engine.drifters.find((d) => d.id === 'D1');
  assert.equal(drifter.state, 'flee');
  assert.equal(drifter.stolen, 3);

  // Step 2: Player pulses while drifter is within 5m
  const events2 = engine.step({ pulse: true });
  const dropEvent = events2.find((e) => e.name === 'drifter_drop');
  assert.ok(dropEvent);
  assert.equal(dropEvent.data.amount, 3);
  assert.equal(drifter.stolen, 0);
});

test('FEATURE: Wind Charm (Bua Gio) grants 7.2 m/s speed and 0 dash cooldown', () => {
  const scenario = {
    player: { pos: [35, 0, 0.5], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    charms: [{ id: 'C1', pos: [35, 0, 0], available: true }]
  };

  const engine = new GameEngine({ seed: 42, night: 2, scenario });
  const events = engine.step({});

  const charmEvent = events.find((e) => e.name === 'charm_picked');
  assert.ok(charmEvent);
  assert.equal(charmEvent.data.charm_id, 'C1');
  assert.equal(engine.player.charm_ticks, 600);

  // Dash with charm -> 0 cd
  engine.step({ dash: true });
  assert.equal(engine.player.dash_cd_ticks, 0);
});

test('FEATURE: Pause freezes simulation and records state paused', () => {
  const engine = new GameEngine({ seed: 42, night: 1 });
  const events = engine.step({ pause: true });

  const pauseEvent = events.find((e) => e.name === 'paused');
  assert.ok(pauseEvent);
  assert.equal(engine.state, 'paused');

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.state, 'paused');

  // Step while paused -> remains paused
  const events2 = engine.step({ move: [0, 1] });
  assert.equal(engine.state, 'paused');

  // Unpause
  const events3 = engine.step({ pause: true });
  const resumeEvent = events3.find((e) => e.name === 'resumed');
  assert.ok(resumeEvent);
  assert.equal(engine.state, 'playing');
});

test('FEATURE: Jump Pad in Night 2 launches player towards target island', () => {
  const scenario = {
    player: { pos: [20, 0, 18], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false
  };

  const engine = new GameEngine({ seed: 42, night: 2, scenario });
  engine.step({});

  assert.ok(engine.player.is_launched);
  assert.equal(engine.player.vel[1], 14.0);
  assert.ok(engine.player.vel[0] > 10.0); // positive X velocity towards Island B
});
