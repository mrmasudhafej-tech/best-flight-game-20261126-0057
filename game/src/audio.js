// Sound, all synthesised with WebAudio: no audio files, no network.
// Engine hum follows throttle, wind follows speed, and rings, landings and
// crashes each get one short original motif. Nothing starts until the pilot's
// first gesture, as browsers require.
export function createAudio() {
  const audio = {
    ctx: null,
    engineOsc: null,
    engineGain: null,
    windGain: null,
    muted: false,
    started: false,
  };
  return audio;
}

export function startAudio(audio) {
  if (audio.started || audio.ctx) return;
  try {
    const Ctx = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    audio.ctx = ctx;
    audio.started = true;

    // Engine: two detuned saws through a low-pass, like a small prop plane.
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscB.type = 'sawtooth';
    oscA.frequency.value = 68;
    oscB.frequency.value = 69.5;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    oscA.start();
    oscB.start();
    audio.engineOsc = oscA;
    audio.engineOscB = oscB;
    audio.engineGain = gain;

    // Wind: looped filtered noise whose level follows airspeed.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 480;
    const windGain = ctx.createGain();
    windGain.gain.value = 0;
    noise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(ctx.destination);
    noise.start();
    audio.windGain = windGain;
  } catch {
    // Sound is garnish: a failed AudioContext never stops the game.
    audio.ctx = null;
  }
}

export function updateAudio(audio, plane) {
  if (!audio.ctx || audio.muted) return;
  const t = audio.ctx.currentTime;
  const throttle = plane.state === 'flying' ? plane.throttle : 0.1;
  const fuelOut = plane.fuel <= 0;
  const wobble = fuelOut ? Math.sin(t * 22) * 9 : Math.sin(t * 7) * 1.5;
  audio.engineOsc.frequency.setTargetAtTime(58 + throttle * 52 + wobble, t, 0.08);
  audio.engineOscB.frequency.setTargetAtTime(59.5 + throttle * 52 + wobble, t, 0.08);
  audio.engineGain.gain.setTargetAtTime(0.02 + throttle * 0.05, t, 0.1);
  audio.windGain.gain.setTargetAtTime(Math.min(0.09, plane.speed * 0.0009), t, 0.15);
}

function blip(audio, freq, when, duration, volume, type = 'sine') {
  if (!audio.ctx || audio.muted) return;
  const ctx = audio.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime + when);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + when);
  osc.stop(ctx.currentTime + when + duration + 0.05);
}

export function playRingChime(audio) {
  blip(audio, 660, 0, 0.35, 0.16);
  blip(audio, 880, 0.09, 0.4, 0.16);
  blip(audio, 1320, 0.18, 0.5, 0.1);
}

export function playLandingChime(audio) {
  blip(audio, 523, 0, 0.3, 0.14);
  blip(audio, 659, 0.12, 0.3, 0.14);
  blip(audio, 784, 0.24, 0.5, 0.14);
}

export function playCrashThud(audio) {
  if (!audio.ctx || audio.muted) return;
  const ctx = audio.ctx;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.3;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 220;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

export function toggleMute(audio) {
  audio.muted = !audio.muted;
  if (audio.ctx) {
    const t = audio.ctx.currentTime;
    if (audio.engineGain) audio.engineGain.gain.setTargetAtTime(audio.muted ? 0 : 0.05, t, 0.05);
    if (audio.windGain) audio.windGain.gain.setTargetAtTime(0, t, 0.05);
  }
  return audio.muted;
}
