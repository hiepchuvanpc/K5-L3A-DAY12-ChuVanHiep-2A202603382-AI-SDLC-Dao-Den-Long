/**
 * Math utilities for Dao Den Long simulation.
 */

export function createRng(seed) {
  let s = Math.floor(seed) >>> 0;
  return function random() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function round3(val) {
  const rounded = Math.round(val * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function round1(val) {
  const rounded = Math.round(val * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function distanceXZ(posA, posB) {
  const dx = posA[0] - posB[0];
  const dz = posA[2] - posB[2];
  return Math.hypot(dx, dz);
}

export function normalizeVector2D(x, z) {
  const len = Math.hypot(x, z);
  if (len > 1.0) {
    return [x / len, z / len];
  }
  return [x, z];
}

/**
 * Transforms move vector [x, z] by camera yaw in degrees.
 * World direction:
 * x' = x * cos(θ) + z * sin(θ)
 * z' = -x * sin(θ) + z * cos(θ)
 */
export function transformMoveByCameraYaw(move, camYawDeg) {
  const [normX, normZ] = normalizeVector2D(move[0], move[1]);
  if (normX === 0 && normZ === 0) {
    return [0, 0];
  }
  const rad = (camYawDeg * Math.PI) / 180;
  const cosT = Math.cos(rad);
  const sinT = Math.sin(rad);

  const worldX = normX * cosT + normZ * sinT;
  const worldZ = -normX * sinT + normZ * cosT;
  return [worldX, worldZ];
}
