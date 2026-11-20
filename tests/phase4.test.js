import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LeaderboardManager } from '../src/core/leaderboard.js';
import { runBenchmark } from '../src/cli/bench.js';
import { runSoakTest } from '../src/cli/soak.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('PHASE 4: game.contract.json complies with Contract v1.3 specifications', () => {
  const contractPath = path.join(ROOT_DIR, 'game.contract.json');
  assert.ok(fs.existsSync(contractPath), 'game.contract.json must exist');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

  assert.strictEqual(contract.contract_version, '1.3', 'contract_version must be 1.3');
  assert.ok(contract.bench_cmd, 'bench_cmd must be defined in contract');
  assert.ok(contract.soak_cmd, 'soak_cmd must be defined in contract');
  assert.ok(contract.bench_cmd.includes('bench.js'), 'bench_cmd must invoke bench.js');
  assert.ok(contract.soak_cmd.includes('soak.js'), 'soak_cmd must invoke soak.js');
});

test('PHASE 4: LeaderboardManager enforces 3-12 char names, UTF-8/Vietnamese, top 10 limit, tie-break', () => {
  const tempPath = path.join(ROOT_DIR, 'data', 'test_leaderboard.json');
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

  const manager = new LeaderboardManager(tempPath);

  // Validate name length constraints
  assert.throws(() => manager.addEntry({ name: 'AB', score: 100 }), /3 and 12 characters/);
  assert.throws(() => manager.addEntry({ name: 'TooLongNameHereExceeds12', score: 100 }), /3 and 12 characters/);

  // UTF-8 / Vietnamese characters
  const vnEntry = manager.addEntry({ name: 'Chử Văn Hiệp', score: 450, nights_won: 3 });
  assert.strictEqual(vnEntry.name, 'Chử Văn Hiệp');

  // Tie-breaking: earlier timestamp ranks higher
  const time1 = '2026-11-20T10:00:00.000Z';
  const time2 = '2026-11-20T11:00:00.000Z';
  manager.addEntry({ name: 'PlayLate', score: 500, achieved_at: time2 });
  manager.addEntry({ name: 'PlayEarly', score: 500, achieved_at: time1 });

  const entries = manager.getEntries();
  const top2 = entries.slice(0, 2);
  assert.strictEqual(top2[0].name, 'PlayEarly', 'Earlier achieved_at must be higher on score tie');
  assert.strictEqual(top2[1].name, 'PlayLate');

  // Insert 15 entries to test top 10 slicing
  for (let i = 1; i <= 15; i++) {
    manager.addEntry({ name: `User_${i}`, score: i * 20 });
  }
  const topEntries = manager.getEntries();
  assert.strictEqual(topEntries.length, 10, 'Leaderboard must maintain at most top 10 entries');
  assert.ok(topEntries[0].score >= topEntries[1].score, 'Leaderboard must be sorted descending by score');

  // Cleanup
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
});

test('PHASE 4: CLI --export-leaderboard produces valid JSON output matching schema', () => {
  const exportPath = path.join(ROOT_DIR, 'test_export_cli.json');
  if (fs.existsSync(exportPath)) fs.unlinkSync(exportPath);

  execSync(`node src/web/server.js --export-leaderboard "${exportPath}"`, { cwd: ROOT_DIR });
  assert.ok(fs.existsSync(exportPath), 'Exported file must exist');

  const content = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  assert.ok(Array.isArray(content.entries), 'Export must contain an entries array');
  assert.ok(content.entries.length <= 10, 'Export must have at most 10 entries');
  if (content.entries.length > 0) {
    const first = content.entries[0];
    assert.ok(first.name, 'Entry must have name');
    assert.ok(typeof first.score === 'number', 'Entry must have numerical score');
  }

  if (fs.existsSync(exportPath)) fs.unlinkSync(exportPath);
});

test('PHASE 4: Soak test runs 10 nights without crashes and memory ratio <= 1.2x', async () => {
  const soakOutPath = path.join(ROOT_DIR, 'test_soak_run.json');
  if (fs.existsSync(soakOutPath)) fs.unlinkSync(soakOutPath);

  const res = runSoakTest({ seed: 7, nights: 10, out: 'test_soak_run.json' });
  assert.strictEqual(res.nights, 10, 'Must complete 10 nights');
  assert.strictEqual(res.crashes, 0, 'Must have 0 crashes');
  assert.ok(res.results.length === 10, 'Must record results for all 10 nights');
  assert.ok(res.mem_end_mb <= 1.2 * res.mem_start_mb, `mem_end_mb (${res.mem_end_mb}) must be <= 1.2 * mem_start_mb (${res.mem_start_mb})`);

  if (fs.existsSync(soakOutPath)) fs.unlinkSync(soakOutPath);
});

test('PHASE 4: Benchmark CLI generates valid bench.json meeting performance thresholds', async () => {
  const benchOutPath = path.join(ROOT_DIR, 'test_bench_run.json');
  if (fs.existsSync(benchOutPath)) fs.unlinkSync(benchOutPath);

  process.env.BENCH_HEADLESS = '1';
  const res = await runBenchmark({ seed: 42, duration: 5, out: 'test_bench_run.json' });
  assert.strictEqual(res.contract_version, '1.3', 'Must be contract version 1.3');
  assert.ok(res.avg_fps >= 60, `avg_fps (${res.avg_fps}) must be >= 60`);
  assert.ok(res.p1_low_fps >= 30, `p1_low_fps (${res.p1_low_fps}) must be >= 30`);
  assert.ok(res.load_ms <= 10000, `load_ms (${res.load_ms}) must be <= 10000 ms`);
  assert.ok(res.frames > 0, 'Must render/simulate frames');
  assert.ok(res.vsync_off === true, 'vsync_off must be true');

  if (fs.existsSync(benchOutPath)) fs.unlinkSync(benchOutPath);
});

test('PHASE 4: Accessibility requirements (keybindings, indicators, font sizes, motion reduction) are present in web view', () => {
  const htmlPath = path.join(ROOT_DIR, 'src', 'web', 'index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Key remapping support
  assert.ok(html.includes('DEFAULT_KEYBINDS'), 'Must define default keybindings');
  assert.ok(html.includes('handleKeyRebind'), 'Must implement key remapping function');
  assert.ok(html.includes('btn-reset-keybinds'), 'Must provide reset keybindings button');
  assert.ok(html.includes('keybind-warning'), 'Must detect and report key conflicts');

  // Subtitles / Visual indicators
  assert.ok(html.includes('Bóng Mực xuất hiện'), 'Must include Shade spawn indicator');
  assert.ok(html.includes('Gió sắp thổi'), 'Must include wind gust warning indicator');
  assert.ok(html.includes('10 giây cuối cùng'), 'Must include 10s countdown indicator');
  assert.ok(html.includes('sắp cạn dầu'), 'Must include low fuel indicator (<30)');
  assert.ok(html.includes('threat-radar'), 'Must include screen edge threat radar');

  // Reduce motion and UI font sizes
  assert.ok(html.includes('toggle-reduce-motion'), 'Must support reduce motion toggle');
  assert.ok(html.includes('screen-flash'), 'Must include screen flash element for motion reduction control');
  assert.ok(html.includes('font-size: 18px') || html.includes('font-size: 22.5px'), 'Base UI font size must be at least 18px at 1280x720');
  assert.ok(html.includes('toggle-large-ui'), 'Must support large UI option (x1.25)');
});
