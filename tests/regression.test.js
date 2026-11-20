import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/core/engine.js';

test('REGRESSION: Player picks up mote within pickup_radius', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [[0, 0, 0.8]], // within 1.0m pickup_radius
    shades: []
  };

  const engine = new GameEngine({ seed: 42, scenario });
  assert.equal(engine.motes.length, 1);
  assert.equal(engine.player.carried, 0);

  const events = engine.step({ move: [0, 0] });
  assert.equal(engine.player.carried, 1);
  assert.equal(engine.motes.length, 0);
  assert.equal(events.length, 1);
  assert.equal(events[0].name, 'mote_picked');
  assert.equal(events[0].data.carried, 1);
  assert.equal(engine.score, 10);
});

test('REGRESSION: Deposit motes and light lantern when cost reached', () => {
  const scenario = {
    player: { pos: [0, 0, 24.0], carried: 10, flames: 3 }, // distance to L1 (0,0,25) is 1.0m (within 2.0m)
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [{ id: 'L1', pos: [0, 0, 25.0], deposited: 0, lit: false }]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({ interact: true });

  const depositEvent = events.find((e) => e.name === 'deposit');
  assert.ok(depositEvent);
  assert.equal(depositEvent.data.amount, 10);
  assert.equal(depositEvent.data.deposited, 10);

  const litEvent = events.find((e) => e.name === 'lantern_lit');
  assert.ok(litEvent);
  assert.equal(litEvent.data.lantern_id, 'L1');
  assert.equal(engine.player.carried, 0);
  assert.equal(engine.score, 100);
});

test('REGRESSION: Pulse consumes 3 motes, stuns shades and pushes', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 5, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [{ id: 'S1', pos: [0, 0, 3.0] }] // within 5.0m pulse_radius
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({ pulse: true });

  assert.equal(engine.player.carried, 2); // 5 - 3 = 2
  const pulseEvent = events.find((e) => e.name === 'pulse');
  assert.ok(pulseEvent);
  assert.deepEqual(pulseEvent.data.stunned_ids, ['S1']);

  const shade = engine.shades.find((s) => s.id === 'S1');
  assert.equal(shade.state, 'stunned');
  assert.equal(engine.score, 5); // +5 per shade hit
});

test('REGRESSION: Determinism holds across identical runs', () => {
  const engine1 = new GameEngine({ seed: 7777, night: 1 });
  const engine2 = new GameEngine({ seed: 7777, night: 1 });

  for (let k = 0; k < 60; k++) {
    const input = { move: [0.5, 0.5], cam_yaw_deg: k * 3, dash: k === 10 };
    engine1.step(input);
    engine2.step(input);
  }

  assert.deepEqual(engine1.getSnapshot(), engine2.getSnapshot());
});
