import { round3 } from './math.js';

export const MAPS = {
  1: {
    night: 1,
    name: 'Đảo Bến',
    duration_s: 300,
    spawn: [0.0, 0.0, 0.0],
    facing_dir: [0.0, 1.0], // facing +Z
    island_radius: 40.0,
    lanterns: [
      { id: 'L1', pos: [0.0, 0.0, 25.0] },
      { id: 'L2', pos: [23.8, 0.0, 7.7] },
      { id: 'L3', pos: [14.7, 0.0, -20.2] },
      { id: 'L4', pos: [-14.7, 0.0, -20.2] },
      { id: 'L5', pos: [-23.8, 0.0, 7.7] }
    ],
    getGround(x, z) {
      const dist = Math.hypot(x, z);
      if (dist <= 40.0) return 0.0;
      return null; // fall off
    },
    getMoteSpawnPoints() {
      const points = [];
      // 8 points on radius 12m (every 45 deg from 0)
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        points.push([round3(12 * Math.cos(rad)), 0.0, round3(12 * Math.sin(rad))]);
      }
      // 16 points on radius 33m (every 22.5 deg from 0)
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        points.push([round3(33 * Math.cos(rad)), 0.0, round3(33 * Math.sin(rad))]);
      }
      return points;
    },
    getShadeSpawnPoints() {
      const points = [];
      // 12 points on radius 37m (15, 45, 75, ...)
      for (let i = 0; i < 12; i++) {
        const rad = ((15 + i * 30) * Math.PI) / 180;
        points.push([round3(37 * Math.cos(rad)), 0.0, round3(37 * Math.sin(rad))]);
      }
      return points;
    },
    jumpPads: [],
    charms: [],
    drifterSpawnInterval: null,
    shadeIntervalTicks: 480, // every 8s
    maxShades: 6,
    shadeSpeed: 4.0
  },

  2: {
    night: 2,
    name: 'Đảo Cau',
    duration_s: 330,
    spawn: [0.0, 0.0, 0.0],
    facing_dir: [0.0, 1.0],
    lanterns: [
      { id: 'L1', pos: [0.0, 0.0, 20.0] },
      { id: 'L2', pos: [17.0, 0.0, -10.0] },
      { id: 'L3', pos: [-17.0, 0.0, -10.0] },
      { id: 'L4', pos: [70.0, 0.0, 20.0] },
      { id: 'L5', pos: [87.0, 0.0, -10.0] },
      { id: 'L6', pos: [53.0, 0.0, -10.0] }
    ],
    getGround(x, z) {
      // Island A: center (0,0), radius 28
      if (Math.hypot(x, z) <= 28.0) return 0.0;
      // Island B: center (70,0), radius 28
      if (Math.hypot(x - 70.0, z) <= 28.0) return 0.0;
      // Bamboo bridge: x in [26, 44], z in [-2, 2]
      if (x >= 26.0 && x <= 44.0 && Math.abs(z) <= 2.0) return 0.0;
      return null;
    },
    jumpPads: [
      // Pad 1 at (20, 0, 18), launches towards Island B (70, 0, 0)
      {
        id: 'JP1',
        pos: [20.0, 0.0, 18.0],
        radius: 1.0,
        target: [70.0, 0.0, 0.0],
        vy: 14.0,
        vHoriz: 24.0
      },
      // Pad 2 at (50, 0, -18), launches towards Island A (0, 0, 0)
      {
        id: 'JP2',
        pos: [50.0, 0.0, -18.0],
        radius: 1.0,
        target: [0.0, 0.0, 0.0],
        vy: 14.0,
        vHoriz: 24.0
      }
    ],
    charms: [
      { id: 'C1', pos: [35.0, 0.0, 0.0] }
    ],
    getMoteSpawnPoints() {
      const points = [];
      const addIsland = (cx, cz) => {
        // 4 on radius 10 (0, 90, 180, 270)
        for (let i = 0; i < 4; i++) {
          const rad = (i * 90 * Math.PI) / 180;
          points.push([round3(cx + 10 * Math.cos(rad)), 0.0, round3(cz + 10 * Math.sin(rad))]);
        }
        // 8 on radius 22 (every 45)
        for (let i = 0; i < 8; i++) {
          const rad = (i * 45 * Math.PI) / 180;
          points.push([round3(cx + 22 * Math.cos(rad)), 0.0, round3(cz + 22 * Math.sin(rad))]);
        }
      };
      addIsland(0.0, 0.0);
      addIsland(70.0, 0.0);
      return points;
    },
    getShadeSpawnPoints() {
      const points = [];
      const addIsland = (cx, cz) => {
        for (let i = 0; i < 8; i++) {
          const rad = ((22.5 + i * 45) * Math.PI) / 180;
          points.push([round3(cx + 26 * Math.cos(rad)), 0.0, round3(cz + 26 * Math.sin(rad))]);
        }
      };
      addIsland(0.0, 0.0);
      addIsland(70.0, 0.0);
      return points;
    },
    drifterSpawnInterval: 1200, // tick 1200, 2400...
    shadeIntervalTicks: 420, // every 7s
    maxShades: 8,
    shadeSpeed: 4.0
  },

  3: {
    night: 3,
    name: 'Đảo Chuông',
    duration_s: 360,
    spawn: [0.0, 0.0, 0.0],
    facing_dir: [0.0, 1.0],
    lanterns: [
      { id: 'L1', pos: [0.0, 6.0, 6.0] },
      { id: 'L2', pos: [18.0, 3.0, 10.0] },
      { id: 'L3', pos: [-18.0, 3.0, 10.0] },
      { id: 'L4', pos: [35.0, 0.0, -10.0] },
      { id: 'L5', pos: [-35.0, 0.0, -10.0] },
      { id: 'L6', pos: [20.0, 0.0, -35.0] },
      { id: 'L7', pos: [-20.0, 0.0, -35.0] }
    ],
    getGround(x, z) {
      const r = Math.hypot(x, z);
      if (r > 45.0) return null; // off island
      if (r <= 2.0) return null; // bell tower cylinder wall

      // Tier 2: r <= 8m at Y = 6
      if (r <= 8.0) return 6.0;

      // Tier 1: r in [12, 24] with z > 0 at Y = 3
      if (r >= 12.0 && r <= 24.0 && z > 0) return 3.0;

      // Check Ramps at 30 deg and 150 deg (foot at r=30 Y=0, top at r=24 Y=3)
      if (r >= 24.0 && r <= 30.0) {
        const checkRamp = (centerDeg) => {
          const centerRad = (centerDeg * Math.PI) / 180;
          const rampDirX = Math.cos(centerRad);
          const rampDirZ = Math.sin(centerRad);
          // Distance from point to radial center-line
          const cross = Math.abs(x * rampDirZ - z * rampDirX);
          if (cross <= 1.5) {
            // Within 3m width ramp
            return 3.0 * ((30.0 - r) / 6.0);
          }
          return null;
        };

        const r1 = checkRamp(30);
        if (r1 !== null) return r1;
        const r2 = checkRamp(150);
        if (r2 !== null) return r2;
      }

      // Tier 0: Y = 0
      return 0.0;
    },
    jumpPads: [
      // Pad at (0, 3, 13) launches with vy=12, horizontal vel 8m/s towards -Z to land on Tier 2
      {
        id: 'JP1',
        pos: [0.0, 3.0, 13.0],
        radius: 1.0,
        target: [0.0, 6.0, 4.0],
        vy: 12.0,
        vHoriz: 8.0,
        fixedDir: [0.0, -1.0] // towards -Z
      }
    ],
    charms: [
      { id: 'C1', pos: [30.0, 0.0, 25.0] },
      { id: 'C2', pos: [-30.0, 0.0, 25.0] }
    ],
    getMoteSpawnPoints() {
      const points = [];
      // Tier 0: 18 points on r=34 (every 20 deg from 0)
      for (let i = 0; i < 18; i++) {
        const rad = (i * 20 * Math.PI) / 180;
        points.push([round3(34 * Math.cos(rad)), 0.0, round3(34 * Math.sin(rad))]);
      }
      // Tier 1: 8 points on r=18 (20, 40, ..., 160 deg), Y=3
      for (let i = 0; i < 8; i++) {
        const deg = 20 + i * 20;
        const rad = (deg * Math.PI) / 180;
        points.push([round3(18 * Math.cos(rad)), 3.0, round3(18 * Math.sin(rad))]);
      }
      // Tier 2: 4 points on r=5 (45, 135, 225, 315 deg), Y=6
      [45, 135, 225, 315].forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        points.push([round3(5 * Math.cos(rad)), 6.0, round3(5 * Math.sin(rad))]);
      });
      return points;
    },
    getShadeSpawnPoints() {
      const points = [];
      // 16 points on radius 43m (every 22.5 deg)
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        points.push([round3(43 * Math.cos(rad)), 0.0, round3(43 * Math.sin(rad))]);
      }
      return points;
    },
    drifterSpawnInterval: 1200,
    shadeIntervalTicks: 360, // every 6s
    maxShades: 10,
    shadeSpeed: 4.5
  }
};
