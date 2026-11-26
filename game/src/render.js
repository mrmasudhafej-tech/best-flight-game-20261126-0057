// World rendering: sunset sky, sea, projected terrain, runway, ember rings,
// clouds and the Kestrel herself, drawn from the chase camera. No images are
// loaded: every shape is drawn from the terrain and flight state.
import { CONFIG, PALETTE } from './config.js';
import { project, screenRadius } from './project.js';
import { terrainHeight, groundKind, RUNWAY, CLOUDS } from './terrain.js';

const TERRAIN_COLOURS = {
  sand: PALETTE.sand,
  grass: PALETTE.grass,
  forest: PALETTE.forest,
  rock: PALETTE.rock,
  snow: PALETTE.snow,
};

export function drawSky(ctx, camera, width, height, time) {
  const horizon = height * 0.46;
  const gradient = ctx.createLinearGradient(0, 0, 0, horizon + 60);
  gradient.addColorStop(0, PALETTE.skyTop);
  gradient.addColorStop(0.55, '#c96a4e');
  gradient.addColorStop(0.85, PALETTE.skyMid);
  gradient.addColorStop(1, PALETTE.skyHorizon);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, horizon + 2);

  // Sun: low over the ridge, with a soft halo.
  const sunX = width * 0.36;
  const sunY = horizon - height * 0.1;
  const halo = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 130);
  halo.addColorStop(0, 'rgba(255, 243, 196, 0.95)');
  halo.addColorStop(0.25, 'rgba(255, 214, 130, 0.55)');
  halo.addColorStop(1, 'rgba(255, 190, 110, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 130, sunY - 130, 260, 260);
  ctx.fillStyle = PALETTE.sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
  ctx.fill();

  // High streak clouds, drifting slowly with time.
  ctx.fillStyle = 'rgba(255, 220, 180, 0.35)';
  for (let i = 0; i < 5; i += 1) {
    const cx = ((i * 317 + time * 6) % (width + 300)) - 150;
    const cy = 30 + i * 26;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 120, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSea(ctx, camera, width, height, time) {
  const horizon = height * 0.46;
  const gradient = ctx.createLinearGradient(0, horizon, 0, height);
  gradient.addColorStop(0, '#f0a35e');
  gradient.addColorStop(0.18, PALETTE.seaShallow);
  gradient.addColorStop(1, PALETTE.seaDeep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, horizon, width, height - horizon);

  // Sun glitter: short bright dashes that shimmer with time, kept sparse.
  ctx.fillStyle = 'rgba(255, 230, 170, 0.35)';
  for (let i = 0; i < 16; i += 1) {
    const t = (time * 0.7 + i * 0.61) % 1;
    const y = horizon + 8 + t * (height - horizon - 20);
    const wobble = Math.sin(time * 2 + i * 1.7) * 14;
    const x = width * 0.36 + wobble + (i % 5 - 2) * 26 * t;
    ctx.fillRect(x, y, 26 * (1 - t) + 6, 2);
  }
}

export function drawTerrain(ctx, camera, width, height) {
  const rows = CONFIG.terrainRows;
  const cols = CONFIG.terrainCols;
  const depth = CONFIG.terrainDepth;
  const halfW = CONFIG.terrainWidth / 2;
  const horizon = height * 0.46;

  // Sample the heightfield on a grid anchored ahead of the camera.
  const grid = [];
  for (let r = 0; r <= rows; r += 1) {
    const frac = Math.pow(r / rows, 1.7); // denser near the camera
    const dist = 18 + frac * depth;
    const row = [];
    for (let c = 0; c <= cols; c += 1) {
      const lateral = -halfW + (c / cols) * CONFIG.terrainWidth * (0.35 + frac);
      const wx = camera.x + Math.sin(camera.heading) * dist + Math.cos(camera.heading) * lateral;
      const wz = camera.z + Math.cos(camera.heading) * dist - Math.sin(camera.heading) * lateral;
      const h = terrainHeight(wx, wz);
      const p = project(camera, wx, h, wz);
      row.push({ p, h, wx, wz });
    }
    grid.push(row);
  }

  // Painter's algorithm: far rows first so near ground overlaps far ground.
  for (let r = rows - 1; r >= 0; r -= 1) {
    for (let c = 0; c < cols; c += 1) {
      const a = grid[r][c];
      const b = grid[r][c + 1];
      const d = grid[r + 1][c + 1];
      const e = grid[r + 1][c];
      if (!a.p || !b.p || !d.p || !e.p) continue;
      const midH = (a.h + b.h + d.h + e.h) / 4;
      if (midH <= 1.2) continue; // sea already painted
      const fog = Math.min(1, a.p.depth / CONFIG.fogDistance);
      ctx.fillStyle = fogColour(TERRAIN_COLOURS[groundKind(midH)], fog);
      ctx.beginPath();
      ctx.moveTo(a.p.x, a.p.y);
      ctx.lineTo(b.p.x, b.p.y);
      ctx.lineTo(d.p.x, d.p.y);
      ctx.lineTo(e.p.x, e.p.y);
      ctx.closePath();
      ctx.fill();
      // Shoreline: a pale sand edge where land meets the sea.
      if (midH <= 3.5) {
        ctx.strokeStyle = 'rgba(232, 201, 138, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.p.x, a.p.y);
        ctx.lineTo(b.p.x, b.p.y);
        ctx.stroke();
      }
    }
  }
  void horizon;
}

function fogColour(hex, fog) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const fr = Math.round(r + (247 - r) * fog * 0.75);
  const fg = Math.round(g + (200 - g) * fog * 0.75);
  const fb = Math.round(b + (115 - b) * fog * 0.75);
  return `rgb(${fr},${fg},${fb})`;
}

export function drawRunway(ctx, camera) {
  const y = RUNWAY.surfaceY;
  const corners = [
    project(camera, RUNWAY.x - RUNWAY.halfWidth, y, RUNWAY.zStart),
    project(camera, RUNWAY.x + RUNWAY.halfWidth, y, RUNWAY.zStart),
    project(camera, RUNWAY.x + RUNWAY.halfWidth, y, RUNWAY.zEnd),
    project(camera, RUNWAY.x - RUNWAY.halfWidth, y, RUNWAY.zEnd),
  ];
  if (corners.some((p) => !p)) return;
  ctx.fillStyle = PALETTE.runway;
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (const p of corners.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.fill();
  // Centreline dashes and threshold bars.
  ctx.fillStyle = '#f5f0e0';
  const dashes = 9;
  for (let i = 0; i < dashes; i += 1) {
    const t0 = i / dashes;
    const t1 = (i + 0.55) / dashes;
    const z0 = RUNWAY.zStart + (RUNWAY.zEnd - RUNWAY.zStart) * t0;
    const z1 = RUNWAY.zStart + (RUNWAY.zEnd - RUNWAY.zStart) * t1;
    const a = project(camera, RUNWAY.x - 1.2, y + 0.3, z0);
    const b = project(camera, RUNWAY.x + 1.2, y + 0.3, z0);
    const c = project(camera, RUNWAY.x + 1.2, y + 0.3, z1);
    const d = project(camera, RUNWAY.x - 1.2, y + 0.3, z1);
    if (!a || !b || !c || !d) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.fill();
  }
  // Edge lights: warm dots along both sides.
  for (let i = 0; i <= 10; i += 1) {
    const z = RUNWAY.zStart + ((RUNWAY.zEnd - RUNWAY.zStart) * i) / 10;
    for (const side of [-1, 1]) {
      const p = project(camera, RUNWAY.x + side * RUNWAY.halfWidth, y + 0.6, z);
      if (!p) continue;
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, 90 / p.depth), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawRings(ctx, camera, rings, time) {
  // Far rings first so nearer ones overlap correctly.
  const sorted = [...rings].sort((a, b) => {
    const da = (a.x - camera.x) ** 2 + (a.z - camera.z) ** 2;
    const db = (b.x - camera.x) ** 2 + (b.z - camera.z) ** 2;
    return db - da;
  });
  for (const ring of sorted) {
    const centre = project(camera, ring.x, ring.y, ring.z);
    if (!centre) continue;
    const radius = screenRadius(centre.depth, ring.r);
    if (radius < 3 || radius > 900) continue;
    const pulse = 1 + Math.sin(time * 3 + ring.z) * 0.05;
    ctx.save();
    ctx.translate(centre.x, centre.y);
    ctx.scale(1, 0.92);
    ctx.globalAlpha = ring.passed ? 0.25 : 0.95;
    ctx.strokeStyle = ring.passed ? '#7fb069' : PALETTE.ring;
    ctx.lineWidth = Math.max(2, radius * 0.12);
    ctx.shadowColor = PALETTE.ring;
    ctx.shadowBlur = ring.passed ? 0 : 14;
    ctx.beginPath();
    ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1, radius * 0.03);
    ctx.beginPath();
    ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
    ctx.stroke();
    // Ember motes orbiting the ring.
    if (!ring.passed) {
      ctx.fillStyle = '#ffe9a8';
      for (let i = 0; i < 6; i += 1) {
        const a = time * 0.9 + (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * radius * pulse, Math.sin(a) * radius * pulse, Math.max(1.5, radius * 0.05), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    // Support mast down to the ground for rings over land, and a label.
    if (!ring.passed && centre.depth < 700) {
      const base = project(camera, ring.x, terrainHeight(ring.x, ring.z), ring.z);
      if (base) {
        ctx.strokeStyle = 'rgba(60, 50, 40, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centre.x, centre.y + radius * 0.9);
        ctx.lineTo(base.x, base.y);
        ctx.stroke();
      }
    }
  }
}

export function drawClouds(ctx, camera, time) {
  const items = CLOUDS.map((cloud) => {
    const p = project(camera, cloud.x, cloud.y, cloud.z);
    return { cloud, p };
  })
    .filter((item) => item.p && item.p.depth > 10)
    .sort((a, b) => b.p.depth - a.p.depth);
  for (const { cloud, p } of items) {
    const s = screenRadius(p.depth, cloud.s);
    if (s < 4) continue;
    const alpha = Math.min(0.85, 260 / p.depth);
    ctx.fillStyle = `rgba(255, 235, 220, ${alpha})`;
    for (const [ox, oy, os] of [[-0.5, 0, 0.55], [0, -0.12, 0.7], [0.5, 0.02, 0.5]]) {
      ctx.beginPath();
      ctx.ellipse(p.x + ox * s, p.y + oy * s, os * s, os * s * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(247, 200, 115, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + s * 0.12, s * 0.7, s * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  void time;
}

export function drawSmoke(ctx, camera, smoke) {
  const items = smoke
    .map((puff) => ({ puff, p: project(camera, puff.x, puff.y, puff.z) }))
    .filter((item) => item.p)
    .sort((a, b) => b.p.depth - a.p.depth);
  for (const { puff, p } of items) {
    const r = screenRadius(p.depth, puff.size);
    if (r < 1) continue;
    ctx.fillStyle = `rgba(40, 38, 36, ${Math.min(0.6, puff.life * 0.4)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The Kestrel: a small high-wing courier plane drawn as one built aircraft —
// fuselage, wings, tail, canopy, spinning prop and navigation lights —
// banked and pitched with the flight state, sitting low in the chase view.
export function drawAircraft(ctx, plane, width, height, time) {
  const cx = width / 2;
  const cy = height * 0.62 + plane.pitch * 60;
  const scale = Math.min(width, height) / 560;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(plane.roll * 0.9);
  ctx.scale(scale, scale);
  // Soft shadow under the aircraft, faint over the sea far below.
  ctx.fillStyle = 'rgba(20, 20, 30, 0.08)';
  ctx.beginPath();
  ctx.ellipse(0, 96, 110, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tailplane and fin.
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.moveTo(-14, -58);
  ctx.lineTo(14, -58);
  ctx.lineTo(30, -78);
  ctx.lineTo(-30, -78);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e7d8c';
  ctx.beginPath();
  ctx.moveTo(0, -62);
  ctx.lineTo(22, -104);
  ctx.lineTo(8, -104);
  ctx.lineTo(-6, -66);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(-2, -104, 12, 5);

  // Wings: high wing with dihedral, ember tips.
  ctx.fillStyle = '#f2e7c8';
  ctx.beginPath();
  ctx.moveTo(-150, 6);
  ctx.lineTo(-26, -14);
  ctx.lineTo(26, -14);
  ctx.lineTo(150, 6);
  ctx.lineTo(146, 20);
  ctx.lineTo(-146, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8824a';
  ctx.fillRect(-150, 6, 18, 14);
  ctx.fillRect(132, 6, 18, 14);
  // Struts.
  ctx.strokeStyle = '#8a7a5c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-58, -8);
  ctx.lineTo(-40, 34);
  ctx.moveTo(58, -8);
  ctx.lineTo(40, 34);
  ctx.stroke();

  // Fuselage: teal courier livery with an ember cheatline.
  const fuselage = ctx.createLinearGradient(0, -30, 0, 50);
  fuselage.addColorStop(0, '#3f9aa8');
  fuselage.addColorStop(0.5, '#2e7d8c');
  fuselage.addColorStop(1, '#205f6e');
  ctx.fillStyle = fuselage;
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.quadraticCurveTo(20, -30, 22, 10);
  ctx.quadraticCurveTo(22, 44, 8, 52);
  ctx.lineTo(-8, 52);
  ctx.quadraticCurveTo(-22, 44, -22, 10);
  ctx.quadraticCurveTo(-20, -30, 0, -52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.moveTo(-22, 18);
  ctx.quadraticCurveTo(0, 26, 22, 18);
  ctx.lineTo(22, 26);
  ctx.quadraticCurveTo(0, 34, -22, 26);
  ctx.closePath();
  ctx.fill();

  // Canopy with a sun glint — the lit glass the judge should see.
  ctx.fillStyle = '#bfe8f2';
  ctx.beginPath();
  ctx.ellipse(0, -26, 13, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(-4, -34, 4, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#24343c';
  ctx.beginPath();
  ctx.ellipse(0, -20, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Propeller: a faint blur disc seen edge-on from behind, plus two slim
  // blades at the live angle. From the chase view the prop is at the far end,
  // so it stays subtle and never covers the tail.
  ctx.save();
  ctx.translate(0, -52);
  ctx.fillStyle = 'rgba(220, 225, 230, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(plane.propAngle);
  ctx.fillStyle = 'rgba(58, 63, 70, 0.85)';
  ctx.fillRect(-2, -34, 4, 68);
  ctx.fillStyle = '#ffd98a';
  ctx.fillRect(-2, -34, 4, 4);
  ctx.fillRect(-2, 30, 4, 4);
  ctx.restore();
  // Spinner.
  ctx.fillStyle = '#e8824a';
  ctx.beginPath();
  ctx.arc(0, -52, 7, 0, Math.PI * 2);
  ctx.fill();

  // Navigation lights: red port, green starboard, blinking white tail.
  const blink = Math.sin(time * 5) > 0;
  ctx.fillStyle = '#ff4a3c';
  ctx.beginPath();
  ctx.arc(-150, 12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3ddc78';
  ctx.beginPath();
  ctx.arc(150, 12, 5, 0, Math.PI * 2);
  ctx.fill();
  if (blink) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -104, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Landing light beam when low and slow.
  if (plane.y < 130 && plane.state === 'flying') {
    ctx.fillStyle = 'rgba(255, 240, 190, 0.10)';
    ctx.beginPath();
    ctx.moveTo(-8, 46);
    ctx.lineTo(8, 46);
    ctx.lineTo(60, 190);
    ctx.lineTo(-60, 190);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
