// Flight model: throttle, lift, stall, banking turns, wind, fuel and damage.
// The numbers live in config.js; this file only integrates them, so the feel can
// be tuned without touching the physics.
import { CONFIG, MISSIONS } from './config.js';
import { terrainHeight, isOnRunway, ringCourse } from './terrain.js';

export function createPlane(missionId) {
  const start = startState(missionId);
  return {
    x: start.x,
    y: start.y,
    z: start.z,
    heading: start.heading,
    pitch: 0, // radians, positive = nose up
    roll: 0, // radians, positive = bank right
    speed: start.speed,
    throttle: start.throttle,
    verticalSpeed: 0,
    fuel: CONFIG.fuelCapacity,
    damage: 0,
    ringsPassed: 0,
    score: 0,
    time: 0,
    state: 'flying', // flying | crashed | landed | complete
    stateMessage: '',
    messageTimer: 0,
    propAngle: 0,
    smoke: [],
    windGust: 0,
    windTimer: 0,
    missionId,
    rings: ringCourse(missionId).map((r) => ({ ...r, passed: false })),
    landedCleanly: false,
  };
}

export function startState(missionId) {
  if (missionId === 'airstrip-landing') {
    return { x: 0, y: 120, z: 620, heading: Math.PI, speed: 52, throttle: 0.45 };
  }
  if (missionId === 'ridge-rescue') {
    // South toward the ridge (heading PI: forward is -z from here).
    return { x: -40, y: 88, z: 240, heading: Math.PI, speed: 58, throttle: 0.6 };
  }
  return { x: 0, y: 78, z: -120, heading: 0, speed: 58, throttle: 0.6 };
}

export function missionOf(plane) {
  return MISSIONS.find((m) => m.id === plane.missionId) ?? MISSIONS[0];
}

// steer: { pitchInput -1..1 (up positive), rollInput -1..1 (right positive),
//          throttleInput -1..1 } — keyboard and mouse both feed this shape.
export function updatePlane(plane, steer, dt) {
  if (plane.state !== 'flying') {
    updateAftermath(plane, dt);
    return;
  }
  plane.time += dt;
  plane.propAngle += dt * (4 + plane.throttle * 26);

  // Wind: slow gusts push the nose a touch; shown on the HUD as WIND.
  plane.windTimer -= dt;
  if (plane.windTimer <= 0) {
    plane.windTimer = 3 + Math.random() * 4;
    plane.windGust = (Math.random() - 0.5) * 0.05;
  }

  // Throttle and speed: drag grows with speed, lift needs speed.
  plane.throttle = clamp(plane.throttle + steer.throttleInput * dt * 0.7, 0, 1);
  const thrust = plane.throttle * CONFIG.throttleAccel * (plane.fuel > 0 ? 1 : 0.12);
  const drag = CONFIG.drag * plane.speed * 0.22;
  plane.speed = Math.max(0, plane.speed + (thrust - drag) * dt);

  // Attitude: controls answer at every speed, but weakly when stalled.
  const authority = plane.speed < CONFIG.stallSpeed ? 0.45 : 1;
  const targetPitch = steer.pitchInput * 0.42 * authority;
  const targetRoll = steer.rollInput * 0.85 * authority;
  plane.pitch += (targetPitch - plane.pitch) * Math.min(1, dt * 4.5);
  plane.roll += (targetRoll - plane.roll) * Math.min(1, dt * 5);

  // Turning follows the bank; climbing costs speed, diving gains it.
  const turn = -plane.roll * CONFIG.turnRate * (plane.speed / CONFIG.cruiseSpeed);
  plane.heading += (turn + plane.windGust * 0.2) * dt;
  const stalled = plane.speed < CONFIG.stallSpeed;
  const lift = stalled ? -CONFIG.gravity * 0.55 : Math.sin(plane.pitch) * plane.speed * CONFIG.liftFactor;
  plane.verticalSpeed += (lift - CONFIG.gravity * (stalled ? 0.4 : 0.12) - plane.verticalSpeed * 0.4) * dt;
  plane.verticalSpeed = clamp(plane.verticalSpeed, -26, 22);

  // Move.
  const forward = plane.speed * dt;
  plane.x += Math.sin(plane.heading) * forward;
  plane.z += Math.cos(plane.heading) * forward;
  plane.y += plane.verticalSpeed * dt + Math.sin(plane.pitch) * forward * 0.35;

  // Fuel: throttle is the decision — full power drinks, idle sips.
  plane.fuel = Math.max(
    0,
    plane.fuel - (CONFIG.fuelBurnIdle + (CONFIG.fuelBurnFull - CONFIG.fuelBurnIdle) * plane.throttle) * dt,
  );

  checkRings(plane);
  checkGround(plane, dt);
  if (plane.messageTimer > 0) plane.messageTimer -= dt;
  updateSmoke(plane, dt);
}

function checkRings(plane) {
  const next = plane.rings.find((r) => !r.passed);
  if (!next) return;
  const dx = plane.x - next.x;
  const dy = plane.y - next.y;
  const dz = plane.z - next.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist < next.r) {
    next.passed = true;
    plane.ringsPassed += 1;
    plane.score += CONFIG.ringScore;
    plane.stateMessage = `RING ${plane.ringsPassed}/${plane.rings.length}  +${CONFIG.ringScore}`;
    plane.messageTimer = 2.2;
    plane.ringFlash = 1;
  }
  if (plane.ringFlash > 0) plane.ringFlash -= 0.03;
}

function checkGround(plane, dt) {
  const ground = terrainHeight(plane.x, plane.z);
  const clearance = plane.y - ground;
  const onStrip = isOnRunway(plane.x, plane.z);

  if (clearance <= 0.4) {
    const descent = -plane.verticalSpeed;
    const gentle = descent < 4 && plane.speed < 46 && Math.abs(plane.roll) < 0.35;
    if (onStrip && gentle) {
      // Wheels on the strip: roll out, then the sortie is complete.
      plane.state = plane.rings.every((r) => r.passed) || plane.missionId === 'airstrip-landing' ? 'complete' : 'landed';
      plane.landedCleanly = true;
      const bonus = descent < 2 ? CONFIG.perfectLandingBonus : 0;
      plane.score += CONFIG.landingScore + bonus;
      plane.stateMessage = bonus > 0 ? `PERFECT LANDING  +${CONFIG.landingScore + bonus}` : `LANDED  +${CONFIG.landingScore}`;
      plane.messageTimer = 6;
      plane.y = ground + 0.4;
      plane.speed *= 0.4;
    } else if (onStrip && !gentle) {
      plane.damage += CONFIG.damagePerHardLanding;
      plane.stateMessage = 'HARD LANDING — DAMAGE!';
      plane.messageTimer = 2.5;
      if (plane.damage >= 100) return crashPlane(plane, 'The Kestrel broke up on the runway.');
      plane.y = ground + 0.4;
      plane.verticalSpeed = 2;
      plane.speed *= 0.55;
    } else {
      return crashPlane(plane, clearance <= 0.4 && ground <= 1.5 ? 'Ditched in the sea.' : 'Crashed into the terrain.');
    }
  }

  // Water at sea level away from land counts as a ditching.
  if (plane.y <= 0.6 && ground <= 1.5) {
    return crashPlane(plane, 'Ditched in the sea.');
  }
  return undefined;
}

export function crashPlane(plane, message) {
  plane.state = 'crashed';
  plane.damage = 100;
  plane.stateMessage = message;
  plane.messageTimer = 99;
  plane.crashTimer = 0;
  burstSmoke(plane, 26);
}

function burstSmoke(plane, count) {
  for (let i = 0; i < count; i += 1) {
    plane.smoke.push({
      x: plane.x + (Math.random() - 0.5) * 6,
      y: plane.y + Math.random() * 3,
      z: plane.z + (Math.random() - 0.5) * 6,
      life: 1.5 + Math.random(),
      size: 3 + Math.random() * 5,
    });
  }
}

function updateSmoke(plane, dt) {
  for (const puff of plane.smoke) {
    puff.life -= dt;
    puff.y += dt * 2;
    puff.size += dt * 3;
  }
  plane.smoke = plane.smoke.filter((p) => p.life > 0);
}

function updateAftermath(plane, dt) {
  if (plane.state === 'crashed') {
    plane.crashTimer = (plane.crashTimer ?? 0) + dt;
    plane.y = Math.max(terrainHeight(plane.x, plane.z) + 0.4, plane.y - dt * 2);
    updateSmoke(plane, dt);
    if (plane.crashTimer > 0.4 && plane.smoke.length < 30) burstSmoke(plane, 2);
  }
  if (plane.state === 'landed' || plane.state === 'complete') {
    plane.speed = Math.max(0, plane.speed - dt * 14);
    plane.z += Math.cos(plane.heading) * plane.speed * dt;
    plane.x += Math.sin(plane.heading) * plane.speed * dt;
  }
}

export function nextRing(plane) {
  return plane.rings.find((r) => !r.passed) ?? null;
}

export function ringsRemaining(plane) {
  return plane.rings.filter((r) => !r.passed).length;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
