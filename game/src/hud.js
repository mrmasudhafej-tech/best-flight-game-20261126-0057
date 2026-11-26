// HUD and instruments: the lit panel the pilot flies by. Every number the
// bounty asks to be visible — altitude, speed, heading — is drawn large and
// labelled, twice: in the top bar and on the panel dials.
import { PALETTE } from './config.js';
import { nextRing } from './aircraft.js';
import { RUNWAY } from './terrain.js';

export function headingDegrees(heading) {
  const deg = ((heading * 180) / Math.PI) % 360;
  return Math.round((deg + 360) % 360);
}

export function compassPoint(deg) {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(deg / 45) % 8];
}

export function drawHud(ctx, plane, width, height, time, muted) {
  drawTopBar(ctx, plane, width, time, muted);
  drawCompassTape(ctx, plane, width);
  drawInstrumentPanel(ctx, plane, width, height, time);
  drawMissionBanner(ctx, plane, width, time);
  drawRingGuidance(ctx, plane, width, height);
  drawCentreMessage(ctx, plane, width, height);
}

function drawTopBar(ctx, plane, width, time, muted) {
  const hdg = headingDegrees(plane.heading);
  ctx.fillStyle = 'rgba(10, 16, 22, 0.62)';
  ctx.fillRect(0, 0, width, 44);
  ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'left';
  ctx.fillText(`ALT  ${Math.max(0, Math.round(plane.y * 3))} ft`, 16, 22);
  ctx.fillText(`SPD  ${Math.round(plane.speed * 2.2)} kt`, 170, 22);
  ctx.fillText(`HDG  ${String(hdg).padStart(3, '0')}° ${compassPoint(hdg)}`, 330, 22);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f2ede2';
  ctx.fillText(`SCORE ${plane.score}`, width - 140, 22);
  const wind = plane.windGust >= 0 ? `WIND → ${Math.abs(Math.round(plane.windGust * 400))}` : `WIND ← ${Math.abs(Math.round(plane.windGust * 400))}`;
  ctx.fillText(wind, width - 16, 22);
  void time;
  void muted;
}

function drawCompassTape(ctx, plane, width) {
  const hdg = headingDegrees(plane.heading);
  const cx = width / 2;
  const y = 62;
  ctx.fillStyle = 'rgba(10, 16, 22, 0.55)';
  ctx.fillRect(cx - 170, y - 14, 340, 28);
  ctx.strokeStyle = 'rgba(255, 233, 168, 0.5)';
  ctx.strokeRect(cx - 170, y - 14, 340, 28);
  ctx.font = '700 13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let offset = -60; offset <= 60; offset += 15) {
    const deg = (hdg + offset + 360) % 360;
    const x = cx + offset * 2.4;
    ctx.fillStyle = offset === 0 ? '#ffe9a8' : '#c8d4dc';
    ctx.fillText(deg % 90 === 0 ? compassPoint(deg) : String(deg).padStart(3, '0'), x, y);
    ctx.fillRect(x, y + 10, 1, 4);
  }
  ctx.fillStyle = '#ff5a3c';
  ctx.beginPath();
  ctx.moveTo(cx, y - 14);
  ctx.lineTo(cx - 6, y - 22);
  ctx.lineTo(cx + 6, y - 22);
  ctx.closePath();
  ctx.fill();
}

function drawInstrumentPanel(ctx, plane, width, height, time) {
  const panelH = 118;
  const y0 = height - panelH;
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, y0, width, panelH);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(0, y0, width, 3);
  // Lit edge glow along the panel top.
  ctx.fillStyle = 'rgba(255, 233, 168, 0.35)';
  ctx.fillRect(0, y0 + 3, width, 1);

  const dialY = y0 + 50;
  drawDial(ctx, 84, dialY, 37, 'AIRSPEED', `${Math.round(plane.speed * 2.2)}`, 'kt', plane.speed / 118, time);
  drawDial(ctx, 186, dialY, 37, 'ALTITUDE', `${Math.max(0, Math.round(plane.y * 3))}`, 'ft', Math.min(1, plane.y / 420), time);
  drawArtificialHorizon(ctx, width / 2, dialY, 41, plane);
  drawDial(ctx, width - 186, dialY, 37, 'HEADING', `${String(headingDegrees(plane.heading)).padStart(3, '0')}°`, compassPoint(headingDegrees(plane.heading)), headingDegrees(plane.heading) / 360, time);
  drawDial(ctx, width - 84, dialY, 37, 'VERT SPEED', `${plane.verticalSpeed >= 0 ? '+' : ''}${Math.round(plane.verticalSpeed * 60)}`, 'fpm', 0.5 + plane.verticalSpeed / 60, time);

  drawBars(ctx, plane, width, y0);
}

function drawDial(ctx, x, y, r, label, value, unit, frac, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = PALETTE.gaugeFace;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a4a58';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Lit tick marks.
  ctx.strokeStyle = 'rgba(255, 233, 168, 0.85)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 10; i += 1) {
    const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8));
    ctx.lineTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3));
    ctx.stroke();
  }
  // Needle.
  const needleAngle = Math.PI * 0.75 + Math.max(0, Math.min(1, frac)) * Math.PI * 1.5;
  ctx.strokeStyle = PALETTE.needle;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(needleAngle) * (r - 10), Math.sin(needleAngle) * (r - 10));
  ctx.stroke();
  ctx.fillStyle = PALETTE.gaugeFace;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  // Digital readout under the needle, lit amber; label sits inside the panel.
  ctx.fillStyle = PALETTE.gaugeLit;
  ctx.font = '700 14px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, 0, 9);
  ctx.fillStyle = '#9fb2c0';
  ctx.font = '600 9px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${label} · ${unit}`, 0, r + 12);
  ctx.restore();
  void time;
}

function drawArtificialHorizon(ctx, x, y, r, plane) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#7fb3d9';
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.save();
  ctx.rotate(plane.roll);
  ctx.translate(0, plane.pitch * r * 1.4);
  ctx.fillStyle = '#7a6a5e';
  ctx.fillRect(-r * 2, 0, r * 4, r * 2);
  ctx.fillStyle = '#f7c873';
  ctx.fillRect(-r * 2, -2, r * 4, 4);
  ctx.restore();
  // Fixed wings symbol.
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-r + 6, 0);
  ctx.lineTo(-8, 0);
  ctx.moveTo(8, 0);
  ctx.lineTo(r - 6, 0);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#3a4a58';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#9fb2c0';
  ctx.font = '600 9px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ATTITUDE', x, y + r + 12);
}

function drawBars(ctx, plane, width, y0) {
  const barW = 150;
  const x = width / 2 - 320;
  drawBar(ctx, x, y0 + 18, barW, 'THROTTLE', plane.throttle, '#ffb347');
  drawBar(ctx, x, y0 + 46, barW, 'FUEL', plane.fuel / 100, plane.fuel < 20 ? '#ff5a3c' : '#7fb069');
  drawBar(ctx, x, y0 + 74, barW, 'DAMAGE', plane.damage / 100, plane.damage > 60 ? '#ff5a3c' : '#e8c98a');
  const x2 = width / 2 + 170;
  drawBar(ctx, x2, y0 + 18, barW, 'RINGS', plane.rings.length ? plane.ringsPassed / plane.rings.length : 1, '#ffe9a8');
  ctx.fillStyle = '#9fb2c0';
  ctx.font = '600 11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(plane.state === 'flying' ? 'SHIFT throttle up · CTRL down · SPACE brake' : 'R — fly again', x2, y0 + 62);
  ctx.fillText('W/S pitch · A/D bank · mouse steers · wheel throttle', x2, y0 + 82);
}

function drawBar(ctx, x, y, w, label, frac, colour) {
  ctx.fillStyle = '#9fb2c0';
  ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.fillStyle = '#222d38';
  ctx.fillRect(x + 62, y - 6, w, 12);
  ctx.fillStyle = colour;
  ctx.fillRect(x + 62, y - 6, w * Math.max(0, Math.min(1, frac)), 12);
  ctx.strokeStyle = '#3a4a58';
  ctx.strokeRect(x + 62, y - 6, w, 12);
}

function drawMissionBanner(ctx, plane, width, time) {
  const ring = nextRing(plane);
  const remaining = plane.rings.filter((r) => !r.passed).length;
  let text;
  if (plane.state === 'crashed') text = 'CRASHED — press R to fly again';
  else if (plane.state === 'complete') text = 'MISSION COMPLETE — press R for another sortie';
  else if (plane.state === 'landed') text = 'LANDED — press R to fly again';
  else if (remaining > 0 && ring) text = `NEXT RING ${plane.ringsPassed + 1}/${plane.rings.length} — ${Math.round(ringDistance(plane, ring))} units ahead`;
  else text = 'ALL RINGS CLEAR — LAND ON CORAL AIRSTRIP (centreline, slow, level)';
  ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 36;
  const x = (width - w) / 2;
  const y = 96;
  const pulse = plane.state === 'flying' && remaining === 0 ? 0.75 + Math.sin(time * 4) * 0.25 : 0.8;
  ctx.fillStyle = `rgba(10, 16, 22, ${pulse})`;
  ctx.fillRect(x, y, w, 30);
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.7)';
  ctx.strokeRect(x, y, w, 30);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(text, width / 2, y + 15);
}

function ringDistance(plane, ring) {
  const dx = ring.x - plane.x;
  const dz = ring.z - plane.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function drawRingGuidance(ctx, plane, width, height) {
  const ring = nextRing(plane);
  if (!ring || plane.state !== 'flying') return;
  // Bearing arrow at screen centre-top of the aircraft: points toward the ring.
  const dx = ring.x - plane.x;
  const dz = ring.z - plane.z;
  let bearing = Math.atan2(dx, dz) - plane.heading;
  while (bearing > Math.PI) bearing -= Math.PI * 2;
  while (bearing < -Math.PI) bearing += Math.PI * 2;
  const cx = width / 2;
  const cy = height * 0.42;
  const arrowAngle = bearing;
  ctx.save();
  ctx.translate(cx, cy - 120);
  ctx.rotate(arrowAngle);
  ctx.fillStyle = 'rgba(255, 179, 71, 0.95)';
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(10, 8);
  ctx.lineTo(0, 2);
  ctx.lineTo(-10, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Off-screen indicator: if the ring is far behind, say so plainly.
  if (Math.abs(bearing) > 1.2) {
    ctx.fillStyle = '#ffb347';
    ctx.font = '700 14px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bearing > 0 ? 'RING TO YOUR RIGHT — TURN RIGHT' : 'RING TO YOUR LEFT — TURN LEFT', cx, cy - 150);
  }
}

function drawCentreMessage(ctx, plane, width, height) {
  if (!plane.stateMessage || plane.messageTimer <= 0) return;
  const alpha = Math.min(1, plane.messageTimer);
  ctx.font = '800 30px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = `rgba(255, 233, 168, ${alpha})`;
  ctx.strokeStyle = `rgba(10, 16, 22, ${alpha * 0.8})`;
  ctx.lineWidth = 5;
  const y = height * 0.3;
  ctx.strokeText(plane.stateMessage, width / 2, y);
  ctx.fillText(plane.stateMessage, width / 2, y);
  if (plane.speed < 26 && plane.state === 'flying') {
    ctx.font = '700 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(255, 90, 60, ${alpha})`;
    ctx.fillText('STALL — NOSE DOWN, THROTTLE UP', width / 2, y + 34);
  }
  void RUNWAY;
}
