// Missions: what counts as done, what the pilot is told, and the title screen
// that lets a pilot pick a sortie with keyboard or mouse. One mission at a
// time; finishing one invites the next.
import { MISSIONS } from './config.js';
import { createPlane } from './aircraft.js';

export function missionBlurb(missionId) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  return mission ? mission.blurb : '';
}

export function missionGoal(missionId) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  return mission ? mission.goal : '';
}

export function startMission(missionId) {
  return createPlane(missionId);
}

export function nextMissionId(missionId) {
  const index = MISSIONS.findIndex((m) => m.id === missionId);
  return MISSIONS[(index + 1) % MISSIONS.length].id;
}

// Title-screen buttons, in normalised screen coordinates, for mouse clicks.
export function titleButtons(width, height) {
  const buttons = [];
  const bw = 440;
  const bh = 52;
  MISSIONS.forEach((mission, i) => {
    const x = (width - bw) / 2;
    const y = height * 0.52 + i * 66;
    buttons.push({ id: mission.id, name: mission.name, blurb: mission.blurb, x, y, w: bw, h: bh });
  });
  return buttons;
}

export function drawTitleScreen(ctx, width, height, selectedIndex, time) {
  // A painted backdrop: the same sunset gradient the game flies in.
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1d3a5f');
  gradient.addColorStop(0.55, '#e8824a');
  gradient.addColorStop(1, '#f7c873');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#173e52';
  ctx.fillRect(0, height * 0.62, width, height * 0.38);
  // Ridge silhouette.
  ctx.fillStyle = '#3c4a3a';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.62);
  for (let x = 0; x <= width; x += 40) {
    ctx.lineTo(x, height * 0.62 - 40 - Math.sin(x * 0.01 + 1) * 34);
  }
  ctx.lineTo(width, height * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff3c4';
  ctx.font = '800 56px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('EMBER ISLES', width / 2, height * 0.2);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '600 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Sky Courier — fly the Kestrel over the sunset archipelago', width / 2, height * 0.29);
  ctx.fillStyle = '#f2ede2';
  ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Keyboard + mouse · W/S pitch · A/D bank · SHIFT throttle · SPACE brake · wheel throttle', width / 2, height * 0.36);
  ctx.fillText('Thread the ember rings, mind your fuel, and land gently on Coral Airstrip.', width / 2, height * 0.41);

  const buttons = titleButtons(width, height);
  buttons.forEach((button, i) => {
    const selected = i === selectedIndex;
    ctx.fillStyle = selected ? 'rgba(255, 233, 168, 0.95)' : 'rgba(10, 16, 22, 0.72)';
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.strokeStyle = selected ? '#ff5a3c' : 'rgba(255, 233, 168, 0.6)';
    ctx.lineWidth = selected ? 3 : 1;
    ctx.strokeRect(button.x, button.y, button.w, button.h);
    ctx.fillStyle = selected ? '#10151c' : '#ffe9a8';
    ctx.font = '700 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${i + 1}. ${button.name}`, width / 2, button.y + 18);
    ctx.fillStyle = selected ? '#3a2a1a' : '#c8d4dc';
    ctx.font = '400 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(button.blurb, width / 2, button.y + 38);
  });

  const hintPulse = 0.6 + Math.sin(time * 2.5) * 0.4;
  ctx.fillStyle = `rgba(255, 243, 196, ${hintPulse})`;
  ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Click a sortie, or press 1, 2 or 3 — then Enter to fly', width / 2, height * 0.52 + MISSIONS.length * 66 + 18);
}

export function titleClick(button, x, y) {
  return x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h;
}
