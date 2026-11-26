// Screenshot staging: ?shot=cover|rings|landing|storm places the Kestrel in a
// real, live flight state and skips the title screen, so the maker's screenshots
// are renders of the game's own code, not set dressing. The game keeps running
// from there: these are starting states, not pictures.
import { createPlane } from './aircraft.js';
import { CONFIG } from './config.js';

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  return CONFIG.shotDefaults[shot] ? shot : null;
}

export function stageShot(shot, plane) {
  // Start from the mission's normal start, then move the aircraft so the shot
  // shows what the bounty asks for: terrain, aircraft, instruments, and a
  // runway or ring ahead.
  if (shot === 'cover') {
    // South of the strip, flying north: the runway lies ahead, then the rings.
    plane.x = -18;
    plane.y = 82;
    plane.z = -300;
    plane.heading = 0.06;
    plane.pitch = 0.02;
    plane.roll = -0.06;
    plane.speed = 62;
    plane.throttle = 0.62;
  } else if (shot === 'rings') {
    // Lined up on ring 2: it fills the frame ahead, ring 3 beyond it.
    plane.x = -195;
    plane.y = 60;
    plane.z = 455;
    plane.heading = -0.24;
    plane.pitch = 0;
    plane.roll = 0.1;
    plane.speed = 66;
    plane.throttle = 0.7;
    plane.ringsPassed = 1;
    plane.rings[0].passed = true;
    plane.score = CONFIG.ringScore;
  } else if (shot === 'landing') {
    // Short final, close and low, offset to one side so the runway reads
    // beside the aircraft instead of hiding behind it.
    plane.x = 34;
    plane.y = 48;
    plane.z = 255;
    plane.heading = Math.PI - 0.08;
    plane.pitch = -0.05;
    plane.roll = 0.06;
    plane.speed = 44;
    plane.throttle = 0.32;
    plane.rings.forEach((r) => {
      r.passed = true;
    });
    plane.ringsPassed = plane.rings.length;
    plane.score = CONFIG.ringScore * plane.rings.length;
    plane.stateMessage = 'FINAL APPROACH — SLOW, LEVEL, CENTRELINE';
    plane.messageTimer = 99;
  } else if (shot === 'storm') {
    // Over the ridge gap, southbound: the next ring hangs above the ridge.
    plane.x = 70;
    plane.y = 170;
    plane.z = -880;
    plane.heading = Math.PI + 0.05;
    plane.pitch = 0.03;
    plane.roll = -0.12;
    plane.speed = 70;
    plane.throttle = 0.78;
    plane.fuel = 62;
    plane.ringsPassed = 2;
    plane.rings[0].passed = true;
    plane.rings[1].passed = true;
    plane.score = CONFIG.ringScore * 2;
  }
  return plane;
}

export function planeForShot(shot) {
  const mission = CONFIG.shotDefaults[shot]?.mission ?? 'ring-run';
  const plane = createPlane(mission);
  return stageShot(shot, plane);
}
