// Input: keyboard and mouse, merged into one steer shape for the flight model.
// Mouse steering is gentle and recentres: move the mouse to steer, keys always
// win while held. Clicks land on title-screen buttons; the wheel trims throttle.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseActive: false,
    mouseSteer: false,
    wheelDelta: 0,
    clicks: [],
    paused: false,
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    input.keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouseActive = false;
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = (event.clientX - rect.left) / rect.width;
    input.mouseY = (event.clientY - rect.top) / rect.height;
    input.mouseActive = true;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clicks.push({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      button: event.button,
    });
    input.mouseSteer = true;
  });
  window.addEventListener('mouseup', () => {
    input.mouseSteer = false;
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    input.wheelDelta += event.deltaY;
  }, { passive: false });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  return input;
}

export function readSteer(input, dt) {
  const keys = input.keys;
  let pitchInput = 0;
  let rollInput = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) pitchInput += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) pitchInput -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) rollInput -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) rollInput += 1;

  // Mouse: offset from screen centre steers, dead zone in the middle.
  if (input.mouseActive && pitchInput === 0 && rollInput === 0) {
    const dx = input.mouseX - 0.5;
    const dy = input.mouseY - 0.5;
    if (Math.abs(dx) > 0.06) rollInput = clampSteer(dx * 3);
    if (Math.abs(dy) > 0.06) pitchInput = clampSteer(-dy * 3);
  }

  let throttleInput = 0;
  if (keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyR')) throttleInput += 1;
  if (keys.has('ControlLeft') || keys.has('KeyF')) throttleInput -= 1;
  if (input.wheelDelta !== 0) {
    throttleInput += input.wheelDelta > 0 ? -0.9 : 0.9;
    input.wheelDelta = 0;
  }
  if (keys.has('Space')) throttleInput -= 0.6; // airbrake / flaps

  return { pitchInput: clampSteer(pitchInput), rollInput: clampSteer(rollInput), throttleInput };
}

function clampSteer(value) {
  return Math.max(-1, Math.min(1, value));
}

// One-shot key presses: consumed by the game loop so menus react once.
export function consumeKey(input, code) {
  if (input.keys.has(code)) {
    input.keys.delete(code);
    return true;
  }
  return false;
}

export function consumeClicks(input) {
  const clicks = input.clicks;
  input.clicks = [];
  return clicks;
}
