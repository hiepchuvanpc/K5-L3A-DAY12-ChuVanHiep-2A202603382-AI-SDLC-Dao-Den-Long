import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const CLI = path.resolve('src/cli/headless.js');
const PROOF_DIR = path.resolve('docs/proof/phase-2');
const FIXTURES_DIR = path.resolve('tests/fixtures');

if (!fs.existsSync(PROOF_DIR)) fs.mkdirSync(PROOF_DIR, { recursive: true });

function runHeadless(args) {
  return execFileSync('node', [CLI, ...args]);
}

// 1. Dash proof
const scDash = path.join(FIXTURES_DIR, 'p2_sc_dash.json');
const inDash = path.join(FIXTURES_DIR, 'p2_in_dash.json');
fs.writeFileSync(scDash, JSON.stringify({ player: { pos: [0, 0, 0] }, random_motes: false, random_shades: false }));
fs.writeFileSync(inDash, JSON.stringify({ frames: [{ tick: 0, move: [0, 1], dash: true }] }));
runHeadless(['--seed', '42', '--night', '1', '--scenario', scDash, '--inputs', inDash, '--ticks', '15', '--out', path.join(PROOF_DIR, 'dash.jsonl')]);

// 2. Fall proof
const scFall = path.join(FIXTURES_DIR, 'p2_sc_fall.json');
fs.writeFileSync(scFall, JSON.stringify({ player: { pos: [50, -10.1, 0], carried: 5 }, random_motes: false, random_shades: false }));
runHeadless(['--seed', '42', '--night', '1', '--scenario', scFall, '--ticks', '5', '--out', path.join(PROOF_DIR, 'fall.jsonl')]);

// 3. Drifter proof
const scDrifter = path.join(FIXTURES_DIR, 'p2_sc_drifter.json');
fs.writeFileSync(scDrifter, JSON.stringify({
  player: { pos: [0, 0, 0], carried: 6 },
  random_motes: false,
  random_shades: false,
  drifters: [{ id: 'D1', pos: [0, 0, 1.0], state: 'chase' }]
}));
runHeadless(['--seed', '42', '--night', '2', '--scenario', scDrifter, '--ticks', '5', '--out', path.join(PROOF_DIR, 'drifter.jsonl')]);

// 4. Charm proof
const scCharm = path.join(FIXTURES_DIR, 'p2_sc_charm.json');
fs.writeFileSync(scCharm, JSON.stringify({
  player: { pos: [35, 0, 0.5] },
  random_motes: false,
  random_shades: false,
  charms: [{ id: 'C1', pos: [35, 0, 0], available: true }]
}));
runHeadless(['--seed', '42', '--night', '2', '--scenario', scCharm, '--ticks', '5', '--out', path.join(PROOF_DIR, 'charm.jsonl')]);

// 5. Jump pad proof
const scPad = path.join(FIXTURES_DIR, 'p2_sc_pad.json');
fs.writeFileSync(scPad, JSON.stringify({ player: { pos: [20, 0, 18] }, random_motes: false, random_shades: false }));
runHeadless(['--seed', '42', '--night', '2', '--scenario', scPad, '--ticks', '10', '--out', path.join(PROOF_DIR, 'jumppad.jsonl')]);

// 6. Pause proof
const inPause = path.join(FIXTURES_DIR, 'p2_in_pause.json');
fs.writeFileSync(inPause, JSON.stringify({ frames: [{ tick: 5, pause: true }, { tick: 15, pause: true }] }));
runHeadless(['--seed', '42', '--night', '1', '--inputs', inPause, '--ticks', '25', '--snapshot-every', '5', '--out', path.join(PROOF_DIR, 'pause.jsonl')]);

// 7. Night 1, 2, 3 runs
runHeadless(['--seed', '1001', '--night', '1', '--ticks', '120', '--snapshot-every', '30', '--out', path.join(PROOF_DIR, 'night1.jsonl')]);
runHeadless(['--seed', '1002', '--night', '2', '--ticks', '120', '--snapshot-every', '30', '--out', path.join(PROOF_DIR, 'night2.jsonl')]);
runHeadless(['--seed', '1003', '--night', '3', '--ticks', '120', '--snapshot-every', '30', '--out', path.join(PROOF_DIR, 'night3.jsonl')]);

// 8. Determinism test
const det1 = path.join(PROOF_DIR, 'det1.jsonl');
const det2 = path.join(PROOF_DIR, 'det2.jsonl');
runHeadless(['--seed', '8888', '--night', '2', '--ticks', '180', '--out', det1]);
runHeadless(['--seed', '8888', '--night', '2', '--ticks', '180', '--out', det2]);

const hash1 = crypto.createHash('sha256').update(fs.readFileSync(det1)).digest('hex');
const hash2 = crypto.createHash('sha256').update(fs.readFileSync(det2)).digest('hex');
fs.unlinkSync(det1);
fs.unlinkSync(det2);

// 9. Benchmark: 21,600 ticks
const benchOut = path.join(PROOF_DIR, 'bench.jsonl');
const startBench = Date.now();
runHeadless(['--seed', '42', '--night', '3', '--ticks', '21600', '--snapshot-every', '600', '--out', benchOut]);
const benchDurationMs = Date.now() - startBench;
const benchDurationS = (benchDurationMs / 1000).toFixed(2);
fs.unlinkSync(benchOut);

fs.writeFileSync(path.join(PROOF_DIR, 'determinism_and_perf.txt'), `PHASE 2 VERIFICATION & PERFORMANCE REPORT
Run 1 SHA-256: ${hash1}
Run 2 SHA-256: ${hash2}
Determinism: ${hash1 === hash2 ? 'PASS (100% Deterministic)' : 'FAIL'}
Full Night Benchmark (21,600 ticks): ${benchDurationS} s (${benchDurationMs} ms)
Performance Requirement (<= 30s): ${benchDurationMs <= 30000 ? 'PASS (Exceeds requirement)' : 'FAIL'}
Generated At: ${new Date().toISOString()}
`);

console.log(`Phase 2 proofs generated! 21,600 ticks finished in ${benchDurationS}s!`);
