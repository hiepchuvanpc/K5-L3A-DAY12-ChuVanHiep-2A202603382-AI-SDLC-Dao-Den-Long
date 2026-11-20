#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { GameEngine } from '../core/engine.js';
import { loadTuning } from '../core/config.js';

function parseArgs(args) {
  const options = {
    seed: 42,
    night: 1,
    ticks: null,
    out: null,
    scenario: null,
    inputs: null,
    snapshotEvery: 10
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed' && i + 1 < args.length) {
      options.seed = parseInt(args[++i], 10);
    } else if (arg === '--night' && i + 1 < args.length) {
      options.night = parseInt(args[++i], 10);
    } else if (arg === '--ticks' && i + 1 < args.length) {
      options.ticks = parseInt(args[++i], 10);
    } else if (arg === '--out' && i + 1 < args.length) {
      options.out = args[++i];
    } else if (arg === '--scenario' && i + 1 < args.length) {
      options.scenario = args[++i];
    } else if (arg === '--inputs' && i + 1 < args.length) {
      options.inputs = args[++i];
    } else if (arg === '--snapshot-every' && i + 1 < args.length) {
      options.snapshotEvery = parseInt(args[++i], 10);
    }
  }

  return options;
}

function validateAndLoadScenario(filePath) {
  if (!filePath) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) {
      process.stderr.write(`Invalid scenario file format: ${filePath}\n`);
      process.exit(2);
    }
    return data;
  } catch (err) {
    process.stderr.write(`Failed to load scenario ${filePath}: ${err.message}\n`);
    process.exit(2);
  }
}

function validateAndLoadInputs(filePath) {
  if (!filePath) return { frames: [] };
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.frames)) {
      process.stderr.write(`Invalid inputs format (missing frames array): ${filePath}\n`);
      process.exit(2);
    }

    let lastTick = -1;
    for (const frame of data.frames) {
      if (typeof frame.tick !== 'number' || frame.tick <= lastTick) {
        process.stderr.write(`Invalid inputs: frame ticks must be strictly increasing.\n`);
        process.exit(2);
      }
      lastTick = frame.tick;
    }

    return data;
  } catch (err) {
    process.stderr.write(`Failed to load inputs ${filePath}: ${err.message}\n`);
    process.exit(2);
  }
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (typeof options.ticks !== 'number' || !options.out) {
    process.stderr.write('Usage: headless.js --seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]\n');
    process.exit(1);
  }

  const scenarioData = validateAndLoadScenario(options.scenario);
  const inputsData = validateAndLoadInputs(options.inputs);
  const tuning = loadTuning();

  const engine = new GameEngine({
    seed: options.seed,
    night: options.night,
    tuning,
    scenario: scenarioData
  });

  const outDir = path.dirname(path.resolve(options.out));
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outStream = fs.createWriteStream(options.out, { encoding: 'utf8' });

  const writeLine = (obj) => {
    outStream.write(JSON.stringify(obj) + '\n');
  };

  // Snapshot tick 0
  if (options.snapshotEvery > 0 && 0 % options.snapshotEvery === 0) {
    writeLine(engine.getSnapshot());
  }

  // Build frame lookup map
  const frameMap = new Map();
  for (const frame of inputsData.frames) {
    frameMap.set(frame.tick, frame);
  }

  const currentInput = {
    move: [0, 0],
    cam_yaw_deg: 0,
    interact: false,
    pulse: false,
    jump: false
  };

  for (let k = 0; k < options.ticks; k++) {
    if (frameMap.has(k)) {
      const update = frameMap.get(k);
      if (Array.isArray(update.move)) {
        currentInput.move = [update.move[0] ?? 0, update.move[1] ?? 0];
      }
      if (typeof update.cam_yaw_deg === 'number') {
        currentInput.cam_yaw_deg = update.cam_yaw_deg;
      }
      if (typeof update.interact === 'boolean') {
        currentInput.interact = update.interact;
      }
      if (typeof update.pulse === 'boolean') {
        currentInput.pulse = update.pulse;
      }
      if (typeof update.jump === 'boolean') {
        currentInput.jump = update.jump;
      }
    }

    const events = engine.step(currentInput);

    for (const ev of events) {
      writeLine(ev);
    }

    if (options.snapshotEvery > 0 && (k + 1) % options.snapshotEvery === 0) {
      writeLine(engine.getSnapshot());
    }

    if (engine.state !== 'playing') {
      break;
    }
  }

  // Final end line
  writeLine(engine.getEnd());
  outStream.end();
}

run().catch((err) => {
  process.stderr.write(`Fatal execution error: ${err.stack || err}\n`);
  process.exit(1);
});
