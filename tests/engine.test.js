import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/core/engine.js';

test('Player picks up mote within pickup_radius', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [[0, 0, 1.5]], // within 2.0m pickup_radius
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

test('Deposit motes and light lantern when lantern_cost reached', () => {
  const scenario = {
    player: { pos: [0, 0, 24.0], carried: 3, flames: 3 }, // distance to L1 (0,0,25) is 1.0m (within 2.5m)
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [{ id: 'L1', pos: [0, 0, 25.0], deposited: 0, lit: false }]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  // Step 1: interact = true
  const events = engine.step({ interact: true });

  const depositEvent = events.find((e) => e.name === 'deposit');
  assert.ok(depositEvent);
  assert.equal(depositEvent.data.amount, 3);
  assert.equal(depositEvent.data.deposited, 3);

  const litEvent = events.find((e) => e.name === 'lantern_lit');
  assert.ok(litEvent);
  assert.equal(litEvent.data.lantern_id, 'L1');
  assert.equal(engine.player.carried, 0);
});

test('Pulse action consumes 1 carried mote, stuns and repels shades', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 2, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [{ id: 'S1', pos: [0, 0, 4.0] }] // within 6.0m pulse_radius
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({ pulse: true });

  assert.equal(engine.player.carried, 1); // consumed 1 mote
  const pulseEvent = events.find((e) => e.name === 'pulse');
  assert.ok(pulseEvent);
  assert.deepEqual(pulseEvent.data.stunned_ids, ['S1']);

  const shade = engine.shades.find((s) => s.id === 'S1');
  assert.equal(shade.state, 'stunned');
  assert.ok(shade.pos[2] >= 8.0); // pushed away by 4m (4 + 4 = 8)
});

test('Shade attacks player, player loses 1 flame and drops motes', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 4, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [{ id: 'S1', pos: [0, 0, 1.0] }] // within 1.2m hit radius
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({});

  const hitEvent = events.find((e) => e.name === 'player_hit');
  assert.ok(hitEvent);
  assert.equal(hitEvent.data.by, 'shade');
  assert.equal(hitEvent.data.flames, 2);
  assert.equal(hitEvent.data.dropped, 2); // 4 * 0.5 = 2 dropped
  assert.equal(engine.player.carried, 2);
  assert.equal(engine.player.flames, 2);
});

test('Win game when all 5 lanterns are lit', () => {
  const scenario = {
    player: { pos: [0, 0, 24.5], carried: 3, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [],
    shades: [],
    lanterns: [
      { id: 'L1', pos: [0, 0, 25.0], deposited: 0, lit: false },
      { id: 'L2', lit: true },
      { id: 'L3', lit: true },
      { id: 'L4', lit: true },
      { id: 'L5', lit: true }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({ interact: true });

  assert.equal(engine.state, 'won');
  const winEvent = events.find((e) => e.name === 'game_over');
  assert.ok(winEvent);
  assert.equal(winEvent.data.result, 'won');
  assert.equal(winEvent.data.reason, 'all_lit');
});

test('Determinism: same seed and inputs produce identical state', () => {
  const engine1 = new GameEngine({ seed: 999 });
  const engine2 = new GameEngine({ seed: 999 });

  for (let k = 0; k < 60; k++) {
    const input = { move: [0.5, 0.5], cam_yaw_deg: k * 2 };
    engine1.step(input);
    engine2.step(input);
  }

  assert.deepEqual(engine1.getSnapshot(), engine2.getSnapshot());
  assert.deepEqual(engine1.getEnd(), engine2.getEnd());
});
