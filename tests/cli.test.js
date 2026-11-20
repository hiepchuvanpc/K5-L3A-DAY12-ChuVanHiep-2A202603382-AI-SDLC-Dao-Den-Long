import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CLI_PATH = path.resolve('src/cli/headless.js');
const TMP_OUT = path.resolve('docs/proof/phase-1/cli_test_out.jsonl');

test('Headless CLI executes scenario and outputs valid JSONL', () => {
  const scenarioPath = path.resolve('tests/fixtures/test_scenario.json');
  const inputsPath = path.resolve('tests/fixtures/test_inputs.json');

  if (!fs.existsSync('tests/fixtures')) {
    fs.mkdirSync('tests/fixtures', { recursive: true });
  }

  fs.writeFileSync(scenarioPath, JSON.stringify({
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [[0, 0, 1.0]],
    shades: [],
    lanterns: [{ id: 'L1', pos: [0, 0, 25.0] }]
  }));

  fs.writeFileSync(inputsPath, JSON.stringify({
    frames: [
      { tick: 0, move: [0, 0] },
      { tick: 5, move: [0, 1] }
    ]
  }));

  execFileSync('node', [
    CLI_PATH,
    '--seed', '42',
    '--night', '1',
    '--scenario', scenarioPath,
    '--inputs', inputsPath,
    '--ticks', '30',
    '--snapshot-every', '10',
    '--out', TMP_OUT
  ]);

  assert.ok(fs.existsSync(TMP_OUT));
  const lines = fs.readFileSync(TMP_OUT, 'utf8').trim().split('\n').map((l) => JSON.parse(l));

  // Should have snapshot at tick 0
  assert.equal(lines[0].type, 'snapshot');
  assert.equal(lines[0].tick, 0);

  // Should have mote_picked event
  const pickedEvent = lines.find((l) => l.type === 'event' && l.name === 'mote_picked');
  assert.ok(pickedEvent);

  // Last line should be end
  const endLine = lines[lines.length - 1];
  assert.equal(endLine.type, 'end');
  assert.equal(endLine.ticks, 30);
});

test('Headless CLI exits with code 2 on invalid inputs', () => {
  const invalidInputsPath = path.resolve('tests/fixtures/invalid_inputs.json');
  fs.writeFileSync(invalidInputsPath, '{"invalid_json": true');

  let exitCode = 0;
  try {
    execFileSync('node', [
      CLI_PATH,
      '--seed', '42',
      '--night', '1',
      '--inputs', invalidInputsPath,
      '--ticks', '10',
      '--out', TMP_OUT
    ]);
  } catch (err) {
    exitCode = err.status;
  }
  assert.equal(exitCode, 2);
});
