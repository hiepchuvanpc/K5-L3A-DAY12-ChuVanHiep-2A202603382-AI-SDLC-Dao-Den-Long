import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const CLI = path.resolve('src/cli/headless.js');
const PROOF_DIR = path.resolve('docs/proof/phase-1');
const FIXTURES_DIR = path.resolve('tests/fixtures');

if (!fs.existsSync(PROOF_DIR)) fs.mkdirSync(PROOF_DIR, { recursive: true });
if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });

function runHeadless(args) {
  return execFileSync('node', [CLI, ...args]);
}

// 1. Pickup scenario
const scPickup = path.join(FIXTURES_DIR, 'sc_pickup.json');
fs.writeFileSync(scPickup, JSON.stringify({
  player: { pos: [0, 0, 0], carried: 0, flames: 3 },
  random_motes: false,
  random_shades: false,
  motes: [[0, 0, 1.5]],
  shades: []
}));
runHeadless(['--seed', '42', '--night', '1', '--scenario', scPickup, '--ticks', '5', '--out', path.join(PROOF_DIR, 'pickup.jsonl')]);

// 2. Deposit & Lit scenario
const scLit = path.join(FIXTURES_DIR, 'sc_deposit_lit.json');
const inInteract = path.join(FIXTURES_DIR, 'in_interact.json');
fs.writeFileSync(scLit, JSON.stringify({
  player: { pos: [0, 0, 24.0], carried: 3, flames: 3 },
  random_motes: false,
  random_shades: false,
  motes: [],
  shades: [],
  lanterns: [{ id: 'L1', pos: [0, 0, 25.0], deposited: 0, lit: false }]
}));
fs.writeFileSync(inInteract, JSON.stringify({
  frames: [
    { tick: 0, interact: true },
    { tick: 1, interact: false }
  ]
}));
runHeadless(['--seed', '42', '--night', '1', '--scenario', scLit, '--inputs', inInteract, '--ticks', '5', '--out', path.join(PROOF_DIR, 'deposit_lit.jsonl')]);

// 3. Pulse scenario
const scPulse = path.join(FIXTURES_DIR, 'sc_pulse.json');
const inPulse = path.join(FIXTURES_DIR, 'in_pulse.json');
fs.writeFileSync(scPulse, JSON.stringify({
  player: { pos: [0, 0, 0], carried: 2, flames: 3 },
  random_motes: false,
  random_shades: false,
  motes: [],
  shades: [{ id: 'S1', pos: [0, 0, 4.0] }]
}));
fs.writeFileSync(inPulse, JSON.stringify({
  frames: [
    { tick: 0, pulse: true },
    { tick: 1, pulse: false }
  ]
}));
runHeadless(['--seed', '42', '--night', '1', '--scenario', scPulse, '--inputs', inPulse, '--ticks', '5', '--out', path.join(PROOF_DIR, 'pulse.jsonl')]);

// 4. Hit scenario
const scHit = path.join(FIXTURES_DIR, 'sc_hit.json');
fs.writeFileSync(scHit, JSON.stringify({
  player: { pos: [0, 0, 0], carried: 4, flames: 3 },
  random_motes: false,
  random_shades: false,
  motes: [],
  shades: [{ id: 'S1', pos: [0, 0, 1.0] }]
}));
runHeadless(['--seed', '42', '--night', '1', '--scenario', scHit, '--ticks', '5', '--out', path.join(PROOF_DIR, 'hit.jsonl')]);

// 5. Win scenario
const scWin = path.join(FIXTURES_DIR, 'sc_win.json');
fs.writeFileSync(scWin, JSON.stringify({
  player: { pos: [0, 0, 24.0], carried: 3, flames: 3 },
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
}));
runHeadless(['--seed', '42', '--night', '1', '--scenario', scWin, '--inputs', inInteract, '--ticks', '5', '--out', path.join(PROOF_DIR, 'win.jsonl')]);

// 6. Lose scenario (no flames)
const scLose = path.join(FIXTURES_DIR, 'sc_lose.json');
fs.writeFileSync(scLose, JSON.stringify({
  player: { pos: [0, 0, 0], carried: 0, flames: 1 },
  random_motes: false,
  random_shades: false,
  motes: [],
  shades: [{ id: 'S1', pos: [0, 0, 0.5] }]
}));
runHeadless(['--seed', '42', '--night', '1', '--scenario', scLose, '--ticks', '5', '--out', path.join(PROOF_DIR, 'lose.jsonl')]);

// 7. Input move scenario
const inMove = path.join(FIXTURES_DIR, 'in_move.json');
fs.writeFileSync(inMove, JSON.stringify({
  frames: [
    { tick: 0, move: [0, 1], cam_yaw_deg: 0 },
    { tick: 60, move: [1, 0], cam_yaw_deg: 0 }
  ]
}));
runHeadless(['--seed', '42', '--night', '1', '--inputs', inMove, '--ticks', '120', '--snapshot-every', '30', '--out', path.join(PROOF_DIR, 'input_move.jsonl')]);

// 8. Determinism test
const detOut1 = path.join(PROOF_DIR, 'det_run1.jsonl');
const detOut2 = path.join(PROOF_DIR, 'det_run2.jsonl');
runHeadless(['--seed', '9999', '--night', '1', '--ticks', '180', '--out', detOut1]);
runHeadless(['--seed', '9999', '--night', '1', '--ticks', '180', '--out', detOut2]);

const hash1 = crypto.createHash('sha256').update(fs.readFileSync(detOut1)).digest('hex');
const hash2 = crypto.createHash('sha256').update(fs.readFileSync(detOut2)).digest('hex');
const isIdentical = hash1 === hash2;

fs.writeFileSync(path.join(PROOF_DIR, 'determinism.txt'), `DETERMINISM VERIFICATION REPORT
Run 1 SHA-256: ${hash1}
Run 2 SHA-256: ${hash2}
Exact Match: ${isIdentical ? 'PASS (100% Deterministic)' : 'FAIL'}
Generated At: ${new Date().toISOString()}
`);

fs.unlinkSync(detOut1);
fs.unlinkSync(detOut2);

console.log('Successfully generated all Phase 1 proof artifacts!');
