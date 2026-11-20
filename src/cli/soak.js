import fs from 'node:fs';
import path from 'node:path';
import { GameEngine } from '../core/engine.js';
import { createRng } from '../core/math.js';
import { MAPS } from '../core/maps.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    seed: 7,
    nights: 10,
    out: 'soak.json'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && args[i + 1]) options.seed = parseInt(args[++i], 10);
    else if (args[i] === '--nights' && args[i + 1]) options.nights = parseInt(args[++i], 10);
    else if (args[i] === '--out' && args[i + 1]) options.out = args[++i];
  }
  return options;
}

export function runSoakTest(options = {}) {
  const baseSeed = options.seed ?? 7;
  const nightsCount = options.nights ?? 10;
  const outPath = options.out ?? 'soak.json';

  const startTime = performance.now();
  let crashes = 0;
  const results = [];
  let memStartMb = null;

  // Pre-load and warm up JIT execution for Night 1 assets
  const warmupEngine = new GameEngine({ seed: baseSeed + 1, night: 1 });
  for (let t = 0; t < 300; t++) {
    warmupEngine.step({ move: [0, 1], jump: false, dash: false, pulse: false, interact: false });
  }

  for (let i = 1; i <= nightsCount; i++) {
    try {
      const nightNum = ((i - 1) % 3) + 1;
      const currentSeed = baseSeed + i;
      const inputRng = createRng(currentSeed * 100 + 42);

      const engine = new GameEngine({ seed: currentSeed, night: nightNum });

      if (i === 1) {
        memStartMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
      }

      const mapDuration = MAPS[nightNum]?.duration_s || 240;
      const maxTicks = mapDuration * 60;

      let currentMove = [0, 1];

      for (let t = 0; t < maxTicks; t++) {
        if (engine.state !== 'playing') break;

        // Change move direction every 30 ticks
        if (t % 30 === 0) {
          const angle = inputRng() * Math.PI * 2;
          currentMove = [Math.cos(angle), Math.sin(angle)];
        }

        const jump = inputRng() < 0.05;
        const dash = inputRng() < 0.03;
        const pulse = inputRng() < 0.02;
        const interact = inputRng() < 0.10;

        engine.step({
          move: currentMove,
          jump,
          dash,
          pulse,
          interact
        });
      }

      results.push(engine.state === 'won' ? 'won' : 'lost');
    } catch (err) {
      console.error(`Crash on night ${i}:`, err);
      crashes++;
      results.push('crash');
    }
  }

  // Force GC suggestion if available, then measure mem_end
  const memEndMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
  const durationS = Math.round(((performance.now() - startTime) / 1000) * 10) / 10;

  const soakOutput = {
    nights: nightsCount,
    crashes,
    results,
    mem_start_mb: memStartMb,
    mem_end_mb: memEndMb,
    duration_s: durationS
  };

  const resolvedOut = path.resolve(process.cwd(), outPath);
  const dir = path.dirname(resolvedOut);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(resolvedOut, JSON.stringify(soakOutput, null, 2), 'utf8');

  console.log(`Soak test completed: ${nightsCount} nights in ${durationS}s. Crashes: ${crashes}. Memory: ${memStartMb}MB -> ${memEndMb}MB.`);
  return soakOutput;
}

if (process.argv[1] && process.argv[1].endsWith('soak.js')) {
  const options = parseArgs();
  runSoakTest(options);
}
