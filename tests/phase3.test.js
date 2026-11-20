import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/core/engine.js';

test('PHASE 3: Fuel decays at 1.0 unit/second (1/60 per tick)', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [],
    lanterns: [
      { id: 'L1', pos: [0, 0, 25.0], lit: true, fuel: 100.0 }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  assert.equal(engine.lanterns[0].fuel, 100.0);

  // Run 60 ticks (1 second)
  for (let i = 0; i < 60; i++) {
    engine.step({});
  }

  assert.equal(engine.lanterns[0].fuel, 99.0);
  const snapshot = engine.getSnapshot();
  const snapL1 = snapshot.lanterns.find((l) => l.id === 'L1');
  assert.equal(snapL1.fuel, 99.0);
  assert.equal(snapL1.lit, true);
});

test('PHASE 3: Lantern extinguishes when fuel reaches 0 and emits lantern_out', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [],
    lanterns: [
      // 1 tick left of fuel (1/60)
      { id: 'L1', pos: [0, 0, 25.0], lit: true, fuel: 1 / 60 }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({});

  const outEvent = events.find((e) => e.name === 'lantern_out');
  assert.ok(outEvent);
  assert.equal(outEvent.data.lantern_id, 'L1');
  assert.equal(engine.lanterns[0].lit, false);
  assert.equal(engine.lanterns[0].fuel, 0.0);
  assert.equal(engine.lanterns[0].ever_lit, true);
});

test('PHASE 3: Refueling lit lantern consumes motes, emits refuel event, scores +5 per mote', () => {
  const scenario = {
    player: { pos: [0, 0, 24.5], carried: 3, flames: 3 }, // 0.5m from L1
    random_motes: false,
    random_shades: false,
    shades: [],
    lanterns: [
      { id: 'L1', pos: [0, 0, 25.0], lit: true, fuel: 82.0 }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  // Need: ceil((100 - 82) / 10) = ceil(1.8) = 2 motes
  const events = engine.step({ interact: true });

  const refuelEvent = events.find((e) => e.name === 'refuel');
  assert.ok(refuelEvent);
  assert.equal(refuelEvent.data.lantern_id, 'L1');
  assert.equal(refuelEvent.data.amount, 2);
  assert.equal(refuelEvent.data.fuel, 100);
  assert.equal(engine.player.carried, 1); // 3 - 2 = 1
  assert.equal(engine.score, 10); // 2 * 5 = +10
});

test('PHASE 3: Relighting extinguished lantern costs only 5 motes and scores +40', () => {
  const scenario = {
    player: { pos: [0, 0, 24.5], carried: 7, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [],
    lanterns: [
      { id: 'L1', pos: [0, 0, 25.0], lit: false, ever_lit: true, deposited: 0 }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({ interact: true });

  const litEvent = events.find((e) => e.name === 'lantern_lit');
  assert.ok(litEvent);
  assert.equal(litEvent.data.lantern_id, 'L1');
  assert.equal(litEvent.data.relight, true);
  assert.equal(engine.player.carried, 2); // 7 - 5 = 2
  assert.equal(engine.lanterns[0].lit, true);
  assert.equal(engine.lanterns[0].fuel, 100.0);
  assert.equal(engine.lanterns[0].relit_count, 1);
  // Score: 5 motes * 5 = 25, + 40 relight bonus = 65
  assert.equal(engine.score, 65);
});

test('PHASE 3: Dynamic capacity increases by 2 per successful light (up to 20)', () => {
  const scenario = {
    player: { pos: [0, 0, 24.5], carried: 10, flames: 3, successful_lights: 0 },
    random_motes: false,
    random_shades: false,
    shades: [],
    lanterns: [
      { id: 'L1', pos: [0, 0, 25.0], lit: false, ever_lit: false, deposited: 0 }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  assert.equal(engine.player.capacity, 10);

  engine.step({ interact: true });
  assert.equal(engine.player.successful_lights, 1);
  assert.equal(engine.player.capacity, 12);

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.player.capacity, 12);
});

test('PHASE 3: Shade targets weak lantern (fuel < 30), drains 5/s, emits fuel_drain, awards +15 on pulse', () => {
  const scenario = {
    player: { pos: [0, 0, 0], carried: 5, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [
      // S1 placed right next to weak lantern L1
      { id: 'S1', pos: [0, 0, 24.8], state: 'wander' }
    ],
    lanterns: [
      { id: 'L1', pos: [0, 0, 25.0], lit: true, fuel: 25.0 }, // weak lantern
      { id: 'L2', pos: [23.8, 0, 7.7], lit: true, fuel: 80.0 }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  // Step 1: shade within 2m of weak lantern transitions to 'drain'
  engine.step({});
  assert.equal(engine.shades[0].state, 'drain');
  assert.equal(engine.shades[0].target_lantern_id, 'L1');

  // Step for 60 ticks (1s): drains 5.0 fuel + 1.0 natural decay = 6.0 fuel
  let drainEventEmitted = false;
  for (let k = 0; k < 60; k++) {
    const evts = engine.step({});
    if (evts.some((e) => e.name === 'fuel_drain')) {
      drainEventEmitted = true;
    }
  }

  assert.ok(drainEventEmitted);
  // 25.0 - (1/60 + 5/60) * 61 ticks ~ 18.9 fuel
  assert.ok(engine.lanterns[0].fuel < 20.0);

  // Now, test Pulse on draining shade gives +15 score
  // Move player near S1
  engine.player.pos = [0, 0, 24.0];
  const pulseEvents = engine.step({ pulse: true });
  const pulseEvt = pulseEvents.find((e) => e.name === 'pulse');
  assert.ok(pulseEvt);
  assert.deepEqual(pulseEvt.data.stunned_ids, ['S1']);
  assert.equal(engine.shades[0].state, 'stunned');
  // Stunned shade that was draining gave +15 score!
  assert.equal(engine.score, 15);
});

test('PHASE 3: Win at dawn (time_left <= 0) when lit count >= 60% with dawn bonuses', () => {
  const scenario = {
    time_left_s: 1 / 60, // 1 tick till dawn
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [],
    lanterns: [
      { id: 'L1', lit: true, fuel: 100.0 },
      { id: 'L2', lit: true, fuel: 80.0 },
      { id: 'L3', lit: true, fuel: 50.0 },
      { id: 'L4', lit: false, fuel: 0.0 },
      { id: 'L5', lit: false, fuel: 0.0 }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  // In Night 1, 3/5 lanterns are lit (3 >= ceil(0.6 * 5) = 3)
  const events = engine.step({});

  assert.equal(engine.state, 'won');
  const winEvent = events.find((e) => e.name === 'game_over');
  assert.ok(winEvent);
  assert.equal(winEvent.data.result, 'won');
  assert.equal(winEvent.data.reason, 'dawn_survived');

  // Dawn bonuses:
  // L1: 50 + 99 (decayed 1 tick to ~99.98 => floor 99) = 149
  // L2: 50 + 79 = 129
  // L3: 50 + 49 = 99
  // Flames: 3 * 50 = 150
  // Total ~ 527
  assert.ok(engine.score > 500);
});

test('PHASE 3: Lose at dawn when lit count < 60%', () => {
  const scenario = {
    time_left_s: 1 / 60,
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [],
    lanterns: [
      { id: 'L1', lit: true, fuel: 100.0 },
      { id: 'L2', lit: true, fuel: 80.0 },
      { id: 'L3', lit: false, fuel: 0.0 },
      { id: 'L4', lit: false, fuel: 0.0 },
      { id: 'L5', lit: false, fuel: 0.0 }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  // 2/5 lit < 3 required
  const events = engine.step({});

  assert.equal(engine.state, 'lost');
  const loseEvent = events.find((e) => e.name === 'game_over');
  assert.ok(loseEvent);
  assert.equal(loseEvent.data.result, 'lost');
  assert.equal(loseEvent.data.reason, 'dawn');
});
