import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng, round3, distanceXZ, normalizeVector2D, transformMoveByCameraYaw } from '../src/core/math.js';

test('createRng generates deterministic sequence', () => {
  const rng1 = createRng(12345);
  const rng2 = createRng(12345);
  for (let i = 0; i < 50; i++) {
    assert.equal(rng1(), rng2());
  }
});

test('round3 rounds correctly', () => {
  assert.equal(round3(1.23456), 1.235);
  assert.equal(round3(0.0001), 0);
  assert.equal(round3(-0.0), 0);
});

test('distanceXZ calculates Euclidean distance in XZ plane', () => {
  assert.equal(distanceXZ([0, 10, 0], [3, 99, 4]), 5);
});

test('normalizeVector2D normalizes vector longer than 1', () => {
  const [nx, nz] = normalizeVector2D(3, 4);
  assert.equal(Math.hypot(nx, nz), 1.0);
  assert.equal(round3(nx), 0.6);
  assert.equal(round3(nz), 0.8);
});

test('transformMoveByCameraYaw implements exact PRD-0 formula', () => {
  // When camYawDeg = 0: x' = x, z' = z
  let [wx, wz] = transformMoveByCameraYaw([0, 1], 0);
  assert.equal(round3(wx), 0);
  assert.equal(round3(wz), 1);

  // When camYawDeg = 90 deg:
  // x' = x*cos(90) + z*sin(90) = 0 + 1*1 = 1
  // z' = -x*sin(90) + z*cos(90) = 0 + 0 = 0
  [wx, wz] = transformMoveByCameraYaw([0, 1], 90);
  assert.equal(round3(wx), 1);
  assert.equal(round3(wz), 0);
});
