// Projection: world space to screen space for the chase camera.
// Forward is +z; heading 0 means flying north (+z). The camera sits behind the
// aircraft and looks along its heading, so the world turns around the pilot.
import { CONFIG } from './config.js';

export function makeCamera(plane, width, height) {
  const back = CONFIG.cameraDistance;
  const cx = plane.x - Math.sin(plane.heading) * back;
  const cz = plane.z - Math.cos(plane.heading) * back;
  const cy = plane.y + CONFIG.cameraHeight + plane.pitch * 2;
  return { x: cx, y: cy, z: cz, heading: plane.heading, width, height };
}

// Returns null when the point is behind the camera.
export function project(camera, px, py, pz) {
  const dx = px - camera.x;
  const dy = py - camera.y;
  const dz = pz - camera.z;
  const sin = Math.sin(-camera.heading);
  const cos = Math.cos(-camera.heading);
  // Rotate into camera space: forward becomes +depth.
  const rx = dx * cos - dz * sin;
  const rz = dx * sin + dz * cos;
  const depth = rz;
  if (depth < 4) return null;
  const f = CONFIG.focalLength;
  const sx = camera.width / 2 + (rx / depth) * f;
  const sy = camera.height * 0.46 - (dy / depth) * f;
  return { x: sx, y: sy, depth, scale: f / depth };
}

export function horizonY(camera, width, height) {
  return height * 0.46;
}

export function distanceTo(camera, px, pz) {
  const dx = px - camera.x;
  const dz = pz - camera.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// Screen-space size of a world radius at a given depth.
export function screenRadius(depth, worldRadius) {
  if (depth < 4) return 0;
  return (worldRadius / depth) * CONFIG.focalLength;
}
