// Ember Isles terrain: a small archipelago built from fixed island shapes and
// smooth ridge noise. Deterministic on purpose: the same coordinates always give
// the same height, so screenshots and replays agree and no asset is needed.
import { CONFIG } from './config.js';

const ISLANDS = [
  // Coral Airstrip island: flat, with the runway along its spine.
  { x: 0, z: 0, radius: 330, height: 26, flat: true },
  // Lagoon islet, low and sandy.
  { x: -430, z: 620, radius: 170, height: 14, flat: false },
  // Palm islet east of the strip.
  { x: 470, z: 540, radius: 150, height: 18, flat: false },
  // The high ridge island to the north, home of the storm gap.
  { x: 120, z: -1150, radius: 420, height: 150, flat: false },
  // Far western headland.
  { x: -760, z: -420, radius: 260, height: 64, flat: false },
  // Far eastern rock.
  { x: 820, z: -760, radius: 220, height: 88, flat: false },
];

// Smooth deterministic wobble: layered sines, no random table to ship.
export function ridgeNoise(x, z) {
  return (
    Math.sin(x * 0.011 + z * 0.004) * 0.5 +
    Math.sin(x * 0.023 - z * 0.017) * 0.3 +
    Math.sin((x + z) * 0.006) * 0.2
  );
}

export function terrainHeight(x, z) {
  let h = -6; // seabed under the open sea
  for (const island of ISLANDS) {
    const dx = x - island.x;
    const dz = z - island.z;
    const d = Math.sqrt(dx * dx + dz * dz) / island.radius;
    if (d >= 1) continue;
    const falloff = Math.pow(1 - d * d, 1.6);
    if (island.flat) {
      // Airstrip island: a flat top so the runway sits level.
      h = Math.max(h, -6 + (island.height + 6) * Math.min(1, falloff * 3));
    } else {
      const bump = island.height * falloff;
      const rough = ridgeNoise(x, z) * 9 * falloff;
      h = Math.max(h, -6 + bump + rough);
    }
  }
  return h;
}

export function groundKind(height) {
  if (height <= 1.5) return 'sand';
  if (height <= 26) return 'grass';
  if (height <= 58) return 'forest';
  if (height <= 105) return 'rock';
  return 'snow';
}

// The runway: a flat strip on the airstrip island, heading north. Its surface
// sits just above the island's flat top (26) so it paints over the terrain.
export const RUNWAY = {
  x: 0,
  zStart: -190,
  zEnd: 190,
  halfWidth: 11,
  surfaceY: 26.5,
};

export function isOnRunway(x, z) {
  return Math.abs(x - RUNWAY.x) <= RUNWAY.halfWidth && z >= RUNWAY.zStart && z <= RUNWAY.zEnd;
}

export function isNearRunway(x, z, margin) {
  return Math.abs(x - RUNWAY.x) <= RUNWAY.halfWidth + margin && z >= RUNWAY.zStart - margin && z <= RUNWAY.zEnd + margin;
}

// Ember rings: glowing target rings the pilot threads in order.
export function ringCourse(missionId) {
  if (missionId === 'ridge-rescue') {
    // The ridge island rises to ~140, so the gap rings sit well clear of it.
    return [
      { x: 40, y: 155, z: -760, r: 16 },
      { x: 110, y: 175, z: -980, r: 15 },
      { x: 120, y: 168, z: -1120, r: 14 },
    ];
  }
  if (missionId === 'airstrip-landing') {
    return [{ x: 0, y: 46, z: 330, r: 17 }];
  }
  return [
    { x: -90, y: 62, z: 300, r: 17 },
    { x: -210, y: 58, z: 520, r: 16 },
    { x: -180, y: 74, z: 760, r: 16 },
    { x: 60, y: 70, z: 820, r: 15 },
    { x: 260, y: 66, z: 560, r: 15 },
    { x: 130, y: 60, z: 330, r: 16 },
  ];
}

// Clouds: fixed puffs the camera flies under; drawn as soft billboards.
// Kept small and high so they never crowd the HUD or the aircraft.
export const CLOUDS = [
  { x: -260, y: 300, z: 300, s: 55 },
  { x: 240, y: 330, z: 620, s: 70 },
  { x: -80, y: 350, z: -300, s: 65 },
  { x: 420, y: 310, z: -80, s: 48 },
  { x: -520, y: 330, z: -700, s: 75 },
  { x: 60, y: 370, z: -1000, s: 80 },
  { x: -420, y: 290, z: 900, s: 60 },
  { x: 560, y: 340, z: 980, s: 65 },
];

export function sunDirection() {
  return { x: -0.42, y: 0.30, z: -1 };
}

export { CONFIG };
